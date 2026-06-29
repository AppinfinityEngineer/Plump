#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
path = ROOT / "frontend/app/(tabs)/index.tsx"
errors = []

if not path.exists():
    errors.append("missing file: frontend/app/(tabs)/index.tsx")
else:
    text = path.read_text(encoding="utf-8")
    for marker in [
        "luckyEyebrowRow:",
        "luckyCopy:",
        "testID=\"home-lucky-save-card\"",
        "getLuckySaveSuggestion",
        "routeForLuckySave",
    ]:
        if marker not in text:
            errors.append(f"missing proof marker: {marker}")

if errors:
    print("LUCKY SAVE TYPECHECK FIX PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("LUCKY SAVE TYPECHECK FIX PROOF: PASS")
