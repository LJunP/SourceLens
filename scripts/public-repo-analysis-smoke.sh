#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export SOURCELENS_BASE_URL="${SOURCELENS_BASE_URL:-http://localhost:8080}"
export SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL="${SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL:-https://github.com/LJunP/Pawnshop-Management-System.git}"
export SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH="${SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH:-main}"
export SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS="${SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS:-600}"
export SOURCELENS_PUBLIC_REPO_SMOKE_POLL_SECONDS="${SOURCELENS_PUBLIC_REPO_SMOKE_POLL_SECONDS:-3}"
export SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS="${SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS:-auto}"
export SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY="${SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY:-auto}"
export SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP="${SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP:-false}"
export SOURCELENS_PUBLIC_REPO_SMOKE_UI="${SOURCELENS_PUBLIC_REPO_SMOKE_UI:-false}"
export SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL="${SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL:-${SOURCELENS_PUBLIC_REPO_SMOKE_QA_SAMPLE_EVAL:-auto}}"
export SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_MIN_SEMANTIC_FALLBACK="${SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_MIN_SEMANTIC_FALLBACK:-1}"
export SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_CONFIGURE_MOCK="${SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_CONFIGURE_MOCK:-false}"
export SOURCELENS_PUBLIC_REPO_SMOKE_SEMANTIC_PROBE="${SOURCELENS_PUBLIC_REPO_SMOKE_SEMANTIC_PROBE:-${SOURCELENS_PUBLIC_REPO_SMOKE_SEMANTIC_WEAK_KEYWORD:-auto}}"
export SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE="${SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE:-auto}"
export SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE_CONFIGURE_MOCK="${SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE_CONFIGURE_MOCK:-true}"
export SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION="${SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION:-auto}"
export SOURCELENS_MYSQL_CONTAINER="${SOURCELENS_MYSQL_CONTAINER:-sourcelens-mysql}"
export SOURCELENS_ARTIFACT_QUALITY_BACKEND_CONTAINER="${SOURCELENS_ARTIFACT_QUALITY_BACKEND_CONTAINER:-sourcelens-backend}"
export SOURCELENS_REPO_ROOT="$ROOT_DIR"

if ! command -v git >/dev/null 2>&1; then
  echo "PUBLIC_REPO_SMOKE_FAIL: git is required for GitService anonymous GitHub public repo clone" >&2
  exit 1
fi

python3 - <<'PY'
import json
import http.client
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

http.client.HTTPConnection._http_vsn = 10
http.client.HTTPConnection._http_vsn_str = "HTTP/1.0"


def fail(message, code=1):
    print(f"PUBLIC_REPO_SMOKE_FAIL: {message}", file=sys.stderr)
    raise SystemExit(code)


class TransientHttpStatus(Exception):
    def __init__(self, status, body):
        super().__init__(f"HTTP {status}: {body}")
        self.status = status
        self.body = body


def urlopen_with_retries(request, timeout=60, attempts=20):
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            return urllib.request.urlopen(request, timeout=timeout)
        except urllib.error.HTTPError:
            raise
        except urllib.error.URLError as exc:
            last_error = exc
            if not isinstance(exc.reason, (ConnectionResetError, BrokenPipeError, http.client.RemoteDisconnected)):
                raise
        except (ConnectionResetError, BrokenPipeError, http.client.RemoteDisconnected) as exc:
            last_error = exc
        if attempt < attempts:
            time.sleep(min(0.25 * attempt, 2.0))
    raise last_error


def parse_positive_int(name, default=None):
    raw = os.environ.get(name, default)
    try:
        value = int(str(raw))
    except (TypeError, ValueError):
        fail(f"{name} must be a positive integer")
    if value <= 0:
        fail(f"{name} must be a positive integer")
    return value


def normalize_base_url(value):
    value = (value or "").strip().rstrip("/")
    if not (value.startswith("http://") or value.startswith("https://")):
        fail("SOURCELENS_BASE_URL must start with http:// or https://")
    if " " in value or "\t" in value or "\n" in value:
        fail("SOURCELENS_BASE_URL must not contain whitespace")
    return value


BASE_URL = normalize_base_url(os.environ.get("SOURCELENS_BASE_URL", "http://localhost:8080"))
API_BASE = BASE_URL + "/api"
REPO_URL = os.environ["SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL"].strip()
BRANCH = os.environ["SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH"].strip()
TIMEOUT_SECONDS = parse_positive_int("SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS", "600")
POLL_SECONDS = parse_positive_int("SOURCELENS_PUBLIC_REPO_SMOKE_POLL_SECONDS", "3")
DB_COUNTS_MODE = os.environ.get("SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS", "auto").strip().lower()
ARTIFACT_QUALITY_MODE = os.environ.get("SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY", "auto").strip().lower()
CLEANUP = os.environ.get("SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP", "false").strip().lower() == "true"
RUN_UI_SMOKE = os.environ.get("SOURCELENS_PUBLIC_REPO_SMOKE_UI", "false").strip().lower() == "true"
WEAK_KEYWORD_EVAL_MODE = os.environ.get("SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL", "auto").strip().lower()
WEAK_KEYWORD_EVAL_MIN_SEMANTIC_FALLBACK = parse_positive_int(
    "SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_MIN_SEMANTIC_FALLBACK", "1"
)
WEAK_KEYWORD_EVAL_CONFIGURE_MOCK = os.environ.get(
    "SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_CONFIGURE_MOCK", "false"
).strip().lower()
SEMANTIC_PROBE_MODE = os.environ.get("SOURCELENS_PUBLIC_REPO_SMOKE_SEMANTIC_PROBE", "auto").strip().lower()
CLAIM_NOISE_MODE = os.environ.get("SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE", "auto").strip().lower()
CLAIM_NOISE_CONFIGURE_MOCK = os.environ.get("SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE_CONFIGURE_MOCK", "true").strip().lower()
REPORT_EVIDENCE_QA_CITATION_MODE = os.environ.get(
    "SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION", "auto"
).strip().lower()
SOURCE_ROLE_QUERY = os.environ.get(
    "SOURCELENS_PUBLIC_REPO_SMOKE_SOURCE_ROLE_QUERY",
    "controller service repository",
).strip()
CODE_QA_QUESTION = os.environ.get(
    "SOURCELENS_PUBLIC_REPO_SMOKE_CODE_QA_QUESTION",
    "Controller Service Repository 业务流程",
).strip()
CROSS_FILE_PROOF_QUERY = os.environ.get(
    "SOURCELENS_PUBLIC_REPO_SMOKE_CROSS_FILE_PROOF_QUERY",
    "",
).strip()
try:
    CROSS_FILE_MIN_MAIN_SOURCE_FILES = int(os.environ.get(
        "SOURCELENS_PUBLIC_REPO_SMOKE_CROSS_FILE_MIN_MAIN_SOURCE_FILES",
        "0",
    ))
except ValueError:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_CROSS_FILE_MIN_MAIN_SOURCE_FILES must be a non-negative integer")
if CROSS_FILE_MIN_MAIN_SOURCE_FILES < 0:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_CROSS_FILE_MIN_MAIN_SOURCE_FILES must be a non-negative integer")
try:
    CROSS_FILE_MIN_SOURCE_FILES = int(os.environ.get(
        "SOURCELENS_PUBLIC_REPO_SMOKE_CROSS_FILE_MIN_SOURCE_FILES",
        "0",
    ))
except ValueError:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_CROSS_FILE_MIN_SOURCE_FILES must be a non-negative integer")
if CROSS_FILE_MIN_SOURCE_FILES < 0:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_CROSS_FILE_MIN_SOURCE_FILES must be a non-negative integer")
ROLE_PROBES = {
    item.strip()
    for item in os.environ.get(
        "SOURCELENS_PUBLIC_REPO_SMOKE_REQUIRED_ROLE_PROBES",
        "controller,service,dataAccess",
    ).split(",")
    if item.strip()
}
unknown_role_probes = ROLE_PROBES - {"controller", "service", "dataAccess"}
if unknown_role_probes:
    fail(f"SOURCELENS_PUBLIC_REPO_SMOKE_REQUIRED_ROLE_PROBES contains unknown probes: {sorted(unknown_role_probes)}")
MYSQL_CONTAINER = os.environ.get("SOURCELENS_MYSQL_CONTAINER", "sourcelens-mysql").strip()
BACKEND_CONTAINER = os.environ.get("SOURCELENS_ARTIFACT_QUALITY_BACKEND_CONTAINER", "sourcelens-backend").strip()
REPO_ROOT = os.environ.get("SOURCELENS_REPO_ROOT", os.getcwd()).strip() or os.getcwd()

if DB_COUNTS_MODE not in {"auto", "true", "false"}:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS must be auto, true, or false")
if ARTIFACT_QUALITY_MODE not in {"auto", "true", "false"}:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY must be auto, true, or false")
if WEAK_KEYWORD_EVAL_MODE not in {"auto", "true", "false"}:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL must be auto, true, or false")
if WEAK_KEYWORD_EVAL_CONFIGURE_MOCK not in {"true", "false"}:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_CONFIGURE_MOCK must be true or false")
if SEMANTIC_PROBE_MODE not in {"auto", "true", "false"}:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_SEMANTIC_PROBE must be auto, true, or false")
if CLAIM_NOISE_MODE not in {"auto", "true", "false"}:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE must be auto, true, or false")
if CLAIM_NOISE_CONFIGURE_MOCK not in {"true", "false"}:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE_CONFIGURE_MOCK must be true or false")
if REPORT_EVIDENCE_QA_CITATION_MODE not in {"auto", "true", "false"}:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION must be auto, true, or false")
if not REPO_URL:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL must not be empty")
if not BRANCH:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH must not be empty")
if not SOURCE_ROLE_QUERY:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_SOURCE_ROLE_QUERY must not be empty")
if not CODE_QA_QUESTION:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_CODE_QA_QUESTION must not be empty")


def request(method, path, data=None, token=None, base=API_BASE, timeout=60, transient_statuses=None):
    body = None
    headers = {"Accept": "application/json"}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(base + path, data=body, headers=headers, method=method)
    try:
        with urlopen_with_retries(req, timeout=timeout) as resp:
            text = resp.read().decode("utf-8")
            payload = json.loads(text) if text else None
            if isinstance(payload, dict) and payload.get("code") not in (None, "SUCCESS"):
                fail(f"{method} {path} returned {payload.get('code')}: {payload.get('message')}")
            return payload
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        if transient_statuses and exc.code in transient_statuses:
            raise TransientHttpStatus(exc.code, text)
        fail(f"{method} {path} HTTP {exc.code}: {text}")
    except urllib.error.URLError as exc:
        fail(f"{method} {path} failed: {exc}")


def request_text(method, path, token=None, base=API_BASE, timeout=60):
    headers = {"Accept": "application/json, text/plain, */*"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(base + path, headers=headers, method=method)
    try:
        with urlopen_with_retries(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        fail(f"{method} {path} HTTP {exc.code}: {text}")
    except urllib.error.URLError as exc:
        fail(f"{method} {path} failed: {exc}")


def request_optional(method, path, data=None, token=None, base=API_BASE, timeout=60):
    body = None
    headers = {"Accept": "application/json"}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(base + path, data=body, headers=headers, method=method)
    try:
        with urlopen_with_retries(req, timeout=timeout) as resp:
            text = resp.read().decode("utf-8")
            payload = json.loads(text) if text else None
            if isinstance(payload, dict) and payload.get("code") not in (None, "SUCCESS"):
                return False, None, f"{payload.get('code')}: {payload.get('message')}"
            return True, payload, None
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        return False, None, f"HTTP {exc.code}: {text}"
    except urllib.error.URLError as exc:
        return False, None, str(exc)


def request_with_transient_status_retries(method, path, data=None, token=None, base=API_BASE, timeout=60,
                                          transient_statuses=None, attempts=5):
    transient_statuses = transient_statuses or {503}
    for attempt in range(1, attempts + 1):
        try:
            return request(
                method,
                path,
                data=data,
                token=token,
                base=base,
                timeout=timeout,
                transient_statuses=transient_statuses,
            )
        except TransientHttpStatus as exc:
            if attempt >= attempts:
                fail(f"{method} {path} HTTP {exc.status}: {exc.body}")
            print(f"      retry {method} {path} after HTTP {exc.status} ({attempt}/{attempts})", flush=True)
            time.sleep(min(POLL_SECONDS, 1 + attempt))


def api_query(path, params):
    encoded = urllib.parse.urlencode(params)
    return path + ("?" + encoded if encoded else "")


def probe_health():
    try:
        with urlopen_with_retries(BASE_URL + "/actuator/health", timeout=10) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
            if payload.get("status") != "UP":
                fail(f"/actuator/health did not report UP: {payload}")
    except Exception as exc:
        fail(f"{BASE_URL}/actuator/health is not reachable: {exc}")


def docker_container_running(name):
    if not name:
        return False
    if shutil.which("docker") is None:
        return False
    proc = subprocess.run(
        ["docker", "inspect", "-f", "{{.State.Running}}", name],
        text=True,
        capture_output=True,
        timeout=15,
    )
    return proc.returncode == 0 and proc.stdout.strip() == "true"


def run_mysql(sql, timeout=45):
    proc = subprocess.run(
        [
            "docker", "exec", "-e", f"SQL={sql}", MYSQL_CONTAINER,
            "sh", "-lc",
            'MYSQL_PWD="$MYSQL_PASSWORD" mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" "$MYSQL_DATABASE" -N -e "$SQL"',
        ],
        text=True,
        capture_output=True,
        timeout=timeout,
    )
    if proc.returncode != 0:
        return None, proc.stderr.strip() or proc.stdout.strip()
    return proc.stdout, None


def query_db_counts(scan_task_id, artifact_count, artifact_record_count):
    if DB_COUNTS_MODE == "false":
        return {}
    if shutil.which("docker") is None:
        if DB_COUNTS_MODE == "true":
            fail("docker is required for DB count checks")
        print("DB counts skipped: docker is not available")
        return {}
    if not docker_container_running(MYSQL_CONTAINER):
        if DB_COUNTS_MODE == "true":
            fail(f"MySQL container {MYSQL_CONTAINER} is not running")
        print(f"DB counts skipped: container {MYSQL_CONTAINER} is not running")
        return {}

    sql = (
        f"select 'chunks', count(*) from code_chunks where scan_task_id={int(scan_task_id)}; "
        f"select 'symbols', count(*) from code_symbols where scan_task_id={int(scan_task_id)}; "
        f"select 'relations', count(*) from code_relations where scan_task_id={int(scan_task_id)}; "
        f"select 'scan_artifacts', count(*) from scan_artifacts where scan_task_id={int(scan_task_id)}; "
        f"select 'artifact_records', count(*) from artifact_records "
        f"where owner_type='SCAN_TASK' and owner_id={int(scan_task_id)};"
    )
    stdout, error = run_mysql(sql)
    if error:
        fail(f"DB count query failed: {error}")

    counts = {}
    for line in stdout.splitlines():
        parts = line.split()
        if len(parts) >= 2:
            counts[parts[0]] = int(parts[1])

    if counts.get("chunks", 0) <= 0:
        fail("code_chunks count is zero after successful scan")
    if counts.get("symbols", 0) <= 0:
        fail("code_symbols count is zero after successful scan")
    if counts.get("scan_artifacts") != artifact_count:
        fail(f"scan_artifacts count mismatch: db={counts.get('scan_artifacts')} api={artifact_count}")
    if counts.get("artifact_records") != artifact_record_count:
        fail(f"artifact_records count mismatch: db={counts.get('artifact_records')} api={artifact_record_count}")
    return counts


def validate_artifact_quality(scan_task_id):
    if ARTIFACT_QUALITY_MODE == "false":
        return {"status": "DISABLED"}
    if shutil.which("docker") is None:
        if ARTIFACT_QUALITY_MODE == "true":
            fail("docker is required for artifact quality check")
        print("Artifact quality check skipped: docker is not available")
        return {"status": "SKIPPED", "reason": "docker_unavailable"}
    if not docker_container_running(MYSQL_CONTAINER):
        if ARTIFACT_QUALITY_MODE == "true":
            fail(f"MySQL container {MYSQL_CONTAINER} is not running for artifact quality check")
        print(f"Artifact quality check skipped: container {MYSQL_CONTAINER} is not running")
        return {"status": "SKIPPED", "reason": "mysql_container_unavailable"}
    if shutil.which("node") is None:
        if ARTIFACT_QUALITY_MODE == "true":
            fail("node is required for artifact quality check")
        print("Artifact quality check skipped: node is not available")
        return {"status": "SKIPPED", "reason": "node_unavailable"}
    script_path = os.path.join(REPO_ROOT, "scripts", "artifact-quality-check.sh")
    if not os.path.isfile(script_path):
        if ARTIFACT_QUALITY_MODE == "true":
            fail(f"artifact quality script is missing: {script_path}")
        print(f"Artifact quality check skipped: script is missing at {script_path}")
        return {"status": "SKIPPED", "reason": "script_missing"}

    env = os.environ.copy()
    env["SOURCELENS_ARTIFACT_QUALITY_SCAN_TASK_ID"] = str(int(scan_task_id))
    env["SOURCELENS_ARTIFACT_QUALITY_MYSQL_CONTAINER"] = MYSQL_CONTAINER
    env["SOURCELENS_ARTIFACT_QUALITY_BACKEND_CONTAINER"] = BACKEND_CONTAINER
    proc = subprocess.run(
        ["bash", script_path],
        cwd=REPO_ROOT,
        env=env,
        text=True,
        capture_output=True,
        timeout=120,
    )
    if proc.stdout.strip():
        print(proc.stdout.strip(), flush=True)
    if proc.returncode != 0:
        message = (proc.stderr or proc.stdout).strip()
        fail(f"artifact quality check failed: {message}")
    checked = sum(1 for line in proc.stdout.splitlines() if line.startswith("ARTIFACT OK:"))
    if checked <= 0:
        fail("artifact quality check did not validate any JSON artifacts")
    return {"status": "OK", "checkedArtifacts": checked}


def validate_report_quality(project_id, records, scan_task_id, token):
    report_record = next((record for record in records if record.get("artifactType") == "ARCHITECTURE_REPORT"), None)
    if not report_record:
        fail("ARCHITECTURE_REPORT artifact record is missing")
    text = request_text(
        "GET",
        f"/projects/{project_id}/artifacts/{report_record['id']}/download?rawDownloadAcknowledged=true",
        token=token,
    )
    try:
        report = json.loads(text or "{}")
    except json.JSONDecodeError as exc:
        fail(f"ARCHITECTURE_REPORT preview is not valid JSON: {exc}")

    quality = report.get("reportQuality")
    if not isinstance(quality, dict):
        fail("ARCHITECTURE_REPORT.reportQuality is missing or not an object")
    readiness = quality.get("readiness")
    if readiness not in {"READY", "REVIEW", "RISK"}:
        fail(f"ARCHITECTURE_REPORT.reportQuality.readiness is invalid: {readiness}")
    confidence = quality.get("confidence")
    if not isinstance(confidence, int) or confidence < 0 or confidence > 100:
        fail(f"ARCHITECTURE_REPORT.reportQuality.confidence is invalid: {confidence}")
    if confidence < 35:
        fail(f"ARCHITECTURE_REPORT.reportQuality.confidence is too low for a successful public repo scan: {confidence}")
    summary = quality.get("summary")
    if not isinstance(summary, str) or not summary.strip():
        fail("ARCHITECTURE_REPORT.reportQuality.summary is missing or empty")
    gaps = quality.get("gaps")
    if not isinstance(gaps, list) or any(not isinstance(item, str) or not item.strip() for item in gaps):
        fail("ARCHITECTURE_REPORT.reportQuality.gaps must be an array of non-empty strings")
    next_actions = quality.get("nextActions")
    if (not isinstance(next_actions, list)
            or not next_actions
            or any(not isinstance(item, str) or not item.strip() for item in next_actions)):
        fail("ARCHITECTURE_REPORT.reportQuality.nextActions must contain non-empty action strings")
    evidence_checks = quality.get("evidenceChecks")
    if not isinstance(evidence_checks, list) or not evidence_checks:
        fail("ARCHITECTURE_REPORT.reportQuality.evidenceChecks is empty")
    incomplete_checks = [
        item.get("key") if isinstance(item, dict) else f"index:{index}"
        for index, item in enumerate(evidence_checks)
        if not is_complete_evidence_check(item)
    ]
    if incomplete_checks:
        fail(f"ARCHITECTURE_REPORT.reportQuality evidence checks are incomplete: {incomplete_checks}")
    required_checks = {"scan_scope", "test_signal", "module_map", "api_data_surface", "fingerprint", "risk_signal"}
    check_keys = {item.get("key") for item in evidence_checks if isinstance(item, dict)}
    missing_checks = sorted(required_checks - check_keys)
    if missing_checks:
        fail(f"ARCHITECTURE_REPORT.reportQuality missing evidence checks: {missing_checks}")
    report_citation_quality = validate_report_citation_quality(report, quality, scan_task_id, required_checks)
    return {
        "readiness": readiness,
        "confidence": confidence,
        "gaps": len(gaps),
        "nextActions": len(next_actions),
        "evidenceChecks": len(evidence_checks),
        "reportCitationQuality": report_citation_quality,
    }, report


def validate_report_citation_quality(report, quality, scan_task_id, required_checks):
    evidence_checks = quality.get("evidenceChecks")
    checks_by_key = {
        item.get("key"): item
        for item in evidence_checks
        if isinstance(item, dict) and isinstance(item.get("key"), str)
    }

    def checked(key):
        item = checks_by_key.get(key)
        if not isinstance(item, dict):
            fail(f"ARCHITECTURE_REPORT.reportCitationQuality missing evidence check: {key}")
        return item

    def int_field(source, field, label):
        if not isinstance(source, dict) or not isinstance(source.get(field), int):
            fail(f"ARCHITECTURE_REPORT.reportCitationQuality {label}.{field} must be an integer")
        return int(source.get(field))

    overview = report.get("overview")
    modules = report.get("modules")
    api_routes = report.get("apiRoutes")
    db_entities = report.get("dbEntities")
    scan_fingerprint = report.get("scanFingerprint")
    code_quality = report.get("codeQuality")
    gaps = quality.get("gaps")
    next_actions = quality.get("nextActions")
    summary = str(quality.get("summary") or "")

    total_files = int_field(overview, "totalFiles", "overview")
    total_lines = int_field(overview, "totalLines", "overview")
    scan_scope_value = str(checked("scan_scope").get("value") or "")
    if f"{total_files} files" not in scan_scope_value or f"{total_lines} lines" not in scan_scope_value:
        fail("ARCHITECTURE_REPORT.reportCitationQuality scan_scope evidence is not bound to overview totals")

    test_files = int_field(overview, "testFiles", "overview")
    test_signal_value = str(checked("test_signal").get("value") or "")
    if f"{test_files} test files" not in test_signal_value:
        fail("ARCHITECTURE_REPORT.reportCitationQuality test_signal evidence is not bound to overview testFiles")

    module_count = sum(int_field(modules, field, "modules") for field in ("controllers", "services", "repositories", "entities"))
    module_value = str(checked("module_map").get("value") or "")
    if f"{module_count} modules" not in module_value:
        fail("ARCHITECTURE_REPORT.reportCitationQuality module_map evidence is not bound to module counts")

    if not isinstance(api_routes, list):
        fail("ARCHITECTURE_REPORT.reportCitationQuality apiRoutes must be an array")
    if not isinstance(db_entities, list):
        fail("ARCHITECTURE_REPORT.reportCitationQuality dbEntities must be an array")
    api_surface_value = str(checked("api_data_surface").get("value") or "")
    if f"{len(api_routes)} APIs" not in api_surface_value or f"{len(db_entities)} DB entities" not in api_surface_value:
        fail("ARCHITECTURE_REPORT.reportCitationQuality api_data_surface evidence is not bound to API/DB sections")

    fingerprint_check = checked("fingerprint")
    fingerprint_value = str(fingerprint_check.get("value") or "")
    has_fingerprint = isinstance(scan_fingerprint, dict) and isinstance(scan_fingerprint.get("repoContentHash"), str) and scan_fingerprint.get("repoContentHash").strip()
    if has_fingerprint and fingerprint_value != "present":
        fail("ARCHITECTURE_REPORT.reportCitationQuality fingerprint evidence must be present when scanFingerprint exists")
    if not has_fingerprint and fingerprint_value != "missing":
        fail("ARCHITECTURE_REPORT.reportCitationQuality fingerprint evidence must be missing when scanFingerprint is absent")

    risks = []
    if isinstance(code_quality, dict) and isinstance(code_quality.get("risks"), list):
        risks = code_quality.get("risks")
    risk_value = str(checked("risk_signal").get("value") or "")
    if f"{len(risks)} risks" not in risk_value:
        fail("ARCHITECTURE_REPORT.reportCitationQuality risk_signal evidence is not bound to codeQuality.risks")
    high_risk_count = sum(1 for risk in risks if isinstance(risk, dict) and str(risk.get("severity") or "").upper() == "HIGH")
    medium_risk_count = sum(1 for risk in risks if isinstance(risk, dict) and str(risk.get("severity") or "").upper() == "MEDIUM")
    reported_high_risk_count = int_field(quality, "highRiskCount", "reportQuality")
    reported_medium_risk_count = int_field(quality, "mediumRiskCount", "reportQuality")
    if reported_high_risk_count != high_risk_count:
        fail("ARCHITECTURE_REPORT.reportCitationQuality highRiskCount is not bound to codeQuality.risks")
    if reported_medium_risk_count != medium_risk_count:
        fail("ARCHITECTURE_REPORT.reportCitationQuality mediumRiskCount is not bound to codeQuality.risks")

    technical_debt = report.get("technicalDebt")
    suggestions = report.get("suggestions")
    if not isinstance(technical_debt, list):
        fail("ARCHITECTURE_REPORT.reportCitationQuality technicalDebt must be an array")
    if not isinstance(suggestions, list):
        fail("ARCHITECTURE_REPORT.reportCitationQuality suggestions must be an array")
    reported_technical_debt_count = int_field(quality, "technicalDebtCount", "reportQuality")
    reported_suggestion_count = int_field(quality, "suggestionCount", "reportQuality")
    if reported_technical_debt_count != len(technical_debt):
        fail("ARCHITECTURE_REPORT.reportCitationQuality technicalDebtCount is not bound to technicalDebt")
    if reported_suggestion_count != len(suggestions):
        fail("ARCHITECTURE_REPORT.reportCitationQuality suggestionCount is not bound to suggestions")

    if not isinstance(gaps, list):
        fail("ARCHITECTURE_REPORT.reportCitationQuality gaps must be an array")
    if not isinstance(next_actions, list) or not next_actions:
        fail("ARCHITECTURE_REPORT.reportCitationQuality nextActions must be a non-empty array")
    if high_risk_count > 0 and "风险" not in summary:
        fail("ARCHITECTURE_REPORT.reportCitationQuality summary must mention risk when high risk evidence exists")
    if high_risk_count > 0 and not any("风险" in str(action) for action in next_actions):
        fail("ARCHITECTURE_REPORT.reportCitationQuality nextActions must mention risk when high risk evidence exists")

    narrative_bindings = [
        {
            "key": "summary_risk_posture",
            "sourceSection": "reportQuality.summary/codeQuality.risks",
            "sourceMetric": "highRiskCount",
            "reportedCount": reported_high_risk_count,
            "actualCount": high_risk_count,
            "status": "BOUND",
        },
        {
            "key": "high_risk_count",
            "sourceSection": "codeQuality.risks",
            "sourceMetric": "severity=HIGH",
            "reportedCount": reported_high_risk_count,
            "actualCount": high_risk_count,
            "status": "BOUND",
        },
        {
            "key": "medium_risk_count",
            "sourceSection": "codeQuality.risks",
            "sourceMetric": "severity=MEDIUM",
            "reportedCount": reported_medium_risk_count,
            "actualCount": medium_risk_count,
            "status": "BOUND",
        },
        {
            "key": "technical_debt_count",
            "sourceSection": "technicalDebt",
            "sourceMetric": "array.length",
            "reportedCount": reported_technical_debt_count,
            "actualCount": len(technical_debt),
            "status": "BOUND",
        },
        {
            "key": "suggestion_count",
            "sourceSection": "suggestions",
            "sourceMetric": "array.length",
            "reportedCount": reported_suggestion_count,
            "actualCount": len(suggestions),
            "status": "BOUND",
        },
        {
            "key": "next_actions_risk_priority",
            "sourceSection": "reportQuality.nextActions/codeQuality.risks",
            "sourceMetric": "risk-priority-action",
            "reportedCount": len(next_actions),
            "actualCount": len(next_actions),
            "status": "BOUND",
        },
    ]

    binding_sections = {
        "scan_scope": "overview",
        "test_signal": "overview",
        "module_map": "modules",
        "api_data_surface": "apiRoutes/dbEntities",
        "fingerprint": "scanFingerprint",
        "risk_signal": "codeQuality.risks",
    }
    section_bindings = [
        {
            "key": key,
            "sourceSection": binding_sections[key],
            "status": checked(key).get("status"),
        }
        for key in sorted(required_checks)
    ]
    return {
        "status": "OK",
        "artifactType": "ARCHITECTURE_REPORT",
        "scanTaskId": scan_task_id,
        "requiredCheckCount": len(required_checks),
        "boundCheckCount": len(section_bindings),
        "evidenceCheckKeys": sorted(required_checks),
        "sectionBindings": section_bindings,
        "overviewBound": True,
        "moduleMapBound": True,
        "apiDataSurfaceBound": True,
        "fingerprintBound": True,
        "riskSignalBound": True,
        "nextActionsBound": True,
        "narrativeBindingStatus": "ALL_BOUND",
        "requiredNarrativeBindingCount": len(narrative_bindings),
        "narrativeBindingCount": len(narrative_bindings),
        "narrativeBindings": narrative_bindings,
        "noRawPromptOrAnswer": True,
        "providerQualityClaim": False,
        "llmFactClaim": False,
    }


def safe_relative_path(path):
    if not isinstance(path, str) or not path.strip():
        return False
    if path != path.strip() or path.startswith("/") or "\\" in path or "?" in path or "#" in path:
        return False
    return not any(part in {"", ".", ".."} for part in path.split("/"))


def positive_int(value):
    try:
        parsed = int(str(value))
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


def line_overlaps(line, item):
    start_line = positive_int(item.get("startLine")) if isinstance(item, dict) else None
    end_line = positive_int(item.get("endLine")) if isinstance(item, dict) else None
    if start_line is None or end_line is None:
        return False
    return start_line <= int(line) <= end_line


def line_anchor_mode(evidence_ref):
    if not isinstance(evidence_ref, dict):
        return None
    line_number = positive_int(evidence_ref.get("lineNumber"))
    start_line = positive_int(evidence_ref.get("startLine"))
    end_line = positive_int(evidence_ref.get("endLine"))
    if line_number is not None:
        return "LINE_NUMBER"
    if start_line is not None and end_line is not None and end_line >= start_line:
        return "START_END_ONLY"
    return None


def report_scalar(value, limit=160):
    text = str(value or "").strip()
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text[:limit]


def resolve_report_route_anchor(project_id, scan_task_id, token, route):
    if not isinstance(route, dict):
        return None
    class_name = report_scalar(route.get("handler_class") or route.get("handlerClass"), 120)
    method_name = report_scalar(route.get("handler_method") or route.get("handlerMethod"), 120)
    line_number = positive_int(route.get("line_number") or route.get("lineNumber"))
    if not class_name or not method_name or line_number is None:
        return None
    search = request(
        "GET",
        api_query(
            f"/projects/{project_id}/code-chunks/search",
            {"scanTaskId": scan_task_id, "query": f"{class_name}#{method_name}", "limit": 8},
        ),
        token=token,
    )["data"]
    items = search.get("items")
    if not isinstance(items, list) or not items:
        return None
    expected_file_name = f"{class_name}.java"
    matched = next(
        (
            item for item in items
            if isinstance(item, dict)
            and safe_relative_path(str(item.get("filePath") or ""))
            and file_name(str(item.get("filePath") or "")) == expected_file_name
            and line_overlaps(line_number, item)
        ),
        None,
    )
    if not matched:
        return None
    http_method = report_scalar(route.get("method"), 24)
    route_path = report_scalar(route.get("path"), 180)
    title = " ".join(part for part in (http_method, route_path) if part) or f"{class_name}#{method_name}"
    return {
        "sourceSection": "apiRoutes",
        "category": "API_ROUTE",
        "source": "ARCHITECTURE_REPORT.apiRoutes",
        "title": title,
        "summary": f"{class_name}#{method_name}",
        "filePath": matched.get("filePath"),
        "lineNumber": str(line_number),
        "handlerClass": class_name,
        "handlerMethod": method_name,
    }


def collect_report_evidence_qa_candidates(project_id, scan_task_id, token, report):
    candidates = []
    seen = set()

    def add(candidate):
        if not isinstance(candidate, dict):
            return
        file_path = str(candidate.get("filePath") or "").strip()
        line_number = positive_int(candidate.get("lineNumber"))
        if not safe_relative_path(file_path) or line_number is None:
            return
        key = (file_path, line_number)
        if key in seen:
            return
        seen.add(key)
        candidate["lineNumber"] = str(line_number)
        candidates.append(candidate)

    api_routes = report.get("apiRoutes") if isinstance(report, dict) else None
    if isinstance(api_routes, list):
        scanned_routes = 0
        for route in api_routes:
            scanned_routes += 1
            add(resolve_report_route_anchor(project_id, scan_task_id, token, route))
            candidate_files = {candidate["filePath"] for candidate in candidates}
            if len(candidates) >= 12 and len(candidate_files) >= 4:
                break
            if scanned_routes >= 80 and len(candidates) >= 4:
                break

    return candidates


def select_report_evidence_qa_samples(candidates, target_count=4):
    selected = []
    selected_keys = set()
    selected_files = set()

    def add_selected(candidate):
        file_path = str(candidate.get("filePath") or "").strip()
        line_number = positive_int(candidate.get("lineNumber"))
        if not safe_relative_path(file_path) or line_number is None:
            return False
        key = (file_path, line_number)
        if key in selected_keys:
            return False
        selected.append(candidate)
        selected_keys.add(key)
        selected_files.add(file_path)
        return True

    for candidate in candidates:
        if len(selected) >= target_count:
            break
        file_path = str(candidate.get("filePath") or "").strip()
        if file_path and file_path not in selected_files:
            add_selected(candidate)

    for candidate in candidates:
        if len(selected) >= target_count:
            break
        add_selected(candidate)

    return selected


def ensure_no_raw_retrieved_chunk_content(payload, label):
    chunks = payload.get("retrievedChunks") if isinstance(payload, dict) else None
    if not isinstance(chunks, list):
        fail(f"{label} retrievedChunks must be a list before raw content boundary validation")
    raw_content_indexes = [
        index
        for index, item in enumerate(chunks, start=1)
        if isinstance(item, dict) and "content" in item
    ]
    if raw_content_indexes:
        fail(f"{label} retrievedChunks must not expose raw content fields: indexes={raw_content_indexes}")
    oversized_preview_indexes = [
        index
        for index, item in enumerate(chunks, start=1)
        if isinstance(item, dict)
        and isinstance(item.get("contentPreview"), str)
        and len(item.get("contentPreview")) > 700
    ]
    if oversized_preview_indexes:
        fail(f"{label} contentPreview must stay server-truncated: indexes={oversized_preview_indexes}")
    return {
        "rawRetrievedChunkContentAbsent": True,
        "contentPreviewMaxLength": max(
            [
                len(item.get("contentPreview"))
                for item in chunks
                if isinstance(item, dict) and isinstance(item.get("contentPreview"), str)
            ]
            or [0]
        ),
    }


def validate_report_evidence_qa_payload(payload, sample, scan_task_id, sample_index, evidence_ref, question):
    label = f"Report evidence QA citation sample #{sample_index}"
    evidence_ref_mode = line_anchor_mode(evidence_ref)
    if evidence_ref_mode not in {"LINE_NUMBER", "START_END_ONLY"}:
        fail(f"{label} evidenceRef must use lineNumber or startLine/endLine")
    request_line_number_present = evidence_ref.get("lineNumber") not in (None, "")
    request_start_line = positive_int(evidence_ref.get("startLine"))
    request_end_line = positive_int(evidence_ref.get("endLine"))
    request_start_end_present = request_start_line is not None and request_end_line is not None
    if evidence_ref_mode == "LINE_NUMBER":
        if positive_int(evidence_ref.get("lineNumber")) != positive_int(sample.get("lineNumber")):
            fail(f"{label} lineNumber evidenceRef must match report evidence line")
        if request_start_end_present:
            fail(f"{label} lineNumber evidenceRef must not also send startLine/endLine")
    else:
        if request_line_number_present:
            fail(f"{label} START_END_ONLY evidenceRef must not send lineNumber")
        if request_start_line is None or request_end_line is None or request_end_line < request_start_line:
            fail(f"{label} START_END_ONLY evidenceRef must send a valid startLine/endLine")
        if not (request_start_line <= int(sample.get("lineNumber")) <= request_end_line):
            fail(f"{label} START_END_ONLY evidenceRef range must cover the report evidence line")

    if payload.get("scanTaskId") != scan_task_id:
        fail(f"{label} used unexpected scanTaskId: {payload.get('scanTaskId')} expected {scan_task_id}")
    if payload.get("sourceEvidenceMatchType") != "REPORT_LINE_ANCHOR":
        fail(f"{label} sourceEvidenceMatchType must be REPORT_LINE_ANCHOR: {payload.get('sourceEvidenceMatchType')}")
    if payload.get("sourceEvidenceMatched") is not True:
        fail(f"{label} sourceEvidenceMatched must be true")
    if payload.get("groundingStatus") != "VERIFIED":
        fail(f"{label} groundingStatus must be VERIFIED: {payload.get('groundingStatus')}")
    citation_enforcement_status = payload.get("citationEnforcementStatus")
    if citation_enforcement_status not in {"DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_CITED"}:
        fail(f"{label} citationEnforcementStatus is not acceptable: {citation_enforcement_status}")
    citation_enforcement_reason = payload.get("citationEnforcementReason")
    if citation_enforcement_reason not in {"DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_PRIMARY_CITED"}:
        fail(f"{label} citationEnforcementReason is not acceptable: {citation_enforcement_reason}")
    result_count = int(payload.get("resultCount") or 0)
    if result_count <= 0:
        fail(f"{label} resultCount must be positive")
    citations = payload.get("answerCitations")
    if not isinstance(citations, list) or not citations:
        fail(f"{label} answerCitations must be non-empty")
    cited_citations = [item for item in citations if isinstance(item, dict) and item.get("citedByAnswer") is True]
    if not cited_citations:
        fail(f"{label} must cite at least one answer citation")
    if any(item.get("scanTaskId") != scan_task_id for item in citations if isinstance(item, dict)):
        fail(f"{label} citations must stay bound to the current scanTaskId")
    source_evidence_ref = payload.get("sourceEvidenceRef")
    if not isinstance(source_evidence_ref, dict):
        fail(f"{label} sourceEvidenceRef must be echoed in the QA response")
    if source_evidence_ref.get("filePath") != sample.get("filePath"):
        fail(f"{label} sourceEvidenceRef.filePath must match report evidence")
    if source_evidence_ref.get("category") != evidence_ref.get("category"):
        fail(f"{label} sourceEvidenceRef.category must match request evidenceRef")
    if source_evidence_ref.get("title") != evidence_ref.get("title"):
        fail(f"{label} sourceEvidenceRef.title must match request evidenceRef")
    source_line_number_present = source_evidence_ref.get("lineNumber") not in (None, "")
    source_start_line = positive_int(source_evidence_ref.get("startLine"))
    source_end_line = positive_int(source_evidence_ref.get("endLine"))
    source_start_end_present = source_start_line is not None and source_end_line is not None
    if evidence_ref_mode == "LINE_NUMBER":
        if not source_line_number_present or positive_int(source_evidence_ref.get("lineNumber")) != positive_int(sample.get("lineNumber")):
            fail(f"{label} lineNumber sourceEvidenceRef must echo the report evidence line")
        if source_start_end_present:
            fail(f"{label} lineNumber sourceEvidenceRef must not synthesize startLine/endLine")
    else:
        if source_line_number_present:
            fail(f"{label} START_END_ONLY sourceEvidenceRef must not synthesize lineNumber")
        if source_start_line != request_start_line or source_end_line != request_end_line:
            fail(f"{label} START_END_ONLY sourceEvidenceRef must echo startLine/endLine")

    narrative_evidence_fields = [
        key for key in ("category", "source", "title", "summary", "filePath")
        if evidence_ref.get(key) not in (None, "")
    ]
    if request_line_number_present or request_start_end_present:
        narrative_evidence_fields.append("lineAnchor")
    narrative_evidence_ref_field_count = len(narrative_evidence_fields)
    narrative_question_bound = (
        sample.get("filePath") in question
        and str(sample.get("lineNumber")) in question
        and str(sample.get("handlerClass") or "") in question
        and str(sample.get("handlerMethod") or "") in question
    )
    if sample.get("sourceSection") != "apiRoutes":
        fail(f"{label} narrative sourceSection must be apiRoutes for report evidence QA samples")
    if narrative_evidence_ref_field_count < 6:
        fail(f"{label} evidenceRef must carry all narrative binding fields")
    if not narrative_question_bound:
        fail(f"{label} question must stay bound to handler/file/line narrative evidence")
    sample_file_path = sample["filePath"]
    sample_line_number = int(sample["lineNumber"])
    line_anchor_cited_citations = [
        item for item in cited_citations
        if item.get("filePath") == sample_file_path and line_overlaps(sample_line_number, item)
    ]
    line_anchor_primary_cited_citations = [
        item for item in line_anchor_cited_citations
        if item.get("contextRole") == "PRIMARY"
    ]
    line_anchor_cited_count = len(line_anchor_cited_citations)
    line_anchor_primary_cited_count = len(line_anchor_primary_cited_citations)
    if line_anchor_cited_count <= 0:
        fail(f"{label} must cite the same filePath and lineNumber as the report evidence")
    if line_anchor_primary_cited_count <= 0:
        fail(f"{label} must cite the report evidence line anchor as PRIMARY context")
    line_anchor_primary_citation = line_anchor_primary_cited_citations[0]
    line_anchor_evidence_reason = str(line_anchor_primary_citation.get("evidenceReason") or "")
    if "Report evidence line anchor" not in line_anchor_evidence_reason:
        fail(f"{label} line anchor PRIMARY citation must expose Report evidence line anchor reason")
    chunks = payload.get("retrievedChunks")
    if not isinstance(chunks, list) or not chunks:
        fail(f"{label} retrievedChunks must be non-empty")
    raw_chunk_content_boundary = ensure_no_raw_retrieved_chunk_content(payload, label)
    if any(item.get("scanTaskId") != scan_task_id for item in chunks if isinstance(item, dict)):
        fail(f"{label} retrieved chunks must stay bound to the current scanTaskId")

    citation_coverage = payload.get("citationCoverage")
    if not isinstance(citation_coverage, dict):
        fail(f"{label} citationCoverage is missing")
    required_evidence_count = int(citation_coverage.get("requiredEvidenceCount") or 0)
    cited_required_evidence_count = int(citation_coverage.get("citedRequiredEvidenceCount") or 0)
    required_evidence_coverage_percent = int(citation_coverage.get("requiredEvidenceCoveragePercent") or 0)
    primary_evidence_count = int(citation_coverage.get("primaryEvidenceCount") or 0)
    cited_primary_evidence_count = int(citation_coverage.get("citedPrimaryEvidenceCount") or 0)
    if required_evidence_count <= 0:
        fail(f"{label} citationCoverage.requiredEvidenceCount must be positive")
    if cited_required_evidence_count < required_evidence_count:
        fail(f"{label} citationCoverage.citedRequiredEvidenceCount must cover required evidence")
    if required_evidence_coverage_percent < 100:
        fail(f"{label} citationCoverage.requiredEvidenceCoveragePercent must be at least 100")
    if primary_evidence_count <= 0:
        fail(f"{label} citationCoverage.primaryEvidenceCount must be positive")
    if cited_primary_evidence_count < primary_evidence_count:
        fail(f"{label} citationCoverage.citedPrimaryEvidenceCount must cover primary evidence")
    evidence_role_distribution = citation_coverage.get("evidenceRoleDistribution")
    if not isinstance(evidence_role_distribution, dict):
        fail(f"{label} citationCoverage.evidenceRoleDistribution is missing")
    if evidence_role_distribution.get("status") not in {"PRIMARY_SINGLE_FILE", "PRIMARY_CROSS_FILE", "MIXED_PRIMARY_CONTEXT"}:
        fail(f"{label} evidenceRoleDistribution.status must prove primary evidence: {evidence_role_distribution.get('status')}")

    claim_citation_coverage = payload.get("claimCitationCoverage")
    if not isinstance(claim_citation_coverage, dict):
        fail(f"{label} claimCitationCoverage is missing")
    if claim_citation_coverage.get("status") != "READY":
        fail(f"{label} claimCitationCoverage.status must be READY: {claim_citation_coverage.get('status')}")
    if claim_citation_coverage.get("readyForRepair") is not True:
        fail(f"{label} claimCitationCoverage.readyForRepair must be true")
    if claim_citation_coverage.get("readinessReason") != "PRIMARY_BOUND_READY":
        fail(f"{label} claimCitationCoverage.readinessReason must be PRIMARY_BOUND_READY: {claim_citation_coverage.get('readinessReason')}")
    required_claim_count = int(claim_citation_coverage.get("requiredClaimCount") or 0)
    cited_required_claim_count = int(claim_citation_coverage.get("citedRequiredClaimCount") or 0)
    claim_coverage_percent = int(claim_citation_coverage.get("claimCoveragePercent") or 0)
    if required_claim_count <= 0:
        fail(f"{label} claimCitationCoverage.requiredClaimCount must be positive")
    if cited_required_claim_count != required_claim_count:
        fail(f"{label} claimCitationCoverage.citedRequiredClaimCount must cover required claims")
    if int(claim_citation_coverage.get("uncitedRequiredClaimCount") or 0) != 0:
        fail(f"{label} claimCitationCoverage.uncitedRequiredClaimCount must be 0")
    if int(claim_citation_coverage.get("invalidCitationClaimCount") or 0) != 0:
        fail(f"{label} claimCitationCoverage.invalidCitationClaimCount must be 0")
    if claim_coverage_percent < 100:
        fail(f"{label} claimCitationCoverage.claimCoveragePercent must be at least 100")
    role_distribution = claim_citation_coverage.get("roleDistribution")
    if not isinstance(role_distribution, dict):
        fail(f"{label} claimCitationCoverage.roleDistribution is missing")
    if role_distribution.get("status") != "PRIMARY_BOUND":
        fail(f"{label} claim roleDistribution.status must be PRIMARY_BOUND: {role_distribution.get('status')}")
    required_primary_bound_claim_count = int(role_distribution.get("requiredPrimaryBoundClaimCount") or 0)
    required_primary_file_count = int(role_distribution.get("requiredPrimaryFileCount") or 0)
    if required_primary_bound_claim_count != required_claim_count:
        fail(f"{label} requiredPrimaryBoundClaimCount must cover required claims")
    if required_primary_file_count <= 0:
        fail(f"{label} requiredPrimaryFileCount must be positive")

    return {
        "index": sample_index,
        "evidenceRefMode": evidence_ref_mode,
        "evidenceRefLineNumberPresent": request_line_number_present,
        "evidenceRefStartEndPresent": request_start_end_present,
        "evidenceRefStartLine": request_start_line,
        "evidenceRefEndLine": request_end_line,
        "sourceEvidenceRefLineNumberPresent": source_line_number_present,
        "sourceEvidenceRefStartEndPresent": source_start_end_present,
        "sourceEvidenceRefStartLine": source_start_line,
        "sourceEvidenceRefEndLine": source_end_line,
        "sourceSection": sample["sourceSection"],
        "sourceEvidenceMatchType": payload.get("sourceEvidenceMatchType"),
        "requestScanTaskId": scan_task_id,
        "responseScanTaskId": payload.get("scanTaskId"),
        "filePath": sample_file_path,
        "lineNumber": sample_line_number,
        "resultCount": result_count,
        "citationCount": len(citations),
        "citedChunkCount": len(cited_citations),
        "lineAnchorCitationBound": True,
        "lineAnchorCitedCount": line_anchor_cited_count,
        "lineAnchorPrimaryCitedCount": line_anchor_primary_cited_count,
        "lineAnchorCitationFilePath": line_anchor_primary_citation.get("filePath"),
        "lineAnchorCitationStartLine": positive_int(line_anchor_primary_citation.get("startLine")),
        "lineAnchorCitationEndLine": positive_int(line_anchor_primary_citation.get("endLine")),
        "lineAnchorCitationContextRole": line_anchor_primary_citation.get("contextRole"),
        "lineAnchorEvidenceReasonVisible": True,
        "rawRetrievedChunkContentAbsent": raw_chunk_content_boundary["rawRetrievedChunkContentAbsent"],
        "contentPreviewMaxLength": raw_chunk_content_boundary["contentPreviewMaxLength"],
        "narrativeBound": True,
        "narrativeCheckKey": "api_data_surface",
        "narrativeSourceSection": sample["sourceSection"],
        "narrativeSectionBindingStatus": "BOUND",
        "narrativeEvidenceRefFieldCount": narrative_evidence_ref_field_count,
        "narrativeQuestionBound": True,
        "narrativeRawTextStored": False,
        "requiredEvidenceCoveragePercent": required_evidence_coverage_percent,
        "requiredEvidenceCount": required_evidence_count,
        "citedRequiredEvidenceCount": cited_required_evidence_count,
        "primaryEvidenceCount": primary_evidence_count,
        "citedPrimaryEvidenceCount": cited_primary_evidence_count,
        "evidenceRoleDistributionStatus": evidence_role_distribution.get("status"),
        "claimCitationStatus": claim_citation_coverage.get("status"),
        "claimCoveragePercent": claim_coverage_percent,
        "requiredClaimCount": required_claim_count,
        "citedRequiredClaimCount": cited_required_claim_count,
        "roleDistributionStatus": role_distribution.get("status"),
        "requiredPrimaryBoundClaimCount": required_primary_bound_claim_count,
        "requiredPrimaryFileCount": required_primary_file_count,
        "groundingStatus": payload.get("groundingStatus"),
        "citationEnforcementStatus": citation_enforcement_status,
        "citationEnforcementReason": citation_enforcement_reason,
        "providerQualityClaim": False,
        "llmFactClaim": False,
    }


def validate_report_evidence_qa_citation_quality(project_id, scan_task_id, token, report):
    if REPORT_EVIDENCE_QA_CITATION_MODE == "false":
        return None
    candidates = collect_report_evidence_qa_candidates(project_id, scan_task_id, token, report)
    selected_candidates = select_report_evidence_qa_samples(candidates)
    sample_count = len(selected_candidates)
    if sample_count < 2:
        if REPORT_EVIDENCE_QA_CITATION_MODE == "true":
            fail(f"Report evidence QA citation requires at least 2 line-anchor candidates, found {len(candidates)}")
        return None

    samples = []
    for index, candidate in enumerate(selected_candidates, start=1):
        evidence_ref_mode = "LINE_NUMBER" if index % 2 == 1 else "START_END_ONLY"
        evidence_ref = {
            "category": candidate["category"],
            "source": candidate["source"],
            "title": candidate["title"],
            "summary": candidate["summary"],
            "filePath": candidate["filePath"],
        }
        if evidence_ref_mode == "LINE_NUMBER":
            evidence_ref["lineNumber"] = candidate["lineNumber"]
        else:
            candidate_line_number = positive_int(candidate["lineNumber"])
            evidence_ref["startLine"] = candidate_line_number
            evidence_ref["endLine"] = candidate_line_number
        question = (
            "请基于报告证据解释该 API 处理器的职责、引用依据和下一步行动: "
            f"{candidate['handlerClass']}#{candidate['handlerMethod']} "
            f"{candidate['filePath']}:{candidate['lineNumber']}"
        )
        payload = request_with_transient_status_retries(
            "POST",
            f"/projects/{project_id}/qa",
            {"scanTaskId": scan_task_id, "question": question, "evidenceRef": evidence_ref},
            token=token,
            timeout=90,
        )["data"]
        samples.append(validate_report_evidence_qa_payload(payload, candidate, scan_task_id, index, evidence_ref, question))

    sampled_files = sorted({sample["filePath"] for sample in samples})
    sampled_sections = sorted({sample["sourceSection"] for sample in samples})
    unique_file_count = len(sampled_files)
    source_section_count = len(sampled_sections)
    diversity_status = "MULTI_FILE" if unique_file_count >= 2 else "SINGLE_FILE"
    evidence_ref_modes = sorted({sample["evidenceRefMode"] for sample in samples})
    line_number_sample_count = sum(1 for sample in samples if sample["evidenceRefMode"] == "LINE_NUMBER")
    start_end_only_sample_count = sum(1 for sample in samples if sample["evidenceRefMode"] == "START_END_ONLY")
    evidence_ref_mode_status = (
        "MIXED_LINE_AND_START_END"
        if line_number_sample_count > 0 and start_end_only_sample_count > 0
        else "LINE_NUMBER_ONLY"
        if line_number_sample_count > 0
        else "START_END_ONLY_ONLY"
    )

    return {
        "status": "OK",
        "surface": "PUBLIC_REPO_REPORT_EVIDENCE_QA_MULTI_ANCHOR",
        "mode": REPORT_EVIDENCE_QA_CITATION_MODE,
        "scanTaskId": scan_task_id,
        "sampleCount": len(samples),
        "currentScanOnly": True,
        "samplingStrategy": "DIVERSE_FILE_THEN_REPORT_ORDER",
        "targetSampleCount": 4,
        "candidateCount": len(candidates),
        "uniqueFileCount": unique_file_count,
        "sourceSectionCount": source_section_count,
        "diversityStatus": diversity_status,
        "diversityFallbackUsed": unique_file_count < len(samples),
        "sourceSections": sorted({sample["sourceSection"] for sample in samples}),
        "evidenceRefModeStatus": evidence_ref_mode_status,
        "evidenceRefModes": evidence_ref_modes,
        "lineNumberSampleCount": line_number_sample_count,
        "startEndOnlySampleCount": start_end_only_sample_count,
        "lineNumberLineAnchorBoundSampleCount": sum(1 for sample in samples if sample["evidenceRefMode"] == "LINE_NUMBER" and sample["lineAnchorCitationBound"] is True),
        "startEndOnlyLineAnchorBoundSampleCount": sum(1 for sample in samples if sample["evidenceRefMode"] == "START_END_ONLY" and sample["lineAnchorCitationBound"] is True),
        "sourceEvidenceMatchTypes": sorted({sample["sourceEvidenceMatchType"] for sample in samples}),
        "groundingStatuses": sorted({sample["groundingStatus"] for sample in samples}),
        "citationEnforcementStatuses": sorted({sample["citationEnforcementStatus"] for sample in samples}),
        "citationEnforcementReasons": sorted({sample["citationEnforcementReason"] for sample in samples}),
        "minRequiredEvidenceCoveragePercent": min(sample["requiredEvidenceCoveragePercent"] for sample in samples),
        "minRequiredEvidenceCount": min(sample["requiredEvidenceCount"] for sample in samples),
        "minCitedRequiredEvidenceCount": min(sample["citedRequiredEvidenceCount"] for sample in samples),
        "minPrimaryEvidenceCount": min(sample["primaryEvidenceCount"] for sample in samples),
        "minCitedPrimaryEvidenceCount": min(sample["citedPrimaryEvidenceCount"] for sample in samples),
        "claimCitationStatuses": sorted({sample["claimCitationStatus"] for sample in samples}),
        "minClaimCoveragePercent": min(sample["claimCoveragePercent"] for sample in samples),
        "minRequiredClaimCount": min(sample["requiredClaimCount"] for sample in samples),
        "minCitedRequiredClaimCount": min(sample["citedRequiredClaimCount"] for sample in samples),
        "roleDistributionStatuses": sorted({sample["roleDistributionStatus"] for sample in samples}),
        "minRequiredPrimaryBoundClaimCount": min(sample["requiredPrimaryBoundClaimCount"] for sample in samples),
        "minRequiredPrimaryFileCount": min(sample["requiredPrimaryFileCount"] for sample in samples),
        "lineAnchorCitationStatus": "ALL_SAMPLES_BOUND",
        "lineAnchorBoundSampleCount": sum(1 for sample in samples if sample["lineAnchorCitationBound"] is True),
        "lineAnchorEvidenceReasonVisibleSampleCount": sum(1 for sample in samples if sample["lineAnchorEvidenceReasonVisible"] is True),
        "rawRetrievedChunkContentAbsentSampleCount": sum(1 for sample in samples if sample["rawRetrievedChunkContentAbsent"] is True),
        "maxContentPreviewLength": max(sample["contentPreviewMaxLength"] for sample in samples),
        "minLineAnchorCitedCount": min(sample["lineAnchorCitedCount"] for sample in samples),
        "minLineAnchorPrimaryCitedCount": min(sample["lineAnchorPrimaryCitedCount"] for sample in samples),
        "narrativeCitationStatus": "ALL_SAMPLES_NARRATIVE_BOUND",
        "narrativeBoundSampleCount": sum(1 for sample in samples if sample["narrativeBound"] is True),
        "minNarrativeEvidenceRefFieldCount": min(sample["narrativeEvidenceRefFieldCount"] for sample in samples),
        "narrativeCheckKeys": sorted({sample["narrativeCheckKey"] for sample in samples}),
        "narrativeSectionBindingStatuses": sorted({sample["narrativeSectionBindingStatus"] for sample in samples}),
        "samples": samples,
        "noRawPromptOrAnswer": True,
        "providerQualityClaim": False,
        "llmFactClaim": False,
    }


def validate_raw_scan_contract(project_id, records, token):
    raw_record = next((record for record in records if record.get("artifactType") == "RAW_SCAN_RESULT"), None)
    if not raw_record:
        fail("RAW_SCAN_RESULT artifact record is missing")
    text = request_text(
        "GET",
        f"/projects/{project_id}/artifacts/{raw_record['id']}/download?rawDownloadAcknowledged=true",
        token=token,
    )
    try:
        raw_scan = json.loads(text or "{}")
    except json.JSONDecodeError as exc:
        fail(f"RAW_SCAN_RESULT is not valid JSON: {exc}")

    schema_version = raw_scan.get("scan_result_schema_version")
    if schema_version != 2:
        fail(f"RAW_SCAN_RESULT.scan_result_schema_version must be 2, got {schema_version!r}")
    language = raw_scan.get("language")
    if not isinstance(language, str) or not language.strip():
        fail("RAW_SCAN_RESULT.language is missing or empty")
    symbols = raw_scan.get("symbols")
    if not isinstance(symbols, list) or not symbols:
        fail("RAW_SCAN_RESULT.symbols must be a non-empty array")
    graph = raw_scan.get("graph")
    if not isinstance(graph, dict):
        fail("RAW_SCAN_RESULT.graph must be an object")
    graph_nodes = graph.get("nodes")
    if not isinstance(graph_nodes, list) or not graph_nodes:
        fail("RAW_SCAN_RESULT.graph.nodes must be a non-empty array")
    file_tree = raw_scan.get("file_tree")
    if not isinstance(file_tree, dict):
        fail("RAW_SCAN_RESULT.file_tree must be an object")
    total_files = file_tree.get("total_files")
    if not isinstance(total_files, int) or total_files <= 0:
        fail(f"RAW_SCAN_RESULT.file_tree.total_files must be positive, got {total_files!r}")
    structure = raw_scan.get("structure")
    if not isinstance(structure, dict):
        fail("RAW_SCAN_RESULT.structure must be an object")
    api_routes = structure.get("api_routes")
    entities = structure.get("entities")
    if not isinstance(api_routes, list):
        fail("RAW_SCAN_RESULT.structure.api_routes must be an array")
    if not isinstance(entities, list):
        fail("RAW_SCAN_RESULT.structure.entities must be an array")
    java_ast_diagnostics = raw_scan.get("java_ast_diagnostics")
    java_ast_summary = None
    if java_ast_diagnostics is not None:
        if not isinstance(java_ast_diagnostics, dict):
            fail("RAW_SCAN_RESULT.java_ast_diagnostics must be an object when present")
        total_java_files = java_ast_diagnostics.get("total_java_files")
        parsed_java_files = java_ast_diagnostics.get("parsed_java_files")
        failed_java_files = java_ast_diagnostics.get("failed_java_files")
        failed_file_paths = java_ast_diagnostics.get("failed_file_paths")
        java_ast_status = java_ast_diagnostics.get("status")
        if not isinstance(total_java_files, int) or total_java_files < 0:
            fail(f"RAW_SCAN_RESULT.java_ast_diagnostics.total_java_files must be non-negative int, got {total_java_files!r}")
        if not isinstance(parsed_java_files, int) or parsed_java_files < 0:
            fail(f"RAW_SCAN_RESULT.java_ast_diagnostics.parsed_java_files must be non-negative int, got {parsed_java_files!r}")
        if not isinstance(failed_java_files, int) or failed_java_files < 0:
            fail(f"RAW_SCAN_RESULT.java_ast_diagnostics.failed_java_files must be non-negative int, got {failed_java_files!r}")
        if not isinstance(failed_file_paths, list):
            fail("RAW_SCAN_RESULT.java_ast_diagnostics.failed_file_paths must be an array")
        if java_ast_status not in {"OK", "PARTIAL"}:
            fail(f"RAW_SCAN_RESULT.java_ast_diagnostics.status must be OK/PARTIAL, got {java_ast_status!r}")
        if parsed_java_files + failed_java_files != total_java_files:
            fail("RAW_SCAN_RESULT.java_ast_diagnostics parsed+failed count must equal total")
        if failed_java_files != len(failed_file_paths):
            fail("RAW_SCAN_RESULT.java_ast_diagnostics failed count must match failed_file_paths length")
        if failed_java_files > 0 or java_ast_status != "OK":
            fail(f"RAW_SCAN_RESULT.java_ast_diagnostics reports parse failures: status={java_ast_status}, failed={failed_java_files}, paths={failed_file_paths[:5]}")
        java_ast_summary = {
            "status": java_ast_status,
            "totalJavaFiles": total_java_files,
            "parsedJavaFiles": parsed_java_files,
            "failedJavaFiles": failed_java_files,
            "failedFilePaths": failed_file_paths,
        }

    result = {
        "schemaVersion": schema_version,
        "language": language,
        "symbols": len(symbols),
        "graphNodes": len(graph_nodes),
        "totalFiles": total_files,
        "apiRoutes": len(api_routes),
        "entities": len(entities),
    }
    if java_ast_summary is not None:
        result["javaAstDiagnostics"] = java_ast_summary
    return result


def is_complete_evidence_check(item):
    if not isinstance(item, dict):
        return False
    allowed_status = {"READY", "REVIEW", "WARNING", "RISK", "GAP", "IDLE"}
    return (
        isinstance(item.get("key"), str) and item["key"].strip()
        and isinstance(item.get("label"), str) and item["label"].strip()
        and item.get("status") in allowed_status
        and isinstance(item.get("value"), str) and item["value"].strip()
        and isinstance(item.get("detail"), str) and item["detail"].strip()
    )


def validate_code_chunk_search(project_id, scan_task_id, token):
    required_fields = ["filePath", "startLine", "endLine", "contentPreview", "evidenceType", "evidenceReason"]
    source_evidence_types = {"CONTROLLER", "SERVICE", "DATA_ACCESS", "DOMAIN_MODEL", "FRONTEND", "SOURCE"}

    def validate_chunk_items(label, payload):
        if not isinstance(payload, dict):
            fail(f"code_chunks API {label} response is not an object")
        items = payload.get("items")
        if not isinstance(items, list) or not items:
            fail(f"code_chunks API {label} returned empty or malformed items")
        for index, item in enumerate(items):
            if not isinstance(item, dict):
                fail(f"code_chunks API {label} item #{index + 1} is not an object")
            missing_fields = [field for field in required_fields if item.get(field) in (None, "")]
            if missing_fields:
                fail(f"code_chunks API {label} item #{index + 1} missing fields: {missing_fields}")
            start_line = int(item.get("startLine") or 0)
            end_line = int(item.get("endLine") or 0)
            if start_line <= 0 or end_line < start_line:
                fail(
                    f"code_chunks API {label} item #{index + 1} has invalid line range: "
                    f"{item.get('startLine')}-{item.get('endLine')}"
                )
        if not any((item.get("evidenceType") in source_evidence_types) for item in items):
            fail(f"code_chunks API {label} returned no source evidence in the first page")
        return items

    def normalized_path(item):
        return "/" + str(item.get("filePath") or "").replace("\\", "/").strip("/").lower()

    def basename(path):
        return path.rsplit("/", 1)[-1]

    def item_content(item):
        return "\n".join(str(item.get(field) or "") for field in ("contentPreview", "content"))

    def has_path_segment(path, segments):
        return any(f"/{segment}/" in path for segment in segments)

    def java_class_name(path):
        name = basename(path)
        return name[:-5] if name.endswith(".java") else name

    def controller_fallback_reason(item):
        if item.get("evidenceType") == "FRONTEND":
            return None
        path = normalized_path(item)
        class_name = java_class_name(path)
        if has_path_segment(path, ["controller", "resource", "handler"]):
            return "fallback:path-role-segment"
        if any(token in class_name for token in ("controller", "resource", "handler")):
            return "fallback:class-role-name"
        content = item_content(item)
        for annotation in (
            "@RestController", "@Controller", "@RequestMapping", "@GetMapping",
            "@PostMapping", "@PutMapping", "@DeleteMapping",
        ):
            if annotation in content:
                return "fallback:spring-mapping-annotation"
        return None

    def service_fallback_reason(item):
        if item.get("evidenceType") == "FRONTEND":
            return None
        path = normalized_path(item)
        class_name = basename(path)
        if "/service/" in path and path.endswith(".java"):
            return "fallback:java-service-path"
        if path.endswith(".java") and (
            class_name.endswith("service.java") or class_name.endswith("serviceimpl.java")
        ):
            return "fallback:java-service-class"
        if "@Service" in item_content(item):
            return "fallback:spring-service-annotation"
        return None

    def data_access_fallback_reason(item):
        if item.get("evidenceType") == "FRONTEND":
            return None
        path = normalized_path(item)
        class_name = basename(path)
        content = item_content(item).lower()
        if has_path_segment(path, ["mapper", "dao", "repository", "persistence"]):
            return "fallback:data-access-path-segment"
        if path.endswith(".xml") and ("mapper" in path or "<mapper" in content):
            return "fallback:mybatis-mapper-xml"
        if path.endswith(".java") and (
            class_name.endswith("mapper.java")
            or class_name.endswith("dao.java")
            or class_name.endswith("repository.java")
        ):
            return "fallback:data-access-class"
        if any(token in content for token in ("@repository", "@mapper", "extends jparepository", "extends crudrepository")):
            return "fallback:data-access-annotation-or-jpa"
        return None

    def run_role_probe(role, query, expected_evidence_type, fallback_reason):
        probe_search = request(
            "GET",
            api_query(
                f"/projects/{project_id}/code-chunks/search",
                {"scanTaskId": scan_task_id, "query": query, "limit": 10},
            ),
            token=token,
        )["data"]
        result_count = int(probe_search.get("resultCount") or 0)
        items = validate_chunk_items(f"{role} role probe", probe_search)
        if result_count <= 0:
            fail(f"code_chunks API {role} role probe returned resultCount=0")
        matched = next(
            (
                (item, f"evidenceType:{expected_evidence_type}")
                for item in items
                if item.get("evidenceType") == expected_evidence_type
            ),
            None,
        )
        if not matched:
            matched = next(
                (
                    (item, reason)
                    for item in items
                    for reason in [fallback_reason(item)]
                    if reason
                ),
                None,
            )
        if not matched:
            observed = [
                {"filePath": item.get("filePath"), "evidenceType": item.get("evidenceType")}
                for item in items
            ]
            fail(f"code_chunks API {role} role probe found no role signal: {observed}")
        matched_item, matched_reason = matched
        return {
            "role": role,
            "query": query,
            "resultCount": result_count,
            "matched": True,
            "matchedFile": matched_item.get("filePath"),
            "matchedEvidenceType": matched_item.get("evidenceType"),
            "matchedReason": matched_reason,
            "status": "OK",
        }

    def safe_probe_anchor(item):
        if not isinstance(item, dict):
            fail("code_chunks API source location probe anchor is not an object")
        file_path = str(item.get("filePath") or "").strip()
        start_line = int(item.get("startLine") or 0)
        end_line = int(item.get("endLine") or 0)
        if not file_path or file_path.startswith("/") or "\\" in file_path or ".." in file_path.split("/"):
            fail(f"code_chunks API source location probe anchor has unsafe filePath: {file_path!r}")
        if start_line <= 0 or end_line < start_line:
            fail(f"code_chunks API source location probe anchor has invalid line range: {start_line}-{end_line}")
        return file_path, start_line, end_line

    def run_source_location_probe(kind, query, anchor_item, expected_port=None, expected_column=None):
        query_shapes = {
            "standaloneBrowserSourceUrl": "source-url",
            "viteQuerySourceUrl": "vite-query-source-url",
            "anonymousWebpackStackFrame": "anonymous-stack-frame",
        }
        query_shape = query_shapes.get(kind)
        if not query_shape:
            fail(f"code_chunks API source location probe kind is unsupported: {kind}")
        anchor_file, anchor_line, _ = safe_probe_anchor(anchor_item)
        probe_search = request(
            "GET",
            api_query(
                f"/projects/{project_id}/code-chunks/search",
                {"scanTaskId": scan_task_id, "query": query, "limit": 5},
            ),
            token=token,
        )["data"]
        result_count = int(probe_search.get("resultCount") or 0)
        items = validate_chunk_items(f"{kind} source location probe", probe_search)
        matched_item = next(
            (
                item
                for item in items
                if str(item.get("filePath") or "") == anchor_file
                and int(item.get("startLine") or 0) <= anchor_line <= int(item.get("endLine") or 0)
            ),
            None,
        )
        if result_count <= 0 or matched_item is None:
            observed = [
                {
                    "filePath": item.get("filePath"),
                    "startLine": item.get("startLine"),
                    "endLine": item.get("endLine"),
                    "evidenceType": item.get("evidenceType"),
                }
                for item in items
            ]
            fail(f"code_chunks API {kind} source location probe did not bind target line: {observed}")
        first_item = items[0]
        first_start = int(first_item.get("startLine") or 0)
        first_end = int(first_item.get("endLine") or 0)
        first_matches_exact_anchor = (
            str(first_item.get("filePath") or "") == anchor_file
            and first_start <= anchor_line <= first_end
        )
        if not first_matches_exact_anchor:
            observed = [
                {
                    "filePath": item.get("filePath"),
                    "startLine": item.get("startLine"),
                    "endLine": item.get("endLine"),
                    "evidenceType": item.get("evidenceType"),
                }
                for item in items[:5]
            ]
            fail(f"code_chunks API {kind} source location probe did not preserve exact anchor as first result: {observed}")
        matched_start = int(matched_item.get("startLine") or 0)
        matched_end = int(matched_item.get("endLine") or 0)
        dev_server_port_ignored = expected_port is None or not (matched_start <= int(expected_port) <= matched_end)
        if not dev_server_port_ignored:
            fail(
                f"code_chunks API {kind} source location probe treated dev-server port as a line hint: "
                f"port={expected_port}, matchedRange={matched_start}-{matched_end}"
            )
        query_had_column = expected_column is not None and (
            query.rstrip().endswith(f":{expected_column}")
            or query.rstrip().endswith(f":{expected_column})")
        )
        return {
            "kind": kind,
            "status": "OK",
            "matched": True,
            "queryShape": query_shape,
            "queryHadScheme": "://" in query,
            "queryHadViteQueryParam": "?t=" in query,
            "queryHadColumn": query_had_column,
            "queryHadWebpackScheme": "webpack://" in query,
            "scanTaskId": scan_task_id,
            "targetFile": anchor_file,
            "targetLine": anchor_line,
            "expectedPort": expected_port,
            "expectedColumn": expected_column,
            "resultCount": result_count,
            "firstResultIndex": 0,
            "firstResultFile": first_item.get("filePath"),
            "firstResultStartLine": first_start,
            "firstResultEndLine": first_end,
            "firstResultEvidenceType": first_item.get("evidenceType"),
            "firstResultMatchesExactAnchor": first_matches_exact_anchor,
            "exactAnchorPreservedAsFirstResult": first_matches_exact_anchor,
            "matchedFile": matched_item.get("filePath"),
            "matchedStartLine": matched_start,
            "matchedEndLine": matched_end,
            "matchedEvidenceType": matched_item.get("evidenceType"),
            "devServerPortIgnored": dev_server_port_ignored,
        }

    def source_location_anchor(items, excluded_lines=(3000, 5173)):
        for item in items:
            if not isinstance(item, dict):
                continue
            _, start_line, end_line = safe_probe_anchor(item)
            if not any(start_line <= int(line) <= end_line for line in excluded_lines):
                return item
        fail(
            "code_chunks API source location probe could not find an anchor that excludes dev-server ports "
            + ", ".join(str(line) for line in excluded_lines)
        )

    def validate_cross_file_retrieval_proof():
        proof_limit = 24
        proof_search = request(
            "GET",
            api_query(
                f"/projects/{project_id}/code-chunks/search",
                {"scanTaskId": scan_task_id, "query": CROSS_FILE_PROOF_QUERY, "limit": proof_limit},
            ),
            token=token,
        )["data"]
        items = validate_chunk_items("cross-file retrieval proof", proof_search)
        result_count = int(proof_search.get("resultCount") or 0)
        total_chunks = int(proof_search.get("totalChunks") or 0)
        embedded_chunks = int(proof_search.get("embeddedChunks") or 0)
        unique_files = {
            str(item.get("filePath") or "").strip()
            for item in items
            if isinstance(item, dict) and str(item.get("filePath") or "").strip()
        }
        if result_count < 2 or len(unique_files) < 2:
            fail(
                "code_chunks API cross-file retrieval proof must return at least two files: "
                f"resultCount={result_count}, uniqueFiles={len(unique_files)}"
            )
        if any(item.get("scanTaskId") != scan_task_id for item in items if isinstance(item, dict)):
            mismatched = [item.get("scanTaskId") for item in items if isinstance(item, dict)]
            fail(f"code_chunks API cross-file retrieval proof scanTaskId mismatch: {mismatched}")
        source_labels_visible = all(
            isinstance(item.get("sourceLabel"), str) and item.get("sourceLabel").strip()
            for item in items
            if isinstance(item, dict)
        )
        if not source_labels_visible:
            fail("code_chunks API cross-file retrieval proof must expose source labels")
        profile = proof_search.get("evidenceProfile")
        if not isinstance(profile, dict):
            fail("code_chunks API cross-file retrieval proof evidenceProfile is missing")
        file_stats = profile.get("fileStats")
        if not isinstance(file_stats, list) or not file_stats:
            fail("code_chunks API cross-file retrieval proof fileStats are missing")
        file_stat_paths = {
            str(item.get("filePath") or "").strip()
            for item in file_stats
            if isinstance(item, dict) and str(item.get("filePath") or "").strip()
        }
        if len(file_stat_paths) < 2:
            fail(f"code_chunks API cross-file retrieval proof fileStats must cover at least two files: {len(file_stat_paths)}")
        distribution_by_file = {}
        for item in items:
            if not isinstance(item, dict):
                continue
            file_path = str(item.get("filePath") or "").strip()
            if not file_path:
                continue
            assert_safe_relative_path(file_path, "code_chunks API cross-file retrieval proof fileDistribution.filePath")
            entry = distribution_by_file.setdefault(file_path, {
                "filePath": file_path,
                "resultCount": 0,
                "evidenceTypes": set(),
                "sourceLabelCount": 0,
                "minStartLine": None,
                "maxEndLine": None,
            })
            entry["resultCount"] += 1
            evidence_type = str(item.get("evidenceType") or "").strip()
            if evidence_type:
                entry["evidenceTypes"].add(evidence_type)
            if isinstance(item.get("sourceLabel"), str) and item.get("sourceLabel").strip():
                entry["sourceLabelCount"] += 1
            start_line = int(item.get("startLine") or 0)
            end_line = int(item.get("endLine") or 0)
            if start_line > 0:
                entry["minStartLine"] = start_line if entry["minStartLine"] is None else min(entry["minStartLine"], start_line)
            if end_line > 0:
                entry["maxEndLine"] = end_line if entry["maxEndLine"] is None else max(entry["maxEndLine"], end_line)
        file_distribution = []
        for entry in sorted(distribution_by_file.values(), key=lambda value: (-value["resultCount"], value["filePath"]))[:5]:
            if entry["sourceLabelCount"] <= 0:
                fail(f"code_chunks API cross-file retrieval proof fileDistribution missing source labels: {entry['filePath']}")
            if entry["minStartLine"] is None or entry["maxEndLine"] is None:
                fail(f"code_chunks API cross-file retrieval proof fileDistribution missing line range: {entry['filePath']}")
            file_distribution.append({
                "filePath": entry["filePath"],
                "resultCount": entry["resultCount"],
                "evidenceTypes": sorted(entry["evidenceTypes"]),
                "sourceLabelCount": entry["sourceLabelCount"],
                "minStartLine": entry["minStartLine"],
                "maxEndLine": entry["maxEndLine"],
            })
        if len(file_distribution) < 2:
            fail(f"code_chunks API cross-file retrieval proof fileDistribution must cover at least two files: {len(file_distribution)}")
        main_source_files = {
            str(item.get("filePath") or "").strip()
            for item in items
            if isinstance(item, dict)
            and str(item.get("filePath") or "").strip()
            and str(item.get("evidenceType") or "").strip() not in {"TEST", "DOCUMENTATION", "CONFIG"}
            and (
                "/src/main/" in str(item.get("filePath") or "").replace("\\", "/")
                or str(item.get("filePath") or "").replace("\\", "/").startswith("src/main/")
            )
        }
        if len(main_source_files) < CROSS_FILE_MIN_MAIN_SOURCE_FILES:
            fail(
                "code_chunks API cross-file retrieval proof must include enough non-test main source files: "
                f"required={CROSS_FILE_MIN_MAIN_SOURCE_FILES}, actual={len(main_source_files)}, files={sorted(main_source_files)[:5]}"
            )
        source_files = {
            str(item.get("filePath") or "").strip()
            for item in items
            if isinstance(item, dict)
            and str(item.get("filePath") or "").strip()
            and str(item.get("evidenceType") or "").strip() in {"SOURCE", "FRONTEND", "CONTROLLER", "SERVICE", "DATA_ACCESS", "DOMAIN_MODEL"}
        }
        if len(source_files) < CROSS_FILE_MIN_SOURCE_FILES:
            fail(
                "code_chunks API cross-file retrieval proof must include enough source files: "
                f"required={CROSS_FILE_MIN_SOURCE_FILES}, actual={len(source_files)}, files={sorted(source_files)[:5]}"
            )
        retrieval_mode = proof_search.get("retrievalMode")
        if retrieval_mode not in {"KEYWORD", "STABLE_FALLBACK", "SEMANTIC_FALLBACK", "HYBRID"}:
            fail(f"code_chunks API cross-file retrieval proof retrievalMode is not usable: {retrieval_mode}")
        readiness = profile.get("readiness")
        if readiness not in {"READY", "REVIEW", "GAP"}:
            fail(f"code_chunks API cross-file retrieval proof readiness must be READY, REVIEW, or GAP: {readiness}")
        return {
            "status": "OK",
            "endpoint": f"/api/projects/{project_id}/code-chunks/search",
            "query": CROSS_FILE_PROOF_QUERY,
            "limit": proof_limit,
            "responseScanTaskId": proof_search.get("scanTaskId"),
            "resultCount": result_count,
            "totalChunks": total_chunks,
            "embeddedChunks": embedded_chunks,
            "uniqueFiles": len(unique_files),
            "currentScanOnly": True,
            "fileStatsVisible": True,
            "fileStatsUniqueFiles": len(file_stat_paths),
            "sourceUniqueFiles": len(source_files),
            "minSourceFiles": CROSS_FILE_MIN_SOURCE_FILES,
            "mainSourceUniqueFiles": len(main_source_files),
            "minMainSourceFiles": CROSS_FILE_MIN_MAIN_SOURCE_FILES,
            "fileDistribution": file_distribution,
            "fileDistributionSampleCount": len(file_distribution),
            "sourceLabelsVisible": True,
            "retrievalMode": retrieval_mode,
            "readiness": readiness,
            "minFileEvidenceSatisfied": True,
        }

    inventory_search = request(
        "GET",
        api_query(
            f"/projects/{project_id}/code-chunks/search",
            {"scanTaskId": scan_task_id, "query": "", "limit": 5},
        ),
        token=token,
    )["data"]
    total_chunks = int(inventory_search.get("totalChunks") or 0)
    result_count = int(inventory_search.get("resultCount") or 0)
    if total_chunks <= 0:
        fail("code_chunks API reports totalChunks=0 after successful scan")
    if result_count <= 0:
        fail("code_chunks API returned no searchable items after successful scan")

    search = request(
        "GET",
        api_query(
            f"/projects/{project_id}/code-chunks/search",
            {"scanTaskId": scan_task_id, "query": SOURCE_ROLE_QUERY, "limit": 5},
        ),
        token=token,
    )["data"]
    items = search.get("items")
    if not isinstance(items, list) or not items:
        fail("code_chunks API source-role query returned empty or malformed items")
    first = items[0]
    if not isinstance(first, dict):
        fail("code_chunks API first item is not an object")
    missing_fields = [field for field in required_fields if first.get(field) in (None, "")]
    if missing_fields:
        fail(f"code_chunks API first item missing fields: {missing_fields}")
    if int(first.get("endLine") or 0) < int(first.get("startLine") or 0):
        fail("code_chunks API first item has invalid line range")
    first_evidence_type = first.get("evidenceType")
    if first_evidence_type not in source_evidence_types:
        fail(
            "code_chunks API source-role query did not prioritize source evidence: "
            f"firstType={first_evidence_type}, firstFile={first.get('filePath')}"
        )
    if not any((item.get("evidenceType") in source_evidence_types) for item in items if isinstance(item, dict)):
        fail("code_chunks API source-role query returned no source evidence in the first page")
    profile = search.get("evidenceProfile")
    if not isinstance(profile, dict):
        fail("code_chunks API evidenceProfile is missing or not an object")
    readiness = profile.get("readiness")
    if readiness not in {"READY", "REVIEW", "GAP", "IDLE"}:
        fail(f"code_chunks API evidenceProfile.readiness is invalid: {readiness}")
    confidence = profile.get("confidence")
    if not isinstance(confidence, int) or confidence < 0 or confidence > 100:
        fail(f"code_chunks API evidenceProfile.confidence is invalid: {confidence}")
    if result_count > 0 and int(profile.get("uniqueFiles") or 0) <= 0:
        fail("code_chunks API evidenceProfile.uniqueFiles is zero despite returned items")
    if not isinstance(profile.get("nextAction"), str) or not profile.get("nextAction").strip():
        fail("code_chunks API evidenceProfile.nextAction is missing")
    evidence_type_stats = profile.get("evidenceTypeStats")
    if not isinstance(evidence_type_stats, list) or not evidence_type_stats:
        fail("code_chunks API evidenceProfile.evidenceTypeStats is empty")
    role_probes = []
    if "controller" in ROLE_PROBES:
        role_probes.extend([
            run_role_probe(
                "controller",
                "controller api endpoint request mapping",
                "CONTROLLER",
                controller_fallback_reason,
            ),
            run_role_probe("naturalEndpointCn", "业务接口", "CONTROLLER", controller_fallback_reason),
            run_role_probe("naturalEndpointEn", "business endpoint", "CONTROLLER", controller_fallback_reason),
        ])
    if "service" in ROLE_PROBES:
        role_probes.append(run_role_probe(
            "service",
            "service business logic implementation",
            "SERVICE",
            service_fallback_reason,
        ))
    if "dataAccess" in ROLE_PROBES:
        role_probes.append(run_role_probe(
            "dataAccess",
            "repository dao mapper persistence database",
            "DATA_ACCESS",
            data_access_fallback_reason,
        ))
    anchor_item = source_location_anchor(items)
    anchor_file, anchor_line, _ = safe_probe_anchor(anchor_item)
    source_location_probes = [
        run_source_location_probe(
            "standaloneBrowserSourceUrl",
            f"http://localhost:3000/{anchor_file}:{anchor_line}:17",
            anchor_item,
            expected_port=3000,
            expected_column=17,
        ),
        run_source_location_probe(
            "viteQuerySourceUrl",
            f"http://localhost:5173/{anchor_file}?t=1782991000000:{anchor_line}:19",
            anchor_item,
            expected_port=5173,
            expected_column=19,
        ),
        run_source_location_probe(
            "anonymousWebpackStackFrame",
            f"TypeError: SourceLens smoke source location probe\n"
            f"    at Object.<anonymous> (webpack://source-lens/./{anchor_file}:{anchor_line}:13)",
            anchor_item,
            expected_column=13,
        ),
    ]
    return {
        "totalChunks": total_chunks,
        "resultCount": result_count,
        "query": SOURCE_ROLE_QUERY,
        "firstFile": first.get("filePath"),
        "firstEvidenceType": first_evidence_type,
        "evidenceReadiness": readiness,
        "evidenceConfidence": confidence,
        "crossFileRetrievalProof": validate_cross_file_retrieval_proof(),
        "roleProbes": role_probes,
        "sourceLocationProbeContractVersion": 4,
        "sourceLocationProbes": source_location_probes,
    }


JAVA_METHOD_PATTERN = re.compile(
    r"(?:^|\n)\s*(?:public|protected|private|static|final|synchronized|abstract|native|default|\s)+"
    r"[\w<>\[\],.?]+\s+([A-Za-z_$][\w$]*)\s*\(",
    re.MULTILINE,
)
JAVA_METHOD_NOISE = {
    "if", "for", "while", "switch", "catch", "return", "new", "throw", "throws", "try", "else"
}


def file_name(path):
    return (path or "").replace("\\", "/").rsplit("/", 1)[-1]


def class_name_from_java_path(path):
    name = file_name(path)
    return name[:-5] if name.endswith(".java") else ""


def ranges_overlap(left, right):
    return int(left.get("startLine") or 0) <= int(right.get("endLine") or 0) \
        and int(right.get("startLine") or 0) <= int(left.get("endLine") or 0)


def assert_safe_relative_path(path, label):
    if not isinstance(path, str) or not path.strip():
        fail(f"{label} must be a non-empty relative path")
    if path != path.strip() or path.startswith("/") or "\\" in path or "?" in path or "#" in path:
        fail(f"{label} must be a safe relative path")
    if any(part in {"", ".", ".."} for part in path.split("/")):
        fail(f"{label} must not contain path traversal")


def find_java_method_anchor(project_id, scan_task_id, token):
    db_anchor = find_java_method_anchor_from_db(project_id, scan_task_id, token)
    if db_anchor:
        return db_anchor

    search = request(
        "GET",
        api_query(
            f"/projects/{project_id}/code-chunks/search",
            {"scanTaskId": scan_task_id, "query": "controller service repository method", "limit": 50},
        ),
        token=token,
    )["data"]
    items = search.get("items")
    if not isinstance(items, list):
        return None
    for item in items:
        if not isinstance(item, dict):
            continue
        path = item.get("filePath") or ""
        class_name = class_name_from_java_path(path)
        if not class_name:
            continue
        content = item.get("contentPreview") or item.get("content") or ""
        for match in JAVA_METHOD_PATTERN.finditer(content):
            method_name = match.group(1)
            if not method_name or method_name in JAVA_METHOD_NOISE or method_name == class_name:
                continue
            method_line = int(item.get("startLine") or 1) + content[:match.start()].count("\n")
            return {
                "source": "API_CHUNK",
                "filePath": path,
                "className": class_name,
                "methodName": method_name,
                "methodLine": method_line,
                "startLine": int(item.get("startLine") or 1),
                "endLine": int(item.get("endLine") or item.get("startLine") or 1),
            }
    return None


def find_java_method_anchor_from_db(project_id, scan_task_id, token):
    if shutil.which("docker") is None or not docker_container_running(MYSQL_CONTAINER):
        return None
    sql = (
        "SELECT file_path, COALESCE(parent_class, ''), name, COALESCE(line_number, 0) "
        "FROM code_symbols "
        f"WHERE scan_task_id={int(scan_task_id)} "
        "AND kind='METHOD' "
        "AND file_path LIKE '%.java' "
        "AND COALESCE(line_number, 0) > 0 "
        "ORDER BY "
        "CASE "
        "WHEN file_path LIKE '%/controller/%' THEN 0 "
        "WHEN file_path LIKE '%/service/%' THEN 1 "
        "WHEN file_path LIKE '%/dao/%' THEN 2 "
        "ELSE 3 END, "
        "line_number ASC "
        "LIMIT 20"
    )
    proc = subprocess.run(
        [
            "docker", "exec", "-e", f"SQL={sql}", MYSQL_CONTAINER,
            "sh", "-lc",
            'MYSQL_PWD="$MYSQL_PASSWORD" mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" "$MYSQL_DATABASE" -N -e "$SQL"',
        ],
        text=True,
        capture_output=True,
        timeout=45,
    )
    if proc.returncode != 0:
        if DB_COUNTS_MODE == "true":
            fail(f"method anchor DB query failed: {proc.stderr.strip() or proc.stdout.strip()}")
        return None

    rows = [line.split("\t") for line in proc.stdout.splitlines() if line.strip()]
    if not rows:
        return None
    for row in rows:
        if len(row) < 4:
            continue
        path, parent_class, method_name, line_number_raw = row[:4]
        try:
            method_line = int(line_number_raw)
        except ValueError:
            continue
        class_name = parent_class.strip() or class_name_from_java_path(path)
        if not path or not class_name or not method_name or method_line <= 0:
            continue
        return {
            "source": "DB_SYMBOL",
            "filePath": path,
            "className": class_name,
            "methodName": method_name,
            "methodLine": method_line,
            "startLine": method_line,
            "endLine": method_line,
        }
    if DB_COUNTS_MODE == "true":
        fail("method anchor DB query found Java methods, but none could be resolved through code_chunks search")
    return None


def assert_anchor_match(label, expected, items):
    if not isinstance(items, list) or not items:
        fail(f"{label} returned no code chunk items")
    first = items[0]
    if first.get("filePath") != expected["filePath"]:
        fail(f"{label} first result drifted: expected {expected['filePath']} got {first.get('filePath')}")
    if not ranges_overlap(expected, first):
        fail(
            f"{label} first result range drifted: expected {expected['startLine']}-{expected['endLine']} "
            f"got {first.get('startLine')}-{first.get('endLine')}"
        )
    return first


def search_match_summary(search, match):
    return {
        "responseScanTaskId": search.get("scanTaskId"),
        "resultCount": int(search.get("resultCount") or 0),
        "matchedFile": match.get("filePath"),
        "matchedStartLine": int(match.get("startLine") or 0),
        "matchedEndLine": int(match.get("endLine") or 0),
        "matchedEvidenceType": match.get("evidenceType"),
    }


def validate_method_anchor_retrieval(project_id, scan_task_id, token):
    anchor = find_java_method_anchor(project_id, scan_task_id, token)
    if not anchor:
        return {"status": "SKIPPED", "reason": "no_java_method_anchor_candidate"}
    assert_safe_relative_path(anchor.get("filePath"), "method anchor filePath")
    method_line = int(anchor.get("methodLine") or 0)
    start_line = int(anchor.get("startLine") or 0)
    end_line = int(anchor.get("endLine") or 0)
    if method_line <= 0 or start_line <= 0 or end_line < start_line or not (start_line <= method_line <= end_line):
        fail(f"method anchor has invalid line range: {start_line}-{end_line}, methodLine={method_line}")

    method_query = f"{anchor['className']}#{anchor['methodName']}"
    method_search = request(
        "GET",
        api_query(
            f"/projects/{project_id}/code-chunks/search",
            {"scanTaskId": scan_task_id, "query": method_query, "limit": 5},
        ),
        token=token,
    )["data"]
    method_match = assert_anchor_match("method anchor code_chunks search", anchor, method_search.get("items"))

    stack_query = (
        f"at com.sourcelens.smoke.{anchor['className']}.{anchor['methodName']}"
        f"({anchor['className']}.java:{anchor['methodLine']})"
    )
    stack_search = request(
        "GET",
        api_query(
            f"/projects/{project_id}/code-chunks/search",
            {"scanTaskId": scan_task_id, "query": stack_query, "limit": 5},
        ),
        token=token,
    )["data"]
    stack_match = assert_anchor_match("stack trace code_chunks search", anchor, stack_search.get("items"))

    qa_payload = request_with_transient_status_retries(
        "POST",
        f"/projects/{project_id}/qa",
        {"scanTaskId": scan_task_id, "question": stack_query},
        token=token,
        timeout=90,
    )["data"]
    if qa_payload.get("scanTaskId") != scan_task_id:
        fail(f"method anchor QA used unexpected scanTaskId: {qa_payload.get('scanTaskId')} expected {scan_task_id}")
    primary_chunks = [
        item for item in (qa_payload.get("retrievedChunks") or [])
        if item.get("contextRole") in (None, "PRIMARY")
    ]
    qa_match = assert_anchor_match("stack trace Code QA", anchor, primary_chunks)
    first_primary_chunk = primary_chunks[0] if primary_chunks else None
    if not isinstance(first_primary_chunk, dict):
        fail("stack trace Code QA did not return a PRIMARY chunk")
    first_primary_start = int(first_primary_chunk.get("startLine") or 0)
    first_primary_end = int(first_primary_chunk.get("endLine") or 0)
    first_primary_exact_anchor = (
        first_primary_chunk.get("filePath") == anchor["filePath"]
        and first_primary_start <= method_line <= first_primary_end
    )
    if not first_primary_exact_anchor:
        observed = [
            {
                "filePath": item.get("filePath"),
                "startLine": item.get("startLine"),
                "endLine": item.get("endLine"),
                "contextRole": item.get("contextRole"),
            }
            for item in primary_chunks[:5]
        ]
        fail(f"stack trace Code QA did not preserve exact anchor as first PRIMARY chunk: {observed}")
    qa_retrieval_mode = qa_payload.get("retrievalMode")
    if qa_retrieval_mode == "NO_CONTEXT":
        fail("method anchor Code QA used NO_CONTEXT retrieval mode")
    code_understanding_fixture = {
        "contractVersion": 1,
        "status": "OK",
        "probeKind": "METHOD_ANCHOR_STACK_TRACE",
        "projectId": project_id,
        "scanTaskId": scan_task_id,
        "source": anchor.get("source"),
        "anchor": {
            "language": "Java",
            "filePath": anchor["filePath"],
            "className": anchor["className"],
            "methodName": anchor["methodName"],
            "methodLine": method_line,
            "startLine": start_line,
            "endLine": end_line,
        },
        "methodSearch": {
            "queryShape": "class#method",
            **search_match_summary(method_search, method_match),
        },
        "stackTraceSearch": {
            "queryShape": "java-stack-frame",
            "stackClass": anchor["className"],
            "stackMethod": anchor["methodName"],
            "stackFile": file_name(anchor["filePath"]),
            "stackLine": method_line,
            **search_match_summary(stack_search, stack_match),
        },
        "codeQa": {
            "requestScanTaskId": scan_task_id,
            "responseScanTaskId": qa_payload.get("scanTaskId"),
            "retrievalMode": qa_retrieval_mode,
            "resultCount": int(qa_payload.get("resultCount") or 0),
            "primaryMatched": True,
            "firstPrimaryIndex": 0,
            "firstPrimaryFile": first_primary_chunk.get("filePath"),
            "firstPrimaryStartLine": first_primary_start,
            "firstPrimaryEndLine": first_primary_end,
            "firstPrimaryContextRole": first_primary_chunk.get("contextRole") or "PRIMARY",
            "firstPrimaryExactAnchorPreserved": first_primary_exact_anchor,
            "primaryFile": qa_match.get("filePath"),
            "primaryStartLine": int(qa_match.get("startLine") or 0),
            "primaryEndLine": int(qa_match.get("endLine") or 0),
        },
        "currentScanOnly": True,
        "noRawPromptOrAnswer": True,
        "providerQualityClaim": False,
        "llmFactClaim": False,
    }
    return {
        "status": "OK",
        "source": anchor.get("source"),
        "query": method_query,
        "stackQuery": stack_query,
        "filePath": anchor["filePath"],
        "lineRange": f"{anchor['startLine']}-{anchor['endLine']}",
        "qaRetrievalMode": qa_retrieval_mode,
        "codeUnderstandingFixture": code_understanding_fixture,
    }


def validate_code_qa(project_id, scan_task_id, token):
    payload = request_with_transient_status_retries(
        "POST",
        f"/projects/{project_id}/qa",
        {"scanTaskId": scan_task_id, "question": CODE_QA_QUESTION},
        token=token,
        timeout=90,
    )["data"]
    if payload.get("scanTaskId") != scan_task_id:
        fail(f"Code QA used unexpected scanTaskId: {payload.get('scanTaskId')} expected {scan_task_id}")
    result_count = int(payload.get("resultCount") or 0)
    if result_count <= 0:
        fail("Code QA returned no retrieved chunks after successful scan")
    chunks = payload.get("retrievedChunks")
    if not isinstance(chunks, list) or not chunks:
        fail("Code QA retrievedChunks are empty or malformed")
    raw_chunk_content_boundary = ensure_no_raw_retrieved_chunk_content(payload, "Code QA")
    profile = payload.get("evidenceProfile")
    if not isinstance(profile, dict):
        fail("Code QA evidenceProfile is missing or not an object")
    readiness = profile.get("readiness")
    if readiness not in {"READY", "REVIEW", "GAP", "IDLE"}:
        fail(f"Code QA evidenceProfile.readiness is invalid: {readiness}")
    confidence = profile.get("confidence")
    if not isinstance(confidence, int) or confidence < 0 or confidence > 100:
        fail(f"Code QA evidenceProfile.confidence is invalid: {confidence}")
    if result_count > 0 and int(profile.get("uniqueFiles") or 0) <= 0:
        fail("Code QA evidenceProfile.uniqueFiles is zero despite retrieved chunks")
    details = profile.get("details")
    if not isinstance(details, list) or not details or any(not isinstance(item, str) or not item.strip() for item in details):
        fail("Code QA evidenceProfile.details must contain non-empty strings")
    if not isinstance(profile.get("nextAction"), str) or not profile.get("nextAction").strip():
        fail("Code QA evidenceProfile.nextAction is missing")
    evidence_type_stats = profile.get("evidenceTypeStats")
    if not isinstance(evidence_type_stats, list) or not evidence_type_stats:
        fail("Code QA evidenceProfile.evidenceTypeStats is empty")
    answer = payload.get("answer")
    if not isinstance(answer, str) or not answer.strip():
        fail("Code QA answer is empty")
    grounding_status = payload.get("groundingStatus")
    if grounding_status != "VERIFIED":
        fail(f"Code QA groundingStatus must be VERIFIED when retrieved evidence exists: {grounding_status}")
    citation_enforcement_status = payload.get("citationEnforcementStatus")
    allowed_enforcement_statuses = {"DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_CITED"}
    if citation_enforcement_status not in allowed_enforcement_statuses:
        fail(f"Code QA citationEnforcementStatus is not acceptable: {citation_enforcement_status}")
    retrieval_plan = payload.get("retrievalPlan")
    if not isinstance(retrieval_plan, dict):
        fail("Code QA retrievalPlan is missing or not an object")
    cross_file_intent_present = retrieval_plan.get("crossFileIntentPresent")
    query_strategy = retrieval_plan.get("queryStrategy")
    question_embedding_available = retrieval_plan.get("questionEmbeddingAvailable")
    embedding_coverage_percent = retrieval_plan.get("embeddingCoveragePercent")
    embedding_coverage_status = retrieval_plan.get("embeddingCoverageStatus")
    semantic_pool_attempted = retrieval_plan.get("semanticPoolAttempted")
    semantic_pool_strategy = retrieval_plan.get("semanticPoolStrategy")
    semantic_pool_loaded_count = retrieval_plan.get("semanticPoolLoadedCount")
    semantic_pool_limit = retrieval_plan.get("semanticPoolLimit")
    semantic_pool_truncated = retrieval_plan.get("semanticPoolTruncated")
    semantic_pool_coverage_percent = retrieval_plan.get("semanticPoolCoveragePercent")
    semantic_plan_reason = retrieval_plan.get("semanticPlanReason")
    semantic_readiness_status = retrieval_plan.get("semanticReadinessStatus")
    semantic_readiness_reason = retrieval_plan.get("semanticReadinessReason")
    graph_relation_evidence_present = retrieval_plan.get("graphRelationEvidencePresent")
    graph_relation_primary_labels = retrieval_plan.get("graphRelationPrimaryLabels")
    graph_relation_evidence_count = retrieval_plan.get("graphRelationEvidenceCount")
    cross_file_evidence_satisfied = retrieval_plan.get("crossFileEvidenceSatisfied")
    cross_file_primary_file_count = retrieval_plan.get("crossFilePrimaryFileCount")
    cross_file_evidence_status = retrieval_plan.get("crossFileEvidenceStatus")
    if not isinstance(query_strategy, str) or not query_strategy.strip():
        fail("Code QA retrievalPlan.queryStrategy must be a non-empty string")
    if not isinstance(question_embedding_available, bool):
        fail("Code QA retrievalPlan.questionEmbeddingAvailable must be boolean")
    if not isinstance(embedding_coverage_percent, int) or embedding_coverage_percent < 0 or embedding_coverage_percent > 100:
        fail("Code QA retrievalPlan.embeddingCoveragePercent must be an integer between 0 and 100")
    if embedding_coverage_status not in {"NONE", "LOW", "PARTIAL", "READY"}:
        fail(f"Code QA retrievalPlan.embeddingCoverageStatus is invalid: {embedding_coverage_status}")
    if not isinstance(semantic_pool_attempted, bool):
        fail("Code QA retrievalPlan.semanticPoolAttempted must be boolean")
    if semantic_pool_strategy not in {"NOT_ATTEMPTED", "HEAD_ONLY", "HEAD_DISTRIBUTED_WINDOWS"}:
        fail(f"Code QA retrievalPlan.semanticPoolStrategy is invalid: {semantic_pool_strategy}")
    if not isinstance(semantic_pool_loaded_count, int) or semantic_pool_loaded_count < 0:
        fail("Code QA retrievalPlan.semanticPoolLoadedCount must be a non-negative integer")
    if not isinstance(semantic_pool_limit, int) or semantic_pool_limit <= 0:
        fail("Code QA retrievalPlan.semanticPoolLimit must be a positive integer")
    if not isinstance(semantic_pool_truncated, bool):
        fail("Code QA retrievalPlan.semanticPoolTruncated must be boolean")
    if not isinstance(semantic_pool_coverage_percent, int) or semantic_pool_coverage_percent < 0 or semantic_pool_coverage_percent > 100:
        fail("Code QA retrievalPlan.semanticPoolCoveragePercent must be an integer between 0 and 100")
    if not isinstance(semantic_plan_reason, str) or not semantic_plan_reason.strip():
        fail("Code QA retrievalPlan.semanticPlanReason must be a non-empty string")
    if semantic_readiness_status not in {"NOT_APPLICABLE", "DISABLED", "UNAVAILABLE", "DEGRADED", "READY"}:
        fail(f"Code QA retrievalPlan.semanticReadinessStatus is invalid: {semantic_readiness_status}")
    if not isinstance(semantic_readiness_reason, str) or not semantic_readiness_reason.strip():
        fail("Code QA retrievalPlan.semanticReadinessReason must be a non-empty string")
    if embedding_coverage_status == "NONE" and embedding_coverage_percent != 0:
        fail("Code QA retrievalPlan.embeddingCoverageStatus=NONE requires embeddingCoveragePercent=0")
    if semantic_pool_loaded_count > semantic_pool_limit:
        fail("Code QA retrievalPlan.semanticPoolLoadedCount cannot exceed semanticPoolLimit")
    if semantic_pool_attempted and not question_embedding_available:
        fail("Code QA retrievalPlan.semanticPoolAttempted=true requires questionEmbeddingAvailable=true")
    if not semantic_pool_attempted and semantic_pool_strategy != "NOT_ATTEMPTED":
        fail("Code QA retrievalPlan.semanticPoolStrategy must be NOT_ATTEMPTED when semanticPoolAttempted=false")
    if not semantic_pool_attempted and semantic_pool_truncated:
        fail("Code QA retrievalPlan.semanticPoolTruncated must be false when semanticPoolAttempted=false")
    if not semantic_pool_attempted and semantic_pool_coverage_percent != 0:
        fail("Code QA retrievalPlan.semanticPoolCoveragePercent must be 0 when semanticPoolAttempted=false")
    expected_semantic_readiness_status = (
        "DISABLED" if semantic_plan_reason == "NO_ACTIVE_LLM"
        else "NOT_APPLICABLE" if semantic_plan_reason in {"NO_SCAN", "NO_CONTEXT"}
        else "UNAVAILABLE" if semantic_plan_reason in {"QUESTION_EMBEDDING_FAILED", "QUESTION_EMBEDDING_UNAVAILABLE", "NO_MODEL_EMBEDDINGS", "SEMANTIC_POOL_EMPTY"}
        else "DEGRADED" if semantic_plan_reason == "LOW_EMBEDDING_COVERAGE" or embedding_coverage_status in {"LOW", "PARTIAL"} or semantic_pool_truncated
        else "READY"
    )
    if semantic_readiness_status != expected_semantic_readiness_status:
        fail(
            "Code QA retrievalPlan.semanticReadinessStatus mismatch: "
            f"expected {expected_semantic_readiness_status}, got {semantic_readiness_status}"
        )
    if semantic_readiness_status == "READY" and semantic_readiness_reason != "SEMANTIC_READY":
        fail("Code QA retrievalPlan.semanticReadinessReason must be SEMANTIC_READY when status=READY")
    if not isinstance(cross_file_intent_present, bool):
        fail("Code QA retrievalPlan.crossFileIntentPresent must be boolean")
    if not isinstance(cross_file_evidence_satisfied, bool):
        fail("Code QA retrievalPlan.crossFileEvidenceSatisfied must be boolean")
    if not isinstance(cross_file_primary_file_count, int) or cross_file_primary_file_count < 0:
        fail("Code QA retrievalPlan.crossFilePrimaryFileCount must be a non-negative integer")
    if cross_file_evidence_status not in {"NOT_APPLICABLE", "SATISFIED", "SINGLE_PRIMARY_FILE", "NO_PRIMARY_EVIDENCE"}:
        fail(f"Code QA retrievalPlan.crossFileEvidenceStatus is invalid: {cross_file_evidence_status}")
    if not cross_file_intent_present and cross_file_evidence_status != "NOT_APPLICABLE":
        fail("Code QA retrievalPlan.crossFileEvidenceStatus must be NOT_APPLICABLE when crossFileIntentPresent=false")
    expected_cross_file_evidence_satisfied = bool(cross_file_intent_present and cross_file_primary_file_count >= 2)
    if cross_file_evidence_satisfied != expected_cross_file_evidence_satisfied:
        fail(
            "Code QA retrievalPlan.crossFileEvidenceSatisfied must equal "
            "crossFileIntentPresent && crossFilePrimaryFileCount>=2"
        )
    expected_cross_file_evidence_status = (
        "NOT_APPLICABLE" if not cross_file_intent_present
        else "SATISFIED" if cross_file_primary_file_count >= 2
        else "SINGLE_PRIMARY_FILE" if cross_file_primary_file_count == 1
        else "NO_PRIMARY_EVIDENCE"
    )
    if cross_file_evidence_status != expected_cross_file_evidence_status:
        fail(
            "Code QA retrievalPlan.crossFileEvidenceStatus mismatch: "
            f"expected {expected_cross_file_evidence_status}, got {cross_file_evidence_status}"
        )
    if cross_file_evidence_satisfied and cross_file_primary_file_count < 2:
        fail("Code QA retrievalPlan.crossFileEvidenceSatisfied=true requires at least two primary files")
    if cross_file_evidence_status == "SATISFIED" and not cross_file_evidence_satisfied:
        fail("Code QA retrievalPlan.crossFileEvidenceStatus=SATISFIED requires crossFileEvidenceSatisfied=true")
    if cross_file_evidence_status == "SINGLE_PRIMARY_FILE" and cross_file_primary_file_count != 1:
        fail("Code QA retrievalPlan.crossFileEvidenceStatus=SINGLE_PRIMARY_FILE requires exactly one primary file")
    if cross_file_evidence_status == "NO_PRIMARY_EVIDENCE" and cross_file_primary_file_count != 0:
        fail("Code QA retrievalPlan.crossFileEvidenceStatus=NO_PRIMARY_EVIDENCE requires zero primary files")
    if not isinstance(graph_relation_evidence_present, bool):
        fail("Code QA retrievalPlan.graphRelationEvidencePresent must be boolean")
    if not isinstance(graph_relation_primary_labels, list) or any(not isinstance(label, str) or not label.strip() for label in graph_relation_primary_labels):
        fail("Code QA retrievalPlan.graphRelationPrimaryLabels must be an array of non-empty strings")
    if not isinstance(graph_relation_evidence_count, int) or graph_relation_evidence_count < 0:
        fail("Code QA retrievalPlan.graphRelationEvidenceCount must be a non-negative integer")
    if graph_relation_evidence_present and graph_relation_evidence_count <= 0:
        fail("Code QA retrievalPlan graphRelationEvidencePresent=true requires positive graphRelationEvidenceCount")
    if graph_relation_primary_labels and not graph_relation_evidence_present:
        fail("Code QA retrievalPlan graphRelationPrimaryLabels cannot be populated when graphRelationEvidencePresent=false")
    citations = payload.get("answerCitations")
    if not isinstance(citations, list) or not citations:
        fail("Code QA answerCitations are empty or malformed")
    cited_citations = [item for item in citations if item.get("citedByAnswer") is True]
    if not cited_citations:
        fail("Code QA answer did not cite any returned answerCitations")
    citation_coverage = payload.get("citationCoverage")
    if not isinstance(citation_coverage, dict):
        fail("Code QA citationCoverage is missing or not an object")
    if citation_coverage.get("status") not in {"FULL", "REQUIRED_FULL", "PARTIAL"}:
        fail(f"Code QA citationCoverage.status must be FULL, REQUIRED_FULL or PARTIAL for verified answers: {citation_coverage.get('status')}")
    if int(citation_coverage.get("totalEvidenceCount") or 0) != len(citations):
        fail("Code QA citationCoverage.totalEvidenceCount must match answerCitations length")
    if int(citation_coverage.get("citedEvidenceCount") or 0) != len(cited_citations):
        fail("Code QA citationCoverage.citedEvidenceCount must match cited citations")
    if int(citation_coverage.get("uncitedCandidateCount") or 0) != max(len(citations) - len(cited_citations), 0):
        fail("Code QA citationCoverage.uncitedCandidateCount must match uncited candidates")
    if int(citation_coverage.get("repairCandidateCount") or 0) <= 0:
        fail("Code QA citationCoverage.repairCandidateCount must be positive for verified cited answers")
    coverage_percent = int(citation_coverage.get("coveragePercent") or 0)
    if coverage_percent <= 0 or coverage_percent > 100:
        fail(f"Code QA citationCoverage.coveragePercent must be within 1..100, got {coverage_percent}")
    evidence_role_distribution = citation_coverage.get("evidenceRoleDistribution")
    if not isinstance(evidence_role_distribution, dict):
        fail("Code QA citationCoverage.evidenceRoleDistribution is missing or not an object")
    if evidence_role_distribution.get("status") not in {"NO_EVIDENCE", "PRIMARY_SINGLE_FILE", "PRIMARY_CROSS_FILE", "MIXED_PRIMARY_CONTEXT", "CONTEXT_ONLY", "UNKNOWN_ROLE_PRESENT"}:
        fail(f"Code QA citationCoverage.evidenceRoleDistribution.status is invalid: {evidence_role_distribution.get('status')}")
    role_stats = evidence_role_distribution.get("roles")
    file_stats = evidence_role_distribution.get("files")
    if not isinstance(role_stats, list) or not role_stats:
        fail("Code QA citationCoverage.evidenceRoleDistribution.roles must be non-empty")
    if not isinstance(file_stats, list) or not file_stats:
        fail("Code QA citationCoverage.evidenceRoleDistribution.files must be non-empty")
    allowed_roles = {"PRIMARY", "ADJACENT_CONTEXT", "UNKNOWN"}
    if any(not isinstance(item, dict) or item.get("role") not in allowed_roles for item in role_stats):
        fail("Code QA citationCoverage.evidenceRoleDistribution.roles contains an invalid role")
    if not any(item.get("role") == "PRIMARY" for item in role_stats if isinstance(item, dict)):
        fail("Code QA citationCoverage.evidenceRoleDistribution.roles must include PRIMARY")
    for item in file_stats:
        file_path = item.get("filePath") if isinstance(item, dict) else None
        if not isinstance(file_path, str) or not file_path.strip() or file_path.startswith("/") or "\\" in file_path or ".." in file_path:
            fail("Code QA citationCoverage.evidenceRoleDistribution.files contains an unsafe filePath")
    if int(evidence_role_distribution.get("totalFileCount") or 0) != int(citation_coverage.get("uniqueEvidenceFileCount") or 0):
        fail("Code QA evidenceRoleDistribution.totalFileCount must match uniqueEvidenceFileCount")
    if int(evidence_role_distribution.get("citedFileCount") or 0) != int(citation_coverage.get("citedEvidenceFileCount") or 0):
        fail("Code QA evidenceRoleDistribution.citedFileCount must match citedEvidenceFileCount")
    if int(evidence_role_distribution.get("primaryFileCount") or 0) != int(citation_coverage.get("primaryEvidenceFileCount") or 0):
        fail("Code QA evidenceRoleDistribution.primaryFileCount must match primaryEvidenceFileCount")
    if int(evidence_role_distribution.get("citedPrimaryFileCount") or 0) != int(citation_coverage.get("citedPrimaryEvidenceFileCount") or 0):
        fail("Code QA evidenceRoleDistribution.citedPrimaryFileCount must match citedPrimaryEvidenceFileCount")
    if int(evidence_role_distribution.get("contextFileCount") or 0) != int(citation_coverage.get("contextEvidenceFileCount") or 0):
        fail("Code QA evidenceRoleDistribution.contextFileCount must match contextEvidenceFileCount")
    if int(evidence_role_distribution.get("citedContextFileCount") or 0) != int(citation_coverage.get("citedContextEvidenceFileCount") or 0):
        fail("Code QA evidenceRoleDistribution.citedContextFileCount must match citedContextEvidenceFileCount")
    claim_citation_coverage = payload.get("claimCitationCoverage")
    if not isinstance(claim_citation_coverage, dict):
        fail("Code QA claimCitationCoverage is missing or not an object")
    if claim_citation_coverage.get("status") != "READY":
        fail(f"Code QA claimCitationCoverage.status must be READY for verified public repo answers: {claim_citation_coverage.get('status')}")
    if claim_citation_coverage.get("readyForRepair") is not True:
        fail("Code QA claimCitationCoverage.readyForRepair must be true")
    if claim_citation_coverage.get("readinessReason") != "PRIMARY_BOUND_READY":
        fail(f"Code QA claimCitationCoverage.readinessReason must be PRIMARY_BOUND_READY: {claim_citation_coverage.get('readinessReason')}")
    required_claim_count = int(claim_citation_coverage.get("requiredClaimCount") or 0)
    cited_required_claim_count = int(claim_citation_coverage.get("citedRequiredClaimCount") or 0)
    if required_claim_count <= 0:
        fail("Code QA claimCitationCoverage.requiredClaimCount must be positive")
    if cited_required_claim_count != required_claim_count:
        fail("Code QA claimCitationCoverage.citedRequiredClaimCount must match requiredClaimCount")
    if int(claim_citation_coverage.get("uncitedRequiredClaimCount") or 0) != 0:
        fail("Code QA claimCitationCoverage.uncitedRequiredClaimCount must be 0")
    if int(claim_citation_coverage.get("invalidCitationClaimCount") or 0) != 0:
        fail("Code QA claimCitationCoverage.invalidCitationClaimCount must be 0")
    if int(claim_citation_coverage.get("claimCoveragePercent") or 0) < 100:
        fail("Code QA claimCitationCoverage.claimCoveragePercent must be at least 100")
    valid_claim_file_count = int(claim_citation_coverage.get("validCitationFileCount") or 0)
    required_claim_file_count = int(claim_citation_coverage.get("requiredClaimCitationFileCount") or 0)
    if valid_claim_file_count <= 0:
        fail("Code QA claimCitationCoverage.validCitationFileCount must be positive")
    if required_claim_file_count <= 0:
        fail("Code QA claimCitationCoverage.requiredClaimCitationFileCount must be positive")
    claim_role_distribution = claim_citation_coverage.get("roleDistribution")
    if not isinstance(claim_role_distribution, dict):
        fail("Code QA claimCitationCoverage.roleDistribution is missing or not an object")
    if claim_role_distribution.get("status") != "PRIMARY_BOUND":
        fail(f"Code QA claimCitationCoverage.roleDistribution.status must be PRIMARY_BOUND: {claim_role_distribution.get('status')}")
    if int(claim_role_distribution.get("requiredClaimCount") or 0) != required_claim_count:
        fail("Code QA claim role distribution requiredClaimCount must match parent")
    if int(claim_role_distribution.get("requiredPrimaryBoundClaimCount") or 0) != required_claim_count:
        fail("Code QA claim role distribution requiredPrimaryBoundClaimCount must cover required claims")
    for field_name in ("requiredContextOnlyClaimCount", "requiredUnknownOnlyClaimCount", "unbackedRequiredClaimCount", "invalidRequiredClaimCount"):
        if int(claim_role_distribution.get(field_name) or 0) != 0:
            fail(f"Code QA claim role distribution {field_name} must be 0")
    if int(claim_role_distribution.get("validCitationFileCount") or 0) != valid_claim_file_count:
        fail("Code QA claim role distribution validCitationFileCount must match parent")
    if int(claim_role_distribution.get("requiredClaimCitationFileCount") or 0) != required_claim_file_count:
        fail("Code QA claim role distribution requiredClaimCitationFileCount must match parent")
    if int(claim_role_distribution.get("requiredPrimaryFileCount") or 0) <= 0:
        fail("Code QA claim role distribution requiredPrimaryFileCount must be positive")
    claim_role_stats = claim_role_distribution.get("roles")
    claim_file_stats = claim_role_distribution.get("files")
    if not isinstance(claim_role_stats, list) or not claim_role_stats:
        fail("Code QA claim role distribution roles must be non-empty")
    if not isinstance(claim_file_stats, list) or not claim_file_stats:
        fail("Code QA claim role distribution files must be non-empty")
    if any(not isinstance(item, dict) or item.get("role") not in allowed_roles for item in claim_role_stats):
        fail("Code QA claim role distribution roles contains an invalid role")
    if not any(item.get("role") == "PRIMARY" for item in claim_role_stats if isinstance(item, dict)):
        fail("Code QA claim role distribution roles must include PRIMARY")
    for item in claim_file_stats:
        file_path = item.get("filePath") if isinstance(item, dict) else None
        if not isinstance(file_path, str) or not file_path.strip() or file_path.startswith("/") or "\\" in file_path or ".." in file_path:
            fail("Code QA claim role distribution files contains an unsafe filePath")
    mismatched_citation_ids = [
        item.get("scanTaskId")
        for item in citations
        if item.get("scanTaskId") != scan_task_id
    ]
    if mismatched_citation_ids:
        fail(f"Code QA answerCitations scanTaskId mismatch: {mismatched_citation_ids} expected {scan_task_id}")
    mismatched_chunk_ids = [
        item.get("scanTaskId")
        for item in chunks
        if item.get("scanTaskId") != scan_task_id
    ]
    if mismatched_chunk_ids:
        fail(f"Code QA retrievedChunks scanTaskId mismatch: {mismatched_chunk_ids} expected {scan_task_id}")
    citation_scan_task_ids = sorted({item.get("scanTaskId") for item in citations})
    cited_answer_scan_task_ids = sorted({item.get("scanTaskId") for item in cited_citations})
    retrieved_chunk_scan_task_ids = sorted({item.get("scanTaskId") for item in chunks})
    coverage_unique_file_count = int(citation_coverage.get("uniqueEvidenceFileCount") or 0)
    coverage_cited_file_count = int(citation_coverage.get("citedEvidenceFileCount") or 0)
    coverage_primary_file_count = int(citation_coverage.get("primaryEvidenceFileCount") or 0)
    coverage_cited_primary_file_count = int(citation_coverage.get("citedPrimaryEvidenceFileCount") or 0)
    coverage_context_file_count = int(citation_coverage.get("contextEvidenceFileCount") or 0)
    coverage_cited_context_file_count = int(citation_coverage.get("citedContextEvidenceFileCount") or 0)
    coverage_status = citation_coverage.get("status")
    citation_binding_satisfied = coverage_cited_file_count > 0 and coverage_cited_primary_file_count > 0
    claim_binding_satisfied = (
        claim_citation_coverage.get("status") == "READY"
        and cited_required_claim_count >= required_claim_count
        and int(claim_role_distribution.get("requiredPrimaryBoundClaimCount") or 0) >= required_claim_count
    )
    full_citation_coverage_satisfied = coverage_status == "FULL"
    required_citation_coverage_satisfied = coverage_status in {"FULL", "REQUIRED_FULL"}
    primary_coverage_satisfied = (
        coverage_primary_file_count > 0
        and coverage_cited_primary_file_count >= coverage_primary_file_count
    )
    summary_ready = required_citation_coverage_satisfied and primary_coverage_satisfied and claim_binding_satisfied
    cross_file_citation_summary = {
        "visible": True,
        "tones": ["ready" if summary_ready else "warning"],
        "statuses": [evidence_role_distribution.get("status")],
        "crossFileEvidenceSatisfied": coverage_unique_file_count >= 2,
        "citationBindingSatisfied": citation_binding_satisfied,
        "claimBindingSatisfied": claim_binding_satisfied,
        "coverageStatus": coverage_status,
        "fullCitationCoverageSatisfied": full_citation_coverage_satisfied,
        "requiredCitationCoverageSatisfied": required_citation_coverage_satisfied,
        "primaryCoverageSatisfied": primary_coverage_satisfied,
        "currentScanOnly": True,
        "sourceEvidenceScopes": ["CODE_QA_RESULT"],
        "evidenceFileCount": coverage_unique_file_count,
        "citedEvidenceFileCount": coverage_cited_file_count,
        "primaryEvidenceFileCount": coverage_primary_file_count,
        "citedPrimaryEvidenceFileCount": coverage_cited_primary_file_count,
        "contextEvidenceFileCount": coverage_context_file_count,
        "citedContextEvidenceFileCount": coverage_cited_context_file_count,
        "requiredClaimCount": required_claim_count,
        "requiredClaimCitationFileCount": required_claim_file_count,
        "requiredPrimaryFileCount": int(claim_role_distribution.get("requiredPrimaryFileCount") or 0),
        "requiredPrimaryBoundClaimCount": int(claim_role_distribution.get("requiredPrimaryBoundClaimCount") or 0),
    }
    return {
        "retrievalMode": payload.get("retrievalMode"),
        "resultCount": result_count,
        "readiness": readiness,
        "confidence": confidence,
        "uniqueFiles": profile.get("uniqueFiles"),
        "groundingStatus": grounding_status,
        "citationEnforcementStatus": citation_enforcement_status,
        "retrievalPlan": {
            "queryStrategy": query_strategy,
            "fallbackReason": retrieval_plan.get("fallbackReason"),
            "questionEmbeddingAvailable": question_embedding_available,
            "embeddingCoveragePercent": embedding_coverage_percent,
            "embeddingCoverageStatus": embedding_coverage_status,
            "semanticPoolAttempted": semantic_pool_attempted,
            "semanticPoolStrategy": semantic_pool_strategy,
            "semanticPoolLoadedCount": semantic_pool_loaded_count,
            "semanticPoolLimit": semantic_pool_limit,
            "semanticPoolTruncated": semantic_pool_truncated,
            "semanticPoolCoveragePercent": semantic_pool_coverage_percent,
            "semanticPlanReason": semantic_plan_reason,
            "semanticReadinessStatus": semantic_readiness_status,
            "semanticReadinessReason": semantic_readiness_reason,
            "crossFileIntentPresent": cross_file_intent_present,
            "crossFileEvidenceSatisfied": cross_file_evidence_satisfied,
            "crossFilePrimaryFileCount": cross_file_primary_file_count,
            "crossFileEvidenceStatus": cross_file_evidence_status,
            "graphRelationEvidencePresent": graph_relation_evidence_present,
            "graphRelationPrimaryLabels": graph_relation_primary_labels,
            "graphRelationEvidenceCount": graph_relation_evidence_count,
        },
        "citationCount": len(citations),
        "citedChunkCount": len(cited_citations),
        "citationCoverage": {
            "status": citation_coverage.get("status"),
            "coveragePercent": coverage_percent,
            "totalEvidenceCount": int(citation_coverage.get("totalEvidenceCount") or 0),
            "citedEvidenceCount": int(citation_coverage.get("citedEvidenceCount") or 0),
            "uncitedCandidateCount": int(citation_coverage.get("uncitedCandidateCount") or 0),
            "repairCandidateCount": int(citation_coverage.get("repairCandidateCount") or 0),
            "uniqueEvidenceFileCount": int(citation_coverage.get("uniqueEvidenceFileCount") or 0),
            "citedEvidenceFileCount": int(citation_coverage.get("citedEvidenceFileCount") or 0),
            "primaryEvidenceFileCount": int(citation_coverage.get("primaryEvidenceFileCount") or 0),
            "citedPrimaryEvidenceFileCount": int(citation_coverage.get("citedPrimaryEvidenceFileCount") or 0),
            "contextEvidenceFileCount": int(citation_coverage.get("contextEvidenceFileCount") or 0),
            "citedContextEvidenceFileCount": int(citation_coverage.get("citedContextEvidenceFileCount") or 0),
            "evidenceRoleDistribution": {
                "status": evidence_role_distribution.get("status"),
                "totalFileCount": int(evidence_role_distribution.get("totalFileCount") or 0),
                "citedFileCount": int(evidence_role_distribution.get("citedFileCount") or 0),
                "primaryFileCount": int(evidence_role_distribution.get("primaryFileCount") or 0),
                "citedPrimaryFileCount": int(evidence_role_distribution.get("citedPrimaryFileCount") or 0),
                "contextFileCount": int(evidence_role_distribution.get("contextFileCount") or 0),
                "citedContextFileCount": int(evidence_role_distribution.get("citedContextFileCount") or 0),
                "roleCount": len(role_stats),
                "fileEntryCount": len(file_stats),
            },
        },
        "crossFileCitationSummary": cross_file_citation_summary,
        "rawRetrievedChunkContentAbsent": raw_chunk_content_boundary["rawRetrievedChunkContentAbsent"],
        "contentPreviewMaxLength": raw_chunk_content_boundary["contentPreviewMaxLength"],
        "claimCitationCoverage": {
            "status": claim_citation_coverage.get("status"),
            "readyForRepair": claim_citation_coverage.get("readyForRepair") is True,
            "readinessReason": claim_citation_coverage.get("readinessReason") or "",
            "claimCoveragePercent": int(claim_citation_coverage.get("claimCoveragePercent") or 0),
            "requiredClaimCount": required_claim_count,
            "citedRequiredClaimCount": cited_required_claim_count,
            "uncitedRequiredClaimCount": int(claim_citation_coverage.get("uncitedRequiredClaimCount") or 0),
            "invalidCitationClaimCount": int(claim_citation_coverage.get("invalidCitationClaimCount") or 0),
            "validCitationFileCount": valid_claim_file_count,
            "requiredClaimCitationFileCount": required_claim_file_count,
            "roleDistribution": {
                "status": claim_role_distribution.get("status"),
                "requiredClaimCount": int(claim_role_distribution.get("requiredClaimCount") or 0),
                "requiredPrimaryBoundClaimCount": int(claim_role_distribution.get("requiredPrimaryBoundClaimCount") or 0),
                "requiredContextOnlyClaimCount": int(claim_role_distribution.get("requiredContextOnlyClaimCount") or 0),
                "requiredUnknownOnlyClaimCount": int(claim_role_distribution.get("requiredUnknownOnlyClaimCount") or 0),
                "unbackedRequiredClaimCount": int(claim_role_distribution.get("unbackedRequiredClaimCount") or 0),
                "invalidRequiredClaimCount": int(claim_role_distribution.get("invalidRequiredClaimCount") or 0),
                "validCitationFileCount": int(claim_role_distribution.get("validCitationFileCount") or 0),
                "requiredClaimCitationFileCount": int(claim_role_distribution.get("requiredClaimCitationFileCount") or 0),
                "requiredPrimaryFileCount": int(claim_role_distribution.get("requiredPrimaryFileCount") or 0),
                "roleCount": len(claim_role_stats),
                "fileEntryCount": len(claim_file_stats),
            },
        },
        "citationScanTaskIds": citation_scan_task_ids,
        "citedAnswerScanTaskIds": cited_answer_scan_task_ids,
        "retrievedChunkScanTaskIds": retrieved_chunk_scan_task_ids,
    }


def validate_claim_citation_noise_boundary(project_id, scan_task_id, token, llm_setup):
    if CLAIM_NOISE_MODE == "false":
        return {
            "status": "DISABLED",
            "mode": CLAIM_NOISE_MODE,
            "providerQualityClaim": False,
            "llmFactClaim": False,
        }
    if not isinstance(llm_setup, dict) or llm_setup.get("status") != "OK":
        return claim_noise_skip("mock_llm_not_configured", llm_setup)

    question = "claim citation noise boundary 假引用噪声 auth token citation evidence C1"
    payload = request_with_transient_status_retries(
        "POST",
        f"/projects/{project_id}/qa",
        {"scanTaskId": scan_task_id, "question": question},
        token=token,
        timeout=90,
    )["data"]
    if payload.get("scanTaskId") != scan_task_id:
        fail(f"Project QA claim citation noise used unexpected scanTaskId: {payload.get('scanTaskId')} expected {scan_task_id}")

    result_count = int(payload.get("resultCount") or 0)
    if result_count <= 0:
        fail("Project QA claim citation noise boundary returned no retrieved chunks")
    chunks = payload.get("retrievedChunks")
    if not isinstance(chunks, list) or not chunks:
        fail("Project QA claim citation noise boundary retrievedChunks are empty or malformed")
    raw_chunk_content_boundary = ensure_no_raw_retrieved_chunk_content(payload, "Project QA claim citation noise boundary")
    citations = payload.get("answerCitations")
    if not isinstance(citations, list) or not citations:
        fail("Project QA claim citation noise boundary answerCitations are empty or malformed")
    if any(item.get("scanTaskId") != scan_task_id for item in citations if isinstance(item, dict)):
        fail("Project QA claim citation noise boundary citations must stay bound to the current scanTaskId")
    cited_by_answer = [item for item in citations if isinstance(item, dict) and item.get("citedByAnswer") is True]
    if cited_by_answer:
        fail("Project QA claim citation noise boundary must not mark code/log/stack citation labels as citedByAnswer")

    answer = payload.get("answer")
    if not isinstance(answer, str) or not answer.strip():
        fail("Project QA claim citation noise boundary answer is empty")
    required_noise_fragments = {
        "fenced-code": "fake citation marker in code must be ignored [C1]",
        "timestamp-log": "ERROR AuthService failed token validation [C1]",
        "exception-line": "IllegalStateException",
        "inline-code": "`[C1]`",
    }
    missing_noise = sorted(
        kind for kind, fragment in required_noise_fragments.items()
        if fragment not in answer
    )
    if missing_noise:
        fail(f"Project QA claim citation noise boundary answer missing noise kinds: {missing_noise}")

    grounding_status = payload.get("groundingStatus")
    if grounding_status not in {"UNVERIFIED", "PARTIAL"}:
        fail(f"Project QA claim citation noise boundary must not be VERIFIED: {grounding_status}")
    citation_enforcement_status = payload.get("citationEnforcementStatus")
    if citation_enforcement_status != "RETRY_FAILED":
        fail(f"Project QA claim citation noise boundary citationEnforcementStatus must be RETRY_FAILED: {citation_enforcement_status}")

    citation_coverage = payload.get("citationCoverage")
    if not isinstance(citation_coverage, dict):
        fail("Project QA claim citation noise boundary citationCoverage is missing or not an object")
    if citation_coverage.get("status") != "NONE":
        fail(f"Project QA claim citation noise boundary citationCoverage.status must be NONE: {citation_coverage.get('status')}")
    if int(citation_coverage.get("citedEvidenceCount") or 0) != 0:
        fail("Project QA claim citation noise boundary citedEvidenceCount must be 0")
    if int(citation_coverage.get("repairCandidateCount") or 0) != 0:
        fail("Project QA claim citation noise boundary repairCandidateCount must be 0")

    claim_citation_coverage = payload.get("claimCitationCoverage")
    if not isinstance(claim_citation_coverage, dict):
        fail("Project QA claim citation noise boundary claimCitationCoverage is missing or not an object")
    if claim_citation_coverage.get("status") != "REVIEW":
        fail(f"Project QA claim citation noise boundary claimCitationCoverage.status must be REVIEW: {claim_citation_coverage.get('status')}")
    if int(claim_citation_coverage.get("citedRequiredClaimCount") or 0) != 0:
        fail("Project QA claim citation noise boundary citedRequiredClaimCount must be 0")
    if int(claim_citation_coverage.get("invalidCitationClaimCount") or 0) != 0:
        fail("Project QA claim citation noise boundary invalidCitationClaimCount must be 0")
    claim_role_distribution = claim_citation_coverage.get("roleDistribution")
    if not isinstance(claim_role_distribution, dict):
        fail("Project QA claim citation noise boundary claim roleDistribution is missing or not an object")
    if claim_role_distribution.get("status") != "REVIEW_UNCITED":
        fail(f"Project QA claim citation noise boundary roleDistribution.status must be REVIEW_UNCITED: {claim_role_distribution.get('status')}")
    if int(claim_role_distribution.get("requiredPrimaryBoundClaimCount") or 0) != 0:
        fail("Project QA claim citation noise boundary requiredPrimaryBoundClaimCount must be 0")

    return {
        "status": "OK",
        "mode": CLAIM_NOISE_MODE,
        "probeKind": "REAL_PUBLIC_REPO_CODE_QA_CLAIM_CITATION_NOISE",
        "llmSetup": llm_setup,
        "scanTaskId": scan_task_id,
        "requestScanTaskId": scan_task_id,
        "responseScanTaskId": payload.get("scanTaskId"),
        "resultCount": result_count,
        "rawRetrievedChunkContentAbsent": raw_chunk_content_boundary["rawRetrievedChunkContentAbsent"],
        "contentPreviewMaxLength": raw_chunk_content_boundary["contentPreviewMaxLength"],
        "citationCount": len(citations),
        "noiseKinds": sorted(required_noise_fragments.keys()),
        "groundingStatuses": [grounding_status],
        "citationEnforcementStatuses": [citation_enforcement_status],
        "coverageStatus": citation_coverage.get("status"),
        "maxCitedEvidenceCount": int(citation_coverage.get("citedEvidenceCount") or 0),
        "maxRepairCandidateCount": int(citation_coverage.get("repairCandidateCount") or 0),
        "claimCitationStatus": claim_citation_coverage.get("status"),
        "maxCitedRequiredClaimCount": int(claim_citation_coverage.get("citedRequiredClaimCount") or 0),
        "maxInvalidCitationClaimCount": int(claim_citation_coverage.get("invalidCitationClaimCount") or 0),
        "roleDistributionStatus": claim_role_distribution.get("status"),
        "maxRequiredPrimaryBoundClaimCount": int(claim_role_distribution.get("requiredPrimaryBoundClaimCount") or 0),
        "answerCitationsCitedByAnswer": False,
        "repairEvidenceGateBlockedVisible": True,
        "rawAnswerStored": False,
        "rawPromptStored": False,
        "providerQualityClaim": False,
        "llmFactClaim": False,
        "mutationFree": True,
        "dbMutationUsed": False,
    }


WEAK_KEYWORD_EVAL_DEFAULT_REPO_URLS = {
    "https://github.com/ljunp/pawnshop-management-system.git",
    "git@github.com:ljunp/pawnshop-management-system.git",
}

WEAK_KEYWORD_EVAL_CASES = [
    {
        "id": "pawnshop-login-endpoint",
        "question": "登录接口在哪里处理",
        "intent": "backend-endpoint",
        "expectedFallbackPrimaryRoles": ["CONTROLLER"],
    },
    {
        "id": "pawnshop-apply-data-access",
        "question": "典当申请 Dao 在哪里",
        "intent": "business-data-access",
        "expectedFallbackPrimaryRoles": ["DATA_ACCESS"],
    },
    {
        "id": "query-run-config",
        "question": "运行时固定配置在哪里准备",
        "intent": "runtime-config",
        "expectedFallbackPrimaryRoles": ["CONFIG"],
    },
    {
        "id": "pawnshop-user-data-access",
        "question": "用户 Dao 在哪里",
        "intent": "user-data-access",
        "expectedFallbackPrimaryRoles": ["DATA_ACCESS"],
    },
]


def normalize_repo_url_for_weak_keyword_eval(value):
    normalized = (value or "").strip().lower()
    if normalized.startswith("http://"):
        normalized = "https://" + normalized[len("http://"):]
    if normalized.endswith("/"):
        normalized = normalized[:-1]
    return normalized


def weak_keyword_eval_result(status, **fields):
    result = {
        "status": status,
        "mode": WEAK_KEYWORD_EVAL_MODE,
        "probeKind": "REAL_WEAK_KEYWORD_SAMPLE_EVAL",
        "sampleSet": "Pawnshop-Management-System:weak-keyword-eval-v2",
        "sampleCount": len(WEAK_KEYWORD_EVAL_CASES),
        "weakKeywordThreshold": 45,
        "semanticPoolLimit": 500,
        "mutationFree": True,
        "nonDbMutation": True,
        "dbMutationUsed": False,
        "providerQualityClaim": False,
        "minSemanticFallbackHits": WEAK_KEYWORD_EVAL_MIN_SEMANTIC_FALLBACK,
    }
    result.update(fields)
    return result


def weak_keyword_eval_skip(reason):
    if WEAK_KEYWORD_EVAL_MODE == "true":
        fail(f"Project QA weak keyword eval required but unavailable: {reason}")
    print(f"Project QA weak keyword eval skipped: {reason}", flush=True)
    return weak_keyword_eval_result("SKIPPED", reason=reason)


def infer_representative_fallback_role(file_path, evidence_type):
    evidence_type = str(evidence_type or "").strip()
    if evidence_type in {"CONTROLLER", "SERVICE", "DATA_ACCESS", "DOMAIN_MODEL", "FRONTEND", "CONFIG", "TEST"}:
        return evidence_type
    path = str(file_path or "").replace("\\", "/").lower()
    if not path:
        return None
    if "/controller/" in path or path.endswith("controller.java") or path.endswith("controller.kt"):
        return "CONTROLLER"
    if "/service/" in path or path.endswith("service.java") or path.endswith("service.kt"):
        return "SERVICE"
    if (
        "/repository/" in path
        or path.endswith("repository.java")
        or path.endswith("repository.kt")
        or "/mapper/" in path
        or path.endswith("mapper.java")
        or path.endswith("mapper.kt")
        or "/dao/" in path
        or path.endswith("dao.java")
        or path.endswith("dao.kt")
    ):
        return "DATA_ACCESS"
    backend_model_source = (
        path.endswith(".java")
        or path.endswith(".kt")
        or path.endswith(".py")
        or path.endswith(".go")
        or path.endswith(".rs")
    )
    if backend_model_source and (
        "/entity/" in path
        or path.endswith("entity.java")
        or path.endswith("entity.kt")
        or "/model/" in path
        or path.endswith("model.java")
        or path.endswith("model.kt")
    ):
        return "DOMAIN_MODEL"
    if (
        "web-console/src/" in path
        or "/admin/src/" in path
        or "/components/" in path
        or "/views/" in path
        or "/pages/" in path
        or "/router/" in path
        or "/src/api/" in path
        or path.endswith(".tsx")
        or path.endswith(".jsx")
        or path.endswith(".vue")
    ):
        return "FRONTEND"
    if (
        "/config/" in path
        or "/src/main/resources/" in path
        or path.endswith("application.yml")
        or path.endswith("application.yaml")
        or path.endswith("application.properties")
        or path.endswith(".env")
        or path.endswith(".yml")
        or path.endswith(".yaml")
        or path.endswith(".properties")
    ):
        return "CONFIG"
    if (
        "/test/" in path
        or "/tests/" in path
        or path.endswith("test.java")
        or path.endswith("tests.java")
        or path.endswith(".spec.ts")
        or path.endswith(".spec.tsx")
        or path.endswith(".test.ts")
        or path.endswith(".test.tsx")
    ):
        return "TEST"
    return evidence_type or None


def configure_mock_llm_config(token, purpose):
    payload = {
        "provider": "MOCK",
        "modelName": "mock",
        "apiKey": f"mock-local-{purpose}-key",
        "baseUrl": "mock://local",
        "temperature": 0,
        "maxTokens": 1024,
    }
    ok, created, error = request_optional("POST", "/llm-configs", payload, token=token)
    if not ok:
        return False, None, f"mock_llm_config_create_failed:{error}"
    config = (created or {}).get("data") or {}
    config_id = config.get("id")
    if not isinstance(config_id, int) or config_id <= 0:
        return False, None, "mock_llm_config_missing_id"
    ok, _, error = request_optional("POST", f"/llm-configs/{config_id}/activate", token=token)
    if not ok:
        return False, None, f"mock_llm_config_activate_failed:{error}"
    return True, {"provider": "MOCK", "modelKey": "MOCK:text-embedding-3-small", "configId": config_id}, None


def maybe_configure_mock_llm_for_weak_keyword_eval(token):
    if WEAK_KEYWORD_EVAL_MODE == "false":
        return {"status": "SKIPPED", "reason": "disabled"}
    if WEAK_KEYWORD_EVAL_CONFIGURE_MOCK != "true":
        return {"status": "SKIPPED", "reason": "not_requested"}
    ok, payload, error = configure_mock_llm_config(token, "weak-keyword-eval")
    if ok:
        return {"status": "OK", **payload}
    if WEAK_KEYWORD_EVAL_MODE == "true":
        fail(f"Project QA weak keyword eval MOCK LLM setup required but unavailable: {error}")
    return {"status": "SKIPPED", "reason": error}


def maybe_remove_mock_llm_after_weak_keyword_eval(token, llm_setup):
    if not isinstance(llm_setup, dict) or llm_setup.get("status") != "OK":
        return {"status": "SKIPPED", "reason": "no_mock_config"}
    config_id = llm_setup.get("configId")
    if not isinstance(config_id, int) or config_id <= 0:
        return {"status": "SKIPPED", "reason": "missing_config_id"}
    ok, _, error = request_optional("DELETE", f"/llm-configs/{config_id}", token=token)
    if ok:
        return {"status": "OK", "configId": config_id}
    if WEAK_KEYWORD_EVAL_MODE == "true":
        fail(f"Project QA weak keyword eval MOCK LLM cleanup failed: {error}")
    return {"status": "WARN", "configId": config_id, "reason": error}


def maybe_configure_mock_llm_for_claim_noise(token):
    if CLAIM_NOISE_MODE == "false":
        return {"status": "SKIPPED", "reason": "disabled"}
    if CLAIM_NOISE_CONFIGURE_MOCK != "true":
        return {"status": "SKIPPED", "reason": "not_requested"}
    ok, payload, error = configure_mock_llm_config(token, "claim-noise-boundary")
    if ok:
        return {"status": "OK", **payload}
    if CLAIM_NOISE_MODE == "true":
        fail(f"Project QA claim citation noise MOCK LLM setup required but unavailable: {error}")
    return {"status": "SKIPPED", "reason": error}


def maybe_remove_mock_llm_after_claim_noise(token, llm_setup):
    if not isinstance(llm_setup, dict) or llm_setup.get("status") != "OK":
        return {"status": "SKIPPED", "reason": "no_mock_config"}
    config_id = llm_setup.get("configId")
    if not isinstance(config_id, int) or config_id <= 0:
        return {"status": "SKIPPED", "reason": "missing_config_id"}
    ok, _, error = request_optional("DELETE", f"/llm-configs/{config_id}", token=token)
    if ok:
        return {"status": "OK", "configId": config_id}
    if CLAIM_NOISE_MODE == "true":
        fail(f"Project QA claim citation noise MOCK LLM cleanup failed: {error}")
    return {"status": "WARN", "configId": config_id, "reason": error}


def claim_noise_skip(reason, llm_setup=None):
    if CLAIM_NOISE_MODE == "true":
        fail(f"Project QA claim citation noise boundary required but unavailable: {reason}")
    print(f"Project QA claim citation noise boundary skipped: {reason}", flush=True)
    return {
        "status": "SKIPPED",
        "mode": CLAIM_NOISE_MODE,
        "reason": reason,
        "llmSetup": llm_setup or {"status": "SKIPPED", "reason": reason},
        "providerQualityClaim": False,
        "llmFactClaim": False,
    }


def weak_keyword_threshold_bucket(matched_chunks):
    if matched_chunks <= 0:
        return "NO_KEYWORD"
    if matched_chunks < 45:
        return "WEAK_LT_45"
    if matched_chunks < 100:
        return "MEDIUM_GE_45"
    return "STRONG"


def weak_keyword_observation(retrieval_mode, matched_chunks, result_count, embedded_chunks, primary_has_embedding):
    if result_count <= 0:
        return "NO_EVIDENCE"
    if embedded_chunks <= 0:
        return "NO_EMBEDDINGS"
    if retrieval_mode == "SEMANTIC_FALLBACK" and matched_chunks <= 0 and primary_has_embedding is True:
        return "SEMANTIC_AVAILABLE"
    if retrieval_mode == "HYBRID" and primary_has_embedding is True:
        return "SEMANTIC_AVAILABLE"
    return "KEYWORD_ONLY"


def weak_keyword_recommendation(status, semantic_fallback_hits, embedded_chunks):
    if embedded_chunks <= 0:
        return "INSUFFICIENT_EMBEDDINGS"
    if status == "OK":
        return "KEEP_THRESHOLD"
    if semantic_fallback_hits <= 0:
        return "REVIEW_THRESHOLD"
    return "INSUFFICIENT_SAMPLE"


def validate_project_qa_weak_keyword_evaluation(project_id, scan_task_id, token, llm_setup):
    if WEAK_KEYWORD_EVAL_MODE == "false":
        return weak_keyword_eval_result("DISABLED", reason="disabled")

    normalized_repo = normalize_repo_url_for_weak_keyword_eval(REPO_URL)
    if normalized_repo not in WEAK_KEYWORD_EVAL_DEFAULT_REPO_URLS:
        return weak_keyword_eval_skip(f"default_repo_sample_set_not_applicable:{REPO_URL}")

    cases = []
    retrieval_modes = {}
    low_keyword_cases = 0
    semantic_fallback_hits = 0
    intent_role_bound_hits = 0
    representative_fallback_hits = 0
    evaluated_count = 0
    skipped_count = 0
    max_embedded_chunks = 0
    max_total_chunks = 0
    scan_task_mismatches = []
    allowed_modes = {"KEYWORD", "HYBRID", "SEMANTIC_FALLBACK", "STABLE_FALLBACK", "NO_CONTEXT"}

    for case in WEAK_KEYWORD_EVAL_CASES:
        payload = request_with_transient_status_retries(
            "POST",
            f"/projects/{project_id}/qa",
            {"scanTaskId": scan_task_id, "question": case["question"]},
            token=token,
            timeout=90,
        )["data"]
        if payload.get("scanTaskId") != scan_task_id:
            scan_task_mismatches.append(payload.get("scanTaskId"))
        chunks = payload.get("retrievedChunks")
        if not isinstance(chunks, list):
            chunks = []
        raw_chunk_content_boundary = ensure_no_raw_retrieved_chunk_content(
            {**payload, "retrievedChunks": chunks},
            f"Project QA weak keyword eval case {case['id']}",
        )
        retrieval_mode = payload.get("retrievalMode") or "UNKNOWN"
        if retrieval_mode not in allowed_modes:
            fail(f"Project QA weak keyword eval returned unknown retrievalMode: {retrieval_mode}")
        retrieval_modes[retrieval_mode] = retrieval_modes.get(retrieval_mode, 0) + 1
        matched_chunks = int(payload.get("matchedChunks") or 0)
        result_count = int(payload.get("resultCount") or 0)
        embedded_chunks = int(payload.get("embeddedChunks") or 0)
        total_chunks = int(payload.get("totalChunks") or 0)
        max_embedded_chunks = max(max_embedded_chunks, embedded_chunks)
        max_total_chunks = max(max_total_chunks, total_chunks)
        if matched_chunks < 45:
            low_keyword_cases += 1
        if retrieval_mode == "SEMANTIC_FALLBACK" and matched_chunks <= 0 and result_count > 0:
            semantic_fallback_hits += 1
        evaluated_count += 1

        profile = payload.get("evidenceProfile") or {}
        retrieval_plan = payload.get("retrievalPlan") or {}
        primary = chunks[0] if chunks else {}
        primary_scan_task_ids = sorted({item.get("scanTaskId") for item in chunks if item.get("scanTaskId") is not None})
        wrong_scan_task_ids = [item.get("scanTaskId") for item in chunks if item.get("scanTaskId") != scan_task_id]
        if wrong_scan_task_ids:
            fail(f"Project QA weak keyword eval retrievedChunks scanTaskId mismatch: {wrong_scan_task_ids} expected {scan_task_id}")
        primary_has_embedding = primary.get("hasEmbedding") if primary else None
        primary_file = primary.get("filePath") if primary else None
        primary_evidence_type = primary.get("evidenceType") if primary else None
        primary_fallback_role = infer_representative_fallback_role(primary_file, primary_evidence_type)
        expected_roles = case.get("expectedFallbackPrimaryRoles") or []
        intent_role_bound_primary = False
        if expected_roles and result_count > 0:
            if primary_fallback_role not in expected_roles:
                fail(
                    "Project QA weak keyword eval primary role mismatch: "
                    f"case={case['id']} expected={expected_roles} got={primary_fallback_role} "
                    f"retrievalMode={retrieval_mode} evidenceType={primary_evidence_type} file={primary_file}"
                )
            if not isinstance(retrieval_plan, dict):
                fail(f"Project QA weak keyword eval retrievalPlan must be an object: case={case['id']}")
            plan_roles = retrieval_plan.get("roleIntents") or retrieval_plan.get("fallbackRolePriority") or []
            if not isinstance(plan_roles, list) or not plan_roles:
                fail(f"Project QA weak keyword eval retrievalPlan role order is empty: case={case['id']}")
            if plan_roles[0] not in expected_roles:
                fail(
                    "Project QA weak keyword eval retrievalPlan first role mismatch: "
                    f"case={case['id']} expected={expected_roles} got={plan_roles[0]}"
                )
            intent_role_bound_primary = True
            intent_role_bound_hits += 1
        observation = weak_keyword_observation(
            retrieval_mode,
            matched_chunks,
            result_count,
            embedded_chunks,
            primary_has_embedding,
        )
        representative_fallback_primary = False
        if retrieval_mode == "STABLE_FALLBACK" and matched_chunks <= 0 and result_count > 0 and embedded_chunks <= 0:
            normalized_primary_file = str(primary_file or "").lower()
            representative_fallback_primary = primary_evidence_type != "DOCUMENTATION" \
                and not normalized_primary_file.endswith("readme.md") \
                and "/docs/" not in normalized_primary_file
            if not representative_fallback_primary:
                fail(
                    "Project QA weak keyword eval stable fallback primary must be code-oriented when embeddings are missing: "
                    f"file={primary_file} evidenceType={primary_evidence_type}"
                )
            if expected_roles and primary_fallback_role not in expected_roles:
                fail(
                    "Project QA weak keyword eval stable fallback primary role mismatch: "
                    f"case={case['id']} expected={expected_roles} got={primary_fallback_role} "
                    f"evidenceType={primary_evidence_type} file={primary_file}"
                )
            if not isinstance(retrieval_plan, dict):
                fail(f"Project QA weak keyword eval retrievalPlan must be an object: case={case['id']}")
            fallback_priority = retrieval_plan.get("fallbackRolePriority")
            if not isinstance(fallback_priority, list) or not fallback_priority:
                fail(f"Project QA weak keyword eval retrievalPlan.fallbackRolePriority is empty: case={case['id']}")
            if expected_roles and fallback_priority[0] not in expected_roles:
                fail(
                    "Project QA weak keyword eval retrievalPlan first role mismatch: "
                    f"case={case['id']} expected={expected_roles} got={fallback_priority[0]}"
                )
            fallback_reason = retrieval_plan.get("fallbackReason")
            if expected_roles and fallback_reason != "NO_KEYWORD_NO_EMBEDDING_INTENT_ROLE_FALLBACK":
                fail(
                    "Project QA weak keyword eval retrievalPlan fallbackReason mismatch: "
                    f"case={case['id']} expected=NO_KEYWORD_NO_EMBEDDING_INTENT_ROLE_FALLBACK got={fallback_reason}"
                )
            representative_fallback_hits += 1
        cases.append({
            "sampleId": case["id"],
            "scanTaskId": scan_task_id,
            "question": case["question"],
            "intent": case["intent"],
            "responseStatus": "OK",
            "retrievalMode": retrieval_mode,
            "matchedChunks": matched_chunks,
            "resultCount": result_count,
            "embeddedChunks": embedded_chunks,
            "totalChunks": total_chunks,
            "confidence": profile.get("confidence"),
            "groundingStatus": payload.get("groundingStatus"),
            "citationEnforcementStatus": payload.get("citationEnforcementStatus"),
            "retrievedChunkScanTaskIds": primary_scan_task_ids,
            "rawRetrievedChunkContentAbsent": raw_chunk_content_boundary["rawRetrievedChunkContentAbsent"],
            "contentPreviewMaxLength": raw_chunk_content_boundary["contentPreviewMaxLength"],
            "primary": {
                "filePath": primary_file,
                "startLine": primary.get("startLine"),
                "endLine": primary.get("endLine"),
                "hasEmbedding": primary_has_embedding,
                "contextRole": primary.get("contextRole"),
                "matchedTerms": primary.get("matchedTerms") or [],
                "relevanceScore": primary.get("relevanceScore"),
                "evidenceType": primary_evidence_type,
                "representativeFallbackRole": primary_fallback_role,
            },
            "thresholdBucket": weak_keyword_threshold_bucket(matched_chunks),
            "observation": observation,
            "expectedFallbackPrimaryRoles": case.get("expectedFallbackPrimaryRoles") or [],
            "representativeFallbackPrimary": representative_fallback_primary,
            "intentRoleBoundPrimary": intent_role_bound_primary,
            "retrievalPlan": {
                "roleIntents": retrieval_plan.get("roleIntents") or [],
                "fallbackRolePriority": retrieval_plan.get("fallbackRolePriority") or [],
                "auxiliaryHintsPresent": retrieval_plan.get("auxiliaryHintsPresent"),
                "fallbackReason": retrieval_plan.get("fallbackReason"),
            },
        })

    if scan_task_mismatches:
        fail(f"Project QA weak keyword eval scanTaskId mismatch: {scan_task_mismatches} expected {scan_task_id}")

    if max_embedded_chunks <= 0:
        if WEAK_KEYWORD_EVAL_MODE == "true":
            fail("Project QA weak keyword eval required embeddings but embeddedChunks=0")
        status = "INCONCLUSIVE"
        reason = "no_embeddings"
    elif semantic_fallback_hits >= WEAK_KEYWORD_EVAL_MIN_SEMANTIC_FALLBACK:
        status = "OK"
        reason = None
    elif intent_role_bound_hits >= evaluated_count:
        status = "OK"
        reason = None
    else:
        status = "INCONCLUSIVE"
        reason = "no_semantic_fallback_or_intent_role_bound_samples"

    if status != "OK" and WEAK_KEYWORD_EVAL_MODE == "true":
        fail(
            "Project QA weak keyword eval did not meet semantic fallback or intent role-bound threshold: "
            f"semantic={semantic_fallback_hits}/{evaluated_count}, "
            f"intentRoleBound={intent_role_bound_hits}/{evaluated_count}, "
            f"requiredSemantic={WEAK_KEYWORD_EVAL_MIN_SEMANTIC_FALLBACK}"
        )
    return weak_keyword_eval_result(
        status,
        reason=reason,
        projectId=project_id,
        scanTaskId=scan_task_id,
        evaluatedCount=evaluated_count,
        skippedCount=skipped_count,
        semanticFallbackHits=semantic_fallback_hits,
        intentRoleBoundHits=intent_role_bound_hits,
        representativeFallbackHits=representative_fallback_hits,
        lowKeywordCases=low_keyword_cases,
        retrievalModeDistribution=retrieval_modes,
        totalChunks=max_total_chunks,
        embeddedChunks=max_embedded_chunks,
        embeddingCoverage=round((max_embedded_chunks * 100.0) / max_total_chunks, 2) if max_total_chunks > 0 else 0.0,
        qualityMode="SEMANTIC_FALLBACK" if semantic_fallback_hits >= WEAK_KEYWORD_EVAL_MIN_SEMANTIC_FALLBACK else "INTENT_ROLE_BOUND",
        recommendation=weak_keyword_recommendation(status, semantic_fallback_hits, max_embedded_chunks),
        llmSetup=llm_setup,
        cases=cases,
        rawRetrievedChunkContentAbsentCaseCount=sum(1 for case in cases if case["rawRetrievedChunkContentAbsent"] is True),
        maxContentPreviewLength=max([case["contentPreviewMaxLength"] for case in cases] or [0]),
        boundary="Representative non-DB-mutation Project QA observation only; does not prove answer quality, external provider quality, or full release authority.",
    )


def semantic_probe_result(status, **fields):
    result = {
        "status": status,
        "mode": SEMANTIC_PROBE_MODE,
        "semanticPoolLimit": 500,
        "weakKeywordThreshold": 45,
    }
    result.update(fields)
    return result


def semantic_probe_skip(reason):
    if SEMANTIC_PROBE_MODE == "true":
        fail(f"Project QA semantic pool probe required but unavailable: {reason}")
    print(f"Project QA semantic pool probe skipped: {reason}", flush=True)
    return semantic_probe_result("SKIPPED", reason=reason)


def sql_quote(value):
    return "'" + str(value).replace("\\", "\\\\").replace("'", "\\'") + "'"


def java_string_hashcode(value):
    result = 0
    for char in value:
        result = (31 * result + ord(char)) & 0xFFFFFFFF
    if result >= 0x80000000:
        result -= 0x100000000
    return result


class JavaRandom:
    MULTIPLIER = 0x5DEECE66D
    ADDEND = 0xB
    MASK = (1 << 48) - 1

    def __init__(self, seed):
        self.seed = (seed ^ self.MULTIPLIER) & self.MASK

    def next_bits(self, bits):
        self.seed = (self.seed * self.MULTIPLIER + self.ADDEND) & self.MASK
        return self.seed >> (48 - bits)

    def next_float(self):
        return self.next_bits(24) / float(1 << 24)


def mock_embedding_for_text(text, dimensions=64):
    random = JavaRandom(java_string_hashcode((text or "").lower()))
    return [(random.next_float() * 2.0) - 1.0 for _ in range(dimensions)]


def zero_embedding(dimensions=64):
    return [0.0 for _ in range(dimensions)]


def configure_mock_llm_for_semantic_probe(token):
    if SEMANTIC_PROBE_MODE == "false":
        return semantic_probe_result("SKIPPED", reason="disabled")
    ok, payload, error = configure_mock_llm_config(token, "semantic-probe")
    if not ok:
        return semantic_probe_skip(error)
    return semantic_probe_result("OK", provider=payload["provider"], modelKey=payload["modelKey"])


def validate_project_qa_semantic_pool_probe(project_id, scan_task_id, token):
    if SEMANTIC_PROBE_MODE == "false":
        return semantic_probe_result("SKIPPED", reason="disabled")
    if shutil.which("docker") is None:
        return semantic_probe_skip("docker_not_available")
    if not docker_container_running(MYSQL_CONTAINER):
        return semantic_probe_skip(f"mysql_container_not_running:{MYSQL_CONTAINER}")

    mock_config = configure_mock_llm_for_semantic_probe(token)
    if mock_config.get("status") != "OK":
        return mock_config

    stdout, error = run_mysql(f"SELECT COUNT(*) FROM code_chunks WHERE scan_task_id={int(scan_task_id)}")
    if error:
        return semantic_probe_skip(f"chunk_count_query_failed:{error}")
    try:
        total_chunks = int(stdout.strip().splitlines()[0])
    except (IndexError, ValueError):
        return semantic_probe_skip("chunk_count_query_returned_invalid_result")
    if total_chunks <= 500:
        return semantic_probe_skip(f"not_enough_chunks_for_distributed_semantic_pool_boundary:{total_chunks}")

    target_offset = min(520, total_chunks - 1)
    if target_offset < 500:
        return semantic_probe_skip(f"not_enough_chunks_for_distributed_semantic_pool_tail:{total_chunks}")

    target_sql = (
        "SELECT id, file_path, start_line, end_line "
        "FROM code_chunks "
        f"WHERE scan_task_id={int(scan_task_id)} "
        "ORDER BY id ASC "
        f"LIMIT 1 OFFSET {int(target_offset)}"
    )
    stdout, error = run_mysql(target_sql)
    if error:
        return semantic_probe_skip(f"target_chunk_query_failed:{error}")
    target_row = stdout.strip().split("\t")
    if len(target_row) < 4:
        return semantic_probe_skip("target_chunk_query_returned_invalid_result")
    target_id_raw, target_file, target_start_raw, target_end_raw = target_row[:4]
    try:
        target_id = int(target_id_raw)
        target_start = int(target_start_raw)
        target_end = int(target_end_raw)
    except ValueError:
        return semantic_probe_skip("target_chunk_query_returned_invalid_numeric_fields")

    question = "龘靐齉"
    question_embedding = json.dumps(mock_embedding_for_text(question), separators=(",", ":"))
    zero_vector = json.dumps(zero_embedding(), separators=(",", ":"))
    model_key = "MOCK:text-embedding-3-small"
    update_sql = (
        "UPDATE code_chunks SET embedding=NULL, embedding_model=NULL "
        f"WHERE scan_task_id={int(scan_task_id)}; "
        "UPDATE code_chunks SET "
        f"embedding={sql_quote(zero_vector)}, embedding_model={sql_quote(model_key)} "
        f"WHERE id IN (SELECT id FROM (SELECT id FROM code_chunks WHERE scan_task_id={int(scan_task_id)} "
        "ORDER BY id ASC LIMIT 500) AS semantic_probe_default_pool); "
        "UPDATE code_chunks SET "
        f"embedding={sql_quote(question_embedding)}, embedding_model={sql_quote(model_key)} "
        f"WHERE id={int(target_id)} AND scan_task_id={int(scan_task_id)};"
    )
    _, error = run_mysql(update_sql)
    if error:
        return semantic_probe_skip(f"semantic_probe_embedding_update_failed:{error}")

    qa_payload = request_with_transient_status_retries(
        "POST",
        f"/projects/{project_id}/qa",
        {"scanTaskId": scan_task_id, "question": question},
        token=token,
        timeout=90,
    )["data"]
    if qa_payload.get("scanTaskId") != scan_task_id:
        fail(f"Project QA semantic pool probe used unexpected scanTaskId: {qa_payload.get('scanTaskId')} expected {scan_task_id}")
    if int(qa_payload.get("matchedChunks") or 0) != 0:
        fail(f"Project QA semantic pool probe expected matchedChunks=0, got {qa_payload.get('matchedChunks')}")
    if qa_payload.get("retrievalMode") != "SEMANTIC_FALLBACK":
        fail(f"Project QA semantic pool probe expected SEMANTIC_FALLBACK, got {qa_payload.get('retrievalMode')}")
    chunks = qa_payload.get("retrievedChunks")
    if not isinstance(chunks, list) or not chunks:
        fail("Project QA semantic pool probe returned no retrievedChunks")
    raw_chunk_content_boundary = ensure_no_raw_retrieved_chunk_content(qa_payload, "Project QA semantic pool probe")
    primary = chunks[0]
    target_chunk = next((item for item in chunks if item.get("id") == target_id), None)
    if target_chunk is None:
        returned_ids = [item.get("id") for item in chunks]
        fail(f"Project QA semantic pool probe target chunk was not retrieved: expected id={target_id}, got ids={returned_ids}")
    if target_chunk.get("filePath") != target_file:
        fail(f"Project QA semantic pool probe target file drifted: expected {target_file}, got {target_chunk.get('filePath')}")
    if not ranges_overlap({"startLine": target_start, "endLine": target_end}, target_chunk):
        fail(
            "Project QA semantic pool probe target range drifted: "
            f"expected {target_start}-{target_end}, got {target_chunk.get('startLine')}-{target_chunk.get('endLine')}"
        )
    if target_chunk.get("hasEmbedding") is not True:
        fail("Project QA semantic pool probe target chunk must expose hasEmbedding=true")
    if primary.get("hasEmbedding") is not True:
        fail("Project QA semantic pool probe primary chunk must expose hasEmbedding=true")
    if primary.get("contextRole") != "PRIMARY":
        fail(f"Project QA semantic pool probe first chunk must be PRIMARY, got {primary.get('contextRole')}")
    mismatched_chunk_ids = [
        item.get("scanTaskId")
        for item in chunks
        if item.get("scanTaskId") != scan_task_id
    ]
    if mismatched_chunk_ids:
        fail(f"Project QA semantic pool probe retrievedChunks scanTaskId mismatch: {mismatched_chunk_ids} expected {scan_task_id}")

    evidence_profile = qa_payload.get("evidenceProfile") or {}
    embedded_chunks = int(qa_payload.get("embeddedChunks") or 0)
    if embedded_chunks < 501:
        fail(f"Project QA semantic pool probe expected embeddedChunks>=501, got {embedded_chunks}")
    retrieval_plan = qa_payload.get("retrievalPlan") or {}
    if retrieval_plan.get("semanticPoolStrategy") != "HEAD_DISTRIBUTED_WINDOWS":
        fail(
            "Project QA semantic pool probe expected retrievalPlan.semanticPoolStrategy=HEAD_DISTRIBUTED_WINDOWS, "
            f"got {retrieval_plan.get('semanticPoolStrategy')}"
        )
    if retrieval_plan.get("semanticPoolAttempted") is not True:
        fail("Project QA semantic pool probe expected retrievalPlan.semanticPoolAttempted=true")
    if int(retrieval_plan.get("semanticPoolLoadedCount") or 0) < 500:
        fail(
            "Project QA semantic pool probe expected semanticPoolLoadedCount>=500, "
            f"got {retrieval_plan.get('semanticPoolLoadedCount')}"
        )
    if retrieval_plan.get("semanticPoolTruncated") is not True:
        fail("Project QA semantic pool probe expected retrievalPlan.semanticPoolTruncated=true")
    semantic_pool_loaded_count = int(retrieval_plan.get("semanticPoolLoadedCount") or 0)
    semantic_pool_coverage_percent = int(retrieval_plan.get("semanticPoolCoveragePercent") or 0)
    expected_semantic_pool_coverage_percent = min(100, int((semantic_pool_loaded_count * 100.0 / embedded_chunks) + 0.5))
    if semantic_pool_coverage_percent != expected_semantic_pool_coverage_percent:
        fail(
            "Project QA semantic pool probe semanticPoolCoveragePercent must equal "
            f"round(semanticPoolLoadedCount / embeddedChunks * 100): "
            f"expected {expected_semantic_pool_coverage_percent}, got {retrieval_plan.get('semanticPoolCoveragePercent')}"
        )
    if retrieval_plan.get("semanticReadinessStatus") != "DEGRADED":
        fail(
            "Project QA semantic pool probe expected retrievalPlan.semanticReadinessStatus=DEGRADED, "
            f"got {retrieval_plan.get('semanticReadinessStatus')}"
        )
    if retrieval_plan.get("semanticReadinessReason") not in {"LOW_EMBEDDING_COVERAGE", "PARTIAL_EMBEDDING_COVERAGE", "SEMANTIC_POOL_TRUNCATED"}:
        fail(
            "Project QA semantic pool probe retrievalPlan.semanticReadinessReason must explain degraded semantic readiness, "
            f"got {retrieval_plan.get('semanticReadinessReason')}"
        )
    total_response_chunks = int(qa_payload.get("totalChunks") or 0)
    embedding_coverage = round((embedded_chunks * 100.0) / total_response_chunks, 2) if total_response_chunks > 0 else 0.0
    return semantic_probe_result(
        "OK",
        probeKind="NO_KEYWORD_SEMANTIC_POOL",
        matchedChunks=int(qa_payload.get("matchedChunks") or 0),
        retrievalMode=qa_payload.get("retrievalMode"),
        resultCount=int(qa_payload.get("resultCount") or 0),
        groundingStatus=qa_payload.get("groundingStatus"),
        citationEnforcementStatus=qa_payload.get("citationEnforcementStatus"),
        totalChunks=total_response_chunks,
        embeddedChunks=embedded_chunks,
        embeddingCoverage=embedding_coverage,
        retrievalPlan={
            "semanticPoolAttempted": retrieval_plan.get("semanticPoolAttempted"),
            "semanticPoolStrategy": retrieval_plan.get("semanticPoolStrategy"),
            "semanticPoolLoadedCount": retrieval_plan.get("semanticPoolLoadedCount"),
            "semanticPoolLimit": retrieval_plan.get("semanticPoolLimit"),
            "semanticPoolTruncated": retrieval_plan.get("semanticPoolTruncated"),
            "semanticPoolCoveragePercent": retrieval_plan.get("semanticPoolCoveragePercent"),
            "semanticPlanReason": retrieval_plan.get("semanticPlanReason"),
            "semanticReadinessStatus": retrieval_plan.get("semanticReadinessStatus"),
            "semanticReadinessReason": retrieval_plan.get("semanticReadinessReason"),
        },
        targetOffset=target_offset,
        targetRank=501,
        defaultPoolSize=500,
        poolCapEngaged=True,
        thresholdRecommendation="NEEDS_WEAK_KEYWORD_SAMPLE",
        capRecommendation="DISTRIBUTED_WINDOWS",
        retrievedPrimary={
            "chunkId": primary.get("id"),
            "filePath": primary.get("filePath"),
            "startLine": primary.get("startLine"),
            "endLine": primary.get("endLine"),
            "hasEmbedding": primary.get("hasEmbedding"),
            "matchedTerms": primary.get("matchedTerms") or [],
            "relevanceScore": primary.get("relevanceScore"),
            "contextRole": primary.get("contextRole"),
            "embeddedEvidenceCount": evidence_profile.get("embeddedEvidenceCount"),
        },
        targetRetrieved={
            "chunkId": target_chunk.get("id"),
            "filePath": target_chunk.get("filePath"),
            "startLine": target_chunk.get("startLine"),
            "endLine": target_chunk.get("endLine"),
            "hasEmbedding": target_chunk.get("hasEmbedding"),
            "contextRole": target_chunk.get("contextRole"),
        },
        rawRetrievedChunkContentAbsent=raw_chunk_content_boundary["rawRetrievedChunkContentAbsent"],
        contentPreviewMaxLength=raw_chunk_content_boundary["contentPreviewMaxLength"],
    )


def run_public_repo_ui_smoke(project_id, repository_id, scan_task_id, token, chunk_search):
    if not RUN_UI_SMOKE:
        return {"status": "SKIPPED"}
    if shutil.which("node") is None or shutil.which("npm") is None:
        fail("node and npm are required when SOURCELENS_PUBLIC_REPO_SMOKE_UI=true")

    expected_file = "ChatController.java"
    for probe in chunk_search.get("roleProbes") or []:
        if probe.get("role") in {"naturalEndpointCn", "naturalEndpointEn"} and probe.get("matchedFile"):
            expected_file = os.path.basename(str(probe["matchedFile"]))
            break

    env = os.environ.copy()
    env.update({
        "SL_PUBLIC_REPO_API_BASE_URL": BASE_URL,
        "SL_PUBLIC_REPO_UI_PROJECT_ID": str(int(project_id)),
        "SL_PUBLIC_REPO_UI_REPOSITORY_ID": str(int(repository_id)),
        "SL_PUBLIC_REPO_UI_SCAN_TASK_ID": str(int(scan_task_id)),
        "SL_PUBLIC_REPO_UI_TOKEN": token,
        "SL_PUBLIC_REPO_UI_EXPECTED_FILE": expected_file,
        "SL_PUBLIC_REPO_UI_EXPECT_DERIVED_GOVERNANCE": "true",
        "VITE_API_PROXY_TIMEOUT_MS": "300000",
    })

    print_step("[ui] validate public repo live pages")
    proc = subprocess.run(
        ["make", "public-repo-ui-smoke"],
        cwd=REPO_ROOT,
        env=env,
        text=True,
        capture_output=True,
        timeout=360,
    )
    if proc.stdout.strip():
        print(proc.stdout.strip(), flush=True)
    if proc.returncode != 0:
        message = (proc.stderr or proc.stdout).strip()
        fail(f"public repo UI smoke failed: {message}")
    if "PUBLIC_REPO_UI_SMOKE_OK " not in proc.stdout:
        fail("public repo UI smoke did not emit PUBLIC_REPO_UI_SMOKE_OK marker")
    return {
        "status": "OK",
        "expectedEvidenceFile": expected_file,
        "marker": "PUBLIC_REPO_UI_SMOKE_OK",
    }


def seed_scan_governance_smoke(project_id, repository_id, scan_task_id, token):
    if not RUN_UI_SMOKE:
        return {"status": "SKIPPED"}

    print_step("[ui] seed derived governance evidence")
    payload = request(
        "POST",
        f"/dev/projects/{project_id}/scan-governance-smoke-seed",
        {"repositoryId": int(repository_id), "scanTaskId": int(scan_task_id)},
        token,
    )["data"]
    required = {
        "autoRepairId": int,
        "agentTaskId": int,
        "patchArtifactId": int,
        "agentReportArtifactId": int,
    }
    for key, value_type in required.items():
        value = payload.get(key)
        if not isinstance(value, value_type) or value <= 0:
            fail(f"scan governance smoke seed missing valid {key}: {payload}")
    if payload.get("autoRepairAuditAction") != "AUTO_REPAIR_PATCH_READY":
        fail(f"scan governance smoke seed returned unexpected autoRepairAuditAction: {payload}")
    if payload.get("agentTaskAuditAction") != "AGENT_TASK_SMOKE_READY":
        fail(f"scan governance smoke seed returned unexpected agentTaskAuditAction: {payload}")
    if payload.get("patchArtifactType") != "CHANGE_PATCH":
        fail(f"scan governance smoke seed returned unexpected patchArtifactType: {payload}")
    if payload.get("agentReportArtifactType") != "AGENT_REPORT":
        fail(f"scan governance smoke seed returned unexpected agentReportArtifactType: {payload}")
    return {"status": "OK", **payload}


def print_step(label):
    print(label, flush=True)


def run_probe(label, func, *args):
    print_step(f"      - {label}...")
    result = func(*args)
    print_step(f"        {label}: OK")
    return result


run_id = datetime.utcnow().strftime("%Y%m%d%H%M%S")
username = f"sl_smoke_{run_id}"
password = f"SourceLensSmoke{run_id}!"
email = f"{username}@local.test"
project_name = f"SourceLens public repo smoke {run_id}"
project_id = None
token = None
weak_keyword_llm_setup = {"status": "SKIPPED", "reason": "not_started"}
claim_noise_llm_setup = {"status": "SKIPPED", "reason": "not_started"}

print(f"Public repo smoke: base={BASE_URL} repo={REPO_URL} branch={BRANCH} timeout={TIMEOUT_SECONDS}s")
probe_health()

try:
    print_step("[1/8] register")
    request("POST", "/auth/register", {"username": username, "email": email, "password": password})

    print_step("[2/8] login")
    login = request("POST", "/auth/login", {"username": username, "password": password})
    token = login["data"]["token"]
    weak_keyword_llm_setup = maybe_configure_mock_llm_for_weak_keyword_eval(token)

    print_step("[3/8] create project")
    project = request(
        "POST",
        "/projects",
        {"name": project_name, "description": "API smoke for public repository analysis"},
        token,
    )["data"]
    project_id = project["id"]

    print_step("[4/8] add repository")
    repo = request(
        "POST",
        f"/projects/{project_id}/repositories",
        {"url": REPO_URL, "defaultBranch": BRANCH},
        token,
    )["data"]
    repo_id = repo["id"]

    print_step("[5/8] create scan task")
    task = request(
        "POST",
        f"/repositories/{repo_id}/scan-tasks",
        {"projectId": project_id, "branch": BRANCH},
        token,
    )["data"]
    scan_task_id = task["id"]

    terminal = {"SUCCESS", "FAILED", "CANCELLED"}
    last_status = None
    detail = None
    start = time.time()
    while time.time() - start < TIMEOUT_SECONDS:
        try:
            detail = request(
                "GET",
                f"/scan-tasks/{scan_task_id}",
                token=token,
                transient_statuses={503},
            )["data"]
        except TransientHttpStatus as exc:
            print(f"      status=POLL_RETRY http={exc.status}", flush=True)
            time.sleep(POLL_SECONDS)
            continue
        status = detail.get("status")
        if status != last_status:
            print(
                f"      status={status} commit={detail.get('commitSha')} "
                f"error={detail.get('errorMessage')}",
                flush=True,
            )
            last_status = status
        if status in terminal:
            break
        time.sleep(POLL_SECONDS)
    else:
        fail(f"scan task {scan_task_id} did not finish within {TIMEOUT_SECONDS}s", code=2)

    execution = request(
        "GET",
        f"/projects/{project_id}/execution-tasks/source/SCAN_TASK/{scan_task_id}",
        token=token,
    )["data"]
    if last_status != "SUCCESS":
        print(json.dumps({"scanTask": detail, "executionTask": execution}, ensure_ascii=False, indent=2))
        fail(f"scan task ended with status {last_status}", code=2)

    print_step("[6/8] validate scan artifacts")
    artifacts = request("GET", f"/scan-tasks/{scan_task_id}/artifacts", token=token)["data"]
    artifact_types = {item.get("artifactType") for item in artifacts}
    required_artifacts = {"ARCHITECTURE_REPORT", "CODE_METRICS", "DEPENDENCY_GRAPH", "RAW_SCAN_RESULT"}
    missing = sorted(required_artifacts - artifact_types)
    if missing:
        fail(f"missing required scan artifacts: {missing}")

    print_step("[7/8] validate artifact records")
    records = request(
        "GET",
        f"/projects/{project_id}/artifacts?ownerType=SCAN_TASK&ownerId={scan_task_id}",
        token=token,
    )["data"]
    if len(records) != len(artifacts):
        fail(f"artifact record count mismatch: records={len(records)} artifacts={len(artifacts)}")

    print_step("[8/8] validate execution, graph/chunks, QA and artifact quality")
    steps = execution.get("steps") or []
    step_status = {step.get("stepKey"): step.get("status") for step in steps}
    required_steps = ["prepare_repository", "analyze_code", "chunk_code", "finalize_scan"]
    bad_steps = {key: step_status.get(key) for key in required_steps if step_status.get(key) != "SUCCESS"}
    if bad_steps:
        fail(f"execution steps not successful: {bad_steps}")

    print_step("      - execution steps...")
    print_step("        execution steps: OK")

    print_step("      - dependency graph...")
    graph = request("GET", f"/scan-tasks/{scan_task_id}/graph", token=token)["data"]
    summary = graph.get("summary") or {}
    if int(summary.get("totalNodes") or 0) <= 0:
        fail("dependency graph has no nodes")
    print_step("        dependency graph: OK")

    raw_scan_contract = run_probe("raw scan contract", validate_raw_scan_contract, project_id, records, token)
    report_quality, architecture_report = run_probe("report quality", validate_report_quality, project_id, records, scan_task_id, token)
    chunk_search = run_probe("code chunk search", validate_code_chunk_search, project_id, scan_task_id, token)
    method_anchor = run_probe("method anchor retrieval", validate_method_anchor_retrieval, project_id, scan_task_id, token)
    weak_keyword_evaluation = run_probe(
        "project QA weak keyword evaluation",
        validate_project_qa_weak_keyword_evaluation,
        project_id,
        scan_task_id,
        token,
        weak_keyword_llm_setup,
    )
    print_step("      - weak keyword mock cleanup...")
    weak_keyword_evaluation["llmCleanup"] = maybe_remove_mock_llm_after_weak_keyword_eval(token, weak_keyword_llm_setup)
    print_step("        weak keyword mock cleanup: OK")
    code_qa = run_probe("code QA", validate_code_qa, project_id, scan_task_id, token)
    claim_noise_llm_setup = run_probe("claim noise mock setup", maybe_configure_mock_llm_for_claim_noise, token)
    try:
        code_qa["claimCitationNoiseBoundary"] = run_probe(
            "claim citation noise boundary",
            validate_claim_citation_noise_boundary,
            project_id,
            scan_task_id,
            token,
            claim_noise_llm_setup,
        )
    finally:
        print_step("      - claim noise mock cleanup...")
        claim_noise_cleanup = maybe_remove_mock_llm_after_claim_noise(token, claim_noise_llm_setup)
        print_step("        claim noise mock cleanup: OK")
        if isinstance(code_qa.get("claimCitationNoiseBoundary"), dict):
            code_qa["claimCitationNoiseBoundary"]["llmCleanup"] = claim_noise_cleanup
    semantic_probe = run_probe("semantic pool probe", validate_project_qa_semantic_pool_probe, project_id, scan_task_id, token)
    report_evidence_qa_citation_quality = run_probe(
        "report evidence QA citation",
        validate_report_evidence_qa_citation_quality,
        project_id,
        scan_task_id,
        token,
        architecture_report,
    )
    governance_seed = run_probe("scan governance smoke seed", seed_scan_governance_smoke, project_id, repo_id, scan_task_id, token)
    ui_smoke = run_probe("public repo UI smoke", run_public_repo_ui_smoke, project_id, repo_id, scan_task_id, token, chunk_search)
    db_counts = run_probe("DB counts", query_db_counts, scan_task_id, len(artifacts), len(records))
    artifact_quality = run_probe("artifact quality", validate_artifact_quality, scan_task_id)
    result = {
        "projectId": project_id,
        "repositoryId": repo_id,
        "scanTaskId": scan_task_id,
        "commitSha": detail.get("commitSha"),
        "artifacts": len(artifacts),
        "artifactRecords": len(records),
        "graphNodes": summary.get("totalNodes"),
        "graphEdges": summary.get("totalEdges"),
        "rawScanContract": raw_scan_contract,
        "reportQuality": report_quality,
        "chunkSearch": chunk_search,
        "methodAnchorRetrieval": method_anchor,
        "codeUnderstandingFixture": method_anchor.get("codeUnderstandingFixture") if isinstance(method_anchor, dict) else None,
        "codeQa": code_qa,
        "projectQaWeakKeywordEvaluation": weak_keyword_evaluation,
        "semanticWeakKeywordProbe": semantic_probe,
        "governanceSeed": governance_seed,
        "publicRepoUiSmoke": ui_smoke,
        "artifactQuality": artifact_quality,
        "dbCounts": db_counts,
    }
    if report_evidence_qa_citation_quality is not None:
        result["reportEvidenceQaCitationQuality"] = report_evidence_qa_citation_quality
    print("PUBLIC_REPO_SMOKE_OK " + json.dumps(result, ensure_ascii=False, sort_keys=True))
finally:
    if CLEANUP and project_id and token:
        try:
            request("DELETE", f"/projects/{project_id}", token=token)
            print(f"Cleanup OK: deleted project {project_id}")
        except SystemExit:
            raise
        except Exception as exc:
            print(f"Cleanup WARN: failed to delete project {project_id}: {exc}", file=sys.stderr)
PY
