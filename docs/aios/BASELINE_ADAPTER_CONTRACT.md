# SourceLens AIOS Baseline Adapter Contract

- Version: `0.2`
- Status: `DRAFT_REVIEW_REQUIRED`
- Implementation phase: `P1`

## 1. Contract set

Each scheduled run validates and binds four immutable documents:

1. `schemas/task-spec.schema.json`
2. `schemas/environment-snapshot.schema.json`
3. `schemas/system-configuration.schema.json`
4. output `schemas/run-record.schema.json`

Executable validators and adapters are P1 deliverables. These P0 files are contracts only.

## 2. Common interface

```text
run(TaskSpec, EnvironmentSnapshot, SystemConfiguration, repetition_id) -> RunRecord
```

The adapter does not decide success. An independent evaluator joins `RunRecord` to the frozen TaskSpec and applies Evaluation Protocol v1.1.

## 3. Mandatory preflight

Before a run is scheduled, the harness rejects the matrix when:

- TaskSpec `environment_snapshot_ref` does not equal EnvironmentSnapshot `snapshot_id`;
- repository identity, base commit or tree hash differ;
- any SystemConfiguration tool is absent from TaskSpec `allowed_tools` or EnvironmentSnapshot `tools`;
- TaskSpec and EnvironmentSnapshot network policy or exact allowed-host set differ;
- SystemConfiguration `model_ref`, `prompt_ref` or `policy_ref` differs from EnvironmentSnapshot `model.model_ref`, `prompt_version` or `policy_version`;
- SystemConfiguration response format differs from TaskSpec `baseline_context.response_format_ref`, or the response-format artifact fails `response_format_sha256`;
- B0 enables any tool or has `loop_limit` other than 1;
- B1 enables a SourceLens graph, ranker, memory or multi-Agent feature;
- any schema, referenced artifact hash or secret-redaction rule fails validation.

Preflight failure prevents dataset freeze; it is not a scheduled run and cannot alter VTSR.

## 4. B0 Direct Model

B0 receives only issue text plus the exact ordered artifact referenced by TaskSpec `baseline_context`. The harness verifies the context and response-format SHA-256 values, token budget and immutable references before the model call.

No repository tools, search, terminal, graph, memory, iteration, execution feedback or hidden evaluator data are available. B0 may emit a patch in the frozen response format but cannot run it.

## 5. B1 Simple Tool Agent

B1 is one fixed-loop Agent in a disposable checkout. It may use only declared file listing/read, lexical search, structured patch and TaskSpec verification-command tools.

It cannot use SourceLens AST/symbol/dependency graph, CodeChunkRanker, learned/project/experience memory, additional Agents or a network host outside the exact TaskSpec/EnvironmentSnapshot allowlist.

## 6. B2 Current SourceLens

B2 is bound to one named exact-state snapshot, its successful external truth-binding attestation and an explicit SystemConfiguration. A pre-independent-review preservation artifact is insufficient. B2 may call only inherited capabilities present in the externally attested snapshot.

The adapter preserves inherited limitations: the 22-case corpus is regression-only; PATCH_READY is not test or independent-verification proof; no missing evidence is synthesized; governance-blocked write/egress/remote actions remain disabled.

An inherited operation that cannot satisfy RunRecord is recorded as failed or missing, never emulated by the adapter.

## 7. A0 SourceLens AIOS

A0 is phase-specific. P2 may isolate Repository Intelligence; P3 may add runtime and minimum trust. Every configuration remains immutable after results are observed.

## 8. Fairness and counting

- Same task revision, evaluator, environment image and resource budget unless the predeclared hypothesis changes one variable.
- Same model when the experiment concerns system architecture.
- Tool differences are treatment variables and are reported.
- Adapters cannot read hidden tasks, expected patches or evaluator internals.
- All scheduled runs produce RunRecord, including failure, timeout, budget and policy stops.
- Invalid infrastructure follows the narrow reason codes and counting rules in Evaluation Protocol v1.1.

## 9. P1 adapter acceptance

An adapter is accepted only when:

1. all four contract documents validate and cross-contract preflight passes;
2. environment materialization reproduces source, toolchain, cache and non-secret environment state;
3. tool, network, time, token, call and cost limits fail closed;
4. every observable action joins to one run ID and trace;
5. the independent evaluator consumes RunRecord without adapter-specific success logic;
6. deterministic fields reproduce and stochastic differences are retained;
7. negative tests prove forbidden tool, hidden-data and network access is blocked;
8. malformed command argv, working directory, timeout and expected-exit contracts fail before execution.

## 10. P0 acceptance required

Before P1, Product, AI Research, CTO, Security and Quality & Evaluation must accept the four schemas, this adapter contract, the exact B2 snapshot, one fixture TaskSpec, P1 write scope, budget and stop condition.
