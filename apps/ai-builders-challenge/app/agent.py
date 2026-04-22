"""Borrower-facing agent orchestration.

Flow: request_received -> retrieval -> llm_call -> response_sent.
Each step emits a structured log event so the Log Analyst skill can
reason about what happened.
"""

from __future__ import annotations

from pathlib import Path

from . import logger
from .llm_client import complete
from .retrieval import retrieve_appraisal

PROMPTS_DIR = Path(__file__).parent / "prompts"


def _read(name: str) -> str:
    return (PROMPTS_DIR / name).read_text()


def respond(session_id: str, property_id: str, message: str) -> dict:
    span_id = logger.new_span_id()
    logger.bind_context(session_id=session_id, span_id=span_id)
    logger.info(
        "request_received",
        property_id=property_id,
        message_chars=len(message),
    )

    property_ = retrieve_appraisal(message, property_id)

    system = _read("borrower_system.md")
    grounding = _read("borrower_grounding.md").format(
        property_id=property_.property_id,
        address=property_.address,
        appraised_value=property_.appraised_value,
        year_built=property_.year_built,
        text=property_.text,
    )
    user = f"User asked: {message}\n\nRetrieved context:\n{grounding}"

    answer = complete(system=system, user=user)

    logger.info(
        "response_sent",
        property_id=property_id,
        answer_chars=len(answer),
    )
    logger.clear_context()
    return {
        "session_id": session_id,
        "span_id": span_id,
        "requested_property_id": property_id,
        "retrieved_property_id": property_.property_id,
        "answer": answer,
    }
