#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/app/onboarding/card-reveal.tsx": [
        "card-reveal-premium-glow",
        "card-reveal-premium-future-panel",
        "Unlock the saving loop",
        "paddingBottom: spacing.xxxl + spacing.xxl",
    ],
    "frontend/app/_layout.tsx": [
        "expo-status-bar",
        '<StatusBar style="dark"',
    ],
    "tools/proof_onboarding_paywall_conversion_push_v1.py": [
        "card-reveal-floating-mascot",
        "if card.exists() and",
    ],
}

errors = []

card = ROOT / "frontend/app/onboarding/card-reveal.tsx"
if card.exists():
    text = card.read_text(encoding="utf-8")
    forbidden = ["blobOne", "blobTwo", "pointerEvents=\"none\"\n            style={[styles.blob"]
    for bad in forbidden:
        if bad in text:
            errors.append(f"card reveal still contains artefact marker: {bad}")
else:
    errors.append("missing file: frontend/app/onboarding/card-reveal.tsx")

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
    print("CARD REVEAL UI CLEANUP PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("CARD REVEAL UI CLEANUP PROOF: PASS")
