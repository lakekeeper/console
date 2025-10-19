// Plugins
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import Fonts from 'unplugin-fonts/vite';
import Layouts from 'vite-plugin-vue-layouts';
import Vue from '@vitejs/plugin-vue';
import VueRouter from 'unplugin-vue-router/vite';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import { loadEnv, defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
// Utilities
import { fileURLToPath, URL } from 'node:url';

// Plugin to copy DuckDB files from console-components
function copyDuckDBFiles() {
  return {
    name: 'copy-duckdb-files',
    buildStart() {
      const consoleComponentsPath = resolve(__dirname, '../console-components/public');
      const targetPath = resolve(__dirname, 'public');

      // Copy DuckDB files if they exist in console-components
      if (existsSync(consoleComponentsPath)) {
        try {
          // Ensure target directories exist
          mkdirSync(resolve(targetPath, 'duckdb'), { recursive: true });

          // Copy WASM files
          const duckdbFiles = [
            'duckdb-browser-coi.pthread.worker.js',
            'duckdb-browser-coi.worker.js',
            'duckdb-browser-eh.worker.js',
            'duckdb-browser-mvp.worker.js',
            'duckdb-coi.wasm',
            'duckdb-eh.wasm',
            'duckdb-mvp.wasm',
          ];

          duckdbFiles.forEach((file) => {
            const src = resolve(consoleComponentsPath, 'duckdb', file);
            const dest = resolve(targetPath, 'duckdb', file);
            if (existsSync(src)) {
              copyFileSync(src, dest);
              console.log(`Copied DuckDB file: ${file}`);
            }
          });

          // Copy worker wrapper
          const wrapperSrc = resolve(consoleComponentsPath, 'duckdb-worker-wrapper.js');
          const wrapperDest = resolve(targetPath, 'duckdb-worker-wrapper.js');
          if (existsSync(wrapperSrc)) {
            copyFileSync(wrapperSrc, wrapperDest);
            console.log('Copied DuckDB worker wrapper');
          }
        } catch (error) {
          console.warn('Could not copy DuckDB files from console-components:', error.message);
        }
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
      VueRouter({
        dts: 'src/typed-router.d.ts',
      }),
      Layouts(),
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
