import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@': resolve(currentDir, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['scripts/verify-corpus.test.ts'],
    testTimeout: 600_000,
  },
});
