// ESLint 9 flat config — js + typescript-eslint recommended + react-hooks.
// Prettier (eslint-config-prettier, TERAKHIR) mematikan formatting rules.
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Konten pihak ketiga / dokumentasi — bukan kode kita:
    // vault Obsidian (bundle plugin JS) + agent skills (Clerk CLI, .agents/.claude)
    // + Prisma generated client (src/generated).
    ignores: [
      'dist/',
      'node_modules/',
      'obs_aplikasi_chat_sederhana/',
      '.agents/',
      '.claude/',
      'src/generated/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  prettierConfig,
);
