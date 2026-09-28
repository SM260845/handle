/**
 * @handle/api — control plane HTTP API.
 *
 * Stage 1: /v1/handles claim / get / release with dev auth stubs.
 * TODO(Stage 1 follow-up): real GitHub OAuth authenticator; persistent idempotency store.
 * TODO(Stage 2+): Claim transaction steps (VM, mail, storage) between reserve and confirm.
 * All mutating routes: auth + idempotency key + quota check BEFORE work (BUILD_SPEC §6).
 */

export * from './auth.js';
export * from './server.js';

export const PACKAGE = '@handle/api';
export const STAGE = 1;
