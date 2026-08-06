# SourceLens Quality Scorecard

> AIOS v2.3 状态：`HISTORICAL SCORECARD`。下方人工评分和旧 Owner 不能作为当前能力证据。当前证据等级、风险和 Gate 以 `aios/truth/project_state.yaml` 与 `aios/EVALUATION_PROTOCOL.md` 为准。

> DEFAULT AGENT CONTEXT: `EXCLUDED`。只有当前 Task Contract 明确引用本文件时，才可读取指定章节作为历史证据。

状态：冻结的迁移前质量评分；禁止作为当前 Gate 或能力证明。

## 1. 评分原则

- 不追求虚假的满分；低分项必须暴露。
- 指标必须可验证：命令、smoke、日志、页面证据或人工验收。
- 阶段收口前更新一次；重大质量变化时同轮更新。
- 质量评分不替代 release gate；它用于趋势管理和优先级判断。

## 2. 当前质量维度

| 维度 | 目标 | 当前状态 | Owner | 证据入口 |
| --- | --- | --- | --- | --- |
| 本地启动稳定性 | 前后端、MySQL、Redis 可稳定启动和复用健康进程 | 基础可用，需继续保持 runbook 与脚本一致 | `黄仁勋` | `OPERATIONS_RUNBOOK.md` |
| API 契约一致性 | Controller route 与 API 文档一致，Request DTO 顶层字段和首批一层嵌套字段可检查 | 已有 `make api-design-check`，当前 `checked=23 nestedChecked=2 skipped=4` | `比尔盖茨` / `达里奥` | `API_DESIGN.md` |
| 代码理解质量 | code_chunks、cross-file retrieval、citation evidence 可追溯 | P6 第一阶段已按 PARTIAL AUTHORITY 收口；后续只做高证据价值增量 | `梁文峰` / `张一鸣` | `LLM_SAFETY_EVALS.md` / release evidence |
| 报告可信度 | 报告引用真实文件、行号、证据，不 overclaim | focused 提升；`reportQuality.reportCitationQuality` 已进入 ScanTaskDetail 页面级面板并有 smoke marker | `梁文峰` / `乔布斯` | focused smoke / report evidence |
| 前端产品体验 | 核心页面可读、不裁切、状态清楚、操作可理解 | P9 仍是主要短板；ScanTaskDetail citation quality 面板通过 1440/390/320 viewport smoke | `扎克伯格` / `雷军` | Playwright smoke / `validate-frontend-ui.mjs` |
| 安全边界 | repo/file/LLM/sandbox/GitHub/secret 默认收紧 | P10 持续强化 | `奥特曼` | `SECURITY_BOUNDARY.md` / security regression |
| 任务可靠性 | 扫描、AutoRepair、Agent、execution task 状态可追踪 | 需继续强化状态机和 attempt 证据 | `比尔盖茨` / `马化腾` | task tests / audit timeline |
| 发布可复现性 | release evidence 可验证、可追溯、不过期误用 | 当前已有 authority 与 verifier；public repo marker gate 已恢复稳定但仍有 4 分钟级 runtime cost | `黄仁勋` / `达里奥` | `RELEASE_PROCESS.md` / evidence |
| 仓库卫生 | 生成物、旧证据、过期文档可盘点可清理 | 已有清理脚本，需阶段收口执行 | `库克` / `黄仁勋` | `WORKTREE_HYGIENE.md` |

## 3. 阶段收口评分模板

每个阶段收口时追加一条：

```text
Date:
Phase:
Overall status: GREEN / YELLOW / RED
Core flow:
Security:
AI/report quality:
Frontend UX:
Task reliability:
Release evidence:
Repository hygiene:
Top 3 risks:
Next quality target:
```

## 4. 当前优先质量目标

1. P6：第一阶段已收口；仅继续高证据价值的 code_chunks / QA / report citation 增量。
2. P9：把核心页面 UI 从“能用”提升到“产品级可读、稳定、可验收”。
3. P10：继续收紧 raw payload、artifact、sandbox、LLM 和 GitHub 边界。
4. P11：保持 release evidence 与 verifier 不漂移。
5. 阶段收口：执行仓库清理和文档一致性检查。

## 5. 2026-07-05 P6 focused quality update - Code QA citation label canonical normalization

| 维度 | 当前变化 |
| --- | --- |
| 报告可信度 | LLM 输出 `[c01]`、`[C01]` 等大小写/零填充 citation label 时，后端会 canonical 为 `C1` 并匹配真实 sourceLabel。 |
| 后端门禁 | `CodeQaControllerTest` 覆盖 `[c01] -> C1` 的 grounding/citationCoverage/claimCoverage/answerCitations；覆盖 `[c00]` fail-closed，不生成有效标签。 |
| 验证 | 聚焦 controller/adapter 后端测试 PASS；static security regression PASS；`make code-map-check` PASS。 |
| 边界 | 不改回答原文，只在校验和 coverage 结构中使用 canonical labels；不存在标签、混用括号、代码块、日志行和示例行仍 fail-closed。 |

状态：GREEN for focused P6 citation label canonical normalization；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA structured JSON handler method anchor

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | `CodeLocationHintParser` 能从 bounded structured JSON object/array/nested evidence object 中提取同一 object 内的 `handler_class + handler_method` 方法锚点。 |
| 后端门禁 | `CodeLocationHintParserTest` 覆盖 nested/array handler、qualified path hints、parent handler_class 不跨层绑定 child handler_method；`CodeQaRetrievalServiceTest` 覆盖 nested array handler evidence 影响 top chunk 排序。 |
| 验证 | 聚焦 parser/retrieval 后端测试 PASS；static security regression PASS；`make code-map-check` PASS。 |
| 边界 | 只支持现有 snake_case handler 字段；JSON traversal 有长度、深度和节点预算；不声明完整 report evidence schema。 |

状态：GREEN for focused P6 structured JSON handler method anchor；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA structured JSON evidence object parser

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | `CodeLocationHintParser` 能从 bounded structured JSON object/array/nested evidence object 中提取同一 object 内的 `file_path/filePath + line/range` 绑定。 |
| 后端门禁 | `CodeLocationHintParserTest` 覆盖 nested/array、parent path 不跨层绑定 child line、malformed JSON flat fallback；`CodeQaRetrievalServiceTest` 覆盖 nested array evidence 影响 top chunk 排序。 |
| 验证 | 聚焦 parser/retrieval 后端测试 PASS；static security regression PASS；`make code-map-check` PASS。 |
| 边界 | Best-effort JSON candidate scanner；有长度、深度和节点预算；不声明完整 report evidence schema。 |

状态：GREEN for focused P6 structured JSON evidence object parser；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA evidence object range-over-line priority

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | 同一 compact evidence object 内 `start_line/end_line` 优先于 `line_number`，减少旧单行字段压过完整范围证据的风险。 |
| 后端门禁 | `CodeLocationHintParserTest` 覆盖 range-over-line parser 优先级；`CodeQaRetrievalServiceTest` 覆盖错误 line_number 与正确 range 并存时返回 range chunk。 |
| 验证 | 聚焦 parser/retrieval 后端测试 PASS；static security regression PASS；`make code-map-check` PASS。 |
| 边界 | Flat object regex，不是真 JSON parser；复杂多 range 语义未声明。 |

状态：GREEN for focused P6 evidence object range-over-line priority；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA evidence object file path line binding anchor

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | 同一 flat compact JSON evidence object 内的 `file_path + line/range` 会形成 `EvidenceLocationHint`，用于 exact anchor 和 scoring。 |
| 后端门禁 | `CodeLocationHintParserTest` 覆盖同 object 绑定和跨 object 不绑定；`CodeQaRetrievalServiceTest` 覆盖 file_path 与 line_number 跨 object 误配防护。 |
| 验证 | 聚焦 parser/retrieval 后端测试 PASS；static security regression PASS；`make code-map-check` PASS。 |
| 边界 | Flat object regex，不是真 JSON parser；复杂/嵌套 JSON 会退回旧 query-level hints。 |

状态：GREEN for focused P6 evidence object file path line binding anchor；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA compact raw JSON line number evidence anchor

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Compact raw JSON `line/line_number/lineNumber` 进入 line hints，并能结合 `file_path` 定位覆盖目标行的 chunk。 |
| 后端门禁 | `CodeLocationHintParserTest` 覆盖 compact line 正例、非 evidence 字段反例和 token cleanup；`CodeQaRetrievalServiceTest` 覆盖同文件错误行与同名高噪声 decoy。 |
| 验证 | 聚焦 parser/retrieval 后端测试 PASS；static security regression PASS；`make code-map-check` PASS。 |
| 边界 | Regex 级字段提取，不是真 JSON parser；`line_number` 与 `file_path` 是 query-level hints 联合打分，不是结构化 object binding。 |

状态：GREEN for focused P6 compact raw JSON line number evidence anchor；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA compact raw JSON handler method anchor

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Compact raw JSON `handler_class/handler_method` 进入方法级 `MethodHint`，减少报告证据复制到 Code QA 后退化为普通关键词或同名类误选的风险。 |
| 后端门禁 | `CodeLocationHintParserTest` 覆盖 compact handler 正例、method-first 乱序、跨 object 不误配和非法值 fail-closed；`CodeQaRetrievalServiceTest` 覆盖目标 qualified path 压过同名高噪声 decoy。 |
| 验证 | 聚焦 parser/retrieval 后端测试 PASS；static security regression PASS；`make code-map-check` PASS。 |
| 边界 | Regex 级字段提取，不是真 JSON parser；compact handler 仅支持带引号的 Java identifier/package 风格值；不声明 compact `line_number` exact line anchor。 |

状态：GREEN for focused P6 compact raw JSON handler method anchor；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA compact raw JSON file_path evidence anchor

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Compact raw JSON `file_path/filePath` 进入 evidenceFilePathHints 强锚点，减少同名文件或高噪声 decoy 抢占首位的风险。 |
| 后端门禁 | `CodeLocationHintParserTest` 覆盖 compact quoted `file_path/filePath` 与非 evidence `path` 排除；`CodeQaRetrievalServiceTest` 覆盖目标完整路径压过同名高噪声 decoy。 |
| 验证 | 聚焦 parser/retrieval 后端测试 PASS；static security regression PASS；`make code-map-check` PASS。 |
| 边界 | Regex 级字段提取，不是真 JSON parser；compact path 仅支持带引号值。 |

状态：GREEN for focused P6 compact raw JSON file_path evidence anchor；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA compact raw JSON object-boundary guard

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Compact raw JSON start/end 字段在 `{}` object 边界处会重置 pending range，减少多个 evidence object 混排时跨对象误配的风险。 |
| 后端门禁 | `CodeLocationHintParserTest` 覆盖 start-only object + end-only object 不生成 hint，以及两个合法 compact objects 分别解析范围。 |
| 验证 | 聚焦 parser/retrieval 后端测试与 static security regression 均 PASS。 |
| 边界 | 字符级 guard，不是真 JSON parser；同一对象内字符串值或嵌套对象出现 `{}` 可能保守丢弃合法 range。 |

状态：GREEN for focused P6 compact raw JSON object-boundary guard；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA compact raw JSON start/end line range parser

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Compact raw report JSON/text 中成对 `start_line/end_line` 与 `startLine/endLine` 会被解析成 line range hint，降低复制单行报告证据时范围锚点丢失的风险。 |
| 后端门禁 | `CodeLocationHintParserTest` 覆盖 compact raw JSON range 和 compact token cleanup；`CodeQaRetrievalServiceTest` 覆盖 compact raw `file_path + start_line/end_line` 定位覆盖范围 chunk。 |
| 验证 | 聚焦 parser/retrieval 后端测试与 static security regression 均 PASS。 |
| 边界 | 字段扫描是全文流式配对，不按 JSON object 或 file_path 作用域隔离；多 compact object 同行混排可能误配。 |

状态：GREEN for focused P6 compact raw start/end line range parser gate；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA raw JSON start/end line range parser

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Raw report JSON/text 中成对 `start_line/end_line` 与 `startLine/endLine` 会被解析成 line range hint，降低报告范围证据退化为普通关键词或仅文件路径匹配的风险。 |
| 后端门禁 | `CodeLocationHintParserTest` 覆盖 snake/camel start/end range、unpaired start guard 和 token cleanup 顺序；`CodeQaRetrievalServiceTest` 覆盖 raw `file_path + start_line/end_line` 定位覆盖范围 chunk。 |
| 验证 | 聚焦 parser/retrieval 后端测试与 static security regression 均 PASS。 |
| 边界 | 逐行字段解析，不是完整 JSON parser；压缩单行 raw JSON 与倒置范围交换不在本轮范围。 |

状态：GREEN for focused P6 raw start/end line range parser gate；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA tight line range preference

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Code QA line hint scoring 对完整覆盖目标行的 chunk 增加 tight range bonus，减少 broad chunk 与 tight chunk 同时覆盖目标行时 broad chunk 抢占首位的风险。 |
| 后端门禁 | `CodeQaRetrievalServiceTest` 新增 broad `1-500` vs tight `81-92` 同时覆盖 `:85` 的回归，并保留既有 exact line/method/stack/source URL 与 exact-anchor per-file cap tests。 |
| 验证 | 聚焦后端测试与 static security regression 均 PASS。 |
| 边界 | 这是分档偏好，不是绝对最短范围排序；不证明真实项目整体检索质量或全局最优召回。 |

状态：GREEN for focused P6 Code QA tight line range preference gate；full release authority 未刷新。

## 5. 2026-07-05 P6 focused quality update - Code QA exact-anchor per-file cap

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Code QA exact-anchor 首轮同一文件最多选择 1 个 chunk，减少 overlapping same-file chunks 挤掉 service/mapper 跨文件证据的风险。 |
| 后端门禁 | `CodeQaRetrievalServiceTest` 新增 overlapping exact anchors crowd-out 回归，并保留既有 line/method/stack/source URL exact anchor tests。 |
| 验证 | 聚焦后端测试与 static security regression 均 PASS。 |
| 边界 | 只限制 exact-anchor 首轮；后续 role/backfill 仍可按既有每文件最多 2 个 chunk 行为补入同文件证据；不证明真实项目整体检索质量或全局最优召回。 |

状态：GREEN for focused P6 Code QA exact-anchor per-file cap gate；full release authority 未刷新。

## 5. 2026-07-05 P9 focused quality update - ProjectDetail workflow tables scroller

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | ProjectDetail 仓库接入表和扫描任务表通过稳定 class 与受控 scroller 防止 320px 窄屏整页横向溢出。 |
| 浏览器门禁 | `app-shell-ui` smoke 在 desktop、390px 和 320px 视口访问 `/projects/:id`，切换“仓库管理”和“扫描任务”tab，并用非空长文本 repository/scan 行验证两个 workflow table scroller containment。 |
| 验证 | `validate-frontend-ui`、TypeScript、app-shell smoke、前端 build 均 PASS。 |
| 边界 | 只覆盖 ProjectDetail repository/scan workflow table 横向 containment；不证明真实横向拖动距离、其他页面表格、真实生产数据或全站 P9 完成；full release authority 未刷新。 |

状态：GREEN for focused P9 ProjectDetail workflow table scroller gate；full release authority 未刷新。

## 5. 2026-07-05 P9 focused quality update - Dashboard recent scans table scroller

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Dashboard recent scans table 通过受控 scroller 防止 320px 窄屏整页横向溢出。 |
| 浏览器门禁 | `app-shell-ui` smoke 在 desktop、390px 和 320px 视口访问 `/dashboard`，使用非空长文本 recent scan 行验证 table scroller containment。 |
| 验证 | `validate-frontend-ui`、TypeScript、app-shell smoke、前端 build 均 PASS。 |
| 边界 | 只覆盖 Dashboard recent scans table 横向 containment；不证明真实横向拖动距离、其他页面表格、真实生产数据或全站 P9 完成；full release authority 未刷新。 |

状态：GREEN for focused P9 Dashboard recent scans table scroller gate；full release authority 未刷新。

## 5. 2026-07-05 P9 focused quality update - Projects list table scroller

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Projects list table 新增稳定 class，并通过受控 scroller 防止 320px 窄屏整页横向溢出。 |
| 浏览器门禁 | `app-shell-ui` smoke 在 desktop、390px 和 320px 视口访问 `/projects` 并验证 project table scroller containment。 |
| 验证 | `validate-frontend-ui`、TypeScript、app-shell smoke、前端 build 均 PASS。 |
| 边界 | 只覆盖 Projects list table 横向 containment；不证明真实横向拖动交互、其他页面表格、真实生产数据或全站 P9 完成；full release authority 未刷新。 |

状态：GREEN for focused P9 Projects list table scroller gate；full release authority 未刷新。

## 5. 2026-07-05 P9 focused quality update - CiDiagnostics diagnostics table scroller

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | CiDiagnostics 诊断表格新增稳定 class，并通过受控 scroller 防止 320px 窄屏整页横向溢出。 |
| 浏览器门禁 | `ci-diagnostics-detail-selection` smoke 在 desktop 和 320px narrow 视口验证 diagnostics table scroller containment。 |
| 验证 | `validate-frontend-ui`、TypeScript、CI Diagnostics smoke、前端 build 均 PASS。 |
| 边界 | 只覆盖 CiDiagnostics diagnostics table；不证明真实 CI 分析质量、真实 AutoRepair 质量或全站 P9 完成；full release authority 未刷新。 |

状态：GREEN for focused P9 CiDiagnostics diagnostics table scroller gate；full release authority 未刷新。

## 5. 2026-07-05 P9 focused quality update - ModelConfig provider table scroller

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | ModelConfig Provider 表格新增稳定 class，并通过受控 scroller 防止 320px 窄屏整页横向溢出。 |
| 浏览器门禁 | `model-config-recoverable` smoke 在 desktop 和 320px narrow 视口验证 provider table scroller containment。 |
| 验证 | `validate-frontend-ui`、TypeScript、ModelConfig smoke、前端 build 均 PASS。 |
| 边界 | 只覆盖 ModelConfig provider table；不证明真实 provider 调用、真实 LLM 质量或全站 P9 完成；full release authority 未刷新。 |

状态：GREEN for focused P9 ModelConfig provider table scroller gate；full release authority 未刷新。

## 5. 2026-07-05 P9 focused quality update - IssueDecomposition table scroller

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | IssueDecomposition 主队列表格和子任务表格新增稳定 class，并通过受控 scroller 防止窄屏整页横向溢出。 |
| 浏览器门禁 | `issue-decomposition-detail-selection` smoke 在 desktop 和 320px narrow 视口验证 main/task table scroller containment。 |
| 验证 | `validate-frontend-ui`、TypeScript、IssueDecomposition smoke、前端 build 均 PASS。 |
| 边界 | 只覆盖 IssueDecomposition detail selection main/task table；full release authority 未刷新。 |

状态：GREEN for focused P9 IssueDecomposition table scroller gate；full release authority 未刷新。

## 5. 2026-07-05 P6/P11 full authority quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | `CodeChunkService` keyword DB retrieval 不再对 `code_chunks.content` 生成 `LIKE`，避免大规模 `MEDIUMTEXT` 扫描卡住公开仓库 QA / report evidence。 |
| 数据库性能 | 新增 V031 幂等 lookup indexes：按 scan、start line、file path + line 支撑当前 P6 检索热路径。 |
| 发布可复现性 | `release-evidence/release-current-schema-20260705-0610` 已通过完整 `release` profile 和独立 verifier，成为当前 full local release authority。 |
| 测试门禁 | `make verify` PASS；真实 public repo smoke PASS；真实 public repo UI smoke PASS；CodeChunkService targeted test PASS。 |
| 安全门禁 | daily `make verify` 保留 static security suite；完整安全负例大套件保留为 `make security-regression-check` 显式发布/安全门禁。 |
| 仓库卫生 | 下一步执行 generated cleanup 和 code map refresh；不得删除当前 authority evidence。 |
| 边界 | 5 个生产/外部集成 SKIP 仍未完成；DB keyword recall 变成 path/structure-first，全文语义召回质量仍属于后续 P6。 |

状态：GREEN for full local release authority；P12 生产灾备、回滚签署、GitHub App/Webhook E2E 和真实 LLM provider 仍未完成。

## 6. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解稳定性 | `CodeChunkService` role intent candidate query 不再使用 `CodeChunk::getContent`，controller/service/data/model/frontend intent 全部改为 path/structure-first。 |
| 性能边界 | 运行代码中已无 `content LIKE` 查询热路径；keyword 和 role intent 都由测试锁定。 |
| 后端回归 | `CodeChunkServiceTest` 新增 role intent SQL segment 防回退断言，并保持现有 controller/service/frontend intent 排序测试通过。 |
| 安全门禁 | `security-regression-check.sh --suite static` 已锁住运行代码不得回退 `like(CodeChunk::getContent)`。 |
| 边界 | 不新增全文索引或向量库；非常规命名文件的注解召回不再靠 MEDIUMTEXT LIKE，后续应通过 analyzer metadata 或索引化字段补强。 |

状态：GREEN for focused P6 backend hot-path gate and static security gate；full release authority 未刷新。

## 5. 2026-07-04 P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 报告可信度 | `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality` 已进入 release verifier optional-present strict 校验，并新增 source coverage、中文 source labels、固定报告阅读顺序、detail disclosure 与 verdict rail 门禁。 |
| 发布可复现性 | `release-verifier-report-evidence-marker` 套件通过，覆盖 UI marker 伪造、source coverage/labels 缺失、source order 错序、detail disclosure 伪造、verdict rail 缺失/不足、overclaim、raw 字段和 provider/LLM claim 负例；focused package `release-evidence/report-citation-source-order-20260705-002223` verifier PASS。 |
| 仓库卫生 | Worktree inventory strict Other 分组为空，根目录治理文件已分类到 Documentation and handoff。 |
| 运维文档 | `OPERATIONS_RUNBOOK.md` 已记录 `make verify` 的 Git diff whitespace 检查覆盖 unstaged 与 staged diff。 |

状态：GREEN for focused P11 gate；full release authority 未刷新。

## 6. 2026-07-05 P9/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端产品体验 | `ScanTaskDetail` 报告总览新增 3 步主链路导览，将推荐动作、引用质量和证据优先级串成可执行顺序，并通过 1440/390/320 viewport smoke。 |
| 发布可复现性 | `REPORT_EVIDENCE_DRAWER_SMOKE_OK.mainPathGuide` 已进入 release verifier 强校验；`release-verifier-report-evidence-marker` 套件覆盖缺失、错序和 horizontal overflow forged marker；focused package `release-evidence/report-main-path-guide-20260705-003844` verifier PASS。 |
| 边界 | 导览只整理现有报告页主链路，不新增放行规则，不证明报告事实正确、LLM 事实正确或修复候选可合并。 |

状态：GREEN for focused P9/P11 gate；full release authority 未刷新。

## 7. 2026-07-05 P9/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端产品体验 | `ScanTaskDetail` 报告总览新增后续行动分流，将风险复核、代码问答、Agent 复核、审计追踪、依赖复核和修复候选固定为 6 个可执行入口，并通过 1440/390/320 viewport smoke。 |
| 发布可复现性 | `REPORT_EVIDENCE_DRAWER_SMOKE_OK.actionBoard` 已进入 release verifier 强校验；`release-verifier-report-evidence-marker` 套件覆盖缺失、错序、关键链接隐藏和 horizontal overflow forged marker；focused package `release-evidence/report-action-board-20260705-005841` verifier PASS。 |
| 边界 | 行动板只组织现有报告后续动作，不新增后端权限或放行规则，不证明修复候选可合并。 |

状态：GREEN for focused P9/P11 gate；full release authority 未刷新。

## 8. 2026-07-05 P9/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端产品体验 | `ScanTaskDetail` 报告复核门禁解除窄屏文字裁切，6 个治理前检查项进入可验证 UI 合同。 |
| 发布可复现性 | `REPORT_EVIDENCE_DRAWER_SMOKE_OK.reviewGate` 已进入 release verifier 强校验；`release-verifier-report-evidence-marker` 套件覆盖缺失、错序、文字裁切和 horizontal overflow forged marker；focused package `release-evidence/report-review-gate-20260705-011417` verifier PASS。 |
| 边界 | 该门禁只证明报告页治理前检查可见且可读，不改变后端放行规则，不证明报告事实正确或修复候选可合并。 |

状态：GREEN for focused P9/P11 gate；full release authority 未刷新。

## 9. 2026-07-05 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | `code_chunks` 报告证据解析支持 `file_path:`、quoted JSON `"file_path": "..."`、`"line_number": 90` 和 `handler_class/handler_method`，报告 JSON / 分析产物复制追问不再只依赖 `filePath:`。 |
| 后端回归 | 新增 parser 和 retrieval candidate tests，证明 `file_path + line_number` 会进入 evidence path / line anchor，`handler_class + handler_method` 会进入 method anchor；明确 evidence path hint 会压过报告文档普通文本命中。 |
| 边界 | 只支持明确 `filePath` / `file_path`、`line/lineNumber/line_number` 和 `handler_class/handler_method` 字段；不扩大到泛化 `path:` 或 `start_line`，不改变 schema、LLM provider 或前端 UI。 |

状态：GREEN for focused P6/P11 backend gate；full release authority 未刷新。

## 38. 2026-07-05 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Release gate | `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.startEndOnlyEvidenceRef` 成为 public repo UI release marker 子证明。 |
| 防回退 | verifier 拒绝 start/end-only marker 缺失、legacy `lineNumber`、file-anchor 伪造和 primary-unbound 伪造。 |
| 测试门禁 | public repo UI marker forged suite 已动态验证新增字段。 |
| 验证 | bash syntax、前端 build、`security-regression-check.sh --suite release-verifier-public-repo-ui-marker` 均 PASS。 |
| 边界 | 未刷新 full release authority；下一次 release evidence package 会吸收 marker schema。 |

状态：GREEN for focused P6/P11 release verifier gate；full release authority 未刷新。

## 33. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 报告证据锚点 | `handler_method` / `handler_class` 乱序时仍可形成 method anchor；`evidenceRef.lineNumber` 支持范围行号重叠判断。 |
| QA 证据闭环 | 范围行号与 chunk 行区间重叠时保持 `REPORT_LINE_ANCHOR`、PRIMARY 和 `coverageScope=PRIMARY`。 |
| 验证 | `mvn -Dtest=CodeChunkServiceTest,CodeQaControllerTest test` PASS，102 tests，0 failures，0 errors。 |
| 边界 | 不扩大到泛化 `path:` 或 `start_line/end_line`；full release authority 未刷新。 |

状态：GREEN for focused P6/P11 backend gate；full release authority 未刷新。

## 32. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 检索召回 | `FRONTEND` role intent 支持中文/英文前端页面组件问题，并进入 Service 候选补池。 |
| 跨文件证据 | Top context role diversity 增加 `SOURCE`，降低 Controller 同类结果挤满上下文的风险。 |
| 验证 | `mvn -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest test` PASS，88 tests，0 failures，0 errors。 |
| 边界 | 只覆盖 code_chunks/retrieval 候选召回与排序；full release authority 未刷新。 |

状态：GREEN for focused P6/P11 backend gate；full release authority 未刷新。

## 10. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Code QA top context 增加 evidence role diversity，避免多个同类 controller/service 挤掉跨层证据。 |
| 后端回归 | 新增 `CodeQaRetrievalServiceTest` 覆盖同类 controller 高分噪声下仍选入 service 与 data-access。 |
| 边界 | 保留 exact anchor 优先和首条最高相关结果；不改变 API/DTO、DB schema、LLM provider、前端 UI 或 release evidence。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 11. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | Code QA citation parser 支持 `[C1, C2]` 和 `[C1-C2]`，合并引用不再导致 coverage 误判。 |
| 后端回归 | 新增 `CodeQaControllerTest` 覆盖 comma-separated citation block 和 citation range，保留未知标签、代码块/日志/示例过滤边界。 |
| 边界 | 只解析方括号内明确 C-label；不改变 API/DTO、DB schema、检索排序、LLM provider、前端 UI 或 release evidence。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 12. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | Code QA citation parser 支持中文全角 `【C1】` / `【C1，C2】`，中文回答不再因括号样式导致 coverage 误判。 |
| 后端回归 | 新增 `CodeQaControllerTest` 覆盖 full-width citation block，并保留示例/代码块/日志过滤边界。 |
| 边界 | 只扩展 citation block 边界；不改变 API/DTO、DB schema、检索排序、LLM provider、前端 UI 或 release evidence。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 13. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | retry citation enforcement 增加 `【C1，C2】` 合并引用回归，证明二次修正回答也使用同一 citation audit 合同。 |
| 后端回归 | 新增 `CodeQaControllerTest` 覆盖首轮无引用、retry 返回 full-width combined citation、`RETRY_VERIFIED`、coverage FULL、claim coverage READY。 |
| 边界 | 本轮只补测试门禁；不改变 API/DTO、DB schema、检索排序、LLM provider、前端 UI 或 release evidence。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 14. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | citation parser 收紧为成对 bracket，`[C1]` / `【C1】` 有效，`[C1】` / `【C1]` 无效。 |
| 后端回归 | 新增 `CodeQaControllerTest` 覆盖 malformed mixed bracket citation 拒绝路径，并验证 claim coverage 不被示例过滤误跳过。 |
| 边界 | 不兼容 malformed citation；不改变 API/DTO、DB schema、检索排序、LLM provider、前端 UI 或 release evidence。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 15. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | retry prompt 明确成对 bracket 规则，包含 `[C1]` / `【C1】` 有效示例和 `[C1】` / `【C1]` 无效反例。 |
| 后端回归 | `CodeQaControllerTest` capture 第二次 LLM 调用，锁住 retry prompt citation format contract。 |
| 边界 | Prompt contract 不能保证真实 provider 稳定遵守；不改变 API/DTO、DB schema、检索排序、LLM provider、前端 UI 或 release evidence。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 16. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | claim split 不再在 `AuthService.java` 这类文件路径内部切断，claim preview 保留完整路径事实句。 |
| 后端回归 | 新增 `CodeQaControllerTest` 覆盖 `src/AuthService.java validates auth tokens [C1].` 单 claim 和 CITED 状态。 |
| 边界 | 只修复文件路径内英文句号误切；不声明所有自然语言缩写和版本号边界都已完整处理。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 17. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | invalid range 不再降级为普通 token，`[C2-C1]` 不会被误判为 `C2` + `C1`。 |
| 后端回归 | 新增 `CodeQaControllerTest` 覆盖反向 range 被拒绝，同时保留 `[C1-C2]` 正向 range。 |
| 边界 | 不新增复杂 range 语法；不改变 API/DTO、DB schema、检索排序、LLM provider、前端 UI 或 release evidence。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 18. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | claim split 支持中文/英文分号，多个分号连接代码事实不再被合并成一个 claim。 |
| 后端回归 | 新增 `CodeQaControllerTest` 覆盖 `AuthController ... [C1]; TokenRepository ...` 被拆成 CITED + UNCITED。 |
| 边界 | 只覆盖分号连接事实；不改变 API/DTO、DB schema、检索排序、LLM provider、前端 UI 或 release evidence。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 19. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | claim split 支持 citation 后同一行编号项，`1. A [C1] 2. B` 不再被合并成一个 claim。 |
| 后端回归 | 新增 `CodeQaControllerTest` 覆盖 inline numbered code facts 被拆成 CITED + UNCITED。 |
| 边界 | 只在 citation block 后识别编号项；不改变 API/DTO、DB schema、检索排序、LLM provider、前端 UI 或 release evidence。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 20. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | claim split 支持 citation 后 inline bullet，`A [C1] - B` 不再被合并成一个 claim。 |
| 后端回归 | 新增 `CodeQaControllerTest` 覆盖 inline bullet code facts 被拆成 CITED + UNCITED。 |
| 边界 | 只在 citation block 后识别 inline bullet；不改变 API/DTO、DB schema、检索排序、LLM provider、前端 UI 或 release evidence。 |

状态：GREEN for focused P6 backend gate；full release authority 未刷新。

## 21. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | app shell 顶部标题和说明支持长文本换行，不再使用省略号隐藏关键 copy。 |
| 响应式 | 320px 长标题 smoke 已覆盖，不产生横向溢出，页面内容仍在自适应 topbar 下方。 |
| 验证 | `validate-frontend-ui`、前端 build、`smoke:app-shell-ui` 均 PASS。 |
| 边界 | 只覆盖 app shell 顶部；full release authority 未刷新。 |

状态：GREEN for focused P9/P11 frontend gate；full release authority 未刷新。

## 22. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | ProjectDetail next action checks 不再使用 `nowrap + ellipsis` 隐藏成熟度和阻塞信息。 |
| 响应式 | 6 个 ProjectDetail next-action 分支在 1440px、390px、320px 均通过无溢出检查。 |
| 验证 | `smoke:p9-main-path-recoverable-error-states-batch4a`、`validate-frontend-ui`、前端 build 均 PASS。 |
| 边界 | 只覆盖 ProjectDetail next action checks；full release authority 未刷新。 |

状态：GREEN for focused P9/P11 frontend gate；full release authority 未刷新。

## 23. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Artifacts focus card 的 primary evidence 和 meta values 不再使用 `nowrap + ellipsis` 隐藏关键证据。 |
| 响应式 | 1440px、390px、320px artifacts detail-selection smoke 均覆盖 focus card 可读性和无横向溢出。 |
| 验证 | `smoke:artifacts-detail-selection`、`validate-frontend-ui`、前端 build 均 PASS。 |
| 边界 | 只覆盖 Artifacts focus card；full release authority 未刷新。 |

状态：GREEN for focused P9/P11 frontend gate；full release authority 未刷新。

## 24. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Artifacts bundle/type filter chips 不再使用 `nowrap + ellipsis` 隐藏 owner、meta、来源、类型和大小。 |
| 响应式 | 1440px、390px、320px artifacts detail-selection smoke 均覆盖 filter chip 可读性和无横向溢出。 |
| 验证 | `smoke:artifacts-detail-selection`、`validate-frontend-ui`、前端 build 均 PASS。 |
| 边界 | 只覆盖 Artifacts filter chips；full release authority 未刷新。 |

状态：GREEN for focused P9/P11 frontend gate；full release authority 未刷新。

## 25. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Artifacts table type/owner columns 增加稳定 class，artifact type、content type、owner、repository 不再依赖默认单行样式。 |
| 响应式 | 1440px、390px、320px artifacts detail-selection smoke 均覆盖 target/secondary row 表格关键文本。 |
| 验证 | `smoke:artifacts-detail-selection`、`validate-frontend-ui`、前端 build 均 PASS。 |
| 边界 | 只覆盖 Artifacts table type/owner cells；full release authority 未刷新。 |

状态：GREEN for focused P9/P11 frontend gate；full release authority 未刷新。

## 26. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Artifacts drawer action/status 文案增加稳定换行规则，来源、预览、下载、加载预览和状态提示不再依赖 Ant 默认单行裁切。 |
| 响应式 | 1440px、390px、320px artifacts detail-selection smoke 均覆盖 drawer action/status 文案。 |
| 验证 | `smoke:artifacts-detail-selection`、`validate-frontend-ui`、前端 build 均 PASS。 |
| 边界 | 只覆盖 Artifacts drawer action/status；full release authority 未刷新。 |

状态：GREEN for focused P9/P11 frontend gate；full release authority 未刷新。

## 27. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Artifacts smart preview summary tiles 增加稳定 label/value class，文件、代码行、API、风险指标不再依赖单行 ellipsis。 |
| 响应式 | 1440px、390px、320px artifacts detail-selection smoke 均覆盖四个 preview tile 的 label/value 文案。 |
| 验证 | `smoke:artifacts-detail-selection`、`validate-frontend-ui`、前端 build 均 PASS。 |
| 边界 | 只覆盖 Artifacts smart preview summary tiles；full release authority 未刷新。 |

状态：GREEN for focused P9/P11 frontend gate；full release authority 未刷新。

## 28. 2026-07-05 P9/P10 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Artifacts raw download confirm modal 增加稳定 class，标题、风险说明、取消和确认下载按钮不再依赖 Ant 默认单行裁切。 |
| 安全边界 | raw access 下载前的风险提示更可读，降低未脱敏 artifact 下载误操作风险。 |
| 验证 | `smoke:artifacts-detail-selection`、`validate-frontend-ui`、前端 build 均 PASS。 |
| 边界 | 只覆盖 raw download confirm modal；full release authority 未刷新。 |

状态：GREEN for focused P9/P10/P11 frontend gate；full release authority 未刷新。

## 38. 2026-07-05 P11/P6 focused release evidence update

| 维度 | 当前变化 |
| --- | --- |
| 发布证据 | 新增 focused release evidence package `release-evidence/public-repo-ui-start-end-only-20260705-042402`。 |
| 公开仓库主链路 | `public-repo-smoke` OK，真实公开仓库 UI smoke 输出 `PUBLIC_REPO_UI_SMOKE_OK`。 |
| QA citation 可信度 | `qaFromEvidence.startEndOnlyEvidenceRef` 证明 start/end-only request/response 无 legacy `lineNumber`，仍为 `REPORT_LINE_ANCHOR` 和 PRIMARY。 |
| 验证 | `./scripts/verify-release-evidence.sh release-evidence/public-repo-ui-start-end-only-20260705-042402` PASS。 |
| 边界 | focused evidence only；full release authority、真实 LLM provider、GitHub App、生产部署未刷新。 |

状态：GREEN for focused P11/P6 release evidence gate；full release authority 未刷新。

## 39. 2026-07-05 P9/P6 focused UI quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | QA evidence bridge 和回答来源凭证显示 `范围 xx-yy`，避免把结构化范围误读为旧单行字段。 |
| 证据链可信度 | `startLine/endLine` 优先于 legacy `lineNumber`，冲突 URL 中旧 `999` 被隐藏。 |
| 移动端 | smoke 覆盖 1440、390、320 视口，新增 range priority proof 无横向溢出。 |
| 验证 | `npm run build`、`smoke:report-evidence-drawer` 均 PASS。 |
| 边界 | 只覆盖 ProjectDetail QA UI；full release authority、后端、DB、真实 LLM provider 未刷新。 |

状态：GREEN for focused P9/P6 frontend gate；full release authority 未刷新。

## 36. 2026-07-05 P6/P9/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 报告可信度 | report evidence smoke 的主样本改为 start/end-only，证明没有 legacy `lineNumber` 也能保持行级证据范围。 |
| 前端证据桥接 | QA request/response 均断言 `lineNumber` 不被合成，`startLine=24` / `endLine=42` 被保留。 |
| 测试门禁 | `report-evidence-drawer-smoke` 输出 `lineRange=24-42` marker，覆盖 1440、390、320 三类视口。 |
| 验证 | `npm run build`、`CI=true npm --prefix web-console run smoke:report-evidence-drawer` 均 PASS。 |
| 边界 | 不刷新 full release authority；不改变真实 LLM provider、DB 或 AutoRepair schema。 |

状态：GREEN for focused P6/P9/P11 frontend gate；full release authority 未刷新。

## 37. 2026-07-05 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | 后端 Code QA 已用 source URL + start/end-only 单测锁住行级锚点，覆盖前端堆栈 URL 形态。 |
| 报告可信度 | response 不合成 legacy `lineNumber`，只保留结构化 `startLine/endLine`，降低字段漂移风险。 |
| 测试门禁 | `CodeQaControllerTest` 从 41 个增至 42 个，新增 source URL start/end-only 回归。 |
| 验证 | `mvn -Dtest=CodeQaControllerTest test` PASS，42 tests，0 failures，0 errors。 |
| 边界 | 不刷新 full release authority；不改变生产代码、DB、真实 LLM provider 或 AutoRepair schema。 |

状态：GREEN for focused P6/P11 backend gate；full release authority 未刷新。

## 34. 2026-07-05 P6/P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Code QA `evidenceRef` 支持 `startLine/endLine` 和 `start_line/end_line`，报告证据不再必须预先拼成 `lineNumber=85-120` 才能行级锚定。 |
| 报告可信度 | 无效 `lineNumber` 可回退到 start/end；有效 `lineNumber` 继续优先，兼容历史入口。 |
| 前端证据桥接 | `ProjectDetail` 不再丢弃 start/end 行号，来源收据、复制文本、可信度指标和修复跳转参数可显示派生行号。 |
| 验证 | `mvn -Dtest=CodeQaControllerTest test`、`make api-design-check`、`npm run build` 均 PASS。 |
| 边界 | 不改 DB schema、AutoRepair provenance schema、真实 LLM provider 或 release evidence package；full release authority 未刷新。 |

状态：GREEN for focused P6/P9/P11 gate；full release authority 未刷新。

## 35. 2026-07-05 P6/P9/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 报告可信度 | 报告证据抽屉可从风险/API 证据读取 `start_line/end_line`，并通过 QA deep link 传递结构化行号。 |
| 前端产品体验 | `ProjectDetail` 能从 `evidenceStartLine/evidenceEndLine` URL 参数恢复 `evidenceRef.startLine/endLine`，QA 请求不再丢失范围行号。 |
| 测试门禁 | `report-evidence-drawer-smoke` 断言 QA request 和 response 均保留 start/end，覆盖 1440、390、320 三类视口流程。 |
| 验证 | `npm run build`、`smoke:report-evidence-drawer`、`git diff --check` 均 PASS。 |
| 边界 | 不刷新 full release authority；QA 页 UI 仍优先显示 `lineNumber`。 |

状态：GREEN for focused P6/P9/P11 frontend gate；full release authority 未刷新。

## 31. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Citation 可信度 | Unicode dash range 纳入 parser；反向 Unicode dash range 不降级为普通 citation token。 |
| Claim 审计 | citation 后 `+` bullet 的未引用代码事实会单独进入 claim coverage。 |
| 验证 | `mvn -Dtest=CodeQaControllerTest test` PASS，37 tests，0 failures，0 errors。 |
| 边界 | 只覆盖 Code QA citation/claim parser；full release authority 未刷新。 |

状态：GREEN for focused P6/P11 backend gate；full release authority 未刷新。

## 29. 2026-07-05 P9/P10 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Artifacts raw download audit receipt title/description/action 增加稳定换行规则，success 和 fallback 两条审计入口都不再依赖单行裁切。 |
| 安全边界 | raw access 下载后的 receipt id 或 fallback 过滤策略更可读，提升审计追溯链路清晰度。 |
| 验证 | `smoke:artifacts-detail-selection`、`validate-frontend-ui`、前端 build 均 PASS。 |
| 边界 | 只覆盖 raw download audit receipt；full release authority 未刷新。 |

状态：GREEN for focused P9/P10/P11 frontend gate；full release authority 未刷新。

## 30. 2026-07-05 P9/P10 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Artifacts redacted raw JSON summary/pre 增加稳定换行和断词规则，展开后保持可读且无横向溢出。 |
| 安全边界 | 只增强 display-redacted raw JSON 复核体验，不改变 raw download 或脱敏规则。 |
| 验证 | `smoke:artifacts-detail-selection`、`validate-frontend-ui`、前端 build 均 PASS。 |
| 边界 | 只覆盖 redacted raw JSON 展开区；full release authority 未刷新。 |

状态：GREEN for focused P9/P10/P11 frontend gate；full release authority 未刷新。

## 38. 2026-07-05 P11/P6/P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 发布门禁 | `qaFromEvidence.evidenceLineRangePriority` 已进入 `verify-release-evidence.sh` 强校验。 |
| 报告可信度 | verifier 要求结构化 `24-42` 范围优先，并证明 legacy `999` 不可见。 |
| 安全回归 | `release-verifier-report-evidence-marker` suite 已拒绝 missing、false、wrong range、missing viewport、overflow 和 raw-field forged marker。 |
| 验证 | bash syntax、focused security regression、`smoke:report-evidence-drawer` 均 PASS。 |
| 边界 | 不刷新 full release authority；不改变后端、DB、真实 LLM provider 或 GitHub App。 |

状态：GREEN for focused P11 release verifier gate；full release authority 未刷新。

## 39. 2026-07-05 P11/P9/P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 发布门禁 | `qaFromEvidence.deepEvidenceCardReadability` 已进入 `verify-release-evidence.sh` 强校验。 |
| 前端可读性 | QA source receipt、source location confidence、source file match release 的移动端可读性不再只靠 smoke 自述。 |
| 安全回归 | `release-verifier-report-evidence-marker` suite 已拒绝 missing、clipped、range hidden、review repair visible、overflow、provider claim 和 raw-field forged marker。 |
| 验证 | bash syntax、focused security regression、`smoke:report-evidence-drawer` 均 PASS。 |
| 边界 | 不刷新 full release authority；不改变 UI、后端、DB、真实 LLM provider 或 GitHub App。 |

状态：GREEN for focused P11 deep evidence readability verifier gate；full release authority 未刷新。

## 41. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Claim 审计 | Code QA 现在能拆分 Markdown 表格数据行 cell，避免表格后一条未引用代码事实被前一条 `[C1]` 覆盖。 |
| 安全边界 | 只有“表头行 + separator 行”的 Markdown table block 会进入 cell 拆分；普通 pipe 文本保持原样，降低误拆噪声。 |
| 后端门禁 | `CodeQaControllerTest` 覆盖 Markdown 表格正例、代码味表头不计入 required claim、普通 pipe 文本负例。 |
| 验证 | `CodeQaControllerTest`、static security regression、diff whitespace 均 PASS；奥特曼和拉里佩奇二次复核 PASS。 |
| 边界 | 不解析任意 pipe-delimited 文本；full release authority 未刷新。 |

状态：GREEN for focused P6 Markdown table claim split gate；full release authority 未刷新。

## 42. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Citation 可信度 | Markdown blockquote 包裹的日志、异常和 stack trace 假 `[C1]` 不再进入真实 citation。 |
| 回答兼容性 | 普通 blockquote 正文里的真实 `[C1]` 仍可通过 `DIRECT_VERIFIED`。 |
| 后端门禁 | `CodeQaControllerTest` 同时覆盖 blockquoted fake citation 负例和 prose blockquote citation 正例。 |
| 验证 | `CodeQaControllerTest`、static security regression、diff whitespace 均 PASS；奥特曼和拉里佩奇只读复核 PASS。 |
| 边界 | 只在 non-auditable line 判定中剥离 `>`；不改原始回答展示，不扩 citation 语法；full release authority 未刷新。 |

状态：GREEN for focused P6 blockquote log fake citation filter；full release authority 未刷新。

## 40. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | ProjectDetail cockpit status 不再使用 `nowrap + ellipsis + hidden` 隐藏仓库、扫描和 knowledge source 上下文。 |
| 暗色操作区 | Project next-action disabled default action 在暗色面保持可读，label 不裁切。 |
| 验证 | `validate-frontend-ui`、TypeScript、`app-shell-ui-smoke`、前端 build 均 PASS。 |
| 边界 | 只覆盖 ProjectDetail cockpit status 和 next-action disabled readability；full release authority 未刷新。 |

状态：GREEN for focused P9 app-shell frontend gate；full release authority 未刷新。

## 41. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | Dashboard、Project、Scan、Graph、Execution、Agent、Artifacts、Audit、CI、PR、Issue、AutoRepair 等核心 status line 共享 wrap/no-ellipsis guard。 |
| 浏览器门禁 | `app-shell-ui-smoke` 三视口核心路由矩阵实测 `guardedStatusLineCount=30`。 |
| 验证 | `validate-frontend-ui`、TypeScript、`app-shell-ui-smoke`、前端 build 均 PASS。 |
| 边界 | 只覆盖 app-shell route matrix 可见 status line；full release authority 未刷新。 |

状态：GREEN for focused P9 app-shell status-line gate；full release authority 未刷新。

## 43. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Citation 可信度 | HTML `<pre>` / `<code>` 包裹的假 `[C1]` 不再进入真实 citation。 |
| 回答兼容性 | 正文有效 `[C1]` 仍可通过 `DIRECT_VERIFIED`；HTML inline code 中的普通 token 不破坏外部 citation。 |
| 后端门禁 | `CodeQaControllerTest` 覆盖 HTML 正例、纯 HTML fake citation 负例、外部 `[C1]` + HTML `[C99]` 混合负例。 |
| 验证 | `CodeQaControllerTest`、static security regression、diff whitespace 均 PASS；拉里佩奇只读复核 PASS。 |
| 边界 | 只剔除成对 HTML `<pre>` / `<code>` 容器；不扩 citation 语法；full release authority 未刷新。 |

状态：GREEN for focused P6 HTML code fake citation filter；full release authority 未刷新。

## 44. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Report evidence 锚点 | `lineStart/lineEnd` 与 `line_start/line_end` 已纳入 line range hint 解析。 |
| 检索可信度 | 同文件多 chunk 场景下，覆盖 alias range 的目标 chunk 被排到第一。 |
| 噪声控制 | tokenization 会清理 alias 字段和数字噪声；未泛化任意 `start/end` 字段。 |
| 验证 | `CodeLocationHintParserTest`、`CodeChunkServiceTest`、static security regression、diff whitespace 均 PASS；拉里佩奇只读复核 PASS。 |
| 边界 | 不改 ranking 权重、DTO、DB schema、前端 UI 或 release evidence schema；full release authority 未刷新。 |

状态：GREEN for focused P6 report evidence line alias parsing；full release authority 未刷新。

## 45. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Report evidence 锚点 | `sourceFile/source_file/sourcefile` 已纳入 evidence file path anchor 白名单。 |
| 检索可信度 | `sourceFile + lineNumber` 在同文件多 chunk 场景能把覆盖行号的目标 chunk 排第一。 |
| 误判控制 | 普通 `path` 字段继续不作为 evidence anchor，避免 API route path 或文档 path 干扰源码检索。 |
| 验证 | `CodeLocationHintParserTest`、`CodeChunkServiceTest`、static security regression、diff whitespace 均 PASS；拉里佩奇只读复核 PASS。 |
| 边界 | 不改 ranking 权重、DTO、DB schema、前端 UI 或 release evidence schema；full release authority 未刷新。 |

状态：GREEN for focused P6 report evidence sourceFile alias parsing；full release authority 未刷新。

## 46. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Report evidence 锚点 | `sourcePath/source_path/sourcepath` 已纳入 evidence source path anchor 白名单。 |
| 检索可信度 | `sourcePath + lineNumber` 在同文件多 chunk 场景能把覆盖行号的目标 chunk 排第一。 |
| 误判控制 | 普通 `path` 字段继续不作为 evidence anchor；既有 pathSuffixHints 普通源码路径提示行为不变。 |
| 验证 | `CodeLocationHintParserTest`、`CodeChunkServiceTest`、static security regression、diff whitespace 均 PASS；拉里佩奇只读复核 PASS。 |
| 边界 | 不改 ranking 权重、DTO、DB schema、前端 UI 或 release evidence schema；full release authority 未刷新。 |

状态：GREEN for focused P6 report evidence sourcePath alias parsing；full release authority 未刷新。

## 47. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Citation 可信度 | Code QA 已显式暴露未引用 primary/context evidence 条数和文件数。 |
| 角色分布语义 | `MIXED_PRIMARY_CONTEXT` 用于单 primary + context；`PRIMARY_CROSS_FILE` 继续代表跨文件 primary。 |
| 口径准确性 | `uncited*EvidenceFileCount` 按“文件内存在未引用证据”计算，避免同文件部分引用时误报 0。 |
| 前端与门禁 | ProjectDetail、TS type、report evidence smoke mock、public smoke、release verifier、API 文档已同步。 |
| 验证 | `CodeQaControllerTest`、static security regression、`validate-frontend-ui`、diff whitespace 均 PASS；拉里佩奇复核 PASS。 |
| 边界 | 不改 retrieval ranking、DB schema、真实 LLM provider、GitHub App 或 full release authority。 |

状态：GREEN for focused P6 mixed evidence coverage audit；full release authority 未刷新。

## 48. 2026-07-05 P6/P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Citation UI 可信度 | ProjectDetail 对已引用 PRIMARY 但未引用 adjacent context 的 QA 结果显示 `上下文引用待补齐` 和 `上下文引用缺口`。 |
| 修复门禁 | file-anchor drift/context-only 场景继续显示不可直接采信和 `BLOCKED`，不会出现修复候选入口。 |
| 发布证据 | report evidence smoke marker 和真实 public repo UI smoke marker 输出 uncited primary/context gap 字段；release verifier 强校验 primary gap 为 0、context gap 为正数、`contextGapVisible` 与计数一致。 |
| 验证 | `validate-frontend-ui`、前端 build、`report-evidence-drawer` smoke、public repo live UI smoke、bash syntax、static security regression、`release-verifier-public-repo-ui-marker` focused suite、focused diff whitespace 均 PASS；拉里佩奇 / QA Engineer 二次复核 PASS。 |
| 公开仓库证据 | `projectId=371`、`repositoryId=332`、`scanTaskId=282`；`PUBLIC_REPO_UI_SMOKE_OK.realBackend=true`、`mockedApi=false`、viewports `1440x900 / 390x844 / 320x740`、`contextGapVisible=true`、`minUncitedContextEvidenceCount=7`、`minUncitedContextEvidenceFileCount=4`、`maxUncitedPrimaryEvidenceCount=0`。 |
| 边界 | 不改后端 coverage 计算、retrieval ranking、DB schema、真实 LLM provider、GitHub App 或 full release authority。 |

状态：GREEN for focused P6/P9 context gap visibility gate and public repo live UI smoke；full release authority 未刷新。

## 49. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Citation 可信度 | Markdown link destination、image destination 和 reference definition URL 中的假 `[C99]` 不再进入 Code QA citation audit。 |
| 可见文本保留 | 可见 link label 中的 `[C1]` 继续作为有效引用，nested visible label 和 destination parentheses 均有测试覆盖。 |
| 后端门禁 | `CodeQaControllerTest` 覆盖普通 link、nested label、URL parentheses、`[ref]: url` 和 `[ref]:url`。 |
| 验证 | `CodeQaControllerTest`、static security regression、focused diff whitespace 均 PASS；拉里佩奇 / QA Engineer 三轮复核 PASS。 |
| 边界 | Bounded single-line Markdown noise filter，不声明完整 Markdown parser；full release authority 未刷新。 |

状态：GREEN for focused P6 Markdown link citation noise filter；full release authority 未刷新。

## 50. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| code_chunks 检索可信度 | Hosted source browser/raw URL 在 evidence path 字段中会归一化为仓库内相对路径，减少同名文件 decoy 抢占第一结果。 |
| 报告证据兼容性 | 支持 `github.com/{owner}/{repo}/blob/main/...#Lx` 与 `raw.githubusercontent.com/{owner}/{repo}/main/...#Lx` 两类常见复制来源。 |
| 误判控制 | 普通 `path/url/location` 字段没有升级为 evidence anchor；字段白名单保持不变；host-aware 收紧后普通相对 `blob/main` 路径和未知 host 不按 GitHub/GitLab 规则剥离。 |
| 验证 | 新增同名 decoy backend 回归、host-aware parser 正负例；完整 parser/service focused tests、static security regression、focused diff whitespace 均 PASS；拉里佩奇 / QA Engineer 复核 PASS。 |
| 边界 | 不改 ranking 权重、DTO、DB schema、前端 UI、release evidence schema 或 GitHub App；full release authority 未刷新。 |

状态：GREEN for focused P6 hosted source URL evidence path normalization；full release authority 未刷新。

## 51. 2026-07-05 P6/P9/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 事实边界 | `来源定位可信度` 明确显示 `定位不证明事实正确`，避免把 anchor 绑定质量当成 LLM 事实背书。 |
| 前端证据 | `report-evidence-drawer` smoke 断言该提示可见，并输出 `deepEvidenceCardReadability.sourceLocationConfidence.llmFactBoundaryVisible=true`。 |
| 发布门禁 | `verify-release-evidence.sh` 强制 QA citation deep evidence marker 包含该字段；public repo sourceLocationReadability 未被错误扩大。 |
| 伪造防护 | `security-regression-check.sh` 接受合法 marker，并拒绝 missing / hidden 两类伪造 marker。 |
| 验证 | `validate-frontend-ui`、bash syntax、focused release verifier security suite、focused diff whitespace 和拉里佩奇 / QA Engineer 只读复核均 PASS。 |
| 边界 | 不证明 LLM 事实正确；事实正确性仍由 citation coverage、claim audit、证据角色和人工/后续自动复核共同约束。 |

状态：GREEN for focused P6/P9/P11 source location confidence LLM fact boundary；full release authority 未刷新。

## 52. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Report evidence 锚点 | `sourceUrl/source_url/sourceurl` 已纳入明确 evidence file path anchor 白名单。 |
| 检索可信度 | hosted `sourceUrl + lineNumber` 在同名 `ProjectDetail.tsx` decoy 场景下能把目标文件排第一。 |
| 误判控制 | 普通 `url/path/location` 没有升级为 evidence anchor；测试中普通 `url` 指向 decoy 仍不会压过 `sourceUrl` 目标。 |
| 验证 | `CodeLocationHintParserTest`、`CodeChunkServiceTest`、static security regression、focused diff whitespace 均 PASS；拉里佩奇 / QA Engineer 复核 PASS。 |
| 边界 | 任意复杂分支名 hosted URL 未扩展；full release authority 未刷新。 |

状态：GREEN for focused P6 report evidence sourceUrl/source_url alias parsing；full release authority 未刷新。

## 53. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Hosted URL 兼容性 | GitHub/GitLab/raw hosted source URL 现在支持 nested branch，如 `feature/code-review` 和 `release/2026/q3`。 |
| 检索可信度 | `sourceUrl` nested branch + `lineNumber` 在同名 `ProjectDetail.tsx` decoy 场景下目标文件排第一。 |
| 误判控制 | unknown host 不套用 hosted branch rules；相对 `modules/auth/blob/main/...` 保持原样；普通 `url/path/location` 不作为 evidence anchor。 |
| 验证 | `CodeLocationHintParserTest`、`CodeChunkServiceTest`、static security regression、focused diff whitespace 均 PASS；拉里佩奇 / QA Engineer 二轮复核 PASS。 |
| 边界 | strong-root-first heuristic 已缓解 generic root 分支名误剥离；仍有 strong root 分支名与源码根段重名歧义；full release authority 未刷新。 |

状态：GREEN for focused P6 hosted source URL nested branch normalization；full release authority 未刷新。

## 54. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Citation 可信度 | HTML comment 中的隐藏 `[C1]` 不再进入 Code QA citation audit。 |
| Claim audit | 只有 HTML comment 里存在 citation-like label 时，代码事实 claim 仍被判定为 `UNCITED`。 |
| 后端门禁 | 新增 `CodeQaControllerTest#codeQa_shouldIgnoreFakeCitationsInsideHtmlCommentsOnly`；`CodeQaControllerTest` 全量 focused controller suite PASS。 |
| QA 复核 | 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Anscombe / 019f3103-c702-7c72-b696-feba53bd396b`。 |
| 边界 | 不是完整 HTML sanitizer；full release authority 未刷新。 |

状态：GREEN for focused P6 HTML comment citation noise filter；full release authority 未刷新。

## 55. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Citation 可信度 | HTML tag 属性中的隐藏 `[C1]` 不再进入 Code QA citation audit。 |
| 可见文本保留 | 标签正文中的可见 `[C1]` 继续被识别为有效引用。 |
| 后端门禁 | 新增 attribute-only fake citation 和 visible tag text citation 两个 `CodeQaControllerTest` 回归；`CodeQaControllerTest` 全量 focused controller suite PASS。 |
| QA 复核 | 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Hubble / 019f310b-da0a-7223-b684-40cbf37c817e`。 |
| 边界 | 不是完整 HTML sanitizer；full release authority 未刷新。 |

状态：GREEN for focused P6 HTML tag attribute citation noise filter；full release authority 未刷新。

## 56. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Citation 可信度 | HTML `<script>` / `<style>` 块中的隐藏 `[C1]` 不再进入 Code QA citation audit。 |
| 可见文本保留 | script/style 块外的可见 `[C1]` 继续被识别为有效引用。 |
| 后端门禁 | 新增 script/style only fake citation 和 script/style 外 visible citation 两个 `CodeQaControllerTest` 回归；`CodeQaControllerTest` 全量 focused controller suite PASS。 |
| QA 复核 | 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Faraday / 019f3111-e402-7c71-822c-9d3536efe952`。 |
| 边界 | 不是完整 HTML/JS/CSS sanitizer；full release authority 未刷新。 |

状态：GREEN for focused P6 HTML script/style citation noise filter；full release authority 未刷新。

## 57. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Citation 可信度 | 可见 HTML entity bracket citation 现在可被识别，例如 `&#91;C1&#93;`。 |
| 覆盖范围 | decimal、hex、named bracket entity 均有正例覆盖。 |
| 误判控制 | tag attribute 和 Markdown link destination 中的 entity citation 仍不进入 audit。 |
| 后端门禁 | 新增 visible entity、attribute entity negative、link destination entity negative 三个 `CodeQaControllerTest` 回归。 |
| QA 复核 | 拉里佩奇 / QA Engineer 二轮只读复核 PASS，runtime `Kant` 与 `Noether`。 |
| 边界 | 不是完整 HTML entity decoder；full release authority 未刷新。 |

状态：GREEN for focused P6 HTML entity citation bracket handling；`CodeQaControllerTest`、static security regression、diff/rg checks PASS；full release authority 未刷新。

## 58. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | Backend database flow 问题会扩展 Controller / Service / Data Access 候选，提升跨文件证据池质量。 |
| 领域模型覆盖 | table/entity flow、中文“写表/读表”、常见中文 CRUD 链路词、明确中文读操作和受控响应载荷意图会额外扩展 Domain Model，让 Entity/Model 证据进入候选池。 |
| 前后端联动 | 前端动作到后端接口的 bridge 问法会补 `FRONTEND + CONTROLLER`；无“前端”字样但有明确 UI 动作表面，或“登录页调用哪个接口 / 详情页用哪个接口 / 登录页对应哪个接口 / 登录页面接口是什么 / 登录页接口在哪里 / 登录页面接口 / login page endpoint”这类受控页面关系问法，也可定位 UI 入口和后端接口入口。 |
| 误扩控制 | 普通 endpoint 定位仍保持 Controller-only。 |
| Method Anchor | `PaymentController#createPayment` 这类入口锚点加 backend flow 追问，仍会补齐 Mapper/Data Access 证据。 |
| 性能边界 | 新增检索测试证明 role intent/search 仍不生成 `content LIKE`。 |
| 后端门禁 | 新增 backend-flow role intent、Domain Model table-flow、中文写表、中文 CRUD、中文读操作、中文响应载荷意图、frontend-backend bridge、button endpoint bridge、中文页面短写/关系 bridge、method-anchor flow、plain endpoint negative、cross-layer retrieval、hot-path SQL 等 `CodeChunkServiceTest` 回归。 |
| Data/AI 复核 | 梁文峰 / Data-AI Engineer 只读复核 PASS_TO_IMPLEMENT，runtime `Curie`。 |
| 边界 | 不是调用图或 ORM/SQL 绑定；full release authority 未刷新。 |

状态：GREEN for focused P6 backend flow role intent retrieval；`CodeChunkServiceTest`、static security regression、diff/rg checks PASS；full release authority 未刷新。

## 59. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | citation 后中文逗号 + 转接词连接的第二个代码事实会被拆成独立 claim，避免被前一个 citation 覆盖。 |
| Claim audit | `AuthController handles login [C1]，此外 TokenRepository persists token data` 现在产生 1 个 `CITED` claim 和 1 个 `UNCITED` claim。 |
| 后端门禁 | 新增 `CodeQaControllerTest#codeQa_shouldSplitTransitionCodeFactsAfterChineseCommaCitation`；`CodeQaControllerTest` 全量和 static security regression PASS。 |
| 边界 | 不拆分所有逗号，只处理 citation 后明确转接词；full release authority 未刷新。 |

状态：GREEN for focused P6 transition claim split gate；`CodeQaControllerTest`、static security regression、diff/rg checks PASS；full release authority 未刷新。

## 60. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | 裸 `http(s)://` / `www.` URL、受控无 scheme domain URL，以及 `localhost` / IPv4 loopback / bracketed IPv6 loopback `::1` 本地 URL 中的假 `[C1]` 不再进入 Code QA citation audit；无 scheme domain/local URL 已覆盖 `/` / `?` / `#` 起始形态。 |
| 误判控制 | 正文真实 `[C1]` 保持有效；裸 URL 中的 `[C99]` 不会污染 invalid citation claim；`src/AuthService.java [C1]` 文件路径正文引用不会被误伤；`src/fixture.test/[C1]` 这类 domain-like 相对路径不会被 no-scheme domain URL 过滤从路径中间误剥离。 |
| 后端门禁 | 新增 `CodeQaControllerTest#codeQa_shouldIgnoreFakeCitationsInsideBareUrlsOnly`、`CodeQaControllerTest#codeQa_shouldKeepProseCitationReadyWhenInvalidCitationOnlyAppearsInsideBareUrl`、`CodeQaControllerTest#codeQa_shouldKeepFilePathCitationAuditableWhenDomainUrlNoiseIsFiltered` 和 `CodeQaControllerTest#auditableAnswerText_shouldKeepDomainLikeRelativePathCitationWhenUrlNoiseIsFiltered`。 |
| 边界 | 这是 bounded URL noise filter，不是完整 URL parser、HTML sanitizer 或 Markdown parser；full release authority 未刷新。 |

状态：GREEN for focused P6 URL citation noise filter；targeted `CodeQaControllerTest`、full `CodeQaControllerTest` 和安全二轮复核 PASS；full release authority 未刷新。

## 61. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 前端可读性 | 共享 `ActionButton` visible-label 默认支持换行、自适应高度和断词，不再依赖 `nowrap + ellipsis` 隐藏 action 文案。 |
| 低对比控制 | Primary ActionButton 既有白色文字强制规则保持；本轮只改变 label layout，不削弱 contrast fallback。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 auto-height、small hitbox、label wrap/no-ellipsis，并拒绝 `.sl-action-button-label` 回退到 `text-overflow:ellipsis + white-space:nowrap`；`app-shell-ui-smoke` 覆盖核心路由 primary button label 不裁切和无横向溢出。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核 PASS，未发现 dense table 或 icon-only 行为明显破坏风险。 |

状态：GREEN for focused P9 shared ActionButton readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 62. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 状态面可读性 | 共享 `StateBlock` root/copy/title/description/action 区补齐长文本和窄屏防溢出能力。 |
| 恢复动作 | `StateBlock` action row 支持 flex wrap，长 retry/action label 不再强行挤压单行。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 StateBlock root max-width/min-width、description wrap、action wrap，并拒绝 copy `nowrap/ellipsis` 与 action `nowrap/hidden/no-wrap flex` 回退。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Pasteur / 019f31a2-ff2e-7be0-8920-a2df0d5f5aa3`。 |

状态：GREEN for focused P9 shared StateBlock readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 63. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 元数据标签可读性 | 共享 `.sl-app-shell .ant-tag` 与 `.sl-app-shell .ant-badge-status-text` 补齐长状态、路径、证据标签和 task/scan 标识换行能力。 |
| 防裁切范围 | 规则限定在 app shell 内，覆盖业务页常见 Ant Tag/Badge，同时避免影响登录页之外的第三方独立渲染上下文。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Tag/Badge wrap/no-ellipsis 规则，并拒绝 Tag/Badge text 回退到 `nowrap` 或 `ellipsis`；standalone badge status text 覆盖已补 reject。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Pauli / 019f31ab-dd3d-7463-b6a0-d9754093c972`。 |

状态：GREEN for focused P9 shared Ant Tag/Badge readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 64. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Alert 可读性 | 共享 `.sl-app-shell .ant-alert`、content、message、description、action 区补齐长错误、路径、安全说明、证据说明和恢复动作换行能力。 |
| 恢复动作 | Alert action row 支持 flex wrap，继续配合 320px action full-width 规则，降低按钮挤压正文的风险。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Alert root/content/copy/action 规则，并拒绝 copy `nowrap/ellipsis/hidden` 与 action `nowrap/hidden/no-wrap flex` 回退。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核 PASS，runtime `Planck / 019f31b4-5ace-7142-ad85-05d53b8efeca`。 |

状态：GREEN for focused P9 shared Ant Alert readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 65. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 报告证据定位 | hosted source URL 复杂分支归一化现在保留 `app/src/...` 这类常见应用根目录，不再被复杂分支中的 `src` 片段截成过宽 `src/...`。 |
| 适配范围 | `app`、`apps`、`client`、`packages` 被作为受控应用容器 root 处理；`feature/app/src/...` 保守回退为 `src/...`，多段分支后的 `apps/client/src/...` 保留外层 `apps/client/...`，单段分支后的 `feature/apps/client/src/...` 保守降级为 `client/src/...`。 |
| 后端门禁 | 新增 app root 正例、branch 首段 app 反例、apps/client 嵌套 root 正例和单段 branch apps/client 保守降级测试；`CodeLocationHintParserTest` 全量和 sourceUrl decoy retrieval focused test PASS。 |
| 边界 | 这是 bounded hosted source URL heuristic；不等同于完整 Git provider URL parser，branch/root 同名歧义仍需后续结合仓库 file index 或 provider metadata 消除。 |

状态：GREEN for focused P6 hosted source URL app root normalization；QA review PASS；full release authority 未刷新。

## 66. 2026-07-05 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 候选集内消歧 | 当 parser 对 `feature/apps/client/src/...` 做保守降级时，`CodeChunkService` 现有排序已能在候选集中把真实 `apps/client/src/pages/Login.tsx` 排在 `client/src/pages/Login.tsx` decoy 前面。 |
| 回归门禁 | 新增 `CodeChunkServiceTest#listRetrievalCandidates_shouldUseHostedSourceUrlAppRootVariantBeforeAmbiguousSuffixDecoy`，锁住 raw hosted URL/path suffix 信号对 app-root target 的排序能力。 |
| 生产代码边界 | 本轮未改生产逻辑；测试通过说明现有生产路径已经具备该候选集内消歧能力。 |
| 剩余风险 | 该门禁不证明真实文件一定进入候选池，不替代后续 file index/provider metadata 或 SQL candidate expansion。 |

状态：GREEN for focused P6/P11 hosted source URL app-root candidate disambiguation gate；QA review PASS；full release authority 未刷新。

## 67. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 详情字段可读性 | 共享 `.sl-app-shell .ant-descriptions`、`.ant-descriptions-view`、item、label、content 补齐长 ID、路径、hash、URL、错误和审计详情换行能力。 |
| 防裁切范围 | 规则限定在 app shell 内，作为业务页 Ant Descriptions 的默认兜底，不影响登录页之外的第三方独立渲染上下文。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Descriptions root/item/label/content 规则，并拒绝单 selector/组合 selector 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `McClintock / 019f31d3-8c56-7bc2-95c2-170b2d8851f2`。 |

状态：GREEN for focused P9 shared Ant Descriptions readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 68. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 列表可读性 | 共享 `.sl-app-shell .ant-list`、list item、meta、title、description 和 action 区补齐长风险、路径、URL、证据摘要和 action 文案换行能力。 |
| 窄屏动作 | List action/action item 支持 flex wrap、normal white-space 和 visible overflow，配合既有 320px 全宽堆叠规则，降低行级按钮挤压正文的风险。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared List root/item/meta/title/description/action 规则，并拒绝 metadata/action/action item 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap`。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Mencius / 019f31de-7025-7a83-8ce6-91f9aef7558e`。 |

状态：GREEN for focused P9 shared Ant List readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 69. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 弹层可读性 | 共享 `.ant-modal-root` 下 Modal/Confirm root、content/header/body/footer、confirm body、title/content、form label/explain/input/select/textarea 和 button 补齐窄屏可读性兜底。 |
| Portal 范围 | Modal/Confirm 通过 Ant portal 挂在 body 下，本轮使用 `.ant-modal-root` 作为受控范围，不依赖 `.sl-app-shell`。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Modal/Confirm viewport containment、wrap/no-ellipsis/no-hidden 和 footer action wrap，并拒绝 form/button 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Peirce / 019f31e8-cb45-7cc2-8dec-0095c6cd2a8d`。 |

状态：GREEN for focused P9 shared Ant Modal/Confirm readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 70. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 卡片标题可读性 | 共享 `.sl-app-shell` 内 Ant Card root/head/head-wrapper/title/extra/body 补齐可收缩、长标题换行和 extra action 防裁切规则。 |
| 动作区 | Card extra 使用 flex wrap，title/extra 内 Space 和 Space item 可换行可收缩，降低状态标签和按钮挤压主体的风险。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Card header/title/extra/Space 规则，并拒绝 `nowrap`、`ellipsis`、`overflow:hidden` 和 Space `flex-wrap:nowrap` 回退。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核 PASS，runtime `Poincare / 019f31f2-31c1-75e0-ae2c-f2b8a1846b1d`。 |

状态：GREEN for focused P9 shared Ant Card Header readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 71. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Tabs 可读性 | 共享 `.sl-app-shell` 内 Ant Tabs root/nav/nav-wrap/nav-list/content/tabpane 和 tab label 补齐可收缩、长标签换行和防裁切规则。 |
| 报告页局部覆盖 | `.sl-report-tabs .ant-tabs-nav` 已从 `overflow:hidden` 改为 `overflow:visible`，横向滚动继续由 `.ant-tabs-nav-wrap` 承担。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Tabs 规则，并拒绝 tab label 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 report tabs nav 回退到 `overflow:hidden`。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Kierkegaard / 019f31f9-dfe5-7cc0-b94e-fa61af6563ab`。 |

状态：GREEN for focused P9 shared Ant Tabs readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 72. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Select 可读性 | 共享 `.sl-app-shell` 内 Ant Select root/selector/selected item/placeholder/multiple overflow/value tag 补齐可收缩、换行和防裁切规则。 |
| Portal 下拉层 | `.ant-select-dropdown` option root/content 补齐可收缩和长文本换行规则，适配项目、仓库、分支、模型和 provider 长标签。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Select 规则，并拒绝 selected item、placeholder、multiple overflow 和 dropdown option 通过直接 selector、组合 selector 或更具体 selector 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap`。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Nietzsche / 019f3202-e185-7ff2-9a87-7ad393a826bc`。 |

状态：GREEN for focused P9 shared Ant Select readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 73. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Form 文案可读性 | 共享 `.sl-app-shell` 内 Ant Form root/item/row/label/control/explain/extra 补齐可收缩规则，label、校验错误和 extra/help 支持长文本换行。 |
| 输入行为边界 | Modal 和 AutoRepair 旧规则已把 `.ant-input` / `textarea` 从可读性文本换行组中移出，只保留 max/min width，避免强行改变编辑文本行为。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Form 规则，并拒绝 label/explain/extra 通过直接 selector、组合 selector、更具体 selector 或 `!important` 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Popper / 019f320c-07cf-7bf0-a0b2-eaf9e1629652`。 |

状态：GREEN for focused P9 shared Ant Form label/help readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 74. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Space 可读性 | 共享 `.sl-app-shell` 内 Ant Space root/item 补齐可收缩规则，普通 horizontal Space 允许 wrap，item 支持长标签、证据和 action 文案换行。 |
| Compact 边界 | 共享 wrap 规则限定为 `:not(.ant-space-compact)`，validator 用 selector-block 判断显式跳过真实 compact selector，避免误改输入组合行为。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Space 规则，并拒绝普通 Space 通过直接、重复或更具体 selector 回退到 `flex-wrap:nowrap`，同时拒绝 Space item `nowrap`、`ellipsis` 或 `overflow:hidden`。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Godel / 019f3215-c772-71b0-bdf5-5b4dee37a093`。 |

状态：GREEN for focused P9 shared Ant Space action-row readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 75. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Typography/code 可读性 | 共享 `.sl-app-shell` 内 Ant Typography、inline code 和 pre 补齐可收缩、长路径/hash/命令/错误/证据引用换行和 pre 滚动兜底规则。 |
| 表格边界 | 本轮没有对所有 `.ant-typography` 强制取消 ellipsis，保留表格列业务级 `ellipsis:true` 和页面级策略边界。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Typography/code/pre 规则，并拒绝 code/pre 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。 |
| Smoke 稳定性 | Project next action dark-surface disabled button 禁用 disabled 态 transition，避免动态 disabled 切换后读取颜色中间值。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核 PASS，runtime `Hypatia / 019f321f-5ea8-7c41-9cf5-0d799f3da124`。 |

状态：GREEN for focused P9 shared Ant Typography code/pre readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 76. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Pagination 可读性 | 共享 `.sl-app-shell` 内 Ant Pagination 补齐可收缩、换行和 visible overflow 规则，降低表格底部分页器横向溢出风险。 |
| 分页控件 | Total text、page controls、options、page-size selector 和 quick jumper 可收缩；total/quick jumper 支持长文本换行。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Pagination 规则，并通过 selector-block 级检查拒绝 Pagination root、total、页码、prev/next/jump、options、size changer 和 quick jumper 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 no-wrap。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Euclid / 019f322a-c9ee-7973-adb6-6f28b3212993`。 |

状态：GREEN for focused P9 shared Ant Pagination readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 77. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Drawer 可读性 | 共享 Ant Drawer content wrapper 受 viewport 约束，content/header/body/footer/header-title/title/extra 可收缩，降低抽屉窄屏越界和标题裁切风险。 |
| 动作区 | Drawer extra、extra Space、footer 和 action button 允许 flex wrap，长 action 文案不再默认被挤压或裁切。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Drawer 规则，并通过 selector-block 级检查拒绝 width containment 被关闭，或 header/header-title/title/extra/footer/action 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 no-wrap。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Kuhn / 019f3235-6fdf-7ac3-88f1-9f2eca4d5a11`。 |

状态：GREEN for focused P9 shared Ant Drawer readability；frontend validator、build、Drawer focused smoke、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 78. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Empty fallback 可读性 | `.sl-app-shell` 与 `.ant-select-dropdown` 内 Ant Empty fallback 可收缩，description 支持长说明换行。 |
| 空态边界 | 核心产品空态仍由 StateBlock 承载，既有 raw Ant Empty 禁用策略保持；本轮只治理内部/portal fallback。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 Empty fallback 规则，并拒绝 description/footer 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 no-wrap。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核 PASS，runtime `Schrodinger / 019f3241-edee-7e63-ba43-e3fa822df7c8`。 |

状态：GREEN for focused P9 shared Ant Empty fallback readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 79. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Menu/Dropdown 可读性 | 展开侧栏、移动抽屉导航和用户 Dropdown 的 Menu/Dropdown 标签支持长文本换行。 |
| 导航边界 | 不改变路由、权限、账号动作或菜单数据结构；不强行展开 collapsed sider。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 Menu/Dropdown 规则，并拒绝 label 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核 PASS，runtime `Hegel / 019f324d-bd3f-7d80-bf41-cccda0cd42f6`。 |

状态：GREEN for focused P9 shared Ant Menu/Dropdown readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 80. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Tooltip/Popover 可读性 | Tooltip、Popover 和 Popconfirm portal 受 viewport 约束，长说明、风险摘要和确认描述可换行。 |
| 确认动作边界 | Popconfirm buttons 支持换行；本轮不改变确认/取消逻辑、AutoRepair PR gate 或 PATCH_READY smoke 合同。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 Tooltip/Popover/Popconfirm 规则，并拒绝文案回退到 `nowrap`、`ellipsis`、`overflow:hidden`，同时拒绝 scoped Popconfirm buttons/button label 回退。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Banach / 019f3257-62e0-75b3-ad28-632a0777b18e`；首轮 PARTIAL 要求补强 scoped Popconfirm button override 门禁，已修复。 |

状态：GREEN for focused P9 shared Ant Tooltip/Popover/Popconfirm readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 81. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Message/Notification 可读性 | Ant Message 和 Notification portal 受 viewport 约束，长 API 错误、请求 ID 和操作反馈可换行。 |
| 反馈边界 | 不改变触发位置、持续时间、业务文案、API 错误格式、redaction 策略或请求逻辑。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 Message/Notification 规则，并拒绝文案回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 notification action no-wrap。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核 PASS，runtime `Sagan / 019f3263-5d52-7280-9a95-e3efcd95839c`；确认 API 错误格式、AgentChat redaction、触发位置和业务文案未改变。 |

状态：GREEN for focused P9 shared Ant Message/Notification readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 82. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Progress 可读性 | Ant Progress root/line/outer/inner 可收缩，progress text 支持长状态和百分比换行。 |
| 进度逻辑边界 | 不改变百分比计算、状态映射、颜色、动画、showInfo 配置或页面数据请求。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 Progress 规则，并拒绝任意 scoped progress text 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。 |
| 产品复核 | 雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核 PASS，runtime `Einstein / 019f326c-33c0-7a51-838a-cebd09a401da`；首轮 PARTIAL 要求补强任意 scoped progress text override 门禁，已修复。 |

状态：GREEN for focused P9 shared Ant Progress readability；frontend validator、build、app-shell UI smoke 和产品/前端复核 PASS；full release authority 未刷新。

## 83. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Timeline 可读性 | 共享 Ant Timeline root/item 可收缩，content/label 支持长步骤标题、错误、证据说明、路径和 URL 换行。 |
| 审计边界 | 不改变 TaskTimeline raw output safety notice、步骤数据、状态映射、AutoRepair attempt 逻辑或治理时间线聚合。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Timeline 规则，并拒绝任意 scoped Timeline content/label 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。 |
| 产品复核 | 拉里佩奇 / QA Engineer + 雷军 / Product Design 只读复核 PASS，runtime `James / 019f327c-31c2-73c2-8682-14207c2131b5`；确认 CSS/validator/raw output safety/document boundary 均合格。 |

状态：GREEN for focused P9 shared Ant Timeline readability；frontend validator、build、app-shell UI smoke 和 QA/Product review PASS；full release authority 未刷新。

## 84. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Input 可收缩性 | 共享 Ant Input、TextArea、Input.Search、InputNumber、affix/group/number wrapper 可收缩，降低仓库 URL、分支、路径、token、搜索词和数值输入撑破布局风险。 |
| 输入行为边界 | 不改变真实 input、password、number、textarea 的编辑文本行为、输入值、placeholder 或表单校验。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Input 规则，并拒绝容器关闭 containment、容器/affix/addon hidden 裁切、addon 文案 nowrap/ellipsis 回退。 |
| 产品复核 | 拉里佩奇 / QA Engineer + 雷军 / Product Design 二轮只读复核 PASS，runtime `Epicurus / 019f3284-bb57-7d22-83f8-7da9cc6e46d3`；首轮 PARTIAL 要求补强编辑行为保护、search action 防回退和 scoped addon 门禁，修复后二轮 PASS。 |

状态：GREEN for focused P9 shared Ant Input readability；frontend validator、build、app-shell UI smoke 和 QA/Product review PASS；full release authority 未刷新。

## 85. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Typography 普通文本可读性 | 非 `.ant-typography-ellipsis` 的普通 Typography 支持长标题、状态、说明、证据摘要和治理说明换行。 |
| 业务 ellipsis 边界 | 显式 `.ant-typography-ellipsis`、表格列省略策略、模型 URL/审计/产物局部单元格策略保留。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Typography 规则，并拒绝非 ellipsis Typography 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。 |
| 产品复核 | 拉里佩奇 / QA Engineer + 雷军 / Product Design 二轮只读复核 PASS，runtime `Harvey / 019f328f-a17d-7731-865b-3127671858f9`；首轮 BLOCK 要求修复 Typography specificity 和 validator `:not(.ant-typography-ellipsis)` 漏检，修复后二轮 PASS。 |

状态：GREEN for focused P9 shared Ant Typography readable text；frontend validator、build、app-shell UI smoke 和 QA/Product review PASS；full release authority 未刷新。

## 86. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Table containment | 共享 Ant Table wrapper/table/container/content/body/spin 可收缩，content/body 负责横向滚动，降低表格撑破 app shell 风险。 |
| 单元格可读性 | 非 `.ant-table-cell-ellipsis` 单元格支持长项目、任务、审计、产物、错误文本换行。 |
| 业务 ellipsis 边界 | 显式 `.ant-table-cell-ellipsis`、`scroll.x`、固定列和页面级 scroller containment 不被本轮共享规则替换。 |
| 浏览器级证明 | `app-shell-ui-smoke` 已覆盖 320px Projects 非 ellipsis cell 长 token 不裁切，以及 ModelConfig API 地址 `.ant-table-cell-ellipsis` / Typography 继续保持 hidden + ellipsis + nowrap。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Table 规则、app-shell smoke 执行和 marker，并通过 `selectorHasPositiveClass` 避免把 `:not(.ant-table-cell-ellipsis)` 误判为正向 ellipsis 命中。 |
| 产品复核 | 拉里佩奇 / QA Engineer + 雷军 / Product Design 只读复核 PASS，runtime `Herschel / 019f329f-0c16-72e0-8eac-a11e77252eb4`；无必须修复项。 |

状态：GREEN for focused P9 shared Ant Table readability / ellipsis boundary；frontend validator、build、app-shell UI smoke 和 QA/Product review PASS；full release authority 未刷新。

## 87. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Radio 可读性 | 共享 Ant Radio/Radio.Button group、wrapper、button wrapper 和 label span 可收缩，长视图模式标签支持换行。 |
| DependencyGraph 浏览器级证明 | batch4B smoke 在图谱失败恢复后注入长 Radio.Button 标签，并覆盖 1440px 与 320px 下不裁切、不横向溢出。 |
| 业务边界 | 不改变 DependencyGraph 视图切换逻辑、Mermaid 导出、图谱数据、API/DTO、后端或 release evidence schema。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Radio 规则，并拒绝 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 回退。 |
| 产品复核 | 拉里佩奇 / QA Engineer + 雷军 / Product Design 二轮只读复核 PASS，runtime `Euler / 019f32b6-cc2e-74e2-9903-62e6a9264850`；首轮 PARTIAL 指出 group 级反向门禁缺口，已补 `ant-radio-group` 扫描后二轮 PASS。 |

状态：GREEN for focused P9 shared Ant Radio readability；frontend validator、build、DependencyGraph batch4B UI smoke 和 QA/Product review PASS；full release authority 未刷新。

## 88. 2026-07-05 P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Collapse 可读性 | 共享 Ant Collapse root/item/header/header text/extra/content/content box 可收缩，长日志标题、路径、错误和证据摘要支持换行。 |
| AutoRepair 浏览器级证明 | PATCH_READY smoke 在 AutoRepair 详情中打开日志 Collapse，注入长 header token，并覆盖 1440px、390px 与 320px 下不裁切、不横向溢出。 |
| 业务边界 | 不改变 AutoRepair 日志内容、LogViewer/DiffViewer 脱敏策略、PR 创建门禁、执行任务 attempt 逻辑、API/DTO、后端或 release evidence schema。 |
| 防回退门禁 | `validate-frontend-ui.mjs` 锁定 shared Collapse 规则，并拒绝 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 回退。 |
| 产品复核 | 拉里佩奇 / QA Engineer + 雷军 / Product Design 只读复核 PASS，runtime `Popper the 2nd / 019f32c2-c456-7033-b512-ed3d54d185ed`；确认 CSS、validator、PATCH_READY smoke 和文档边界均合格。 |

状态：GREEN for focused P9 shared Ant Collapse readability；frontend validator、build、PATCH_READY browser smoke 和 QA/Product review PASS；full release authority 未刷新。

## 89. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA 引用可信度 | Code QA 现在过滤 `ftp/sftp/ssh/git/file/mailto/data/blob/javascript/vscode/idea` 常见 URI 中的 citation-like token，避免 URI 内 `[C1]` 把未引用回答伪装成 grounded。 |
| 正文引用边界 | `src/AuthService.java ... [C1]` 这类源码路径正文引用仍保持可审计，不被 common URI filter 误伤。 |
| 后端回归 | `CodeQaControllerTest` 覆盖 fake-only URI 噪声和正文有效引用 + URI `[C99]` 噪声混合场景；70 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Mendel the 2nd / 019f32cb-b195-70c1-9335-1879702055ff`；非阻塞 scheme 覆盖建议已补齐并复测通过。 |

状态：GREEN for focused P6 Code QA common URI citation noise filter；full release authority 未刷新。

## 90. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| CONFIG 意图召回 | `CodeChunkRanker.roleIntentTypes(...)` 新增 bounded CONFIG intent，覆盖 CORS、`application.yml`、datasource、环境变量、数据库配置和 Spring Boot runtime config。 |
| 误召回边界 | 泛化英文 `config/configuration/configs` 只有存在 runtime/server/backend/spring/database/port/security/jwt/credential 等上下文才触发；`模型配置页按钮`、`model config page button`、`ModelConfig page` 不触发 CONFIG。 |
| content LIKE 边界 | `CodeChunkService` 的 CONFIG role query 只基于 `file_path`，不恢复 `content LIKE`。 |
| 后端回归 | `CodeChunkServiceTest` 覆盖 README 与 frontend `ModelConfig.tsx` 噪声干扰场景，证明 `application.yml` 可通过 role intent 补召回且 SQL 不含 `content LIKE`；103 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 runtime `Tesla the 2nd / 019f32d8-496b-7ee0-a54f-8b0950d719df` 首轮 `PARTIAL`，指出英文 `config` 过宽；已收窄并复测通过。 |

状态：GREEN for focused P6 code_chunks CONFIG role-intent recall；full release authority 未刷新。

## 91. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| TEST 意图召回 | `CodeChunkRanker.roleIntentTypes(...)` 新增 bounded TEST intent，覆盖测试文件、测试用例、单元测试、集成测试、回归测试、冒烟测试、Playwright/JUnit/Surefire/spec/test file 等定位语义。 |
| DOCUMENTATION 意图召回 | 新增 bounded DOCUMENTATION intent，覆盖 README、CHANGELOG、docs、runbook、项目文档、接口文档、部署/运行/设计/说明文档等项目文档定位语义。 |
| 判型顺序修复 | `/test/`、`/tests/`、`*Test*`、`*Spec*` 现在优先判为 TEST，避免 `AuthServiceTest.java` 因 `Service` 片段误判为 SERVICE。 |
| 误召回边界 | `latest/contest/protest`、中文“测试一下登录接口/登录页测试按钮”、`document parser service`、`uploaded document file`、`document file parser` 和“用户上传 document 文件”不触发 TEST/DOCUMENTATION。 |
| content LIKE 边界 | `CodeChunkService` 的 TEST/DOCUMENTATION role query 只基于 `file_path`，不恢复 `content LIKE`。 |
| 后端回归 | `CodeChunkServiceTest` 覆盖源码/文档噪声下测试文件补召回、源码/配置噪声下 README 补召回、正负 intent 边界和 SQL 不含 `content LIKE`；107 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 runtime `Wegener the 2nd / 019f32e5-27aa-7381-96e8-a3e8a9356c42` 首轮 `PARTIAL`，指出 `endsWith(test)` 与 `document file` 误召回口子；已收窄并复测通过。 |

状态：GREEN for focused P6 code_chunks TEST / DOCUMENTATION role-intent recall；full release authority 未刷新。

## 92. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| search/count 一致性 | `countSearchMatches(...)` 在存在 role/path/method/evidence 辅助召回信号时复用 `searchChunks(...)` 的候选池来源，并按 `chunkKey` 去重计数，避免 `total=0` 但 `items>0`。 |
| 普通查询性能边界 | 普通关键词查询继续走 `selectCount(buildKeywordSearchWrapper(...))` 快路径；测试锁定 `never().selectList(...)`。 |
| content LIKE 边界 | keyword、role、path、method、evidence 候选仍只查 `file_path`，不恢复 `content LIKE`。 |
| 后端回归 | `CodeChunkServiceTest` 覆盖空 query count、普通关键词快路径、TEST role-intent keyword miss 但 role candidate 命中时 count 包含候选；109 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 runtime `Kepler the 2nd / 019f32f1-84df-7111-ac88-c0be256fcf29`，结论 PASS。 |

状态：GREEN for focused P6 code_chunks search/count consistency；full release authority 未刷新。

## 93. 2026-07-05 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| retrieval metadata | `CodeChunkController` 现在会识别 role/path/method/evidence 辅助结构信号，命中时返回已有合同内的 `HYBRID`，不再把结构辅助召回误标为普通 `KEYWORD`。 |
| 合同兼容 | 未新增陌生枚举；`HYBRID` 已被 release verifier allowlist、前端 `retrievalModeLabel(...)` 和 `CodeEvidenceProfileService` 支持。 |
| 普通路径边界 | plain keyword 命中仍返回 `KEYWORD`；空 query 仍为 `STABLE_FALLBACK`；无切片仍为 `NO_CONTEXT`；非成功扫描仍为 `NO_SCAN`。 |
| 后端回归 | `CodeChunkControllerTest` 新增 TEST role-intent 查询返回 `HYBRID` 和 evidence profile “混合召回”断言；`CodeChunkServiceTest` 保持普通 count 快路径与辅助召回一致性。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，spawn runtime `James the 2nd / 019f32fa-43d2-7442-aad8-9132a187285c`，子 agent 自报 runtime `Codex`；无必须修复项。 |

状态：GREEN for focused P6 code_chunks HYBRID retrieval metadata；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 94. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| line-hint metadata | file:line、source URL line 和 JSON evidence line 这类带搜索上下文的行级定位会参与 `hasAuxiliarySearchHints(...)`，controller 返回 `HYBRID`。 |
| false-positive control | 中文行号解析收紧为必须是 `第 N 行`；`生成 85 行代码`、`85行代码` 不再被当成定位锚点。 |
| fallback boundary | 纯 `line 85` / `第85行` 没有文件、方法、路径、evidence 或关键词上下文时，不触发 `HYBRID`；controller 对无有效 token 的非空查询返回 `STABLE_FALLBACK`。 |
| 后端回归 | `CodeLocationHintParserTest`、`CodeChunkServiceTest`、`CodeChunkControllerTest` 覆盖 parser 负例、service 辅助信号边界、source URL line `HYBRID` 和纯 line query `STABLE_FALLBACK`。 |
| 岗位复核 | 首轮拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer `PARTIAL`，runtime `Euclid the 2nd / 019f3302-9a22-7790-95a3-76cffe304eeb`；指出纯 line query、中文行数误判和 controller 覆盖缺口。已修复后二轮 `PASS`，runtime `Lagrange the 2nd / 019f3307-250a-7c30-abe6-19d333108abb`。 |

状态：GREEN for focused P6 code_chunks line-hint HYBRID metadata boundary；focused backend tests and QA/Data-AI second review PASS；full release authority 未刷新。

## 95. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| endpoint route 召回 | `CodeLocationHintParser.endpointRouteHints(...)` 支持 `/api/...`、hosted API URL 和带 endpoint/接口上下文的短 route，并排除 source URL、本机绝对路径和无上下文 `/login`。 |
| code_chunks 排序 | `CodeChunkService` 为 endpoint route 查询补召回 controller/api 文件路径候选；`CodeChunkRanker` 在内存排序阶段把真正声明 `/api/auth/login` 的 Controller 排到 API client 和其他 controller 前。 |
| content LIKE 边界 | endpoint route candidate pool 只基于 `file_path`，focused test 断言 SQL 不含 `content LIKE`。 |
| 后端回归 | `CodeLocationHintParserTest` 覆盖 route hint 正负例；`CodeChunkServiceTest` 覆盖纯 `/api/auth/login` 查询补召回目标 Controller；focused backend suite 173 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Hume the 2nd / 019f3314-23bd-74c3-ad9c-2028c803c625`；确认无必须修复项。 |

状态：GREEN for focused P6 code_chunks endpoint route hint recall；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 96. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Spring 组合路由 | `CodeChunkRanker` 现在识别同一 chunk 内 class-level `@RequestMapping("/api/auth")` + method-level `@PostMapping("/login")`，让 `/api/auth/login` 查询优先定位真实 Controller。 |
| 误组合边界 | prefix 必须出现在 class/interface/record 声明前，suffix 必须出现在类声明后；两个无父子关系的方法级 mapping、方法级 `@RequestMapping(prefix)` + 后续 mapping 不会误组合。 |
| content LIKE 边界 | 组合 route 只影响已取回 chunk 的内存排序，不改变候选池 SQL；测试继续断言 SQL 不含 `content LIKE`。 |
| 后端回归 | `CodeChunkServiceTest` 覆盖组合 route 正例、两个方法级 mapping 负例、方法级 `@RequestMapping` 负例和 exact route baseline；focused backend suite 176 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 三轮复核，runtime `Raman the 2nd / 019f331b-f358-7c10-8f9e-57e1ec6c5715`；二轮 `PARTIAL` 已打回修复，三轮 PASS。 |

状态：GREEN for focused P6 code_chunks Spring composed route recall；backend focused tests and QA/Data-AI third review PASS；full release authority 未刷新。

## 97. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| path variable route template | `CodeChunkRanker` 现在支持单段 `{id}` path variable template，让 `/api/users/42` 可命中 `@GetMapping("/api/users/{id}")`。 |
| composed template route | class-level `@RequestMapping("/api/users")` + method-level `@GetMapping("/{id}")` 可被组合命中，仍要求 prefix 在 class/interface/record 声明前。 |
| false-positive control | segment count 不一致不命中，例如 `/api/users/42/details` 不会命中 `/api/users/{id}`。 |
| content LIKE 边界 | direct/composed template route 查询只影响内存排序与 bounded candidate pool，测试断言 SQL 不含 `content LIKE`。 |
| 后端回归 | `CodeChunkServiceTest` 新增 direct template、composed template、segment count mismatch 三个回归；P6 backend suite 179 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 二轮复核，runtime `Jason the 2nd / 019f332c-44c7-7920-88bf-b492fcf71b52`；首轮 `PARTIAL` 已按要求补文档边界和 composed template SQL 断言，二轮 PASS。 |

状态：GREEN for focused P6 code_chunks Spring path variable route template recall；backend focused tests and QA/Data-AI second review PASS；full release authority 未刷新。

## 98. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| template specificity | `CodeChunkRanker` 将 route template matching 从 boolean 提升为 specificity score，literal segment 权重大于 path variable segment。 |
| 泛模板压制 | `/api/users/{id}` 现在优先于 `/api/{resource}/{id}`，避免 fallback Controller 抢走具体 Controller。 |
| 边界保持 | segment count mismatch 仍不命中，composed template route 仍要求 class-level prefix 在 class/interface/record 声明前。 |
| content LIKE 边界 | specific-vs-generic template 回归继续断言 SQL 不含 `content LIKE`。 |
| 后端回归 | 新增 `searchChunks_shouldPreferMoreSpecificPathVariableTemplateOverGenericTemplate`；P6 backend suite 180 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Erdos the 2nd / 019f3334-90bc-7f12-b387-1f41f7753fd9`。 |

状态：GREEN for focused P6 code_chunks Spring path variable template specificity ranking；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 99. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| exact route priority | `CodeChunkRanker` 新增 Spring exact literal route scoring，让 `/api/users/me` 优先于 `/api/users/{id}`。 |
| client-vs-controller | frontend API client 的 exact string 不会抢走后端 exact Controller。 |
| same-class boundary | composed route suffix mapping 必须落在当前 class declaration 后、下一个 class/interface/record declaration 前，防止同一 chunk 多 class 跨类误组合。 |
| 回归覆盖 | 新增 exact-vs-template 回归，以及 exact/path-variable 两个 multi-class cross-composition 负例。 |
| 后端验证 | focused tests 5 tests PASS；P6 backend suite 183 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 二轮复核，runtime `Feynman the 2nd / 019f333a-f098-71d3-83f2-69941b8aa1bc`；首轮 `PARTIAL` 已修复，多 class 边界后二轮 PASS。 |

状态：GREEN for focused P6 code_chunks exact Spring route priority over path-variable template；backend focused tests and QA/Data-AI second review PASS；full release authority 未刷新。

## 100. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Spring mapping parser | `springMappingLiterals(...)` 现在遍历 mapping annotation 参数内字符串 literal，不再只取第一个字符串。 |
| route 属性过滤 | `isRouteMappingLiteral(...)` 只允许隐式 value、`value`、`path`，排除 `name/produces/consumes/headers/params`。 |
| 数组 route | `path={...}` / `value={...}` 中后续 route literal 可参与 exact/template matching。 |
| false-positive control | scalar `name/produces`、`produces` 数组、`headers` 数组和 composed `name+name` 均有负例。 |
| 后端验证 | focused tests 8 tests PASS；P6 backend suite 191 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 三轮复核，runtime `Kuhn the 2nd / 019f3343-b1df-7690-8755-add59741fb9d`；两轮 `PARTIAL` 已修复，三轮 PASS。 |

状态：GREEN for focused P6 code_chunks Spring mapping value/path multi-literal route parsing；backend focused tests and QA/Data-AI third review PASS；full release authority 未刷新。

## 101. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| route 常量解析 | `springRouteConstants(...)` 提取同一 chunk 内简单 `String NAME = "/route"` 常量。 |
| annotation 常量引用 | `springMappingLiterals(...)` 在隐式 value、`value`、`path` 位置解析常量引用。 |
| composed route | class-level + method-level 常量 route 可组合，并继续受 same-class boundary 约束。 |
| false-positive control | `name` / `produces` 常量不会被当 endpoint。 |
| 后端验证 | focused tests 6 tests PASS；P6 backend suite 195 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Einstein the 2nd / 019f334e-e4b9-77e3-968f-0421463710a7`。 |

状态：GREEN for focused P6 code_chunks same-chunk Spring route constants；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 102. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| route 拼接解析 | `CodeChunkRanker` 现在支持同一 chunk 内简单 `+` route 拼接，例如 `USER_ROOT + "/me"` 和 `API_ROOT + "/users"`。 |
| 片段误命中控制 | 拼接表达式内部的常量/字符串片段不再额外注册为独立 Spring route；无法完整解析的拼接表达式不部分命中。 |
| Controller 弱信号边界 | Controller 中普通 route-looking 字符串常量不再作为强 endpoint route；只有 Spring annotation 解析出的 route 才拿 Controller 强加权。 |
| false-positive control | `produces` 拼接、拼接片段 `/api/users`、class prefix 片段 `/api` 和未解析拼接均有负例。 |
| 后端验证 | focused tests 7 tests PASS；P6 backend suite 202 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Huygens the 2nd / 019f3354-e5f1-78b3-b9a1-2751407122a9`；复核建议的 Controller 普通常量保护测试已补。 |

状态：GREEN for focused P6 code_chunks same-chunk simple Spring route concatenation；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 103. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| route 常量表达式 | `springRouteConstants(...)` 现在先收集同一 chunk 内 String 常量声明，再有界迭代解析常量链。 |
| 常量链召回 | `API_ROOT + "/users"`、`USER_ROOT + "/me"` 可解析为完整 route，direct 和 composed Spring route 均可命中。 |
| fail-closed 边界 | `API_ROOT + dynamicSuffix()`、方法调用或未解析片段不会部分命中；最终结果必须以 `/` 开头。 |
| false-positive control | `produces` 常量表达式不作为 endpoint；非 route 属性仍受 value/path 门禁。 |
| 后端验证 | focused tests 6 tests PASS；P6 backend suite 206 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Goodall the 2nd / 019f3366-79cf-7a52-abd5-560075ece19b`；确认无必须修复项。 |

状态：GREEN for focused P6 code_chunks same-chunk Spring route constant expressions；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 104. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 常量作用域 | `springRouteConstantsForAnnotation(...)` 现在按 mapping annotation 关联 class 范围解析常量，无 class range 时 fail-closed。 |
| class 查找 | `classDeclarationIndex(...)` / `classDeclarationIndexBefore(...)` 改为轻量 scanner，跳过注释、字符串和 fake `class`。 |
| false-positive control | 同一 chunk 多 class 的同名 `USER_ROOT` / `USER_ME` 不再跨 class 污染 route matching。 |
| class-level 容错 | mapping 与 class 之间允许注释、额外 annotation 和 modifier。 |
| 后端验证 | focused tests 9 tests PASS；P6 backend suite 213 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 三轮复核，runtime `Cicero the 2nd / 019f336e-ffb1-7380-9c8e-85b808452572`；前两轮 `PARTIAL` 已修复，三轮 PASS。 |

状态：GREEN for focused P6 code_chunks Spring route constant class-scope isolation；backend focused tests and QA/Data-AI third review PASS；full release authority 未刷新。

## 105. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Kotlin route constants | `CodeChunkRanker` 现在支持 Kotlin Spring Controller 内同 class chunk 的 `const val` / `val` route constants。 |
| uppercase identifiers | Java/Kotlin route constant 声明和 annotation 常量引用均支持 `API_ROOT` / `USER_ME` 这类大写标识符。 |
| Kotlin type annotation | Kotlin `val USER_ME: String = API_ROOT + "/users/me"` 可解析，仍通过 bounded constant-expression resolver 完整解析后才进入 route matching。 |
| false-positive control | `produces = [JSON_MEDIA]` 不会作为 endpoint；route 常量仍只在隐式 value、`value`、`path` 属性门禁内生效。 |
| 后端验证 | focused tests 6 tests PASS；P6 backend suite 219 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 二轮复核，runtime `Banach the 2nd / 019f337c-980b-7ac1-9df5-dc677cb86bad`；首轮 `BLOCK` 已修复后二轮 PASS。 |

状态：GREEN for focused P6 code_chunks Kotlin Spring route constants；backend focused tests and QA/Data-AI second review PASS；full release authority 未刷新。

## 106. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| array route expressions | `springRouteExpressions(...)` 支持 `value/path = { ... }` 和 Kotlin `value/path = [ ... ]` 中的逐元素 route expression。 |
| constant concatenation | 数组内 `USER_ROOT + "/me"` 可解析为完整 `/api/users/me` route。 |
| fragment suppression | 数组内拼接表达式的 `USER_ROOT`、`"/me"` 不会被额外注册为独立 endpoint。 |
| false-positive control | `produces` 数组常量仍不进入 route matching；SQL 断言继续拒绝 `content LIKE`。 |
| 后端验证 | focused tests 5 tests PASS；P6 backend suite 222 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Hubble the 2nd / 019f338d-db8e-7ba2-a096-53d0dccbbc71`。 |

状态：GREEN for focused P6 code_chunks Spring value/path array route expressions；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 107. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| shorthand arrays | `springRouteExpressions(...)` 无 `=` 分支支持 implicit value array，例如 `@GetMapping({ USER_ROOT + "/me" })`。 |
| route expression | shorthand array 内 `USER_ROOT + "/me"` 可解析为完整 `/api/users/me` route。 |
| fragment suppression | shorthand array 内拼接片段 `USER_ROOT`、`"/me"` 不会被额外注册为独立 endpoint。 |
| content LIKE 边界 | 本轮不改 DB 查询，P6 suite 继续证明 code_chunks route recall 不恢复 `content LIKE`。 |
| 后端验证 | focused tests 6 tests PASS；P6 backend suite 225 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Russell the 2nd / 019f3394-f7e6-77b1-9993-7e2d32e17987`。 |

状态：GREEN for focused P6 code_chunks Spring shorthand array route expressions；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 108. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| cross-chunk context | endpoint route 查询启用 previous same-file candidate context ranking。 |
| route composition | 前一同文件 chunk 的 `@RequestMapping("/api/users")` 可与当前 chunk 的 `@GetMapping("/{id}")` 临时合成参与 scoring。 |
| return contract | 合成 chunk 只用于评分，返回仍是原始 current chunk。 |
| false-positive control | 前一 prefix + 当前 `/summary` 不会误命中 `/api/users/42`；SQL 断言继续拒绝 `content LIKE`。 |
| 后端验证 | focused tests 4 tests PASS；P6 backend suite 227 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Gibbs the 2nd / 019f339d-e605-7aa2-96d0-d5a25ee81bd3`。 |

状态：GREEN for focused P6 code_chunks previous same-file Spring route context；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 109. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| adjacent context pull | endpoint route 查询新增 previous same-file context candidate pull。 |
| bounded query | 单次 previous query，最多前 32 个 seeds，LIMIT 受 `RANKING_CANDIDATE_MAX_LIMIT` 保护。 |
| structural only | previous query 只用 `scan_task_id`、`file_path`、`start_line` 结构字段，不使用 `content LIKE`。 |
| route recall | 初始候选缺 class prefix 时，可拉回前一 chunk 并让 current method chunk 命中 `/api/users/42`。 |
| 后端验证 | focused tests 3 tests PASS；P6 backend suite 228 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Curie the 2nd / 019f33a7-c7e9-7dc1-8003-ec9e56aa9278`。 |

状态：GREEN for focused P6 code_chunks previous same-file route context candidate pull；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 110. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| search count boundary | `countSearchMatches(...)` 在 auxiliary hint 场景关闭 previous same-file context candidate pull。 |
| ranking preservation | `searchChunks(...)` 继续使用 previous same-file context candidates，endpoint route ranking 不退化。 |
| QA retrieval preservation | `listRetrievalCandidates(...)` 继续显式追加 previous same-file context candidates，QA citation retrieval 上下文不退化。 |
| false-positive control | `/api/users/42` count 不把仅用于上下文的 class-level prefix chunk 算进 total；SQL 断言继续拒绝 `content LIKE`。 |
| 后端验证 | focused tests 2 tests PASS；P6 backend suite 229 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Nietzsche the 2nd / 019f33b1-0f38-7ae1-8f65-22e95c3fb2a4`；已按复核建议移除偏实现细节的 `start_line <` SQL 字符串断言。 |

状态：GREEN for focused P6 code_chunks endpoint search count context boundary；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 111. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| previous context ordering | `listPreviousSameFileContextCandidates(...)` 的 previous query 改为 `start_line DESC` nearest-first。 |
| large-file recall | 大文件后半段 endpoint method chunk 可优先获得最近前置上下文，降低 LIMIT 被文件早期 chunk 占满的概率。 |
| scope control | method/path/evidence/endpoint primary auxiliary candidate query 保持原有 `file_path ASC + start_line ASC` 稳定排序。 |
| count boundary | `countSearchMatches(...)` 继续关闭 previous context candidate pull，不把 context-only chunk 计入 total。 |
| 后端验证 | focused tests 2 tests PASS；P6 backend suite 229 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Volta the 2nd / 019f33ba-e848-7ef2-9c89-558ba6eb7a38`；已按复核建议补齐 `file_path ASC` 断言并重跑通过。 |

状态：GREEN for focused P6 code_chunks nearest previous same-file context candidate pull；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 112. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| context window | `rankWithPreviousSameFileContext(...)` 从单 previous chunk 扩展为最多 3 个 previous same-file chunks。 |
| route composition | class-level route prefix 在前前 chunk、中间 chunk 无 route、method mapping 在当前 chunk 时，可组合 scoring context。 |
| return contract | 合成内容只用于 scoring，返回仍是原始 current chunk。 |
| false-positive control | 仍只在 endpoint route hint 场景启用；不跨文件、不后向、不恢复 `content LIKE`。 |
| 后端验证 | focused tests 4 tests PASS；P6 backend suite 231 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Parfit the 2nd / 019f33c1-c3d2-7d12-9cf2-625949475d76`；已按复核建议补充超过 3 个 previous chunks 的窗口上限测试并重跑通过。 |

状态：GREEN for focused P6 code_chunks bounded previous same-file context window；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 113. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| candidate-pool boundary | previous context DB query 返回后，每个 seed 只保留最近 3 个 previous same-file candidates。 |
| noise control | 远早于 current method 的 context-only chunk 不再混入 search result / QA evidence 候选池。 |
| query boundary | endpoint-only、最多 32 seeds、no `content LIKE`、nearest-first query ordering 保持不变。 |
| count boundary | `countSearchMatches(...)` 仍关闭 previous context candidate pull。 |
| 后端验证 | focused tests 4 tests PASS；P6 backend suite 232 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Galileo the 2nd / 019f33ca-d47b-7692-8c6a-babfe25a175e`。 |

状态：GREEN for focused P6 code_chunks bounded previous-context candidate pull window；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 114. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| search visible boundary | `searchChunks(...)` 使用 previous context candidates 做 ranking，但最终 visible results 只保留 primary candidates。 |
| metadata consistency | search items 与 `countSearchMatches(...)` 同步排除 previous-context-only chunks。 |
| retrieval preservation | `listRetrievalCandidates(...)` 继续保留 previous context candidates，不削弱 QA retrieval/citation context。 |
| false-positive control | context-only classPrefix/filler chunks 不再混入前端 search items。 |
| 后端验证 | focused tests 3 tests PASS；P6 backend suite 232 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Carson the 2nd / 019f33d2-2b7b-7b72-8abd-f66388e87ea7`。 |

状态：GREEN for focused P6 code_chunks search visible result context boundary；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 115. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA fallback grounding | Code QA fallback answer 现在优先引用 `PRIMARY` evidence，而不是盲目引用 retrieved chunks 第一条。 |
| shared selector | `fallbackCitedAnswer(...)` 与 `fallbackCitedLabels(...)` 共用 `fallbackCitationEvidence(...)`，未配置 LLM 与 LLM error fallback 行为一致。 |
| context boundary | adjacent-first 返回顺序下，C1 context 不被标记 cited，C2 PRIMARY 被标记 cited。 |
| note correctness | fallback enforcement note 已从“首条可用证据”改为“优先显式引用 PRIMARY 证据”。 |
| 后端验证 | `CodeQaControllerTest` 71 tests PASS；P6 related backend suite 339 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Linnaeus the 2nd / 019f33dc-6d10-7270-aa1a-48978f0deb5a`；已按建议补齐 LLM error adjacent-first 测试和 note 文案。 |

状态：GREEN for focused P6 Code QA fallback PRIMARY citation boundary；backend focused tests and QA/Data-AI review PASS；full release authority 未刷新。

## 116. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| claim-level gate | Code QA `DIRECT_VERIFIED` / `RETRY_VERIFIED` 现在要求全局 grounding verified、claim citation coverage READY，且 required claims 全部 PRIMARY-bound。 |
| trailing source control | 仅末尾 `Sources: [C1]` 不能替代事实句引用；必须触发 citation retry。 |
| retry robustness | retry 返回 null/blank 时保留原答案，状态为 `RETRY_FAILED`，避免空答案覆盖原文。 |
| context footer bypass | claim 只引用 context、footer 单独引用 primary 的答案不得通过 verified enforcement。 |
| regression alignment | 原本 claim coverage 为 REVIEW 的 split-claim 用例不再允许 `DIRECT_VERIFIED`。 |
| 后端验证 | `CodeQaControllerTest` 75 tests PASS；P6 related backend suite 343 tests PASS。 |
| 岗位复核 | 奥特曼 / Security Engineer 只读复核 PASS，runtime `Schrodinger the 2nd / 019f33e9-9705-7592-bf91-5528dce61365`；拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 首轮 PARTIAL，runtime `Avicenna the 2nd / 019f33e9-0bc5-7c72-888a-ac29ef003543`，二轮 PASS，runtime `Mencius the 2nd / 019f33ed-f125-71f3-83a5-59c832754caa`。 |

状态：GREEN for focused P6 Code QA claim-aware PRIMARY-bound citation enforcement；backend tests PASS；QA/Data/Security review PASS；full release authority 未刷新。

## 117. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| retry prompt contract | citation retry prompt 现在列出 `[Cx] role=PRIMARY/ADJACENT_CONTEXT file=...`，不再只给裸 label。 |
| primary-bound instruction | prompt 明确每条需要证据的具体代码事实必须至少引用一个 PRIMARY 标签。 |
| context boundary | prompt 明确 ADJACENT_CONTEXT 只能作为补充引用，不能作为唯一引用，也不能冒充主证据。 |
| prompt test | context-only claim + footer primary bypass 测试捕获第二次 LLM call，并断言 retry prompt 包含 evidence role/file 和 primary-bound 规则。 |
| 后端验证 | `CodeQaControllerTest` 75 tests PASS；P6 related backend suite 343 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Descartes the 2nd / 019f33f3-70b0-7e92-ac53-fc970d2eddfd`。 |

状态：GREEN for focused P6 Code QA primary-bound citation retry prompt；backend tests PASS；QA/Data review PASS；full release authority 未刷新。

## 118. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| failure diagnosis | Code QA `RETRY_FAILED` note 现在优先区分 invalid label、context-only、unknown-only、uncited claim、no evidence 和 no auditable claim。 |
| invalid label guard | `C99` 这类不存在标签不会被泛化为 PRIMARY 缺失；测试断言命中“不存在或无效的证据标签”。 |
| context-only guard | pure `ADJACENT_CONTEXT` claim 不会被泛化提示吞掉；测试断言 note 包含 `ADJACENT_CONTEXT` 和 `PRIMARY 证据`。 |
| 后端验证 | `CodeQaControllerTest` 75 tests PASS；P6 related backend suite 343 tests PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 首轮 PARTIAL，runtime `Noether the 2nd / 019f33fa-38ba-7083-a110-47f4397c6088`；二轮 PASS，runtime `Darwin the 2nd / 019f33fe-79a0-7d03-937f-c43a2b143bf7`。 |

状态：GREEN for focused P6 Code QA enforcement failure note precision；backend tests PASS；QA/Data second review PASS；full release authority 未刷新。

## 119. 2026-07-06 P6 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| structured diagnostics | Code QA 响应新增 `citationEnforcementReason`，为 citation enforcement 提供稳定机器码。 |
| compatibility | 旧 `citationEnforcementStatus` / `citationEnforcementNote` 保持兼容；前端类型新增 optional 字段。 |
| regression coverage | 后端测试覆盖 `DIRECT_VERIFIED`、`RETRY_VERIFIED`、`FALLBACK_PRIMARY_CITED`、`UNCITED_REQUIRED_CLAIM`、`CONTEXT_ONLY_CLAIM`、`INVALID_LABEL`。 |
| 后端验证 | `CodeQaControllerTest` 75 tests PASS；P6 related backend suite 343 tests PASS。 |
| 前端验证 | `npm --prefix web-console run build` PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核 PASS，runtime `Epicurus the 2nd / 019f3408-d30d-7302-9a27-e22086083b90`。 |

状态：GREEN for focused P6 Code QA citation enforcement reason code；backend tests PASS；frontend build PASS；QA/Data review PASS；full release authority 未刷新。

## 120. 2026-07-06 P6/P9 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| API/UI propagation | `citationEnforcementReason` 从 `CodeQaResponse` 类型进入 `QaMessage` 与 QA assistant message state。 |
| visible trust UX | Project QA 顶部证据标签显示机器 reason code；低置信度面板显示中文 reason label；可信度摘要把 reason 纳入检查项。 |
| marker proof | `project-qa-low-confidence-smoke.spec.ts` 输出 `citationEnforcementReasons`，覆盖 `DIRECT_VERIFIED`、`NO_EVIDENCE`、`NO_VALID_CITATION_LABEL`、`UNCITED_REQUIRED_CLAIM`。 |
| regression gate | `validate-frontend-ui.mjs` 同时锁定 API 类型、ProjectDetail 消费链路和 smoke marker，防止 reason 链路回退。 |
| 前端验证 | `node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`make project-qa-low-confidence-ui-smoke` PASS。 |
| 岗位复核 | 扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 首轮只读复核 PARTIAL，runtime `Heisenberg the 2nd / 019f3411-9e41-7111-bb66-3e74c6ebd1ca`；已按打回意见补 API type validator 并重跑通过。二轮只读复核 PASS，runtime `Aristotle the 2nd / 019f3417-bb93-7303-b9dc-8a1f7c7f2a7d`。 |

状态：GREEN for focused P6/P9 Project QA citation enforcement reason UI marker；frontend static/build/smoke PASS；FE/QA second review PASS；full release authority 未刷新。

## 121. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| release evidence contract | public repo UI 与 report evidence QA citation marker 都输出 `qaFromEvidence.citationEnforcementReasons`。 |
| verifier hard gate | `verify-release-evidence.sh` 要求 reason 非空，并限制为 `DIRECT_VERIFIED`、`RETRY_VERIFIED`、`FALLBACK_PRIMARY_CITED`。 |
| anti-forgery regression | security regression 的有效 payload 与手写 forged marker 样本补合法 reason，避免缺字段提前拒绝削弱伪造场景证明。 |
| static regression gate | `validate-frontend-ui.mjs` 同时锁定 smoke marker、verifier allowlist 和 security payload reason 字段。 |
| 前端验证 | `node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`make report-evidence-qa-citation-ui-smoke` PASS。 |
| 发布证据验证 | `bash -n scripts/verify-release-evidence.sh` PASS；`bash -n scripts/security-regression-check.sh` PASS；`make security-regression-release-verifier-public-repo-ui-marker` PASS。 |
| 岗位复核 | 黄仁勋 / DevOps Engineer + 拉里佩奇 / QA Engineer 首轮只读复核 PARTIAL，runtime `Hilbert the 2nd / 019f34ba-4489-7142-9815-1b0356f72828`；已按打回意见补 security valid payload、手写 forged marker reason 和 validator verifier/security gate，二轮 PASS。 |

状态：GREEN for focused P6/P11 Code QA citation enforcement reason release evidence gate；static/build/smoke/security regression PASS；DevOps/QA second review PASS；full release authority 未刷新。

## 122. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| recoverable QA marker | `PROJECT_QA_RECOVERABLE_SMOKE_OK.answerReadability` 新增 `citationEnforcementReasons` 和 `directVerifiedReasonVisible`，证明成功 QA reason code 已进入 UI 与 marker。 |
| visible trust UX | QA 重试恢复后页面必须显示 `原因码 DIRECT_VERIFIED`，避免只依赖 `引用已验证` status 文案。 |
| regression gate | `validate-frontend-ui.mjs` 锁定 mock response、UI reason 断言、reason 聚合和 marker 字段。 |
| 前端验证 | `node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make project-qa-recoverable-ui-smoke` PASS。 |
| 岗位复核 | 扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Plato the 2nd / 019f3505-5846-7a83-a272-2ad7806d5e0e`。 |

状态：GREEN for focused P6/P11 Project QA recoverable reason marker proof；mock-only UI evidence；full release authority 未刷新。

## 123. 2026-07-06 P9/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| report evidence profile | `.sl-report-evidence-item` 的 label/value/detail 已改为可换行、不省略、不裁切，并由 static validator 拒绝 `ellipsis/nowrap/overflow:hidden/line-clamp` 回退。 |
| report trace map | `.sl-report-trace-card` 的 label/value/source/detail 已改为可换行、不省略、不裁切，并纳入 smoke 与 static validator。 |
| narrow drawer containment | 320px 下 report evidence drawer content wrapper 收窄，handoff head 单列，handoff summary 保持在 viewport 内。 |
| smoke marker | `REPORT_EVIDENCE_DRAWER_SMOKE_OK.evidenceProfileTraceMapReadability` 证明 profile/trace 在 1440、390、320 下 `textNotClipped=true` 且 `noHorizontalOverflow=true`。 |
| 前端验证 | `node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make report-evidence-drawer-ui-smoke` PASS。 |
| 岗位复核 | 扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 首轮 PARTIAL，runtime `Confucius the 2nd / 019f3513-30a3-7472-9ff5-1c0c8b24bf65`；已按意见补 static gate 与 320px drawer containment，二轮 PASS。 |

状态：GREEN for focused P9/P11 Scan report evidence profile and trace map readability；mocked API smoke；full release authority 未刷新。

## 124. 2026-07-06 P9/P10/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| report API table | ScanTaskDetail API 表格 `路径`、`Controller` 列已移除业务 `ellipsis: true`，改为 wrapped display-redacted evidence cell。 |
| report DB table | ScanTaskDetail DB 表格 `文件` 列已移除业务 `ellipsis: true`，改为 wrapped display-redacted evidence cell。 |
| display redaction | 三个证据字段通过 `redactReportEvidenceText(value || '-')` 做展示层脱敏；不声明源数据、DB 或后端响应永久脱敏。 |
| responsive proof | `REPORT_EVIDENCE_DRAWER_SMOKE_OK.reportApiDbTableReadability` 证明 1440、390、320 下 API path、Controller、DB file visible，且 `textNotClipped=true`、`noHorizontalOverflow=true`。 |
| regression gate | `validate-frontend-ui.mjs` 同时锁定 CSS、三列 render contract、禁止三列 `ellipsis: true` 回退、smoke marker。 |
| 前端验证 | `node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make report-evidence-drawer-ui-smoke` PASS。 |
| 岗位复核 | 扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Hegel the 2nd / 019f352e-8c19-7e40-ba7e-b6907b9e5ab8`。 |

状态：GREEN for focused P9/P10/P11 Scan report API/DB table evidence field readability；mocked API smoke；full release authority 未刷新。

## 125. 2026-07-06 P9/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| governance cards | `.sl-report-governance-card` 的 label/value/detail 已改为可换行、不省略、不裁切，并纳入 static validator。 |
| governance stages | 治理阶段 label/reason/action 已纳入 smoke 可读性断言；阶段文本拒绝 `ellipsis/nowrap/overflow:hidden` 回退。 |
| governance events | smoke fixture 新增长治理事件 title/detail/gate reason，覆盖 candidate receipt 与 repair evidence gate 文案可读性。 |
| marker proof | `REPORT_EVIDENCE_DRAWER_SMOKE_OK.reportGovernanceTimelineReadability` 证明 1440、390、320 下 governance timeline visible、eventVisible、gateReasonVisible、textNotClipped、noHorizontalOverflow。 |
| test budget | focused smoke `test.setTimeout` 从 60s 调整为 90s；未减少断言，只为容纳三视口 drawer/QA/redaction/governance 路径。 |
| 前端验证 | `node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make report-evidence-drawer-ui-smoke` PASS。 |
| 岗位复核 | 扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Lovelace the 2nd / 019f353d-fe29-7fe1-ad5b-c88b263e9950`。 |

状态：GREEN for focused P9/P11 Scan report governance timeline readability；mocked API smoke；full release authority 未刷新。

## 126. 2026-07-06 P6/P10/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| reason provenance | `citationEnforcementReason` 已从 Project QA message 进入 AutoRepair URL、draft provenance、create payload、backend DTO、sanitized audit provenance 和 candidate receipt。 |
| display/copy redaction | Project QA citation card、copy citation、code_chunks evidence reason helper 均对 evidence reason 使用 `redactSensitiveText`。 |
| backend audit redaction | `AutoRepairService.putText` 复用 `SensitiveDataSanitizer.sanitize(value)` 后再清理控制字符和截断，测试用 `secret=` 与 `apiKey=sk-...` 哨兵证明 raw 值不进入 audit provenance。 |
| smoke marker | `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK` 包含 `citationEnforcementReasonBound=true` 与 `qa-citation-card-evidence-reason-redacted-before-handoff`，并覆盖 1440/390/320。 |
| regression gate | `validate-frontend-ui.mjs` 锁定 reason URL handoff、create payload、candidate marker、citation card redaction、copy redaction、chunk evidence reason redaction 和 handoff 前后 secret checks。 |
| 验证 | `node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`cd backend-spring && mvn -Dtest=AutoRepairServiceTest test` PASS；`CI=true make project-qa-autorepair-candidate-ui-smoke` PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 首轮 `PARTIAL`，runtime `Euler the 2nd / 019f354a-06e3-72d1-a3e0-9a3b2fccfaa7`；已按意见补 display/copy/code_chunks/backend audit redaction，二轮 `PASS`。 |

状态：GREEN for focused P6/P10/P11 Project QA -> AutoRepair reason provenance and redaction；mocked UI smoke + backend focused test；full release authority 未刷新。

## 127. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Markdown evidence URL | `CodeLocationHintParser` 的 source URL suffix、source path extension 和 evidence source URL suffix 清理链路已支持 `.md`。 |
| hosted URL hygiene | `pathSuffixHints_shouldNormalizeHostedMarkdownUrlsForEvidenceDocs` 证明 hosted `.md` URL 不保留 `github.com`、branch 噪声和 `#L20`。 |
| same-name doc disambiguation | `listRetrievalCandidates_shouldNormalizeHostedMarkdownUrlBeforeSameNameDocDecoy` 证明 `docs/CHAIRMAN_BRIEFING.md` 可排在 `archive/docs/CHAIRMAN_BRIEFING.md` 同名 decoy 前。 |
| safety boundary | 普通 `url/path` 字段未升级为 evidence anchor；未知 host 不会被拉取或执行，只作为本地路径 hint。 |
| 验证 | `cd backend-spring && mvn -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test` PASS，228 tests passed；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核 PASS，runtime `Peirce the 2nd / 019f355c-59e9-7240-8b28-8415d35d9164`。 |

状态：GREEN for focused P6/P11 code_chunks hosted Markdown evidence URL disambiguation；full release authority 未刷新。

## 128. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| indexed extension parity | `CodeLocationHintParser` 新增统一 `INDEXED_PATH_EXTENSION_PATTERN`，对齐当前 `CodeChunkFileFilter.SUPPORTED_EXTENSIONS`。 |
| script/style/native hints | Parser 测试覆盖 hosted `.sh`、`.scss`、`.cpp`、`.kts`，并证明 GitHub host/hash 噪声被清理。 |
| suffix boundary | `PATH_EXTENSION_BOUNDARY_PATTERN` 防止 `.hbs/.jsonnet/.cppbackup` 被截断成 `.h/.json/.cpp`。 |
| JSON boundary | 当前未索引普通 `.json` 不作为强路径 hint；未来如需支持必须同步扩展索引和噪声控制。 |
| retrieval proof | `listRetrievalCandidates_shouldNormalizeHostedScriptUrlBeforeSameNameScriptDecoy` 证明 `scripts/run-backend-dev.sh` 可排在 `archive/scripts/run-backend-dev.sh` 前。 |
| 验证 | `cd backend-spring && mvn -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test` PASS，232 tests passed；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 首轮 `PARTIAL`，runtime `Dewey the 2nd / 019f3564-b1f5-7fc0-a72c-52eb9c6c5bd8`；已按意见修复 json parity 和 extension boundary，二轮 `PASS`。 |

状态：GREEN for focused P6/P11 code_chunks indexed file extension path hint parity；full release authority 未刷新。

## 129. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| source evidence parity | `CodeQaController.normalizeEvidencePath` 已对齐当前 indexed extension 集合，覆盖 `.sh/.md/.scss/.kts` 等已索引文件类型。 |
| hosted script evidence | 新增 controller 回归证明 hosted `scripts/run-backend-dev.sh?plain=1#L12` 可匹配本地 `scripts/run-backend-dev.sh` chunk。 |
| QA citation binding | 响应断言覆盖 `sourceEvidenceMatched=true`、`REPORT_LINE_ANCHOR`、retrieved chunk `PRIMARY`、citation coverage `PRIMARY`、claim role distribution `PRIMARY_BOUND`。 |
| safety boundary | 外部 URL 仍只做字符串归一化和本地 chunk path 匹配，不远程访问、不执行、不信任外部内容；`.json` 仍不进入 indexed parity。 |
| 验证 | `cd backend-spring && mvn -Dtest=CodeQaControllerTest test` PASS，76 tests passed；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核 PASS，runtime `Newton the 2nd / 019f3570-451a-74f2-b53e-ed744ff72b00`。 |

状态：GREEN for focused P6/P11 Code QA source evidence indexed extension path parity；full release authority 未刷新。

## 130. 2026-07-06 P6/P10/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| path hint scoring | `CodeChunkRanker.pathHintMatchScore` 明确 exact、real suffix、basename、compact、middle contains 分层，middle contains 降为弱排序信号。 |
| generated/noise control | generated/metadata 路径只有 middle contains 命中时额外降权，降低噪声路径抢占同名文件结果的风险。 |
| exact anchor boundary | `matchesEvidencePathHint`、`matchesStrictPathHint`、`matchesMethodAnchorFileHint` 均不再允许 middle contains 成为 exact anchor。 |
| regression proof | `CodeChunkRankerTest` 覆盖 middle contains 不可成为 exact anchor、real suffix 可成为 exact anchor、qualified method middle contains 被拒绝；`CodeChunkServiceTest` 覆盖 compact target 压过 generated/noise decoy。 |
| 验证 | `cd backend-spring && mvn -Dtest=CodeLocationHintParserTest,CodeChunkRankerTest,CodeChunkServiceTest test` PASS，240 tests passed；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 四轮复核：前三轮 `PARTIAL`，runtime `Godel the 2nd`、`Ampere the 2nd`、`Ramanujan the 2nd`；第四轮 `PASS`，runtime `Archimedes the 2nd / 019f358b-9976-7f61-acb9-6924c6517e8e`。 |

状态：GREEN for focused P6/P10/P11 code_chunks path hint middle-contains exact-anchor hardening；full release authority 未刷新。

## 131. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| module-root parser | `CodeLocationHintParser.moduleRootHints` 可提取 `apps/*`、`packages/*`、`services/*`、`modules/*`、`libs/*`，并复用 path suffix hints。 |
| ranking boundary | `CodeChunkRanker.moduleRootHintScore` 只对仓库根部真实 module root 加 90 分，不提升 `archive/packages/admin/...`。 |
| hosted URL safety | arbitrary branch 的 `app/apps` 歧义降级测试继续保护，不因 module-root hint 破坏保守 URL 归一化。 |
| service proof | `CodeChunkServiceTest` 证明 `packages/z-admin/src/pages/Login.tsx` 压过同 suffix package decoy 和 archive decoy。 |
| 验证 | `cd backend-spring && mvn -Dtest=CodeLocationHintParserTest,CodeChunkRankerTest,CodeChunkServiceTest test` PASS，243 tests passed；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核 PASS，runtime `Planck the 2nd / 019f3597-5d46-7943-a445-e932015943f9`。 |

状态：GREEN for focused P6/P11 code_chunks module-root hint disambiguation；full release authority 未刷新。

## 132. 2026-07-06 P6/P10/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| schema | V032 幂等新增 `workspace_root`、`module_root` 和 root lookup indexes。 |
| write path | `chunkAndSave` 写入 `workspaceRoot/moduleRoot`；repo escape symlink 被 realPath boundary 拦截。 |
| ranking | 持久化 root metadata 优先于 path-only heuristic，但必须通过 `filePath` anchored 校验。 |
| API contract | Search item 暴露 root metadata；controller 过滤绝对路径、parent traversal 和 Windows drive path。 |
| 验证 | `cd backend-spring && mvn -Dtest=CodeChunkRankerTest,CodeChunkServiceTest,CodeLocationHintParserTest,CodeChunkControllerTest test` PASS，253 tests passed；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 三轮复核：`BLOCK -> PARTIAL -> PASS`，runtime `Sagan the 2nd / 019f35a0-b19f-7b81-b0e9-cd9e83574d7e`。 |

状态：GREEN for focused P6/P10/P11 code_chunks root metadata persistence；full release authority 未刷新。

## 133. 2026-07-06 P11/P12-pre focused quality update

| 维度 | 当前变化 |
| --- | --- |
| schema drift prevention | `validate-db-schema-contract.mjs` 锁住 V032、H2 schema、entity、mapper、DTO、controller sanitizer 和关键 root metadata tests。 |
| mapper/schema parity | `CodeChunkMapperSchemaTest` 通过真实 Spring/H2 context 调用 `CodeChunkMapper.insertBatch`，并读回 `workspace_root/module_root`。 |
| release gate | `verify-all.sh` 在 backend heavy tests 前运行 DB schema contract gate，快速发现 schema 合同漂移。 |
| code map | `PROJECT_CODE_MAP.md` 已由生成器刷新，当前 `files=575 routes=89 frontendApiCalls=79`。 |
| 验证 | `node scripts/validate-db-schema-contract.mjs` PASS；`bash -n scripts/verify-all.sh` PASS；focused backend tests PASS，254 tests passed；scoped `git diff --check` PASS。 |
| 岗位复核 | 比尔盖茨 / Backend Engineer + 黄仁勋 / DevOps Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核 PASS，runtime `Nash the 2nd / 019f35b0-51a5-77d0-99d5-dd6235a5b4f2`。 |

状态：GREEN for focused P11/P12-pre code_chunks root metadata schema contract gate；real MySQL/Flyway migration smoke 已在后续 P12-pre gate 刷新。

## 134. 2026-07-06 P12-pre focused quality update

| 维度 | 当前变化 |
| --- | --- |
| migration execution | `make mysql-flyway-smoke` 使用 disposable MySQL 8.4 + Spring/Flyway 从空库真实执行 32 个 migration 到 v032。 |
| V032 proof | `MySqlFlywayMigrationSmokeTest` 断言 `workspace_root/module_root`、root indexes 和 `flyway_schema_history` 中 V032 成功记录。 |
| release gate | 新增 `mysql-flyway-smoke` Make target；不进入日常 `make verify`，作为 P12-pre/release 前真实环境 gate。 |
| safety | 脚本使用 digest-pinned MySQL image、随机 loopback port、cleanup trap，不显式打印密码，并输出 `MYSQL_FLYWAY_MIGRATION_SMOKE_OK`。 |
| 验证 | `make mysql-flyway-smoke` PASS；DB schema contract gate PASS；shell syntax PASS；默认 Maven test 跳过 opt-in smoke；scoped `git diff --check` PASS。 |
| 岗位复核 | 黄仁勋 / DevOps Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核 PASS，runtime `Ohm the 2nd / 019f35bc-9bda-72f3-9628-bb68c625182b`。 |

状态：GREEN for focused P12-pre real MySQL Flyway migration smoke gate。

## 135. 2026-07-06 P6/P10/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| root metadata quality | workspace root manifest scan 复用 `CodeChunkFileFilter` skip dir 边界，避免 dependency/build/git 内部 manifest 污染 code_chunks root metadata。 |
| scan efficiency | `WorkspaceRootIndex.from` 使用 `walkFileTree + SKIP_SUBTREE`，不再递归扫描 `node_modules/dist/.git` 等跳过目录下的 manifests。 |
| regression proof | `CodeChunkServiceRootIndexTest` 证明合法 `packages/admin` root 保留，`node_modules/react`、`dist/apps/web`、`.git` 不产生 workspace root。 |
| 验证 | focused backend tests PASS，247 tests passed；`PROJECT_CODE_MAP_OK files=578 routes=89 frontendApiCalls=79`；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核 PASS，runtime `Laplace the 2nd / 019f35c3-a1cb-7091-bfc4-0d8002f6bdd5`。 |

状态：GREEN for focused P6/P10/P11 code_chunks workspace root manifest scan pruning。

## 136. 2026-07-06 P6/P10/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| scan efficiency | 主切片遍历使用 `walkFileTree + SKIP_SUBTREE`，跳过目录在进入前剪枝，不再递归后逐文件过滤。 |
| policy alignment | 主切片遍历、workspace root manifest scan 和 `CodeChunkFileFilter` 复用同一 skip dir 边界。 |
| security posture | 默认不跟随文件 symlink；逃逸 symlink 不进入 filter，`realPath` 仓库边界作为后置防线保留。 |
| regression proof | `CodeChunkServiceRootIndexTest` 证明 skipped dir 文件不进入 `fileFilter.shouldInclude`；`CodeChunkServiceTest` 证明逃逸 symlink 不写入 chunk。 |
| 验证 | focused backend tests PASS，248 tests passed；`PROJECT_CODE_MAP_OK files=578 routes=89 frontendApiCalls=79`；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 比尔盖茨 / Backend Engineer + 奥特曼 / Security Engineer + 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Herschel the 2nd / 019f35cb-e708-7a02-b88d-941cf859cb7f`。 |

状态：GREEN for focused P6/P10/P11 code_chunks main source scan subtree pruning。

## 137. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| memory profile | `chunkAndSave` 不再先构建完整候选文件 `List<Path>`，改为 visitor 逐个处理候选文件。 |
| traversal consistency | `walkIncludedSourceFiles` 作为 helper 包装 `visitIncludedSourceFiles`，生产和测试遍历边界不分叉。 |
| regression proof | `CodeChunkServiceRootIndexTest` 覆盖 visitor streaming 行为、旧 helper 行为和 skip dir pruning。 |
| 验证 | focused backend tests PASS，249 tests passed；`PROJECT_CODE_MAP_OK files=578 routes=89 frontendApiCalls=79`；DB schema contract PASS；shell syntax PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 比尔盖茨 / Backend Engineer + 黄仁勋 / DevOps Engineer + 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Kierkegaard the 2nd / 019f35d3-ca9c-7f72-b335-b6455bc4ea32`。 |

状态：GREEN for focused P6/P11 code_chunks streaming source file visitor。

## 138. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| memory profile | 切片结果从整任务聚合改为 `BATCH_SIZE=200` buffer flush，降低大仓切片内存峰值。 |
| batch behavior | 单文件 201 chunks 仍写成 `200 + 1`；跨文件 202 chunks 写成 `200 + 2`。 |
| failure propagation | 满批 `insertBatch` 失败会向外抛出，不再被文件级 catch 吞掉；全局遍历异常也向外抛出。 |
| regression proof | `CodeChunkServiceTest` 覆盖显式多行 batch、跨文件累计 flush、满批写库失败传播、same-model embedding 复用。 |
| 验证 | focused backend tests PASS，251 tests passed；`PROJECT_CODE_MAP_OK files=578 routes=89 frontendApiCalls=79`；DB schema contract PASS；shell syntax PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 比尔盖茨 / Backend Engineer + 黄仁勋 / DevOps Engineer + 拉里佩奇 / QA Engineer 先 `BLOCK` 后修复复核 `PASS`，runtime `Arendt the 2nd / 019f35d8-bf69-76c3-9e6c-c7cccd73e156`。 |

状态：GREEN for focused P6/P11 code_chunks batched chunk flush after BLOCK fix。

## 139. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| failure compensation | 满批 flush、尾批 flush 和遍历级强失败后按 `scanTaskId` 清理 partial chunks。 |
| cleanup boundary | 初始旧切片清理失败直接抛错，避免旧切片未清理时继续写新切片。 |
| async safety | 失败路径在 async embedding 前抛出，测试证明不会调用 embedding client。 |
| regression proof | `CodeChunkServiceTest` 覆盖满批失败传播、尾批失败 partial cleanup、初始 cleanup 失败直接抛出，并断言 delete wrapper 绑定当前 `scanTaskId`。 |
| 验证 | focused backend tests PASS，253 tests passed；`PROJECT_CODE_MAP_OK files=578 routes=89 frontendApiCalls=79`；DB schema contract PASS；shell syntax PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 比尔盖茨 / Backend Engineer + 黄仁勋 / DevOps Engineer + 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Boyle the 2nd / 019f35e1-6f45-79b3-bef2-77eac814836a`。 |

状态：GREEN for focused P6/P11 code_chunks batch flush failure compensation。

## 140. 2026-07-06 P6/P10/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| input validation | `chunkAndSave` 在清理旧 chunks 前 fail-fast 校验 `scanTaskId`、空白路径、缺失路径、普通文件路径和真实路径解析。 |
| stale data protection | 无效仓库输入不会触发 mapper delete/insert，也不会进入 fileFilter，避免旧 chunks 被错误清空后扫描误成功。 |
| scan correctness | 无效路径异常会向外抛给扫描任务失败路径，不再以“没有生成任何代码切片”形式静默成功。 |
| regression proof | `CodeChunkServiceTest` 覆盖 null scanTaskId、blank repoPath、missing repoPath、regular file repoPath，且断言 no delete/no insert/no filter。 |
| 验证 | focused backend tests PASS，257 tests passed。 |
| 岗位复核 | 比尔盖茨 / Backend Engineer + 奥特曼 / Security Engineer + 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Anscombe the 2nd / 019f35ea-259a-71e3-9376-53b0e6fbde72`。 |

状态：GREEN for focused P6/P10/P11 code_chunks chunkAndSave fail-fast validation。

## 141. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| retrieval correctness | previous same-file context 合成评分对象保留 current chunk root metadata，monorepo moduleRoot hint 不会在 route ranking 中丢失。 |
| evidence trust | 合成对象只用于评分，最终结果仍返回原始 current chunk，避免拼接内容成为可见证据对象。 |
| regression proof | 新增 metadata 保留测试和 `sourceRoot: packages/admin` monorepo route ranking 测试。 |
| 验证 | focused backend tests PASS，295 tests passed。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Pasteur the 2nd / 019f35f6-3772-7303-8ec6-bc36b1235f7a`。 |

状态：GREEN for focused P6/P11 code_chunks previous-context root metadata preservation。

## 142. 2026-07-06 P9/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| app shell readability | `.sl-topbar-actions` 显式支持 wrap、可收缩和 containment，不再依赖默认 Space 行为。 |
| responsive proof | app-shell smoke 在 1440、390、320 视口覆盖 13 个核心路由，新增 topbar action wrap/containment marker。 |
| regression gate | `validate-frontend-ui.mjs` 锁定 CSS 和 smoke marker，防止顶部 action 区回退到不可换行或隐藏裁切。 |
| 验证 | frontend static gate PASS；frontend build PASS；app-shell UI smoke PASS，1 test passed，39 route-viewport visits。 |
| 岗位复核 | 乔布斯 / Product-Frontend Lead + 扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Carver the 2nd / 019f3600-977b-7ef3-b68a-012ce439fe97`。 |

状态：GREEN for focused P9/P11 app shell topbar actions containment。

## 143. 2026-07-06 P10/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| raw access boundary | artifact read/preview 不再允许 symlink artifact 作为可读 regular file。 |
| path containment | storagePath 先做 artifact root 字符串边界校验，再做真实路径 containment 校验。 |
| legacy fallback boundary | legacy fallback 只允许当前 artifact root 外、形态符合 `artifacts/scan_task/{ownerId}` 的历史迁移路径，不覆盖当前 root 内安全拒绝。 |
| no-follow read | raw 全量读取使用 no-follow input stream；preview 使用 no-follow byte channel，并保持 128KB 截断语义。 |
| regression proof | `ArtifactStorageServiceTest` 覆盖 readBytes/readPreview 基础 symlink escape 拒绝、root 内 symlink 全拒绝、SCAN_TASK + legacy summary 下 symlink escape 不 fallback、大文本 preview 截断、direct readBytes legacy fallback。 |
| 验证 | backend focused tests PASS，25 tests passed。 |
| 岗位复核 | 第一轮 artifact symlink/fallback 复核：奥特曼 / 比尔盖茨 / 拉里佩奇 `PARTIAL` 后 `PASS`，runtime `Socrates the 2nd / 019f360b-9408-7921-8663-9e33cf30bb3f`；no-follow read hardening 复核 `PASS`，runtime `Hooke the 2nd / 019f3616-97f7-7f52-b521-cc460c4ba392`。 |

状态：GREEN for focused P10/P11 artifact symlink escape guard and no-follow read hardening。

## 144. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| citation trust | Code QA citation audit 剥离 `<del>`、`<s>`、`<strike>` deleted-text block，删除线内 citation 不再被当作真实可见引用。 |
| claim enforcement | fake-only deleted-text citation 会触发 citation retry；只有 retry 后的可见 citation 才能进入 `RETRY_VERIFIED`。 |
| regression proof | `CodeQaControllerTest` 覆盖 `<del>`、`<s>`、`<strike>` 三类 deleted-text fake citation，并回归 HTML code、Markdown link destination、Code QA retrieval 和 LLM adapter。 |
| 验证 | Code QA focused backend tests PASS，124 tests passed。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer 只读复核 `PASS`，runtime `Ptolemy the 2nd / 019f361f-7b47-7902-b9be-89aa9bea0c95`。 |

状态：GREEN for focused P6/P11 Code QA HTML deleted-text citation noise filter。

## 145. 2026-07-06 P10/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| artifact write boundary | 写入侧新增 workspace base 创建后 no-follow 校验，并逐级校验 `artifacts` root、owner/type 父目录。 |
| symlink rejection | `artifacts` root symlink、中间父目录 symlink、目标文件 symlink 均拒绝；已有普通文件 overwrite 保留。 |
| no-follow write | 目标文件写入改用 no-follow byte channel，避免已存在 symlink target 被覆盖。 |
| regression proof | `ArtifactStorageServiceTest` 覆盖缺失 workspace base、普通文件 overwrite、artifact root symlink、父目录 symlink、目标文件 symlink，并回归 read/preview no-follow 与 controller raw download。 |
| 验证 | backend focused tests PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 奥特曼 / Security Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer 二次复核从 `BLOCK` 降为 `PARTIAL`，runtime `McClintock the 2nd / 019f362a-5b9d-7302-a772-871aa9e88519`；剩余边界已写入安全模型：artifact root 必须是服务私有目录，不声明完整 `SecureDirectoryStream` 级 TOCTOU。 |

状态：GREEN for focused P10/P11 artifact write symlink guard under private-root boundary；TOCTOU hardening remains monitored.

## 146. 2026-07-06 P10/P11/P12-pre focused quality update

| 维度 | 当前变化 |
| --- | --- |
| prod startup gate | `SecurityStartupValidator` 在 prod 启动时校验 artifact workspace 私有目录边界。 |
| fail-closed boundary | prod `sourcelens.workspace.base-path` 必须已存在、非 symlink、权限可检查且不可 group/world writable；已存在的 `artifacts` root 同样校验。 |
| dev compatibility | 非 prod profile 直接返回，本地 dev 默认值不受影响。 |
| regression proof | 测试覆盖 missing workspace、workspace symlink、artifact root symlink、group writable workspace、valid prod YAML external workspace 和 dev profile。 |
| 验证 | `SecurityStartupValidatorTest` PASS；artifact/security focused suite PASS；static security regression PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 奥特曼 / Security Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer 只读复核 PASS，runtime `Singer the 2nd / 019f3636-5364-77a0-a30b-cd2af1437d89`。 |

状态：GREEN for focused P10/P11/P12-pre production artifact workspace startup gate.

## 147. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| retrieval correctness | endpoint route ranking 新增 HTTP method hint；`GET /path`、`POST /path` 等问法会优先匹配当前 route literal 或 composed route 上声明相同 Spring HTTP method 的 handler。 |
| evidence trust | 同路径不同 handler 时，错误 HTTP method 不再因为路径相同、同 chunk 无关 mapping 或 previous-context 无关 mapping 轻易压过目标 handler，降低 QA citation 锚错接口实现的概率。 |
| regression proof | `CodeLocationHintParserTest` 覆盖 method hint 正/负例；`CodeChunkServiceTest` 覆盖同路径错误 method、同 chunk 无关 method、previous-context 无关 method 和 `RequestMethod.GET/POST` 正负例。 |
| 验证 | `CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest` PASS；static security regression PASS；DB schema contract PASS；code map check PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 二次只读复核 `PASS`，runtime `Gauss the 2nd / 019f3643-f3c1-7290-b6f4-b84fe117a698`。拉里佩奇 / QA Engineer 因当前 agent thread limit 未启动，不记录为已参与。 |

状态：GREEN for focused P6/P11 code_chunks HTTP method route ranking.

## 148. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| retrieval correctness | Spring route template parser 支持 `{name:regex}` 单段 path variable；`/api/users/{id:\\d+}` 能匹配 `/api/users/42`。 |
| parser safety | route expression 拼接判断只识别 quoted literal 外的 `+`，不会把 regex literal 内的 `+` 当成字符串拼接。 |
| false-positive control | 空 regex `{id:}` 和包含 `/` 的 regex segment fail closed，不作为 path variable template 命中。 |
| regression proof | `CodeChunkServiceTest` 覆盖 direct regex route、class+method composed regex route、malformed regex negative cases，并回归 parser/retrieval 组合。 |
| 验证 | `CodeChunkServiceTest` PASS；`CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 只读复核 `PASS`，runtime `Pauli the 2nd / 019f3654-70b3-7b01-a61c-081209b5d374`；无必须打回项。 |

状态：GREEN for focused P6/P11 Spring regex path variable route recall.

## 149. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| retrieval correctness | `@RequestMapping(method = GET)` 与 `method = { GET, HEAD }` 静态导入写法现在能作为 HTTP method 信号参与 endpoint route ranking。 |
| false-positive control | 裸 `GET/POST/...` 只从 quote/comment-aware 的 `method = ...` 属性表达式收集；`name = "GET"`、`params = "method=GET"`、`params = "x=RequestMethod.GET"`、`/* method = GET */` 和 method array 内注释不会污染 method 判断。 |
| regression proof | `CodeChunkServiceTest` 覆盖 `RequestMethod.GET` 保持、static-import scalar、static-import array、qualified array、HEAD query、quoted method-like attribute negative case 和 comment negative case。 |
| 验证 | static-import focused tests PASS；`CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 三轮只读复核，runtime `Helmholtz the 2nd / 019f365a-b3a4-79f2-94ae-29892f102973`；前两轮 `PARTIAL` 指出非 method 属性和注释污染，修复后第三轮 `PASS`。 |

状态：GREEN for focused P6/P11 RequestMapping static-import HTTP method recall；backend/static gates and Data-AI third review PASS；full release authority 未刷新。

## 150. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| retrieval correctness | Spring/Kotlin annotation arguments 现在用括号深度扫描截取，`arrayOf(RequestMethod.GET)` 后面的 `path = "/api/auth/login"` 不再丢失。 |
| parser safety | 括号扫描跳过 quoted string、line comment 和 block comment；未闭合 quote/block comment 保守 fail closed。 |
| regression proof | `CodeChunkServiceTest` 覆盖 parser 合同和 GET/POST Kotlin `arrayOf(RequestMethod.X)` ranking 竞争场景。 |
| 验证 | focused tests PASS；`CodeChunkServiceTest` PASS；`CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 只读复核 `PASS`，runtime `Bohr the 2nd / 019f366d-0fd8-7e31-a0b7-625d2d8d1bd1`。 |

状态：GREEN for focused P6/P11 nested Spring/Kotlin annotation argument parsing；full release authority 未刷新。

## 151. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| retrieval correctness | Spring mapping parser 现在跳过字符串、行注释和块注释里的伪 `@GetMapping/@RequestMapping`，降低注释示例污染 code_chunks route ranking 的风险。 |
| parser safety | 真实 mapping 保留；伪注解不再进入 `springMappingLiterals(...)` 强结构化 route 列表。 |
| regression proof | `CodeChunkServiceTest` 覆盖 string/line-comment/block-comment 伪注解过滤和 endpoint ranking 防污染。 |
| 验证 | focused tests PASS；`CodeChunkServiceTest` PASS；`CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 只读复核 `PASS`，runtime `Bacon / 019f367b-3143-7581-b3d2-189fddcddd09`。 |

状态：GREEN for focused P6/P11 Spring mapping comment/string false-positive control；full release authority 未刷新。

## 152. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| retrieval correctness | endpoint weak `exactRoute/routeMention` 现在使用去注释后的内容评分，注释中的 quoted route 不再获得弱召回分。 |
| evidence trust | 真实前端 API 字符串仍保留召回能力，历史注释、旧接口说明和 block comment 不再作为 endpoint weak evidence。 |
| regression proof | `CodeChunkServiceTest` 覆盖旧实现红测、controller comment-only route、非 controller line/block comment quoted route、真实 string route 保留和伪 Spring mapping 回归。 |
| 验证 | focused tests PASS；`CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest` PASS；backend full `mvn test` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 只读复核 `PASS`，runtime `Raman / 019f3683-c237-7031-9065-f5b9152c721d`；建议补强的非 controller line/block comment tests 已补。 |

状态：GREEN for focused P6/P11 endpoint weak route comment stripping；full release authority 未刷新。

## 153. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | citation format/example 噪声过滤不再误删真实代码事实中的 `ExampleService`、`FormatParser`、`example-service.ts`、`format-parser.ts` 或普通 `Resource example`。 |
| false-positive control | `Example:`、`Format:`、`Citation format:`、`reference format`、`source example` 等真正引用格式示例仍会被过滤，不进入 claim audit。 |
| regression proof | `CodeQaControllerTest` 覆盖 API 级 `DIRECT_VERIFIED` 和 private sanitizer 边界，防止 valid code fact 被误判成非 auditable。 |
| 验证 | focused tests PASS；`CodeQaControllerTest,CodeQaRetrievalServiceTest,LlmClientAdapterTest` PASS；backend full `mvn test` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer 只读复核 `PASS`，runtime `Lagrange / 019f3694-7a80-7381-906c-db953f2ded62`；无必须打回项。 |

状态：GREEN for focused P6/P11 Code QA citation example/format false-positive control；QA review PASS；full release authority 未刷新。

## 154. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | reference-style 与 inline Markdown 图片 alt 文本中的 `[C1]` 不再被当成正文有效引用，防止图示/截图语法伪造 `VERIFIED`。 |
| Markdown sanitizer | `stripMarkdownLinkDestinations(...)` 支持 reference-style span；图片丢弃 alt，普通链接保留 label。 |
| false-positive control | Markdown reference definition 在 URL 清理后仍会丢弃，避免 `[auth-diagram]:` / `[auth]:` 残留变成 `auth` claim。 |
| regression proof | 新增 API 级红绿测试证明旧实现会 `VERIFIED`，修复后变为 `RETRY_FAILED`；补充 inline image 和 `[auth]: URL` 直接测试，同时回归普通 link label citation 和 link destination/reference definition 过滤。 |
| 验证 | focused Markdown tests PASS；Code QA suite PASS；backend full `mvn test` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer 第一轮 `PARTIAL`，要求补 inline image 与 `[auth]: URL` 直接测试；补测后二轮 `PASS`，runtime `Gauss / 019f369b-0297-7470-aed3-7bca702c556e`。 |

状态：GREEN for focused P6/P11 Markdown reference image citation filter；QA review PASS；full release authority 未刷新。

## 155. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | citation range 上限从 `end - start > 50` 修为 `end - start + 1 > 50`，语义变为包含端点后最多 50 个 label。 |
| overclaim control | `[C1-C51]` 会整体拒绝且不会退化为 `C1/C51` 普通 token，降低大范围 citation 伪覆盖风险。 |
| regression proof | 新增 focused parser 测试证明 `[C1-C50]` 有效、`[C1-C51]` 拒绝；既有 `[C1-C2]` 正常路径和 reversed range 负例保持。 |
| 验证 | focused range tests PASS；Code QA suite PASS；backend full `mvn test` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 拉里佩奇 / QA Engineer 只读复核 `PASS`，runtime `Descartes / 019f36a2-8d98-7961-b0e1-4ca1c323462c`。 |

状态：GREEN for focused P6/P11 citation range max-size off-by-one guard；full release authority 未刷新。

## 156. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | 新增 P6 固定离线 Code QA retrieval eval corpus，覆盖中文接口定位、弱关键词语义召回、路径行号锚点和 exact anchor 跨文件证据保留。 |
| 回归门禁 | `CodeQaRetrievalEvalCorpusTest` 从 JSON fixture 读取样本并执行真实 `CodeQaRetrievalService`，断言 first path、included paths、startLine 和 per-path cap，并校验 fixture hygiene。 |
| 可维护性 | eval 样本放在 test resources，后续可扩充真实公开仓库样本，不污染生产代码。 |
| 验证 | eval focused test PASS；retrieval focused suite PASS；backend full `mvn test` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 只读复核 `PASS`，runtime `Lovelace / 019f36a8-076b-7682-a00c-e6fe063b3495`；建议补充 fixture hygiene，已补入 evaluator。 |

状态：GREEN for focused P6/P11 fixed offline retrieval eval corpus；Data-AI review PASS；full release authority 未刷新。

## 157. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | 固定离线 retrieval eval corpus 新增 `Recall@4` 与 `MRR@4` 指标阈值，当前第一版要求均为 `1.0`。 |
| 回归门禁 | evaluator 计算每个 case 的 expectedIncludedPaths topK 命中比例和 expectedFirstPath 倒数排名，再聚合为平均指标并 fail closed。 |
| 质量边界 | 指标只适用于 fixed offline regression eval；不对外宣称真实项目检索 benchmark。 |
| 验证 | eval metrics focused test PASS；retrieval focused suite PASS；backend full `mvn test` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 只读复核 `PASS`，runtime `Sagan / 019f36ad-272d-73a2-b996-b0c3b02a5f89`。 |

状态：GREEN for focused P6/P11 fixed offline retrieval eval metrics gate；full release authority 未刷新。

## 158. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | 固定离线 retrieval eval corpus 从 4 个样本提升到 6 个样本，新增 Vite source URL 行号定位和 raw JSON handler evidence 定位。 |
| 回归门禁 | `minCaseCount=6`，Recall@4 / MRR@4 继续保持 `1.0`，新增样本进入 focused/full 后端测试。 |
| 评价口径 | fixture 新增 `evaluationScope=fixed_golden_regression` 和 `benchmarkClaim=false`，evaluator 强制校验，避免误表述为真实检索 benchmark。 |
| 验证 | eval focused test PASS；retrieval focused suite PASS；backend full `mvn test` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 第一轮 `PARTIAL`，runtime `Kuhn / 019f36b3-0e55-71e0-956f-4db8022e8ccf`；补 benchmark-claim 测试合同后二轮 `PASS`。 |

状态：GREEN for focused P6/P11 retrieval eval realistic case expansion；full release authority 未刷新。

## 159. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 报告证据追问 | 固定离线 retrieval eval corpus 新增 GitHub `blob` URL 与 `raw.githubusercontent.com` URL 行号锚点样本。 |
| 回归门禁 | `minCaseCount=8`，新增样本要求首位命中 `web-console/src/pages/ProjectDetail.tsx` 且 `startLine=241`，并抗 same-name legacy、Dashboard 同函数和 docs 噪声。 |
| 评价口径 | `evaluationScope=fixed_golden_regression` 与 `benchmarkClaim=false` 保持，避免误表述为通用 benchmark。 |
| 验证 | eval focused test PASS；retrieval focused suite PASS；backend full `mvn test` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 只读复核 `PASS`，runtime `Erdos / 019f36ba-3f89-7310-b513-4d5fc3604d4b`。 |

状态：GREEN for focused P6/P11 GitHub source URL evidence anchor regression；full release authority 未刷新。

## 160. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 报告证据追问 | fixed retrieval eval corpus 新增 feature branch + `apps/client` app-root `sourceUrl` 样本，降低 GitHub URL 样本过度同构风险。 |
| 回归门禁 | `minCaseCount=9`，并新增 `requiredCaseIds` 校验，防止未来只满足数量但替换掉关键样本。 |
| monorepo 消歧 | 新样本要求 target `apps/client/src/pages/Login.tsx` 压过 `client/src/pages/Login.tsx` suffix decoy、`packages/admin/src/pages/Login.tsx` 同名页面和 docs 噪声。 |
| 验证 | eval focused test PASS；retrieval focused suite PASS；backend full `mvn test` PASS；static security regression PASS；DB schema contract PASS；scoped `git diff --check` PASS。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer 只读复核 `PASS`，runtime `Chandrasekhar / 019f36c0-0eca-7410-978f-825b3a649997`；观察项 required case ids 已转为 evaluator 合同。 |

状态：GREEN for focused P6/P11 feature branch app-root source URL regression；full release authority 未刷新。

## 161. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 报告证据追问 | Code QA API 层 `sourceEvidenceMatched` 支持 GitHub hosted app-root URL 归一化，避免 target 与 suffix decoy 同时匹配时被误判为歧义失败。 |
| citation 可信度 | 新增 API 回归断言 `sourceEvidenceMatched=true`、`REPORT_LINE_ANCHOR`、target chunk `PRIMARY`、citation coverage `PRIMARY`、claim role distribution `PRIMARY_BOUND`。 |
| 回归门禁 | focused test、P6 Code QA/retrieval suite、backend full test、static security regression、DB schema contract、code-map check 和 scoped whitespace 均通过。 |
| 质量边界 | 这是 bounded source-root heuristic；不声明完整 Git ref parser、任意 branch name、任意托管平台或真实公开仓库泛化能力。 |
| 岗位复核 | 拉里佩奇 / QA Engineer 首轮 `PARTIAL`，runtime `Kant / 019f36cc-91f6-7721-b219-8dba2b91c871`；指出 decoy-first 可抢 PRIMARY，已补 exact-first 实现和 decoy-first 测试后二轮 `PASS`。 |

状态：GREEN for focused P6/P11 hosted app-root source evidence match；QA review PASS；full release authority 未刷新。

## 162. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 发布证据质量 | public repo report evidence QA marker 新增 `citationEnforcementReasons` 顶层汇总和 sample-level `citationEnforcementReason`。 |
| 回归门禁 | release verifier 强校验 reason code 白名单，并要求 top-level reason set 精确等于 sample reason set；security regression 增加缺失 reason code 和 reason mismatch forged marker 负例。 |
| citation 可信度 | 真实 public repo 报告追问链路的 release evidence 现在同时证明 status 和 reason，减少 UI/verifier 对中文 note 或隐含状态的依赖。 |
| 验证 | static security regression PASS；bash syntax PASS；DB schema contract PASS；code-map PASS；scoped whitespace PASS。 |
| 岗位复核 | 达里奥 / Quality Gate 只读复核 `PASS`，runtime `Franklin / 019f36d7-4458-7551-a253-533f4783a5fc`；其非阻断观察已转为 exact reason-set 门禁。 |

状态：GREEN for focused P6/P11 public repo report evidence QA reason gate；Quality Gate review PASS；full release authority 未刷新。

## 163. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | `code_chunks` route ranking 支持 same-file previous context 中的 qualified Spring route constants，如 `Routes.AUTH + Routes.LOGIN`。 |
| 假阳性控制 | qualified constant lookup 改为 exact-only；`Routes.LOGIN` 缺失时不会误用 simple `LOGIN`，simple key 碰撞时仍独立注册 `Routes.LOGIN`。 |
| 回归门禁 | 新增 happy path、missing qualified negative、simple-name collision positive 三条 tests；完整 `CodeChunkServiceTest`、retrieval focused tests、backend full test、static security regression、DB schema contract 和 code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Harvey / 019f36de-84ea-75c3-a04c-25b56a279366`，拉里佩奇 / QA Engineer runtime `Poincare / 019f36df-18f2-7c50-bd8d-ea327491001c`；两者先后 `PARTIAL` 打回，修复后二轮 `PASS`。 |

状态：GREEN for focused P6/P11 qualified route constants retrieval gate；backend full test PASS；full release authority 未刷新。

## 164. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | `code_chunks` route ranking 支持候选池内 route holder 文件里的 qualified constants，如 `AuthRoutes.LOGIN`。 |
| 假阳性控制 | 外部 constants 只以 qualified key 进入 annotation 解析；`AuthRoutes.LOGIN` 缺失时不会 fallback 到 `MarketingRoutes.LOGIN` 或 simple `LOGIN`。 |
| 性能边界 | route holder context 受 24 chunks / 24k chars 限制；新增第 25 个 holder 不泄漏的 focused regression。 |
| 回归门禁 | cross-file holder 正例、simple-name fallback 负例、bounded context mutant-killing 测试、完整 `CodeChunkServiceTest`、Code QA retrieval tests、backend full test、static security regression、DB schema contract 和 scoped diff check 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Epicurus / 019f3736-c5dc-7181-943a-5dd4f8c90358` `PASS`；拉里佩奇 / QA Engineer runtime `Anscombe / 019f3736-dfe3-7722-9383-379a884b5308` 多轮 `PARTIAL` 打回 bounded 测试证明力，收紧后最终 `PASS`。 |

状态：GREEN for focused P6/P11 bounded cross-file route holder constants；backend full test PASS；full release authority 未刷新。

## 165. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | route holder 命名覆盖扩展到 `ApiConstants/UrlConstants/UriConstants/ApiUrls/ApiUris/Paths/Endpoints` Java 文件。 |
| 假阳性控制 | `isRouteConstantHolder(...)` 不再使用宽泛 `contains("uri")/contains("url")`；普通 `Constants.java` 和 `SecurityConstants.java` 均有负向保护。 |
| 回归门禁 | 循环 focused test 逐个证明 7 类 holder 的 SQL 参数出现和 target Controller 排第一；完整 `CodeChunkServiceTest`、Code QA retrieval tests、backend full test、static security regression、DB schema contract 和 scoped diff check 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Cicero / 019f3743-f45d-7c51-afb3-409f77e85389` 首轮 `PARTIAL`，修复 `SecurityConstants` 子串误伤后二轮 `PASS`；拉里佩奇 / QA Engineer runtime `Zeno / 019f3744-0fb8-7f60-91ac-80e337d8d7a4` 两轮 `PARTIAL`，补齐 Paths/Endpoints 后三轮 `PASS`。 |

状态：GREEN for focused P6/P11 API/URL route holder filename expansion；backend full test PASS；full release authority 未刷新。

## 166. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | `code_chunks` route ranking 支持 Kotlin `object ApiConstants { const val LOGIN = ... }` 中的 qualified route constants。 |
| QA citation 可信度 | focused test 同时证明 `ApiConstants.kt` 进入 SQL candidate，且 `@GetMapping(ApiConstants.LOGIN)` 优先于同路径 POST literal。 |
| 回归门禁 | Kotlin focused test、API/URL holder focused test、完整 `CodeChunkServiceTest`、Code QA retrieval tests、backend full test、static security regression、DB schema contract 和 scoped diff check 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Socrates / 019f374f-f25c-7b11-9ff1-edf7b665bc1a` `PASS`；拉里佩奇 / QA Engineer runtime `Aquinas / 019f3750-14d7-7591-af57-43022839e0d6` 首轮 `PARTIAL`，补 `ApiConstants.kt` SQL candidate 断言后二轮 `PASS`。 |

状态：GREEN for focused P6/P11 Kotlin object route holder constants；backend full test PASS；full release authority 未刷新。

## 167. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | `code_chunks` route ranking 支持 nested Kotlin object holder，例如 `ApiRoutes.Auth.LOGIN`。 |
| QA citation 可信度 | focused tests 同时证明 parser map、`ApiRoutes.kt` SQL candidate、GET target 排第一和 Kotlin holder 文件名矩阵。 |
| 回归门禁 | focused tests、完整 `CodeChunkServiceTest`、Code QA retrieval tests、backend full test、static security regression、DB schema contract、code-map 和 scoped diff check 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Bernoulli / 019f375e-cf16-7291-948d-6da55a40de55` `PASS`；拉里佩奇 / QA Engineer runtime `Boyle / 019f375e-f001-7770-9c02-ba52ffce6084` `PASS`。 |

状态：GREEN for focused P6/P11 nested Kotlin object route holder constants；backend full test PASS；full release authority 未刷新。

## 168. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Code QA 检索质量 | `CodeQaRetrievalService` 对 endpoint route query 使用 `CodeChunkRanker.rankWithPreviousSameFileContextScores`，与 code_chunks route holder 解析保持一致。 |
| 假阳性控制 | route-aware 候选保留原始分数，并只接收 `>=150` 的真实 route-aware 命中；无真实 route 命中时 semantic fallback 仍可生效。 |
| 回归门禁 | fixed eval corpus 新增 nested Kotlin route holder + POST literal decoy；service test 新增 `GET /missing/route` semantic fallback 回归。 |
| 验证 | Code QA focused tests、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract 和 code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Heisenberg / 019f3768-ece1-7a82-ad2b-79b992f7c1e1` 首轮 `PARTIAL`，修复后二轮 `PASS`；拉里佩奇 / QA Engineer runtime `Parfit / 019f3769-2191-7f40-8f80-6b64ab33d178` `PASS`。 |

状态：GREEN for focused P6/P11 Code QA route-holder-aware endpoint retrieval；backend full test PASS；full release authority 未刷新。

## 169. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Code QA 检索质量 | endpoint route retrieval 区分 strong route signal 与 Spring mapping route signal；只有真实 Spring mapping route 命中才关闭 semantic fallback。 |
| 假阳性控制 | docs/prose exact route mention、单独 holder literal、无关 source 继承 holder context 都不能再压过 semantic target。 |
| 回归门禁 | `CodeQaRetrievalServiceTest` 新增 docs route mention 和 holder + unrelated source + semantic target 两个 focused regressions。 |
| 验证 | Code QA focused tests、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract 和 code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Halley / 019f3774-7431-75c2-b335-4e6ef3146c02` 首轮 `PARTIAL`，修复后二轮 `PASS`；拉里佩奇 / QA Engineer runtime `Mendel / 019f3774-749e-76e1-a2ac-0e463a001a23` `PASS`。 |

状态：GREEN for focused P6/P11 Code QA endpoint route strong/weak split；backend full test PASS；full release authority 未刷新。

## 170. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Code QA 检索质量 | 显式“路由常量在哪定义 / route constants”查询会优先返回 route holder，例如 `ApiRoutes.kt`。 |
| 假阳性控制 | 普通 “Which API route handles GET ...” 不触发 constants boost，仍优先返回 Controller/handler。 |
| 回归门禁 | `CodeQaRetrievalServiceTest` 新增 route constants 正例和 handler API route 负例；fixed eval corpus 新增 required case `handler-api-route-wording-over-route-constants-holder`。 |
| 验证 | Code QA focused/eval、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract、code-map、scoped diff check 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Banach / 019f3781-1e19-7c52-9dfa-de0fd0b98efd` 首轮 `PARTIAL` 后二轮 `PASS`；拉里佩奇 / QA Engineer runtime `Einstein / 019f3781-1e7a-7173-a3df-046006df2be3` 首轮 `PARTIAL` 后二轮 `PASS`。 |

状态：GREEN for focused P6/P11 Code QA route constants intent；backend full test PASS；full release authority 未刷新。

## 171. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| Code QA 检索质量 | hosted sourceUrl 指向 `apps/client/src/api/index.ts` 时，归档路径 `archive/apps/client/src/api/index.ts` 不再能抢占目标文件。 |
| 证据可信度 | archive protected-root suffix 不再被判为 exact source evidence；target exact=true、archive decoy exact=false。 |
| 回归门禁 | Service test、ranker exact-anchor test 和 fixed eval required case 三层覆盖 `github-app-root-archive-decoy-over-source-url-anchor`。 |
| 验证 | focused suite、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract、code-map、scoped diff check 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Mencius / 019f378e-6337-75f0-a60b-a8b89ab4d98b` 首轮 `PARTIAL` 后二轮 `PASS`；拉里佩奇 / QA Engineer runtime `Pasteur / 019f378e-639d-79e3-bb38-713f19725efc` 首轮 `PARTIAL` 后二轮 `PASS`。 |

状态：GREEN for focused P6/P11 hosted app-root archive decoy hardening；backend full test PASS；full release authority 未刷新。

## 172. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| 代码理解质量 | `code_chunks` route parser 支持 one-line nested Kotlin object holder，例如 `ApiRoutes.Auth.LOGIN`。 |
| QA citation 可信度 | `searchChunks` 回归证明 `ApiRoutes.kt` 进入候选、GET target first、route holder included，且同路径 POST literal decoy 不抢首位。 |
| 回归门禁 | parser 单测、service 单测、完整 `CodeChunkServiceTest`、P6 Code QA/ranker eval suite、backend full test、static security regression、DB schema contract、code-map 和 scoped diff check 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Herschel / 019f3798-dcad-7663-bfd4-d006f9d3d064` `PASS`；拉里佩奇 / QA Engineer runtime `Ptolemy / 019f3798-f819-7370-a05d-b421a3a5c771` `PASS`。 |

状态：GREEN for focused P6/P11 one-line nested Kotlin route constants；backend full test PASS；full release authority 未刷新。

## 173. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | generated/noise 路径不再继承 source evidence suffix/exact 权重，避免 generated mirror 被展示为真实源码精确证据。 |
| 假阳性控制 | generated middle path score 从弱匹配降为 0；`generated/...`、`.generated/...`、`metadata/...` 和 `metadata.ts/js/json` 被纳入 noise path。 |
| 回归门禁 | ranker exact-anchor、service top1、fixed eval required case 三层覆盖 `github-generated-suffix-decoy-over-source-url-anchor`。 |
| 验证 | focused suite、完整 `CodeChunkServiceTest`、P6 Code QA/ranker eval suite、backend full test、static security regression、DB schema contract、code-map、scoped diff check 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Peirce / 019f37a1-fc77-7033-a42a-24d3a312bb2a` `PASS`；拉里佩奇 / QA Engineer runtime `Godel / 019f37a2-1da2-7892-9233-2ddd6585640a` `PASS`。 |

状态：GREEN for focused P6/P11 generated suffix source evidence decoy hardening；backend full test PASS；full release authority 未刷新。

## 174. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | root-relative `sourceUrl=.../src/pages/Login.tsx#L44` 现在能与 `src/pages/Login.tsx` strict exact path 对齐，避免 package suffix decoy 伪装成同等精确证据。 |
| 假阳性控制 | `packages/admin/src/pages/Login.tsx` 仍可能有宽松 exact-location 或关键词弱信号，但当真实 root-relative exact target 存在时不能再抢占首位。 |
| 回归门禁 | service top1、ranker strict exact-path、fixed eval required case 三层覆盖 `github-root-relative-exact-source-url-over-package-suffix-decoy`；旧 app-root eval case 保留。 |
| 验证 | focused suite、P6 retrieval suite、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract 和 code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `James / 019f37b0-6169-75a0-9150-fa207e9a5834` `PASS`；拉里佩奇 / QA Engineer runtime `Pascal / 019f37b0-9149-72e1-8b0b-e70917f4f4f4` `PASS`。 |

状态：GREEN for focused P6/P11 root-relative sourceUrl exact anchor over package suffix；backend full test PASS；full release authority 未刷新。

## 175. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | strict exact-path 现在要求 structured evidence 同一个 object 的 path 与 line 同时命中，避免跨 object 混拼。 |
| 假阳性控制 | `src/pages/Login.tsx` 的错误行段不能再借用另一个 evidence object 的 lineNumber 成为 strict exact anchor。 |
| 回归门禁 | `CodeChunkRankerTest` 新增 mixed evidence object negative 和 paired positive；P6 retrieval suite 与 backend full test 均通过。 |
| 验证 | focused suite、P6 retrieval suite、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract 和 code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Jason / 019f37b9-5786-7890-a6a0-39b436e7dd95` `PASS`；拉里佩奇 / QA Engineer runtime `Meitner / 019f37b9-75fd-7df1-bfd6-b82358296a16` `PASS`。 |

状态：GREEN for focused P6/P11 structured evidence path-line pair binding；backend full test PASS；full release authority 未刷新。

## 176. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | structured `startLine/endLine` range 现在也受同 object path-line 绑定保护。 |
| 假阳性控制 | 同 path 但错误 range 的 chunk 不能借用另一个 evidence object 的 range 变成 strict exact anchor。 |
| 回归门禁 | `CodeChunkRankerTest` 同时覆盖 `lineNumber` 与 `startLine/endLine` 两种 mixed negative / paired positive。 |
| 验证 | focused suite、P6 retrieval suite、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract 和 code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Lorentz / 019f37bf-4eb4-7091-b0b2-2ff645a9a754` `PASS`；拉里佩奇 / QA Engineer runtime `Mill / 019f37bf-70de-7220-a700-45a1fddd17ad` `PASS`。 |

状态：GREEN for focused P6/P11 structured evidence startLine/endLine pair binding；backend full test PASS；full release authority 未刷新。

## 177. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | Code QA API 现在用 controller 回归证明 `evidenceRef.start_line/end_line` 会绑定到 PRIMARY answer citation。 |
| 假阳性控制 | 同文件非重叠 decoy 被放在 target 前面，仍必须是 `ADJACENT_CONTEXT/citedByAnswer=false`；target 才能是 `PRIMARY/citedByAnswer=true`。 |
| 回归门禁 | `CodeQaControllerTest#codeQa_shouldMatchViteSourceUrlWithStartEndOnlyEvidenceRef` 同时锁住 sourceEvidenceRef、retrievedChunks、answerCitations、citationCoverage 和 claimCitationCoverage。 |
| 验证 | focused single test、P6 Code QA/ranker/eval suite、backend full test、static security regression、DB schema contract 和 code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Tesla / 019f37c7-a2c2-79a3-ace3-d2678a9b89d7` `PASS`；拉里佩奇 / QA Engineer runtime `Goodall / 019f37c7-c00b-7301-b205-02e1050468b0` 首轮 `PARTIAL` 后二轮 `PASS`。 |

状态：GREEN for focused P6/P11 evidenceRef startLine/endLine API citation binding；backend full test PASS；full release authority 未刷新。

## 178. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | public repo report evidence QA marker 现在必须同时覆盖 `LINE_NUMBER` 与 `START_END_ONLY` evidenceRef。 |
| 假阳性控制 | START_END_ONLY 样本证明 request 不带 legacy `lineNumber`，response 不合成 `lineNumber`，且 `startLine/endLine` 覆盖 evidence line。 |
| 回归门禁 | release verifier 强制 `MIXED_LINE_AND_START_END`、mode count、bound count 和每样本 shape；security regression 覆盖 line-only、缺 start/end-only、range miss、计数伪造等负例。 |
| 验证 | bash syntax、focused release marker regression、static security regression 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Nash / 019f37db-669d-7753-9019-0e4a92926956` `PASS`；拉里佩奇 / QA Engineer runtime `Carson / 019f37db-6712-74f0-abe7-427a89ca93ba` `PASS`。 |

状态：GREEN for focused P6/P11 public repo report evidence mixed lineNumber/startEnd QA gate；full release authority 未刷新。

## 179. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | fixture/testdata 镜像路径不再继承 sourceUrl suffix/exact 强证据。 |
| 假阳性控制 | `tests/fixtures/src/pages/Login.tsx`、`tests/__fixtures__/src/pages/Login.tsx`、`testdata/src/pages/Login.tsx`、`test-data/src/pages/Login.tsx` 均不能抢占真实 `src/pages/Login.tsx`。 |
| 回归门禁 | ranker/service 循环覆盖四类 mirror path；fixed eval corpus 新增 fixtures/testdata required cases，`minCaseCount=16`。 |
| 验证 | focused suite、P6 retrieval suite、backend full test、static security regression、DB schema contract、code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Galileo / 019f37e5-a389-7342-ae0f-6ff2a4734ca2` `PASS`；拉里佩奇 / QA Engineer runtime `Averroes / 019f37e5-a3e8-7711-9fe1-ca75fb9f3a19` 首轮 `PARTIAL` 后二轮 `PASS`。 |

状态：GREEN for focused P6/P11 fixture/testdata mirror sourceUrl decoy hardening；backend full test PASS；full release authority 未刷新。

## 180. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | hosted sourceUrl arbitrary branch 中的 branch-derived strong root 不再直接伪装成源码根。 |
| 假阳性控制 | `feature/web-console/src/index.ts` 现在保守解析到 `src/index.ts`，避免 `web-console/src/index.ts` 抢占 root-relative target。 |
| 回归门禁 | parser 覆盖 `feature/web-console` 降级、`feature/code-review/web-console` 保留和 `master` 分支；retrieval service 与 fixed eval corpus 覆盖 root-relative target over strong-root decoy。 |
| 验证 | focused suite、P6 retrieval suite、backend full test、static security regression、DB schema contract、code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Laplace / 019f37f1-c980-73b2-bc12-5c9721771eb1` `PASS`；拉里佩奇 / QA Engineer runtime `Dalton / 019f37f1-e9e5-7560-8ee9-e91393d44cce` `PASS`。 |

状态：GREEN for focused P6/P11 hosted branch strong-root ambiguity hardening；backend full test PASS；full release authority 未刷新。

## 181. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | report/provider 显式 `sourceRoot: web-console` 时，hosted sourceUrl 的 branch/root 歧义可以重新指向 `web-console/src/index.ts`。 |
| 假阳性控制 | sourceRoot metadata boost 只在 root 匹配且 exact location anchor 成立时触发；`src`、`../bad` 等 root hint 被拒绝。 |
| 回归门禁 | parser 覆盖 strong root 与 monorepo root 提取；retrieval service 覆盖 `src/index.ts`、`web-console/src/index.ts`、`packages/admin/src/index.ts` 三方竞争；fixed eval corpus `minCaseCount=18`。 |
| 验证 | focused suite、P6 retrieval suite、backend full test、static security regression、DB schema contract、code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Archimedes / 019f37fb-4007-7e21-9adf-42aea1bfd5ff` `PASS`；拉里佩奇 / QA Engineer runtime `Sartre / 019f37fb-6621-7152-ba96-1bfbfeb53f6a` `PASS`。 |

状态：GREEN for focused P6/P11 sourceRoot metadata-aware hosted sourceUrl file-index resolver；backend full test PASS；full release authority 未刷新。

## 182. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | module-local `src/index.ts` 可通过 `workspaceRoot/moduleRoot=web-console` 还原到 `sourceRoot: web-console`，减少同 path 跨模块错配。 |
| 假阳性控制 | 同 path 根目录 decoy 和同 path `packages/admin` decoy 均被过滤；`chunkKey` 纳入 workspaceRoot/moduleRoot，避免不同模块 chunk 被误去重。 |
| 回归门禁 | service test 覆盖同 path + null root、同 path + 错误非空 root、target root 三方竞争；eval harness 校验 expectedFirstWorkspaceRoot/moduleRoot；fixed corpus `minCaseCount=19`。 |
| 验证 | focused P6 retrieval suite、backend full test、static security regression、DB schema contract、code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Dirac / 019f3806-7fe5-7e23-a756-b6d7cebc54a7` `PASS`；拉里佩奇 / QA Engineer runtime `Boole / 019f3806-b443-71c1-b734-abbff2a93213` 首轮 `PARTIAL`，补同 path 错误非空 root decoy 后二轮 `PASS`。 |

状态：GREEN for focused P6/P11 module-local sourceRoot virtual path resolver；full release authority 未刷新。

## 183. 2026-07-06 P6/P11 focused quality update

| 维度 | 当前变化 |
| --- | --- |
| QA citation 可信度 | context diversity 从裸 `filePath` 分组升级为 virtual file key，多个模块的 module-local `src/index.ts` 可以同时进入上下文。 |
| 假阳性控制 | 未声明 `packages/marketing` 同 path decoy 不进入前三个 context；sourceRoot decoy 过滤仍保留。 |
| 回归门禁 | service test 覆盖三声明 root + 未声明 root + controller 噪声；eval harness 增加 `expectedIncludedWorkspaceRoots`；fixed corpus `minCaseCount=20`。 |
| 验证 | focused tests、P6 retrieval suite、backend full test、static security regression、DB schema contract、code-map 均通过。 |
| 岗位复核 | 梁文峰 / Data-AI Engineer runtime `Arendt / 019f3813-32cd-73d1-8fce-3344b0644e1e` `PASS`；拉里佩奇 / QA Engineer runtime `Linnaeus / 019f3813-51c3-7353-9091-d5400d7596fd` `PASS`，补可选 `packages/marketing` decoy 后二次确认 `PASS`。 |

状态：GREEN for focused P6/P11 module-local virtual path context diversity；backend full test PASS；full release authority 未刷新。

## 184. 2026-07-07 P6/P11 live evidence quality update

| 维度 | 当前变化 |
| --- | --- |
| 真实仓库证据 | `Pawnshop-Management-System` 公开仓库真实扫描通过，最新 focused evidence 为 `release-evidence/p6-public-repo-code-qa-20260707-000013`。 |
| QA citation 可信度 | `projectQaWeakKeywordEvaluation`、`claimCitationNoiseBoundary`、`semanticWeakKeywordProbe`、`reportEvidenceQaCitationQuality` 均在真实 scan 上输出 `OK`。 |
| 证据绑定 | weak keyword case 级别新增 `scanTaskId`，marker 复核确认 4 个 case 均绑定 `scanTaskId=285`。 |
| 回归门禁 | `verify-release-evidence.sh` 对 focused evidence PASS；脚本 `bash -n` PASS。 |
| 未完成项 | `release-verifier-public-repo-marker` 安全回归本轮卡住并被中断；该项不能计为 PASS，需要后续 P11 修复。 |

状态：GREEN for focused P6/P11 live public repo Code QA evidence；YELLOW for public repo marker security regression hang；full release authority 未刷新。

## 185. 2026-07-07 P11 release verifier marker timeout closure

| 维度 | 当前变化 |
| --- | --- |
| 安全回归稳定性 | `release-verifier-public-repo-marker` 在 macOS Node fallback 路径上已由 detached process group 管理，避免 nested verifier 残留。 |
| 回归门禁 | verbose timeout-configured suite 与 silent focused suite 均 PASS。 |
| 子 agent 复核 | 奥特曼 / Security Engineer runtime `Russell / 019f3839-94fb-7421-8aea-8623455987e0` 只读复核 `PASS focused`。 |
| 证据完整性 | `p6-public-repo-code-qa-20260707-000013` focused evidence 继续通过 `verify-release-evidence.sh`。 |
| 剩余项 | suite 耗时约 4 分钟，质量状态从 security-blocking YELLOW 降为 performance-observation YELLOW。 |

状态：GREEN for no-hang/no-residual focused P11 public repo marker security regression；YELLOW for suite runtime cost；full release authority 未刷新。

## 186. 2026-07-07 P6 stage close quality score

| 维度 | 当前状态 |
| --- | --- |
| code_chunks | GREEN；route parsing、root metadata、module-local virtual path、batch/streaming 和 scan pruning 已有 focused/backend gates。 |
| 跨文件检索 | GREEN；fixed offline corpus 20/20 required cases，覆盖 hosted sourceUrl、sourceRoot metadata、module-local diversity、decoy hardening。 |
| 报告引用质量 | GREEN；report evidence QA citation、lineNumber/startEnd mixed gate、claim citation boundary 和 source evidence binding 已有 verifier/smoke。 |
| 真实公开仓库 | GREEN；`p6-public-repo-code-qa-20260707-000013` focused evidence verified。 |
| release/verifier | GREEN；`release-verifier-public-repo-marker` 当前 PASS，`real 266.85s`。 |
| 文档与代码地图 | GREEN；`PROJECT_CODE_MAP.md` 已刷新并通过 check，`files=580 routes=89 frontendApiCalls=79`。 |
| 不可宣称项 | YELLOW accepted；不宣称 full authority 刷新、真实 LLM provider、全局 RAG benchmark、GitHub App/Webhook E2E 或生产部署能力。 |

状态：P6 STAGE CLOSE ACCEPTED with partial authority；下一阶段优先 P9 UI 主链路体验与 P11 verifier runtime 优化。

## 187. 2026-07-07 P9 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| App shell topbar | GREEN；桌面端 env/ports/username 可见且不裁切，移动端辅助信息折叠，不挤压标题。 |
| 用户名可读性 | GREEN；`.sl-topbar-username` 改为可换行可读，静态门禁拒绝 ellipsis/overflow hidden 回退。 |
| 响应式覆盖 | GREEN；app-shell smoke 覆盖 13 个核心路由和 `1440x900`、`390x844`、`320x740`。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs`、frontend build 和 app-shell smoke 均 PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Confucius` 首轮 PARTIAL 后已补强，runtime `Turing / 019f3852-c9e6-7031-920d-e9e4f50bf4c7` 二轮 PASS。 |
| 不可宣称项 | YELLOW；该切片不代表全站 P9 UI 完成，也不刷新 full release authority。 |

状态：GREEN for focused P9 app shell topbar auxiliary responsive contract；full release authority 未刷新。

## 188. 2026-07-07 P9 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| 报告体验 | GREEN；报告证据抽屉 action rail 显示修复门禁开放/阻断原因。 |
| AutoRepair 安全 UX | GREEN；GAP 状态下修复候选仍不可生成，同时可见说明缺少 code_chunks 主证据。 |
| 可读性 | GREEN；门禁说明使用 `.sl-report-evidence-action-rail-guard`，可换行、不省略、不裁切。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs`、frontend build 和 `smoke:report-evidence-drawer` 均 PASS。 |
| Smoke evidence | GREEN；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.drawerActionRail.readyRepairActionEnabled=true` 且 `repairGateReasonVisible=true`。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Hypatia / 019f385c-3a1d-7ad0-90e1-b29bc22ba8d9` 首轮 PARTIAL 后二轮 PASS。 |
| 不可宣称项 | YELLOW；不代表全站 disabled action 完成，不证明真实 patch 质量，不刷新 full release authority。 |

状态：GREEN for focused P9 report evidence repair gate reason visibility；Frontend review PASS。

## 189. 2026-07-07 P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Timeout fallback | GREEN；Node fallback 可被显式强制，并由 integration-drill 动态触发 timeout。 |
| Fail-closed | GREEN；内部 timeout probe 期望非 0 退出，并检查 `SECURITY CHECK TIMEOUT` 与 `TIMEOUT` 日志。 |
| 进程清理 | GREEN；probe 写入 nested child PID，并确认同进程组 nested child 不残留。 |
| 默认行为 | GREEN；默认仍优先 `timeout/gtimeout`，不改变正常本地/CI 路径。 |
| 验证 | GREEN；bash syntax、integration-drill、static suite PASS，残留进程检查 PASS。 |
| 岗位复核 | GREEN；黄仁勋 / DevOps Engineer runtime `Kepler / 019f3867-30d7-7c41-8ba7-6984b3d6b346` PASS。 |
| 不可宣称项 | YELLOW；不降低 public repo marker suite runtime，不覆盖 daemonized/setsid 脱组进程，不刷新 full release authority。 |

状态：GREEN for focused P11 Node fallback timeout micro-probe；DevOps review PASS。

## 190. 2026-07-07 P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Public repo marker runtime | GREEN；`release-verifier-public-repo-marker` 从约 4 分钟降到约 40 秒。 |
| Validator authority | GREEN；batch runner 动态抽取并执行 `verify-release-evidence.sh` 的 public repo marker Node validator。 |
| Coverage | GREEN；mutation 矩阵未删减，natural endpoint 与 weak keyword high-frequency cases 改为 batch validation。 |
| Wiring proof | GREEN；仍保留 shared base fixture、完整 valid marker verifier 调用和 without-marker 端到端 verifier 证明。 |
| 验证 | GREEN；bash syntax、focused suite、integration-drill、diff whitespace 和残留进程检查 PASS。 |
| 岗位复核 | GREEN；黄仁勋 / DevOps Engineer runtime `Locke / 019f3880-7834-7e91-9bc1-1d07f8760f02` PASS。 |
| 不可宣称项 | YELLOW；不刷新 full release authority，不证明真实 LLM provider 或 P6 检索质量本体。 |

状态：GREEN for focused P11 public repo marker batch validation；DevOps review PASS。

## 191. 2026-07-07 P6 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Focused evidence | GREEN；`release-evidence/p6-final-public-repo-code-qa-20260707-0153`。 |
| Public repo smoke | GREEN；`required_failures=0`，`optional_warnings=0`。 |
| Verifier | GREEN；`verify-release-evidence.sh` checksum and marker contract PASS。 |
| Weak keyword eval | GREEN；`projectQaWeakKeywordEvaluation.status=OK`，`SEMANTIC_FALLBACK=4`，case `scanTaskId=287`。 |
| Semantic probe | GREEN；`semanticWeakKeywordProbe.status=OK`。 |
| Report evidence QA citation | GREEN；`status=OK`，`sampleCount=4`，mixed line/start-end evidenceRef，narrative citation bound。 |
| Code QA citation | GREEN；claim citation `READY`，cross-file summary satisfied。 |
| Security regression | GREEN；`release-verifier-public-repo-marker` PASS after batch runtime fix。 |
| Data-AI review | GREEN；梁文峰 / Faraday `019f3891-0e2b-7900-bed7-13111732d11b` PASS。 |
| 不可宣称项 | YELLOW；focused authority only，不刷新 full release authority，不证明真实外部 provider 质量，不包含 public repo UI smoke，不能把 Code QA 整体宣称为 READY。 |

状态：GREEN for P6 final focused public repo evidence refresh；Data-AI review PASS。

## 192. 2026-07-07 P9 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Dashboard command UX | GREEN；QA/AutoRepair disabled action 现在显示可见阻断原因。 |
| 可读性 | GREEN；disabled reason、command label 和 value 均可换行，不再依赖 nowrap ellipsis。 |
| Recoverable states | GREEN；异常、空仓库、无成功扫描分支均被 smoke 覆盖。 |
| 响应式 | GREEN；`dashboard-next-action-smoke` 覆盖 `1440x900`、`390x844` 与 `320x740`，并断言原因宽度不撑破 viewport。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 `disabledReason`、可见 note、CSS wrap 规则和 marker 字段。 |
| 验证 | GREEN；static UI gate、frontend build、focused Dashboard smoke PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Avicenna / 019f3899-0958-7eb2-a037-c603b4d170fa` PASS；非阻断建议中的 390px 断点和 computed style 断言已补强。 |
| 不可宣称项 | YELLOW；不代表全站 disabled action、全站 P9、public repo UI smoke 或 full release authority 完成。 |

状态：GREEN for focused P9 Dashboard command disabled reason visibility；Frontend review PASS。

## 193. 2026-07-07 P9 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Project QA handoff UX | GREEN；CodeUnderstandingLens 显示独立 `Agent 交接门禁说明`。 |
| READY 状态 | GREEN；明确显示门禁已开放和开放条件。 |
| 阻断状态 | GREEN；stale scan、context-only 等状态显示门禁未开放和具体原因。 |
| 可读性 | GREEN；门禁说明可换行、不省略、不隐藏，computed style 已由 smoke 断言。 |
| 响应式 | GREEN；`project-qa-recoverable` smoke 覆盖 `1440x900`、`390x844`、`320x740`。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住可见 note、CSS wrap 和 marker fields。 |
| 验证 | GREEN；static UI gate、frontend build、focused Project QA smoke PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Newton / 019f38a2-039f-72d1-8da8-67af66d939e3` PASS；非阻断建议中的 READY gate computed style 对称断言已补强。 |
| 不可宣称项 | YELLOW；不代表全站 Agent handoff、AgentChat、AgentTasks、AutoRepair 或 full release authority 完成。 |

状态：GREEN for focused P9 Project QA Agent handoff gate reason visibility；Frontend review PASS。

## 194. 2026-07-07 P9 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| ScanTaskDetail code knowledge UX | GREEN；`代码知识库操作门禁说明` 显示 ready/error/zero-chunk 三态原因。 |
| Blocked action readability | GREEN；code_chunks 状态失败时明确说明问答/检索入口关闭，重试成功后显示门禁开放。 |
| 可读性 | GREEN；门禁说明和 code knowledge 指标格均可换行、不省略、不隐藏。 |
| 响应式 | GREEN；batch4A smoke 覆盖 `1440x900`、`390x740`、`320x740`。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 visible note、CSS wrap、blocked/ready marker 和 grid style marker。 |
| 验证 | GREEN；static UI gate、frontend build、focused batch4A smoke PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Hilbert / 019f38ae-37f7-73f3-b1c1-0e4ebead24f6` PASS；非阻断建议中的 grid ellipsis 已补强。 |
| 不可宣称项 | YELLOW；不代表全站 disabled action、真实 provider 质量、public repo UI smoke 或 full release authority 完成。 |

状态：GREEN for focused P9 ScanTaskDetail code knowledge gate reason visibility；Frontend review PASS。

## 195. 2026-07-07 P9 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Report priority rail UX | GREEN；三张 priority card 都显示可见 `修复门禁说明`。 |
| READY 状态 | GREEN；首要风险证据显示 `修复门禁已开放` 和文件级风险证据原因。 |
| BLOCKED 状态 | GREEN；引用预检和治理闭环显示 `修复门禁未开放`，并明确不等同/不替代文件级修复证据。 |
| 可读性 | GREEN；repair gate、priority card strong/p/meta 均可换行、不省略、不隐藏。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 `repairGateReason`、visible note、CSS wrap、smoke 断言和 marker fields。 |
| 验证 | GREEN；static UI gate、frontend build、focused report evidence drawer smoke PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Bohr / 019f38bb-2e0d-7b92-ae46-96a1e8574c39` PASS；非阻断建议已补强。 |
| 不可宣称项 | YELLOW；不代表全站 disabled action、AutoRepair 生产安全、真实 patch 质量或 full release authority 完成。 |

状态：GREEN for focused P9 ScanTaskDetail priority repair gate reason visibility；Frontend review PASS。

## 196. 2026-07-07 P9 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Recommended action UX | GREEN；`报告推荐下一步` 显示独立 `报告推荐动作门禁说明`。 |
| Branch coverage | GREEN；failed/running/file-bound repair/project-risk/evidence-gap/code_chunks-gap/QA-ready 分支均有动作边界文案。 |
| 可读性 | GREEN；推荐动作门禁说明可换行、不省略、不隐藏，移动端退回单列。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 `actionGateReason`、visible note、CSS wrap、smoke helper 和 marker fields。 |
| Smoke evidence | GREEN；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.recommendedStep` 证明 visible、gateVisible、gateReasonVisible、gateReasonStyleSafe、390/320/no-overflow。 |
| 验证 | GREEN；static UI gate、frontend build、focused report evidence drawer smoke PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Schrodinger / 019f38c8-96e2-7302-a7b9-9212c30b8719` PASS；非阻断建议已补强。 |
| 不可宣称项 | YELLOW；不代表全站推荐动作、AutoRepair 生产安全、真实 patch 质量或 full release authority 完成。 |

状态：GREEN for focused P9 ScanTaskDetail recommended action gate reason visibility；Frontend review PASS。

## 197. 2026-07-07 P9 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Trace map UX | GREEN；五张 trace card 均显示独立 `追踪动作门禁说明`。 |
| Branch coverage | GREEN；质量风险、API 表面、数据模型、依赖图谱、产物证据均有 actionGateReason。 |
| 可读性 | GREEN；trace gate 文本可换行、不省略、不隐藏，computed style 由 smoke 断言。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 trace item gate 字段、visible note、CSS wrap、smoke helper 和 marker fields。 |
| Smoke evidence | GREEN；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.evidenceProfileTraceMapReadability.traceGateCount=5` 且 `traceGateReasonVisible=true`。 |
| 验证 | GREEN；static UI gate、frontend build、focused report evidence drawer smoke PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Dewey / 019f38d2-3e15-7fd1-9b38-4ae1ca721c88` 首轮 PARTIAL 后二轮 PASS；per-card proof 缺口已补强。 |
| 不可宣称项 | YELLOW；不代表全站状态面、真实 provider 质量、QA 事实质量或 full release authority 完成。 |

状态：GREEN for focused P9 ScanTaskDetail trace map action gate reason visibility；Frontend review PASS。

## 198. 2026-07-07 P9/P10/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| AuditLogs decision gate | GREEN；新增 `审计判定门禁说明`，显示 READY / REVIEW / BLOCKED。 |
| Scope truthfulness | GREEN；手动筛选、初始 deep link 和分页窗口进入 REVIEW，不把局部窗口宣称为全局健康。 |
| Source failure handling | GREEN；审计源失败或 deep link miss 进入 BLOCKED。 |
| Cockpit status line | GREEN；顶部状态改为 `审计源可读取 / 审计源加载中 / 审计源需复核`，不再静态宣称在线。 |
| 可读性 | GREEN；decision gate 和四个证据格可换行、不省略、不裁切。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 submitted filter scope、动态状态线、decision gate CSS 和 smoke marker。 |
| Smoke evidence | GREEN；`audit-logs-detail-selection` 7 tests PASS，覆盖 READY、REVIEW、BLOCKED、手动筛选、分页和源错误。 |
| 验证 | GREEN；static UI gate、frontend build、focused AuditLogs smoke PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Ramanujan / 019f38de-ac82-7693-9c94-d81dac61bc7d` 首轮 PARTIAL 后二轮 PASS。 |
| 不可宣称项 | YELLOW；不代表 AuditLogs 是全局安全裁判，不刷新 full release authority；tool/delivery 手动筛选动态 smoke 可后续扩展。 |

状态：GREEN for focused P9/P10/P11 AuditLogs decision gate scope and source-health truthfulness；Frontend review PASS after PARTIAL。

## 199. 2026-07-07 P9/P10/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| AgentTasks action gate | GREEN；详情页新增 `Agent 任务动作门禁说明`，显示 READY / REVIEW / BLOCKED 语义。 |
| State coverage | GREEN；runtime smoke 覆盖 completed、pending、running、terminal missing output、unknown status。 |
| Action reason visibility | GREEN；启动、取消、扫描报告、对话和复盘输出原因直接可见。 |
| Raw payload safety | GREEN；任务 input/output 与 step output 继续默认隐藏，仅展示安全边界和审计/产物入口。 |
| 可读性 | GREEN；action gate reason 和检查格可换行、不省略、不裁切。 |
| 响应式 | GREEN；AgentTasks smoke 覆盖 `1440x900`、`390x844`、`320x740`，无 horizontal overflow。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 action gate state machine、DOM/CSS、responsive grid 和 smoke marker。 |
| 验证 | GREEN；static UI gate、frontend build、focused AgentTasks smoke PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Beauvoir / 019f38ef-f83d-7ff0-8dc5-614dc66df04d` 首轮 PASS，runtime coverage 补强后二轮 PASS。 |
| 不可宣称项 | YELLOW；不代表后端 AgentTask 状态机、真实 worker 执行质量、全站 AgentChat/AutoRepair 或 full release authority 完成。 |

状态：GREEN for focused P9/P10/P11 AgentTasks action gate reason visibility；Frontend review PASS。

## 200. 2026-07-07 P9/P10/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| ExecutionTasks action gate | GREEN；详情页新增 `执行任务动作门禁说明`，显示 READY / REVIEW / BLOCKED 语义。 |
| State coverage | GREEN；runtime smoke 覆盖 success、running、failed with evidence、failed missing evidence、cancelled、unknown status。 |
| Action reason visibility | GREEN；取消、来源跳转、步骤/日志、产物、失败复盘和终态结论原因直接可见。 |
| Log safety | GREEN；LogViewer display redaction 继续证明 bearer/apiKey/password/JWT 不进入页面和 marker。 |
| 可读性 | GREEN；action gate reason、检查格、详情证据、步骤和日志可换行、不省略、不裁切。 |
| 响应式 | GREEN；ExecutionTasks smoke 覆盖 `1440x900`、`390x844`、`320x740`，无 horizontal overflow。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 action gate state machine、DOM/CSS、responsive grid、smoke marker 和日志脱敏边界。 |
| 验证 | GREEN；static UI gate、frontend build、focused ExecutionTasks smoke PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Rawls / 019f38fd-1a36-7f71-9b12-8b80d5e47f1e` 首轮 PASS，runtime coverage 补强后二轮 PASS。 |
| 不可宣称项 | YELLOW；不代表后端 ExecutionTask 状态机、后端日志存储/API 脱敏、真实 worker 执行质量、全站任务流水线或 full release authority 完成。 |

状态：GREEN for focused P9/P10/P11 ExecutionTasks action gate reason visibility；Frontend review PASS。

## 201. 2026-07-07 P9/P10/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| AgentChat closure gate | GREEN；closure rail 新增 `Agent 闭环动作门禁说明`，显示审计、AgentTask、扫描报告入口为什么开放或关闭。 |
| State coverage | GREEN；runtime smoke 覆盖 no-active、linked ready、handoff ready、unbound、loading、task-error、missing-task-detail、no-scan。 |
| Action reason visibility | GREEN；工具审计、AgentTask、扫描报告三类动作都有可见 reason；缺 scanTaskId 或任务详情失败时扫描报告按钮关闭。 |
| Handoff safety | GREEN；code-understanding handoff 仍保持 structured input、PENDING AgentTask、手动发送、不自动启动、不存 raw prompt。 |
| 可读性 | GREEN；closure gate reason 和检查格可换行、不省略、不裁切。 |
| 响应式 | GREEN；AgentChat smoke 覆盖 `1440x900`、`320x740`，无 horizontal overflow。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 closure gate DOM/CSS、runtime branch marker、linked/handoff task id 区分和不可宣称项。 |
| 验证 | GREEN；static UI gate、frontend build、focused AgentChat smoke PASS。 |
| 岗位复核 | GREEN；扎克伯格 / Frontend Engineer runtime `Aristotle / 019f390c-511b-7c50-9651-a6adafdb530e` 首轮 PARTIAL 后已补强，二轮复核 PASS。 |
| 不可宣称项 | YELLOW；不代表后端 AgentChat/AgentTask 状态机、真实 LLM provider、全站 Agent 闭环、AutoRepair 或 full release authority 完成。 |

状态：GREEN for focused P9/P10/P11 AgentChat closure rail action gate reason visibility；Frontend review PASS after PARTIAL。

## 202. 2026-07-07 P6/P10/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Code QA readiness API | GREEN；`claimCitationCoverage` 暴露 `readyForRepair`、`readinessReason`、`readinessNote`。 |
| Repair gate strictness | GREEN；PRIMARY-bound 完整闭环才允许 `PRIMARY_BOUND_READY`；context-only、unknown-only、invalid、uncited 和不完整文件闭环均不放行。 |
| Frontend consumption | GREEN；ProjectDetail 优先使用后端 readiness 字段，旧数据 fallback 到严格 roleDistribution/count/file checks。 |
| Audit visibility | GREEN；claim citation audit 展示后端 readiness note、修复门禁和原因码。 |
| API contract | GREEN；`API_DESIGN.md` 已同步新增字段，并明确 `status=READY` 不能单独授权 AutoRepair。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 API 类型、helper、门禁和审计展示字段。 |
| 验证 | GREEN；`CodeQaControllerTest`、static UI gate、frontend build PASS。 |
| 岗位复核 | GREEN；拉里佩奇 / QA Engineer runtime `Euclid / 019f391d-8f57-76c0-8a90-1d6aceed456c` PASS，UNKNOWN_ONLY 单测建议已关闭。 |
| 不可宣称项 | YELLOW；不证明 LLM 事实质量、真实 patch 质量、AutoRepair 服务端候选创建全链路或 full release authority 完成。 |

状态：GREEN for focused P6/P10/P11 Code QA claim citation repair readiness API；QA review PASS。

## 203. 2026-07-07 P6/P10/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Release evidence readiness gate | GREEN；public repo smoke/verifier 现在要求 `readyForRepair=true && PRIMARY_BOUND_READY`，不再只凭 `status=READY`。 |
| Code QA marker strictness | GREEN；`PUBLIC_REPO_SMOKE_OK codeQa.claimCitationCoverage` 必须包含单数 readiness 字段并被 verifier 校验。 |
| UI QA marker strictness | GREEN；`PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence.claimCitationCoverage` 必须聚合 `readyForRepair` 和唯一 `PRIMARY_BOUND_READY`。 |
| Context-only drift boundary | GREEN；`fileAnchorDrift.claimCitationCoverage` 明确 `status=READY` 但 `readyForRepair=false`、`CONTEXT_ONLY_CLAIM`，阻止 context-only 证据进入修复候选。 |
| Forgery regression | GREEN；security regression 覆盖缺失 readiness、false readiness、context-only reason 伪造。 |
| 回归门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 smoke marker、release verifier、security regression readiness 字段。 |
| 验证 | GREEN；static UI gate、shell syntax、`public-repo-ui-marker`、`report-evidence-marker` focused security suites PASS。 |
| 不可宣称项 | YELLOW；不代表真实公开仓库 full E2E、真实 LLM 事实质量、AutoRepair patch 质量或 full release authority 完成。 |

状态：GREEN for focused P6/P10/P11 claim citation readiness release evidence gate。

## 204. 2026-07-07 P6/P9/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| code_chunks status contract | GREEN；新增 `/code-chunks/status`，ProjectDetail / ScanTaskDetail 不再用 `/search` 读取状态。 |
| 大仓库状态性能 | GREEN；真实 MySQL 17,001 chunks 状态接口由约 6-7s 降到 `0.385s / 0.020s`。 |
| 空 query fallback 性能 | GREEN；`/search?query=&limit=1/24` 由约 10s 降到 `0.066s / 0.039s`。 |
| UI 稳定性 | GREEN；public repo UI smoke 覆盖移动端报告证据抽屉，未再出现 code knowledge 网络异常。 |
| 回归门禁 | GREEN；CodeChunkControllerTest、frontend build、static UI gate、完整 public repo smoke PASS。 |
| 发布证据 | GREEN；`PUBLIC_REPO_SMOKE_OK` 和 `PUBLIC_REPO_UI_SMOKE_OK` 同轮通过，scanTaskId=290。 |
| 不可宣称项 | YELLOW；不代表 GitHub App、私有仓库、真实 LLM provider、多人协作或生产部署完成。 |

状态：GREEN for focused P6 code_chunks status performance and public repo live gate。

## 205. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| 跨文件检索质量 | GREEN；backend-flow intent 下，同业务域 token 会参与最终候选排序，降低角色词噪声抢占主证据的概率。 |
| 证据组合质量 | GREEN；主证据选中后，优先补齐同业务域的 controller/service/data-access/domain-model 邻接证据。 |
| 噪声控制 | GREEN；`trace/backend/flow` 和 controller/service/repository 等流程/角色词不再被当作业务域 token。 |
| 回归门禁 | GREEN；`CodeQaRetrievalServiceTest` 新增同业务域 backend-flow 邻接用例，并保持 51 tests PASS。 |
| 不可宣称项 | YELLOW；这是启发式检索增强，不等价于静态调用图、真实事实判定、完整跨文件依赖证明或 full release authority。 |

状态：GREEN for focused P6 backend-flow same-domain retrieval neighbors。

## 206. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| 图谱关系解释 | GREEN；Code QA 在已有 symbol/relation graph 直接关系时，会把 related chunk 加入 `ADJACENT_CONTEXT` 并在 `evidenceReason` 写入 `Graph relation: source RELATION target`。 |
| 跨文件证据可信度 | GREEN；controller -> service `CALLS` happy path 已覆盖，`retrievedChunks` 和 `answerCitations` 均暴露 relation reason。 |
| 降级边界 | GREEN；empty graph fallback 已覆盖，图谱为空时 resultCount 不增加且不出现 `Graph relation`。 |
| 回归门禁 | GREEN；`CodeQaControllerTest` 90 tests PASS。 |
| QA 复核 | GREEN after PARTIAL；拉里佩奇 / QA Engineer runtime `Noether / 019f396e-3df4-7ed0-a671-f7380762b83c` 指出的文档和 empty graph fallback 缺口已关闭。 |
| 不可宣称项 | YELLOW；不代表完整静态调用图、多跳调用链、跨语言精确分析、真实 LLM 事实质量或 full release authority。 |

状态：GREEN for focused P6 relation-aware Code QA evidence reason；QA PARTIAL closed。

## 207. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Release evidence visibility | GREEN；`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.relationAwareEvidenceReason` 已输出 graph relation reason 计数、相邻上下文和 UI 可见性。 |
| UI evidence proof | GREEN；report evidence QA citation smoke 断言引用证据卡可见 `Graph relation: ChatController CALLS ChatService.`。 |
| Verifier strictness | GREEN；`verify-release-evidence.sh` 强制校验 relation-aware marker 的状态、marker、计数、adjacent/UI 可见性和 no-overclaim 字段。 |
| Forgery regression | GREEN；security regression 覆盖缺失、状态失败、marker 伪造、计数为 0、adjacent/UI 隐藏、provider overclaim 和 raw field。 |
| 静态门禁 | GREEN；`validate-frontend-ui.mjs` 锁住 smoke、verifier 和 security regression 合同。 |
| 验证 | GREEN；shell syntax、static UI gate、focused report evidence QA citation smoke、focused release-verifier report evidence marker suite PASS。 |
| 不可宣称项 | YELLOW；这是 mocked report evidence release contract，不证明真实公开仓库每次都会生成 graph relation，也不代表 full release authority。 |

状态：GREEN for focused P6/P11 relation-aware QA citation release evidence gate。

## 208. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Public repo relation marker truthfulness | GREEN；`PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.relationAwareEvidenceReason` 只在真实 QA response 出现 `Graph relation:` 时输出，不固定伪造。 |
| Optional-present strictness | GREEN；任一 viewport 出现 relation reason 时，所有 viewport 都必须证明该 marker，否则 smoke 失败。 |
| Evidence binding | GREEN；marker 证明 citation/chunk reason 计数、`ADJACENT_CONTEXT` 可见、已引用 PRIMARY 证据仍存在。 |
| UI proof | GREEN；smoke 断言页面可见 `Graph relation:`。 |
| Verifier strictness | GREEN；release verifier 对可选 marker 执行 surface、marker、计数、adjacent、primary、UI 和 no-overclaim 校验。 |
| Forgery regression | GREEN；security regression 覆盖状态、surface、marker、计数、adjacent、primary、UI、provider/LLM overclaim 和 raw field 伪造。 |
| 验证 | GREEN；shell syntax、static UI gate、public repo UI smoke `--list`、focused public repo UI marker security suite PASS。 |
| 不可宣称项 | YELLOW；optional-present strict 不证明真实公开仓库每轮都会产生 graph relation，不代表 full release authority 或完整静态调用图完成。 |

状态：GREEN for focused P6/P11 public repo relation-aware evidence optional-present strict gate。

## 209. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Java relation density | GREEN；`JavaAstParser` 现在能从字段、构造参数、方法参数和局部变量推导显式 scope 方法调用。 |
| CALLS relation alignment | GREEN；source 使用当前方法 symbol id，target 使用目标类方法 symbol id，与 `METHOD` symbol 格式对齐。 |
| Noise control | GREEN；仅解析 `variable.method()` / `this.variable.method()`，并对重复 source/target 去重。 |
| Code QA readiness | GREEN；该 relation 可被后续 `CodeQaController` relation-aware expansion 读取，用于真实 `Graph relation:` evidence reason。 |
| 回归门禁 | GREEN；`JavaAstParserTest`、`JavaFallbackAnalyzerTest`、`CodeGraphPersistenceServiceTest` PASS。 |
| 不可宣称项 | YELLOW；不代表完整静态调用图、接口实现解析、动态分派、多跳调用链、真实 LLM 事实质量或 full release authority 完成。 |

状态：GREEN for focused P6 Java AST scoped method CALLS relation density。

## 210. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Interface implementation resolution | GREEN；`JavaFallbackAnalyzer` 基于全项目 `IMPLEMENTS` relation 识别接口唯一实现类。 |
| Concrete CALLS binding | GREEN；接口方法 `CALLS` 会在唯一实现且同名方法存在时补充 implementation method `CALLS`。 |
| Ambiguity control | GREEN；多实现接口不会猜测具体实现，避免错误 relation 污染 graph。 |
| Persistence readiness | GREEN；补充 relation 同步进入 scan result JSON 和 parsed AST cache，可被 `CodeGraphPersistenceService` 落库。 |
| 回归门禁 | GREEN；唯一实现正例、多实现负例、parser scoped CALLS、persistence focused tests PASS。 |
| 不可宣称项 | YELLOW；不代表 Spring runtime bean 解析、qualifier/profile/primary/factory bean、动态分派、多跳调用链或 full release authority 完成。 |

状态：GREEN for focused P6 Java AST unique implementation CALLS relation resolution。

## 211. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Intra-class flow density | GREEN；`JavaAstParser` 现在能把 `helper()` 和 `this.helper()` 解析为同类方法 `CALLS` relation。 |
| Noise control | GREEN；只有目标方法名存在于当前类声明时才补关系，静态导入函数不会被猜测成本类方法。 |
| Code QA readiness | GREEN；类内 helper 执行流可被后续 relation-aware evidence 使用，降低报告引用只看到入口方法、看不到内部处理步骤的概率。 |
| 回归门禁 | GREEN；`JavaAstParserTest` 覆盖同类 helper 正例和静态导入负例。 |
| 不可宣称项 | YELLOW；仍不区分方法重载参数，不代表完整静态调用图、动态分派、多跳调用链或 full release authority 完成。 |

状态：GREEN for focused P6 Java AST same-class helper CALLS relation density。

## 212. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Static utility relation density | GREEN；`JavaAstParser` 现在能把显式 import 的项目内 `ClassName.method()` 解析为跨文件 `CALLS`。 |
| Noise control | GREEN；只接受非 static、非 wildcard import，并要求与当前 package 共享前两段包根；外部 `java.util.Objects` 不进入项目 graph。 |
| Code QA readiness | GREEN；mapper/factory/converter 等静态工具调用可被后续 relation-aware evidence 使用，提升跨文件证据解释能力。 |
| 回归门禁 | GREEN；`JavaAstParserTest` 覆盖项目 import 正例和外部 import 负例。 |
| 不可宣称项 | YELLOW；不代表 wildcard/static import、完整 FQCN、构建模块边界、动态分派、多跳调用链或 full release authority 完成。 |

状态：GREEN for focused P6 Java AST imported project static class CALLS relation density。

## 213. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Persistence readiness | GREEN；scoped service、same-class helper、imported project static class 三类 AST `CALLS` 已证明能进入 `CodeRelationMapper.insertBatch`。 |
| ScanTask binding | GREEN；持久化 relation 继承当前 `scanTaskId`，后续 GraphService / Code QA 可按扫描任务隔离消费。 |
| Fixture quality | GREEN；测试使用 `JavaAstParser` 真实解析 Java 文件，不是手写 relation fixture。 |
| 回归门禁 | GREEN；`CodeGraphPersistenceServiceTest` focused PASS。 |
| 不可宣称项 | YELLOW；mock mapper gate 不等价于真实 MySQL public repo scan、GraphService UI、Code QA marker 或 full release authority。 |

状态：GREEN for focused P6/P11 Java AST CALLS persistence gate。

## 214. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Graph observability | GREEN；新增 `CODE_RELATION_QUALITY_OK` marker，可量化 symbol、relation、CALLS 和 method match 质量。 |
| Fail-closed gate | GREEN；`SOURCELENS_RELATION_QUALITY_MIN_CALLS=1` 在当前旧扫描 `CALLS=0` 时正确失败。 |
| Secret hygiene | GREEN；marker 不输出 DB password、token、secret 或 raw code content。 |
| Current baseline | YELLOW；当前本地最新 `scanTaskId=290` 为旧扫描，`callCount=0`，需要重新 public repo scan 才能评估新增 analyzer 效果。 |
| 回归门禁 | GREEN；shell syntax、Makefile dry-run、真实只读 marker、阈值 fail-closed 均 PASS。 |
| 不可宣称项 | YELLOW；该工具不证明 GraphService UI、Code QA marker、真实 LLM 事实质量或 full release authority。 |

状态：GREEN for P6/P11 code relation quality marker；current DB baseline CALLS=0。

## 215. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Live relation density | GREEN；真实公开仓库重新扫描后，最新 `scanTaskId=291` 产生 `CALLS=2962`，不再停留在旧 `scanTaskId=290 / CALLS=0`。 |
| Method match quality | YELLOW；去重 edge 口径下 `callTargetMethodMatchPercent=40`，满足 P6 focused gate 当前最低阈值 `40`，但还不能宣称高质量调用图。 |
| Gate strictness | GREEN；新增 `make code-relation-quality-p6`，默认要求 `CALLS >= 1` 且 target method match percent >= 40，防止 relation graph 回退为 0 仍通过。 |
| Evidence hygiene | GREEN；marker 不输出 secret/raw code，并明确 `providerQualityClaim=false`、`llmFactClaim=false`。 |
| Marker correctness | GREEN；source/target method match 改为按唯一 relation edge 计数，避免重复 `METHOD symbol_id` 造成百分比超过 100。 |
| Remaining analysis gap | YELLOW；`methodSymbolDuplicateGroups=138`、`unresolvedCallTargets=1771` 仍需后续分桶，不能宣称完整静态调用图或真实 LLM 事实质量。 |

状态：GREEN for P6/P11 live code relation density gate；YELLOW for relation quality completeness。

## 216. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| JDK simple type normalization | GREEN；`String`、`Object`、`Map`、`List`、`Set`、`Iterator`、`Optional`、`Date`、`BigDecimal` 等常见类型不再默认拼成当前 package。 |
| False project-like target reduction | GREEN；真实公开仓库重新扫描后，`unresolvedProjectLikeJdkSimpleTypeCallTargets` 从 `575` 降到 `53`。 |
| Project-like unresolved reduction | GREEN；`unresolvedProjectLikeCallTargets` 从 `1175` 降到 `638`。 |
| Marker observability | GREEN；relation marker 已输出 known external、project-like、JDK simple-type 和 other unresolved 分桶。 |
| Remaining quality gap | YELLOW；`callTargetMethodMatchPercent=40` 未提升，`methodSymbolDuplicateGroups=138` 与剩余 project-like unresolved 仍需后续治理。 |

状态：GREEN for JDK simple-type false target reduction；YELLOW for full relation quality。

## 217. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Duplicate method symbols | GREEN；真实公开仓库重新扫描后，`methodSymbolDuplicateGroups` 从 `138` 降到 `0`。 |
| Symbol table noise | GREEN；`symbolCount 15727 -> 15586`，`methodSymbolCount 2360 -> 2219`，重载方法不再制造重复 name-level symbol。 |
| Schema honesty | GREEN；本轮没有伪装签名级图谱，明确保留 name-level method symbol 边界。 |
| Remaining relation quality | YELLOW；`callTargetMethodMatchPercent=40` 未提升，剩余 `unresolvedProjectLikeCallTargets=638` 仍需治理。 |

状态：GREEN for overloaded method symbol dedup；YELLOW for target relation quality。

## 218. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Wildcard/JDK external type normalization | GREEN；`java.io.*`、`java.util.*` 等 wildcard import 下的 `File`、`Entry`、`Class`、`Calendar` 等类型不再默认拼成当前业务 package。 |
| False project-like target reduction | GREEN；真实公开仓库重新扫描后，`unresolvedProjectLikeJdkSimpleTypeCallTargets` 从 `53` 降到 `0`。 |
| Project-like unresolved reduction | GREEN；`unresolvedProjectLikeCallTargets` 从 `638` 降到 `512`。 |
| Symbol table stability | GREEN；`methodSymbolDuplicateGroups=0` 保持不回退。 |
| Remaining relation quality | YELLOW；`callTargetMethodMatchPercent=40` 未提升，剩余 `512` 个 project-like unresolved 仍需后续治理。 |

状态：GREEN for wildcard/JDK false target reduction；YELLOW for full relation quality。

## 219. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Lombok accessor symbol coverage | GREEN；`@Data/@Getter/@Setter` instance fields 现在生成 getter/setter method symbols，static fields 不生成，final fields 不生成 setter。 |
| Target method match | GREEN；真实公开仓库重新扫描后，`callTargetMethodMatchPercent` 从 `40` 提升到 `46`。 |
| Project-like unresolved reduction | GREEN；`unresolvedProjectLikeCallTargets` 从 `512` 降到 `317`。 |
| Entity getter/setter bucket | GREEN；entity getter/setter unresolved 从 `196` 降到 `4`。 |
| Gate ratchet | GREEN；`make code-relation-quality-p6` 默认阈值从 `40` 上调到 `45`，`47` 阈值 fail-closed。 |
| Remaining relation quality | YELLOW；剩余 project-like unresolved 主要集中在 MyBatis-Plus `IService` 继承 CRUD 方法，仍需单独治理。 |

状态：GREEN for Lombok accessor relation quality improvement；YELLOW for inherited service CRUD coverage。

## 220. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| MyBatis-Plus inherited CRUD coverage | GREEN；明确 `extends IService<T>` 的 service interface 现在生成 inherited framework method symbols。 |
| False framework match control | GREEN；本地同名 `IService` 不会被误判为 MyBatis-Plus。 |
| Target method match | GREEN；真实公开仓库重新扫描后，`callTargetMethodMatchPercent` 从 `46` 提升到 `56`。 |
| Project-like unresolved reduction | GREEN；`unresolvedProjectLikeCallTargets` 从 `317` 降到 `36`。 |
| Service inherited CRUD bucket | GREEN；`service_inherited_crud` unresolved 从 `272` 降到 `0`。 |
| Gate ratchet | GREEN；`make code-relation-quality-p6` 默认阈值从 `45` 上调到 `55`，`57` 阈值 fail-closed。 |
| Remaining relation quality | YELLOW；剩余 36 个 project-like unresolved 主要是 catch parameter/local type scope、CommonService package resolution、annotation/session 类型。 |

状态：GREEN for MyBatis-Plus inherited CRUD relation quality improvement；YELLOW for remaining scoped type resolution.

## 221. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Project-like unresolved closure | GREEN；真实公开仓库重新扫描 `scanTaskId=299` 后，`unresolvedProjectLikeCallTargets` 从 `36` 降到 `0`。 |
| Scoped/JDK/project type resolution | GREEN；catch parameter、`CommonService` wildcard package disambiguation、websocket `Session`、annotation member 和 `IllegalAccessException` 均有 focused test 覆盖。 |
| Target method match | GREEN；`callTargetMethodMatchPercent=56`，P6 gate 默认阈值从 `55` 上调到 `56`。 |
| Gate strictness | GREEN；`SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT=57` 对 `scanTaskId=299` fail-closed。 |
| Public repo chain | GREEN；public repo smoke `scanTaskId=299` PASS，覆盖 code chunks、method anchor retrieval、Code QA、report evidence QA citation、artifact quality 和 DB counts。 |
| Remaining quality gap | YELLOW；`unresolvedKnownExternalCallTargets=1305` 与 `unresolvedOtherCallTargets=7` 仍不等于完整 Java type solver 或外部库方法图谱。 |

状态：GREEN for P6 project-like unresolved closure；YELLOW for full static analysis completeness.

## 222. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Required citation coverage semantics | GREEN；后端新增 `REQUIRED_FULL`，区分必需主证据闭环和全部候选证据覆盖。 |
| Partial safety boundary | GREEN；仍有未引用必需主证据/必需主张时保持 `PARTIAL`，不会被误升级。 |
| Frontend trust signal | GREEN；QA evidence 和 cross-file citation summary 将 `REQUIRED_FULL` 作为 required evidence satisfied，同时保留 context gap review signal。 |
| Public repo chain | GREEN；public repo smoke `scanTaskId=300` PASS，覆盖 Code QA、claim citation noise boundary、semantic pool probe、report evidence QA citation、artifact quality 和 DB counts。 |
| Remaining quality gap | YELLOW；`REQUIRED_FULL` 不等于 `FULL`，total candidate citation coverage 和 weak-keyword/embedding coverage 仍需后续增强。 |

状态：GREEN for required evidence citation readiness semantics；YELLOW for full Code QA retrieval/citation quality completeness.

## 223. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Weak keyword no-embedding fallback | GREEN；`scanTaskId=302` 的 4 个 weak keyword case 均触发 representative stable fallback，`representativeFallbackHits=4`。 |
| Documentation false primary control | GREEN；smoke 已 fail-closed 检查 `DOCUMENTATION`、`README.md`、`/docs/` 不能作为 no-embedding stable fallback primary。 |
| Code-oriented primary evidence | GREEN；4 个 case primary 均为 `CONTROLLER`，`representativeFallbackPrimary=true`。 |
| Public repo chain | GREEN；public repo smoke `scanTaskId=302` PASS，覆盖 Code QA、report evidence QA citation、semantic pool probe、artifact quality 和 DB counts。 |
| Remaining quality gap | YELLOW；无 embeddings 时 weak keyword eval 仍为 `INCONCLUSIVE/no_embeddings`，本轮不证明语义召回或更细意图到角色排序完成。 |

状态：GREEN for representative code fallback safety；YELLOW for full weak keyword semantic retrieval quality.

## 224. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Intent-aware fallback ranking | GREEN；representative fallback 已支持 query-driven role priority，默认无意图路径保持原优先级。 |
| Public repo weak keyword role gate | GREEN；`scanTaskId=304` 的 4 个 weak keyword case 均通过 expected role 校验。 |
| Role results | GREEN；`worker-tools-policy=SERVICE`、`shell-safety-policy=SERVICE`、`query-run-config=CONFIG`、`feature-flag-data=DATA_ACCESS`。 |
| Evidence type fallback | GREEN；smoke 可从 file path 推断 `representativeFallbackRole`，避免 `SOURCE` 泛化掩盖配置代码。 |
| Remaining quality gap | YELLOW；仍是 deterministic fallback，不等于 embedding semantic retrieval、复杂 query planning 或真实 provider answer quality。 |

状态：GREEN for weak keyword intent role fallback；YELLOW for full semantic retrieval quality.

## 225. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Retrieval plan API | GREEN；Code QA response 已暴露 `retrievalPlan.tokens/roleIntents/fallbackRolePriority/auxiliaryHintsPresent/fallbackReason`。 |
| Plan/result alignment | GREEN；主关键词无命中但存在辅助候选时，实际候选排序改用 representative fallback priority，避免 explainability 与结果脱节。 |
| Smoke gate | GREEN；public repo weak keyword eval 已校验 stable fallback 的 `fallbackRolePriority` 与 `fallbackReason`，`scanTaskId=305` PASS。 |
| Frontend contract | GREEN；`web-console/src/api/project.ts` 已承接 retrievalPlan 类型，`validate-frontend-ui` PASS。 |
| Remaining quality gap | YELLOW；`retrievalPlan` 是 deterministic explanation，不等于完整 semantic query planner、embedding coverage 或真实 LLM answer quality。 |

状态：GREEN for retrieval plan explainability；YELLOW for full semantic retrieval quality.

## 226. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Graph flow primary citation | GREEN；flow/call-chain 问题下 graph relation chunk 会进入 PRIMARY evidence set。 |
| Evidence reason visibility | GREEN；被提升为 PRIMARY 的 relation chunk 仍展示 `Graph relation:`。 |
| Fallback citation completeness | GREEN；无 LLM fallback answer 现在引用全部 PRIMARY labels，不再只引用第一个主证据。 |
| Public repo chain | GREEN；真实公开仓库 `scanTaskId=306` PASS，`codeQa.citationCoverage.status=REQUIRED_FULL`，primary evidence file 4/4 cited。 |
| Verifier compatibility | GREEN；release verifier 已接受 `FULL/REQUIRED_FULL/PARTIAL`。 |
| Remaining quality gap | YELLOW；这是 bounded flow intent + direct relation gate，不等于完整调用图、动态分派、多跳关系或真实 provider 质量。 |

状态：GREEN for graph flow required citation coverage；YELLOW for full relation-aware reasoning quality.

## 227. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Relation-aware prompt | GREEN；flow/call-chain 问题存在 `Graph relation:` PRIMARY 证据时，system prompt 明确要求优先使用这些关系证据。 |
| Prompt evidence metadata | GREEN；prompt chunk 现在展示 `Context role`、`Evidence type`、`Relevance score`、`Evidence reason` 和 matched terms。 |
| Retry citation repair | GREEN；retry prompt 的 evidence list 包含 reason，避免引用修正时丢失 graph relation 来源。 |
| Security review | GREEN；`奥特曼 / Security Engineer` 复核确认没有新增 raw prompt/raw evidence 持久化风险，PromptInjectionGuard 边界仍合理。 |
| QA review | GREEN；`拉里佩奇 / QA Engineer` 复核确认 active LLM prompt capture 测试覆盖 graph relation instruction 进入 LLM。 |
| Public repo chain | GREEN；真实公开仓库 `scanTaskId=307` PASS，Code QA required primary coverage 和 report evidence QA citation 继续通过。 |
| Remaining quality gap | YELLOW；prompt 约束不等于真实 provider 质量证明，也不覆盖多跳调用链、动态分派或完整 query planner。 |

状态：GREEN for relation-aware graph prompt grounding；YELLOW for full provider/reasoning quality.

## 228. 2026-07-07 P6/P11 focused quality update

| 维度 | 当前状态 |
| --- | --- |
| Relation-aware retrieval plan | GREEN；Code QA response 已输出 `crossFileIntentPresent`、`graphRelationEvidencePresent`、`graphRelationPrimaryLabels` 和 `graphRelationEvidenceCount`。 |
| Positive/negative backend coverage | GREEN；测试覆盖有 graph relation、无 graph relation、stable fallback 三类 retrievalPlan 状态。 |
| Public repo smoke contract | GREEN；smoke 校验字段类型和自洽性，并把结果写入 `PUBLIC_REPO_SMOKE_OK.codeQa.retrievalPlan`。 |
| Live public repo behavior | GREEN；`scanTaskId=308` 中 cross-file intent 为 true，但 graph relation evidence 为 false/0/[]，未伪造 relation marker。 |
| API/frontend contract | GREEN；`docs/API_DESIGN.md` 和 `web-console/src/api/project.ts` 已同步。 |
| Remaining quality gap | YELLOW；该字段是检索计划审计，不证明完整调用链、多跳关系、真实 provider 质量或事实正确性。 |

状态：GREEN for relation-aware retrieval plan auditability；YELLOW for full query planning/provider quality.

## 229. 2026-07-07 P6/P11 Code QA query strategy and embedding coverage audit fields

| Area | Status |
| --- | --- |
| Query strategy observability | GREEN；Code QA response 已输出 `retrievalPlan.queryStrategy`。 |
| Embedding coverage observability | GREEN；Code QA response 已输出 question embedding、coverage percent/status 和 semantic pool 加载状态。 |
| Backend focused coverage | GREEN；测试覆盖 no LLM fallback、intent fallback、semantic fallback 和 backend flow strategy。 |
| API/static contract | GREEN；`docs/API_DESIGN.md`、前端类型和 public repo smoke 静态校验已同步。 |
| Live public repo behavior | GREEN；`scanTaskId=309` 真实 smoke 输出 query strategy、embedding coverage 和 semantic plan reason，字段类型和自洽性通过。 |
| Remaining quality gap | YELLOW；semantic pool 仍不是向量索引，不能证明大仓库召回充分。 |

状态：GREEN for query/semantic plan auditability；YELLOW for production vector recall.

## 230. 2026-07-07 P6 Code QA distributed semantic pool

| Area | Status |
| --- | --- |
| Large embedded repo pool coverage | GREEN；embedded chunk 超过 pool limit 时 semantic pool 改为 head + distributed windows。 |
| API observability | GREEN；`retrievalPlan.semanticPoolStrategy` 暴露 `NOT_ATTEMPTED` / `HEAD_ONLY` / `HEAD_DISTRIBUTED_WINDOWS`。 |
| Focused tests | GREEN；服务层覆盖分布式窗口，controller 覆盖主问答路径策略字段。 |
| QA follow-up | GREEN；拉里佩奇指出的 Controller 大池策略缺口和 offset 分布断言已补。 |
| Compact tail boundary | GREEN；真实 smoke 暴露 501 embedding 边界后已修复窗口重叠，target rank 501 场景 `semanticPoolLoadedCount=500`。 |
| Public smoke probe | GREEN；真实公开仓库 `scanTaskId=311` PASS，`semanticPoolStrategy=HEAD_DISTRIBUTED_WINDOWS`，`embeddedChunks=501`，`chunks=17001`。 |
| Remaining quality gap | YELLOW；仍不是向量索引，不能证明 production recall。 |

状态：GREEN for bounded pool coverage improvement；YELLOW for true vector retrieval.

## 231. 2026-07-07 P6/P11 Code QA semantic pool coverage diagnostics

| Area | Status |
| --- | --- |
| API observability | GREEN；`retrievalPlan.semanticPoolTruncated` 和 `semanticPoolCoveragePercent` 已暴露。 |
| Backend focused coverage | GREEN；测试覆盖未尝试 semantic pool 和大池部分加载截断场景。 |
| Smoke contract | GREEN；public repo smoke 静态 gate 校验字段类型、自洽性和 semantic pool probe 截断状态；QA 打回后已改为 coverage 公式校验。 |
| Frontend contract | GREEN；`web-console/src/api/project.ts` 已同步类型。 |
| QA follow-up | GREEN；`Darwin = 拉里佩奇 / QA Engineer` 指出的固定 `>=99` 阈值风险已关闭。 |
| Live public repo behavior | GREEN；`scanTaskId=312` PASS，`semanticPoolTruncated=true`，`semanticPoolCoveragePercent=100`，`semanticPoolLoadedCount=500`，`embeddedChunks=501`。 |
| Remaining quality gap | YELLOW；该字段只是候选池覆盖诊断，不是向量召回质量评分。 |

状态：GREEN for semantic pool boundary observability；YELLOW for production vector retrieval.

## 232. 2026-07-07 P6/P11 Code QA cross-file evidence coverage diagnostics

| Area | Status |
| --- | --- |
| API observability | GREEN；`retrievalPlan.crossFileEvidenceSatisfied`、`crossFilePrimaryFileCount` 和 `crossFileEvidenceStatus` 已暴露。 |
| Backend focused coverage | GREEN；测试覆盖非跨文件 `NOT_APPLICABLE`、关系证据跨文件 `SATISFIED`、有跨文件意图但单 PRIMARY 文件 `SINGLE_PRIMARY_FILE`。 |
| Smoke contract | GREEN；public repo smoke 静态 gate 校验 boolean 等价关系和 status 唯一映射，防止字段只类型正确但语义漂移。 |
| Frontend contract | GREEN；`web-console/src/api/project.ts` 已同步类型。 |
| QA follow-up | GREEN；`Maxwell = 拉里佩奇 / QA Engineer` 初始 PARTIAL 指出 smoke 状态机偏松；已打回修复并复核 PASS。 |
| Live public repo behavior | GREEN；`scanTaskId=313` PASS，`crossFileIntentPresent=true`、`crossFileEvidenceSatisfied=true`、`crossFileEvidenceStatus=SATISFIED`、`crossFilePrimaryFileCount=4`。 |
| Remaining quality gap | YELLOW；该字段只证明当前响应 PRIMARY 文件覆盖，不证明完整调用链、多跳关系、动态分派或真实 provider 事实正确。 |

状态：GREEN for cross-file evidence coverage observability；YELLOW for full relation reasoning quality.

## 233. 2026-07-07 P6/P11 Report evidence line anchor reason visibility

| Area | Status |
| --- | --- |
| Citation reason visibility | GREEN；report evidence file+line/range 命中 PRIMARY chunk 时，retrieved chunk 和 answer citation 暴露 `Report evidence line anchor.`。 |
| False-positive boundary | GREEN；adjacent context 不携带 line-anchor reason，避免把辅助上下文伪装成报告主证据。 |
| Backend focused coverage | GREEN；focused `CodeQaControllerTest` 覆盖 line anchor、start/end-only alias 和 answer citation reason。 |
| Smoke contract | GREEN；public repo smoke 静态语法通过，且 report evidence QA sample 已加入 line-anchor reason fail-closed 检查。 |
| Security boundary | GREEN；QA 打回的 raw chunk content 和本地绝对 path 回显问题已修复，focused security regression PASS。 |
| QA review | GREEN；`Sartre = 拉里佩奇 / QA Engineer` 初始 PARTIAL，修复后复核 PASS。 |
| Live public repo behavior | GREEN；真实公开仓库 `scanTaskId=315` PASS，`lineAnchorEvidenceReasonVisibleSampleCount=4`。 |
| Remaining quality gap | YELLOW；该 reason 只解释 citation 来源，不证明真实 provider 答案事实正确或完整代码理解。 |

状态：GREEN for report evidence line-anchor reason visibility and QA security boundary；YELLOW for full provider/reasoning quality.

## 234. 2026-07-07 P6/P10/P11 Code QA raw chunk content absence smoke gate

| Area | Status |
| --- | --- |
| Smoke security boundary | GREEN locally；public repo smoke 已覆盖普通 Code QA、report evidence QA、claim noise、weak keyword eval 和 semantic pool probe 的 `retrievedChunks.content` 禁止回归。 |
| Marker evidence | GREEN locally；新增 raw content absent sample/case marker 和 `contentPreviewMaxLength`。 |
| Static validation | GREEN；shell syntax 和 Python heredoc compile PASS。 |
| Live public repo behavior | GREEN；真实公开仓库 smoke `scanTaskId=317` PASS，覆盖 Code QA、report evidence QA、claim noise、weak keyword eval 和 semantic pool probe。 |
| Remaining quality gap | YELLOW；该门禁证明 QA response 不回传 raw chunk content，不证明底层 raw access 治理或真实 provider 质量。 |

状态：GREEN for P6/P10/P11 QA response raw content absence smoke gate；底层 raw access 治理和真实 provider 质量仍是独立后续项。

## 235. 2026-07-07 P6/P10/P11 Release verifier raw chunk content absence gate

| Area | Status |
| --- | --- |
| Release verifier boundary | GREEN；`verify-release-evidence.sh` 校验 Code QA、claim noise、report evidence QA 和 weak keyword eval 的 raw content absence marker。 |
| Forgery regression | GREEN；`release-verifier-public-repo-marker` focused suite 拒绝缺失/伪造 Code QA raw marker。 |
| Semantic probe validation | GREEN when present；`semanticWeakKeywordProbe` 出现时严格校验 semantic pool 和 raw marker。 |
| Static validation | GREEN；API/UI validator、shell syntax 和 `git diff --check` PASS。 |
| Remaining quality gap | YELLOW；旧 evidence 不强制 retroactive semantic probe；真实 provider 和底层 raw access 授权仍未收口。 |

状态：GREEN for release verifier raw content absence gate；YELLOW for broader raw access governance and real provider quality.

## 236. 2026-07-07 P6/P11 Code QA semantic readiness status

| Area | Status |
| --- | --- |
| Contract clarity | GREEN；semantic readiness 使用固定 status/reason，避免前端解析自由文本。 |
| Diagnostic coverage | GREEN；覆盖 no scan/no context/no active LLM/question embedding/embedding coverage/semantic pool empty/truncated/ready。 |
| Test coverage | GREEN；focused backend test、API/UI validators、shell syntax、release verifier syntax 均通过。 |
| Live evidence | GREEN；public repo smoke `scanTaskId=318` 输出 `PUBLIC_REPO_SMOKE_OK`。 |
| Performance signal | YELLOW；live smoke 暴露 Code QA ranking 在大仓库下耗时偏高，虽最终通过，但 P6 后续必须做 ranking 性能预算。 |
| Product boundary | YELLOW；该状态不等于真实 provider 质量、不等于生产向量索引。 |

状态：GREEN for semantic readiness contract；YELLOW for ranking performance and production retrieval quality.

## 237. 2026-07-07 P6/P11 Code QA route-aware ranking prefilter

| Area | Status |
| --- | --- |
| Hot path reduction | GREEN；endpoint route ranking 先排除明显非 route chunk，减少 full previous-context scoring 面。 |
| Behavior preservation | GREEN；previous same-file `@RequestMapping + @GetMapping`、qualified route constants 和 route holder 回归通过。 |
| Regression coverage | GREEN；500 个非 route service 噪声 chunk 不进入 route-aware candidate set。 |
| Static gates | GREEN；P6 retrieval focused tests 和 shell syntax gates PASS。 |
| Live evidence | GREEN；真实 public repo smoke `scanTaskId=323` PASS，总耗时 `63s`，report evidence QA citation OK。 |
| Product boundary | YELLOW；这不是完整 benchmark，也不证明真实 provider/semantic retrieval 质量。 |

状态：GREEN for endpoint route ranking live smoke performance；YELLOW for full benchmark, real provider, and production semantic retrieval.

## 238. 2026-07-07 P6/P11 Code QA Spring mapping lookup cache

| Area | Status |
| --- | --- |
| Hotspot fix | GREEN；`SpringMappingLookup` 复用同一候选内容的 mapping literal、exact/template/composed route 和 HTTP method matching。 |
| Behavior preservation | GREEN；route constants、previous same-file context、route-aware prefilter focused tests PASS。 |
| Regression coverage | GREEN；`CodeChunkServiceTest,CodeQaRetrievalServiceTest` PASS。 |
| Static gates | GREEN；API validator、frontend UI validator、shell syntax、release/security syntax、`git diff --check` PASS。 |
| Live public repo behavior | GREEN；`scanTaskId=323` PASS，17001 chunks，`PUBLIC_REPO_SMOKE_DURATION_SECONDS=63`，`reportEvidenceQaCitationQuality.status=OK`。 |
| Remaining quality gap | YELLOW；weak keyword eval 仍 `INCONCLUSIVE`，真实 provider、生产向量索引和多仓库 benchmark 未完成。 |

状态：GREEN for P6 route ranking performance smoke；YELLOW for broader P6 retrieval maturity.

## 239. 2026-07-07 P6/P11 Weak keyword role-intent ordering

| Area | Status |
| --- | --- |
| Operational policy intent | GREEN；工具能力、危险命令、权限/安全判断类弱问题首要 role intent 为 `SERVICE`，并保留 `CONFIG/CONTROLLER`。 |
| Data loading intent | GREEN；数据加载类弱问题首要 role intent 为 `DATA_ACCESS`，并保留 `SERVICE/CONFIG`。 |
| Ordered role scoring | GREEN；role-intent score 尊重 intent 顺序，避免弱关键词命中时实际排序偏离 retrieval plan。 |
| Config evidence type | GREEN；`src/commands/config/index.ts` 和 `src/main/resources/application.yml` 归类为 `CONFIG`。 |
| Verification | GREEN；focused `CodeChunkServiceTest`、API/UI validators、shell syntax gates 和 `git diff --check` PASS；`Tesla = 拉里佩奇 / QA Engineer` 只读复核 PASS。 |
| Remaining quality gap | YELLOW；该切片是 deterministic intent ordering，不证明真实 embedding/vector retrieval、真实 provider answer quality、多仓库 benchmark 或 full release authority。 |

状态：GREEN for focused weak keyword role-intent ordering；YELLOW for production semantic retrieval quality.

## 240. 2026-07-07 P6/P11 Bounded public repo retrieval quality matrix

| Area | Status |
| --- | --- |
| Matrix gate | GREEN；新增 `p6-retrieval-quality-matrix.sh`，单仓真实公开仓库输出 `P6_RETRIEVAL_QUALITY_MATRIX_OK`。 |
| Live evidence | GREEN；`LJunP/Pawnshop-Management-System.git`，`scanTaskId=339`，`durationSeconds=103`，artifact quality OK。 |
| Weak keyword quality | GREEN；Pawnshop 领域样本 4/4 role-bound，`qualityMode=INTENT_ROLE_BOUND`。 |
| Evidence type correctness | GREEN；前端静态资源、构建文件、JS/TS command/model 源码不再误判为 CONFIG/DOMAIN_MODEL。 |
| Semantic probe stability | GREEN；probe 清理当前 scan embedding 后写入可控 mock embedding，避免后台 embedding 漂移。 |
| Regression coverage | GREEN；后端 P6 retrieval focused tests、API/UI validators、release marker security regression、`git diff --check` PASS。 |
| Remaining quality gap | YELLOW；当前是 bounded single-repo matrix，不是完整多仓库 benchmark，也不证明真实 provider quality。 |

状态：GREEN for single-repo P6 retrieval matrix；YELLOW for multi-repo/provider/production semantic retrieval maturity.

## 241. 2026-07-07 P6/P11 Two-repo retrieval matrix and Java AST raw graph closure

| Area | Status |
| --- | --- |
| Java raw scan contract | GREEN；`spring-petclinic` raw `symbols` 和 `graph.nodes` 已由 Java AST cache 回填，避免 Rust 成功但 raw graph 为空。 |
| Raw JSON stability | GREEN；Java symbol/relation raw JSON 统一为 snake_case 字段。 |
| Retrieval role fallback | GREEN；service/business intent 可回退到 controller/data access/domain model，非测试意图降权 test chunks。 |
| Blank query fallback | GREEN；blank query 使用 representative source fallback，不再优先返回 README/k8s 等低价值文档。 |
| Matrix gate | GREEN；two-repo matrix 输出 `P6_RETRIEVAL_QUALITY_MATRIX_OK`，`repoCount=2`。 |
| Live evidence | GREEN；Pawnshop `scanTaskId=347`，spring-petclinic `scanTaskId=348`，两仓 Code QA citation / artifact quality gate 均通过。 |
| Cleanup | GREEN；smoke-created active projects 清理到 0。 |
| Remaining quality gap | YELLOW；真实 provider、生产 embedding/vector retrieval、Java 14+ parser compatibility 和更大样本 benchmark 未完成。 |

状态：GREEN for two-repo bounded P6 retrieval matrix；YELLOW for full provider and production semantic retrieval maturity.

## 242. 2026-07-07 P6/P11 JavaParser Java 14+ compatibility

| Area | Status |
| --- | --- |
| Language level | GREEN；Java AST parser 固定为 `ParserConfiguration.LanguageLevel.JAVA_21`，不再使用 JavaParser 默认语言级别。 |
| Pattern matching parse | GREEN；Java 14 `instanceof RuntimeException runtimeException` fixture 可解析，不会丢弃整文件 AST。 |
| Pattern variable CALLS | GREEN；pattern variable `runtimeException.getMessage()` 可进入 CALLS relation，目标为 `java.lang.RuntimeException#getMessage()`。 |
| Regression coverage | GREEN；`JavaAstParserTest` 和 P6 focused backend tests PASS。 |
| Live public repo evidence | GREEN；spring-petclinic smoke `scanTaskId=349` PASS，raw `symbols=292`，`graphNodes=292`，DB `relations=407`，无 JavaParser `ParseProblemException`。 |
| Remaining quality gap | YELLOW；不等于完整 Java 21 语义覆盖，不含 symbol solver，不证明真实 provider/embedding quality。 |

状态：GREEN for observed Java 14 parser compatibility gap；YELLOW for full Java semantic analysis and provider-backed retrieval maturity.

## 243. 2026-07-07 P6/P11 Java AST parse diagnostics

| Area | Status |
| --- | --- |
| Parser failure visibility | GREEN；`ParseResult` 暴露 `parseSucceeded/parseErrorMessage`，解析失败不再只能靠日志发现。 |
| Raw artifact contract | GREEN；`RAW_SCAN_RESULT.java_ast_diagnostics` 暴露 total/parsed/failed Java 文件数和失败路径。 |
| Smoke gate | GREEN；public repo smoke 校验 diagnostics 字段并在失败数大于 0 时 fail-closed。 |
| Regression coverage | GREEN；坏 Java fixture 可得到 `PARTIAL` 和失败路径；正常项目 diagnostics 为 `OK`。 |
| Live public repo evidence | GREEN；spring-petclinic `scanTaskId=350`，`totalJavaFiles=48`，`parsedJavaFiles=48`，`failedJavaFiles=0`。 |
| Remaining quality gap | YELLOW；该 gate 是失败可观测性，不等于完整 Java 语义分析、symbol solver 或 provider-backed retrieval。 |

状态：GREEN for Java AST parse failure observability；YELLOW for full semantic analysis.

## 244. 2026-07-07 P6/P11 Retrieval matrix Java AST diagnostics gate

| Area | Status |
| --- | --- |
| Smoke marker contract | GREEN；`PUBLIC_REPO_SMOKE_OK.rawScanContract.javaAstDiagnostics` 带出 `failedFilePaths`，matrix 可独立校验失败路径数量。 |
| Matrix Java gate | GREEN；`generic-java` profile 强制要求 Java diagnostics 存在、`totalJavaFiles > 0`、`status=OK`、`failedJavaFiles=0`。 |
| Aggregate evidence | GREEN；matrix marker 输出 `javaAstDiagnosticsRepoCount`。 |
| Live two-repo evidence | GREEN；默认双仓 matrix PASS，`repoCount=2`，`javaAstDiagnosticsRepoCount=2`。 |
| Parser coverage | GREEN；Pawnshop 289/289 Java 文件解析成功，spring-petclinic 48/48 Java 文件解析成功。 |
| Remaining quality gap | YELLOW；当前仍是 bounded two-repo gate，不是完整生产 benchmark，也不证明真实 provider/embedding quality。 |

状态：GREEN for P6 matrix Java AST diagnostics gate；YELLOW for broader benchmark/provider maturity.

## 245. 2026-07-07 P6/P11 Java library production-source ranking gate

| Area | Status |
| --- | --- |
| Source-root parsing | GREEN；裸 `src/main/java` 可进入 `sourceRootHints` 并参与排序。 |
| TEST noise control | GREEN；非 TEST 意图下 `src/test` 不再吃 primary source boost，并被稳定降权。 |
| TEST intent preservation | GREEN；显式 `DefaultParserTest test file` 仍可优先命中 TEST 文件。 |
| Smoke gate | GREEN；`generic-java-library` profile 要求 cross-file proof 至少 2 个非 TEST 主源码文件。 |
| Live evidence | GREEN；commons-cli `scanTaskId=363/366` 均通过，`mainSourceUniqueFiles=8`，前五个 fileDistribution 均为 `src/main/java/...` SOURCE。 |
| Matrix evidence | GREEN；默认三仓 matrix PASS，`repoCount=3`，`javaAstDiagnosticsRepoCount=3`。 |
| Remaining quality gap | YELLOW；当前是 deterministic ranking/gate，不是完整 semantic query planner、真实 provider 质量证明或完整生产 benchmark。 |

状态：GREEN for Java library production-source ranking gate；YELLOW for provider/semantic benchmark maturity.

## 246. 2026-07-07 P6/P11 Five-repo JS/TS retrieval matrix

| Area | Status |
| --- | --- |
| Matrix size | GREEN；默认 P6 matrix 从 3 仓扩展到 5 仓，输出 `repoCount=5`。 |
| Profile coverage | GREEN；覆盖 `default-strong/generic-java/generic-java-library/generic-js-ts-web/generic-js-ts-library`。 |
| Language coverage | GREEN；`languageFamilyCounts={mixed:1,java:2,js-ts:2}`，`jsTsNonJavaProfileCount=2`。 |
| JS/TS source evidence | GREEN；Express `sourceUniqueFiles=9`，Axios `sourceUniqueFiles=7`，均满足最少 2 个源码文件 gate。 |
| Test path classification | GREEN；top-level `test/`、`tests/` 已归类为 TEST，不再误作 SOURCE。 |
| Candidate governance | GREEN；redux 因 dependency graph 无节点被拒绝，未进入默认矩阵。 |
| Remaining quality gap | YELLOW；当前仍不是完整生产 benchmark，不证明真实 provider、embedding provider 或向量检索质量。 |

状态：GREEN for bounded five-repo multi-language matrix；YELLOW for provider/vector benchmark maturity.

## 247. 2026-07-07 P6/P11 Matrix performance and citation trust gate

| Area | Status |
| --- | --- |
| Per-repo budget | GREEN；默认 `SOURCELENS_P6_RETRIEVAL_MATRIX_PER_REPO_MAX_SECONDS=240`，单仓超预算 fail-closed。 |
| Total budget | GREEN；默认 `SOURCELENS_P6_RETRIEVAL_MATRIX_TOTAL_MAX_SECONDS=600`，总耗时超预算 fail-closed。 |
| Live duration | GREEN；默认五仓 matrix `totalDurationSeconds=144`，`maxCaseDurationSeconds=111`。 |
| Citation coverage | GREEN；matrix 要求 `FULL/REQUIRED_FULL`，不再允许 `PARTIAL`。 |
| Claim citation | GREEN；matrix 要求 `claimCitationCoverageStatus=READY`。 |
| Evidence binding | GREEN；matrix 要求当前 scan、citation binding、claim binding 均满足。 |
| Remaining quality gap | YELLOW；当前不是生产 P95/P99 benchmark，也不证明真实 provider 或向量检索质量。 |

状态：GREEN for bounded P6 matrix performance/citation gate；YELLOW for production benchmark/provider maturity.

## 248. 2026-07-07 P6/P11 Extended eight-repo retrieval matrix

| Area | Status |
| --- | --- |
| Extended preset | GREEN；`SOURCELENS_P6_RETRIEVAL_MATRIX_PRESET=extended` 输出 `repoCount=8`。 |
| Language coverage | GREEN；`languageFamilyCounts={mixed:1,java:2,js-ts:4,python:1}`。 |
| Profile coverage | GREEN；覆盖 `default-strong/generic-java/generic-java-library/generic-js-ts-web/generic-js-ts-library/generic-js-ts-web-koa/generic-python-web/generic-js-ts-cli-library`。 |
| Python coverage | GREEN；Flask profile PASS，`pythonProfileCount=1`。 |
| CLI-library coverage | GREEN；Commander profile PASS，`cliLibraryCount=1`。 |
| Performance budget | GREEN；extended matrix `totalDurationSeconds=160`，`maxCaseDurationSeconds=102`，低于 `600/240` 预算。 |
| Candidate governance | GREEN；FastAPI dependency graph 无节点、Chalk 单文件 QA 倾向均未进入强矩阵。 |
| Remaining quality gap | YELLOW；仍不证明真实 LLM provider、真实 embedding provider、向量检索质量或生产 P95/P99。 |

状态：GREEN for extended bounded multi-language retrieval matrix；YELLOW for provider/vector/production benchmark maturity.

## 249. 2026-07-07 Product positioning and access model

| Area | Status |
| --- | --- |
| Product shape | GREEN；SourceLens 定位为本地优先、证据可追踪、可审计、可自动执行的 Agentic Engineering Intelligence Platform。 |
| Front/back split | GREEN；决策为单一 `web-console` 内三平面分层，不立即拆两个独立前端应用。 |
| User priority | GREEN；P0/P1/P2/P3 目标用户优先级已锁定。 |
| Role mapping | GREEN；目标用户已映射到页面、权限、导航、主流程和产品指标。 |
| RBAC direction | GREEN for design；目标角色为 `PlatformAdmin/OrgOwner/ProjectMaintainer/Developer/Viewer/SecurityAuditor/AgentOperator`。 |
| Current implementation | YELLOW；当前后端仍是登录用户 + 项目 owner 校验，RBAC 未实现。 |
| UI information architecture | YELLOW；当前导航仍按功能分组，尚未落地 Developer Workbench / Governance / Admin-Security 三平面。 |
| Product metrics | YELLOW；北极星指标已定义，但还未完整进入 Dashboard/API/release evidence。 |

状态：GREEN for product direction lock；YELLOW for UI/RBAC/metrics implementation.

## 250. 2026-07-07 Top-level 62 product operating definitions freeze

| Area | Status |
| --- | --- |
| Definition coverage | GREEN；62 项覆盖产品战略、用户流程、前后台权限、Agent/AI、数据证据、工程质量、运营平台化和企业交付。 |
| Source of truth | GREEN；新增 `TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md` 作为封顶总纲。 |
| Governance guardrail | GREEN；明确不得继续新增“第 63 项”式制度扩张，除非战略、法律、安全事故或企业客户强制触发。 |
| Documentation integration | GREEN；README、董事长入口、公司操作系统、产品治理、阶段需求、backlog、ADR、风险、进度和交接均已同步。 |
| Implementation status | YELLOW；62 项多数是方向和归口，RBAC、SLO、成本、法务、定价、客户成功等仍未实现。 |
| Product mainline risk | YELLOW；下一步必须回到 P6/P9/P10/P11/P12-pre，不能继续停留在制度建设。 |

状态：GREEN for top-level definition freeze；YELLOW for implementation follow-through.

## 251. 2026-07-07 P9 three-plane navigation and north-star Dashboard first slice

| Area | Status |
| --- | --- |
| Three-plane navigation | GREEN；App shell 导航已改为 `前台体验 / 开发者控制台 / 后台治理`，移动 Drawer 同步可读；历史英文三平面名仅作旧别名。 |
| Dashboard north star | GREEN；Dashboard 第一屏新增 `Trusted Engineering Loop Completion Rate`、四阶段闭环状态和产品指标条。 |
| Readability | GREEN；Dashboard status、latest scan repo/project/meta 不再使用 ellipsis/nowrap 裁切关键上下文。 |
| Responsive smoke | GREEN；`app-shell-ui` 和 `dashboard-next-action` smoke 覆盖 `1440x900 / 390x844 / 320x740` 并通过。 |
| Build | GREEN；`npm run build` PASS。 |
| Product boundary | YELLOW；当前北极星指标由现有 stats 派生，尚未进入独立 API/DB/release evidence。 |
| Security boundary | YELLOW；三平面是信息架构分层，不是 RBAC 权限隔离；后端仍主要是 owner 校验。 |

状态：GREEN for P9 first UI/product slice；YELLOW for metrics persistence and RBAC implementation.

## 252. 2026-07-07 P9 ProjectDetail trusted engineering loop

| Area | Status |
| --- | --- |
| Project information architecture | GREEN；ProjectDetail 新增 F1/F2/F4/F5 `项目主链路闭环`，把仓库分析、源码理解、修复候选和安全审计串成一条可见路径。 |
| Responsive readability | GREEN；desktop 4 列、1200px 以下 2 列、720px 以下 1 列、360px 以下 step 内部单列，核心文本使用 wrap 规则。 |
| Smoke coverage | GREEN；app-shell UI smoke 显式断言面板可见、4 个步骤、步骤名称、响应式列数和无横向溢出。 |
| Smoke marker | GREEN；`APP_SHELL_UI_SMOKE_OK.layoutGuards` 已包含 `project-detail-trusted-loop-readable-and-responsive`。 |
| QA review | GREEN；`Godel = 拉里佩奇 / QA Engineer` 首轮 PARTIAL 打回 marker 不自证问题，修复后二轮 PASS。 |
| Build | GREEN；`npm run build` PASS。 |
| Product boundary | YELLOW；该切片不改后端 API、RBAC、指标持久化或 ScanTaskDetail 信息架构。 |

状态：GREEN for ProjectDetail P9 trusted loop slice；YELLOW for broader P9/RBAC/metrics follow-up.

## 253. 2026-07-07 P9 ScanTaskDetail trusted report loop

| Area | Status |
| --- | --- |
| Report information architecture | GREEN；ScanTaskDetail 报告总览新增 T1/T2/T3/T4/T5 `扫描报告可信闭环`，把报告结论、证据引用、code_chunks、修复候选和治理留痕串成一条责任链。 |
| Responsive readability | GREEN；desktop 5 列、720px 以下 1 列，标题/说明使用 wrap 规则，390px/320px smoke 无横向溢出。 |
| Smoke coverage | GREEN；`report-evidence-drawer` smoke 显式断言面板可见、5 个步骤、步骤名称、响应式列数和无横向溢出。 |
| Smoke marker | GREEN；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.trustedReportLoop.surface=SCAN_TASK_DETAIL_TRUSTED_REPORT_LOOP`，并输出 desktop 5 列、390/320 单列。 |
| Build | GREEN；`npm run build` PASS。 |
| QA review | GREEN；`Harvey / 019f3c0e-6142-7713-be05-d86b29ae6dbb = 拉里佩奇 / QA Engineer` 只读复核 PASS，确认 T1-T5 可信闭环、证据入口、修复候选、治理时间线、响应式和 smoke marker 均成立。 |
| Product boundary | YELLOW；该切片不改后端 API、RBAC、真实指标持久化、AutoRepair 后端逻辑或 release evidence schema。 |

状态：GREEN for ScanTaskDetail P9 trusted report loop slice；YELLOW for broader P9/RBAC/metrics/release evidence follow-up.

## 254. 2026-07-07 P9/P11 Dashboard API-backed trusted loop metrics

| Area | Status |
| --- | --- |
| API contract | GREEN；`/api/dashboard/stats` 新增 trusted loop 指标字段，覆盖 completion、status、stage count、report evidence、Code QA readiness、recovery signal 和 metrics source。 |
| Backend computation | GREEN；`ScanStatService` 基于仓库、成功扫描、运行状态、code_chunks 和风险计算指标，不由 Controller 纯静态拼接。 |
| Frontend consumption | GREEN；Dashboard 优先使用 API 字段，旧后端缺字段或 API 失败时保留本地 fallback。 |
| Smoke coverage | GREEN；`dashboard-next-action` smoke 验证 `API-backed metrics`、请求失败 fallback 和旧 stats 缺字段 fallback，并在 marker 输出 `dashboardStatsApiSignals.legacyStatsFallbackCase`。 |
| Build/tests | GREEN；focused backend tests PASS，frontend build PASS，dashboard smoke PASS，app-shell smoke PASS。 |
| QA review | GREEN；`Laplace / 019f3c19-e7b8-73f2-bed6-ee5bb06b0ee2 = 拉里佩奇 / QA Engineer` 首轮 PARTIAL 要求补旧 stats 缺字段 fallback；补齐后二轮 PASS。 |
| Product boundary | YELLOW；指标进入 API 合同，但尚未进入独立指标仓库、release evidence package、生产 SLO 或 RBAC。 |

状态：GREEN for API-backed Dashboard metrics implementation；YELLOW for release evidence/package/RBAC follow-up.

## 255. 2026-07-07 P11/P9 Dashboard metrics source release verifier gate

| Area | Status |
| --- | --- |
| Release verifier contract | GREEN；`dashboard-next-action-ui-smoke` OK marker 必须包含 `dashboardStatsApiSignals`，并证明 source selector、API-backed cases、fallback case 和 legacy stats fallback。 |
| Forged marker coverage | GREEN in code；security regression 已新增缺 dashboard stats signals、缺 API-backed case、缺 fallback case、缺 legacy fallback、错误 source selector 反例；旧 visualEvidence 反例已改为从 valid marker 派生，保留 stats source 证据。 |
| Syntax | GREEN；`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh` PASS。 |
| Focused regression | GREEN；修复 forged marker 精度后，`release-verifier-dashboard-ui-marker` suite 重跑 PASS。 |
| Quality Gate | GREEN；`Franklin / 019f3c63-abb1-7bd3-b406-e1bcc82c8d6d = 达里奥 / Quality Gate` 首轮 PARTIAL，指出旧 hardcoded visualEvidence forged marker 证明精度变钝；已修复并重跑 PASS。 |
| Product boundary | YELLOW；这是 release evidence gate 强化，不是完整生产指标仓库或 RBAC。 |

状态：GREEN for focused release verifier gate；YELLOW for broader release evidence package follow-up.

## 256. 2026-07-07 P11/P9 release evidence inventory Dashboard metrics source evidence

| Area | Status |
| --- | --- |
| JSON inventory | GREEN；每个 run 输出 `dashboardMetricsSourceEvidence`，包含 marker 存在性、合法性、selector、API-backed/fallback/legacy 分项和总 complete。 |
| Table summary | GREEN；summary 已输出 `marker_present`、`marker_missing`、`marker_valid`、`marker_invalid`、`complete`、`incomplete`。 |
| Self-test | GREEN；覆盖完整 marker、缺 `dashboardStatsApiSignals`、缺 `apiBackedCases`、缺 source selector、缺 legacy fallback、marker missing 和 duplicate marker。 |
| Real inventory | GREEN；真实 `release-evidence` 目录当前显示 `marker_present=31`、`marker_missing=71`、`complete=0`、`incomplete=31`，旧 evidence 未被误判完整。 |
| DevOps review | GREEN；`Carver / 019f3c6f-0cc4-7a90-b5c1-f088f0bdc2a0 = 黄仁勋 / DevOps Engineer` 首轮 PARTIAL 打回，修复后二轮 PASS。 |
| Boundary | YELLOW；这是 inventory 盘点，不是新 full release authority、生产指标仓库或所有发布 profile 真实刷新。 |

状态：GREEN for focused P11 inventory gate；YELLOW for broader release evidence package refresh.

## 257. 2026-07-07 P9/P11 Projects portfolio trusted intake loop

| Area | Status |
| --- | --- |
| Information architecture | GREEN；Projects 页新增 `项目组合可信接入闭环`，P1-P4 串联项目壳、公开仓库、扫描报告、代码问答与修复。 |
| Target transparency | GREEN；P2/P3/P4 显示 `目标：<项目名>`；筛选无结果时显示 `无匹配项目` 且按钮禁用，不再暗中打开隐藏项目。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、<=1200 两列、<=720 单列；文本使用 wrap/anywhere 防裁切。 |
| Smoke coverage | GREEN；app-shell smoke 断言面板可见、4 个步骤、步骤名称、响应式列数和无横向溢出。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 新增 portfolio loop 专项规则，并同步当前 topbar/drawer/cross-file 文案选择器。 |
| Frontend review | GREEN；`Carson / 019f3c7a-561d-73e0-ae84-de7928f15ed4 = 扎克伯格 / Frontend Engineer` 首轮 PARTIAL，修复后二轮 PASS。 |
| Boundary | YELLOW；该切片是 Projects 信息架构增强，不是后端权限、仓库 E2E、真实扫描质量或完整 P9。 |

状态：GREEN for focused P9 Projects intake loop；YELLOW for broader P9/backend/RBAC follow-up.

## 258. 2026-07-07 P9/P10/P11 AgentChat conversation trust workbench

| Area | Status |
| --- | --- |
| Information architecture | GREEN；AgentChat 新增 `会话可信工作台`，四段串联项目上下文、证据输入、工具审计、闭环任务。 |
| Trust state correctness | GREEN；审计 deep link 只使用确认后的 `selectedConversation.projectId`，消息加载具备 requestSeq + active conversation 双校验，避免旧响应覆盖当前会话。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、<=1200 两列、移动单列；文本使用 `min-width:0` / `overflow-wrap:anywhere` 防裁切。 |
| Smoke coverage | GREEN；AgentChat smoke 证明工作台可见、四段齐全、桌面/移动列数、无横向溢出、scan report action 真实点击并加载页面。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住四段工作台、confirmed projectId、stale async response guard、silent refresh loading guard 和 scan click marker。 |
| Frontend review | GREEN；`Bernoulli / 019f3c8b-2946-7e73-b6b9-e61dbb2b556b = 扎克伯格 / Frontend Engineer` 三轮 PARTIAL 打回，第四轮 PASS。 |
| Boundary | YELLOW；该切片不实现真实 LLM provider、RBAC、专项 race smoke、full release evidence 或完整 P9。 |

状态：GREEN for focused P9 AgentChat trust workbench；YELLOW for broader P9/P10/P11 follow-up.

## 259. 2026-07-07 P9/P10/P11 Artifacts custody chain workbench

| Area | Status |
| --- | --- |
| Information architecture | GREEN；Artifacts 新增 `产物保管责任链`，四段串联来源绑定、显示脱敏、Raw Access 审计和复盘闭环。 |
| Raw access governance | GREEN；raw download receipt id 场景显示 `receipt #...` 并提供审计 deep link；无 receipt id 场景退化为资源/action/status 低敏过滤入口。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、<=1200 两列、<=720 单列；责任链标题、状态和说明使用 wrap/anywhere 防裁切。 |
| Smoke coverage | GREEN；Artifacts smoke 证明 1440/390/320 三档 viewport 下四段可见、列数正确、文本可读、无横向溢出，并验证 receipt/fallback 审计入口同步到责任链。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住责任链实现、4/2/1 样式、step copy wrap、receipt/fallback smoke marker 和无 provider/LLM 质量宣称。 |
| Frontend review | GREEN；`Turing / 019f3cd8-55e0-7223-9249-96b0cd6391f0 = 扎克伯格 / Frontend Engineer` 只读复核 PASS。 |
| Boundary | YELLOW；该切片不实现后端 RBAC、artifact retention 后端策略、生产审计报表、真实 provider 质量或 full release evidence。 |

状态：GREEN for focused P9 Artifacts custody chain workbench；YELLOW for broader P9/P10/P11 follow-up.

## 260. 2026-07-07 P9/P10/P11 AuditLogs investigation loop workbench

| Area | Status |
| --- | --- |
| Information architecture | GREEN；AuditLogs 新增 `审计调查闭环`，四段串联风险发现、证据脱敏、资源追踪、复盘处置。 |
| Governance boundary | GREEN；闭环状态基于失败事件、高权限工具、delivery 风险、数据源错误、可追踪入口和审计判定门禁，不静态宣称健康。 |
| Raw evidence safety | GREEN；调查闭环和现有抽屉均明确 raw JSON 只做显示层脱敏，原始 JSON 默认收起；smoke 注入常见 secret 并证明 marker 不含原文。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、<=1200 两列、<=720 单列；标题、状态、说明和按钮使用 wrap/full-width 规则防裁切。 |
| Smoke coverage | GREEN；AuditLogs smoke 7 项通过，覆盖 1440/390/320、三源表格、深链精确匹配、缺失 fail-closed、筛选/分页 REVIEW、source error BLOCKED、raw JSON 脱敏和新增调查闭环 marker。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住调查闭环实现、4/2/1 样式、step copy wrap、smoke marker 和无完整审计/provider/LLM 质量宣称。 |
| Frontend review | GREEN；`Newton / 019f3ce2-4e59-78f3-af55-a54e48cde9e8 = 扎克伯格 / Frontend Engineer` 只读复核 PASS。 |
| Boundary | YELLOW；该切片不实现后端 RBAC、组织权限、生产 SIEM、告警系统、全量审计覆盖或 full release evidence。 |

状态：GREEN for focused P9 AuditLogs investigation loop workbench；YELLOW for broader P9/P10/P11 follow-up.

## 261. 2026-07-09 P9/P10/P11 ModelConfig provider governance loop workbench

| Area | Status |
| --- | --- |
| Information architecture | GREEN；ModelConfig 新增 `模型供应商治理闭环`，四段串联激活门禁、密钥边界、Endpoint 风险和下游能力。 |
| Endpoint governance | GREEN；Endpoint 风险由 `hasEndpointOverride` 基于实际 `baseUrl` 与 provider preset 比对，非 CUSTOM provider 覆盖地址也会进入复核。 |
| Secret display safety | GREEN；API Key 表格显示经 `displayApiKeyBoundary` 兜底脱敏；smoke 注入 raw key fixture 并证明页面 body 不包含 raw key。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、<=1200 两列、<=720 单列；治理说明、按钮和 summary stat 均使用 wrap/anywhere 或 full-width 规则防裁切。 |
| Smoke coverage | GREEN；ModelConfig smoke 覆盖 1440/390/320，证明错误恢复、表格 scroller、治理闭环可读性、raw key 隐藏和无 provider/LLM 过度宣称。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住四段实现、Endpoint override、API key redaction fallback、CSS wrap、DOM 负向断言和 marker 派生字段。 |
| Frontend review | GREEN；`Avicenna / 019f429b-eb84-7b43-9e7a-100033cb66e0 = 扎克伯格 / Frontend Engineer` 首轮 PARTIAL，修复后二轮 PASS。 |
| Boundary | YELLOW；该切片不实现后端密钥存储审计、真实 provider health check、额度/SLA、RBAC、生产 LLM provider 或 full release evidence。 |

状态：GREEN for focused P9 ModelConfig provider governance loop workbench；YELLOW for broader P9/P10/P11 follow-up.

## 262. 2026-07-09 P9/P10/P11 AutoRepair candidate governance loop workbench

| Area | Status |
| --- | --- |
| Information architecture | GREEN；AutoRepairs 新增 `自动修复候选治理闭环`，四段串联候选来源、补丁生成、审查门禁和 PR 出口。 |
| Governance boundary | GREEN；候选来源区分扫描绑定/人工候选，补丁生成和审查文案明确不证明修复正确，PR 出口明确仍需 review、CI 和审计复盘。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；治理说明和 summary stat 使用 wrap/anywhere 防裁切。 |
| Smoke coverage | GREEN；patch-ready smoke 覆盖 1440/1024/390/320，证明四段可见、列数正确、文本可读、无横向溢出、无修复正确性/LLM 事实正确性过度宣称。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住四段实现、不过度宣称文案、4/2/1 CSS、文本 wrap 和 tablet two-column marker。 |
| Frontend review | GREEN；`Newton / 019f42ac-154f-7403-9ce8-425d30a27bac = 扎克伯格 / Frontend Engineer` 首轮 PARTIAL，补 tablet 断点后二轮 PASS。 |
| Boundary | YELLOW；该切片不实现后端修复质量判定、真实 LLM provider、沙箱完整性证明、RBAC 或 full release evidence。 |

状态：GREEN for focused P9 AutoRepair governance loop workbench；YELLOW for broader P9/P10/P11 follow-up.

## 263. 2026-07-09 P9/P10/P11 CI Diagnostics failure governance loop workbench

| Area | Status |
| --- | --- |
| Information architecture | GREEN；CiDiagnostics 新增 `CI 失败诊断治理闭环`，四段串联日志接入、根因证据、修复资格和 AutoRepair 交接。 |
| Governance boundary | GREEN；治理文案明确显示脱敏不等于 raw 日志可外发，诊断完成不等于根因/LLM/修复正确，AutoRepair 交接后仍需审查、CI、review 和审计复盘。 |
| Raw log display safety | GREEN；CI 日志显示继续使用 `redactSensitiveText`；smoke 注入多类 secret 并证明 DOM 和 marker 不包含原文。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；治理说明、状态和按钮使用 wrap/full-width 规则防裁切。 |
| Smoke coverage | GREEN；ci-diagnostics smoke 覆盖 1440/1024/390/320，证明四段可见、列数正确、文本可读、无横向溢出、无修复正确性/LLM 事实正确性过度宣称，同时保留深链、键盘选择和 AutoRepair 参数交接验证。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住四段实现、显示脱敏边界、不过度宣称文案、4/2/1 CSS、文本 wrap 和四视口 marker。 |
| Review | YELLOW；主 agent fallback review PASS，并修正 `governanceLoopSteps` 为 `useMemo`；固定岗位 `Kuhn / 019f4442-23cd-7de1-9931-9dc0612dcad5 = 扎克伯格 / Frontend Engineer` 因额度限制未形成独立 PASS。 |
| Boundary | YELLOW；该切片不实现真实 CI provider webhook、后端 RBAC、组织权限、真实诊断质量、真实 LLM provider 或 full release evidence。 |

状态：GREEN for focused P9 CI Diagnostics governance loop workbench；YELLOW for independent subagent review and broader P9/P10/P11 follow-up.

## 264. 2026-07-09 P9/P10/P11 PR Reviews governance loop workbench

| Area | Status |
| --- | --- |
| Information architecture | GREEN；PrReviews 新增 `PR 审查治理闭环`，四段串联 PR 输入、风险判定、合并门禁和 AutoRepair 交接。 |
| Governance boundary | GREEN；治理文案明确 PR 审查完成不等于代码质量、业务正确性或安全性完全证明，合并与修复候选仍需测试、CI、人工 review 和审计复盘。 |
| AutoRepair handoff | GREEN；目标 PR 具备 repositoryId、目标文件和行级评论时，治理闭环和详情区均显示 `生成修复候选`，URL 保留 projectId、repositoryId、filePath、source 和 openCreate。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；治理说明、状态和按钮使用 wrap/full-width 规则防裁切。 |
| Smoke coverage | GREEN；pr-reviews smoke 覆盖 1440/1024/390/320，证明四段可见、列数正确、文本可读、无横向溢出、AutoRepair URL 参数正确、无代码质量/LLM 事实正确性过度宣称。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住四段实现、不过度宣称文案、4/2/1 CSS、文本 wrap 和四视口 marker。 |
| Frontend review | GREEN；`Ampere / 019f4457-150a-7420-9c28-ac03f3220c94 = 扎克伯格 / Frontend Engineer` 只读静态复核 PASS。 |
| QA review | YELLOW；`Confucius / 019f4457-36f8-7e50-a3ab-6e0eb86f0c47 = 拉里佩奇 / QA Engineer` 给出 PARTIAL：当前 smoke 不证明真实 PR provider、后端 merge gate、风险分析正确性、AutoRepair API 创建或端到端闭环。 |
| Boundary | YELLOW；该切片不实现真实 PR provider、GitHub/GitLab merge gate、后端权限、真实 AutoRepair 候选创建、RBAC 或 full release evidence。 |

状态：GREEN for focused P9 PR Reviews governance loop workbench；YELLOW for P11 business E2E and broader P9/P10/P11 follow-up.

## 265. 2026-07-09 P9/P10/P11 Dashboard three-plane product structure map

| Area | Status |
| --- | --- |
| Information architecture | GREEN；Dashboard 新增 `SourceLens 三平面产品结构`，把前台体验、开发者控制台、后台治理放到首页层级。 |
| Product mapping | GREEN；前台体验映射项目与仓库、扫描报告、代码问答、修复候选；开发者控制台映射执行任务、运行产物、CI 诊断、PR 审查、Issue 拆解；后台治理映射审计日志、模型配置、安全边界、发布证据。 |
| Governance boundary | GREEN；后台治理文案明确不等于 RBAC、多租户或生产部署已完成，smoke 负向断言无 RBAC/生产部署完成宣称。 |
| Responsive UI | GREEN；CSS 为 desktop 3 列、1024 tablet 2 列、390/320 mobile 1 列；说明、状态 tag、chips 和按钮使用 wrap/full-width 规则防裁切。 |
| Smoke coverage | GREEN；dashboard-next-action smoke 覆盖 7 个状态分支 × 1440/1024/390/320 四档 viewport，证明三平面可见、列数正确、文本可读、动作存在、无横向溢出。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住三平面实现、不过度宣称文案、3/2/1 CSS、文本 wrap、四视口 marker 和负向断言。 |
| Review | YELLOW；主 agent fallback product/frontend review PASS；`Russell = 乔布斯 / Product Manager` 与 `Gibbs = 扎克伯格 / Frontend Engineer` 均因额度限制未形成独立 PASS。 |
| Boundary | YELLOW；该切片不实现真实 RBAC、多租户、组织权限、生产部署、商业化体系、路由权限分层或 full release evidence。 |

状态：GREEN for focused P9 Dashboard three-plane product structure map；YELLOW for independent subagent review and broader P9/P10/P11 follow-up.

## 266. 2026-07-09 P9/P10/P11 AppLayout global three-plane navigation contract

| Area | Status |
| --- | --- |
| Information architecture | GREEN；AppLayout 定义 `ProductPlane`，并把 13 条核心路由映射到前台体验、开发者控制台和后台治理。 |
| Navigation consistency | GREEN；侧边栏和移动 Drawer 已按 `前台体验`、`开发者控制台`、`后台治理` 三组组织，topbar plane 从当前 route metadata 渲染。 |
| Product boundary | GREEN；本切片没有宣称 RBAC、多租户、后台权限隔离、生产部署或 full release evidence 已完成。 |
| Responsive UI | GREEN；沿用 app-shell 响应式规则，topbar plane 在桌面显示、窄屏折叠，移动 Drawer 保持可访问。 |
| Smoke coverage | GREEN；app-shell smoke 覆盖 13 条核心路由 × 1440/390/320 三档 viewport，marker 输出 `productPlanes`、`routePlanes`、`mobileNavigationViewports`、`topbarPlaneCollapseViewports` 和 `productOverclaim`。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住 AppLayout 三平面源码、topbar plane、390/320 移动 Drawer、390/320 topbar plane collapse、smoke marker、product overclaim 和旧英文分组禁止项。 |
| Review | GREEN；`Sartre = 乔布斯 / Product Manager` 与 `Pauli = 扎克伯格 / Frontend Engineer` 一轮 PARTIAL，修复后二轮 PASS。 |
| Boundary | YELLOW；该切片不实现真实 RBAC、组织权限、多用户协作、后台管理应用拆分、生产部署或完整 release evidence。 |

状态：GREEN for focused P9 AppLayout three-plane navigation；YELLOW for broader P9/P10/P11 follow-up.

## 267. 2026-07-09 P9/P10/P11 IssueDecomposition developer-control-plane governance loop

| Area | Status |
| --- | --- |
| Information architecture | GREEN；IssueDecomposition 新增 `Issue 拆解治理闭环`，四段串联需求输入、任务拆解、验收门禁和执行交接。 |
| Governance boundary | GREEN；治理文案明确拆解结果只能作为开发计划证据，不能证明实现、测试、CI、PR 或 LLM 判断正确。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；治理文本、阶段和证据使用 wrap/anywhere 防裁切。 |
| Smoke coverage | GREEN；issue-decomposition smoke 覆盖 1440/1024/390/320，证明四段可见、列数正确、文本可读、无横向溢出，并保留可访问选择、任务状态隔离、delayed stale tasks rejection、复制/导出脱敏。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住四段实现、不过度宣称文案、4/2/1 CSS、文本 wrap、四视口 marker 和 stale task request guard。 |
| Review | GREEN；`Jason = 乔布斯 / Product Manager` 二轮 PASS；`Socrates = 扎克伯格 / Frontend Engineer` 首轮 PARTIAL 指出 stale tasks 风险，修复后二轮 PASS；`Feynman = 拉里佩奇 / QA Engineer` PASS。 |
| Boundary | YELLOW；该切片不实现真实 LLM 拆解质量证明、后端任务执行、CI/PR/AutoRepair E2E、RBAC 或 full release evidence。 |

状态：GREEN for focused P9 IssueDecomposition governance loop；YELLOW for broader P9/P10/P11 follow-up.

## 268. 2026-07-09 P9/P10/P11 ExecutionTasks lifecycle governance loop workbench

| Area | Status |
| --- | --- |
| Information architecture | GREEN；ExecutionTasks 新增 `执行生命周期治理闭环`，四段串联来源接入、调度控制、证据采集和复盘交接。 |
| Governance boundary | GREEN；治理文案明确执行任务闭环只证明任务状态和证据入口可追踪，不证明真实执行质量、产物正确、CI/PR/AutoRepair 或 LLM 结果正确。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；阶段标题、状态和说明使用 wrap/anywhere 防裁切。 |
| Smoke coverage | GREEN；execution-tasks smoke 覆盖 1440/1024/390/320，证明四段可见、列数正确、标题/状态/说明文本可读、无横向溢出，并保留可访问选择、动作门禁、表格 scroller、日志脱敏、same-task refresh stale guard 和 explicit load stale guard。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住四段实现、不过度宣称文案、4/2/1 CSS、文本 wrap、四视口 marker、refresh/cancel request sequence、cancel 清 detailLoading 和 stale guard smoke。 |
| Review | GREEN；`Erdos = 乔布斯 / Product Manager` PASS；`Averroes = 扎克伯格 / Frontend Engineer` 两轮 PARTIAL 后三轮 PASS；`Dewey = 拉里佩奇 / QA Engineer` PASS。 |
| Boundary | YELLOW；该切片不实现真实任务执行正确性、产物质量、CI/PR/AutoRepair E2E、RBAC 或 full release evidence。 |

状态：GREEN for focused P9 ExecutionTasks lifecycle governance loop；YELLOW only for broader P9/P10/P11 follow-up outside this slice.

## 269. 2026-07-09 P9/P10/P11 AgentTasks lifecycle governance loop workbench

| Area | Status |
| --- | --- |
| Information architecture | GREEN；AgentTasks 新增 `Agent 任务治理闭环`，四段串联任务入口、执行控制、工具证据和复盘交接。 |
| Governance boundary | GREEN；治理文案明确 Agent 任务闭环只证明任务元数据和证据入口可追踪，不证明模型判断正确、工具输出真实或修复/PR/CI 结果正确。 |
| Responsive UI | GREEN；CSS 为 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；阶段标题、状态和说明使用 wrap/anywhere 防裁切。 |
| Smoke coverage | GREEN；agent-tasks smoke 覆盖 1440/1024/390/320，证明四段可见、列数正确、标题/状态/说明文本可读、无横向溢出，并保留可访问选择、动作门禁、表格 scroller、payload safety 和步骤输出 safety。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住四段实现、不过度宣称文案、4/2/1 CSS、文本 wrap、四视口 marker 和 steps request sequence guard。 |
| Review | GREEN；`Goodall = 乔布斯 / Product Manager`、`Dalton = 扎克伯格 / Frontend Engineer`、`Popper = 拉里佩奇 / QA Engineer` 只读复核均为 PASS。 |
| Boundary | YELLOW；该切片不实现真实 LLM 判断正确、工具输出真实、Agent 执行器正确、CI/PR/AutoRepair E2E、RBAC 或 full release evidence。 |

状态：GREEN for focused P9 AgentTasks lifecycle governance loop；YELLOW only for broader P9/P10/P11 follow-up beyond this focused slice.

## 270. 2026-07-10 P9/P6/P11 Dashboard executive briefing and single AgentChat QA entry

| Area | Status |
| --- | --- |
| Information architecture | GREEN；Dashboard 新增 `管理层决策简报`，覆盖阶段进度、质量状态、风险阻塞和下一步投入。 |
| Product consistency | GREEN；Dashboard 主代码问答入口统一到 AgentChat code-understanding handoff，不再用项目 tab QA 作为主入口。 |
| Governance boundary | GREEN；简报文案明确不证明 P9 全阶段完成、RBAC 权限隔离落地、生产部署可上线或商业化体系完成。 |
| Responsive UI | GREEN；smoke 覆盖 1440/1024/768/390/320；管理层简报 4/2/2/1/1，三平面 3/2/2/1/1；960px 前头部单列，Tag 可收缩可换行。 |
| Smoke coverage | GREEN；dashboard-next-action smoke 证明七种主链路状态、五视口、管理层简报、三平面、QA URL、mocked API only、无横向溢出和无过度宣称。 |
| Static gate | GREEN；`validate-frontend-ui.mjs` 钉住 executive briefing、AgentChat QA handoff、拒绝项目 tab QA 主入口、960px 单列、Tag wrap、五视口 marker。 |
| Review | GREEN；`Hilbert = 乔布斯 / Product Manager` 与 `Mill = 扎克伯格 / Frontend Engineer` 首轮 PARTIAL 后二轮 PASS。 |
| Boundary | YELLOW；该切片不实现真实指标权威、release evidence verifier 新 marker 纳入、RBAC、生产部署、商业化体系或 P9/P6/P11 全部完成。 |

状态：GREEN for focused P9 Dashboard executive briefing and QA entry consistency；YELLOW only for broader P9/P6/P11 follow-up outside this slice.

## 271. 2026-07-10 P11/P9 Dashboard executive briefing release evidence gate

| Area | Status |
| --- | --- |
| Verifier contract | GREEN；精确校验 7 cases x 5 viewports、executive scope/signals/count、布局、可读性、action 和 no-overclaim。 |
| Screenshot evidence | GREEN；五张唯一 PNG 均校验稳定文件名、安全包路径、实际尺寸/bytes/像素和 viewport 边界，并进入 allowlist。 |
| Inventory | GREEN；独立输出 `dashboardExecutiveBriefingEvidence`、字段检查、viewport coverage、visual evidence coverage、complete 和 reason。 |
| Forgery regression | GREEN；缺失、错误、重复、尺寸伪造和四类 overclaim 均有精确拒绝用例。 |
| Real smoke | GREEN；`make dashboard-next-action-ui-smoke` 通过，真实 marker 包含 35 条 visited case 和五张 screenshot evidence。 |
| Review process | GREEN；主 agent 首轮发现两截图/五截图不一致并打回，DevOps 与 QA 第二轮修复后 PASS。 |
| Current authority | YELLOW；现有 full authority 早于新 schema，尚未由新 release/nightly run 刷新。 |
| Boundary | YELLOW；该门禁证明 evidence contract，不证明 Dashboard 指标业务真实性、RBAC、生产部署或商业化体系完成。 |

状态：GREEN for focused P11 verifier/inventory/forgery gate；YELLOW for full authority refresh and broader P9/P10/P11 scope.

## 272. 2026-07-10 P9 scan report route-plane handoff

| Area | Status |
| --- | --- |
| Route identity | GREEN；`/scan-tasks/:id` 显示“扫描报告”，归属“前台体验”，并继承 `/projects` 父菜单选中态。 |
| Dashboard handoff | GREEN；Dashboard 打开报告后继续验证 topbar、产品平面、页面 H1 和父菜单，不再只验证 URL。 |
| Responsive UI | GREEN；直接加载覆盖 `1440x900`、`390x844`、`320x740`，桌面 Sider 与移动 Drawer 选中态一致。 |
| Runtime evidence | GREEN；`dashboardHandoff=10`、`directLoad=3`、`runtimeIssues=0`、`horizontalOverflow=true`。 |
| Static/build gate | GREEN；frontend UI validator、TypeScript/Vite production build 通过。 |
| Review | GREEN after return；Frontend 首轮描述合同与 static gate 不一致被打回，修正后 PASS；QA 两组 Playwright 均 `1 passed`。 |
| Boundary | YELLOW；本切片使用 mocked frontend API，不证明真实后端集成、RBAC 或 P9 全阶段完成。 |

状态：GREEN for focused P9 scan report route-plane handoff；YELLOW for broader P9 and real-backend E2E.

## 273. 2026-07-10 P11 Dashboard product-plane release evidence contract

| Area | Status |
| --- | --- |
| Producer contract | GREEN；`productPlaneMap.actionCount=3`，35 条 proof 精确覆盖 7 cases x 5 viewports。 |
| Verifier | GREEN；严格校验 scope、surface、三平面、五视口列数、可读性、动作数、proof 唯一覆盖和 no-overclaim。 |
| Inventory | GREEN；独立输出 `dashboardProductPlaneEvidence`、checks、proof coverage、complete 和 reason。 |
| Self-test | GREEN；`dashboardProductPlaneEvidence=covered`。 |
| Forgery regression | GREEN；15 个 productPlaneMap 伪造变体均被精确拒绝。 |
| Current full authority | RED/BLOCKED；`release-current-schema-20260705-0610` 在最新 verifier 下退出 1，首个失败为 `productPlaneMap must be an object`。 |
| Boundary | YELLOW；focused contract 已完成，但新 full release authority 尚未生成。 |

状态：GREEN for focused P11 product-plane evidence contract；BLOCKED/YELLOW for full authority refresh.

## 274. 2026-07-10 P11 current full authority refresh and repair-readiness hardening

| Area | Status |
| --- | --- |
| Full release evidence | GREEN；`release-current-schema-20260710-114653` 为当前本地权威包，0 required failures、0 optional warnings、5 skipped。 |
| Independent verification | GREEN；最新 verifier 与 checksum 校验通过。 |
| Public repository E2E | GREEN；真实 clone/scan/code_chunks/Code QA/report citation/多视口 UI/cleanup 完整通过。 |
| Repair gate safety | GREEN；服务端显式 readiness 与前端 roleDistribution/claim/file counts 必须同时成立，漂移样本降级 REVIEW。 |
| Evidence contract | GREEN；`REQUIRED_FULL` 与 `FULL` 语义分离，派生字段和 AgentChat 双任务 ID 均有 forged regression。 |
| QA review | GREEN；拉里佩奇首轮 PARTIAL 打回后复核 PASS，本切片阻塞项为 0。 |
| Product boundary | YELLOW；P9/P6/P10/P11 整体仍在推进，RBAC、多租户、GitHub App E2E、真实 provider、灾备签署和生产部署未完成。 |

状态：GREEN for current local release authority；YELLOW only for deferred advanced integrations and unfinished product phases.

## 275. 2026-07-10 P9 first-viewport context and action arbitration

| Area | Status |
| --- | --- |
| Dashboard action truth | GREEN；hero primary 只来自 `nextAction`，错误态只主推重试，后部重复推荐面板已移除。 |
| Projects state truth | GREEN；initial/fatal/stale/confirmed-empty/filtered-empty 已分离，fatal 不再显示 0 数据统计、可信闭环、表格或新建主动作。 |
| Responsive identity | GREEN；`<=960px` 顶栏直接显示当前产品平面；390/320 不依赖 Drawer。 |
| Browser evidence | GREEN；Dashboard 7 状态 x 5 视口在 `scrollY=0` 下 primary=1、按钮在 viewport 内、白字、无横向溢出；Projects 11 broad cases 和 empty-state focused case PASS。 |
| Static/build gate | GREEN；app-shell smoke、frontend build、`validate-frontend-ui.mjs`、`git diff --check` PASS。 |
| Independent review | GREEN；`Popper / 019f4a53-c845-76b1-92d6-49a02b766688 = 拉里佩奇 / QA Engineer` 首轮 PARTIAL 后取得精确父级、五视口和运行证据，二轮 PASS。 |
| Boundary | YELLOW；本切片未实现持久化工作视角、ProjectDetail/ScanTaskDetail/AgentChat 全部首屏仲裁、RBAC 或真实后端 E2E。 |

状态：GREEN for focused P9 first-viewport arbitration；YELLOW for broader P9 scope.

## 276. 2026-07-10 P9 per-user persisted work perspective

| Area | Status |
| --- | --- |
| Product semantics | GREEN；中立根入口 `/` 恢复保存偏好，显式 `/dashboard`、`/execution-tasks`、`/audit-logs` 和其他深链始终以 URL 为准且不覆写偏好。 |
| Navigation contract | GREEN；开发工作台、工程治理、平台管理与安全分别映射 Dashboard、ExecutionTasks、AuditLogs；Issue Decomposition 权威归属开发工作台。 |
| Preference safety | GREEN；键按 authenticated user id 分离、白名单解析、非法值回退；读写异常不阻断导航。文案与 marker 明确这只是导航偏好，不是角色或权限隔离。 |
| Responsive UI | GREEN；1440/1024/768/390/320 可操作；展开/折叠 Sider、移动 Drawer、390 -> 1024 断点清理和桌面折叠恢复均有证据。 |
| Test efficiency | GREEN；新增 canonical `smoke:work-perspective`，2 tests / 22.0s；240s timeout 仅保留给全站 app-shell 大烟测。 |
| Static/build gate | GREEN；frontend UI validator、production build（3150 modules / 3.65s）、`git diff --check` PASS。 |
| Independent review | GREEN after return；`Tesla = 乔布斯` 首轮 BLOCK、`Volta = 扎克伯格` 与 `Zeno = 拉里佩奇` 首轮 PARTIAL，修复后二轮均 PASS。 |
| Boundary | YELLOW；不实现 RBAC、角色识别、组织/团队、服务端或跨设备偏好同步、真实后端 E2E，也不证明 P9 全阶段完成。 |

状态：GREEN for focused P9 work-perspective navigation；YELLOW for RBAC and broader P9 scope.

## 277. 2026-07-10 P9 ProjectDetail first-viewport state truth and request ownership

| Area | Status |
| --- | --- |
| State truth | GREEN；`INITIAL_LOADING / FATAL_LOAD / STALE_REFRESH / READY` 先于六业务态；初始请求未确认时不显示 0 数据、cockpit 或业务 primary。 |
| Request ownership | GREEN；project generation、core/detail sequence、full refresh owner、visible sync owner 和 scan ownership 分离；A -> B 迟到 core/code_chunks/preview 被拒绝。 |
| Mutation safety | GREEN；删除仓库和取消扫描在请求前校验当前可信快照、实体归属和 generation。 |
| Responsive action | GREEN；1440/1024/768/390/320 自然首屏通过；320x740 主动作位于 evidence checks 前且完整可见，信息未隐藏。 |
| Focused smoke | GREEN；canonical 11 passed / 54.9s，marker 为 `5/15/30/5/1`，`realApi=false`、`db=false`；桌面/320 trace screenshot 复核 PASS。 |
| Regression alignment | GREEN；旧 batch4A 已迁移到 local overview retry + trusted stale refresh，聚焦 3 passed / 9.2s。 |
| Static/build gate | GREEN；frontend production build、`validate-frontend-ui.mjs`、`git diff --check` PASS。 |
| Independent review | GREEN after return；Frontend 初版被主 agent 打回 async starvation；Architect 首轮发现 3 个 P1 + 2 个 P2 后修复，二轮 PASS；Product 最终 PASS；QA 最终 PASS。 |
| Boundary | YELLOW；mocked frontend evidence 不证明真实后端 E2E、RBAC、生产部署、P9 全阶段或 full release authority 更新。 |

状态：GREEN for focused P9 ProjectDetail first-viewport and async ownership；YELLOW only for broader P9/P10/P11 scope.

## 278. 2026-07-10 P9 ScanTaskDetail first-viewport state truth and report ownership

| Area | Status |
| --- | --- |
| State truth | GREEN；`INITIAL_LOADING / FATAL_LOAD / STALE_REFRESH / READY` 优先于 cockpit、风险结论和业务动作。 |
| Evidence ownership | GREEN；task/artifact/preview/execution/code_chunks 均验证当前 scan/project/generation；A -> B 五阶段迟到响应被拒绝。 |
| Trusted refresh | GREEN；preview 刷新失败保留旧可信快照并进入 STALE，resync 后恢复 READY；递归 polling 与 full refresh 正确仲裁。 |
| Risk semantics | GREEN；明确 `risks=[]` 才显示无显著风险；报告缺失、非法 JSON、缺少字段和非数组均显示风险状态不可用。 |
| Execution truth | GREEN；无 execution steps 时显示证据未提供，不再合成虚假 PENDING 步骤。 |
| Focused evidence | GREEN；7 passed / 48.5s，15 个独立 fatal 场景、5 个 confirmed-empty、5 类 fallback、5 stale、route/polling race；4 张成功 PNG 落盘。 |
| Static/build gate | GREEN；frontend UI validator、production build、`git diff --check` PASS。 |
| Independent review | GREEN after return；QA 首轮 PARTIAL 暴露 3 个 P1，Product 首轮 BLOCK 暴露 synthetic step 状态矛盾；全部返工后 Product/Frontend/QA/Architect PASS。 |
| Boundary | YELLOW；mocked frontend evidence 不证明真实后端 E2E、报告事实正确、RBAC、生产部署、P9 全阶段或 full authority 更新。 |

状态：GREEN for focused P9 ScanTaskDetail first-viewport and evidence ownership；YELLOW only for broader P9/P10/P11 scope.
