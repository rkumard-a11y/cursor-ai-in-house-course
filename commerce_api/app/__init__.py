from flask import Flask, jsonify

from app.config import Config
from app.errors import register_error_handlers
from app.extensions import db, jwt, limiter, ma


def create_app(config_class=None):
    if config_class is None:
        config_class = Config
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    if hasattr(limiter, "enabled"):
        limiter.enabled = bool(app.config.get("RATELIMIT_ENABLED", True))

    @jwt.unauthorized_loader
    def _unauth(_err):
        return (
            jsonify(
                {
                    "status": "error",
                    "code": "UNAUTHORIZED",
                    "message": "Missing or invalid Authorization bearer token.",
                }
            ),
            401,
        )

    @jwt.invalid_token_loader
    def _invalid(_err):
        return (
            jsonify(
                {
                    "status": "error",
                    "code": "INVALID_TOKEN",
                    "message": "Token is invalid or expired.",
                }
            ),
            401,
        )

    register_error_handlers(app)

    from app.api.auth import bp as auth_bp
    from app.api.health import bp as health_bp
    from app.api.orders import bp as orders_bp
    from app.api.products import bp as products_bp
    from app.api.users import bp as users_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(health_bp, url_prefix="/api/health")

    with app.app_context():
        db.create_all()
        _seed(app)

    return app


def _seed(app):
    from app.models import Product, User

    if User.query.filter_by(email="admin@commerce.test").first():
        return
    admin = User(email="admin@commerce.test", name="Admin", role="admin")
    admin.set_password("AdminPassw0rd!")
    db.session.add(admin)
    cust = User(email="customer@commerce.test", name="Cust", role="customer")
    cust.set_password("Customer12!")
    db.session.add(cust)
    db.session.flush()
    products = [
        Product(sku="SKU-DEMO-1", name="Demo Widget", price_cents=999, stock=50, active=True),
        Product(sku="SKU-DEMO-2", name="Demo Gadget", price_cents=2500, stock=10, active=True),
    ]
    for p in products:
        db.session.add(p)
    db.session.commit()
