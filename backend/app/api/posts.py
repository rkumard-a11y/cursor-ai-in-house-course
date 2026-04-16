from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flasgger import swag_from

from app.extensions import db
from app.models import Post
from app.post_cache import (
    get_cached_post_detail,
    get_cached_post_list,
    invalidate_post_caches,
    set_cached_post_detail,
    set_cached_post_list,
)
from app.schemas import PaginatedPostsSchema, PostCreateSchema, PostDumpSchema, PostUpdateSchema

bp = Blueprint("posts", __name__)

create_schema = PostCreateSchema()
update_schema = PostUpdateSchema()
post_dump = PostDumpSchema()
paginated_dump = PaginatedPostsSchema()


@bp.get("")
@swag_from(
    {
        "tags": ["Posts"],
        "summary": "List posts (paginated, 20 per page)",
        "parameters": [
            {
                "name": "page",
                "in": "query",
                "type": "integer",
                "required": False,
                "default": 1,
            }
        ],
        "responses": {200: {"description": "Paginated posts"}},
    }
)
def list_posts():
    from flask import current_app

    page = request.args.get("page", default=1, type=int)
    if page < 1:
        page = 1
    cached = get_cached_post_list(page)
    if cached is not None:
        return jsonify(cached), 200
    per_page = current_app.config["POSTS_PER_PAGE"]
    q = Post.query.order_by(Post.created_at.desc())
    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    payload = {
        "items": pagination.items,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
    }
    dumped = paginated_dump.dump(payload)
    set_cached_post_list(page, dumped)
    return jsonify(dumped)


@bp.post("")
@jwt_required()
@swag_from(
    {
        "tags": ["Posts"],
        "summary": "Create a post",
        "security": [{"Bearer": []}],
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "required": ["title", "body"],
                    "properties": {
                        "title": {"type": "string"},
                        "body": {"type": "string"},
                        "category_id": {"type": "integer"},
                    },
                },
            }
        ],
        "responses": {
            201: {"description": "Created"},
            401: {"description": "Unauthorized"},
        },
    }
)
def create_post():
    user_id = int(get_jwt_identity())
    data = create_schema.load(request.get_json(silent=True) or {})
    post = Post(
        title=data["title"],
        body=data["body"],
        author_id=user_id,
        category_id=data.get("category_id"),
    )
    db.session.add(post)
    db.session.commit()
    invalidate_post_caches(None)
    return jsonify(post_dump.dump(post)), 201


@bp.get("/<int:post_id>")
@swag_from(
    {
        "tags": ["Posts"],
        "summary": "Get a single post",
        "parameters": [
            {"name": "post_id", "in": "path", "type": "integer", "required": True}
        ],
        "responses": {200: {"description": "Post"}, 404: {"description": "Not found"}},
    }
)
def get_post(post_id):
    cached = get_cached_post_detail(post_id)
    if cached is not None:
        return jsonify(cached), 200
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({"error": "not_found", "message": "Post not found."}), 404
    dumped = post_dump.dump(post)
    set_cached_post_detail(post_id, dumped)
    return jsonify(dumped)


@bp.put("/<int:post_id>")
@jwt_required()
@swag_from(
    {
        "tags": ["Posts"],
        "summary": "Update a post (author only)",
        "security": [{"Bearer": []}],
        "parameters": [
            {"name": "post_id", "in": "path", "type": "integer", "required": True},
            {
                "name": "body",
                "in": "body",
                "schema": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "body": {"type": "string"},
                        "category_id": {"type": "integer"},
                    },
                },
            },
        ],
        "responses": {
            200: {"description": "Updated"},
            403: {"description": "Forbidden"},
            404: {"description": "Not found"},
        },
    }
)
def update_post(post_id):
    user_id = int(get_jwt_identity())
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({"error": "not_found", "message": "Post not found."}), 404
    if post.author_id != user_id:
        return jsonify({"error": "forbidden", "message": "You can only edit your own posts."}), 403
    data = update_schema.load(request.get_json(silent=True) or {})
    if "title" in data:
        post.title = data["title"]
    if "body" in data:
        post.body = data["body"]
    if "category_id" in data:
        post.category_id = data["category_id"]
    db.session.commit()
    invalidate_post_caches(post_id)
    dumped = post_dump.dump(post)
    set_cached_post_detail(post_id, dumped)
    return jsonify(dumped)


@bp.delete("/<int:post_id>")
@jwt_required()
@swag_from(
    {
        "tags": ["Posts"],
        "summary": "Delete a post (author only)",
        "security": [{"Bearer": []}],
        "parameters": [
            {"name": "post_id", "in": "path", "type": "integer", "required": True}
        ],
        "responses": {
            204: {"description": "Deleted"},
            403: {"description": "Forbidden"},
            404: {"description": "Not found"},
        },
    }
)
def delete_post(post_id):
    user_id = int(get_jwt_identity())
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({"error": "not_found", "message": "Post not found."}), 404
    if post.author_id != user_id:
        return jsonify({"error": "forbidden", "message": "You can only delete your own posts."}), 403
    db.session.delete(post)
    db.session.commit()
    invalidate_post_caches(post_id)
    return "", 204
