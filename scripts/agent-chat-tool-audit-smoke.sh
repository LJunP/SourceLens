#!/usr/bin/env bash
set -euo pipefail

export SOURCELENS_BASE_URL="${SOURCELENS_BASE_URL:-http://localhost:8080}"
export SOURCELENS_AGENT_CHAT_TOOL_AUDIT_SMOKE_CLEANUP="${SOURCELENS_AGENT_CHAT_TOOL_AUDIT_SMOKE_CLEANUP:-true}"
export SOURCELENS_AGENT_CHAT_TOOL_AUDIT_SMOKE_TIMEOUT_SECONDS="${SOURCELENS_AGENT_CHAT_TOOL_AUDIT_SMOKE_TIMEOUT_SECONDS:-60}"
export SOURCELENS_AGENT_CHAT_TOOL_AUDIT_SMOKE_REPO_DIR="${SOURCELENS_AGENT_CHAT_TOOL_AUDIT_SMOKE_REPO_DIR:-}"

python3 - <<'PY'
import json
import http.client
import http.client
import os
import shutil
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
    print(f"AGENT_CHAT_TOOL_AUDIT_SMOKE_FAIL: {message}", file=sys.stderr)
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
    parsed = urllib.parse.urlparse(value)
    host = (parsed.hostname or "").lower()
    if host not in ("localhost", "127.0.0.1", "::1"):
        fail("agent-chat-tool-audit-smoke is local-only; SOURCELENS_BASE_URL must target localhost/127.0.0.1/::1")
    return value


def bool_env(name, default):
    value = os.environ.get(name, default).strip().lower()
    if value in ("true", "1", "yes", "y"):
        return True
    if value in ("false", "0", "no", "n"):
        return False
    fail(f"{name} must be true or false")


def positive_int_env(name, default):
    raw = os.environ.get(name, default)
    try:
        value = int(str(raw))
    except (TypeError, ValueError):
        fail(f"{name} must be a positive integer")
    if value <= 0:
        fail(f"{name} must be a positive integer")
    return value


BASE_URL = normalize_base_url(os.environ.get("SOURCELENS_BASE_URL", "http://localhost:8080"))
API_BASE = BASE_URL + "/api"
CLEANUP = bool_env("SOURCELENS_AGENT_CHAT_TOOL_AUDIT_SMOKE_CLEANUP", "true")
TIMEOUT_SECONDS = positive_int_env("SOURCELENS_AGENT_CHAT_TOOL_AUDIT_SMOKE_TIMEOUT_SECONDS", "60")
REPO_DIR_OVERRIDE = os.environ.get("SOURCELENS_AGENT_CHAT_TOOL_AUDIT_SMOKE_REPO_DIR", "").strip()
BASE_URL_HOST = urllib.parse.urlparse(BASE_URL).hostname


def request(method, path, data=None, token=None, timeout=30, accept="application/json"):
    body = None
    headers = {"Accept": accept}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(API_BASE + path, data=body, headers=headers, method=method)
    try:
        with urlopen_with_retries(req, timeout=timeout) as resp:
            try:
                raw = resp.read()
            except http.client.IncompleteRead as exc:
                if accept == "text/event-stream" and exc.partial:
                    raw = exc.partial
                else:
                    raise
            text = raw.decode("utf-8", errors="replace")
            if accept == "text/event-stream":
                return text
            payload = json.loads(text) if text else None
            if isinstance(payload, dict) and payload.get("code") not in (None, "SUCCESS"):
                fail(f"{method} {path} returned {payload.get('code')}: {payload.get('message')}")
            return payload
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


def create_fixture_repo(run_id):
    repo_dir = Path(REPO_DIR_OVERRIDE or f"/tmp/sourcelens-agent-chat-tool-audit-smoke-{run_id}").resolve()
    if repo_dir.exists() and not REPO_DIR_OVERRIDE:
        shutil.rmtree(repo_dir)
    repo_dir.mkdir(parents=True, exist_ok=True)
    (repo_dir / "README.md").write_text("# SourceLens AgentChat tool audit smoke\n", encoding="utf-8")
    (repo_dir / "src").mkdir(exist_ok=True)
    (repo_dir / "src" / "Demo.java").write_text(
        "package demo;\n\npublic class Demo { public String ping() { return \"pong\"; } }\n",
        encoding="utf-8",
    )
    return repo_dir


def configure_mock_llm(token, run_id):
    config = request(
        "POST",
        "/llm-configs",
        {
            "provider": "MOCK",
            "modelName": "mock-agent-chat-tool-audit-smoke",
            "apiKey": f"sourcelens-mock-key-{run_id}",
            "baseUrl": "mock://local",
            "temperature": 0,
            "maxTokens": 1024,
        },
        token=token,
    )["data"]
    request("POST", f"/llm-configs/{config['id']}/activate", token=token)
    return config


def validate_page_result(label, payload):
    if not isinstance(payload, dict):
        fail(f"{label} response is not an object")
    data = payload.get("data")
    if not isinstance(data, dict):
        fail(f"{label} response data is not an object")
    items = data.get("items")
    if not isinstance(items, list):
        fail(f"{label} data.items is not an array")
    total = data.get("total")
    if not isinstance(total, int) or total < 0:
        fail(f"{label} data.total is not a non-negative integer")
    if total < len(items):
        fail(f"{label} total must not be smaller than items length")
    return data


def wait_for_tool_calls(project_id, conversation_id, token):
    start = time.time()
    last_payload = None
    while time.time() - start < TIMEOUT_SECONDS:
        payload = request(
            "GET",
            api_query(
                f"/projects/{project_id}/agent-tool-calls",
                {"page": 1, "pageSize": 20, "conversationId": conversation_id},
            ),
            token=token,
        )
        page = validate_page_result("agent-tool-calls", payload)
        last_payload = page
        if page["total"] >= 1:
            return page
        time.sleep(1)
    fail(f"agent tool calls for conversation {conversation_id} did not appear within {TIMEOUT_SECONDS}s: {last_payload}")


def print_step(message):
    print(message, flush=True)


run_id = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
username = f"sl_agent_tool_audit_{run_id}"
password = f"SourceLensAgentToolAudit{run_id}!"
email = f"{username}@local.test"
project_name = f"SourceLens AgentChat tool audit smoke {run_id}"
repo_dir = None
token = None
project_id = None

print(f"AgentChat tool audit smoke: baseHost={BASE_URL_HOST} cleanup={CLEANUP}")
probe_health()

try:
    print_step("[1/8] register and login")
    request("POST", "/auth/register", {"username": username, "email": email, "password": password})
    login = request("POST", "/auth/login", {"username": username, "password": password})["data"]
    token = login["token"]
    user_id = login["userId"]

    print_step("[2/8] create local fixture repository")
    repo_dir = create_fixture_repo(run_id)

    print_step("[3/8] create project and file repository")
    project = request(
        "POST",
        "/projects",
        {"name": project_name, "description": "Focused smoke for AgentChat tool call audit conversation linkage"},
        token=token,
    )["data"]
    project_id = project["id"]
    repository = request(
        "POST",
        f"/projects/{project_id}/repositories",
        {"url": repo_dir.as_uri(), "defaultBranch": "main"},
        token=token,
    )["data"]
    repository_id = repository["id"]

    print_step("[4/8] configure local MOCK LLM")
    llm_config = configure_mock_llm(token, run_id)
    if llm_config.get("provider") != "MOCK":
        fail(f"active LLM provider mismatch: {llm_config.get('provider')}")

    print_step("[5/8] create conversations")
    conversation = request(
        "POST",
        f"/projects/{project_id}/conversations",
        {"title": "Tool audit smoke"},
        token=token,
    )["data"]
    conversation_id = conversation["id"]
    wrong_conversation = request(
        "POST",
        f"/projects/{project_id}/conversations",
        {"title": "Tool audit negative control"},
        token=token,
    )["data"]
    wrong_conversation_id = wrong_conversation["id"]

    print_step("[6/8] send AgentChat message and wait for SSE completion")
    sse_text = request(
        "POST",
        f"/conversations/{conversation_id}/messages",
        {"message": "agent-chat-tool-audit-smoke please read README.md"},
        token=token,
        timeout=TIMEOUT_SECONDS + 30,
        accept="text/event-stream",
    )
    sse_tool_call_seen = "event:tool_call" in sse_text or "event: tool_call" in sse_text
    sse_tool_result_seen = "event:tool_result" in sse_text or "event: tool_result" in sse_text
    sse_done_seen = "event:done" in sse_text or "event: done" in sse_text
    if not sse_tool_call_seen:
        fail("AgentChat SSE did not include a tool_call event")
    if not sse_tool_result_seen:
        fail("AgentChat SSE did not include a tool_result event")
    if not sse_done_seen:
        fail("AgentChat SSE did not include a done event")

    print_step("[7/8] query agent tool calls by conversationId")
    page = wait_for_tool_calls(project_id, conversation_id, token)
    items = page["items"]
    mismatches = [
        item for item in items
        if item.get("projectId") != project_id or item.get("conversationId") != conversation_id
    ]
    if mismatches:
        fail(f"agent tool call conversation/project mismatch: {mismatches}")
    success_items = [item for item in items if item.get("success") is True and item.get("toolName") == "read_file"]
    if not success_items:
        fail("expected at least one successful read_file tool call from deterministic local fixture")
    first = success_items[0]
    if first.get("permissionLevel") != "READ_ONLY":
        fail(f"unexpected permissionLevel: {first.get('permissionLevel')}")
    if first.get("createdBy") != user_id:
        fail(f"createdBy mismatch: {first.get('createdBy')} != {user_id}")

    print_step("[8/8] verify negative conversation filter")
    wrong_page = validate_page_result(
        "wrong-conversation-agent-tool-calls",
        request(
            "GET",
            api_query(
                f"/projects/{project_id}/agent-tool-calls",
                {"page": 1, "pageSize": 20, "conversationId": wrong_conversation_id},
            ),
            token=token,
        ),
    )
    if wrong_page["total"] != 0:
        fail(f"wrong conversation filter returned records: total={wrong_page['total']}")

    detail = request("GET", f"/conversations/{conversation_id}", token=token)["data"]
    messages = detail.get("messages") if isinstance(detail, dict) else None
    if not isinstance(messages, list):
        fail("conversation detail did not return messages")
    assistant_tool_calls_persisted = any(
        item.get("role") == "ASSISTANT"
        and item.get("toolCallsJson")
        and item.get("toolCallsJson") != "[]"
        for item in messages
        if isinstance(item, dict)
    )
    tool_results_persisted = any(
        item.get("role") == "TOOL"
        and item.get("toolResultsJson")
        and item.get("toolResultsJson") != "[]"
        for item in messages
        if isinstance(item, dict)
    )
    if not assistant_tool_calls_persisted:
        fail("assistant toolCallsJson was not persisted for the AgentChat conversation")
    if not tool_results_persisted:
        fail("TOOL toolResultsJson was not persisted for the AgentChat conversation")

    result = {
        "spec": "agent-chat-tool-audit-smoke",
        "backendEvidence": True,
        "agentChatPath": True,
        "directToolExecutionOnly": False,
        "projectId": project_id,
        "repositoryId": repository_id,
        "userId": user_id,
        "conversationId": conversation_id,
        "wrongConversationId": wrong_conversation_id,
        "toolCallId": first.get("id"),
        "toolName": first.get("toolName"),
        "permissionLevel": first.get("permissionLevel"),
        "success": first.get("success") is True,
        "persistedConversationId": first.get("conversationId"),
        "persistedProjectId": first.get("projectId"),
        "persistedCreatedBy": first.get("createdBy"),
        "mockedLLM": True,
        "externalLlm": False,
        "externalNetwork": False,
        "baseURLHost": BASE_URL_HOST,
        "noExternalNetwork": True,
        "queryByConversationIdCount": page["total"],
        "successCount": len(success_items),
        "wrongConversationIdCount": wrong_page["total"],
        "mismatchCount": len(mismatches),
        "sseToolCallEventSeen": sse_tool_call_seen,
        "sseToolResultEventSeen": sse_tool_result_seen,
        "sseDoneEventSeen": sse_done_seen,
        "assistantToolCallsPersisted": assistant_tool_calls_persisted,
        "toolResultsPersisted": tool_results_persisted,
    }
    print("AGENT_CHAT_TOOL_AUDIT_SMOKE_OK " + json.dumps(result, ensure_ascii=False, sort_keys=True))
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
