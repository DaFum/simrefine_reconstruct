import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
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
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
    exclude: ['tests/e2e/**', '**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**'],
    maxWorkers: 1
  },
  resolve: {
    alias: {
      'interactjs': path.resolve(__dirname, './vendor/interact-module.js')
    }
  }
});
