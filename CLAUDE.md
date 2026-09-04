# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## The WAT architecture

This repo is a **WAT framework** — Workflows, Agents, Tools. Probabilistic AI handles reasoning,
deterministic code handles execution. That separation is what makes the system reliable: when the
model performs every step itself, per-step error compounds fast.

**Workflows** (`workflows/*.md`) are markdown SOPs — objective, required inputs, which tools to use,
expected output, known edge cases. Plain language, the way you'd brief a teammate.

**Agents** — your role. Read the relevant workflow, run tools in the right sequence, recover from
failures, ask when the workflow is ambiguous. You connect intent to execution instead of performing
the execution yourself. To pull data from a site you don't scrape it directly: read
`workflows/scrape_website.md`, gather the inputs it names, then run `tools/scrape_single_site.py`.

**Tools** (`tools/*.py`) do the actual work — API calls, transforms, file and database operations.
Consistent, testable, fast.

Names pair the layers: `workflows/scrape_website.md` drives `tools/scrape_single_site.py`. Keep new
files on that pattern.

## Rules

- **Check `tools/` before writing anything new.** Only create a script when nothing there covers it.
- **Never create or overwrite a workflow without asking**, unless explicitly told to. Workflows are
  accumulated instructions, not scratch files — they get refined, not replaced.
- **Ask before re-running a tool that spends money or credits.** List those tools here as they're
  added; there are none yet.
- **Secrets live in `.env` and nowhere else** — not inline, not in `.tmp/` output, not in a workflow.
  Every key a tool needs must appear (name only) in `.env.example`.
- **Deliverables go to cloud services** (Google Sheets, Slides, …) where the user can reach them
  directly. Local files are processing artifacts; everything in `.tmp/` is disposable.

## Commands

`uv` owns the environment. Bare `python` on this machine resolves to an unrelated venv
(`hermes-agent`), so always go through `uv run` — never call `python` or `pip` directly.

```powershell
uv sync                                    # create/refresh .venv from pyproject.toml
uv run tools/<name>.py --flag value        # run a tool
uv run pytest                              # all tests
uv run pytest tests/test_template.py::test_bad_arguments_exit_2   # one test
uv run ruff check .                        # lint
uv run ruff format .                       # format
uv add <package>                           # add a runtime dependency
uv add --dev <package>                     # add a dev dependency
```

Windows, PowerShell, Python 3.11. Note PowerShell 5.1 has no `&&` — chain with `;` or `if ($?) {}` —
and don't pipe a native command's stderr through `2>&1`, which turns clean exits into errors.

## Tool contract

Every tool has the same shape so the agent layer can call any of them the same way.
`tools/_template.py` is the starting point, `tools/_common.py` holds the shared helpers, and
`tests/test_template.py` pins the contract down.

- **Invocation:** standalone script, named argparse flags — `uv run tools/<name>.py --flag value`.
- **stdout is one JSON object and nothing else.** Success `{"ok": true, ...}` via `emit(...)`,
  failure `{"ok": false, "error": "..."}` via `fail(...)`.
- **stderr carries progress and diagnostics**, via `log(...)`. Never print to stdout directly.
- **Exit codes:** `0` succeeded; `1` the tool ran but the operation failed, and `error` says how;
  `2` bad arguments, meaning you called it wrong (argparse).
- **Bulk data goes to `.tmp/`**, not stdout — write to `tmp_path("name.json")` and return the path
  in the JSON result.
- **Config comes from `require_env("KEY")`**, which exits 1 with an actionable message when the key
  is missing. Don't read `os.environ` directly.

Tools import siblings by bare name (`from _common import emit`) because Python puts the script's own
directory on `sys.path`; `tests/conftest.py` reproduces that for tests.

## When a tool fails

1. Read the full error and trace.
2. Fix the script and retest — but if the tool spends credits, check before re-running.
3. Verify the fix.
4. Record what you learned in the workflow: rate limits, timing quirks, undocumented behavior. The
   next run shouldn't have to rediscover it.

Example: an API rate-limits you, you find a batch endpoint in its docs, refactor the tool to use it,
verify, then note both the limit and the batch approach in the workflow.

## Files

```
workflows/   Markdown SOPs. _template.md is the skeleton.
tools/       Python scripts. _common.py = shared helpers, _template.py = starting point.
tests/       pytest. conftest.py puts tools/ on sys.path.
.tmp/        Intermediates. Disposable and regenerable.
.env         Secrets (gitignored). .env.example lists the required key names.
```

Google OAuth, once tools need it, uses `credentials.json` (the OAuth client from Google Cloud
Console) and `token.json` (the cached user token, written on first successful auth). Both are
gitignored. If `token.json` expires or the requested scopes change, delete it and re-run the tool to
trigger consent again — record each tool's scopes here as they're added.
