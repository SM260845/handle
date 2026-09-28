/**
 * Hard usage limits from BUILD_SPEC.md §1 "Hard usage limits".
 * These are product requirements, not niceties. Change them here only, with a spec update.
 */

export const SECOND = 1_000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const MB = 1024 * 1024;
export const GB = 1024 * MB;

/** A counter that resets every `windowMs` (per turn when `windowMs` is `'turn'`). */
export interface RateLimit {
  readonly kind: 'rate';
  readonly max: number;
  readonly window: number | 'turn';
  readonly purpose: string;
}

/** A static ceiling (resources, sizes, depths). `used + requested` must stay `<= max`. */
export interface CeilingLimit {
  readonly kind: 'ceiling';
  readonly max: number;
  readonly unit: 'count' | 'bytes' | 'ms' | 'vcpu';
  readonly purpose: string;
}

/** A soft/hard pair (e.g. wall-clock). Over soft: no new work. Over hard: kill. */
export interface SoftHardLimit {
  readonly kind: 'soft-hard';
  readonly soft: number;
  readonly hard: number;
  readonly unit: 'ms' | 'bytes';
  readonly purpose: string;
}

export type Limit = RateLimit | CeilingLimit | SoftHardLimit;

export const LIMITS = {
  turnWallClock: {
    kind: 'soft-hard',
    soft: 45 * SECOND,
    hard: 90 * SECOND,
    unit: 'ms',
    purpose: 'Stop runaway tools',
  },
  toolCallsPerTurn: { kind: 'rate', max: 12, window: 'turn', purpose: 'Cap thrashing' },
  tokensInPerTurn: { kind: 'rate', max: 32_000, window: 'turn', purpose: 'Cap chat cost' },
  tokensOutPerTurn: { kind: 'rate', max: 4_000, window: 'turn', purpose: 'Cap chat cost' },
  tokensPerDay: { kind: 'rate', max: 500_000, window: DAY, purpose: 'Cap daily spend' },
  pingsPerHour: { kind: 'rate', max: 20, window: HOUR, purpose: 'Anti-spam (outbound a2a)' },
  emailSendsPerDay: { kind: 'rate', max: 50, window: DAY, purpose: 'Anti-spam / provider caps' },
  emailSendsPerMinute: { kind: 'rate', max: 5, window: MINUTE, purpose: 'Burst cap (Stage 4)' },
  receiptWritesPerMinute: { kind: 'rate', max: 30, window: MINUTE, purpose: 'Log flood' },
  vmCpu: { kind: 'ceiling', max: 1, unit: 'vcpu', purpose: 'Cost floor' },
  vmRam: { kind: 'ceiling', max: 512 * MB, unit: 'bytes', purpose: 'Cost floor' },
  vmDisk: { kind: 'ceiling', max: 2 * GB, unit: 'bytes', purpose: 'Cost floor' },
  idleSuspend: { kind: 'ceiling', max: 10 * MINUTE, unit: 'ms', purpose: 'Stop idle burn' },
  coldStartP95: { kind: 'ceiling', max: 8 * SECOND, unit: 'ms', purpose: 'UX gate' },
  concurrentVmsPerUser: {
    kind: 'ceiling',
    max: 1,
    unit: 'count',
    purpose: 'One handle = one machine',
  },
  vmRestartsPerHour: { kind: 'rate', max: 2, window: HOUR, purpose: 'No auto-restart loop' },
  retriesSameFailure: { kind: 'ceiling', max: 2, unit: 'count', purpose: 'Kill loops' },
  a2aHopDepth: { kind: 'ceiling', max: 3, unit: 'count', purpose: 'Bound agent recursion' },
  pingPayload: { kind: 'ceiling', max: 8 * 1024, unit: 'bytes', purpose: 'Bound a2a payloads' },
  storage: {
    kind: 'soft-hard',
    soft: Math.floor(2 * GB * 0.8),
    hard: 2 * GB,
    unit: 'bytes',
    purpose: 'Storage quota (warn at 80%)',
  },
  claimsPerDay: { kind: 'rate', max: 5, window: DAY, purpose: 'Anti land-grab abuse' },
  claimsPerMinute: { kind: 'rate', max: 1, window: MINUTE, purpose: 'Anti land-grab abuse' },
} as const satisfies Record<string, Limit>;

export type LimitKey = keyof typeof LIMITS;

/** Identical (tool, args_hash) within this window is blocked. */
export const DEDUP_WINDOW_MS = 60 * SECOND;
