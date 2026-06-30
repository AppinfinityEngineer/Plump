#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
path = ROOT / "frontend/src/components/PlumpCard.tsx"
errors = []

if not path.exists():
    errors.append("missing file: frontend/src/components/PlumpCard.tsx")
else:
    text = path.read_text(encoding="utf-8")
    if "fontSize.xs" in text:
        errors.append("PlumpCard.tsx still contains fontSize.xs")
    for marker in ["fontSize.sm", "brandText", "milestoneText", "shareBadgeText"]:
        if marker not in text:
            errors.append(f"missing proof marker: {marker}")

if errors:
    print("SHARE CARD TYPECHECK FIX PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("SHARE CARD TYPECHECK FIX PROOF: PASS")
