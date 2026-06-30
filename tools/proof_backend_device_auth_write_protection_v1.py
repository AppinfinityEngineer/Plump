#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
errors = []

checks = {
    "backend/server.py": [
        "import hashlib",
        "import hmac",
        "import time",
        "from fastapi import FastAPI, APIRouter, Request, Depends, Header, HTTPException",
        "device_auth_secret = os.environ.get(\"PLUMP_DEVICE_AUTH_SECRET\")",
        "MAX_SIGNATURE_AGE_SECONDS = 300",
        "def compute_device_signature",
        "async def require_signed_device_write",
        "x_plump_device_id",
        "x_plump_timestamp",
        "x_plump_signature",
        "hmac.compare_digest",
        "@api_router.post(\"/v1/events\")",
        "async def events(batch: EventBatch, _auth: dict[str, str] = Depends(require_signed_device_write))",
        "@api_router.post(\"/v1/sync\")",
        "async def sync(payload: SyncPayload, _auth: dict[str, str] = Depends(require_signed_device_write))",
    ],
    "backend/.env.example": [
        "MONGO_URL=",
        "DB_NAME=plump_staging",
        "ENVIRONMENT=staging",
        "PLUMP_DEVICE_AUTH_SECRET=",
    ],
    "docs/backend/device-auth-and-write-protection.md": [
        "POST /api/v1/events",
        "POST /api/v1/sync",
        "X-Plump-Device-Id",
        "X-Plump-Timestamp",
        "X-Plump-Signature",
        "HMAC_SHA256",
        "Requests older/newer than 5 minutes are rejected.",
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

server = ROOT / "backend/server.py"
if server.exists():
    text = server.read_text(encoding="utf-8")
    if "Depends(require_signed_device_write)" not in text:
        errors.append("write endpoints are not protected by signed device dependency")
    for public_marker in [
        "@api_router.get(\"/health\")",
        "@api_router.get(\"/\")",
        "@api_router.get(\"/v1/config\")",
    ]:
        if public_marker not in text:
            errors.append(f"public endpoint marker missing: {public_marker}")

if errors:
    print("BACKEND DEVICE AUTH WRITE PROTECTION PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("BACKEND DEVICE AUTH WRITE PROTECTION PROOF: PASS")
