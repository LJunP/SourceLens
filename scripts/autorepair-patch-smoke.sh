#!/usr/bin/env bash
set -euo pipefail

export SOURCELENS_BASE_URL="${SOURCELENS_BASE_URL:-http://localhost:8080}"
export SOURCELENS_AUTOREPAIR_PATCH_SMOKE_TIMEOUT_SECONDS="${SOURCELENS_AUTOREPAIR_PATCH_SMOKE_TIMEOUT_SECONDS:-300}"
export SOURCELENS_AUTOREPAIR_PATCH_SMOKE_POLL_SECONDS="${SOURCELENS_AUTOREPAIR_PATCH_SMOKE_POLL_SECONDS:-2}"
export SOURCELENS_AUTOREPAIR_PATCH_SMOKE_CLEANUP="${SOURCELENS_AUTOREPAIR_PATCH_SMOKE_CLEANUP:-true}"
export SOURCELENS_AUTOREPAIR_PATCH_SMOKE_REPO_DIR="${SOURCELENS_AUTOREPAIR_PATCH_SMOKE_REPO_DIR:-}"

python3 - <<'PY'
import json
import os
import shutil
import subprocess
import http.client
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

http.client.HTTPConnection._http_vsn = 10
http.client.HTTPConnection._http_vsn_str = "HTTP/1.0"


def fail(message, code=1):
    print(f"AUTOREPAIR_PATCH_SMOKE_FAIL: {message}", file=sys.stderr)
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


def parse_positive_int(name, default):
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
    if any(char.isspace() for char in value):
        fail("SOURCELENS_BASE_URL must not contain whitespace")
    return value


BASE_URL = normalize_base_url(os.environ.get("SOURCELENS_BASE_URL", "http://localhost:8080"))
API_BASE = BASE_URL + "/api"
TIMEOUT_SECONDS = parse_positive_int("SOURCELENS_AUTOREPAIR_PATCH_SMOKE_TIMEOUT_SECONDS", "300")
POLL_SECONDS = parse_positive_int("SOURCELENS_AUTOREPAIR_PATCH_SMOKE_POLL_SECONDS", "2")
CLEANUP = os.environ.get("SOURCELENS_AUTOREPAIR_PATCH_SMOKE_CLEANUP", "true").strip().lower() == "true"
REPO_DIR_OVERRIDE = os.environ.get("SOURCELENS_AUTOREPAIR_PATCH_SMOKE_REPO_DIR", "").strip()
TARGET_FILE = "src/main/java/demo/LargeController.java"


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


def run_git(args, cwd):
    proc = subprocess.run(["git", *args], cwd=cwd, text=True, capture_output=True, timeout=30)
    if proc.returncode != 0:
        fail(f"git {' '.join(args)} failed: {proc.stderr.strip() or proc.stdout.strip()}")
    return proc.stdout.strip()


def create_fixture_repo(run_id):
    if shutil.which("git") is None:
        fail("git is required to create the local AutoRepair patch smoke repository")
    repo_dir = Path(REPO_DIR_OVERRIDE or f"/tmp/sourcelens-autorepair-patch-smoke-{run_id}")
    if repo_dir.exists():
        shutil.rmtree(repo_dir)
    source_dir = repo_dir / "src/main/java/demo"
    source_dir.mkdir(parents=True, exist_ok=True)
    lines = [
        "package demo;",
        "",
        "public class LargeController {",
        "    public String index() {",
        "        return \"before-auto-repair\";",
        "    }",
    ]
    lines.extend(f"    public String endpoint{i}() {{ return \"endpoint-{i}\"; }}" for i in range(1, 521))
    lines.append("}")
    (source_dir / "LargeController.java").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (repo_dir / "README.md").write_text("# SourceLens AutoRepair patch smoke\n", encoding="utf-8")
    run_git(["init", "-b", "main"], repo_dir)
    run_git(["config", "user.email", "sourcelens-smoke@local.test"], repo_dir)
    run_git(["config", "user.name", "SourceLens Smoke"], repo_dir)
    run_git(["add", "."], repo_dir)
    run_git(["commit", "-m", "autorepair patch smoke fixture"], repo_dir)
    return repo_dir


def configure_mock_llm(token, run_id):
    config = request(
        "POST",
        "/llm-configs",
        {
            "provider": "MOCK",
            "modelName": "mock-autorepair-patch-smoke",
            "apiKey": f"sourcelens-mock-key-{run_id}",
            "baseUrl": "mock://local",
            "temperature": 0,
            "maxTokens": 4096,
        },
        token=token,
    )["data"]
    request("POST", f"/llm-configs/{config['id']}/activate", token=token)
    return config


def find_architecture_report_record(project_id, scan_task_id, token):
    records = request(
        "GET",
        f"/projects/{project_id}/artifacts?ownerType=SCAN_TASK&ownerId={scan_task_id}",
        token=token,
    )["data"]
    for record in records:
        if record.get("artifactType") == "ARCHITECTURE_REPORT":
            return record, records
    fail("ARCHITECTURE_REPORT artifact record is missing")


def load_architecture_report(project_id, artifact_record, token):
    text = request_text("GET", f"/projects/{project_id}/artifacts/{artifact_record['id']}/download?rawDownloadAcknowledged=true", token=token)
    try:
        return json.loads(text or "{}")
    except json.JSONDecodeError as exc:
        fail(f"ARCHITECTURE_REPORT download is not valid JSON: {exc}")


def find_file_bound_risk(report):
    risks = (((report.get("codeQuality") or {}).get("risks")) or [])
    if not isinstance(risks, list):
        fail("ARCHITECTURE_REPORT.codeQuality.risks is not an array")
    for risk in risks:
        if isinstance(risk, dict) and risk.get("category") == "MAINTAINABILITY" and risk.get("filePath") == TARGET_FILE:
            return risk
    fail(f"MAINTAINABILITY risk with filePath={TARGET_FILE} is missing")


def wait_for_scan(project_id, repository_id, token):
    task = request("POST", f"/repositories/{repository_id}/scan-tasks", {"projectId": project_id, "branch": "main"}, token)["data"]
    scan_task_id = task["id"]
    terminal = {"SUCCESS", "FAILED", "CANCELLED"}
    start = time.time()
    last_status = None
    detail = None
    while time.time() - start < TIMEOUT_SECONDS:
        detail = request_with_transient_status_retries(
            "GET",
            f"/scan-tasks/{scan_task_id}",
            token=token,
        )["data"]
        status = detail.get("status")
        if status != last_status:
            print(f"      scan status={status} commit={detail.get('commitSha')} error={detail.get('errorMessage')}", flush=True)
            last_status = status
        if status in terminal:
            break
        time.sleep(POLL_SECONDS)
    else:
        fail(f"scan task {scan_task_id} did not finish within {TIMEOUT_SECONDS}s", code=2)
    if last_status != "SUCCESS":
        print(json.dumps({"scanTask": detail}, ensure_ascii=False, indent=2))
        fail(f"scan task ended with status {last_status}", code=2)
    return scan_task_id, detail


def wait_for_repair(project_id, repair_id, token):
    terminal = {"PATCH_READY", "FAILED", "CANCELLED"}
    start = time.time()
    last_status = None
    detail = None
    while time.time() - start < TIMEOUT_SECONDS:
        detail = request_with_transient_status_retries(
            "GET",
            f"/projects/{project_id}/auto-repairs/{repair_id}",
            token=token,
        )["data"]
        status = detail.get("status")
        if status != last_status:
            print(f"      repair status={status} error={detail.get('errorMessage')}", flush=True)
            last_status = status
        if status in terminal:
            break
        time.sleep(POLL_SECONDS)
    else:
        fail(f"auto repair {repair_id} did not finish within {TIMEOUT_SECONDS}s", code=2)
    if last_status != "PATCH_READY":
        print(json.dumps({"autoRepair": detail}, ensure_ascii=False, indent=2))
        fail(f"auto repair ended with status {last_status}", code=2)
    return detail


def validate_patch_artifact(project_id, repair_id, repair, token):
    if not repair.get("patchArtifactPath"):
        fail("PATCH_READY repair does not expose patchArtifactPath")
    if not (repair.get("diffContent") or "").strip():
        fail("PATCH_READY repair does not expose diffContent")
    records = request(
        "GET",
        f"/projects/{project_id}/artifacts?ownerType=AUTO_REPAIR&ownerId={repair_id}",
        token=token,
    )["data"]
    patch_records = [record for record in records if record.get("artifactType") == "CHANGE_PATCH"]
    if len(patch_records) != 1:
        fail(f"expected exactly one CHANGE_PATCH artifact, got {len(patch_records)}")
    patch_text = request_text("GET", f"/projects/{project_id}/artifacts/{patch_records[0]['id']}/download?rawDownloadAcknowledged=true", token=token)
    if TARGET_FILE not in patch_text:
        fail("patch artifact does not mention the target file")
    if "Mock LLM response" not in patch_text:
        fail("patch artifact does not include the MOCK LLM generated content marker")
    return patch_records[0], len(records)


def validate_execution_task(project_id, repair_id, token):
    detail = request("GET", f"/projects/{project_id}/execution-tasks/source/AUTO_REPAIR/{repair_id}", token=token)["data"]
    task = detail.get("task") or {}
    if task.get("status") != "SUCCESS":
        fail(f"AUTO_REPAIR execution task status is not SUCCESS: {task.get('status')}")
    if task.get("progress") != 100:
        fail(f"AUTO_REPAIR execution task progress is not 100: {task.get('progress')}")
    steps = detail.get("steps") or []
    step_status = {step.get("stepKey"): step.get("status") for step in steps if isinstance(step, dict)}
    for required in ("prepare_workspace", "generate_patch"):
        if step_status.get(required) != "SUCCESS":
            fail(f"execution step {required} is not SUCCESS: {step_status.get(required)}")
    logs = detail.get("logs") or []
    if not logs:
        fail("AUTO_REPAIR execution task has no append-only logs")
    return {
        "taskId": task.get("id"),
        "status": task.get("status"),
        "steps": step_status,
        "logCount": len(logs),
    }


def parse_audit_input(entry):
    raw = entry.get("inputJson") or "{}"
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        fail("AUTO_REPAIR_PATCH_READY audit input is not valid JSON")
    if not isinstance(parsed, dict):
        fail("AUTO_REPAIR_PATCH_READY audit input is not a JSON object")
    return parsed


def validate_audit(project_id, repair_id, scan_task_id, repair, token):
    payload = request(
        "GET",
        api_query(
            f"/projects/{project_id}/audit-logs",
            {
                "resourceType": "AUTO_REPAIR",
                "action": "AUTO_REPAIR_PATCH_READY",
                "status": "SUCCESS",
                "pageSize": 20,
            },
        ),
        token=token,
    )["data"]
    items = payload.get("items") or []
    matches = [item for item in items if item.get("resourceId") == repair_id]
    if not matches:
        fail("AUTO_REPAIR_PATCH_READY audit log is missing")
    entry = matches[0]
    if TARGET_FILE not in (entry.get("inputJson") or ""):
        fail("AUTO_REPAIR_PATCH_READY audit input does not include target file")
    audit_input = parse_audit_input(entry)
    if audit_input.get("scanTaskId") != scan_task_id:
        fail(f"AUTO_REPAIR_PATCH_READY audit input scanTaskId mismatch: {audit_input.get('scanTaskId')}")
    if audit_input.get("patchArtifactPath") != repair.get("patchArtifactPath"):
        fail("AUTO_REPAIR_PATCH_READY audit input patchArtifactPath does not match repair patchArtifactPath")
    return {
        "auditLogId": entry.get("id"),
        "action": entry.get("action"),
        "status": entry.get("status"),
        "scanTaskId": audit_input.get("scanTaskId"),
    }


def print_step(label):
    print(label, flush=True)


run_id = datetime.utcnow().strftime("%Y%m%d%H%M%S")
username = f"sl_autorepair_patch_{run_id}"
password = f"SourceLensAutoRepairPatch{run_id}!"
email = f"{username}@local.test"
project_name = f"SourceLens AutoRepair patch smoke {run_id}"
project_id = None
repo_dir = None
token = None

print(f"AutoRepair patch smoke: base={BASE_URL} timeout={TIMEOUT_SECONDS}s cleanup={CLEANUP}")
probe_health()

try:
    print_step("[1/10] create local fixture repo")
    repo_dir = create_fixture_repo(run_id)
    repo_url = repo_dir.as_uri()

    print_step("[2/10] register, login and configure MOCK LLM")
    request("POST", "/auth/register", {"username": username, "email": email, "password": password})
    login = request("POST", "/auth/login", {"username": username, "password": password})
    token = login["data"]["token"]
    llm_config = configure_mock_llm(token, run_id)

    print_step("[3/10] create project")
    project = request(
        "POST",
        "/projects",
        {"name": project_name, "description": "Smoke test for AutoRepair patch readiness"},
        token,
    )["data"]
    project_id = project["id"]

    print_step("[4/10] add local repository")
    repo = request(
        "POST",
        f"/projects/{project_id}/repositories",
        {"url": repo_url, "defaultBranch": "main"},
        token,
    )["data"]
    repository_id = repo["id"]

    print_step("[5/10] scan repository and validate file-bound risk")
    scan_task_id, scan_detail = wait_for_scan(project_id, repository_id, token)
    report_record, scan_artifact_records = find_architecture_report_record(project_id, scan_task_id, token)
    report = load_architecture_report(project_id, report_record, token)
    risk = find_file_bound_risk(report)

    print_step("[6/10] create AutoRepair task from scan-bound risk")
    target_desc = (
        f"来自扫描报告 #{scan_task_id} 的文件级风险，请只生成单文件 patch。"
        f"目标文件：{TARGET_FILE}。风险：{risk.get('message') or 'LargeController 过大'}。"
    )
    created = request(
        "POST",
        f"/projects/{project_id}/auto-repairs",
        {
            "repositoryId": repository_id,
            "scanTaskId": scan_task_id,
            "filePath": TARGET_FILE,
            "targetDesc": target_desc,
        },
        token=token,
    )["data"]
    repair_id = created["id"]

    print_step("[7/10] wait for PATCH_READY")
    repair = wait_for_repair(project_id, repair_id, token)
    if repair.get("scanTaskId") != scan_task_id:
        fail("AutoRepair did not preserve source scanTaskId")
    if repair.get("filePath") != TARGET_FILE:
        fail("AutoRepair did not preserve normalized filePath")

    print_step("[8/10] validate patch artifact")
    patch_record, repair_artifact_count = validate_patch_artifact(project_id, repair_id, repair, token)

    print_step("[9/10] validate execution task")
    execution = validate_execution_task(project_id, repair_id, token)

    print_step("[10/10] validate audit log")
    audit = validate_audit(project_id, repair_id, scan_task_id, repair, token)

    result = {
        "projectId": project_id,
        "repositoryId": repository_id,
        "scanTaskId": scan_task_id,
        "autoRepairId": repair_id,
        "commitSha": scan_detail.get("commitSha"),
        "llmProvider": llm_config.get("provider"),
        "targetFile": TARGET_FILE,
        "risk": {
            "category": risk.get("category"),
            "severity": risk.get("severity"),
            "filePath": risk.get("filePath"),
        },
        "scanArtifactRecords": len(scan_artifact_records),
        "patchArtifactId": patch_record.get("id"),
        "repairArtifactRecords": repair_artifact_count,
        "execution": execution,
        "audit": audit,
    }
    print("AUTOREPAIR_PATCH_SMOKE_OK " + json.dumps(result, ensure_ascii=False, sort_keys=True))
    if not CLEANUP:
        retained = {
            "username": username,
            "password": password,
            "projectId": project_id,
            "repositoryId": repository_id,
            "scanTaskId": scan_task_id,
            "autoRepairId": repair_id,
        }
        print("AUTOREPAIR_PATCH_SMOKE_RETAINED " + json.dumps(retained, ensure_ascii=False, sort_keys=True))
finally:
    if CLEANUP and project_id and token:
        try:
            request("DELETE", f"/projects/{project_id}", token=token)
            print(f"Cleanup OK: deleted project {project_id}")
        except SystemExit:
            raise
        except Exception as exc:
            print(f"Cleanup WARN: failed to delete project {project_id}: {exc}", file=sys.stderr)
    if CLEANUP and repo_dir and repo_dir.exists() and not REPO_DIR_OVERRIDE:
        shutil.rmtree(repo_dir, ignore_errors=True)
        print(f"Cleanup OK: removed fixture repo {repo_dir}")
PY
