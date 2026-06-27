#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCAN_TASK_ID="${1:-${SOURCELENS_ARTIFACT_QUALITY_SCAN_TASK_ID:-}}"
MYSQL_CONTAINER="${SOURCELENS_ARTIFACT_QUALITY_MYSQL_CONTAINER:-sourcelens-mysql}"
BACKEND_CONTAINER="${SOURCELENS_ARTIFACT_QUALITY_BACKEND_CONTAINER:-sourcelens-backend}"

fail() {
  echo "ARTIFACT QUALITY FAIL: $*" >&2
  exit 1
}

if [[ -z "$SCAN_TASK_ID" ]]; then
  fail "SCAN_TASK_ID is required. Usage: SCAN_TASK_ID=32 make artifact-quality-check"
fi
if [[ ! "$SCAN_TASK_ID" =~ ^[1-9][0-9]*$ ]]; then
  fail "SCAN_TASK_ID must be a positive integer"
fi
if ! command -v docker >/dev/null 2>&1; then
  fail "docker is required to read SourceLens MySQL container metadata"
fi
if ! docker exec "$MYSQL_CONTAINER" sh -lc 'command -v mysql >/dev/null 2>&1' >/dev/null 2>&1; then
  fail "MySQL container '$MYSQL_CONTAINER' is not running or does not provide mysql"
fi
if ! command -v node >/dev/null 2>&1; then
  fail "node is required for JSON artifact validation"
fi

records_file="$(mktemp "${TMPDIR:-/tmp}/sourcelens-artifact-quality.XXXXXX")"
cleanup() {
  rm -f "$records_file"
}
trap cleanup EXIT

docker exec "$MYSQL_CONTAINER" sh -lc "MYSQL_PWD=\"\$MYSQL_PASSWORD\" mysql -N -B -u \"\$MYSQL_USER\" \"\$MYSQL_DATABASE\" -e \"
SELECT artifact_type, storage_path, COALESCE(content_type, '')
FROM artifact_records
WHERE owner_type = 'SCAN_TASK' AND owner_id = ${SCAN_TASK_ID}
ORDER BY artifact_type;
\"" > "$records_file"

if [[ ! -s "$records_file" ]]; then
  fail "no artifact_records found for scan task ${SCAN_TASK_ID}"
fi

echo "Checking scan task ${SCAN_TASK_ID} artifact quality..."
node "$ROOT_DIR/scripts/validate-artifact-quality.mjs" "$records_file" "$BACKEND_CONTAINER"
echo "Artifact quality OK for scan task ${SCAN_TASK_ID}"
