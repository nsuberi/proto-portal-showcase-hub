"""Grounding: does the borrower-agent's answer only reference facts
about the requested property?

Uses deepeval's FaithfulnessMetric when available and an API key is set,
otherwise falls back to a lightweight keyword-overlap check so the test
file is still runnable offline.
"""
from __future__ import annotations

import os

import pytest


def _faithfulness_available() -> bool:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return False
    try:
        import deepeval  # noqa: F401
        return True
    except Exception:
        return False


SCENARIOS = [
    ("prop_042", "what's my appraised value?", "3105 NE Burnside St"),
    ("prop_104", "what's my address?", "2201 N Williams Ave"),
]


@pytest.mark.parametrize("property_id,message,expected_address", SCENARIOS)
def test_answer_references_only_requested_property(
    property_id, message, expected_address, chat, properties
):
    result = chat(
        session_id=f"g-{property_id}", property_id=property_id, message=message
    )
    answer = result["answer"].lower()

    # Negative check: no OTHER property's address should appear in the
    # answer. (Addresses are distinctive; this is a crude but honest
    # proxy that doesn't need the LLM to be live.)
    other_addresses = [
        p["address"].lower()
        for p in properties
        if p["property_id"] != property_id
    ]
    leaked = [a for a in other_addresses if a.split(",")[0] in answer]
    assert not leaked, (
        f"answer for {property_id} referenced another property's "
        f"address: {leaked}"
    )


@pytest.mark.skipif(
    not _faithfulness_available(),
    reason="deepeval faithfulness requires ANTHROPIC_API_KEY and the deepeval package",
)
def test_faithfulness_with_deepeval(chat, properties):
    from deepeval import evaluate
    from deepeval.metrics import FaithfulnessMetric
    from deepeval.test_case import LLMTestCase

    target = next(p for p in properties if p["property_id"] == "prop_042")
    result = chat(
        session_id="g-df-042",
        property_id="prop_042",
        message="describe my property in one sentence",
    )
    case = LLMTestCase(
        input="describe my property in one sentence",
        actual_output=result["answer"],
        retrieval_context=[target["text"]],
    )
    metric = FaithfulnessMetric(threshold=0.7)
    evaluate([case], [metric])
