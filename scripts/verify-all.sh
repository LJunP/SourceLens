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
run_step "Backend tests" run_in_dir "${ROOT_DIR}/backend-spring" mvn clean test
run_step "Frontend build" run_in_dir "${ROOT_DIR}/web-console" npm run build
run_step "Rust analyzer check" run_in_dir "${ROOT_DIR}/analyzer-rust" cargo check --locked
run_step "Rust analyzer tests" run_in_dir "${ROOT_DIR}/analyzer-rust" cargo test --locked
run_step "LLM safety regression checks" "${ROOT_DIR}/scripts/llm-safety-regression.sh"
run_step "Security regression checks" "${ROOT_DIR}/scripts/security-regression-check.sh"
run_step "Dependency regression checks" "${ROOT_DIR}/scripts/dependency-regression-check.sh"

echo
echo "All SourceLens verification gates passed."
