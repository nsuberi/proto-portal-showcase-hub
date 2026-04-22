"""In-memory property knowledge base loader.

Loads fixtures/properties.json once at startup. No database, no embedding
service — a deterministic TF-IDF vectorizer over the property text is all
the retrieval layer uses.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Iterable

from sklearn.feature_extraction.text import TfidfVectorizer

FIXTURES = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "fixtures",
    "properties.json",
)


@dataclass
class Property:
    property_id: str
    address: str
    text: str
    appraised_value: int
    year_built: int
    comps: list[dict]

    def to_dict(self) -> dict:
        return {
            "property_id": self.property_id,
            "address": self.address,
            "text": self.text,
            "appraised_value": self.appraised_value,
            "year_built": self.year_built,
            "comps": self.comps,
        }


@lru_cache(maxsize=1)
def load_kb() -> list[Property]:
    with open(FIXTURES, "r") as f:
        raw = json.load(f)
    return [Property(**p) for p in raw]


@lru_cache(maxsize=1)
def fitted_vectorizer() -> TfidfVectorizer:
    kb = load_kb()
    vec = TfidfVectorizer(lowercase=True, ngram_range=(1, 2))
    vec.fit([p.text for p in kb])
    return vec


def embed(text: str):
    vec = fitted_vectorizer()
    return vec.transform([text])


def cosine(a, b) -> float:
    import numpy as np
    num = float((a * b.T).toarray()[0, 0])
    denom = float(((a.multiply(a)).sum() ** 0.5) * ((b.multiply(b)).sum() ** 0.5))
    return 0.0 if denom == 0 else num / denom
