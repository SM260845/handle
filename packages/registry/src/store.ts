export type HandleStatus = 'pending' | 'active';

export interface HandleRecord {
  name: string;
  ownerId: string;
  status: HandleStatus;
  /** Set while pending; cleared on confirm. */
  leaseId: string | null;
  /** Epoch ms after which a pending reservation is abandoned. Null once active. */
  leaseExpiresAt: number | null;
  createdAt: number;
  confirmedAt: number | null;
}

/**
 * Storage for handle reservations. Implementations MUST guarantee name uniqueness atomically
 * (DB UNIQUE constraint or equivalent) — `tryInsert` is the only way a name gets taken.
 */
export interface HandleStore {
  /**
   * Atomically: drop an expired pending lease on `rec.name` (if any), then insert.
   * Returns false if the name is already held (active, or pending with a live lease).
   */
  tryInsert(rec: HandleRecord, now: number): boolean;
  getByName(name: string): HandleRecord | undefined;
  getByLease(leaseId: string): HandleRecord | undefined;
  /** Promote a pending lease to active. Returns false if no matching pending row. */
  confirm(leaseId: string, confirmedAt: number): boolean;
  delete(name: string): boolean;
  listByOwner(ownerId: string): HandleRecord[];
  /** Delete pending rows whose lease expired at or before `now`. Returns count. */
  deleteExpired(now: number): number;
}

const isExpiredPending = (r: HandleRecord, now: number) =>
  r.status === 'pending' && r.leaseExpiresAt !== null && r.leaseExpiresAt <= now;

/** In-memory store (tests, dev). Single-threaded JS makes each method atomic. */
export class MemoryHandleStore implements HandleStore {
  private readonly byName = new Map<string, HandleRecord>();

  tryInsert(rec: HandleRecord, now: number): boolean {
    const existing = this.byName.get(rec.name);
    if (existing && !isExpiredPending(existing, now)) return false;
    this.byName.set(rec.name, { ...rec });
    return true;
  }

  getByName(name: string): HandleRecord | undefined {
    const r = this.byName.get(name);
    return r && { ...r };
  }

  getByLease(leaseId: string): HandleRecord | undefined {
    for (const r of this.byName.values()) if (r.leaseId === leaseId) return { ...r };
    return undefined;
  }

  confirm(leaseId: string, confirmedAt: number): boolean {
    for (const r of this.byName.values()) {
      if (r.leaseId === leaseId && r.status === 'pending') {
        r.status = 'active';
        r.leaseId = null;
        r.leaseExpiresAt = null;
        r.confirmedAt = confirmedAt;
        return true;
      }
    }
    return false;
  }

  delete(name: string): boolean {
    return this.byName.delete(name);
  }

  listByOwner(ownerId: string): HandleRecord[] {
    return [...this.byName.values()].filter((r) => r.ownerId === ownerId).map((r) => ({ ...r }));
  }

  deleteExpired(now: number): number {
    let n = 0;
    for (const [name, r] of this.byName) {
      if (isExpiredPending(r, now)) {
        this.byName.delete(name);
        n++;
      }
    }
    return n;
  }
}
