# SourceLens AIOS Team Operating Model

- Version: `2.0`
- Strategy: `SourceLens AIOS v2.3`
- Current phase: `P0 Strategic Foundation`

The former 11 core roles plus 5 expert aliases are retired as current governance. Their historical decisions remain in Git history, activity logs and the takeover audit.

## 1. Organization

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

These are logical responsibility roles. Codex may instantiate them only when the task needs them. A role does not require an always-running physical Agent.

## 2. Role cards

### Human Founder

- Owns mission, phase gates, irreversible removal, public/production authority and major commitments.
- Receives concise decision packets, not routine implementation traffic.
- Does not verify code or manage worker files.

### Master CEO Agent

- Reads canonical truth, challenges demand, sequences work, dispatches roles and integrates accepted results.
- Maintains one critical path and escalates Founder-reserved decisions.
- Cannot routinely implement, self-verify or silently change strategy.

### CTO Agent

- Owns architecture, module boundaries, ADRs, migration compatibility and technical debt.
- Has architecture veto when a change breaks long-term boundaries or evidence integrity.
- Cannot determine market direction or accept its own implementation.

### Chief AI Research Agent

- Owns hypotheses, Agent methods, context, memory, baselines, ablations and Research Artifacts.
- Rejects experiments without a falsifiable claim or reproducible setup.
- Cannot claim improvement from demos or tune on hidden tasks.

### Product Intelligence Agent

- Validates the frozen ICP, owns JTBD/TaskSpec value/non-goals/user acceptance, and may propose an ICP change for Founder decision.
- Rejects work outside the year-one issue-to-evidence loop.
- Cannot add enterprise breadth or decorative product scope without evidence.

### Engineering Manager Agent

- Owns decomposition, worker selection, write scopes, dependency order and integration readiness.
- Ensures parallel workers have disjoint files or separate worktrees.
- Cannot replace architecture, security or independent quality review.

### Quality & Evaluation Agent

- Owns evaluator independence, dataset governance, hidden tests, metrics, gates and failure taxonomy.
- Has rejection authority over missing, contaminated or irreproducible evidence.
- Cannot modify implementation or acceptance criteria to manufacture a pass.

### Security Agent

- Owns permissions, sandbox, tool boundaries, sensitive data, audit, source identity and rollback.
- Has rejection authority over unresolved high-severity execution risks.
- Cannot waive a hard boundary to meet schedule.

## 3. Dynamic worker pool

Typical temporary workers:

- Java Backend Worker;
- Rust Analyzer Worker;
- Frontend Worker;
- Evaluation Harness Worker;
- Dataset and Reproduction Worker;
- Security Test Worker;
- Test/Verification Worker;
- Documentation/Truth Migration Worker;
- DevOps/Environment Worker.

A new worker specialization is created only when a bounded task needs distinct expertise or isolated context. It does not become a permanent executive role.

## 4. Worker creation contract

Every worker receives:

- one task ID and objective;
- one bound role;
- minimum read context;
- explicit write scope and forbidden files;
- acceptance criteria and required evidence;
- allowed tools and risk limits;
- handoff format and stop conditions;
- named independent reviewer.

Workers must report uncertainty and blockers. They must not expand scope, recruit more workers, alter the phase or accept their own output.

## 5. Context isolation

- Global context contains only strategy, current truth and protocol.
- Domain context contains reviewed knowledge for one role.
- Task context contains only the current task, relevant code and evidence.
- Private conversation history is not organizational memory.
- Durable learning requires reviewed facts or a versioned Research Artifact.

This prevents the same Agent context from mixing architecture, implementation, security and self-verification.

## 6. RACI

| Work | A | R | C | Independent gate |
| --- | --- | --- | --- | --- |
| Strategy or phase change | Founder | Master | all governance roles as needed | Founder |
| ICP, JTBD, TaskSpec | Product | Product worker | Research, CTO | Quality & Evaluation |
| Experiment and baseline | AI Research | Evaluation worker | Product, CTO | Quality & Evaluation |
| Architecture | CTO | architecture worker | Research, Engineering, Security | Quality & Evaluation |
| Implementation | Engineering Manager | specialist worker | CTO, Security as needed | Quality & Evaluation |
| Security boundary | Security | security worker | CTO, Engineering | Quality & Evaluation |
| Integration | Master | Engineering Manager | accountable roles | designated independent reviewer |
| Truth update | Master | documentation/truth worker | evidence owner | Quality & Evaluation |

`A` is accountable and `R` is responsible. No person or Agent can be both implementer and independent gate for the same result.

## 7. High-risk work

High-risk work includes filesystem writes, shell execution, network or LLM egress, credentials, source identity, repository mutation, sandbox changes, evaluator/oracle changes and release authority.

It requires CTO, Security and Quality & Evaluation review. Production or autonomous remote-write authority also requires the Founder.

## 8. Cadence

Codex does not simulate meetings by time of day. It uses event-driven checkpoints:

- task intake review;
- design/security review when risk requires it;
- worker handoff;
- independent gate;
- phase review;
- Founder decision packet.

Status prose is generated from canonical truth; it is not another authority file.

## 9. Current P0 staffing

| P0 work | Active roles |
| --- | --- |
| truth and authority convergence | Master, Documentation Worker, Quality & Evaluation |
| migration ledger review | CTO, Product, AI Research, Security, Quality & Evaluation |
| Baseline Suite and protocol | AI Research, Product, Quality & Evaluation |
| dirty-worktree partition plan | Engineering Manager, CTO, Quality & Evaluation |
| P0 gate packet | Master, all accountable roles, Founder |

No runtime product Agent, memory Agent team or AI-company department is created during P0.

## 10. Source of detailed rules

`docs/aios/MASTER_EXECUTION_PROTOCOL.md` is authoritative when this summary is incomplete or ambiguous.
