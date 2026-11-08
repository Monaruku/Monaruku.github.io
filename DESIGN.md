---
name: Monaruku
description: A personal anthology in decisive title frames and quiet reading surfaces.
colors:
  ink: "#171b1b"
  paper: "#f5eddc"
  paper-deep: "#e8dec9"
  mustard: "#e0b23c"
  teal: "#146b6e"
  brick: "#a9372b"
  muted: "#535f5b"
  line: "#c5bda9"
  field: "#fffcf5"
  white: "#fff"
  teal-hover: "#0c5254"
  teal-active: "#093e40"
  teal-wash: "#e3ebe3"
  caution: "#78591b"
typography:
  display:
    fontFamily: "Anton, sans-serif"
    fontSize: "clamp(3.3rem, 6.7vw, 6rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Anton, sans-serif"
    fontSize: "clamp(3rem, 6vw, 5.6rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Anton, sans-serif"
    fontSize: "2.3rem"
    fontWeight: 400
    lineHeight: 1.15
  reading-heading:
    fontFamily: "Barlow, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Barlow, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  intro:
    fontFamily: "Barlow, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Barlow, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
  control:
    fontFamily: "Barlow, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
  data-heading:
    fontFamily: "Barlow, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  editorial: "0"
  small-control: "4px"
  control: "6px"
  tool-card: "12px"
  dialog: "16px"
spacing:
  tight: "8px"
  compact: "12px"
  item: "16px"
  group: "24px"
  panel: "32px"
  page: "40px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "11px 22px"
  button-primary-hover:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.paper}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "11px 22px"
  button-ghost-hover:
    backgroundColor: "{colors.paper-deep}"
  button-operate:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.white}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0.65rem 1rem"
  button-operate-hover:
    backgroundColor: "{colors.teal-hover}"
  button-operate-active:
    backgroundColor: "{colors.teal-active}"
  button-operate-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.teal}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0.65rem 1rem"
  button-operate-ghost-hover:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.white}"
  input-intention:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.8rem 1rem"
    width: "100%"
  filter-photo:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.editorial}"
    padding: "0.6rem 1.15rem"
  filter-photo-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  navigation-link:
    textColor: "{colors.ink}"
    padding: "5px 0"
  tool-section:
    textColor: "{colors.ink}"
    padding: "2rem 0"
  title-link:
    typography: "{typography.display}"
---

# Design System: Monaruku

## Overview

**Creative North Star: "The Title Sequence"**

The Title Sequence is a personal anthology told through large condensed titles, decisive color fields and dark structural seams. Mustard, deep teal and brick carry the expressive surfaces; pale paper gives work, writing and personal identity a common ground.

The interior pages lower the volume for reading and operation. Anton names destinations and sections; Barlow carries paragraphs, controls and data. The world is crisp and predominantly flat, with no ornamental grain or glow. Existing artwork supplies the project imagery; the photography archive leads with the owner's photographs and distinguishes actual film from digital captures.

The shared screen system is extracted from the finished Jekyll implementation: `assets/css/style.css`, `assets/css/fonts.css`, the photography, Tarot and MH Wilds stylesheets, and the screen rules in `resume/index.html`. The budget app is expressly excluded. The CV retains a separate A4 print stylesheet; its print typography and monochrome palette are not shared screen tokens.

**Key Characteristics:**

- Large Anton titles paired with readable Barlow text.
- Mustard, deep teal and brick fields on pale paper.
- Dark structural seams and square editorial frames.
- Quiet reading measures and restrained tool controls.
- Short underline feedback with visible keyboard focus.

## Colors

The palette combines warm paper and mustard with dense teal, brick and near-black structural ink. The frontmatter owns exact color values; the names below describe their uses.

### Primary

- **Mustard:** the principal Work title field, photography empty-state field and selected text background.
- **Deep Teal:** the Writing and photography title fields, inline links, tool actions, selected controls and tool focus outlines. The hover and active teal variants belong to tool buttons.

### Secondary

- **Brick:** the Photography entry frame, Tarot's present position and error status text.
- **Caution:** the restrained brown used for Tarot's future position and MH Wilds warning text; it is a status color, not another large title field.

### Neutral

- **Ink:** primary text, structural seams, dark editorial buttons and selected archive filters.
- **Pale Paper:** the site background and reversed type on the title fields.
- **Deep Paper:** code blocks, image wells, quiet hover fills and chart tracks.
- **Muted:** metadata, secondary copy and field strokes.
- **Line:** thin content rules and quiet borders.
- **Field:** the lighter surface for tool inputs, Tarot card fronts and MH Wilds monster cards.
- **White:** text on teal tool controls and the QR code backing.
- **Teal Wash:** the MH Wilds active roster and upload-hover fill.

### Named Rules

**The Color Field Rule.** Use the strong palette as substantial title fields or meaningful interface states. Keep reading surfaces on pale paper.

## Typography

**Display Font:** Anton, with sans-serif fallback.  
**Body Font:** Barlow, with sans-serif fallback.  
**Data-entry fallback:** the MH Wilds JSON textarea uses `ui-monospace, Consolas, monospace`; this is a technical-entry exception, not a display face.

The self-hosted font files provide Anton 400 and Barlow 400, 600 and 700 with `font-display: swap`. Anton is condensed and blunt; Barlow makes the same world readable at paragraph and interface scale. The type sizes are responsive, task-specific roles rather than a fixed mathematical ratio.

### Hierarchy

- **Display:** oversized destination titles in the home frames. Most are uppercase; the Writing and Photography frames have their own responsive sizes.
- **Headline:** index-page titles; project and article titles use the related range `clamp(2.8rem, 5.5vw, 5rem)` at line-height `1.1`.
- **Title:** project-card names. Other section titles use the same Anton voice at sizes appropriate to their container.
- **Reading heading:** Barlow section headings inside project and article prose. Smaller prose headings use `1.35rem/1.4`.
- **Body:** the shared paragraph default. Project and article text is limited to `70ch`; introductions generally use `64–66ch`.
- **Intro:** a larger opening paragraph under the main page title.
- **Label:** dates, metadata and secondary labels. These are ordinary reading labels, not ornamental uppercase kickers.
- **Control:** Barlow semibold for tool actions; the photo-filter variant explicitly uses line-height `1.25`.
- **Data heading:** Barlow bold for MH Wilds section headings. Numeric comparisons use tabular figures where the source specifies them.

The CV screen uses Barlow at `17px/1.65`, Anton for its name and section headings, and a `75ch` summary measure. Photography uses Anton titles and section headings while retaining Barlow for captions and stories.

### Named Rules

**The Two Voices Rule.** Anton names the place; Barlow carries the reading and operation. Article and project body headings use Barlow, while photographic stories retain their existing Anton section headings.

## Layout

The shared outer frame stops at `1440px`. Index pages stop at `1280px`; project and article pages at `1200px`; the Tarot app and CV at `1120px`. Desktop editorial page gutters are `40px`, with `24px` gutters at the main phone breakpoint. The two tools use `32px` gutters, reducing to `20px` on their small layouts.

The extracted spacing steps are recurring values, not an exclusive scale: the build also uses context-specific gaps and padding. Major blocks use generous space; metadata and controls are compact. Two-column archive grids become one column on phones. Project details combine a metadata rail with a reading column before stacking.

The main editorial layout changes at a maximum width of `760px`, with an intermediate adjustment at `1000px` and narrow-screen adjustments at `360px`. Photography becomes one column at `640px`. Tarot changes at `700px` and `400px`; MH Wilds changes at `1000px`, `720px` and `640px`. CV screen rows stack at `700px`. These are existing surface breakpoints, not a new universal grid.

Photography gallery images keep natural height and are not cropped; album covers use contained imagery. Project and article covers may crop within their editorial frames. Charts, selection fans and data grids retain their task-specific responsive arrangements.

The photography title field pairs its teal introduction with a supplied film photograph. On phones the image follows the title and introduction. Street, Events and Nature filter complete albums; source-folder boundaries stay intact. Medium and reliable capture dates belong in the album metadata, with unknown dates omitted. The featured image link uses a mustard focus outline against teal.

## Elevation & Depth

Editorial pages use flat color fields, image wells and rules rather than card shadows. Major seams are `3px` in ink, repeated content rules are `1px` in the line color, and project-card image bottoms use a `6px` ink edge. Tarot cards and the MH Wilds modal retain functional depth.

### Shadow Vocabulary

- **Tarot deck:** `0 8px 20px rgba(23,27,27,.16)`; attached to the stacked, shuffling cards.
- **MH Wilds dialog:** `0 24px 70px rgba(0,0,0,.25)`; separates an open monster dialog from its dimmed backdrop.
- **Dialog backdrop:** `rgba(23,27,27,.7)`; an overlay state, not a resting page surface.

### Named Rules

**The Functional Depth Rule.** Editorial frames have no shadows. Preserve the soft Tarot deck shadow and the MH Wilds dialog shadow only for their existing physical-card and overlay roles.

## Shapes

Editorial title fields, project media, photo filters and CV actions use square geometry. Tool controls use modest rounding: the control token belongs to inputs, action buttons and roster controls; the tool-card token belongs to Tarot cards, MH Wilds monster cards and related tool panels. The dialog token belongs to the monster modal.

Small internal controls use the small-control token. MH Wilds also has local chart-track rounding and a fully rounded delta indicator; those data-specific shapes do not turn the editorial system into pills. Keep arrows and other icons as drawn SVG paths. Preserve image proportions and let borders, field edges and type establish the structure.

## Components

### Buttons

Direct and restrained. Shared editorial actions pair an ink-filled primary button with an outlined transparent alternative, both with a minimum height of `48px`. Primary hover turns teal; ghost hover uses deep paper. The primary action explicitly uses a teal keyboard-focus outline so its reversed paper text does not determine the ring color.

The MH Wilds action button uses the rounded teal tool variant, with a minimum height of `44px`. Tarot uses the same color and radius family with `0.75rem 1.5rem` padding and a `48px` minimum height. Tool hover and active colors deepen; disabled tool buttons use opacity `.55` and a waiting cursor. Tool ghost actions turn teal on hover.

### Chips

Archive filters are square, outlined controls with an ink-filled selected state. Photography uses a `44px` minimum height and work filters use `42px`. MH Wilds roster chips are a separate rounded selection pattern: active chips receive teal borders and teal-wash fill, with dedicated selection and removal buttons.

### Cards / Containers

Editorial project cards have an image, a dark lower image edge and open text below, without an outer floating panel. Reading and data sections use rules to separate content. MH Wilds monster cards use field-colored surfaces, quiet borders and rounded corners; hover changes the border to teal. Tarot preserves its physical card shape and selected outline.

### Inputs / Fields

Tool inputs use the field surface, a muted one-pixel stroke and the control radius. The Tarot question input has a minimum height of `52px`; the JSON textarea has a `144px` minimum height and can resize vertically. Placeholders remain muted but opaque. Focus is a visible teal outline with an offset; status copy uses teal, brick or caution as appropriate.

### Navigation

The shared navigation is an exposed, wrapping list of Barlow semibold links. Its current, hover and keyboard-focus states reveal a full-width `3px` underline. At the main phone breakpoint, the header and identity stack with the navigation still visible. The global focus treatment is a `3px` current-color outline offset by `5px`; photography and the tools provide the observed teal variants, and CV actions use mustard.

### Title links

Large title-frame links reveal a short horizontal bar (`0.8em` wide, `4px` high) from the left on hover and keyboard focus. The transition is `240ms` with the shared ease-out curve. This is feedback on an already visible destination; it does not delay the content.

### Motion and overlays

The title underline and navigation use short state feedback. Tool color changes use `150ms ease`; chart changes use short `180–200ms` transitions. Tarot retains its shuffle and flip sequence as task behavior. Reduced-motion preferences remove Tarot and MH Wilds animation and suppress title/filter transitions; shared scrolling becomes immediate. The PhotoSwipe viewer keeps its own functional dark surround and the site's paper-on-ink caption treatment.

## Do's and Don'ts

### Do:

- **Do** use the shared palette and self-hosted Anton/Barlow pairing for new screen surfaces.
- **Do** retain dark seams for major editorial divisions and lighter rules for repeated reading or data rows.
- **Do** give article and project prose a readable measure and allow the mobile layout to become a clear vertical sequence.
- **Do** preserve visible focus, selected-state text or semantics, and reduced-motion behavior.
- **Do** show supplied artwork honestly and keep personal photography uncropped; record image origins in assets/ASSET-SOURCES.md.
- **Do** use quieter Barlow controls and the existing tool variants within Tarot and MH Wilds.

### Don't:

- **Don't** add ornamental grain, glow, gradients or texture simulations to the title-sequence world.
- **Don't** turn the entire interface into rounded floating cards; the editorial surfaces are flat and square.
- **Don't** use Anton for long paragraphs or dense tool data.
- **Don't** make content depend on an entrance animation or hide destinations behind motion.
- **Don't** fabricate personal photographs, portraits or visual evidence of work.
- **Don't** apply this system to the excluded budget app or replace the CV's dedicated print treatment.

