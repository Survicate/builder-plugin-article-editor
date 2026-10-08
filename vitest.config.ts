import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@builder.io/app-context': resolve(currentDir, 'src/testing/builderAppContextStub.ts'),
      '@': resolve(currentDir, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', 'scripts/**'],
    globals: true,
  },
});
