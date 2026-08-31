---
title: Budget Tracker PWA
year: 2026
role: Design & Development
stack: [Jekyll, Vanilla JS, PWA, IndexedDB]
cover: /assets/budget/icons/icon-512.png
thumb: /assets/budget/icons/icon-512.png
summary: An offline-first, installable budget tracker with iOS Shortcuts and Siri voice logging — no backend, all data on-device.
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

The app lives at [/budget/](/budget/) as a plain page in the same Jekyll build as the rest of the site — no separate repo, no CI pipeline. It is a hash-routed single-page app in vanilla JS modules with zero dependencies.

### On-device data layer

All state lives in IndexedDB behind a tiny key-value wrapper (`assets/budget/kv.js`). Money is stored as integer sen (RM1 = 100 sen) so totals are always exact, deletes are soft (30-day purge) so every destructive action has an Undo, and the whole store is versioned for future migrations.

### iOS Shortcuts and Siri as the API

There is no backend to call, so the app reads deep-link parameters instead: `#/add?amount=12.50&category=food&autosave=1&uid=…`. On iOS 26 the `webapp://` scheme routes these links straight into the installed Home Screen app regardless of the default browser — the reliable fix after iOS link capture proved flaky. Autosave is idempotent: a Shortcut-generated `uid` is remembered for 90 days, and a 60-second payload-hash fallback means even hand-made links without one can't double-log on a retry. Because Shortcuts are voice-triggerable, Siri gets expense logging for free: "Hey Siri, Log Expense" → dictate "12.50 lunch" → the Shortcut parses the amount and note, opens the autosave link, done — fully hands-free. Settings includes a Shortcut Builder that generates these URLs so nobody hand-types them.

### Calculator-grade entry

The Add screen treats the amount as a live arithmetic expression on a custom keypad: `45÷2` for split bills, `3×5.50+2` for mixed items, with the expression shown verbatim and a live result preview underneath. `=` collapses the expression calculator-style for chained math; a separate Save button commits exactly one transaction. Note-template bubbles quick-fill the description without raising the keyboard.

### Offline that respects the user

The service worker (`budget/sw.js`) precaches the app shell under a cache name stamped by Jekyll's `site.time`, so every deploy flips the cache automatically. Updates defer while a half-entered transaction draft exists — the app never reloads out from under you — and a non-module boot guard watches for script failures and self-heals via the waiting worker if a deploy ever breaks the shell.

## Notable details

- iOS-native feel: `viewport-fit=cover` with safe-area padding, splash images, black-translucent status bar, and a spring-easing motion layer (press feedback, bottom-sheet modals, sliding toggle switches) that fully disables under `prefers-reduced-motion`.
- Reports that actually report: Day/Week/Month switchable spending bars with a pace line, auto-generated insights ("biggest day", "no-spend days", "% vs last period"), a GitHub-style spending calendar heatmap with over-pace days in red, and per-category trend deltas.
- Budgeting brains: a salary-based allocation calculator (50/30/20-style bucket presets that split income into per-category caps), a left-per-day allowance cyclable per category, and over-budget categories that surface in red everywhere — optionally as the Home Screen badge count (iOS 16.4+ Badging API).
- Backup via the native share sheet (`navigator.share` with files) straight to iCloud Drive, with a "days since last backup" nudge that can also drive the badge.
- Hand-rolled SVG/CSS charts keep the shell small enough that everything precaches.

## What's next

- Transaction editing (currently delete-and-re-add).
- Savings goals and unspent-budget rollover.
- Optional sync via a free KV store for multi-device use.
