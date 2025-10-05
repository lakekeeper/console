/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins';
import { createAuth, useFunctionsImplementation, useVisualStore } from '@lakekeeper/console-components';

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
  baseUrlPrefix,
} from '@/app.config';

const app = createApp(App);

// Provide runtime config for shared library composables as a plain object
const appConfigObject = {
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
app.provide('functions', useFunctionsImplementation(appConfigObject));

app.mount('#app');
