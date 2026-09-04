"""Starting point for a new tool. Copy, rename, replace the body.

One tool does one job. Keep decisions (what to call, in what order, what to do
when it fails) in the workflow and the agent, not in here.

    uv run tools/_template.py --name world
"""

from __future__ import annotations

import argparse

from _common import emit, log


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", required=True, help="who to greet")
    args = parser.parse_args()

    log(f"greeting {args.name}")

    # Real work goes here. On a failed operation call fail("what went wrong").
    # For anything bulky, write to tmp_path("result.json") and emit the path.
    emit(greeting=f"hello {args.name}")


if __name__ == "__main__":
    main()
