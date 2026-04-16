from functools import wraps

from flask import abort
from flask_jwt_extended import get_jwt, jwt_required


def admin_required(fn):
    @jwt_required()
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt() or {}
        if claims.get("role") != "admin":
            abort(403, description="Admin role required.")
        return fn(*args, **kwargs)

    return wrapper


def customer_or_admin(fn):
    @jwt_required()
    @wraps(fn)
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)

    return wrapper
