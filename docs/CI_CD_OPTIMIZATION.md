# CI/CD optimization guide

This document summarizes **bottlenecks** commonly seen in this repo’s pipelines and **concrete optimizations** already applied or easy to adopt. Treat it as a living checklist (not a live “AI” service—re-run profiling when dependencies or tests change).

---

## 1. Bottlenecks (typical order of impact)

| Area | Symptom | Likely cause |
|------|---------|----------------|
| **E2E** | Long wall-clock, flakiness | Full Playwright install + multi-project runs on cold runners |
| **Backend tests** | Linear time growth | Large pytest suite without sharding |
| **Frontend install** | Minutes on `npm ci` | Cold cache, large lockfile, no `cache: npm` |
| **Security scans** | Queue behind tests | CodeQL + audits competing for same push |
| **Deploy** | Serial gate | Single job waiting on *all* upstream jobs |

---

## 2. Optimizations implemented in this repo

### 2.1 Dependency caching

- **npm:** `actions/setup-node` with `cache: npm` (uses `package-lock.json`).
- **pip:** `actions/setup-python` with `cache: pip` and `cache-dependency-path: backend/requirements.txt`.
- **Playwright:** `actions/cache` on `~/.cache/ms-playwright` keyed by `package-lock.json` hash.

**Next steps:** Add a cache for `~/.cache/pip` explicitly only if you drop built-in pip cache; pin Playwright version in lockfile for stable cache keys.

### 2.2 Parallel test execution

- **Backend:** `pytest-xdist` with `-n 2 --dist loadfile` to keep tests in the same file on one worker (helps Flask fixtures / DB isolation).
- **E2E:** GitHub Actions **matrix** over Playwright projects (`chromium-desktop`, `mobile-chromium`) so two runners execute in parallel.

**Next steps:** Increase `-n` when tests are fully process-safe; split slow Playwright specs into more matrix shards by directory.

### 2.3 Security (SAST + dependencies)

- **SAST:** `.github/workflows/codeql.yml` — CodeQL for **JavaScript/TypeScript** (`src/`) and **Python** (`backend/app`, `backend/tests`).
- **Dependencies:** `.github/workflows/dependency-review.yml` on pull requests (severity gate + PR comment).
- **Advisory audits in CI:** `security-audit` job in `ci.yml` — `npm audit` (prod deps) and `pip-audit` on `backend/requirements.txt` (job-level `continue-on-error` so baseline noise does not block merges until you tighten gates).

### 2.4 Performance testing (CI smoke)

- **Build timing** — frontend job records build seconds to the step summary.
- **Static TTFB smoke** — `performance-smoke` job serves `dist/` with `serve` and measures repeated request latency in Python; **warns** if max TTFB > 500 ms (CI static server is cold; tighten when measuring CDN/prod).

**Next steps:** Add **Lighthouse CI** or **k6** against a preview URL after deploy; track bundle budgets (`size-limit`, `vite-plugin-inspect`).

### 2.5 Blue-green deployment + rollback + monitoring

- **Template:** `.github/workflows/deploy-blue-green.yml` (manual `workflow_dispatch`).
  - **Green deploy** → **smoke** (`SMOKE_TEST_URL` repo variable) → **promote** on success or **rollback** on smoke failure.
  - Optional webhooks: `GREEN_DEPLOY_WEBHOOK`, `PROMOTE_WEBHOOK`, `ROLLBACK_WEBHOOK`.
- **Monitoring:** `notify-monitoring` posts to `MONITORING_DEPLOYMENT_URL` after successful promote; main `ci.yml` deploy can also ping the same secret.

Create GitHub **Environments** named `production-green` and `production` (Settings → Environments) before relying on protection rules or environment-scoped secrets.

---

## 3. “AI-style” further suggestions (prioritized)

1. **Split workflows:** Keep `ci.yml` fast for PRs; move CodeQL + weekly heavy scans to `schedule` only if push load is high.
2. **Path filters:** `on.push.paths` / `paths-ignore` so backend-only changes do not rebuild the frontend job (requires careful path lists).
3. **Reusable workflows:** Extract “setup node + npm ci + lint + build” into `.github/workflows/reusable-frontend.yml` and `workflow_call` from multiple pipelines.
4. **Test selection:** Use pytest markers or Playwright grep to run **smoke** subset on every commit and **full** suite nightly.
5. **Artifacts retention:** Set `retention-days` on `upload-artifact` for `frontend-dist` to control storage cost.
6. **OIDC deploy:** Prefer short-lived OIDC tokens to cloud providers instead of long-lived deploy secrets.
7. **Merge queue:** Enable GitHub merge queue + required checks so `main` stays green without human merge races.

---

## 4. Files reference

| File | Role |
|------|------|
| `.github/workflows/ci.yml` | Optimized build/test/deploy + security audit + perf smoke |
| `.github/workflows/codeql.yml` | CodeQL SAST (JS + Python) |
| `.github/workflows/dependency-review.yml` | PR dependency review |
| `.github/workflows/deploy-blue-green.yml` | Blue-green template, rollback, monitoring ping |
| [`docs/CI_PIPELINE_PERFORMANCE.md`](CI_PIPELINE_PERFORMANCE.md) | Wall-time model, ~50% target, how to measure in Actions |

---

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-15 | Initial optimization guide aligned with workflows |
