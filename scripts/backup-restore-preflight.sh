#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_BACKUP_PREFLIGHT_ENV_FILE:-${SOURCELENS_PREFLIGHT_ENV_FILE:-deploy/.env}}"
WARN_ONLY="${SOURCELENS_BACKUP_PREFLIGHT_WARN_ONLY:-false}"

failures=0
warnings=0

fail() {
  echo "BACKUP PREFLIGHT FAIL: $*" >&2
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

require_any_cmd() {
  local purpose="$1"
  shift
  local command
  for command in "$@"; do
    if command -v "$command" >/dev/null 2>&1; then
      record_ok "$command is available for $purpose"
      return
    fi
  done
  record_fail "one of [$*] is required for $purpose"
}

is_safe_docker_container_name() {
  local value="$1"
  [[ "$value" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$ ]]
}

backup_toolchain_executor() {
  local value
  value="$(config_value SOURCELENS_BACKUP_TOOLCHAIN_EXECUTOR)"
  if [[ -z "$value" ]]; then
    printf 'host\n'
  else
    printf '%s\n' "$value"
  fi
}

check_host_mysql_toolchain() {
  require_cmd mysqldump "database backup"
  require_cmd mysql "restore dry run and manual restore verification"
}

check_docker_mysql_toolchain() {
  local executor="$1"
  local container="${executor#docker:}"
  if [[ -z "$container" ]] || ! is_safe_docker_container_name "$container"; then
    record_fail "SOURCELENS_BACKUP_TOOLCHAIN_EXECUTOR docker executor must use docker:<safe-container-name>"
    return
  fi
  require_cmd docker "containerized backup toolchain"
  if ! command -v docker >/dev/null 2>&1; then
    return
  fi
  if docker inspect "$container" >/dev/null 2>&1; then
    record_ok "backup toolchain Docker container is available: $container"
  else
    record_fail "SOURCELENS_BACKUP_TOOLCHAIN_EXECUTOR Docker container is not available: $container"
    return
  fi
  if docker exec "$container" sh -lc 'command -v mysqldump >/dev/null 2>&1'; then
    record_ok "mysqldump is available inside backup toolchain container"
  else
    record_fail "mysqldump is required inside backup toolchain container: $container"
  fi
  if docker exec "$container" sh -lc 'command -v mysql >/dev/null 2>&1'; then
    record_ok "mysql is available inside backup toolchain container"
  else
    record_fail "mysql is required inside backup toolchain container: $container"
  fi
}

require_config() {
  local key="$1"
  local purpose="$2"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    record_fail "$key is required for $purpose"
    return
  fi
  case "$value" in
    change-this*|your_*|your-*|changeme|CHANGE_ME)
      record_fail "$key still uses placeholder value"
      ;;
    *)
      record_ok "$key is configured for $purpose"
      ;;
  esac
}

require_positive_integer_config() {
  local key="$1"
  local default_value="$2"
  local purpose="$3"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    value="$default_value"
  fi
  if [[ "$value" =~ ^[1-9][0-9]*$ ]]; then
    record_ok "$key=$value for $purpose"
  else
    record_fail "$key must be a positive integer for $purpose, got $value"
  fi
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

iso8601_utc_to_epoch() {
  local value="$1"
  if date -u -d "$value" +%s >/dev/null 2>&1; then
    date -u -d "$value" +%s
    return
  fi
  if date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "$value" +%s >/dev/null 2>&1; then
    date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "$value" +%s
    return
  fi
  return 1
}

evidence_value() {
  local path="$1"
  local key="$2"
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
      eq = index(line, "=")
      if (eq == 0) {
        next
      }
      raw_key = trim_value(substr(line, 1, eq - 1))
      if (raw_key == key) {
        value = trim_value(substr(line, eq + 1))
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

evidence_marker_present() {
  local path="$1"
  local key="$2"
  grep -Eiq "^[[:space:]]*${key}[[:space:]]*=[[:space:]]*(pass|passed|ok|success)[[:space:]]*$" "$path"
}

require_evidence_marker() {
  local path="$1"
  local key="$2"
  local purpose="$3"
  if evidence_marker_present "$path" "$key"; then
    record_ok "$key marker confirms $purpose"
  else
    record_fail "$key=pass marker is required in restore drill evidence for $purpose"
  fi
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
    record_fail "$ENV_FILE must be readable by the backup preflight user"
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
  echo "== Backup toolchain =="
  local executor
  executor="$(backup_toolchain_executor)"
  case "$executor" in
    host)
      record_ok "SOURCELENS_BACKUP_TOOLCHAIN_EXECUTOR=host"
      check_host_mysql_toolchain
      ;;
    docker:*)
      record_ok "SOURCELENS_BACKUP_TOOLCHAIN_EXECUTOR=$executor"
      check_docker_mysql_toolchain "$executor"
      ;;
    *)
      record_fail "SOURCELENS_BACKUP_TOOLCHAIN_EXECUTOR must be host or docker:<container>, got $executor"
      ;;
  esac
  require_cmd tar "workspace and artifact backup"
  require_cmd gzip "compressed backup artifacts"
  require_any_cmd "backup checksum generation" sha256sum shasum
}

check_database_config() {
  echo
  echo "== Database backup inputs =="
  local db_url
  db_url="$(config_value DB_URL)"
  require_config DB_URL "database backup"
  require_config DB_USERNAME "database backup"
  require_config DB_PASSWORD "database backup"
  if [[ -n "$db_url" && "$db_url" != jdbc:mysql://* ]]; then
    record_fail "DB_URL must be a jdbc:mysql:// URL for SourceLens MySQL backup"
  elif [[ -n "$db_url" ]]; then
    record_ok "DB_URL uses MySQL JDBC format"
  fi
}

check_backup_policy() {
  echo
  echo "== Backup policy =="
  local encryption_required
  encryption_required="$(config_value SOURCELENS_BACKUP_ENCRYPTION_REQUIRED)"
  require_positive_integer_config SOURCELENS_BACKUP_RETENTION_DAYS 14 "backup retention"
  if is_true "${encryption_required:-}"; then
    record_ok "SOURCELENS_BACKUP_ENCRYPTION_REQUIRED=true"
    require_cmd gpg "encrypted backup artifacts"
  else
    record_fail "SOURCELENS_BACKUP_ENCRYPTION_REQUIRED must be true for production backups"
  fi
}

check_restore_drill_evidence() {
  echo
  echo "== Restore drill evidence =="
  local evidence_file
  local evidence_path
  local max_age_days
  local max_age_seconds
  local mtime
  local now
  local age_seconds
  local mode
  local numeric_mode
  local backup_id
  local backup_dir
  local backup_path
  local completed_at
  local completed_epoch

  evidence_file="$(config_value SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE)"
  if [[ -z "$evidence_file" ]]; then
    record_fail "SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE is required for restore drill evidence"
    return
  fi
  evidence_path="$(resolve_path "$evidence_file")"

  if [[ -L "$evidence_path" ]]; then
    record_fail "SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE must not be a symlink"
    return
  fi
  if [[ ! -f "$evidence_path" ]]; then
    record_fail "SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE must point to a regular file: $evidence_path"
    return
  fi
  if [[ -s "$evidence_path" ]]; then
    record_ok "restore drill evidence file is non-empty"
  else
    record_fail "restore drill evidence file must be non-empty"
  fi
  if [[ -r "$evidence_path" ]]; then
    record_ok "restore drill evidence file is readable"
  else
    record_fail "restore drill evidence file must be readable by the release user"
  fi
  if ! mode="$(file_mode "$evidence_path")"; then
    record_fail "restore drill evidence file permissions could not be inspected with stat"
  elif [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    record_fail "restore drill evidence file permissions could not be parsed: $mode"
  else
    numeric_mode=$((8#$mode))
    if (( (numeric_mode & 8#022) == 0 )); then
      record_ok "restore drill evidence file is not group/world writable ($mode)"
    else
      record_fail "restore drill evidence file must not be group/world writable; run chmod go-w $evidence_path (current mode $mode)"
    fi
  fi

  backup_id="$(evidence_value "$evidence_path" "backup_id")"
  backup_dir="$(config_value SOURCELENS_BACKUP_DIR)"
  if [[ -z "$backup_id" ]]; then
    record_fail "backup_id marker is required in restore drill evidence"
  elif is_safe_backup_id "$backup_id"; then
    record_ok "backup_id marker uses a safe artifact id format"
    if [[ -n "$backup_dir" ]]; then
      backup_path="$(resolve_path "$backup_dir")"
      if [[ -d "$backup_path" ]] \
          && backup_artifact_any_found "$backup_path" "$backup_id"; then
        record_ok "restore drill evidence backup_id matches backup artifacts"
        require_backup_artifact_set "$backup_path" "$backup_id" "restore drill evidence"
      elif [[ -d "$backup_path" ]]; then
        record_fail "SOURCELENS_BACKUP_DIR does not contain artifacts matching restore drill backup_id=$backup_id"
      fi
    fi
  else
    record_fail "backup_id marker must be 3-128 characters of letters, digits, dot, underscore or dash, and must not contain slashes, whitespace or glob characters"
  fi

  max_age_days="$(config_value SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS)"
  max_age_days="${max_age_days:-7}"
  if [[ "$max_age_days" =~ ^[1-9][0-9]*$ ]]; then
    record_ok "SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS=$max_age_days"
    completed_at="$(evidence_value "$evidence_path" "restore_drill_completed_at")"
    if [[ -z "$completed_at" ]]; then
      record_fail "restore_drill_completed_at marker is required in restore drill evidence"
    elif [[ ! "$completed_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
      record_fail "restore_drill_completed_at must use UTC ISO-8601 format like 2026-06-25T12:34:56Z"
    elif completed_epoch="$(iso8601_utc_to_epoch "$completed_at")"; then
      now="$(date +%s)"
      max_age_seconds=$((max_age_days * 86400))
      age_seconds=$((now - completed_epoch))
      if (( age_seconds < 0 )); then
        record_fail "restore_drill_completed_at must not be in the future"
      elif (( age_seconds <= max_age_seconds )); then
        record_ok "restore_drill_completed_at is within the allowed age window"
      else
        record_fail "restore_drill_completed_at is older than SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS=$max_age_days"
      fi
    else
      record_fail "restore_drill_completed_at could not be parsed as UTC time"
    fi
    if mtime="$(file_mtime_epoch "$evidence_path")"; then
      now="$(date +%s)"
      max_age_seconds=$((max_age_days * 86400))
      age_seconds=$((now - mtime))
      if (( age_seconds < 0 )); then
        record_fail "restore drill evidence file modification time must not be in the future"
      elif (( age_seconds <= max_age_seconds )); then
        record_ok "restore drill evidence file is within the allowed age window"
      else
        record_fail "restore drill evidence file is older than SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS=$max_age_days"
      fi
    else
      record_fail "restore drill evidence file modification time could not be inspected with stat"
    fi
  else
    record_fail "SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS must be a positive integer, got $max_age_days"
  fi

  require_evidence_marker "$evidence_path" "restore_drill_status" "overall restore drill success"
  require_evidence_marker "$evidence_path" "database_restore" "database restore coverage"
  require_evidence_marker "$evidence_path" "workspace_restore" "workspace archive restore coverage"
  require_evidence_marker "$evidence_path" "artifact_restore" "artifact archive restore coverage"
  require_evidence_marker "$evidence_path" "checksum_verification" "backup checksum verification"
}

check_backup_directory() {
  echo
  echo "== Backup directory =="
  local backup_dir
  local backup_path
  local workspace
  local mode
  local numeric_mode

  backup_dir="$(config_value SOURCELENS_BACKUP_DIR)"
  workspace="$(config_value SOURCELENS_WORKSPACE)"
  workspace="${workspace:-/var/lib/sourcelens/repos}"

  if [[ -z "$backup_dir" ]]; then
    record_fail "SOURCELENS_BACKUP_DIR is required for database/workspace/artifact backups"
    return
  fi
  backup_path="$(resolve_path "$backup_dir")"

  if is_path_inside "$backup_path" "$ROOT_DIR"; then
    record_fail "SOURCELENS_BACKUP_DIR must not be inside the git worktree"
  else
    record_ok "SOURCELENS_BACKUP_DIR is outside the git worktree"
  fi

  if is_path_inside "$backup_path" "$workspace"; then
    record_fail "SOURCELENS_BACKUP_DIR must not be inside SOURCELENS_WORKSPACE"
  else
    record_ok "SOURCELENS_BACKUP_DIR is outside SOURCELENS_WORKSPACE"
  fi

  if [[ ! -d "$backup_path" ]]; then
    record_fail "SOURCELENS_BACKUP_DIR must exist before backup/restore drills: $backup_path"
    return
  fi
  if [[ -L "$backup_path" ]]; then
    record_fail "SOURCELENS_BACKUP_DIR must not be a symlink"
  fi
  if [[ -w "$backup_path" && -x "$backup_path" ]]; then
    record_ok "SOURCELENS_BACKUP_DIR is writable and searchable"
  else
    record_fail "SOURCELENS_BACKUP_DIR must be writable and searchable by the release user"
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
      record_fail "SOURCELENS_BACKUP_DIR permissions must not grant group/world access; run chmod 700 $backup_path (current mode $mode)"
    fi
  fi
}

check_workspace_artifacts() {
  echo
  echo "== Workspace and artifacts =="
  local workspace
  local workspace_path
  local artifact_path
  workspace="$(config_value SOURCELENS_WORKSPACE)"
  workspace="${workspace:-/var/lib/sourcelens/repos}"
  workspace_path="$(resolve_path "$workspace")"
  artifact_path="$workspace_path/artifacts"

  if [[ -d "$workspace_path" ]]; then
    record_ok "SOURCELENS_WORKSPACE exists: $workspace_path"
    if [[ -r "$workspace_path" && -x "$workspace_path" ]]; then
      record_ok "SOURCELENS_WORKSPACE is readable for workspace backup"
    else
      record_fail "SOURCELENS_WORKSPACE must be readable/searchable for workspace backup"
    fi
  else
    record_warn "SOURCELENS_WORKSPACE does not exist on this host yet: $workspace_path"
  fi

  if [[ -d "$artifact_path" ]]; then
    record_ok "artifact root exists: $artifact_path"
    if [[ -r "$artifact_path" && -x "$artifact_path" ]]; then
      record_ok "artifact root is readable for artifact backup"
    else
      record_fail "artifact root must be readable/searchable for artifact backup"
    fi
  else
    record_warn "artifact root does not exist yet; first artifact backup may be empty: $artifact_path"
  fi
}

validate_bool_mode SOURCELENS_BACKUP_PREFLIGHT_WARN_ONLY "$WARN_ONLY"

echo "SourceLens backup/restore preflight"
echo "===================================="
echo "Mode: $(is_true "$WARN_ONLY" && echo warn-only || echo strict)"

check_env_file
check_toolchain
check_database_config
check_backup_policy
check_backup_directory
check_workspace_artifacts
check_restore_drill_evidence

echo
echo "Summary: ${failures} failure(s), ${warnings} warning(s)"

if (( failures > 0 )); then
  exit 1
fi
