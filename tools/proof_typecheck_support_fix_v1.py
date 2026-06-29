#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
errors = []

ui_path = ROOT / "frontend/src/components/ui.tsx"
pkg_path = ROOT / "frontend/package.json"
env_path = ROOT / "frontend/app/goal/[id]/envelopes.tsx"

if not ui_path.exists():
    errors.append("missing frontend/src/components/ui.tsx")
else:
    ui = ui_path.read_text(encoding="utf-8")
    for marker in [
        "testID?: string;",
        "testID={testID} edges={edges}",
        "export function Screen({",
    ]:
        if marker not in ui:
            errors.append(f"Screen component missing marker: {marker}")

if not pkg_path.exists():
    errors.append("missing frontend/package.json")
else:
    pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
    scripts = pkg.get("scripts", {})
    if scripts.get("preinstall") != "node ./scripts/cmd-guard.js --preinstall":
        errors.append("package.json preinstall is not Windows-safe node invocation")
    if scripts.get("typecheck") != "tsc --noEmit":
        errors.append("package.json missing typecheck script")

if not env_path.exists():
    errors.append("missing frontend/app/goal/[id]/envelopes.tsx")
else:
    env = env_path.read_text(encoding="utf-8")
    if "typeof progress.nextSuggestedSlot === 'number'" not in env:
        errors.append("envelopes.tsx does not narrow nextSuggestedSlot before Pressable")
    if "onTap(progress.nextSuggestedSlot as number, false)" not in env:
        errors.append("envelopes.tsx nextSuggestedSlot tap marker missing")

if errors:
    print("TYPECHECK SUPPORT FIX PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("TYPECHECK SUPPORT FIX PROOF: PASS")
