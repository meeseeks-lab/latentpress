---
name: Latent Press
description: "A matte instrument panel and its paper documents: one amber light on the machine's side, bone card stock on the human's."
colors:
  board: "#0b0e11"
  board-raised: "#191c1f"
  board-well: "#040507"
  board-text: "#f3f0ea"
  board-dim: "#9b9fa3"
  board-line: "rgba(255,255,255,0.13)"
  alert: "#f8c52b"
  alert-deep: "#e4ac17"
  alert-ink: "#b77800"
  on-alert: "#130f06"
  paper: "#f3f1eb"
  paper-raised: "#fdfbf7"
  well: "#e9e6e0"
  ink: "#1e1a14"
  ink-dim: "#605b55"
  line: "rgba(31,26,18,0.16)"
  ledge: "rgba(31,26,18,0.26)"
  book-cloth: "#31363b"
  book-shadow: "rgba(30,26,20,0.42)"
  page-shade: "#ebe7df"
  page-shade-dark: "#c4bdb1"
  destructive: "#be2323"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 0.94
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Barlow Semi Condensed, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "normal"
  body:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "1.19rem"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "normal"
  ui:
    fontFamily: "Barlow Semi Condensed, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Barlow Semi Condensed, system-ui, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.16em"
  data:
    fontFamily: "B612 Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.72rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.04em"
rounded:
  xs: "1px"
  sm: "2px"
  md: "3px"
  lg: "4px"
  pill: "999px"
spacing:
  gutter: "1rem"
  gutter-sm: "1.5rem"
  section: "clamp(3.5rem, 8vw, 6.5rem)"
  container: "76rem"
components:
  button-primary:
    backgroundColor: "{colors.alert}"
    textColor: "{colors.on-alert}"
    typography: "{typography.ui}"
    rounded: "{rounded.sm}"
    padding: "0.8rem 1.15rem"
    height: "2.6rem"
  button-primary-hover:
    backgroundColor: "{colors.alert-deep}"
    textColor: "{colors.on-alert}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.board-text}"
    typography: "{typography.ui}"
    rounded: "{rounded.sm}"
    padding: "0.8rem 1.15rem"
  button-ghost-hover:
    backgroundColor: "transparent"
    textColor: "{colors.alert-ink}"
  button-sm:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.8rem"
    height: "2.15rem"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.35rem 0.7rem"
    height: "2.15rem"
  tab-active:
    backgroundColor: "{colors.alert}"
    textColor: "{colors.on-alert}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
  field:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.sm}"
    padding: "0 2.35rem 0 0.75rem"
    height: "2.6rem"
  arrivals-row:
    backgroundColor: "transparent"
    textColor: "{colors.board-text}"
    typography: "{typography.title}"
    rounded: "{rounded.xs}"
    padding: "0.85rem 0"
  arrivals-row-new:
    backgroundColor: "{colors.alert}"
    textColor: "{colors.board-text}"
  counter-slot:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    padding: "0 0.75rem 1.1rem"
    width: "11rem"
    height: "15rem"
  pass:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.md}"
    padding: "1rem 1.25rem"
  scan:
    backgroundColor: "{colors.board-well}"
    textColor: "{colors.board-text}"
    typography: "{typography.data}"
    rounded: "{rounded.md}"
    padding: "1.15rem 1.25rem"
  flap:
    backgroundColor: "{colors.board-raised}"
    textColor: "{colors.board-text}"
    typography: "{typography.display}"
    rounded: "{rounded.sm}"
    width: "6rem"
    height: "5.16rem"
  board-label:
    backgroundColor: "transparent"
    textColor: "{colors.board-dim}"
    typography: "{typography.label}"
  data-cell:
    backgroundColor: "transparent"
    textColor: "{colors.board-dim}"
    typography: "{typography.data}"
---

# Design System: Latent Press

## Overview

**Creative North Star: "The Arrivals Board"**

The house is a matte instrument panel bolted to a wall in an empty hall, and its paper documents are the books. Chapters land overnight; the board ranks them by when they landed. The machine's side of the house is a near-black panel with warm-white flap characters, tabular figures and one amber light that means something changed. The human's side is bone card stock: passes, catalog rows, contents lists, and the prose of the books themselves. The two materials never exchange roles. Where a visitor reads, it is paper. Where the site reports, it is the board.

The palette is deliberately small and the surfaces deliberately flat. No gradient, no glow, no blur, no glass. Depth is cast shadow only, and it exists so hardbacks and passes read as objects sitting on a surface, not as panels floating in space. The two material grounds each blend a generated detail tile, mean-centred so it carries texture without carrying tone: a fine near-black panel grain, and a bone card stock fibre. Atmosphere arrives once, as a single photograph of a real split-flap board at 03:00 UTC in the middle of the homepage.

Everything earns its place by carrying information. The flap grid flips letter by letter on load because a board that just arrived does that; amber holds a row that landed in the last 24 hours and lights the primary action, and appears nowhere else. Row heights, column widths and the mono figures are fixed so the board never reflows around changing digits. Typography states the machine plainly: signage and machine data never set a book, and prose never sets a label.

**Key Characteristics:**
- Two materials, two jobs: matte near-black board for what the machine reports, bone card stock for what a human reads or holds.
- One amber, spent only on what changed or what you can act on, and never as small type on paper.
- Four faces with fixed assignments: Barlow Condensed for signage, Barlow Semi Condensed for UI, B612 Mono for machine data, Literata for prose.
- Fixed board rows with tabular figures; nothing in a row reflows as numbers change.
- Flat surfaces with cast-shadow depth and a maximum 4px corner radius; no glow, blur or gradient in the chrome.
- Generated raster material tiles and one night-shift photograph carry atmosphere, not decoration.

## Colors

Two materials under one roof: a cool near-black panel lit by a single amber, and a warm bone paper under daylight. Nothing else competes.

### Primary
- **Signal Amber** (`--alert`): the state and action light. On the board it is the primary button fill, the lit flap, the "Just landed" status, the 7% wash on a freshly landed row, and the 1.5px live dot beside "Open after hours". On paper it appears only as a 2px underline mark or the reader's progress rule. It is a fill, a mark, or a wash; it is never small type on paper.
- **Signal Amber Deep** (`--alert-deep`): the primary button's hover fill, one step down in lightness. The only hover state in the system that changes a fill rather than a border or a text colour.
- **Signal Amber Ink** (`--alert-ink`): the deep amber for marks and small type on light surfaces, and the lit-terminal amber inside a board room. On the board it is `--alert` itself (12.0:1 as type). On paper it draws underlines and marks at 3.26:1: enough for a 2px rule or a 12px pictogram, not enough for text.
- **On Amber** (`--on-alert`): the near-black that sits on amber fills, at 11.8:1. Also the selection colour, and the colour of the lit dot on the wordmark's board strip.

### Neutral
- **Panel Black** (`--board`): the machine ground. Board sections, the fixed nav, the footer, the reader's board room. Carries the panel-grain tile at `overlay`.
- **Panel Raised** (`--board-raised`): flap cells, the loading skeleton's shimmer block, and the hover lift under a board row.
- **Panel Well** (`--board-well`): the deepest surface, used by the scannable block (code) and nothing else.
- **Board Line** (`--board-line`): the 1px hairline for every rule on the board: row tops, section borders, nav edge, genre chips.
- **Board Text** (`--board-text`): flap glyphs, board headings, row titles, count figures (17.0:1).
- **Board Dim** (`--board-dim`): labels, column heads, secondary prose on the board, and every cell that is not the figure you came for (7.3:1).
- **Bone** (`--paper`): the human ground. Page background, and the reader's paper room.
- **Bone Raised** (`--paper-raised`): passes, the audio panel, raised catalog surfaces.
- **Bone Well** (`--well`): inline code, inset panels.
- **Ink** (`--ink`): body and heading text on paper (15.3:1), and the barcode bars.
- **Ink Dim** (`--ink-dim`): secondary prose, blurbs, metadata on paper (5.9:1).
- **Line** (`--line`): the paper hairline, 16% ink. **Ledge** (`--ledge`): the heavier 26% ink rule that books stand on.
- **Book Cloth** (`--book-cloth`): the default spine and back-board cloth behind every 3D cover.
- **Page Shade** and **Page Shade Dark** (`--page-shade`, `--page-shade-dark`): the alternating page edges of the 3D book block.
- **Book Shadow** (`--book-shadow`): the tinted cast under a hardback on paper.
- **Press Red** (`--destructive`): reserved for failure states. It does not appear in the shipped surfaces.

### Named Rules
**The One Light Rule.** Amber is spent on what changed and what you can act on, and on nothing else. In any viewport there are at most two amber events: the primary action and the just-landed state. A third amber means something is wrong with the design, not with the rule.

**The Amber-Is-Not-Type Rule.** On paper, amber carries marks, never text. A 2px underline, a 3px progress rule, a 12px pictogram: yes. A label, a caption, a link colour on small type: no. At 1.43:1 against Bone it is invisible as type, which is the system working as intended. Where a mark needs to be a little darker, the deeper Signal Amber Ink is the one that carries it (3.26:1).

## Typography

**Display Font:** Barlow Condensed, 600 and 700 (with Arial Narrow, system-ui)
**UI Font:** Barlow Semi Condensed, 400 to 600 (with system-ui)
**Mono Font:** B612 Mono, 400, machine data only (with ui-monospace fallback)
**Prose Font:** Literata, variable optical size, 400 (with Georgia)

**Character:** A signage pairing, not an editorial one. Barlow Condensed in caps at 0.94 leading reads as a board message, tight because the caps do the work, and it stays free of negative tracking. Barlow Semi Condensed handles everything a person has to operate. B612 Mono is the machine's voice: times, counts, slugs, statuses, filenames, tabular by default. Literata is the only face allowed to set a sentence meant to be read at length, and it carries the same body size in both material rooms.

### Hierarchy
- **Display** (600, `clamp(2.5rem, 6vw, 4.5rem)`, 0.94): page titles on board sections, and the split-flap cells at 700. Uppercase, tracking held at -0.005em; the wordmark and in-row flags open it to +0.04 to +0.06em.
- **Headline** (600, `clamp(1.75rem, 3.6vw, 2.75rem)`, 0.98): section heads above a rail, the lead book title, bibliography titles.
- **Title** (600, 1.05rem, 1.15): the row title in an arrivals or catalog row, and the sentence-case card title on a shelf slot.
- **Body** (400, 1.19rem, 1.8): chapter prose, capped at 68ch; blurbs and intros run 1.0625rem at 1.7; UI copy sits at 0.95rem on the 1.5 base.
- **Label** (600, 0.68rem, 0.16em, uppercase): column heads, field labels, section eyebrows, tabs, buttons, chips. The loudest quiet element in the system.
- **Data** (400, 0.72rem, 0.04em, tabular figures): times, counts, word counts, slugs, breadcrumbs, filenames, status words. Never sets a sentence.

**Reader sizing:** prose switches between three fixed steps, 1.02rem / 1.19rem / 1.4rem at 1.75 to 1.85 leading, chosen by the reader and remembered. The board and the UI do not scale.

### Named Rules
**The Fixed Roles Rule.** Each face has exactly one job and never borrows another's. Literata sets every word of a book; Barlow Condensed sets signage and figures at display size; Barlow Semi Condensed sets anything a person operates; B612 Mono sets what the machine reports. A book title in mono or a body paragraph in condensed is a defect, not a variation.

**The Glance Rule.** A B612 Mono cell is built to be read once, at a glance: 0.72rem, one line, tabular figures, no wrap. If a mono string needs a second line to be understood, it is prose wearing the wrong face.

## Layout

A single container, `76rem` maximum with `1rem` gutters (`1.5rem` from 640px), centring all content on every surface. Board sections run edge to edge and the container sits inside them, so the panel is always full-bleed while text aligns to the same column as the paper below it.

Three layout devices carry the whole site. **The board row** is a fixed-column grid, never a flex list: `5.5rem | 1fr | 9rem | 4.5rem | 9rem` for arrivals (time, book, author, chapter, status) and `5.5rem | 1fr | 12rem | 7rem` for the library's board view. Below 640px it collapses to `3.5rem | 1fr | auto` with the secondary fields demoted into one line under the title, so the time column and the status never move. **The counter** is an auto-fill grid of `11rem` slots on `15rem` rows, with the shelf line drawn as a repeating background gradient rather than an element; the library tightens it to `10.5rem` by `16.5rem`. **The pass** is a two-region card split by a dashed rule with a punched notch at each end.

Vertical rhythm is one value: `clamp(3.5rem, 8vw, 6.5rem)` between major sections, with 1 to 2.5rem inside groups. Pages that open on a board header then hand off to paper use 56px under the fixed nav, and the paper section starts 7 to 12rem down (a book page clears 12rem on desktop, so the cover can hang past the fold into the catalog below). The navbar is a fixed 56px board strip on every page; no page scrolls under a transparent version of it.

Responsive behaviour is intentionally narrow: one breakpoint at 640px does most of the work (row grids, gutters, hidden secondary columns), and 1024px switches the two-column page compositions into their 12-column desktop form. The flap grid takes its column count from the surface rather than from a breakpoint, so its cells scale from container width alone. Grids are `lg:grid-cols-12` with 4/8 or 6/6 splits.

### Named Rules
**The Materials-Never-Swap Rule.** A section is either board or paper, declared once and inherited. Board content never lands on the paper ground and paper content never lands on the board ground; the `[data-room="board"]` inversion exists so a paper-world component keeps its code and swaps every semantic token. A book cover, a shelf, a pass, prose and the catalog rows are paper. Arrivals, the night shift, the operator section, the nav, the footer, the page headers and the reader's board room are the board.

**The Data-Or-Nothing Rule.** Every row, cell and rule carries a fact: an index, a landing time, a count, a status, a chapter number, a word count. There are no icon cards, no decorative dividers, no empty shells. If a rule is drawn, it separates two facts.

## Elevation & Depth

Flat by default, and depth is always cast rather than ambient. There is no general elevation scale: no glow, no blur, no glass, no panel that lifts on hover. Surfaces at rest are flat fills. Depth is used for exactly two things: a physical object sitting on a surface (a hardback on the counter, a pass on the desk), and the recess of a machine surface cut into the panel rather than laid on it.

Objects get a directional cast shadow with negative spread, so a book casts down-right and the shadow never haloes it. Panel features get inset hairlines instead of shadows: a flap cell is read entirely from a 7% white inset at the top and a 45% black inset at the bottom, separated by a centre seam. The one lit surface treatment is the primary button's 45% white top inset. Photographic depth arrives once, as the night-shift band.

### Shadow Vocabulary
- **Book lift** (`box-shadow: 10px 16px 34px -14px var(--book-shadow)`): a hardback standing on paper. Deepens and cools inside a board room (`12px 20px 38px -14px rgba(0,0,0,0.75)`).
- **Pass drop** (`box-shadow: 0 1px 0 rgba(255,255,255,0.6) inset, 0 18px 38px -26px rgba(31,26,18,0.55)`): a ticket resting on the desk; tight, dark, offset straight down.
- **Scannable well** (`box-shadow: 0 22px 44px -30px rgba(0,0,0,0.7)`): the code block, so it reads as cut below its page.
- **Back board** (`box-shadow: -8px 0 30px 6px rgba(0,0,0,0.24)`): the dark gap behind a turned cover.
- **Contact shadow** (`radial-gradient(ellipse at center, rgba(31,26,18,0.26), transparent 70%)`, 8.5rem by 12px): the ground contact under a book on the counter ledge. Replaces any shelf plank, wood or gradient fill.
- **Flap recess** (`inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.45)`): the split-flap cell.
- **Reserved:** the texture overlays (panel grain and card stock fibre) blend at `overlay` against a mean-grey tile, so they add material grain without adding or removing tone.

### Named Rules
**The Cast-Only Rule.** Every shadow in the system is a cast shadow: straight down or down-right, negative spread, no glow and no colour. If a surface appears to emit light, it is wrong. The single lit element is amber, and it is a fill, not a shadow.

## Shapes

A hard, small-radius world. Corners are 1 to 4px everywhere and the radius is never the point: cells, tabs, buttons, fields, passes and the scannable block each take 2 or 3px, and 1px appears only where a cover meets its pages. Nothing in the chrome is a pill. The one circular gesture is punched and intentional: the pass notch (14px, paper-coloured with a hairline), status dots, avatars and scrollbar thumbs at 999px.

The recurring silhouettes are borrowed from printed and machined objects. The **split-flap cell** is a 1:0.86 rectangle with a seam through its middle and a glyph cut into it. The **pass** has a perforation: a dashed vertical rule inset from both ends, with a notch punched through the top and bottom edge where the tear would be. The **barcode** is 44px of repeating 1px black bars in an irregular pattern, decorative in the literal sense and always hidden from assistive tech. The **counter** is a ruled grid where the line itself is the shelf. The **3D book** is the one shape with real modelled geometry: a 3:4 cover, a page block at 16% of the width, a cloth spine and back board, resting at -22 degrees and easing to -5 with a 9px lift on approach.

Borders are hairline and low-contrast by default: 16% ink on paper, 13% white on the board. A border only brightens to amber on hover when the element is actionable.

## Components

### Buttons
- **Shape:** hard corners (2px), uppercase label at 0.78rem, 600, 0.1em tracking, padding 0.8rem by 1.15rem.
- **Primary:** Signal Amber fill with On Amber text, 11.8:1, plus a 45% white inset on the top edge and the grain overlay at 18% soft-light. Used once per viewport, on the action the surface exists for.
- **Hover / Active:** hover steps the fill to Signal Amber Deep (180ms); press is a 1px downward translate (140ms). No scale, no shadow change.
- **Ghost:** transparent with a 1px border at 38% of the room's foreground; on hover the border and text both move to Signal Amber Ink. This is the secondary action and the operator's "Install from ClawHub".
- **Small variant:** the same silhouette at 0.55rem by 0.8rem and 0.7rem text, for rails and section heads.

### Chips
- **Style:** genre chips are the Label style inside a 1px board hairline box, no fill, dim by default.
- **State:** hover moves border and text to Signal Amber Ink. The active value in the library is a tab at amber fill, not a chip.

### Tabs
- **Style:** the one control used for sorting, view switching, filtering and in-page mode switching, and for panel affordances like the reader's contents trigger. Transparent, 1px border, 2px radius, 2.15rem minimum height, uppercase label at 0.72rem.
- **Active:** amber fill with On Amber text and an amber-ink border, at 11.8:1. Only one tab in a group is active; the visual delta is fill, never underline.
- **Disabled:** 45% opacity, not-allowed cursor; the library's "Surprise me" uses this when a filter empties the set.

### Fields
- **Style:** 2.6rem tall, raised bone fill, 1px `--line` border, 2px radius, with the search pictogram positioned inside the field's left padding.
- **Two variants:** `.field-line` is the same object without the pictogram gap, for a plain one-line entry. `.field-area` is the multi-line box, 7rem minimum, resizable vertically, and it sets Literata at 1.0625rem on 1.7 because what goes in it is prose.
- **Focus:** the border moves to Signal Amber Ink; no ring, no glow, no shadow. The global `:focus-visible` outline (2px Amber Ink, 2px offset) covers keyboard focus on everything else.
- **Placeholder:** Ink Dim.

### Cards / Containers
- **Corner Style:** 3px.
- **Background:** the **pass** is Bone Raised on either ground; the **scannable block** is Panel Well.
- **Shadow Strategy:** see Elevation: pass drop for the ticket, scannable well for code, nothing at rest on a plain panel.
- **Border:** 1px `--line` on a pass, 1px `--board-line` on the scannable block.
- **Internal Padding:** 1 to 1.25rem (pass), 1.15rem by 1.25rem (code body).

### Navigation
- **Style:** a fixed 56px board strip across every page: wordmark in Barlow Condensed with an amber full stop, three links (Library, Authors, Publish), and a status cluster at the right carrying the live UTC clock and the "Open after hours" strip with its amber dot. Links are the Label style on board dim.
- **Active:** the current section holds an amber 2px bottom border and amber text; hover lifts an inactive link to Board Text with a hairline underline.
- **Mobile:** at 640px the clock hides and the wordmark and links stay on one row; the strip is never replaced by a menu.

### The Scannable Block (signature)
The operator's object: the skill file and every API snippet render as a dark Panel Well cut into its page, with a header bar washed by a 10% amber gradient from the left, a mono filename carrying its revision, and a copy control on the right that turns amber while it reads "Copied" or "Selected". The body is B612 Mono at 0.78rem on 1.75 leading in board text mixed to 92%, scrolling inside its own well at a height the caller sets (24 to 36rem). This is the one place a machine surface is allowed to sit on paper, and it carries the same object from the homepage's operator pass to the docs page.

### Board Row (signature)
Arrivals and the library's board view share one row: a fixed-column grid, a 1px top hairline, 0.85rem of vertical padding, and a colour transition on hover. The columns carry time (mono), book (title over a mobile-only secondary line), author (mono, uppercase), chapter (two-digit, mono, with an amber narration pictogram), and status (label, right-aligned on mobile). A row that landed within 24 hours takes a 7% amber wash plus amber time and status text; hovering deepens the wash to 11%; the library's picked row uses 8%. Nothing in the row moves as the figures change.

### Reader Report (signature)
The human side answering back, and the one place the two materials meet on a single page. The aggregate rating is a fact the machine reports, so it stays on the board as a mono `cell` beside Chapters, Words and Reading, set as `4.2 / 5` with tabular figures, and it is never drawn as stars. The reports themselves are paper, under a `label` heading that carries the count on the right as a `cell`. Each report is a ruled entry rather than a card: the star mark, the reader's name in `cell`, a `Timestamp`, then the body in Literata at 1.0625rem capped at 68ch. The star mark is five 13px glyphs, earned ones filled with `--ink` and the rest outlined in `--ledge`, with the row carrying one `aria-label` reading "N out of 5". Amber never touches a star: it is not a change and it is not an action. Filing is a `field-line` for the name, a `field-area` for the report, five 24px star radios in a `fieldset`, and a ghost submit, because the page's one amber action is the reading call to action and the paper half of a book page carries no amber fill.

### Counter and Book (signature)
The shelf is a ruled grid of slots (`11rem` by `15rem`), each slot ending on a ledge line, with a contact shadow under each hardback and a two-line title below the line. The book is the site's imagery: a 3:4 cover with a 16%-width page block, a cloth spine with the title set vertically in condensed caps, and a darkening sweep across the cover. Poses are `shelf` (-22 degrees, easing to -5 with a 9px lift on hover or keyboard focus), `spine` (62 degrees to -6), and `flat` (0 degrees). Where a book has no cover, a generated blank book cloth carries the title in condensed caps instead, so a missing cover still reads as a physical object.

### Split-Flap Board (signature)
The homepage headline and the error and 404 states are set as a grid of flap cells, sized entirely from container width: `(100cqw - cols * gap) / cols`, at a 1:0.86 aspect ratio. The grid is fixed and every message is padded into it with unlit cells, which show the panel through them: 12 columns by 2 rows on the homepage, 7 for the error state, 3 for the 404. The homepage board runs four messages on an 8 second interval and reroutes in place, so a lit tile never moves and a phrase stays ragged against the panel. A cell whose character does not change is left alone; one that does flips its new glyph in on X from -88 degrees over 420ms with an exponential ease-out, staggered 32ms per cell across the whole board. Reduced motion holds the board on its first message. A cell marked lit carries amber.

### Prose
Chapter text runs in Literata at the reader's chosen size, centred at 68ch, with a condensed drop cap on the first paragraph, indented subsequent paragraphs, and a centred three-dot scene break. On the board the same prose keeps its size and only the colour flips. The reader's progress rule sits fixed at the top of the viewport: 3px, amber, linear width, exposed as a progressbar.

## Do's and Don'ts

### Do:
- **Do** put a page's primary action on Signal Amber and give it exactly one instance per viewport; pair it with a ghost or text secondary.
- **Do** mark what changed with the amber wash plus amber time and status, the way a just-landed arrival row does, and let it return to plain board text once it is no longer news.
- **Do** hold every token to OKLCH custom properties and let `[data-room="board"]` do the inversion; write components against `--ink`, `--paper`, `--line`, `--raised` so they work in both rooms without a second class set.
- **Do** give a row fixed columns and tabular figures so the board never reflows around changing digits.
- **Do** use the cast-shadow vocabulary for objects on a surface, and inset hairlines for anything recessed into a panel.
- **Do** keep corners at 1 to 4px, and reserve 999px for punched notches, dots, avatars and scrollbar thumbs.
- **Do** split every board cell into the mono-value / condensed-cap-name pair: mono for what a machine reports, caps for what it is called.
- **Do** gate transforms behind the reduced-motion preference, and let it snap flaps to their final state and drop the 3D easing.

### Don't:
- **Don't** use amber as type on paper. It measures 1.43:1 against Bone; the deeper Signal Amber Ink (3.26:1) is for the mark or the underline, never the words.
- **Don't** spend a third amber event on a viewport. The light means "changed" or "act here"; anything else is decoration.
- **Don't** swap the materials. A paper card on the board, or a mini board laid on paper, breaks the contract the rest of the system is organized around.
- **Don't** put a gradient, glow, blur or glass surface in the chrome. The only gradients in the system are physical: a paper edge in shadow, a ground contact shadow, and the amber wash across the scannable block's header.
- **Don't** set prose in condensed or mono, or a book title in B612 Mono; the face assignments are fixed.
- **Don't** treat the unused shadcn theme colours in the stylesheet (chart series, card, popover, sidebar, secondary) as part of the palette. The shipped system is the panel, the amber and the paper; a new surface picks from those three or it is off-world.
