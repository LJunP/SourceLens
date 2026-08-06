# SourceLens AIOS Authority Index

This directory is the canonical control plane for the SourceLens AIOS migration.

## Domain authority

| Domain | Authority |
| --- | --- |
| mission, ICP, year-one outcome, non-goals and phase route | `STRATEGIC_CONSTITUTION.md` |
| current mutable facts, current phase status, evidence pointers and active blockers | `truth/project_state.yaml` |
| roles, authority, task lifecycle, memory and review | `MASTER_EXECUTION_PROTOCOL.md` |
| TaskSpec, baselines, datasets, metrics and research artifacts | `EVALUATION_PROTOCOL.md` |
| inherited-asset disposition | `MIGRATION_LEDGER.yaml` |
| accepted decision rationale | append-only ADRs |
| bounded P0 task contracts | `tasks/P0-04A_TRUTH_CONTAINMENT.yaml`, `tasks/P0-04B_SLICE_F_GATE_REPAIR.yaml`, `tasks/P0-05_BASELINE_SLICING.yaml` |

There is no global "earlier file wins" rule. Each document is authoritative only in its domain. The Truth Registry may mirror strategic values for machines but cannot change them. Historical status boards, progress logs, handoffs and pre-v2.3 roadmaps override none of these domains.

Legacy material is excluded from default Agent context. It may be opened only when an active Task Contract cites the exact file as evidence input; an isolated retrieved fragment from a legacy file can never establish current truth, priority or authority.

## Current state

SourceLens is in `P0 Strategic Foundation`. Existing product development is frozen except for urgent security or data-integrity containment. The current objective is to establish a reproducible baseline and a reviewable migration checkpoint before P1 development.

The external P0-A audit is stored outside the Git worktree at:

`/Users/lijunpeng/Desktop/cc/project/.sourcelens-audit/p0-a-20260710-220800/`

## Evidence terms

- `DEFINED`: described in documentation or schema only.
- `IMPLEMENTED`: executable code exists.
- `TESTED`: relevant automated tests have passed against a known state.
- `GATE_PASSED`: a declared gate passed and its evidence is retained.
- `PRODUCTION_PROVEN`: repeated production evidence exists.

No lower level implies a higher level.

## Gate artifact

`P0_GATE.md` collects the P0 exit checklist and dirty-worktree recovery plan. It is derived from canonical truth and never overrides it.

`P0_INDEPENDENT_REVIEW.md` records the read-only CTO, Quality & Evaluation and Security review cycle. Its final control-plane PASS does not change the P0 `NO-GO` gate.

## Codex operator entry

`CODEX_MASTER_PROMPT.md` contains the startup, specialist dispatch, independent review and Founder decision prompts. It references the canonical files and does not store current facts.

## P0 contract drafts

The TaskSpec, EnvironmentSnapshot, SystemConfiguration, RunRecord schemas and `BASELINE_ADAPTER_CONTRACT.md` are P0 review drafts. Their existence does not make the P1 research harness implemented or accepted.
