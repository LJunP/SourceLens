#!/usr/bin/env bash
set -euo pipefail
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR_INPUT="${1:-${SOURCELENS_RELEASE_EVIDENCE_VERIFY_DIR:-}}"

fail() {
  echo "RELEASE EVIDENCE VERIFY FAIL: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

require_any_cmd() {
  local label="$1"
  shift
  local cmd
  for cmd in "$@"; do
    if command -v "$cmd" >/dev/null 2>&1; then
      return 0
    fi
  done
  fail "$label requires one of: $*"
}

resolve_path() {
  local path="$1"
  case "$path" in
    /*) printf '%s\n' "$path" ;;
    *) printf '%s/%s\n' "$ROOT_DIR" "$path" ;;
  esac
}

file_mode() {
  local path="$1"
  if stat -f '%Lp' "$path" >/dev/null 2>&1; then
    stat -f '%Lp' "$path"
    return
  fi
  if stat -c '%a' "$path" >/dev/null 2>&1; then
    stat -c '%a' "$path"
    return
  fi
  return 1
}

hash_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" | awk '{print tolower($1)}'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$path" | awk '{print tolower($1)}'
    return
  fi
  return 1
}

require_private_directory() {
  local path="$1"
  local label="$2"
  local mode
  local numeric_mode
  if [[ -L "$path" ]]; then
    fail "$label must not be a symlink: $path"
  fi
  if [[ ! -d "$path" ]]; then
    fail "$label must be a directory: $path"
  fi
  if [[ ! -r "$path" || ! -x "$path" ]]; then
    fail "$label must be readable and searchable: $path"
  fi
  if ! mode="$(file_mode "$path")"; then
    fail "$label permissions could not be inspected: $path"
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    fail "$label permissions could not be parsed: $mode"
  fi
  numeric_mode=$((8#$mode))
  if (( (numeric_mode & 8#077) != 0 )); then
    fail "$label permissions must not grant group/world access (current mode $mode): $path"
  fi
}

require_private_file_600() {
  local path="$1"
  local label="$2"
  local mode
  local numeric_mode
  if [[ -L "$path" ]]; then
    fail "$label must not be a symlink: $path"
  fi
  if [[ ! -f "$path" ]]; then
    fail "$label must be a regular file: $path"
  fi
  if [[ ! -s "$path" ]]; then
    fail "$label must be non-empty: $path"
  fi
  if [[ ! -r "$path" ]]; then
    fail "$label must be readable: $path"
  fi
  if ! mode="$(file_mode "$path")"; then
    fail "$label permissions could not be inspected: $path"
  fi
  if [[ ! "$mode" =~ ^[0-7]+$ ]]; then
    fail "$label permissions could not be parsed: $mode"
  fi
  numeric_mode=$((8#$mode))
  if (( numeric_mode != 8#600 )); then
    fail "$label must have 600 permissions (current mode $mode): $path"
  fi
}

require_file_matches() {
  local path="$1"
  local label="$2"
  local pattern="$3"
  if ! grep -Eq "$pattern" "$path"; then
    fail "$label must match pattern: $pattern"
  fi
}

require_no_control_chars() {
  local path="$1"
  local label="$2"
  if ! awk '
    /[\001-\010\013-\037\177]/ {
      exit 1
    }
  ' "$path"; then
    fail "$label must not contain control characters"
  fi
}

require_seen_once() {
  local slug="$1"
  local count="$2"
  if (( count == 0 )); then
    fail "release evidence status table must contain $slug row"
  fi
  if (( count > 1 )); then
    fail "release evidence status table must contain $slug row only once"
  fi
}

summary_count() {
  local summary_file="$1"
  local key="$2"
  local value
  value="$(awk -v key="$key" '
    $0 ~ "^- " key ": `" {
      line = $0
      sub("^- " key ": `", "", line)
      sub("`[[:space:]]*$", "", line)
      if (line !~ /^[0-9]+$/) {
        bad = 1
        next
      }
      count += 1
      value = line
    }
    END {
      if (bad || count != 1) {
        exit 1
      }
      print value
    }
  ' "$summary_file")" \
    || fail "release evidence summary must contain exactly one numeric $key count"
  printf '%s\n' "$value"
}

summary_metadata_value() {
  local summary_file="$1"
  local key="$2"
  local value
  value="$(awk -v key="$key" '
    $0 ~ "^- " key ": `" {
      line = $0
      sub("^- " key ": `", "", line)
      sub("`[[:space:]]*$", "", line)
      count += 1
      value = line
    }
    END {
      if (count != 1 || value == "" || value ~ /[\001-\037\177]/) {
        exit 1
      }
      print value
    }
  ' "$summary_file")" \
    || fail "release evidence summary must contain exactly one non-empty $key metadata value"
  printf '%s\n' "$value"
}

manifest_metadata_value() {
  local manifest_file="$1"
  local key="$2"
  local value
  value="$(awk -v key="$key" '
    $0 ~ "^" key ": " {
      line = $0
      sub("^" key ": ", "", line)
      count += 1
      value = line
    }
    END {
      if (count != 1 || value == "" || value ~ /[\001-\037\177]/) {
        exit 1
      }
      print value
    }
  ' "$manifest_file")" \
    || fail "release evidence manifest must contain exactly one non-empty $key metadata value"
  printf '%s\n' "$value"
}

manifest_metadata_optional_value() {
  local manifest_file="$1"
  local key="$2"
  local value
  value="$(awk -v key="$key" '
    $0 ~ "^" key ": " {
      line = $0
      sub("^" key ": ", "", line)
      count += 1
      value = line
    }
    END {
      if (count != 1 || value ~ /[\001-\037\177]/) {
        exit 1
      }
      print value
    }
  ' "$manifest_file")" \
    || fail "release evidence manifest must contain exactly one $key metadata value"
  printf '%s\n' "$value"
}

manifest_metadata_has_key() {
  local manifest_file="$1"
  local key="$2"
  awk -v key="$key" '
    $0 ~ "^" key ": " {
      count += 1
    }
    END {
      exit(count == 1 ? 0 : 1)
    }
  ' "$manifest_file"
}

manifest_metadata_optional_default() {
  local manifest_file="$1"
  local key="$2"
  local default_value="$3"
  if manifest_metadata_has_key "$manifest_file" "$key"; then
    manifest_metadata_value "$manifest_file" "$key"
  else
    printf '%s\n' "$default_value"
  fi
}

parse_iso8601_utc() {
  local value="$1"
  local parsed
  if parsed="$(TZ=UTC date -u -d "$value" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" \
    && [[ "$parsed" == "$value" ]]; then
    return 0
  fi
  if parsed="$(TZ=UTC date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "$value" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" \
    && [[ "$parsed" == "$value" ]]; then
    return 0
  fi
  return 1
}

require_iso8601_utc() {
  local value="$1"
  local label="$2"
  if [[ ! "$value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
    fail "$label must be UTC ISO-8601 seconds: $value"
  fi
  if ! parse_iso8601_utc "$value"; then
    fail "$label must be a valid UTC ISO-8601 timestamp: $value"
  fi
}

require_safe_run_id() {
  local value="$1"
  local label="$2"
  if [[ "$value" == "." || "$value" == ".." || ! "$value" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$ ]]; then
    fail "$label must be a 1-64 character safe release evidence run id: $value"
  fi
}

require_safe_metadata_value() {
  local value="$1"
  local label="$2"
  if [[ -z "$value" || "$value" =~ [[:cntrl:]] || "$value" == *'`'* ]]; then
    fail "$label must not contain control characters or backticks"
  fi
}

require_safe_optional_metadata_value() {
  local value="$1"
  local label="$2"
  if [[ -n "$value" && ( "$value" =~ [[:cntrl:]] || "$value" == *'`'* ) ]]; then
    fail "$label must not contain control characters or backticks"
  fi
}

lower_value() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

require_manifest_bool_mode() {
  local value="$1"
  local label="$2"
  case "$(lower_value "$value")" in
    true|1|yes|y|false|0|no|n) ;;
    *) fail "$label must be true or false" ;;
  esac
}

require_manifest_optional_mode() {
  local value="$1"
  local label="$2"
  case "$(lower_value "$value")" in
    auto|true|1|yes|y|false|0|no|n) ;;
    *) fail "$label must be true, false, or auto" ;;
  esac
}

require_manifest_release_evidence_profile() {
  local value="$1"
  case "$value" in
    local|ci|release|nightly) return 0 ;;
    *) fail "release evidence manifest release_evidence_profile must be local, ci, release, or nightly" ;;
  esac
}

require_manifest_release_evidence_profile_schema() {
  local value="$1"
  [[ "$value" == "1" || "$value" == "2" || "$value" == "3" ]] \
    || fail "release evidence manifest release_evidence_profile_schema must be 1, 2, or 3"
}

require_manifest_release_evidence_profile_source() {
  local value="$1"
  case "$value" in
    default|env) return 0 ;;
    *) fail "release evidence manifest release_evidence_profile_source must be default or env" ;;
  esac
}

require_profile_mode() {
  local profile="$1"
  local field="$2"
  local actual="$3"
  local expected="$4"
  if [[ "$actual" != "$expected" ]]; then
    fail "release evidence profile $profile requires $field=$expected"
  fi
}

validate_profile_include_modes() {
  case "$MANIFEST_RELEASE_EVIDENCE_PROFILE" in
    local)
      return
      ;;
    ci)
      require_profile_mode ci include_verify "$MANIFEST_INCLUDE_VERIFY" false
      require_profile_mode ci include_preflight "$MANIFEST_INCLUDE_PREFLIGHT" false
      require_profile_mode ci include_smoke "$MANIFEST_INCLUDE_SMOKE" false
      require_profile_mode ci include_public_repo_smoke "$MANIFEST_INCLUDE_PUBLIC_REPO_SMOKE" false
      require_profile_mode ci public_repo_smoke_ui "$MANIFEST_PUBLIC_REPO_SMOKE_UI" false
      if [[ "$MANIFEST_HAS_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION" == "true" ]]; then
        require_profile_mode ci public_repo_report_evidence_qa_citation "$MANIFEST_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION" false
      fi
      require_profile_mode ci include_file_bound_repair_smoke "$MANIFEST_INCLUDE_FILE_BOUND_REPAIR_SMOKE" false
      require_profile_mode ci include_autorepair_patch_smoke "$MANIFEST_INCLUDE_AUTOREPAIR_PATCH_SMOKE" false
      require_profile_mode ci include_patch_ready_ui_smoke "$MANIFEST_INCLUDE_PATCH_READY_UI_SMOKE" false
      require_profile_mode ci include_dashboard_next_action_ui_smoke "$MANIFEST_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE" false
      require_profile_mode ci include_report_evidence_drawer_ui_smoke "$MANIFEST_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE" false
      require_profile_mode ci include_scan_governance_timeline_ui_smoke "$MANIFEST_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE" false
      require_profile_mode ci include_agent_chat_audit_ui_smoke "$MANIFEST_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE" false
      if [[ "$MANIFEST_RELEASE_EVIDENCE_PROFILE_SCHEMA" == "3" ]]; then
        require_profile_mode ci include_agent_chat_closure_rail_ui_smoke "$MANIFEST_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE" false
      fi
      require_profile_mode ci include_agent_chat_tool_audit_smoke "$MANIFEST_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE" false
      require_profile_mode ci include_audit_workbench_smoke "$MANIFEST_INCLUDE_AUDIT_WORKBENCH_SMOKE" false
      require_profile_mode ci include_phase12 "$MANIFEST_INCLUDE_PHASE12" false
      require_profile_mode ci include_sandbox_drill "$MANIFEST_INCLUDE_SANDBOX_DRILL" false
      require_profile_mode ci include_github_app_drill "$MANIFEST_INCLUDE_GITHUB_APP_DRILL" false
      require_profile_mode ci include_github_webhook_drill "$MANIFEST_INCLUDE_GITHUB_WEBHOOK_DRILL" false
      require_profile_mode ci include_llm_provider_run "$MANIFEST_INCLUDE_LLM_PROVIDER_RUN" false
      ;;
    release)
      require_profile_mode release include_verify "$MANIFEST_INCLUDE_VERIFY" true
      require_profile_mode release include_preflight "$MANIFEST_INCLUDE_PREFLIGHT" true
      require_profile_mode release include_smoke "$MANIFEST_INCLUDE_SMOKE" true
	      require_profile_mode release include_public_repo_smoke "$MANIFEST_INCLUDE_PUBLIC_REPO_SMOKE" true
	      require_profile_mode release public_repo_smoke_ui_manifest_present "$MANIFEST_HAS_PUBLIC_REPO_SMOKE_UI" true
	      require_profile_mode release public_repo_smoke_ui "$MANIFEST_PUBLIC_REPO_SMOKE_UI" true
	      require_profile_mode release public_repo_report_evidence_qa_citation_manifest_present "$MANIFEST_HAS_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION" true
	      require_profile_mode release public_repo_report_evidence_qa_citation "$MANIFEST_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION" true
	      require_profile_mode release include_file_bound_repair_smoke "$MANIFEST_INCLUDE_FILE_BOUND_REPAIR_SMOKE" true
      require_profile_mode release include_autorepair_patch_smoke "$MANIFEST_INCLUDE_AUTOREPAIR_PATCH_SMOKE" true
      require_profile_mode release include_patch_ready_ui_smoke "$MANIFEST_INCLUDE_PATCH_READY_UI_SMOKE" true
      require_profile_mode release include_dashboard_next_action_ui_smoke "$MANIFEST_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE" true
      require_profile_mode release include_report_evidence_drawer_ui_smoke "$MANIFEST_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE" true
      require_profile_mode release include_scan_governance_timeline_ui_smoke "$MANIFEST_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE" true
      require_profile_mode release include_agent_chat_audit_ui_smoke "$MANIFEST_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE" true
      if [[ "$MANIFEST_RELEASE_EVIDENCE_PROFILE_SCHEMA" == "3" ]]; then
        require_profile_mode release include_agent_chat_closure_rail_ui_smoke "$MANIFEST_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE" true
      fi
      require_profile_mode release include_agent_chat_tool_audit_smoke "$MANIFEST_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE" auto
      require_profile_mode release include_audit_workbench_smoke "$MANIFEST_INCLUDE_AUDIT_WORKBENCH_SMOKE" true
      require_profile_mode release include_phase12 "$MANIFEST_INCLUDE_PHASE12" auto
      require_profile_mode release include_sandbox_drill "$MANIFEST_INCLUDE_SANDBOX_DRILL" auto
      require_profile_mode release include_github_app_drill "$MANIFEST_INCLUDE_GITHUB_APP_DRILL" auto
      require_profile_mode release include_github_webhook_drill "$MANIFEST_INCLUDE_GITHUB_WEBHOOK_DRILL" auto
      require_profile_mode release include_llm_provider_run "$MANIFEST_INCLUDE_LLM_PROVIDER_RUN" auto
      ;;
    nightly)
      require_profile_mode nightly include_verify "$MANIFEST_INCLUDE_VERIFY" true
      require_profile_mode nightly include_preflight "$MANIFEST_INCLUDE_PREFLIGHT" true
      require_profile_mode nightly include_smoke "$MANIFEST_INCLUDE_SMOKE" true
	      require_profile_mode nightly include_public_repo_smoke "$MANIFEST_INCLUDE_PUBLIC_REPO_SMOKE" true
	      require_profile_mode nightly public_repo_smoke_ui_manifest_present "$MANIFEST_HAS_PUBLIC_REPO_SMOKE_UI" true
	      require_profile_mode nightly public_repo_smoke_ui "$MANIFEST_PUBLIC_REPO_SMOKE_UI" true
	      require_profile_mode nightly public_repo_report_evidence_qa_citation_manifest_present "$MANIFEST_HAS_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION" true
	      require_profile_mode nightly public_repo_report_evidence_qa_citation "$MANIFEST_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION" true
	      require_profile_mode nightly include_file_bound_repair_smoke "$MANIFEST_INCLUDE_FILE_BOUND_REPAIR_SMOKE" true
      require_profile_mode nightly include_autorepair_patch_smoke "$MANIFEST_INCLUDE_AUTOREPAIR_PATCH_SMOKE" true
      require_profile_mode nightly include_patch_ready_ui_smoke "$MANIFEST_INCLUDE_PATCH_READY_UI_SMOKE" true
      require_profile_mode nightly include_dashboard_next_action_ui_smoke "$MANIFEST_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE" true
      require_profile_mode nightly include_report_evidence_drawer_ui_smoke "$MANIFEST_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE" true
      require_profile_mode nightly include_scan_governance_timeline_ui_smoke "$MANIFEST_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE" true
      require_profile_mode nightly include_agent_chat_audit_ui_smoke "$MANIFEST_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE" true
      if [[ "$MANIFEST_RELEASE_EVIDENCE_PROFILE_SCHEMA" == "3" ]]; then
        require_profile_mode nightly include_agent_chat_closure_rail_ui_smoke "$MANIFEST_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE" true
      fi
      require_profile_mode nightly include_agent_chat_tool_audit_smoke "$MANIFEST_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE" auto
      require_profile_mode nightly include_audit_workbench_smoke "$MANIFEST_INCLUDE_AUDIT_WORKBENCH_SMOKE" true
      require_profile_mode nightly include_phase12 "$MANIFEST_INCLUDE_PHASE12" true
      require_profile_mode nightly include_sandbox_drill "$MANIFEST_INCLUDE_SANDBOX_DRILL" true
      require_profile_mode nightly include_github_app_drill "$MANIFEST_INCLUDE_GITHUB_APP_DRILL" auto
      require_profile_mode nightly include_github_webhook_drill "$MANIFEST_INCLUDE_GITHUB_WEBHOOK_DRILL" auto
      require_profile_mode nightly include_llm_provider_run "$MANIFEST_INCLUDE_LLM_PROVIDER_RUN" auto
      ;;
  esac
}

manifest_mode_is_true() {
  case "$(lower_value "$1")" in
    true|1|yes|y) return 0 ;;
    *) return 1 ;;
  esac
}

manifest_mode_is_false() {
  case "$(lower_value "$1")" in
    false|0|no|n) return 0 ;;
    *) return 1 ;;
  esac
}

validate_manifest_mode_status() {
  local mode="$1"
  local label="$2"
  local slug="$3"
  local status="$4"
  local detail="$5"
  local disabled_detail="$6"
  if manifest_mode_is_true "$mode" && [[ "$status" == "SKIP" ]]; then
    fail "release evidence manifest $label=true requires $slug status not to be SKIP"
  fi
  if manifest_mode_is_true "$mode" && [[ "$status" == "WARN" ]]; then
    fail "release evidence manifest $label=true requires $slug status to be OK or FAIL"
  fi
  if manifest_mode_is_false "$mode" && [[ "$status" != "SKIP" ]]; then
    fail "release evidence manifest $label=false requires $slug status to be SKIP"
  fi
  if manifest_mode_is_false "$mode" && [[ "$detail" != "$disabled_detail" ]]; then
    fail "release evidence manifest $label=false requires $slug detail to be: $disabled_detail"
  fi
  if ! manifest_mode_is_true "$mode" && ! manifest_mode_is_false "$mode" && [[ "$status" == "WARN" ]]; then
    fail "release evidence manifest $label=auto requires $slug status to be OK, FAIL, or SKIP"
  fi
}

extract_summary_steps() {
  local summary_file="$1"
  awk '
    /^## Steps$/ {
      in_steps = 1
      next
    }
    /^## Summary$/ {
      in_steps = 0
      next
    }
    in_steps {
      if ($0 == "") {
        next
      }
      if ($0 ~ /[\001-\037\177]/) {
        print "summary step line contains control characters" > "/dev/stderr"
        bad = 1
        next
      }
      if ($0 !~ /^- (OK|WARN|FAIL|SKIP) `[^`]+`: /) {
        print "invalid summary step line: " $0 > "/dev/stderr"
        bad = 1
        next
      }
      line = $0
      status = line
      sub(/^- /, "", status)
      sub(/ .*/, "", status)
      slug = line
      sub(/^- (OK|WARN|FAIL|SKIP) `/, "", slug)
      sub(/`: .*/, "", slug)
      if (slug !~ /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/) {
        print "unsafe summary step slug: " slug > "/dev/stderr"
        bad = 1
        next
      }
      print line
    }
    END {
      exit(bad ? 1 : 0)
    }
  ' "$summary_file"
}

summary_title_for_slug() {
  local slug="$1"
  case "$slug" in
    git-metadata) printf 'Git metadata snapshot\n' ;;
    worktree-inventory) printf 'Worktree inventory snapshot\n' ;;
    make-verify) printf 'Full local verification\n' ;;
    prod-preflight) printf 'Production preflight (warn-only)\n' ;;
    backup-preflight) printf 'Backup/restore preflight (warn-only)\n' ;;
    rollback-preflight) printf 'Rollback preflight (warn-only)\n' ;;
    backup-restore-drill-evidence) printf 'Backup/restore drill evidence file\n' ;;
    rollback-plan) printf 'Rollback plan file\n' ;;
    smoke) printf 'Smoke test\n' ;;
    public-repo-smoke) printf 'Public repo analysis smoke\n' ;;
    file-bound-repair-smoke) printf 'File-bound repair smoke\n' ;;
    autorepair-patch-smoke) printf 'AutoRepair patch readiness smoke\n' ;;
    patch-ready-ui-smoke) printf 'PATCH_READY browser UI smoke (mocked)\n' ;;
    dashboard-next-action-ui-smoke) printf 'Dashboard next action browser UI smoke (mocked)\n' ;;
    report-evidence-drawer-ui-smoke) printf 'Report evidence drawer browser UI smoke (mocked)\n' ;;
    scan-governance-timeline-ui-smoke) printf 'Scan governance timeline browser UI smoke (mocked)\n' ;;
    agent-chat-audit-ui-smoke) printf 'AgentChat audit browser UI smoke (mocked)\n' ;;
    agent-chat-closure-rail-ui-smoke) printf 'AgentChat closure rail browser UI smoke (mocked)\n' ;;
    agent-chat-tool-audit-smoke) printf 'AgentChat tool audit backend smoke\n' ;;
    audit-workbench-smoke) printf 'Audit workbench smoke\n' ;;
    phase12-baseline) printf 'Phase 12 baseline\n' ;;
    sandbox-drill) printf 'Docker sandbox drill\n' ;;
    github-app-drill) printf 'GitHub App read-only drill\n' ;;
    github-webhook-drill) printf 'GitHub webhook drill\n' ;;
    llm-provider-run) printf 'LLM provider safety eval result\n' ;;
    *) fail "release evidence status table contains unknown step slug: $slug" ;;
  esac
}

validate_package_file_path() {
  local relative_path="$1"
  if [[ -z "$relative_path" ]]; then
    fail "release evidence file path must not be empty"
  fi
  if [[ "$relative_path" == /* ]]; then
    fail "release evidence file path must be relative: $relative_path"
  fi
  if [[ "$relative_path" == "." || "$relative_path" == ".." ]]; then
    fail "release evidence file path must not be a dot segment: $relative_path"
  fi
  if [[ "$relative_path" == *'//'*
    || "$relative_path" == *'\'*
    || "$relative_path" == ./*
    || "$relative_path" == */./*
    || "$relative_path" == ../*
    || "$relative_path" == */../* ]]; then
    fail "release evidence file path is unsafe: $relative_path"
  fi
  if [[ "$relative_path" =~ [[:cntrl:]] ]]; then
    fail "release evidence file path contains control characters: $relative_path"
  fi
}

record_expected_package_file() {
  local relative_path="$1"
  validate_package_file_path "$relative_path"
  printf '%s\n' "$relative_path" >> "$EXPECTED_PACKAGE_FILES"
  record_expected_package_parent_dirs "$relative_path"
}

record_expected_package_directory() {
  local relative_path="$1"
  validate_package_file_path "$relative_path"
  printf '%s\n' "$relative_path" >> "$EXPECTED_PACKAGE_DIRS"
}

record_expected_package_parent_dirs() {
  local relative_path="$1"
  local dir
  if [[ "$relative_path" != */* ]]; then
    return
  fi
  dir="${relative_path%/*}"
  while [[ -n "$dir" && "$dir" != "." && "$dir" != "$relative_path" ]]; do
    record_expected_package_directory "$dir"
    if [[ "$dir" != */* ]]; then
      break
    fi
    dir="${dir%/*}"
  done
}

record_llm_provider_raw_output_files() {
  local provider_run_file="${RUN_DIR}/llm-provider-run.json"
  local artifacts_file="${TMP_DIR}/llm-provider-raw-output-artifacts"
  local run_id
  local artifact_path
  local relative_path

  run_id="${RUN_DIR%/}"
  run_id="${run_id##*/}"
  require_private_file_600 "$provider_run_file" "expected release evidence file llm-provider-run.json"
  if ! (
    cd "$ROOT_DIR" && node scripts/validate-llm-provider-run.mjs \
      "$provider_run_file" \
      docs/llm-safety-evals/prompt-injection-cases.json \
      docs/llm-safety-evals/output-quality-cases.json \
      --run-id "$run_id" \
      --print-artifacts
  ) > "$artifacts_file"; then
    fail "release evidence llm-provider-run.json must contain valid raw output artifact references for run id $run_id"
  fi

  while IFS= read -r artifact_path; do
    [[ -n "$artifact_path" ]] || continue
    relative_path="${artifact_path#release-evidence/${run_id}/}"
    if [[ "$relative_path" == "$artifact_path" || "$relative_path" != llm-evals/* ]]; then
      fail "release evidence llm-provider-run.json raw output artifact path is outside this package: $artifact_path"
    fi
    record_expected_package_file "$relative_path"
  done < "$artifacts_file"
}

validate_status_exit_code() {
  local status="$1"
  local slug="$2"
  local exit_code="$3"
  if [[ "$exit_code" != "-" && ! "$exit_code" =~ ^[0-9]+$ ]]; then
    fail "release evidence status row $slug has invalid exit_code: $exit_code"
  fi
  case "$status" in
    OK)
      [[ "$exit_code" == "0" ]] \
        || fail "release evidence status row $slug with OK status must use exit_code 0"
      ;;
    SKIP)
      [[ "$exit_code" == "-" ]] \
        || fail "release evidence status row $slug with SKIP status must use exit_code -"
      ;;
    WARN)
      [[ "$exit_code" =~ ^[0-9]+$ && "$exit_code" != "0" ]] \
        || fail "release evidence status row $slug with WARN status must use a non-zero numeric exit_code"
      ;;
    FAIL)
      [[ "$exit_code" == "-" || ( "$exit_code" =~ ^[0-9]+$ && "$exit_code" != "0" ) ]] \
        || fail "release evidence status row $slug with FAIL status must use - or a non-zero numeric exit_code"
      ;;
  esac
}

validate_status_log_file_for_slug() {
  local status="$1"
  local slug="$2"
  local log_file="$3"
  case "$slug" in
    backup-restore-drill-evidence)
      if [[ "$status" == "OK" && "$log_file" != "backup-restore-drill-evidence.txt" ]]; then
        fail "release evidence status row backup-restore-drill-evidence with OK status must reference backup-restore-drill-evidence.txt"
      fi
      if [[ "$status" != "OK" && "$log_file" != "backup-restore-drill-evidence.log" ]]; then
        fail "release evidence status row backup-restore-drill-evidence with non-OK status must reference backup-restore-drill-evidence.log"
      fi
      ;;
    rollback-plan)
      if [[ "$status" == "OK" && "$log_file" != "rollback-plan.txt" ]]; then
        fail "release evidence status row rollback-plan with OK status must reference rollback-plan.txt"
      fi
      if [[ "$status" != "OK" && "$log_file" != "rollback-plan.log" ]]; then
        fail "release evidence status row rollback-plan with non-OK status must reference rollback-plan.log"
      fi
      ;;
  esac
}

validate_status_log_file_for_slug_name() {
  local slug="$1"
  local log_file="$2"
  case "$slug" in
    git-metadata)
      [[ "$log_file" == "manifest.txt" ]] \
        || fail "release evidence status row git-metadata must reference manifest.txt"
      ;;
    worktree-inventory)
      [[ "$log_file" == "worktree-inventory.md" ]] \
        || fail "release evidence status row worktree-inventory must reference worktree-inventory.md"
      ;;
    make-verify)
      [[ "$log_file" == "make-verify.log" ]] \
        || fail "release evidence status row make-verify must reference make-verify.log"
      ;;
    prod-preflight)
      [[ "$log_file" == "prod-preflight.log" ]] \
        || fail "release evidence status row prod-preflight must reference prod-preflight.log"
      ;;
    backup-preflight)
      [[ "$log_file" == "backup-preflight.log" ]] \
        || fail "release evidence status row backup-preflight must reference backup-preflight.log"
      ;;
    rollback-preflight)
      [[ "$log_file" == "rollback-preflight.log" ]] \
        || fail "release evidence status row rollback-preflight must reference rollback-preflight.log"
      ;;
    backup-restore-drill-evidence)
      [[ "$log_file" == "backup-restore-drill-evidence.log" || "$log_file" == "backup-restore-drill-evidence.txt" ]] \
        || fail "release evidence status row backup-restore-drill-evidence must reference backup-restore-drill-evidence.log or backup-restore-drill-evidence.txt"
      ;;
    rollback-plan)
      [[ "$log_file" == "rollback-plan.log" || "$log_file" == "rollback-plan.txt" ]] \
        || fail "release evidence status row rollback-plan must reference rollback-plan.log or rollback-plan.txt"
      ;;
    smoke)
      [[ "$log_file" == "smoke.log" ]] \
        || fail "release evidence status row smoke must reference smoke.log"
      ;;
    public-repo-smoke)
      [[ "$log_file" == "public-repo-smoke.log" ]] \
        || fail "release evidence status row public-repo-smoke must reference public-repo-smoke.log"
      ;;
    file-bound-repair-smoke)
      [[ "$log_file" == "file-bound-repair-smoke.log" ]] \
        || fail "release evidence status row file-bound-repair-smoke must reference file-bound-repair-smoke.log"
      ;;
    autorepair-patch-smoke)
      [[ "$log_file" == "autorepair-patch-smoke.log" ]] \
        || fail "release evidence status row autorepair-patch-smoke must reference autorepair-patch-smoke.log"
      ;;
    patch-ready-ui-smoke)
      [[ "$log_file" == "patch-ready-ui-smoke.log" ]] \
        || fail "release evidence status row patch-ready-ui-smoke must reference patch-ready-ui-smoke.log"
      ;;
    dashboard-next-action-ui-smoke)
      [[ "$log_file" == "dashboard-next-action-ui-smoke.log" ]] \
        || fail "release evidence status row dashboard-next-action-ui-smoke must reference dashboard-next-action-ui-smoke.log"
      ;;
    report-evidence-drawer-ui-smoke)
      [[ "$log_file" == "report-evidence-drawer-ui-smoke.log" ]] \
        || fail "release evidence status row report-evidence-drawer-ui-smoke must reference report-evidence-drawer-ui-smoke.log"
      ;;
    scan-governance-timeline-ui-smoke)
      [[ "$log_file" == "scan-governance-timeline-ui-smoke.log" ]] \
        || fail "release evidence status row scan-governance-timeline-ui-smoke must reference scan-governance-timeline-ui-smoke.log"
      ;;
    agent-chat-audit-ui-smoke)
      [[ "$log_file" == "agent-chat-audit-ui-smoke.log" ]] \
        || fail "release evidence status row agent-chat-audit-ui-smoke must reference agent-chat-audit-ui-smoke.log"
      ;;
    agent-chat-closure-rail-ui-smoke)
      [[ "$log_file" == "agent-chat-closure-rail-ui-smoke.log" ]] \
        || fail "release evidence status row agent-chat-closure-rail-ui-smoke must reference agent-chat-closure-rail-ui-smoke.log"
      ;;
    agent-chat-tool-audit-smoke)
      [[ "$log_file" == "agent-chat-tool-audit-smoke.log" ]] \
        || fail "release evidence status row agent-chat-tool-audit-smoke must reference agent-chat-tool-audit-smoke.log"
      ;;
    audit-workbench-smoke)
      [[ "$log_file" == "audit-workbench-smoke.log" ]] \
        || fail "release evidence status row audit-workbench-smoke must reference audit-workbench-smoke.log"
      ;;
    phase12-baseline)
      [[ "$log_file" == "phase12-baseline.log" ]] \
        || fail "release evidence status row phase12-baseline must reference phase12-baseline.log"
      ;;
    sandbox-drill)
      [[ "$log_file" == "sandbox-drill.log" ]] \
        || fail "release evidence status row sandbox-drill must reference sandbox-drill.log"
      ;;
    github-app-drill)
      [[ "$log_file" == "github-app-drill.log" ]] \
        || fail "release evidence status row github-app-drill must reference github-app-drill.log"
      ;;
    github-webhook-drill)
      [[ "$log_file" == "github-webhook-drill.log" ]] \
        || fail "release evidence status row github-webhook-drill must reference github-webhook-drill.log"
      ;;
    llm-provider-run)
      [[ "$log_file" == "llm-provider-run.log" ]] \
        || fail "release evidence status row llm-provider-run must reference llm-provider-run.log"
      ;;
    *)
      fail "release evidence status table contains unknown step slug: $slug"
      ;;
  esac
}

validate_release_metadata() {
  local summary_file="$1"
  local manifest_file="$2"
  local summary_run_id
  local summary_created_at
  local summary_env_file
  local summary_evidence_dir
  local summary_evidence_basename
  local run_dir_basename
  local manifest_run_id
  local manifest_created_at
  local release_evidence_profile_schema
  local release_evidence_profile
  local release_evidence_profile_source
  local manifest_root_dir
  local manifest_env_file
  local manifest_git_head
  local manifest_llm_provider_run_file
  local manifest_llm_raw_output_dir

  summary_run_id="$(summary_metadata_value "$summary_file" run_id)"
  summary_created_at="$(summary_metadata_value "$summary_file" created_at)"
  summary_env_file="$(summary_metadata_value "$summary_file" env_file)"
  summary_evidence_dir="$(summary_metadata_value "$summary_file" evidence_dir)"
  manifest_run_id="$(manifest_metadata_value "$manifest_file" run_id)"
  manifest_created_at="$(manifest_metadata_value "$manifest_file" created_at)"
  release_evidence_profile_schema="$(manifest_metadata_value "$manifest_file" release_evidence_profile_schema)"
  release_evidence_profile="$(manifest_metadata_value "$manifest_file" release_evidence_profile)"
  release_evidence_profile_source="$(manifest_metadata_value "$manifest_file" release_evidence_profile_source)"
  manifest_root_dir="$(manifest_metadata_value "$manifest_file" root_dir)"
  manifest_env_file="$(manifest_metadata_value "$manifest_file" env_file)"
  manifest_llm_provider_run_file="$(manifest_metadata_optional_value "$manifest_file" llm_provider_run_file)"
  manifest_llm_raw_output_dir="$(manifest_metadata_optional_value "$manifest_file" llm_raw_output_dir)"
  manifest_git_head="$(manifest_metadata_value "$manifest_file" git_head)"

  require_safe_run_id "$summary_run_id" "release evidence summary run_id"
  require_safe_run_id "$manifest_run_id" "release evidence manifest run_id"
  require_manifest_release_evidence_profile_schema "$release_evidence_profile_schema"
  require_manifest_release_evidence_profile "$release_evidence_profile"
  require_manifest_release_evidence_profile_source "$release_evidence_profile_source"
  require_safe_metadata_value "$summary_env_file" "release evidence summary env_file"
  require_safe_metadata_value "$manifest_root_dir" "release evidence manifest root_dir"
  require_safe_metadata_value "$manifest_env_file" "release evidence manifest env_file"
  require_safe_metadata_value "$summary_evidence_dir" "release evidence summary evidence_dir"
  require_safe_optional_metadata_value "$manifest_llm_provider_run_file" "release evidence manifest llm_provider_run_file"
  require_safe_optional_metadata_value "$manifest_llm_raw_output_dir" "release evidence manifest llm_raw_output_dir"
  if [[ "$summary_run_id" != "$manifest_run_id" ]]; then
    fail "release evidence summary run_id must match manifest run_id"
  fi
  run_dir_basename="${RUN_DIR%/}"
  run_dir_basename="${run_dir_basename##*/}"
  if [[ "$run_dir_basename" != "$manifest_run_id" ]]; then
    fail "release evidence directory basename must match manifest run_id"
  fi

  require_iso8601_utc "$summary_created_at" "release evidence summary created_at"
  require_iso8601_utc "$manifest_created_at" "release evidence manifest created_at"

  if [[ "$summary_created_at" != "$manifest_created_at" ]]; then
    fail "release evidence summary created_at must match manifest created_at"
  fi

  if [[ "$summary_env_file" != "$manifest_env_file" ]]; then
    fail "release evidence summary env_file must match manifest env_file"
  fi

  summary_evidence_basename="${summary_evidence_dir%/}"
  summary_evidence_basename="${summary_evidence_basename##*/}"
  if [[ "$summary_evidence_basename" != "$summary_run_id" ]]; then
    fail "release evidence summary evidence_dir basename must match run_id"
  fi

  if [[ "$manifest_git_head" != "unavailable" && ! "$manifest_git_head" =~ ^[0-9a-f]{40}$ ]]; then
    fail "release evidence manifest git_head must be a 40-character lowercase SHA-1 or unavailable"
  fi
}

validate_manifest_file_shape() {
  local manifest_file="$1"
  local expected_file="${TMP_DIR}/manifest.expected"
  local manifest_run_id
  local manifest_created_at
  local release_evidence_profile_schema
  local release_evidence_profile
  local release_evidence_profile_source
  local manifest_root_dir
  local manifest_env_file
  local include_verify
  local include_preflight
  local include_smoke
  local include_public_repo_smoke
  local public_repo_smoke_ui
  local has_public_repo_smoke_ui=false
  local public_repo_report_evidence_qa_citation
  local has_public_repo_report_evidence_qa_citation=false
  local public_repo_source_location_probes_required
  local has_public_repo_source_location_probes_required=false
  local include_file_bound_repair_smoke
  local include_autorepair_patch_smoke
  local include_patch_ready_ui_smoke
  local include_dashboard_next_action_ui_smoke
  local include_report_evidence_drawer_ui_smoke
  local include_scan_governance_timeline_ui_smoke
  local include_agent_chat_audit_ui_smoke
  local include_agent_chat_closure_rail_ui_smoke
  local has_agent_chat_closure_rail_ui_smoke=false
  local include_agent_chat_tool_audit_smoke
  local include_audit_workbench_smoke
  local include_phase12
  local include_sandbox_drill
  local include_github_app_drill
  local include_github_webhook_drill
  local include_llm_provider_run
  local worktree_inventory_strict
  local audit_workbench_smoke_require_samples
  local manifest_llm_provider_run_file
  local manifest_llm_raw_output_dir
  local manifest_git_head

  manifest_run_id="$(manifest_metadata_value "$manifest_file" run_id)"
  manifest_created_at="$(manifest_metadata_value "$manifest_file" created_at)"
  release_evidence_profile_schema="$(manifest_metadata_value "$manifest_file" release_evidence_profile_schema)"
  release_evidence_profile="$(manifest_metadata_value "$manifest_file" release_evidence_profile)"
  release_evidence_profile_source="$(manifest_metadata_value "$manifest_file" release_evidence_profile_source)"
  manifest_root_dir="$(manifest_metadata_value "$manifest_file" root_dir)"
  manifest_env_file="$(manifest_metadata_value "$manifest_file" env_file)"
  include_verify="$(manifest_metadata_value "$manifest_file" include_verify)"
  include_preflight="$(manifest_metadata_value "$manifest_file" include_preflight)"
  include_smoke="$(manifest_metadata_value "$manifest_file" include_smoke)"
  include_public_repo_smoke="$(manifest_metadata_value "$manifest_file" include_public_repo_smoke)"
  if manifest_metadata_has_key "$manifest_file" public_repo_smoke_ui; then
    has_public_repo_smoke_ui=true
  fi
  public_repo_smoke_ui="$(manifest_metadata_optional_default "$manifest_file" public_repo_smoke_ui false)"
  if manifest_metadata_has_key "$manifest_file" public_repo_report_evidence_qa_citation; then
    has_public_repo_report_evidence_qa_citation=true
  fi
  public_repo_report_evidence_qa_citation="$(manifest_metadata_optional_default "$manifest_file" public_repo_report_evidence_qa_citation auto)"
  if manifest_metadata_has_key "$manifest_file" public_repo_source_location_probes_required; then
    has_public_repo_source_location_probes_required=true
  fi
  public_repo_source_location_probes_required="$(manifest_metadata_optional_default "$manifest_file" public_repo_source_location_probes_required false)"
  include_file_bound_repair_smoke="$(manifest_metadata_value "$manifest_file" include_file_bound_repair_smoke)"
  include_autorepair_patch_smoke="$(manifest_metadata_value "$manifest_file" include_autorepair_patch_smoke)"
  include_patch_ready_ui_smoke="$(manifest_metadata_value "$manifest_file" include_patch_ready_ui_smoke)"
  include_dashboard_next_action_ui_smoke="$(manifest_metadata_value "$manifest_file" include_dashboard_next_action_ui_smoke)"
  include_report_evidence_drawer_ui_smoke="$(manifest_metadata_value "$manifest_file" include_report_evidence_drawer_ui_smoke)"
  include_scan_governance_timeline_ui_smoke="$(manifest_metadata_value "$manifest_file" include_scan_governance_timeline_ui_smoke)"
  include_agent_chat_audit_ui_smoke="$(manifest_metadata_value "$manifest_file" include_agent_chat_audit_ui_smoke)"
  if manifest_metadata_has_key "$manifest_file" include_agent_chat_closure_rail_ui_smoke; then
    has_agent_chat_closure_rail_ui_smoke=true
  fi
  include_agent_chat_closure_rail_ui_smoke="$(manifest_metadata_optional_default "$manifest_file" include_agent_chat_closure_rail_ui_smoke false)"
  include_agent_chat_tool_audit_smoke="$(manifest_metadata_value "$manifest_file" include_agent_chat_tool_audit_smoke)"
  include_audit_workbench_smoke="$(manifest_metadata_value "$manifest_file" include_audit_workbench_smoke)"
  include_phase12="$(manifest_metadata_value "$manifest_file" include_phase12)"
  include_sandbox_drill="$(manifest_metadata_value "$manifest_file" include_sandbox_drill)"
  include_github_app_drill="$(manifest_metadata_value "$manifest_file" include_github_app_drill)"
  include_github_webhook_drill="$(manifest_metadata_value "$manifest_file" include_github_webhook_drill)"
  include_llm_provider_run="$(manifest_metadata_value "$manifest_file" include_llm_provider_run)"
  worktree_inventory_strict="$(manifest_metadata_value "$manifest_file" worktree_inventory_strict)"
  audit_workbench_smoke_require_samples="$(manifest_metadata_value "$manifest_file" audit_workbench_smoke_require_samples)"
  manifest_llm_provider_run_file="$(manifest_metadata_optional_value "$manifest_file" llm_provider_run_file)"
  manifest_llm_raw_output_dir="$(manifest_metadata_optional_value "$manifest_file" llm_raw_output_dir)"
  manifest_git_head="$(manifest_metadata_value "$manifest_file" git_head)"

  require_manifest_bool_mode "$include_verify" "release evidence manifest include_verify"
  require_manifest_bool_mode "$include_preflight" "release evidence manifest include_preflight"
  require_manifest_optional_mode "$include_smoke" "release evidence manifest include_smoke"
  require_manifest_optional_mode "$include_public_repo_smoke" "release evidence manifest include_public_repo_smoke"
  require_manifest_bool_mode "$public_repo_smoke_ui" "release evidence manifest public_repo_smoke_ui"
  require_manifest_optional_mode "$public_repo_report_evidence_qa_citation" "release evidence manifest public_repo_report_evidence_qa_citation"
  require_manifest_bool_mode "$public_repo_source_location_probes_required" "release evidence manifest public_repo_source_location_probes_required"
  require_manifest_optional_mode "$include_file_bound_repair_smoke" "release evidence manifest include_file_bound_repair_smoke"
  require_manifest_optional_mode "$include_autorepair_patch_smoke" "release evidence manifest include_autorepair_patch_smoke"
  require_manifest_optional_mode "$include_patch_ready_ui_smoke" "release evidence manifest include_patch_ready_ui_smoke"
  require_manifest_optional_mode "$include_dashboard_next_action_ui_smoke" "release evidence manifest include_dashboard_next_action_ui_smoke"
  require_manifest_optional_mode "$include_report_evidence_drawer_ui_smoke" "release evidence manifest include_report_evidence_drawer_ui_smoke"
  require_manifest_optional_mode "$include_scan_governance_timeline_ui_smoke" "release evidence manifest include_scan_governance_timeline_ui_smoke"
  require_manifest_optional_mode "$include_agent_chat_audit_ui_smoke" "release evidence manifest include_agent_chat_audit_ui_smoke"
  require_manifest_optional_mode "$include_agent_chat_closure_rail_ui_smoke" "release evidence manifest include_agent_chat_closure_rail_ui_smoke"
  require_manifest_optional_mode "$include_agent_chat_tool_audit_smoke" "release evidence manifest include_agent_chat_tool_audit_smoke"
  require_manifest_optional_mode "$include_audit_workbench_smoke" "release evidence manifest include_audit_workbench_smoke"
  require_manifest_optional_mode "$include_phase12" "release evidence manifest include_phase12"
  require_manifest_optional_mode "$include_sandbox_drill" "release evidence manifest include_sandbox_drill"
  require_manifest_optional_mode "$include_github_app_drill" "release evidence manifest include_github_app_drill"
  require_manifest_optional_mode "$include_github_webhook_drill" "release evidence manifest include_github_webhook_drill"
  require_manifest_optional_mode "$include_llm_provider_run" "release evidence manifest include_llm_provider_run"
  require_manifest_bool_mode "$worktree_inventory_strict" "release evidence manifest worktree_inventory_strict"
  require_manifest_bool_mode "$audit_workbench_smoke_require_samples" "release evidence manifest audit_workbench_smoke_require_samples"
  require_manifest_release_evidence_profile_schema "$release_evidence_profile_schema"
  require_manifest_release_evidence_profile "$release_evidence_profile"
  require_manifest_release_evidence_profile_source "$release_evidence_profile_source"
  if [[ ( "$release_evidence_profile_schema" == "2" || "$release_evidence_profile_schema" == "3" ) && "$has_public_repo_source_location_probes_required" != "true" ]]; then
    fail "release evidence manifest schema 2 or 3 must include public_repo_source_location_probes_required"
  fi
  if [[ "$release_evidence_profile_schema" == "3" ]] && ! manifest_metadata_has_key "$manifest_file" include_agent_chat_closure_rail_ui_smoke; then
    fail "release evidence manifest schema 3 must include include_agent_chat_closure_rail_ui_smoke"
  fi
  if [[ "$release_evidence_profile_schema" == "2" || "$release_evidence_profile_schema" == "3" ]]; then
    case "$release_evidence_profile" in
      release|nightly)
        [[ "$public_repo_source_location_probes_required" == "true" ]] \
          || fail "release evidence profile $release_evidence_profile requires public_repo_source_location_probes_required=true"
        ;;
    esac
  fi

  MANIFEST_RELEASE_EVIDENCE_PROFILE_SCHEMA="$release_evidence_profile_schema"
  MANIFEST_RELEASE_EVIDENCE_PROFILE="$release_evidence_profile"
  MANIFEST_RELEASE_EVIDENCE_PROFILE_SOURCE="$release_evidence_profile_source"
  MANIFEST_INCLUDE_VERIFY="$include_verify"
  MANIFEST_INCLUDE_PREFLIGHT="$include_preflight"
  MANIFEST_INCLUDE_SMOKE="$include_smoke"
  MANIFEST_INCLUDE_PUBLIC_REPO_SMOKE="$include_public_repo_smoke"
  MANIFEST_PUBLIC_REPO_SMOKE_UI="$public_repo_smoke_ui"
  MANIFEST_HAS_PUBLIC_REPO_SMOKE_UI="$has_public_repo_smoke_ui"
  MANIFEST_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION="$public_repo_report_evidence_qa_citation"
  MANIFEST_HAS_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION="$has_public_repo_report_evidence_qa_citation"
  MANIFEST_PUBLIC_REPO_SOURCE_LOCATION_PROBES_REQUIRED="$public_repo_source_location_probes_required"
  MANIFEST_INCLUDE_FILE_BOUND_REPAIR_SMOKE="$include_file_bound_repair_smoke"
  MANIFEST_INCLUDE_AUTOREPAIR_PATCH_SMOKE="$include_autorepair_patch_smoke"
  MANIFEST_INCLUDE_PATCH_READY_UI_SMOKE="$include_patch_ready_ui_smoke"
  MANIFEST_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE="$include_dashboard_next_action_ui_smoke"
  MANIFEST_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE="$include_report_evidence_drawer_ui_smoke"
  MANIFEST_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE="$include_scan_governance_timeline_ui_smoke"
  MANIFEST_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE="$include_agent_chat_audit_ui_smoke"
  MANIFEST_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE="$include_agent_chat_closure_rail_ui_smoke"
  MANIFEST_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE="$include_agent_chat_tool_audit_smoke"
  MANIFEST_INCLUDE_AUDIT_WORKBENCH_SMOKE="$include_audit_workbench_smoke"
  MANIFEST_INCLUDE_PHASE12="$include_phase12"
  MANIFEST_INCLUDE_SANDBOX_DRILL="$include_sandbox_drill"
  MANIFEST_INCLUDE_GITHUB_APP_DRILL="$include_github_app_drill"
  MANIFEST_INCLUDE_GITHUB_WEBHOOK_DRILL="$include_github_webhook_drill"
  MANIFEST_INCLUDE_LLM_PROVIDER_RUN="$include_llm_provider_run"
  MANIFEST_WORKTREE_INVENTORY_STRICT="$worktree_inventory_strict"
  MANIFEST_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES="$audit_workbench_smoke_require_samples"

  {
    printf 'run_id: %s\n' "$manifest_run_id"
    printf 'created_at: %s\n' "$manifest_created_at"
    printf 'release_evidence_profile_schema: %s\n' "$release_evidence_profile_schema"
    printf 'release_evidence_profile: %s\n' "$release_evidence_profile"
    printf 'release_evidence_profile_source: %s\n' "$release_evidence_profile_source"
    printf 'root_dir: %s\n' "$manifest_root_dir"
    printf 'env_file: %s\n' "$manifest_env_file"
    printf 'include_verify: %s\n' "$include_verify"
    printf 'include_preflight: %s\n' "$include_preflight"
    printf 'include_smoke: %s\n' "$include_smoke"
    printf 'include_public_repo_smoke: %s\n' "$include_public_repo_smoke"
    if [[ "$has_public_repo_smoke_ui" == "true" ]]; then
      printf 'public_repo_smoke_ui: %s\n' "$public_repo_smoke_ui"
    fi
    if [[ "$has_public_repo_report_evidence_qa_citation" == "true" ]]; then
      printf 'public_repo_report_evidence_qa_citation: %s\n' "$public_repo_report_evidence_qa_citation"
    fi
    if [[ "$has_public_repo_source_location_probes_required" == "true" ]]; then
      printf 'public_repo_source_location_probes_required: %s\n' "$public_repo_source_location_probes_required"
    fi
    printf 'include_file_bound_repair_smoke: %s\n' "$include_file_bound_repair_smoke"
    printf 'include_autorepair_patch_smoke: %s\n' "$include_autorepair_patch_smoke"
    printf 'include_patch_ready_ui_smoke: %s\n' "$include_patch_ready_ui_smoke"
    printf 'include_dashboard_next_action_ui_smoke: %s\n' "$include_dashboard_next_action_ui_smoke"
    printf 'include_report_evidence_drawer_ui_smoke: %s\n' "$include_report_evidence_drawer_ui_smoke"
    printf 'include_scan_governance_timeline_ui_smoke: %s\n' "$include_scan_governance_timeline_ui_smoke"
    printf 'include_agent_chat_audit_ui_smoke: %s\n' "$include_agent_chat_audit_ui_smoke"
    if [[ "$release_evidence_profile_schema" == "3" || "$has_agent_chat_closure_rail_ui_smoke" == "true" ]]; then
      printf 'include_agent_chat_closure_rail_ui_smoke: %s\n' "$include_agent_chat_closure_rail_ui_smoke"
    fi
    printf 'include_agent_chat_tool_audit_smoke: %s\n' "$include_agent_chat_tool_audit_smoke"
    printf 'include_audit_workbench_smoke: %s\n' "$include_audit_workbench_smoke"
    printf 'include_phase12: %s\n' "$include_phase12"
    printf 'include_sandbox_drill: %s\n' "$include_sandbox_drill"
    printf 'include_github_app_drill: %s\n' "$include_github_app_drill"
    printf 'include_github_webhook_drill: %s\n' "$include_github_webhook_drill"
    printf 'include_llm_provider_run: %s\n' "$include_llm_provider_run"
    printf 'worktree_inventory_strict: %s\n' "$worktree_inventory_strict"
    printf 'audit_workbench_smoke_require_samples: %s\n' "$audit_workbench_smoke_require_samples"
    printf 'llm_provider_run_file: %s\n' "$manifest_llm_provider_run_file"
    printf 'llm_raw_output_dir: %s\n' "$manifest_llm_raw_output_dir"
    printf 'git_head: %s\n' "$manifest_git_head"
  } > "$expected_file"

  if ! cmp -s "$expected_file" "$manifest_file"; then
    if command -v diff >/dev/null 2>&1; then
      diff -u "$expected_file" "$manifest_file" >&2 || true
    fi
    fail "release evidence manifest file must match the generated layout exactly"
  fi
}

validate_summary_steps() {
  local summary_file="$1"
  local actual_file="${TMP_DIR}/summary-steps.actual"
  local expected_file="${TMP_DIR}/summary-steps.expected"
  if ! extract_summary_steps "$summary_file" | LC_ALL=C sort > "$actual_file"; then
    fail "release evidence summary steps section is invalid"
  fi
  LC_ALL=C sort "$STATUS_SUMMARY_EXPECTED_FILE" > "$expected_file"
  if ! cmp -s "$expected_file" "$actual_file"; then
    if command -v diff >/dev/null 2>&1; then
      diff -u "$expected_file" "$actual_file" >&2 || true
    fi
    fail "release evidence summary steps must match status.tsv status, slug, title and detail rows"
  fi
}

validate_summary_counts() {
  local summary_file="$1"
  local required_failures
  local optional_warnings
  local skipped
  required_failures="$(summary_count "$summary_file" required_failures)"
  optional_warnings="$(summary_count "$summary_file" optional_warnings)"
  skipped="$(summary_count "$summary_file" skipped)"
  if [[ "$required_failures" != "$STATUS_FAIL_COUNT" ]]; then
    fail "release evidence summary required_failures must match status.tsv FAIL rows (summary $required_failures, status $STATUS_FAIL_COUNT)"
  fi
  if [[ "$optional_warnings" != "$STATUS_WARN_COUNT" ]]; then
    fail "release evidence summary optional_warnings must match status.tsv WARN rows (summary $optional_warnings, status $STATUS_WARN_COUNT)"
  fi
  if [[ "$skipped" != "$STATUS_SKIP_COUNT" ]]; then
    fail "release evidence summary skipped must match status.tsv SKIP rows (summary $skipped, status $STATUS_SKIP_COUNT)"
  fi
}

validate_authority_counts() {
  local summary_file="$1"
  local required_failures
  local optional_warnings

  required_failures="$(summary_count "$summary_file" required_failures)"
  optional_warnings="$(summary_count "$summary_file" optional_warnings)"

  case "$MANIFEST_RELEASE_EVIDENCE_PROFILE" in
    ci|release|nightly)
      [[ "$required_failures" == "0" ]] \
        || fail "release evidence profile $MANIFEST_RELEASE_EVIDENCE_PROFILE requires required_failures=0"
      [[ "$optional_warnings" == "0" ]] \
        || fail "release evidence profile $MANIFEST_RELEASE_EVIDENCE_PROFILE requires optional_warnings=0"
      ;;
  esac
}

validate_summary_file_shape() {
  local summary_file="$1"
  local expected_file="${TMP_DIR}/summary.expected"
  local summary_run_id
  local summary_created_at
  local summary_env_file
  local summary_evidence_dir
  local required_failures
  local optional_warnings
  local skipped

  summary_run_id="$(summary_metadata_value "$summary_file" run_id)"
  summary_created_at="$(summary_metadata_value "$summary_file" created_at)"
  summary_env_file="$(summary_metadata_value "$summary_file" env_file)"
  summary_evidence_dir="$(summary_metadata_value "$summary_file" evidence_dir)"
  required_failures="$(summary_count "$summary_file" required_failures)"
  optional_warnings="$(summary_count "$summary_file" optional_warnings)"
  skipped="$(summary_count "$summary_file" skipped)"

  {
    printf '# SourceLens Release Evidence\n\n'
    printf -- '- run_id: `%s`\n' "$summary_run_id"
    printf -- '- created_at: `%s`\n' "$summary_created_at"
    printf -- '- env_file: `%s`\n' "$summary_env_file"
    printf -- '- evidence_dir: `%s`\n\n' "$summary_evidence_dir"
    printf '## Steps\n'
    cat "$STATUS_SUMMARY_EXPECTED_FILE"
    printf '\n## Summary\n\n'
    printf -- '- required_failures: `%s`\n' "$required_failures"
    printf -- '- optional_warnings: `%s`\n' "$optional_warnings"
    printf -- '- skipped: `%s`\n' "$skipped"
  } > "$expected_file"

  if ! cmp -s "$expected_file" "$summary_file"; then
    if command -v diff >/dev/null 2>&1; then
      diff -u "$expected_file" "$summary_file" >&2 || true
    fi
    fail "release evidence summary file must match the generated layout exactly"
  fi
}

validate_manifest_status_consistency() {
  validate_profile_include_modes

  if [[ "$STATUS_GIT_METADATA" != "OK" ]]; then
    fail "release evidence git-metadata status must be OK"
  fi

  validate_manifest_mode_status "$MANIFEST_INCLUDE_VERIFY" "include_verify" "make-verify" "$STATUS_MAKE_VERIFY" "$STATUS_DETAIL_MAKE_VERIFY" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_PREFLIGHT" "include_preflight" "prod-preflight" "$STATUS_PROD_PREFLIGHT" "$STATUS_DETAIL_PROD_PREFLIGHT" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_PREFLIGHT" "include_preflight" "backup-preflight" "$STATUS_BACKUP_PREFLIGHT" "$STATUS_DETAIL_BACKUP_PREFLIGHT" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_PREFLIGHT" "include_preflight" "rollback-preflight" "$STATUS_ROLLBACK_PREFLIGHT" "$STATUS_DETAIL_ROLLBACK_PREFLIGHT" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_SMOKE" "include_smoke" "smoke" "$STATUS_SMOKE" "$STATUS_DETAIL_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_PUBLIC_REPO_SMOKE" "include_public_repo_smoke" "public-repo-smoke" "$STATUS_PUBLIC_REPO_SMOKE" "$STATUS_DETAIL_PUBLIC_REPO_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=false"
  if manifest_mode_is_true "$MANIFEST_PUBLIC_REPO_SMOKE_UI" && manifest_mode_is_false "$MANIFEST_INCLUDE_PUBLIC_REPO_SMOKE"; then
    fail "release evidence manifest public_repo_smoke_ui=true requires include_public_repo_smoke to be true or auto"
  fi
  if manifest_mode_is_true "$MANIFEST_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION" && manifest_mode_is_false "$MANIFEST_INCLUDE_PUBLIC_REPO_SMOKE"; then
    fail "release evidence manifest public_repo_report_evidence_qa_citation=true requires include_public_repo_smoke to be true or auto"
  fi
  validate_manifest_mode_status "$MANIFEST_INCLUDE_FILE_BOUND_REPAIR_SMOKE" "include_file_bound_repair_smoke" "file-bound-repair-smoke" "$STATUS_FILE_BOUND_REPAIR_SMOKE" "$STATUS_DETAIL_FILE_BOUND_REPAIR_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_AUTOREPAIR_PATCH_SMOKE" "include_autorepair_patch_smoke" "autorepair-patch-smoke" "$STATUS_AUTOREPAIR_PATCH_SMOKE" "$STATUS_DETAIL_AUTOREPAIR_PATCH_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_PATCH_READY_UI_SMOKE" "include_patch_ready_ui_smoke" "patch-ready-ui-smoke" "$STATUS_PATCH_READY_UI_SMOKE" "$STATUS_DETAIL_PATCH_READY_UI_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PATCH_READY_UI_SMOKE=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE" "include_dashboard_next_action_ui_smoke" "dashboard-next-action-ui-smoke" "$STATUS_DASHBOARD_NEXT_ACTION_UI_SMOKE" "$STATUS_DETAIL_DASHBOARD_NEXT_ACTION_UI_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE" "include_report_evidence_drawer_ui_smoke" "report-evidence-drawer-ui-smoke" "$STATUS_REPORT_EVIDENCE_DRAWER_UI_SMOKE" "$STATUS_DETAIL_REPORT_EVIDENCE_DRAWER_UI_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE" "include_scan_governance_timeline_ui_smoke" "scan-governance-timeline-ui-smoke" "$STATUS_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE" "$STATUS_DETAIL_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE" "include_agent_chat_audit_ui_smoke" "agent-chat-audit-ui-smoke" "$STATUS_AGENT_CHAT_AUDIT_UI_SMOKE" "$STATUS_DETAIL_AGENT_CHAT_AUDIT_UI_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE=false"
  if [[ "$MANIFEST_RELEASE_EVIDENCE_PROFILE_SCHEMA" == "3" ]]; then
    validate_manifest_mode_status "$MANIFEST_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE" "include_agent_chat_closure_rail_ui_smoke" "agent-chat-closure-rail-ui-smoke" "$STATUS_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE" "$STATUS_DETAIL_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE=false"
  fi
  validate_manifest_mode_status "$MANIFEST_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE" "include_agent_chat_tool_audit_smoke" "agent-chat-tool-audit-smoke" "$STATUS_AGENT_CHAT_TOOL_AUDIT_SMOKE" "$STATUS_DETAIL_AGENT_CHAT_TOOL_AUDIT_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_AUDIT_WORKBENCH_SMOKE" "include_audit_workbench_smoke" "audit-workbench-smoke" "$STATUS_AUDIT_WORKBENCH_SMOKE" "$STATUS_DETAIL_AUDIT_WORKBENCH_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_PHASE12" "include_phase12" "phase12-baseline" "$STATUS_PHASE12_BASELINE" "$STATUS_DETAIL_PHASE12_BASELINE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_SANDBOX_DRILL" "include_sandbox_drill" "sandbox-drill" "$STATUS_SANDBOX_DRILL" "$STATUS_DETAIL_SANDBOX_DRILL" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_GITHUB_APP_DRILL" "include_github_app_drill" "github-app-drill" "$STATUS_GITHUB_APP_DRILL" "$STATUS_DETAIL_GITHUB_APP_DRILL" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_GITHUB_WEBHOOK_DRILL" "include_github_webhook_drill" "github-webhook-drill" "$STATUS_GITHUB_WEBHOOK_DRILL" "$STATUS_DETAIL_GITHUB_WEBHOOK_DRILL" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_LLM_PROVIDER_RUN" "include_llm_provider_run" "llm-provider-run" "$STATUS_LLM_PROVIDER_RUN" "$STATUS_DETAIL_LLM_PROVIDER_RUN" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN=false"

  if [[ "$STATUS_WORKTREE_INVENTORY" == "SKIP" ]]; then
    fail "release evidence worktree-inventory status must not be SKIP"
  fi
  if manifest_mode_is_true "$MANIFEST_WORKTREE_INVENTORY_STRICT" && [[ "$STATUS_WORKTREE_INVENTORY" == "WARN" ]]; then
    fail "release evidence manifest worktree_inventory_strict=true requires worktree-inventory status not to be WARN"
  fi
  if manifest_mode_is_false "$MANIFEST_WORKTREE_INVENTORY_STRICT" && [[ "$STATUS_WORKTREE_INVENTORY" == "FAIL" ]]; then
    fail "release evidence manifest worktree_inventory_strict=false requires worktree-inventory status not to be FAIL"
  fi
}

validate_worktree_inventory_file() {
  local inventory_file="$1"
  local has_other_paths=false
  local has_strict_failure_marker=false

  require_file_matches "$inventory_file" "release evidence worktree inventory" '^# SourceLens Worktree Inventory$'
  require_file_matches "$inventory_file" "release evidence worktree inventory" '^Review order suggestion:$'

  if grep -Eq '^## Other \([1-9][0-9]*\)$' "$inventory_file"; then
    has_other_paths=true
  fi
  if grep -Eq '^WORKTREE INVENTORY FAIL: strict mode found [1-9][0-9]* path\(s\) in Other;' "$inventory_file"; then
    has_strict_failure_marker=true
  fi

  if manifest_mode_is_true "$MANIFEST_WORKTREE_INVENTORY_STRICT" \
    && [[ "$STATUS_WORKTREE_INVENTORY" == "OK" ]] \
    && [[ "$has_other_paths" == "true" ]]; then
    fail "release evidence worktree-inventory strict OK must not contain Other paths"
  fi
  if manifest_mode_is_true "$MANIFEST_WORKTREE_INVENTORY_STRICT" \
    && [[ "$STATUS_WORKTREE_INVENTORY" == "OK" ]] \
    && [[ "$has_strict_failure_marker" == "true" ]]; then
    fail "release evidence worktree-inventory strict OK must not contain strict failure marker"
  fi
  if manifest_mode_is_true "$MANIFEST_WORKTREE_INVENTORY_STRICT" \
    && [[ "$STATUS_WORKTREE_INVENTORY" == "FAIL" ]] \
    && [[ "$STATUS_DETAIL_WORKTREE_INVENTORY" == "strict worktree inventory failed" ]] \
    && { [[ "$has_other_paths" != "true" ]] || [[ "$has_strict_failure_marker" != "true" ]]; }; then
    fail "release evidence worktree-inventory strict FAIL must contain Other paths and strict failure marker"
  fi
}

validate_audit_workbench_strict_sample_evidence() {
  local smoke_log_file="$1"
  if ! manifest_mode_is_true "$MANIFEST_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES" \
    || [[ "$STATUS_AUDIT_WORKBENCH_SMOKE" != "OK" ]]; then
    return
  fi

  node - "$smoke_log_file" <<'NODE' || fail "release evidence strict audit workbench smoke must prove sampleSeeded=true and all three source totals are >=1"
const fs = require("node:fs");
const logFile = process.argv[2];
const lines = fs.readFileSync(logFile, "utf8").split(/\r?\n/);
const prefix = "AUDIT_WORKBENCH_SMOKE_OK ";
const matches = lines.filter((line) => line.startsWith(prefix));
if (matches.length !== 1) {
  process.exit(1);
}
let payload;
try {
  payload = JSON.parse(matches[0].slice(prefix.length));
} catch {
  process.exit(1);
}
const sources = payload && payload.sources;
const requiredSources = ["auditLogs", "agentToolCalls", "githubWebhookDeliveries"];
if (!payload || payload.sampleSeeded !== true || !sources || typeof sources !== "object") {
  process.exit(1);
}
for (const source of requiredSources) {
  const total = sources[source] && sources[source].total;
  if (!Number.isInteger(total) || total < 1) {
    process.exit(1);
  }
}
NODE
}

validate_public_repo_smoke_success_marker() {
  local smoke_log_file="$1"
  if [[ "$STATUS_PUBLIC_REPO_SMOKE" != "OK" ]]; then
    return
  fi

  node - "$smoke_log_file" "$MANIFEST_PUBLIC_REPO_SMOKE_UI" "$MANIFEST_PUBLIC_REPO_SOURCE_LOCATION_PROBES_REQUIRED" "$MANIFEST_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION" <<'NODE' || fail "release evidence public-repo-smoke OK must include PUBLIC_REPO_SMOKE_OK marker with natural endpoint controller probes, source location probes when required, and required UI smoke marker; report evidence QA citation marker is required when configured"
const fs = require("node:fs");
const path = require("node:path");
const logFile = process.argv[2];
const requireUiSmoke = /^(true|1|yes|y)$/i.test(process.argv[3] || "");
const requireSourceLocationProbes = /^(true|1|yes|y)$/i.test(process.argv[4] || "");
const requireReportEvidenceQaCitation = /^(true|1|yes|y)$/i.test(process.argv[5] || "");
const lines = fs.readFileSync(logFile, "utf8").split(/\r?\n/);
const prefix = "PUBLIC_REPO_SMOKE_OK ";
const uiPrefix = "PUBLIC_REPO_UI_SMOKE_OK ";
const matches = lines.filter((line) => line.startsWith(prefix));
const uiMatches = lines.filter((line) => line.startsWith(uiPrefix));

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function parseMarker(line, markerPrefix, markerName) {
  try {
    const payload = JSON.parse(line.slice(markerPrefix.length));
    assert(payload && typeof payload === "object" && !Array.isArray(payload), `${markerName} payload must be an object`);
    return payload;
  } catch (error) {
    assert(false, `${markerName} marker must contain valid JSON: ${error.message}`);
  }
}

function assertPositiveIntegerPayload(payload, markerName) {
  for (const field of ["projectId", "repositoryId", "scanTaskId"]) {
    assert(Number.isInteger(payload[field]) && payload[field] > 0, `${markerName} ${field} must be a positive integer`);
  }
}

function assertNoSensitiveMaterial(value, location = "payload") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSensitiveMaterial(entry, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      assert(!/(token|jwt|authorization|password|secret|apikey|api_key|privatekey|private_key|credential)/i.test(key), `${location} must not include sensitive field ${key}`);
      assertNoSensitiveMaterial(nested, `${location}.${key}`);
    }
    return;
  }
  if (typeof value === "string") {
    assert(!/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/.test(value), `${location} must not include JWT-like value`);
    assert(!/\bAuthorization\s*:\s*Bearer\b/i.test(value), `${location} must not include Authorization bearer text`);
    assert(!/\b(password|secret|api[_-]?key|private[_-]?key|credential)\s*[=:]\s*\S+/i.test(value), `${location} must not include sensitive assignment text`);
  }
}

function assertRequiredStringSet(actual, required, label) {
  assert(Array.isArray(actual), `${label} must be an array`);
  const seen = new Set();
  for (const value of actual) {
    assert(typeof value === "string" && value.trim(), `${label} entries must be non-empty strings`);
    assert(!seen.has(value), `${label} must not contain duplicate entry ${value}`);
    seen.add(value);
  }
  for (const value of required) {
    assert(seen.has(value), `${label} must include ${value}`);
  }
}

function assertRequiredCoverageScopes(actual, label) {
  assertRequiredStringSet(actual, [], label);
  assert(actual.length > 0, `${label} must be non-empty`);
  const allowedScopes = new Set(["PRIMARY", "ALL"]);
  for (const scope of actual) {
    assert(allowedScopes.has(scope), `${label}.${scope} is not allowed`);
  }
}

function assertEvidenceRoleDistribution(value, parentCoverage, label, mode) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const allowedStatuses = new Set(["NO_EVIDENCE", "PRIMARY_SINGLE_FILE", "PRIMARY_CROSS_FILE", "MIXED_PRIMARY_CONTEXT", "CONTEXT_ONLY", "UNKNOWN_ROLE_PRESENT"]);
  if (mode === "raw") {
    assert(allowedStatuses.has(value.status), `${label}.status is not allowed`);
    for (const field of ["totalFileCount", "citedFileCount", "primaryFileCount", "citedPrimaryFileCount", "contextFileCount", "citedContextFileCount", "roleCount", "fileEntryCount"]) {
      assert(Number.isInteger(value[field]) && value[field] >= 0, `${label}.${field} must be a non-negative integer`);
    }
    assert(value.totalFileCount === parentCoverage.uniqueEvidenceFileCount, `${label}.totalFileCount must match parent uniqueEvidenceFileCount`);
    assert(value.citedFileCount === parentCoverage.citedEvidenceFileCount, `${label}.citedFileCount must match parent citedEvidenceFileCount`);
    assert(value.primaryFileCount === parentCoverage.primaryEvidenceFileCount, `${label}.primaryFileCount must match parent primaryEvidenceFileCount`);
    assert(value.citedPrimaryFileCount === parentCoverage.citedPrimaryEvidenceFileCount, `${label}.citedPrimaryFileCount must match parent citedPrimaryEvidenceFileCount`);
    assert(value.contextFileCount === parentCoverage.contextEvidenceFileCount, `${label}.contextFileCount must match parent contextEvidenceFileCount`);
    assert(value.citedContextFileCount === parentCoverage.citedContextEvidenceFileCount, `${label}.citedContextFileCount must match parent citedContextEvidenceFileCount`);
    assert(value.totalFileCount > 0, `${label}.totalFileCount must be positive`);
    assert(value.primaryFileCount > 0, `${label}.primaryFileCount must be positive`);
    assert(value.citedPrimaryFileCount > 0, `${label}.citedPrimaryFileCount must cite at least one primary file`);
    assert(value.citedPrimaryFileCount <= value.primaryFileCount, `${label}.citedPrimaryFileCount must not exceed primary files`);
    assert(value.roleCount > 0, `${label}.roleCount must be positive`);
    assert(value.fileEntryCount > 0, `${label}.fileEntryCount must be positive`);
    return;
  }

  assertRequiredStringSet(value.statuses, [], `${label}.statuses`);
  assert(value.statuses.length > 0 && value.statuses.every((status) => allowedStatuses.has(status)), `${label}.statuses contains an illegal status`);
  for (const field of ["minTotalFileCount", "minPrimaryFileCount", "minContextFileCount", "minRoleCount", "minFileEntryCount"]) {
    assert(Number.isInteger(value[field]) && value[field] >= 0, `${label}.${field} must be a non-negative integer`);
  }
  assert(value.minTotalFileCount === parentCoverage.minUniqueEvidenceFileCount, `${label}.minTotalFileCount must match parent minUniqueEvidenceFileCount`);
  assert(value.minPrimaryFileCount === parentCoverage.minPrimaryEvidenceFileCount, `${label}.minPrimaryFileCount must match parent minPrimaryEvidenceFileCount`);
  assert(value.minContextFileCount === parentCoverage.minContextEvidenceFileCount, `${label}.minContextFileCount must match parent minContextEvidenceFileCount`);
  assert(value.minTotalFileCount > 0, `${label}.minTotalFileCount must be positive`);
  assert(value.minPrimaryFileCount > 0, `${label}.minPrimaryFileCount must be positive`);
  assert(value.minRoleCount > 0, `${label}.minRoleCount must be positive`);
  assert(value.minFileEntryCount > 0, `${label}.minFileEntryCount must be positive`);
  if (mode === "verified") {
    assert(Number.isInteger(value.minCitedFileCount) && value.minCitedFileCount === parentCoverage.minCitedEvidenceFileCount, `${label}.minCitedFileCount must match parent minCitedEvidenceFileCount`);
    assert(Number.isInteger(value.minCitedPrimaryFileCount) && value.minCitedPrimaryFileCount === parentCoverage.minCitedPrimaryEvidenceFileCount, `${label}.minCitedPrimaryFileCount must match parent minCitedPrimaryEvidenceFileCount`);
    assert(Number.isInteger(value.minCitedContextFileCount) && value.minCitedContextFileCount === parentCoverage.minCitedContextEvidenceFileCount, `${label}.minCitedContextFileCount must match parent minCitedContextEvidenceFileCount`);
    assert(value.minCitedPrimaryFileCount >= value.minPrimaryFileCount, `${label}.minCitedPrimaryFileCount must cover primary files`);
    return;
  }
  assert(Number.isInteger(value.maxCitedFileCount) && value.maxCitedFileCount === parentCoverage.maxCitedEvidenceFileCount, `${label}.maxCitedFileCount must match parent maxCitedEvidenceFileCount`);
  assert(Number.isInteger(value.maxCitedPrimaryFileCount) && value.maxCitedPrimaryFileCount === parentCoverage.maxCitedPrimaryEvidenceFileCount, `${label}.maxCitedPrimaryFileCount must match parent maxCitedPrimaryEvidenceFileCount`);
  assert(Number.isInteger(value.maxCitedContextFileCount) && value.maxCitedContextFileCount === parentCoverage.maxCitedContextEvidenceFileCount, `${label}.maxCitedContextFileCount must match parent maxCitedContextEvidenceFileCount`);
  assert(value.maxCitedFileCount === 0, `${label}.maxCitedFileCount must be 0`);
  assert(value.maxCitedPrimaryFileCount === 0, `${label}.maxCitedPrimaryFileCount must be 0`);
  assert(value.maxCitedContextFileCount === 0, `${label}.maxCitedContextFileCount must be 0`);
}

function assertReadyClaimCitationCoverage(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertRequiredStringSet(value.statuses, ["READY"], `${label}.statuses`);
  assert(value.statuses.every((status) => status === "READY"), `${label}.statuses must contain only READY`);
  assert(value.readyForRepair === true, `${label}.readyForRepair must be true`);
  assertRequiredStringSet(value.readinessReasons, ["PRIMARY_BOUND_READY"], `${label}.readinessReasons`);
  assert(value.readinessReasons.length === 1, `${label}.readinessReasons must contain only PRIMARY_BOUND_READY`);
  assert(Number.isInteger(value.minClaimCoveragePercent) && value.minClaimCoveragePercent >= 100, `${label}.minClaimCoveragePercent must be at least 100`);
  assert(Number.isInteger(value.minRequiredClaimCount) && value.minRequiredClaimCount > 0, `${label}.minRequiredClaimCount must be positive`);
  assert(Number.isInteger(value.minCitedRequiredClaimCount) && value.minCitedRequiredClaimCount > 0, `${label}.minCitedRequiredClaimCount must be positive`);
  assert(value.minCitedRequiredClaimCount === value.minRequiredClaimCount, `${label}.minCitedRequiredClaimCount must match minRequiredClaimCount`);
  assert(Number.isInteger(value.maxUncitedRequiredClaimCount) && value.maxUncitedRequiredClaimCount === 0, `${label}.maxUncitedRequiredClaimCount must be 0`);
  assert(Number.isInteger(value.maxInvalidCitationClaimCount) && value.maxInvalidCitationClaimCount === 0, `${label}.maxInvalidCitationClaimCount must be 0`);
  assert(Number.isInteger(value.minValidCitationFileCount) && value.minValidCitationFileCount > 0, `${label}.minValidCitationFileCount must be positive`);
  assert(Number.isInteger(value.minRequiredClaimCitationFileCount) && value.minRequiredClaimCitationFileCount > 0, `${label}.minRequiredClaimCitationFileCount must be positive`);
  assertReadyClaimRoleDistribution(value.roleDistribution, value, `${label}.roleDistribution`);
}

function assertReadyClaimRoleDistribution(value, parentCoverage, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertRequiredStringSet(value.statuses, ["PRIMARY_BOUND"], `${label}.statuses`);
  assert(value.statuses.every((status) => status === "PRIMARY_BOUND"), `${label}.statuses must contain only PRIMARY_BOUND`);
  assert(Number.isInteger(value.minRequiredClaimCount) && value.minRequiredClaimCount === parentCoverage.minRequiredClaimCount, `${label}.minRequiredClaimCount must match parent`);
  assert(Number.isInteger(value.minRequiredPrimaryBoundClaimCount) && value.minRequiredPrimaryBoundClaimCount === parentCoverage.minRequiredClaimCount, `${label}.minRequiredPrimaryBoundClaimCount must cover required claims`);
  assert(Number.isInteger(value.maxRequiredContextOnlyClaimCount) && value.maxRequiredContextOnlyClaimCount === 0, `${label}.maxRequiredContextOnlyClaimCount must be 0`);
  assert(Number.isInteger(value.maxRequiredUnknownOnlyClaimCount) && value.maxRequiredUnknownOnlyClaimCount === 0, `${label}.maxRequiredUnknownOnlyClaimCount must be 0`);
  assert(Number.isInteger(value.maxUnbackedRequiredClaimCount) && value.maxUnbackedRequiredClaimCount === 0, `${label}.maxUnbackedRequiredClaimCount must be 0`);
  assert(Number.isInteger(value.maxInvalidRequiredClaimCount) && value.maxInvalidRequiredClaimCount === 0, `${label}.maxInvalidRequiredClaimCount must be 0`);
  assert(Number.isInteger(value.minValidCitationFileCount) && value.minValidCitationFileCount === parentCoverage.minValidCitationFileCount, `${label}.minValidCitationFileCount must match parent`);
  assert(Number.isInteger(value.minRequiredClaimCitationFileCount) && value.minRequiredClaimCitationFileCount === parentCoverage.minRequiredClaimCitationFileCount, `${label}.minRequiredClaimCitationFileCount must match parent`);
  assert(Number.isInteger(value.minRequiredPrimaryFileCount) && value.minRequiredPrimaryFileCount > 0, `${label}.minRequiredPrimaryFileCount must be positive`);
  assert(Number.isInteger(value.minRoleCount) && value.minRoleCount > 0, `${label}.minRoleCount must be positive`);
  assert(Number.isInteger(value.minFileEntryCount) && value.minFileEntryCount > 0, `${label}.minFileEntryCount must be positive`);
}

function assertCrossFileCitationSummary(value, parentCoverage, claimCoverage, label, mode) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const verifiedKeys = new Set([
    "visible",
    "tones",
    "statuses",
    "crossFileEvidenceSatisfied",
    "citationBindingSatisfied",
    "claimBindingSatisfied",
    "currentScanOnly",
    "sourceEvidenceMatchTypes",
    "minEvidenceFileCount",
    "minCitedEvidenceFileCount",
    "minPrimaryEvidenceFileCount",
    "minCitedPrimaryEvidenceFileCount",
    "minContextEvidenceFileCount",
    "minCitedContextEvidenceFileCount",
    "contextGapVisible",
    "minUncitedContextEvidenceCount",
    "minUncitedContextEvidenceFileCount",
    "minRequiredEvidenceFileCount",
    "minCitedRequiredEvidenceFileCount",
    "minRequiredClaimCount",
    "minRequiredClaimCitationFileCount",
    "minRequiredPrimaryFileCount",
    "minRequiredPrimaryBoundClaimCount",
  ]);
  const unverifiedKeys = new Set([
    "visible",
    "tones",
    "statuses",
    "crossFileEvidenceSatisfied",
    "citationBindingSatisfied",
    "claimBindingSatisfied",
    "currentScanOnly",
    "sourceEvidenceMatchTypes",
    "minEvidenceFileCount",
    "maxCitedEvidenceFileCount",
    "minPrimaryEvidenceFileCount",
    "maxCitedPrimaryEvidenceFileCount",
    "minContextEvidenceFileCount",
    "maxCitedContextEvidenceFileCount",
    "minRequiredEvidenceFileCount",
    "maxCitedRequiredEvidenceFileCount",
    "minRequiredClaimCount",
    "maxRequiredClaimCitationFileCount",
    "maxRequiredPrimaryFileCount",
    "maxRequiredPrimaryBoundClaimCount",
  ]);
  assertAllowedObjectKeys(value, mode === "verified" ? verifiedKeys : unverifiedKeys, label);
  const forbiddenKeys = /url|query|hash|origin|host|requestPath|stack|prompt|answer|content|code|claimText|token|authorization/i;
  for (const key of Object.keys(value)) {
    assert(!forbiddenKeys.test(key), `${label}.${key} must not archive raw content, URLs, prompts or secrets`);
  }
  const allowedStatuses = new Set(["NO_EVIDENCE", "PRIMARY_SINGLE_FILE", "PRIMARY_CROSS_FILE", "MIXED_PRIMARY_CONTEXT", "CONTEXT_ONLY", "UNKNOWN_ROLE_PRESENT"]);
  const allowedTones = mode === "verified" ? new Set(["ready", "warning"]) : new Set(["blocked"]);
  assert(value.visible === true, `${label}.visible must be true`);
  assertRequiredStringSet(value.tones, [], `${label}.tones`);
  assert(value.tones.length > 0 && value.tones.every((tone) => allowedTones.has(tone)), `${label}.tones must match ${mode} citation state`);
  assertRequiredStringSet(value.statuses, [], `${label}.statuses`);
  assert(value.statuses.length > 0 && value.statuses.every((status) => allowedStatuses.has(status)), `${label}.statuses contains an illegal status`);
  assert(value.currentScanOnly === true, `${label}.currentScanOnly must be true`);
  assert(typeof value.crossFileEvidenceSatisfied === "boolean", `${label}.crossFileEvidenceSatisfied must be boolean`);
  assert(value.crossFileEvidenceSatisfied === (parentCoverage.minUniqueEvidenceFileCount >= 2), `${label}.crossFileEvidenceSatisfied must be derived from parent minUniqueEvidenceFileCount`);
  assertRequiredStringSet(value.sourceEvidenceMatchTypes, [], `${label}.sourceEvidenceMatchTypes`);
  assert(value.sourceEvidenceMatchTypes.every((type) => type === "REPORT_LINE_ANCHOR"), `${label}.sourceEvidenceMatchTypes must be line anchors only`);

  if (mode === "verified") {
    assert(value.citationBindingSatisfied === true, `${label}.citationBindingSatisfied must be true`);
    assert(value.claimBindingSatisfied === true, `${label}.claimBindingSatisfied must be true`);
    assert(value.minEvidenceFileCount === parentCoverage.minUniqueEvidenceFileCount, `${label}.minEvidenceFileCount must match parent`);
    assert(value.minCitedEvidenceFileCount === parentCoverage.minCitedEvidenceFileCount, `${label}.minCitedEvidenceFileCount must match parent`);
    assert(value.minPrimaryEvidenceFileCount === parentCoverage.minPrimaryEvidenceFileCount, `${label}.minPrimaryEvidenceFileCount must match parent`);
    assert(value.minCitedPrimaryEvidenceFileCount === parentCoverage.minCitedPrimaryEvidenceFileCount, `${label}.minCitedPrimaryEvidenceFileCount must match parent`);
    assert(value.minContextEvidenceFileCount === parentCoverage.minContextEvidenceFileCount, `${label}.minContextEvidenceFileCount must match parent`);
    assert(value.minCitedContextEvidenceFileCount === parentCoverage.minCitedContextEvidenceFileCount, `${label}.minCitedContextEvidenceFileCount must match parent`);
    if (Object.prototype.hasOwnProperty.call(value, "contextGapVisible")) {
      assert(typeof value.contextGapVisible === "boolean", `${label}.contextGapVisible must be boolean`);
      assert(Number.isInteger(value.minUncitedContextEvidenceCount) && value.minUncitedContextEvidenceCount >= 0, `${label}.minUncitedContextEvidenceCount must be non-negative`);
      assert(Number.isInteger(value.minUncitedContextEvidenceFileCount) && value.minUncitedContextEvidenceFileCount >= 0, `${label}.minUncitedContextEvidenceFileCount must be non-negative`);
      assert(value.contextGapVisible === (value.minUncitedContextEvidenceCount > 0 || value.minUncitedContextEvidenceFileCount > 0), `${label}.contextGapVisible must match uncited context gap`);
    }
    assert(value.minRequiredEvidenceFileCount === parentCoverage.minRequiredEvidenceFileCount, `${label}.minRequiredEvidenceFileCount must match parent`);
    assert(value.minCitedRequiredEvidenceFileCount === parentCoverage.minCitedRequiredEvidenceFileCount, `${label}.minCitedRequiredEvidenceFileCount must match parent`);
    assert(value.minCitedRequiredEvidenceFileCount >= value.minRequiredEvidenceFileCount, `${label}.minCitedRequiredEvidenceFileCount must cover required files`);
    assert(value.minCitedPrimaryEvidenceFileCount >= value.minPrimaryEvidenceFileCount, `${label}.minCitedPrimaryEvidenceFileCount must cover primary files`);
    assert(value.minRequiredClaimCount === claimCoverage.minRequiredClaimCount, `${label}.minRequiredClaimCount must match claim coverage`);
    assert(value.minRequiredClaimCitationFileCount === claimCoverage.minRequiredClaimCitationFileCount, `${label}.minRequiredClaimCitationFileCount must match claim coverage`);
    assert(value.minRequiredPrimaryFileCount === claimCoverage.roleDistribution.minRequiredPrimaryFileCount, `${label}.minRequiredPrimaryFileCount must match claim role distribution`);
    assert(value.minRequiredPrimaryBoundClaimCount === claimCoverage.roleDistribution.minRequiredPrimaryBoundClaimCount, `${label}.minRequiredPrimaryBoundClaimCount must match claim role distribution`);
    assert(value.minRequiredPrimaryBoundClaimCount >= value.minRequiredClaimCount, `${label}.minRequiredPrimaryBoundClaimCount must cover required claims`);
    return;
  }

  assert(value.citationBindingSatisfied === false, `${label}.citationBindingSatisfied must be false`);
  assert(value.claimBindingSatisfied === false, `${label}.claimBindingSatisfied must be false`);
  assert(value.minEvidenceFileCount === parentCoverage.minUniqueEvidenceFileCount, `${label}.minEvidenceFileCount must match parent`);
  assert(value.maxCitedEvidenceFileCount === parentCoverage.maxCitedEvidenceFileCount, `${label}.maxCitedEvidenceFileCount must match parent`);
  assert(value.minPrimaryEvidenceFileCount === parentCoverage.minPrimaryEvidenceFileCount, `${label}.minPrimaryEvidenceFileCount must match parent`);
  assert(value.maxCitedPrimaryEvidenceFileCount === parentCoverage.maxCitedPrimaryEvidenceFileCount, `${label}.maxCitedPrimaryEvidenceFileCount must match parent`);
  assert(value.minContextEvidenceFileCount === parentCoverage.minContextEvidenceFileCount, `${label}.minContextEvidenceFileCount must match parent`);
  assert(value.maxCitedContextEvidenceFileCount === parentCoverage.maxCitedContextEvidenceFileCount, `${label}.maxCitedContextEvidenceFileCount must match parent`);
  assert(value.minRequiredEvidenceFileCount === parentCoverage.minRequiredEvidenceFileCount, `${label}.minRequiredEvidenceFileCount must match parent`);
  assert(value.maxCitedRequiredEvidenceFileCount === parentCoverage.maxCitedRequiredEvidenceFileCount, `${label}.maxCitedRequiredEvidenceFileCount must match parent`);
  assert(value.maxCitedEvidenceFileCount === 0, `${label}.maxCitedEvidenceFileCount must be 0`);
  assert(value.maxCitedPrimaryEvidenceFileCount === 0, `${label}.maxCitedPrimaryEvidenceFileCount must be 0`);
  assert(value.maxCitedRequiredEvidenceFileCount === 0, `${label}.maxCitedRequiredEvidenceFileCount must be 0`);
  assert(value.minRequiredClaimCount === claimCoverage.minRequiredClaimCount, `${label}.minRequiredClaimCount must match claim coverage`);
  assert(value.maxRequiredClaimCitationFileCount === claimCoverage.maxRequiredClaimCitationFileCount, `${label}.maxRequiredClaimCitationFileCount must match claim coverage`);
  assert(value.maxRequiredPrimaryFileCount === claimCoverage.roleDistribution.maxRequiredPrimaryFileCount, `${label}.maxRequiredPrimaryFileCount must match claim role distribution`);
  assert(value.maxRequiredPrimaryBoundClaimCount === claimCoverage.roleDistribution.maxRequiredPrimaryBoundClaimCount, `${label}.maxRequiredPrimaryBoundClaimCount must match claim role distribution`);
  assert(value.maxRequiredPrimaryBoundClaimCount === 0, `${label}.maxRequiredPrimaryBoundClaimCount must be 0`);
}

function assertReportEvidenceQaCitationQuality(value, payload) {
  const label = "PUBLIC_REPO_SMOKE_OK reportEvidenceQaCitationQuality";
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object when present`);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "surface",
    "mode",
    "scanTaskId",
    "sampleCount",
    "currentScanOnly",
    "samplingStrategy",
    "targetSampleCount",
    "candidateCount",
    "uniqueFileCount",
    "sourceSectionCount",
    "diversityStatus",
    "diversityFallbackUsed",
    "sourceSections",
    "evidenceRefModeStatus",
    "evidenceRefModes",
    "lineNumberSampleCount",
    "startEndOnlySampleCount",
    "lineNumberLineAnchorBoundSampleCount",
    "startEndOnlyLineAnchorBoundSampleCount",
    "sourceEvidenceMatchTypes",
    "groundingStatuses",
    "citationEnforcementStatuses",
    "citationEnforcementReasons",
    "minRequiredEvidenceCoveragePercent",
    "minRequiredEvidenceCount",
    "minCitedRequiredEvidenceCount",
    "minPrimaryEvidenceCount",
    "minCitedPrimaryEvidenceCount",
    "claimCitationStatuses",
    "minClaimCoveragePercent",
    "minRequiredClaimCount",
    "minCitedRequiredClaimCount",
    "roleDistributionStatuses",
    "minRequiredPrimaryBoundClaimCount",
    "minRequiredPrimaryFileCount",
    "lineAnchorCitationStatus",
    "lineAnchorBoundSampleCount",
    "lineAnchorEvidenceReasonVisibleSampleCount",
    "minLineAnchorCitedCount",
    "minLineAnchorPrimaryCitedCount",
    "narrativeCitationStatus",
    "narrativeBoundSampleCount",
    "minNarrativeEvidenceRefFieldCount",
    "narrativeCheckKeys",
    "narrativeSectionBindingStatuses",
    "samples",
    "noRawPromptOrAnswer",
    "providerQualityClaim",
    "llmFactClaim",
    "rawRetrievedChunkContentAbsentSampleCount",
    "maxContentPreviewLength",
  ]), label);
  assertNoSensitiveMaterial(value, label);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.surface === "PUBLIC_REPO_REPORT_EVIDENCE_QA_MULTI_ANCHOR", `${label}.surface must prove public repo report evidence QA`);
  assert(["auto", "true"].includes(value.mode), `${label}.mode must be auto or true`);
  assert(value.scanTaskId === payload.scanTaskId, `${label}.scanTaskId must match scanTaskId`);
  assert(value.currentScanOnly === true, `${label}.currentScanOnly must be true`);
  assert(value.noRawPromptOrAnswer === true, `${label}.noRawPromptOrAnswer must be true`);
  assert(value.providerQualityClaim === false, `${label}.providerQualityClaim must be false`);
  assert(value.llmFactClaim === false, `${label}.llmFactClaim must be false`);
  assert(Number.isInteger(value.sampleCount) && value.sampleCount >= 2, `${label}.sampleCount must be at least 2`);
  assert(Array.isArray(value.samples) && value.samples.length === value.sampleCount, `${label}.samples must match sampleCount`);
  assert(value.samplingStrategy === "DIVERSE_FILE_THEN_REPORT_ORDER", `${label}.samplingStrategy must prove diverse-file sampling`);
  assert(Number.isInteger(value.targetSampleCount) && value.targetSampleCount === 4, `${label}.targetSampleCount must be 4`);
  assert(Number.isInteger(value.candidateCount) && value.candidateCount >= value.sampleCount, `${label}.candidateCount must cover sampleCount`);
  assert(Number.isInteger(value.uniqueFileCount) && value.uniqueFileCount > 0 && value.uniqueFileCount <= value.sampleCount, `${label}.uniqueFileCount must be between 1 and sampleCount`);
  assert(Number.isInteger(value.sourceSectionCount) && value.sourceSectionCount > 0, `${label}.sourceSectionCount must be positive`);
  assert(["MULTI_FILE", "SINGLE_FILE"].includes(value.diversityStatus), `${label}.diversityStatus must be valid`);
  assert(typeof value.diversityFallbackUsed === "boolean", `${label}.diversityFallbackUsed must be boolean`);
  if (value.diversityStatus === "MULTI_FILE") {
    assert(value.uniqueFileCount >= 2, `${label}.uniqueFileCount must prove multi-file diversity`);
    assert(value.diversityFallbackUsed === false || value.uniqueFileCount < value.sampleCount, `${label}.diversityFallbackUsed must match sample coverage`);
  } else {
    assert(value.uniqueFileCount === 1, `${label}.SINGLE_FILE must report exactly one unique file`);
    assert(value.diversityFallbackUsed === true, `${label}.SINGLE_FILE must declare diversity fallback`);
  }
  assertRequiredStringSet(value.sourceSections, ["apiRoutes"], `${label}.sourceSections`);
  assert(value.evidenceRefModeStatus === "MIXED_LINE_AND_START_END", `${label}.evidenceRefModeStatus must prove mixed lineNumber and startLine/endLine evidenceRef coverage`);
  assertRequiredStringSet(value.evidenceRefModes, ["LINE_NUMBER", "START_END_ONLY"], `${label}.evidenceRefModes`);
  assert(value.evidenceRefModes.every((mode) => ["LINE_NUMBER", "START_END_ONLY"].includes(mode)), `${label}.evidenceRefModes must contain only supported modes`);
  assert(Number.isInteger(value.lineNumberSampleCount) && value.lineNumberSampleCount > 0, `${label}.lineNumberSampleCount must be positive`);
  assert(Number.isInteger(value.startEndOnlySampleCount) && value.startEndOnlySampleCount > 0, `${label}.startEndOnlySampleCount must be positive`);
  assert(value.lineNumberSampleCount + value.startEndOnlySampleCount === value.sampleCount, `${label}.evidenceRef mode counts must sum to sampleCount`);
  assert(Number.isInteger(value.lineNumberLineAnchorBoundSampleCount) && value.lineNumberLineAnchorBoundSampleCount === value.lineNumberSampleCount, `${label}.lineNumberLineAnchorBoundSampleCount must match lineNumberSampleCount`);
  assert(Number.isInteger(value.startEndOnlyLineAnchorBoundSampleCount) && value.startEndOnlyLineAnchorBoundSampleCount === value.startEndOnlySampleCount, `${label}.startEndOnlyLineAnchorBoundSampleCount must match startEndOnlySampleCount`);
  assertRequiredStringSet(value.sourceEvidenceMatchTypes, ["REPORT_LINE_ANCHOR"], `${label}.sourceEvidenceMatchTypes`);
  assert(value.sourceEvidenceMatchTypes.every((type) => type === "REPORT_LINE_ANCHOR"), `${label}.sourceEvidenceMatchTypes must contain line anchors only`);
  assertRequiredStringSet(value.groundingStatuses, ["VERIFIED"], `${label}.groundingStatuses`);
  assert(value.groundingStatuses.every((status) => status === "VERIFIED"), `${label}.groundingStatuses must contain only VERIFIED`);
  assertRequiredStringSet(value.citationEnforcementStatuses, [], `${label}.citationEnforcementStatuses`);
  assert(
    value.citationEnforcementStatuses.length > 0
      && value.citationEnforcementStatuses.every((status) => ["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_CITED"].includes(status)),
    `${label}.citationEnforcementStatuses must prove successful citation enforcement`
  );
  assertRequiredStringSet(value.citationEnforcementReasons, [], `${label}.citationEnforcementReasons`);
  assert(
    value.citationEnforcementReasons.length > 0
      && value.citationEnforcementReasons.every((reason) => ["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_PRIMARY_CITED"].includes(reason)),
    `${label}.citationEnforcementReasons must prove successful citation enforcement reasons`
  );
  assert(Number.isInteger(value.minRequiredEvidenceCoveragePercent) && value.minRequiredEvidenceCoveragePercent >= 100, `${label}.minRequiredEvidenceCoveragePercent must be at least 100`);
  assert(Number.isInteger(value.minRequiredEvidenceCount) && value.minRequiredEvidenceCount > 0, `${label}.minRequiredEvidenceCount must be positive`);
  assert(Number.isInteger(value.minCitedRequiredEvidenceCount) && value.minCitedRequiredEvidenceCount >= value.minRequiredEvidenceCount, `${label}.minCitedRequiredEvidenceCount must cover required evidence`);
  assert(Number.isInteger(value.minPrimaryEvidenceCount) && value.minPrimaryEvidenceCount > 0, `${label}.minPrimaryEvidenceCount must be positive`);
  assert(Number.isInteger(value.minCitedPrimaryEvidenceCount) && value.minCitedPrimaryEvidenceCount >= value.minPrimaryEvidenceCount, `${label}.minCitedPrimaryEvidenceCount must cover primary evidence`);
  assertRequiredStringSet(value.claimCitationStatuses, ["READY"], `${label}.claimCitationStatuses`);
  assert(value.claimCitationStatuses.every((status) => status === "READY"), `${label}.claimCitationStatuses must contain only READY`);
  assert(Number.isInteger(value.minClaimCoveragePercent) && value.minClaimCoveragePercent >= 100, `${label}.minClaimCoveragePercent must be at least 100`);
  assert(Number.isInteger(value.minRequiredClaimCount) && value.minRequiredClaimCount > 0, `${label}.minRequiredClaimCount must be positive`);
  assert(Number.isInteger(value.minCitedRequiredClaimCount) && value.minCitedRequiredClaimCount >= value.minRequiredClaimCount, `${label}.minCitedRequiredClaimCount must cover required claims`);
  assertRequiredStringSet(value.roleDistributionStatuses, ["PRIMARY_BOUND"], `${label}.roleDistributionStatuses`);
  assert(value.roleDistributionStatuses.every((status) => status === "PRIMARY_BOUND"), `${label}.roleDistributionStatuses must contain only PRIMARY_BOUND`);
  assert(Number.isInteger(value.minRequiredPrimaryBoundClaimCount) && value.minRequiredPrimaryBoundClaimCount >= value.minRequiredClaimCount, `${label}.minRequiredPrimaryBoundClaimCount must cover required claims`);
  assert(Number.isInteger(value.minRequiredPrimaryFileCount) && value.minRequiredPrimaryFileCount > 0, `${label}.minRequiredPrimaryFileCount must be positive`);
  assert(value.lineAnchorCitationStatus === "ALL_SAMPLES_BOUND", `${label}.lineAnchorCitationStatus must be ALL_SAMPLES_BOUND`);
  assert(Number.isInteger(value.lineAnchorBoundSampleCount) && value.lineAnchorBoundSampleCount === value.sampleCount, `${label}.lineAnchorBoundSampleCount must match sampleCount`);
  assert(Number.isInteger(value.lineAnchorEvidenceReasonVisibleSampleCount) && value.lineAnchorEvidenceReasonVisibleSampleCount === value.sampleCount, `${label}.lineAnchorEvidenceReasonVisibleSampleCount must match sampleCount`);
  assert(Number.isInteger(value.minLineAnchorCitedCount) && value.minLineAnchorCitedCount > 0, `${label}.minLineAnchorCitedCount must be positive`);
  assert(Number.isInteger(value.minLineAnchorPrimaryCitedCount) && value.minLineAnchorPrimaryCitedCount > 0, `${label}.minLineAnchorPrimaryCitedCount must be positive`);
  assert(value.narrativeCitationStatus === "ALL_SAMPLES_NARRATIVE_BOUND", `${label}.narrativeCitationStatus must be ALL_SAMPLES_NARRATIVE_BOUND`);
  assert(Number.isInteger(value.narrativeBoundSampleCount) && value.narrativeBoundSampleCount === value.sampleCount, `${label}.narrativeBoundSampleCount must match sampleCount`);
  assert(Number.isInteger(value.minNarrativeEvidenceRefFieldCount) && value.minNarrativeEvidenceRefFieldCount >= 6, `${label}.minNarrativeEvidenceRefFieldCount must prove evidenceRef field coverage`);
  assertRequiredStringSet(value.narrativeCheckKeys, ["api_data_surface"], `${label}.narrativeCheckKeys`);
  assert(value.narrativeCheckKeys.every((key) => key === "api_data_surface"), `${label}.narrativeCheckKeys must contain api_data_surface only`);
  assertRequiredStringSet(value.narrativeSectionBindingStatuses, ["BOUND"], `${label}.narrativeSectionBindingStatuses`);
  assert(value.narrativeSectionBindingStatuses.every((status) => status === "BOUND"), `${label}.narrativeSectionBindingStatuses must contain BOUND only`);
  assert(Number.isInteger(value.rawRetrievedChunkContentAbsentSampleCount) && value.rawRetrievedChunkContentAbsentSampleCount === value.sampleCount, `${label}.rawRetrievedChunkContentAbsentSampleCount must match sampleCount`);
  assert(Number.isInteger(value.maxContentPreviewLength) && value.maxContentPreviewLength >= 0 && value.maxContentPreviewLength <= 700, `${label}.maxContentPreviewLength must be server-truncated`);

  const sampleKeys = new Set([
    "index",
    "evidenceRefMode",
    "evidenceRefLineNumberPresent",
    "evidenceRefStartEndPresent",
    "evidenceRefStartLine",
    "evidenceRefEndLine",
    "sourceEvidenceRefLineNumberPresent",
    "sourceEvidenceRefStartEndPresent",
    "sourceEvidenceRefStartLine",
    "sourceEvidenceRefEndLine",
    "sourceSection",
    "sourceEvidenceMatchType",
    "requestScanTaskId",
    "responseScanTaskId",
    "filePath",
    "lineNumber",
    "resultCount",
    "citationCount",
    "citedChunkCount",
    "lineAnchorCitationBound",
    "lineAnchorCitedCount",
    "lineAnchorPrimaryCitedCount",
    "lineAnchorCitationFilePath",
    "lineAnchorCitationStartLine",
    "lineAnchorCitationEndLine",
    "lineAnchorCitationContextRole",
    "lineAnchorEvidenceReasonVisible",
    "narrativeBound",
    "narrativeCheckKey",
    "narrativeSourceSection",
    "narrativeSectionBindingStatus",
    "narrativeEvidenceRefFieldCount",
    "narrativeQuestionBound",
    "narrativeRawTextStored",
    "requiredEvidenceCoveragePercent",
    "requiredEvidenceCount",
    "citedRequiredEvidenceCount",
    "primaryEvidenceCount",
    "citedPrimaryEvidenceCount",
    "evidenceRoleDistributionStatus",
    "claimCitationStatus",
    "claimCoveragePercent",
    "requiredClaimCount",
    "citedRequiredClaimCount",
    "roleDistributionStatus",
    "requiredPrimaryBoundClaimCount",
    "requiredPrimaryFileCount",
    "groundingStatus",
    "citationEnforcementStatus",
    "citationEnforcementReason",
    "providerQualityClaim",
    "llmFactClaim",
    "rawRetrievedChunkContentAbsent",
    "contentPreviewMaxLength",
  ]);
  const seen = new Set();
  const sampleFiles = new Set();
  const sampleSections = new Set();
  const sampleCitationEnforcementReasons = new Set();
  let observedLineNumberSamples = 0;
  let observedStartEndOnlySamples = 0;
  let observedLineNumberBoundSamples = 0;
  let observedStartEndOnlyBoundSamples = 0;
  for (const sample of value.samples) {
    assert(sample && typeof sample === "object" && !Array.isArray(sample), `${label}.samples entries must be objects`);
    assertAllowedObjectKeys(sample, sampleKeys, `${label}.samples`);
    assertNoSensitiveMaterial(sample, `${label}.samples`);
    assert(Number.isInteger(sample.index) && sample.index >= 1 && sample.index <= value.sampleCount, `${label}.samples.index must be within sampleCount`);
    assert(!seen.has(sample.index), `${label}.samples.index must be unique`);
    seen.add(sample.index);
    assert(["LINE_NUMBER", "START_END_ONLY"].includes(sample.evidenceRefMode), `${label}.samples.evidenceRefMode must be supported`);
    assert(typeof sample.evidenceRefLineNumberPresent === "boolean", `${label}.samples.evidenceRefLineNumberPresent must be boolean`);
    assert(typeof sample.evidenceRefStartEndPresent === "boolean", `${label}.samples.evidenceRefStartEndPresent must be boolean`);
    assert(typeof sample.sourceEvidenceRefLineNumberPresent === "boolean", `${label}.samples.sourceEvidenceRefLineNumberPresent must be boolean`);
    assert(typeof sample.sourceEvidenceRefStartEndPresent === "boolean", `${label}.samples.sourceEvidenceRefStartEndPresent must be boolean`);
    assert(sample.sourceSection === "apiRoutes", `${label}.samples.sourceSection must be apiRoutes`);
    assert(sample.sourceEvidenceMatchType === "REPORT_LINE_ANCHOR", `${label}.samples.sourceEvidenceMatchType must be REPORT_LINE_ANCHOR`);
    assert(sample.requestScanTaskId === payload.scanTaskId, `${label}.samples.requestScanTaskId must match scanTaskId`);
    assert(sample.responseScanTaskId === payload.scanTaskId, `${label}.samples.responseScanTaskId must match scanTaskId`);
    assert(typeof sample.filePath === "string" && sample.filePath.trim() && !sample.filePath.startsWith("/") && !sample.filePath.includes("\\") && !sample.filePath.split("/").includes(".."), `${label}.samples.filePath must be a safe relative path`);
    assert(Number.isInteger(sample.lineNumber) && sample.lineNumber > 0, `${label}.samples.lineNumber must be positive`);
    if (sample.evidenceRefMode === "LINE_NUMBER") {
      observedLineNumberSamples += 1;
      assert(sample.evidenceRefLineNumberPresent === true, `${label}.LINE_NUMBER samples must send evidenceRef.lineNumber`);
      assert(sample.evidenceRefStartEndPresent === false, `${label}.LINE_NUMBER samples must not send evidenceRef.startLine/endLine`);
      assert(sample.sourceEvidenceRefLineNumberPresent === true, `${label}.LINE_NUMBER samples must echo sourceEvidenceRef.lineNumber`);
      assert(sample.sourceEvidenceRefStartEndPresent === false, `${label}.LINE_NUMBER samples must not synthesize sourceEvidenceRef.startLine/endLine`);
      assert(sample.evidenceRefStartLine == null && sample.evidenceRefEndLine == null, `${label}.LINE_NUMBER samples must not archive evidenceRef start/end`);
      assert(sample.sourceEvidenceRefStartLine == null && sample.sourceEvidenceRefEndLine == null, `${label}.LINE_NUMBER samples must not archive sourceEvidenceRef start/end`);
    } else {
      observedStartEndOnlySamples += 1;
      assert(sample.evidenceRefLineNumberPresent === false, `${label}.START_END_ONLY samples must not send evidenceRef.lineNumber`);
      assert(sample.evidenceRefStartEndPresent === true, `${label}.START_END_ONLY samples must send evidenceRef.startLine/endLine`);
      assert(sample.sourceEvidenceRefLineNumberPresent === false, `${label}.START_END_ONLY samples must not synthesize sourceEvidenceRef.lineNumber`);
      assert(sample.sourceEvidenceRefStartEndPresent === true, `${label}.START_END_ONLY samples must echo sourceEvidenceRef.startLine/endLine`);
      assert(Number.isInteger(sample.evidenceRefStartLine) && sample.evidenceRefStartLine > 0, `${label}.START_END_ONLY evidenceRefStartLine must be positive`);
      assert(Number.isInteger(sample.evidenceRefEndLine) && sample.evidenceRefEndLine >= sample.evidenceRefStartLine, `${label}.START_END_ONLY evidenceRefEndLine must cover startLine`);
      assert(sample.evidenceRefStartLine <= sample.lineNumber && sample.lineNumber <= sample.evidenceRefEndLine, `${label}.START_END_ONLY evidenceRef range must cover lineNumber`);
      assert(sample.sourceEvidenceRefStartLine === sample.evidenceRefStartLine, `${label}.START_END_ONLY sourceEvidenceRefStartLine must match evidenceRefStartLine`);
      assert(sample.sourceEvidenceRefEndLine === sample.evidenceRefEndLine, `${label}.START_END_ONLY sourceEvidenceRefEndLine must match evidenceRefEndLine`);
    }
    assert(Number.isInteger(sample.resultCount) && sample.resultCount > 0, `${label}.samples.resultCount must be positive`);
    assert(Number.isInteger(sample.citationCount) && sample.citationCount > 0, `${label}.samples.citationCount must be positive`);
    assert(Number.isInteger(sample.citedChunkCount) && sample.citedChunkCount > 0, `${label}.samples.citedChunkCount must be positive`);
    assert(sample.lineAnchorCitationBound === true, `${label}.samples.lineAnchorCitationBound must be true`);
    if (sample.evidenceRefMode === "LINE_NUMBER") {
      observedLineNumberBoundSamples += 1;
    } else {
      observedStartEndOnlyBoundSamples += 1;
    }
    assert(Number.isInteger(sample.lineAnchorCitedCount) && sample.lineAnchorCitedCount > 0, `${label}.samples.lineAnchorCitedCount must be positive`);
    assert(Number.isInteger(sample.lineAnchorPrimaryCitedCount) && sample.lineAnchorPrimaryCitedCount > 0, `${label}.samples.lineAnchorPrimaryCitedCount must be positive`);
    assert(sample.lineAnchorEvidenceReasonVisible === true, `${label}.samples.lineAnchorEvidenceReasonVisible must be true`);
    assert(sample.lineAnchorCitedCount <= sample.citedChunkCount, `${label}.samples.lineAnchorCitedCount must not exceed citedChunkCount`);
    assert(sample.lineAnchorPrimaryCitedCount <= sample.lineAnchorCitedCount, `${label}.samples.lineAnchorPrimaryCitedCount must not exceed lineAnchorCitedCount`);
    assert(sample.lineAnchorCitationFilePath === sample.filePath, `${label}.samples.lineAnchorCitationFilePath must match filePath`);
    assert(Number.isInteger(sample.lineAnchorCitationStartLine) && sample.lineAnchorCitationStartLine > 0, `${label}.samples.lineAnchorCitationStartLine must be positive`);
    assert(Number.isInteger(sample.lineAnchorCitationEndLine) && sample.lineAnchorCitationEndLine >= sample.lineAnchorCitationStartLine, `${label}.samples.lineAnchorCitationEndLine must be >= startLine`);
    assert(sample.lineAnchorCitationStartLine <= sample.lineNumber && sample.lineNumber <= sample.lineAnchorCitationEndLine, `${label}.samples.lineNumber must be covered by lineAnchorCitationStartLine/endLine`);
    assert(sample.lineAnchorCitationContextRole === "PRIMARY", `${label}.samples.lineAnchorCitationContextRole must be PRIMARY`);
    assert(sample.narrativeBound === true, `${label}.samples.narrativeBound must be true`);
    assert(sample.narrativeCheckKey === "api_data_surface", `${label}.samples.narrativeCheckKey must be api_data_surface`);
    assert(sample.narrativeSourceSection === sample.sourceSection, `${label}.samples.narrativeSourceSection must match sourceSection`);
    assert(sample.narrativeSourceSection === "apiRoutes", `${label}.samples.narrativeSourceSection must be apiRoutes`);
    assert(sample.narrativeSectionBindingStatus === "BOUND", `${label}.samples.narrativeSectionBindingStatus must be BOUND`);
    assert(Number.isInteger(sample.narrativeEvidenceRefFieldCount) && sample.narrativeEvidenceRefFieldCount >= 6, `${label}.samples.narrativeEvidenceRefFieldCount must be at least 6`);
    assert(sample.narrativeQuestionBound === true, `${label}.samples.narrativeQuestionBound must be true`);
    assert(sample.narrativeRawTextStored === false, `${label}.samples.narrativeRawTextStored must be false`);
    assert(Number.isInteger(sample.requiredEvidenceCoveragePercent) && sample.requiredEvidenceCoveragePercent >= 100, `${label}.samples.requiredEvidenceCoveragePercent must be at least 100`);
    assert(Number.isInteger(sample.requiredEvidenceCount) && sample.requiredEvidenceCount > 0, `${label}.samples.requiredEvidenceCount must be positive`);
    assert(Number.isInteger(sample.citedRequiredEvidenceCount) && sample.citedRequiredEvidenceCount >= sample.requiredEvidenceCount, `${label}.samples.citedRequiredEvidenceCount must cover required evidence`);
    assert(Number.isInteger(sample.primaryEvidenceCount) && sample.primaryEvidenceCount > 0, `${label}.samples.primaryEvidenceCount must be positive`);
    assert(Number.isInteger(sample.citedPrimaryEvidenceCount) && sample.citedPrimaryEvidenceCount >= sample.primaryEvidenceCount, `${label}.samples.citedPrimaryEvidenceCount must cover primary evidence`);
    assert(["PRIMARY_SINGLE_FILE", "PRIMARY_CROSS_FILE", "MIXED_PRIMARY_CONTEXT"].includes(sample.evidenceRoleDistributionStatus), `${label}.samples.evidenceRoleDistributionStatus must prove primary evidence`);
    assert(sample.claimCitationStatus === "READY", `${label}.samples.claimCitationStatus must be READY`);
    assert(Number.isInteger(sample.claimCoveragePercent) && sample.claimCoveragePercent >= 100, `${label}.samples.claimCoveragePercent must be at least 100`);
    assert(Number.isInteger(sample.requiredClaimCount) && sample.requiredClaimCount > 0, `${label}.samples.requiredClaimCount must be positive`);
    assert(Number.isInteger(sample.citedRequiredClaimCount) && sample.citedRequiredClaimCount >= sample.requiredClaimCount, `${label}.samples.citedRequiredClaimCount must cover required claims`);
    assert(sample.roleDistributionStatus === "PRIMARY_BOUND", `${label}.samples.roleDistributionStatus must be PRIMARY_BOUND`);
    assert(Number.isInteger(sample.requiredPrimaryBoundClaimCount) && sample.requiredPrimaryBoundClaimCount >= sample.requiredClaimCount, `${label}.samples.requiredPrimaryBoundClaimCount must cover required claims`);
    assert(Number.isInteger(sample.requiredPrimaryFileCount) && sample.requiredPrimaryFileCount > 0, `${label}.samples.requiredPrimaryFileCount must be positive`);
    assert(sample.groundingStatus === "VERIFIED", `${label}.samples.groundingStatus must be VERIFIED`);
    assert(["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_CITED"].includes(sample.citationEnforcementStatus), `${label}.samples.citationEnforcementStatus must prove successful citation enforcement`);
    assert(["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_PRIMARY_CITED"].includes(sample.citationEnforcementReason), `${label}.samples.citationEnforcementReason must prove successful citation enforcement reason`);
    assertRawRetrievedChunkContentAbsent(sample, `${label}.samples`);
    assert(sample.providerQualityClaim === false, `${label}.samples.providerQualityClaim must be false`);
    assert(sample.llmFactClaim === false, `${label}.samples.llmFactClaim must be false`);
    sampleFiles.add(sample.filePath);
    sampleSections.add(sample.sourceSection);
    sampleCitationEnforcementReasons.add(sample.citationEnforcementReason);
  }
  assert(
    value.citationEnforcementReasons.length === sampleCitationEnforcementReasons.size
      && value.citationEnforcementReasons.every((reason) => sampleCitationEnforcementReasons.has(reason)),
    `${label}.citationEnforcementReasons must exactly match samples.citationEnforcementReason`
  );
  assert(sampleFiles.size === value.uniqueFileCount, `${label}.uniqueFileCount must match samples`);
  assert(sampleSections.size === value.sourceSectionCount, `${label}.sourceSectionCount must match samples`);
  assert(value.samples.filter((sample) => sample.lineAnchorCitationBound === true).length === value.lineAnchorBoundSampleCount, `${label}.lineAnchorBoundSampleCount must match bound samples`);
  assert(value.samples.filter((sample) => sample.lineAnchorEvidenceReasonVisible === true).length === value.lineAnchorEvidenceReasonVisibleSampleCount, `${label}.lineAnchorEvidenceReasonVisibleSampleCount must match samples`);
  assert(value.samples.filter((sample) => sample.rawRetrievedChunkContentAbsent === true).length === value.rawRetrievedChunkContentAbsentSampleCount, `${label}.rawRetrievedChunkContentAbsentSampleCount must match samples`);
  assert(Math.max(...value.samples.map((sample) => sample.contentPreviewMaxLength)) === value.maxContentPreviewLength, `${label}.maxContentPreviewLength must match samples`);
  assert(observedLineNumberSamples === value.lineNumberSampleCount, `${label}.lineNumberSampleCount must match samples`);
  assert(observedStartEndOnlySamples === value.startEndOnlySampleCount, `${label}.startEndOnlySampleCount must match samples`);
  assert(observedLineNumberBoundSamples === value.lineNumberLineAnchorBoundSampleCount, `${label}.lineNumberLineAnchorBoundSampleCount must match bound samples`);
  assert(observedStartEndOnlyBoundSamples === value.startEndOnlyLineAnchorBoundSampleCount, `${label}.startEndOnlyLineAnchorBoundSampleCount must match bound samples`);
  assert(Math.min(...value.samples.map((sample) => sample.lineAnchorCitedCount)) === value.minLineAnchorCitedCount, `${label}.minLineAnchorCitedCount must match samples`);
  assert(Math.min(...value.samples.map((sample) => sample.lineAnchorPrimaryCitedCount)) === value.minLineAnchorPrimaryCitedCount, `${label}.minLineAnchorPrimaryCitedCount must match samples`);
  assert(value.samples.filter((sample) => sample.narrativeBound === true).length === value.narrativeBoundSampleCount, `${label}.narrativeBoundSampleCount must match bound samples`);
  assert(Math.min(...value.samples.map((sample) => sample.narrativeEvidenceRefFieldCount)) === value.minNarrativeEvidenceRefFieldCount, `${label}.minNarrativeEvidenceRefFieldCount must match samples`);
}

function assertEvidenceCombinationSummary(value, label, expectedScanTaskId) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "surface",
    "visible",
    "scanTaskId",
    "requestScanTaskId",
    "responseScanTaskId",
    "currentScanOnly",
    "resultCount",
    "visibleCardCount",
    "labels",
    "topSourceLabels",
    "primaryContextRoles",
    "minPrimaryCount",
    "minAdjacentContextCount",
    "minUniqueFileCount",
    "minEmbeddedEvidenceCount",
    "minNextQuestionCount",
    "sourceLabelsVisible",
    "filePathsVisible",
    "fileCoverageVisible",
    "rolePathVisible",
    "embeddingStateVisible",
    "topReferenceVisible",
    "derivedFromVisibleResults",
    "resultSetOnly",
    "providerQualityClaim",
    "llmFactClaim",
    "noHorizontalOverflow",
  ]), label);
  const forbiddenKeys = /url|query|hash|origin|host|requestPath|stack|prompt|answer|content|code|claimText|token|authorization|filePath|line/i;
  for (const key of Object.keys(value)) {
    if (key === "filePathsVisible") {
      continue;
    }
    assert(!forbiddenKeys.test(key), `${label}.${key} must not archive raw content, file paths, URLs, prompts or secrets`);
  }
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.surface === "PROJECT_QA_CODE_CHUNKS_SEARCH", `${label}.surface must be PROJECT_QA_CODE_CHUNKS_SEARCH`);
  assert(value.visible === true, `${label}.visible must be true`);
  assert(value.scanTaskId === expectedScanTaskId, `${label}.scanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.requestScanTaskId === expectedScanTaskId, `${label}.requestScanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.responseScanTaskId === expectedScanTaskId, `${label}.responseScanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.currentScanOnly === true, `${label}.currentScanOnly must be true`);
  assert(Number.isInteger(value.resultCount) && value.resultCount > 0, `${label}.resultCount must be positive`);
  assert(Number.isInteger(value.visibleCardCount) && value.visibleCardCount > 0, `${label}.visibleCardCount must be positive`);
  assertRequiredStringSet(value.labels, [], `${label}.labels`);
  assert(value.labels.length > 0, `${label}.labels must be non-empty`);
  const allowedLabels = new Set(["跨文件复核路径", "跨文件证据组合", "主证据路径", "主证据待复核", "上下文线索"]);
  assert(value.labels.every((entry) => allowedLabels.has(entry)), `${label}.labels contains an illegal label`);
  assertRequiredStringSet(value.topSourceLabels, [], `${label}.topSourceLabels`);
  assert(value.topSourceLabels.length > 0, `${label}.topSourceLabels must be non-empty`);
  assert(value.topSourceLabels.every((entry) => /^C[0-9]+$/.test(entry)), `${label}.topSourceLabels must be response-local C labels`);
  assertRequiredStringSet(value.primaryContextRoles, [], `${label}.primaryContextRoles`);
  assert(value.primaryContextRoles.length > 0, `${label}.primaryContextRoles must be non-empty`);
  const allowedPrimaryContextRoles = new Set(["PRIMARY", "UNKNOWN", ""]);
  assert(value.primaryContextRoles.every((entry) => allowedPrimaryContextRoles.has(entry)), `${label}.primaryContextRoles must describe primary or unknown top evidence`);
  assert(Number.isInteger(value.minPrimaryCount) && value.minPrimaryCount > 0, `${label}.minPrimaryCount must be positive`);
  assert(Number.isInteger(value.minAdjacentContextCount) && value.minAdjacentContextCount >= 0, `${label}.minAdjacentContextCount must be non-negative`);
  assert(Number.isInteger(value.minUniqueFileCount) && value.minUniqueFileCount > 0, `${label}.minUniqueFileCount must be positive`);
  assert(Number.isInteger(value.minEmbeddedEvidenceCount) && value.minEmbeddedEvidenceCount >= 0, `${label}.minEmbeddedEvidenceCount must be non-negative`);
  assert(Number.isInteger(value.minNextQuestionCount) && value.minNextQuestionCount >= 3, `${label}.minNextQuestionCount must be at least 3`);
  assert(value.sourceLabelsVisible === true, `${label}.sourceLabelsVisible must be true`);
  assert(value.filePathsVisible === true, `${label}.filePathsVisible must be true`);
  assert(value.fileCoverageVisible === true, `${label}.fileCoverageVisible must be true`);
  assert(value.rolePathVisible === true, `${label}.rolePathVisible must be true`);
  assert(value.embeddingStateVisible === true, `${label}.embeddingStateVisible must be true`);
  assert(value.topReferenceVisible === true, `${label}.topReferenceVisible must be true`);
  assert(value.derivedFromVisibleResults === true, `${label}.derivedFromVisibleResults must be true`);
  assert(value.resultSetOnly === true, `${label}.resultSetOnly must be true`);
  assert(value.providerQualityClaim === false, `${label}.providerQualityClaim must be false`);
  assert(value.llmFactClaim === false, `${label}.llmFactClaim must be false`);
  assert(value.noHorizontalOverflow === true, `${label}.noHorizontalOverflow must be true`);
}

function assertCodeUnderstandingLens(value, label, expectedScanTaskId, expectedEvidenceFile) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "surface",
    "visible",
    "scanTaskId",
    "requestScanTaskId",
    "responseScanTaskId",
    "responseStatus",
    "resultCount",
    "currentScanOnly",
    "inputKinds",
    "queryShapes",
    "primaryMatched",
    "sourceLabels",
    "primaryReferences",
    "primaryContextRoles",
    "evidenceTypes",
    "retrievalModes",
    "readiness",
    "readinessUsable",
    "targetFileMatchesExpected",
    "entryVisible",
    "primaryReferenceVisible",
    "currentScanVisible",
    "primaryEvidenceVisible",
    "sourceLabelVisible",
    "retrievalModeVisible",
    "readinessVisible",
    "locateSearchVisible",
    "explainHereVisible",
    "copyReferenceVisible",
    "derivedFromVisibleResults",
    "resultSetOnly",
    "rawAnswerStored",
    "rawQueryStored",
    "rawStackStored",
    "rawPromptStored",
    "providerQualityClaim",
    "llmFactClaim",
    "noHorizontalOverflow",
  ]), label);
  assertNoSensitiveMaterial(value, label);
  const forbiddenKeys = /url|queryText|hash|origin|host|requestPath|stack|prompt|answerText|content|code|token|authorization/i;
  for (const key of Object.keys(value)) {
    if (["rawAnswerStored", "rawQueryStored", "rawStackStored", "rawPromptStored"].includes(key)) {
      continue;
    }
    assert(!forbiddenKeys.test(key), `${label}.${key} must not archive raw URLs, prompts, stack traces, answers, code or secrets`);
  }
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.surface === "PROJECT_QA_CODE_UNDERSTANDING_LENS", `${label}.surface must be PROJECT_QA_CODE_UNDERSTANDING_LENS`);
  assert(value.visible === true, `${label}.visible must be true`);
  assert(value.scanTaskId === expectedScanTaskId, `${label}.scanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.requestScanTaskId === expectedScanTaskId, `${label}.requestScanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.responseScanTaskId === expectedScanTaskId, `${label}.responseScanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.responseStatus === 200, `${label}.responseStatus must be 200`);
  assert(Number.isInteger(value.resultCount) && value.resultCount > 0, `${label}.resultCount must be positive`);
  assert(value.currentScanOnly === true, `${label}.currentScanOnly must be true`);
  assertRequiredStringSet(value.inputKinds, ["FILE_LINE"], `${label}.inputKinds`);
  assert(value.inputKinds.every((kind) => ["FILE_LINE", "METHOD_ANCHOR", "STACK_TRACE"].includes(kind)), `${label}.inputKinds contains an illegal kind`);
  assertRequiredStringSet(value.queryShapes, ["file:line"], `${label}.queryShapes`);
  assert(value.queryShapes.every((shape) => ["file:line", "class#method", "stack-frame"].includes(shape)), `${label}.queryShapes contains an illegal shape`);
  assert(value.primaryMatched === true, `${label}.primaryMatched must be true`);
  assertRequiredStringSet(value.sourceLabels, [], `${label}.sourceLabels`);
  assert(value.sourceLabels.length > 0 && value.sourceLabels.every((entry) => /^C[0-9]+$/.test(entry)), `${label}.sourceLabels must be response-local C labels`);
  assertRequiredStringSet(value.primaryReferences, [], `${label}.primaryReferences`);
  assert(value.primaryReferences.length > 0, `${label}.primaryReferences must be non-empty`);
  for (const reference of value.primaryReferences) {
    const match = reference.match(/^(.+):([1-9][0-9]*)-([1-9][0-9]*)$/);
    assert(match, `${label}.primaryReferences entries must be safe/path:start-end`);
    const filePath = match[1];
    const startLine = Number(match[2]);
    const endLine = Number(match[3]);
    assertSafeEvidencePath(filePath, `${label}.primaryReferences.path`);
    assert(filePath === expectedEvidenceFile || filePath.endsWith(`/${expectedEvidenceFile}`) || expectedEvidenceFile.endsWith(`/${filePath}`), `${label}.primaryReferences path must match expected evidence file`);
    assert(endLine >= startLine, `${label}.primaryReferences end line must be >= start line`);
  }
  assertRequiredStringSet(value.primaryContextRoles, ["PRIMARY"], `${label}.primaryContextRoles`);
  assert(value.primaryContextRoles.every((role) => ["PRIMARY"].includes(role)), `${label}.primaryContextRoles must be PRIMARY`);
  assertRequiredStringSet(value.evidenceTypes, [], `${label}.evidenceTypes`);
  assert(value.evidenceTypes.length > 0, `${label}.evidenceTypes must be non-empty`);
  const allowedUiRetrievalModes = new Set(["KEYWORD", "HYBRID", "SEMANTIC_FALLBACK", "STABLE_FALLBACK"]);
  assertRequiredStringSet(value.retrievalModes, [], `${label}.retrievalModes`);
  assert(value.retrievalModes.length > 0 && value.retrievalModes.every((mode) => allowedUiRetrievalModes.has(mode)), `${label}.retrievalModes contains an illegal mode`);
  assertRequiredStringSet(value.readiness, [], `${label}.readiness`);
  assert(value.readiness.length > 0 && value.readiness.every((status) => ["READY", "REVIEW"].includes(status)), `${label}.readiness must be READY/REVIEW`);
  assert(value.readinessUsable === true, `${label}.readinessUsable must be true`);
  assert(value.targetFileMatchesExpected === true, `${label}.targetFileMatchesExpected must be true`);
  for (const field of ["entryVisible", "primaryReferenceVisible", "currentScanVisible", "primaryEvidenceVisible", "sourceLabelVisible", "retrievalModeVisible", "readinessVisible", "locateSearchVisible", "explainHereVisible", "copyReferenceVisible", "derivedFromVisibleResults", "resultSetOnly", "noHorizontalOverflow"]) {
    assert(value[field] === true, `${label}.${field} must be true`);
  }
  for (const field of ["rawAnswerStored", "rawQueryStored", "rawStackStored", "rawPromptStored", "providerQualityClaim", "llmFactClaim"]) {
    assert(value[field] === false, `${label}.${field} must be false`);
  }
}

function assertQaEvidenceHandoff(value, label, expectedScanTaskId) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertNoSensitiveMaterial(value, label);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "surface",
    "visible",
    "sourceBridgeVisible",
    "answerSourceReceiptVisible",
    "scanTaskId",
    "requestScanTaskId",
    "responseScanTaskId",
    "requestBound",
    "responseBound",
    "contextVisible",
    "sourceEvidenceMatchTypes",
    "lineAnchorVisible",
    "sourceLocationConfidenceVisible",
    "sourceLocationConfidenceReadyVisible",
    "titleVisible",
    "categoryVisible",
    "sourceVisible",
    "fileReferenceVisible",
    "scanLabelVisible",
    "readyForAutoRepair",
    "repairCandidateActionVisible",
    "autoRepairDraftUrlBound",
    "sourceTypes",
    "repositoryIdBound",
    "scanTaskIdBound",
    "fileBoundToEvidence",
    "citationIdBound",
    "chunkIdBound",
    "sourceEvidenceParamsBound",
    "candidateFormOpened",
    "candidateFormScanVisible",
    "candidateFormFilePrefilled",
    "candidateTargetDescBound",
    "noRawPromptOrAnswer",
    "providerQualityClaim",
    "llmFactClaim",
    "noHorizontalOverflow",
  ]), label);
  const forbiddenKeys = /url|query|hash|origin|host|requestPath|stack|prompt|answer|content|code|claimText|token|authorization|filePath|lineNumber/i;
  for (const key of Object.keys(value)) {
    if (key === "answerSourceReceiptVisible" || key === "autoRepairDraftUrlBound" || key === "noRawPromptOrAnswer") {
      continue;
    }
    assert(!forbiddenKeys.test(key), `${label}.${key} must not archive raw content, file paths, URLs, prompts or secrets`);
  }
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.surface === "PROJECT_QA_REPORT_EVIDENCE_HANDOFF", `${label}.surface must be PROJECT_QA_REPORT_EVIDENCE_HANDOFF`);
  assert(value.visible === true, `${label}.visible must be true`);
  assert(value.sourceBridgeVisible === true, `${label}.sourceBridgeVisible must be true`);
  assert(value.answerSourceReceiptVisible === true, `${label}.answerSourceReceiptVisible must be true`);
  assert(value.scanTaskId === expectedScanTaskId, `${label}.scanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.requestScanTaskId === expectedScanTaskId, `${label}.requestScanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.responseScanTaskId === expectedScanTaskId, `${label}.responseScanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.requestBound === true, `${label}.requestBound must be true`);
  assert(value.responseBound === true, `${label}.responseBound must be true`);
  assert(value.contextVisible === true, `${label}.contextVisible must be true`);
  assertRequiredStringSet(value.sourceEvidenceMatchTypes, ["REPORT_LINE_ANCHOR"], `${label}.sourceEvidenceMatchTypes`);
  assert(value.lineAnchorVisible === true, `${label}.lineAnchorVisible must be true`);
  assert(value.sourceLocationConfidenceVisible === true, `${label}.sourceLocationConfidenceVisible must be true`);
  assert(value.sourceLocationConfidenceReadyVisible === true, `${label}.sourceLocationConfidenceReadyVisible must be true`);
  assert(value.titleVisible === true, `${label}.titleVisible must be true`);
  assert(value.categoryVisible === true, `${label}.categoryVisible must be true`);
  assert(value.sourceVisible === true, `${label}.sourceVisible must be true`);
  assert(value.fileReferenceVisible === true, `${label}.fileReferenceVisible must be true`);
  assert(value.scanLabelVisible === true, `${label}.scanLabelVisible must be true`);
  assert(value.readyForAutoRepair === true, `${label}.readyForAutoRepair must be true`);
  assert(value.repairCandidateActionVisible === true, `${label}.repairCandidateActionVisible must be true`);
  assert(value.autoRepairDraftUrlBound === true, `${label}.autoRepairDraftUrlBound must be true`);
  assertRequiredStringSet(value.sourceTypes, ["PROJECT_QA_VERIFIED_CITATION"], `${label}.sourceTypes`);
  assert(value.repositoryIdBound === true, `${label}.repositoryIdBound must be true`);
  assert(value.scanTaskIdBound === true, `${label}.scanTaskIdBound must be true`);
  assert(value.fileBoundToEvidence === true, `${label}.fileBoundToEvidence must be true`);
  assert(value.citationIdBound === true, `${label}.citationIdBound must be true`);
  assert(value.chunkIdBound === true, `${label}.chunkIdBound must be true`);
  assert(value.sourceEvidenceParamsBound === true, `${label}.sourceEvidenceParamsBound must be true`);
  assert(value.candidateFormOpened === true, `${label}.candidateFormOpened must be true`);
  assert(value.candidateFormScanVisible === true, `${label}.candidateFormScanVisible must be true`);
  assert(value.candidateFormFilePrefilled === true, `${label}.candidateFormFilePrefilled must be true`);
  assert(value.candidateTargetDescBound === true, `${label}.candidateTargetDescBound must be true`);
  assert(value.noRawPromptOrAnswer === true, `${label}.noRawPromptOrAnswer must be true`);
  assert(value.providerQualityClaim === false, `${label}.providerQualityClaim must be false`);
  assert(value.llmFactClaim === false, `${label}.llmFactClaim must be false`);
  assert(value.noHorizontalOverflow === true, `${label}.noHorizontalOverflow must be true`);
}

function assertSourceFileMatchRelease(value, label, expectedScanTaskId, qaFromEvidence) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertNoSensitiveMaterial(value, label);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "surface",
    "visible",
    "scanTaskId",
    "requestScanTaskId",
    "responseScanTaskId",
    "currentScanOnly",
    "releaseState",
    "reportTargetVisible",
    "citedSliceVisible",
    "reportTargetLineVisible",
    "sourceEvidenceMatchTypes",
    "lineAnchorVisible",
    "pathMatchType",
    "fileNameOnlyReviewVisible",
    "requiredEvidenceCovered",
    "primaryClaimBound",
    "readyForAutoRepair",
    "nextActionKey",
    "riskNoticeVisible",
    "sourceBindingOnlyNoticeVisible",
    "noRawPromptOrAnswer",
    "providerQualityClaim",
    "llmFactClaim",
    "noHorizontalOverflow",
  ]), label);
  const forbiddenKeys = /url|query|hash|origin|host|requestPath|stack|prompt|answer|content|code|claimText|token|authorization|filePath|lineNumber/i;
  for (const key of Object.keys(value)) {
    if (key === "noRawPromptOrAnswer") {
      continue;
    }
    assert(!forbiddenKeys.test(key), `${label}.${key} must not archive raw content, file paths, URLs, prompts or secrets`);
  }
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.surface === "PROJECT_QA_SOURCE_FILE_MATCH_RELEASE", `${label}.surface must be PROJECT_QA_SOURCE_FILE_MATCH_RELEASE`);
  assert(value.visible === true, `${label}.visible must be true`);
  assert(value.scanTaskId === expectedScanTaskId, `${label}.scanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.requestScanTaskId === expectedScanTaskId, `${label}.requestScanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.responseScanTaskId === expectedScanTaskId, `${label}.responseScanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.currentScanOnly === true, `${label}.currentScanOnly must be true`);
  assert(value.releaseState === "READY", `${label}.releaseState must be READY`);
  assert(value.reportTargetVisible === true, `${label}.reportTargetVisible must be true`);
  assert(value.citedSliceVisible === true, `${label}.citedSliceVisible must be true`);
  assert(value.reportTargetLineVisible === true, `${label}.reportTargetLineVisible must be true`);
  assertRequiredStringSet(value.sourceEvidenceMatchTypes, ["REPORT_LINE_ANCHOR"], `${label}.sourceEvidenceMatchTypes`);
  assert(value.sourceEvidenceMatchTypes.every((entry) => entry === "REPORT_LINE_ANCHOR"), `${label}.sourceEvidenceMatchTypes must only contain REPORT_LINE_ANCHOR`);
  assert(value.lineAnchorVisible === true, `${label}.lineAnchorVisible must be true`);
  assert(value.pathMatchType === "PATH_SUFFIX", `${label}.pathMatchType must be PATH_SUFFIX`);
  assert(value.fileNameOnlyReviewVisible === false, `${label}.fileNameOnlyReviewVisible must be false`);
  assert(value.requiredEvidenceCovered === true, `${label}.requiredEvidenceCovered must be true`);
  assert(value.primaryClaimBound === true, `${label}.primaryClaimBound must be true`);
  assert(value.readyForAutoRepair === true, `${label}.readyForAutoRepair must be true`);
  assert(value.nextActionKey === "AUTO_REPAIR_REVIEW", `${label}.nextActionKey must be AUTO_REPAIR_REVIEW`);
  assert(value.riskNoticeVisible === true, `${label}.riskNoticeVisible must be true`);
  assert(value.sourceBindingOnlyNoticeVisible === true, `${label}.sourceBindingOnlyNoticeVisible must be true`);
  assert(value.noRawPromptOrAnswer === true, `${label}.noRawPromptOrAnswer must be true`);
  assert(value.providerQualityClaim === false, `${label}.providerQualityClaim must be false`);
  assert(value.llmFactClaim === false, `${label}.llmFactClaim must be false`);
  assert(value.noHorizontalOverflow === true, `${label}.noHorizontalOverflow must be true`);

  const coverage = qaFromEvidence.citationCoverage || {};
  const claimCoverage = qaFromEvidence.claimCitationCoverage || {};
  const claimRoleDistribution = claimCoverage.roleDistribution || {};
  const handoff = qaFromEvidence.evidenceHandoff || {};
  const crossFileSummary = qaFromEvidence.crossFileCitationSummary || {};
  assert(qaFromEvidence.evidenceRef && qaFromEvidence.evidenceRef.requestBound === true, `${label} must be backed by a request-bound evidenceRef`);
  assert(qaFromEvidence.evidenceRef.responseBound === true, `${label} must be backed by a response-bound evidenceRef`);
  assert(qaFromEvidence.evidenceRef.contextVisible === true, `${label} must be backed by visible evidence context`);
  assert(handoff.sourceLocationConfidenceVisible === true, `${label} must agree with visible source-location confidence`);
  assert(handoff.sourceLocationConfidenceReadyVisible === true, `${label} must agree with ready source-location confidence`);
  assert(handoff.readyForAutoRepair === true, `${label} must agree with AutoRepair handoff readiness`);
  assert(Number.isInteger(coverage.minRequiredEvidenceCoveragePercent) && coverage.minRequiredEvidenceCoveragePercent >= 100, `${label} must agree with required evidence coverage`);
  assert(Number.isInteger(coverage.minRequiredEvidenceCount) && coverage.minRequiredEvidenceCount > 0, `${label} must agree with required evidence count`);
  assert(Number.isInteger(coverage.minCitedRequiredEvidenceCount) && coverage.minCitedRequiredEvidenceCount >= coverage.minRequiredEvidenceCount, `${label} must agree with cited required evidence count`);
  assert(claimCoverage.statuses && claimCoverage.statuses.includes("READY"), `${label} must agree with ready claim citation coverage`);
  assert(claimCoverage.readyForRepair === true, `${label} must agree with repair-ready claim citation coverage`);
  assertRequiredStringSet(claimCoverage.readinessReasons, ["PRIMARY_BOUND_READY"], `${label}.claimCitationCoverage.readinessReasons`);
  assert(claimCoverage.readinessReasons.length === 1, `${label}.claimCitationCoverage.readinessReasons must contain only PRIMARY_BOUND_READY`);
  assert(claimRoleDistribution.statuses && claimRoleDistribution.statuses.includes("PRIMARY_BOUND"), `${label} must agree with PRIMARY-bound claim role distribution`);
  assert(Number.isInteger(claimCoverage.minRequiredClaimCount) && claimCoverage.minRequiredClaimCount > 0, `${label} must agree with required claim count`);
  assert(Number.isInteger(claimRoleDistribution.minRequiredPrimaryBoundClaimCount) && claimRoleDistribution.minRequiredPrimaryBoundClaimCount >= claimCoverage.minRequiredClaimCount, `${label} must agree with PRIMARY-bound required claims`);
  assert(crossFileSummary.sourceEvidenceMatchTypes && crossFileSummary.sourceEvidenceMatchTypes.includes("REPORT_LINE_ANCHOR"), `${label} must agree with cross-file source evidence match type`);
}

function assertPublicRepoUiRelationAwareEvidenceReason(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertNoSensitiveMaterial(value, label);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "surface",
    "marker",
    "proofCount",
    "minCitationReasonCount",
    "minRetrievedChunkReasonCount",
    "adjacentContextReasonVisible",
    "citedPrimaryStillPresent",
    "uiReasonVisible",
    "providerQualityClaim",
    "llmFactClaim",
  ]), label);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.surface === "PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON", `${label}.surface must prove public repo UI relation-aware evidence reason`);
  assert(value.marker === "Graph relation:", `${label}.marker must prove graph relation evidence reason`);
  assert(Number.isInteger(value.proofCount) && value.proofCount >= 1, `${label}.proofCount must be positive`);
  assert(Number.isInteger(value.minCitationReasonCount) && value.minCitationReasonCount >= 0, `${label}.minCitationReasonCount must be a non-negative integer`);
  assert(Number.isInteger(value.minRetrievedChunkReasonCount) && value.minRetrievedChunkReasonCount >= 0, `${label}.minRetrievedChunkReasonCount must be a non-negative integer`);
  assert(value.minCitationReasonCount + value.minRetrievedChunkReasonCount > 0, `${label} must prove Graph relation from citations or retrieved chunks`);
  assert(value.adjacentContextReasonVisible === true, `${label}.adjacentContextReasonVisible must be true`);
  assert(value.citedPrimaryStillPresent === true, `${label}.citedPrimaryStillPresent must be true`);
  assert(value.uiReasonVisible === true, `${label}.uiReasonVisible must be true`);
  assert(value.providerQualityClaim === false, `${label}.providerQualityClaim must be false`);
  assert(value.llmFactClaim === false, `${label}.llmFactClaim must be false`);
}

function assertPublicRepoUiSourceLocationReadability(value, label, qaFromEvidence) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertNoSensitiveMaterial(value, label);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "surface",
    "proofCount",
    "mobile390Covered",
    "narrow320Covered",
    "sourceReceipt",
    "sourceLocationConfidence",
    "sourceFileMatchRelease",
    "noHorizontalOverflow",
    "providerQualityClaim",
    "llmFactClaim",
  ]), label);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.surface === "PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY", `${label}.surface must be PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY`);
  assert(Number.isInteger(value.proofCount) && value.proofCount >= 6, `${label}.proofCount must cover ready/review proofs for three viewports`);
  assert(value.mobile390Covered === true, `${label}.mobile390Covered must be true`);
  assert(value.narrow320Covered === true, `${label}.narrow320Covered must be true`);

  const sourceReceipt = value.sourceReceipt;
  assert(sourceReceipt && typeof sourceReceipt === "object" && !Array.isArray(sourceReceipt), `${label}.sourceReceipt must be an object`);
  assertAllowedObjectKeys(sourceReceipt, new Set(["readyContained", "reviewContained", "referenceWraps", "titleNotClipped", "tagsNotClipped"]), `${label}.sourceReceipt`);
  for (const key of ["readyContained", "reviewContained", "referenceWraps", "titleNotClipped", "tagsNotClipped"]) {
    assert(sourceReceipt[key] === true, `${label}.sourceReceipt.${key} must be true`);
  }

  const confidence = value.sourceLocationConfidence;
  assert(confidence && typeof confidence === "object" && !Array.isArray(confidence), `${label}.sourceLocationConfidence must be an object`);
  assertAllowedObjectKeys(confidence, new Set(["readyContained", "reviewContained", "metricsNotClipped", "checksWrap"]), `${label}.sourceLocationConfidence`);
  for (const key of ["readyContained", "reviewContained", "metricsNotClipped", "checksWrap"]) {
    assert(confidence[key] === true, `${label}.sourceLocationConfidence.${key} must be true`);
  }

  const release = value.sourceFileMatchRelease;
  assert(release && typeof release === "object" && !Array.isArray(release), `${label}.sourceFileMatchRelease must be an object`);
  assertAllowedObjectKeys(release, new Set(["readyContained", "reviewContained", "targetReferenceNotClipped", "citedReferenceNotClipped", "checksNotClipped", "noRepairOnReview"]), `${label}.sourceFileMatchRelease`);
  for (const key of ["readyContained", "reviewContained", "targetReferenceNotClipped", "citedReferenceNotClipped", "checksNotClipped", "noRepairOnReview"]) {
    assert(release[key] === true, `${label}.sourceFileMatchRelease.${key} must be true`);
  }

  assert(value.noHorizontalOverflow === true, `${label}.noHorizontalOverflow must be true`);
  assert(value.providerQualityClaim === false, `${label}.providerQualityClaim must be false`);
  assert(value.llmFactClaim === false, `${label}.llmFactClaim must be false`);

  const handoff = qaFromEvidence.evidenceHandoff || {};
  const sourceFileMatchRelease = qaFromEvidence.sourceFileMatchRelease || {};
  const fileAnchorDrift = qaFromEvidence.fileAnchorDrift || {};
  assert(handoff.sourceLocationConfidenceVisible === true, `${label} must agree with visible source-location confidence`);
  assert(handoff.sourceLocationConfidenceReadyVisible === true, `${label} must agree with ready source-location confidence`);
  assert(sourceFileMatchRelease.lineAnchorVisible === true, `${label} must agree with line-anchor source file match release`);
  assert(sourceFileMatchRelease.sourceEvidenceMatchTypes && sourceFileMatchRelease.sourceEvidenceMatchTypes.includes("REPORT_LINE_ANCHOR"), `${label} must agree with REPORT_LINE_ANCHOR ready path`);
  assert(fileAnchorDrift.sourceLocationConfidenceReviewVisible === true, `${label} must agree with review source-location confidence`);
  assert(fileAnchorDrift.sourceEvidenceMatchTypes && fileAnchorDrift.sourceEvidenceMatchTypes.includes("REPORT_FILE_ANCHOR"), `${label} must agree with REPORT_FILE_ANCHOR review path`);
  assert(fileAnchorDrift.latestNextActionRepairHidden === true, `${label} must agree with hidden repair action on file-anchor drift`);
  assert(fileAnchorDrift.latestCitationRepairHidden === true, `${label} must agree with hidden citation repair action on file-anchor drift`);
}

function assertPublicRepoUiFileAnchorDrift(value, label, expectedScanTaskId) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertNoSensitiveMaterial(value, label);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "surface",
    "scanTaskId",
    "requestScanTaskId",
    "responseScanTaskId",
    "currentScanOnly",
    "requestCount",
    "responseStatus",
    "resultCount",
    "citationCount",
    "sourceEvidenceMatchTypes",
    "citationCoverage",
    "claimCitationCoverage",
    "groundingStatuses",
	    "citationEnforcementStatuses",
	    "repairEvidenceGateBlockedVisible",
	    "trustSummaryBlockedVisible",
	    "crossFileSummaryContextGapVisible",
	    "sourceLocationConfidenceReviewVisible",
    "latestNextActionRepairHidden",
    "latestCitationRepairHidden",
    "evidenceRefRequestBound",
    "evidenceRefResponseBound",
    "rawAnswerStored",
    "rawPromptStored",
    "providerQualityClaim",
    "llmFactClaim",
    "noHorizontalOverflow",
    "llmSetup",
    "llmCleanup",
  ]), label);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.surface === "PUBLIC_REPO_UI_FILE_ANCHOR_DRIFT", `${label}.surface must prove public repo UI file-anchor drift`);
  assert(value.scanTaskId === expectedScanTaskId, `${label}.scanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.requestScanTaskId === expectedScanTaskId, `${label}.requestScanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.responseScanTaskId === expectedScanTaskId, `${label}.responseScanTaskId must match PUBLIC_REPO_UI_SMOKE_OK scanTaskId`);
  assert(value.currentScanOnly === true, `${label}.currentScanOnly must be true`);
  assert(Number.isInteger(value.requestCount) && value.requestCount > 0, `${label}.requestCount must be positive`);
  assert(value.responseStatus === 200, `${label}.responseStatus must be 200`);
  assert(Number.isInteger(value.resultCount) && value.resultCount > 0, `${label}.resultCount must be positive`);
  assert(Number.isInteger(value.citationCount) && value.citationCount > 0, `${label}.citationCount must be positive`);
  assertRequiredStringSet(value.sourceEvidenceMatchTypes, ["REPORT_FILE_ANCHOR"], `${label}.sourceEvidenceMatchTypes`);
  assert(value.sourceEvidenceMatchTypes.length === 1, `${label}.sourceEvidenceMatchTypes must contain only REPORT_FILE_ANCHOR`);
  assertRequiredStringSet(value.groundingStatuses, ["PARTIAL"], `${label}.groundingStatuses`);
  assert(value.groundingStatuses.length === 1, `${label}.groundingStatuses must contain only PARTIAL`);
  assertRequiredStringSet(value.citationEnforcementStatuses, ["RETRY_FAILED"], `${label}.citationEnforcementStatuses`);
  assert(value.citationEnforcementStatuses.length === 1, `${label}.citationEnforcementStatuses must contain only RETRY_FAILED`);

  const citationCoverage = value.citationCoverage;
  assert(citationCoverage && typeof citationCoverage === "object" && !Array.isArray(citationCoverage), `${label}.citationCoverage must be an object`);
  assertRequiredStringSet(citationCoverage.statuses, [], `${label}.citationCoverage.statuses`);
  assert(citationCoverage.statuses.length > 0 && citationCoverage.statuses.every((status) => ["FULL", "REQUIRED_FULL", "PARTIAL"].includes(status)), `${label}.citationCoverage.statuses must be FULL/REQUIRED_FULL/PARTIAL`);
  assertRequiredStringSet(citationCoverage.coverageScopes, ["ALL"], `${label}.citationCoverage.coverageScopes`);
  assert(citationCoverage.coverageScopes.length === 1, `${label}.citationCoverage.coverageScopes must contain only ALL`);
  assert(Number.isInteger(citationCoverage.maxPrimaryEvidenceCount) && citationCoverage.maxPrimaryEvidenceCount === 0, `${label}.citationCoverage.maxPrimaryEvidenceCount must be 0`);
  assert(Number.isInteger(citationCoverage.minContextEvidenceCount) && citationCoverage.minContextEvidenceCount > 0, `${label}.citationCoverage.minContextEvidenceCount must be positive`);
  assert(Number.isInteger(citationCoverage.maxRepairCandidateCount) && citationCoverage.maxRepairCandidateCount === 0, `${label}.citationCoverage.maxRepairCandidateCount must be 0`);
  assert(citationCoverage.evidenceRoleDistribution && typeof citationCoverage.evidenceRoleDistribution === "object" && !Array.isArray(citationCoverage.evidenceRoleDistribution), `${label}.citationCoverage.evidenceRoleDistribution must be an object`);
  assertRequiredStringSet(citationCoverage.evidenceRoleDistribution.statuses, ["CONTEXT_ONLY"], `${label}.citationCoverage.evidenceRoleDistribution.statuses`);
  assert(citationCoverage.evidenceRoleDistribution.statuses.length === 1, `${label}.citationCoverage.evidenceRoleDistribution.statuses must contain only CONTEXT_ONLY`);

  const claimCoverage = value.claimCitationCoverage;
  assert(claimCoverage && typeof claimCoverage === "object" && !Array.isArray(claimCoverage), `${label}.claimCitationCoverage must be an object`);
  assertRequiredStringSet(claimCoverage.statuses, ["READY"], `${label}.claimCitationCoverage.statuses`);
  assert(claimCoverage.statuses.length === 1, `${label}.claimCitationCoverage.statuses must contain only READY`);
  assert(claimCoverage.readyForRepair === false, `${label}.claimCitationCoverage.readyForRepair must be false`);
  assertRequiredStringSet(claimCoverage.readinessReasons, ["CONTEXT_ONLY_CLAIM"], `${label}.claimCitationCoverage.readinessReasons`);
  assert(claimCoverage.readinessReasons.length === 1, `${label}.claimCitationCoverage.readinessReasons must contain only CONTEXT_ONLY_CLAIM`);
  assert(Number.isInteger(claimCoverage.minRequiredClaimCount) && claimCoverage.minRequiredClaimCount > 0, `${label}.claimCitationCoverage.minRequiredClaimCount must be positive`);
  assert(Number.isInteger(claimCoverage.minCitedRequiredClaimCount) && claimCoverage.minCitedRequiredClaimCount > 0, `${label}.claimCitationCoverage.minCitedRequiredClaimCount must be positive`);
  assert(claimCoverage.roleDistribution && typeof claimCoverage.roleDistribution === "object" && !Array.isArray(claimCoverage.roleDistribution), `${label}.claimCitationCoverage.roleDistribution must be an object`);
  assertRequiredStringSet(claimCoverage.roleDistribution.statuses, ["CONTEXT_ONLY"], `${label}.claimCitationCoverage.roleDistribution.statuses`);
  assert(claimCoverage.roleDistribution.statuses.length === 1, `${label}.claimCitationCoverage.roleDistribution.statuses must contain only CONTEXT_ONLY`);
  assert(Number.isInteger(claimCoverage.roleDistribution.maxRequiredPrimaryBoundClaimCount) && claimCoverage.roleDistribution.maxRequiredPrimaryBoundClaimCount === 0, `${label}.claimCitationCoverage.roleDistribution.maxRequiredPrimaryBoundClaimCount must be 0`);
  assert(Number.isInteger(claimCoverage.roleDistribution.maxRequiredPrimaryFileCount) && claimCoverage.roleDistribution.maxRequiredPrimaryFileCount === 0, `${label}.claimCitationCoverage.roleDistribution.maxRequiredPrimaryFileCount must be 0`);
  assert(Number.isInteger(claimCoverage.roleDistribution.minRequiredContextOnlyClaimCount) && claimCoverage.roleDistribution.minRequiredContextOnlyClaimCount > 0, `${label}.claimCitationCoverage.roleDistribution.minRequiredContextOnlyClaimCount must be positive`);

	  assert(value.repairEvidenceGateBlockedVisible === true, `${label}.repairEvidenceGateBlockedVisible must be true`);
	  assert(value.trustSummaryBlockedVisible === true, `${label}.trustSummaryBlockedVisible must be true`);
	  assert(value.crossFileSummaryContextGapVisible === true, `${label}.crossFileSummaryContextGapVisible must be true`);
  assert(value.sourceLocationConfidenceReviewVisible === true, `${label}.sourceLocationConfidenceReviewVisible must be true`);
  assert(value.latestNextActionRepairHidden === true, `${label}.latestNextActionRepairHidden must be true`);
  assert(value.latestCitationRepairHidden === true, `${label}.latestCitationRepairHidden must be true`);
  assert(value.evidenceRefRequestBound === true, `${label}.evidenceRefRequestBound must be true`);
  assert(value.evidenceRefResponseBound === true, `${label}.evidenceRefResponseBound must be true`);
  assert(value.rawAnswerStored === false, `${label}.rawAnswerStored must be false`);
  assert(value.rawPromptStored === false, `${label}.rawPromptStored must be false`);
  for (const field of ["rawAnswer", "rawPrompt", "content", "stack", "log", "sourceContent"]) {
    assert(!Object.prototype.hasOwnProperty.call(value, field), `${label} must not contain ${field}`);
  }
  assert(value.providerQualityClaim === false, `${label}.providerQualityClaim must be false`);
  assert(value.llmFactClaim === false, `${label}.llmFactClaim must be false`);
  assert(value.noHorizontalOverflow === true, `${label}.noHorizontalOverflow must be true`);
  assert(value.llmSetup && value.llmSetup.status === "OK", `${label}.llmSetup.status must be OK`);
  assert(value.llmCleanup && value.llmCleanup.status === "OK", `${label}.llmCleanup.status must be OK`);
}

function assertSafeEvidenceFile(value, label) {
  assert(typeof value === "string" && value.trim(), `${label} must be a non-empty string`);
  assert(value === value.trim(), `${label} must not have surrounding whitespace`);
  assert(!/[\\/\x00-\x1f\x7f]/.test(value), `${label} must be a safe basename`);
  assert(value !== "." && value !== ".." && !value.includes(".."), `${label} must not contain path traversal`);
}

function assertSafeEvidencePath(value, label) {
  assert(typeof value === "string" && value.trim(), `${label} must be a non-empty string`);
  assert(value === value.trim(), `${label} must not have surrounding whitespace`);
  assert(!/[\\\x00-\x1f\x7f]/.test(value), `${label} must be a safe relative path`);
  assert(!value.startsWith("/") && !/^[A-Za-z]:/.test(value), `${label} must not be absolute`);
  assert(!/[?#]/.test(value), `${label} must not include URL query or fragment`);
  assert(value.split("/").every((part) => part && part !== "." && part !== ".."), `${label} must not contain path traversal`);
}

function assertCodeUnderstandingRange(value, methodLine, label, startField = "matchedStartLine", endField = "matchedEndLine") {
  assert(Number.isInteger(value[startField]) && value[startField] > 0, `${label}.${startField} must be a positive integer`);
  assert(Number.isInteger(value[endField]) && value[endField] >= value[startField], `${label}.${endField} must be >= ${startField}`);
  assert(value[startField] <= methodLine && methodLine <= value[endField], `${label} range must cover anchor.methodLine`);
}

function assertCodeUnderstandingFixture(value, parentPayload) {
  const label = "PUBLIC_REPO_SMOKE_OK codeUnderstandingFixture";
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertAllowedObjectKeys(value, new Set([
    "contractVersion",
    "status",
    "probeKind",
    "projectId",
    "scanTaskId",
    "source",
    "anchor",
    "methodSearch",
    "stackTraceSearch",
    "codeQa",
    "currentScanOnly",
    "noRawPromptOrAnswer",
    "providerQualityClaim",
    "llmFactClaim",
  ]), label);
  assert(value.contractVersion === 1, `${label}.contractVersion must be 1`);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.probeKind === "METHOD_ANCHOR_STACK_TRACE", `${label}.probeKind must be METHOD_ANCHOR_STACK_TRACE`);
  assert(value.projectId === parentPayload.projectId, `${label}.projectId must match PUBLIC_REPO_SMOKE_OK projectId`);
  assert(value.scanTaskId === parentPayload.scanTaskId, `${label}.scanTaskId must match PUBLIC_REPO_SMOKE_OK scanTaskId`);
  assert(["DB_SYMBOL", "API_CHUNK"].includes(value.source), `${label}.source must be DB_SYMBOL or API_CHUNK`);
  assert(value.currentScanOnly === true, `${label}.currentScanOnly must be true`);
  assert(value.noRawPromptOrAnswer === true, `${label}.noRawPromptOrAnswer must be true`);
  assert(value.providerQualityClaim === false, `${label}.providerQualityClaim must be false`);
  assert(value.llmFactClaim === false, `${label}.llmFactClaim must be false`);
  for (const field of ["rawPrompt", "rawAnswer", "content", "sourceContent", "token", "password", "secret", "query", "stackQuery", "url", "host", "origin"]) {
    assert(!Object.prototype.hasOwnProperty.call(value, field), `${label} must not contain ${field}`);
  }

  const anchor = value.anchor;
  assert(anchor && typeof anchor === "object" && !Array.isArray(anchor), `${label}.anchor must be an object`);
  assertAllowedObjectKeys(anchor, new Set(["language", "filePath", "className", "methodName", "methodLine", "startLine", "endLine"]), `${label}.anchor`);
  assert(anchor.language === "Java", `${label}.anchor.language must be Java`);
  assertSafeEvidencePath(anchor.filePath, `${label}.anchor.filePath`);
  assert(typeof anchor.className === "string" && anchor.className.trim(), `${label}.anchor.className must be present`);
  assert(typeof anchor.methodName === "string" && anchor.methodName.trim(), `${label}.anchor.methodName must be present`);
  assert(Number.isInteger(anchor.methodLine) && anchor.methodLine > 0, `${label}.anchor.methodLine must be positive`);
  assert(Number.isInteger(anchor.startLine) && anchor.startLine > 0, `${label}.anchor.startLine must be positive`);
  assert(Number.isInteger(anchor.endLine) && anchor.endLine >= anchor.startLine, `${label}.anchor.endLine must be >= startLine`);
  assert(anchor.startLine <= anchor.methodLine && anchor.methodLine <= anchor.endLine, `${label}.anchor.methodLine must be inside anchor range`);

  const allowedEvidenceTypes = new Set(["SOURCE", "CONTROLLER", "SERVICE", "DATA_ACCESS", "CONFIG", "TEST", "DOCUMENTATION"]);
  function assertSearchSurface(search, surfaceLabel, expectedShape) {
    assert(search && typeof search === "object" && !Array.isArray(search), `${surfaceLabel} must be an object`);
    assertAllowedObjectKeys(search, new Set([
      "queryShape",
      "responseScanTaskId",
      "resultCount",
      "matchedFile",
      "matchedStartLine",
      "matchedEndLine",
      "matchedEvidenceType",
    ]), surfaceLabel);
    assert(search.queryShape === expectedShape, `${surfaceLabel}.queryShape must be ${expectedShape}`);
    assert(search.responseScanTaskId === parentPayload.scanTaskId, `${surfaceLabel}.responseScanTaskId must match scanTaskId`);
    assert(Number.isInteger(search.resultCount) && search.resultCount > 0, `${surfaceLabel}.resultCount must be positive`);
    assert(search.matchedFile === anchor.filePath, `${surfaceLabel}.matchedFile must match anchor.filePath`);
    assertCodeUnderstandingRange(search, anchor.methodLine, surfaceLabel);
    assert(allowedEvidenceTypes.has(search.matchedEvidenceType), `${surfaceLabel}.matchedEvidenceType must be a known source evidence type`);
    assert(search.matchedEvidenceType !== "FRONTEND", `${surfaceLabel}.matchedEvidenceType must not be FRONTEND`);
  }
  assertSearchSurface(value.methodSearch, `${label}.methodSearch`, "class#method");

  const stackTraceSearch = value.stackTraceSearch;
  assert(stackTraceSearch && typeof stackTraceSearch === "object" && !Array.isArray(stackTraceSearch), `${label}.stackTraceSearch must be an object`);
  assertAllowedObjectKeys(stackTraceSearch, new Set([
    "queryShape",
    "stackClass",
    "stackMethod",
    "stackFile",
    "stackLine",
    "responseScanTaskId",
    "resultCount",
    "matchedFile",
    "matchedStartLine",
    "matchedEndLine",
    "matchedEvidenceType",
  ]), `${label}.stackTraceSearch`);
  assert(stackTraceSearch.queryShape === "java-stack-frame", `${label}.stackTraceSearch.queryShape must be java-stack-frame`);
  assert(stackTraceSearch.stackClass === anchor.className, `${label}.stackTraceSearch.stackClass must match anchor.className`);
  assert(stackTraceSearch.stackMethod === anchor.methodName, `${label}.stackTraceSearch.stackMethod must match anchor.methodName`);
  assert(stackTraceSearch.stackFile === anchor.filePath.split("/").pop(), `${label}.stackTraceSearch.stackFile must match anchor file name`);
  assert(stackTraceSearch.stackLine === anchor.methodLine, `${label}.stackTraceSearch.stackLine must match anchor.methodLine`);
  assert(stackTraceSearch.responseScanTaskId === parentPayload.scanTaskId, `${label}.stackTraceSearch.responseScanTaskId must match scanTaskId`);
  assert(Number.isInteger(stackTraceSearch.resultCount) && stackTraceSearch.resultCount > 0, `${label}.stackTraceSearch.resultCount must be positive`);
  assert(stackTraceSearch.matchedFile === anchor.filePath, `${label}.stackTraceSearch.matchedFile must match anchor.filePath`);
  assertCodeUnderstandingRange(stackTraceSearch, anchor.methodLine, `${label}.stackTraceSearch`);
  assert(allowedEvidenceTypes.has(stackTraceSearch.matchedEvidenceType), `${label}.stackTraceSearch.matchedEvidenceType must be a known source evidence type`);
  assert(stackTraceSearch.matchedEvidenceType !== "FRONTEND", `${label}.stackTraceSearch.matchedEvidenceType must not be FRONTEND`);

  const codeQa = value.codeQa;
  assert(codeQa && typeof codeQa === "object" && !Array.isArray(codeQa), `${label}.codeQa must be an object`);
  assertAllowedObjectKeys(codeQa, new Set([
    "requestScanTaskId",
    "responseScanTaskId",
    "retrievalMode",
    "resultCount",
    "primaryMatched",
    "firstPrimaryIndex",
    "firstPrimaryFile",
    "firstPrimaryStartLine",
    "firstPrimaryEndLine",
    "firstPrimaryContextRole",
    "firstPrimaryExactAnchorPreserved",
    "primaryFile",
    "primaryStartLine",
    "primaryEndLine",
  ]), `${label}.codeQa`);
  assert(codeQa.requestScanTaskId === parentPayload.scanTaskId, `${label}.codeQa.requestScanTaskId must match scanTaskId`);
  assert(codeQa.responseScanTaskId === parentPayload.scanTaskId, `${label}.codeQa.responseScanTaskId must match scanTaskId`);
  assert(["KEYWORD", "STABLE_FALLBACK", "SEMANTIC_FALLBACK", "HYBRID"].includes(codeQa.retrievalMode), `${label}.codeQa.retrievalMode must be usable`);
  assert(Number.isInteger(codeQa.resultCount) && codeQa.resultCount > 0, `${label}.codeQa.resultCount must be positive`);
  assert(codeQa.primaryMatched === true, `${label}.codeQa.primaryMatched must be true`);
  const hasFirstPrimaryProof = Object.prototype.hasOwnProperty.call(codeQa, "firstPrimaryExactAnchorPreserved");
  if (hasFirstPrimaryProof) {
    assert(codeQa.firstPrimaryIndex === 0, `${label}.codeQa.firstPrimaryIndex must be 0`);
    assert(codeQa.firstPrimaryFile === anchor.filePath, `${label}.codeQa.firstPrimaryFile must match anchor.filePath`);
    assert(codeQa.firstPrimaryContextRole === "PRIMARY", `${label}.codeQa.firstPrimaryContextRole must be PRIMARY`);
    assert(codeQa.firstPrimaryExactAnchorPreserved === true, `${label}.codeQa.firstPrimaryExactAnchorPreserved must be true`);
    assertCodeUnderstandingRange(codeQa, anchor.methodLine, `${label}.codeQa`, "firstPrimaryStartLine", "firstPrimaryEndLine");
  }
  assert(codeQa.primaryFile === anchor.filePath, `${label}.codeQa.primaryFile must match anchor.filePath`);
  assertCodeUnderstandingRange(codeQa, anchor.methodLine, `${label}.codeQa`, "primaryStartLine", "primaryEndLine");
  assertNoSensitiveMaterial(value, label);
}

function assertAllowedObjectKeys(value, allowedKeys, label) {
  for (const key of Object.keys(value)) {
    assert(allowedKeys.has(key), `${label} must not include unexpected field ${key}`);
  }
}

function assertSourceLocationProbe(value, parentPayload, expectedKind, label, sourceLocationProbeContractVersion) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertNoSensitiveMaterial(value, label);
  assertAllowedObjectKeys(value, new Set([
    "kind",
    "status",
    "matched",
    "queryShape",
    "queryHadScheme",
    "queryHadViteQueryParam",
    "queryHadColumn",
    "queryHadWebpackScheme",
    "scanTaskId",
    "targetFile",
    "targetLine",
    "expectedPort",
    "expectedColumn",
    "resultCount",
    "firstResultIndex",
    "firstResultFile",
    "firstResultStartLine",
    "firstResultEndLine",
    "firstResultEvidenceType",
    "firstResultMatchesExactAnchor",
    "exactAnchorPreservedAsFirstResult",
    "matchedFile",
    "matchedStartLine",
    "matchedEndLine",
    "matchedEvidenceType",
    "devServerPortIgnored",
  ]), label);
  assert(value.kind === expectedKind, `${label}.kind must be ${expectedKind}`);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.matched === true, `${label}.matched must be true`);
  const queryShapeProofRequired = sourceLocationProbeContractVersion === 3 || sourceLocationProbeContractVersion === 4;
  const firstResultProofRequired = sourceLocationProbeContractVersion === 4;
  const queryShapeProofPresent = Object.prototype.hasOwnProperty.call(value, "queryHadScheme")
    || Object.prototype.hasOwnProperty.call(value, "queryHadViteQueryParam")
    || Object.prototype.hasOwnProperty.call(value, "queryHadColumn")
    || Object.prototype.hasOwnProperty.call(value, "queryHadWebpackScheme");
  if (queryShapeProofRequired || queryShapeProofPresent) {
    assert(value.queryHadScheme === true, `${label}.queryHadScheme must be true`);
    assert(value.queryHadColumn === true, `${label}.queryHadColumn must be true`);
  }
  assert(value.scanTaskId === parentPayload.scanTaskId, `${label}.scanTaskId must match PUBLIC_REPO_SMOKE_OK scanTaskId`);
  assertSafeEvidencePath(value.targetFile, `${label}.targetFile`);
  assertSafeEvidencePath(value.matchedFile, `${label}.matchedFile`);
  assert(value.matchedFile === value.targetFile, `${label}.matchedFile must match targetFile`);
  assert(Number.isInteger(value.targetLine) && value.targetLine > 0, `${label}.targetLine must be positive`);
  assert(Number.isInteger(value.resultCount) && value.resultCount > 0, `${label}.resultCount must be positive`);
  assert(Number.isInteger(value.matchedStartLine) && value.matchedStartLine > 0, `${label}.matchedStartLine must be positive`);
  assert(Number.isInteger(value.matchedEndLine) && value.matchedEndLine >= value.matchedStartLine, `${label}.matchedEndLine must be >= matchedStartLine`);
  assert(value.matchedStartLine <= value.targetLine && value.targetLine <= value.matchedEndLine, `${label}.targetLine must be inside matched line range`);
  assert(typeof value.matchedEvidenceType === "string" && value.matchedEvidenceType.trim(), `${label}.matchedEvidenceType must be present`);
  assert(
    ["CONTROLLER", "SERVICE", "DATA_ACCESS", "DOMAIN_MODEL", "FRONTEND", "SOURCE"].includes(value.matchedEvidenceType),
    `${label}.matchedEvidenceType must be a source evidence type`
  );
  if (firstResultProofRequired) {
    assert(value.firstResultIndex === 0, `${label}.firstResultIndex must be 0`);
    assertSafeEvidencePath(value.firstResultFile, `${label}.firstResultFile`);
    assert(value.firstResultFile === value.targetFile, `${label}.firstResultFile must match targetFile`);
    assert(Number.isInteger(value.firstResultStartLine) && value.firstResultStartLine > 0, `${label}.firstResultStartLine must be positive`);
    assert(Number.isInteger(value.firstResultEndLine) && value.firstResultEndLine >= value.firstResultStartLine, `${label}.firstResultEndLine must be >= firstResultStartLine`);
    assert(value.firstResultStartLine <= value.targetLine && value.targetLine <= value.firstResultEndLine, `${label}.targetLine must be inside first result line range`);
    assert(typeof value.firstResultEvidenceType === "string" && value.firstResultEvidenceType.trim(), `${label}.firstResultEvidenceType must be present`);
    assert(
      ["CONTROLLER", "SERVICE", "DATA_ACCESS", "DOMAIN_MODEL", "FRONTEND", "SOURCE"].includes(value.firstResultEvidenceType),
      `${label}.firstResultEvidenceType must be a source evidence type`
    );
    assert(value.firstResultMatchesExactAnchor === true, `${label}.firstResultMatchesExactAnchor must be true`);
    assert(value.exactAnchorPreservedAsFirstResult === true, `${label}.exactAnchorPreservedAsFirstResult must be true`);
  }
  if (expectedKind === "standaloneBrowserSourceUrl") {
    assert(value.queryShape === "source-url", `${label}.queryShape must be source-url`);
    if (queryShapeProofRequired || queryShapeProofPresent) {
      assert(value.queryHadViteQueryParam === false, `${label}.queryHadViteQueryParam must be false`);
      assert(value.queryHadWebpackScheme === false, `${label}.queryHadWebpackScheme must be false`);
    }
    assert(value.expectedPort === 3000, `${label}.expectedPort must be 3000`);
    assert(value.expectedColumn === 17, `${label}.expectedColumn must be 17`);
    assert(value.devServerPortIgnored === true, `${label}.devServerPortIgnored must be true`);
    assert(!(value.matchedStartLine <= value.expectedPort && value.expectedPort <= value.matchedEndLine), `${label}.matched line range must not cover the dev-server port`);
    return;
  }
  if (expectedKind === "viteQuerySourceUrl") {
    assert(value.queryShape === "vite-query-source-url", `${label}.queryShape must be vite-query-source-url`);
    if (queryShapeProofRequired || queryShapeProofPresent) {
      assert(value.queryHadViteQueryParam === true, `${label}.queryHadViteQueryParam must be true`);
      assert(value.queryHadWebpackScheme === false, `${label}.queryHadWebpackScheme must be false`);
    }
    assert(value.expectedPort === 5173, `${label}.expectedPort must be 5173`);
    assert(value.expectedColumn === 19, `${label}.expectedColumn must be 19`);
    assert(value.devServerPortIgnored === true, `${label}.devServerPortIgnored must be true`);
    assert(!(value.matchedStartLine <= value.expectedPort && value.expectedPort <= value.matchedEndLine), `${label}.matched line range must not cover the Vite dev-server port`);
    return;
  }
  assert(value.queryShape === "anonymous-stack-frame", `${label}.queryShape must be anonymous-stack-frame`);
  if (queryShapeProofRequired || queryShapeProofPresent) {
    assert(value.queryHadViteQueryParam === false, `${label}.queryHadViteQueryParam must be false`);
    assert(value.queryHadWebpackScheme === true, `${label}.queryHadWebpackScheme must be true`);
  }
  assert(value.expectedColumn === 13, `${label}.expectedColumn must be 13`);
}

assert(matches.length === 1, "expected exactly one PUBLIC_REPO_SMOKE_OK marker");

const payload = parseMarker(matches[0], prefix, "PUBLIC_REPO_SMOKE_OK");
assertPositiveIntegerPayload(payload, "PUBLIC_REPO_SMOKE_OK");

const rawScanContract = payload.rawScanContract;
assert(rawScanContract && typeof rawScanContract === "object" && !Array.isArray(rawScanContract), "PUBLIC_REPO_SMOKE_OK rawScanContract must be an object");
assert(rawScanContract.schemaVersion === 2, "PUBLIC_REPO_SMOKE_OK rawScanContract.schemaVersion must be 2");
assert(typeof rawScanContract.language === "string" && rawScanContract.language.trim(), "PUBLIC_REPO_SMOKE_OK rawScanContract.language must be present");
assert(Number.isInteger(rawScanContract.symbols) && rawScanContract.symbols > 0, "PUBLIC_REPO_SMOKE_OK rawScanContract.symbols must be positive");
assert(Number.isInteger(rawScanContract.graphNodes) && rawScanContract.graphNodes > 0, "PUBLIC_REPO_SMOKE_OK rawScanContract.graphNodes must be positive");
assert(Number.isInteger(rawScanContract.totalFiles) && rawScanContract.totalFiles > 0, "PUBLIC_REPO_SMOKE_OK rawScanContract.totalFiles must be positive");
assert(Number.isInteger(rawScanContract.apiRoutes) && rawScanContract.apiRoutes >= 0, "PUBLIC_REPO_SMOKE_OK rawScanContract.apiRoutes must be a non-negative integer");
assert(Number.isInteger(rawScanContract.entities) && rawScanContract.entities >= 0, "PUBLIC_REPO_SMOKE_OK rawScanContract.entities must be a non-negative integer");

const reportQuality = payload.reportQuality;
assert(reportQuality && typeof reportQuality === "object" && !Array.isArray(reportQuality), "PUBLIC_REPO_SMOKE_OK reportQuality must be an object");
assert(["READY", "REVIEW", "RISK"].includes(reportQuality.readiness), "PUBLIC_REPO_SMOKE_OK reportQuality.readiness must be READY, REVIEW, or RISK");
assert(Number.isInteger(reportQuality.confidence) && reportQuality.confidence >= 35 && reportQuality.confidence <= 100, "PUBLIC_REPO_SMOKE_OK reportQuality.confidence must be 35..100");
assert(Number.isInteger(reportQuality.gaps) && reportQuality.gaps >= 0, "PUBLIC_REPO_SMOKE_OK reportQuality.gaps must be non-negative");
assert(Number.isInteger(reportQuality.nextActions) && reportQuality.nextActions > 0, "PUBLIC_REPO_SMOKE_OK reportQuality.nextActions must be positive");
assert(Number.isInteger(reportQuality.evidenceChecks) && reportQuality.evidenceChecks >= 6, "PUBLIC_REPO_SMOKE_OK reportQuality.evidenceChecks must cover required checks");
const reportCitationQuality = reportQuality.reportCitationQuality;
assert(
  reportCitationQuality && typeof reportCitationQuality === "object" && !Array.isArray(reportCitationQuality),
  "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality must be an object"
);
assert(reportCitationQuality.status === "OK", "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.status must be OK");
assert(reportCitationQuality.artifactType === "ARCHITECTURE_REPORT", "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.artifactType must be ARCHITECTURE_REPORT");
assert(reportCitationQuality.scanTaskId === payload.scanTaskId, "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.scanTaskId must match scanTaskId");
assert(reportCitationQuality.requiredCheckCount === 6, "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.requiredCheckCount must be 6");
assert(reportCitationQuality.boundCheckCount === reportCitationQuality.requiredCheckCount, "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.boundCheckCount must cover required checks");
assertRequiredStringSet(
  reportCitationQuality.evidenceCheckKeys,
  ["api_data_surface", "fingerprint", "module_map", "risk_signal", "scan_scope", "test_signal"],
  "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.evidenceCheckKeys"
);
assert(Array.isArray(reportCitationQuality.sectionBindings), "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.sectionBindings must be an array");
assert(reportCitationQuality.sectionBindings.length === reportCitationQuality.requiredCheckCount, "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.sectionBindings must cover required checks");
const reportSectionBindings = new Map();
for (const binding of reportCitationQuality.sectionBindings) {
  assert(binding && typeof binding === "object" && !Array.isArray(binding), "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.sectionBindings entries must be objects");
  assert(typeof binding.key === "string" && binding.key.trim(), "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.sectionBindings.key must be present");
  assert(typeof binding.sourceSection === "string" && binding.sourceSection.trim(), "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.sectionBindings.sourceSection must be present");
  assert(["READY", "REVIEW", "WARNING", "RISK", "GAP", "IDLE"].includes(binding.status), "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.sectionBindings.status must be valid");
  assert(!reportSectionBindings.has(binding.key), `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.sectionBindings must not repeat ${binding.key}`);
  reportSectionBindings.set(binding.key, binding);
}
const expectedReportSections = new Map([
  ["scan_scope", "overview"],
  ["test_signal", "overview"],
  ["module_map", "modules"],
  ["api_data_surface", "apiRoutes/dbEntities"],
  ["fingerprint", "scanFingerprint"],
  ["risk_signal", "codeQuality.risks"],
]);
for (const [key, section] of expectedReportSections.entries()) {
  const binding = reportSectionBindings.get(key);
  assert(binding && binding.sourceSection === section, `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.${key} must bind to ${section}`);
}
for (const field of ["overviewBound", "moduleMapBound", "apiDataSurfaceBound", "fingerprintBound", "riskSignalBound", "nextActionsBound", "noRawPromptOrAnswer"]) {
  assert(reportCitationQuality[field] === true, `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.${field} must be true`);
}
assert(reportCitationQuality.narrativeBindingStatus === "ALL_BOUND", "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindingStatus must be ALL_BOUND");
assert(Number.isInteger(reportCitationQuality.requiredNarrativeBindingCount) && reportCitationQuality.requiredNarrativeBindingCount === 6, "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.requiredNarrativeBindingCount must be 6");
assert(Number.isInteger(reportCitationQuality.narrativeBindingCount) && reportCitationQuality.narrativeBindingCount === reportCitationQuality.requiredNarrativeBindingCount, "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindingCount must cover required narrative bindings");
assert(Array.isArray(reportCitationQuality.narrativeBindings), "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings must be an array");
assert(reportCitationQuality.narrativeBindings.length === reportCitationQuality.requiredNarrativeBindingCount, "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings must cover required narrative bindings");
const expectedNarrativeBindings = new Map([
  ["summary_risk_posture", ["reportQuality.summary/codeQuality.risks", "highRiskCount"]],
  ["high_risk_count", ["codeQuality.risks", "severity=HIGH"]],
  ["medium_risk_count", ["codeQuality.risks", "severity=MEDIUM"]],
  ["technical_debt_count", ["technicalDebt", "array.length"]],
  ["suggestion_count", ["suggestions", "array.length"]],
  ["next_actions_risk_priority", ["reportQuality.nextActions/codeQuality.risks", "risk-priority-action"]],
]);
const seenNarrativeBindings = new Set();
for (const binding of reportCitationQuality.narrativeBindings) {
  assert(binding && typeof binding === "object" && !Array.isArray(binding), "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings entries must be objects");
  assertAllowedObjectKeys(binding, new Set(["key", "sourceSection", "sourceMetric", "reportedCount", "actualCount", "status"]), "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings");
  assert(expectedNarrativeBindings.has(binding.key), `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings unknown key ${binding.key}`);
  assert(!seenNarrativeBindings.has(binding.key), `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings duplicate key ${binding.key}`);
  seenNarrativeBindings.add(binding.key);
  const [sourceSection, sourceMetric] = expectedNarrativeBindings.get(binding.key);
  assert(binding.sourceSection === sourceSection, `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings.${binding.key}.sourceSection must match`);
  assert(binding.sourceMetric === sourceMetric, `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings.${binding.key}.sourceMetric must match`);
  assert(Number.isInteger(binding.reportedCount) && binding.reportedCount >= 0, `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings.${binding.key}.reportedCount must be non-negative`);
  assert(Number.isInteger(binding.actualCount) && binding.actualCount >= 0, `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings.${binding.key}.actualCount must be non-negative`);
  assert(binding.reportedCount === binding.actualCount, `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings.${binding.key} counts must match`);
  assert(binding.status === "BOUND", `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings.${binding.key}.status must be BOUND`);
}
for (const key of expectedNarrativeBindings.keys()) {
  assert(seenNarrativeBindings.has(key), `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.narrativeBindings must include ${key}`);
}
for (const field of ["rawPrompt", "rawAnswer", "content", "sourceContent", "token", "password", "secret"]) {
  assert(!Object.prototype.hasOwnProperty.call(reportCitationQuality, field), `PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality must not contain ${field}`);
}
assert(reportCitationQuality.providerQualityClaim === false, "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.providerQualityClaim must be false");
assert(reportCitationQuality.llmFactClaim === false, "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality.llmFactClaim must be false");
assertNoSensitiveMaterial(reportCitationQuality, "PUBLIC_REPO_SMOKE_OK reportQuality.reportCitationQuality");

const chunkSearch = payload.chunkSearch;
assert(chunkSearch && typeof chunkSearch === "object" && !Array.isArray(chunkSearch), "PUBLIC_REPO_SMOKE_OK chunkSearch must be an object");
assert(Array.isArray(chunkSearch.roleProbes), "PUBLIC_REPO_SMOKE_OK chunkSearch.roleProbes must be an array");

const crossFileRetrievalProof = chunkSearch.crossFileRetrievalProof;
assert(
  crossFileRetrievalProof && typeof crossFileRetrievalProof === "object" && !Array.isArray(crossFileRetrievalProof),
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof must be an object"
);
assert(crossFileRetrievalProof.status === "OK", "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.status must be OK");
assert(
  crossFileRetrievalProof.endpoint === `/api/projects/${payload.projectId}/code-chunks/search`,
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.endpoint must be bound to the current project code-chunks search API"
);
assert(crossFileRetrievalProof.query === "", "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.query must be empty broad retrieval");
assert(crossFileRetrievalProof.limit === 24, "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.limit must be 24");
assert(
  crossFileRetrievalProof.responseScanTaskId === payload.scanTaskId,
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.responseScanTaskId must match scanTaskId"
);
assert(
  Number.isInteger(crossFileRetrievalProof.resultCount) && crossFileRetrievalProof.resultCount >= 2,
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.resultCount must be at least 2"
);
assert(
  Number.isInteger(crossFileRetrievalProof.totalChunks) && crossFileRetrievalProof.totalChunks > 0,
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.totalChunks must be positive"
);
assert(
  Number.isInteger(crossFileRetrievalProof.embeddedChunks) && crossFileRetrievalProof.embeddedChunks >= 0
    && crossFileRetrievalProof.embeddedChunks <= crossFileRetrievalProof.totalChunks,
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.embeddedChunks must be between 0 and totalChunks"
);
assert(
  Number.isInteger(crossFileRetrievalProof.uniqueFiles) && crossFileRetrievalProof.uniqueFiles >= 2,
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.uniqueFiles must be at least 2"
);
assert(crossFileRetrievalProof.currentScanOnly === true, "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.currentScanOnly must be true");
assert(crossFileRetrievalProof.fileStatsVisible === true, "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileStatsVisible must be true");
assert(
  Number.isInteger(crossFileRetrievalProof.fileStatsUniqueFiles) && crossFileRetrievalProof.fileStatsUniqueFiles >= 2,
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileStatsUniqueFiles must be at least 2"
);
if (
  Object.prototype.hasOwnProperty.call(crossFileRetrievalProof, "fileDistribution")
    || Object.prototype.hasOwnProperty.call(crossFileRetrievalProof, "fileDistributionSampleCount")
) {
  assert(
    Number.isInteger(crossFileRetrievalProof.fileDistributionSampleCount) && crossFileRetrievalProof.fileDistributionSampleCount >= 2,
    "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistributionSampleCount must be at least 2"
  );
  assert(
    Array.isArray(crossFileRetrievalProof.fileDistribution)
      && crossFileRetrievalProof.fileDistribution.length === crossFileRetrievalProof.fileDistributionSampleCount,
    "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistribution must match sample count"
  );
  const distributedFiles = new Set();
  for (const sample of crossFileRetrievalProof.fileDistribution) {
    assert(sample && typeof sample === "object" && !Array.isArray(sample), "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistribution samples must be objects");
    assertSafeEvidencePath(sample.filePath, "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistribution.filePath");
    assert(!distributedFiles.has(sample.filePath), `PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistribution must not repeat ${sample.filePath}`);
    distributedFiles.add(sample.filePath);
    assert(Number.isInteger(sample.resultCount) && sample.resultCount > 0, "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistribution.resultCount must be positive");
    assert(Array.isArray(sample.evidenceTypes) && sample.evidenceTypes.length > 0, "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistribution.evidenceTypes must be non-empty");
    for (const evidenceType of sample.evidenceTypes) {
      assert(typeof evidenceType === "string" && evidenceType.trim(), "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistribution.evidenceTypes entries must be non-empty strings");
    }
    assert(Number.isInteger(sample.sourceLabelCount) && sample.sourceLabelCount >= sample.resultCount, "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistribution.sourceLabelCount must cover results");
    assert(Number.isInteger(sample.minStartLine) && sample.minStartLine > 0, "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistribution.minStartLine must be positive");
    assert(Number.isInteger(sample.maxEndLine) && sample.maxEndLine >= sample.minStartLine, "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.fileDistribution.maxEndLine must cover minStartLine");
  }
}
assert(crossFileRetrievalProof.sourceLabelsVisible === true, "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.sourceLabelsVisible must be true");
assert(
  ["KEYWORD", "STABLE_FALLBACK", "SEMANTIC_FALLBACK", "HYBRID"].includes(crossFileRetrievalProof.retrievalMode),
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.retrievalMode must be usable"
);
assert(
  ["READY", "REVIEW", "GAP"].includes(crossFileRetrievalProof.readiness),
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.readiness must be READY, REVIEW, or GAP"
);
assert(
  crossFileRetrievalProof.minFileEvidenceSatisfied === true,
  "PUBLIC_REPO_SMOKE_OK chunkSearch.crossFileRetrievalProof.minFileEvidenceSatisfied must be true"
);

assertCodeUnderstandingFixture(payload.codeUnderstandingFixture, payload);

const probesByRole = new Map();
for (const probe of chunkSearch.roleProbes) {
  assert(probe && typeof probe === "object" && !Array.isArray(probe), "PUBLIC_REPO_SMOKE_OK role probe must be an object");
  if (typeof probe.role === "string") {
    assert(!probesByRole.has(probe.role), `PUBLIC_REPO_SMOKE_OK roleProbes must not repeat role ${probe.role}`);
    probesByRole.set(probe.role, probe);
  }
}

const requiredProbes = [
  ["naturalEndpointCn", "业务接口"],
  ["naturalEndpointEn", "business endpoint"],
];
const allowedReasons = new Set([
  "evidenceType:CONTROLLER",
  "fallback:path-role-segment",
  "fallback:class-role-name",
  "fallback:spring-mapping-annotation",
]);

for (const [role, query] of requiredProbes) {
  const probe = probesByRole.get(role);
  assert(probe && typeof probe === "object", `PUBLIC_REPO_SMOKE_OK roleProbes must include ${role}`);
  assert(probe.query === query, `PUBLIC_REPO_SMOKE_OK ${role} query must be ${query}`);
  assert(probe.status === "OK", `PUBLIC_REPO_SMOKE_OK ${role} status must be OK`);
  assert(probe.matched === true, `PUBLIC_REPO_SMOKE_OK ${role} matched must be true`);
  assert(Number.isInteger(probe.resultCount) && probe.resultCount > 0, `PUBLIC_REPO_SMOKE_OK ${role} resultCount must be positive`);
  assert(typeof probe.matchedFile === "string" && probe.matchedFile.trim(), `PUBLIC_REPO_SMOKE_OK ${role} matchedFile must be present`);
  assert(typeof probe.matchedEvidenceType === "string" && probe.matchedEvidenceType.trim(), `PUBLIC_REPO_SMOKE_OK ${role} matchedEvidenceType must be present`);
  assert(probe.matchedEvidenceType !== "FRONTEND", `PUBLIC_REPO_SMOKE_OK ${role} must not match FRONTEND evidence`);
  assert(allowedReasons.has(probe.matchedReason), `PUBLIC_REPO_SMOKE_OK ${role} must use controller evidence or controller fallback`);
  if (probe.matchedReason === "evidenceType:CONTROLLER") {
    assert(probe.matchedEvidenceType === "CONTROLLER", `PUBLIC_REPO_SMOKE_OK ${role} controller evidence type mismatch`);
  }
}

if (chunkSearch.sourceLocationProbes === undefined) {
  assert(!requireSourceLocationProbes, "PUBLIC_REPO_SMOKE_OK chunkSearch.sourceLocationProbes must be present when public_repo_source_location_probes_required=true");
} else {
  const sourceLocationProbeContractVersion = chunkSearch.sourceLocationProbeContractVersion;
  if (sourceLocationProbeContractVersion !== undefined) {
    assert([2, 3, 4].includes(sourceLocationProbeContractVersion), "PUBLIC_REPO_SMOKE_OK chunkSearch.sourceLocationProbeContractVersion must be 2, 3 or 4 when present");
  }
  assert(Array.isArray(chunkSearch.sourceLocationProbes), "PUBLIC_REPO_SMOKE_OK chunkSearch.sourceLocationProbes must be an array when present");
  const probesByKind = new Map();
  for (const probe of chunkSearch.sourceLocationProbes) {
    assert(probe && typeof probe === "object" && !Array.isArray(probe), "PUBLIC_REPO_SMOKE_OK sourceLocationProbes entries must be objects");
    assert(typeof probe.kind === "string" && probe.kind.trim(), "PUBLIC_REPO_SMOKE_OK sourceLocationProbes kind must be present");
    assert(!probesByKind.has(probe.kind), `PUBLIC_REPO_SMOKE_OK sourceLocationProbes must not repeat kind ${probe.kind}`);
    probesByKind.set(probe.kind, probe);
  }
  if (sourceLocationProbeContractVersion === 2 || sourceLocationProbeContractVersion === 3 || sourceLocationProbeContractVersion === 4) {
    assert(probesByKind.size === 3, "PUBLIC_REPO_SMOKE_OK sourceLocationProbes v2/v3/v4 must contain exactly three probes");
  } else {
    assert(probesByKind.size === 2, "PUBLIC_REPO_SMOKE_OK legacy sourceLocationProbes must contain exactly two probes");
  }
  assertSourceLocationProbe(
    probesByKind.get("standaloneBrowserSourceUrl"),
    payload,
    "standaloneBrowserSourceUrl",
    "PUBLIC_REPO_SMOKE_OK chunkSearch.sourceLocationProbes.standaloneBrowserSourceUrl",
    sourceLocationProbeContractVersion
  );
  assertSourceLocationProbe(
    probesByKind.get("anonymousWebpackStackFrame"),
    payload,
    "anonymousWebpackStackFrame",
    "PUBLIC_REPO_SMOKE_OK chunkSearch.sourceLocationProbes.anonymousWebpackStackFrame",
    sourceLocationProbeContractVersion
  );
  if (sourceLocationProbeContractVersion === 2 || sourceLocationProbeContractVersion === 3 || sourceLocationProbeContractVersion === 4) {
    assertSourceLocationProbe(
      probesByKind.get("viteQuerySourceUrl"),
      payload,
      "viteQuerySourceUrl",
      "PUBLIC_REPO_SMOKE_OK chunkSearch.sourceLocationProbes.viteQuerySourceUrl",
      sourceLocationProbeContractVersion
    );
  }
}

const codeQa = payload.codeQa;
assert(codeQa && typeof codeQa === "object" && !Array.isArray(codeQa), "PUBLIC_REPO_SMOKE_OK codeQa must be an object");
assert(Number.isInteger(codeQa.resultCount) && codeQa.resultCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.resultCount must be positive");
assertRawRetrievedChunkContentAbsent(codeQa, "PUBLIC_REPO_SMOKE_OK codeQa");
assert(codeQa.groundingStatus === "VERIFIED", "PUBLIC_REPO_SMOKE_OK codeQa.groundingStatus must be VERIFIED");
assert(["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_CITED"].includes(codeQa.citationEnforcementStatus), "PUBLIC_REPO_SMOKE_OK codeQa.citationEnforcementStatus must prove citation enforcement");
assert(Number.isInteger(codeQa.citationCount) && codeQa.citationCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.citationCount must be positive");
assert(Number.isInteger(codeQa.citedChunkCount) && codeQa.citedChunkCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.citedChunkCount must be positive");
const codeQaCoverage = codeQa.citationCoverage;
assert(codeQaCoverage && typeof codeQaCoverage === "object" && !Array.isArray(codeQaCoverage), "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage must be an object");
assert(["FULL", "REQUIRED_FULL", "PARTIAL"].includes(codeQaCoverage.status), "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.status must be FULL, REQUIRED_FULL or PARTIAL");
assert(codeQaCoverage.totalEvidenceCount === codeQa.citationCount, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.totalEvidenceCount must match citationCount");
assert(codeQaCoverage.citedEvidenceCount === codeQa.citedChunkCount, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.citedEvidenceCount must match citedChunkCount");
assert(Number.isInteger(codeQaCoverage.uncitedCandidateCount) && codeQaCoverage.uncitedCandidateCount >= 0, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.uncitedCandidateCount must be non-negative");
assert(codeQaCoverage.uncitedCandidateCount === codeQa.citationCount - codeQa.citedChunkCount, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.uncitedCandidateCount must match citation delta");
assert(Number.isInteger(codeQaCoverage.repairCandidateCount) && codeQaCoverage.repairCandidateCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.repairCandidateCount must be positive");
assert(Number.isInteger(codeQaCoverage.coveragePercent) && codeQaCoverage.coveragePercent > 0 && codeQaCoverage.coveragePercent <= 100, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.coveragePercent must be 1..100");
assert(Number.isInteger(codeQaCoverage.uniqueEvidenceFileCount) && codeQaCoverage.uniqueEvidenceFileCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.uniqueEvidenceFileCount must be positive");
assert(Number.isInteger(codeQaCoverage.citedEvidenceFileCount) && codeQaCoverage.citedEvidenceFileCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.citedEvidenceFileCount must be positive");
assert(Number.isInteger(codeQaCoverage.primaryEvidenceFileCount) && codeQaCoverage.primaryEvidenceFileCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.primaryEvidenceFileCount must be positive");
assert(Number.isInteger(codeQaCoverage.citedPrimaryEvidenceFileCount) && codeQaCoverage.citedPrimaryEvidenceFileCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.citedPrimaryEvidenceFileCount must cite at least one primary file");
assert(codeQaCoverage.citedPrimaryEvidenceFileCount <= codeQaCoverage.primaryEvidenceFileCount, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.citedPrimaryEvidenceFileCount must not exceed primary files");
assert(Number.isInteger(codeQaCoverage.contextEvidenceFileCount) && codeQaCoverage.contextEvidenceFileCount >= 0, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.contextEvidenceFileCount must be non-negative");
assert(Number.isInteger(codeQaCoverage.citedContextEvidenceFileCount) && codeQaCoverage.citedContextEvidenceFileCount >= 0, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.citedContextEvidenceFileCount must be non-negative");
assertEvidenceRoleDistribution(codeQaCoverage.evidenceRoleDistribution, codeQaCoverage, "PUBLIC_REPO_SMOKE_OK codeQa.citationCoverage.evidenceRoleDistribution", "raw");
const codeQaClaimCoverage = codeQa.claimCitationCoverage;
assert(codeQaClaimCoverage && typeof codeQaClaimCoverage === "object" && !Array.isArray(codeQaClaimCoverage), "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage must be an object");
assert(codeQaClaimCoverage.status === "READY", "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.status must be READY");
assert(codeQaClaimCoverage.readyForRepair === true, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.readyForRepair must be true");
assert(codeQaClaimCoverage.readinessReason === "PRIMARY_BOUND_READY", "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.readinessReason must be PRIMARY_BOUND_READY");
assert(Number.isInteger(codeQaClaimCoverage.claimCoveragePercent) && codeQaClaimCoverage.claimCoveragePercent >= 100, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.claimCoveragePercent must be at least 100");
assert(Number.isInteger(codeQaClaimCoverage.requiredClaimCount) && codeQaClaimCoverage.requiredClaimCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.requiredClaimCount must be positive");
assert(Number.isInteger(codeQaClaimCoverage.citedRequiredClaimCount) && codeQaClaimCoverage.citedRequiredClaimCount === codeQaClaimCoverage.requiredClaimCount, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.citedRequiredClaimCount must match requiredClaimCount");
assert(Number.isInteger(codeQaClaimCoverage.uncitedRequiredClaimCount) && codeQaClaimCoverage.uncitedRequiredClaimCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.uncitedRequiredClaimCount must be 0");
assert(Number.isInteger(codeQaClaimCoverage.invalidCitationClaimCount) && codeQaClaimCoverage.invalidCitationClaimCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.invalidCitationClaimCount must be 0");
assert(Number.isInteger(codeQaClaimCoverage.validCitationFileCount) && codeQaClaimCoverage.validCitationFileCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.validCitationFileCount must be positive");
assert(Number.isInteger(codeQaClaimCoverage.requiredClaimCitationFileCount) && codeQaClaimCoverage.requiredClaimCitationFileCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.requiredClaimCitationFileCount must be positive");
const codeQaClaimRoleDistribution = codeQaClaimCoverage.roleDistribution;
assert(codeQaClaimRoleDistribution && typeof codeQaClaimRoleDistribution === "object" && !Array.isArray(codeQaClaimRoleDistribution), "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution must be an object");
assert(codeQaClaimRoleDistribution.status === "PRIMARY_BOUND", "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.status must be PRIMARY_BOUND");
assert(Number.isInteger(codeQaClaimRoleDistribution.requiredClaimCount) && codeQaClaimRoleDistribution.requiredClaimCount === codeQaClaimCoverage.requiredClaimCount, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.requiredClaimCount must match parent");
assert(Number.isInteger(codeQaClaimRoleDistribution.requiredPrimaryBoundClaimCount) && codeQaClaimRoleDistribution.requiredPrimaryBoundClaimCount === codeQaClaimCoverage.requiredClaimCount, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.requiredPrimaryBoundClaimCount must cover required claims");
assert(Number.isInteger(codeQaClaimRoleDistribution.requiredContextOnlyClaimCount) && codeQaClaimRoleDistribution.requiredContextOnlyClaimCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.requiredContextOnlyClaimCount must be 0");
assert(Number.isInteger(codeQaClaimRoleDistribution.requiredUnknownOnlyClaimCount) && codeQaClaimRoleDistribution.requiredUnknownOnlyClaimCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.requiredUnknownOnlyClaimCount must be 0");
assert(Number.isInteger(codeQaClaimRoleDistribution.unbackedRequiredClaimCount) && codeQaClaimRoleDistribution.unbackedRequiredClaimCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.unbackedRequiredClaimCount must be 0");
assert(Number.isInteger(codeQaClaimRoleDistribution.invalidRequiredClaimCount) && codeQaClaimRoleDistribution.invalidRequiredClaimCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.invalidRequiredClaimCount must be 0");
assert(Number.isInteger(codeQaClaimRoleDistribution.validCitationFileCount) && codeQaClaimRoleDistribution.validCitationFileCount === codeQaClaimCoverage.validCitationFileCount, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.validCitationFileCount must match parent");
assert(Number.isInteger(codeQaClaimRoleDistribution.requiredClaimCitationFileCount) && codeQaClaimRoleDistribution.requiredClaimCitationFileCount === codeQaClaimCoverage.requiredClaimCitationFileCount, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.requiredClaimCitationFileCount must match parent");
assert(Number.isInteger(codeQaClaimRoleDistribution.requiredPrimaryFileCount) && codeQaClaimRoleDistribution.requiredPrimaryFileCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.requiredPrimaryFileCount must be positive");
assert(Number.isInteger(codeQaClaimRoleDistribution.roleCount) && codeQaClaimRoleDistribution.roleCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.roleCount must be positive");
assert(Number.isInteger(codeQaClaimRoleDistribution.fileEntryCount) && codeQaClaimRoleDistribution.fileEntryCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage.roleDistribution.fileEntryCount must be positive");
if (Object.prototype.hasOwnProperty.call(codeQa, "crossFileCitationSummary")) {
  assertRawCodeQaCrossFileCitationSummary(
    codeQa.crossFileCitationSummary,
    codeQaCoverage,
    codeQaClaimCoverage,
    "PUBLIC_REPO_SMOKE_OK codeQa.crossFileCitationSummary"
  );
}
for (const field of ["citationScanTaskIds", "citedAnswerScanTaskIds", "retrievedChunkScanTaskIds"]) {
  assert(
    Array.isArray(codeQa[field]) && codeQa[field].length === 1 && codeQa[field][0] === payload.scanTaskId,
    `PUBLIC_REPO_SMOKE_OK codeQa.${field} must only contain the current scanTaskId`
  );
}
if (Object.prototype.hasOwnProperty.call(codeQa, "claimCitationNoiseBoundary")) {
  const boundary = codeQa.claimCitationNoiseBoundary;
  assert(boundary && typeof boundary === "object" && !Array.isArray(boundary), "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary must be an object when present");
  assertNoSensitiveMaterial(boundary, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary");
  assert(boundary.status === "OK", "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.status must be OK");
  assert(boundary.probeKind === "REAL_PUBLIC_REPO_CODE_QA_CLAIM_CITATION_NOISE", "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.probeKind must prove real public repo Code QA noise boundary");
  assert(["auto", "true"].includes(boundary.mode), "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.mode must be auto or true when present");
  assert(boundary.scanTaskId === payload.scanTaskId, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.scanTaskId must match scanTaskId");
  assert(boundary.requestScanTaskId === payload.scanTaskId, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.requestScanTaskId must match scanTaskId");
  assert(boundary.responseScanTaskId === payload.scanTaskId, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.responseScanTaskId must match scanTaskId");
  assert(Number.isInteger(boundary.resultCount) && boundary.resultCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.resultCount must be positive");
  assertRawRetrievedChunkContentAbsent(boundary, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary");
  assert(Number.isInteger(boundary.citationCount) && boundary.citationCount > 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.citationCount must be positive");
  assertRequiredStringSet(boundary.noiseKinds, ["exception-line", "fenced-code", "inline-code", "timestamp-log"], "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.noiseKinds");
  assertRequiredStringSet(boundary.groundingStatuses, [], "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.groundingStatuses");
  assert(boundary.groundingStatuses.length === 1, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.groundingStatuses must contain exactly one status");
  assert(["UNVERIFIED", "PARTIAL"].includes(boundary.groundingStatuses[0]), "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.groundingStatuses must not claim VERIFIED");
  assertRequiredStringSet(boundary.citationEnforcementStatuses, ["RETRY_FAILED"], "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.citationEnforcementStatuses");
  assert(boundary.citationEnforcementStatuses.length === 1, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.citationEnforcementStatuses must contain exactly RETRY_FAILED");
  assert(boundary.coverageStatus === "NONE", "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.coverageStatus must be NONE");
  assert(boundary.maxCitedEvidenceCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.maxCitedEvidenceCount must be 0");
  assert(boundary.maxRepairCandidateCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.maxRepairCandidateCount must be 0");
  assert(boundary.claimCitationStatus === "REVIEW", "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.claimCitationStatus must be REVIEW");
  assert(boundary.maxCitedRequiredClaimCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.maxCitedRequiredClaimCount must be 0");
  assert(boundary.maxInvalidCitationClaimCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.maxInvalidCitationClaimCount must be 0");
  assert(boundary.roleDistributionStatus === "REVIEW_UNCITED", "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.roleDistributionStatus must be REVIEW_UNCITED");
  assert(boundary.maxRequiredPrimaryBoundClaimCount === 0, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.maxRequiredPrimaryBoundClaimCount must be 0");
  assert(boundary.answerCitationsCitedByAnswer === false, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.answerCitationsCitedByAnswer must be false");
  assert(boundary.repairEvidenceGateBlockedVisible === true, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.repairEvidenceGateBlockedVisible must be true");
  assert(boundary.rawAnswerStored === false, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.rawAnswerStored must be false");
  assert(boundary.rawPromptStored === false, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.rawPromptStored must be false");
  for (const field of ["rawAnswer", "rawPrompt", "content", "stack", "log", "sourceContent"]) {
    assert(!Object.prototype.hasOwnProperty.call(boundary, field), `PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary must not contain ${field}`);
  }
  assert(boundary.providerQualityClaim === false, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.providerQualityClaim must be false");
  assert(boundary.llmFactClaim === false, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.llmFactClaim must be false");
  assert(boundary.mutationFree === true, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.mutationFree must be true");
  assert(boundary.dbMutationUsed === false, "PUBLIC_REPO_SMOKE_OK codeQa.claimCitationNoiseBoundary.dbMutationUsed must be false");
}

if (requireReportEvidenceQaCitation) {
  assert(Object.prototype.hasOwnProperty.call(payload, "reportEvidenceQaCitationQuality"), "PUBLIC_REPO_SMOKE_OK reportEvidenceQaCitationQuality must be present when public_repo_report_evidence_qa_citation=true");
}
if (Object.prototype.hasOwnProperty.call(payload, "reportEvidenceQaCitationQuality")) {
  assertReportEvidenceQaCitationQuality(payload.reportEvidenceQaCitationQuality, payload);
}
if (Object.prototype.hasOwnProperty.call(payload, "semanticWeakKeywordProbe")) {
  validateSemanticWeakKeywordProbe(payload.semanticWeakKeywordProbe, payload);
}

function assertCurrentScanOnly(value, scanTaskId, label) {
  assert(Array.isArray(value) && value.length === 1 && value[0] === scanTaskId, `${label} must only contain the current scanTaskId`);
}

function assertRawRetrievedChunkContentAbsent(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert(value.rawRetrievedChunkContentAbsent === true, `${label}.rawRetrievedChunkContentAbsent must be true`);
  assert(Number.isInteger(value.contentPreviewMaxLength) && value.contentPreviewMaxLength >= 0 && value.contentPreviewMaxLength <= 700, `${label}.contentPreviewMaxLength must be a server-truncated length`);
}

function assertRawCodeQaCrossFileCitationSummary(value, coverage, claimCoverage, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertAllowedObjectKeys(value, new Set([
    "visible",
    "tones",
    "statuses",
    "crossFileEvidenceSatisfied",
    "citationBindingSatisfied",
    "claimBindingSatisfied",
    "coverageStatus",
    "fullCitationCoverageSatisfied",
    "requiredCitationCoverageSatisfied",
    "primaryCoverageSatisfied",
    "currentScanOnly",
    "sourceEvidenceScopes",
    "evidenceFileCount",
    "citedEvidenceFileCount",
    "primaryEvidenceFileCount",
    "citedPrimaryEvidenceFileCount",
    "contextEvidenceFileCount",
    "citedContextEvidenceFileCount",
    "requiredClaimCount",
    "requiredClaimCitationFileCount",
    "requiredPrimaryFileCount",
    "requiredPrimaryBoundClaimCount",
  ]), label);
  assertNoSensitiveMaterial(value, label);
  const forbiddenKeys = /url|query|hash|origin|host|requestPath|stack|prompt|answer|content|code|claimText|token|authorization/i;
  for (const key of Object.keys(value)) {
    assert(!forbiddenKeys.test(key), `${label}.${key} must not archive raw content, URLs, prompts or secrets`);
  }
  const roleDistribution = coverage.evidenceRoleDistribution || {};
  const claimRoleDistribution = claimCoverage.roleDistribution || {};
  const allowedStatuses = new Set(["NO_EVIDENCE", "PRIMARY_SINGLE_FILE", "PRIMARY_CROSS_FILE", "MIXED_PRIMARY_CONTEXT", "CONTEXT_ONLY", "UNKNOWN_ROLE_PRESENT"]);
  assert(value.visible === true, `${label}.visible must be true`);
  const requiredCitationCoverageSatisfied = ["FULL", "REQUIRED_FULL"].includes(coverage.status);
  const summaryReady = requiredCitationCoverageSatisfied
    && coverage.primaryEvidenceFileCount > 0
    && coverage.citedPrimaryEvidenceFileCount >= coverage.primaryEvidenceFileCount
    && claimCoverage.status === "READY"
    && claimCoverage.citedRequiredClaimCount >= claimCoverage.requiredClaimCount
    && claimRoleDistribution.requiredPrimaryBoundClaimCount >= claimCoverage.requiredClaimCount;
  const expectedTone = summaryReady ? "ready" : "warning";
  assertRequiredStringSet(value.tones, [expectedTone], `${label}.tones`);
  assert(value.tones.length === 1 && value.tones[0] === expectedTone, `${label}.tones must reflect answer-level coverage readiness`);
  assertRequiredStringSet(value.statuses, [], `${label}.statuses`);
  assert(value.statuses.length === 1 && allowedStatuses.has(value.statuses[0]), `${label}.statuses must contain one allowed role status`);
  assert(value.statuses[0] === roleDistribution.status, `${label}.statuses must match citationCoverage.evidenceRoleDistribution.status`);
  assert(value.currentScanOnly === true, `${label}.currentScanOnly must be true`);
  assertRequiredStringSet(value.sourceEvidenceScopes, ["CODE_QA_RESULT"], `${label}.sourceEvidenceScopes`);
  assert(value.sourceEvidenceScopes.length === 1 && value.sourceEvidenceScopes[0] === "CODE_QA_RESULT", `${label}.sourceEvidenceScopes must be CODE_QA_RESULT only`);
  assert(value.crossFileEvidenceSatisfied === (coverage.uniqueEvidenceFileCount >= 2), `${label}.crossFileEvidenceSatisfied must be derived from citationCoverage.uniqueEvidenceFileCount`);
  assert(value.citationBindingSatisfied === (coverage.citedEvidenceFileCount > 0 && coverage.citedPrimaryEvidenceFileCount > 0), `${label}.citationBindingSatisfied must be derived from cited evidence files`);
  assert(value.claimBindingSatisfied === (
    claimCoverage.status === "READY"
    && claimCoverage.citedRequiredClaimCount >= claimCoverage.requiredClaimCount
    && claimRoleDistribution.requiredPrimaryBoundClaimCount >= claimCoverage.requiredClaimCount
  ), `${label}.claimBindingSatisfied must be derived from claim coverage`);
  assert(value.coverageStatus === coverage.status, `${label}.coverageStatus must match citationCoverage.status`);
  assert(value.fullCitationCoverageSatisfied === (coverage.status === "FULL"), `${label}.fullCitationCoverageSatisfied must be derived from citationCoverage.status`);
  assert(value.requiredCitationCoverageSatisfied === requiredCitationCoverageSatisfied, `${label}.requiredCitationCoverageSatisfied must be derived from citationCoverage.status`);
  assert(value.primaryCoverageSatisfied === (
    coverage.primaryEvidenceFileCount > 0
    && coverage.citedPrimaryEvidenceFileCount >= coverage.primaryEvidenceFileCount
  ), `${label}.primaryCoverageSatisfied must be derived from primary file coverage`);
  assert(value.evidenceFileCount === coverage.uniqueEvidenceFileCount, `${label}.evidenceFileCount must match citationCoverage.uniqueEvidenceFileCount`);
  assert(value.citedEvidenceFileCount === coverage.citedEvidenceFileCount, `${label}.citedEvidenceFileCount must match citationCoverage.citedEvidenceFileCount`);
  assert(value.primaryEvidenceFileCount === coverage.primaryEvidenceFileCount, `${label}.primaryEvidenceFileCount must match citationCoverage.primaryEvidenceFileCount`);
  assert(value.citedPrimaryEvidenceFileCount === coverage.citedPrimaryEvidenceFileCount, `${label}.citedPrimaryEvidenceFileCount must match citationCoverage.citedPrimaryEvidenceFileCount`);
  assert(value.contextEvidenceFileCount === coverage.contextEvidenceFileCount, `${label}.contextEvidenceFileCount must match citationCoverage.contextEvidenceFileCount`);
  assert(value.citedContextEvidenceFileCount === coverage.citedContextEvidenceFileCount, `${label}.citedContextEvidenceFileCount must match citationCoverage.citedContextEvidenceFileCount`);
  assert(value.requiredClaimCount === claimCoverage.requiredClaimCount, `${label}.requiredClaimCount must match claimCitationCoverage.requiredClaimCount`);
  assert(value.requiredClaimCitationFileCount === claimCoverage.requiredClaimCitationFileCount, `${label}.requiredClaimCitationFileCount must match claimCitationCoverage.requiredClaimCitationFileCount`);
  assert(value.requiredPrimaryFileCount === claimRoleDistribution.requiredPrimaryFileCount, `${label}.requiredPrimaryFileCount must match claim role distribution`);
  assert(value.requiredPrimaryBoundClaimCount === claimRoleDistribution.requiredPrimaryBoundClaimCount, `${label}.requiredPrimaryBoundClaimCount must match claim role distribution`);
  assert(value.citationBindingSatisfied === true, `${label}.citationBindingSatisfied must be true for accepted raw Code QA evidence`);
  assert(value.claimBindingSatisfied === true, `${label}.claimBindingSatisfied must be true for accepted raw Code QA evidence`);
}

function validateProjectQaWeakKeywordEvaluation(evaluation, parentPayload) {
  assert(evaluation && typeof evaluation === "object" && !Array.isArray(evaluation), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation must be an object when present");
  assertNoSensitiveMaterial(evaluation, "PUBLIC_REPO_SMOKE_OK.projectQaWeakKeywordEvaluation");
  assert(evaluation.probeKind === "REAL_WEAK_KEYWORD_SAMPLE_EVAL", "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.probeKind must be REAL_WEAK_KEYWORD_SAMPLE_EVAL");
  assert(typeof evaluation.sampleSet === "string" && evaluation.sampleSet.trim(), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.sampleSet must be present");
  assert(evaluation.weakKeywordThreshold === 45, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.weakKeywordThreshold must be 45");
  assert(evaluation.semanticPoolLimit === 500, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.semanticPoolLimit must be 500");
  assert(evaluation.mutationFree === true, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.mutationFree must be true");
  assert(evaluation.nonDbMutation === true, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.nonDbMutation must be true");
  assert(evaluation.dbMutationUsed === false, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.dbMutationUsed must be false");
  assert(evaluation.providerQualityClaim === false, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.providerQualityClaim must be false");
  assert(["auto", "true", "false"].includes(evaluation.mode), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.mode must be auto, true or false");
  if (evaluation.mode === "false") {
    assert(evaluation.status === "DISABLED", "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation mode=false must be DISABLED");
  }

  const allowedStatuses = new Set(["OK", "INCONCLUSIVE", "SKIPPED", "DISABLED"]);
  assert(allowedStatuses.has(evaluation.status), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.status must be OK, INCONCLUSIVE, SKIPPED or DISABLED");
  if (evaluation.mode === "true") {
    assert(evaluation.status === "OK", "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation mode=true must be OK");
  }
  if (!["DISABLED", "SKIPPED"].includes(evaluation.status)) {
    assert(Number.isInteger(evaluation.rawRetrievedChunkContentAbsentCaseCount) && evaluation.rawRetrievedChunkContentAbsentCaseCount > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.rawRetrievedChunkContentAbsentCaseCount must be positive");
    assert(Number.isInteger(evaluation.maxContentPreviewLength) && evaluation.maxContentPreviewLength >= 0 && evaluation.maxContentPreviewLength <= 700, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.maxContentPreviewLength must be server-truncated");
  }
  if (evaluation.status !== "OK") {
    assert(typeof evaluation.reason === "string" && evaluation.reason.trim(), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation non-OK status must include reason");
    assert(!Number.isInteger(evaluation.semanticFallbackHits) || evaluation.semanticFallbackHits === 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation non-OK status must not claim semantic fallback hits");
    return;
  }

  assert(evaluation.projectId === parentPayload.projectId, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.projectId must match projectId");
  assert(evaluation.scanTaskId === parentPayload.scanTaskId, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.scanTaskId must match scanTaskId");
  assert(Number.isInteger(evaluation.sampleCount) && evaluation.sampleCount > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.sampleCount must be positive");
  assert(Number.isInteger(evaluation.evaluatedCount) && evaluation.evaluatedCount > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.evaluatedCount must be positive");
  assert(Number.isInteger(evaluation.skippedCount) && evaluation.skippedCount >= 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.skippedCount must be a non-negative integer");
  assert(evaluation.evaluatedCount + evaluation.skippedCount === evaluation.sampleCount, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation evaluatedCount + skippedCount must equal sampleCount");
  assert(Number.isInteger(evaluation.semanticFallbackHits) && evaluation.semanticFallbackHits >= 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.semanticFallbackHits must be a non-negative integer");
  assert(Number.isInteger(evaluation.intentRoleBoundHits) && evaluation.intentRoleBoundHits >= 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.intentRoleBoundHits must be a non-negative integer");
  assert(Number.isInteger(evaluation.minSemanticFallbackHits) && evaluation.minSemanticFallbackHits > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.minSemanticFallbackHits must be positive");
  assert(
    evaluation.semanticFallbackHits >= evaluation.minSemanticFallbackHits || evaluation.intentRoleBoundHits >= evaluation.evaluatedCount,
    "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation must satisfy semantic fallback or intent role-bound coverage"
  );
  assert(["SEMANTIC_FALLBACK", "INTENT_ROLE_BOUND"].includes(evaluation.qualityMode), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.qualityMode must be SEMANTIC_FALLBACK or INTENT_ROLE_BOUND");
  if (evaluation.qualityMode === "SEMANTIC_FALLBACK") {
    assert(evaluation.semanticFallbackHits >= evaluation.minSemanticFallbackHits, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation SEMANTIC_FALLBACK qualityMode requires semantic fallback threshold");
  }
  if (evaluation.qualityMode === "INTENT_ROLE_BOUND") {
    assert(evaluation.intentRoleBoundHits >= evaluation.evaluatedCount, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation INTENT_ROLE_BOUND qualityMode requires all evaluated cases role-bound");
  }
  assert(Number.isInteger(evaluation.lowKeywordCases) && evaluation.lowKeywordCases >= evaluation.semanticFallbackHits, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.lowKeywordCases must cover semantic fallback hits");
  assert(Number.isInteger(evaluation.totalChunks) && evaluation.totalChunks > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.totalChunks must be positive");
  assert(Number.isInteger(evaluation.embeddedChunks) && evaluation.embeddedChunks > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.embeddedChunks must be positive");
  assert(evaluation.totalChunks >= evaluation.embeddedChunks, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.totalChunks must be >= embeddedChunks");
  assert(typeof evaluation.embeddingCoverage === "number" && evaluation.embeddingCoverage > 0 && evaluation.embeddingCoverage <= 100, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.embeddingCoverage must be within 0..100");
  assert(evaluation.retrievalModeDistribution && typeof evaluation.retrievalModeDistribution === "object" && !Array.isArray(evaluation.retrievalModeDistribution), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.retrievalModeDistribution must be an object");
  const allowedRetrievalModes = new Set(["KEYWORD", "HYBRID", "SEMANTIC_FALLBACK", "STABLE_FALLBACK", "NO_CONTEXT"]);
  let distributionTotal = 0;
  for (const [mode, count] of Object.entries(evaluation.retrievalModeDistribution)) {
    assert(allowedRetrievalModes.has(mode), `PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.retrievalModeDistribution.${mode} is not allowed`);
    assert(Number.isInteger(count) && count >= 0, `PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.retrievalModeDistribution.${mode} must be a non-negative integer`);
    distributionTotal += count;
  }
  assert(distributionTotal === evaluation.evaluatedCount, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation retrievalModeDistribution total must match evaluatedCount");
  assert(evaluation.retrievalModeDistribution.SEMANTIC_FALLBACK === evaluation.semanticFallbackHits, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation SEMANTIC_FALLBACK count must match semanticFallbackHits");
  assert(evaluation.llmSetup && typeof evaluation.llmSetup === "object" && !Array.isArray(evaluation.llmSetup), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.llmSetup must be an object");
  assert(evaluation.llmSetup.status === "OK", "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.llmSetup.status must be OK");
  assert(evaluation.llmCleanup && typeof evaluation.llmCleanup === "object" && !Array.isArray(evaluation.llmCleanup), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.llmCleanup must be an object");
  assert(evaluation.llmCleanup.status === "OK", "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.llmCleanup.status must be OK");
  assert(Array.isArray(evaluation.cases), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.cases must be an array");
  assert(evaluation.cases.length === evaluation.sampleCount, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.cases length must match sampleCount");

  let semanticFallbackCaseCount = 0;
  let intentRoleBoundCaseCount = 0;
  let lowKeywordCaseCount = 0;
  for (const sample of evaluation.cases) {
    assert(sample && typeof sample === "object" && !Array.isArray(sample), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case must be an object");
    assert(typeof sample.sampleId === "string" && sample.sampleId.trim(), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.sampleId must be present");
    assert(typeof sample.question === "string" && sample.question.trim(), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.question must be present");
    assert(typeof sample.intent === "string" && sample.intent.trim(), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.intent must be present");
    assert(sample.responseStatus === "OK", "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.responseStatus must be OK");
    assert(sample.scanTaskId === parentPayload.scanTaskId, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.scanTaskId must match scanTaskId");
    assert(allowedRetrievalModes.has(sample.retrievalMode), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.retrievalMode must be allowed");
    assert(Number.isInteger(sample.resultCount) && sample.resultCount >= 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.resultCount must be a non-negative integer");
    assert(Number.isInteger(sample.matchedChunks) && sample.matchedChunks >= 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.matchedChunks must be a non-negative integer");
    assert(Number.isInteger(sample.embeddedChunks) && sample.embeddedChunks > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.embeddedChunks must be positive");
    assert(Number.isInteger(sample.totalChunks) && sample.totalChunks >= sample.embeddedChunks, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.totalChunks must be >= embeddedChunks");
    assertRawRetrievedChunkContentAbsent(sample, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case");
    assert(typeof sample.intentRoleBoundPrimary === "boolean", "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.intentRoleBoundPrimary must be boolean");
    if (sample.intentRoleBoundPrimary) {
      intentRoleBoundCaseCount += 1;
      assert(Array.isArray(sample.expectedFallbackPrimaryRoles) && sample.expectedFallbackPrimaryRoles.length > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation role-bound case must declare expectedFallbackPrimaryRoles");
      assert(sample.primary && typeof sample.primary === "object" && !Array.isArray(sample.primary), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation role-bound case.primary must be an object");
      assert(sample.expectedFallbackPrimaryRoles.includes(sample.primary.representativeFallbackRole), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation role-bound primary role must match expectedFallbackPrimaryRoles");
      const plan = sample.retrievalPlan || {};
      const planRoles = Array.isArray(plan.roleIntents) && plan.roleIntents.length ? plan.roleIntents : plan.fallbackRolePriority;
      assert(Array.isArray(planRoles) && planRoles.length > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation role-bound case retrievalPlan roles must be present");
      assert(sample.expectedFallbackPrimaryRoles.includes(planRoles[0]), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation role-bound case retrievalPlan first role must match expectedFallbackPrimaryRoles");
    }
    if (sample.matchedChunks < evaluation.weakKeywordThreshold) {
      lowKeywordCaseCount += 1;
    }

    if (sample.retrievalMode === "SEMANTIC_FALLBACK") {
      semanticFallbackCaseCount += 1;
      assert(sample.matchedChunks === 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation SEMANTIC_FALLBACK case.matchedChunks must be 0");
      assert(sample.resultCount > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation SEMANTIC_FALLBACK case.resultCount must be positive");
      assertCurrentScanOnly(sample.retrievedChunkScanTaskIds, parentPayload.scanTaskId, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.retrievedChunkScanTaskIds");
      assert(["NO_KEYWORD", "WEAK_LT_45"].includes(sample.thresholdBucket), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation SEMANTIC_FALLBACK case.thresholdBucket must be NO_KEYWORD or WEAK_LT_45");
      assert(sample.observation === "SEMANTIC_AVAILABLE", "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation SEMANTIC_FALLBACK case.observation must be SEMANTIC_AVAILABLE");
      assert(sample.primary && typeof sample.primary === "object" && !Array.isArray(sample.primary), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation SEMANTIC_FALLBACK case.primary must be an object");
      assertSafeEvidencePath(sample.primary.filePath, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.primary.filePath");
      assert(Number.isInteger(sample.primary.startLine) && sample.primary.startLine > 0, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.primary.startLine must be positive");
      assert(Number.isInteger(sample.primary.endLine) && sample.primary.endLine >= sample.primary.startLine, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.primary.endLine must be >= startLine");
      assert(sample.primary.hasEmbedding === true, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.primary.hasEmbedding must be true");
      assert(sample.primary.contextRole === "PRIMARY", "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation case.primary.contextRole must be PRIMARY");
    }
  }
  assert(semanticFallbackCaseCount === evaluation.semanticFallbackHits, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation semantic fallback case count must match semanticFallbackHits");
  assert(intentRoleBoundCaseCount === evaluation.intentRoleBoundHits, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation intent role-bound case count must match intentRoleBoundHits");
  assert(lowKeywordCaseCount === evaluation.lowKeywordCases, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation low keyword case count must match lowKeywordCases");
  assert(evaluation.rawRetrievedChunkContentAbsentCaseCount === evaluation.cases.filter((sample) => sample.rawRetrievedChunkContentAbsent === true).length, "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.rawRetrievedChunkContentAbsentCaseCount must match cases");
  assert(evaluation.maxContentPreviewLength === Math.max(...evaluation.cases.map((sample) => sample.contentPreviewMaxLength)), "PUBLIC_REPO_SMOKE_OK projectQaWeakKeywordEvaluation.maxContentPreviewLength must match cases");
}

if (Object.prototype.hasOwnProperty.call(payload, "projectQaWeakKeywordEvaluation")) {
  validateProjectQaWeakKeywordEvaluation(payload.projectQaWeakKeywordEvaluation, payload);
}

function validateSemanticWeakKeywordProbe(probe, parentPayload) {
  const label = "PUBLIC_REPO_SMOKE_OK semanticWeakKeywordProbe";
  assert(probe && typeof probe === "object" && !Array.isArray(probe), `${label} must be an object`);
  assertNoSensitiveMaterial(probe, label);
  assert(probe.status === "OK", `${label}.status must be OK`);
  assert(probe.probeKind === "NO_KEYWORD_SEMANTIC_POOL", `${label}.probeKind must be NO_KEYWORD_SEMANTIC_POOL`);
  assert(["auto", "true"].includes(probe.mode), `${label}.mode must be auto or true`);
  assert(probe.retrievalMode === "SEMANTIC_FALLBACK", `${label}.retrievalMode must be SEMANTIC_FALLBACK`);
  assert(probe.groundingStatus === "VERIFIED", `${label}.groundingStatus must be VERIFIED`);
  assert(["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_CITED"].includes(probe.citationEnforcementStatus), `${label}.citationEnforcementStatus must prove citation enforcement`);
  assertRawRetrievedChunkContentAbsent(probe, label);
  assert(Number.isInteger(probe.resultCount) && probe.resultCount > 0, `${label}.resultCount must be positive`);
  assert(Number.isInteger(probe.totalChunks) && probe.totalChunks > 0, `${label}.totalChunks must be positive`);
  assert(Number.isInteger(probe.embeddedChunks) && probe.embeddedChunks > 0 && probe.embeddedChunks <= probe.totalChunks, `${label}.embeddedChunks must be within totalChunks`);
  assert(typeof probe.embeddingCoverage === "number" && probe.embeddingCoverage > 0 && probe.embeddingCoverage <= 100, `${label}.embeddingCoverage must be within 0..100`);
  assert(Number.isInteger(probe.semanticPoolLimit) && probe.semanticPoolLimit === 500, `${label}.semanticPoolLimit must be 500`);
  assert(Number.isInteger(probe.defaultPoolSize) && probe.defaultPoolSize === probe.semanticPoolLimit, `${label}.defaultPoolSize must match semanticPoolLimit`);
  assert(probe.poolCapEngaged === true, `${label}.poolCapEngaged must be true`);
  assert(probe.capRecommendation === "DISTRIBUTED_WINDOWS", `${label}.capRecommendation must be DISTRIBUTED_WINDOWS`);
  assert(probe.thresholdRecommendation === "NEEDS_WEAK_KEYWORD_SAMPLE", `${label}.thresholdRecommendation must be NEEDS_WEAK_KEYWORD_SAMPLE`);
  assert(Number.isInteger(probe.weakKeywordThreshold) && probe.weakKeywordThreshold === 45, `${label}.weakKeywordThreshold must be 45`);
  assert(Number.isInteger(probe.targetRank) && probe.targetRank > probe.semanticPoolLimit, `${label}.targetRank must prove an beyond-head semantic target`);
  assert(Number.isInteger(probe.targetOffset) && probe.targetOffset >= probe.semanticPoolLimit, `${label}.targetOffset must prove an beyond-head semantic target`);
  assert(Number.isInteger(probe.matchedChunks) && probe.matchedChunks === 0, `${label}.matchedChunks must be 0 for no-keyword semantic probe`);

  const plan = probe.retrievalPlan;
  assert(plan && typeof plan === "object" && !Array.isArray(plan), `${label}.retrievalPlan must be an object`);
  assert(plan.semanticPlanReason === "LOW_EMBEDDING_COVERAGE", `${label}.retrievalPlan.semanticPlanReason must be LOW_EMBEDDING_COVERAGE`);
  assert(plan.semanticPoolAttempted === true, `${label}.retrievalPlan.semanticPoolAttempted must be true`);
  assert(plan.semanticPoolStrategy === "HEAD_DISTRIBUTED_WINDOWS", `${label}.retrievalPlan.semanticPoolStrategy must be HEAD_DISTRIBUTED_WINDOWS`);
  assert(plan.semanticPoolTruncated === true, `${label}.retrievalPlan.semanticPoolTruncated must be true`);
  assert(Number.isInteger(plan.semanticPoolLimit) && plan.semanticPoolLimit === probe.semanticPoolLimit, `${label}.retrievalPlan.semanticPoolLimit must match probe`);
  assert(Number.isInteger(plan.semanticPoolLoadedCount) && plan.semanticPoolLoadedCount === probe.semanticPoolLimit, `${label}.retrievalPlan.semanticPoolLoadedCount must equal semanticPoolLimit`);
  assert(Number.isInteger(plan.semanticPoolCoveragePercent) && plan.semanticPoolCoveragePercent > 0 && plan.semanticPoolCoveragePercent <= 100, `${label}.retrievalPlan.semanticPoolCoveragePercent must be 1..100`);
  assert(plan.semanticReadinessStatus === "DEGRADED", `${label}.retrievalPlan.semanticReadinessStatus must be DEGRADED`);
  assert(
    ["LOW_EMBEDDING_COVERAGE", "PARTIAL_EMBEDDING_COVERAGE", "SEMANTIC_POOL_TRUNCATED"].includes(plan.semanticReadinessReason),
    `${label}.retrievalPlan.semanticReadinessReason must explain degraded semantic readiness`
  );

  const primary = probe.retrievedPrimary;
  assert(primary && typeof primary === "object" && !Array.isArray(primary), `${label}.retrievedPrimary must be an object`);
  assertSafeEvidencePath(primary.filePath, `${label}.retrievedPrimary.filePath`);
  assert(Number.isInteger(primary.startLine) && primary.startLine > 0, `${label}.retrievedPrimary.startLine must be positive`);
  assert(Number.isInteger(primary.endLine) && primary.endLine >= primary.startLine, `${label}.retrievedPrimary.endLine must cover startLine`);
  assert(primary.contextRole === "PRIMARY", `${label}.retrievedPrimary.contextRole must be PRIMARY`);
  assert(primary.hasEmbedding === true, `${label}.retrievedPrimary.hasEmbedding must be true`);
  assert(Number.isInteger(primary.embeddedEvidenceCount) && primary.embeddedEvidenceCount > 0, `${label}.retrievedPrimary.embeddedEvidenceCount must be positive`);
}

if (requireUiSmoke) {
  assert(uiMatches.length === 1, "expected exactly one PUBLIC_REPO_UI_SMOKE_OK marker");

  const uiPayload = parseMarker(uiMatches[0], uiPrefix, "PUBLIC_REPO_UI_SMOKE_OK");
  assertNoSensitiveMaterial(uiPayload, "PUBLIC_REPO_UI_SMOKE_OK");
  assertPositiveIntegerPayload(uiPayload, "PUBLIC_REPO_UI_SMOKE_OK");

  for (const field of ["projectId", "repositoryId", "scanTaskId"]) {
    assert(uiPayload[field] === payload[field], `PUBLIC_REPO_UI_SMOKE_OK ${field} must match PUBLIC_REPO_SMOKE_OK ${field}`);
  }

  assert(uiPayload.realBackend === true, "PUBLIC_REPO_UI_SMOKE_OK realBackend must be true");
  assert(uiPayload.mockedApi === false, "PUBLIC_REPO_UI_SMOKE_OK mockedApi must be false");
  assertSafeEvidenceFile(uiPayload.expectedEvidenceFile, "PUBLIC_REPO_UI_SMOKE_OK expectedEvidenceFile");
  assertRequiredStringSet(uiPayload.viewports, ["1440x900", "390x844", "320x740"], "PUBLIC_REPO_UI_SMOKE_OK viewports");
	  assertRequiredStringSet(uiPayload.pages, [
	    "ProjectDetail",
	    "ScanTaskDetail",
	    "Report Recommended Next Step",
	    "Scan Governance Timeline",
	    "Report Evidence Drawer",
	    "ProjectDetail QA",
	    "ProjectDetail Graph",
	    "Artifacts",
    "AuditLogs",
    "AutoRepair candidate",
  ], "PUBLIC_REPO_UI_SMOKE_OK pages");

  const evidenceDrawer = uiPayload.evidenceDrawer;
  assert(evidenceDrawer && typeof evidenceDrawer === "object" && !Array.isArray(evidenceDrawer), "PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer must be an object");
  assert(evidenceDrawer.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer.status must be OK");
  assert(evidenceDrawer.opened === true, "PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer.opened must be true");
  assert(evidenceDrawer.codeChunksSummaryVisible === true, "PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer.codeChunksSummaryVisible must be true");
  assert(evidenceDrawer.displayedChunk === true, "PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer.displayedChunk must be true");
  assert(evidenceDrawer.scanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer.scanTaskId must match PUBLIC_REPO_SMOKE_OK scanTaskId");
  assert(evidenceDrawer.limit === 3, "PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer.limit must be 3");
  assert(Number.isInteger(evidenceDrawer.resultCount) && evidenceDrawer.resultCount > 0, "PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer.resultCount must be positive");
	  assertSafeEvidenceFile(evidenceDrawer.expectedEvidenceFile, "PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer.expectedEvidenceFile");
	  assert(evidenceDrawer.expectedEvidenceFile === uiPayload.expectedEvidenceFile, "PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer.expectedEvidenceFile must match top-level expectedEvidenceFile");

	  const recommendedNextStep = uiPayload.recommendedNextStep;
	  assert(recommendedNextStep && typeof recommendedNextStep === "object" && !Array.isArray(recommendedNextStep), "PUBLIC_REPO_UI_SMOKE_OK recommendedNextStep must be an object");
	  assert(recommendedNextStep.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK recommendedNextStep.status must be OK");
	  assert(recommendedNextStep.visible === true, "PUBLIC_REPO_UI_SMOKE_OK recommendedNextStep.visible must be true");
	  assert(recommendedNextStep.primaryActionVisible === true, "PUBLIC_REPO_UI_SMOKE_OK recommendedNextStep.primaryActionVisible must be true");
	  assert(recommendedNextStep.secondaryActionVisible === true, "PUBLIC_REPO_UI_SMOKE_OK recommendedNextStep.secondaryActionVisible must be true");
	  assertRequiredStringSet(recommendedNextStep.keys, [], "PUBLIC_REPO_UI_SMOKE_OK recommendedNextStep.keys");
	  assert(recommendedNextStep.keys.length > 0, "PUBLIC_REPO_UI_SMOKE_OK recommendedNextStep.keys must be non-empty");
	  const allowedRecommendedStepKeys = new Set([
	    "recover-failed-scan",
	    "watch-running-scan",
	    "repair-high-risk-file",
	    "locate-project-risk",
	    "complete-evidence-bundle",
	    "inspect-code-chunks",
	    "repair-file-bound-risk",
	    "qa-review-ready-report",
	  ]);
	  for (const stepKey of recommendedNextStep.keys) {
	    assert(allowedRecommendedStepKeys.has(stepKey), `PUBLIC_REPO_UI_SMOKE_OK recommendedNextStep.keys.${stepKey} is not allowed`);
	  }
	  assertRequiredStringSet(recommendedNextStep.titles, [], "PUBLIC_REPO_UI_SMOKE_OK recommendedNextStep.titles");
	  assert(recommendedNextStep.titles.length > 0, "PUBLIC_REPO_UI_SMOKE_OK recommendedNextStep.titles must be non-empty");

	  const codeKnowledge = uiPayload.codeKnowledge;
	  assert(codeKnowledge && typeof codeKnowledge === "object" && !Array.isArray(codeKnowledge), "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge must be an object");
	  assert(codeKnowledge.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.status must be OK");
	  assert(codeKnowledge.scanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.scanTaskId must match PUBLIC_REPO_SMOKE_OK scanTaskId");
	  assert(codeKnowledge.responseStatus === 200, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.responseStatus must be 200");
	  assert(Number.isInteger(codeKnowledge.resultCount) && codeKnowledge.resultCount > 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.resultCount must be positive");
	  assert(Number.isInteger(codeKnowledge.totalChunks) && codeKnowledge.totalChunks > 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.totalChunks must be positive");
	  assert(Number.isInteger(codeKnowledge.embeddedChunks) && codeKnowledge.embeddedChunks >= 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.embeddedChunks must be a non-negative integer");
	  assert(codeKnowledge.embeddedChunks <= codeKnowledge.totalChunks, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.embeddedChunks must be <= totalChunks");
	  assertRequiredStringSet(codeKnowledge.retrievalModes, [], "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.retrievalModes");
	  const allowedUiRetrievalModes = new Set(["KEYWORD", "HYBRID", "SEMANTIC_FALLBACK", "STABLE_FALLBACK"]);
	  assert(codeKnowledge.retrievalModes.length > 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.retrievalModes must be non-empty");
	  for (const mode of codeKnowledge.retrievalModes) {
	    assert(allowedUiRetrievalModes.has(mode), `PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.retrievalModes.${mode} is not allowed`);
	  }
	  assertRequiredStringSet(codeKnowledge.readiness, [], "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.readiness");
	  const allowedUiReadiness = new Set(["READY", "REVIEW"]);
	  assert(codeKnowledge.readiness.length > 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.readiness must be non-empty");
	  for (const readiness of codeKnowledge.readiness) {
	    assert(allowedUiReadiness.has(readiness), `PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.readiness.${readiness} is not allowed`);
	  }
	  assert(Number.isInteger(codeKnowledge.minConfidence) && codeKnowledge.minConfidence >= 0 && codeKnowledge.minConfidence <= 100, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.minConfidence must be 0..100");
	  assert(Number.isInteger(codeKnowledge.uniqueFiles) && codeKnowledge.uniqueFiles > 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.uniqueFiles must be positive");
	  assertRequiredStringSet(codeKnowledge.dominantEvidenceTypes, [], "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.dominantEvidenceTypes");
	  assert(codeKnowledge.dominantEvidenceTypes.length > 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.dominantEvidenceTypes must be non-empty");
	  assert(codeKnowledge.evidenceProfileVisible === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.evidenceProfileVisible must be true");
	  assert(codeKnowledge.currentScanOnly === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.currentScanOnly must be true");
	  assert(codeKnowledge.sourceLabelsVisible === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.sourceLabelsVisible must be true");
	  assert(codeKnowledge.filePathsVisible === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.filePathsVisible must be true");
	  assert(codeKnowledge.expectedEvidenceFileVisible === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.expectedEvidenceFileVisible must be true");
	  assert(codeKnowledge.fileStatsVisible === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.fileStatsVisible must be true");
	  assert(codeKnowledge.readinessUsable === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.readinessUsable must be true");
	  assertRequiredStringSet(codeKnowledge.contextRoles, ["PRIMARY"], "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.contextRoles");
	  assertRequiredStringSet(codeKnowledge.evidenceTypes, [], "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.evidenceTypes");
	  assert(codeKnowledge.evidenceTypes.length > 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.evidenceTypes must be non-empty");
	  const crossFileEvidence = codeKnowledge.crossFileEvidence;
	  const allowedCrossFileReadiness = new Set(["READY", "REVIEW", "GAP"]);
	  assert(crossFileEvidence && typeof crossFileEvidence === "object" && !Array.isArray(crossFileEvidence), "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence must be an object");
	  assert(crossFileEvidence.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.status must be OK");
	  assert(crossFileEvidence.endpoint === `/api/projects/${payload.projectId}/code-chunks/search`, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.endpoint must match code-chunks search");
	  assert(crossFileEvidence.query === "", "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.query must be empty broad probe");
	  assert(crossFileEvidence.limit === 24, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.limit must be 24");
	  assert(crossFileEvidence.responseStatus === 200, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.responseStatus must be 200");
	  assert(crossFileEvidence.scanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.scanTaskId must match PUBLIC_REPO_SMOKE_OK scanTaskId");
	  assert(Number.isInteger(crossFileEvidence.resultCount) && crossFileEvidence.resultCount >= 2, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.resultCount must be at least 2");
	  assert(Number.isInteger(crossFileEvidence.totalChunks) && crossFileEvidence.totalChunks > 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.totalChunks must be positive");
	  assert(Number.isInteger(crossFileEvidence.uniqueFiles) && crossFileEvidence.uniqueFiles >= 2, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.uniqueFiles must be at least 2");
	  assert(crossFileEvidence.currentScanOnly === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.currentScanOnly must be true");
	  assert(crossFileEvidence.fileStatsVisible === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.fileStatsVisible must be true");
	  assert(Number.isInteger(crossFileEvidence.fileStatsUniqueFiles) && crossFileEvidence.fileStatsUniqueFiles >= 2, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.fileStatsUniqueFiles must be at least 2");
	  assert(crossFileEvidence.sourceLabelsVisible === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.sourceLabelsVisible must be true");
	  assertRequiredStringSet(crossFileEvidence.retrievalModes, [], "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.retrievalModes");
	  assert(crossFileEvidence.retrievalModes.length > 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.retrievalModes must be non-empty");
	  for (const mode of crossFileEvidence.retrievalModes) {
	    assert(allowedUiRetrievalModes.has(mode), `PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.retrievalModes.${mode} is not allowed`);
	  }
	  assertRequiredStringSet(crossFileEvidence.readiness, [], "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.readiness");
	  assert(crossFileEvidence.readiness.length > 0, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.readiness must be non-empty");
	  for (const readiness of crossFileEvidence.readiness) {
	    assert(allowedCrossFileReadiness.has(readiness), `PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.readiness.${readiness} is not allowed`);
	  }
	  assert(crossFileEvidence.minFileEvidenceSatisfied === true, "PUBLIC_REPO_UI_SMOKE_OK codeKnowledge.crossFileEvidence.minFileEvidenceSatisfied must be true");

	  assertCodeUnderstandingLens(
	    uiPayload.codeUnderstandingLens,
	    "PUBLIC_REPO_UI_SMOKE_OK codeUnderstandingLens",
	    payload.scanTaskId,
	    uiPayload.expectedEvidenceFile
	  );

	  const qaFromEvidence = uiPayload.qaFromEvidence;
	  assert(qaFromEvidence && typeof qaFromEvidence === "object" && !Array.isArray(qaFromEvidence), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence must be an object");
	  assert(qaFromEvidence.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.status must be OK");
	  assert(qaFromEvidence.scanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.scanTaskId must match PUBLIC_REPO_SMOKE_OK scanTaskId");
	  assert(qaFromEvidence.responseStatus === 200, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.responseStatus must be 200");
	  assert(Number.isInteger(qaFromEvidence.resultCount) && qaFromEvidence.resultCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.resultCount must be positive");
	  assert(Number.isInteger(qaFromEvidence.citationCount) && qaFromEvidence.citationCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCount must be positive");
	  assert(Number.isInteger(qaFromEvidence.citedChunkCount) && qaFromEvidence.citedChunkCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citedChunkCount must be positive");
	  const qaFromEvidenceCoverage = qaFromEvidence.citationCoverage;
	  assert(qaFromEvidenceCoverage && typeof qaFromEvidenceCoverage === "object" && !Array.isArray(qaFromEvidenceCoverage), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage must be an object");
	  assertRequiredStringSet(qaFromEvidenceCoverage.statuses, [], "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.statuses");
	  assert(qaFromEvidenceCoverage.statuses.length > 0 && qaFromEvidenceCoverage.statuses.every((status) => ["FULL", "REQUIRED_FULL", "PARTIAL"].includes(status)), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.statuses must be FULL/REQUIRED_FULL/PARTIAL");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minCoveragePercent) && qaFromEvidenceCoverage.minCoveragePercent > 0 && qaFromEvidenceCoverage.minCoveragePercent <= 100, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minCoveragePercent must be 1..100");
	  assert(qaFromEvidenceCoverage.minTotalEvidenceCount === qaFromEvidence.citationCount, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minTotalEvidenceCount must match citationCount");
	  assert(qaFromEvidenceCoverage.minCitedEvidenceCount === qaFromEvidence.citedChunkCount, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minCitedEvidenceCount must match citedChunkCount");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minUncitedCandidateCount) && qaFromEvidenceCoverage.minUncitedCandidateCount >= 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minUncitedCandidateCount must be non-negative");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minRepairCandidateCount) && qaFromEvidenceCoverage.minRepairCandidateCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minRepairCandidateCount must be positive");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minRequiredEvidenceCoveragePercent) && qaFromEvidenceCoverage.minRequiredEvidenceCoveragePercent >= 100, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minRequiredEvidenceCoveragePercent must be at least 100");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minRequiredEvidenceCount) && qaFromEvidenceCoverage.minRequiredEvidenceCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minRequiredEvidenceCount must be positive");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minCitedRequiredEvidenceCount) && qaFromEvidenceCoverage.minCitedRequiredEvidenceCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minCitedRequiredEvidenceCount must be positive");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minUniqueEvidenceFileCount) && qaFromEvidenceCoverage.minUniqueEvidenceFileCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minUniqueEvidenceFileCount must be positive");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minCitedEvidenceFileCount) && qaFromEvidenceCoverage.minCitedEvidenceFileCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minCitedEvidenceFileCount must be positive");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minPrimaryEvidenceFileCount) && qaFromEvidenceCoverage.minPrimaryEvidenceFileCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minPrimaryEvidenceFileCount must be positive");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minCitedPrimaryEvidenceFileCount) && qaFromEvidenceCoverage.minCitedPrimaryEvidenceFileCount >= qaFromEvidenceCoverage.minPrimaryEvidenceFileCount, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minCitedPrimaryEvidenceFileCount must cover primary files");
	  assert(Number.isInteger(qaFromEvidenceCoverage.maxUncitedPrimaryEvidenceCount) && qaFromEvidenceCoverage.maxUncitedPrimaryEvidenceCount === 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.maxUncitedPrimaryEvidenceCount must be 0");
	  assert(Number.isInteger(qaFromEvidenceCoverage.maxUncitedPrimaryEvidenceFileCount) && qaFromEvidenceCoverage.maxUncitedPrimaryEvidenceFileCount === 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.maxUncitedPrimaryEvidenceFileCount must be 0");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minContextEvidenceFileCount) && qaFromEvidenceCoverage.minContextEvidenceFileCount >= 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minContextEvidenceFileCount must be non-negative");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minCitedContextEvidenceFileCount) && qaFromEvidenceCoverage.minCitedContextEvidenceFileCount >= 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minCitedContextEvidenceFileCount must be non-negative");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minUncitedContextEvidenceCount) && qaFromEvidenceCoverage.minUncitedContextEvidenceCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minUncitedContextEvidenceCount must be positive");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minUncitedContextEvidenceFileCount) && qaFromEvidenceCoverage.minUncitedContextEvidenceFileCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minUncitedContextEvidenceFileCount must be positive");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minRequiredEvidenceFileCount) && qaFromEvidenceCoverage.minRequiredEvidenceFileCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minRequiredEvidenceFileCount must be positive");
	  assert(Number.isInteger(qaFromEvidenceCoverage.minCitedRequiredEvidenceFileCount) && qaFromEvidenceCoverage.minCitedRequiredEvidenceFileCount >= qaFromEvidenceCoverage.minRequiredEvidenceFileCount, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.minCitedRequiredEvidenceFileCount must cover required files");
	  assertRequiredCoverageScopes(qaFromEvidenceCoverage.coverageScopes, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.coverageScopes");
	  assertEvidenceRoleDistribution(qaFromEvidenceCoverage.evidenceRoleDistribution, qaFromEvidenceCoverage, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationCoverage.evidenceRoleDistribution", "verified");
	  assertReadyClaimCitationCoverage(qaFromEvidence.claimCitationCoverage, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationCoverage");
	  assertCrossFileCitationSummary(qaFromEvidence.crossFileCitationSummary, qaFromEvidenceCoverage, qaFromEvidence.claimCitationCoverage, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.crossFileCitationSummary", "verified");
	  assert(qaFromEvidence.crossFileCitationSummary.contextGapVisible === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.crossFileCitationSummary.contextGapVisible must be true");
	  const uiClaimCitationNoiseBoundary = qaFromEvidence.claimCitationNoiseBoundary;
	  assert(uiClaimCitationNoiseBoundary && typeof uiClaimCitationNoiseBoundary === "object" && !Array.isArray(uiClaimCitationNoiseBoundary), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary must be an object");
	  assertNoSensitiveMaterial(uiClaimCitationNoiseBoundary, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary");
	  assert(uiClaimCitationNoiseBoundary.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.status must be OK");
	  assert(uiClaimCitationNoiseBoundary.surface === "PUBLIC_REPO_UI_CLAIM_CITATION_NOISE_BOUNDARY", "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.surface must prove UI claim citation noise boundary");
	  assert(uiClaimCitationNoiseBoundary.scanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.scanTaskId must match scanTaskId");
	  assert(uiClaimCitationNoiseBoundary.requestScanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.requestScanTaskId must match scanTaskId");
	  assert(uiClaimCitationNoiseBoundary.responseScanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.responseScanTaskId must match scanTaskId");
	  assert(uiClaimCitationNoiseBoundary.currentScanOnly === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.currentScanOnly must be true");
	  assert(Number.isInteger(uiClaimCitationNoiseBoundary.requestCount) && uiClaimCitationNoiseBoundary.requestCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.requestCount must be positive");
	  assert(uiClaimCitationNoiseBoundary.responseStatus === 200, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.responseStatus must be 200");
	  assert(Number.isInteger(uiClaimCitationNoiseBoundary.resultCount) && uiClaimCitationNoiseBoundary.resultCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.resultCount must be positive");
	  assert(Number.isInteger(uiClaimCitationNoiseBoundary.citationCount) && uiClaimCitationNoiseBoundary.citationCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.citationCount must be positive");
	  assertRequiredStringSet(uiClaimCitationNoiseBoundary.noiseKinds, ["exception-line", "fenced-code", "inline-code", "timestamp-log"], "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.noiseKinds");
	  assertRequiredStringSet(uiClaimCitationNoiseBoundary.groundingStatuses, [], "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.groundingStatuses");
	  assert(uiClaimCitationNoiseBoundary.groundingStatuses.length > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.groundingStatuses must be non-empty");
	  assert(uiClaimCitationNoiseBoundary.groundingStatuses.every((status) => ["UNVERIFIED", "PARTIAL"].includes(status)), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.groundingStatuses must not claim VERIFIED");
	  assertRequiredStringSet(uiClaimCitationNoiseBoundary.citationEnforcementStatuses, ["RETRY_FAILED"], "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.citationEnforcementStatuses");
	  assert(uiClaimCitationNoiseBoundary.citationEnforcementStatuses.length === 1, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.citationEnforcementStatuses must contain exactly RETRY_FAILED");
	  assert(uiClaimCitationNoiseBoundary.coverageStatus === "NONE", "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.coverageStatus must be NONE");
	  assert(uiClaimCitationNoiseBoundary.maxCitedEvidenceCount === 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.maxCitedEvidenceCount must be 0");
	  assert(uiClaimCitationNoiseBoundary.maxRepairCandidateCount === 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.maxRepairCandidateCount must be 0");
	  assert(uiClaimCitationNoiseBoundary.claimCitationStatus === "REVIEW", "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.claimCitationStatus must be REVIEW");
	  assert(uiClaimCitationNoiseBoundary.maxCitedRequiredClaimCount === 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.maxCitedRequiredClaimCount must be 0");
	  assert(uiClaimCitationNoiseBoundary.maxInvalidCitationClaimCount === 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.maxInvalidCitationClaimCount must be 0");
	  assert(uiClaimCitationNoiseBoundary.roleDistributionStatus === "REVIEW_UNCITED", "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.roleDistributionStatus must be REVIEW_UNCITED");
	  assert(uiClaimCitationNoiseBoundary.maxRequiredPrimaryBoundClaimCount === 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.maxRequiredPrimaryBoundClaimCount must be 0");
	  assert(uiClaimCitationNoiseBoundary.answerCitationsCitedByAnswer === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.answerCitationsCitedByAnswer must be false");
	  assert(uiClaimCitationNoiseBoundary.trustSummaryReadyVisible === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.trustSummaryReadyVisible must be false");
	  assert(uiClaimCitationNoiseBoundary.repairCandidateActionVisible === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.repairCandidateActionVisible must be false");
	  assert(uiClaimCitationNoiseBoundary.repairEvidenceGateBlockedVisible === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.repairEvidenceGateBlockedVisible must be true");
	  assert(uiClaimCitationNoiseBoundary.evidenceRefRequestBound === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.evidenceRefRequestBound must be true");
	  assert(uiClaimCitationNoiseBoundary.evidenceRefResponseBound === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.evidenceRefResponseBound must be true");
	  assert(uiClaimCitationNoiseBoundary.rawAnswerStored === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.rawAnswerStored must be false");
	  assert(uiClaimCitationNoiseBoundary.rawPromptStored === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.rawPromptStored must be false");
	  for (const field of ["rawAnswer", "rawPrompt", "content", "stack", "log", "sourceContent"]) {
	    assert(!Object.prototype.hasOwnProperty.call(uiClaimCitationNoiseBoundary, field), `PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary must not contain ${field}`);
	  }
	  assert(uiClaimCitationNoiseBoundary.providerQualityClaim === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.providerQualityClaim must be false");
	  assert(uiClaimCitationNoiseBoundary.llmFactClaim === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.llmFactClaim must be false");
	  assert(uiClaimCitationNoiseBoundary.noHorizontalOverflow === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.noHorizontalOverflow must be true");
	  assert(uiClaimCitationNoiseBoundary.llmSetup && uiClaimCitationNoiseBoundary.llmSetup.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.llmSetup.status must be OK");
	  assert(uiClaimCitationNoiseBoundary.llmCleanup && uiClaimCitationNoiseBoundary.llmCleanup.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationNoiseBoundary.llmCleanup.status must be OK");
	  assert(Array.isArray(qaFromEvidence.groundingStatuses) && qaFromEvidence.groundingStatuses.length > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.groundingStatuses must be a non-empty array");
	  assert(qaFromEvidence.groundingStatuses.every((status) => status === "VERIFIED"), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.groundingStatuses must prove cited answers");
	  assert(Array.isArray(qaFromEvidence.citationEnforcementStatuses) && qaFromEvidence.citationEnforcementStatuses.length > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationEnforcementStatuses must be a non-empty array");
	  assert(qaFromEvidence.citationEnforcementStatuses.every((status) => ["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_CITED"].includes(status)), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationEnforcementStatuses must prove citation enforcement");
	  assert(Array.isArray(qaFromEvidence.citationEnforcementReasons) && qaFromEvidence.citationEnforcementReasons.length > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationEnforcementReasons must be a non-empty array");
		  assert(qaFromEvidence.citationEnforcementReasons.every((reason) => ["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_PRIMARY_CITED"].includes(reason)), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.citationEnforcementReasons must prove successful citation enforcement reasons");
		  if (Object.prototype.hasOwnProperty.call(qaFromEvidence, "relationAwareEvidenceReason")) {
		    assertPublicRepoUiRelationAwareEvidenceReason(qaFromEvidence.relationAwareEvidenceReason, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.relationAwareEvidenceReason");
		  }
		  assert(qaFromEvidence.expectedEvidenceFileVisible === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.expectedEvidenceFileVisible must be true");
	  assert(qaFromEvidence.evidenceRef && typeof qaFromEvidence.evidenceRef === "object" && !Array.isArray(qaFromEvidence.evidenceRef), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.evidenceRef must be an object");
	  assert(qaFromEvidence.evidenceRef.requestBound === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.evidenceRef.requestBound must be true");
	  assert(qaFromEvidence.evidenceRef.responseBound === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.evidenceRef.responseBound must be true");
	  assert(qaFromEvidence.evidenceRef.contextVisible === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.evidenceRef.contextVisible must be true");
	  assertSafeEvidencePath(qaFromEvidence.evidenceRef.filePath, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.evidenceRef.filePath");
	  const startEndOnlyEvidenceRef = qaFromEvidence.startEndOnlyEvidenceRef;
	  assert(startEndOnlyEvidenceRef && typeof startEndOnlyEvidenceRef === "object" && !Array.isArray(startEndOnlyEvidenceRef), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef must be an object");
	  assertNoSensitiveMaterial(startEndOnlyEvidenceRef, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef");
	  assert(startEndOnlyEvidenceRef.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.status must be OK");
	  assert(startEndOnlyEvidenceRef.surface === "PUBLIC_REPO_UI_QA_START_END_ONLY_EVIDENCE_REF", "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.surface must prove start/end-only evidenceRef");
	  assert(startEndOnlyEvidenceRef.scanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.scanTaskId must match scanTaskId");
	  assert(startEndOnlyEvidenceRef.requestScanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.requestScanTaskId must match scanTaskId");
	  assert(startEndOnlyEvidenceRef.responseScanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.responseScanTaskId must match scanTaskId");
	  assert(startEndOnlyEvidenceRef.responseStatus === 200, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.responseStatus must be 200");
	  assertSafeEvidencePath(startEndOnlyEvidenceRef.filePath, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.filePath");
	  assert(Number.isInteger(startEndOnlyEvidenceRef.startLine) && startEndOnlyEvidenceRef.startLine > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.startLine must be positive");
	  assert(Number.isInteger(startEndOnlyEvidenceRef.endLine) && startEndOnlyEvidenceRef.endLine >= startEndOnlyEvidenceRef.startLine, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.endLine must be >= startLine");
	  assert(startEndOnlyEvidenceRef.requestBound === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.requestBound must be true");
	  assert(startEndOnlyEvidenceRef.responseBound === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.responseBound must be true");
	  assert(startEndOnlyEvidenceRef.requestHasLegacyLineNumber === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.requestHasLegacyLineNumber must be false");
	  assert(startEndOnlyEvidenceRef.responseHasLegacyLineNumber === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.responseHasLegacyLineNumber must be false");
	  assert(startEndOnlyEvidenceRef.sourceEvidenceMatched === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.sourceEvidenceMatched must be true");
	  assertRequiredStringSet(startEndOnlyEvidenceRef.sourceEvidenceMatchTypes, ["REPORT_LINE_ANCHOR"], "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.sourceEvidenceMatchTypes");
	  assert(startEndOnlyEvidenceRef.sourceEvidenceMatchTypes.length === 1, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.sourceEvidenceMatchTypes must contain exactly REPORT_LINE_ANCHOR");
	  assert(Number.isInteger(startEndOnlyEvidenceRef.minResultCount) && startEndOnlyEvidenceRef.minResultCount > 0, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.minResultCount must be positive");
	  assert(startEndOnlyEvidenceRef.primaryChunkBound === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.primaryChunkBound must be true");
	  assertRequiredCoverageScopes(startEndOnlyEvidenceRef.coverageScopes, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.coverageScopes");
	  assert(startEndOnlyEvidenceRef.coverageScopes.includes("PRIMARY"), "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.coverageScopes must include PRIMARY");
	  assert(startEndOnlyEvidenceRef.currentScanOnly === true, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.currentScanOnly must be true");
	  assert(startEndOnlyEvidenceRef.providerQualityClaim === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.providerQualityClaim must be false");
	  assert(startEndOnlyEvidenceRef.llmFactClaim === false, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.startEndOnlyEvidenceRef.llmFactClaim must be false");
	  if (Object.prototype.hasOwnProperty.call(qaFromEvidence, "evidenceHandoff")) {
	    assertQaEvidenceHandoff(qaFromEvidence.evidenceHandoff, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.evidenceHandoff", uiPayload.scanTaskId);
	  }
	  if (Object.prototype.hasOwnProperty.call(qaFromEvidence, "sourceFileMatchRelease")) {
	    assertSourceFileMatchRelease(qaFromEvidence.sourceFileMatchRelease, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.sourceFileMatchRelease", uiPayload.scanTaskId, qaFromEvidence);
	  }
	  assertPublicRepoUiFileAnchorDrift(qaFromEvidence.fileAnchorDrift, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.fileAnchorDrift", uiPayload.scanTaskId);
	  if (Object.prototype.hasOwnProperty.call(qaFromEvidence, "sourceLocationReadability")) {
	    assertPublicRepoUiSourceLocationReadability(qaFromEvidence.sourceLocationReadability, "PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.sourceLocationReadability", qaFromEvidence);
	  }
	  if (Object.prototype.hasOwnProperty.call(uiPayload, "projectQaEvidenceCombinationSummary")) {
	    assertEvidenceCombinationSummary(uiPayload.projectQaEvidenceCombinationSummary, "PUBLIC_REPO_UI_SMOKE_OK projectQaEvidenceCombinationSummary", uiPayload.scanTaskId);
	  }

	  const governanceTimeline = uiPayload.governanceTimeline;
	  assert(governanceTimeline && typeof governanceTimeline === "object" && !Array.isArray(governanceTimeline), "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline must be an object");
	  assert(governanceTimeline.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.status must be OK");
	  assert(governanceTimeline.aggregateApiCalled === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.aggregateApiCalled must be true");
	  assert(governanceTimeline.endpoint === `/api/projects/${payload.projectId}/scan-tasks/${payload.scanTaskId}/governance-timeline`, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.endpoint must match the scan-bound aggregate API path");
	  assert(governanceTimeline.responseStatus === 200, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.responseStatus must be 200");
	  assert(governanceTimeline.visible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.visible must be true");
	  assert(governanceTimeline.projectId === payload.projectId, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.projectId must match PUBLIC_REPO_SMOKE_OK projectId");
	  assert(governanceTimeline.repositoryId === payload.repositoryId, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.repositoryId must match PUBLIC_REPO_SMOKE_OK repositoryId");
	  assert(governanceTimeline.scanTaskId === payload.scanTaskId, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.scanTaskId must match PUBLIC_REPO_SMOKE_OK scanTaskId");
	  assert(governanceTimeline.scanStatus === "SUCCESS", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.scanStatus must be SUCCESS");
	  assert(governanceTimeline.hasSummary === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.hasSummary must be true");
	  assert(governanceTimeline.hasResources === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.hasResources must be true");
	  assert(governanceTimeline.hasLimits === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.hasLimits must be true");
	  assert(governanceTimeline.resourcesBound === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.resourcesBound must be true");
	  assert(["BOUND", "PARTIAL", "ATTENTION"].includes(governanceTimeline.summaryStatus), "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.summaryStatus must be BOUND, PARTIAL or ATTENTION");
	  assert(typeof governanceTimeline.hasErrors === "boolean", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.hasErrors must be boolean");
	  assert(Number.isInteger(governanceTimeline.attributionGapCount) && governanceTimeline.attributionGapCount >= 0, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.attributionGapCount must be a non-negative integer");
	  const governanceCounts = governanceTimeline.counts;
	  assert(governanceCounts && typeof governanceCounts === "object" && !Array.isArray(governanceCounts), "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.counts must be an object");
	  for (const key of ["artifacts", "scanExecutions", "autoRepairs", "agentTasks", "agentToolCalls", "auditLogs", "repairExecutions", "agentExecutions"]) {
	    assert(Number.isInteger(governanceCounts[key]) && governanceCounts[key] >= 0, `PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.counts.${key} must be a non-negative integer`);
	  }
	  assert(governanceCounts.artifacts > 0, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.counts.artifacts must be positive");
	  assert(governanceCounts.scanExecutions === 1, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.counts.scanExecutions must be 1");
	  assertRequiredStringSet(governanceTimeline.resourceArrays, [
	    "artifacts",
	    "repairExecutions",
	    "agentExecutions",
	    "autoRepairs",
	    "agentTasks",
	    "agentToolCalls",
	    "auditLogs",
	  ], "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.resourceArrays");
	  assertRequiredStringSet(governanceTimeline.derivedAuditResourceTypes, [
	    "AUTO_REPAIR",
	    "AGENT_TASK",
	  ], "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.derivedAuditResourceTypes");
	  assertRequiredStringSet(governanceTimeline.derivedArtifactOwnerTypes, [
	    "AUTO_REPAIR",
	    "AGENT_TASK",
	  ], "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.derivedArtifactOwnerTypes");
	  assertRequiredStringSet(governanceTimeline.derivedArtifactTypes, [
	    "CHANGE_PATCH",
	    "AGENT_REPORT",
	  ], "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.derivedArtifactTypes");
	  assert(governanceTimeline.derivedGovernanceVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.derivedGovernanceVisible must be true");
	  const patchEvidence = governanceTimeline.patchEvidence;
	  assert(patchEvidence && typeof patchEvidence === "object" && !Array.isArray(patchEvidence), "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence must be an object");
	  assert(patchEvidence.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.status must be OK");
	  assert(patchEvidence.repairVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.repairVisible must be true");
	  assert(Number.isInteger(patchEvidence.autoRepairId) && patchEvidence.autoRepairId > 0, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.autoRepairId must be positive");
	  assert(patchEvidence.repairStatus === "PATCH_READY", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.repairStatus must be PATCH_READY");
	  assert(patchEvidence.scanTaskIdBound === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.scanTaskIdBound must be true");
	  assert(patchEvidence.targetFileVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.targetFileVisible must be true");
	  assert(patchEvidence.diffVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.diffVisible must be true");
	  assert(patchEvidence.patchArtifactVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.patchArtifactVisible must be true");
	  assert(patchEvidence.patchArtifactOwnerType === "AUTO_REPAIR", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.patchArtifactOwnerType must be AUTO_REPAIR");
	  assert(patchEvidence.patchArtifactOwnerId === patchEvidence.autoRepairId, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.patchArtifactOwnerId must match autoRepairId");
	  assert(patchEvidence.patchArtifactType === "CHANGE_PATCH", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.patchArtifactType must be CHANGE_PATCH");
	  assert(patchEvidence.patchReadyAuditVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.patchReadyAuditVisible must be true");
	  assert(patchEvidence.patchReadyAuditAction === "AUTO_REPAIR_PATCH_READY", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.patchReadyAuditAction must be AUTO_REPAIR_PATCH_READY");
	  assert(patchEvidence.patchReadyAuditStatus === "SUCCESS", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.patchReadyAuditStatus must be SUCCESS");
	  assert(patchEvidence.auditSourceBound === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.auditSourceBound must be true");
	  assert(patchEvidence.repairExecutionVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.repairExecutionVisible must be true");
	  assert(patchEvidence.repairExecutionSourceType === "AUTO_REPAIR", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.repairExecutionSourceType must be AUTO_REPAIR");
	  assert(patchEvidence.repairExecutionSourceId === patchEvidence.autoRepairId, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.repairExecutionSourceId must match autoRepairId");
	  assert(patchEvidence.repairExecutionStatus === "SUCCESS", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.repairExecutionStatus must be SUCCESS");
	  assert(patchEvidence.patchGenerationStepVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.patchGenerationStepVisible must be true");
	  assert(patchEvidence.patchGenerationStepKey === "generate_patch", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.patchGenerationStepKey must be generate_patch");
	  assert(patchEvidence.foreignPatchEvidenceHidden === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.patchEvidence.foreignPatchEvidenceHidden must be true");
	  const agentReview = governanceTimeline.agentReview;
	  assert(agentReview && typeof agentReview === "object" && !Array.isArray(agentReview), "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview must be an object");
	  assert(agentReview.status === "OK", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.status must be OK");
	  assert(agentReview.agentTaskVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentTaskVisible must be true");
	  assert(Number.isInteger(agentReview.agentTaskId) && agentReview.agentTaskId > 0, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentTaskId must be positive");
	  assert(agentReview.agentTaskStatus === "COMPLETED", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentTaskStatus must be COMPLETED");
	  assert(agentReview.scanTaskIdBound === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.scanTaskIdBound must be true");
	  assert(agentReview.agentReportArtifactVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentReportArtifactVisible must be true");
	  assert(agentReview.agentReportOwnerType === "AGENT_TASK", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentReportOwnerType must be AGENT_TASK");
	  assert(agentReview.agentReportOwnerId === agentReview.agentTaskId, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentReportOwnerId must match agentTaskId");
	  assert(agentReview.agentReportArtifactType === "AGENT_REPORT", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentReportArtifactType must be AGENT_REPORT");
	  assert(agentReview.agentAuditVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentAuditVisible must be true");
	  assert(agentReview.agentAuditAction === "AGENT_TASK_SMOKE_READY", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentAuditAction must be AGENT_TASK_SMOKE_READY");
	  assert(agentReview.agentAuditStatus === "SUCCESS", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentAuditStatus must be SUCCESS");
	  assert(agentReview.agentAuditSourceBound === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentAuditSourceBound must be true");
	  assert(agentReview.agentExecutionVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentExecutionVisible must be true");
	  assert(agentReview.agentExecutionSourceType === "AGENT_TASK", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentExecutionSourceType must be AGENT_TASK");
	  assert(agentReview.agentExecutionSourceId === agentReview.agentTaskId, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentExecutionSourceId must match agentTaskId");
	  assert(agentReview.agentExecutionStatus === "SUCCESS", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentExecutionStatus must be SUCCESS");
	  assert(agentReview.agentExecutionStepVisible === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentExecutionStepVisible must be true");
	  assert(agentReview.agentExecutionStepKey === "generate_report", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.agentExecutionStepKey must be generate_report");
	  assert(agentReview.foreignAgentEvidenceHidden === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.foreignAgentEvidenceHidden must be true");
	  assert(agentReview.noRawPromptOrAnswer === true, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.agentReview.noRawPromptOrAnswer must be true");
	  assert(Number.isInteger(governanceTimeline.eventCount) && governanceTimeline.eventCount > 0, "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.eventCount must be positive");
	  assert(typeof governanceTimeline.truncated === "boolean", "PUBLIC_REPO_UI_SMOKE_OK governanceTimeline.truncated must be boolean");

	  const publicRepoUiSmoke = payload.publicRepoUiSmoke;
  assert(publicRepoUiSmoke && typeof publicRepoUiSmoke === "object" && !Array.isArray(publicRepoUiSmoke), "PUBLIC_REPO_SMOKE_OK publicRepoUiSmoke must be an object when UI smoke is required");
  assert(publicRepoUiSmoke.status === "OK", "PUBLIC_REPO_SMOKE_OK publicRepoUiSmoke.status must be OK when UI smoke is required");
  assert(publicRepoUiSmoke.marker === "PUBLIC_REPO_UI_SMOKE_OK", "PUBLIC_REPO_SMOKE_OK publicRepoUiSmoke.marker must be PUBLIC_REPO_UI_SMOKE_OK");
  assertSafeEvidenceFile(publicRepoUiSmoke.expectedEvidenceFile, "PUBLIC_REPO_SMOKE_OK publicRepoUiSmoke.expectedEvidenceFile");
  assert(publicRepoUiSmoke.expectedEvidenceFile === uiPayload.expectedEvidenceFile, "PUBLIC_REPO_UI_SMOKE_OK expectedEvidenceFile must match PUBLIC_REPO_SMOKE_OK publicRepoUiSmoke.expectedEvidenceFile");

  const endpointBasenames = requiredProbes
    .map(([role]) => probesByRole.get(role))
    .filter(Boolean)
    .map((probe) => path.basename(probe.matchedFile));
  assert(endpointBasenames.includes(uiPayload.expectedEvidenceFile), "PUBLIC_REPO_UI_SMOKE_OK expectedEvidenceFile must match a natural endpoint matchedFile basename");
}
NODE
}

validate_autorepair_patch_smoke_success_marker() {
  local smoke_log_file="$1"
  if [[ "$STATUS_AUTOREPAIR_PATCH_SMOKE" != "OK" ]]; then
    return
  fi

  node - "$smoke_log_file" <<'NODE' || fail "release evidence autorepair-patch-smoke OK must prove PATCH_READY, patch artifact, execution task and audit evidence"
const fs = require("node:fs");
const logFile = process.argv[2];
const lines = fs.readFileSync(logFile, "utf8").split(/\r?\n/);
const prefix = "AUTOREPAIR_PATCH_SMOKE_OK ";
const matches = lines.filter((line) => line.startsWith(prefix));

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function assertRequiredStringSet(value, required, label) {
  assert(Array.isArray(value), `${label} must be an array`);
  const actual = new Set(value);
  for (const item of value) {
    assert(typeof item === "string" && item.trim() === item, `${label} must contain only trimmed strings`);
  }
  for (const item of required) {
    assert(actual.has(item), `${label} missing ${item}`);
  }
}

function assertExactStringSet(value, required, label) {
  assertRequiredStringSet(value, required, label);
  assert(value.length === required.length, `${label} must not contain extra entries`);
}

assert(matches.length === 1, "expected exactly one AUTOREPAIR_PATCH_SMOKE_OK marker");
assert(lines.some((line) => /repair status=PATCH_READY/.test(line)), "missing PATCH_READY repair status log line");

let payload;
try {
  payload = JSON.parse(matches[0].slice(prefix.length));
} catch (error) {
  console.error(`invalid AUTOREPAIR_PATCH_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

const positiveInteger = (value) => Number.isInteger(value) && value > 0;
const targetFile = "src/main/java/demo/LargeController.java";

assert(payload && typeof payload === "object" && !Array.isArray(payload), "marker payload must be an object");
assert(positiveInteger(payload.projectId), "projectId must be a positive integer");
assert(positiveInteger(payload.repositoryId), "repositoryId must be a positive integer");
assert(positiveInteger(payload.scanTaskId), "scanTaskId must be a positive integer");
assert(positiveInteger(payload.autoRepairId), "autoRepairId must be a positive integer");
assert(payload.llmProvider === "MOCK", "llmProvider must be MOCK for deterministic release evidence");
assert(payload.targetFile === targetFile, "targetFile must match the AutoRepair smoke fixture");
assert(positiveInteger(payload.scanArtifactRecords), "scanArtifactRecords must be positive");
assert(positiveInteger(payload.patchArtifactId), "patchArtifactId must be a positive integer");
assert(positiveInteger(payload.repairArtifactRecords), "repairArtifactRecords must be positive");

assert(payload.risk && payload.risk.category === "MAINTAINABILITY", "risk.category must be MAINTAINABILITY");
assert(payload.risk.filePath === targetFile, "risk.filePath must match targetFile");

assert(payload.execution && payload.execution.status === "SUCCESS", "execution.status must be SUCCESS");
assert(positiveInteger(payload.execution.taskId), "execution.taskId must be a positive integer");
assert(Number.isInteger(payload.execution.logCount) && payload.execution.logCount > 0, "execution.logCount must be positive");
assert(payload.execution.steps && payload.execution.steps.prepare_workspace === "SUCCESS", "prepare_workspace step must be SUCCESS");
assert(payload.execution.steps && payload.execution.steps.generate_patch === "SUCCESS", "generate_patch step must be SUCCESS");

assert(payload.audit && positiveInteger(payload.audit.auditLogId), "audit.auditLogId must be a positive integer");
assert(payload.audit.action === "AUTO_REPAIR_PATCH_READY", "audit.action must be AUTO_REPAIR_PATCH_READY");
assert(payload.audit.status === "SUCCESS", "audit.status must be SUCCESS");
assert(payload.audit.scanTaskId === payload.scanTaskId, "audit.scanTaskId must match scanTaskId");
NODE
}

validate_patch_ready_ui_smoke_success_marker() {
  local smoke_log_file="$1"
  if [[ "$STATUS_PATCH_READY_UI_SMOKE" != "OK" ]]; then
    return
  fi

  node - "$smoke_log_file" <<'NODE' || fail "release evidence patch-ready-ui-smoke OK must prove mocked PATCH_READY browser flow and no PR submit"
const fs = require("node:fs");
const logFile = process.argv[2];
const lines = fs.readFileSync(logFile, "utf8").split(/\r?\n/);
const prefix = "PATCH_READY_UI_SMOKE_OK ";
const matches = lines.filter((line) => line.startsWith(prefix));

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function assertRequiredStringSet(value, required, label) {
  assert(Array.isArray(value), `${label} must be an array`);
  const actual = new Set(value);
  for (const item of value) {
    assert(typeof item === "string" && item.trim() === item, `${label} must contain only trimmed strings`);
  }
  for (const item of required) {
    assert(actual.has(item), `${label} missing ${item}`);
  }
}

function assertExactNumberSet(value, required, label) {
  assert(Array.isArray(value), `${label} must be an array`);
  assert(value.length === required.length, `${label} must contain exactly ${required.length} items`);
  for (let index = 0; index < required.length; index += 1) {
    assert(Number.isInteger(value[index]), `${label} must contain only integers`);
    assert(value[index] === required[index], `${label}[${index}] must be ${required[index]}`);
  }
}

function assertExactStringArray(value, required, label) {
  assert(Array.isArray(value), `${label} must be an array`);
  assert(value.length === required.length, `${label} must contain exactly ${required.length} items`);
  for (let index = 0; index < required.length; index += 1) {
    assert(typeof value[index] === "string" && value[index].trim() === value[index], `${label} must contain only trimmed strings`);
    assert(value[index] === required[index], `${label}[${index}] must be ${required[index]}`);
  }
}

assert(matches.length === 1, "expected exactly one PATCH_READY_UI_SMOKE_OK marker");
assert(lines.some((line) => /patch-ready-smoke\.spec\.ts/.test(line)), "missing patch-ready-smoke.spec.ts execution evidence");

let payload;
try {
  payload = JSON.parse(matches[0].slice(prefix.length));
} catch (error) {
  console.error(`invalid PATCH_READY_UI_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

const targetFile = "src/main/java/demo/autorepair/readability/VeryLargeControllerWithLongNameForPatchReadyReview.java";
const patchArtifactPath = "artifacts/auto-repairs/101/change.patch";
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);

assert(payload && typeof payload === "object" && !Array.isArray(payload), "marker payload must be an object");
assert(payload.projectId === 1, "projectId must match the browser smoke fixture");
assert(payload.repairId === 101, "repairId must match the browser smoke fixture");
assert(payload.scanTaskId === 501, "scanTaskId must match the browser smoke fixture");
assert(payload.executionTaskId === 701, "executionTaskId must match the browser smoke fixture");
assert(payload.auditLogId === 801, "auditLogId must match the browser smoke fixture");
assert(payload.targetFile === targetFile, "targetFile must match the browser smoke fixture");
assert(payload.patchArtifactPath === patchArtifactPath, "patchArtifactPath must match the browser smoke fixture");
assert(Number.isInteger(payload.detailFallbackCount) && payload.detailFallbackCount >= 1, "detailFallbackCount must prove detail fallback");
assert(payload.submitPrCount === 0, "submitPrCount must be 0");
assert(payload.unhandledApiRequests === 0, "unhandledApiRequests must be 0");
assertRequiredStringSet(payload.viewports, ["1440x900", "390x844", "320x740"], "PATCH_READY_UI_SMOKE_OK viewports");
assert(payload.mockedApiOnly === true, "mockedApiOnly must be true");
assert(payload.auditDeepLink === true, "auditDeepLink must be true");
assert(payload.prConfirmCancelled === true, "prConfirmCancelled must be true");
assert(payload.spec === "patch-ready-smoke.spec.ts", "spec must be patch-ready-smoke.spec.ts");
assert(localHosts.has(payload.baseURLHost), "baseURLHost must be local-only");

assert(payload.tableDetailAction && typeof payload.tableDetailAction === "object" && !Array.isArray(payload.tableDetailAction), "tableDetailAction must be an object");
assert(payload.tableDetailAction.visible === true, "tableDetailAction.visible must be true");
assert(payload.tableDetailAction.clickedRepairId === payload.repairId, "tableDetailAction.clickedRepairId must match repairId");
assert(payload.tableDetailAction.detailPanelMatched === true, "tableDetailAction.detailPanelMatched must be true");
assert(payload.tableDetailAction.keyboardOpen && typeof payload.tableDetailAction.keyboardOpen === "object" && !Array.isArray(payload.tableDetailAction.keyboardOpen), "tableDetailAction.keyboardOpen must be an object");
assert(payload.tableDetailAction.keyboardOpen.enter === true, "tableDetailAction.keyboardOpen.enter must be true");
assert(payload.tableDetailAction.keyboardOpen.space === true, "tableDetailAction.keyboardOpen.space must be true");
assert(payload.tableDetailAction.accessibleSelection === true, "tableDetailAction.accessibleSelection must be true");

assert(payload.sharedSelectableRow && typeof payload.sharedSelectableRow === "object" && !Array.isArray(payload.sharedSelectableRow), "sharedSelectableRow must be an object");
assert(payload.sharedSelectableRow.ariaControlsLinked === true, "sharedSelectableRow.ariaControlsLinked must be true");
assert(payload.sharedSelectableRow.detailRegionLinked === true, "sharedSelectableRow.detailRegionLinked must be true");
assertExactNumberSet(payload.sharedSelectableRow.selectedRepairIds, [101, 103], "PATCH_READY_UI_SMOKE_OK sharedSelectableRow.selectedRepairIds");

assert(payload.layoutDensity && typeof payload.layoutDensity === "object" && !Array.isArray(payload.layoutDensity), "layoutDensity must be an object");
assert(payload.layoutDensity.mobile390Covered === true, "layoutDensity.mobile390Covered must be true");
assert(payload.layoutDensity.narrow320Covered === true, "layoutDensity.narrow320Covered must be true");
assert(payload.layoutDensity.detailCardContained === true, "layoutDensity.detailCardContained must be true");
assert(payload.layoutDensity.reviewChecklistContained === true, "layoutDensity.reviewChecklistContained must be true");
assert(payload.layoutDensity.sourceBridgeContained === true, "layoutDensity.sourceBridgeContained must be true");
assert(payload.layoutDensity.tableScrollerContained === true, "layoutDensity.tableScrollerContained must be true");
assert(payload.layoutDensity.prPopconfirmContained === true, "layoutDensity.prPopconfirmContained must be true");
assert(payload.layoutDensity.noHorizontalOverflow === true, "layoutDensity.noHorizontalOverflow must be true");

assert(payload.mobileReadability && typeof payload.mobileReadability === "object" && !Array.isArray(payload.mobileReadability), "mobileReadability must be an object");
assert(payload.mobileReadability.criticalTextsWrap === true, "mobileReadability.criticalTextsWrap must be true");
assert(payload.mobileReadability.targetFileNotClipped === true, "mobileReadability.targetFileNotClipped must be true");
assert(payload.mobileReadability.reviewGateTextNotClipped === true, "mobileReadability.reviewGateTextNotClipped must be true");
assert(payload.mobileReadability.candidateReceiptTextNotClipped === true, "mobileReadability.candidateReceiptTextNotClipped must be true");
assert(payload.mobileReadability.prConfirmTextNotClipped === true, "mobileReadability.prConfirmTextNotClipped must be true");
assert(payload.mobileReadability.primaryButtonLabelNotClipped === true, "mobileReadability.primaryButtonLabelNotClipped must be true");
assert(payload.mobileReadability.primaryButtonLabelIconSvgWhite === true, "mobileReadability.primaryButtonLabelIconSvgWhite must be true");

assert(payload.tableScroller && typeof payload.tableScroller === "object" && !Array.isArray(payload.tableScroller), "tableScroller must be an object");
assert(payload.tableScroller.containedInViewport === true, "tableScroller.containedInViewport must be true");
assert(payload.tableScroller.overflowXAuto === true, "tableScroller.overflowXAuto must be true");

assert(payload.executionDetailGuard && typeof payload.executionDetailGuard === "object" && !Array.isArray(payload.executionDetailGuard), "executionDetailGuard must be an object");
assert(payload.executionDetailGuard.selectedDetailSourceBound === true, "executionDetailGuard.selectedDetailSourceBound must be true");
assert(payload.executionDetailGuard.staleExecutionDetailRejected === true, "executionDetailGuard.staleExecutionDetailRejected must be true");
assert(payload.runtimeIssues === 0, "runtimeIssues must be 0");
assert(payload.noHorizontalOverflow === true, "noHorizontalOverflow must be true");

assert(payload.reviewGate && typeof payload.reviewGate === "object" && !Array.isArray(payload.reviewGate), "reviewGate must be an object");
assertExactStringArray(payload.reviewGate.requiredEvidence, ["diff", "patchArtifact", "patchGenerationStep", "auditEvent"], "PATCH_READY_UI_SMOKE_OK reviewGate.requiredEvidence");
assert(payload.reviewGate.blockingEvidenceSatisfied === true, "reviewGate.blockingEvidenceSatisfied must be true");
assert(payload.reviewGate.missingEvidenceBlocked === true, "reviewGate.missingEvidenceBlocked must be true");
assert(payload.reviewGate.manualCandidateScanTaskWarningOnly === true, "reviewGate.manualCandidateScanTaskWarningOnly must be true");
assert(payload.reviewGate.popconfirmSummaryVisible === true, "reviewGate.popconfirmSummaryVisible must be true");

assert(payload.prConfirmCandidateGate && typeof payload.prConfirmCandidateGate === "object" && !Array.isArray(payload.prConfirmCandidateGate), "prConfirmCandidateGate must be an object");
assert(payload.prConfirmCandidateGate.sourceType === "PROJECT_QA_VERIFIED_CITATION", "prConfirmCandidateGate.sourceType must prove QA citation receipt origin");
assert(payload.prConfirmCandidateGate.repairEvidenceGate === "READY", "prConfirmCandidateGate.repairEvidenceGate must prove READY candidate gate");
assert(payload.prConfirmCandidateGate.repairEvidenceGateSource === "SERVER_DERIVED", "prConfirmCandidateGate.repairEvidenceGateSource must prove server-derived gate source");
assert(payload.prConfirmCandidateGate.visible === true, "prConfirmCandidateGate.visible must be true");
assert(payload.prConfirmCandidateGate.warningOnlyForPatchReady === true, "prConfirmCandidateGate.warningOnlyForPatchReady must be true");

assert(payload.attemptSplit && typeof payload.attemptSplit === "object" && !Array.isArray(payload.attemptSplit), "attemptSplit must be an object");
assert(payload.attemptSplit.prExecutionAttemptSplit === true, "attemptSplit.prExecutionAttemptSplit must be true");
assertExactNumberSet(payload.attemptSplit.attemptIds, [1, 2], "PATCH_READY_UI_SMOKE_OK attemptSplit.attemptIds");
assertExactNumberSet(payload.attemptSplit.attemptNos, [1, 2], "PATCH_READY_UI_SMOKE_OK attemptSplit.attemptNos");
assertExactStringArray(payload.attemptSplit.patchAttemptStepKeys, ["prepare_workspace", "generate_patch"], "PATCH_READY_UI_SMOKE_OK attemptSplit.patchAttemptStepKeys");
assertExactStringArray(payload.attemptSplit.prAttemptStepKeys, ["create_branch", "push_branch", "create_pull_request"], "PATCH_READY_UI_SMOKE_OK attemptSplit.prAttemptStepKeys");
assert(payload.attemptSplit.patchEvidenceFromStep === true, "attemptSplit.patchEvidenceFromStep must be true");
assert(payload.attemptSplit.prFailureDoesNotBlockPatchEvidence === true, "attemptSplit.prFailureDoesNotBlockPatchEvidence must be true");
NODE
}

validate_dashboard_next_action_ui_smoke_success_marker() {
  local smoke_log_file="$1"
  if [[ "$STATUS_DASHBOARD_NEXT_ACTION_UI_SMOKE" != "OK" ]]; then
    return
  fi

  node - "$smoke_log_file" "$RUN_DIR" <<'NODE' || fail "release evidence dashboard-next-action-ui-smoke OK must prove mocked Dashboard next action browser flow"
const fs = require("node:fs");
const path = require("node:path");
const { inflateSync } = require("node:zlib");
const logFile = process.argv[2];
const runDir = process.argv[3];
const lines = fs.readFileSync(logFile, "utf8").split(/\r?\n/);
const prefix = "DASHBOARD_NEXT_ACTION_SMOKE_OK ";
const matches = lines.filter((line) => line.startsWith(prefix));

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function assertRequiredStringSet(value, required, label) {
  assert(Array.isArray(value), `${label} must be an array`);
  const actual = new Set(value);
  for (const item of value) {
    assert(typeof item === "string" && item.trim() === item, `${label} must contain only trimmed strings`);
  }
  for (const item of required) {
    assert(actual.has(item), `${label} missing ${item}`);
  }
}

function assertExactStringSet(value, required, label) {
  assertRequiredStringSet(value, required, label);
  assert(value.length === required.length, `${label} must not contain extra entries`);
}

function paethPredictor(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}

function inspectPngPixels(buffer) {
  assert(buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", "visualEvidence artifact must be a PNG image");
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }
  assert(width > 0 && height > 0, "visualEvidence artifact PNG dimensions must be present");
  assert(bitDepth === 8, "visualEvidence artifact PNG must use 8-bit channels");
  assert(colorType === 2 || colorType === 6, "visualEvidence artifact PNG must be RGB or RGBA");
  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const stride = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  let inputOffset = 0;
  let previous = Buffer.alloc(stride);
  const colors = new Set();
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const current = Buffer.alloc(stride);
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[inputOffset];
      inputOffset += 1;
      const left = x >= bytesPerPixel ? current[x - bytesPerPixel] : 0;
      const up = previous[x] || 0;
      const upLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
      let value = raw;
      if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) value = raw + paethPredictor(left, up, upLeft);
      else assert(filter === 0, "visualEvidence artifact PNG filter must be supported");
      current[x] = value & 0xff;
    }
    for (let x = 0; x < stride; x += bytesPerPixel) {
      colors.add(`${current[x]},${current[x + 1]},${current[x + 2]}`);
      if (colors.size >= 64) break;
    }
    if (colors.size >= 64) break;
    previous = current;
  }
  return { width, height, distinctColorCount: colors.size };
}

assert(matches.length === 1, "expected exactly one DASHBOARD_NEXT_ACTION_SMOKE_OK marker");
assert(lines.some((line) => /dashboard-next-action-smoke\.spec\.ts/.test(line)), "missing dashboard-next-action-smoke.spec.ts execution evidence");

let payload;
try {
  payload = JSON.parse(matches[0].slice(prefix.length));
} catch (error) {
  console.error(`invalid DASHBOARD_NEXT_ACTION_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

const requiredCases = [
  "recover-dashboard",
  "connect-repository",
  "watch-running-scan",
  "start-first-scan",
  "inspect-code-chunks",
  "review-risk-report",
  "ask-code-qa",
];
const requiredActions = [
  "恢复仪表盘数据",
  "接入第一个公开仓库",
  "跟踪运行中的扫描任务",
  "触发一次仓库扫描",
  "检查 code_chunks 生成状态",
  "复盘风险证据并生成修复候选",
  "进入代码问答复盘主链路",
];
const requiredViewports = ["1440x900", "1024x768", "768x1024", "390x844", "320x740"];
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const viewportSizes = new Map([
  ["1440x900", { width: 1440, height: 900, minBytes: 20000 }],
  ["1024x768", { width: 1024, height: 768, minBytes: 20000 }],
  ["768x1024", { width: 768, height: 1024, minBytes: 20000 }],
  ["390x844", { width: 390, height: 844, minBytes: 20000 }],
  ["320x740", { width: 320, height: 740, minBytes: 5000 }],
]);

assert(payload && typeof payload === "object" && !Array.isArray(payload), "marker payload must be an object");
assert(payload.mockedApiOnly === true, "mockedApiOnly must be true");
assert(payload.unhandledApiRequests === 0, "unhandledApiRequests must be 0");
assert(payload.productPlaneMap && typeof payload.productPlaneMap === "object" && !Array.isArray(payload.productPlaneMap), "productPlaneMap must be an object");
assert(payload.productPlaneMap.scope === "DASHBOARD_THREE_PLANE_PRODUCT_STRUCTURE_READABILITY", "productPlaneMap scope must identify Dashboard three-plane product structure evidence");
assert(payload.productPlaneMap.surface === "FRONT_OFFICE_DEVELOPER_CONSOLE_BACK_OFFICE", "productPlaneMap surface must identify front office, developer console and back office");
assert(payload.productPlaneMap.visible === true, "productPlaneMap visible must be true");
assert(payload.productPlaneMap.planeCount === 3, "productPlaneMap planeCount must be 3");
for (const field of [
  "expectedColumnsHonored",
  "desktopColumns",
  "tabletColumns",
  "tabletPortraitColumns",
  "mobileColumns",
  "narrowColumns",
  "copyReadable",
]) {
  assert(payload.productPlaneMap[field] === true, `productPlaneMap ${field} must be true`);
}
assert(payload.productPlaneMap.actionCount === 3, "productPlaneMap actionCount must be 3");
for (const field of ["rbacCompleteClaim", "productionDeploymentClaim"]) {
  assert(payload.productPlaneMap[field] === false, `productPlaneMap ${field} must be false`);
}
assert(Array.isArray(payload.productPlaneMap.proofs), "productPlaneMap proofs must be an array");
assert(payload.productPlaneMap.proofs.length === requiredCases.length * requiredViewports.length, "productPlaneMap proofs must contain exactly 35 case/viewport entries");
const productPlaneProofKeys = new Set();
const expectedProductPlaneColumns = new Map([
  ["1440x900", 3],
  ["1024x768", 2],
  ["768x1024", 2],
  ["390x844", 1],
  ["320x740", 1],
]);
for (const proof of payload.productPlaneMap.proofs) {
  assert(proof && typeof proof === "object" && !Array.isArray(proof), "productPlaneMap proofs entries must be objects");
  assert(requiredCases.includes(proof.caseKey), "productPlaneMap proofs caseKey must be a required Dashboard case");
  assert(requiredViewports.includes(proof.viewport), "productPlaneMap proofs viewport must be a required Dashboard viewport");
  const proofKey = `${proof.caseKey}:${proof.viewport}`;
  assert(!productPlaneProofKeys.has(proofKey), `productPlaneMap proofs must not repeat ${proofKey}`);
  productPlaneProofKeys.add(proofKey);
  const expectedColumns = expectedProductPlaneColumns.get(proof.viewport);
  assert(proof.visible === true, `productPlaneMap proofs ${proofKey} visible must be true`);
  assert(proof.planeCount === 3, `productPlaneMap proofs ${proofKey} planeCount must be 3`);
  assert(proof.expectedColumns === expectedColumns, `productPlaneMap proofs ${proofKey} expectedColumns must be ${expectedColumns}`);
  assert(proof.actualColumns === expectedColumns, `productPlaneMap proofs ${proofKey} actualColumns must be ${expectedColumns}`);
  assert(proof.expectedColumnsHonored === true, `productPlaneMap proofs ${proofKey} expectedColumnsHonored must be true`);
  assert(proof.copyReadable === true, `productPlaneMap proofs ${proofKey} copyReadable must be true`);
  assert(proof.actionCount === 3, `productPlaneMap proofs ${proofKey} actionCount must be 3`);
  assert(proof.rbacCompleteClaim === false, `productPlaneMap proofs ${proofKey} rbacCompleteClaim must be false`);
  assert(proof.productionDeploymentClaim === false, `productPlaneMap proofs ${proofKey} productionDeploymentClaim must be false`);
}
for (const caseKey of requiredCases) {
  for (const viewport of requiredViewports) {
    assert(productPlaneProofKeys.has(`${caseKey}:${viewport}`), `productPlaneMap proofs missing ${caseKey}:${viewport}`);
  }
}
assertRequiredStringSet(payload.cases, requiredCases, "DASHBOARD_NEXT_ACTION_SMOKE_OK cases");
assertRequiredStringSet(payload.nextActions, requiredActions, "DASHBOARD_NEXT_ACTION_SMOKE_OK nextActions");
assertExactStringSet(payload.viewports, requiredViewports, "DASHBOARD_NEXT_ACTION_SMOKE_OK viewports");
assert(Array.isArray(payload.visitedCases), "visitedCases must be an array");
for (const caseKey of requiredCases) {
  for (const viewport of requiredViewports) {
    assert(payload.visitedCases.includes(`${caseKey}:${viewport}`), `visitedCases missing ${caseKey}:${viewport}`);
  }
}
assert(payload.dashboardStatsApiSignals && typeof payload.dashboardStatsApiSignals === "object" && !Array.isArray(payload.dashboardStatsApiSignals), "dashboardStatsApiSignals must be an object");
assert(payload.dashboardStatsApiSignals.sourceLabelSelector === ".sl-dashboard-metrics-source", "dashboardStatsApiSignals sourceLabelSelector must bind the Dashboard metrics source label");
assertExactStringSet(
  payload.dashboardStatsApiSignals.apiBackedCases,
  ["connect-repository", "watch-running-scan", "start-first-scan", "inspect-code-chunks", "review-risk-report", "ask-code-qa"],
  "dashboardStatsApiSignals apiBackedCases",
);
assertExactStringSet(
  payload.dashboardStatsApiSignals.fallbackCases,
  ["recover-dashboard"],
  "dashboardStatsApiSignals fallbackCases",
);
assert(payload.dashboardStatsApiSignals.legacyStatsFallbackCase === "legacy-stats-without-api-fields", "dashboardStatsApiSignals must prove legacy stats fallback");
assert(payload.executiveBriefing && typeof payload.executiveBriefing === "object" && !Array.isArray(payload.executiveBriefing), "executiveBriefing must be an object");
assert(payload.executiveBriefing.scope === "DASHBOARD_EXECUTIVE_BRIEFING_DECISION_READABILITY", "executiveBriefing scope must identify Dashboard executive decision readability evidence");
assertExactStringSet(
  payload.executiveBriefing.signals,
  ["阶段进度", "质量状态", "风险阻塞", "下一步投入"],
  "executiveBriefing signals",
);
assert(payload.executiveBriefing.signalCount === 4, "executiveBriefing signalCount must be 4");
for (const field of [
  "expectedColumnsHonored",
  "desktopColumns",
  "tabletColumns",
  "tabletPortraitColumns",
  "mobileColumns",
  "narrowColumns",
  "copyReadable",
  "actionVisible",
]) {
  assert(payload.executiveBriefing[field] === true, `executiveBriefing ${field} must be true`);
}
for (const field of [
  "p9CompleteClaim",
  "rbacCompleteClaim",
  "productionDeploymentClaim",
  "commercializationClaim",
]) {
  assert(payload.executiveBriefing[field] === false, `executiveBriefing ${field} must be false`);
}
assert(Array.isArray(payload.visualEvidence), "visualEvidence must be an array");
assert(payload.visualEvidence.length === requiredViewports.length, "visualEvidence must include exactly five required Dashboard screenshots");
const visualEvidenceByViewport = new Map();
for (const item of payload.visualEvidence) {
  assert(item && typeof item === "object" && !Array.isArray(item), "visualEvidence items must be objects");
  assert(item.caseKey === "review-risk-report", "visualEvidence must cover the report review action with the primary report button");
  assert(typeof item.viewport === "string" && item.viewport.trim(), "visualEvidence viewport must be present");
  const viewportSize = viewportSizes.get(item.viewport);
  assert(Boolean(viewportSize), "visualEvidence viewport must be one of the required viewport sizes");
  assert(!visualEvidenceByViewport.has(item.viewport), `visualEvidence must not repeat viewport ${item.viewport}`);
  visualEvidenceByViewport.set(item.viewport, item);
  assert(item.screenshot === `dashboard-next-action-review-risk-report-${item.viewport}.png`, "visualEvidence screenshot filename must be stable and match its viewport");
  assert(typeof item.artifact === "string" && item.artifact === `dashboard-next-action-ui-smoke/${item.screenshot}`, "visualEvidence artifact path must point to the archived release evidence screenshot");
  assert(Number.isInteger(item.screenshotBytes) && item.screenshotBytes > viewportSize.minBytes, "visualEvidence screenshotBytes must prove non-trivial screenshot output");
  assert(Number.isInteger(item.screenshotWidth) && item.screenshotWidth === viewportSize.width, "visualEvidence screenshotWidth must match the viewport");
  assert(Number.isInteger(item.screenshotHeight) && item.screenshotHeight === viewportSize.height, "visualEvidence screenshotHeight must match the viewport");
  assert(Number.isInteger(item.distinctColorCount) && item.distinctColorCount >= 16, "visualEvidence distinctColorCount must prove non-blank screenshot pixels");
  const artifactPath = path.join(runDir, item.artifact);
  assert(path.resolve(artifactPath).startsWith(path.resolve(runDir) + path.sep), "visualEvidence artifact path must stay inside the release evidence directory");
  const artifact = fs.readFileSync(artifactPath);
  assert(artifact.length === item.screenshotBytes, "visualEvidence artifact byte size must match marker screenshotBytes");
  const artifactPixels = inspectPngPixels(artifact);
  assert(artifactPixels.width === item.screenshotWidth, "visualEvidence artifact PNG width must match marker screenshotWidth");
  assert(artifactPixels.height === item.screenshotHeight, "visualEvidence artifact PNG height must match marker screenshotHeight");
  assert(artifactPixels.distinctColorCount === item.distinctColorCount, "visualEvidence artifact PNG color diversity must match marker distinctColorCount");
  assert(Number.isInteger(item.panelTop) && item.panelTop >= 0, "visualEvidence panelTop must prove the panel is not clipped above viewport");
  assert(Number.isInteger(item.panelLeft) && item.panelLeft >= 0, "visualEvidence panelLeft must prove the panel is not clipped left of viewport");
  assert(Number.isInteger(item.panelRight) && item.panelRight <= viewportSize.width, "visualEvidence panelRight must prove the panel is not clipped right of viewport");
  assert(Number.isInteger(item.panelBottom) && item.panelBottom <= viewportSize.height, "visualEvidence panelBottom must prove the panel fits in the viewport");
  assert(item.panelTop <= item.panelBottom, "visualEvidence panel vertical bounds must be ordered");
  assert(item.panelLeft <= item.panelRight, "visualEvidence panel horizontal bounds must be ordered");
  assert(Number.isInteger(item.titleTop) && item.titleTop >= 0, "visualEvidence titleTop must prove the title is not clipped above viewport");
  assert(Number.isInteger(item.titleBottom) && item.titleBottom <= viewportSize.height, "visualEvidence titleBottom must prove the title is visible in first viewport");
  assert(item.titleTop <= item.titleBottom, "visualEvidence title bounds must be ordered");
  assert(Number.isInteger(item.primaryButtonTop) && item.primaryButtonTop >= 0, "visualEvidence primaryButtonTop must prove the primary button is not clipped above viewport");
  assert(Number.isInteger(item.primaryButtonBottom) && item.primaryButtonBottom <= viewportSize.height, "visualEvidence primaryButtonBottom must prove the primary button is visible in first viewport");
  assert(item.primaryButtonTop <= item.primaryButtonBottom, "visualEvidence primary button bounds must be ordered");
  assert(item.primaryButtonTextColor === "rgb(255, 255, 255)", "visualEvidence primaryButtonTextColor must prove readable primary button text");
}
for (const viewport of requiredViewports) {
  assert(visualEvidenceByViewport.has(viewport), `visualEvidence missing ${viewport} screenshot evidence`);
}
assert(payload.spec === "dashboard-next-action-smoke.spec.ts", "spec must be dashboard-next-action-smoke.spec.ts");
assert(localHosts.has(payload.baseURLHost), "baseURLHost must be local-only");
NODE
  record_expected_package_file "dashboard-next-action-ui-smoke/dashboard-next-action-review-risk-report-1440x900.png"
  record_expected_package_file "dashboard-next-action-ui-smoke/dashboard-next-action-review-risk-report-1024x768.png"
  record_expected_package_file "dashboard-next-action-ui-smoke/dashboard-next-action-review-risk-report-768x1024.png"
  record_expected_package_file "dashboard-next-action-ui-smoke/dashboard-next-action-review-risk-report-390x844.png"
  record_expected_package_file "dashboard-next-action-ui-smoke/dashboard-next-action-review-risk-report-320x740.png"
}

validate_report_evidence_drawer_ui_smoke_success_marker() {
  local smoke_log_file="$1"
  if [[ "$STATUS_REPORT_EVIDENCE_DRAWER_UI_SMOKE" != "OK" ]]; then
    return
  fi

  node - "$smoke_log_file" <<'NODE' || fail "release evidence report-evidence-drawer-ui-smoke OK must prove mocked report evidence drawer code_chunks flow"
const fs = require("node:fs");
const logFile = process.argv[2];
const lines = fs.readFileSync(logFile, "utf8").split(/\r?\n/);
const prefix = "REPORT_EVIDENCE_DRAWER_SMOKE_OK ";
const qaPrefix = "REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK ";
const matches = lines.filter((line) => line.startsWith(prefix));
const qaMatches = lines.filter((line) => line.startsWith(qaPrefix));

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function assertRequiredStringSet(value, required, label) {
  assert(Array.isArray(value), `${label} must be an array`);
  const actual = new Set(value);
  for (const item of value) {
    assert(typeof item === "string" && item.trim() === item, `${label} must contain only trimmed strings`);
  }
  for (const item of required) {
    assert(actual.has(item), `${label} missing ${item}`);
  }
}

function assertNoSensitiveMarkerMaterial(value, label) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSensitiveMarkerMaterial(entry, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  const forbiddenKey = /raw|prompt|answer|content|sourceContent|stack|token|secret|password|authorization|bearer/i;
  for (const [key, nested] of Object.entries(value)) {
    assert(!forbiddenKey.test(key), `${label}.${key} must not archive raw content, prompts, answers, stacks or secrets`);
    assertNoSensitiveMarkerMaterial(nested, `${label}.${key}`);
  }
}

function assertReportCitationQualityUiPanel(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "surface",
    "visibleAcrossViewports",
    "citationQuality",
    "sourceDiversityVisible",
    "sourceCoverageVisible",
    "sourceSectionCount",
    "sourceSections",
    "sourceSectionLabels",
    "sourceSectionOrder",
    "sourceSectionLabelOrder",
    "narrativeBinding",
    "detailToggleVisible",
    "detailDefaultCollapsed",
    "detailOpens",
    "verdictVisible",
    "verdictItemCount",
    "verdictBoundaryVisible",
    "boundaryVisible",
    "noOverclaim",
    "noHorizontalOverflow",
    "providerQualityClaim",
    "llmFactClaim",
  ]), label);
  assertNoSensitiveMarkerMaterial(value, label);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.surface === "SCAN_TASK_DETAIL_REPORT_CITATION_QUALITY_PANEL", `${label}.surface must be SCAN_TASK_DETAIL_REPORT_CITATION_QUALITY_PANEL`);
  assert(value.visibleAcrossViewports === true, `${label}.visibleAcrossViewports must be true`);
  assertRequiredStringSet(value.citationQuality, ["6/6"], `${label}.citationQuality`);
  assert(value.citationQuality.length === 1, `${label}.citationQuality must contain only 6/6`);
  assert(value.sourceDiversityVisible === true, `${label}.sourceDiversityVisible must be true`);
  assert(value.sourceCoverageVisible === true, `${label}.sourceCoverageVisible must be true`);
  assert(Number.isInteger(value.sourceSectionCount) && value.sourceSectionCount >= 5, `${label}.sourceSectionCount must cover source sections`);
  assertRequiredStringSet(value.sourceSections, ["apiRoutes/dbEntities", "codeQuality.risks", "modules", "overview", "scanFingerprint"], `${label}.sourceSections`);
  assert(value.sourceSections.length === 5, `${label}.sourceSections must contain only expected source sections`);
  assertRequiredStringSet(value.sourceSectionLabels, ["API/数据面", "风险信号", "扫描指纹", "扫描范围", "模块图"], `${label}.sourceSectionLabels`);
  assert(value.sourceSectionLabels.length === 5, `${label}.sourceSectionLabels must contain only expected source labels`);
  const expectedSourceSectionOrder = ["overview", "modules", "apiRoutes/dbEntities", "scanFingerprint", "codeQuality.risks"];
  const expectedSourceSectionLabelOrder = ["扫描范围", "模块图", "API/数据面", "扫描指纹", "风险信号"];
  assert(Array.isArray(value.sourceSectionOrder), `${label}.sourceSectionOrder must be an array`);
  assert(JSON.stringify(value.sourceSectionOrder) === JSON.stringify(expectedSourceSectionOrder), `${label}.sourceSectionOrder must follow report reading order`);
  assert(Array.isArray(value.sourceSectionLabelOrder), `${label}.sourceSectionLabelOrder must be an array`);
  assert(JSON.stringify(value.sourceSectionLabelOrder) === JSON.stringify(expectedSourceSectionLabelOrder), `${label}.sourceSectionLabelOrder must follow report reading label order`);
  assertRequiredStringSet(value.narrativeBinding, ["6/6"], `${label}.narrativeBinding`);
  assert(value.narrativeBinding.length === 1, `${label}.narrativeBinding must contain only 6/6`);
  assert(value.detailToggleVisible === true, `${label}.detailToggleVisible must be true`);
  assert(value.detailDefaultCollapsed === true, `${label}.detailDefaultCollapsed must be true`);
  assert(value.detailOpens === true, `${label}.detailOpens must be true`);
  assert(value.verdictVisible === true, `${label}.verdictVisible must be true`);
  assert(Number.isInteger(value.verdictItemCount) && value.verdictItemCount >= 4, `${label}.verdictItemCount must cover verdict signals`);
  assert(value.verdictBoundaryVisible === true, `${label}.verdictBoundaryVisible must be true`);
  assert(value.boundaryVisible === true, `${label}.boundaryVisible must be true`);
  assert(value.noOverclaim === true, `${label}.noOverclaim must be true`);
  assert(value.noHorizontalOverflow === true, `${label}.noHorizontalOverflow must be true`);
  assert(value.providerQualityClaim === false, `${label}.providerQualityClaim must be false`);
  assert(value.llmFactClaim === false, `${label}.llmFactClaim must be false`);
}

function assertEvidenceLineRangePriority(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "proofCount",
    "structuredRangePriority",
    "legacyLineHidden",
    "visibleRanges",
    "conflictLegacyLineNumbers",
    "mobile390Covered",
    "narrow320Covered",
    "noHorizontalOverflow",
  ]), label);
  assertNoSensitiveMarkerMaterial(value, label);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(Number.isInteger(value.proofCount) && value.proofCount >= 3, `${label}.proofCount must cover desktop, mobile and narrow conflict proofs`);
  assert(value.structuredRangePriority === true, `${label}.structuredRangePriority must be true`);
  assert(value.legacyLineHidden === true, `${label}.legacyLineHidden must be true`);
  assertRequiredStringSet(value.visibleRanges, ["24-42"], `${label}.visibleRanges`);
  assert(value.visibleRanges.length === 1, `${label}.visibleRanges must contain only the structured range`);
  assertRequiredStringSet(value.conflictLegacyLineNumbers, ["999"], `${label}.conflictLegacyLineNumbers`);
  assert(value.conflictLegacyLineNumbers.length === 1, `${label}.conflictLegacyLineNumbers must contain only the forged legacy line`);
  assert(value.mobile390Covered === true, `${label}.mobile390Covered must be true`);
  assert(value.narrow320Covered === true, `${label}.narrow320Covered must be true`);
  assert(value.noHorizontalOverflow === true, `${label}.noHorizontalOverflow must be true`);
}

function assertDeepEvidenceCardReadability(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertAllowedObjectKeys(value, new Set([
    "status",
    "mobile390Covered",
    "narrow320Covered",
    "sourceReceipt",
    "sourceLocationConfidence",
    "sourceFileMatchRelease",
    "noHorizontalOverflow",
    "providerQualityClaim",
    "llmFactClaim",
  ]), label);
  assertNoSensitiveMarkerMaterial(value, label);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.mobile390Covered === true, `${label}.mobile390Covered must be true`);
  assert(value.narrow320Covered === true, `${label}.narrow320Covered must be true`);

  const sourceReceipt = value.sourceReceipt;
  assert(sourceReceipt && typeof sourceReceipt === "object" && !Array.isArray(sourceReceipt), `${label}.sourceReceipt must be an object`);
  assertAllowedObjectKeys(sourceReceipt, new Set([
    "readyVisible",
    "reviewVisible",
    "contained",
    "referenceWraps",
    "titleNotClipped",
    "tagsNotClipped",
    "structuredRangeVisible",
  ]), `${label}.sourceReceipt`);
  for (const key of ["readyVisible", "reviewVisible", "contained", "referenceWraps", "titleNotClipped", "tagsNotClipped", "structuredRangeVisible"]) {
    assert(sourceReceipt[key] === true, `${label}.sourceReceipt.${key} must be true`);
  }

  const confidence = value.sourceLocationConfidence;
  assert(confidence && typeof confidence === "object" && !Array.isArray(confidence), `${label}.sourceLocationConfidence must be an object`);
  assertAllowedObjectKeys(confidence, new Set(["readyContained", "reviewContained", "metricsNotClipped", "checksWrap", "llmFactBoundaryVisible"]), `${label}.sourceLocationConfidence`);
  for (const key of ["readyContained", "reviewContained", "metricsNotClipped", "checksWrap", "llmFactBoundaryVisible"]) {
    assert(confidence[key] === true, `${label}.sourceLocationConfidence.${key} must be true`);
  }

  const release = value.sourceFileMatchRelease;
  assert(release && typeof release === "object" && !Array.isArray(release), `${label}.sourceFileMatchRelease must be an object`);
  assertAllowedObjectKeys(release, new Set(["readyContained", "reviewContained", "targetReferenceNotClipped", "citedReferenceNotClipped", "checksNotClipped", "noRepairOnReview"]), `${label}.sourceFileMatchRelease`);
  for (const key of ["readyContained", "reviewContained", "targetReferenceNotClipped", "citedReferenceNotClipped", "checksNotClipped", "noRepairOnReview"]) {
    assert(release[key] === true, `${label}.sourceFileMatchRelease.${key} must be true`);
  }

  assert(value.noHorizontalOverflow === true, `${label}.noHorizontalOverflow must be true`);
  assert(value.providerQualityClaim === false, `${label}.providerQualityClaim must be false`);
  assert(value.llmFactClaim === false, `${label}.llmFactClaim must be false`);
}

function assertRequiredCoverageScopes(value, label) {
  assertRequiredStringSet(value, [], label);
  assert(value.length > 0, `${label} must be non-empty`);
  const allowedScopes = new Set(["PRIMARY", "ALL"]);
  for (const scope of value) {
    assert(allowedScopes.has(scope), `${label}.${scope} is not allowed`);
  }
}

function assertEvidenceRoleDistribution(value, parentCoverage, label, mode) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const allowedStatuses = new Set(["NO_EVIDENCE", "PRIMARY_SINGLE_FILE", "PRIMARY_CROSS_FILE", "MIXED_PRIMARY_CONTEXT", "CONTEXT_ONLY", "UNKNOWN_ROLE_PRESENT"]);
  assertRequiredStringSet(value.statuses, [], `${label}.statuses`);
  assert(value.statuses.length > 0 && value.statuses.every((status) => allowedStatuses.has(status)), `${label}.statuses contains an illegal status`);
  for (const field of ["minTotalFileCount", "minPrimaryFileCount", "minContextFileCount", "minRoleCount", "minFileEntryCount"]) {
    assert(Number.isInteger(value[field]) && value[field] >= 0, `${label}.${field} must be a non-negative integer`);
  }
  assert(value.minTotalFileCount === parentCoverage.minUniqueEvidenceFileCount, `${label}.minTotalFileCount must match parent minUniqueEvidenceFileCount`);
  assert(value.minPrimaryFileCount === parentCoverage.minPrimaryEvidenceFileCount, `${label}.minPrimaryFileCount must match parent minPrimaryEvidenceFileCount`);
  assert(value.minContextFileCount === parentCoverage.minContextEvidenceFileCount, `${label}.minContextFileCount must match parent minContextEvidenceFileCount`);
  assert(value.minTotalFileCount > 0, `${label}.minTotalFileCount must be positive`);
  assert(value.minPrimaryFileCount > 0, `${label}.minPrimaryFileCount must be positive`);
  assert(value.minRoleCount > 0, `${label}.minRoleCount must be positive`);
  assert(value.minFileEntryCount > 0, `${label}.minFileEntryCount must be positive`);
  if (mode === "verified") {
    assert(Number.isInteger(value.minCitedFileCount) && value.minCitedFileCount === parentCoverage.minCitedEvidenceFileCount, `${label}.minCitedFileCount must match parent minCitedEvidenceFileCount`);
    assert(Number.isInteger(value.minCitedPrimaryFileCount) && value.minCitedPrimaryFileCount === parentCoverage.minCitedPrimaryEvidenceFileCount, `${label}.minCitedPrimaryFileCount must match parent minCitedPrimaryEvidenceFileCount`);
    assert(Number.isInteger(value.minCitedContextFileCount) && value.minCitedContextFileCount === parentCoverage.minCitedContextEvidenceFileCount, `${label}.minCitedContextFileCount must match parent minCitedContextEvidenceFileCount`);
    assert(value.minCitedPrimaryFileCount >= value.minPrimaryFileCount, `${label}.minCitedPrimaryFileCount must cover primary files`);
    return;
  }
  assert(Number.isInteger(value.maxCitedFileCount) && value.maxCitedFileCount === parentCoverage.maxCitedEvidenceFileCount, `${label}.maxCitedFileCount must match parent maxCitedEvidenceFileCount`);
  assert(Number.isInteger(value.maxCitedPrimaryFileCount) && value.maxCitedPrimaryFileCount === parentCoverage.maxCitedPrimaryEvidenceFileCount, `${label}.maxCitedPrimaryFileCount must match parent maxCitedPrimaryEvidenceFileCount`);
  assert(Number.isInteger(value.maxCitedContextFileCount) && value.maxCitedContextFileCount === parentCoverage.maxCitedContextEvidenceFileCount, `${label}.maxCitedContextFileCount must match parent maxCitedContextEvidenceFileCount`);
  assert(value.maxCitedFileCount === 0, `${label}.maxCitedFileCount must be 0`);
  assert(value.maxCitedPrimaryFileCount === 0, `${label}.maxCitedPrimaryFileCount must be 0`);
  assert(value.maxCitedContextFileCount === 0, `${label}.maxCitedContextFileCount must be 0`);
}

function assertReadyClaimCitationCoverage(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertRequiredStringSet(value.statuses, ["READY"], `${label}.statuses`);
  assert(value.statuses.every((status) => status === "READY"), `${label}.statuses must contain only READY`);
  assert(value.readyForRepair === true, `${label}.readyForRepair must be true`);
  assertRequiredStringSet(value.readinessReasons, ["PRIMARY_BOUND_READY"], `${label}.readinessReasons`);
  assert(value.readinessReasons.length === 1, `${label}.readinessReasons must contain only PRIMARY_BOUND_READY`);
  assert(Number.isInteger(value.minClaimCoveragePercent) && value.minClaimCoveragePercent >= 100, `${label}.minClaimCoveragePercent must be at least 100`);
  assert(Number.isInteger(value.minRequiredClaimCount) && value.minRequiredClaimCount > 0, `${label}.minRequiredClaimCount must be positive`);
  assert(Number.isInteger(value.minCitedRequiredClaimCount) && value.minCitedRequiredClaimCount > 0, `${label}.minCitedRequiredClaimCount must be positive`);
  assert(value.minCitedRequiredClaimCount === value.minRequiredClaimCount, `${label}.minCitedRequiredClaimCount must match minRequiredClaimCount`);
  assert(Number.isInteger(value.maxUncitedRequiredClaimCount) && value.maxUncitedRequiredClaimCount === 0, `${label}.maxUncitedRequiredClaimCount must be 0`);
  assert(Number.isInteger(value.maxInvalidCitationClaimCount) && value.maxInvalidCitationClaimCount === 0, `${label}.maxInvalidCitationClaimCount must be 0`);
  assert(Number.isInteger(value.minValidCitationFileCount) && value.minValidCitationFileCount > 0, `${label}.minValidCitationFileCount must be positive`);
  assert(Number.isInteger(value.minRequiredClaimCitationFileCount) && value.minRequiredClaimCitationFileCount > 0, `${label}.minRequiredClaimCitationFileCount must be positive`);
  assertReadyClaimRoleDistribution(value.roleDistribution, value, `${label}.roleDistribution`);
}

function assertReadyClaimRoleDistribution(value, parentCoverage, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertRequiredStringSet(value.statuses, ["PRIMARY_BOUND"], `${label}.statuses`);
  assert(value.statuses.every((status) => status === "PRIMARY_BOUND"), `${label}.statuses must contain only PRIMARY_BOUND`);
  assert(Number.isInteger(value.minRequiredClaimCount) && value.minRequiredClaimCount === parentCoverage.minRequiredClaimCount, `${label}.minRequiredClaimCount must match parent`);
  assert(Number.isInteger(value.minRequiredPrimaryBoundClaimCount) && value.minRequiredPrimaryBoundClaimCount === parentCoverage.minRequiredClaimCount, `${label}.minRequiredPrimaryBoundClaimCount must cover required claims`);
  assert(Number.isInteger(value.maxRequiredContextOnlyClaimCount) && value.maxRequiredContextOnlyClaimCount === 0, `${label}.maxRequiredContextOnlyClaimCount must be 0`);
  assert(Number.isInteger(value.maxRequiredUnknownOnlyClaimCount) && value.maxRequiredUnknownOnlyClaimCount === 0, `${label}.maxRequiredUnknownOnlyClaimCount must be 0`);
  assert(Number.isInteger(value.maxUnbackedRequiredClaimCount) && value.maxUnbackedRequiredClaimCount === 0, `${label}.maxUnbackedRequiredClaimCount must be 0`);
  assert(Number.isInteger(value.maxInvalidRequiredClaimCount) && value.maxInvalidRequiredClaimCount === 0, `${label}.maxInvalidRequiredClaimCount must be 0`);
  assert(Number.isInteger(value.minValidCitationFileCount) && value.minValidCitationFileCount === parentCoverage.minValidCitationFileCount, `${label}.minValidCitationFileCount must match parent`);
  assert(Number.isInteger(value.minRequiredClaimCitationFileCount) && value.minRequiredClaimCitationFileCount === parentCoverage.minRequiredClaimCitationFileCount, `${label}.minRequiredClaimCitationFileCount must match parent`);
  assert(Number.isInteger(value.minRequiredPrimaryFileCount) && value.minRequiredPrimaryFileCount > 0, `${label}.minRequiredPrimaryFileCount must be positive`);
  assert(Number.isInteger(value.minRoleCount) && value.minRoleCount > 0, `${label}.minRoleCount must be positive`);
  assert(Number.isInteger(value.minFileEntryCount) && value.minFileEntryCount > 0, `${label}.minFileEntryCount must be positive`);
}

function assertCrossFileCitationSummary(value, parentCoverage, claimCoverage, label, mode) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const verifiedKeys = new Set([
    "visible",
    "tones",
    "statuses",
    "crossFileEvidenceSatisfied",
    "citationBindingSatisfied",
    "claimBindingSatisfied",
    "currentScanOnly",
    "sourceEvidenceMatchTypes",
    "minEvidenceFileCount",
    "minCitedEvidenceFileCount",
    "minPrimaryEvidenceFileCount",
    "minCitedPrimaryEvidenceFileCount",
    "minContextEvidenceFileCount",
    "minCitedContextEvidenceFileCount",
    "contextGapVisible",
    "minUncitedContextEvidenceCount",
    "minUncitedContextEvidenceFileCount",
    "minRequiredEvidenceFileCount",
    "minCitedRequiredEvidenceFileCount",
    "minRequiredClaimCount",
    "minRequiredClaimCitationFileCount",
    "minRequiredPrimaryFileCount",
    "minRequiredPrimaryBoundClaimCount",
  ]);
  const unverifiedKeys = new Set([
    "visible",
    "tones",
    "statuses",
    "crossFileEvidenceSatisfied",
    "citationBindingSatisfied",
    "claimBindingSatisfied",
    "currentScanOnly",
    "sourceEvidenceMatchTypes",
    "minEvidenceFileCount",
    "maxCitedEvidenceFileCount",
    "minPrimaryEvidenceFileCount",
    "maxCitedPrimaryEvidenceFileCount",
    "minContextEvidenceFileCount",
    "maxCitedContextEvidenceFileCount",
    "minRequiredEvidenceFileCount",
    "maxCitedRequiredEvidenceFileCount",
    "minRequiredClaimCount",
    "maxRequiredClaimCitationFileCount",
    "maxRequiredPrimaryFileCount",
    "maxRequiredPrimaryBoundClaimCount",
  ]);
  assertAllowedObjectKeys(value, mode === "verified" ? verifiedKeys : unverifiedKeys, label);
  const forbiddenKeys = /url|query|hash|origin|host|requestPath|stack|prompt|answer|content|code|claimText|token|authorization/i;
  for (const key of Object.keys(value)) {
    assert(!forbiddenKeys.test(key), `${label}.${key} must not archive raw content, URLs, prompts or secrets`);
  }
  const allowedStatuses = new Set(["NO_EVIDENCE", "PRIMARY_SINGLE_FILE", "PRIMARY_CROSS_FILE", "MIXED_PRIMARY_CONTEXT", "CONTEXT_ONLY", "UNKNOWN_ROLE_PRESENT"]);
  const allowedTones = mode === "verified" ? new Set(["ready", "warning"]) : new Set(["blocked"]);
  assert(value.visible === true, `${label}.visible must be true`);
  assertRequiredStringSet(value.tones, [], `${label}.tones`);
  assert(value.tones.length > 0 && value.tones.every((tone) => allowedTones.has(tone)), `${label}.tones must match ${mode} citation state`);
  assertRequiredStringSet(value.statuses, [], `${label}.statuses`);
  assert(value.statuses.length > 0 && value.statuses.every((status) => allowedStatuses.has(status)), `${label}.statuses contains an illegal status`);
  assert(value.currentScanOnly === true, `${label}.currentScanOnly must be true`);
  assert(typeof value.crossFileEvidenceSatisfied === "boolean", `${label}.crossFileEvidenceSatisfied must be boolean`);
  assert(value.crossFileEvidenceSatisfied === (parentCoverage.minUniqueEvidenceFileCount >= 2), `${label}.crossFileEvidenceSatisfied must be derived from parent minUniqueEvidenceFileCount`);
  assertRequiredStringSet(value.sourceEvidenceMatchTypes, [], `${label}.sourceEvidenceMatchTypes`);
  assert(value.sourceEvidenceMatchTypes.every((type) => type === "REPORT_LINE_ANCHOR"), `${label}.sourceEvidenceMatchTypes must be line anchors only`);

  if (mode === "verified") {
    assert(value.citationBindingSatisfied === true, `${label}.citationBindingSatisfied must be true`);
    assert(value.claimBindingSatisfied === true, `${label}.claimBindingSatisfied must be true`);
    assert(value.minEvidenceFileCount === parentCoverage.minUniqueEvidenceFileCount, `${label}.minEvidenceFileCount must match parent`);
    assert(value.minCitedEvidenceFileCount === parentCoverage.minCitedEvidenceFileCount, `${label}.minCitedEvidenceFileCount must match parent`);
    assert(value.minPrimaryEvidenceFileCount === parentCoverage.minPrimaryEvidenceFileCount, `${label}.minPrimaryEvidenceFileCount must match parent`);
    assert(value.minCitedPrimaryEvidenceFileCount === parentCoverage.minCitedPrimaryEvidenceFileCount, `${label}.minCitedPrimaryEvidenceFileCount must match parent`);
    assert(value.minContextEvidenceFileCount === parentCoverage.minContextEvidenceFileCount, `${label}.minContextEvidenceFileCount must match parent`);
    assert(value.minCitedContextEvidenceFileCount === parentCoverage.minCitedContextEvidenceFileCount, `${label}.minCitedContextEvidenceFileCount must match parent`);
    if (Object.prototype.hasOwnProperty.call(value, "contextGapVisible")) {
      assert(typeof value.contextGapVisible === "boolean", `${label}.contextGapVisible must be boolean`);
      assert(Number.isInteger(value.minUncitedContextEvidenceCount) && value.minUncitedContextEvidenceCount >= 0, `${label}.minUncitedContextEvidenceCount must be non-negative`);
      assert(Number.isInteger(value.minUncitedContextEvidenceFileCount) && value.minUncitedContextEvidenceFileCount >= 0, `${label}.minUncitedContextEvidenceFileCount must be non-negative`);
      assert(value.contextGapVisible === (value.minUncitedContextEvidenceCount > 0 || value.minUncitedContextEvidenceFileCount > 0), `${label}.contextGapVisible must match uncited context gap`);
    }
    assert(value.minRequiredEvidenceFileCount === parentCoverage.minRequiredEvidenceFileCount, `${label}.minRequiredEvidenceFileCount must match parent`);
    assert(value.minCitedRequiredEvidenceFileCount === parentCoverage.minCitedRequiredEvidenceFileCount, `${label}.minCitedRequiredEvidenceFileCount must match parent`);
    assert(value.minCitedRequiredEvidenceFileCount >= value.minRequiredEvidenceFileCount, `${label}.minCitedRequiredEvidenceFileCount must cover required files`);
    assert(value.minCitedPrimaryEvidenceFileCount >= value.minPrimaryEvidenceFileCount, `${label}.minCitedPrimaryEvidenceFileCount must cover primary files`);
    assert(value.minRequiredClaimCount === claimCoverage.minRequiredClaimCount, `${label}.minRequiredClaimCount must match claim coverage`);
    assert(value.minRequiredClaimCitationFileCount === claimCoverage.minRequiredClaimCitationFileCount, `${label}.minRequiredClaimCitationFileCount must match claim coverage`);
    assert(value.minRequiredPrimaryFileCount === claimCoverage.roleDistribution.minRequiredPrimaryFileCount, `${label}.minRequiredPrimaryFileCount must match claim role distribution`);
    assert(value.minRequiredPrimaryBoundClaimCount === claimCoverage.roleDistribution.minRequiredPrimaryBoundClaimCount, `${label}.minRequiredPrimaryBoundClaimCount must match claim role distribution`);
    assert(value.minRequiredPrimaryBoundClaimCount >= value.minRequiredClaimCount, `${label}.minRequiredPrimaryBoundClaimCount must cover required claims`);
    return;
  }

  assert(value.citationBindingSatisfied === false, `${label}.citationBindingSatisfied must be false`);
  assert(value.claimBindingSatisfied === false, `${label}.claimBindingSatisfied must be false`);
  assert(value.minEvidenceFileCount === parentCoverage.minUniqueEvidenceFileCount, `${label}.minEvidenceFileCount must match parent`);
  assert(value.maxCitedEvidenceFileCount === parentCoverage.maxCitedEvidenceFileCount, `${label}.maxCitedEvidenceFileCount must match parent`);
  assert(value.minPrimaryEvidenceFileCount === parentCoverage.minPrimaryEvidenceFileCount, `${label}.minPrimaryEvidenceFileCount must match parent`);
  assert(value.maxCitedPrimaryEvidenceFileCount === parentCoverage.maxCitedPrimaryEvidenceFileCount, `${label}.maxCitedPrimaryEvidenceFileCount must match parent`);
  assert(value.minContextEvidenceFileCount === parentCoverage.minContextEvidenceFileCount, `${label}.minContextEvidenceFileCount must match parent`);
  assert(value.maxCitedContextEvidenceFileCount === parentCoverage.maxCitedContextEvidenceFileCount, `${label}.maxCitedContextEvidenceFileCount must match parent`);
  assert(value.minRequiredEvidenceFileCount === parentCoverage.minRequiredEvidenceFileCount, `${label}.minRequiredEvidenceFileCount must match parent`);
  assert(value.maxCitedRequiredEvidenceFileCount === parentCoverage.maxCitedRequiredEvidenceFileCount, `${label}.maxCitedRequiredEvidenceFileCount must match parent`);
  assert(value.maxCitedEvidenceFileCount === 0, `${label}.maxCitedEvidenceFileCount must be 0`);
  assert(value.maxCitedPrimaryEvidenceFileCount === 0, `${label}.maxCitedPrimaryEvidenceFileCount must be 0`);
  assert(value.maxCitedRequiredEvidenceFileCount === 0, `${label}.maxCitedRequiredEvidenceFileCount must be 0`);
  assert(value.minRequiredClaimCount === claimCoverage.minRequiredClaimCount, `${label}.minRequiredClaimCount must match claim coverage`);
  assert(value.maxRequiredClaimCitationFileCount === claimCoverage.maxRequiredClaimCitationFileCount, `${label}.maxRequiredClaimCitationFileCount must match claim coverage`);
  assert(value.maxRequiredPrimaryFileCount === claimCoverage.roleDistribution.maxRequiredPrimaryFileCount, `${label}.maxRequiredPrimaryFileCount must match claim role distribution`);
  assert(value.maxRequiredPrimaryBoundClaimCount === claimCoverage.roleDistribution.maxRequiredPrimaryBoundClaimCount, `${label}.maxRequiredPrimaryBoundClaimCount must match claim role distribution`);
  assert(value.maxRequiredPrimaryBoundClaimCount === 0, `${label}.maxRequiredPrimaryBoundClaimCount must be 0`);
}

function assertAllowedObjectKeys(value, allowedKeys, label) {
  for (const key of Object.keys(value)) {
    assert(allowedKeys.has(key), `${label} must not include unexpected field ${key}`);
  }
}

function assertReviewClaimCitationCoverage(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertRequiredStringSet(value.statuses, ["REVIEW"], `${label}.statuses`);
  assert(value.statuses.every((status) => status === "REVIEW"), `${label}.statuses must contain only REVIEW`);
  assert(Number.isInteger(value.minClaimCoveragePercent) && value.minClaimCoveragePercent === 0, `${label}.minClaimCoveragePercent must be 0`);
  assert(Number.isInteger(value.minRequiredClaimCount) && value.minRequiredClaimCount > 0, `${label}.minRequiredClaimCount must be positive`);
  assert(Number.isInteger(value.minCitedRequiredClaimCount) && value.minCitedRequiredClaimCount === 0, `${label}.minCitedRequiredClaimCount must be 0`);
  assert(Number.isInteger(value.maxUncitedRequiredClaimCount) && value.maxUncitedRequiredClaimCount > 0, `${label}.maxUncitedRequiredClaimCount must be positive`);
  assert(Number.isInteger(value.maxInvalidCitationClaimCount) && value.maxInvalidCitationClaimCount === 0, `${label}.maxInvalidCitationClaimCount must be 0`);
  assert(Number.isInteger(value.maxValidCitationFileCount) && value.maxValidCitationFileCount === 0, `${label}.maxValidCitationFileCount must be 0`);
  assert(Number.isInteger(value.maxRequiredClaimCitationFileCount) && value.maxRequiredClaimCitationFileCount === 0, `${label}.maxRequiredClaimCitationFileCount must be 0`);
  assertReviewClaimRoleDistribution(value.roleDistribution, `${label}.roleDistribution`);
}

function assertReviewClaimRoleDistribution(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assertRequiredStringSet(value.statuses, ["REVIEW_UNCITED"], `${label}.statuses`);
  assert(value.statuses.every((status) => status === "REVIEW_UNCITED"), `${label}.statuses must contain only REVIEW_UNCITED`);
  assert(Number.isInteger(value.maxRequiredPrimaryBoundClaimCount) && value.maxRequiredPrimaryBoundClaimCount === 0, `${label}.maxRequiredPrimaryBoundClaimCount must be 0`);
  assert(Number.isInteger(value.maxRequiredPrimaryFileCount) && value.maxRequiredPrimaryFileCount === 0, `${label}.maxRequiredPrimaryFileCount must be 0`);
  assert(Number.isInteger(value.maxValidCitationFileCount) && value.maxValidCitationFileCount === 0, `${label}.maxValidCitationFileCount must be 0`);
  assert(Number.isInteger(value.maxRequiredClaimCitationFileCount) && value.maxRequiredClaimCitationFileCount === 0, `${label}.maxRequiredClaimCitationFileCount must be 0`);
  assert(Number.isInteger(value.maxRoleCount) && value.maxRoleCount === 0, `${label}.maxRoleCount must be 0`);
  assert(Number.isInteger(value.maxFileEntryCount) && value.maxFileEntryCount === 0, `${label}.maxFileEntryCount must be 0`);
}

function assertClaimRoleDistributionReviewDrift(value, label, expectedRoleDistributionPresent) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(Number.isInteger(value.requestCount) && value.requestCount > 0, `${label}.requestCount must be positive`);
  assert(value.sourceEvidenceMatchType === "REPORT_LINE_ANCHOR", `${label}.sourceEvidenceMatchType must stay REPORT_LINE_ANCHOR`);
  assert(value.claimCitationStatus === "READY", `${label}.claimCitationStatus must keep parent READY to isolate claim role drift`);
  assert(value.roleDistributionPresent === expectedRoleDistributionPresent, `${label}.roleDistributionPresent must match drift fixture`);
  assert(value.repairEvidenceGateReviewVisible === true, `${label}.repairEvidenceGateReviewVisible must be true`);
  assert(value.trustSummaryReviewVisible === true, `${label}.trustSummaryReviewVisible must be true`);
  assert(value.latestNextActionRepairHidden === true, `${label}.latestNextActionRepairHidden must be true`);
  assert(value.latestCitationRepairHidden === true, `${label}.latestCitationRepairHidden must be true`);
  if (expectedRoleDistributionPresent) {
    const expectedMismatchFlagKeys = new Set([
      "requiredClaimCountMismatch",
      "requiredPrimaryBoundClaimCountMismatch",
      "nonZeroContextOnly",
      "nonZeroUnbacked",
      "nonZeroInvalid",
      "validCitationFileCountMismatch",
      "requiredClaimCitationFileCountMismatch",
    ]);
    assert(value.mismatchFlags && typeof value.mismatchFlags === "object" && !Array.isArray(value.mismatchFlags), `${label}.mismatchFlags must be an object`);
    assertAllowedObjectKeys(value.mismatchFlags, expectedMismatchFlagKeys, `${label}.mismatchFlags`);
    for (const key of expectedMismatchFlagKeys) {
      assert(typeof value.mismatchFlags[key] === "boolean", `${label}.mismatchFlags.${key} must be boolean`);
    }
    assert(Object.values(value.mismatchFlags).some((flag) => flag === true), `${label}.mismatchFlags must prove at least one parent/child count contradiction`);
  }
}

function assertFileAnchorDriftReview(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert(value.status === "OK", `${label}.status must be OK`);
  assert(value.responseStatus === 200, `${label}.responseStatus must be 200`);
  assert(Number.isInteger(value.requestCount) && value.requestCount > 0, `${label}.requestCount must be positive`);
  assertRequiredStringSet(value.sourceEvidenceMatchTypes, ["REPORT_FILE_ANCHOR"], `${label}.sourceEvidenceMatchTypes`);
  assert(value.sourceEvidenceMatchTypes.length === 1, `${label}.sourceEvidenceMatchTypes must contain only REPORT_FILE_ANCHOR`);
  assertRequiredStringSet(value.groundingStatuses, ["PARTIAL"], `${label}.groundingStatuses`);
  assert(value.groundingStatuses.length === 1, `${label}.groundingStatuses must contain only PARTIAL`);
  assertRequiredStringSet(value.citationEnforcementStatuses, ["RETRY_FAILED"], `${label}.citationEnforcementStatuses`);
  assert(value.citationEnforcementStatuses.length === 1, `${label}.citationEnforcementStatuses must contain only RETRY_FAILED`);

  const citationCoverage = value.citationCoverage;
  assert(citationCoverage && typeof citationCoverage === "object" && !Array.isArray(citationCoverage), `${label}.citationCoverage must be an object`);
  assertRequiredStringSet(citationCoverage.statuses, ["PARTIAL"], `${label}.citationCoverage.statuses`);
  assertRequiredStringSet(citationCoverage.coverageScopes, ["ALL"], `${label}.citationCoverage.coverageScopes`);
  assert(citationCoverage.coverageScopes.length === 1, `${label}.citationCoverage.coverageScopes must contain only ALL`);
  assert(Number.isInteger(citationCoverage.maxPrimaryEvidenceCount) && citationCoverage.maxPrimaryEvidenceCount === 0, `${label}.citationCoverage.maxPrimaryEvidenceCount must be 0`);
  assert(Number.isInteger(citationCoverage.minContextEvidenceCount) && citationCoverage.minContextEvidenceCount > 0, `${label}.citationCoverage.minContextEvidenceCount must be positive`);
  assert(Number.isInteger(citationCoverage.maxRepairCandidateCount) && citationCoverage.maxRepairCandidateCount === 0, `${label}.citationCoverage.maxRepairCandidateCount must be 0`);
  assert(citationCoverage.evidenceRoleDistribution && typeof citationCoverage.evidenceRoleDistribution === "object" && !Array.isArray(citationCoverage.evidenceRoleDistribution), `${label}.citationCoverage.evidenceRoleDistribution must be an object`);
  assertRequiredStringSet(citationCoverage.evidenceRoleDistribution.statuses, ["CONTEXT_ONLY"], `${label}.citationCoverage.evidenceRoleDistribution.statuses`);
  assert(citationCoverage.evidenceRoleDistribution.statuses.length === 1, `${label}.citationCoverage.evidenceRoleDistribution.statuses must contain only CONTEXT_ONLY`);

  const claimCoverage = value.claimCitationCoverage;
  assert(claimCoverage && typeof claimCoverage === "object" && !Array.isArray(claimCoverage), `${label}.claimCitationCoverage must be an object`);
  assertRequiredStringSet(claimCoverage.statuses, ["REVIEW"], `${label}.claimCitationCoverage.statuses`);
  assert(claimCoverage.statuses.length === 1, `${label}.claimCitationCoverage.statuses must contain only REVIEW`);
  assert(Number.isInteger(claimCoverage.minRequiredClaimCount) && claimCoverage.minRequiredClaimCount > 0, `${label}.claimCitationCoverage.minRequiredClaimCount must be positive`);
  assert(Number.isInteger(claimCoverage.minCitedRequiredClaimCount) && claimCoverage.minCitedRequiredClaimCount === 0, `${label}.claimCitationCoverage.minCitedRequiredClaimCount must be 0`);
  assert(claimCoverage.roleDistribution && typeof claimCoverage.roleDistribution === "object" && !Array.isArray(claimCoverage.roleDistribution), `${label}.claimCitationCoverage.roleDistribution must be an object`);
  assertRequiredStringSet(claimCoverage.roleDistribution.statuses, ["CONTEXT_ONLY"], `${label}.claimCitationCoverage.roleDistribution.statuses`);
  assert(claimCoverage.roleDistribution.statuses.length === 1, `${label}.claimCitationCoverage.roleDistribution.statuses must contain only CONTEXT_ONLY`);
  assert(Number.isInteger(claimCoverage.roleDistribution.maxRequiredPrimaryBoundClaimCount) && claimCoverage.roleDistribution.maxRequiredPrimaryBoundClaimCount === 0, `${label}.claimCitationCoverage.roleDistribution.maxRequiredPrimaryBoundClaimCount must be 0`);
  assert(Number.isInteger(claimCoverage.roleDistribution.maxRequiredPrimaryFileCount) && claimCoverage.roleDistribution.maxRequiredPrimaryFileCount === 0, `${label}.claimCitationCoverage.roleDistribution.maxRequiredPrimaryFileCount must be 0`);
  assert(Number.isInteger(claimCoverage.roleDistribution.minRequiredContextOnlyClaimCount) && claimCoverage.roleDistribution.minRequiredContextOnlyClaimCount > 0, `${label}.claimCitationCoverage.roleDistribution.minRequiredContextOnlyClaimCount must be positive`);

	  assert(value.repairEvidenceGateBlockedVisible === true, `${label}.repairEvidenceGateBlockedVisible must be true`);
	  assert(value.trustSummaryBlockedVisible === true, `${label}.trustSummaryBlockedVisible must be true`);
	  assert(value.crossFileSummaryContextGapVisible === true, `${label}.crossFileSummaryContextGapVisible must be true`);
  assert(value.latestNextActionRepairHidden === true, `${label}.latestNextActionRepairHidden must be true`);
  assert(value.latestCitationRepairHidden === true, `${label}.latestCitationRepairHidden must be true`);
}

assert(matches.length === 1, "expected exactly one REPORT_EVIDENCE_DRAWER_SMOKE_OK marker");
assert(qaMatches.length === 1, "expected exactly one REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK marker");
assert(lines.some((line) => /report-evidence-drawer-smoke\.spec\.ts/.test(line)), "missing report-evidence-drawer-smoke.spec.ts execution evidence");

let payload;
try {
  payload = JSON.parse(matches[0].slice(prefix.length));
} catch (error) {
  console.error(`invalid REPORT_EVIDENCE_DRAWER_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

let qaPayload;
try {
  qaPayload = JSON.parse(qaMatches[0].slice(qaPrefix.length));
} catch (error) {
  console.error(`invalid REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

const targetFile = "src/main/java/demo/report/evidence/readability/ChatControllerWithVeryLongBoundaryEvidencePath.java";
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const allowedCitationEnforcement = new Set(["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_CITED"]);
const allowedCitationEnforcementReasons = new Set(["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_PRIMARY_CITED"]);

assert(payload && typeof payload === "object" && !Array.isArray(payload), "marker payload must be an object");
assert(payload.projectId === 1, "projectId must match the report evidence drawer smoke fixture");
assert(payload.repositoryId === 11, "repositoryId must match the report evidence drawer smoke fixture");
assert(payload.scanTaskId === 501, "scanTaskId must match the report evidence drawer smoke fixture");
assert(payload.expectedEvidenceFile === targetFile, "expectedEvidenceFile must match the report evidence drawer fixture");
assert(payload.drawerQueryCount === 6, "drawerQueryCount must prove READY and GAP drawer code_chunks queries per viewport");
assert(payload.readyDrawerQueryCount === 3, "readyDrawerQueryCount must prove one READY drawer code_chunks query per viewport");
assert(payload.gapDrawerQueryCount === 3, "gapDrawerQueryCount must prove one GAP drawer code_chunks query per viewport");
const drawerActionRail = payload.drawerActionRail;
assert(drawerActionRail && typeof drawerActionRail === "object" && !Array.isArray(drawerActionRail), "drawerActionRail must be an object");
assert(drawerActionRail.readyVisible === true, "drawerActionRail.readyVisible must be true");
assert(drawerActionRail.gapVisible === true, "drawerActionRail.gapVisible must be true");
assert(drawerActionRail.readyRepairActionVisible === true, "drawerActionRail.readyRepairActionVisible must be true");
assert(drawerActionRail.gapRepairCreationActionHidden === true, "drawerActionRail.gapRepairCreationActionHidden must be true");
assert(drawerActionRail.gapLocalizationActionVisible === true, "drawerActionRail.gapLocalizationActionVisible must be true");
assert(drawerActionRail.gapLocalizationActionDisabled === true, "drawerActionRail.gapLocalizationActionDisabled must be true");
const mainPathGuide = payload.mainPathGuide;
assert(mainPathGuide && typeof mainPathGuide === "object" && !Array.isArray(mainPathGuide), "mainPathGuide must be an object");
assert(mainPathGuide.visible === true, "mainPathGuide.visible must be true");
assert(Number.isInteger(mainPathGuide.stepCount) && mainPathGuide.stepCount === 3, "mainPathGuide.stepCount must be 3");
assert(JSON.stringify(mainPathGuide.order) === JSON.stringify(["recommended-action", "citation-quality", "evidence-priority"]), "mainPathGuide.order must follow report execution path");
assert(JSON.stringify(mainPathGuide.labels) === JSON.stringify(["01", "02", "03"]), "mainPathGuide.labels must prove numbered report execution path");
assert(mainPathGuide.mobile390Covered === true, "mainPathGuide.mobile390Covered must be true");
assert(mainPathGuide.narrow320Covered === true, "mainPathGuide.narrow320Covered must be true");
assert(mainPathGuide.noHorizontalOverflow === true, "mainPathGuide.noHorizontalOverflow must be true");
const actionBoard = payload.actionBoard;
assert(actionBoard && typeof actionBoard === "object" && !Array.isArray(actionBoard), "actionBoard must be an object");
assert(actionBoard.visible === true, "actionBoard.visible must be true");
assert(Number.isInteger(actionBoard.actionCount) && actionBoard.actionCount === 6, "actionBoard.actionCount must be 6");
assert(JSON.stringify(actionBoard.actionKeys) === JSON.stringify(["risk-review", "code-qa", "agent-review", "audit-trace", "dependency-review", "repair-candidate"]), "actionBoard.actionKeys must follow report action routing order");
assert(actionBoard.codeQaLinkVisible === true, "actionBoard.codeQaLinkVisible must be true");
assert(actionBoard.repairCandidateVisible === true, "actionBoard.repairCandidateVisible must be true");
assert(actionBoard.mobile390Covered === true, "actionBoard.mobile390Covered must be true");
assert(actionBoard.narrow320Covered === true, "actionBoard.narrow320Covered must be true");
assert(actionBoard.noHorizontalOverflow === true, "actionBoard.noHorizontalOverflow must be true");
const reviewGate = payload.reviewGate;
assert(reviewGate && typeof reviewGate === "object" && !Array.isArray(reviewGate), "reviewGate must be an object");
assert(reviewGate.visible === true, "reviewGate.visible must be true");
assert(Number.isInteger(reviewGate.gateCount) && reviewGate.gateCount === 6, "reviewGate.gateCount must be 6");
assert(JSON.stringify(reviewGate.gateKeys) === JSON.stringify(["report-readiness", "evidence-bundle", "code-knowledge", "repair-readiness", "audit-trace", "governance-timeline"]), "reviewGate.gateKeys must follow report governance gate order");
assert(Number.isInteger(reviewGate.minReadyCount) && reviewGate.minReadyCount >= 1 && reviewGate.minReadyCount <= 6, "reviewGate.minReadyCount must be in valid range");
assert(reviewGate.mobile390Covered === true, "reviewGate.mobile390Covered must be true");
assert(reviewGate.narrow320Covered === true, "reviewGate.narrow320Covered must be true");
assert(reviewGate.textNotClipped === true, "reviewGate.textNotClipped must be true");
assert(reviewGate.noHorizontalOverflow === true, "reviewGate.noHorizontalOverflow must be true");
assert(payload.mockedApiOnly === true, "mockedApiOnly must be true");
assert(payload.unhandledApiRequests === 0, "unhandledApiRequests must be 0");
assertRequiredStringSet(payload.viewports, ["1440x900", "320x740"], "REPORT_EVIDENCE_DRAWER_SMOKE_OK viewports");
assert(payload.spec === "report-evidence-drawer-smoke.spec.ts", "spec must be report-evidence-drawer-smoke.spec.ts");
assert(localHosts.has(payload.baseURLHost), "baseURLHost must be local-only");

assert(qaPayload && typeof qaPayload === "object" && !Array.isArray(qaPayload), "QA citation marker payload must be an object");
assert(qaPayload.projectId === 1, "QA citation projectId must match the report evidence drawer smoke fixture");
assert(qaPayload.repositoryId === 11, "QA citation repositoryId must match the report evidence drawer smoke fixture");
assert(qaPayload.scanTaskId === 501, "QA citation scanTaskId must match the report evidence drawer smoke fixture");
assert(qaPayload.expectedEvidenceFile === targetFile, "QA citation expectedEvidenceFile must match the report evidence drawer fixture");
assert(qaPayload.qaRequestCount === 6, "QA citation qaRequestCount must prove verified and unverified evidence-bound QA requests per viewport");
if (qaPayload.qaTotalRequestCount !== undefined) {
  assert(Number.isInteger(qaPayload.qaTotalRequestCount) && qaPayload.qaTotalRequestCount >= qaPayload.qaRequestCount, "QA citation qaTotalRequestCount must include qaRequestCount and any drift requests");
}
assert(qaPayload.mockedApiOnly === true, "QA citation mockedApiOnly must be true");
assert(qaPayload.unhandledApiRequests === 0, "QA citation unhandledApiRequests must be 0");
assertRequiredStringSet(qaPayload.viewports, ["1440x900", "320x740"], "REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK viewports");
assert(qaPayload.spec === "report-evidence-drawer-smoke.spec.ts", "QA citation spec must be report-evidence-drawer-smoke.spec.ts");
assert(localHosts.has(qaPayload.baseURLHost), "QA citation baseURLHost must be local-only");
assert(qaPayload.fullReleaseAuthorityRefreshed === false, "QA citation focused smoke must not claim full release authority refresh");
if (Object.prototype.hasOwnProperty.call(qaPayload, "reportCitationQuality")) {
  assertReportCitationQualityUiPanel(qaPayload.reportCitationQuality, "REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK reportCitationQuality");
}

const qaFromEvidence = qaPayload.qaFromEvidence;
assert(qaFromEvidence && typeof qaFromEvidence === "object" && !Array.isArray(qaFromEvidence), "QA citation qaFromEvidence must be an object");
assert(qaFromEvidence.status === "OK", "QA citation qaFromEvidence.status must be OK");
assert(qaFromEvidence.responseStatus === 200, "QA citation responseStatus must be 200");
assert(Number.isInteger(qaFromEvidence.resultCount) && qaFromEvidence.resultCount > 0, "QA citation resultCount must be positive");
assert(Number.isInteger(qaFromEvidence.citationCount) && qaFromEvidence.citationCount > 0, "QA citation citationCount must be positive");
assert(Number.isInteger(qaFromEvidence.citedChunkCount) && qaFromEvidence.citedChunkCount > 0, "QA citation citedChunkCount must be positive");
const qaCitationCoverage = qaFromEvidence.citationCoverage;
assert(qaCitationCoverage && typeof qaCitationCoverage === "object" && !Array.isArray(qaCitationCoverage), "QA citation citationCoverage must be an object");
assertRequiredStringSet(qaCitationCoverage.statuses, ["PARTIAL"], "QA citation citationCoverage.statuses");
assert(Number.isInteger(qaCitationCoverage.minCoveragePercent) && qaCitationCoverage.minCoveragePercent > 0 && qaCitationCoverage.minCoveragePercent <= 100, "QA citation citationCoverage.minCoveragePercent must be 1..100");
assert(qaCitationCoverage.minTotalEvidenceCount === qaFromEvidence.citationCount, "QA citation citationCoverage.minTotalEvidenceCount must match citationCount");
assert(qaCitationCoverage.minCitedEvidenceCount === qaFromEvidence.citedChunkCount, "QA citation citationCoverage.minCitedEvidenceCount must match citedChunkCount");
assert(Number.isInteger(qaCitationCoverage.minUncitedCandidateCount) && qaCitationCoverage.minUncitedCandidateCount > 0, "QA citation citationCoverage.minUncitedCandidateCount must be positive");
assert(Number.isInteger(qaCitationCoverage.minRepairCandidateCount) && qaCitationCoverage.minRepairCandidateCount > 0, "QA citation citationCoverage.minRepairCandidateCount must be positive");
assert(Number.isInteger(qaCitationCoverage.minRequiredEvidenceCoveragePercent) && qaCitationCoverage.minRequiredEvidenceCoveragePercent >= 100, "QA citation citationCoverage.minRequiredEvidenceCoveragePercent must be at least 100");
assert(Number.isInteger(qaCitationCoverage.minRequiredEvidenceCount) && qaCitationCoverage.minRequiredEvidenceCount > 0, "QA citation citationCoverage.minRequiredEvidenceCount must be positive");
assert(Number.isInteger(qaCitationCoverage.minCitedRequiredEvidenceCount) && qaCitationCoverage.minCitedRequiredEvidenceCount > 0, "QA citation citationCoverage.minCitedRequiredEvidenceCount must be positive");
assert(Number.isInteger(qaCitationCoverage.minUniqueEvidenceFileCount) && qaCitationCoverage.minUniqueEvidenceFileCount > 0, "QA citation citationCoverage.minUniqueEvidenceFileCount must be positive");
assert(Number.isInteger(qaCitationCoverage.minCitedEvidenceFileCount) && qaCitationCoverage.minCitedEvidenceFileCount > 0, "QA citation citationCoverage.minCitedEvidenceFileCount must be positive");
assert(Number.isInteger(qaCitationCoverage.minPrimaryEvidenceFileCount) && qaCitationCoverage.minPrimaryEvidenceFileCount > 0, "QA citation citationCoverage.minPrimaryEvidenceFileCount must be positive");
assert(Number.isInteger(qaCitationCoverage.minCitedPrimaryEvidenceFileCount) && qaCitationCoverage.minCitedPrimaryEvidenceFileCount >= qaCitationCoverage.minPrimaryEvidenceFileCount, "QA citation citationCoverage.minCitedPrimaryEvidenceFileCount must cover primary files");
assert(Number.isInteger(qaCitationCoverage.maxUncitedPrimaryEvidenceCount) && qaCitationCoverage.maxUncitedPrimaryEvidenceCount === 0, "QA citation citationCoverage.maxUncitedPrimaryEvidenceCount must be 0");
assert(Number.isInteger(qaCitationCoverage.maxUncitedPrimaryEvidenceFileCount) && qaCitationCoverage.maxUncitedPrimaryEvidenceFileCount === 0, "QA citation citationCoverage.maxUncitedPrimaryEvidenceFileCount must be 0");
assert(Number.isInteger(qaCitationCoverage.minContextEvidenceFileCount) && qaCitationCoverage.minContextEvidenceFileCount >= 0, "QA citation citationCoverage.minContextEvidenceFileCount must be non-negative");
assert(Number.isInteger(qaCitationCoverage.minCitedContextEvidenceFileCount) && qaCitationCoverage.minCitedContextEvidenceFileCount >= 0, "QA citation citationCoverage.minCitedContextEvidenceFileCount must be non-negative");
assert(Number.isInteger(qaCitationCoverage.minUncitedContextEvidenceCount) && qaCitationCoverage.minUncitedContextEvidenceCount > 0, "QA citation citationCoverage.minUncitedContextEvidenceCount must be positive");
assert(Number.isInteger(qaCitationCoverage.minUncitedContextEvidenceFileCount) && qaCitationCoverage.minUncitedContextEvidenceFileCount > 0, "QA citation citationCoverage.minUncitedContextEvidenceFileCount must be positive");
assert(Number.isInteger(qaCitationCoverage.minRequiredEvidenceFileCount) && qaCitationCoverage.minRequiredEvidenceFileCount > 0, "QA citation citationCoverage.minRequiredEvidenceFileCount must be positive");
assert(Number.isInteger(qaCitationCoverage.minCitedRequiredEvidenceFileCount) && qaCitationCoverage.minCitedRequiredEvidenceFileCount >= qaCitationCoverage.minRequiredEvidenceFileCount, "QA citation citationCoverage.minCitedRequiredEvidenceFileCount must cover required files");
assertRequiredCoverageScopes(qaCitationCoverage.coverageScopes, "QA citation citationCoverage.coverageScopes");
assertEvidenceRoleDistribution(qaCitationCoverage.evidenceRoleDistribution, qaCitationCoverage, "QA citation citationCoverage.evidenceRoleDistribution", "verified");
assertReadyClaimCitationCoverage(qaFromEvidence.claimCitationCoverage, "QA citation claimCitationCoverage");
assertCrossFileCitationSummary(qaFromEvidence.crossFileCitationSummary, qaCitationCoverage, qaFromEvidence.claimCitationCoverage, "QA citation crossFileCitationSummary", "verified");
assert(qaFromEvidence.expectedEvidenceFileVisible === true, "QA citation expectedEvidenceFileVisible must be true");
assert(Array.isArray(qaFromEvidence.groundingStatuses) && qaFromEvidence.groundingStatuses.length > 0, "QA citation groundingStatuses must be a non-empty array");
assert(qaFromEvidence.groundingStatuses.every((status) => status === "VERIFIED"), "QA citation groundingStatuses must prove verified cited answers");
assert(Array.isArray(qaFromEvidence.citationEnforcementStatuses) && qaFromEvidence.citationEnforcementStatuses.length > 0, "QA citation citationEnforcementStatuses must be a non-empty array");
assert(qaFromEvidence.citationEnforcementStatuses.every((status) => allowedCitationEnforcement.has(status)), "QA citation citationEnforcementStatuses must prove successful citation enforcement");
assert(Array.isArray(qaFromEvidence.citationEnforcementReasons) && qaFromEvidence.citationEnforcementReasons.length > 0, "QA citation citationEnforcementReasons must be a non-empty array");
assert(qaFromEvidence.citationEnforcementReasons.every((reason) => allowedCitationEnforcementReasons.has(reason)), "QA citation citationEnforcementReasons must prove successful citation enforcement reasons");
const relationAwareEvidenceReason = qaFromEvidence.relationAwareEvidenceReason;
assert(relationAwareEvidenceReason && typeof relationAwareEvidenceReason === "object" && !Array.isArray(relationAwareEvidenceReason), "QA citation relationAwareEvidenceReason must be an object");
assert(relationAwareEvidenceReason.status === "OK", "QA citation relationAwareEvidenceReason.status must be OK");
assert(relationAwareEvidenceReason.marker === "Graph relation:", "QA citation relationAwareEvidenceReason.marker must prove graph relation evidence reason");
assert(Number.isInteger(relationAwareEvidenceReason.minCitationReasonCount) && relationAwareEvidenceReason.minCitationReasonCount > 0, "QA citation relationAwareEvidenceReason.minCitationReasonCount must be positive");
assert(Number.isInteger(relationAwareEvidenceReason.minRetrievedChunkReasonCount) && relationAwareEvidenceReason.minRetrievedChunkReasonCount > 0, "QA citation relationAwareEvidenceReason.minRetrievedChunkReasonCount must be positive");
assert(relationAwareEvidenceReason.adjacentContextReasonVisible === true, "QA citation relationAwareEvidenceReason.adjacentContextReasonVisible must be true");
assert(relationAwareEvidenceReason.uiReasonVisible === true, "QA citation relationAwareEvidenceReason.uiReasonVisible must be true");
assert(relationAwareEvidenceReason.providerQualityClaim === false, "QA citation relationAwareEvidenceReason.providerQualityClaim must be false");
assert(relationAwareEvidenceReason.llmFactClaim === false, "QA citation relationAwareEvidenceReason.llmFactClaim must be false");
for (const field of ["rawAnswer", "rawPrompt", "content", "sourceContent", "stack", "log"]) {
  assert(!Object.prototype.hasOwnProperty.call(relationAwareEvidenceReason, field), `QA citation relationAwareEvidenceReason must not contain ${field}`);
}
const evidenceRef = qaFromEvidence.evidenceRef;
assert(evidenceRef && typeof evidenceRef === "object" && !Array.isArray(evidenceRef), "QA citation evidenceRef must be an object");
assert(evidenceRef.requestBound === true, "QA citation evidenceRef.requestBound must be true");
assert(evidenceRef.responseBound === true, "QA citation evidenceRef.responseBound must be true");
assert(evidenceRef.contextVisible === true, "QA citation evidenceRef.contextVisible must be true");
assert(evidenceRef.filePath === targetFile, "QA citation evidenceRef.filePath must match the target evidence file");
assert(!evidenceRef.filePath.startsWith("/") && !evidenceRef.filePath.includes("..") && !evidenceRef.filePath.includes("\\"), "QA citation evidenceRef.filePath must be a safe relative path");
assertEvidenceLineRangePriority(qaFromEvidence.evidenceLineRangePriority, "QA citation evidenceLineRangePriority");
assertDeepEvidenceCardReadability(qaFromEvidence.deepEvidenceCardReadability, "QA citation deepEvidenceCardReadability");
const repairEvidenceGate = qaFromEvidence.repairEvidenceGate;
assert(repairEvidenceGate && typeof repairEvidenceGate === "object" && !Array.isArray(repairEvidenceGate), "QA citation repairEvidenceGate must be an object");
assert(repairEvidenceGate.readyVisible === true, "QA citation repairEvidenceGate.readyVisible must be true");
assert(repairEvidenceGate.sourceEvidenceMatchType === "REPORT_LINE_ANCHOR", "QA citation repairEvidenceGate.sourceEvidenceMatchType must be REPORT_LINE_ANCHOR");
const unverifiedCitation = qaFromEvidence.unverifiedCitation;
assert(unverifiedCitation && typeof unverifiedCitation === "object" && !Array.isArray(unverifiedCitation), "QA citation unverifiedCitation must be an object");
assert(unverifiedCitation.status === "OK", "QA citation unverifiedCitation.status must be OK");
assert(unverifiedCitation.responseStatus === 200, "QA citation unverifiedCitation.responseStatus must be 200");
assert(Number.isInteger(unverifiedCitation.resultCount) && unverifiedCitation.resultCount > 0, "QA citation unverifiedCitation.resultCount must be positive");
assert(Number.isInteger(unverifiedCitation.citationCount) && unverifiedCitation.citationCount > 0, "QA citation unverifiedCitation.citationCount must be positive");
assert(Number.isInteger(unverifiedCitation.uncitedCandidateCount) && unverifiedCitation.uncitedCandidateCount > 0, "QA citation unverifiedCitation.uncitedCandidateCount must be positive");
const unverifiedCitationCoverage = unverifiedCitation.citationCoverage;
assert(unverifiedCitationCoverage && typeof unverifiedCitationCoverage === "object" && !Array.isArray(unverifiedCitationCoverage), "QA citation unverifiedCitation.citationCoverage must be an object");
assertRequiredStringSet(unverifiedCitationCoverage.statuses, ["NONE"], "QA citation unverifiedCitation.citationCoverage.statuses");
assert(unverifiedCitationCoverage.minCoveragePercent === 0, "QA citation unverifiedCitation.citationCoverage.minCoveragePercent must be 0");
assert(unverifiedCitationCoverage.minTotalEvidenceCount === unverifiedCitation.citationCount, "QA citation unverifiedCitation.citationCoverage.minTotalEvidenceCount must match citationCount");
assert(unverifiedCitationCoverage.minCitedEvidenceCount === 0, "QA citation unverifiedCitation.citationCoverage.minCitedEvidenceCount must be 0");
assert(unverifiedCitationCoverage.minUncitedCandidateCount === unverifiedCitation.uncitedCandidateCount, "QA citation unverifiedCitation.citationCoverage.minUncitedCandidateCount must match uncitedCandidateCount");
assert(unverifiedCitationCoverage.minRepairCandidateCount === 0, "QA citation unverifiedCitation.citationCoverage.minRepairCandidateCount must be 0");
assert(Number.isInteger(unverifiedCitationCoverage.minRequiredEvidenceCoveragePercent), "QA citation unverifiedCitation.citationCoverage.minRequiredEvidenceCoveragePercent must be an integer");
assert(Number.isInteger(unverifiedCitationCoverage.minRequiredEvidenceCount) && unverifiedCitationCoverage.minRequiredEvidenceCount > 0, "QA citation unverifiedCitation.citationCoverage.minRequiredEvidenceCount must be positive");
assert(Number.isInteger(unverifiedCitationCoverage.minCitedRequiredEvidenceCount), "QA citation unverifiedCitation.citationCoverage.minCitedRequiredEvidenceCount must be an integer");
assert(unverifiedCitationCoverage.minRequiredEvidenceCoveragePercent === 0, "QA citation unverifiedCitation.citationCoverage.minRequiredEvidenceCoveragePercent must be 0");
assert(unverifiedCitationCoverage.minCitedRequiredEvidenceCount === 0, "QA citation unverifiedCitation.citationCoverage.minCitedRequiredEvidenceCount must be 0");
assert(Number.isInteger(unverifiedCitationCoverage.minUniqueEvidenceFileCount) && unverifiedCitationCoverage.minUniqueEvidenceFileCount > 0, "QA citation unverifiedCitation.citationCoverage.minUniqueEvidenceFileCount must be positive");
assert(Number.isInteger(unverifiedCitationCoverage.maxCitedEvidenceFileCount) && unverifiedCitationCoverage.maxCitedEvidenceFileCount === 0, "QA citation unverifiedCitation.citationCoverage.maxCitedEvidenceFileCount must be 0");
assert(Number.isInteger(unverifiedCitationCoverage.minPrimaryEvidenceFileCount) && unverifiedCitationCoverage.minPrimaryEvidenceFileCount > 0, "QA citation unverifiedCitation.citationCoverage.minPrimaryEvidenceFileCount must be positive");
assert(Number.isInteger(unverifiedCitationCoverage.maxCitedPrimaryEvidenceFileCount) && unverifiedCitationCoverage.maxCitedPrimaryEvidenceFileCount === 0, "QA citation unverifiedCitation.citationCoverage.maxCitedPrimaryEvidenceFileCount must be 0");
assert(Number.isInteger(unverifiedCitationCoverage.minContextEvidenceFileCount) && unverifiedCitationCoverage.minContextEvidenceFileCount >= 0, "QA citation unverifiedCitation.citationCoverage.minContextEvidenceFileCount must be non-negative");
assert(Number.isInteger(unverifiedCitationCoverage.maxCitedContextEvidenceFileCount) && unverifiedCitationCoverage.maxCitedContextEvidenceFileCount >= 0, "QA citation unverifiedCitation.citationCoverage.maxCitedContextEvidenceFileCount must be non-negative");
assert(Number.isInteger(unverifiedCitationCoverage.minRequiredEvidenceFileCount) && unverifiedCitationCoverage.minRequiredEvidenceFileCount > 0, "QA citation unverifiedCitation.citationCoverage.minRequiredEvidenceFileCount must be positive");
assert(Number.isInteger(unverifiedCitationCoverage.maxCitedRequiredEvidenceFileCount) && unverifiedCitationCoverage.maxCitedRequiredEvidenceFileCount === 0, "QA citation unverifiedCitation.citationCoverage.maxCitedRequiredEvidenceFileCount must be 0");
assertRequiredCoverageScopes(unverifiedCitationCoverage.coverageScopes, "QA citation unverifiedCitation.citationCoverage.coverageScopes");
assertEvidenceRoleDistribution(unverifiedCitationCoverage.evidenceRoleDistribution, unverifiedCitationCoverage, "QA citation unverifiedCitation.citationCoverage.evidenceRoleDistribution", "unverified");
assertReviewClaimCitationCoverage(unverifiedCitation.claimCitationCoverage, "QA citation unverifiedCitation.claimCitationCoverage");
assertCrossFileCitationSummary(unverifiedCitation.crossFileCitationSummary, unverifiedCitationCoverage, unverifiedCitation.claimCitationCoverage, "QA citation unverifiedCitation.crossFileCitationSummary", "unverified");
assert(unverifiedCitation.expectedEvidenceFileVisible === true, "QA citation unverifiedCitation.expectedEvidenceFileVisible must be true");
assert(Array.isArray(unverifiedCitation.groundingStatuses) && unverifiedCitation.groundingStatuses.length === 1 && unverifiedCitation.groundingStatuses[0] === "PARTIAL", "QA citation unverifiedCitation.groundingStatuses must prove partial grounding");
assert(Array.isArray(unverifiedCitation.citationEnforcementStatuses) && unverifiedCitation.citationEnforcementStatuses.length === 1 && unverifiedCitation.citationEnforcementStatuses[0] === "RETRY_FAILED", "QA citation unverifiedCitation.citationEnforcementStatuses must prove retry failed enforcement");
assert(unverifiedCitation.evidenceRefRequestBound === true, "QA citation unverifiedCitation.evidenceRefRequestBound must be true");
assert(unverifiedCitation.evidenceRefResponseBound === true, "QA citation unverifiedCitation.evidenceRefResponseBound must be true");
assert(unverifiedCitation.repairEvidenceGateBlockedVisible === true, "QA citation unverifiedCitation.repairEvidenceGateBlockedVisible must be true");
const claimCitationNoiseBoundary = qaFromEvidence.claimCitationNoiseBoundary;
assert(claimCitationNoiseBoundary && typeof claimCitationNoiseBoundary === "object" && !Array.isArray(claimCitationNoiseBoundary), "QA citation claimCitationNoiseBoundary must be an object");
assert(claimCitationNoiseBoundary.status === "OK", "QA citation claimCitationNoiseBoundary.status must be OK");
assert(Number.isInteger(claimCitationNoiseBoundary.requestCount) && claimCitationNoiseBoundary.requestCount > 0, "QA citation claimCitationNoiseBoundary.requestCount must be positive");
assertRequiredStringSet(claimCitationNoiseBoundary.noiseKinds, ["exception-line", "fenced-code", "inline-code", "timestamp-log"], "QA citation claimCitationNoiseBoundary.noiseKinds");
assert(claimCitationNoiseBoundary.coverageStatus === "NONE", "QA citation claimCitationNoiseBoundary.coverageStatus must be NONE");
assert(claimCitationNoiseBoundary.maxCitedEvidenceCount === 0, "QA citation claimCitationNoiseBoundary.maxCitedEvidenceCount must be 0");
assert(claimCitationNoiseBoundary.maxRepairCandidateCount === 0, "QA citation claimCitationNoiseBoundary.maxRepairCandidateCount must be 0");
assert(claimCitationNoiseBoundary.claimCitationStatus === "REVIEW", "QA citation claimCitationNoiseBoundary.claimCitationStatus must be REVIEW");
assert(claimCitationNoiseBoundary.maxCitedRequiredClaimCount === 0, "QA citation claimCitationNoiseBoundary.maxCitedRequiredClaimCount must be 0");
assert(claimCitationNoiseBoundary.maxInvalidCitationClaimCount === 0, "QA citation claimCitationNoiseBoundary.maxInvalidCitationClaimCount must be 0");
assert(claimCitationNoiseBoundary.roleDistributionStatus === "REVIEW_UNCITED", "QA citation claimCitationNoiseBoundary.roleDistributionStatus must be REVIEW_UNCITED");
assert(claimCitationNoiseBoundary.maxRequiredPrimaryBoundClaimCount === 0, "QA citation claimCitationNoiseBoundary.maxRequiredPrimaryBoundClaimCount must be 0");
assertRequiredStringSet(claimCitationNoiseBoundary.groundingStatuses, ["PARTIAL"], "QA citation claimCitationNoiseBoundary.groundingStatuses");
assertRequiredStringSet(claimCitationNoiseBoundary.citationEnforcementStatuses, ["RETRY_FAILED"], "QA citation claimCitationNoiseBoundary.citationEnforcementStatuses");
assert(claimCitationNoiseBoundary.answerCitationsCitedByAnswer === false, "QA citation claimCitationNoiseBoundary.answerCitationsCitedByAnswer must be false");
assert(claimCitationNoiseBoundary.repairEvidenceGateBlockedVisible === true, "QA citation claimCitationNoiseBoundary.repairEvidenceGateBlockedVisible must be true");
assert(claimCitationNoiseBoundary.rawAnswerStored === false, "QA citation claimCitationNoiseBoundary.rawAnswerStored must be false");
assert(claimCitationNoiseBoundary.rawPromptStored === false, "QA citation claimCitationNoiseBoundary.rawPromptStored must be false");
for (const field of ["rawAnswer", "rawPrompt", "content", "stack", "log", "sourceContent"]) {
  assert(!Object.prototype.hasOwnProperty.call(claimCitationNoiseBoundary, field), `QA citation claimCitationNoiseBoundary must not contain ${field}`);
}
assert(claimCitationNoiseBoundary.providerQualityClaim === false, "QA citation claimCitationNoiseBoundary.providerQualityClaim must be false");
assert(claimCitationNoiseBoundary.llmFactClaim === false, "QA citation claimCitationNoiseBoundary.llmFactClaim must be false");
if (Object.prototype.hasOwnProperty.call(qaFromEvidence, "claimRoleDistributionMissing")) {
  assertClaimRoleDistributionReviewDrift(qaFromEvidence.claimRoleDistributionMissing, "QA citation claimRoleDistributionMissing", false);
}
if (Object.prototype.hasOwnProperty.call(qaFromEvidence, "claimRoleDistributionMismatch")) {
  assertClaimRoleDistributionReviewDrift(qaFromEvidence.claimRoleDistributionMismatch, "QA citation claimRoleDistributionMismatch", true);
}
const qaDrift = Object.prototype.hasOwnProperty.call(qaFromEvidence, "drift") ? qaFromEvidence.drift : null;
if (qaDrift !== null) {
  assert(qaDrift && typeof qaDrift === "object" && !Array.isArray(qaDrift), "QA citation qaFromEvidence.drift must be an object when present");
  assertAllowedObjectKeys(qaDrift, new Set(["claimRoleDistributionMissing", "claimRoleDistributionMismatch"]), "QA citation qaFromEvidence.drift");
  assert(Object.prototype.hasOwnProperty.call(qaDrift, "claimRoleDistributionMissing"), "QA citation qaFromEvidence.drift.claimRoleDistributionMissing must be present when drift object is present");
  assert(Object.prototype.hasOwnProperty.call(qaDrift, "claimRoleDistributionMismatch"), "QA citation qaFromEvidence.drift.claimRoleDistributionMismatch must be present when drift object is present");
  assertClaimRoleDistributionReviewDrift(qaDrift.claimRoleDistributionMissing, "QA citation qaFromEvidence.drift.claimRoleDistributionMissing", false);
  assertClaimRoleDistributionReviewDrift(qaDrift.claimRoleDistributionMismatch, "QA citation qaFromEvidence.drift.claimRoleDistributionMismatch", true);
}
const claimRoleDistributionMissingDrift = qaDrift && Object.prototype.hasOwnProperty.call(qaDrift, "claimRoleDistributionMissing")
  ? qaDrift.claimRoleDistributionMissing
  : (Object.prototype.hasOwnProperty.call(qaFromEvidence, "claimRoleDistributionMissing") ? qaFromEvidence.claimRoleDistributionMissing : null);
const claimRoleDistributionMismatchDrift = qaDrift && Object.prototype.hasOwnProperty.call(qaDrift, "claimRoleDistributionMismatch")
  ? qaDrift.claimRoleDistributionMismatch
  : (Object.prototype.hasOwnProperty.call(qaFromEvidence, "claimRoleDistributionMismatch") ? qaFromEvidence.claimRoleDistributionMismatch : null);
assertFileAnchorDriftReview(qaFromEvidence.fileAnchorDrift, "QA citation fileAnchorDrift");
const expectedQaTotalRequestCount = qaPayload.qaRequestCount
  + claimCitationNoiseBoundary.requestCount
  + qaFromEvidence.fileAnchorDrift.requestCount
  + (claimRoleDistributionMissingDrift ? claimRoleDistributionMissingDrift.requestCount : 0)
  + (claimRoleDistributionMismatchDrift ? claimRoleDistributionMismatchDrift.requestCount : 0);
if (expectedQaTotalRequestCount > qaPayload.qaRequestCount) {
  assert(Number.isInteger(qaPayload.qaTotalRequestCount), "QA citation qaTotalRequestCount must be present when claim role drift markers are present");
  assert(qaPayload.qaTotalRequestCount >= expectedQaTotalRequestCount, "QA citation qaTotalRequestCount must include qaRequestCount and claim role drift requestCount values");
}
NODE
}

validate_scan_governance_timeline_ui_smoke_success_marker() {
  local smoke_log_file="$1"
  if [[ "$STATUS_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE" != "OK" ]]; then
    return
  fi

  node - "$smoke_log_file" <<'NODE' || fail "release evidence scan-governance-timeline-ui-smoke OK must prove mocked scan governance timeline aggregate flow"
const fs = require("node:fs");
const logFile = process.argv[2];
const lines = fs.readFileSync(logFile, "utf8").split(/\r?\n/);
const prefix = "SCAN_GOVERNANCE_TIMELINE_SMOKE_OK ";
const matches = lines.filter((line) => line.startsWith(prefix));

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function assertRequiredStringSet(value, required, label) {
  assert(Array.isArray(value), `${label} must be an array`);
  const actual = new Set(value);
  for (const item of value) {
    assert(typeof item === "string" && item.trim() === item, `${label} must contain only trimmed strings`);
  }
  for (const item of required) {
    assert(actual.has(item), `${label} missing ${item}`);
  }
}

assert(matches.length === 1, "expected exactly one SCAN_GOVERNANCE_TIMELINE_SMOKE_OK marker");
assert(lines.some((line) => /scan-governance-timeline-smoke\.spec\.ts/.test(line)), "missing scan-governance-timeline-smoke.spec.ts execution evidence");

let payload;
try {
  payload = JSON.parse(matches[0].slice(prefix.length));
} catch (error) {
  console.error(`invalid SCAN_GOVERNANCE_TIMELINE_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);

assert(payload && typeof payload === "object" && !Array.isArray(payload), "marker payload must be an object");
assert(payload.mockedApiOnly === true, "mockedApiOnly must be true");
assert(payload.unhandledApiRequests === 0, "unhandledApiRequests must be 0");
assert(payload.scanTaskId === 8801, "scanTaskId must match the scan governance timeline smoke fixture");
assert(payload.foreignScanExcluded === true, "foreignScanExcluded must be true");
assert(payload.stageRail && typeof payload.stageRail === "object" && !Array.isArray(payload.stageRail), "stageRail must be an object");
assert(payload.stageRail.visible === true, "stageRail.visible must be true");
assertRequiredStringSet(payload.stageRail.stages, ["风险定位", "修复候选", "Patch 证据", "PR 复核", "审计归档"], "SCAN_GOVERNANCE_TIMELINE_SMOKE_OK stageRail.stages");
assertRequiredStringSet(payload.stageRail.states, ["ready", "blocked"], "SCAN_GOVERNANCE_TIMELINE_SMOKE_OK stageRail.states");
assert(payload.stageRail.states.length === 5, "stageRail.states must include one state per stage");
assert(payload.candidateReceipt && typeof payload.candidateReceipt === "object" && !Array.isArray(payload.candidateReceipt), "candidateReceipt must be an object");
assert(payload.candidateReceipt.eventVisible === true, "candidateReceipt.eventVisible must be true");
assert(payload.candidateReceipt.sourceTypeVisible === true, "candidateReceipt.sourceTypeVisible must be true");
assert(payload.candidateReceipt.repairEvidenceGate === "READY", "candidateReceipt.repairEvidenceGate must prove READY server-derived gate");
assert(typeof payload.candidateReceipt.repairEvidenceGateReason === "string" && payload.candidateReceipt.repairEvidenceGateReason.trim().length > 0, "candidateReceipt.repairEvidenceGateReason must prove a visible server-derived gate reason");
assert(payload.candidateReceipt.repairEvidenceGateSource === "SERVER_DERIVED", "candidateReceipt.repairEvidenceGateSource must prove server-derived provenance");
assert(payload.candidateReceipt.serverDerivedGateVisible === true, "candidateReceipt.serverDerivedGateVisible must be true");
assert(payload.candidateReceipt.currentReceiptVisible === true, "candidateReceipt.currentReceiptVisible must be true");
assert(payload.candidateReceipt.foreignReceiptHidden === true, "candidateReceipt.foreignReceiptHidden must be true");
assert(payload.candidateReceipt.autoRepairDeepLinkBound === true, "candidateReceipt.autoRepairDeepLinkBound must be true");
assert(payload.candidateReceipt.sourceReportDeepLinkBound === true, "candidateReceipt.sourceReportDeepLinkBound must be true");
assert(payload.candidateReceipt.qaReviewDeepLinkBound === true, "candidateReceipt.qaReviewDeepLinkBound must be true");
assertRequiredStringSet(payload.candidateReceipt.actionLabels, ["打开修复详情", "打开来源报告", "QA 复核来源"], "SCAN_GOVERNANCE_TIMELINE_SMOKE_OK candidateReceipt.actionLabels");
assert(payload.candidateReceipt.noRawPromptOrAnswer === true, "candidateReceipt.noRawPromptOrAnswer must be true");
assert(payload.prGate && typeof payload.prGate === "object" && !Array.isArray(payload.prGate), "prGate must be an object");
assert(payload.prGate.eventVisible === true, "prGate.eventVisible must be true");
assert(payload.prGate.action === "AUTO_REPAIR_PR_REJECTED", "prGate.action must prove the rejected PR gate fixture");
assert(payload.prGate.currentRepairVisible === true, "prGate.currentRepairVisible must be true");
assert(payload.prGate.foreignPrGateHidden === true, "prGate.foreignPrGateHidden must be true");
assert(payload.prGate.autoRepairDeepLinkBound === true, "prGate.autoRepairDeepLinkBound must be true");
assert(payload.prGate.actionLabel === "打开修复详情", "prGate.actionLabel must be 打开修复详情");
assert(payload.prGate.auditSourceBound === true, "prGate.auditSourceBound must be true");
assert(payload.prGate.scanTaskIdBound === true, "prGate.scanTaskIdBound must be true");
assert(payload.prGate.noRawPromptOrAnswer === true, "prGate.noRawPromptOrAnswer must be true");
assert(payload.patchEvidence && typeof payload.patchEvidence === "object" && !Array.isArray(payload.patchEvidence), "patchEvidence must be an object");
assert(payload.patchEvidence.repairVisible === true, "patchEvidence.repairVisible must be true");
assert(payload.patchEvidence.autoRepairId === 6101, "patchEvidence.autoRepairId must prove the current AutoRepair fixture");
assert(payload.patchEvidence.repairStatus === "PATCH_READY", "patchEvidence.repairStatus must be PATCH_READY");
assert(payload.patchEvidence.scanTaskIdBound === true, "patchEvidence.scanTaskIdBound must be true");
assert(payload.patchEvidence.targetFileVisible === true, "patchEvidence.targetFileVisible must be true");
assert(payload.patchEvidence.diffVisible === true, "patchEvidence.diffVisible must be true");
assert(payload.patchEvidence.patchArtifactVisible === true, "patchEvidence.patchArtifactVisible must be true");
assert(payload.patchEvidence.patchArtifactOwnerType === "AUTO_REPAIR", "patchEvidence.patchArtifactOwnerType must be AUTO_REPAIR");
assert(payload.patchEvidence.patchArtifactOwnerId === 6101, "patchEvidence.patchArtifactOwnerId must bind artifact to current AutoRepair");
assert(payload.patchEvidence.patchArtifactType === "CHANGE_PATCH", "patchEvidence.patchArtifactType must be CHANGE_PATCH");
assert(payload.patchEvidence.patchArtifactActionVisible === true, "patchEvidence.patchArtifactActionVisible must be true");
assert(payload.patchEvidence.patchArtifactActionLabel === "打开补丁产物", "patchEvidence.patchArtifactActionLabel must be 打开补丁产物");
assert(payload.patchEvidence.patchArtifactDeepLinkBound === true, "patchEvidence.patchArtifactDeepLinkBound must be true");
assert(payload.patchEvidence.repairExecutionVisible === true, "patchEvidence.repairExecutionVisible must be true");
assert(payload.patchEvidence.repairExecutionSourceType === "AUTO_REPAIR", "patchEvidence.repairExecutionSourceType must be AUTO_REPAIR");
assert(payload.patchEvidence.repairExecutionSourceId === 6101, "patchEvidence.repairExecutionSourceId must bind execution to current AutoRepair");
assert(payload.patchEvidence.repairExecutionStatus === "SUCCESS", "patchEvidence.repairExecutionStatus must be SUCCESS");
assert(payload.patchEvidence.repairExecutionActionLabel === "打开执行详情", "patchEvidence.repairExecutionActionLabel must be 打开执行详情");
assert(payload.patchEvidence.repairExecutionDeepLinkBound === true, "patchEvidence.repairExecutionDeepLinkBound must be true");
assert(payload.patchEvidence.patchGenerationStepVisible === true, "patchEvidence.patchGenerationStepVisible must be true");
assert(payload.patchEvidence.patchGenerationStepKey === "generate_patch", "patchEvidence.patchGenerationStepKey must be generate_patch");
assert(payload.patchEvidence.patchGenerationStepStatus === "SUCCESS", "patchEvidence.patchGenerationStepStatus must be SUCCESS");
assert(payload.patchEvidence.patchReadyAuditVisible === true, "patchEvidence.patchReadyAuditVisible must be true");
assert(payload.patchEvidence.patchReadyAuditAction === "AUTO_REPAIR_PATCH_READY", "patchEvidence.patchReadyAuditAction must be AUTO_REPAIR_PATCH_READY");
assert(payload.patchEvidence.patchReadyAuditStatus === "SUCCESS", "patchEvidence.patchReadyAuditStatus must be SUCCESS");
assert(payload.patchEvidence.patchReadyAuditActionLabel === "打开审计日志", "patchEvidence.patchReadyAuditActionLabel must be 打开审计日志");
assert(payload.patchEvidence.patchReadyAuditDeepLinkBound === true, "patchEvidence.patchReadyAuditDeepLinkBound must be true");
assert(payload.patchEvidence.auditSourceBound === true, "patchEvidence.auditSourceBound must be true");
assert(payload.patchEvidence.foreignPatchEvidenceHidden === true, "patchEvidence.foreignPatchEvidenceHidden must be true");
assert(payload.patchEvidence.noRawPromptOrAnswer === true, "patchEvidence.noRawPromptOrAnswer must be true");
assert(payload.agentReview && typeof payload.agentReview === "object" && !Array.isArray(payload.agentReview), "agentReview must be an object");
assert(payload.agentReview.currentAgentTaskVisible === true, "agentReview.currentAgentTaskVisible must be true");
assert(payload.agentReview.currentAgentTaskId === 9101, "agentReview.currentAgentTaskId must prove the current Agent task fixture");
assert(payload.agentReview.agentTaskActionLabel === "打开 Agent 任务", "agentReview.agentTaskActionLabel must be 打开 Agent 任务");
assert(payload.agentReview.agentTaskDeepLinkBound === true, "agentReview.agentTaskDeepLinkBound must be true");
assert(payload.agentReview.foreignAgentTaskHidden === true, "agentReview.foreignAgentTaskHidden must be true");
assert(payload.agentReview.toolCallAuditVisible === true, "agentReview.toolCallAuditVisible must be true");
assert(payload.agentReview.currentToolCallId === 11101, "agentReview.currentToolCallId must prove the current Agent tool-call fixture");
assert(payload.agentReview.toolCallAuditActionLabel === "打开审计日志", "agentReview.toolCallAuditActionLabel must be 打开审计日志");
assert(payload.agentReview.toolCallAuditDeepLinkBound === true, "agentReview.toolCallAuditDeepLinkBound must be true");
assert(payload.agentReview.foreignToolCallHidden === true, "agentReview.foreignToolCallHidden must be true");
assert(payload.agentReview.agentExecutionBound === true, "agentReview.agentExecutionBound must be true");
assert(payload.agentReview.currentAgentExecutionVisible === true, "agentReview.currentAgentExecutionVisible must be true");
assert(payload.agentReview.agentExecutionSourceType === "AGENT_TASK", "agentReview.agentExecutionSourceType must be AGENT_TASK");
assert(payload.agentReview.agentExecutionSourceId === 9101, "agentReview.agentExecutionSourceId must bind execution to the current Agent task");
assert(payload.agentReview.agentExecutionActionLabel === "打开执行详情", "agentReview.agentExecutionActionLabel must be 打开执行详情");
assert(payload.agentReview.agentExecutionDeepLinkBound === true, "agentReview.agentExecutionDeepLinkBound must be true");
assert(payload.agentReview.scanTaskIdBound === true, "agentReview.scanTaskIdBound must be true");
assert(payload.agentReview.noRawPromptOrAnswer === true, "agentReview.noRawPromptOrAnswer must be true");
assertRequiredStringSet(payload.viewports, ["1440x900", "320x740"], "SCAN_GOVERNANCE_TIMELINE_SMOKE_OK viewports");
assert(payload.spec === "scan-governance-timeline-smoke.spec.ts", "spec must be scan-governance-timeline-smoke.spec.ts");
assert(localHosts.has(payload.baseURLHost), "baseURLHost must be local-only");
NODE
}

validate_agent_chat_audit_ui_smoke_success_marker() {
  local smoke_log_file="$1"
  if [[ "$STATUS_AGENT_CHAT_AUDIT_UI_SMOKE" != "OK" ]]; then
    return
  fi

  node - "$smoke_log_file" <<'NODE' || fail "release evidence agent-chat-audit-ui-smoke OK must prove mocked AgentChat audit deep link flow"
const fs = require("node:fs");
const logFile = process.argv[2];
const lines = fs.readFileSync(logFile, "utf8").split(/\r?\n/);
const prefix = "AGENT_CHAT_AUDIT_SMOKE_OK ";
const matches = lines.filter((line) => line.startsWith(prefix));

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(matches.length === 1, "expected exactly one AGENT_CHAT_AUDIT_SMOKE_OK marker");
assert(lines.some((line) => /agent-chat-audit-smoke\.spec\.ts/.test(line)), "missing agent-chat-audit-smoke.spec.ts execution evidence");

let payload;
try {
  payload = JSON.parse(matches[0].slice(prefix.length));
} catch (error) {
  console.error(`invalid AGENT_CHAT_AUDIT_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);

assert(payload && typeof payload === "object" && !Array.isArray(payload), "marker payload must be an object");
assert(payload.projectId === 1, "projectId must match the AgentChat audit smoke fixture");
assert(payload.conversationId === 77, "conversationId must match the AgentChat audit smoke fixture");
assert(payload.toolCallId === 901, "toolCallId must match the AgentChat audit smoke fixture");
assert(payload.deepLink === true, "deepLink must be true");
assert(payload.conversationFilter === true, "conversationFilter must be true");
assert(payload.unhandledApiRequests === 0, "unhandledApiRequests must be 0");
assert(payload.mockedApiOnly === true, "mockedApiOnly must be true");
assert(payload.spec === "agent-chat-audit-smoke.spec.ts", "spec must be agent-chat-audit-smoke.spec.ts");
assert(localHosts.has(payload.baseURLHost), "baseURLHost must be local-only");
NODE
}

validate_agent_chat_closure_rail_ui_smoke_success_marker() {
  local smoke_log_file="$1"
  if [[ "${STATUS_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE:-}" != "OK" ]]; then
    return
  fi

  node - "$smoke_log_file" <<'NODE' || fail "release evidence agent-chat-closure-rail-ui-smoke OK must prove controlled code-understanding AgentTask binding and manual-send evidence closure without raw prompt, auto-send or auto-start"
const fs = require("node:fs");
const logFile = process.argv[2];
const text = fs.readFileSync(logFile, "utf8");
const lines = text.split(/\r?\n/);
const prefix = "AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK ";
const matches = lines.filter((line) => line.startsWith(prefix));

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function assertPositiveInteger(value, label) {
  assert(Number.isInteger(value) && value > 0, `${label} must be a positive integer`);
}

function assertRequiredStringSet(values, required, label) {
  assert(Array.isArray(values), `${label} must be an array`);
  const set = new Set(values);
  for (const item of required) {
    assert(set.has(item), `${label} must include ${item}`);
  }
}

const forbiddenText = /\b(token|password|authorization|bearer|private_key|api_key|secret)\b/i;
const forbiddenKeys = new Set([
  "token",
  "password",
  "authorization",
  "privateKey",
  "apiKey",
  "secret",
  "prompt",
  "rawPrompt",
  "stack",
  "rawStack",
  "rawOutput",
  "rawAnswer",
  "sourceContent",
  "codeBody",
]);

function walk(value, path = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, path.concat(String(index))));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    assert(!forbiddenKeys.has(key), `marker must not include sensitive/raw key ${path.concat(key).join(".")}`);
    walk(child, path.concat(key));
  }
}

assert(matches.length === 1, "expected exactly one AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK marker");
assert(lines.some((line) => /agent-chat-closure-rail-smoke\.spec\.ts/.test(line)), "missing agent-chat-closure-rail-smoke.spec.ts execution evidence");
assert(!forbiddenText.test(matches[0]), "marker must not contain token/password/authorization/private key labels");

let payload;
try {
  payload = JSON.parse(matches[0].slice(prefix.length));
} catch (error) {
  console.error(`invalid AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
assert(payload && typeof payload === "object" && !Array.isArray(payload), "marker payload must be an object");
walk(payload);
assert(payload.mockedApiOnly === true, "mockedApiOnly must be true");
assert(payload.unhandledApiRequests === 0, "unhandledApiRequests must be 0");
assert(payload.runtimeIssues === 0, "runtimeIssues must be 0");
assert(payload.noHorizontalOverflow === true, "noHorizontalOverflow must be true");
assert(payload.spec === "agent-chat-closure-rail-smoke.spec.ts", "spec must be agent-chat-closure-rail-smoke.spec.ts");
assert(localHosts.has(payload.baseURLHost), "baseURLHost must be local-only");
assertRequiredStringSet(payload.viewports, ["1440x900", "320x740"], "AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK viewports");
assertPositiveInteger(payload.projectId, "projectId");
assertPositiveInteger(payload.scanTaskId, "scanTaskId");
assertPositiveInteger(payload.conversationId, "conversationId");
assertPositiveInteger(payload.agentTaskId, "agentTaskId");
assertPositiveInteger(payload.linkedAgentTaskId, "linkedAgentTaskId");
assertPositiveInteger(payload.handoffAgentTaskId, "handoffAgentTaskId");
assert(payload.linkedAgentTaskId === payload.agentTaskId, "linkedAgentTaskId must match marker agentTaskId");

const handoff = payload.codeUnderstandingHandoff;
assert(handoff && typeof handoff === "object" && !Array.isArray(handoff), "codeUnderstandingHandoff must be an object");
assert(handoff.status === "OK", "codeUnderstandingHandoff.status must be OK");
assert(handoff.surface === "PROJECT_DETAIL_CODE_UNDERSTANDING_AGENT_HANDOFF", "codeUnderstandingHandoff.surface must be PROJECT_DETAIL_CODE_UNDERSTANDING_AGENT_HANDOFF");
assert(handoff.source === "PROJECT_QA_CODE_UNDERSTANDING_LENS", "codeUnderstandingHandoff.source must be PROJECT_QA_CODE_UNDERSTANDING_LENS");
assert(handoff.projectId === payload.projectId, "codeUnderstandingHandoff.projectId must match marker projectId");
assert(handoff.scanTaskId === payload.scanTaskId, "codeUnderstandingHandoff.scanTaskId must match marker scanTaskId");
assertPositiveInteger(handoff.conversationId, "codeUnderstandingHandoff.conversationId");
assert(handoff.inputKind === "FILE_LINE", "codeUnderstandingHandoff.inputKind must be FILE_LINE");
assert(handoff.queryShape === "file:line", "codeUnderstandingHandoff.queryShape must be file:line");
assert(typeof handoff.sourceLabel === "string" && /^C\d+$/.test(handoff.sourceLabel), "codeUnderstandingHandoff.sourceLabel must be a response-local C label");
assert(typeof handoff.filePath === "string" && handoff.filePath.trim() && !handoff.filePath.includes("..") && !handoff.filePath.startsWith("/"), "codeUnderstandingHandoff.filePath must be a safe relative path");
assert(typeof handoff.lineRef === "string" && handoff.lineRef.includes(handoff.filePath), "codeUnderstandingHandoff.lineRef must include filePath");
assert(handoff.contextRole === "PRIMARY", "codeUnderstandingHandoff.contextRole must be PRIMARY");
assert(typeof handoff.evidenceType === "string" && handoff.evidenceType.trim(), "codeUnderstandingHandoff.evidenceType must be present");
assert(Number.isInteger(handoff.relevanceScore) && handoff.relevanceScore >= 0 && handoff.relevanceScore <= 100, "codeUnderstandingHandoff.relevanceScore must be 0..100");
assert(handoff.rawPromptInUrl === false, "codeUnderstandingHandoff.rawPromptInUrl must be false");
assert(handoff.rawPromptInUrlBlocked === true, "codeUnderstandingHandoff.rawPromptInUrlBlocked must be true");
assert(handoff.handoffVisible === true, "codeUnderstandingHandoff.handoffVisible must be true");
assert(handoff.draftPrefilled === true, "codeUnderstandingHandoff.draftPrefilled must be true");
assert(handoff.conversationCreatedOrSelected === true, "codeUnderstandingHandoff.conversationCreatedOrSelected must be true");
assert(handoff.autoSent === false, "codeUnderstandingHandoff.autoSent must be false");
assert(handoff.rawStackStored === false, "codeUnderstandingHandoff.rawStackStored must be false");
assert(handoff.providerQualityClaim === false, "codeUnderstandingHandoff.providerQualityClaim must be false");
assert(handoff.llmFactClaim === false, "codeUnderstandingHandoff.llmFactClaim must be false");
assert(handoff.noHorizontalOverflow === true, "codeUnderstandingHandoff.noHorizontalOverflow must be true");

const preConversationState = handoff.preConversationState;
assert(preConversationState && typeof preConversationState === "object" && !Array.isArray(preConversationState), "preConversationState must be an object");
assert(preConversationState.status === "OK", "preConversationState.status must be OK");
assert(preConversationState.usePromptHiddenOrDisabled === true, "preConversationState.usePromptHiddenOrDisabled must be true");
assert(preConversationState.createBoundTaskPrimaryCta === true, "preConversationState.createBoundTaskPrimaryCta must be true");
assert(preConversationState.createTaskDisabledWhenMissingScan === true, "preConversationState.createTaskDisabledWhenMissingScan must be true");
assert(preConversationState.missingScanTaskCreateBlocked === true, "preConversationState.missingScanTaskCreateBlocked must be true");
assert(preConversationState.missingScanReasonVisible === true, "preConversationState.missingScanReasonVisible must be true");
assert(preConversationState.noAutoSentWithoutScan === true, "preConversationState.noAutoSentWithoutScan must be true");

const binding = handoff.agentTaskBinding;
assert(binding && typeof binding === "object" && !Array.isArray(binding), "agentTaskBinding must be an object");
assert(binding.status === "OK", "agentTaskBinding.status must be OK");
assert(binding.projectId === payload.projectId && binding.projectId === handoff.projectId, "agentTaskBinding.projectId must match parent projectId");
assert(binding.scanTaskId === payload.scanTaskId && binding.scanTaskId === handoff.scanTaskId, "agentTaskBinding.scanTaskId must match parent scanTaskId");
assert(binding.conversationId === handoff.conversationId, "agentTaskBinding.conversationId must match handoff conversationId");
assertPositiveInteger(binding.agentTaskId, "agentTaskBinding.agentTaskId");
assert(binding.agentTaskId === payload.handoffAgentTaskId, "agentTaskBinding.agentTaskId must match marker handoffAgentTaskId");
assert(binding.taskStatus === "PENDING", "agentTaskBinding.taskStatus must be PENDING");
assert(binding.taskType === "CUSTOM", "agentTaskBinding.taskType must be CUSTOM");
assert(binding.sameProjectBound === true, "agentTaskBinding.sameProjectBound must be true");
assert(binding.sameScanBound === true, "agentTaskBinding.sameScanBound must be true");
assert(binding.conversationBound === true, "agentTaskBinding.conversationBound must be true");
assert(binding.boundByBackend === true, "agentTaskBinding.boundByBackend must be true");
assert(binding.structuredInputOnly === true, "agentTaskBinding.structuredInputOnly must be true");
assert(binding.rawPromptStored === false, "agentTaskBinding.rawPromptStored must be false");
assert(binding.rawStackStored === false, "agentTaskBinding.rawStackStored must be false");
assert(binding.autoStarted === false, "agentTaskBinding.autoStarted must be false");
assert(binding.agentTaskCreated === true, "agentTaskBinding.agentTaskCreated must be true");

const manualSend = handoff.manualSend;
assert(manualSend && typeof manualSend === "object" && !Array.isArray(manualSend), "manualSend must be an object");
assert(manualSend.status === "OK", "manualSend.status must be OK");
assert(manualSend.triggeredByUser === true, "manualSend.triggeredByUser must be true");
assert(manualSend.messageRequestAfterClick === true, "manualSend.messageRequestAfterClick must be true");
assert(manualSend.autoSentBeforeClick === false, "manualSend.autoSentBeforeClick must be false");
assert(manualSend.agentTaskStillPending === true, "manualSend.agentTaskStillPending must be true");
assert(manualSend.autoStarted === false, "manualSend.autoStarted must be false");
assert(manualSend.writeToolTriggered === false, "manualSend.writeToolTriggered must be false");
assert(manualSend.closureRailStillBound === true, "manualSend.closureRailStillBound must be true");
assert(manualSend.auditReviewVisible === true, "manualSend.auditReviewVisible must be true");
assert(manualSend.rawPromptStored === false, "manualSend.rawPromptStored must be false");
assert(manualSend.rawStackStored === false, "manualSend.rawStackStored must be false");
NODE
}

validate_agent_chat_tool_audit_smoke_success_marker() {
  local smoke_log_file="$1"
  if [[ "$STATUS_AGENT_CHAT_TOOL_AUDIT_SMOKE" != "OK" ]]; then
    return
  fi

  node - "$smoke_log_file" <<'NODE' || fail "release evidence agent-chat-tool-audit-smoke OK must prove real backend AgentChat tool audit flow"
const fs = require("node:fs");
const logFile = process.argv[2];
const text = fs.readFileSync(logFile, "utf8");
const lines = text.split(/\r?\n/);
const prefix = "AGENT_CHAT_TOOL_AUDIT_SMOKE_OK ";
const matches = lines.filter((line) => line.startsWith(prefix));

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(matches.length === 1, "expected exactly one AGENT_CHAT_TOOL_AUDIT_SMOKE_OK marker");

let payload;
try {
  payload = JSON.parse(matches[0].slice(prefix.length));
} catch (error) {
  console.error(`invalid AGENT_CHAT_TOOL_AUDIT_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const forbiddenText = /\b(token|password|authorization|bearer|private_key|api_key)\b/i;
const forbiddenKeys = new Set([
  "token",
  "password",
  "authorization",
  "privateKey",
  "apiKey",
  "prompt",
  "sseText",
  "toolResult",
  "toolResults",
  "toolArgs",
  "rawOutput",
  "repoDir",
  "repositoryPath",
]);

function walk(value, path = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, path.concat(String(index))));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    assert(!forbiddenKeys.has(key), `marker must not include sensitive/raw key ${path.concat(key).join(".")}`);
    walk(child, path.concat(key));
  }
}

assert(payload && typeof payload === "object" && !Array.isArray(payload), "marker payload must be an object");
walk(payload);
assert(!forbiddenText.test(matches[0]), "marker must not contain token/password/authorization/private key labels");
assert(payload.spec === "agent-chat-tool-audit-smoke", "spec must be agent-chat-tool-audit-smoke");
assert(payload.backendEvidence === true, "backendEvidence must be true");
assert(payload.agentChatPath === true, "agentChatPath must be true");
assert(payload.directToolExecutionOnly === false, "directToolExecutionOnly must be false");
assert(payload.toolName === "read_file", "toolName must be read_file");
assert(payload.permissionLevel === "READ_ONLY", "permissionLevel must be READ_ONLY");
assert(payload.success === true, "success must be true");
assert(payload.mockedLLM === true, "mockedLLM must be true");
assert(payload.externalLlm === false, "externalLlm must be false");
assert(payload.externalNetwork === false, "externalNetwork must be false");
assert(payload.noExternalNetwork === true, "noExternalNetwork must be true");
assert(localHosts.has(payload.baseURLHost), "baseURLHost must be local-only");
for (const key of [
  "projectId",
  "repositoryId",
  "userId",
  "conversationId",
  "wrongConversationId",
  "toolCallId",
  "persistedConversationId",
  "persistedProjectId",
  "persistedCreatedBy",
]) {
  assert(Number.isInteger(payload[key]) && payload[key] > 0, `${key} must be a positive integer`);
}
assert(payload.persistedConversationId === payload.conversationId, "persistedConversationId must match conversationId");
assert(payload.persistedProjectId === payload.projectId, "persistedProjectId must match projectId");
assert(payload.persistedCreatedBy === payload.userId, "persistedCreatedBy must match userId");
assert(Number.isInteger(payload.queryByConversationIdCount) && payload.queryByConversationIdCount >= 1, "queryByConversationIdCount must be >= 1");
assert(Number.isInteger(payload.successCount) && payload.successCount >= 1, "successCount must be >= 1");
assert(payload.wrongConversationIdCount === 0, "wrongConversationIdCount must be 0");
assert(payload.mismatchCount === 0, "mismatchCount must be 0");
assert(payload.sseToolCallEventSeen === true, "sseToolCallEventSeen must be true");
assert(payload.sseToolResultEventSeen === true, "sseToolResultEventSeen must be true");
assert(payload.sseDoneEventSeen === true, "sseDoneEventSeen must be true");
assert(payload.assistantToolCallsPersisted === true, "assistantToolCallsPersisted must be true");
assert(payload.toolResultsPersisted === true, "toolResultsPersisted must be true");
NODE
}

validate_artifacts_detail_selection_ui_smoke_success_marker() {
  local run_dir="$1"

  node - "$run_dir" <<'NODE' || fail "release evidence artifacts-detail-selection marker must prove raw download audit receipt and fallback boundaries"
const fs = require("node:fs");
const path = require("node:path");

const runDir = process.argv[2];
const prefix = "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK ";
const requiredViewports = ["1440x900", "390x844", "320x740"];
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const matches = [];

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(child);
    } else if (entry.isFile() && entry.name.endsWith(".log")) {
      const relative = path.relative(runDir, child);
      for (const line of fs.readFileSync(child, "utf8").split(/\r?\n/)) {
        if (line.startsWith(prefix)) {
          matches.push({ relative, line });
        }
      }
    }
  }
}

function assertRequiredStringSet(value, required, label) {
  assert(Array.isArray(value), `${label} must be an array`);
  const actual = new Set(value);
  for (const item of value) {
    assert(typeof item === "string" && item.trim() === item, `${label} must contain only trimmed strings`);
  }
  for (const item of required) {
    assert(actual.has(item), `${label} missing ${item}`);
  }
}

function assertObject(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value;
}

visit(runDir);

if (matches.length === 0) {
  process.exit(0);
}

assert(matches.length === 1, "expected at most one ARTIFACTS_DETAIL_SELECTION_SMOKE_OK marker in release evidence logs");

let payload;
try {
  payload = JSON.parse(matches[0].line.slice(prefix.length));
} catch (error) {
  console.error(`invalid ARTIFACTS_DETAIL_SELECTION_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

assertObject(payload, "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK payload");
assert(payload.mockedApiOnly === true, "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK mockedApiOnly must be true");
assert(payload.unhandledApiRequests === 0, "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK unhandledApiRequests must be 0");
assert(payload.runtimeIssues === 0, "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK runtimeIssues must be 0");
assert(payload.noHorizontalOverflow === true, "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK noHorizontalOverflow must be true");
assert(payload.spec === "artifacts-detail-selection-smoke.spec.ts", "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK spec must identify the Artifacts smoke");
assert(localHosts.has(payload.baseURLHost), "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK baseURLHost must be local-only");
assertRequiredStringSet(payload.viewports, requiredViewports, "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK viewports");

const boundary = assertObject(payload.rawDownloadBoundary, "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK rawDownloadBoundary");
assert(boundary.scope === "ARTIFACTS_RAW_DOWNLOAD_ACKNOWLEDGEMENT_AUDIT_BOUNDARY_ONLY", "rawDownloadBoundary.scope must prove acknowledgement/audit boundary");
assert(boundary.requestBound === true, "rawDownloadBoundary.requestBound must be true");
assert(boundary.acknowledgementPresent === true, "rawDownloadBoundary.acknowledgementPresent must be true");
assert(boundary.receiptBoundaryExpected === true, "rawDownloadBoundary.receiptBoundaryExpected must be true");
assert(boundary.artifactIdBound === true, "rawDownloadBoundary.artifactIdBound must be true");
assert(boundary.noDrawerHijack === true, "rawDownloadBoundary.noDrawerHijack must be true");
assert(boundary.rawDownloadRedactionClaim === false, "rawDownloadBoundary.rawDownloadRedactionClaim must be false");
assert(boundary.markerContainsRawContent === false, "rawDownloadBoundary.markerContainsRawContent must be false");

const deepLink = assertObject(payload.rawDownloadAuditDeepLink, "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK rawDownloadAuditDeepLink");
assert(deepLink.scope === "ARTIFACTS_RAW_DOWNLOAD_AUDIT_DEEP_LINK_ONLY", "rawDownloadAuditDeepLink.scope must prove audit deep link only");
assert(deepLink.visible === true, "rawDownloadAuditDeepLink.visible must be true");
assert(deepLink.projectBound === true, "rawDownloadAuditDeepLink.projectBound must be true");
assert(Number.isInteger(deepLink.auditLogId) && deepLink.auditLogId > 0, "rawDownloadAuditDeepLink.auditLogId must be a positive integer");
assert(deepLink.auditLogIdBound === true, "rawDownloadAuditDeepLink.auditLogIdBound must be true");
assert(deepLink.resourceType === "ARTIFACT", "rawDownloadAuditDeepLink.resourceType must be ARTIFACT");
assert(Number.isInteger(deepLink.resourceId) && deepLink.resourceId > 0, "rawDownloadAuditDeepLink.resourceId must be a positive integer");
assert(deepLink.action === "ARTIFACT_RAW_DOWNLOAD", "rawDownloadAuditDeepLink.action must be ARTIFACT_RAW_DOWNLOAD");
assert(deepLink.status === "SUCCESS", "rawDownloadAuditDeepLink.status must be SUCCESS");
assert(deepLink.successOnly === true, "rawDownloadAuditDeepLink.successOnly must be true");
assert(deepLink.navigatesToAuditLogs === true, "rawDownloadAuditDeepLink.navigatesToAuditLogs must be true");
assert(deepLink.lowSensitiveQueryOnly === true, "rawDownloadAuditDeepLink.lowSensitiveQueryOnly must be true");
assert(deepLink.urlHasRawPayload === false, "rawDownloadAuditDeepLink.urlHasRawPayload must be false");
assert(deepLink.urlHasStoragePath === false, "rawDownloadAuditDeepLink.urlHasStoragePath must be false");
assert(deepLink.urlHasFileName === false, "rawDownloadAuditDeepLink.urlHasFileName must be false");

const fallback = assertObject(payload.rawDownloadAuditFallback, "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK rawDownloadAuditFallback");
assert(fallback.scope === "ARTIFACTS_RAW_DOWNLOAD_AUDIT_FALLBACK_WITHOUT_RECEIPT_ID_ONLY", "rawDownloadAuditFallback.scope must prove fallback without receipt id");
assert(fallback.visible === true, "rawDownloadAuditFallback.visible must be true");
assert(Number.isInteger(fallback.artifactId) && fallback.artifactId > 0, "rawDownloadAuditFallback.artifactId must be a positive integer");
assert(fallback.receiptIdMissing === true, "rawDownloadAuditFallback.receiptIdMissing must be true");
assert(fallback.fallbackUsesResourceActionStatus === true, "rawDownloadAuditFallback.fallbackUsesResourceActionStatus must be true");
assert(fallback.fallbackUrlHasAuditLogId === false, "rawDownloadAuditFallback.fallbackUrlHasAuditLogId must be false");
assert(fallback.fallbackDoesNotClaimReceiptId === true, "rawDownloadAuditFallback.fallbackDoesNotClaimReceiptId must be true");
assert(fallback.urlHasRawPayload === false, "rawDownloadAuditFallback.urlHasRawPayload must be false");
assert(fallback.urlHasFileName === false, "rawDownloadAuditFallback.urlHasFileName must be false");

const serialized = JSON.stringify(payload);
assert(!/(raw artifact download payload|BEGIN PRIVATE KEY|authorization|password|token)/i.test(serialized), "ARTIFACTS_DETAIL_SELECTION_SMOKE_OK marker must not contain raw payload or secret labels");
NODE
}

validate_audit_logs_artifact_raw_download_ui_smoke_success_marker() {
  local run_dir="$1"

  node - "$run_dir" <<'NODE' || fail "release evidence audit-logs artifact raw download marker must prove receipt-id-bound exact audit deep link"
const fs = require("node:fs");
const path = require("node:path");

const runDir = process.argv[2];
const prefix = "AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK ";
const matches = [];

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(child);
    } else if (entry.isFile() && entry.name.endsWith(".log")) {
      for (const line of fs.readFileSync(child, "utf8").split(/\r?\n/)) {
        if (line.startsWith(prefix)) {
          matches.push(line);
        }
      }
    }
  }
}

function assertObject(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value;
}

visit(runDir);

if (matches.length === 0) {
  process.exit(0);
}

assert(matches.length === 1, "expected at most one AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK marker in release evidence logs");

let payload;
try {
  payload = JSON.parse(matches[0].slice(prefix.length));
} catch (error) {
  console.error(`invalid AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK JSON: ${error.message}`);
  process.exit(1);
}

assertObject(payload, "AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK payload");
assert(payload.mockedApiOnly === true, "AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK mockedApiOnly must be true");
assert(payload.unhandledApiRequests === 0, "AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK unhandledApiRequests must be 0");
assert(payload.viewport === "390x844", "AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK viewport must be 390x844");

const deepLink = assertObject(payload.artifactRawDownloadAuditDeepLink, "artifactRawDownloadAuditDeepLink");
assert(Number.isInteger(deepLink.selectedAuditLogId) && deepLink.selectedAuditLogId > 0, "selectedAuditLogId must be positive");
assert(Number.isInteger(deepLink.conflictingSameResourceAuditLogId) && deepLink.conflictingSameResourceAuditLogId > 0, "conflictingSameResourceAuditLogId must be positive");
assert(deepLink.conflictingSameResourceAuditLogId !== deepLink.selectedAuditLogId, "conflictingSameResourceAuditLogId must differ from selectedAuditLogId");
assert(deepLink.auditLogId === deepLink.selectedAuditLogId, "auditLogId must match selectedAuditLogId");
assert(deepLink.auditLogIdBound === true, "auditLogIdBound must be true");
assert(deepLink.resourceType === "ARTIFACT", "resourceType must be ARTIFACT");
assert(Number.isInteger(deepLink.resourceId) && deepLink.resourceId > 0, "resourceId must be positive");
assert(deepLink.action === "ARTIFACT_RAW_DOWNLOAD", "action must be ARTIFACT_RAW_DOWNLOAD");
assert(deepLink.status === "SUCCESS", "status must be SUCCESS");
assert(deepLink.resourceActionStatusMatched === true, "resourceActionStatusMatched must be true");
assert(deepLink.associatedResourceReturnBound === true, "associatedResourceReturnBound must be true");
assert(deepLink.lowSensitiveQueryOnly === true, "lowSensitiveQueryOnly must be true");
assert(typeof deepLink.associatedResourceTarget === "string", "associatedResourceTarget must be a string");
assert(/^\/artifacts\?/.test(deepLink.associatedResourceTarget), "associatedResourceTarget must return to Artifacts");
const targetUrl = new URL(deepLink.associatedResourceTarget, "http://127.0.0.1");
assert(targetUrl.pathname === "/artifacts", "associatedResourceTarget path must be /artifacts");
assert(targetUrl.searchParams.get("artifactId") === String(deepLink.resourceId), "associatedResourceTarget artifactId must match resourceId");
assert(/^[1-9][0-9]*$/.test(targetUrl.searchParams.get("projectId") || ""), "associatedResourceTarget projectId must be a positive integer");
for (const forbidden of ["auditLogId", "rawPayload", "storagePath", "fileName", "filename", "contentType", "checksum", "sizeBytes"]) {
  assert(!targetUrl.searchParams.has(forbidden), `associatedResourceTarget must not contain ${forbidden}`);
}

const serialized = JSON.stringify(payload);
assert(!/(rawPayload|storagePath|fileName|filename|contentType|checksum|sizeBytes|authorization|password|token|BEGIN PRIVATE KEY)/i.test(serialized), "AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK marker must not contain raw artifact metadata or secret labels");
NODE
}

validate_required_package_structure() {
  local summary_file="${RUN_DIR}/summary.md"
  local status_file="${RUN_DIR}/status.tsv"
  local git_manifest_file="${RUN_DIR}/manifest.txt"
  local git_status_file="${RUN_DIR}/git-status.txt"
  local git_diff_stat_file="${RUN_DIR}/git-diff-stat.txt"
  local worktree_inventory_file="${RUN_DIR}/worktree-inventory.md"
  local public_repo_smoke_log_file="${RUN_DIR}/public-repo-smoke.log"
  local autorepair_patch_smoke_log_file="${RUN_DIR}/autorepair-patch-smoke.log"
  local patch_ready_ui_smoke_log_file="${RUN_DIR}/patch-ready-ui-smoke.log"
  local dashboard_next_action_ui_smoke_log_file="${RUN_DIR}/dashboard-next-action-ui-smoke.log"
  local report_evidence_drawer_ui_smoke_log_file="${RUN_DIR}/report-evidence-drawer-ui-smoke.log"
  local scan_governance_timeline_ui_smoke_log_file="${RUN_DIR}/scan-governance-timeline-ui-smoke.log"
  local agent_chat_audit_ui_smoke_log_file="${RUN_DIR}/agent-chat-audit-ui-smoke.log"
  local agent_chat_closure_rail_ui_smoke_log_file="${RUN_DIR}/agent-chat-closure-rail-ui-smoke.log"
  local agent_chat_tool_audit_smoke_log_file="${RUN_DIR}/agent-chat-tool-audit-smoke.log"
  local audit_workbench_smoke_log_file="${RUN_DIR}/audit-workbench-smoke.log"
  local required_file

  require_private_file_600 "$summary_file" "release evidence summary"
  require_private_file_600 "$status_file" "release evidence status table"
  require_private_file_600 "$git_manifest_file" "release evidence git manifest"
  require_private_file_600 "$git_status_file" "release evidence git status snapshot"
  require_private_file_600 "$git_diff_stat_file" "release evidence git diff stat snapshot"
  require_private_file_600 "$worktree_inventory_file" "release evidence worktree inventory"

  require_no_control_chars "$git_status_file" "release evidence git status snapshot"
  require_no_control_chars "$git_diff_stat_file" "release evidence git diff stat snapshot"
  require_no_control_chars "$worktree_inventory_file" "release evidence worktree inventory"

  require_file_matches "$summary_file" "release evidence summary" '^# SourceLens Release Evidence$'
  require_file_matches "$summary_file" "release evidence summary" '^## Steps$'
  require_file_matches "$summary_file" "release evidence summary" '^## Summary$'
  require_file_matches "$summary_file" "release evidence summary" '^- required_failures: `'
  require_file_matches "$summary_file" "release evidence summary" '^- optional_warnings: `'
  require_file_matches "$summary_file" "release evidence summary" '^- skipped: `'

  require_file_matches "$git_manifest_file" "release evidence git manifest" '^run_id: '
  require_file_matches "$git_manifest_file" "release evidence git manifest" '^created_at: '
  require_file_matches "$git_manifest_file" "release evidence git manifest" '^git_head: '

  : > "$EXPECTED_PACKAGE_FILES"
  : > "$EXPECTED_PACKAGE_DIRS"
  for required_file in \
    summary.md \
    status.tsv \
    manifest.txt \
    git-status.txt \
    git-diff-stat.txt \
    worktree-inventory.md \
    checksums.sha256
  do
    record_expected_package_file "$required_file"
  done

  validate_release_metadata "$summary_file" "$git_manifest_file"
  validate_manifest_file_shape "$git_manifest_file"
  validate_status_table "$status_file"
  validate_manifest_status_consistency
  validate_worktree_inventory_file "$worktree_inventory_file"
  validate_dashboard_next_action_ui_smoke_success_marker "$dashboard_next_action_ui_smoke_log_file"
  validate_public_repo_smoke_success_marker "$public_repo_smoke_log_file"
  validate_autorepair_patch_smoke_success_marker "$autorepair_patch_smoke_log_file"
  validate_patch_ready_ui_smoke_success_marker "$patch_ready_ui_smoke_log_file"
  validate_report_evidence_drawer_ui_smoke_success_marker "$report_evidence_drawer_ui_smoke_log_file"
  validate_scan_governance_timeline_ui_smoke_success_marker "$scan_governance_timeline_ui_smoke_log_file"
  validate_agent_chat_audit_ui_smoke_success_marker "$agent_chat_audit_ui_smoke_log_file"
  validate_agent_chat_closure_rail_ui_smoke_success_marker "$agent_chat_closure_rail_ui_smoke_log_file"
  validate_agent_chat_tool_audit_smoke_success_marker "$agent_chat_tool_audit_smoke_log_file"
  validate_artifacts_detail_selection_ui_smoke_success_marker "$RUN_DIR"
  validate_audit_logs_artifact_raw_download_ui_smoke_success_marker "$RUN_DIR"
  validate_audit_workbench_strict_sample_evidence "$audit_workbench_smoke_log_file"
  validate_summary_steps "$summary_file"
  validate_summary_counts "$summary_file"
  validate_authority_counts "$summary_file"
  validate_summary_file_shape "$summary_file"
}

validate_status_table() {
  local status_file="$1"
  local header
  local status
  local slug
  local exit_code
  local log_file
  local detail
  local extra
  local row_count=0
  local seen_git_metadata=0
  local seen_worktree_inventory=0
  local seen_make_verify=0
  local seen_prod_preflight=0
  local seen_backup_preflight=0
  local seen_rollback_preflight=0
  local seen_backup_restore_drill_evidence=0
  local seen_rollback_plan=0
  local seen_smoke=0
  local seen_public_repo_smoke=0
  local seen_file_bound_repair_smoke=0
  local seen_autorepair_patch_smoke=0
  local seen_patch_ready_ui_smoke=0
  local seen_dashboard_next_action_ui_smoke=0
  local seen_report_evidence_drawer_ui_smoke=0
  local seen_scan_governance_timeline_ui_smoke=0
  local seen_agent_chat_audit_ui_smoke=0
  local seen_agent_chat_closure_rail_ui_smoke=0
  local seen_agent_chat_tool_audit_smoke=0
  local seen_audit_workbench_smoke=0
  local seen_phase12_baseline=0
  local seen_sandbox_drill=0
  local seen_github_app_drill=0
  local seen_github_webhook_drill=0
  local seen_llm_provider_run=0
  STATUS_FAIL_COUNT=0
  STATUS_WARN_COUNT=0
  STATUS_SKIP_COUNT=0
  STATUS_GIT_METADATA=""
  STATUS_MAKE_VERIFY=""
  STATUS_PROD_PREFLIGHT=""
  STATUS_BACKUP_PREFLIGHT=""
  STATUS_ROLLBACK_PREFLIGHT=""
  STATUS_WORKTREE_INVENTORY=""
  STATUS_SMOKE=""
  STATUS_PUBLIC_REPO_SMOKE=""
  STATUS_FILE_BOUND_REPAIR_SMOKE=""
  STATUS_AUTOREPAIR_PATCH_SMOKE=""
  STATUS_PATCH_READY_UI_SMOKE=""
  STATUS_DASHBOARD_NEXT_ACTION_UI_SMOKE=""
  STATUS_REPORT_EVIDENCE_DRAWER_UI_SMOKE=""
  STATUS_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE=""
  STATUS_AGENT_CHAT_AUDIT_UI_SMOKE=""
  STATUS_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE=""
  STATUS_AGENT_CHAT_TOOL_AUDIT_SMOKE=""
  STATUS_AUDIT_WORKBENCH_SMOKE=""
  STATUS_PHASE12_BASELINE=""
  STATUS_SANDBOX_DRILL=""
  STATUS_GITHUB_APP_DRILL=""
  STATUS_GITHUB_WEBHOOK_DRILL=""
  STATUS_LLM_PROVIDER_RUN=""
  STATUS_DETAIL_MAKE_VERIFY=""
  STATUS_DETAIL_PROD_PREFLIGHT=""
  STATUS_DETAIL_BACKUP_PREFLIGHT=""
  STATUS_DETAIL_ROLLBACK_PREFLIGHT=""
  STATUS_DETAIL_WORKTREE_INVENTORY=""
  STATUS_DETAIL_SMOKE=""
  STATUS_DETAIL_PUBLIC_REPO_SMOKE=""
  STATUS_DETAIL_FILE_BOUND_REPAIR_SMOKE=""
  STATUS_DETAIL_AUTOREPAIR_PATCH_SMOKE=""
  STATUS_DETAIL_PATCH_READY_UI_SMOKE=""
  STATUS_DETAIL_DASHBOARD_NEXT_ACTION_UI_SMOKE=""
  STATUS_DETAIL_REPORT_EVIDENCE_DRAWER_UI_SMOKE=""
  STATUS_DETAIL_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE=""
  STATUS_DETAIL_AGENT_CHAT_AUDIT_UI_SMOKE=""
  STATUS_DETAIL_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE=""
  STATUS_DETAIL_AGENT_CHAT_TOOL_AUDIT_SMOKE=""
  STATUS_DETAIL_AUDIT_WORKBENCH_SMOKE=""
  STATUS_DETAIL_PHASE12_BASELINE=""
  STATUS_DETAIL_SANDBOX_DRILL=""
  STATUS_DETAIL_GITHUB_APP_DRILL=""
  STATUS_DETAIL_GITHUB_WEBHOOK_DRILL=""
  STATUS_DETAIL_LLM_PROVIDER_RUN=""
  : > "$STATUS_SUMMARY_EXPECTED_FILE"

  IFS= read -r header < "$status_file" || fail "release evidence status table must not be empty"
  if [[ "$header" != $'status\tslug\texit_code\tlog_file\tdetail' ]]; then
    fail "release evidence status table header is invalid"
  fi

  while IFS=$'\t' read -r status slug exit_code log_file detail extra; do
    row_count=$((row_count + 1))
    if [[ -n "${extra:-}" ]]; then
      fail "release evidence status table row has too many columns: $slug"
    fi
    case "$status" in
      OK|WARN|FAIL|SKIP) ;;
      *) fail "release evidence status table has invalid status: $status" ;;
    esac
    if [[ ! "$slug" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$ ]]; then
      fail "release evidence status table has unsafe slug: $slug"
    fi
    if [[ -z "$exit_code" || -z "$log_file" || -z "$detail" ]]; then
      fail "release evidence status table row is incomplete: $slug"
    fi
    if [[ "$detail" =~ [[:cntrl:]] ]]; then
      fail "release evidence status table row detail contains control characters: $slug"
    fi
    if [[ "$detail" == *'`'* ]]; then
      fail "release evidence status table row detail contains backticks: $slug"
    fi
    case "$status" in
      FAIL) STATUS_FAIL_COUNT=$((STATUS_FAIL_COUNT + 1)) ;;
      WARN) STATUS_WARN_COUNT=$((STATUS_WARN_COUNT + 1)) ;;
      SKIP) STATUS_SKIP_COUNT=$((STATUS_SKIP_COUNT + 1)) ;;
    esac
    printf -- '- %s `%s`: %s (%s)\n' \
      "$status" \
      "$slug" \
      "$(summary_title_for_slug "$slug")" \
      "$detail" >> "$STATUS_SUMMARY_EXPECTED_FILE"
    validate_status_exit_code "$status" "$slug" "$exit_code"
    validate_package_file_path "$log_file"
    validate_status_log_file_for_slug_name "$slug" "$log_file"
    validate_status_log_file_for_slug "$status" "$slug" "$log_file"
    record_expected_package_file "$log_file"
    if [[ "$slug" == "llm-provider-run" && "$status" == "OK" ]]; then
      record_expected_package_file "llm-provider-run.json"
      record_llm_provider_raw_output_files
    fi
    require_private_file_600 "${RUN_DIR}/${log_file}" "release evidence status log file $log_file"
    case "$slug" in
      git-metadata) seen_git_metadata=$((seen_git_metadata + 1)); STATUS_GIT_METADATA="$status" ;;
      worktree-inventory) seen_worktree_inventory=$((seen_worktree_inventory + 1)); STATUS_WORKTREE_INVENTORY="$status"; STATUS_DETAIL_WORKTREE_INVENTORY="$detail" ;;
      make-verify) seen_make_verify=$((seen_make_verify + 1)); STATUS_MAKE_VERIFY="$status"; STATUS_DETAIL_MAKE_VERIFY="$detail" ;;
      prod-preflight) seen_prod_preflight=$((seen_prod_preflight + 1)); STATUS_PROD_PREFLIGHT="$status"; STATUS_DETAIL_PROD_PREFLIGHT="$detail" ;;
      backup-preflight) seen_backup_preflight=$((seen_backup_preflight + 1)); STATUS_BACKUP_PREFLIGHT="$status"; STATUS_DETAIL_BACKUP_PREFLIGHT="$detail" ;;
      rollback-preflight) seen_rollback_preflight=$((seen_rollback_preflight + 1)); STATUS_ROLLBACK_PREFLIGHT="$status"; STATUS_DETAIL_ROLLBACK_PREFLIGHT="$detail" ;;
      backup-restore-drill-evidence) seen_backup_restore_drill_evidence=$((seen_backup_restore_drill_evidence + 1)) ;;
      rollback-plan) seen_rollback_plan=$((seen_rollback_plan + 1)) ;;
      smoke) seen_smoke=$((seen_smoke + 1)); STATUS_SMOKE="$status"; STATUS_DETAIL_SMOKE="$detail" ;;
      public-repo-smoke) seen_public_repo_smoke=$((seen_public_repo_smoke + 1)); STATUS_PUBLIC_REPO_SMOKE="$status"; STATUS_DETAIL_PUBLIC_REPO_SMOKE="$detail" ;;
      file-bound-repair-smoke) seen_file_bound_repair_smoke=$((seen_file_bound_repair_smoke + 1)); STATUS_FILE_BOUND_REPAIR_SMOKE="$status"; STATUS_DETAIL_FILE_BOUND_REPAIR_SMOKE="$detail" ;;
      autorepair-patch-smoke) seen_autorepair_patch_smoke=$((seen_autorepair_patch_smoke + 1)); STATUS_AUTOREPAIR_PATCH_SMOKE="$status"; STATUS_DETAIL_AUTOREPAIR_PATCH_SMOKE="$detail" ;;
      patch-ready-ui-smoke) seen_patch_ready_ui_smoke=$((seen_patch_ready_ui_smoke + 1)); STATUS_PATCH_READY_UI_SMOKE="$status"; STATUS_DETAIL_PATCH_READY_UI_SMOKE="$detail" ;;
      dashboard-next-action-ui-smoke) seen_dashboard_next_action_ui_smoke=$((seen_dashboard_next_action_ui_smoke + 1)); STATUS_DASHBOARD_NEXT_ACTION_UI_SMOKE="$status"; STATUS_DETAIL_DASHBOARD_NEXT_ACTION_UI_SMOKE="$detail" ;;
      report-evidence-drawer-ui-smoke) seen_report_evidence_drawer_ui_smoke=$((seen_report_evidence_drawer_ui_smoke + 1)); STATUS_REPORT_EVIDENCE_DRAWER_UI_SMOKE="$status"; STATUS_DETAIL_REPORT_EVIDENCE_DRAWER_UI_SMOKE="$detail" ;;
      scan-governance-timeline-ui-smoke) seen_scan_governance_timeline_ui_smoke=$((seen_scan_governance_timeline_ui_smoke + 1)); STATUS_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE="$status"; STATUS_DETAIL_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE="$detail" ;;
      agent-chat-audit-ui-smoke) seen_agent_chat_audit_ui_smoke=$((seen_agent_chat_audit_ui_smoke + 1)); STATUS_AGENT_CHAT_AUDIT_UI_SMOKE="$status"; STATUS_DETAIL_AGENT_CHAT_AUDIT_UI_SMOKE="$detail" ;;
      agent-chat-closure-rail-ui-smoke) seen_agent_chat_closure_rail_ui_smoke=$((seen_agent_chat_closure_rail_ui_smoke + 1)); STATUS_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE="$status"; STATUS_DETAIL_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE="$detail" ;;
      agent-chat-tool-audit-smoke) seen_agent_chat_tool_audit_smoke=$((seen_agent_chat_tool_audit_smoke + 1)); STATUS_AGENT_CHAT_TOOL_AUDIT_SMOKE="$status"; STATUS_DETAIL_AGENT_CHAT_TOOL_AUDIT_SMOKE="$detail" ;;
      audit-workbench-smoke) seen_audit_workbench_smoke=$((seen_audit_workbench_smoke + 1)); STATUS_AUDIT_WORKBENCH_SMOKE="$status"; STATUS_DETAIL_AUDIT_WORKBENCH_SMOKE="$detail" ;;
      phase12-baseline) seen_phase12_baseline=$((seen_phase12_baseline + 1)); STATUS_PHASE12_BASELINE="$status"; STATUS_DETAIL_PHASE12_BASELINE="$detail" ;;
      sandbox-drill) seen_sandbox_drill=$((seen_sandbox_drill + 1)); STATUS_SANDBOX_DRILL="$status"; STATUS_DETAIL_SANDBOX_DRILL="$detail" ;;
      github-app-drill) seen_github_app_drill=$((seen_github_app_drill + 1)); STATUS_GITHUB_APP_DRILL="$status"; STATUS_DETAIL_GITHUB_APP_DRILL="$detail" ;;
      github-webhook-drill) seen_github_webhook_drill=$((seen_github_webhook_drill + 1)); STATUS_GITHUB_WEBHOOK_DRILL="$status"; STATUS_DETAIL_GITHUB_WEBHOOK_DRILL="$detail" ;;
      llm-provider-run) seen_llm_provider_run=$((seen_llm_provider_run + 1)); STATUS_LLM_PROVIDER_RUN="$status"; STATUS_DETAIL_LLM_PROVIDER_RUN="$detail" ;;
      *) fail "release evidence status table contains unknown step slug: $slug" ;;
    esac
  done < <(tail -n +2 "$status_file")

  if (( row_count == 0 )); then
    fail "release evidence status table must contain at least one step row"
  fi
  require_seen_once git-metadata "$seen_git_metadata"
  require_seen_once worktree-inventory "$seen_worktree_inventory"
  require_seen_once make-verify "$seen_make_verify"
  require_seen_once prod-preflight "$seen_prod_preflight"
  require_seen_once backup-preflight "$seen_backup_preflight"
  require_seen_once rollback-preflight "$seen_rollback_preflight"
  require_seen_once backup-restore-drill-evidence "$seen_backup_restore_drill_evidence"
  require_seen_once rollback-plan "$seen_rollback_plan"
  require_seen_once smoke "$seen_smoke"
  require_seen_once public-repo-smoke "$seen_public_repo_smoke"
  require_seen_once file-bound-repair-smoke "$seen_file_bound_repair_smoke"
  require_seen_once autorepair-patch-smoke "$seen_autorepair_patch_smoke"
  require_seen_once patch-ready-ui-smoke "$seen_patch_ready_ui_smoke"
  require_seen_once dashboard-next-action-ui-smoke "$seen_dashboard_next_action_ui_smoke"
  require_seen_once report-evidence-drawer-ui-smoke "$seen_report_evidence_drawer_ui_smoke"
  require_seen_once scan-governance-timeline-ui-smoke "$seen_scan_governance_timeline_ui_smoke"
  require_seen_once agent-chat-audit-ui-smoke "$seen_agent_chat_audit_ui_smoke"
  if [[ "${MANIFEST_RELEASE_EVIDENCE_PROFILE_SCHEMA:-1}" == "3" ]]; then
    require_seen_once agent-chat-closure-rail-ui-smoke "$seen_agent_chat_closure_rail_ui_smoke"
  elif (( seen_agent_chat_closure_rail_ui_smoke > 1 )); then
    fail "release evidence status table must contain agent-chat-closure-rail-ui-smoke at most once for schema 1/2 packages"
  fi
  require_seen_once agent-chat-tool-audit-smoke "$seen_agent_chat_tool_audit_smoke"
  require_seen_once audit-workbench-smoke "$seen_audit_workbench_smoke"
  require_seen_once phase12-baseline "$seen_phase12_baseline"
  require_seen_once sandbox-drill "$seen_sandbox_drill"
  require_seen_once github-app-drill "$seen_github_app_drill"
  require_seen_once github-webhook-drill "$seen_github_webhook_drill"
  require_seen_once llm-provider-run "$seen_llm_provider_run"
}

normalize_manifest() {
  local manifest="$1"
  awk '
    NF == 0 {
      next
    }
    {
      hash = tolower($1)
      if (hash !~ /^[0-9a-f]{64}$/) {
        print "invalid checksum hash on line " NR > "/dev/stderr"
        bad = 1
        next
      }
      path = $0
      sub(/^[^[:space:]]+[[:space:]]+\*?/, "", path)
      if (path == "") {
        print "empty checksum path on line " NR > "/dev/stderr"
        bad = 1
        next
      }
      if (path == "checksums.sha256") {
        print "checksum manifest must not include itself on line " NR > "/dev/stderr"
        bad = 1
        next
      }
      if (path ~ /^\// || path ~ /(^|\/)\.\.(\/|$)/ || path ~ /(^|\/)\.(\/|$)/ || path ~ /\/\// || path ~ /\\/ || path ~ /[\001-\037\177]/) {
        print "unsafe checksum path on line " NR ": " path > "/dev/stderr"
        bad = 1
        next
      }
      if (seen[path]++) {
        print "duplicate checksum path on line " NR ": " path > "/dev/stderr"
        bad = 1
        next
      }
      print hash "  " path
    }
    END {
      exit(bad ? 1 : 0)
    }
  ' "$manifest"
}

write_expected_manifest() {
  (
    cd "$RUN_DIR"
    find . -type f ! -name 'checksums.sha256' -print \
      | LC_ALL=C sort \
      | while IFS= read -r file; do
          file="${file#./}"
          printf '%s  %s\n' "$(hash_file "$file")" "$file"
        done
  )
}

validate_package_file_modes() {
  local expected_path
  local path
  local relative_path
  while IFS= read -r -d '' path; do
    relative_path="${path#"$RUN_DIR"/}"
    validate_package_file_path "$relative_path"
    require_private_file_600 "$path" "release evidence file $relative_path"
    if ! grep -Fxq -- "$relative_path" "$EXPECTED_PACKAGE_FILES"; then
      fail "release evidence package contains unexpected file: $relative_path"
    fi
  done < <(find "$RUN_DIR" -type f -print0)
  while IFS= read -r expected_path; do
    [[ -n "$expected_path" ]] || continue
    require_private_file_600 "${RUN_DIR}/${expected_path}" "expected release evidence file $expected_path"
  done < <(LC_ALL=C sort -u "$EXPECTED_PACKAGE_FILES")
}

validate_package_directory_modes() {
  local path
  local relative_path
  while IFS= read -r -d '' path; do
    relative_path="${path#"$RUN_DIR"/}"
    validate_package_file_path "$relative_path"
    if ! grep -Fxq -- "$relative_path" "$EXPECTED_PACKAGE_DIRS"; then
      fail "release evidence package contains unexpected directory: $relative_path"
    fi
    require_private_directory "$path" "release evidence directory $relative_path"
  done < <(find "$RUN_DIR" -mindepth 1 -type d -print0)
}

verify_manifest() {
  local actual_file="$TMP_DIR/actual.tsv"
  local expected_file="$TMP_DIR/expected.tsv"
  if ! normalize_manifest "$MANIFEST_FILE" | LC_ALL=C sort > "$actual_file"; then
    fail "checksums.sha256 contains invalid entries"
  fi
  write_expected_manifest | LC_ALL=C sort > "$expected_file"
  if ! cmp -s "$expected_file" "$actual_file"; then
    if command -v diff >/dev/null 2>&1; then
      diff -u "$expected_file" "$actual_file" >&2 || true
    fi
    fail "checksums.sha256 does not match current release evidence files"
  fi
}

if [[ -z "$EVIDENCE_DIR_INPUT" ]]; then
  fail "usage: scripts/verify-release-evidence.sh <release-evidence/run-id> or set SOURCELENS_RELEASE_EVIDENCE_VERIFY_DIR"
fi

require_cmd awk
require_cmd cmp
require_cmd date
require_cmd find
require_cmd grep
require_cmd node
require_cmd tail
require_any_cmd "release evidence checksum verification" sha256sum shasum

RUN_DIR="$(resolve_path "$EVIDENCE_DIR_INPUT")"
MANIFEST_FILE="${RUN_DIR}/checksums.sha256"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/sourcelens-release-evidence-verify.XXXXXX")"
chmod 700 "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT
STATUS_SUMMARY_EXPECTED_FILE="${TMP_DIR}/summary-steps.expected-from-status"
EXPECTED_PACKAGE_FILES="${TMP_DIR}/expected-package-files"
EXPECTED_PACKAGE_DIRS="${TMP_DIR}/expected-package-dirs"

require_private_directory "$RUN_DIR" "release evidence directory"

if find "$RUN_DIR" -type l -print -quit | grep -q .; then
  fail "release evidence directory must not contain symlinks"
fi

require_private_file_600 "$MANIFEST_FILE" "release evidence checksum manifest"
validate_required_package_structure
validate_package_directory_modes
validate_package_file_modes
verify_manifest

echo "Release evidence checksum verification passed: $RUN_DIR"
