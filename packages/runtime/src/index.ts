/**
 * @handle/runtime — Agent loop + loop governor inside the microVM
 *
 * TODO(Stage 5): Plan -> tool -> observe -> reply loop with governor enforcing wall-clock, tool, token, dedup, retry caps.
 * See BUILD_SPEC.md §4 "Stage 5". Do not implement ahead of earlier stage gates.
 */

export const PACKAGE = '@handle/runtime';
export const STAGE = 5;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
