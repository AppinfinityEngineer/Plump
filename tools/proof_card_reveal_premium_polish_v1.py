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
        "const PREMIUM =",
        "card-reveal-ready-pill",
        "card-reveal-premium-glow",
        "card-reveal-floating-mascot",
        "card-reveal-premium-future-panel",
        "Unlock the loop",
        "Your £0 card becomes a living progress card.",
        "Fill envelopes and log every save",
        "smug card unlocked",
        "Mascot variant={mascotVariant} plumpness={1} size={64} smug",
        "Animated.loop",
        "mascotFloat",
        "pillPulse",
    ]
    for marker in markers:
        if marker not in text:
            errors.append(f"missing proof marker: {marker}")

if errors:
    print("CARD REVEAL PREMIUM POLISH PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("CARD REVEAL PREMIUM POLISH PROOF: PASS")
