#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SOURCELENS_BACKEND_ENV_FILE:-${SOURCELENS_DEV_ENV_FILE:-deploy/.env}}"
JAR_FILE="${SOURCELENS_BACKEND_JAR:-$ROOT_DIR/backend-spring/target/source-lens-backend-0.1.0-SNAPSHOT.jar}"
RUNTIME_DIR="${SOURCELENS_BACKEND_RUNTIME_DIR:-$ROOT_DIR/.sourcelens-runtime/backend}"

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
  local listener_pid
  local listener_command

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

  listener_pid="$(printf '%s\n' "$listener" | awk 'NR == 2 { print $2 }')"
  if [[ -n "$listener_pid" ]]; then
    listener_command="$(ps -p "$listener_pid" -o command= 2>/dev/null || true)"
    if [[ "$listener_command" == *"backend-spring/target/"*"source-lens-backend"*".jar"* ]]; then
      echo "ERROR: backend port $port is already used by an unsafe target jar runtime." >&2
      echo "$listener" >&2
      echo >&2
      echo "The listener command is: $listener_command" >&2
      echo "Do not use backend-spring/target/*.jar for release evidence or long-running smoke tests; Maven clean can delete that jar while the app is running." >&2
      echo "Stop the stale target-jar backend first, then run: SERVER_PORT=$port make backend-jar" >&2
      echo "Or choose another free port, for example: SERVER_PORT=19080 make backend-jar" >&2
      exit 1
    fi
  fi

  echo "ERROR: backend port $port is already in use." >&2
  echo "$listener" >&2
  echo >&2
  echo "If the listener above is an existing SourceLens backend, keep using http://localhost:$port instead of starting another one." >&2
  echo "Before using it for release evidence, confirm it is not a target/classes backend or a backend-spring/target/*.jar process; those runtimes can be broken by Maven clean." >&2
  echo "To stop a stale local backend, first confirm the listener above, then run: lsof -tiTCP:$port -sTCP:LISTEN | xargs kill" >&2
  echo "To start on another port: SERVER_PORT=19080 make backend-jar" >&2
  exit 1
}

load_env_file "$(resolve_path "$ENV_FILE")"

export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-dev}"
export SERVER_PORT="${SERVER_PORT:-8080}"
export DB_USERNAME="${DB_USERNAME:-${MYSQL_USER:-sourcelens}}"
export DB_PASSWORD="${DB_PASSWORD:-${MYSQL_PASSWORD:-sourcelens123}}"
export DB_URL="${DB_URL:-jdbc:mysql://localhost:3307/${MYSQL_DATABASE:-sourcelens}?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true}"
export REDIS_HOST="${REDIS_HOST:-localhost}"
export REDIS_PORT="${REDIS_PORT:-6379}"

prepare_runtime_jar() {
  local source_jar="$1"
  local runtime_jar
  mkdir -p "$RUNTIME_DIR"
  runtime_jar="$(mktemp "$RUNTIME_DIR/source-lens-backend.XXXXXX")" \
    || {
      echo "ERROR: could not create runtime jar under $RUNTIME_DIR" >&2
      exit 1
    }
  cp "$source_jar" "$runtime_jar"
  chmod 600 "$runtime_jar"
  printf '%s\n' "$runtime_jar"
}

if [[ -z "${JAVA_HOME:-}" && -x /usr/libexec/java_home ]]; then
  JAVA_HOME="$(/usr/libexec/java_home 2>/dev/null || true)"
  if [[ -n "$JAVA_HOME" ]]; then
    export JAVA_HOME
  fi
fi

assert_backend_port_available "$SERVER_PORT"

if [[ ! -f "$JAR_FILE" ]]; then
  echo "ERROR: backend jar not found: $JAR_FILE" >&2
  echo "Run: cd backend-spring && mvn -q -DskipTests package" >&2
  exit 1
fi

RUNTIME_JAR_FILE="$(prepare_runtime_jar "$JAR_FILE")"

echo "Starting SourceLens backend jar with profile=${SPRING_PROFILES_ACTIVE}, port=${SERVER_PORT}, env_file=${ENV_FILE}, db_url=${DB_URL%%\?*}, runtime_jar=${RUNTIME_JAR_FILE}"
cd "$ROOT_DIR"
exec java -jar "$RUNTIME_JAR_FILE"
