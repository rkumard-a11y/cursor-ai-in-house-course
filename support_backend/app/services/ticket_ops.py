from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from flask import current_app
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import (
    Ticket,
    TicketAssignment,
    TicketAttachment,
    TicketCategory,
    TicketPriority,
    TicketStatus,
    TicketStatusHistory,
    User,
    UserRole,
    AvailabilityStatus,
)
from app.notifications import (
    notify_status_changed,
    notify_ticket_assigned,
    notify_ticket_created,
)
from app.sanitize import sanitize_text
from app.sla import compute_sla_deadlines, is_overdue
from app.status_rules import can_transition
from app.ticket_number import allocate_ticket_number


def _utcnow():
    return datetime.now(timezone.utc)


def log_status_change(
    ticket: Ticket,
    old: TicketStatus | None,
    new: TicketStatus,
    user_id: int,
    note: str | None = None,
):
    db.session.add(
        TicketStatusHistory(
            ticket_id=ticket.id,
            old_status=old,
            new_status=new,
            changed_by_id=user_id,
            note=note,
        )
    )


def save_ticket_attachments(
    ticket_id: int, files: Iterable[FileStorage | None]
) -> list[TicketAttachment]:
    saved: list[TicketAttachment] = []
    upload_dir = Path(current_app.instance_path) / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    max_bytes = int(current_app.config["MAX_ATTACHMENT_BYTES"])
    allowed = current_app.config["ALLOWED_ATTACHMENT_EXT"]
    count = 0
    for f in files:
        if not f or not f.filename:
            continue
        count += 1
        if count > int(current_app.config["MAX_ATTACHMENTS"]):
            raise ValueError("Too many attachments (max 3).")
        ext = Path(f.filename).suffix.lower()
        if ext == ".jpeg":
            ext = ".jpg"
        if ext not in allowed:
            raise ValueError(f"File type not allowed: {ext}")
        f.stream.seek(0, os.SEEK_END)
        size = f.stream.tell()
        f.stream.seek(0)
        if size > max_bytes:
            raise ValueError("Attachment exceeds 5MB limit.")
        safe = secure_filename(f.filename)
        unique = f"{ticket_id}_{count}_{safe}"
        dest = upload_dir / unique
        f.save(dest)
        saved.append(
            TicketAttachment(
                ticket_id=ticket_id,
                comment_id=None,
                filename=safe,
                file_path=str(dest),
                file_size=size,
                file_type=ext,
            )
        )
    return saved


def create_ticket_record(
    *,
    subject: str,
    description: str,
    priority: TicketPriority,
    category: TicketCategory,
    customer_email: str,
    created_by: User,
    files: list[FileStorage] | None = None,
) -> Ticket:
    number = allocate_ticket_number()
    resp_due, res_due = compute_sla_deadlines(_utcnow(), priority)
    ticket = Ticket(
        ticket_number=number,
        subject=sanitize_text(subject, 200),
        description=sanitize_text(description, 5000),
        status=TicketStatus.open,
        priority=priority,
        category=category,
        customer_email=customer_email.strip().lower(),
        created_by_id=created_by.id,
        sla_response_due_at=resp_due,
        sla_resolution_due_at=res_due,
    )
    db.session.add(ticket)
    db.session.flush()
    if files:
        for att in save_ticket_attachments(ticket.id, files):
            db.session.add(att)
    log_status_change(
        ticket, None, TicketStatus.open, created_by.id, "Ticket created"
    )
    db.session.commit()
    notify_ticket_created(ticket)
    return ticket


def apply_status_update(
    ticket: Ticket, new_status: TicketStatus, actor: User, note: str | None
) -> Ticket:
    ok, err = can_transition(
        ticket, new_status, int(current_app.config.get("REOPEN_WINDOW_DAYS", 7))
    )
    if not ok:
        raise ValueError(err or "Invalid transition")
    old = ticket.status
    ticket.status = new_status
    now = _utcnow()
    if new_status == TicketStatus.resolved:
        ticket.resolved_at = now
    if new_status == TicketStatus.closed:
        ticket.closed_at = now
    if new_status == TicketStatus.reopened:
        ticket.closed_at = None
    if old != TicketStatus.in_progress and new_status == TicketStatus.in_progress:
        if ticket.first_response_at is None:
            ticket.first_response_at = now
    log_status_change(ticket, old, new_status, actor.id, note)
    db.session.commit()
    notify_status_changed(ticket, new_status.value)
    return ticket


def apply_priority_update(
    ticket: Ticket, new_priority: TicketPriority, reason: str, actor: User
) -> Ticket:
    ticket.priority = new_priority
    ticket.last_priority_change_reason = sanitize_text(reason, 2000)
    resp_due, res_due = compute_sla_deadlines(ticket.created_at, new_priority)
    ticket.sla_response_due_at = resp_due
    ticket.sla_resolution_due_at = res_due
    db.session.commit()
    return ticket


def record_assignment(
    ticket: Ticket, agent: User, assigned_by: User | None, send_mail: bool = True
):
    ticket.assigned_to_id = agent.id
    if ticket.status == TicketStatus.open:
        ticket.status = TicketStatus.assigned
        log_status_change(
            ticket,
            TicketStatus.open,
            TicketStatus.assigned,
            assigned_by.id if assigned_by else agent.id,
            "Assigned to agent",
        )
    db.session.add(
        TicketAssignment(
            ticket_id=ticket.id,
            assigned_to_id=agent.id,
            assigned_by_id=assigned_by.id if assigned_by else None,
        )
    )
    db.session.commit()
    if send_mail:
        notify_ticket_assigned(ticket, agent)


def pick_agent_for_auto_assign(ticket: Ticket) -> User | None:
    agents = (
        User.query.filter_by(role=UserRole.agent)
        .filter(User.availability_status != AvailabilityStatus.offline)
        .all()
    )
    if not agents:
        return None
    cat = ticket.category.value

    def score(u: User):
        areas = u.expertise_areas or []
        bonus = 0 if cat in areas else 1
        open_cnt = Ticket.query.filter(
            Ticket.assigned_to_id == u.id,
            Ticket.status.in_(
                [
                    TicketStatus.open,
                    TicketStatus.assigned,
                    TicketStatus.in_progress,
                    TicketStatus.waiting,
                ]
            ),
        ).count()
        busy_penalty = 0 if u.availability_status == AvailabilityStatus.available else 5
        return open_cnt + busy_penalty + bonus

    agents.sort(key=score)
    return agents[0]


def auto_assign_ticket(ticket: Ticket, assigned_by: User | None) -> bool:
    agent = pick_agent_for_auto_assign(ticket)
    if not agent:
        return False
    record_assignment(ticket, agent, assigned_by, send_mail=True)
    return True


def maybe_escalate_sla(ticket: Ticket) -> None:
    """FR-022 simplified: flag when resolution SLA missed."""
    if is_overdue(ticket.sla_resolution_due_at) and not ticket.sla_escalated:
        ticket.sla_escalated = True
        db.session.commit()
