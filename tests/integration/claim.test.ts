import { describe, it } from 'vitest';

// TODO(Stage 2-9): end-to-end Claim → boot → mail → receipt against staging.
describe('integration: claim', () => {
  it.todo('claims @demo, boots a VM, receives mail, and publishes a receipt in <= 60s');
  it.todo('rolls back the handle reservation if the mail or VM step fails');
});
