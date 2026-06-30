import type { Deposit } from './deposit';
import type { Goal } from './goal';

export const LOCAL_SYNC_SCHEMA_VERSION = 1 as const;

export type SyncStatus =
  | 'local_only'
  | 'pending_sync'
  | 'synced'
  | 'conflict';

export interface LocalSyncFields {
  schemaVersion: typeof LOCAL_SYNC_SCHEMA_VERSION;
  syncStatus: SyncStatus;
  syncVersion: number;
  localCreatedAt: string;
  localUpdatedAt: string;
  lastSyncedAt?: string;
  deletedAt?: string;
}

function isoNow(): string {
  return new Date().toISOString();
}

function safeIso(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) return fallback;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : value;
}

export function makeSyncFields(now: string = isoNow()): LocalSyncFields {
  return {
    schemaVersion: LOCAL_SYNC_SCHEMA_VERSION,
    syncStatus: 'pending_sync',
    syncVersion: 1,
    localCreatedAt: now,
    localUpdatedAt: now,
  };
}

export function touchSyncFields(
  record: Partial<LocalSyncFields> | undefined,
  now: string = isoNow(),
): LocalSyncFields {
  const createdAt = safeIso(record?.localCreatedAt, now);
  return {
    schemaVersion: LOCAL_SYNC_SCHEMA_VERSION,
    syncStatus: 'pending_sync',
    syncVersion: Math.max(1, record?.syncVersion ?? 1) + 1,
    localCreatedAt: createdAt,
    localUpdatedAt: now,
    lastSyncedAt: record?.lastSyncedAt,
    deletedAt: record?.deletedAt,
  };
}

export function markRecordSynced<T extends LocalSyncFields>(
  record: T,
  syncedAt: string = isoNow(),
): T {
  return {
    ...record,
    syncStatus: 'synced',
    lastSyncedAt: syncedAt,
  };
}

function normalizeSyncFields(
  record: Partial<LocalSyncFields>,
  createdAt: string,
  updatedAt: string,
): LocalSyncFields {
  return {
    schemaVersion: LOCAL_SYNC_SCHEMA_VERSION,
    syncStatus: record.syncStatus ?? 'pending_sync',
    syncVersion: Math.max(1, record.syncVersion ?? 1),
    localCreatedAt: safeIso(record.localCreatedAt, createdAt),
    localUpdatedAt: safeIso(record.localUpdatedAt, updatedAt),
    lastSyncedAt: record.lastSyncedAt,
    deletedAt: record.deletedAt,
  };
}

export function normalizeGoal(goal: Goal): Goal {
  const createdAt = safeIso(goal.createdAt, safeIso(goal.startDate, isoNow()));
  const updatedAt = safeIso(goal.updatedAt, createdAt);

  return {
    ...goal,
    createdAt,
    updatedAt,
    ...normalizeSyncFields(goal, createdAt, updatedAt),
  };
}

export function normalizeDeposit(deposit: Deposit): Deposit {
  const createdAt = safeIso(deposit.createdAt, safeIso(deposit.date, isoNow()));
  const updatedAt = safeIso(deposit.updatedAt, createdAt);

  return {
    ...deposit,
    createdAt,
    updatedAt,
    ...normalizeSyncFields(deposit, createdAt, updatedAt),
  };
}
