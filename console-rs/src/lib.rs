use rust_embed::Embed;

#[derive(Embed)]
#[folder = "$OUT_DIR/console/dist"]
struct LakekeeperConsole;

#[derive(Debug, Clone, PartialEq, derivative::Derivative)]
#[derivative(Default)]
pub struct LakekeeperConsoleConfig {
    pub idp_authority: String,
    #[derivative(Default(value = "\"/lakekeeper\".to_string()"))]
    pub idp_client_id: String,
    #[derivative(Default(value = "\"/callback\".to_string()"))]
    pub idp_redirect_path: String,
    #[derivative(Default(value = "\"openid profile email\".to_string()"))]
    pub idp_scope: String,
    pub idp_resource: String,
    #[derivative(Default(value = "\"/logout\".to_string()"))]
    pub idp_post_logout_redirect_path: String,
    pub enable_authorization: bool,
    pub app_iceberg_catalog_url: String,
}

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
        enable_authorization,
        app_iceberg_catalog_url,
    } = config;

    LakekeeperConsole::get(file_path).map(|file| {
        if file_path.ends_with(".js") {
            let mut file = file.clone();
            let data = std::str::from_utf8(&file.data).unwrap();
            let data = data
                .replace("VITE_IDP_AUTHORITY_PLACEHOLDER", &idp_authority)
                .replace("VITE_IDP_CLIENT_ID_PLACEHOLDER", &idp_client_id)
                .replace("VITE_IDP_REDIRECT_PATH_PLACEHOLDER", &idp_redirect_path)
                .replace("VITE_IDP_SCOPE_PLACEHOLDER", &idp_scope)
                .replace("VITE_IDP_RESOURCE_PLACEHOLDER", &idp_resource)
                .replace(
                    "VITE_IDP_POST_LOGOUT_REDIRECT_PATH_PLACEHOLDER",
                    &idp_post_logout_redirect_path,
                )
                .replace(
                    "VITE_ENABLE_AUTHORIZATION_PLACEHOLDER",
                    &enable_authorization.to_string(),
                )
                .replace(
                    "VITE_APP_ICEBERG_CATALOG_URL_PLACEHOLDER",
                    &app_iceberg_catalog_url,
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
        let index: rust_embed::EmbeddedFile = LakekeeperConsole::get("index.html").unwrap();
        assert!(index.data.len() > 0);
    }

    #[test]
    fn test_get_all_files() {
        let config = LakekeeperConsoleConfig {
            idp_authority: "https://example.com".to_string(),
            idp_client_id: "client_id".to_string(),
            idp_redirect_path: "/callback".to_string(),
            idp_scope: "openid profile email".to_string(),
            idp_resource: "foo-bar".to_string(),
            idp_post_logout_redirect_path: "/logout".to_string(),
            enable_authorization: true,
            app_iceberg_catalog_url: "https://example.com".to_string(),
        };
        let files = LakekeeperConsole::iter().collect::<Vec<_>>();

        for file in files {
            get_file(&file, &config.clone()).unwrap();
        }
    }
}
