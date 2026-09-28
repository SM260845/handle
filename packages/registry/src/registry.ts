import { randomUUID } from 'node:crypto';
import { QuotaCounter, QuotaExceededError, guard } from '@handle/quota';
import { validateName } from './names.js';
import type { HandleRecord, HandleStore } from './store.js';

/** Who owns a handle. Produced by an authenticator (see @handle/api auth); registry trusts it. */
export interface OwnerIdentity {
  /** Stable account id (e.g. `github:12345` once OAuth lands, `dev:alice` in dev). */
  id: string;
}

export interface Lease {
  leaseId: string;
  name: string;
  ownerId: string;
  expiresAt: number;
}

export type RegistryErrorCode =
  | 'invalid_name'
  | 'reserved'
  | 'taken'
  | 'rate_limited'
  | 'not_found'
  | 'forbidden'
  | 'lease_expired';

export class RegistryError extends Error {
  constructor(
    public readonly code: RegistryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'RegistryError';
  }
}

/** Default lease: an unconfirmed claim auto-releases after 5 minutes (Hero Claim rollback). */
export const DEFAULT_LEASE_TTL_MS = 5 * 60_000;

export interface RegistryOptions {
  store: HandleStore;
  quota?: QuotaCounter;
  now?: () => number;
  leaseTtlMs?: number;
}

export class Registry {
  private readonly store: HandleStore;
  private readonly quota: QuotaCounter;
  private readonly now: () => number;
  private readonly leaseTtlMs: number;

  constructor(opts: RegistryOptions) {
    this.store = opts.store;
    this.now = opts.now ?? Date.now;
    this.quota = opts.quota ?? new QuotaCounter(this.now);
    this.leaseTtlMs = opts.leaseTtlMs ?? DEFAULT_LEASE_TTL_MS;
  }

  /**
   * Reserve `@name` for `owner` with a time-limited lease.
   * Claim attempts are rate limited (1/min, 5/day per account) via @handle/quota BEFORE any work.
   */
  async reserve(nameInput: string, owner: OwnerIdentity): Promise<Lease> {
    try {
      return await guard(this.quota, owner.id, 'claimsPerMinute', () =>
        guard(this.quota, owner.id, 'claimsPerDay', () => this.doReserve(nameInput, owner)),
      );
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        throw new RegistryError('rate_limited', err.message);
      }
      throw err;
    }
  }

  private doReserve(nameInput: string, owner: OwnerIdentity): Lease {
    const check = validateName(nameInput);
    if (!check.ok) throw new RegistryError(check.code, check.reason);
    const now = this.now();
    const lease: Lease = {
      leaseId: randomUUID(),
      name: check.name,
      ownerId: owner.id,
      expiresAt: now + this.leaseTtlMs,
    };
    const inserted = this.store.tryInsert(
      {
        name: lease.name,
        ownerId: owner.id,
        status: 'pending',
        leaseId: lease.leaseId,
        leaseExpiresAt: lease.expiresAt,
        createdAt: now,
        confirmedAt: null,
      },
      now,
    );
    if (!inserted) throw new RegistryError('taken', `@${lease.name} is already taken`);
    return lease;
  }

  /** Promote a live lease to an active handle. */
  confirm(leaseId: string, owner: OwnerIdentity): HandleRecord {
    const rec = this.store.getByLease(leaseId);
    if (!rec) throw new RegistryError('not_found', 'lease not found');
    if (rec.ownerId !== owner.id) throw new RegistryError('forbidden', 'not the lease owner');
    if (rec.leaseExpiresAt !== null && rec.leaseExpiresAt <= this.now()) {
      this.store.deleteExpired(this.now());
      throw new RegistryError('lease_expired', 'lease expired; claim again');
    }
    if (!this.store.confirm(leaseId, this.now())) {
      throw new RegistryError('not_found', 'lease not found');
    }
    return this.store.getByName(rec.name)!;
  }

  /** Release a handle (by name or lease id). Only the owner may release. */
  release(nameOrLease: string | Lease, owner: OwnerIdentity): void {
    const rec =
      typeof nameOrLease === 'string'
        ? (this.store.getByName(validateNameLoose(nameOrLease)) ??
          this.store.getByLease(nameOrLease))
        : this.store.getByLease(nameOrLease.leaseId);
    if (!rec) throw new RegistryError('not_found', 'handle not found');
    if (rec.ownerId !== owner.id)
      throw new RegistryError('forbidden', 'only the owner can release');
    this.store.delete(rec.name);
  }

  /** Drop abandoned (expired, unconfirmed) reservations. Returns how many were released. */
  expireStale(): number {
    return this.store.deleteExpired(this.now());
  }

  /** Current holder of `@name`, or undefined (expired pending leases read as free). */
  get(nameInput: string): HandleRecord | undefined {
    const rec = this.store.getByName(validateNameLoose(nameInput));
    if (!rec) return undefined;
    if (
      rec.status === 'pending' &&
      rec.leaseExpiresAt !== null &&
      rec.leaseExpiresAt <= this.now()
    ) {
      return undefined;
    }
    return rec;
  }

  listByOwner(owner: OwnerIdentity): HandleRecord[] {
    return this.store.listByOwner(owner.id);
  }
}

function validateNameLoose(input: string): string {
  return input.trim().replace(/^@/, '').toLowerCase();
}
