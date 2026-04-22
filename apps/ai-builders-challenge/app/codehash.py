"""Deterministic code hash of the current working tree.

Used to stamp every log line and test run so a participant can correlate
deployed logs back to the exact code that produced them.
"""
from __future__ import annotations

import hashlib
import os
import subprocess


def _sh(cmd: str) -> str:
    return subprocess.check_output(
        cmd, shell=True, text=True, stderr=subprocess.DEVNULL
    )


def compute_code_hash(repo_root: str | None = None) -> str:
    cwd = repo_root or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    try:
        commit = _sh(f"git -C {cwd} rev-parse HEAD").strip()
        staged = _sh(f"git -C {cwd} diff --staged")
        unstaged = _sh(f"git -C {cwd} diff")
        changed_lines = sum(
            1
            for line in (staged + unstaged).splitlines()
            if line.startswith(("+", "-")) and not line.startswith(("+++", "---"))
        )
        payload = f"{commit}\n{staged}\n{unstaged}\n{changed_lines}"
    except Exception:
        payload = "no-git"
    return hashlib.sha256(payload.encode()).hexdigest()[:12]


def ensure_code_hash_env() -> str:
    if "CODE_HASH" not in os.environ:
        os.environ["CODE_HASH"] = compute_code_hash()
    return os.environ["CODE_HASH"]
