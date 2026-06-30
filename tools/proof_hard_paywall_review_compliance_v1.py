#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
checks = {
    "frontend/app/paywall.tsx": [
        "type PaywallMode = 'dev' | 'testflight' | 'review' | 'production';",
        "const PAYWALL_MODE: PaywallMode = 'dev';",
        "function shouldShowPaywallClose",
        "return mode === 'dev' || mode === 'testflight';",
        "const showClose = shouldShowPaywallClose(PAYWALL_MODE);",
        "Plump is a paid savings challenge app.",
        "Choose a subscription or lifetime unlock",
        "testID=\"paywall-terms-link\"",
        "testID=\"paywall-privacy-link\"",
        "testID=\"paywall-restore-button\"",
        "Lifetime unlock is a one-time purchase for this Apple ID.",
        "Subscriptions renew automatically unless cancelled at least 24 hours before renewal.",
        "Manage or cancel anytime in your Apple ID subscriptions.",
    ],
    "docs/app-review/plump-review-notes.md": [
        "Plump is a paid savings challenge app.",
        "Use Apple sandbox In-App Purchase to unlock the app.",
        "Restore Purchases is visible on the paywall.",
        "Terms and Privacy Policy links are visible on the paywall.",
        "Apple approval is not the public paid launch gate.",
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

paywall = ROOT / "frontend/app/paywall.tsx"
if paywall.exists():
    text = paywall.read_text(encoding="utf-8")
    if "Terms · Privacy." in text:
        errors.append("paywall still contains non-clickable Terms · Privacy text")

if errors:
    print("HARD PAYWALL REVIEW COMPLIANCE PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("HARD PAYWALL REVIEW COMPLIANCE PROOF: PASS")

