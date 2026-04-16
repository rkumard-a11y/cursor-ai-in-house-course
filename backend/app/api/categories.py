from flask import Blueprint, jsonify
from flasgger import swag_from

from app.models import Category
from app.schemas import CategoryDumpSchema

bp = Blueprint("categories", __name__)

category_dump = CategoryDumpSchema()


@bp.get("")
@swag_from(
    {
        "tags": ["Categories"],
        "summary": "List all categories",
        "responses": {200: {"description": "Categories"}},
    }
)
def list_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    return jsonify(category_dump.dump(categories, many=True))
