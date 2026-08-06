#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_PREFLIGHT_ENV_FILE:-deploy/.env}"
WARN_ONLY="${SOURCELENS_PREFLIGHT_WARN_ONLY:-false}"
REQUIRE_GITHUB_APP="${SOURCELENS_PREFLIGHT_REQUIRE_GITHUB_APP:-false}"
INCLUDE_STATIC_GATES="${SOURCELENS_PREFLIGHT_INCLUDE_STATIC_GATES:-true}"

failures=0
warnings=0

fail() {
  echo "PRODUCTION PREFLIGHT FAIL: $*" >&2
  exit 1
}

is_true() {
  local value
  value="$(normalize_config_value "${1:-}")"
  case "$(to_lower "$value")" in
    true|1|yes|y) return 0 ;;
    *) return 1 ;;
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

has_value() {
  [[ -n "$(config_value "$1")" ]]
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

validate_startup_modes() {
  validate_bool_mode SOURCELENS_PREFLIGHT_WARN_ONLY "$WARN_ONLY"
  validate_bool_mode SOURCELENS_PREFLIGHT_REQUIRE_GITHUB_APP "$REQUIRE_GITHUB_APP"
  validate_bool_mode SOURCELENS_PREFLIGHT_INCLUDE_STATIC_GATES "$INCLUDE_STATIC_GATES"
  validate_optional_bool_config SOURCELENS_AGENT_CREATE_PR_ENABLED
  validate_optional_bool_config SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED
}

validate_optional_bool_config() {
  local key="$1"
  local value
  value="$(config_value "$key")"
  [[ -z "$value" ]] && return 0
  case "$(to_lower "$(normalize_config_value "$value")")" in
    true|1|yes|y|false|0|no|n) return 0 ;;
    *)
      fail "$key must be true or false"
      ;;
  esac
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

check_git_cli() {
  if ! command -v git >/dev/null 2>&1; then
    record_fail "git is required for GitService anonymous GitHub clone runtime dependency and public repo smoke"
    return
  fi
  local version
  version="$(git --version 2>/dev/null || true)"
  if [[ -z "$version" ]]; then
    record_fail "git is present but git --version failed; GitService anonymous GitHub clone cannot be preflighted"
  else
    record_ok "$version is available for GitService anonymous GitHub clone runtime dependency and public repo smoke"
  fi
}

is_safe_container_name() {
  local value="$1"
  [[ "$value" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$ ]]
}

docker_mysql_available_for_phase12() {
  local container
  container="$(config_value SOURCELENS_PHASE12_MYSQL_DOCKER_CONTAINER)"
  container="${container:-sourcelens-mysql}"
  is_safe_container_name "$container" || return 1
  command -v docker >/dev/null 2>&1 || return 1
  [[ "$(docker container inspect -f '{{.State.Running}}' "$container" 2>/dev/null || true)" == "true" ]] || return 1
  docker exec "$container" sh -lc 'command -v mysql >/dev/null 2>&1' >/dev/null 2>&1
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
      record_ok "$key is configured"
      ;;
  esac
}

forbidden_secret_value() {
  local key="$1"
  case "$key" in
    JWT_SECRET)
      printf '%s\n' "SourceLens-2026-SuperSecretKey-ForDevelopmentOnly-PleaseChangeInProduction"
      ;;
    ENCRYPT_PASSWORD)
      printf '%s\n' "SourceLensDefaultPassword2026"
      ;;
    ENCRYPT_SALT)
      printf '%s\n' "SourceLensSalt2026"
      ;;
    DB_PASSWORD)
      printf '%s\n' "sourcelens123"
      ;;
  esac
}

require_strong_secret() {
  local key="$1"
  local min_length="$2"
  local purpose="$3"
  local value
  local forbidden
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    record_fail "$key is required for $purpose"
    return
  fi
  case "$value" in
    change-this*|your_*|your-*|changeme|CHANGE_ME)
      record_fail "$key still uses placeholder value"
      return
      ;;
  esac
  forbidden="$(forbidden_secret_value "$key")"
  if [[ -n "$forbidden" && "$value" == "$forbidden" ]]; then
    record_fail "$key uses a development default"
    return
  fi
  if (( ${#value} < min_length )); then
    record_fail "$key must be at least ${min_length} characters for $purpose"
    return
  fi
  record_ok "$key is configured and meets minimum length"
}

require_private_key_pem() {
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
      return
      ;;
  esac
  if [[ "$value" == *"BEGIN"* && "$value" == *"PRIVATE KEY"* ]]; then
    record_ok "$key looks like a private key PEM"
  else
    record_fail "$key must contain a PEM private key header for $purpose"
  fi
}

require_config_equals() {
  local key="$1"
  local expected="$2"
  local purpose="$3"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    record_fail "$key is required for $purpose"
    return
  fi
  if [[ "$(to_lower "$value")" == "$(to_lower "$expected")" ]]; then
    record_ok "$key=$expected"
  else
    record_fail "$key must be $expected for $purpose, got $value"
  fi
}

require_config_equals_or_safe_default() {
  local key="$1"
  local expected="$2"
  local purpose="$3"
  local safe_default="$4"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    record_ok "$key is not overridden; $safe_default"
    return
  fi
  if [[ "$(to_lower "$value")" == "$(to_lower "$expected")" ]]; then
    record_ok "$key=$expected"
  else
    record_fail "$key must be $expected for $purpose, got $value"
  fi
}

check_optional_cleanup_policy() {
  local label="$1"
  local enabled_key="$2"
  local retention_key="$3"
  local retention_default="$4"
  local batch_key="$5"
  local batch_default="$6"
  local max_batch="$7"
  local enabled
  local retention_value
  local batch_value
  enabled="$(config_value "$enabled_key")"

  if [[ -z "$enabled" ]]; then
    record_warn "$enabled_key is not configured; $label cleanup remains disabled by default"
  else
    case "$(to_lower "$enabled")" in
      true|1|yes|y)
        record_ok "$enabled_key=true"
        ;;
      false|0|no|n)
        record_warn "$enabled_key=$enabled; $label cleanup is disabled"
        ;;
      *)
        record_fail "$enabled_key must be true or false for $label cleanup, got $enabled"
        ;;
    esac
  fi

  resolve_positive_integer_config retention_value "$retention_key" "$retention_default" "$label retention" || true
  resolve_bounded_positive_integer_config batch_value "$batch_key" "$batch_default" "$label cleanup batch size" "$max_batch" || true
}

require_positive_decimal_or_safe_default() {
  local key="$1"
  local purpose="$2"
  local safe_default="$3"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    record_ok "$key is not overridden; $safe_default"
    return
  fi
  if [[ "$value" =~ ^([0-9]+([.][0-9]+)?|[.][0-9]+)$ ]] \
      && awk -v value="$value" 'BEGIN { exit(value > 0 ? 0 : 1) }'; then
    record_ok "$key=$value"
  else
    record_fail "$key must be a positive decimal for $purpose, got $value"
  fi
}

resolve_positive_integer_config() {
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

resolve_bounded_positive_integer_config() {
  local result_var="$1"
  local key="$2"
  local default_value="$3"
  local purpose="$4"
  local max_value="$5"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    value="$default_value"
  fi
  if [[ "$value" =~ ^[1-9][0-9]*$ ]] && (( value <= max_value )); then
    record_ok "$key=$value for $purpose"
    printf -v "$result_var" '%s' "$value"
    return 0
  fi
  record_fail "$key must be a positive integer <= $max_value for $purpose, got $value"
  return 1
}

require_positive_docker_memory_or_safe_default() {
  local key="$1"
  local purpose="$2"
  local safe_default="$3"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    record_ok "$key is not overridden; $safe_default"
    return
  fi
  if [[ "$value" =~ ^[1-9][0-9]*[bBkKmMgG]?$ ]]; then
    record_ok "$key=$value"
  else
    record_fail "$key must be a positive Docker memory limit for $purpose, got $value"
  fi
}

require_digest_pinned_image_or_safe_default() {
  local key="$1"
  local purpose="$2"
  local safe_default="$3"
  local value
  value="$(config_value "$key")"
  if [[ -z "$value" ]]; then
    record_ok "$key is not overridden; $safe_default"
    return
  fi
  if [[ "$value" =~ ^[^[:space:]]+@sha256:[0-9a-fA-F]{64}$ ]]; then
    record_ok "$key is pinned to a sha256 digest"
  else
    record_fail "$key must be pinned to a sha256 digest for $purpose, got $value"
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

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
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

require_github_api_egress_policy() {
  local base_url allowed_hosts normalized_base host
  base_url="$(trim "$(config_value GITHUB_API_BASE_URL)")"
  allowed_hosts="$(config_value GITHUB_ALLOWED_API_HOSTS)"
  if [[ -z "$base_url" || -z "$allowed_hosts" ]]; then
    return
  fi

  normalized_base="$(to_lower "$base_url")"
  if [[ "$normalized_base" != https://* ]]; then
    record_fail "GITHUB_API_BASE_URL must use https for GitHub API egress policy"
    return
  fi
  if [[ "$base_url" == *"@"* || "$base_url" == *"?"* || "$base_url" == *"#"* ]]; then
    record_fail "GITHUB_API_BASE_URL must not contain user-info, query or fragment"
    return
  fi

  if ! host="$(github_api_host "$base_url")" || [[ -z "$host" ]]; then
    record_fail "GITHUB_API_BASE_URL must include a host"
    return
  fi
  if ! host_in_allowed_hosts "$host" "$allowed_hosts"; then
    record_fail "GITHUB_API_BASE_URL host must be listed in GITHUB_ALLOWED_API_HOSTS, got $host"
    return
  fi
  if is_blocked_github_api_host "$host"; then
    record_fail "GITHUB_API_BASE_URL host must not point to localhost, private networks, link-local or metadata services"
    return
  fi
  record_ok "GITHUB_API_BASE_URL egress policy is safe"
}

run_static_gate() {
  local label="$1"
  shift
  local output
  local line
  if output="$("$@" 2>&1)"; then
    record_ok "$label pass"
    return
  fi
  record_fail "$label failed"
  if [[ -z "$output" ]]; then
    return
  fi
  while IFS= read -r line; do
    log_check "DETAIL" "$label: $line"
  done <<< "$output"
}

check_static_gates() {
  echo
  echo "== Static release gates =="
  run_static_gate "security regression checks" "$ROOT_DIR/scripts/security-regression-check.sh"
  run_static_gate "dependency regression checks" "$ROOT_DIR/scripts/dependency-regression-check.sh"
  run_static_gate "LLM safety regression checks" "$ROOT_DIR/scripts/llm-safety-regression.sh"
}

check_commands() {
  echo
  echo "== Local toolchain =="
  check_git_cli
  require_cmd curl "smoke test"
  require_cmd docker "Docker image, Compose and sandbox validation"

  if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
      record_ok "Docker daemon is reachable"
    else
      record_fail "Docker daemon is not reachable; Docker image build and sandbox validation cannot run"
    fi

    if docker compose version >/dev/null 2>&1; then
      record_ok "docker compose is available"
    else
      record_fail "docker compose is required for deploy/docker-compose.yml validation"
    fi
  fi

  if command -v mysql >/dev/null 2>&1; then
    record_ok "mysql CLI is available for phase12 baseline"
  elif docker_mysql_available_for_phase12; then
    record_ok "Docker MySQL container can run phase12 baseline without host mysql CLI"
  else
    record_warn "mysql CLI is unavailable and no runnable Docker MySQL container was found for phase12 baseline"
  fi
}

check_env_file_permissions() {
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
    record_warn "$ENV_FILE not found; private env file permissions were not checked"
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
    record_fail "$ENV_FILE must be readable by the preflight user"
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

compose_service_block() {
  local rendered="$1"
  local service="$2"
  awk -v service="$service" '
    $0 == "  " service ":" {
      in_service = 1
      print
      next
    }
    in_service && $0 ~ /^  [A-Za-z0-9_.-]+:/ {
      exit
    }
    in_service {
      print
    }
  ' <<< "$rendered"
}

require_rendered_compose_match() {
  local rendered="$1"
  local pattern="$2"
  local purpose="$3"
  local label="$4"
  if grep -Eq "$pattern" <<< "$rendered"; then
    record_ok "$label compose keeps $purpose"
  else
    record_fail "$label compose must keep $purpose"
  fi
}

require_rendered_compose_contains() {
  local rendered="$1"
  local needle="$2"
  local purpose="$3"
  local label="$4"
  if grep -Fq "$needle" <<< "$rendered"; then
    record_ok "$label compose keeps $purpose"
  else
    record_fail "$label compose must keep $purpose"
  fi
}

check_rendered_compose_security() {
  local rendered="$1"
  local label="$2"
  local backend_block
  local mysql_block
  local redis_block

  backend_block="$(compose_service_block "$rendered" backend)"
  mysql_block="$(compose_service_block "$rendered" mysql)"
  redis_block="$(compose_service_block "$rendered" redis)"

  if [[ -z "$backend_block" ]]; then
    record_fail "$label compose must include backend service"
    return
  fi
  if [[ -z "$mysql_block" ]]; then
    record_fail "$label compose must include mysql service"
    return
  fi
  if [[ -z "$redis_block" ]]; then
    record_fail "$label compose must include redis service"
    return
  fi

  require_rendered_compose_contains "$backend_block" "context: $ROOT_DIR" "repository-root backend build context" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+dockerfile:[[:space:]]*backend-spring/Dockerfile$' "backend Dockerfile path" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SPRING_PROFILES_ACTIVE:[[:space:]]*"?prod"?$' "prod Spring profile" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_SANDBOX_EXECUTOR:[[:space:]]*"?docker"?$' "docker sandbox executor" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_SANDBOX_DOCKER_NETWORK:[[:space:]]*"?none"?$' "no-network docker sandbox" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_SANDBOX_DOCKER_USER:[[:space:]]*"?1000:1000"?$' "non-root docker sandbox user" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_SANDBOX_DOCKER_PIDS_LIMIT:[[:space:]]*"?256"?$' "docker sandbox pid limit" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_SANDBOX_DOCKER_READ_ONLY_ROOT:[[:space:]]*"?true"?$' "read-only docker sandbox root" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_SANDBOX_DOCKER_TMPFS:[[:space:]]*/tmp:rw,noexec,nosuid,size=64m$' "safe docker sandbox tmpfs" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_ALLOW_PAT_CREDENTIALS:[[:space:]]*"?false"?$' "PAT credentials disabled" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_ALLOW_LOCAL_FILE_REPOS:[[:space:]]*"?false"?$' "local file repositories disabled" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_WORKSPACE_SANDBOX_CLEANUP_ENABLED:' "workspace sandbox cleanup policy env" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_ARTIFACT_CLEANUP_ENABLED:' "artifact cleanup policy env" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_AUDIT_CLEANUP_ENABLED:' "audit cleanup policy env" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+SOURCELENS_EXECUTION_LOG_CLEANUP_ENABLED:' "execution log cleanup policy env" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+restart:[[:space:]]*unless-stopped$' "backend restart policy" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+source:[[:space:]]*backend-repos$' "backend workspace volume" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+target:[[:space:]]*/var/lib/sourcelens/repos$' "backend workspace mount target" "$label"
  require_rendered_compose_match "$backend_block" '^[[:space:]]+condition:[[:space:]]*service_healthy$' "healthy dependency gating" "$label"
  require_rendered_compose_match "$mysql_block" '^[[:space:]]+image:[[:space:]]*mysql:8\.4@sha256:[0-9a-fA-F]{64}$' "digest-pinned MySQL image" "$label"
  require_rendered_compose_match "$redis_block" '^[[:space:]]+image:[[:space:]]*redis:7-alpine@sha256:[0-9a-fA-F]{64}$' "digest-pinned Redis image" "$label"
}

render_and_check_compose_config() {
  local env_file="$1"
  local label="$2"
  local rendered
  if rendered="$(cd "$ROOT_DIR" && docker compose --env-file "$env_file" -f deploy/docker-compose.yml config)"; then
    record_ok "docker compose config renders with $label"
    check_rendered_compose_security "$rendered" "$label"
  else
    record_fail "docker compose config does not render with $label"
  fi
}

check_compose() {
  echo
  echo "== Docker Compose config =="
  if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
    record_fail "docker compose config could not be checked because docker compose is unavailable"
    return
  fi

  local template_env="deploy/.env.example"
  local template_path
  template_path="$(resolve_path "$template_env")"
  if [[ ! -f "$template_path" ]]; then
    record_fail "$template_env is missing"
    return
  fi

  render_and_check_compose_config "$template_env" "$template_env"

  local selected_path
  selected_path="$(resolve_path "$ENV_FILE")"
  if [[ "$ENV_FILE" == "$template_env" || "$selected_path" == "$template_path" ]]; then
    return
  fi

  if [[ ! -f "$selected_path" ]]; then
    record_warn "$ENV_FILE not found; selected deployment compose render was skipped"
    return
  fi

  render_and_check_compose_config "$selected_path" "selected env file $ENV_FILE"
}

check_prod_config() {
  echo
  echo "== Production configuration =="
  if [[ -f "$(resolve_path "$ENV_FILE")" ]]; then
    record_ok "using env file $ENV_FILE"
  else
    record_warn "$ENV_FILE not found; checking process environment only"
  fi

  require_config DB_URL "prod datasource"
  require_config DB_USERNAME "prod datasource"
  require_strong_secret DB_PASSWORD 12 "prod datasource"
  require_config REDIS_HOST "prod Redis"
  require_config REDIS_PORT "prod Redis"
  require_strong_secret JWT_SECRET 32 "prod JWT signing"
  require_strong_secret ENCRYPT_PASSWORD 16 "prod token encryption"
  require_strong_secret ENCRYPT_SALT 8 "prod token encryption"
  require_config_equals_or_safe_default SOURCELENS_SANDBOX_EXECUTOR docker "prod sandbox" "application-prod.yml defaults to docker"
  require_digest_pinned_image_or_safe_default SOURCELENS_SANDBOX_DOCKER_IMAGE "prod docker sandbox image" "application-prod.yml defaults to a digest-pinned alpine/git image"
  require_positive_docker_memory_or_safe_default SOURCELENS_SANDBOX_DOCKER_MEMORY "prod docker sandbox memory" "application-prod.yml defaults to 512m"
  require_positive_decimal_or_safe_default SOURCELENS_SANDBOX_DOCKER_CPUS "prod docker sandbox CPU limit" "application-prod.yml defaults to 1.0"
  require_config_equals_or_safe_default SOURCELENS_SANDBOX_DOCKER_NETWORK none "prod docker sandbox network" "application-prod.yml defaults to none"
  require_config_equals_or_safe_default SOURCELENS_SANDBOX_DOCKER_USER 1000:1000 "prod docker sandbox user" "application-prod.yml defaults to non-root 1000:1000"
  require_config_equals_or_safe_default SOURCELENS_SANDBOX_DOCKER_PIDS_LIMIT 256 "prod docker sandbox pid limit" "application-prod.yml defaults to 256"
  require_config_equals_or_safe_default SOURCELENS_SANDBOX_DOCKER_READ_ONLY_ROOT true "prod docker sandbox root filesystem" "application-prod.yml defaults to read-only root"
  require_config_equals_or_safe_default SOURCELENS_SANDBOX_DOCKER_TMPFS /tmp:rw,noexec,nosuid,size=64m "prod docker sandbox tmpfs" "application-prod.yml defaults to safe /tmp tmpfs"
  require_config_equals_or_safe_default SOURCELENS_ALLOW_PAT_CREDENTIALS false "prod repository boundary" "application-prod.yml defaults to false"
  require_config_equals_or_safe_default SOURCELENS_ALLOW_LOCAL_FILE_REPOS false "prod repository boundary" "application-prod.yml hard-disables local file repositories"
}

check_retention_cleanup_policies() {
  echo
  echo "== Retention cleanup policies =="
  check_optional_cleanup_policy "workspace sandbox" SOURCELENS_WORKSPACE_SANDBOX_CLEANUP_ENABLED SOURCELENS_WORKSPACE_SANDBOX_RETENTION_HOURS 24 SOURCELENS_WORKSPACE_SANDBOX_CLEANUP_BATCH_SIZE 100 1000
  check_optional_cleanup_policy "artifact" SOURCELENS_ARTIFACT_CLEANUP_ENABLED SOURCELENS_ARTIFACT_RETENTION_DAYS 30 SOURCELENS_ARTIFACT_CLEANUP_BATCH_SIZE 200 1000
  check_optional_cleanup_policy "audit" SOURCELENS_AUDIT_CLEANUP_ENABLED SOURCELENS_AUDIT_RETENTION_DAYS 90 SOURCELENS_AUDIT_CLEANUP_BATCH_SIZE 500 5000
  check_optional_cleanup_policy "execution log" SOURCELENS_EXECUTION_LOG_CLEANUP_ENABLED SOURCELENS_EXECUTION_LOG_RETENTION_DAYS 30 SOURCELENS_EXECUTION_LOG_CLEANUP_BATCH_SIZE 1000 5000
}

check_github_app_config() {
  echo
  echo "== GitHub App readiness =="
  local create_pr_enabled
  local autorepair_pr_enabled
  local retention_days
  local cleanup_batch_size
  create_pr_enabled="$(config_value SOURCELENS_AGENT_CREATE_PR_ENABLED)"
  autorepair_pr_enabled="$(config_value SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED)"

  if is_true "$create_pr_enabled" || is_true "$autorepair_pr_enabled" || is_true "$REQUIRE_GITHUB_APP"; then
    require_config GITHUB_APP_ID "GitHub App PR/webhook flow"
    require_private_key_pem GITHUB_APP_PRIVATE_KEY_PEM "GitHub App installation token exchange"
    require_strong_secret GITHUB_APP_WEBHOOK_SECRET 16 "GitHub App webhook signature validation"
    require_config GITHUB_API_BASE_URL "GitHub API egress policy"
    require_config GITHUB_ALLOWED_API_HOSTS "GitHub API egress policy"
    require_github_api_egress_policy
    require_config_equals GITHUB_WEBHOOK_DELIVERY_CLEANUP_ENABLED true "GitHub webhook delivery retention"
    resolve_positive_integer_config retention_days GITHUB_WEBHOOK_DELIVERY_RETENTION_DAYS 30 "GitHub webhook delivery retention" || true
    resolve_bounded_positive_integer_config cleanup_batch_size GITHUB_WEBHOOK_DELIVERY_CLEANUP_BATCH_SIZE 500 "GitHub webhook delivery cleanup batch size" 5000 || true
  else
    record_warn "GitHub App variables are not required because controlled PR features are disabled; set SOURCELENS_PREFLIGHT_REQUIRE_GITHUB_APP=true for E2E readiness"
  fi
}

check_smoke_target() {
  echo
  echo "== Smoke target =="
  local base_url
  local connect_timeout
  local max_time
  local -a curl_timeout_args
  base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
  if [[ -z "$base_url" ]]; then
    record_warn "SOURCELENS_BASE_URL is not set; deployment smoke target was not checked"
    return
  fi
  if ! require_base_url_shape SOURCELENS_BASE_URL "$base_url"; then
    return
  fi

  if ! resolve_positive_integer_config connect_timeout SOURCELENS_SMOKE_CONNECT_TIMEOUT 5 "deployment smoke connect timeout"; then
    return
  fi
  if ! resolve_positive_integer_config max_time SOURCELENS_SMOKE_MAX_TIME 15 "deployment smoke max time"; then
    return
  fi
  curl_timeout_args=(--connect-timeout "$connect_timeout" --max-time "$max_time")

  if curl "${curl_timeout_args[@]}" -fsS "$base_url/api/health" >/dev/null; then
    record_ok "$base_url/api/health is reachable"
  else
    record_fail "$base_url/api/health is not reachable"
  fi

  local metrics_status
  metrics_status="$(curl "${curl_timeout_args[@]}" -sS -o /dev/null -w "%{http_code}" "$base_url/actuator/metrics" || true)"
  case "$metrics_status" in
    401|403) record_ok "$base_url/actuator/metrics requires authentication" ;;
    "") record_fail "$base_url/actuator/metrics status could not be checked" ;;
    *) record_fail "$base_url/actuator/metrics must require authentication, got HTTP $metrics_status" ;;
  esac
}

validate_startup_modes

echo "SourceLens production preflight"
echo "================================"
echo "Mode: $(is_true "$WARN_ONLY" && echo warn-only || echo strict)"
echo "Static gates: $(is_true "$INCLUDE_STATIC_GATES" && echo enabled || echo skipped)"

if is_true "$INCLUDE_STATIC_GATES"; then
  check_static_gates
else
  echo
  echo "== Static release gates =="
  record_warn "Static release gates skipped by SOURCELENS_PREFLIGHT_INCLUDE_STATIC_GATES=false; only use when an outer gate already ran make verify"
fi
check_commands
check_env_file_permissions
check_compose
check_prod_config
check_retention_cleanup_policies
check_github_app_config
check_smoke_target

echo
echo "Summary: ${failures} failure(s), ${warnings} warning(s)"

if (( failures > 0 )); then
  exit 1
fi
