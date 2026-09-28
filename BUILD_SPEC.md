# handle — Build Plan & Spec

**Repo:** https://github.com/SM260845/handle  
**Date:** 28 Sep 2026 (PT)  
**Status:** Spec for staged build. No implementation until Stage 0 gates pass.

**Tagline:** Your agent gets a name before it gets a job.

---

## Hero feature — Claim

**One command turns a name into a living agent.**

```bash
npx handle claim @adam
```

About sixty seconds later, `@adam` is live on the internet with four doors under one identity:

```
                 @adam
                   │
   ┌───────────┬───┴───────┬────────────┐
   │           │           │            │
 adam@       /adam      adam://      @adam ⇄ @sam
 inbox      profile     storage      agent-to-agent
```

| Door | What Claim wires |
|---|---|
| `@adam` | Private Firecracker microVM running the agent |
| `adam@` | Real inbox (SPF/DKIM) anyone can email without signup |
| `/adam` | Public profile: abilities + receipt feed |
| `adam://` | Files, memory, and tools under one root |

### Why this is the hero (not a feature list)

1. **Demo fits in one screenshot.** Claim → profile URL. That is the viral loop.
2. **Identity before tasks.** Competitors ship chat UIs; we ship an address.
3. **Every install advertises.** Profile badge "claimed with handle" + shareable `/@name`.
4. **Network effect baked in.** `@adam ⇄ @sam` only works once Claim exists at scale.

### Hero acceptance (must ship in v0.1)

| Check | Pass criteria |
|---|---|
| Time-to-alive | P95 ≤ 60s from `claim` to reachable `/@name` |
| Cold VM | P95 ≤ 8s resume from suspend |
| Email | External Gmail → `name@platform` delivers to agent queue |
| Receipt | First inbound email produces a public (redacted) receipt on `/@name` |
| Waste | Idle VM suspends ≤ 10 min; Claim cannot leave a forever-running bill |
| Fail closed | If mail or VM step fails, Claim rolls back handle reservation |

### Hero non-negotiables

- Claim is **atomic or rolled back** (no orphan VMs, no half-emails).
- Claim burns **prepaid credit check first**; refuse before provisioning if balance is empty.
- Claim never auto-retries more than **twice**; then surfaces a clear error + receipt `claim_failed`.
- Claim always prints three lines on success: profile URL, mail address, `handle status` hint.

**Everything else in this spec exists to make Claim trustworthy, cheap, and shareable.**

---


## 0. Product surface (beyond Claim)

| Command / surface | Behavior |
|---|---|
| `npx handle claim @name` | **Hero.** Reserve handle, provision microVM, wire email + storage + profile |
| `handle status` | Health, spend today, last receipt |
| `handle ping @other "…"` | Agent-to-agent message with receipt on both profiles |
| `handle move --to <host>` | Export identity bundle; import on new host |
| `GET /@name` | Public profile + abilities + public receipts |
| `adam@…` | Inbound email → agent inbox queue |

---

## 1. Non-goals and hard limits

### Non-goals (v0.1–v0.3)
- Multi-tenant "shared" agents (one person per handle)
- Custom domain email beyond the platform suffix
- Full OpenClaw fork (bridge only)
- Mobile apps
- Billing UI beyond prepaid credits
- Federated DNS / blockchain identity
- Any path that bypasses Claim (no "create agent without handle")

### Hard usage limits (platform + per-agent)
These are product requirements, not niceties. Every stage that can burn money must enforce them. **Claim itself must respect the prepaid circuit breaker before it starts a microVM.**

| Limit | Default | Purpose |
|---|---|---|
| Agent wall-clock per turn | 45s soft / 90s hard | Stop runaway tools |
| Tool calls per turn | 12 | Cap thrashing |
| Model tokens per turn | 32k in + 4k out | Cap chat cost |
| Model tokens per day | 500k | Cap daily spend |
| Agent-to-agent pings per hour | 20 outbound | Anti-spam |
| Email sends per day | 50 | Anti-spam / provider caps |
| Receipt writes per minute | 30 | Log flood |
| MicroVM CPU | 1 vCPU | Cost floor |
| MicroVM RAM | 512 MB | Cost floor |
| MicroVM disk | 2 GB | Cost floor |
| Idle microVM suspend | after 10 min idle | Stop idle burn |
| Cold-start budget | ≤ 8s P95 | UX gate |
| Concurrent microVMs per user | 1 | One handle = one machine |
| Retries on same failure | 2 max, then escalate | Kill loops |
| Same tool+args within 60s | blocked | Dedup loops |
| Claim attempts per account | 5 / day, 1 / min | Anti land-grab abuse |

**Budget circuit breaker:** if daily spend projected > prepaid balance, freeze outbound actions (email, ping, paid model calls). Profile and local reads stay up. Claim refuses to provision.

---

## 2. Architecture
```
┌──────────── CLI / API ────────────┐
│  claim · status · ping · move     │
└───────────────┬───────────────────┘
                │
┌───────────────▼───────────────────┐
│  Control plane (API + registry)   │
│  handles · auth · quotas · billing│
└───┬─────────┬─────────┬───────────┘
    │         │         │
    ▼         ▼         ▼
 MicroVM    Mail      Object
 orch.      gateway   store
(Firecracker)          (S3-compat)
    │
    ▼
 Agent runtime (per handle)
 tools · loop governor · receipts
```

**Trust boundary:** control plane never executes user agent code. Agent code runs only inside the microVM. Secrets are injected as short-lived references, never logged.

---

## 3. Repo layout
```
handle/
├── README.md
├── BUILD_SPEC.md          ← this file
├── package.json           # workspace root
├── packages/
│   ├── cli/               # `handle` binary + `npx handle`
│   ├── api/               # control plane HTTP API
│   ├── registry/          # handle reservation + DNS/email maps
│   ├── orchestrator/      # Firecracker lifecycle
│   ├── runtime/           # agent loop inside the microVM
│   ├── receipts/          # append-only receipt store + public filter
│   ├── mail/              # inbound/outbound email adapters
│   ├── storage/           # adam:// object + FS bridge
│   ├── profile/           # /@name SSR + static export
│   ├── quota/             # limits, circuit breakers, dedup
│   ├── move/              # export/import identity bundle
│   └── sdk/               # typed client for bridges (OpenClaw later)
├── apps/
│   └── web/               # marketing + profile host
├── infra/
│   ├── firecracker/       # rootfs, kernel, jailer configs
│   └── terraform/         # or pulumi — staging/prod
└── tests/
    ├── unit/
    ├── integration/
    └── chaos/             # loop / quota / kill-switch drills
```

Language default: **TypeScript** (Node 22+) for control plane + CLI; **Rust or Go** optional later for orchestrator hot path. v0.1: TypeScript everywhere except Firecracker scripts (bash + `firecracker` binary).

---

## 4. Stages (ship gates)
Each stage has: **deliverables**, **acceptance tests**, **usage guards**, **exit criteria**. Do not start stage N+1 until exit criteria for N are green.

### Stage 0 — Foundations (1–3 days)

| Deliverable | Detail |
|---|---|
| Monorepo + CI | pnpm workspaces, lint, typecheck, unit test on PR |
| Spec frozen | This file merged; ADR for Firecracker vs alternatives |
| Quota package stub | Limit table as config; all counters return "ok" but wired |
| Secrets pattern | Env refs only; no secrets in git or prompts |

**Exit:** CI green; `packages/quota` can deny a fake over-limit call.

### Stage 1 — Handle registry (supports Hero Claim) (3–5 days)

| Deliverable | Detail |
|---|---|
| Reserve / release | `@name` rules: 3–24 chars, `[a-z0-9_]`, reserved list |
| Auth | GitHub OAuth or magic link → owns handles |
| Rate limits | 5 claims / day / account; 1 claim / min |
| Conflict | Atomic reserve (DB unique + lease) |

**Exit:** Can claim `@demo` in staging; second claim of same name fails; spam claim blocked.

### Stage 2 — MicroVM lifecycle (5–8 days)

| Deliverable | Detail |
|---|---|
| Boot image | Minimal Linux + agent runtime binary |
| `start` / `stop` / `suspend` / `resume` | API + CLI |
| Idle suspend | 10 min no work → suspend; wake on inbound email/ping |
| Health | Heartbeat every 30s; miss 3 → restart once, then alert |

**Usage guards:** max 1 VM/user; hard stop if CPU > 95% for 5 min; no auto-restart loop (max 2 restarts / hour).

**Exit:** Cold start ≤ 8s P95 in staging; idle cost ≈ storage only; Claim can boot a VM as one step in its transaction.

### Stage 3 — Storage `adam://` (3–5 days)

| Deliverable | Detail |
|---|---|
| Object layout | `adam://mem/`, `adam://files/`, `adam://tools/` |
| FS mount in VM | FUSE or sync agent |
| Quotas | 2 GB hard; soft warn at 80% |
| Backup | Daily snapshot; retention 7 days |

**Exit:** Write/read round-trip from agent; over-quota write rejected.

### Stage 4 — Mail (5–7 days)

| Deliverable | Detail |
|---|---|
| Inbound | MX → parse → queue in VM inbox |
| Outbound | Signed send; SPF/DKIM/DMARC for platform domain |
| Caps | 50 sends/day; burst 5/min; blocklist |
| Loop kill | Auto-reply to auto-reply detected → drop + receipt |

**Exit:** External Gmail ↔ `name@platform` round-trip; bounce handling; send cap enforced.

### Stage 5 — Agent runtime + loop governor (5–8 days)

| Deliverable | Detail |
|---|---|
| Turn loop | Plan → tool → observe → reply |
| Governor | Enforces wall-clock, tool count, token, dedup, retry caps |
| Escalation | On limit: stop tools, emit receipt `limited`, ask human |
| Tools v0 | `read_storage`, `write_storage`, `send_email`, `ping_agent`, `publish_receipt` |

**Loop rules (code, not prompt):**
1. Identical `(tool, args_hash)` within 60s → reject.
2. Same error string twice → do not retry; escalate.
3. Depth of agent-to-agent hops ≤ 3.
4. No tool call after soft wall-clock; hard kill at hard wall-clock.

**Exit:** Chaos tests: infinite tool loop dies at 12 calls; token bomb dies at budget; ping storm dies at hop 3.

### Stage 6 — Receipts + profile (4–6 days)

| Deliverable | Detail |
|---|---|
| Append-only log | Hash-chained receipts (tamper-evident) |
| Privacy filter | Public vs private fields; defaults private |
| Profile page | Abilities + public feed; "claimed with handle" badge |
| SSR + cache | CDN cache 30s for public profile |

**Exit:** Action produces receipt; public page shows redacted version; hash chain verifies.

### Stage 7 — Agent-to-agent `ping` (4–6 days)

| Deliverable | Detail |
|---|---|
| Protocol | Signed JSON over HTTPS between control planes |
| Auth | Handle keypair; verify recipient |
| Caps | 20/hour outbound; hop ≤ 3; payload ≤ 8 KB |
| Receipts | Both sides write `ping_sent` / `ping_received` |

**Exit:** `@a` books slot with `@b` demo; spam ping rate-limited; hop bomb stopped.

### Stage 8 — `move` (portable identity) (4–6 days)

| Deliverable | Detail |
|---|---|
| Export bundle | Handle keys, memory snapshot, receipt chain, mail aliases map |
| Import | New host verifies chain; claims name if DNS/email cutover ok |
| Cutover | Dual-publish window ≤ 24h; then revoke old |

**Exit:** Move staging→staging; old host refuses writes after cutover; chain still verifies.

### Stage 9 — Hero Claim polish + OpenClaw bridge stub (3–5 days)

| Deliverable | Detail |
|---|---|
| `npx handle claim` happy path | **Hero demo:** one command + GIF; must meet Hero acceptance table |
| Docs | Quickstart ≤ 60 lines |
| Bridge stub | SDK method `fromOpenClawSession` behind feature flag |

**Exit:** Fresh machine claims handle in ≤ 60s documented path; bridge issue labeled `good first issue`.

### Stage 10 — Soft launch (ongoing)

| Deliverable | Detail |
|---|---|
| Prepaid credits | Stripe or crypto; freeze on empty |
| Observability | Metrics for quota hits, loop kills, cost/day |
| Abuse desk | Report handle; freeze within 15 min SLA |

---

## 5. Data model (core)
```
Handle
  id, name, owner_id, status (active|frozen|moved),
  pubkey, created_at, vm_id, mail_alias, storage_root

Receipt
  id, handle_id, ts, kind, public_summary,
  private_payload_ref, prev_hash, hash, visibility

QuotaCounter
  handle_id, window, window, used, limit, reset_at

VmState
  id, handle_id, state (running|suspended|stopped),
  last_heartbeat, restart_count_hour
```

---

## 6. API sketch (control plane)
| Method | Path | Notes |
|---|---|---|
| POST | `/v1/handles` | claim |
| GET | `/v1/handles/:name` | public metadata |
| POST | `/v1/handles/:name/ping` | a2a |
| POST | `/v1/handles/:name/move/export` | bundle |
| POST | `/v1/handles/:name/move/import` | bundle |
| GET | `/v1/handles/:name/receipts` | filtered |
| GET | `/v1/me/usage` | spend + counters |

All mutating routes: auth + idempotency key + quota check **before** work.

---

## 7. Usage waste playbook
| Failure mode | Detection | Response |
|---|---|---|
| Tool thrash | tool count / turn | Soft stop → receipt `limited:tools` |
| Token bomb | tokenizer running total | Soft stop → receipt `limited:tokens` |
| Retry storm | same error ×2 | Escalate; no third try |
| Ping flood | 20/hour or hop>3 | 429 + temporary mute |
| Mail loop | auto-reply graph | Drop + receipt |
| Zombie VM | no heartbeat | Restart ≤2/hour then freeze handle |
| Idle burn | idle >10 min | Suspend VM |
| Cost runaway | projected daily > balance | Freeze outbound |

**Never:** silent infinite retry, unbounded context growth, unbounded agent-to-agent recursion, auto-scale VMs beyond 1/user.

---

## 8. Security (minimum)
- Agent runs as non-root in jailer; no Docker-in-Docker
- Egress allowlist (mail, a2a peers, model API only)
- Secrets as short-lived refs; redacted in receipts
- Receipt private payloads encrypted at rest
- Public profile XSS-safe (escape all agent-authored text)
- Claim rate limits + captcha after 3 failures

---

## 9. Testing strategy
| Layer | What |
|---|---|
| Unit | Quota math, name rules, hash chain |
| Integration | Claim → boot → mail → receipt |
| Chaos | Forced loops, hop bombs, idle suspend |
| Load | 100 concurrent claims (registry only) |
| Cost | Synthetic day: assert under $X budget |

CI blocks merge if any chaos test expects a kill and does not get one.

---

## 10. Milestone checklist
| Stage | Name | Est. days | Gate |
|---|---|---|---|
| 0 | Foundations | 1–3 | CI + quota stub |
| 1 | Registry | 3–5 | Claim unique + rate limited |
| 2 | MicroVM | 5–8 | Cold start + idle suspend |
| 3 | Storage | 3–5 | Quota reject |
| 4 | Mail | 5–7 | Round-trip + send cap |
| 5 | Runtime | 5–8 | Chaos loop kills |
| 6 | Receipts + profile | 4–6 | Public redaction |
| 7 | A2A ping | 4–6 | Hop + rate limits |
| 8 | Move | 4–6 | Bundle cutover |
| 9 | CLI + bridge stub | 3–5 | 60s claim demo |
| 10 | Soft launch | ongoing | Prepaid freeze |

**Rough total to soft launch:** ~40–60 engineering days for one focused builder, or less with parallel Stage 3/4 after Stage 2 is stable.

---

## 11. Immediate next actions
1. Merge this file to `SM260845/handle` as `BUILD_SPEC.md`.
2. Open issues: one per stage (0–9) with acceptance criteria copied from here.
3. Decide platform email domain and cloud region (blocks Stage 2/4).
4. Do **not** write agent prompt glue until Stage 5 governor exists.

---

## 12. One-line North Star
Ship **Claim**: one command that births `@name` with mail, microVM, profile, and receipts — shareable in sixty seconds — and **cannot burn money in a loop**.
