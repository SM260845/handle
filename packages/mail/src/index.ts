/**
 * @handle/mail — Inbound/outbound email adapters
 *
 * TODO(Stage 4): MX -> parse -> queue; signed outbound; 50 sends/day, burst 5/min; auto-reply loop kill.
 * See BUILD_SPEC.md §4 "Stage 4". Do not implement ahead of earlier stage gates.
 */

export const PACKAGE = '@handle/mail';
export const STAGE = 4;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
