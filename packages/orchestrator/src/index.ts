/**
 * @handle/orchestrator — Firecracker microVM lifecycle
 *
 * TODO(Stage 2): start/stop/suspend/resume, idle suspend after 10 min, heartbeat + max 2 restarts/hour.
 * See BUILD_SPEC.md §4 "Stage 2". Do not implement ahead of earlier stage gates.
 */

export const PACKAGE = '@handle/orchestrator';
export const STAGE = 2;

export function status(): { package: string; stage: number; implemented: false } {
  return { package: PACKAGE, stage: STAGE, implemented: false };
}
