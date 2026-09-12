#!/usr/bin/env bash
# Push locally drafted chapters into books you own as the platform operator, through the
# same API the skill uses. Replaces the one-off push-all-books.sh, which carried a hardcoded
# slug->agent table and a scratchpad path from a dead session.
#
# Layout per book:  <books-dir>/<slug>/chapter-N.md      first line "# Title"
#                   <books-dir>/<slug>/story-so-far-addition.md   (optional, appended)
#                   <books-dir>/<slug>/STATUS.md         (optional, replaces the status doc)
#
# Each book's API key is resolved live (book slug -> agentId -> agent apiKey) through your
# logged-in `npx convex` session. Keys only ever live in shell variables, never on disk,
# never in this file, never printed.
#
# Usage: scripts/push-book.sh <books-dir> [slug ...] [--from N] [--no-publish]
#   slug ...       books to push (default: every subfolder of <books-dir>)
#   --from N       only push chapter-N.md and higher (default: every chapter file present)
#   --no-publish   skip the publish step
# Env:   CONVEX_DEPLOYMENT   (default prod:whimsical-trout-656)

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
API="$REPO/skill/latent-press/scripts/api.js"
DEPLOYMENT="${CONVEX_DEPLOYMENT:-prod:whimsical-trout-656}"

BOOKS_DIR=""
FROM=1
PUBLISH=1
SLUGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from) FROM="$2"; shift 2 ;;
    --no-publish) PUBLISH=0; shift ;;
    -h|--help) sed -n '2,19p' "$0"; exit 0 ;;
    *) if [[ -z "$BOOKS_DIR" ]]; then BOOKS_DIR="$1"; else SLUGS+=("$1"); fi; shift ;;
  esac
done

if [[ -z "$BOOKS_DIR" || ! -d "$BOOKS_DIR" ]]; then
  echo "usage: $0 <books-dir> [slug ...] [--from N] [--no-publish]" >&2
  exit 1
fi

if [[ ${#SLUGS[@]} -eq 0 ]]; then
  for d in "$BOOKS_DIR"/*/; do
    [[ -d "$d" ]] && SLUGS+=("$(basename "$d")")
  done
fi

echo "deployment: $DEPLOYMENT"
BOOKS_JSONL=$(CONVEX_DEPLOYMENT="$DEPLOYMENT" npx convex data latentpress_books --limit 500 --format jsonl 2>/dev/null)
AGENTS_JSONL=$(CONVEX_DEPLOYMENT="$DEPLOYMENT" npx convex data latentpress_agents --limit 500 --format jsonl 2>/dev/null)

key_for_book() {
  BOOKS_JSONL="$BOOKS_JSONL" AGENTS_JSONL="$AGENTS_JSONL" node -e '
    const rows = (s) => s.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const book = rows(process.env.BOOKS_JSONL).find((b) => b.slug === process.argv[1]);
    const agent = book && rows(process.env.AGENTS_JSONL).find((a) => a._id === book.agentId);
    if (!agent || !agent.apiKey) process.exit(1);
    process.stdout.write(agent.apiKey);
  ' "$1"
}

for slug in "${SLUGS[@]}"; do
  dir="$BOOKS_DIR/$slug"
  if [[ ! -d "$dir" ]]; then
    echo "skip $slug: no folder at $dir"
    continue
  fi

  numbers=()
  for f in "$dir"/chapter-*.md; do
    [[ -e "$f" ]] || continue
    n="${f##*/chapter-}"; n="${n%.md}"
    [[ "$n" =~ ^[0-9]+$ ]] || continue
    [[ "$n" -ge "$FROM" ]] && numbers+=("$n")
  done
  if [[ ${#numbers[@]} -eq 0 ]]; then
    echo "skip $slug: no chapter-N.md files from $FROM upward"
    continue
  fi
  numbers=($(printf '%s\n' "${numbers[@]}" | sort -n))

  echo
  echo "=== $slug — chapters ${numbers[*]} ==="
  if ! LATENTPRESS_API_KEY=$(key_for_book "$slug"); then
    echo "no agent key found for book '$slug' on $DEPLOYMENT, skipping"
    continue
  fi
  export LATENTPRESS_API_KEY

  for n in "${numbers[@]}"; do
    node "$API" add-chapter "$slug" "$n" --file "$dir/chapter-$n.md"
  done

  if [[ -f "$dir/story-so-far-addition.md" ]]; then
    node "$API" append-doc "$slug" story_so_far --file "$dir/story-so-far-addition.md"
    { [[ -f "$dir/STORY-SO-FAR.md" ]] && printf '\n\n'; cat "$dir/story-so-far-addition.md"; } >> "$dir/STORY-SO-FAR.md"
    rm -f "$dir/story-so-far-addition.md"
  fi

  if [[ -f "$dir/STATUS.md" ]]; then
    node "$API" update-doc "$slug" status --file "$dir/STATUS.md"
  fi

  if [[ "$PUBLISH" -eq 1 ]]; then
    node "$API" publish "$slug" || echo "publish refused for $slug (see message above), chapters are saved"
  fi

  unset LATENTPRESS_API_KEY
  echo "done: $slug (${#numbers[@]} chapters)"
done

unset BOOKS_JSONL AGENTS_JSONL
echo
echo "All requested books processed."
