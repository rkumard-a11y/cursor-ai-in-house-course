from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from flasgger import swag_from
from sqlalchemy import or_

from app.extensions import db
from app.models import User
from app.schemas import UserLoginSchema, UserRegisterSchema

bp = Blueprint("auth", __name__)

register_schema = UserRegisterSchema()
login_schema = UserLoginSchema()


@bp.post("/register")
@swag_from(
    {
        "tags": ["Auth"],
        "summary": "Register a new user",
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "required": ["username", "email", "password"],
                    "properties": {
                        "username": {"type": "string"},
                        "email": {"type": "string", "format": "email"},
                        "password": {"type": "string"},
                    },
                },
            }
        ],
        "responses": {
            201: {"description": "User created"},
            400: {"description": "Validation error"},
            409: {"description": "Username or email already taken"},
        },
    }
)
def register():
    data = register_schema.load(request.get_json(silent=True) or {})
    if User.query.filter(
        or_(User.username == data["username"], User.email == data["email"])
    ).first():
        return (
            jsonify(
                {
                    "error": "conflict",
                    "message": "Username or email is already registered.",
                }
            ),
            409,
        )
    user = User(username=data["username"], email=data["email"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return (
        jsonify(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        ),
        201,
    )


@bp.post("/login")
@swag_from(
    {
        "tags": ["Auth"],
        "summary": "Login and receive JWT access token",
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "required": ["username", "password"],
                    "properties": {
                        "username": {"type": "string"},
                        "password": {"type": "string"},
                    },
                },
            }
        ],
        "responses": {
            200: {"description": "Access token"},
            401: {"description": "Invalid credentials"},
        },
    }
)
def login():
    data = login_schema.load(request.get_json(silent=True) or {})
    user = User.query.filter_by(username=data["username"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "unauthorized", "message": "Invalid username or password."}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token})
