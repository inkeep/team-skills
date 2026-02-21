#!/bin/bash
set -e

# QA Iteration Loop
# Spawns independent Claude Code processes to execute test scenarios from qa.json.
# Each iteration is a fresh process with no memory — state persists via files.
#
# This script also assembles the iteration prompt from the template by injecting:
#   - {{TESTING_GUIDANCE}} from references/testing-guidance.md
#   - {{TEST_CONTEXT}} from qa.json.testContext
#   - {{CODEBASE_CONTEXT}} from qa.json.codebaseContext
#   - {{SPEC_PATH}} from --spec-path argument
#   - {{DIFF}} cleaned git diff (full or stat tree depending on size)

# --- Ship directory (configurable via CLAUDE_SHIP_DIR env var) ---
SHIP_DIR="${CLAUDE_SHIP_DIR:-tmp/ship}"

# --- Defaults ---
MAX_ITERATIONS=15
MAX_TURNS=50
TEMPLATE_FILE=""
QA_FILE="$SHIP_DIR/qa.json"
PROGRESS_FILE="$SHIP_DIR/qa-progress.txt"
PROMPT_FILE="$SHIP_DIR/qa-prompt.md"
DIFF_FILE="$SHIP_DIR/qa-diff.txt"
SPEC_PATH=""
FORCE=false

# ~5-10K tokens ≈ 30K characters
DIFF_MAX_CHARS=30000

# --- Script paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATE_SCRIPT="$SCRIPT_DIR/validate-qa.ts"
TESTING_GUIDANCE="$SCRIPT_DIR/../references/testing-guidance.md"

# --- Noise filters (same as ship-stop-hook.sh) ---
FILTER_LOCK='(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|\.lock$)'
FILTER_SHIP='^.. tmp/ship/'
FILTER_BUILD='(dist|\.next|build|\.turbo|node_modules)/'

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- Usage ---
usage() {
    echo "Usage: qa.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --max-iterations N   Max iteration loops (default: 15)"
    echo "  --max-turns N        Max agentic turns per iteration (default: 50)"
    echo "  --template FILE      Prompt template file (auto-detected from skill if omitted)"
    echo "  --spec FILE          QA JSON file path (default: $SHIP_DIR/qa.json)"
    echo "  --spec-path PATH     Path to SPEC.md (for template variant A)"
    echo "  --force              Skip uncommitted changes prompt"
    echo "  -h, --help           Show this help"
    exit 0
}

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
    case $1 in
        --max-iterations) MAX_ITERATIONS="$2"; shift 2 ;;
        --max-turns) MAX_TURNS="$2"; shift 2 ;;
        --template) TEMPLATE_FILE="$2"; shift 2 ;;
        --spec) QA_FILE="$2"; shift 2 ;;
        --spec-path) SPEC_PATH="$2"; shift 2 ;;
        --force) FORCE=true; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $1"; usage ;;
    esac
done

# --- Auto-detect template if not provided ---
if [[ -z "$TEMPLATE_FILE" ]]; then
    TEMPLATE_FILE="$SCRIPT_DIR/../templates/qa-prompt.template.md"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  QA Iteration Loop${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# --- Get current branch ---
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

echo -e "${YELLOW}Branch:${NC}          $CURRENT_BRANCH"
echo -e "${YELLOW}Max iterations:${NC}  $MAX_ITERATIONS"
echo -e "${YELLOW}Max turns:${NC}       $MAX_TURNS"
echo -e "${YELLOW}Template:${NC}        $TEMPLATE_FILE"
echo -e "${YELLOW}QA JSON:${NC}         $QA_FILE"
echo ""

# --- Check required files ---
if [[ ! -f "$TEMPLATE_FILE" ]]; then
    echo -e "${RED}Error: Template file not found: $TEMPLATE_FILE${NC}"
    exit 1
fi

if [[ ! -f "$QA_FILE" ]]; then
    echo -e "${RED}Error: QA JSON file not found: $QA_FILE${NC}"
    echo "Run /qa to generate qa.json first."
    exit 1
fi

if [[ ! -f "$TESTING_GUIDANCE" ]]; then
    echo -e "${RED}Error: Testing guidance not found: $TESTING_GUIDANCE${NC}"
    exit 1
fi

# --- Check for uncommitted changes ---
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    if [[ "$FORCE" == true ]]; then
        echo -e "${YELLOW}Warning: Uncommitted changes detected (continuing with --force)${NC}"
    else
        echo -e "${YELLOW}Warning: You have uncommitted changes.${NC}"
        echo "The QA loop may commit bug fixes. Consider committing or stashing first."
        echo "Use --force to skip this check."
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# --- Initialize progress file ---
if [[ ! -f "$PROGRESS_FILE" ]]; then
    echo "# QA Progress Log - $CURRENT_BRANCH" > "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
fi

# --- Compute cleaned diff (full or stat tree based on size) ---
compute_diff() {
    local MERGE_BASE
    MERGE_BASE=$(git merge-base main HEAD 2>/dev/null || echo "HEAD~10")

    # Full cleaned diff
    local FULL_DIFF
    FULL_DIFF=$(git diff "$MERGE_BASE"...HEAD \
        -- ':!*.lock' ':!*lock.json' ':!*lock.yaml' \
           ':!tmp/' ':!dist/' ':!build/' ':!.next/' ':!.turbo/' ':!node_modules/' \
        2>/dev/null || echo "")

    local DIFF_SIZE=${#FULL_DIFF}

    if [[ "$DIFF_SIZE" -le "$DIFF_MAX_CHARS" && "$DIFF_SIZE" -gt 0 ]]; then
        # Small enough — use full diff
        echo "# Git diff (full — $(echo "$FULL_DIFF" | wc -l | tr -d ' ') lines)"
        echo ""
        echo "$FULL_DIFF"
    elif [[ "$DIFF_SIZE" -gt "$DIFF_MAX_CHARS" ]]; then
        # Too large — fall back to stat tree
        echo "# Git diff (stat tree — full diff too large at ~$((DIFF_SIZE / 4)) tokens)"
        echo ""
        echo "Full diff exceeds token budget. Showing file-level summary."
        echo "Read specific files with the Read tool for details."
        echo ""
        git diff --stat "$MERGE_BASE"...HEAD \
            -- ':!*.lock' ':!*lock.json' ':!*lock.yaml' \
               ':!tmp/' ':!dist/' ':!build/' ':!.next/' ':!.turbo/' ':!node_modules/' \
            2>/dev/null || echo "(no stat available)"
    else
        echo "# Git diff"
        echo ""
        echo "(no changes detected against main)"
    fi
}

# --- Assemble prompt from template ---
assemble_prompt() {
    # Extract dynamic fields from qa.json
    local TEST_CONTEXT CODEBASE_CONTEXT
    if command -v jq &> /dev/null; then
        TEST_CONTEXT=$(jq -r '.testContext // ""' "$QA_FILE")
        CODEBASE_CONTEXT=$(jq -r '.codebaseContext // ""' "$QA_FILE")
    else
        TEST_CONTEXT=""
        CODEBASE_CONTEXT=""
    fi

    # Compute fresh diff
    local DIFF
    DIFF=$(compute_diff)

    # Write diff file for reference
    echo "$DIFF" > "$DIFF_FILE"

    # Write content to temp files for safe Python substitution
    local TEMPLATE_TMP TC_FILE CCC_FILE DIFF_CONTENT_FILE
    TEMPLATE_TMP=$(mktemp)
    TC_FILE=$(mktemp)
    CCC_FILE=$(mktemp)
    DIFF_CONTENT_FILE=$(mktemp)
    cat "$TEMPLATE_FILE" > "$TEMPLATE_TMP"
    echo "$TEST_CONTEXT" > "$TC_FILE"
    echo "$CODEBASE_CONTEXT" > "$CCC_FILE"
    echo "$DIFF" > "$DIFF_CONTENT_FILE"

    # Use python3 for variant selection + multi-line placeholder substitution
    python3 -c "
import sys

with open('$TEMPLATE_TMP', 'r') as f:
    template = f.read()
with open('$TC_FILE', 'r') as f:
    tc = f.read().strip()
with open('$CCC_FILE', 'r') as f:
    ccc = f.read().strip()
with open('$DIFF_CONTENT_FILE', 'r') as f:
    diff = f.read().strip()

spec_path = '$SPEC_PATH'

# --- Variant selection ---
# Select Variant A (with SPEC.md) or Variant B (without) based on --spec-path
if spec_path:
    marker_start = '## Variant A'
    marker_end = '*End of Variant A*'
else:
    marker_start = '## Variant B'
    marker_end = '*End of Variant B*'

try:
    start_idx = template.index(marker_start)
    end_idx = template.index(marker_end)
    section = template[start_idx:end_idx]
    # Extract prompt content: between first --- and last --- in the section
    first_hr = section.index('\n---\n') + 5
    content = section[first_hr:].rstrip()
    last_hr = content.rfind('\n---')
    if last_hr > 0:
        content = content[:last_hr].strip()
except (ValueError, IndexError):
    # Fallback: use full template if markers not found
    content = template

# --- Placeholder substitution ---
content = content.replace('{{TEST_CONTEXT}}', tc)
content = content.replace('{{CODEBASE_CONTEXT}}', ccc)
content = content.replace('{{TESTING_GUIDANCE}}', open('$TESTING_GUIDANCE').read().strip())
content = content.replace('{{SPEC_PATH}}', spec_path)
content = content.replace('{{DIFF}}', diff)

with open('$PROMPT_FILE', 'w') as f:
    f.write(content)
" 2>/dev/null

    # Cleanup temp files
    rm -f "$TEMPLATE_TMP" "$TC_FILE" "$CCC_FILE" "$DIFF_CONTENT_FILE"
}

# --- Main iteration loop ---
for ((i=1; i<=MAX_ITERATIONS; i++)); do
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  QA Iteration $i of $MAX_ITERATIONS${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo "## Iteration $i - $(date)" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"

    # Assemble prompt fresh each iteration (diff may change after qa-fix commits)
    echo -e "${YELLOW}Assembling prompt...${NC}"
    assemble_prompt

    OUTPUT_FILE=$(mktemp)

    # Spawn a fresh Claude Code process for this iteration.
    # env -u: unset vars that prevent nested Claude Code sessions.
    # -p: non-interactive mode (prompt from file).
    # --dangerously-skip-permissions: no TTY for confirmation in -p mode.
    # --max-turns: prevent runaway iterations.
    # --output-format json: structured output for completion detection.
    # < /dev/null: prevent stdin hang in nested subprocess invocations.
    env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
        -p "$(cat "$PROMPT_FILE")" \
        --dangerously-skip-permissions \
        --max-turns "$MAX_TURNS" \
        --output-format json \
        < /dev/null 2>&1 | tee "$OUTPUT_FILE" || true

    # --- Post-iteration status ---
    TOTAL_SCENARIOS=0
    PASSING_SCENARIOS=0
    if command -v jq &> /dev/null; then
        TOTAL_SCENARIOS=$(jq '.scenarios | length' "$QA_FILE" 2>/dev/null || echo "0")
        PASSING_SCENARIOS=$(jq '[.scenarios[] | select(.passes == true)] | length' "$QA_FILE" 2>/dev/null || echo "0")
    else
        TOTAL_SCENARIOS=$(grep -c '"id"' "$QA_FILE" 2>/dev/null || echo "0")
        PASSING_SCENARIOS=$(grep -c '"passes"[[:space:]]*:[[:space:]]*true' "$QA_FILE" 2>/dev/null || echo "0")
    fi
    echo ""
    echo -e "${GREEN}Iteration $i complete. Scenarios: $PASSING_SCENARIOS/$TOTAL_SCENARIOS passing.${NC}"

    # --- Optional: validate qa.json integrity after iteration ---
    if command -v bun &> /dev/null && [[ -f "$VALIDATE_SCRIPT" ]]; then
        if ! bun "$VALIDATE_SCRIPT" "$QA_FILE" >/dev/null; then
            echo -e "${YELLOW}Warning: qa.json validation issue detected after iteration $i.${NC}"
            echo "qa.json validation warning after iteration $i" >> "$PROGRESS_FILE"
            echo "" >> "$PROGRESS_FILE"
        fi
    fi

    # Check for completion signal.
    # The iteration agent outputs <promise>QA COMPLETE</promise> when all scenarios pass.
    if grep -q "QA COMPLETE" "$OUTPUT_FILE"; then
        # Verify qa.json actually has all scenarios complete.
        # Prevents premature exit from false completion signals.
        INCOMPLETE=0
        if command -v jq &> /dev/null; then
            INCOMPLETE=$(jq '[.scenarios[] | select(.passes == false)] | length' "$QA_FILE" 2>/dev/null || echo "0")
        else
            INCOMPLETE=$(grep -c '"passes"[[:space:]]*:[[:space:]]*false' "$QA_FILE" 2>/dev/null || echo "0")
        fi

        if [[ "$INCOMPLETE" -gt 0 ]]; then
            echo -e "${YELLOW}Warning: Completion signal detected but $INCOMPLETE scenarios still incomplete.${NC}"
            echo -e "${YELLOW}Continuing iteration...${NC}"
            echo "Warning: false completion signal — $INCOMPLETE scenarios still at passes: false" >> "$PROGRESS_FILE"
            echo "" >> "$PROGRESS_FILE"
            rm -f "$OUTPUT_FILE"
            sleep 2
            continue
        fi

        rm -f "$OUTPUT_FILE"
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}  All QA scenarios complete.${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo "" >> "$PROGRESS_FILE"
        echo "## QA COMPLETED - $(date)" >> "$PROGRESS_FILE"

        # Print summary
        if command -v jq &> /dev/null; then
            PASS_COUNT=$(jq '[.scenarios[] | select(.result == "pass")] | length' "$QA_FILE" 2>/dev/null || echo "0")
            FIXED_COUNT=$(jq '[.scenarios[] | select(.result == "fail-fixed")] | length' "$QA_FILE" 2>/dev/null || echo "0")
            BLOCKED_COUNT=$(jq '[.scenarios[] | select(.result == "blocked")] | length' "$QA_FILE" 2>/dev/null || echo "0")
            SKIPPED_COUNT=$(jq '[.scenarios[] | select(.result == "skipped")] | length' "$QA_FILE" 2>/dev/null || echo "0")
            echo ""
            echo "Summary:"
            echo "  Pass:    $PASS_COUNT"
            echo "  Fixed:   $FIXED_COUNT"
            echo "  Blocked: $BLOCKED_COUNT"
            echo "  Skipped: $SKIPPED_COUNT"
        fi

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
echo "Check $QA_FILE for incomplete scenarios and $PROGRESS_FILE for blockers."
exit 1
