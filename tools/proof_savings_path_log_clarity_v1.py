#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/app/goal/[id]/envelopes.tsx": [
        "SavingsPathScreen",
        "Save log",
        "save-log-row-",
        "PENNY PATH PROGRESS",
        "Every logged save becomes a row",
        "formatGBP(progress.nextSuggestedAmount)",
        "How it works",
        "LegendDot",
    ],
    "frontend/app/goal/[id]/save.tsx": [
        "supportsNumberedPath",
        "goal.challengeType === 'penny_365'",
        "Day ${slot}",
        "router.replace(`/goal/${goal.id}/envelopes`)",
        "Moved it to my savings pot",
    ],
    "frontend/app/(tabs)/index.tsx": [
        "function pathButtonLabel",
        "View penny path",
        "nextSaveLabel(activeGoal.challengeType, progress.nextSuggestedSlot)",
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
    print("SAVINGS PATH LOG CLARITY PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("SAVINGS PATH LOG CLARITY PROOF: PASS")
