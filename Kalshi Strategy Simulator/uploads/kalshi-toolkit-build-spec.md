# Kalshi Signal Toolkit — Build Requirements Spec

**Hand this document to Claude Code as the build brief.** It is grounded in Kalshi's live API (verified June 20, 2026), not assumptions. Build in the order of the milestones in §9. Everything that touches money must default to the **demo environment** and must never auto-place a real-money order without an explicit, separate confirmation step.

- **Owner:** Tom Panos
- **Context:** Phase 2, Step 1 of a prediction-market research plan. Phase 1 concluded that for a small, AI-assisted bankroll the two most "optimizable" Kalshi categories are **Weather (daily temperature)** and **Macro/Economic data**. This toolkit exists to *validate that edge with real data before risking capital.*
- **Live bankroll:** ~$50 (real). Treat as experimental. The toolkit's job is measurement and disciplined execution, not aggressive deployment.
- **Primary language:** Python 3.11+

---

## 1. Objective

Build a Python toolkit that lets Tom:

1. **Map** the exact Kalshi weather + macro markets, their structure, and settlement rules (Step 1).
2. **Read** live market data and order books with no auth (public) and portfolio data with auth.
3. **Forecast** outcomes for the two focus categories using public data (weather ensembles; macro nowcasts) and convert forecasts into calibrated bucket probabilities.
4. **Compare** model probabilities to live market prices, compute a **fee-adjusted edge**, and size positions with **fractional Kelly**.
5. **Paper-trade** the whole loop live (demo + a no-capital shadow log) and produce **calibration + fee-adjusted P&L** metrics so Tom can pick the single best category before funding a real pilot.

This is a **decision-support and measurement tool first, an execution tool second.** Success = trustworthy evidence about where the edge is, plus the ability to place disciplined maker orders when Tom chooses to.

---

## 2. Scope

### In scope (this build)
- Auth + REST client (prod + demo), public market-data client, market-map generator.
- Portfolio reads (balance, positions, orders, fills).
- Order placement/cancel **against demo**, with a hard guard before any production order.
- Weather signal module (Open-Meteo GFS/ECMWF ensembles → temperature-bucket probabilities).
- Macro signal module (ingest public nowcasts/consensus → release-outcome probabilities).
- Edge engine: fee model + edge calc + fractional-Kelly sizing.
- Paper-trade / backtest harness with calibration (Brier) and fee-adjusted P&L logging.
- CLI + simple file/HTML reporting.

### Out of scope (later phases)
- Real-money automated trading without human confirmation (explicitly disallowed; see §3).
- Cross-platform (Polymarket) arbitrage — Polymarket US has no automation path yet.
- Short-horizon crypto markets — Phase 1 ruled these out (latency game).
- WebSocket streaming is **optional/stretch** (REST polling is sufficient for daily weather + scheduled macro). Include a clean seam to add it later.

---

## 3. Guardrails & non-negotiables

These are hard requirements, not preferences.

1. **Demo-first.** All order-placement code defaults to the demo base URL. Production requires an explicit `--env prod` flag **and** an interactive confirmation **and** an env var `KALSHI_ALLOW_LIVE=1`. No code path may place a production order silently.
2. **No autonomous real-money trading.** The toolkit may *recommend* trades and *place demo* trades autonomously. A real-money order requires a human confirmation each run (no "auto-trade" daemon against prod in this phase).
3. **Maker-first.** Default order type is a resting limit order priced to add liquidity. The fee model (§7, M7) must be applied to every recommendation; suppress any trade whose edge does not clear fees by a configurable margin (default 2×).
4. **Bankroll caps.** Global config: max stake per market, max total at-risk, max open orders. Defaults sized for a $50 bankroll (e.g. ≤ $5 per market, ≤ $25 deployed). Kelly fraction default 0.25 (quarter-Kelly), hard-capped by these limits.
5. **Secrets never in code or logs.** API key ID + private key path come from env/`.env`; private key file is git-ignored; signatures and keys are never logged.
6. **Compliance note surfaced.** Every Kalshi series carries prohibitions: persons employed by the source agencies and persons holding material non-public information may not trade. The toolkit must print this once at startup and store it in the market map. (Tom is unaffected, but it must be visible.)
7. **Eligibility check.** On first run, print a reminder to confirm Kalshi trading is available in Tom's state and that the funded account is verified.

---

## 4. Tech stack

- **Python 3.11+**, `requests` (HTTP), `cryptography` (RSA-PSS signing), `pandas` (data/metrics), `pydantic` (config + response models), `typer` or `argparse` (CLI), `python-dotenv` (config), `rich` (console tables/logging), `pytest` (tests).
- **Auth/transport:** either the official **`kalshi-python` SDK** *or* a thin custom client built on the signing recipe in Appendix B. Recommendation: thin custom client (the signing is ~15 lines and avoids SDK version drift), but the official SDK is acceptable if it reduces maintenance. Document the choice.
- **Weather data:** Open-Meteo Ensemble API (free, no key) — GFS and ECMWF ensemble members.
- **Macro data:** public release calendars + nowcasts (see Appendix C). No paid data sources required for v1.
- Packaging: standard `pyproject.toml`; runnable as `python -m kalshi_toolkit ...` and via console entry point.

---

## 5. Configuration & secrets

Support a `.env` file and real env vars:

| Variable | Purpose | Example |
|---|---|---|
| `KALSHI_ENV` | `demo` (default) or `prod` | `demo` |
| `KALSHI_API_KEY_ID` | API key ID from the account UI | `a952bcbe-…` |
| `KALSHI_PRIVATE_KEY_PATH` | Path to downloaded `.key` (PEM) | `./secrets/kalshi-demo.key` |
| `KALSHI_ALLOW_LIVE` | Must equal `1` to allow prod orders | unset |
| `MAX_STAKE_PER_MARKET_USD` | Risk cap | `5` |
| `MAX_TOTAL_AT_RISK_USD` | Risk cap | `25` |
| `KELLY_FRACTION` | Sizing | `0.25` |
| `MIN_EDGE_FEE_MULTIPLE` | Suppress trades below this × fees | `2` |

Keys are environment-specific: **demo keys only work on demo, prod keys only on prod.** Store them separately (`kalshi-demo.key`, `kalshi-prod.key`).

---

## 6. Verified API reference (ground truth)

> All of the following was confirmed against the live API on 2026-06-20. Treat it as the source of truth; still read the linked docs for edge cases.

### 6.1 Base URLs
| Env | REST base | WebSocket |
|---|---|---|
| **Production** | `https://external-api.kalshi.com/trade-api/v2` (alt: `https://api.elections.kalshi.com/trade-api/v2`) | `wss://external-api-ws.kalshi.com/trade-api/ws/v2` |
| **Demo** | `https://external-api.demo.kalshi.co/trade-api/v2` (alt: `https://demo-api.kalshi.co/trade-api/v2`) | `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2` |

The `elections` subdomain serves **all** markets, not just elections. Login UIs: demo = `https://demo.kalshi.co`, prod = `https://kalshi.com`.

### 6.2 Authentication (RSA-PSS request signing)
Three headers on every authenticated request:

| Header | Value |
|---|---|
| `KALSHI-ACCESS-KEY` | API key ID |
| `KALSHI-ACCESS-TIMESTAMP` | current time in **milliseconds** |
| `KALSHI-ACCESS-SIGNATURE` | base64( RSA-PSS-SHA256( `"{timestampMs}{METHOD}{path}"` ) ) |

- **Sign the path from the API root, WITHOUT query params.** e.g. sign `/trade-api/v2/portfolio/balance` even if the URL has `?limit=5`.
- PSS padding: MGF1(SHA256), salt length = digest length. (Reference impl in Appendix B.)
- Keys are created in the account UI: **Account & security → API Keys → Create Key.** The private key downloads **once** as a `.key` PEM; the key ID shows on screen. Generate a **separate demo key** at `demo.kalshi.co`.
- Public market-data endpoints (`/series`, `/events`, `/markets`, `/markets/{t}/orderbook`) need **no auth**.

### 6.3 Endpoints used by this toolkit (relative to base)
| Method | Path | Auth | Use |
|---|---|---|---|
| GET | `/exchange/status` | no | health check |
| GET | `/series?category={cat}` | no | discover series in a category |
| GET | `/series/{series_ticker}` | no | series metadata + settlement source |
| GET | `/events?series_ticker={s}&status=open` | no | events (a day/release) within a series |
| GET | `/markets?series_ticker={s}&status=open&limit=&cursor=` | no | list markets (buckets) |
| GET | `/markets/{ticker}` | no | single market |
| GET | `/markets/{ticker}/orderbook?depth={n}` | no | order book (yes bids + no bids only) |
| GET | `/markets/{ticker}/candlesticks` | no | history (1/60/1440-min); archived → `/historical/...` |
| GET | `/portfolio/balance` | yes | balance (**cents**) |
| GET | `/portfolio/positions` | yes | positions |
| GET | `/portfolio/orders` | yes | orders |
| GET | `/portfolio/fills` | yes | fills |
| POST | `/portfolio/orders` | yes | create order |
| DELETE | `/portfolio/orders/{order_id}` | yes | cancel |
| GET | `/account/api-limits` | yes | rate-limit tier |

Pagination is **cursor-based** (`cursor` + `limit`); loop until `cursor` is empty. Handle `429` with backoff. Note: a V2 order path exists and the legacy `/portfolio/orders` is slated for deprecation **no earlier than May 6, 2026** — implement against legacy now but isolate order I/O behind one module so the path can be swapped.

### 6.4 Order payload (POST `/portfolio/orders`)
```json
{
  "ticker": "KXHIGHNY-26JUN08-T79",
  "action": "buy",            // buy | sell
  "side": "yes",              // yes | no
  "count": 1,                  // contracts
  "type": "limit",            // limit | market  (default limit)
  "yes_price": 8,              // price in CENTS, 1–99 (use no_price for the no side)
  "client_order_id": "<uuid4>" // dedup key; reuse on retry
}
```
Success = `201` with `{"order":{...}}`. Errors: `400` bad params (price must be 1–99), `401` auth, `409` duplicate `client_order_id`, `429` rate limit.

### 6.5 Prices, units, strikes
- Markets return prices as both `*_dollars` strings (e.g. `yes_ask_dollars:"0.0800"`) and `*_fp` fixed-point. `response_price_units:"usd_cent"`. **Balance is in cents.**
- Order book returns **yes bids and no bids only** (a yes bid at X = a no ask at 100−X). Build best-bid/best-ask from both sides.
- Temperature markets expose `strike_type` ∈ {`greater`,`less`,`between`}, with `floor_strike`/`cap_strike`, plus a human `subtitle` (e.g. `"78° to 79°"`). The bucket set for an event tiles the temperature range. `settlement_timer_seconds` (e.g. 3600) is the delay after the data print.

### 6.6 Fees (critical for the edge engine)
- Each **series** carries a `fee_type` and `fee_multiplier`. Observed: weather (`KXHIGH*`) = `quadratic`; jobless/NFP = `quadratic`; **CPI and Fed = `quadratic_with_maker_fees`.**
- Implication: on `quadratic` series, **maker (resting limit) orders are free** and only takers pay — this is the basis of the maker-first thesis. On `quadratic_with_maker_fees` series (CPI, Fed), **makers also pay**, so "maker = free" does **not** hold there.
- Implement the documented quadratic taker fee as the baseline — `fee = ceil( 0.07 × contracts × price × (1 − price) )` in dollars (price in [0,1]) — but **do not hardcode the coefficient**: read `fee_type`/`fee_multiplier` per series, consult the series fee schedule / `contract_terms_url`, and the `Fee Rounding` doc. Provide a `FeeModel` class with unit tests against worked examples. Peak fee is near 50¢; cheapest in the wings — the engine should prefer edges away from 50¢.

---

## 7. Functional requirements (modules)

Build as independent, testable modules with clear interfaces.

### M0 — Client & auth (`client.py`)
- `KalshiClient(env, api_key_id=None, private_key_path=None)`. Public GETs need no creds; authed calls sign per §6.2.
- Methods: `get(path, params)`, `post(path, body)`, `delete(path)`; automatic ms-timestamp, signing of query-stripped path, ret/backoff on 429/5xx, typed errors.
- **Acceptance:** `get_exchange_status()` returns `{exchange_active, trading_active}`; an authed `get_balance()` on demo returns balance in cents; signing unit test reproduces a known message string.

### M1 — Public market data (`markets.py`)
- `list_series(category)`, `get_series(ticker)`, `list_events(series, status)`, `list_markets(series, status)` (auto-paginate), `get_market(ticker)`, `get_orderbook(ticker, depth)`, `get_candlesticks(...)`.
- Normalize prices into a single internal representation (cents int + dollars float) and compute best bid/ask/mid/spread from the yes-bid/no-bid book.
- **Acceptance:** can pull all open `KXHIGHNY` markets for the current event and print a bucket ladder with bid/ask/mid and size.

### M2 — Market-map generator (`market_map.py`)
- Discover the focus universe: weather high-temp city series (`KXHIGH*` whose title starts "Highest temperature") and the macro series in Appendix A.
- For each: pull series metadata (settlement source, frequency, fee_type, prohibitions) and the current open event's bucket structure.
- Output `market_map.json` and a flat `market_map.csv` (one row per series) + optional HTML.
- **Acceptance:** regenerates the Appendix A tables from live data, including settlement source + fee_type per series.

### M3 — Portfolio (`portfolio.py`)
- `get_balance()`, `get_positions()`, `get_orders()`, `get_fills()`. Convert cents→dollars in display.
- **Acceptance:** prints Tom's demo balance and any open orders/positions.

### M4 — Order management (`orders.py`) — demo-guarded
- `place_limit(ticker, side, action, count, price_cents, client_order_id)`, `cancel(order_id)`, `place_maker_quote(...)` helper that prices to rest at/inside best.
- Enforces §3 guardrails: env guard, live-confirmation, bankroll caps, fee-clearance check before submit.
- **Acceptance:** places + cancels a 1-contract resting limit order on **demo**; refuses a prod order unless `--env prod`, `KALSHI_ALLOW_LIVE=1`, and interactive "YES" are all present.

### M5 — Weather signal (`signals/weather.py`)
- Inputs: a city series (e.g. `KXHIGHNY`) and its NWS station/location. Pull Open-Meteo **ensemble** forecasts (GFS + ECMWF members) for the target date's daily max.
- Build an empirical predictive distribution of the daily high from ensemble spread (+ optional bias correction vs recent realized), then integrate into a probability for each market bucket (`greater`/`less`/`between` using floor/cap strikes).
- Output: `{ticker: model_prob}` for every bucket in the event, plus the full predictive distribution.
- **Acceptance:** for a chosen city/date, outputs bucket probabilities that sum to ≈1 across the tiling and a sanity-checked mean vs the ensemble mean. Encodes the Phase-1 hypothesis to test: **markets over-price tail uncertainty (~1.27×)** — expose a knob to compare model vs market implied spread.

### M6 — Macro signal (`signals/macro.py`)
- For CPI, Fed decision, NFP, jobless claims: ingest a public nowcast/consensus (Appendix C) and a release calendar; map to bucket probabilities for the series' contract structure.
- v1 may use consensus + a configurable uncertainty band (normal around consensus) — keep the interface identical to weather so the harness treats them the same.
- **Acceptance:** produces bucket probabilities for the current open CPI and jobless-claims events and records the scheduled release datetime.

### M7 — Edge engine (`edge.py`)
- `FeeModel` (per §6.6, series-aware, unit-tested). `edge(model_prob, market_price, side)` net of fees. `kelly_size(edge, price, bankroll, fraction, caps)` → contracts.
- Produces ranked **recommendations**: ticker, side, model prob, market price, gross edge, fee, net edge, suggested limit price, suggested size, and a suppress flag if net edge < `MIN_EDGE_FEE_MULTIPLE × fee`.
- **Acceptance:** given a market snapshot + model probs, emits a recommendation table; never recommends crossing the spread when a maker fill is viable; respects caps.

### M8 — Paper-trade / backtest harness (`harness.py`) — the core deliverable
- **Live shadow mode:** on a schedule, snapshot market price + model prob for every focus market, log to a tidy trade/observation table, and (in demo) optionally place the recommended maker orders.
- **Backtest mode:** replay candlesticks/history + realized settlement to estimate fee-adjusted P&L (flag look-ahead/overfit risk; prefer the live shadow log as the trustworthy signal).
- Metrics per category: hit rate, **Brier score / calibration curve**, realized vs predicted, gross and **fee-adjusted P&L**, opportunity count, fill-rate assumptions.
- Output: `runs/<date>/observations.parquet` + a summary report (console + HTML) comparing **Weather vs Macro head-to-head**.
- **Acceptance:** after a configurable shadow window, prints a category scorecard sufficient to answer "which category's edge is real, calibrated, and fee-positive?" — the Phase-2 decision gate.

### M9 — CLI & reporting (`cli.py`)
- Commands: `status`, `map` (build market map), `quote <series>` (show ladder), `signal <series>` (show model probs), `recommend <series>` (edge table), `paper-run` (one shadow cycle), `report` (metrics), `balance`.
- Global flags: `--env demo|prod`, `--dry-run` (default true for anything authed-write).

---

## 8. Data model / outputs
- `market_map.json` / `.csv` — series catalog (Appendix A shape).
- `observations.parquet` — columns: `ts, env, series, event, ticker, side, model_prob, predictive_mean, market_bid, market_ask, market_mid, fee_est, gross_edge, net_edge, rec_action, rec_size, placed(bool), demo(bool)`.
- `settlements.parquet` — realized outcomes joined back to observations for scoring.
- `report.html` — calibration curves + fee-adjusted P&L + Weather-vs-Macro scorecard.

---

## 9. Milestones (map to the Phase-2 plan)

| Milestone | Builds | Phase-2 step | Done when |
|---|---|---|---|
| **MS1 — Read & map** | M0, M1, M2 | Step 1 | Market map regenerates from live API; demo balance reads via auth |
| **MS2 — Verify edge on history** | M1 candlesticks + M7 FeeModel + M8 backtest | Step 2 | Re-tests the weather 1.27× uncertainty claim + macro vs nowcast on historical data |
| **MS3 — Capacity & fees** | M7 + report | Step 3 | Per-market spread/depth + fee-cleared-edge report at $50 size |
| **MS4 — Paper-trade & decide** | M5, M6, M8, M9 | Step 4 | N-week live shadow log → calibration + fee-adjusted P&L → Weather-vs-Macro scorecard + go/no-go |

Build MS1 fully first; it's independently useful and de-risks everything after.

---

## 10. Testing & acceptance
- **Unit:** signing (known-message reproducibility), FeeModel (worked examples per series type), Kelly sizing (caps + edge sign), bucket-probability integration (sums≈1, monotonic).
- **Integration (demo):** place + cancel a 1-contract resting limit on `KXHIGHNY`; confirm guardrails block prod.
- **Validation:** calibration (Brier) and fee-adjusted P&L computed over a shadow window; look-ahead checks documented.
- **Definition of done for Step 1 (MS1):** `python -m kalshi_toolkit map` produces the market map; `... balance` returns demo balance; `... quote KXHIGHNY` prints a live bucket ladder.

---

## Appendix A — Verified market map (focus universe, live 2026-06-20)

### A.1 Weather — daily high-temperature city series (settle on NWS Climatological Report, `fee_type: quadratic`, maker-free)
Structure: each day = one **event** (e.g. `KXHIGHNY-26JUN08`); buckets are markets with `strike_type` greater/less/between (e.g. `-T79` = >79°, `-B78.5` = 78–79°). Daily frequency. 1-hour settlement timer after the NWS report.

| Series ticker | Title | Notes |
|---|---|---|
| `KXHIGHNY` | Highest temperature in NYC | Central Park, NWS OKX — **confirmed full structure** |
| `KXHIGHPHIL` | Highest temperature in Philadelphia | |
| `KXHIGHHOU` | Highest temperature in Houston | |
| `KXHIGHTDAL` | Dallas Maximum Temperature | |
| `KXHIGHTOKC` | Oklahoma City Maximum High Temperature | |
| `KXHIGHTNOLA` | New Orleans Max temp Daily | |
| `KXDVHIGH` | Death Valley temperature | extreme-heat niche |
| `KXHIGHUS` | High temp in United States | national max — messier resolution |

> The full `Climate and Weather` category also contains low-temp (`KXLOW*`), snowfall (`KX*SNOW*`), rain, hurricane, and disaster series. **M2 should discover cities dynamically** (filter `KXHIGH*` + title starts "Highest temperature"/"Maximum") rather than hardcode this list; the table is the confirmed seed set. Liquidity concentrates in the largest metros (NYC, Chicago, Miami, Austin, LA, Denver, Philadelphia) — verify depth per city in MS3.

### A.2 Macro / Economics — scheduled, data-resolved series
| Series ticker | Title | Settlement source | Frequency | `fee_type` |
|---|---|---|---|---|
| `KXCPI` | CPI (headline) | Bureau of Labor Statistics | monthly | `quadratic_with_maker_fees` |
| `KXCPICORE` | CPI core | BLS | monthly | (verify) |
| `KXFEDDECISION` | Fed meeting (rate decision) | Federal Reserve | per-FOMC (custom) | `quadratic_with_maker_fees` |
| `KXUSNFP` | US nonfarm payrolls (month) | Trading Economics (BLS print) | monthly | `quadratic` |
| `KXJOBLESSCLAIMS` | Weekly initial jobless claims | Department of Labor | **weekly** | `quadratic` |

> Note the fee asymmetry: **CPI and Fed charge maker fees**, so the maker-free advantage applies to **weather, NFP, and jobless claims**. Weekly jobless claims is attractive for fast iteration (more data points per month). Related macro series exist if needed: `KXCPIYOY`/`CPIYOY` (YoY inflation), `KXECONSTATCPIYOY` (YoY), `RATECUT`/`KXFEDCHGCOUNT` (rate-cut paths), `KXUNRATE`-style unemployment via the jobs report, `KXNGDPQ` (quarterly NGDP), `RECSSNBER` (recession). Verify exact contract structures in M2.

### A.3 Real market example (annotated, for response-shape reference)
From `GET /markets?series_ticker=KXHIGHNY&status=open`:
```
ticker:           KXHIGHNY-26JUN08-T79     // event-strike
event_ticker:     KXHIGHNY-26JUN08         // one day
strike_type:      greater                   // >79°  (floor_strike: 79)
subtitle:         "80° or above"
yes_bid_dollars:  "0.0500"   yes_ask_dollars: "0.0800"
no_bid_dollars:   "0.9200"   no_ask_dollars:  "0.9500"
last_price_dollars:"0.1100"  volume_fp: "1690.01"  open_interest_fp:"1368.26"
settlement_timer_seconds: 3600
rules_primary:    "If the highest temperature recorded in Central Park… > 79°, resolves Yes."
settlement source: NWS Climatological Report (Daily), station OKX/NYC
```

---

## Appendix B — Reference signing snippet (do not expand into the whole client; this is the auth seam)
```python
import base64, datetime
from urllib.parse import urlparse
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

def load_key(path):
    with open(path, "rb") as f:
        return serialization.load_pem_private_key(f.read(), password=None)

def sign(private_key, ts_ms: str, method: str, full_url: str) -> str:
    path = urlparse(full_url).path                      # query stripped
    msg = f"{ts_ms}{method}{path}".encode()
    sig = private_key.sign(
        msg,
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.DIGEST_LENGTH),
        hashes.SHA256(),
    )
    return base64.b64encode(sig).decode()

# headers: KALSHI-ACCESS-KEY=<id>, KALSHI-ACCESS-TIMESTAMP=<ts_ms>, KALSHI-ACCESS-SIGNATURE=<sign(...)>
# ts_ms = str(int(datetime.datetime.now().timestamp()*1000))
```

---

## Appendix C — External signal sources to wire in
- **Weather:** Open-Meteo **Ensemble API** (`/v1/ensemble`, free, no key) — GFS + ECMWF members for daily max temp; pair with recent NWS realized highs for bias correction. METAR airport obs optional for late-day updates.
- **Macro nowcasts/consensus:** Cleveland Fed **Inflation Nowcasting** (CPI/PCE), BLS + BEA **release calendars** (CPI, NFP, GDP dates), DOL weekly claims schedule, CME **FedWatch** (implied FOMC probabilities) as a cross-check for `KXFEDDECISION`. Optional: Truflation real-time inflation index.
- All of the above are free/public; v1 needs no paid subscriptions.

---

## Appendix D — Open questions for Tom (resolve before/with MS1)
1. **Cities:** start weather modeling on which metros? (Recommend the most liquid first — NYC + 2–3 others — verified in MS3.)
2. **Shadow window length** for the Step-4 decision (recommend 3–4 weeks; weekly jobless claims gives faster macro reads).
3. **SDK vs thin client** preference (recommend thin client).
4. **Reporting surface:** console + HTML is the default; want anything pushed to a file Tom opens, or a simple local dashboard?
5. Confirm **demo API keys** are generated at `demo.kalshi.co` (separate from the funded prod account) for all MS1–MS4 order tests.
