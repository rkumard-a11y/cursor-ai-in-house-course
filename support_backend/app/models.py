from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import Enum as SAEnum, Index, UniqueConstraint

from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    customer = "customer"
    agent = "agent"
    admin = "admin"


class AvailabilityStatus(str, enum.Enum):
    available = "available"
    busy = "busy"
    offline = "offline"


class TicketStatus(str, enum.Enum):
    open = "open"
    assigned = "assigned"
    in_progress = "in_progress"
    waiting = "waiting"
    resolved = "resolved"
    closed = "closed"
    reopened = "reopened"


class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class TicketCategory(str, enum.Enum):
    technical = "technical"
    billing = "billing"
    general = "general"
    feature_request = "feature_request"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(
        SAEnum(UserRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=UserRole.customer,
    )
    availability_status = db.Column(
        SAEnum(AvailabilityStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AvailabilityStatus.available,
    )
    expertise_areas = db.Column(db.JSON, nullable=False, default=list)
    avatar_url = db.Column(db.String(512), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    tickets_created = db.relationship(
        "Ticket", backref="created_by", foreign_keys="Ticket.created_by_id"
    )
    tickets_assigned = db.relationship(
        "Ticket", backref="assignee", foreign_keys="Ticket.assigned_to_id"
    )


class Ticket(db.Model):
    __tablename__ = "tickets"
    __table_args__ = (
        Index("ix_tickets_status", "status"),
        Index("ix_tickets_priority", "priority"),
        Index("ix_tickets_assigned_to_id", "assigned_to_id"),
        Index("ix_tickets_created_at", "created_at"),
        UniqueConstraint("ticket_number", name="uq_tickets_ticket_number"),
    )

    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(32), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(
        SAEnum(TicketStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TicketStatus.open,
    )
    priority = db.Column(
        SAEnum(TicketPriority, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    category = db.Column(
        SAEnum(TicketCategory, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    customer_email = db.Column(db.String(255), nullable=False, index=True)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )
    resolved_at = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)
    first_response_at = db.Column(db.DateTime, nullable=True)
    sla_response_due_at = db.Column(db.DateTime, nullable=True)
    sla_resolution_due_at = db.Column(db.DateTime, nullable=True)
    last_priority_change_reason = db.Column(db.Text, nullable=True)
    sla_escalated = db.Column(db.Boolean, default=False, nullable=False)

    comments = db.relationship(
        "TicketComment",
        backref="ticket",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    attachments = db.relationship(
        "TicketAttachment",
        backref="ticket",
        lazy="dynamic",
        cascade="all, delete-orphan",
        foreign_keys="TicketAttachment.ticket_id",
    )
    assignments = db.relationship(
        "TicketAssignment",
        back_populates="ticket",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="TicketAssignment.assigned_at",
    )
    status_history = db.relationship(
        "TicketStatusHistory",
        back_populates="ticket",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="TicketStatusHistory.changed_at",
    )


class TicketComment(db.Model):
    __tablename__ = "ticket_comments"
    __table_args__ = (Index("ix_ticket_comments_ticket_id", "ticket_id"),)

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_internal = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    user = db.relationship("User", backref="ticket_comments")


class TicketAssignment(db.Model):
    __tablename__ = "ticket_assignments"
    __table_args__ = (Index("ix_ticket_assignments_ticket_id", "ticket_id"),)

    ticket = db.relationship("Ticket", back_populates="assignments")

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    assigned_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    assigned_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    assignee = db.relationship("User", foreign_keys=[assigned_to_id])
    assigner = db.relationship("User", foreign_keys=[assigned_by_id])


class TicketStatusHistory(db.Model):
    __tablename__ = "ticket_status_history"
    __table_args__ = (Index("ix_ticket_status_history_ticket_id", "ticket_id"),)

    ticket = db.relationship("Ticket", back_populates="status_history")

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False)
    old_status = db.Column(
        SAEnum(TicketStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
    new_status = db.Column(
        SAEnum(TicketStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    changed_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    changed_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    note = db.Column(db.Text, nullable=True)

    changed_by = db.relationship("User")


class TicketAttachment(db.Model):
    __tablename__ = "ticket_attachments"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False)
    comment_id = db.Column(db.Integer, db.ForeignKey("ticket_comments.id"), nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_type = db.Column(db.String(120), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=utcnow, nullable=False)
