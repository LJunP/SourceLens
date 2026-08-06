#!/usr/bin/env bash
set -euo pipefail

export SOURCELENS_BASE_URL="${SOURCELENS_BASE_URL:-http://localhost:8080}"
export SOURCELENS_AUDIT_WORKBENCH_SMOKE_CLEANUP="${SOURCELENS_AUDIT_WORKBENCH_SMOKE_CLEANUP:-true}"
export SOURCELENS_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES="${SOURCELENS_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES:-false}"

python3 - <<'PY'
import json
import http.client
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

http.client.HTTPConnection._http_vsn = 10
http.client.HTTPConnection._http_vsn_str = "HTTP/1.0"


def fail(message, code=1):
    print(f"AUDIT_WORKBENCH_SMOKE_FAIL: {message}", file=sys.stderr)
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


def normalize_base_url(value):
    value = (value or "").strip().rstrip("/")
    if not (value.startswith("http://") or value.startswith("https://")):
        fail("SOURCELENS_BASE_URL must start with http:// or https://")
    if any(char.isspace() for char in value):
        fail("SOURCELENS_BASE_URL must not contain whitespace")
    return value


def is_local_base_url(value):
    parsed = urllib.parse.urlparse(value)
    host = (parsed.hostname or "").lower()
    return host in ("localhost", "127.0.0.1", "::1")


def bool_env(name, default):
    value = os.environ.get(name, default)
    normalized = (value or "").strip().lower()
    if normalized in ("true", "1", "yes", "y"):
        return True
    if normalized in ("false", "0", "no", "n"):
        return False
    fail(f"{name} must be true or false")


BASE_URL = normalize_base_url(os.environ.get("SOURCELENS_BASE_URL", "http://localhost:8080"))
API_BASE = BASE_URL + "/api"
CLEANUP = bool_env("SOURCELENS_AUDIT_WORKBENCH_SMOKE_CLEANUP", "true")
REQUIRE_SAMPLES = bool_env("SOURCELENS_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES", "false")


def request(method, path, data=None, token=None, timeout=30):
    body = None
    headers = {"Accept": "application/json"}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(API_BASE + path, data=body, headers=headers, method=method)
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


def optional_request(method, path, data=None, token=None, timeout=30):
    body = None
    headers = {"Accept": "application/json"}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(API_BASE + path, data=body, headers=headers, method=method)
    try:
        with urlopen_with_retries(req, timeout=timeout) as resp:
            text = resp.read().decode("utf-8")
            payload = json.loads(text) if text else None
            if isinstance(payload, dict) and payload.get("code") not in (None, "SUCCESS"):
                return False, resp.status, payload
            return True, resp.status, payload
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(text) if text else None
        except json.JSONDecodeError:
            payload = {"message": text}
        return False, exc.code, payload
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


def probe_seed_endpoint(token):
    return optional_request(
        "POST",
        "/dev/projects/0/audit-workbench-smoke-seed",
        {"repositoryId": 0},
        token=token,
        timeout=10,
    )


def validate_page_result(label, payload, page_size=20, min_total=0):
    if not isinstance(payload, dict):
        fail(f"{label} response is not an object")
    data = payload.get("data")
    if not isinstance(data, dict):
        fail(f"{label} response data is not an object")
    items = data.get("items")
    if not isinstance(items, list):
        fail(f"{label} data.items is not an array")
    if data.get("page") != 1:
        fail(f"{label} page must be 1, got {data.get('page')}")
    if data.get("pageSize") != page_size:
        fail(f"{label} pageSize must be {page_size}, got {data.get('pageSize')}")
    total = data.get("total")
    if not isinstance(total, int) or total < 0:
        fail(f"{label} total must be a non-negative integer")
    if total < len(items):
        fail(f"{label} total must not be smaller than items length")
    if total < min_total:
        fail(f"{label} total must be at least {min_total}, got {total}")
    return {"items": len(items), "total": total, "records": items}


def require_record(label, items, predicate, expected):
    for item in items:
        if isinstance(item, dict) and predicate(item):
            return item
    fail(f"{label} did not contain expected record: {expected}")


def print_step(message):
    print(message, flush=True)


run_id = datetime.utcnow().strftime("%Y%m%d%H%M%S")
username = f"sl_audit_smoke_{run_id}"
password = f"SourceLensAuditSmoke{run_id}!"
email = f"{username}@local.test"
project_name = f"SourceLens audit workbench smoke {run_id}"
token = None
project_id = None
repository_id = None

print(f"Audit workbench smoke: base={BASE_URL} cleanup={CLEANUP} requireSamples={REQUIRE_SAMPLES}")
if REQUIRE_SAMPLES and not is_local_base_url(BASE_URL):
    fail("SOURCELENS_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES=true is only allowed for localhost/127.0.0.1/::1 targets")
probe_health()

try:
    print_step("[1/7] register and login")
    request("POST", "/auth/register", {"username": username, "email": email, "password": password})
    token = request("POST", "/auth/login", {"username": username, "password": password})["data"]["token"]
    if REQUIRE_SAMPLES:
        seed_probe_ok, seed_probe_status, seed_probe_payload = probe_seed_endpoint(token)
        if seed_probe_status not in (400, 403, 404):
            fail(f"dev audit workbench seed preflight returned unexpected HTTP {seed_probe_status}: {seed_probe_payload}")

    print_step("[2/7] create temporary project")
    project = request(
        "POST",
        "/projects",
        {"name": project_name, "description": "Smoke test for audit workbench data sources"},
        token=token,
    )["data"]
    project_id = project["id"]

    print_step("[3/7] create temporary repository")
    repository = request(
        "POST",
        f"/projects/{project_id}/repositories",
        {
            "url": "https://github.com/octocat/Hello-World.git",
            "defaultBranch": "master",
        },
        token=token,
    )["data"]
    repository_id = repository["id"]

    print_step("[4/7] seed governance samples when dev endpoint is available")
    seed_ok, seed_status, seed_payload = optional_request(
        "POST",
        f"/dev/projects/{project_id}/audit-workbench-smoke-seed",
        {"repositoryId": repository_id},
        token=token,
    )
    seed = seed_payload.get("data") if seed_ok and isinstance(seed_payload, dict) else None
    if not seed:
        if REQUIRE_SAMPLES:
            fail(f"dev audit workbench seed endpoint is required but unavailable: HTTP {seed_status} {seed_payload}")
        print(f"Sample seed skipped: dev seed endpoint unavailable or disabled (HTTP {seed_status})")

    print_step("[5/7] validate audit log source")
    audit_params = {"page": 1, "pageSize": 20}
    if seed:
        audit_params.update({"action": seed["auditAction"], "status": "SUCCESS"})
    audit_counts = validate_page_result(
        "audit-logs",
        request("GET", api_query(f"/projects/{project_id}/audit-logs", audit_params), token=token),
        min_total=1,
    )
    if seed:
        require_record(
            "audit-logs",
            audit_counts["records"],
            lambda item: item.get("action") == seed["auditAction"] and item.get("requestId") == seed["seedId"],
            seed["auditAction"],
        )

    print_step("[6/7] validate agent tool call source")
    tool_params = {"page": 1, "pageSize": 20}
    min_tool_total = 0
    if seed:
        tool_params.update({"toolName": seed["toolName"], "success": "false"})
        min_tool_total = 1
    tool_counts = validate_page_result(
        "agent-tool-calls",
        request("GET", api_query(f"/projects/{project_id}/agent-tool-calls", tool_params), token=token),
        min_total=min_tool_total,
    )
    if seed:
        require_record(
            "agent-tool-calls",
            tool_counts["records"],
            lambda item: item.get("toolName") == seed["toolName"] and item.get("success") is False,
            seed["toolName"],
        )

    print_step("[7/7] validate GitHub webhook delivery source")
    delivery_params = {"page": 1, "pageSize": 20}
    min_delivery_total = 0
    if seed:
        delivery_params.update({"eventType": seed["webhookEvent"], "status": "PROCESSED"})
        min_delivery_total = 1
    delivery_counts = validate_page_result(
        "github-webhook-deliveries",
        request("GET", api_query(f"/projects/{project_id}/github-webhook-deliveries", delivery_params), token=token),
        min_total=min_delivery_total,
    )
    if seed:
        require_record(
            "github-webhook-deliveries",
            delivery_counts["records"],
            lambda item: item.get("deliveryId") == seed["deliveryId"] and item.get("status") == "PROCESSED",
            seed["deliveryId"],
        )

    result = {
        "projectId": project_id,
        "repositoryId": repository_id,
        "sampleSeeded": bool(seed),
        "seedId": seed.get("seedId") if seed else None,
        "sources": {
            "auditLogs": {k: v for k, v in audit_counts.items() if k != "records"},
            "agentToolCalls": {k: v for k, v in tool_counts.items() if k != "records"},
            "githubWebhookDeliveries": {k: v for k, v in delivery_counts.items() if k != "records"},
        },
    }
    print("AUDIT_WORKBENCH_SMOKE_OK " + json.dumps(result, ensure_ascii=False, sort_keys=True))
finally:
    if CLEANUP and project_id and token:
        try:
            request("DELETE", f"/projects/{project_id}", token=token)
            print(f"Cleanup OK: deleted project {project_id}")
        except SystemExit:
            raise
        except Exception as exc:
            print(f"Cleanup WARN: failed to delete project {project_id}: {exc}", file=sys.stderr)
    # Keep the timestamp unique even when this script is run in tight loops.
    time.sleep(0.05)
PY
