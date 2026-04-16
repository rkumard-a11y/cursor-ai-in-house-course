// Mirror of the repository root `eslint.config.js` for the qa-automation layout.
// ESLint 9 resolves the configuration base path to the directory that contains the
// active config file, so linting `src/` is done from the repo root using the root
// `eslint.config.js` (see `scripts/run-all-qa.sh`). Keep this file aligned with
// ../../eslint.config.js when rules change.
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
