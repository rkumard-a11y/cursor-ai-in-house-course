from flask import jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from werkzeug.exceptions import HTTPException


def api_error(message: str, code: str, status: int, errors=None):
    body = {"status": "error", "message": message, "code": code}
    if errors:
        body["errors"] = errors
    return jsonify(body), status


def register_error_handlers(app):
    @app.errorhandler(MarshmallowValidationError)
    def handle_marshmallow(err):
        return api_error(
            "Validation failed.",
            "VALIDATION_ERROR",
            400,
            errors=err.messages,
        )

    @app.errorhandler(HTTPException)
    def handle_http(exc):
        if exc.code == 404:
            return api_error(exc.description or "Not found.", "NOT_FOUND", 404)
        if exc.code == 401:
            return api_error(exc.description or "Unauthorized.", "UNAUTHORIZED", 401)
        if exc.code == 403:
            return api_error(exc.description or "Forbidden.", "FORBIDDEN", 403)
        if exc.code == 429:
            return api_error(
                exc.description or "Too many requests.",
                "RATE_LIMIT_EXCEEDED",
                429,
            )
        return api_error(
            exc.description or "Request error.",
            exc.name.upper().replace(" ", "_"),
            exc.code or 500,
        )

    @app.errorhandler(Exception)
    def handle_unexpected(exc):
        # Controlled 500 for API error contract tests (health /boom).
        if app.config.get("TESTING") and str(exc) == "Simulated internal failure":
            return api_error("Internal server error.", "INTERNAL_ERROR", 500)
        if app.config.get("TESTING"):
            raise exc
        app.logger.exception("Unhandled: %s", exc)
        return api_error("Internal server error.", "INTERNAL_ERROR", 500)
