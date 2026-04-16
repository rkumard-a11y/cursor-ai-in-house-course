from __future__ import annotations

from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from flasgger import swag_from
from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload

from app.auth_utils import get_current_user
from app.errors import prd_error
from app.extensions import db
from app.models import (
    Ticket,
    TicketAssignment,
    TicketCategory,
    TicketComment,
    TicketPriority,
    TicketStatus,
    TicketStatusHistory,
    User,
    UserRole,
)
from app.notifications import notify_new_comment
from app.sanitize import sanitize_text
from app.schemas import (
    AssignSchema,
    CommentCreateSchema,
    CommentDumpSchema,
    PriorityUpdateSchema,
    StatusUpdateSchema,
    TicketCreateSchema,
    TicketDumpSchema,
    TicketUpdateSchema,
)
import app.services.ticket_ops as ticket_ops
from app.sla import apply_sla_flags

bp = Blueprint("tickets", __name__)

create_schema = TicketCreateSchema()
update_schema = TicketUpdateSchema()
status_schema = StatusUpdateSchema()
priority_schema = PriorityUpdateSchema()
assign_schema = AssignSchema()
comment_schema = CommentCreateSchema()
ticket_dump = TicketDumpSchema()
comment_dump = CommentDumpSchema()


def _ensure_view(user: User, ticket: Ticket):
    if user.role == UserRole.admin:
        return None
    if user.role == UserRole.customer:
        if ticket.customer_email.lower() != user.email.lower():
            return prd_error("You cannot access this ticket.", "FORBIDDEN", 403)
        return None
    if user.role == UserRole.agent:
        if ticket.assigned_to_id is None or ticket.assigned_to_id == user.id:
            return None
        return prd_error("You cannot access this ticket.", "FORBIDDEN", 403)
    return prd_error("Forbidden.", "FORBIDDEN", 403)


def _ensure_agent_or_admin(user: User):
    if user.role not in (UserRole.agent, UserRole.admin):
        return prd_error("Insufficient permissions.", "FORBIDDEN", 403)
    return None


def _dump_ticket(ticket: Ticket) -> dict:
    data = ticket_dump.dump(ticket)
    return apply_sla_flags(data)


def _ticket_query_for_user(user: User):
    q = Ticket.query.options(joinedload(Ticket.assignee))
    if user.role == UserRole.admin:
        return q
    if user.role == UserRole.customer:
        return q.filter(Ticket.customer_email == user.email.lower())
    return q.filter(
        or_(Ticket.assigned_to_id == user.id, Ticket.assigned_to_id.is_(None))
    )


@bp.get("")
@jwt_required()
@swag_from(
    {
        "tags": ["Tickets"],
        "summary": "List tickets (filters, pagination 20)",
        "security": [{"Bearer": []}],
        "parameters": [
            {"name": "page", "in": "query", "type": "integer"},
            {"name": "q", "in": "query", "type": "string"},
            {"name": "status", "in": "query", "type": "string"},
            {"name": "priority", "in": "query", "type": "string"},
            {"name": "category", "in": "query", "type": "string"},
            {"name": "customer_email", "in": "query", "type": "string"},
            {"name": "assigned_to_id", "in": "query", "type": "integer"},
            {"name": "sla_approaching", "in": "query", "type": "boolean"},
        ],
        "responses": {200: {"description": "Paginated tickets"}},
    }
)
def list_tickets():
    from flask import current_app

    user = get_current_user()
    if not user:
        return prd_error("Authentication required.", "UNAUTHORIZED", 401)
    page = request.args.get("page", default=1, type=int)
    if page < 1:
        page = 1
    per_page = int(current_app.config["TICKETS_PER_PAGE"])
    q = _ticket_query_for_user(user)
    if request.args.get("q"):
        kw = f"%{request.args.get('q').strip()}%"
        q = q.filter(or_(Ticket.subject.ilike(kw), Ticket.description.ilike(kw)))
    if request.args.get("status"):
        try:
            st = TicketStatus(request.args.get("status"))
            q = q.filter_by(status=st)
        except ValueError:
            return prd_error("Invalid status filter.", "VALIDATION_ERROR", 400)
    if request.args.get("priority"):
        try:
            pr = TicketPriority(request.args.get("priority"))
            q = q.filter_by(priority=pr)
        except ValueError:
            return prd_error("Invalid priority filter.", "VALIDATION_ERROR", 400)
    if request.args.get("category"):
        try:
            cat = TicketCategory(request.args.get("category"))
            q = q.filter_by(category=cat)
        except ValueError:
            return prd_error("Invalid category filter.", "VALIDATION_ERROR", 400)
    if request.args.get("customer_email") and user.role == UserRole.admin:
        q = q.filter(
            Ticket.customer_email == request.args.get("customer_email").lower()
        )
    aid = request.args.get("assigned_to_id", type=int)
    if aid is not None:
        if user.role != UserRole.admin:
            return prd_error("Forbidden.", "FORBIDDEN", 403)
        q = q.filter_by(assigned_to_id=aid)
    if str(request.args.get("sla_approaching", "")).lower() in ("1", "true", "yes"):
        now = datetime.now(timezone.utc)
        hrs = int(current_app.config.get("SLA_APPROACHING_HOURS", 24))
        horizon = now + timedelta(hours=hrs)
        q = q.filter(
            or_(
                and_(
                    Ticket.sla_response_due_at.isnot(None),
                    Ticket.sla_response_due_at >= now,
                    Ticket.sla_response_due_at <= horizon,
                ),
                and_(
                    Ticket.sla_resolution_due_at.isnot(None),
                    Ticket.sla_resolution_due_at >= now,
                    Ticket.sla_resolution_due_at <= horizon,
                ),
            )
        )
    q = q.order_by(Ticket.created_at.desc())
    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    items = [_dump_ticket(t) for t in pagination.items]
    return jsonify(
        {
            "items": items,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        }
    )


@bp.post("")
@jwt_required()
@swag_from(
    {
        "tags": ["Tickets"],
        "summary": "Create ticket (JSON or multipart with attachments)",
        "security": [{"Bearer": []}],
        "responses": {201: {"description": "Created"}},
    }
)
def create_ticket():
    user = get_current_user()
    if not user:
        return prd_error("Authentication required.", "UNAUTHORIZED", 401)
    files = []
    if request.content_type and request.content_type.startswith("multipart"):
        data = {
            "subject": request.form.get("subject"),
            "description": request.form.get("description"),
            "priority": request.form.get("priority"),
            "category": request.form.get("category"),
            "customer_email": request.form.get("customer_email"),
        }
        files = request.files.getlist("attachments") or []
    else:
        data = request.get_json(silent=True) or {}
    payload = create_schema.load(data)
    if user.role == UserRole.customer:
        if payload["customer_email"].lower() != user.email.lower():
            return prd_error(
                "Customer email must match your account email.",
                "VALIDATION_ERROR",
                400,
                errors={"customer_email": ["Must match authenticated user email."]},
            )
    try:
        ticket = ticket_ops.create_ticket_record(
            subject=payload["subject"],
            description=payload["description"],
            priority=TicketPriority(payload["priority"]),
            category=TicketCategory(payload["category"]),
            customer_email=payload["customer_email"],
            created_by=user,
            files=files,
        )
    except ValueError as e:
        return prd_error(str(e), "VALIDATION_ERROR", 400)
    auto = str(request.args.get("auto_assign", "")).lower() in ("1", "true", "yes")
    if auto:
        ticket_ops.auto_assign_ticket(ticket, assigned_by=user)
        db.session.refresh(ticket)
    return jsonify({"status": "success", "ticket": _dump_ticket(ticket)}), 201


@bp.get("/<int:ticket_id>")
@jwt_required()
def get_ticket(ticket_id: int):
    user = get_current_user()
    ticket = (
        Ticket.query.options(joinedload(Ticket.assignee))
        .filter_by(id=ticket_id)
        .first()
    )
    if not ticket:
        return prd_error("Ticket not found.", "NOT_FOUND", 404)
    err = _ensure_view(user, ticket)
    if err:
        return err
    ticket_ops.maybe_escalate_sla(ticket)
    db.session.refresh(ticket)
    return jsonify({"status": "success", "ticket": _dump_ticket(ticket)})


@bp.put("/<int:ticket_id>")
@jwt_required()
def update_ticket(ticket_id: int):
    user = get_current_user()
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        return prd_error("Ticket not found.", "NOT_FOUND", 404)
    err = _ensure_view(user, ticket)
    if err:
        return err
    if user.role == UserRole.customer:
        return prd_error("Customers cannot update tickets via this endpoint.", "FORBIDDEN", 403)
    data = update_schema.load(request.get_json(silent=True) or {})
    if "subject" in data:
        ticket.subject = sanitize_text(data["subject"], 200)
    if "description" in data:
        ticket.description = sanitize_text(data["description"], 5000)
    if "customer_email" in data and user.role == UserRole.admin:
        ticket.customer_email = data["customer_email"].lower()
    db.session.commit()
    return jsonify({"status": "success", "ticket": _dump_ticket(ticket)})


@bp.delete("/<int:ticket_id>")
@jwt_required()
def delete_ticket(ticket_id: int):
    user = get_current_user()
    if user.role != UserRole.admin:
        return prd_error("Only administrators may delete tickets.", "FORBIDDEN", 403)
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        return prd_error("Ticket not found.", "NOT_FOUND", 404)
    db.session.delete(ticket)
    db.session.commit()
    return "", 204


@bp.post("/<int:ticket_id>/comments")
@jwt_required()
def add_comment(ticket_id: int):
    user = get_current_user()
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        return prd_error("Ticket not found.", "NOT_FOUND", 404)
    err = _ensure_view(user, ticket)
    if err:
        return err
    data = comment_schema.load(request.get_json(silent=True) or {})
    internal = bool(data.get("is_internal"))
    if internal and user.role == UserRole.customer:
        return prd_error("Customers cannot post internal comments.", "FORBIDDEN", 403)
    if user.role == UserRole.customer:
        internal = False
    body = sanitize_text(data["content"], 8000)
    c = TicketComment(
        ticket_id=ticket.id,
        user_id=user.id,
        content=body,
        is_internal=internal,
    )
    db.session.add(c)
    if ticket.first_response_at is None and user.role in (
        UserRole.agent,
        UserRole.admin,
    ):
        ticket.first_response_at = datetime.now(timezone.utc)
    db.session.commit()
    recipients = []
    if internal:
        if ticket.assignee:
            recipients.append(ticket.assignee.email)
        for adm in User.query.filter_by(role=UserRole.admin).all():
            recipients.append(adm.email)
    else:
        recipients.append(ticket.customer_email)
        if ticket.assignee:
            recipients.append(ticket.assignee.email)
    notify_new_comment(ticket, c, recipients)
    return jsonify({"status": "success", "comment": comment_dump.dump(c)}), 201


@bp.get("/<int:ticket_id>/comments")
@jwt_required()
def list_comments(ticket_id: int):
    user = get_current_user()
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        return prd_error("Ticket not found.", "NOT_FOUND", 404)
    err = _ensure_view(user, ticket)
    if err:
        return err
    q = (
        TicketComment.query.options(joinedload(TicketComment.user))
        .filter_by(ticket_id=ticket.id)
        .order_by(TicketComment.created_at.asc())
    )
    if user.role == UserRole.customer:
        q = q.filter_by(is_internal=False)
    comments = q.all()
    return jsonify({"status": "success", "items": comment_dump.dump(comments, many=True)})


@bp.put("/<int:ticket_id>/status")
@jwt_required()
def update_status(ticket_id: int):
    user = get_current_user()
    if user.role == UserRole.customer:
        return prd_error("Customers cannot change ticket status.", "FORBIDDEN", 403)
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        return prd_error("Ticket not found.", "NOT_FOUND", 404)
    err = _ensure_view(user, ticket)
    if err:
        return err
    if user.role == UserRole.agent and ticket.assigned_to_id != user.id:
        return prd_error("You may only update assigned tickets.", "FORBIDDEN", 403)
    data = status_schema.load(request.get_json(silent=True) or {})
    try:
        new_status = TicketStatus(data["status"])
        ticket_ops.apply_status_update(
            ticket, new_status, user, data.get("note")
        )
    except ValueError as e:
        return prd_error(str(e), "VALIDATION_ERROR", 400)
    db.session.refresh(ticket)
    return jsonify({"status": "success", "ticket": _dump_ticket(ticket)})


@bp.put("/<int:ticket_id>/priority")
@jwt_required()
def update_priority(ticket_id: int):
    user = get_current_user()
    if user.role not in (UserRole.agent, UserRole.admin):
        return prd_error("Insufficient permissions.", "FORBIDDEN", 403)
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        return prd_error("Ticket not found.", "NOT_FOUND", 404)
    err = _ensure_view(user, ticket)
    if err:
        return err
    if user.role == UserRole.agent and ticket.assigned_to_id != user.id:
        return prd_error("You may only update assigned tickets.", "FORBIDDEN", 403)
    data = priority_schema.load(request.get_json(silent=True) or {})
    ticket_ops.apply_priority_update(
        ticket, TicketPriority(data["priority"]), data["reason"], user
    )
    db.session.refresh(ticket)
    return jsonify({"status": "success", "ticket": _dump_ticket(ticket)})


@bp.post("/<int:ticket_id>/assign")
@jwt_required()
def assign_ticket(ticket_id: int):
    user = get_current_user()
    if user.role != UserRole.admin:
        return prd_error("Only administrators can assign tickets.", "FORBIDDEN", 403)
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        return prd_error("Ticket not found.", "NOT_FOUND", 404)
    data = assign_schema.load(request.get_json(silent=True) or {})
    agent = db.session.get(User, data["user_id"])
    if not agent or agent.role != UserRole.agent:
        return prd_error("Target user is not an agent.", "VALIDATION_ERROR", 400)
    ticket_ops.record_assignment(ticket, agent, assigned_by=user, send_mail=True)
    db.session.refresh(ticket)
    return jsonify({"status": "success", "ticket": _dump_ticket(ticket)})


@bp.get("/<int:ticket_id>/history")
@jwt_required()
def ticket_history(ticket_id: int):
    user = get_current_user()
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        return prd_error("Ticket not found.", "NOT_FOUND", 404)
    err = _ensure_view(user, ticket)
    if err:
        return err
    events = []
    for h in ticket.status_history.all():
        events.append(
            {
                "type": "status",
                "at": h.changed_at.isoformat(),
                "old_status": h.old_status.value if h.old_status else None,
                "new_status": h.new_status.value,
                "changed_by_id": h.changed_by_id,
                "note": h.note,
            }
        )
    for a in ticket.assignments.all():
        events.append(
            {
                "type": "assignment",
                "at": a.assigned_at.isoformat(),
                "assigned_to_id": a.assigned_to_id,
                "assigned_by_id": a.assigned_by_id,
            }
        )
    events.sort(key=lambda e: e["at"])
    return jsonify({"status": "success", "items": events})
