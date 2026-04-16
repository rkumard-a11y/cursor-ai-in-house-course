from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.auth_util import admin_required
from app.extensions import db, limiter
from app.models import Product
from app.schemas import ProductCreateSchema, ProductUpdateSchema

bp = Blueprint("products", __name__)
create_schema = ProductCreateSchema()
update_schema = ProductUpdateSchema()


def _list_limit():
    return current_app.config.get("PRODUCTS_LIST_LIMIT", "200 per minute")


@bp.get("")
@limiter.limit(_list_limit, override_defaults=False)
def list_products():
    q = Product.query.filter_by(active=True).order_by(Product.id)
    items = [
        {
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "price_cents": p.price_cents,
            "stock": p.stock,
        }
        for p in q
    ]
    return jsonify({"status": "ok", "items": items}), 200


@bp.get("/<int:product_id>")
def get_product(product_id: int):
    p = Product.query.get(product_id)
    if not p or not p.active:
        return jsonify({"status": "error", "code": "NOT_FOUND", "message": "Product not found."}), 404
    return (
        jsonify(
            {
                "status": "ok",
                "product": {
                    "id": p.id,
                    "sku": p.sku,
                    "name": p.name,
                    "description": p.description,
                    "price_cents": p.price_cents,
                    "stock": p.stock,
                    "active": p.active,
                },
            }
        ),
        200,
    )


@bp.post("")
@admin_required
def create_product():
    data = create_schema.load(request.get_json(silent=True) or {})
    if Product.query.filter_by(sku=data["sku"]).first():
        return (
            jsonify(
                {
                    "status": "error",
                    "code": "SKU_EXISTS",
                    "message": "SKU already exists.",
                }
            ),
            409,
        )
    p = Product(
        sku=data["sku"],
        name=data["name"],
        description=data.get("description") or "",
        price_cents=data["price_cents"],
        stock=data.get("stock", 0),
        active=data.get("active", True),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({"status": "ok", "product": {"id": p.id, "sku": p.sku}}), 201


@bp.put("/<int:product_id>")
@admin_required
def update_product(product_id: int):
    p = Product.query.get(product_id)
    if not p:
        return jsonify({"status": "error", "code": "NOT_FOUND", "message": "Product not found."}), 404
    data = update_schema.load(request.get_json(silent=True) or {})
    for k in ("name", "description", "price_cents", "stock", "active"):
        if k in data:
            setattr(p, k, data[k])
    db.session.commit()
    return jsonify({"status": "ok", "product": {"id": p.id, "sku": p.sku}}), 200


@bp.delete("/<int:product_id>")
@admin_required
def delete_product(product_id: int):
    p = Product.query.get(product_id)
    if not p:
        return jsonify({"status": "error", "code": "NOT_FOUND", "message": "Product not found."}), 404
    db.session.delete(p)
    db.session.commit()
    return "", 204
