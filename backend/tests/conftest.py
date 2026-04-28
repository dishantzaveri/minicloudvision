import os
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app import create_app
from models import db


@pytest.fixture
def app():
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
        "SKIP_SEED": True,
    })

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()

    Path(db_path).unlink(missing_ok=True)


@pytest.fixture
def client(app):
    return app.test_client()
