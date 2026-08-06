#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRY_RUN="${SOURCELENS_CLEAN_DRY_RUN:-0}"
RUNTIME_KEEP="${SOURCELENS_RUNTIME_KEEP:-1}"

if ! [[ "$RUNTIME_KEEP" =~ ^[0-9]+$ ]] || [ "$RUNTIME_KEEP" -lt 1 ]; then
  echo "ERROR: SOURCELENS_RUNTIME_KEEP must be a positive integer." >&2
  exit 2
fi

run_rm_file() {
  local path="$1"
  if [ ! -e "$path" ]; then
    return
  fi
  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] remove file: $path"
  else
    rm -f -- "$path"
    echo "removed file: $path"
  fi
}

run_rm_dir() {
  local path="$1"
  if [ ! -e "$path" ]; then
    return
  fi
  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] remove dir: $path"
  else
    rm -rf -- "$path"
    echo "removed dir: $path"
  fi
}

is_path_open() {
  local path="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof "$path" >/dev/null 2>&1
  else
    return 1
  fi
}

is_backend_target_in_process_command() {
  if command -v ps >/dev/null 2>&1; then
    ps -eo command | grep -F "$ROOT_DIR/backend-spring/target/classes" | grep -v grep >/dev/null 2>&1
  else
    return 1
  fi
}

cleanup_backend_runtime_jars() {
  local runtime_dir="$ROOT_DIR/.sourcelens-runtime/backend"
  local list_file
  local kept=0
  local removed=0

  [ -d "$runtime_dir" ] || return
  list_file="$(mktemp)"
  find "$runtime_dir" -maxdepth 1 -type f -name 'source-lens-backend.*' -exec stat -f '%m %N' {} \; | sort -rn > "$list_file"

  while IFS= read -r line; do
    [ -n "$line" ] || continue
    local path="${line#* }"
    kept=$((kept + 1))
    if [ "$kept" -le "$RUNTIME_KEEP" ]; then
      echo "kept runtime jar: $path"
      continue
    fi
    if is_path_open "$path"; then
      echo "skipped open runtime jar: $path"
      continue
    fi
    run_rm_file "$path"
    removed=$((removed + 1))
  done < "$list_file"

  rm -f "$list_file"
  echo "runtime jar cleanup complete: kept=$RUNTIME_KEEP removed=$removed"
}

cleanup_generated_dirs() {
  run_rm_dir "$ROOT_DIR/analyzer-rust/target"
  run_rm_dir "$ROOT_DIR/web-console/dist"
  run_rm_dir "$ROOT_DIR/web-console/test-results"
  run_rm_dir "$ROOT_DIR/web-console/playwright-report"
  run_rm_file "$ROOT_DIR/web-console/tsconfig.tsbuildinfo"
  run_rm_file "$ROOT_DIR/web-console/tsconfig.node.tsbuildinfo"

  if [ -d "$ROOT_DIR/backend-spring/target" ]; then
    if is_path_open "$ROOT_DIR/backend-spring/target/classes" || is_backend_target_in_process_command; then
      echo "skipped backend-spring/target because a local backend process is using target/classes"
    else
      run_rm_dir "$ROOT_DIR/backend-spring/target"
    fi
  fi
}

cd "$ROOT_DIR"
cleanup_backend_runtime_jars
cleanup_generated_dirs
