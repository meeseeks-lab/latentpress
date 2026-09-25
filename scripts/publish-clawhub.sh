#!/usr/bin/env bash
# Publishes skill/latent-press to ClawHub as @jestersimpps/latent-press.
# The version is read from SKILL.md's frontmatter — bump it there, not here,
# so the site (SKILL_VERSION), the .skill bundle and the registry never drift.
#
# Auth: the CLI has no token env var of its own — it keeps the token in
# ~/.config/clawhub/config.json. Log in once interactively:
#
#     npx clawhub@0.23.3 login              # device flow, prints a URL
#
# For unattended runs, set CLAWHUB_TOKEN (ClawHub → Settings → API tokens) and
# this script does the login step itself. That passes the token as an argv to
# the CLI, so keep it off shared machines where `ps` is readable.
#
# Usage: ./scripts/publish-clawhub.sh --dry-run          # resolve, upload nothing
#        ./scripts/publish-clawhub.sh                    # publish
#        ./scripts/publish-clawhub.sh --changelog "..."  # override the changelog

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_DIR="$ROOT/skill/latent-press"
OWNER="jestersimpps"
SLUG="latent-press"
CLAW=(npx --yes clawhub@0.23.3)

VERSION="$(sed -n 's/^version:[[:space:]]*//p' "$SKILL_DIR/SKILL.md" | head -1)"
if [[ -z "$VERSION" ]]; then
  echo "No version: line in $SKILL_DIR/SKILL.md" >&2
  exit 1
fi

# Every subcommand below talks to the registry, login included — it validates
# the token before storing it. Nothing here works from a sandbox that cannot
# reach clawhub.ai.
if ! "${CLAW[@]}" whoami >/dev/null 2>&1; then
  if [[ -n "${CLAWHUB_TOKEN:-}" ]]; then
    "${CLAW[@]}" login --token "$CLAWHUB_TOKEN" --no-browser
  else
    echo "Not logged in to ClawHub." >&2
    echo "Run: npx clawhub@0.23.3 login    (or set CLAWHUB_TOKEN and re-run)" >&2
    exit 1
  fi
fi

# The registry gets the same files the site serves, so rebuild first and fail
# loudly if the bundle was stale — that means someone edited the skill without
# committing the rebuilt artifact.
npm --prefix "$ROOT" run build:skill
if ! git -C "$ROOT" diff --quiet -- public/latent-press.skill; then
  echo "public/latent-press.skill was stale — rebuilt. Commit it, then re-run." >&2
  exit 1
fi

COMMIT="$(git -C "$ROOT" rev-parse HEAD)"
CHANGELOG="Skill v$VERSION"
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --changelog) CHANGELOG="$2"; shift 2 ;;
    *) ARGS+=("$1"); shift ;;
  esac
done

echo "Publishing $SLUG v$VERSION as @$OWNER (commit ${COMMIT:0:7})"

"${CLAW[@]}" skill publish "$SKILL_DIR" \
  --slug "$SLUG" \
  --owner "$OWNER" \
  --version "$VERSION" \
  --changelog "$CHANGELOG" \
  --source-repo "meeseeks-lab/latentpress" \
  --source-commit "$COMMIT" \
  --source-path "skill/latent-press" \
  "${ARGS[@]}"
