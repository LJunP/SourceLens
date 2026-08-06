#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_BACKEND_ENV_FILE:-${SOURCELENS_DEV_ENV_FILE:-deploy/.env}}"

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
  printf '%s' "$value"
}

resolve_path() {
  local path="$1"
  case "$path" in
    /*) printf '%s\n' "$path" ;;
    *) printf '%s/%s\n' "$ROOT_DIR" "$path" ;;
  esac
}

load_env_file() {
  local path="$1"
  local line
  local key
  local value

  if [[ ! -e "$path" ]]; then
    echo "WARN: $ENV_FILE not found; using process environment and dev defaults" >&2
    return
  fi
  if [[ ! -f "$path" || ! -r "$path" ]]; then
    echo "ERROR: $ENV_FILE must be a readable regular file" >&2
    exit 1
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    line="$(trim "$line")"
    [[ -z "$line" || "$line" == \#* ]] && continue
    line="${line#export }"
    [[ "$line" == *"="* ]] || continue
    key="$(trim "${line%%=*}")"
    value="${line#*=}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if [[ -z "${!key-}" ]]; then
      export "$key=$(normalize_config_value "$value")"
    fi
  done < "$path"
}

assert_backend_port_available() {
  local port="$1"
  local listener

  if [[ ! "$port" =~ ^[0-9]+$ ]]; then
    echo "WARN: SERVER_PORT=$port is not numeric; skipping local port availability check" >&2
    return
  fi
  if ! command -v lsof >/dev/null 2>&1; then
    echo "WARN: lsof not found; skipping backend port availability check" >&2
    return
  fi

  listener="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$listener" ]]; then
    return
  fi

  if is_existing_sourcelens_backend_healthy "$port"; then
    echo "SourceLens backend is already running and healthy at http://localhost:$port"
    echo "Reusing the existing process instead of starting another backend."
    exit 0
  fi

  echo "ERROR: backend port $port is already in use." >&2
  echo "$listener" >&2
  echo >&2
  echo "If the listener above is an existing SourceLens backend, keep using http://localhost:$port instead of starting another one." >&2
  echo "To stop a stale local backend, first confirm the listener above, then run: lsof -tiTCP:$port -sTCP:LISTEN | xargs kill" >&2
  echo "To start on another port: SERVER_PORT=18080 make backend" >&2
  exit 1
}

is_existing_sourcelens_backend_healthy() {
  local port="$1"
  local base_url="http://127.0.0.1:$port"
  local health
  local api_docs

  if ! command -v curl >/dev/null 2>&1; then
    return 1
  fi

  health="$(curl -fsS -m 2 "$base_url/actuator/health" 2>/dev/null || true)"
  [[ "$health" == *'"status":"UP"'* ]] || return 1

  api_docs="$(curl -fsS -m 2 "$base_url/api-docs" 2>/dev/null || true)"
  [[ "$api_docs" == *'"/api/projects"'* || "$api_docs" == *'"/api/auth/login"'* ]]
}

load_env_file "$(resolve_path "$ENV_FILE")"

export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-dev}"
export SERVER_PORT="${SERVER_PORT:-8080}"
export DB_USERNAME="${DB_USERNAME:-${MYSQL_USER:-sourcelens}}"
export DB_PASSWORD="${DB_PASSWORD:-${MYSQL_PASSWORD:-sourcelens123}}"
export DB_URL="${DB_URL:-jdbc:mysql://localhost:3307/${MYSQL_DATABASE:-sourcelens}?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true}"
export REDIS_HOST="${REDIS_HOST:-localhost}"
export REDIS_PORT="${REDIS_PORT:-6379}"
export SOURCELENS_BACKEND_MAIN_CLASS="${SOURCELENS_BACKEND_MAIN_CLASS:-com.sourcelens.SourceLensApplication}"

if [[ -z "${JAVA_HOME:-}" && -x /usr/libexec/java_home ]]; then
  JAVA_HOME="$(/usr/libexec/java_home 2>/dev/null || true)"
  if [[ -n "$JAVA_HOME" ]]; then
    export JAVA_HOME
  fi
fi

assert_backend_port_available "$SERVER_PORT"

echo "Starting SourceLens backend with profile=${SPRING_PROFILES_ACTIVE}, port=${SERVER_PORT}, env_file=${ENV_FILE}, db_url=${DB_URL%%\?*}, main_class=${SOURCELENS_BACKEND_MAIN_CLASS}"
cd "$ROOT_DIR/backend-spring"
exec mvn spring-boot:run \
  -Dspring-boot.run.main-class="${SOURCELENS_BACKEND_MAIN_CLASS}" \
  -Dspring-boot.run.arguments="--server.port=${SERVER_PORT}"
