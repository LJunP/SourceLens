# SourceLens AIOS Founder Briefing

## Current decision

SourceLens AIOS v2.3 is frozen. The project is in `P0 Strategic Foundation`, not feature development.

The only current objective is to turn the inherited SourceLens worktree into a truthful, reviewable and measurable baseline before P1 begins.

## What the project is

SourceLens AIOS is a trustworthy autonomous-agent infrastructure research platform using software engineering as its first validation environment.

The only year-one product is:

> Given an immutable repository revision and a bounded issue, produce the smallest defensible patch, verify it independently in isolation, and present a traceable and reversible Patch Evidence Package for human approval.

Repository Intelligence is the primary product moat. Evaluation and failure data are the scientific asset. Trust and evidence custody make execution usable.

## What is true now

- The inherited repository contains substantial analyzer, Java AST/graph, retrieval, Agent, execution, audit, sandbox, UI and release-gate assets.
- The existing worktree is very large and dirty; it is not one reviewable baseline.
- The latest local release package passed its declared local gate with five skips, but it does not prove exact-source reproducibility or production readiness.
- The existing 22-case retrieval corpus is regression evidence, not a benchmark.
- The current Agent and AutoRepair paths do not yet prove the full issue-to-independent-verification loop.
- No SourceLens capability is currently `PRODUCTION_PROVEN`.

The exact current facts and evidence pointers are in `docs/aios/truth/project_state.yaml`.

## Team model

```text
Human Founder
  -> Master CEO Agent
       -> CTO Agent
       -> Chief AI Research Agent
       -> Product Intelligence Agent
       -> Engineering Manager Agent
       -> Quality & Evaluation Agent
       -> Security Agent
            -> temporary specialist workers
```

Roles are durable; physical Agent instances are temporary. One instance has one role, one task context and one bounded write scope. The implementer cannot independently verify its own result.

The Master coordinates and integrates; it does not routinely write all code or approve itself.

## Founder responsibilities

You decide only:

- mission, primary ICP or year-one outcome changes;
- phase gates;
- irreversible deletion;
- production/public/autonomous permissions;
- major cost, legal, privacy or commercial commitments;
- acceptance of critical residual risk.

Routine implementation, test failures, task decomposition and specialist selection belong to the Agent organization.

## Current P0 gate

P0 is complete only when:

1. canonical truth and authority order are stable;
2. every inherited asset has a reviewed migration disposition;
3. TaskSpec, Baseline Suite and Evaluation Protocol are frozen;
4. the dirty worktree is divided into reviewable checkpoints without losing user work;
5. high-severity trust blockers are identified and assigned;
6. independent migration review is complete;
7. the Founder accepts the P0 gate packet and first P1 task.

Until then, do not start new features, broad refactors, multi-Agent construction or production claims.

## Founder red lines

- A document label is not evidence.
- A focused smoke test is not a full capability claim.
- A local release gate is not production proof.
- A generated patch is not a verified task success.
- More Agents do not imply better performance.
- Transcript replay is not a measured memory system.
- Old P6/P9/P10/P11 plans cannot override v2.3.
- No deletion occurs in P0; use `CANDIDATE_ARCHIVE` until dependency, regression and Founder review are complete.

## What to read

1. `docs/aios/truth/project_state.yaml`
2. `docs/aios/STRATEGIC_CONSTITUTION.md`
3. `docs/aios/MASTER_EXECUTION_PROTOCOL.md`
4. `docs/aios/EVALUATION_PROTOCOL.md`
5. `docs/aios/MIGRATION_LEDGER.yaml`
6. `ROADMAP.md`

Legacy status boards, progress logs and handoffs are historical evidence only.

## Standard Founder instruction

```text
Read docs/aios/truth/project_state.yaml and obey the SourceLens AIOS v2.3 authority order.
Continue the current phase only.
Challenge why each task is needed now, use the smallest falsifiable step, dispatch one-role workers with disjoint ownership, require independent verification, update canonical truth only from evidence, and stop at the next Founder-reserved decision.
Do not add features, change strategy, delete assets or claim production readiness unless the current gate explicitly permits it.
```

## Next Founder decision

No new strategic decision is required now. The P0 gate packet is `NOT_READY`. The next Founder decision occurs only after P0-05 produces a reviewable source baseline, independent review is refreshed, and the packet identifies the exact first bounded P1 evaluation-infrastructure task and budget.
