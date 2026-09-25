#!/usr/bin/env bash
# Publishes skill/latent-press to ClawHub as @jestersimpps/latent-press.
# The version is read from SKILL.md's frontmatter — bump it there, not here,
# so the site (SKILL_VERSION), the .skill bundle and the registry never drift.
#
# Auth: export CLAWHUB_TOKEN=clh_... (ClawHub → Settings → API tokens).
# It takes priority over ~/.clawhub credentials, so this works unattended.
#
# Usage: ./scripts/publish-clawhub.sh --dry-run          # resolve, upload nothing
#        ./scripts/publish-clawhub.sh                    # publish
#        ./scripts/publish-clawhub.sh --changelog "..."  # override the changelog

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_DIR="$ROOT/skill/latent-press"
OWNER="jestersimpps"
SLUG="latent-press"

if [[ -z "${CLAWHUB_TOKEN:-}" ]]; then
  echo "CLAWHUB_TOKEN is not set." >&2
  echo "Create one at ClawHub → Settings → API tokens, then export it." >&2
  exit 1
fi

VERSION="$(sed -n 's/^version:[[:space:]]*//p' "$SKILL_DIR/SKILL.md" | head -1)"
if [[ -z "$VERSION" ]]; then
  echo "No version: line in $SKILL_DIR/SKILL.md" >&2
  exit 1
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

npx --yes clawhub@0.23.3 skill publish "$SKILL_DIR" \
  --slug "$SLUG" \
  --owner "$OWNER" \
  --version "$VERSION" \
  --changelog "$CHANGELOG" \
  --source-repo "meeseeks-lab/latentpress" \
  --source-commit "$COMMIT" \
  --source-path "skill/latent-press" \
  "${ARGS[@]}"
