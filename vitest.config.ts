import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const pkg = (p: string) => fileURLToPath(new URL(`./packages/${p}`, import.meta.url));

export default defineConfig({
  resolve: {
    // Test against workspace sources, not built dist/.
    alias: [
      { find: '@handle/registry/sqlite', replacement: pkg('registry/src/sqlite-store.ts') },
      { find: /^@handle\/([a-z]+)$/, replacement: pkg('$1/src/index.ts') },
    ],
  },
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 10_000,
  },
});
