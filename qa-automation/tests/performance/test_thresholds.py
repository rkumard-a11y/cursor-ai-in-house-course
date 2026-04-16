"""Load performance thresholds JSON (used by k6 / Lighthouse scripts)."""

import json
from pathlib import Path


def test_thresholds_file_valid():
    path = Path(__file__).resolve().parents[2] / "performance" / "performance-thresholds.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert "lighthouse" in data
    assert "k6" in data
    assert data["k6"]["http_req_duration"]["p95_ms"] > 0
    assert 0 < data["k6"]["error_rate_max"] <= 1
