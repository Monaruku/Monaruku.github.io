---
title: Budget Tracker PWA
year: 2026
role: Design & Development
stack: [Jekyll, Vanilla JS, PWA, IndexedDB]
cover: /assets/budget/icons/icon-512.png
thumb: /assets/budget/icons/icon-512.png
summary: An offline-first, installable budget tracker with iOS Shortcuts deep links — no backend, all data on-device.
cta: Open the app
links:
  live: /budget/
  source: https://github.com/monaruku/monaruku.github.io
featured: true
order: 4
---

## The problem

Good budget tracking apps cost money to use, spending money before tracking my spending. Cheap ones comes with ads sometimes. So why not just vibe-code out of this one. So this is a static site that can acts as a PWA for your budget tracking needs. And it's free and customizable (for me at least)

## Approach

The app lives at [/budget/](file:///c:/Users/User/Documents/GitHub/monaruku.github.io/budget/index.html) as a plain page in the same Jekyll build as the rest of the site — no separate repo, no CI pipeline. It is a hash-routed single-page app in vanilla JS modules with zero dependencies.

### On-device data layer

All state lives in IndexedDB behind a tiny key-value wrapper ([kv.js](file:///c:/Users/User/Documents/GitHub/monaruku.github.io/assets/budget/kv.js)). Money is stored as integer sen (RM1 = 100 sen) so totals are always exact, deletes are soft (30-day purge) so every destructive action has an Undo, and the whole store is versioned for future migrations.

### iOS Shortcuts as the API

There is no backend to call, so the app reads deep-link parameters instead: `#/add?amount=12.50&category=food&autosave=1&uid=…`. Autosave links record a transaction instantly and idempotently — a Shortcut-generated `uid` is remembered for 90 days so automation retries can never double-log, with a 60-second payload-hash fallback for hand-made links. `x-success`/`x-error` support lets Shortcuts chain its own confirmation step after a save. Settings includes a Shortcut Builder that generates these URLs so nobody hand-types them.

### Offline that respects the user

The service worker ([sw.js](file:///c:/Users/User/Documents/GitHub/monaruku.github.io/budget/sw.js)) precaches the app shell under a cache name stamped by Jekyll's `site.time`, so every deploy flips the cache automatically. Updates defer while a half-entered transaction draft exists — the app never reloads out from under the user.

## Notable details

- iOS-native feel: `viewport-fit=cover` with safe-area padding, splash images, per-page `apple-touch-icon`, black-translucent status bar.
- Backup via the native share sheet (`navigator.share` with files) straight to iCloud Drive, with a "days since last backup" nudge that can also drive the Home Screen badge (iOS 16.4+ Badging API).
- Hand-rolled SVG/CSS charts keep the shell small enough that everything precaches.

## What's next

- Transaction editing (currently delete-and-re-add).
- Per-category pace lines in Reports.
- Optional sync via a free KV store for multi-device use.
