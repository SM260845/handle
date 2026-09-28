/**
 * Optional Stage 1 wiring: when HANDLE_API_URL is set, call POST /v1/handles.
 * Full Claim (VM + mail + storage + profile) remains Stage 9.
 */
import type { Io } from './index.js';

export async function claimViaApi(name: string, env: NodeJS.ProcessEnv, io: Io): Promise<number> {
  const base = env.HANDLE_API_URL?.replace(/\/$/, '');
  const token = env.HANDLE_API_TOKEN;
  if (!base || !token) {
    io.err('handle claim: not implemented yet (Stage 9)');
    io.err('hint: set HANDLE_API_URL + HANDLE_API_TOKEN to hit a Stage 1 registry (reserve only)');
    return 2;
  }
  const key =
    env.HANDLE_IDEMPOTENCY_KEY ?? `cli-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    const res = await fetch(`${base}/v1/handles`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'idempotency-key': key,
      },
      body: JSON.stringify({ name }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      handle?: string;
      error?: string;
      message?: string;
    };
    if (!res.ok) {
      io.err(
        `handle claim: ${body.error ?? res.status}${body.message ? ` — ${body.message}` : ''}`,
      );
      return 1;
    }
    io.out(`claimed ${body.handle ?? name}`);
    io.out(`(Stage 1 registry only — VM/mail/storage/profile land in later stages)`);
    io.out(`hint: handle status`);
    return 0;
  } catch (e) {
    io.err(`handle claim: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}
