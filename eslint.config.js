export default [
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      env: {
        browser: true,
        es2021: true,
        'jest/globals': true,
      },
      plugins: {
        jest: require('eslint-plugin-jest'),
      },
      rules: {
        'prettier/prettier': 'error', // Prettier will show as an error in VS Code
      },
      processor: 'prettier/prettier',
    },
  ];