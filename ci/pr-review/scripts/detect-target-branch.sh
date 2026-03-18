#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOUSAGE'
Usage: detect-target-branch.sh [--default <branch>]

Detects the most likely base branch for the current repository.

Options:
  --default <branch>  Fallback branch name when no better signal exists (default: main)
  -h, --help          Show this help
EOUSAGE
  exit "${1:-0}"
}

DEFAULT_BRANCH="main"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --default)
      DEFAULT_BRANCH="${2:-}"
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

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Must be run from within a git repository" >&2
  exit 1
fi

print_if_valid_branch() {
  local candidate="$1"

  if [[ -z "$candidate" ]]; then
    return 1
  fi

  if git show-ref --verify --quiet "refs/heads/${candidate}" || \
     git show-ref --verify --quiet "refs/remotes/origin/${candidate}"; then
    printf '%s\n' "$candidate"
    return 0
  fi

  return 1
}

if command -v gh >/dev/null 2>&1; then
  PR_BASE="$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || true)"
  if print_if_valid_branch "$PR_BASE"; then
    exit 0
  fi

  REPO_DEFAULT="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || true)"
  if print_if_valid_branch "$REPO_DEFAULT"; then
    exit 0
  fi
fi

ORIGIN_HEAD="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
ORIGIN_HEAD="${ORIGIN_HEAD#origin/}"
if print_if_valid_branch "$ORIGIN_HEAD"; then
  exit 0
fi

for candidate in "$DEFAULT_BRANCH" main master trunk develop; do
  if print_if_valid_branch "$candidate"; then
    exit 0
  fi
done

printf '%s\n' "$DEFAULT_BRANCH"
