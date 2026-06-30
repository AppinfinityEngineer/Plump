#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/src/components/PlumpCard.tsx": [
        "function progressHeadline",
        "Halfway plumped",
        "First wobble unlocked",
        "I’m plumping it",
        "milestoneLabel?: string;",
        "brandPill",
        "mascotHalo",
        "shareBadge",
        "watermarkTop",
    ],
    "frontend/app/goal/[id]/card.tsx": [
        "function shareSubline",
        "function shareMilestoneLabel",
        "shareSubline(goal.challengeType, progress)",
        "milestoneLabel={shareMilestoneLabel(progress.percent)}",
        "My Plump progress:",
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

card_screen = ROOT / "frontend/app/goal/[id]/card.tsx"
if card_screen.exists():
    text = card_screen.read_text(encoding="utf-8")
    if "`${progress.filledCount} / ${progress.totalSlots} envelopes`" in text:
        errors.append("card.tsx still hardcodes envelopes in share card subline")

if errors:
    print("SHARE CARD POLISH PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("SHARE CARD POLISH PROOF: PASS")
