"""Flask entrypoint for the AI Builders Challenge borrower-agent app."""
from __future__ import annotations

import os

from flask import Flask, jsonify, request

from . import agent, logger
from .codehash import ensure_code_hash_env


def create_app() -> Flask:
    ensure_code_hash_env()
    app = Flask(__name__)

    @app.get("/")
    def index():
        return (
            f"""<!doctype html>
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
<p>The app is running. This server does not have a UI — it only serves these endpoints:</p>
<ul>
  <li><code>GET  /health</code> — liveness + current code hash</li>
  <li><code>POST /chat</code> — send a borrower message</li>
  <li><code>GET  /logs?session_id=&amp;limit=</code> — tail the in-memory log ring</li>
</ul>
<p>Try it:</p>
<pre>curl -s localhost:{os.environ.get('PORT', 5100)}/health

curl -s -X POST localhost:{os.environ.get('PORT', 5100)}/chat \\
  -H 'content-type: application/json' \\
  -d '{{"session_id":"demo","property_id":"prop_042","message":"what is my appraised value?"}}'</pre>
<p>Then read <code>fixtures/seed_logs/run_2026-04-15.jsonl</code> and compare to the logs this server just emitted to stdout.</p>
</body></html>""",
            200,
            {"Content-Type": "text/html; charset=utf-8"},
        )

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
        limit = int(request.args.get("limit", 100))
        return jsonify({"entries": logger.tail(session_id, limit)})

    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5100))
    create_app().run(host="0.0.0.0", port=port)
