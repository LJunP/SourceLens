#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_ROLLBACK_PREFLIGHT_ENV_FILE:-${SOURCELENS_PREFLIGHT_ENV_FILE:-deploy/.env}}"
WARN_ONLY="${SOURCELENS_ROLLBACK_PREFLIGHT_WARN_ONLY:-false}"

failures=0
warnings=0

fail() {
  echo "ROLLBACK PREFLIGHT FAIL: $*" >&2
  exit 1
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

normalize_base_url() {
  local value
  value="$(normalize_config_value "$1")"
  while [[ "$value" == */ && "$value" != "http://" && "$value" != "https://" ]]; do
    value="${value%/}"
  done
  printf '%s\n' "$value"
}

require_base_url_shape() {
  local key="$1"
  local value="$2"
  local lower
  local authority
  if [[ "$value" =~ [[:space:]] ]]; then
    record_fail "$key must not contain whitespace"
    return 1
  fi
  lower="$(to_lower "$value")"
  if [[ "$lower" != http://* && "$lower" != https://* ]]; then
    record_fail "$key must use http or https"
    return 1
  fi
  if [[ "$value" == *"?"* || "$value" == *"#"* ]]; then
    record_fail "$key must not contain user-info, query or fragment"
    return 1
  fi
  authority="${value#*://}"
  authority="${authority%%/*}"
  if [[ -z "$authority" ]]; then
    record_fail "$key must include a host"
    return 1
  fi
  if [[ "$authority" == *"@"* ]]; then
    record_fail "$key must not contain user-info, query or fragment"
    return 1
  fi
}

is_true() {
  local value
  value="$(normalize_config_value "${1:-}")"
  case "$(to_lower "$value")" in
    true|1|yes|y) return 0 ;;
    *) return 1 ;;
  esac
}

is_false() {
  local value
  value="$(normalize_config_value "${1:-}")"
  case "$(to_lower "$value")" in
    false|0|no|n) return 0 ;;
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

log_check() {
  local level="$1"
  local message="$2"
  printf '[%s] %s\n' "$level" "$message"
}

record_fail() {
  if is_true "$WARN_ONLY"; then
    warnings=$((warnings + 1))
    log_check "WARN" "$1"
  else
    failures=$((failures + 1))
    log_check "FAIL" "$1"
  fi
}

record_warn() {
  warnings=$((warnings + 1))
  log_check "WARN" "$1"
}

record_ok() {
  log_check "OK" "$1"
}

resolve_path() {
  local path="$1"
  case "$path" in
    /*) printf '%s\n' "$path" ;;
    *) printf '%s/%s\n' "$ROOT_DIR" "$path" ;;
  esac
}

strip_trailing_slashes() {
  local path="$1"
  while [[ "$path" == */ && "$path" != "/" ]]; do
    path="${path%/}"
  done
  printf '%s\n' "$path"
}

is_path_inside() {
  local child
  local parent
  child="$(strip_trailing_slashes "$(resolve_path "$1")")"
  parent="$(strip_trailing_slashes "$(resolve_path "$2")")"
  [[ "$child" == "$parent" || "$child" == "$parent/"* ]]
}

env_from_file() {
  local key="$1"
  local path
  path="$(resolve_path "$ENV_FILE")"
  [[ -f "$path" ]] || return 0
  awk -v key="$key" '
    function trim_value(value) {
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      return value
    }
    {
      line = $0
      sub(/\r$/, "", line)
      if (line ~ /^[[:space:]]*(#|$)/) {
        next
      }
      sub(/^[[:space:]]*export[[:space:]]+/, "", line)
      eq = index(line, "=")
      if (eq == 0) {
        next
      }
      raw_key = trim_value(substr(line, 1, eq - 1))
      if (raw_key == key) {
        value = substr(line, eq + 1)
        found = 1
      }
    }
    END {
      if (found) {
        print value
      }
    }
  ' "$path"
}

config_value() {
  local key="$1"
  local env_value="${!key-}"
  local file_value
  if [[ -n "$env_value" ]]; then
    normalize_config_value "$env_value"
    return
  fi
  file_value="$(env_from_file "$key")"
  if [[ -n "$file_value" ]]; then
    normalize_config_value "$file_value"
  fi
}

file_mode() {
  local path="$1"
  if stat -f '%Lp' "$path" >/dev/null 2>&1; then
    stat -f '%Lp' "$path"
    return
  fi
  if stat -c '%a' "$path" >/dev/null 2>&1; then
    stat -c '%a' "$path"
    return
  fi
  return 1
}

file_mtime_epoch() {
  local path="$1"
  if stat -f '%m' "$path" >/dev/null 2>&1; then
    stat -f '%m' "$path"
    return
  fi
  if stat -c '%Y' "$path" >/dev/null 2>&1; then
    stat -c '%Y' "$path"
    return
  fi
  return 1
}

require_cmd() {
  local command="$1"
  local purpose="$2"
  if command -v "$command" >/dev/null 2>&1; then
    record_ok "$command is available for $purpose"
  else
    record_fail "$command is required for $purpose"
  fi
}

require_positive_integer_config() {
  local result_var="$1"
  local key="$2"
  local default_value="$3"
  local purpose="$4"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    value="$default_value"
  fi
  if [[ "$value" =~ ^[1-9][0-9]*$ ]]; then
    record_ok "$key=$value for $purpose"
    printf -v "$result_var" '%s' "$value"
    return 0
  fi
  record_fail "$key must be a positive integer for $purpose, got $value"
  return 1
}

is_safe_backup_id() {
  local value="$1"
  [[ "$value" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{2,127}$ ]]
}

backup_artifact_kind_found() {
  local backup_path="$1"
  local backup_id="$2"
  local kind="$3"
  backup_artifact_path_for_kind "$backup_path" "$backup_id" "$kind" >/dev/null
}

backup_artifact_any_found() {
  local backup_path="$1"
  local backup_id="$2"
  find "$backup_path" -maxdepth 2 \( -type f -o -type l \) -name "$backup_id[-_.]*" -print -quit | grep -q .
}

backup_artifact_path_for_kind() {
  local backup_path="$1"
  local backup_id="$2"
  local kind="$3"
  find "$backup_path" -maxdepth 2 \( -type f -o -type l \) -name "$backup_id[-_.]*" -print \
    | LC_ALL=C sort \
    | awk -v kind="$kind" '
      function basename(path) {
        sub(/^.*\//, "", path)
        return tolower(path)
      }
      {
        name = basename($0)
        if (kind == "database" && name ~ /(database|db|mysql|dump)/) {
          print $0
          found = 1
          exit
        } else if (kind == "workspace" && name ~ /workspace/) {
          print $0
          found = 1
          exit
        } else if (kind == "artifacts" && name ~ /artifacts/) {
          print $0
          found = 1
          exit
        } else if (kind == "checksums" && name ~ /(checksums|checksum|sha256|sha256sum|shasum)/) {
          print $0
          found = 1
          exit
        }
      }
      END {
        exit(found ? 0 : 1)
      }
    '
}

sha256_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" | awk '{print tolower($1)}'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$path" | awk '{print tolower($1)}'
    return
  fi
  return 1
}

checksum_manifest_covers_artifact() {
  local manifest_path="$1"
  local artifact_path="$2"
  local expected_hash
  local artifact_name
  expected_hash="$(sha256_file "$artifact_path")" || return 2
  artifact_name="$(basename "$artifact_path")"
  awk -v expected_hash="$expected_hash" -v artifact_name="$artifact_name" '
    function basename(path) {
      sub(/^\*/, "", path)
      sub(/^\.\//, "", path)
      sub(/^.*\//, "", path)
      return path
    }
    {
      hash = tolower($1)
      if (hash != expected_hash) {
        next
      }
      path = $0
      sub(/^[^[:space:]]+[[:space:]]+\*?/, "", path)
      if (basename(path) == artifact_name) {
        found = 1
      }
    }
    END {
      exit(found ? 0 : 1)
    }
  ' "$manifest_path"
}

require_backup_artifact_file() {
  local artifact_path="$1"
  local kind="$2"
  local purpose="$3"
  local mode
  local numeric_mode
  local valid=true
  if [[ -L "$artifact_path" ]]; then
    record_fail "backup $kind artifact must not be a symlink for $purpose: $artifact_path"
    valid=false
  elif [[ ! -f "$artifact_path" ]]; then
    record_fail "backup $kind artifact must be a regular file for $purpose: $artifact_path"
    valid=false
  fi
  if [[ "$valid" == "false" ]]; then
    return 1
  fi
  if [[ ! -s "$artifact_path" ]]; then
    record_fail "backup $kind artifact must be non-empty for $purpose: $artifact_path"
    valid=false
  fi
  if [[ ! -r "$artifact_path" ]]; then
    record_fail "backup $kind artifact must be readable for $purpose: $artifact_path"
    valid=false
  fi
  if ! mode="$(file_mode "$artifact_path")"; then
    record_fail "backup $kind artifact permissions could not be inspected for $purpose: $artifact_path"
    valid=false
  elif [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    record_fail "backup $kind artifact permissions could not be parsed for $purpose: $artifact_path (mode $mode)"
    valid=false
  else
    numeric_mode=$((8#$mode))
    if (( (numeric_mode & 8#022) == 0 )); then
      record_ok "backup $kind artifact is not group/world writable for $purpose ($mode)"
    else
      record_fail "backup $kind artifact must not be group/world writable for $purpose: $artifact_path (current mode $mode)"
      valid=false
    fi
  fi
  [[ "$valid" == "true" ]]
}

require_backup_checksum_manifest_coverage() {
  local backup_path="$1"
  local backup_id="$2"
  local purpose="$3"
  local manifest_path
  local kind
  local artifact_path
  manifest_path="$(backup_artifact_path_for_kind "$backup_path" "$backup_id" "checksums" || true)"
  if [[ -z "$manifest_path" ]]; then
    record_fail "SOURCELENS_BACKUP_DIR must contain a checksums artifact filename with backup_id=$backup_id for $purpose"
    return
  fi
  if ! require_backup_artifact_file "$manifest_path" "checksums" "$purpose"; then
    return 0
  fi
  for kind in database workspace artifacts; do
    artifact_path="$(backup_artifact_path_for_kind "$backup_path" "$backup_id" "$kind" || true)"
    if [[ -z "$artifact_path" ]]; then
      continue
    fi
    if ! require_backup_artifact_file "$artifact_path" "$kind" "$purpose"; then
      continue
    fi
    if checksum_manifest_covers_artifact "$manifest_path" "$artifact_path"; then
      record_ok "backup checksum manifest verifies $kind artifact for $purpose"
    else
      record_fail "backup checksums artifact must include the SHA-256 for $kind artifact with backup_id=$backup_id for $purpose"
    fi
  done
}

require_backup_artifact_kind() {
  local backup_path="$1"
  local backup_id="$2"
  local kind="$3"
  local purpose="$4"
  local artifact_path
  artifact_path="$(backup_artifact_path_for_kind "$backup_path" "$backup_id" "$kind" || true)"
  if [[ -z "$artifact_path" ]]; then
    record_fail "SOURCELENS_BACKUP_DIR must contain a $kind artifact filename with backup_id=$backup_id for $purpose"
    return
  fi
  if require_backup_artifact_file "$artifact_path" "$kind" "$purpose"; then
    record_ok "backup artifact set contains validated $kind artifact for $purpose"
  fi
}

require_backup_artifact_set() {
  local backup_path="$1"
  local backup_id="$2"
  local purpose="$3"
  require_backup_artifact_kind "$backup_path" "$backup_id" "database" "$purpose"
  require_backup_artifact_kind "$backup_path" "$backup_id" "workspace" "$purpose"
  require_backup_artifact_kind "$backup_path" "$backup_id" "artifacts" "$purpose"
  require_backup_artifact_kind "$backup_path" "$backup_id" "checksums" "$purpose"
  require_backup_checksum_manifest_coverage "$backup_path" "$backup_id" "$purpose"
}

require_false_or_unset() {
  local key="$1"
  local purpose="$2"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    record_ok "$key is not overridden; treated as disabled for $purpose"
    return
  fi
  if is_false "$value"; then
    record_ok "$key is disabled for $purpose"
  else
    record_fail "$key must be false or unset during rollback, got $value"
  fi
}

validate_false_or_unset() {
  local key="$1"
  local value
  value="$(config_value "$key")"
  [[ -z "$value" ]] && return 0
  if is_false "$value"; then
    return 0
  fi
  fail "$key must be false or unset during rollback, got $value"
}

validate_startup_stop_switches() {
  validate_false_or_unset SOURCELENS_AGENT_WRITE_PATCH_ENABLED
  validate_false_or_unset SOURCELENS_AGENT_EXEC_TEST_ENABLED
  validate_false_or_unset SOURCELENS_AGENT_CREATE_PR_ENABLED
  validate_false_or_unset SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED
}

check_env_file() {
  echo
  echo "== Deployment env file =="
  local selected_path
  local template_path
  local mode
  local numeric_mode
  selected_path="$(resolve_path "$ENV_FILE")"
  template_path="$(resolve_path "deploy/.env.example")"

  if [[ "$selected_path" == "$template_path" ]]; then
    record_ok "$ENV_FILE is an example template; private env file permission check skipped"
    return
  fi
  if [[ -L "$selected_path" ]]; then
    record_fail "$ENV_FILE must not be a symlink"
    return
  fi
  if [[ ! -e "$selected_path" ]]; then
    record_warn "$ENV_FILE not found; checking process environment only"
    return
  fi
  if [[ ! -f "$selected_path" ]]; then
    record_fail "$ENV_FILE must be a regular deployment env file"
    return
  fi
  if [[ ! -s "$selected_path" ]]; then
    record_fail "$ENV_FILE must be non-empty"
    return
  fi
  if [[ ! -r "$selected_path" ]]; then
    record_fail "$ENV_FILE must be readable by the rollback preflight user"
    return
  fi
  record_ok "using env file $ENV_FILE"

  if ! mode="$(file_mode "$selected_path")"; then
    record_fail "$ENV_FILE permissions could not be inspected with stat"
    return
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    record_fail "$ENV_FILE permissions could not be parsed: $mode"
    return
  fi

  numeric_mode=$((8#$mode))
  if (( (numeric_mode & 8#077) == 0 )); then
    record_ok "$ENV_FILE permissions are private ($mode)"
  else
    record_fail "$ENV_FILE permissions must not grant group/world access; run chmod 600 $ENV_FILE (current mode $mode)"
  fi
}

check_toolchain() {
  echo
  echo "== Rollback toolchain =="
  require_cmd git "rollback release reference inspection"
  require_cmd curl "rollback smoke verification"
}

check_rollback_target() {
  echo
  echo "== Rollback target =="
  local target_ref
  target_ref="$(config_value SOURCELENS_ROLLBACK_TARGET_REF)"
  if [[ -z "$target_ref" ]]; then
    record_fail "SOURCELENS_ROLLBACK_TARGET_REF is required and must be immutable"
    return
  fi
  if [[ "$target_ref" =~ ^[0-9a-f]{40}$ || "$target_ref" =~ ^[^[:space:]]+@sha256:[0-9a-fA-F]{64}$ ]]; then
    record_ok "SOURCELENS_ROLLBACK_TARGET_REF is immutable"
  else
    record_fail "SOURCELENS_ROLLBACK_TARGET_REF must be a 40-character git SHA or image@sha256:digest, got $target_ref"
  fi
}

check_rollback_backup() {
  echo
  echo "== Rollback backup =="
  local backup_id
  local backup_dir
  local backup_path
  local workspace
  local mode
  local numeric_mode
  backup_id="$(config_value SOURCELENS_ROLLBACK_BACKUP_ID)"
  backup_dir="$(config_value SOURCELENS_BACKUP_DIR)"
  workspace="$(config_value SOURCELENS_WORKSPACE)"
  workspace="${workspace:-/var/lib/sourcelens/repos}"
  if [[ -z "$backup_id" ]]; then
    record_fail "SOURCELENS_ROLLBACK_BACKUP_ID is required so rollback can restore the matching backup set"
  elif is_safe_backup_id "$backup_id"; then
    record_ok "SOURCELENS_ROLLBACK_BACKUP_ID uses a safe artifact id format"
  else
    record_fail "SOURCELENS_ROLLBACK_BACKUP_ID must be 3-128 characters of letters, digits, dot, underscore or dash, and must not contain slashes, whitespace or glob characters"
  fi
  if [[ -z "$backup_dir" ]]; then
    record_fail "SOURCELENS_BACKUP_DIR is required to verify rollback backup artifacts"
    return
  fi
  backup_path="$(resolve_path "$backup_dir")"
  if [[ ! -d "$backup_path" ]]; then
    record_fail "SOURCELENS_BACKUP_DIR must exist before rollback: $backup_path"
    return
  fi
  if [[ -L "$backup_path" ]]; then
    record_fail "SOURCELENS_BACKUP_DIR must not be a symlink during rollback"
  fi
  if is_path_inside "$backup_path" "$ROOT_DIR"; then
    record_fail "SOURCELENS_BACKUP_DIR must not be inside the git worktree during rollback"
  else
    record_ok "SOURCELENS_BACKUP_DIR is outside the git worktree"
  fi
  if is_path_inside "$backup_path" "$workspace"; then
    record_fail "SOURCELENS_BACKUP_DIR must not be inside SOURCELENS_WORKSPACE during rollback"
  else
    record_ok "SOURCELENS_BACKUP_DIR is outside SOURCELENS_WORKSPACE"
  fi
  if [[ -r "$backup_path" && -x "$backup_path" ]]; then
    record_ok "SOURCELENS_BACKUP_DIR is readable and searchable for rollback"
  else
    record_fail "SOURCELENS_BACKUP_DIR must be readable and searchable by the release user during rollback"
  fi
  if ! mode="$(file_mode "$backup_path")"; then
    record_fail "SOURCELENS_BACKUP_DIR permissions could not be inspected with stat"
  elif [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    record_fail "SOURCELENS_BACKUP_DIR permissions could not be parsed: $mode"
  else
    numeric_mode=$((8#$mode))
    if (( (numeric_mode & 8#077) == 0 )); then
      record_ok "SOURCELENS_BACKUP_DIR permissions are private ($mode)"
    else
      record_fail "SOURCELENS_BACKUP_DIR permissions must not grant group/world access during rollback; run chmod 700 $backup_path (current mode $mode)"
    fi
  fi
  if [[ -n "$backup_id" ]] && is_safe_backup_id "$backup_id" \
      && backup_artifact_any_found "$backup_path" "$backup_id"; then
    record_ok "backup artifacts matching SOURCELENS_ROLLBACK_BACKUP_ID were found"
    require_backup_artifact_set "$backup_path" "$backup_id" "rollback"
  elif [[ -n "$backup_id" ]] && is_safe_backup_id "$backup_id"; then
    record_fail "SOURCELENS_BACKUP_DIR does not contain artifacts matching SOURCELENS_ROLLBACK_BACKUP_ID=$backup_id"
  fi
}

check_rollback_plan() {
  echo
  echo "== Rollback plan =="
  local plan_file
  local plan_path
  local target_ref
  local backup_id
  local mode
  local numeric_mode
  local max_age_days
  local max_age_seconds
  local mtime
  local now
  local age_seconds
  plan_file="$(config_value SOURCELENS_ROLLBACK_PLAN_FILE)"
  target_ref="$(config_value SOURCELENS_ROLLBACK_TARGET_REF)"
  backup_id="$(config_value SOURCELENS_ROLLBACK_BACKUP_ID)"
  if [[ -z "$plan_file" ]]; then
    record_fail "SOURCELENS_ROLLBACK_PLAN_FILE is required"
    return
  fi
  plan_path="$(resolve_path "$plan_file")"
  if [[ -L "$plan_path" ]]; then
    record_fail "SOURCELENS_ROLLBACK_PLAN_FILE must not be a symlink"
    return
  fi
  if [[ ! -f "$plan_path" ]]; then
    record_fail "SOURCELENS_ROLLBACK_PLAN_FILE must exist: $plan_path"
    return
  fi
  if [[ -s "$plan_path" ]]; then
    record_ok "SOURCELENS_ROLLBACK_PLAN_FILE is non-empty"
  else
    record_fail "SOURCELENS_ROLLBACK_PLAN_FILE must be non-empty"
  fi
  if [[ -r "$plan_path" ]]; then
    record_ok "SOURCELENS_ROLLBACK_PLAN_FILE is readable"
  else
    record_fail "SOURCELENS_ROLLBACK_PLAN_FILE must be readable"
  fi
  if ! mode="$(file_mode "$plan_path")"; then
    record_fail "SOURCELENS_ROLLBACK_PLAN_FILE permissions could not be inspected with stat"
  elif [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    record_fail "SOURCELENS_ROLLBACK_PLAN_FILE permissions could not be parsed: $mode"
  else
    numeric_mode=$((8#$mode))
    if (( (numeric_mode & 8#022) == 0 )); then
      record_ok "SOURCELENS_ROLLBACK_PLAN_FILE is not group/world writable ($mode)"
    else
      record_fail "SOURCELENS_ROLLBACK_PLAN_FILE must not be group/world writable (current mode $mode)"
    fi
  fi
  if require_positive_integer_config max_age_days SOURCELENS_ROLLBACK_PLAN_MAX_AGE_DAYS 7 "rollback plan freshness"; then
    if mtime="$(file_mtime_epoch "$plan_path")"; then
      now="$(date +%s)"
      max_age_seconds=$((max_age_days * 86400))
      age_seconds=$((now - mtime))
      if (( age_seconds < 0 )); then
        record_fail "SOURCELENS_ROLLBACK_PLAN_FILE modification time must not be in the future"
      elif (( age_seconds <= max_age_seconds )); then
        record_ok "SOURCELENS_ROLLBACK_PLAN_FILE is within the allowed age window"
      else
        record_fail "SOURCELENS_ROLLBACK_PLAN_FILE is older than SOURCELENS_ROLLBACK_PLAN_MAX_AGE_DAYS=$max_age_days"
      fi
    else
      record_fail "SOURCELENS_ROLLBACK_PLAN_FILE modification time could not be inspected with stat"
    fi
  fi
  if [[ -n "$target_ref" ]] && grep -Fq "$target_ref" "$plan_path"; then
    record_ok "rollback plan references SOURCELENS_ROLLBACK_TARGET_REF"
  elif [[ -n "$target_ref" ]]; then
    record_fail "rollback plan must reference SOURCELENS_ROLLBACK_TARGET_REF"
  fi
  if [[ -n "$backup_id" ]] && is_safe_backup_id "$backup_id" && grep -Fq "$backup_id" "$plan_path"; then
    record_ok "rollback plan references SOURCELENS_ROLLBACK_BACKUP_ID"
  elif [[ -n "$backup_id" ]] && is_safe_backup_id "$backup_id"; then
    record_fail "rollback plan must reference SOURCELENS_ROLLBACK_BACKUP_ID"
  fi
}

check_stop_switches() {
  echo
  echo "== Rollback stop switches =="
  require_false_or_unset SOURCELENS_AGENT_WRITE_PATCH_ENABLED "rollback"
  require_false_or_unset SOURCELENS_AGENT_EXEC_TEST_ENABLED "rollback"
  require_false_or_unset SOURCELENS_AGENT_CREATE_PR_ENABLED "rollback"
  require_false_or_unset SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED "rollback"
}

check_smoke_target() {
  echo
  echo "== Rollback smoke target =="
  local base_url
  local connect_timeout
  local max_time
  local -a curl_timeout_args
  base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
  if [[ -z "$base_url" ]]; then
    record_fail "SOURCELENS_BASE_URL is required for rollback smoke verification"
    return
  fi
  if ! require_base_url_shape SOURCELENS_BASE_URL "$base_url"; then
    return
  fi
  if ! require_positive_integer_config connect_timeout SOURCELENS_SMOKE_CONNECT_TIMEOUT 5 "rollback smoke connect timeout"; then
    return
  fi
  if ! require_positive_integer_config max_time SOURCELENS_SMOKE_MAX_TIME 15 "rollback smoke max time"; then
    return
  fi
  curl_timeout_args=(--connect-timeout "$connect_timeout" --max-time "$max_time")
  if curl "${curl_timeout_args[@]}" -fsS "$base_url/api/health" >/dev/null; then
    record_ok "$base_url/api/health is reachable before rollback"
  else
    record_fail "$base_url/api/health is not reachable before rollback"
  fi
}

validate_bool_mode SOURCELENS_ROLLBACK_PREFLIGHT_WARN_ONLY "$WARN_ONLY"
validate_startup_stop_switches

echo "SourceLens rollback preflight"
echo "============================="
echo "Mode: $(is_true "$WARN_ONLY" && echo warn-only || echo strict)"

check_env_file
check_toolchain
check_rollback_target
check_rollback_backup
check_rollback_plan
check_stop_switches
check_smoke_target

echo
echo "Summary: ${failures} failure(s), ${warnings} warning(s)"

if (( failures > 0 )); then
  exit 1
fi
