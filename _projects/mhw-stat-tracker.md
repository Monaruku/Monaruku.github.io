---
title: MH Wilds Stat Tracker
year: 2026
role: Design & Development
stack: [Jekyll, Vanilla JS, SVG, REFramework]
cover: /assets/mhw/thumb.png
thumb: /assets/mhw/thumb.png
summary: A privacy-first Monster Hunter Wilds hunter-profile dashboard — quest breakdowns, weapon usage, and crown progress — rendered entirely in the browser from an in-game export.
links:
  live: /mhw/
  source: https://github.com/monaruku/monaruku.github.io
featured: true
order: 3
---

## The problem

Monster Hunter Wilds shows your hunter profile in-game, but there's no official API and no way to view or share those stats outside the game. Community databases only serve static game data. I wanted a page where any hunter could drop in their numbers and get a beautiful, shareable dashboard — without accounts, servers, or anyone's data leaving their browser.

## Approach

The tracker is two halves: a tiny REFramework Lua exporter that runs inside the game and dumps the hunter profile to JSON, and a fully client-side dashboard page that visualizes it. No backend — the whole thing ships as static assets in the same GitHub Pages deploy as the rest of this site.

### In-game data extraction

[mhw_stats_exporter.lua](file:///c:/Users/User/Documents/GitHub/monaruku.github.io/assets/mhw_stats_exporter.lua) reads the game's managed singletons through REFramework: character basics (name, zenny, guild points, playtime), the quest-clear counters per category and per weapon, and per-monster slay/capture counts with size records. It maps internal enums to stable slugs defined in [mhw-data.js](file:///c:/Users/User/Documents/GitHub/monaruku.github.io/assets/mhw/mhw-data.js), which also carries crown thresholds and base sizes so the page can derive gold/silver/mini crowns and real centimeter sizes.

### Dependency-free charts

Every visualization in [mhw.js](file:///c:/Users/User/Documents/GitHub/monaruku.github.io/assets/mhw/mhw.js) is hand-rolled SVG and CSS — no chart library. A shared donut engine drives the weapon-usage and quest-category rings with two-way hover sync between slices and rows; quest categories get column-chart tiles; crown completion shows as animated progress rings; and the hunting log mixes a sortable table with inline data bars.

### Share links without a server

Hunter data compresses into the URL fragment (`deflate-raw` via the Compression Streams API), so copying a share link gives anyone the same dashboard view — bookmarkable, serverless, and private by construction. A local roster in localStorage plus snapshot diffs shows what changed since your last upload.

## Notable details

- Reads nothing until you paste, drop, or link a file — the page makes zero network calls.
- Reduced-motion friendly: every chart animation and micro-interaction respects `prefers-reduced-motion`.
- Responsive from ultrawide down to phones: donut stacks above rows, tile grids rebalance, tables scroll.
- Not affiliated with Capcom; the mod is used at the hunter's own risk.

## What's next

- Crown-checklist view grouped by monster type.
- Optional per-snapshot history graph for returning hunters.
