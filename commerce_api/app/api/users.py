from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.auth_util import admin_required
from app.extensions import db
from app.models import User
from app.schemas import UserUpdateSchema

bp = Blueprint("users", __name__)
update_schema = UserUpdateSchema()


@bp.get("")
@admin_required
def list_users():
    users = User.query.order_by(User.id).all()
    return (
        jsonify(
            {
                "status": "ok",
                "items": [
                    {"id": u.id, "email": u.email, "name": u.name, "role": u.role} for u in users
                ],
            }
        ),
        200,
    )


@bp.get("/<int:user_id>")
@jwt_required()
def get_user(user_id: int):
    claims = get_jwt() or {}
    uid = int(get_jwt_identity())
    if claims.get("role") != "admin" and uid != user_id:
        return jsonify({"status": "error", "code": "FORBIDDEN", "message": "Forbidden."}), 403
    u = User.query.get(user_id)
    if not u:
        return jsonify({"status": "error", "code": "NOT_FOUND", "message": "User not found."}), 404
    return (
        jsonify(
            {
                "status": "ok",
                "user": {"id": u.id, "email": u.email, "name": u.name, "role": u.role},
            }
        ),
        200,
    )


@bp.put("/<int:user_id>")
@jwt_required()
def update_user(user_id: int):
    claims = get_jwt() or {}
    uid = int(get_jwt_identity())
    is_admin = claims.get("role") == "admin"
    if not is_admin and uid != user_id:
        return jsonify({"status": "error", "code": "FORBIDDEN", "message": "Forbidden."}), 403
    u = User.query.get(user_id)
    if not u:
        return jsonify({"status": "error", "code": "NOT_FOUND", "message": "User not found."}), 404
    data = update_schema.load(request.get_json(silent=True) or {})
    if "name" in data:
        u.name = data["name"]
    if "role" in data:
        if not is_admin:
            return (
                jsonify(
                    {
                        "status": "error",
                        "code": "FORBIDDEN",
                        "message": "Only admins can change roles.",
                    }
                ),
                403,
            )
        u.role = data["role"]
    db.session.commit()
    return (
        jsonify(
            {
                "status": "ok",
                "user": {"id": u.id, "email": u.email, "name": u.name, "role": u.role},
            }
        ),
        200,
    )


@bp.delete("/<int:user_id>")
@admin_required
def delete_user(user_id: int):
    uid = int(get_jwt_identity())
    if uid == user_id:
        return (
            jsonify(
                {
                    "status": "error",
                    "code": "BAD_REQUEST",
                    "message": "Cannot delete your own account via this endpoint.",
                }
            ),
            400,
        )
    u = User.query.get(user_id)
    if not u:
        return jsonify({"status": "error", "code": "NOT_FOUND", "message": "User not found."}), 404
    for o in list(u.orders):
        db.session.delete(o)
    db.session.delete(u)
    db.session.commit()
    return "", 204
