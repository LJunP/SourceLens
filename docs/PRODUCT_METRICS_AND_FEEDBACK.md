# SourceLens Product Metrics and Feedback

> AIOS v2.3 状态：`LEGACY METRICS REFERENCE`。旧北极星指标已被 `Verified Task Success Rate` 取代。新指标、成功判定和 guardrails 以 `aios/STRATEGIC_CONSTITUTION.md` 与 `aios/EVALUATION_PROTOCOL.md` 为准。

> DEFAULT AGENT CONTEXT: `EXCLUDED`。只有当前 Task Contract 明确引用本文件时，才可读取指定章节作为历史证据。

状态：冻结的迁移前指标参考；不得计算或展示当前北极星。

## 1. 核心指标

北极星指标：

| 指标 | 含义 | Owner |
| --- | --- | --- |
| Trusted Engineering Loop Completion Rate | 用户从仓库接入到获得一条可追踪、可复核、能指导下一步工程动作的可信结论的完成率 | `乔布斯` / `梁文峰` / `达里奥` |

阶段指标：

| 指标 | 含义 | Owner |
| --- | --- | --- |
| Repository analysis success rate | 仓库克隆、扫描、报告成功率 | `库克` / `黄仁勋` |
| Report evidence quality | 报告引用是否真实、可追溯、不过度宣称 | `梁文峰` / `张一鸣` |
| Code QA usefulness | QA 回答是否绑定 code_chunks 和来源证据 | `梁文峰` |
| AutoRepair candidate quality | 候选是否来源清楚、风险可控、可人工复核 | `比尔盖茨` / `奥特曼` |
| UI task completion | 用户是否能完成项目、报告、审计、修复主流程 | `乔布斯` / `扎克伯格` |
| Error recovery rate | 用户遇错后是否知道原因和下一步 | `拉里佩奇` |
| Time to first trustworthy report | 从创建项目到报告可读且证据可追踪的时间 | `乔布斯` / `黄仁勋` |
| Main path completion rate | 用户是否能完成 项目 -> 报告 -> QA -> 下一步动作 | `乔布斯` / `拉里佩奇` |
| Tool audit completeness | Agent 工具调用是否 100% 有审计记录 | `奥特曼` / `达里奥` |
| Raw access audit coverage | raw preview/download/export 是否有权限和 receipt | `奥特曼` |
| Search P50/P95 latency | code_chunks 检索延迟 | `梁文峰` / `黄仁勋` |

## 1.1 用户角色指标映射

| 用户 | 核心指标 |
| --- | --- |
| 个人开发者 / 后端工程师 | Time to first trustworthy report、QA READY rate、Main path completion rate |
| 架构师 / 技术负责人 | Risk surfaced rate、PR risk review usefulness、CI diagnosis recovery rate |
| AI Agent 工程团队 | Agent task success rate、Tool audit completeness、unsafe action blocked rate |
| 安全审计人员 | Raw access audit coverage、security gate pass rate、blocked unsafe action count |
| 平台管理员 | Setup success rate、provider health、integration failure rate |

详细产品定位、前后台分层和角色到页面/权限/导航/主流程的映射见 `PRODUCT_POSITIONING_AND_ACCESS_MODEL.md`。

## 2. 反馈来源

- 用户直接反馈。
- Playwright smoke 失败。
- release evidence skipped/failed。
- audit log 和 task failure。
- code QA / report citation 质量样本。
- 前端可读性和裁切问题。

## 3. 反馈处理

| 反馈类型 | 处理 |
| --- | --- |
| 阻塞主链路 | 进入 P0/P1 backlog |
| 报告事实错误 | 进入 P6 质量任务 |
| UI 看不清/误导 | 进入 P9 体验任务 |
| 安全边界问题 | 进入 P10 安全任务 |
| 发布证据缺口 | 进入 P11/P12 任务 |

## 4. 阶段复盘问题

- 哪个指标变好了？
- 哪个指标变差了？
- 哪个用户问题重复出现？
- 哪个功能看似完成但没有真实闭环？
- 下一阶段只选哪 3 个质量目标？
