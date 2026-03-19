const tsParser = require('@typescript-eslint/parser')
const tseslint = require('@typescript-eslint/eslint-plugin')

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module'
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      'no-unused-vars': 'warn'
    }
  }
]
