#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MYSQL_IMAGE="${SOURCELENS_MYSQL_FLYWAY_SMOKE_IMAGE:-mysql:8.4@sha256:d36d39a64cd12a5c1cc9e6aa2bfb5f8d4c81a2f6586e0a04a9ae13939db02209}"
CONTAINER_NAME="${SOURCELENS_MYSQL_FLYWAY_SMOKE_CONTAINER:-sourcelens-mysql-flyway-smoke-$$}"
DB_NAME="${SOURCELENS_MYSQL_FLYWAY_SMOKE_DB_NAME:-sourcelens_migration_smoke}"
DB_USERNAME="${SOURCELENS_MYSQL_FLYWAY_SMOKE_DB_USERNAME:-sourcelens_smoke}"
DB_PASSWORD="${SOURCELENS_MYSQL_FLYWAY_SMOKE_DB_PASSWORD:-sourcelens_smoke_password_$$}"
ROOT_PASSWORD="${SOURCELENS_MYSQL_FLYWAY_SMOKE_ROOT_PASSWORD:-sourcelens_root_password_$$}"
KEEP_CONTAINER="${SOURCELENS_MYSQL_FLYWAY_SMOKE_KEEP_CONTAINER:-false}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1" >&2
    exit 1
  fi
}

cleanup() {
  local status=$?
  if [[ "${KEEP_CONTAINER}" == "true" ]]; then
    echo "Keeping MySQL smoke container: ${CONTAINER_NAME}"
  else
    docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  fi
  exit "$status"
}

require_cmd docker
require_cmd mvn
trap cleanup EXIT

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is not running or not accessible." >&2
  exit 1
fi

if docker inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
  echo "ERROR: container already exists: ${CONTAINER_NAME}" >&2
  exit 1
fi

echo "Starting disposable MySQL for Flyway migration smoke..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -e MYSQL_ROOT_PASSWORD="${ROOT_PASSWORD}" \
  -e MYSQL_DATABASE="${DB_NAME}" \
  -e MYSQL_USER="${DB_USERNAME}" \
  -e MYSQL_PASSWORD="${DB_PASSWORD}" \
  -p 127.0.0.1::3306 \
  "${MYSQL_IMAGE}" >/dev/null

MYSQL_PORT="$(docker port "${CONTAINER_NAME}" 3306/tcp | awk -F: 'NF > 1 {print $NF; exit}' | tr -d '[:space:]')"
if [[ -z "${MYSQL_PORT}" ]]; then
  echo "ERROR: failed to resolve disposable MySQL host port." >&2
  exit 1
fi

echo "Waiting for disposable MySQL on 127.0.0.1:${MYSQL_PORT}..."
ready=false
for _ in $(seq 1 60); do
  if docker exec "${CONTAINER_NAME}" mysqladmin ping -h127.0.0.1 -uroot -p"${ROOT_PASSWORD}" --silent >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 2
done

if [[ "${ready}" != "true" ]]; then
  echo "ERROR: disposable MySQL did not become ready in time." >&2
  docker logs "${CONTAINER_NAME}" >&2 || true
  exit 1
fi

DB_URL="jdbc:mysql://127.0.0.1:${MYSQL_PORT}/${DB_NAME}?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true"

echo "Running real MySQL Flyway migration smoke..."
(
  cd "${ROOT_DIR}/backend-spring"
  SOURCELENS_MYSQL_FLYWAY_SMOKE=true \
  SOURCELENS_MYSQL_FLYWAY_SMOKE_DB_URL="${DB_URL}" \
  SOURCELENS_MYSQL_FLYWAY_SMOKE_DB_USERNAME="${DB_USERNAME}" \
  SOURCELENS_MYSQL_FLYWAY_SMOKE_DB_PASSWORD="${DB_PASSWORD}" \
  mvn -Dtest=MySqlFlywayMigrationSmokeTest test
)

echo "MYSQL_FLYWAY_MIGRATION_SMOKE_OK database=${DB_NAME} v032=true"
