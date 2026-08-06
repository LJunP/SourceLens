# SourceLens Test Strategy

> AIOS v2.3 状态：`SUPPORTING TEST REFERENCE`。现有测试入口继续有效；旧岗位别名、旧 Phase 和 release authority 口径均为历史。Agent 研究、独立验证和 Patch Evidence 以 `aios/EVALUATION_PROTOCOL.md` 为最高约束。

状态：长期执行。本文定义 SourceLens 测试分层、责任和放行规则。

## 1. 测试金字塔

| 层级 | 目标 | 工具/入口 | Owner |
| --- | --- | --- | --- |
| Unit | 单个 service、parser、ranker、sanitizer、状态机规则 | Maven/JUnit、Rust tests、Node check | 对应工程 owner |
| Integration | DB、Flyway、Controller、任务流程、artifact、audit | Maven targeted tests | `比尔盖茨` / `拉里佩奇` |
| Frontend static | UI 规则、脱敏、可读性、禁止回退 | `node scripts/validate-frontend-ui.mjs` | `扎克伯格` |
| Frontend smoke | 核心页面、三视口、mock API、真实 UI marker | Playwright smoke | `扎克伯格` / `拉里佩奇` |
| Security static gate | 安全边界静态契约、脚本结构、CI/文档一致性 | `make verify` 内置 static suite | `奥特曼` |
| Security full regression | forged marker、secret、sandbox、release verifier 全量负例 | `make security-regression-check` | `奥特曼` |
| Release evidence | full/focused evidence、verifier、authority | `make release-evidence-*` | `黄仁勋` / `达里奥` |
| End-to-end drills | backup、rollback、GitHub App、webhook、real provider | drill scripts | 对应 owner |

## 2. 按改动类型必跑

| 改动 | 必跑 |
| --- | --- |
| 后端业务 | 对应 Maven targeted test |
| Controller/API | `make api-design-check` + targeted controller test |
| DB migration | Flyway 启动或相关 mapper/service test |
| 前端 UI | `node scripts/validate-frontend-ui.mjs` + `npm --prefix web-console run build` + focused smoke |
| 安全边界静态契约 | `make verify` 或 `make security-regression-static` |
| release verifier/marker 防伪 | `make security-regression-check` 或相关 focused suite |
| release verifier/evidence | focused evidence + `make verify-release-evidence DIR=...` |
| 结构/API 入口变化 | `make code-map` + `make code-map-check` |
| 阶段日常收口 | `make verify` |
| 发布安全收口 | `make security-regression-check` + release evidence verifier |

## 3. 失败处理

- P0/P1 gate 失败不得标记 DONE。
- 未运行的测试必须写 `Not run` 和原因。
- flaky 测试必须登记 owner，不得直接忽略。
- focused evidence 只能证明当前切片，不能替代 full authority。

## 4. 测试记录模板

```text
Change:
Risk level:
Required tests:
Executed tests:
Passed:
Failed:
Not run:
Evidence:
Owner:
Next:
```
