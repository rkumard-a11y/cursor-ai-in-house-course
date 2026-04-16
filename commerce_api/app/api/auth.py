from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.extensions import db
from app.models import User
from app.schemas import LoginSchema, RegisterSchema

bp = Blueprint("auth", __name__)

register_schema = RegisterSchema()
login_schema = LoginSchema()


@bp.post("/register")
def register():
    data = register_schema.load(request.get_json(silent=True) or {})
    if User.query.filter_by(email=data["email"].lower()).first():
        return (
            jsonify(
                {
                    "status": "error",
                    "code": "EMAIL_TAKEN",
                    "message": "Email already registered.",
                }
            ),
            409,
        )
    u = User(email=data["email"].lower(), name=data.get("name") or "", role="customer")
    u.set_password(data["password"])
    db.session.add(u)
    db.session.commit()
    return (
        jsonify(
            {
                "status": "ok",
                "user": {"id": u.id, "email": u.email, "name": u.name, "role": u.role},
            }
        ),
        201,
    )


@bp.post("/login")
def login():
    data = login_schema.load(request.get_json(silent=True) or {})
    u = User.query.filter_by(email=data["email"].lower()).first()
    if not u or not u.check_password(data["password"]):
        return (
            jsonify(
                {
                    "status": "error",
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password.",
                }
            ),
            401,
        )
    token = create_access_token(
        identity=str(u.id),
        additional_claims={"role": u.role, "email": u.email},
    )
    return jsonify({"status": "ok", "access_token": token}), 200


@bp.get("/me")
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    u = User.query.get(uid)
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
