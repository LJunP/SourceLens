# SourceLens Engineering Standards

> AIOS v2.3 状态：`SUPPORTING ENGINEERING POLICY`。任务、角色、独立验证和完成定义发生冲突时，以 `aios/MASTER_EXECUTION_PROTOCOL.md` 为准。

状态：长期执行。本文定义 SourceLens 工程实现标准。

## 1. 基本原则

- 小步改动，边界清楚。
- 不做无关重构。
- 不回滚别人未确认的改动。
- 代码事实、文档事实、测试证据必须一致。
- 重要决策写 ADR，重要风险写 risk register。

## 2. 后端标准

- Controller path 变化必须同步 `API_DESIGN.md` 并跑 `make api-design-check`。
- DB 变化必须使用 Flyway migration。
- 任务状态机必须防止终态覆盖。
- 外部输入必须校验。
- raw artifact 和 file path 必须做归属/路径边界检查。

## 3. 前端标准

- 使用共享 UI 原语。
- 核心页面必须覆盖 loading/empty/error/success。
- 三视口不裁切核心内容。
- 危险操作必须有确认。
- raw 内容默认脱敏或 receipt 化。

## 4. 脚本/运维标准

- 脚本必须 fail fast。
- destructive 行为默认 dry-run 或需要显式确认。
- release evidence 不得自动删除。
- 本地 env/secrets 不得提交。

## 5. Review 标准

Review 必须检查：

- 用户价值。
- 架构边界。
- 安全边界。
- 测试证据。
- 文档同步。
- 回滚或恢复路径。
