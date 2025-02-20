const icebergCatalogUrl = import.meta.env.VITE_APP_ICEBERG_CATALOG_URL || '';
const idpAuthority = import.meta.env.VITE_IDP_AUTHORITY || '';
const idpClientId = import.meta.env.VITE_IDP_CLIENT_ID || '';
const idpRedirectPath = import.meta.env.VITE_IDP_REDIRECT_PATH || '';
const idpScope = import.meta.env.VITE_IDP_SCOPE || '';
const idpResource = import.meta.env.VITE_IDP_RESOURCE || '';
const idpLogoutRedirectPath = import.meta.env.VITE_IDP_POST_LOGOUT_REDIRECT_PATH || '';
const enabledAuthentication =
  import.meta.env.VITE_ENABLE_AUTHENTICATION.toLowerCase() === 'true' || false;
const enabledPermissions =
  import.meta.env.VITE_ENABLE_PERMISSIONS.toLowerCase() === 'true' || false;

export {
  icebergCatalogUrl,
  idpAuthority,
  idpClientId,
  idpRedirectPath,
  idpScope,
  idpResource,
  idpLogoutRedirectPath,
  enabledAuthentication,
  enabledPermissions,
};
