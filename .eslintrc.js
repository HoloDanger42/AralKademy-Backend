module.exports = {
    env: {
      browser: true,
      es2021: true,
      'jest/globals': true,
    },
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: ['jest'],
    rules: {
      'prettier/prettier': 'error', // Prettier will show as an error in VS Code
    },
  }