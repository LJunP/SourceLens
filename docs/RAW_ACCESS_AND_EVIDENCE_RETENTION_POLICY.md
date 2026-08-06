# SourceLens Raw Access and Evidence Retention Policy

> AIOS v2.3 状态：`SUPPORTING EVIDENCE POLICY`。平台 Release Evidence 与 Patch Evidence Package 必须分开保留和解释；当前事实见 `aios/truth/project_state.yaml`。

状态：长期执行。本文统一 raw payload、raw artifact、release evidence 的查看、保留、归档和删除边界。

## 1. Raw Access 原则

Raw access 指查看未经普通 UI 脱敏或压缩的原始内容，包括：

- scan artifact 原文。
- Agent task input/output。
- Agent tool call args/result。
- audit log raw detail。
- LLM prompt/response。
- GitHub webhook payload。
- AutoRepair patch、diff 或 PR payload。
- artifact preview/download 的原始文件。

默认原则：

- 普通 UI 默认展示脱敏、摘要或 receipt，不直接展示 raw。
- 需要 raw 查看时必须有明确用户动作、归属校验和审计记录。
- raw download、copy、export、preview 必须逐项设计，不能因为后端有数据就自动暴露。
- raw 中可能包含 token、路径、私有仓库片段、prompt injection、环境信息或用户代码敏感内容。

## 2. 审批与审计

| 场景 | 要求 |
| --- | --- |
| 普通报告查看 | 展示结构化摘要、引用、证据 receipt |
| raw preview | 需要显式入口、脱敏策略、项目/任务归属校验 |
| raw download | 需要审计日志、资源 owner 校验、下载 receipt |
| raw copy/export | 需要防止 secret 直接复制，至少有显示层脱敏或明确警示 |
| debug/dev seed | 仅限 dev/test，不能进入生产 profile |

## 3. Evidence Retention

| Evidence | 保留策略 |
| --- | --- |
| 当前 full release authority | 必须保留，不得自动删除 |
| focused evidence | 可作为阶段局部证据保留，但不能声明 full authority |
| failed/interrupted evidence | 保留用于诊断或归档候选，不得作为 authority |
| historical superseded evidence | 可归档，删除前必须只读 inventory + 人工确认 |
| raw payload evidence | 保留时必须确认无 secret 扩散或记录已知风险 |

## 4. 删除与归档红线

- 禁止自动删除当前 full authority。
- 禁止在未运行 inventory/dry-run 前删除 `release-evidence/`。
- 禁止把 failed/interrupted 包重命名为成功包。
- 禁止提交 `release-evidence/`、`.sourcelens-runtime/`、`deploy/.env`。
- 禁止为了“仓库干净”删除仍需复盘的事故证据。

## 5. 责任

| 责任 | Owner |
| --- | --- |
| raw access 安全边界 | `奥特曼` |
| artifact/API 权限实现 | `比尔盖茨` |
| 前端 raw 展示和脱敏 | `扎克伯格` |
| evidence inventory / retention | `黄仁勋` |
| 放行和阻断 | `达里奥` |
| 阶段记录和归档计划 | `库克` |
