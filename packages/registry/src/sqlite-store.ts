/**
 * SQLite-backed HandleStore using Node's built-in `node:sqlite` (Node >= 22.5, zero deps).
 * Uniqueness is enforced by `UNIQUE(name)`; stale-lease takeover runs in one IMMEDIATE txn.
 * Import via `@handle/registry/sqlite` so environments without `node:sqlite` can still load the core.
 */
import { DatabaseSync } from 'node:sqlite';
import type { HandleRecord, HandleStatus, HandleStore } from './store.js';

interface Row {
  name: string;
  owner_id: string;
  status: string;
  lease_id: string | null;
  lease_expires_at: number | null;
  created_at: number;
  confirmed_at: number | null;
}

const toRecord = (r: Row): HandleRecord => ({
  name: r.name,
  ownerId: r.owner_id,
  status: r.status as HandleStatus,
  leaseId: r.lease_id,
  leaseExpiresAt: r.lease_expires_at,
  createdAt: r.created_at,
  confirmedAt: r.confirmed_at,
});

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS handles (
  name             TEXT    NOT NULL UNIQUE,
  owner_id         TEXT    NOT NULL,
  status           TEXT    NOT NULL CHECK (status IN ('pending', 'active')),
  lease_id         TEXT    UNIQUE,
  lease_expires_at INTEGER,
  created_at       INTEGER NOT NULL,
  confirmed_at     INTEGER
);
CREATE INDEX IF NOT EXISTS handles_owner ON handles(owner_id);
CREATE INDEX IF NOT EXISTS handles_lease_exp ON handles(lease_expires_at) WHERE status = 'pending';
`;

export class SqliteHandleStore implements HandleStore {
  readonly db: DatabaseSync;

  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    this.db.exec(SCHEMA);
  }

  tryInsert(rec: HandleRecord, now: number): boolean {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare(
          `DELETE FROM handles WHERE name = ? AND status = 'pending' AND lease_expires_at <= ?`,
        )
        .run(rec.name, now);
      this.db
        .prepare(
          `INSERT INTO handles (name, owner_id, status, lease_id, lease_expires_at, created_at, confirmed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          rec.name,
          rec.ownerId,
          rec.status,
          rec.leaseId,
          rec.leaseExpiresAt,
          rec.createdAt,
          rec.confirmedAt,
        );
      this.db.exec('COMMIT');
      return true;
    } catch (err) {
      this.db.exec('ROLLBACK');
      if (err instanceof Error && /UNIQUE constraint failed/.test(err.message)) return false;
      throw err;
    }
  }

  getByName(name: string): HandleRecord | undefined {
    const r = this.db.prepare('SELECT * FROM handles WHERE name = ?').get(name) as Row | undefined;
    return r && toRecord(r);
  }

  getByLease(leaseId: string): HandleRecord | undefined {
    const r = this.db.prepare('SELECT * FROM handles WHERE lease_id = ?').get(leaseId) as
      Row | undefined;
    return r && toRecord(r);
  }

  confirm(leaseId: string, confirmedAt: number): boolean {
    const res = this.db
      .prepare(
        `UPDATE handles SET status = 'active', lease_id = NULL, lease_expires_at = NULL, confirmed_at = ?
         WHERE lease_id = ? AND status = 'pending'`,
      )
      .run(confirmedAt, leaseId);
    return Number(res.changes) === 1;
  }

  delete(name: string): boolean {
    return Number(this.db.prepare('DELETE FROM handles WHERE name = ?').run(name).changes) === 1;
  }

  listByOwner(ownerId: string): HandleRecord[] {
    return (
      this.db
        .prepare('SELECT * FROM handles WHERE owner_id = ? ORDER BY created_at')
        .all(ownerId) as unknown as Row[]
    ).map(toRecord);
  }

  deleteExpired(now: number): number {
    const res = this.db
      .prepare(`DELETE FROM handles WHERE status = 'pending' AND lease_expires_at <= ?`)
      .run(now);
    return Number(res.changes);
  }

  close(): void {
    this.db.close();
  }
}
