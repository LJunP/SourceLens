#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_GITHUB_APP_DRILL_ENV_FILE:-${SOURCELENS_PREFLIGHT_ENV_FILE:-deploy/.env}}"
WARN_ONLY="${SOURCELENS_GITHUB_APP_DRILL_WARN_ONLY:-false}"

DEFAULT_API_BASE_URL="https://api.github.com"
DEFAULT_ALLOWED_API_HOSTS="api.github.com"
DEFAULT_CONNECT_TIMEOUT="5"
DEFAULT_MAX_TIME="20"

failures=0
warnings=0
tmp_dir=""

fail() {
  echo "GITHUB APP DRILL FAIL: $*" >&2
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
    record_fail "$ENV_FILE must be readable by the GitHub App drill user"
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

require_min_length_value() {
  local key="$1"
  local value="$2"
  local min_length="$3"
  local purpose="$4"
  if (( ${#value} >= min_length )); then
    record_ok "$key meets minimum length for $purpose"
  else
    record_fail "$key must be at least ${min_length} characters for $purpose"
  fi
}

require_private_key_pem_value() {
  local key="$1"
  local value="$2"
  local purpose="$3"
  if [[ "$value" == *"BEGIN"* && "$value" == *"PRIVATE KEY"* ]]; then
    record_ok "$key looks like a private key PEM"
  else
    record_fail "$key must contain a PEM private key header for $purpose"
  fi
}

normalize_host() {
  local host
  host="$(to_lower "$(trim "$1")")"
  host="${host%.}"
  if [[ "$host" == \[*\] ]]; then
    host="${host:1:${#host}-2}"
  fi
  printf '%s' "$host"
}

github_api_host() {
  local url="$1"
  local rest host
  rest="${url#https://}"
  rest="${rest%%/*}"
  if [[ "$rest" == *"@"* ]]; then
    return 1
  fi
  if [[ "$rest" == \[*\]* ]]; then
    host="${rest%%]*}"
    host="${host#[}"
  else
    host="${rest%%:*}"
  fi
  normalize_host "$host"
}

host_in_allowed_hosts() {
  local host="$1"
  local allowed_hosts="$2"
  local allowed normalized
  IFS=',' read -ra allowed <<< "$allowed_hosts"
  for allowed in "${allowed[@]}"; do
    normalized="$(normalize_host "$allowed")"
    if [[ -n "$normalized" && "$host" == "$normalized" ]]; then
      return 0
    fi
  done
  return 1
}

is_blocked_github_api_host() {
  local host="$1"
  case "$host" in
    localhost|*.localhost|metadata.google.internal|0.*|10.*|127.*|169.254.*|192.168.*)
      return 0
      ;;
    ::1|0:0:0:0:0:0:0:1|fc*|fd*|fe8*|fe9*|fea*|feb*)
      return 0
      ;;
  esac
  if [[ "$host" =~ ^172\.([1][6-9]|2[0-9]|3[0-1])\. ]]; then
    return 0
  fi
  return 1
}

is_safe_github_owner_component() {
  local component="$1"
  [[ "$component" =~ ^[A-Za-z0-9][A-Za-z0-9-]{0,38}$ ]] || return 1
  [[ "$component" != *--* && "$component" != *- ]]
}

is_safe_github_repository_component() {
  local component="$1"
  local lower
  lower="$(to_lower "$component")"
  [[ "$component" =~ ^[A-Za-z0-9_.-]{1,100}$ ]] || return 1
  [[ "$component" != "." && "$component" != ".." ]] || return 1
  [[ "$component" != *..* ]] || return 1
  [[ "$lower" != *.git ]]
}

validate_repository_full_name() {
  local full_name="$1"
  local owner
  local name
  if [[ "$full_name" != */* || "$full_name" == */*/* ]]; then
    record_fail "SOURCELENS_GITHUB_APP_DRILL_REPOSITORY must be owner/repo with safe GitHub path components"
    return 1
  fi
  owner="${full_name%%/*}"
  name="${full_name#*/}"
  if ! is_safe_github_owner_component "$owner" || ! is_safe_github_repository_component "$name"; then
    record_fail "SOURCELENS_GITHUB_APP_DRILL_REPOSITORY must be owner/repo with safe GitHub path components"
    return 1
  fi
  repository_owner="$owner"
  repository_name="$name"
  record_ok "GitHub App drill repository is configured with safe path components"
}

validate_api_egress_policy() {
  local base_url="$1"
  local allowed_hosts="$2"
  local normalized_base host
  normalized_base="$(to_lower "$base_url")"
  if [[ "$normalized_base" != https://* ]]; then
    record_fail "GITHUB_API_BASE_URL must use https"
    return 1
  fi
  if [[ "$base_url" == *"@"* || "$base_url" == *"?"* || "$base_url" == *"#"* ]]; then
    record_fail "GITHUB_API_BASE_URL must not contain user-info, query or fragment"
    return 1
  fi
  if ! host="$(github_api_host "$base_url")" || [[ -z "$host" ]]; then
    record_fail "GITHUB_API_BASE_URL must include a host"
    return 1
  fi
  if ! host_in_allowed_hosts "$host" "$allowed_hosts"; then
    record_fail "GITHUB_API_BASE_URL host must be listed in GITHUB_ALLOWED_API_HOSTS, got $host"
    return 1
  fi
  if is_blocked_github_api_host "$host"; then
    record_fail "GITHUB_API_BASE_URL host must not point to localhost, private networks, link-local or metadata services"
    return 1
  fi
  record_ok "GITHUB_API_BASE_URL egress policy is safe"
}

base64url_file() {
  openssl base64 -A -in "$1" | tr '+/' '-_' | tr -d '='
}

base64url_text() {
  printf '%s' "$1" | openssl base64 -A | tr '+/' '-_' | tr -d '='
}

write_private_key_file() {
  local pem="$1"
  local target="$2"
  pem="${pem//\\n/$'\n'}"
  printf '%s\n' "$pem" > "$target"
  chmod 600 "$target"
}

create_app_jwt() {
  local app_id="$1"
  local key_file="$2"
  local header payload signing_input signature_file
  local iat exp
  header='{"alg":"RS256","typ":"JWT"}'
  iat="$(( $(date +%s) - 60 ))"
  exp="$(( $(date +%s) + 540 ))"
  payload="{\"iat\":${iat},\"exp\":${exp},\"iss\":\"${app_id}\"}"
  signing_input="$(base64url_text "$header").$(base64url_text "$payload")"
  signature_file="${tmp_dir}/github-app-jwt.sig"
  printf '%s' "$signing_input" | openssl dgst -sha256 -sign "$key_file" -binary > "$signature_file"
  printf '%s.%s\n' "$signing_input" "$(base64url_file "$signature_file")"
}

curl_json() {
  local method="$1"
  local url="$2"
  local token="$3"
  local output_file="$4"
  shift 4
  local http_code
  local -a args
  args=(--connect-timeout "$connect_timeout" --max-time "$max_time" -sS -o "$output_file" -w "%{http_code}")
  args+=(-H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28")
  if [[ -n "$token" ]]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  case "$method" in
    GET) ;;
    POST) args+=(-X POST) ;;
    *) record_fail "unsupported HTTP method for GitHub drill: $method"; return 1 ;;
  esac
  http_code="$(curl "${args[@]}" "$@" "$url" || true)"
  printf '%s' "$http_code"
}

require_http_success() {
  local title="$1"
  local status="$2"
  case "$status" in
    200|201|204)
      record_ok "$title returned HTTP $status"
      return 0
      ;;
    *)
      record_fail "$title must return HTTP 2xx, got $status"
      return 1
      ;;
  esac
}

json_string_field() {
  local file="$1"
  local field="$2"
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const field = process.argv[2];
    const value = JSON.parse(fs.readFileSync(file, "utf8"))[field];
    if (typeof value === "string" && value.length > 0) {
      process.stdout.write(value);
    }
  ' "$file" "$field"
}

hmac_sha256_hex() {
  local secret="$1"
  local payload="$2"
  printf '%s' "$payload" | openssl dgst -sha256 -hmac "$secret" -hex | awk '{print $NF}'
}

verify_webhook_hmac() {
  local secret="$1"
  local vector_secret='Jefe'
  local vector_payload='what do ya want for nothing?'
  local vector_expected='5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843'
  local vector_actual
  local payload='{"zen":"SourceLens GitHub App drill","hook_id":1}'
  local digest
  local signature

  vector_actual="$(hmac_sha256_hex "$vector_secret" "$vector_payload")"
  if [[ "$vector_actual" == "$vector_expected" ]]; then
    record_ok "GitHub webhook HMAC SHA-256 matches the local test vector"
  else
    record_fail "GitHub webhook HMAC SHA-256 test vector mismatch"
    return
  fi

  digest="$(hmac_sha256_hex "$secret" "$payload")"
  signature="sha256=${digest}"
  if [[ "$signature" =~ ^sha256=[0-9a-f]{64}$ ]]; then
    record_ok "GitHub webhook HMAC SHA-256 signature header can be computed locally"
  else
    record_fail "GitHub webhook HMAC SHA-256 signature header computation failed"
  fi
}

validate_bool_mode SOURCELENS_GITHUB_APP_DRILL_WARN_ONLY "$WARN_ONLY"

echo "SourceLens GitHub App drill"
echo "==========================="
echo "Mode: $(is_true "$WARN_ONLY" && echo warn-only || echo strict)"

check_env_file_boundary

echo "== Configuration =="
api_base_url="$(config_value_or_default GITHUB_API_BASE_URL "$DEFAULT_API_BASE_URL")"
api_base_url="${api_base_url%/}"
allowed_api_hosts="$(config_value_or_default GITHUB_ALLOWED_API_HOSTS "$DEFAULT_ALLOWED_API_HOSTS")"
validate_api_egress_policy "$api_base_url" "$allowed_api_hosts" || true
require_positive_integer_config connect_timeout SOURCELENS_GITHUB_APP_DRILL_CONNECT_TIMEOUT "$DEFAULT_CONNECT_TIMEOUT" "GitHub App drill connect timeout" || true
require_positive_integer_config max_time SOURCELENS_GITHUB_APP_DRILL_MAX_TIME "$DEFAULT_MAX_TIME" "GitHub App drill max time" || true
require_config_value app_id GITHUB_APP_ID "GitHub App JWT signing" || true
require_config_value private_key_pem GITHUB_APP_PRIVATE_KEY_PEM "GitHub App JWT signing" || true
if [[ -n "${private_key_pem:-}" ]]; then
  require_private_key_pem_value GITHUB_APP_PRIVATE_KEY_PEM "$private_key_pem" "GitHub App JWT signing"
fi
require_config_value webhook_secret GITHUB_APP_WEBHOOK_SECRET "GitHub webhook signature drill" || true
if [[ -n "${webhook_secret:-}" ]]; then
  require_min_length_value GITHUB_APP_WEBHOOK_SECRET "$webhook_secret" 16 "GitHub webhook signature drill"
fi
installation_id="$(config_value SOURCELENS_GITHUB_APP_DRILL_INSTALLATION_ID)"
if [[ -z "$installation_id" ]]; then
  installation_id="$(config_value GITHUB_APP_INSTALLATION_ID)"
fi
if [[ "$installation_id" =~ ^[1-9][0-9]*$ ]]; then
  record_ok "GitHub App installation id is configured for drill"
else
  record_fail "SOURCELENS_GITHUB_APP_DRILL_INSTALLATION_ID or GITHUB_APP_INSTALLATION_ID must be a positive integer"
fi
repository_full_name="$(config_value SOURCELENS_GITHUB_APP_DRILL_REPOSITORY)"
repository_owner=""
repository_name=""
validate_repository_full_name "$repository_full_name" || true

echo
echo "== Local toolchain =="
require_cmd curl "GitHub API drill"
require_cmd openssl "GitHub App JWT and webhook signature drill"
require_cmd node "GitHub API JSON parsing"

if (( failures > 0 )) || { is_true "$WARN_ONLY" && (( warnings > 0 )); }; then
  finish
  exit 0
fi

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/sourcelens-github-app-drill.XXXXXX")"
chmod 700 "$tmp_dir"
private_key_file="${tmp_dir}/github-app-private-key.pem"
write_private_key_file "$private_key_pem" "$private_key_file"

echo
echo "== Local signature checks =="
if openssl pkey -in "$private_key_file" -noout >/dev/null 2>&1 || openssl rsa -in "$private_key_file" -check -noout >/dev/null 2>&1; then
  record_ok "GitHub App private key can be parsed by openssl"
else
  record_fail "GitHub App private key PEM cannot be parsed by openssl"
fi
verify_webhook_hmac "$webhook_secret"

if (( failures > 0 )) || { is_true "$WARN_ONLY" && (( warnings > 0 )); }; then
  finish
  exit 0
fi

echo
echo "== GitHub API read-only drill =="
app_jwt="$(create_app_jwt "$app_id" "$private_key_file")"
app_response="${tmp_dir}/app.json"
status="$(curl_json GET "${api_base_url}/app" "$app_jwt" "$app_response")"
require_http_success "GET /app with App JWT" "$status"

installation_response="${tmp_dir}/installation.json"
status="$(curl_json GET "${api_base_url}/app/installations/${installation_id}" "$app_jwt" "$installation_response")"
require_http_success "GET /app/installations/{installation_id}" "$status"

token_response="${tmp_dir}/installation-token.json"
status="$(curl_json POST "${api_base_url}/app/installations/${installation_id}/access_tokens" "$app_jwt" "$token_response")"
require_http_success "POST /app/installations/{installation_id}/access_tokens" "$status"
installation_token="$(json_string_field "$token_response" token || true)"
if [[ -n "$installation_token" ]]; then
  record_ok "installation access token response includes token field"
else
  record_fail "installation access token response must include token field"
fi

if [[ -n "${installation_token:-}" ]]; then
  repo_response="${tmp_dir}/repo.json"
  status="$(curl_json GET "${api_base_url}/repos/${repository_owner}/${repository_name}" "$installation_token" "$repo_response")"
  require_http_success "GET /repos/{owner}/{repo} with installation token" "$status"
fi

finish
