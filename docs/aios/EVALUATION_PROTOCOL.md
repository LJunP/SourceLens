# SourceLens AIOS Evaluation and Research Protocol

- Version: `1.1`
- Status: `FROZEN_FOR_P0`
- Effective date: 2026-07-10

## 1. Purpose

Evaluation is the Agent research control plane, not a late scoring feature. It must make a capability claim falsifiable, reproducible and comparable before implementation is expanded.

The P1 foundation contains five first-class assets:

1. versioned Task Dataset;
2. immutable Environment Snapshot;
3. structured Agent Trace;
4. independent Evaluator;
5. frozen Baseline Suite.

## 2. Unit of evaluation

The unit is one bounded repository task against one immutable repository revision and one declared environment.

Every `TaskSpec` must include:

- task ID, source and license/provenance;
- canonical repository URL or local fixture identity;
- base commit and tree hash;
- issue text and allowed clarifications;
- language, build system and environment image;
- allowed tools, network policy, time and cost budget;
- required tests, regression tests and forbidden changes;
- oracle/evaluator version;
- expected Evidence Package fields;
- risk class and human-approval requirement.

Tasks that cannot be reproduced or legally redistributed must be isolated and labeled rather than mixed into a public benchmark.

The P0 machine-contract draft is `schemas/task-spec.schema.json`. It remains `DRAFT_REVIEW_REQUIRED` until the P0 gate accepts it.

## 3. Environment snapshot

Each run binds:

- source commit and dirty-state policy;
- container image digest and architecture;
- dependency lockfiles and relevant caches;
- environment variables with secrets redacted;
- model provider, exact model/version and inference parameters;
- prompt and policy versions;
- tool versions and permissions;
- start time, run ID and random seed where supported.

A run without an identified source and environment can inform debugging but cannot support a benchmark claim.

The P0 machine-contract draft is `schemas/environment-snapshot.schema.json`. Secret values are never part of the snapshot.

## 4. Baseline Suite v1

| ID | Definition | Purpose |
| --- | --- | --- |
| B0 Direct Model | issue plus bounded textual context; no tools, graph, memory or iterative execution | measure model-only capability |
| B1 Simple Tool Agent | one Agent with file/search/test tools and simple retrieval; no SourceLens graph context or learned memory | measure generic Agent/tooling benefit |
| B2 Current SourceLens | current pre-AIOS repository analysis, Code QA and repair path as implemented at the P0 snapshot | measure value already present in the inherited system |
| A0 SourceLens AIOS | phase-specific target configuration | measure the proposed improvement |

All systems use the same tasks, budgets, environment and evaluator unless the experiment explicitly studies one of those variables. Any exception is disclosed.

The existing 22-case retrieval corpus is a deterministic regression fixture. Its own `benchmarkClaim=false` designation remains binding. It is not a hidden set and cannot establish SourceLens-Bench performance.

Adapter behavior and fairness are defined in `BASELINE_ADAPTER_CONTRACT.md`; executable adapters are P1 deliverables.

## 5. Dataset governance

- Split tasks into development, validation and hidden test sets before tuning.
- Deduplicate by repository, issue lineage, patch similarity and likely model-training leakage where practical.
- Implementation workers may inspect development data, not hidden tasks or hidden expected patches.
- Hidden evaluation is run by Quality & Evaluation or a pinned independent harness.
- Dataset changes create a new version; prior scores are not silently compared across versions.
- Failed, excluded and timed-out runs remain in raw results with reason codes.
- Contaminated runs are labeled invalid and never converted into successes.

## 6. Trace contract

The trace records observable execution, not hidden chain-of-thought:

- run/task/Agent/model/prompt/tool versions;
- observations and selected context references;
- concise decision rationale;
- plans and plan revisions;
- tool requests, policy decisions, inputs, outputs, exit codes and duration;
- checkpoints and resume events;
- file mutations and patch hashes;
- tests and verifier results;
- token, cost and latency accounting;
- errors, retries, human interventions and stop reason.

Sensitive content is redacted according to policy without destroying artifact integrity metadata.

## 7. Primary metric and guardrails

Primary metric: `Verified Task Success Rate (VTSR)`.

Normative calculation:

```text
VTSR = independently verified successful runs / eligible scheduled runs
```

- An eligible scheduled run is one declared TaskSpec, system configuration, environment snapshot and repetition in the frozen evaluation matrix.
- A timeout, budget exhaustion, Agent crash, missing evidence, policy violation or ordinary setup failure attributable to the system under test counts as a failed run.
- Retries inside a run do not create a new denominator entry; their time, cost and actions remain in that run's trace.
- An infrastructure-invalid run may be excluded only by a predeclared reason code that affects the shared harness rather than the system under test. It remains in raw results and is rerun under the same configuration.
- Task or run exclusions must be declared before outputs are inspected. Post-hoc exclusions are reported separately and never improve the primary VTSR.
- When stochastic repetitions are used, every scheduled repetition enters run-level VTSR. Task-level success is also reported using the predeclared aggregation rule, such as at least `k` verified successes from `n` repetitions.
- The report includes numerator, denominator, invalid-run count, failure count and reason-code distribution. A percentage without these counts is invalid.

A task is successful only when:

1. the patch applies to the frozen base revision;
2. issue-specific and required regression tests pass;
3. the independent evaluator accepts the result;
4. no forbidden action or policy violation occurred;
5. the Patch Evidence Package is complete and internally consistent;
6. rollback evidence is valid;
7. the result stays within declared task scope.

Guardrails:

- unsafe-action and policy-violation rate;
- localization recall/precision where an oracle exists;
- patch apply and test pass rates;
- evidence completeness and replay rate;
- cost per verified success;
- end-to-end latency;
- tool errors and resume failures;
- human interventions per task;
- false-success rate.

## 8. Comparison rules

- Predeclare hypothesis, primary metric, guardrails, sample and budget.
- Report absolute values, delta from baseline, confidence intervals and practical effect size.
- Do not rely on a p-value alone and do not claim superiority from overlapping uncertainty on a tiny sample.
- Use paired tasks and repeated runs where stochastic variation matters.
- Report median and tail latency/cost, not only averages.
- Preserve failure taxonomy and representative failure traces.
- A neutral or negative result is a valid Research Artifact and activates the declared stop condition.

P1 measures Baseline Suite v1 before locking numeric year-one target deltas. P0 must not invent a target percentage without data.

P1 must implement a machine validator for these counting rules before any benchmark report is accepted.

## 9. Independent evaluator

The evaluator must be versioned, deterministic where possible and separate from the implementation under test.

Evaluator precedence:

1. executable tests and repository-defined oracles;
2. static/type/security checks;
3. task-specific behavioral assertions;
4. patch-scope and evidence consistency checks;
5. blinded human review for dimensions without a reliable executable oracle;
6. model-based judging only with calibration and disclosed limitations.

An Agent may critique its own result for iteration, but that critique is not independent verification.

## 10. Patch Evidence Package

Every evaluated patch package includes:

- `manifest`: schema version, task ID, run ID and artifact checksums;
- `source_identity`: repository, base commit, tree hash and workspace status;
- `environment`: image digest, dependencies and tool versions;
- `understanding`: issue interpretation and repository evidence references;
- `plan`: bounded intended changes and risks;
- `actions`: observable tool/action trace;
- `patch`: changed paths, diff and patch hash;
- `tests`: commands, exit codes and before/after results;
- `verification`: evaluator identity, version and verdict;
- `risk`: scope, security and regression assessment;
- `approval`: required and actual human approval state;
- `rollback`: checkpoint, disposable-workspace receipt or inverse action.

The package cannot be marked verified when any mandatory field is missing. Platform Release Evidence does not replace this package.

## 11. Research Artifact contract

Each major phase publishes one reproducible artifact with:

- research question and falsifiable hypothesis;
- dataset and task versions;
- environment and source snapshot;
- baseline and target configurations;
- evaluator and metric definitions;
- run IDs and reproduction command;
- raw and aggregate results;
- uncertainty, effect size and cost;
- failure taxonomy and invalid runs;
- conclusion, limitations and decision;
- stop/continue rationale.

## 12. P1 exit gate

P1 exits only when:

- TaskSpec schema and at least one representative task set are versioned;
- environment snapshots can be reproduced;
- traces capture all required observable actions;
- B0, B1 and B2 can run under the same harness or documented compatibility adapters;
- hidden-set access is separated from implementation;
- evaluator disagreement and false-success risks are characterized;
- a baseline report is retained with a reproduction command;
- the first P2 context-engine experiment has a predeclared hypothesis and stop condition.
