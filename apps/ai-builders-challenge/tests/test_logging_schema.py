"""Teaches the log schema. Should pass immediately out of the box.

The Log Analyst skill depends on these fields being present and stable.
If you change the logger, keep this test honest.
"""
from __future__ import annotations


REQUIRED_TOP_LEVEL = {"ts", "level", "code_hash", "event"}


def test_retrieval_event_schema(chat, log_tail):
    chat(session_id="schema-1", property_id="prop_017", message="what is my address?")

    events = log_tail()
    assert events, "no log events captured"

    retrieval = [e for e in events if e["event"] == "retrieval"]
    assert retrieval, "expected a retrieval event"
    r = retrieval[-1]

    assert REQUIRED_TOP_LEVEL.issubset(r), f"missing fields in {r}"
    assert "property_id" in r
    assert "retrieved_ids" in r
    assert isinstance(r["retrieved_ids"], list)
    assert "top_score" in r
    assert "candidate_count" in r


def test_request_and_response_events_share_span_id(chat, log_tail):
    chat(session_id="schema-2", property_id="prop_033", message="hi")
    events = log_tail()

    req = [e for e in events if e["event"] == "request_received"][-1]
    resp = [e for e in events if e["event"] == "response_sent"][-1]
    assert req["span_id"] == resp["span_id"], (
        "request_received and response_sent must share a span_id"
    )


def test_code_hash_is_12_hex(chat, log_tail):
    chat(session_id="schema-3", property_id="prop_055", message="hi")
    events = log_tail()
    for e in events:
        h = e["code_hash"]
        assert len(h) == 12 or h == "no-hash"
        if h != "no-hash":
            int(h, 16)  # raises if not hex
