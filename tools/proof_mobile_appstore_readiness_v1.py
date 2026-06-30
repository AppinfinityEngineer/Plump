#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
errors = []

APPLE_TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
PRIVACY_URL = "https://docs.google.com/document/d/e/2PACX-1vQzXNr50T8jjdN3oYoszMwBshdex7y3PSh0a3p7tE6zEKG5Jb4k8dEmXLeVYYdr2T3bnqjJJIJQxQ5S/pub"

app_json_path = ROOT / "frontend/app.json"
manifest_path = ROOT / "frontend/PrivacyInfo.xcprivacy"
plugin_path = ROOT / "frontend/plugins/with-privacy-manifest.js"
doc_path = ROOT / "docs/app-review/mobile-appstore-readiness.md"
paywall_path = ROOT / "frontend/app/paywall.tsx"

if not app_json_path.exists():
    errors.append("missing frontend/app.json")
else:
    data = json.loads(app_json_path.read_text(encoding="utf-8"))
    plugins = data.get("expo", {}).get("plugins", [])
    if "./plugins/with-privacy-manifest" not in plugins:
        errors.append("app.json missing ./plugins/with-privacy-manifest plugin")
    ios = data.get("expo", {}).get("ios", {})
    if ios.get("bundleIdentifier") != "com.thoughtsnaplabs.plump":
        errors.append("unexpected or missing iOS bundle identifier")
    if ios.get("infoPlist", {}).get("ITSAppUsesNonExemptEncryption") is not False:
        errors.append("ITSAppUsesNonExemptEncryption should remain false")

if not manifest_path.exists():
    errors.append("missing frontend/PrivacyInfo.xcprivacy")
else:
    text = manifest_path.read_text(encoding="utf-8")
    for marker in [
        "NSPrivacyTracking",
        "<false/>",
        "NSPrivacyTrackingDomains",
        "NSPrivacyCollectedDataTypes",
        "NSPrivacyAccessedAPITypes",
    ]:
        if marker not in text:
            errors.append(f"PrivacyInfo.xcprivacy missing marker: {marker}")

if not plugin_path.exists():
    errors.append("missing frontend/plugins/with-privacy-manifest.js")
else:
    text = plugin_path.read_text(encoding="utf-8")
    for marker in [
        "withDangerousMod",
        "PrivacyInfo.xcprivacy",
        "copyFileSync",
        "platformProjectRoot",
    ]:
        if marker not in text:
            errors.append(f"privacy manifest plugin missing marker: {marker}")

if not paywall_path.exists():
    errors.append("missing frontend/app/paywall.tsx")
else:
    text = paywall_path.read_text(encoding="utf-8")
    for marker in [
        f"const TERMS_URL = '{APPLE_TERMS_URL}';",
        f"const PRIVACY_URL = '{PRIVACY_URL}';",
        'testID="paywall-terms-link"',
        'testID="paywall-privacy-link"',
        'testID="paywall-restore-button"',
        "Privacy Policy",
    ]:
        if marker not in text:
            errors.append(f"paywall missing marker: {marker}")
    if "https://plump.app/terms" in text or "https://plump.app/privacy" in text:
        errors.append("paywall still contains placeholder plump.app legal URL")

if not doc_path.exists():
    errors.append("missing docs/app-review/mobile-appstore-readiness.md")
else:
    text = doc_path.read_text(encoding="utf-8")
    for marker in [
        "Plump is a paid savings challenge app.",
        "Apple's Standard Licensed Application End User License Agreement",
        APPLE_TERMS_URL,
        PRIVACY_URL,
        "No bank connection.",
        "No financial advice.",
        "Apple approval is not the public paid launch gate.",
        "production-iap-server-validation-v1",
        "app-store-server-notifications-v1",
    ]:
        if marker not in text:
            errors.append(f"readiness doc missing marker: {marker}")

if errors:
    print("MOBILE APP STORE READINESS PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("MOBILE APP STORE READINESS PROOF: PASS")
