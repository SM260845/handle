/**
 * @handle/registry — handle reservation (Stage 1).
 *
 * - `@name` rules: 3–24 chars, `[a-z0-9_]`, reserved list
 * - Atomic reserve (store UNIQUE constraint) + lease/TTL so abandoned claims auto-release
 * - Claim attempts rate limited via @handle/quota `guard()` before any work
 * SQLite store: `import { SqliteHandleStore } from '@handle/registry/sqlite'` (Node >= 22.5).
 * TODO(Stage 1 follow-up): DNS/email alias maps once the platform domain is chosen.
 */

export * from './names.js';
export * from './store.js';
export * from './registry.js';

export const PACKAGE = '@handle/registry';
export const STAGE = 1;
