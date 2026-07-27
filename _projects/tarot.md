---
title: Mystic Tarot
year: 2025
role: Design & Development
stack: [Jekyll, Vanilla JS, CSS]
cover: /assets/tarot/card-back.png
thumb: /assets/tarot/card-back.png
summary: A personalized single-page tarot reading experience with a hand-crafted card system and static-site delivery.
cta: Draw your cards
links:
  live: /tarot/
  source: https://github.com/monaruku/monaruku.github.io
featured: true
order: 1
---

## The problem

Most online tarot readings feel either overly gamified or awkwardly clinical. I wanted a small, atmospheric space where someone could ask a question, draw a spread, and read an interpretation that felt considered — without a heavy stack behind it.

## Approach

The whole experience is a single interactive page served by Jekyll on GitHub Pages. There is no backend, no build step, and no framework runtime — every piece is authored by hand so the load stays light and the aesthetic stays cohesive with the rest of the site.

### Card data model

The full deck lives in [cards.js](file:///c:/Users/User/Documents/GitHub/monaruku.github.io/assets/tarot/cards.js) as a plain JavaScript array. Each card carries its arcana, suit, name, and imagery reference, which keeps the reading logic pure data-in / data-out and easy to extend.

### Interpretation engine

[interpretations.js](file:///c:/Users/User/Documents/GitHub/monaruku.github.io/assets/tarot/interpretations.js) maps card + position to a written interpretation, so the same card reads differently in a "past" slot than in a "future" slot. This is where most of the writing lives.

### CSS-first card flip

Card animations in [tarot.css](file:///c:/Users/User/Documents/GitHub/monaruku.github.io/assets/tarot/tarot.css) use pure CSS 3D transforms — no animation library. The reveal timing and easing were tuned by hand to feel deliberate rather than snappy.

## Notable details

- Static-site only: everything ships in the same GitHub Pages deploy as the rest of the portfolio.
- Reduced-motion friendly: the flip and reveal respect `prefers-reduced-motion`.
- Shares design tokens with the site's dark theme, so it feels like a first-party surface rather than an embedded widget.

## What's next

- Save-and-share for readings (URL-encoded state).
- Optional daily-card mode.
- Expanded interpretations with reversed-card context.
