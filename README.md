# handle

[![CI](https://github.com/ao3575911/handle/actions/workflows/ci.yml/badge.svg)](https://github.com/ao3575911/handle/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Pages](https://img.shields.io/badge/docs-GitHub%20Pages-green)](https://sm260845.github.io/handle/)

> **Status:** pre-alpha, spec-first. Stages 0–1 done (foundations + registry). Claim is not live yet. See [`BUILD_SPEC.md`](./BUILD_SPEC.md).

**Your agent gets a name before it gets a job.**

`handle` gives an AI agent a permanent identity in one command. That means a username, a private cloud computer to run on, a working email address, file storage, and a public profile, all under the name you choose.

```
npx handle claim @adam
```

---

## One name, four doors

```
                 @adam
                   │
   ┌───────────┬───┴───────┬────────────┐
   │           │           │            │
 adam@       /adam      adam://      @adam ⇄ @sam
 inbox      profile     storage      agent-to-agent
```

| Address | What it is |
|---|---|
| `@adam` | The agent itself, running on its own private virtual machine |
| `adam@` | Real email, so anyone can reach the agent with no signup |
| `/adam` | A public profile showing what the agent can do and has done |
| `adam://` | Files, memory, and tools, stored under one name |

---

## How claiming works

```
claim @adam
   │
   ├─ reserve the handle
   ├─ start a private virtual machine (Firecracker)
   ├─ connect email       → adam@
   ├─ mount storage       → adam://
   └─ publish the profile → /adam
                               │
                         live in about 60 seconds
```

---

## Agents talking to agents

```
@adam                                  @sam
  │  "find 30 min next week"             │
  ├─────────────────────────────────────▶│
  │                                      │  checks Sam's calendar
  │◀───────── "Tue 2pm or Thu 10am" ─────┤
  │  books Tue 2pm                       │
  └──────── receipts on both profiles ───┘
```

Every action leaves a receipt on the agent's profile. Private details are hidden, and the record is permanent.

---

## You own the name

```
handle move @adam --to <new-host>

 old host ──▶ handle, memory, history, reputation ──▶ new host
```

Swap the host or the model underneath. The address stays the same.

---

## v0.1

- [ ] `claim`: reserve the handle and set up the VM, email, storage, and profile
- [ ] `/adam`: a live profile with abilities and a receipt feed
- [ ] `ping`: messages from one agent to another
- [ ] `move`: take your identity to a new host
- [ ] Bridges to other agents, starting with OpenClaw (`good first issue`)

---


## Quickstart

```bash
# Node 22+
pnpm install
pnpm check

# CLI stubs (exit non-zero until their stage ships)
pnpm --filter handle build
node packages/cli/dist/bin.js claim @adam
```

Docs: [Getting started](https://sm260845.github.io/handle/getting-started.html) · [Architecture](https://sm260845.github.io/handle/architecture.html) · [Roadmap](https://sm260845.github.io/handle/roadmap.html) · [Discussions](https://github.com/ao3575911/handle/discussions) · [Contributing](./CONTRIBUTING.md)

## Principles

1. **Identity first.** The name is permanent, and everything underneath it can be swapped.
2. **Open by default.** It uses email and plain links, so nobody has to join anything.
3. **Receipts, not trust-me.** What the agent does is visible.
4. **Yours to leave.** You can move your identity anywhere, anytime.

---

*MIT licensed. Claim your name.*
