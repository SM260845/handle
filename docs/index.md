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

**Pre-alpha, spec-first.** See the [roadmap](./roadmap.md) and [`BUILD_SPEC.md`](https://github.com/SM260845/handle/blob/main/BUILD_SPEC.md).

## Next

- [Getting started](./getting-started.md)
- [Architecture](./architecture.md)
- [Roadmap](./roadmap.md)
- [Discussions](https://github.com/SM260845/handle/discussions)
