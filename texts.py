"""English and Hindi text for Visarjan Ghat Watch.

All numbers come from scoring.py. These functions only turn them into plain words.
A Hindi-speaking teammate should read the Hindi once (names of ghats especially).
"""
from scoring import PHASES

GHAT_HI = {
    "Bairagarh (Sant Hirdaram) kund": "बैरागढ़ (संत हिरदाराम) कुंड",
    "Hathaikheda dam / kund": "हथाईखेड़ा डैम / कुंड",
    "Khatlapura ghat": "खटलापुरा घाट",
    "Malikhedi kund": "मालीखेड़ी कुंड",
    "Prempura ghat": "प्रेमपुरा घाट",
    "Rani Kamlapati ghat / Kamla Park kund": "रानी कमलापति घाट / कमला पार्क कुंड",
    "Shahpura lake ghat": "शाहपुरा लेक घाट",
}
BODY_HI = {
    "Upper Lake": "ऊपरी तालाब (बड़ा तालाब)",
    "Lower Lake": "निचला तालाब (छोटा तालाब)",
    "Hathaikheda dam": "हथाईखेड़ा डैम",
    "Kund": "कुंड",
    "Shahpura Lake": "शाहपुरा तालाब",
}
FEST_HI = {"Ganesh": "गणेश", "Durga": "दुर्गा"}
PHASE_EN = {"pre": "before immersion", "during": "during immersion", "after": "one week after"}
PHASE_HI = {"pre": "विसर्जन से पहले", "during": "विसर्जन के दौरान", "after": "विसर्जन के एक सप्ताह बाद"}
PARAM_EN = {"Dissolved oxygen": "DO", "BOD": "BOD", "pH": "pH"}


def _fmt(v):
    return ("%.1f" % v).rstrip("0").rstrip(".") if v not in (0, 0.0) else "0"


def _ev_en(w):
    return "%s %d, %s" % (w["festival"], w["year"], PHASE_EN[w["phase"]])


def _ev_hi(w):
    return "%s %d, %s" % (FEST_HI[w["festival"]], w["year"], PHASE_HI[w["phase"]])


def reasons(m):
    en, hi = [], []
    if m["do_tested"]:
        s = "Dissolved oxygen (DO) was below the bathing limit of 5 mg/l in %d of %d tests" % (m["do_below"], m["do_tested"])
        h = "घुली ऑक्सीजन (DO) स्नान-मानक 5 mg/l से कम: %d में से %d जाँच में" % (m["do_tested"], m["do_below"])
        if m["do_zero"]:
            s += ", and read 0 mg/l %d time%s" % (m["do_zero"], "" if m["do_zero"] == 1 else "s")
            h += "; %d बार 0 mg/l दर्ज हुआ" % m["do_zero"]
        en.append(s + ".")
        hi.append(h + "।")
    if m["bod_tested"]:
        w = m["worst_bod"]
        en.append("BOD was above the limit of 3 mg/l in %d of %d tests (highest %s mg/l, %s)."
                  % (m["bod_above"], m["bod_tested"], _fmt(w["value"]), _ev_en(w)))
        hi.append("BOD मानक 3 mg/l से अधिक: %d में से %d जाँच में (सर्वाधिक %s mg/l, %s)।"
                  % (m["bod_tested"], m["bod_above"], _fmt(w["value"]), _ev_hi(w)))
    if m["ph_out"]:
        en.append("pH was outside 6.5 to 8.5 in %d of %d tests." % (m["ph_out"], m["ph_tested"]))
        hi.append("pH सीमा 6.5 से 8.5 से बाहर: %d में से %d जाँच में।" % (m["ph_tested"], m["ph_out"]))
    return {"en": en, "hi": hi}


def actions(m, missing_events, partial):
    en, hi = [], []
    do_share = m["do_below"] / m["do_tested"] if m["do_tested"] else 0
    bod_share = m["bod_above"] / m["bod_tested"] if m["bod_tested"] else 0
    if do_share >= 0.3 or m["do_zero"]:
        en.append("Prioritise aeration or other oxygen support before immersion.")
        hi.append("विसर्जन से पहले एयरेशन या ऑक्सीजन बढ़ाने के उपाय को प्राथमिकता दें।")
    if bod_share >= 0.6:
        en.append("Plan extra cleaning of organic waste and immersion material (BOD is repeatedly above the limit).")
        hi.append("जैविक कचरे और विसर्जन-सामग्री की अतिरिक्त सफाई की योजना बनाएँ (BOD बार-बार सीमा से ऊपर है)।")
    if missing_events or partial or m["coverage"] < 0.9:
        en.append("Test before 20 October to fill the data gaps.")
        hi.append("डेटा की कमियों को भरने के लिए 20 अक्टूबर से पहले जाँच कराएँ।")
    if m["medium_site_match"]:
        en.append("Confirm with MPPCB whether Kamla Park kund and Lower Lake ghat are the same place.")
        hi.append("MPPCB से पुष्टि करें कि कमला पार्क कुंड और लोअर लेक घाट एक ही स्थान हैं या नहीं।")
    if not en:
        en.append("Keep routine testing before, during and one week after immersion.")
        hi.append("विसर्जन से पहले, दौरान और एक सप्ताह बाद नियमित जाँच जारी रखें।")
    return {"en": en, "hi": hi}


def gaps(m, missing_events, partial, site):
    en, hi = [], []
    for f, y in missing_events:
        en.append("No %s %d table in the MPPCB report, so there is no data for it." % (f, y))
        hi.append("MPPCB रिपोर्ट में %s %d की तालिका नहीं है, इसलिए इसका कोई डेटा नहीं है।" % (FEST_HI[f], y))
    for g in partial:
        ps = ", ".join(PARAM_EN[p] for p in g["params"])
        en.append("%s %d, %s: %s not sampled." % (g["festival"], g["year"],
                  " and ".join(PHASE_EN[p] for p in g["phases"]), ps))
        hi.append("%s %d, %s: %s की जाँच नहीं हुई।" % (FEST_HI[g["festival"]], g["year"],
                  " और ".join(PHASE_HI[p] for p in g["phases"]), ps))
    if m["medium_site_match"]:
        en.append("The site name may cover two places (\"Kamla Park kund\" in Ganesh tables, \"Lower Lake ghat\" in Durga tables).")
        hi.append("साइट का नाम दो स्थानों का हो सकता है (गणेश तालिकाओं में \"कमला पार्क कुंड\", दुर्गा तालिकाओं में \"लोअर लेक घाट\")।")
    return {"en": en, "hi": hi}


def metals_note(m):
    if not m["metals_total"]:
        return {"en": "", "hi": ""}
    en = ("Metals (chromium, lead, zinc, copper) are shown for context only. Class B sets no limit for them, so they are not scored. "
          "Detected in %d of %d results, below detection limit (BDL) in %d, not sampled in %d."
          % (m["metals_detected"], m["metals_total"], m["metals_bdl"], m["metals_not_sampled"]))
    hi = ("धातुएँ (क्रोमियम, लेड, ज़िंक, कॉपर) केवल जानकारी के लिए हैं। श्रेणी-B में इनकी कोई सीमा नहीं है, इसलिए इन्हें अंक नहीं दिए गए। "
          "%d में से %d परिणामों में पाई गईं, %d में पहचान-सीमा से नीचे (BDL), %d में जाँच नहीं हुई।"
          % (m["metals_total"], m["metals_detected"], m["metals_bdl"], m["metals_not_sampled"]))
    return {"en": en, "hi": hi}


def build_brief(head, ranked, lowest_fail):
    """ranked: list of dicts (default basis order) with name_en, name_hi, score, m, actions."""
    en = ["VISARJAN GHAT WATCH: brief for the BMC officer",
          "Durga Visarjan: 20 October 2026",
          "",
          "Basis: MPPCB water tests at 7 Bhopal ghats, 2023 to 2025, compared with CPCB class B (outdoor bathing) limits: "
          "dissolved oxygen (DO) 5 mg/l or more, BOD 3 mg/l or less, pH 6.5 to 8.5.",
          "",
          "Headline: across all readings, DO was below 5 mg/l in %d of %d tests and BOD was above 3 mg/l in %d of %d tests."
          % (head["do_below"], head["do_tested"], head["bod_above"], head["bod_tested"]),
          "",
          "Ranking (relative priority for extra cleaning, aeration and testing):"]
    hi = ["विसर्जन घाट वॉच: नगर निगम अधिकारी के लिए संक्षिप्त रिपोर्ट",
          "दुर्गा विसर्जन: 20 अक्टूबर 2026",
          "",
          "आधार: भोपाल के 7 घाटों पर MPPCB की 2023 से 2025 की जल-जाँच, CPCB श्रेणी-B (खुले में स्नान) के मानकों से तुलना: "
          "घुली ऑक्सीजन (DO) 5 mg/l या अधिक, BOD 3 mg/l या कम, pH 6.5 से 8.5।",
          "",
          "मुख्य बात: सभी जाँचों में DO %d में से %d बार 5 mg/l से कम और BOD %d में से %d बार 3 mg/l से अधिक रहा।"
          % (head["do_tested"], head["do_below"], head["bod_tested"], head["bod_above"]),
          "",
          "प्राथमिकता क्रम (अतिरिक्त सफाई, एयरेशन और जाँच के लिए):"]
    for i, g in enumerate(ranked, 1):
        m = g["m"]
        en.append("%d. %s, score %d/100: DO below limit in %d of %d tests, BOD above limit in %d of %d tests."
                  % (i, g["name_en"], round(g["score"]), m["do_below"], m["do_tested"], m["bod_above"], m["bod_tested"]))
        hi.append("%d. %s, अंक %d/100: DO मानक से कम %d में से %d जाँच में, BOD मानक से अधिक %d में से %d जाँच में।"
                  % (i, g["name_hi"], round(g["score"]), m["do_tested"], m["do_below"], m["bod_tested"], m["bod_above"]))
    en += ["", "Suggested before 20 October:"]
    hi += ["", "20 अक्टूबर से पहले सुझाव:"]
    for g in ranked[:3]:
        en.append("- %s: %s" % (g["name_en"], " ".join(g["actions"]["en"])))
        hi.append("- %s: %s" % (g["name_hi"], " ".join(g["actions"]["hi"])))
        if g["gaps"]["en"]:
            en.append("  Data gaps: %s" % " ".join(g["gaps"]["en"]))
            hi.append("  डेटा की कमियाँ: %s" % " ".join(g["gaps"]["hi"]))
    en.append("- Any new ghat has no readings in this data. Take a baseline test before it is used.")
    hi.append("- कोई भी नया घाट इस डेटा में नहीं है। उपयोग से पहले आधारभूत जाँच कराएँ।")
    en += ["", "Limits of this brief:",
           "- This is a relative ranking of the 7 ghats, not a safe or unsafe verdict. Even the lowest-ranked ghat went beyond a limit in %d of %d tests."
           % (lowest_fail[0], lowest_fail[1]),
           "- A blank in the MPPCB reports means not sampled, never clean. Total coliform is not in this data.",
           "- The reports print no units. Standard units are assumed. No health effects are claimed.",
           "- Every number can be traced to its MPPCB report page in the tool."]
    hi += ["", "इस रिपोर्ट की सीमाएँ:",
           "- यह 7 घाटों का सापेक्ष क्रम है, सुरक्षित या असुरक्षित का फ़ैसला नहीं। सबसे नीचे वाला घाट भी %d में से %d जाँच में किसी मानक से बाहर रहा।"
           % (lowest_fail[1], lowest_fail[0]),
           "- MPPCB रिपोर्ट में खाली जगह का मतलब जाँच नहीं हुई, साफ़ नहीं। कुल कॉलिफ़ॉर्म इस डेटा में नहीं है।",
           "- रिपोर्ट में इकाइयाँ नहीं छपी हैं, मानक इकाइयाँ मानी गई हैं। स्वास्थ्य पर असर का कोई दावा नहीं किया गया है।",
           "- हर संख्या को टूल में MPPCB रिपोर्ट के पेज से मिलाया जा सकता है।"]
    return {"en": "\n".join(en), "hi": "\n".join(hi)}
