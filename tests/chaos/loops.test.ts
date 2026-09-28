import { describe, it } from 'vitest';

// TODO(Stage 5): chaos drills. These must fail CI if the expected kill does not happen.
describe('chaos: loop governor', () => {
  it.todo('infinite tool loop dies at 12 calls');
  it.todo('token bomb dies at budget');
  it.todo('ping storm dies at hop 3');
  it.todo('idle VM suspends after 10 minutes');
});
