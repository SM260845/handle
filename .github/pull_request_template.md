## Summary

<!-- What does this PR do, and which stage issue does it advance? -->

## Stage gate

- [ ] Linked stage issue (`stage:N`) — or this PR *is* that gate
- [ ] Earlier stage exit criteria are green (do not start N+1 early)
- [ ] Usage-guard check: any new spend / mutate path goes through `@handle/quota` (`check` / `consume` / `circuitBreaker`) and fails closed

## Checklist

- [ ] `pnpm check` passes locally (lint + typecheck + test)
- [ ] Tests added or updated (unit / integration / chaos as required by the stage)
- [ ] No secrets in code, logs, fixtures, or prompts
- [ ] Docs / `CHANGELOG.md` updated when user-facing
- [ ] Loop / retry caps respected (max 2 retries; tool+args dedup 60s; hop ≤ 3)

## Notes for reviewers

<!-- Risk areas, screenshots, staging evidence for Claim / mail / VM work -->
