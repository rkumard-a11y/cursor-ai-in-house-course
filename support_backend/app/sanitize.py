"""NFR-016: strip dangerous HTML from user text."""

import bleach


def sanitize_text(value: str, max_length: int | None = None) -> str:
    cleaned = bleach.clean(value or "", tags=[], strip=True)
    if max_length is not None and len(cleaned) > max_length:
        return cleaned[:max_length]
    return cleaned
