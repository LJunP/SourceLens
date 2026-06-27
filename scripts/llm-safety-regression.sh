#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVAL_FILE="${ROOT_DIR}/docs/llm-safety-evals/prompt-injection-cases.json"
OUTPUT_EVAL_FILE="${ROOT_DIR}/docs/llm-safety-evals/output-quality-cases.json"
PROVIDER_RUN_TEMPLATE="${ROOT_DIR}/docs/llm-safety-evals/provider-run-template.json"

fail() {
  echo "LLM SAFETY CHECK FAIL: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

assert_match() {
  local description="$1"
  local pattern="$2"
  shift 2
  rg -n --hidden --glob '!backend-spring/target/**' --glob '!web-console/dist/**' "$pattern" "$@" >/dev/null \
    || fail "$description"
}

require_cmd node
require_cmd rg

cd "$ROOT_DIR"

node "$ROOT_DIR/scripts/validate-llm-safety-evals.mjs" "$EVAL_FILE" "$OUTPUT_EVAL_FILE"
node "$ROOT_DIR/scripts/validate-llm-provider-run.mjs" "$PROVIDER_RUN_TEMPLATE" "$EVAL_FILE" "$OUTPUT_EVAL_FILE" --allow-template

assert_match \
  "Code QA prompt must wrap retrieved chunks as untrusted data" \
  'wrapUntrustedContent\("retrieved code chunks"' \
  backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java

assert_match \
  "Agent runtime must wrap live tool results before model replay" \
  'wrapUntrustedContent\("tool result: " \+ toolName' \
  backend-spring/src/main/java/com/sourcelens/module/agent/service/AgentRuntime.java

assert_match \
  "PromptBuilder must wrap persisted tool results" \
  'wrapUntrustedContent\("tool result: " \+ toolName' \
  backend-spring/src/main/java/com/sourcelens/module/agent/service/PromptBuilder.java

assert_match \
  "AutoRepair prompt must wrap target descriptions" \
  'wrapUntrustedContent\("auto repair target description"' \
  backend-spring/src/main/java/com/sourcelens/module/autorepair/service/AutoRepairService.java

assert_match \
  "CI diagnostic prompt must wrap log snippets" \
  'wrapUntrustedContent\("ci log snippet"' \
  backend-spring/src/main/java/com/sourcelens/module/ci/service/CiDiagnosticService.java

assert_match \
  "PR review prompt must wrap diff summaries" \
  'wrapUntrustedContent\("pr diff summary"' \
  backend-spring/src/main/java/com/sourcelens/module/review/service/PrReviewService.java

assert_match \
  "Issue decomposition prompt must wrap issue descriptions" \
  'wrapUntrustedContent\("issue description"' \
  backend-spring/src/main/java/com/sourcelens/module/issue/service/IssueDecompositionService.java

assert_match \
  "Agent task prompt must wrap scan artifacts" \
  'wrapUntrustedContent\("agent scan data and rule result"' \
  backend-spring/src/main/java/com/sourcelens/module/agent/service/AgentTaskService.java

(
  cd backend-spring
  mvn -Dtest=PromptInjectionGuardTest,CodeQaControllerTest test
)

echo "LLM safety regression checks passed."
