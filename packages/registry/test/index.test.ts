import { describe, expect, it } from 'vitest';
import { PACKAGE, STAGE, status } from '../src/index.js';

describe('@handle/registry', () => {
  it('is a Stage 1 stub', () => {
    expect(PACKAGE).toBe('@handle/registry');
    expect(STAGE).toBe(1);
    expect(status().implemented).toBe(false);
  });
});
