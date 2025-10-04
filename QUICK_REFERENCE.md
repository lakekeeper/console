# Quick Reference: Shared Components

## Console Components Repository

**GitHub**: https://github.com/lakekeeper/console-components
**Branch**: `vk/adding-components`
**Location**: `/Users/viktor/Biz/console-components`

## Console App Configuration

**Location**: `/Users/viktor/Biz/console`
**Dependency**: `github:lakekeeper/console-components#vk/adding-components`

## Quick Commands

### Work on Shared Components

```bash
cd /Users/viktor/Biz/console-components

# Make changes to components
# Then build and push:
npm run build
git add .
git commit -m "Update components"
git push
```

### Update Console App with Latest Components

```bash
cd /Users/viktor/Biz/console
npm install  # Pulls latest from GitHub
```

### Import Component in Console App

```vue
<script setup lang="ts">
import { EULA } from '@lakekeeper/console-components';
import '@lakekeeper/console-components/style.css';
</script>

<template>
  <EULA />
</template>
```

## First Shared Component: EULA ✅

- Located in: `console-components/src/components/EULA.vue`
- Used in: `console/src/pages/license.vue`
- Status: Working and deployed

## Add New Shared Component (3 Steps)

1. Copy to `console-components/src/components/`
2. Update `console-components/src/index.ts` (import + export)
3. Build, commit, push, and reinstall in console app
