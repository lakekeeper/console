import { TokenType } from '@lakekeeper/console-components';

const icebergCatalogUrl = import.meta.env.VITE_APP_ICEBERG_CATALOG_URL || '';
const idpAuthority = import.meta.env.VITE_IDP_AUTHORITY || '';
const idpClientId = import.meta.env.VITE_IDP_CLIENT_ID || '';
const idpRedirectPath = import.meta.env.VITE_IDP_REDIRECT_PATH || '';
const idpScope = import.meta.env.VITE_IDP_SCOPE || '';
const idpResource = import.meta.env.VITE_IDP_RESOURCE || '';
const idpLogoutRedirectPath = import.meta.env.VITE_IDP_POST_LOGOUT_REDIRECT_PATH || '';
const idpTokenType = import.meta.env.VITE_IDP_TOKEN_TYPE || TokenType.ACCESS_TOKEN;
const enabledAuthentication =
  import.meta.env.VITE_ENABLE_AUTHENTICATION.toLowerCase() === 'true' || false;
const enabledPermissions =
  import.meta.env.VITE_ENABLE_PERMISSIONS.toLowerCase() === 'true' || false;

const baseUrlPrefix = import.meta.env.VITE_BASE_URL_PREFIX || '';

export {
  icebergCatalogUrl,
  idpAuthority,
  idpClientId,
  idpRedirectPath,
  idpScope,
  idpResource,
  idpTokenType,
  idpLogoutRedirectPath,
  enabledAuthentication,
  enabledPermissions,
  baseUrlPrefix,
};
