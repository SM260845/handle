# Architecture

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

**Trust boundary:** the control plane never executes user agent code. Agent code runs only inside a Firecracker microVM. Secrets are short-lived references, never logged.

Every mutating route: **auth + idempotency key + `@handle/quota` check before work.**

See [`BUILD_SPEC.md`](https://github.com/ao3575911/handle/blob/main/BUILD_SPEC.md) §2–§8 for the data model, API sketch, usage-waste playbook, and security minimums.
