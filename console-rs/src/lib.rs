use rust_embed::Embed;

#[derive(Embed)]
#[folder = "$OUT_DIR/node/dist"]
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
    pub enable_authentication: bool,
    pub enable_permissions: bool,
    pub app_iceberg_catalog_url: Option<String>,
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
        enable_authentication,
        enable_permissions,
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
                    "VITE_ENABLE_AUTHENTICATION_PLACEHOLDER",
                    &enable_authentication.to_string(),
                )
                .replace(
                    "VITE_ENABLE_PERMISSIONS_PLACEHOLDER",
                    &enable_permissions.to_string(),
                );
            let data = if let Some(app_iceberg_catalog_url) = app_iceberg_catalog_url {
                data.replace(
                    "VITE_APP_ICEBERG_CATALOG_URL_PLACEHOLDER",
                    &app_iceberg_catalog_url,
                )
            } else {
                data
            };

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
            idp_authority: "https://idp.example.com".to_string(),
            idp_client_id: "client_id_test".to_string(),
            idp_redirect_path: "/callback-test".to_string(),
            idp_scope: "openid profile email test".to_string(),
            idp_resource: "foo-bar-test".to_string(),
            idp_post_logout_redirect_path: "/logout-test".to_string(),
            enable_authentication: true,
            enable_permissions: false,
            app_iceberg_catalog_url: Some("https://catalog.example.com".to_string()),
        };
        let files = LakekeeperConsole::iter().collect::<Vec<_>>();

        let config_values = vec![
            &config.idp_authority,
            &config.idp_client_id,
            &config.idp_redirect_path,
            &config.idp_scope,
            &config.idp_resource,
            &config.idp_post_logout_redirect_path,
            config.app_iceberg_catalog_url.as_ref().unwrap(),
        ];

        let mut found_values = vec![false; config_values.len()];

        for file in &files {
            let templated_file = get_file(file, &config.clone()).unwrap();
            if file.ends_with(".js") {
                let file_content = std::str::from_utf8(&templated_file.data).unwrap();
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
