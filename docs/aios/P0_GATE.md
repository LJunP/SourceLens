# SourceLens AIOS P0 Gate Packet

- Gate: `P0 -> P1`
- Status: `NOT_READY`
- Snapshot basis: P0-A audit plus a verified pre-independent-review preservation snapshot from 2026-07-10; exact post-remediation state is resolved only from the external attestation referenced below
- Current facts: `truth/project_state.yaml`

This is a gate artifact, not a second current-state authority. When facts differ, the Truth Registry wins.

## 1. Completed foundation

- Read-only takeover audit retained outside the Git worktree.
- Strategic Constitution v2.3 frozen.
- Master Execution Protocol v1.0 frozen.
- Evaluation and Research Protocol v1.1 defined for P0.
- Baseline Suite B0/B1/B2/A0 defined.
- TaskSpec, EnvironmentSnapshot and Baseline Adapter contract drafts created; independent acceptance remains open.
- Machine-readable Truth Registry established.
- Inherited assets classified without deletion.
- Legacy roadmaps, roles and status authorities downgraded to historical/supporting material.
- Independent CTO, Quality & Evaluation and Security control-plane review passed after remediation; all reviewers still recommend P0 NO-GO.
- A pre-independent-review combined source state is preserved outside the worktree and verified by artifact hashes, untracked-copy hashes and disposable-clone tracked-patch restoration. It is not the exact current post-remediation state.
- Inherited `make verify` evidence captured the original AgentChat responsive UI failure. The worktree observed at `2026-07-10T23:46:39+08:00` then passed all declared local stages, and independent review accepted the bounded Slice F repair. Exact final-state verification is resolved from the external attestation named below rather than inferred from this recorded run.
- Bounded remediation authority is recorded in `tasks/P0-04A_TRUTH_CONTAINMENT.yaml` and `tasks/P0-04B_SLICE_F_GATE_REPAIR.yaml`; neither task changes the P0 `NOT_READY` decision.

## 2. Gate blockers

P1 remains blocked by:

1. independent review of migration dispositions and current capability levels;
2. a reviewable source baseline from the inherited dirty worktree;
3. accepted ownership and remediation order for source identity, symlink boundaries, checkpoint semantics, command-result semantics, raw-artifact custody, LLM egress, real sandbox isolation, independent patch verification and remote-side-effect rollback;
4. an accepted TaskSpec and environment-snapshot schema contract;
5. accepted B0/B1/B2 adapter contracts and a preserved B2 source snapshot; executable adapters are a P1 deliverable;
6. a Founder-approved first P1 task and budget.

## 3. Dirty-worktree recovery plan

No current modification is reverted, stashed, cleaned, reformatted or deleted merely to obtain a clean status.

### Step 1: Preserve the pre-independent-review combined state (`COMPLETE`)

- Record HEAD, branch, upstream relation and Git status with all untracked files.
- Retain binary-safe tracked diff and untracked path/hash inventory outside the worktree.
- Retain an external byte-for-byte copy of all non-ignored untracked files and symlinks.
- Record local runtime and release-evidence dependencies without copying secrets.
- Verify the preservation manifest before any partition operation.
- Record that P0 control-plane edits began before this preservation snapshot, so it is not an exact pre-AIOS inherited-state archive.

Exit evidence: `/Users/lijunpeng/Desktop/cc/project/.sourcelens-audit/p0-b-preservation-20260710T154704Z`. A disposable checkout reconstructs and hash-verifies the captured pre-independent-review combined source state. It does not represent the exact current post-remediation worktree. The unavailable exact pre-AIOS dirty state remains a declared historical gap.

Exact post-remediation evidence is resolved from `/Users/lijunpeng/Desktop/cc/project/.sourcelens-audit/p0-truth-contained-final/truth-binding.json`. The resulting snapshot manifest hash and verification time are intentionally stored only in that external attestation, avoiding a self-referential in-worktree hash claim.

### Step 2: Create review slices

Execution contract: `tasks/P0-05_BASELINE_SLICING.yaml` (`READY`; partition not started).

Review in this order:

| Slice | Scope | AIOS disposition | Required review |
| --- | --- | --- | --- |
| A | AIOS strategy, truth, governance and migration files | new P0 baseline | Product, CTO, Quality & Evaluation |
| B | security/auth, sandbox, filesystem boundaries and tool semantics | REFACTOR | CTO, Security, Quality & Evaluation |
| C | Rust analyzer, Java AST/graph, code chunks and retrieval | REFACTOR, preserve useful behavior | CTO, AI Research, Quality & Evaluation |
| D | execution, artifacts, audit, Agent loop and AutoRepair | REFACTOR | CTO, Security, AI Research, Quality & Evaluation |
| E | operations, CI, release evidence and database migrations | REFACTOR, preserve useful evidence | Engineering, Security, Quality & Evaluation |
| F | frontend console and historical P9 UI work, including the independently accepted bounded AgentChat responsive repair | FREEZE except evidence-loop prerequisites and the accepted gate repair | Product, Engineering, Quality & Evaluation |
| G | GitHub, enterprise, SaaS and organization-runtime work | FREEZE | Product, Security, Founder if reactivated |

Files spanning slices must be assigned to one slice and one owner before review. Do not duplicate or cherry-pick partial hunks until dependencies are understood.

### Step 3: Verify each slice

For each slice:

1. explain user/research value and migration disposition;
2. identify exact files, schema changes and dependencies;
3. run targeted tests against that slice;
4. record known failures and evidence limits;
5. obtain independent verdict;
6. create a reversible checkpoint only after review;
7. update Truth Registry evidence pointers before the final exact-state snapshot is captured.

A slice may be accepted, quarantined, frozen or returned for repair. It is never accepted because the aggregate old release package is green.

### Step 4: Establish P1 source baseline

The P1 baseline must identify:

- exact accepted commit/tree and submodule state;
- all accepted database migrations and lockfiles;
- reproducible build/test commands;
- environment and tool versions;
- known skipped tests and unresolved risks;
- rollback point to one named, hash-verified exact accepted-state snapshot captured only after all in-tree P0 remediation and review updates stop.

## 4. P1 first-task constraint

The first P1 implementation task is not a new Agent feature. It implements the P0-approved contracts as the smallest end-to-end research-harness slice that can:

1. load one immutable TaskSpec;
2. materialize one reproducible environment snapshot;
3. run B0 and one current-system adapter;
4. retain observable trace, cost and result;
5. invoke an independent deterministic evaluator;
6. reproduce the run from a documented command.

The task must not add memory, multi-Agent coordination, broad UI, enterprise integration or autonomous repository writes.

Until the Security blockers are closed with adversarial evidence, the project-level policy blocks model-initiated file writes, Agent shell execution, AutoRepair remote PR submission and real-provider source/code egress. The inherited implementation does not yet enforce every block technically; do not treat this policy as a completed security control.

## 5. Founder gate questions

The Founder approves P1 only after receiving direct answers to:

1. What exact source state will P1 build on?
2. Which inherited assets are accepted, quarantined and frozen?
3. What does B0/B1/B2 measure, and how is hidden evaluation protected?
4. Which high-severity trust issues block write execution?
5. What is the first falsifiable P1 hypothesis, budget and stop condition?
6. How can the project return to the preserved P0 state?

## 6. Gate decision record

```yaml
decision: PENDING
founder: Human Founder
approved_source_ref: null
approved_first_task: null
approved_budget: null
accepted_residual_risks: []
conditions: []
date: null
```
