#!/usr/bin/env bash
# Master QA runner — pytest, Jest (+coverage), ESLint, Pylint, lizard (complexity),
# Snyk + ZAP, Playwright E2E (POM), Lighthouse CI, k6, aggregated HTML dashboard.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$QA_ROOT/.." && pwd)"
RAW="$QA_ROOT/reports/raw"
mkdir -p "$RAW"

echo "== QA root: $QA_ROOT =="
cd "$QA_ROOT"

echo "== Pytest (qa-automation tests) =="
pytest tests/unit tests/integration tests/performance \
  --junitxml="$RAW/pytest.xml" -v || true

echo "== Backend pytest + coverage (Flask app) =="
if [[ -f "$REPO_ROOT/backend/pytest.ini" ]] && command -v pytest &>/dev/null; then
  (cd "$REPO_ROOT/backend" && pytest tests --cov=app \
    --cov-report=json:"$RAW/pytest-backend-coverage.json" -q) || true
else
  echo "Skip backend coverage — no backend/pytest.ini or pytest not installed"
fi

echo "== Jest (unit) + coverage on repo src/ =="
if [[ -d node_modules ]]; then
  npx jest --config jest.config.cjs --coverage --json --outputFile="$RAW/jest-results.json" || true
else
  echo "Skip Jest — run npm install in qa-automation/"
fi

echo "== ESLint (repo src; ESLint 9 base path = repo root) =="
if [[ -d "$REPO_ROOT/node_modules" ]] || [[ -d "$QA_ROOT/node_modules" ]]; then
  (cd "$REPO_ROOT" && PATH="$REPO_ROOT/node_modules/.bin:$QA_ROOT/node_modules/.bin:$PATH" \
    npx eslint -f json -o "$RAW/eslint.json" "src/**/*.{ts,tsx}") || echo '[]' > "$RAW/eslint.json"
else
  echo "Skip ESLint — npm install at repo root and/or qa-automation/"
  echo '[]' > "$RAW/eslint.json"
fi

echo "== Pylint (backend app) =="
if command -v pylint &>/dev/null; then
  (cd "$REPO_ROOT" && pylint backend/app \
    --rcfile="$QA_ROOT/quality/pylint.rc" \
    >"$RAW/pylint.txt" 2>&1) || true
else
  echo "Skip pylint — pip install -r qa-automation/requirements-qa.txt"
fi

echo "== Cyclomatic complexity (lizard via Python) =="
python3 "$QA_ROOT/scripts/collect-complexity.py" || echo '{"max_ccn":null}' >"$RAW/lizard.json"

echo "== Security scan script =="
bash "$QA_ROOT/security/security-scan.sh" || true

echo "== Playwright E2E (Page Object Model under tests/e2e/pages/) =="
if [[ "${SKIP_E2E:-}" == "1" ]]; then
  echo "SKIP_E2E=1 — skipping Playwright"
elif [[ -d "$REPO_ROOT/node_modules" ]]; then
  mkdir -p "$RAW"
  (cd "$REPO_ROOT" && npx playwright test) || true
else
  echo "Skip Playwright — npm install at repository root"
fi

echo "== Lighthouse CI (optional) =="
if [[ "${SKIP_LHCI:-}" == "1" ]]; then
  echo "SKIP_LHCI=1"
elif [[ -d node_modules ]]; then
  (cd "$QA_ROOT" && LHCI_URL="${LHCI_URL:-http://127.0.0.1:5173}" npx lhci autorun --config=performance/lighthouse.config.js) || true
else
  echo "Skip LHCI — npm install in qa-automation/"
fi

echo "== k6 (optional; needs app at K6_BASE_URL) =="
if [[ "${SKIP_K6:-}" == "1" ]]; then
  echo "SKIP_K6=1"
elif command -v k6 &>/dev/null; then
  K6_BASE_URL="${K6_BASE_URL:-http://127.0.0.1:5173}" \
    k6 run --summary-export="$RAW/k6-summary.json" "$QA_ROOT/performance/k6-load-test.js" \
    2>&1 | tee "$RAW/k6.log" || true
else
  echo "Skip k6 — install https://k6.io/docs/get-started/installation/"
fi

echo "== Aggregate reports =="
python3 "$QA_ROOT/reports/generate-report.py"
python3 "$QA_ROOT/scripts/analyze-results.py"

echo "== Done. Open qa-automation/reports/dashboard.html (serve via http.server for best results) =="
