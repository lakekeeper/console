/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins';
import auth from '@/plugins/auth';
import { useFunctions } from '@/plugins/functions';

// Components
import App from './App.vue';

// Composables
import { createApp } from 'vue';

// Config
import * as appConfig from '@/app.config';

const app = createApp(App);

// Provide runtime config for shared library composables
app.provide('appConfig', appConfig);

// Register plugins (includes pinia, then functions, then shared components)
registerPlugins(app);

// Provide functions for shared components
app.provide('appFunctions', useFunctions());

app.use(auth);
app.mount('#app');
