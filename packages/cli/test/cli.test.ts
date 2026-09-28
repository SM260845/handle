import { describe, expect, it } from 'vitest';
import { COMMANDS, run, type CommandName } from '../src/index.js';

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return { io: { out: (l: string) => out.push(l), err: (l: string) => err.push(l) }, out, err };
}

describe('handle CLI', () => {
  it.each(['status', 'ping', 'move'] as CommandName[])(
    '%s prints "not implemented yet" and exits non-zero',
    async (cmd) => {
      const c = capture();
      const code = await run([cmd], c.io);
      expect(code).not.toBe(0);
      expect(c.err.join('\n')).toBe(
        `handle ${cmd}: not implemented yet (Stage ${COMMANDS[cmd].stage})`,
      );
    },
  );

  it('claim without API env prints Stage 9 stub', async () => {
    const c = capture();
    const prev = { ...process.env };
    delete process.env.HANDLE_API_URL;
    delete process.env.HANDLE_API_TOKEN;
    try {
      const code = await run(['claim', '@adam'], c.io);
      expect(code).toBe(2);
      expect(c.err[0]).toContain('not implemented yet (Stage 9)');
    } finally {
      Object.assign(process.env, prev);
    }
  });

  it('claim is Stage 9', () => {
    expect(COMMANDS.claim.stage).toBe(9);
  });

  it('rejects unknown commands', async () => {
    const c = capture();
    expect(await run(['nope'], c.io)).toBe(1);
  });

  it('prints help', async () => {
    const c = capture();
    expect(await run(['--help'], c.io)).toBe(0);
    expect(c.out.join('\n')).toContain('claim');
  });
});
