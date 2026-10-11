# Visarjan Ghat Watch

**Claude Impact Lab × Cerebras Café Compute, Bhopal, 11 October 2026 · Track 2**

**Live tool:** https://bitcrafterds.github.io/visarjan-ghat-watch/

| | |
|---|---|
| **Team**            | PromptPirates |
| **Members**         | Srishty Singh, Deepanshu Singh, Kartik Singh |
| **Track** | Track 2: Visarjan Ghat Watch |
| **The one user** | The Bhopal Municipal Corporation (BMC) officer who plans Durga visarjan at the ghats |
| **The one outcome** | Before 20 October 2026, the officer knows which ghats need extra cleaning, aeration and testing first, and can forward a short Hindi and English brief |

## What it does

Three years of MPPCB water tests at 7 Bhopal immersion ghats sit in PDFs nobody reads. This tool lines them up against the CPCB class B (outdoor bathing) limits and gives the officer:

1. **A ranked list of the 7 ghats by relative risk**, with the reason for each rank in plain words, in Hindi and English.
2. **A trace for every number**: charts and a table of every reading, each linked to its page in the MPPCB report.
3. **A short brief in Hindi and English** that can be copied or printed to PDF and forwarded.
4. **Honest gaps**: missing readings show as missing (never clean), and each ghat lists what the data does not cover.
5. 5. **One-tap WhatsApp share and CSV download** of the ranking, so the officer can forward it from a phone.

Headline from the data: DO was below 5 mg/l in 42 of 116 tests, BOD above 3 mg/l in 100 of 112 tests, and Bairagarh kund read 0 mg/l oxygen four times.

## Run it (3 steps)

1. Install Python 3.8 or newer (no other packages needed).
2. `python3 build.py` (rebuilds `docs/index.html` and the files in `output/`).
3. Open `docs/index.html` in any browser. It works offline. To host it, turn on GitHub Pages for the `docs/` folder.

Optional: `python3 -m unittest discover tests` runs the checks (headline numbers, "missing is never clean", ranking stability).

## What is in the repo

| Path | What |
|---|---|
| `docs/index.html` | The tool: one self-contained page, Hindi and English toggle |
| `output/ghat_risk_ranking.csv` | The ranking as a spreadsheet, with the rank in every view |
| `output/brief_en.txt`, `output/brief_hi.txt` | The forwardable brief as plain text |
| `scoring.py` | The scoring rules (standard library only) |
| `texts.py` | English and Hindi wording |
| `build.py`, `src/template.html` | Build script and page template |
| `data/` | The public Track 2 data used (see below) |
| `METHOD.md` | How the score works and what it cannot say |
| `tests/` | Unit tests |

## How the ranking works (short version)

Full detail is in [METHOD.md](METHOD.md) and in the tool's "Method and limits" tab.

- **Limit used:** CPCB class B (outdoor bathing): DO 5 mg/l or more, BOD 3 mg/l or less, pH 6.5 to 8.5.
- **Per reading:** 0 if within the limit, otherwise 0.3 to 1.0 depending on how far outside it is.
- **Per ghat:** weighted average of its readings times 100. In the default view 2025 counts 3x, 2024 counts 2x, 2023 counts 1x.
- **Missing readings** are left out of the average and reported as gaps. They are never counted as clean.
- **Stability:** the page offers three views (default, Durga only, 2025 only). The top ghat (Bairagarh kund) and the bottom ghat (Prempura) stay the same in all of them. The middle ghats swap places, and each card says by how much.

## What works and what does not

**Works**
- Ranking, reasons, charts, readings table with report page links, Hindi and English brief, three ranking views.
- Runs offline from a single HTML file. No API keys, no network calls, no personal data.

**Does not work or is not covered (honestly)**
- **Total coliform is not in the data**, although class B has a limit for it. It is not scored.
- **Metals** (chromium, lead, zinc, copper) are shown for context only, because class B sets no limit for them.
- **Units are assumed.** The MPPCB reports print none. We use the standard unit for each test.
- **Bairagarh kund and Malikhedi kund** have no Durga 2025 table, and their Ganesh 2025 tests cover only the during-immersion stage. Their scores rest on fewer readings (confidence badge: Medium).
- **"Rani Kamlapati ghat / Kamla Park kund"** may be two places. The tool says so and suggests confirming with MPPCB.
- **New BMC ghats** (after the NGT ban on immersion in the Upper and Lower Lakes) have no readings, so they cannot be ranked. Which ghats are used on 20 October is for BMC to confirm.
- The score is a **relative ranking**, not a safe or unsafe verdict. It claims **no health effects**.
- The 0.3 severity floor and the priority cut-offs (40 and 25) are our judgement calls, stated openly in METHOD.md.
- The Hindi wording and the Hindi spellings of ghat names should be read once by a Hindi speaker before the brief is forwarded.

## Data used

All data is public and comes from the Bhopal Impact Lab 2026 participant pack. No extra data was added.

- `data/bhopal_ghats_2023_2025.csv`: 1,524 readings at 7 Bhopal ghats, 2023 to 2025 (compiled from the MPPCB reports, with the report page for each reading)
- `data/cpcb_water_quality_criteria.csv`: CPCB water-quality limits, classes A to E
- `data/DATA_DICTIONARY.md`: what every column means

Sources:
- MPPCB Idol Immersion Report 2023: https://www.mppcb.mp.gov.in/proc/mon/Idol_immer._Report_23_CPCB.pdf
- MPPCB Ganesh and Durga Visarjan Report 2024: https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2024.pdf
- MPPCB Ganesh and Durga Visarjan Report 2025: https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2025.pdf
- CPCB water quality criteria: https://cpcb.gov.in/water-quality-criteria/
- Participant pack: https://github.com/Laaaaksh/bhopal-impact-lab-2026

## Rules of the day

Code was written on 11 October 2026 during the event, with Claude. The repo contains no secrets. It does not connect to any government system. Licence: MIT (see `LICENSE`).
