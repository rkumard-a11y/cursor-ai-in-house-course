from flask import Blueprint, current_app, jsonify

bp = Blueprint("health", __name__)


@bp.get("")
def health():
    return jsonify({"status": "ok", "service": "commerce_api"}), 200


@bp.get("/boom")
def boom():
    """Intentional 500 for error-handler tests (only when enabled)."""
    if not current_app.config.get("ENABLE_BOOM_ROUTE"):
        return jsonify({"status": "error", "code": "NOT_FOUND", "message": "Not found."}), 404
    raise RuntimeError("Simulated internal failure")
