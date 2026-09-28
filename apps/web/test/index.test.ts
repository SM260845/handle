import { describe, expect, it } from 'vitest';
import { PACKAGE, status } from '../src/index.js';

describe('@handle/web', () => {
  it('is a stub', () => {
    expect(PACKAGE).toBe('@handle/web');
    expect(status().implemented).toBe(false);
  });
});
