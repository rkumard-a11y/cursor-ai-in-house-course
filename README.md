# Cursor AI in-house course (module 8)

This repository is a **multi-project workshop**: a React (Vite) demo UI at the root, three **Flask** APIs (blog, customer support, commerce), a **QA automation** pack (pytest, Jest, security/perf tooling), and **GitHub Actions** workflows plus CI documentation. Each Python service uses its **own virtual environment** and dependency file.

---

## Table of contents

1. [Projects at a glance](#projects-at-a-glance)
2. [Prerequisites](#prerequisites)
3. [Setup all modules (first-time)](#setup-all-modules-first-time)
4. [Using each project](#using-each-project)
   - [Frontend (repository root)](#1-frontend-repository-root--react--typescript--vite--tailwind)
   - [Blog API (`backend/`)](#2-blog-api-backend--module-7-rest-exercise)
   - [Customer support API (`support_backend/`)](#3-customer-support-api-support_backend--prd-ticket-system)
   - [Commerce demo API (`commerce_api/`)](#4-commerce-demo-api-commerce_api--users-catalog-orders--api-tests)
   - [QA automation (`qa-automation/`)](#5-qa-automation-qa-automation)
5. [Quality assurance (QA)](#quality-assurance-qa)
6. [Running everything at once (workshop)](#running-everything-at-once-workshop)
7. [Repository layout](#repository-layout)
8. [GitHub Actions (CI / CD)](#github-actions-ci--cd)

---

## Projects at a glance

| Project | Path | Brief description |
|--------|------|-------------------|
| **Frontend demo** | Repository root (`src/`, `package.json`) | React 19 + TypeScript + Vite + Tailwind: product/catalog demos, dashboards, Kanban, settings, social-style feed. **No backend required** for default UI work. Playwright E2E under `tests/e2e/`. |
| **Blog API** | `backend/` | Flask REST API (Module 7 style): JWT, posts, comments, categories, search, optional **Redis** caching, Swagger at `/apidocs/`. Pytest suite with coverage gate on `app/`. |
| **Customer support API** | `support_backend/` | Flask ticket system from the PRD: ticket lifecycle, RBAC (customer / agent / admin), SLA fields, comments, assignment, rate limiting, sanitization. Default port **5001**. Details: [`support_backend/README.md`](support_backend/README.md). |
| **Commerce demo API** | `commerce_api/` | Flask REST API: users, product catalog, orders; JWT; admin vs customer roles; validation and pytest markers (`auth`, `crud`, `performance`, etc.). Default port **5002**. Details: [`commerce_api/README.md`](commerce_api/README.md). |
| **QA automation** | `qa-automation/` | Aggregated quality pipeline: pytest + Jest, ESLint/Pylint, complexity (lizard), optional Snyk/ZAP/k6/Lighthouse, HTML dashboard and runbook. Master script: `qa-automation/scripts/run-all-qa.sh`. |
| **CI/CD docs** | `docs/` | Pipeline performance notes and tuning guides (e.g. [`docs/CI_PIPELINE_PERFORMANCE.md`](docs/CI_PIPELINE_PERFORMANCE.md), [`docs/CI_CD_OPTIMIZATION.md`](docs/CI_CD_OPTIMIZATION.md)). |
| **Product requirements** | Repository root | Customer support PRD: `PRD_Customer_Support_System.md` (and related `.txt` if present). |

---

## Prerequisites

| Tool | Notes |
|------|--------|
| **Node.js** 20+ (LTS recommended) | Root UI, Playwright, and QA Jest/Lighthouse tooling |
| **npm** 10+ | Ships with Node |
| **Python** 3.11+ | All Flask apps and QA Python tooling |
| **Redis** (optional) | Blog API caching; tests use **fakeredis** — see [Blog API](#2-blog-api-backend--module-7-rest-exercise) |
| **Docker** (optional) | OWASP ZAP in QA security scripts |
| **k6** (optional) | Load tests from QA automation |

---

## Setup all modules (first-time)

Run these from the **repository root** (adjust paths if your clone folder name differs).

### 1. Frontend (root)

```bash
npm install
npx playwright install    # first machine only; for E2E browsers
```

### 2. Blog API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # optional; see Blog API section below
cd ..
```

### 3. Customer support API

```bash
cd support_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # optional
cd ..
```

### 4. Commerce API

```bash
cd commerce_api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 5. QA automation (Python + Node)

```bash
pip install -r qa-automation/requirements-qa.txt
cd qa-automation && npm install && cd ..
```

You already ran `npm install` at the root for ESLint and the app; QA’s `package.json` adds Jest and Lighthouse CI–related tooling under `qa-automation/`.

---

## Using each project

### 1. Frontend (repository root — React + TypeScript + Vite + Tailwind)

**Purpose:** UI demos and Playwright E2E; primary entry is Vite dev server.

**Run**

```bash
npm run dev
```

Open the URL Vite prints (typically **http://localhost:5173**).

**Checks**

```bash
npm run lint
npm run test:e2e
npm run test:e2e:ui          # Playwright UI mode
```

**Build / preview**

| Command | Description |
|---------|-------------|
| `npm run build` | Typecheck (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the production build locally |

**Navigation tips**

- Demo shell uses the `view` query parameter, e.g. `http://localhost:5173/?view=products`, `?view=feed`, `?view=kanban`.
- Optional E2E harness routes may use `e2e=` (see `src/App.tsx`).
- `playwright.config.ts` targets **http://127.0.0.1:5173** and can start `npm run dev` when `CI` is unset.

---

### 2. Blog API (`backend/` — Module 7 REST exercise)

**Purpose:** Flask blog API with JWT, posts, comments, categories, search, optional Redis cache, Swagger.

**Run**

```bash
cd backend
source .venv/bin/activate
python run.py
```

- API: **http://127.0.0.1:5000**
- Swagger: **http://127.0.0.1:5000/apidocs/**

**Environment**

- Copy `backend/.env.example` to `backend/.env` if you need custom `SECRET_KEY`, `JWT_SECRET_KEY`, `REDIS_URL`, etc.
- **Redis (optional):** for real caching, run Redis locally, or set `CACHE_DISABLED=true` in `.env`. Tests use **fakeredis** and do not require Redis.

**Tests**

```bash
cd backend
source .venv/bin/activate
pytest
```

Coverage threshold for `app/` is configured in `backend/pytest.ini` (currently **≥85%**).

---

### 3. Customer support API (`support_backend/` — PRD ticket system)

**Purpose:** Ticket CRUD, status transitions, SLA, comments, assignment, JWT auth, rate limits, aligned with the support PRD.

**Run**

```bash
cd support_backend
source .venv/bin/activate
python run.py
```

- API: **http://127.0.0.1:5001**
- Swagger: **http://127.0.0.1:5001/apidocs/**

Seeded accounts and full route list: **`support_backend/README.md`**.

**Tests**

```bash
cd support_backend
source .venv/bin/activate
pytest
```

Coverage gate: **`support_backend/pytest.ini`** (currently **≥80%** on `app/`).

---

### 4. Commerce demo API (`commerce_api/` — users, catalog, orders + API tests)

**Purpose:** REST API for e-commerce-style flows with role-based access and a large pytest suite.

**Run**

```bash
cd commerce_api
source .venv/bin/activate
python run.py
```

- API: **http://127.0.0.1:5002**
- Seed users and paths: **`commerce_api/README.md`**

**Tests**

```bash
cd commerce_api
source .venv/bin/activate
pytest -v
# pytest -m performance -v   # optional marker group
```

---

### 5. QA automation (`qa-automation/`)

**Purpose:** Run cross-cutting checks (unit/integration, lint, complexity, optional security and performance) and produce **`reports/dashboard.html`**.

**Quick run (full pipeline)**

From repository root:

```bash
./qa-automation/scripts/run-all-qa.sh
```

Respects `SKIP_ZAP`, `SKIP_K6`, `SKIP_LHCI`, `SKIP_E2E`, `SKIP_SNYK`, `SNYK_TOKEN`, `BASE_URL`, `K6_BASE_URL`, `LHCI_URL` (see [Quality assurance](#quality-assurance-qa)).

**View dashboard**

```bash
cd qa-automation/reports && python3 -m http.server 8765
# open http://127.0.0.1:8765/dashboard.html
```

Deeper procedures and targets: **[`qa-automation/docs/QA-RUNBOOK.md`](qa-automation/docs/QA-RUNBOOK.md)** and **[`qa-automation/README.md`](qa-automation/README.md)**.

---

## Quality assurance (QA)

QA spans **three layers**: per-project tests (pytest / Playwright / lint), the **`qa-automation`** orchestration layer, and **CI** in `.github/workflows/`.

### A. Per-project checks (fast feedback)

| Area | Command (from repo root unless noted) |
|------|----------------------------------------|
| Frontend lint | `npm run lint` |
| Frontend E2E | `npx playwright install` (once), then `npm run test:e2e` |
| Blog API | `cd backend && source .venv/bin/activate && pytest` |
| Support API | `cd support_backend && source .venv/bin/activate && pytest` |
| Commerce API | `cd commerce_api && source .venv/bin/activate && pytest -v` |

### B. QA automation bundle (aggregated)

1. Ensure [Setup all modules](#setup-all-modules-first-time) including `pip install -r qa-automation/requirements-qa.txt` and `npm install` in both **root** and **`qa-automation/`**.
2. For integration tests against a live blog API, start `backend` and optionally set `BASE_URL` (default **http://127.0.0.1:5000**).
3. For k6 / Lighthouse segments, run the frontend at **http://127.0.0.1:5173** or set `K6_BASE_URL` / `LHCI_URL`.
4. Run the master script:

```bash
./qa-automation/scripts/run-all-qa.sh
```

**Useful skips (local iteration)**

| Variable | Effect |
|----------|--------|
| `SKIP_E2E=1` | Skip Playwright |
| `SKIP_K6=1` | Skip k6 |
| `SKIP_LHCI=1` | Skip Lighthouse CI |
| `SKIP_ZAP=1` / `SKIP_SNYK=1` | Skip ZAP / Snyk |

**Individual QA commands** (see runbook for coverage goals and interpretation)

```bash
cd qa-automation && pytest
cd qa-automation && npm run test:unit -- --coverage
npm run lint
python3 qa-automation/scripts/collect-complexity.py
python3 qa-automation/reports/generate-report.py
python3 qa-automation/scripts/analyze-results.py
```

**Artifacts**

- Raw outputs: `qa-automation/reports/raw/`
- Dashboard: `qa-automation/reports/dashboard.html`
- Recommendations: `qa-automation/reports/RECOMMENDATIONS.md`

### C. CI on GitHub

Pushes and pull requests run the workflows in [GitHub Actions](#github-actions-ci--cd); use them as the source of truth for “green main” after local QA passes.

---

## Running everything at once (workshop)

Use **four terminals** from the repository root if you want UI + all APIs:

| Terminal | Command | Default URL / port |
|----------|---------|---------------------|
| 1 | `npm run dev` | **http://localhost:5173** |
| 2 | `cd backend && source .venv/bin/activate && python run.py` | **5000** |
| 3 | `cd support_backend && source .venv/bin/activate && python run.py` | **5001** |
| 4 | `cd commerce_api && source .venv/bin/activate && python run.py` | **5002** |

Ports are defined in each service’s `run.py`; change there if you have conflicts.

---

## Repository layout

| Path | Role |
|------|------|
| `src/` | React UI (Vite entry, components, pages) |
| `tests/e2e/` | Playwright specs (also referenced from QA wrappers) |
| `backend/app/` | Blog Flask application |
| `backend/Dockerfile` | Container image for blog API (CI layer cache demo) |
| `backend/tests/` | Blog API pytest suite |
| `support_backend/app/` | Support ticket Flask application |
| `support_backend/tests/` | Support API pytest suite |
| `commerce_api/app/` | Commerce Flask API |
| `commerce_api/tests/` | Commerce API pytest suite (markers by category) |
| `qa-automation/` | QA scripts, thresholds, security/perf configs, reports |
| `.github/workflows/` | CI, CodeQL, dependency review, blue-green template |
| `docs/` | CI/CD performance and optimization notes |

---

## GitHub Actions (CI / CD)

| Workflow | When | Purpose |
|----------|------|---------|
| [`ci.yml`](.github/workflows/ci.yml) | push / PR / manual | `node_modules` + pip + Playwright caches; **3 parallel E2E shards**; backend **pytest-xdist** (`-n 4`); **Docker Buildx** GHA layer cache; **npm audit** + **pip-audit** + **Snyk**; perf smoke; deploy + **health URL** + **rollback** webhook; **Slack** on test/deploy failures |
| [`codeql.yml`](.github/workflows/codeql.yml) | push / PR / weekly | **SAST** (CodeQL) for `src/` (JS/TS) and `backend/` (Python) |
| [`dependency-review.yml`](.github/workflows/dependency-review.yml) | pull_request | **Dependency / supply-chain** review on lockfile changes |
| [`deploy-blue-green.yml`](.github/workflows/deploy-blue-green.yml) | manual | **Blue-green template**: green deploy → smoke → promote or **rollback**; optional monitoring ping |

**`ci.yml` stages (summary):** frontend (lint + timed build + bundle hint) → backend (`pytest -n 2`, coverage) → parallel E2E shards → security-audit (non-blocking by default) → performance-smoke → deploy on **main/master** pushes.

**Secrets / variables (optional):** `DEPLOY_WEBHOOK_URL`, `DEPLOY_HEALTH_URL` (post-deploy HTTP checks), `ROLLBACK_WEBHOOK_URL` (auto-rollback on deploy/health failure), `MONITORING_DEPLOYMENT_URL`, `SLACK_WEBHOOK_URL` (CI failure alerts), `SNYK_TOKEN` (Snyk CLI); blue-green template: `GREEN_DEPLOY_WEBHOOK`, `PROMOTE_WEBHOOK`, `ROLLBACK_WEBHOOK`, `MONITORING_DEPLOYMENT_URL`; repo variable `SMOKE_TEST_URL` for green smoke checks.

**Performance write-up:** [`docs/CI_PIPELINE_PERFORMANCE.md`](docs/CI_PIPELINE_PERFORMANCE.md) — how to compare runtimes and what drives the ~**50%** wall-time improvement target.

**Tuning guide:** [`docs/CI_CD_OPTIMIZATION.md`](docs/CI_CD_OPTIMIZATION.md) — bottlenecks, caching, parallelism, security, perf, blue-green, and follow-up ideas.

Extend the **deploy** jobs for your real hosts (Pages, containers, Kubernetes, PaaS CLI, etc.).
