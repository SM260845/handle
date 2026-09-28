/**
 * @handle/registry — Handle reservation + DNS/email maps
 *
 * TODO(Stage 1): Reserve/release @name (3-24 chars, [a-z0-9_], reserved list), atomic reserve, claim rate limits.
 * See BUILD_SPEC.md §4 "Stage 1". Do not implement ahead of earlier stage gates.
 */

export const PACKAGE = '@handle/registry';
export const STAGE = 1;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
