#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export SOURCELENS_BASE_URL="${SOURCELENS_BASE_URL:-http://localhost:8080}"
export SOURCELENS_FILE_BOUND_REPAIR_SMOKE_TIMEOUT_SECONDS="${SOURCELENS_FILE_BOUND_REPAIR_SMOKE_TIMEOUT_SECONDS:-240}"
export SOURCELENS_FILE_BOUND_REPAIR_SMOKE_POLL_SECONDS="${SOURCELENS_FILE_BOUND_REPAIR_SMOKE_POLL_SECONDS:-2}"
export SOURCELENS_FILE_BOUND_REPAIR_SMOKE_CLEANUP="${SOURCELENS_FILE_BOUND_REPAIR_SMOKE_CLEANUP:-true}"
export SOURCELENS_FILE_BOUND_REPAIR_SMOKE_REPO_DIR="${SOURCELENS_FILE_BOUND_REPAIR_SMOKE_REPO_DIR:-}"

python3 - <<'PY'
import json
import os
import http.client
import shutil
import subprocess
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
    print(f"FILE_BOUND_REPAIR_SMOKE_FAIL: {message}", file=sys.stderr)
    raise SystemExit(code)


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
TIMEOUT_SECONDS = parse_positive_int("SOURCELENS_FILE_BOUND_REPAIR_SMOKE_TIMEOUT_SECONDS", "240")
POLL_SECONDS = parse_positive_int("SOURCELENS_FILE_BOUND_REPAIR_SMOKE_POLL_SECONDS", "2")
CLEANUP = os.environ.get("SOURCELENS_FILE_BOUND_REPAIR_SMOKE_CLEANUP", "true").strip().lower() == "true"
REPO_DIR_OVERRIDE = os.environ.get("SOURCELENS_FILE_BOUND_REPAIR_SMOKE_REPO_DIR", "").strip()
TARGET_FILE = "src/main/java/demo/LargeController.java"


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
        with urlopen_with_retries(req, timeout=timeout) as resp:
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
        with urlopen_with_retries(req, timeout=timeout) as resp:
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
        fail("git is required to create the local file-bound smoke repository")
    repo_dir = Path(REPO_DIR_OVERRIDE or f"/tmp/sourcelens-file-bound-repair-smoke-{run_id}")
    if repo_dir.exists():
        shutil.rmtree(repo_dir)
    source_dir = repo_dir / "src/main/java/demo"
    source_dir.mkdir(parents=True, exist_ok=True)
    lines = [
        "package demo;",
        "",
        "public class LargeController {",
        "    public String index() {",
        "        return \"ok\";",
        "    }",
    ]
    lines.extend(f"    public String endpoint{i}() {{ return \"endpoint-{i}\"; }}" for i in range(1, 521))
    lines.append("}")
    (source_dir / "LargeController.java").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (repo_dir / "README.md").write_text("# SourceLens file-bound repair smoke\n", encoding="utf-8")
    run_git(["init", "-b", "main"], repo_dir)
    run_git(["config", "user.email", "sourcelens-smoke@local.test"], repo_dir)
    run_git(["config", "user.name", "SourceLens Smoke"], repo_dir)
    run_git(["add", "."], repo_dir)
    run_git(["commit", "-m", "file-bound repair smoke fixture"], repo_dir)
    return repo_dir


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
    text = request_text(
        "GET",
        f"/projects/{project_id}/artifacts/{artifact_record['id']}/download?rawDownloadAcknowledged=true",
        token=token,
    )
    try:
        return json.loads(text or "{}")
    except json.JSONDecodeError as exc:
        fail(f"ARCHITECTURE_REPORT download is not valid JSON: {exc}")


def find_file_bound_risk(report):
    risks = (((report.get("codeQuality") or {}).get("risks")) or [])
    if not isinstance(risks, list):
        fail("ARCHITECTURE_REPORT.codeQuality.risks is not an array")
    for risk in risks:
        if not isinstance(risk, dict):
            continue
        if risk.get("category") == "MAINTAINABILITY" and risk.get("filePath") == TARGET_FILE:
            return risk
    fail(f"MAINTAINABILITY risk with filePath={TARGET_FILE} is missing")


def validate_code_chunks(project_id, scan_task_id, token):
    payload = request(
        "GET",
        api_query(
            f"/projects/{project_id}/code-chunks/search",
            {"scanTaskId": scan_task_id, "query": "LargeController", "limit": 5},
        ),
        token=token,
    )["data"]
    total_chunks = int(payload.get("totalChunks") or 0)
    result_count = int(payload.get("resultCount") or 0)
    items = payload.get("items") or []
    if total_chunks <= 0:
        fail("code_chunks search reports totalChunks=0")
    if result_count <= 0 or not items:
        fail("code_chunks search did not return the fixture file")
    if not any(item.get("filePath") == TARGET_FILE for item in items if isinstance(item, dict)):
        fail(f"code_chunks search did not include {TARGET_FILE}")
    return {
        "totalChunks": total_chunks,
        "resultCount": result_count,
        "firstFile": items[0].get("filePath"),
    }


def build_candidate_url(project_id, repository_id, scan_task_id, risk):
    target_desc = (
        f"来自扫描报告 #{scan_task_id} 的风险项，请生成最小、可审查的单文件修复 patch。"
        f"风险：{risk.get('message') or '存在文件级风险'}。影响：{risk.get('impact') or '未提供'}。"
    )
    query = urllib.parse.urlencode({
        "projectId": project_id,
        "repositoryId": repository_id,
        "openCreate": "1",
        "scanTaskId": scan_task_id,
        "source": f"扫描报告 #{scan_task_id}",
        "filePath": TARGET_FILE,
        "targetDesc": target_desc,
    })
    return f"/auto-repairs?{query}"


def print_step(label):
    print(label, flush=True)


run_id = datetime.utcnow().strftime("%Y%m%d%H%M%S")
username = f"sl_filebound_smoke_{run_id}"
password = f"SourceLensFileBoundSmoke{run_id}!"
email = f"{username}@local.test"
project_name = f"SourceLens file-bound repair smoke {run_id}"
project_id = None
repo_dir = None
token = None

print(f"File-bound repair smoke: base={BASE_URL} timeout={TIMEOUT_SECONDS}s cleanup={CLEANUP}")
probe_health()

try:
    print_step("[1/8] create local fixture repo")
    repo_dir = create_fixture_repo(run_id)
    repo_url = repo_dir.as_uri()

    print_step("[2/8] register and login")
    request("POST", "/auth/register", {"username": username, "email": email, "password": password})
    login = request("POST", "/auth/login", {"username": username, "password": password})
    token = login["data"]["token"]

    print_step("[3/8] create project")
    project = request(
        "POST",
        "/projects",
        {"name": project_name, "description": "Smoke test for file-bound repair candidate evidence"},
        token,
    )["data"]
    project_id = project["id"]

    print_step("[4/8] add local repository")
    repo = request(
        "POST",
        f"/projects/{project_id}/repositories",
        {"url": repo_url, "defaultBranch": "main"},
        token,
    )["data"]
    repository_id = repo["id"]

    print_step("[5/8] create scan task")
    task = request(
        "POST",
        f"/repositories/{repository_id}/scan-tasks",
        {"projectId": project_id, "branch": "main"},
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
            print(f"      status={status} commit={detail.get('commitSha')} error={detail.get('errorMessage')}", flush=True)
            last_status = status
        if status in terminal:
            break
        time.sleep(POLL_SECONDS)
    else:
        fail(f"scan task {scan_task_id} did not finish within {TIMEOUT_SECONDS}s", code=2)
    if last_status != "SUCCESS":
        print(json.dumps({"scanTask": detail}, ensure_ascii=False, indent=2))
        fail(f"scan task ended with status {last_status}", code=2)

    print_step("[6/8] validate artifacts and file-bound risk")
    artifacts = request("GET", f"/scan-tasks/{scan_task_id}/artifacts", token=token)["data"]
    artifact_types = {item.get("artifactType") for item in artifacts}
    required_artifacts = {"ARCHITECTURE_REPORT", "CODE_METRICS", "DEPENDENCY_GRAPH", "RAW_SCAN_RESULT"}
    missing = sorted(required_artifacts - artifact_types)
    if missing:
        fail(f"missing required scan artifacts: {missing}")
    report_record, records = find_architecture_report_record(project_id, scan_task_id, token)
    report = load_architecture_report(project_id, report_record, token)
    risk = find_file_bound_risk(report)

    print_step("[7/8] validate code_chunks search")
    chunk_search = validate_code_chunks(project_id, scan_task_id, token)

    print_step("[8/8] build repair candidate URL contract")
    candidate_url = build_candidate_url(project_id, repository_id, scan_task_id, risk)
    if f"scanTaskId={scan_task_id}" not in candidate_url:
        fail("candidate URL does not include scanTaskId")
    if urllib.parse.quote(TARGET_FILE, safe="") not in candidate_url:
        fail("candidate URL does not include encoded filePath")

    result = {
        "projectId": project_id,
        "repositoryId": repository_id,
        "scanTaskId": scan_task_id,
        "commitSha": detail.get("commitSha"),
        "repoUrl": repo_url,
        "targetFile": TARGET_FILE,
        "risk": {
            "category": risk.get("category"),
            "severity": risk.get("severity"),
            "filePath": risk.get("filePath"),
        },
        "artifacts": len(artifacts),
        "artifactRecords": len(records),
        "chunkSearch": chunk_search,
        "candidateUrl": candidate_url,
    }
    print("FILE_BOUND_REPAIR_SMOKE_OK " + json.dumps(result, ensure_ascii=False, sort_keys=True))
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
