from __future__ import annotations

import re

from marshmallow import EXCLUDE, ValidationError, fields, pre_load, validates, validates_schema
from marshmallow.validate import Equal, Length, OneOf

from app.extensions import ma
from app.models import TicketCategory, TicketPriority, TicketStatus

SUBJECT_PATTERN = re.compile(r"^[a-zA-Z0-9\s\-'.,!?()]+$")

COMMON_WEAK_PASSWORDS = frozenset(
    {
        "password",
        "password123",
        "12345678",
        "qwerty123",
        "letmein",
        "welcome",
    }
)


def is_password_too_weak(password: str) -> bool:
    if len(password) < 8:
        return True
    if password.lower() in COMMON_WEAK_PASSWORDS:
        return True
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        return True
    return False


class UserRegisterSchema(ma.Schema):
    name = fields.Str(required=True, validate=Length(min=1, max=120))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=Length(min=8, max=128))

    @pre_load
    def strip_email(self, data, **kwargs):
        if isinstance(data, dict) and isinstance(data.get("email"), str):
            data = dict(data)
            data["email"] = data["email"].strip()
        return data

    @validates("password")
    def password_strength(self, value, **kwargs):
        if is_password_too_weak(value):
            raise ValidationError(
                "Password must be at least 8 characters and include letters and numbers; "
                "avoid common passwords."
            )


class UserLoginSchema(ma.Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

    @pre_load
    def strip_login_email(self, data, **kwargs):
        if isinstance(data, dict) and isinstance(data.get("email"), str):
            data = dict(data)
            data["email"] = data["email"].strip()
        return data


class UserPublicSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str()
    email = fields.Email()
    role = fields.Function(lambda u: u.role.value)
    availability_status = fields.Function(
        lambda u: u.availability_status.value
        if getattr(u, "availability_status", None)
        else None
    )
    avatar_url = fields.Str(allow_none=True)
    bio = fields.Str(allow_none=True)


class ProfileUpdateSchema(ma.Schema):
    class Meta:
        unknown = EXCLUDE

    name = fields.Str(validate=Length(min=1, max=120))
    avatar_url = fields.Url(allow_none=True, schemes=("http", "https"))
    bio = fields.Str(allow_none=True, validate=Length(max=5000))

    @validates_schema
    def require_field(self, data, **kwargs):
        if not data:
            raise ValidationError({"_schema": ["At least one field is required."]})


class PasswordChangeSchema(ma.Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=Length(min=8, max=128))

    @validates_schema
    def passwords_must_differ(self, data, **kwargs):
        cur = data.get("current_password")
        new = data.get("new_password")
        if cur is not None and new is not None and cur == new:
            raise ValidationError(
                {"new_password": ["New password must differ from current password."]}
            )

    @validates("new_password")
    def new_password_strength(self, value, **kwargs):
        if is_password_too_weak(value):
            raise ValidationError(
                "New password must include letters and numbers and avoid common passwords."
            )


class AccountDeleteSchema(ma.Schema):
    password = fields.Str(required=True)
    confirm = fields.Str(
        required=True,
        validate=Equal("DELETE"),
        metadata={"description": 'Must be exactly the string DELETE'},
    )


class TicketCreateSchema(ma.Schema):
    subject = fields.Str(required=True, validate=Length(min=5, max=200))
    description = fields.Str(required=True, validate=Length(min=20, max=5000))
    priority = fields.Str(
        required=True,
        validate=OneOf([p.value for p in TicketPriority]),
    )
    category = fields.Str(
        required=True,
        validate=OneOf([c.value for c in TicketCategory]),
    )
    customer_email = fields.Email(required=True)

    @validates("subject")
    def validate_subject_chars(self, value, **kwargs):
        if not SUBJECT_PATTERN.match(value or ""):
            raise ValidationError(
                "Subject may only contain letters, numbers, spaces, and - ' . , ! ? ( )"
            )


class TicketUpdateSchema(ma.Schema):
    subject = fields.Str(validate=Length(min=5, max=200))
    description = fields.Str(validate=Length(min=20, max=5000))
    customer_email = fields.Email()

    @validates("subject")
    def validate_subject_chars(self, value, **kwargs):
        if value is None:
            return
        if not SUBJECT_PATTERN.match(value):
            raise ValidationError(
                "Subject may only contain letters, numbers, spaces, and - ' . , ! ? ( )"
            )

    @validates_schema
    def require_any(self, data, **kwargs):
        if not data:
            raise ValidationError({"_schema": ["At least one field is required."]})


class StatusUpdateSchema(ma.Schema):
    status = fields.Str(
        required=True,
        validate=OneOf([s.value for s in TicketStatus]),
    )
    note = fields.Str(required=False, allow_none=True, validate=Length(max=2000))


class PriorityUpdateSchema(ma.Schema):
    priority = fields.Str(
        required=True,
        validate=OneOf([p.value for p in TicketPriority]),
    )
    reason = fields.Str(required=True, validate=Length(min=3, max=2000))


class AssignSchema(ma.Schema):
    user_id = fields.Int(required=True)


class CommentCreateSchema(ma.Schema):
    content = fields.Str(required=True, validate=Length(min=1, max=8000))
    is_internal = fields.Bool(load_default=False)


class CommentDumpSchema(ma.Schema):
    id = fields.Int()
    content = fields.Str()
    is_internal = fields.Bool()
    created_at = fields.DateTime(format="iso")
    user = fields.Nested(UserPublicSchema(only=("id", "name", "email", "role")))


class TicketDumpSchema(ma.Schema):
    id = fields.Int()
    ticket_number = fields.Str()
    subject = fields.Str()
    description = fields.Str()
    status = fields.Function(lambda t: t.status.value)
    priority = fields.Function(lambda t: t.priority.value)
    category = fields.Function(lambda t: t.category.value)
    customer_email = fields.Email()
    assigned_to_id = fields.Int(allow_none=True)
    created_by_id = fields.Int(allow_none=True)
    created_at = fields.DateTime(format="iso")
    updated_at = fields.DateTime(format="iso")
    resolved_at = fields.DateTime(format="iso", allow_none=True)
    closed_at = fields.DateTime(format="iso", allow_none=True)
    first_response_at = fields.DateTime(format="iso", allow_none=True)
    sla_response_due_at = fields.DateTime(format="iso", allow_none=True)
    sla_resolution_due_at = fields.DateTime(format="iso", allow_none=True)
    last_priority_change_reason = fields.Str(allow_none=True)
    sla_escalated = fields.Bool()
    assignee = fields.Nested(UserPublicSchema(only=("id", "name", "email")), allow_none=True)
