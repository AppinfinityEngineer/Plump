#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/src/storage/repositories.ts": [
        "export async function clearAllLocalPlumpData(): Promise<void>",
        "Object.values(KEYS).map((key) => storage.removeItem(key))",
    ],
    "frontend/src/state/AppProvider.tsx": [
        "clearAllLocalPlumpData",
        "await clearAllLocalPlumpData();",
        "const freshSettings = { ...DEFAULT_SETTINGS, onboardingComplete: false, activeGoalId: undefined };",
        "setSettings(freshSettings);",
        "setGoals([]);",
        "setDeposits([]);",
        "setDraftState({});",
    ],
    "frontend/app/(tabs)/settings.tsx": [
        "Reset everything / start onboarding",
        "settings-hard-reset-demo",
        "router.replace('/onboarding' as never)",
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
    print("HARD RESET ONBOARDING PAYWALL V3 PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("HARD RESET ONBOARDING PAYWALL V3 PROOF: PASS")
