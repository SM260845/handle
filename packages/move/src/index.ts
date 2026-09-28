/**
 * @handle/move — Export/import portable identity bundle
 *
 * TODO(Stage 8): Export keys, memory snapshot, receipt chain, mail aliases; verify chain on import; cutover <= 24h.
 * See BUILD_SPEC.md §4 "Stage 8". Do not implement ahead of earlier stage gates.
 */

export const PACKAGE = '@handle/move';
export const STAGE = 8;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
