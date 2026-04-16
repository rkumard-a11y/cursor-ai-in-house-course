from flask import Blueprint, jsonify, request
from flasgger import swag_from
from sqlalchemy import or_

from app.models import Post
from app.schemas import PaginatedPostsSchema

bp = Blueprint("search", __name__)

paginated_dump = PaginatedPostsSchema()


@bp.get("")
@swag_from(
    {
        "tags": ["Search"],
        "summary": "Search posts by keyword in title or body",
        "parameters": [
            {
                "name": "q",
                "in": "query",
                "type": "string",
                "required": True,
                "description": "Search keyword",
            },
            {
                "name": "page",
                "in": "query",
                "type": "integer",
                "required": False,
                "default": 1,
            },
        ],
        "responses": {200: {"description": "Paginated search results"}},
    }
)
def search_posts():
    from flask import current_app

    keyword = (request.args.get("q") or "").strip()
    if not keyword:
        return (
            jsonify(
                {
                    "error": "validation_error",
                    "message": "Query parameter 'q' is required and cannot be empty.",
                }
            ),
            400,
        )
    page = request.args.get("page", default=1, type=int)
    if page < 1:
        page = 1
    per_page = current_app.config["POSTS_PER_PAGE"]
    pattern = f"%{keyword}%"
    q = (
        Post.query.filter(or_(Post.title.ilike(pattern), Post.body.ilike(pattern)))
        .order_by(Post.created_at.desc())
    )
    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    payload = {
        "items": pagination.items,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
    }
    return jsonify(paginated_dump.dump(payload))
