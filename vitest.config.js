import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'vendor/**',
        'tests/**',
        '**/*.config.js'
      ]
    },
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js']
  },
  resolve: {
    alias: {
      'interactjs': './vendor/interact-module.js'
    }
  }
});