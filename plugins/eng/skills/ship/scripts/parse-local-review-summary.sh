#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: parse-local-review-summary.sh [--input <file>] [--output <file>]

Parses tmp/ship/review-output.md and writes a machine-readable status JSON that
Ship can use as a deterministic phase gate.

Options:
  --input <file>   Markdown summary to parse (default: ${CLAUDE_SHIP_DIR:-tmp/ship}/review-output.md)
  --output <file>  JSON status path (default: ${CLAUDE_SHIP_DIR:-tmp/ship}/review-status.json)
  -h, --help       Show this help
EOF
  exit "${1:-0}"
}

SHIP_DIR="${CLAUDE_SHIP_DIR:-tmp/ship}"
INPUT_FILE="${SHIP_DIR}/review-output.md"
OUTPUT_FILE="${SHIP_DIR}/review-status.json"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input)
      INPUT_FILE="${2:-}"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="${2:-}"
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

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "Review summary not found: $INPUT_FILE" >&2
  exit 1
fi

normalize_recommendation() {
  case "$1" in
    "APPROVE")
      printf 'APPROVE\n'
      ;;
    "APPROVE WITH SUGGESTIONS"|"APPROVE_WITH_SUGGESTIONS")
      printf 'APPROVE_WITH_SUGGESTIONS\n'
      ;;
    "REQUEST CHANGES"|"REQUEST_CHANGES")
      printf 'REQUEST_CHANGES\n'
      ;;
    *)
      return 1
      ;;
  esac
}

extract_section_count() {
  local section_label="$1"
  local line=""

  line=$(grep -E "^### .*${section_label} \\([0-9]+\\)" "$INPUT_FILE" | head -n1 || true)
  if [[ -z "$line" ]]; then
    printf '0\n'
    return 0
  fi

  printf '%s\n' "$line" | sed -E 's/.*\(([0-9]+)\).*/\1/'
}

build_json_array() {
  if [[ $# -eq 0 ]]; then
    printf '[]\n'
    return 0
  fi

  printf '%s\n' "$@" | jq -R . | jq -cs .
}

SUMMARY_LINE=$(grep -E '^\*\*\([0-9]+\) Total Issues\*\* \| Risk: \*\*[^*]+\*\* \| Recommendation: \*\*[^*]+\*\*$' "$INPUT_FILE" | head -n1 || true)
if [[ -z "$SUMMARY_LINE" ]]; then
  echo "Failed to locate the machine-readable review summary line in $INPUT_FILE" >&2
  exit 1
fi

TOTAL_ISSUES=$(printf '%s\n' "$SUMMARY_LINE" | sed -E 's/^\*\*\(([0-9]+)\) Total Issues\*\*.*/\1/')
RISK=$(printf '%s\n' "$SUMMARY_LINE" | sed -E 's#^\*\*\([0-9]+\) Total Issues\*\* \| Risk: \*\*([^*]+)\*\* \| Recommendation: \*\*[^*]+\*\*$#\1#')
RAW_RECOMMENDATION=$(printf '%s\n' "$SUMMARY_LINE" | sed -E 's#^\*\*\([0-9]+\) Total Issues\*\* \| Risk: \*\*[^*]+\*\* \| Recommendation: \*\*([^*]+)\*\*$#\1#')
RECOMMENDATION=$(normalize_recommendation "$RAW_RECOMMENDATION" || true)

if [[ -z "$RECOMMENDATION" ]]; then
  echo "Unrecognized recommendation in review summary: $RAW_RECOMMENDATION" >&2
  exit 1
fi

CRITICAL_COUNT=$(extract_section_count "Critical")
MAJOR_COUNT=$(extract_section_count "Major")
MINOR_COUNT=$(extract_section_count "Minor")
CONSIDER_COUNT=$(extract_section_count "Consider")
WHILE_HERE_COUNT=$(extract_section_count "While You're Here")
PENDING_COUNT=$(extract_section_count "Pending Recommendations")

BLOCKING=false
BLOCKING_REASONS=()
if [[ "$RECOMMENDATION" == "REQUEST_CHANGES" ]]; then
  BLOCKING=true
  BLOCKING_REASONS+=("Recommendation is REQUEST_CHANGES")
fi
if [[ "$CRITICAL_COUNT" -gt 0 ]]; then
  BLOCKING=true
  BLOCKING_REASONS+=("${CRITICAL_COUNT} Critical finding(s) remain")
fi
if [[ "$MAJOR_COUNT" -gt 0 ]]; then
  BLOCKING=true
  BLOCKING_REASONS+=("${MAJOR_COUNT} Major finding(s) remain")
fi

BLOCKING_REASONS_JSON='[]'
if [[ ${#BLOCKING_REASONS[@]} -gt 0 ]]; then
  BLOCKING_REASONS_JSON=$(build_json_array "${BLOCKING_REASONS[@]}")
fi

GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
mkdir -p "$(dirname "$OUTPUT_FILE")"

jq -n \
  --arg generatedAt "$GENERATED_AT" \
  --arg summaryFile "$INPUT_FILE" \
  --arg risk "$RISK" \
  --arg recommendation "$RECOMMENDATION" \
  --arg rawRecommendation "$RAW_RECOMMENDATION" \
  --argjson totalIssues "$TOTAL_ISSUES" \
  --argjson critical "$CRITICAL_COUNT" \
  --argjson major "$MAJOR_COUNT" \
  --argjson minor "$MINOR_COUNT" \
  --argjson consider "$CONSIDER_COUNT" \
  --argjson whileHere "$WHILE_HERE_COUNT" \
  --argjson pending "$PENDING_COUNT" \
  --argjson blocking "$BLOCKING" \
  --argjson blockingReasons "$BLOCKING_REASONS_JSON" \
  '{
    generatedAt: $generatedAt,
    summaryFile: $summaryFile,
    totalIssues: $totalIssues,
    risk: $risk,
    recommendation: $recommendation,
    recommendationDisplay: $rawRecommendation,
    counts: {
      critical: $critical,
      major: $major,
      minor: $minor,
      consider: $consider,
      whileYoureHere: $whileHere,
      pendingRecommendations: $pending
    },
    blocking: $blocking,
    blockingReasons: $blockingReasons
  }' > "$OUTPUT_FILE"

printf '%s\n' "$OUTPUT_FILE"
