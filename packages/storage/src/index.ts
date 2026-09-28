/**
 * @handle/storage — adam:// object store + FS bridge
 *
 * TODO(Stage 3): adam://mem|files|tools layout, 2 GB hard quota, soft warn at 80%.
 * See BUILD_SPEC.md §4 "Stage 3". Do not implement ahead of earlier stage gates.
 */

export const PACKAGE = '@handle/storage';
export const STAGE = 3;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
