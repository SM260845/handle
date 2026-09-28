# infra/firecracker

**TODO (Stage 2 — MicroVM lifecycle).** See `BUILD_SPEC.md` §4 Stage 2.

Planned contents:

- Minimal Linux kernel + rootfs build scripts (bash + `firecracker` binary)
- Jailer config: agent runs as non-root, no Docker-in-Docker
- Resource caps: 1 vCPU, 512 MB RAM, 2 GB disk (see `packages/quota`)
- Egress allowlist: mail, a2a peers, model API only

Gates: cold start ≤ 8s P95; idle suspend after 10 min; max 2 restarts/hour.
