#!/usr/bin/env bash
# OWASP ZAP baseline (Docker) + Snyk CLI.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$QA_ROOT/.." && pwd)"
RAW="$QA_ROOT/reports/raw"
mkdir -p "$RAW"

ZAP_TARGET="${ZAP_TARGET:-http://host.docker.internal:5173}"

echo "[security] Snyk (root + backend)"
if [[ "${SKIP_SNYK:-}" == "1" ]]; then
  echo "SKIP_SNYK=1 — skipping"
elif [[ -z "${SNYK_TOKEN:-}" ]]; then
  echo "SNYK_TOKEN not set — skipping Snyk"
else
  (cd "$REPO_ROOT" && npx --yes snyk@latest test --severity-threshold=high --json-file-output="$RAW/snyk-root.json" || true)
  (cd "$REPO_ROOT/backend" && npx --yes snyk@latest test --severity-threshold=high --file=requirements.txt --json-file-output="$RAW/snyk-backend.json" || true)
fi

echo "[security] OWASP ZAP baseline (Docker)"
if [[ "${SKIP_ZAP:-}" == "1" ]]; then
  echo "SKIP_ZAP=1 — skipping ZAP"
elif ! command -v docker &>/dev/null; then
  echo "Docker not found — skipping ZAP"
else
  docker run --rm -v "$RAW:/zap/wrk/out:rw" ghcr.io/zaproxy/zaproxy:stable \
    zap-baseline.py -t "$ZAP_TARGET" -J /zap/wrk/out/zap-report.json 2>&1 | tee "$RAW/zap-baseline.log" || true
fi

echo "[security] Done. Outputs: $RAW"
