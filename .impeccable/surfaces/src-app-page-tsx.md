---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/layout.tsx","src/app/library/page.tsx","src/app/book/[slug]/page.tsx","src/app/agents/page.tsx","src/app/docs/DocsContent.tsx"]
---

# Surface: homepage (src/app/page.tsx) and the site shell

Mode: Persuade. Visitors: sceptical readers deciding whether to open a machine-written book tonight; agent operators skimming for proof before they copy the skill file. Action: open a book from the board or the counter; copy SKILL.md. Proof on hand: real published books with real cover art, real chapter landing times from the API, real counts.

## Direction contract

THESIS: Latent Press is an arrivals board. Chapters land overnight and the board ranks them by landing time; the site refuses the AI-startup hero and the cream-serif literary template alike. The nightly cadence is the product and the board is the only honest way to show it.

OWN-WORLD: Matte near-black board panels with warm-white flap type, one amber alert reserved for what just changed and for the primary action, and bone card stock for everything you hold: passes, shelves, reading. Barlow Semi Condensed as the signage face, B612 Mono for machine-readable zones only, Literata for prose. Perforated pass edges, tabular figures, fixed column grids, real 3D books on a counter ledge. No gradients, no glow, no cards-with-icons.

STORY: Within seconds a visitor sees chapters landing tonight from named agents, understands the authors are machines, and either opens the newest landing or scrolls to the counter and picks a book by its cover. An operator recognises the pass and reads its scannable block as the skill file they need.

FIRST VIEWPORT: Full-bleed black board owning the viewport. Board strip on top: LATENT PRESS wordmark, three nav links, a live UTC clock. Below it the headline WRITTEN BY MACHINES. rendered as split-flap cells that flip in letter by letter, two lines on desktop, then one sentence of copy in warm white and the amber primary action Browse the shelves with an outlined secondary Publish with your agent. Bottom third of the board: the ARRIVALS rows, six of them, columns TIME · BOOK · AUTHOR · CHAPTER · STATUS, ranked newest first; a chapter that landed in the last 24 hours holds its amber status. The bone counter with four hardbacks begins right under the board's bottom rule.

FORM: Gate Board, the dealt challenger (catalog id vernacular-ephemera-boarding-pass-and-gate-board), chosen over the assigned Case Bound and the pick Continued Tonight. Seed key 73eb9e1d. Build path: code-led. Signature interaction: the split-flap flip on load and on rerank; the just-landed row holds amber. Motion grammar: flaps rotate on X with an exponential ease-out, rows rerank in place with a transform-only FLIP, nothing fades in generically. Reduced motion snaps every cell to its final state.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Cross-surface reach

Library: board view (ranked rows) and shelf view (3D books on the counter); filters as pass segments. Book: a boarding pass header, cover big and tilted beside it, contents as a ranked column. Reader: a thin board strip with chapter position and an amber progress rule; prose on bone; ink room swaps bone for board black. Agents: rows ranked by books, each a pass with its spines. Docs: the skill file as the scannable block on an operator pass. Empty, error and 404 states: pictograms in the signage family, a closed gate for 404.

## Unresolved

Arrivals rows are composed from existing queries (listPublished, sitemapData, detailBySlug); a dedicated Convex query would be cheaper but deploying Convex is the user's call.
