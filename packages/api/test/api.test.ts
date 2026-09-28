import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryHandleStore, Registry } from '@handle/registry';
import { DevMagicLink, DevTokenAuthenticator, createApi } from '../src/index.js';

let close: (() => Promise<void>) | undefined;
afterEach(async () => {
  await close?.();
  close = undefined;
});

async function start() {
  let t = 1_000_000;
  const auth = new DevTokenAuthenticator({ tok_alice: 'dev:alice', tok_bob: 'dev:bob' });
  const registry = new Registry({ store: new MemoryHandleStore(), now: () => t });
  const server = createApi({ registry, auth }).server();
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  close = () => new Promise((r) => server.close(() => r()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call = async (
    method: string,
    path: string,
    opts: { token?: string; key?: string; body?: unknown } = {},
  ) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (opts.token) headers.authorization = `Bearer ${opts.token}`;
    if (opts.key) headers['idempotency-key'] = opts.key;
    const res = await fetch(base + path, {
      method,
      headers,
      ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : undefined };
  };
  return { call, auth, advance: (ms: number) => (t += ms) };
}

describe('API /v1/handles', () => {
  it('claims @demo, then GET returns it', async () => {
    const { call } = await start();
    const r = await call('POST', '/v1/handles', {
      token: 'tok_alice',
      key: 'key-000001',
      body: { name: '@demo' },
    });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ name: 'demo', handle: '@demo', status: 'active' });
    const g = await call('GET', '/v1/handles/@demo');
    expect(g.status).toBe(200);
    expect(g.body.name).toBe('demo');
    expect(g.body).not.toHaveProperty('ownerId');
  });

  it('a second claim of @demo by someone else is 409', async () => {
    const { call } = await start();
    await call('POST', '/v1/handles', {
      token: 'tok_alice',
      key: 'key-000001',
      body: { name: 'demo' },
    });
    const r = await call('POST', '/v1/handles', {
      token: 'tok_bob',
      key: 'key-000002',
      body: { name: 'demo' },
    });
    expect(r.status).toBe(409);
    expect(r.body.error).toBe('taken');
  });

  it('idempotent retry returns the same result without consuming quota', async () => {
    const { call } = await start();
    const a = await call('POST', '/v1/handles', {
      token: 'tok_alice',
      key: 'retry-key-1',
      body: { name: 'demo' },
    });
    const b = await call('POST', '/v1/handles', {
      token: 'tok_alice',
      key: 'retry-key-1',
      body: { name: 'demo' },
    });
    expect(b).toEqual(a);
    expect(b.status).toBe(201);
  });

  it('rate limits the 2nd claim within a minute (429) before doing work', async () => {
    const { call, advance } = await start();
    await call('POST', '/v1/handles', {
      token: 'tok_alice',
      key: 'key-000001',
      body: { name: 'one' },
    });
    const r = await call('POST', '/v1/handles', {
      token: 'tok_alice',
      key: 'key-000002',
      body: { name: 'two' },
    });
    expect(r.status).toBe(429);
    expect((await call('GET', '/v1/handles/two')).status).toBe(404);
    advance(60_000);
    expect(
      (
        await call('POST', '/v1/handles', {
          token: 'tok_alice',
          key: 'key-000003',
          body: { name: 'two' },
        })
      ).status,
    ).toBe(201);
  });

  it('requires auth and an idempotency key', async () => {
    const { call } = await start();
    expect((await call('POST', '/v1/handles', { body: { name: 'demo' } })).status).toBe(401);
    expect(
      (await call('POST', '/v1/handles', { token: 'tok_alice', body: { name: 'demo' } })).status,
    ).toBe(400);
  });

  it('validates names (400 invalid, 409 reserved)', async () => {
    const { call, advance } = await start();
    expect(
      (
        await call('POST', '/v1/handles', {
          token: 'tok_alice',
          key: 'key-000001',
          body: { name: 'a!' },
        })
      ).status,
    ).toBe(400);
    advance(60_000);
    const r = await call('POST', '/v1/handles', {
      token: 'tok_alice',
      key: 'key-000002',
      body: { name: 'admin' },
    });
    expect(r.status).toBe(409);
    expect(r.body.error).toBe('reserved');
  });

  it('DELETE: non-owner 403, owner 204', async () => {
    const { call } = await start();
    await call('POST', '/v1/handles', {
      token: 'tok_alice',
      key: 'key-000001',
      body: { name: 'demo' },
    });
    expect((await call('DELETE', '/v1/handles/demo', { token: 'tok_bob' })).status).toBe(403);
    expect((await call('DELETE', '/v1/handles/demo', { token: 'tok_alice' })).status).toBe(204);
    expect((await call('GET', '/v1/handles/demo')).status).toBe(404);
  });

  it('dev magic link issues a working one-time session', async () => {
    const { call, auth } = await start();
    const link = new DevMagicLink(auth);
    const session = link.verify(link.request('Carol@Example.com'));
    expect(session).toBeTruthy();
    expect(link.verify('nope')).toBeNull();
    const r = await call('POST', '/v1/handles', {
      token: session!,
      key: 'key-000009',
      body: { name: 'carol' },
    });
    expect(r.status).toBe(201);
  });
});
