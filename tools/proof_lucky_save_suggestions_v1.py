#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/src/services/luckySaveService.ts": [
        "export function getLuckySaveSuggestion",
        "export function routeForLuckySave",
        "EASY WIN",
        "LUCKY SAVE",
        "FEELING BOLD?",
        "TINY WIN",
        "NO-SPEND WIN",
        "Plump picked this one for today.",
    ],
    "frontend/app/(tabs)/index.tsx": [
        "getLuckySaveSuggestion",
        "routeForLuckySave",
        "const luckySave = getLuckySaveSuggestion(activeGoal, progress);",
        "testID=\"home-lucky-save-card\"",
        "{luckySave.eyebrow}",
        "{luckySave.tagline}",
        "onPress={() => router.push(routeForLuckySave(activeGoal, luckySave) as never)}",
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
    print("LUCKY SAVE SUGGESTIONS PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("LUCKY SAVE SUGGESTIONS PROOF: PASS")
