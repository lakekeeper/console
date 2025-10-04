/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify';
import pinia from '../stores';
import router from '../router';
import ConsoleComponentsPlugin from '@lakekeeper/console-components';

// Types
import type { App } from 'vue';

export function registerPlugins(app: App) {
  app.use(vuetify).use(router).use(pinia).use(ConsoleComponentsPlugin);
}
