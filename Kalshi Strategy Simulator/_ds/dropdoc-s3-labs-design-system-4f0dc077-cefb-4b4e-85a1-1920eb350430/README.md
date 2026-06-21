# DropDoc / S3 Labs — Design System

This is the design system for **S3 Labs**, a small studio building incredibly simple, inexpensive, and useful software. Every app solves one specific problem; nothing has subscriptions; everything is free or one‑time‑purchase.

**DropDoc** is the first product represented here — a single‑purpose tool that takes an HTML report, sanitizes it, and serves it back at a stable shareable URL (`/r/<slug>`). It's the canonical shape of an S3 Labs app: one page, one input, one output, no account.

---

## Sources this was built from

| Source | What it is | How to reach it |
| --- | --- | --- |
| `goal-report-share/` (local codebase) | The DropDoc production Next.js app — App Router, React 19, Tailwind v4. The source of truth for colors, type, components, and motion. | File‑system mount (may need re‑attaching via Import). |
| `TomsTools11/goal-report-share` (GitHub) | Mirror of the same codebase on GitHub. | `github_get_tree` / `github_import_files` (not pre‑loaded). |
| `uploads/icon.svg` | The DropDoc mark — teardrop sheet of lined paper with peeled corner. Identical to `app/icon.svg`. | `assets/drop-icon-uploaded.svg`. |
| `uploads/1.png` / `uploads/2.png` | Full‑color lockup treatments (mark + wordmark "DROP DOC", two stacked lines). | `assets/logo-lockup-dark.png`, `assets/logo-lockup-light.png`. |

No slide decks, Figma files, or additional brand docs were attached — the codebase *is* the design system.

---

## What's in this folder

| Path | What for |
| --- | --- |
| `README.md` | You are here. |
| `SKILL.md` | Agent‑Skills manifest — lets Claude Code / agents invoke this system. |
| `colors_and_type.css` | All CSS variables (surfaces, text, brand, radii, spacing, shadows, motion, type roles). Copy into any new artifact. |
| `assets/` | Logos (mark + lockup light/dark), brand marks. |
| `preview/` | HTML specimen cards that populate the Design System tab. |
| `ui_kits/dropdoc/` | React (inline JSX) recreation of DropDoc's UI — BrandMark, BrandLockup, Dropzone, ReportsTable, Button, Input, result toasts, plus `index.html` showing a working click‑thru. |

---

## The brand in one sentence

> **DropDoc is a blue teardrop of lined notebook paper with a peeled corner, set on a near‑white page, in Lato.** Everything else flows from that.

---

## Content fundamentals

**Voice.** Calm, competent, and understated. Writes like a thoughtful indie maker, not a SaaS growth blog. Short sentences. No hype words ("revolutionary", "AI‑powered", "seamlessly"). No exclamation points. No em‑dashes replacing commas where a comma works.

**Person.** Second person for instructions to the reader (*"Drop an HTML file, get a shareable URL."*). First person plural is avoided — there is no "we" in the UI.

**Casing.** Sentence case everywhere — buttons, headings, nav. Never Title Case, never ALL CAPS. Brand name is always rendered **DropDoc** (one word, two caps); never "Dropdoc" or "DROP DOC" in body copy (the stacked lockup is the only place uppercase appears).

**Specific examples from the product (verbatim):**

- Hero H1: *"Ship a report. Share a link."* — two short clauses, period between, the second clause rendered in `--text-tertiary` to create tonal rhythm.
- Dropzone lead: *"Drop an HTML file, get a shareable URL in seconds. Your client sees the report exactly as designed — no account, no install."*
- Reassurance line: *"Uploads you make here stay in this tab's report list until you close it. Shareable links keep working after that — the list just resets."* — explains behavior plainly, no euphemism.
- Destructive confirm: *"Delete this report? The shared link will stop working."* — tells you exactly what happens.
- Empty / error states: *"No reports match \"foo\""*, *"Upload failed"* — three words when three will do.

**Patterns to imitate:**

- **Name the action, then the outcome.** "Ship a report. Share a link." "Drop HTML reports here" → "Copy link" → "Copied".
- **Two‑clause headlines** where the second clause is muted — it sets up then reframes without being a sub‑head.
- **Mono font for technical meta** (slugs, filenames, hostnames, counts). Keeps the UI honest.
- **Separator is a middle dot `·` in `--surface-border-strong`**, not an em‑dash, slash, or pipe.

**Do not use:** emoji (not anywhere — the product is polite and quiet), unicode dingbats, decorative punctuation, marketing slogans, feature checklists with green checkmarks, "✨ AI", or the word "effortlessly".

---

## Visual foundations

### Colors
- **Brand:** `#2e9df1` — a clear, friendly blue. Used for the mark, primary buttons, focus rings, link hover, selection, and "copied" confirmations. That's it. It is **not** a background color on large surfaces.
- **Brand soft:** `#c5dff6` — the only place brand appears as a fill on an area larger than a button is this light‑blue tint, used for ghost‑button hover and for the dropzone during drag‑over.
- **Accent‑only colors** (margin rule red `#D85858`, cream `#F2EADA`, tan `#B9A986`) exist **inside the brand mark glyph only**. Do not reuse them elsewhere — they read as brand contamination outside the teardrop.
- **Surfaces** are a tight five‑step neutral ramp: `#ffffff → #fafafa → #f4f4f5 → #e8e8ea → #d4d4d8`. Text uses three ramps: `#09090b / #52525b / #a1a1aa`. Both ramps invert cleanly in dark mode.

### Typography
- **Lato** for everything — a humanist sans with a friendly, slightly warm tone that matches the handcrafted paper metaphor. **Geist Mono** remains for slugs, filenames, counts, timestamps, and any other "identity" value (via Google Fonts CDN). Fall back to `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Lato files are bundled as `.ttf` in `fonts/` (Thin 100, Light 300, Regular 400, Italic 400, Bold 700, Black 900) — `@font-face` declarations live in `colors_and_type.css`.
- Weights in use: **400 body**, **700 bold** for emphasis, buttons, section titles, body titles, and most headings. **900 black** reserved for the display `h1` and the wordmark. **300 light** is a quiet alternative for secondary paragraphs (e.g. the dropzone hint). 100 thin exists but is not currently wired into any token.
- Tracking: display (`36px / 900`) uses `-0.015em`, section heads (`15–17px / 700`) use `-0.005em`, body `0`. Lato already sets a warm baseline — don't over‑tighten.
- Tabular‑nums (`font-variant-numeric`) on every count, time, and slug.

### Spacing & layout
- A single 80rem / `max-w-5xl` (1024px) column, centered, with `px-6` gutters. Nothing ever goes full‑bleed.
- The header is sticky, `h-14` (56px), with `backdrop-blur-xl` on an 80%‑opaque surface‑0 — the only place blur is used.
- Vertical rhythm is generous at the top (`pt-16 pb-10` for the hero) and tighter below (`mb-3` between section head and content).
- Gutters inside cards are `px-5 py-3.5` for rows, `px-8 py-16` for the dropzone.

### Corners
Radii are tight and consistent. `--radius-md 8px` for buttons/inputs, `--radius-lg 12px` for list items and narrow cards, `--radius-xl 16px` for bigger cards, `--radius-2xl 20px` for the dropzone. Nothing pill‑shaped except the "copied" check chip (a `rounded-full` 24px circle). Never `border-radius: 4px` — it looks cheap next to 12px peers.

### Borders, dividers, shadows
- **1px hairlines in `--surface-border`** do almost all the work — cards, inputs, dividers.
- **Dashed border** (`border-dashed`) is reserved for the dropzone and the empty‑results state. It's the *only* place it appears.
- Shadows are nearly absent. When present, they're whisper‑soft (`0 1px 2px rgba(9,9,11,.04)`). **Elevation in this system is signaled by border, surface step, and whitespace — not by shadow.**
- Inner shadows: none.

### Backgrounds & texture
- Primarily flat neutral surfaces. **No photos, no illustrations in UI chrome, no gradients on buttons or cards.**
- One subtle decorative layer: the dropzone has a `22px` diagonal hatch at `opacity-[0.35]` drawn from `--surface-border` — a faint paper/graph feel that ties back to the mark.
- A prepared `.grain` utility (SVG turbulence noise, `mix-blend-mode: overlay`, opacity 0.6) is available for *"warmth on flat surfaces"* when a design needs a hint of paper grain. Use at most once per screen.
- Transparency/blur: only on the sticky header (`bg-[var(--surface-0)]/80 backdrop-blur-xl`). Don't apply blur to modals or cards — the system reads as crisp, not frosted.

### Motion
- Default duration `200ms`, easing `cubic-bezier(0.22, 1, 0.36, 1)` (overshoot‑free ease‑out).
- **`brand-pulse`**: idle breathe on the brand mark in the dropzone — 3.6s, scale `1 → 1.02`, opacity `0.9 → 1.0`. Slow, meditative; the mark feels alive without moving.
- **`ring-expand`**: on drag‑over, two concentric 1px brand rings scale `0.96 → 1.18` and fade out over 1.8s, staggered 0.9s. Signals "ready to receive" without a color flash.
- **`animate-spin`** on an SVG circle for the upload spinner.
- Hover: color transitions on `color` / `background-color` / `border-color` only — no scale, no lift. Press: no transform; the button darkens to `--brand-hover`. "Copied" states swap the button's fg/bg rather than animating.
- Focus: `2px` `--brand-ring` halo + `1px` solid `--brand` border. Never `outline: auto`.

### Icons
- All icons are **inline `<svg>`, 12–13px, stroke‑current, `strokeWidth="1.6"–"1.75"`, round linecaps and joins.** A bespoke set — check, link, external, trash, search — lives inside `app/page.tsx` and mirrored in the UI kit. Size, weight, and terminator style are the only consistency rules — ad‑hoc glyphs are fine as long as they match.
- **No icon font, no Lucide/Heroicons, no emoji.** If you need a glyph that isn't in the set, draw one in the same style.

### Layout rules / fixed elements
- The **header** is sticky at `top-0`, `z-20`, with a backdrop blur. It is the only fixed element.
- The dropzone is the emotional center of every screen — always above the fold, always the largest element.
- Lists render inside a bordered rounded container with `divide-y` rows; the container is `overflow-hidden` so outer radius clips inner hover states.
- Dark mode is automatic via `@media (prefers-color-scheme: dark)` — no toggle.

---

## Iconography

**Source.** All icons are hand‑drawn inline SVGs inside `app/page.tsx`. They are 12–13 px, `stroke-width="1.6"`–`"1.75"`, round caps and joins, filled by `currentColor` so they inherit the parent text color. The result is Feather‑ish but slightly lighter‑weight than Feather's default 2px.

**The set (all copied into `assets/icons/` here):**

- `check.svg` — confirm, "Copied" affordance.
- `link.svg` — copy shareable link.
- `external.svg` — open report in new tab.
- `trash.svg` — delete report.
- `search.svg` — search input leading icon.
- `spinner.svg` — upload in‑progress (paired with `animate-spin`).
- `drop-mark.svg` — the brand mark as a small glyph (teardrop with lines, peeled corner, red margin rule).

**CDN icon libraries are not used.** The set is small enough to hand‑maintain, and the tight stroke + cap style is part of the brand. If you need a glyph that isn't in the set, draw it in the same style. The closest off‑the‑shelf approximation is **Lucide at `strokeWidth={1.75}`** — if you absolutely must reach for one, use that and flag the substitution.

**Emoji.** Never. The product is intentionally polite and restrained; emoji would read as marketing.

**Unicode as icons.** Only one permitted use: the middle dot `·` as a meta separator (e.g. `/r/abc123 · report.html`), rendered in `--surface-border-strong`.

**Logos.** The primary logo is the teardrop **mark** (`assets/drop-icon.svg`). The **lockup** is the mark + the wordmark "DropDoc" in Lato Black (900), letter‑spacing `-.025em`, rendered as a single SVG in `brand-mark.tsx`. Stacked "DROP DOC" lockups (`assets/logo-lockup-*.png`) are secondary — use them for splash/marketing surfaces, not in‑app chrome.

---

## Font substitution note

**Sans:** Lato is the canonical brand face, bundled as `.ttf` in `fonts/`. It was selected after the original proposal (Geist) — Lato's warmer humanist tone better matches the paper/notebook metaphor and S3 Labs' plain‑spoken voice. The full 5‑weight family (100/300/400/700/900, plus italics) is shipped.

**Mono:** No brand mono was specified. We use **Geist Mono** from Google Fonts CDN for technical meta (slugs, timestamps, counts). If you want an offline mono, drop WOFF2s into `fonts/` and update `colors_and_type.css`.

---

## Index

- **Foundations** → `colors_and_type.css`
- **Brand assets** → `assets/`
- **Specimen cards** (shown on the Design System tab) → `preview/`
- **UI kit — DropDoc app** → `ui_kits/dropdoc/index.html`
- **Agent skill manifest** → `SKILL.md`

> One product, one kit for now. If S3 Labs ships a second app, add `ui_kits/<product>/` and follow the same shape.
