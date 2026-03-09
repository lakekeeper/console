// Plugins
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import Fonts from 'unplugin-fonts/vite';
import Vue from '@vitejs/plugin-vue';
import VueRouter from 'unplugin-vue-router/vite';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import { loadEnv, defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
// Utilities
import { fileURLToPath, URL } from 'node:url';

// Plugin to copy DuckDB files from console-components
const duckdbFiles = [
  'duckdb-browser-coi.pthread.worker.js',
  'duckdb-browser-coi.worker.js',
  'duckdb-browser-eh.worker.js',
  'duckdb-browser-mvp.worker.js',
  'duckdb-coi.wasm',
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

      mkdirSync(resolve(targetPath, 'duckdb'), { recursive: true });
      duckdbFiles.forEach((file) => {
        copyFileSync(resolve(srcDir, 'duckdb', file), resolve(targetPath, 'duckdb', file));
      });
      copyFileSync(wrapperSrc, resolve(targetPath, 'duckdb-worker-wrapper.js'));
      console.log('Copied DuckDB files from @lakekeeper/console-components');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: `${env.VITE_BASE_URL_PREFIX || ''}/ui/`,
    plugins: [
      copyDuckDBFiles(), // Copy DuckDB files from console-components
      VueRouter({
        dts: 'src/typed-router.d.ts',
      }),
      AutoImport({
        imports: [
          'vue',
          {
            'vue-router/auto': ['useRoute', 'useRouter'],
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
      Fonts({
        google: {
          families: [
            {
              name: 'Roboto',
              styles: 'wght@100;300;400;500;700;900',
            },
          ],
        },
      }),
    ],
    define: { 'process.env': {} },
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
