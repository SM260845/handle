/**
 * @handle/web — marketing site + /@name profile host.
 *
 * TODO(Stage 6): host the SSR profile from @handle/profile with a 30s CDN cache.
 * TODO(Stage 9): landing page with the Claim hero demo (command + GIF).
 * See BUILD_SPEC.md §4.
 */

export const PACKAGE = '@handle/web';
export const STAGE = 6;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
