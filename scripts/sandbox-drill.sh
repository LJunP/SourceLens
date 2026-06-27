#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_SANDBOX_DRILL_ENV_FILE:-${SOURCELENS_PREFLIGHT_ENV_FILE:-deploy/.env}}"
WARN_ONLY="${SOURCELENS_SANDBOX_DRILL_WARN_ONLY:-false}"

DEFAULT_IMAGE="alpine/git:latest@sha256:8d6ede0b29c666ac111c732468c4d758c1c08f054f211dd98f15d421a6ffab40"
DEFAULT_MEMORY="512m"
DEFAULT_CPUS="1.0"
DEFAULT_NETWORK="none"
DEFAULT_USER="1000:1000"
DEFAULT_PIDS_LIMIT="256"
DEFAULT_READ_ONLY_ROOT="true"
DEFAULT_TMPFS="/tmp:rw,noexec,nosuid,size=64m"

failures=0
warnings=0
container_name=""
workdir=""

fail() {
  echo "SANDBOX DRILL FAIL: $*" >&2
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

config_value_or_default() {
  local key="$1"
  local default_value="$2"
  local env_value="${!key-}"
  local file_value
  if [[ -n "$env_value" ]]; then
    normalize_config_value "$env_value"
    return
  fi
  file_value="$(env_from_file "$key")"
  if [[ -n "$file_value" ]]; then
    normalize_config_value "$file_value"
    return
  fi
  printf '%s\n' "$default_value"
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
    record_fail "$ENV_FILE must be readable by the Docker sandbox drill user"
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
  if [[ -n "$container_name" ]] && command -v docker >/dev/null 2>&1; then
    docker rm -f "$container_name" >/dev/null 2>&1 || true
  fi
  if [[ -n "$workdir" ]]; then
    rm -rf "$workdir"
  fi
}
trap cleanup EXIT

require_digest_pinned_image() {
  local image="$1"
  if [[ "$image" =~ ^[^[:space:]]+@sha256:[0-9a-fA-F]{64}$ ]]; then
    record_ok "sandbox image is digest-pinned"
  else
    record_fail "SOURCELENS_SANDBOX_DOCKER_IMAGE must be pinned to sha256 digest, got $image"
  fi
}

require_positive_memory() {
  local value="$1"
  if [[ "$value" =~ ^[1-9][0-9]*[bBkKmMgG]?$ ]]; then
    record_ok "sandbox memory limit is positive: $value"
  else
    record_fail "SOURCELENS_SANDBOX_DOCKER_MEMORY must be a positive Docker memory limit, got $value"
  fi
}

require_positive_decimal() {
  local value="$1"
  if [[ "$value" =~ ^([0-9]+([.][0-9]+)?|[.][0-9]+)$ ]] \
      && awk -v value="$value" 'BEGIN { exit(value > 0 ? 0 : 1) }'; then
    record_ok "sandbox CPU limit is positive: $value"
  else
    record_fail "SOURCELENS_SANDBOX_DOCKER_CPUS must be a positive decimal, got $value"
  fi
}

require_positive_integer() {
  local value="$1"
  local name="$2"
  if [[ "$value" =~ ^[1-9][0-9]*$ ]]; then
    record_ok "$name is positive: $value"
  else
    record_fail "$name must be a positive integer, got $value"
  fi
}

require_non_root_user() {
  local value="$1"
  if [[ "$value" =~ ^0(:0)?$ || "$value" == root* ]]; then
    record_fail "SOURCELENS_SANDBOX_DOCKER_USER must not be root, got $value"
  else
    record_ok "sandbox user is non-root: $value"
  fi
}

require_tmpfs_flags() {
  local value="$1"
  if [[ "$value" == /tmp:* && "$value" == *noexec* && "$value" == *nosuid* ]]; then
    record_ok "sandbox tmpfs contains noexec,nosuid: $value"
  else
    record_fail "SOURCELENS_SANDBOX_DOCKER_TMPFS must mount /tmp with noexec,nosuid, got $value"
  fi
}

inspect_value() {
  local format="$1"
  docker inspect --format "$format" "$container_name"
}

assert_inspect_equals() {
  local description="$1"
  local actual="$2"
  local expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    record_ok "$description"
  else
    record_fail "$description expected $expected, got $actual"
  fi
}

assert_inspect_contains() {
  local description="$1"
  local actual="$2"
  local needle="$3"
  if [[ "$actual" == *"$needle"* ]]; then
    record_ok "$description"
  else
    record_fail "$description must contain $needle, got $actual"
  fi
}

validate_bool_mode SOURCELENS_SANDBOX_DRILL_WARN_ONLY "$WARN_ONLY"

echo "SourceLens Docker sandbox drill"
echo "================================"
echo "Mode: $(is_true "$WARN_ONLY" && echo warn-only || echo strict)"

check_env_file_boundary

image="$(config_value_or_default SOURCELENS_SANDBOX_DOCKER_IMAGE "$DEFAULT_IMAGE")"
memory="$(config_value_or_default SOURCELENS_SANDBOX_DOCKER_MEMORY "$DEFAULT_MEMORY")"
cpus="$(config_value_or_default SOURCELENS_SANDBOX_DOCKER_CPUS "$DEFAULT_CPUS")"
network="$(config_value_or_default SOURCELENS_SANDBOX_DOCKER_NETWORK "$DEFAULT_NETWORK")"
user="$(config_value_or_default SOURCELENS_SANDBOX_DOCKER_USER "$DEFAULT_USER")"
pids_limit="$(config_value_or_default SOURCELENS_SANDBOX_DOCKER_PIDS_LIMIT "$DEFAULT_PIDS_LIMIT")"
read_only_root="$(to_lower "$(config_value_or_default SOURCELENS_SANDBOX_DOCKER_READ_ONLY_ROOT "$DEFAULT_READ_ONLY_ROOT")")"
tmpfs="$(config_value_or_default SOURCELENS_SANDBOX_DOCKER_TMPFS "$DEFAULT_TMPFS")"

echo
echo "== Configuration =="
require_digest_pinned_image "$image"
require_positive_memory "$memory"
require_positive_decimal "$cpus"
require_positive_integer "$pids_limit" "SOURCELENS_SANDBOX_DOCKER_PIDS_LIMIT"
require_non_root_user "$user"
require_tmpfs_flags "$tmpfs"
assert_inspect_equals "sandbox network mode is none" "$network" "none"
assert_inspect_equals "sandbox read-only root is enabled" "$read_only_root" "true"

echo
echo "== Docker availability =="
docker_ready=true
if command -v docker >/dev/null 2>&1; then
  record_ok "docker CLI is available"
else
  record_fail "docker CLI is required for sandbox drill"
  docker_ready=false
fi
if [[ "$docker_ready" == "true" ]]; then
  if docker info >/dev/null 2>&1; then
    record_ok "Docker daemon is reachable"
  else
    record_fail "Docker daemon is not reachable"
    docker_ready=false
  fi
fi

if [[ "$docker_ready" != "true" || "$failures" != "0" ]] || { is_true "$WARN_ONLY" && [[ "$warnings" != "0" ]]; }; then
  finish
  exit 0
fi

echo
echo "== Container isolation =="
workdir="$(mktemp -d "${TMPDIR:-/tmp}/sourcelens-sandbox-drill.XXXXXX")"
chmod 700 "$workdir"
container_name="sourcelens-sandbox-drill-$RANDOM-$$"
runtime_script='
set -eu
echo "runtime_user=$(id -u):$(id -g)"
if [ "$(id -u)" = "0" ]; then
  echo "runtime user is root"
  exit 10
fi
if [ "$(pwd)" != "/workspace" ]; then
  echo "working directory is not /workspace"
  exit 11
fi
echo workspace-ok > /workspace/sandbox-drill-write.txt
if awk "\$2 == \"00000000\" && \$1 != \"lo\" { found = 1 } END { exit(found ? 0 : 1) }" /proc/net/route; then
  echo "default network route is present"
  exit 12
fi
root_opts="$(awk "\$2 == \"/\" { print \$4; exit }" /proc/mounts)"
case ",$root_opts," in
  *,ro,*) ;;
  *) echo "root filesystem is not mounted read-only: $root_opts"; exit 13 ;;
esac
tmp_opts="$(awk "\$2 == \"/tmp\" { print \$4; exit }" /proc/mounts)"
case ",$tmp_opts," in
  *,noexec,*) ;;
  *) echo "/tmp is missing noexec: $tmp_opts"; exit 14 ;;
esac
case ",$tmp_opts," in
  *,nosuid,*) ;;
  *) echo "/tmp is missing nosuid: $tmp_opts"; exit 15 ;;
esac
printf "#!/bin/sh\nexit 0\n" > /tmp/sourcelens-noexec-test
chmod +x /tmp/sourcelens-noexec-test
if /tmp/sourcelens-noexec-test >/dev/null 2>&1; then
  echo "/tmp allowed direct execution"
  exit 16
fi
if touch /.sourcelens-root-write-test >/dev/null 2>&1; then
  echo "root filesystem accepted writes"
  exit 17
fi
pids_value="$(cat /sys/fs/cgroup/pids.max 2>/dev/null || cat /sys/fs/cgroup/pids/pids.max 2>/dev/null || true)"
if [ -z "$pids_value" ]; then
  echo "pids cgroup limit is not visible"
  exit 18
fi
if [ "$pids_value" != "$EXPECTED_PIDS_LIMIT" ]; then
  echo "pids limit mismatch: expected $EXPECTED_PIDS_LIMIT got $pids_value"
  exit 19
fi
memory_value="$(cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || true)"
if [ -z "$memory_value" ] || [ "$memory_value" = "max" ]; then
  echo "memory cgroup limit is not enforced"
  exit 20
fi
echo "sandbox runtime checks passed"
'

set +e
create_output="$(docker create \
  --name "$container_name" \
  --network "$network" \
  --cpus "$cpus" \
  --memory "$memory" \
  --memory-swap "$memory" \
  --user "$user" \
  --pids-limit "$pids_limit" \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --entrypoint sh \
  --read-only \
  --tmpfs "$tmpfs" \
  -e EXPECTED_PIDS_LIMIT="$pids_limit" \
  -v "$workdir:/workspace:rw" \
  -w /workspace \
  "$image" \
  -c "$runtime_script" 2>&1 >/dev/null)"
create_exit=$?
set -e
if [[ "$create_exit" != "0" ]]; then
  record_fail "docker create failed: $create_output"
  finish
  exit 0
fi

assert_inspect_equals "docker HostConfig.NetworkMode is none" "$(inspect_value '{{.HostConfig.NetworkMode}}')" "none"
assert_inspect_equals "docker Config.User is non-root configured user" "$(inspect_value '{{.Config.User}}')" "$user"
assert_inspect_equals "docker HostConfig.ReadonlyRootfs is true" "$(inspect_value '{{.HostConfig.ReadonlyRootfs}}')" "true"
assert_inspect_equals "docker HostConfig.PidsLimit matches config" "$(inspect_value '{{.HostConfig.PidsLimit}}')" "$pids_limit"
assert_inspect_contains "docker HostConfig.CapDrop drops all capabilities" "$(inspect_value '{{json .HostConfig.CapDrop}}')" "ALL"
assert_inspect_contains "docker HostConfig.SecurityOpt enables no-new-privileges" "$(inspect_value '{{json .HostConfig.SecurityOpt}}')" "no-new-privileges"
assert_inspect_contains "docker HostConfig.Tmpfs includes /tmp" "$(inspect_value '{{json .HostConfig.Tmpfs}}')" "/tmp"
assert_inspect_contains "docker HostConfig.Tmpfs includes noexec" "$(inspect_value '{{json .HostConfig.Tmpfs}}')" "noexec"
assert_inspect_contains "docker HostConfig.Tmpfs includes nosuid" "$(inspect_value '{{json .HostConfig.Tmpfs}}')" "nosuid"
memory_bytes="$(inspect_value '{{.HostConfig.Memory}}')"
memory_swap_bytes="$(inspect_value '{{.HostConfig.MemorySwap}}')"
if [[ "$memory_bytes" =~ ^[1-9][0-9]*$ ]]; then
  record_ok "docker HostConfig.Memory is enforced: $memory_bytes bytes"
else
  record_fail "docker HostConfig.Memory must be positive, got $memory_bytes"
fi
assert_inspect_equals "docker HostConfig.MemorySwap equals memory limit" "$memory_swap_bytes" "$memory_bytes"

set +e
docker start -a "$container_name"
runtime_exit=$?
set -e
if [[ "$runtime_exit" == "0" ]]; then
  record_ok "sandbox runtime checks passed inside the restricted container"
else
  record_fail "sandbox runtime checks failed with exit code $runtime_exit"
fi

if [[ -f "$workdir/sandbox-drill-write.txt" ]]; then
  record_ok "workspace mount is writable inside sandbox"
else
  record_fail "workspace mount write marker was not created"
fi

finish
