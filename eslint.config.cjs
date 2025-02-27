module.exports = [
  {
    files: ['*.js'],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      globals: {
        browser: true,
        node: true,
        jest: true,
        describe: true,
        it: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
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
