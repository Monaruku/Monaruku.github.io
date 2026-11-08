# Monaruku

A personal home for projects, writing and photography, built with Jekyll and hosted on GitHub Pages.

## Sections

| Section | Path | Description |
|---------|------|-------------|
| Work | `/work/` | Projects, case studies and launch links |
| Writing | `/blog/` | Game reviews, thoughts & ideas |
| Photography | `/photography/` | Street, event and nature albums, on digital and film |
| Tarot | `/tarot/` | Tarot readings & card meanings |
| MH Wilds | `/mhw/` | Local hunter-profile dashboard |
| Budget | `/budget/` | Offline-first budget tracker PWA (MYR) with iOS Shortcuts logging |
| About | `/about/` | Personal info |
| CV | `/resume/` | Career details and a print-friendly resume |

## Photography — adding an album

Albums use an uncropped photo grid with a manual [PhotoSwipe](https://photoswipe.com/getting-started/) lightbox for swipe, zoom and keyboard navigation. This suits mixed portrait/landscape photos and lets visitors browse at their own pace. PhotoSwipe runs as native JavaScript modules within Jekyll; no additional build system or backend is required. An autoplay carousel would hide most photos and require extra [playback and accessibility controls](https://www.w3.org/WAI/tutorials/carousels/).

1. Export web copies from your photo editor, typically JPEG at 2400 pixels on the longest edge. Keep originals elsewhere. Optional thumbnails around 900 pixels on the longest edge make album pages load faster. Preserve the same composition and aspect ratio in both exports.
2. Create a folder such as `assets/photography/your-album/` and add those exports. In GitHub's browser interface, open `assets/photography/`, choose **Add file → Upload files**, and drag in the folder. GitHub supports [up to 100 files per upload and 25 MiB per file](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).
3. Copy `_photo_albums/_template.md` to `_photo_albums/your-album.md`. In GitHub, you can copy the template's raw text, then use **Add file → Create new file** in `_photo_albums/` and paste it.
4. Fill in the album details and one `photos` entry per image. Write a short story or reflection below the closing `---`. For event albums, arrange the entries in the order the story unfolds; the gallery and lightbox preserve that order. The first photo becomes the album cover.
5. Change `published: false` to `published: true` only when the entry is ready, then commit the images and album entry to the site's publishing branch. GitHub Pages rebuilds the site; the album appears at `/photography/your-album/`. The template itself stays unpublished.

Album fields:

| Field | Value |
|-------|-------|
| `title` | Album title; quote it and escape any internal double quotes as `\"`. |
| `shoot_date` | Known date of the shoot, in `YYYY-MM-DD` format. Omit when unknown; do not use file-copy or scan dates. |
| `date_label` | Optional human-readable date span, such as `June–August 2024`; takes precedence over `shoot_date`. |
| `order` | Number controlling album order; lower numbers appear first. |
| `category` | `street`, `events` or `nature`. This filters whole albums without moving individual photographs. |
| `medium` | `digital` or `film`. Film albums are labelled “Shot on film”; the first film album also appears in the journal header. |
| `location` | Optional location. |
| `summary` | A short introduction for the album card. |
| `published` | `false` keeps an unfinished album out of the normal build. |
| `photos` | Ordered list of photo entries, as shown in the template. |

Each photo needs `src`, its actual exported `width` and `height` in pixels, and descriptive `alt` text. Use local paths beginning `/assets/photography/`; filenames and capitalization must match exactly. Optional `caption` text appears alongside the photo. PhotoSwipe requires dimensions to display and zoom images correctly.

For a smaller preview, add `thumb` plus its actual `thumb_width` and `thumb_height`. If omitted, the original `src`, `width` and `height` are used. A distinct thumbnail with its width also supplies a responsive image candidate automatically; no hand-written `srcset` is needed. Resize without cropping so both versions share an aspect ratio.

The site's upload workflow is through the repository: GitHub Pages serves static files and has no persistent upload endpoint. The [published site size limit is 1 GB](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), so upload curated web exports rather than camera originals.

The collection contains 139 distinct photographs in seven albums, drawn from the owner's eight source folders. At the owner's request, Anime Event and Setapak Central Anime Event are combined as **Anime Event**, retaining all 29 photographs from August–September 2024. The other folder-defined albums remain intact. Only six alternate exports of the same captures were omitted. [Photography sources](assets/photography/SOURCES.md) records the folder mapping and choices. Original files remain outside this repository; the site contains resized JPEGs and thumbnails with descriptive alt text. No capture date is shown for Urban Film because the scan files do not establish one.

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
- Title-sequence design with self-hosted Anton and Barlow fonts, responsive layouts, and accessible controls
