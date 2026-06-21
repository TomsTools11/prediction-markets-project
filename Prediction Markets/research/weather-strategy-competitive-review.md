# Weather Strategy — Competitive & Research Review (June 2026)

Review of two open-source weather-trading repos, the attached calibration paper, and our own
build specs, plus independent web research into the weather edge. Goal: concrete, prioritized
improvements before funding the ~$50 Kalshi pilot.

Sources are cited inline. Confidence is the reviewer's, not the source's.

---

## TL;DR — the five things that matter

1. **Our core edge hypothesis may be backwards.** Our plan is built on "markets over-price tail
   uncertainty (~1.27× implied/realized SD) → sell the tails." Three of four independent sources
   point the *other* way at the short horizons we'd actually trade (fat tails → tails
   *under*-priced; the attached paper finds weather markets *over-confident*, i.e. prices too
   extreme, within 48h). The 1.27× number traces to a single closed-source, self-reported repo —
   and our own `phase2_metrics.json` (n=6) found implied SD *narrower* than realized. **Do not
   hardcode a "sell tails" prior. Measure direction per-city/per-horizon on settled data first.**

2. **Upgrade the forecast from raw ensemble fraction to a calibrated, fat-tailed distribution.**
   Both repos and our spec convert "fraction of ensemble members past the strike" straight into a
   probability. Raw GEFS/ECMWF spread is *under-dispersed* (over-confident). Start from NBM's
   already-calibrated percentiles or apply EMOS/NGR + station bias correction, and model errors as
   Student-t, not Gaussian. This is the single biggest forecasting upgrade.

3. **The maker-first, quadratic-fee, honest-fill design is right — keep it.** Our plan is
   *better* than both repos on the things that actually kill small accounts (fee modelling,
   realistic fills, per-series `fee_type`). Lean into maker-free weather series and stay in the
   mid-price band; avoid the sub-$0.15 "fee death zone."

4. **Timing and settlement precision are underexploited free edges.** Skill peaks <24h (esp. the
   ~4 AM ET run for same-day); settle strictly on the NWS CLI with the LST/DST window — never on
   Open-Meteo/consumer "realized." Both are in-scope in our spec but should be hardened.

5. **Defend against pick-off.** Specialist latency bots (DSM/OMO/6-hour/MM) fill stale resting
   orders within seconds of NWS updates. Auto-cancel/re-quote around known release times.

---

## 1. What we're comparing against

### 1.1 `suislanchez/polymarket-kalshi-weather-bot` (≈445★, paper-trading sim)
- **Forecast:** Open-Meteo Ensemble API, `gfs_seamless`, 31 members; probability = fraction of
  members past the strike, clipped to `[0.05, 0.95]`. No MOS/NBM, no bias correction, no
  calibration layer.
- **Edge:** `max(model−price up, (1−model)−(1−price) down)`; trade gate 8% (weather); entry-price
  cap 0.70.
- **Sizing:** fractional Kelly (0.15), 5%-of-bankroll cap, $100/trade cap.
- **Execution:** none real — read-only Kalshi client with **correct RSA-PSS auth**
  (`timestamp_ms + METHOD + path`, SHA256, max salt). No order POST, **no fee model anywhere in
  code.**
- **Name oversells it:** despite "polymarket-kalshi," there is **no cross-platform arbitrage** —
  the weather path trades ensemble-vs-Polymarket; the Kalshi client is disconnected from the
  weather signal. README admits it's a simulator; the "$1.8k profit" is paper-only.
- Source: https://github.com/suislanchez/polymarket-kalshi-weather-bot

### 1.2 `Oalkhadra/prediction-market-trading` (closed source, README-only)
- **Forecast:** XGBoost on 30 features from "multiple weather sources" → calibrated bucket
  probabilities. The most sophisticated model on paper.
- **Thesis:** *market-implied uncertainty exceeds realized by 1.27×* over ~2,000 obs (this is the
  exact source of our working hypothesis).
- **Backtest (self-reported, 2025-01-01 → 2026-02-20):** 1,012 trades, **49.8% total return,
  Sharpe 4.9, max DD 5.6%, win rate 34.9%, 3.2 win/loss** — low win rate + high payoff is the
  "sell expensive uncertainty / buy cheap mode" signature. Backtest uses **fixed $1/trade** and
  **ask + $0.02 spread** to isolate signal from sizing.
- **Unverifiable:** source private; Sharpe 4.9 on 34.9% over ~14 months smells overfit-prone;
  honest about DST, liquidity ($10K–$500K/city/day), and expected edge decay.
- Source: https://github.com/Oalkhadra/prediction-market-trading

### 1.3 Others found
- `Stewyboy1990/weatheredge-bot` — 82-member dual ensemble (31 GFS + 51 ECMWF) + ~70%-weighted
  NWS bias correction toward the settlement station, 8% gate, quarter-Kelly, **maker/taker split**
  (cross on high edge, rest a maker on low edge). Reports 81% win (13W/3L) but archived, sells
  source for $97, paper-vs-live unclear.
- `cpratim/Kalshi-Weather-Trading`, `akshatgurbuxani/Kalshi-Weather-Forecasting-Financial-Trading`,
  `AruneshDev/...` — thin proofs of concept, no documented results.
- **Convergent recipe across the field:** Open-Meteo ensemble → member-fraction probability →
  ~8% edge gate → Kelly fraction. Everyone does roughly the same thing; almost nobody models fees
  or fills or validates calibration.

---

## 2. The attached paper (Le 2026, arXiv 2602.19520)

"Decomposing Crowd Wisdom: Domain-Specific Calibration Dynamics in Prediction Markets," Nam Anh
Le, National Economics University. 292M trades / 327K binary contracts on Kalshi + Polymarket.
Calibration slope `b` from `P(win) = σ(a + b·logit(price))`: `b=1` perfect, `b<1` over-confident
(prices too extreme), `b>1` under-confident (prices compressed toward 50%).

- **Four-component decomposition explains 87.3% of Kalshi calibration variance:** universal
  horizon effect (30.2%), domain intercept (14.6%), domain×horizon (26.0%), trade-size scale
  (16.5%). Bayesian hierarchical model corroborates (96.3% posterior predictive coverage).
- **Weather slope by horizon (short→long):** `0.69, 0.84, 0.74, 0.87, 0.91, 0.97, 1.20, 1.20,
  1.37`. **Weather is over-confident within ~48h (slope 0.69–0.97) — prices too extreme — best
  calibrated at moderate horizons, under-confident only beyond a month.** The paper attributes
  short-horizon over-confidence to **over-reaction to meteorological signals** ("when a forecast
  predicts a storm tomorrow, traders push prices too far").
- **Politics:** persistently under-confident (compressed to 50%); generalises to Polymarket.
- **Trade-size scale effect** (large trades amplify miscalibration) is **Kalshi-politics-specific**
  (Δ=0.53) and does **not** replicate on Polymarket (Δ=0.11); for weather the size effect is tiny
  and slightly negative (Δ≈−0.07). Not directly actionable for us.
- Caveats: 2026 preprint, not peer-reviewed; weather is Kalshi-only here (Polymarket classifier
  drops weather); Polymarket timestamps carry ~3h noise affecting the two shortest bins.
- Source (HTML): https://arxiv.org/html/2602.19520v1

**Why this matters for us:** the paper's slope-`b` framing and our "implied-SD-too-wide" framing
make *opposite* predictions about cheap tail buckets at short horizon. Slope < 1 says a bucket
priced at 8¢ wins *more* than 8% → tail buckets are **under**-priced → buy them. Our 1.27× thesis
says tail buckets are **over**-priced → sell them. They cannot both be right at the horizon we
trade. (Note: the paper measures *binary-contract* calibration, our thesis measures the *width of
the bucket distribution* — not identical objects, but they collide on tail-bucket pricing.)

---

## 3. Independent research findings (cited)

### 3.1 Forecasting (how to actually beat the implied distribution)
- Day-1 daily-max MAE ≈ **3–4°F**, degrading ~0.8–1.0°F/day; strongly seasonal (OKC winter ~8.3°F
  vs summer ~3.1°F). https://www.nssl.noaa.gov/users/brooks/public_html/media/okcmed.html
- Same-day error *after the diurnal peak* collapses toward a fraction of a degree — resolving
  "today's high" intraday is nearly trivial vs forecasting it a day out.
  https://courses.ems.psu.edu/meteo3/node/2285
- **NBM** is the free, operational, *already-calibrated* NWS blend (GEFS+ECMWF ENS+CMC+…),
  bias-corrected via decaying-average + quantile mapping, emitting a full 1–99 percentile MaxT
  distribution — read implied bucket probs straight off the percentiles.
  https://www.weather.gov/news/200318-nbm32
- **LAMP / Gridded-LAMP** updates *hourly* out to 38h, ingesting latest METAR — the tool to
  exploit late-day observations for same-day highs. https://vlab.noaa.gov/web/mdl/lamp
- Raw ensembles are **under-dispersed** for 2-m temp; **EMOS / NGR** (Gaussian PDF, mean from
  ensemble mean, variance affine in spread, fit by CRPS) is the standard fix; verify with a flat
  PIT histogram. Station **Kalman/decaying bias correction** is cheap and high-value.
  https://en.wikipedia.org/wiki/Nonhomogeneous_Gaussian_regression
- Diminishing returns warning: MOS/NBM already do most post-processing; ensemble post-processing
  buys ~0.1°F over GFS-MOS in the short range. https://www.weather.gov/mrx/marzstudy

### 3.2 Market calibration / the tail-pricing question
- **Fat tails:** a Gaussian "2σ / 5%" daily-high event actually occurs ~**10–12%** of the time →
  Gaussian models *under*-price tails. https://www.northlakelabs.com/max/blog/kalshi-weather-postmortem-and-pivot/
- Kalshi weather well-calibrated at extremes (90–100% bucket → ~98.6% YES; 0–10% → ~1.2%); noisier
  mid-range. https://lycheedata.com/guides/kalshi-weather-prediction-markets-analysis
- KXHIGHNY raw market ECE ≈ **0.0162** over 8,494 settled markets; isotonic recal only → 0.0011.
  Little *systematic* edge from recalibration alone. https://www.zerve.ai/gallery/85cce830-f612-4b23-8b78-34d7da65a2c6
- Classic favorite-longshot bias is Kalshi-wide and strongest in cheap contracts (Whelan).
  https://www.karlwhelan.com/Papers/Kalshi.pdf
- Overround in a single NYC daily bucket ladder is modest (~4–8%). `phase2_metrics.json`,
  https://lycheedata.com/guides/kalshi-weather-prediction-markets-analysis

### 3.3 Fees, spreads, execution (the binding constraint at $50)
- Taker fee `= roundup(0.07 · C · P · (1−P))`; peaks 1.75¢ at P=0.50; symmetric in P. Maker fee,
  where charged, is 25% of that (`0.0175·…`). https://help.kalshi.com/en/articles/13823805-fees
- Fee *as % of capital* is **worst in the wings** (~6.6% at 5¢ vs ~3.5% at 50¢); per-order 1¢
  round-up makes cheap single-contract orders punitive. https://pm.wiki/learn/kalshi-fees-explained
- **Fee death zone:** a 1¢ fee on a 5¢ contract is a 20% tax; practitioners treat **$0.15** as the
  floor. https://www.northlakelabs.com/max/blog/kalshi-weather-postmortem-and-pivot/
- Weather is **~0.2% of Kalshi volume**; books thin, liquidity fragmented across many narrow
  buckets; spreads commonly several cents. https://defirate.com/prediction-markets/volume/kalshi/
- After-fee expected return on the *average* Kalshi contract ≈ **−20%** (takers −32%, makers −10%),
  losses concentrated in longshots. https://www.karlwhelan.com/Papers/Kalshi.pdf
- A persistent maker edge of **~5¢/contract** is roughly what survives spread+adverse-selection in
  a thin weather bucket. (synthesis of above)

### 3.4 Dynamics / timing
- Markets generally get better-calibrated toward resolution; but prices **under-react** to news
  (~0.64-for-one), producing predictable short-horizon **drift** (~2–4.8pp over 5–15 min), worse
  in **low-liquidity** books. https://arxiv.org/html/2606.07811
- Kalshi daily weather launches ~10 AM ET the day before; price discovery compresses toward 99/1
  near settlement; the 4 AM ET run is the most informative for same-day.
  https://lycheedata.com/guides/kalshi-weather-prediction-markets-analysis

### 3.5 Settlement pitfalls (free risk reduction)
- Settle **only** on the final NWS Climatological Report (CLI); no consumer source.
  https://help.kalshi.com/en/articles/13823837-weather-markets
- CLI uses **Local Standard Time year-round** → during DST the 24h high window is ~1:00 AM–12:59 AM,
  not midnight-to-midnight. Preliminary-vs-final revisions and 6-hour METAR maxes (invisible on
  consumer apps) are real settlement risks near a strike. https://wethr.net/edu/trading-guide
- Specialist pick-off bots (DSM/OMO/6-hour/240-MM) fill stale resting orders within seconds of NWS
  updates; never leave unprotected limits around release times. https://wethr.net/edu/market-bots

---

## 4. Prioritized improvements to our approach

**P0 — Validate (and probably re-orient) the core edge before risking capital**
- Treat "markets over-price tail uncertainty 1.27×" as an *unproven, single-source* hypothesis,
  not a design assumption. Make the sim compute, per city and per time-to-settlement bucket, both
  (a) implied-vs-realized SD ratio and (b) the Le-style calibration slope on *our* settled data.
  Let the data choose the direction. The weight of evidence currently favors *tails under-priced*
  at short horizon — the opposite trade.
- Replace any Gaussian tail assumption with **Student-t / empirical** errors; verify with a PIT
  histogram. (Northlake's #1 failure.)

**P1 — Forecast quality**
- Add **NBM percentiles** as a calibrated baseline distribution (free), and/or **EMOS/NGR** to
  de-bias and correctly widen the under-dispersed ensemble. Add a **station-specific decaying/
  Kalman bias correction** toward the exact settlement station (Central Park/OKX for NYC).
- Add **LAMP/Gridded-LAMP + intraday GFS runs** for same-day highs; weight the 4 AM ET run.
- Keep Open-Meteo ensemble as the cheap primitive, but never feed *raw* member-fraction to pricing.

**P2 — Execution discipline (mostly already in our spec — harden it)**
- Stay **maker-only on `quadratic` (maker-free) series** and in the **mid-price band**
  (avoid <$0.15). This is the durable structural edge and it *also* sidesteps the longshot fee trap.
- Encode **CLI/LST/DST settlement methodology** exactly; use NWS as the *only* settlement truth,
  Open-Meteo only as a forecast input.
- Auto-cancel/re-quote around DSM/observation release windows; keep the "toxic maker fill" flag.

**P3 — Measurement & honesty**
- Adopt Oalkhadra's eval discipline: a **fixed-$1/trade, ask+$0.02-spread** evaluation mode to
  isolate signal alpha *before* Kelly sizing amplifies noise (complements our quarter-Kelly live
  config).
- Require **≥200 independent settled trades** before believing an edge; accumulate via multi-city
  weather + weekly jobless. Run the sim at **both $50 and $1,000** to separate signal from
  capacity (already an open question in our spec).

**Borrow directly**
- RSA-PSS signing reference from `suislanchez` (matches our `kalshi_toolkit` auth spec).
- `weatheredge-bot`'s NWS-bias-correction-toward-settlement-station and maker/taker edge split.
- Oalkhadra's variance-mispricing *framing* and backtest hygiene — without trusting its numbers.

**Don't bother (yet)**
- Polymarket↔Kalshi arbitrage (unimplemented even in the repo that's named for it; our spec already
  excludes it — correct).
- Racing the latency bots on speed. Our niche is slower structural mispricings + forecast judgment.

---

## 5. Where our plan is already ahead

- Maker-first on maker-free `quadratic` series — targets the one real structural edge.
- Honest pessimistic fill model (level-1 trade-through) — both repos model *no* fills.
- Per-series `fee_type`/`fee_multiplier` reading — exactly the discipline Northlake/suislanchez
  lacked and that drives the −20% average loss.
- Demo-first guardrails; Brier/calibration as first-class metrics; reproducible run artifacts.

The execution and risk scaffolding is genuinely good. The gaps are the **forecast model** (raw →
calibrated/fat-tailed) and the **unvalidated, possibly-inverted core edge hypothesis**. Fix those
two and the rest of the plan stands.
