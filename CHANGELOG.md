# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Stage 1 handle registry (`@handle/registry`): name rules + reserved list, Memory + Sqlite stores (UNIQUE name), lease/TTL reserve→confirm→release, claim rate limits via `@handle/quota` `guard()`
- Stage 1 control-plane API (`@handle/api`): `POST|GET|DELETE /v1/handles` with Idempotency-Key, DevToken + DevMagicLink auth stubs (real GitHub OAuth deferred)
- CLI: `handle claim @name` hits the registry when `HANDLE_API_URL` + `HANDLE_API_TOKEN` are set


- Monorepo scaffold (pnpm workspaces, TypeScript, ESLint, Prettier, Vitest)
- `@handle/quota` with typed limit table, `check()`, windowed counters, dedup guard, and budget circuit breaker (Stage 0 exit)
- `handle` CLI stubs: `claim` / `status` / `ping` / `move` (exit non-zero with stage hint)
- Package stubs for api, registry, orchestrator, runtime, receipts, mail, storage, profile, move, sdk, and `apps/web`
- Community files, AGENTS.md, docs site, CI / CodeQL / Dependabot / triage / stale / Pages workflows
- Stage issues 0–10, HERO Claim issue, OpenClaw bridge good-first-issue
- Stage 0: ADR 0001 (Firecracker vs gVisor / Kata / Docker / Cloud Hypervisor) in `docs/adr/`
- Stage 0: secrets pattern (`docs/secrets.md`, `.env.example`) and gitleaks secret-scan job in CI
- Stage 0: `@handle/quota` `guard()` wiring helper + `QuotaExceededError`; gate test proving a fake over-limit call is denied before work runs

## [0.0.0] - 2026-09-28

### Added

- Initial README and `BUILD_SPEC.md` (staged build plan)
