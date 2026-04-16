from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flasgger import swag_from

from app.extensions import db
from app.models import Comment, Post
from app.schemas import CommentCreateSchema, CommentDumpSchema

bp = Blueprint("comments", __name__)

create_schema = CommentCreateSchema()
comment_dump = CommentDumpSchema()


@bp.post("/<int:post_id>/comments")
@jwt_required()
@swag_from(
    {
        "tags": ["Comments"],
        "summary": "Add a comment to a post",
        "security": [{"Bearer": []}],
        "parameters": [
            {"name": "post_id", "in": "path", "type": "integer", "required": True},
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "required": ["body"],
                    "properties": {"body": {"type": "string"}},
                },
            },
        ],
        "responses": {
            201: {"description": "Created"},
            404: {"description": "Post not found"},
        },
    }
)
def create_comment(post_id):
    user_id = int(get_jwt_identity())
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({"error": "not_found", "message": "Post not found."}), 404
    data = create_schema.load(request.get_json(silent=True) or {})
    comment = Comment(body=data["body"], post_id=post_id, author_id=user_id)
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment_dump.dump(comment)), 201


@bp.get("/<int:post_id>/comments")
@swag_from(
    {
        "tags": ["Comments"],
        "summary": "List comments for a post",
        "parameters": [
            {"name": "post_id", "in": "path", "type": "integer", "required": True}
        ],
        "responses": {200: {"description": "Comments"}, 404: {"description": "Post not found"}},
    }
)
def list_comments(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({"error": "not_found", "message": "Post not found."}), 404
    comments = (
        Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.asc()).all()
    )
    return jsonify(comment_dump.dump(comments, many=True))


@bp.delete("/<int:post_id>/comments/<int:comment_id>")
@jwt_required()
@swag_from(
    {
        "tags": ["Comments"],
        "summary": "Delete a comment (author of comment or post)",
        "security": [{"Bearer": []}],
        "parameters": [
            {"name": "post_id", "in": "path", "type": "integer", "required": True},
            {"name": "comment_id", "in": "path", "type": "integer", "required": True},
        ],
        "responses": {
            204: {"description": "Deleted"},
            403: {"description": "Forbidden"},
            404: {"description": "Not found"},
        },
    }
)
def delete_comment(post_id, comment_id):
    user_id = int(get_jwt_identity())
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({"error": "not_found", "message": "Post not found."}), 404
    comment = db.session.get(Comment, comment_id)
    if not comment or comment.post_id != post_id:
        return jsonify({"error": "not_found", "message": "Comment not found."}), 404
    if comment.author_id != user_id and post.author_id != user_id:
        return (
            jsonify(
                {
                    "error": "forbidden",
                    "message": "You can only delete your own comments or comments on your posts.",
                }
            ),
            403,
        )
    db.session.delete(comment)
    db.session.commit()
    return "", 204
