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
    },
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

        if effective_config.base_url_prefix.is_none()
            && let Some(prefix) = forwarded_prefix
        {
            effective_config.base_url_prefix = Some(prefix.to_string());
        }

        if effective_config.app_lakekeeper_url.is_none()
            && let Some(url) = lakekeeper_url
        {
            effective_config.app_lakekeeper_url = Some(url.to_string());
        }

        // Get the file content
        let content = crate::get_file(&file_path_owned, &effective_config);

        let cache_item = match content {
            Some(content) => CacheItem::Found {
                mime,
                data: content.data,
            },
            None => CacheItem::NotFound,
        };

        // Store in cache and return
        self.cache.insert(cache_key, cache_item.clone());
        cache_item
    }
}
