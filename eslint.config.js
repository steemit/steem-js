import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',
      'no-console': 'off',
      'no-prototype-builtins': 'warn',
      'prefer-rest-params': 'warn',
      'no-useless-catch': 'warn',
      'prefer-const': 'warn',
      'no-constant-condition': 'warn',
      'no-control-regex': 'warn',
      'no-empty': 'warn'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts']
  }
);

