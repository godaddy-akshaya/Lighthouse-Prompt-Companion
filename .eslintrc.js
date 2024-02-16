module.exports = {
  plugins: ['prettier', 'import'],
  env: {
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
  },
  extends: ['eslint:recommended', 'godaddy', 'plugin:prettier/recommended'],
  rules: {
    camelcase: 'off',
    'import/no-unresolved': [2, { commonjs: true }],
    'import/default': [2],
    'import/no-absolute-path': [2],
    'import/no-useless-path-segments': [2],
    'import/export': [2],
    'import/no-cycle': [2, { ignoreExternal: true }],
  },
};