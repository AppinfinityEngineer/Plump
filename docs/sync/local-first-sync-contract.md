# Local-First Sync Contract

Branch: `feature/local-first-sync-contract-v1`

## Rule

The device/local repository remains the source of truth.

Backend sync must be a mirror, not the authority, until a later explicit conflict-resolution branch changes that rule.

## Local record contract

Goals and deposits now carry sync-safe metadata:

- `schemaVersion`
- `syncStatus`
- `syncVersion`
- `localCreatedAt`
- `localUpdatedAt`
- `lastSyncedAt`
- `deletedAt`

## Sync status meanings

- `local_only`: local record that should never be synced.
- `pending_sync`: local record created or changed on-device and waiting for backend mirror.
- `synced`: backend mirror has acknowledged this exact local version.
- `conflict`: future state for conflict handling.

## Goal rules

Goals are mutable local records.

When a goal is created, archived, or completed:
- keep its stable `id`
- update `updatedAt`
- update `localUpdatedAt`
- increment `syncVersion`
- mark `syncStatus` as `pending_sync`

## Deposit rules

Deposits are append-only in MVP.

When a deposit is created:
- generate a stable local `id`
- keep the `goalId`
- set `createdAt`
- set `updatedAt`
- set `localCreatedAt`
- set `localUpdatedAt`
- set `schemaVersion`
- mark `syncStatus` as `pending_sync`

Do not update, delete, or rewrite deposits in normal app flow. If deletion is needed later, use `deletedAt` as a tombstone instead of removing history.

## Legacy normalization

Existing local goals/deposits are normalized when read from storage. Missing sync fields are added in memory and will be persisted on the next save/replace flow.

## Not in this branch

- No backend writes.
- No Atlas mirror.
- No device auth.
- No IAP validation.
- No App Store Server Notifications.
- No conflict resolution UI.

## Next sync branches

- `feature/backend-device-auth-and-write-protection-v1`
- `feature/backend-sync-mirror-v1`
- `feature/sync-conflict-resolution-v1`
