#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GROUP_FILTER="${SOURCELENS_WORKTREE_INVENTORY_GROUP:-${1:-}}"
STRICT="${SOURCELENS_WORKTREE_INVENTORY_STRICT:-false}"

fail() {
  echo "WORKTREE INVENTORY FAIL: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

to_lower() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

normalize_config_value() {
  local value="$1"
  local first
  local last
  value="$(trim "$value")"
  while (( ${#value} >= 2 )); do
    first="${value:0:1}"
    last="${value: -1}"
    if [[ "$first" == '"' && "$last" == '"' ]] || [[ "$first" == "'" && "$last" == "'" ]]; then
      value="${value:1:${#value}-2}"
      value="$(trim "$value")"
    else
      break
    fi
  done
  printf '%s\n' "$value"
}

is_true() {
  local value
  value="$(normalize_config_value "${1:-}")"
  case "$(to_lower "$value")" in
    true|1|yes|y) return 0 ;;
    *) return 1 ;;
  esac
}

validate_bool_mode() {
  local key="$1"
  local value="$2"
  case "$(to_lower "$(normalize_config_value "$value")")" in
    true|1|yes|y|false|0|no|n) return 0 ;;
    *)
      fail "$key must be true or false"
      ;;
  esac
}

category_slug() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-//; s/-$//'
}

category_matches_filter() {
  local category="$1"
  [[ -z "$GROUP_FILTER" ]] && return 0
  [[ "$category" == "$GROUP_FILTER" ]] && return 0
  [[ "$(category_slug "$category")" == "$GROUP_FILTER" ]]
}

trim_status_path() {
  local line="$1"
  line="${line#???}"
  if [[ "$line" == *" -> "* ]]; then
    line="${line##* -> }"
  fi
  printf '%s\n' "$line"
}

status_code() {
  printf '%s\n' "${1:0:2}"
}

category_for() {
  local path="$1"

  case "$path" in
    web-console/dist/*|\
    web-console/.vite/*|\
    web-console/node_modules/.vite/*|\
    web-console/tsconfig*.tsbuildinfo|\
    analyzer-rust/target/*|\
    bin/*|\
    .DS_Store|\
    */.DS_Store|\
    target\ 2/*|\
    */target\ 2/*)
      echo "Repository hygiene / generated artifacts"
      ;;
    .github/*|scripts/*|deploy/*|.dockerignore|.gitignore|Makefile|backend-spring/Dockerfile)
      echo "Operations, CI and release gates"
      ;;
    docs/*|README.md)
      echo "Documentation and handoff"
      ;;
    analyzer-rust/*)
      echo "Rust analyzer"
      ;;
    web-console/*)
      echo "Frontend console"
      ;;
    backend-spring/src/main/java/com/sourcelens/common/security/*|\
backend-spring/src/main/java/com/sourcelens/common/config/SecurityStartupValidator.java|\
backend-spring/src/main/java/com/sourcelens/module/user/*|\
backend-spring/src/main/resources/application*.yml|\
backend-spring/src/test/java/com/sourcelens/AuthControllerTest.java|\
backend-spring/src/test/java/com/sourcelens/ActuatorSecurityTest.java|\
backend-spring/src/test/java/com/sourcelens/SecurityStartupValidatorTest.java|\
backend-spring/src/test/java/com/sourcelens/SensitiveDataSanitizerTest.java|\
backend-spring/src/test/java/com/sourcelens/common/security/*|\
backend-spring/src/test/resources/application-test.yml)
      echo "Security and auth boundary"
      ;;
    backend-spring/src/main/java/com/sourcelens/common/observability/*|\
backend-spring/src/main/java/com/sourcelens/common/web/*|\
backend-spring/src/main/java/com/sourcelens/module/audit/*|\
backend-spring/src/test/java/com/sourcelens/Audit*|\
backend-spring/src/test/java/com/sourcelens/RequestIdFilterTest.java|\
backend-spring/src/test/java/com/sourcelens/SourceLensMetricsTest.java)
      echo "Observability and audit"
      ;;
    backend-spring/src/main/java/com/sourcelens/module/agent/*|\
backend-spring/src/main/resources/db/migration/V014__*|\
    backend-spring/src/test/java/com/sourcelens/Agent*|\
    backend-spring/src/test/java/com/sourcelens/CodeQa*|\
    backend-spring/src/test/java/com/sourcelens/Llm*|\
backend-spring/src/test/java/com/sourcelens/PromptInjectionGuardTest.java|\
    backend-spring/src/test/java/com/sourcelens/module/agent/*)
      echo "Agent, LLM and tools"
      ;;
    backend-spring/src/main/java/com/sourcelens/module/analysis/*|\
backend-spring/src/main/java/com/sourcelens/module/scanstat/*|\
backend-spring/src/main/java/com/sourcelens/module/scantask/*|\
backend-spring/src/main/java/com/sourcelens/module/project/*|\
backend-spring/src/main/java/com/sourcelens/module/repository/service/RepositoryService.java|\
backend-spring/src/main/java/com/sourcelens/module/repository/controller/RepositoryController.java|\
backend-spring/src/main/java/com/sourcelens/module/repository/entity/Repository.java|\
backend-spring/src/main/resources/db/migration/V010__*|\
backend-spring/src/main/resources/db/migration/V011__*|\
backend-spring/src/main/resources/db/migration/V013__*|\
backend-spring/src/main/resources/db/migration/V023__*|\
backend-spring/src/test/java/com/sourcelens/Analysis*|\
backend-spring/src/test/java/com/sourcelens/ArchitectureRiskAnalyzerTest.java|\
backend-spring/src/test/java/com/sourcelens/CodeChunk*|\
backend-spring/src/test/java/com/sourcelens/CodeGraph*|\
backend-spring/src/test/java/com/sourcelens/JavaFallbackAnalyzerTest.java|\
backend-spring/src/test/java/com/sourcelens/Project*|\
backend-spring/src/test/java/com/sourcelens/RepositoryServiceTest.java|\
backend-spring/src/test/java/com/sourcelens/Scan*|\
backend-spring/src/test/java/com/sourcelens/module/scanstat/*)
      echo "Analysis, graph and project lifecycle"
      ;;
    backend-spring/src/main/java/com/sourcelens/module/execution/*|\
backend-spring/src/main/java/com/sourcelens/module/artifact/*|\
backend-spring/src/main/java/com/sourcelens/module/autorepair/*|\
backend-spring/src/main/java/com/sourcelens/module/ci/*|\
backend-spring/src/main/java/com/sourcelens/module/issue/*|\
backend-spring/src/main/java/com/sourcelens/module/review/*|\
backend-spring/src/main/resources/db/migration/V012__*|\
backend-spring/src/main/resources/db/migration/V015__*|\
backend-spring/src/main/resources/db/migration/V016__*|\
backend-spring/src/main/resources/db/migration/V017__*|\
backend-spring/src/main/resources/db/migration/V022__*|\
backend-spring/src/main/resources/db/migration/V024__*|\
backend-spring/src/main/resources/db/migration/V025__*|\
backend-spring/src/main/resources/db/migration/V026__*|\
backend-spring/src/test/java/com/sourcelens/Artifact*|\
backend-spring/src/test/java/com/sourcelens/AutoRepair*|\
backend-spring/src/test/java/com/sourcelens/CiDiagnostic*|\
backend-spring/src/test/java/com/sourcelens/Execution*|\
backend-spring/src/test/java/com/sourcelens/IssueDecomposition*|\
backend-spring/src/test/java/com/sourcelens/PrReview*)
      echo "Execution tasks, artifacts and automation"
      ;;
    backend-spring/src/main/java/com/sourcelens/module/repository/*GitHub*|\
backend-spring/src/main/java/com/sourcelens/module/repository/*/GitHub*|\
backend-spring/src/main/java/com/sourcelens/module/repository/service/GitHub*|\
backend-spring/src/main/java/com/sourcelens/module/repository/service/GitService.java|\
backend-spring/src/main/java/com/sourcelens/module/repository/service/RepositoryUrlPolicy.java|\
backend-spring/src/main/resources/db/migration/V018__*|\
backend-spring/src/main/resources/db/migration/V019__*|\
backend-spring/src/main/resources/db/migration/V020__*|\
backend-spring/src/main/resources/db/migration/V021__*|\
backend-spring/src/test/java/com/sourcelens/GitHub*|\
backend-spring/src/test/java/com/sourcelens/RepositoryUrlPolicyTest.java)
      echo "GitHub App and repository integration"
      ;;
    backend-spring/src/main/java/com/sourcelens/module/sandbox/*|\
backend-spring/src/main/java/com/sourcelens/module/workspace/*|\
backend-spring/src/test/java/com/sourcelens/*Sandbox*|\
backend-spring/src/test/java/com/sourcelens/Workspace*)
      echo "Sandbox and workspace isolation"
      ;;
    backend-spring/*)
      echo "Backend shared infrastructure"
      ;;
    *)
      echo "Other"
      ;;
  esac
}

print_group() {
  local category="$1"
  local tmp_file="$2"
  local count
  count="$(wc -l < "$tmp_file" | tr -d ' ')"
  [[ "$count" == "0" ]] && return

  printf '\n## %s (%s)\n\n' "$category" "$count"
  sed 's/^/- /' "$tmp_file"
}

category_file() {
  local category="$1"
  local safe="${category//\//-}"
  printf '%s/%s\n' "$tmp_dir" "$safe"
}

require_cmd git

cd "$ROOT_DIR"

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/sourcelens-worktree-inventory.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT
chmod 700 "$tmp_dir"

categories=(
  "Repository hygiene / generated artifacts"
  "Operations, CI and release gates"
  "Security and auth boundary"
  "Observability and audit"
  "Execution tasks, artifacts and automation"
  "Analysis, graph and project lifecycle"
  "Agent, LLM and tools"
  "Sandbox and workspace isolation"
  "GitHub App and repository integration"
  "Frontend console"
  "Rust analyzer"
  "Backend shared infrastructure"
  "Documentation and handoff"
  "Other"
)

print_review_order() {
  local index=1
  local category
  for category in "${categories[@]}"; do
    [[ "$category" == "Other" ]] && continue
    printf '%d. %s\n' "$index" "$category"
    index=$((index + 1))
  done
}

if [[ "$#" -gt 1 ]]; then
  fail "usage: scripts/worktree-inventory.sh [category-name-or-slug]"
fi

validate_bool_mode SOURCELENS_WORKTREE_INVENTORY_STRICT "$STRICT"

if [[ -n "$GROUP_FILTER" ]]; then
  filter_found=false
  for category in "${categories[@]}"; do
    if category_matches_filter "$category"; then
      filter_found=true
      break
    fi
  done
  if [[ "$filter_found" != "true" ]]; then
    {
      printf 'Unknown worktree inventory group: %s\n' "$GROUP_FILTER"
      printf 'Available groups:\n'
      for category in "${categories[@]}"; do
        printf -- '- %s (%s)\n' "$category" "$(category_slug "$category")"
      done
    } >&2
    exit 1
  fi
fi

for category in "${categories[@]}"; do
  : > "$(category_file "$category")"
done

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  path="$(trim_status_path "$line")"
  code="$(status_code "$line")"
  category="$(category_for "$path")"
  printf '`%s` `%s`\n' "$code" "$path" >> "$(category_file "$category")"
done < <(git status --short --untracked-files=all)

echo "# SourceLens Worktree Inventory"
echo
echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %z')"
if [[ -n "$GROUP_FILTER" ]]; then
  echo "Group filter: ${GROUP_FILTER}"
fi
echo
echo "Review order suggestion:"
echo
print_review_order

for category in "${categories[@]}"; do
  category_matches_filter "$category" || continue
  print_group "$category" "$(category_file "$category")"
done

other_count="$(wc -l < "$(category_file "Other")" | tr -d ' ')"
if is_true "$STRICT" && [[ "$other_count" != "0" ]]; then
  fail "strict mode found $other_count path(s) in Other; update category_for before relying on this inventory"
fi
