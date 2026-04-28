"""
app.py — Flask application factory + entry point.

Key patterns used here that interviewers love to discuss:
  1. Application Factory  — create_app() returns the app; makes testing easy.
  2. Blueprint registration — routes live in separate files, not one giant app.py.
  3. CORS — needed because the React dev server runs on :5173, Flask on :5000.
  4. Auto-seed — if the DB is empty on first run we populate it with sample data.
"""

from flask import Flask
from flask_cors import CORS
from models import db
from routes.devices import devices_bp
from routes.links import links_bp
from routes.stats import stats_bp


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)

    # Default app config
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///netwatch.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = False
    app.config["SKIP_SEED"] = False

    # Allow tests to override config cleanly
    if test_config:
        app.config.update(test_config)

    # Allow requests from any origin in development.
    CORS(app)

    db.init_app(app)

    # Register blueprints
    app.register_blueprint(devices_bp, url_prefix="/api")
    app.register_blueprint(links_bp,   url_prefix="/api")
    app.register_blueprint(stats_bp,   url_prefix="/api")

    with app.app_context():
        db.create_all()
        if not app.config["SKIP_SEED"]:
            _seed_if_empty()

    return app


def _seed_if_empty() -> None:
    """Run seed data only when the database is brand-new."""
    from models import Device
    if Device.query.count() == 0:
        from seed_data import seed
        seed(db)


# This creates the app at module level so `flask run` works out of the box
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
