# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `main` (pre-alpha) | Yes |
| published releases | Yes, once they exist |

## Reporting a vulnerability

**Do not open a public GitHub issue for security reports.**

Please use [GitHub private vulnerability reporting](https://github.com/SM260845/handle/security/advisories/new) (preferred) or email the maintainers via the contact on the GitHub profile.

Include:

- Affected package / stage (if known)
- Reproduction steps
- Impact (data exposure, privilege escalation, spend runaway, etc.)

We aim to acknowledge within 3 business days and to ship a fix or mitigation ASAP for anything that can burn money or leak private receipt payloads.

## Scope notes for this project

- Agent code must only run inside a Firecracker microVM (never on the control plane).
- Secrets are short-lived refs, never logged, never written into receipts' public fields.
- Claim, mail, ping, and paid model calls must fail closed through `@handle/quota`.
- Public profiles must XSS-escape all agent-authored text.
