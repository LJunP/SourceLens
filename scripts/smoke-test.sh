#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_SMOKE_ENV_FILE:-${SOURCELENS_PREFLIGHT_ENV_FILE:-deploy/.env}}"

fail() {
  echo "SMOKE FAIL: $*" >&2
  exit 1
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

normalize_base_url() {
  local value
  value="$(normalize_config_value "$1")"
  while [[ "$value" == */ && "$value" != "http://" && "$value" != "https://" ]]; do
    value="${value%/}"
  done
  printf '%s\n' "$value"
}

to_lower() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

require_base_url_shape() {
  local key="$1"
  local value="$2"
  local lower
  local authority
  if [[ "$value" =~ [[:space:]] ]]; then
    fail "$key must not contain whitespace"
  fi
  lower="$(to_lower "$value")"
  if [[ "$lower" != http://* && "$lower" != https://* ]]; then
    fail "$key must use http or https"
  fi
  if [[ "$value" == *"?"* || "$value" == *"#"* ]]; then
    fail "$key must not contain user-info, query or fragment"
  fi
  authority="${value#*://}"
  authority="${authority%%/*}"
  if [[ -z "$authority" ]]; then
    fail "$key must include a host"
  fi
  if [[ "$authority" == *"@"* ]]; then
    fail "$key must not contain user-info, query or fragment"
  fi
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
    echo "SMOKE WARN: $ENV_FILE not found; checking process environment only" >&2
    return
  fi
  if [[ ! -f "$selected_path" ]]; then
    fail "$ENV_FILE must be a regular deployment env file"
  fi
  if [[ ! -s "$selected_path" ]]; then
    fail "$ENV_FILE must be non-empty"
  fi
  if [[ ! -r "$selected_path" ]]; then
    fail "$ENV_FILE must be readable by the smoke test user"
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

check_env_file_boundary

BASE_URL="$(normalize_base_url "$(config_value_or_default SOURCELENS_BASE_URL "http://localhost:8080")")"
TOKEN="$(config_value SOURCELENS_SMOKE_TOKEN)"
CONNECT_TIMEOUT="$(config_value_or_default SOURCELENS_SMOKE_CONNECT_TIMEOUT "5")"
MAX_TIME="$(config_value_or_default SOURCELENS_SMOKE_MAX_TIME "15")"

require_base_url_shape SOURCELENS_BASE_URL "$BASE_URL"
require_positive_integer "SOURCELENS_SMOKE_CONNECT_TIMEOUT" "$CONNECT_TIMEOUT"
require_positive_integer "SOURCELENS_SMOKE_MAX_TIME" "$MAX_TIME"

CURL_TIMEOUT_ARGS=(--connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME")

request() {
  local path="$1"
  if [ -n "$TOKEN" ]; then
    curl "${CURL_TIMEOUT_ARGS[@]}" -fsS -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}${path}"
  else
    curl "${CURL_TIMEOUT_ARGS[@]}" -fsS "${BASE_URL}${path}"
  fi
}

http_status() {
  local path="$1"
  curl "${CURL_TIMEOUT_ARGS[@]}" -sS -o /dev/null -w "%{http_code}" "${BASE_URL}${path}"
}

echo "Smoke testing SourceLens at ${BASE_URL} (connect-timeout=${CONNECT_TIMEOUT}s, max-time=${MAX_TIME}s)"

api_health="$(curl "${CURL_TIMEOUT_ARGS[@]}" -fsS "${BASE_URL}/api/health")" || fail "/api/health is not reachable"
echo "$api_health" | grep -q '"status":"UP"' || fail "/api/health did not report UP"

actuator_health="$(curl "${CURL_TIMEOUT_ARGS[@]}" -fsS "${BASE_URL}/actuator/health")" || fail "/actuator/health is not reachable"
echo "$actuator_health" | grep -q '"status":"UP"' || fail "/actuator/health did not report UP"

curl "${CURL_TIMEOUT_ARGS[@]}" -fsS "${BASE_URL}/actuator/info" >/dev/null || fail "/actuator/info is not reachable"

metrics_public_status="$(http_status "/actuator/metrics")" || fail "/actuator/metrics public exposure check failed"
case "$metrics_public_status" in
  401|403) ;;
  *) fail "/actuator/metrics must require authentication, got HTTP ${metrics_public_status}" ;;
esac

if [ -z "$TOKEN" ]; then
  echo "SOURCELENS_SMOKE_TOKEN is not set; verified unauthenticated /actuator/metrics is protected and skipping authenticated metrics checks."
  echo "Smoke OK"
  exit 0
fi

metrics="$(request "/actuator/metrics")" || fail "/actuator/metrics is not reachable with the provided token"
echo "$metrics" | grep -q '"names"' || fail "/actuator/metrics did not return a meter list"

for meter in \
  sourcelens.execution.tasks \
  sourcelens.execution.steps \
  sourcelens.agent.tool.calls \
  sourcelens.agent.tool.duration \
  sourcelens.sandbox.commands \
  sourcelens.sandbox.command.duration
do
  request "/actuator/metrics/${meter}" >/dev/null || fail "metric is not reachable: ${meter}"
done

echo "Smoke OK"
