/**
 * `@name` rules (BUILD_SPEC.md §4 Stage 1): 3–24 chars, `[a-z0-9_]`, not on the reserved list.
 */

export const NAME_MIN = 3;
export const NAME_MAX = 24;
export const NAME_PATTERN = /^[a-z0-9_]+$/;

/** Names that can never be claimed (platform, infra, impersonation, abuse). */
export const RESERVED_NAMES: ReadonlySet<string> = new Set([
  // platform + brand
  'handle',
  'handles',
  'claim',
  'claims',
  'official',
  'team',
  'staff',
  'verified',
  // admin / impersonation
  'admin',
  'administrator',
  'root',
  'sudo',
  'system',
  'sys',
  'owner',
  'moderator',
  'mod',
  'security',
  'abuse',
  'legal',
  'privacy',
  'billing',
  'support',
  'help',
  'info',
  'contact',
  // infra / mail
  'api',
  'www',
  'web',
  'app',
  'mail',
  'email',
  'smtp',
  'imap',
  'pop',
  'mx',
  'dns',
  'ftp',
  'cdn',
  'static',
  'assets',
  'status',
  'docs',
  'blog',
  'dev',
  'staging',
  'prod',
  'test',
  'localhost',
  'postmaster',
  'hostmaster',
  'webmaster',
  'mailer_daemon',
  'noreply',
  'no_reply',
  'bounce',
  // routes + commands
  'me',
  'login',
  'logout',
  'signup',
  'register',
  'auth',
  'oauth',
  'settings',
  'account',
  'profile',
  'ping',
  'move',
  'receipts',
  'null',
  'undefined',
]);

export type NameCheck =
  { ok: true; name: string } | { ok: false; code: 'invalid_name' | 'reserved'; reason: string };

/** Trim, strip one leading `@`, lowercase. Does not validate. */
export function normalizeName(input: string): string {
  return input.trim().replace(/^@/, '').toLowerCase();
}

export function validateName(input: string): NameCheck {
  const name = normalizeName(input);
  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return {
      ok: false,
      code: 'invalid_name',
      reason: `name must be ${NAME_MIN}-${NAME_MAX} characters`,
    };
  }
  if (!NAME_PATTERN.test(name)) {
    return { ok: false, code: 'invalid_name', reason: 'name may only contain a-z, 0-9 and _' };
  }
  if (RESERVED_NAMES.has(name)) {
    return { ok: false, code: 'reserved', reason: `@${name} is reserved` };
  }
  return { ok: true, name };
}
