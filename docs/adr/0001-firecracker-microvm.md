# ADR 0001 — Firecracker microVMs for per-handle agent isolation

- **Status:** Accepted
- **Date:** 2026-09-28
- **Stage:** 0 (Foundations) — required by `BUILD_SPEC.md` §4 "Spec frozen"
- **Deciders:** @ao3575911

## Context

Every claimed handle (`@name`) runs untrusted, agent-authored code (tool calls, scripts, model output). `BUILD_SPEC.md` requires:

- **Trust boundary:** the control plane never executes agent code; it runs only in an isolated sandbox.
- **Cost floor:** 1 vCPU, 512 MB RAM, 2 GB disk per handle; 1 VM per user.
- **Cold start ≤ 8s P95** and **suspend after 10 min idle** so idle cost ≈ storage only.
- Non-root execution, no Docker-in-Docker, egress allowlist (mail, a2a peers, model API).

We need a sandbox that is strongly isolated (hostile multi-tenant code), cheap when idle, and fast to resume.

## Options considered

| Option | Isolation | Start / resume | Density / overhead | Snapshot / suspend | Ops complexity | Notes |
|---|---|---|---|---|---|---|
| **Firecracker** | Hardware virtualization (KVM), minimal device model, `jailer` (seccomp, cgroups, chroot) | Boot ~125 ms (vendor figure) plus guest init; snapshot restore typically sub-second | Very low (~5 MB VMM memory, vendor figure) | Native full-VM snapshot/restore | Medium: we own kernel, rootfs, networking (tap), jailer | Powers AWS Lambda/Fargate. Requires KVM (bare metal or nested-virt hosts). |
| **gVisor (runsc)** | User-space kernel intercepting syscalls; shares host kernel via reduced surface | Container-fast (~100s of ms) | Low | Checkpoint/restore exists, less mature for our use *(unverified for our workload)* | Low–medium: OCI runtime, drops into containerd/K8s | Syscall compatibility gaps and I/O overhead for some workloads; weaker boundary than a VM. |
| **Kata Containers** | Lightweight VM per pod (QEMU, Cloud Hypervisor, or Firecracker backends) | Slower than raw Firecracker due to extra layers *(unverified numbers)* | Medium | Depends on backend | High: K8s/containerd integration, more moving parts | Good if we were K8s-first; adds a layer we don't need for 1 VM/user. |
| **Docker / runc containers** | Namespaces + cgroups; **shared host kernel** | Fastest | Lowest | CRIU possible, fragile | Lowest | Not an acceptable boundary for hostile multi-tenant agent code; spec forbids Docker-in-Docker. |
| **Cloud Hypervisor** | KVM VM, Rust VMM, broader device support than Firecracker | Fast (comparable class to Firecracker) *(unverified for our image)* | Low | Snapshot/restore supported | Medium: similar to Firecracker | Strong alternative; more features (hotplug, GPU/VFIO) we don't need in v0.1. |

Figures marked "vendor figure" come from upstream project documentation; anything marked *(unverified)* has not been measured by us. Stage 2 must benchmark the chosen path against the ≤ 8s P95 gate.

## Decision

Use **Firecracker** (with `jailer`) as the per-handle sandbox for v0.1.

Reasons:

1. **VM-grade isolation** for untrusted agent code with a deliberately tiny device model (smaller attack surface than QEMU-based stacks).
2. **Snapshot/restore** maps directly onto "suspend after 10 min idle, wake on email/ping" and the ≤ 8s cold-start budget.
3. **Cost floor fits**: tiny VMM overhead supports the 1 vCPU / 512 MB / 2 GB profile.
4. **No orchestrator dependency**: we control lifecycle directly from `@handle/orchestrator` (start/stop/suspend/resume), matching the 1-VM-per-user model without K8s.
5. Matches the spec's language choice (TypeScript control plane + bash/`firecracker` binary scripts).

**Fallback:** Cloud Hypervisor is the designated fallback if Firecracker's limited device model blocks a required feature. gVisor may be revisited only for a non-hostile, dev-only mode.

## Consequences

- **Hosting constraint:** requires KVM — bare-metal instances or hosts with nested virtualization. This influences cloud/region choice (open action in `BUILD_SPEC.md` §11).
- **We own the guest:** kernel + minimal rootfs build scripts in `infra/firecracker/`, image update/CVE process, and guest agent runtime.
- **Networking:** per-VM tap devices + egress allowlist enforced on the host; no Docker networking to lean on.
- **Storage:** `adam://` mounted via FUSE or a sync agent (Stage 3), not host bind mounts.
- **Quotas enforced outside the guest:** CPU/RAM/disk caps come from Firecracker config + cgroups (jailer), mirrored in `@handle/quota` `LIMITS` (`vmCpu`, `vmRam`, `vmDisk`, `concurrentVmsPerUser`, `vmRestartsPerHour`).
- **Stage 2 gate:** benchmark cold start (snapshot restore) and idle cost; if P95 > 8s, revisit snapshot strategy before changing VMM.
- **Local dev:** contributors without KVM (e.g. macOS) need a stub/mock orchestrator; CI will not boot real VMs until a KVM-capable runner exists.
