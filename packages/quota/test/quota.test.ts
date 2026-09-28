import { describe, expect, it } from 'vitest';
import {
  DEDUP_WINDOW_MS,
  DedupGuard,
  GB,
  LIMITS,
  MINUTE,
  QuotaCounter,
  check,
  circuitBreaker,
} from '../src/index.js';

describe('limit table', () => {
  it('matches BUILD_SPEC.md §1 defaults', () => {
    expect(LIMITS.toolCallsPerTurn.max).toBe(12);
    expect(LIMITS.tokensInPerTurn.max).toBe(32_000);
    expect(LIMITS.tokensOutPerTurn.max).toBe(4_000);
    expect(LIMITS.tokensPerDay.max).toBe(500_000);
    expect(LIMITS.pingsPerHour.max).toBe(20);
    expect(LIMITS.emailSendsPerDay.max).toBe(50);
    expect(LIMITS.receiptWritesPerMinute.max).toBe(30);
    expect(LIMITS.turnWallClock).toMatchObject({ soft: 45_000, hard: 90_000 });
    expect(LIMITS.vmDisk.max).toBe(2 * GB);
    expect(LIMITS.idleSuspend.max).toBe(10 * MINUTE);
    expect(LIMITS.concurrentVmsPerUser.max).toBe(1);
    expect(LIMITS.retriesSameFailure.max).toBe(2);
    expect(LIMITS.claimsPerDay.max).toBe(5);
    expect(LIMITS.claimsPerMinute.max).toBe(1);
    expect(DEDUP_WINDOW_MS).toBe(60_000);
  });
});

describe('check()', () => {
  it('allows calls within the limit', () => {
    expect(check('toolCallsPerTurn', { used: 11 })).toMatchObject({ allowed: true, remaining: 0 });
  });

  it('denies a fake over-limit call (Stage 0 exit)', () => {
    const d = check('toolCallsPerTurn', { used: 12 });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toContain('limited:toolCallsPerTurn');
  });

  it('denies bulk requests that would cross the limit', () => {
    expect(check('tokensInPerTurn', { used: 30_000, requested: 5_000 }).allowed).toBe(false);
  });

  it('warns past soft limit and denies past hard limit', () => {
    expect(check('turnWallClock', { used: 50_000, requested: 0 })).toMatchObject({
      allowed: true,
      warn: 'soft-limit',
    });
    expect(check('turnWallClock', { used: 90_001, requested: 0 }).allowed).toBe(false);
  });

  it('fails closed on invalid input', () => {
    expect(check('emailSendsPerDay', { used: Number.NaN }).allowed).toBe(false);
    expect(check('emailSendsPerDay', { used: 0, requested: -1 }).allowed).toBe(false);
  });
});

describe('QuotaCounter', () => {
  it('enforces claim rate limits and resets after the window', () => {
    let t = 0;
    const q = new QuotaCounter(() => t);
    expect(q.consume('acct', 'claimsPerMinute').allowed).toBe(true);
    expect(q.consume('acct', 'claimsPerMinute').allowed).toBe(false);
    t += MINUTE;
    expect(q.consume('acct', 'claimsPerMinute').allowed).toBe(true);
  });

  it('stops an infinite tool loop at 12 calls and resets per turn', () => {
    const q = new QuotaCounter(() => 0);
    let calls = 0;
    while (q.consume('h1', 'toolCallsPerTurn').allowed) calls++;
    expect(calls).toBe(12);
    q.endTurn('h1');
    expect(q.consume('h1', 'toolCallsPerTurn').allowed).toBe(true);
  });

  it('isolates scopes', () => {
    const q = new QuotaCounter(() => 0);
    expect(q.consume('a', 'concurrentVmsPerUser').allowed).toBe(true);
    expect(q.consume('a', 'concurrentVmsPerUser').allowed).toBe(false);
    expect(q.consume('b', 'concurrentVmsPerUser').allowed).toBe(true);
  });
});

describe('DedupGuard', () => {
  it('blocks identical tool+args within 60s', () => {
    let t = 0;
    const g = new DedupGuard(() => t);
    expect(g.allow('send_email', 'abc')).toBe(true);
    expect(g.allow('send_email', 'abc')).toBe(false);
    expect(g.allow('send_email', 'def')).toBe(true);
    t += 60_000;
    expect(g.allow('send_email', 'abc')).toBe(true);
  });
});

describe('circuitBreaker()', () => {
  it('freezes outbound and Claim when projected spend exceeds balance', () => {
    const cb = circuitBreaker({ projectedDailySpend: 12, prepaidBalance: 10 });
    expect(cb.frozen).toBe(true);
    expect(cb.allows('claim')).toBe(false);
    expect(cb.allows('email')).toBe(false);
  });

  it('refuses Claim on an empty balance', () => {
    expect(circuitBreaker({ projectedDailySpend: 0, prepaidBalance: 0 }).allows('claim')).toBe(
      false,
    );
  });

  it('allows actions within budget', () => {
    expect(circuitBreaker({ projectedDailySpend: 1, prepaidBalance: 10 }).allows('ping')).toBe(
      true,
    );
  });
});
