// Legacy ESLint configuration file for CI/CD workflows
// This file is kept for compatibility with older ESLint tooling in workflows
// The main configuration is in eslint.config.js (ESLint flat config format)

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs'
  },
  ignorePatterns: ['node_modules', 'coverage', 'dist', 'build', '*.min.js', 'public', '.github', 'src-react'],
  rules: {
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single', { avoidEscape: true }],
    semi: ['error', 'always'],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'eol-last': ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true }]
  }
};
