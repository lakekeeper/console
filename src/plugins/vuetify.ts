/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
// import 'material-design-icons-iconfont/dist/material-design-icons.css';

import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

// Composables
import { createVuetify } from 'vuetify';
import { VStepperVertical, VStepperVerticalItem } from 'vuetify/labs/VStepperVertical';
import * as components from 'vuetify/components';
import { lakekeeperLightTheme, lakekeeperDarkTheme } from '@lakekeeper/console-components';

// Resolve the theme BEFORE first paint to avoid a flash: the visual store only
// applies the persisted/system theme in onMounted, so without this the first
// frame is always `light` (white) and dark users see a white flash → dark flip.
// Mirror the store: persisted localStorage['visual'].themeLight, else system pref.
function initialTheme(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem('visual');
    if (raw) {
      const themeLight = JSON.parse(raw)?.themeLight;
      if (typeof themeLight === 'boolean') return themeLight ? 'light' : 'dark';
    }
  } catch {
    /* localStorage unavailable or malformed — fall through to system pref */
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    ...components,
    VStepperVertical,
    VStepperVerticalItem,
  },
  theme: {
    defaultTheme: initialTheme(),
    themes: {
      light: lakekeeperLightTheme,
      dark: lakekeeperDarkTheme,
    },
  },
  // icons: {
  //   defaultSet: "mdi",
  //   aliases,
  //   sets: {
  //     md,
  //     mdi,
  //   },
  // },
});
