# GhatWise (Visarjan Ghat Watch)

Track: 2 Visarjan Ghat Watch
Team: PromptPirates (Srishty Singh, Deepanshu Singh, Kartik Singh)
Event: Claude Impact Lab x Cerebras Cafe Compute, Bhopal, 11 Oct 2026

Live site: https://bitcrafterds.github.io/visarjan-ghat-watch/

## The user
A Bhopal Municipal Corporation (BMC) officer who has to plan ghat arrangements for Durga visarjan on 20 Oct 2026 and needs to know, in a few minutes, which ghats to look at first and why.

## What it does
GhatWise reads the water tests that MPPCB took at 7 Bhopal ghats in 2023 to 2025 (before, during and one week after immersion) and ranks the ghats by relative risk against the CPCB class B limits (DO 5 mg/l or more, BOD 3 mg/l or less, pH 6.5 to 8.5). Every ghat card gives the reason in plain words, the readings, and a link to the report and page each number came from. A short Hindi and English brief can be copied, printed, sent on WhatsApp or downloaded as CSV, and an action plan turns each ghat's findings into before, during and after tasks.

## Demo
Screen recording (2 min): [ADD LINK HERE]

## How to run
1. Open the live site: https://bitcrafterds.github.io/visarjan-ghat-watch/ (nothing to install).
2. To run it on your own computer, download this repo (Code, then Download ZIP) and unzip it.
3. Open the `docs` folder and double-click `index.html`. It works offline, except the QR codes, which load a small library from the internet.
4. The site is one static page: data is embedded in `docs/index.html`, add-ons are in `docs/extras.js`, `extras2.js` and `extras3.js`. There is no server, no build step and no API key.
5. To publish it, serve the `docs` folder (for example with GitHub Pages).

## What works, what does not
- Works:
  - Ranking of 7 ghats with priority, confidence, reasons and suggested actions, in three views (recency, Durga only, 2025 only).
  - Every number links to its report and page. A blank means "not sampled" and is never shown as clean.
  - Hindi and English brief, copy, print or PDF, WhatsApp share, CSV download, read-aloud (needs a device voice).
  - Action plan with tickable tasks (before 19 Oct, during 20 Oct, after 27 Oct).
  - Check a new reading: type DO, BOD and pH and see them against CPCB class B at once.
  - Before, during and after averages across the ghats, with a Ganesh or Durga filter. This shows a pattern only, not a cause.
  - Questions tab: answers are built by code from the data. It is not live AI.
- Does not work yet (and we say so on the page):
  - Public reports ("Report a ghat") and ticked tasks are saved only in the browser. There is no server, so real delivery to BMC needs a backend. WhatsApp is the route today.
  - The ranking is relative, not a safe or unsafe verdict. It makes no health claims.
  - Total coliform is not in the data, so it is not checked.
  - Units are assumed to be mg/l. "Rani Kamlapati" may refer to two places.
  - NGT has banned immersion in the Upper and Lower Lakes and BMC is building new ghats, so new ghats have no data here.
  - No ghat map yet, because locations are not verified.

## Data used
- Repo data: the organisers' data pack, https://github.com/Laaaaksh/bhopal-impact-lab-2026 (folder `tracks/02-visarjan-ghat-watch`): 1,524 readings, 7 ghats, MPPCB water-test reports 2023 to 2025.
- Extra data: none. We used no data beyond the data pack. Limits come from CPCB water quality criteria, class B.
- Library: qrcode-generator 1.4.4 (MIT), loaded from https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js, used only to draw QR codes.

## Privacy and safety
Public data only. No personal data is collected. No live government system is accessed. No API keys or secrets are in this repo.

## License
MIT. See the LICENSE file.
