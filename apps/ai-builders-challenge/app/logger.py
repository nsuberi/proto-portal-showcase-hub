"""JSONL stdout logger with code_hash stamping.

Every event is written as a single JSON object per line to stdout so the
deployment platform captures it without extra tooling. Tests also read
from stdout (or the in-memory ring buffer) to assert on log structure.
"""

from __future__ import annotations

import collections
import contextvars
import datetime as dt
import json
import os
import sys
import uuid
from typing import Any, Deque

RING_SIZE = 2000
_ring: Deque[dict] = collections.deque(maxlen=RING_SIZE)

_current_session_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "log_session_id", default=None
)
_current_span_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "log_span_id", default=None
)


def _now_iso() -> str:
    return (
        dt.datetime.now(dt.timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def new_span_id() -> str:
    return f"s-{uuid.uuid4().hex[:8]}"


def bind_context(session_id: str | None, span_id: str | None) -> None:
    """Bind session and span ids for the current request so subsequent events
    emitted anywhere downstream inherit them without explicit plumbing."""
    _current_session_id.set(session_id)
    _current_span_id.set(span_id)


def clear_context() -> None:
    _current_session_id.set(None)
    _current_span_id.set(None)


def event(name: str, level: str = "INFO", **fields: Any) -> dict:
    record = {
        "ts": _now_iso(),
        "level": level,
        "code_hash": os.environ.get("CODE_HASH", "no-hash"),
        "event": name,
    }
    sid = _current_session_id.get()
    if sid is not None and "session_id" not in fields:
        record["session_id"] = sid
    spn = _current_span_id.get()
    if spn is not None and "span_id" not in fields:
        record["span_id"] = spn
    record.update(fields)
    line = json.dumps(record, default=str)
    print(line, flush=True, file=sys.stdout)
    _ring.append(record)
    return record


def info(name: str, **fields: Any) -> dict:
    return event(name, "INFO", **fields)


def error(name: str, **fields: Any) -> dict:
    return event(name, "ERROR", **fields)


def tail(session_id: str | None = None, limit: int = 100) -> list[dict]:
    items = list(_ring)
    if session_id:
        items = [r for r in items if r.get("session_id") == session_id]
    return items[-limit:]
