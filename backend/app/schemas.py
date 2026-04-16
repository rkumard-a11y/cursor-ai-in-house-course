from marshmallow import ValidationError, fields, validates_schema
from marshmallow.validate import Length, Range

from app.extensions import db, ma
from app.models import Category, User


class UserRegisterSchema(ma.Schema):
    username = fields.Str(required=True, validate=Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=Length(min=8, max=128))


class UserLoginSchema(ma.Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)


class UserPublicSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str()
    email = fields.Email()


class CategoryDumpSchema(ma.Schema):
    id = fields.Int()
    name = fields.Str()
    slug = fields.Str()


class PostCreateSchema(ma.Schema):
    title = fields.Str(required=True, validate=Length(min=1, max=200))
    body = fields.Str(required=True, validate=Length(min=1))
    category_id = fields.Int(allow_none=True, validate=Range(min=1))

    @validates_schema
    def category_exists(self, data, **kwargs):
        cid = data.get("category_id")
        if cid is None:
            return
        if not db.session.get(Category, cid):
            raise ValidationError({"category_id": ["Category does not exist."]})


class PostUpdateSchema(ma.Schema):
    title = fields.Str(validate=Length(min=1, max=200))
    body = fields.Str(validate=Length(min=1))
    category_id = fields.Int(allow_none=True, validate=Range(min=1))

    @validates_schema
    def at_least_one(self, data, **kwargs):
        if not data:
            raise ValidationError({"_schema": ["At least one field is required."]})

    @validates_schema
    def category_exists(self, data, **kwargs):
        if "category_id" not in data:
            return
        cid = data.get("category_id")
        if cid is None:
            return
        if not db.session.get(Category, cid):
            raise ValidationError({"category_id": ["Category does not exist."]})


class CommentCreateSchema(ma.Schema):
    body = fields.Str(required=True, validate=Length(min=1, max=5000))


class CommentDumpSchema(ma.Schema):
    id = fields.Int()
    body = fields.Str()
    post_id = fields.Int()
    author = fields.Nested(UserPublicSchema(only=("id", "username")))
    created_at = fields.DateTime()


class PostDumpSchema(ma.Schema):
    id = fields.Int()
    title = fields.Str()
    body = fields.Str()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    author = fields.Nested(UserPublicSchema(only=("id", "username")))
    category = fields.Nested(CategoryDumpSchema, allow_none=True)


class PaginatedPostsSchema(ma.Schema):
    items = fields.Nested(PostDumpSchema, many=True)
    page = fields.Int()
    per_page = fields.Int()
    total = fields.Int()
    pages = fields.Int()
