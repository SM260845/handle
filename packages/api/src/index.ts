/**
 * @handle/api — Control plane HTTP API
 *
 * TODO(Stage 1): Expose /v1/handles routes with auth + idempotency key + quota check before work.
 * See BUILD_SPEC.md §4 "Stage 1". Do not implement ahead of earlier stage gates.
 */

export const PACKAGE = '@handle/api';
export const STAGE = 1;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
