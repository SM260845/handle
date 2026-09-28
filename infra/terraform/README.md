# infra/terraform

**TODO (Stage 2).** Staging/prod infrastructure (Terraform or Pulumi — decision pending ADR).

Rules:

- No secrets in git. Use env references / secret manager refs only.
- No auto-scaling beyond 1 microVM per user.
- Every environment must have a hard spend cap / budget alarm.
