import { describe, expect, it } from 'vitest';
import { PACKAGE, STAGE, status } from '../src/index.js';

describe('@handle/sdk', () => {
  it('is a Stage 9 stub', () => {
    expect(PACKAGE).toBe('@handle/sdk');
    expect(STAGE).toBe(9);
    expect(status().implemented).toBe(false);
  });
});
