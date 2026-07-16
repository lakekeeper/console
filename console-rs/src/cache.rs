use mime_guess::{from_path, Mime};
use moka::sync::Cache;
use std::borrow::Cow;
use std::str::FromStr;
use std::sync::{Arc, LazyLock};

use crate::LakekeeperConsoleConfig;

// Mime type constants
static MIME_TYPE_ICON: LazyLock<Mime> = LazyLock::new(|| Mime::from_str("image/x-icon").unwrap());

#[derive(Debug, Clone)]
pub enum CacheItem {
    NotFound,
    Found {
        mime: Mime,
        data: Cow<'static, [u8]>,
        /// Weak `ETag` opaque tag (bare hex, without the `W/"…"` wrapper) over
        /// the rendered `data`, computed once when the entry is cached so
        /// revalidation never re-hashes the (potentially multi-MB) body. Serve
        /// it as `W/"{etag}"`.
        etag: String,
    },
}

/// Weak `ETag` opaque tag (bare hex) over the rendered response bytes. Weak
/// because a transport layer may re-encode the body (e.g. compression), which
/// would break a strong byte-for-byte validator. The bytes are config-templated
/// per cache entry, so the tag distinguishes the same filename served under
/// different configs.
///
/// Uses `xxh3` (as the catalog does for `loadTable` ETags) rather than the std
/// `DefaultHasher`: it is ~4x faster on the multi-MB `DuckDB` WASM and, unlike
/// SipHash, is a fixed algorithm — so the tag stays stable across Rust releases
/// and doesn't spuriously bust caches on a toolchain bump.
fn weak_etag_tag(data: &[u8]) -> String {
    format!("{:x}", xxhash_rust::xxh3::xxh3_64(data))
}

/// File cache manager for static assets that handles configuration
#[derive(Debug, Clone)]
pub struct FileCache {
    // Cache path and forwarded prefix to content
    cache: Cache<(String, Option<String>, Option<String>), CacheItem>,
    // The configuration used to load files
    config: Arc<LakekeeperConsoleConfig>,
}

impl FileCache {
    /// Create a new file cache with the given configuration
    #[must_use]
    pub fn new(config: LakekeeperConsoleConfig) -> Self {
        Self::with_capacity(config, 1000)
    }

    /// Create a new file cache with specified capacity and configuration
    #[must_use]
    pub fn with_capacity(config: LakekeeperConsoleConfig, capacity: u64) -> Self {
        Self {
            cache: Cache::new(capacity),
            config: Arc::new(config),
        }
    }

    /// Get the current configuration
    #[must_use]
    pub fn config(&self) -> &LakekeeperConsoleConfig {
        &self.config
    }

    /// Clear the entire cache
    pub fn clear(&self) {
        self.cache.invalidate_all();
    }

    /// Gets a file from the cache or loads it if not cached
    ///
    /// # Arguments
    /// * `file_path` - The path of the file to get
    /// * `forwarded_prefix` - Optional URL prefix for proxied deployments. Sets the corresponding config value if the config is `None`
    ///
    /// # Returns
    /// A [`CacheItem`] containing the file content and mime type or `NotFound`
    pub fn get_file(
        &self,
        file_path: &str,
        forwarded_prefix: Option<&str>,
        lakekeeper_url: Option<&str>,
    ) -> CacheItem {
        let cache_key = (
            file_path.to_string(),
            forwarded_prefix.map(String::from),
            lakekeeper_url.map(String::from),
        );

        // Try to get from cache first
        if let Some(cache_item) = self.cache.get(&cache_key) {
            return cache_item;
        }

        // Not in cache, need to load it
        let mime = if file_path.ends_with("favicon.ico") {
            MIME_TYPE_ICON.clone()
        } else {
            from_path(file_path).first_or_octet_stream()
        };

        let file_path_owned = file_path.to_string();

        // Create effective config with forwarded prefix if needed
        let mut effective_config = (*self.config).clone();

        if effective_config.base_url_prefix.is_none() && forwarded_prefix.is_some() {
            effective_config.base_url_prefix = forwarded_prefix.map(String::from);
        }

        if effective_config.app_lakekeeper_url.is_none() && lakekeeper_url.is_some() {
            effective_config.app_lakekeeper_url = lakekeeper_url.map(String::from);
        }

        // Get the file content
        let content = crate::get_file(&file_path_owned, &effective_config);

        let cache_item = match content {
            Some(content) => {
                let etag = weak_etag_tag(&content.data);
                CacheItem::Found {
                    mime,
                    data: content.data,
                    etag,
                }
            }
            None => CacheItem::NotFound,
        };

        // Store in cache and return
        self.cache.insert(cache_key, cache_item.clone());
        cache_item
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn etag_of(item: &CacheItem) -> String {
        match item {
            CacheItem::Found { etag, .. } => etag.clone(),
            CacheItem::NotFound => panic!("expected Found, got NotFound"),
        }
    }

    #[test]
    fn test_found_carries_stable_nonempty_etag() {
        let cache = FileCache::new(LakekeeperConsoleConfig::default());
        let a = cache.get_file("index.html", None, None);
        let b = cache.get_file("index.html", None, None);
        assert!(!etag_of(&a).is_empty());
        assert_eq!(etag_of(&a), etag_of(&b), "etag must be stable per entry");
    }

    #[test]
    fn test_etag_varies_with_templated_prefix() {
        // `index.html` embeds the base-URL prefix, so the same filename served
        // under a different forwarded prefix must get a distinct etag.
        let cache = FileCache::new(LakekeeperConsoleConfig::default());
        let root = cache.get_file("index.html", None, None);
        let prefixed = cache.get_file("index.html", Some("/lakekeeper"), None);
        assert_ne!(etag_of(&root), etag_of(&prefixed));
    }
}
