#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ship-worktree.sh ensure --feature <name> [--base <branch>] [--branch <branch>] [--path <dir>]
  ship-worktree.sh cleanup [--state <tmp/ship/state.json> | --path <dir>] [--branch <branch>] [--base <branch>] [--force] [--teardown-isolated-env]

Subcommands:
  ensure   Reuse the current feature worktree when appropriate, otherwise create
           a new sibling worktree for the requested feature.
  cleanup  Remove a completed Ship worktree and optionally tear down its isolated env.
EOF
  exit "${1:-0}"
}

require_git_repo() {
  if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
    echo "ship-worktree.sh must run inside a git repository" >&2
    exit 1
  fi
}

slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

branch_exists() {
  local branch_name="$1"
  git show-ref --verify --quiet "refs/heads/${branch_name}" || \
    git show-ref --verify --quiet "refs/remotes/origin/${branch_name}"
}

detect_base_branch() {
  local candidate
  for candidate in main master trunk develop; do
    if branch_exists "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  printf 'main\n'
}

resolve_base_ref() {
  local base_branch="$1"

  if git show-ref --verify --quiet "refs/remotes/origin/${base_branch}"; then
    printf 'origin/%s\n' "$base_branch"
    return 0
  fi

  printf '%s\n' "$base_branch"
}

primary_worktree_path() {
  git worktree list --porcelain | awk '/^worktree / { print substr($0, 10); exit }'
}

worktree_path_exists() {
  local candidate="$1"
  local worktree_path=""

  while IFS= read -r line; do
    case "$line" in
      worktree\ *)
        worktree_path="${line#worktree }"
        if [[ "$worktree_path" == "$candidate" ]]; then
          return 0
        fi
        ;;
    esac
  done < <(git worktree list --porcelain)

  return 1
}

find_matching_worktree() {
  local target_branch="$1"
  local target_basename="$2"
  local worktree_path=""
  local worktree_branch=""

  while IFS= read -r line; do
    case "$line" in
      worktree\ *)
        worktree_path="${line#worktree }"
        worktree_branch=""
        ;;
      branch\ refs/heads/*)
        worktree_branch="${line#branch refs/heads/}"
        ;;
      "")
        if [[ -n "$worktree_path" ]]; then
          if [[ "$worktree_branch" == "$target_branch" || "$(basename "$worktree_path")" == "$target_basename" ]]; then
            printf '%s\t%s\n' "$worktree_path" "$worktree_branch"
            return 0
          fi
        fi
        worktree_path=""
        worktree_branch=""
        ;;
    esac
  done < <(git worktree list --porcelain && printf '\n')

  return 1
}

filtered_status() {
  local worktree_path="$1"

  git -C "$worktree_path" status --porcelain --untracked-files=all \
    | grep -v -E '^(..|\?\?) (tmp/ship/|tmp/browser/)' \
    || true
}

worktree_is_clean() {
  local worktree_path="$1"
  [[ -z "$(filtered_status "$worktree_path")" ]]
}

json_result() {
  local action="$1"
  local path="$2"
  local branch_name="$3"
  local base_branch="$4"
  local created="$5"
  local reused="$6"
  local note="${7:-}"

  jq -n \
    --arg action "$action" \
    --arg path "$path" \
    --arg branch "$branch_name" \
    --arg base "$base_branch" \
    --argjson created "$created" \
    --argjson reused "$reused" \
    --arg note "$note" \
    '{
      action: $action,
      path: $path,
      branch: $branch,
      base: $base,
      created: $created,
      reused: $reused,
      note: (if $note == "" then null else $note end)
    }'
}

ensure_worktree() {
  local feature_name=""
  local base_branch=""
  local branch_name=""
  local target_path=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --feature)
        feature_name="${2:-}"
        shift 2
        ;;
      --base)
        base_branch="${2:-}"
        shift 2
        ;;
      --branch)
        branch_name="${2:-}"
        shift 2
        ;;
      --path)
        target_path="${2:-}"
        shift 2
        ;;
      *)
        echo "Unknown ensure argument: $1" >&2
        usage 1
        ;;
    esac
  done

  if [[ -z "$feature_name" ]]; then
    echo "ensure requires --feature" >&2
    exit 1
  fi

  require_git_repo

  local repo_root repo_parent repo_name feature_slug current_branch main_path current_path
  repo_root=$(git rev-parse --show-toplevel)
  repo_parent=$(dirname "$repo_root")
  repo_name=$(basename "$repo_root")
  feature_slug=$(slugify "$feature_name")
  current_branch=$(git -C "$repo_root" rev-parse --abbrev-ref HEAD)
  main_path=$(primary_worktree_path)
  current_path="$repo_root"

  [[ -z "$base_branch" ]] && base_branch=$(detect_base_branch)
  [[ -z "$branch_name" ]] && branch_name="feat/${feature_slug}"
  [[ -z "$target_path" ]] && target_path="${repo_parent}/${repo_name}-${feature_slug}"

  if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
    if [[ "$current_path" != "$main_path" ]]; then
      json_result "reuse_current_worktree" "$current_path" "$current_branch" "$base_branch" false true
      return 0
    fi

    json_result "reuse_current_branch" "$current_path" "$current_branch" "$base_branch" false true \
      "Already on a non-primary branch in the main checkout."
    return 0
  fi

  local match match_path match_branch target_basename
  target_basename=$(basename "$target_path")
  match=$(find_matching_worktree "$branch_name" "$target_basename" || true)
  if [[ -n "$match" ]]; then
    match_path="${match%%$'\t'*}"
    match_branch="${match#*$'\t'}"
    if worktree_is_clean "$match_path"; then
      json_result "reuse_existing_worktree" "$match_path" "$match_branch" "$base_branch" false true
      return 0
    fi
  fi

  local candidate_path candidate_branch suffix base_ref
  candidate_path="$target_path"
  candidate_branch="$branch_name"
  suffix=2
  while [[ -e "$candidate_path" || $(worktree_path_exists "$candidate_path" && printf true || printf false) == true || $(branch_exists "$candidate_branch" && printf true || printf false) == true ]]; do
    candidate_path="${target_path}-${suffix}"
    candidate_branch="${branch_name}-${suffix}"
    suffix=$((suffix + 1))
  done

  if git remote get-url origin >/dev/null 2>&1; then
    git fetch origin "$base_branch" >/dev/null 2>&1 || true
  fi

  base_ref=$(resolve_base_ref "$base_branch")
  git worktree add "$candidate_path" -b "$candidate_branch" "$base_ref" >/dev/null
  json_result "created_worktree" "$candidate_path" "$candidate_branch" "$base_branch" true false
}

cleanup_worktree() {
  local state_file=""
  local worktree_path=""
  local branch_name=""
  local base_branch=""
  local force=false
  local teardown_isolated_env=false
  local teardown_command=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --state)
        state_file="${2:-}"
        shift 2
        ;;
      --path)
        worktree_path="${2:-}"
        shift 2
        ;;
      --branch)
        branch_name="${2:-}"
        shift 2
        ;;
      --base)
        base_branch="${2:-}"
        shift 2
        ;;
      --force)
        force=true
        shift
        ;;
      --teardown-isolated-env)
        teardown_isolated_env=true
        shift
        ;;
      *)
        echo "Unknown cleanup argument: $1" >&2
        usage 1
        ;;
    esac
  done

  require_git_repo

  if [[ -n "$state_file" ]]; then
    if [[ ! -f "$state_file" ]]; then
      echo "State file not found: $state_file" >&2
      exit 1
    fi

    [[ -z "$worktree_path" ]] && worktree_path=$(jq -r '.worktreePath // ""' "$state_file")
    [[ -z "$branch_name" ]] && branch_name=$(jq -r '.branch // ""' "$state_file")
    if [[ "$teardown_isolated_env" == true ]]; then
      teardown_command=$(jq -r '.isolatedEnv.teardownCommand // ""' "$state_file")
    fi
  fi

  if [[ -z "$worktree_path" ]]; then
    echo "cleanup requires --path or --state with worktreePath" >&2
    exit 1
  fi

  if [[ -z "$branch_name" ]]; then
    echo "cleanup requires --branch or --state with branch" >&2
    exit 1
  fi

  [[ -z "$base_branch" ]] && base_branch=$(detect_base_branch)

  local repo_root main_path base_ref
  repo_root=$(git rev-parse --show-toplevel)
  main_path=$(primary_worktree_path)
  base_ref=$(resolve_base_ref "$base_branch")

  if [[ "$worktree_path" == "$main_path" || "$worktree_path" == "$repo_root" ]]; then
    echo "Refusing to remove the primary checkout: $worktree_path" >&2
    exit 1
  fi

  if [[ -d "$worktree_path" ]] && [[ "$force" != true ]] && ! worktree_is_clean "$worktree_path"; then
    echo "Refusing to remove dirty worktree: $worktree_path" >&2
    filtered_status "$worktree_path" >&2
    exit 1
  fi

  if branch_exists "$branch_name" && [[ "$force" != true ]]; then
    if ! git merge-base --is-ancestor "$branch_name" "$base_ref" >/dev/null 2>&1; then
      echo "Refusing to delete unmerged branch '$branch_name' from base '$base_ref'" >&2
      exit 1
    fi
  fi

  if [[ "$teardown_isolated_env" == true && -n "$teardown_command" && -d "$worktree_path" ]]; then
    (cd "$worktree_path" && bash -lc "$teardown_command")
  fi

  if worktree_path_exists "$worktree_path"; then
    if [[ "$force" == true ]]; then
      git worktree remove --force "$worktree_path"
    else
      git worktree remove "$worktree_path"
    fi
  fi

  if git show-ref --verify --quiet "refs/heads/${branch_name}"; then
    if [[ "$force" == true ]]; then
      git branch -D "$branch_name" >/dev/null
    else
      git branch -d "$branch_name" >/dev/null
    fi
  fi

  git worktree prune >/dev/null

  jq -n \
    --arg action "cleanup_worktree" \
    --arg path "$worktree_path" \
    --arg branch "$branch_name" \
    --arg base "$base_branch" \
    --argjson force "$force" \
    --argjson toreDownIsolatedEnv "$teardown_isolated_env" \
    '{
      action: $action,
      path: $path,
      branch: $branch,
      base: $base,
      force: $force,
      toreDownIsolatedEnv: $toreDownIsolatedEnv
    }'
}

if [[ $# -lt 1 ]]; then
  usage 1
fi

subcommand="$1"
shift

case "$subcommand" in
  ensure)
    ensure_worktree "$@"
    ;;
  cleanup)
    cleanup_worktree "$@"
    ;;
  -h|--help|help)
    usage 0
    ;;
  *)
    echo "Unknown subcommand: $subcommand" >&2
    usage 1
    ;;
esac
