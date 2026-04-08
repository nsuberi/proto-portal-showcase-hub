"""Shared test fixtures for Code Dojo tests."""

import pytest
import sys
import os

# Add the app root to the path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import app as flask_app
from models import db as _db


@pytest.fixture
def app():
    """Create application for testing."""
    flask_app.config["TESTING"] = True
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite://"  # In-memory DB
    flask_app.config["WTF_CSRF_ENABLED"] = False
    flask_app.config["LOGIN_DISABLED"] = False

    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def db(app):
    """Provide the database session."""
    return _db
