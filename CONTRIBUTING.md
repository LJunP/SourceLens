# Contributing to SourceLens AIOS

This is the execution entry for developers, Codex and temporary specialist Agents.

## 1. Read before work

Read in this order:

1. `docs/aios/truth/project_state.yaml`
2. `docs/aios/STRATEGIC_CONSTITUTION.md`
3. `docs/aios/MASTER_EXECUTION_PROTOCOL.md`
4. the task contract and its referenced domain documents
5. `docs/aios/EVALUATION_PROTOCOL.md` for any capability claim

Do not recover current priorities from old status boards, handoffs or progress logs.

## 2. P0 contribution boundary

The project is currently in `P0 Strategic Foundation`.

Allowed work:

- truth, migration, evaluation and baseline consolidation;
- read-only audits and independent reviews;
- dirty-worktree partition planning;
- urgent evidence-backed security or data-integrity containment.

Not allowed without a new approved task:

- product features or broad UI work;
- deletion or cleanup of inherited user work;
- broad refactoring or technology replacement;
- memory, learning or multi-Agent product construction;
- production-readiness claims.

## 3. Task readiness

Do not edit until the task defines:

- task ID, phase, objective and `why_now`;
- TaskSpec or immutable issue/source reference;
- accountable role and temporary worker role;
- explicit read and write scope;
- baseline, acceptance criteria and evidence;
- independent reviewer;
- risk level, forbidden actions and stop conditions.

The full schema is in `docs/aios/MASTER_EXECUTION_PROTOCOL.md`.

## 4. Ownership and Agent rules

- One physical Agent has one role and one task context.
- One file has one implementation owner during a task.
- Parallel write scopes must be disjoint or use separate worktrees.
- Do not overwrite, revert or reformat unrelated user changes.
- The implementer cannot independently verify its own work.
- A worker cannot change phase, strategy, acceptance criteria or permissions.
- Agent output is a candidate until the accountable role and independent gate accept it.

The active team model is defined in `docs/TEAM_OPERATING_MODEL.md`.

## 5. Engineering boundaries

- Prefer existing repository patterns and the smallest measurable change.
- Do not introduce a service, database, framework or abstraction without evidence that the current stack cannot support the experiment.
- Bind code-task evidence to repository identity, base commit and environment.
- Do not expose raw artifacts, prompts, credentials, absolute paths or model payloads without policy and audit.
- Do not treat a nonzero command, incomplete checkpoint or missing verifier as success.
- Do not delete release evidence, runtime state, environment files or generated caches without an approved retention task.

Use `docs/ENGINEERING_STANDARDS.md`, `docs/SECURITY_BOUNDARY.md`, `docs/THREAT_MODEL.md`, `docs/API_DESIGN.md` and `docs/DATABASE_DESIGN.md` as supporting constraints where they do not conflict with `docs/aios/`.

## 6. Verification

Choose checks proportional to the change:

| Change | Minimum verification |
| --- | --- |
| AIOS Markdown/YAML | `make aios-governance-check`, `make code-map-check`, `git diff --check` |
| Java/backend behavior | targeted Maven tests plus relevant API/schema gate |
| Rust analyzer | targeted Cargo tests and analyzer contract checks |
| frontend behavior | static UI validator, build and relevant Playwright smoke |
| security boundary | targeted negative tests and relevant security suite |
| evaluation capability | frozen TaskSpec/environment/baseline/evaluator and retained trace |
| release evidence | package generation plus independent verifier |
| phase gate | declared gate packet and independent review |

If a check is not run, report that fact and the residual risk. A focused check proves only its scope.

## 7. Evidence and claims

Use these levels exactly:

- `DEFINED`: documentation or schema exists.
- `IMPLEMENTED`: executable implementation exists.
- `TESTED`: relevant tests passed against an identified state.
- `GATE_PASSED`: a declared gate passed and retained evidence exists.
- `PRODUCTION_PROVEN`: repeated production evidence exists.

Do not infer a higher level from a lower one. `PASS`, `GREEN` and `DONE` without replayable evidence do not establish a capability.

## 8. Completion report

Every handoff includes:

```text
Task ID and status:
Role and worker identity:
Files/behavior changed:
Commands and exact results:
Evidence paths:
Independent reviewer verdict:
Residual risks and limitations:
Truth/ADR updates:
Next eligible action:
```

## 9. Git and safety prohibitions

- Do not use destructive Git commands or revert unrelated work.
- Do not commit secrets, local `.env`, tokens or private keys.
- Do not silently modify hidden tests, evaluator or acceptance criteria.
- Do not auto-merge, push remote changes or write to production.
- Do not classify an inherited asset as removed during P0; use the migration ledger and Founder gate.
