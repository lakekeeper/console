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
import { myCustomLightTheme } from '@lakekeeper/console-components';

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    ...components,
    VStepperVertical,
    VStepperVerticalItem,
  },
  theme: {
    defaultTheme: 'myCustomLightTheme',
    themes: {
      myCustomLightTheme,
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
