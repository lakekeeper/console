import { defaultPlugins } from '@hey-api/openapi-ts';

export default {
  input: 'https://get.heyapi.dev/hey-api/backend',
  output: 'src/client',
  plugins: [
    ...defaultPlugins,
    '@hey-api/client-fetch',
    '@hey-api/transformers',
    {
      name: '@hey-api/sdk',
      transformer: true,
    },
    {
      name: '@hey-api/transformers',
      bigInt: true,
    },
  ],
};
