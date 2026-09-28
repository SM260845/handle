import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { Registry, RegistryError, type HandleRecord } from '@handle/registry';
import type { Authenticator, OwnerIdentity } from './auth.js';

export interface ApiDeps {
  registry: Registry;
  auth: Authenticator;
  /** Max JSON body size in bytes. */
  maxBodyBytes?: number;
}

interface Reply {
  status: number;
  body?: unknown;
}

const STATUS: Record<RegistryError['code'], number> = {
  invalid_name: 400,
  reserved: 409,
  taken: 409,
  rate_limited: 429,
  not_found: 404,
  forbidden: 403,
  lease_expired: 410,
};

const publicView = (r: HandleRecord) => ({
  name: r.name,
  handle: `@${r.name}`,
  status: r.status,
  createdAt: new Date(r.createdAt).toISOString(),
});

const readJson = (req: IncomingMessage, max: number): Promise<unknown> =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > max) {
        reject(new RegistryError('invalid_name', 'body too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(new RegistryError('invalid_name', 'invalid JSON'));
      }
    });
    req.on('error', reject);
  });

/**
 * Control-plane HTTP API (Stage 1 subset).
 *   POST   /v1/handles        claim   (auth + Idempotency-Key; quota checked before work)
 *   GET    /v1/handles/:name  public metadata
 *   DELETE /v1/handles/:name  release (owner only)
 */
export function createApi(deps: ApiDeps): {
  handle: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
  server: () => Server;
} {
  const { registry, auth } = deps;
  const maxBody = deps.maxBodyBytes ?? 8 * 1024;
  /** (ownerId, Idempotency-Key) → first reply. TODO(Stage 1 follow-up): persist + TTL. */
  const idempotent = new Map<string, Reply>();

  const claim = async (owner: OwnerIdentity, key: string, body: unknown): Promise<Reply> => {
    const cacheKey = `${owner.id}\u0000${key}`;
    const cached = idempotent.get(cacheKey);
    if (cached) return cached; // retries never re-consume quota or re-run work
    const name = (body as { name?: unknown } | null)?.name;
    let reply: Reply;
    if (typeof name !== 'string') {
      reply = { status: 400, body: { error: 'invalid_name', message: 'body.name is required' } };
    } else {
      try {
        // Stage 1: reserve + confirm. Later stages insert VM/mail/storage steps between the two
        // and call registry.release(lease) on failure (Hero Claim rollback).
        const lease = await registry.reserve(name, owner);
        const rec = registry.confirm(lease.leaseId, owner);
        reply = { status: 201, body: publicView(rec) };
      } catch (e) {
        if (!(e instanceof RegistryError)) throw e;
        reply = { status: STATUS[e.code], body: { error: e.code, message: e.message } };
      }
    }
    idempotent.set(cacheKey, reply);
    return reply;
  };

  const route = async (req: IncomingMessage): Promise<Reply> => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const m = url.pathname.match(/^\/v1\/handles(?:\/([^/]+))?\/?$/);
    if (!m) return { status: 404, body: { error: 'not_found' } };
    const name = m[1] ? decodeURIComponent(m[1]) : undefined;

    if (req.method === 'GET' && name) {
      const rec = registry.get(name);
      return rec && rec.status === 'active'
        ? { status: 200, body: publicView(rec) }
        : { status: 404, body: { error: 'not_found' } };
    }

    const owner = auth.authenticate(req.headers);
    if (!owner) return { status: 401, body: { error: 'unauthenticated' } };

    if (req.method === 'POST' && !name) {
      const key = req.headers['idempotency-key'];
      if (typeof key !== 'string' || key.length < 8 || key.length > 128) {
        return { status: 400, body: { error: 'idempotency_key_required' } };
      }
      return claim(owner, key, await readJson(req, maxBody));
    }

    if (req.method === 'DELETE' && name) {
      try {
        registry.release(name, owner);
        return { status: 204 };
      } catch (e) {
        if (!(e instanceof RegistryError)) throw e;
        return { status: STATUS[e.code], body: { error: e.code, message: e.message } };
      }
    }

    return { status: 405, body: { error: 'method_not_allowed' } };
  };

  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    let reply: Reply;
    try {
      reply = await route(req);
    } catch (e) {
      reply =
        e instanceof RegistryError
          ? { status: 400, body: { error: 'bad_request', message: e.message } }
          : { status: 500, body: { error: 'internal' } };
    }
    res.statusCode = reply.status;
    if (reply.body === undefined) {
      res.end();
      return;
    }
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(reply.body));
  };

  return { handle, server: () => createServer((req, res) => void handle(req, res)) };
}
