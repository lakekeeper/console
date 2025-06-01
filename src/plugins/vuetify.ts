// plugins/vuetify.ts

// Styles
// Import Material Design Icons font CSS
import '@mdi/font/css/materialdesignicons.css';
// Import Vuetify's core styles
import 'vuetify/styles';

// Composables (Vuetify's core functions)
import { createVuetify } from 'vuetify';

// Import ALL standard Vuetify components and directives
// This is crucial for components like v-footer, v-app, v-card, etc.
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Import specific Vuetify Lab components if you are using them
// These are not included in `vuetify/components` and must be imported separately
import { VTreeview } from 'vuetify/labs/VTreeview';
import { VStepperVertical, VStepperVerticalItem } from 'vuetify/labs/VStepperVertical';

// Define your custom light theme
const myCustomLightTheme = {
  dark: false, // This theme is explicitly light
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    'surface-bright': '#FFFFFF',
    'surface-light': '#EEEEEE',
    'surface-variant': '#424242',
    'on-surface-variant': '#EEEEEE',
    primary: '#1867C0',
    'primary-darken-1': '#1F5592',
    secondary: '#48A9A6',
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
  },
  variables: {
    'border-color': '#000000',
    'border-opacity': 0.12,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.6,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
    'hover-opacity': 0.04,
    'focus-opacity': 0.12,
    'selected-opacity': 0.08,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.12,
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#F5F5F5',
    'theme-on-code': '#000000',
  },
};

// Create the Vuetify instance
export default createVuetify({
  // Register all components:
  // - Use the spread operator (`...components`) to include all standard Vuetify components.
  // - Explicitly add any Vuetify Lab components or custom components.
  components: {
    ...components, // Includes VApp, VMain, VFooter, VCard, VBtn, etc.
    VTreeview,
    VStepperVertical,
    VStepperVerticalItem,
  },
  // Register all standard Vuetify directives (e.g., v-ripple, v-tooltip)
  directives,
  // Configure themes
  theme: {
    defaultTheme: 'myCustomLightTheme', // Set your custom theme as the default
    themes: {
      myCustomLightTheme, // Make your custom theme available
    },
  },
  // If you were using custom icons or other icon sets, you'd configure them here.
  // Example for Material Design Icons (MDI) as default:
  // icons: {
  //   defaultSet: 'mdi',
  //   aliases, // Assuming aliases are imported from 'vuetify/iconsets/mdi' or similar
  //   sets: { mdi }, // Assuming mdi set is imported from 'vuetify/iconsets/mdi' or similar
  // },
});
