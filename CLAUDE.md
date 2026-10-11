# CLAUDE.md: handoff for Claude Code

Project: **Visarjan Ghat Watch** (Claude Impact Lab Bhopal, Track 2, 11 Oct 2026). Submission deadline: **5:00 PM IST, 11 Oct 2026**, public GitHub repo + optional 2-minute recording.

The person working with you is a **beginner**. Explain in simple Hinglish (Hindi + English), one step at a time, and say exactly which command to run. Keep answers short.

## The one user and the one outcome
User: the BMC officer planning Durga visarjan (20 Oct 2026). Outcome: a ranked list of the 7 Bhopal ghats by risk, each number traceable to the MPPCB report page, plus a short Hindi + English brief the officer can forward. Do not build a portal. One workflow.

## How the repo works
- `python3 build.py` reads `data/bhopal_ghats_2023_2025.csv`, scores with `scoring.py`, writes words with `texts.py`, and injects everything into `src/template.html` to produce the self-contained `docs/index.html` plus `output/*`.
- `python3 -m unittest discover tests` must pass before every commit.
- Standard library only so far. Keep the base tool runnable with no installs and no API key.

## Hard rules (the jury checks these)
1. **Missing is never clean.** Blank, `not sampled`, `*`, `**` are excluded from scores and reported as gaps. `BDL` = very low, not zero, not missing.
2. **No health claims.** Compare readings with CPCB class B limits only.
3. **Every number traceable** to a report year and PDF page (`source_page`).
4. **Be honest about gaps** (no coliform data, units assumed, no Durga 2025 table for Bairagarh and Malikhedi, Rani Kamlapati may be two places, new BMC ghats have no data).
5. **No secrets in the repo.** API keys only from the `ANTHROPIC_API_KEY` environment variable. `.env` is git-ignored. Check `git diff --staged` before every push.
6. No scraping or logging in to any government portal. Public data in `data/` only.
7. Code submitted must be written on 11 Oct 2026 after 10:15 AM. Libraries are fine.

## Planned AI features (build in this order, each must be optional: tool works without a key)
1. **Ask Ghat Watch** (`ask.py` + small local server): the officer asks in Hindi or English ("कौन-से घाट पर पहले एयरेशन भेजें?"). Use the Anthropic Messages API with tool use. Tools query `data/*.csv` and return rows with `source_page`. The system prompt forbids health claims and requires: cite report year + page, say "not sampled" for blanks, answer in the language of the question. Model: `claude-sonnet-5-5` (cheaper: `claude-haiku-5-5`).
2. **Verified brief writer**: Claude polishes the Hindi/English brief, then code checks that every number in the output appears in the computed facts. If not, fall back to the template brief.
3. **PDF auditor agent** (`audit.py`): for each `source_page`, send that page of the original MPPCB PDF (from the participant pack) to Claude, extract the values, diff against the CSV, write `output/audit_report.md` with the match rate and every mismatch. This proves the numbers are right and is how future yearly reports (2026+) can be added without hand-typing.

Cost guard: cache results in `output/cache/`, set a spending limit on the API key in Console, never loop without a cap.

## Style
Readable code for a government department: short functions, plain names, comments that say why. Update README "What works and what doesn't" whenever a feature lands.
