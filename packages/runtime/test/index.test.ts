import { describe, expect, it } from 'vitest';
import { PACKAGE, STAGE, status } from '../src/index.js';

describe('@handle/runtime', () => {
  it('is a Stage 5 stub', () => {
    expect(PACKAGE).toBe('@handle/runtime');
    expect(STAGE).toBe(5);
    expect(status().implemented).toBe(false);
  });
});
