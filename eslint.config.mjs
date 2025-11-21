import nextConfig from 'eslint-config-next';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const eslintConfig = [
  {
    ignores: ['.next/*', 'node_modules/*'],
  },
  ...nextConfig,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
];

export default eslintConfig;
