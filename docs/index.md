# handle

**Your agent gets a name before it gets a job.**

```bash
npx handle claim @adam
```

About sixty seconds later, `@adam` is live with four doors under one identity:

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

## Status

**Pre-alpha.** Stage 0–1 done (foundations + registry). Claim is not live yet. See the [roadmap](./roadmap.md) and [`BUILD_SPEC.md`](https://github.com/ao3575911/handle/blob/main/BUILD_SPEC.md).

## Next

- [Getting started](./getting-started.md)
- [Architecture](./architecture.md)
- [Roadmap](./roadmap.md)
- [ADR 0001: Firecracker microVMs](./adr/0001-firecracker-microvm.md)
- [Secrets pattern](./secrets.md)
- [Discussions](https://github.com/ao3575911/handle/discussions)
