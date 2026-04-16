"""Rate limit enforcement on catalog list (strict test config)."""

import pytest


@pytest.mark.ratelimit
def test_product_list_eventually_429(strict_rate_client):
    codes = []
    for _ in range(6):
        r = strict_rate_client.get("/api/products")
        codes.append(r.status_code)
    assert 429 in codes, f"expected at least one 429, got {codes}"
