#!/usr/bin/env python3
"""
Aggregate QA outputs into dashboard_data.json and dashboard.html
(metrics vs quality/quality-targets.json).
"""
from __future__ import annotations

import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path


def _load_targets(qa_root: Path) -> dict:
    p = qa_root / "quality" / "quality-targets.json"
    if not p.is_file():
        return {
            "coverage_pct_min": 80,
            "cyclomatic_complexity_max": 10,
            "security_critical_max": 0,
            "http_p95_ms_max": 500,
            "http_error_rate_max_pct": 1,
        }
    return json.loads(p.read_text(encoding="utf-8"))


def _jest_coverage_summary(qa_root: Path) -> dict | None:
    p = qa_root / "reports" / "raw" / "jest-coverage" / "coverage-summary.json"
    if not p.is_file():
        return None
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    total = data.get("total") or {}
    lines = total.get("lines") or {}
    pct = lines.get("pct")
    if pct is None:
        return None
    return {"lines_pct": float(pct), "path": str(p.relative_to(qa_root))}


def _pytest_backend_coverage(raw: Path) -> dict | None:
    p = raw / "pytest-backend-coverage.json"
    if not p.is_file():
        return None
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    totals = data.get("totals") or {}
    pct = totals.get("percent_covered")
    if pct is None:
        return None
    return {"lines_pct": float(pct), "path": str(p)}


def _lizard_max_ccn(raw: Path) -> dict | None:
    p = raw / "lizard.json"
    if not p.is_file():
        return None
    try:
        data = json.loads(p.read_text(encoding="utf-8", errors="replace").strip())
    except json.JSONDecodeError:
        return {"max_ccn": None, "parse_note": "invalid_json"}
    if isinstance(data, dict) and "max_ccn" in data:
        return {"max_ccn": data.get("max_ccn")}
    if isinstance(data, list):
        m = 0
        for f in data:
            for fn in f.get("function_list") or []:
                try:
                    m = max(m, int(fn.get("cyclomatic_complexity", 0)))
                except (TypeError, ValueError):
                    continue
        return {"max_ccn": m if m else None}
    return None


def _snyk_critical_count(raw: Path) -> int | None:
    total = 0
    found = False
    for name in ("snyk-root.json", "snyk-backend.json"):
        p = raw / name
        if not p.is_file():
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        found = True
        vulns = data.get("vulnerabilities")
        if not isinstance(vulns, list):
            continue
        for v in vulns:
            sev = (v.get("severity") or "").lower()
            if sev == "critical":
                total += 1
    return total if found else None


def _k6_summary(raw: Path) -> dict | None:
    p = raw / "k6-summary.json"
    if not p.is_file():
        return None
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    metrics = data.get("metrics") or {}
    dur = (metrics.get("http_req_duration") or {}).get("values") or {}
    err = (metrics.get("errors") or {}).get("values") or {}
    p95 = dur.get("p(95)")
    rate = err.get("rate")
    out: dict = {}
    if p95 is not None:
        out["http_p95_ms"] = float(p95)
    if rate is not None:
        out["error_rate_pct"] = float(rate) * 100.0
    return out or None


def _playwright_junit(raw: Path) -> dict | None:
    p = raw / "playwright-junit.xml"
    if not p.is_file():
        return None
    try:
        tree = ET.parse(p)
        root = tree.getroot()
    except ET.ParseError:
        return None
    tag = root.tag.split("}")[-1]
    if tag == "testsuites":
        tests = int(root.attrib.get("tests", 0))
        failures = int(root.attrib.get("failures", 0))
        errors = int(root.attrib.get("errors", 0))
    elif tag == "testsuite":
        tests = int(root.attrib.get("tests", 0))
        failures = int(root.attrib.get("failures", 0))
        errors = int(root.attrib.get("errors", 0))
    else:
        return None
    passed = max(0, tests - failures - errors)
    err_rate = (failures + errors) / tests * 100.0 if tests else 0.0
    return {
        "tests": tests,
        "failures": failures,
        "errors": errors,
        "passed": passed,
        "error_rate_pct": round(err_rate, 3),
    }


def _build_metrics(targets: dict, raw: Path, qa_root: Path) -> dict:
    cov_j = _jest_coverage_summary(qa_root)
    cov_b = _pytest_backend_coverage(raw)
    lines_pcts = [x["lines_pct"] for x in (cov_j, cov_b) if x and x.get("lines_pct") is not None]
    combined_cov = max(lines_pcts) if lines_pcts else None

    liz = _lizard_max_ccn(raw)
    max_ccn = (liz or {}).get("max_ccn")

    crit = _snyk_critical_count(raw)
    k6 = _k6_summary(raw) or {}
    pw = _playwright_junit(raw) or {}

    t_cov = float(targets.get("coverage_pct_min", 80))
    t_cc = int(targets.get("cyclomatic_complexity_max", 10))
    t_crit = int(targets.get("security_critical_max", 0))
    t_p95 = float(targets.get("http_p95_ms_max", 500))
    t_err = float(targets.get("http_error_rate_max_pct", 1))

    p95 = k6.get("http_p95_ms")
    k6_err = k6.get("error_rate_pct")

    return {
        "coverage_lines_pct": {
            "jest": cov_j,
            "pytest_backend": cov_b,
            "combined_max_pct": combined_cov,
            "target_min_pct": t_cov,
            "pass": combined_cov is not None and combined_cov >= t_cov,
        },
        "cyclomatic_complexity": {
            "max_ccn": max_ccn,
            "target_max": t_cc,
            "pass": max_ccn is not None and max_ccn < t_cc,
        },
        "security_critical": {
            "count": crit,
            "target_max": t_crit,
            "pass": crit is not None and crit <= t_crit,
            "unknown": crit is None,
        },
        "k6_http": {
            "p95_ms": p95,
            "error_rate_pct": k6_err,
            "target_p95_ms_max": t_p95,
            "target_error_rate_max_pct": t_err,
            "pass_p95": None if p95 is None else (p95 <= t_p95),
            "pass_errors": None if k6_err is None else (k6_err <= t_err),
            "unknown": p95 is None and k6_err is None,
        },
        "playwright": {
            **pw,
            "target_error_rate_max_pct": t_err,
            "pass": (pw.get("tests") or 0) > 0 and (pw.get("error_rate_pct") or 100) <= t_err,
            "unknown": not pw,
        },
    }


def main() -> int:
    qa_root = Path(__file__).resolve().parents[1]
    raw = qa_root / "reports" / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    targets = _load_targets(qa_root)

    data: dict = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "targets": targets,
        "metrics": _build_metrics(targets, raw, qa_root),
        "pytest": {"junit": None, "errors": 0, "failures": 0, "tests": 0},
        "jest": {"path": None, "failed": None},
        "eslint": {"errorCount": None, "warningCount": None},
        "pylint": {"score": None, "path": None},
        "snyk": {"root": None, "backend": None},
        "zap": {"log_lines": 0},
    }

    junit = raw / "pytest.xml"
    if junit.is_file():
        try:
            tree = ET.parse(junit)
            root = tree.getroot()
            data["pytest"]["tests"] = int(root.attrib.get("tests", 0))
            data["pytest"]["failures"] = int(root.attrib.get("failures", 0))
            data["pytest"]["errors"] = int(root.attrib.get("errors", 0))
            data["pytest"]["junit"] = str(junit.relative_to(qa_root))
        except ET.ParseError:
            data["pytest"]["junit"] = "parse_error"

    jest_path = raw / "jest-results.json"
    if jest_path.is_file():
        try:
            j = json.loads(jest_path.read_text(encoding="utf-8"))
            data["jest"]["path"] = str(jest_path.relative_to(qa_root))
            data["jest"]["failed"] = j.get("numFailedTests")
        except json.JSONDecodeError:
            data["jest"]["path"] = "invalid_json"

    eslint_path = raw / "eslint.json"
    if eslint_path.is_file():
        try:
            payload = json.loads(eslint_path.read_text(encoding="utf-8"))
            if isinstance(payload, list):
                errs = sum(1 for f in payload for m in f.get("messages", []) if m.get("severity") == 2)
                warns = sum(1 for f in payload for m in f.get("messages", []) if m.get("severity") == 1)
                data["eslint"]["errorCount"] = errs
                data["eslint"]["warningCount"] = warns
        except json.JSONDecodeError:
            data["eslint"]["errorCount"] = None

    pylint_log = raw / "pylint.txt"
    if pylint_log.is_file():
        text = pylint_log.read_text(encoding="utf-8", errors="replace")
        m = re.search(r"rated at ([0-9.]+)/10", text)
        if m:
            data["pylint"]["score"] = float(m.group(1))
        data["pylint"]["path"] = str(pylint_log.relative_to(qa_root))

    for name in ("snyk-root.json", "snyk-backend.json"):
        p = raw / name
        if p.is_file():
            key = "root" if "root" in name else "backend"
            try:
                data["snyk"][key] = json.loads(p.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                data["snyk"][key] = {"parse_error": True}

    zap_log = raw / "zap-baseline.log"
    if zap_log.is_file():
        data["zap"]["log_lines"] = len(zap_log.read_text(encoding="utf-8", errors="replace").splitlines())

    out_json = qa_root / "reports" / "dashboard_data.json"
    out_json.write_text(json.dumps(data, indent=2), encoding="utf-8")

    html_path = qa_root / "reports" / "dashboard.html"
    html_path.write_text(_render_dashboard_html(data), encoding="utf-8")
    print(f"Wrote {out_json} and {html_path}")
    return 0


def _render_dashboard_html(data: dict) -> str:
    metrics = data.get("metrics") or {}
    targets = data.get("targets") or {}
    cov = metrics.get("coverage_lines_pct") or {}
    cc = metrics.get("cyclomatic_complexity") or {}
    sec = metrics.get("security_critical") or {}
    k6 = metrics.get("k6_http") or {}
    pw = metrics.get("playwright") or {}

    def pill(ok: bool | None, unknown: bool = False) -> str:
        if unknown or ok is None:
            return '<span class="pill na">n/a</span>'
        return '<span class="pill pass">pass</span>' if ok else '<span class="pill fail">fail</span>'

    cov_pct = cov.get("combined_max_pct")
    cov_bar = min(100.0, float(cov_pct or 0))
    cov_unknown = cov_pct is None

    cc_val = cc.get("max_ccn")
    cc_bar = min(100.0, (float(cc_val or 0) / max(cc.get("target_max", 10), 1)) * 100.0)

    rows = f"""
    <section class="card">
      <h2>Quality targets</h2>
      <table>
        <thead><tr><th>Metric</th><th>Target</th><th>Actual</th><th>Status</th></tr></thead>
        <tbody>
          <tr>
            <td>Test coverage (lines)</td>
            <td>≥ {targets.get("coverage_pct_min", 80)}%</td>
            <td>{'—' if cov_unknown else f'{cov_pct:.1f}%'}</td>
            <td>{pill(cov.get('pass'), cov_unknown)}</td>
          </tr>
          <tr>
            <td>Cyclomatic complexity (max)</td>
            <td>&lt; {cc.get('target_max', 10)}</td>
            <td>{'—' if cc_val is None else str(cc_val)}</td>
            <td>{pill(cc.get('pass'), cc_val is None)}</td>
          </tr>
          <tr>
            <td>Security (Snyk critical)</td>
            <td>≤ {targets.get('security_critical_max', 0)}</td>
            <td>{'—' if sec.get('unknown') else str(sec.get('count'))}</td>
            <td>{pill(sec.get('pass'), bool(sec.get('unknown')))}</td>
          </tr>
          <tr>
            <td>HTTP p95 (k6)</td>
            <td>&lt; {targets.get('http_p95_ms_max', 500)} ms</td>
            <td>{'—' if k6.get('p95_ms') is None else f"{k6.get('p95_ms'):.1f} ms"}</td>
            <td>{pill(k6.get('pass_p95'), k6.get('p95_ms') is None)}</td>
          </tr>
          <tr>
            <td>Error rate (k6 checks)</td>
            <td>&lt; {targets.get('http_error_rate_max_pct', 1)}%</td>
            <td>{'—' if k6.get('error_rate_pct') is None else f"{k6.get('error_rate_pct'):.2f}%"}</td>
            <td>{pill(k6.get('pass_errors'), k6.get('error_rate_pct') is None)}</td>
          </tr>
          <tr>
            <td>E2E (Playwright) failure rate</td>
            <td>&lt; {targets.get('http_error_rate_max_pct', 1)}%</td>
            <td>{'—' if not pw.get('tests') else f"{pw.get('error_rate_pct', 0):.2f}% ({pw.get('passed', 0)}/{pw.get('tests', 0)})"}</td>
            <td>{pill(pw.get('pass'), not pw)}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section class="card">
      <h2>Visualization</h2>
      <p class="muted">Coverage toward goal (capped at 100%). Complexity bar shows headroom vs target (lower is better).</p>
      <div class="bar-label">Coverage vs {targets.get("coverage_pct_min", 80)}% goal</div>
      <div class="bar"><div class="bar-fill cov" style="width:{cov_bar:.1f}%"></div></div>
      <div class="bar-label">Max CCN vs limit {cc.get("target_max", 10)}</div>
      <div class="bar"><div class="bar-fill cc" style="width:{cc_bar:.1f}%"></div></div>
    </section>
    """

    py = data.get("pytest") or {}
    es = data.get("eslint") or {}

    detail = f"""
    <section class="card">
      <h2>Tooling snapshot</h2>
      <ul class="kv">
        <li><strong>Pytest (QA)</strong>: {py.get("tests", 0)} tests, failures={py.get("failures")}, errors={py.get("errors")}</li>
        <li><strong>Jest</strong>: failed tests = {data.get("jest", {}).get("failed")}</li>
        <li><strong>ESLint</strong>: errors={es.get("errorCount")}, warnings={es.get("warningCount")}</li>
        <li><strong>Pylint</strong>: score={data.get("pylint", {}).get("score")}</li>
        <li><strong>ZAP log lines</strong>: {data.get("zap", {}).get("log_lines", 0)}</li>
      </ul>
    </section>
    """

    raw_json = html.escape(json.dumps(data, indent=2))
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QA quality dashboard</title>
  <style>
    :root {{
      --bg: #0f172a;
      --card: #1e293b;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --accent: #a78bfa;
      --ok: #22c55e;
      --bad: #ef4444;
      --warn: #eab308;
    }}
    body {{ font-family: system-ui, sans-serif; margin: 0; background: var(--bg); color: var(--text); }}
    header {{ padding: 1.5rem 2rem; border-bottom: 1px solid #334155; }}
    h1 {{ margin: 0; font-size: 1.35rem; color: var(--accent); }}
    main {{ padding: 2rem; max-width: 960px; margin: 0 auto; }}
    .card {{ background: var(--card); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; }}
    h2 {{ margin-top: 0; font-size: 1.05rem; color: #cbd5e1; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 0.9rem; }}
    th, td {{ text-align: left; padding: 0.5rem 0.35rem; border-bottom: 1px solid #334155; }}
    .pill {{ display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }}
    .pill.pass {{ background: #14532d; color: #86efac; }}
    .pill.fail {{ background: #7f1d1d; color: #fecaca; }}
    .pill.na {{ background: #334155; color: var(--muted); }}
    .bar {{ height: 10px; background: #334155; border-radius: 6px; overflow: hidden; margin: 0.25rem 0 1rem; }}
    .bar-fill {{ height: 100%; border-radius: 6px; transition: width 0.4s ease; }}
    .bar-fill.cov {{ background: linear-gradient(90deg, #6366f1, #a78bfa); }}
    .bar-fill.cc {{ background: linear-gradient(90deg, #f97316, #eab308); }}
    .bar-label {{ font-size: 0.8rem; color: var(--muted); }}
    .muted {{ color: var(--muted); font-size: 0.85rem; }}
    ul.kv {{ list-style: none; padding: 0; margin: 0; }}
    ul.kv li {{ padding: 0.35rem 0; border-bottom: 1px solid #334155; }}
    pre {{ background: #0f172a; padding: 1rem; border-radius: 8px; overflow: auto; font-size: 0.75rem; color: #cbd5e1; }}
  </style>
</head>
<body>
  <header>
    <h1>QA quality dashboard</h1>
    <p class="muted">Generated {data.get("generated_at", "")} — see also <code>RECOMMENDATIONS.md</code></p>
  </header>
  <main>
    {rows}
    {detail}
    <section class="card">
      <h2>Raw JSON</h2>
      <pre>{raw_json}</pre>
    </section>
  </main>
</body>
</html>
"""


if __name__ == "__main__":
    sys.exit(main())
