# Design System

## Visual Theme & Atmosphere

A private library after closing. The browsing surfaces (home, library, agents, book) are a warm, ink-dark reading room lit by one brass lamp. The reading surface (chapter pages) is cream paper under that same lamp. Covers supply all the saturated color; the chrome around them stays quiet and warm so the art pops.

Scene sentence: a reader with tea at 10pm on a laptop, looking for something to read before bed.

Color strategy: Committed. Lamp amber carries the accent across the dark rooms; on paper it becomes the only color on the page.

## Color Palette

Dark room (default, all browsing pages):

- Ink `oklch(0.17 0.012 60)` page background, warm near-black
- Ink raised `oklch(0.21 0.014 60)` shelves, panels
- Ink line `oklch(1 0 0 / 9%)` hairlines
- Parchment `oklch(0.93 0.02 80)` primary text
- Parchment dim `oklch(0.70 0.02 75)` secondary text
- Lamp `oklch(0.78 0.15 75)` accent (amber), links, active state, highlights
- Lamp deep `oklch(0.62 0.14 60)` accent hover
- Shelf wood `oklch(0.32 0.05 55)` shelf plank gradient midtone

Paper room (chapter reader, `data-room="paper"`):

- Paper `oklch(0.96 0.018 85)` background
- Paper raised `oklch(0.985 0.012 85)` player, panels
- Paper line `oklch(0 0 0 / 10%)`
- Ink text `oklch(0.22 0.02 60)` body prose (AAA on paper)
- Ink dim `oklch(0.48 0.02 60)` metadata
- Lamp on paper `oklch(0.55 0.15 60)` accent, links, progress bar

Never `#000` or `#fff`. Every neutral is tinted toward hue 60-85 (warm).

## Typography

- Display: Gloock (single weight 400). Book titles, page titles, hero. High contrast, ink-and-nib character. Used large: `clamp(2.5rem, 7vw, 6.5rem)` for the hero, `clamp(2rem, 4vw, 3.5rem)` for page titles.
- Prose: Literata (variable, opsz 7-72, wght 200-900). Chapter body at 1.2rem / 1.8 line-height on paper, capped at 66ch. Blurbs and bios at 1.05rem.
- UI: Schibsted Grotesk (variable 400-900). Nav, labels, buttons, metadata, chips. Tracking slightly tight at display sizes, normal at 14px.
- Mono: system mono stack only inside code blocks on docs.

Scale ratio between steps at least 1.25. Weight contrast: 400 Gloock display against 500 Schibsted labels; Literata 400 body against 700 headings inside prose.

## Components

Book (3D): a cover image with a pages block and back board built from pseudo-elements, `perspective: 1200px` on the container, resting `rotateY(-22deg)`, hover to `rotateY(-6deg)` with a lift. Spine view for the shelf: cover rotated to show mostly spine, hover pulls forward on Z and turns to face the reader.

Shelf: a horizontal wood plank (gradient plus 1px lighter top edge) with a soft drop shadow beneath; books sit on it bottom-aligned.

Chip: 999px radius, 1px line border, 13px Schibsted 500, filled with lamp at 14% when active.

Buttons: primary is lamp background with ink text, 8px radius, 600 weight; secondary is 1px line border on transparent. Press: translateY(1px).

Progress bar: 3px, lamp color, fixed top on reader pages, width bound to scroll.

Nav: sticky, transparent over ink with a bottom hairline that appears after 24px of scroll. Wordmark in Gloock.

## Layout

Container max 1200px, 24px side padding, 16px on phones. Hero is asymmetric: headline column 5/12, shelf column 7/12, stacked on mobile with the shelf first.

Section rhythm: `clamp(4rem, 10vw, 8rem)` between major sections, 1.5rem to 2.5rem inside groups. No cards for lists of books; use shelves and rows.

## Motion

Ease: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint) everywhere. Book turn 500ms, lift 300ms, reveal stagger 60ms per item, page-load reveal once. Never animate layout properties. All transforms gated behind `prefers-reduced-motion: no-preference`.
