module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    '@typescript-eslint/no-namespace': ['off'],
    '@typescript-eslint/ban-types': ['off'],
    '@typescript-eslint/no-explicit-any': ['off'],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'no-multiple-empty-lines': ['off'],
    'object-curly-spacing': ['error', 'always'],
  },
};
