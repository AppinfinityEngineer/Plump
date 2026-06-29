#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/app/goal/[id]/envelopes.tsx": [
        "function saveCountLabel",
        "function saveLogTitle",
        "function saveLogItemTitle",
        "Progress history",
        "Money you keep will appear here as your no-spend wins.",
        "{saveCountLabel(deposits.length)}",
        "saveLogItemTitle(challengeType, deposit)",
        "Your saves will appear here once you start filling your path.",
    ],
    "frontend/app/goal/[id]/save.tsx": [
        "function saveButtonLabel",
        "function notePlaceholder",
        "function successTitle",
        "function successCopy",
        "safeButtonWrap",
        "contentContainerStyle={styles.scroll}",
        "label={saveButtonLabel(goal.challengeType)}",
        "placeholder={notePlaceholder(goal.challengeType)}",
        "{successTitle(goal.challengeType)}",
        "{successCopy(goal.challengeType)}",
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

for rel in ["frontend/app/goal/[id]/envelopes.tsx"]:
    path = ROOT / rel
    if path.exists():
        text = path.read_text(encoding="utf-8")
        forbidden = ["rows</AppText>", "appear here as rows", "Every logged save becomes a row"]
        for bad in forbidden:
            if bad in text:
                errors.append(f"{rel} still contains rough copy: {bad}")

if errors:
    print("SAVE FLOW UI POLISH PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("SAVE FLOW UI POLISH PROOF: PASS")
