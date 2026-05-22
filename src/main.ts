/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins';
import { createAuth, useFunctions, useVisualStore } from '@lakekeeper/console-components';
import formbricks from '@formbricks/js';

// Components
import App from './App.vue';

// Composables
import { createApp } from 'vue';

// Config
import {
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
  enabledUserSurveys,
  baseUrlPrefix,
} from '@/app.config';

const app = createApp(App);

// Provide runtime config for shared library composables as a plain object
const appConfigObject = {
  edition: 'oss' as const,
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
  enabledUserSurveys,
  baseUrlPrefix,
};

app.provide('appConfig', appConfigObject);

// Register plugins (includes pinia, then shared components)
registerPlugins(app);

// Provide visual store instance for shared components
const visual = useVisualStore();
app.provide('visual', visual);

// Create and install auth plugin with runtime config
const auth = createAuth({
  idpAuthority,
  idpClientId,
  idpRedirectPath,
  idpScope,
  idpResource,
  idpLogoutRedirectPath,
  idpTokenType,
  baseUrlPrefix,
  enabledAuthentication,
});

app.use(auth);

// Provide functions for shared components (using 'functions' key to match shared components expectations)
// Pass config to functions so they can use the runtime config
app.provide('functions', useFunctions(appConfigObject));

// Optional in-app feedback surveys via Formbricks. Anonymous; survey answers
// are only sent when a user responds. Disable by setting
// VITE_ENABLE_USER_SURVEYS=false (or LAKEKEEPER_UI__ENABLE_USER_SURVEYS=false
// at runtime). See README for details on what is collected.
if (enabledUserSurveys) {
  formbricks.setup({
    environmentId: 'cmoy9tpanq8a9y301tcw8h4q9',
    appUrl: 'https://app.formbricks.com',
  });
}

app.mount('#app');
