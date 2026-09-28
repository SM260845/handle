/**
 * @handle/profile — /@name SSR + static export
 *
 * TODO(Stage 6): Public profile with abilities + redacted receipt feed, 'claimed with handle' badge.
 * See BUILD_SPEC.md §4 "Stage 6". Do not implement ahead of earlier stage gates.
 */

export const PACKAGE = '@handle/profile';
export const STAGE = 6;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
