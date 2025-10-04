# Shared Components Library Setup Guide

This guide explains how to set up the `@lakekeeper/console-components` shared component library.

## Overview

The EULA component (and future shared components) will be moved to a separate npm package at:
**https://github.com/lakekeeper/console-components**

## Part 1: Setting up the console-components Repository

### 1. Create the Repository

Create a new repository on GitHub: `https://github.com/lakekeeper/console-components`

### 2. Clone and Initialize

```bash
git clone https://github.com/lakekeeper/console-components.git
cd console-components
```

### 3. Create the Following Files

#### package.json

```json
{
  "name": "@lakekeeper/console-components",
  "version": "0.1.0",
  "description": "Shared Vue components for Lakekeeper console applications",
  "type": "module",
  "main": "./dist/console-components.umd.js",
  "module": "./dist/console-components.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/console-components.es.js",
      "require": "./dist/console-components.umd.js",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite",
    "build": "vite build && vue-tsc --declaration --emitDeclarationOnly --outDir dist",
    "preview": "vite preview",
    "lint": "eslint . --fix",
    "lint:check": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["vue", "vuetify", "components", "lakekeeper"],
  "author": "Lakekeeper",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/lakekeeper/console-components.git"
  },
  "peerDependencies": {
    "vue": "^3.4.0",
    "vuetify": "^3.6.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.14.0",
    "@types/node": "^22.9.0",
    "@vitejs/plugin-vue": "^5.1.4",
    "@vue/eslint-config-typescript": "^14.1.3",
    "eslint": "^9.16.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.2.1",
    "eslint-plugin-vue": "^9.30.0",
    "prettier": "^3.4.2",
    "typescript": "~5.6.3",
    "typescript-eslint": "^8.18.0",
    "vite": "^5.4.19",
    "vite-plugin-dts": "^4.3.0",
    "vite-plugin-vuetify": "^2.0.3",
    "vue": "^3.4.31",
    "vue-tsc": "^2.1.10",
    "vuetify": "^3.6.14"
  }
}
```

#### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ConsoleComponents',
      fileName: (format) => `console-components.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'vuetify', 'vuetify/components', 'vuetify/directives'],
      output: {
        globals: {
          vue: 'Vue',
          vuetify: 'Vuetify',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name || '';
        },
      },
    },
  },
});
```

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "jsx": "preserve",
    "lib": ["DOM", "ESNext"],
    "baseUrl": ".",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["src/*"]
    },
    "resolveJsonModule": true,
    "types": ["vite/client"],
    "allowJs": true,
    "strict": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist"
  },
  "include": ["src/**/*", "src/**/*.vue", "src/**/*.ts"],
  "exclude": ["dist", "node_modules"]
}
```

#### .gitignore

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

#### .prettierrc.json

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

#### eslint.config.mjs

```javascript
import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import typescript from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...typescript.configs.recommended,
  ...vue.configs['flat/recommended'],
  prettierConfig,
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
```

### 4. Create Directory Structure

```bash
mkdir -p src/components
```

#### src/index.ts

```typescript
import type { App } from 'vue';
import EULA from './components/EULA.vue';

// Export components
export { EULA };

// Export plugin for installing all components
export default {
  install(app: App) {
    app.component('EULA', EULA);
  },
};
```

#### src/components/EULA.vue

Copy the entire content from `/Users/viktor/Biz/console/src/components/EULA.vue` to this file.

### 5. Create README.md

```markdown
# @lakekeeper/console-components

Shared Vue 3 components for Lakekeeper console applications.

## Installation

\`\`\`bash
npm install @lakekeeper/console-components
\`\`\`

## Prerequisites

This library has peer dependencies on:

- `vue` ^3.4.0
- `vuetify` ^3.6.0

Make sure these are installed in your project.

## Usage

### Option 1: Import individual components

\`\`\`vue

<script setup lang="ts">
import { EULA } from '@lakekeeper/console-components';
import '@lakekeeper/console-components/style.css';
</script>

<template>
  <EULA />
</template>
\`\`\`

### Option 2: Install as a plugin (registers all components globally)

\`\`\`typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import ConsoleComponents from '@lakekeeper/console-components';
import '@lakekeeper/console-components/style.css';

const app = createApp(App);
app.use(ConsoleComponents);
app.mount('#app');
\`\`\`

Then use in any component:

\`\`\`vue
<template>
<EULA />
</template>
\`\`\`

## Available Components

- **EULA** - Apache License 2.0 display component

## Development

\`\`\`bash

# Install dependencies

npm install

# Build library

npm run build

# Lint

npm run lint

# Format

npm run format
\`\`\`

## Publishing

\`\`\`bash

# Build and publish to npm

npm publish
\`\`\`

## License

Apache-2.0
```

### 6. Install Dependencies and Build

```bash
npm install
npm run build
```

### 7. Publish to npm

First, log in to npm (if not already):

```bash
npm login
```

Then publish:

```bash
npm publish --access public
```

## Part 2: Update the Console App

The console app has already been updated with the following changes:

### 1. Updated package.json

Added the dependency:

```json
"@lakekeeper/console-components": "^0.1.0"
```

### 2. Updated src/pages/license.vue

Changed from using local component to importing from the shared library:

```vue
<script setup lang="ts">
import { EULA } from '@lakekeeper/console-components';
import '@lakekeeper/console-components/style.css';
</script>

<template>
  <EULA />
</template>
```

### 3. Install the new dependency

After publishing the package to npm, run:

```bash
npm install
```

### 4. (Optional) Remove the old local component

Once verified that everything works with the shared library:

```bash
rm src/components/EULA.vue
```

## Part 3: Using in Future Applications

To use the shared components in any other Vue 3 + Vuetify application:

1. Install the package:

   ```bash
   npm install @lakekeeper/console-components
   ```

2. Import and use components:

   ```vue
   <script setup lang="ts">
   import { EULA } from '@lakekeeper/console-components';
   import '@lakekeeper/console-components/style.css';
   </script>

   <template>
     <EULA />
   </template>
   ```

## Adding More Components to the Library

To add more components to the shared library:

1. Add the component file to `src/components/` in the console-components repo
2. Export it in `src/index.ts`:
   ```typescript
   import NewComponent from './components/NewComponent.vue';
   export { EULA, NewComponent };
   ```
3. Update the plugin installation (if using global registration):
   ```typescript
   export default {
     install(app: App) {
       app.component('EULA', EULA);
       app.component('NewComponent', NewComponent);
     },
   };
   ```
4. Rebuild and publish a new version:
   ```bash
   npm version patch  # or minor/major
   npm run build
   npm publish
   ```

## Development Workflow

### For library development:

1. Make changes in the console-components repo
2. Build: `npm run build`
3. Publish new version: `npm version patch && npm publish`

### For consuming apps:

1. Update dependency version in package.json
2. Run: `npm install`
3. Import and use updated components

### For local testing (before publishing):

In the console-components repo:

```bash
npm link
```

In the console app:

```bash
npm link @lakekeeper/console-components
```

This allows you to test changes locally before publishing to npm.

## Notes

- The library is configured to externalize Vue and Vuetify, so they won't be bundled
- TypeScript declarations are generated automatically during build
- The library supports both ESM and UMD formats
- CSS is extracted to a separate file that must be imported separately
