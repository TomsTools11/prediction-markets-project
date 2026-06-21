# Kalshi Paper-Trading Simulator — Build Requirements Spec

**Hand this to Claude Code as the build brief.** Companion to `kalshi-toolkit-build-spec.md` — that doc covers the live client, auth, market map, signals, and fee model; this doc covers the **sandboxed simulator** that tests a strategy with **fake money against real Kalshi odds**. Reuse the toolkit's verified API facts, `FeeModel`, and `Strategy` interface; do not duplicate them.

- **Owner:** Tom Panos
- **Purpose:** Forward-test (and optionally backtest) the Weather + Macro strategies against **live production market data** using a **virtual wallet**, so we can measure real, fee-adjusted, calibration-checked edge **before risking the $50**.
- **Language:** Python 3.11+

---

## 0. The core idea (read first)

> **Fake money, real odds.** This is *not* Kalshi's demo environment.

Kalshi's demo env (`demo.kalshi.co`) gives you play money but runs its **own separate, thin order books** — the prices and liquidity are **not** the real production market. So demo is good for testing the *order-placement code path* (auth, payloads, cancels), but it is **useless for validating a strategy**, because you'd be trading against fake odds.

This simulator instead:
1. Reads **real production market data** (prices, order books, trades, settlements) from Kalshi's **public** endpoints — **no auth, no risk**.
2. Runs a **virtual wallet** and a **fill-simulation engine** that matches your virtual orders against the *real* book.
3. **Settles** virtual positions on the **real** market outcome.

The result is paper P&L that tracks what real production trading *would have* done — the trustworthy input to the Phase-2 "which category do we fund?" decision.

---

## 1. Objectives & success criteria

1. Stand up a virtual portfolio (configurable starting cash, default **$50** to mirror reality) that trades against live Kalshi production odds.
2. Simulate **limit (maker/taker)** and **market** orders with **realistic fills** — especially an honest maker-fill model (the #1 way paper trading lies).
3. Apply the **real fee model** so paper P&L is fee-accurate.
4. **Settle** on real market resolution (`status: settled` → `result`), with optional cross-check to the underlying (NWS realized high for weather).
5. Plug in the **same strategy code** that will later run live (shared `Strategy` interface), so sim results transfer.
6. Produce **calibration (Brier) + fee-adjusted P&L + equity curve**, broken out **Weather vs Macro**, from reproducible run artifacts.

**Done = ** Tom can run `paper-sim run --strategy weather --cash 50` for N weeks and get a defensible scorecard answering: *is the edge real, calibrated, and positive after fees and realistic fills?*

---

## 2. Scope

### In scope
- Virtual wallet + accounting (cash, positions, reserves, realized/unrealized P&L).
- Live market-data poller (public prod API): books, trades, candlesticks, status/result.
- Fill-simulation engine: taker book-walk + **conservative maker queue model** (multiple fidelity levels).
- Fee-accurate fills (reuse toolkit `FeeModel`).
- Settlement on real resolution.
- Two run modes: **live forward-test** (primary, trustworthy) and **historical backtest** (secondary, look-ahead-flagged).
- Strategy plug-in interface; metrics + reporting; reproducible run artifacts.

### Out of scope
- Real-money orders (this tool never touches money or auth-write endpoints — by design).
- Polymarket; short-horizon crypto.
- WebSockets (REST polling is enough for daily weather + scheduled macro; leave a seam).

---

## 3. Realism principles (non-negotiable)

Paper trading is only useful if it is **pessimistic where it's uncertain.**

1. **No optimistic maker fills.** A resting limit order may only be filled when real trade prints cross its level *and* exhaust the modeled queue ahead of it (§6). Never assume a resting order fills just because the market touched the price.
2. **Walk the real book for takers.** Marketable orders fill against actual resting depth with real slippage, not at mid.
3. **Fees always applied** per the series' real `fee_type` (maker-free on weather/NFP/jobless; maker-charged on CPI/Fed).
4. **No look-ahead in live mode.** Decisions at time *t* may only use data available at *t*. Backtest mode must explicitly flag look-ahead/overfit risk in every report.
5. **Surface assumptions.** Every report header states the maker-fill model, slippage, latency, and queue assumptions used. Results are only as honest as those settings.
6. **Conservative marks.** Unrealized P&L marks longs at the bid (not mid) by default.
7. **Capacity honesty.** Respect real top-of-book size; a virtual order larger than available depth gets partial fills, not a free full fill.

---

## 4. Tech stack
- Python 3.11+, `requests`, `pandas`, `numpy`, `pydantic`, `typer`/`argparse`, `rich`, `pyarrow` (parquet), `pytest`.
- Storage: parquet + a small `sqlite` (or DuckDB) for the order/fill/position ledger.
- **No `cryptography`/auth required** — the simulator uses only public market-data endpoints. (Auth is optional, later, only to mirror real positions.)
- Reuse `kalshi_toolkit` for the public market-data client, `FeeModel`, market discovery, and the `Strategy` interface (import it; don't fork).

---

## 5. Architecture & data flow

```
                ┌──────────────────────────┐
   live prod →  │  MarketDataPoller (public)│  books / trades / candles / status
   API (no auth)└─────────────┬────────────┘
                              │ snapshots (persisted)
                              ▼
   Strategy.on_tick() ──►  SimulationClock ──►  MatchingEngine  ──►  VirtualWallet
   (model→edge→orders)     (live or replay)     (taker walk +         (cash, positions,
                                                 maker queue)          reserves, P&L)
                              │                        │                    │
                              ▼                        ▼                    ▼
                          SettlementEngine (real result)  ──►  Ledger (sqlite/parquet)
                                                                     │
                                                                     ▼
                                                            Metrics + Reporting
```

**Tick loop (each interval, e.g. 1–5 min for weather, tighter near macro releases):**
1. Poller fetches/persists current book + recent trades + status for each tracked market.
2. MatchingEngine processes **resting** virtual orders against the new trades/book (fills/partials).
3. Strategy is invoked with `(market_state, portfolio)` and returns **OrderIntents** (place/cancel/replace).
4. MatchingEngine applies new marketable intents (taker walk) and rests the rest.
5. SettlementEngine settles any market that flipped to `settled`.
6. Wallet + ledger updated; snapshot row written.

---

## 6. Fill-simulation engine (the heart — build carefully)

### 6.1 Reconstruct the book
Kalshi's orderbook endpoint returns **yes bids and no bids only** (no asks). Derive the two-sided book:
- `yes_ask(level) = 100 − no_bid(level)` and `no_ask = 100 − yes_bid`.
- Best yes ask = 100 − best no bid; best yes bid = best yes bid. Build aggregated price→size ladders for both sides.

### 6.2 Taker fills (market orders, or limits priced through the book)
- Walk resting levels from best inward; fill `min(remaining, level_size)` at each level; accumulate average price.
- Stop at the order's limit price (for marketable limits) or at a `max_slippage_cents` guard (for market orders); leftover either rests (limit) or is cancelled (market, with a warning).
- Apply **taker fee** from `FeeModel`.

### 6.3 Maker fills (resting limit that adds liquidity) — selectable fidelity
Default = **Level 1**. Never default to Level 0.

- **Level 0 — Optimistic (debug only):** fill instantly if priced at/inside best. Unrealistic; must be explicitly enabled.
- **Level 1 — Trade-through with queue (DEFAULT):**
  - On placement, record **queue_ahead = total real resting size at your price** (price-time priority: you're behind everyone already there).
  - As real **public trades** print at a price that would lift/hit your level (a buy order at price P fills when sellers trade at ≤ P), decrement `queue_ahead` by the printed volume.
  - You start filling once cumulative through-volume **exceeds** `queue_ahead`; fill your contracts with the *remaining* through-volume, partial-filling as volume accrues.
  - Grounded entirely in real `/trades` data → conservative and defensible. Maker fee = 0 on `quadratic` series, applied on `quadratic_with_maker_fees` (CPI/Fed).
- **Level 2 — Probabilistic (sensitivity):** estimate per-interval fill probability from observed trade intensity at/near your level (empirical or Poisson), Monte-Carlo across runs to get a fill-rate distribution. Use to bound optimism/pessimism.
- **Optional toxicity flag:** mark a maker fill "adverse" if the mid moves against you within X seconds/intervals — surfaces edge that's really just getting picked off.

### 6.4 Order lifecycle
- Types: `limit` (maker or taker by price), `market`. Sides: `yes`/`no`. Actions: `buy`/`sell`. TIF: GTC default; **auto-cancel at market close/settlement**.
- Support partial fills, cancel (release reserved cash), replace (cancel+new, new queue position).
- **Cash reservation:** a resting buy reserves `price × count` (+ maker fee if applicable) so the wallet can't double-spend.

### 6.5 Latency (optional)
- Config `decision_latency_ms` and `cancel_latency_ms`: delay intents by N ms vs the tick to avoid crediting reactions faster than a human/script could place. Default small but non-zero.

---

## 7. Virtual wallet & accounting
- Mirror Kalshi mechanics: a YES contract bought at price `p` (cents) costs `p`; pays `100` if it resolves YES, `0` if NO. Buying NO at `q` is the short-YES equivalent. Max loss per contract = cost. Prices 1–99.
- Track: `cash`, `reserved` (open buy orders), `positions[ticker] = {side, count, avg_cost}`, `realized_pnl`, `fees_paid`.
- **Unrealized P&L:** mark longs at conservative bid (configurable to mid). Equity = cash + reserved + mark-to-market positions.
- All amounts in **cents** internally; display in dollars. Starting cash configurable (default $50).

---

## 8. Settlement
- Poller watches each tracked market's `status`; on `settled`, read `result` (`yes`/`no`) and pay the wallet: winning contracts → `100` each, losing → `0`; release reserves; realize P&L and log.
- Respect `settlement_timer_seconds` (don't settle before the result is final).
- **Optional underlying cross-check (weather):** compare Kalshi `result` to the realized NWS daily high (via Open-Meteo archive / NWS) and flag mismatches for audit. Kalshi's `result` is the source of truth for payout.

---

## 9. Strategy interface (shared with the live toolkit)
The simulator must be strategy-agnostic. Strategies implement the **same** interface used by the live toolkit so identical code runs in sim and live:

```python
class Strategy(Protocol):
    def on_tick(self, market_state: MarketState, portfolio: PortfolioView) -> list[OrderIntent]: ...
    # MarketState: per-ticker book, recent trades, model_prob (from signals.weather/macro), time
    # OrderIntent: place(ticker, side, action, count, type, limit_price) | cancel(order_id) | replace(...)
```
- Ship two reference strategies that consume the toolkit's signal modules: `WeatherEdgeStrategy` (ensemble bucket probs → maker orders on mispriced buckets, fee-cleared) and `MacroEdgeStrategy` (nowcast → release-outcome orders).
- Strategy must **only** see point-in-time data (enforced by the clock) — no peeking at later ticks/settlement.

---

## 10. Run modes
- **Live forward-test (primary):** schedule a recurring tick (cron/loop) against live prod; persist every snapshot; settle as markets resolve. This is the **trustworthy** mode — no look-ahead, real liquidity. Weekly jobless claims + daily weather give fast feedback.
- **Historical backtest (secondary):** replay persisted snapshots or `/candlesticks` (+ `/historical/...` for archived) with known settlements. Faster iteration but **flag look-ahead/overfit** prominently; candlestick OHLC only approximates intratick book dynamics, so maker fills are less reliable here.
- Both modes share the same MatchingEngine, Wallet, and metrics so results are comparable.

---

## 11. Metrics & reporting
Per strategy/category and overall:
- **Calibration:** Brier score + reliability curve (predicted prob vs realized frequency).
- **P&L:** gross and **net-of-fees**; equity curve; max drawdown; Sharpe-like ratio on daily equity.
- **Trade stats:** trades, fill rate (maker vs taker), avg edge captured vs modeled, slippage, % toxic maker fills.
- **Capacity:** realized fillable size vs desired at $50 scale.
- **Head-to-head:** Weather vs Macro scorecard → the Phase-2 decision input.
- **Outputs:** `runs/<id>/` containing config (assumptions!), `snapshots.parquet`, `orders.parquet`, `fills.parquet`, `positions.parquet`, `settlements.parquet`, and `report.html` (equity curve + calibration + scorecard). Every report header restates the fill/slippage/latency assumptions used.

---

## 12. Data model (ledger)
- `orders`: `id, ts, ticker, side, action, type, limit_price, count, status, queue_ahead_at_place, client_intent_id`
- `fills`: `ts, order_id, ticker, price, count, liquidity(maker|taker), fee, toxic(bool)`
- `positions`: `ticker, side, count, avg_cost, opened_ts`
- `settlements`: `ticker, result, payout, ts`
- `snapshots`: `ts, ticker, yes_bid, yes_ask, no_bid, no_ask, mid, top_sizes, model_prob`
- `equity`: `ts, cash, reserved, mtm, equity`

---

## 13. Milestones
| MS | Builds | Done when |
|---|---|---|
| **PS1 — Wallet + taker sim** | wallet, poller, book reconstruction, taker book-walk, fees, settlement | Can buy/settle a weather bucket vs live odds with fake cash; P&L is fee-correct |
| **PS2 — Maker queue model** | resting orders, Level-1 trade-through fills, cancel/replace, reserves | Resting maker orders fill only on real trade-through; cash reserved correctly |
| **PS3 — Strategy + live loop** | `Strategy` integration, `WeatherEdgeStrategy`, scheduled live forward-test | `paper-sim run --strategy weather --cash 50` runs unattended and logs/settles |
| **PS4 — Metrics + backtest + macro** | reporting, Brier/equity, backtest mode, `MacroEdgeStrategy` | Produces Weather-vs-Macro scorecard from a live shadow window |

Build PS1→PS2 first; the maker model is the crux and everything downstream depends on it being honest.

---

## 14. Testing & acceptance
- **Unit:** book reconstruction (yes_ask = 100−no_bid), taker walk math, **maker queue logic** (no fill until through-volume > queue_ahead), fee application per series type, wallet accounting (reserve/realize/settle conserve cash), Kelly/edge passthrough.
- **Scenario:** synthetic trade tapes → assert deterministic maker fills; oversized order → partial fill; settled market → correct payout.
- **No-look-ahead test:** strategy receiving only ≤t data; assert no access to t+1 in live mode.
- **Reconciliation (later):** once Tom places a few real demo/live maker orders, compare actual fills to the simulator's predicted fills and tune the queue model.
- **Definition of done:** a live forward-test run over ≥1 week emits `report.html` with calibration + fee-adjusted P&L + Weather-vs-Macro scorecard, with assumptions printed.

---

## Appendix A — Maker queue fill model (worked logic)
Resting **buy YES** at price `P`, size `S`:
1. At placement: `queue_ahead = resting_yes_bid_size_at(P)` (you join the back, price-time priority).
2. For each real trade print that executes at price ≤ `P` against the bid (a sell lifting bids at/below `P`), let `v` = printed size:
   - if `queue_ahead > 0`: `consumed = min(v, queue_ahead); queue_ahead -= consumed; v -= consumed`.
   - then `fill = min(v, S_remaining)`; record maker fill at `P`; `S_remaining -= fill`.
3. Fully filled when `S_remaining == 0`; auto-cancel leftover at market close.
- Symmetric for **buy NO** / sells. Use the public `/markets/{ticker}/trades` feed + book deltas to drive steps 2–3. (Conservative: ignores hidden/iceberg and your own queue improvements.)

## Appendix B — Verified API facts this relies on (see toolkit spec §6 for full detail)
- Public, **no-auth** endpoints: `/markets`, `/markets/{t}/orderbook` (yes-bids + no-bids only), `/markets/{t}/trades`, `/markets/{t}/candlesticks` (1/60/1440-min; archived via `/historical/...`), `/markets/{t}` (`status`, `result`, `settlement_timer_seconds`).
- Prices in **cents 1–99**; markets expose `*_dollars` + `*_fp`. Weather buckets: `strike_type` greater/less/between (`floor_strike`/`cap_strike`).
- Fees: `quadratic` (maker-free) for weather/NFP/jobless; `quadratic_with_maker_fees` for CPI/Fed; baseline `ceil(0.07·C·P·(1−P))` — read per-series `fee_type`/`fee_multiplier`.
- Prod base: `https://external-api.kalshi.com/trade-api/v2`. Poll politely; handle 429 with backoff; cache snapshots.

## Appendix C — Config defaults (override via CLI/`.env`)
| Setting | Default | Note |
|---|---|---|
| `starting_cash_usd` | `50` | mirror reality |
| `maker_fill_model` | `level1_trade_through` | never `level0` by default |
| `mark_to_market` | `bid` (conservative) | or `mid` |
| `tick_interval_sec` | `300` weather / `30` near macro release | poller cadence |
| `max_slippage_cents` | `3` | taker guard |
| `decision_latency_ms` | `500` | realism |
| `max_stake_per_market_usd` | `5` | mirror live caps |
| `kelly_fraction` | `0.25` | quarter-Kelly |

## Appendix D — Open questions for Tom
1. **Starting cash:** keep at $50 to mirror reality, or use a larger virtual bankroll (e.g. $1,000) to get cleaner capacity statistics? (Recommend running both.)
2. **Forward-test window** before the go/no-go (recommend 3–4 weeks; weekly jobless claims accelerates macro reads).
3. **Cities** to track for the weather strategy at start (recommend the most liquid: NYC + 2–3 others).
4. Want a **simple local dashboard** (auto-refreshing `report.html`) or are run-artifact files enough?
5. Should the simulator later **mirror your real positions** (read-only auth) so paper and live sit side-by-side? (Out of scope for v1, easy seam to leave.)
