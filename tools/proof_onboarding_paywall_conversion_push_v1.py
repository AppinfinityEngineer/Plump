#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/app/onboarding/card-reveal.tsx": [
        "This is your £0 starting card",
        "cardY",
        "cardX",
        "rotate",
        "Unlock the saving loop",
    ],
    "frontend/app/onboarding/goal.tsx": [
        "Make it yours",
        "YOUR NAME",
        "user-name-input",
        "userName: userName.trim()",
        "OnboardingHeader step={5} total={10}",
    ],
    "frontend/app/paywall.tsx": [
        "Start filling {goalName}",
        "Unlock what you just made",
        "PlumpCard",
        "Benefit icon=",
        "Start filling with 3 days free",
        "Built to help you finish {goalName}",
    ],
    "frontend/src/models/settings.ts": [
        "userName?: string;",
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

# exact negative marker: duplicated floating mascot testID should be gone
card = ROOT / "frontend/app/onboarding/card-reveal.tsx"
if card.exists() and "card-reveal-floating-mascot" in card.read_text(encoding="utf-8"):
    errors.append("card reveal still contains duplicate floating mascot testID")

if errors:
    print("ONBOARDING PAYWALL CONVERSION PUSH PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("ONBOARDING PAYWALL CONVERSION PUSH PROOF: PASS")
