#!/bin/bash
set -e

# Implement Iteration Loop
# Spawns independent Claude Code processes to implement user stories from spec.json.
# Each iteration is a fresh process with no memory — state persists via files and git.

# --- Ship directory (configurable via CLAUDE_SHIP_DIR env var) ---
SHIP_DIR="${CLAUDE_SHIP_DIR:-tmp/ship}"

# --- Defaults ---
MAX_ITERATIONS=10
MAX_TURNS=75
MAX_STORY_ATTEMPTS=3
PROMPT_FILE="$SHIP_DIR/implement-prompt.md"
SPEC_FILE="$SHIP_DIR/spec.json"
PROGRESS_FILE="$SHIP_DIR/progress.txt"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
FORCE=false
PROTECTED_BRANCHES="main master"

# --- Script paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATE_SCRIPT="$SCRIPT_DIR/validate-spec.ts"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- Usage ---
usage() {
    echo "Usage: implement.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --max-iterations N   Max iteration loops (default: 10)"
    echo "  --max-turns N        Max agentic turns per iteration (default: 75)"
    echo "  --max-story-attempts N  Max attempts per story before blocking (default: 3)"
    echo "  --prompt FILE        Prompt file path (default: tmp/ship/implement-prompt.md)"
    echo "  --spec FILE          Spec JSON file path (default: tmp/ship/spec.json)"
    echo "  Environment: CLAUDE_BIN overrides the Claude executable path"
    echo "  --force              Skip uncommitted changes prompt"
    echo "  --create-branch, -b  Create/checkout branch from spec.json branchName"
    echo "  -h, --help           Show this help"
    exit 0
}

# --- Parse arguments ---
CREATE_BRANCH=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --max-iterations) MAX_ITERATIONS="$2"; shift 2 ;;
        --max-turns) MAX_TURNS="$2"; shift 2 ;;
        --max-story-attempts) MAX_STORY_ATTEMPTS="$2"; shift 2 ;;
        --prompt) PROMPT_FILE="$2"; shift 2 ;;
        --spec) SPEC_FILE="$2"; shift 2 ;;
        --force) FORCE=true; shift ;;
        --create-branch|-b) CREATE_BRANCH=true; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $1"; usage ;;
    esac
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Implement Iteration Loop${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# --- Get current branch ---
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

# --- Branch safety check ---
for protected in $PROTECTED_BRANCHES; do
    if [[ "$CURRENT_BRANCH" == "$protected" ]]; then
        echo -e "${RED}Error: Cannot run on '$CURRENT_BRANCH' branch.${NC}"
        echo ""
        echo "Options:"
        echo "  1. Create branch from spec.json: implement.sh --create-branch"
        echo "  2. Create branch manually:      git checkout -b feat/my-feature"
        exit 1
    fi
done

# --- Create branch from spec.json ---
if [[ "$CREATE_BRANCH" == true ]]; then
    if [[ ! -f "$SPEC_FILE" ]]; then
        echo -e "${RED}Error: $SPEC_FILE not found. Cannot create branch.${NC}"
        exit 1
    fi

    if command -v jq &> /dev/null; then
        SPEC_BRANCH=$(jq -r '.branchName // empty' "$SPEC_FILE")
    else
        SPEC_BRANCH=$(grep -o '"branchName"[[:space:]]*:[[:space:]]*"[^"]*"' "$SPEC_FILE" | sed 's/.*: *"\([^"]*\)"/\1/')
    fi

    if [[ -z "$SPEC_BRANCH" ]]; then
        echo -e "${RED}Error: No 'branchName' field in $SPEC_FILE${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Creating branch: $SPEC_BRANCH${NC}"
    if git show-ref --verify --quiet "refs/heads/$SPEC_BRANCH"; then
        git checkout "$SPEC_BRANCH"
    else
        git checkout -b "$SPEC_BRANCH"
    fi
    CURRENT_BRANCH="$SPEC_BRANCH"

    # Warn if progress.txt references a different branch (stale from a previous feature).
    if [[ -f "$PROGRESS_FILE" ]]; then
        PROGRESS_BRANCH=$(head -1 "$PROGRESS_FILE" | sed -n 's/^# Progress Log - //p')
        if [[ -n "$PROGRESS_BRANCH" && "$PROGRESS_BRANCH" != "$CURRENT_BRANCH" ]]; then
            echo -e "${YELLOW}Warning: $PROGRESS_FILE references branch '$PROGRESS_BRANCH' (current: '$CURRENT_BRANCH').${NC}"
            echo -e "${YELLOW}Consider archiving it before continuing. Use /implement Phase 1 for full archiving.${NC}"
        fi
    fi
fi

echo -e "${YELLOW}Branch:${NC}          $CURRENT_BRANCH"
echo -e "${YELLOW}Max iterations:${NC}  $MAX_ITERATIONS"
echo -e "${YELLOW}Max turns:${NC}       $MAX_TURNS"
echo -e "${YELLOW}Story attempts:${NC}  $MAX_STORY_ATTEMPTS"
echo -e "${YELLOW}Prompt:${NC}          $PROMPT_FILE"
echo -e "${YELLOW}Spec JSON:${NC}       $SPEC_FILE"
echo -e "${YELLOW}Claude bin:${NC}      $CLAUDE_BIN"
echo ""

# --- Check required files ---
if [[ ! -f "$PROMPT_FILE" ]]; then
    echo -e "${RED}Error: Prompt file not found: $PROMPT_FILE${NC}"
    echo "Run /implement to generate the implementation prompt first."
    exit 1
fi

if [[ ! -f "$SPEC_FILE" ]]; then
    echo -e "${RED}Error: Spec JSON file not found: $SPEC_FILE${NC}"
    echo "Run /implement to generate spec.json first."
    exit 1
fi

# --- Check for uncommitted changes ---
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    if [[ "$FORCE" == true ]]; then
        echo -e "${YELLOW}Warning: Uncommitted changes detected (continuing with --force)${NC}"
    else
        echo -e "${YELLOW}Warning: You have uncommitted changes.${NC}"
        echo "The implement loop commits its own changes. Consider committing or stashing first."
        echo "Use --force to skip this check."
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# --- Validate numeric fields ---
for numeric_arg in MAX_ITERATIONS MAX_TURNS MAX_STORY_ATTEMPTS; do
    eval "numeric_value=\${$numeric_arg}"
    if [[ ! "$numeric_value" =~ ^[0-9]+$ ]] || [[ "$numeric_value" -lt 1 ]]; then
        lower_name=$(printf '%s' "$numeric_arg" | tr '[:upper:]' '[:lower:]')
        echo -e "${RED}Error: ${lower_name} must be a positive integer (got '$numeric_value').${NC}"
        exit 1
    fi
done

# --- Helper functions ---
get_story_counts() {
    if command -v jq &> /dev/null; then
        jq -r '
          [
            (.userStories | length),
            ([.userStories[] | select(.passes == true)] | length),
            ([.userStories[] | select((.passes == false) and ((.status // "pending") == "blocked"))] | length),
            ([.userStories[] | select((.passes == false) and ((.status // "pending") != "blocked"))] | length)
          ] | @tsv
        ' "$SPEC_FILE" 2>/dev/null
    else
        local total passing
        total=$(grep -c '"id"' "$SPEC_FILE" 2>/dev/null || echo "0")
        passing=$(grep -c '"passes"[[:space:]]*:[[:space:]]*true' "$SPEC_FILE" 2>/dev/null || echo "0")
        printf '%s\t%s\t0\t%s\n' "$total" "$passing" "$((total - passing))"
    fi
}

get_next_story_metadata() {
    if ! command -v jq &> /dev/null; then
        return 0
    fi

    jq -r '
      [
        .userStories[]
        | select((.passes == false) and ((.status // "pending") != "blocked"))
      ]
      | sort_by(.priority)
      | .[0]
      | if . == null then "" else "\(.id)\t\(.title)" end
    ' "$SPEC_FILE" 2>/dev/null
}

update_story_state() {
    local story_id="$1"
    local attempt_count="$2"
    local story_status="$3"
    local note="$4"
    local tmp_file

    tmp_file=$(mktemp)
    jq \
      --arg id "$story_id" \
      --argjson attempt "$attempt_count" \
      --arg status "$story_status" \
      --arg note "$note" '
      .userStories |= map(
        if .id == $id then
          .attemptCount = $attempt
          | (if $status != "" then .status = $status else . end)
          | (if $note != "" then
              .notes = (
                (.notes // "") as $existing
                | if $existing == "" then $note else ($existing + "\n" + $note) end
              )
             else . end)
        else .
        end
      )' "$SPEC_FILE" > "$tmp_file"
    mv "$tmp_file" "$SPEC_FILE"
}

emit_blocked_summary() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  Blocked stories require attention.${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if command -v jq &> /dev/null; then
        jq -r --argjson maxAttempts "$MAX_STORY_ATTEMPTS" '
          .userStories[]
          | select((.passes == false) and ((.status // "pending") == "blocked"))
          | "- \(.id): \(.title) [attempts: \(.attemptCount // 0)/\($maxAttempts)]"
            + (if (.notes // "") == "" then "" else " — " + ((.notes // "") | split("\n") | last) end)
        ' "$SPEC_FILE"
    else
        echo "- Unable to summarize blocked stories without jq."
    fi

    echo ""
    echo "<input>Blocked stories require attention. Review tmp/ship/spec.json for blocked stories and decide whether to split them, adjust acceptance criteria, or add more implementation guidance.</input>"
}

# --- Initialize progress file ---
if [[ ! -f "$PROGRESS_FILE" ]]; then
    echo "# Progress Log - $CURRENT_BRANCH" > "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
fi

# --- Main iteration loop ---
for ((i=1; i<=MAX_ITERATIONS; i++)); do
    STORY_COUNTS=$(get_story_counts)
    IFS=$'\t' read -r TOTAL_STORIES PASSING_STORIES BLOCKED_STORIES ACTIONABLE_STORIES <<< "$STORY_COUNTS"

    if [[ "$ACTIONABLE_STORIES" -eq 0 ]]; then
        if [[ "$BLOCKED_STORIES" -gt 0 ]]; then
            emit_blocked_summary | tee -a "$PROGRESS_FILE"
            exit 2
        fi

        if [[ "$PASSING_STORIES" -eq "$TOTAL_STORIES" ]]; then
            echo ""
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${GREEN}  All stories complete.${NC}"
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo "" >> "$PROGRESS_FILE"
            echo "## COMPLETED - $(date)" >> "$PROGRESS_FILE"
            echo ""
            echo "Next steps:"
            echo "  1. Review: git log --oneline"
            echo "  2. Push:   git push origin $CURRENT_BRANCH"
            echo "  3. Create PR"
            exit 0
        fi
    fi

    CURRENT_STORY_ID=""
    CURRENT_STORY_TITLE=""
    NEXT_STORY_METADATA=$(get_next_story_metadata || true)
    if [[ -n "$NEXT_STORY_METADATA" ]]; then
        IFS=$'\t' read -r CURRENT_STORY_ID CURRENT_STORY_TITLE <<< "$NEXT_STORY_METADATA"
    fi

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  Iteration $i of $MAX_ITERATIONS${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo "## Iteration $i - $(date)" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    if [[ -n "${CURRENT_STORY_ID:-}" ]]; then
        echo "Target story: ${CURRENT_STORY_ID} - ${CURRENT_STORY_TITLE}" >> "$PROGRESS_FILE"
        echo "" >> "$PROGRESS_FILE"
    fi

    OUTPUT_FILE=$(mktemp)

    # Spawn a fresh Claude Code process for this iteration.
    # env -u: unset vars that prevent nested Claude Code sessions.
    # -p: non-interactive mode (prompt from file).
    # --dangerously-skip-permissions: no TTY for confirmation in -p mode.
    # --max-turns: prevent runaway iterations.
    # --output-format json: structured output for completion detection.
    env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT "$CLAUDE_BIN" \
        -p "$(cat "$PROMPT_FILE")" \
        --dangerously-skip-permissions \
        --max-turns "$MAX_TURNS" \
        --output-format json \
        2>&1 | tee "$OUTPUT_FILE" || true

    # --- Post-iteration status ---
    STORY_COUNTS=$(get_story_counts)
    IFS=$'\t' read -r TOTAL_STORIES PASSING_STORIES BLOCKED_STORIES ACTIONABLE_STORIES <<< "$STORY_COUNTS"
    echo ""
    echo -e "${GREEN}Iteration $i complete. Stories: $PASSING_STORIES/$TOTAL_STORIES passing, $BLOCKED_STORIES blocked.${NC}"

    # --- Optional: validate spec.json integrity after iteration ---
    if command -v bun &> /dev/null && [[ -f "$VALIDATE_SCRIPT" ]]; then
        if ! bun "$VALIDATE_SCRIPT" "$SPEC_FILE" >/dev/null; then
            echo -e "${YELLOW}Warning: spec.json validation issue detected after iteration $i.${NC}"
            echo "spec.json validation warning after iteration $i" >> "$PROGRESS_FILE"
            echo "" >> "$PROGRESS_FILE"
        fi
    fi

    if command -v jq &> /dev/null && [[ -n "${CURRENT_STORY_ID:-}" ]]; then
        PREVIOUS_ATTEMPTS=$(jq -r --arg id "$CURRENT_STORY_ID" '
            [.userStories[] | select(.id == $id)][0].attemptCount // 0
        ' "$SPEC_FILE" 2>/dev/null || echo "0")
        STORY_PASSES=$(jq -r --arg id "$CURRENT_STORY_ID" '
            [.userStories[] | select(.id == $id)][0].passes // false
        ' "$SPEC_FILE" 2>/dev/null || echo "false")
        STORY_STATUS=$(jq -r --arg id "$CURRENT_STORY_ID" '
            [.userStories[] | select(.id == $id)][0].status // "pending"
        ' "$SPEC_FILE" 2>/dev/null || echo "pending")

        NEXT_ATTEMPT=$((PREVIOUS_ATTEMPTS + 1))

        if [[ "$STORY_PASSES" == "true" ]]; then
            update_story_state "$CURRENT_STORY_ID" "$NEXT_ATTEMPT" "completed" ""
            echo "Story ${CURRENT_STORY_ID} completed on attempt ${NEXT_ATTEMPT}." | tee -a "$PROGRESS_FILE"
        elif [[ "$STORY_STATUS" != "blocked" && "$NEXT_ATTEMPT" -ge "$MAX_STORY_ATTEMPTS" ]]; then
            BLOCKED_NOTE="Blocked after ${NEXT_ATTEMPT} attempts. Review progress.txt, split the story, or add more guidance before retrying."
            update_story_state "$CURRENT_STORY_ID" "$NEXT_ATTEMPT" "blocked" "$BLOCKED_NOTE"
            echo "Story ${CURRENT_STORY_ID} blocked after ${NEXT_ATTEMPT}/${MAX_STORY_ATTEMPTS} attempts." | tee -a "$PROGRESS_FILE"
        else
            update_story_state "$CURRENT_STORY_ID" "$NEXT_ATTEMPT" "" ""
            echo "Story ${CURRENT_STORY_ID} remains incomplete after attempt ${NEXT_ATTEMPT}/${MAX_STORY_ATTEMPTS}." >> "$PROGRESS_FILE"
        fi

        echo "" >> "$PROGRESS_FILE"
        STORY_COUNTS=$(get_story_counts)
        IFS=$'\t' read -r TOTAL_STORIES PASSING_STORIES BLOCKED_STORIES ACTIONABLE_STORIES <<< "$STORY_COUNTS"
    fi

    if [[ "$ACTIONABLE_STORIES" -eq 0 ]]; then
        rm -f "$OUTPUT_FILE"

        if [[ "$BLOCKED_STORIES" -gt 0 ]]; then
            emit_blocked_summary | tee -a "$PROGRESS_FILE"
            exit 2
        fi

        if [[ "$PASSING_STORIES" -eq "$TOTAL_STORIES" ]]; then
            echo ""
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${GREEN}  All stories complete.${NC}"
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo "" >> "$PROGRESS_FILE"
            echo "## COMPLETED - $(date)" >> "$PROGRESS_FILE"
            echo ""
            echo "Next steps:"
            echo "  1. Review: git log --oneline"
            echo "  2. Push:   git push origin $CURRENT_BRANCH"
            echo "  3. Create PR"
            exit 0
        fi
    fi

    # Check for completion signal.
    # The iteration agent outputs <promise>IMPLEMENTATION COMPLETE</promise> when all stories pass.
    if grep -q "IMPLEMENTATION COMPLETE" "$OUTPUT_FILE"; then
        # Verify spec.json actually has all stories complete.
        # Prevents premature exit from false completion signals.
        INCOMPLETE=0
        if command -v jq &> /dev/null; then
            INCOMPLETE=$(jq '[.userStories[] | select(.passes != true)] | length' "$SPEC_FILE" 2>/dev/null || echo "0")
        else
            INCOMPLETE=$(grep -c '"passes"[[:space:]]*:[[:space:]]*false' "$SPEC_FILE" 2>/dev/null || echo "0")
        fi

        if [[ "$INCOMPLETE" -gt 0 ]]; then
            echo -e "${YELLOW}Warning: Completion signal detected but $INCOMPLETE stories still incomplete.${NC}"
            echo -e "${YELLOW}Continuing iteration...${NC}"
            echo "Warning: false completion signal — $INCOMPLETE stories still at passes: false" >> "$PROGRESS_FILE"
            echo "" >> "$PROGRESS_FILE"
            rm -f "$OUTPUT_FILE"
            sleep 2
            continue
        fi

        rm -f "$OUTPUT_FILE"
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}  All stories complete.${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo "" >> "$PROGRESS_FILE"
        echo "## COMPLETED - $(date)" >> "$PROGRESS_FILE"
        echo ""
        echo "Next steps:"
        echo "  1. Review: git log --oneline"
        echo "  2. Push:   git push origin $CURRENT_BRANCH"
        echo "  3. Create PR"
        exit 0
    fi

    rm -f "$OUTPUT_FILE"

    echo "" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"

    sleep 2
done

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Max iterations reached ($MAX_ITERATIONS).${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Check $SHIP_DIR/spec.json for incomplete stories and $SHIP_DIR/progress.txt for blockers."
exit 1
