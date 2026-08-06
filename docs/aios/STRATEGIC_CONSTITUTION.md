# SourceLens AIOS Strategic Constitution

- Version: `2.3`
- Status: `FROZEN`
- Effective date: 2026-07-10
- Owner: Human Founder

## 1. Positioning

SourceLens AIOS is a trustworthy autonomous-agent infrastructure research platform that uses software engineering as its first validation environment.

It studies and builds the capabilities required for an Agent to understand a complex environment, execute a real task, verify the result independently, retain evidence and improve under controlled experiments.

The long-term direction is an Agent Organization Operating System. That is a three-to-five-year destination, not the first product.

## 2. Year-one objective

Build and scientifically evaluate one trustworthy software-engineering Agent.

The only year-one product loop is:

```text
Repository revision + Issue
  -> Environment Understanding
  -> Planning
  -> Isolated Execution
  -> Testing
  -> Independent Verification
  -> Risk and Rollback Evidence
  -> Patch Evidence Package
  -> Human Approval
```

A generated patch is not a successful outcome. Success requires an independently verified, traceable and reversible patch package.

## 3. Year-one ICP and JTBD

Primary ICP:

A repository maintainer or responsible engineer handling bounded, reproducible maintenance issues in a buildable Java or Java/TypeScript repository, especially when the codebase is unfamiliar, inherited or costly to review manually.

JTBD:

When I receive a concrete issue in a repository I do not fully understand, locate the relevant code, propose the smallest defensible change, execute verification in isolation, and give me enough evidence and rollback information to approve or reject the patch safely.

## 4. Non-goals for year one

- A generic Agent framework or chatbot platform.
- An AI company simulator or organization runtime.
- Autonomous production merge or unsupervised remote writes.
- Multi-tenant SaaS, enterprise RBAC, SSO or billing.
- GitHub App, webhook and private-repository expansion as a mainline objective.
- Broad CI diagnosis, PR review, dashboard or admin-console expansion.
- Support for every programming language.
- Model pretraining, RLHF infrastructure or a new foundation model.
- Production-readiness claims without production evidence.

## 5. Core assets

### Core Asset 1: Repository Intelligence and Context Selection

Task-conditioned understanding of repository structure, symbols, relations, history and evidence. This is the primary product moat, not a generic runtime framework.

### Core Asset 2: Agent Evaluation and Failure Data

Versioned tasks, environment snapshots, traces, baseline runs, hidden evaluations, failure taxonomy and reproducible research artifacts.

### Core Asset 3: Trust and Patch Evidence Protocol

Immutable repository identity, tool permissions, isolated execution, independent verification, approval, audit, rollback and per-patch evidence custody.

## 6. Product architecture

```text
Organization Layer                 future research
Trust and Independent Verification year-one hardening
Evaluation and Research Foundation scientific control plane
Memory and Learning                only after measured baseline
Single-Agent Runtime               durable task execution
Environment Intelligence           repository understanding moat
Software Engineering Environment   first validation domain
```

Evaluation is not a late feature. Minimum trust is not a late feature. Both exist before autonomous write execution.

## 7. Patch Evidence Package contract

Every candidate package must eventually bind:

- task and issue identity;
- canonical repository identity, base commit and tree hash;
- environment and dependency snapshot;
- repository evidence and selected context;
- decision rationale, not hidden chain-of-thought;
- planned and actual actions;
- patch content and patch hash;
- tests before and after, commands, exit codes and logs;
- independent verifier identity and verdict;
- policy, risk and human-approval state;
- rollback point, inverse action or disposable-workspace receipt;
- checksums for all retained artifacts.

A Patch Evidence Package is task-specific correctness evidence. A Release Evidence Package is platform regression evidence. They are different artifacts and neither substitutes for the other.

## 8. Success definition

Primary metric: `Verified Task Success Rate`.

A task counts as verified success only when the patch applies to the frozen base revision, required tests and regressions pass, the independent evaluator accepts it, no forbidden action occurred, the Evidence Package is complete, and rollback evidence is valid.

Guardrails:

- unsafe-action rate;
- cost per verified success;
- end-to-end latency;
- human intervention count;
- evidence completeness;
- replay/reproduction rate.

P0 defines measurement. P1 measures the baseline and then locks practical target deltas, confidence intervals and budgets. Statistical significance without practical effect is insufficient.

## 9. Phase route

| Phase | Objective | Required exit evidence |
| --- | --- | --- |
| P0 Strategic Foundation | Freeze truth, scope, migration and evaluation contracts | Canonical state, migration ledger, baseline protocol, reviewable worktree plan |
| P1 Agent Evaluation and Research Foundation | Build task/evaluator/trace/baseline infrastructure | Reproducible baseline suite and hidden-set protocol |
| P2 Repository Intelligence | Improve task-conditioned code understanding | Context benchmark beats simple retrieval baselines |
| P3 Single-Agent Runtime + Minimum Trust | Durable planner/executor/tool/state/checkpoint loop | Resume, isolation, permission and trace tests |
| P4 Software Engineer Agent Alpha | Complete real issue-to-evidence flow | Verified patches on controlled real tasks |
| P5 Trustworthy Execution Hardening | Harden sandbox, policy, approval, risk and rollback | Adversarial and failure-recovery evidence |
| P6 Reliability Research | Establish SourceLens-Bench and failure taxonomy | Reproducible benchmark report |
| P7 Memory and Learning Research | Test working/project/experience memory | A/B or ablation evidence of practical improvement |
| P8 Multi-Agent Organization Research | Compare single and multi-Agent strategies | Multi-Agent retained only if it wins on a declared tradeoff |
| P9 Organization Runtime | Build identity, delegation and organization memory | Governed organization experiments |
| P10 Platformization | Extract SDK/tool/environment protocols | Second implementation can use the platform |
| P11 Second-Domain Validation | Test whether abstractions generalize | Evidence from a second domain |
| P12 AI Organization OS | Productize governed autonomous organizations | Long-term outcome, not a current commitment |

Phase numbers in pre-v2.3 documents are historical and must not be mixed with this route.

## 10. Research artifacts

Every major phase must leave a reproducible artifact containing hypothesis, dataset version, environment snapshot, baseline, configuration, run IDs, raw metrics, failure taxonomy, effect size, cost, conclusion and reproduction command.

Required studies include:

- P1 Evaluation Foundation report;
- P2 Repository Context Benchmark;
- P6 Software-Agent Reliability report;
- P7 Memory Ablation study;
- P8 Single-Agent versus Multi-Agent study.

## 11. Stop conditions

A phase or experiment stops when:

- it fails to improve the declared baseline within the predeclared budget;
- cost, latency or safety exceeds its guardrail;
- added complexity has no measurable benefit;
- task representativeness or user value cannot be defended;
- evidence is not reproducible;
- it depends on an unclosed higher-severity trust blocker.

Stopping is a valid research result. It must not be hidden by adding features.

## 12. Change control

Only the Human Founder may change mission, primary ICP, year-one outcome or long-term direction. Any change requires a new constitution version and an append-only ADR. Routine implementation choices do not modify this document.
