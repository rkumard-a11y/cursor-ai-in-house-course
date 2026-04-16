"""FR-020 / FR-021 SLA due times and approaching checks."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.models import TicketPriority


def _utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# (response_hours, resolution_hours) — resolution uses calendar hours per PRD examples
_SLA_HOURS = {
    TicketPriority.urgent: (2, 24),
    TicketPriority.high: (4, 48),
    TicketPriority.medium: (8, 5 * 24),
    TicketPriority.low: (24, 10 * 24),
}


def compute_sla_deadlines(created_at: datetime, priority: TicketPriority):
    created_at = _utc(created_at) or datetime.now(timezone.utc)
    rh, res_h = _sla_hours(priority)
    return created_at + timedelta(hours=rh), created_at + timedelta(hours=res_h)


def _sla_hours(priority: TicketPriority):
    return _SLA_HOURS[priority]


def is_approaching_deadline(
    due: datetime | None, now: datetime | None = None, within_hours: int = 24
) -> bool:
    if due is None:
        return False
    now = _utc(now) or datetime.now(timezone.utc)
    due = _utc(due)
    return due >= now and due <= now + timedelta(hours=within_hours)


def is_overdue(due: datetime | None, now: datetime | None = None) -> bool:
    if due is None:
        return False
    now = _utc(now) or datetime.now(timezone.utc)
    return _utc(due) < now


def _coerce_dt(val):
    if val is None:
        return None
    if isinstance(val, datetime):
        return _utc(val)
    if isinstance(val, str):
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    return None


def apply_sla_flags(ticket_dict: dict, now: datetime | None = None) -> dict:
    """Adds FR-021 highlight fields for API serialization."""
    now = _utc(now) or datetime.now(timezone.utc)
    resp = ticket_dict.get("sla_response_due_at")
    res = ticket_dict.get("sla_resolution_due_at")
    ticket_dict = dict(ticket_dict)
    ticket_dict["sla_response_approaching"] = False
    ticket_dict["sla_resolution_approaching"] = False
    ticket_dict["sla_response_missed"] = False
    ticket_dict["sla_resolution_missed"] = False
    r = _coerce_dt(resp)
    if r is not None:
        ticket_dict["sla_response_approaching"] = is_approaching_deadline(r, now)
        ticket_dict["sla_response_missed"] = is_overdue(r, now)
    r2 = _coerce_dt(res)
    if r2 is not None:
        ticket_dict["sla_resolution_approaching"] = is_approaching_deadline(r2, now)
        ticket_dict["sla_resolution_missed"] = is_overdue(r2, now)
    return ticket_dict
