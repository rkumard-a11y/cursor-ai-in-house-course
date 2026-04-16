"""FR-002 unique ticket numbers TICK-YYYYMMDD-XXXX."""

from __future__ import annotations

from datetime import datetime, timezone

from app.extensions import db
from app.models import Ticket


def generate_ticket_number() -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"TICK-{today}-"
    last = (
        db.session.query(Ticket.ticket_number)
        .filter(Ticket.ticket_number.like(f"{prefix}%"))
        .order_by(Ticket.ticket_number.desc())
        .limit(1)
        .scalar()
    )
    if not last:
        seq = 1
    else:
        tail = last[len(prefix) :]
        try:
            seq = int(tail) + 1
        except ValueError:
            seq = 1
    if seq > 9999:
        raise RuntimeError("Daily ticket sequence exhausted.")
    return f"{prefix}{seq:04d}"


def allocate_ticket_number(max_retries: int = 5) -> str:
    for _ in range(max_retries):
        num = generate_ticket_number()
        exists = db.session.query(Ticket.id).filter_by(ticket_number=num).first()
        if not exists:
            return num
        db.session.rollback()
    raise RuntimeError("Could not allocate ticket number.")
