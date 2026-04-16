"""Routes used only when TESTING=True (e.g. exercising global error handlers)."""

from flask import Blueprint

from app.extensions import db
from app.models import User


def register_testing_routes(app):
    bp = Blueprint("__testing", __name__)

    @bp.post("/integrity")
    def trigger_integrity_error():
        u1 = User(username="__dup_a", email="__dup@test.local")
        u1.set_password("1234567890")
        u2 = User(username="__dup_b", email="__dup@test.local")
        u2.set_password("1234567890")
        db.session.add_all([u1, u2])
        db.session.commit()
        return "unexpected"

    app.register_blueprint(bp, url_prefix="/__test")
