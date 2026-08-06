#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_BACKUP_DRILL_ENV_FILE:-${SOURCELENS_PREFLIGHT_ENV_FILE:-deploy/.env}}"
MYSQL_CONTAINER="${SOURCELENS_BACKUP_DRILL_MYSQL_CONTAINER:-sourcelens-mysql}"
KEEP_WORK_DIR="${SOURCELENS_BACKUP_DRILL_KEEP_WORK_DIR:-false}"

WORK_DIR=""
SCRATCH_DB=""
SCRATCH_DB_CREATED=false
DATABASE_TABLES=""

fail() {
  echo "BACKUP RESTORE DRILL FAIL: $*" >&2
  exit 1
}

log_check() {
  local level="$1"
  local message="$2"
  printf '[%s] %s\n' "$level" "$message"
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

require_cmd() {
  local command="$1"
  local purpose="$2"
  command -v "$command" >/dev/null 2>&1 || fail "$command is required for $purpose"
  log_check "OK" "$command is available for $purpose"
}

is_safe_backup_id() {
  local value="$1"
  [[ "$value" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{2,127}$ ]]
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
  if command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 "$path" | awk '{print tolower($2)}'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    LC_ALL=C LANG=C shasum -a 256 "$path" | awk '{print tolower($1)}'
    return
  fi
  return 1
}

sha256_text() {
  local value="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$value" | sha256sum | awk '{print tolower($1)}'
    return
  fi
  if command -v openssl >/dev/null 2>&1; then
    printf '%s' "$value" | openssl dgst -sha256 | awk '{print tolower($2)}'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    printf '%s' "$value" | LC_ALL=C LANG=C shasum -a 256 | awk '{print tolower($1)}'
    return
  fi
  return 1
}

scratch_database_name_for_backup_id() {
  local backup_id="$1"
  local random_suffix="$2"
  local backup_hash
  backup_hash="$(sha256_text "$backup_id" | cut -c1-16)" \
    || fail "a SHA-256 command is required to derive a bounded scratch database name"
  [[ "$backup_hash" =~ ^[a-f0-9]{16}$ ]] || fail "backup id hash could not be derived for scratch database name"
  printf 'sourcelens_drill_%s_%s\n' "$backup_hash" "$random_suffix"
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

validate_artifact_file() {
  local artifact_path="$1"
  local kind="$2"
  local mode
  local numeric_mode
  [[ -L "$artifact_path" ]] && fail "backup $kind artifact must not be a symlink: $artifact_path"
  [[ -f "$artifact_path" ]] || fail "backup $kind artifact must be a regular file: $artifact_path"
  [[ -s "$artifact_path" ]] || fail "backup $kind artifact must be non-empty: $artifact_path"
  [[ -r "$artifact_path" ]] || fail "backup $kind artifact must be readable: $artifact_path"
  mode="$(file_mode "$artifact_path")" || fail "backup $kind artifact permissions could not be inspected: $artifact_path"
  [[ "$mode" =~ ^[0-7]+$ ]] || fail "backup $kind artifact permissions could not be parsed: $artifact_path (mode $mode)"
  numeric_mode=$((8#$mode))
  (( (numeric_mode & 8#022) == 0 )) || fail "backup $kind artifact must not be group/world writable: $artifact_path (current mode $mode)"
}

validate_backup_dir() {
  local backup_path="$1"
  local workspace
  local mode
  local numeric_mode
  workspace="$(config_value SOURCELENS_WORKSPACE)"
  workspace="${workspace:-/var/lib/sourcelens/repos}"
  [[ -n "$backup_path" ]] || fail "SOURCELENS_BACKUP_DIR is required"
  [[ -L "$backup_path" ]] && fail "SOURCELENS_BACKUP_DIR must not be a symlink"
  [[ -d "$backup_path" ]] || fail "SOURCELENS_BACKUP_DIR must exist: $backup_path"
  is_path_inside "$backup_path" "$ROOT_DIR" && fail "SOURCELENS_BACKUP_DIR must not be inside the git worktree"
  is_path_inside "$backup_path" "$workspace" && fail "SOURCELENS_BACKUP_DIR must not be inside SOURCELENS_WORKSPACE"
  [[ -r "$backup_path" && -x "$backup_path" ]] || fail "SOURCELENS_BACKUP_DIR must be readable and searchable"
  mode="$(file_mode "$backup_path")" || fail "SOURCELENS_BACKUP_DIR permissions could not be inspected"
  [[ "$mode" =~ ^[0-7]+$ ]] || fail "SOURCELENS_BACKUP_DIR permissions could not be parsed: $mode"
  numeric_mode=$((8#$mode))
  (( (numeric_mode & 8#077) == 0 )) || fail "SOURCELENS_BACKUP_DIR permissions must not grant group/world access; run chmod 700 $backup_path (current mode $mode)"
}

ensure_tar_archive_safe() {
  local archive_path="$1"
  local listing_path="$2"
  tar -tzf "$archive_path" > "$listing_path" || fail "tar archive cannot be listed safely: $archive_path"
  [[ -s "$listing_path" ]] || fail "tar archive is empty: $archive_path"
  awk '
    /^\/|(^|\/)\.\.(\/|$)|\\/ {
      print "unsafe tar path: " $0 > "/dev/stderr"
      bad = 1
    }
    /[[:cntrl:]]/ {
      print "unsafe tar control character path" > "/dev/stderr"
      bad = 1
    }
    END {
      exit(bad ? 1 : 0)
    }
  ' "$listing_path" || fail "tar archive contains unsafe paths: $archive_path"
}

extract_tar_archive() {
  local archive_path="$1"
  local target_dir="$2"
  local listing_path="$3"
  local label="$4"
  ensure_tar_archive_safe "$archive_path" "$listing_path"
  mkdir -p "$target_dir"
  chmod 700 "$target_dir"
  tar -xzf "$archive_path" -C "$target_dir" || fail "$label archive extraction failed"
  local count
  count="$(find "$target_dir" -mindepth 1 -print | wc -l | tr -d '[:space:]')"
  [[ "$count" =~ ^[1-9][0-9]*$ ]] || fail "$label archive extracted no entries"
  printf '%s\n' "$count"
}

prepare_database_sql() {
  local database_artifact="$1"
  local sql_path="$2"
  case "$database_artifact" in
    *.gz)
      gzip -t "$database_artifact" || fail "database dump gzip integrity check failed"
      gzip -dc "$database_artifact" > "$sql_path" || fail "database dump decompression failed"
      ;;
    *)
      cp "$database_artifact" "$sql_path"
      ;;
  esac
  [[ -s "$sql_path" ]] || fail "database SQL dump is empty after restore preparation"
  if LC_ALL=C grep -Eiq '^[[:space:]]*((CREATE|DROP)[[:space:]]+(DATABASE|SCHEMA)|USE[[:space:]]+)' "$sql_path"; then
    fail "database SQL dump contains database-level statements; create a single-database dump without CREATE DATABASE, DROP DATABASE or USE before scratch restore"
  fi
  if LC_ALL=C grep -Eiq '^[[:space:]]*(source|system|connect|tee|notee)[[:space:]]+' "$sql_path" \
      || LC_ALL=C grep -Eq '^[[:space:]]*\\[!.]' "$sql_path"; then
    fail "database SQL dump contains mysql client escape commands that are unsafe for automated scratch restore"
  fi
}

docker_mysql_query() {
  local sql="$1"
  docker exec -i "$MYSQL_CONTAINER" sh -lc 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -N -B -e "$1"' sh "$sql"
}

restore_database_into_scratch() {
  local sql_path="$1"
  local backup_id="$2"
  local random_suffix
  local table_count
  require_cmd docker "scratch database restore"
  docker inspect "$MYSQL_CONTAINER" >/dev/null 2>&1 || fail "MySQL container is not available: $MYSQL_CONTAINER"
  docker exec "$MYSQL_CONTAINER" sh -lc 'test -n "$MYSQL_ROOT_PASSWORD"' >/dev/null 2>&1 \
    || fail "MySQL container must expose MYSQL_ROOT_PASSWORD for scratch restore"
  random_suffix="$(date +%s)_$RANDOM"
  SCRATCH_DB="$(scratch_database_name_for_backup_id "$backup_id" "$random_suffix")"
  [[ "$SCRATCH_DB" =~ ^[A-Za-z0-9_]+$ ]] || fail "generated scratch database name is unsafe"
  (( ${#SCRATCH_DB} <= 64 )) || fail "generated scratch database name exceeds MySQL 64 character identifier limit"
  docker_mysql_query "DROP DATABASE IF EXISTS \`$SCRATCH_DB\`; CREATE DATABASE \`$SCRATCH_DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  SCRATCH_DB_CREATED=true
  docker exec -i "$MYSQL_CONTAINER" sh -lc 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot "$1"' sh "$SCRATCH_DB" < "$sql_path" \
    || fail "database dump restore into scratch database failed"
  local table_count
  table_count="$(docker_mysql_query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$SCRATCH_DB';" | tr -d '[:space:]')"
  [[ "$table_count" =~ ^[0-9]+$ ]] || fail "scratch database table count could not be inspected"
  DATABASE_TABLES="$table_count"
}

cleanup() {
  drop_scratch_database >/dev/null 2>&1 || true
  if [[ -n "$WORK_DIR" && -d "$WORK_DIR" ]] && ! is_true "$KEEP_WORK_DIR"; then
    rm -rf "$WORK_DIR"
  elif [[ -n "$WORK_DIR" && -d "$WORK_DIR" ]]; then
    log_check "WARN" "kept drill work directory: $WORK_DIR"
  fi
}

drop_scratch_database() {
  if [[ "$SCRATCH_DB_CREATED" == "true" && -n "$SCRATCH_DB" ]]; then
    docker_mysql_query "DROP DATABASE IF EXISTS \`$SCRATCH_DB\`;"
    SCRATCH_DB_CREATED=false
  fi
}

write_evidence_file() {
  local output_path="$1"
  local backup_id="$2"
  local completed_at="$3"
  local database_artifact="$4"
  local workspace_artifact="$5"
  local artifacts_artifact="$6"
  local checksums_artifact="$7"
  local table_count="$8"
  local workspace_entries="$9"
  local artifact_entries="${10}"
  local parent
  local tmp_file
  parent="$(dirname "$output_path")"
  [[ -L "$output_path" ]] && fail "restore drill evidence output must not be a symlink: $output_path"
  mkdir -p "$parent"
  [[ -d "$parent" ]] || fail "restore drill evidence parent directory does not exist: $parent"
  tmp_file="$(mktemp "${parent}/.sourcelens-restore-evidence.XXXXXX")" || fail "could not create temporary evidence file"
  chmod 600 "$tmp_file"
  {
    printf 'backup_id=%s\n' "$backup_id"
    printf 'restore_drill_completed_at=%s\n' "$completed_at"
    printf 'restore_drill_status=pass\n'
    printf 'database_restore=pass\n'
    printf 'workspace_restore=pass\n'
    printf 'artifact_restore=pass\n'
    printf 'checksum_verification=pass\n'
    printf 'database_tables=%s\n' "$table_count"
    printf 'workspace_entries=%s\n' "$workspace_entries"
    printf 'artifact_entries=%s\n' "$artifact_entries"
    printf 'database_artifact=%s\n' "$(basename "$database_artifact")"
    printf 'workspace_artifact=%s\n' "$(basename "$workspace_artifact")"
    printf 'artifacts_artifact=%s\n' "$(basename "$artifacts_artifact")"
    printf 'checksums_artifact=%s\n' "$(basename "$checksums_artifact")"
    printf 'mysql_executor=docker:%s\n' "$MYSQL_CONTAINER"
  } > "$tmp_file"
  mv "$tmp_file" "$output_path"
  chmod 600 "$output_path"
}

main() {
  require_cmd find "backup artifact discovery"
  require_cmd tar "workspace and artifact archive restore"
  require_cmd gzip "compressed backup restore"
  require_cmd awk "evidence parsing"
  require_cmd grep "safety checks"
  require_cmd mktemp "private drill workspace"

  local backup_id
  local backup_dir
  local backup_path
  local evidence_file
  local evidence_path
  local database_artifact
  local workspace_artifact
  local artifacts_artifact
  local checksums_artifact
  local kind
  local artifact_path
  local database_sql
  local database_tables
  local workspace_entries
  local artifact_entries
  local completed_at

  backup_id="$(config_value SOURCELENS_BACKUP_DRILL_BACKUP_ID)"
  [[ -n "$backup_id" ]] || fail "SOURCELENS_BACKUP_DRILL_BACKUP_ID is required"
  is_safe_backup_id "$backup_id" || fail "SOURCELENS_BACKUP_DRILL_BACKUP_ID must be 3-128 safe characters"
  backup_dir="$(config_value SOURCELENS_BACKUP_DIR)"
  [[ -n "$backup_dir" ]] || fail "SOURCELENS_BACKUP_DIR is required"
  backup_path="$(resolve_path "$backup_dir")"
  validate_backup_dir "$backup_path"

  evidence_file="$(config_value SOURCELENS_BACKUP_DRILL_EVIDENCE_FILE)"
  if [[ -z "$evidence_file" ]]; then
    evidence_file="$(config_value SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE)"
  fi
  [[ -n "$evidence_file" ]] || fail "SOURCELENS_BACKUP_DRILL_EVIDENCE_FILE or SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE is required"
  evidence_path="$(resolve_path "$evidence_file")"

  database_artifact="$(backup_artifact_path_for_kind "$backup_path" "$backup_id" "database" || true)"
  workspace_artifact="$(backup_artifact_path_for_kind "$backup_path" "$backup_id" "workspace" || true)"
  artifacts_artifact="$(backup_artifact_path_for_kind "$backup_path" "$backup_id" "artifacts" || true)"
  checksums_artifact="$(backup_artifact_path_for_kind "$backup_path" "$backup_id" "checksums" || true)"
  [[ -n "$database_artifact" ]] || fail "database artifact was not found for backup_id=$backup_id"
  [[ -n "$workspace_artifact" ]] || fail "workspace artifact was not found for backup_id=$backup_id"
  [[ -n "$artifacts_artifact" ]] || fail "artifacts artifact was not found for backup_id=$backup_id"
  [[ -n "$checksums_artifact" ]] || fail "checksums artifact was not found for backup_id=$backup_id"

  for kind in database workspace artifacts checksums; do
    artifact_path="$(backup_artifact_path_for_kind "$backup_path" "$backup_id" "$kind")"
    validate_artifact_file "$artifact_path" "$kind"
    log_check "OK" "validated $kind artifact $(basename "$artifact_path")"
  done
  for artifact_path in "$database_artifact" "$workspace_artifact" "$artifacts_artifact"; do
    checksum_manifest_covers_artifact "$checksums_artifact" "$artifact_path" \
      || fail "checksum manifest does not verify $(basename "$artifact_path")"
  done
  log_check "OK" "checksum manifest verifies database, workspace and artifacts backups"

  WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/sourcelens-backup-drill.XXXXXX")"
  chmod 700 "$WORK_DIR"
  log_check "OK" "created private drill workspace"

  database_sql="${WORK_DIR}/database.sql"
  prepare_database_sql "$database_artifact" "$database_sql"
  restore_database_into_scratch "$database_sql" "$backup_id"
  database_tables="$DATABASE_TABLES"
  log_check "OK" "database dump restored into scratch database with $database_tables table(s)"

  workspace_entries="$(extract_tar_archive "$workspace_artifact" "${WORK_DIR}/workspace" "${WORK_DIR}/workspace.list" "workspace")"
  artifact_entries="$(extract_tar_archive "$artifacts_artifact" "${WORK_DIR}/artifacts" "${WORK_DIR}/artifacts.list" "artifacts")"
  log_check "OK" "workspace archive restored with $workspace_entries extracted path(s)"
  log_check "OK" "artifact archive restored with $artifact_entries extracted path(s)"

  completed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  write_evidence_file "$evidence_path" "$backup_id" "$completed_at" \
    "$database_artifact" "$workspace_artifact" "$artifacts_artifact" "$checksums_artifact" \
    "$database_tables" "$workspace_entries" "$artifact_entries"
  log_check "OK" "restore drill evidence written to $evidence_path"
  drop_scratch_database || fail "scratch database cleanup failed"
  log_check "OK" "scratch database dropped"
}

trap cleanup EXIT

echo "SourceLens backup/restore drill"
echo "================================"
main
