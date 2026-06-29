#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/app/onboarding/index.tsx": [
        "router.push('/onboarding/personality' as never)",
    ],
    "frontend/app/onboarding/challenge.tsx": [
        "router.push('/onboarding/education' as never)",
    ],
    "frontend/app/onboarding/preview.tsx": [
        "router.push('/onboarding/generation' as never)",
    ],
    "frontend/src/services/telemetryService.ts": [
        "| 'onboarding_saving_reason_selected'",
        "| 'card_generation_started'",
        "| 'card_generation_ready'",
    ],
}

errors = []
for rel, needles in checks.items():
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing file: {rel}")
        continue
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{rel} missing proof marker: {needle}")

if errors:
    print("ONBOARDING TYPECHECK FIX PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("ONBOARDING TYPECHECK FIX PROOF: PASS")
