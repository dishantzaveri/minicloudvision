import os
from flask import Flask
from flask_cors import CORS
from models import db
from routes.devices import devices_bp
from routes.links import links_bp
from routes.stats import stats_bp


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "sqlite:///netwatch.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = False
    app.config["SKIP_SEED"] = False

    if test_config:
        app.config.update(test_config)

    CORS(app)

    db.init_app(app)

    app.register_blueprint(devices_bp, url_prefix="/api")
    app.register_blueprint(links_bp, url_prefix="/api")
    app.register_blueprint(stats_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()
        if not app.config["SKIP_SEED"]:
            _seed_if_empty()

    return app


def _seed_if_empty() -> None:
    from models import Device
    if Device.query.count() == 0:
        from seed_data import seed
        seed(db)


app = create_app()

if __name__ == "__main__":
    app.run(
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
    )