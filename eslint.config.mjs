import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  eslintConfigPrettier,
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'script',
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    ignores: [
      '*.gen.ts',
      'openapi',
      'release-please',
      '.github',
      'justfile',
      'CHANGELOG.md',
      '.vscode/*',
      '!.vscode/settings.json',
      '!.vscode/tasks.json',
      '!.vscode/launch.json',
      '!.vscode/extensions.json',
      '!.vscode/*.code-snippets',
      '.history/',
      '*.vsix',
      '.ionide',
      'test/',
      'node_modules/',
      'npm-debug.log',
      'dist/',
      '.DS_Store',
      'debug/',
      'target/',
      'Cargo.lock',
      '**/*.rs.bk',
      '*.pdb',
      'rust-project.json',
      '.env.azure',
      'console-rs',
      'public/**',
      '**/duckdb-worker-wrapper.js',
      '**/duckdb*.js',
      '**/duckdb*.wasm',
    ],
  },
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/valid-v-slot': 'off',
    },
  },
];
