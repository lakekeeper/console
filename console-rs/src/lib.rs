#![warn(
    missing_debug_implementations,
    rust_2018_idioms,
    unreachable_pub,
    clippy::pedantic
)]
#![forbid(unsafe_code)]

//! The Lakekeeper console, embedded for serving by Lakekeeper.
//!
//! [`Console`] serves every built file unchanged, so no response body depends
//! on the request. The only rendered file is `index.html`: it receives the
//! process's [`LakekeeperConsoleConfig`] once, as a JSON block, and per request
//! the [`BasePrefix`] the console is mounted under, as `<base href>`.

use std::{borrow::Cow, io::Read};

use bytes::Bytes;
use flate2::read::GzDecoder;
use mime_guess::Mime;
use rust_embed::Embed;

mod prefix;

pub use prefix::{BasePrefix, InvalidBasePrefix};

#[derive(Embed)]
#[folder = "$OUT_DIR/node/dist"]
struct LakekeeperConsole;

/// Slots that the console build writes into `index.html`.
const BASE_HREF_SLOT: &str = "LAKEKEEPER_BASE_HREF_PLACEHOLDER";
const CONFIG_SLOT: &str = "LAKEKEEPER_CONFIG_PLACEHOLDER";
const INDEX_HTML: &str = "index.html";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IdpTokenType {
    AccessToken,
    IdToken,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LakekeeperConsoleConfig {
    pub idp_authority: String,
    pub idp_client_id: String,
    pub idp_redirect_path: String,
    pub idp_scope: String,
    pub idp_resource: String,
    pub idp_post_logout_redirect_path: String,
    /// Absolute URL sent as `post_logout_redirect_uri` on logout, overriding the
    /// value derived from `idp_post_logout_redirect_path`. Empty = derive as before.
    pub idp_post_logout_redirect_url: String,
    /// When `true`, the frontend omits `post_logout_redirect_uri` entirely
    /// (optional per the OIDC RFC) for IdPs that reject non-registered URLs.
    pub idp_disable_post_logout_redirect: bool,
    pub idp_token_type: IdpTokenType,
    pub enable_authentication: bool,
    pub enable_permissions: bool,
    /// When `true`, the console loads the Formbricks SDK and may show optional
    /// in-app surveys. Disable to opt out entirely (no third-party requests).
    pub enable_user_surveys: bool,
    /// URL of the Lakekeeper catalog the console calls. `None`: the origin and
    /// path prefix the browser loaded the console from.
    pub app_lakekeeper_url: Option<String>,
}

impl Default for LakekeeperConsoleConfig {
    fn default() -> Self {
        Self {
            idp_authority: String::new(),
            idp_client_id: "lakekeeper".to_string(),
            idp_redirect_path: "/callback".to_string(),
            idp_scope: "openid profile email".to_string(),
            idp_resource: String::new(),
            idp_post_logout_redirect_path: "/logout".to_string(),
            idp_post_logout_redirect_url: String::new(),
            idp_disable_post_logout_redirect: false,
            idp_token_type: IdpTokenType::AccessToken,
            enable_authentication: false,
            enable_permissions: false,
            enable_user_surveys: true,
            app_lakekeeper_url: None,
        }
    }
}

/// `index.html` for one request.
#[derive(Debug, Clone)]
pub struct IndexHtml {
    pub body: String,
    /// Opaque tag over `body`; serve it as a weak `ETag` (`W/"{etag}"`).
    pub etag: String,
}

/// A built file, unchanged.
#[derive(Debug, Clone)]
pub struct Asset {
    pub mime: Mime,
    pub body: Bytes,
    pub encoding: AssetEncoding,
    /// Opaque tag over `body`; serve it as a weak `ETag` (`W/"{etag}"`).
    pub etag: String,
}

/// How an [`Asset`]'s body is stored and sent.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AssetEncoding {
    /// Stored and sent uncompressed.
    Plain,
    /// Stored gzip-compressed and sent as stored: send `Content-Encoding: gzip`.
    Gzip,
    /// Stored gzip-compressed and decompressed for a client that does not
    /// accept gzip. Compressing it again would repeat the work per request.
    Decompressed,
}

/// Serves the embedded console build. See the crate documentation.
#[derive(Debug)]
pub struct Console {
    /// `index.html` up to and after the base href slot, with the config filled in.
    index_head: String,
    index_tail: String,
    /// Plain bytes of files stored gzip-compressed, for clients that do not
    /// accept gzip. Keyed by file content, so every spelling of a path shares
    /// one copy and the cache is bounded by the files in the build.
    decoded: moka::sync::Cache<[u8; 32], Bytes>,
}

impl Console {
    /// # Panics
    /// If the embedded `index.html` does not carry each slot exactly once, which
    /// means the console was built without its Vite config.
    #[must_use]
    pub fn new(config: &LakekeeperConsoleConfig) -> Self {
        let template = LakekeeperConsole::get(INDEX_HTML).expect("index.html is embedded");
        let template = std::str::from_utf8(&template.data).expect("index.html is UTF-8");
        assert_eq!(
            template.matches(BASE_HREF_SLOT).count(),
            1,
            "index.html must contain {BASE_HREF_SLOT} exactly once"
        );
        assert_eq!(
            template.matches(CONFIG_SLOT).count(),
            1,
            "index.html must contain {CONFIG_SLOT} exactly once"
        );
        // Split before inserting the config, so a config value cannot hit the slot.
        let (head, tail) = template
            .split_once(BASE_HREF_SLOT)
            .expect("slot counted above");
        let config_json = config_json(config);
        Self {
            index_head: head.replacen(CONFIG_SLOT, &config_json, 1),
            index_tail: tail.replacen(CONFIG_SLOT, &config_json, 1),
            decoded: moka::sync::Cache::builder().build(),
        }
    }

    /// `index.html` with the console mounted at `prefix`.
    #[must_use]
    pub fn index_html(&self, prefix: &BasePrefix) -> IndexHtml {
        let body = format!("{}{}{}", self.index_head, prefix.ui_path(), self.index_tail);
        let etag = format!("{:x}", xxhash_rust::xxh3::xxh3_64(body.as_bytes()));
        IndexHtml { body, etag }
    }

    /// The built file at `path` (relative to the console root, e.g.
    /// `assets/index-abc123.js`). `None` if there is none; `index.html` is
    /// served by [`Console::index_html`] only.
    #[must_use]
    pub fn asset(&self, path: &str, accept_gzip: bool) -> Option<Asset> {
        if path == INDEX_HTML {
            return None;
        }
        let mime = mime_for(path);
        if let Some(file) = LakekeeperConsole::get(path) {
            return Some(Asset {
                mime,
                etag: etag(&file.metadata),
                body: bytes_of(file.data),
                encoding: AssetEncoding::Plain,
            });
        }
        // Files of 64 KiB and more are embedded gzip-compressed.
        let file = LakekeeperConsole::get(&format!("{path}.gz"))?;
        let etag = etag(&file.metadata);
        Some(if accept_gzip {
            // Its own tag, so a cache never mistakes it for the plain variant.
            Asset {
                mime,
                etag: format!("{etag}-gz"),
                body: bytes_of(file.data),
                encoding: AssetEncoding::Gzip,
            }
        } else {
            Asset {
                mime,
                etag,
                body: self
                    .decoded
                    .get_with(file.metadata.sha256_hash(), || gunzip(&file.data)),
                encoding: AssetEncoding::Decompressed,
            }
        })
    }
}

/// The config as a JSON object that is safe inside a `<script>` element: `<`,
/// `>` and `&` only occur inside JSON strings, where `\u` escapes are equivalent.
fn config_json(config: &LakekeeperConsoleConfig) -> String {
    let json = serde_json::json!({
        "idpAuthority": config.idp_authority,
        "idpClientId": config.idp_client_id,
        "idpRedirectPath": config.idp_redirect_path,
        "idpScope": config.idp_scope,
        "idpResource": config.idp_resource,
        "idpPostLogoutRedirectPath": config.idp_post_logout_redirect_path,
        "idpPostLogoutRedirectUrl": config.idp_post_logout_redirect_url,
        "idpDisablePostLogoutRedirect": config.idp_disable_post_logout_redirect,
        "idpTokenType": match config.idp_token_type {
            IdpTokenType::AccessToken => "access_token",
            IdpTokenType::IdToken => "id_token",
        },
        "enableAuthentication": config.enable_authentication,
        "enablePermissions": config.enable_permissions,
        "enableUserSurveys": config.enable_user_surveys,
        "lakekeeperUrl": config.app_lakekeeper_url,
    })
    .to_string();
    json.replace('<', "\\u003c")
        .replace('>', "\\u003e")
        .replace('&', "\\u0026")
}

fn mime_for(path: &str) -> Mime {
    if std::path::Path::new(path)
        .extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case("ico"))
    {
        "image/x-icon".parse().expect("valid mime type")
    } else {
        mime_guess::from_path(path).first_or_octet_stream()
    }
}

/// Hex of the first 16 bytes of the file's SHA-256 from rust-embed.
fn etag(metadata: &rust_embed::Metadata) -> String {
    use std::fmt::Write;
    metadata.sha256_hash()[..16]
        .iter()
        .fold(String::with_capacity(32), |mut hex, byte| {
            let _ = write!(hex, "{byte:02x}");
            hex
        })
}

/// Release builds embed files as `&'static` data, which `Bytes` wraps without a copy.
fn bytes_of(data: Cow<'static, [u8]>) -> Bytes {
    match data {
        Cow::Borrowed(data) => Bytes::from_static(data),
        Cow::Owned(data) => Bytes::from(data),
    }
}

fn gunzip(data: &[u8]) -> Bytes {
    let mut decoded = Vec::new();
    GzDecoder::new(data)
        .read_to_end(&mut decoded)
        .expect("embedded gzip file is valid");
    decoded.into()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn index_config_block(body: &str) -> serde_json::Value {
        let start_tag = r#"<script type="application/json" id="lakekeeper-config">"#;
        let start = body.find(start_tag).expect("config block present") + start_tag.len();
        let len = body[start..]
            .find("</script>")
            .expect("config block closed");
        serde_json::from_str(&body[start..start + len]).expect("config block is JSON")
    }

    #[test]
    fn test_default_for_config() {
        let config = LakekeeperConsoleConfig::default();
        assert_eq!(config.idp_redirect_path, "/callback");
        assert_eq!(config.idp_scope, "openid profile email");
        assert_eq!(config.idp_post_logout_redirect_path, "/logout");
    }

    #[test]
    fn index_carries_config_and_base_href() {
        let config = LakekeeperConsoleConfig {
            idp_authority: "https://idp.example.com".to_string(),
            idp_client_id: "client_id_test".to_string(),
            idp_redirect_path: "/callback-test".to_string(),
            // Must not end the script element or inject markup.
            idp_scope: "openid </script><script>alert(1)</script> <!-- & -->".to_string(),
            idp_resource: "foo-bar-test".to_string(),
            idp_post_logout_redirect_path: "/logout-test".to_string(),
            idp_post_logout_redirect_url: "https://portal.example.com/login-test".to_string(),
            idp_disable_post_logout_redirect: true,
            idp_token_type: IdpTokenType::IdToken,
            enable_authentication: true,
            enable_permissions: false,
            enable_user_surveys: false,
            app_lakekeeper_url: Some("https://catalog.example.com".to_string()),
        };
        let console = Console::new(&config);
        let index = console.index_html(&BasePrefix::parse("/lakekeeper").unwrap());

        assert!(!index.body.contains("PLACEHOLDER"), "{}", index.body);
        assert!(!index.body.contains("<script>alert(1)"), "{}", index.body);
        assert!(
            index.body.contains(r#"<base href="/lakekeeper/ui/">"#),
            "{}",
            index.body
        );
        assert_eq!(
            index_config_block(&index.body),
            serde_json::json!({
                "idpAuthority": "https://idp.example.com",
                "idpClientId": "client_id_test",
                "idpRedirectPath": "/callback-test",
                "idpScope": "openid </script><script>alert(1)</script> <!-- & -->",
                "idpResource": "foo-bar-test",
                "idpPostLogoutRedirectPath": "/logout-test",
                "idpPostLogoutRedirectUrl": "https://portal.example.com/login-test",
                "idpDisablePostLogoutRedirect": true,
                "idpTokenType": "id_token",
                "enableAuthentication": true,
                "enablePermissions": false,
                "enableUserSurveys": false,
                "lakekeeperUrl": "https://catalog.example.com",
            })
        );
    }

    #[test]
    fn index_base_href_and_etag_follow_the_prefix() {
        let console = Console::new(&LakekeeperConsoleConfig::default());
        let root = console.index_html(&BasePrefix::root());
        let prefixed = console.index_html(&BasePrefix::parse("a/b").unwrap());
        assert!(root.body.contains(r#"<base href="/ui/">"#));
        assert!(prefixed.body.contains(r#"<base href="/a/b/ui/">"#));
        assert_ne!(root.etag, prefixed.etag);
        assert_eq!(root.etag, console.index_html(&BasePrefix::root()).etag);
        assert_eq!(
            index_config_block(&root.body)["lakekeeperUrl"],
            serde_json::Value::Null
        );
    }

    #[test]
    fn index_html_is_not_an_asset() {
        let console = Console::new(&LakekeeperConsoleConfig::default());
        assert!(console.asset(INDEX_HTML, true).is_none());
        assert!(console.asset("assets/does-not-exist.js", true).is_none());
    }

    /// Every built file except `index.html` is served byte for byte as built, so
    /// no response depends on the config or the request.
    #[test]
    fn assets_are_served_as_built() {
        let console = Console::new(&LakekeeperConsoleConfig::default());
        let mut gzipped = 0;
        for name in LakekeeperConsole::iter() {
            let embedded = LakekeeperConsole::get(&name).unwrap();
            let Some(path) = name.strip_suffix(".gz") else {
                if name == INDEX_HTML {
                    continue;
                }
                let asset = console.asset(&name, true).unwrap();
                assert_eq!(asset.body.as_ref(), embedded.data.as_ref(), "{name}");
                assert_eq!(asset.encoding, AssetEncoding::Plain, "{name}");
                assert_no_slot(&name, &asset.body);
                continue;
            };
            gzipped += 1;
            let encoded = console.asset(path, true).unwrap();
            let plain = console.asset(path, false).unwrap();
            assert_eq!(encoded.body.as_ref(), embedded.data.as_ref(), "{path}");
            assert_eq!(plain.body, gunzip(&embedded.data), "{path}");
            assert_eq!(encoded.encoding, AssetEncoding::Gzip, "{path}");
            assert_eq!(plain.encoding, AssetEncoding::Decompressed, "{path}");
            assert_eq!(encoded.etag, format!("{}-gz", plain.etag), "{path}");
            assert_no_slot(path, &plain.body);
        }
        assert!(gzipped > 0, "the build has files of 64 KiB and more");
    }

    fn assert_no_slot(path: &str, body: &[u8]) {
        let text = String::from_utf8_lossy(body);
        for slot in [
            BASE_HREF_SLOT,
            CONFIG_SLOT,
            "VITE_BASE_URL_PREFIX",
            "VITE_APP_ICEBERG_CATALOG_URL",
        ] {
            assert!(!text.contains(slot), "{path} contains {slot}");
        }
    }

    #[test]
    fn mime_types() {
        assert_eq!(mime_for("favicon.ico").as_ref(), "image/x-icon");
        assert_eq!(
            mime_for("duckdb/duckdb-eh.wasm").as_ref(),
            "application/wasm"
        );
        assert_eq!(
            mime_for("assets/index-abc.js").essence_str(),
            "text/javascript"
        );
    }
}
