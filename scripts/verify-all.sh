#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

run_step() {
  local title="$1"
  shift
  echo
  echo "==> ${title}"
  "$@"
}

run_in_dir() {
  local dir="$1"
  shift
  (cd "$dir" && "$@")
}

check_shell_scripts() {
  local script
  for script in "${ROOT_DIR}"/scripts/*.sh; do
    bash -n "$script"
  done
}

check_git_diff_whitespace() {
  git -C "$ROOT_DIR" diff --check
  git -C "$ROOT_DIR" diff --cached --check
}

run_step "Shell script syntax" check_shell_scripts
run_step "Git diff whitespace check" check_git_diff_whitespace
run_step "Project code map freshness" node "${ROOT_DIR}/scripts/generate-project-code-map.mjs" --check
run_step "API design contract gate" "${ROOT_DIR}/scripts/validate-api-design.mjs"
run_step "DB schema contract gate" node "${ROOT_DIR}/scripts/validate-db-schema-contract.mjs"
run_step "Backend tests" run_in_dir "${ROOT_DIR}/backend-spring" mvn clean test
run_step "Frontend build" run_in_dir "${ROOT_DIR}/web-console" npm run build
run_step "Frontend UI regression checks" "${ROOT_DIR}/scripts/validate-frontend-ui.mjs"
run_step "Artifact quality regression checks" "${ROOT_DIR}/scripts/validate-artifact-quality.mjs" --self-test
run_step "Rust analyzer check" run_in_dir "${ROOT_DIR}/analyzer-rust" cargo check --locked
run_step "Rust analyzer tests" run_in_dir "${ROOT_DIR}/analyzer-rust" cargo test --locked
run_step "LLM safety regression checks" "${ROOT_DIR}/scripts/llm-safety-regression.sh"
run_step "Security static regression checks" env SOURCELENS_SECURITY_REGRESSION_SUITE=static "${ROOT_DIR}/scripts/security-regression-check.sh"
run_step "Dependency regression checks" "${ROOT_DIR}/scripts/dependency-regression-check.sh"

echo
echo "All SourceLens verification gates passed."
