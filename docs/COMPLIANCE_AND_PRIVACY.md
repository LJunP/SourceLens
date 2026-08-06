# SourceLens Compliance and Privacy

> AIOS v2.3 状态：`SUPPORTING POLICY REFERENCE`。企业化范围在第一年冻结；旧 Owner 与产品主线描述不覆盖 `aios/` 权威栈。

状态：长期执行，企业化前必须强化。本文定义隐私、权限、合规和企业边界。

## 1. 当前边界

SourceLens 当前主线是本地优先、公开仓库分析。私有仓库、多用户、企业部署、GitHub App E2E 和生产合规属于高级集成层，不能默认宣称已经完成。

## 2. 隐私原则

- 最小化保存 raw payload。
- 默认不展示 secret。
- 私有仓库能力上线前必须有权限、审计、数据删除和 retention 策略。
- 用户删除项目时必须有数据级联策略。
- LLM provider 调用必须明确哪些内容会离开本地。

## 3. 企业化必备能力

| 能力 | 状态 |
| --- | --- |
| 用户/组织权限 | 后置 |
| 私有仓库访问控制 | 后置 |
| GitHub App installation binding | 架构保留，E2E 后置 |
| 数据删除和导出 | 后续实现 |
| 审计日志保留策略 | 基础存在，企业策略后续补齐 |
| LLM data processing disclosure | 后续真实 provider 前必须补 |
| license / dependency review | 由依赖制度覆盖 |

## 4. 阻断条件

以下能力不得进入企业化声明：

- 未验证私有仓库权限隔离。
- raw artifact 无访问审计。
- LLM provider 未说明数据外发边界。
- 删除项目无法解释数据如何清理。
- GitHub App webhook/installation 未完成 E2E drill。

## 5. Owner

| 领域 | Owner |
| --- | --- |
| 企业合规 | `任正非` |
| 商业化/GTM | `马云` |
| 安全/隐私 | `奥特曼` |
| 数据生命周期 | `比尔盖茨` / `梁文峰` |
| 发布放行 | `达里奥` / `特朗普` |
