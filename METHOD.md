# Method and limits

## Limit used
CPCB class B, "outdoor bathing (organised)". Immersion ghats are places where people stand in and touch the water, and class B is the CPCB class built for that use. Class A is for drinking-water sources, and C to E are for treated drinking water, wildlife and irrigation.

Limits from class B that exist in the readings:

| Parameter | Limit |
|---|---|
| Dissolved oxygen (DO) | 5 mg/l or more |
| BOD (5 days, 20°C) | 3 mg/l or less |
| pH | 6.5 to 8.5 |

Class B also limits total coliform (500 MPN/100 ml). Coliform is not in the readings, so it is not scored.

## Scoring (see `scoring.py`)

1. **Severity of one reading**
   - Within the limit: 0.
   - Outside the limit: `0.3 + 0.7 × distance`, where distance runs from 0 to 1.
     - DO: `(5 − value) / 5` (DO of 0 gives 1.0)
     - BOD: `(value − 3) / 9`, capped at 1 (BOD of 12 or more gives 1.0)
     - pH: distance outside 6.5 to 8.5, divided by 1.5, capped at 1
   - The 0.3 floor is a judgement call, so that any breach counts clearly.
2. **Weights.** Default view: 2025 readings ×3, 2024 ×2, 2023 ×1. Other views: Durga only (same year weights), 2025 only, and an equal-weight check (in the CSV).
3. **Ghat score** = weighted mean severity over the readings that exist × 100.
4. **Missing readings** (blank, `-`, `not sampled`, `*`, `**`) are excluded from the mean. They are never counted as clean. The share of the possible 54 readings that exist is shown as the confidence badge: High 90% or more, Medium 60% to 89%, Low below 60%. A site name that may cover two places caps confidence at Medium.
5. **Priority** (relative, for sorting): 1 = score 40 or more, 2 = 25 to 39, 3 = below 25.

## Suggested actions
Rule-based, shown as suggestions for the officer's judgement:
- Aeration or oxygen support if DO is below the limit in 30% or more of tests, or ever reads 0.
- Extra cleaning of organic waste and immersion material if BOD is above the limit in 60% or more of tests.
- Extra testing if a table or stage is missing, or fewer than 90% of readings exist.

## Stability check
Bairagarh kund is rank 1 and Prempura ghat is rank 7 under every weighting. Ranks 2 to 6 move between views (for example Malikhedi kund is 2nd in the default and 2025 views but 4th in the Durga-only view). Each card shows the range.

## What the data does not cover
- Total coliform; any limit for metals under class B.
- Units are assumed (reports print none). BDL means below detection limit: very low, not zero, not missing.
- No Durga 2025 table for Bairagarh kund and Malikhedi kund; their Ganesh 2025 tests cover only the during-immersion stage.
- "Rani Kamlapati ghat / Kamla Park kund" may cover two places.
- New BMC ghats have no data.
- No health effects are claimed. The tool compares readings with limits.
