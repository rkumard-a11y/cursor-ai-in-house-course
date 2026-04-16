import redis
from flask import Flask
from flasgger import Swagger

from app.config import Config
from app.extensions import db, jwt, ma
from app.models import Category


def _seed_categories():
    if Category.query.count() > 0:
        return
    defaults = [
        ("General", "general"),
        ("Technology", "technology"),
        ("Lifestyle", "lifestyle"),
    ]
    for name, slug in defaults:
        db.session.add(Category(name=name, slug=slug))
    db.session.commit()


def _init_redis(app):
    if app.config.get("CACHE_DISABLED"):
        app.extensions["redis"] = None
        return
    if app.config.get("TESTING"):
        import fakeredis

        app.extensions["redis"] = fakeredis.FakeStrictRedis(decode_responses=True)
        return
    url = app.config.get("REDIS_URL")
    if not url:
        app.extensions["redis"] = None
        return
    try:
        client = redis.Redis.from_url(url, decode_responses=True)
        client.ping()
        app.extensions["redis"] = client
    except redis.exceptions.RedisError:
        app.logger.warning("Redis is unreachable; post caching is disabled.")
        app.extensions["redis"] = None


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    _init_redis(app)

    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "Blog Platform API",
            "description": "REST API for Module 7 blogging exercise: JWT auth, posts, comments, categories, search.",
            "version": "1.0.0",
        },
        "basePath": "/",
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT access token. Format: `Bearer <token>`",
            }
        },
    }
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": "apispec",
                "route": "/apispec.json",
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/",
    }
    Swagger(app, template=swagger_template, config=swagger_config)

    from app.errors import register_error_handlers

    register_error_handlers(app)

    from app.api.auth import bp as auth_bp
    from app.api.categories import bp as categories_bp
    from app.api.comments import bp as comments_bp
    from app.api.posts import bp as posts_bp
    from app.api.search import bp as search_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(posts_bp, url_prefix="/api/posts")
    app.register_blueprint(comments_bp, url_prefix="/api/posts")
    app.register_blueprint(categories_bp, url_prefix="/api/categories")
    app.register_blueprint(search_bp, url_prefix="/api/search")

    with app.app_context():
        db.create_all()
        _seed_categories()

    if app.config.get("TESTING"):
        from app.testing_support import register_testing_routes

        register_testing_routes(app)

    return app
