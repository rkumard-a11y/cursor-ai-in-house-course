from datetime import datetime, timezone

from sqlalchemy import Index
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    posts = db.relationship("Post", backref="author", lazy="dynamic", foreign_keys="Post.author_id")
    comments = db.relationship("Comment", backref="author", lazy="dynamic")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)

    posts = db.relationship("Post", backref="category", lazy="dynamic")


class Post(db.Model):
    __tablename__ = "posts"
    __table_args__ = (
        Index("ix_posts_created_at", "created_at"),
        Index("ix_posts_author_id_created_at", "author_id", "created_at"),
        Index("ix_posts_category_id", "category_id"),
    )

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    body = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )

    comments = db.relationship(
        "Comment", backref="post", lazy="dynamic", cascade="all, delete-orphan"
    )


class Comment(db.Model):
    __tablename__ = "comments"
    __table_args__ = (
        Index("ix_comments_post_id", "post_id"),
        Index("ix_comments_post_id_created_at", "post_id", "created_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
