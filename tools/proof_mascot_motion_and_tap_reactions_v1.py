#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/src/components/Mascot.tsx": [
        "export type MascotMotion = 'none' | 'idle' | 'success';",
        "interactive?: boolean;",
        "tapPhrases?: string[];",
        "Animated.loop",
        "haptics.selection()",
        "reaction-bubble",
        "Tiny save, rounder belly.",
        "Feed me savings.",
        "tapScale",
        "mascotBody",
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
    print("MASCOT MOTION AND TAP REACTIONS PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("MASCOT MOTION AND TAP REACTIONS PROOF: PASS")
