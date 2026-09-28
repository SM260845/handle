/**
 * Owner identity for the control plane.
 *
 * `Authenticator` is the seam real auth plugs into. Stage 1 ships ONLY dev stubs:
 *   - DevTokenAuthenticator: static bearer tokens → owner ids (tests / local dev)
 *   - DevMagicLink: issues one-time tokens for an email and exchanges them for a session token
 * TODO(Stage 1 follow-up): GitHubOAuthAuthenticator (real OAuth, `github:<id>` owner ids) — NOT implemented.
 * Never enable dev authenticators in staging/prod.
 */
import { randomBytes } from 'node:crypto';
import type { OwnerIdentity } from '@handle/registry';

export type { OwnerIdentity };

export interface Authenticator {
  /** Resolve the owner for a request, or null if unauthenticated. */
  authenticate(headers: Record<string, string | string[] | undefined>): OwnerIdentity | null;
}

const bearer = (headers: Record<string, string | string[] | undefined>): string | null => {
  const h = headers['authorization'];
  const v = Array.isArray(h) ? h[0] : h;
  const m = v?.match(/^Bearer\s+(\S+)$/i);
  return m?.[1] ?? null;
};

/** DEV ONLY. Maps opaque bearer tokens to owner ids. */
export class DevTokenAuthenticator implements Authenticator {
  private readonly tokens: Map<string, string>;

  constructor(tokens: Record<string, string> = {}) {
    this.tokens = new Map(Object.entries(tokens));
  }

  issue(ownerId: string): string {
    const token = `dev_${randomBytes(16).toString('hex')}`;
    this.tokens.set(token, ownerId);
    return token;
  }

  authenticate(headers: Record<string, string | string[] | undefined>): OwnerIdentity | null {
    const t = bearer(headers);
    const id = t ? this.tokens.get(t) : undefined;
    return id ? { id } : null;
  }
}

/** DEV ONLY magic-link stub: no email is sent; the link token is returned to the caller. */
export class DevMagicLink {
  private readonly pending = new Map<string, { email: string; expiresAt: number }>();

  constructor(
    private readonly sessions: DevTokenAuthenticator,
    private readonly now: () => number = Date.now,
    private readonly ttlMs = 15 * 60_000,
  ) {}

  /** Returns the one-time link token (a real impl would email it). */
  request(email: string): string {
    const token = randomBytes(16).toString('hex');
    this.pending.set(token, {
      email: email.trim().toLowerCase(),
      expiresAt: this.now() + this.ttlMs,
    });
    return token;
  }

  /** Exchange a link token for a session bearer token. One-time use. */
  verify(linkToken: string): string | null {
    const p = this.pending.get(linkToken);
    this.pending.delete(linkToken);
    if (!p || p.expiresAt <= this.now()) return null;
    return this.sessions.issue(`email:${p.email}`);
  }
}
