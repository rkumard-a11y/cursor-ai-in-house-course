from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required
from flasgger import swag_from

from app.auth_utils import get_current_user
from app.errors import prd_error
from app.extensions import db
from app.models import User, UserRole
from app.sanitize import sanitize_text
from app.schemas import (
    AccountDeleteSchema,
    PasswordChangeSchema,
    ProfileUpdateSchema,
    UserLoginSchema,
    UserPublicSchema,
    UserRegisterSchema,
)
from app.security import hash_password, verify_password
from app.services.user_account import purge_user_references

bp = Blueprint("auth", __name__)

register_schema = UserRegisterSchema()
login_schema = UserLoginSchema()
user_dump = UserPublicSchema()
profile_schema = ProfileUpdateSchema()
password_change_schema = PasswordChangeSchema()
account_delete_schema = AccountDeleteSchema()


@bp.post("/register")
@swag_from(
    {
        "tags": ["Auth"],
        "summary": "Register (customers only from public API)",
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "schema": {
                    "type": "object",
                    "required": ["name", "email", "password"],
                    "properties": {
                        "name": {"type": "string"},
                        "email": {"type": "string"},
                        "password": {"type": "string"},
                    },
                },
            }
        ],
        "responses": {201: {"description": "Created"}, 409: {"description": "Conflict"}},
    }
)
def register():
    data = register_schema.load(request.get_json(silent=True) or {})
    email = data["email"].lower().strip()
    if User.query.filter_by(email=email).first():
        return prd_error("Email already registered.", "CONFLICT", 409)
    user = User(
        name=sanitize_text(data["name"].strip(), 120),
        email=email,
        role=UserRole.customer,
    )
    user.password_hash = hash_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify({"status": "success", "user": user_dump.dump(user)}), 201


@bp.post("/login")
@swag_from(
    {
        "tags": ["Auth"],
        "summary": "Login",
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "schema": {
                    "type": "object",
                    "required": ["email", "password"],
                    "properties": {
                        "email": {"type": "string"},
                        "password": {"type": "string"},
                    },
                },
            }
        ],
        "responses": {200: {"description": "Token"}, 401: {"description": "Invalid"}},
    }
)
def login():
    data = login_schema.load(request.get_json(silent=True) or {})
    user = User.query.filter_by(email=data["email"].lower()).first()
    if not user or not verify_password(data["password"], user.password_hash):
        return prd_error("Invalid email or password.", "UNAUTHORIZED", 401)
    token = create_access_token(identity=str(user.id))
    return jsonify({"status": "success", "access_token": token})


@bp.post("/logout")
@jwt_required()
def logout():
    return jsonify({"status": "success", "message": "Token discarded on client."})


@bp.get("/me")
@jwt_required()
@swag_from(
    {
        "tags": ["Auth"],
        "summary": "Current user profile",
        "security": [{"Bearer": []}],
        "responses": {200: {"description": "Profile"}},
    }
)
def me():
    user = get_current_user()
    if not user:
        return prd_error("User not found.", "NOT_FOUND", 404)
    return jsonify({"status": "success", "user": user_dump.dump(user)})


@bp.patch("/me")
@jwt_required()
@swag_from(
    {
        "tags": ["Auth", "Profile"],
        "summary": "Update current user profile (name, avatar_url, bio)",
        "security": [{"Bearer": []}],
        "responses": {200: {"description": "Updated"}, 400: {"description": "Validation"}},
    }
)
def update_me():
    user = get_current_user()
    if not user:
        return prd_error("User not found.", "NOT_FOUND", 404)
    data = profile_schema.load(request.get_json(silent=True) or {}, partial=True)
    if "name" in data:
        user.name = sanitize_text(data["name"].strip(), 120)
    if "avatar_url" in data:
        user.avatar_url = data["avatar_url"] or None
    if "bio" in data:
        user.bio = (
            None
            if data["bio"] is None
            else sanitize_text(str(data["bio"]), 5000)
        )
    db.session.commit()
    return jsonify({"status": "success", "user": user_dump.dump(user)})


@bp.put("/password")
@jwt_required()
@swag_from(
    {
        "tags": ["Auth", "Profile"],
        "summary": "Change password (requires current password)",
        "security": [{"Bearer": []}],
        "responses": {200: {"description": "Changed"}, 400: {"description": "Validation"}},
    }
)
def change_password():
    user = get_current_user()
    if not user:
        return prd_error("User not found.", "NOT_FOUND", 404)
    data = password_change_schema.load(request.get_json(silent=True) or {})
    if not verify_password(data["current_password"], user.password_hash):
        return prd_error(
            "Invalid credentials.",
            "UNAUTHORIZED",
            401,
        )
    user.password_hash = hash_password(data["new_password"])
    db.session.commit()
    return jsonify({"status": "success", "message": "Password updated."})


@bp.delete("/me")
@jwt_required()
@swag_from(
    {
        "tags": ["Auth", "Profile"],
        "summary": "Delete own account (password + confirm DELETE)",
        "security": [{"Bearer": []}],
        "responses": {204: {"description": "Deleted"}, 401: {"description": "Bad password"}},
    }
)
def delete_me():
    user = get_current_user()
    if not user:
        return prd_error("User not found.", "NOT_FOUND", 404)
    data = account_delete_schema.load(request.get_json(silent=True) or {})
    if not verify_password(data["password"], user.password_hash):
        return prd_error("Invalid password.", "UNAUTHORIZED", 401)
    uid = user.id
    purge_user_references(uid)
    db.session.delete(user)
    db.session.commit()
    return "", 204
