# tests

| Dir | What | Stage |
|---|---|---|
| `unit/` | Cross-package unit tests (quota math, name rules, hash chain). Package-local tests live in `packages/*/test`. | 0+ |
| `integration/` | Claim → boot → mail → receipt | 2–9 |
| `chaos/` | Forced loops, hop bombs, idle suspend, kill-switch drills | 5+ |

CI blocks merge if any chaos test expects a kill and does not get one.
