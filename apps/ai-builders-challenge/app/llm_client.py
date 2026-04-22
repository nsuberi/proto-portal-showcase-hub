"""LLM client.

Two modes, selected by env vars at call time:
  - If ANTHROPIC_API_KEY is set: call the Anthropic API directly.
  - Else if LLM_PROXY_URL is set: POST to the shared/api proxy
    (see shared/api/src/routes/ai-analysis.js for the contract).
  - Else: return a stubbed response so the challenge remains runnable
    without any API key (useful for first-run exploration).

Keeping this thin by design; participants may harden it as part of the
"agentic-harness-configurer" skill.
"""
from __future__ import annotations

import json
import os
import time
from typing import Any

from . import logger


def _stub(system: str, user: str) -> str:
    return (
        "I'm currently running without an LLM key, so I can only echo what I "
        "retrieved. Please set ANTHROPIC_API_KEY or LLM_PROXY_URL to get a "
        "real response.\n\nRetrieved context follows:\n" + user[-1500:]
    )


def _anthropic(system: str, user: str, model: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    msg = client.messages.create(
        model=model,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    parts = [b.text for b in msg.content if getattr(b, "type", None) == "text"]
    return "".join(parts).strip()


def _proxy(system: str, user: str, url: str) -> str:
    import requests

    resp = requests.post(
        url,
        json={"system": system, "user": user},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("text") or data.get("content") or json.dumps(data)


def complete(system: str, user: str, model: str = "claude-sonnet-4-6") -> str:
    start = time.time()
    try:
        if os.environ.get("ANTHROPIC_API_KEY"):
            text = _anthropic(system, user, model)
            mode = "anthropic"
        elif os.environ.get("LLM_PROXY_URL"):
            text = _proxy(system, user, os.environ["LLM_PROXY_URL"])
            mode = "proxy"
        else:
            text = _stub(system, user)
            mode = "stub"
    except Exception as e:
        logger.error("llm_call", mode="error", error=str(e))
        raise

    logger.info(
        "llm_call",
        mode=mode,
        model=model,
        latency_ms=int((time.time() - start) * 1000),
        output_chars=len(text),
    )
    return text
