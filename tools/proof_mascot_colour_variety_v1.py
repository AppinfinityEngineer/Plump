#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/src/components/Mascot.tsx": [
        "export type MascotVariant =",
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
    ],
    "frontend/app/onboarding/mascot.tsx": [
        "MASCOT_CHOICES",
        "mint",
        "blueberry",
        "lavender",
        "strawberry",
        "charcoal",
        "golden",
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
    print("MASCOT COLOUR VARIETY PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("MASCOT COLOUR VARIETY PROOF: PASS")
