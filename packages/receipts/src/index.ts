/**
 * @handle/receipts — Append-only, hash-chained receipt store + public filter
 *
 * TODO(Stage 6): Hash-chained receipts, privacy filter (default private).
 * See BUILD_SPEC.md §4 "Stage 6". Do not implement ahead of earlier stage gates.
 */

export const PACKAGE = '@handle/receipts';
export const STAGE = 6;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
