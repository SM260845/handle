/**
 * handle CLI — `handle` binary + `npx handle`.
 *
 * TODO(Stage 9): `claim` happy path meeting the Hero acceptance table (BUILD_SPEC.md "Hero feature").
 * Commands are stubs that exit non-zero until their stage ships.
 */

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

/** Runs the CLI and returns the process exit code. */
export function run(argv: readonly string[], io: Io = defaultIo): number {
  const [cmd] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    io.out(usage());
    return cmd ? 0 : 1;
  }
  if (Object.hasOwn(COMMANDS, cmd)) {
    const { stage } = COMMANDS[cmd as CommandName];
    io.err(`handle ${cmd}: not implemented yet (Stage ${stage})`);
    return 2;
  }
  io.err(`handle: unknown command "${cmd}"\n\n${usage()}`);
  return 1;
}
