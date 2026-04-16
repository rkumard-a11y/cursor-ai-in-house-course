from __future__ import annotations

from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import User


def get_current_user() -> User | None:
    ident = get_jwt_identity()
    if ident is None:
        return None
    return db.session.get(User, int(ident))
