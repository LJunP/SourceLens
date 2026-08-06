#!/usr/bin/env bash
set -euo pipefail
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_RELEASE_EVIDENCE_ENV_FILE:-${SOURCELENS_PREFLIGHT_ENV_FILE:-deploy/.env}}"
EVIDENCE_DIR="${SOURCELENS_RELEASE_EVIDENCE_DIR:-release-evidence}"
RUN_ID="${SOURCELENS_RELEASE_EVIDENCE_RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
RELEASE_EVIDENCE_PROFILE="${SOURCELENS_RELEASE_EVIDENCE_PROFILE:-local}"
RELEASE_EVIDENCE_PROFILE_SOURCE="default"
if [[ -n "${SOURCELENS_RELEASE_EVIDENCE_PROFILE+x}" ]]; then
  RELEASE_EVIDENCE_PROFILE_SOURCE="env"
fi
RELEASE_EVIDENCE_PROFILE_SCHEMA_VERSION="3"
INCLUDE_VERIFY="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY:-true}"
INCLUDE_PREFLIGHT="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT:-true}"
INCLUDE_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE:-auto}"
INCLUDE_PUBLIC_REPO_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE:-auto}"
PUBLIC_REPO_SMOKE_UI="${SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI:-false}"
PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION="${SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION:-auto}"
INCLUDE_FILE_BOUND_REPAIR_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE:-auto}"
INCLUDE_AUTOREPAIR_PATCH_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE:-auto}"
INCLUDE_PATCH_READY_UI_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PATCH_READY_UI_SMOKE:-false}"
INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE:-false}"
INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE:-false}"
INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE:-false}"
INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE:-false}"
INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE:-false}"
INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE:-false}"
INCLUDE_AUDIT_WORKBENCH_SMOKE="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE:-auto}"
INCLUDE_PHASE12="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12:-auto}"
INCLUDE_SANDBOX_DRILL="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL:-auto}"
INCLUDE_GITHUB_APP_DRILL="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL:-auto}"
INCLUDE_GITHUB_WEBHOOK_DRILL="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL:-auto}"
INCLUDE_LLM_PROVIDER_RUN="${SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN:-auto}"
WORKTREE_INVENTORY_STRICT="${SOURCELENS_RELEASE_EVIDENCE_WORKTREE_INVENTORY_STRICT:-true}"
AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES="${SOURCELENS_RELEASE_EVIDENCE_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES:-${SOURCELENS_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES:-false}}"
LLM_PROVIDER_RUN_FILE="${SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE:-}"
LLM_RAW_OUTPUT_DIR="${SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR:-}"
RELEASE_EVIDENCE_TARGET_ENV="${SOURCELENS_RELEASE_EVIDENCE_TARGET_ENV:-local}"
ALLOW_MUTATING_PROD="${SOURCELENS_RELEASE_EVIDENCE_ALLOW_MUTATING_PROD:-false}"
ALLOW_EXTERNAL_DRILLS="${SOURCELENS_RELEASE_EVIDENCE_ALLOW_EXTERNAL_DRILLS:-false}"
PLAYWRIGHT_VERSION_TIMEOUT_SECONDS="${SOURCELENS_RELEASE_EVIDENCE_PLAYWRIGHT_VERSION_TIMEOUT_SECONDS:-20}"
PUBLIC_REPO_SOURCE_LOCATION_PROBES_REQUIRED="false"
RUN_ID_MAX_CHARS="64"

failures=0
warnings=0
skipped=0

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
      echo "$key must be true or false" >&2
      exit 1
      ;;
  esac
}

validate_optional_mode() {
  local key="$1"
  local value="$2"
  case "$(to_lower "$(normalize_config_value "$value")")" in
    auto|true|1|yes|y|false|0|no|n) return 0 ;;
    *)
      echo "$key must be true, false, or auto" >&2
      exit 1
      ;;
  esac
}

validate_positive_integer_config() {
  local key="$1"
  local value="$2"
  [[ "$value" =~ ^[1-9][0-9]*$ ]] || {
    echo "$key must be a positive integer" >&2
    exit 1
  }
}

validate_release_evidence_profile() {
  case "$(to_lower "$(normalize_config_value "$RELEASE_EVIDENCE_PROFILE")")" in
    local|ci|release|nightly)
      RELEASE_EVIDENCE_PROFILE="$(to_lower "$(normalize_config_value "$RELEASE_EVIDENCE_PROFILE")")"
      ;;
    *)
      echo "SOURCELENS_RELEASE_EVIDENCE_PROFILE must be local, ci, release, or nightly" >&2
      exit 1
      ;;
  esac
}

validate_release_evidence_target_env() {
  case "$(to_lower "$(normalize_config_value "$RELEASE_EVIDENCE_TARGET_ENV")")" in
    local|staging|prod)
      RELEASE_EVIDENCE_TARGET_ENV="$(to_lower "$(normalize_config_value "$RELEASE_EVIDENCE_TARGET_ENV")")"
      ;;
    *)
      echo "SOURCELENS_RELEASE_EVIDENCE_TARGET_ENV must be local, staging, or prod" >&2
      exit 1
      ;;
  esac
}

assert_no_profile_include_overrides() {
  local env_name
  for env_name in \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI \
    SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PATCH_READY_UI_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12 \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL \
    SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN; do
    if [[ -n "${!env_name+x}" ]]; then
      echo "$env_name cannot be used with SOURCELENS_RELEASE_EVIDENCE_PROFILE=$RELEASE_EVIDENCE_PROFILE; use profile=local for granular include overrides" >&2
      exit 1
    fi
  done
}

set_profile_default() {
  local variable_name="$1"
  local env_name="$2"
  local default_value="$3"
  if [[ -z "${!env_name+x}" ]]; then
    printf -v "$variable_name" '%s' "$default_value"
  fi
}

apply_release_evidence_profile() {
  validate_release_evidence_profile
  case "$RELEASE_EVIDENCE_PROFILE" in
    local)
      return
      ;;
    ci)
      assert_no_profile_include_overrides
      INCLUDE_VERIFY=false
      INCLUDE_PREFLIGHT=false
      INCLUDE_SMOKE=false
      INCLUDE_PUBLIC_REPO_SMOKE=false
      PUBLIC_REPO_SMOKE_UI=false
      PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION=false
      INCLUDE_FILE_BOUND_REPAIR_SMOKE=false
      INCLUDE_AUTOREPAIR_PATCH_SMOKE=false
      INCLUDE_PATCH_READY_UI_SMOKE=false
      INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE=false
      INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE=false
      INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE=false
      INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE=false
      INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE=false
      INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE=false
      INCLUDE_AUDIT_WORKBENCH_SMOKE=false
      INCLUDE_PHASE12=false
      INCLUDE_SANDBOX_DRILL=false
      INCLUDE_GITHUB_APP_DRILL=false
      INCLUDE_GITHUB_WEBHOOK_DRILL=false
      INCLUDE_LLM_PROVIDER_RUN=false
      ;;
    release)
      assert_no_profile_include_overrides
      INCLUDE_VERIFY=true
      INCLUDE_PREFLIGHT=true
      INCLUDE_SMOKE=true
      INCLUDE_PUBLIC_REPO_SMOKE=true
      PUBLIC_REPO_SMOKE_UI=true
      PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION=true
      INCLUDE_FILE_BOUND_REPAIR_SMOKE=true
      INCLUDE_AUTOREPAIR_PATCH_SMOKE=true
      INCLUDE_PATCH_READY_UI_SMOKE=true
      INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE=true
      INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE=true
      INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE=true
      INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE=true
      INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE=true
      INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE=auto
      INCLUDE_AUDIT_WORKBENCH_SMOKE=true
      INCLUDE_PHASE12=auto
      INCLUDE_SANDBOX_DRILL=auto
      INCLUDE_GITHUB_APP_DRILL=auto
      INCLUDE_GITHUB_WEBHOOK_DRILL=auto
      INCLUDE_LLM_PROVIDER_RUN=auto
      ;;
    nightly)
      assert_no_profile_include_overrides
      INCLUDE_VERIFY=true
      INCLUDE_PREFLIGHT=true
      INCLUDE_SMOKE=true
      INCLUDE_PUBLIC_REPO_SMOKE=true
      PUBLIC_REPO_SMOKE_UI=true
      PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION=true
      INCLUDE_FILE_BOUND_REPAIR_SMOKE=true
      INCLUDE_AUTOREPAIR_PATCH_SMOKE=true
      INCLUDE_PATCH_READY_UI_SMOKE=true
      INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE=true
      INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE=true
      INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE=true
      INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE=true
      INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE=true
      INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE=auto
      INCLUDE_AUDIT_WORKBENCH_SMOKE=true
      INCLUDE_PHASE12=true
      INCLUDE_SANDBOX_DRILL=true
      INCLUDE_GITHUB_APP_DRILL=auto
      INCLUDE_GITHUB_WEBHOOK_DRILL=auto
      INCLUDE_LLM_PROVIDER_RUN=auto
      ;;
  esac
}

set_profile_derived_requirements() {
  case "$RELEASE_EVIDENCE_PROFILE" in
    release|nightly)
      PUBLIC_REPO_SOURCE_LOCATION_PROBES_REQUIRED="true"
      ;;
    *)
      PUBLIC_REPO_SOURCE_LOCATION_PROBES_REQUIRED="false"
      ;;
  esac
}

validate_include_modes() {
  validate_release_evidence_profile
  validate_bool_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY "$INCLUDE_VERIFY"
  validate_bool_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT "$INCLUDE_PREFLIGHT"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE "$INCLUDE_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE "$INCLUDE_PUBLIC_REPO_SMOKE"
  validate_bool_mode SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI "$PUBLIC_REPO_SMOKE_UI"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION "$PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE "$INCLUDE_FILE_BOUND_REPAIR_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE "$INCLUDE_AUTOREPAIR_PATCH_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PATCH_READY_UI_SMOKE "$INCLUDE_PATCH_READY_UI_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE "$INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE "$INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE "$INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE "$INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE "$INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE "$INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE "$INCLUDE_AUDIT_WORKBENCH_SMOKE"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12 "$INCLUDE_PHASE12"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL "$INCLUDE_SANDBOX_DRILL"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL "$INCLUDE_GITHUB_APP_DRILL"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL "$INCLUDE_GITHUB_WEBHOOK_DRILL"
  validate_optional_mode SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN "$INCLUDE_LLM_PROVIDER_RUN"
  validate_bool_mode SOURCELENS_RELEASE_EVIDENCE_WORKTREE_INVENTORY_STRICT "$WORKTREE_INVENTORY_STRICT"
  validate_bool_mode SOURCELENS_RELEASE_EVIDENCE_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES "$AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES"
  validate_release_evidence_target_env
  validate_bool_mode SOURCELENS_RELEASE_EVIDENCE_ALLOW_MUTATING_PROD "$ALLOW_MUTATING_PROD"
  validate_bool_mode SOURCELENS_RELEASE_EVIDENCE_ALLOW_EXTERNAL_DRILLS "$ALLOW_EXTERNAL_DRILLS"
  validate_positive_integer_config SOURCELENS_RELEASE_EVIDENCE_PLAYWRIGHT_VERSION_TIMEOUT_SECONDS "$PLAYWRIGHT_VERSION_TIMEOUT_SECONDS"
  if is_true "$PUBLIC_REPO_SMOKE_UI" && is_false "$INCLUDE_PUBLIC_REPO_SMOKE"; then
    echo "SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI=true requires SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE to be true or auto" >&2
    exit 1
  fi
  if mode_required "$PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION" && is_false "$INCLUDE_PUBLIC_REPO_SMOKE"; then
    echo "SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION=true requires SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE to be true or auto" >&2
    exit 1
  fi
}

run_command_with_timeout() {
  local seconds="$1"
  local status
  local restore_errexit=false
  shift
  validate_positive_integer_config command_timeout "$seconds"
  case "$-" in
    *e*) restore_errexit=true ;;
  esac
  set +e
  if command -v timeout >/dev/null 2>&1; then
    timeout "$seconds" "$@"
    status=$?
  elif command -v gtimeout >/dev/null 2>&1; then
    gtimeout "$seconds" "$@"
    status=$?
  else
    node -e '
const { spawn } = require("node:child_process");
const seconds = Number(process.argv[1]);
const command = process.argv[2];
const args = process.argv.slice(3);
if (!Number.isInteger(seconds) || seconds <= 0 || !command) process.exit(127);
let timedOut = false;
const child = spawn(command, args, { stdio: "inherit" });
const timer = setTimeout(() => {
  timedOut = true;
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 2000).unref();
}, seconds * 1000);
child.on("exit", (code, signal) => {
  clearTimeout(timer);
  if (timedOut) process.exit(124);
  if (signal) process.exit(128);
  process.exit(code ?? 1);
});
child.on("error", error => {
  clearTimeout(timer);
  console.error(error.message);
  process.exit(127);
});
' "$seconds" "$@"
    status=$?
  fi
  if [[ "$restore_errexit" == "true" ]]; then
    set -e
  else
    set +e
  fi
  return "$status"
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

mode_enabled() {
  local mode="$1"
  [[ "$(to_lower "$(normalize_config_value "$mode")")" == "auto" ]] || is_true "$mode"
}

mode_required() {
  local mode="$1"
  is_true "$mode"
}

bool_env_value() {
  local value="$1"
  if is_true "$value"; then
    printf 'true\n'
  else
    printf 'false\n'
  fi
}

base_url_host() {
  local value="$1"
  local host
  value="$(normalize_base_url "$value")"
  value="${value#*://}"
  value="${value%%/*}"
  value="${value#*@}"
  host="$value"
  if [[ "$host" == \[*\]* ]]; then
    host="${host#\[}"
    host="${host%%\]*}"
  else
    host="${host%%:*}"
  fi
  printf '%s\n' "$(to_lower "$host")"
}

is_loopback_base_url() {
  local host
  host="$(base_url_host "$1")"
  case "$host" in
    localhost|127.*|::1|0:0:0:0:0:0:0:1)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

base_url_port() {
  local value="$1"
  local scheme
  local authority
  local remainder
  value="$(normalize_base_url "$value")"
  scheme="${value%%://*}"
  authority="${value#*://}"
  authority="${authority%%/*}"
  authority="${authority#*@}"
  if [[ "$authority" == \[*\]* ]]; then
    remainder="${authority#*\]}"
    if [[ "$remainder" == :* ]]; then
      printf '%s\n' "${remainder#:}"
      return
    fi
  elif [[ "$authority" == *:* ]]; then
    printf '%s\n' "${authority##*:}"
    return
  fi
  case "$(to_lower "$scheme")" in
    http) printf '80\n' ;;
    https) printf '443\n' ;;
    *) printf '\n' ;;
  esac
}

profile_runs_mutating_smokes() {
  case "$RELEASE_EVIDENCE_PROFILE" in
    release|nightly) return 0 ;;
    *) return 1 ;;
  esac
}

release_evidence_runs_backend_smokes() {
  mode_enabled "$INCLUDE_SMOKE" \
    || mode_enabled "$INCLUDE_PUBLIC_REPO_SMOKE" \
    || mode_enabled "$INCLUDE_FILE_BOUND_REPAIR_SMOKE" \
    || mode_enabled "$INCLUDE_AUTOREPAIR_PATCH_SMOKE" \
    || mode_enabled "$INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE" \
    || mode_enabled "$INCLUDE_AUDIT_WORKBENCH_SMOKE"
}

is_unsafe_local_backend_runtime_command() {
  local command_line="$1"
  [[ "$command_line" == *"backend-spring/target/classes"* ]] \
    || [[ "$command_line" == *"spring-boot:run"* ]] \
    || [[ "$command_line" == *"backend-spring/target/"*"source-lens-backend"*".jar"* ]]
}

validate_loopback_backend_runtime_boundary() {
  local base_url
  local port
  local listener
  local listener_pids
  local listener_pid
  local listener_command
  base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
  if [[ -z "$base_url" ]] || ! release_evidence_runs_backend_smokes || ! is_loopback_base_url "$base_url"; then
    return
  fi
  port="$(base_url_port "$base_url")"
  if [[ -z "$port" || ! "$port" =~ ^[0-9]+$ ]]; then
    echo "SOURCELENS_BASE_URL=$base_url must include a numeric port when release evidence targets a loopback backend smoke" >&2
    exit 1
  fi
  if ! command -v lsof >/dev/null 2>&1; then
    echo "lsof is required to verify loopback backend runtime before release evidence backend smoke" >&2
    echo "Use SERVER_PORT=$port make backend-jar so release evidence targets .sourcelens-runtime/backend instead of target/classes or backend-spring/target/*.jar" >&2
    exit 1
  fi

  listener="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$listener" ]]; then
    return
  fi
  listener_pids="$(printf '%s\n' "$listener" | awk 'NR > 1 && $2 ~ /^[0-9]+$/ { print $2 }' | LC_ALL=C sort -u)"
  while IFS= read -r listener_pid; do
    [[ -n "$listener_pid" ]] || continue
    listener_command="$(ps -p "$listener_pid" -o command= 2>/dev/null || true)"
    if is_unsafe_local_backend_runtime_command "$listener_command"; then
      echo "SOURCELENS_BASE_URL points to an unsafe local backend runtime: $base_url" >&2
      echo "$listener" >&2
      echo >&2
      echo "The listener command is: $listener_command" >&2
      echo "Do not run release evidence backend smoke against target/classes, mvn spring-boot:run, or backend-spring/target/*.jar; Maven clean can break those runtimes mid-run." >&2
      echo "Run: cd backend-spring && mvn -DskipTests package" >&2
      echo "Then run: SERVER_PORT=$port make backend-jar" >&2
      echo "The expected stable runtime is under .sourcelens-runtime/backend." >&2
      exit 1
    fi
  done <<< "$listener_pids"
}

validate_mutating_target_boundary() {
  local base_url
  base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
  if ! profile_runs_mutating_smokes || [[ -z "$base_url" ]]; then
    return
  fi
  if is_loopback_base_url "$base_url"; then
    return
  fi
  case "$RELEASE_EVIDENCE_TARGET_ENV" in
    staging)
      return
      ;;
    prod)
      if is_true "$ALLOW_MUTATING_PROD"; then
        return
      fi
      echo "SOURCELENS_RELEASE_EVIDENCE_PROFILE=$RELEASE_EVIDENCE_PROFILE targets non-local SOURCELENS_BASE_URL=$base_url with target_env=prod; set SOURCELENS_RELEASE_EVIDENCE_ALLOW_MUTATING_PROD=true only for a dedicated production smoke tenant" >&2
      exit 1
      ;;
    *)
      echo "SOURCELENS_RELEASE_EVIDENCE_PROFILE=$RELEASE_EVIDENCE_PROFILE runs mutating smoke steps against non-local SOURCELENS_BASE_URL=$base_url; set SOURCELENS_RELEASE_EVIDENCE_TARGET_ENV=staging or prod explicitly" >&2
      exit 1
      ;;
  esac
}

external_drills_allowed() {
  [[ "$RELEASE_EVIDENCE_PROFILE" == "local" ]] || is_true "$ALLOW_EXTERNAL_DRILLS"
}

public_repo_smoke_cleanup_value() {
  if profile_runs_mutating_smokes; then
    printf 'true\n'
  else
    bool_env_value "${SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP:-false}"
  fi
}

append_summary() {
  printf '%s\n' "$1" >> "$SUMMARY_FILE"
}

status_field_fail() {
  echo "release evidence status field is invalid: $*" >&2
  exit 1
}

sanitize_status_detail() {
  local value="$1"
  value="$(printf '%s' "$value" | LC_ALL=C tr '[:cntrl:]' ' ')"
  value="${value//\`/\'}"
  value="$(trim "$value")"
  while [[ "$value" == *"  "* ]]; do
    value="${value//  / }"
  done
  if [[ -z "$value" ]]; then
    value="details unavailable"
  fi
  printf '%s' "$value"
}

validate_status_field() {
  local field_name="$1"
  local value="$2"
  if [[ -z "$value" || "$value" =~ [[:cntrl:]] || "$value" == *'`'* ]]; then
    status_field_fail "$field_name"
  fi
}

validate_generated_status_exit_code() {
  local status="$1"
  local exit_code="$2"
  case "$status" in
    OK)
      [[ "$exit_code" == "0" ]] || status_field_fail "OK status must use exit_code 0"
      ;;
    SKIP)
      [[ "$exit_code" == "-" ]] || status_field_fail "SKIP status must use exit_code -"
      ;;
    WARN)
      [[ "$exit_code" =~ ^[1-9][0-9]*$ ]] || status_field_fail "WARN status must use a non-zero numeric exit_code"
      ;;
    FAIL)
      [[ "$exit_code" == "-" || "$exit_code" =~ ^[1-9][0-9]*$ ]] || status_field_fail "FAIL status must use - or a non-zero numeric exit_code"
      ;;
  esac
}

validate_release_metadata_field() {
  local field_name="$1"
  local value="$2"
  if [[ -z "$value" || "$value" =~ [[:cntrl:]] || "$value" == *'`'* ]]; then
    echo "$field_name must be non-empty and must not contain control characters or backticks" >&2
    exit 1
  fi
}

sanitize_manifest_metadata_value() {
  local value="$1"
  value="$(printf '%s' "$value" | LC_ALL=C tr '[:cntrl:]' ' ')"
  value="${value//\`/\'}"
  value="$(trim "$value")"
  while [[ "$value" == *"  "* ]]; do
    value="${value//  / }"
  done
  printf '%s' "$value"
}

validate_release_metadata_inputs() {
  local evidence_root
  evidence_root="$(resolve_path "$(normalize_config_value "$EVIDENCE_DIR")")"
  validate_release_metadata_field SOURCELENS_ROOT_DIR "$ROOT_DIR"
  validate_release_metadata_field SOURCELENS_RELEASE_EVIDENCE_ENV_FILE "$ENV_FILE"
  validate_release_metadata_field SOURCELENS_RELEASE_EVIDENCE_DIR "$evidence_root"
}

record_status() {
  local status="$1"
  local title="$2"
  local slug="$3"
  local exit_code="$4"
  local log_file="$5"
  local detail="$6"

  detail="$(sanitize_status_detail "$detail")"
  case "$status" in
    OK|WARN|FAIL|SKIP) ;;
    *) status_field_fail "status=$status" ;;
  esac
  validate_status_field "title" "$title"
  [[ "$slug" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$ ]] || status_field_fail "slug=$slug"
  [[ "$exit_code" == "-" || "$exit_code" =~ ^[0-9]+$ ]] || status_field_fail "exit_code=$exit_code"
  [[ "$log_file" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$ ]] || status_field_fail "log_file=$log_file"
  validate_status_field "detail" "$detail"
  validate_generated_status_exit_code "$status" "$exit_code"

  printf '%s\t%s\t%s\t%s\t%s\n' "$status" "$slug" "$exit_code" "$log_file" "$detail" >> "$STATUS_FILE"
  append_summary "- ${status} \`${slug}\`: ${title} (${detail})"
}

is_sensitive_command_assignment() {
  local arg="$1"
  local key
  [[ "$arg" == *=* ]] || return 1
  key="$(to_lower "${arg%%=*}")"
  case "$key" in
    *password*|*passwd*|*pwd*|*token*|*secret*|*private_key*|*private-key*|*api_key*|*api-key*|*access_key*|*access-key*|*credential*|*authorization*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

redacted_command() {
  local first=true
  local arg
  local key
  for arg in "$@"; do
    if [[ "$first" == "true" ]]; then
      first=false
    else
      printf ' '
    fi
    if is_sensitive_command_assignment "$arg"; then
      key="${arg%%=*}"
      printf '%s=<redacted>' "$key"
    else
      printf '%s' "$arg"
    fi
  done
  printf '\n'
}

sensitive_config_keys() {
  {
    printf '%s\n' \
      DB_PASSWORD \
      MYSQL_ROOT_PASSWORD \
      MYSQL_PASSWORD \
      MYSQL_PWD \
      JWT_SECRET \
      ENCRYPT_PASSWORD \
      ENCRYPT_SALT \
      GITHUB_APP_PRIVATE_KEY_PEM \
      GITHUB_APP_WEBHOOK_SECRET \
      GITHUB_TOKEN \
      GITHUB_PERSONAL_ACCESS_TOKEN \
      SOURCELENS_SMOKE_TOKEN \
      OPENAI_API_KEY
    sensitive_keys_from_env_file
    if is_true "${SOURCELENS_RELEASE_EVIDENCE_SCAN_PROCESS_ENV_SECRETS:-false}"; then
      sensitive_keys_from_process_env
    fi
  } | awk 'NF && !seen[$0]++'
}

is_sensitive_config_key() {
  local key
  key="$(to_lower "$1")"
  case "$key" in
    *password*|*passwd*|*pwd*|*token*|*secret*|*private_key*|*private-key*|*api_key*|*api-key*|*access_key*|*access-key*|*credential*|*authorization*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

sensitive_keys_from_env_file() {
  local path
  path="$(resolve_path "$ENV_FILE")"
  [[ -f "$path" ]] || return 0
  awk '
    function trim_value(value) {
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      return value
    }
    function is_sensitive(key) {
      key = tolower(key)
      return key ~ /(password|passwd|pwd|token|secret|private_key|private-key|api_key|api-key|access_key|access-key|credential|authorization)/
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
      key = trim_value(substr(line, 1, eq - 1))
      if (key ~ /^[A-Za-z_][A-Za-z0-9_]*$/ && is_sensitive(key)) {
        print key
      }
    }
  ' "$path"
}

sensitive_keys_from_process_env() {
  local line
  local key
  env | while IFS= read -r line; do
    [[ "$line" == *=* ]] || continue
    key="${line%%=*}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if is_sensitive_config_key "$key"; then
      printf '%s\n' "$key"
    fi
  done
}

redact_value_in_file() {
  local file="$1"
  local value="$2"
  [[ -n "$value" ]] || return 0
  if (( ${#value} < 8 )); then
    return 0
  fi
  LC_ALL=C SOURCELENS_REDACT_VALUE="$value" perl -0pi -e '
    BEGIN {
      $value = $ENV{"SOURCELENS_REDACT_VALUE"} // "";
    }
    if (length($value) >= 8) {
      s/\Q$value\E/<redacted>/g;
    }
  ' "$file"
}

sanitize_log_file() {
  local file="$1"
  local key
  local keys_file
  local value
  keys_file="$(mktemp "${TMPDIR:-/tmp}/sourcelens-sensitive-keys.XXXXXX")" \
    || {
      echo "could not create sensitive key list temp file" >&2
      exit 1
    }
  sensitive_config_keys > "$keys_file"
  while IFS= read -r key; do
    value="$(config_value "$key")"
    redact_value_in_file "$file" "$value"
  done < "$keys_file"
  rm -f "$keys_file"
  return 0
}

run_step() {
  local title="$1"
  local slug="$2"
  local required="$3"
  shift 3
  local log_file="${RUN_DIR}/${slug}.log"
  local started_at
  local finished_at
  local exit_code
  started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '==> %s [%s] started; log=%s\n' "$title" "$slug" "$(basename "$log_file")"
  {
    printf 'title: %s\n' "$title"
    printf 'started_at: %s\n' "$started_at"
    printf 'command: '
    redacted_command "$@"
    printf '\n'
  } > "$log_file"
  set +e
  (cd "$ROOT_DIR" && "$@") >> "$log_file" 2>&1
  exit_code=$?
  set -e
  finished_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  {
    printf '\n'
    printf 'finished_at: %s\n' "$finished_at"
    printf 'exit_code: %s\n' "$exit_code"
  } >> "$log_file"
  sanitize_log_file "$log_file"
  if [[ "$exit_code" == "0" ]]; then
    printf '==> %s [%s] OK\n' "$title" "$slug"
    record_status "OK" "$title" "$slug" "$exit_code" "$(basename "$log_file")" "completed"
  elif is_true "$required"; then
    printf '==> %s [%s] FAIL exit=%s\n' "$title" "$slug" "$exit_code"
    failures=$((failures + 1))
    record_status "FAIL" "$title" "$slug" "$exit_code" "$(basename "$log_file")" "required step failed"
  else
    printf '==> %s [%s] WARN exit=%s\n' "$title" "$slug" "$exit_code"
    warnings=$((warnings + 1))
    record_status "WARN" "$title" "$slug" "$exit_code" "$(basename "$log_file")" "optional step failed"
  fi
}

record_skip() {
  local title="$1"
  local slug="$2"
  local reason="$3"
  local log_file="${RUN_DIR}/${slug}.log"
  skipped=$((skipped + 1))
  printf 'title: %s\nstatus: SKIP\nreason: %s\n' "$title" "$reason" > "$log_file"
  record_status "SKIP" "$title" "$slug" "-" "$(basename "$log_file")" "$reason"
}

record_required_missing() {
  local title="$1"
  local slug="$2"
  local reason="$3"
  local log_file="${RUN_DIR}/${slug}.log"
  failures=$((failures + 1))
  printf 'title: %s\nstatus: FAIL\nreason: %s\n' "$title" "$reason" > "$log_file"
  record_status "FAIL" "$title" "$slug" "-" "$(basename "$log_file")" "$reason"
}

set_validation_error() {
  VALIDATION_ERROR="$1"
  return 0
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

validate_backup_artifact_file() {
  local artifact_path="$1"
  local kind="$2"
  local purpose="$3"
  local mode
  local numeric_mode
  if [[ -L "$artifact_path" ]]; then
    set_validation_error "backup $kind artifact must not be a symlink for $purpose"
    return 1
  fi
  if [[ ! -f "$artifact_path" ]]; then
    set_validation_error "backup $kind artifact must be a regular file for $purpose"
    return 1
  fi
  if [[ ! -s "$artifact_path" ]]; then
    set_validation_error "backup $kind artifact must be non-empty for $purpose"
    return 1
  fi
  if [[ ! -r "$artifact_path" ]]; then
    set_validation_error "backup $kind artifact must be readable for $purpose"
    return 1
  fi
  if ! mode="$(file_mode "$artifact_path")"; then
    set_validation_error "backup $kind artifact permissions could not be inspected for $purpose"
    return 1
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    set_validation_error "backup $kind artifact permissions could not be parsed for $purpose"
    return 1
  fi
  numeric_mode=$((8#$mode))
  if (( (numeric_mode & 8#022) != 0 )); then
    set_validation_error "backup $kind artifact must not be group/world writable for $purpose"
    return 1
  fi
}

validate_backup_directory_boundary() {
  local backup_path="$1"
  local purpose="$2"
  local workspace
  local mode
  local numeric_mode
  workspace="$(config_value SOURCELENS_WORKSPACE)"
  workspace="${workspace:-/var/lib/sourcelens/repos}"
  if [[ -L "$backup_path" ]]; then
    set_validation_error "SOURCELENS_BACKUP_DIR must not be a symlink for $purpose"
    return 1
  fi
  if [[ ! -d "$backup_path" ]]; then
    set_validation_error "SOURCELENS_BACKUP_DIR must exist to validate $purpose"
    return 1
  fi
  if is_path_inside "$backup_path" "$ROOT_DIR"; then
    set_validation_error "SOURCELENS_BACKUP_DIR must not be inside the git worktree for $purpose"
    return 1
  fi
  if is_path_inside "$backup_path" "$workspace"; then
    set_validation_error "SOURCELENS_BACKUP_DIR must not be inside SOURCELENS_WORKSPACE for $purpose"
    return 1
  fi
  if [[ ! -r "$backup_path" || ! -x "$backup_path" ]]; then
    set_validation_error "SOURCELENS_BACKUP_DIR must be readable and searchable for $purpose"
    return 1
  fi
  if ! mode="$(file_mode "$backup_path")"; then
    set_validation_error "SOURCELENS_BACKUP_DIR permissions could not be inspected for $purpose"
    return 1
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    set_validation_error "SOURCELENS_BACKUP_DIR permissions could not be parsed for $purpose"
    return 1
  fi
  numeric_mode=$((8#$mode))
  if (( (numeric_mode & 8#077) != 0 )); then
    set_validation_error "SOURCELENS_BACKUP_DIR permissions must not grant group/world access for $purpose"
    return 1
  fi
}

validate_backup_artifact_set() {
  local backup_path="$1"
  local backup_id="$2"
  local purpose="$3"
  local kind
  local manifest_path
  local artifact_path
  for kind in database workspace artifacts checksums; do
    if ! backup_artifact_kind_found "$backup_path" "$backup_id" "$kind"; then
      set_validation_error "SOURCELENS_BACKUP_DIR must contain a $kind artifact filename with backup_id=$backup_id for $purpose"
      return 1
    fi
  done
  manifest_path="$(backup_artifact_path_for_kind "$backup_path" "$backup_id" "checksums" || true)"
  if [[ -z "$manifest_path" ]]; then
    set_validation_error "SOURCELENS_BACKUP_DIR must contain a checksums artifact filename with backup_id=$backup_id for $purpose"
    return 1
  fi
  if ! validate_backup_artifact_file "$manifest_path" "checksums" "$purpose"; then
    return 1
  fi
  for kind in database workspace artifacts; do
    artifact_path="$(backup_artifact_path_for_kind "$backup_path" "$backup_id" "$kind" || true)"
    if [[ -z "$artifact_path" ]]; then
      continue
    fi
    if ! validate_backup_artifact_file "$artifact_path" "$kind" "$purpose"; then
      return 1
    fi
    if ! checksum_manifest_covers_artifact "$manifest_path" "$artifact_path"; then
      set_validation_error "backup checksums artifact must include the SHA-256 for $kind artifact with backup_id=$backup_id for $purpose"
      return 1
    fi
  done
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

validate_backup_restore_drill_evidence_archive() {
  local source_path="$1"
  local marker
  local backup_id
  local backup_dir
  local backup_path
  local completed_at
  local completed_epoch
  local mtime
  local max_age_days
  local max_age_seconds
  local now
  local age_seconds

  for marker in restore_drill_status database_restore workspace_restore artifact_restore checksum_verification; do
    if ! evidence_marker_present "$source_path" "$marker"; then
      set_validation_error "SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE is missing $marker=pass"
      return 1
    fi
  done

  backup_id="$(evidence_value "$source_path" "backup_id")"
  if [[ -z "$backup_id" ]]; then
    set_validation_error "SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE is missing backup_id"
    return 1
  fi
  if ! is_safe_backup_id "$backup_id"; then
    set_validation_error "SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE backup_id has an unsafe artifact id format"
    return 1
  fi

  backup_dir="$(config_value SOURCELENS_BACKUP_DIR)"
  if [[ -z "$backup_dir" ]]; then
    set_validation_error "SOURCELENS_BACKUP_DIR is required to validate backup restore drill evidence"
    return 1
  fi
  backup_path="$(resolve_path "$backup_dir")"
  if ! validate_backup_directory_boundary "$backup_path" "backup restore drill evidence"; then
    return 1
  fi
  if ! backup_artifact_any_found "$backup_path" "$backup_id"; then
    set_validation_error "SOURCELENS_BACKUP_DIR does not contain artifacts matching restore drill backup_id=$backup_id"
    return 1
  fi
  if ! validate_backup_artifact_set "$backup_path" "$backup_id" "backup restore drill evidence"; then
    return 1
  fi

  max_age_days="$(config_value SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS)"
  max_age_days="${max_age_days:-7}"
  if [[ ! "$max_age_days" =~ ^[1-9][0-9]*$ ]]; then
    set_validation_error "SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS must be a positive integer"
    return 1
  fi

  completed_at="$(evidence_value "$source_path" "restore_drill_completed_at")"
  if [[ -z "$completed_at" ]]; then
    set_validation_error "SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE is missing restore_drill_completed_at"
    return 1
  fi
  if [[ ! "$completed_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
    set_validation_error "restore_drill_completed_at must use UTC ISO-8601 format"
    return 1
  fi
  if ! completed_epoch="$(iso8601_utc_to_epoch "$completed_at")"; then
    set_validation_error "restore_drill_completed_at could not be parsed as UTC time"
    return 1
  fi
  now="$(date +%s)"
  max_age_seconds=$((max_age_days * 86400))
  age_seconds=$((now - completed_epoch))
  if (( age_seconds < 0 )); then
    set_validation_error "restore_drill_completed_at must not be in the future"
    return 1
  fi
  if (( age_seconds > max_age_seconds )); then
    set_validation_error "restore_drill_completed_at is older than SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS=$max_age_days"
    return 1
  fi
  if ! mtime="$(file_mtime_epoch "$source_path")"; then
    set_validation_error "restore drill evidence file modification time could not be inspected with stat"
    return 1
  fi
  age_seconds=$((now - mtime))
  if (( age_seconds < 0 )); then
    set_validation_error "restore drill evidence file modification time must not be in the future"
    return 1
  fi
  if (( age_seconds > max_age_seconds )); then
    set_validation_error "restore drill evidence file is older than SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS=$max_age_days"
    return 1
  fi
}

validate_rollback_plan_archive() {
  local source_path="$1"
  local target_ref
  local backup_id
  local backup_dir
  local backup_path
  local max_age_days
  local max_age_seconds
  local mtime
  local now
  local age_seconds

  target_ref="$(config_value SOURCELENS_ROLLBACK_TARGET_REF)"
  backup_id="$(config_value SOURCELENS_ROLLBACK_BACKUP_ID)"
  if [[ -z "$target_ref" ]]; then
    set_validation_error "SOURCELENS_ROLLBACK_TARGET_REF is required to validate rollback plan archival"
    return 1
  fi
  if [[ -z "$backup_id" ]]; then
    set_validation_error "SOURCELENS_ROLLBACK_BACKUP_ID is required to validate rollback plan archival"
    return 1
  fi
  if ! is_safe_backup_id "$backup_id"; then
    set_validation_error "SOURCELENS_ROLLBACK_BACKUP_ID has an unsafe artifact id format"
    return 1
  fi
  if ! grep -Fq "$target_ref" "$source_path"; then
    set_validation_error "SOURCELENS_ROLLBACK_PLAN_FILE must reference SOURCELENS_ROLLBACK_TARGET_REF"
    return 1
  fi
  if ! grep -Fq "$backup_id" "$source_path"; then
    set_validation_error "SOURCELENS_ROLLBACK_PLAN_FILE must reference SOURCELENS_ROLLBACK_BACKUP_ID"
    return 1
  fi

  backup_dir="$(config_value SOURCELENS_BACKUP_DIR)"
  if [[ -z "$backup_dir" ]]; then
    set_validation_error "SOURCELENS_BACKUP_DIR is required to validate rollback plan archival"
    return 1
  fi
  backup_path="$(resolve_path "$backup_dir")"
  if ! validate_backup_directory_boundary "$backup_path" "rollback plan archival"; then
    return 1
  fi
  if ! validate_backup_artifact_set "$backup_path" "$backup_id" "rollback plan archival"; then
    return 1
  fi

  max_age_days="$(config_value SOURCELENS_ROLLBACK_PLAN_MAX_AGE_DAYS)"
  max_age_days="${max_age_days:-7}"
  if [[ ! "$max_age_days" =~ ^[1-9][0-9]*$ ]]; then
    set_validation_error "SOURCELENS_ROLLBACK_PLAN_MAX_AGE_DAYS must be a positive integer"
    return 1
  fi
  if ! mtime="$(file_mtime_epoch "$source_path")"; then
    set_validation_error "SOURCELENS_ROLLBACK_PLAN_FILE modification time could not be inspected with stat"
    return 1
  fi
  now="$(date +%s)"
  max_age_seconds=$((max_age_days * 86400))
  age_seconds=$((now - mtime))
  if (( age_seconds < 0 )); then
    set_validation_error "SOURCELENS_ROLLBACK_PLAN_FILE modification time must not be in the future"
    return 1
  fi
  if (( age_seconds > max_age_seconds )); then
    set_validation_error "SOURCELENS_ROLLBACK_PLAN_FILE is older than SOURCELENS_ROLLBACK_PLAN_MAX_AGE_DAYS=$max_age_days"
    return 1
  fi
}

archive_configured_evidence_file() {
  local title="$1"
  local slug="$2"
  local config_key="$3"
  local dest_name="$4"
  local validator="${5:-}"
  local configured_file
  local source_path
  local copied_file
  local mode
  local numeric_mode
  configured_file="$(normalize_config_value "$(config_value "$config_key")")"
  if [[ -z "$configured_file" ]]; then
    record_skip "$title" "$slug" "$config_key is not configured"
    return
  fi
  source_path="$(resolve_path "$configured_file")"
  if [[ -L "$source_path" ]]; then
    record_required_missing "$title" "$slug" "$config_key must not point to a symlink: $configured_file"
    return
  fi
  if [[ ! -f "$source_path" ]]; then
    record_required_missing "$title" "$slug" "$config_key does not point to a regular file: $configured_file"
    return
  fi
  if [[ ! -s "$source_path" ]]; then
    record_required_missing "$title" "$slug" "$config_key points to an empty file: $configured_file"
    return
  fi
  if [[ ! -r "$source_path" ]]; then
    record_required_missing "$title" "$slug" "$config_key is not readable by the release user: $configured_file"
    return
  fi
  if ! mode="$(file_mode "$source_path")"; then
    record_required_missing "$title" "$slug" "$config_key permissions could not be inspected before archival: $configured_file"
    return
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    record_required_missing "$title" "$slug" "$config_key permissions could not be parsed before archival (mode $mode): $configured_file"
    return
  fi
  numeric_mode=$((8#$mode))
  if (( (numeric_mode & 8#022) != 0 )); then
    record_required_missing "$title" "$slug" "$config_key must not be group/world writable before archival (current mode $mode)"
    return
  fi
  if [[ -n "$validator" ]]; then
    VALIDATION_ERROR=""
    if ! "$validator" "$source_path"; then
      record_required_missing "$title" "$slug" "${VALIDATION_ERROR:-$config_key failed release evidence validation}"
      return
    fi
  fi

  copied_file="${RUN_DIR}/${dest_name}"
  if cp "$source_path" "$copied_file"; then
    chmod 600 "$copied_file"
    sanitize_log_file "$copied_file"
    record_status "OK" "$title" "$slug" "0" "$dest_name" "copied and sanitized from $config_key"
  else
    record_required_missing "$title" "$slug" "$config_key could not be copied into the release evidence directory"
  fi
}

validate_run_id() {
  RUN_ID="$(normalize_config_value "$RUN_ID")"
  if (( ${#RUN_ID} == 0 || ${#RUN_ID} > RUN_ID_MAX_CHARS )); then
    echo "SOURCELENS_RELEASE_EVIDENCE_RUN_ID must be 1-${RUN_ID_MAX_CHARS} characters" >&2
    exit 1
  fi
  if [[ "$RUN_ID" == "." || "$RUN_ID" == ".." ]]; then
    echo "SOURCELENS_RELEASE_EVIDENCE_RUN_ID must not be . or .." >&2
    exit 1
  fi
  [[ "$RUN_ID" =~ ^[A-Za-z0-9._-]+$ ]] || {
    echo "SOURCELENS_RELEASE_EVIDENCE_RUN_ID may only contain letters, numbers, dot, underscore and dash" >&2
    exit 1
  }
}

ensure_evidence_root() {
  local evidence_root="$1"
  local mode
  local numeric_mode
  if [[ -L "$evidence_root" ]]; then
    echo "SOURCELENS_RELEASE_EVIDENCE_DIR must not be a symlink: $evidence_root" >&2
    exit 1
  fi
  if [[ -e "$evidence_root" && ! -d "$evidence_root" ]]; then
    echo "SOURCELENS_RELEASE_EVIDENCE_DIR must be a directory: $evidence_root" >&2
    exit 1
  fi
  if [[ ! -e "$evidence_root" ]]; then
    mkdir -p "$evidence_root"
    chmod 700 "$evidence_root"
  fi
  if ! mode="$(file_mode "$evidence_root")"; then
    echo "SOURCELENS_RELEASE_EVIDENCE_DIR permissions could not be inspected: $evidence_root" >&2
    exit 1
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    echo "SOURCELENS_RELEASE_EVIDENCE_DIR permissions could not be parsed: $mode" >&2
    exit 1
  fi
  numeric_mode=$((8#$mode))
  if (( (numeric_mode & 8#077) != 0 )); then
    echo "SOURCELENS_RELEASE_EVIDENCE_DIR permissions must not grant group/world access (current mode $mode)" >&2
    echo "Run: chmod 700 $evidence_root" >&2
    exit 1
  fi
}

validate_env_file_boundary() {
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
    echo "SOURCELENS_RELEASE_EVIDENCE_ENV_FILE must not point to a symlink: $ENV_FILE" >&2
    exit 1
  fi
  if [[ ! -e "$selected_path" ]]; then
    return
  fi
  if [[ ! -f "$selected_path" ]]; then
    echo "SOURCELENS_RELEASE_EVIDENCE_ENV_FILE must point to a regular deployment env file: $ENV_FILE" >&2
    exit 1
  fi
  if [[ ! -s "$selected_path" ]]; then
    echo "SOURCELENS_RELEASE_EVIDENCE_ENV_FILE must not point to an empty file: $ENV_FILE" >&2
    exit 1
  fi
  if [[ ! -r "$selected_path" ]]; then
    echo "SOURCELENS_RELEASE_EVIDENCE_ENV_FILE must be readable by the release evidence user: $ENV_FILE" >&2
    exit 1
  fi
  if ! mode="$(file_mode "$selected_path")"; then
    echo "SOURCELENS_RELEASE_EVIDENCE_ENV_FILE permissions could not be inspected: $ENV_FILE" >&2
    exit 1
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    echo "SOURCELENS_RELEASE_EVIDENCE_ENV_FILE permissions could not be parsed: $mode" >&2
    exit 1
  fi

  numeric_mode=$((8#$mode))
  if (( (numeric_mode & 8#077) != 0 )); then
    echo "SOURCELENS_RELEASE_EVIDENCE_ENV_FILE permissions must not grant group/world access; run chmod 600 $ENV_FILE (current mode $mode)" >&2
    exit 1
  fi
}

init_output() {
  local evidence_root
  evidence_root="$(resolve_path "$(normalize_config_value "$EVIDENCE_DIR")")"
  ensure_evidence_root "$evidence_root"
  RUN_DIR="${evidence_root}/${RUN_ID}"
  SUMMARY_FILE="${RUN_DIR}/summary.md"
  STATUS_FILE="${RUN_DIR}/status.tsv"
  if [[ -e "$RUN_DIR" || -L "$RUN_DIR" ]]; then
    echo "release evidence run directory already exists: $RUN_DIR" >&2
    exit 1
  fi
  mkdir "$RUN_DIR"
  chmod 700 "$RUN_DIR"
  {
    printf '# SourceLens Release Evidence\n\n'
    printf '%s\n' "- run_id: \`${RUN_ID}\`"
    printf '%s\n' "- created_at: \`${CREATED_AT}\`"
    printf '%s\n' "- env_file: \`${ENV_FILE}\`"
    printf '%s\n\n' "- evidence_dir: \`${RUN_DIR}\`"
    printf '## Steps\n'
  } > "$SUMMARY_FILE"
  printf 'status\tslug\texit_code\tlog_file\tdetail\n' > "$STATUS_FILE"
}

write_git_metadata() {
  local manifest_llm_provider_run_file
  local manifest_llm_raw_output_dir
  manifest_llm_provider_run_file="$(sanitize_manifest_metadata_value "$LLM_PROVIDER_RUN_FILE")"
  manifest_llm_raw_output_dir="$(sanitize_manifest_metadata_value "$LLM_RAW_OUTPUT_DIR")"
  {
    printf 'run_id: %s\n' "$RUN_ID"
    printf 'created_at: %s\n' "$CREATED_AT"
    printf 'release_evidence_profile_schema: %s\n' "$RELEASE_EVIDENCE_PROFILE_SCHEMA_VERSION"
    printf 'release_evidence_profile: %s\n' "$RELEASE_EVIDENCE_PROFILE"
    printf 'release_evidence_profile_source: %s\n' "$RELEASE_EVIDENCE_PROFILE_SOURCE"
    printf 'root_dir: %s\n' "$ROOT_DIR"
    printf 'env_file: %s\n' "$ENV_FILE"
    printf 'include_verify: %s\n' "$INCLUDE_VERIFY"
    printf 'include_preflight: %s\n' "$INCLUDE_PREFLIGHT"
    printf 'include_smoke: %s\n' "$INCLUDE_SMOKE"
    printf 'include_public_repo_smoke: %s\n' "$INCLUDE_PUBLIC_REPO_SMOKE"
    printf 'public_repo_smoke_ui: %s\n' "$(bool_env_value "$PUBLIC_REPO_SMOKE_UI")"
    printf 'public_repo_report_evidence_qa_citation: %s\n' "$PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION"
    printf 'public_repo_source_location_probes_required: %s\n' "$PUBLIC_REPO_SOURCE_LOCATION_PROBES_REQUIRED"
    printf 'include_file_bound_repair_smoke: %s\n' "$INCLUDE_FILE_BOUND_REPAIR_SMOKE"
    printf 'include_autorepair_patch_smoke: %s\n' "$INCLUDE_AUTOREPAIR_PATCH_SMOKE"
    printf 'include_patch_ready_ui_smoke: %s\n' "$INCLUDE_PATCH_READY_UI_SMOKE"
    printf 'include_dashboard_next_action_ui_smoke: %s\n' "$INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE"
    printf 'include_report_evidence_drawer_ui_smoke: %s\n' "$INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE"
    printf 'include_scan_governance_timeline_ui_smoke: %s\n' "$INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE"
    printf 'include_agent_chat_audit_ui_smoke: %s\n' "$INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE"
    printf 'include_agent_chat_closure_rail_ui_smoke: %s\n' "$INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE"
    printf 'include_agent_chat_tool_audit_smoke: %s\n' "$INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE"
    printf 'include_audit_workbench_smoke: %s\n' "$INCLUDE_AUDIT_WORKBENCH_SMOKE"
    printf 'include_phase12: %s\n' "$INCLUDE_PHASE12"
    printf 'include_sandbox_drill: %s\n' "$INCLUDE_SANDBOX_DRILL"
    printf 'include_github_app_drill: %s\n' "$INCLUDE_GITHUB_APP_DRILL"
    printf 'include_github_webhook_drill: %s\n' "$INCLUDE_GITHUB_WEBHOOK_DRILL"
    printf 'include_llm_provider_run: %s\n' "$INCLUDE_LLM_PROVIDER_RUN"
    printf 'worktree_inventory_strict: %s\n' "$WORKTREE_INVENTORY_STRICT"
    printf 'audit_workbench_smoke_require_samples: %s\n' "$(bool_env_value "$AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES")"
    printf 'llm_provider_run_file: %s\n' "$manifest_llm_provider_run_file"
    printf 'llm_raw_output_dir: %s\n' "$manifest_llm_raw_output_dir"
    printf 'git_head: '
    git rev-parse HEAD 2>/dev/null || printf 'unavailable\n'
  } > "${RUN_DIR}/manifest.txt"
  local git_status_output
  local git_diff_output
  git_status_output=$(cd "$ROOT_DIR" && git status --short 2>&1) || git_status_output=""
  if [[ -z "$git_status_output" ]]; then
    printf 'working tree clean\n' > "${RUN_DIR}/git-status.txt"
  else
    printf '%s\n' "$git_status_output" > "${RUN_DIR}/git-status.txt"
  fi

  git_diff_output=$(cd "$ROOT_DIR" && git diff --stat 2>&1) || git_diff_output=""
  if [[ -z "$git_diff_output" ]]; then
    printf 'no changes\n' > "${RUN_DIR}/git-diff-stat.txt"
  else
    printf '%s\n' "$git_diff_output" > "${RUN_DIR}/git-diff-stat.txt"
  fi
  record_status "OK" "Git metadata snapshot" "git-metadata" "0" "manifest.txt" "manifest, status and diff stat captured"
}

write_worktree_inventory() {
  local inventory_file="${RUN_DIR}/worktree-inventory.md"
  local exit_code
  set +e
  (cd "$ROOT_DIR" && env SOURCELENS_WORKTREE_INVENTORY_STRICT="$WORKTREE_INVENTORY_STRICT" ./scripts/worktree-inventory.sh) > "$inventory_file" 2>&1
  exit_code=$?
  set -e
  sanitize_log_file "$inventory_file"
  if [[ "$exit_code" == "0" ]]; then
    record_status "OK" "Worktree inventory snapshot" "worktree-inventory" "$exit_code" "$(basename "$inventory_file")" "worktree inventory captured; strict=$WORKTREE_INVENTORY_STRICT"
  elif is_true "$WORKTREE_INVENTORY_STRICT"; then
    failures=$((failures + 1))
    record_status "FAIL" "Worktree inventory snapshot" "worktree-inventory" "$exit_code" "$(basename "$inventory_file")" "strict worktree inventory failed"
  else
    warnings=$((warnings + 1))
    record_status "WARN" "Worktree inventory snapshot" "worktree-inventory" "$exit_code" "$(basename "$inventory_file")" "non-strict worktree inventory failed"
  fi
}

run_preflights() {
  local preflight_static_gates
  preflight_static_gates="true"
  if is_true "$INCLUDE_VERIFY"; then
    preflight_static_gates="false"
  fi
  run_step \
    "Production preflight (warn-only)" \
    "prod-preflight" \
    true \
    env SOURCELENS_PREFLIGHT_ENV_FILE="$ENV_FILE" SOURCELENS_PREFLIGHT_WARN_ONLY=true SOURCELENS_PREFLIGHT_INCLUDE_STATIC_GATES="$preflight_static_gates" ./scripts/production-preflight.sh
  run_step \
    "Backup/restore preflight (warn-only)" \
    "backup-preflight" \
    true \
    env SOURCELENS_BACKUP_PREFLIGHT_ENV_FILE="$ENV_FILE" SOURCELENS_BACKUP_PREFLIGHT_WARN_ONLY=true ./scripts/backup-restore-preflight.sh
  run_step \
    "Rollback preflight (warn-only)" \
    "rollback-preflight" \
    true \
    env SOURCELENS_ROLLBACK_PREFLIGHT_ENV_FILE="$ENV_FILE" SOURCELENS_ROLLBACK_PREFLIGHT_WARN_ONLY=true ./scripts/rollback-preflight.sh
}

archive_release_input_evidence() {
  archive_configured_evidence_file \
    "Backup/restore drill evidence file" \
    "backup-restore-drill-evidence" \
    "SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE" \
    "backup-restore-drill-evidence.txt" \
    validate_backup_restore_drill_evidence_archive
  archive_configured_evidence_file \
    "Rollback plan file" \
    "rollback-plan" \
    "SOURCELENS_ROLLBACK_PLAN_FILE" \
    "rollback-plan.txt" \
    validate_rollback_plan_archive
}

run_smoke_if_available() {
  local base_url
  base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
  if is_false "$INCLUDE_SMOKE"; then
    record_skip "Smoke test" "smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false"
    return
  fi
  if [[ -z "$base_url" ]]; then
    if mode_required "$INCLUDE_SMOKE"; then
      record_required_missing "Smoke test" "smoke" "SOURCELENS_BASE_URL is required when SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=true"
    else
      record_skip "Smoke test" "smoke" "SOURCELENS_BASE_URL is not configured"
    fi
    return
  fi
  run_step \
    "Smoke test" \
    "smoke" \
    true \
    env SOURCELENS_SMOKE_ENV_FILE="$ENV_FILE" ./scripts/smoke-test.sh
}

run_public_repo_smoke_if_available() {
  local base_url
  base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
  if is_false "$INCLUDE_PUBLIC_REPO_SMOKE"; then
    record_skip "Public repo analysis smoke" "public-repo-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=false"
    return
  fi
  if [[ -z "$base_url" ]]; then
    if mode_required "$INCLUDE_PUBLIC_REPO_SMOKE"; then
      record_required_missing "Public repo analysis smoke" "public-repo-smoke" "SOURCELENS_BASE_URL is required when SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=true"
    else
      record_skip "Public repo analysis smoke" "public-repo-smoke" "SOURCELENS_BASE_URL is not configured"
    fi
    return
  fi
  run_step \
    "Public repo analysis smoke" \
    "public-repo-smoke" \
    true \
    env SOURCELENS_BASE_URL="$base_url" SOURCELENS_PUBLIC_REPO_SMOKE_UI="$(bool_env_value "$PUBLIC_REPO_SMOKE_UI")" SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION="$(normalize_config_value "$PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION")" SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP="$(public_repo_smoke_cleanup_value)" ./scripts/public-repo-analysis-smoke.sh
}

run_file_bound_repair_smoke_if_available() {
  local base_url
  base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
  if is_false "$INCLUDE_FILE_BOUND_REPAIR_SMOKE"; then
    record_skip "File-bound repair smoke" "file-bound-repair-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE=false"
    return
  fi
  if [[ -z "$base_url" ]]; then
    if mode_required "$INCLUDE_FILE_BOUND_REPAIR_SMOKE"; then
      record_required_missing "File-bound repair smoke" "file-bound-repair-smoke" "SOURCELENS_BASE_URL is required when SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE=true"
    else
      record_skip "File-bound repair smoke" "file-bound-repair-smoke" "SOURCELENS_BASE_URL is not configured"
    fi
    return
  fi
  run_step \
    "File-bound repair smoke" \
    "file-bound-repair-smoke" \
    true \
    env SOURCELENS_BASE_URL="$base_url" ./scripts/file-bound-repair-smoke.sh
}

run_autorepair_patch_smoke_if_available() {
  local base_url
  base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
  if is_false "$INCLUDE_AUTOREPAIR_PATCH_SMOKE"; then
    record_skip "AutoRepair patch readiness smoke" "autorepair-patch-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE=false"
    return
  fi
  if [[ -z "$base_url" ]]; then
    if mode_required "$INCLUDE_AUTOREPAIR_PATCH_SMOKE"; then
      record_required_missing "AutoRepair patch readiness smoke" "autorepair-patch-smoke" "SOURCELENS_BASE_URL is required when SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE=true"
    else
      record_skip "AutoRepair patch readiness smoke" "autorepair-patch-smoke" "SOURCELENS_BASE_URL is not configured"
    fi
    return
  fi
  run_step \
    "AutoRepair patch readiness smoke" \
    "autorepair-patch-smoke" \
    true \
    env SOURCELENS_BASE_URL="$base_url" ./scripts/autorepair-patch-smoke.sh
}

playwright_smoke_available() {
  local config_file="$1"
  local spec_file="$2"
  local local_playwright="${ROOT_DIR}/web-console/node_modules/.bin/playwright"
  command -v node >/dev/null 2>&1 || return 1
  [[ -f "${ROOT_DIR}/web-console/package.json" ]] || return 1
  [[ -f "${ROOT_DIR}/web-console/${config_file}" ]] || return 1
  [[ -f "${ROOT_DIR}/web-console/${spec_file}" ]] || return 1
  if [[ -x "$local_playwright" ]]; then
    (cd "${ROOT_DIR}/web-console" && "$local_playwright" --version >/dev/null 2>&1)
    return
  fi
  command -v npm >/dev/null 2>&1 || return 1
  (cd "${ROOT_DIR}/web-console" && run_command_with_timeout "$PLAYWRIGHT_VERSION_TIMEOUT_SECONDS" npm exec -- playwright --version >/dev/null 2>&1)
}

patch_ready_ui_smoke_available() {
  playwright_smoke_available \
    playwright.patch-ready.config.ts \
    tests/patch-ready-smoke.spec.ts
}

run_patch_ready_ui_smoke_if_available() {
  if is_false "$INCLUDE_PATCH_READY_UI_SMOKE"; then
    record_skip "PATCH_READY browser UI smoke (mocked)" "patch-ready-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PATCH_READY_UI_SMOKE=false"
    return
  fi
  if ! patch_ready_ui_smoke_available; then
    if mode_required "$INCLUDE_PATCH_READY_UI_SMOKE"; then
      run_step "PATCH_READY browser UI smoke (mocked)" "patch-ready-ui-smoke" true \
        bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; make patch-ready-ui-smoke'
    else
      record_skip "PATCH_READY browser UI smoke (mocked)" "patch-ready-ui-smoke" "node/npm or Playwright browser smoke dependencies are not available"
    fi
    return
  fi
  run_step \
    "PATCH_READY browser UI smoke (mocked)" \
    "patch-ready-ui-smoke" \
    true \
    bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; make patch-ready-ui-smoke'
}

dashboard_next_action_ui_smoke_available() {
  playwright_smoke_available \
    playwright.dashboard-next-action.config.ts \
    tests/dashboard-next-action-smoke.spec.ts
}

run_dashboard_next_action_ui_smoke_if_available() {
  if is_false "$INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE"; then
    record_skip "Dashboard next action browser UI smoke (mocked)" "dashboard-next-action-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE=false"
    return
  fi
  if ! dashboard_next_action_ui_smoke_available; then
    if mode_required "$INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE"; then
      run_step "Dashboard next action browser UI smoke (mocked)" "dashboard-next-action-ui-smoke" true \
        bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; export SOURCELENS_DASHBOARD_NEXT_ACTION_UI_ARTIFACT_DIR="$1"; make dashboard-next-action-ui-smoke' _ "${RUN_DIR}/dashboard-next-action-ui-smoke"
    else
      record_skip "Dashboard next action browser UI smoke (mocked)" "dashboard-next-action-ui-smoke" "node/npm or Playwright browser smoke dependencies are not available"
    fi
    return
  fi
  run_step \
    "Dashboard next action browser UI smoke (mocked)" \
    "dashboard-next-action-ui-smoke" \
    true \
    bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; export SOURCELENS_DASHBOARD_NEXT_ACTION_UI_ARTIFACT_DIR="$1"; make dashboard-next-action-ui-smoke' _ "${RUN_DIR}/dashboard-next-action-ui-smoke"
}

report_evidence_drawer_ui_smoke_available() {
  playwright_smoke_available \
    playwright.report-evidence-drawer.config.ts \
    tests/report-evidence-drawer-smoke.spec.ts
}

run_report_evidence_drawer_ui_smoke_if_available() {
  if is_false "$INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE"; then
    record_skip "Report evidence drawer browser UI smoke (mocked)" "report-evidence-drawer-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE=false"
    return
  fi
  if ! report_evidence_drawer_ui_smoke_available; then
    if mode_required "$INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE"; then
      run_step "Report evidence drawer browser UI smoke (mocked)" "report-evidence-drawer-ui-smoke" true \
        bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; make report-evidence-drawer-ui-smoke'
    else
      record_skip "Report evidence drawer browser UI smoke (mocked)" "report-evidence-drawer-ui-smoke" "node/npm or Playwright browser smoke dependencies are not available"
    fi
    return
  fi
  run_step \
    "Report evidence drawer browser UI smoke (mocked)" \
    "report-evidence-drawer-ui-smoke" \
    true \
    bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; make report-evidence-drawer-ui-smoke'
}

scan_governance_timeline_ui_smoke_available() {
  playwright_smoke_available \
    playwright.scan-governance-timeline.config.ts \
    tests/scan-governance-timeline-smoke.spec.ts
}

run_scan_governance_timeline_ui_smoke_if_available() {
  if is_false "$INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE"; then
    record_skip "Scan governance timeline browser UI smoke (mocked)" "scan-governance-timeline-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE=false"
    return
  fi
  if ! scan_governance_timeline_ui_smoke_available; then
    if mode_required "$INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE"; then
      run_step "Scan governance timeline browser UI smoke (mocked)" "scan-governance-timeline-ui-smoke" true \
        bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; make scan-governance-timeline-ui-smoke'
    else
      record_skip "Scan governance timeline browser UI smoke (mocked)" "scan-governance-timeline-ui-smoke" "node/npm or Playwright browser smoke dependencies are not available"
    fi
    return
  fi
  run_step \
    "Scan governance timeline browser UI smoke (mocked)" \
    "scan-governance-timeline-ui-smoke" \
    true \
    bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; make scan-governance-timeline-ui-smoke'
}

agent_chat_audit_ui_smoke_available() {
  playwright_smoke_available \
    playwright.agent-chat-audit.config.ts \
    tests/agent-chat-audit-smoke.spec.ts
}

run_agent_chat_audit_ui_smoke_if_available() {
  if is_false "$INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE"; then
    record_skip "AgentChat audit browser UI smoke (mocked)" "agent-chat-audit-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE=false"
    return
  fi
  if ! agent_chat_audit_ui_smoke_available; then
    if mode_required "$INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE"; then
      run_step "AgentChat audit browser UI smoke (mocked)" "agent-chat-audit-ui-smoke" true \
        bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; make agent-chat-audit-ui-smoke'
    else
      record_skip "AgentChat audit browser UI smoke (mocked)" "agent-chat-audit-ui-smoke" "node/npm or Playwright browser smoke dependencies are not available"
    fi
    return
  fi
  run_step \
    "AgentChat audit browser UI smoke (mocked)" \
    "agent-chat-audit-ui-smoke" \
    true \
    bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; make agent-chat-audit-ui-smoke'
}

agent_chat_closure_rail_ui_smoke_available() {
  playwright_smoke_available \
    playwright.agent-chat-closure-rail.config.ts \
    tests/agent-chat-closure-rail-smoke.spec.ts
}

run_agent_chat_closure_rail_ui_smoke_if_available() {
  if is_false "$INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE"; then
    record_skip "AgentChat closure rail browser UI smoke (mocked)" "agent-chat-closure-rail-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE=false"
    return
  fi
  if ! agent_chat_closure_rail_ui_smoke_available; then
    if mode_required "$INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE"; then
      run_step "AgentChat closure rail browser UI smoke (mocked)" "agent-chat-closure-rail-ui-smoke" true \
        bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; make agent-chat-closure-rail-ui-smoke'
    else
      record_skip "AgentChat closure rail browser UI smoke (mocked)" "agent-chat-closure-rail-ui-smoke" "node/npm or Playwright browser smoke dependencies are not available"
    fi
    return
  fi
  run_step \
    "AgentChat closure rail browser UI smoke (mocked)" \
    "agent-chat-closure-rail-ui-smoke" \
    true \
    bash -c 'unset SL_UI_SMOKE_BASE_URL; export CI=true; make agent-chat-closure-rail-ui-smoke'
}

run_agent_chat_tool_audit_smoke_if_available() {
  local base_url
  base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
  if is_false "$INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE"; then
    record_skip "AgentChat tool audit backend smoke" "agent-chat-tool-audit-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE=false"
    return
  fi
  if [[ -z "$base_url" ]]; then
    if mode_required "$INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE"; then
      record_required_missing "AgentChat tool audit backend smoke" "agent-chat-tool-audit-smoke" "SOURCELENS_BASE_URL is required when SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE=true"
    else
      record_skip "AgentChat tool audit backend smoke" "agent-chat-tool-audit-smoke" "SOURCELENS_BASE_URL is not configured"
    fi
    return
  fi
  if ! is_loopback_base_url "$base_url"; then
    if mode_required "$INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE"; then
      record_required_missing "AgentChat tool audit backend smoke" "agent-chat-tool-audit-smoke" "SOURCELENS_BASE_URL must target localhost/127.0.0.1/::1 when SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE=true"
    else
      record_skip "AgentChat tool audit backend smoke" "agent-chat-tool-audit-smoke" "SOURCELENS_BASE_URL is not loopback; local-only smoke skipped"
    fi
    return
  fi
  run_step \
    "AgentChat tool audit backend smoke" \
    "agent-chat-tool-audit-smoke" \
    true \
    env SOURCELENS_BASE_URL="$base_url" ./scripts/agent-chat-tool-audit-smoke.sh
}

run_audit_workbench_smoke_if_available() {
  local base_url
  base_url="$(normalize_base_url "$(config_value SOURCELENS_BASE_URL)")"
  if is_false "$INCLUDE_AUDIT_WORKBENCH_SMOKE"; then
    record_skip "Audit workbench smoke" "audit-workbench-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE=false"
    return
  fi
  if [[ -z "$base_url" ]]; then
    if mode_required "$INCLUDE_AUDIT_WORKBENCH_SMOKE"; then
      record_required_missing "Audit workbench smoke" "audit-workbench-smoke" "SOURCELENS_BASE_URL is required when SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE=true"
    else
      record_skip "Audit workbench smoke" "audit-workbench-smoke" "SOURCELENS_BASE_URL is not configured"
    fi
    return
  fi
  run_step \
    "Audit workbench smoke" \
    "audit-workbench-smoke" \
    true \
    env SOURCELENS_BASE_URL="$base_url" SOURCELENS_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES="$(bool_env_value "$AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES")" ./scripts/audit-workbench-smoke.sh
}

run_phase12_if_available() {
  local db_url
  local db_username
  local db_password
  db_url="$(config_value DB_URL)"
  db_username="$(config_value DB_USERNAME)"
  if [[ -z "$db_username" ]]; then
    db_username="$(config_value MYSQL_USER)"
  fi
  db_password="$(config_value DB_PASSWORD)"
  if [[ -z "$db_password" ]]; then
    db_password="$(config_value MYSQL_PWD)"
  fi
  if is_false "$INCLUDE_PHASE12"; then
    record_skip "Phase 12 baseline" "phase12-baseline" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12=false"
    return
  fi
  if mode_required "$INCLUDE_PHASE12"; then
    run_step "Phase 12 baseline" "phase12-baseline" true \
      env SOURCELENS_PHASE12_BASELINE_ENV_FILE="$ENV_FILE" ./scripts/phase12-baseline.sh
    return
  fi
  if command -v mysql >/dev/null 2>&1; then
    if [[ -z "$db_url" || -z "$db_username" || -z "$db_password" ]]; then
      record_skip "Phase 12 baseline" "phase12-baseline" "DB_URL/DB_USERNAME/DB_PASSWORD are not fully configured for host mysql"
      return
    fi
  elif ! docker_mysql_available_for_phase12; then
    record_skip "Phase 12 baseline" "phase12-baseline" "mysql CLI and Docker MySQL container are not available"
    return
  fi
  run_step \
    "Phase 12 baseline" \
    "phase12-baseline" \
    true \
    env SOURCELENS_PHASE12_BASELINE_ENV_FILE="$ENV_FILE" ./scripts/phase12-baseline.sh
}

run_sandbox_drill_if_available() {
  if is_false "$INCLUDE_SANDBOX_DRILL"; then
    record_skip "Docker sandbox drill" "sandbox-drill" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL=false"
    return
  fi
  if ! command -v docker >/dev/null 2>&1; then
    if mode_required "$INCLUDE_SANDBOX_DRILL"; then
      run_step "Docker sandbox drill" "sandbox-drill" true \
        env SOURCELENS_SANDBOX_DRILL_ENV_FILE="$ENV_FILE" ./scripts/sandbox-drill.sh
    else
      record_skip "Docker sandbox drill" "sandbox-drill" "docker CLI is not available"
    fi
    return
  fi
  if ! docker info >/dev/null 2>&1; then
    if mode_required "$INCLUDE_SANDBOX_DRILL"; then
      run_step "Docker sandbox drill" "sandbox-drill" true \
        env SOURCELENS_SANDBOX_DRILL_ENV_FILE="$ENV_FILE" ./scripts/sandbox-drill.sh
    else
      record_skip "Docker sandbox drill" "sandbox-drill" "Docker daemon is not reachable"
    fi
    return
  fi
  run_step \
    "Docker sandbox drill" \
    "sandbox-drill" \
    true \
    env SOURCELENS_SANDBOX_DRILL_ENV_FILE="$ENV_FILE" ./scripts/sandbox-drill.sh
}

github_app_drill_configured() {
  [[ -n "$(config_value GITHUB_APP_ID)" ]] \
    && [[ -n "$(config_value GITHUB_APP_PRIVATE_KEY_PEM)" ]] \
    && [[ -n "$(config_value GITHUB_APP_WEBHOOK_SECRET)" ]] \
    && { [[ -n "$(config_value SOURCELENS_GITHUB_APP_DRILL_INSTALLATION_ID)" ]] || [[ -n "$(config_value GITHUB_APP_INSTALLATION_ID)" ]]; } \
    && [[ -n "$(config_value SOURCELENS_GITHUB_APP_DRILL_REPOSITORY)" ]]
}

run_github_app_drill_if_available() {
  if is_false "$INCLUDE_GITHUB_APP_DRILL"; then
    record_skip "GitHub App read-only drill" "github-app-drill" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL=false"
    return
  fi
  if ! github_app_drill_configured; then
    if mode_required "$INCLUDE_GITHUB_APP_DRILL"; then
      run_step "GitHub App read-only drill" "github-app-drill" true \
        env SOURCELENS_GITHUB_APP_DRILL_ENV_FILE="$ENV_FILE" ./scripts/github-app-drill.sh
    else
      record_skip "GitHub App read-only drill" "github-app-drill" "GitHub App drill variables are not fully configured"
    fi
    return
  fi
  if ! external_drills_allowed; then
    record_skip "GitHub App read-only drill" "github-app-drill" "SOURCELENS_RELEASE_EVIDENCE_ALLOW_EXTERNAL_DRILLS=true is required to run auto GitHub App drill outside local profile"
    return
  fi
  if ! command -v curl >/dev/null 2>&1 || ! command -v openssl >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
    if mode_required "$INCLUDE_GITHUB_APP_DRILL"; then
      run_step "GitHub App read-only drill" "github-app-drill" true \
        env SOURCELENS_GITHUB_APP_DRILL_ENV_FILE="$ENV_FILE" ./scripts/github-app-drill.sh
    else
      record_skip "GitHub App read-only drill" "github-app-drill" "curl, openssl or node is unavailable"
    fi
    return
  fi
  run_step \
    "GitHub App read-only drill" \
    "github-app-drill" \
    true \
    env SOURCELENS_GITHUB_APP_DRILL_ENV_FILE="$ENV_FILE" ./scripts/github-app-drill.sh
}

github_webhook_drill_configured() {
  [[ -n "$(config_value SOURCELENS_BASE_URL)" ]] \
    && [[ -n "$(config_value GITHUB_APP_WEBHOOK_SECRET)" ]]
}

run_github_webhook_drill_if_available() {
  if is_false "$INCLUDE_GITHUB_WEBHOOK_DRILL"; then
    record_skip "GitHub webhook drill" "github-webhook-drill" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL=false"
    return
  fi
  if ! github_webhook_drill_configured; then
    if mode_required "$INCLUDE_GITHUB_WEBHOOK_DRILL"; then
      run_step "GitHub webhook drill" "github-webhook-drill" true \
        env SOURCELENS_GITHUB_WEBHOOK_DRILL_ENV_FILE="$ENV_FILE" ./scripts/github-webhook-drill.sh
    else
      record_skip "GitHub webhook drill" "github-webhook-drill" "SOURCELENS_BASE_URL or GITHUB_APP_WEBHOOK_SECRET is not configured"
    fi
    return
  fi
  if ! external_drills_allowed; then
    record_skip "GitHub webhook drill" "github-webhook-drill" "SOURCELENS_RELEASE_EVIDENCE_ALLOW_EXTERNAL_DRILLS=true is required to run auto GitHub webhook drill outside local profile"
    return
  fi
  if ! command -v curl >/dev/null 2>&1 || ! command -v openssl >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
    if mode_required "$INCLUDE_GITHUB_WEBHOOK_DRILL"; then
      run_step "GitHub webhook drill" "github-webhook-drill" true \
        env SOURCELENS_GITHUB_WEBHOOK_DRILL_ENV_FILE="$ENV_FILE" ./scripts/github-webhook-drill.sh
    else
      record_skip "GitHub webhook drill" "github-webhook-drill" "curl, openssl or node is unavailable"
    fi
    return
  fi
  run_step \
    "GitHub webhook drill" \
    "github-webhook-drill" \
    true \
    env SOURCELENS_GITHUB_WEBHOOK_DRILL_ENV_FILE="$ENV_FILE" ./scripts/github-webhook-drill.sh
}

copy_llm_provider_raw_outputs() {
  local run_file="$1"
  local log_file="$2"
  local configured_dir
  local source_dir
  local artifacts_file
  local artifact_path
  local relative_target
  local source_file
  local target_file
  local target_dir
  local mode
  local numeric_mode

  configured_dir="$(normalize_config_value "$LLM_RAW_OUTPUT_DIR")"
  if [[ -z "$configured_dir" ]]; then
    printf 'raw_output_error: SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR is required when SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE is configured\n' >> "$log_file"
    return 1
  fi
  source_dir="$(resolve_path "$configured_dir")"
  if [[ -L "$source_dir" ]]; then
    printf 'raw_output_error: SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR must not point to a symlink: %s\n' "$configured_dir" >> "$log_file"
    return 1
  fi
  if [[ ! -d "$source_dir" ]]; then
    printf 'raw_output_error: SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR must point to a directory: %s\n' "$configured_dir" >> "$log_file"
    return 1
  fi
  if [[ ! -r "$source_dir" || ! -x "$source_dir" ]]; then
    printf 'raw_output_error: SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR must be readable and searchable: %s\n' "$configured_dir" >> "$log_file"
    return 1
  fi
  if ! mode="$(file_mode "$source_dir")"; then
    printf 'raw_output_error: SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR permissions could not be inspected: %s\n' "$configured_dir" >> "$log_file"
    return 1
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    printf 'raw_output_error: SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR permissions could not be parsed (mode %s): %s\n' "$mode" "$configured_dir" >> "$log_file"
    return 1
  fi
  numeric_mode=$((8#$mode))
  if (( (numeric_mode & 8#077) != 0 )); then
    printf 'raw_output_error: SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR must not grant group/world access; run chmod 700 %s (current mode %s)\n' "$configured_dir" "$mode" >> "$log_file"
    return 1
  fi

  artifacts_file="$(mktemp "${TMPDIR:-/tmp}/sourcelens-llm-provider-artifacts.XXXXXX")" || {
    printf 'raw_output_error: could not create temporary artifact list\n' >> "$log_file"
    return 1
  }
  chmod 600 "$artifacts_file" || true
  if ! (
    cd "$ROOT_DIR" && node scripts/validate-llm-provider-run.mjs \
      "$run_file" \
      docs/llm-safety-evals/prompt-injection-cases.json \
      docs/llm-safety-evals/output-quality-cases.json \
      --run-id "$RUN_ID" \
      --print-artifacts
  ) > "$artifacts_file" 2>> "$log_file"; then
    printf 'raw_output_error: provider run rawOutputArtifact paths must match release evidence run id %s\n' "$RUN_ID" >> "$log_file"
    rm -f "$artifacts_file"
    return 1
  fi

  while IFS= read -r artifact_path; do
    [[ -n "$artifact_path" ]] || continue
    relative_target="${artifact_path#release-evidence/${RUN_ID}/}"
    if [[ "$relative_target" == "$artifact_path" || "$relative_target" != llm-evals/* ]]; then
      printf 'raw_output_error: provider run rawOutputArtifact must point under release-evidence/%s/llm-evals/: %s\n' "$RUN_ID" "$artifact_path" >> "$log_file"
      rm -f "$artifacts_file"
      return 1
    fi
    source_file="${source_dir}/${relative_target}"
    if [[ -L "$source_file" ]]; then
      printf 'raw_output_error: raw output artifact source file must not be a symlink: %s\n' "$source_file" >> "$log_file"
      rm -f "$artifacts_file"
      return 1
    fi
    if [[ ! -f "$source_file" ]]; then
      printf 'raw_output_error: raw output artifact source file must exist: %s\n' "$source_file" >> "$log_file"
      rm -f "$artifacts_file"
      return 1
    fi
    if [[ ! -s "$source_file" ]]; then
      printf 'raw_output_error: raw output artifact source file must be non-empty: %s\n' "$source_file" >> "$log_file"
      rm -f "$artifacts_file"
      return 1
    fi
    if [[ ! -r "$source_file" ]]; then
      printf 'raw_output_error: raw output artifact source file must be readable: %s\n' "$source_file" >> "$log_file"
      rm -f "$artifacts_file"
      return 1
    fi
    if ! mode="$(file_mode "$source_file")"; then
      printf 'raw_output_error: raw output artifact source file permissions could not be inspected: %s\n' "$source_file" >> "$log_file"
      rm -f "$artifacts_file"
      return 1
    fi
    if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
      printf 'raw_output_error: raw output artifact source file permissions could not be parsed (mode %s): %s\n' "$mode" "$source_file" >> "$log_file"
      rm -f "$artifacts_file"
      return 1
    fi
    numeric_mode=$((8#$mode))
    if (( (numeric_mode & 8#077) != 0 )); then
      printf 'raw_output_error: raw output artifact source file must not grant group/world access; run chmod 600 %s (current mode %s)\n' "$source_file" "$mode" >> "$log_file"
      rm -f "$artifacts_file"
      return 1
    fi
  done < "$artifacts_file"

  printf 'raw_output_source_dir: %s\n' "$configured_dir" >> "$log_file"
  while IFS= read -r artifact_path; do
    [[ -n "$artifact_path" ]] || continue
    relative_target="${artifact_path#release-evidence/${RUN_ID}/}"
    source_file="${source_dir}/${relative_target}"
    target_file="${RUN_DIR}/${relative_target}"
    target_dir="$(dirname "$target_file")"
    mkdir -p "$target_dir"
    chmod 700 "$target_dir"
    if ! cp "$source_file" "$target_file"; then
      rm -rf "${RUN_DIR}/llm-evals"
      printf 'raw_output_error: raw output artifact could not be copied into the release evidence directory: %s\n' "$relative_target" >> "$log_file"
      rm -f "$artifacts_file"
      return 1
    fi
    chmod 600 "$target_file"
    sanitize_log_file "$target_file"
    printf 'archived_raw_output_artifact: %s\n' "$relative_target" >> "$log_file"
  done < "$artifacts_file"

  rm -f "$artifacts_file"
}

run_llm_provider_run_if_available() {
  local configured_file
  local run_file
  local log_file
  local copied_file
  local mode
  local numeric_mode
  local started_at
  local finished_at
  local exit_code
  configured_file="$(normalize_config_value "$LLM_PROVIDER_RUN_FILE")"
  if is_false "$INCLUDE_LLM_PROVIDER_RUN"; then
    record_skip "LLM provider safety eval result" "llm-provider-run" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN=false"
    return
  fi
  if [[ -z "$configured_file" ]]; then
    if mode_required "$INCLUDE_LLM_PROVIDER_RUN"; then
      record_required_missing "LLM provider safety eval result" "llm-provider-run" "SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE is required when SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN=true"
    else
      record_skip "LLM provider safety eval result" "llm-provider-run" "SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE is not configured"
    fi
    return
  fi
  run_file="$(resolve_path "$configured_file")"
  if [[ -L "$run_file" ]]; then
    record_required_missing "LLM provider safety eval result" "llm-provider-run" "configured provider run file must not be a symlink: $configured_file"
    return
  fi
  if [[ ! -f "$run_file" ]]; then
    record_required_missing "LLM provider safety eval result" "llm-provider-run" "configured provider run file does not exist: $configured_file"
    return
  fi
  if [[ ! -s "$run_file" ]]; then
    record_required_missing "LLM provider safety eval result" "llm-provider-run" "configured provider run file points to an empty file: $configured_file"
    return
  fi
  if [[ ! -r "$run_file" ]]; then
    record_required_missing "LLM provider safety eval result" "llm-provider-run" "configured provider run file is not readable by the release user: $configured_file"
    return
  fi
  if ! mode="$(file_mode "$run_file")"; then
    record_required_missing "LLM provider safety eval result" "llm-provider-run" "configured provider run file permissions could not be inspected before archival: $configured_file"
    return
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    record_required_missing "LLM provider safety eval result" "llm-provider-run" "configured provider run file permissions could not be parsed before archival (mode $mode): $configured_file"
    return
  fi
  numeric_mode=$((8#$mode))
  if (( (numeric_mode & 8#077) != 0 )); then
    record_required_missing "LLM provider safety eval result" "llm-provider-run" "configured provider run file must not grant group/world access before archival; run chmod 600 $configured_file (current mode $mode)"
    return
  fi

  log_file="${RUN_DIR}/llm-provider-run.log"
  copied_file="${RUN_DIR}/llm-provider-run.json"
  started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  {
    printf 'title: LLM provider safety eval result\n'
    printf 'started_at: %s\n' "$started_at"
    printf 'source_file: %s\n' "$configured_file"
    printf 'command: node scripts/validate-llm-provider-run.mjs <provider-run> <prompt-cases> <output-cases> --run-id <release-run-id>\n'
    printf '\n'
  } > "$log_file"
  set +e
  (
    cd "$ROOT_DIR" && node scripts/validate-llm-provider-run.mjs \
      "$run_file" \
      docs/llm-safety-evals/prompt-injection-cases.json \
      docs/llm-safety-evals/output-quality-cases.json \
      --run-id "$RUN_ID"
  ) >> "$log_file" 2>&1
  exit_code=$?
  set -e
  finished_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  {
    printf '\n'
    printf 'finished_at: %s\n' "$finished_at"
    printf 'exit_code: %s\n' "$exit_code"
  } >> "$log_file"
  sanitize_log_file "$log_file"
  if [[ "$exit_code" == "0" ]]; then
    if cp "$run_file" "$copied_file"; then
      chmod 600 "$copied_file"
      sanitize_log_file "$copied_file"
      if copy_llm_provider_raw_outputs "$run_file" "$log_file"; then
        sanitize_log_file "$log_file"
        record_status "OK" "LLM provider safety eval result" "llm-provider-run" "$exit_code" "$(basename "$log_file")" "validated and copied to $(basename "$copied_file") with raw output artifacts"
      else
        rm -f "$copied_file"
        rm -rf "${RUN_DIR}/llm-evals"
        sanitize_log_file "$log_file"
        failures=$((failures + 1))
        record_status "FAIL" "LLM provider safety eval result" "llm-provider-run" "1" "$(basename "$log_file")" "provider eval raw output artifacts failed archival"
      fi
    else
      failures=$((failures + 1))
      record_status "FAIL" "LLM provider safety eval result" "llm-provider-run" "1" "$(basename "$log_file")" "provider eval result could not be copied into the release evidence directory"
    fi
  else
    failures=$((failures + 1))
    record_status "FAIL" "LLM provider safety eval result" "llm-provider-run" "$exit_code" "$(basename "$log_file")" "provider eval result failed validation"
  fi
}

finish_summary() {
  {
    printf '\n## Summary\n'
    printf '%s\n' ""
    printf '%s\n' "- required_failures: \`${failures}\`"
    printf '%s\n' "- optional_warnings: \`${warnings}\`"
    printf '%s\n' "- skipped: \`${skipped}\`"
  } >> "$SUMMARY_FILE"
  echo
  echo "Release evidence written to: $RUN_DIR"
  echo "Summary: ${failures} required failure(s), ${warnings} optional warning(s), ${skipped} skipped step(s)"
}

harden_evidence_file_modes() {
  find "$RUN_DIR" -type d -exec chmod 700 {} +
  find "$RUN_DIR" -type f -exec chmod 600 {} +
}

write_evidence_checksum_manifest() {
  local manifest="${RUN_DIR}/checksums.sha256"
  if command -v sha256sum >/dev/null 2>&1; then
    (
      cd "$RUN_DIR"
      find . -type f ! -name 'checksums.sha256' -print \
        | LC_ALL=C sort \
        | while IFS= read -r file; do
            file="${file#./}"
            sha256sum "$file"
          done
    ) > "$manifest"
  elif command -v shasum >/dev/null 2>&1; then
    (
      cd "$RUN_DIR"
      find . -type f ! -name 'checksums.sha256' -print \
        | LC_ALL=C sort \
        | while IFS= read -r file; do
            file="${file#./}"
            shasum -a 256 "$file"
          done
    ) > "$manifest"
  else
    echo "sha256sum or shasum is required to write release evidence checksum manifest" >&2
    exit 1
  fi
  chmod 600 "$manifest"
  echo "Checksum manifest written to: $manifest"
}

validate_run_id
apply_release_evidence_profile
set_profile_derived_requirements
validate_include_modes
validate_env_file_boundary
validate_release_metadata_inputs
validate_mutating_target_boundary
validate_loopback_backend_runtime_boundary
init_output
write_git_metadata
write_worktree_inventory

if is_true "$INCLUDE_VERIFY"; then
  run_step "Full local verification" "make-verify" true make verify
else
  record_skip "Full local verification" "make-verify" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY=false"
fi

if is_true "$INCLUDE_PREFLIGHT"; then
  run_preflights
else
  record_skip "Production preflight (warn-only)" "prod-preflight" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false"
  record_skip "Backup/restore preflight (warn-only)" "backup-preflight" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false"
  record_skip "Rollback preflight (warn-only)" "rollback-preflight" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false"
fi

archive_release_input_evidence

if mode_enabled "$INCLUDE_SMOKE"; then
  run_smoke_if_available
else
  record_skip "Smoke test" "smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false"
fi

if mode_enabled "$INCLUDE_PUBLIC_REPO_SMOKE"; then
  run_public_repo_smoke_if_available
else
  record_skip "Public repo analysis smoke" "public-repo-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=false"
fi

if mode_enabled "$INCLUDE_FILE_BOUND_REPAIR_SMOKE"; then
  run_file_bound_repair_smoke_if_available
else
  record_skip "File-bound repair smoke" "file-bound-repair-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE=false"
fi

if mode_enabled "$INCLUDE_AUTOREPAIR_PATCH_SMOKE"; then
  run_autorepair_patch_smoke_if_available
else
  record_skip "AutoRepair patch readiness smoke" "autorepair-patch-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE=false"
fi

if mode_enabled "$INCLUDE_PATCH_READY_UI_SMOKE"; then
  run_patch_ready_ui_smoke_if_available
else
  record_skip "PATCH_READY browser UI smoke (mocked)" "patch-ready-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PATCH_READY_UI_SMOKE=false"
fi

if mode_enabled "$INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE"; then
  run_dashboard_next_action_ui_smoke_if_available
else
  record_skip "Dashboard next action browser UI smoke (mocked)" "dashboard-next-action-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE=false"
fi

if mode_enabled "$INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE"; then
  run_report_evidence_drawer_ui_smoke_if_available
else
  record_skip "Report evidence drawer browser UI smoke (mocked)" "report-evidence-drawer-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE=false"
fi

if mode_enabled "$INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE"; then
  run_scan_governance_timeline_ui_smoke_if_available
else
  record_skip "Scan governance timeline browser UI smoke (mocked)" "scan-governance-timeline-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE=false"
fi

if mode_enabled "$INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE"; then
  run_agent_chat_audit_ui_smoke_if_available
else
  record_skip "AgentChat audit browser UI smoke (mocked)" "agent-chat-audit-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE=false"
fi

if mode_enabled "$INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE"; then
  run_agent_chat_closure_rail_ui_smoke_if_available
else
  record_skip "AgentChat closure rail browser UI smoke (mocked)" "agent-chat-closure-rail-ui-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE=false"
fi

if mode_enabled "$INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE"; then
  run_agent_chat_tool_audit_smoke_if_available
else
  record_skip "AgentChat tool audit backend smoke" "agent-chat-tool-audit-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE=false"
fi

if mode_enabled "$INCLUDE_AUDIT_WORKBENCH_SMOKE"; then
  run_audit_workbench_smoke_if_available
else
  record_skip "Audit workbench smoke" "audit-workbench-smoke" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE=false"
fi

if mode_enabled "$INCLUDE_PHASE12"; then
  run_phase12_if_available
else
  record_skip "Phase 12 baseline" "phase12-baseline" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12=false"
fi

if mode_enabled "$INCLUDE_SANDBOX_DRILL"; then
  run_sandbox_drill_if_available
else
  record_skip "Docker sandbox drill" "sandbox-drill" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL=false"
fi

if mode_enabled "$INCLUDE_GITHUB_APP_DRILL"; then
  run_github_app_drill_if_available
else
  record_skip "GitHub App read-only drill" "github-app-drill" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL=false"
fi

if mode_enabled "$INCLUDE_GITHUB_WEBHOOK_DRILL"; then
  run_github_webhook_drill_if_available
else
  record_skip "GitHub webhook drill" "github-webhook-drill" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL=false"
fi

if mode_enabled "$INCLUDE_LLM_PROVIDER_RUN"; then
  run_llm_provider_run_if_available
else
  record_skip "LLM provider safety eval result" "llm-provider-run" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN=false"
fi

finish_summary
harden_evidence_file_modes
write_evidence_checksum_manifest

if (( failures > 0 )); then
  exit 1
fi
