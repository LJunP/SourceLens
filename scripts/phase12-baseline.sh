#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_PHASE12_BASELINE_ENV_FILE:-${SOURCELENS_PREFLIGHT_ENV_FILE:-deploy/.env}}"

DEFAULT_SYMBOL_RELATION_THRESHOLD="500000"
DEFAULT_CALL_CHAIN_MS_THRESHOLD="2000"
DEFAULT_TASK_COMPENSATION_ATTEMPT_THRESHOLD="3"
DEFAULT_CALL_CHAIN_DEPTH="8"
DEFAULT_MYSQL_CONNECT_TIMEOUT="5"
DEFAULT_MYSQL_EXECUTOR="auto"
DEFAULT_MYSQL_DOCKER_CONTAINER="sourcelens-mysql"
DEFAULT_MYSQL_DOCKER_HOST="localhost"
DEFAULT_MYSQL_DOCKER_PORT="3306"

fail() {
  echo "ERROR: $*" >&2
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

resolve_path() {
  local path="$1"
  case "$path" in
    /*) printf '%s\n' "$path" ;;
    *) printf '%s/%s\n' "$ROOT_DIR" "$path" ;;
  esac
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

config_value_or_default() {
  local key="$1"
  local default_value="$2"
  local value
  value="$(config_value "$key")"
  if [[ -n "$value" ]]; then
    printf '%s\n' "$value"
  else
    printf '%s\n' "$default_value"
  fi
}

check_env_file_boundary() {
  local selected_path
  local template_path
  local mode
  local numeric_mode

  selected_path="$(resolve_path "$ENV_FILE")"
  template_path="$(resolve_path "deploy/.env.example")"

  if [[ "$selected_path" == "$template_path" ]]; then
    return
  fi
  if [[ -L "$selected_path" ]]; then
    fail "$ENV_FILE must not be a symlink"
  fi
  if [[ ! -e "$selected_path" ]]; then
    echo "WARN: $ENV_FILE not found; checking process environment only" >&2
    return
  fi
  if [[ ! -f "$selected_path" ]]; then
    fail "$ENV_FILE must be a regular deployment env file"
  fi
  if [[ ! -s "$selected_path" ]]; then
    fail "$ENV_FILE must be non-empty"
  fi
  if [[ ! -r "$selected_path" ]]; then
    fail "$ENV_FILE must be readable by the phase 12 baseline user"
  fi
  if ! mode="$(file_mode "$selected_path")"; then
    fail "$ENV_FILE permissions could not be inspected with stat"
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    fail "$ENV_FILE permissions could not be parsed: $mode"
  fi

  numeric_mode=$((8#$mode))
  if (( (numeric_mode & 8#077) != 0 )); then
    fail "$ENV_FILE permissions must not grant group/world access; run chmod 600 $ENV_FILE (current mode $mode)"
  fi
}

require_positive_integer() {
  local name="$1"
  local value="$2"
  [[ "$value" =~ ^[1-9][0-9]*$ ]] || fail "$name must be a positive integer"
}

require_safe_container_name() {
  local value="$1"
  [[ "$value" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$ ]] || fail "SOURCELENS_PHASE12_MYSQL_DOCKER_CONTAINER must be a safe Docker container name"
}

now_ms() {
  if command -v node >/dev/null 2>&1; then
    node -e 'process.stdout.write(String(Date.now()))'
  elif command -v perl >/dev/null 2>&1; then
    perl -MTime::HiRes=time -e 'printf "%.0f", time() * 1000'
  else
    echo $(( $(date +%s) * 1000 ))
  fi
}

parse_jdbc_url() {
  local url
  local host_port
  local database_path
  url="$(normalize_config_value "${DB_URL:-}")"
  if [[ -z "${url}" ]]; then
    return
  fi
  [[ "$url" == jdbc:mysql://* ]] || fail "DB_URL must be a jdbc:mysql:// URL"
  url="${url#jdbc:mysql://}"
  url="${url%%\?*}"
  [[ "$url" == */* ]] || fail "DB_URL must include a database name"
  host_port="${url%%/*}"
  database_path="${url#*/}"
  [[ -n "$host_port" ]] || fail "DB_URL must include a database host"
  [[ -n "$database_path" ]] || fail "DB_URL must include a database name"
  DB_NAME="${DB_NAME:-$database_path}"
  if [[ "${host_port}" == *:* ]]; then
    DB_HOST="${DB_HOST:-${host_port%%:*}}"
    DB_PORT="${DB_PORT:-${host_port##*:}}"
  else
    DB_HOST="${DB_HOST:-${host_port}}"
  fi
}

mysql_query() {
  case "${MYSQL_EXECUTOR_RESOLVED}" in
    host)
      MYSQL_PWD="${DB_PASSWORD}" mysql \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --user="${DB_USERNAME}" \
        --database="${DB_NAME}" \
        --connect-timeout="${MYSQL_CONNECT_TIMEOUT}" \
        --batch \
        --raw \
        --skip-column-names \
        --execute "$1"
      ;;
    docker)
      docker exec -i \
        -e SOURCELENS_PHASE12_DB_HOST="${MYSQL_DOCKER_HOST}" \
        -e SOURCELENS_PHASE12_DB_PORT="${MYSQL_DOCKER_PORT}" \
        -e SOURCELENS_PHASE12_DB_NAME="${DB_NAME}" \
        -e SOURCELENS_PHASE12_DB_USERNAME="${DB_USERNAME}" \
        -e SOURCELENS_PHASE12_MYSQL_CONNECT_TIMEOUT="${MYSQL_CONNECT_TIMEOUT}" \
        "${MYSQL_DOCKER_CONTAINER}" sh -lc '
          set -eu
          sql="$(cat)"
          db_host="${SOURCELENS_PHASE12_DB_HOST:-localhost}"
          db_port="${SOURCELENS_PHASE12_DB_PORT:-3306}"
          db_name="${SOURCELENS_PHASE12_DB_NAME:-${MYSQL_DATABASE:-${DB_NAME:-sourcelens}}}"
          db_username="${SOURCELENS_PHASE12_DB_USERNAME:-${MYSQL_USER:-${DB_USERNAME:-}}}"
          db_password="${MYSQL_PWD:-${MYSQL_PASSWORD:-${DB_PASSWORD:-}}}"
          if [ -z "$db_username" ]; then
            echo "ERROR: DB_USERNAME, MYSQL_USER, or container DB_USERNAME is required" >&2
            exit 1
          fi
          if [ -z "$db_password" ]; then
            echo "ERROR: MYSQL_PASSWORD, MYSQL_PWD, or container DB_PASSWORD is required" >&2
            exit 1
          fi
          MYSQL_PWD="$db_password" mysql \
            --host="$db_host" \
            --port="$db_port" \
            --user="$db_username" \
            --database="$db_name" \
            --connect-timeout="${SOURCELENS_PHASE12_MYSQL_CONNECT_TIMEOUT}" \
            --batch \
            --raw \
            --skip-column-names \
            --execute "$sql"
        ' <<< "$1"
      ;;
    *)
      fail "Unsupported resolved MySQL executor: ${MYSQL_EXECUTOR_RESOLVED}"
      ;;
  esac
}

docker_mysql_available() {
  command -v docker >/dev/null 2>&1 || return 1
  require_safe_container_name "${MYSQL_DOCKER_CONTAINER}"
  [[ "$(docker container inspect -f '{{.State.Running}}' "${MYSQL_DOCKER_CONTAINER}" 2>/dev/null || true)" == "true" ]] || return 1
  docker exec "${MYSQL_DOCKER_CONTAINER}" sh -lc 'command -v mysql >/dev/null 2>&1' >/dev/null 2>&1
}

resolve_mysql_executor() {
  local requested="$1"
  local host_available="false"
  local docker_available="false"

  requested="$(printf '%s' "$requested" | tr '[:upper:]' '[:lower:]')"
  case "$requested" in
    auto|host|docker) ;;
    *) fail "SOURCELENS_PHASE12_MYSQL_EXECUTOR must be auto, host, or docker" ;;
  esac

  if command -v mysql >/dev/null 2>&1; then
    host_available="true"
  fi
  if docker_mysql_available; then
    docker_available="true"
  fi

  case "$requested" in
    host)
      [[ "$host_available" == "true" ]] || fail "mysql is required for SOURCELENS_PHASE12_MYSQL_EXECUTOR=host"
      MYSQL_EXECUTOR_RESOLVED="host"
      ;;
    docker)
      [[ "$docker_available" == "true" ]] || fail "Docker MySQL container '${MYSQL_DOCKER_CONTAINER}' is not running or does not provide mysql"
      MYSQL_EXECUTOR_RESOLVED="docker"
      ;;
    auto)
      if [[ "$host_available" == "true" && -n "${DB_USERNAME}" && -n "${DB_PASSWORD}" ]]; then
        MYSQL_EXECUTOR_RESOLVED="host"
      elif [[ "$docker_available" == "true" ]]; then
        MYSQL_EXECUTOR_RESOLVED="docker"
      elif [[ "$host_available" == "true" ]]; then
        MYSQL_EXECUTOR_RESOLVED="host"
      else
        fail "mysql CLI is required; install mysql or run Docker MySQL container '${MYSQL_DOCKER_CONTAINER}'"
      fi
      ;;
  esac
}

print_metric() {
  printf "%-34s %s\n" "$1:" "$2"
}

check_env_file_boundary

SYMBOL_RELATION_THRESHOLD="$(config_value_or_default SOURCELENS_PHASE12_SYMBOL_RELATION_THRESHOLD "$DEFAULT_SYMBOL_RELATION_THRESHOLD")"
CALL_CHAIN_MS_THRESHOLD="$(config_value_or_default SOURCELENS_PHASE12_CALL_CHAIN_MS_THRESHOLD "$DEFAULT_CALL_CHAIN_MS_THRESHOLD")"
TASK_COMPENSATION_ATTEMPT_THRESHOLD="$(config_value_or_default SOURCELENS_PHASE12_MAX_ATTEMPTS_THRESHOLD "$DEFAULT_TASK_COMPENSATION_ATTEMPT_THRESHOLD")"
CALL_CHAIN_DEPTH="$(config_value_or_default SOURCELENS_PHASE12_CALL_CHAIN_DEPTH "$DEFAULT_CALL_CHAIN_DEPTH")"
SCAN_TASK_ID="$(config_value_or_default SOURCELENS_PHASE12_SCAN_TASK_ID "")"
MYSQL_CONNECT_TIMEOUT="$(config_value_or_default SOURCELENS_PHASE12_MYSQL_CONNECT_TIMEOUT "$DEFAULT_MYSQL_CONNECT_TIMEOUT")"
MYSQL_EXECUTOR="$(config_value_or_default SOURCELENS_PHASE12_MYSQL_EXECUTOR "$DEFAULT_MYSQL_EXECUTOR")"
MYSQL_DOCKER_CONTAINER="$(config_value_or_default SOURCELENS_PHASE12_MYSQL_DOCKER_CONTAINER "$DEFAULT_MYSQL_DOCKER_CONTAINER")"
MYSQL_DOCKER_HOST="$(config_value_or_default SOURCELENS_PHASE12_MYSQL_DOCKER_HOST "$DEFAULT_MYSQL_DOCKER_HOST")"
MYSQL_DOCKER_PORT="$(config_value_or_default SOURCELENS_PHASE12_MYSQL_DOCKER_PORT "$DEFAULT_MYSQL_DOCKER_PORT")"
DB_URL="$(config_value DB_URL)"
DB_HOST="$(config_value DB_HOST)"
DB_PORT="$(config_value DB_PORT)"
DB_NAME="$(config_value DB_NAME)"

parse_jdbc_url

require_positive_integer "SOURCELENS_PHASE12_SYMBOL_RELATION_THRESHOLD" "${SYMBOL_RELATION_THRESHOLD}"
require_positive_integer "SOURCELENS_PHASE12_CALL_CHAIN_MS_THRESHOLD" "${CALL_CHAIN_MS_THRESHOLD}"
require_positive_integer "SOURCELENS_PHASE12_MAX_ATTEMPTS_THRESHOLD" "${TASK_COMPENSATION_ATTEMPT_THRESHOLD}"
require_positive_integer "SOURCELENS_PHASE12_CALL_CHAIN_DEPTH" "${CALL_CHAIN_DEPTH}"
require_positive_integer "SOURCELENS_PHASE12_MYSQL_CONNECT_TIMEOUT" "${MYSQL_CONNECT_TIMEOUT}"
require_safe_container_name "${MYSQL_DOCKER_CONTAINER}"
require_positive_integer "SOURCELENS_PHASE12_MYSQL_DOCKER_PORT" "${MYSQL_DOCKER_PORT}"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-sourcelens}"
DB_HOST="$(normalize_config_value "$DB_HOST")"
DB_PORT="$(normalize_config_value "$DB_PORT")"
DB_NAME="$(normalize_config_value "$DB_NAME")"
DB_USERNAME="$(config_value DB_USERNAME)"
if [[ -z "$DB_USERNAME" ]]; then
  DB_USERNAME="$(config_value MYSQL_USER)"
fi
DB_PASSWORD="$(config_value DB_PASSWORD)"
if [[ -z "$DB_PASSWORD" ]]; then
  DB_PASSWORD="$(config_value MYSQL_PWD)"
fi

[[ -n "${DB_HOST}" ]] || fail "DB_HOST is required"
[[ -n "${DB_NAME}" ]] || fail "DB_NAME is required"
require_positive_integer "DB_PORT" "${DB_PORT}"

MYSQL_EXECUTOR_RESOLVED=""
resolve_mysql_executor "${MYSQL_EXECUTOR}"

if [[ "${MYSQL_EXECUTOR_RESOLVED}" == "host" ]]; then
  [[ -n "${DB_USERNAME}" ]] || fail "DB_USERNAME or MYSQL_USER is required"
  [[ -n "${DB_PASSWORD}" ]] || fail "DB_PASSWORD or MYSQL_PWD is required"
fi

if [[ -z "${SCAN_TASK_ID}" ]]; then
  SCAN_TASK_ID="$(mysql_query "
    SELECT cs.scan_task_id
    FROM code_symbols cs
    LEFT JOIN scan_tasks st ON st.id = cs.scan_task_id
    GROUP BY cs.scan_task_id
    ORDER BY MAX(st.finished_at) DESC, cs.scan_task_id DESC
    LIMIT 1;
  " | head -n 1)"
fi

[[ -n "${SCAN_TASK_ID}" ]] || fail "No scan task with code_symbols was found; run a scan first or set SOURCELENS_PHASE12_SCAN_TASK_ID"
require_positive_integer "SOURCELENS_PHASE12_SCAN_TASK_ID" "${SCAN_TASK_ID}"

symbol_count="$(mysql_query "SELECT COUNT(*) FROM code_symbols WHERE scan_task_id = ${SCAN_TASK_ID};")"
relation_count="$(mysql_query "SELECT COUNT(*) FROM code_relations WHERE scan_task_id = ${SCAN_TASK_ID};")"
total_graph_records=$((symbol_count + relation_count))

kind_counts="$(mysql_query "
  SELECT kind, COUNT(*)
  FROM code_symbols
  WHERE scan_task_id = ${SCAN_TASK_ID}
  GROUP BY kind
  ORDER BY COUNT(*) DESC;
")"

relation_counts="$(mysql_query "
  SELECT relation_type, COUNT(*)
  FROM code_relations
  WHERE scan_task_id = ${SCAN_TASK_ID}
  GROUP BY relation_type
  ORDER BY COUNT(*) DESC;
")"

query_start="$(now_ms)"
call_chain_result="$(mysql_query "
  WITH RECURSIVE call_walk(source_id, target_id, depth, path) AS (
    SELECT source_id, target_id, 1, CONCAT('>', source_id, '>', target_id, '>')
    FROM code_relations
    WHERE scan_task_id = ${SCAN_TASK_ID}
      AND relation_type = 'CALLS'
    UNION ALL
    SELECT call_walk.source_id, code_relations.target_id, call_walk.depth + 1,
           CONCAT(call_walk.path, code_relations.target_id, '>')
    FROM call_walk
    JOIN code_relations
      ON code_relations.scan_task_id = ${SCAN_TASK_ID}
     AND code_relations.relation_type = 'CALLS'
     AND code_relations.source_id = call_walk.target_id
    WHERE call_walk.depth < ${CALL_CHAIN_DEPTH}
      AND INSTR(call_walk.path, CONCAT('>', code_relations.target_id, '>')) = 0
  )
  SELECT COALESCE(MAX(depth), 0), COUNT(*)
  FROM call_walk;
")"
query_end="$(now_ms)"
call_chain_ms=$((query_end - query_start))
max_call_depth="$(echo "${call_chain_result}" | awk '{print $1}')"
walked_call_paths="$(echo "${call_chain_result}" | awk '{print $2}')"

task_compensation="$(mysql_query "
  SELECT
    COALESCE(MAX(attempt_count), 0),
    COALESCE(SUM(CASE WHEN attempt_count > 1 THEN 1 ELSE 0 END), 0)
  FROM (
    SELECT task_id, COUNT(*) AS attempt_count
    FROM execution_attempts
    GROUP BY task_id
  ) attempts_by_task;
")"
max_attempts="$(echo "${task_compensation}" | awk '{print $1}')"
retried_tasks="$(echo "${task_compensation}" | awk '{print $2}')"

terminal_status_counts="$(mysql_query "
  SELECT status, COUNT(*)
  FROM execution_tasks
  WHERE status IN ('SUCCESS', 'FAILED', 'CANCELLED')
  GROUP BY status
  ORDER BY status;
")"

needs_graph_store="no"
needs_orchestrator="no"

if (( total_graph_records > SYMBOL_RELATION_THRESHOLD )); then
  needs_graph_store="yes"
fi
if (( call_chain_ms > CALL_CHAIN_MS_THRESHOLD )); then
  needs_graph_store="yes"
fi
if (( max_attempts > TASK_COMPENSATION_ATTEMPT_THRESHOLD )); then
  needs_orchestrator="yes"
fi

echo "SourceLens phase 12 baseline"
echo "============================"
print_metric "mysql_executor" "${MYSQL_EXECUTOR_RESOLVED}"
if [[ "${MYSQL_EXECUTOR_RESOLVED}" == "docker" ]]; then
  print_metric "database" "${MYSQL_DOCKER_HOST}:${MYSQL_DOCKER_PORT}/${DB_NAME}"
  print_metric "mysql_docker_container" "${MYSQL_DOCKER_CONTAINER}"
else
  print_metric "database" "${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi
print_metric "scan_task_id" "${SCAN_TASK_ID}"
print_metric "symbol_count" "${symbol_count}"
print_metric "relation_count" "${relation_count}"
print_metric "symbol_relation_total" "${total_graph_records} / threshold ${SYMBOL_RELATION_THRESHOLD}"
print_metric "call_chain_max_depth" "${max_call_depth} / sampled depth ${CALL_CHAIN_DEPTH}"
print_metric "call_chain_paths_walked" "${walked_call_paths}"
print_metric "call_chain_query_ms" "${call_chain_ms} / threshold ${CALL_CHAIN_MS_THRESHOLD}"
print_metric "max_execution_attempts" "${max_attempts} / threshold ${TASK_COMPENSATION_ATTEMPT_THRESHOLD}"
print_metric "retried_execution_tasks" "${retried_tasks}"
print_metric "needs_graph_or_vector_store" "${needs_graph_store}"
print_metric "needs_workflow_orchestrator" "${needs_orchestrator}"

echo
echo "Symbol counts by kind"
echo "${kind_counts:-none}"

echo
echo "Relation counts by type"
echo "${relation_counts:-none}"

echo
echo "Terminal execution task counts"
echo "${terminal_status_counts:-none}"

echo
if [[ "${needs_graph_store}" == "yes" || "${needs_orchestrator}" == "yes" ]]; then
  echo "Verdict: phase 12 trigger is present. Capture this output before introducing Neo4j, pgvector, Temporal, or analyzer daemon."
else
  echo "Verdict: phase 12 trigger is not proven. Keep the current MySQL/artifact/simple-queue architecture and continue production hardening."
fi
