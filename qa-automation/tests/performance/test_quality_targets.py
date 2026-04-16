"""quality-targets.json schema."""

import json
from pathlib import Path


def test_quality_targets_file():
    path = Path(__file__).resolve().parents[2] / "quality" / "quality-targets.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["coverage_pct_min"] == 80
    assert data["cyclomatic_complexity_max"] == 10
    assert data["security_critical_max"] == 0
    assert data["http_p95_ms_max"] == 500
    assert data["http_error_rate_max_pct"] == 1
