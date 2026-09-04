"""Checks the tool contract itself, using _template.py as the specimen."""

import json
import subprocess
import sys
from pathlib import Path

TOOL = Path(__file__).resolve().parent.parent / "tools" / "_template.py"


def run_tool(*args):
    return subprocess.run(
        [sys.executable, str(TOOL), *args],
        capture_output=True,
        text=True,
        check=False,  # exit codes are what we're asserting on
    )


def test_stdout_is_a_single_json_object():
    proc = run_tool("--name", "world")
    assert proc.returncode == 0
    assert json.loads(proc.stdout) == {"ok": True, "greeting": "hello world"}


def test_diagnostics_go_to_stderr():
    proc = run_tool("--name", "world")
    assert "greeting world" in proc.stderr


def test_bad_arguments_exit_2():
    assert run_tool().returncode == 2
