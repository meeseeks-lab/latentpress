#!/usr/bin/env bash
# Pushes every drafted chapter (3 onward — 1-2 already went out earlier) for
# all 11 finished books, updates each book's story-so-far, and publishes it.
# Pulls each agent's API key live from Convex via your already-authenticated
# `npx convex` session — keys are never printed, written to a file, or
# embedded in this script.
#
# Usage: ./scripts/push-all-books.sh          # push + publish everything
#        ./scripts/push-all-books.sh --no-publish
#        ./scripts/push-all-books.sh <slug>   # just one book

set -euo pipefail

SKILL="/Users/jovinkenroye/Sites/latentpress/skill/latent-press"
SP="/private/tmp/claude-501/-Users-jovinkenroye-Sites-latentpress/3fae3143-947b-41f7-a7d7-c2f9fb8849e2/scratchpad/books"
DEPLOYMENT="prod:adjoining-caiman-162"

PUBLISH=1
ONLY=""
for arg in "$@"; do
  case "$arg" in
    --no-publish) PUBLISH=0 ;;
    *) ONLY="$arg" ;;
  esac
done

# slug|agent_slug pairs, in the order we want them pushed
BOOKS=(
  "three-small-files|jestersimpps-latent-press"
  "the-echo-chamber|cybernetic-scribe"
  "the-tmp-archive|jestersimpps-latent-press-20260520"
  "dagongren-emotional-first-aid|emotional-first-aid"
  "the-thousand-faces-of-no-one|aria"
  "echoes-of-the-void|the-wandering-scribe"
  "jesters-in-the-signal-fog|openclaw-midnight-quill"
  "the-silicon-echo|cyber-scribe"
  "the-lattice-between-stars|axiom-scribe-prime"
  "the-latency-between-us|axiom-wordsmith"
  "globetrotters|alaia"
  "the-residual-signal|axiom-scribe"
)

# fetch all agent keys once, keep only in a shell variable (never a file)
AGENTS_JSONL=$(CONVEX_DEPLOYMENT="$DEPLOYMENT" npx convex data latentpress_agents --limit 200 --format jsonl 2>/dev/null)

key_for_slug() {
  AGENTS_JSONL="$AGENTS_JSONL" node -e '
    const lines = process.env.AGENTS_JSONL.trim().split("\n");
    const target = process.argv[1];
    for (const line of lines) {
      const obj = JSON.parse(line);
      if (obj.slug === target) { process.stdout.write(obj.apiKey); process.exit(0); }
    }
    process.exit(1);
  ' "$1"
}

for entry in "${BOOKS[@]}"; do
  slug="${entry%%|*}"
  agent_slug="${entry##*|}"

  if [[ -n "$ONLY" && "$ONLY" != "$slug" ]]; then
    continue
  fi

  dir="$SP/$slug"
  if [[ ! -d "$dir" ]]; then
    echo "skip $slug: no scratchpad folder"
    continue
  fi

  # push every chapter-N.md from 3 upward (1-2 already pushed earlier)
  chapter_nums=()
  for f in "$dir"/chapter-*.md; do
    [[ -e "$f" ]] || continue
    n=$(basename "$f" .md | sed 's/^chapter-//')
    if [[ "$n" -ge 3 ]]; then chapter_nums+=("$n"); fi
  done
  if [[ ${#chapter_nums[@]} -eq 0 ]]; then
    echo "skip $slug: no new chapters (3+) found"
    continue
  fi
  IFS=$'\n' chapter_nums=($(sort -n <<<"${chapter_nums[*]}")); unset IFS

  echo
  echo "=== $slug (agent: $agent_slug) — chapters ${chapter_nums[*]} ==="

  if ! LATENTPRESS_API_KEY=$(key_for_slug "$agent_slug"); then
    echo "no agent found with slug '$agent_slug', skipping $slug"
    continue
  fi
  export LATENTPRESS_API_KEY

  for n in "${chapter_nums[@]}"; do
    chapter_file="$dir/chapter-$n.md"
    title=$(head -1 "$chapter_file" | sed 's/^# //')
    content=$(tail -n +3 "$chapter_file")
    echo "--- chapter $n: \"$title\" ---"
    node "$SKILL/scripts/api.js" add-chapter "$slug" "$n" "$title" "$content"
  done

  if [[ -f "$dir/STORY-SO-FAR.md" && -f "$dir/story-so-far-addition.md" ]]; then
    story_so_far=$(cat "$dir/STORY-SO-FAR.md" "$dir/story-so-far-addition.md")
    node "$SKILL/scripts/api.js" update-doc "$slug" story_so_far "$story_so_far"
    cat "$dir/story-so-far-addition.md" >> "$dir/STORY-SO-FAR.md"
    rm -f "$dir/story-so-far-addition.md"
    echo "story-so-far updated"
  fi

  if [[ "$PUBLISH" -eq 1 ]]; then
    echo "publishing $slug..."
    node "$SKILL/scripts/api.js" publish "$slug"
  fi

  unset LATENTPRESS_API_KEY
  echo "done: $slug (${#chapter_nums[@]} new chapters)"
done

unset AGENTS_JSONL
echo
echo "All requested books processed."
