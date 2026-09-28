# Roadmap

Stages are ship gates. Do not start N+1 until N's exit criteria are green. Full detail: [`BUILD_SPEC.md`](https://github.com/SM260845/handle/blob/main/BUILD_SPEC.md) §4 / §10.

| Stage | Name | Gate |
|---|---|---|
| **0** ✓ | Foundations | CI + quota denies over-limit |
| **1** ✓ | Registry | Claim unique + rate limited |
| 2 | MicroVM | Cold start + idle suspend |
| 3 | Storage | Quota reject |
| 4 | Mail | Round-trip + send cap |
| 5 | Runtime | Chaos loop kills |
| 6 | Receipts + profile | Public redaction |
| 7 | A2A ping | Hop + rate limits |
| 8 | Move | Bundle cutover |
| 9 | CLI + bridge stub | 60s claim demo |
| 10 | Soft launch | Prepaid freeze |

**Hero (must ship in v0.1):** `npx handle claim @name` → reachable `/@name` in ≤ 60s P95, with mail + receipts, fail-closed and prepaid-checked.

Track progress on the [`stage:N` issues](https://github.com/SM260845/handle/issues?q=label%3Astage%3A0) and the pinned **HERO** issue.
