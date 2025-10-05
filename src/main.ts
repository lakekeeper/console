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
import * as appConfig from '@/app.config';

const app = createApp(App);

// Provide runtime config for shared library composables
app.provide('appConfig', appConfig);

// Register plugins (includes pinia, then shared components)
registerPlugins(app);

// Provide functions for shared components
app.provide('appFunctions', useFunctionsImplementation());

app.use(auth);
app.mount('#app');
