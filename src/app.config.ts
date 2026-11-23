import { TokenType } from '@lakekeeper/console-components';

/**
 * UI configuration of the Lakekeeper process. Lakekeeper renders it into the
 * `lakekeeper-config` JSON block of index.html; the dev server reads `.env`.
 */
interface RuntimeConfig {
  idpAuthority: string;
  idpClientId: string;
  idpRedirectPath: string;
  idpScope: string;
  idpResource: string;
  idpPostLogoutRedirectPath: string;
  idpPostLogoutRedirectUrl: string;
  idpDisablePostLogoutRedirect: boolean;
  idpTokenType: TokenType;
  enableAuthentication: boolean;
  enablePermissions: boolean;
  enableUserSurveys: boolean;
  /** Catalog URL configured by the operator; `null` = same origin and path prefix as this page. */
  lakekeeperUrl: string | null;
}

function configFromEnv(): RuntimeConfig {
  const env = import.meta.env;
  return {
    idpAuthority: env.VITE_IDP_AUTHORITY || '',
    idpClientId: env.VITE_IDP_CLIENT_ID || '',
    idpRedirectPath: env.VITE_IDP_REDIRECT_PATH || '',
    idpScope: env.VITE_IDP_SCOPE || '',
    idpResource: env.VITE_IDP_RESOURCE || '',
    idpPostLogoutRedirectPath: env.VITE_IDP_POST_LOGOUT_REDIRECT_PATH || '',
    idpPostLogoutRedirectUrl: env.VITE_IDP_POST_LOGOUT_REDIRECT_URL || '',
    idpDisablePostLogoutRedirect:
      (env.VITE_IDP_POST_LOGOUT_REDIRECT_DISABLED || '').toLowerCase() === 'true',
    idpTokenType: (env.VITE_IDP_TOKEN_TYPE as TokenType) || TokenType.ACCESS_TOKEN,
    enableAuthentication: (env.VITE_ENABLE_AUTHENTICATION || '').toLowerCase() === 'true',
    enablePermissions: (env.VITE_ENABLE_PERMISSIONS || '').toLowerCase() === 'true',
    enableUserSurveys: (env.VITE_ENABLE_USER_SURVEYS ?? 'true').toLowerCase() === 'true',
    lakekeeperUrl: env.VITE_APP_ICEBERG_CATALOG_URL || null,
  };
}

function configFromPage(): RuntimeConfig {
  const block = document.getElementById('lakekeeper-config');
  if (!block?.textContent) {
    throw new Error('Lakekeeper UI configuration missing: index.html must be served by Lakekeeper');
  }
  return JSON.parse(block.textContent) as RuntimeConfig;
}

/**
 * Path prefix in front of `/ui/`, e.g. `/lakekeeper` behind a proxy that mounts
 * Lakekeeper there, or `''`. Lakekeeper writes it into `<base href>` per request.
 */
function prefixFromPage(): string {
  const basePath = new URL(document.baseURI).pathname;
  if (!basePath.endsWith('/ui/')) {
    throw new Error(`Unexpected <base href> path ${basePath}: it must end with /ui/`);
  }
  return basePath.slice(0, -'/ui/'.length);
}

const config = import.meta.env.DEV ? configFromEnv() : configFromPage();

const baseUrlPrefix = import.meta.env.DEV
  ? import.meta.env.VITE_BASE_URL_PREFIX || ''
  : prefixFromPage();

// Without an operator-configured URL, the catalog is served from the same
// origin and prefix as this page.
const icebergCatalogUrl = config.lakekeeperUrl || `${window.location.origin}${baseUrlPrefix}`;

const idpAuthority = config.idpAuthority;
const idpClientId = config.idpClientId;
const idpRedirectPath = config.idpRedirectPath;
const idpScope = config.idpScope;
const idpResource = config.idpResource;
const idpLogoutRedirectPath = config.idpPostLogoutRedirectPath;
const idpPostLogoutRedirectUrl = config.idpPostLogoutRedirectUrl;
const idpDisablePostLogoutRedirect = config.idpDisablePostLogoutRedirect;
const idpTokenType = config.idpTokenType;
const enabledAuthentication = config.enableAuthentication;
const enabledPermissions = config.enablePermissions;
const enabledUserSurveys = config.enableUserSurveys;

export {
  icebergCatalogUrl,
  idpAuthority,
  idpClientId,
  idpRedirectPath,
  idpScope,
  idpResource,
  idpTokenType,
  idpLogoutRedirectPath,
  idpPostLogoutRedirectUrl,
  idpDisablePostLogoutRedirect,
  enabledAuthentication,
  enabledPermissions,
  enabledUserSurveys,
  baseUrlPrefix,
};
