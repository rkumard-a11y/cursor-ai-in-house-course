"""FR-011 / FR-012 status definitions and allowed transitions."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.models import Ticket, TicketStatus


ALLOWED_TRANSITIONS: dict[TicketStatus, set[TicketStatus]] = {
    TicketStatus.open: {TicketStatus.assigned, TicketStatus.closed},
    TicketStatus.assigned: {TicketStatus.in_progress, TicketStatus.closed},
    TicketStatus.in_progress: {
        TicketStatus.waiting,
        TicketStatus.resolved,
        TicketStatus.closed,
    },
    TicketStatus.waiting: {TicketStatus.in_progress},
    TicketStatus.resolved: {TicketStatus.closed, TicketStatus.reopened},
    TicketStatus.closed: {TicketStatus.reopened},
    TicketStatus.reopened: {TicketStatus.in_progress},
}


def can_transition(
    ticket: Ticket, new_status: TicketStatus, reopen_window_days: int
) -> tuple[bool, str | None]:
    old = ticket.status
    if old == new_status:
        return False, "Ticket is already in this status."
    allowed = ALLOWED_TRANSITIONS.get(old, set())
    if new_status not in allowed:
        return False, f"Cannot change status from '{old.value}' to '{new_status.value}'."
    if old == TicketStatus.closed and new_status == TicketStatus.reopened:
        if ticket.closed_at is None:
            return False, "Missing closed timestamp."
        closed = ticket.closed_at
        if closed.tzinfo is None:
            closed = closed.replace(tzinfo=timezone.utc)
        else:
            closed = closed.astimezone(timezone.utc)
        if datetime.now(timezone.utc) - closed > timedelta(days=reopen_window_days):
            return False, f"Ticket may only be reopened within {reopen_window_days} days of closing."
    return True, None
