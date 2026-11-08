# Asset sources

Recorded 2026-11-08 for the title-sequence redesign. Existing media came from the supplied `monaruku/monaruku.github.io` repository (baseline commit `4d02e177ee33039b58e5f990709efeb095b48a10`). “Repository supplied” identifies the immediate source; it does not establish authorship or an upstream license.

## Self-hosted fonts

| Files | Origin and license |
| --- | --- |
| `fonts/anton-regular.ttf` | [Google Fonts: Anton](https://github.com/google/fonts/tree/main/ofl/anton), weight 400. Copyright The Anton Project Authors; SIL Open Font License 1.1 in `fonts/anton-OFL.txt`. |
| `fonts/barlow-regular.ttf`, `fonts/barlow-semibold.ttf`, `fonts/barlow-bold.ttf` | [Google Fonts: Barlow](https://github.com/google/fonts/tree/main/ofl/barlow), weights 400, 600 and 700. Copyright The Barlow Project Authors; SIL Open Font License 1.1 in `fonts/barlow-OFL.txt`. |

Downloaded from the official Google Fonts repository on 2026-11-08. Files are unmodified apart from filenames. Exact download URLs are in [fonts/SOURCES.txt](fonts/SOURCES.txt). The four fonts total 491,448 bytes; [css/fonts.css](css/fonts.css) loads them locally with `font-display: swap`.

## Existing images

Paths below are relative to `assets/`, except where stated. These files were already supplied; the redesign did not generate or acquire them.

| Files | Content and recorded origin |
| --- | --- |
| `PGR/cover.png`, `PGR/background.jpg` | Punishing Gray Raven game imagery, supplied with the existing review. Original download source, creator and license are not recorded. |
| `PGR/orb.png`, `PGR/leaderboard.png` | Game UI screenshots used in the Punishing Gray Raven review. Repository supplied; capture author and upstream license are not recorded. |
| `PGR/rating.png` | Rating graphic accompanying that review. Repository supplied; creator and license are not recorded. |
| `GCG/logo.png`, `GCG/background.jpg` | Girl Cafe Gun logo/game imagery, supplied with the existing review. Original download source, creator and license are not recorded. |
| `GCG/CBT1.png`, `GCG/CBT2.png` | Game UI/profile-frame screenshots used in the Girl Cafe Gun review. Repository supplied; capture author and upstream license are not recorded. |
| `B4B/logo.jpg`, `B4B/banner.jpeg` | Back 4 Blood logo/game imagery, supplied with the existing review. Original download source, creator and license are not recorded. |
| `B4B/Deagle.png` | Gameplay screenshot illustrating the Back 4 Blood review. Repository supplied; capture author and upstream license are not recorded. |
| `mhw/cover.jpg` | Monster Hunter Wilds game key art used as the tracker project's cover. This is game artwork, not a screenshot of the tracker. Original download source and license are not recorded. |
| `mhw/icons/*.png`, `mhw/monsters/*.png`, `mhw/monsters/*.webp` | Weapon and monster imagery supplied with the existing Monster Hunter tracker. Original download sources, creators and licenses are not recorded. |
| `mhw/thumb.png` | Existing illustrative chart artwork. Embedded XMP says `Made with Google AI` and marks it as `trainedAlgorithmicMedia`; the original generation prompt is unavailable. It is not a verified product screenshot. |
| `tarot/card-back.png` | Existing tarot illustration. Embedded XMP says `Made with Google AI` and marks it as `trainedAlgorithmicMedia`; the original generation prompt is unavailable. Before the provenance addition below, it was byte-identical to the repository's `vibe_images/card-back_1781927261.png`. |
| `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `icon-1024.png`, `mstile-*.png` | Existing site identity and launcher images. Repository supplied; original creator and license are not recorded. |

The Mirthful Mayhem project also references an existing remote thumbnail at [itch.io's image CDN](https://img.itch.zone/aW1nLzE0ODI2NjUxLnBuZw==/315x250%23c/MO9eta.png), supplied through `_projects/mirthful-mayhem.md` and associated with the [Pixel Pioneers game page](https://monaruku.itch.io/ggj-2024-mmcq). The repository identifies the user's role as a team member; it does not identify the thumbnail's individual artist or license.

No street or event photographs are supplied yet. The photography section awaits the owner's uploads and album entries; existing game imagery is not presented as personal photography.

## Gallery dependency

The gallery uses self-hosted PhotoSwipe 5.4.4 by Dmytro Semenov under the MIT license. Exact upstream version and distribution paths are recorded in [photography/vendor/photoswipe/SOURCE.txt](photography/vendor/photoswipe/SOURCE.txt), with the license beside it.

## Scope and metadata

Impeccable's `embed-prompt` recorded repository origins in the 60 supported local rasters referenced by the redesigned site: nine review images, the Monster Hunter cover, 14 weapon icons, 34 monster images, the monster fallback image and the tarot illustration. The weapon and monster scope follows the slugs in `mhw/mhw-data.js`. These are origin records, not invented generation prompts or authorship claims.

The installed tool embeds 25 origins directly in PNG/JPEG metadata and stores 35 WebP origins in adjacent `.json` sidecars (including `B4B/logo.jpg`, whose actual format is WebP). Keep those sidecars with their images. Every origin was read back, and the scoped scan returned `SCAN: 60 rasters, 0 missing`. Original compressed image payloads and existing metadata chunks were verified unchanged, including the tarot image's Google AI credit. The 36 unused PNG/JPEG/WebP assets retain their original bytes and have no new sidecars.

Exceptions are explicit: the installed scanner does not support `favicon.ico`, and the itch.io thumbnail is a remote resource; their known origins are recorded above. `budget/` and `assets/budget/` are excluded at the user's request, including the icon referenced by the budget project entry. All 18 budget files were verified unchanged by SHA-256 during the metadata update.
