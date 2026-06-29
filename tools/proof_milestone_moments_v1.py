#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/src/components/MilestoneModal.tsx": [
        "function milestoneHeadline",
        "function milestoneBody",
        "function challengeReward",
        "MILESTONE MOMENT",
        "milestone-percent-medal",
        "Goal complete",
        "Halfway plumped",
        "Chunky mode unlocked",
        "Share progress card",
        "motion=\"success\"",
        "challengeType?: ChallengeType;",
        "goalName?: string;",
    ],
    "frontend/app/goal/[id]/save.tsx": [
        "motion=\"success\"",
        "challengeType={goal.challengeType}",
        "goalName={goal.name}",
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
    print("MILESTONE MOMENTS PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("MILESTONE MOMENTS PROOF: PASS")
