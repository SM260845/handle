import { describe, expect, it } from 'vitest';
import { PACKAGE, STAGE, status } from '../src/index.js';

describe('@handle/receipts', () => {
  it('is a Stage 6 stub', () => {
    expect(PACKAGE).toBe('@handle/receipts');
    expect(STAGE).toBe(6);
    expect(status().implemented).toBe(false);
  });
});
