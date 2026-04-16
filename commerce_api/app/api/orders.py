from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.auth_util import admin_required
from app.extensions import db
from app.models import Order, OrderLine, Product
from app.schemas import OrderCreateSchema, OrderStatusSchema

bp = Blueprint("orders", __name__)
create_schema = OrderCreateSchema()
status_schema = OrderStatusSchema()


def _dump_order(o: Order):
    lines = [
        {
            "product_id": ln.product_id,
            "quantity": ln.quantity,
            "unit_price_cents": ln.unit_price_cents,
        }
        for ln in o.lines
    ]
    return {
        "id": o.id,
        "user_id": o.user_id,
        "status": o.status,
        "lines": lines,
    }


@bp.post("")
@jwt_required()
def create_order():
    uid = int(get_jwt_identity())
    data = create_schema.load(request.get_json(silent=True) or {})
    order = Order(user_id=uid, status="placed")
    db.session.add(order)
    db.session.flush()
    for line in data["lines"]:
        p = Product.query.get(line["product_id"])
        if not p or not p.active:
            db.session.rollback()
            return (
                jsonify(
                    {
                        "status": "error",
                        "code": "INVALID_PRODUCT",
                        "message": "Unknown or inactive product.",
                    }
                ),
                400,
            )
        if p.stock < line["quantity"]:
            db.session.rollback()
            return (
                jsonify(
                    {
                        "status": "error",
                        "code": "INSUFFICIENT_STOCK",
                        "message": f"Insufficient stock for product {p.sku}.",
                    }
                ),
                409,
            )
        p.stock -= line["quantity"]
        db.session.add(
            OrderLine(
                order_id=order.id,
                product_id=p.id,
                quantity=line["quantity"],
                unit_price_cents=p.price_cents,
            )
        )
    db.session.commit()
    return jsonify({"status": "ok", "order": _dump_order(order)}), 201


@bp.get("")
@jwt_required()
def list_orders():
    claims = get_jwt() or {}
    uid = int(get_jwt_identity())
    if claims.get("role") == "admin":
        orders = Order.query.order_by(Order.id.desc()).all()
    else:
        orders = Order.query.filter_by(user_id=uid).order_by(Order.id.desc()).all()
    return jsonify({"status": "ok", "items": [_dump_order(o) for o in orders]}), 200


@bp.get("/<int:order_id>")
@jwt_required()
def get_order(order_id: int):
    claims = get_jwt() or {}
    uid = int(get_jwt_identity())
    o = Order.query.get(order_id)
    if not o:
        return jsonify({"status": "error", "code": "NOT_FOUND", "message": "Order not found."}), 404
    if claims.get("role") != "admin" and o.user_id != uid:
        return jsonify({"status": "error", "code": "FORBIDDEN", "message": "Forbidden."}), 403
    return jsonify({"status": "ok", "order": _dump_order(o)}), 200


@bp.put("/<int:order_id>")
@jwt_required()
def update_order(order_id: int):
    claims = get_jwt() or {}
    uid = int(get_jwt_identity())
    data = status_schema.load(request.get_json(silent=True) or {})
    o = Order.query.get(order_id)
    if not o:
        return jsonify({"status": "error", "code": "NOT_FOUND", "message": "Order not found."}), 404
    is_admin = claims.get("role") == "admin"
    if not is_admin and o.user_id != uid:
        return jsonify({"status": "error", "code": "FORBIDDEN", "message": "Forbidden."}), 403
    if not is_admin and data["status"] != "cancelled":
        return (
            jsonify(
                {
                    "status": "error",
                    "code": "FORBIDDEN",
                    "message": "Customers may only cancel their own orders.",
                }
            ),
            403,
        )
    o.status = data["status"]
    db.session.commit()
    return jsonify({"status": "ok", "order": _dump_order(o)}), 200


@bp.delete("/<int:order_id>")
@admin_required
def delete_order(order_id: int):
    o = Order.query.get(order_id)
    if not o:
        return jsonify({"status": "error", "code": "NOT_FOUND", "message": "Order not found."}), 404
    db.session.delete(o)
    db.session.commit()
    return "", 204
