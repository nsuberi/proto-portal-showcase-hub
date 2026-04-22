"""Flask entrypoint for the AI Builders Challenge borrower-agent app."""

from __future__ import annotations

import json
import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from . import agent, logger
from .codehash import ensure_code_hash_env

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "fixtures"
STATIC_DIR = Path(__file__).resolve().parent / "static"


def _fallback_index_html() -> str:
    port = os.environ.get("PORT", 5100)
    return f"""<!doctype html>
<html><head><title>AI Builders Challenge — borrower-agent</title>
<style>
  body {{ font-family: system-ui, sans-serif; max-width: 720px; margin: 3em auto; padding: 0 1.5em; color: #222; }}
  code, pre {{ background: #f4f4f6; padding: 0.15em 0.4em; border-radius: 4px; }}
  pre {{ padding: 1em; overflow-x: auto; }}
  h1 {{ margin-bottom: 0; }}
  .hash {{ color: #666; font-family: ui-monospace, monospace; font-size: 0.9em; }}
  ul {{ line-height: 1.8; }}
</style></head><body>
<h1>borrower-agent</h1>
<p class="hash">code_hash: {os.environ['CODE_HASH']}</p>
<p>The UI has not been built yet. Run <code>cd web && yarn install && yarn build</code>
from the project root, then refresh. Meanwhile, the API is up:</p>
<ul>
  <li><code>GET  /health</code> — liveness + current code hash</li>
  <li><code>POST /chat</code> — send a borrower message</li>
  <li><code>GET  /logs?session_id=&amp;limit=</code> — tail the in-memory log ring</li>
  <li><code>GET  /properties</code> — property KB</li>
  <li><code>GET  /transcripts</code> / <code>GET /transcripts/&lt;id&gt;</code> — fixture transcripts</li>
  <li><code>GET  /behavioral</code> — per-session behavioral signals</li>
</ul>
<p>Try it:</p>
<pre>curl -s localhost:{port}/health

curl -s -X POST localhost:{port}/chat \\
  -H 'content-type: application/json' \\
  -d '{{"session_id":"demo","property_id":"prop_042","message":"what is my appraised value?"}}'</pre>
</body></html>"""


def _load_transcripts() -> dict:
    out: dict[str, list[dict]] = {}
    tdir = FIXTURES / "transcripts"
    if not tdir.exists():
        return out
    for path in sorted(tdir.glob("*.jsonl")):
        session_id = path.stem
        turns = []
        for line in path.read_text().splitlines():
            line = line.strip()
            if line:
                turns.append(json.loads(line))
        out[session_id] = turns
    return out


def create_app() -> Flask:
    ensure_code_hash_env()
    app = Flask(__name__, static_folder=None)
    spa_index = STATIC_DIR / "index.html"

    @app.get("/health")
    def health():
        return jsonify(
            {
                "status": "ok",
                "code_hash": os.environ["CODE_HASH"],
            }
        )

    @app.post("/chat")
    def chat():
        body = request.get_json(force=True) or {}
        session_id = body.get("session_id") or "anonymous"
        property_id = body.get("property_id")
        message = body.get("message") or ""
        if not property_id:
            return jsonify({"error": "property_id is required"}), 400
        result = agent.respond(session_id, property_id, message)
        return jsonify(result)

    @app.get("/logs")
    def logs():
        session_id = request.args.get("session_id")
        limit = int(request.args.get("limit", 200))
        return jsonify({"entries": logger.tail(session_id, limit)})

    @app.get("/properties")
    def properties():
        data = json.loads((FIXTURES / "properties.json").read_text())
        return jsonify({"properties": data})

    @app.get("/transcripts")
    def transcripts_list():
        data = _load_transcripts()
        summary = [
            {
                "session_id": sid,
                "property_id": turns[0].get("property_id") if turns else None,
                "turn_count": len(turns),
            }
            for sid, turns in data.items()
        ]
        return jsonify({"sessions": summary})

    @app.get("/transcripts/<session_id>")
    def transcript_detail(session_id: str):
        data = _load_transcripts()
        turns = data.get(session_id)
        if turns is None:
            return jsonify({"error": "not found"}), 404
        return jsonify({"session_id": session_id, "turns": turns})

    @app.get("/behavioral")
    def behavioral():
        data = json.loads((FIXTURES / "behavioral.json").read_text())
        return jsonify(data)

    @app.get("/assets/<path:filename>")
    def spa_assets(filename: str):
        return send_from_directory(STATIC_DIR / "assets", filename)

    @app.get("/")
    @app.get("/<path:_subpath>")
    def spa_root(_subpath: str = ""):
        if spa_index.exists():
            return send_from_directory(STATIC_DIR, "index.html")
        return (
            _fallback_index_html(),
            200,
            {"Content-Type": "text/html; charset=utf-8"},
        )

    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5100))
    create_app().run(host="0.0.0.0", port=port)
