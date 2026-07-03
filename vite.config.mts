// Plugins
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import Vue from '@vitejs/plugin-vue';
import VueRouter from 'vue-router/vite';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import { loadEnv, defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, rmSync, cpSync, createReadStream } from 'fs';
// Utilities
import { fileURLToPath, URL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Dev-only: serve DuckDB extension binaries directly from console-components' dist,
// ahead of Vite's SPA history fallback. Copying them into publicDir is unreliable
// in `vite dev` — the SPA fallback intermittently returns index.html for
// /duckdb/extensions/*.wasm, which DuckDB then parses as a binary ("Unknown ABI
// type" / "need to see wasm magic number"). This middleware makes it deterministic.
// Production build still serves them from dist via copyDuckDBFiles → publicDir.
function serveDuckDBExtensionsDev() {
  const extRoot = resolve(
    __dirname,
    'node_modules/@lakekeeper/console-components/dist/duckdb/extensions',
  );
  const marker = '/duckdb/extensions/';
  return {
    name: 'serve-duckdb-extensions-dev',
    apply: 'serve' as const,
    configureServer(server: { middlewares: { use: (fn: unknown) => void } }) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = (req.url || '').split('?')[0];
        const idx = url.indexOf(marker);
        if (idx === -1 || !url.endsWith('.wasm')) return next();
        const filePath = resolve(extRoot, url.slice(idx + marker.length));
        if (!filePath.startsWith(extRoot) || !existsSync(filePath)) return next();
        res.setHeader('Content-Type', 'application/wasm');
        res.setHeader('Cache-Control', 'no-cache');
        createReadStream(filePath).pipe(res);
      });
    },
  };
}

// Plugin to copy DuckDB files from console-components.
// COI (cross-origin isolated) bundle is intentionally omitted — LoQEEngine
// only registers mvp + eh, so the coi WASM (~32 MB) is dead weight.
const duckdbFiles = [
  'duckdb-browser-eh.worker.js',
  'duckdb-browser-mvp.worker.js',
  'duckdb-eh.wasm',
  'duckdb-mvp.wasm',
];

function copyDuckDBFiles() {
  return {
    name: 'copy-duckdb-files',
    buildStart() {
      const srcDir = resolve(__dirname, 'node_modules/@lakekeeper/console-components/dist');
      const targetPath = resolve(__dirname, 'public');

      if (!existsSync(srcDir)) {
        throw new Error(`console-components dist not found at ${srcDir}. Run "npm install" first.`);
      }

      const missingDuckdb = duckdbFiles.filter(
        (file) => !existsSync(resolve(srcDir, 'duckdb', file)),
      );
      if (missingDuckdb.length > 0) {
        throw new Error(
          `Missing DuckDB files in ${srcDir}/duckdb:\n  - ${missingDuckdb.join('\n  - ')}`,
        );
      }

      const wrapperSrc = resolve(srcDir, 'duckdb-worker-wrapper.js');
      if (!existsSync(wrapperSrc)) {
        throw new Error(`Missing duckdb-worker-wrapper.js in ${srcDir}`);
      }

      // Wipe any previously-copied duckdb files (e.g. variants we no longer
      // ship) so stale binaries don't leak through Vite's publicDir into dist.
      rmSync(resolve(targetPath, 'duckdb'), { recursive: true, force: true });
      mkdirSync(resolve(targetPath, 'duckdb'), { recursive: true });
      duckdbFiles.forEach((file) => {
        copyFileSync(resolve(srcDir, 'duckdb', file), resolve(targetPath, 'duckdb', file));
      });
      copyFileSync(wrapperSrc, resolve(targetPath, 'duckdb-worker-wrapper.js'));
      console.log('Copied DuckDB files from @lakekeeper/console-components');

      // Self-hosted DuckDB extensions (iceberg/httpfs/avro) for airgapped LoQE.
      const extSrc = resolve(srcDir, 'duckdb', 'extensions');
      if (existsSync(extSrc)) {
        cpSync(extSrc, resolve(targetPath, 'duckdb', 'extensions'), { recursive: true });
        console.log('Copied DuckDB extensions (iceberg/httpfs/avro)');
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: `${env.VITE_BASE_URL_PREFIX || ''}/ui/`,
    plugins: [
      copyDuckDBFiles(), // Copy DuckDB files from console-components
      serveDuckDBExtensionsDev(), // Dev: serve extension .wasm ahead of SPA fallback
      VueRouter({
        dts: 'src/typed-router.d.ts',
      }),
      AutoImport({
        imports: [
          'vue',
          {
            'vue-router': ['useRoute', 'useRouter'],
          },
        ],
        dts: 'src/auto-imports.d.ts',
        eslintrc: {
          enabled: true,
        },
        vueTemplate: true,
      }),
      Components({
        dts: 'src/components.d.ts',
      }),
      Vue({
        template: { transformAssetUrls },
      }),
      Vuetify({
        autoImport: true,
      }),
      // Roboto is now self-hosted via @fontsource/roboto (imported in main.ts) so
      // fonts load from our own origin instead of the Google Fonts CDN (air-gap).
    ],
    define: {
      'process.env': {},
      ...(mode === 'placeholder' && {
        'import.meta.env.VITE_ENABLE_AUTHENTICATION': '(globalThis.__lkauth)',
        'import.meta.env.VITE_ENABLE_PERMISSIONS': '(globalThis.__lkperm)',
      }),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      dedupe: [
        'vue',
        '@vue/reactivity',
        '@vue/runtime-core',
        '@vue/runtime-dom',
        '@vue/shared',
        'pinia',
        'vue-router',
        'vuetify',
      ],
      extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
    },
    server: {
      port: 3001,
      fs: {
        allow: [
          // Allow serving files from workspace root
          resolve(__dirname, '../..'),
          // Allow serving DuckDB files from console-components
          resolve(__dirname, '../console-components/public'),
        ],
      },
    },
    // Copy DuckDB files from console-components to serve them
    publicDir: 'public',
    build: {
      rollupOptions: {
        external: [],
      },
    },
  };
});
