import { describe, expect, it } from 'vitest';
import { RESERVED_NAMES, normalizeName, validateName } from '../src/index.js';

describe('name rules', () => {
  it.each(['demo', '@demo', ' @Demo ', 'abc', 'a_b_c', 'agent007', 'x'.repeat(24)])(
    'accepts %j',
    (n) => {
      expect(validateName(n).ok).toBe(true);
    },
  );

  it.each([
    ['ab', 'invalid_name'],
    ['x'.repeat(25), 'invalid_name'],
    ['has-dash', 'invalid_name'],
    ['has.dot', 'invalid_name'],
    ['spa ce', 'invalid_name'],
    ['émoji', 'invalid_name'],
    ['@@demo', 'invalid_name'],
    ['', 'invalid_name'],
  ])('rejects %j (%s)', (n, code) => {
    const r = validateName(n);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe(code);
  });

  it.each(['admin', 'root', 'api', 'www', 'mail', 'support', 'handle', '@Admin', 'postmaster'])(
    'rejects reserved %j',
    (n) => {
      const r = validateName(n);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.code).toBe('reserved');
    },
  );

  it('normalizes', () => {
    expect(normalizeName('  @Adam ')).toBe('adam');
  });

  it('reserved list entries are themselves lowercase', () => {
    for (const n of RESERVED_NAMES) expect(n).toBe(n.toLowerCase());
  });
});
