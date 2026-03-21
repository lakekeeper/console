# Agent Instructions — console

## Project Overview

`console` is the open-source Lakekeeper web application built with Vue 3 + Vuetify 3. It consumes `@lakekeeper/console-components` as a GitHub dependency.

Repository: [lakekeeper/console](https://github.com/lakekeeper/console)
License: Apache-2.0

---

## Architecture

```
src/
  main.ts                           # App bootstrap — creates auth, functions, mounts app
  app.config.ts                     # Environment variables (VITE_*) → exported config constants
  App.vue                           # Root component
  plugins/
    index.ts                        # registerPlugins() — vuetify, router, pinia, ConsoleComponentsPlugin
    vuetify.ts                      # Vuetify setup with myCustomLightTheme from console-components
  router/
    index.ts                        # Vue Router setup (file-based routing via unplugin-vue-router)
  stores/
    index.ts                        # Pinia setup with persistedstate plugin
  layouts/
    default.vue                     # Main layout (AppBar, NavigationBar, router-view)
  components/
    Home.vue                        # Home page content (community cards, HomeStatistics)
    NavigationBar.vue               # Side navigation drawer
    EULA.vue                        # EULA display
  pages/                            # File-based routing (unplugin-vue-router)
    index.vue                       # / → Home
    bootstrap.vue                   # /bootstrap
    login.vue / logout.vue / callback.vue  # Auth flow
    server-settings.vue             # Server admin
    server-offline.vue              # Offline fallback
    user-profile.vue                # User settings
    roles/                          # Role management
    warehouse/
      index.vue                     # /warehouse → warehouse list
      [id].vue                      # /warehouse/:id → warehouse detail (tabs)
      [id].namespace.[nsid].vue     # Namespace detail
      [id].namespace.[nsid].table.[tid].vue   # Table detail
      [id].namespace.[nsid].view.[vid].vue    # View detail
    loqe.vue                        # Local Query Engine (DuckDB WASM)
    dependencies.vue                # Dependencies page
    license.vue                     # License info
    volumes.vue                     # Volumes management
```

### Key patterns

- **Almost all UI lives in console-components** — this app is a thin shell that wires up routing, auth, and config
- Components are imported from `@lakekeeper/console-components` and composed in page files
- Auth is created via `createAuth(config)` from console-components in `main.ts`
- Functions plugin is initialized with `useFunctions(appConfig)` and provided to the app
- File-based routing via `unplugin-vue-router` — page files in `src/pages/` auto-generate routes
- Only 3 local components: `Home.vue`, `NavigationBar.vue`, `EULA.vue`

### Environment variables

All configured in `src/app.config.ts`:

- `VITE_APP_ICEBERG_CATALOG_URL` — Lakekeeper server URL
- `VITE_ENABLE_AUTHENTICATION` / `VITE_ENABLE_PERMISSIONS` — auth toggles
- `VITE_IDP_*` — OIDC provider settings (authority, client_id, scope, etc.)
- `VITE_BASE_URL_PREFIX` — URL prefix for deployment behind a reverse proxy

---

## Development with npm link

During local development, link the component library so changes are reflected immediately:

```bash
npm run link
# Runs: npm link ../console-components && touch tsconfig.json
```

### Pre-PR workflow — MUST unlink before push

**Before pushing and creating a PR**, you must unlink so that `npm install` generates a clean `package-lock.json` pointing at the GitHub dependency:

```bash
npm run unlink
# Runs: npm unlink --no-save @lakekeeper/console-components && rm -rf node_modules package-lock.json && npm install
```

Why this matters:

- `npm link` creates a symlink — no `package-lock.json` entry is generated for the linked package
- CI runs `npm ci` which requires a valid `package-lock.json` — without it, the build fails with missing exports
- Running `npm run unlink` does a fresh install from the GitHub ref in `package.json` (e.g. `github:lakekeeper/console-components#v0.3.0`), producing the correct lockfile
- Always verify `vue-tsc --noEmit` passes locally after unlinking before pushing

---

## Build & Lint

```bash
just reviewable       # install + fix-all + build (run before every commit)
just fix-all          # format + lint
just build            # vite build (includes vue-tsc --noEmit)
just dev              # start dev server
npx vue-tsc --noEmit  # type-check only
```

---

## Git Commit & PR Format

Use **conventional commits** with a `(ui)` scope:

| Prefix       | When to use                                                   |
| ------------ | ------------------------------------------------------------- |
| `feat(ui):`  | New UI features, components, tabs, controls, visual additions |
| `fix(ui):`   | Bug fixes, layout corrections, broken behavior                |
| `chore(ui):` | Docs, refactors, dependency bumps, config changes, cleanup    |

**PR title**: `fix: <description>` or `feat: <description>` (no scope in the title)

**PR body**: add the `BEGIN_COMMIT_OVERRIDE` / `END_COMMIT_OVERRIDE` block so release-please picks up the scoped commit messages on squash-merge:
```text
BEGIN_COMMIT_OVERRIDE
fix(ui): short description of what was fixed
END_COMMIT_OVERRIDE
```
