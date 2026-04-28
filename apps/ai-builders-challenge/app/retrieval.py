"""Property appraisal retrieval.

NOTE TO READERS (intentionally left for participants to discover):
This module retrieves appraisal info from the knowledge base. It is
supposed to return data about a SPECIFIC property_id. Read the code
carefully — compare intent vs. actual behavior.
"""
from __future__ import annotations

from . import logger
from .kb import Property, cosine, embed, load_kb


def retrieve_appraisal(query: str, property_id: str) -> Property:
    kb = load_kb()
    qv = embed(query)

    scored = [(cosine(qv, embed(p.text)), p) for p in kb]
    scored.sort(key=lambda s: s[0], reverse=True)
    top_score, best = scored[0]

    logger.info(
        "retrieval",
        query=query,
        property_id=property_id,
        retrieved_ids=[best.property_id],
        top_score=round(top_score, 4),
        candidate_count=len(kb),
    )
    return best
