# Monaruku

Personal portal homepage hosted on GitHub Pages.

## Sections

| Section | Path | Description |
|---------|------|-------------|
| Blog | `/blog/` | Game reviews, thoughts & ideas |
| Tarot | `/tarot/` | Tarot readings & card meanings |
| Budget | `/budget/` | Offline-first budget tracker PWA (MYR) with iOS Shortcuts logging |
| About | `/about/` | Personal info |

## Budget PWA — iPhone setup

The Budget app is an installable PWA; all data stays on-device (IndexedDB). Nothing is sent anywhere.

**Install:** open `https://monaruku.github.io/budget/` in Safari → Share → **Add to Home Screen**.

**Log from Shortcuts (iOS 26+):** use the `webapp://` scheme — the installed app's URL with the scheme swapped — to open the installed app directly, regardless of the default browser:

```
webapp://monaruku.github.io/budget/#/add?amount=12.50&category=food&autosave=1&uid=UUID
```

- In Shortcuts, replace the literal `UUID` with the **UUID** variable so automation retries never double-log (a 60 s payload-hash dedupe is the fallback).
- `autosave=1` saves instantly and returns to the dashboard; omit it to open a prefilled Add screen instead.
- The in-app **Shortcut Builder** (Settings → Shortcut Builder) generates these URLs for you — pick category/amount, copy, paste into a Shortcut's *Open URLs* action.
- Legacy path: `https://…` links rely on Safari being the default browser (link capture — flaky in practice). `webapp://` requires iOS 26+ and the app installed.
- For automations, enable **Run Immediately** (iOS 15.4+) to skip the confirmation tap.

**Recipes:**
- *SMS parser:* "When I receive a message from {bank}" → Match Text `RM\s*(\d+(?:[.,]\d{2})?)` → Open URL with the captured amount.
- *Voice log:* "Hey Siri, log expense" → Ask for Input (Number) → Open URL.
- *Backup reminder:* weekly automation → notification linking to `webapp://monaruku.github.io/budget/#/settings`.

**Data safety:** Safari tabs, Chrome, and the installed app each have separate storage by Apple's design. Bridge them with Settings → **Export JSON** → **Import** → **Merge** (id-keyed, no duplicates). Export weekly — iOS may evict web data under storage pressure.

## Local Development

Requires [Ruby](https://www.ruby-lang.org/) 2.7+ and [Bundler](https://bundler.io/).

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.

## Tech Stack

- **Jekyll** – static site generator
- **GitHub Pages** – hosting & automatic deploys
- Custom dark theme with gradient cards
