# QA automation system

End-to-end quality pipeline for this monorepo: **pytest** (Python), **Jest** (TypeScript + **line coverage** on `src/`), **ESLint** / **Pylint**, **cyclomatic complexity** (lizard), **Snyk** + **OWASP ZAP** (optional Docker), **Playwright E2E** (see **Page Object Model** in `tests/e2e/pages/`), **Lighthouse** + **k6**, aggregated **HTML dashboard** with targets vs actuals, plus **rule-based recommendations**.

**Full runbook and quality targets**: [docs/QA-RUNBOOK.md](docs/QA-RUNBOOK.md) · **Targets file**: [quality/quality-targets.json](quality/quality-targets.json).

## Layout

| Path | Purpose |
|------|---------|
| `tests/unit/` | Pytest + Jest unit-level checks |
| `tests/integration/` | API integration tests (optional live `BASE_URL`) |
| `tests/e2e/` | Wrapper to run repo-root **Playwright** suite |
| `tests/performance/` | Pytest gate + docs for k6/Lighthouse |
| `quality/` | ESLint (frontend), Pylint (backend), Sonar template |
| `security/` | ZAP config, Snyk policy, `security-scan.sh` |
| `performance/` | Lighthouse CI config, k6 script, thresholds JSON |
| `reports/` | `generate-report.py`, `dashboard.html` |
| `scripts/` | `run-all-qa.sh`, `analyze-results.py` |

## Quick start

From **repository root**:

```bash
# Python QA deps (pytest, pylint, requests)
pip install -r qa-automation/requirements-qa.txt

# Node deps: repo root (ESLint on `src/`) + qa-automation (Jest, Lighthouse CI)
npm install
cd qa-automation && npm install && cd ..

# Run full suite (respects SKIP_ZAP, SKIP_K6, SKIP_LHCI, SNYK_TOKEN)
./qa-automation/scripts/run-all-qa.sh
```

Open the dashboard (after a run):

```bash
cd qa-automation/reports && python3 -m http.server 8765
# open http://127.0.0.1:8765/dashboard.html
```

## Environment variables

| Variable | Default | Meaning |
|----------|---------|---------|
| `BASE_URL` | `http://127.0.0.1:5000` | Blog API for integration tests |
| `LHCI_URL` | `http://127.0.0.1:5173` | URL for Lighthouse CI |
| `K6_BASE_URL` | `http://127.0.0.1:5173` | Base URL for k6 |
| `SKIP_ZAP` | unset | Set to `1` to skip OWASP ZAP (requires Docker) |
| `SKIP_K6` | unset | Set to `1` if `k6` not installed |
| `SKIP_LHCI` | unset | Set to `1` to skip Lighthouse CI |
| `SNYK_TOKEN` | unset | Enables Snyk in `security-scan.sh` |

## Root package.json (optional shortcuts)

You may add:

```json
"scripts": {
  "qa": "bash qa-automation/scripts/run-all-qa.sh",
  "qa:report": "python3 qa-automation/reports/generate-report.py && python3 qa-automation/scripts/analyze-results.py"
}
```

This repo leaves root `package.json` unchanged unless you merge those lines manually.
