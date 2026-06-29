#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/src/storage/repositories.ts": [
        "async replaceAll(deposits: Deposit[]): Promise<void>",
        "async clear(): Promise<void>",
    ],
    "frontend/src/state/AppProvider.tsx": [
        "resetDemoState: () => Promise<void>;",
        "const resetDemoState = useCallback",
        "goalRepository.replaceAll([])",
        "depositRepository.clear()",
        "entitlementRepository.set(FREE_ENTITLEMENT)",
        "settingsRepository.set(DEFAULT_SETTINGS)",
        "reviewPromptRepository.set(INITIAL_REVIEW_STATE)",
    ],
    "frontend/app/(tabs)/settings.tsx": [
        "import { useRouter } from 'expo-router';",
        "resetDemoState",
        "Reset demo / show onboarding",
        "settings-reset-demo",
        "router.replace('/' as never)",
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
    print("DEV RESET ONBOARDING PAYWALL V2 PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("DEV RESET ONBOARDING PAYWALL V2 PROOF: PASS")
