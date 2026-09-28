/**
 * handle CLI — `handle` binary + `npx handle`.
 *
 * TODO(Stage 9): full Claim happy path (VM + mail + storage + profile) meeting the Hero table.
 * Stage 1: `claim` can hit a registry API when HANDLE_API_URL + HANDLE_API_TOKEN are set.
 */

import { claimViaApi } from './claim.js';

export const COMMANDS = {
  claim: { stage: 9, summary: 'Reserve @name, provision microVM, wire email + storage + profile' },
  status: { stage: 2, summary: 'Health, spend today, last receipt' },
  ping: { stage: 7, summary: 'Agent-to-agent message with receipts on both profiles' },
  move: { stage: 8, summary: 'Export identity bundle; import on new host' },
} as const;

export type CommandName = keyof typeof COMMANDS;

export interface Io {
  out: (line: string) => void;
  err: (line: string) => void;
}

const defaultIo: Io = {
  out: (l) => process.stdout.write(`${l}\n`),
  err: (l) => process.stderr.write(`${l}\n`),
};

export function usage(): string {
  const lines = Object.entries(COMMANDS).map(
    ([name, c]) => `  ${name.padEnd(8)}${c.summary} (Stage ${c.stage})`,
  );
  return ['Usage: handle <command> [args]', '', 'Commands:', ...lines].join('\n');
}

/** Runs the CLI. May return a Promise when `claim` talks to HANDLE_API_URL. */
export function run(argv: readonly string[], io: Io = defaultIo): number | Promise<number> {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    io.out(usage());
    return cmd ? 0 : 1;
  }
  if (cmd === 'claim') {
    const name = rest[0];
    if (!name) {
      io.err('Usage: handle claim @name');
      return 1;
    }
    return claimViaApi(name, process.env, io);
  }
  if (Object.hasOwn(COMMANDS, cmd)) {
    const { stage } = COMMANDS[cmd as CommandName];
    io.err(`handle ${cmd}: not implemented yet (Stage ${stage})`);
    return 2;
  }
  io.err(`handle: unknown command "${cmd}"\n\n${usage()}`);
  return 1;
}
