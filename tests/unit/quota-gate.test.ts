import { describe, expect, it, vi } from 'vitest';
import { QuotaCounter, QuotaExceededError, check, guard } from '../../packages/quota/src/index.js';

// Stage 0 exit gate (BUILD_SPEC.md §4): `packages/quota` can deny a fake over-limit call.
describe('Stage 0 gate: quota denies a fake over-limit call', () => {
  it('check() denies an over-limit email send', () => {
    const d = check('emailSendsPerDay', { used: 50 });
    expect(d.allowed).toBe(false);
  });

  it('guard() blocks the 51st fake email send before the work runs', async () => {
    const q = new QuotaCounter(() => 0);
    const fakeSend = vi.fn(() => 'sent');
    for (let i = 0; i < 50; i++) {
      await expect(guard(q, '@demo', 'emailSendsPerDay', fakeSend)).resolves.toBe('sent');
    }
    await expect(guard(q, '@demo', 'emailSendsPerDay', fakeSend)).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
    expect(fakeSend).toHaveBeenCalledTimes(50);
  });

  it('guard() refuses a second claim within a minute', async () => {
    const q = new QuotaCounter(() => 0);
    const fakeClaim = vi.fn(() => 'claimed');
    await guard(q, 'acct', 'claimsPerMinute', fakeClaim);
    await expect(guard(q, 'acct', 'claimsPerMinute', fakeClaim)).rejects.toThrow(
      /limited:claimsPerMinute/,
    );
    expect(fakeClaim).toHaveBeenCalledTimes(1);
  });
});
