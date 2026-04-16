import os

from flask import Flask
from flasgger import Swagger

from app.config import Config
from app.errors import register_error_handlers
from app.extensions import db, jwt, limiter, ma


def create_app(config_class=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)
    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)

    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "Customer Support Ticket API",
            "description": "Core ticket management per PRD (FR-001–FR-021, FR-035).",
            "version": "1.0.0",
        },
        "basePath": "/",
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT: Bearer <access_token>",
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

    register_error_handlers(app)

    from app.api.auth import bp as auth_bp
    from app.api.tickets import bp as tickets_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(tickets_bp, url_prefix="/api/tickets")

    with app.app_context():
        db.create_all()
        _seed_roles()

    return app


def _seed_roles():
    from app.extensions import db
    from app.models import AvailabilityStatus, User, UserRole
    from app.security import hash_password

    if User.query.count() > 0:
        return
    admin = User(
        name="Administrator",
        email="admin@example.com",
        role=UserRole.admin,
        availability_status=AvailabilityStatus.available,
        expertise_areas=[],
    )
    admin.password_hash = hash_password("AdminPassw0rd!")
    agent = User(
        name="Support Agent",
        email="agent@example.com",
        role=UserRole.agent,
        availability_status=AvailabilityStatus.available,
        expertise_areas=["technical", "general", "billing"],
    )
    agent.password_hash = hash_password("AgentPassw0rd!")
    db.session.add_all([admin, agent])
    db.session.commit()
