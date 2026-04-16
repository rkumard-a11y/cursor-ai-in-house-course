from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_marshmallow import Marshmallow
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
ma = Marshmallow()
jwt = JWTManager()


def _limit_key():
    try:
        from flask_jwt_extended import get_jwt_identity

        ident = get_jwt_identity()
        if ident:
            return f"jwt:{ident}"
    except RuntimeError:
        pass
    return get_remote_address()


limiter = Limiter(key_func=_limit_key)
