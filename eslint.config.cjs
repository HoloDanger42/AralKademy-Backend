module.exports = [
  {
    files: ['*.js'],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      globals: {
        browser: true,
        node: true,
        jest: {
          globals: true,
        },
      },
    },
    plugins: {
      jest: require('eslint-plugin-jest'),
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
]
