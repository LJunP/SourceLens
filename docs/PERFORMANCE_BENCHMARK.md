# SourceLens Performance Benchmark

> AIOS v2.3 状态：`INHERITED PERFORMANCE EVIDENCE`。下方 bounded matrix 和延迟记录不能替代 Baseline Suite、隐藏集或 Agent Research Artifact；新比较遵守 `aios/EVALUATION_PROTOCOL.md`。

状态：继承性能证据；当前Agent研究基线和比较口径以AIOS Evaluation Protocol为准。

## 1. 必测指标

| 指标 | 目标 | Owner |
| --- | --- | --- |
| clone time | 按仓库大小分层记录 | `黄仁勋` |
| analyzer scan time | 文件数、行数、语言分布对应耗时 | `梁文峰` |
| report generation time | scan success 到报告可见耗时 | `比尔盖茨` / `梁文峰` |
| code_chunks search latency | P50/P95 检索耗时 | `梁文峰` |
| ProjectDetail load time | 首屏可交互和关键证据可见 | `扎克伯格` |
| DB growth | scan、artifact、chunk、audit 增长速度 | `比尔盖茨` |
| release evidence duration | full/focused evidence 耗时 | `黄仁勋` |

## 2. 仓库规模分层

| 层级 | 文件数 | 用途 |
| --- | ---: | --- |
| Small | < 1,000 | 日常 smoke |
| Medium | 1,000-10,000 | 阶段验收 |
| Large | 10,000-100,000 | 性能回归 |
| Extreme | > 100,000 | 后续专项，不阻塞当前主线 |

## 3. 记录模板

```text
Date:
Repo:
Files:
Lines:
Scan time:
Report time:
Chunk count:
Search P50/P95:
Frontend load:
DB size:
Evidence:
Regression:
Owner:
```

## 4. 回归判定

- 同等规模下耗时增加超过 30% 必须解释。
- 大仓库任务失败必须分类：Git、analyzer、DB、LLM、frontend、timeout。
- 性能优化不得牺牲安全边界和证据可信度。

## 5. 阶段性基线

### 2026-07-07 P6 bounded five-repo retrieval matrix

```text
Date: 2026-07-07
Repos: Pawnshop, spring-petclinic, commons-cli, express, axios
Files: 3255 / 127 / 143 / 213 / 238
Matrix time: 144s
Max repo time: 111s
Budget: perRepoMaxSeconds=240,totalMaxSeconds=600
Chunk count: 17001 / 417 / 653 / 701 / 712
Evidence: P6_RETRIEVAL_QUALITY_MATRIX_OK
Regression: none
Owner: 黄仁勋 / 梁文峰 / 拉里佩奇
Boundary: bounded local regression gate, not production P95/P99 benchmark
```

### 2026-07-07 P6 extended eight-repo retrieval matrix

```text
Date: 2026-07-07
Repos: Pawnshop, spring-petclinic, commons-cli, express, axios, koa, flask, commander
Files: 3255 / 127 / 143 / 213 / 238 / 111 / 236 / 219
Matrix time: 160s
Max repo time: 102s
Budget: perRepoMaxSeconds=240,totalMaxSeconds=600
Chunk count: 17001 / 442 / 653 / 701 / 712 / 312 / 534 / 680
Evidence: P6_RETRIEVAL_QUALITY_MATRIX_OK preset=extended
Regression: none
Owner: 黄仁勋 / 梁文峰 / 拉里佩奇
Boundary: bounded extended regression gate, not production P95/P99 benchmark
```
