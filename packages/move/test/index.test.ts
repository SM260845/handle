import { describe, expect, it } from 'vitest';
import { PACKAGE, STAGE, status } from '../src/index.js';

describe('@handle/move', () => {
  it('is a Stage 8 stub', () => {
    expect(PACKAGE).toBe('@handle/move');
    expect(STAGE).toBe(8);
    expect(status().implemented).toBe(false);
  });
});
