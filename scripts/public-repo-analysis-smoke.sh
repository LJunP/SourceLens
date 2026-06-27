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
export SOURCELENS_MYSQL_CONTAINER="${SOURCELENS_MYSQL_CONTAINER:-sourcelens-mysql}"
export SOURCELENS_ARTIFACT_QUALITY_BACKEND_CONTAINER="${SOURCELENS_ARTIFACT_QUALITY_BACKEND_CONTAINER:-sourcelens-backend}"
export SOURCELENS_REPO_ROOT="$ROOT_DIR"

python3 - <<'PY'
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime


def fail(message, code=1):
    print(f"PUBLIC_REPO_SMOKE_FAIL: {message}", file=sys.stderr)
    raise SystemExit(code)


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
MYSQL_CONTAINER = os.environ.get("SOURCELENS_MYSQL_CONTAINER", "sourcelens-mysql").strip()
BACKEND_CONTAINER = os.environ.get("SOURCELENS_ARTIFACT_QUALITY_BACKEND_CONTAINER", "sourcelens-backend").strip()
REPO_ROOT = os.environ.get("SOURCELENS_REPO_ROOT", os.getcwd()).strip() or os.getcwd()

if DB_COUNTS_MODE not in {"auto", "true", "false"}:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS must be auto, true, or false")
if ARTIFACT_QUALITY_MODE not in {"auto", "true", "false"}:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY must be auto, true, or false")
if not REPO_URL:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL must not be empty")
if not BRANCH:
    fail("SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH must not be empty")


def request(method, path, data=None, token=None, base=API_BASE, timeout=60):
    body = None
    headers = {"Accept": "application/json"}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(base + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            text = resp.read().decode("utf-8")
            payload = json.loads(text) if text else None
            if isinstance(payload, dict) and payload.get("code") not in (None, "SUCCESS"):
                fail(f"{method} {path} returned {payload.get('code')}: {payload.get('message')}")
            return payload
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        fail(f"{method} {path} HTTP {exc.code}: {text}")
    except urllib.error.URLError as exc:
        fail(f"{method} {path} failed: {exc}")


def request_text(method, path, token=None, base=API_BASE, timeout=60):
    headers = {"Accept": "application/json, text/plain, */*"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(base + path, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        fail(f"{method} {path} HTTP {exc.code}: {text}")
    except urllib.error.URLError as exc:
        fail(f"{method} {path} failed: {exc}")


def api_query(path, params):
    encoded = urllib.parse.urlencode(params)
    return path + ("?" + encoded if encoded else "")


def probe_health():
    try:
        with urllib.request.urlopen(BASE_URL + "/actuator/health", timeout=10) as resp:
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
    proc = subprocess.run(
        [
            "docker", "exec", "-e", f"SQL={sql}", MYSQL_CONTAINER,
            "sh", "-lc",
            'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" "$MYSQL_DATABASE" -N -e "$SQL"',
        ],
        text=True,
        capture_output=True,
        timeout=45,
    )
    if proc.returncode != 0:
        fail(f"DB count query failed: {proc.stderr.strip() or proc.stdout.strip()}")

    counts = {}
    for line in proc.stdout.splitlines():
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
        f"/projects/{project_id}/artifacts/{report_record['id']}/download",
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
    return {
        "readiness": readiness,
        "confidence": confidence,
        "gaps": len(gaps),
        "nextActions": len(next_actions),
        "evidenceChecks": len(evidence_checks),
    }


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
    search = request(
        "GET",
        api_query(
            f"/projects/{project_id}/code-chunks/search",
            {"scanTaskId": scan_task_id, "query": "", "limit": 5},
        ),
        token=token,
    )["data"]
    total_chunks = int(search.get("totalChunks") or 0)
    result_count = int(search.get("resultCount") or 0)
    if total_chunks <= 0:
        fail("code_chunks API reports totalChunks=0 after successful scan")
    if result_count <= 0:
        fail("code_chunks API returned no searchable items after successful scan")
    items = search.get("items")
    if not isinstance(items, list) or not items:
        fail("code_chunks API items are empty or malformed")
    first = items[0]
    if not isinstance(first, dict):
        fail("code_chunks API first item is not an object")
    required_fields = ["filePath", "startLine", "endLine", "contentPreview", "evidenceType", "evidenceReason"]
    missing_fields = [field for field in required_fields if first.get(field) in (None, "")]
    if missing_fields:
        fail(f"code_chunks API first item missing fields: {missing_fields}")
    if int(first.get("endLine") or 0) < int(first.get("startLine") or 0):
        fail("code_chunks API first item has invalid line range")
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
    return {
        "totalChunks": total_chunks,
        "resultCount": result_count,
        "firstFile": first.get("filePath"),
        "firstEvidenceType": first.get("evidenceType"),
        "evidenceReadiness": readiness,
        "evidenceConfidence": confidence,
    }


def validate_code_qa(project_id, scan_task_id, token):
    payload = request(
        "POST",
        f"/projects/{project_id}/qa",
        {"question": "Controller Service Repository 业务流程"},
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
    return {
        "retrievalMode": payload.get("retrievalMode"),
        "resultCount": result_count,
        "readiness": readiness,
        "confidence": confidence,
        "uniqueFiles": profile.get("uniqueFiles"),
    }


def print_step(label):
    print(label, flush=True)


run_id = datetime.utcnow().strftime("%Y%m%d%H%M%S")
username = f"sl_smoke_{run_id}"
password = f"SourceLensSmoke{run_id}!"
email = f"{username}@local.test"
project_name = f"SourceLens public repo smoke {run_id}"
project_id = None
token = None

print(f"Public repo smoke: base={BASE_URL} repo={REPO_URL} branch={BRANCH} timeout={TIMEOUT_SECONDS}s")
probe_health()

try:
    print_step("[1/8] register")
    request("POST", "/auth/register", {"username": username, "email": email, "password": password})

    print_step("[2/8] login")
    login = request("POST", "/auth/login", {"username": username, "password": password})
    token = login["data"]["token"]

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
        detail = request("GET", f"/scan-tasks/{scan_task_id}", token=token)["data"]
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

    graph = request("GET", f"/scan-tasks/{scan_task_id}/graph", token=token)["data"]
    summary = graph.get("summary") or {}
    if int(summary.get("totalNodes") or 0) <= 0:
        fail("dependency graph has no nodes")

    report_quality = validate_report_quality(project_id, records, scan_task_id, token)
    chunk_search = validate_code_chunk_search(project_id, scan_task_id, token)
    code_qa = validate_code_qa(project_id, scan_task_id, token)
    db_counts = query_db_counts(scan_task_id, len(artifacts), len(records))
    artifact_quality = validate_artifact_quality(scan_task_id)
    result = {
        "projectId": project_id,
        "repositoryId": repo_id,
        "scanTaskId": scan_task_id,
        "commitSha": detail.get("commitSha"),
        "artifacts": len(artifacts),
        "artifactRecords": len(records),
        "graphNodes": summary.get("totalNodes"),
        "graphEdges": summary.get("totalEdges"),
        "reportQuality": report_quality,
        "chunkSearch": chunk_search,
        "codeQa": code_qa,
        "artifactQuality": artifact_quality,
        "dbCounts": db_counts,
    }
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
