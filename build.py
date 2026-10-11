#!/usr/bin/env python3
"""Build Visarjan Ghat Watch.

    python3 build.py

Reads  data/bhopal_ghats_2023_2025.csv
Writes docs/index.html            (self-contained page, opens offline, can be hosted on GitHub Pages)
       output/ghat_risk_ranking.csv
       output/brief_en.txt, output/brief_hi.txt
"""
import csv
import json
import os
from datetime import datetime, timezone

import scoring as S
import texts as T

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data", "bhopal_ghats_2023_2025.csv")
TEMPLATE = os.path.join(ROOT, "src", "template.html")
OUT_HTML = os.path.join(ROOT, "docs", "index.html")
OUT_DIR = os.path.join(ROOT, "output")

REPORTS = {
    2023: {"name": "MPPCB Idol Immersion Report 2023 (CPCB format)",
           "url": "https://www.mppcb.mp.gov.in/proc/mon/Idol_immer._Report_23_CPCB.pdf"},
    2024: {"name": "MPPCB Ganesh and Durga Visarjan Report 2024",
           "url": "https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2024.pdf"},
    2025: {"name": "MPPCB Ganesh and Durga Visarjan Report 2025",
           "url": "https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2025.pdf"},
}

BASIS_TEXT = {
    "recency": {"en": "All festivals, recent years count more",
                "hi": "सभी त्योहार, हाल के वर्षों को अधिक महत्व",
                "desc_en": "Ganesh and Durga, 2023 to 2025. 2025 readings count 3x, 2024 count 2x, 2023 count 1x.",
                "desc_hi": "गणेश और दुर्गा, 2023 से 2025। 2025 के आँकड़े 3 गुना, 2024 के 2 गुना, 2023 के 1 गुना गिने गए।"},
    "durga":   {"en": "Durga visarjan only",
                "hi": "केवल दुर्गा विसर्जन",
                "desc_en": "Only the Durga tests (the festival coming on 20 October), recent years weighted more.",
                "desc_hi": "केवल दुर्गा की जाँच (20 अक्टूबर को आने वाला त्योहार), हाल के वर्षों को अधिक महत्व।"},
    "latest":  {"en": "Latest year (2025) only",
                "hi": "केवल सबसे नया वर्ष (2025)",
                "desc_en": "Only 2025 readings. Two ghats have very few 2025 readings, so read their rank with care.",
                "desc_hi": "केवल 2025 के आँकड़े। दो घाटों के 2025 में बहुत कम आँकड़े हैं, इसलिए उनके क्रम को सावधानी से पढ़ें।"},
}


def main():
    rows = S.load_rows(DATA)
    by_site = S.group_by_site(rows)
    head = S.headline(rows)

    # scores and ranks for every basis
    scores = {b: {s: S.score_site(r, b) for s, r in by_site.items()} for b in S.BASES}
    ranks = {b: S.rank_sites(scores[b]) for b in S.BASES}

    ghats = []
    for site, srows in by_site.items():
        m = S.site_metrics(srows)
        miss_ev, partial = S.site_gaps(srows)
        body = srows[0]["water_body"]
        per_basis = {}
        for b in BASIS_TEXT:
            sc = scores[b][site]
            per_basis[b] = {"score": sc["score"], "tested": sc["tested"], "failed": sc["failed"],
                            "rank": ranks[b][site], "priority": S.priority(sc["score"])}
        rank_list = [ranks[b][site] for b in S.BASES]   # includes the equal-weight check
        ghats.append({
            "id": site,
            "name_en": site, "name_hi": T.GHAT_HI[site],
            "body_en": body, "body_hi": T.BODY_HI.get(body, body),
            "scores": per_basis,
            "rank_range": [min(rank_list), max(rank_list)],
            "confidence": S.confidence(m),
            "coverage": m["coverage"],
            "scored_tested": m["scored_tested"],
            "m": m,
            "reasons": T.reasons(m),
            "actions": T.actions(m, miss_ev, partial),
            "gaps": T.gaps(m, miss_ev, partial, site),
            "metals": T.metals_note(m),
            "missing_events": [list(e) for e in miss_ev],
            "readings": S.compact_readings(srows),
        })

    default = sorted(ghats, key=lambda g: g["scores"][S.DEFAULT_BASIS]["rank"])
    ranked_for_brief = [{"name_en": g["name_en"], "name_hi": g["name_hi"],
                         "score": g["scores"][S.DEFAULT_BASIS]["score"], "m": g["m"], "actions": g["actions"], "gaps": g["gaps"]}
                        for g in default]
    last = default[-1]
    lowest_fail = (last["m"]["do_below"] + last["m"]["bod_above"] + last["m"]["ph_out"], last["scored_tested"])
    brief = T.build_brief(head, ranked_for_brief, lowest_fail)

    payload = {
        "meta": {"built": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                 "durga_date": "2026-10-20", "reports": REPORTS,
                 "expected_per_ghat": S.EXPECTED,
                 "p1": S.P1_MIN, "p2": S.P2_MIN},
        "headline": dict(head, bairagarh_do_zero=next(g["m"]["do_zero"] for g in ghats if g["id"].startswith("Bairagarh"))),
        "bases": [dict(id=b, **BASIS_TEXT[b]) for b in BASIS_TEXT],
        "default_basis": S.DEFAULT_BASIS,
        "ghats": ghats,
        "brief": brief,
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_HTML), exist_ok=True)

    # self-contained page
    with open(TEMPLATE, encoding="utf-8") as fh:
        tpl = fh.read()
    blob = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = tpl.replace("/*__DATA__*/null", blob)
    with open(OUT_HTML, "w", encoding="utf-8") as fh:
        fh.write(html)

    # CSV ranking (default basis)
    with open(os.path.join(OUT_DIR, "ghat_risk_ranking.csv"), "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["rank", "ghat", "water_body", "risk_score_0_100", "priority", "scored_readings_used",
                    "of_possible", "data_confidence", "DO_below_5", "DO_tested", "BOD_above_3", "BOD_tested",
                    "pH_outside_range", "pH_tested", "DO_zero_readings", "rank_in_Durga_only_view",
                    "rank_in_2025_only_view", "rank_in_equal_weight_check"])
        for g in default:
            sc = g["scores"][S.DEFAULT_BASIS]
            m = g["m"]
            w.writerow([sc["rank"], g["name_en"], g["body_en"], sc["score"], sc["priority"], g["scored_tested"],
                        S.EXPECTED, g["confidence"], m["do_below"], m["do_tested"], m["bod_above"], m["bod_tested"],
                        m["ph_out"], m["ph_tested"], m["do_zero"], g["scores"]["durga"]["rank"],
                        g["scores"]["latest"]["rank"], ranks["equal"][g["id"]]])

    for lang in ("en", "hi"):
        with open(os.path.join(OUT_DIR, "brief_%s.txt" % lang), "w", encoding="utf-8") as fh:
            fh.write(brief[lang] + "\n")

    print("Built %s (%d KB)" % (os.path.relpath(OUT_HTML, ROOT), os.path.getsize(OUT_HTML) // 1024))
    for g in default:
        sc = g["scores"][S.DEFAULT_BASIS]
        print("%d. %-40s score %5.1f  P%d  conf %-6s readings %d/%d  rank range #%d-#%d" % (
            sc["rank"], g["name_en"], sc["score"], sc["priority"], g["confidence"],
            g["scored_tested"], S.EXPECTED, g["rank_range"][0], g["rank_range"][1]))


if __name__ == "__main__":
    main()
