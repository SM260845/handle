/**
 * @handle/sdk — Typed client for bridges (OpenClaw later)
 *
 * TODO(Stage 9): Typed client + `fromOpenClawSession` behind a feature flag.
 * See BUILD_SPEC.md §4 "Stage 9". Do not implement ahead of earlier stage gates.
 */

export const PACKAGE = '@handle/sdk';
export const STAGE = 9;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
