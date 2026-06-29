#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
path = ROOT / "frontend/app/onboarding/card-reveal.tsx"
errors = []

if not path.exists():
    errors.append("missing file: frontend/app/onboarding/card-reveal.tsx")
else:
    text = path.read_text(encoding="utf-8")
    markers = [
        "ProgressDots total={10} index={9}",
        "Your Plump card is ready",
        "You built the plan. Now unlock the save loop and start filling it.",
        "card-reveal-main-card",
        "card-reveal-future-preview",
        "Look what you are unlocking",
        "Empty card · ready to fill",
        "Goal complete",
        "Start filling my card",
        "track('card_generated')",
        "haptics.revealBeat()",
    ]
    for marker in markers:
        if marker not in text:
            errors.append(f"missing proof marker: {marker}")

if errors:
    print("CARD REVEAL CONVERSION MOMENT PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("CARD REVEAL CONVERSION MOMENT PROOF: PASS")
