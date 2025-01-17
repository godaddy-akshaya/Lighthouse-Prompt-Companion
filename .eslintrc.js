module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'plugin:react/recommended',
    'godaddy',
    'plugin:@godaddy/react-intl/recommended',
    'next'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12, // ES2021
    sourceType: 'module'
  },
  plugins: [
    'react'
  ],
  ignorePatterns: [
    "**/*.d.ts",
    "**/*.js",
    "**/build/",
    "**/cdk.out/",
    "**/coverage/",
    "**/node_modules/",
    '**/dist/',
    '**/lib/',
    'test/'
  ],
  rules: {
    'camelcase': 'off',
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix']
  },
  settings: {
    localeFiles: [
      'public/locales/en-US.json']
  }
};
