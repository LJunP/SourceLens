# SourceLens Documentation Index

This index prevents legacy documents from being mistaken for current AIOS authority.

## Canonical AIOS control plane

Start at `aios/README.md`. Authority is domain-scoped: strategy, mutable facts, execution, evaluation, migration and rationale each have one owner.

| Document | Authority |
| --- | --- |
| `aios/truth/project_state.yaml` | current mutable facts, phase status, evidence and active work |
| `aios/STRATEGIC_CONSTITUTION.md` | mission, ICP, year-one outcome, non-goals and phase route |
| `aios/MASTER_EXECUTION_PROTOCOL.md` | roles, task lifecycle, Agent isolation and review |
| `aios/EVALUATION_PROTOCOL.md` | research harness, baselines, metrics and Patch Evidence |
| `aios/MIGRATION_LEDGER.yaml` | inherited-asset disposition |
| `aios/P0_GATE.md` | derived P0 exit packet; never overrides truth |
| `aios/P0_INDEPENDENT_REVIEW.md` | independent control-plane review and P0 NO-GO rationale |
| `aios/CODEX_MASTER_PROMPT.md` | Codex startup and dispatch prompts; not a fact authority |
| `aios/BASELINE_ADAPTER_CONTRACT.md` and `aios/schemas/` | P0 machine-contract drafts; review required |
| `AGENT_DECISION_REGISTER.md` | append-only decision rationale |

## Supporting engineering references

These remain useful within their technical scope. Old phase, role, current-status or authority statements inside them are not current.

| Area | Documents |
| --- | --- |
| architecture and code map | `ARCHITECTURE.md`, `PROJECT_CODE_MAP.md`, `API_DESIGN.md`, `DATABASE_DESIGN.md` |
| engineering and worktree | `ENGINEERING_STANDARDS.md`, `WORKTREE_HYGIENE.md`, `PROJECT_STRUCTURE_AUDIT.md` |
| security and trust | `SECURITY_BOUNDARY.md`, `THREAT_MODEL.md`, `LLM_SAFETY_EVALS.md`, `RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md` |
| data and dependencies | `DATA_GOVERNANCE.md`, `DEPENDENCY_AND_LICENSE_POLICY.md`, `COMPLIANCE_AND_PRIVACY.md` |
| tests and operations | `TEST_STRATEGY.md`, `OPERATIONS_RUNBOOK.md`, `OBSERVABILITY_AND_INCIDENTS.md`, `RELEASE_PROCESS.md`, `DISASTER_RECOVERY_AND_ROLLBACK_SIGNOFF.md` |
| inherited product implementation | `FRONTEND_DESIGN_SYSTEM.md`, `PERFORMANCE_BENCHMARK.md`, `DEMO_SCRIPT.md` |

Supporting documents constrain implementation only when consistent with the canonical control plane.

## Historical or frozen inputs

These preserve project history and migration evidence. They must not dispatch current work:

- `PROJECT_PLAN.md`
- `PHASE_REQUIREMENTS.md`
- `REFACTOR_ROADMAP.md`
- `PRODUCT_POSITIONING_AND_ACCESS_MODEL.md`
- `TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md`
- `PRODUCT_GOVERNANCE.md`
- `PRODUCT_METRICS_AND_FEEDBACK.md`
- `WORK_INTAKE_AND_BACKLOG.md`
- `QUALITY_SCORECARD.md`
- `AGENT_STATUS_BOARD.md`
- `CODEX_HANDOFF.md`
- `PRODUCT_PROGRESS_LOG.md`
- `AGENT_ACTIVITY_LOG.md`
- `DAILY_GROWTH_PLAN_2026.md`
- `DAILY_GROWTH_PLAN_2026_EXPANDED.md`
- `PHASE12_BASELINE.md`

`RISK_REGISTER.md` is a supporting legacy risk input. Open blockers are promoted to canonical truth and reassigned through the Master task protocol.

## Maintenance rule

Do not create another roadmap, status board, handoff authority, scorecard or role registry. Add a fact to canonical truth, a rationale to an ADR, a reproducible result to a Research Artifact, or a bounded update to the relevant technical reference.
