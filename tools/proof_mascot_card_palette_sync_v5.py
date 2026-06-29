#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/src/theme/theme.ts": [
        "export const CARD_PALETTES",
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
        "green: { id: 'green', name: 'Legacy green'",
        "pink: { id: 'pink', name: 'Legacy pink'",
        "honey: { id: 'honey', name: 'Legacy honey'",
        "dark: { id: 'dark', name: 'Legacy dark'",
    ],
    "frontend/app/onboarding/style.tsx": [
        "const PALETTE_ORDER",
        "'mint'",
        "'blueberry'",
        "'lavender'",
        "'strawberry'",
        "'charcoal'",
        "'golden'",
        "Choose the colour system for your envelopes, progress card, and share card.",
    ],
    "frontend/app/onboarding/card-reveal.tsx": [
        "const revealDraftRef = useRef",
        "revealDraftRef.current",
        "targetAmount",
        "mascotVariant",
        "palette",
        "firstName",
    ],
    "frontend/src/state/AppProvider.tsx": [
        "mascotVariant: draft.mascotVariant ?? 'honey'",
        "colorTheme: draft.cardPalette ?? 'cream'",
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

if errors:
    print("MASCOT CARD PALETTE SYNC V5 PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("MASCOT CARD PALETTE SYNC V5 PROOF: PASS")
