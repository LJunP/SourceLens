#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_GITHUB_WEBHOOK_DRILL_ENV_FILE:-${SOURCELENS_PREFLIGHT_ENV_FILE:-deploy/.env}}"
WARN_ONLY="${SOURCELENS_GITHUB_WEBHOOK_DRILL_WARN_ONLY:-false}"

DEFAULT_EVENT="ping"
DEFAULT_EVENT_MAX_CHARS="64"
DEFAULT_DELIVERY_ID_MAX_CHARS="128"
DEFAULT_CONNECT_TIMEOUT="5"
DEFAULT_MAX_TIME="15"
DEFAULT_PAYLOAD_MAX_BYTES="65536"

failures=0
warnings=0
tmp_dir=""

fail() {
  echo "GITHUB WEBHOOK DRILL FAIL: $*" >&2
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

file_size_bytes() {
  local path="$1"
  if stat -f '%z' "$path" >/dev/null 2>&1; then
    stat -f '%z' "$path"
    return
  fi
  if stat -c '%s' "$path" >/dev/null 2>&1; then
    stat -c '%s' "$path"
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

check_env_file_boundary() {
  local selected_path
  local template_path
  local mode
  local numeric_mode

  echo
  echo "== Deployment env file =="

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
    record_fail "$ENV_FILE must be readable by the GitHub webhook drill user"
    return
  fi
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

finish() {
  echo
  echo "Summary: ${failures} failure(s), ${warnings} warning(s)"
  if (( failures > 0 )); then
    exit 1
  fi
}

cleanup() {
  if [[ -n "$tmp_dir" ]]; then
    rm -rf "$tmp_dir"
  fi
}
trap cleanup EXIT

require_cmd() {
  local command="$1"
  local purpose="$2"
  if command -v "$command" >/dev/null 2>&1; then
    record_ok "$command is available for $purpose"
  else
    record_fail "$command is required for $purpose"
  fi
}

require_config_value() {
  local result_var="$1"
  local key="$2"
  local purpose="$3"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    record_fail "$key is required for $purpose"
    printf -v "$result_var" '%s' ""
    return 1
  fi
  case "$value" in
    change-this*|your_*|your-*|changeme|CHANGE_ME)
      record_fail "$key still uses placeholder value"
      printf -v "$result_var" '%s' ""
      return 1
      ;;
  esac
  record_ok "$key is configured for $purpose"
  printf -v "$result_var" '%s' "$value"
}

require_min_length_config() {
  local key="$1"
  local value="$2"
  local min_length="$3"
  local purpose="$4"
  if (( ${#value} >= min_length )); then
    record_ok "$key length is sufficient for $purpose"
    return 0
  fi
  record_fail "$key must be at least ${min_length} characters for $purpose"
  return 1
}

require_positive_integer_config() {
  local result_var="$1"
  local key="$2"
  local default_value="$3"
  local purpose="$4"
  local value
  value="$(config_value_or_default "$key" "$default_value")"
  if [[ "$value" =~ ^[1-9][0-9]*$ ]]; then
    record_ok "$key=$value for $purpose"
    printf -v "$result_var" '%s' "$value"
    return 0
  fi
  record_fail "$key must be a positive integer for $purpose, got $value"
  printf -v "$result_var" '%s' "$default_value"
  return 1
}

validate_base_url() {
  local value="$1"
  local normalized
  local authority
  if [[ "$value" =~ [[:space:]] ]]; then
    record_fail "SOURCELENS_BASE_URL must not contain whitespace"
    return 1
  fi
  normalized="$(to_lower "$value")"
  if [[ "$normalized" != http://* && "$normalized" != https://* ]]; then
    record_fail "SOURCELENS_BASE_URL must use http or https"
    return 1
  fi
  if [[ "$value" == *"?"* || "$value" == *"#"* ]]; then
    record_fail "SOURCELENS_BASE_URL must not contain user-info, query or fragment"
    return 1
  fi
  authority="${value#*://}"
  authority="${authority%%/*}"
  if [[ -z "$authority" ]]; then
    record_fail "SOURCELENS_BASE_URL must include a host"
    return 1
  fi
  if [[ "$authority" == *"@"* ]]; then
    record_fail "SOURCELENS_BASE_URL must not contain user-info, query or fragment"
    return 1
  fi
  record_ok "SOURCELENS_BASE_URL is valid for webhook drill"
}

validate_event_name() {
  local value="$1"
  if (( ${#value} <= DEFAULT_EVENT_MAX_CHARS )) && [[ "$value" =~ ^[A-Za-z0-9_.-]+$ ]]; then
    record_ok "GitHub webhook event '$value' is valid for drill"
    return 0
  fi
  record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_EVENT must be a safe GitHub event name up to ${DEFAULT_EVENT_MAX_CHARS} characters"
  return 1
}

validate_delivery_id() {
  local value="$1"
  if (( ${#value} <= DEFAULT_DELIVERY_ID_MAX_CHARS )) && [[ "$value" =~ ^[A-Za-z0-9_.:-]+$ ]]; then
    record_ok "GitHub webhook drill delivery id is safe"
    return 0
  fi
  record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_DELIVERY_ID may only contain letters, numbers, dot, underscore, colon and dash, up to ${DEFAULT_DELIVERY_ID_MAX_CHARS} characters"
  return 1
}

generate_delivery_id() {
  printf 'sourcelens-webhook-drill-%s-%s\n' "$(date +%Y%m%d%H%M%S)" "$RANDOM"
}

sign_payload_file() {
  local secret="$1"
  local payload_file="$2"
  local digest
  digest="$(openssl dgst -sha256 -hmac "$secret" -hex < "$payload_file" | awk '{print $NF}')"
  printf 'sha256=%s\n' "$digest"
}

curl_webhook() {
  local event="$1"
  local delivery_id="$2"
  local signature="$3"
  local payload_file="$4"
  local output_file="$5"
  local http_code
  local -a args
  args=(--connect-timeout "$connect_timeout" --max-time "$max_time" -sS -o "$output_file" -w "%{http_code}")
  args+=(-X POST -H "Content-Type: application/json" -H "X-GitHub-Event: $event" -H "X-Hub-Signature-256: $signature")
  if [[ "$delivery_id" != "__OMIT_DELIVERY_HEADER__" ]]; then
    args+=(-H "X-GitHub-Delivery: $delivery_id")
  fi
  args+=(--data-binary "@${payload_file}")
  http_code="$(curl "${args[@]}" "$webhook_url" || true)"
  printf '%s' "$http_code"
}

require_http_success() {
  local title="$1"
  local status="$2"
  case "$status" in
    200|201|202|204)
      record_ok "$title returned HTTP $status"
      return 0
      ;;
    *)
      record_fail "$title must return HTTP 2xx, got $status"
      return 1
      ;;
  esac
}

require_http_status() {
  local title="$1"
  local status="$2"
  local expected="$3"
  if [[ "$status" == "$expected" ]]; then
    record_ok "$title returned expected HTTP $status"
    return 0
  fi
  record_fail "$title must return HTTP $expected, got $status"
  return 1
}

json_bool_field() {
  local file="$1"
  local field="$2"
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const field = process.argv[2];
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const value = field.split(".").reduce((acc, part) => acc && acc[part], parsed);
    if (typeof value === "boolean") {
      process.stdout.write(String(value));
    }
  ' "$file" "$field"
}

require_json_bool() {
  local title="$1"
  local file="$2"
  local field="$3"
  local expected="$4"
  local actual
  actual="$(json_bool_field "$file" "$field" || true)"
  if [[ "$actual" == "$expected" ]]; then
    record_ok "$title returned ${field}=${expected}"
    return 0
  fi
  record_fail "$title must return ${field}=${expected}"
  return 1
}

validate_payload_json() {
  local payload_value="$1"
  if ! command -v node >/dev/null 2>&1; then
    return 0
  fi
  if printf '%s' "$payload_value" | node -e '
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => raw += chunk);
    process.stdin.on("end", () => {
      try {
        JSON.parse(raw);
      } catch {
        process.exit(1);
      }
    });
  '; then
    record_ok "GitHub webhook drill payload is valid JSON"
  else
    record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE must contain valid JSON"
  fi
}

validate_bool_mode SOURCELENS_GITHUB_WEBHOOK_DRILL_WARN_ONLY "$WARN_ONLY"

echo "SourceLens GitHub webhook drill"
echo "==============================="
echo "Mode: $(is_true "$WARN_ONLY" && echo warn-only || echo strict)"

check_env_file_boundary

echo "== Configuration =="
base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
if [[ -z "$base_url" ]]; then
  record_fail "SOURCELENS_BASE_URL is required for GitHub webhook endpoint drill"
else
  validate_base_url "$base_url" || true
fi
require_config_value webhook_secret GITHUB_APP_WEBHOOK_SECRET "GitHub webhook signature drill" || true
if [[ -n "${webhook_secret:-}" ]]; then
  require_min_length_config GITHUB_APP_WEBHOOK_SECRET "$webhook_secret" 16 "GitHub webhook signature drill" || true
fi
event="$(config_value_or_default SOURCELENS_GITHUB_WEBHOOK_DRILL_EVENT "$DEFAULT_EVENT")"
validate_event_name "$event" || true
require_positive_integer_config payload_max_bytes SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_MAX_BYTES "$DEFAULT_PAYLOAD_MAX_BYTES" "GitHub webhook drill payload max bytes" || true
payload='{"zen":"SourceLens GitHub webhook drill","hook_id":1}'
payload_file="$(config_value SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE)"
if [[ -n "$payload_file" ]]; then
  payload_size=""
  resolved_payload_file="$(resolve_path "$payload_file")"
  if [[ -L "$resolved_payload_file" ]]; then
    record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE must not be a symlink"
  elif [[ ! -f "$resolved_payload_file" ]]; then
    record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE does not exist: $payload_file"
  elif [[ ! -s "$resolved_payload_file" ]]; then
    record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE must be non-empty"
  elif [[ ! -r "$resolved_payload_file" ]]; then
    record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE must be readable"
  else
    if ! payload_size="$(file_size_bytes "$resolved_payload_file")"; then
      record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE size could not be inspected with stat"
    elif [[ ! "$payload_size" =~ ^[0-9]+$ ]]; then
      record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE size could not be parsed: $payload_size"
    else
      if (( payload_size <= payload_max_bytes )); then
        record_ok "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE size is within limit"
      else
        record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE must be at most ${payload_max_bytes} bytes, got ${payload_size}"
      fi
    fi
    if ! mode="$(file_mode "$resolved_payload_file")"; then
      record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE permissions could not be inspected with stat"
    elif [[ ! "$mode" =~ ^[0-7]+$ ]]; then
      record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE permissions could not be parsed: $mode"
    else
      numeric_mode=$((8#$mode))
      if (( (numeric_mode & 8#022) == 0 )); then
        record_ok "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE is not group/world writable ($mode)"
      else
        record_fail "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE must not be group/world writable (current mode $mode)"
      fi
    fi
    payload="$(cat "$resolved_payload_file")"
    record_ok "SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE is readable"
    validate_payload_json "$payload"
  fi
else
  record_ok "GitHub webhook drill uses built-in ping payload"
  validate_payload_json "$payload"
fi
delivery_id="$(config_value SOURCELENS_GITHUB_WEBHOOK_DRILL_DELIVERY_ID)"
if [[ -z "$delivery_id" ]]; then
  delivery_id="$(generate_delivery_id)"
fi
validate_delivery_id "$delivery_id" || true
require_positive_integer_config connect_timeout SOURCELENS_GITHUB_WEBHOOK_DRILL_CONNECT_TIMEOUT "$DEFAULT_CONNECT_TIMEOUT" "GitHub webhook drill connect timeout" || true
require_positive_integer_config max_time SOURCELENS_GITHUB_WEBHOOK_DRILL_MAX_TIME "$DEFAULT_MAX_TIME" "GitHub webhook drill max time" || true

echo
echo "== Local toolchain =="
require_cmd curl "GitHub webhook endpoint drill"
require_cmd openssl "GitHub webhook HMAC signing"
require_cmd node "GitHub webhook response validation"

if (( failures > 0 )) || { is_true "$WARN_ONLY" && (( warnings > 0 )); }; then
  finish
  exit 0
fi

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/sourcelens-github-webhook-drill.XXXXXX")"
chmod 700 "$tmp_dir"
payload_request_file="${tmp_dir}/payload.json"
printf '%s' "$payload" > "$payload_request_file"
chmod 600 "$payload_request_file"
webhook_url="${base_url}/api/webhooks/github/app"
signature="$(sign_payload_file "$webhook_secret" "$payload_request_file")"
bad_signature="sha256=0000000000000000000000000000000000000000000000000000000000000000"

echo
echo "== Webhook endpoint drill =="
echo "Endpoint: ${webhook_url}"
echo "Event: ${event}"
echo "Delivery: ${delivery_id}"

first_response="${tmp_dir}/first.json"
status="$(curl_webhook "$event" "$delivery_id" "$signature" "$payload_request_file" "$first_response")"
require_http_success "signed webhook delivery" "$status"
if [[ "$status" =~ ^2 ]]; then
  require_json_bool "signed webhook delivery" "$first_response" "data.duplicate" "false"
fi

duplicate_response="${tmp_dir}/duplicate.json"
status="$(curl_webhook "$event" "$delivery_id" "$signature" "$payload_request_file" "$duplicate_response")"
require_http_success "duplicate webhook delivery" "$status"
if [[ "$status" =~ ^2 ]]; then
  require_json_bool "duplicate webhook delivery" "$duplicate_response" "data.duplicate" "true"
fi

missing_delivery_response="${tmp_dir}/missing-delivery.json"
status="$(curl_webhook "$event" "__OMIT_DELIVERY_HEADER__" "$signature" "$payload_request_file" "$missing_delivery_response")"
require_http_status "missing delivery id webhook rejection" "$status" "400"

invalid_signature_response="${tmp_dir}/invalid-signature.json"
status="$(curl_webhook "$event" "${delivery_id}-bad-signature" "$bad_signature" "$payload_request_file" "$invalid_signature_response")"
require_http_status "invalid signature webhook rejection" "$status" "401"

finish
