/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins';
import auth from '@/plugins/auth';
import { useFunctionsImplementation } from '@lakekeeper/console-components';

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
app.provide('appConfig', {
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
});

// Register plugins (includes pinia, then shared components)
registerPlugins(app);

// Provide functions for shared components (using 'functions' key to match shared components expectations)
app.provide('functions', useFunctionsImplementation());

app.use(auth);
app.mount('#app');
