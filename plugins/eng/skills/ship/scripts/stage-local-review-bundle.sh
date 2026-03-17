#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: stage-local-review-bundle.sh [--dest <dir>]

Copies the portable PR review plugin bundle into the current repo's ship dir.

Options:
  --dest <dir>   Destination directory (default: ${CLAUDE_SHIP_DIR:-tmp/ship}/pr-review-plugin)
  -h, --help     Show this help
EOF
  exit "${1:-0}"
}

SHIP_DIR="${CLAUDE_SHIP_DIR:-tmp/ship}"
DEST_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest)
      DEST_DIR="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage 1
      ;;
  esac
done

if [[ -z "$DEST_DIR" ]]; then
  DEST_DIR="${SHIP_DIR}/pr-review-plugin"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

is_valid_bundle_dir() {
  local dir="$1"
  [[ -f "$dir/scripts/pr-review.sh" ]] && \
  [[ -f "$dir/scripts/generate-pr-context.sh" ]] && \
  [[ -f "$dir/agents/pr-review-local.md" ]] && \
  [[ -f "$dir/agents/pr-review.md" ]]
}

resolve_bundle_source() {
  local candidate=""
  local walk_dir="$SCRIPT_DIR"

  if [[ -n "${PR_REVIEW_BUNDLE_SOURCE:-}" ]]; then
    candidate="${PR_REVIEW_BUNDLE_SOURCE}"
    if is_valid_bundle_dir "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  fi

  while [[ "$walk_dir" != "/" ]]; do
    candidate="${walk_dir}/ci/pr-review"
    if is_valid_bundle_dir "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
    walk_dir="$(dirname "$walk_dir")"
  done

  if [[ -f "${HOME}/.claude/plugins/known_marketplaces.json" ]] && command -v jq >/dev/null 2>&1; then
    candidate="$(
      jq -r '."inkeep-team-skills".installLocation // empty' \
        "${HOME}/.claude/plugins/known_marketplaces.json" 2>/dev/null || true
    )"
    if [[ -n "$candidate" ]]; then
      candidate="${candidate}/ci/pr-review"
      if is_valid_bundle_dir "$candidate"; then
        printf '%s\n' "$candidate"
        return 0
      fi
    fi
  fi

  candidate="${HOME}/.claude/plugins/marketplaces/inkeep-team-skills/ci/pr-review"
  if is_valid_bundle_dir "$candidate"; then
    printf '%s\n' "$candidate"
    return 0
  fi

  return 1
}

SOURCE_DIR="$(resolve_bundle_source || true)"
if [[ -z "$SOURCE_DIR" ]]; then
  echo "Could not locate the portable PR review bundle source" >&2
  echo "Checked: PR_REVIEW_BUNDLE_SOURCE, script-relative repo roots, and ~/.claude/plugins marketplace installs" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST_DIR")"
rm -rf "$DEST_DIR"
cp -R "$SOURCE_DIR" "$DEST_DIR"
find "$DEST_DIR/scripts" -type f -name '*.sh' -exec chmod +x {} +

{
  printf 'source_dir=%s\n' "$SOURCE_DIR"
  printf 'staged_at_utc=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  if git -C "$SOURCE_DIR" rev-parse HEAD >/dev/null 2>&1; then
    printf 'source_git_head=%s\n' "$(git -C "$SOURCE_DIR" rev-parse HEAD)"
  fi
} > "${DEST_DIR}/bundle-manifest.txt"

echo "Portable PR review bundle staged at ${DEST_DIR}"
