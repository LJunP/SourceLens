#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
  echo "AIOS GOVERNANCE FAIL: $*" >&2
  exit 1
}

command -v ruby >/dev/null 2>&1 || fail "ruby with the standard YAML library is required"

required_files=(
  docs/aios/README.md
  docs/aios/STRATEGIC_CONSTITUTION.md
  docs/aios/MASTER_EXECUTION_PROTOCOL.md
  docs/aios/EVALUATION_PROTOCOL.md
  docs/aios/MIGRATION_LEDGER.yaml
  docs/aios/truth/project_state.yaml
  docs/aios/P0_GATE.md
  docs/aios/CODEX_MASTER_PROMPT.md
  docs/aios/BASELINE_ADAPTER_CONTRACT.md
  docs/aios/tasks/P0-04A_TRUTH_CONTAINMENT.yaml
  docs/aios/tasks/P0-04B_SLICE_F_GATE_REPAIR.yaml
  docs/aios/tasks/P0-05_BASELINE_SLICING.yaml
  docs/aios/schemas/task-spec.schema.json
  docs/aios/schemas/environment-snapshot.schema.json
  docs/aios/schemas/system-configuration.schema.json
  docs/aios/schemas/run-record.schema.json
  docs/README.md
  README.md
  ROADMAP.md
  CHAIRMAN_BRIEFING.md
  CONTRIBUTING.md
)

for file in "${required_files[@]}"; do
  [[ -s "$file" ]] || fail "required file is missing or empty: $file"
done

ruby -ryaml -e '
  state = YAML.load_file("docs/aios/truth/project_state.yaml")
  ledger = YAML.load_file("docs/aios/MIGRATION_LEDGER.yaml")
  truth_task = YAML.load_file("docs/aios/tasks/P0-04A_TRUTH_CONTAINMENT.yaml")
  slice_f_task = YAML.load_file("docs/aios/tasks/P0-04B_SLICE_F_GATE_REPAIR.yaml")
  baseline_task = YAML.load_file("docs/aios/tasks/P0-05_BASELINE_SLICING.yaml")

  abort "project current_phase must be P0 during this migration" unless state.dig("project", "current_phase") == "P0"
  abort "project phase_status must remain IN_PROGRESS" unless state.dig("project", "phase_status") == "IN_PROGRESS"
  abort "strategy version must be 2.3" unless state.dig("authority", "strategy", "version") == "2.3"
  abort "execution protocol version must be 1.0" unless state.dig("authority", "execution_protocol", "version") == "1.0"
  abort "P0 gate recommendation must remain NO_GO" unless state.dig("p0_control_plane", "independent_review", "p0_gate_recommendation") == "NO_GO"
  abort "legacy context filter must not be overstated as technical enforcement" unless state.dig("runtime_restrictions", "legacy_context_retrieval_filter") == "NOT_IMPLEMENTED_GOVERNANCE_ALLOWLIST_ONLY"

  expected_tasks = {
    "AIOS-P0-004A" => [truth_task, "accepted"],
    "AIOS-P0-004B" => [slice_f_task, "accepted"],
    "AIOS-P0-005" => [baseline_task, "ready"]
  }
  expected_tasks.each do |task_id, (task, expected_status)|
    abort "task id drifted: #{task_id}" unless task["task_id"] == task_id
    abort "task phase must remain P0: #{task_id}" unless task["phase"] == "P0"
    abort "task status drifted: #{task_id}" unless task["status"] == expected_status
    %w[write_scope acceptance_criteria required_evidence stop_conditions forbidden_actions].each do |field|
      value = task[field]
      abort "task field must be a nonempty list: #{task_id}.#{field}" unless value.is_a?(Array) && !value.empty?
    end
  end
  p0_05 = state.fetch("active_p0_work").find { |item| item["id"] == "P0-05" }
  abort "P0-05 is missing from active_p0_work" unless p0_05
  expected_contract = "docs/aios/tasks/P0-05_BASELINE_SLICING.yaml"
  abort "P0-05 task contract reference drifted" unless p0_05["task_contract_ref"] == expected_contract
  abort "P0-05 must remain unstarted" unless p0_05["status"] == "CONTRACT_READY_PARTITION_NOT_STARTED"
  abort "P0-05 starting snapshot semantics are overstated" unless baseline_task["baseline_semantics"] == "CAPTURED_PRE_INDEPENDENT_REVIEW_STARTING_STATE_NOT_EXACT_CURRENT_WORKTREE"
  expected_binding = "/Users/lijunpeng/Desktop/cc/project/.sourcelens-audit/p0-truth-contained-final/truth-binding.json"
  abort "P0-05 final exact-state attestation drifted" unless baseline_task["final_exact_state_attestation_ref"] == expected_binding

  expected_completed = {
    "P0-04A" => "COMPLETE_INDEPENDENT_REVIEW_PASS",
    "P0-04B" => "COMPLETE_INDEPENDENT_REVIEW_PASS"
  }
  expected_completed.each do |task_id, expected_status|
    item = state.fetch("active_p0_work").find { |candidate| candidate["id"] == task_id }
    abort "active P0 task is missing: #{task_id}" unless item
    abort "active P0 task review status drifted: #{task_id}" unless item["status"] == expected_status
  end

  preservation = state.fetch("current_worktree_preservation")
  abort "final worktree truth binding path drifted" unless preservation["truth_binding"] == expected_binding
  abort "current-state exactness must resolve externally" unless preservation["current_state_exact"] == "RESOLVE_FROM_EXTERNAL_ATTESTATION"

  [truth_task, slice_f_task].each do |task|
    inventory = task.fetch("changed_path_inventory")
    paths = inventory.values.flatten
    abort "changed-path inventory must be nonempty: #{task.fetch("task_id")}" if paths.empty?
    missing = paths.reject { |path| File.exist?(path) }
    abort "changed-path inventory references missing paths: #{missing.inspect}" unless missing.empty?
    abort "changed-path inventory contains duplicates: #{task.fetch("task_id")}" unless paths.uniq.length == paths.length
  end

  assets = ledger.fetch("assets")
  ids = assets.map { |asset| asset.fetch("id") }
  abort "migration asset ids must be unique" unless ids.uniq.length == ids.length

  allowed = %w[KEEP REFACTOR QUARANTINE FREEZE BUILD_NEW CANDIDATE_ARCHIVE]
  invalid = assets.reject { |asset| allowed.include?(asset.fetch("decision")) }
  abort "invalid migration decision: #{invalid.inspect}" unless invalid.empty?

  %w[STRATEGY_LEGACY HISTORICAL_LEDGERS DUPLICATE_STATUS_DOCS].each do |id|
    asset = assets.find { |candidate| candidate.fetch("id") == id }
    abort "missing legacy migration asset: #{id}" unless asset
    abort "legacy asset must be excluded from default Agent context: #{id}" unless asset["default_agent_context"] == "EXCLUDED"
  end

  if assets.any? { |asset| asset.fetch("decision") == "CANDIDATE_REMOVE" }
    abort "P0 must not classify an asset as CANDIDATE_REMOVE"
  end

  owned_paths = assets
    .select { |asset| asset.fetch("scope_kind") == "paths" }
    .flat_map { |asset| asset.fetch("scope").map { |path| [path, asset.fetch("id")] } }
  duplicates = owned_paths.group_by(&:first).select { |_path, owners| owners.length > 1 }
  abort "path ownership overlaps: #{duplicates.inspect}" unless duplicates.empty?
'

if grep -Fq 'preserved current-combined-state' docs/aios/tasks/P0-05_BASELINE_SLICING.yaml; then
  fail "P0-05 still overstates the pre-independent-review snapshot as current"
fi

grep -Fq 'exact post-remediation state is resolved only from the external attestation' docs/aios/P0_GATE.md \
  || fail "P0 Gate no longer declares its in-tree snapshot evidence boundary"

ruby -rjson -e '
  JSON.parse(File.read("docs/aios/schemas/task-spec.schema.json"))
  JSON.parse(File.read("docs/aios/schemas/environment-snapshot.schema.json"))
  JSON.parse(File.read("docs/aios/schemas/system-configuration.schema.json"))
  JSON.parse(File.read("docs/aios/schemas/run-record.schema.json"))
'

active_entries=(
  README.md
  ROADMAP.md
  CHAIRMAN_BRIEFING.md
  CONTRIBUTING.md
  docs/README.md
  docs/SOURCELENS_OPERATING_SYSTEM.md
  docs/TEAM_OPERATING_MODEL.md
  web-console/src/pages/Dashboard.tsx
)

legacy_current_pattern='Current phase.*P9|当前主线仍是 P6|SourceLens 采用 `11 个固定核心角色|release-current-schema-20260704-1618.*当前|P9 三平面|P6/P10/P11 按证据并行推进|Trusted Engineering Loop Completion Rate|completed P0 gate packet'
if grep -En "$legacy_current_pattern" "${active_entries[@]}"; then
  fail "an active entry still declares a legacy phase, team or release authority"
fi

legacy_files=(
  docs/PROJECT_PLAN.md
  docs/PHASE_REQUIREMENTS.md
  docs/PRODUCT_POSITIONING_AND_ACCESS_MODEL.md
  docs/TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md
  docs/AGENT_STATUS_BOARD.md
  docs/CODEX_HANDOFF.md
  docs/WORK_INTAKE_AND_BACKLOG.md
  docs/QUALITY_SCORECARD.md
  docs/PRODUCT_PROGRESS_LOG.md
  docs/REFACTOR_ROADMAP.md
  docs/PRODUCT_METRICS_AND_FEEDBACK.md
  docs/AGENT_ACTIVITY_LOG.md
  docs/AGENT_DECISION_REGISTER.md
)

for file in "${legacy_files[@]}"; do
  head -n 8 "$file" | grep -Eq 'AIOS v2\.3 状态' \
    || fail "legacy document is missing its AIOS status banner: $file"
  head -n 8 "$file" | grep -Fq 'DEFAULT AGENT CONTEXT: `EXCLUDED`' \
    || fail "legacy document is not excluded from default Agent context: $file"
done

grep -Fq 'P0 Strategic Foundation' web-console/src/pages/Dashboard.tsx \
  || fail "Dashboard does not expose the current P0 phase"
grep -Fq 'Verified Task Success Rate' web-console/src/pages/Dashboard.tsx \
  || fail "Dashboard does not expose the frozen north-star metric"
grep -Fq 'P0-05 Baseline Slicing' web-console/src/pages/Dashboard.tsx \
  || fail "Dashboard does not expose P0-05 as the current project task"
grep -Fq '继承产品运行建议（非项目任务）' web-console/src/pages/Dashboard.tsx \
  || fail "Dashboard does not separate inherited product operations from AIOS project work"
grep -Fq 'P0 gate packet is `NOT_READY`' CHAIRMAN_BRIEFING.md \
  || fail "Founder briefing does not expose the current P0 gate state"
grep -Fq -- '- Status: `NOT_READY`' docs/aios/P0_GATE.md \
  || fail "P0 gate artifact must remain NOT_READY"
grep -Fq 'Do not load, index or summarize legacy documents into default planning context.' docs/aios/CODEX_MASTER_PROMPT.md \
  || fail "Codex entry prompt is missing the legacy-context allowlist rule"
grep -Fq 'Flyway (V001 ~ V032)' docs/DATABASE_DESIGN.md \
  || fail "database migration range is stale"
grep -Fq 'https://github.com/LJunP/SourceLens/security/policy' .github/ISSUE_TEMPLATE/config.yml \
  || fail "security-policy link does not target SourceLens"
grep -Fq '<description>SourceLens AIOS' backend-spring/pom.xml \
  || fail "backend metadata still uses the legacy product description"

grep -Fq 'B0 Direct Model' docs/aios/EVALUATION_PROTOCOL.md \
  || fail "Baseline Suite B0 is missing"
grep -Fq 'B2 Current SourceLens' docs/aios/EVALUATION_PROTOCOL.md \
  || fail "Baseline Suite B2 is missing"
grep -Fq 'Verified Task Success Rate' docs/aios/STRATEGIC_CONSTITUTION.md \
  || fail "the north-star metric is missing"
grep -Fq 'Patch Evidence Package' docs/aios/EVALUATION_PROTOCOL.md \
  || fail "the Patch Evidence contract is missing"

echo "AIOS_GOVERNANCE_OK"
