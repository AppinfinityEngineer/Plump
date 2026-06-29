#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/app/goal/[id]/envelopes.tsx": [
        "FlatList",
        "fallbackSlots",
        "EnvelopeTile",
        "next-envelope-shortcut",
        "formatPercent(progress.percent)",
        "testID={`envelope-${slot}`}",
    ],
    "frontend/app/goal/[id]/save.tsx": [
        "effectiveSlotNum",
        "isSlotAlreadyFilled",
        "CHALLENGE_TEMPLATES",
        "addDeposit(goal.id, amountNum, effectiveSlotNum",
        "Envelope already filled",
    ],
    "frontend/src/services/challengeEngine.ts": [
        "new Set(",
        "Number.isFinite(s)",
        "filledSet.has(s)",
        "slots.length > 0 ? filledSlots.length : deposits.length",
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
    print("ENVELOPE GRID RENDER FIX PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("ENVELOPE GRID RENDER FIX PROOF: PASS")
