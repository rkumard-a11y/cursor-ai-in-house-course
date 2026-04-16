# QA automation runbook

This document describes how to run the full quality suite, interpret the dashboard, and meet the **quality targets** defined in `quality/quality-targets.json`.

## Targets (summary)

| Metric | Target | Source |
|--------|--------|--------|
| Line coverage | ≥ 80% | Jest (`src/`), optional backend `pytest --cov` |
| Max cyclomatic complexity | < 10 (per function, max across scan) | `scripts/collect-complexity.py` (lizard) |
| Snyk critical issues | 0 | `security/security-scan.sh` + `SNYK_TOKEN` |
| HTTP p95 | < 500 ms | k6 summary export |
| Error / failure rate | < 1% | k6 custom rate; Playwright JUnit failure rate |

## Prerequisites

- **Node.js**: `npm install` at the **repository root** (app + ESLint) and `npm install` in **`qa-automation/`** (Jest, Lighthouse CI).
- **Python 3**: `pip install -r qa-automation/requirements-qa.txt` (pytest, pytest-cov, pylint, lizard, requests).
- **Backend tests + coverage** (optional): install `backend/requirements.txt` in a venv so `pytest` in `backend/` can import `redis`, etc.
- **k6** (optional): [k6 installation](https://k6.io/docs/get-started/installation/).
- **Docker** (optional): OWASP ZAP baseline in `security/security-scan.sh`.
- **Snyk** (optional): `SNYK_TOKEN` for CLI scans.

## Master script

From the repository root:

```bash
./qa-automation/scripts/run-all-qa.sh
```

Useful environment variables:

| Variable | Effect |
|----------|--------|
| `SKIP_E2E=1` | Skip Playwright (faster local iteration). |
| `SKIP_K6=1` | Skip k6 (requires a running app at `K6_BASE_URL` otherwise). |
| `SKIP_LHCI=1` | Skip Lighthouse CI. |
| `SKIP_ZAP=1` / `SKIP_SNYK=1` | Skip security tools. |
| `K6_BASE_URL` | Default `http://127.0.0.1:5173`. |
| `BASE_URL` | Blog API for QA pytest integration tests. |

## Outputs

- **Raw artifacts**: `qa-automation/reports/raw/` (JUnit, ESLint JSON, lizard JSON, k6 log + summary, Snyk JSON, etc.).
- **Dashboard**: `qa-automation/reports/dashboard.html` (open locally; prefer `python3 -m http.server` from `reports/` for fewer browser restrictions).
- **Data**: `qa-automation/reports/dashboard_data.json`.
- **Recommendations**: `qa-automation/reports/RECOMMENDATIONS.md` (rule-based checklist from `scripts/analyze-results.py`).

## Individual commands

```bash
# QA Python tests
cd qa-automation && pytest

# QA Jest (+ coverage on repo src/)
cd qa-automation && npm run test:unit -- --coverage

# ESLint (repo root)
npm run lint

# Backend tests + coverage (with deps installed)
cd backend && pytest tests --cov=app --cov-report=json:../qa-automation/reports/raw/pytest-backend-coverage.json

# Complexity
python3 qa-automation/scripts/collect-complexity.py

# E2E (Page Object Model under tests/e2e/pages/)
npm run test:e2e
```

## Improving coverage toward 80%

Add Jest specs under `qa-automation/tests/unit/` that import and exercise pure modules under `src/` (see `formatStats.coverage.test.ts`). Expand Playwright flows using page objects so regressions stay localized.
