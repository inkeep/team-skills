#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: build-local-review-fix-prompt.sh --review <file> --status <file> --output <file> [--state <file>] [--spec <file>] [--guidance <text>]

Builds a bounded local-review repair prompt from the markdown summary and parsed
status JSON so Ship can either hand the prompt to the user or run it in an
autonomous child Claude session.
EOF
  exit "${1:-0}"
}

REVIEW_FILE=""
STATUS_FILE=""
OUTPUT_FILE=""
STATE_FILE=""
SPEC_PATH=""
GUIDANCE_TEXT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --review)
      REVIEW_FILE="${2:-}"
      shift 2
      ;;
    --status)
      STATUS_FILE="${2:-}"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="${2:-}"
      shift 2
      ;;
    --state)
      STATE_FILE="${2:-}"
      shift 2
      ;;
    --spec)
      SPEC_PATH="${2:-}"
      shift 2
      ;;
    --guidance)
      GUIDANCE_TEXT="${2:-}"
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

if [[ -z "$REVIEW_FILE" || -z "$STATUS_FILE" || -z "$OUTPUT_FILE" ]]; then
  echo "--review, --status, and --output are required" >&2
  usage 1
fi

if [[ ! -f "$REVIEW_FILE" ]]; then
  echo "Review summary not found: $REVIEW_FILE" >&2
  exit 1
fi

if [[ ! -f "$STATUS_FILE" ]]; then
  echo "Review status not found: $STATUS_FILE" >&2
  exit 1
fi

if [[ -n "$STATE_FILE" && ! -f "$STATE_FILE" ]]; then
  echo "State file not found: $STATE_FILE" >&2
  exit 1
fi

if [[ -z "$SPEC_PATH" && -n "$STATE_FILE" ]]; then
  SPEC_PATH="$(jq -r '.specPath // ""' "$STATE_FILE")"
fi

RECOMMENDATION="$(jq -r '.recommendationDisplay // .recommendation // "UNKNOWN"' "$STATUS_FILE")"
RISK="$(jq -r '.risk // "UNKNOWN"' "$STATUS_FILE")"
TOTAL_ISSUES="$(jq -r '.totalIssues // 0' "$STATUS_FILE")"
BLOCKING="$(jq -r '.blocking // false' "$STATUS_FILE")"

if [[ "$BLOCKING" != "true" ]]; then
  echo "Review status is not blocking: $STATUS_FILE" >&2
  exit 1
fi

BLOCKING_REASONS=""
while IFS= read -r line; do
  [[ -n "$line" ]] || continue
  BLOCKING_REASONS+="- ${line}"$'\n'
done < <(jq -r '.blockingReasons[]? // empty' "$STATUS_FILE")

if [[ -z "$BLOCKING_REASONS" ]]; then
  BLOCKING_REASONS="- Local review is still blocking; inspect the summary and clear the remaining blocking findings."$'\n'
fi

QUALITY_GATES=""
if [[ -n "$STATE_FILE" ]]; then
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    QUALITY_GATES+="- \`${line}\`"$'\n'
  done < <(jq -r '.qualityGates | [.test, .typecheck, .lint] | map(select(. != null and . != "")) | .[]' "$STATE_FILE")
fi

if [[ -z "$QUALITY_GATES" ]]; then
  QUALITY_GATES="- Run the relevant verification for the touched area before finishing."$'\n'
fi

SPEC_SECTION=""
if [[ -n "$SPEC_PATH" ]]; then
  SPEC_SECTION="- Spec: \`${SPEC_PATH}\`"$'\n'
fi

GUIDANCE_SECTION=""
if [[ -n "$GUIDANCE_TEXT" ]]; then
  GUIDANCE_SECTION=$'\n'"Additional guidance:"$'\n'"${GUIDANCE_TEXT}"$'\n'
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

cat > "$OUTPUT_FILE" <<EOF
You are running a bounded pre-push repair pass for /ship.

Goal: clear the blocking local review gate without introducing regressions or widening scope.

Inputs:
- Review summary: \`${REVIEW_FILE}\`
- Parsed review status: \`${STATUS_FILE}\`
${SPEC_SECTION}
- Recommendation: ${RECOMMENDATION}
- Risk: ${RISK}
- Total issues: ${TOTAL_ISSUES}

Why the gate is blocking:
${BLOCKING_REASONS}
Required quality gates after changes:
${QUALITY_GATES}
Instructions:
1. Read the review summary and focus only on the findings that keep the gate blocking.
2. Validate each blocking finding against the spec and the code. Do not blindly apply every suggestion.
3. Implement the smallest set of code changes needed to clear the valid blocking findings.
4. If a blocking finding is invalid, already fixed, or not actionable, record a concise rationale with file references in \`tmp/ship/local-review-fix-notes.md\`.
5. Run the required quality gates and leave them green.
6. Do not create a PR, push commits, or change unrelated code.
7. When done, print exactly: <local_review_fix_complete>LOCAL REVIEW FIX COMPLETE</local_review_fix_complete>
${GUIDANCE_SECTION}
EOF

printf '%s\n' "$OUTPUT_FILE"
