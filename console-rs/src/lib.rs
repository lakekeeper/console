#![warn(
    missing_debug_implementations,
    rust_2018_idioms,
    unreachable_pub,
    clippy::pedantic
)]
#![forbid(unsafe_code)]

use std::io::Read;

use flate2::read::GzDecoder;
use rust_embed::Embed;

mod cache;

pub use cache::{CacheItem, FileCache};

#[derive(Embed)]
#[folder = "$OUT_DIR/node/dist"]
struct LakekeeperConsole;

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
    pub idp_token_type: IdpTokenType,
    pub enable_authentication: bool,
    pub enable_permissions: bool,
    /// When `true`, the console loads the Formbricks SDK and may show optional
    /// in-app surveys. Disable to opt out entirely (no third-party requests).
    pub enable_user_surveys: bool,
    pub app_lakekeeper_url: Option<String>,
    pub base_url_prefix: Option<String>,
}

impl Default for LakekeeperConsoleConfig {
    fn default() -> Self {
        Self {
            idp_authority: String::new(),
            idp_client_id: "/lakekeeper".to_string(),
            idp_redirect_path: "/callback".to_string(),
            idp_scope: "openid profile email".to_string(),
            idp_resource: String::new(),
            idp_post_logout_redirect_path: "/logout".to_string(),
            idp_token_type: IdpTokenType::AccessToken,
            enable_authentication: false,
            enable_permissions: false,
            enable_user_surveys: true,
            app_lakekeeper_url: None,
            base_url_prefix: None,
        }
    }
}

/// Look up a file in the embed. Large assets are stored gzipped under
/// `<path>.gz` (see `build.rs`); this helper decompresses transparently so
/// callers see the original bytes.
fn embedded(file_path: &str) -> Option<rust_embed::EmbeddedFile> {
    if let Some(file) = LakekeeperConsole::get(file_path) {
        return Some(file);
    }
    let mut file = LakekeeperConsole::get(&format!("{file_path}.gz"))?;
    let mut decoded = Vec::new();
    GzDecoder::new(&file.data[..])
        .read_to_end(&mut decoded)
        .expect("embedded gzip file is corrupt");
    file.data = decoded.into();
    Some(file)
}

/// List file paths visible to consumers — names of gzipped entries are
/// reported with the original (decompressed) extension so iteration matches
/// what `get_file` accepts.
#[cfg(test)]
fn embedded_iter() -> impl Iterator<Item = std::borrow::Cow<'static, str>> {
    LakekeeperConsole::iter().map(|name| {
        if let Some(stripped) = name.strip_suffix(".gz") {
            std::borrow::Cow::Owned(stripped.to_string())
        } else {
            name
        }
    })
}

/// Retrieves a file from the Lakekeeper Console embed.
///
/// # Panics
/// If the file ends with `.js` and the data cannot be converted to a UTF-8 string.
#[must_use]
pub fn get_file(
    file_path: &str,
    config: &LakekeeperConsoleConfig,
) -> Option<rust_embed::EmbeddedFile> {
    let LakekeeperConsoleConfig {
        idp_authority,
        idp_client_id,
        idp_redirect_path,
        idp_scope,
        idp_resource,
        idp_post_logout_redirect_path,
        idp_token_type,
        enable_authentication,
        enable_permissions,
        enable_user_surveys,
        app_lakekeeper_url: app_iceberg_catalog_url,
        base_url_prefix,
    } = config;

    embedded(file_path).map(|file| {
        if std::path::Path::new(file_path)
            .extension()
            .is_some_and(|ext| {
                ext.eq_ignore_ascii_case("js")
                    || ext.eq_ignore_ascii_case("html")
                    || ext.eq_ignore_ascii_case("css")
            })
        {
            let mut file = file.clone();
            let data = std::str::from_utf8(&file.data).unwrap();
            let prefix = base_url_prefix
                .as_deref()
                .unwrap_or_default()
                .trim_matches('/');

            let token_type_str = match idp_token_type {
                IdpTokenType::AccessToken => "access_token",
                IdpTokenType::IdToken => "id_token",
            };

            let data = data
                .replace("VITE_IDP_AUTHORITY_PLACEHOLDER", idp_authority)
                .replace("VITE_IDP_CLIENT_ID_PLACEHOLDER", idp_client_id)
                .replace("VITE_IDP_REDIRECT_PATH_PLACEHOLDER", idp_redirect_path)
                .replace("VITE_IDP_SCOPE_PLACEHOLDER", idp_scope)
                .replace("VITE_IDP_RESOURCE_PLACEHOLDER", idp_resource)
                .replace(
                    "VITE_IDP_POST_LOGOUT_REDIRECT_PATH_PLACEHOLDER",
                    idp_post_logout_redirect_path,
                )
                .replace(
                    "VITE_ENABLE_AUTHENTICATION_PLACEHOLDER",
                    &enable_authentication.to_string(),
                )
                .replace(
                    "VITE_ENABLE_PERMISSIONS_PLACEHOLDER",
                    &enable_permissions.to_string(),
                )
                .replace(
                    "VITE_ENABLE_USER_SURVEYS_PLACEHOLDER",
                    &enable_user_surveys.to_string(),
                )
                .replace("VITE_IDP_TOKEN_TYPE_PLACEHOLDER", token_type_str);

            let data = if prefix.is_empty() {
                data.replace("/VITE_BASE_URL_PREFIX_PLACEHOLDER/", "/")
                    .replace("VITE_BASE_URL_PREFIX_PLACEHOLDER", "")
            } else {
                data.replace("/VITE_BASE_URL_PREFIX_PLACEHOLDER", &format!("/{prefix}"))
                    .replace("VITE_BASE_URL_PREFIX_PLACEHOLDER", &format!("/{prefix}"))
            };

            let data = data.replace(
                "VITE_APP_ICEBERG_CATALOG_URL_PLACEHOLDER",
                app_iceberg_catalog_url.as_deref().unwrap_or(""),
            );

            file.data = data.into_bytes().into();
            file
        } else {
            file
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_for_config() {
        let config = LakekeeperConsoleConfig::default();
        assert_eq!(config.idp_redirect_path, "/callback");
        assert_eq!(config.idp_scope, "openid profile email");
        assert_eq!(config.idp_post_logout_redirect_path, "/logout");
    }

    #[test]
    fn test_index_available() {
        let index: rust_embed::EmbeddedFile = embedded("index.html").unwrap();
        assert!(!index.data.is_empty());
    }

    #[test]
    fn test_get_all_files() {
        let config = LakekeeperConsoleConfig {
            idp_authority: "https://idp.example.com".to_string(),
            idp_client_id: "client_id_test".to_string(),
            idp_redirect_path: "/callback-test".to_string(),
            idp_scope: "openid profile email test".to_string(),
            idp_resource: "foo-bar-test".to_string(),
            idp_post_logout_redirect_path: "/logout-test".to_string(),
            idp_token_type: IdpTokenType::AccessToken,
            enable_authentication: true,
            enable_permissions: false,
            enable_user_surveys: true,
            app_lakekeeper_url: Some("https://catalog.example.com".to_string()),
            base_url_prefix: Some("/test-prefix".to_string()),
        };
        let files = embedded_iter().collect::<Vec<_>>();

        let config_values = [
            &config.idp_authority,
            &config.idp_client_id,
            &config.idp_redirect_path,
            &config.idp_scope,
            &config.idp_resource,
            &config.idp_post_logout_redirect_path,
            config.app_lakekeeper_url.as_ref().unwrap(),
        ];

        let mut found_values = vec![false; config_values.len()];

        for file in &files {
            let templated_file = get_file(file.as_ref(), &config.clone()).unwrap();
            if let Ok(file_content) = std::str::from_utf8(&templated_file.data) {
                assert!(
                    !file_content.contains("VITE_"),
                    "File {} still contains VITE_ variables",
                    file
                );

                for (i, value) in config_values.iter().enumerate() {
                    if file_content.contains(*value) {
                        found_values[i] = true;
                    }
                }
                assert!(!file_content.contains("//ui"));
            }
        }

        for (i, value) in found_values.iter().enumerate() {
            assert!(
                *value,
                "Value '{}' from LakekeeperConsoleConfig not found in any .js file",
                config_values[i]
            );
        }
    }
}
