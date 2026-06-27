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
  manifest_root_dir="$(manifest_metadata_value "$manifest_file" root_dir)"
  manifest_env_file="$(manifest_metadata_value "$manifest_file" env_file)"
  manifest_llm_provider_run_file="$(manifest_metadata_optional_value "$manifest_file" llm_provider_run_file)"
  manifest_llm_raw_output_dir="$(manifest_metadata_optional_value "$manifest_file" llm_raw_output_dir)"
  manifest_git_head="$(manifest_metadata_value "$manifest_file" git_head)"

  require_safe_run_id "$summary_run_id" "release evidence summary run_id"
  require_safe_run_id "$manifest_run_id" "release evidence manifest run_id"
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
  local manifest_root_dir
  local manifest_env_file
  local include_verify
  local include_preflight
  local include_smoke
  local include_phase12
  local include_sandbox_drill
  local include_github_app_drill
  local include_github_webhook_drill
  local include_llm_provider_run
  local worktree_inventory_strict
  local manifest_llm_provider_run_file
  local manifest_llm_raw_output_dir
  local manifest_git_head

  manifest_run_id="$(manifest_metadata_value "$manifest_file" run_id)"
  manifest_created_at="$(manifest_metadata_value "$manifest_file" created_at)"
  manifest_root_dir="$(manifest_metadata_value "$manifest_file" root_dir)"
  manifest_env_file="$(manifest_metadata_value "$manifest_file" env_file)"
  include_verify="$(manifest_metadata_value "$manifest_file" include_verify)"
  include_preflight="$(manifest_metadata_value "$manifest_file" include_preflight)"
  include_smoke="$(manifest_metadata_value "$manifest_file" include_smoke)"
  include_phase12="$(manifest_metadata_value "$manifest_file" include_phase12)"
  include_sandbox_drill="$(manifest_metadata_value "$manifest_file" include_sandbox_drill)"
  include_github_app_drill="$(manifest_metadata_value "$manifest_file" include_github_app_drill)"
  include_github_webhook_drill="$(manifest_metadata_value "$manifest_file" include_github_webhook_drill)"
  include_llm_provider_run="$(manifest_metadata_value "$manifest_file" include_llm_provider_run)"
  worktree_inventory_strict="$(manifest_metadata_value "$manifest_file" worktree_inventory_strict)"
  manifest_llm_provider_run_file="$(manifest_metadata_optional_value "$manifest_file" llm_provider_run_file)"
  manifest_llm_raw_output_dir="$(manifest_metadata_optional_value "$manifest_file" llm_raw_output_dir)"
  manifest_git_head="$(manifest_metadata_value "$manifest_file" git_head)"

  require_manifest_bool_mode "$include_verify" "release evidence manifest include_verify"
  require_manifest_bool_mode "$include_preflight" "release evidence manifest include_preflight"
  require_manifest_optional_mode "$include_smoke" "release evidence manifest include_smoke"
  require_manifest_optional_mode "$include_phase12" "release evidence manifest include_phase12"
  require_manifest_optional_mode "$include_sandbox_drill" "release evidence manifest include_sandbox_drill"
  require_manifest_optional_mode "$include_github_app_drill" "release evidence manifest include_github_app_drill"
  require_manifest_optional_mode "$include_github_webhook_drill" "release evidence manifest include_github_webhook_drill"
  require_manifest_optional_mode "$include_llm_provider_run" "release evidence manifest include_llm_provider_run"
  require_manifest_bool_mode "$worktree_inventory_strict" "release evidence manifest worktree_inventory_strict"

  MANIFEST_INCLUDE_VERIFY="$include_verify"
  MANIFEST_INCLUDE_PREFLIGHT="$include_preflight"
  MANIFEST_INCLUDE_SMOKE="$include_smoke"
  MANIFEST_INCLUDE_PHASE12="$include_phase12"
  MANIFEST_INCLUDE_SANDBOX_DRILL="$include_sandbox_drill"
  MANIFEST_INCLUDE_GITHUB_APP_DRILL="$include_github_app_drill"
  MANIFEST_INCLUDE_GITHUB_WEBHOOK_DRILL="$include_github_webhook_drill"
  MANIFEST_INCLUDE_LLM_PROVIDER_RUN="$include_llm_provider_run"
  MANIFEST_WORKTREE_INVENTORY_STRICT="$worktree_inventory_strict"

  {
    printf 'run_id: %s\n' "$manifest_run_id"
    printf 'created_at: %s\n' "$manifest_created_at"
    printf 'root_dir: %s\n' "$manifest_root_dir"
    printf 'env_file: %s\n' "$manifest_env_file"
    printf 'include_verify: %s\n' "$include_verify"
    printf 'include_preflight: %s\n' "$include_preflight"
    printf 'include_smoke: %s\n' "$include_smoke"
    printf 'include_phase12: %s\n' "$include_phase12"
    printf 'include_sandbox_drill: %s\n' "$include_sandbox_drill"
    printf 'include_github_app_drill: %s\n' "$include_github_app_drill"
    printf 'include_github_webhook_drill: %s\n' "$include_github_webhook_drill"
    printf 'include_llm_provider_run: %s\n' "$include_llm_provider_run"
    printf 'worktree_inventory_strict: %s\n' "$worktree_inventory_strict"
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
  if [[ "$STATUS_GIT_METADATA" != "OK" ]]; then
    fail "release evidence git-metadata status must be OK"
  fi

  validate_manifest_mode_status "$MANIFEST_INCLUDE_VERIFY" "include_verify" "make-verify" "$STATUS_MAKE_VERIFY" "$STATUS_DETAIL_MAKE_VERIFY" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_PREFLIGHT" "include_preflight" "prod-preflight" "$STATUS_PROD_PREFLIGHT" "$STATUS_DETAIL_PROD_PREFLIGHT" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_PREFLIGHT" "include_preflight" "backup-preflight" "$STATUS_BACKUP_PREFLIGHT" "$STATUS_DETAIL_BACKUP_PREFLIGHT" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_PREFLIGHT" "include_preflight" "rollback-preflight" "$STATUS_ROLLBACK_PREFLIGHT" "$STATUS_DETAIL_ROLLBACK_PREFLIGHT" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false"
  validate_manifest_mode_status "$MANIFEST_INCLUDE_SMOKE" "include_smoke" "smoke" "$STATUS_SMOKE" "$STATUS_DETAIL_SMOKE" "SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false"
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

validate_required_package_structure() {
  local summary_file="${RUN_DIR}/summary.md"
  local status_file="${RUN_DIR}/status.tsv"
  local git_manifest_file="${RUN_DIR}/manifest.txt"
  local git_status_file="${RUN_DIR}/git-status.txt"
  local git_diff_stat_file="${RUN_DIR}/git-diff-stat.txt"
  local worktree_inventory_file="${RUN_DIR}/worktree-inventory.md"
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
  validate_summary_steps "$summary_file"
  validate_summary_counts "$summary_file"
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
    validate_status_log_file_for_slug "$slug" "$log_file"
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
