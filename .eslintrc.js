/**
 * .eslint.js
 *
 * ESLint configuration file.
 */

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['vuetify', '@vue/eslint-config-typescript', './.eslintrc-auto-import.json', 'prettier'],
  rules: {
    'vue/multi-word-component-names': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
  },
};
