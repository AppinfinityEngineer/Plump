#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
errors = []

checks = {
    "frontend/src/services/deviceIdentityService.ts": [
        "plump.device.id",
        "getOrCreateDeviceId",
        "storage.secureGet",
        "storage.secureSet",
    ],
    "frontend/src/services/deviceSigningService.ts": [
        "hmacSha256Hex",
        "sha256Hex",
        "dependency-free HMAC-SHA256",
    ],
    "frontend/src/services/backendClient.ts": [
        "EXPO_PUBLIC_API_BASE_URL",
        "EXPO_PUBLIC_BACKEND_URL",
        "EXPO_PUBLIC_PLUMP_DEVICE_AUTH_SECRET",
        "signedBackendPost",
        "X-Plump-Device-Id",
        "X-Plump-Timestamp",
        "X-Plump-Signature",
        "hmacSha256Hex",
    ],
    "frontend/src/services/syncMirrorService.ts": [
        "mirrorLocalState",
        "SyncMirrorReason",
        "'/api/v1/sync'",
        "Local-first rule",
    ],
    "frontend/src/services/telemetryService.ts": [
        "signedBackendPost",
        "await signedBackendPost('/api/v1/events'",
        "backendMirrorConfigured",
    ],
    "frontend/src/state/AppProvider.tsx": [
        "mirrorLocalState",
        "void mirrorLocalState(g, d, 'app_open')",
        "void mirrorLocalState([...goals, goal], deposits, 'goal_created')",
        "void mirrorLocalState(next, deposits, 'goal_archived')",
        "void mirrorLocalState(goals, [...deposits, deposit], 'deposit_added')",
        "void mirrorLocalState(next, [...deposits, deposit], 'goal_completed')",
    ],
    "backend/server.py": [
        "async def safe_replace",
        "goal_mirrors",
        "deposit_mirrors",
        "payload.model_dump()",
        "reason",
    ],
    "docs/sync/backend-sync-mirror-v1.md": [
        "The device remains the source of truth.",
        "EXPO_PUBLIC_BACKEND_URL=https://plump-backend-staging.onrender.com",
        "goal_mirrors",
        "deposit_mirrors",
        "feature/production-device-registration-v1",
    ],
}

for rel, markers in checks.items():
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing file: {rel}")
        continue
    text = path.read_text(encoding="utf-8")
    for marker in markers:
        if marker not in text:
            errors.append(f"{rel} missing proof marker: {marker}")

if errors:
    print("BACKEND SYNC MIRROR V1 PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("BACKEND SYNC MIRROR V1 PROOF: PASS")
