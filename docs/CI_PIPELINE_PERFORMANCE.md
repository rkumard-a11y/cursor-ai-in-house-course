# CI pipeline performance — targets, measurements, and ~50% wall-time goal

This document ties the [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) optimizations to **measurable** outcomes. Exact numbers depend on GitHub-hosted runner load; re-record timings from **Actions → your workflow run → job durations**.

---

## 1. What we optimized (and why it saves time)

| Change | Effect (typical) |
|--------|-------------------|
| **`node_modules` cache** + `npm ci --prefer-offline` on hit | Avoids full network resolve when lockfile unchanged; often **1–3 min** saved per job that installs JS. |
| **Explicit `~/.cache/pip` cache** | Complements `setup-python` pip cache; small extra win on cold layers. |
| **Playwright browser cache** | Avoids repeated **~300MB+** browser downloads when `package-lock.json` is stable. |
| **3 parallel E2E jobs** (shard by spec files) | Previously one job ran **all** Playwright projects sequentially; **3 runners** cut E2E wall time toward the slowest shard (~**40–55%** of serial E2E, depending on spec runtime balance). |
| **Backend `pytest -n 4`** | Uses 4 workers on one VM (good with SQLite in-memory + loadfile distribution). |
| **Docker Buildx `type=gha` cache** | Reuses pip + COPY layers across runs; first build cold, later runs often **30–70%** faster for the image build step. |
| **Parallel job graph** | Frontend, backend, E2E×3, Docker, security, Snyk, and perf smoke run **overlapped** where possible; wall clock ≈ **max(critical path)** instead of sum of everything. |

---

## 2. “~50% pipeline time” — how to validate

1. Open **Actions** → pick a run **before** these changes (or use a branch without optimizations).
2. Note **total workflow duration** and the **long pole job** (usually E2E or Playwright install).
3. Compare to a run **after** merge; expect the largest drop from **E2E parallelization + Playwright cache + node_modules cache**.

**Rough internal model (illustrative, not a guarantee):**

| Phase (before, conceptual) | Before | After (order of magnitude) |
|----------------------------|--------|------------------------------|
| E2E serial (2 projects × 2 browsers in one job) | ~T | ~T/2 to ~T/3 with 3 shards + cache |
| npm ci cold × N jobs | N × 1–2 min | One warm + two fast `prefer-offline` |
| Playwright install each E2E | 2–4 min each | One cold + cached repeats |
| Docker build | cold every time | warm layers from GHA cache |

If your **before** baseline was ~18–22 minutes, a **~50%** improvement often lands in the **10–12 minute** range once caches are warm and E2E is sharded.

---

## 3. Reliability features (same workflow)

- **SAST / deps:** CodeQL workflow (separate file) + `npm audit` + `pip-audit` + **Snyk** (requires `SNYK_TOKEN`).
- **Deploy health check:** `DEPLOY_HEALTH_URL` with retries; **rollback webhook** on failure (`ROLLBACK_WEBHOOK_URL`).
- **Slack:** `SLACK_WEBHOOK_URL` on failures in **frontend, backend, E2E, Docker, perf** (security jobs are advisory and do not spam Slack by default).

---

## 4. Next optimizations (if you need more)

1. **Path filters** (`on.push.paths`) so backend-only commits skip frontend jobs.
2. **Merge queue** + required checks to keep `main` green without races.
3. **Lighthouse CI** or **k6** against a **preview URL** after deploy (true “performance testing” under TLS + CDN).
4. **OIDC** to cloud deploy targets instead of long-lived deploy tokens.

---

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-15 | Initial performance narrative aligned with `ci.yml` |
