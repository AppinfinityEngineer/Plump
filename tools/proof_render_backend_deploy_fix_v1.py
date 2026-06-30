#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
errors = []

req = ROOT / "backend/requirements.txt"
runtime = ROOT / "backend/runtime.txt"

if not req.exists():
    errors.append("missing backend/requirements.txt")
else:
    text = req.read_text(encoding="utf-8")
    required = [
        "fastapi==0.110.1",
        "uvicorn[standard]==0.25.0",
        "python-dotenv>=1.0.1",
        "pydantic>=2.6.4",
        "pymongo==4.6.3",
        "motor==3.3.1",
    ]
    for marker in required:
        if marker not in text:
            errors.append(f"requirements missing: {marker}")
    forbidden = [
        "emergentintegrations",
        "pandas",
        "numpy",
        "boto3",
        "black",
        "flake8",
        "mypy",
        "jq",
    ]
    for marker in forbidden:
        if marker in text:
            errors.append(f"requirements still contains unnecessary/deploy-risk dependency: {marker}")

if not runtime.exists():
    errors.append("missing backend/runtime.txt")
else:
    value = runtime.read_text(encoding="utf-8").strip()
    if value != "python-3.11.9":
        errors.append(f"runtime.txt should be python-3.11.9, got: {value}")

if errors:
    print("RENDER BACKEND DEPLOY FIX PROOF: FAIL")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("RENDER BACKEND DEPLOY FIX PROOF: PASS")
