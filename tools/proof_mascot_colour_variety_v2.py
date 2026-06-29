#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/src/components/Mascot.tsx": [
        "'mint'",
        "'blueberry'",
        "'lavender'",
        "'strawberry'",
        "'charcoal'",
        "'golden'",
        "Mint Plump",
        "Blueberry Plump",
        "Lavender Plump",
        "Strawberry Plump",
        "Charcoal Plump",
        "Golden Plump",
        "MASCOT_VARIANTS[variant] ?? MASCOT_VARIANTS.honey",
    ],
    "frontend/app/onboarding/mascot.tsx": [
        "const MASCOT_CHOICES",
        "mascot-choice-mint",
        "mascot-choice-blueberry",
        "mascot-choice-lavender",
        "mascot-choice-strawberry",
        "mascot-choice-charcoal",
        "mascot-choice-golden",
        "Choose your Plump",
        "Pick the colour that feels like yours",
        "width: '47%'",
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
    print("MASCOT COLOUR VARIETY V2 PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("MASCOT COLOUR VARIETY V2 PROOF: PASS")
