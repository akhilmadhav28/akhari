"""Shared helpers for WAT tools. Import these instead of re-implementing them.

Together they enforce the tool contract documented in CLAUDE.md: one JSON
object on stdout, diagnostics on stderr, config from .env, bulk data in .tmp/.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import NoReturn

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
TMP = ROOT / ".tmp"

load_dotenv(ROOT / ".env")


def require_env(name: str) -> str:
    """Return an env var, or exit 1 with a message that says how to fix it."""
    value = os.environ.get(name)
    if not value:
        fail(f"missing required environment variable: {name} (add it to .env)")
    return value


def tmp_path(name: str) -> Path:
    """Path for an intermediate file. Everything under .tmp/ is disposable."""
    TMP.mkdir(exist_ok=True)
    return TMP / name


def emit(**fields) -> NoReturn:
    """Report success: one JSON object on stdout, exit 0."""
    json.dump({"ok": True, **fields}, sys.stdout)
    sys.stdout.write("\n")
    sys.exit(0)


def fail(message: str, **fields) -> NoReturn:
    """Report a failed operation: JSON on stdout, exit 1.

    Exit 1 means the tool ran correctly but the work did not succeed, so the
    caller can read `error` and decide what to do. Bad arguments exit 2 via
    argparse instead.
    """
    json.dump({"ok": False, "error": message, **fields}, sys.stdout)
    sys.stdout.write("\n")
    sys.exit(1)


def log(message: str) -> None:
    """Progress and diagnostics. Goes to stderr so stdout stays parseable."""
    print(message, file=sys.stderr)
