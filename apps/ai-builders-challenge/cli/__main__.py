"""AI Builders Challenge CLI.

Usage:
  python -m cli init      # set up .env, copy skills into project, sanity-check
  python -m cli export    # package the challenge as a distributable tarball
  python -m cli hash      # print the current code hash for log correlation
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import shutil
import sys
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _cmd_init(args) -> int:
    dest_root = Path(args.dest or os.getcwd()).resolve()
    print(f"Initializing AI Builders Challenge in {dest_root}")

    env_src = ROOT / ".env.example"
    env_dst = dest_root / ".env"
    if env_dst.exists():
        print(f"  .env already exists at {env_dst}, skipping")
    else:
        shutil.copy(env_src, env_dst)
        print(f"  wrote {env_dst}")

    skills_src = ROOT / ".claude" / "skills"
    skills_dst = dest_root / ".claude" / "skills"
    skills_dst.parent.mkdir(parents=True, exist_ok=True)
    if skills_dst.exists():
        print(f"  .claude/skills already exists at {skills_dst}, leaving it alone")
    else:
        shutil.copytree(skills_src, skills_dst)
        print(f"  copied skills -> {skills_dst}")

    print()
    print("Next steps:")
    print("  1. python -m venv .venv && source .venv/bin/activate")
    print("  2. pip install -r tests/requirements.txt")
    print("  3. ./scripts/run_local.sh   # boots Flask on port 5100")
    print("  4. pytest tests/ -v         # starter tests (some will fail — read them)")
    return 0


def _cmd_export(args) -> int:
    stamp = dt.date.today().isoformat()
    out = Path(args.out or f"ai-builders-challenge-{stamp}.tar.gz").resolve()

    exclude_dirs = {"__pycache__", ".venv", "node_modules", ".pytest_cache", ".mypy_cache"}
    if not args.include_seed_logs:
        exclude_dirs.add("seed_logs")

    def _filter(tarinfo: tarfile.TarInfo):
        parts = Path(tarinfo.name).parts
        if any(p in exclude_dirs for p in parts):
            return None
        return tarinfo

    with tarfile.open(out, "w:gz") as tar:
        tar.add(ROOT, arcname="ai-builders-challenge", filter=_filter)

    print(f"wrote {out}")
    print(f"  size: {out.stat().st_size // 1024} KB")
    return 0


def _cmd_hash(args) -> int:
    sys.path.insert(0, str(ROOT))
    from app.codehash import compute_code_hash

    print(compute_code_hash(str(ROOT)))
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="cli")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init", help="set up a fresh workspace")
    p_init.add_argument("--dest", help="target directory (default: cwd)")
    p_init.set_defaults(func=_cmd_init)

    p_export = sub.add_parser("export", help="bundle the challenge as a tarball")
    p_export.add_argument("--out", help="output tarball path")
    p_export.add_argument(
        "--include-seed-logs",
        action="store_true",
        help="include fixtures/seed_logs/ in the bundle",
    )
    p_export.set_defaults(func=_cmd_export)

    p_hash = sub.add_parser("hash", help="print the current CODE_HASH")
    p_hash.set_defaults(func=_cmd_hash)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
