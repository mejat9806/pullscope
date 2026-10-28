// ESLint setup ported from Citadel's shared config (packages/eslint-config) and adapted for this repo:
// one workspace, Preact instead of React, no Tailwind, Prettier for layout.
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { baseRules } from './eslint/base-rules.mjs';
import { repoOverrides } from './eslint/overrides.mjs';

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'eslint.config.mjs',
      'eslint/**',
    ],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: {
      eslint,
      '@stylistic': stylistic,
      'simple-import-sort': simpleImportSort,
    },
    extends: [
      'eslint/recommended',
      '@stylistic/recommended',
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { ...baseRules, ...repoOverrides },
  },
]);
