import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { QuotaCounter } from '@handle/quota';
import {
  MemoryHandleStore,
  Registry,
  RegistryError,
  type HandleStore,
  type OwnerIdentity,
} from '../src/index.js';
import { SqliteHandleStore } from '../src/sqlite-store.js';

const MIN = 60_000;
const alice: OwnerIdentity = { id: 'dev:alice' };
const bob: OwnerIdentity = { id: 'dev:bob' };

const code = async (p: Promise<unknown> | (() => unknown)) => {
  try {
    await (typeof p === 'function' ? p() : p);
  } catch (e) {
    return e instanceof RegistryError ? e.code : String(e);
  }
  return 'ok';
};

const tmp = mkdtempSync(join(tmpdir(), 'handle-reg-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const stores: [string, () => HandleStore][] = [
  ['memory', () => new MemoryHandleStore()],
  ['sqlite', () => new SqliteHandleStore(':memory:')],
];

describe.each(stores)('Registry (%s store)', (_label, makeStore) => {
  const setup = () => {
    let t = 1_000_000;
    const clock = { now: () => t, advance: (ms: number) => (t += ms) };
    const registry = new Registry({ store: makeStore(), now: clock.now, leaseTtlMs: 5 * MIN });
    return { registry, clock };
  };

  it('claims @demo (reserve + confirm)', async () => {
    const { registry } = setup();
    const lease = await registry.reserve('@demo', alice);
    expect(lease.name).toBe('demo');
    expect(registry.get('demo')?.status).toBe('pending');
    const rec = registry.confirm(lease.leaseId, alice);
    expect(rec).toMatchObject({ name: 'demo', ownerId: alice.id, status: 'active' });
    expect(registry.listByOwner(alice).map((r) => r.name)).toEqual(['demo']);
  });

  it('a second claim of @demo fails', async () => {
    const { registry } = setup();
    registry.confirm((await registry.reserve('demo', alice)).leaseId, alice);
    expect(await code(registry.reserve('DEMO', bob))).toBe('taken');
  });

  it('rejects invalid and reserved names', async () => {
    const { registry, clock } = setup();
    expect(await code(registry.reserve('a-b', alice))).toBe('invalid_name');
    clock.advance(MIN);
    expect(await code(registry.reserve('admin', alice))).toBe('reserved');
  });

  it('denies the 2nd claim attempt within a minute', async () => {
    const { registry, clock } = setup();
    await registry.reserve('first', alice);
    expect(await code(registry.reserve('second', alice))).toBe('rate_limited');
    expect(registry.get('second')).toBeUndefined();
    clock.advance(MIN);
    expect(await code(registry.reserve('second', alice))).toBe('ok');
  });

  it('denies the 6th claim attempt in a day', async () => {
    const { registry, clock } = setup();
    for (let i = 1; i <= 5; i++) {
      expect(await code(registry.reserve(`name_${i}`, alice))).toBe('ok');
      clock.advance(MIN);
    }
    expect(await code(registry.reserve('name_6', alice))).toBe('rate_limited');
    expect(await code(registry.reserve('name_6', bob))).toBe('ok'); // per-account
  });

  it('lease expiry releases the name', async () => {
    const { registry, clock } = setup();
    const lease = await registry.reserve('demo', alice);
    clock.advance(5 * MIN);
    expect(registry.get('demo')).toBeUndefined();
    expect(await code(() => registry.confirm(lease.leaseId, alice))).toBe('lease_expired');
    expect(await code(registry.reserve('demo', bob))).toBe('ok');
  });

  it('expireStale() drops abandoned reservations', async () => {
    const { registry, clock } = setup();
    await registry.reserve('ghost', alice);
    clock.advance(5 * MIN + 1);
    expect(registry.expireStale()).toBe(1);
    expect(registry.listByOwner(alice)).toEqual([]);
  });

  it('release by a non-owner is denied; owner release frees the name', async () => {
    const { registry, clock } = setup();
    registry.confirm((await registry.reserve('demo', alice)).leaseId, alice);
    expect(await code(() => registry.release('demo', bob))).toBe('forbidden');
    registry.release('@demo', alice);
    expect(registry.get('demo')).toBeUndefined();
    clock.advance(MIN);
    expect(await code(registry.reserve('demo', bob))).toBe('ok');
  });

  it('release by lease (Claim rollback)', async () => {
    const { registry } = setup();
    const lease = await registry.reserve('demo', alice);
    registry.release(lease, alice);
    expect(registry.get('demo')).toBeUndefined();
  });

  it('concurrent claims of the same name: exactly one wins', async () => {
    const { registry } = setup();
    const owners = Array.from({ length: 10 }, (_, i) => ({ id: `dev:u${i}` }));
    const results = await Promise.all(owners.map((o) => code(registry.reserve('race', o))));
    expect(results.filter((r) => r === 'ok')).toHaveLength(1);
    expect(results.filter((r) => r === 'taken')).toHaveLength(9);
  });

  it('uses the injected quota counter', async () => {
    const t = 0;
    const quota = new QuotaCounter(() => t);
    const registry = new Registry({ store: makeStore(), quota, now: () => t });
    await registry.reserve('one', alice);
    expect(quota.consume(alice.id, 'claimsPerMinute').allowed).toBe(false);
  });
});

describe('SqliteHandleStore', () => {
  it('two connections to one DB file race on UNIQUE(name): one wins', async () => {
    const file = join(tmp, 'race.db');
    const a = new SqliteHandleStore(file);
    const b = new SqliteHandleStore(file);
    const regA = new Registry({ store: a });
    const regB = new Registry({ store: b });
    const results = await Promise.all([
      code(regA.reserve('shared', alice)),
      code(regB.reserve('shared', bob)),
    ]);
    expect(results.sort()).toEqual(['ok', 'taken']);
    expect(a.getByName('shared')).toEqual(b.getByName('shared'));
    a.close();
    b.close();
  });

  it('persists across reopen', async () => {
    const file = join(tmp, 'persist.db');
    const s1 = new SqliteHandleStore(file);
    const reg = new Registry({ store: s1 });
    reg.confirm((await reg.reserve('keep', alice)).leaseId, alice);
    s1.close();
    const s2 = new SqliteHandleStore(file);
    expect(s2.getByName('keep')?.status).toBe('active');
    s2.close();
  });
});
