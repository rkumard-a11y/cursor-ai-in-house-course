#!/usr/bin/env python3
"""Run lizard on backend + frontend; write reports/raw/lizard.json with max CCN."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def main() -> int:
    qa_root = Path(__file__).resolve().parents[1]
    repo_root = qa_root.parent
    raw = qa_root / "reports" / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    out_path = raw / "lizard.json"

    cmd = [
        sys.executable,
        "-m",
        "lizard",
        str(repo_root / "backend" / "app"),
        str(repo_root / "src"),
        "-l",
        "python",
        "-l",
        "typescript",
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, cwd=repo_root, check=False)
    except FileNotFoundError:
        out_path.write_text(json.dumps({"max_ccn": None, "error": "lizard_not_installed"}), encoding="utf-8")
        return 0

    text = (proc.stdout or "") + (proc.stderr or "")
    max_ccn = 0
    for line in text.splitlines():
        parts = line.split()
        if len(parts) < 6:
            continue
        loc = parts[-1]
        if "@" not in loc:
            continue
        if not loc.endswith((".py", ".ts", ".tsx")):
            continue
        try:
            max_ccn = max(max_ccn, int(parts[1]))
        except (ValueError, IndexError):
            continue

    payload = {
        "max_ccn": max_ccn if max_ccn > 0 else None,
        "exit_code": proc.returncode,
    }
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {out_path} max_ccn={payload['max_ccn']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
