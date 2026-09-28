import { describe, expect, it } from 'vitest';
import { check } from '../../packages/quota/src/index.js';

// Stage 0 exit gate: packages/quota can deny a fake over-limit call.
describe('Stage 0 gate', () => {
  it('quota denies an over-limit email send', () => {
    expect(check('emailSendsPerDay', { used: 50 }).allowed).toBe(false);
  });
});
