# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Monorepo scaffold (pnpm workspaces, TypeScript, ESLint, Prettier, Vitest)
- `@handle/quota` with typed limit table, `check()`, windowed counters, dedup guard, and budget circuit breaker (Stage 0 exit)
- `handle` CLI stubs: `claim` / `status` / `ping` / `move` (exit non-zero with stage hint)
- Package stubs for api, registry, orchestrator, runtime, receipts, mail, storage, profile, move, sdk, and `apps/web`
- Community files, AGENTS.md, docs site, CI / CodeQL / Dependabot / triage / stale / Pages workflows
- Stage issues 0–10, HERO Claim issue, OpenClaw bridge good-first-issue

## [0.0.0] - 2026-09-28

### Added

- Initial README and `BUILD_SPEC.md` (staged build plan)
