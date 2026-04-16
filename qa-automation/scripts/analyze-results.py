#!/usr/bin/env python3
"""
Improvement recommendations from dashboard_data.json (heuristic rules vs quality targets).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def lines_for(data: dict) -> list[str]:
    out: list[str] = []
    out.append("# QA improvement recommendations\n")
    out.append("_Generated from aggregated metrics (rule-based, not an external LLM)._\n")

    targets = data.get("targets") or {}
    metrics = data.get("metrics") or {}

    cov = metrics.get("coverage_lines_pct") or {}
    if cov.get("combined_max_pct") is not None:
        pct = cov["combined_max_pct"]
        goal = cov.get("target_min_pct", targets.get("coverage_pct_min", 80))
        if not cov.get("pass"):
            out.append(
                f"- **Coverage**: Lines at **{pct:.1f}%** vs goal **≥{goal}%** — add Jest tests under `qa-automation/tests/unit/` that import `src/` modules; expand backend `pytest --cov` when deps are installed.\n"
            )
        else:
            out.append("- **Coverage**: Meets the configured line-coverage goal for this run.\n")
    else:
        out.append("- **Coverage**: No combined coverage found — run Jest with `--coverage` and/or backend pytest with `--cov`.\n")

    cc = metrics.get("cyclomatic_complexity") or {}
    if cc.get("max_ccn") is not None and not cc.get("pass"):
        out.append(
            f"- **Complexity**: Max CCN **{cc['max_ccn']}** exceeds target **<{cc.get('target_max', 10)}** — split large functions, extract helpers, simplify branching (see lizard output in CI logs).\n"
        )

    sec = metrics.get("security_critical") or {}
    if sec.get("count") is not None and not sec.get("pass"):
        out.append(
            f"- **Security**: **{sec['count']}** Snyk critical findings — upgrade or patch affected packages; rerun with `SNYK_TOKEN`.\n"
        )
    elif sec.get("unknown"):
        out.append("- **Security**: No Snyk JSON in `reports/raw/` — run `security/security-scan.sh` with `SNYK_TOKEN`.\n")

    k6 = metrics.get("k6_http") or {}
    if not k6.get("unknown"):
        if k6.get("pass_p95") is False:
            out.append(
                f"- **Performance (k6)**: p95 **{k6.get('p95_ms')} ms** exceeds **{k6.get('target_p95_ms_max', 500)} ms** — optimize server/TTFB, caching, and bundle size.\n"
            )
        if k6.get("pass_errors") is False:
            out.append(
                f"- **Reliability (k6)**: Error rate **{k6.get('error_rate_pct')}%** exceeds **{k6.get('target_error_rate_max_pct')}%** — fix failing HTTP checks and flaky routes.\n"
            )
    else:
        out.append("- **k6**: No `k6-summary.json` — run k6 against a live `K6_BASE_URL` or set `SKIP_K6=1` for local-only runs.\n")

    pw = metrics.get("playwright") or {}
    if pw and not pw.get("pass"):
        out.append(
            f"- **E2E**: Playwright failure rate **{pw.get('error_rate_pct')}%** — stabilize selectors (`data-testid`), use page objects in `tests/e2e/pages/`, and reduce flakiness.\n"
        )

    pt = data.get("pytest") or {}
    if pt.get("failures", 0) or pt.get("errors", 0):
        out.append("- **Pytest (QA pack)**: Failures in JUnit — fix failing tests before merging.\n")

    jest = data.get("jest") or {}
    if jest.get("failed"):
        out.append("- **Jest**: Unit failures — isolate failing modules and add regression coverage.\n")

    es = data.get("eslint") or {}
    ec, wc = es.get("errorCount"), es.get("warningCount")
    if ec is not None and ec > 0:
        out.append(f"- **ESLint**: {ec} errors — fix blocking issues first.\n")
    if wc is not None and wc > 20:
        out.append(f"- **ESLint**: {wc} warnings — schedule cleanup.\n")

    pl = data.get("pylint") or {}
    score = pl.get("score")
    if score is not None and score < 7.0:
        out.append(f"- **Pylint**: Score {score}/10 — refactor long modules and tighten typing.\n")

    if (data.get("zap") or {}).get("log_lines", 0) == 0:
        out.append("- **OWASP ZAP**: No baseline log — run ZAP against a stable preview URL with Docker.\n")
    else:
        out.append("- **OWASP ZAP**: Review `reports/raw/zap-baseline.log` and `zap-report.json` for high alerts.\n")

    return out


def main() -> int:
    qa_root = Path(__file__).resolve().parents[1]
    data_path = qa_root / "reports" / "dashboard_data.json"
    if not data_path.is_file():
        print("Run reports/generate-report.py first.", file=sys.stderr)
        return 1
    data = json.loads(data_path.read_text(encoding="utf-8"))
    out = qa_root / "reports" / "RECOMMENDATIONS.md"
    out.write_text("".join(lines_for(data)), encoding="utf-8")
    print(f"Wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
