# Shared Components Library Setup Guide

This guide explains how to set up the `@lakekeeper/console-components` shared component library.

## Overview

Shared Vue components are maintained in a separate GitHub repository at:
**https://github.com/lakekeeper/console-components**

The library is distributed via **GitHub Releases** (not npm) and uses **release-please** for automated versioning and changelog generation.

## Part 1: Setting up the console-components Repository

### 1. Create the Repository

Create a new repository on GitHub: `https://github.com/lakekeeper/console-components`

### 2. Clone and Initialize

```bash
git clone https://github.com/lakekeeper/console-components.git
cd console-components
```

### 3. Set Up Release-Please for Automated Releases

#### Create release-please configuration

Create `release-please/release-please-config.json`:

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "package-name": "@lakekeeper/console-components"
    }
  },
  "bump-minor-pre-major": true,
  "bump-patch-for-minor-pre-major": false,
  "include-component-in-tag": false
}
```

Create `release-please/.release-please-manifest.json`:

```json
{
  ".": "0.0.1"
}
```

#### Create GitHub Actions Workflows

Create `.github/workflows/release.yml`:

```yaml
name: 🚀 Release

on:
  push:
    branches:
      - main
      - main-*
  pull_request:
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

defaults:
  run:
    shell: bash

jobs:
  # Update release PR
  release_please:
    name: Release Please
    runs-on: ${{ vars.RUNS_ON__AMD_XS || 'ubuntu-latest' }}
    if: ${{ vars.RELEASE_PLEASE_ACTIVATED != '' }}
    outputs:
      releases_created: ${{ steps.release.outputs.releases_created }}
      tag_name: ${{ steps.release.outputs['tag_name'] }}
      major: ${{ steps.release.outputs['major'] }}
      minor: ${{ steps.release.outputs['minor'] }}
      patch: ${{ steps.release.outputs['patch'] }}
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.RELEASE_PLEASE_TOKEN }}
          config-file: release-please/release-please-config.json
          manifest-file: release-please/.release-please-manifest.json
          target-branch: main

  # Build and publish only when a release is created
  build:
    name: Build and Publish
    runs-on: ${{ vars.RUNS_ON__AMD_S || 'ubuntu-latest' }}
    needs: release_please
    if: ${{ needs.release_please.outputs.releases_created == 'true' }}

    steps:
      - name: Checkout Repo
        uses: actions/checkout@v4

      - name: Create Node Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Packages and Build Library
        run: |
          npm ci
          npm run build

      - name: Upload dist to Release
        uses: softprops/action-gh-release@v2
        with:
          files: dist/**/*
          tag_name: ${{ needs.release_please.outputs.tag_name }}
```

Create `.github/workflows/checks.yml`:

```yaml
name: Checks

on:
  push:
    branches: [main, 'main-*']
  pull_request:
    branches: [main, 'main-*']

jobs:
  checks:
    runs-on: ${{ vars.RUNS_ON__AMD_S || 'ubuntu-latest' }}
    container:
      image: quay.io/vakamo/build-base:ubuntu-24-04

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 23
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check formatting
        run: just check-format

      - name: Run ESLint Check
        run: just check-lint

      - name: Type check and build
        run: just build
```

### 4. Configure GitHub Repository Secrets and Variables

#### Required Secrets:

1. Go to repository settings → Secrets and variables → Actions → Secrets
2. Add `RELEASE_PLEASE_TOKEN`:
   - Create a GitHub Personal Access Token (PAT) with `repo` scope
   - Add it as a repository secret

#### Required Variables:

1. Go to repository settings → Secrets and variables → Actions → Variables
2. Add `RELEASE_PLEASE_ACTIVATED` with value `1`
3. (Optional) Add custom runner variables: `RUNS_ON__AMD_XS`, `RUNS_ON__AMD_S`

### 5. Create the Following Files

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
import ExampleComponent from './components/ExampleComponent.vue';

// Export components
export { ExampleComponent };

// Export plugin for installing all components
export default {
  install(app: App) {
    app.component('ExampleComponent', ExampleComponent);
  },
};
```

#### src/components/ExampleComponent.vue

Create your shared Vue components here. Example:

```vue
<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <v-card>
    <v-card-title>{{ title || 'Example Component' }}</v-card-title>
    <v-card-text>This is a shared component from console-components library.</v-card-text>
  </v-card>
</template>
```

### 5. Create README.md

```markdown
# @lakekeeper/console-components

Shared Vue 3 components for Lakekeeper console applications.

## Installation

Install from GitHub releases:

\`\`\`bash
npm install github:lakekeeper/console-components#v0.1.0
\`\`\`

Or add to package.json:

\`\`\`json
{
"dependencies": {
"@lakekeeper/console-components": "github:lakekeeper/console-components#v0.1.0"
}
}
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
import { ExampleComponent } from '@lakekeeper/console-components';
import '@lakekeeper/console-components/style.css';
</script>

<template>
  <ExampleComponent title="My Title" />
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
<ExampleComponent title="Global Component" />
</template>
\`\`\`

## Available Components

Currently, this is a template library. Add your shared components as needed.

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

### 7. Commit Using Conventional Commits

**Important:** All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for release-please to work:

- `feat:` - New features (triggers minor version bump: 0.1.0 → 0.2.0)
- `fix:` - Bug fixes (triggers patch version bump: 0.1.0 → 0.1.1)
- `chore:` - Maintenance tasks (no version bump)
- `docs:` - Documentation changes (no version bump)
- `ci:` - CI/CD changes (no version bump)
- `style:` - Code style changes (no version bump)
- `refactor:` - Code refactoring (no version bump)
- `test:` - Test changes (no version bump)

Breaking changes: Add `BREAKING CHANGE:` in commit body or use `!` after type (triggers major version bump)

Example commits:

```bash
git commit -m "feat: add new shared component"
git commit -m "fix: resolve styling issue in component"
git commit -m "chore: update dependencies"
```

### 8. Push to Main Branch

```bash
git push origin main
```

The GitHub Actions workflow will automatically:

1. Run checks (linting, formatting, build)
2. Create a release PR with version bump and CHANGELOG
3. After you merge the release PR, it will create a GitHub Release with the built dist files

## Part 2: Update the Console App

### 1. Update package.json

Add or update the dependency:

```json
{
  "dependencies": {
    "@lakekeeper/console-components": "github:lakekeeper/console-components#v0.1.0"
  }
}
```

### 2. Install the dependency

```bash
npm install
```

### 3. Import and use components

```vue
<script setup lang="ts">
import { ExampleComponent } from '@lakekeeper/console-components';
import '@lakekeeper/console-components/style.css';
</script>

<template>
  <ExampleComponent title="My App" />
</template>
```

## Part 3: Using in Future Applications

To use the shared components in any other Vue 3 + Vuetify application:

1. Install from GitHub:

   ```bash
   npm install github:lakekeeper/console-components#v0.1.0
   ```

   Or add to package.json:

   ```json
   {
     "dependencies": {
       "@lakekeeper/console-components": "github:lakekeeper/console-components#v0.1.0"
     }
   }
   ```

2. Import and use components:

   ```vue
   <script setup lang="ts">
   import { ExampleComponent } from '@lakekeeper/console-components';
   import '@lakekeeper/console-components/style.css';
   </script>

   <template>
     <ExampleComponent title="My Title" />
   </template>
   ```

## Adding More Components to the Library

To add more components to the shared library:

1. Add the component file to `src/components/` in the console-components repo

2. Export it in `src/index.ts`:

   ```typescript
   import NewComponent from './components/NewComponent.vue';
   export { ExampleComponent, NewComponent };
   ```

3. Update the plugin installation (if using global registration):

   ```typescript
   export default {
     install(app: App) {
       app.component('ExampleComponent', ExampleComponent);
       app.component('NewComponent', NewComponent);
     },
   };
   ```

4. Commit using conventional commits:

   ```bash
   git add .
   git commit -m "feat: add NewComponent"
   git push origin main
   ```

5. Wait for release-please to create a release PR

6. Review and merge the release PR - this automatically:
   - Creates a new GitHub Release with the version tag
   - Attaches the built dist files to the release

7. Update consuming apps to use the new version:
   ```json
   "@lakekeeper/console-components": "github:lakekeeper/console-components#v0.2.0"
   ```

## Development Workflow

### For library development:

1. Make changes in the console-components repo
2. Commit using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve bug"
   ```
3. Push to main:
   ```bash
   git push origin main
   ```
4. Wait for release-please to create a PR
5. Review and merge the release PR
6. GitHub Release is automatically created with built dist files

### For consuming apps:

1. Update dependency version in package.json:
   ```json
   "@lakekeeper/console-components": "github:lakekeeper/console-components#v0.2.0"
   ```
2. Run:
   ```bash
   npm install
   ```
3. Import and use updated components

### For local testing (before releasing):

In the console-components repo:

```bash
npm link
```

In the console app:

```bash
npm link @lakekeeper/console-components
```

This allows you to test changes locally before creating a release.

To unlink:

```bash
# In console app
npm unlink @lakekeeper/console-components
npm install

# In console-components
npm unlink
```

## Release Process

### Automated Release Flow:

1. **Make changes** with conventional commits:
   - `feat:` → minor version bump (0.1.0 → 0.2.0)
   - `fix:` → patch version bump (0.1.0 → 0.1.1)
   - `BREAKING CHANGE:` → major version bump (0.1.0 → 1.0.0)

2. **Push to main**:

   ```bash
   git push origin main
   ```

3. **Release-please creates PR**:
   - Updates version in package.json
   - Generates/updates CHANGELOG.md
   - Creates release commit

4. **Review and merge PR**:
   - Check the CHANGELOG
   - Verify version bump is correct
   - Merge the PR

5. **GitHub Release created automatically**:
   - Tagged with version (e.g., v0.2.0)
   - Includes CHANGELOG notes
   - Has dist files attached

6. **Update consuming apps**:
   - Change version tag in package.json
   - Run `npm install`

### Version Bump Examples:

| Commit Message           | Version Change  |
| ------------------------ | --------------- |
| `feat: add component`    | 0.1.0 → 0.2.0   |
| `fix: resolve bug`       | 0.1.0 → 0.1.1   |
| `feat!: breaking change` | 0.1.0 → 1.0.0   |
| `chore: update deps`     | No version bump |

## Notes

- The library is distributed via **GitHub Releases**, not npm
- Install using: `"github:lakekeeper/console-components#v0.1.0"`
- The library is configured to externalize Vue and Vuetify, so they won't be bundled
- TypeScript declarations are generated automatically during build
- The library supports both ESM and UMD formats
- CSS is extracted to a separate file that must be imported separately
- **Conventional commits are required** for automatic versioning
- Release-please manages versioning and CHANGELOG automatically
- GitHub Actions workflows handle testing, building, and releasing
- The `checks.yml` workflow runs on every PR to verify builds before merging
- The `release.yml` workflow creates releases after merging release PRs

## Troubleshooting

### Release PR not created

- Check that `RELEASE_PLEASE_ACTIVATED` variable is set to `1` in repository settings
- Verify `RELEASE_PLEASE_TOKEN` secret is set with a PAT that has `repo` scope
- Ensure commits use conventional commit format (`feat:`, `fix:`, etc.)
- Check GitHub Actions logs for errors

### Build fails in release workflow

- The `checks.yml` workflow should catch build errors before merging
- Ensure all dependencies are in package.json
- Verify TypeScript types are correct
- Check that all imports are valid

### npm install fails with GitHub package

- Ensure you're using the correct format: `github:owner/repo#tag`
- Check that the release exists and has dist files attached
- Verify you have access to the repository (for private repos, you need authentication)

### Local testing with npm link not working

- Make sure to run `npm run build` in console-components before linking
- Unlink and reinstall if you encounter issues
- Clear node_modules and package-lock.json if needed
