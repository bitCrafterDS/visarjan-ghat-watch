# CLAUDE.md: handoff for Claude Code

Project: **GhatWise (Visarjan Ghat Watch)** (Claude Impact Lab Bhopal, Track 2, 11 Oct 2026). Submission deadline: **5:00 PM IST, 11 Oct 2026**, public GitHub repo + optional 2-minute recording.

The person working with you is a **beginner**. Explain in simple Hinglish (Hindi + English), one step at a time, and say exactly which command to run. Keep answers short.

## The one user and the one outcome
Primary user: the BMC officer planning ghat arrangements for visarjans (next: Durga Visarjan, 20 Oct 2026). Also useful to the public (plain-language tab). Outcome: a ranked list of the 7 Bhopal ghats by risk, each number traceable to the MPPCB report page, plus a short Hindi + English brief the officer can forward. Do not build a portal. One workflow.

## How the repo works
- `python3 build.py` reads `data/bhopal_ghats_2023_2025.csv`, scores with `scoring.py`, writes words with `texts.py`, and injects everything into `src/template.html` to produce the self-contained `docs/index.html` plus `output/*`.
- `python3 -m unittest discover tests` must pass before every commit.
- Standard library only. Keep the tool runnable with no installs and no API key.

## Hard rules (the jury checks these)
1. **Missing is never clean.** Blank, `not sampled`, `*`, `**` are excluded from scores and reported as gaps. `BDL` = very low, not zero, not missing.
2. **No health claims.** Compare readings with CPCB class B limits only.
3. **Every number traceable** to a report year and PDF page (`source_page`).
4. **Be honest about gaps** (no coliform data, units assumed, no Durga 2025 table for Bairagarh and Malikhedi, Rani Kamlapati may be two places, new BMC ghats have no data).
5. **No secrets in the repo.** Check `git diff --staged` before every push.
6. No scraping or logging in to any government portal. Public data in `data/` only.
7. Code submitted must be written on 11 Oct 2026 after 10:15 AM. Libraries are fine.

## Front page data
Upcoming visarjans and ghat updates are in `docs/updates.json` (editable on GitHub, loaded by the page at run time and also embedded at build time). Visarjan dates are from Drik Panchang; they can differ by place, so the page tells people to confirm with BMC notices. No API / AI layer: the team decided to skip it. Do not add one unless asked.

Possible next step if time allows: verify the CSV numbers against the original PDFs offline (pdftotext) and add the match rate to the README.

## Style
Readable code for a government department: short functions, plain names, comments that say why. Update README "What works and what doesn't" whenever a feature lands.
