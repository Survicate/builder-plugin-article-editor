import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import react from 'eslint-plugin-react';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tsRules = {
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  ],
  'no-shadow': 'off',
  '@typescript-eslint/no-shadow': 'error',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/no-non-null-assertion': 'warn',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/prefer-includes': 'error',
  '@typescript-eslint/prefer-string-starts-ends-with': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-require-imports': 'error',
  '@typescript-eslint/prefer-as-const': 'error',
  '@typescript-eslint/no-empty-function': 'warn',
  '@typescript-eslint/no-inferrable-types': 'error',
  '@typescript-eslint/prefer-function-type': 'error',
  '@typescript-eslint/prefer-readonly': 'error',
  '@typescript-eslint/require-array-sort-compare': 'error',
  '@typescript-eslint/restrict-plus-operands': 'error',
  '@typescript-eslint/restrict-template-expressions': 'warn',
  '@typescript-eslint/strict-boolean-expressions': 'off',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/unbound-method': 'error',
  '@typescript-eslint/unified-signatures': 'error',
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  '@typescript-eslint/consistent-type-exports': 'error',
};

export default [
  {
    ignores: ['dist/*', 'dev-dist/*', 'node_modules/*', 'coverage/*'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true, modules: true },
      },
      sourceType: 'module',
    },
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
      react,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'arrow-parens': 'off',
      camelcase: 'off',
      'consistent-return': 'off',
      'default-case-last': 'error',
      'func-style': ['warn', 'expression'],

      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'if' },
        { blankLine: 'always', prev: 'if', next: '*' },
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'multiline-const', next: 'expression' },
      ],

      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        { allowSameFolder: true, prefix: '@', rootDir: 'src' },
      ],
      'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      'no-constant-condition': 'off',
      'no-nested-ternary': 'off',
      'no-promise-executor-return': 'error',
      'no-shadow': 'off',
      'no-underscore-dangle': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-use-before-define': 'off',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'prefer-destructuring': ['error', { array: false, object: true }],
      'no-duplicate-imports': 'error',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'no-useless-escape': 'error',
      'object-curly-newline': 'off',
      'simple-import-sort/imports': [
        'error',
        { groups: [['^\\u0000', '^node:', '^@?\\w', '^', '^\\.', '.css$']] },
      ],
      'sort-keys': ['warn', 'asc', { caseSensitive: true, minKeys: 2, natural: false }],
      yoda: ['error', 'never', { exceptRange: true }],
      'react/jsx-curly-brace-presence': ['error', { children: 'never', props: 'never' }],
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/self-closing-comp': 'error',
    },
    settings: { react: { version: '16.14' } },
  },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['**/*.{ts,tsx}'] })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2022,
        project: './tsconfig.json',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
      },
    },
    rules: tsRules,
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2022,
        project: false,
        sourceType: 'module',
      },
    },
    rules: {
      ...tsRules,
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-includes': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/require-array-sort-compare': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/switch-exhaustiveness-check': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
    },
  },
  {
    files: ['**/*.config.{js,mjs,ts}', '**/*.cjs'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        module: 'writable',
        process: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'func-style': 'off',
      'no-underscore-dangle': 'off',
      'sort-keys': 'off',
    },
  },
  eslintConfigPrettier,
];
