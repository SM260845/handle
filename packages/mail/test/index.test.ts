import { describe, expect, it } from 'vitest';
import { PACKAGE, STAGE, status } from '../src/index.js';

describe('@handle/mail', () => {
  it('is a Stage 4 stub', () => {
    expect(PACKAGE).toBe('@handle/mail');
    expect(STAGE).toBe(4);
    expect(status().implemented).toBe(false);
  });
});
