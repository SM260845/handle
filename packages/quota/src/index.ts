/**
 * @handle/quota — limits, circuit breakers, dedup.
 *
 * Stage 0 (implemented): typed limit table + `check()` that denies over-limit calls,
 * an in-memory windowed counter, a dedup guard, and the budget circuit breaker.
 * TODO(Stage 1+): persist counters (QuotaCounter table) and wire into every mutating route.
 * Every code path that can burn money MUST go through this package. See BUILD_SPEC.md §1.
 */

import { DEDUP_WINDOW_MS, LIMITS, type Limit, type LimitKey } from './limits.js';

export * from './limits.js';

export type Decision =
  | { allowed: true; key: LimitKey; remaining: number; warn?: 'soft-limit' }
  | { allowed: false; key: LimitKey; remaining: 0; reason: string };

export interface CheckInput {
  /** Amount already used in the current window (or current value for ceilings). */
  used: number;
  /** Amount this call wants to add. Defaults to 1. */
  requested?: number;
}

/** Pure check against the limit table. Denies anything that would exceed the (hard) max. */
export function check(
  key: LimitKey,
  input: CheckInput,
  limits: Record<LimitKey, Limit> = LIMITS,
): Decision {
  const limit = limits[key];
  const requested = input.requested ?? 1;
  if (
    !Number.isFinite(input.used) ||
    !Number.isFinite(requested) ||
    input.used < 0 ||
    requested < 0
  ) {
    return { allowed: false, key, remaining: 0, reason: `invalid quota input for ${key}` };
  }
  const max = limit.kind === 'soft-hard' ? limit.hard : limit.max;
  const next = input.used + requested;
  if (next > max) {
    return {
      allowed: false,
      key,
      remaining: 0,
      reason: `limited:${key} (${next} > ${max}; ${limit.purpose})`,
    };
  }
  const remaining = max - next;
  if (limit.kind === 'soft-hard' && next > limit.soft) {
    return { allowed: true, key, remaining, warn: 'soft-limit' };
  }
  return { allowed: true, key, remaining };
}

/** Wired-in, in-memory windowed counters. Stage 1 replaces the store with a DB table. */
export class QuotaCounter {
  private readonly counters = new Map<string, { used: number; resetAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  /** Checks and, if allowed, records usage. `scope` is e.g. a handle id or account id. */
  consume(scope: string, key: LimitKey, requested = 1): Decision {
    const limit = LIMITS[key] as Limit;
    const id = `${scope}:${key}`;
    const t = this.now();
    let entry = this.counters.get(id);
    if (limit.kind === 'rate' && typeof limit.window === 'number') {
      if (!entry || t >= entry.resetAt) entry = { used: 0, resetAt: t + limit.window };
    } else if (!entry) {
      entry = { used: 0, resetAt: Number.POSITIVE_INFINITY };
    }
    const decision = check(key, { used: entry.used, requested });
    if (decision.allowed) entry.used += requested;
    this.counters.set(id, entry);
    return decision;
  }

  /** Reset per-turn counters (window === 'turn') for a scope. */
  endTurn(scope: string): void {
    for (const [key, limit] of Object.entries(LIMITS) as [LimitKey, Limit][]) {
      if (limit.kind === 'rate' && limit.window === 'turn') this.counters.delete(`${scope}:${key}`);
    }
  }
}

/** Blocks identical (tool, args_hash) within DEDUP_WINDOW_MS. */
export class DedupGuard {
  private readonly seen = new Map<string, number>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly windowMs: number = DEDUP_WINDOW_MS,
  ) {}

  allow(tool: string, argsHash: string): boolean {
    const id = `${tool}\u0000${argsHash}`;
    const t = this.now();
    const last = this.seen.get(id);
    if (last !== undefined && t - last < this.windowMs) return false;
    this.seen.set(id, t);
    return true;
  }
}

export type OutboundAction = 'email' | 'ping' | 'paid_model_call' | 'claim';

export interface BudgetState {
  projectedDailySpend: number;
  prepaidBalance: number;
}

/**
 * Budget circuit breaker: if projected daily spend > prepaid balance (or balance is empty),
 * freeze outbound actions and refuse Claim. Profile and local reads stay up.
 */
export function circuitBreaker(state: BudgetState): {
  frozen: boolean;
  allows: (action: OutboundAction) => boolean;
} {
  const frozen = state.prepaidBalance <= 0 || state.projectedDailySpend > state.prepaidBalance;
  return { frozen, allows: () => !frozen };
}
