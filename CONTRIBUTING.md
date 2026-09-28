# Contributing to handle

Thanks for helping ship **Claim**: one command that births `@name` with mail, microVM, profile, and receipts — and **cannot burn money in a loop**.

## Quick start

```bash
# Node 22+ (see .nvmrc)
pnpm install
pnpm check   # lint + typecheck + test
```

## Stage gates

Do **not** start Stage N+1 until Stage N exit criteria in [`BUILD_SPEC.md`](./BUILD_SPEC.md) are green. Open / claim the matching stage issue, and label PRs with `stage:N`.

| Stage | Focus |
|---|---|
| 0 | Foundations (CI + quota) |
| 1 | Registry |
| 2 | MicroVM |
| 3 | Storage `adam://` |
| 4 | Mail |
| 5 | Runtime + loop governor |
| 6 | Receipts + profile |
| 7 | Agent-to-agent `ping` |
| 8 | `move` |
| 9 | Hero Claim polish + OpenClaw bridge stub |
| 10 | Soft launch |

## Hard rules

1. **Never bypass `@handle/quota`.** Every mutating / money-burning path must call `check()` / `QuotaCounter.consume()` / `circuitBreaker()` before work.
2. **No secrets in git or prompts.** Env refs / short-lived secret-manager refs only.
3. **Loop / retry caps are code, not prompts.** Max 2 retries on the same failure; identical `(tool, args_hash)` within 60s is blocked; a2a hop depth ≤ 3.
4. **Claim is atomic or rolled back.** No orphan VMs, no half-emails.
5. **Do not write agent prompt glue until Stage 5 governor exists.**

## PR checklist

Use the PR template. In particular:

- [ ] Stage gate for this work is green (or this PR *is* that gate)
- [ ] Usage-guard check: quota / circuit breaker covered for any new spend path
- [ ] Tests added or updated; `pnpm check` passes

## Good first issues

Look for the `good first issue` label — starting with the OpenClaw bridge stub (`@handle/sdk` `fromOpenClawSession`).

## Code of conduct

Be kind. See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## Security

See [`SECURITY.md`](./SECURITY.md). Do not open public issues for vulnerabilities.
