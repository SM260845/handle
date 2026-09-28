import { describe, expect, it } from 'vitest';
import { COMMANDS, run, type CommandName } from '../src/index.js';

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return { io: { out: (l: string) => out.push(l), err: (l: string) => err.push(l) }, out, err };
}

describe('handle CLI', () => {
  it.each(Object.keys(COMMANDS) as CommandName[])(
    '%s prints "not implemented yet" and exits non-zero',
    (cmd) => {
      const c = capture();
      const code = run([cmd, '@adam'], c.io);
      expect(code).not.toBe(0);
      expect(c.err.join('\n')).toBe(
        `handle ${cmd}: not implemented yet (Stage ${COMMANDS[cmd].stage})`,
      );
    },
  );

  it('claim is Stage 9', () => {
    expect(COMMANDS.claim.stage).toBe(9);
  });

  it('rejects unknown commands', () => {
    const c = capture();
    expect(run(['nope'], c.io)).toBe(1);
  });

  it('prints help', () => {
    const c = capture();
    expect(run(['--help'], c.io)).toBe(0);
    expect(c.out.join('\n')).toContain('claim');
  });
});
