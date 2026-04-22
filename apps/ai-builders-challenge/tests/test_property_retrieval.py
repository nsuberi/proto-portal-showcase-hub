"""Does the borrower-agent stay within the property the user asked about?

Read the transcripts in fixtures/transcripts/ and the seed logs in
fixtures/seed_logs/ before trying to fix anything. Then look at
app/retrieval.py and compare what it is doing with what the prompts
in app/prompts/ imply it should be doing.
"""
from __future__ import annotations

import pytest

# Three borrower_id / question pairs. Each should retrieve ONLY data
# about that property — never some other property that happens to score
# well on TF-IDF similarity.
SCENARIOS = [
    ("prop_042", "what is my appraised value?"),
    ("prop_104", "tell me about my comps"),
    ("prop_078", "when was my home built?"),
]


@pytest.mark.parametrize("property_id,message", SCENARIOS)
def test_retrieval_stays_within_requested_property(
    property_id: str, message: str, chat, log_tail
):
    chat(session_id=f"t-{property_id}", property_id=property_id, message=message)

    retrieval_events = [e for e in log_tail() if e["event"] == "retrieval"]
    assert retrieval_events, "no retrieval event was logged"

    last = retrieval_events[-1]
    # Hint: the borrower asked about one specific property_id. What did
    # the retrieval layer actually pull? Read app/retrieval.py.
    assert last["retrieved_ids"] == [property_id], (
        f"retrieval returned {last['retrieved_ids']} "
        f"when the borrower asked about {property_id}"
    )
