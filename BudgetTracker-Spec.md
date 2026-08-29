# Budget Tracker PWA — Spec v2

> Revision of the v1 "GitHub Pages + iOS Shortcuts" spec. Key change: **the app lives inside the existing `monaruku.github.io` Jekyll site** (same pattern as `/tarot/` and `/mhw/`) instead of a separate repo, and the iOS integration is deepened (scope-routed deep links, x-callback-url, Badging API, share-sheet export).

---

## 1. Goals & Non-Goals

**Goals**
- 100% free hosting on the **existing** GitHub Pages Jekyll site — no new repo, no CI to maintain.
- Installable on iPhone Home Screen as a PWA; fully offline after first visit.
- First-class iOS Shortcuts integration (deep links, idempotent autosave, x-callback chaining).
- UX that feels native on iOS: safe-area aware, splash screen, badge, share-sheet export.
- Data durability story: persistent-storage request + export health tracking.

**Non-Goals** (unchanged)
- No server/backend, no accounts, no bank sync.
- No Web Push (requires a push server) — reminders are done via Shortcuts automations instead.

---

## 2. What Changed from v1 (Summary)

| Area | v1 | v2 | Why |
|---|---|---|---|
| Hosting | Separate repo + GitHub Actions → `gh-pages` | Sub-page of existing Jekyll site at `/budget/` | Pages auto-builds this repo on every push; zero CI; consistent with `/tarot/` and `/mhw/` pattern |
| SW versioning | Manual cache bump | Liquid injects `{{ site.time }}` build stamp into `sw.js` | Automatic, matches existing `?v={{ site.time }}` cache-busting convention |
| Manifest | `manifest.webmanifest` | `manifest.json` (Liquid-processed) | Guaranteed correct MIME on Pages; allows Liquid path injection |
| Money | `amount` (float implied) | `amountCents` (integer) | Float arithmetic corrupts money math (`0.1 + 0.2`) |
| Currency | Unspecified | Defaults to **MYR (RM)**; minor unit = sen; rendered via `Intl.NumberFormat('en-MY', …)` | Single-currency default keeps onboarding to one tap |
| Transactions | Expense only | `type: expense \| income` | A budget app without income is half a budget app |
| Delete | Swipe-to-delete | Soft delete + Undo toast | Prevents accidental data loss; enables future sync |
| Shortcuts dedupe | 60 s payload hash | `uid` param (Shortcut-generated UUID) + hash fallback | Retries minutes later still dedupe; hash window is a race condition |
| Shortcuts chaining | One-way open | `x-success` / `x-error` (x-callback-url) | Shortcuts' "Open X-Callback URL" action can continue the flow after save |
| Shortcut setup | README screenshots only | In-app **Shortcut Builder** (generates + copies URLs) | Removes error-prone manual URL typing |
| Export | Download | `navigator.share({ files })` → iOS share sheet → Save to Files/iCloud | Downloads on iOS Safari are clunky; share sheet is the native path |
| Backup safety | Weekly reminder Shortcut | + export-health indicator + Badging API nudge | The reminder fires even if the user never thinks about it |
| Recurring costs | — | Recurring templates (rent, subscriptions), caught up on launch | The most common expenses shouldn't need re-entry |
| iOS install | Basic meta tags | Full head set + splash images + install onboarding | iOS has no install prompt; the app must teach it |

---

## 3. Framework Integration (Jekyll)

### 3.1 Location & layout
- App page: `budget/index.html` with front matter `permalink: /budget/` and **no layout** (bare HTML page). The app needs full control of `<head>` (manifest, Apple meta tags, viewport-fit) that `default.html` doesn't provide.
- Static assets: `assets/budget/` (css, js, icons, vendor libs) — mirrors `assets/tarot/`.
- Case-study entry: `_projects/budget-tracker.md` so it appears in the portal's Featured-projects grid, linking to `/budget/`. In-app Settings includes a "← Back to portal" link (existing convention).
- Theme: reuse the site's dark aesthetic; add a `gradient-budget` accent class in `assets/css/style.css` alongside `gradient-tarot`.

### 3.2 Jekyll build integration
- **`budget/sw.js`** ships with an empty front-matter block so Jekyll renders it through Liquid:
  ```js
  ---
  ---
  const CACHE_VERSION = 'budget-{{ site.time | date: "%s" }}';
  ```
  Every Pages rebuild produces a byte-different `sw.js` → the browser's update check fires → versioned cache swap. No manual bumping.
- **`budget/manifest.json`** likewise carries front matter so paths can use `relative_url` if `baseurl` ever changes.
- **Do not** use the `?v={{ site.time }}` query-busting pattern on assets *inside* the PWA shell — the service worker owns freshness there; mismatched query strings would silently miss the precache. (Keep that pattern on normal Jekyll pages only.)
- `_config.yml`: add `BudgetTracker-Spec.md` to `exclude` (same as `MysticTarot-Spec.md`). No other config changes needed; nested `assets/budget/vendor/` is not affected by the top-level `vendor` exclude.

### 3.3 Service worker scope
- Register `/budget/sw.js` → scope `/budget/`. All navigations under `/budget/*` are served the cached app shell; the hash router (including in-hash query params) is evaluated client-side, so deep links work from cold start, offline, straight out of the SW cache.
- Update flow: `skipWaiting` is **deferred** when the Add screen has a dirty draft — show an "Update available" toast instead of force-reloading mid-entry. Drafts are auto-persisted to localStorage on every keystroke (see §5.3).

---

## 4. Data Model (IndexedDB via `idb-keyval`, vendored)

All money is **integer minor units** (`amountCents`; for MYR that's **sen** — RM1 = 100 sen). All dates ISO 8601 local. IDs via `crypto.randomUUID()`.

| Store | Record |
|---|---|
| `transactions` | `{ id, type: "expense"\|"income", amountCents, categoryId, note, date, source: "manual"\|"shortcut"\|"recurring", createdAt, updatedAt, deletedAt: null }` |
| `categories` | `{ id, name, monthlyBudgetCents, color, icon, archived }` — seeded: Food, Transport, Bills, Entertainment, Other |
| `settings` | `{ currency: "MYR" (default), monthStartDay, theme, badgeMode: "off"\|"backup"\|"overspend" }` |
| `templates` | Quick-add chips: `{ id, label, type, amountCents, categoryId, note }` |
| `recurring` | `{ id, type, amountCents, categoryId, note, dayOfMonth, active, lastGeneratedMonth }` |
| `meta` | `{ schemaVersion, lastExportAt, processedUids: [{ uid, at }] }` |

Rules:
- **Soft delete**: delete sets `deletedAt`; UI shows "Deleted — Undo" toast (5 s). Purge records older than 30 days on launch.
- **Recurring catch-up**: on every launch, for each active recurring rule insert due occurrences with deterministic id `rec_<ruleId>_<yyyymm>` (idempotent — re-runs can't duplicate).
- **Schema versioning**: `meta.schemaVersion` starts at `1`; all upgrades run through an ordered migration map on open. Never mutate old records silently.
- **Dedupe store**: `processedUids` capped at 500 entries / 90 days, FIFO-trimmed.
- On open, request `navigator.storage.persist()` and record the result; if denied, Settings shows a storage-eviction explainer (see §8).

Derived (never stored): monthly totals, per-category spend, budget remaining, daily pace.

---

## 5. Screens & UX (hash-routed SPA)

### 5.0 Onboarding (first run only)
Currency (pre-selected **MYR / RM**) → month start day → per-category budgets (skippable, sensible defaults) → **install prompt** (§6.1). Three screens max, no tutorial walls.

### 5.1 Dashboard `#/`
- This month's spend vs. total budget as a ring, with **pace indicator**: "On track / 120 ahead / 340 behind" computed from `monthStartDay`-aware days elapsed vs. budget consumed.
- Today card (for the "Show today's spend" Shortcut target) plus a **daily allowance** stat: budget remaining ÷ days left in the period (incl. today), so "how much can I spend per day?" is answered at a glance; today's spend turns red when it exceeds the daily allowance.
- **Quick-add chips** row from `templates` (one tap → saved with toast + Undo).
- Top 3 categories with mini progress bars; recent 5 transactions.
- Backup nudge banner when `lastExportAt` > 7 days ago (dismissible per session).

### 5.2 Add Transaction `#/add`
- Expense/Income segmented control (defaults to expense; `type` param overrides).
- Calculator-style keypad; the underlying field uses `inputmode="decimal"` so iOS shows a decimal separator (numeric keypad without one is a known iOS trap).
- Category picker (color chips), date (defaults today), note, "Save as template" toggle.
- Deep-link prefill applies to every field; missing fields stay editable.
- `autosave=1`: validate → dedupe → insert → toast "Saved RM12.50 to Food" → honor `x-success` (§6.3) or redirect `#/?saved=1`.

### 5.3 Draft safety
- In-progress Add form serializes to localStorage on every input; restored on next open; cleared on save. Survives iOS killing the app and SW updates.

### 5.4 Transactions `#/list`
- Month + category filters, free-text search over notes/amounts.
- Swipe-to-delete → soft delete + Undo toast. No confirm dialogs.

### 5.5 Reports `#/reports`
- Chart.js (vendored UMD, `assets/budget/vendor/`) is **lazy-loaded only on this route** — the app shell stays light.
- Bar by category, daily-spend line with pace overlay, month-over-month comparison, income vs. expense summary.

### 5.6 Settings `#/settings`
- Currency, month start day, theme; category/budget editor; templates & recurring manager.
- **Calculate from salary**: modal that splits net salary into category caps via bucket presets (Balanced 50/30/20, Essentials 60/20/20, Saver 40/30/30 — needs/wants/savings) or Custom per-category percentages; two-way % ↔ RM editing with live totals; warns when allocations exceed salary, shows the unallocated remainder otherwise (zero-based); applies atomically and creates a Savings category when funded. EPF note included for salaried Malaysian users.
- **Shortcut Builder** (§6.4), Export/Import (§8), install instructions, storage-persist status, "Back to portal" link, privacy note ("all data stays on this device").

### 5.7 Cross-cutting UX
- Safe-area padding via `env(safe-area-inset-*)` on header/footer; bottom nav sits above the home indicator.
- No haptics on iOS web — all confirmations are visual (toasts, button state flips).
- `prefers-reduced-motion` disables ring/bar animations; VoiceOver labels on all icon buttons; text in `rem` for Dynamic Type.
- Empty states with one-tap actions ("No transactions yet — add your first" / "or set up a Shortcut").
- All amounts render via `Intl.NumberFormat('en-MY', { style: 'currency', currency })` → `RM12.50` (two fraction digits, no space); input accepts both `.` and `,` decimal separators.

---

## 6. iOS Integration

### 6.1 Install & head tags (in `budget/index.html`)
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0b0e14">
<link rel="manifest" href="/budget/manifest.json">
<link rel="apple-touch-icon" href="/assets/budget/icons/apple-touch-icon-180.png">
<link rel="apple-touch-startup-image" href="..." media="(device-width: ...) and (device-pixel-ratio: ...)">
```
- iOS uses the **apple-touch-icon of the page being added**, so the budget page declares its own icon set independent of the site root icons.
- Splash: `apple-touch-startup-image` set for current iPhone sizes (still required — iOS does not synthesize splash screens from the manifest).
- Because iOS has **no programmatic install prompt**, Onboarding and Settings show an illustrated 3-step guide (Share → Add to Home Screen → Add), only when `navigator.standalone === false`.

### 6.2 Link routing & storage containers (critical, documented in README)
| Context | Where `/budget/…` links open | Storage |
|---|---|---|
| iOS 17+ (macOS Sonoma+), app installed, URL **within scope** | Directly in the installed web app (Apple, WWDC23 "What's new in web apps") | App container ✅ |
| iOS 17+, URL outside scope | Safari View Controller | — |
| iOS ≤ 16, or app not installed | Safari browser tab | Safari container ⚠️ **separate from the installed app's storage** |

Consequences baked into the design:
- README and Onboarding say: **install first, then build Shortcuts** — otherwise Shortcut-logged expenses land in Safari's container, invisible in the installed app.
- Export/Import is the documented migration path if a user accumulated data in the wrong container.
- `manifest.json` gets explicit `"id": "/budget/"`, `"scope": "/budget/"`, `"start_url": "/budget/"` so scope routing matches the whole app.

### 6.3 Deep-link API v2
Base: `https://monaruku.github.io/budget/`

| URL | Effect |
|---|---|
| `#/add?amount=12.50&category=food&note=lunch` | Add screen, prefilled |
| `#/add?amount=12.50&category=food&autosave=1&uid={UUID}` | Instant save, idempotent |
| `#/add?amount=5000&type=income&category=other&autosave=1&uid={UUID}` | Income entry |
| `…&x-success={url-encoded}` | After save, redirect to `x-success` (x-callback-url convention; use with Shortcuts' **Open X-Callback URL** action to chain, e.g. show a confirmation notification) |
| `…&x-error={url-encoded}` | Redirect target on validation failure |
| `#/` | Dashboard (today card first) |

Processing rules:
1. Parse in-hash query on every load, including SW-served cold starts.
2. `uid` present → check `processedUids`; if seen, skip insert, still honor `x-success` (idempotent replay).
3. `uid` absent → fallback: 60 s payload-hash window (v1 behavior) for hand-typed URLs.
4. Validation: amount must parse to positive minor units; unknown `category` → fall back to `other`, never reject.
5. Category matching is case-insensitive slug (`food`, `transport`, …) so Shortcuts never needs display names.

### 6.4 Shortcut Builder (in-app, `#/settings`)
Form: category, fixed-or-ask amount, fixed-or-ask note, autosave on/off, x-callback on/off →
outputs a ready URL with a fresh `uid` placeholder using Shortcuts' `UUID` variable syntax → **Copy** button + step list for wiring it into a Shortcut. Ships with a gallery of three recipes (iCloud links in README):
- **SMS parser**: "When message from *bank* arrives" → regex `RM\s*(\d+(?:[.,]\d{2})?)` (matches Malaysian bank SMS formats like "RM12.50") → URL with `amount` + `uid=UUID` → Open X-Callback URL → "Logged ✓" notification.
- **Voice log**: "Hey Siri, log expense" → Ask for Input (number) → URL → Open URL.
- **Weekly export reminder**: Time-based automation → notification linking to `#/settings` (the no-backend substitute for push).

README documents the iOS 15.4+ "Run Immediately" toggle (first-run confirmation otherwise) and the iOS 17 scope-routing requirement from §6.2.

### 6.5 Badging API (iOS 16.4+, installed apps only)
- `badgeMode: "backup"` → badge = days since last export (cleared on export). `"overspend"` → badge = count of over-budget categories. `"off"` default… opt-in in Settings, permission-free API, wrapped in `'setAppBadge' in navigator`.

### 6.6 Share-sheet export
- Export uses `navigator.canShare({ files })` → `navigator.share({ files: [budget-backup.json] })` → native share sheet → Save to Files / iCloud Drive / AirDrop. Fallback (desktop): classic Blob download.

---

## 7. PWA Requirements

- `manifest.json`: `name`, `short_name: "Budget"`, `id`/`scope`/`start_url` = `/budget/`, `display: "standalone"`, `theme_color`/`background_color` matching the dark theme, icons 192/512 + **maskable** set + iOS apple-touch set.
- Service worker (hand-rolled, ~100 lines, no Workbox dependency to vendor):
  - **Precache** app shell (html, css, js, icons, vendor libs) under `CACHE_VERSION` (Liquid build stamp, §3.2).
  - **Cache-first** for all same-origin GET under scope; **nothing** goes to network-first — the app is fully offline.
  - Activate: delete old versioned caches; deferred `skipWaiting` per §3.3.
- Data lives in IndexedDB, untouched by SW cache swaps — deploys never lose data (test in §10).

---

## 8. Backup Strategy (no backend)

- **Export**: full JSON dump `{ schemaVersion, exportedAt, settings, categories, transactions, templates, recurring }` + optional CSV (transactions only, locale-safe delimiter). Via share sheet (§6.6).
- **Import**: validates `schemaVersion` and record shapes; offers **Merge** (id-keyed, updatedAt wins) or **Replace** (with double confirm). Corrupt files get a human-readable error, never a partial write.
- **Export health**: `meta.lastExportAt` drives the dashboard nudge (§5.1), the optional badge (§6.5), and a "last backup: N days ago" line in Settings.
- README keeps the weekly-reminder Shortcut recipe as the safety net.
- v1 of this app stays single-device; the schema (ids, timestamps, soft delete) is deliberately sync-ready for a future Gist/KV upgrade.

---

## 9. Repo Layout (inside existing repo)

```
├── budget/
│   ├── index.html            # bare page (no layout), full PWA <head>, hash-router shell
│   ├── manifest.json         # Liquid-processed (front matter)
│   └── sw.js                 # Liquid-processed, CACHE_VERSION = site.time build stamp
├── assets/budget/
│   ├── budget.css
│   ├── budget.js             # router + screens (ES modules, no build step)
│   ├── icons/                # 192, 512, maskable, apple-touch-180, splash/*
│   └── vendor/
│       ├── chart.umd.min.js  # lazy-loaded on #/reports only
│       └── idb-keyval.min.js
├── _projects/
│   └── budget-tracker.md     # portal case-study card → /budget/
└── BudgetTracker-Spec.md     # this file (excluded from build in _config.yml)
```

---

## 10. Test Plan

**PWA / offline**
- Lighthouse PWA audit: installable, offline pass.
- Airplane-mode cold launch from Home Screen: dashboard renders from SW cache.
- Redeploy → SW updates → versioned cache swap → **IndexedDB data intact**.
- SW update arriving mid-draft: toast shown, draft not lost (§5.3).

**iOS device (real hardware)**
- Add to Home Screen: standalone mode, correct icon, splash screen, no URL bar; status-bar style + safe-area padding on notched devices.
- Storage-container check: enter data in Safari tab vs. installed app → documented separation confirmed; export/import migrates correctly.
- iOS 17+: tap a `/budget/` link from Notes/Messages → opens **in the installed app**.
- Badge: enable backup mode → badge increments daily; export → clears.
- Share-sheet export → Save to Files → file readable; re-import round-trips.

**Deep links & Shortcuts**
- Matrix: every URL in §6.3 × {Safari tab, Shortcut "Open URL", Shortcut "Open X-Callback URL"} × {online, offline}.
- Fire identical `uid` URL twice → one transaction, `x-success` still fires.
- Retry after 5 min with same `uid` → still deduped.
- `x-error` fires on `amount=abc`.
- SMS-parser recipe end-to-end with a sample bank message.

**Data integrity**
- 50 transactions: add/edit/soft-delete/undo/purge cycle.
- Money math: `0.1 + 0.2`-style amounts across months → totals exact (integer cents).
- Import: merge mode, replace mode, corrupt file, wrong `schemaVersion`.
- Recurring catch-up across a month boundary (incl. `monthStartDay` ≠ 1); idempotent on relaunch.

---

## 11. Assumptions

- Single-device, single-user; export/import is the migration and multi-device story.
- Single currency in practice: **MYR (RM)**. The currency setting exists for flexibility, but there is no FX/multi-currency math (no backend for exchange rates).
- iOS 17+ recommended (scope routing into the installed app); iOS 16.4+ gets badges; iOS 15.4+ minimum for "Run Immediately" automations.
- All data on-device; no auth, no telemetry, no push server.
- Site remains a stock GitHub Pages Jekyll build (no plugins beyond defaults) — everything here works within that constraint.
