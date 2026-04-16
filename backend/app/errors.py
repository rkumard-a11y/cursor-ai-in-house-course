from flask import jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

from app.extensions import db


def register_error_handlers(app):
    @app.errorhandler(MarshmallowValidationError)
    def handle_marshmallow_validation(err):
        return jsonify({"error": "validation_error", "messages": err.messages}), 400

    @app.errorhandler(IntegrityError)
    def handle_integrity(err):
        db.session.rollback()
        return (
            jsonify(
                {
                    "error": "conflict",
                    "message": "A database constraint was violated.",
                }
            ),
            409,
        )

    @app.errorhandler(HTTPException)
    def handle_http(exc):
        if exc.code is None:
            return jsonify({"error": "http_error", "message": exc.description}), 500
        return (
            jsonify({"error": exc.name.lower().replace(" ", "_"), "message": exc.description}),
            exc.code,
        )
