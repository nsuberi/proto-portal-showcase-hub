"""Shared fixtures for the AI Builders Challenge test suite."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from app import logger as app_logger  # noqa: E402
from app.codehash import ensure_code_hash_env  # noqa: E402
from app.server import create_app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _stamp_code_hash():
    ensure_code_hash_env()
    yield


@pytest.fixture()
def flask_app():
    return create_app()


@pytest.fixture()
def client(flask_app):
    return flask_app.test_client()


@pytest.fixture()
def chat(client):
    """Convenience: post to /chat and return parsed JSON."""

    def _call(session_id: str, property_id: str, message: str) -> dict:
        resp = client.post(
            "/chat",
            data=json.dumps(
                {
                    "session_id": session_id,
                    "property_id": property_id,
                    "message": message,
                }
            ),
            content_type="application/json",
        )
        assert resp.status_code == 200, resp.data
        return resp.get_json()

    return _call


@pytest.fixture()
def log_tail():
    """Returns a callable that reads the in-memory ring after a cutoff."""

    cutoff = len(app_logger.tail(limit=10_000))

    def _since() -> list[dict]:
        return app_logger.tail(limit=10_000)[cutoff:]

    return _since


@pytest.fixture(scope="session")
def properties() -> list[dict]:
    path = ROOT / "fixtures" / "properties.json"
    return json.loads(path.read_text())


@pytest.fixture(scope="session")
def behavioral() -> dict:
    path = ROOT / "fixtures" / "behavioral.json"
    return json.loads(path.read_text())
