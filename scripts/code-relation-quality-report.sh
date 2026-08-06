#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "CODE_RELATION_QUALITY_FAIL: $*" >&2
  exit 1
}

config_value() {
  local key="$1"
  local value="${!key:-}"
  if [[ -n "$value" ]]; then
    printf '%s' "$value"
    return
  fi
  if [[ -f "${ROOT_DIR}/deploy/.env" ]]; then
    local line
    line="$(grep -E "^${key}=" "${ROOT_DIR}/deploy/.env" | tail -n 1 || true)"
    if [[ -n "$line" ]]; then
      printf '%s' "${line#*=}"
    fi
  fi
}

normalize_config_value() {
  local value="$1"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value"
}

require_positive_integer() {
  local name="$1"
  local value="$2"
  [[ "$value" =~ ^[0-9]+$ ]] || fail "${name} must be a positive integer"
  (( value > 0 )) || fail "${name} must be a positive integer"
}

parse_jdbc_url() {
  local url="$1"
  [[ "$url" == jdbc:mysql://* ]] || return 0
  url="${url#jdbc:mysql://}"
  local host_port="${url%%/*}"
  local database_path="${url#*/}"
  database_path="${database_path%%\?*}"
  if [[ "$host_port" == *:* ]]; then
    DB_HOST="${DB_HOST:-${host_port%%:*}}"
    DB_PORT="${DB_PORT:-${host_port##*:}}"
  else
    DB_HOST="${DB_HOST:-$host_port}"
  fi
  DB_NAME="${DB_NAME:-$database_path}"
}

docker_mysql_available() {
  [[ -n "$MYSQL_DOCKER_CONTAINER" ]] || return 1
  command -v docker >/dev/null 2>&1 || return 1
  docker inspect -f '{{.State.Running}}' "$MYSQL_DOCKER_CONTAINER" 2>/dev/null | grep -qx "true"
}

mysql_query_host() {
  MYSQL_PWD="$DB_PASSWORD" mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USERNAME" \
    --database="$DB_NAME" \
    --batch --raw --skip-column-names \
    --connect-timeout=10 \
    -e "$1"
}

mysql_query_docker() {
  docker exec \
    -e SOURCELENS_RELATION_QUALITY_DB_HOST="$MYSQL_DOCKER_HOST" \
    -e SOURCELENS_RELATION_QUALITY_DB_PORT="$MYSQL_DOCKER_PORT" \
    -e SOURCELENS_RELATION_QUALITY_DB_NAME="$DB_NAME" \
    -e SOURCELENS_RELATION_QUALITY_DB_USERNAME="$DB_USERNAME" \
    -e MYSQL_PWD="$DB_PASSWORD" \
    "$MYSQL_DOCKER_CONTAINER" sh -lc '
      mysql \
        --host="${SOURCELENS_RELATION_QUALITY_DB_HOST:-127.0.0.1}" \
        --port="${SOURCELENS_RELATION_QUALITY_DB_PORT:-3306}" \
        --user="${SOURCELENS_RELATION_QUALITY_DB_USERNAME}" \
        --database="${SOURCELENS_RELATION_QUALITY_DB_NAME}" \
        --batch --raw --skip-column-names \
        --connect-timeout=10 \
        -e "$1"
    ' sh "$1"
}

mysql_query() {
  if [[ "$MYSQL_EXECUTOR_RESOLVED" == "host" ]]; then
    mysql_query_host "$1"
  else
    mysql_query_docker "$1"
  fi
}

relation_count() {
  local relation_type="$1"
  mysql_query "
    SELECT COUNT(*)
    FROM code_relations
    WHERE scan_task_id = ${SCAN_TASK_ID}
      AND relation_type = '${relation_type}';
  "
}

DB_URL="$(normalize_config_value "$(config_value DB_URL)")"
DB_HOST="$(normalize_config_value "$(config_value DB_HOST)")"
DB_PORT="$(normalize_config_value "$(config_value DB_PORT)")"
DB_NAME="$(normalize_config_value "$(config_value DB_NAME)")"
DB_USERNAME="$(normalize_config_value "$(config_value DB_USERNAME)")"
DB_PASSWORD="$(normalize_config_value "$(config_value DB_PASSWORD)")"

if [[ -z "$DB_USERNAME" ]]; then
  DB_USERNAME="$(normalize_config_value "$(config_value MYSQL_USER)")"
fi
if [[ -z "$DB_PASSWORD" ]]; then
  DB_PASSWORD="$(normalize_config_value "$(config_value MYSQL_PWD)")"
fi
if [[ -z "$DB_PASSWORD" ]]; then
  DB_PASSWORD="$(normalize_config_value "$(config_value MYSQL_PASSWORD)")"
fi
parse_jdbc_url "$DB_URL"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3307}"
DB_NAME="${DB_NAME:-sourcelens}"
MYSQL_DOCKER_CONTAINER="${SOURCELENS_RELATION_QUALITY_MYSQL_CONTAINER:-${SOURCELENS_MYSQL_CONTAINER:-sourcelens-mysql}}"
MYSQL_DOCKER_HOST="${SOURCELENS_RELATION_QUALITY_DOCKER_DB_HOST:-127.0.0.1}"
MYSQL_DOCKER_PORT="${SOURCELENS_RELATION_QUALITY_DOCKER_DB_PORT:-3306}"
MYSQL_EXECUTOR="${SOURCELENS_RELATION_QUALITY_MYSQL_EXECUTOR:-auto}"
SCAN_TASK_ID="${SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID:-}"
MIN_CALLS="${SOURCELENS_RELATION_QUALITY_MIN_CALLS:-0}"
MIN_TARGET_METHOD_MATCH_PERCENT="${SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT:-0}"

require_positive_integer "DB_PORT" "$DB_PORT"
[[ -n "$DB_NAME" ]] || fail "DB_NAME is required"
[[ "$MIN_CALLS" =~ ^[0-9]+$ ]] || fail "SOURCELENS_RELATION_QUALITY_MIN_CALLS must be a non-negative integer"
[[ "$MIN_TARGET_METHOD_MATCH_PERCENT" =~ ^[0-9]+$ ]] || fail "SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT must be a non-negative integer"
(( MIN_TARGET_METHOD_MATCH_PERCENT <= 100 )) || fail "SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT must be <= 100"

MYSQL_EXECUTOR_RESOLVED=""
case "$MYSQL_EXECUTOR" in
  host)
    command -v mysql >/dev/null 2>&1 || fail "mysql client is required for host executor"
    [[ -n "$DB_USERNAME" ]] || fail "DB_USERNAME or MYSQL_USER is required"
    [[ -n "$DB_PASSWORD" ]] || fail "DB_PASSWORD or MYSQL_PWD is required"
    MYSQL_EXECUTOR_RESOLVED="host"
    ;;
  docker)
    docker_mysql_available || fail "Docker MySQL container '${MYSQL_DOCKER_CONTAINER}' is not running"
    [[ -n "$DB_USERNAME" ]] || fail "DB_USERNAME or MYSQL_USER is required"
    [[ -n "$DB_PASSWORD" ]] || fail "DB_PASSWORD or MYSQL_PWD is required"
    MYSQL_EXECUTOR_RESOLVED="docker"
    ;;
  auto)
    if command -v mysql >/dev/null 2>&1 && [[ -n "$DB_USERNAME" && -n "$DB_PASSWORD" ]]; then
      MYSQL_EXECUTOR_RESOLVED="host"
    elif docker_mysql_available && [[ -n "$DB_USERNAME" && -n "$DB_PASSWORD" ]]; then
      MYSQL_EXECUTOR_RESOLVED="docker"
    else
      fail "mysql client or running Docker MySQL container '${MYSQL_DOCKER_CONTAINER}' is required"
    fi
    ;;
  *)
    fail "SOURCELENS_RELATION_QUALITY_MYSQL_EXECUTOR must be auto, host, or docker"
    ;;
esac

if [[ -n "$SCAN_TASK_ID" ]]; then
  require_positive_integer "SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID" "$SCAN_TASK_ID"
else
  SCAN_TASK_ID="$(mysql_query "
    SELECT candidates.scan_task_id
    FROM (
      SELECT scan_task_id, MAX(id) AS marker_id FROM code_relations GROUP BY scan_task_id
      UNION ALL
      SELECT scan_task_id, MAX(id) AS marker_id FROM code_symbols GROUP BY scan_task_id
    ) candidates
    LEFT JOIN scan_tasks st ON st.id = candidates.scan_task_id
    GROUP BY candidates.scan_task_id
    ORDER BY MAX(st.finished_at) DESC, MAX(candidates.marker_id) DESC
    LIMIT 1;
  " | head -n 1)"
  [[ -n "$SCAN_TASK_ID" ]] || fail "No scan task with code graph data found; run a scan first or set SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID"
  require_positive_integer "resolved scan task id" "$SCAN_TASK_ID"
fi

symbol_count="$(mysql_query "SELECT COUNT(*) FROM code_symbols WHERE scan_task_id = ${SCAN_TASK_ID};")"
method_symbol_count="$(mysql_query "SELECT COUNT(*) FROM code_symbols WHERE scan_task_id = ${SCAN_TASK_ID} AND kind = 'METHOD';")"
relation_count_total="$(mysql_query "SELECT COUNT(*) FROM code_relations WHERE scan_task_id = ${SCAN_TASK_ID};")"
call_count="$(relation_count "CALLS")"
depends_on_count="$(relation_count "DEPENDS_ON")"
implements_count="$(relation_count "IMPLEMENTS")"
extends_count="$(relation_count "EXTENDS")"
distinct_calling_methods="$(mysql_query "
  SELECT COUNT(DISTINCT source_id)
  FROM code_relations
  WHERE scan_task_id = ${SCAN_TASK_ID}
    AND relation_type = 'CALLS';
")"
call_source_method_matches="$(mysql_query "
  SELECT COUNT(DISTINCT cr.id)
  FROM code_relations cr
  JOIN code_symbols cs
    ON cs.scan_task_id = cr.scan_task_id
   AND cs.symbol_id = cr.source_id
   AND cs.kind = 'METHOD'
  WHERE cr.scan_task_id = ${SCAN_TASK_ID}
    AND cr.relation_type = 'CALLS';
")"
call_target_method_matches="$(mysql_query "
  SELECT COUNT(DISTINCT cr.id)
  FROM code_relations cr
  JOIN code_symbols cs
    ON cs.scan_task_id = cr.scan_task_id
   AND cs.symbol_id = cr.target_id
   AND cs.kind = 'METHOD'
  WHERE cr.scan_task_id = ${SCAN_TASK_ID}
    AND cr.relation_type = 'CALLS';
")"
unresolved_call_targets="$(mysql_query "
  SELECT COUNT(*)
  FROM code_relations cr
  LEFT JOIN code_symbols cs
    ON cs.scan_task_id = cr.scan_task_id
   AND cs.symbol_id = cr.target_id
  WHERE cr.scan_task_id = ${SCAN_TASK_ID}
    AND cr.relation_type = 'CALLS'
    AND cs.id IS NULL;
")"
external_like_call_targets="$(mysql_query "
  SELECT COUNT(*)
  FROM code_relations
  WHERE scan_task_id = ${SCAN_TASK_ID}
    AND relation_type = 'CALLS'
    AND (
      target_id LIKE 'java.%'
      OR target_id LIKE 'javax.%'
      OR target_id LIKE 'jakarta.%'
      OR target_id LIKE 'org.springframework.%'
      OR target_id LIKE 'com.fasterxml.%'
    );
")"
method_symbol_duplicate_groups="$(mysql_query "
  SELECT COUNT(*)
  FROM (
    SELECT symbol_id
    FROM code_symbols
    WHERE scan_task_id = ${SCAN_TASK_ID}
      AND kind = 'METHOD'
    GROUP BY symbol_id
    HAVING COUNT(*) > 1
  ) duplicate_method_symbols;
")"
dominant_project_package_prefix="$(mysql_query "
  SELECT SUBSTRING_INDEX(symbol_id, '.', 2) AS package_prefix
  FROM code_symbols
  WHERE scan_task_id = ${SCAN_TASK_ID}
    AND kind IN ('CLASS', 'INTERFACE', 'METHOD')
    AND symbol_id LIKE '%.%.%#%'
  GROUP BY package_prefix
  ORDER BY COUNT(*) DESC, package_prefix
  LIMIT 1;
" | head -n 1)"
if [[ -z "$dominant_project_package_prefix" ]]; then
  dominant_project_package_prefix="unknown"
fi
if [[ "$dominant_project_package_prefix" == "unknown" ]]; then
  unresolved_project_like_call_targets=0
  unresolved_project_like_jdk_simple_type_call_targets=0
else
  unresolved_project_like_call_targets="$(mysql_query "
    SELECT COUNT(*)
    FROM code_relations cr
    LEFT JOIN code_symbols cs
      ON cs.scan_task_id = cr.scan_task_id
     AND cs.symbol_id = cr.target_id
    WHERE cr.scan_task_id = ${SCAN_TASK_ID}
      AND cr.relation_type = 'CALLS'
      AND cs.id IS NULL
      AND cr.target_id LIKE '${dominant_project_package_prefix}.%';
  ")"
  unresolved_project_like_jdk_simple_type_call_targets="$(mysql_query "
    SELECT COUNT(*)
    FROM code_relations cr
    LEFT JOIN code_symbols cs
      ON cs.scan_task_id = cr.scan_task_id
     AND cs.symbol_id = cr.target_id
    WHERE cr.scan_task_id = ${SCAN_TASK_ID}
      AND cr.relation_type = 'CALLS'
      AND cs.id IS NULL
      AND cr.target_id REGEXP '^${dominant_project_package_prefix}\\..*\\.(String|Object|Boolean|Integer|Long|Double|BigDecimal|BigInteger|Map|List|Set|Collection|Iterator|Entry|Optional|Date|UUID)#';
  ")"
fi
unresolved_known_external_call_targets="$(mysql_query "
  SELECT COUNT(*)
  FROM code_relations cr
  LEFT JOIN code_symbols cs
    ON cs.scan_task_id = cr.scan_task_id
   AND cs.symbol_id = cr.target_id
  WHERE cr.scan_task_id = ${SCAN_TASK_ID}
    AND cr.relation_type = 'CALLS'
    AND cs.id IS NULL
    AND (
      cr.target_id LIKE 'java.%'
      OR cr.target_id LIKE 'javax.%'
      OR cr.target_id LIKE 'jakarta.%'
      OR cr.target_id LIKE 'org.springframework.%'
      OR cr.target_id LIKE 'org.apache.%'
      OR cr.target_id LIKE 'org.slf4j.%'
      OR cr.target_id LIKE 'org.json.%'
      OR cr.target_id LIKE 'com.fasterxml.%'
      OR cr.target_id LIKE 'com.baomidou.%'
      OR cr.target_id LIKE 'com.baidu.%'
      OR cr.target_id LIKE 'cn.hutool.%'
      OR cr.target_id LIKE 'weka.%'
    );
")"
unresolved_other_call_targets=$(( unresolved_call_targets - unresolved_known_external_call_targets - unresolved_project_like_call_targets ))
if (( unresolved_other_call_targets < 0 )); then
  unresolved_other_call_targets=0
fi

if (( call_count > 0 )); then
  call_source_method_match_percent=$(( call_source_method_matches * 100 / call_count ))
  call_target_method_match_percent=$(( call_target_method_matches * 100 / call_count ))
else
  call_source_method_match_percent=0
  call_target_method_match_percent=0
fi

if (( call_count < MIN_CALLS )); then
  fail "CALLS count ${call_count} is below threshold ${MIN_CALLS} for scanTaskId=${SCAN_TASK_ID}"
fi
if (( call_target_method_match_percent < MIN_TARGET_METHOD_MATCH_PERCENT )); then
  fail "CALLS target method match percent ${call_target_method_match_percent} is below threshold ${MIN_TARGET_METHOD_MATCH_PERCENT} for scanTaskId=${SCAN_TASK_ID}"
fi

python3 - "$SCAN_TASK_ID" "$MYSQL_EXECUTOR_RESOLVED" "$DB_NAME" \
  "$symbol_count" "$method_symbol_count" "$relation_count_total" \
  "$call_count" "$depends_on_count" "$implements_count" "$extends_count" \
  "$distinct_calling_methods" "$call_source_method_matches" "$call_target_method_matches" \
  "$unresolved_call_targets" "$external_like_call_targets" "$method_symbol_duplicate_groups" \
  "$dominant_project_package_prefix" "$unresolved_known_external_call_targets" \
  "$unresolved_project_like_call_targets" "$unresolved_project_like_jdk_simple_type_call_targets" \
  "$unresolved_other_call_targets" \
  "$call_source_method_match_percent" "$call_target_method_match_percent" <<'PY'
import json
import sys

keys = [
    "scanTaskId",
    "mysqlExecutor",
    "database",
    "symbolCount",
    "methodSymbolCount",
    "relationCount",
    "callCount",
    "dependsOnCount",
    "implementsCount",
    "extendsCount",
    "distinctCallingMethods",
    "callSourceMethodMatches",
    "callTargetMethodMatches",
    "unresolvedCallTargets",
    "externalLikeCallTargets",
    "methodSymbolDuplicateGroups",
    "dominantProjectPackagePrefix",
    "unresolvedKnownExternalCallTargets",
    "unresolvedProjectLikeCallTargets",
    "unresolvedProjectLikeJdkSimpleTypeCallTargets",
    "unresolvedOtherCallTargets",
    "callSourceMethodMatchPercent",
    "callTargetMethodMatchPercent",
]
payload = dict(zip(keys, sys.argv[1:]))
int_fields = [key for key in payload if key not in {"mysqlExecutor", "database", "dominantProjectPackagePrefix"}]
for key in int_fields:
    payload[key] = int(payload[key])
payload["status"] = "OK"
payload["surface"] = "CODE_RELATION_QUALITY"
payload["providerQualityClaim"] = False
payload["llmFactClaim"] = False
print("CODE_RELATION_QUALITY_OK " + json.dumps(payload, ensure_ascii=False, sort_keys=True))
PY
