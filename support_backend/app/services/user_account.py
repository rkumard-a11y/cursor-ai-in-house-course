"""Clear FK references before deleting a user account."""

from __future__ import annotations

from sqlalchemy import or_

from app.extensions import db
from app.models import (
    Ticket,
    TicketAssignment,
    TicketComment,
    TicketStatusHistory,
)


def purge_user_references(user_id: int) -> None:
    TicketComment.query.filter_by(user_id=user_id).delete(
        synchronize_session=False
    )
    TicketAssignment.query.filter(
        or_(
            TicketAssignment.assigned_to_id == user_id,
            TicketAssignment.assigned_by_id == user_id,
        )
    ).delete(synchronize_session=False)
    Ticket.query.filter_by(created_by_id=user_id).update(
        {Ticket.created_by_id: None}, synchronize_session=False
    )
    Ticket.query.filter_by(assigned_to_id=user_id).update(
        {Ticket.assigned_to_id: None}, synchronize_session=False
    )
    TicketStatusHistory.query.filter_by(changed_by_id=user_id).update(
        {TicketStatusHistory.changed_by_id: None}, synchronize_session=False
    )
