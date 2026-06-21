# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is (and isn't)

This is a **research-and-prototyping workspace** for a Kalshi prediction-market trading project owned by Tom Panos, not a conventional application codebase. There is **no `package.json`, no build system, no test runner, and no dependency install step.** Nothing here is compiled or deployed by a toolchain in this repo. It contains three kinds of artifact:

1. **Build specs** (markdown) — detailed briefs for a Python toolkit and simulator that **do not exist yet**. They are meant to be handed to Claude Code as implementation briefs.
2. **A self-contained HTML UI prototype** (`PredictSim`) — an interactive React-in-the-browser demo of the simulator, with mock data.
3. **Research artifacts** — HTML reports, a metrics JSON, and a CSV of settled market data.

The whole effort is a phased plan to decide whether a ~$50 Kalshi bankroll has a real, fee-adjusted edge in **Weather (daily high temp)** vs **Macro (CPI/Fed/NFP/jobless claims)** markets before risking capital.

## Layout

```
Prediction Markets/              # research + planning
  research/
    prediction-markets-category-map.html   # Phase-1 category opportunity map
    phase2-steps2-3-findings.html          # Phase-2 edge findings
  phase2_metrics.json            # computed spreads, fees, overround, implied vs realized SD
  settled_nyc_processed.csv      # historical settled KXHIGHNY weather markets (event,subtitle,strike_type,result,last,vol)
  build plans/                   # the two build specs (duplicated from uploads/ below)

Kalshi Strategy Simulator/       # the PredictSim UI prototype
  PredictSim.dc.html             # SOURCE: editable DC component (see "The DC format")
  PredictSim.html                # bundled, self-unpacking standalone build of the same
  PredictSim-print-8yr7kf.dc.html# print-optimized variant
  support.js                     # the DC runtime (GENERATED — see below)
  uploads/                       # the two build specs (the canonical copies)
  _ds/dropdoc-s3-labs-design-system-*/   # the DropDoc / S3 Labs design system
```

## The build specs are the real "source of truth"

Before implementing anything trading-related, read these two specs in `Kalshi Strategy Simulator/uploads/` (also under `Prediction Markets/build plans/`):

- **`kalshi-toolkit-build-spec.md`** — the live Python client/toolkit (`kalshi_toolkit`): auth (RSA-PSS signing), public market data, market map, weather/macro signal modules, fee model, edge engine, paper-trade harness. Python 3.11+.
- **`kalshi-paper-sim-build-spec.md`** — the sandboxed paper-trading simulator (`paper-sim`): virtual wallet + fill-simulation engine that trades fake money against **real** Kalshi production odds. Depends on and imports the toolkit; does not fork it.

These specs encode verified API facts and **non-negotiable guardrails** — honor them rather than re-deriving:
- **Fee asymmetry:** `fee_type: quadratic` (weather, NFP, jobless claims) means **maker/resting-limit orders are free**; `quadratic_with_maker_fees` (CPI, Fed) charges makers too. Never hardcode the fee coefficient — read `fee_type`/`fee_multiplier` per series.
- **Demo-first, no autonomous real-money trades:** order code defaults to the demo base URL; a production order requires `--env prod` **and** `KALSHI_ALLOW_LIVE=1` **and** interactive confirmation.
- **Pessimistic paper trading:** no optimistic maker fills (a resting order only fills when real public trades print through its queue), walk the real book for takers, always apply fees, no look-ahead in live mode.
- **Secrets** (`KALSHI_API_KEY_ID`, the `.key` PEM) come from env/`.env`, never committed.

The simulator's default config (starting cash $50, `maker_fill_model: level1_trade_through`, mark-to-market at bid, quarter-Kelly) is the contract the UI prototype already mirrors.

## The DC (DropDoc Component) format — how the UI prototype works

`PredictSim.dc.html` is the **editable source**. A `.dc.html` file has two parts:
- `<x-dc>…</x-dc>` — an HTML template.
- `<script type="text/x-dc" data-dc-script data-props="…">` — its body is `class Component extends DCLogic { … }`, a **React component written with inline JSX** that is **Babel-transpiled in the browser at runtime**. `data-props` is a JSON schema of editable props (e.g. `startingCash` int, `makerFillModel` enum `level0|level1|level2`, `markToMarket` enum `bid|mid`).

`support.js` is the runtime that makes this work: it loads React 18.3.1, ReactDOM, and `@babel/standalone` **from the unpkg CDN**, parses the `<x-dc>` doc, and mounts the `Component`. **`support.js` is generated** — its header says *"GENERATED from dc-runtime/src/*.ts — do not edit. Rebuild with `cd dc-runtime && bun run build`."* That `dc-runtime` source is **not in this repo**, so do not hand-edit `support.js`; treat it as a black-box runtime.

`PredictSim.html` is the **bundled** counterpart — a single self-contained file that unpacks itself in-browser from a `__bundler/manifest`. It needs no sibling files or local server.

The component is a **self-contained visual demo, not wired to any real API.** It seeds mock markets, fills, an equity curve, and Brier scores, then runs a `setInterval` tick loop (`advance()`) that mutates React state to simulate live trading. Editing trading behavior here changes the demo only — it has no effect on the (unbuilt) Python toolkit.

### Running / viewing

- **`PredictSim.html`** — open directly in a browser. Fully standalone (still needs network for the unpkg CDN + Google Fonts).
- **`PredictSim.dc.html`** — needs `support.js` beside it, so serve the directory rather than `file://`:
  ```
  cd "Kalshi Strategy Simulator" && python3 -m http.server 8000
  # then open http://localhost:8000/PredictSim.dc.html
  ```
- The research files and `_ds` preview/UI-kit HTML are plain static pages — open or serve them the same way.

## Design system (`_ds/dropdoc-s3-labs-design-system-*`)

Any new HTML/UI artifact should follow this system (read its `README.md`). Tokens live in `colors_and_type.css` and `ui_kits/dropdoc/styles.css`; the full token list is in `_ds_manifest.json`. The adherence linter config (`_adherence.oxlintrc.json`, oxlint) enforces, as warnings:
- **No raw hex colors and no raw `px` values** — use design-system `var(--token)` (e.g. `--brand` `#2e9df1`, `--space-4`, `--radius-md`).
- **Fonts limited to Lato (body) and Geist Mono (technical meta: slugs, counts, timestamps).**
- Import design-system components from `index.js`, not component internals.

Brand voice for any copy: calm, understated, sentence case, **no emoji**, no hype words, the middle dot `·` as the only decorative separator.

## Conventions

- The two build specs exist in two locations (`uploads/` and `build plans/`) and are kept identical — update both if you change one.
- All prices/money in the Kalshi domain are **cents (1–99)** internally; display in dollars.
- Development happens on a feature branch (currently `claude/pensive-hamilton-1xskqa`), not `main`.
