# Getting started

> Pre-alpha. Claim is not live yet — Stage 0 (foundations) is the current gate.

## Prerequisites

- Node.js **22+** (see `.nvmrc`)
- [pnpm](https://pnpm.io) 9+

## Clone and check

```bash
git clone https://github.com/ao3575911/handle.git
cd handle
pnpm install
pnpm check
```

## CLI (stubs)

```bash
pnpm --filter handle build
node packages/cli/dist/bin.js --help
# or, once published: npx handle claim @adam
```

Today every command prints `not implemented yet (Stage N)` and exits non-zero. That is intentional until the matching stage ships.

## Read next

1. [`BUILD_SPEC.md`](https://github.com/ao3575911/handle/blob/main/BUILD_SPEC.md) — hero Claim, limits, stages
2. [`AGENTS.md`](https://github.com/ao3575911/handle/blob/main/AGENTS.md) — rules for AI coding agents
3. [`CONTRIBUTING.md`](https://github.com/ao3575911/handle/blob/main/CONTRIBUTING.md)
