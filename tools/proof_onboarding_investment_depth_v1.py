#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/app/onboarding/index.tsx": [
        "router.push('/onboarding/personality')",
        "total={10}",
        "Start my setup",
    ],
    "frontend/app/onboarding/personality.tsx": [
        "onboarding-personality",
        "What are you saving for?",
        "savingReason",
        "personality-continue-button",
    ],
    "frontend/app/onboarding/challenge.tsx": [
        "step={2} total={10}",
        "router.push('/onboarding/education')",
    ],
    "frontend/app/onboarding/education.tsx": [
        "onboarding-education",
        "Plump does not move your money",
        "cash binder, bank pot, or savings account",
        "education-continue-button",
    ],
    "frontend/app/onboarding/style.tsx": [
        "step={4} total={10}",
        "CARD + PATH PREVIEW",
    ],
    "frontend/app/onboarding/goal.tsx": [
        "step={5} total={10}",
        "Give your card a goal worth coming back to",
    ],
    "frontend/app/onboarding/mascot.tsx": [
        "step={6} total={10}",
        "Preview plumpness",
    ],
    "frontend/app/onboarding/preview.tsx": [
        "step={7} total={10}",
        "router.push('/onboarding/generation')",
        "Build my card",
    ],
    "frontend/app/onboarding/generation.tsx": [
        "onboarding-generation",
        "Building your card",
        "Reveal my card",
        "card_generation_ready",
    ],
    "frontend/app/onboarding/card-reveal.tsx": [
        "total={10} index={9}",
        "You built the card",
    ],
    "frontend/src/models/settings.ts": [
        "savingReason?: string;",
        "commitmentLevel?: string;",
    ],
}

errors = []
for rel, needles in checks.items():
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing file: {rel}")
        continue
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{rel} missing proof marker: {needle}")

if errors:
    print("ONBOARDING INVESTMENT DEPTH PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("ONBOARDING INVESTMENT DEPTH PROOF: PASS")
