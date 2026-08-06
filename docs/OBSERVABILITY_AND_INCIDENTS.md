# SourceLens Observability and Incidents

> AIOS v2.3 状态：`SUPPORTING OPERATIONS POLICY`。AIOS Task Trace、Research Artifact 和 Patch Evidence 的观测字段以 `aios/EVALUATION_PROTOCOL.md` 为准。

状态：长期规划与执行。本文定义 SourceLens 如何发现、定位、复盘运行问题。

## 1. 可观测性目标

SourceLens 至少需要追踪：

- HTTP request id、错误码、耗时和用户可见错误。
- scan task、execution task、agent task、AutoRepair attempt 的状态迁移。
- analyzer、LLM、Git、Docker sandbox、artifact 访问的失败原因。
- audit log、agent tool call、GitHub webhook delivery 的追责链路。
- release evidence、smoke、verifier 的执行结果。

## 2. 当前基础

| 能力 | 当前入口 |
| --- | --- |
| Request id | `RequestIdFilter` / API error response |
| 审计日志 | `AuditLogController` / `AuditLogs` 页面 |
| Agent tool call | `AgentToolCallController` / Agent 治理页面 |
| Execution logs | execution task 相关 migration 和服务 |
| Release evidence | `scripts/release-evidence.sh` / `verify-release-evidence.sh` |
| 本地运行手册 | `OPERATIONS_RUNBOOK.md` |

## 3. 事故等级

| 等级 | 示例 | 处理 |
| --- | --- | --- |
| SEV0 | 凭据泄漏、越权执行、数据破坏、危险命令逃逸 | 立即停止相关功能，记录安全事故，修复后跑安全回归 |
| SEV1 | 主链路不可用、扫描/报告/任务系统大面积失败 | 先恢复核心链路，再复盘根因 |
| SEV2 | 单页面或单功能失败、报告质量明显下降 | 阶段内修复并补测试 |
| SEV3 | 可绕过的小体验问题或文档漂移 | 纳入周期维护 |

## 4. 事故记录模板

```text
Incident ID:
Date:
Severity:
Detected by:
User impact:
Root cause:
Affected files/modules:
Mitigation:
Verification:
Prevent recurrence:
Owner:
Follow-up risk ID:
```

## 5. 后续增强方向

- 统一任务 timeline，关联 scan、artifact、audit、agent、AutoRepair、execution attempt。
- 为慢扫描、慢报告、慢 API 增加阈值和日志。
- 为关键失败原因建立分类：环境、认证、网络、LLM、DB、Git、sandbox、用户输入。
- 未来生产化时接入结构化日志、metrics、tracing 和告警。
