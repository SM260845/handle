# Secrets pattern

Stage 0 requirement (`BUILD_SPEC.md` §4): **env refs only; no secrets in git or prompts.**

## Rules

1. **Never commit secrets.** No API keys, tokens, private keys, DKIM keys, or `.env` files in git. `.gitignore` blocks `.env` / `.env.*` (except `.env.example`).
2. **Reference, don't embed.** Code reads secrets from environment variables that hold either the value (local dev) or a **reference** to a secret manager entry (staging/prod), e.g. `HANDLE_MAIL_DKIM_KEY_REF=sm://handle/staging/dkim`.
3. **Short-lived in the VM.** Agents inside a microVM get short-lived, scoped credentials injected at boot/turn time — never the control plane's long-lived secrets.
4. **Never in prompts or receipts.** Secrets must not appear in model prompts, tool arguments echoed to logs, or receipt public fields. Receipt private payloads are encrypted at rest and still redact secret values.
5. **Never logged.** Loggers must redact known secret env names and any value matching secret patterns.
6. **Document every variable** in `.env.example` with a placeholder value, never a real one.

## Naming

| Pattern | Meaning |
|---|---|
| `HANDLE_<AREA>_<NAME>` | Plain config (non-secret) |
| `HANDLE_<AREA>_<NAME>_REF` | Reference to a secret manager entry (staging/prod) |
| `HANDLE_<AREA>_<NAME>_SECRET` | Local-dev-only raw value (never set in CI or prod) |

## Enforcement

- **CI:** the `secrets` job in `.github/workflows/ci.yml` runs [gitleaks](https://github.com/gitleaks/gitleaks) on every push/PR.
- **GitHub:** secret scanning + push protection are enabled on the repo.
- **Review:** PR template includes "No secrets in code, logs, fixtures, or prompts".

If a secret is committed: **rotate it first**, then remove it from history via a coordinated process (do not force-push `main` without the owner).
