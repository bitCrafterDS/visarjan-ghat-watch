"""Scoring logic for Visarjan Ghat Watch.

Pure Python (standard library only). Reads the MPPCB ghat readings, compares them with
CPCB class B (outdoor bathing) limits and produces a transparent, traceable risk score.

Every rule is explained in METHOD.md. Nothing here guesses a missing value:
a blank, "not sampled", "*" or "**" is MISSING. It is left out of the average and
reported as a gap. It is never counted as clean.
"""
import csv
from collections import OrderedDict, defaultdict

# --- CPCB class B (outdoor bathing) limits that exist in the data -----------------
SCORED = ("Dissolved oxygen", "BOD", "pH")
DO_MIN = 5.0          # mg/l, DO must be 5 or more
BOD_MAX = 3.0         # mg/l, BOD must be 3 or less
PH_MIN, PH_MAX = 6.5, 8.5
FLOOR = 0.3           # any breach of a limit scores at least 0.3 (judgement call, see METHOD.md)
BOD_SPAN = 9.0        # BOD of 12 mg/l (3 + 9) or more = maximum severity
PH_SPAN = 1.5         # pH 1.5 units outside the range = maximum severity

METALS = ("Chromium", "Lead", "Zinc", "Copper")

EVENTS = [("Ganesh", 2023), ("Durga", 2023), ("Ganesh", 2024),
          ("Durga", 2024), ("Ganesh", 2025), ("Durga", 2025)]
PHASES = ("pre", "during", "after")
EXPECTED = len(SCORED) * len(PHASES) * len(EVENTS)   # 54 scored readings per ghat if nothing is missing

# Priority thresholds on the 0-100 score (relative priority, not safe/unsafe)
P1_MIN = 40.0
P2_MIN = 25.0

BASES = OrderedDict([
    ("recency", {"weights": {2023: 1, 2024: 2, 2025: 3}, "festival": None, "years": None}),
    ("durga",   {"weights": {2023: 1, 2024: 2, 2025: 3}, "festival": "Durga", "years": None}),
    ("latest",  {"weights": {2023: 1, 2024: 1, 2025: 1}, "festival": None, "years": {2025}}),
    ("equal",   {"weights": {2023: 1, 2024: 1, 2025: 1}, "festival": None, "years": None}),
])
DEFAULT_BASIS = "recency"


def load_rows(path):
    """Read the readings CSV. value is a float, or None when missing."""
    rows = []
    with open(path, encoding="utf-8-sig", newline="") as fh:
        for r in csv.DictReader(fh):
            raw = (r.get("value") or "").strip()
            r["value"] = float(raw) if raw != "" else None
            r["year"] = int(r["year"])
            r["source_page"] = int(r["source_page"]) if (r.get("source_page") or "").strip() else None
            rows.append(r)
    return rows


def severity(param, value):
    """0 = within the class B limit. Otherwise 0.3 (just outside) up to 1.0 (far outside)."""
    if value is None:
        raise ValueError("severity() needs a number; missing values are never scored")
    if param == "Dissolved oxygen":
        if value >= DO_MIN:
            return 0.0
        return FLOOR + (1 - FLOOR) * (DO_MIN - value) / DO_MIN
    if param == "BOD":
        if value <= BOD_MAX:
            return 0.0
        return FLOOR + (1 - FLOOR) * min(1.0, (value - BOD_MAX) / BOD_SPAN)
    if param == "pH":
        if PH_MIN <= value <= PH_MAX:
            return 0.0
        dist = (PH_MIN - value) if value < PH_MIN else (value - PH_MAX)
        return FLOOR + (1 - FLOOR) * min(1.0, dist / PH_SPAN)
    raise ValueError("no class B limit for " + param)


def group_by_site(rows):
    sites = OrderedDict()
    for r in rows:
        sites.setdefault(r["site"], []).append(r)
    return sites


def score_site(site_rows, basis_name):
    """Weighted mean severity over the scored readings that exist for this basis."""
    b = BASES[basis_name]
    num = den = 0.0
    tested = failed = 0
    for r in site_rows:
        if r["parameter"] not in SCORED or r["value"] is None:
            continue
        if b["festival"] and r["festival"] != b["festival"]:
            continue
        if b["years"] and r["year"] not in b["years"]:
            continue
        w = b["weights"][r["year"]]
        s = severity(r["parameter"], r["value"])
        num += w * s
        den += w
        tested += 1
        failed += 1 if s > 0 else 0
    score = round(100.0 * num / den, 1) if den else None
    return {"score": score, "tested": tested, "failed": failed}


def priority(score):
    if score is None:
        return None
    return 1 if score >= P1_MIN else 2 if score >= P2_MIN else 3


def rank_sites(site_scores):
    """site_scores: {site: {'score':..,'tested':..}} -> {site: rank}. Higher score = rank 1."""
    order = sorted(site_scores, key=lambda s: (-(site_scores[s]["score"] if site_scores[s]["score"] is not None else -1),
                                               -site_scores[s]["tested"], s))
    return {s: i + 1 for i, s in enumerate(order)}


def _worst(rows, param, pick):
    cand = [r for r in rows if r["parameter"] == param and r["value"] is not None]
    if not cand:
        return None
    r = pick(cand, key=lambda x: x["value"])
    return {"value": r["value"], "festival": r["festival"], "year": r["year"],
            "phase": r["phase"], "page": r["source_page"]}


def site_metrics(site_rows):
    """Plain counts used for the reasons, gaps and brief. Independent of the weighting basis."""
    m = {}
    do = [r for r in site_rows if r["parameter"] == "Dissolved oxygen" and r["value"] is not None]
    bod = [r for r in site_rows if r["parameter"] == "BOD" and r["value"] is not None]
    ph = [r for r in site_rows if r["parameter"] == "pH" and r["value"] is not None]
    m["do_tested"], m["do_below"] = len(do), sum(1 for r in do if r["value"] < DO_MIN)
    m["do_zero"] = sum(1 for r in do if r["value"] == 0)
    m["bod_tested"], m["bod_above"] = len(bod), sum(1 for r in bod if r["value"] > BOD_MAX)
    m["ph_tested"], m["ph_out"] = len(ph), sum(1 for r in ph if not (PH_MIN <= r["value"] <= PH_MAX))
    m["worst_do"] = _worst(site_rows, "Dissolved oxygen", min)
    m["worst_bod"] = _worst(site_rows, "BOD", max)
    m["scored_tested"] = m["do_tested"] + m["bod_tested"] + m["ph_tested"]
    m["coverage"] = round(m["scored_tested"] / EXPECTED, 3)
    # metals: context only, no class B limit
    met = [r for r in site_rows if r["parameter"] in METALS]
    m["metals_total"] = len(met)
    m["metals_detected"] = sum(1 for r in met if r["value"] is not None)
    m["metals_bdl"] = sum(1 for r in met if (r.get("flag") or "") == "BDL")
    m["metals_not_sampled"] = sum(1 for r in met if (r.get("flag") or "") in ("not sampled", "*", "**"))
    m["medium_site_match"] = any(r.get("site_match_confidence") == "medium" for r in site_rows)
    return m


def confidence(m):
    c = m["coverage"]
    level = "High" if c >= 0.9 else "Medium" if c >= 0.6 else "Low"
    if m["medium_site_match"] and level == "High":
        level = "Medium"      # site name may cover two places
    return level


def site_gaps(site_rows):
    """What is missing for the scored parameters. Returns (missing_events, partial).

    missing_events: festival/year with no rows at all (no table in the report)
    partial: list of {festival, year, phases, params} where scored readings are blank
    """
    present = {(r["festival"], r["year"]) for r in site_rows}
    missing_events = [e for e in EVENTS if e not in present]
    by_key = defaultdict(lambda: defaultdict(list))   # (festival, year) -> phase -> params missing
    for r in site_rows:
        if r["parameter"] in SCORED and r["value"] is None:
            by_key[(r["festival"], r["year"])][r["phase"]].append(r["parameter"])
    merged = defaultdict(list)    # (festival, year, tuple(params)) -> phases
    for (fest, yr), phases in by_key.items():
        for ph in PHASES:
            if ph in phases:
                merged[(fest, yr, tuple(sorted(phases[ph], key=SCORED.index)))].append(ph)
    partial = [{"festival": f, "year": y, "params": list(p), "phases": phs}
               for (f, y, p), phs in sorted(merged.items(), key=lambda kv: (kv[0][1], kv[0][0]))]
    return missing_events, partial


def compact_readings(site_rows):
    """Scored readings only, small enough to embed in the web page. Keeps the report page for tracing."""
    out = []
    for r in site_rows:
        if r["parameter"] in SCORED:
            out.append({"y": r["year"], "f": r["festival"], "ph": r["phase"], "p": r["parameter"],
                        "v": r["value"], "flag": (r.get("flag") or ""), "pg": r["source_page"],
                        "bad": (r["value"] is not None and severity(r["parameter"], r["value"]) > 0)})
    return out


def headline(rows):
    do = [r for r in rows if r["parameter"] == "Dissolved oxygen" and r["value"] is not None]
    bod = [r for r in rows if r["parameter"] == "BOD" and r["value"] is not None]
    ph = [r for r in rows if r["parameter"] == "pH" and r["value"] is not None]
    return {
        "readings": len(rows),
        "ghats": len({r["site"] for r in rows}),
        "do_tested": len(do), "do_below": sum(1 for r in do if r["value"] < DO_MIN),
        "bod_tested": len(bod), "bod_above": sum(1 for r in bod if r["value"] > BOD_MAX),
        "ph_tested": len(ph), "ph_out": sum(1 for r in ph if not (PH_MIN <= r["value"] <= PH_MAX)),
    }
