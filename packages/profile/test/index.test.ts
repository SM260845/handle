import { describe, expect, it } from 'vitest';
import { PACKAGE, STAGE, status } from '../src/index.js';

describe('@handle/profile', () => {
  it('is a Stage 6 stub', () => {
    expect(PACKAGE).toBe('@handle/profile');
    expect(STAGE).toBe(6);
    expect(status().implemented).toBe(false);
  });
});
