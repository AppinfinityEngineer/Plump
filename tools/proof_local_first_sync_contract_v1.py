#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()

checks = {
    "frontend/src/models/sync.ts": [
        "LOCAL_SYNC_SCHEMA_VERSION",
        "export type SyncStatus",
        "export interface LocalSyncFields",
        "export function makeSyncFields",
        "export function touchSyncFields",
        "export function markRecordSynced",
        "export function normalizeGoal",
        "export function normalizeDeposit",
    ],
    "frontend/src/models/goal.ts": [
        "import type { LocalSyncFields } from './sync';",
        "export interface Goal extends LocalSyncFields",
        "updatedAt: string;",
    ],
    "frontend/src/models/deposit.ts": [
        "import type { LocalSyncFields } from './sync';",
        "export interface Deposit extends LocalSyncFields",
        "updatedAt: string;",
    ],
    "frontend/src/storage/repositories.ts": [
        "normalizeGoal",
        "normalizeDeposit",
        "return goals.map(normalizeGoal);",
        "return deposits.map(normalizeDeposit);",
        "const normalized = normalizeGoal(goal);",
        "const normalized = normalizeDeposit(deposit);",
    ],
    "frontend/src/state/AppProvider.tsx": [
        "makeSyncFields",
        "touchSyncFields",
        "...makeSyncFields(now)",
        "...touchSyncFields(g, now)",
        "updatedAt: now,",
    ],
    "docs/sync/local-first-sync-contract.md": [
        "The device/local repository remains the source of truth.",
        "Deposits are append-only in MVP.",
        "No backend writes.",
        "backend-device-auth-and-write-protection-v1",
        "backend-sync-mirror-v1",
    ],
}

errors = []
for rel, markers in checks.items():
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing file: {rel}")
        continue
    text = path.read_text(encoding="utf-8")
    for marker in markers:
        if marker not in text:
            errors.append(f"{rel} missing proof marker: {marker}")

repo = ROOT / "frontend/src/storage/repositories.ts"
if repo.exists():
    text = repo.read_text(encoding="utf-8")
    if "all.push(deposit);" in text:
        errors.append("depositRepository.add still appends raw deposit instead of normalized deposit")
    if "return readJSON<Goal[]>(KEYS.goals, []);" in text:
        errors.append("goalRepository.list still returns raw goals without normalization")
    if "return readJSON<Deposit[]>(KEYS.deposits, []);" in text:
        errors.append("depositRepository.list still returns raw deposits without normalization")

if errors:
    print("LOCAL FIRST SYNC CONTRACT PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("LOCAL FIRST SYNC CONTRACT PROOF: PASS")
