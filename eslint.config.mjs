import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import { FlatCompat } from '@eslint/eslintrc'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const baseDir = dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({
  baseDirectory: baseDir
})

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'backup-*/**',
      '**/*.corrupted-*.ts',
      '**/*.bak',
      '**/*.backup.*',
      '**/*-backup.*',
      '**/*-original.*'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['**/lib/supabase.ts', '**/lib/types.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off'
    }
  },
  {
    files: ['**/lib/services.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  },
  {
    files: ['**/lib/services/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['**/lib/services/super-admin-dashboard-service.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },
  {
    files: ['**/marketing-service.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off'
    }
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'warn'
    }
  }
)
