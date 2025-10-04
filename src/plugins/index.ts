/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify';
import pinia from '../stores';
import router from '../router';
import functions from './functions';
import ConsoleComponentsPlugin from '@lakekeeper/console-components';

// Types
import type { App } from 'vue';

export function registerPlugins(app: App) {
  app.use(vuetify).use(router).use(pinia).use(functions).use(ConsoleComponentsPlugin);
}
