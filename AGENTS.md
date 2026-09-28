# AGENTS.md — guide for AI coding agents working on `handle`

**Repo:** https://github.com/SM260845/handle
**North star:** Ship **Claim** — `npx handle claim @name` births mail + microVM + profile + receipts in ≤ 60s, and **cannot burn money in a loop**.

Read [`BUILD_SPEC.md`](./BUILD_SPEC.md) fully before writing code beyond Stage 0.

## Layout

```
packages/
  cli/            # `handle` binary (claim/status/ping/move) — Stage 9 hero
  api/            # control plane HTTP API
  registry/       # handle reservation — Stage 1
  orchestrator/   # Firecracker lifecycle — Stage 2
  runtime/        # agent loop + governor — Stage 5
  receipts/       # hash-chained receipts — Stage 6
  mail/           # inbound/outbound email — Stage 4
  storage/        # adam:// — Stage 3
  profile/        # /@name — Stage 6
  quota/          # limits + circuit breaker — Stage 0 (REAL, not a stub)
  move/           # portable identity — Stage 8
  sdk/            # typed client + OpenClaw bridge — Stage 9
apps/web/         # marketing + profile host
infra/firecracker/, infra/terraform/
tests/{unit,integration,chaos}/
docs/             # GitHub Pages source
```

## Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm check      # lint + typecheck + test
pnpm build
```

Node **22+** (`.nvmrc`). Package manager: **pnpm** (`packageManager` field).

## Stage gates (do not skip)

| Stage | Exit (must be green before N+1) |
|---|---|
| 0 | CI green; `@handle/quota` denies a fake over-limit call |
| 1 | Claim `@demo` in staging; duplicate fails; spam blocked |
| 2 | Cold start ≤ 8s P95; idle suspend; Claim can boot a VM in its txn |
| 3 | Read/write round-trip; over-quota write rejected |
| 4 | External Gmail ↔ `name@platform`; send cap enforced |
| 5 | Chaos: tool loop dies at 12; token bomb dies; ping hop ≤ 3 |
| 6 | Action → receipt; public page redacts; hash chain verifies |
| 7 | `@a` ↔ `@b` demo; rate + hop limits |
| 8 | Move staging→staging; old host refuses writes after cutover |
| 9 | Fresh machine claims in ≤ 60s; OpenClaw bridge `good first issue` |
| 10 | Prepaid freeze on empty; abuse desk SLA |

Open the matching `stage:N` issue. Label PRs with `stage:N`. Do **not** implement Stage N+1 code until Stage N exit is met.

## Hard rules for agents

1. **Never bypass `@handle/quota`.** Import from `@handle/quota` (or `packages/quota`). Call `check` / `QuotaCounter.consume` / `circuitBreaker` **before** any work that can spend money (Claim, email, ping, paid model calls, VM start). Fail closed.
2. **No secrets in git, logs, receipts' public fields, or prompts.** Env refs / short-lived secret-manager refs only. Redact in receipts.
3. **Loop / retry caps are code, not prompt text** (see BUILD_SPEC §1 and §7):
   - Max **2** retries on the same failure, then escalate
   - Identical `(tool, args_hash)` within **60s** → blocked
   - Tool calls / turn ≤ **12**; wall-clock soft **45s** / hard **90s**
   - A2A hop depth ≤ **3**; Claim auto-retries ≤ **2**
4. **Claim is atomic or rolled back.** No orphan VMs / half-emails. Prepaid credit check **first**.
5. **Do not write agent prompt glue until Stage 5 governor exists.**
6. **Trust boundary:** control plane never executes user agent code. Agent code runs only inside the microVM.
7. Prefer small, reviewable diffs. Update tests with the code. Keep CI green.

## What "done" looks like for a stage PR

- Acceptance criteria from the stage issue are covered by tests (unit / integration / chaos as specified)
- Usage guards for that stage are enforced via `@handle/quota`
- `pnpm check` passes
- Docs / CHANGELOG updated when user-facing

## Out of scope (v0.1–v0.3)

Multi-tenant shared agents, custom domain email, full OpenClaw fork, mobile apps, billing UI beyond prepaid credits, federated DNS / blockchain identity, any path that creates an agent without a handle.
