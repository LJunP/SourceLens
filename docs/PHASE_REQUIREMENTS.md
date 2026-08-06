# SourceLens Phase Requirements

> AIOS v2.3 状态：`HISTORICAL PHASE INDEX`。本文中的旧 P0-P12、完成率和并行主线不得用于当前排期或能力声明。新路线和当前 Gate 只读 `aios/STRATEGIC_CONSTITUTION.md`、`aios/truth/project_state.yaml` 与根目录 `ROADMAP.md`。

> DEFAULT AGENT CONTEXT: `EXCLUDED`。只有当前 Task Contract 明确引用本文件时，才可读取指定章节作为历史证据。

状态：冻结的迁移前阶段需求索引；不得生成当前任务。

本文把长期路线拆成可验收的阶段需求。`REFACTOR_ROADMAP.md` 记录技术路线和历史进展，本文记录每个阶段从产品视角必须满足的需求、验收和量化指标。

## 阶段状态总览

| Phase | 名称 | 当前状态 | 核心指标 |
| --- | --- | --- | --- |
| P0 | 工程基线 | 已完成 | 基线验证命令可运行 |
| P1 | 安全止血 | 已完成，持续回归 | 生产默认密钥 fail-closed |
| P2 | Agent 工具边界 | 已完成，持续回归 | 工具调用 100% 审计 |
| P3 | AutoRepair Patch 工作流 | 已完成，持续增强 | 默认不直接写远端 |
| P4 | 任务系统状态机 | 已完成，持续增强 | 任务可追踪、可取消、可恢复 |
| P5 | 产物与数据清理 | 已完成，持续增强 | artifact/audit/workspace 可治理 |
| P6 | code_chunks 与 RAG | 已完成第一版，重点增强 | 路径、行号、方法锚点可检索 |
| P7 | Rust Analyzer 契约 | 已完成第一版 | schema/hash/限制有契约测试 |
| P8 | LLM Adapter 与安全输出 | 已完成第一版 | prompt injection 与 JSON 契约可回归 |
| P9 | 前端产品体验 | 进行中 | 关键页面无低级 UI/状态缺陷 |
| P10 | 沙箱隔离 | 已完成第一版，持续演练 | local/docker executor 边界清晰 |
| P11 | 测试与发布证据闭环 | BLOCKED/YELLOW，待刷新；`release-evidence/release-current-schema-20260705-0610` 为上一版/历史 full authority 候选，在最新 verifier 下已失效：首个失败为 `productPlaneMap must be an object` | 测试、CI、release evidence、verifier、smoke、失败分类和回归门禁形成可复现闭环 |
| P12-pre | 生产化收口与后置高级集成层 | 进行中；GitHub App E2E、私有仓库、真实 LLM provider 等高级集成仍后置、独立验收，不阻塞公开仓库主线 | `make verify`、smoke、backup/rollback、release evidence 可复现 |
| P12 | 规模化架构试点 | 未启动 | 由基准数据触发，不默认引入新组件 |

## P6 增量：Code QA citation label canonical normalization

目标：Code QA 必须把 LLM 输出的大小写或零填充 citation label 规范化到现有证据标签，例如 `[c01]` 等价于 `C1`。

Must：

- `CodeQaController.citedLabels(...)` 必须把 citation label 数字解析为正整数后输出 canonical `C数字`。
- `[c01]`、`[C01]` 必须匹配 retrieved chunk 的 `sourceLabel=C1`。
- `C0` 或无法解析的 label 不得生成有效引用。
- combined citation block、range citation、full-width bracket、fake citation in code/log/example line、malformed mixed bracket 的既有安全回归必须继续通过。
- grounding、`citationCoverage`、`claimCitationCoverage` 必须一致地使用 canonical label。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest,LlmClientAdapterTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、`CodeChunkSearchItem.sourceLabel` 生成规则、前端 UI、release evidence schema 或 LLM provider。
- 不放宽不存在标签、混用括号、代码块、日志行和示例行的 fail-closed 边界。

## P6 增量：Code QA structured JSON handler_class/handler_method method anchor

目标：当用户粘贴结构化 report JSON 中的 handler evidence 时，Code QA 必须能从 object、array 和 nested evidence object 中提取同一 object 内的 `handler_class + handler_method` 方法锚点。

Must：

- `CodeLocationHintParser.parseMethodHints(...)` 必须先尝试 bounded structured JSON handler parsing，再保留 compact/multiline legacy fallback。
- 同一 JSON object 内的 `handler_class + handler_method` 必须形成 `MethodHint`。
- parent object 只有 `handler_class`、child object 只有 `handler_method` 时，不得跨层绑定。
- compact handler method-first、跨 object 不误配、unsafe handler values fail-closed 等既有回归必须继续通过。
- `methodAnchorFileHints(...)` 必须继续输出 qualified package path variants，例如 `com/acme/billing/controller/PaymentController.java`。
- nested/array handler evidence object 必须能影响 `CodeQaRetrievalService` top chunk 排序。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、controller `EvidenceRef`、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不新增 `handlerClass/handlerMethod` 驼峰字段支持。
- 不声明完整 report evidence schema parser；复杂坏 JSON、超长 JSON 和超过 traversal budget 的结构允许退回 legacy fallback 或忽略。

## P6 增量：Code QA structured JSON evidence object parser

目标：当用户粘贴结构化 report JSON 时，Code QA 必须能从 object、array 和 nested evidence object 中提取同一 object 内的 `file_path/filePath + line/range` 绑定锚点。

Must：

- `CodeLocationHintParser.evidenceLocationHints(...)` 必须先尝试 bounded structured JSON candidate parsing，再保留 flat regex fallback。
- 同一 JSON object 内的 `file_path/filePath/filepath + start_line/end_line`、`startLine/endLine` 或 `line/line_number/lineNumber` 必须形成 `EvidenceLocationHint`。
- parent object 只有 `file_path`、child object 只有 `line_number` 时，不得跨层绑定。
- malformed JSON snippet 必须安全忽略 structured parse，并保留 flat object fallback。
- JSON traversal 必须有长度、深度和节点预算，避免异常嵌套输入拖垮解析。
- nested/array evidence object 必须能影响 `CodeQaRetrievalService` top chunk 排序。
- 既有 flat compact evidence object、range-over-line priority、compact line/range/handler、file_path 和 exact anchor 回归必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、controller `EvidenceRef`、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不声明完整 report evidence schema parser。
- 不支持跨父子 object 字段绑定；复杂坏 JSON、超长 JSON 和超过 traversal budget 的结构允许退回 fallback 或忽略。

## P6 增量：Code QA evidence object range-over-line priority

目标：当同一个 flat compact evidence object 同时包含 `line_number` 和 `start_line/end_line` 时，Code QA 必须优先使用更完整的行范围证据。

Must：

- `CodeLocationHintParser.evidenceLocationHints(...)` 在同一 object 内必须优先生成 `start_line/end_line` 或 `startLine/endLine` range hint。
- 只有 range 不成对或缺失时，才 fallback 到 `line/line_number/lineNumber`。
- `CodeQaRetrievalService` 必须在错误 `line_number` 与正确 range 同时存在时返回 range 覆盖 chunk。
- 既有 evidence object binding、compact line、compact range、compact handler、file_path 和 exact anchor 回归必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、controller `EvidenceRef`、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不实现完整 JSON parser、嵌套 JSON 解析或复杂多 range 语义。

## P6 增量：Code QA evidence object file_path + line binding anchor

目标：当用户一次粘贴多个 compact raw JSON evidence object 时，Code QA exact anchor 必须优先按同一 evidence object 内的 `file_path + line/range` 绑定定位，避免跨 object 误配。

Must：

- `CodeLocationHintParser.evidenceLocationHints(...)` 必须从 flat compact JSON object 中提取 `EvidenceLocationHint(filePath,lineHint)`。
- 同一 object 中 `file_path/filePath + line/line_number/lineNumber` 必须形成绑定锚点。
- 同一 object 中 `file_path/filePath + start_line/end_line` 或 `startLine/endLine` 必须形成绑定锚点。
- file-only object 与 line-only object 分属不同 object 时，不得生成绑定锚点。
- `CodeChunkRanker.isExactLocationAnchorMatch(...)` 在存在 evidence location binding 时必须使用绑定锚点判断 exact anchor，避免 query-level path/line 交叉误配。
- 既有 compact line、compact range、compact handler、file_path、source URL、semantic candidate 和 role diversity 回归必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、controller `EvidenceRef`、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不实现完整 JSON parser、嵌套 JSON 解析或非 flat object 的强绑定。
- 复杂 JSON 退回旧 query-level hints，不在本轮宣称完整解决。

## P6 增量：Code QA compact raw JSON line_number evidence anchor

目标：当用户粘贴 compact raw JSON report evidence 时，`line/line_number/lineNumber` 必须形成行号锚点，使 Code QA retrieval 能结合 `file_path` 定位目标文件中覆盖该行的 chunk。

Must：

- `CodeLocationHintParser.parseLineHints(...)` 必须支持 compact `line`、`line_number`、`lineNumber` 字段。
- compact line parser 不得误识别 `deadline`、`outline_line` 等非 evidence 字段。
- `stripLocationHintsForTokenization(...)` 必须清理 compact line fields 和数值噪声，同时保留文件路径/文件名 token。
- compact raw `file_path + line_number` 必须能让目标文件中覆盖该行的 chunk 压过同文件错误行和同名高噪声 decoy。
- 既有 compact file_path、compact start/end、compact handler、object-boundary、Vite/source URL 和 retrieval first result tests 必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、controller `EvidenceRef`、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不实现完整 JSON parser、跨 object 严格绑定或结构化 evidence object model。
- 不声明 `line_number` 与 `file_path` 已强绑定到同一个 JSON object；当前是同一 query 内 hints 联合打分。

## P6 增量：Code QA compact raw JSON handler_class/handler_method anchor

目标：当用户粘贴 compact raw JSON report evidence 时，`handler_class/handler_method` 必须形成方法级锚点，避免报告证据进入 Code QA 后退化为普通关键词或同名文件匹配。

Must：

- `CodeLocationHintParser.parseMethodHints(...)` 必须支持 compact quoted `handler_class` 与 `handler_method` 字段。
- compact handler parser 不得接受任意字段名或非 Java identifier/package 风格值。
- `handler_class` 与 `handler_method` 之间出现 `{` 或 `}` 时，必须重置 pending handler，避免跨 compact object 误配。
- `methodAnchorFileHints(...)` 必须继续输出 qualified package path variants，例如 `com/acme/billing/controller/PaymentController.java`。
- compact raw handler anchor 必须能让目标完整路径压过同名高噪声 decoy。
- 既有 handler multiline、compact file_path、compact start/end、object-boundary、Vite/source URL 和 retrieval first result tests 必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、controller `EvidenceRef`、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不实现完整 JSON parser、嵌套 JSON 解析或非引号 handler 值解析。
- 字符串值或嵌套对象含 `{}` 时可能保守丢弃合法 handler pairing，本轮接受该 false negative。

## P6 增量：Code QA compact raw JSON file_path evidence anchor

目标：当用户粘贴 compact raw JSON evidence 时，`file_path/filePath` 必须进入 `evidenceFilePathHints` 强锚点，使 Code QA retrieval 能用报告指定的完整路径压过同名高噪声 decoy。

Must：

- `CodeLocationHintParser.evidenceFilePathHints(...)` 必须支持 compact quoted `file_path` 与 `filePath` 字段。
- compact parser 不得接受非 evidence 的 `path` 字段。
- compact `file_path` 不得退化为普通路径全文扫描；必须限定字段名。
- compact raw `file_path + start_line/end_line` 必须能让目标完整路径压过同名高噪声 decoy。
- 既有 multiline file_path、line range、object-boundary、Vite/source URL 和 retrieval first result tests 必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、controller `EvidenceRef`、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不实现完整 JSON parser。
- 不支持 compact 非引号 path 值。

## P6 增量：Code QA compact raw JSON start/end object-boundary guard

目标：当用户粘贴多个 compact raw JSON evidence object 时，`start_line` 与 `end_line` 的配对不得跨对象误配；合法连续对象仍要各自解析范围。

Must：

- `CodeLocationHintParser` 在 compact start/end field 扫描时，若两个字段之间出现 `{` 或 `}`，必须重置 pending start/end。
- compact object A 只有 `start_line`、object B 只有 `end_line` 时，不得生成 `LineHint`。
- 连续两个合法 compact object 各自包含 `start_line/end_line` 时，必须解析出两个范围。
- 既有 multiline raw range、compact raw range、unpaired guard、Vite/source URL、path line range 和 Code QA retrieval first result tests 必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、controller `EvidenceRef`、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不实现完整 JSON parser、嵌套 JSON 解析或字符串内 brace 识别。
- 同一对象内字符串值或嵌套对象含 `{}` 时可能保守丢弃合法 range，本轮接受该 false negative。

## P6 增量：Code QA compact raw JSON start/end line range parser

目标：当用户把压缩成单行的报告 JSON 直接粘贴到 Code QA 问题里时，`start_line/end_line` 和 `startLine/endLine` 必须被解析为行范围锚点，避免 compact raw evidence 退化为普通关键词或仅文件路径匹配。

Must：

- `CodeLocationHintParser.parseLineHints(...)` 必须支持 compact raw JSON/text 中成对 `start_line/end_line` 和 `startLine/endLine`。
- 字段扫描不得放宽通用 `:数字`；必须限定为 start/end line 字段名。
- 未成对的 `start_line` 或 `end_line` 不得产生单点 line hint。
- `stripLineHints(...)` 必须能清理 compact start/end 字段，避免 line number 噪声进入 tokenization。
- compact raw `file_path + start_line/end_line` 必须能让 Code QA retrieval 优先定位覆盖该范围的 chunk。
- 既有 multiline raw range、Vite source URL、path line range、word/CJK line、line_number、method/stack/source URL 和 exact anchor retrieval tests 必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、controller 结构化 `EvidenceRef`、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不实现完整 JSON object parser；不按 JSON object 或 `file_path` 作用域绑定 start/end。
- 不解决多 compact object 同一行混排的跨对象误配风险。

## P6 增量：Code QA raw JSON start/end line range parser

目标：当用户把报告 raw JSON 或证据片段直接粘贴到 Code QA 问题里时，`start_line/end_line` 和 `startLine/endLine` 必须被解析为行范围锚点，避免范围证据退化为普通关键词或仅文件路径匹配。

Must：

- `CodeLocationHintParser.parseLineHints(...)` 必须支持逐行 raw JSON/text 中成对 `start_line/end_line` 和 `startLine/endLine`。
- 未成对的 `start_line` 或 `end_line` 不得产生单点 line hint。
- `stripLineHints(...)` 必须先清理 evidence line fields，再清理通用 path line hints，避免 `"start_line": 85` 被先变成残留字段名。
- raw `file_path + start_line/end_line` 必须能让 Code QA retrieval 优先定位覆盖该范围的 chunk。
- 既有 Vite source URL、path line range、word/CJK line、line_number、method/stack/source URL 和 exact anchor retrieval tests 必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 DTO/API/DB schema、controller 结构化 `EvidenceRef`、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不实现完整 JSON parser；压缩成单行的 raw JSON 不在本轮范围。
- 不交换倒置范围；倒置范围按 start-start 归一化。

## P6 增量：Code QA tight line range preference

目标：当用户问题携带报告行号、stack trace 或 source URL，且同一文件多个 chunk 都完整覆盖目标行时，Code QA 排序应偏向更紧的行范围，降低 broad chunk 抢占首位造成定位不精确的风险。

Must：

- `CodeChunkRanker.lineHintScore(...)` 必须只在 chunk 完整覆盖 line hint 时增加 tight range bonus。
- 部分重叠和近邻 line hint scoring 必须保持原逻辑。
- 同一路径 broad `1-500` 与 tight `81-92` 都覆盖 `:85` 时，focused regression 必须证明 tight chunk 排第一。
- 既有 exact line、method reference、Java stack trace、function stack frame、Vite query URL、source URL suffix 和 exact-anchor per-file cap 测试必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 API/DTO/DB schema、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不声明严格最短范围排序；本轮是分档偏好，不是绝对 guarantee。
- 不声明真实项目整体检索质量已证明提升。

## P6 增量：Code QA exact-anchor per-file first-pass cap

目标：当用户问题携带报告行号、stack trace 或源码位置，且同一目标文件存在多个重叠 chunk 都覆盖该 exact anchor 时，Code QA 不得让同文件重叠 chunk 在 exact-anchor 首轮填满 top context；必须保留首条 exact anchor，同时给跨文件 service/mapper 等证据留出位置。

Must：

- `CodeQaRetrievalService` 必须定义 exact-anchor 首轮每文件 cap。
- exact-anchor 首轮同一文件最多选择 1 个 chunk。
- 首条 exact line/method/stack/source URL anchor 仍必须优先进入 selected top context。
- role diversity 和普通 backfill 仍可按既有 `MAX_CONTEXT_CHUNKS_PER_FILE=2` 行为补入第二个同文件 chunk。
- overlapping same-file exact anchors 场景必须证明 service 和 mapper 等跨文件证据不会被挤掉。
- 既有 exact line、method reference、Java stack trace、qualified package decoy、frontend kebab file、function stack frame、Vite query URL 和 source URL suffix 测试必须继续通过。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaRetrievalServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不改 API/DTO/DB schema、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不声明最终结果严格只保留 1 个同文件 exact chunk；本轮只限制 exact-anchor 首轮。
- 不声明真实项目整体检索质量已证明提升。

## P9 增量：ProjectDetail workflow tables scroller containment

目标：项目工作台的仓库接入表和扫描任务表在桌面、390px 和 320px 窄屏下由表格自身承接横向内容，不让页面整体横向溢出，保留仓库、认证、状态、扫描、Commit、步骤、进度和操作列可访问。

Must：

- ProjectDetail 仓库表必须有稳定 `sl-project-repository-table` class。
- ProjectDetail 仓库表必须保留 `scroll={{ x: 900 }}`。
- ProjectDetail 扫描任务表必须有稳定 `sl-project-scan-table` class。
- ProjectDetail 扫描任务表必须保留 `scroll={{ x: 920 }}`。
- `.sl-workflow-table` 必须设置 `width:100%`、`max-width:100%`、`min-width:0` 和受控 overflow。
- `.sl-workflow-table .ant-table-container` 等 Ant wrapper 必须被约束在父级宽度内。
- `.sl-workflow-table .ant-table-content` 必须设置 `overflow-x:auto`。
- `app-shell-ui` smoke 必须让 `/api/projects/:id/repositories` 和 `/api/projects/:id/scan-tasks` 返回非空长文本行，mock `/code-chunks/search` status probe，并在 desktop、390px 和 320px 视口访问 `/projects/:id` 后切到“仓库管理”和“扫描任务”tab 验证两个 workflow table scroller containment。
- 测试不得把正常纵向页面滚动误判为失败，只验证横向 containment 和页面无全局横向溢出。
- `validate-frontend-ui` 必须静态锁住 class、CSS、非空 mock 行、code_chunks status probe mock 和 smoke guard。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console exec tsc -- -p web-console/tsconfig.json --noEmit` 通过。
- `make app-shell-ui-smoke` 通过，marker 包含 `project-detail-workflow-table-scroller-contained`。
- `npm --prefix web-console run build` 通过。

非范围：

- 不宣称全站表格、真实横向拖动距离、真实生产数据或全站 P9 可读性完成。
- 不刷新 full release authority。
- 不修改后端、DB、API、GitHub App 或真实 LLM provider。

## P9 增量：Dashboard recent scans table scroller containment

目标：运营仪表盘最近扫描表格在桌面、390px 和 320px 窄屏下由表格自身承接横向内容，不让页面整体横向溢出，保留仓库、状态、Commit、触发方式、耗时和创建时间列可访问。

Must：

- Dashboard 最近扫描表格必须有稳定 `sl-dashboard-recent-table` class。
- Dashboard 最近扫描表格必须保留 `scroll={{ x: 760 }}`。
- `.sl-dashboard-recent-table` 必须设置 `width:100%`、`max-width:100%`、`min-width:0` 和受控 overflow。
- `.sl-dashboard-recent-table .ant-table-container` 等 Ant wrapper 必须被约束在父级宽度内。
- `.sl-dashboard-recent-table .ant-table-content` 必须设置 `overflow-x:auto`。
- `app-shell-ui` smoke 必须让 `/api/dashboard/recent-scans` 返回非空长文本扫描行，并在 desktop、390px 和 320px 视口访问 `/dashboard` 验证 Dashboard recent table scroller containment。
- 测试不得把正常纵向页面滚动误判为失败，只验证横向 containment 和页面无全局横向溢出。
- `validate-frontend-ui` 必须静态锁住 class、CSS、非空 mock 行和 smoke guard。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console exec tsc -- -p web-console/tsconfig.json --noEmit` 通过。
- `make app-shell-ui-smoke` 通过，marker 包含 `dashboard-recent-table-scroller-contained`。
- `npm --prefix web-console run build` 通过。

非范围：

- 不宣称全站表格、真实横向拖动距离、真实生产数据或全站 P9 可读性完成。
- 不刷新 full release authority。
- 不修改后端、DB、API、GitHub App 或真实 LLM provider。

## P9 增量：Projects list table scroller containment

目标：项目管理入口的项目列表表格在桌面、390px 和 320px 窄屏下由表格自身承接横向内容，不让页面整体横向溢出，保留项目、技术栈、状态、健康度、创建时间和操作列可访问。

Must：

- Projects 列表表格必须有稳定 `sl-project-list-table` class。
- Projects 列表表格必须保留 `scroll={{ x: 900 }}`。
- `.sl-project-table-card` 必须设置 `width:100%`、`max-width:100%`、`min-width:0` 和受控 overflow。
- `.sl-project-list-table` 与 `.ant-table-container` 必须被约束在父级宽度内。
- `.sl-project-table-card .ant-table-content` 必须设置 `overflow-x:auto`。
- `app-shell-ui` smoke 必须在 desktop、390px 和 320px 视口访问 `/projects` 并验证 Projects table scroller containment。
- 测试不得把正常纵向页面滚动误判为失败，只验证横向 containment 和页面无全局横向溢出。
- `validate-frontend-ui` 必须静态锁住 class、CSS 和 smoke guard。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console exec tsc -- -p web-console/tsconfig.json --noEmit` 通过。
- `make app-shell-ui-smoke` 通过，marker 包含 `projects-table-scroller-contained`。
- `npm --prefix web-console run build` 通过。

非范围：

- 不宣称全站表格、真实横向拖动交互、真实生产数据或全站 P9 可读性完成。
- 不刷新 full release authority。
- 不修改后端、DB、API、GitHub App 或真实 LLM provider。

## P9 增量：CiDiagnostics diagnostics table scroller containment

目标：CI 诊断页诊断表格在桌面与 320px 窄屏下由表格自身承接横向内容，不让页面整体横向溢出，保留 workflow、状态、分类、分支、提交和重新分析操作可访问。

Must：

- CiDiagnostics 诊断表格必须有稳定 `sl-ci-diagnostics-table` class。
- 诊断表格必须保留 `scroll={{ x: 760 }}`。
- `.sl-ci-table-card` 必须设置 `width:100%`、`max-width:100%`、`min-width:0` 和受控 overflow。
- `.sl-ci-diagnostics-table` 与 `.ant-table-container` 必须被约束在父级宽度内。
- `.sl-ci-table-card .ant-table-content` 必须设置 `overflow-x:auto`。
- `ci-diagnostics-detail-selection` smoke 必须在 desktop 与 320px narrow 视口验证 diagnostics table scroller containment。
- `validate-frontend-ui` 必须静态锁住 class、CSS 和 smoke marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console exec tsc -- -p web-console/tsconfig.json --noEmit` 通过。
- `make ci-diagnostics-detail-selection-ui-smoke` 通过，marker 包含 `diagnosticsTableContained=true`、`overflowXAuto=true`。
- `npm --prefix web-console run build` 通过。

非范围：

- 不宣称全站表格、真实 CI 分析质量、真实 AutoRepair 质量或全站 P9 可读性完成。
- 不刷新 full release authority。
- 不修改后端、DB、API、GitHub App 或真实 LLM provider。

## P9 增量：ModelConfig provider table scroller containment

目标：模型配置页 Provider 表格在桌面与 320px 窄屏下由表格自身承接横向内容，不让页面整体横向溢出，保留 provider、endpoint、密钥状态和操作列可访问。

Must：

- ModelConfig Provider 表格必须有稳定 `sl-model-provider-table` class。
- Provider 表格必须保留 `scroll={{ x: 780 }}`。
- `.sl-model-table-card` 必须设置 `width:100%`、`max-width:100%`、`min-width:0` 和受控 overflow。
- `.sl-model-provider-table` 与 `.ant-table-container` 必须被约束在父级宽度内。
- `.sl-model-table-card .ant-table-content` 必须设置 `overflow-x:auto`。
- `model-config-recoverable` smoke 必须在 desktop 与 320px narrow 视口验证 provider table scroller containment。
- `validate-frontend-ui` 必须静态锁住 class、CSS 和 smoke marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console exec tsc -- -p web-console/tsconfig.json --noEmit` 通过。
- `make model-config-recoverable-ui-smoke` 通过，marker 包含 `provider-table-scroller-contained`、`providerTableContained=true`、`overflowXAuto=true`。
- `npm --prefix web-console run build` 通过。

非范围：

- 不宣称全站表格、真实 provider 调用、真实 LLM 质量或全站 P9 可读性完成。
- 不刷新 full release authority。
- 不修改后端、DB、API、GitHub App 或真实 LLM provider。

## P9 增量：IssueDecomposition table scroller containment

目标：Issue 拆解队列和子任务表格在桌面与窄屏下由表格自身承接横向内容，不让页面整体横向溢出，也不隐藏关键列。

Must：

- IssueDecomposition 主表必须有稳定 `sl-issue-main-table` class。
- IssueDecomposition 子任务表必须有稳定 `sl-issue-task-table` class。
- `.sl-issue-table-card` 与 `.sl-issue-detail-card` 必须设置 `max-width:100%`、`min-width:0` 和受控 overflow。
- 主表和子任务表的 `.ant-table-content` 必须设置 `overflow-x:auto`。
- `issue-decomposition-detail-selection` smoke 必须在 desktop 与 320px narrow 视口验证主表和子任务表 scroller containment。
- `validate-frontend-ui` 必须静态锁住 class、CSS 和 smoke guard。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console exec tsc -- -p web-console/tsconfig.json --noEmit` 通过。
- `make issue-decomposition-detail-selection-ui-smoke` 通过，marker 包含 `mainTableScrollerContained=true` 与 `taskTableScrollerContained=true`。
- `npm --prefix web-console run build` 通过。

非范围：

- 不宣称全站表格、drawer、真实生产数据或全站 P9 可读性完成。
- 不刷新 full release authority。
- 不修改后端、DB、API、GitHub App 或真实 LLM provider。

## P6 增量：Code chunks role intent no-content-like hot path

目标：上一轮已经移除 keyword wrapper 的 `content LIKE`，本轮继续收紧 role intent 候选池，确保 controller/service/data/model intent 查询也不再扫描 `code_chunks.content` 大字段。

Must：

- `CodeChunkService.addRoleIntentConditions(...)` 不得使用 `CodeChunk::getContent`。
- Controller、Service、Data access、Domain model、Frontend intent 候选只能使用 `file_path` 结构信号。
- Java/Kotlin 常见后缀必须保留：`Controller.java/.kt`、`Service.java/.kt`、`Repository.java/.kt`、`Mapper.java/.kt`、`Dao.java/.kt`、`Entity.java/.kt`、`Model.java/.kt`。
- `CodeChunkServiceTest` 必须覆盖 role intent 补池，并断言所有查询 SQL segment 不包含 `content LIKE`。
- 现有 role intent 检索测试必须继续通过。
- `scripts/security-regression-check.sh --suite static` 必须通过静态断言锁住运行代码不得出现 `like(CodeChunk::getContent)`。

验收：

- `rg -n "like\\(CodeChunk::getContent|content LIKE|CodeChunk::getContent" backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeChunkService.java` 无运行代码命中。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest test` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不引入全文索引、向量库或新检索服务。
- 不声明全文语义召回质量完成；path/structure-first 后的召回质量继续作为 P6 后续优化。
- 不刷新 full release authority。

## P11 增量：Current full release authority refresh 20260704

目标：把 P11 release evidence 从上一轮 `release-current-schema-20260702-230650` 刷新到吸收最新 verifier 合同的完整 `release` profile 包，防止旧 evidence 因缺少 report evidence QA citation manifest presence 字段仍被误用为当前 authority。

Must：

- full release evidence 必须使用稳定 backend jar runtime，不得使用 `target/classes`、`mvn spring-boot:run` 或 `backend-spring/target/*.jar` 作为 release smoke 运行态。
- release profile manifest 必须包含并通过 `public_repo_report_evidence_qa_citation_manifest_present=true` 与 `public_repo_report_evidence_qa_citation=true`。
- public repo smoke 必须保留 source-location probe v4 exact first-result proof。
- report evidence drawer UI smoke verifier 必须匹配当前 smoke fixture：长路径 `ChatControllerWithVeryLongBoundaryEvidencePath.java`、drawer query `6/3/3`、QA request `6`。
- AutoRepair patch backend smoke verifier 必须匹配当前 smoke fixture：`src/main/java/demo/LargeController.java`。
- 旧 full package 若缺少最新 manifest presence 字段，必须被降级为 historical evidence。

验收：

- `SOURCELENS_BASE_URL=http://localhost:19081 SOURCELENS_RELEASE_EVIDENCE_RUN_ID=release-current-schema-20260704-1618 make release-evidence-release` 生成 `release-evidence/release-current-schema-20260704-1618`。
- `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260704-1618` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` 通过。
- `bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh scripts/autorepair-patch-smoke.sh` 通过。

非范围：

- 不补齐 `backup-restore-drill-evidence` 和 `rollback-plan` 的生产签署归档。
- 不完成 GitHub App drill、GitHub webhook drill 或真实 LLM provider run。
- 不宣称私有仓库认证、外部 webhook E2E、生产灾备/回滚治理完整闭环已经完成。

## P12-pre 增量：API design inventory gate

目标：把 `docs/API_DESIGN.md` 从人工维护文档提升为可检查的 API 契约入口，防止 Spring controller 新增或改名路由后文档继续漂移。

Must：

- 必须新增 `scripts/validate-api-design.mjs`，从 `backend-spring/src/main/java/com/sourcelens/**/*Controller.java` 静态提取 Spring MVC 路由。
- 脚本必须覆盖当前项目使用的 `@RequestMapping`、`@GetMapping`、`@PostMapping`、`@PutMapping`、`@PatchMapping` 和 `@DeleteMapping`。
- 代码里存在但 `docs/API_DESIGN.md` 未记录的路由必须 fail-closed。
- 文档里存在但 controller 未发现的业务路由默认失败；`GET /api-docs` 等框架端点必须进入显式 allowlist。
- `make api-design-check` 必须作为独立入口存在。
- `scripts/verify-all.sh` / `make verify` 必须包含 API design contract gate。
- `docs/API_DESIGN.md` 中 `scanTaskId` 等路径参数名必须与当前 controller 保持一致。

验收：

- `node --check scripts/validate-api-design.mjs` 通过。
- `node scripts/validate-api-design.mjs` 通过，并输出 `controllers=27 routes=89 documentedControllerRoutes=89 docsOnlyAllowed=1`。
- `make api-design-check` 通过。
- `git diff --check -- scripts/validate-api-design.mjs Makefile scripts/verify-all.sh docs/API_DESIGN.md docs/PRODUCT_GOVERNANCE.md docs/OPERATIONS_RUNBOOK.md docs/PHASE_REQUIREMENTS.md docs/AGENT_ACTIVITY_LOG.md docs/PRODUCT_PROGRESS_LOG.md docs/AGENT_STATUS_BOARD.md docs/CODEX_HANDOFF.md` 通过。

非范围：

- 不生成 OpenAPI schema。
- 该阶段不校验嵌套 DTO、HTTP status、query 参数或 response body 的完整语义；嵌套 Request DTO 字段由后续专项增强。
- 不刷新 full release authority。
- 不替代后端 controller 测试或真实 API smoke。

## P12-pre 增量：Nested Request DTO field contract gate

目标：把 API design gate 从 Request DTO 顶层字段推进到首批一层嵌套 Request DTO 字段，防止 `evidenceRef`、`provenance` 这类关键业务对象和 `docs/API_DESIGN.md` 漂移。

Must：

- `scripts/validate-api-design.mjs` 必须在顶层字段比对通过后继续检查明确嵌套 DTO 的一层字段。
- 首批必须覆盖 `CodeQaRequest.evidenceRef` 和 `AutoRepairRequest.provenance`。
- `docs/API_DESIGN.md` 必须补齐 `AutoRepairRequest.provenance` 当前 DTO 全量字段。
- `make api-design-check` 输出必须包含 `nestedChecked=2`，并列出 `AutoRepairRequest.provenance (Provenance)` 与 `CodeQaRequest.evidenceRef (EvidenceRef)`。
- `scripts/verify-all.sh` 的步骤名称必须表达为 API contract gate，而不是只写 route inventory。

验收：

- `node --check scripts/validate-api-design.mjs` 通过。
- `node scripts/validate-api-design.mjs` 通过，并输出 `API request body docs: checked=23 nestedChecked=2 skipped=4`。
- `make api-design-check` 通过。
- `git diff --check -- scripts/validate-api-design.mjs Makefile scripts/verify-all.sh docs/API_DESIGN.md docs/OPERATIONS_RUNBOOK.md docs/PHASE_REQUIREMENTS.md docs/QUALITY_SCORECARD.md docs/AGENT_STATUS_BOARD.md docs/AGENT_ACTIVITY_LOG.md docs/PRODUCT_PROGRESS_LOG.md docs/CODEX_HANDOFF.md docs/WORK_INTAKE_AND_BACKLOG.md` 通过。

非范围：

- 不生成 OpenAPI schema。
- 不校验 Response DTO 字段、HTTP status、query 参数、validation annotation 语义、多层递归、数组元素 schema、generic DTO 或 record constructor component。
- 不硬解析 `Map<String,Object>` mock LLM 请求体、GitHub webhook raw `String body`。
- 不刷新 full release authority。

## P6 增量：Code QA first PRIMARY exact-anchor evidence

目标：把 Code QA 的 method-anchor / stack-trace 检索从“存在一个 PRIMARY 命中 exact anchor”提升为“第一条 PRIMARY 结果就是 exact anchor”，防止高分噪声或同文件上下文把用户定位入口顶到后面。

Must：

- `PUBLIC_REPO_SMOKE_OK.codeUnderstandingFixture.codeQa` 必须输出 `firstPrimaryExactAnchorPreserved=true`。
- 同一 marker 必须输出 `firstPrimaryIndex=0`、`firstPrimaryContextRole=PRIMARY`、`firstPrimaryFile`、`firstPrimaryStartLine`、`firstPrimaryEndLine`。
- `firstPrimaryFile` 必须等于 method anchor `filePath`。
- `firstPrimaryStartLine <= anchor.methodLine <= firstPrimaryEndLine`。
- release verifier 对新字段采用 historical-compatible optional-present strict：旧 authority 不因缺少字段失效；新 marker 一旦包含该字段，必须强校验全部旁证。
- security regression 必须拒绝 first-primary exact-anchor false、index 非 0、context 非 PRIMARY、file mismatch、range miss。

验收：

- `bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh` 通过。
- `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260704-1618` 通过，证明当前 full authority 未被新 optional-present strict 规则破坏。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker` 通过。
- focused live public repo smoke 通过，并输出 `firstPrimaryExactAnchorPreserved=true`。当前 retained sample：`projectId=351`、`repositoryId=312`、`scanTaskId=266`。

非范围：

- 不改 `CodeQaRetrievalService` 排序逻辑、API/DTO、DB schema、migration、embedding、LLM provider、前端 UI、GitHub App 或 webhook。
- 不刷新 full release authority；当前仍为 `release-evidence/release-current-schema-20260704-1618`。
- 不声明所有 code understanding、minified stack、sourcemap 或真实 provider 事实质量已完成。

## P6 增量：Raw Code QA cross-file citation summary

目标：把 raw `PUBLIC_REPO_SMOKE_OK.codeQa` 从“只有 coverage/claim coverage 计数”提升为“同级输出可审计的跨文件引用摘要”，让发布证据能直接说明 Code QA 回答是否跨文件、是否引用了 PRIMARY 文件、claim 是否被 PRIMARY 绑定。

Must：

- `PUBLIC_REPO_SMOKE_OK.codeQa.crossFileCitationSummary` 必须由 `codeQa.citationCoverage` 与 `codeQa.claimCitationCoverage` 派生，不允许写入 raw prompt、raw answer、URL、stack、source content 或 claim text。
- summary 必须输出 `visible=true`、`sourceEvidenceScopes=["CODE_QA_RESULT"]`、`currentScanOnly=true`。
- `tones` 必须由 answer-level coverage 派生：`citationCoverage.status=FULL` 且 PRIMARY 文件全覆盖时为 `["ready"]`；否则为 `["warning"]`，不得把 PARTIAL answer coverage 伪装为 ready。
- `statuses` 必须匹配 `codeQa.citationCoverage.evidenceRoleDistribution.status`。
- `crossFileEvidenceSatisfied` 必须等于 `uniqueEvidenceFileCount >= 2`。
- `citationBindingSatisfied` 必须由 `citedEvidenceFileCount > 0 && citedPrimaryEvidenceFileCount > 0` 派生。
- `claimBindingSatisfied` 必须由 `claimCitationCoverage.status=READY`、`citedRequiredClaimCount >= requiredClaimCount` 和 `requiredPrimaryBoundClaimCount >= requiredClaimCount` 派生。
- `coverageStatus` 必须匹配 `citationCoverage.status`，`fullCitationCoverageSatisfied` 必须等于 `coverageStatus=FULL`，`primaryCoverageSatisfied` 必须由 `citedPrimaryEvidenceFileCount >= primaryEvidenceFileCount` 派生。
- summary 的 evidence/claim 文件计数必须与父级 coverage 完全一致。
- release verifier 对该字段采用 historical-compatible optional-present strict：旧 authority 不因缺字段失效；新 marker 一旦包含该字段，必须强校验白名单、派生关系和敏感内容边界。
- security regression 必须拒绝 summary 非对象、未知字段、raw/URL/secret 字段、cross-file/citation/claim binding 伪造、父级计数不一致、`currentScanOnly=false`、scope/tone/status 漂移。

验收：

- `bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh` 通过。
- `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260704-1618` 通过，证明当前 full authority 未被 optional-present strict 破坏。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker` 通过。
- focused live public repo smoke 通过，并输出 `codeQa.crossFileCitationSummary.crossFileEvidenceSatisfied=true`、`citationBindingSatisfied=true`、`claimBindingSatisfied=true`、`coverageStatus=PARTIAL`、`tones=["warning"]`、`primaryCoverageSatisfied=false`。当前 retained sample：`projectId=353`、`repositoryId=314`、`scanTaskId=268`。

非范围：

- 不改后端 API、DTO、DB schema、embedding、LLM provider、前端 UI、GitHub App 或 webhook。
- 不把 `chunkSearch.crossFileRetrievalProof` 宣称为 Code QA answer citation summary。
- 不刷新 full release authority；当前仍为 `release-evidence/release-current-schema-20260704-1618`。
- 不声明 UI `qaFromEvidence` 与 raw `codeQa` schema 已完全对齐。
- 不声明真实 provider 事实正确性、semantic sufficiency 或完整 RAG 质量已验收。

## P6/P9 增量：ProjectDetail QA readable evidence view model

目标：把 `ProjectDetail` 中分散的 QA 可信度、跨文件引用、来源凭证、来源定位可信度和修复放行派生逻辑收敛为一个前端内部可读证据 view model，减少产品口径漂移，让页面渲染层只消费统一的 QA 证据决策对象。

Must：

- `ProjectDetail.tsx` 必须定义 `QaReadableEvidenceViewModel`，集中承载 `repairEvidenceGate`、`citationAudit`、`claimAudit`、`trustSummary`、`crossFileSummary`、`sourceEvidenceReceipt`、`sourceFileRelease`。
- `buildQaReadableEvidenceViewModel(msg)` 必须复用现有严格 helper：`qaRepairEvidenceGate`、`citationCoverageAudit`、`claimCitationAudit`、`qaTrustSummary`、`qaCrossFileCitationSummary`、`qaAnswerSourceEvidenceReceipt`、`qaSourceFileMatchRelease`。
- 渲染层必须从 `readableEvidence` 派生面板数据，不得重新在 JSX 附近分散计算 trust/cross-file/source-location/source-file-release 语义。
- `scripts/validate-frontend-ui.mjs` 必须锁住该 view model、builder 和渲染入口，防止后续回退成散落派生逻辑。
- 现有面板文案和布局保持稳定：`QA 可信度摘要`、`跨文件引用摘要`、`QA 回答报告证据凭证`、`来源定位可信度`、`来源文件匹配说明` 继续可见。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `git diff --check -- web-console/src/pages/ProjectDetail.tsx scripts/validate-frontend-ui.mjs` 通过。

非范围：

- 不改后端 API、DTO、DB schema、ranker、AutoRepair 状态机、release marker schema、GitHub App 或 webhook。
- 不声明 UI `qaFromEvidence` 与 raw `codeQa` schema 已完全对齐。
- 不声明真实 provider 回答质量、LLM 事实正确性、semantic sufficiency、完整 RAG 质量、修复候选正确性或 patch 可用性已验收。
- 不刷新 full release authority；当前仍为 `release-evidence/release-current-schema-20260704-1618`。

## P9 增量：ProjectDetail QA readable evidence section

目标：在 `QaReadableEvidenceViewModel` 已完成的基础上，把 ProjectDetail assistant QA 回答中的可信度、跨文件引用、来源凭证、来源文件匹配和下一步动作视觉上收敛为一个 `QA 可信证据` 区块，让用户先判断“能不能信、下一步做什么”，再进入底层审计细节。

Must：

- `ProjectDetail.tsx` 必须定义 `QaReadableEvidenceSection`，并在 assistant 回答正文之后、引用/审计/候选切片之前渲染。
- 区块必须使用 `section aria-label="QA 可信证据"`。
- 区块只包五类摘要面板，且顺序固定：`QA 可信度摘要`、`跨文件引用摘要`、`QA 回答报告证据凭证`、`来源文件匹配说明`、`QA 下一步动作`。
- `来源定位可信度` 继续作为 `QA 回答报告证据凭证` 内部语义，不拆成新顶层。
- `CitationCoverageAuditPanel`、`ClaimCitationAuditPanel`、`修复证据门禁`、回答引用和 code_chunks 候选证据必须保留在该区块外，避免可信证据摘要变成底层大杂烩。
- `QaReadableEvidenceSection` 必须只从 `readableEvidence` / `QaReadableEvidenceViewModel` 取数据，不重新派生 QA trust / source / release 语义。
- CSS 必须给 `sl-qa-readable-evidence`、ready/warning/blocked、head、flow 和移动端 header column 布局提供稳定样式；内部现有面板 margin 必须归零，避免视觉上继续散落。
- `scripts/validate-frontend-ui.mjs` 必须锁定组件存在、aria label、五段顺序、区块外审计/门禁边界和 CSS 合同。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `npm --prefix web-console run smoke:project-qa-recoverable` 通过，覆盖 `1440x900`、`390x844`、`320x740`，且证明 ready/review source-location、review 不显示修复候选、无横向溢出。
- `git diff --check -- web-console/src/pages/ProjectDetail.tsx web-console/src/styles/app.css scripts/validate-frontend-ui.mjs` 通过。

非范围：

- 不改后端 API、DTO、DB schema、ranker、AutoRepair 状态机、release marker schema、GitHub App 或 webhook。
- 不把底层 citation/claim audit 或 repair gate 合并进 `QA 可信证据` 摘要区块。
- 不声明 UI `qaFromEvidence` 与 raw `codeQa` schema 已完全对齐。
- 不声明真实 provider 回答质量、LLM 事实正确性、semantic sufficiency、完整 RAG 质量、修复候选正确性或 patch 可用性已验收。
- 不刷新 full release authority；当前仍为 `release-evidence/release-current-schema-20260704-1618`。

## P9 增量：ProjectDetail QA detailed audit section

目标：在 `QA 可信证据` 摘要区块之后，把底层 `引用覆盖审计`、`主张引用质量` 和 `修复证据门禁` 分组成一个 `QA 底层审计证据` 区块，降低页面视觉噪声，同时保持现有 smoke 依赖的内部 aria label 和 READY/REVIEW/BLOCKED 可见性。

Must：

- `ProjectDetail.tsx` 必须定义 `QaDetailedEvidenceAuditSection`，使用 `section aria-label="QA 底层审计证据"`。
- 该区块必须只承载 `CitationCoverageAuditPanel`、`ClaimCitationAuditPanel` 和 `QaRepairEvidenceGatePanel`。
- `引用覆盖审计`、`主张引用质量`、`修复证据门禁` 的内部 aria label 必须继续可见，不允许默认折叠或隐藏。
- `QaRepairEvidenceGatePanel` 必须继续显示 gate label、summary 和 checks，保留 `READY/REVIEW/BLOCKED` 文案。
- `QA 可信证据` 摘要区块必须仍在 detailed audit 区块之前。
- `scripts/validate-frontend-ui.mjs` 必须锁定 detailed audit section、三块内部面板、repair gate gate-based 渲染，以及 CSS 合同。
- CSS 必须给 `.sl-qa-detailed-audit`、ready/warning/blocked、head、flow 和移动端 header column 布局提供稳定样式；内部三块面板 margin 必须归零，避免视觉上继续散落。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `npm --prefix web-console run smoke:project-qa-recoverable` 通过，证明三视口、ready/review source location、review 不显示修复候选、无横向溢出。
- `git diff --check -- web-console/src/pages/ProjectDetail.tsx web-console/src/styles/app.css scripts/validate-frontend-ui.mjs` 通过。

非范围：

- 本轮不做默认折叠/展开交互；因为现有 release/public UI smoke 仍要求底层审计面板直接可见。
- 不改后端 API、DTO、DB schema、ranker、AutoRepair 状态机、release marker schema、GitHub App 或 webhook。
- 不声明 UI `qaFromEvidence` 与 raw `codeQa` schema 已完全对齐。
- 不声明真实 provider 回答质量、LLM 事实正确性、semantic sufficiency、完整 RAG 质量、修复候选正确性或 patch 可用性已验收。
- 不刷新 full release authority；当前仍为 `release-evidence/release-current-schema-20260704-1618`。

## P9 增量：ProjectDetail QA detailed audit compact summary

目标：在 `QA 底层审计证据` 内增加 `QA 底层审计摘要` 三格状态行，让用户先看 `引用覆盖 / 主张质量 / 修复门禁` 的当前状态，再继续阅读详细审计面板。该摘要只作为状态导航，不替代底层审计。

Must：

- `QaDetailedEvidenceAuditSection` 必须在 section head 与 detailed flow 之间渲染 `aria-label="QA 底层审计摘要"`。
- 摘要固定三项：`引用覆盖`、`主张质量`、`修复门禁`。
- 三项必须只读取既有 `citationAudit`、`claimAudit`、`repairEvidenceGate`：引用覆盖显示 `citationAudit.title` 与 `qaAuditTagText(citationAudit.tone)`；主张质量显示 `claimAudit.title` 与 `qaAuditTagText(claimAudit.tone)`；修复门禁显示 `repairEvidenceGate.label` 与 `repairEvidenceGate.status`。
- 不得在摘要行重新派生新的 QA readiness、引用质量或修复放行语义。
- `.sl-qa-detailed-audit-flow` 下的 `CitationCoverageAuditPanel`、`ClaimCitationAuditPanel`、`QaRepairEvidenceGatePanel` 必须继续直接渲染。
- CSS 必须锁定 `.sl-qa-detailed-audit-summary`、summary item、ready/warning/blocked、三列布局、响应式收缩和文本换行。
- `scripts/validate-frontend-ui.mjs` 必须锁住 summary row、三项来源、顺序、CSS 和 detailed panels 继续可见。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `npm --prefix web-console run smoke:project-qa-recoverable` 通过。
- `git diff --check -- web-console/src/pages/ProjectDetail.tsx web-console/src/styles/app.css scripts/validate-frontend-ui.mjs` 通过。

非范围：

- 不做折叠/展开；详细审计面板仍必须直接可见。
- 不用摘要替代 `引用覆盖审计`、`主张引用质量`、`修复证据门禁`。
- 不改后端 API、DTO、DB schema、ranker、AutoRepair 状态机、release marker schema、GitHub App 或 webhook。
- 不声明 UI `qaFromEvidence` 与 raw `codeQa` schema 已完全对齐。
- 不声明真实 provider 回答质量、LLM 事实正确性、semantic sufficiency、完整 RAG 质量、修复候选正确性或 patch 可用性已验收。
- 不刷新 full release authority；当前仍为 `release-evidence/release-current-schema-20260704-1618`。

## P6/P11 增量：Public repo UI source-location readability live evidence

目标：把 public repo UI source-location readability 从静态 contract 升级为真实公开仓库 live evidence，证明报告证据、Project QA、code understanding lens 和修复候选上下文在真实后端下可读、可追踪、无过度声明。

Must：

- public repo UI smoke 必须优先选择 `expectedEvidenceFile` 对应的 report evidence anchor，避免多证据返回时误用第一个非目标文件。
- code understanding lens 的 Playwright response wait 必须绑定本次 `file:line` query 和当前 `scanTaskId`，不能误捕获同页早期 code_chunks search response。
- `PUBLIC_REPO_UI_SMOKE_OK` 必须证明 `realBackend=true`、`mockedApi=false`。
- `PUBLIC_REPO_UI_SMOKE_OK.viewports` 必须覆盖 `1440x900`、`390x844`、`320x740`。
- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.sourceLocationReadability` 必须证明 `status=OK`、`surface=PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY`、`proofCount>=6`、`mobile390Covered=true`、`narrow320Covered=true`。
- source receipt、source location confidence、source file match release 必须分别证明 ready/review 两种状态 contained、可换行、not clipped，且 `noHorizontalOverflow=true`。
- review 路径必须证明 `REPORT_FILE_ANCHOR` 不显示修复候选入口。
- marker 必须声明 `providerQualityClaim=false`、`llmFactClaim=false`。
- focused release evidence 必须使用稳定 backend jar runtime，不得对 `target/classes` 或 `mvn spring-boot:run` runtime 取证。
- artifact raw download smoke 脚本必须携带 `rawDownloadAcknowledged=true`，匹配当前 P10 raw download acknowledgement 安全边界。

验收：

- `mvn -q -f backend-spring/pom.xml -DskipTests package` 通过。
- `SERVER_PORT=19081 make backend-jar` 可启动稳定 jar。
- direct live UI smoke 通过，并输出唯一 `PUBLIC_REPO_UI_SMOKE_OK`。
- focused release evidence `release-evidence/public-repo-ui-source-location-readability-20260704-115759` 生成成功，`required_failures=0`、`optional_warnings=0`。
- `./scripts/verify-release-evidence.sh release-evidence/public-repo-ui-source-location-readability-20260704-115759` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker` 通过。

非范围：

- 不刷新 current full release authority。
- 不证明真实 provider 回答质量或 LLM 事实正确。
- 不证明 GitHub App/Webhook E2E、私有仓库、多用户协作或生产部署。
- 不改变后端 API、DB schema、ranker 或 AutoRepair 状态机。

## P10 增量：Artifact raw download receipt id traceability

目标：把 artifact raw download 的审计追踪从 resource/action/status 级深链升级为 `auditLogId` 精确定位，同时保持 `auditLogId` 只是 locator、不是授权凭据。

Must：

- `AuditLogService.record(...)` 必须返回插入后的 audit log id；写入失败时允许返回 `null`，不得把审计异常扩大为 raw download 业务异常。
- `AuditLogService.listByProject(...)` 和 `AuditLogController` 必须支持 `auditLogId` filter，并继续要求 `projectId` 过滤。
- Artifact raw download 成功响应必须在有 receipt id 时返回 `X-SourceLens-Audit-Log-Id`。
- CORS 必须 expose `X-SourceLens-Audit-Log-Id`。
- Artifacts 页面必须读取该 header，并把正整数 `auditLogId` 追加到 `查看下载审计` URL。
- Artifacts 页面在未拿到 `auditLogId` 时不得显示 `receipt #...` 或宣称已精确 receipt id 追踪；只能显示资源、动作和状态级 fallback 审计定位入口。
- AuditLogs 页面必须解析 `auditLogId`，调用 API 时传入该 filter，并在 deep link auto-open 时要求 id/resource/action/status 匹配。
- `auditLogId`、`projectId`、`resourceType=ARTIFACT`、`resourceId`、`action=ARTIFACT_RAW_DOWNLOAD`、`status=SUCCESS` 可进入 URL；raw blob、源码正文、完整 diff、preview text、storagePath、本地绝对路径、filename、checksum、contentType、size、owner/repository 不得进入 header/query。
- `artifacts-detail-selection-smoke` 必须证明 download response header -> Artifacts audit URL 的 `auditLogId` 绑定。
- `artifacts-detail-selection-smoke` 必须证明 download response 缺少 `X-SourceLens-Audit-Log-Id` 时，fallback URL 不含 `auditLogId`，并且 UI 不显示精确 receipt id 声明。
- `audit-logs-detail-selection-smoke` 必须证明 AuditLogs `auditLogId` exact event 命中，且同 resource/action/status 之外的记录不会劫持。
- `validate-frontend-ui.mjs` 必须锁住 header parse、URL helper、AuditLogs query 和 smoke marker。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=ArtifactControllerTest,AuditLogControllerTest,AuditLogServiceTest,AutoRepairServiceTest test` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true npm --prefix web-console run smoke:artifacts-detail-selection` 通过。
- `CI=true npm --prefix web-console run smoke:audit-logs-detail-selection` 通过。
- `npm --prefix web-console run build` 通过。

非范围：

- 不新增单条 receipt lookup API。
- 不把 `auditLogId` 当成授权 token。
- 不声明 raw artifact 内容已脱敏、已扫描、无 secret 或可安全外发。
- 不声明完整 raw view/download 授权体系、高风险 artifact 策略、release evidence schema 或 full authority 已刷新。

## P10 增量：Artifact raw download audit deep link traceability

目标：把 `ARTIFACT_RAW_DOWNLOAD` receipt 从“后端可写入”升级为“Artifacts 页面可见、AuditLogs 可 exact deep link 复核、关联资源可回跳”，同时保持 raw content safety 边界清晰。

Must：

- Artifacts raw download 成功后必须展示 `原始产物下载已记录审计` 状态块。
- `查看下载审计` 必须使用低敏 query：`projectId`、`resourceType=ARTIFACT`、`resourceId`、`action=ARTIFACT_RAW_DOWNLOAD`、`status=SUCCESS`。
- AuditLogs `RESOURCE_OPTIONS` 必须包含 `ARTIFACT`。
- AuditLogs 对 `ARTIFACT` record 的关联资源必须回跳 `/artifacts?projectId=...&artifactId=...`。
- 表格和抽屉关联资源动作必须暴露 `data-sl-target-url`，用于证明目标 URL。
- `artifacts-detail-selection-smoke` 必须输出 `ARTIFACTS_RAW_DOWNLOAD_AUDIT_DEEP_LINK_ONLY` proof，证明入口可见、URL 低敏、project/resource/action/status bound、successOnly、无 raw payload、无 storagePath、无 filename。
- `audit-logs-detail-selection-smoke` 必须输出 `AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK`，证明 exact `ARTIFACT_RAW_DOWNLOAD/SUCCESS` 命中、不被同 artifact 其他 action/status 劫持、关联资源能回跳 Artifact detail。
- `validate-frontend-ui.mjs` 必须锁住 receipt 状态块、低敏 URL helper、ARTIFACT filter、ARTIFACT 回跳、`data-sl-target-url` 和两条 smoke marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true npm --prefix web-console run smoke:artifacts-detail-selection` 通过。
- `CI=true npm --prefix web-console run smoke:audit-logs-detail-selection` 通过。
- `npm --prefix web-console run build` 通过。

非范围：

- 不新增后端 API、DB schema、receipt id、release evidence schema 或真实后端 receipt lookup。
- 不声明 raw artifact 内容已脱敏、已扫描、无 secret 或可安全外发。
- 不声明完整 raw view/download 授权体系、服务端策略化高风险 artifact 控制或 full authority 刷新。

## P10 增量：Artifact raw download acknowledgement and audit receipt

目标：把 Artifacts 原始下载从“合法用户直接取 raw blob”升级为“显式确认 + 服务端 fail-closed + 审计 receipt”，并明确 raw download 不继承 preview display redaction。

Must：

- Artifact download API 必须要求显式 `rawDownloadAcknowledged=true`；未确认时必须返回 `400`，不得读取 raw bytes。
- 成功、拒绝或读取失败的 raw download 必须写入 `ARTIFACT_RAW_DOWNLOAD` 审计 receipt。
- 审计 input 可以记录 artifact metadata、owner、repository、contentType、size、checksum、fileName、`downloadKind=RAW_BLOB` 和 acknowledgement 状态。
- 审计不得记录 raw blob、源码正文、完整 diff、preview text、`storagePath` 或本地绝对路径。
- Artifacts 页面下载 raw blob 前必须展示明确确认，告知下载的是未经显示层脱敏处理的原始 artifact。
- Artifacts download request 必须携带 acknowledgement 参数。
- `artifacts-detail-selection-smoke` 必须输出 `ARTIFACTS_RAW_DOWNLOAD_ACKNOWLEDGEMENT_AUDIT_BOUNDARY_ONLY` marker，证明 request bound、acknowledgement present、receipt expected、no drawer hijack、marker no raw payload。
- `validate-frontend-ui.mjs` 必须锁住 API 参数、确认 modal、下载调用和 smoke marker。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=ArtifactControllerTest test` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true npm --prefix web-console run smoke:artifacts-detail-selection` 通过。
- `npm --prefix web-console run build` 通过。

非范围：

- 不声明 raw artifact 内容已脱敏、已扫描、无 secret 或可安全外发。
- 不声明完整 raw 查看/下载授权体系、receipt id 回显、AuditLogs deep link、历史 artifact 清理、服务端脱敏下载或 release full authority 刷新。

## P9/P10 增量：AgentChat title/handoff/API error display redaction

目标：把 AgentChat 中除 message bubble 之外的高风险文本入口纳入显示层脱敏，包括 conversation title、handoff URL/query/display/composer、page-level API error state 和本页 toast。

Must：

- AgentChat page-level API error state 必须使用 `redactAgentChatApiError` 后再进入 `StateBlock`。
- AgentChat 本页 API error toast 必须使用 redacted formatted error；不得直接 `showApiError` 原文。
- selected conversation title、sidebar title 和 delete accessible label 必须使用 shared display redaction。
- code-understanding handoff 的 `filePath/lineRef/source/input/context/evidence/relevance` 等文本字段进入 UI、title attr、composer prompt 或 generated conversation/task title 前必须脱敏。
- handoff URL query 中敏感文本必须被 replace 成 redacted query value，页面 URL 不得继续携带 injected raw secret。
- `agent-chat-closure-rail-smoke` 必须注入 title secret、handoff filePath/lineRef secret、API error secret，并分别输出：
  - `AGENT_CHAT_CONVERSATION_TITLE_DISPLAY_REDACTION_ONLY`
  - `AGENT_CHAT_HANDOFF_TITLE_FILE_PATH_DISPLAY_REDACTION_ONLY`
  - `AGENT_CHAT_API_ERROR_STATE_DISPLAY_REDACTION_ONLY`
- marker 必须证明 UI/body/URL/marker raw hidden；API error scope 还必须证明 local toast raw hidden。
- `validate-frontend-ui.mjs` 必须拒绝 raw selected title、conversation title、handoff filePath/lineRef 和 raw API error state 回退。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true npm --prefix web-console run smoke:agent-chat-closure-rail` 通过。
- `npm --prefix web-console run build` 通过。

非范围：

- 不改变后端 DB、API/SSE 原文、network payload、raw download/export、历史 payload、全站 toast 或真实 LLM provider 输出。
- 不把 URL sanitize 解释为服务端 payload 最小化；后续 P10 仍需独立设计 raw 查看/下载授权与审计。

## P9/P10 增量：AgentChat message/error display redaction

目标：把 AgentChat 普通 UI 中的 persisted message content、errorMessage 和 streaming content 从 raw pass-through 改为 shared display redaction，防止 Agent/LLM/tool/API 派生文本把凭据暴露到页面主体。

Must：

- `AgentChat.tsx` 必须使用 shared `displayRedaction` 工具处理 message/error 显示文本。
- `MessageBubble` 不得直接渲染 raw `msg.content`。
- `MessageBubble` 不得直接渲染 raw `msg.errorMessage`。
- `StreamingBubble` 不得直接渲染 raw `msg.content`。
- `agent-chat-closure-rail-smoke` 必须在 `ConversationMessage.content` 和 `ConversationMessage.errorMessage` 中注入 Authorization、Bearer、API key、password 和 JWT-like raw secret。
- smoke marker 必须新增 `agentChatMessageErrorRedaction.scope=AGENT_CHAT_MESSAGE_ERROR_DISPLAY_REDACTION_ONLY`，并证明 message log、error tag、body、URL 和 marker 不含 raw secret。
- `AGENT_TOOL_CALL_ARGS_RESULT_DISPLAY_REDACTION_ONLY` 必须继续保留，不能把工具调用和聊天正文/错误的证据混成一个 scope。
- `validate-frontend-ui.mjs` 必须拒绝 raw `msg.content` / `msg.errorMessage` 回退，并锁住 streaming content redaction 代码路径。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true npm --prefix web-console run smoke:agent-chat-closure-rail` 通过。
- `npm --prefix web-console run build` 通过。

非范围：

- 不改变后端数据库、审计日志、API/SSE 原文、network payload、raw download/export、历史对话清理或真实 LLM provider 输出。
- API error/toast、conversation title 和 handoff panel 已由后续 `AgentChat title/handoff/API error display redaction` 增量覆盖；其他页面 raw display 面仍作为后续 P9/P10 候选。

## P6 code_chunks 与 RAG 检索增强

目标：让 SourceLens 的代码逆向分析不仅能生成 code_chunks，还能在 Project QA、报告证据追问和后续 Agent/AutoRepair 复核中稳定找到正确代码证据。

Must：

- Project QA 不得只依赖关键词候选的前 80 条做语义重排；当 question embedding 可用时，必须追加同 `scanTaskId + embeddingModelKey` 的有界已向量化 chunk pool，再统一交给 `CodeQaRetrievalService` 重排。
- 语义候选池必须 bounded，当前上限为 500；不得全量加载 scan task 的所有 chunks，不得引入未规划的向量数据库或 DB schema 变更。
- 语义候选池必须过滤 `embedding is not null / not blank`，并且必须匹配当前 `embeddingModelKey`；不同 provider/model 产生的旧 embedding 不得参与当前问题的 cosine 加分。
- `CodeQaRetrievalService` 必须允许“关键词弱或无命中 + 语义强命中”的 chunk 进入重排；同时强关键词、路径、行号、方法锚点等高置信命中必须优先，不能被纯语义候选抢走。
- controller 合并候选时必须去重保序：关键词/路径/报告 evidenceRef anchor 候选优先，语义 pool 作为补充。
- `matchedChunks` 继续表示关键词/锚点命中数量，不得把语义 pool 数量混入该字段；`retrievalMode` 继续区分 `KEYWORD`、`HYBRID`、`SEMANTIC_FALLBACK`、`STABLE_FALLBACK`。

验收：

- `mvn -q -Dtest=CodeChunkControllerTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeQaControllerTest test` 通过。
- `CodeChunkServiceTest` 必须证明 semantic pool 按 `scanTaskId + embeddingModelKey` 查询、过滤空 embedding、过滤旧模型、并强制 `LIMIT 500`。
- `CodeQaRetrievalServiceTest` 必须证明目标 chunk 即使位于默认关键词候选之外，也能通过 semantic pool 和 cosine 被选为 top chunk；还必须证明强关键词命中不会被纯语义候选覆盖，旧模型 embedding 不参与加分。
- `CodeQaControllerTest` 必须证明 Project QA 会把默认候选和 semantic pool 去重合并后交给 retrieval service，且响应仍保持正确 `retrievalMode`、`retrievedChunks` 和 citation 字段。
- `public-repo-smoke` 可通过 `SOURCELENS_PUBLIC_REPO_SMOKE_SEMANTIC_PROBE=true|auto|false` 或别名 `SOURCELENS_PUBLIC_REPO_SMOKE_SEMANTIC_WEAK_KEYWORD=true|auto|false` 运行 Project QA 语义池白盒探针；显式 `true` 时必须证明当前公开仓库扫描后的第 81 个同模型 embedding rank 目标 chunk 能通过 semantic pool 命中，响应 `retrievalMode=SEMANTIC_FALLBACK`、`matchedChunks=0`、`embeddedChunks>=81`、首条 `retrievedChunks` 绑定目标 `id/filePath/startLine/endLine` 且 `hasEmbedding=true/contextRole=PRIMARY`。
- 该 public smoke 探针默认 `auto`，Docker/MySQL/MOCK LLM 不可用时只记录 `semanticWeakKeywordProbe.status=SKIPPED`；显式 `true` 时必须 fail closed。该探针是白盒检索机制证据，不证明真实外部 embedding provider 质量，不立刻升级为 release verifier 强门禁。
- `public-repo-smoke` 还可通过 `SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL=true|auto|false` 运行非 DB mutation 的 Project QA 弱关键词观测评估；该评估只调用真实 `/projects/{projectId}/qa`，不得 `UPDATE/INSERT/DELETE code_chunks`，marker 必须写入 `projectQaWeakKeywordEvaluation.probeKind=REAL_WEAK_KEYWORD_SAMPLE_EVAL`、`nonDbMutation=true`、`dbMutationUsed=false`、`providerQualityClaim=false`、`semanticFallbackHits`、`retrievalModeDistribution`、每个 sample 的 `matchedChunks/retrievalMode/resultCount/embeddedChunks/primary` 和当前 `scanTaskId` 绑定。默认 `auto` 允许 `INCONCLUSIVE/SKIPPED`；显式 `true` 时无 embedding、样本 API 失败、响应字段缺失或 `semanticFallbackHits` 低于配置阈值必须 fail closed。
- `verify-release-evidence.sh` 必须把 `projectQaWeakKeywordEvaluation` 作为 optional 子合同处理：历史 `PUBLIC_REPO_SMOKE_OK` 缺失该字段不得失败；字段一旦存在，必须离线校验 `REAL_WEAK_KEYWORD_SAMPLE_EVAL`、`mutationFree/nonDbMutation`、`dbMutationUsed=false`、`providerQualityClaim=false`、`mode/status`、`sampleCount/evaluatedCount/skippedCount`、`semanticFallbackHits >= minSemanticFallbackHits`、`retrievalModeDistribution` 汇总、sample 级 `retrievedChunkScanTaskIds` 当前 scan 绑定、semantic fallback sample 的 `matchedChunks=0/resultCount>0/primary.hasEmbedding=true/contextRole=PRIMARY`，以及 `llmCleanup.status=OK`。
- Project QA 的 fallback 答案必须保持引用审计可解释：未配置 LLM 或 LLM 调用失败等运行提示不得被误判为 required code claim；但真实代码事实、文件路径、方法、接口、数据库、权限、异常和修复建议仍必须进入 required claim citation audit。
- 运行提示豁免必须绑定后端生成的 operational fallback answer；普通 LLM 回答即使包含 `错误信息:`、配置、调用、AuthService、token 等文本，也不得因此绕过 required claim citation audit。
- fallback 证据句必须把 `[C*]` 引用标签放在证据句前部或主干内，避免 `.java/.ts` 等文件扩展名导致切句后 claim 与 citation 分离。
- `claimCitationCoverage.roleDistribution=PRIMARY_BOUND` 只表示 required claim 绑定了 PRIMARY 结构化证据，不表示 LLM 回答事实一定正确，也不得直接升级为 AutoRepair/PR hard gate。
- Project QA 修复放行必须对 `claimCitationCoverage.roleDistribution` fail closed：缺失 roleDistribution、父子 required/cited/file 计数不一致、`requiredPrimaryBoundClaimCount !== requiredClaimCount`、context/unknown/unbacked/invalid required counts 非 0、父级 claim file count 为 0、`requiredPrimaryFileCount<=0`，均不得显示可信结论或修复候选；`claimCitationAudit`、`qaTrustSummary` 和 `qaCrossFileCitationSummary` 必须复用同一严格 readiness 口径。
- 报告证据进入 Project QA 且请求携带 `evidenceRef.filePath` 时，`PRIMARY` 主证据边界必须收敛到报告锚点文件中的最高优先级 chunk；其他同文件或跨文件 Top chunks 必须作为 `ADJACENT_CONTEXT` 返回，不得把所有 Top chunks 都提升为 required evidence。
- 当 `evidenceRef.lineNumber` 存在时，后端必须优先选择覆盖该行的锚点 chunk；当只有 `filePath` 时，必须选择该文件的最高优先级 chunk。找不到锚点文件时才允许回退到普通 QA 的多 PRIMARY 口径。
- 浏览器/Vite/webpack source URL 必须可作为 P6 代码定位证据：`ProjectDetail.tsx?t=...:245:19`、`webpack://.../auth-store.ts:85:13` 和 standalone `http://localhost:5173/...` 不得被 query/hash、dev-server port 或列号污染；检索必须提取真实文件名、保留目标行号，并让报告 `filePath:` anchor 与 `sourceEvidenceMatchType` 正确归一到同一 chunk。
- Project QA 必须把 `sourceEvidenceRef`、`sourceEvidenceMatchType` 和回答引用文件转成用户可读的“来源定位可信度”摘要：`REPORT_LINE_ANCHOR + cited answer file + evidence line` 才能显示“来源定位可信”；`REPORT_FILE_ANCHOR` 必须降级为“来源定位需复核”，并提示同名文件/source URL 场景仍需人工确认具体行。该摘要只证明来源定位，不证明 LLM 事实语义正确。

量化指标：

- semantic pool 最大候选数：500。
- 语义候选跨 embedding model 污染数：0。
- 强关键词/路径锚点被纯语义候选错误覆盖数：0。
- public repo semantic probe 强制模式下默认候选池外目标召回数：>= 1。
- public repo weak keyword eval 显式模式下 semantic fallback 样本命中数：默认 >= 1。
- release verifier 对 optional `projectQaWeakKeywordEvaluation` marker 的伪造负例拦截：PASS。
- 默认候选池外语义目标召回测试：PASS。
- public repo Code QA fallback live evidence：真实 smoke 必须至少有一条 required claim，且 `claimCitationCoverage.status=READY`、`claimCoveragePercent=100`、`roleDistribution.status=PRIMARY_BOUND`。
- raw `PUBLIC_REPO_SMOKE_OK.codeQa.citationCoverage` 允许 `FULL` 或 `PARTIAL`；answer-level `PARTIAL` 不得导致 release verifier 失败，只要 `citedPrimaryEvidenceFileCount>0`、不超过 `primaryEvidenceFileCount`，且 claim-level `claimCitationCoverage.roleDistribution.status=PRIMARY_BOUND` 覆盖所有 required claims。UI/report evidence 中已声明 required coverage 100% 的路径仍按更强门禁处理。
- report evidence QA UI smoke 必须覆盖 `claimCitationCoverage.status=READY` 但 `roleDistribution` 缺失和 claim/role 计数矛盾两类负例；marker 必须保持 `qaRequestCount` 的主路径兼容语义，并用 `qaTotalRequestCount` 与 `qaFromEvidence.drift` 子对象记录新增负例。旧 direct 字段短期保留为 legacy compatibility，但新证据包的标准读取路径是 `qaFromEvidence.drift.claimRoleDistributionMissing/Mismatch`。
- report evidence QA UI smoke 和 public repo UI smoke 必须可见化 `sourceLocationConfidence`：mocked report evidence marker 需记录 `sourceLocationConfidence.readyVisible=true` 与 `reviewVisibleForFileAnchorDrift=true`；public repo marker 需记录 `evidenceHandoff.sourceLocationConfidenceVisible=true` 与 `sourceLocationConfidenceReadyVisible=true`。
- release verifier/security regression 必须消费上述 drift 子对象：旧 marker 缺少 optional drift 字段不得失败；字段一旦出现，必须校验 `qaFromEvidence.drift` 是对象且只包含 `claimRoleDistributionMissing` / `claimRoleDistributionMismatch`，并校验 `requestCount>0`、`sourceEvidenceMatchType=REPORT_LINE_ANCHOR`、parent claim status 仍为 `READY`、repair gate/trust summary 为 REVIEW、修复入口隐藏、missing drift 的 `roleDistributionPresent=false`、mismatch drift 的 `roleDistributionPresent=true` 且 `mismatchFlags` 只能包含白名单 boolean 字段并至少一个为 true；`qaTotalRequestCount` 必须覆盖 claim role drift requestCount。
- fallback runtime notice 被计入 required code claim 的数量：0。
- 普通 LLM 未引用代码事实因 fallback notice 豁免被误放行的数量：0。
- Vite/webpack source URL query/hash 导致文件名截断、行号误判或 report evidence anchor mismatch 的回归数：0。

## P9 前端产品体验重构

目标：把 SourceLens 从“功能可用”推进到“产品可用”，重点解决 UI 可读性、状态表达、主链路入口、错误反馈和大厂级一致性。

Must：

- 所有主按钮使用共享 `ActionButton` 或 `IconActionButton`。
- primary 按钮文字和图标在所有页面保持高对比白色，不被卡片、主题或运行时 CSS 覆盖。
- 空态、加载态、错误态使用共享 `StateBlock`。
- 顶部栏、侧边栏、行动卡、表格操作在桌面和移动宽度下不裁切、不横向溢出。
- App Shell 全局 UI smoke 必须覆盖受保护顶层页面矩阵，在桌面和 320px 窄屏下证明 topbar 标题、页面主标题、主按钮白字、移动抽屉导航、无横向溢出、无错误 toast、未 mock API 为 0。topbar 的 title/desc 必须完整落在自适应 header 容器内，页面内容必须从 topbar 之后开始，页面主标题必须与 topbar 保持可见间距，防止浏览器顶部或 header 裁切文字。
- ModelConfig 是 Agent、代码问答、自动修复和诊断链路的 provider 控制面；`GET /llm-configs` 初始失败必须显示 `模型配置加载失败` + `重新加载配置`，已有缓存刷新失败必须保留旧表格并显示 `模型配置刷新失败，已保留上次成功数据`，不得退化为普通空表或仅 toast。
- ModelConfig 的创建/保存失败必须在 Modal 内显示内联错误，激活/删除失败必须在页面内保留持久错误状态；所有错误文案必须来自 `formatApiError`，并保留 toast 作为辅助提示。
- `model-config-recoverable-ui-smoke` 必须用全 API mock 覆盖初始加载失败、retry 恢复、缓存刷新失败保留表格、激活失败、创建失败和删除失败，并在 `1440x900` 与 `320x740` 下断言 `mockedApiOnly=true`、`unhandledApiRequests=0` 和无横向溢出。
- 仪表盘必须能表达主链路下一步：仓库接入、报告复盘、代码问答、自动修复、审计治理；还必须展示当前推荐动作、证据成熟度和阻塞项，避免用户在 code_chunks 或扫描未就绪时误入 QA/修复。
- 仪表盘推荐动作必须有全 API mock browser smoke，覆盖数据异常、无仓库、运行中扫描、无成功扫描、code_chunks 未就绪、有风险和 QA 就绪，并在 1440px 与 320px 下断言按钮 URL、未 mock API 为 0、无横向溢出。
- AgentChat 会话列表必须使用原生导航控件和 list/listitem 语义，不允许用 `div role="button"` 模拟会话选择。
- AgentChat 消息区必须提供 live log 语义、稳定输入框 label、消息 article 语义和工具证据摘要，避免工具调用只像调试日志。
- Agent 工具调用展开区必须有 `aria-controls`、`aria-describedby`、`role=region`、可见状态文本和键盘 focus ring。
- Agent 工具调用展开区的参数和结果必须默认脱敏后展示，JSON 字段和普通文本都必须覆盖 `authorization/bearer/token/apiKey/apikey/api_key/secret/password/privateKey/private_key/accessToken/access_token/refreshToken/refresh_token`；折叠摘要、展开 `pre`、页面 body 和 AgentToolCall 可访问文本均不得出现原始 secret。
- 前端普通 UI、预览、日志、diff、raw JSON、code chunk preview、Agent tool args/result 和 Markdown copy/export 的显示层脱敏必须复用共享 `web-console/src/utils/displayRedaction.ts`，不得在新页面复制局部 token/key/password regex。
- 共享 display redaction utility 必须覆盖结构化对象递归脱敏、循环引用保护、JSON parse fallback、Authorization/Bearer、key assignment、`sk-*`、JWT-like token 和截断前脱敏；新增 raw-ish display 消费方必须补 `validate-frontend-ui.mjs` 合同或对应 smoke marker。
- 共享 display redaction 只代表前端普通显示层安全边界；如果未来需要 raw 查看、raw 下载、服务端导出、历史 payload 清理或 provider 原始输出治理，必须另设后端权限、审计和数据保留需求，不得用前端 redaction 代替。
- `ScanTaskDetail` 的 `ArtifactFallback` 降级路径不得直接渲染 raw `JSON.stringify(data, null, 2)`；artifact `summaryJson` 必须通过 shared `stringifyRedactedPayload(data, 2)` 显示，区域必须标记 `.sl-artifact-fallback-redacted-raw-json` 与 `aria-label="脱敏分析产物 JSON"`；`report-evidence-drawer-ui-smoke` 必须包含独立 `SCAN_TASK_DETAIL_ARTIFACT_FALLBACK_SMOKE_OK`，证明 fallback visible、safe marker visible、raw secrets hidden、body raw hidden、redaction visible、marker no raw，且 scope 只能声明 `SCAN_TASK_DETAIL_ARTIFACT_FALLBACK_SUMMARY_JSON_DISPLAY_REDACTION_ONLY`。
- `ScanTaskDetail` 的报告证据 metadata 和风险派生 handoff 必须显示层脱敏：报告证据 title/category/source/summary/question/fields/file/line/artifactTypes、`质量风险` 列表、技术债、改进建议、风险定位 QA 问题、AutoRepair target 描述、证据引用复制和 Project QA URL 参数都不得原样输出报告派生 raw secret；`ProjectDetail` 的报告证据来源桥展示、复制和重新检索也必须使用 redacted evidenceRef；`report-evidence-drawer-ui-smoke` 必须证明 question/body/URL/clipboard/manual copy no raw，并输出 `SCAN_TASK_DETAIL_REPORT_EVIDENCE_DRAWER_QUESTION_REFERENCE_DEEPLINK_DISPLAY_REDACTION_ONLY` scope。
- `AutoRepairs` 的 report-derived target、Candidate Provenance Receipt、Draft Receipt、Source Bridge QA question、PR confirm summary 和 `data-sl-target-url` 必须显示层脱敏；Candidate Receipt 的 provenance 白名单字段不得被视为天然安全，必须通过 shared display redaction 后才能渲染或写入 URL；`report-autorepair-candidate-ui-smoke` 必须输出 `AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY` scope，证明 UI/body/URL/marker 均不包含 raw secret。
- Project QA 的 code_chunks 搜索结果预览和“复制引用”必须显示层脱敏：搜索卡片不得直接渲染 `item.contentPreview || item.content`，复制引用不得复制 raw chunk preview；`project-qa-recoverable-ui-smoke` 必须注入 raw code chunk secret fixture，并证明预览、卡片、页面 body、复制引用和 marker 均不泄漏原文。
- AgentChat 工具证据摘要必须能深链到 AuditLogs 的 Agent 工具调用审计视图，且以 `projectId + conversationId` 作为第一阶段过滤合同，不能只在前端做当前页过滤。
- AuditLogs 接收到 `conversationId` 深链时必须自动打开 Agent 工具调用 tab、初始化“对话 ID”筛选框，并在后端查询参数中携带 `conversationId`。
- AgentChat 右侧上下文栏必须提供“Agent 闭环下一步”：有 active conversation 时展示当前 `Conv #id`、可选 `AgentTask #id` 和可选 `Scan #id`，并提供 `查看工具审计`、`打开 Agent 任务`、`打开扫描报告`。缺失 AgentTask 或 scanTask 时必须清晰降级，不得展示伪链接。
- AgentChat 从 ProjectDetail `code-understanding` handoff 进入时，必须提供显式 `新建绑定任务 / 创建绑定任务` 动作，允许用户把结构化代码理解证据创建为真实 `PENDING` AgentTask 并绑定 Conversation；该动作不得在页面加载时自动触发。
- code-understanding AgentTask 绑定 receipt 只能包含结构化证据元数据：`source/inputKind/inputLabel/sourceLabel/filePath/lineRef/contextRole/evidenceType/relevanceScore` 及 `rawPromptStored=false/rawStackStored=false/autoSent=false/autoStarted=false`。不得落库 raw prompt、raw stack、源码正文、模型回答、token 或 provider 原始输出。
- 后端创建 AgentTask 时如传入 `conversationId`，必须验证 conversation 属于当前项目、当前用户、`ACTIVE` 且未绑定 AgentTask；写入 `conversations.agent_task_id` 必须 fail closed，不能覆盖已有绑定。
- code-understanding AgentTask 绑定只创建 `PENDING` 任务和保留草稿，不得自动调用 `/start`、不得自动发送 AgentChat 消息、不得触发 LLM、工具调用、AutoRepair、PR 或写操作。
- `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.codeUnderstandingHandoff.agentTaskBinding` 必须证明 `taskStatus=PENDING`、`taskType=CUSTOM`、`sameProjectBound=true`、`sameScanBound=true`、`conversationBound=true`、`boundByBackend=true`、`structuredInputOnly=true`、`rawPromptStored=false`、`rawStackStored=false`、`autoStarted=false`，并继续证明 `autoSent=false`、`providerQualityClaim=false`、`llmFactClaim=false`。
- AgentTasks 必须支持 `?projectId=...&taskId=...` 深链，能自动选中目标任务并打开详情区；当前列表未包含目标任务时必须使用 task detail API 兜底，不能只停留在列表页。
- AgentTasks 详情页不得直接渲染 `inputJson/outputJson` 原文；普通详情只允许展示摘要、步骤、产物入口和“原始输入/输出默认隐藏”的安全提示。若未来增加授权查看原始 payload，必须有权限、审计和脱敏策略。
- CI Diagnostics 必须支持 `?projectId=...&diagnosticId=...` 来源深链，能自动选中目标诊断并打开详情区；当前列表未包含目标诊断时必须使用 `ciApi.detail(id)` 兜底，不能只停留在列表页。目标诊断不属于当前项目时必须 fail closed 并显示可读提示，不得误开其他项目记录。
- CI Diagnostics 的“生成修复候选”必须保留 AutoRepair 创建上下文：URL 至少包含 `projectId`、`repositoryId`、`filePath`、`source=ci-diagnostic-{id}` 和 `openCreate=1`，防止从 CI 诊断进入 AutoRepair 时丢失项目边界。
- AgentChat 真实后端工具调用链路必须有 focused smoke 证明：通过 AgentChat SSE 触发 READ_ONLY 工具，`agent_tool_calls.conversation_id`、`project_id` 和 `created_by` 持久化正确，后端 API 能按 `conversationId` 查回同一行，错误 `conversationId` 返回 0。
- 扫描详情报告总览必须有“报告复核门禁”，在用户进入问答、修复候选或审计追踪前，同时展示报告可信度、证据包、code_chunks、修复入口和审计追踪状态。
- 扫描详情报告总览必须有“报告推荐下一步”：在 `ReportDecisionPanel` 后展示 1 个主 CTA 和 1 个辅助 CTA，根据扫描状态、文件级高风险、项目级风险、核心产物缺口、code_chunks 缺口和可复核报告状态推导唯一推荐行动；不得新增后端 API、DB schema 或通用推荐引擎。
- 扫描详情报告必须提供第一版“报告证据抽屉”：风险项、API 行、数据库实体行和 Trace Map 证据面都必须能打开结构化证据详情，并提供“基于此证据追问”“复制证据引用”“生成修复候选/定位修复文件”三个动作。
- 报告证据抽屉必须按当前证据动态检索 code_chunks，使用当前 `projectId + scanTaskId + evidence query + limit=3`，显示 Top 3 命中摘要、检索模式、可信度、文件行号、主证据/相邻上下文、证据类型、分数、语义/关键词证据和预览。
- 报告证据抽屉必须提供“引用质量预检”：基于当前 code_chunks 检索结果、主证据、文件/行号锚点、confidence 和 score 推导 `READY/REVIEW/GAP`，在用户点击“基于此证据追问”前说明该证据适合进入 QA 引用复核、需要人工复核还是存在证据缺口；不得新增 API 或把预检文案伪装为已验证回答。
- 报告证据抽屉必须提供“报告证据交接包”：在引用质量预检和下一步动作之间集中展示将带入 QA/修复复核的 `Scan #`、证据标题、目标文件、行号、hits、可信度、PRIMARY 主证据状态和 READY/GAP/REVIEW 动作含义。该交接包只能消费当前 `evidence/readiness/chunkResult` 做 UI 展示，不得改变 QA payload、AutoRepair 请求协议、后端或 DB。
- 报告证据进入 Project QA 后，QA 页必须提供“报告证据来源桥”：在 `报告证据上下文` 内集中展示 `Scan #`、证据标题、摘要、分类、来源、文件路径和行号，并提供 `回到扫描报告`、`重新检索证据`、`复制证据引用` 三个动作。来源桥只能复用 URL evidence params 和现有 `codeChunkApi.search` / QA API，不得新增后端 API、DB schema 或改变 QA/AutoRepair 合同；复制内容只允许包含 scanTaskId 与证据元数据，不得把原始回答、prompt、源码大段或报告全文写入 marker/剪贴板合同。
- Project workspace tab 切换必须防止报告证据上下文漂移：离开 QA tab 时必须清理 `evidenceCategory/evidenceSource/evidenceTitle/evidenceSummary/evidenceFile/evidenceLine`，但必须保留 `scanTaskId`，避免 Graph、Artifacts、Audit 或报告来源上下文被错误清空。
- Project QA 的 code_chunks 搜索结果必须提供“证据组合路径”：基于当前可见 `CodeChunkSearchItem[]` 前端派生主证据阅读起点、相邻上下文、文件覆盖、向量证据、角色路径和下一步追问。该摘要只能解释当前返回结果集，不得新增后端 API、DB schema、检索排序、QA response schema 或 AutoRepair gate，也不得把 `hasEmbedding`、跨文件覆盖或 `sourceLabel` 包装成 LLM 事实验证。
- 公开仓库 live UI smoke 必须能吸收 Project QA 证据组合摘要：当 `PUBLIC_REPO_UI_SMOKE_OK.projectQaEvidenceCombinationSummary` 出现时，release verifier 必须强制校验 `surface=PROJECT_QA_CODE_CHUNKS_SEARCH`、当前 `scanTaskId/requestScanTaskId/responseScanTaskId` 绑定、`currentScanOnly=true`、结果卡可见、主证据数大于 0、文件覆盖大于 0、下一步追问不少于 3、source labels / file paths / role path / embedding state / top reference 可见、`derivedFromVisibleResults=true`、`resultSetOnly=true`、`providerQualityClaim=false`、`llmFactClaim=false` 和无横向溢出；但历史/current full authority 缺少该 optional marker 不得失败。
- 报告风险证据进入 AutoRepair 创建候选时，前端必须把 `repositoryId`、`scanTaskId`、`filePath` 和 `targetDesc` 从报告证据链稳定带入创建弹窗和 `POST /api/projects/{projectId}/auto-repairs` 请求体，不能只做到 URL 或表单可见。
- 报告证据进入 QA 后，QA 响应必须返回 answer-level citations：`sourceLabel`/`citationId`、`scanTaskId`、`chunkId`、`filePath`、`startLine/endLine`、`evidenceType`、`evidenceReason`、`relevanceScore`、`contextRole` 和 `citedByAnswer`；同时返回 `groundingStatus=VERIFIED|PARTIAL|UNVERIFIED|NO_EVIDENCE`，避免只依赖 LLM 自然语言回答。
- Project QA 必须把 `citationCoverage` 从标签升级为可审计面板：assistant 回答中展示“引用覆盖审计”，集中呈现“必需覆盖 / 必需文件 / 角色 / 范围 / 可修复 / 未引用候选 / 报告证据回显 / 来源锚点”等中文指标，并用“就绪 / 需复核 / 已阻断”作为用户可见主状态说明该回答能否进入修复候选复核；底层 `READY/REVIEW/BLOCKED` 枚举必须继续保留在技术门禁和 marker 中。
- Project QA 必须把“回答是否带引用”升级为“主张引用质量”审计：后端返回 `claimCitationCoverage`，按回答中的确定性主张拆分 `totalClaimCount/requiredClaimCount/citedRequiredClaimCount/uncitedRequiredClaimCount/invalidCitationClaimCount/claimCoveragePercent/status/claims`；同时必须输出 claim citation 文件分布：`validCitationFileCount/requiredClaimCitationFileCount/validCitationFiles/requiredClaimCitationFiles`，每个 claim 明细必须带 `validSourceFiles`。前端必须展示“主张引用质量”面板，用户可见主状态使用“就绪 / 需复核 / 已阻断”，问题主张显示“无效引用 / 未引用”等中文标签；底层 `READY/REVIEW/BLOCKED/INVALID/UNCITED` 只作为技术枚举保留。该字段只证明 claim-to-citation 绑定和引用文件分布，不声明引用语义一定充分或 LLM 事实一定正确。
- Project QA 的可信度区域必须默认中文可读：面板标题、状态徽标、指标 label、检查项前缀和下一步动作必须使用“可信度结论 / 跨文件引用结论 / 引用覆盖审计 / 主张引用质量 / 回答来源凭证 / 下一步动作”和“可采信 / 已绑定 / 就绪 / 需复核 / 已阻断 / 通过”等中文主文案。后端枚举、URL 参数、API 字段、marker schema 和修复门禁不得被中文化；如需展示技术值，应使用“中文说明（原始枚举）”形式。
- Project QA 必须在底层引用审计之上提供用户可读的“QA 可信度摘要”：聚合 `groundingStatus`、`citationEnforcementStatus`、`citationCoverage.requiredEvidenceCoveragePercent`、`claimCitationCoverage.status`、`claimCitationCoverage.roleDistribution.status`、`sourceEvidenceMatchType` 和 `qaRepairEvidenceGate.status`，先给出 `可采信并进入修复复核`、`需要人工复核` 或 `不可直接采信` 的结论，再展示底层“引用覆盖审计”和“主张引用质量”。该摘要不得声明 LLM 事实一定正确，不得替代 release marker 或 AutoRepair/PR hard gate。
- Project QA 的 `可采信并进入修复复核` 结论必须要求 report evidence line-level anchor：public repo live UI smoke 从报告证据抽屉的 code chunk `startLine` 传递 `evidenceLine`，请求/响应都必须绑定 `sourceEvidenceRef.lineNumber`，后端必须返回 `sourceEvidenceMatchType=REPORT_LINE_ANCHOR`。只有 `REPORT_FILE_ANCHOR` 时必须显示人工复核，不得显示 READY。
- Project QA 的修复放行必须与 `QA 可信度摘要` 同源：`primaryAutoRepairUrl` 和每条 answer citation 的 `生成修复候选` 必须同时要求 `qaRepairEvidenceGate.status=READY` 与 `trustSummary.tone=ready`。`REPORT_FILE_ANCHOR`、缺失 `claimCitationCoverage`、缺失 `claimCitationCoverage.roleDistribution`、`claimCitationCoverage.status!=READY`、required claim 未全部 cited、`roleDistribution.status!=PRIMARY_BOUND`、`requiredPrimaryBoundClaimCount < requiredClaimCount` 或 `requiredPrimaryFileCount<=0` 时，不得显示可采信结论或可点击修复候选。
- 报告证据绑定的 Project QA 回答必须展示用户可读的“来源文件匹配说明”：基于 `sourceEvidenceRef.filePath/lineNumber`、首个已引用 PRIMARY/cited chunk、`sourceEvidenceMatchType`、`citationCoverage`、`claimCitationCoverage.roleDistribution` 和 `qaRepairEvidenceGate` 前端派生“报告目标 / 已引用切片 / 匹配结论 / 风险提示 / 修复候选放行条件”。中文结论必须至少覆盖 `行级锚点`、`路径后缀一致`、`仅文件名一致，需复核`、`未形成来源闭环`，并用 `已满足 / 未满足` 说明 `报告证据已回显`、`来源文件匹配`、`行级锚点`、`必需证据覆盖`、`主张 PRIMARY 绑定`、`修复门禁`。该面板只能解释当前证据绑定成熟度，不得新增后端 API/DB/schema，不得改变 AutoRepair hard gate，不得声明 LLM 事实语义正确，不得向 marker 写入 raw prompt、raw answer、源码大段、URL query/hash 或 token。
- Project QA 的 `claimCitationCoverage.roleDistribution` 必须输出 required claim 的证据角色分布：`status/requiredClaimCount/requiredPrimaryBoundClaimCount/requiredContextOnlyClaimCount/requiredUnknownOnlyClaimCount/unbackedRequiredClaimCount/invalidRequiredClaimCount/validCitationFileCount/requiredClaimCitationFileCount/requiredPrimaryFileCount/roles/files`。`PRIMARY_BOUND` 表示每个 required claim 至少绑定一个 `PRIMARY` 证据；`MIXED_CONTEXT/CONTEXT_ONLY/UNKNOWN_ROLE_PRESENT` 只作为审计信号，不代表事实语义裁判。前端“主张引用质量”必须展示“主张证据角色分布”；`PUBLIC_REPO_SMOKE_OK.codeQa.claimCitationCoverage.roleDistribution`、`PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.claimCitationCoverage.roleDistribution` 和 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.claimCitationCoverage.roleDistribution` 必须被 release verifier 强校验。raw public repo Code QA marker 不能只验证 answer-level `citationCoverage.evidenceRoleDistribution`，还必须证明 claim-level `roleDistribution.status=PRIMARY_BOUND`、required claim primary bound count 覆盖 required claim count，且 role/file 计数与父级 claim citation coverage 一致。未验证路径必须输出 `REVIEW_UNCITED`，且不得伪造 `requiredPrimaryBoundClaimCount`、`requiredPrimaryFileCount`、role/file entries 或 cited claim file count。
- Project QA 的 `citationCoverage` 必须输出证据文件分布：`uniqueEvidenceFileCount/citedEvidenceFileCount/primaryEvidenceFileCount/citedPrimaryEvidenceFileCount/contextEvidenceFileCount/citedContextEvidenceFileCount/requiredEvidenceFileCount/citedRequiredEvidenceFileCount`。前端“引用覆盖审计”必须展示必需文件与主证据文件覆盖；release marker 必须证明 verified QA 的 required evidence files 和 primary evidence files 已被引用，report unverified QA 不得伪造 cited evidence file count。该指标只证明引用文件角色分布，不作为所有问题必须跨文件的硬门槛。
- Project QA 的 `citationCoverage.evidenceRoleDistribution` 必须输出结构化证据角色分布：`status/totalFileCount/citedFileCount/primaryFileCount/citedPrimaryFileCount/contextFileCount/citedContextFileCount/roles/files`。`roles` 只允许 `PRIMARY|ADJACENT_CONTEXT|UNKNOWN`，`files.filePath` 必须是安全相对路径，且父级 file count 与 distribution count 必须一致。前端“引用覆盖审计”必须展示“证据角色分布”；`PUBLIC_REPO_SMOKE_OK.codeQa.citationCoverage.evidenceRoleDistribution`、`PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.citationCoverage.evidenceRoleDistribution`、`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.citationCoverage.evidenceRoleDistribution` 和 report unverified distribution 必须被 release verifier 强校验。未验证路径不得伪造 `citedFileCount/citedPrimaryFileCount/citedContextFileCount`。
- Project QA 的修复证据门禁必须把 `claimCitationCoverage.status=BLOCKED` 作为硬阻断；`READY` 必须要求 claim citation status 为 `READY`、claim role distribution 为 `PRIMARY_BOUND`、required claim 全部 cited 且 PRIMARY-bound、required primary file count 大于 0。旧响应缺字段只能作为人工复核或阻断路径处理，不得放行为 READY，也不得在新 smoke/release marker 中继续缺失。
- 当 QA 已有可用代码证据时，后端必须执行引用强制策略：LLM 首答缺少有效 `[C*]` 时至少重试一次；未配置 LLM 或 LLM 调用失败时，fallback 回答必须引用首条可用证据；响应必须返回 `citationEnforcementStatus` 和 `citationEnforcementNote`，区分 `DIRECT_VERIFIED`、`RETRY_VERIFIED`、`FALLBACK_CITED` 和 `RETRY_FAILED`。
- Project QA 对低置信和无证据状态必须可见化：当 `groundingStatus=PARTIAL|UNVERIFIED|NO_EVIDENCE` 或 `citationEnforcementStatus=RETRY_FAILED` 时，前端必须明确展示低置信度、候选证据需复核或无证据，且不得出现 `引用已验证`、`首次引用已验证`、`回答已引用` 等误导性文案；同时必须提供 retry、换问题、重新检索证据等真实下一步提示，不得把只重新检索的动作伪装成重新扫描。
- `Project QA low confidence` focused smoke 必须用全 API mock 覆盖 `PARTIAL`、`UNVERIFIED` 和 `NO_EVIDENCE` 三类响应，三 viewport 必须包含 `1440x900`、`390x844` 与 `320x740`，成功 marker 必须包含 `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK`、`markerVersion=2`、`mockedApiOnly=true`、`unhandledApiRequests=0`、`groundingStatuses`、`citationEnforcementStatuses`、`lowConfidenceVisible=true`、`noEvidenceVisible=true`、`noVerifiedMislabel=true`、`layoutDensity`、`mobileReadability`、`viewportProofs`、`statusProofs` 和 `runtimeIssues=0`。
- 同一 smoke 还必须证明低置信面板 `retry` 不是静态按钮：首次 `PARTIAL/RETRY_FAILED` 后点击 `retry` 必须重新提交同一问题，第二次响应恢复为 `groundingStatus=VERIFIED` 与成功 `citationEnforcementStatus`，请求/响应必须绑定当前 `scanTaskId`，UI 必须显示 `回答引用证据`、目标文件、`引用已验证` 和至少一条 `citedByAnswer=true` citation；marker 必须输出 `retryRecovery.verifiedAfterRetry=true`、`scanTaskIdBound=true`、`citationVisible=true` 和 `citedByAnswer=true`。
- Project QA 的已验证 answer citation 必须能进入 AutoRepair 创建草稿：仅当 `groundingStatus=VERIFIED`、`citation.citedByAnswer=true`、`claimCitationCoverage.status=READY`、`qaRepairEvidenceGate.status=READY`、citation 有 `filePath` 且可从 `scanTaskId` 解析到 `repositoryId` 时，前端才展示 `生成修复候选`；跳转必须携带 `projectId`、`openCreate=1`、`repositoryId`、`scanTaskId`、`filePath`、结构化 `targetDesc` 和 `source=Project QA verified citation`，复用 AutoRepair 现有创建弹窗，不新增后端字段。
- AutoRepair 创建成功后必须立即选中新创建的 repair，并展示 Source Bridge；Project QA 来源的候选必须在 Source Bridge 文案中显示 `Project QA 已验证引用`，并提供绑定当前 `scanTaskId`、repair id 和目标文件的 QA 复核、扫描报告、Agent 复核和扫描审计深链，不能让用户提交后回到空列表或失去来源上下文。
- Project QA 已验证引用到 AutoRepair 候选的 focused smoke 必须用全 API mock 证明：`VERIFIED + citedByAnswer=true + claimCitationCoverage.status=READY + qaRepairEvidenceGate.status=READY` 显示动作并打开 AutoRepair 草稿，`VERIFIED + citedByAnswer=false`、`PARTIAL/RETRY_FAILED` 和 `VERIFIED + citedByAnswer=true + claimCitationCoverage.status=REVIEW/BLOCKED` 不显示动作；提交创建后 `POST /api/projects/{projectId}/auto-repairs` 请求体绑定 `repositoryId/scanTaskId/filePath/targetDesc`，新 repair 自动选中，详情页显示来源扫描闭环，QA 深链和审计深链绑定 repair/scan；marker 必须包含 `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK`、`mockedApiOnly=true`、`unhandledApiRequests=0`、`createPayloadBound=true`、`createdRepairSelected=true`、`sourceBridge.visible=true`、`sourceBridge.qaCitationOriginVisible=true`、`sourceBridge.scanTaskIdBound=true`、`sourceBridge.qaDeepLinkBound=true`、`sourceBridge.auditDeepLinkBound=true`、`actionVisibility.verifiedCitedVisible=true`、`verifiedUncitedHidden=true`、`lowConfidenceHidden=true`、`claimReviewHidden=true` 和双 viewport。
- Project QA 的 code_chunks 检索失败必须可恢复：首次检索失败时显示 `证据检索失败` + `重新检索证据`；已有结果后刷新失败必须保留上次成功结果并显示 `证据检索刷新失败，已保留上次成功结果`，不得清空证据上下文。
- Project QA 的 `/qa` 请求失败必须显示独立 `代码问答请求失败` 状态，保留失败问题，并提供 `重试此问题` 与 `恢复到输入框`；失败状态不得混同为低置信回答或普通 assistant 文本。
- Project QA 发送按钮必须在空问题和 loading 中禁用，避免无效请求进入对话流。
- `project-qa-recoverable-ui-smoke` 必须用全 API mock 覆盖 code_chunks 初始检索失败、retry 恢复、已有结果刷新失败保留上下文、QA 请求失败、QA retry 后 answer citation 恢复，并在 `1440x900` 与 `320x740` 下断言 `PROJECT_QA_RECOVERABLE_SMOKE_OK`、`mockedApiOnly=true`、`unhandledApiRequests=0`、请求计数、assertions 和无横向溢出。
- 报告证据进入 QA 时，请求体必须携带结构化 `evidenceRef`，至少包含证据 `category/source/title/filePath`；后端必须把 `evidenceRef.filePath` 作为确定性候选 anchor 合并进当前 `scanTaskId` 的 QA 检索池，不能只把文件名作为自然语言提示交给 LLM。
- 扫描详情报告总览必须提供“修复治理时间线”，按当前 `projectId + scanTaskId` 聚合报告风险、AutoRepair、AgentTask、ExecutionTask、Artifact、AuditLog 和 AgentToolCall，展示 6 类闭环状态卡和最多 8 条关键事件；API 请求必须携带当前 scan 约束，并在前端防御性过滤异 scan 响应。
- 扫描详情“修复治理时间线”必须提供阶段化治理轨道：`风险定位 -> 修复候选 -> Patch 证据 -> PR 复核 -> 审计归档`。每个阶段必须展示 `ready / running / blocked / empty` 状态、原因和主动作，主动作复用 `ActionButton` 并跳转现有证据抽屉、AutoRepair、Artifact 或 AuditLogs，不得新增后端 API 或破坏 scan-bound 聚合。
- 前端 UI 门禁必须覆盖关键可读性和原语使用规则。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm run build` 通过。
- `make app-shell-ui-smoke` 必须用全 API mock 浏览器流覆盖 `/dashboard`、`/projects`、`/execution-tasks`、`/artifacts`、`/agent-tasks`、`/agent-chat`、`/auto-repairs`、`/issue-decomposition`、`/ci-diagnostics`、`/pr-reviews`、`/audit-logs` 和 `/model-config`，viewport 至少包含 `1440x900` 与 `320x740`，成功日志必须包含唯一 `APP_SHELL_UI_SMOKE_OK`，证明 `mockedApiOnly=true`、`unhandledApiRequests=0`、topbar/page heading 不裁切、primary button computed color/text-fill 为白色、移动抽屉可达，并输出 `layoutGuards`：`topbar-title-contained`、`topbar-desc-contained-when-visible`、`page-content-starts-after-topbar`、`page-heading-below-topbar`。
- AgentTasks 表格必须提供显式、可访问的行详情入口：详情按钮必须有任务 ID 级 aria label；行必须可 focus，支持 Enter/Space 打开详情，暴露 `aria-selected`，并且内层按钮/链接不得冒泡误触发行选择。
- `make agent-tasks-detail-selection-ui-smoke` 必须用全 API mock 浏览器流覆盖 `/agent-tasks?projectId=...` 的详情按钮、详情面板匹配、Enter/Space 键盘打开、`aria-selected`、嵌套操作不误选中、`mockedApiOnly=true`、`unhandledApiRequests=0`，viewport 至少包含 `1440x900` 与 `320x740`，成功日志必须包含唯一 `AGENT_TASKS_DETAIL_SELECTION_SMOKE_OK`。
- ExecutionTasks 表格必须提供显式、可访问的行详情入口：操作列必须有任务 ID 级 `详情` 按钮；行必须可 focus，支持 Enter/Space 打开详情，暴露 `aria-selected`，并且标题、来源、产物、取消等内层动作不得冒泡误触发行选择。
- `make execution-tasks-detail-selection-ui-smoke` 必须用全 API mock 浏览器流覆盖 `/execution-tasks?projectId=...` 的详情按钮、详情面板匹配、Enter/Space 键盘打开、`aria-selected`、嵌套取消动作不误选中、`mockedApiOnly=true`、`unhandledApiRequests=0`，viewport 至少包含 `1440x900` 与 `320x740`，成功日志必须包含唯一 `EXECUTION_TASKS_DETAIL_SELECTION_SMOKE_OK`。
- Artifacts 表格必须提供显式、可访问的详情与预览选择入口：行必须可 focus，支持 Enter/Space 打开 Drawer 详情，暴露 `aria-selected`；详情、来源、预览、下载等内层按钮必须隔离冒泡，其中预览必须绑定当前 artifact，来源/下载不得误触发行选择。
- `make artifacts-detail-selection-ui-smoke` 必须用全 API mock 浏览器流覆盖 `/artifacts?projectId=...` 的详情按钮、Drawer 匹配、Enter/Space 键盘打开、`aria-selected`、预览内容绑定、下载不误选中、不可预览 artifact 禁用、`mockedApiOnly=true`、`unhandledApiRequests=0`，viewport 至少包含 `1440x900` 与 `320x740`，成功日志必须包含唯一 `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK`。
- AuditLogs 三源表格必须提供一致的详情选择可访问性：通用审计、Agent 工具调用、GitHub Webhook Delivery 三张表都必须可 focus，支持 Enter/Space 打开对应 Drawer，暴露 `aria-selected`；动作、工具名、Delivery ID 和关联资源/对话/扫描跳转等内层按钮必须隔离冒泡。
- AuditLogs 通用审计 deep link 必须精确落位：当 URL 携带 `resourceType/resourceId/action/status` 时，自动打开 Drawer 必须匹配所有已提供字段；不得只按 `resourceId` 打开同一资源下的其他审计事件。未找到 exact event 时必须页面内显示 `未找到目标审计事件`，并保持 Drawer 关闭。
- AuditLogs drawer 的原始 JSON 必须默认折叠，关键字段、请求 ID、Delivery ID、候选凭证、source error 和长路径必须允许换行，不能用单行省略号隐藏排障关键证据。
- AuditLogs 移动端 workbench 必须把横向滚动限制在表格内容层；`.sl-audit-filter-form`、tabs、分页和 card body 不得被 table `scroll.x` 撑宽。390px 下审计 summary 可保持两列以减少首屏深度，320px 可降为单列。
- `make audit-logs-detail-selection-ui-smoke` 必须用全 API mock 浏览器流覆盖 `/audit-logs?projectId=...` 的三类 tab、详情按钮、Drawer 匹配、Enter/Space 键盘打开、`aria-selected`、三源健康状态、治理信号可见、`mockedApiOnly=true`、`unhandledApiRequests=0`，viewport 至少包含 `1440x900`、`390x844` 与 `320x740`，成功日志必须包含唯一 `AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK`。
- 同一 AuditLogs smoke 还必须覆盖 exact audit deep-link pass/miss：同一 `resourceId`、不同 `action/status` 的 fixture 必须只打开精确匹配事件；不存在的 `action/status` 组合必须不打开错误 Drawer 并输出 `AUDIT_LOGS_DEEP_LINK_MISS_SMOKE_OK`；exact 成功路径必须输出 `AUDIT_LOGS_EXACT_DEEP_LINK_SMOKE_OK`。
- `node scripts/validate-frontend-ui.mjs` 必须锁住 AgentChat 会话池 `role=list`、会话行 `role=listitem`、选择区域原生 `Link`、`aria-current` 和 `focus-visible` 焦点样式。
- `node scripts/validate-frontend-ui.mjs` 必须锁住 AgentChat 消息流 `role=log`、`aria-live`、`aria-busy`、textarea `aria-label`、工具证据摘要、`AgentToolCall` 展开区 ARIA 和 focus-visible。
- `node scripts/validate-frontend-ui.mjs` 必须锁住 AgentChat “查看审计”深链、AuditLogs `conversationId` URL 解析、Agent 工具调用 tab 自动打开、工具调用查询参数和对话 ID 表单初始化。
- `mvn -q -Dtest=AgentToolCallControllerTest,AgentToolCallServiceTest test` 必须证明后端 `agent-tool-calls` API 接收并按 `conversationId` 过滤。
- `make agent-chat-audit-ui-smoke` 必须用全 API mock 浏览器流证明 AgentChat 证据入口跳转到 `/audit-logs?projectId=...&conversationId=...`，AuditLogs 自动按会话过滤，未 mock API 请求数为 0，且成功 marker 证明 mock-only 和 local-only host。
- `make agent-chat-closure-rail-ui-smoke` 必须用全 API mock 浏览器流证明 AgentChat 右侧闭环栏可见、审计深链携带 `projectId + conversationId`、AgentTask 深链携带 `projectId + taskId` 并在 AgentTasks 自动打开详情、扫描报告深链携带 `scanTaskId`、未绑定对话正确降级、未 mock API 请求数为 0、runtime issues 为 0，viewport 至少覆盖 `1440x900` 与 `320x740`，成功日志必须包含唯一 `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK`。
- 同一 AgentChat closure rail smoke 必须在 `toolCallsJson/toolResultsJson` fixture 中放入 raw secret sentinel，覆盖 JSON args、plain text args、JSON result 和 plain text result；展开 AgentToolCall 后必须断言 `.sl-agent-tool-call` 与页面 body 均不包含 sentinel 且包含 `[REDACTED]`；`AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.agentToolCallRedaction` 必须记录 `AGENT_TOOL_CALL_ARGS_RESULT_DISPLAY_REDACTION_ONLY` scope、raw hidden、body hidden、redaction visible 和 marker no raw sentinel。
- `make agent-chat-tool-audit-smoke` 必须只允许 loopback 后端，使用 dev/test `MOCK` LLM 和本地 `file://` fixture repo，输出唯一 `AGENT_CHAT_TOOL_AUDIT_SMOKE_OK` marker，证明 `agentChatPath=true`、`directToolExecutionOnly=false`、`toolName=read_file`、`permissionLevel=READ_ONLY`、`success=true`、SSE `tool_call/tool_result/done` 已出现、assistant `toolCallsJson` 和 TOOL `toolResultsJson` 已持久化、`wrongConversationIdCount=0`、`mismatchCount=0`、`externalLlm=false`、`externalNetwork=false`，且 marker 不包含 token、密码、Authorization、完整路径、原始 prompt、SSE 原文或工具结果全文。
- `node scripts/validate-frontend-ui.mjs` 必须锁住扫描详情报告复核门禁：`ReportReviewGate`、`aria-label="报告复核门禁"`、`report-readiness/evidence-bundle/code-knowledge/repair-readiness/audit-trace` 五项合同、`codeKnowledgeSignal` 传入，以及桌面/移动/窄屏网格降级。
- `node scripts/validate-frontend-ui.mjs` 必须锁住扫描详情“报告推荐下一步”：`ReportRecommendedNextStep`、`aria-label="报告推荐下一步"`、稳定 `data-recommended-step`、primary/secondary CTA，以及 `repair-high-risk-file`、`locate-project-risk`、`complete-evidence-bundle`、`inspect-code-chunks`、`qa-review-ready-report` 等推导分支。
- `node scripts/validate-frontend-ui.mjs` 必须锁住扫描详情报告证据抽屉：`ReportEvidenceDrawer`、`title="报告证据抽屉"`、风险/API/DB/Trace Map 入口、结构化证据引用、扫描绑定 QA 问题和 AutoRepair/定位修复文件动作。
- `node scripts/validate-frontend-ui.mjs` 必须锁住证据抽屉 code_chunks 摘要：动态 `codeChunkApi.search(projectId, { scanTaskId, query, limit: 3 })`、切换证据时清空旧结果、`aria-label="code_chunks 命中摘要"`、`CodeChunkEvidenceCard`、0-100 原始分数展示、语义/关键词证据标签，以及代码预览换行和滚动样式。
- 扫描详情报告证据抽屉 `code_chunks 命中摘要` 必须默认展示脱敏 code chunk preview：渲染区域必须为 `.sl-report-evidence-chunk-preview-redacted`，`aria-label="脱敏 code chunk 预览"`，并在显示层脱敏 Authorization/Bearer、token、apiKey/apikey/api_key、secret/password、privateKey/private_key、accessToken/access_token、refreshToken/refresh_token、`sk-*` 和 JWT-like token；普通 UI 不得直接渲染 raw `item.contentPreview || item.content`。
- `make report-evidence-drawer-ui-smoke` 必须用全 API mock 浏览器流证明：用户从 `ScanTaskDetail` 点击“查看证据”打开 `报告证据抽屉`，抽屉发起当前 `projectId + scanTaskId + evidence query + limit=3` 的 code_chunks 查询，展示命中摘要、文件行号、主证据/相邻上下文、证据类型、分数和预览；成功日志必须包含唯一 `REPORT_EVIDENCE_DRAWER_SMOKE_OK`，证明 `mockedApiOnly=true`、`unhandledApiRequests=0`，viewport 至少覆盖 `1440x900` 和 `320x740`。
- `make report-evidence-drawer-ui-smoke` 必须在 code chunk fixture 中注入 raw secret sentinel、Bearer token、OpenAI-style key 和 JWT-like token，断言报告证据抽屉 code chunk region 与页面 body 均不包含 raw secret，且出现 `[REDACTED]`；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.codeChunkPreviewRedaction` 必须记录 `REPORT_EVIDENCE_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY` scope、fixture raw secret present、raw secrets hidden、body hidden、redaction visible 和 marker no raw secret。
- `make report-evidence-drawer-ui-smoke` 必须覆盖报告证据交接包 READY/GAP 双态：READY 抽屉必须证明 `报告证据交接包` 可见并展示 `Scan #`、目标文件、行号、hits、可信度、`PRIMARY 主证据已命中` 和修复候选可见；GAP 抽屉必须证明 `0 hits`、`PRIMARY 主证据缺失`、`只能追问/复制，修复候选不放行`、`生成修复候选` 隐藏且 `定位修复文件` 可见但禁用。
- `make report-evidence-qa-citation-ui-smoke` 必须用全 API mock 浏览器流证明：用户从 `ScanTaskDetail` 报告证据抽屉点击“基于此证据追问”进入 Project QA，QA 页显示“报告证据上下文”和“报告证据来源桥”，来源桥必须展示 `Scan #`、证据标题、摘要、分类、来源、文件路径、行号，并提供 `回到扫描报告`、`重新检索证据`、`复制证据引用` 三个动作；`POST /api/projects/{projectId}/qa` 请求体携带同一证据的 `evidenceRef.category/source/title/summary/filePath/lineNumber` 和当前 `scanTaskId`，回答区展示 `groundingStatus`、`citationEnforcementStatus`、`Scan #...`、`回答引用证据`、`sourceLabel`、`filePath:startLine-endLine`、`citedByAnswer`、`contextRole`、`evidenceType`、`relevanceScore`、`evidenceReason`、“复制引用”和“主张引用质量”；成功日志必须包含唯一 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK`，证明 `mockedApiOnly=true`、`unhandledApiRequests=0`、`qaRequestCount=6`、verified citation 路径 `citationCount/citedChunkCount>0`、`groundingStatuses=["VERIFIED"]`、可用成功 `citationEnforcementStatuses`、`claimCitationCoverage.statuses=["READY"]`、`minClaimCoveragePercent>=100`、`minRequiredClaimCount>0`、`maxInvalidCitationClaimCount=0`、`minValidCitationFileCount>0`、`minRequiredClaimCitationFileCount>0`、`evidenceRef.requestBound/responseBound/contextVisible=true`，且 `qaFromEvidence.evidenceRef` 只记录 `filePath/lineNumber/category/source/title` 等元数据，不记录 `summary` 或其他大段原始文本；同时证明 `qaFromEvidence.unverifiedCitation` 的 `groundingStatuses=["PARTIAL"]`、`citationEnforcementStatuses=["RETRY_FAILED"]`、`claimCitationCoverage.statuses=["REVIEW"]`、`minClaimCoveragePercent=0`、`maxUncitedRequiredClaimCount>0`、`maxValidCitationFileCount=0`、`maxRequiredClaimCitationFileCount=0`、`uncitedCandidateCount>0` 和 `evidenceRefRequestBound=true`；`reportCitationQuality` 必须证明 `SCAN_TASK_DETAIL_REPORT_CITATION_QUALITY_PANEL` 面板在 `1440x900`、`390x844` 和 `320x740` 下可见，且 `citationQuality=["6/6"]`、`sourceDiversityVisible=true`、`narrativeBinding=["6/6"]`、`boundaryVisible=true`、`noOverclaim=true`、`noHorizontalOverflow=true`、`providerQualityClaim=false`、`llmFactClaim=false`。
- `report-evidence-qa-citation-ui-smoke` 必须有独立 Playwright config 和 npm 入口：`smoke:report-evidence-qa-citation` 必须指向 `playwright.report-evidence-qa-citation.config.ts`，不得退回 `playwright.report-evidence-drawer.config.ts`。在 release verifier 仍依赖 drawer 日志双 marker 期间，该 dedicated config 可运行共享 `report-evidence-drawer-smoke.spec.ts`，但必须由 `validate-frontend-ui.mjs` 锁住独立 config、端口和禁止 re-export drawer config。
- `make project-qa-recoverable-ui-smoke` 必须证明 code_chunks 搜索结果的“证据组合路径”可见，并在当前 fixture 中至少覆盖一条主证据、一条 `ADJACENT_CONTEXT` 相邻上下文、两个文件覆盖、两条含向量证据、三条下一步追问、刷新失败后保留旧组合摘要、`mockedApiOnly=true`、`unhandledApiRequests=0` 和无横向溢出；成功 marker `PROJECT_QA_RECOVERABLE_SMOKE_OK.evidenceCombinationSummary` 必须输出 `visible/preservedAfterRefreshFailure/primarySourceLabel/adjacentContextCount/uniqueFileCount/embeddedEvidenceCount/nextQuestionCount/noHorizontalOverflow`。
- `public-repo-ui-smoke` 必须在真实 QA 链路中断言 `aria-label="证据组合路径"`、`Evidence Combination Summary`、主证据阅读起点、相邻上下文、文件覆盖、向量证据、下一步追问和无横向溢出；成功 marker 可输出 optional `projectQaEvidenceCombinationSummary`，release verifier 和 security regression 必须拒绝字段出现后被伪造的状态、surface、scan 绑定、可见性、计数、label、source label、provider/LLM overclaim、overflow 和 raw content。
- `make report-autorepair-candidate-ui-smoke` 必须用全 API mock 浏览器流证明：用户从扫描报告质量风险点击“查看证据”，在报告证据抽屉点击“生成修复候选”，跳转 AutoRepair 创建弹窗，显示来源 `Scan #...`，并在点击“开始生成补丁”后捕获唯一前端创建请求；marker `REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK` 必须证明 `repositoryId`、`scanTaskId`、`filePath`、`targetDesc` 绑定请求体、`mockedApiOnly=true`、`unhandledApiRequests=0`，viewport 至少覆盖 `1440x900` 和 `320x740`。
- 同一 `report-autorepair-candidate-ui-smoke` 必须在 report-derived `targetDesc`、mocked `AUTO_REPAIR_CANDIDATE_CREATED.inputJson`、provenance 白名单字段和 `repairEvidenceGateReason` 中注入 Bearer、apiKey、password、quoted secret、JWT-like raw secret；创建弹窗、Candidate Provenance Receipt、页面 body、所有 `data-sl-target-url` 解码值和 marker 均不得包含 raw secret，且必须出现 safe marker 与 `[REDACTED]`；`REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK.candidateReceiptRedaction` 必须记录 `scope=AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY`、`surface=AUTOREPAIR_SOURCE_BRIDGE_CANDIDATE_PROVENANCE_RECEIPT`、fixture secret booleans、`uiRawSecretsHidden=true`、`urlRawSecretsHidden=true`、`bodyRawSecretsHidden=true`、`redactionVisible=true`、`safeMarkerVisible=true` 和 `markerContainsRawSecret=false`。
- AutoRepair 详情必须提供 `Scan Source Bridge / 来源扫描闭环`：扫描来源任务显示 `Scan #id`、当前 repair 状态、目标文件、下一步说明，并提供报告、QA 复核、Agent 复核和扫描审计四个深链动作；人工候选必须显示“未绑定扫描来源”，不得伪装扫描来源，也不得把缺失 `scanTaskId` 升级为 PATCH_READY PR hard gate。
- `make patch-ready-ui-smoke` 必须在 `PATCH_READY_UI_SMOKE_OK` marker 中证明 `scanSourceBridge.visible=true`、`scanTaskId`、`qaDeepLinkBound=true`、`agentTaskDraftBound=true`、`auditDeepLinkBound=true`、`targetFileExplained=true`、`missingScanFallbackVisible=true`；同时继续保留 `reviewGate`、`attemptSplit`、`submitPrCount=0`、`sharedSelectableRow` 和 Enter/Space 证据。
- `DiffViewer` 必须默认展示脱敏 Patch Diff：保留 diff 增删行颜色、空态和滚动能力，但渲染区域必须为 `.sl-diff-viewer.sl-diff-viewer-redacted`，`aria-label="脱敏 diff 内容"`，并在显示层脱敏 Authorization/Bearer、token、apiKey/apikey/api_key、secret/password、privateKey/private_key、accessToken/access_token、refreshToken/refresh_token、`sk-*` 和 JWT-like token。`patch-ready-ui-smoke` 必须在 `diffContent` fixture 中注入 raw diff secret sentinel，断言 AutoRepair 详情 diff 区不出现原文、出现 `[REDACTED]`，并在 `PATCH_READY_UI_SMOKE_OK.patchDiffSafety` 记录 `scope=DIFF_VIEWER_DISPLAY_REDACTION_ONLY`、raw hidden、redaction visible、sanitized diff visible 和 marker no raw sentinel。
- `public-repo-ui-smoke` 必须真实提交一次当前 `scanTaskId` 绑定的 QA 请求，证明请求体携带 `evidenceRef.filePath`，返回 `answerCitations`、`groundingStatus`、`citationEnforcementStatus`、`retrievedChunks`，且 citations 和 chunks 的 `scanTaskId` 均等于当前扫描；marker 必须输出 `qaFromEvidence.status=OK`、`resultCount>0`、`citationCount>0`、`citedChunkCount>0`、`groundingStatuses=["VERIFIED"]`、可用 `citationEnforcementStatuses`、`expectedEvidenceFileVisible=true` 和 `evidenceRef.requestBound/contextVisible=true`。
- `public-repo-ui-smoke` 的 QA 真实链路还必须断言 `引用覆盖审计` 和 `主张引用质量` 面板可见；marker 必须输出 `qaFromEvidence.claimCitationCoverage` 并证明 `statuses=["READY"]`、`minClaimCoveragePercent>=100`、`minRequiredClaimCount>0`、`minCitedRequiredClaimCount=minRequiredClaimCount`、`maxUncitedRequiredClaimCount=0`、`maxInvalidCitationClaimCount=0`、`minValidCitationFileCount>0` 和 `minRequiredClaimCitationFileCount>0`。`node scripts/validate-frontend-ui.mjs` 必须锁住 `CitationCoverageAuditPanel`、`ClaimCitationAuditPanel`、`aria-label="引用覆盖审计"`、`aria-label="主张引用质量"`、`READY/REVIEW/BLOCKED` 状态和 Coverage/Cited/Repairable/Claims/Files 指标。
- `node scripts/validate-frontend-ui.mjs` 必须锁住扫描详情“修复治理时间线”：`aria-label="修复治理时间线"`、6 类治理卡、插入位置位于 `ReportEvidenceProfilePanel` 和 `ReportTraceMap` 之间、`governance-timeline` review gate、AutoRepair/AgentTask/AgentToolCall/AuditLog/Artifact/ExecutionTask scan-bound 查询，以及异 scan 响应防御过滤。
- `make scan-governance-timeline-ui-smoke` 必须用全 API mock 浏览器流证明：当前 scan 的 AutoRepair、AgentTask、ExecutionTask、Artifact、AuditLog 和 AgentToolCall 可见，异 scan 数据不可见，所有相关 API 请求携带当前 `scanTaskId`、`resourceType/resourceId`、`ownerType/ownerId` 或 source id 约束；成功日志必须包含唯一 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK`，证明 `mockedApiOnly=true`、`unhandledApiRequests=0`、`foreignScanExcluded=true`，viewport 至少覆盖 `1440x900` 和 `320x740`。
- 至少一次浏览器 smoke 验证关键按钮 computed color 为白字、页面无横向溢出。
- 公开仓库主链路页面体验必须至少有一次 live-only browser smoke，覆盖 ProjectDetail、ScanTaskDetail、QA、Graph、Artifacts、AuditLogs 和 AutoRepair candidate，且不得使用 API mock 冒充真实后端；viewport matrix 必须至少包含 `1440x900`、`390x844` 和 `320x740`。
- 公开仓库 live UI smoke 必须覆盖 ScanTaskDetail 报告证据抽屉真实点击：从报告总览打开 `报告证据抽屉`，看到 `code_chunks 命中摘要`，并证明真实 `/api/projects/{projectId}/code-chunks/search` 请求绑定当前 `scanTaskId`、`limit=3`，响应和 items 不漂移到其他扫描。
- 公开仓库 live UI smoke 必须覆盖 ScanTaskDetail 报告推荐下一步：marker `PUBLIC_REPO_UI_SMOKE_OK.recommendedNextStep` 必须证明 `visible=true`、`primaryActionVisible=true`、`secondaryActionVisible=true`、`keys` 为允许的推荐分支，且 `titles` 非空；release verifier 和 security regression 必须拒绝缺失、不可见、非法 key 或空标题的伪造 OK marker。
- release/nightly 证据中，公开仓库 live UI smoke 必须作为 `public-repo-smoke` 的子门禁启用：manifest `public_repo_smoke_ui=true`，日志含唯一 `PUBLIC_REPO_UI_SMOKE_OK`，且与同一日志里的 `PUBLIC_REPO_SMOKE_OK` 绑定同一组 project/repository/scan IDs；marker 的 `viewports` 必须包含 `1440x900`、`390x844`、`320x740`。

量化指标：

- 裸 Ant Design primary Button 数量：0。
- 关键页面低对比主按钮：0。
- UI 门禁失败项：0。
- 扫描详情报告复核门禁核心状态缺失数：0。
- 扫描详情报告证据抽屉核心入口缺失数：0。
- 证据抽屉 code_chunks 查询 scanTaskId 漂移数：0。
- 报告证据抽屉 mock browser smoke 未 mock API 请求数：0。
- 报告证据到 QA citation mock browser smoke 未 mock API 请求数：0。
- 报告证据到 QA citation mock browser smoke evidenceRef 请求绑定失败数：0。
- 报告证据到 QA 来源桥 mock browser smoke context/action 缺失数：0。
- 报告证据到 QA 来源桥 marker 中出现 summary/raw answer/raw prompt 的数量：0。
- Project QA code_chunks 证据组合摘要缺失数：0。
- Project QA code_chunks 证据组合摘要刷新失败后丢失数：0。
- Project QA code_chunks 证据组合摘要横向溢出数：0。
- public repo UI optional 证据组合 marker 兼容失败数：0。
- public repo UI 证据组合 marker 出现后 verifier 防伪失败数：0。
- public repo UI 证据组合 marker 中出现 raw content、prompt、answer、token 或 URL 的数量：0。
- 报告证据到 QA citation mock browser smoke 可见 answer citation 数：>0。
- 报告证据到 AutoRepair 创建候选 mock browser smoke 未 mock API 请求数：0。
- 报告证据到 AutoRepair 创建候选 payload 绑定失败数：0。
- AutoRepair 来源扫描闭环 smoke 未 mock API 请求数：0。
- AutoRepair 来源扫描闭环缺失 scanTaskId 伪来源数：0。
- 修复治理时间线 mock browser smoke 未 mock API 请求数：0。
- 修复治理时间线异 scan 可见记录数：0。
- App Shell 全局 UI smoke 未 mock API 请求数：0。
- App Shell 全局 UI smoke 覆盖顶层路由数：12。
- AgentChat 工具证据到 AuditLogs 深链 mock smoke 未 mock API 请求数：0。
- AgentChat 闭环行动栏 mock smoke 未 mock API 请求数：0。
- AgentChat 闭环行动栏 AgentTasks taskId 自动选中失败数：0。
- AgentChat 真实工具调用按 `conversationId` 后端过滤 mismatch 数：0。
- public repo live UI smoke marker：`PUBLIC_REPO_UI_SMOKE_OK`。
- public repo live UI smoke 推荐下一步 marker：`recommendedNextStep.status=OK`。
- public repo live UI smoke 证据抽屉 marker：`evidenceDrawer.status=OK`。
- public repo live UI smoke QA 引用 marker：`qaFromEvidence.status=OK`。

## P6 code_chunks 与代码理解能力增强

目标：让用户从报告、栈帧、文件路径、行号和方法名都能稳定回到正确代码证据，支撑 QA、Agent 和自动修复。

Must：

- 支持完整文件路径、`file:line`、`file:line:column`、`Class#method`、Java/JS stack trace 检索。
- 浏览器/Vite/webpack source URL 必须正确处理 dev-server 端口：`http://localhost:3000/src/generated/api-client.ts:3402:17` 中 `3000` 只能作为端口，不得作为行号参与 chunk 排名；匿名 stack frame 或 standalone source URL 仍必须能提取目标文件名进入候选补池。
- 支持自然语言接口定位：`login endpoint`、`登录接口`、`订单路由` 这类问题必须能优先召回后端 Controller/API handler；明确前端语境的 route/page/component 查询不得被强推到 Controller。
- 公开仓库 smoke 必须包含稳定的自然语言接口 probes：中文 `业务接口` 与英文 `business endpoint` 均应在 top 10 内命中 Controller 强证据或 Controller fallback；只有实际运行并输出 `PUBLIC_REPO_SMOKE_OK` 才能作为 live 发布证据。
- release evidence verifier 对 `OK public-repo-smoke` 必须解析唯一 `PUBLIC_REPO_SMOKE_OK` JSON marker，并证明 `naturalEndpointCn` / `naturalEndpointEn` 两条 probes 均为 Controller 证据，拒绝 FRONTEND、Service/DataAccess fallback、重复 role、多 marker 和缺 probe 伪造。
- `PUBLIC_REPO_SMOKE_OK.chunkSearch.sourceLocationProbes` 必须由 public repo smoke 输出；legacy 合同覆盖 `standaloneBrowserSourceUrl` 与 `anonymousWebpackStackFrame` 两类真实调试输入，新合同必须声明 `sourceLocationProbeContractVersion=2` 并额外覆盖 `viteQuerySourceUrl`。每个 probe 必须绑定当前 `scanTaskId`、安全相对 `targetFile/matchedFile`、`targetLine` 落入 `matchedStartLine-matchedEndLine`、`resultCount>0`、`matched=true`；standalone browser source URL 必须证明 dev-server port `3000` 未被当作行号，Vite query source URL 必须证明 port `5173`、query/hash 和列号未污染目标行定位。release verifier 对 legacy 两类 evidence 保持兼容；新 v2 marker 必须 exactly 三类 probe 且字段白名单校验，不得归档 raw URL、query/hash、stack trace、host/origin 或 request path。新的 schema 2 release/nightly evidence 必须通过 manifest `public_repo_source_location_probes_required=true` 强制要求该字段，缺失即 fail closed；local/ci 默认 false 但允许 focused probe 手工打开严格门禁。
- 当 manifest `public_repo_smoke_ui=true` 时，release evidence verifier 必须要求 `OK public-repo-smoke` 的同一日志中存在唯一 `PUBLIC_REPO_UI_SMOKE_OK`，并校验 ID 绑定、`realBackend=true`、`mockedApi=false`、required pages/viewports、`expectedEvidenceFile` 对齐自然 endpoint 命中文件 basename，以及 marker 不包含 token/JWT/secret 等敏感字段。
- 至少保留一份 focused release evidence 包证明 public-repo-smoke payload gate 在正式证据包路径可用；完整 release/nightly 包仍作为发布候选阶段验收，不用阻塞当前 P12-pre 主线增量。
- 显式 `scanTaskId` 必须绑定指定成功扫描，不能漂移到项目最新扫描。
- 角色意图查询必须区分 Controller、Service、DataAccess 等代码角色，不能被前端 API 文件、聊天组件或文档泛关键词挤占。
- QA 引用必须区分主证据和相邻上下文。
- embedding 复用必须校验 content hash 和 embedding model。

验收：

- `mvn -q -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest,CodeQaControllerTest test` 通过。
- `CodeChunkServiceTest` 必须覆盖匿名 browser/webpack stack frame 和 standalone source URL：候选池先命中无关文件时仍能按文件名补回目标 chunk；dev-server port 不得误导 line hint 排名。
- 公开仓库 smoke 必须输出 `chunkSearch.roleProbes`，并分别证明 `controller`、`service`、`dataAccess` 查询在 top N 内命中强角色证据。
- 公开仓库 smoke 必须输出 `chunkSearch.sourceLocationProbes`，证明当前真实扫描后的 code_chunks API 支持 browser source URL、Vite query source URL 和 anonymous stack frame 定位，且端口、query/hash 或列号误判为目标代码行的数量为 0。
- 当前已保留 focused release evidence 包 `release-evidence/p6-source-location-v2-live-20260702-200348`，证明 v2 `sourceLocationProbes` 在正式证据包路径可用；该包不是 full release authority。
- role-specific smoke 不能允许 `FRONTEND` 证据冒充 Controller、Service 或 DataAccess。

量化指标：

- 路径/行号/方法锚点回归测试覆盖：必须存在。
- 指定扫描查询未成功扫描返回 `NO_SCAN`，不得返回残留 chunk。
- 默认 Java/Spring 公开仓库 role probe 误命中前端文件数：0。
- public repo source location probe 端口误判行号数：0。

## P3 AutoRepair 与报告修复闭环

目标：从扫描报告风险项安全生成可审查修复候选，形成报告、修复、PR、审计的闭环。

Must：

- 报告风险项生成的修复候选必须携带 `projectId`、`repositoryId`、`scanTaskId`、`filePath`、`source` 和 `targetDesc`。
- 后端创建 AutoRepair 时校验来源扫描属于同项目、同仓库且状态为 `SUCCESS`。
- AutoRepair 默认产出 patch，不直接写原仓库或远端。
- 受控 PR 必须有显式开关、权限校验、patch 边界校验和审计。
- 前端列表和详情必须能回跳来源扫描报告。
- AutoRepair 列表 API 必须支持按 `scanTaskId` 过滤，使扫描报告页修复治理时间线能从服务端请求层绑定当前 scan。
- 扫描报告页修复治理时间线必须优先使用后端只读聚合接口 `GET /api/projects/{projectId}/scan-tasks/{scanTaskId}/governance-timeline`，不得回退为前端多接口分页拼装。
- scan governance 聚合接口必须校验 project 所有权和 scan/project 归属，并对 AutoRepair、AgentTask、AgentToolCall、AuditLog、Artifact、ExecutionTask 使用 `projectId + scanTaskId/source/owner/resource` 精确归因。
- scan governance 聚合响应必须返回 `summary`、`resources`、`events`、`limits`、`truncated`、`warnings` 和 `attributionGaps`，使前端不再猜测截断、归因和派生执行任务关系。
- `PATCH_READY` 前端详情必须同时展示 readiness、patch artifact 入口、执行步骤，并保留 artifact/audit/execution source 回跳 AutoRepair 的深链合同。
- `PATCH_READY` 创建 PR 前必须展示四项证据 review checklist：来源扫描、补丁产物、执行步骤和 `AUTO_REPAIR_PATCH_READY` 审计事件。
- `PATCH_READY` 前端 browser smoke 必须全量 mock `/api`，证明 detail fallback、source scan、patch review checklist、patch artifact、execution steps、audit deep link、关联资源回跳和 PR Popconfirm cancel，且不得触发真实 `submit-pr`。
- 后端 `submit-pr` 必须独立执行 PATCH_READY 证据硬门禁，不能依赖前端按钮状态；进入 `PR_RUNNING`、解密 token 或调用 PR 创建服务前，必须校验 `diffContent`、单文件 patch policy、`CHANGE_PATCH` artifact record、成功 `AUTO_REPAIR` execution task、成功 `generate_patch` step 和 `AUTO_REPAIR_PATCH_READY/SUCCESS` audit。
- 后端 `submit-pr` 缺任一关键证据时必须 fail closed：不更新 repair、不中转为 `PR_RUNNING`、不启动 async PR 创建、不解密仓库 token、不调用 `submitPatchAsPullRequest`，并记录 `AUTO_REPAIR_PR_REJECTED` 审计。
- 异步 `executeSubmitPrAsync` 在取 token 或调用 PR 创建服务前必须再次执行运行时复验，覆盖 submit-pr feature flag、用户项目权限、`prUrl` 为空、PATCH_READY 证据链、repo/project 归属、`provider=GITHUB`、`authType=GITHUB_APP` 和 GitHub App PR 权限，防止排队后配置或证据漂移。
- 异步 preflight 策略/权限/证据拒绝必须记录为 `AUTO_REPAIR_PR_REJECTED`；clone/apply/push/create PR 等真实执行失败才记录为 `AUTO_REPAIR_PR_FAILED`。
- AutoRepair PR 创建阶段必须使用独立 `ExecutionAttempt`：`submitPr` 成功排队后启动新的 PR attempt，`executeSubmitPrAsync` 的 runtime preflight、clone/apply/push/create PR、success/fail/cancel 全部写入当前 PR attempt，不得复用 patch generation 的 task-level terminal state。
- PATCH_READY 后端证据校验必须以不可变 patch evidence 为准：`CHANGE_PATCH` artifact、历史 `generate_patch SUCCESS` step 和 `AUTO_REPAIR_PATCH_READY/SUCCESS` audit；PR attempt 的 `FAILED/CANCELLED/RUNNING` 状态不得反向污染旧 patch evidence 或阻断合法 PR 重试。

验收：

- `mvn -q -Dtest=AutoRepairControllerTest,AutoRepairServiceTest test` 通过。
- `AutoRepairControllerTest` 必须证明 `GET /api/projects/{projectId}/auto-repairs?scanTaskId=...` 会把 `scan_task_id` 加入查询 wrapper。
- `ScanTaskGovernanceTimelineControllerTest` 必须证明聚合接口先校验项目权限，且 scan 不属于 project 时返回拒绝结果。
- `ScanTaskGovernanceTimelineServiceTest` 必须证明每类聚合查询包含 project/scan/source/owner/resource 边界，且超过 limit 时返回 `truncated=true` 与准确 `total/returned`。
- `./scripts/security-regression-check.sh` 覆盖来源扫描校验。
- `node scripts/validate-frontend-ui.mjs` 覆盖前端隐藏字段、列表列和详情回跳。
- `node scripts/validate-frontend-ui.mjs` 覆盖 AutoRepair `PATCH_READY` 前端合同：readiness、四项证据 checklist、`AUTO_REPAIR` artifact、AuditLog 回跳和 ExecutionTask source 回跳。
- `node scripts/validate-frontend-ui.mjs` 必须锁住 scan governance 聚合 API client、`ScanTaskDetail` 聚合 API 使用、legacy fan-out 禁止项、foreign scan 防污染和双视口 smoke marker。
- `make file-bound-repair-smoke` 覆盖真实扫描报告中的文件级风险、`filePath`、code_chunks 和 AutoRepair 候选 URL 合同。
- `make autorepair-patch-smoke` 覆盖真实 AutoRepair 创建、MOCK LLM patch 生成、`PATCH_READY`、patch artifact、execution task 和审计日志闭环。
- `make patch-ready-ui-smoke` 覆盖 mock-driven PATCH_READY 浏览器闭环，且 `node scripts/validate-frontend-ui.mjs` 必须锁住该 smoke 的路由边界和安全合同。
- PATCH_READY 创建 PR 前必须执行结构化人工复核硬门禁：`diffContent` 非空、`CHANGE_PATCH` artifact 已归档、ExecutionTask 绑定当前 `AUTO_REPAIR` 且历史 `generate_patch SUCCESS` step 存在、`AUTO_REPAIR_PATCH_READY/SUCCESS` 审计事件可查询；任一阻塞证据缺失时前端必须禁用“创建 PR”，`handleSubmitPr` 还必须 fail closed。PR submission attempt 的 `FAILED/CANCELLED/RUNNING` 只能作为 PR 阶段状态展示，不得反向污染旧 patch evidence。
- AutoRepair 详情页必须产品化展示 `Patch generation attempt` 与 `PR submission attempt` 两段时间线：每段展示 attemptNo、status、currentStep、开始/结束时间、失败原因和该 attempt 下的步骤；PATCH_READY 尚未提交 PR 时必须显示 `PR submission not started / 等待人工创建 PR`，PR attempt 失败后必须显示补丁证据仍可复用。
- `mvn -q -Dtest=AutoRepairServiceTest,AutoRepairControllerTest,AutoRepairPrServiceTest,AutoRepairPatchPolicyTest test` 必须证明后端 `submit-pr` 硬门禁：成功路径只排队、不直接创建 PR；缺 artifact path、缺 artifact record、artifact storagePath mismatch、缺 execution evidence、缺 `generate_patch` step、缺 audit、invalid diff 和 service reject controller 路径均不会进入 token/PR 创建。
- `AutoRepairServiceTest` 必须证明 async runtime preflight：排队后 feature flag 关闭、repo authType 漂移为 PAT、GitHub App 权限降级、patch-ready audit 消失、diff 漂移时均回退 `PATCH_READY`，不解密 token、不调用 PR 创建服务，并写入 `AUTO_REPAIR_PR_REJECTED`；真实 push/create PR 失败仍写入 `AUTO_REPAIR_PR_FAILED`。
- `AutoRepairServiceTest` 必须证明 PR attempt split：排队创建独立 PR attempt，async PR 步骤只写当前 attempt，runtime rejection/真实 PR failure/cancel 不写 task-level PR step，且上一次 PR attempt 失败后仍能基于旧 patch evidence 重新提交。
- 人工候选缺少 `scanTaskId` 只能作为 warning，不得阻塞创建 PR；来自扫描报告的修复候选必须保留 scan back-link，并在 audit/query/marker 中绑定同一 scan。
- `PATCH_READY_UI_SMOKE_OK.tableDetailAction` 必须证明 AutoRepairs 表格显式详情按钮可见、点击后详情面板匹配、键盘可打开详情且选中行具备可访问状态；`PATCH_READY_UI_SMOKE_OK.reviewGate` 必须证明 `blockingEvidenceSatisfied=true`、`missingEvidenceBlocked=true`、`manualCandidateScanTaskWarningOnly=true` 和 `popconfirmSummaryVisible=true`；Popconfirm 必须展示来源、Candidate Provenance Receipt 的 `repairEvidenceGate/repairEvidenceGateSource`、Diff、Patch artifact、`generate_patch SUCCESS` patch evidence、Audit 和操作后果摘要，且取消不会调用 `submit-pr`。候选 receipt gate 只作为最终人工确认上下文，不升级为 PATCH_READY 或 PR hard gate。同一 marker 必须包含 `prConfirmCandidateGate.sourceType=PROJECT_QA_VERIFIED_CITATION`、`prConfirmCandidateGate.repairEvidenceGate=READY`、`prConfirmCandidateGate.repairEvidenceGateSource=SERVER_DERIVED`、`prConfirmCandidateGate.warningOnlyForPatchReady=true`、`attemptSplit.prExecutionAttemptSplit=true`、attempt ids/nos、patch step keys、PR step keys 和 `prFailureDoesNotBlockPatchEvidence=true`。
- `make scan-governance-timeline-ui-smoke` 必须覆盖 mock-driven 聚合 API、旧多接口 fan-out 未使用、current scan marker 可见、foreign scan marker 不可见、`1440x900` / `320x740` 视口、无未 mock `/api` 和无横向溢出。该 smoke 还必须证明 `修复治理阶段轨道` 可见，marker `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.stageRail` 必须包含 `visible=true`、五个阶段名称、每阶段状态数组、`foreignScanExcluded=true` 和 `unhandledApiRequests=0`；`actionLanding` 必须证明从 `/scan-tasks/{scanTaskId}` 点击真实按钮后 7 类动作均完成目标页落位，`clickedActionCount=7`、`allLandingPagesLoaded=true`、`allSelectedOrFiltered=true`、`autoRepairSelected=true`、`artifactSelected=true`、`executionTaskSelected=true`、`auditResourceFiltered=true`、`toolCallFiltered=true`、`agentTaskSelected=true`、`rawAgentTaskPayloadHidden=true`、`qaContextBound=true`；`candidateReceipt` 必须证明 event/source type/current receipt 可见、`repairEvidenceGate=READY`、`repairEvidenceGateReason` 非空且可见、`repairEvidenceGateSource=SERVER_DERIVED`、`serverDerivedGateVisible=true`、foreign receipt hidden、AutoRepair detail deep link bound 到当前 `projectId + scanTaskId + repairId`、无 raw prompt/answer；`prGate` 必须证明 `AUTO_REPAIR_PR_REJECTED` 进入治理时间线、PR 复核阶段 blocked、foreign PR gate hidden、AutoRepair detail deep link bound、audit source bound、scanTaskId bound、无 raw prompt/answer；`patchEvidence` 必须证明当前 AutoRepair `PATCH_READY` 可见、target file/diff 可见、`CHANGE_PATCH` artifact 归属 `AUTO_REPAIR#6101`、修复 execution 归属 `AUTO_REPAIR#6101`、`generate_patch SUCCESS` step 可见、`AUTO_REPAIR_PATCH_READY/SUCCESS` audit 可见、foreign patch evidence hidden、无 raw prompt/answer；`agentReview` 必须证明 current AgentTask 可见、foreign AgentTask hidden、AgentToolCall 审计可见、foreign tool call hidden、Agent execution 绑定当前 `AGENT_TASK` source、scanTaskId bound、无 raw prompt/answer。
- Scan governance timeline 的非 CandidateReceipt 事件动作必须使用明确产品语义和可复验 deep link：PR Gate 使用 `打开修复详情` 并绑定当前 `projectId + scanTaskId + repairId`；AutoRepair patch artifact 使用 `打开补丁产物` 并绑定 `ownerType=AUTO_REPAIR&ownerId=repairId&artifactId=patchArtifactId`，目标页必须打开或聚焦该具体 artifact；repair/agent execution 使用 `打开执行详情` 并绑定 `taskId`；`AUTO_REPAIR_PATCH_READY` audit 使用 `打开审计日志` 并绑定 `resourceType=AUTO_REPAIR&resourceId=repairId&action=AUTO_REPAIR_PATCH_READY&status=SUCCESS`；AgentTask 使用 `打开 Agent 任务` 并绑定 `scanTaskId + taskId`；AgentToolCall 使用 `打开审计日志` 并绑定当前 `scanTaskId` 和可用 `conversationId`。`validate-frontend-ui.mjs` 必须拒绝治理事件回退到 `审计`、`任务列表`、`执行详情`、`产物库` 等泛化短标签。
- `verify-release-evidence.sh` 对 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK` 必须强制消费上述动作证据：CandidateReceipt 的 `sourceReportDeepLinkBound/qaReviewDeepLinkBound/actionLabels`，PR Gate 的 `actionLabel=打开修复详情`，Patch evidence 的 `patchArtifactActionLabel/patchArtifactDeepLinkBound/repairExecutionActionLabel/repairExecutionDeepLinkBound/patchReadyAuditActionLabel/patchReadyAuditDeepLinkBound`，以及 Agent review 的 `agentTaskActionLabel/agentTaskDeepLinkBound/toolCallAuditActionLabel/toolCallAuditDeepLinkBound/agentExecutionActionLabel/agentExecutionDeepLinkBound`。`security-regression-check.sh` 必须包含合法 marker 新 schema 和对应 forged marker 负例，防止旧 marker 或泛化 action label 伪造通过。
- public repo live UI smoke 若进入 release evidence，必须在 `PUBLIC_REPO_UI_SMOKE_OK` 中输出 `governanceTimeline` 证据，并由 `verify-release-evidence` 校验真实 GET `/api/projects/{projectId}/scan-tasks/{scanTaskId}/governance-timeline`、HTTP 200、`SUCCESS`、project/repository/scan 绑定、`SUCCESS` scan status、summary/counts/resources/limits/events、`resourcesBound=true`、`eventCount>0` 和 `Scan Governance Timeline` 页面覆盖；同一 marker 还必须证明派生治理可见性：`derivedAuditResourceTypes` 包含 `AUTO_REPAIR` / `AGENT_TASK`，`derivedArtifactOwnerTypes` 包含 `AUTO_REPAIR` / `AGENT_TASK`，`derivedArtifactTypes` 包含 `CHANGE_PATCH` / `AGENT_REPORT`，且 `derivedGovernanceVisible=true`。`governanceTimeline.agentReview` 必须进一步证明当前 `AgentTask` 绑定当前 `scanTaskId`、`AGENT_REPORT` artifact 归属当前 AgentTask、`AGENT_TASK_SMOKE_READY/SUCCESS` audit 绑定当前 AgentTask、`AGENT_TASK` execution 为 `SUCCESS` 且当前步骤为 `generate_report`、foreign Agent evidence hidden，并且 marker 不暴露 raw prompt/answer 或敏感凭据。
- release evidence 必须能记录 `file-bound-repair-smoke`、`autorepair-patch-smoke`、`patch-ready-ui-smoke`、`dashboard-next-action-ui-smoke`、`report-evidence-drawer-ui-smoke`、`scan-governance-timeline-ui-smoke`、`agent-chat-audit-ui-smoke`、`agent-chat-tool-audit-smoke` 和 `audit-workbench-smoke` 的标准 step，支持显式跳过、缺配置 required failure 和 verifier 复核。
- `verify-release-evidence` 对 `OK autorepair-patch-smoke` 必须解析 `AUTOREPAIR_PATCH_SMOKE_OK` JSON，并证明 `PATCH_READY`、`CHANGE_PATCH` 产物、`AUTO_REPAIR` execution task、`AUTO_REPAIR_PATCH_READY` audit、`scanTaskId`、目标文件和 MOCK LLM provider 都存在且一致。
- `verify-release-evidence` 对 `OK patch-ready-ui-smoke` 必须解析唯一 `PATCH_READY_UI_SMOKE_OK` JSON，并证明 mock-only browser flow、detail fallback、audit deep link、`submitPrCount=0`、未 mock API 数量为 0、`viewports` 包含 `1440x900` 和 `320x740`、local-only host、`tableDetailAction.visible=true`、`detailPanelMatched=true`、`tableDetailAction.keyboardOpen.enter=true`、`tableDetailAction.keyboardOpen.space=true`、`accessibleSelection=true`、`sharedSelectableRow.ariaControlsLinked=true`、`sharedSelectableRow.detailRegionLinked=true`、`sharedSelectableRow.selectedRepairIds=[101,103]`、`reviewGate.requiredEvidence=["diff","patchArtifact","patchGenerationStep","auditEvent"]`、`blockingEvidenceSatisfied=true`、`missingEvidenceBlocked=true`、`manualCandidateScanTaskWarningOnly=true`、`popconfirmSummaryVisible=true`、`prConfirmCandidateGate.sourceType=PROJECT_QA_VERIFIED_CITATION`、`prConfirmCandidateGate.repairEvidenceGate=READY`、`prConfirmCandidateGate.repairEvidenceGateSource=SERVER_DERIVED`、`prConfirmCandidateGate.visible=true`、`prConfirmCandidateGate.warningOnlyForPatchReady=true`、`attemptSplit.prExecutionAttemptSplit=true`、`attemptIds=[1,2]`、`attemptNos=[1,2]`、`patchAttemptStepKeys=["prepare_workspace","generate_patch"]`、`prAttemptStepKeys=["create_branch","push_branch","create_pull_request"]`、`patchEvidenceFromStep=true` 和 `prFailureDoesNotBlockPatchEvidence=true`。
- `verify-release-evidence` 对 `OK dashboard-next-action-ui-smoke` 必须解析唯一 `DASHBOARD_NEXT_ACTION_SMOKE_OK` JSON，并证明 mock-only browser flow、7 个推荐分支、7 个推荐标题、`visitedCases` 覆盖每个分支的 `1440x900` 和 `320x740`、`unhandledApiRequests=0`、`spec=dashboard-next-action-smoke.spec.ts` 和 local-only host；marker 还必须包含 `visualEvidence`，证明 `review-risk-report` 在 `1440x900` / `320x740` 下有稳定 screenshot 名、artifact 相对路径、截图尺寸匹配 viewport、截图字节数超过阈值、PNG 像素多样性不低于 16、panel/title/primary button 未裁切且 primary button 文本保持白色可读。verifier 必须读取包内 PNG 本体，校验 PNG magic/IHDR、实际尺寸、实际 bytes 和实际像素多样性，并把两张 PNG 加入 release evidence expected package allowlist。
- `verify-release-evidence` 对 `OK report-evidence-drawer-ui-smoke` 必须解析唯一 `REPORT_EVIDENCE_DRAWER_SMOKE_OK` JSON，并证明 mock-only browser flow、fixture project/repository/scan 绑定、目标证据文件 `src/main/java/demo/report/evidence/readability/ChatControllerWithVeryLongBoundaryEvidencePath.java`、`drawerQueryCount=6`、`readyDrawerQueryCount=3`、`gapDrawerQueryCount=3`、`unhandledApiRequests=0`、`spec=report-evidence-drawer-smoke.spec.ts`、`1440x900` / `320x740` 和 local-only host；同一日志还必须解析唯一 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` JSON，并证明 `projectId=1`、`repositoryId=11`、`scanTaskId=501`、同一 `expectedEvidenceFile`、`qaRequestCount=6`、mock-only、local-only、无未 mock API、双 viewport、`qaFromEvidence.status=OK`、`responseStatus=200`、`resultCount/citationCount/citedChunkCount>0`、verified `groundingStatuses` 全为 `VERIFIED`、verified `citationEnforcementStatuses` 只能为成功状态、`evidenceRef.requestBound/contextVisible=true`，且 `evidenceRef.filePath` 必须是安全相对路径并匹配目标证据文件；同时必须证明 `qaFromEvidence.unverifiedCitation.status=OK`、`responseStatus=200`、`resultCount/citationCount>0`、`uncitedCandidateCount>0`、`expectedEvidenceFileVisible=true`、`groundingStatuses=["PARTIAL"]`、`citationEnforcementStatuses=["RETRY_FAILED"]` 和 `evidenceRefRequestBound=true`。`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality` 字段 present 后必须执行 optional-present strict 校验，拒绝隐藏、计数缺口、overclaim、横向溢出、provider/LLM claim 和 raw/sensitive 字段。
- `verify-release-evidence` 对 `OK scan-governance-timeline-ui-smoke` 必须解析唯一 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK` JSON，并证明 mock-only browser flow、聚合 API scan 绑定、`scanTaskId=8801`、`foreignScanExcluded=true`、`unhandledApiRequests=0`、`actionLanding.clickedActionCount=7`、`actionLanding.allLandingPagesLoaded=true`、`actionLanding.allSelectedOrFiltered=true`、`actionLanding.autoRepairSelected/artifactSelected/executionTaskSelected/auditResourceFiltered/toolCallFiltered/agentTaskSelected/rawAgentTaskPayloadHidden/qaContextBound=true`、`stageRail.visible=true`、`stageRail.stages` 包含 `风险定位` / `修复候选` / `Patch 证据` / `PR 复核` / `审计归档`、`stageRail.states` 与阶段数量一致、`candidateReceipt.eventVisible/sourceTypeVisible/currentReceiptVisible/foreignReceiptHidden/autoRepairDeepLinkBound/noRawPromptOrAnswer=true`、`candidateReceipt.repairEvidenceGate=READY`、`candidateReceipt.repairEvidenceGateReason` 非空、`candidateReceipt.repairEvidenceGateSource=SERVER_DERIVED`、`candidateReceipt.serverDerivedGateVisible=true`、`prGate.eventVisible/currentRepairVisible/foreignPrGateHidden/autoRepairDeepLinkBound/auditSourceBound/scanTaskIdBound/noRawPromptOrAnswer=true` 且 `prGate.action=AUTO_REPAIR_PR_REJECTED`、`patchEvidence.repairVisible/scanTaskIdBound/targetFileVisible/diffVisible/patchArtifactVisible/patchArtifactActionVisible/repairExecutionVisible/patchGenerationStepVisible/patchReadyAuditVisible/auditSourceBound/foreignPatchEvidenceHidden/noRawPromptOrAnswer=true` 且 `patchEvidence.autoRepairId=6101`、`patchEvidence.repairStatus=PATCH_READY`、`patchEvidence.patchArtifactOwnerType=AUTO_REPAIR`、`patchEvidence.patchArtifactOwnerId=6101`、`patchEvidence.patchArtifactType=CHANGE_PATCH`、`patchEvidence.repairExecutionSourceType=AUTO_REPAIR`、`patchEvidence.repairExecutionSourceId=6101`、`patchEvidence.repairExecutionStatus=SUCCESS`、`patchEvidence.patchGenerationStepKey=generate_patch`、`patchEvidence.patchGenerationStepStatus=SUCCESS`、`patchEvidence.patchReadyAuditAction=AUTO_REPAIR_PATCH_READY`、`patchEvidence.patchReadyAuditStatus=SUCCESS`、`agentReview.currentAgentTaskVisible/foreignAgentTaskHidden/toolCallAuditVisible/foreignToolCallHidden/agentExecutionBound/currentAgentExecutionVisible/scanTaskIdBound/noRawPromptOrAnswer=true` 且 `agentReview.agentExecutionSourceType=AGENT_TASK`、`agentReview.agentExecutionSourceId=9101`、`spec=scan-governance-timeline-smoke.spec.ts`、`1440x900` / `320x740` 和 local-only host。
- `verify-release-evidence` 对 `OK agent-chat-audit-ui-smoke` 必须解析唯一 `AGENT_CHAT_AUDIT_SMOKE_OK` JSON，并证明 mock-only browser flow、AgentChat deep link、`conversationId=77`、`conversationFilter=true`、`unhandledApiRequests=0`、`spec=agent-chat-audit-smoke.spec.ts` 和 local-only host。
- `verify-release-evidence` 对 `OK agent-chat-tool-audit-smoke` 必须解析唯一 `AGENT_CHAT_TOOL_AUDIT_SMOKE_OK` JSON，并证明真实后端 AgentChat tool flow、loopback host、`agentChatPath=true`、`directToolExecutionOnly=false`、`toolName=read_file`、`permissionLevel=READ_ONLY`、`success=true`、SSE `tool_call/tool_result/done`、assistant `toolCallsJson`、TOOL `toolResultsJson`、正确 `conversationId` 返回 1 条以上、错误 `conversationId` 返回 0、`mismatchCount=0`、`externalLlm=false`、`externalNetwork=false`，且 marker 不含 token/password/Authorization/private key/API key、完整路径、原始 prompt、SSE 原文或工具结果全文。
- release evidence 必须支持 `local`、`ci`、`release`、`nightly` 四个 profile；manifest 必须记录 `release_evidence_profile_schema`、`release_evidence_profile` 和 `release_evidence_profile_source`。schema 2 manifest 还必须记录 `public_repo_source_location_probes_required`，且 release/nightly 必须为 true。verifier 必须能从非 `local` profile 反推每个 include mode、`public_repo_smoke_ui` 子门禁和 source location probe required 子门禁，拒绝 profile/include mismatch 和 fixed-profile include override。

量化指标：

- 来源扫描丢失率：0。
- 未完成扫描可作为修复证据：0。
- PATCH_READY 缺失 patch artifact、执行任务或审计日志：0。
- PATCH_READY 缺失 diff、patch artifact、execution source 绑定、历史 `generate_patch SUCCESS` step 或 `AUTO_REPAIR_PATCH_READY/SUCCESS` 审计事件却仍可点击创建 PR：0。
- 后端 `submit-pr` 缺少任一 PATCH_READY 证据却仍更新为 `PR_RUNNING`、解密 token 或调用 PR 创建服务的次数：0。
- 异步 PR 创建在 preflight 证据/权限漂移后仍解密 token 或调用 PR 创建服务的次数：0。
- 人工候选无 scanTaskId 被误作为阻塞项的次数：0。
- `OK autorepair-patch-smoke` 但缺少成功 marker 或关键字段仍通过 release verifier 的次数：0。
- PATCH_READY browser smoke 误触真实后端 API 或真实 `submit-pr` 次数：0。
- `PATCH_READY_UI_SMOKE_OK` 缺少 `tableDetailAction`、`reviewGate` 证据、attempt split 证据、PR 失败不阻断 patch evidence 证据或缺失证据阻塞负例仍通过静态门禁的次数：0。
- `OK patch-ready-ui-smoke` 但缺少成功 marker 或关键字段仍通过 release verifier 的次数：0。
- `OK dashboard-next-action-ui-smoke` 但缺少成功 marker、7 分支、双 viewport、mock-only、按钮流证据、`visualEvidence` 截图/像素/边界/按钮可读证据或真实 PNG artifact 本体仍通过 release verifier 的次数：0。
- `OK report-evidence-drawer-ui-smoke` 但缺少 drawer/QA 任一成功 marker、scan 绑定、目标证据文件、双 viewport、mock-only、code_chunks 抽屉证据、QA citation、verified grounding、successful citation enforcement、request-bound evidenceRef 或安全相对文件路径仍通过 release verifier 的次数：0。
- `OK scan-governance-timeline-ui-smoke` 但缺少成功 marker、scan 绑定、异 scan 排除、双 viewport、mock-only 或聚合治理时间线证据仍通过 release verifier 的次数：0。
- `OK agent-chat-audit-ui-smoke` 但缺少成功 marker、mock-only 字段或 conversation filter 证据仍通过 release verifier 的次数：0。
- `OK agent-chat-tool-audit-smoke` 但缺少成功 marker、真实后端 AgentChat path、READ_ONLY 工具调用、conversation filter、SSE 事件、持久化字段或 local-only 边界仍通过 release verifier 的次数：0。
- `OK public-repo-smoke` 且 `public_repo_smoke_ui=true`，但缺少或伪造 `governanceTimeline` 仍通过 release verifier 的次数：0。

## P9 增量：CI Diagnostics detail selection accessibility

目标：CI 诊断页作为 CI 失败到 AutoRepair 候选的入口，必须具备可访问、可验证、不会误触的表格详情选择体验。

Must：

- `CiDiagnostics` 表格行必须支持鼠标点击、键盘 Enter、键盘 Space 打开详情。
- 表格行必须具备 `tabIndex=0`、`aria-selected` 和稳定行级 `aria-label`，label 必须包含 `CiDiagnostic #id`。
- 工作流 link 和“重新分析”行内操作必须阻止冒泡，不能劫持或重复触发行选择。
- 详情卡必须展示诊断质量、失败摘要、根因、相关文件、修复建议、原始日志片段。
- 详情卡必须展示“修复候选资格”，说明仓库绑定、相关文件、修复建议是否满足；可生成时必须说明默认绑定第一个相关文件，不可生成时必须说明缺失原因。
- `make ci-diagnostics-detail-selection-ui-smoke` 必须是全 API mock、双 viewport、local-only browser smoke。
- `scripts/validate-frontend-ui.mjs` 必须锁定 CI Diagnostics 行键盘、ARIA、CSS、smoke config、NPM/Make entrypoint 和成功 marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `cd web-console && npm run build` 通过。
- `CI=true make ci-diagnostics-detail-selection-ui-smoke` 通过。
- marker `CI_DIAGNOSTICS_DETAIL_SELECTION_SMOKE_OK` 必须包含：
  - `mockedApiOnly=true`
  - `unhandledApiRequests=0`
  - `viewports=["1440x900","320x740"]`
  - `detailAction.visible=true`
  - `detailAction.detailPanelMatched=true`
  - `keyboardOpen.enter=true`
  - `keyboardOpen.space=true`
  - `diagnosticSignal.strongEvidence=true`
  - `repairReadiness.targetFileExplained=true`
  - `repairReadiness.unavailableReasonExplained=true`
  - `accessibleSelection=true`
  - `nestedActionsDoNotHijackSelection=true`

非范围：

- 不测试真实 CI provider、真实 webhook、真实 LLM 诊断质量。
- 不测试创建诊断表单完整提交流程。
- 不测试 AutoRepair 页面跳转后的 patch 生成或 PR 创建。
- 不刷新 full release authority。

## P9 增量：PR Reviews detail selection accessibility

目标：PR 审查页作为 PR 风险审查到 AutoRepair 候选的入口，必须具备可访问、可验证、不会误触、不会丢失项目上下文的表格详情选择体验。

Must：

- `PrReviews` 表格行必须支持鼠标点击、键盘 Enter、键盘 Space 打开详情。
- 表格行必须具备 `tabIndex=0`、`aria-selected`、`aria-controls` 和稳定行级 `aria-label`，label 必须包含 `PrReview #id`。
- 详情卡必须具备稳定 id、`role="region"` 和 `aria-labelledby`。
- PR 标题 link 和“重新分析”行内操作必须阻止冒泡，不能劫持或重复触发行选择。
- 切换 PR 时必须清空旧 comments，非 completed 详情不得残留上一条 completed PR 的行级评论。
- 详情卡必须展示合并决策、变更摘要、影响范围、风险点、行级评论、测试建议、变更文件和 Diff 摘要。
- 详情卡必须展示“修复候选资格”，说明仓库绑定、目标文件、行级评论、风险点是否满足；可生成时必须说明文件来源，不可生成时必须说明缺失原因。
- PR 到 AutoRepair 候选 URL 必须保留 `projectId`、`repositoryId`、`filePath`、`source` 和 `openCreate`。
- PR Reviews 必须具备三视口可读性守护：`1440x900`、`390x844`、`320x740` 下详情卡必须处于 viewport 内，风险/评论/文件路径/测试建议/Diff/修复资格等关键长文本必须可读且不被截断。
- PR Reviews 表格横向滚动必须由 `.sl-pr-table-card .ant-table-content` 承担；页面级 document 不得出现不可控横向溢出。
- `make pr-reviews-detail-selection-ui-smoke` 必须是全 API mock、三 viewport、local-only browser smoke。
- `scripts/validate-frontend-ui.mjs` 必须锁定 PR Reviews 行键盘、ARIA、detail region、CSS、AutoRepair query 绑定、三视口 readability helper、NPM/Make entrypoint 和成功 marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `cd web-console && npm run build` 通过。
- `CI=true make pr-reviews-detail-selection-ui-smoke` 通过。
- marker `PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK` 必须包含：
  - `mockedApiOnly=true`
  - `unhandledApiRequests=0`
  - `viewports=["1440x900","390x844","320x740"]`
  - `detailAction.visible=true`
  - `detailAction.detailPanelMatched=true`
  - `keyboardOpen.enter=true`
  - `keyboardOpen.space=true`
  - `reviewDecisionSignal.mergeDecisionVisible=true`
  - `comments.lineLevelCommentVisible=true`
  - `repairReadiness.targetFileDerived=true`
  - `repairReadiness.projectIdPreserved=true`
  - `layoutDensity.mobile390Covered=true`
  - `layoutDensity.narrow320Covered=true`
  - `layoutDensity.detailCardContained=true`
  - `layoutDensity.tableScrollerContained=true`
  - `layoutDensity.noHorizontalOverflow=true`
  - `mobileReadability.criticalTextsWrap=true`
  - `mobileReadability.tableScrollerContained=true`
  - `accessibleSelection=true`
  - `nestedActionsDoNotHijackSelection=true`

非范围：

- 不测试新建 PR 审查表单完整提交流程。
- 不测试真实 PR provider、真实 GitHub App、真实 webhook、真实 LLM 审查质量。
- 不测试 AutoRepair 页面跳转后的 patch 生成或 PR 创建。
- 不刷新 full release authority。

## P9 增量：IssueDecomposition detail selection accessibility

目标：Issue 拆解页作为需求理解、任务拆分和后续执行的入口，必须具备可访问、可验证、不会误触、不会残留旧任务的表格详情选择体验。

Must：

- `IssueDecomposition` 表格行必须支持鼠标点击、键盘 Enter、键盘 Space 打开详情。
- 表格行必须具备 `tabIndex=0`、`aria-selected`、`aria-controls` 和稳定行级 `aria-label`，label 必须包含 `IssueDecomposition #id`。
- 详情卡必须具备稳定 id、`role="region"` 和 `aria-labelledby`。
- 标题 action、复制 Markdown、导出 Markdown 和任务状态选择等行内/详情内操作必须阻止误触，不能劫持当前行选择。
- 切换 Issue 拆解时必须清空旧 tasks，失败态或非 completed 详情不得残留上一条 completed issue 的任务。
- 详情卡必须展示理解、影响范围、验收标准、风险、依赖、拆解任务、源数据和失败原因。
- Plan Signal 必须把完成态、失败态、任务数量和治理提示解释清楚，失败态必须说明不能加载任务的原因。
- 原始结果 tab 必须默认展示脱敏 `outputJson`，渲染区域必须为 `.sl-issue-source-preview.sl-issue-source-preview-redacted`，`aria-label="脱敏 Issue 拆解原始结果"`，并在显示层脱敏 Authorization/Bearer、token、apiKey/apikey/api_key、secret/password、privateKey/private_key、accessToken/access_token、refreshToken/refresh_token、`sk-*` 和 JWT-like token。
- 复制 Markdown 和导出 `.md` 必须经过 `sanitizeIssueMarkdownExport` 后再写入 clipboard 或 Blob；普通 UI 工作台不得把后端 raw Markdown 直接复制或下载。
- `make issue-decomposition-detail-selection-ui-smoke` 必须是全 API mock、双 viewport、local-only browser smoke。
- `make issue-decomposition-detail-selection-ui-smoke` 必须在 `outputJson` 与 Markdown export fixture 中注入 raw secret sentinel、Bearer token、OpenAI-style key 和 JWT-like token，断言页面 body、原始结果 preview、复制内容、下载文件和 marker 均不包含 raw secret，且出现 `[REDACTED]`。
- `scripts/validate-frontend-ui.mjs` 必须锁定 IssueDecomposition 行键盘、ARIA、detail region、tasks stale clearing、局部 CSS、redaction helper、copy/export sanitize、smoke config、NPM/Make entrypoint 和成功 marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `cd web-console && npm run build` 通过。
- `CI=true make issue-decomposition-detail-selection-ui-smoke` 通过。
- marker `ISSUE_DECOMPOSITION_DETAIL_SELECTION_SMOKE_OK` 必须包含：
  - `mockedApiOnly=true`
  - `unhandledApiRequests=0`
  - `viewports=["1440x900","320x740"]`
  - `detailAction.visible=true`
  - `detailAction.detailPanelMatched=true`
  - `keyboardOpen.enter=true`
  - `keyboardOpen.space=true`
  - `planningSignal.visible=true`
  - `planningSignal.countsAligned=true`
  - `planningSignal.failedStateExplained=true`
  - `tasks.statusUpdateIsolated=true`
  - `tasks.staleTasksClearedForFailedIssue=true`
  - `exportActions.copyIsolated=true`
  - `exportActions.downloadIsolated=true`
  - `rawResultSafety.scope=ISSUE_DECOMPOSITION_OUTPUT_JSON_DISPLAY_REDACTION_ONLY`
  - `rawResultSafety.fixtureHasRawSecretSentinel=true`
  - `rawResultSafety.fixtureHasBearerSecret=true`
  - `rawResultSafety.fixtureHasApiKeySecret=true`
  - `rawResultSafety.fixtureHasJwtSecret=true`
  - `rawResultSafety.previewRedactionVisible=true`
  - `rawResultSafety.previewRawSecretsHidden=true`
  - `rawResultSafety.bodyRawSecretsHidden=true`
  - `rawResultSafety.markerContainsRawSecret=false`
  - `markdownExportSafety.scope=ISSUE_DECOMPOSITION_MARKDOWN_COPY_EXPORT_DISPLAY_REDACTION_ONLY`
  - `markdownExportSafety.copyMarkdownRedacted=true`
  - `markdownExportSafety.downloadMarkdownRedacted=true`
  - `markdownExportSafety.markerContainsRawSecret=false`
  - `accessibleSelection=true`
  - `nestedActionsDoNotHijackSelection=true`

非范围：

- 不测试新建 Issue 拆解表单完整提交流程。
- 不测试真实 LLM 拆解质量、后端任务生成算法、任务执行状态机或导出内容语义质量。
- 不声明后端 `outputJson` 存储、`exportMarkdown` 服务端返回、DB 存量、LLM/provider 原始输出、服务端授权审计或历史 payload 已完成治理。
- 不测试 AutoRepair patch 生成、真实 PR、GitHub App 或 webhook E2E。
- 不刷新 full release authority。

## P9 增量：Selectable table row shared pattern

目标：在多个高密度表格详情页完成可访问详情选择后，提炼共享行选择原语，降低后续页面遗漏 `Enter/Space`、`aria-selected`、`aria-controls`、嵌套操作隔离和焦点样式的风险。

Must：

- 新增共享 helper，统一生成表格行 `onClick`、`onKeyDown`、`tabIndex=0`、`aria-selected`、可选 `aria-controls` 和稳定 `aria-label`。
- 共享 helper 必须只响应 Enter / Space，Space 必须 `preventDefault()`，避免页面滚动。
- 共享 helper 必须忽略嵌套交互元素：`button`、`a`、`[role="button"]`、`[role="combobox"]`、`input`、`textarea`、`select`、`[contenteditable="true"]`、`.ant-select`、`.ant-select-selector` 和 `.ant-dropdown-trigger`。
- 新增 `.sl-selectable-table-card` CSS utility，统一 pointer、focus-visible 和 `[aria-selected='true']` 选中边界。
- 第一批只接入 `PrReviews` 与 `IssueDecomposition`，这两页必须继续保留各自业务选择副作用、详情 labelled region、稳定 label 文案、focused smoke marker 和页面级业务断言。
- `scripts/validate-frontend-ui.mjs` 必须锁定 helper 合同、PR/Issue helper 接入、CSS utility 和既有 smoke marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `cd web-console && npm run build` 通过。
- `CI=true make pr-reviews-detail-selection-ui-smoke` 通过。
- `CI=true make issue-decomposition-detail-selection-ui-smoke` 通过。
- 因本轮新增全局 CSS utility，`CI=true make app-shell-ui-smoke` 通过。

非范围：

- 本轮不迁移 `Artifacts`、`AuditLogs`、`ExecutionTasks`、`AgentTasks`、`CiDiagnostics` 或 `AutoRepairs`。
- 不抽象 Table、DetailPanel、Drawer、数据加载、副作用、分页、筛选、创建表单、下载、取消、导出、修复候选、审计跳转或业务信号卡。
- 不改变 smoke marker 名称或核心字段。
- 不刷新 full release authority，不测试真实 LLM、GitHub App、webhook、真实下载内容或 release/nightly evidence。

## P9 增量：CiDiagnostics shared selectable row adoption

目标：在 PR Reviews 与 IssueDecomposition 第一批接入共享行选择 helper 后，将同构的 CI Diagnostics 表格详情选择迁移到同一原语，继续收敛高密度详情表格的键盘、ARIA 和嵌套操作隔离合同。

Must：

- `CiDiagnostics` 必须使用 `createSelectableTableRowProps` 生成表格行选择 props，不再保留页面本地 `handleDiagnosticRowKeyDown`。
- CI 表格卡必须同时保留 `sl-ci-table-card` 并接入 `sl-selectable-table-card`。
- 表格行必须继续具备 click、Enter、Space 打开详情，`tabIndex=0`、`aria-selected`、稳定 `aria-label`，label 必须包含 `CiDiagnostic #id`。
- 表格行必须通过 `aria-controls` 连接到 CI 详情卡；详情卡必须具备稳定 id、`role="region"`、`aria-labelledby`，标题节点必须带对应 id。
- 工作流 link 和“重新分析”行内动作必须继续 `stopPropagation()`，不能劫持当前详情选择。
- CI 修复候选资格、AutoRepair URL、诊断质量、失败摘要、根因、相关文件、修复建议和原始日志展示不得被本轮 helper 迁移改变。
- `scripts/validate-frontend-ui.mjs` 必须锁定 CI helper adoption、拒绝本地 row keyboard handler、锁定 detail labelled region 和既有 marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `cd web-console && npm run build` 通过。
- `CI=true make ci-diagnostics-detail-selection-ui-smoke` 通过。
- 因本轮继续复用全局 `.sl-selectable-table-card`，`CI=true make app-shell-ui-smoke` 通过。

非范围：

- 不改 CI 诊断业务、真实 CI provider、webhook、LLM 诊断质量、AutoRepair patch 生成、真实 PR 或 GitHub App E2E。
- 不迁移 `Artifacts`、`AuditLogs`、`ExecutionTasks`、`AgentTasks` 或 `AutoRepairs`。
- 不抽象 Table、DetailPanel、数据加载、副作用、分页、筛选、创建表单或 AutoRepair 流程。
- 不改变 `CI_DIAGNOSTICS_DETAIL_SELECTION_SMOKE_OK` marker 名称或核心字段。
- 不刷新 full release authority。

## P9 增量：AuditLogs shared selectable row adoption

目标：在 AuditLogs 已具备三源详情选择能力后，将普通审计、Agent 工具调用和 GitHub Webhook Delivery 三张表的本地行键盘处理迁移到共享 selectable row helper，降低治理入口的键盘、ARIA 和嵌套操作隔离合同漂移。

Must：

- `AuditLogs` 必须使用 `createSelectableTableRowProps` 生成三张表的行选择 props，不再保留页面本地 `KeyboardEvent<HTMLElement>`、`isNestedInteractiveTarget` 或 `handle*RowKeyDown`。
- 三张表必须同时保留 `sl-audit-table-card` 并接入 `sl-selectable-table-card`。
- 普通审计表行必须继续具备 click、Enter、Space 打开审计事件 Drawer，稳定 label 必须包含 `AuditLog #id`。
- Agent tool call 表行必须继续具备 click、Enter、Space 打开工具调用 Drawer，稳定 label 必须包含 `AgentToolCall #id`。
- GitHub webhook delivery 表行必须继续具备 click、Enter、Space 打开 Delivery Drawer，稳定 label 必须包含 `GitHubWebhookDelivery #id`。
- 三源行必须继续暴露 `tabIndex=0`、`aria-selected` 和稳定 `aria-label`，并通过 `aria-controls` 连接对应 Drawer 内容 region。
- 三个 Drawer 内容必须分别具备稳定 id、`role="region"`、`aria-labelledby`，标题节点必须带对应 id。
- 审计动作、关联资源、工具名、对话跳转、扫描报告跳转、Delivery ID 等内层动作必须继续隔离冒泡，不能劫持当前详情选择。
- AuditLogs API 查询、筛选、分页、source health、治理信号、资源跳转、对话跳转、扫描报告跳转和 GitHub Webhook Delivery 展示不得被本轮 helper 迁移改变。
- `scripts/validate-frontend-ui.mjs` 必须锁定 AuditLogs helper adoption、拒绝本地 row keyboard handler、锁定三源 labelled region 和 smoke marker。
- `AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK` marker 必须继续保留，并证明三源 `sharedSelectableRow.ariaControlsLinked=true`、`sharedSelectableRow.detailRegionLinked=true` 和被选中 ID。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make audit-logs-detail-selection-ui-smoke` 通过。

非范围：

- 不改后端审计完整性、GitHub App、webhook 真实处理、真实审计数据质量、release evidence 或生产 drill。
- 不迁移 `AutoRepairs` 或其他页面。
- 不抽象 Table、Drawer、数据加载、副作用、筛选、分页、三源业务模型、resource path 或深链参数。
- 不改变 `AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK` marker 名称。
- 不刷新 full release authority。

## P9 增量：Artifacts shared selectable row adoption

目标：在 Artifacts 已具备详情、预览、下载和键盘可访问选择后，将页面本地行键盘处理迁移到共享 selectable row helper，降低产物证据中心的键盘、ARIA 和嵌套操作隔离合同漂移。

Must：

- `Artifacts` 必须使用 `createSelectableTableRowProps` 生成表格行选择 props，不再保留页面本地 `handleRowKeyDown` 或 `KeyboardEvent<HTMLElement>`。
- Artifacts 表格卡必须同时保留 `sl-artifact-table-card` 并接入 `sl-selectable-table-card`。
- 表格行必须继续具备 click、Enter、Space 打开详情，`tabIndex=0`、`aria-selected`、稳定 `aria-label`，label 必须包含 `Artifact #id` 和产物类型标签。
- 表格行必须通过 `aria-controls` 连接到 Artifact 详情 Drawer 内容 region；详情内容必须具备稳定 id、`role="region"`、`aria-labelledby`，标题节点必须带对应 id。
- 详情、打开来源、预览、下载按钮必须继续隔离冒泡，不能劫持当前详情选择。
- 预览按钮必须继续只加载目标 artifact preview；不可预览产物的预览按钮保持 disabled；下载按钮不得打开或切换 Drawer。
- Artifacts 必须具备三视口可读性守护：`1440x900`、`390x844`、`320x740` 下 Drawer 打开态必须处于 viewport 内，SHA-256、artifact type、content type、owner、智能预览、tabs 和 raw JSON 展开必须可读且不造成页面级横向溢出。
- Artifacts 表格横向滚动必须由 `.sl-artifact-table-card .ant-table-content` 承担；页面级 document 不得出现不可控横向溢出。
- 360px 以下 Artifacts cockpit status、evidence chip、readiness metric、bundle/type chip 必须优先完整可读，不得用强制 `nowrap` 或 ellipsis 隐藏关键 owner/type/status。
- Artifact 下载 API、文件名、blob 语义、来源跳转、筛选、证据统计、preview renderer 和 Drawer 内容不得被本轮 helper 迁移改变。
- `scripts/validate-frontend-ui.mjs` 必须锁定 Artifacts helper adoption、拒绝本地 row keyboard handler、锁定 detail labelled region、三视口 readability helper、CSS wrapping/scroller 合同和 smoke marker。
- `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK` marker 必须继续保留，并证明 `sharedSelectableRow.ariaControlsLinked=true`、`sharedSelectableRow.detailRegionLinked=true` 和被选中 artifact ID。
- `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK` marker 还必须证明：`layoutDensity.mobile390Covered=true`、`layoutDensity.drawerContained=true`、`layoutDensity.tableScrollerContained=true`、`mobileReadability.criticalFieldsWrap=true`、`drawerReadability.rawJsonDefaultCollapsed=true`、`tableScroller.overflowXAuto=true`、`previewReadability.rawJsonExpandable=true`、`runtimeIssues=0`、`noHorizontalOverflow=true`。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make artifacts-detail-selection-ui-smoke` 通过。
- `CI=true make p9-main-path-recoverable-error-states-batch3-ui-smoke` 通过，证明 Artifacts 可恢复错误态未被本轮 Drawer/readability CSS 破坏。
- `CI=true make artifacts-detail-selection-ui-smoke` 通过。

非范围：

- 不改后端 artifact API、真实下载内容、blob 文件名解析、artifact store、扫描产物生成逻辑或 release evidence。
- 不迁移 `AuditLogs`、`AutoRepairs` 或其他页面。
- 不抽象 Table、Drawer、ArtifactPreviewRenderer、数据加载、副作用、筛选、下载、来源跳转或 preview 内容。
- 不改变 `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK` marker 名称。
- 不刷新 full release authority。

## P9 增量：ExecutionTasks Three-Viewport Detail Readability Guard

目标：在 ExecutionTasks 已接入 shared selectable row helper 后，补齐任务详情可信度和三视口可读性防回归。执行任务中心是异步流水线总控页，用户必须能在桌面、390px 手机和 320px 窄屏下稳定读到任务、来源、状态、当前步骤、证据、步骤时间线和日志；快速切换任务时不能展示旧任务的 steps/logs/evidence。

Must：

- `ExecutionTasks.tsx` 必须具备 detail stale guard：切换任务时立即清空旧 detail，并用 request sequence 阻止旧响应覆盖当前选中任务。
- 详情证据、attempts、steps 和 logs 必须只在 `detail.task.id === selected.id` 时渲染；新任务标题下不得短暂展示旧任务日志或步骤。
- ExecutionTasks 表格卡必须保持 `sl-execution-table-card sl-selectable-table-card`，表格横向滚动必须由 `.sl-execution-table-card .ant-table-content` 承担，页面级不得出现失控横向溢出。
- ExecutionTasks 详情卡、标题、Tag、meta/evidence/health、next action、timeline description/error 和 log 长 token 必须在 `390x844` 与 `320x740` 下可读，不能依赖 `nowrap + ellipsis` 裁切关键步骤、错误、证据或日志。
- `execution-tasks-detail-selection-smoke.spec.ts` 必须覆盖 `1440x900`、`390x844`、`320x740` 三视口，并使用长 `currentStep`、timeline summary 和 log message 压测可读性。
- smoke 必须新增 `expectExecutionTableScrollerContained` 和 `assertExecutionDetailReadability`，断言 detail card contained、table scroller contained、critical text wrapping、timeline readable、log readable 和页面无横向溢出。
- `EXECUTION_TASKS_DETAIL_SELECTION_SMOKE_OK` marker 必须保留，并新增 `layoutDensity.mobile390Covered=true`、`layoutDensity.narrow320Covered=true`、`layoutDensity.detailCardContained=true`、`layoutDensity.tableScrollerContained=true`、`mobileReadability.criticalTextsWrap=true`、`mobileReadability.timelineReadable=true`、`mobileReadability.logReadable=true`、`tableScroller.overflowXAuto=true`、`runtimeIssues=0`、`noHorizontalOverflow=true`。
- `scripts/validate-frontend-ui.mjs` 必须锁住 detail stale guard、ExecutionTasks table/detail CSS、三视口 matrix、readability helper 和 marker proof。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make execution-tasks-detail-selection-ui-smoke` 通过。
- `CI=true make p9-main-path-recoverable-error-states-batch3-ui-smoke` 通过。

非范围：

- 不改 ExecutionTask 后端 API、调度器、Attempt、Step、Log、取消语义、来源跳转、产物链接、分页、筛选、自动刷新、LLM、GitHub App、webhook、真实 PR 或真实执行质量。
- 不迁移 `AutoRepairs`、`AgentTasks`、`AuditLogs` 或其他页面。
- 不抽象 Table、DetailPanel、TaskTimeline、LogViewer、数据加载、副作用、分页、筛选、取消、产物或来源跳转。
- 不改变 `EXECUTION_TASKS_DETAIL_SELECTION_SMOKE_OK` marker 名称。
- 不刷新 full release authority。

## P9 增量：ExecutionTasks shared selectable row adoption

目标：在 ExecutionTasks 已具备显式详情入口和键盘可访问选择后，将页面本地行键盘处理迁移到共享 selectable row helper，降低任务流水线页面的键盘、ARIA 和嵌套操作隔离合同漂移。

Must：

- `ExecutionTasks` 必须使用 `createSelectableTableRowProps` 生成表格行选择 props，不再保留页面本地 `handleRowKeyDown` 或 `KeyboardEvent<HTMLElement>`。
- ExecutionTasks 表格卡必须同时保留 `sl-execution-table-card` 并接入 `sl-selectable-table-card`。
- 表格行必须继续具备 click、Enter、Space 打开详情，`tabIndex=0`、`aria-selected`、稳定 `aria-label`，label 必须包含 `ExecutionTask #id`。
- 表格行必须通过 `aria-controls` 连接到 ExecutionTask 详情卡；详情卡必须具备稳定 id、`role="region"`、`aria-labelledby`，标题节点必须带对应 id。
- 标题、来源、产物、取消和详情按钮必须继续隔离冒泡，不能劫持当前详情选择。
- ExecutionTask API、任务状态机、取消、来源、产物、分页、筛选、自动刷新、TaskTimeline 和 LogViewer 不得被本轮 helper 迁移改变。
- `scripts/validate-frontend-ui.mjs` 必须锁定 ExecutionTasks helper adoption、拒绝本地 row keyboard handler、锁定 detail labelled region 和 smoke marker。
- `EXECUTION_TASKS_DETAIL_SELECTION_SMOKE_OK` marker 必须继续保留，并证明 `sharedSelectableRow.ariaControlsLinked=true`、`sharedSelectableRow.detailRegionLinked=true` 和被选中行 ID。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make execution-tasks-detail-selection-ui-smoke` 通过。

非范围：

- 不改 ExecutionTask 后端 API、调度器、Attempt、Step、Log、LLM、GitHub App、webhook、真实 PR 或真实执行质量。
- 不迁移 `Artifacts`、`AuditLogs`、`AutoRepairs` 或其他页面。
- 不抽象 Table、DetailPanel、TaskTimeline、LogViewer、数据加载、副作用、分页、筛选、取消、产物或来源跳转。
- 不改变 `EXECUTION_TASKS_DETAIL_SELECTION_SMOKE_OK` marker 名称。
- 不刷新 full release authority。

## P9 增量：AgentTasks shared selectable row adoption

目标：在 AgentTasks 已具备可访问详情选择能力后，将页面本地行键盘处理迁移到共享 selectable row helper，继续收敛 Agent 任务页与 PR/Issue/CI 详情表格的键盘、ARIA 和嵌套操作隔离合同。

Must：

- `AgentTasks` 必须使用 `createSelectableTableRowProps` 生成表格行选择 props，不再保留页面本地 `handleRowKeyDown` 或 `KeyboardEvent<HTMLElement>`。
- AgentTasks 表格卡必须同时保留 `sl-agent-table-card` 并接入 `sl-selectable-table-card`。
- 表格行必须继续具备 click、Enter、Space 打开详情，`tabIndex=0`、`aria-selected`、稳定 `aria-label`，label 必须包含 `AgentTask #id`。
- 表格行必须通过 `aria-controls` 连接到 AgentTask 详情卡；详情卡必须具备稳定 id、`role="region"`、`aria-labelledby`，标题节点必须带对应 id。
- 标题、扫描报告链接、打开对话、查看产物、启动、取消和详情按钮必须继续隔离冒泡，不能劫持当前详情选择。
- AgentTask 创建弹窗、openCreate URL 预填、任务状态更新、steps 加载、TaskTimeline、health card、扫描报告跳转、对话跳转和 artifact 入口不得被本轮 helper 迁移改变。
- `scripts/validate-frontend-ui.mjs` 必须锁定 AgentTasks helper adoption、拒绝本地 row keyboard handler、锁定 detail labelled region、嵌套操作隔离和既有 marker。
- `AGENT_TASKS_DETAIL_SELECTION_SMOKE_OK` marker 必须继续保留，并证明 `sharedSelectableRow.ariaControlsLinked=true`、`sharedSelectableRow.detailRegionLinked=true` 和被选中行 ID。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make agent-tasks-detail-selection-ui-smoke` 通过。

非范围：

- 不改 AgentTask 后端 API、任务状态机、steps 语义、LLM/provider、GitHub App、webhook、真实 PR 或真实 Agent 分析质量。
- 不迁移 `Artifacts`、`AuditLogs`、`ExecutionTasks` 或 `AutoRepairs`。
- 不抽象 Table、DetailPanel、Tabs、TaskTimeline、数据加载、副作用、分页、筛选、创建表单、产物、扫描报告或对话跳转。
- 不改变 `AGENT_TASKS_DETAIL_SELECTION_SMOKE_OK` marker 名称。
- 不刷新 full release authority。

## P9 增量：AutoRepairs shared selectable row adoption

目标：在不触碰 PATCH_READY、PR gate、submit-pr、patch artifact、审计证据和 release 语义的前提下，将 AutoRepairs 表格行选择从页面本地键盘处理迁移到共享 selectable row helper，继续收敛全站高密度表格的键盘、ARIA、详情区域关联和嵌套操作隔离合同。

Must：

- `AutoRepairs` 必须使用 `createSelectableTableRowProps` 生成表格行选择 props，不再保留页面本地 `handleRowKeyDown` 或 `KeyboardEvent<HTMLElement>`。
- AutoRepairs 表格卡必须同时保留 `sl-autorepair-table-card` 并接入 `sl-selectable-table-card`。
- 表格行必须继续具备 click、Enter、Space 打开详情，`tabIndex=0`、`aria-selected`、稳定 `aria-label`，label 必须包含 `AutoRepair #id`。
- 表格行必须通过 `aria-controls` 连接到 AutoRepair 详情卡；详情卡必须具备稳定 id、`role="region"`、`aria-labelledby`，标题节点必须带对应 id。
- 显式“详情”按钮必须继续可见可达，并继续使用 `event.stopPropagation()`，不能被行选择 helper 吃掉。
- 文件路径、来源扫描、ArtifactLinkButton、取消任务、打开 PR、创建 PR Popconfirm、打开审计、打开执行任务和返回关联资源必须继续隔离冒泡，不能误触发行选择。
- `patchReadyReviewGate`、`handleSubmitPr`、`AUTO_REPAIR_PATCH_READY SUCCESS` audit evidence、`generate_patch SUCCESS` patch evidence、manual candidate scanTask warning-only、blocked repair disabled submit-pr 和 Popconfirm cancel 后 `submitPrCount=0` 的合同不得改变。
- `scripts/validate-frontend-ui.mjs` 必须锁定 AutoRepairs helper adoption、拒绝本地 row keyboard handler、锁定 detail labelled region、显式详情按钮、PATCH_READY marker、review gate 和 attemptSplit 证据。
- `PATCH_READY_UI_SMOKE_OK` marker 必须继续保留，并新增 `sharedSelectableRow.ariaControlsLinked=true`、`sharedSelectableRow.detailRegionLinked=true` 和被选中 AutoRepair ID。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make patch-ready-ui-smoke` 通过，且 marker 覆盖桌面与 320px 窄屏、Enter/Space、detail region 链接、PR gate、attemptSplit、mock-only API 和 `submitPrCount=0`。
- Goodall-agent/Halley final QA Gate 通过后，本增量才可记为 DONE。

非范围：

- 不改后端 API、AutoRepair 状态机、PR 创建服务、patch generation、execution attempt、audit 写入、Artifact 存储、GitHub App、webhook 或真实 PR E2E。
- 不刷新 full release authority。
- 不迁移其他页面。
- 不改变 `PATCH_READY_UI_SMOKE_OK` marker 名称。

## P12-pre 生产化收口

目标：在不提前引入 Neo4j、Temporal、pgvector 等新复杂度的前提下，把当前单体产品主线打磨到可持续开发、可演示、可验收。

Must：

- `make verify` 必须恢复通过。
- `make worktree-inventory` 能清楚按模块分组当前大规模改动。
- 公开仓库主链路稳定：clone、scan、artifact、code_chunks、report、QA、AutoRepair candidate、audit。
- 所有安全、依赖、LLM safety、frontend UI 门禁纳入本地和 CI。
- 普通 PR/push CI 必须运行低权限 Release Evidence CI profile gate：生成 `ci` profile 证据包、运行 `verify-release-evidence`、断言 manifest profile/source/include 和 summary fail/warn 为 0，并上传短期 evidence artifact；该 gate 不得读取 secrets、不得运行 `release`/`nightly` profile、不得配置真实 smoke 或生产环境输入。
- `release` / `nightly` profile 运行写入型 smoke 前必须有目标环境边界：本地 loopback 可直接运行，非本地 `SOURCELENS_BASE_URL` 必须设置 `SOURCELENS_RELEASE_EVIDENCE_TARGET_ENV=staging|prod`，生产目标还必须设置 `SOURCELENS_RELEASE_EVIDENCE_ALLOW_MUTATING_PROD=true` 且只能使用专用 smoke tenant。
- `release` / `nightly` profile 必须强制 public repo smoke cleanup 为 true，并且 GitHub App / webhook drill 在非 local profile 中必须显式 `SOURCELENS_RELEASE_EVIDENCE_ALLOW_EXTERNAL_DRILLS=true` 才能触达外部系统。
- 每轮开发更新 `PRODUCT_PROGRESS_LOG.md`。

验收：

- `make verify` 通过。
- 至少一次真实公开仓库 smoke 通过。当前 full authority 证据：`LJunP/Pawnshop-Management-System.git`，`projectId=313`、`repositoryId=274`、`scanTaskId=232`，7 artifacts、17,001 code_chunks、15,356 graph nodes、Code QA 8 条证据。
- release evidence 必须能生成并被校验；当前 P12-pre current full release authority 为 `release-evidence/release-current-schema-20260704-1618`。该包使用完整 `release` profile，覆盖 `make verify`、prod/backup/rollback preflight、真实 public repo smoke、真实 public repo UI、file-bound repair、AutoRepair patch、PATCH_READY mocked UI、Dashboard next action mocked UI、report evidence drawer、scan governance timeline、AgentChat audit/tool audit、audit workbench、phase12 baseline 和 sandbox drill，并通过 `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260704-1618`；结果 `required_failures=0`、`optional_warnings=0`、`skipped=5`。它已吸收 source-location probe v4 exact first-result proof、report evidence QA citation manifest fail-closed、report evidence QA citation narrative binding、report evidence drawer 当前 smoke fixture 和 AutoRepair patch 当前 backend smoke fixture。上一轮 full 包 `release-evidence/release-current-schema-20260702-230650` 已降级为 historical evidence，并且在最新 verifier 下因缺少 `public_repo_report_evidence_qa_citation_manifest_present=true` 不得替代当前 full release 证据。旧 full 包 `release-evidence/20260702-191044`、`release-evidence/p6-full-release-refresh-20260702-0845`、`release-evidence/release-post-unverified-qa-citation-authority-20260701-135235`、`release-evidence/release-p12pre-full-authority-20260701-024042`、`release-evidence/release-post-qa-citation-verifier-20260701-073909`、`release-evidence/release-post-patch-ready-schema-20260701-053701`、`release-evidence/release-post-autorepair-detail-action-20260701-004333` 和 `release-evidence/release-post-governance-stage-rail-20260701-000851` 均只保留为历史门禁证据，不能替代当前 full release 证据。轻量框架证据 `release-evidence/p6-evidence-framework-ci-20260702-155117` 只证明 profile schema、manifest、status 和 checksum 框架健康，不能替代完整 `release` authority。
- P12-pre local nightly/full release 在生产签署前必须至少有一份真实 backup restore drill evidence 和 rollback plan 归档证据。当前 full authority 中 `backup-restore-drill-evidence` 与 `rollback-plan` 因未配置对应归档文件而 SKIP；这不阻塞当前公开仓库分析主线，但阻塞“生产灾备/回滚治理完整闭环”口径。历史包曾使用 backup id `p6-20260702080733` 完成 restore drill，可作为脚本能力历史证据但不能替代当前 authority。恢复演练脚本必须支持合法长 `backup_id`，scratch database 名使用短 hash 派生且不得超过 MySQL 64 字符 identifier 上限；`verify-release-evidence` 必须阻断 `OK backup-restore-drill-evidence` / `OK rollback-plan` 仍指向 `.log` 的假阳性，OK 状态只能引用对应 `.txt` 归档证据。
- `.github/workflows/ci.yml` 必须包含 `release-evidence-ci` job，且 `./scripts/security-regression-check.sh` 必须能阻断普通 CI 使用 `release`/`nightly` profile、仓库 secrets、真实 env 输入、job-level 权限提升或 checkout 持久化凭据。
- release evidence 标准 step 至少覆盖 smoke、`public-repo-smoke` 公开仓库主链路、file-bound repair smoke、AutoRepair patch readiness smoke、PATCH_READY mocked browser UI smoke、Dashboard next action mocked browser UI smoke、report evidence drawer mocked browser UI smoke、scan governance timeline mocked browser UI smoke、AgentChat audit mocked browser UI smoke、Audit workbench smoke、phase12 baseline、sandbox/GitHub/LLM 可选演练；`public-repo-smoke` 不以 GitHub App 高级集成层为前置阻塞。
- LLM provider run 必须具备可复现生成器和发布归档合同：`make llm-provider-eval` 生成 schema-valid provider run JSON 与 14 个 raw artifacts，API key 不落盘，失败 case 以 exit code `2` 阻断通过口径；`make llm-provider-eval-mock-smoke` 必须用本地 OpenAI-compatible mock provider 覆盖 14 case 全 pass 成功路径、validator 接受、raw artifacts 路径和权限、secret 不落盘；`llm-safety-regression` 和 `security-regression-check` 必须覆盖生成器语法、mock success smoke、artifact 路径、secret 边界和 release evidence 绑定。
- `verify-release-evidence` 必须对 `release` / `nightly` profile 强制要求 `public_repo_smoke_ui` manifest 字段存在且为 true，旧 focused evidence package 不能冒充完整发布候选。
- 审计治理 workbench 至少用 `make audit-workbench-smoke` 验证通用审计、Agent 工具调用和 GitHub Webhook Delivery 三类项目内数据源不会 500 且返回标准分页结构；dev/test profile 下还必须生成真实审计日志、失败 Agent 工具调用和 GitHub webhook delivery 样本并验证可查询。

量化指标：

- 必过门禁失败数：0。
- 当前未分类 worktree 文件：0 或有明确分组说明。
- 主链路阻塞级缺陷：0。

## P9 增量：Report Evidence QA unverified citation state

目标：在报告证据抽屉进入 Code QA 的链路中，除了证明成功引用态，也必须证明回答无法直接引用证据时前端能以治理语义展示“需复核/候选证据”，避免用户把未验证回答误认为已被证据支持。

Must：

- `report-evidence-qa-citation-ui-smoke` 必须同时覆盖 verified citation 与 unverified citation 两条 QA from evidence 路径。
- verified 路径必须继续证明 `groundingStatus=VERIFIED`、`citationEnforcementStatus=DIRECT_VERIFIED`、`citedByAnswer=true`、证据文件可见、`scanTaskId` 和 `evidenceRef.filePath` 请求绑定。
- unverified 路径必须模拟 `groundingStatus=PARTIAL`、`citationEnforcementStatus=RETRY_FAILED`、至少一个 `citedByAnswer=false` citation，并证明 UI 可见 `引用需复核`、`引用需人工复核` 和 `候选证据`。
- unverified 路径不得丢失证据上下文；请求 payload 必须继续绑定 `scanTaskId`、`evidenceRef.scanTaskId` 和 `evidenceRef.filePath`。
- 桌面与 320px 窄屏必须继续通过横向溢出检查。
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` marker 必须包含 verified 与 `unverifiedCitation` 两组状态、citation 数量、未引用候选数、mock-only 边界和 QA request 数；该合同已由当前 full authority `release-evidence/release-current-schema-20260704-1618` 覆盖，后续不得再用旧 `fullReleaseAuthorityRefreshed=false` focused 口径代表当前状态。
- `scripts/validate-frontend-ui.mjs` 必须静态锁住 unverified mock 分支、visible UI 文案、`PARTIAL/RETRY_FAILED` 合同、`citedByAnswer=false` 和 marker schema。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true make report-evidence-qa-citation-ui-smoke` 通过。
- `npm --prefix web-console run build` 通过。
- `cd backend-spring && mvn -q -Dtest=com.sourcelens.CodeQaControllerTest test` 通过。
- `git diff --check -- web-console/tests/report-evidence-drawer-smoke.spec.ts scripts/validate-frontend-ui.mjs` 通过。
- Goodall-agent/FE-Pixel 前端复核至少 `PASS_WITH_NOTES`，且无阻塞问题。

非范围：

- 不证明真实 LLM 一定会生成 `RETRY_FAILED`；本轮只证明前端接到该后端合同后的产品呈现和证据绑定。
- 不改 Code QA 后端判定逻辑、检索排序、LLM provider、报告生成、code_chunks schema 或 Agent 自动修复。
- 不刷新 full release authority；下一份完整 release/nightly 证据必须重新跑完整 profile 才能声明当前权威包。
- 不替代未来真实后端生成 `RETRY_FAILED` 的 E2E。

## P9 增量：Main path recoverable error states batch 1

目标：把主链路高频页面的查询类失败从 toast-only 升级为页面内可见、可重试、可审计的产品状态，避免用户把“接口失败”误判为“暂无数据”。

Must：

- 第一批范围限定为 `AgentTasks`、`PrReviews`、`CiDiagnostics`。
- 查询类失败必须保留 `showApiError` toast，同时用 `formatApiError` 写入页面内 error state。
- 列表加载失败必须在主表格 `emptyText` 或表格上方显示 `StateBlock tone="error"`，并提供 `ActionButton` retry。
- `AgentTasks` steps 加载失败必须在详情 tabs 内显示 `执行步骤加载失败` + retry，不得落入空 timeline。
- `PrReviews` comments 加载失败必须在行级评论 section 内显示 `行级评论加载失败` + retry，不得显示为“暂无行级评论”。
- `CiDiagnostics` 列表加载失败必须显示 `CI 诊断加载失败` + retry。
- 创建、启动、取消、重新分析等用户动作失败仍按动作错误处理，保持 `showApiError`，不混入页面查询失败态。
- `scripts/validate-frontend-ui.mjs` 必须静态锁住三页 `formatApiError`、`StateBlock tone="error"`、retry `ActionButton` 和详情错误态。
- 既有 shared selectable row、detail region、键盘 Enter/Space、嵌套操作隔离、AutoRepair candidate readiness 和 320px viewport smoke 不得回退。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make agent-tasks-detail-selection-ui-smoke` 通过。
- `CI=true make pr-reviews-detail-selection-ui-smoke` 通过。
- `CI=true make ci-diagnostics-detail-selection-ui-smoke` 通过。
- `git diff --check -- web-console/src/pages/AgentTasks.tsx web-console/src/pages/PrReviews.tsx web-console/src/pages/CiDiagnostics.tsx scripts/validate-frontend-ui.mjs` 通过。

非范围：

- 不改 API、后端查询语义、分页协议、任务状态机、PR/CI 分析逻辑、AutoRepair 创建逻辑或 release evidence profile。
- 不覆盖 `AgentChat`、`AutoRepairs`、`Artifacts`、`AuditLogs` 等剩余页面；它们进入后续批次。
- 不新增全局 error boundary 或大型数据加载抽象；本轮只做页面内最小可恢复错误态。

## P9 增量：Main path recoverable error states batch 2

目标：继续收口 AgentChat 与 AutoRepairs 两条更靠近 Agent/自动修复主线的查询失败态，确保会话、闭环任务、修复任务、仓库、执行证据和 PATCH_READY 审计证据失败时都能页面内可见且可重试。

Must：

- `AgentChat` 必须覆盖项目列表、会话列表、当前会话消息、Agent 任务闭环四类查询失败。
- `AgentChat` 查询失败必须保留 `showApiError`，同时使用 `formatApiError` 写入 `projectListError`、`conversationListError`、`messagesError`、`closureTaskError`。
- `AgentChat` 会话列表失败不得显示为“暂无对话”；消息加载失败不得显示为“发送第一条问题”；无 `agentTaskId` 的正常会话不得误显示闭环错误。
- `AutoRepairs` 必须覆盖任务列表、仓库列表、执行证据、PATCH_READY 审计证据四类查询失败。
- `AutoRepairs` PATCH_READY 审计证据失败必须保持 PR gate fail-closed，不允许因为请求失败绕过 `AUTO_REPAIR_PATCH_READY SUCCESS`。
- `AutoRepairs` 仓库列表失败必须在创建流程内可见并可重试。
- `scripts/validate-frontend-ui.mjs` 必须静态锁住 AgentChat/AutoRepairs 的 `formatApiError`、页面错误态和 retry action。
- 既有 AgentChat closure rail、tool audit deep link、PATCH_READY review gate、attemptSplit、report-to-AutoRepair candidate payload binding 和 320px viewport smoke 不得回退。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make agent-chat-closure-rail-ui-smoke` 通过。
- `CI=true make agent-chat-audit-ui-smoke` 通过。
- `CI=true make patch-ready-ui-smoke` 通过。
- `CI=true make report-autorepair-candidate-ui-smoke` 通过。
- `git diff --check -- web-console/src/pages/AgentChat.tsx web-console/src/pages/AutoRepairs.tsx scripts/validate-frontend-ui.mjs` 通过。

非范围：

- 不改 AgentChat SSE、消息发送、删除会话、AutoRepair 创建/取消/submit-pr 后端动作语义。
- 不新增 API 500 browser screenshot 专项；本轮用静态门禁证明错误态存在，用既有 smoke 证明正常主链路未回退。
- 不刷新 full release authority。

## P9 增量：Main path recoverable error states batch 3

目标：继续把项目入口、执行任务中心和运行产物库的查询失败态产品化，避免用户把后端/网络失败误判为项目、任务或产物不存在。

Must：

- 第三批范围限定为 `Projects.tsx`、`ExecutionTasks.tsx`、`Artifacts.tsx`。
- `Projects` 项目列表加载失败必须使用 `formatApiError` 写入 `projectListError`，保留 `showApiError` toast，并显示 `StateBlock tone="error"` + `重新加载项目`；已有数据后刷新失败必须显示 `项目刷新失败，已保留上次成功数据`，且不得清空旧项目表格。
- `ExecutionTasks` 必须分别维护列表错误 `listError` 和详情错误 `detailError`；列表失败显示 `执行任务加载失败`，详情失败显示 `任务详情加载失败`，均提供 `重新加载任务`。
- `Artifacts` 运行产物列表失败必须显示 `运行产物加载失败`，有缓存数据时显示 `产物刷新失败，已保留上次成功数据`；智能预览失败必须显示 `智能预览加载失败` + `重新加载预览`。
- 三页查询失败必须保留已成功加载的数据语义；刷新失败不得清空旧数据后误导为“暂无”。
- `scripts/validate-frontend-ui.mjs` 必须静态锁住三页 `formatApiError`、`StateBlock tone="error"`、明确 retry label、npm/make smoke 入口和 smoke marker。
- `p9-main-path-recoverable-error-states-batch3-ui-smoke` 必须全 API mock、覆盖 `1440x900` 和 `320x740`、证明首轮连续 500 进入页面错误态、点击 retry 后恢复成功路径，额外证明 `Projects` 已有表格数据后刷新失败会保留旧数据，且 `unhandledApiRequests=0`。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true make p9-main-path-recoverable-error-states-batch3-ui-smoke` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make execution-tasks-detail-selection-ui-smoke` 通过。
- `CI=true make artifacts-detail-selection-ui-smoke` 通过。
- `CI=true make app-shell-ui-smoke` 通过。
- `git diff --check -- web-console/src/pages/Projects.tsx web-console/src/pages/ExecutionTasks.tsx web-console/src/pages/Artifacts.tsx web-console/tests/p9-main-path-recoverable-error-states-batch3.spec.ts web-console/playwright.p9-main-path-recoverable-error-states-batch3.config.ts scripts/validate-frontend-ui.mjs docs/PHASE_REQUIREMENTS.md docs/PRODUCT_PROGRESS_LOG.md docs/AGENT_STATUS_BOARD.md docs/AGENT_ACTIVITY_LOG.md docs/CODEX_HANDOFF.md Makefile web-console/package.json` 通过。

非范围：

- 不宣称全站 recoverable error state 已完成。
- 不覆盖 `Dashboard`、`ProjectDetail`、`ScanTaskDetail`、`DependencyGraph` 的复杂错误态。
- 不改变任务状态机、产物下载语义、项目创建/删除、任务取消或后端查询协议。
- 不刷新或替代 current full authority；`release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 现在仅作为 historical full package。

## P9 增量：Main path recoverable error states batch 4A

目标：继续收口深层主链路页面的查询失败态，把仪表盘、项目工作台和扫描报告中的关键数据源失败变成页面内可恢复状态，避免用户误判为无数据或报告不可用。

Must：

- 第四批拆为 4A / 4B：4A 只覆盖 `Dashboard.tsx`、`ProjectDetail.tsx`、`ScanTaskDetail.tsx`；`DependencyGraph.tsx` 后置到 4B，先补图谱 retry action 后再进入 recoverable smoke。
- `Dashboard` 数据加载失败必须显示 `仪表盘数据加载失败` + `重试加载`；已有统计或最近扫描后刷新失败必须显示 `仪表盘刷新失败，已保留上次成功数据`，不得清空旧控制台状态。
- `ProjectDetail` 项目详情失败必须提供 `重新加载项目`；仓库列表失败必须提供 `重新加载仓库`，扫描任务失败必须提供 `重新加载扫描任务`，项目总览失败必须提供 `重新加载总览`。
- `ProjectDetail` 仓库列表和扫描任务刷新失败不得清空已成功加载的数据；空态不得误导为“暂无仓库”或“暂无扫描任务”。
- `ScanTaskDetail` 顶层扫描报告加载失败必须显示 `扫描报告加载失败` + `重新加载扫描报告`；局部 `code_chunks` 状态失败必须显示局部错误并提供 `重新读取 code_chunks`；修复治理时间线失败必须显示局部错误并提供 `重新加载治理时间线`。
- `ScanTaskDetail` 局部失败不得清空主扫描报告、执行详情、产物或已成功加载的治理数据。
- 新增 `p9-main-path-recoverable-error-states-batch4a-ui-smoke`，必须全 API mock、覆盖 `1440x900` 和 `320x740`、证明 Dashboard / ProjectDetail / ScanTaskDetail 的失败态、retry 恢复、`unhandledApiRequests=0` 和无整体横向溢出。
- `scripts/validate-frontend-ui.mjs` 必须静态锁住 batch 4A 页面合同、npm/make smoke 入口、Playwright config 独立端口和 marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true make p9-main-path-recoverable-error-states-batch4a-ui-smoke` 通过。
- `npm --prefix web-console run build` 通过。
- `git diff --check -- web-console/src/pages/Dashboard.tsx web-console/src/pages/ProjectDetail.tsx web-console/src/pages/ScanTaskDetail.tsx web-console/tests/p9-main-path-recoverable-error-states-batch4a.spec.ts web-console/playwright.p9-main-path-recoverable-error-states-batch4a.config.ts scripts/validate-frontend-ui.mjs docs/PHASE_REQUIREMENTS.md docs/PRODUCT_PROGRESS_LOG.md docs/AGENT_STATUS_BOARD.md docs/AGENT_ACTIVITY_LOG.md docs/CODEX_HANDOFF.md Makefile web-console/package.json` 通过。

非范围：

- 不覆盖 `DependencyGraph` 可恢复 retry；该项进入 batch 4B。
- 不改后端 API、任务状态机、扫描创建/取消、仓库增删、产物下载、图谱布局算法或全局 axios retry 策略。
- 不刷新或替代 current full authority；`release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 现在仅作为 historical full package。

## P9 增量：Main path recoverable error states batch 4B

目标：关闭 batch 4A 后置的 `DependencyGraph` 可恢复错误态缺口，让依赖图谱 API 失败后可以在图谱组件内直接重试恢复。

Must：

- `DependencyGraph.tsx` 的 `analysisApi.getGraph(scanTaskId)` 失败必须使用 `formatApiError(error, '加载依赖图谱失败')`。
- 图谱失败态必须显示 `StateBlock tone="error"`、标题 `依赖图谱加载失败`、后端错误文案和 `重新加载图谱`。
- `重新加载图谱` 只能重打当前 `scanTaskId` 的 `/scan-tasks/:id/graph`，不得刷新整页、不得跳转、不得扩大到后端协议或图谱布局算法。
- 重试成功后必须恢复 `依赖图谱与架构洞察`、符号节点、依赖关系和节点信息。
- 新增 `p9-main-path-recoverable-error-states-batch4b-ui-smoke`，必须全 API mock、覆盖 `1440x900` 和 `320x740`、证明 `/scan-tasks/:id/graph` 首轮连续 500 后进入页面错误态、点击 retry 后恢复，且 `unhandledApiRequests=0`。
- `scripts/validate-frontend-ui.mjs` 必须静态锁住 `DependencyGraph` retry 合同、npm/make smoke 入口、Playwright config 独立端口和 marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true make p9-main-path-recoverable-error-states-batch4b-ui-smoke` 通过。
- `npm --prefix web-console run build` 通过。
- `git diff --check -- web-console/src/pages/DependencyGraph.tsx web-console/tests/p9-main-path-recoverable-error-states-batch4b.spec.ts web-console/playwright.p9-main-path-recoverable-error-states-batch4b.config.ts scripts/validate-frontend-ui.mjs docs/PHASE_REQUIREMENTS.md docs/PRODUCT_PROGRESS_LOG.md docs/AGENT_STATUS_BOARD.md docs/AGENT_ACTIVITY_LOG.md docs/CODEX_HANDOFF.md Makefile web-console/package.json` 通过。

非范围：

- 不改后端 Graph API、图谱数据结构、图谱布局算法、Mermaid 导出策略、全局 axios retry 策略。
- 不刷新或替代 current full authority；`release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 现在仅作为 historical full package。

## P12 规模化架构试点

目标：只有当基准数据证明 MySQL、artifact store、当前任务模型或 analyzer 调用模式成为瓶颈时，才进入规模化架构试点。

Must：

- 先运行 `make phase12-baseline`。
- 先写 ADR，再做最小可逆试点。
- 不允许因为“看起来高级”直接引入 Neo4j、pgvector、Temporal 或 analyzer daemon。

验收：

- `docs/PHASE12_BASELINE.md` 的触发条件被真实数据满足。
- ADR 说明收益、成本、回滚方案和替代方案。

## P6/P9/P11 增量：AutoRepair candidate provenance receipt

目标：让 Project QA 已验证引用和扫描报告风险进入 AutoRepair 候选时具备可审计、可展示、可测试的来源凭证，而不是只依赖自然语言 `targetDesc`。

Must：

- AutoRepair create request 必须支持结构化 `provenance`。
- 后端必须在创建候选后记录 `AUTO_REPAIR_CANDIDATE_CREATED` 审计事件。
- 后端 provenance 必须白名单清洗，不得记录完整问题、完整回答、代码正文、diff、token、secret 或 env。
- 后端必须以已创建 `AutoRepair` 的 `scanTaskId`、`filePath` 为准，不信任客户端同名字段覆盖。
- Project QA 已验证且已引用 citation 才能显示“生成修复候选”，并携带 `PROJECT_QA_VERIFIED_CITATION`、citation/chunk/line/grounding/enforcement。
- 扫描报告风险生成候选必须携带 `SCAN_REPORT_RISK`、risk category/severity/line/riskKey。
- AutoRepair 详情页必须展示 `Candidate Provenance Receipt / 候选来源凭证`，并能在审计日志查询失败时显示可重试错误态。
- focused smoke 必须证明 URL、create payload、详情 receipt 三层绑定。
- `validate-frontend-ui.mjs` 必须静态锁住 DTO/service、deep link、payload、receipt 和 smoke marker。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=AutoRepairServiceTest,AutoRepairControllerTest test` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make project-qa-autorepair-candidate-ui-smoke` 通过。
- `CI=true make report-autorepair-candidate-ui-smoke` 通过。
- `CI=true make patch-ready-ui-smoke` 通过，证明既有 PATCH_READY/PR gate 未回退。
- scoped `git diff --check` 通过。

非范围：

- 不新增 provenance 数据表。
- 不改 `auto_repairs` schema。
- 不刷新 full release authority。
- 不做 GitHub App E2E、私有仓库集成、真实 LLM provider run 或生产 PR 创建。

## P6/P9/P11 增量：Candidate receipt in scan governance timeline

目标：把 AutoRepair 候选来源凭证纳入扫描报告页治理闭环，让报告页可以直接复盘“风险/QA 证据 -> 修复候选 -> 审计凭证”。

Must：

- `ScanTaskGovernanceTimelineService` 必须把 `AUTO_REPAIR_CANDIDATE_CREATED` 映射为明确的 `AUTO_REPAIR_CANDIDATE_RECEIPT` 治理事件。
- 后端 candidate receipt event 必须继续使用现有 scan-bound `auditLogScope`，不得扩大到 project-wide audit log。
- 后端 event detail 只能使用 sanitized provenance 白名单摘要，不得输出 raw question、answer、content、code、diff、token、secret 或 env。
- `ScanTaskDetail` 必须保留 aggregate API 的 `timeline.events`，不得丢弃后端事件语义。
- `ScanTaskDetail` 必须对 aggregate API 的 `timeline.events` 做当前 `projectId + scanTaskId` 二次过滤；即使后端误混入 foreign timeline event，前端治理时间线也不得展示。
- `ScanTaskDetail` 必须优先渲染后端 candidate receipt event；缺失时可从 current-scan filtered audit logs 兜底解析。
- 修复候选阶段必须量化 candidate receipt 数量。
- candidate receipt event 必须提供 AutoRepair detail deep link，目标 repair id 必须来自 scan-bound timeline event 的 `actionTarget/resource`，最终 URL 必须绑定当前 `projectId + scanTaskId + repairId`，不得从未过滤 audit log 猜测。
- smoke 必须证明 current receipt 可见、foreign receipt hidden、sourceType 可见、`repairEvidenceGate/repairEvidenceGateReason/repairEvidenceGateSource` 可见、AutoRepair detail deep link bound、无 raw prompt/answer。
- validator 必须静态锁住后端事件提升、前端展示、AutoRepair deep link 绑定和 smoke marker。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=ScanTaskGovernanceTimelineServiceTest,AutoRepairServiceTest test` 通过。
- `npm --prefix web-console run build` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true make scan-governance-timeline-ui-smoke` 通过。
- `CI=true make project-qa-autorepair-candidate-ui-smoke` 通过。
- `CI=true make report-autorepair-candidate-ui-smoke` 通过。
- `./scripts/security-regression-check.sh` 必须证明 release verifier 拒绝缺 candidate receipt、缺 candidate gate reason、current receipt hidden、foreign receipt visible、AutoRepair deep link unbound、缺 patch evidence、patch artifact owner drift、patch ready audit missing、repair execution source drift、foreign patch evidence visible 和 raw prompt/answer leak 的伪造 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK`。
- focused release evidence 包必须证明 `OK scan-governance-timeline-ui-smoke` 会被 `verify-release-evidence.sh` 按 candidate receipt、PR gate、patch evidence 和 Agent review 子合同复核。
- scoped `git diff --check` 通过。

非范围：

- 不新增 provenance 表。
- 不改 `auto_repairs` schema。
- 不刷新 full release authority。
- 不把 candidate receipt 升级为 PR hard gate。

## P6/P9/P11 增量：Public repo live governance patch evidence

目标：把 mock-driven 扫描治理时间线里的 patch evidence 子合同，推进到真实公开仓库 retained sample 的 UI smoke 与 release verifier 中，证明公开仓库主链路不仅能扫描和展示报告，也能在治理时间线中复核当前扫描绑定的 AutoRepair patch 证据。

Must：

- `ScanGovernanceSmokeSeedController` 在 dev/test profile 下必须为当前公开仓库 retained sample 创建 `PATCH_READY` AutoRepair、`CHANGE_PATCH` artifact、`AUTO_REPAIR_PATCH_READY` audit、`AUTO_REPAIR` repair execution、`COMPLETED` AgentTask、`AGENT_REPORT` artifact、`AGENT_TASK_SMOKE_READY` audit 和 `AGENT_TASK` execution。
- repair execution 必须包含 `generate_patch` step 且终态为 `SUCCESS`，不得只依赖 AutoRepair 聚合状态。
- Agent execution 必须包含 `generate_report` step 且终态为 `SUCCESS`，不得只依赖 AgentTask 聚合状态或 `AGENT_REPORT` artifact 类型存在。
- `PUBLIC_REPO_UI_SMOKE_OK.governanceTimeline.patchEvidence` 必须证明：当前 repair 可见、`scanTaskId` 绑定、target file/diff 可见、patch artifact owner/type/id 绑定、patch-ready audit action/status/source 绑定、repair execution source/status/step 绑定。
- `PUBLIC_REPO_UI_SMOKE_OK.governanceTimeline.agentReview` 必须证明：当前 AgentTask 可见且 `COMPLETED`、`scanTaskId` 绑定、`AGENT_REPORT` artifact owner/type/id 绑定、`AGENT_TASK_SMOKE_READY/SUCCESS` audit action/status/source 绑定、Agent execution source/status/`generate_report` step 绑定、foreign Agent evidence hidden、无 raw prompt/answer 或敏感凭据。
- 公开仓库 UI smoke 必须证明 foreign patch evidence hidden，不能让异 scan 或异 AutoRepair 的 artifact/audit/execution 冒充当前扫描证据。
- 公开仓库 UI smoke 必须证明 foreign Agent evidence hidden，不能让异 scan 或异 AgentTask 的 report artifact/audit/execution 冒充当前扫描证据。
- release verifier 必须拒绝缺失或伪造的 `governanceTimeline.patchEvidence`，包括 artifact owner drift、audit source drift、execution source drift、step drift 和 foreign evidence visible。
- release verifier 必须拒绝缺失或伪造的 `governanceTimeline.agentReview`，包括 AgentTask scan drift、Agent report owner drift、Agent audit drift、Agent execution drift、foreign Agent evidence visible 和 raw prompt/answer 泄漏标记。
- 前端 marker、release verifier、安全回归和 UI 静态校验必须同时锁住该子合同。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=ScanGovernanceSmokeSeedControllerTest,ScanTaskGovernanceTimelineServiceTest test` 通过。
- `bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh && node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `./scripts/security-regression-check.sh` 必须证明伪造 `PUBLIC_REPO_UI_SMOKE_OK.governanceTimeline.patchEvidence` 会被拒绝。
- `./scripts/security-regression-check.sh` 必须证明伪造 `PUBLIC_REPO_UI_SMOKE_OK.governanceTimeline.agentReview` 会被拒绝。
- scoped `git diff --check` 通过。

非范围：

- 不把 GitHub App E2E、私有仓库分析或真实 PR 创建纳入当前验收。
- 不新增 AutoRepair、artifact 或 execution schema。
- 不替代 `autorepair-patch-smoke` 或 `scan-governance-timeline-ui-smoke`；本增量只把公开仓库 live UI smoke 的治理证据补齐。

## P6/P8/P9 增量：Public repo live code knowledge readiness

目标：把公开仓库 retained sample 的 UI smoke 从“能看到 code_chunks 命中”升级为“能证明代码知识库可用”，让报告页、证据抽屉和 Agent/QA 后续能力有同一套当前扫描绑定的检索就绪证据。

Must：

- `PUBLIC_REPO_UI_SMOKE_OK.codeKnowledge` 必须来自真实 `/api/projects/{projectId}/code-chunks/search?scanTaskId={scanTaskId}` 响应，不新增后端 API。
- 子合同必须证明当前 scan 绑定：`scanTaskId` 匹配、所有 returned chunks 属于当前 scan、`currentScanOnly=true`。
- 子合同必须证明 `totalChunks > 0`、`resultCount > 0`、`embeddedChunks >= 0 && embeddedChunks <= totalChunks`。
- 子合同必须包含可用检索模式：`KEYWORD`、`STABLE_FALLBACK`、`SEMANTIC_FALLBACK` 或 `HYBRID`，不得把 `NO_CONTEXT` 伪装成可用。
- 子合同必须包含 `evidenceProfile` 摘要：`readiness` 为 `READY` 或 `REVIEW`、`confidence` 在 0..100、`uniqueFiles > 0`、`fileStatsVisible=true`。
- 子合同必须证明返回 chunk 有 `sourceLabel`、`filePath`、`PRIMARY` context role、非空 evidence type，并包含 expected evidence file。
- release verifier 必须拒绝缺 codeKnowledge、scan drift、total/result 为空、embedding 计数越界、非法 retrieval/readiness、profile hidden、foreign scan、source/file/evidence stats hidden 的伪造 marker。

验收：

- `bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh && node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `./scripts/security-regression-check.sh` 通过。
- scoped `git diff --check` 通过。

非范围：

- 不新增 code knowledge API、数据库表或 analyzer/chunk_code 生成语义。
- 不要求本地公开仓库 smoke 必须有 embedding；无 embedding 时仍可通过 `KEYWORD`/`STABLE_FALLBACK` 证明可用但需复核。
- 不把该子合同扩展为外部 LLM 回答质量验收；回答引用质量继续由 `qaFromEvidence` 子合同负责。

## P6/P8/P9 增量：Public repo live cross-file code knowledge

目标：把公开仓库 retained sample 的 code knowledge 从“单次检索可用”升级为“多文件证据可用”，证明报告理解、QA 和后续 Agent 辅助分析能基于同一轮扫描的跨文件代码上下文工作。

Must：

- `PUBLIC_REPO_UI_SMOKE_OK.codeKnowledge.crossFileEvidence` 必须复用现有 `/api/projects/{projectId}/code-chunks/search`，不得新增后端 API。
- cross-file probe 必须使用当前 `scanTaskId`、空 query broad probe、`limit=24`，并证明 `responseStatus=200`。
- cross-file probe 的 `readiness` 允许 `READY`、`REVIEW` 或 `GAP`；其中 `GAP` 只表示本地无 embedding 或 broad fallback 仍能返回当前扫描的多文件结构证据，不能作为语义质量或 QA ready 声明。
- 子合同必须证明 `resultCount >= 2`、`uniqueFiles >= 2`、`fileStatsUniqueFiles >= 2`、`minFileEvidenceSatisfied=true`。
- 子合同必须证明 `currentScanOnly=true`、`sourceLabelsVisible=true`、`fileStatsVisible=true`。
- 子合同必须继续使用可用 retrieval/readiness allowlist：retrieval 不允许 `NO_CONTEXT`；top-level `codeKnowledge.readiness` 仍不允许 `GAP` 伪装成 QA-ready，只有 `crossFileEvidence.readiness` 可在满足多文件结构证据时记录 `GAP`。
- `CodeChunkController` 的 `items[]` 必须输出稳定 `citationId` 和 `sourceLabel`，让 code_chunks search 自身可直接作为报告证据与 Agent 上下文。
- release verifier 必须拒绝缺 crossFileEvidence、endpoint/limit/scan drift、单结果、单文件、foreign scan、fileStats hidden、sourceLabel hidden、非法 retrieval/readiness 和 minFileEvidence false 的伪造 marker。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkControllerTest test` 通过。
- `bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh && node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `./scripts/security-regression-check.sh` 通过。
- scoped `git diff --check` 通过。

非范围：

- 不新增 code_chunks API、数据库表、后端 DTO 产品概念或新的检索索引。
- 不改变 evidence drawer 的 `limit=3` 合同；cross-file broad probe 是 release evidence 子合同，不替代证据抽屉 UX。
- 不声称任意小仓库都必须具备多文件证据；本合同针对公开仓库 retained sample 的主链路验收。

## P8/P9 增量：Project QA citation coverage

目标：把 Project QA 的引用质量从“有 citation 和状态字符串”升级为“可量化覆盖率”，让报告证据追问、Agent 理解和自动修复候选入口能明确区分已引用证据、未引用候选证据和可用于修复的证据。

Must：

- `CodeQaResponse.citationCoverage` 必须在所有 QA 响应路径中返回，不得只在 LLM 成功路径返回。
- coverage 必须包含 `totalEvidenceCount`、`citedEvidenceCount`、`uncitedCandidateCount`、`repairCandidateCount`、`coveragePercent` 和 `status`，并进一步包含 `primaryEvidenceCount`、`citedPrimaryEvidenceCount`、`contextEvidenceCount`、`citedContextEvidenceCount`、`requiredEvidenceCount`、`citedRequiredEvidenceCount`、`requiredEvidenceCoveragePercent` 和 `coverageScope`。
- `status` 只能表达 `FULL`、`PARTIAL`、`NONE`、`NO_EVIDENCE`；verified 回答允许 `PARTIAL`，因为回答不必引用所有候选证据。
- 当 retrieved chunks 中存在 `PRIMARY` 主证据时，`requiredEvidence*` 必须只以主证据作为必需覆盖范围，`ADJACENT_CONTEXT` 只能作为辅助上下文，不得拉低必需证据覆盖率；没有主证据时 `coverageScope=ALL` 回退到全部候选。
- `repairCandidateCount` 只统计已被回答引用且具备 `scanTaskId/filePath/sourceLabel` 的证据，作为自动修复候选入口的硬前置信号。
- dev/test `MOCK` LLM provider 在收到明确要求使用证据标签的 prompt 时，必须返回至少一个当前可用 citation label，避免本地 smoke 因 mock provider 无引用能力而把真实 QA 引用链路误判为失败；普通 mock prompt 行为不得改变。
- Project QA UI 必须优先展示“必需证据覆盖 x/y (%)”，同时保留总“引用覆盖 x/y (%)”兼容语义和“可修复证据 n”。
- `PUBLIC_REPO_SMOKE_OK.codeQa.citationCoverage`、`PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.citationCoverage` 和 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.citationCoverage` 必须被 release verifier 强校验。
- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.citationCoverage` 和 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.citationCoverage` 必须输出并被 verifier 强校验 required coverage 子合同：`minRequiredEvidenceCoveragePercent>=100`、`minRequiredEvidenceCount>0`、`minCitedRequiredEvidenceCount>0`、`coverageScopes` 只允许 `PRIMARY|ALL`。
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.unverifiedCitation.citationCoverage` 必须输出并被 verifier 强校验 unverified required coverage 子合同：`minRequiredEvidenceCoveragePercent=0`、`minCitedRequiredEvidenceCount=0`、`coverageScopes` 只允许 `PRIMARY|ALL`，防止未验证回答伪装成必需证据已覆盖。
- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.citationCoverage.evidenceRoleDistribution` 和 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.citationCoverage.evidenceRoleDistribution` 必须输出 `statuses/minTotalFileCount/minCitedFileCount/minPrimaryFileCount/minCitedPrimaryFileCount/minContextFileCount/minCitedContextFileCount/minRoleCount/minFileEntryCount`；report unverified 必须输出 `maxCitedFileCount=0`、`maxCitedPrimaryFileCount=0`、`maxCitedContextFileCount=0`。
- Project QA assistant message 必须在 trust summary 后展示 `aria-label="跨文件引用摘要"` 的 `Cross-file Citation Summary`，把 required file coverage、PRIMARY file coverage、required claim PRIMARY binding、cross-file context 和 source line anchor 汇总为用户可读结论。
- `crossFileCitationSummary` 只能从现有 deterministic `citationCoverage`、`citationCoverage.evidenceRoleDistribution`、`claimCitationCoverage.roleDistribution` 和 `sourceEvidenceMatchType` 派生，不得引入额外 LLM 判断或事实评分。
- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.crossFileCitationSummary` 和 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.crossFileCitationSummary` 必须进入 release marker；release verifier 必须校验 summary 聚合计数与父级 coverage/claim role distribution 一致。
- verified QA path 的 `crossFileCitationSummary` 必须证明 `visible=true`、tone 为 `ready`、`currentScanOnly=true`、`sourceEvidenceMatchTypes` 只允许 `REPORT_LINE_ANCHOR`；unverified report evidence QA path 必须为 `blocked`，且不得伪造 cited file / PRIMARY file / claim binding 计数。
- `crossFileCitationSummary` marker 必须使用 strict allowed-key whitelist；不得记录 raw URL、query/hash、prompt、answer、源码内容、claim text、token、authorization 或其他可泄漏原始内容的字段，也不得接受 `notes/details` 等额外自由文本字段。
- `SOURCELENS_PUBLIC_REPO_SMOKE_UI=true make public-repo-smoke` 必须能在真实公开仓库、真实后端、非 mock API 的 `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.crossFileCitationSummary` 中证明 `visible=true`、tone=`ready`、scan-bound、line-anchor。
- `public-repo-ui-smoke` 中 API-only 辅助校验应直连 `SL_PUBLIC_REPO_API_BASE_URL`，不得通过 Vite proxy 承担重型 code_chunks broad query；live public repo UI smoke timeout 必须按真实后端慢路径设置，不得用 mock UI 的短 timeout 误伤主链路。
- unverified citation 路径必须证明 `status=NONE`、`coveragePercent=0`、`minCitedEvidenceCount=0`、`minRepairCandidateCount=0`，防止未验证回答误开放修复候选。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test` 通过。
- `bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh && node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make report-evidence-drawer-ui-smoke` 通过，并证明 verified/unverified 双路径的 `crossFileCitationSummary`。
- `SOURCELENS_BASE_URL=http://localhost:<port> SOURCELENS_PUBLIC_REPO_SMOKE_UI=true SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=true SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=true SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=900 SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false make public-repo-smoke` 通过，并证明真实 public repo UI marker 的 `crossFileCitationSummary`。
- `./scripts/security-regression-check.sh` 通过，并包含 missing summary、count mismatch、raw field、unexpected field、错误 tone / 伪造 cited count 等负例。

非范围：

- 不新增数据库表或 QA API。
- 不把 coverage 解释为 LLM 回答质量分；它只衡量回答引用了多少返回证据。
- 不把 `crossFileCitationSummary` 解释为 LLM 事实裁判；它只证明结构性 citation 覆盖、PRIMARY 角色绑定和当前扫描锚点。
- 不改变 AutoRepair 执行策略；本轮只提供可修复证据计数，原始报告证据 provenance attribution 作为下一步增量。

## P8/P9/P11 增量：sourceEvidenceRef provenance attribution

目标：把“报告证据 -> Project QA -> 已验证回答引用 -> AutoRepair 候选”从 UI 上的上下文提示升级为结构化来源链路，让候选来源凭证同时说明 QA 引用了哪个 code chunk，以及最初来自哪条报告证据。

Must：

- `CodeQaResponse` 必须回显经过白名单清洗的 `sourceEvidenceRef`，字段限于 `category/source/title/summary/filePath/lineNumber`。
- `CodeQaResponse` 必须返回 `sourceEvidenceMatched` 和 `sourceEvidenceMatchType`，至少区分 `REPORT_LINE_ANCHOR`、`REPORT_FILE_ANCHOR`、`NONE`。
- ProjectDetail 从 QA 已验证且已引用 citation 生成 AutoRepair draft 时，必须把 `sourceEvidenceCategory/sourceEvidenceSource/sourceEvidenceTitle/sourceEvidenceFilePath/sourceEvidenceLineNumber` 带入 provenance。
- AutoRepair create 的 `provenance` 必须把 source evidence 字段写入 `AUTO_REPAIR_CANDIDATE_CREATED` 审计 receipt，并继续禁止 raw question、answer、prompt、code、diff、token、secret、env。
- AutoRepairs 详情页 Candidate Provenance Receipt 必须展示“报告证据 / 报告来源 / 报告位置”。
- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.evidenceRef.responseBound` 和 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.evidenceRef.responseBound` 必须被 release verifier 强校验。
- Project QA AutoRepair focused smoke marker 必须输出 `sourceEvidenceRefPayloadBound=true`，并证明 candidate receipt 可见原始报告证据。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest,AutoRepairServiceTest test` 通过。
- `bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh && node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `make project-qa-autorepair-candidate-ui-smoke` 通过。
- `make report-evidence-qa-citation-ui-smoke` 通过。
- `./scripts/security-regression-check.sh` 通过。

非范围：

- 不新增 provenance 表。
- 不把客户端 provenance 当作权限事实；后端权限和边界仍以 project/repository/scan/file 服务端校验为准。
- 不把完整报告正文、完整 QA 问题或完整 LLM 回答写入审计 receipt。

## P6/P9/P3 增量：Project QA / AutoRepair repair evidence gate

目标：在 Project QA 和 AutoRepair 候选凭证中明确区分“回答引用已验证”和“修复候选证据闭环可复核”，防止用户把 `sourceEvidenceRef` 或 `citationCoverage` 误解为 PATCH_READY。

Must：

- Project QA answer UI 必须展示 `修复证据门禁`，状态只允许 `READY`、`REVIEW`、`BLOCKED`。
- `READY` 必须同时满足：`groundingStatus=VERIFIED`、`citationEnforcementStatus` 为 `DIRECT_VERIFIED|RETRY_VERIFIED|FALLBACK_CITED`、`citationCoverage.requiredEvidenceCoveragePercent=100`、`citationCoverage.repairCandidateCount>0`、`sourceEvidenceRef.filePath` 已回显、`sourceEvidenceMatched=true`、`sourceEvidenceMatchType=REPORT_LINE_ANCHOR`。
- `REPORT_FILE_ANCHOR` 只能进入 `REVIEW`，不能显示为 `READY`；`PARTIAL/UNVERIFIED/NO_EVIDENCE`、`RETRY_FAILED`、无引用、无报告证据、`sourceEvidenceMatched=false` 或 `NONE` 必须进入 `BLOCKED`。
- AutoRepair Candidate Provenance Receipt 必须展示 `候选证据门禁`，并基于 `PROJECT_QA_VERIFIED_CITATION` provenance 的 scan/file/citation/report evidence/match/citation gate 派生 `READY/REVIEW/BLOCKED`。
- AutoRepair create provenance 必须接收并审计 `sourceEvidenceMatched` 与 `sourceEvidenceMatchType`；审计 receipt 仍不得包含 raw prompt、raw answer、完整代码、diff、token、secret 或 env。
- `AUTO_REPAIR_CANDIDATE_CREATED` 审计 receipt 必须由服务端写入 `repairEvidenceGate`、`repairEvidenceGateReason`、`repairEvidenceGateSource=SERVER_DERIVED`；客户端不得传入或覆盖该 gate。
- Candidate Provenance Receipt 必须优先展示服务端 `repairEvidenceGate`，旧审计缺失该字段时才允许前端本地派生兼容。
- Scan Governance Timeline 的 `AUTO_REPAIR_CANDIDATE_RECEIPT` API event 必须结构化返回 `repairEvidenceGate`、`repairEvidenceGateReason`、`repairEvidenceGateSource`，前端治理时间线必须展示 `门禁 READY|REVIEW|BLOCKED`、`门禁来源 SERVER_DERIVED` 和原因；release verifier 必须拒绝缺失这些字段的 OK marker。
- `SCAN_REPORT_RISK` 缺少 scan 或 target file 绑定时必须为 `BLOCKED`；只有 scan + file + risk 字段完整时才能为 `READY`。
- `READY` 只代表 QA/report evidence 可进入修复候选复核，不代表 `PATCH_READY`、测试通过、PR 可提交或真实 GitHub App E2E。
- `project-qa-autorepair-candidate-ui-smoke` marker 必须证明 QA gate 同时出现 `READY` 和 `BLOCKED`，Candidate Receipt gate 为 `READY`，且锚点为 `REPORT_LINE_ANCHOR`。
- `report-evidence-qa-citation-ui-smoke` marker 必须证明 verified report-evidence QA path gate 为 `READY`，unverified path gate 为 `BLOCKED`。
- `verify-release-evidence.sh` 和 `security-regression-check.sh` 必须拒绝伪造 marker：隐藏 verified gate、把 file-only anchor 伪装 READY、unverified path 未 BLOCKED。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `make project-qa-autorepair-candidate-ui-smoke` 通过。
- `make report-evidence-qa-citation-ui-smoke` 通过。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest,AutoRepairServiceTest test` 通过。
- `./scripts/security-regression-check.sh` 通过。
- AutoRepair 后端测试必须证明：QA 行级锚点为 `READY`，文件级锚点为 `REVIEW`，receipt source 为 `SERVER_DERIVED`。

量化指标：

- 低置信或未验证 QA 回答误显示 READY：0。
- `REPORT_FILE_ANCHOR` 误显示 READY：0。
- unverified report-evidence QA path 未显示 BLOCKED：0。
- focused smoke 未 mock API 请求数：0。

非范围：

- 不新增数据库表或 AutoRepair 执行状态。
- 不生成 patch，不提交 PR，不刷新 full release authority。
- 不证明真实外部 LLM/provider 质量或 GitHub App E2E。

## P6/P9/P11 增量：Claim citation role distribution

目标：把 Project QA 的 claim citation 质量从“是否有有效引用”提升到“required claim 是否绑定 PRIMARY 主证据”，防止只引用 ADJACENT_CONTEXT 的回答被误认为主证据充分。

Must：

- `CodeQaClaimCitationCoverage` 必须输出 `roleDistribution`，字段至少包括 `status`、required claim 分类计数、claim file count、`roles[]` 和 `files[]`。
- `roleDistribution.status` 必须支持 `PRIMARY_BOUND`、`MIXED_CONTEXT`、`CONTEXT_ONLY`、`UNKNOWN_ROLE_PRESENT`、`REVIEW_UNCITED`、`BLOCKED_INVALID`、`NO_REQUIRED_CLAIMS`。
- 后端统计只能从当前响应的 `sourceLabel -> contextRole/filePath` 派生，不调用 LLM fact judge，不解析源码正文，不新增数据库字段。
- `CodeQaControllerTest` 必须覆盖 PRIMARY-bound、context-only、invalid label 和 uncited required claim。
- `ProjectDetail` 必须在“主张引用质量”面板内展示 `aria-label="主张证据角色分布"`。
- `PUBLIC_REPO_SMOKE_OK.codeQa`、`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` 和 `PUBLIC_REPO_UI_SMOKE_OK` marker 必须输出 `claimCitationCoverage.roleDistribution`。
- release verifier 必须要求 verified path 为 `PRIMARY_BOUND`，并拒绝 context-only、unknown、未验证路径伪造 PRIMARY、raw Code QA marker 只带 answer-level `citationCoverage.evidenceRoleDistribution` 但缺 claim-level `claimCitationCoverage.roleDistribution`、缺 roleDistribution 或父级计数不一致。
- security regression 必须覆盖缺 `roleDistribution`、伪造 `CONTEXT_ONLY`、PRIMARY under-covered、unverified path 伪造 `PRIMARY_BOUND` 和 PRIMARY file count。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test` 通过。
- `bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh && node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `npm --prefix web-console run smoke:report-evidence-drawer` 通过。
- `./scripts/security-regression-check.sh` 通过。

非范围：

- 不新增 DB schema、migration、索引或 code_chunks API。
- 不把该字段升级为 AutoRepair/PR hard gate。
- 不声称 PRIMARY_BOUND 等同于事实语义完全正确。

## P6/P9 增量：Project QA next action rail

目标：把 Project QA 的可信度摘要从“只读解释”升级为“可执行下一步”，让报告证据、引用覆盖、主张引用和 AutoRepair 候选之间形成清晰操作桥。

Must：

- Project QA assistant message 在“可信度结论”后必须渲染 `aria-label="QA 下一步动作"` 的动作栏。
- 动作栏必须按 `QaTrustSummary.tone` 显示中文确定性状态：`可采信`、`需复核`、`已阻断`；底层 tone 和技术状态不得因此改名。
- `可采信` 状态必须优先提供 `生成修复候选`，并且 `data-sl-target-url` 继续绑定 `PROJECT_QA_VERIFIED_CITATION`、project、repository、scanTask、file、citation、chunk、grounding、citation enforcement 和 source evidence 参数。
- `可采信` 状态必须提供 `复制首条引用` 和 `重新检索证据`，方便用户保留证据或刷新 code_chunks 命中。
- `需复核` 状态必须提供 `重新检索证据`、`重试此问题`、`恢复到输入框`，但不得显示可点击的 `生成修复候选`。
- `已阻断` 状态必须提供 `重试此问题`、`恢复到输入框`、`重新检索证据`，但不得显示可点击的 `生成修复候选`。
- 动作栏样式必须支持窄屏自动换行，按钮文字不得被裁切或横向溢出。
- `project-qa-autorepair-candidate-ui-smoke` 必须覆盖 desktop 与 `320x740`，并证明 `可采信/需复核/已阻断` 三态动作栏可见、READY AutoRepair 深链绑定正确、低置信/未引用/claim REVIEW 不显示修复候选。
- `validate-frontend-ui.mjs` 必须静态锁住组件、样式和 smoke marker 证据字段。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true make project-qa-autorepair-candidate-ui-smoke` 通过。
- `npm --prefix web-console run build` 通过。

量化指标：

- 动作栏未 mock API 请求数：0。
- browser smoke 覆盖 viewport：`1440x900`、`320x740`。
- 非 READY 状态误显示 `生成修复候选`：0。
- READY 动作栏 AutoRepair deep link 缺 `PROJECT_QA_VERIFIED_CITATION`：0。

非范围：

- 不改后端 QA、AutoRepair 或 code_chunks 协议。
- 不把 `TRUSTED` 声明为事实语义完全正确、PATCH_READY、测试通过或 PR 可提交。
- 该增量当轮不刷新 full release authority；后续曾由 `release-evidence/20260702-191044` 吸收；当前该包也已降级为 historical full package。

## P6/P9 增量：Report evidence next action rail

目标：把报告证据抽屉中的 `Citation Readiness` 从只读预检升级为可执行动作栏，避免证据缺口时用户误以为可以直接生成修复候选。

Must：

- `ReportEvidenceDrawer` 必须在 `引用质量预检` 后渲染 `aria-label="报告证据下一步动作"`。
- 动作栏必须按 `ReportCitationReadiness.status` 显示 `READY`、`REVIEW`、`GAP`。
- `READY` 状态必须显示 `基于此证据追问`、`复制证据引用`，并且只有当 evidence 是 file-bound `repairRisk` 时才显示 `生成修复候选`。
- `REVIEW` 和 `GAP` 状态不得显示 `生成修复候选`；必须引导用户先进入 QA 复核或复制证据。
- GAP 状态必须明确提示“先补证据，不直接生成修复候选”。
- 动作栏样式必须支持移动端按钮换行，避免横向溢出。
- `report-evidence-drawer-ui-smoke` 必须覆盖 READY 与 GAP 两条抽屉路径；READY 证明 repair action 可见，GAP 证明 repair action hidden。
- `validate-frontend-ui.mjs` 必须锁住组件、样式、READY/GAP smoke 断言和 marker 字段。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true make report-evidence-drawer-ui-smoke` 通过。
- `npm --prefix web-console run build` 通过。

量化指标：

- READY/GAP 抽屉 code_chunks 查询数：每 viewport 各 1 次。
- smoke 覆盖 viewport：`1440x900`、`320x740`。
- GAP 状态误显示 `生成修复候选`：0。
- 未 mock API 请求数：0。

非范围：

- 不改报告风险表格外部的现有修复入口。
- 不改后端 AutoRepair 候选创建协议。
- 不刷新 full release authority。

## P6/P9 增量：AutoRepair candidate receipt review action rail

目标：把 AutoRepair 候选来源凭证从“只读证明”升级为“可执行复核入口”，让用户在候选详情中直接回跳来源报告、Project QA 和审计日志，形成报告证据、QA、AutoRepair、AuditLogs 的闭环。

Must：

- `CandidateProvenanceReceipt` 必须接收当前 `projectId`、`repair` 和导航函数，不能只展示 receipt 字段。
- 候选凭证区域必须渲染 `aria-label="候选凭证复核动作"`。
- 当候选绑定 `scanTaskId` 时，凭证动作栏必须显示 `打开来源报告`，并绑定 `/scan-tasks/{scanTaskId}`。
- 当候选绑定 `scanTaskId` 时，凭证动作栏必须显示 `QA 复核凭证`，并绑定 Project QA deep link，问题中必须包含候选来源凭证、sourceType、目标文件和候选门禁摘要。
- 凭证动作栏必须始终显示 `查看候选审计`，并绑定 `/audit-logs?projectId=...&resourceType=AUTO_REPAIR&resourceId=...`；有 `scanTaskId` 时必须追加 scanTaskId。
- 动作栏必须按候选证据门禁 READY/REVIEW/BLOCKED 给出不同复核提示，但不得把 READY 解释为 PATCH_READY、测试通过或 PR 可提交。
- 样式必须支持 `320x740`，按钮换行且不得横向溢出。
- `project-qa-autorepair-candidate-ui-smoke` 必须证明 `PROJECT_QA_VERIFIED_CITATION` 候选的 receipt action rail 和 report/QA/audit deep link。
- `report-autorepair-candidate-ui-smoke` 必须证明 `SCAN_REPORT_RISK` 候选的 receipt action rail 和 report/QA/audit deep link。
- `validate-frontend-ui.mjs` 必须静态锁住源码、smoke 断言和 marker 字段。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true make project-qa-autorepair-candidate-ui-smoke` 通过。
- `CI=true make report-autorepair-candidate-ui-smoke` 通过。
- `npm --prefix web-console run build` 通过。

量化指标：

- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.candidateReceipt.actionRailVisible=true`。
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.candidateReceipt.reportDeepLinkBound=true`。
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.candidateReceipt.qaDeepLinkBound=true`。
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.candidateReceipt.auditDeepLinkBound=true`。
- `REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK.candidateReceipt.actionRailVisible=true`。
- `REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK.candidateReceipt.reportDeepLinkBound=true`。
- `REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK.candidateReceipt.qaDeepLinkBound=true`。
- `REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK.candidateReceipt.auditDeepLinkBound=true`。
- 两条 smoke 的未 mock API 请求数：0。
- browser smoke 覆盖 viewport：`1440x900`、`320x740`。

非范围：

- 不改后端 AutoRepair、AuditLog 或 QA API。
- 不新增 DB schema、migration 或 release evidence schema。
- 该增量当轮不刷新 full release authority；后续曾由 `release-evidence/20260702-191044` 吸收；当前该包也已降级为 historical full package。

## P6/P9 增量：AuditLogs candidate receipt review panel

目标：把 `AuditLogs` 中的 `AUTO_REPAIR_CANDIDATE_CREATED` 审计事件从原始 JSON 抽屉升级为候选凭证复核入口，让审计侧也能回跳 AutoRepair、来源报告和 Project QA。

Must：

- `AuditLogs` 抽屉必须识别 `resourceType=AUTO_REPAIR` 且 `action=AUTO_REPAIR_CANDIDATE_CREATED` 的事件。
- 命中候选凭证事件时，抽屉必须渲染 `aria-label="审计候选凭证复核"`。
- 面板必须从 sanitized `inputJson.provenance` 解析 sourceType、scanTaskId、filePath、repairEvidenceGate、repairEvidenceGateSource 和 reason。
- 面板必须提供 `打开修复详情`，绑定 `/auto-repairs?projectId=...&repairId=...`；有 `scanTaskId` 时追加 scanTaskId。
- 面板必须提供 `打开来源报告`，绑定 `/scan-tasks/{scanTaskId}`。
- 面板必须提供 `QA 复核来源`，绑定 Project QA deep link，问题必须包含 AuditLog ID、`AUTO_REPAIR_CANDIDATE_CREATED`、sourceType、目标文件和候选门禁。
- 面板不得展示原始 prompt、answer 或 diff；Sanitized Input 仍保留在原 JSON 区。
- 面板样式必须支持 320px 窄屏，按钮全宽换行，不产生横向溢出。
- `audit-logs-detail-selection-ui-smoke` 必须覆盖候选凭证事件抽屉、三条 deep link、双 viewport 和 mocked-only。
- `validate-frontend-ui.mjs` 必须锁住源码、样式入口、smoke 断言和 marker 字段。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true make audit-logs-detail-selection-ui-smoke` 通过。
- `npm --prefix web-console run build` 通过。

量化指标：

- `AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK.candidateReceiptReview.visible=true`。
- `AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK.candidateReceiptReview.repairDeepLinkBound=true`。
- `AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK.candidateReceiptReview.reportDeepLinkBound=true`。
- `AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK.candidateReceiptReview.qaDeepLinkBound=true`。
- `AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK.candidateReceiptReview.auditEventBound=true`。
- 未 mock API 请求数：0。
- browser smoke 覆盖 viewport：`1440x900`、`320x740`。

非范围：

- 不改后端 AuditLog schema 或查询 API。
- 不把审计事件面板作为 PATCH_READY 或 PR-ready 证据。
- 不刷新 full release authority。

## P6/P9/P10 增量：Scan governance candidate receipt action alignment

目标：统一 Scan governance timeline 与 AuditLogs 的候选凭证复核动作命名和 deep link，让同一个 `AUTO_REPAIR_CANDIDATE_CREATED` 来源在报告治理时间线、审计日志和 AutoRepair 详情中表现一致。

Must：

- `ReportGovernanceEvent` 必须支持多动作 `actions[]`，普通事件继续保留单动作 `actionLabel/onOpen/targetUrl`。
- `CandidateReceipt` 事件必须显示 `打开修复详情`、`打开来源报告`、`QA 复核来源` 三个动作。
- `打开修复详情` 必须绑定 `/auto-repairs?projectId=...&scanTaskId=...&repairId=...`。
- `打开来源报告` 必须绑定 `/scan-tasks/{scanTaskId}`。
- `QA 复核来源` 必须绑定 Project QA deep link，问题中包含治理时间线、AutoRepair ID、候选门禁和凭证明细。
- fallback `AUTO_REPAIR_CANDIDATE_CREATED` audit log 事件也必须使用同一套候选凭证动作 helper。
- 事件动作列表必须在 320px 窄屏下换行并全宽显示，不产生横向溢出。
- `scan-governance-timeline-ui-smoke` 必须证明三动作可见、三条 deep link 绑定、foreign candidate receipt hidden、mocked-only。
- `validate-frontend-ui.mjs` 必须锁住 aggregate candidate receipt、fallback candidate receipt、helper 三动作和 smoke marker。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `CI=true make scan-governance-timeline-ui-smoke` 通过。
- `npm --prefix web-console run build` 通过。

量化指标：

- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.candidateReceipt.autoRepairDeepLinkBound=true`。
- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.candidateReceipt.sourceReportDeepLinkBound=true`。
- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.candidateReceipt.qaReviewDeepLinkBound=true`。
- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.candidateReceipt.actionLabels=["打开修复详情","打开来源报告","QA 复核来源"]`。
- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.candidateReceipt.foreignReceiptHidden=true`。
- 未 mock API 请求数：0。
- browser smoke 覆盖 viewport：`1440x900`、`320x740`。

非范围：

- 不改后端 governance timeline API。
- 不改变 PR Gate、Artifact、Execution、AgentTask 等其他事件动作命名。
- 不刷新 full release authority。

## P9 增量：Scan Governance Timeline Action Landing

目标：把扫描详情治理时间线从“深链 URL 已绑定”提升为“点击真实动作后目标页完成最小落位”，确保修复、产物、执行、审计、Agent 和 QA 复核上下文可被用户直接操作。

Must：

- `ScanTaskDetail` 的 derived artifact governance event 必须把 `ownerType`、`ownerId` 和具体 `artifactId` 都放入 `/artifacts` deep link。
- `scan-governance-timeline-smoke` 必须从 `/scan-tasks/{scanTaskId}` 点击真实 timeline button，不能只检查 `data-sl-target-url`。
- Action landing smoke 必须覆盖 AutoRepair `repairId`、Artifact `ownerType/ownerId/artifactId`、ExecutionTask `taskId`、AuditLogs `resourceType/resourceId/action/status`、AgentTasks `scanTaskId/taskId`、Project QA `tab=qa&scanTaskId&question`、Agent tool calls `conversationId + scanTaskId`。
- Landing 阶段 API mock 必须与 scan detail 聚合阶段区分，合法目标页请求不得被计入 legacy timeline fan-out。
- `validate-frontend-ui.mjs` 必须静态锁住 action landing helper、artifactId 消费、`actionLanding` marker 和 derived artifact exact URL。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make scan-governance-timeline-ui-smoke` 通过。
- scoped `git diff --check` 通过。

量化指标：

- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.actionLanding.clickedActionCount=7`。
- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.actionLanding.allLandingPagesLoaded=true`。
- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.actionLanding.allSelectedOrFiltered=true`。
- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.actionLanding.rawAgentTaskPayloadHidden=true`。
- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.unhandledApiRequests=0`。
- Browser smoke 覆盖 viewport：`1440x900`、`320x740`。

非范围：

- 不改后端 governance timeline API。
- 不新增 DB schema。
- 不做真实 public repo live landing evidence。
- 不刷新 full release authority。

## P9 增量：UI Foundation browser-grade readability gate

目标：把顶部文字裁切、主按钮文字/图标低对比、基础状态块长文本溢出这类低级 UI 事故纳入浏览器级和静态级双门禁，作为后续“大厂级 UI”重构的基础层。

Must：

- `IconActionButton` 必须输出稳定 variant class：`sl-icon-action-button-primary`、`sl-icon-action-button-danger`、`sl-icon-action-button-text`、`sl-icon-action-button-default`，并保留 `aria-label`、tooltip 和 decorative icon 行为。
- `IconActionButton` 必须输出 `data-sl-variant`，便于 browser smoke 和静态门禁定位。
- `.sl-icon-action-button-primary` 启用态必须强制 primary surface、白色 icon/text color 和 `-webkit-text-fill-color`，不得被 AntD 或页面局部样式降级。
- `.sl-icon-action-button-danger/text/default` 启用态必须有稳定 root color，子 icon/svg 必须继承 root color。
- `.sl-topbar-title` 必须使用防垂直裁切的 line-height、min-height 和 padding 策略；topbar/page heading 不得只靠 bounding box，必须继续通过 scroll/client 尺寸验证。
- `StateBlock` 标题必须支持长错误码、URL、路径等不可断字符串换行，不得撑破容器。
- `app-shell-ui-smoke` 必须逐路由逐 viewport 证明 topbar title、可见 topbar desc 和页面主标题没有水平或垂直文字裁切。
- `app-shell-ui-smoke` 必须证明 primary button root、`.sl-action-button-label`、`.ant-btn-icon` 和可见 SVG paint node 均保持白色可读。
- `app-shell-ui-smoke` 必须同时检查 `.ant-message-notice-error` 和 `.ant-notification-notice-error` 为 0。
- `validate-frontend-ui.mjs` 必须静态锁住上述 component class、CSS 兜底、browser smoke 断言和 marker assertions。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm exec tsc -- -p tsconfig.json --noEmit`（`web-console`）通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make app-shell-ui-smoke` 通过。
- scoped `git diff --check` 通过。

量化指标：

- `APP_SHELL_UI_SMOKE_OK.mockedApiOnly=true`。
- `APP_SHELL_UI_SMOKE_OK.unhandledApiRequests=0`。
- `APP_SHELL_UI_SMOKE_OK.viewports=["1440x900","320x740"]`。
- `APP_SHELL_UI_SMOKE_OK.routes` 覆盖 12 个受保护顶层页面。
- `APP_SHELL_UI_SMOKE_OK.assertions` 必须包含 `topbar-title-scroll-size-within-box`、`topbar-desc-scroll-size-within-box`、`page-heading-scroll-size-within-box`、`primary-button-label-icon-svg-white`、`no-error-toast-or-notification`。
- `APP_SHELL_UI_SMOKE_OK.layoutGuards` 必须包含 `topbar-title-contained`、`topbar-desc-contained-when-visible`、`page-content-starts-after-topbar`、`page-heading-below-topbar`。

非范围：

- 不重做全站视觉语言、信息架构或主题系统。
- 不改变后端、DB、API、release evidence schema、GitHub App 或真实 LLM provider。
- 不声明 full release authority 刷新；该 focused gate 等待下一次完整 release/nightly profile 吸收。

## P9/P6 增量：Project QA code_chunks evidence card readability

目标：把 Project QA 的 code_chunks 搜索结果、回答引用和 retrieved chunk evidence 从“字段存在”提升为“可扫读、可审计、可行动”的证据卡片，服务代码理解、跨文件检索和报告引用质量主线。

Must：

- Project QA 搜索结果卡片必须展示 source label、完整 `filePath:start-end`、line range、上下文角色、证据类型、Score、向量状态、evidence reason、matched terms、meta grid、code preview 和四个操作。
- 搜索结果操作必须继续使用现有 `定位检索`、`追问此处`、`复制引用`、`复制链接` 行为，不改变 API 或 deep link 合同。
- QA 回答 citation card 必须展示 source label、完整 line reference、Scan、引用/候选状态、角色、类型、Score 和 reason。
- Retrieved chunk evidence 必须以可换行小型证据卡展示，不得退回单行标签串。
- 单条 citation 的 accessible label 不得污染父级 `aria-label="回答引用证据"`，避免测试和辅助技术误选子卡片。
- 320px 窄屏必须无横向溢出，长路径、reason、matched terms 和按钮都必须可换行。
- `project-qa-recoverable-smoke` 必须证明恢复后证据卡片字段可见、刷新失败后旧结果保留、无横向溢出。
- `validate-frontend-ui.mjs` 必须静态锁住卡片 DOM、CSS 和 marker 结构。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true npm --prefix web-console run smoke:project-qa-recoverable` 通过。
- `CI=true npm --prefix web-console run smoke:project-qa-low-confidence` 通过。
- `CI=true npm --prefix web-console run smoke:report-evidence-qa-citation` 通过。
- scoped `git diff --check` 通过。

量化指标：

- `PROJECT_QA_RECOVERABLE_SMOKE_OK.codeChunkEvidenceCard.visible=true`。
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.codeChunkEvidenceCard.preservedAfterRefreshFailure=true`。
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.codeChunkEvidenceCard.noHorizontalOverflow=true`。
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.codeChunkEvidenceCard.readableFields` 覆盖 `filePath`、`lineRange`、`contextRole`、`evidenceType`、`score`、`embeddingState`、`matchedTerms`、`evidenceReason`、`metaGrid`、`contentPreview`、`actions`。
- 未 mock API 请求数：0。
- browser smoke 覆盖 viewport：`1440x900`、`320x740`。

非范围：

- 不改后端、数据库、QA API、code_chunks 检索/rerank、chunk 生成、AutoRepair gate、release verifier schema、GitHub App 或真实 LLM provider。
- 不刷新 full release authority。

## P6/P9 增量：Project QA answer source receipt

目标：把报告证据引用从“后端响应字段存在”提升为“QA 回答层可见、可审计、可进入 AutoRepair handoff 的来源凭证”，补齐报告证据到代码问答之间的中间链路。

Must：

- QA assistant answer 如果携带 `sourceEvidenceRef.filePath`，必须渲染 `aria-label="QA 回答报告证据凭证"`。
- 凭证必须展示报告证据标题、来源、分类、`Scan #`、`filePath:lineNumber`、`sourceEvidenceMatchType` 和中文 match label。
- `sourceEvidenceMatchType=REPORT_LINE_ANCHOR` 必须显示为 `行级锚点`。
- 凭证样式必须支持长标题、长路径和 320px 窄屏换行，不得制造横向溢出。
- `project-qa-autorepair-candidate-smoke` 必须证明 verified cited QA answer 的凭证可见，并且 title/source/category/scan/file-line/match type 绑定正确。
- smoke marker 必须包含 `qaAnswerSourceReceipt.visible`、`sourceEvidenceTitleVisible`、`lineAnchorVisible`、`scanTaskIdBound`、`sourceEvidenceMatchType`、`noRawPromptOrAnswer`。
- `validate-frontend-ui.mjs` 必须静态锁住 helper、panel、CSS、browser smoke 断言和 marker schema。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `CI=true make project-qa-autorepair-candidate-ui-smoke` 通过。
- scoped `git diff --check` 通过。

量化指标：

- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.mockedApiOnly=true`。
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.unhandledApiRequests=0`。
- browser smoke 覆盖 viewport：`1440x900`、`320x740`。
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.qaAnswerSourceReceipt.visible=true`。
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.qaAnswerSourceReceipt.sourceEvidenceTitleVisible=true`。
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.qaAnswerSourceReceipt.lineAnchorVisible=true`。
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.qaAnswerSourceReceipt.scanTaskIdBound=true`。
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.qaAnswerSourceReceipt.sourceEvidenceMatchType="REPORT_LINE_ANCHOR"`。
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.qaAnswerSourceReceipt.noRawPromptOrAnswer=true`。

非范围：

- 不改后端、数据库、QA API、AutoRepair API、AutoRepair gate、release verifier schema、GitHub App 或真实 LLM provider。
- 不声明真实 public repo live handoff 已完成；本轮是 focused mocked browser gate。
- 不刷新 full release authority。

## P6/P9/P11 增量：Public repo QA evidence handoff live gate

目标：把公开仓库真实 UI smoke 中的报告证据、Project QA 引用和 AutoRepair 候选入口串成可验证 handoff，证明主链路不是靠手工 URL fallback，而是从真实 QA verified citation action 进入修复候选。

Must：

- `public-repo-ui-smoke` 必须在 `verifyQaFromEvidence` 中断言 `QA 回答报告证据凭证` 可见。
- 凭证必须可见 title/source/file/scan label/`REPORT_LINE_ANCHOR`/`行级锚点`。
- `public-repo-ui-smoke` 必须从 `QA 下一步动作` 中读取 `生成修复候选` 按钮的 `data-sl-target-url`。
- handoff URL 必须解析出 `sourceType=PROJECT_QA_VERIFIED_CITATION`、`repositoryId`、`scanTaskId`、`filePath`、`citationId`、`chunkId`、`citedByAnswer=true`、`groundingStatus=VERIFIED`、`citationEnforcementStatus`、source evidence params。
- AutoRepair candidate 页面必须使用该 QA handoff URL 打开，不得退回手工构造 public repo candidate URL。
- candidate form 必须显示 `Project QA verified citation`、`Scan #`，并预填 QA cited file path 和 `Project QA 已验证引用` target desc。
- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.evidenceHandoff` 必须为 optional-but-strict；旧证据包缺字段不失败，新字段出现必须强校验。
- `evidenceHandoff` marker 不得记录 raw URL、prompt、answer、源码、报告全文、claim text、token、Authorization 或 secret。
- `verify-release-evidence.sh` 必须包含 `assertQaEvidenceHandoff`。
- `security-regression-check.sh` 必须覆盖 handoff forged cases：surface/source type、scan mismatch、line anchor drift、action hidden、URL unbound、source evidence params unbound、candidate form hidden、raw answer/token/provider overclaim。
- `validate-frontend-ui.mjs` 必须静态锁住 smoke proof、marker、verifier 和 security regression。

验收：

- `bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `cd web-console && npm exec tsc -- -p tsconfig.json --noEmit` 通过。
- `npm --prefix web-console run build` 通过。
- `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260702-230650` 通过。
- `cd web-console && SL_PUBLIC_REPO_UI_PROJECT_ID=1 SL_PUBLIC_REPO_UI_REPOSITORY_ID=1 SL_PUBLIC_REPO_UI_SCAN_TASK_ID=1 SL_PUBLIC_REPO_UI_TOKEN=dummy npm exec -- playwright test -c playwright.public-repo-ui.config.ts --list` 通过。
- `./scripts/security-regression-check.sh` 通过。
- scoped `git diff --check` 通过。

量化指标：

- `evidenceHandoff.status="OK"`。
- `evidenceHandoff.surface="PROJECT_QA_REPORT_EVIDENCE_HANDOFF"`。
- `evidenceHandoff.answerSourceReceiptVisible=true`。
- `evidenceHandoff.sourceEvidenceMatchTypes=["REPORT_LINE_ANCHOR"]`。
- `evidenceHandoff.sourceTypes=["PROJECT_QA_VERIFIED_CITATION"]`。
- `evidenceHandoff.readyForAutoRepair=true`。
- `evidenceHandoff.repairCandidateActionVisible=true`。
- `evidenceHandoff.autoRepairDraftUrlBound=true`。
- `evidenceHandoff.sourceEvidenceParamsBound=true`。
- `evidenceHandoff.candidateFormOpened=true`。
- `evidenceHandoff.noRawPromptOrAnswer=true`。
- `evidenceHandoff.providerQualityClaim=false`。
- `evidenceHandoff.llmFactClaim=false`。

非范围：

- 不改后端、数据库、QA API、AutoRepair API、AutoRepair gate、GitHub App、真实 GitHub PR 或真实 LLM provider。
- 不刷新 full release authority。
- 不声明真实 public repo UI smoke 已重新运行；本轮完成合同、静态门禁、verifier/security 和入口可运行验证。

## P6/P11 增量：Source location probe v3 query-shape proof hardening

目标：把 P6 browser/Vite/webpack source URL 检索证明从“marker 自述 queryShape”升级为“真实 probe 形态布尔证明”，防止普通 `file:line` 查询伪装成 source URL probe。

Must：

- `CodeChunkServiceTest` 必须覆盖 standalone Vite source URL：`http://localhost:5173/src/pages/ProjectDetail.tsx?t=...:245:19` 在同文件存在 `5160-5180` 诱饵 chunk 时仍命中 `241-260` 目标 chunk。
- `CodeChunkControllerTest` 必须覆盖 source URL query 穿过 controller，service 收到原 query，响应 item 只暴露安全 chunk 字段，不新增 raw URL/source URL/normalized source URL/query 字段。
- `public-repo-analysis-smoke.sh` 的 source location probes 必须升级为 `sourceLocationProbeContractVersion=3`。
- v3 probe 必须输出 `queryHadScheme`、`queryHadViteQueryParam`、`queryHadColumn`、`queryHadWebpackScheme`，且不得记录 raw URL、query/hash、host/origin、完整 stack trace、源码或 token。
- `verify-release-evidence.sh` 必须保持 v2 historical/current authority 兼容；v3 或新 proof 字段出现时必须强校验 shape booleans。
- `security-regression-check.sh` 必须包含 forged cases：`source-url-no-scheme`、`source-url-no-column`、`v3-missing-shape-proof`、`vite-no-query-param`、`vite-webpack-claim`、`webpack-no-scheme`。
- `validate-frontend-ui.mjs` 必须静态锁住 v3 smoke output、verifier 和 security regression 合同。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest,CodeChunkControllerTest test` 通过。
- `bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260702-230650` 通过，证明 current full authority 未被 v3 新规则破坏。
- 定向 v3 forged marker 验证通过：合法 v3 marker 通过，`v3-missing-shape-proof`、`vite-no-query-param`、`webpack-no-scheme` 被 verifier 拒绝。

非范围：

- 不新增 DB schema、code_chunks API schema、source map 反解、向量索引、rerank 算法或 UI source URL 搜索框 smoke。
- 不刷新 full release authority；当前 full authority 仍为 `release-evidence/release-current-schema-20260702-230650`。
- 本轮未声明全量 `security-regression-check.sh` PASS；该脚本两次长时间运行未完成后中断，本轮只采用 targeted forged marker verification 覆盖新增 v3 合同。

## P6 增量：CodeLocationHintParser 纯函数化

目标：把 code_chunks 检索中的 source URL、stack frame、method/file anchor、line hint 和 `filePath:` evidence anchor 解析从 `CodeChunkRanker` / `CodeChunkService` 中抽成独立纯函数，降低后续 Vite/webpack/browser 报错格式扩展的回归风险。

Must：

- 新增 `CodeLocationHintParser`，必须是无 Spring、无数据库、无 `CodeChunk` 依赖的纯函数类。
- `CodeChunkRanker` 对外 API 必须保持：`rank`、`score`、`tokenize`、`roleIntentTypes`、`methodAnchorFileHints` 不改签名。
- `CodeChunkRanker.methodAnchorFileHints` 必须作为兼容 facade 保留，内部委托 parser。
- parser 必须覆盖 line hint、path line-column、line range、英文 `lines`、中文“第 N 行”、URL port 剥离、source URL query/hash suffix 清理、`Class#method`、`Class::method`、qualified stack frame、function file stack frame、anonymous webpack stack frame、standalone source URL file hint 和 `filePath:` evidence anchor 规范化。
- `CodeChunkService` 候选合并顺序必须保持收敛：keyword、role intent、path suffix hint、method anchor、`filePath:` evidence anchor，再进入 rank。
- 不改排序权重、候选池大小、code_chunks API schema、DB schema、embedding/semantic retrieval、release evidence schema 或前端 UI。
- `security-regression-check.sh` 静态断言必须从旧 `CodeChunkRanker` 解析实现迁移到 `CodeLocationHintParser`，避免抽类后 release gate 误杀。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeChunkControllerTest test` 通过。
- `bash -n scripts/security-regression-check.sh scripts/verify-release-evidence.sh scripts/public-repo-analysis-smoke.sh` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260702-230650` 通过。
- scoped `git diff --check` 通过。
- 如果完整 `./scripts/security-regression-check.sh` 本轮完成，则必须记录结果；如果长时间无输出或中断，不得声明 PASS。

非范围：

- 不做 source map 反解、浏览器调试协议、外链访问、SSRF 解析、列级定位、同名文件全局 disambiguation 或 UI 搜索体验改版。
- 不刷新 full release authority；当前 full authority 仍为 `release-evidence/release-current-schema-20260702-230650`。

## P6 增量：Source URL path suffix candidate priority

目标：在不改 DB/API/schema/embedding 的前提下，增强浏览器 source URL、Vite/webpack stack frame 和报告 `filePath:` anchor 的路径后缀候选召回与排序，降低同名文件把 Project QA、报告证据和 AutoRepair 目标文件带偏的风险。

Must：

- `CodeLocationHintParser` 必须输出安全归一化的 `pathSuffixHints`，从 source URL、stack frame、普通路径和 `filePath:` anchor 中提取 exact relative path、path suffix、basename；必须剥离 host、port、query/hash、line/column 噪声。
- `CodeChunkService` 必须在 keyword、role intent 之后、method anchor 和 `filePath:` evidence anchor 之前合并 path suffix candidates；所有查询必须继续受 `scanTaskId` 和 `RANKING_CANDIDATE_MAX_LIMIT` 约束。
- 当问题含显式 `filePath:` evidence anchor 时，不得重复执行 path suffix candidate 查询；继续由 `listEvidenceFilePathAnchorCandidates` 承担 exact evidence recall。
- `CodeChunkRanker` 必须增加 `pathSuffixHintScore`，权重顺序为 exact path > suffix path > contained suffix > basename-only / compact basename；同名文件冲突时，suffix path 必须压过单纯 basename、内容关键词和 line hint。
- `CodeQaRetrievalService` 不承担召回，只消费已合并候选并通过 ranker 选择 top chunks。
- 不得保存或回显 raw source URL、host、query/hash、stack trace、prompt、answer 或代码内容到 release marker。

验收：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest test` 通过。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeChunkControllerTest,CodeQaRetrievalServiceTest,CodeQaControllerTest test` 通过。
- `CodeLocationHintParserTest` 必须覆盖 source URL path suffix 清洗，证明不保留 host/query/hash/line-column 噪声。
- `CodeChunkServiceTest` 必须覆盖同名 `ProjectDetail.tsx` 诱饵：source URL path suffix 能把正确 `src/pages` chunk 排到 top 1。
- `CodeQaRetrievalServiceTest` 必须覆盖同名文件、同方法、同行号场景：path suffix 仍优先于 basename-only。
- `bash -n scripts/security-regression-check.sh scripts/verify-all.sh scripts/verify-release-evidence.sh scripts/public-repo-analysis-smoke.sh` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `SOURCELENS_SECURITY_REGRESSION_ASSERT_PROGRESS_INTERVAL=500 ./scripts/security-regression-check.sh --suite static` 通过。

非范围：

- 不做 source map 反解、浏览器调试协议、外链访问、SSRF 解析、列级定位或全局唯一文件解析。
- 不改 `code_chunks` DB schema、API DTO、前端请求协议、semantic pool、embedding model key、release evidence schema 或 AutoRepair gate。
- 不刷新 full release authority；当前 full authority 仍为 `release-evidence/release-current-schema-20260702-230650`。

## P10/P11 增量：Security regression observability and timeout hardening

目标：把完整 `security-regression-check.sh` 从“长时间静默、人工无法判断卡点”的黑盒门禁，升级为可观测、可定位、具备 fail-closed timeout 的发布安全门禁。

Must：

- `security-regression-check.sh` 默认必须输出阶段化进度到原始 stderr，即使被测子命令 stdout/stderr 被重定向到临时文件，终端仍能看到 `START/OK/FAIL/TIMEOUT`。
- 进度输出必须至少覆盖 shell syntax、静态断言节流计数、`release-evidence`、`verify-release-evidence` 和 node probe 子步骤。
- `release-evidence`、`verify-release-evidence` 和 node probe 必须通过统一 timeout wrapper 执行；timeout 必须 fail-closed，不能被“预期失败负例”误判为通过。
- timeout wrapper 必须保留调用方原始 `errexit` 状态，支持 `set +e` 探针正确采集预期非零退出码。
- `run-llm-provider-eval.mjs` 的 provider `fetch()` 必须使用 `AbortController` 和 `SOURCELENS_LLM_PROVIDER_EVAL_TIMEOUT_MS`，默认 15 秒。
- `release-evidence.sh` 的 Playwright availability probe 必须优先使用本地 `web-console/node_modules/.bin/playwright`；fallback `npm exec -- playwright --version` 必须有 timeout 边界。
- `security-regression-check.sh` 必须静态锁住上述可观测性、timeout wrapper、LLM provider request timeout 和 Playwright probe timeout 合同。

验收：

- `bash -n scripts/security-regression-check.sh scripts/release-evidence.sh scripts/verify-release-evidence.sh` 通过。
- `node --check scripts/run-llm-provider-eval.mjs` 通过。
- `git diff --check -- scripts/security-regression-check.sh scripts/release-evidence.sh scripts/run-llm-provider-eval.mjs` 通过。
- 人为低 timeout 场景必须非 0 退出，输出最后阶段和 `TIMEOUT`，不得打印 `Security regression checks passed.`。
- `node scripts/llm-provider-eval-mock-smoke.mjs` 通过，证明 request timeout 字段不破坏 provider run validator。
- `SOURCELENS_RELEASE_EVIDENCE_PROFILE=ci ... ./scripts/release-evidence.sh && ./scripts/verify-release-evidence.sh ...` 通过。
- 完整 `SOURCELENS_SECURITY_REGRESSION_ASSERT_PROGRESS_INTERVAL=500 ./scripts/security-regression-check.sh` 通过并打印最终 `Security regression checks passed.`。

量化记录：

- 本轮完整安全回归耗时约 `691s`，输出 `step=1280` 后通过。
- 最重阶段集中在 public repo UI / report evidence / scan governance forged marker 矩阵，后续必须拆分为可并行或可分段 required 子门禁。

非范围：

- 不降低 verifier forged marker 断言强度。
- 不删除 GitHub App / GitHub webhook / LLM provider 高级集成层。
- 不刷新 full release authority；当前 full authority 仍为 `release-evidence/release-current-schema-20260702-230650`。

## P11 增量：Security regression suite matrix split

目标：在不降低默认 full 安全回归覆盖率的前提下，把 `security-regression-check.sh` 拆成可单独运行、可 CI 并行、可定位瓶颈的 required suite matrix。

Must：

- `./scripts/security-regression-check.sh` 无参数必须继续等价于 `full`，不得默认降级为静态门禁或抽样门禁。
- 必须支持 `SOURCELENS_SECURITY_REGRESSION_SUITE` 和 `--suite` 显式选择；未知 suite 必须 fail-closed。
- 必须至少提供：`static`、`llm-provider`、`release-evidence-profile`、`release-verifier-forgery`、`release-verifier-integrity`、`integration-drill`。
- suite 选择时，静态安全契约仍必须运行；不属于当前 suite 的动态探针必须明确输出 `SKIP ... suite=<name>`，不得静默跳过。
- `make verify` / `scripts/verify-all.sh` 必须保持 full 安全回归语义，不得因为 CI matrix 拆分而降低本地总验收。
- Makefile 必须暴露 `security-regression-check SUITE=<suite>` 和常用 suite target。
- CI `security` job 必须使用 suite matrix；每个 matrix job 仍必须 `persist-credentials: false`、只读权限、无 repository secrets、无 `pull_request_target`。
- `security-regression-check.sh` 必须静态锁住 suite selector、CI matrix、Makefile target 和 SHA-pinned action 数量。

验收：

- `bash -n scripts/security-regression-check.sh scripts/verify-all.sh` 通过。
- `./scripts/security-regression-check.sh --suite does-not-exist` 非 0 退出，并说明允许的 suite。
- `./scripts/security-regression-check.sh --suite static` 通过，约 `12s`。
- `./scripts/security-regression-check.sh --suite llm-provider` 通过，约 `26s`。
- `./scripts/security-regression-check.sh --suite release-evidence-profile` 通过，约 `52s`。
- `./scripts/security-regression-check.sh --suite release-verifier-forgery` 通过，约 `510s`。
- `./scripts/security-regression-check.sh --suite release-verifier-integrity` 通过，约 `153s`。
- `./scripts/security-regression-check.sh --suite integration-drill` 通过，约 `12s`。

量化记录：

- `release-verifier-forgery` 仍是最慢 suite；耗时集中在 public repo UI、report evidence drawer、scan governance timeline forged marker matrix。
- 本轮 matrix 拆分解决了“全量 691s 无法定位”的问题，但 `release-verifier-forgery` 后续仍必须继续二级拆分为更细的 UI marker suites。

非范围：

- 不删除任何 forged marker case。
- 不把 CI matrix 的某个短门禁当成 full release authority。
- 不刷新 full release authority；当前 full authority 仍为 `release-evidence/release-current-schema-20260702-230650`。

## P11 增量：Release verifier forgery second-level matrix split

目标：继续压缩 `release-verifier-forgery` 的单点耗时和故障定位范围，把原 510 秒聚合 forged marker suite 拆成更细的 release verifier marker suite，同时保留旧 suite 作为兼容聚合入口。

Must：

- `release-verifier-forgery` 必须继续存在，且必须聚合所有二级 forged marker suite，保证本地兼容和 full 语义不降级。
- CI `security` matrix 不应再直接运行 `release-verifier-forgery` 聚合块；应运行二级 suite，降低单 job timeout 和定位成本。
- 必须至少拆出：
  - `release-verifier-public-repo-marker`
  - `release-verifier-public-repo-ui-marker`
  - `release-verifier-autorepair-ui-marker`
  - `release-verifier-dashboard-ui-marker`
  - `release-verifier-report-evidence-marker`
  - `release-verifier-scan-governance-marker`
- 每个二级 suite 必须有 Makefile target、CI matrix row、selector case 和 static self-check。
- 未知 suite 必须继续 fail-closed，并输出包含全部二级 suite 的允许列表。
- 不得修改 `verify-release-evidence.sh` 的 verifier 合同；本轮只做执行矩阵拆分。

验收：

- `bash -n scripts/security-regression-check.sh scripts/verify-all.sh scripts/release-evidence.sh scripts/verify-release-evidence.sh` 通过。
- `./scripts/security-regression-check.sh --suite release-verifier-nope` 非 0 退出，并输出包含二级 suite 的允许列表。
- `SOURCELENS_SECURITY_REGRESSION_ASSERT_PROGRESS_INTERVAL=500 ./scripts/security-regression-check.sh --suite static` 通过，约 `12s`。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker` 通过，约 `73s`。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker` 通过，约 `211s`。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-autorepair-ui-marker` 通过，约 `37s`。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-dashboard-ui-marker` 通过，约 `30s`。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` 通过，约 `87s`。
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-scan-governance-marker` 通过，约 `36s`。

量化记录：

- 原 `release-verifier-forgery` 聚合 suite 最近一次 PASS 约 `510s`。
- 二级拆分后最重项为 `release-verifier-public-repo-ui-marker`，约 `211s`，仍可继续作为后续优化对象。
- 本轮二级 suite 合计仍接近原 forged marker 覆盖量，但 CI 可以并行执行并准确暴露失败类别。

非范围：

- 不删除任何 forged marker case。
- 不改变 release evidence schema、verifier schema 或 current full authority。
- 不刷新 full release authority；当前 full authority 仍为 `release-evidence/release-current-schema-20260702-230650`。

## P6/P9 增量：Project QA source-file match release marker

目标：把 Project QA 的 `来源文件匹配说明` 从可见 UI 文案升级为 public repo UI release marker 的结构化、可防伪、可追踪 proof，服务报告引用质量、AutoRepair 候选来源可信度和发布证据链。

Must：

- `public-repo-ui-smoke.spec.ts` 必须输出 `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.sourceFileMatchRelease`。
- marker 只能包含布尔、数字或枚举 proof，不得包含 raw prompt、raw answer、源码内容、URL query/hash、token、authorization 或敏感凭据。
- proof 至少覆盖：
  - `surface=PROJECT_QA_SOURCE_FILE_MATCH_RELEASE`
  - `releaseState=READY`
  - `sourceEvidenceMatchTypes=["REPORT_LINE_ANCHOR"]`
  - `pathMatchType=PATH_SUFFIX`
  - `requiredEvidenceCovered=true`
  - `primaryClaimBound=true`
  - `readyForAutoRepair=true`
  - `nextActionKey=AUTO_REPAIR_REVIEW`
  - `providerQualityClaim=false`
  - `llmFactClaim=false`
- release verifier 必须在该字段出现时 fail-closed 校验，并交叉检查：
  - `qaFromEvidence.evidenceRef.requestBound/responseBound/contextVisible`
  - `qaFromEvidence.evidenceHandoff.sourceLocationConfidenceVisible/sourceLocationConfidenceReadyVisible/readyForAutoRepair`
  - `qaFromEvidence.citationCoverage` required evidence coverage
  - `qaFromEvidence.claimCitationCoverage` READY + PRIMARY_BOUND
  - `qaFromEvidence.crossFileCitationSummary.sourceEvidenceMatchTypes`
- security regression 必须拒绝 forged marker，包括：status/surface/scan mismatch、file anchor 冒充 line anchor、filename-only 冒充 path suffix、required evidence uncovered、PRIMARY unbound、AutoRepair not ready、provider/LLM overclaim、raw answer/token 字段。
- 旧/current full authority 暂时兼容缺字段；下一次真实 live public repo UI authority refresh 后，再升级为 required evidence。

验收：

- `bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh scripts/public-repo-analysis-smoke.sh` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260702-230650` 通过。
- `cd web-console && SL_PUBLIC_REPO_UI_PROJECT_ID=1 SL_PUBLIC_REPO_UI_REPOSITORY_ID=1 SL_PUBLIC_REPO_UI_SCAN_TASK_ID=1 SL_PUBLIC_REPO_UI_TOKEN=dummy npm exec -- playwright test -c playwright.public-repo-ui.config.ts --list` 通过并列出 1 条测试。
- `./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker` 通过。

量化记录：

- 本轮 public repo UI marker security suite PASS，耗时约 `246s`。
- current full authority verifier 继续 PASS，证明 optional-present strict 没破坏历史证据包。

非范围：

- 不刷新 full release authority。
- 不改后端 API、DB schema、embedding、retrieval/ranker 或 AutoRepair hard gate。
- 不声称 LLM 事实语义正确；只证明来源绑定和修复候选入口的结构性成熟。

## P6/P9 增量：Source-file match live public repo UI evidence

目标：在真实公开仓库扫描、真实后端、真实浏览器 UI 路径下验证 `qaFromEvidence.sourceFileMatchRelease`，关闭上一阶段“只有合同和静态证明，没有 live marker”的缺口。

Must：

- 必须使用最新源码后端或明确可追溯的最新稳定 jar；旧 Docker backend 不得作为最新源码验收基准。
- `PUBLIC_REPO_UI_SMOKE_OK` 必须来自真实 public repo UI smoke，不得用 Playwright `--list`、mock smoke 或 security regression fixture 替代。
- marker 必须包含并满足：
  - `qaFromEvidence.sourceFileMatchRelease.status=OK`
  - `surface=PROJECT_QA_SOURCE_FILE_MATCH_RELEASE`
  - `releaseState=READY`
  - `sourceEvidenceMatchTypes=["REPORT_LINE_ANCHOR"]`
  - `pathMatchType=PATH_SUFFIX`
  - `requiredEvidenceCovered=true`
  - `primaryClaimBound=true`
  - `readyForAutoRepair=true`
  - `nextActionKey=AUTO_REPAIR_REVIEW`
  - `providerQualityClaim=false`
  - `llmFactClaim=false`
  - `noHorizontalOverflow=true`
- 同轮外层 `PUBLIC_REPO_SMOKE_OK` 必须仍通过 artifact quality、report quality、code_chunks、QA citation、governance seed 等现有门槛。
- 若 UI 面板内同一证据文本有多处展示，测试应验证区域包含对应锚点，不应因为 strict locator duplicate 造成 false negative。
- standalone live marker 只能证明 live path 跑通；必须通过新的 release evidence package 吸收后，才允许将 verifier 从 optional-present strict 升级为 required evidence。

验收：

- `node scripts/validate-frontend-ui.mjs` 通过。
- `SOURCELENS_BASE_URL=http://127.0.0.1:8080 SOURCELENS_PUBLIC_REPO_SMOKE_UI=true SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=true SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=600 ./scripts/public-repo-analysis-smoke.sh` 通过。
- 输出唯一可信的 `PUBLIC_REPO_UI_SMOKE_OK`，并能在 marker 中看到 `sourceFileMatchRelease.status=OK`。
- 输出外层 `PUBLIC_REPO_SMOKE_OK`，artifact quality 7/7 OK。

量化记录：

- 本轮 live marker 样本：`projectId=325`、`repositoryId=286`、`scanTaskId=242`。
- `PUBLIC_REPO_UI_SMOKE_OK` 覆盖 viewport：`1440x900`、`390x844`、`320x740`。
- `PUBLIC_REPO_SMOKE_OK`：7 artifacts、17,001 chunks、15,727 symbols、440 relations、`reportQuality.confidence=74`、artifact quality OK。
- Docker backend `8081` 样本曾失败于 `ARCHITECTURE_REPORT.reportQuality is missing or not an object`，判定为 stale runtime，不作为当前源码验收失败。

非范围：

- 不刷新 full release authority；当前仍为 `release-evidence/release-current-schema-20260702-230650`。
- 不把 standalone live smoke 等同于 release evidence package。
- 不证明真实 LLM provider 质量、GitHub App E2E、生产灾备、私有仓库或完整语义正确性。

## P6/P11 增量：Source-file match focused release evidence absorption

目标：把上一阶段真实 public repo standalone live marker 吸收到可校验的 release evidence package，并保持 current full authority 不被局部证据误替换。

Must：

- 必须使用最新可追溯运行时生成 evidence；本轮指定 stable `backend-jar` runtime，禁止把旧 Docker backend `8081` 或 `spring-boot:run target/classes` 运行产物作为 release evidence 基准。
- Focused package 必须包含同轮 `PUBLIC_REPO_SMOKE_OK` 和 `PUBLIC_REPO_UI_SMOKE_OK`，且二者绑定同一组 `projectId/repositoryId/scanTaskId`。
- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.sourceFileMatchRelease` 必须满足：
  - `status=OK`
  - `surface=PROJECT_QA_SOURCE_FILE_MATCH_RELEASE`
  - `currentScanOnly=true`
  - `releaseState=READY`
  - `sourceEvidenceMatchTypes=["REPORT_LINE_ANCHOR"]`
  - `pathMatchType=PATH_SUFFIX`
  - `requiredEvidenceCovered=true`
  - `primaryClaimBound=true`
  - `readyForAutoRepair=true`
  - `nextActionKey=AUTO_REPAIR_REVIEW`
  - `providerQualityClaim=false`
  - `llmFactClaim=false`
  - `noHorizontalOverflow=true`
- Release verifier 必须通过 focused package，并且 current full authority `release-evidence/release-current-schema-20260702-230650` 继续通过，证明 optional-present strict 没破坏历史 full authority。
- Security regression focused suite 必须继续拒绝 forged public repo UI marker，包括 scan mismatch、file anchor 冒充 line anchor、filename-only、required evidence uncovered、PRIMARY unbound、AutoRepair not ready、raw answer/token、provider/LLM overclaim。
- 在未刷新完整 full authority 前，不得把 `sourceFileMatchRelease` 升级为全局 required evidence。

验收：

- `./scripts/verify-release-evidence.sh release-evidence/p6-source-file-match-live-20260703-0841` 通过。
- `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260702-230650` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker` 通过。
- `release-evidence/p6-source-file-match-live-20260703-0841/public-repo-smoke.log` 中存在 `PUBLIC_REPO_UI_SMOKE_OK`、`PUBLIC_REPO_SMOKE_OK`、`sourceFileMatchRelease` 和 `PROJECT_QA_SOURCE_FILE_MATCH_RELEASE`。

量化记录：

- Focused package：`release-evidence/p6-source-file-match-live-20260703-0841`。
- Package summary：`required_failures=0`、`optional_warnings=0`、`skipped=21`。
- 同轮样本：`projectId=326`、`repositoryId=287`、`scanTaskId=243`。
- `PUBLIC_REPO_UI_SMOKE_OK` 覆盖 viewport：`1440x900`、`390x844`、`320x740`。
- `PUBLIC_REPO_SMOKE_OK`：7 artifacts、17,001 chunks、15,727 symbols、440 relations、`reportQuality.confidence=74`、artifact quality OK。
- Security focused suite 耗时约 `227s`，仅本地 `tar: Failed to set default locale` warning。

非范围：

- 不刷新 current full release authority；当前仍为 `release-evidence/release-current-schema-20260702-230650`。
- 不证明生产灾备、回滚签署、GitHub App/Webhook E2E、真实 LLM provider 质量或完整语义正确性。
- 不改 API/DB/retrieval/ranker/AutoRepair hard gate；本轮只吸收 source-file match release evidence。

## P6 增量：Package-aware method anchor disambiguation

目标：让 Project QA / code_chunks 检索在 Java/Kotlin stack trace 或 qualified method reference 中保留 package/root 信息，避免多个同名类时只靠 basename、method 和 line 误选文件。

Must：

- `CodeLocationHintParser` 必须保留 `at com.acme.billing.service.AuthService.validateJwt(AuthService.java:85)` 中的完整限定类名。
- `methodAnchorFileHints` 必须从 FQCN 派生 package path suffix variants，例如：
  - `com/acme/billing/service/AuthService.java`
  - `acme/billing/service/AuthService.java`
  - `billing/service/AuthService.java`
  - `service/AuthService.java`
  - `AuthService.java`
- `CodeChunkRanker.methodHintScore` 必须让 package-aware suffix 高于同名 basename/method/line decoy。
- `CodeChunkService.listRetrievalCandidates` 必须能通过 method anchor candidates 把正确 package path 的 chunk 补进 Project QA 候选池。
- 无 package 的 `Class#method`、`Class::method`、`AuthService.validate(...)` 必须保持原行为。
- 不访问 URL，不做 source map 反解，不新增 DB/API/release schema，不把该能力宣称为 LLM 事实正确。

验收：

- `CodeLocationHintParserTest` 覆盖 FQCN package path variants。
- `CodeQaRetrievalServiceTest` 覆盖同名 `AuthService.java` 不同 package，必须选中 FQCN 指向的文件。
- `CodeChunkServiceTest` 覆盖 Project QA 候选池能用 package-aware method anchor 补召回目标。
- `CodeChunkControllerTest` 和 `CodeQaControllerTest` 继续通过，证明 controller/API 行为未回归。
- `security-regression-check.sh --suite static` 继续通过。
- current full authority verifier 继续通过。

量化记录：

- 本轮新增 3 个 focused backend tests。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeChunkControllerTest,CodeQaRetrievalServiceTest,CodeQaControllerTest test` 通过。
- `./scripts/security-regression-check.sh --suite static` 通过。
- `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260702-230650` 通过。

非范围：

- 不刷新 full release authority；当前仍为 `release-evidence/release-current-schema-20260702-230650`。
- 不证明普通 basename-only 输入可唯一 disambiguate。
- 不生成 focused release evidence package；后续若要证明真实公开仓库 live 行为，需要 stable backend runtime + public repo smoke。

## P6 增量：Code QA ambiguous short evidence path fail-closed

目标：当报告证据只提供 basename 或短 suffix，而当前扫描中存在多个 root/模块下的同名文件时，Project QA 必须 fail-closed，避免把错误文件提升为来源锚点或 AutoRepair 候选依据。

Must：

- `CodeQaController.sourceEvidenceMatchType` 必须区分 exact path match 与 non-exact suffix/basename match。
- 如果 `evidenceRef.filePath` 是 `AuthService.java`、`service/AuthService.java` 等非 exact 短路径，并且命中多个 distinct chunk path，响应必须返回：
  - `sourceEvidenceMatched=false`
  - `sourceEvidenceMatchType=NONE`
- 该歧义场景不得返回 `REPORT_FILE_ANCHOR`，即使候选文件名或短目录后缀一致。
- 该歧义场景不得产生 evidence-driven PRIMARY；retrieved chunks 必须保留为上下文候选，供用户复核。
- `toRetrievedChunks` 不得把空 PRIMARY 集合解释成所有 chunk 都是 PRIMARY。
- ProjectDetail 来源文件匹配说明必须以后端 `sourceEvidenceMatched=true` 作为可信匹配门禁；短路径/同名候选只能显示复核或未闭环状态。
- 不新增 API enum，不改 DB schema，不改 AutoRepair hard gate，不访问外部 URL，不记录 raw prompt、raw answer、源码大段、URL query/hash 或 token。

验收：

- `CodeQaControllerTest` 必须覆盖 basename multi-root fail-closed。
- `CodeQaControllerTest` 必须覆盖 short suffix multi-root fail-closed。
- 两个 fail-closed case 必须断言：
  - `sourceEvidenceMatched=false`
  - `sourceEvidenceMatchType=NONE`
  - candidate chunks 均为 `ADJACENT_CONTEXT`
  - `citationCoverage.primaryEvidenceCount=0`
  - `citationCoverage.coverageScope=ALL`
  - `claimCitationCoverage.roleDistribution.status=CONTEXT_ONLY`
- 既有 unique suffix / source URL positive case 必须继续通过，防止过度收紧。
- Frontend validator 和 build 必须通过，证明 UI 文案和门禁没有破坏现有来源文件匹配说明。
- `security-regression-check.sh --suite static` 和 current full authority verifier 必须通过。

量化记录：

- 本轮新增 2 个 focused backend tests。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test` 通过。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeChunkControllerTest,CodeQaRetrievalServiceTest,CodeQaControllerTest test` 通过。
- `node scripts/validate-frontend-ui.mjs` 通过。
- `npm --prefix web-console run build` 通过。
- `./scripts/security-regression-check.sh --suite static` 通过。
- `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260702-230650` 通过。

非范围：

- 不证明 basename-only 输入可以唯一定位。
- 不刷新 full release authority；当前仍为 `release-evidence/release-current-schema-20260702-230650`。
- 不生成 focused release evidence package；真实 public repo live 行为后续单独吸收。
- 不证明 LLM 回答事实语义正确；本轮只证明来源定位边界更保守。

## P6 增量：Report evidence full source URL normalization and suffix recall

目标：当报告证据 `evidenceRef.filePath` 来自浏览器/Vite 完整 source URL 时，Code QA 必须把 host、port、query/hash、line/column 噪声归一为安全相对路径，并在候选召回阶段优先利用可消歧的路径 suffix，避免退化为 basename-only 匹配。

Must：

- `CodeLocationHintParser.evidenceFilePathHints` 必须对 `filePath: http://localhost:5173/src/pages/ProjectDetail.tsx?t=...:245:19` 输出 `src/pages/ProjectDetail.tsx`，不得保留 host、port、query/hash 或 line/column。
- `CodeQaController.normalizeEvidencePath` 必须使用同等 source URL 归一化规则，使完整 URL evidenceRef 能匹配 repo 内部 `web-console/src/pages/ProjectDetail.tsx`。
- `CodeChunkService` 的 report evidence filePath anchor 候选召回必须在 exact path 后、basename fallback 前增加 suffix path match；hint 含 `/` 时可以使用 path suffix 召回。
- unique suffix positive case 必须保持 `REPORT_LINE_ANCHOR` 和 `PRIMARY`；multi-root basename/short suffix ambiguity 仍必须 fail-closed。
- 不新增 API enum、DB schema、embedding/rerank 权重、source map 反解、外部 URL 访问或 release marker raw URL 字段。

验收：

- `CodeLocationHintParserTest.evidenceFilePathHints_shouldStripFullSourceUrlHostPortQueryAndLine` 必须通过。
- `CodeChunkServiceTest.listRetrievalCandidates_shouldUseEvidenceFilePathSuffixBeforeBasenameFallback` 必须通过。
- `CodeQaControllerTest.codeQa_shouldMatchReportEvidenceRefWithFullViteSourceUrl` 必须通过。
- `CodeQaControllerTest.codeQa_shouldKeepLineAnchorForUniqueShortSuffixEvidencePath` 必须通过。
- 既有 ambiguous basename / short suffix fail-closed tests 必须继续通过。

量化记录：

- 本轮新增 4 个 focused backend tests。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test` 通过。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaRetrievalServiceTest,CodeLocationHintParserTest,CodeQaControllerTest,CodeChunkServiceTest,CodeChunkControllerTest,CodeChunkFileFilterTest test` 通过。

非范围：

- 不刷新 full release authority。
- 不证明真实 public repo live 行为；后续如要吸收，需用 stable backend runtime + focused public repo smoke。
- 不证明 LLM 回答事实正确；本轮只证明 report evidence source URL path anchor 的归一化、召回和匹配合同。

## P6 增量：Report evidence line mismatch review boundary

目标：当报告证据提供 `evidenceRef.lineNumber`，且 `filePath` 能匹配 retrieved chunks 但没有任何同文件 chunk 覆盖该行号时，SourceLens 必须把该结果作为文件级复核，而不是行级闭环或可直接修复依据。

Must：

- `sourceEvidenceMatchType` 保持 `REPORT_FILE_ANCHOR`，用于表达“文件级来源可复核”；不得升级为 `REPORT_LINE_ANCHOR`。
- `sourceEvidenceMatched=true` 只表达同文件闭环，不表达行号闭环；前端/AutoRepair 必须继续依赖 `REPORT_LINE_ANCHOR` 才能放行修复候选。
- 如果 `lineNumber` 可解析但没有任何同文件 chunk `startLine/endLine` 覆盖该行，`primaryChunkKeys` 必须返回空集，不得把第一个同文件 chunk 提升为 `PRIMARY`。
- 该场景下 retrieved chunks 必须保留为 `ADJACENT_CONTEXT`，`citationCoverage.primaryEvidenceCount=0`，`coverageScope=ALL`，`claimCitationCoverage.roleDistribution.status=CONTEXT_ONLY`。
- AutoRepair provenance 如果携带 `sourceEvidenceLineNumber` 且 `sourceEvidenceMatchType=REPORT_FILE_ANCHOR`，server-derived `repairEvidenceGate` 必须为 `REVIEW`，不得为 `READY`。

验收：

- `CodeQaControllerTest.codeQa_shouldKeepLineMismatchedReportEvidenceAsContextOnlyFileAnchor` 必须通过。
- `AutoRepairServiceTest.createRepairTask_withFileOnlyQaCitationProvenance_shouldAuditReviewGate` 必须覆盖 `sourceEvidenceLineNumber` 且仍返回 `REVIEW`。
- 既有 line anchor positive、file anchor no-line positive、short path ambiguity fail-closed tests 必须继续通过。

量化记录：

- 本轮新增 1 个 focused Code QA backend test，并补强 1 个 AutoRepair provenance gate test。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test` 通过。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaRetrievalServiceTest,CodeLocationHintParserTest,CodeQaControllerTest,CodeChunkServiceTest,CodeChunkControllerTest,CodeChunkFileFilterTest test` 通过。
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeLocationHintParserTest,AutoRepairServiceTest test` 通过。

非范围：

- 不新增 API enum、DB schema、AutoRepair hard gate 字段或前端新面板。
- 不刷新 full release authority。
- 不证明真实 public repo live behavior 或 LLM 事实正确。

## P9 增量：Project QA Answer-First Evidence Dedup

目标：Project QA 必须优先服务“读懂回答”，再服务“复核证据”。证据、审计和修复门禁必须增强信任，而不是把回答正文压到用户视野之后。

Must：

- assistant 回复中，回答正文必须出现在详细证据卡片和审计面板之前；顶部可保留紧凑 grounding/status tags。
- `answerCitations` 中已经展示的同一 `sourceLabel + filePath + startLine + endLine`，不得再作为 `retrievedChunks` 代码切片主卡重复展示。
- `retrievedChunks` 区域只能展示补充候选，或显示“补充 code_chunks N 条”；若已有引用被去重，必须显示“已引用证据 N 条不再重复展示”。
- code_chunks 搜索结果字段必须中文可读：`证据说明 / 命中词 / 证据编号 / 文件路径 / 行号范围 / 证据角色 / 证据类型 / 相关分 / 召回方式`。
- code_chunks 行号必须用用户可读中文格式展示，例如 `第 51-89 行`；分数展示使用 `相关分 N`。
- `跨文件证据组合` 这类可能过度承诺的文案必须改为 `跨文件复核路径` 或等价保守文案，避免把当前可见结果集包装成事实证明。
- 720px 以下 assistant bubble 必须使用可用宽度，避免 answer citation 和 code chunk cards 被二次压缩。
- answer citation、evidence combination、search summary 中的长 tag 必须支持换行，不得只靠无横向溢出掩盖文字裁切。
- 修复候选 READY/REVIEW/BLOCKED 门禁不得因展示层调整而放宽。

验收：

- `make frontend-ui-check` 通过。
- `CI=true npm --prefix web-console run smoke:project-qa-recoverable` 通过，成功 marker 必须包含：
  - `PROJECT_QA_RECOVERABLE_SMOKE_OK`
  - `mockedApiOnly=true`
  - `unhandledApiRequests=0`
  - `viewports=["1440x900","390x844","320x740"]`
  - `answerReadability.answerContentBeforeEvidenceDetails=true`
  - `answerReadability.duplicateRetrievedChunkDeduped=true`
  - `codeChunkEvidenceCard.localizedLabels=true`
  - `codeChunkEvidenceCard.textNotClipped=true`
  - `codeChunkEvidenceCard.mobile390Covered=true`
- `npm --prefix web-console run build` 通过。
- `CI=true make app-shell-ui-smoke` 通过，证明全局 shell 和 `/projects/:id` 没有因 Project QA 改动回退。

非范围：

- 不改后端 RAG、citation、sourceEvidenceMatchType、AutoRepair gate、DB 或 API schema。
- 不刷新 full release authority；当前仍为 `release-evidence/release-current-schema-20260702-230650`。
- 不证明 LLM 回答事实语义正确；本轮只证明 Project QA 阅读层级和证据去重体验更合理。

## P9 增量：App Shell Three-Viewport Readability Guard

目标：把用户反馈的“浏览器顶部字看不全、按钮文字看不清”转成可重复验证的前端质量门禁，并把 ProjectDetail 主链路纳入全局 App Shell smoke。

Must：

- App Shell UI smoke 必须覆盖 `1440x900`、`390x844`、`320x740` 三类 viewport。
- App Shell route matrix 必须覆盖 `/projects/:id`，不能只覆盖 `/projects` 列表页。
- `/projects/:id` smoke 必须 mock `GET /api/projects/{id}`、`GET /api/projects/{id}/repositories`、`GET /api/projects/{id}/scan-tasks`，并证明页面主标题、topbar 和主按钮可读。
- topbar title/desc 必须使用显式 line-height、min-height 和 padding，避免 Ant Design Header 默认 line-height 或浏览器顶部导致标题裁切。
- Project cockpit dark hero 内 disabled button 必须保持足够文本对比度，且 `color` 与 `-webkit-text-fill-color` 均不得退回低对比灰字。
- Project cockpit status 行不得使用 `nowrap + ellipsis + hidden` 隐藏仓库、扫描和 knowledge source 上下文；长不可断 token 必须在 `1440/390/320` 三视口内换行且不横向溢出。
- Project next action 的 disabled default action 必须在暗色面保持可读颜色，且 label 不能水平或垂直裁切。
- Dashboard、Project、Scan、Graph、Execution、Agent、Artifacts、Audit、CI、PR、Issue、AutoRepair 等核心页面 status line 必须共享 late wrap/no-ellipsis guard，避免局部旧 selector 继续裁切关键状态。
- 720px 以下 `.sl-analysis-readiness-actions` 必须纵向堆叠并拉伸内部 Ant Space，避免多个操作挤在同一行。
- 360px 以下 `.sl-action-button` 和 `.sl-app-shell .ant-btn` 必须允许自适应高度，标签允许换行并用 scroll/client 尺寸证明没有水平或垂直裁切。
- primary button smoke 必须同时验证 button root、label、icon wrapper 和 visible SVG paint nodes 保持白色，并验证 label text 不被裁切。

验收：

- `make frontend-ui-check` 通过。
- `make app-shell-ui-smoke` 通过，成功 marker 必须包含：
  - `APP_SHELL_UI_SMOKE_OK`
  - `mockedApiOnly=true`
  - `unhandledApiRequests=0`
  - `viewports=["1440x900","390x844","320x740"]`
  - routes 至少包含 `/dashboard`、`/projects`、`/projects/1`、`/agent-chat`、`/audit-logs?projectId=1`、`/model-config`
  - assertions 至少包含 `topbar-title-scroll-size-within-box`、`page-heading-scroll-size-within-box`、`primary-button-label-scroll-size-within-box`、`no-horizontal-overflow`
  - layoutGuards 至少包含 `project-cockpit-status-wraps-without-ellipsis`、`core-route-status-lines-wrap-without-ellipsis`、`project-next-action-disabled-buttons-readable-on-dark-surface`
  - guardedStatusLineCount 必须大于等于 12；当前 smoke 实测为 30。
- `npm --prefix web-console run build` 通过。

量化记录：

- 本轮基准：13 routes * 3 viewports = 39 route-viewport combinations。
- 本轮不要求 full release refresh，不替换 `release-evidence/release-current-schema-20260702-230650`。
- 本轮不证明所有深层页面已经完成大厂级 UI；后续仍需逐页治理表格、证据卡片、详情抽屉、错误态和移动端操作区。

## P9 增量：AutoRepairs Three-Viewport Detail Readability Guard

目标：AutoRepair `PATCH_READY` 详情页必须在创建 PR 前提供可读、可审计、source-bound 的补丁证据闭环，避免移动端文字裁切、关键证据 ellipsis 和旧 execution detail 污染当前 repair。

Must：

- `PATCH_READY` AutoRepair 详情必须覆盖 `1440x900`、`390x844`、`320x740` 三视口。
- `executionDetail` 请求必须有当前 repair 绑定防线；旧请求不能覆盖新选中 repair。
- `repairReadiness`、`patchReadyReviewGate`、`selectedExecutionUrl`、`AutoRepairAttemptTimeline` 必须只使用 `executionDetail.task.sourceId === selected.id` 的 detail。
- `handleSubmitPr` 必须在点击确认时重新计算 source-bound PR review gate；不满足 gate 时 fail closed，不得调用 submit-pr。
- review checklist、candidate receipt、PR gate、PR Popconfirm 内的长 target file、target desc、candidate gate reason、patch evidence summary 不得用 ellipsis 隐藏关键证据。
- AutoRepair table 的横向 overflow 必须归属 `.sl-autorepair-table-card .ant-table-content`，不能退化为页面级横向溢出。
- PR Popconfirm 在 320/390 下必须保持在 viewport 内，且取消不得触发 submit-pr。
- PATCH_READY audit drawer 的 Sanitized Input 默认收起时，smoke 必须先按真实用户路径展开后再检查 `scanTaskId` 与 `patchArtifactPath`。
- Primary button label 与 icon/SVG 必须保持白字，label 不得水平或垂直裁切。

验收：

- `make frontend-ui-check` 通过。
- `CI=true make patch-ready-ui-smoke` 通过，成功 marker 必须包含：
  - `PATCH_READY_UI_SMOKE_OK`
  - `mockedApiOnly=true`
  - `unhandledApiRequests=0`
  - `viewports=["1440x900","390x844","320x740"]`
  - `layoutDensity.mobile390Covered=true`
  - `layoutDensity.narrow320Covered=true`
  - `layoutDensity.detailCardContained=true`
  - `layoutDensity.reviewChecklistContained=true`
  - `layoutDensity.sourceBridgeContained=true`
  - `layoutDensity.tableScrollerContained=true`
  - `layoutDensity.prPopconfirmContained=true`
  - `layoutDensity.noHorizontalOverflow=true`
  - `mobileReadability.criticalTextsWrap=true`
  - `mobileReadability.targetFileNotClipped=true`
  - `mobileReadability.reviewGateTextNotClipped=true`
  - `mobileReadability.candidateReceiptTextNotClipped=true`
  - `mobileReadability.prConfirmTextNotClipped=true`
  - `mobileReadability.primaryButtonLabelNotClipped=true`
  - `mobileReadability.primaryButtonLabelIconSvgWhite=true`
  - `tableScroller.containedInViewport=true`
  - `tableScroller.overflowXAuto=true`
  - `executionDetailGuard.selectedDetailSourceBound=true`
  - `executionDetailGuard.staleExecutionDetailRejected=true`
  - `runtimeIssues=0`
  - `noHorizontalOverflow=true`
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-autorepair-ui-marker` 通过。
- `npm --prefix web-console run build` 通过。
- `bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh` 通过。
- scoped `git diff --check` 通过。

非范围：

- 不改后端 API、DB schema、PR 创建语义、GitHub App/webhook E2E、真实 LLM provider。
- 不把 Candidate Receipt 升级为 PR hard gate；它仍是来源复核凭证。
- 不刷新 full release authority；但由于本轮升级 `PATCH_READY_UI_SMOKE_OK` verifier 合同，下一次发布前必须重跑完整 release evidence。

量化记录：

- 本轮基准：1 PATCH_READY smoke * 3 viewports，覆盖 patch-ready repair 与 missing-evidence blocked repair。
- Release verifier forged cases 覆盖缺 layout/mobile/table/executionDetailGuard、runtime 非 0、noHorizontalOverflow false 等缩减证据。

## P9 增量：AutoRepair Candidate Form / QA Handoff Three-Viewport Readability Gate

目标：从 Project QA 已验证引用或扫描报告风险进入 AutoRepair 创建弹窗时，用户必须在提交前看清候选来源、Scan、目标文件、引用/风险字段和报告证据，避免把不可追溯候选误提交给自动修复。

Must：

- AutoRepair 创建 Modal 必须有 scoped class，便于 CSS 和 smoke 精准约束。
- 创建 Modal 必须展示 `Candidate Draft Receipt / 修复候选草稿凭证`，只展示白名单来源字段，不展示完整问题、回答、原始代码或 prompt。
- Project QA verified citation candidate smoke 必须覆盖 `1440x900`、`390x844`、`320x740`。
- Report risk candidate smoke 必须覆盖 `1440x900`、`390x844`、`320x740`。
- 两条 smoke 都必须证明 create modal、draft receipt、candidate receipt、action rail 在移动端不越界，关键长文本不裁切。
- 两条 marker 都必须包含 `layoutDensity`、`mobileReadability`、`qaHandoff`。
- `scripts/validate-frontend-ui.mjs` 必须锁住 modal/CSS/smoke/marker 合同。

验收：

- `make frontend-ui-check` 通过。
- `CI=true make project-qa-autorepair-candidate-ui-smoke` 通过，成功 marker 必须包含：
  - `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK`
  - `viewports=["1440x900","390x844","320x740"]`
  - `createRequestCount=3`
  - `qaRequestCount=12`
  - `layoutDensity.mobile390Covered=true`
  - `layoutDensity.actionRailContained=true`
  - `mobileReadability.candidateReceiptTextNotClipped=true`
  - `mobileReadability.actionButtonsNotClipped=true`
  - `qaHandoff.qaDeepLinkBound=true`
  - `qaHandoff.noRawPromptOrAnswer=true`
- `CI=true make report-autorepair-candidate-ui-smoke` 通过，成功 marker 必须包含：
  - `REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK`
  - `viewports=["1440x900","390x844","320x740"]`
  - `createRequestCount=3`
  - `layoutDensity.mobile390Covered=true`
  - `mobileReadability.sourceCredentialReadable=true`
  - `qaHandoff.sourceTypeVisible=true`
- `npm --prefix web-console run build` 通过。

非范围：

- 不改后端、DB、API、PR hard gate、GitHub App E2E。
- 不升级 release verifier 或 security forged marker；本轮只作为 focused UI readability gate。
- 不刷新 full release authority。

量化记录：

- 本轮基准：2 candidate smoke * 3 viewports = 6 route-flow viewport runs。
- Project QA candidate flow 每轮提交 4 个 QA 问题，三视口共 `qaRequestCount=12`，只允许 1 个 verified+cited flow 进入 AutoRepair 创建。
- Report candidate flow 每视口创建 1 个 candidate，三视口共 `createRequestCount=3`。

## P9 增量：Report Evidence Drawer Three-Viewport Readability Gate

目标：报告证据抽屉必须在报告证据、code_chunks、引用质量预检、QA 交接和 AutoRepair 候选入口之间提供可读、可审计的移动端交接界面，不能只用页面级无横滚证明。

Must：

- `report-evidence-drawer-smoke.spec.ts` 必须覆盖 `1440x900`、`390x844`、`320x740`。
- 抽屉 READY 和 GAP 两类证据都必须验证局部 containment，而不是只验证整页无横向滚动。
- 抽屉必须验证以下局部区域可读：
  - 报告证据信号区。
  - `code_chunks 命中摘要`。
  - `引用质量预检`。
  - `报告证据交接包`。
  - `报告证据下一步动作`。
- 长目标路径、长 gap 路径、长报告摘要、chunk reason、handoff title、action rail 文案、行动按钮不得被裁切或 ellipsis 隐藏。
- `REPORT_EVIDENCE_DRAWER_SMOKE_OK` 必须包含 `layoutDensity` 和 `mobileReadability`。
- `scripts/validate-frontend-ui.mjs` 必须锁住三视口、readability helper、CSS wrap 和 marker 字段。

验收：

- `make frontend-ui-check` 通过。
- `CI=true make report-evidence-drawer-ui-smoke` 通过，成功 marker 必须包含：
  - `REPORT_EVIDENCE_DRAWER_SMOKE_OK`
  - `viewports=["1440x900","390x844","320x740"]`
  - `drawerQueryCount=6`
  - `readyDrawerQueryCount=3`
  - `gapDrawerQueryCount=3`
  - `layoutDensity.mobile390Covered=true`
  - `layoutDensity.drawerContained=true`
  - `layoutDensity.actionRailContained=true`
  - `layoutDensity.noHorizontalOverflow=true`
  - `mobileReadability.targetFileNotClipped=true`
  - `mobileReadability.chunkEvidenceNotClipped=true`
  - `mobileReadability.actionButtonsNotClipped=true`
- `CI=true make report-evidence-qa-citation-ui-smoke` 通过。
- `npm --prefix web-console run build` 通过。

非范围：

- 不改后端、DB、QA API、code_chunks 检索/rerank、AutoRepair gate、public repo live smoke、release evidence schema、GitHub App、真实 LLM provider。
- 不刷新 full release authority。
- 不升级 release verifier/security forged marker。

量化记录：

- 本轮基准：1 report evidence drawer smoke * 3 viewports，READY/GAP 两类抽屉各 3 次。
- 同一 spec 经 `report-evidence-qa-citation` 独立 config 再跑一遍，三视口 QA 请求共 `qaTotalRequestCount=15`。
- 后续待办完成：`project-qa-low-confidence-smoke` 已补 `390x844`，并统一 `layoutDensity/mobileReadability/viewportProofs/statusProofs` marker。

## P9 增量：Project QA Low Confidence Three-Viewport Readability Gate

目标：

- 将 ProjectDetail QA 低置信与无证据信任面板从“状态可见”升级为“三视口可读、状态覆盖可审计、marker 可量化”的 focused gate。
- 用户在 `1440x900`、`390x844`、`320x740` 下都必须能区分 `PARTIAL`、`UNVERIFIED`、`NO_EVIDENCE` 和 retry 后 `VERIFIED`，且不会把低置信候选证据误读成已验证引用。

验收要求：

- `web-console/tests/project-qa-low-confidence-smoke.spec.ts` 必须包含 `desktop/mobile390/narrow320` 三视口。
- 每个视口必须独立跑 `PARTIAL`、`UNVERIFIED`、`NO_EVIDENCE`，并跑一次低置信 retry recovery。
- 低置信 Alert、候选引用证据、候选代码切片、无证据状态、retry 后回答引用证据和操作按钮必须具备 containment 与 text-not-clipped 断言。
- marker `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK` 必须输出 `qaRequestCount=15`、`viewports=["1440x900","390x844","320x740"]`、`layoutDensity`、`mobileReadability`、`viewportProofs`、`statusProofs`、`runtimeIssues=0`。
- `scripts/validate-frontend-ui.mjs` 必须静态锁定三视口、独立 `PARTIAL/UNVERIFIED/NO_EVIDENCE` case、readability helper 和 marker 字段。

非范围：

- 不改后端、DB、QA API、code_chunks 检索/rerank、AutoRepair hard gate、public repo live smoke、release evidence schema、GitHub App 或真实 LLM provider。
- 本轮不刷新 full release authority，不升级 release verifier/security forged marker。

量化记录：

- 本轮基准：1 low-confidence smoke * 3 viewports。
- 每个视口 5 次 QA 请求：retry seed、retry verified、PARTIAL、UNVERIFIED、NO_EVIDENCE；总计 `qaRequestCount=15`。

## P9 增量：ProjectDetail Deep Evidence Card Readability Gate

目标：

- 将 ProjectDetail 深层证据链从“字段可见”升级为“移动端可读、来源闭环可审计、不会误称 LLM 事实正确”的 focused gate。
- 用户在 `1440x900`、`390x844`、`320x740` 下都必须能读清 `QA 回答报告证据凭证`、`来源定位可信度`、`来源文件匹配说明`，并能区分 READY 行级锚点与 FILE_ANCHOR 复核路径。

验收要求：

- `web-console/tests/report-evidence-drawer-smoke.spec.ts` 的 `report-evidence-qa-citation` 路径必须验证：
  - READY 路径：`REPORT_LINE_ANCHOR`、`来源定位可信`、`满足修复候选放行`。
  - REVIEW 路径：`REPORT_FILE_ANCHOR`、`来源定位需复核`、`修复候选需复核` 且不显示修复候选动作。
  - source receipt、source location confidence、source file match release 的标题、长路径、metrics、checks 和 next action 在 390/320 下不裁切。
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.deepEvidenceCardReadability` 必须包含：
  - `status=OK`
  - `mobile390Covered=true`
  - `narrow320Covered=true`
  - `sourceReceipt.contained/referenceWraps/titleNotClipped/tagsNotClipped=true`
  - `sourceLocationConfidence.readyContained/reviewContained/metricsNotClipped/checksWrap=true`
  - `sourceFileMatchRelease.readyContained/reviewContained/targetReferenceNotClipped/citedReferenceNotClipped/checksNotClipped/noRepairOnReview=true`
  - `noHorizontalOverflow=true`
  - `providerQualityClaim=false`
  - `llmFactClaim=false`
- `web-console/src/styles/app.css` 必须保证 QA source receipt、source location confidence、source match release、evidence combination 的移动端 head 不被右侧 tag 挤压；相关 tag 必须 `max-width:100%`、`white-space:normal`、`overflow-wrap:anywhere`。
- `scripts/validate-frontend-ui.mjs` 必须静态锁定 helper、selector、marker 字段和 CSS 移动端 head/tag 规则。

非范围：

- 不改后端检索、embedding pool、QA response schema、DB/API、AutoRepair payload 协议。
- 不把 `REPORT_LINE_ANCHOR`、PRIMARY 绑定、向量证据或跨文件覆盖宣传成 LLM 事实正确。
- 不刷新 full release authority，不升级 release verifier/security forged marker。

## P6 增量：Claim citation noise boundary

目标：

- 将 Project QA 的 claim citation 口径收紧为“只统计回答正文里的可审计引用”，避免代码块、日志、堆栈、inline code literal 或格式示例中的 `[C1]` 被误判为真实 citation。
- 防止噪声引用把 `groundingStatus`、`citationCoverage`、`claimCitationCoverage` 和 AutoRepair 派生门禁抬升为 READY。

验收要求：

- 后端 citation label 解析必须先生成 auditable answer text，再对正文做 `[C#]` 匹配。
- 以下内容中的 `[C#]` 不得计入引用：
  - Markdown fenced code block：``` / ~~~。
  - inline code literal：`` `[C1]` ``。
  - 引用格式示例行，例如“例如 [C1] 这种格式”。
  - 典型日志行：timestamp 日志、level=ERROR 结构化日志、JSON level 日志。
  - 典型堆栈行：`at ...`、`Caused by:`、`java.lang.*Exception:`、Python Traceback / File line。
- 正文自然语言 claim 后的 `[C1]` 必须继续计入，不能因过滤过度破坏 READY 正例。
- 负向场景必须证明：
  - `groundingStatus=UNVERIFIED`
  - `citationEnforcementStatus=RETRY_FAILED`
  - `answerCitations[].citedByAnswer=false`
  - `citationCoverage.status=NONE`
  - `citationCoverage.repairCandidateCount=0`
  - `claimCitationCoverage.status=REVIEW`
  - `claimCitationCoverage.roleDistribution.status=REVIEW_UNCITED`
- 正向场景必须证明：
  - 正文 `[C1]` 仍可 `DIRECT_VERIFIED`
  - fenced block 内无效 `[C99]` 不触发 `invalidCitationClaimCount`
  - `claimCitationCoverage.status=READY`
  - `roleDistribution.status=PRIMARY_BOUND`

非范围：

- 不改 API、DB schema、前端结构、AutoRepair payload 协议或 release authority。
- 不新增 citation enum，不声明 LLM 事实正确。
- 本轮不刷新 full release authority；下一次 release evidence refresh 时再吸收该 focused gate。

量化记录：

- 本轮最小后端测试：2 个 Code QA parser tests，覆盖负向噪声过滤和正向正文引用保留。
- 验证命令必须至少包含 `CodeQaControllerTest`，并联动 `AutoRepairServiceTest` 确认现有 repair gate 未被破坏。

量化记录：

- 本轮基准：1 report evidence QA citation smoke * 3 viewports。
- `qaRequestCount=6`，保持 verified + unverified 主路径兼容语义。
- `qaTotalRequestCount=18`，覆盖 verified、unverified、claim citation noise、file-anchor drift、claim-role missing、claim-role mismatch。
- `qaFromEvidence.drift.claimRoleDistributionMissing/Mismatch` 为新标准 schema；legacy direct 字段短期保留用于历史证据包兼容。

## P6 增量：Claim citation noise focused evidence absorption

目标：

- 将 claim citation noise boundary 从后端 focused contract 吸收到 `report-evidence-drawer-smoke` / QA citation focused marker / release evidence verifier 的可持续证据链。
- 发布证据必须证明代码块、timestamp 日志、异常堆栈、inline code literal 中的 `[C1]` 不会被当作有效引用。
- 该阶段只证明 citation marker 解析边界和证据门禁，不声明 LLM 事实语义正确。

验收要求：

- Focused smoke 必须覆盖至少四类 fake citation 噪声：
  - fenced code block 中的 `[C1]`。
  - inline code literal 中的 `[C1]`。
  - timestamp / level 日志行中的 `[C1]`。
  - 异常堆栈或 `Caused by` / `Traceback` 行中的 `[C1]`。
- 负向场景必须输出并被 verifier 校验：
  - `claimCitationCoverage.status=REVIEW`
  - `citationEnforcementStatus=RETRY_FAILED`
  - `citationCoverage.status=NONE`
  - `repairCandidateCount=0`
  - `answerCitations[].citedByAnswer=false`
- 正向正文引用路径必须继续证明 READY：正文自然语言 claim 后的 `[C1]` 仍可形成有效引用，代码/日志块中的无效 `[C99]` 不得触发 invalid citation 阻断。
- Release verifier 对新增 marker 采用 optional-but-strict：历史 full authority 缺少字段不得失败；字段一旦出现，必须强校验噪声类型、负向状态、正向保留、无 repair candidate 和无 raw content。
- Security regression 必须覆盖 forged marker：缺少 noise proof、把负向抬升为 READY、把 `NONE` 改为 `FULL/PARTIAL`、伪造 `repairCandidateCount>0`、写入 raw answer/prompt/source/token 均必须失败。

非范围：

- 不新增 API enum、DB schema、前端新面板或 AutoRepair payload 字段。
- 不把 claim-level `PRIMARY_BOUND`、`READY` 或 citation present 宣传成 LLM 事实正确。
- 不刷新 full release authority，除非主 agent 实际生成并验证新的 evidence package。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false make security-regression-release-verifier-report-evidence-marker`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make report-evidence-drawer-ui-smoke`。
- PASS：`CI=true make report-evidence-qa-citation-ui-smoke`。
- PASS：scoped `git diff --check`。
- 未刷新 full release authority；该增量只完成 focused evidence absorption。

## P6 增量：Public repo Code QA claim citation noise focused evidence

目标：

- 将 claim citation noise boundary 从 mocked report evidence UI / backend contract 进一步吸收到真实公开仓库 Code QA API smoke。
- `PUBLIC_REPO_SMOKE_OK.codeQa.claimCitationNoiseBoundary` 必须证明 fake citation marker 不会把 QA trust、claim citation coverage 或 AutoRepair gate 抬升为 READY。
- 该阶段只证明 SourceLens parser、trust gate、release verifier 和 security forged matrix 的 fail-closed 能力，不证明真实 LLM provider 质量。

验收要求：

- Public repo smoke 必须在真实扫描完成后调用 Code QA API，并绑定当前 `scanTaskId`：
  - `scanTaskId === requestScanTaskId === responseScanTaskId`
  - `retrievedChunkScanTaskIds` / `answerCitations` 不得跨扫描污染
- `claimCitationNoiseBoundary` 必须输出：
  - `status=OK`
  - `probeKind=REAL_PUBLIC_REPO_CODE_QA_CLAIM_CITATION_NOISE`
  - `noiseKinds` 至少覆盖 `fenced-code`、`inline-code`、`timestamp-log`、`exception-line`
  - `groundingStatuses` 只能是 `UNVERIFIED` 或 `PARTIAL`，不得为 `VERIFIED`
  - `citationEnforcementStatuses=[RETRY_FAILED]`
  - `coverageStatus=NONE`
  - `claimCitationStatus=REVIEW`
  - `roleDistributionStatus=REVIEW_UNCITED`
  - `maxCitedEvidenceCount=0`
  - `maxRepairCandidateCount=0`
  - `maxCitedRequiredClaimCount=0`
  - `maxRequiredPrimaryBoundClaimCount=0`
  - `answerCitationsCitedByAnswer=false`
- Marker 必须保持数据最小化：
  - `rawAnswerStored=false`
  - `rawPromptStored=false`
  - `providerQualityClaim=false`
  - `llmFactClaim=false`
  - 不得包含 raw answer、raw prompt、source content、stack、log、token 或大段源码字段。
- Release verifier 必须 optional-but-strict：
  - 旧 full authority 缺少该字段允许通过。
  - 字段一旦出现，所有状态、计数、scanTaskId、噪声类型和数据最小化字段必须强校验。
- Security regression 必须拒绝：
  - 将 `claimCitationStatus` 伪造为 READY。
  - 将 `groundingStatuses` 伪造为 VERIFIED。
  - 将 cited evidence / repair candidate 计数伪造为正数。
  - 写入 raw answer / raw prompt / source content / log / stack。
  - scanTaskId mismatch。
  - unknown noise kind。

非范围：

- 不改 DB schema、公开 API response schema、前端 UI、AutoRepair 创建协议或 GitHub App。
- 不刷新 full release authority。
- 不声明真实 LLM provider 的事实语义正确、召回质量提升或生产可用性。

验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=LlmClientAdapterTest,CodeQaControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false make security-regression-release-verifier-public-repo-marker`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false make security-regression-static`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：真实 public repo smoke，repo `LJunP/Pawnshop-Management-System.git`，commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`，`scanTaskId=245`，`claimCitationNoiseBoundary.status=OK`。

## P6 增量：Public repo UI claim citation noise boundary

目标：

- 把 public repo Code QA claim noise focused proof 吸收到真实 public repo UI smoke 的发布证据合同。
- UI 侧必须证明 fake citation noise 不会被用户界面呈现为“可采信”或“可生成修复候选”。
- Release verifier 和 security regression 必须拒绝任何把该负向 proof 伪造成 READY、VERIFIED、可修复或包含 raw content 的 marker。

验收要求：

- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.claimCitationNoiseBoundary` 必须存在于新的 public repo UI smoke marker 中，并包含：
  - `status=OK`
  - `surface=PUBLIC_REPO_UI_CLAIM_CITATION_NOISE_BOUNDARY`
  - `scanTaskId === requestScanTaskId === responseScanTaskId`
  - `currentScanOnly=true`
  - `noiseKinds` 覆盖 `exception-line`、`fenced-code`、`inline-code`、`timestamp-log`
  - `groundingStatuses` 只能是 `UNVERIFIED` 或 `PARTIAL`
  - `citationEnforcementStatuses=[RETRY_FAILED]`
  - `coverageStatus=NONE`
  - `claimCitationStatus=REVIEW`
  - `roleDistributionStatus=REVIEW_UNCITED`
  - `maxCitedEvidenceCount=0`
  - `maxRepairCandidateCount=0`
  - `answerCitationsCitedByAnswer=false`
- UI 可见状态必须证明：
  - `QA 可信度摘要` 显示不可直接采信。
  - `修复证据门禁` 显示 `BLOCKED`。
  - `QA 下一步动作` 显示已阻断。
  - 不显示 `生成修复候选`。
- 数据最小化必须证明：
  - `rawAnswerStored=false`
  - `rawPromptStored=false`
  - `providerQualityClaim=false`
  - `llmFactClaim=false`
  - marker 不得包含 `rawAnswer`、`rawPrompt`、`content`、`stack`、`log`、`sourceContent`、token 或源码大段。
- MOCK LLM 配置必须是测试内临时配置，setup 和 cleanup 都必须为 `OK`。
- Security regression 必须拒绝：
  - missing marker。
  - `claimCitationStatus=READY` 或 `roleDistributionStatus=PRIMARY_BOUND`。
  - `groundingStatuses=[VERIFIED]`。
  - cited evidence / answer citation / repair candidate 伪造。
  - repair action visible、blocked gate hidden、ready summary forged。
  - unknown noise kind、raw answer/prompt、scan mismatch、setup/cleanup warn。

非范围：

- 不声明真实外部 LLM provider 质量。
- 不刷新 full release authority。
- 不新增 DB schema、API enum、GitHub App E2E 或生产部署 gate。
- 本轮未执行 retained sample live UI smoke，只完成 smoke contract、verifier/security matrix、build 和 Playwright config loading。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker`。
- PASS：`npm --prefix web-console run build`。
- PASS：`cd web-console && SL_PUBLIC_REPO_UI_PROJECT_ID=1 SL_PUBLIC_REPO_UI_REPOSITORY_ID=1 SL_PUBLIC_REPO_UI_SCAN_TASK_ID=1 SL_PUBLIC_REPO_UI_TOKEN=dummy npm exec -- playwright test -c playwright.public-repo-ui.config.ts --list`。

追加 live 验证结果：

- PASS：`SOURCELENS_BASE_URL=http://localhost:8080 SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL=https://github.com/LJunP/Pawnshop-Management-System.git SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH=main SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=900 SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false SOURCELENS_PUBLIC_REPO_SMOKE_UI=true SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=auto SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=auto make public-repo-smoke`。
- PASS：retained sample `projectId=329`，`repositoryId=290`，`scanTaskId=246`，commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`。
- PASS：`PUBLIC_REPO_UI_SMOKE_OK.realBackend=true`，`mockedApi=false`，viewports `1440x900 / 390x844 / 320x740`。
- PASS：`PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.claimCitationNoiseBoundary.status=OK`，`noiseKinds=["exception-line","fenced-code","inline-code","timestamp-log"]`，`coverageStatus=NONE`，`claimCitationStatus=REVIEW`，`roleDistributionStatus=REVIEW_UNCITED`，`citationEnforcementStatuses=["RETRY_FAILED"]`，`repairCandidateActionVisible=false`，`repairEvidenceGateBlockedVisible=true`。
- PASS：`rawAnswerStored=false`，`rawPromptStored=false`，`providerQualityClaim=false`，`llmFactClaim=false`，`llmSetup.status=OK`，`llmCleanup.status=OK`。
- PASS：`PUBLIC_REPO_SMOKE_OK` 同步通过 artifact quality、DB counts、graph/chunks、Code QA claim noise API proof。
- 仍未刷新 full release authority；该 live evidence 是 retained sample smoke evidence，不等同于新的 release-evidence package。

追加 focused release evidence：

- PASS：`release-evidence/public-repo-ui-claim-noise-20260703-140228` 已生成并通过 verifier。
- PASS：manifest `release_evidence_profile=local`，`include_public_repo_smoke=true`，`public_repo_smoke_ui=true`，`worktree_inventory_strict=true`。
- PASS：summary `required_failures=0`，`optional_warnings=0`，`skipped=21`。
- PASS：package sample `projectId=330`，`repositoryId=291`，`scanTaskId=247`。
- PASS：`PUBLIC_REPO_SMOKE_OK` 与 `PUBLIC_REPO_UI_SMOKE_OK` 绑定同一组 IDs。
- PASS：`PUBLIC_REPO_UI_SMOKE_OK.realBackend=true`，`mockedApi=false`，viewports `1440x900 / 390x844 / 320x740`。
- PASS：`qaFromEvidence.claimCitationNoiseBoundary.status=OK`，`surface=PUBLIC_REPO_UI_CLAIM_CITATION_NOISE_BOUNDARY`，四类 fake citation noise 齐全。
- PASS：negative state remains `groundingStatuses=["UNVERIFIED"]`，`citationEnforcementStatuses=["RETRY_FAILED"]`，`coverageStatus=NONE`，`claimCitationStatus=REVIEW`，`roleDistributionStatus=REVIEW_UNCITED`。
- PASS：repair gate remains blocked：`maxRepairCandidateCount=0`，`repairCandidateActionVisible=false`，`repairEvidenceGateBlockedVisible=true`。
- PASS：data minimization：`rawAnswerStored=false`，`rawPromptStored=false`，`providerQualityClaim=false`，`llmFactClaim=false`。
- PASS：verifier contract drift fixed for the conservative UI label `跨文件复核路径`；security regression still rejects illegal factual-overclaim labels such as `LLM 事实已验证`。

时序澄清：

- 上文“本轮未执行 retained sample live UI smoke”描述的是 contract/static 阶段的初始边界；后续已追加 retained sample live UI smoke 与 focused release evidence。
- 当前仍未刷新 full release authority；本段只证明 focused P6 public repo UI claim citation noise evidence package。

## P9 增量：PR Reviews comments stale guard

目标：

- PR Reviews 详情页在快速切换 completed PR 时，不得让旧 PR 的慢行级评论响应污染新选中的 PR 详情。
- AutoRepair 修复候选资格必须只基于当前选中 PR 的 `repositoryId`、`changedFiles`、风险和行级评论，不得使用旧评论文件。
- 列表刷新后，如果当前详情项不在当前列表结果中，必须清空详情，不能保留 stale selected detail。

验收要求：

- `fetchComments(id)` 必须有请求序号或等价防护，过期响应不得 `setComments`、`setCommentsError` 或关闭当前请求的 loading。
- 选择新 PR 时必须立即清空旧评论和错误状态，并使旧评论请求失效。
- `PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK.commentStaleGuard` 必须证明：
  - `completedToCompletedSwitch=true`
  - `staleCommentLeakCount=0`
  - `selectedCommentReviewIdMatches=true`
  - 覆盖 `1440x900 / 390x844 / 320x740`
  - marker 记录 `commentRequests`
- `PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK.repairReadiness.usesSelectedReviewCommentsOnly=true`。
- `PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK.staleDetailRejected=true`。
- `PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK.runtimeIssues=0` 且 `noHorizontalOverflow=true`。
- 静态 UI validator 必须锁定该 smoke 的 slow comments race 模拟、marker 字段和 table scroller 证据。

非范围：

- 不改后端 PR Review API、DB schema、PR risk scoring、AutoRepair 创建协议或 GitHub App。
- 不刷新 full release authority。
- 不声明真实 PR 审查质量或真实 PR 创建能力。

验证结果：

- PASS：`npm --prefix web-console run build`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`CI=true make pr-reviews-detail-selection-ui-smoke`。
- PASS：scoped `git diff --check`。

## P6 增量：Code QA semantic candidate rerank guard

目标：

- Code QA 在存在 question embedding 时，语义候选不得先按输入顺序截断再计算 cosine similarity。
- 高相似 semantic candidate 即使出现在候选列表尾部，也必须有机会进入 hybrid rerank。
- 强关键词、路径、行号和方法锚点仍必须保持优先级，不得被弱语义候选覆盖。

验收要求：

- `CodeQaRetrievalService` 必须对可用 embedding candidate 先计算 cosine similarity，再取 top semantic candidates。
- keyword candidates 与 semantic candidates merge 后仍走现有 hybrid score 和文件多样化逻辑。
- 不改 DB schema、Controller API、Code QA response DTO、citation coverage 或 claim audit。
- 单测必须覆盖尾部高相似 semantic candidate 超出旧输入顺序截断边界仍被选中。

非范围：

- 不声明 DB 层具备向量索引或 ANN 排序。
- 不声明真实 LLM answer 语义正确。
- 不刷新 full release authority。
- 不替代 source-location line-mismatch live evidence、codeUnderstandingFixture 或 reportCitationQuality 后续门禁。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaRetrievalServiceTest test`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：scoped `git diff --check`。

## P6 增量：Source-location line-mismatch context-only guard

目标：

- 当报告证据文件匹配但行号不匹配时，Code QA 必须把该证据视为文件级上下文证据，而不是可直接用于修复的 PRIMARY 证据。
- 前端、smoke marker、release verifier 和 security regression 必须共同防止 `REPORT_FILE_ANCHOR` 被伪造成 `READY / PRIMARY_BOUND / DIRECT_VERIFIED`。
- 用户在 UI 中必须看到来源定位需复核、修复门禁阻断、无修复候选入口。

验收要求：

- `sourceEvidenceMatchType` 必须为 `REPORT_FILE_ANCHOR`，不得升级为 `REPORT_LINE_ANCHOR`。
- `retrievedChunks` / `answerCitations` 只能作为 `ADJACENT_CONTEXT`。
- `citationCoverage.coverageScope=ALL`。
- `citationCoverage.primaryEvidenceCount=0`，`contextEvidenceCount>0`，`repairCandidateCount=0`。
- `citationCoverage.evidenceRoleDistribution.status=CONTEXT_ONLY`。
- `claimCitationCoverage.status=REVIEW`。
- `claimCitationCoverage.roleDistribution.status=CONTEXT_ONLY`。
- `requiredPrimaryBoundClaimCount=0`，`requiredPrimaryFileCount=0`，`requiredContextOnlyClaimCount>0`。
- UI 必须显示 `来源定位需复核`、`BLOCKED` 修复门禁、`修复候选已阻断`，并隐藏所有 `生成修复候选` 入口。
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.fileAnchorDrift` 必须被 `verify-release-evidence.sh` 消费。
- `security-regression-check.sh --suite release-verifier-report-evidence-marker` 必须拒绝 file-anchor drift 的好状态伪造。

非范围：

- 不把 mocked UI smoke 当作真实 public repo live proof。
- 不刷新 full release authority。
- 不证明 LLM 事实正确、外部模型质量、patch 可用、GitHub App/webhook E2E 或生产部署。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`CI=true make report-evidence-drawer-ui-smoke`。
- PASS：`make security-regression-release-verifier-report-evidence-marker`。
- PASS：`npm --prefix web-console run build`。
- PASS：scoped `git diff --check`。

## P6 增量：Public repo UI file-anchor drift live guard

目标：

- 将 mocked report evidence line-mismatch 保护推进到真实 public repo UI smoke 合同。
- 当报告证据文件匹配但行号明显不覆盖任何 PRIMARY chunk 时，真实后端和 UI 必须证明该证据只能作为 context-only 复核材料。
- 禁止 context-only citation 产生修复候选或被声明为 full verified grounding。

验收要求：

- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.fileAnchorDrift` 必须存在，且三视口均覆盖。
- 探针必须请求真实 `/api/projects/{projectId}/qa`，使用真实 report drawer evidence file，并将 `evidenceLine` 改为越界行号。
- `sourceEvidenceMatchTypes=["REPORT_FILE_ANCHOR"]`。
- `groundingStatuses=["PARTIAL"]`，`citationEnforcementStatuses=["RETRY_FAILED"]`。
- `citationCoverage.coverageScopes=["ALL"]`。
- `citationCoverage.maxPrimaryEvidenceCount=0`，`minContextEvidenceCount>0`，`maxRepairCandidateCount=0`。
- `citationCoverage.evidenceRoleDistribution.statuses=["CONTEXT_ONLY"]`。
- `claimCitationCoverage.statuses=["READY"]` 允许存在，但 `roleDistribution.statuses=["CONTEXT_ONLY"]`，且 `maxRequiredPrimaryBoundClaimCount=0`、`maxRequiredPrimaryFileCount=0`、`minRequiredContextOnlyClaimCount>0`。
- UI 必须显示不可直接采信、来源定位需复核、`BLOCKED` 修复门禁，并隐藏所有 `生成修复候选` 入口。
- `verify-release-evidence.sh` 必须强制消费 `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.fileAnchorDrift`。
- `security-regression-check.sh --suite release-verifier-public-repo-ui-marker` 必须拒绝 file-anchor drift 的 `VERIFIED`、`DIRECT_VERIFIED`、`REPORT_LINE_ANCHOR`、PRIMARY、repair candidate 和 repair action forged states。

非范围：

- 不刷新 full release authority。
- 不声明完整 release-evidence package 已更新。
- 不证明 LLM 事实正确、patch 可用、GitHub App/webhook E2E、private repos 或生产部署。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`cd backend-spring && mvn -Dtest=CodeQaControllerTest test`。
- PASS：`make security-regression-release-verifier-public-repo-ui-marker`。
- PASS：scoped `git diff --check`。

## P6 增量：Public repo API cross-file retrieval proof

目标：

- 将 code_chunks 跨文件检索能力从 UI retained sample 证明推进到 API 侧 `PUBLIC_REPO_SMOKE_OK` 发布证据。
- 每次成功 public repo smoke 必须证明当前 scan 的 `/code-chunks/search` broad probe 能看到至少两个文件的源码证据。
- release verifier 和 security regression 必须拒绝伪造的跨 scan、单文件、无 fileStats、无 source label 或不可用 retrieval state。

验收要求：

- `PUBLIC_REPO_SMOKE_OK.chunkSearch.crossFileRetrievalProof` 必须存在。
- `status="OK"`。
- `endpoint="/api/projects/{projectId}/code-chunks/search"`。
- `query=""`。
- `limit=24`。
- `responseScanTaskId` 必须等于顶层 `scanTaskId`。
- `resultCount >= 2`。
- `totalChunks > 0`。
- `0 <= embeddedChunks <= totalChunks`，不得要求本地环境必须有 embedding。
- `uniqueFiles >= 2`。
- `currentScanOnly=true`。
- `fileStatsVisible=true`。
- `fileStatsUniqueFiles >= 2`。
- `sourceLabelsVisible=true`。
- `retrievalMode` 必须属于 `KEYWORD`、`STABLE_FALLBACK`、`SEMANTIC_FALLBACK`、`HYBRID`。
- `/api/projects/{projectId}/code-chunks/search` 若存在 role/path/method/evidence 辅助结构信号且命中，必须返回既有合同内的 `HYBRID`，不得继续误标为普通 `KEYWORD`；plain keyword 命中仍保持 `KEYWORD`。
- `readiness` 必须属于 `READY`、`REVIEW`、`GAP`；`GAP` 仅表示空 query broad fallback 置信度较低，不能否定多文件结构证据。
- `minFileEvidenceSatisfied=true`。
- `security-regression-check.sh --suite release-verifier-public-repo-marker` 必须动态拒绝 missing、array、bad status、endpoint drift、query drift、limit drift、scan mismatch、单结果、单文件、fileStats/sourceLabel 隐藏、`NO_CONTEXT`、unknown mode/readiness、embedded count 越界和 `minFileEvidenceSatisfied=false`。

非范围：

- 不证明语义排序质量。
- 不证明 LLM 事实正确性。
- 不要求 embedding 必须存在。
- 不新增后端 API。
- 不刷新 full release authority。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh scripts/public-repo-analysis-smoke.sh`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。

## P6 增量：Public repo report citation quality contract

目标：

- 将 `ARCHITECTURE_REPORT.reportQuality` 从“存在且字段合法”升级为“核心质量结论能绑定到报告 JSON 的结构化 section”。
- 每次成功 public repo smoke 必须输出 `PUBLIC_REPO_SMOKE_OK.reportQuality.reportCitationQuality`。
- release verifier 必须拒绝缺失、伪造、跨 scan、section 绑定错误、raw prompt/answer 泄露和 provider/LLM 事实质量冒领。

验收要求：

- `PUBLIC_REPO_SMOKE_OK.reportQuality` 必须存在。
- `readiness` 必须属于 `READY`、`REVIEW`、`RISK`。
- `confidence` 必须在 `35..100`。
- `gaps >= 0`。
- `nextActions > 0`。
- `evidenceChecks >= 6`。
- `reportCitationQuality.status="OK"`。
- `artifactType="ARCHITECTURE_REPORT"`。
- `scanTaskId` 必须等于顶层 `scanTaskId`。
- `requiredCheckCount=6`，`boundCheckCount=requiredCheckCount`。
- `evidenceCheckKeys` 必须覆盖 `scan_scope`、`test_signal`、`module_map`、`api_data_surface`、`fingerprint`、`risk_signal`。
- `sectionBindings` 必须覆盖所有 required checks，且映射为：
  - `scan_scope -> overview`
  - `test_signal -> overview`
  - `module_map -> modules`
  - `api_data_surface -> apiRoutes/dbEntities`
  - `fingerprint -> scanFingerprint`
  - `risk_signal -> codeQuality.risks`
- `overviewBound`、`moduleMapBound`、`apiDataSurfaceBound`、`fingerprintBound`、`riskSignalBound`、`nextActionsBound`、`noRawPromptOrAnswer` 必须为 `true`。
- `providerQualityClaim=false`。
- `llmFactClaim=false`。
- 不得包含 `rawPrompt`、`rawAnswer`、`content`、`sourceContent`、`token`、`password`、`secret` 字段。

非范围：

- 不证明 LLM 事实正确。
- 不证明引用语义充分。
- 不证明真实 patch 可用。
- 不刷新 full release authority。
- 不替代下一轮 `codeUnderstandingFixture`。

验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。

## P6 增量：Public repo code understanding method-anchor fixture

目标：

- 将旧的 `methodAnchorRetrieval` 晋级为顶层 `PUBLIC_REPO_SMOKE_OK.codeUnderstandingFixture`。
- 该 fixture 只证明“当前 scan 内 Java 方法锚点、stack trace 与 Code QA primary chunk 能闭环到同一源码方法”，不得表述为通用语义理解能力。
- release verifier 必须 fail-closed：缺失、跳过态、跨 scan、路径不安全、行号越界、method/stack/QA 三路不一致、raw query/stack/prompt 泄漏均拒绝。

验收要求：

- `contractVersion=1`。
- `status="OK"`，不得接受 `SKIPPED`。
- `probeKind="METHOD_ANCHOR_STACK_TRACE"`。
- `projectId`、`scanTaskId` 必须等于 `PUBLIC_REPO_SMOKE_OK` 顶层字段。
- `source` 只能是 `DB_SYMBOL` 或 `API_CHUNK`。
- `anchor.language="Java"`。
- `anchor.filePath` 必须是 safe relative path。
- `anchor.className`、`anchor.methodName` 非空。
- `anchor.startLine <= anchor.methodLine <= anchor.endLine`，且所有行号为正整数。
- `methodSearch.queryShape="class#method"`，`responseScanTaskId` 等于当前 scan，`resultCount > 0`，`matchedFile` 等于 `anchor.filePath`，命中行区间覆盖 `anchor.methodLine`。
- `stackTraceSearch.queryShape="java-stack-frame"`，`stackClass/stackMethod/stackFile/stackLine` 必须与 anchor 一致，命中文件和行区间必须覆盖 anchor。
- `codeQa.requestScanTaskId/responseScanTaskId` 必须等于当前 scan，`retrievalMode` 不得是 `NO_CONTEXT`，`resultCount > 0`，`primaryMatched=true`，`primaryFile` 等于 anchor file，primary 行区间覆盖 anchor。
- `currentScanOnly=true`。
- `noRawPromptOrAnswer=true`。
- `providerQualityClaim=false`。
- `llmFactClaim=false`。
- 不得包含 `rawPrompt`、`rawAnswer`、`content`、`sourceContent`、`token`、`password`、`secret`、`query`、`stackQuery`、`url`、`host`、`origin` 等字段。

非范围：

- 不证明 LLM 事实正确。
- 不证明跨语言通用方法锚点能力。
- 不证明任意 stack trace 都能定位。
- 不证明语义排序质量。
- 不证明真实 patch 可用、GitHub App/webhook E2E、private repos 或生产部署。
- 不刷新 full release authority。

验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-frontend-ui.mjs`。

Retained live evidence：

- Evidence dir：`release-evidence/public-repo-code-understanding-20260703162834`。
- PASS：`public-repo-smoke`。
- PASS：`./scripts/verify-release-evidence.sh release-evidence/public-repo-code-understanding-20260703162834`。
- Marker：`projectId=333`、`repositoryId=294`、`scanTaskId=250`、`commitSha=3eaf38582997afa5acff8990f48ce9c5f200e3ea`。
- `codeUnderstandingFixture.status=OK`，`probeKind=METHOD_ANCHOR_STACK_TRACE`，`source=DB_SYMBOL`。
- Anchor：`ConfigController#page`，file `龙宁典当行信息管理系统_v0tw8e94/springboot3v0tw8e94/src/main/java/com/yb/controller/ConfigController.java`，`methodLine=37`。
- `methodSearch`、`stackTraceSearch` 和 `codeQa` 均绑定 `scanTaskId=250`，命中/primary range 覆盖 `1-50`。
- `crossFileRetrievalProof.readiness=GAP` 已作为空 query broad fallback 结构证据接受，前提是 `resultCount=24`、`uniqueFiles=4`、`fileStatsUniqueFiles=4`、`minFileEvidenceSatisfied=true`。

## P6 增量：Project QA code understanding lens

目标：

- 把 `METHOD_ANCHOR_STACK_TRACE` retained evidence 的产品价值落到 ProjectDetail QA / code_chunks 检索区。
- 用户粘贴 `file:line`、`Class#method` 或 Java/browser stack frame 后，必须能看到一个中文可读的“代码理解定位入口”。
- 入口只证明当前 scan 的 code_chunks 定位闭环，不声明通用语义理解或 LLM 事实正确。

验收要求：

- `ProjectDetail.tsx` 必须识别 `FILE_LINE`、`METHOD_ANCHOR`、`STACK_TRACE`、`GENERAL`、`IDLE`。
- `代码理解定位入口` 必须展示当前扫描、主证据位置、证据编号、证据角色、证据类型、相关分、召回模式和 Readiness。
- 必须提供 `定位检索`、`解释此处`、`复制引用` 三个动作。
- `解释此处` 必须复用现有 Project QA，不新增 API。
- smoke marker 必须证明 `inputKind=METHOD_ANCHOR`、`currentScanBound=true`、`sourceLabel=C1`、`primaryReference` 为可见 file:line、`retrievalMode=HYBRID`、`readiness=READY`、`rawStackStored=false`、`rawPromptStored=false`、`noHorizontalOverflow=true`。
- 可信度区域 heading 默认中文可读，技术枚举如 `READY/REVIEW/GAP/HYBRID` 可保留为 tag 或 metric。

非范围：

- 不新增后端 API。
- 不改 DB schema。
- 不改变 ranker 或 citation schema。
- 不证明通用代码语义理解。
- 不证明所有语言或所有 stack trace 都可定位。
- 不证明 LLM 事实正确。
- 不刷新 full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make project-qa-recoverable-ui-smoke`。
- PASS：`make report-evidence-drawer-ui-smoke`。

## P6 增量：Public repo UI code understanding lens release proof

目标：

- 将 ProjectDetail 的 `代码理解定位入口` 从 mocked UI smoke 推进到 public repo UI release marker 合同。
- public UI smoke 必须证明该入口来自真实 current-scan `code_chunks` 查询，不允许只靠静态 DOM 或手写 claim。
- release verifier 必须 fail-closed 消费该 marker，security regression 必须能拒绝伪造样本。

验收要求：

- `PUBLIC_REPO_UI_SMOKE_OK.codeUnderstandingLens.status="OK"`。
- `surface="PROJECT_QA_CODE_UNDERSTANDING_LENS"`。
- `scanTaskId/requestScanTaskId/responseScanTaskId` 必须等于顶层 `scanTaskId`。
- `responseStatus=200`，`resultCount > 0`，`currentScanOnly=true`。
- `inputKinds` 必须包含 `FILE_LINE`，`queryShapes` 必须包含 `file:line`。
- `primaryMatched=true`，`targetFileMatchesExpected=true`。
- `sourceLabels` 必须是 response-local `C\d+`。
- `primaryReferences` 必须是 safe relative `path:start-end`，且路径匹配 `expectedEvidenceFile`，`end >= start`。
- `primaryContextRoles` 必须为 `PRIMARY`。
- `retrievalModes` 只能是 `KEYWORD`、`HYBRID`、`SEMANTIC_FALLBACK`、`STABLE_FALLBACK`。
- `readiness` 只能是 `READY` 或 `REVIEW`，`readinessUsable=true`。
- `entryVisible`、`primaryReferenceVisible`、`currentScanVisible`、`primaryEvidenceVisible`、`sourceLabelVisible`、`retrievalModeVisible`、`readinessVisible` 必须为 true。
- `locateSearchVisible`、`explainHereVisible`、`copyReferenceVisible` 必须为 true。
- `derivedFromVisibleResults=true`，`resultSetOnly=true`，`noHorizontalOverflow=true`。
- `rawAnswerStored/rawQueryStored/rawStackStored/rawPromptStored/providerQualityClaim/llmFactClaim` 必须全部为 false。

非范围：

- 不要求本轮刷新 full release evidence。
- 不证明通用代码语义理解。
- 不证明所有语言、所有 stack trace 或任意方法锚点均可定位。
- 不证明 LLM 事实正确、provider quality、真实 patch 可用、GitHub App/webhook E2E、private repos 或生产部署。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh`。
- PASS：`bash -n scripts/security-regression-check.sh`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker`。
- PASS：scoped `git diff --check`。
- NOT RUN：`make public-repo-ui-smoke`，因为当前 shell 未提供 `SL_PUBLIC_REPO_UI_*` 环境变量。

## P6 增量：AgentChat code understanding handoff

目标：

- 将 ProjectDetail 的 `代码理解定位入口` 增加受控 AgentChat 续问入口。
- 主解释闭环仍由 Project QA 的 `解释此处` 承担；AgentChat handoff 只负责把当前 scan 的证据位置交给会话草稿。
- 该入口不得自动发送消息、不得自动创建 AgentTask、不得触发写工具或 AutoRepair。

验收要求：

- ProjectDetail 必须提供 `交给 Agent` 动作。
- handoff URL 必须包含 `handoff=code-understanding` 和 `source=PROJECT_QA_CODE_UNDERSTANDING_LENS`。
- handoff URL 只能携带结构化证据字段：`projectId`、`scanTaskId`、`inputKind/inputLabel`、`sourceLabel`、`filePath`、`lineRef`、`contextRole`、`evidenceType`、`relevanceScore`。
- handoff URL 不得携带 raw prompt、raw stack、代码正文、模型输出、token、Authorization 或 provider raw response。
- AgentChat 必须展示 `代码理解交接包`，并显示来源、输入类型、扫描、证据角色、证据类型、相关分和文件路径。
- AgentChat 必须基于结构化元数据本地生成草稿；未选择会话时不得自动发送。
- 创建或选择会话后，草稿必须保留在 `输入给 SourceLens Agent 的问题` 文本框中。
- smoke marker `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.codeUnderstandingHandoff` 必须证明 `rawPromptInUrl=false`、`rawPromptInUrlBlocked=true`、`handoffVisible=true`、`draftPrefilled=true`、`conversationCreatedOrSelected=true`、`autoSent=false`、`providerQualityClaim=false`、`llmFactClaim=false`、`noHorizontalOverflow=true`。

非范围：

- 不新增后端 API。
- 不新增 DB schema。
- 不自动创建 AgentTask。
- 不证明 Agent 已理解或 LLM 事实正确。
- 不刷新 full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make agent-chat-closure-rail-ui-smoke`。
- PASS：`make project-qa-recoverable-ui-smoke`。

## P6 增量：AgentChat binding release evidence contract

目标：

- 将 AgentChat code-understanding AgentTask binding 从 mocked UI proof 升级为 release evidence 可复核合同。
- release evidence schema v3 必须显式记录 `include_agent_chat_closure_rail_ui_smoke`。
- release verifier 必须 fail-closed 消费 `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.codeUnderstandingHandoff.agentTaskBinding`。
- security regression 必须能拒绝伪造 marker，防止只改日志或 status 伪造通过。

验收要求：

- `agent-chat-closure-rail-ui-smoke` 为 OK 时，日志必须且只能包含一个 `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK` marker。
- marker 必须来自 `agent-chat-closure-rail-smoke.spec.ts`，`baseURLHost` 只能为 localhost/127.0.0.1/::1。
- 顶层必须证明 `mockedApiOnly=true`、`unhandledApiRequests=0`、`runtimeIssues=0`、`noHorizontalOverflow=true`。
- `codeUnderstandingHandoff` 必须证明 `surface=PROJECT_DETAIL_CODE_UNDERSTANDING_AGENT_HANDOFF`、`source=PROJECT_QA_CODE_UNDERSTANDING_LENS`、`inputKind=FILE_LINE`、`queryShape=file:line`、`rawPromptInUrl=false`、`rawPromptInUrlBlocked=true`、`autoSent=false`、`providerQualityClaim=false`、`llmFactClaim=false`。
- `agentTaskBinding` 必须证明 `taskStatus=PENDING`、`taskType=CUSTOM`、`sameProjectBound=true`、`sameScanBound=true`、`conversationBound=true`、`boundByBackend=true`、`structuredInputOnly=true`、`rawPromptStored=false`、`rawStackStored=false`、`autoStarted=false`、`agentTaskCreated=true`。
- `agentTaskBinding.projectId/scanTaskId` 必须与父 marker 一致，`agentTaskBinding.agentTaskId` 必须与顶层 `agentTaskId` 一致。
- marker 不得包含 token、password、Authorization、private key、api key、secret、raw prompt、raw stack、raw output、raw answer、source content 或 code body。

非范围：

- 不要求本轮刷新 full release authority。
- 不证明真实 LLM/provider 质量。
- 不证明 Agent 自动执行、工具调用、AutoRepair、PR、GitHub App/webhook E2E、private repos 或生产部署。

验证结果：

- PASS：`bash -n scripts/release-evidence.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`make agent-chat-closure-rail-ui-smoke`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-agent-chat-marker`。
- PASS：focused minimal release evidence package with only `include_agent_chat_closure_rail_ui_smoke=true` plus `verify-release-evidence`。

## P6 增量：AgentChat manual-send evidence closure

目标：

- 将 AgentChat code-understanding handoff 从“创建 PENDING 绑定任务并预填草稿”推进到“用户手动发送后仍能回看 AgentTask / Scan / Audit 的闭环”。
- 明确手动发送是用户动作，不得由 handoff、AgentTask 创建、页面跳转或 SSE 初始化自动触发。
- marker 与 release verifier 必须能区分“绑定后自动发送”和“点击发送后提交”。

验收要求：

- AgentChat 对 code-understanding `CUSTOM/PENDING` 绑定任务必须展示 `代码理解手动发送闭环`。
- 该闭环必须显示 `等待用户手动发送`，并明确发送前不会启动 AgentTask 或触发写入/修复工具。
- `agent-chat-closure-rail-smoke` 必须在每个 viewport 证明创建绑定任务后，点击发送前 `messageRequests` 没有增量。
- smoke 必须点击 `发送` 按钮，并证明点击后仅对绑定 conversation 产生一次 `/api/conversations/{id}/messages` 请求。
- 手动发送后，闭环栏仍必须展示 `Conv #`、`AgentTask #`、`Scan #`、`查看工具审计`、`打开 Agent 任务`、`打开扫描报告`。
- marker 必须包含 `codeUnderstandingHandoff.manualSend`，并证明：
  - `status=OK`
  - `triggeredByUser=true`
  - `messageRequestAfterClick=true`
  - `autoSentBeforeClick=false`
  - `agentTaskStillPending=true`
  - `autoStarted=false`
  - `writeToolTriggered=false`
  - `closureRailStillBound=true`
  - `auditReviewVisible=true`
  - `rawPromptStored=false`
  - `rawStackStored=false`
- release verifier 必须拒绝缺失或伪造 `manualSend` 的 OK marker。
- security regression 必须覆盖 missing manualSend、manualSend array、auto-send-before-click、message request missing、auto-started、task not pending、write tool triggered、audit hidden、raw prompt/stack stored。

非范围：

- 不新增后端 API 或 DB schema。
- 不自动 start AgentTask。
- 不证明真实 LLM/provider 质量。
- 不证明真实工具调用、AutoRepair、PR、GitHub App/webhook、private repos 或生产部署。
- 不刷新 full release authority。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make agent-chat-closure-rail-ui-smoke`。
- PASS：`CI=true make project-qa-recoverable-ui-smoke`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-agent-chat-marker`。
- PASS：`./scripts/verify-release-evidence.sh release-evidence/20260703-181321`。

## P9 增量：AgentTasks three-viewport readability and task raw payload safety

目标：

- 将 AgentTasks 从“可打开详情”推进到“三视口下详情可读、任务级 raw input/output 默认隐藏且可被 smoke 证明”。
- 覆盖 `1440x900`、`390x844`、`320x740`，让任务列表、详情卡、健康状态、步骤摘要和 raw payload 安全提示在桌面、普通手机和极窄屏下都可读。
- 明确本轮只保护 task-level `selectedTask.inputJson/outputJson`，不把共享 `TaskTimeline.step.outputJson` 改造纳入本切片。

验收要求：

- AgentTasks 详情必须展示 `原始 Payload 安全边界`。
- task-level `inputJson/outputJson` 只能显示“原始输入/输出默认隐藏”提示，不得把 JSON 原文、prompt、token、Authorization、provider raw output 或模型完整回答渲染到页面。
- smoke fixture 必须包含可识别 raw payload 哨兵：`RAW_AGENT_TASK_INPUT_SHOULD_NOT_RENDER`、`RAW_AGENT_TASK_OUTPUT_SHOULD_NOT_RENDER`、`sk-test-token`、`Authorization: Bearer forged`。
- smoke 必须证明页面正文和 `AGENT_TASKS_DETAIL_SELECTION_SMOKE_OK` marker 均不包含上述哨兵。
- marker 必须包含 `viewports=["1440x900","390x844","320x740"]` 和一致的 `visitedViewports`。
- marker 必须包含 `layoutDensity`、`layoutGuards`、`readabilityGuards`、`tableOverflowOwnedByScroller`、`mobileReadability`、`payloadSafety`。
- `payloadSafety.scope` 必须为 `TASK_RAW_INPUT_OUTPUT_ONLY`，避免误声称步骤输出或全系统 raw payload 已完成治理。

非范围：

- 不新增授权查看 raw payload 的能力。
- 不改后端 API、DB、Agent runtime、权限模型或 release evidence schema。
- 不新增 AgentTasks release verifier/security forged matrix。
- 不重构共享 `TaskTimeline`；其 step output raw 边界作为后续独立切片处理。
- 不刷新 full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make agent-tasks-detail-selection-ui-smoke`。
- PASS：`CI=true make app-shell-ui-smoke`。

## P9 增量：TaskTimeline step output raw payload safety

目标：

- 将上一轮明确后置的 `TaskTimeline.step.outputJson` 风险独立收口，避免 AgentTasks 步骤时间线把模型输出、工具返回、token、Authorization 或 provider raw output 直接渲染到普通详情页。
- 保持任务步骤可复盘：步骤标题、状态、类型、工具名、耗时、描述和错误信息必须继续可见。
- 明确本轮只治理共享 `TaskTimeline` 的 step-level `output` 默认展示行为，不新增 raw 查看权限或后端授权链路。

验收要求：

- `TaskTimeline` 对 `item.output` 不得渲染原文、不得 `JSON.parse` 后格式化展示、不得保留 raw `<pre>`。
- 有 step output 时必须展示 `步骤输出安全边界` note，并显示“步骤输出已留存，默认隐藏；请通过授权审计或产物复核。”。
- AgentTasks smoke fixture 必须包含 step-level raw output 哨兵：`RAW_AGENT_STEP_OUTPUT_SHOULD_NOT_RENDER`、`STEP_SECRET_SHOULD_NOT_RENDER`。
- smoke 必须证明页面正文和 `AGENT_TASKS_DETAIL_SELECTION_SMOKE_OK` marker 均不包含 task-level 与 step-level raw payload 哨兵。
- marker 的 `payloadSafety.scope` 必须升级为 `TASK_AND_TIMELINE_STEP_RAW_OUTPUT_ONLY`，避免误声称 Artifacts、AuditLogs、LogViewer 或授权 raw 查看体系已完成。
- marker 必须证明 `fixtureHasRawStepOutput=true`、`rawStepOutputHidden=true`、`rawStepOutputRendered=false`、`rawStepOutputNoticeVisible=true`、`rawStepOutputPreAbsent=true`。

非范围：

- 不新增“查看 raw payload”按钮、权限、脱敏 UI 或审计事件。
- 不修改后端 API、DB schema、Agent runtime、ExecutionTask schema 或 release evidence schema。
- 不治理 Artifacts、AuditLogs、LogViewer、artifact 文件预览或后端日志中的 raw 内容。
- 不刷新 full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make agent-tasks-detail-selection-ui-smoke`。
- PASS：`CI=true make execution-tasks-detail-selection-ui-smoke`。
- PASS：`CI=true make patch-ready-ui-smoke`。

## P9 增量：LogViewer display redaction safety

目标：

- 将共享 `LogViewer` 从“直接展示执行日志原文”推进到“普通 UI 默认展示脱敏后的日志”，降低 execution logs、AutoRepair test logs 中 token、Authorization、provider key、password、JWT 被页面或 smoke marker 泄露的风险。
- 保持日志仍可用于排障：非敏感上下文、时间线、步骤、错误和普通文本继续可读。
- 明确本轮只做前端 display redaction，不替代后端 `SensitiveDataSanitizer`，不新增 raw 查看权限或日志访问授权体系。

验收要求：

- `LogViewer` 必须在传入 `<pre>` 前生成 `redactedValue`，不得把原始 `value` 直接渲染。
- `LogViewer` 必须覆盖 `Authorization: Bearer ...`、独立 `Bearer ...`、`token/apiKey/apikey/api_key/secret/password` key-value、带引号 secret、裸 `sk-...` 和 JWT 三段 token。
- `LogViewer` 必须暴露稳定 `.sl-log-viewer` 和 `aria-label="脱敏执行日志"`，便于浏览器 smoke 和辅助技术识别。
- ExecutionTasks smoke 必须注入常见日志 secret 哨兵，并证明页面正文和 `EXECUTION_TASKS_DETAIL_SELECTION_SMOKE_OK` marker 均不含 raw secret。
- PATCH_READY smoke 必须在 AutoRepair `testLog` 注入常见日志 secret 哨兵，并证明页面正文和 `PATCH_READY_UI_SMOKE_OK` marker 均不含 raw secret。
- 两个 marker 的 `logSafety.scope` 必须为 `LOG_VIEWER_DISPLAY_REDACTION_ONLY`，避免误声称后端存量日志、artifact preview、AuditLogs raw JSON 或授权 raw 查看体系已完成治理。

非范围：

- 不新增后端 API、DB schema、权限系统、raw 查看按钮、审计事件或 release evidence schema。
- 不替代后端日志写入侧脱敏，不清理历史存量日志。
- 不治理 artifact 文件预览、AuditLogs raw JSON、CI raw log snippet 或完整日志下载授权。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make execution-tasks-detail-selection-ui-smoke`。
- PASS：`CI=true make patch-ready-ui-smoke`。

## P9 增量：AuditLogs raw JSON display redaction safety

目标：

- 将 `AuditLogs` 抽屉中的原始 JSON 展示从“默认折叠但展开后直出”升级为“默认折叠且展开后只显示前端脱敏视图”。
- 覆盖三类治理来源：通用审计日志 `inputJson`、Agent 工具调用 `argumentsJson`、GitHub Webhook Delivery `resultJson`。
- 保持排障可用性：非敏感字段、ID、路径、状态、报告来源和 candidate receipt provenance 继续可读。

验收要求：

- `AuditLogs` 必须在渲染 `<pre>` 前生成 display-redacted JSON，不得把 `tryFormatJson(value)` 或原始 JSON 直接放入普通 UI。
- 脱敏覆盖 `Authorization: Bearer ...`、独立 `Bearer ...`、`token/apiKey/apikey/api_key/secret/password/privateKey/access_token/refresh_token`、带空格引号 secret、裸 `sk-...` 和 JWT。
- `compactJson` 表格预览也必须使用同一脱敏格式化函数，避免 GitHub Webhook `resultJson` 在表格中泄露。
- smoke fixture 必须注入 raw secret 哨兵，并证明 `Sanitized Input`、`Arguments`、`Result` 三类展开块都出现 `[REDACTED]` 且不出现 raw secret。
- marker 必须包含 `auditJsonSafety.scope=AUDIT_LOGS_RAW_JSON_DISPLAY_REDACTION_ONLY`，并证明 `rawSecretsHidden=true`、`auditInputRedacted=true`、`toolArgumentsRedacted=true`、`deliveryResultRedacted=true`、`markerContainsRawSecret=false`。
- 原始 JSON 默认折叠且展开后仅显示前端脱敏视图，不代表新增授权 raw 查看能力。

非范围：

- 不新增后端 API、DB schema、权限模型、raw 查看按钮、审计事件或 release evidence schema。
- 不改变审计日志落库/查询合同，不改变 `parseAuditInputObject` 的 provenance 解析。
- 不声明 Artifacts preview、CI raw log snippet、后端历史日志或完整 raw 查看授权体系已完成治理。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make audit-logs-detail-selection-ui-smoke`。

## P9 增量：Artifacts preview display redaction safety

目标：

- 将运行产物智能预览从“直接展示 preview text/raw JSON”升级为“普通 UI 只显示前端脱敏视图”。
- 覆盖三条用户可见路径：结构化 JSON 智能预览、纯文本预览、JSON 解析失败 fallback。
- 保持智能预览能力：架构报告 tabs、摘要、风险、API、数据库等结构化信息继续可读。

验收要求：

- `ArtifactPreviewRenderer` 必须在渲染普通 UI 前对 preview 内容做 display redaction。
- raw JSON details 展开后必须渲染 `.sl-artifact-redacted-raw-json`，不得直接 `JSON.stringify(parsed.data, null, 2)`。
- 非 JSON `<pre>` 和 JSON parse fail fallback 必须走同一显示层脱敏。
- 脱敏覆盖 `Authorization: Bearer ...`、独立 `Bearer ...`、`token/apiKey/apikey/api_key/secret/password/privateKey/private_key/accessToken/access_token/refreshToken/refresh_token`、带空格引号 secret、裸 `sk-...` 和 JWT。
- smoke fixture 必须注入 raw secret 哨兵，并证明结构化 JSON、raw JSON、纯文本、损坏 JSON 预览均出现 `[REDACTED]` 且不出现 raw secret。
- marker 必须包含 `artifactPreviewSafety.scope=ARTIFACTS_PREVIEW_DISPLAY_REDACTION_ONLY`，并证明 `rawSecretsHidden=true`、`structuredJsonRedacted=true`、`rawJsonRedacted=true`、`textPreviewRedacted=true`、`malformedJsonRedacted=true`、`markerContainsRawSecret=false`。

非范围：

- 不改后端 preview/download API、artifact DB/storage、产物生成逻辑或权限模型。
- 不改变下载原文能力；本轮只声明浏览器普通预览显示层脱敏。
- 不声明 CI raw log snippet、后端历史产物清洗、完整 raw 查看授权体系完成。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make artifacts-detail-selection-ui-smoke`。

## P9 增量：CI Diagnostics raw log display redaction safety

目标：

- 将 CI Diagnostics 详情中的 `rawLogSnippet` 从“普通 UI 直接展示原始片段”升级为“普通 UI 展示脱敏后的 CI 日志片段”。
- 保持排障价值：测试名、失败摘要、文件路径、错误上下文等非敏感内容继续可读。
- 与 LogViewer、AuditLogs、Artifacts preview 的 display-redaction 防线保持一致。

验收要求：

- `CiDiagnostics` 不得直接渲染 `selected.rawLogSnippet`。
- 详情日志 `<pre>` 必须使用 `.sl-ci-log-redacted` 和 `aria-label="脱敏 CI 日志片段"`。
- 脱敏覆盖 `Authorization: Bearer ...`、独立 `Bearer ...`、`authorization/bearer/token/apiKey/apikey/api_key/secret/password/privateKey/private_key/accessToken/access_token/refreshToken/refresh_token`、带空格引号 secret、裸 `sk-...` 和 JWT。
- smoke fixture 必须注入 raw secret 哨兵，并证明页面文本和 `CI_DIAGNOSTICS_DETAIL_SELECTION_SMOKE_OK` marker 均不包含 raw secret。
- marker 必须包含 `ciLogSafety.scope=CI_DIAGNOSTICS_RAW_LOG_DISPLAY_REDACTION_ONLY`，并证明 `rawSecretsHidden=true`、`redactionVisible=true`、`sanitizedLogVisible=true`、`markerContainsRawSecret=false`。

非范围：

- 不改后端 API、DB/entity/schema、历史数据或 `SensitiveDataSanitizer`。
- 不新增 raw log 授权查看能力。
- 不改变 CI provider/webhook、LLM 诊断质量、AutoRepair patch/PR E2E。
- 不刷新 full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make ci-diagnostics-detail-selection-ui-smoke`。

## P6/P9/P10 增量：Project QA AutoRepair candidate source evidence display redaction

目标：

- Project QA 已验证引用进入 AutoRepair candidate draft 时，普通 UI、URL handoff、create payload handoff 和 smoke marker 不得扩散 QA/报告派生 raw secret。
- 保留可审计来源链路：`PROJECT_QA_VERIFIED_CITATION`、Scan、文件、行号、source label、chunk/citation id、citation enforcement、sourceEvidenceMatchType 和 candidate receipt action 仍可见。

验收要求：

- `ProjectDetail` 的 QA 聊天内容必须在普通 UI 渲染前走 shared display redaction。
- `qaAnswerSourceEvidenceReceipt` 必须使用 `redactedEvidenceRefForOutput(ref)` 输出 title/source/category/fileReference。
- `qaSourceFileMatchRelease` 的展示用 target/citation reference 必须走 display redaction。
- `qaCitationRepairTargetDesc` 必须在写入 `/auto-repairs?...` 前脱敏 question、citation line reference 和 citation evidence reason。
- `appendSourceEvidenceParams` 写入 `sourceEvidenceCategory/source/title/filePath/lineNumber` 前必须使用 redacted source evidence。
- `project-qa-autorepair-candidate-smoke` 必须注入 Bearer、Authorization、apiKey、password、JWT-like raw secret，并证明 QA answer、QA source receipt、source match release、AutoRepair draft receipt、candidate receipt、body、`data-sl-target-url`、browser URL、create payload 和 marker 均不含 raw secret。
- marker 必须包含 `PROJECT_QA_AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY` scope，并证明 `uiRawSecretsHidden=true`、`bodyRawSecretsHidden=true`、`urlRawSecretsHidden=true`、`payloadRawSecretsHidden=true`、`markerContainsRawSecret=false`。

非范围：

- 不改后端 DB、审计存储、API response、DevTools/network、raw download、历史 QA/AutoRepair payload 或 artifact preview。
- 不声明 GitHub App、真实 LLM provider、release evidence full authority 或后端 raw 查看授权体系已完成。
- 如果未来需要后端 raw provenance 与前端 URL 安全同时成立，必须另开 receipt-id / server-side handoff 设计。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true npm --prefix web-console run smoke:project-qa-autorepair-candidate`。
- PASS：`CI=true npm --prefix web-console run smoke:report-autorepair-candidate`。
## P10/P11 增量：Artifacts raw download marker release verifier hardening

目标：

- Artifacts raw download 审计 receipt/fallback 与 AuditLogs exact deep link 证据进入 release evidence 包时，必须被 `verify-release-evidence.sh` 严格验证，防止伪造 marker 绕过发布门禁。
- 这些 marker 保持 optional-present 合同：没有运行 Artifacts/AuditLogs mocked UI smoke 的证据包不因此失败；一旦日志中出现 `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK` 或 `AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK`，必须唯一且完整证明低敏审计定位边界。

验收要求：

- `verify-release-evidence.sh` 必须扫描 release evidence 内 `.log` 文件中的 `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK`。
- `verify-release-evidence.sh` 必须扫描 release evidence 内 `.log` 文件中的 `AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK`。
- marker 缺失时 verifier 通过，不改变标准 release evidence step 数。
- marker 出现时必须唯一，且 JSON 必须证明：
  - `mockedApiOnly=true`、`unhandledApiRequests=0`、`runtimeIssues=0`、`noHorizontalOverflow=true`。
  - viewport 至少包含 `1440x900`、`390x844`、`320x740`。
  - `baseURLHost` 只允许 localhost/loopback。
  - `rawDownloadBoundary.scope=ARTIFACTS_RAW_DOWNLOAD_ACKNOWLEDGEMENT_AUDIT_BOUNDARY_ONLY`，并证明 request、acknowledgement、artifact id 和 no drawer hijack 边界。
  - `rawDownloadAuditDeepLink.scope=ARTIFACTS_RAW_DOWNLOAD_AUDIT_DEEP_LINK_ONLY`，并证明 positive `auditLogId`、`resourceType=ARTIFACT`、`action=ARTIFACT_RAW_DOWNLOAD`、`status=SUCCESS`、低敏 query、URL 不含 raw payload/storagePath/fileName。
  - `rawDownloadAuditFallback.scope=ARTIFACTS_RAW_DOWNLOAD_AUDIT_FALLBACK_WITHOUT_RECEIPT_ID_ONLY`，并证明 receipt id 缺失时只按 resource/action/status fallback，不伪称 receipt id。
- AuditLogs marker 出现时必须唯一，且 JSON 必须证明 `auditLogId` 绑定 selected event、同 resource conflicting event 不劫持、`resourceType=ARTIFACT`、`action=ARTIFACT_RAW_DOWNLOAD`、`status=SUCCESS`、关联资源回跳 `/artifacts?projectId=...&artifactId=...`，并且回跳 URL 不含 `auditLogId/rawPayload/storagePath/fileName/contentType/checksum/sizeBytes`。
- security regression 必须提供独立 `release-verifier-artifacts-marker` suite，动态证明合法 marker 可过、重复或关键字段篡改会 fail closed。
- CI security matrix 和 Makefile 必须暴露该 suite，static gate 必须锁定引用。

非范围：

- 不把 `artifacts-detail-selection-ui-smoke` 纳入标准 release evidence step。
- 不改变 Artifacts download API、storage、preview、审计表 schema 或 raw download 权限模型。
- 不刷新 full release authority。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-artifacts-marker`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。

## P6/P9 增量：Project QA code understanding controlled Agent handoff

目标：

- ProjectDetail 的 code understanding lens 不只是展示证据，还必须在用户进入 AgentChat 前清楚表达“能交接什么、不能交接什么、是否会自动发送”。
- `解释此处` 与 `交给 Agent` 必须只在当前扫描、PRIMARY 主证据、非加载状态下启用。
- handoff URL 源头必须使用 display-redacted 的 `filePath/lineRef/inputLabel/sourceLabel`，不得把 raw prompt、raw stack、源码正文或未脱敏路径直接写进 query。

验收要求：

- `CodeUnderstandingLensPanel` 必须显示 `Agent 交接合约`，包含：
  - `交接字段：扫描 / 文件 / 行号 / 证据角色`。
  - `不会携带：源码正文 / raw prompt / stack`。
  - `执行方式：进入 AgentChat 后手动发送`。
- `CodeUnderstandingLensPanel` 必须派生 `readyForExplanation = primaryChunk && sameScan && primaryRole && !loading`。
- `解释此处` 和 `交给 Agent` 必须使用 `disabled={!readyForExplanation}`。
- stale scan 命中时必须显示 `请先重新定位当前扫描证据`，并阻断 `解释此处` / `交给 Agent`。
- context-only 命中时必须显示 `上下文线索不能直接交接`，并阻断 `解释此处` / `交给 Agent`。
- `buildCodeUnderstandingAgentHandoffUrl` 必须对 `filePath`、`lineRef`、`inputLabel`、`sourceLabel` 做 display redaction 后再写入 query。
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.codeUnderstandingLens` 必须包含：
  - `agentHandoffContract.visible=true`。
  - `agentHandoffContract.structuredFieldsOnly=true`。
  - `agentHandoffContract.rawSourceBodyStored=false`。
  - `agentHandoffContract.rawStackStored=false`。
  - `agentHandoffContract.rawPromptStored=false`。
  - `agentHandoffContract.autoSent=false`。
  - `agentHandoffContract.manualSendRequired=true`。
  - `actionGate.currentScanPrimaryRequired=true`。
  - `actionGate.agentHandoffEnabledWhenReady=true`。
  - `actionGate.staleScanExplainBlocked=true`。
  - `actionGate.contextOnlyAgentHandoffBlocked=true`。
  - `handoffUrlSafety.sourceSanitizedBeforeNavigation=true`。
  - `handoffUrlSafety.rawPromptInUrl=false`。
  - `handoffUrlSafety.rawStackInUrl=false`。
  - `handoffUrlSafety.rawCodeInUrl=false`。

非范围：

- 不声明通用代码语义理解、真实 LLM provider 质量、LLM 事实正确、所有语言/所有 stack trace 均可定位。
- 不自动启动 AgentTask，不自动发送 AgentChat 消息，不触发写入/命令工具。
- 不改后端 code chunk ranker、DB schema、AgentTask API、GitHub App、AutoRepair/PR E2E 或 full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`CI=true npm --prefix web-console run smoke:project-qa-recoverable`。
- PASS：`CI=true npm --prefix web-console run smoke:agent-chat-closure-rail`。
- PASS：`npm --prefix web-console run build`。

## P6/P9 增量：AgentChat code understanding pre-conversation CTA contract

目标：

- AgentChat 在 code understanding handoff 进入但尚未选择会话时，不能展示一个看似可用但没有 composer 的 `使用交接问题` 动作。
- 未选择会话时，主 CTA 必须清楚表达会先创建会话并绑定 AgentTask。
- 缺少 `scanTaskId` 时必须 fail closed，不能让用户看起来可以创建绑定 AgentTask。

验收要求：

- `CodeUnderstandingHandoffPanel` 在 `activeConversationId` 为空时必须隐藏 `使用交接问题`。
- 未选择会话时，主 CTA 文案必须为 `创建绑定任务并进入会话`。
- 已选择会话时，主 CTA 可以继续为 `创建绑定任务`。
- `scanTaskId` 缺失时，主 CTA 必须 disabled，并显示 `缺少成功扫描任务，无法创建绑定 AgentTask。`。
- 创建绑定任务时，如果没有 active conversation，前端必须先创建 conversation，再用该 conversationId 创建 `CUSTOM` AgentTask。
- 新建 conversation 写入本地列表时必须 upsert，不能产生相同 id 的重复 key。
- AgentTask receipt 继续保持 `rawPromptStored=false`、`rawStackStored=false`、`autoSent=false`、`autoStarted=false`。
- `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.codeUnderstandingHandoff.preConversationState` 必须证明：
  - `usePromptHiddenOrDisabled=true`。
  - `createBoundTaskPrimaryCta=true`。
  - `createTaskDisabledWhenMissingScan=true`。
  - `missingScanTaskCreateBlocked=true`。
  - `missingScanReasonVisible=true`。
  - `noAutoSentWithoutScan=true`。

非范围：

- 不改后端 conversation/AgentTask API。
- 不改 SSE、消息发送、工具调用或 AgentTask start 语义。
- 不自动发送 handoff prompt，不自动启动 AgentTask。
- 不刷新 full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`CI=true npm --prefix web-console run smoke:agent-chat-closure-rail`。
- PASS：`npm --prefix web-console run build`。

## P11 增量：AgentChat pre-conversation marker release verifier hardening

目标：

- `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.codeUnderstandingHandoff.preConversationState` 进入 release evidence 后，必须被 `verify-release-evidence.sh` 严格校验。
- `release-verifier-agent-chat-marker` 必须拒绝缺失、数组化或关键字段篡改的 pre-conversation marker。

验收要求：

- `verify-release-evidence.sh` 必须校验 `preConversationState` 是 object。
- `preConversationState.status` 必须为 `OK`。
- `preConversationState.usePromptHiddenOrDisabled` 必须为 `true`。
- `preConversationState.createBoundTaskPrimaryCta` 必须为 `true`。
- `preConversationState.createTaskDisabledWhenMissingScan` 必须为 `true`。
- `preConversationState.missingScanTaskCreateBlocked` 必须为 `true`。
- `preConversationState.missingScanReasonVisible` 必须为 `true`。
- `preConversationState.noAutoSentWithoutScan` 必须为 `true`。
- `security-regression-check.sh --suite release-verifier-agent-chat-marker` 必须动态拒绝：
  - `missing-pre-conversation-state`。
  - `pre-conversation-state-array`。
  - `pre-conversation-use-prompt-visible`。
  - `pre-conversation-primary-cta-missing`。
  - `pre-conversation-missing-scan-enabled`。
  - `pre-conversation-missing-scan-created-task`。
  - `pre-conversation-missing-scan-reason-hidden`。
  - `pre-conversation-auto-sent-without-scan`。

非范围：

- 不把 AgentChat closure rail smoke 从已有 release include 语义扩大到新的标准 step。
- 不刷新 full release authority。
- 不改变 AgentChat UI、后端 API、AgentTask payload 或 SSE。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-agent-chat-marker`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。

## P6 增量：Project QA Source Location Confidence Mocked Gate

目标：

- Project QA 在进入修复候选前，必须把报告/代码证据来源拆成可理解的可信度状态。
- `REPORT_LINE_ANCHOR` 代表报告证据文件、行号和回答引用已经对齐，可以进入修复复核。
- `REPORT_FILE_ANCHOR` 代表只匹配到文件级锚点，仍可能存在同名文件、source URL 或行号漂移风险，不能直接放行修复候选。

验收要求：

- `project-qa-recoverable` smoke 每个视口必须提交一条 request-bound `REPORT_LINE_ANCHOR` QA。
- line anchor 请求必须携带 `evidenceRef.filePath` 和 `evidenceRef.lineNumber`。
- line anchor 响应必须回显 `sourceEvidenceMatched=true` 和 `sourceEvidenceMatchType=REPORT_LINE_ANCHOR`。
- 页面必须显示 `来源定位可信` 和 `行级锚点`。
- line anchor 场景允许显示 `生成修复候选`。
- `project-qa-recoverable` smoke 每个视口必须提交一条 request-bound `REPORT_FILE_ANCHOR` drift QA。
- file anchor drift 请求必须携带 `evidenceRef.filePath` 和漂移行号。
- file anchor drift 响应必须回显 `sourceEvidenceMatched=true` 和 `sourceEvidenceMatchType=REPORT_FILE_ANCHOR`。
- 页面必须显示 `来源定位需复核` 和 `文件锚点`。
- file anchor drift 场景的 `QA 下一步动作` 与引用卡片都不能显示 `生成修复候选`。
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.sourceLocationConfidence` 必须记录 request-bound、line anchor ready、file anchor drift review 和 no-overclaim 字段。

非范围：

- 不声明真实 provider 回答质量提升。
- 不声明 LLM 事实语义正确。
- 不改变后端 API、DB、ranker 或 AutoRepair。
- 不刷新 full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`CI=true npm --prefix web-console run smoke:project-qa-recoverable`。
- PASS：`npm --prefix web-console run build`。

## P6/P9 增量：Project QA Source Location Confidence Readability Marker

目标：

- 在 `PROJECT_QA_RECOVERABLE_SMOKE_OK.sourceLocationConfidence` 已证明 line/file anchor 状态之后，进一步证明这些状态在桌面、390px 移动端和 320px 窄屏下可读。
- 来源凭证、来源定位可信度、来源文件匹配说明不能被水平裁切，长文件路径和引用信息必须可换行。
- `REPORT_FILE_ANCHOR` drift 场景的阻断原因必须完整展示，并继续证明不放行 `生成修复候选`。

验收要求：

- `project-qa-recoverable` smoke 必须保留三视口：`1440x900`、`390x844`、`320x740`。
- 每个视口必须继续提交 request-bound `REPORT_LINE_ANCHOR` 与 `REPORT_FILE_ANCHOR` drift QA。
- 每个视口必须为 line anchor ready 与 file anchor review 各生成一条 `SourceLocationReadabilityProof`。
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.sourceLocationConfidence.readability.status` 必须为 `OK`。
- `sourceLocationConfidence.readability.proofCount` 必须覆盖 6 条证明：3 个视口 * 2 个状态。
- `sourceLocationConfidence.readability.mobile390Covered` 与 `narrow320Covered` 必须为 `true`。
- `sourceLocationConfidence.readability.sourceReceipt` 必须证明 `readyContained`、`reviewContained`、`referenceWraps`、`titleNotClipped`、`tagsNotClipped`。
- `sourceLocationConfidence.readability.sourceLocationConfidence` 必须证明 `readyContained`、`reviewContained`、`metricsNotClipped`、`checksWrap`。
- `sourceLocationConfidence.readability.sourceFileMatchRelease` 必须证明 `readyContained`、`reviewContained`、`targetReferenceNotClipped`、`citedReferenceNotClipped`、`checksNotClipped`、`noRepairOnReview`。
- `sourceLocationConfidence.readability.noHorizontalOverflow` 必须为 `true`。
- `sourceLocationConfidence.readability.providerQualityClaim=false`、`llmFactClaim=false`。
- `scripts/validate-frontend-ui.mjs` 必须静态锁定 readability helper、proof 数组、marker 聚合字段和 no-overclaim 字段。

非范围：

- 不声明真实 provider 回答质量提升。
- 不声明 LLM 事实语义正确。
- 不改变后端 API、DB、ranker、AutoRepair 或 release evidence schema。
- 不刷新 full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`CI=true npm --prefix web-console run smoke:project-qa-recoverable`。
- PASS：`npm --prefix web-console run build`。

## P6/P11 增量：Public Repo UI Source Location Readability Marker

目标：

- 把 mocked `PROJECT_QA_RECOVERABLE_SMOKE_OK.sourceLocationConfidence.readability` 的可读性口径吸收到真实公开仓库 UI marker。
- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence` 不能只证明来源定位面板可见；新证据出现时必须量化证明来源凭证、来源定位可信度、来源文件匹配说明在 ready/review 两条路径下均 contained、not clipped、可换行且无横向溢出。
- 该 marker 只证明 UI 来源定位可读性和放行边界，不证明真实 provider 质量或 LLM 事实语义正确。

验收要求：

- `public-repo-ui-smoke.spec.ts` 必须定义 `SourceLocationReadabilityProof`，字段至少包含 `surface=PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY`、`mode=ready|review`、source receipt containment/wrap/not-clipped、source location confidence containment/metrics/checks、source file match release containment/not-clipped、`repairActionHiddenWhenReview`、`noHorizontalOverflow`、`providerQualityClaim=false`、`llmFactClaim=false`。
- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.sourceLocationReadability` 必须为 optional-but-strict：旧证据包缺字段不失败；字段出现时 release verifier 必须强校验。
- `sourceLocationReadability.proofCount` 必须覆盖至少 6 条 proof：3 个视口 * `ready/review` 两个状态。
- `mobile390Covered=true`、`narrow320Covered=true`。
- `sourceReceipt.readyContained/reviewContained/referenceWraps/titleNotClipped/tagsNotClipped` 必须全部为 `true`。
- `sourceLocationConfidence.readyContained/reviewContained/metricsNotClipped/checksWrap` 必须全部为 `true`。
- `sourceFileMatchRelease.readyContained/reviewContained/targetReferenceNotClipped/citedReferenceNotClipped/checksNotClipped/noRepairOnReview` 必须全部为 `true`。
- `noHorizontalOverflow=true`。
- `providerQualityClaim=false`、`llmFactClaim=false`。
- release verifier 必须交叉校验：
  - `qaFromEvidence.evidenceHandoff.sourceLocationConfidenceVisible=true`。
  - `qaFromEvidence.evidenceHandoff.sourceLocationConfidenceReadyVisible=true`。
  - `qaFromEvidence.sourceFileMatchRelease.sourceEvidenceMatchTypes` 包含 `REPORT_LINE_ANCHOR`。
  - `qaFromEvidence.fileAnchorDrift.sourceEvidenceMatchTypes` 包含 `REPORT_FILE_ANCHOR`。
  - `qaFromEvidence.fileAnchorDrift.latestNextActionRepairHidden=true`。
  - `qaFromEvidence.fileAnchorDrift.latestCitationRepairHidden=true`。
- security regression 必须拒绝伪造的 source-location readability marker，包括 proofCount 不足、390/320 缺失、contained=false、metrics/checks 裁切、review repair forged、overflow、provider/LLM overclaim、raw answer 或非法数组。
- `scripts/validate-frontend-ui.mjs` 必须静态锁定 public repo UI smoke、release verifier 和 security regression 的合同。

非范围：

- 不声明真实 public repo UI smoke 本轮已重新运行。
- 不刷新 current full release authority。
- 不改变后端 API、DB、ranker、AutoRepair 或 GitHub App E2E。
- 不声明 LLM 事实语义正确或 provider 质量提升。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`npm --prefix web-console run build`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker`。

## P9/P11 增量：Frontend Vendor Chunk Boundary Hardening

目标：

- 前端构建不能长期保留 Vite `index-*.js > 500 kB` warning。
- 第三方 UI 库可以形成明确 vendor cache boundary，但业务入口 chunk 不应被 AntD、icons、cssinjs 或 rc 依赖吞没。
- 构建门禁必须同时防止“未分包的大入口 warning”和“过度细拆 AntD 导致 Rollup circular manual chunk warning”。

验收要求：

- `web-console/vite.config.ts` 与 `web-console/vite.config.js` 必须保持同一份 vendor chunk 策略，避免 Vite 读取旧 JS config 时绕过 TS config。
- Vite `build.chunkSizeWarningLimit` 必须设置为 `1100`，并在文档中视为受控 AntD vendor 边界，不得用来掩盖业务入口膨胀。
- `manualChunks(id)` 必须至少输出：
  - `vendor-react`：React、React DOM、React Router。
  - `vendor-http`：Axios。
  - `vendor-antd`：AntD、Ant Design icons、Ant Design cssinjs、`rc-*`。
- AntD、icons、cssinjs 和 `rc-*` 必须同归 `vendor-antd`，不得拆成互相依赖的细粒度 chunk。
- `scripts/validate-frontend-ui.mjs` 必须静态锁定 Vite config 的 chunk limit、manualChunks 和 AntD vendor grouping。
- `npm --prefix web-console run build` 必须 PASS，且不得出现 Vite chunk-size warning 或 Rollup circular manual chunk warning。

非范围：

- 不证明首屏性能、运行时性能、Lighthouse 分数或真实用户性能指标。
- 不替代后续组件级按需导入、图标瘦身、route-level lazy load 或 UI dependency audit。
- 不改变后端、API、DB、鉴权、显示层脱敏、release evidence schema、GitHub App 或真实 LLM provider。
- 不刷新 current full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`git diff --check -- web-console/vite.config.ts web-console/vite.config.js scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。

## P6 增量：Function@SourceURL stack frame code-location support

目标：

- SourceLens 必须支持浏览器/Safari/Firefox 常见的 `function@source-url:file:line:column` stack frame 形态。
- 用户从浏览器控制台复制 `AuthStore.fetchUser@https://app.example.com/assets/auth-store.ts?t=...:85:13` 后，Project QA code understanding lens 应识别为栈帧定位，后端 code location parser 应抽出函数名和文件名作为 code_chunks 定位信号。

验收要求：

- `CodeLocationHintParser` 必须解析 `function@source-url` 形态，输出 `FunctionFileHint(fileName, methodName)`。
- class-qualified function 名必须降级为 simple function，例如 `AuthStore.fetchUser@...` 应使用 `fetchuser` 作为 method hint。
- parser 不得保留 raw URL host、query、hash 或 source URL body 到 marker；只能使用文件名、line hint 和 path suffix 结构信号。
- `methodAnchorFileHints` 必须从 `function@source-url` 生成 `auth-store.ts` 和 `authstore.ts` 等文件候选。
- `CodeChunkService` 必须在泛词或同页干扰下把同 scan 的目标 file chunk 排到首位。
- `ProjectDetail.classifyCodeUnderstandingQuery` 必须把该形态归类为 `STACK_TRACE`。
- `scripts/validate-frontend-ui.mjs` 必须锁定 parser 和 UI 分类合同。

非范围：

- 不新增 API、DB schema、code_chunks response schema 或 QA response schema。
- 不改变 RAG、rerank、AutoRepair gate 或 release evidence schema。
- 不证明任意浏览器、minified stack、sourcemap 反解或跨语言 stack trace 全部可定位。
- 不证明 LLM 事实正确、provider 质量或真实 public repo release marker 已吸收。
- 不刷新 current full release authority。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`npm --prefix web-console run build`。

## P6/P11 增量：Public repo report evidence QA multi-anchor citation quality

目标：

- 公开仓库分析不能只证明报告 JSON 字段自洽，还要证明报告里的真实 API 证据可以进入 Project QA，并被 QA 回答以当前 scan 的代码引用重新绑定。
- public repo smoke 应从 `ARCHITECTURE_REPORT.apiRoutes` 的 `handler_class/handler_method/line_number` 解析到同 scan 的 code_chunks file/line，再以 `evidenceRef` 调用真实 `/projects/{projectId}/qa`。
- release verifier 必须在 marker 出现时强校验多锚点引用质量，避免把 mock UI 或 provider 语义质量误当成真实报告引用质量。

验收要求：

- `SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION` 支持 `auto|true|false`。
- `auto` 模式有至少两个可解析 line-anchor 样本时输出 `PUBLIC_REPO_SMOKE_OK.reportEvidenceQaCitationQuality`；`true` 模式样本不足必须 fail closed；`false` 模式跳过。
- marker surface 必须为 `PUBLIC_REPO_REPORT_EVIDENCE_QA_MULTI_ANCHOR`。
- 每个样本必须满足当前 `scanTaskId`、`REPORT_LINE_ANCHOR`、`sourceEvidenceMatched=true`、`groundingStatus=VERIFIED`、引用强制成功、必需证据覆盖 `>=100%`、主张引用 `READY`、角色分布 `PRIMARY_BOUND`。
- marker 不得归档 raw prompt、raw answer、URL、host、token、password、secret、apiKey 或 provider 事实质量声明。
- `verify-release-evidence.sh` 必须 optional-present 强校验该 marker。
- `security-regression-check.sh --suite release-verifier-public-repo-marker` 必须覆盖有效 marker 接受和伪造 marker 拒绝。

非范围：

- 不新增后端 API、DB schema、QA response schema 或 code_chunks schema。
- 不声明 LLM 事实正确、provider 质量、完整报告语义质量或所有报告段落均可定位。
- 不刷新 full release authority。
- 不要求 GitHub App、私有仓库、多人协作或生产部署进入当前主线。

验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：public repo smoke Python heredoc `compile(...)`。
- PASS：`git diff --check -- scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：真实 public repo retained sample，命令为 `SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION=true SOURCELENS_PUBLIC_REPO_SMOKE_UI=false SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false ./scripts/public-repo-analysis-smoke.sh`。
- PASS：retained sample `projectId=339`、`repositoryId=300`、`scanTaskId=256`、commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`。
- PASS：`reportEvidenceQaCitationQuality.status=OK`，`sampleCount=2`，`REPORT_LINE_ANCHOR`，`VERIFIED`，`RETRY_VERIFIED`，required evidence coverage `100%`，claim citation `READY`，role distribution `PRIMARY_BOUND`。

组织要求：

- SourceLens 团队制度固定为 `11 个固定核心角色 + 5 个按需专家角色池`。
- 5 个专家为 `任正非`、`马云`、`雷军`、`马化腾`、`张一鸣`，只在对应专项触发时启动，不作为 16 个常驻物理子 agent。

## P6/P11 增量：Public repo cross-file file distribution sampler

目标：

- `crossFileRetrievalProof` 不能只证明 broad query 返回了多个文件，还要给出可审计的按文件分组样本。
- 分组样本必须帮助后续报告叙事质量和跨文件检索质量评估，证明当前 scan 的候选文件、证据类型、行号摘要和 source label 覆盖。

验收要求：

- `public-repo-analysis-smoke.sh` 必须在 `PUBLIC_REPO_SMOKE_OK.chunkSearch.crossFileRetrievalProof` 中输出 `fileDistribution` 和 `fileDistributionSampleCount`。
- `fileDistribution` 至少覆盖两个文件，最多保留前五个文件样本。
- 每个样本只能包含安全相对路径、`resultCount`、`evidenceTypes`、`sourceLabelCount`、`minStartLine`、`maxEndLine`，不得保存源码片段、raw prompt、raw answer、URL、token、password、secret 或 apiKey。
- `verify-release-evidence.sh` 对新字段采用 historical-compatible optional-present strict validation：旧证据同时缺少 `fileDistribution` 和 `fileDistributionSampleCount` 时仍可验证；新字段出现时必须完整校验。
- `security-regression-check.sh --suite release-verifier-public-repo-marker` 必须覆盖有效 marker 接受，以及缺分组、样本数不足、数量不匹配、不安全路径、空 evidenceTypes、sourceLabel undercount、无效行号范围等 forged marker 拒绝。

非范围：

- 不改后端 API、DB、QA DTO、code_chunks schema、ranker、embedding 或前端 UI。
- 不把 broad retrieval 的 `readiness=GAP` 解释为语义质量已达标。
- 不刷新 full release authority。

验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：public repo smoke Python heredoc `compile(...)`。
- PASS：`./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：真实 public repo retained sample，命令为 `SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION=true SOURCELENS_PUBLIC_REPO_SMOKE_UI=false SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false ./scripts/public-repo-analysis-smoke.sh`。
- PASS：retained sample `projectId=340`、`repositoryId=301`、`scanTaskId=257`、commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`。
- PASS：`crossFileRetrievalProof.fileDistributionSampleCount=4`，样本覆盖 SQL、`pom-war.xml`、`pom.xml` 和 `README.md`，全部绑定当前 `scanTaskId=257`。

## P6/P11 增量：Report evidence QA source diversity sampler

目标：

- `reportEvidenceQaCitationQuality` 不能长期只验证同一个 Controller 文件的前两条 API route。
- public repo smoke 应尽量从 `ARCHITECTURE_REPORT.apiRoutes` 中选择不同 file 的 line-anchor 样本，再按报告顺序补齐，形成结构化 source diversity 证据。

验收要求：

- 候选收集最多扫描 80 条 report route；当候选数达到 12 且文件数达到 4 时提前停止。
- QA 样本选择策略必须记录为 `samplingStrategy=DIVERSE_FILE_THEN_REPORT_ORDER`。
- marker 必须记录 `targetSampleCount=4`、`candidateCount`、`uniqueFileCount`、`sourceSectionCount`、`diversityStatus=MULTI_FILE|SINGLE_FILE`、`diversityFallbackUsed`。
- `verify-release-evidence.sh` 必须校验这些字段与 `samples` 一致，拒绝采样策略漂移、候选数不足、unique file 伪造、source section 伪造、diversity status/fallback 不一致。
- `security-regression-check.sh --suite release-verifier-public-repo-marker` 必须覆盖这些 forged cases。

非范围：

- 该 sampler 只证明 report evidence QA 的 source diversity，不证明完整 narrative quality。
- 不新增 `narrativeQualityScore`、`answerQualityScore`、`semanticCorrectness`、`factualAccuracy`、`providerConfidence`、`llmJudgeScore` 等 LLM/provider 质量字段。
- 不保存 raw question、raw prompt、raw answer、源码正文、URL、token、password、secret 或 apiKey。
- 不改后端 API、DB、QA DTO、code_chunks schema、ranker、embedding 或前端 UI。

验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：public repo smoke Python heredoc `compile(...)`。
- PASS：`./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：真实 public repo retained sample，命令为 `SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION=true SOURCELENS_PUBLIC_REPO_SMOKE_UI=false SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false ./scripts/public-repo-analysis-smoke.sh`。
- PASS：retained sample `projectId=342`、`repositoryId=303`、`scanTaskId=259`、commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`。
- PASS：`reportEvidenceQaCitationQuality.candidateCount=36`、`sampleCount=4`、`uniqueFileCount=4`、`sourceSectionCount=1`、`diversityStatus=MULTI_FILE`、`diversityFallbackUsed=false`。
- PASS：4 个 QA 样本分别绑定 `ExampaperController.java`、`ExamquestionbankController.java`、`ShuhuishenqingController.java`、`DiandangshenqingController.java` 的 `REPORT_LINE_ANCHOR`。

## P11 增量：Release evidence absorbs report evidence QA citation marker

目标：

- 下一次正式 `release` / `nightly` evidence 不能只在 standalone public repo smoke 里证明 `reportEvidenceQaCitationQuality`。
- release evidence 标准 `public-repo-smoke` step 必须显式吸收该 focused marker；当 profile 要求 true 时，marker 缺失必须失败。

验收要求：

- `release-evidence.sh` 必须暴露 `SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_REPORT_EVIDENCE_QA_CITATION=auto|true|false`。
- profile 行为必须为：`local=auto`、`ci=false`、`release=true`、`nightly=true`。
- manifest 必须记录 `public_repo_report_evidence_qa_citation`。
- 标准 public repo smoke 调用必须显式传递 `SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION`。
- `verify-release-evidence.sh` 必须在 manifest true 且 `public-repo-smoke` OK 时强制要求 `PUBLIC_REPO_SMOKE_OK.reportEvidenceQaCitationQuality`。
- 旧 evidence package 缺少该 manifest 字段时必须保持 historical-compatible。

非范围：

- 不刷新 full release authority。
- 不改后端 API、DB、QA DTO、code_chunks schema、ranker、embedding 或前端 UI。
- 不推进 GitHub App drill、webhook E2E 或真实 LLM provider 质量验收。

验证结果：

- PASS：`bash -n scripts/release-evidence.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：轻量 CI-profile release evidence 包生成与 `verify-release-evidence` 复核。
- PASS：`git diff --check -- scripts/release-evidence.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。

## P9 增量：ProjectDetail workspace next action rail

目标：

- ProjectDetail 首屏不能把添加仓库、触发扫描、最新报告、产物库并列成无优先级工具箱。
- 首屏必须根据项目状态给出一个清晰主动作，并同时展示下一步阻塞点和证据成熟度。

验收要求：

- `ProjectDetail.tsx` 必须通过 `ProjectWorkspaceNextActionRail` 渲染首屏行动栏。
- `buildProjectWorkspaceNextAction` 必须覆盖六个分支：
  - `ADD_REPOSITORY`
  - `START_SCAN`
  - `WATCH_SCAN`
  - `REVIEW_FAILED_SCAN`
  - `OPEN_ARTIFACTS`
  - `OPEN_QA`
- 行动栏必须显示：
  - 唯一主 CTA。
  - 一个次 CTA。
  - `data-sl-action-key`。
  - 仓库、扫描、code_chunks、核心产物四项证据检查。
  - 阻塞点和证据成熟度。
- mobile/narrow 下按钮文字必须可读，不得出现蓝底灰字、文字裁剪或横向溢出。
- Batch4A smoke 必须输出唯一 `PROJECT_WORKSPACE_NEXT_ACTION_SMOKE_OK`，证明：
  - `mockedApiOnly=true`。
  - `unhandledApiRequests=0`。
  - 视口覆盖 `1440x900`、`390x740`、`320x740`。
  - 六状态全部断言 `data-sl-action-key`、标题、主 CTA、次 CTA、证据检查。
  - `checkedCases=18`、`expectedCheckedCases=18`、`overflowFailures=0`。
  - `providerQualityClaim=false`、`llmFactClaim=false`。
- no repo/no scan/running/failed/evidence gap 的 artifacts/code_chunks mock 必须真实降级，不能依赖状态优先级遮住假 ready 数据。

非范围：

- 不改后端 API、DB、RAG、release evidence、GitHub App 或 LLM provider。
- `OPEN_QA` 只代表 UI 层入口条件，不代表 LLM/provider 答案质量。
- 右侧 latest analysis 刷新/详情按钮属于辅助工具，不作为主 CTA 竞争者。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`cd web-console && npm run smoke:p9-main-path-recoverable-error-states-batch4a`，12 passed。
- PASS：`git diff --check -- web-console/src/pages/ProjectDetail.tsx web-console/src/styles/app.css web-console/tests/p9-main-path-recoverable-error-states-batch4a.spec.ts scripts/validate-frontend-ui.mjs`。

## P9/P6 增量：ScanTaskDetail report evidence priority rail

目标：

- ScanTaskDetail 报告总览不能只靠用户进入质量风险 tab 才能打开证据。
- 报告总览必须在推荐下一步之后提供三类高价值证据入口：风险证据、引用预检、治理闭环。
- 证据入口必须可读、可点击、可审计，并且不能让 raw report secret 进入 code_chunks 查询、UI、clipboard、marker 或 QA deep link。

验收要求：

- `ScanTaskDetail.tsx` 必须渲染 `ReportEvidencePriorityRail`。
- priority rail 必须位于 `<ReportRecommendedNextStep />` 之后、`<ReportReviewGate />` 之前。
- priority rail 必须有三个稳定入口：
  - `risk-evidence`
  - `citation-readiness`
  - `governance-blocker`
- `risk-evidence` 必须保持稳定 key；没有文件级可修风险时只能降级内容和行动，不能换成其他 key。
- `buildEvidenceChunkQuery` 必须使用 redacted evidence，不得把报告摘要、影响、建议中的 raw bearer、apiKey、password、jwt 带进 `/code-chunks/search` query。
- CSS 必须保证：
  - 桌面 3 列。
  - 390px 手机 2 列。
  - 320px 窄屏 1 列。
  - 长路径、长摘要和按钮文字不裁剪、不横向溢出。
- `REPORT_EVIDENCE_DRAWER_SMOKE_OK` 必须包含：
  - `priorityRail.visible=true`
  - `priorityRail.firstEvidenceOpensDrawer=true`
  - `priorityRail.readyActionVisible=true`
  - `priorityRail.gapRepairHiddenOrDisabled=true`
  - `priorityRail.mobile390Covered=true`
  - `priorityRail.narrow320Covered=true`
  - `priorityRail.noHorizontalOverflow=true`
  - `codeChunksSearchRedaction.rawReportSecretsHidden=true`
  - `codeChunksSearchRedaction.redactionMarkerVisibleInReadyQuery=true`
  - `layoutDensity.decisionSummaryContained=true`
  - `mobileReadability.decisionSummaryNotClipped=true`
- smoke 必须从报告总览 priority rail 点击 `查看证据` 打开抽屉，不得只依赖质量风险 tab。

非范围：

- 不改后端 API、DB、code_chunks schema、ranker、embedding、release evidence、GitHub App 或 LLM provider。
- 不刷新 full release authority。
- 不声明完整报告语义质量、provider 质量或 LLM 事实正确。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`npm --prefix web-console run smoke:report-evidence-drawer`，2 passed。
- PASS：`git diff --check -- web-console/src/pages/ScanTaskDetail.tsx web-console/src/styles/app.css web-console/tests/report-evidence-drawer-smoke.spec.ts scripts/validate-frontend-ui.mjs`。

## P6/P11 增量：Report evidence QA exact line-anchor citation binding

目标：

- `reportEvidenceQaCitationQuality` 不能只证明 QA 回答有引用、claim `READY`、role `PRIMARY_BOUND`。
- focused marker 必须证明答案实际引用的 citation 与报告证据 sample 是同一个 `filePath + lineNumber` code chunk。
- release verifier 必须能独立拒绝 file mismatch、line range miss、非 PRIMARY、计数伪造和缺字段。

验收要求：

- `public-repo-analysis-smoke.sh` 的 `validate_report_evidence_qa_payload` 必须检查：
  - `answerCitations` 非空。
  - 至少一个 `citedByAnswer=true` citation 的 `filePath` 等于 sample `filePath`。
  - 该 citation 的 `startLine/endLine` 覆盖 sample `lineNumber`。
  - 至少一个 exact line-anchor citation 的 `contextRole=PRIMARY`。
- `reportEvidenceQaCitationQuality` 顶层必须输出：
  - `lineAnchorCitationStatus=ALL_SAMPLES_BOUND`
  - `lineAnchorBoundSampleCount`
  - `minLineAnchorCitedCount`
  - `minLineAnchorPrimaryCitedCount`
- 每个 sample 必须输出安全定位摘要：
  - `lineAnchorCitationBound=true`
  - `lineAnchorCitedCount`
  - `lineAnchorPrimaryCitedCount`
  - `lineAnchorCitationFilePath`
  - `lineAnchorCitationStartLine`
  - `lineAnchorCitationEndLine`
  - `lineAnchorCitationContextRole=PRIMARY`
- `verify-release-evidence.sh` 必须强校验：
  - sample citation file 与 sample file 一致。
  - sample line 落在 citation start/end 内。
  - citation context role 为 `PRIMARY`。
  - 顶层 line-anchor count 与 samples 明细一致。
- `security-regression-check.sh --suite release-verifier-public-repo-marker` 必须拒绝：
  - 缺少 line-anchor citation status。
  - sample `lineAnchorCitationBound=false`。
  - citation file mismatch。
  - citation line range miss。
  - citation context not primary。
  - sample count/count min forged。

非范围：

- 不改后端 API、DB、code_chunks schema、ranker、embedding、GitHub App 或 LLM provider。
- 不刷新 full release authority。
- 不声明 provider 质量或 LLM 事实正确。

验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：真实 focused public repo smoke，`scanTaskId=260`、`sampleCount=4`、`uniqueFileCount=4`、`lineAnchorCitationStatus=ALL_SAMPLES_BOUND`、`minLineAnchorPrimaryCitedCount=1`。

## P6/P11 增量：Report narrative citation quality binding

目标：

- 报告 narrative 不能只停留在 `summary/gaps/nextActions` 文本存在。
- release marker 必须证明报告 narrative 的关键计数来自结构化 source section。
- QA sample 必须证明 sampled `apiRoutes` narrative evidenceRef 进入 QA 请求，并继续保持 exact-line citation binding。

验收要求：

- `reportQuality.reportCitationQuality` 必须输出：
  - `narrativeBindingStatus=ALL_BOUND`
  - `requiredNarrativeBindingCount=6`
  - `narrativeBindingCount=6`
  - `narrativeBindings`
- `narrativeBindings` 必须覆盖：
  - `summary_risk_posture` -> `reportQuality.summary/codeQuality.risks`
  - `high_risk_count` -> `codeQuality.risks` / `severity=HIGH`
  - `medium_risk_count` -> `codeQuality.risks` / `severity=MEDIUM`
  - `technical_debt_count` -> `technicalDebt`
  - `suggestion_count` -> `suggestions`
  - `next_actions_risk_priority` -> `reportQuality.nextActions/codeQuality.risks`
- 每个 narrative binding 必须证明：
  - `reportedCount` 与 `actualCount` 一致。
  - `status=BOUND`。
  - 不携带 raw summary、raw action、raw content、prompt、answer、token、password、secret 或 apiKey。
- `reportEvidenceQaCitationQuality` 顶层必须输出：
  - `narrativeCitationStatus=ALL_SAMPLES_NARRATIVE_BOUND`
  - `narrativeBoundSampleCount`
  - `minNarrativeEvidenceRefFieldCount`
  - `narrativeCheckKeys=["api_data_surface"]`
  - `narrativeSectionBindingStatuses=["BOUND"]`
- 每个 QA sample 必须输出：
  - `narrativeBound=true`
  - `narrativeCheckKey=api_data_surface`
  - `narrativeSourceSection=apiRoutes`
  - `narrativeSectionBindingStatus=BOUND`
  - `narrativeEvidenceRefFieldCount>=6`
  - `narrativeQuestionBound=true`
  - `narrativeRawTextStored=false`

非范围：

- 不改后端 API、DB、QA DTO、code_chunks schema、ranker、embedding、GitHub App、LLM provider 或前端 UI。
- 不刷新 full release authority。
- 不声明完整 narrative quality、语义充分性、事实正确性、provider 质量或 LLM judge 分数。

验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker`。
- PASS：真实 focused public repo smoke，`scanTaskId=261`、`sampleCount=4`、`uniqueFileCount=4`、`narrativeBindingStatus=ALL_BOUND`、`narrativeCitationStatus=ALL_SAMPLES_NARRATIVE_BOUND`、`minNarrativeEvidenceRefFieldCount=6`。

## P6 增量：Code QA exact anchor preservation

目标：

- Code QA 检索不能只依赖 exact `filePath + line/range` 的结构分高低。
- 当问题明确包含文件定位和行号/范围时，覆盖该位置的 chunk 必须进入最终 top chunks。
- 该合同必须能抵抗 keyword candidate limit、semantic rerank、同文件高分噪声和 diversification/backfill 挤压。

验收要求：

- `CodeChunkRanker` 必须提供可复用 exact-anchor 判断：
  - query 有 line hint。
  - chunk 覆盖该 line/range。
  - chunk 文件路径匹配 path suffix、method anchor file hint 或 source URL / function@file hint。
  - 如果 query 有完整 path suffix，不得只用同名文件误判通过。
- `CodeQaRetrievalService` 必须：
  - 在 keyword / semantic / fallback candidate 之外合并 exact anchor candidates。
  - 最终 selection 先保留 exact anchor，再执行普通同文件上限和 backfill。
  - 保持普通检索、semantic candidate、embedding model key、fallback 行为不被扩大改写。
- 测试必须覆盖：
  - 80+ 高分噪声 candidate 可能挤掉目标时，exact line anchor 仍被保留。
  - exact anchor 排在最终结果第一位。

非范围：

- 不改后端 API、DB、migration、`code_chunks` schema、embedding、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不刷新 full release authority。
- 不声明 code_chunks ranking 全面优化、真实 provider 事实质量、所有浏览器/minified/sourcemap stack 场景覆盖。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaRetrievalServiceTest,CodeChunkServiceTest,CodeLocationHintParserTest test`。
- PASS：targeted `git diff --check`。

## P6/P11 增量：Public repo source-location probe v4 exact anchor first result

目标：

- Public repo source-location probes 不能只证明目标行存在于某个返回结果。
- v4 合同必须证明 exact source-location anchor 被保留为 `/code-chunks/search` 第一结果。
- release verifier 和 security regression 必须拒绝“matched 存在但 first result 漂移”的伪造 marker。

验收要求：

- `CodeChunkService.searchChunks(...)` 与 `listRetrievalCandidates(...)` 必须在 ranking 后保留 exact source-location anchor 为第一结果。
- `PUBLIC_REPO_SMOKE_OK.chunkSearch.sourceLocationProbeContractVersion` 必须为 `4`。
- 每个 source-location probe 必须输出：
  - `firstResultIndex=0`
  - `firstResultFile`
  - `firstResultStartLine`
  - `firstResultEndLine`
  - `firstResultEvidenceType`
  - `firstResultMatchesExactAnchor=true`
  - `exactAnchorPreservedAsFirstResult=true`
- Verifier 必须强校验：
  - `firstResultFile === targetFile`
  - `firstResultStartLine <= targetLine <= firstResultEndLine`
  - `firstResultIndex === 0`
  - first-result evidence type 是 source evidence type。
  - `firstResultMatchesExactAnchor` 和 `exactAnchorPreservedAsFirstResult` 都为 true。
- Security regression 必须拒绝：
  - first result file mismatch。
  - first result line range miss。
  - first result index 非 0。
  - `firstResultMatchesExactAnchor=false`。
  - `exactAnchorPreservedAsFirstResult=false`。

非范围：

- 不改 API/DTO、DB、migration、`code_chunks` schema、embedding、LLM provider、前端 UI、GitHub App 或 webhook。
- 不刷新 full release authority。
- 不声明完整 ranking 质量、真实 provider 事实质量、所有 browser/minified/sourcemap stack 场景覆盖或生产部署完成。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeLocationHintParserTest test`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：真实 focused public repo smoke，`projectId=345`、`repositoryId=306`、`scanTaskId=262`、`totalChunks=17001`、`sourceLocationProbeContractVersion=4`。

## P11 增量：Release evidence report evidence QA citation manifest fail-closed hardening

目标：

- Release/nightly evidence 不能只在 `public_repo_report_evidence_qa_citation` 字段存在时检查其值。
- 该 manifest 字段本身必须成为 release/nightly profile 的显式发布合同，防止通过删除字段退回 optional-present。
- 当 release/nightly 启用 public repo smoke 时，报告证据 QA 引用质量 marker 必须被强制吸收。

验收要求：

- `verify-release-evidence.sh` 必须在 `release` profile 下要求：
  - `public_repo_report_evidence_qa_citation_manifest_present=true`
  - `public_repo_report_evidence_qa_citation=true`
- `verify-release-evidence.sh` 必须在 `nightly` profile 下要求：
  - `public_repo_report_evidence_qa_citation_manifest_present=true`
  - `public_repo_report_evidence_qa_citation=true`
- 当 manifest mode 为 true 时，`PUBLIC_REPO_SMOKE_OK.reportEvidenceQaCitationQuality` 缺失必须 fail closed。
- `security-regression-check.sh` 必须静态锁住 manifest presence requirement 和 hard-required true mode，避免后续回退。

非范围：

- 不刷新 full release authority。
- 不改 public repo smoke marker schema、后端 API、DB、`code_chunks` schema、ranker、embedding、LLM provider、前端 UI、GitHub App 或 webhook。
- 不声明真实 release/nightly evidence package 已重跑；本轮是 P11 verifier hardening。

验证结果：

- PASS：`bash -n scripts/release-evidence.sh scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`git diff --check -- scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。

## P6/P9 增量：ScanTaskDetail report citation quality panel

目标：

- `reportQuality.reportCitationQuality` 不能只存在于 release evidence 或 verifier 合同里。
- ScanTaskDetail 报告总览必须把报告引用质量转成用户可读面板，直接展示 citation quality、source diversity 和 narrative binding。
- Source diversity 必须给出可读来源覆盖摘要，不能只展示一个数字。
- Source coverage 必须同时展示原始 section 和中文语义标签，方便用户理解报告来源。
- Section / narrative binding 明细必须默认收起、可展开，避免报告总览被低频明细占满。
- UI 必须明确 no-overclaim：只证明报告字段与扫描产物绑定，不证明 LLM 事实正确、provider 质量或代码无风险。

验收要求：

- `ScanTaskDetail.tsx` 必须定义 `ReportCitationQualitySummary`、`buildReportCitationQualitySummary(reportQuality)` 和 `ReportCitationQualityPanel`。
- 面板必须消费 `reportQuality.reportCitationQuality`，缺失为 `GAP`，部分绑定为 `REVIEW`，完整绑定且 `providerQualityClaim=false`、`llmFactClaim=false`、`noRawPromptOrAnswer` 未失败时为 `READY`。
- 面板必须在 `ReportDecisionPanel` 后、推荐动作前直接出现在报告总览。
- 面板必须展示：
  - `Citation quality`
  - `Source diversity`
  - `Source coverage`
  - `Narrative binding`
  - 裁决依据：合同、结构绑定、叙事绑定、边界
  - section bindings
  - narrative bindings
  - 下一步动作
  - no-overclaim 边界说明
- `report-evidence-drawer-smoke.spec.ts` fixture 必须包含 `reportQuality.reportCitationQuality`，覆盖 `requiredCheckCount=6`、`boundCheckCount=6`、`narrativeBindingStatus=ALL_BOUND`、`narrativeBindingCount=6`、`providerQualityClaim=false`、`llmFactClaim=false`。
- smoke 必须在 1440、390、320 viewport 断言面板可见、不裁切、无横向溢出，并输出 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality`。
- `validate-frontend-ui.mjs` 必须锁住组件、builder、CSS、fixture、smoke 断言和 marker 字段。

非范围：

- 不改后端 API、DTO、DB schema、`code_chunks` schema、ranker、embedding、LLM provider、GitHub App 或 webhook。
- 不刷新 full release authority。
- 不声明完整报告事实正确性、真实 provider 质量或代码无风险。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true npm --prefix web-console run smoke:report-evidence-drawer`。
- PASS：targeted `git diff --check`。

## P11 增量：Report citation quality UI marker verifier hardening

目标：

- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality` 不能只由前端 smoke 生成，release verifier 必须在 marker 存在时强校验其合同。
- 安全回归必须动态证明伪造、隐藏、计数缺口、overclaim、provider/LLM 质量宣称和 raw 字段都会被拒绝。
- Worktree inventory strict 模式必须能识别根目录治理文件，避免 release evidence strict gate 被合法制度文件卡住。

验收要求：

- `verify-release-evidence.sh` 必须对 optional-present `qaPayload.reportCitationQuality` 执行 strict 校验。
- 合法 marker 必须满足：
  - `status=OK`
  - `surface=SCAN_TASK_DETAIL_REPORT_CITATION_QUALITY_PANEL`
  - `visibleAcrossViewports=true`
  - `citationQuality=["6/6"]`
  - `sourceDiversityVisible=true`
  - `sourceCoverageVisible=true`
  - `sourceSectionCount>=5`
  - `sourceSections=["apiRoutes/dbEntities","codeQuality.risks","modules","overview","scanFingerprint"]`
  - `sourceSectionLabels=["API/数据面","扫描指纹","扫描范围","模块图","风险信号"]`
  - `sourceSectionOrder=["overview","modules","apiRoutes/dbEntities","scanFingerprint","codeQuality.risks"]`
  - `sourceSectionLabelOrder=["扫描范围","模块图","API/数据面","扫描指纹","风险信号"]`
  - `narrativeBinding=["6/6"]`
  - `detailToggleVisible=true`
  - `detailDefaultCollapsed=true`
  - `detailOpens=true`
  - `verdictVisible=true`
  - `verdictItemCount>=4`
  - `verdictBoundaryVisible=true`
  - `boundaryVisible=true`
  - `noOverclaim=true`
  - `noHorizontalOverflow=true`
  - `providerQualityClaim=false`
  - `llmFactClaim=false`
- marker 不得包含 raw content、prompt、answer、stack、token、secret、password、authorization 或 bearer 等敏感字段。
- `security-regression-check.sh --suite release-verifier-report-evidence-marker` 必须覆盖上述负例。
- `worktree-inventory.sh` 必须将根目录治理文件归入 Documentation and handoff，strict Other 分组为空。

非范围：

- 不刷新 full release authority。
- 不改后端 API、DTO、DB schema、ranker、embedding、LLM provider、GitHub App 或 webhook。
- 不声明真实 release package 已吸收该 marker；本轮是 P11 verifier hardening。

验证结果：

- PASS：`bash -n scripts/worktree-inventory.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_WORKTREE_INVENTORY_STRICT=true ./scripts/worktree-inventory.sh other`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker`。
- PASS：focused release evidence package `release-evidence/report-citation-source-order-20260705-002223` 生成成功，`required_failures=0`、`optional_warnings=0`。
- PASS：`./scripts/verify-release-evidence.sh release-evidence/report-citation-source-order-20260705-002223`。
- PASS：`git diff --check -- scripts/worktree-inventory.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh docs/OPERATIONS_RUNBOOK.md`。

## P9/P11 增量：ScanTaskDetail report main path guide

目标：

- 报告总览必须在推荐下一步和证据优先入口之间展示明确的 3 步主链路导览。
- 导览不新增业务规则，只把现有推荐动作、引用质量、证据优先级串成用户可执行顺序。
- release evidence verifier 必须拒绝缺失、错序或移动端溢出的导览 marker。

验收要求：

- `ScanTaskDetail` 必须渲染 `aria-label="报告主链路导览"`。
- 三步顺序必须是：
  - `recommended-action`
  - `citation-quality`
  - `evidence-priority`
- smoke marker 必须输出 `REPORT_EVIDENCE_DRAWER_SMOKE_OK.mainPathGuide`。
- `mainPathGuide` 必须证明：
  - `visible=true`
  - `stepCount=3`
  - `order=["recommended-action","citation-quality","evidence-priority"]`
  - `labels=["01","02","03"]`
  - `mobile390Covered=true`
  - `narrow320Covered=true`
  - `noHorizontalOverflow=true`
- `security-regression-check.sh --suite release-verifier-report-evidence-marker` 必须拒绝 missing / wrong order / overflow forged marker。

非范围：

- 不改后端 API、DTO、DB schema、ranker、embedding、LLM provider、GitHub App 或 webhook。
- 不刷新 full release authority。
- 不声明报告事实正确、LLM 事实正确或修复候选已经安全可合并。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true npm --prefix web-console run smoke:report-evidence-drawer`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker`。
- PASS：focused release evidence package `release-evidence/report-main-path-guide-20260705-003844` 生成成功，`required_failures=0`、`optional_warnings=0`。
- PASS：`./scripts/verify-release-evidence.sh release-evidence/report-main-path-guide-20260705-003844`。

## P9/P11 增量：ScanTaskDetail report action board

目标：

- 报告总览必须在主链路导览后展示明确的后续行动分流。
- 行动板必须让用户从报告结论直接进入风险复核、代码问答、Agent 复核、审计追踪、依赖复核和修复候选。
- release evidence verifier 必须拒绝缺失、错序、关键链接不可见或移动端溢出的 action board marker。

验收要求：

- `ScanTaskDetail` 必须渲染 `aria-label="报告后续行动"`。
- 行动板必须展示 `Action Routing` 和 `后续行动分流`。
- 行动 key 顺序必须是：
  - `risk-review`
  - `code-qa`
  - `agent-review`
  - `audit-trace`
  - `dependency-review`
  - `repair-candidate`
- smoke marker 必须输出 `REPORT_EVIDENCE_DRAWER_SMOKE_OK.actionBoard`。
- `actionBoard` 必须证明：
  - `visible=true`
  - `actionCount=6`
  - `actionKeys=["risk-review","code-qa","agent-review","audit-trace","dependency-review","repair-candidate"]`
  - `codeQaLinkVisible=true`
  - `repairCandidateVisible=true`
  - `mobile390Covered=true`
  - `narrow320Covered=true`
  - `noHorizontalOverflow=true`
- `security-regression-check.sh --suite release-verifier-report-evidence-marker` 必须拒绝 missing / wrong order / link hidden / overflow forged marker。

非范围：

- 不改后端 API、DTO、DB schema、ranker、embedding、LLM provider、GitHub App 或 webhook。
- 不刷新 full release authority。
- 不声明修复候选已经安全可合并，不证明报告事实正确或 LLM 事实正确。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true npm --prefix web-console run smoke:report-evidence-drawer`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker`。
- PASS：focused release evidence package `release-evidence/report-action-board-20260705-005841` 生成成功，`required_failures=0`、`optional_warnings=0`。
- PASS：`./scripts/verify-release-evidence.sh release-evidence/report-action-board-20260705-005841`。

## P9/P11 增量：ScanTaskDetail report review gate release contract

目标：

- 报告总览的复核门禁必须成为 release evidence 合同，不允许 UI 被删、错序或移动端裁切后仍通过发布证据。
- 复核门禁必须覆盖报告可信度、证据包、代码知识库、修复入口、审计追踪和治理时间线。
- 该增量只锁定现有报告页治理前检查，不改变后端放行规则。

验收要求：

- `ScanTaskDetail` 必须渲染 `aria-label="报告复核门禁"`。
- 每个门禁项必须输出 `data-review-gate-key`。
- 门禁 key 顺序必须是：
  - `report-readiness`
  - `evidence-bundle`
  - `code-knowledge`
  - `repair-readiness`
  - `audit-trace`
  - `governance-timeline`
- smoke marker 必须输出 `REPORT_EVIDENCE_DRAWER_SMOKE_OK.reviewGate`。
- `reviewGate` 必须证明：
  - `visible=true`
  - `gateCount=6`
  - `gateKeys=["report-readiness","evidence-bundle","code-knowledge","repair-readiness","audit-trace","governance-timeline"]`
  - `minReadyCount` 为 1 到 6 之间整数
  - `mobile390Covered=true`
  - `narrow320Covered=true`
  - `textNotClipped=true`
  - `noHorizontalOverflow=true`
- `security-regression-check.sh --suite release-verifier-report-evidence-marker` 必须拒绝 missing / wrong order / text clipped / overflow forged marker。

非范围：

- 不改后端 API、DTO、DB schema、ranker、embedding、LLM provider、GitHub App 或 webhook。
- 不刷新 full release authority。
- 不声明报告事实正确、LLM 事实正确或修复候选可合并。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true npm --prefix web-console run smoke:report-evidence-drawer`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker`。
- PASS：focused release evidence package `release-evidence/report-review-gate-20260705-011417` 生成成功，`required_failures=0`、`optional_warnings=0`。
- PASS：`./scripts/verify-release-evidence.sh release-evidence/report-review-gate-20260705-011417`。

## P6/P11 增量：code_chunks snake_case report evidence path anchor

目标：

- 报告、分析产物和 JSON 常见字段 `file_path` 必须能进入 code_chunks 报告证据路径锚点链路。
- 用户从报告复制 `file_path: src/...`、`"file_path": "src/..."`、`"line_number": 90` 或 `handler_class/handler_method` 追问时，检索必须优先找同文件、同 handler 方法、同行附近代码块，而不是只靠关键词命中。
- 该增量只补证据路径字段兼容性和 evidence-only path scoring，不改变 API 合同。

验收要求：

- `CodeLocationHintParser.evidenceFilePathHints` 必须同时支持 `filePath:`、`file_path:`、`"filePath": "..."` 和 `"file_path": "..."`。
- `CodeLocationHintParser.parseLineHints` 必须支持 `"line_number": 90`、`"lineNumber": "90"` 和 `"line": "L90"`。
- `CodeLocationHintParser.parseMethodHints` 必须支持 quoted JSON `handler_class` + `handler_method` pair，并生成可被 method anchor candidates 使用的 `MethodHint`。
- `handler_class` / `handler_method` 只接受安全 Java identifier / qualified class path，不得把任意 JSON 字符串当作类或方法。
- JSON `start_line` / `end_line` 这类范围元数据不得被通用 `:数字` 误判为用户请求的行级锚点。
- `file_path` / `filePath` 的值必须复用既有归一化逻辑，去掉引号、`./`、source URL、query、hash line suffix、列号和 JSON 行末逗号。
- `CodeChunkService.listRetrievalCandidates` 必须在 `file_path:` 与 quoted JSON `file_path` 输入下追加 evidence file path anchor candidates。
- `CodeChunkRanker` 必须让明确 evidence file path hint 强于报告文档普通文本命中。
- 同文件多 chunk 时，quoted JSON `line_number` 必须把覆盖该行的 chunk 排在同文件 header chunk 前面。
- 无 `file_path` 但有 `handler_class/handler_method/line_number` 时，method anchor candidates 必须能补入目标 handler class 文件，并优先同 package 同 method chunk。
- 同路径、同行号证据应把目标 chunk 排在首位。
- 不允许把普通 `path:` 或无前缀文本扩大为 evidence file path anchor。

验证结果：

- PASS：`mvn -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`，77 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、embedding、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不声明所有报告 JSON 字段都已完成 schema 级 ingestion，只覆盖 `filePath` / `file_path` 作为用户追问和证据引用文本中的路径锚点。

## P6 增量：Code QA retrieval evidence role diversity

目标：

- Code QA top context 不能只做文件分散，还必须尽量覆盖不同代码证据角色。
- 当同类 controller/service 高分噪声较多时，top context 仍应保留 service、data-access、domain model 等跨层证据，让回答具备跨文件链路基础。
- 该增量只调整后端检索选择顺序，不改变 API/DTO、DB schema 或前端展示。

验收要求：

- `CodeQaRetrievalService` 必须保留 exact location anchor 优先。
- 当没有 exact anchor 时，必须保留第一条最高相关结果，避免角色多样性改变用户最相关入口。
- 在普通回填前，必须按 `CodeChunkRanker.evidenceType` 补齐不同角色，优先顺序为 controller、service、data-access、domain model、frontend、test、config。
- 角色多样性必须继续遵守每文件最多 2 个 context chunk 的限制。
- 高分同类 controller 噪声存在时，top context 必须包含 service 和 mapper/data-access。

验证结果：

- PASS：`mvn -Dtest=CodeQaRetrievalServiceTest test`，24 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不声明语义向量质量、真实 LLM fact quality 或 AutoRepair 可直接放行。

## P6 增量：Code QA combined citation labels

目标：

- Code QA 引用可信度不能只识别单独的 `[C1]`。
- LLM 在同一个事实句中输出 `[C1, C2]`、`[C1-C2]` 等常见合并引用时，系统必须正确展开为多个证据标签。
- 该增量只增强 answer citation parser 和 claim citation coverage，不改变 API/DTO 或检索排序。

验收要求：

- `[C1]` 单标签必须继续识别。
- `[C1, C2]`、`[C1，C2]`、`[C1、C2]` 这类方括号内多标签必须被识别为多个引用。
- `[C1-C2]` 这类短范围引用必须展开为 `C1` 和 `C2`。
- 解析必须只在方括号 citation block 内生效，不得把普通数字当成引用。
- citation range 必须设置上限，避免模型输出大范围标签导致解析膨胀。
- fenced code block、inline code、日志、stack trace 和 citation format example 中的假引用过滤行为必须保持。
- 未知标签如 `[C99]` 必须继续进入 invalid citation / PARTIAL 或 BLOCKED 逻辑。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，27 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不声明 LLM 事实质量正确，只证明回答中的合并 citation label 能被系统可信解析和审计。

## P6 增量：Code QA full-width citation brackets

目标：

- 中文 LLM 回答常把引用写成 `【C1】` 或 `【C1，C2】`。
- Code QA citation audit 必须兼容这种全角 citation block，避免真实引用被误判为未引用。
- 该增量只扩展 citation block 边界和示例过滤，不改变 API/DTO 或检索排序。

验收要求：

- ASCII `[C1]`、`[C1, C2]` 必须继续有效。
- Full-width `【C1】` 必须识别为 `C1`。
- Full-width `【C1，C2】` 必须识别为 `C1` 和 `C2`。
- citation format example 中的 `【C1】` 不得被当作真实引用。
- 代码块、inline code、日志和 stack trace 过滤边界必须保持。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，28 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不声明 LLM 事实正确，只证明中文全角 citation label 能被系统正确解析和审计。

## P6 增量：Code QA retry combined citation enforcement

目标：

- 首轮 LLM 回答漏引用时，Code QA 会触发一次 citation retry。
- retry 回答必须使用与首次回答相同的 citation parser 和 audit 逻辑。
- 当 retry 回答输出 `【C1，C2】` 这类中文合并引用时，系统必须能判定 `RETRY_VERIFIED`，并正确更新 answer citation、citation coverage 和 claim coverage。

验收要求：

- 首轮无 citation 回答必须触发 retry。
- retry 回答 `【C1，C2】` 必须被识别为 `C1` 和 `C2`。
- 返回结果必须为 `citationEnforcementStatus=RETRY_VERIFIED`。
- 两条 `answerCitations` 必须都标记 `citedByAnswer=true`。
- `citationCoverage.status` 必须为 `FULL`。
- `claimCitationCoverage.status` 必须为 `READY`。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，29 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不声明真实 LLM provider 一定会稳定修正，只证明 retry path 的 citation audit 合同不漂移。

## P6 增量：Code QA paired citation bracket enforcement

目标：

- Code QA 支持 ASCII `[C1]` 和中文全角 `【C1】`，但 citation block 必须成对。
- malformed citation `[C1】` / `【C1]` 不得被当作真实证据引用。
- 示例过滤也必须使用成对 bracket，避免 malformed citation 被误过滤为示例行。

验收要求：

- `[C1]` 和 `【C1】` 必须继续有效。
- `[C1】` / `【C1]` 不得进入 `citedLabels`。
- mixed bracket 回答必须保持 `groundingStatus=UNVERIFIED` 和 `citationEnforcementStatus=RETRY_FAILED`。
- mixed bracket 的代码事实 claim 必须进入 `claimCitationCoverage.status=REVIEW`，不能因为 malformed citation 被跳过。
- `CodeQaControllerTest` 必须覆盖该拒绝路径。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，30 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不兼容 malformed citation；成对 bracket 是可信 citation 的最低格式要求。

## P6 增量：Code QA retry prompt citation format contract

目标：

- parser 已要求 citation bracket 成对，retry prompt 也必须明确输出格式要求。
- 首轮回答漏引用时，retry prompt 应告诉 LLM 可接受格式和不可接受格式，减少 malformed citation 继续进入系统。

验收要求：

- retry prompt 必须明确“引用标签必须使用成对括号”。
- retry prompt 必须包含有效示例 `[C1]` 和 `【C1】`。
- retry prompt 必须包含无效反例 `[C1】` 和 `【C1]`。
- `CodeQaControllerTest` 必须 capture 第二次 LLM 调用，并断言 prompt contract。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，30 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不声明真实 LLM provider 一定遵守 prompt，只证明本地 retry prompt contract 不漂移。

## P6 增量：Code QA claim split preserves file paths

目标：

- claim citation coverage 需要按回答事实句审计引用。
- 回答中出现 `src/AuthService.java`、`src/Foo.tsx` 等文件路径时，不能因为扩展名前的英文句号把 claim 切碎。
- 英文句号只应在后接空白或行尾时作为句子边界。

验收要求：

- `CLAIM_SPLIT_PATTERN` 不得在 `AuthService.java` 内部切分。
- `src/AuthService.java validates auth tokens [C1].` 必须保持为单个 claim。
- claim preview 必须保留完整 `src/AuthService.java validates auth tokens`。
- claim coverage 必须保持 `READY`，该 claim 状态必须为 `CITED`。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，31 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不声明所有自然语言缩写和版本号边界都已完整处理。

## P6 增量：Code QA invalid citation range strictness

目标：

- citation range 必须只接受正向、有限范围。
- `[C2-C1]`、超大范围等 malformed range 不能退化为普通 `C1` / `C2` token。
- 这可以避免两个端点都存在时，错误把 malformed range 判定为已验证引用。

验收要求：

- `[C1-C2]` 必须继续展开为 `C1` 和 `C2`。
- `[C2-C1]` 必须被拒绝，不得把 `C2` / `C1` 当作普通 token。
- 当回答只包含 `[C2-C1]` 时，两个 answer citations 均不得 `citedByAnswer=true`。
- grounding 必须保持 `UNVERIFIED`，citation enforcement 必须 `RETRY_FAILED`。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，32 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不新增复杂 range 语法；只收紧 malformed range 的拒绝边界。

## P6 增量：Code QA semicolon claim split

目标：

- claim citation coverage 需要按代码事实审计引用。
- 回答中用 `;` 或 `；` 连接多个事实时，不能把整段当成一个 claim。
- 分号后的未引用事实必须能被标记为 `UNCITED`，避免 citation coverage 虚高。

验收要求：

- `CLAIM_SPLIT_PATTERN` 必须支持中文/英文分号作为 claim 边界。
- `AuthController handles login [C1]; TokenRepository persists token data.` 必须拆成两个 required claims。
- 第一条 claim 必须为 `CITED` 且绑定 `C1`。
- 第二条 claim 必须为 `UNCITED`，整体 claim coverage 必须为 `REVIEW`。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，33 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不声明所有复杂列表、冒号、括号或 markdown table claim 边界都已完整处理。

## P6 增量：Code QA inline numbered claim split

目标：

- claim citation coverage 需要识别 LLM 常见的同一行编号列表。
- 当回答写成 `1. A [C1] 2. B` 时，第二个代码事实必须单独进入 claim audit。
- 不应泛化切分所有数字，避免误伤版本号、端口号和普通数字表达。

验收要求：

- `CLAIM_SPLIT_PATTERN` 必须只在 citation block 后识别同一行编号项边界。
- `1. AuthController handles login [C1] 2. TokenRepository persists token data` 必须拆成两个 required claims。
- 第一条 claim 必须为 `CITED` 且绑定 `C1`。
- 第二条 claim 必须为 `UNCITED`，整体 claim coverage 必须为 `REVIEW`。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，34 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不声明所有 markdown 列表、表格、冒号或括号 claim 边界都已完整处理。

## P9 增量：App shell long topbar copy wrap

目标：

- app shell 顶部标题和说明必须符合 P9 可读性门禁。
- 长标题、长说明不能被省略号隐藏，也不能导致 320px 移动端横向溢出。
- 顶部高度必须自适应，页面主标题仍需在 topbar 下方可见。

验收要求：

- `.sl-topbar-title` 和 `.sl-topbar-desc` 必须允许换行并保留 `overflow-wrap`。
- `.sl-topbar-left` 和 `.sl-topbar-copy` 必须按剩余宽度收缩，避免移动端横向溢出。
- `app-shell-ui-smoke` 必须注入长标题/长说明并验证不裁切、不溢出、页面内容在 topbar 下方。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true npm --prefix web-console run smoke:app-shell-ui`。

非范围：

- 不改后端 API、路由信息架构、业务数据、报告页内容、release evidence package 或 GitHub App。
- 不声明所有页面内部卡片、表格、按钮文本都已完成 P9 治理。

## P9 增量：ProjectDetail next action checks wrap

目标：

- ProjectDetail 工作台“下一步证据检查”必须完整展示证据状态。
- label/value 不得依赖 `nowrap + ellipsis` 隐藏关键状态。
- 修复必须覆盖桌面、390px 和 320px 视口。

验收要求：

- `.sl-project-next-action-check span` 和 `strong` 必须允许换行。
- `p9-main-path-recoverable-error-states-batch4a` 必须在 6 个 ProjectDetail next-action 分支中检查 computed style。
- smoke 必须证明 check 文本不为 `white-space: nowrap`，不为 `text-overflow: ellipsis`，且不横向/纵向裁切。

验证结果：

- PASS：`CI=true npm --prefix web-console run smoke:p9-main-path-recoverable-error-states-batch4a`，12 tests。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。

非范围：

- 不改项目状态计算、后端 API、路由、业务数据、release evidence package 或 GitHub App。
- 不声明所有内部卡片、表格、按钮文本都已完成 P9 治理。

## P6 增量：Code QA inline bullet claim split

目标：

- claim citation coverage 需要识别 LLM 常见的同一行 bullet 事实。
- 当回答写成 `A [C1] - B` 时，第二个代码事实必须单独进入 claim audit。
- 不应泛化切分所有短横线，避免误伤普通解释句。

验收要求：

- `CLAIM_SPLIT_PATTERN` 必须只在 citation block 后识别 inline bullet 边界。
- `AuthController handles login [C1] - TokenRepository persists token data` 必须拆成两个 required claims。
- 第一条 claim 必须为 `CITED` 且绑定 `C1`。
- 第二条 claim 必须为 `UNCITED`，整体 claim coverage 必须为 `REVIEW`。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，35 tests，0 failures，0 errors。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App 或 webhook。
- 不声明所有 markdown 列表、表格、冒号或括号 claim 边界都已完整处理。

## P9 增量：Artifacts focus card evidence readability

目标：

- Artifacts 运行产物证据中心的焦点证据卡必须完整展示 primary evidence 和 meta 值。
- 证据类型、owner、来源、证据包等关键字段不得依赖 `nowrap + ellipsis` 隐藏。
- 修复必须覆盖桌面、390px 和 320px 视口。

验收要求：

- `.sl-artifact-focus-head strong` 和 `.sl-artifact-focus-meta strong` 必须允许换行和长 token 断词。
- `artifacts-detail-selection-smoke` 必须检查 focus card critical text 的 computed style。
- smoke 必须证明 1440px、390px、320px 下 focus card 位于视口内且页面无横向溢出。

验证结果：

- PASS：`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。

非范围：

- 不改后端 API、artifact schema、raw download policy、报告事实质量、release evidence package 或 GitHub App。
- 不声明所有产物页面 chip、table cell、drawer copy 都已完成 P9 治理。

## P9 增量：Artifacts filter chip evidence readability

目标：

- Artifacts 运行产物证据中心的证据包 chip 和产物类型 chip 必须完整展示关键筛选语义。
- owner、meta、来源、产物类型和大小不得依赖 `nowrap + ellipsis` 隐藏。
- 修复必须覆盖桌面、390px 和 320px 视口。

验收要求：

- `.sl-artifact-bundle-chip span/small/i` 和 `.sl-artifact-type-chip span/small` 必须允许换行和长 token 断词。
- `artifacts-detail-selection-smoke` 必须检查 filter chip critical text 的 computed style。
- smoke 必须证明 1440px、390px、320px 下 filter chips 位于视口内且页面无横向溢出。

验证结果：

- PASS：`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。

非范围：

- 不改后端 API、artifact schema、raw download policy、报告事实质量、release evidence package 或 GitHub App。
- 不声明所有产物 table cell、drawer copy 都已完成 P9 治理。

## P9 增量：Artifacts table cell evidence readability

目标：

- Artifacts 运行产物表格的 type/owner 关键列必须完整展示证据信息。
- artifact type、content type、owner type 和 repository 不得被默认表格文本样式裁切。
- 修复必须覆盖桌面、390px 和 320px 视口。

验收要求：

- 表格 type/owner 单元格必须有稳定 class，便于后续 smoke 和样式治理。
- `.sl-artifact-table-type-cell` 与 `.sl-artifact-table-owner-cell` 内 tag/typography 必须允许换行和长 token 断词。
- `artifacts-detail-selection-smoke` 必须检查 target row 和 secondary row 的关键表格文本 computed style。

验证结果：

- PASS：`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。

非范围：

- 不改后端 API、artifact schema、raw download policy、报告事实质量、release evidence package 或 GitHub App。
- 不声明所有表格操作列、时间列或 drawer copy 都已完成 P9 治理。

## P9 增量：Artifacts drawer action and status readability

目标：

- Artifacts 运行产物抽屉的 action 和 status 文案必须完整可读。
- 来源、预览、下载、加载预览和状态提示不得依赖 Ant 默认单行裁切。
- 修复必须覆盖桌面、390px 和 320px 视口。

验收要求：

- drawer extra action labels 必须允许换行和长 token 断词。
- drawer status alert message/action 必须允许换行和长 token 断词。
- `artifacts-detail-selection-smoke` 必须检查 drawer action/status critical text 的 computed style。

验证结果：

- PASS：`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。

非范围：

- 不改后端 API、artifact schema、raw download policy、报告事实质量、release evidence package 或 GitHub App。
- 不声明所有 raw preview、modal confirm 或 audit receipt 文案都已完成 P9 治理。

## P9 增量：Artifacts preview tile readability

目标：

- Artifacts 智能预览总览指标必须完整可读。
- 文件、代码行、API、风险等 preview tile label/value 不得被单行 ellipsis 隐藏。
- 修复必须覆盖桌面、390px 和 320px 视口。

验收要求：

- preview tile label/value 必须有稳定 class。
- `.sl-artifact-preview-tile-label` 和 `.sl-artifact-preview-tile-value` 必须允许换行和长 token 断词。
- `artifacts-detail-selection-smoke` 必须检查四个 preview tile 的 label/value computed style。

验证结果：

- PASS：`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。

非范围：

- 不改后端 API、artifact schema、raw download policy、报告事实质量、release evidence package 或 GitHub App。
- 不声明 raw JSON、modal confirm 或 audit receipt 文案都已完成 P9 治理。

## P9/P10 增量：Artifacts raw download confirm readability

目标：

- 原始产物下载确认弹窗必须完整展示 raw access 风险说明。
- 标题、说明、取消和确认下载按钮不得依赖 Ant 默认单行裁切。
- 修复必须覆盖桌面、390px 和 320px 视口。

验收要求：

- raw download confirm modal 必须有稳定 class。
- modal title/content/buttons 必须允许换行和长 token 断词。
- `artifacts-detail-selection-smoke` 必须检查两次 raw download confirm 的 title/content/cancel/confirm computed style。

验证结果：

- PASS：`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。

非范围：

- 不改后端 API、artifact schema、raw download policy、报告事实质量、release evidence package 或 GitHub App。
- 不声明 audit receipt 或 raw JSON 文案都已完成 P9 治理。

## P9/P10 增量：Artifacts raw download audit receipt readability

目标：

- 原始产物下载后的审计 receipt 必须完整展示可追溯说明。
- 成功 receipt 和 fallback receipt 的标题、描述、查看下载审计入口不得被单行裁切。
- 修复必须覆盖桌面、390px 和 320px 视口。

验收要求：

- `.sl-artifact-download-audit-receipt` 内 title/description/action 必须允许换行和长 token 断词。
- `artifacts-detail-selection-smoke` 必须检查 success receipt 和 fallback receipt 的 title/description/action computed style。
- receipt 打开状态必须保持页面无横向溢出。

验证结果：

- PASS：`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。

非范围：

- 不改后端 API、artifact schema、raw download policy、报告事实质量、release evidence package 或 GitHub App。
- 不声明 raw JSON 文案都已完成 P9 治理。

## P9/P10 增量：Artifacts raw JSON readability

目标：

- 智能预览中的 redacted raw JSON 展开区必须完整可读。
- raw JSON summary 和 redacted raw JSON pre 不得造成页面横向溢出。
- 修复必须覆盖桌面、390px 和 320px 视口。

验收要求：

- `.sl-artifact-raw-json summary` 必须允许换行和长 token 断词。
- `.sl-artifact-redacted-raw-json` 必须使用 `pre-wrap`，并允许长 token 断词。
- `artifacts-detail-selection-smoke` 必须在 raw JSON 展开时检查 summary/pre computed style 和无横向溢出。

验证结果：

- PASS：`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。

非范围：

- 不改后端 API、artifact schema、raw download policy、脱敏算法、报告事实质量、release evidence package 或 GitHub App。
- 不改变 raw download 或脱敏规则。

## P6 增量：Code QA Unicode range 与 plus bullet claim 审计

目标：

- Code QA citation parser 必须识别常见 Unicode dash range。
- 反向 Unicode dash range 必须 fail-closed，不能退化为两个普通 citation token。
- citation 后同一行 `+` bullet 的第二条代码事实必须单独进入 claim audit。

验收要求：

- `ANSWER_CITATION_RANGE_PATTERN` 覆盖 `–`、`—`、`－`。
- `[C2–C1]` 必须保持 `UNVERIFIED` / `RETRY_FAILED` / `citationCoverage.status=NONE`。
- `AuthController ... [C1] + TokenRepository ...` 必须拆成两个 required claims，第二条为 `UNCITED`。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`。

非范围：

- 不改 API/DTO/DB schema、retrieval ranking、真实 LLM provider、前端 UI、release evidence schema 或 GitHub App。

## P6 增量：code_chunks 前端意图补池与 SOURCE 角色多样化

目标：

- 中文/英文前端页面组件问题必须主动召回前端候选。
- Top context 不能被同类 Controller 结果挤满，普通源码实现类需要保留跨角色证据位。
- 检索增强必须复用现有 role intent、ranker 和候选合并机制。

验收要求：

- `roleIntentTypes("前端登录页面组件")` 必须包含 `FRONTEND`，且不包含 `CONTROLLER`。
- `CodeChunkService` 的 role intent candidate pool 必须支持 `FRONTEND`。
- `CodeQaRetrievalService` 的 role diversity 必须包含 `SOURCE`。
- 聚焦后端测试必须覆盖前端补池和 SOURCE role diversity。

验证结果：

- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest test`。

非范围：

- 不改 API/DTO/DB schema、embedding provider、真实 LLM provider、前端 UI、release evidence schema 或 GitHub App。

## P6 增量：报告证据 handler 乱序与行号范围锚点

目标：

- 报告 JSON 的 `handler_method` 和 `handler_class` 字段顺序不能影响 method anchor。
- `evidenceRef.lineNumber` 支持单点行号和范围行号。
- 范围行号与同文件 chunk 有重叠时，QA 必须保持 `REPORT_LINE_ANCHOR` 和 PRIMARY 证据角色。

验收要求：

- `handler_method` 在 `handler_class` 前出现时，仍必须补入目标 handler class/method candidate。
- `lineNumber=85-120` 与 chunk `startLine=100,endLine=130` 重叠时，必须返回 `sourceEvidenceMatchType=REPORT_LINE_ANCHOR`。
- 行号范围命中的 chunk 必须作为 PRIMARY，`citationCoverage.coverageScope=PRIMARY`。

验证结果：

- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeQaControllerTest test`。

非范围：

- 不改 API/DTO/DB schema，不泛化 `path:` 字段，不解析 `start_line/end_line`，不改前端 UI、release evidence schema 或 GitHub App。

## P6 增量：Code QA evidenceRef startLine/endLine 行级锚点

目标：

- `CodeQaRequest.evidenceRef` 支持 `startLine/endLine`，并兼容报告 JSON 常见 `start_line/end_line`。
- 当 `lineNumber` 缺失或无效时，Code QA 必须从 start/end 派生行号范围并进入检索上下文。
- 前端证据桥接不能丢弃后端返回的 start/end 行号。

验收要求：

- snake_case `start_line/end_line` 请求体必须能进入 `sourceEvidenceRef.startLine/endLine`。
- `startLine=85,endLine=120` 与 chunk `startLine=100,endLine=130` 重叠时，必须返回 `REPORT_LINE_ANCHOR`、PRIMARY 和 `coverageScope=PRIMARY`。
- 无效 `lineNumber` 必须回退到 start/end；有效 `lineNumber` 与 start/end 冲突时，继续保持旧字段优先以兼容历史调用。
- `docs/API_DESIGN.md` 必须包含新增字段，并通过 API contract gate。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，41 tests，0 failures，0 errors。
- PASS：`make api-design-check`。
- PASS：`npm run build` in `web-console`。

非范围：

- 不改数据库 schema、AutoRepair provenance schema、真实 LLM provider、release evidence package 或 GitHub App。

## P6/P9/P11 增量：报告证据 start/end 行号 QA 深链 smoke

目标：

- 报告证据抽屉必须能把 `start_line/end_line` 传递到 ProjectDetail QA。
- ProjectDetail 必须从 URL 解析 `evidenceStartLine/evidenceEndLine` 并提交到 Code QA。
- report evidence smoke 必须证明 QA request 和 response 都保留 start/end 行号。

验收要求：

- `ScanTaskDetail` 风险/API 证据读取 `start_line/end_line`、`startLine/endLine`、`start/end`。
- `projectQaUrl` 输出 `evidenceStartLine/evidenceEndLine`。
- `ProjectDetail` 解析 URL 参数为 `evidenceRef.startLine/endLine`。
- Playwright smoke 验证 QA request payload 和 QA response `sourceEvidenceRef` 均绑定 start/end。

验证结果：

- PASS：`npm run build` in `web-console`。
- PASS：`CI=true npm --prefix web-console run smoke:report-evidence-drawer`，2 tests passed。

非范围：

- 不改 DB schema、AutoRepair provenance schema、真实 LLM provider、full release evidence package 或 GitHub App。

## P6/P11 增量：后端 source URL start/end-only 行级锚点

目标：

- Code QA 后端必须支持 full Vite source URL 与 `start_line/end_line` 同时出现、但没有 legacy `lineNumber` 的 evidenceRef。
- response 必须保留结构化 `startLine/endLine`，且不得生成旧 `lineNumber`。
- source URL 仍必须能归一化匹配实际 code chunk 文件路径，并输出 `REPORT_LINE_ANCHOR`。

验收要求：

- request 使用 `http://localhost:5173/src/pages/ProjectDetail.tsx?t=...:245:19`。
- request 仅包含 `start_line=245` / `end_line=250`，不包含 `lineNumber`。
- response `sourceEvidenceRef.lineNumber` 不存在，`startLine=245`、`endLine=250`。
- retrieved chunk 为 PRIMARY，`citationCoverage.coverageScope=PRIMARY`，claim role distribution 为 `PRIMARY_BOUND`。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，42 tests，0 failures，0 errors。

非范围：

- 不改生产代码、DB schema、真实 LLM provider、AutoRepair provenance schema、full release evidence package 或 GitHub App。

## P6/P11 增量：public repo UI start/end-only release marker

目标：

- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence` 必须包含 `startEndOnlyEvidenceRef` 子证明。
- release verifier 必须强校验 start/end-only 证据没有合成 legacy `lineNumber`，且仍为 `REPORT_LINE_ANCHOR`。
- security regression 必须动态拒绝 forged marker。

验收要求：

- public repo UI smoke 对同 scan 发起 start/end-only QA probe。
- marker 记录 `requestHasLegacyLineNumber=false`、`responseHasLegacyLineNumber=false`、`sourceEvidenceMatchTypes=["REPORT_LINE_ANCHOR"]`、`primaryChunkBound=true`、`coverageScopes` 包含 `PRIMARY`。
- verifier 拒绝缺失 start/end-only 子证明、legacy lineNumber、file-anchor 伪造和 primary-unbound 伪造。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`。
- PASS：`npm run build` in `web-console`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker`。

非范围：

- 不生成新的 full release evidence package，不改 DB schema、真实 LLM provider、GitHub App 或生产部署。

## P6/P9/P11 增量：报告证据 start/end-only QA 证据链

目标：

- 报告 fixture 不依赖 legacy `line_number`，只用 `start_line/end_line` 也必须完成报告证据到 QA 的行级桥接。
- QA request 不得为 start/end-only 证据合成旧 `lineNumber`。
- QA response 必须回显 `sourceEvidenceRef.startLine/endLine`，并在 smoke marker 中记录 `lineRange=24-42`。

验收要求：

- primary 风险/API 报告证据样本不包含 `line_number`。
- evidence drawer、code chunk query、ProjectDetail URL、QA request、QA response 均保持 `startLine=24` / `endLine=42`。
- `report-evidence-drawer-smoke` 断言 request/response `lineNumber === undefined`。

验证结果：

- PASS：`npm run build` in `web-console`。
- PASS：`CI=true npm --prefix web-console run smoke:report-evidence-drawer`，2 tests passed。

非范围：

- 不改 DB schema、AutoRepair provenance schema、真实 LLM provider、full release evidence package 或 GitHub App。

## P11/P6 增量：public repo UI start/end-only focused release evidence

目标：

- 真实公开仓库 smoke 必须生成包含 `qaFromEvidence.startEndOnlyEvidenceRef` 的 `PUBLIC_REPO_UI_SMOKE_OK` marker。
- release verifier 必须独立验证该 marker，不允许只依赖 smoke 命令退出码。
- 证据链必须证明 start/end-only request/response 没有 legacy `lineNumber`，并仍然绑定 `REPORT_LINE_ANCHOR` 和 PRIMARY。

验收要求：

- `public-repo-smoke` 在 focused release evidence 包中为 OK。
- `startEndOnlyEvidenceRef.requestHasLegacyLineNumber=false`。
- `startEndOnlyEvidenceRef.responseHasLegacyLineNumber=false`。
- `startEndOnlyEvidenceRef.sourceEvidenceMatchTypes=["REPORT_LINE_ANCHOR"]`。
- `startEndOnlyEvidenceRef.primaryChunkBound=true`。
- `startEndOnlyEvidenceRef.coverageScopes` 包含 `PRIMARY`。
- `startEndOnlyEvidenceRef.currentScanOnly=true`。

验证结果：

- PASS：focused release evidence package `release-evidence/public-repo-ui-start-end-only-20260705-042402`，0 required failures，0 optional warnings。
- PASS：`./scripts/verify-release-evidence.sh release-evidence/public-repo-ui-start-end-only-20260705-042402`。

非范围：

- 该包不是 full release authority。
- 不覆盖真实 LLM provider、GitHub App E2E、私有仓库、多用户、灾备、回滚签署或生产部署。

## P9/P6 增量：QA evidence range display priority

目标：

- QA 页面显示 evidenceRef 行号时，必须优先使用结构化 `startLine/endLine`。
- 旧 `lineNumber` / `evidenceLine` 只能作为 fallback，不得覆盖有效的结构化范围。
- UI 必须把范围文案显示为用户可读的 `范围 xx-yy` 和 `第 xx-yy 行`。

验收要求：

- `ProjectDetail` 使用统一 line display helper。
- `报告证据上下文` 显示 `范围 24-42`。
- `QA 回答报告证据凭证` 显示 `范围 24-42`。
- 来源定位可信度显示 `行范围` 和 `第 24-42 行`。
- 冲突 URL：`evidenceLine=999&evidenceStartLine=24&evidenceEndLine=42` 时显示 `范围 24-42`，不显示 `999`。

验证结果：

- PASS：`npm run build` in `web-console`。
- PASS：`CI=true npm --prefix web-console run smoke:report-evidence-drawer`，2 tests passed。

非范围：

- 不移除 legacy `lineNumber` fallback。
- 不改后端、DB schema、release verifier、真实 LLM provider、GitHub App 或生产部署。

## P11/P6/P9 增量：QA evidence range priority release verifier gate

目标：

- `report-evidence-drawer-smoke` 已证明的结构化范围优先规则必须进入 release verifier。
- 发布门禁必须拒绝缺少 `qaFromEvidence.evidenceLineRangePriority` 的 QA citation marker。
- 发布门禁必须拒绝把 legacy `evidenceLine=999` 当成可见定位的伪造 marker。

验收要求：

- `verify-release-evidence.sh` 校验 `evidenceLineRangePriority.status=OK`。
- `proofCount >= 3`，覆盖 desktop、390 mobile 和 320 narrow。
- `structuredRangePriority=true`。
- `legacyLineHidden=true`。
- `visibleRanges=["24-42"]`。
- `conflictLegacyLineNumbers=["999"]`。
- `mobile390Covered=true`、`narrow320Covered=true`、`noHorizontalOverflow=true`。
- `security-regression-check.sh --suite release-verifier-report-evidence-marker` 必须拒绝 missing、false、wrong range、missing viewport 和 overflow forged marker。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh`。
- PASS：`bash -n scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker`。
- PASS：`CI=true npm --prefix web-console run smoke:report-evidence-drawer`，2 tests passed。

非范围：

- 不刷新 full release authority。
- 不改后端、DB schema、真实 LLM provider、GitHub App、私有仓库或生产部署。

## P11/P9/P6 增量：Deep evidence card readability release verifier gate

目标：

- `report-evidence-drawer-smoke` 已证明的 `deepEvidenceCardReadability` 必须进入 release verifier。
- 发布门禁必须拒绝缺少深层证据卡可读性 proof 的 QA citation marker。
- 发布门禁必须拒绝裁切、移动端覆盖缺失、range 隐藏、review 状态误显示修复入口、provider/LLM overclaim 或 raw 字段伪造。

验收要求：

- `verify-release-evidence.sh` 校验 `deepEvidenceCardReadability.status=OK`。
- `mobile390Covered=true`、`narrow320Covered=true`、`noHorizontalOverflow=true`。
- `sourceReceipt.readyVisible/reviewVisible/contained/referenceWraps/titleNotClipped/tagsNotClipped/structuredRangeVisible` 全部为 `true`。
- `sourceLocationConfidence.readyContained/reviewContained/metricsNotClipped/checksWrap` 全部为 `true`。
- `sourceFileMatchRelease.readyContained/reviewContained/targetReferenceNotClipped/citedReferenceNotClipped/checksNotClipped/noRepairOnReview` 全部为 `true`。
- `providerQualityClaim=false`、`llmFactClaim=false`。
- `security-regression-check.sh --suite release-verifier-report-evidence-marker` 必须拒绝 missing、status fail、mobile/narrow missing、source receipt clipped/range hidden、source location clipped/nowrap、source file clipped/review repair visible、overflow、provider claim 和 raw field forged marker。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh`。
- PASS：`bash -n scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker`。
- PASS：`CI=true npm --prefix web-console run smoke:report-evidence-drawer`，2 tests passed。

非范围：

- 不刷新 full release authority。
- 不改前端 UI、后端、DB schema、真实 LLM provider、GitHub App、私有仓库或生产部署。

## P6 增量：Code QA Markdown table claim audit

目标：

- LLM 输出 Markdown 表格时，表格数据行中的代码事实必须单独进入 claim citation coverage。
- 未引用的数据行事实必须进入 `UNCITED` / `REVIEW`，不能被前一个 `[C1]` 覆盖。
- 普通 pipe-delimited 文本不能被误判为 Markdown 表格。

验收要求：

- 只有表头行后紧跟 separator 行时，才进入 Markdown table block 处理。
- 表头和 separator 行不得产生 required claim。
- 表格数据行 cell 必须可拆分为独立 claim。
- 普通 `A | B | C` 文本保持单条 claim。
- `CodeQaControllerTest` 必须覆盖 Markdown 表格正例和普通 pipe 文本负例。
- 安全和 QA 子 agent 复核必须为 PASS。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：奥特曼 / Security Engineer 二次复核。
- PASS：拉里佩奇 / QA Engineer 二次复核。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、真实 LLM provider、前端 UI、release evidence 或 GitHub App。

## P6 增量：Code QA blockquote log fake citation filter

目标：

- Markdown blockquote 包裹的日志、异常和 stack trace 不能把 `[C1]` 污染为真实 citation。
- 普通 blockquote 正文中的真实 citation 仍必须有效。

验收要求：

- `> ERROR ... [C1]` 不得进入 cited labels。
- `> java.lang... [C1]` 不得进入 cited labels。
- `>     at ... [C1]` 不得进入 cited labels。
- `> AuthService validates auth tokens [C1].` 必须保持 `DIRECT_VERIFIED`。
- `CodeQaControllerTest` 必须覆盖上述负向和正向边界。
- 安全和 QA 子 agent 复核必须为 PASS。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：奥特曼 / Security Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、真实 LLM provider、前端 UI、release evidence 或 GitHub App。

## P6 增量：Code QA HTML code fake citation filter

目标：

- HTML `<pre>` / `<code>` 包裹的代码、日志或错误样例不能把 `[C1]` 污染为真实 citation。
- 外部 prose 中的真实 citation 仍必须有效。
- HTML code 标签内的无效 `[C99]` 不得进入 invalid citation claim 统计。

验收要求：

- `<pre><code>... [C1] ...</code></pre>` 不得进入 cited labels。
- `<code>... [C1] ...</code>` 不得进入 cited labels。
- `AuthService validates <code>token</code> ... [C1].` 必须保持 `DIRECT_VERIFIED`。
- 外部有效 `[C1]` 加 HTML 内 `[C99]` 时，claim 仍只绑定 `C1`，`invalidCitationClaimCount=0`。
- `CodeQaControllerTest` 必须覆盖 HTML 正例、纯 HTML 负例和混合正负例。
- QA 子 agent 复核必须为 PASS。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`git diff --check -- backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java backend-spring/src/test/java/com/sourcelens/CodeQaControllerTest.java`。
- PASS：拉里佩奇 / QA Engineer 复核。

非范围：

- 不改 API/DTO、DB schema、retrieval ranking、真实 LLM provider、前端 UI、release evidence 或 GitHub App。

## P6 增量：Report evidence lineStart/lineEnd alias parsing

目标：

- 报告证据、第三方工具输出或前端复制片段使用 `lineStart/lineEnd`、`line_start/line_end` 时，Code QA / code_chunks 检索必须把它们当作行范围锚点。
- 同一文件多 chunk 时，覆盖该范围的目标 chunk 必须优先返回。
- 字段别名不能扩大为任意 `start/end` 业务字段，避免误绑定。

验收要求：

- `CodeLocationHintParser.parseLineHints(...)` 支持 compact JSON/text 中成对 `lineStart/lineEnd` 和 `line_start/line_end`。
- `CodeLocationHintParser.stripLocationHintsForTokenization(...)` 必须清理这些字段和数字噪声。
- `CodeLocationHintParser.evidenceLocationHints(...)` 必须在同一 object 内绑定 `filePath + lineStart/lineEnd`。
- 未成对字段不得生成 line hint；跨 object 不得误配。
- `CodeChunkService.listRetrievalCandidates(...)` 必须在同文件多 chunk 场景把覆盖 alias range 的目标 chunk 排第一。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`git diff --check -- backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeLocationHintParser.java backend-spring/src/test/java/com/sourcelens/module/analysis/service/CodeLocationHintParserTest.java backend-spring/src/test/java/com/sourcelens/CodeChunkServiceTest.java`。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不改 API/DTO、DB schema、ranking 权重、前端 UI、release evidence schema、真实 LLM provider 或 GitHub App。

## P6 增量：Report evidence sourceFile/source_file alias parsing

目标：

- 报告证据或第三方工具 JSON 使用 `sourceFile`、`source_file`、`sourcefile` 时，Code QA / code_chunks 检索必须把它们当作证据文件路径锚点。
- 普通 `path` 字段不得被当作 evidence anchor，避免 API route path、文档 path 或业务 path 误导源码检索。
- `sourceFile + lineNumber` 在同一文件多 chunk 场景必须选择覆盖行号的目标 chunk。

验收要求：

- `CodeLocationHintParser.evidenceFilePathHints(...)` 支持 `sourceFile/source_file/sourcefile`。
- `CodeLocationHintParser.evidenceLocationHints(...)` 必须在同一 object 内绑定 `sourceFile/source_file + line/range`。
- `path` 字段继续不进入 evidence file path hints。
- `CodeChunkService.listRetrievalCandidates(...)` 必须证明 `sourceFile + lineNumber` 可在同文件多 chunk 场景把目标 chunk 排第一。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`git diff --check -- backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeLocationHintParser.java backend-spring/src/test/java/com/sourcelens/module/analysis/service/CodeLocationHintParserTest.java backend-spring/src/test/java/com/sourcelens/CodeChunkServiceTest.java`。
- PASS：拉里佩奇 / QA Engineer 只读复核；复核 caveat 已补强为同文件多 chunk sourceFile 测试。

非范围：

- 不泛化普通 `path` 字段。
- 不改 API/DTO、DB schema、ranking 权重、前端 UI、release evidence schema、真实 LLM provider 或 GitHub App。

## P6 增量：Report evidence sourcePath/source_path alias parsing

目标：

- 报告证据或第三方工具 JSON 使用 `sourcePath`、`source_path`、`sourcepath` 时，Code QA / code_chunks 检索必须把它们当作证据源码路径锚点。
- 普通 `path` 字段仍不得被当作 evidence anchor。
- `sourcePath + lineNumber` 在同一文件多 chunk 场景必须选择覆盖行号的目标 chunk。

验收要求：

- `CodeLocationHintParser.evidenceFilePathHints(...)` 支持 `sourcePath/source_path/sourcepath`。
- `CodeLocationHintParser.evidenceLocationHints(...)` 必须在同一 object 内绑定 `sourcePath/source_path + line/range`。
- `path` 字段继续不进入 evidence file path hints。
- `CodeChunkService.listRetrievalCandidates(...)` 必须证明 `sourcePath + lineNumber` 可在同文件多 chunk 场景把目标 chunk 排第一。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`git diff --check -- backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeLocationHintParser.java backend-spring/src/test/java/com/sourcelens/module/analysis/service/CodeLocationHintParserTest.java backend-spring/src/test/java/com/sourcelens/CodeChunkServiceTest.java`。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不泛化普通 `path` 字段。
- 不改变既有 pathSuffixHints 对普通文本源码路径的弱提示行为。
- 不改 API/DTO、DB schema、ranking 权重、前端 UI、release evidence schema、真实 LLM provider 或 GitHub App。

## P6 增量：Code QA mixed primary/context evidence coverage audit

目标：

- Code QA response 必须明确暴露 primary/context 证据是否被回答实际引用。
- 当检索结果包含 primary + adjacent context，但回答只引用 primary 时，citation coverage 必须显示 context gap，不能只靠 `requiredEvidenceCoveragePercent=100` 让用户误解为完整支撑。
- primary 跨文件语义不能被 context 混合状态覆盖。

验收要求：

- `CodeQaCitationCoverage` 暴露 `uncitedPrimaryEvidenceCount`、`uncitedPrimaryEvidenceFileCount`、`uncitedContextEvidenceCount`、`uncitedContextEvidenceFileCount`。
- `uncited*EvidenceFileCount` 的口径必须是“包含未引用证据的文件数”，不是 `roleFiles - citedRoleFiles`。
- 单 primary 文件 + context 返回 `MIXED_PRIMARY_CONTEXT`。
- `primaryFiles >= 2` 时继续返回 `PRIMARY_CROSS_FILE`，即使同时存在 adjacent context。
- `CodeQaControllerTest` 必须覆盖同一 context 文件部分 cited/uncited，以及 primary 跨文件 + context 两个边界。
- `ProjectDetail`、TS API type、frontend smoke mock、public smoke、release verifier 和 `API_DESIGN.md` 必须识别新状态和新 gap 字段。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`git diff --check -- backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java backend-spring/src/main/java/com/sourcelens/module/agent/dto/CodeQaCitationCoverage.java backend-spring/src/test/java/com/sourcelens/CodeQaControllerTest.java web-console/src/api/project.ts web-console/src/pages/ProjectDetail.tsx web-console/tests/report-evidence-drawer-smoke.spec.ts scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/validate-frontend-ui.mjs docs/API_DESIGN.md`。
- PASS：拉里佩奇 / QA Engineer 二次只读复核，runtime `Mill / 019f306f-d4b4-7601-802f-09075068114e`。

非范围：

- 不改变 retrieval ranking、DB schema、真实 LLM provider、GitHub App、生产部署或完整 release evidence authority。

## P6/P9/P11 增量：Code QA context gap visible warning

目标：

- 当 Code QA 回答已引用 PRIMARY 主证据，但 adjacent context 证据仍未被回答引用时，ProjectDetail 必须给出用户可见 warning。
- UI 不能把 `requiredEvidenceCoveragePercent=100` 或主证据已绑定误表达成“上下文证据也完整支撑”。
- release evidence verifier 必须强制读取 smoke marker 中的 uncited primary/context gap 字段。

验收要求：

- `QaCrossFileCitationSummary` 必须暴露 `contextGap`，并在缺口存在时显示 `上下文引用待补齐` 与 `上下文引用缺口`。
- `citationCoverageAudit(...)` 的 ready 判定必须同时要求 primary gap 和 context gap 均为 0。
- file-anchor drift/context-only 场景必须继续显示不可直接采信、修复证据门禁 `BLOCKED`，并隐藏“生成修复候选”。
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.citationCoverage` 必须包含 `maxUncitedPrimaryEvidenceCount=0`、`maxUncitedPrimaryEvidenceFileCount=0`、`minUncitedContextEvidenceCount>0`、`minUncitedContextEvidenceFileCount>0`。
- `crossFileCitationSummary` 必须包含 `contextGapVisible=true`，并与 uncited context evidence/file count 一致。
- `verify-release-evidence.sh` 必须拒绝 primary 未引用、context gap 字段缺失或 context gap 与 visible 标志不一致的当前 focused marker。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`npm --prefix web-console run smoke:report-evidence-drawer`。
- PASS：`bash -n scripts/verify-release-evidence.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker`。
- PASS：`SOURCELENS_PUBLIC_REPO_SMOKE_UI=true SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=900 ./scripts/public-repo-analysis-smoke.sh`，真实公开仓库 `LJunP/Pawnshop-Management-System.git` 输出 `projectId=371`、`repositoryId=332`、`scanTaskId=282`、`PUBLIC_REPO_UI_SMOKE_OK.realBackend=true`、`mockedApi=false`、三视口覆盖，且 `contextGapVisible=true`、`minUncitedContextEvidenceCount=7`、`minUncitedContextEvidenceFileCount=4`、`maxUncitedPrimaryEvidenceCount=0`。
- PASS：`git diff --check -- web-console/src/pages/ProjectDetail.tsx web-console/src/styles/app.css web-console/tests/report-evidence-drawer-smoke.spec.ts web-console/tests/public-repo-ui-smoke.spec.ts scripts/validate-frontend-ui.mjs scripts/verify-release-evidence.sh`。

非范围：

- 不改后端 coverage 计算、retrieval ranking、DB schema、真实 LLM provider、GitHub App 或 full release authority。

## P6 增量：Code QA Markdown link citation noise filter

目标：

- Code QA citation audit 必须只消费用户可见回答文本中的引用标签。
- Markdown link destination、image destination 和 reference definition URL 中的 `[C*]` 不能作为真实回答 citation。
- Markdown link 可见文本中的 `[C*]` 必须继续有效。

验收要求：

- `auditableAnswerText(...)` 必须剥离单行 Markdown link/image destination。
- scanner 必须覆盖 nested visible label，例如 `[AuthService [C1]](.../[C99])`。
- scanner 必须覆盖 link destination 中的括号，例如 `[C1](...path(foo).../[C99])`。
- Markdown reference definition 必须覆盖 `[ref]: url` 和 `[ref]:url` 两种写法。
- URL/reference 中的 `[C99]` 不得进入 `invalidCitationClaimCount` 或 `invalidSourceLabels`。
- 既有 HTML code、inline code、Markdown table、plain pipe、citation range 边界不得回退。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`git diff --check -- backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java backend-spring/src/test/java/com/sourcelens/CodeQaControllerTest.java`。
- PASS：拉里佩奇 / QA Engineer 三轮只读复核，runtime `Avicenna / 019f30bb-7f99-7393-8899-caae95a86d83`。

非范围：

- 不实现完整 Markdown parser。
- 不扩大 citation 标签语法。
- 不刷新 full release authority。

## P6 增量：Hosted source URL evidence path normalization

目标：

- 用户从 GitHub/GitLab 代码浏览页或 raw URL 复制证据到 `filePath/sourcePath` 时，系统必须保留仓库内相对路径。
- 同名文件存在时，完整 hosted source URL 不能退化为 basename fallback 导致 legacy/decoy 文件排第一。
- 普通 `path/url/location` 字段不得被升级为 evidence anchor。

验收要求：

- `CodeLocationHintParser.normalizeEvidenceFilePathHint(...)` 必须把 `https://github.com/{owner}/{repo}/blob/main/web-console/src/pages/ProjectDetail.tsx#L245` 归一化为 `web-console/src/pages/ProjectDetail.tsx`。
- `sourcePath: https://raw.githubusercontent.com/{owner}/{repo}/main/web-console/src/pages/ProjectDetail.tsx#L245` 必须归一化为仓库内相对路径。
- `CodeChunkService.listRetrievalCandidates(...)` 在同名 decoy 先返回时，目标完整路径仍必须排第一。
- 不扩大 evidence 字段白名单；`filePath/file_path/sourceFile/source_file/sourcePath/source_path` 之外的字段继续按普通文本或 path suffix 处理。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#listRetrievalCandidates_shouldNormalizeHostedBlobEvidenceUrlBeforeBasenameFallback+listRetrievalCandidates_shouldNormalizeHostedRawEvidenceUrlBeforeBasenameFallback test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：focused `git diff --check`。
- PASS：拉里佩奇 / QA Engineer 只读复核，runtime `Ampere / 019f30ca-4f3a-7762-9833-07f913b3ee84`。
- PASS：host-aware boundary tighten focused/full parser-service tests；普通相对 `modules/auth/blob/main/...` 和未知 host `https://example.com/.../blob/main/...` 不按 GitHub/GitLab 规则剥离。
- PASS：拉里佩奇 / QA Engineer 复审，runtime `Hilbert / 019f30d3-96e0-7ba2-9ce3-b59b857c3f4a`，首轮 PARTIAL 打回后补负例，二轮 PASS。

非范围：

- 不改 API/DTO、DB schema、ranking 权重、前端 UI、release evidence schema、真实 LLM provider 或 GitHub App。
- 不实现完整 report evidence schema parser。

## P6/P9/P11 增量：Source location confidence LLM fact boundary

目标：

- `来源定位可信度` 只能表达 source/file/line anchor 绑定质量，不能暗示 LLM 事实语义已经正确。
- Report evidence deep evidence card 必须把该边界显示给用户，并写入 release evidence marker。
- Release verifier 必须拒绝缺失该边界证明的当前 QA citation marker。

验收要求：

- `ProjectDetail` 的来源定位可信度 checks 必须显示 `定位不证明事实正确`。
- `report-evidence-drawer` smoke 必须断言该文本可见，并输出 `deepEvidenceCardReadability.sourceLocationConfidence.llmFactBoundaryVisible=true`。
- `verify-release-evidence.sh` 必须只在 `qaFromEvidence.deepEvidenceCardReadability.sourceLocationConfidence` 中强制该字段，不能误加到 public repo `sourceLocationReadability`。
- `security-regression-check.sh` 必须覆盖合法 marker，以及 `deep-evidence-card-llm-fact-boundary-missing` / `deep-evidence-card-llm-fact-boundary-hidden` 两类伪造拒绝。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`。
- PASS：`git diff --check -- web-console/src/pages/ProjectDetail.tsx web-console/tests/report-evidence-drawer-smoke.spec.ts scripts/verify-release-evidence.sh scripts/validate-frontend-ui.mjs scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker`。
- PASS：拉里佩奇 / QA Engineer 只读复核，runtime `Franklin / 019f30e2-0acd-7dd1-a3ea-193bec2e3b26`。

非范围：

- 不证明 LLM 事实正确性；该能力只证明 UI 和 release evidence 不越界表述。
- 不改后端 coverage 计算、retrieval ranking、DB schema、真实 LLM provider、GitHub App 或完整 release authority。

## P6 增量：Report evidence sourceUrl/source_url alias parsing

目标：

- 报告证据或第三方工具 JSON 使用 `sourceUrl`、`source_url`、`sourceurl` 时，Code QA / code_chunks 检索必须把它们当作明确源码来源锚点。
- 普通 `url`、`path`、`location` 字段不得被当作 evidence anchor。
- hosted source URL 必须复用既有 URL 归一化能力，减少同名文件 decoy 抢占第一结果。

验收要求：

- `CodeLocationHintParser.evidenceFilePathHints(...)` 支持 `sourceUrl/source_url/sourceurl`。
- `CodeLocationHintParser.evidenceLocationHints(...)` 必须在同一 object 内绑定 `sourceUrl/source_url + line/range`。
- `url/path/location` 字段继续不进入 evidence file path hints。
- `CodeChunkService.listRetrievalCandidates(...)` 必须证明 `sourceUrl + lineNumber` 在同名 `ProjectDetail.tsx` decoy 场景把目标文件排第一，即使普通 `url` 指向 decoy。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`git diff --check -- backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeLocationHintParser.java backend-spring/src/test/java/com/sourcelens/module/analysis/service/CodeLocationHintParserTest.java backend-spring/src/test/java/com/sourcelens/CodeChunkServiceTest.java`。
- PASS：拉里佩奇 / QA Engineer 只读复核，runtime `Descartes / 019f30eb-8a6d-7080-9de7-e04a1b1da4ff`。

非范围：

- 不泛化普通 `url/path/location` 字段。
- 不解决任意复杂分支名 hosted URL；当前沿用既有 common branch set。
- 不改 API/DTO、DB schema、ranking 权重、前端 UI、release evidence schema、真实 LLM provider 或 GitHub App。

## P6 增量：Hosted source URL nested branch normalization

目标：

- GitHub/GitLab/raw hosted source URL 的分支名可能是 `feature/code-review` 或 `release/2026/q3`，不能只支持 `main/master/develop/dev/trunk`。
- 归一化必须仍限制在 trusted hosted source hosts 上，不能影响 unknown host 或普通相对路径。
- `sourceUrl + lineNumber` 在复杂分支 URL 下必须继续压过同名文件 basename fallback。

验收要求：

- `CodeLocationHintParser.normalizeEvidenceFilePathHint(...)` 必须把 GitHub blob nested branch、GitLab blob nested branch、raw.githubusercontent nested branch 归一化为仓库内相对路径。
- nested branch 中如出现 `src/docs/test` 等 generic root，heuristic 必须优先选择 `web-console/backend-spring` 等 strong project root，避免把分支名片段误当源码根。
- `https://example.com/.../blob/main/...` 仍不得套用 hosted branch rules。
- `modules/auth/blob/main/...` 这类相对路径仍不得剥离。
- `CodeChunkService.listRetrievalCandidates(...)` 必须证明 `sourceUrl` nested branch + `lineNumber` 在同名 `ProjectDetail.tsx` decoy 场景目标文件排第一。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`git diff --check -- backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeLocationHintParser.java backend-spring/src/test/java/com/sourcelens/module/analysis/service/CodeLocationHintParserTest.java backend-spring/src/test/java/com/sourcelens/CodeChunkServiceTest.java`。
- PASS：拉里佩奇 / QA Engineer 二轮只读复核，runtime `Leibniz / 019f30f3-1e16-7052-b1ce-43e8bcd4d97d` 与 `Dirac / 019f30fa-0807-7f53-aba6-7793e6ead9a8`；第二轮确认 strong root 优先规则已覆盖 generic root 分支名场景。

非范围：

- 不扩普通 `url/path/location` evidence anchor。
- 不实现完整 Git provider URL parser。
- 仍存在 branch segment 与 strong source root segment 同名且真实文件只从 generic root 开始的歧义；后续若要完全消除，需要结合仓库 file index 或 provider metadata。

## P6 增量：Code QA HTML comment citation noise filter

目标：

- Code QA citation audit 必须只统计用户可见、可审计回答中的引用标签。
- HTML comment 中的隐藏 `[C1]` 不能让没有可见引用的回答变成 `VERIFIED`。
- claim citation coverage 必须同样忽略 HTML comment 中的 citation-like noise。

验收要求：

- `CodeQaController.auditableAnswerText(...)` 必须在 citation extraction 前剥离完整 `<!-- ... -->` HTML comment。
- 回答正文只有 `<!-- hidden fake citation [C1] -->` 时，`groundingStatus` 必须是 `UNVERIFIED`。
- 同一场景下 `citationEnforcementStatus` 必须是 `RETRY_FAILED`，`answerCitations[0].citedByAnswer=false`，claim 状态为 `UNCITED`。
- 既有 fenced code block、HTML `<pre>/<code>`、inline code、Markdown link destination 和 reference definition 过滤边界不得回退。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest#codeQa_shouldIgnoreFakeCitationsInsideHtmlCommentsOnly test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：focused `git diff --check` and trailing whitespace/conflict marker check。
- PASS：拉里佩奇 / QA Engineer 只读复核，runtime `Anscombe / 019f3103-c702-7c72-b696-feba53bd396b`。

非范围：

- 不声明完整 HTML sanitizer。
- 不改前端 UI、DB schema、retrieval ranking、真实 LLM provider、GitHub App 或 full release authority。

## P6 增量：Code QA HTML tag attribute citation noise filter

目标：

- Code QA citation audit 必须忽略 HTML tag 属性中的隐藏 citation-like text。
- 标签正文中的可见 citation 必须继续被保留并验证。
- 新过滤不得破坏 HTML comment、HTML `<pre>/<code>`、inline code、Markdown link/reference 等既有边界。

验收要求：

- `CodeQaController.auditableAnswerText(...)` 必须剥离普通 HTML tag 本身，避免属性里的 `[C1]` 进入 citation audit。
- `<span data-source="[C1]"></span>` 这类 attribute-only 场景必须保持 `UNVERIFIED / RETRY_FAILED / citedByAnswer=false / UNCITED`。
- `<span data-hidden="[C99]">... [C1]</span>` 这类场景必须保留可见 `[C1]`，并保持 `VERIFIED / DIRECT_VERIFIED / FULL / READY`，且 `[C99]` 不污染 invalid citation。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest#codeQa_shouldIgnoreFakeCitationsInsideHtmlTagAttributesOnly+codeQa_shouldKeepVisibleCitationsInsideHtmlTagText test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：focused `git diff --check` and trailing whitespace/conflict marker check。
- PASS：拉里佩奇 / QA Engineer 只读复核，runtime `Hubble / 019f310b-da0a-7223-b684-40cbf37c817e`。

非范围：

- 不声明完整 HTML sanitizer 或 DOM parser。
- 不改前端 UI、DB schema、retrieval ranking、真实 LLM provider、GitHub App 或 full release authority。

## P6 增量：Code QA HTML script/style citation noise filter

目标：

- Code QA citation audit 必须忽略 HTML `<script>` / `<style>` 块中的 citation-like text。
- script/style 块外的可见 citation 必须继续被保留并验证。
- 新过滤不得破坏 HTML comment、HTML `<pre>/<code>`、HTML tag attribute、inline code、Markdown link/reference 等既有边界。

验收要求：

- `CodeQaController.auditableAnswerText(...)` 必须在普通 tag stripping 前剥离 paired `<script>` / `<style>` blocks。
- script/style-only fake citation 场景必须保持 `UNVERIFIED / RETRY_FAILED / citedByAnswer=false / UNCITED`。
- script/style 外 visible citation 场景必须保持 `VERIFIED / DIRECT_VERIFIED / FULL / READY`，且 script/style 内 `[C99]` 不污染 invalid citation。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest#codeQa_shouldIgnoreFakeCitationsInsideHtmlScriptAndStyleOnly+codeQa_shouldKeepVisibleCitationsOutsideHtmlScriptAndStyle test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：focused `git diff --check` and trailing whitespace/conflict marker check。
- PASS：拉里佩奇 / QA Engineer 只读复核，runtime `Faraday / 019f3111-e402-7c71-822c-9d3536efe952`。

非范围：

- 不声明完整 HTML sanitizer、DOM parser、JavaScript parser 或 CSS parser。
- 不改前端 UI、DB schema、retrieval ranking、真实 LLM provider、GitHub App 或 full release authority。

## P6 增量：Code QA HTML entity citation bracket handling

目标：

- Code QA citation audit 必须识别用户可见的 HTML entity citation bracket，例如 `&#91;C1&#93;`。
- 解码必须发生在 hidden/non-auditable region 清理之后，不能让 tag attribute 或 Markdown link destination 中的 entity citation 重新进入 audit。
- 该能力只处理 citation bracket entity，不声明完整 HTML entity decoder。

验收要求：

- visible `&#91;C1&#93;`、`&#x5B;C1&#x5D;`、`&lbrack;C1&rbrack;`、`&lsqb;C1&rsqb;` 都必须进入 citation audit。
- 四个 visible entity claims 必须全部为 `CITED`，`requiredClaimCount=4`，`citedRequiredClaimCount=4`。
- tag attribute 中的 `&#91;C1&#93;` 必须继续不进入 audit。
- Markdown link destination 中的 `&#91;C1&#93;` 必须继续不进入 audit。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest#codeQa_shouldTreatVisibleHtmlEntityCitationBracketsAsValidCitation+codeQa_shouldIgnoreHtmlEntityCitationBracketsInsideTagAttributesOnly+codeQa_shouldIgnoreHtmlEntityCitationBracketsInsideMarkdownLinkDestination test`。
- PASS：拉里佩奇 / QA Engineer 二轮只读复核，runtime `Kant / 019f3118-2179-70b2-8d44-bbc106e590f1` 与 `Noether / 019f3119-fd5b-76b2-b28a-2df6f81d50cb`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：focused `git diff --check` and trailing whitespace/conflict marker check。

非范围：

- 不声明完整 HTML entity decoder、HTML sanitizer 或 DOM parser。
- 不改前端 UI、DB schema、retrieval ranking、真实 LLM provider、GitHub App 或 full release authority。

## P6 增量：Backend flow role intent retrieval

目标：

- 用户问“接口如何查数据库 / 怎么落库 / 从 controller 到 mapper”的链路型问题时，code_chunks 检索必须补齐 Controller、Service、Data Access 跨层候选。
- 普通“接口在哪里 / login endpoint”定位问题必须保持 Controller-only，不得无条件扩成全后端角色。
- 该能力是 bounded retrieval heuristic，不声明调用图、ORM 绑定或真实业务链路推理。

验收要求：

- `CodeChunkRanker.roleIntentTypes` 对中文和英文 backend database flow 问题返回 `CONTROLLER`、`SERVICE`、`DATA_ACCESS`。
- backend table/entity flow 问题必须额外返回 `DOMAIN_MODEL`，并让 Entity/Model 候选进入检索结果；中文“写表/读表”、常见 CRUD 动词“保存/新增/创建/更新/删除/插入/修改”、明确读操作“查询/读取/查找/检索”和受控响应载荷意图“返回/响应 + 数据/结果/列表/详情”不能只停在 Mapper 层。
- method-anchor backend flow 问题，例如 `PaymentController#createPayment 怎么从 controller 到 mapper 落库`，必须继续保留跨层 role intents。
- 普通 endpoint 查询不包含 `SERVICE` / `DATA_ACCESS`。
- role intent 检索排序必须让匹配源码角色优先于 docs/build 关键词噪声。
- `CodeChunkService` 检索/search 回归必须证明 Controller、Service、Mapper 进入候选；method anchor + backend flow 必须同时保留入口 Controller 和 Mapper 证据；SQL segment 不包含 `content LIKE`。
- 前端动作或明确页面入口到后端接口的 bridge 问法，例如“前端登录按钮点击后调用哪个后端接口”、“登录按钮调用哪个接口”、“登录页调用哪个接口”、“详情页用哪个接口”、“登录页对应哪个接口”、“登录页面接口是什么”、“登录页接口在哪里”、“登录页面接口”和 `login page endpoint`，必须同时返回 `FRONTEND` 和 `CONTROLLER` intent，但不得扩展到 `SERVICE` / `DATA_ACCESS`；普通“登录接口请求”、“分页接口请求”、“分页接口用什么”、“分页接口是什么”、“分页接口在哪里”、“分页接口”和 `pagination endpoint` 不得误带 `FRONTEND`。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldTreatBackendDatabaseFlowQuestionsAsCrossLayerIntent+roleIntentTypes_shouldNotExpandPlainEndpointQuestionToAllBackendRoles+listRetrievalCandidates_shouldIncludeControllerServiceAndDataAccessForBackendFlowQuestion+searchChunks_shouldExpandBackendFlowIntentWithoutContentLikeHotPath test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldKeepBackendFlowIntentWhenMethodAnchorIsPresent+listRetrievalCandidates_shouldExpandMethodAnchorBackendFlowToDataAccess test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldIncludeDomainModelForBackendTableFlowQuestions+listRetrievalCandidates_shouldIncludeDomainModelForBackendTableFlowQuestion test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldIncludeDomainModelForChineseWriteTableFlowQuestions+listRetrievalCandidates_shouldIncludeDomainModelForChineseWriteTableFlowQuestion test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldIncludeDomainModelForChineseCrudFlowQuestions+listRetrievalCandidates_shouldIncludeDomainModelForChineseCrudFlowQuestion test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldIncludeDomainModelForChineseReadFlowQuestions+listRetrievalCandidates_shouldIncludeDomainModelForChineseReadFlowQuestion test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldIncludeDomainModelForChineseResponseDataFlowQuestions+listRetrievalCandidates_shouldIncludeDomainModelForChineseResponseDataFlowQuestion test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldTreatChinesePageEndpointQuestionsAsFrontendAndControllerIntent+listRetrievalCandidates_shouldIncludeFrontendAndControllerForChinesePageEndpointQuestion test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldTreatChinesePageEndpointRelationQuestionsAsFrontendAndControllerIntent+listRetrievalCandidates_shouldIncludeFrontendAndControllerForChinesePageEndpointRelationQuestion test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldTreatChinesePageEndpointQuestionFormsAsFrontendAndControllerIntent+listRetrievalCandidates_shouldIncludeFrontendAndControllerForChinesePageEndpointQuestionForm test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldTreatChinesePageEndpointNounPhrasesAsFrontendAndControllerIntent+listRetrievalCandidates_shouldIncludeFrontendAndControllerForChinesePageEndpointNounPhrase test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldTreatEnglishPageEndpointNounPhrasesAsFrontendAndControllerIntent+listRetrievalCandidates_shouldIncludeFrontendAndControllerForEnglishPageEndpointNounPhrase test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldTreatFrontendBackendBridgeQuestionsAsFrontendAndControllerIntent+listRetrievalCandidates_shouldIncludeFrontendAndControllerForFrontendBackendBridgeQuestion test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#roleIntentTypes_shouldTreatButtonEndpointQuestionsAsFrontendAndControllerIntent+listRetrievalCandidates_shouldIncludeFrontendAndControllerForButtonEndpointQuestion test`。
- PASS：梁文峰 / Data-AI Engineer 只读复核，runtime `Curie / 019f3120-7e0a-7122-b8cc-ca15b3491b15`，结论 `PASS_TO_IMPLEMENT`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。

## P6 增量：Code QA citation 后逗号转接 claim 审计

目标：防止 LLM 把多个代码事实写成 `AuthController handles login [C1]，此外 TokenRepository persists token data` 时，后续未引用事实被前一个 citation 覆盖。

验收要求：

- `claimCitationCoverage` 必须把 citation 后 `，此外/同时/另外/并且/其次/然后/但是/但/而` 和英文 `also/however/additionally` 转接的代码事实拆成独立 claim。
- 第一条带有效 citation 的 claim 保持 `CITED`，后续无 citation 的 required code fact 必须进入 `UNCITED`，整体状态为 `REVIEW`。
- 不得改变普通句号文件路径保护、分号、inline numbered、inline bullet、Markdown table 和普通 pipe 负例边界。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest#codeQa_shouldSplitTransitionCodeFactsAfterChineseCommaCitation test`。
- PASS：focused `git diff --check` and trailing whitespace/conflict marker check。

非范围：

- 不声明静态调用图、跨文件依赖追踪、SQL/ORM 绑定、真实 LLM factual correctness 或 full release authority。
- 不改 API/DTO、DB schema、前端 UI、GitHub App 或真实 provider。

## P6 增量：Code QA bare URL citation noise filter

目标：防止 LLM 在裸 URL 中输出 `https://example.test/[C1]`、`example.test?source=[C99]`、`localhost:5173?source=[C99]` 或 `[::1]:5173/[C99]` 时，被误识别为真实 Code QA citation。

验收要求：

- `auditableAnswerText` 必须在 citation/entity audit 前剥离裸 `http(s)://`、`www.` URL、带常见 Web TLD 且以 `/` / `?` / `#` 起始的无 scheme domain URL，以及 `localhost` / IPv4 loopback / bracketed IPv6 loopback `::1` 形态的本地 URL。
- 只有裸 URL 中存在 `[C1]` 时，代码事实 claim 必须保持 `UNCITED`，不得让 `citationCoverage` 进入 `FULL`。
- 正文真实 `[C1]` 必须继续有效；裸 URL 中的无效 `[C99]` 不得污染 `invalidCitationClaimCount`。
- `src/AuthService.java [C1]` 这类文件路径正文引用必须继续可审计，不得被 domain URL 过滤误伤。
- `src/fixture.test/[C1]` 这类 domain-like 相对路径不得被 no-scheme domain URL 正则从路径中间误剥离；no-scheme domain URL 匹配必须有安全左边界。
- 不得影响 Markdown link/image/reference URL 既有过滤、HTML hidden region 过滤或可见正文 citation。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest#codeQa_shouldIgnoreFakeCitationsInsideBareUrlsOnly+codeQa_shouldKeepProseCitationReadyWhenInvalidCitationOnlyAppearsInsideBareUrl+codeQa_shouldKeepFilePathCitationAuditableWhenDomainUrlNoiseIsFiltered+auditableAnswerText_shouldKeepDomainLikeRelativePathCitationWhenUrlNoiseIsFiltered test`，覆盖 slash path、query-only、fragment-only、localhost query、IPv4 loopback、bracketed IPv6 loopback URL 噪声和 domain-like 相对路径左边界。

非范围：

- 不实现完整 URL parser、HTML sanitizer 或 Markdown parser。
- 不改 API/DTO、DB schema、前端 UI、GitHub App 或真实 provider。

## P9 增量：Shared ActionButton label readability

目标：共享 `ActionButton` 不能再用 `nowrap + ellipsis` 隐藏按钮文字；所有 visible-label action 必须默认支持换行、自适应高度和高对比文本。

验收要求：

- `.sl-action-button` 默认必须使用 `height:auto`、`min-height:32px`、`max-width:100%`、`padding-block:4px` 和 `white-space:normal`。
- `.sl-action-button.ant-btn-sm` 必须保持 compact hitbox，但仍支持自适应高度。
- `.sl-action-button-label` 必须使用 `overflow:visible`、`overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `line-height:1.25`。
- `validate-frontend-ui.mjs` 必须拒绝 `.sl-action-button-label` 回退到 `text-overflow:ellipsis + white-space:nowrap`。
- 不得破坏 `IconActionButton` 的 icon-only dense action 语义；visible-label action 继续走 `ActionButton`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三个视口和 primary button label 不裁切断言。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核，runtime `Hume / 019f3199-5694-7613-b201-ef2c3a2c0c7f`。

非范围：

- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。

## P9 增量：Shared StateBlock readability

目标：共享 `StateBlock` 必须能承载长错误码、长 URL、长路径、长 API message 和长 retry 文案，不得裁切、隐藏或横向撑破页面。

验收要求：

- `.sl-state-block` 必须声明 `width:100%`、`min-width:0`、`max-width:100%` 和 `overflow:visible`，保证状态面在父容器内收缩。
- `.sl-state-block-copy strong` 必须保留 `overflow-wrap:anywhere`、`white-space:normal`、`text-overflow:clip` 和 `word-break:break-word`。
- `.sl-state-block-copy p` 必须同样支持长 API message、URL、路径和错误详情换行，不得依赖 ellipsis。
- `.sl-state-block-action` 必须使用 flex wrap，让 retry/action button 在窄屏折行。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 `StateBlock` copy 回退到 `text-overflow:ellipsis`、`white-space:nowrap`，以及 action 区回退到 `flex-wrap:nowrap`、`white-space:nowrap` 或 `overflow:hidden`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口、primary button label 不裁切、无横向溢出和核心状态行换行。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Pasteur / 019f31a2-ff2e-7be0-8920-a2df0d5f5aa3`。
- PASS：focused `git diff --check` and trailing whitespace/conflict marker check。

非范围：

- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared state primitive focused change。

## P9 增量：Shared Ant Tag and Badge readability

目标：SourceLens 共享页面壳内的 Ant `Tag` 与 `Badge` 文本必须默认可读，能承载状态、风险、证据类型、路径、scan/task 标识和治理标签，不得用 `nowrap` 或 `ellipsis` 隐藏关键上下文。

验收要求：

- `.sl-app-shell .ant-tag` 与 `.sl-app-shell .ant-badge-status-text` 必须声明 `max-width:100%`、`min-width:0`、`height:auto`、`line-height:1.35`、`overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `.sl-app-shell .ant-badge` root 必须声明 `max-width:100%` 和 `min-width:0`，保证状态 badge 在 dense surface 中可收缩。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 shared Ant Tag/Badge text 回退到 `white-space:nowrap` 或 `text-overflow:ellipsis`；badge status text 必须有 standalone reject，避免后续单独 selector 覆盖。
- 该规则必须限定在 `.sl-app-shell` 内，不影响登录页之外的第三方独立渲染上下文。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Pauli / 019f31ab-dd3d-7463-b6a0-d9754093c972`。
- PASS：focused `git diff --check` and trailing whitespace/conflict marker check。

非范围：

- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared metadata label focused change。

## P9 增量：Shared Ant Alert readability

目标：SourceLens 共享页面壳内的 Ant `Alert` 必须能承载长错误、长路径、风险说明、安全边界、补丁证据和恢复动作，不得裁切、隐藏或横向撑破页面。

验收要求：

- `.sl-app-shell .ant-alert` 必须声明 `align-items:flex-start`、`max-width:100%`、`min-width:0` 和 `overflow:visible`。
- `.sl-app-shell .ant-alert-content` 必须声明 `max-width:100%`、`min-width:0` 和 `overflow:visible`。
- `.sl-app-shell .ant-alert-message` 与 `.sl-app-shell .ant-alert-description` 必须声明 `max-width:100%`、`min-width:0`、`overflow:visible`、`overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `.sl-app-shell .ant-alert-action` 必须使用 `display:flex`、`flex-wrap:wrap`、`gap:8px`、`max-width:100%`、`min-width:0` 和 `overflow:visible`。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 alert copy 回退到 `white-space:nowrap`、`text-overflow:ellipsis` 或 `overflow:hidden`，拒绝 alert action 回退到 `flex-wrap:nowrap`、`white-space:nowrap` 或 `overflow:hidden`。
- 该规则必须限定在 `.sl-app-shell` 内，不影响登录页之外的第三方独立渲染上下文。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核，runtime `Planck / 019f31b4-5ace-7142-ad85-05d53b8efeca`。
- PASS：focused `git diff --check` and trailing whitespace/conflict marker check。

非范围：

- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared alert surface focused change。

## P9 增量：Shared Ant Design Descriptions readability

目标：SourceLens 共享页面壳内的 Ant `Descriptions` 必须能承载长 ID、路径、hash、URL、错误信息、审计详情和配置元数据，不得裁切、隐藏或横向撑破页面。

验收要求：

- `.sl-app-shell .ant-descriptions` 与 `.sl-app-shell .ant-descriptions-view` 必须声明 `max-width:100%`、`min-width:0` 和 `overflow:visible`。
- `.sl-app-shell .ant-descriptions-item`、`.sl-app-shell .ant-descriptions-item-label` 与 `.sl-app-shell .ant-descriptions-item-content` 必须声明 `max-width:100%`、`min-width:0`、`overflow:visible`、`overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal`、`word-break:break-word` 和 `vertical-align:top`。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 shared Descriptions item、label、content 回退到 `white-space:nowrap`、`text-overflow:ellipsis` 或 `overflow:hidden`。
- 反向门禁必须覆盖单 selector 和常见组合 selector，避免后续 `.ant-descriptions-item-label, .ant-descriptions-item-content { ... }` 绕过。
- 该规则必须限定在 `.sl-app-shell` 内，不影响登录页之外的第三方独立渲染上下文。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `McClintock / 019f31d3-8c56-7bc2-95c2-170b2d8851f2`。

非范围：

- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant Descriptions focused change。

## P9 增量：Shared Ant List readability

目标：SourceLens 共享页面壳内的 Ant `List` 必须能承载风险、技术债、建议、证据摘要、长路径、长 URL 和行级 action，不得裁切、隐藏或在窄屏互相挤压。

验收要求：

- `.sl-app-shell .ant-list` 与 `.sl-app-shell .ant-list-items` 必须声明 `max-width:100%` 和 `min-width:0`。
- `.sl-app-shell .ant-list-item` 必须声明 `max-width:100%`、`min-width:0` 和 `overflow:visible`。
- `.sl-app-shell .ant-list-item-meta` 与 `.sl-app-shell .ant-list-item-meta-content` 必须保持可收缩，metadata root 必须 `align-items:flex-start`，避免图标和多行文字错位。
- `.sl-app-shell .ant-list-item-meta-title` 与 `.sl-app-shell .ant-list-item-meta-description` 必须声明 `max-width:100%`、`min-width:0`、`overflow:visible`、`overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `.sl-app-shell .ant-list-item-action` 必须使用 `display:flex`、`flex-wrap:wrap`、`gap:8px`、`max-width:100%`、`min-width:0`、`overflow:visible`、`overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`，action item 也必须保持可收缩、可换行且不裁切。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 shared List metadata 回退到 `white-space:nowrap`、`text-overflow:ellipsis` 或 `overflow:hidden`，拒绝 action/action item 回退到 `flex-wrap:nowrap`、`white-space:nowrap`、`text-overflow:ellipsis` 或 `overflow:hidden`。
- 该规则必须限定在 `.sl-app-shell` 内，不影响登录页之外的第三方独立渲染上下文。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke` 第二次执行通过，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出；第一次执行在 `.sl-app-shell` 初始化等待处偶发失败，未命中 List 样式断言，随后复跑通过。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Mencius / 019f31de-7025-7a83-8ce6-91f9aef7558e`。

非范围：

- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant List focused change。

## P9 增量：Shared Ant Modal and Confirm readability

目标：SourceLens 的 Ant `Modal` 与 `Modal.confirm`/Confirm 必须能承载长标题、长错误、长路径、hash、URL、风险说明、表单错误和操作按钮文案，不得在 320px/390px 窄屏撑破 viewport、裁切或隐藏。

验收要求：

- `.ant-modal-root .ant-modal` 与 `.ant-modal-root .ant-modal-confirm` 必须声明 `max-width:calc(100vw - 24px)`，保证 portal 弹层不逃出窄屏视口。
- `.ant-modal-root` 下 modal content/header/body/footer 与 confirm body wrapper/body/paragraph 必须声明 `max-width:100%` 和 `min-width:0`。
- `.ant-modal-root` 下 modal title、confirm title/content、confirm content 内常见文本节点、form label、form explain、input、textarea 和 select selected item 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `.ant-modal-root .ant-modal-footer` 与 `.ant-modal-root .ant-modal-confirm-btns` 必须使用 `display:flex`、`flex-wrap:wrap`、`gap:8px` 和 `justify-content:flex-end`。
- `.ant-modal-root` 下 footer/confirm button 必须自适应高度，并支持长按钮文案换行。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 modal/confirm 根关闭 viewport 宽度约束，拒绝 title/content 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`，拒绝 footer/confirm actions 回退到 `flex-wrap:nowrap` 或 `overflow:hidden`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Peirce / 019f31e8-cb45-7cc2-8dec-0095c6cd2a8d`。

非范围：

- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明所有 Modal 业务流程或全站 UI 体系完成；这是 shared Ant Modal/Confirm focused change。

## P9 增量：Shared Ant Card Header readability

目标：SourceLens 共享页面壳内的 Ant `Card` header 必须能承载长标题、状态标签、scan/task/repository 上下文、右侧 action 和筛选/导出动作，不得在 320px/390px 下被裁切、省略或把主体内容挤出视口。

验收要求：

- `.sl-app-shell` 内 Ant Card root、head、head wrapper、head title、extra 和 body 必须保持 `max-width:100%` 与 `min-width:0`。
- `.sl-app-shell .ant-card-head-wrapper` 必须 `align-items:flex-start` 并提供 `gap:8px`，保证标题和 extra 换行后顶部对齐。
- `.sl-app-shell .ant-card-head-title` 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `.sl-app-shell .ant-card-extra` 必须使用 `display:flex`、`flex-wrap:wrap`、`gap:8px` 和 `justify-content:flex-end`，并支持长 action 文案换行。
- `.sl-app-shell .ant-card-extra .ant-space` 与 `.sl-app-shell .ant-card-head-title .ant-space` 必须允许 `flex-wrap:wrap`，对应 Space item 必须保持可收缩。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 Card title/extra 回退到 `white-space:nowrap`、`text-overflow:ellipsis`、`overflow:hidden` 或 Space `flex-wrap:nowrap`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核，runtime `Poincare / 019f31f2-31c1-75e0-ae2c-f2b8a1846b1d`。

非范围：

- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明所有 Card 业务布局或全站 UI 体系完成；这是 shared Ant Card header focused change。

## P6 增量：Hosted source URL app root normalization

目标：hosted source URL 归一化必须保留常见应用根目录，避免复杂分支名中出现 `src` 片段时把 `app/src/...` 错截为 `src/...`。

验收要求：

- `CodeLocationHintParser.normalizeEvidenceFilePathHint(...)` 必须把 `https://github.com/.../blob/feature/src-preview/app/src/pages/Login.tsx#L44` 归一化为 `app/src/pages/Login.tsx`。
- hosted source heuristic 必须将 `app`、`apps`、`client`、`packages` 作为受控应用容器 root 处理；这些 root 不得与 `web-console/backend-spring` 等项目强 root 混在同一套规则里。
- `feature/app/src/...` 必须保守归一化为 `src/...`，避免把复杂分支后的第一个 `app` 片段误判为源码根。
- 多段分支后的 `apps/client/src/...` 必须保留更外层的 `apps/client/...`，不能从内层 `client/...` 截断。
- 单段分支后的 `feature/apps/client/src/...` 是不可消歧边界，必须保守降级为 `client/src/...` 并由测试锁住。
- 既有 GitHub/GitLab/raw nested branch、sourceUrl/source_url alias、unknown host 和相对路径负例必须继续通过。
- 不得把普通 `url/path/location` 扩成 evidence anchor。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest#normalizeEvidenceFilePathHint_shouldKeepAppRootWhenNestedBranchContainsSrc test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest#normalizeEvidenceFilePathHint_shouldKeepAppRootWhenNestedBranchContainsSrc+normalizeEvidenceFilePathHint_shouldNotTreatFirstAppLikeBranchSegmentAsSourceRoot+normalizeEvidenceFilePathHint_shouldPreferAppsContainerOverNestedClientRoot+normalizeEvidenceFilePathHint_shouldConservativelyDowngradeSingleBranchAppsContainerAmbiguity test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#listRetrievalCandidates_shouldNormalizeSourceUrlEvidenceAnchorBeforeBasenameFallback test`。

非范围：

- 不实现完整 Git provider URL parser。
- 不结合仓库 file index 或 provider metadata 做 branch/root 绝对消歧。
- 不改 API/DTO、DB schema、前端 UI、release evidence schema 或 GitHub App。

## P6/P11 增量：Hosted source URL app root candidate disambiguation regression gate

目标：当 hosted source URL parser 因无 file index/provider metadata 必须对 `feature/apps/client/src/...` 做保守降级时，code_chunks 候选集排序必须仍能利用 raw hosted URL/path suffix 信号在候选集内压过同名 decoy。

验收要求：

- `CodeChunkService.listRetrievalCandidates(...)` 在候选集中同时有 `client/src/pages/Login.tsx` 和 `apps/client/src/pages/Login.tsx` 时，必须把 `apps/client/src/pages/Login.tsx` 排第一。
- 测试输入必须包含 `sourceUrl=https://github.com/acme/source-lens/blob/feature/apps/client/src/pages/Login.tsx#L44` 和 `lineNumber=44`。
- 该门禁只证明候选集内排序消歧，不声明 SQL candidate expansion、完整 file index 消歧或 provider metadata 已完成。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest#listRetrievalCandidates_shouldUseHostedSourceUrlAppRootVariantBeforeAmbiguousSuffixDecoy test`。

非范围：

- 不改生产代码。
- 不实现完整 Git provider URL parser、仓库 file index 或 provider metadata。
- 不改 API/DTO、DB schema、前端 UI、release evidence schema 或 GitHub App。

## P9 增量：Shared Ant Tabs readability

目标：SourceLens 共享页面壳内的 Ant `Tabs` 必须能承载报告标签、审计标签、产物预览标签、Agent 详情标签和项目工作区标签，不得在窄屏或局部报告页样式中被裁切、省略或隐藏。

验收要求：

- `.sl-app-shell` 内 Ant Tabs root、nav、nav-wrap、nav-list、content-holder、content 和 tabpane 必须保持 `max-width:100%` 与 `min-width:0`。
- `.sl-app-shell .ant-tabs-nav` 必须保持 `overflow:visible`，避免 wrapped tab label 被 nav root 裁切。
- `.sl-app-shell .ant-tabs-tab` 必须保持可收缩。
- `.sl-app-shell .ant-tabs-tab-btn` 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `.sl-report-tabs .ant-tabs-nav` 不得使用 `overflow:hidden` 覆盖共享 Tabs nav 可读性；`.ant-tabs-nav-wrap` 可以继续作为横向滚动层使用 `overflow-x:auto`。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 tab label 回退到 `white-space:nowrap`、`text-overflow:ellipsis` 或 `overflow:hidden`，拒绝 report tabs nav 回退到 `overflow:hidden`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Kierkegaard / 019f31f9-dfe5-7cc0-b94e-fa61af6563ab`；首轮 `PARTIAL` 的 report tabs nav hidden 覆盖、validator 局部回退门禁和设计系统 Tabs 记录缺口已关闭。

非范围：

- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明所有业务 Tabs 场景都已逐个截图级视觉验证。
- 不声明全站 UI 体系完成；这是 shared Ant Tabs focused change。

## P9 增量：Shared Ant Select readability

目标：SourceLens 共享页面壳内的 Ant `Select` 必须能承载项目名、仓库名、分支名、模型名、provider、状态筛选和多选标签，不得在过滤器、表单、项目选择器或下拉面板中被裁切、省略或隐藏。

验收要求：

- `.sl-app-shell` 内 Ant Select root、selector、selection overflow、overflow item、search、selected item 和 placeholder 必须保持 `max-width:100%` 与 `min-width:0`。
- `.sl-app-shell .ant-select-selector` 必须保持 `overflow:visible`，避免已选值和 placeholder 被 selector root 裁切。
- `.sl-app-shell .ant-select-selection-item` 与 `.sl-app-shell .ant-select-selection-placeholder` 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `.sl-app-shell .ant-select-multiple .ant-select-selection-overflow` 必须允许 `flex-wrap:wrap`；多选 value tag 必须允许自适应高度。
- `.ant-select-dropdown` 是 Ant Select portal 下拉层，本轮作为 SourceLens 共享 portal 范围治理；其 option root 和 option content 必须可收缩，option content 必须支持长项目、仓库、分支和模型标签换行。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 selected item、placeholder、multiple overflow 和 dropdown option 通过直接 selector、组合 selector 或更具体 selector 回退到 `white-space:nowrap`、`text-overflow:ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Nietzsche / 019f3202-e185-7ff2-9a87-7ad393a826bc`；首轮 `PARTIAL` 的设计系统、阶段文档、validator 覆盖和 portal 边界缺口已关闭。

非范围：

- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明所有 Select 下拉交互都已逐个打开截图级视觉验证。
- 不声明 `.ant-select-dropdown` portal 规则适用于非 SourceLens 独立渲染上下文；若未来接入第三方独立 portal，需要再做作用域隔离。
- 不声明全站 UI 体系完成；这是 shared Ant Select focused change。

## P9 增量：Shared Ant Form label/help readability

目标：SourceLens 共享页面壳内的 Ant `Form` 必须能承载长 label、校验错误、extra/help 提示、token 策略、GitHub App 后置说明、分支名和权限说明，不得在页面级表单或过滤器中被裁切、省略或隐藏。

验收要求：

- `.sl-app-shell` 内 Ant Form root、form item、item row、label、control、control input、control input content、explain 和 extra 必须保持 `max-width:100%` 与 `min-width:0`。
- `.sl-app-shell .ant-form-item-label` 必须保持 `overflow:visible`，避免多行 label 被 label container 裁切。
- `.sl-app-shell .ant-form-item-label > label`、`.ant-form-item-explain`、`.ant-form-item-extra` 和 `.ant-form-item-explain-error` 必须支持 `height:auto`、`overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 label、explain/error 和 extra/help 通过直接 selector、组合 selector 或更具体 selector 回退到 `white-space:nowrap`、`text-overflow:ellipsis` 或 `overflow:hidden`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Popper / 019f320c-07cf-7bf0-a0b2-eaf9e1629652`；首轮 `PARTIAL` 的 `!important` 回退门禁和 input/textarea 编辑行为边界缺口已关闭。

非范围：

- 不改变输入框、TextArea、InputNumber 或 Password 的编辑行为。
- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明所有业务表单都已逐个截图级视觉验证。
- 不声明全站 UI 体系完成；这是 shared Ant Form label/help focused change。

## P9 增量：Shared Ant Space action-row readability

目标：SourceLens 共享页面壳内的 Ant `Space` 必须能承载标题组合、状态标签组、证据标签组、表格行操作和工具栏 action，不得在窄屏或 dense surface 中被挤压、裁切、省略或隐藏；`Space.Compact` 输入组合必须保持不被共享 wrap 规则拆开。

验收要求：

- `.sl-app-shell .ant-space` 与 `.sl-app-shell .ant-space-item` 必须保持 `max-width:100%` 与 `min-width:0`。
- `.sl-app-shell .ant-space-horizontal:not(.ant-space-compact)` 必须允许 `flex-wrap:wrap`。
- `.sl-app-shell .ant-space-horizontal:not(.ant-space-compact) > .ant-space-item` 必须支持 `overflow:visible`、`overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝普通 horizontal Space 或 Space item 回退到 `flex-wrap:nowrap`、`white-space:nowrap`、`text-overflow:ellipsis` 或 `overflow:hidden`；规则不得禁止 `Space.Compact` 作为输入组合存在。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Godel / 019f3215-c772-71b0-bdf5-5b4dee37a093`；首轮 `PARTIAL` 的普通 Space nowrap 漏拦和 compact 误杀风险已关闭。

非范围：

- 不改变 `Space.Compact` 输入组合行为。
- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明所有业务 action row 都已逐个截图级视觉验证。
- 不声明全站 UI 体系完成；这是 shared Ant Space action-row focused change。

## P9 增量：Shared Ant Typography code/pre readability

目标：SourceLens 共享页面壳内的 Ant `Typography`、inline `code` 和 `pre` 必须能承载长路径、hash、命令、错误片段和证据引用，不得横向溢出、被裁切或被省略；同时不得粗暴覆盖表格列中已有的业务级 ellipsis 策略。

验收要求：

- `.sl-app-shell .ant-typography` 必须保持 `max-width:100%` 与 `min-width:0`。
- `.sl-app-shell .ant-typography code` 与 `.sl-app-shell code` 必须支持 `overflow-wrap:anywhere`、`white-space:normal` 和 `word-break:break-word`。
- `.sl-app-shell .ant-typography pre` 与 `.sl-app-shell pre` 必须支持 `overflow:auto`、`overflow-wrap:anywhere`、`white-space:pre-wrap` 和 `word-break:break-word`。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 shared code/pre 回退到 `white-space:nowrap`、`text-overflow:ellipsis` 或 `overflow:hidden`。
- 该增量不得对所有 `.ant-typography` 强制取消 ellipsis；表格列的业务级 `ellipsis:true` 和 `.sl-table-subtext` 不在本轮改造范围。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核，runtime `Hypatia / 019f321f-5ea8-7c41-9cf5-0d799f3da124`；确认共享 Typography/code/pre 规则未粗暴取消表格业务级 ellipsis。
- 修正：Project next action dark-surface disabled button 在 smoke 中动态切换 disabled 后会触发颜色 transition 中间值，已对该 disabled 态及内部文本禁用 transition，保证可读性断言稳定。

非范围：

- 不改变表格列 `ellipsis:true` 的业务级折叠策略。
- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明所有 Typography 场景都已逐个截图级视觉验证。
- 不声明全站 UI 体系完成；这是 shared Ant Typography code/pre focused change。

## P9 增量：Shared Ant Pagination readability

目标：SourceLens 共享页面壳内的 Ant `Pagination` 必须能承载项目、任务、产物、审计、CI、PR、Issue、AutoRepair 和模型配置等表格底部分页；总数文本、page-size 选择和 quick jumper 不得在窄屏被挤压、裁切、省略或造成横向溢出。

验收要求：

- `.sl-app-shell .ant-pagination` 必须保持 `display:flex`、`flex-wrap:wrap`、`max-width:100%`、`min-width:0` 和 `overflow:visible`。
- Pagination total、页码项、prev/next/jump、options、size changer 和 quick jumper 必须保持 `max-width:100%` 与 `min-width:0`。
- `.ant-pagination-total-text` 和 `.ant-pagination-options-quick-jumper` 必须支持 auto height、`overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `.ant-pagination-options` 必须允许 flex wrap，避免 page-size selector 与 quick jumper 在窄屏挤压表格。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 Pagination 或 total/quick jumper 回退到 `flex-wrap:nowrap`、`white-space:nowrap`、`text-overflow:ellipsis` 或 `overflow:hidden`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Euclid / 019f322a-c9ee-7973-adb6-6f28b3212993`；首轮 `PARTIAL` 的 Pagination 子控件反向门禁覆盖缺口已关闭。

非范围：

- 不改变任何页面的分页数据、pageSize、current page 或 API 查询逻辑。
- 不改变表格列 `scroll.x`、列宽、行选择或详情入口策略。
- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明所有业务表格分页都已逐个截图级视觉验证。
- 不声明全站 UI 体系完成；这是 shared Ant Pagination focused change。

## P9 增量：Shared Ant Drawer readability

目标：SourceLens 共享 Ant `Drawer` 必须能承载审计事件、工具调用、Webhook Delivery、产物详情、报告证据和移动端导航等详情面板；抽屉宽度、标题、extra action、footer action 和长上下文不得在窄屏被裁切、省略、挤压或撑破 viewport。

验收要求：

- `.ant-drawer .ant-drawer-content-wrapper` 必须保持 `max-width:calc(100vw - 24px)`，避免 portal 抽屉在窄屏越界。
- Drawer content、header、body、footer、title 和 extra 必须保持 `max-width:100%` 与 `min-width:0`。
- Drawer header 必须允许 title/action 多行布局；title 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- Drawer extra、extra Space、footer 和 action button 必须允许 flex wrap，长 action 文案不得被 hidden、ellipsis 或 nowrap 裁切。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 Drawer 宽度 containment 被关闭，或 title/extra/footer/action 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make artifacts-detail-selection-ui-smoke`，覆盖 Artifacts Drawer 详情、预览、raw download 边界、390/320 移动端无横向溢出。
- PASS：`make audit-logs-detail-selection-ui-smoke`，覆盖 AuditLogs 三源 Drawer、deep link、raw JSON redaction、390 移动端可读性。
- PASS：`make report-evidence-drawer-ui-smoke`，覆盖 ScanTaskDetail Report Evidence Drawer、code_chunks、QA citation、redaction、390/320 移动端无横向溢出。
- PASS：`make app-shell-ui-smoke`，覆盖移动端导航 Drawer 和 13 个核心路由、1440/390/320 三视口。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Kuhn / 019f3235-6fdf-7ac3-88f1-9f2eca4d5a11`；首轮 `PARTIAL` 的 `.ant-drawer-header-title` 收缩边界和 selector-block 反向门禁缺口已关闭。

非范围：

- 不改变任何 Drawer 的打开/关闭逻辑、数据加载、深链匹配、raw 展示、redaction、业务宽度配置或具体详情内容结构。
- 不替代 Artifacts、AuditLogs 或 Report Evidence Drawer 的页面级可访问性和 redaction smoke。
- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明所有业务 Drawer 都已逐个截图级视觉验证。
- 不声明全站 UI 体系完成；这是 shared Ant Drawer focused change。

## P9 增量：Shared Ant Empty fallback readability

目标：SourceLens 核心产品空态继续优先使用 `StateBlock`；Ant `Empty` 仅作为 app 内部组件或 Select dropdown portal 的兜底空态。该 fallback 的 description 和 footer action 不得在窄屏被裁切、省略或低可读。

验收要求：

- `.sl-app-shell .ant-empty` 与 `.ant-select-dropdown .ant-empty` 必须保持 `max-width:100%`、`min-width:0`、`margin-inline:0` 和 `overflow:visible`。
- `.ant-empty-description` 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `.ant-empty-footer` 必须允许 flex wrap，避免 fallback 恢复动作在窄屏挤压或裁切。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 Empty fallback description/footer 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap`。
- 既有 raw Ant `Empty` 禁用策略必须保留：核心页面、表格和产品状态面不得用 raw `Empty` 替代 `StateBlock`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核，runtime `Schrodinger / 019f3241-edee-7e63-ba43-e3fa822df7c8`；确认 StateBlock 边界保留，未新增 raw Empty 使用。

非范围：

- 不新增任何页面 raw Ant `Empty` 使用。
- 不改变现有 `StateBlock` 空态、表格 emptyText、Select 选项数据、查询逻辑或 API。
- 不替代页面级错误态、恢复动作或 redaction smoke。
- 不改变页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant Empty fallback focused change。

## P9 增量：Shared Ant Menu and Dropdown readability

目标：SourceLens 左侧主导航、移动端抽屉导航和右上角用户 Dropdown 是进入核心链路的固定入口；这些入口的导航标签、分组标题和账号动作不得因为长文本、翻译扩展、权限动作扩展或窄屏被裁切、省略或横向溢出。

验收要求：

- 展开态 `.sl-sider`、`.sl-mobile-nav` 和 `.ant-dropdown` 内 Menu/Dropdown 容器必须保持 `max-width:100%`、`min-width:0` 和 `overflow:visible`。
- Menu item、submenu title、dropdown item 必须支持自适应高度和 `white-space:normal`，避免长导航项被固定行高裁切。
- `.ant-menu-title-content`、`.ant-menu-item-group-title` 和 `.ant-dropdown-menu-title-content` 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- icon 必须保持固定尺寸，不被长标签挤压。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 Menu/Dropdown label 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。
- 桌面折叠侧栏不得被本轮规则强行展开；规则只覆盖展开侧栏、移动菜单抽屉和 Dropdown portal。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核，runtime `Hegel / 019f324d-bd3f-7d80-bf41-cccda0cd42f6`；确认 collapsed sider 未被误伤，路由/权限/退出动作/菜单结构未改变。

非范围：

- 不改变路由、权限、认证、用户菜单动作、移动菜单开关逻辑或菜单数据结构。
- 不新增页面、不调整信息架构、不重做 sidebar 视觉品牌。
- 不改变 Dropdown 的触发方式、placement 或账号退出逻辑。
- 不声明全站 UI 体系完成；这是 shared Ant Menu/Dropdown focused change。

## P9 增量：Shared Ant Tooltip, Popover and Popconfirm readability

目标：SourceLens 使用 Tooltip 说明图标动作，使用 Popconfirm 承载删除、取消、禁用、创建 PR 等高价值确认；这些 portal 弹层必须在 320/390 窄屏内可读，不能裁切风险摘要、确认描述、路径、证据和确认按钮。

验收要求：

- `.ant-tooltip` 与 `.ant-popover` 必须限制为 `max-width: calc(100vw - 24px)`。
- `.ant-tooltip-inner`、Popover title/content、Popconfirm message/text/description 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- Popconfirm message 必须 `align-items:flex-start`，避免 icon 与多行确认文案错位。
- Popconfirm buttons 必须允许 flex wrap；按钮 label 必须可换行，不得在窄屏挤压或裁切。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 Tooltip/Popover/Popconfirm 文案回退到 `nowrap`、`ellipsis`、`overflow:hidden`，同时拒绝任意 scoped Popconfirm buttons 或 button label 回退到 no-wrap、ellipsis 或 hidden。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Banach / 019f3257-62e0-75b3-ad28-632a0777b18e`；首次复核 PARTIAL 后已补强 scoped Popconfirm button override 门禁，二轮确认 PASS。

非范围：

- 不改变 Tooltip/Popover/Popconfirm 的触发方式、确认/取消逻辑、placement、业务判断或 API。
- 不改变 AutoRepair PR Popconfirm 的 evidence gate、submit-pr 阻断、取消行为或 focused PATCH_READY smoke 合同。
- 不改变路由、权限、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant Tooltip/Popover/Popconfirm focused change。

## P9 增量：Shared Ant Message and Notification readability

目标：SourceLens 使用 Ant `message` / `notification` 展示登录、创建、删除、复制、API 错误和恢复反馈；这些 portal 反馈必须在 320/390 窄屏内可读，不能裁切后端错误、请求 ID、恢复动作或操作结果。

验收要求：

- `.ant-message` 与 `.ant-notification` 必须限制为 `max-width: calc(100vw - 24px)`。
- message notice 与 notification notice 必须保持 `max-width:100%` 和 `min-width:0`。
- `.ant-message-notice-content`、`.ant-message-custom-content`、notification message/description 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- message/notification icon 必须固定尺寸，不被长错误挤压。
- notification action 区必须允许 flex wrap。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 Message/Notification 文案回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 notification action `flex-wrap:nowrap`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 只读复核，runtime `Sagan / 019f3263-5d52-7280-9a95-e3efcd95839c`；确认 API 错误格式、AgentChat redaction、触发位置和业务文案未改变。

非范围：

- 不改变 message/notification 的触发位置、持续时间、业务文案、API 错误格式、redaction 策略或请求逻辑。
- 不新增 notification 业务流程。
- 不改变路由、权限、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant Message/Notification focused change。

## P9 增量：Shared Ant Progress readability

目标：SourceLens 在 Dashboard、Projects、ProjectDetail、ScanTaskDetail、ExecutionTasks、AgentTasks 和 AutoRepairs 中使用 Ant `Progress` 表达扫描、任务、修复、报告质量和健康度；进度条必须在窄屏和密集卡片内可收缩，进度文本不得被裁切、省略或挤压。

验收要求：

- `.sl-app-shell .ant-progress` 必须保持 `max-width:100%` 和 `min-width:0`。
- `.ant-progress-line` 必须使用可收缩 flex 布局，并从顶部对齐进度文本。
- `.ant-progress-outer` 与 `.ant-progress-inner` 必须保持可收缩，不撑破卡片、表格或详情面板。
- `.ant-progress-line .ant-progress-text` 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝任意 scoped Progress text 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，覆盖 13 个核心路由、1440/390/320 三视口和无横向溢出。
- PASS：雷军 / Product Design + 扎克伯格 / Frontend Engineer 二轮只读复核，runtime `Einstein / 019f326c-33c0-7a51-838a-cebd09a401da`；首次复核 PARTIAL 后已补强任意 scoped progress text override 门禁，二轮确认 PASS。

非范围：

- 不改变任何 progress 百分比计算、状态映射、颜色、动画、showInfo 配置或业务逻辑。
- 不改变 Dashboard、Projects、ScanTaskDetail、ExecutionTasks、AgentTasks、AutoRepairs 的数据请求或状态判断。
- 不改变路由、权限、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant Progress focused change。

## P9 增量：Shared Ant Timeline readability

目标：SourceLens 的执行任务、Agent 步骤、AutoRepair 尝试和扫描治理链路依赖 Timeline 承载状态、错误、证据和下一步；这些内容必须在密集卡片和 320/390 窄屏中可读，不能被裁切、省略或横向撑破。

验收要求：

- `.sl-app-shell .ant-timeline` 和 `.ant-timeline-item` 必须保持 `max-width:100%` 与 `min-width:0`。
- `.ant-timeline-item-content` 与 `.ant-timeline-item-label` 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- timeline marker 和 tail 必须保持稳定尺寸，不被长步骤说明挤压。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝任意 scoped Timeline label/content 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，`APP_SHELL_UI_SMOKE_OK`，13 个核心路由、1440/390/320 三视口和 `no-horizontal-overflow` 均通过。
- PASS：拉里佩奇 / QA Engineer + 雷军 / Product Design 只读复核，runtime `James / 019f327c-31c2-73c2-8682-14207c2131b5`；确认 CSS/validator/raw output safety/document boundary 均合格。

非范围：

- 不改变 TaskTimeline 的 raw output safety notice、步骤数据、状态映射、图标、顺序、AutoRepair attempt 逻辑、治理时间线聚合、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant Timeline focused change。

## P9 增量：Shared Ant Input readability

目标：SourceLens 的仓库 URL、分支、路径、token、搜索词、过滤条件和数值输入分布在项目管理、报告、审计、PR 审查、CI 诊断、Agent 和 AutoRepair 主链路；Input 系列控件必须在密集表单、弹窗、工具栏和 320/390 窄屏中可收缩，不得撑破布局、裁切 prefix/suffix/addon 或挤压搜索动作。

验收要求：

- `.sl-app-shell` 内 `Input`、`TextArea`、`Input.Search`、`InputNumber`、affix wrapper、group wrapper、number wrapper 必须保持 `max-width:100%` 与 `min-width:0`。
- affix wrapper、search wrapper 和 number affix wrapper 不得裁切 prefix、suffix 或搜索动作。
- prefix、suffix、Input addon 和 InputNumber addon 必须可收缩，可换行显示长单位、提示和动作标签，不得挤压真实编辑控件。
- search action button 必须允许长标签换行，不得在窄屏裁切。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝 Input 容器关闭 width containment、容器/affix/addon 裁切、addon 文案回退到 `nowrap` 或 `ellipsis`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，`APP_SHELL_UI_SMOKE_OK`，13 个核心路由、1440/390/320 三视口和 `no-horizontal-overflow` 均通过。
- PASS：拉里佩奇 / QA Engineer + 雷军 / Product Design 二轮只读复核，runtime `Epicurus / 019f3284-bb57-7d22-83f8-7da9cc6e46d3`；首轮 PARTIAL 要求补强编辑行为保护、search action 防回退和 scoped addon 门禁，修复后二轮 PASS。

非范围：

- 不改变真实 input、password、number、textarea 的编辑文本行为、输入值、placeholder、表单校验、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant Input focused change。

## P9 增量：Shared Ant Typography readable text

目标：SourceLens 的标题、状态、说明、证据摘要、任务描述和治理说明大量使用 Ant Typography；普通文本必须在卡片、详情、表格外层和窄屏中可读，不能被默认单行、省略号或 hidden 裁切。但业务显式使用 `.ant-typography-ellipsis` 的表格列和局部单元格策略必须保留。

验收要求：

- `.sl-app-shell .ant-typography` 必须保持 `max-width:100%` 与 `min-width:0`。
- 非 `.ant-typography-ellipsis` 的普通 Typography 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- inline `code` 和 `pre` 既有可读性规则必须继续保留。
- `validate-frontend-ui.mjs` 必须锁住以上规则，并拒绝非 `.ant-typography-ellipsis` Typography 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，`APP_SHELL_UI_SMOKE_OK`，13 个核心路由、1440/390/320 三视口和 `no-horizontal-overflow` 均通过。
- PASS：拉里佩奇 / QA Engineer + 雷军 / Product Design 二轮只读复核，runtime `Harvey / 019f328f-a17d-7731-865b-3127671858f9`；首轮 BLOCK 要求修复 Typography specificity 和 validator `:not(.ant-typography-ellipsis)` 漏检，修复后二轮 PASS。

非范围：

- 不改变表格列、模型 URL、审计/产物单元格等显式业务级 `.ant-typography-ellipsis` 策略。
- 不改变 Typography 组件 DOM、文案内容、路由、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant Typography readable text focused change。

## P9 增量：Shared Ant Table readability / ellipsis boundary

目标：SourceLens 的项目、扫描任务、执行任务、Agent 任务、审计日志、产物、CI、PR、Issue 和模型配置都依赖 Table 承载主链路信息；Table 必须在 app shell、卡片和窄屏内可收缩，横向滚动必须受控，同时不能破坏业务显式 ellipsis 的路径、ID、URL、密钥和紧凑列策略。

验收要求：

- `.sl-app-shell` 内 Table wrapper、table、container、content、body 和 spin 容器必须保持 `max-width:100%` 与 `min-width:0`。
- `.ant-table-content` 与 `.ant-table-body` 必须承担 `overflow-x:auto`，避免 Table 撑破页面主体。
- 非 `.ant-table-cell-ellipsis` 的 Table cell 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- 显式 `.ant-table-cell-ellipsis` 不得被共享 Table 规则强行改成换行、clip 或 visible overflow。
- `validate-frontend-ui.mjs` 必须锁定以上规则，并拒绝 Table cell containment、非 ellipsis cell wrapping、ellipsis boundary 和 app-shell browser smoke marker 回退。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make app-shell-ui-smoke`，`APP_SHELL_UI_SMOKE_OK`，13 个核心路由、1440/390/320 三视口、`shared-table-non-ellipsis-cell-wraps-without-clipping`、`shared-table-ellipsis-cell-preserves-ellipsis` 和 `no-horizontal-overflow` 均通过。
- PASS：拉里佩奇 / QA Engineer + 雷军 / Product Design 只读复核，runtime `Herschel / 019f329f-0c16-72e0-8eac-a11e77252eb4`；确认 containment、non-ellipsis wrap、ellipsis boundary、fixed column / scroll.x 边界和 validator `:not(...)` 防误判均合格。

非范围：

- 不改变任何 Table columns、dataSource、rowKey、pagination、row selection、onRow、emptyText、scroll.x、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不改变显式 `ellipsis: true` 列、`.ant-table-cell-ellipsis`、模型 URL/密钥、审计 ID、产物 owner/type 等业务局部省略策略。
- 不声明全站 UI 体系完成；这是 shared Ant Table focused change。

## P9 增量：Shared Ant Radio readability

目标：SourceLens 的 DependencyGraph 视图切换和后续模式/治理筛选可能使用 Ant Radio/Radio.Button；Radio 选项必须在 action row、dense card 和 320/390 窄屏中完整可读，不能被裁切、省略或横向撑破。

验收要求：

- `.sl-app-shell` 内 Radio group、Radio wrapper 和 Radio button wrapper 必须保持 `max-width:100%` 与 `min-width:0`。
- Radio group 必须允许 wrap，避免多个选项或长标签造成页面横向溢出。
- Radio wrapper、Radio button wrapper 和 Radio button label span 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal`、`word-break:break-word` 和 visible overflow。
- Radio icon/button control 必须保持稳定尺寸，不被长标签挤压。
- `validate-frontend-ui.mjs` 必须锁定以上规则，并拒绝 shared Radio 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap`。
- `p9-main-path-recoverable-error-states-batch4b` smoke 必须在 DependencyGraph 成功恢复后，把 Radio.Button 标签替换为长 token，并证明 1440px 与 320px 下不裁切、不造成横向溢出。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make p9-main-path-recoverable-error-states-batch4b-ui-smoke`，覆盖 DependencyGraph 1440/320 双视口、mocked-only recoverable error retry、`graphRadioLabelWrapsWithoutClipping` 和 `graphRadioGroupContained`。

非范围：

- 不改变 DependencyGraph 视图切换逻辑、Mermaid 导出、图谱数据、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant Radio focused change。

## P9 增量：Shared Ant Collapse readability

目标：SourceLens 的 AutoRepair、报告详情、审计详情和后续治理面板会用 Collapse 承载日志、证据、错误、路径和可展开详情；Collapse header/content 必须在密集卡片、action row 和 320/390 窄屏中完整可读，不能被裁切、省略或横向撑破。

验收要求：

- `.sl-app-shell` 内 Collapse root、item、content 和 content box 必须保持 `max-width:100%`、`min-width:0` 和 visible overflow。
- Collapse header 必须支持多行 label，保持 `height:auto`、`white-space:normal`、visible overflow 和可收缩。
- Expand icon 必须保持固定尺寸，不被长 header label 挤压。
- Header text、extra 和内部 Space 必须支持 wrap，避免长日志标题、路径、证据摘要和 action 文案被裁切。
- Collapse content box 必须支持 `overflow-wrap:anywhere`、`text-overflow:clip`、`white-space:normal` 和 `word-break:break-word`。
- `validate-frontend-ui.mjs` 必须锁定以上规则，并拒绝 shared Collapse 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap`。
- `patch-ready-ui-smoke` 必须在 AutoRepair 详情中打开日志 Collapse，把 header 替换为长 token，并证明 1440px、390px 与 320px 下不裁切、不横向溢出。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make patch-ready-ui-smoke`，`PATCH_READY_UI_SMOKE_OK` 包含 `layoutDensity.logCollapseContained=true` 和 `mobileReadability.logCollapseHeaderNotClipped=true`。

非范围：

- 不改变 AutoRepair 日志内容、LogViewer 脱敏策略、DiffViewer 脱敏策略、PR 创建门禁、执行任务 attempt 逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema 或 GitHub App。
- 不声明全站 UI 体系完成；这是 shared Ant Collapse focused change。

## P6 增量：Code QA common URI citation noise filter

目标：Code QA citation audit 必须只把回答正文中的可见源码证据引用计入可信引用；常见 URI 内复制出来的 `[C1]`、`[C99]` 不能把未引用回答伪装成 grounded，也不能污染 invalid citation 统计。

验收要求：

- `ftp:`、`sftp:`、`ssh:`、`git:`、`file:`、`mailto:`、`data:`、`blob:`、`javascript:`、`vscode:` 和 `idea:` URI 内的 citation-like token 必须在 `citedLabels(...)` 前被过滤。
- 正文源码路径引用，例如 `src/AuthService.java validates token [C1]`，必须仍保持可审计。
- fake-only 场景必须保持 `groundingStatus=UNVERIFIED`、`citationEnforcementStatus=RETRY_FAILED`、`citedByAnswer=false`。
- 正文有效引用 + URI 噪声混合场景必须保持 `DIRECT_VERIFIED`，且 URI 内 `[C99]` 不进入 invalid citation。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，70 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Mendel the 2nd / 019f32cb-b195-70c1-9335-1879702055ff`；指出测试覆盖缺少部分 scheme，已补齐 `sftp/ssh/blob/vscode/idea` 后重新跑测试通过。

非范围：

- 不实现完整 URL/URI parser。
- 不改变 citation 语法、API/DTO、DB schema、检索排序、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 citation trust focused change。

## P6 增量：code_chunks CONFIG role-intent recall

目标：SourceLens 的代码问答和代码检索必须能定位运行配置问题，例如 CORS、`application.yml`、datasource、环境变量和 Spring Boot runtime config；同时不能回退到 `code_chunks.content LIKE`，也不能把普通前端“配置页”问题误判成后端运行配置。

验收要求：

- `CodeChunkRanker.roleIntentTypes(...)` 必须把运行配置语义识别为 `CONFIG`，覆盖 `CORS`、`application.yml`、datasource、环境变量、数据库配置和 runtime/server/spring config。
- 英文泛化 `config/configuration/configs` 只有同时出现 runtime/server/backend/spring/database/db/mysql/port/security/jwt/credential 等运行上下文时才可触发 `CONFIG`。
- `model config page button`、`ModelConfig page` 和中文“模型配置页按钮”不得触发 `CONFIG`。
- `CodeChunkService` 的 `CONFIG` role intent 查询只能基于 `file_path`，覆盖 `/config/`、`/src/main/resources/`、`application.yml`、`application.yaml`、`application.properties`、`.env`、`.yml`、`.yaml`、`.properties`。
- focused 后端测试必须证明 README / frontend config page 噪声干扰时，`application.yml` 能通过 role-intent 被补召回且 SQL 不出现 `content LIKE`。

验证结果：

- PASS：`mvn -Dtest=CodeChunkServiceTest test`，103 tests, 0 failures, 0 errors。
- PARTIAL -> FIXED：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Tesla the 2nd / 019f32d8-496b-7ee0-a54f-8b0950d719df`；指出英文 `config` 触发过宽，已收窄并补 `model config page button` / `ModelConfig page` 负例后复测通过。

非范围：

- 不恢复全文 `content LIKE`。
- 不实现完整语义检索或仓库级配置知识图谱。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks role-intent focused change。

## P6 增量：code_chunks TEST / DOCUMENTATION role-intent recall

目标：SourceLens 的代码问答和代码检索必须能定位测试文件与项目文档，例如 `AuthServiceTest.java`、Playwright spec、README、docs 和 runbook；同时继续保持 `content LIKE` 禁用，避免把“测试一下接口”“测试按钮”“用户上传 document 文件”误召回为测试或项目文档。

验收要求：

- `CodeChunkRanker.evidenceType(...)` 必须优先把 `/test/`、`/tests/`、`*Test*`、`*Spec*` 判为 `TEST`，避免 `AuthServiceTest.java` 被文件名中的 `Service` 先判成 `SERVICE`。
- `TEST` intent 只覆盖测试文件、测试用例、单元测试、集成测试、回归测试、冒烟测试、Playwright/JUnit/Surefire/spec/test file 等测试定位语义。
- `latest`、`contest`、`protest`、中文“测试一下登录接口”和“登录页测试按钮”不得触发 `TEST`。
- `DOCUMENTATION` intent 只覆盖 README、CHANGELOG、docs、runbook、项目文档、接口文档、部署/运行/设计/说明文档等项目文档定位语义。
- `document parser service`、`uploaded document file`、`document file parser` 和中文“用户上传 document 文件”不得触发 `DOCUMENTATION`。
- `CodeChunkService` 的 `TEST` / `DOCUMENTATION` role intent 查询只能基于 `file_path`，不得恢复 `content LIKE`。
- focused 后端测试必须证明 source/docs 噪声下测试文件可补召回，source/config 噪声下 README 可补召回。

验证结果：

- PASS：`mvn -Dtest=CodeChunkServiceTest test`，107 tests, 0 failures, 0 errors。
- PARTIAL -> FIXED：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Wegener the 2nd / 019f32e5-27aa-7381-96e8-a3e8a9356c42`；指出 `endsWith(test)` 与 `document file` 误召回口子，已收窄并补负例后复测通过。

非范围：

- 不恢复全文 `content LIKE`。
- 不实现完整文档语义分类器或测试覆盖图谱。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks role-intent focused change。

## P6 增量：code_chunks search/count consistency for auxiliary recall

目标：Code Chunk 搜索接口的 `total` / `truncated` / evidence profile 必须与实际返回候选一致；当 role/path/method/evidence 辅助召回能返回测试、文档、配置或定位候选时，`countSearchMatches(...)` 不能仍只按 keyword `file_path LIKE` 返回 0，导致页面出现 `total=0` 但 `items>0` 的矛盾状态。

验收要求：

- 普通关键词查询必须继续走 `selectCount` 快路径，不能把所有查询都放大为多次 `selectList`。
- 存在 role/path/method/evidence 辅助召回信号时，`countSearchMatches(...)` 必须复用与 `searchChunks(...)` 相同的候选池来源，并按 `chunkKey` 去重计数。
- 辅助召回 count 路径不得恢复 `content LIKE`。
- focused 后端测试必须证明普通关键词仍走快路径，且 TEST role-intent 场景下 keyword 候选为空时 count 能包含 role 候选。

验证结果：

- PASS：`mvn -Dtest=CodeChunkServiceTest test`，109 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Kepler the 2nd / 019f32f1-84df-7111-ac88-c0be256fcf29`；确认普通查询快路径、辅助召回一致性、无 `content LIKE` 和性能上限均合格。

非范围：

- 不改变搜索接口 DTO schema。
- 不实现全量精确数据库 count；辅助召回 count 仍受候选池上限保护。
- 不改变 API 路由、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks search metadata consistency focused change。

## P6 增量：code_chunks endpoint route hint recall

目标：SourceLens 的代码检索必须支持用户直接用接口路径定位源码，例如 `/api/auth/login`、`http://localhost:8080/api/auth/login?...` 或带 endpoint/接口上下文的 `/login`；同时不能回退到 `code_chunks.content LIKE`，也不能把 source URL、本机绝对路径或普通文件路径误判成接口路径。

验收要求：

- `CodeLocationHintParser.endpointRouteHints(...)` 必须提取 `/api/...`、`/graphql`、`/vN/...` 强接口路径。
- 普通 `/login` 只有在存在 endpoint/接口/路由等上下文时才可作为 route hint。
- `http://localhost:5173/src/pages/ProjectDetail.tsx?...`、`/Users/...` 和无 route 上下文的 `/login` 不得触发 route hint。
- `CodeChunkService` 的 endpoint route candidate pool 只能基于 `file_path` 补召回 controller/api 文件，不得恢复 `content LIKE`。
- `CodeChunkRanker` 可以在内存排序阶段用已取回 chunk 的 content 判断接口路径命中，并优先排序真正声明该 route 的 Controller。
- focused 后端测试必须证明纯 `/api/auth/login` 能补召回目标 Controller，且 SQL 不出现 `content LIKE`。

验证结果：

- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，173 tests, 0 failures, 0 errors。
- PASS：focused tests：`mvn -Dtest=CodeChunkServiceTest#searchChunks_shouldAppendEndpointRouteCandidatesWhenQueryIsOnlyApiPath,com.sourcelens.module.analysis.service.CodeLocationHintParserTest#endpointRouteHints_shouldExtractApiRoutesWithoutTreatingSourcePathsAsRoutes test`，2 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Hume the 2nd / 019f3314-23bd-74c3-ad9c-2028c803c625`；确认没有引入 DB 侧 `content LIKE`，候选池有上限，关键正负例已覆盖。

非范围：

- 不实现完整 HTTP route graph。
- 不解析 Spring class-level + method-level route composition。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks endpoint route hint focused change。

## P6 增量：code_chunks Spring composed route recall

目标：SourceLens 的代码检索必须能识别常见 Spring 组合路由，例如 `@RequestMapping("/api/auth")` + `@PostMapping("/login")` 对应 `/api/auth/login`；同时不能把两个无父子关系的方法级 mapping 误拼成接口，也不能回退到 `code_chunks.content LIKE`。

验收要求：

- `CodeChunkRanker` 必须在同一 chunk 内识别 class-level `@RequestMapping(prefix)` + method-level mapping suffix。
- prefix mapping 必须出现在 class/interface/record 声明前；suffix mapping 必须出现在类声明后。
- `@GetMapping("/api/auth")` + `@PostMapping("/login")` 不得被误组合。
- 方法级 `@RequestMapping("/api/auth")` + 后续 `@PostMapping("/login")` 不得被误组合。
- `/api/auth/login` 查询下，组合 route Controller 必须能排在 exact API client 前。
- endpoint route 查询不得恢复 `content LIKE`。

验证结果：

- PASS：route focused tests，4 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，176 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 三轮只读复核，runtime `Raman the 2nd / 019f331b-f358-7c10-8f9e-57e1ec6c5715`；首轮 PASS 但指出轻微风险，二轮 `PARTIAL` 要求补方法级 `@RequestMapping` 负例，已修复后三轮 PASS。

非范围：

- 不实现完整 Spring route resolver。
- 不做跨 chunk route composition。
- 不展开跨 segment wildcard、复杂 path regex、`PathVariable` 类型约束或 Spring meta-annotation；单 segment `{id}` path variable template recall 已进入当前能力边界。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks Spring route composition focused change。

## P6 增量：code_chunks Spring path variable route template recall

目标：SourceLens 的 endpoint route 检索必须能把具体 URL 路径与常见 Spring 单段路径变量模板对齐，例如 `/api/users/42` 命中 `@GetMapping("/api/users/{id}")`，也能命中 `@RequestMapping("/api/users") + @GetMapping("/{id}")`。

验收要求：

- direct template route 必须支持单段 `{id}` 占位。
- class-level prefix + method-level `{id}` suffix 必须支持组合模板匹配。
- segment count 不一致不得误命中，例如 `/api/users/42/details` 不得命中 `/api/users/{id}`。
- prefix mapping 仍必须在 class/interface/record 声明前，避免方法级 `@RequestMapping` 误当 class prefix。
- endpoint route 查询不得恢复 `content LIKE`。

验证结果：

- PASS：route template focused tests，4 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，179 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 二轮只读复核，runtime `Jason the 2nd / 019f332c-44c7-7920-88bf-b492fcf71b52`；首轮 `PARTIAL` 指出文档边界和 composed template SQL 断言缺口，已修复后二轮 PASS。

非范围：

- 不实现完整 Spring route resolver。
- 不做跨 chunk route composition。
- 不展开跨 segment wildcard、复杂 path regex、`PathVariable` 类型约束或 Spring meta-annotation。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks path variable route template focused change。

## P6 增量：code_chunks Spring path variable template specificity ranking

目标：当多个 Spring path variable 模板同时匹配同一个具体 endpoint 时，SourceLens 必须优先返回更具体的 Controller。例如 `/api/users/42` 应优先命中 `/api/users/{id}`，而不是 `/api/{resource}/{id}`。

验收要求：

- route template specificity 必须按 literal segment 高于 path variable segment 排序。
- `/api/users/{id}` 必须优先于 `/api/{resource}/{id}`。
- segment count mismatch 仍不得命中。
- composed template route 的 class boundary 不得回退。
- endpoint route 查询不得恢复 `content LIKE`。

验证结果：

- PASS：route template specificity focused tests，4 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，180 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Erdos the 2nd / 019f3334-90bc-7f12-b387-1f41f7753fd9`。

非范围：

- 不实现完整 Spring route resolver。
- 不实现 exact literal route vs path-variable template 的全量细粒度比较。
- 不做跨 chunk route composition。
- 不展开跨 segment wildcard、复杂 path regex、`PathVariable` 类型约束或 Spring meta-annotation。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks route template ranking focused change。

## P6 增量：code_chunks exact Spring route priority over path-variable template

目标：当 exact literal Spring route 和 path-variable template 同时匹配同一个 endpoint 时，SourceLens 必须优先返回 exact Controller。例如 `/api/users/me` 应优先命中 `@GetMapping("/api/users/me")`，而不是 `@GetMapping("/api/users/{id}")`。

验收要求：

- exact Spring literal route 必须优先于 path-variable template。
- frontend API client 中的 exact string 不得抢走后端 exact Controller。
- `/api/users/{id}` 优先于 `/api/{resource}/{id}` 的规则不得回退。
- composed route 必须限制在同一个 class 范围内，不得跨同一 chunk 的多个 class 误组合。
- endpoint route 查询不得恢复 `content LIKE`。

验证结果：

- PASS：exact-vs-template focused tests，5 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，183 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 二轮只读复核，runtime `Feynman the 2nd / 019f333a-f098-71d3-83f2-69941b8aa1bc`；首轮 `PARTIAL` 指出多 class 跨类组合风险，已修复后二轮 PASS。

非范围：

- 不实现完整 Spring route resolver。
- 不解析 annotation 多属性、数组 mapping 或非首个字符串 literal。
- 不做跨 chunk route graph。
- 不展开跨 segment wildcard、复杂 path regex、`PathVariable` 类型约束或 Spring meta-annotation。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks exact route ranking focused change。

## P6 增量：code_chunks Spring mapping annotation value/path multi-literal route parsing

目标：SourceLens 必须识别 Spring mapping annotation 中非首个 route 字符串，例如 `@GetMapping(name="currentUser", value="/api/users/me")` 和 `@GetMapping(path={"/internal/users/me", "/api/users/me"})`；同时不能把 `name/produces/headers/params` 等非 route 属性误当 endpoint。

验收要求：

- 隐式 value、`value`、`path` 字符串 literal 可作为 route。
- `value/path` 不在第一个字符串位置时仍可命中。
- `path` 或 `value` 数组中的后续 route literal 可命中。
- `name`、`produces`、`consumes`、`headers`、`params` 等非 route 属性不得作为 route。
- class-level + method-level composed route 必须支持多属性写法，并继续遵守 same-class boundary。
- endpoint route 查询不得恢复 `content LIKE`。

验证结果：

- PASS：Spring mapping multi-literal focused tests，8 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，191 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 三轮只读复核，runtime `Kuhn the 2nd / 019f3343-b1df-7690-8755-add59741fb9d`；前两轮 `PARTIAL` 分别指出非 route 属性和数组属性漏洞，已修复后三轮 PASS。

非范围：

- 不实现完整 Java annotation parser。
- 不解析常量 route、SpEL、转义字符串或嵌套 annotation。
- 不做跨 chunk route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks Spring mapping parser focused change。

## P6 增量：code_chunks same-chunk Spring route constants

目标：SourceLens 必须识别同一 chunk 内的简单 Spring route 常量。例如 `private static final String USER_ME = "/api/users/me"; @GetMapping(USER_ME)` 应能响应 `/api/users/me` 查询。

验收要求：

- 同一 chunk 内简单 `String NAME = "/route"` 常量可参与 direct route matching。
- class-level + method-level 常量 route 可组合，并继续遵守 same-class boundary。
- `name` / `produces` 等非 route 属性引用 route-looking 常量不得误命中。
- 不解析跨文件常量、字符串拼接、常量表达式、SpEL 或非 String 常量。
- endpoint route 查询不得恢复 `content LIKE`。

验证结果：

- PASS：Spring route constant focused tests，6 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，195 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Einstein the 2nd / 019f334e-e4b9-77e3-968f-0421463710a7`。

非范围：

- 不实现完整 Java constant resolver。
- 不解析跨文件常量、字符串拼接、常量表达式、SpEL、复杂转义或非 String 常量。
- 不做跨 chunk route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks same-chunk route constant focused change。

## P6 增量：code_chunks same-chunk simple Spring route concatenation

目标：SourceLens 必须识别同一 chunk 内简单 route 常量和字符串 literal 的 `+` 拼接。例如 `@GetMapping(USER_ROOT + "/me")` 应能响应 `/api/users/me` 查询；`@RequestMapping(path = API_ROOT + "/users")` 可继续与 method-level mapping 组合。

验收要求：

- 只在隐式 value、`value`、`path` 位置解析 route 拼接。
- 完整可解析拼接 route 可作为一个整体进入 exact/template matching。
- 拼接表达式内部的常量和字符串片段不得被额外注册为独立 Spring route。
- 无法完整解析的拼接表达式不得部分命中，例如 `USER_ROOT + dynamicSuffix()` 不得让 `/api/users` 作为强 route。
- `produces` 等非 route 属性中的拼接不得作为 endpoint。
- Controller 中普通 route-looking 字符串常量不得作为强 endpoint route 压过前端 exact API 字符串。
- endpoint route 查询不得恢复 `content LIKE`。

验证结果：

- PASS：Spring route concatenation focused tests，7 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，202 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Huygens the 2nd / 019f3354-e5f1-78b3-b9a1-2751407122a9`；复核建议补 Controller 普通常量显式保护测试，已补并通过。

非范围：

- 不实现完整 Java constant-expression resolver。
- 不解析跨文件常量、方法调用、复杂表达式、SpEL、复杂转义或非 String 常量。
- 不做跨 chunk route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks same-chunk simple route concatenation focused change。

## P6 增量：code_chunks same-chunk Spring route constant expressions

目标：SourceLens 必须识别同一 chunk 内简单 String route 常量链。例如 `API_ROOT="/api"; USER_ROOT=API_ROOT + "/users"; CURRENT=USER_ROOT + "/me"; @GetMapping(CURRENT)` 应能响应 `/api/users/me` 查询。

验收要求：

- 同一 chunk 内简单 `String NAME = quoted route literal` 仍可解析。
- 同一 chunk 内简单 `String NAME = OTHER_ROUTE + "/suffix"` 或 `"/prefix" + OTHER_ROUTE` 可在完整解析时进入 route constants。
- 解析必须 fail-closed：任何片段不是 quoted literal 或已解析 constant 时，不得把已解析片段作为 route。
- 常量表达式最终必须以 `/` 开头才可作为 route。
- `value/path` 属性引用常量表达式可命中；`produces/name` 等非 route 属性引用常量表达式不得命中。
- 解析必须有界，不允许循环常量导致无限循环。
- endpoint route 查询不得恢复 `content LIKE`。

验证结果：

- PASS：Spring route constant-expression focused tests，6 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，206 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Goodall the 2nd / 019f3366-79cf-7a52-abd5-560075ece19b`。

非范围：

- 不实现 class/member scope Java resolver。
- 不解析跨文件常量、方法调用、复杂表达式、SpEL、复杂转义或非 String 常量。
- 不做跨 chunk route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks same-chunk route constant-expression focused change。

## P6 增量：code_chunks Spring route constant class-scope isolation inside a chunk

目标：当同一 code chunk 内出现多个 Spring Controller class 且存在同名 route 常量时，SourceLens 必须把 mapping annotation 绑定到关联 class 的常量范围，避免跨 class 常量污染导致 endpoint false positive。

验收要求：

- class-level `@RequestMapping(path = USER_ROOT)` 必须读取其后关联 class 范围内的 `USER_ROOT`。
- method-level `@GetMapping(USER_ME)` 必须读取所在 class 范围内的 `USER_ME`。
- 后续 class 中的同名常量不得覆盖前一个 class 的 route mapping。
- 如果无法确定 class range，不得回退到整个 chunk 常量表。
- class 声明查找必须跳过注释和字符串中的 fake `class`。
- mapping annotation 与 class declaration 之间允许 whitespace、注释、额外 annotation 和 modifier。
- 该能力不得恢复 DB 侧 `content LIKE`。

验证结果：

- PASS：Spring route constant scope focused tests，9 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，213 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 三轮只读复核，runtime `Cicero the 2nd / 019f336e-ffb1-7380-9c8e-85b808452572`；前两轮 `PARTIAL` 指出 whole-content fallback 和 fake class scanner 风险，已修复后三轮 PASS。

非范围：

- 不实现完整 Java parser。
- 不解析 nested/inner class 精确 scope、跨文件常量、方法调用、复杂表达式、SpEL、复杂转义或非 String 常量。
- 不做跨 chunk route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks same-chunk route constant scope focused change。

## P6 增量：code_chunks Kotlin Spring route constants

目标：SourceLens 必须识别 Kotlin Spring Controller 在同一 class chunk 内声明的简单 route constants，例如 `const val API_ROOT = "/api"`、`val USER_ME: String = API_ROOT + "/users/me"` 和 `@GetMapping(USER_ME)`。

验收要求：

- Java 和 Kotlin route constant 名称必须支持大写标识符，例如 `API_ROOT`、`USER_ME`。
- Kotlin `const val` 和 `val` route constant 必须支持可选 `: String` 类型标注。
- Kotlin route constant 表达式必须继续使用 bounded literal/constant `+` 解析，无法完整解析时 fail-closed。
- annotation 内常量引用必须支持大写标识符。
- 只允许隐式 value、`value`、`path` 位置产生 route；`produces`、`name` 等非 route 属性不得成为 endpoint。
- 该能力不得恢复 DB 侧 `content LIKE`。

验证结果：

- PASS：Kotlin/Spring route constant focused tests，6 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，219 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 二轮只读复核，runtime `Banach the 2nd / 019f337c-980b-7ac1-9df5-dc677cb86bad`；首轮 `BLOCK` 指出 Kotlin/Java 大写常量、`: String` 和 parser-level 覆盖缺口，已修复后二轮 PASS。

非范围：

- 不实现 Kotlin AST 或 Java/Kotlin compiler-level constant resolver。
- 不解析 Kotlin string templates、top-level constants、跨文件 constants、import/static import constants、函数调用、复杂表达式、条件表达式或方法返回。
- 不支持 Kotlin array/bracket mapping 内的复杂拼接表达式。
- 不做跨 chunk route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks Kotlin Spring route constants focused change。

## P6 增量：code_chunks Spring value/path array route expressions

目标：SourceLens 必须识别 Spring mapping `value/path` 数组里的简单 route 表达式，例如 Java `@GetMapping(path = { USER_ROOT + "/me", "/status" })` 和 Kotlin `@GetMapping(value = [USER_ROOT + "/me"])`。

验收要求：

- `value/path = { ... }` 和 `value/path = [ ... ]` 必须按数组元素提取 route expression。
- 数组元素里的 `USER_ROOT + "/me"` 必须作为整体解析为完整 route。
- 拼接表达式内部的 `USER_ROOT`、`"/me"`、`"/api/users"` 不得被额外注册为独立 endpoint。
- `produces`、`name` 等非 route 属性中的数组常量不得进入 route matching。
- SQL 边界必须继续断言不含 `content LIKE`。

验证结果：

- PASS：Spring route array-expression focused tests，5 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，222 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Hubble the 2nd / 019f338d-db8e-7ba2-a096-53d0dccbbc71`。

非范围：

- 不支持 shorthand 数组拼接，例如 `@GetMapping({ USER_ROOT + "/me" })`。
- 不做 nested arrays 深层 route 展开。
- 不实现完整 Java/Kotlin annotation AST。
- 不解析 Kotlin string templates、方法调用、枚举、外部类限定名、数组变量引用或复杂表达式。
- 不做跨 chunk route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks Spring route array expressions focused change。

## P6 增量：code_chunks Spring shorthand array route expressions

目标：SourceLens 必须识别 Java Spring mapping implicit value shorthand array 中的简单 route 表达式，例如 `@GetMapping({ USER_ROOT + "/me", "/status" })`。

验收要求：

- 无 `=` 的 mapping 参数如果是 `{...}` 或 `[...]` 数组，必须按数组元素提取 route expression。
- shorthand array 内 `USER_ROOT + "/me"` 必须作为整体解析为完整 route。
- 拼接表达式内部的 `USER_ROOT`、`"/me"`、`"/api/users"` 不得被额外注册为独立 endpoint。
- 该能力不得恢复 DB 侧 `content LIKE`。

验证结果：

- PASS：Spring shorthand array route-expression focused tests，6 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，225 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Russell the 2nd / 019f3394-f7e6-77b1-9993-7e2d32e17987`。

非范围：

- 不做 nested arrays 递归展开。
- 不实现完整 Java/Kotlin annotation AST。
- 不解析 Kotlin string templates、方法调用、运行时表达式、三元表达式、collection constants、跨文件常量、meta-annotation、alias/import alias。
- 不做跨 chunk route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks Spring shorthand array route expressions focused change。

## P6 增量：code_chunks previous same-file chunk Spring route context

目标：SourceLens 必须在 endpoint route 查询中利用候选集中前一个同文件 chunk 的 class-level route context，解决 class-level `@RequestMapping` 和 method-level mapping 被切到相邻 chunks 后无法组合的问题。

验收要求：

- 只有存在 endpoint route hint 时才启用 previous same-file context ranking。
- 只使用候选池中同文件、`startLine` 更早的前一个 chunk，不主动额外查 DB。
- 合成内容只参与 `score(...)`，返回结果必须仍是原始 current chunk。
- `@RequestMapping("/api/users")` 在前一个 chunk、`@GetMapping("/{id}")` 在当前 chunk 时，`/api/users/42` 查询应把当前 method chunk 排第一。
- 前一 prefix chunk + 当前 unrelated `@GetMapping("/summary")` 不得误命中 `/api/users/42`。
- SQL 边界必须继续断言不含 `content LIKE`。

验证结果：

- PASS：previous same-file route context focused tests，4 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，227 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Gibbs the 2nd / 019f339d-e605-7aa2-96d0-d5a25ee81bd3`。

非范围：

- 不主动查 DB 拉取 prefix chunk；prefix 不在候选池时不解决。
- 不支持 prefix 在后一个 chunk 的反向合成。
- 不实现完整 chunk adjacency graph。
- 不实现跨文件 route graph 或完整 Spring AST/route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks previous same-file route context focused change。

## P6 增量：code_chunks previous same-file route context candidate pull

目标：SourceLens 必须在 endpoint route 查询中受限拉取候选集中 current method chunk 的前一同文件 chunk，解决初始候选池缺少 class-level route prefix 时 previous context ranking 无法组合的问题。

验收要求：

- 只有存在 endpoint route hint 时才执行 previous context candidate query。
- previous context query 必须是单次 bounded query，不能变成每个候选一次的 N+1 查询。
- context seeds 最多取前 32 个，查询 LIMIT 必须受 `RANKING_CANDIDATE_MAX_LIMIT` 保护。
- previous context query 只能用 `scan_task_id`、`file_path = ...` 和 `start_line < ...` 等结构字段，不得使用 `content LIKE`。
- 初始候选池只有 current method chunk 时，previous context query 拉回 class prefix chunk 后，`/api/users/42` 查询应把 current method chunk 排第一。
- 非 endpoint 查询不得额外触发 previous context query。

验证结果：

- PASS：previous context candidate pull focused tests，3 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，228 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Curie the 2nd / 019f33a7-c7e9-7dc1-8003-ec9e56aa9278`。

非范围：

- 不支持 prefix 在 current method 后面的 chunk。
- 不支持跨文件 route graph。
- 不保证多段 previous chain。
- 不保证 prefix 超出前 32 个 seeds 或 previous query LIMIT 后仍被拉回。
- 不实现完整 chunk adjacency graph 或 Spring AST/route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 code_chunks previous context candidate pull focused change。

## P6 增量：code_chunks endpoint search count context boundary

目标：SourceLens 必须区分“用于搜索/QA 排序的 previous same-file context candidates”和“用户可见搜索总数里的真实匹配候选”，避免 endpoint route 搜索 total 被 context-only class prefix chunk 虚增。

验收要求：

- `searchChunks(...)` 继续使用 previous same-file context candidates，以保留 endpoint route ranking 增强。
- `listRetrievalCandidates(...)` 继续使用 previous same-file context candidates，以保留 QA citation retrieval 的 route context。
- `countSearchMatches(...)` 在 auxiliary search hint 场景不得执行 previous context query。
- endpoint count 场景仍不得恢复 `content LIKE`。
- `/api/users/42` 这类 endpoint 查询中，只有 current method chunk 命中时，count 应为 1，不把 previous class prefix chunk 计入 total。

验证结果：

- PASS：endpoint search count context boundary focused tests，2 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，229 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Nietzsche the 2nd / 019f33b1-0f38-7ae1-8f65-22e95c3fb2a4`。

非范围：

- 不改变 search result item ranking。
- 不改变 QA retrieval candidate context。
- 不新增 API/DTO schema 或 DB schema。
- 不实现完整 route graph。
- 不刷新 full release authority。
- 不改变 role/path/method/evidence/endpoint auxiliary candidate 的计数策略。

## P6 增量：code_chunks nearest previous same-file context candidate pull

目标：SourceLens 在 endpoint route 查询中拉取 previous same-file context 时，必须优先保留离 current method chunk 最近的前置 chunk，降低大文件场景下 LIMIT 被过早 chunk 占满导致 class-level route prefix 丢失的风险。

验收要求：

- 只调整 `listPreviousSameFileContextCandidates(...)` 的 previous context query 排序。
- previous context query 必须按 `start_line DESC` nearest-first，再按 `file_path ASC` 稳定排序。
- `listMethodAnchorCandidates(...)`、`listPathSuffixHintCandidates(...)`、`listEvidenceFilePathAnchorCandidates(...)`、`listEndpointRouteCandidates(...)` 不得被误改排序策略。
- 不恢复 `content LIKE`。
- count 边界保持：`countSearchMatches(...)` 仍不得触发 previous context query。

验证结果：

- PASS：nearest previous context focused tests，2 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，229 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Volta the 2nd / 019f33ba-e848-7ef2-9c89-558ba6eb7a38`；复核建议补充 `file_path ASC` 断言，已处理并重跑通过。

非范围：

- 不实现 per-seed fair top-N。
- 不实现完整 chunk adjacency graph。
- 不支持跨文件 route graph、后向 chunk、多段 previous chain 或完整 Spring AST/route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 previous context nearest-first focused change。

## P6 增量：code_chunks bounded previous same-file context window

目标：SourceLens 在 endpoint route 查询中必须能利用最多 3 个 previous same-file chunks 作为 scoring context，解决 class-level route prefix 与 method-level mapping 之间被字段、构造器或注释 chunk 隔开的场景。

验收要求：

- 只有 endpoint route hint 存在时才启用 previous same-file context window。
- window 最多包含 3 个 previous same-file chunks。
- previous chunks 必须按同文件 startLine 顺序拼接到 current chunk 前面，只用于 scoring。
- 返回结果必须仍是原始 current chunk，不改变 id/filePath/endLine/embedding。
- class prefix 在前前 chunk、中间 chunk 无 route、method mapping 在当前 chunk 时，`/api/users/42` 查询应把 current method chunk 排第一。
- 超过 3 个 previous chunks 时，过早的 class prefix 不应参与 current method scoring context。
- 不恢复 DB 侧 `content LIKE`。

验证结果：

- PASS：bounded previous context window focused tests，4 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，231 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Parfit the 2nd / 019f33c1-c3d2-7d12-9cf2-625949475d76`；复核建议补充超过 3 个 previous chunks 的窗口上限测试，已处理并重跑通过。

非范围：

- 不主动扩大 DB 查询 LIMIT。
- 不支持超过 3 个 previous chunks。
- 不支持后向 chunk、跨文件 route graph、多文件 controller 或完整 Spring AST/route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 bounded previous context window focused change。

## P6 增量：code_chunks bounded previous-context candidate pull window

目标：SourceLens 在 endpoint route 查询中拉取 previous same-file context candidates 后，必须将候选池与 ranker 的 3-chunk context window 对齐，避免远早于 current method 的 context-only chunk 混入搜索结果或 QA evidence 候选。

验收要求：

- `listPreviousSameFileContextCandidates(...)` 仍只在 endpoint route hint 存在时触发。
- context seeds 最多 32 个。
- previous context DB query 不得使用 `content LIKE`。
- previous context DB query 仍按 `start_line DESC` nearest-first，再按 `file_path ASC` 稳定排序。
- DB 返回 previousCandidates 后，每个 seed 最多保留 3 个同文件、`previous.startLine < seed.startLine` 的 previous candidates。
- `countSearchMatches(...)` 仍不得触发 previous context query。
- DB 返回 4 个 previous chunks 时，最早的 prefix chunk 不应进入 search result candidate pool，最近 3 个 filler chunks 应保留。

验证结果：

- PASS：bounded previous-context candidate pull focused tests，4 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，232 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Galileo the 2nd / 019f33ca-d47b-7692-8c6a-babfe25a175e`。

非范围：

- 不实现 per-seed SQL top-N。
- 不改变 ranker 3-chunk scoring window。
- 不支持跨文件 route graph、后向 chunk、多文件 controller 或完整 Spring AST/route graph。
- 不改变 API/DTO、DB schema、前端 UI、LLM provider、release evidence schema 或 GitHub App。
- 不刷新 full release authority；这是 P6 bounded previous-context candidate pull focused change。

## P6 增量：code_chunks search visible result context boundary

目标：SourceLens endpoint route 搜索必须区分“用于 ranking 的 previous context candidates”和“返回给前端的 visible search items”，避免 previous-context-only chunks 混入搜索结果，造成 items 与 count 语义不一致。

验收要求：

- `searchChunks(...)` 必须先取 primary candidates。
- `searchChunks(...)` 可合并 previous context candidates 用于 route scoring。
- `searchChunks(...)` 最终 visible results 必须只保留 primary candidate keys。
- previous context-only classPrefix/filler chunks 不应返回给前端 search items。
- current method chunk 仍可借助 previous context 排第一。
- `listRetrievalCandidates(...)` 仍必须保留 previous context candidates，用于 QA retrieval/citation context。
- `countSearchMatches(...)` 仍必须通过 `listSearchCandidates(..., false)` 排除 previous context candidates。

验证结果：

- PASS：search visible context boundary focused tests，3 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，232 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Carson the 2nd / 019f33d2-2b7b-7b72-8abd-f66388e87ea7`。

非范围：

- 不改变 QA retrieval context candidate 行为。
- 不改变 API/DTO schema 或 DB schema。
- 不改变 ranker 3-chunk scoring window。
- 不刷新 full release authority；这是 P6 search visible result context boundary focused change。

## P6 增量：Code QA fallback PRIMARY citation boundary

目标：SourceLens Code QA 在 fallback answer 中必须优先引用 PRIMARY evidence，避免相邻上下文排在 retrieved chunks 前面时被误标为主引用。

验收要求：

- `fallbackCitedAnswer(...)` 和 `fallbackCitedLabels(...)` 必须共用同一个 PRIMARY-first selector。
- 当 retrieved chunks 中存在 PRIMARY evidence 时，fallback answer 必须引用 PRIMARY 的 source label。
- 当 retrieved chunks 中没有 PRIMARY evidence 时，fallback 才可退回第一条有 source label 的证据。
- 未配置 LLM 的 adjacent-first 场景必须引用 C2 PRIMARY，而不是 C1 ADJACENT_CONTEXT。
- LLM 调用失败的 adjacent-first 场景必须引用 C2 PRIMARY，而不是 C1 ADJACENT_CONTEXT。
- fallback citation note 必须描述“优先引用 PRIMARY 证据”，不能继续说“首条可用证据”。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，71 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，339 tests, 0 failures, 0 errors。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Linnaeus the 2nd / 019f33dc-6d10-7270-aa1a-48978f0deb5a`；复核建议补齐 LLM error adjacent-first 测试和 note 文案，已处理并重跑通过。

非范围：

- 不改变 retrieval ranking、context expansion、DTO schema、DB schema、LLM retry strategy、前端 UI、release evidence schema 或 GitHub App。
- 不证明所有未来 PRIMARY 标记都正确；本轮只收口 fallback citation 选择边界。

## P6 增量：Code QA claim-aware citation enforcement

目标：SourceLens Code QA 引用强制不能只看“答案全局出现了有效 PRIMARY label”，还必须确认每条需要证据的代码事实 claim 已逐条引用有效 PRIMARY-bound 证据。

验收要求：

- `DIRECT_VERIFIED` 必须同时满足 `groundingStatus == VERIFIED` 与 `claimCitationCoverage(answer, chunks).status == READY`。
- `RETRY_VERIFIED` 必须同样满足 claim-level READY，不能只凭 retry answer 里出现了有效 label。
- `DIRECT_VERIFIED` / `RETRY_VERIFIED` 必须要求 required claims 全部 PRIMARY-bound，且 required context-only / unknown-only claim 为 0。
- 首次答案只有末尾 `Sources: [C1]`、事实句本身没有引用时，必须触发 citation retry。
- citation retry 修正后，只有事实句带上有效引用时才允许 `RETRY_VERIFIED`。
- citation retry 返回 null/blank 时，不得用空答案覆盖原答案；必须保留原答案并标记 `RETRY_FAILED`。
- claim 只引用 `ADJACENT_CONTEXT`，但 footer 单独引用 PRIMARY 的答案不得通过 verified enforcement。
- 现有 semicolon、numbered、bullet、transition、markdown table 拆分 claim 的 `REVIEW` 用例不得继续 `DIRECT_VERIFIED`。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，75 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，343 tests, 0 failures, 0 errors。
- Security 只读复核 PASS；QA/Data-AI 首轮 PARTIAL 后已按建议补齐，二轮复核待回填。

非范围：

- 不改变 retrieval ranking、context expansion、DTO schema、DB schema、prompt injection guard、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- 不实现完整自然语言事实验证器；claim coverage 仍是 bounded heuristic。

## P6 增量：Code QA primary-bound citation retry prompt

目标：SourceLens Code QA 的 citation retry prompt 必须与 PRIMARY-bound enforcement 规则一致，不能只给 LLM 一个裸 label 列表。

验收要求：

- retry prompt 必须列出可用证据标签、角色和文件，例如 `[C1] role=PRIMARY file=...`。
- retry prompt 必须明确每条需要证据的具体代码事实至少引用一个 PRIMARY 标签。
- retry prompt 必须明确 `ADJACENT_CONTEXT` 只能作为补充引用，不能作为具体代码事实的唯一引用。
- retry prompt 必须明确 PRIMARY 证据不足时要说明证据不足，不能用 context 冒充主证据。
- 测试必须捕获第二次 LLM call 的 retry prompt，并断言上述 primary/context 规则存在。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，75 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，343 tests, 0 failures, 0 errors。
- QA/Data-AI 只读复核已启动，结论待回填。

非范围：

- 不改变 verified enforcement gate、retrieval ranking、context expansion、DTO schema、DB schema、prompt injection guard、LLM provider、前端 UI、release evidence schema 或 GitHub App。
- prompt 不是安全边界；真实可信度仍由后端 enforcement 与 claim coverage 决定。

## P6 增量：Code QA citation enforcement failure note precision

目标：Code QA 在 `RETRY_FAILED` 时必须给出可操作、可区分的失败原因，帮助用户和前端判断是证据缺失、标签无效、claim 未逐条引用，还是 claim 只绑定 context/unknown evidence。

验收要求：

- `NO_EVIDENCE` 仍直接提示没有可引用证据。
- invalid label / unknown label 必须优先于泛化 grounding partial 提示，不能被误诊为“未引用 PRIMARY”。
- pure `ADJACENT_CONTEXT` claim 必须提示“只绑定 ADJACENT_CONTEXT，未绑定 PRIMARY 证据”。
- `UNKNOWN`-only claim 必须提示“只绑定 UNKNOWN 证据，未绑定 PRIMARY 证据”。
- uncited required claim 必须提示“缺少逐条有效引用”。
- 没有可审计具体代码事实 claim 时必须单独提示人工复核。
- 测试必须覆盖 invalid label note、pure context-only note、retry null/blank uncited note、context claim + footer primary note。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，75 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，343 tests, 0 failures, 0 errors。
- QA/Data-AI 首轮只读复核 PARTIAL，runtime `Noether the 2nd / 019f33fa-38ba-7083-a110-47f4397c6088`；指出 failure note priority 与测试断言缺口。
- QA/Data-AI 二轮只读复核 PASS，runtime `Darwin the 2nd / 019f33fe-79a0-7d03-937f-c43a2b143bf7`。

非范围：

- 不改变 `DIRECT_VERIFIED` / `RETRY_VERIFIED` gate。
- 不新增 DTO schema、前端 UI、DB schema、LLM provider、release evidence schema 或 GitHub App。
- 不实现完整语义蕴含验证器；failure note 只解释当前 heuristic gate 的失败原因。

## P6 增量：Code QA citation enforcement reason code

目标：为 Code QA 引用强制结果增加稳定机器可读诊断字段 `citationEnforcementReason`，避免前端、smoke 和 verifier 依赖中文 `citationEnforcementNote` 做程序判断。

验收要求：

- `CodeQaResponse` 必须返回 optional `citationEnforcementReason`。
- `citationEnforcementStatus` 与 `citationEnforcementNote` 必须保持兼容，不得改变既有 gate。
- 成功路径必须能输出 `DIRECT_VERIFIED`、`RETRY_VERIFIED`、`FALLBACK_PRIMARY_CITED`。
- retry failure 路径必须能输出 `INVALID_LABEL`、`CONTEXT_ONLY_CLAIM`、`UNCITED_REQUIRED_CLAIM` 等稳定原因。
- 默认无引用强制路径必须输出 `NOT_APPLICABLE`。
- 前端类型必须接收该字段，且不强制老响应必须存在该字段。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，75 tests, 0 failures, 0 errors。
- PASS：`mvn -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkServiceTest,CodeChunkControllerTest,com.sourcelens.module.analysis.service.CodeLocationHintParserTest test`，343 tests, 0 failures, 0 errors。
- PASS：`npm --prefix web-console run build`。
- PASS：拉里佩奇 / QA Engineer + 梁文峰 / Data-AI Engineer 只读复核，runtime `Epicurus the 2nd / 019f3408-d30d-7302-9a27-e22086083b90`。

非范围：

- 不改 AutoRepair 放行逻辑。
- 不做前端 UI 文案展示改造。
- 不做 release verifier 强校验接入。
- 不改 DB schema、LLM provider 或 GitHub App。

## P6/P9 增量：Project QA citation enforcement reason UI and smoke marker

目标：把 `citationEnforcementReason` 从 API 类型接入 Project QA 前端状态、可信度摘要、低置信度面板和 smoke marker，让 citation enforcement 失败原因具备稳定 UI/测试证据。

验收要求：

- `web-console/src/api/project.ts` 的 `CodeQaResponse` 必须保留 `citationEnforcementStatus`、`citationEnforcementReason`、`citationEnforcementNote`。
- `ProjectDetail.tsx` 的 `QaMessage` 和 QA assistant message state 必须承接 `citationEnforcementReason`。
- Project QA 顶部证据标签必须展示机器 reason code；低置信度面板必须展示中文 reason label。
- `qaTrustSummary(...)` 必须把 reason 纳入检查项，但不得把失败 reason 当成 ready 证据。
- `project-qa-low-confidence-smoke.spec.ts` 必须覆盖 `DIRECT_VERIFIED`、`NO_EVIDENCE`、`NO_VALID_CITATION_LABEL`、`UNCITED_REQUIRED_CLAIM`。
- smoke marker 必须输出 `citationEnforcementReasons`，且每个 viewport 的 proof 必须证明 reason codes covered。
- `validate-frontend-ui.mjs` 必须同时锁定 API 类型、ProjectDetail 消费链路和 smoke marker。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make project-qa-low-confidence-ui-smoke`，1 test passed，marker 包含 `citationEnforcementReasons=["DIRECT_VERIFIED","NO_EVIDENCE","NO_VALID_CITATION_LABEL","UNCITED_REQUIRED_CLAIM"]`。
- PARTIAL then PASS：扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 首轮只读复核，runtime `Heisenberg the 2nd / 019f3411-9e41-7111-bb66-3e74c6ebd1ca`，指出 validator 缺 API 类型层显式正则；已补齐并重跑通过。二轮只读复核 runtime `Aristotle the 2nd / 019f3417-bb93-7303-b9dc-8a1f7c7f2a7d`，确认首轮必须修正项已关闭，结论 PASS。

非范围：

- 不改变后端 `DIRECT_VERIFIED` / `RETRY_VERIFIED` enforcement gate。
- 不改变 AutoRepair 放行逻辑。
- 不做 release verifier hard gate 接入。
- 不改 DB schema、LLM provider 或 GitHub App。

## P6/P11 增量：Code QA citation enforcement reason release evidence gate

目标：把 `citationEnforcementReason` 纳入 release evidence 和 verifier hard gate，让 public repo UI 与 report evidence QA citation marker 都能证明成功 citation enforcement 的机器原因码。

验收要求：

- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.citationEnforcementReasons` 必须非空。
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.citationEnforcementReasons` 必须非空。
- `verify-release-evidence.sh` 只允许成功 reason：`DIRECT_VERIFIED`、`RETRY_VERIFIED`、`FALLBACK_PRIMARY_CITED`。
- `security-regression-check.sh` 的有效 public repo UI payload 与有效 report evidence QA marker payload 必须带合法 reason。
- 手写 forged marker 样本必须带合法 reason，避免被缺字段提前拒绝，继续验证原目标伪造点。
- `validate-frontend-ui.mjs` 必须静态锁定 smoke marker、verifier allowlist 和 security payload 三层 reason 合同。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh`。
- PASS：`bash -n scripts/security-regression-check.sh`。
- PASS：`npm --prefix web-console run build`。
- PASS：`make report-evidence-qa-citation-ui-smoke`，2 tests passed，marker 包含 `citationEnforcementReasons=["DIRECT_VERIFIED"]`。
- PASS：`make security-regression-release-verifier-public-repo-ui-marker`，Security regression checks passed。
- PARTIAL then PASS：黄仁勋 / DevOps Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Hilbert the 2nd / 019f34ba-4489-7142-9815-1b0356f72828`；首轮指出 security valid QA marker payload 与 validator verifier/security 静态门禁缺口，已补齐并二轮 PASS。

非范围：

- 不改变后端 verified/retry enforcement gate。
- 不改变 AutoRepair 放行逻辑。
- 不刷新 full release authority。
- 不处理 GitHub App、私有仓库、多用户协作或完整语义事实验证器。

## P6/P11 增量：Project QA recoverable reason marker proof

目标：Project QA recoverable smoke 必须证明成功 QA 响应的 `citationEnforcementReason` 已进入页面状态和 marker，避免只依赖 `citationEnforcementStatus` 或“引用已验证”文案。

验收要求：

- `project-qa-recoverable-smoke.spec.ts` 的 `qaPayload(...)` 必须返回 `citationEnforcementReason: DIRECT_VERIFIED`。
- mock POST `/api/projects/{projectId}/qa` 必须收集 response payload，用于 marker 聚合 reason codes。
- QA 重试恢复成功后必须断言页面可见 `原因码 DIRECT_VERIFIED`。
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.answerReadability.citationEnforcementReasons` 必须包含 `DIRECT_VERIFIED`。
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.answerReadability.directVerifiedReasonVisible` 必须为 true。
- `validate-frontend-ui.mjs` 必须锁定 mock response、UI 断言、reason 聚合和 marker 字段。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make project-qa-recoverable-ui-smoke`，1 test passed，marker 包含 `answerReadability.citationEnforcementReasons=["DIRECT_VERIFIED"]`。
- PASS：扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Plato the 2nd / 019f3505-5846-7a83-a272-2ad7806d5e0e`。

非范围：

- 不改变后端 Code QA enforcement gate。
- 不改变 AutoRepair 放行逻辑。
- 不接入 release verifier hard gate。
- 不声明真实 LLM provider、真实模型质量、完整语义事实验证或 full release authority refresh。

## P9/P11 增量：Scan report evidence profile and trace map readability

目标：扫描报告主页面的证据契约、报告章节追踪和报告证据抽屉交接包必须在窄屏保持完整可读，不能用省略、单行强制或裁切隐藏证据、来源、路径和动作含义。

验收要求：

- `.sl-report-evidence-item span/strong/p` 必须可换行，拒绝 `ellipsis`、`nowrap`、`overflow:hidden`、`line-clamp`。
- `.sl-report-trace-card` 的 label/value/source/detail 必须可换行，拒绝 `ellipsis`、`nowrap`、`overflow:hidden`、`line-clamp`。
- `.sl-report-trace-card p` 必须显式声明 `overflow: visible`、`text-overflow: clip`、`white-space: normal`、`word-break: break-word`。
- 320px 下报告证据抽屉必须把 content wrapper 收窄到 viewport 内，handoff head 单列，handoff summary 不横向越界。
- `report-evidence-drawer-smoke.spec.ts` 必须断言 evidence profile 与 trace map 的 text not clipped/no horizontal overflow，并在 marker 输出 `evidenceProfileTraceMapReadability`。
- `validate-frontend-ui.mjs` 必须锁定 CSS 与 smoke marker，防止上述区域回退。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make report-evidence-drawer-ui-smoke`，2 tests passed，marker 包含 `evidenceProfileTraceMapReadability`、`mobile390Covered=true`、`narrow320Covered=true`、`textNotClipped=true`、`noHorizontalOverflow=true`，并证明 `handoffSummaryContained=true`。
- PARTIAL then PASS：扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Confucius the 2nd / 019f3513-30a3-7472-9ff5-1c0c8b24bf65`；首轮指出 static gate 未系统拦截 `overflow:hidden/line-clamp` 和 trace detail，已补齐并二轮 PASS。

非范围：

- 不声明全站 UI 完成。
- 不改变后端扫描、QA、AutoRepair、release verifier 或 LLM provider。
- 不刷新 full release authority；本轮 smoke 为 mocked API 证据。

## P9/P10/P11 增量：Scan report API/DB table evidence field readability

目标：扫描报告 API/DB 表格中的 `路径`、`Controller`、`文件` 是证据字段，必须完整可读、展示层脱敏、可回归验证，不得再通过业务级 `ellipsis` 隐藏。

验收要求：

- API 表格 `路径` 列不得使用 `ellipsis: true`。
- API 表格 `Controller` 列不得使用 `ellipsis: true`。
- DB 表格 `文件` 列不得使用 `ellipsis: true`。
- 三列必须使用 `.sl-report-table-evidence-text` 包装，并调用 `redactReportEvidenceText(value || '-')` 做展示层脱敏。
- `.sl-report-table-evidence-text` 必须 `overflow: visible`、`overflow-wrap: anywhere`、`text-overflow: clip`、`white-space: normal`、`word-break: break-word`。
- report evidence drawer smoke 必须用长 API route、长 Controller 类名和长 DB file path 作为 mock 数据。
- smoke 必须在 1440、390、320 视口证明 `apiPathVisible`、`apiControllerVisible`、`dbFileVisible`、`textNotClipped`、`noHorizontalOverflow`。
- `validate-frontend-ui.mjs` 必须拒绝三列回退到 `ellipsis: true`，并锁定 smoke marker `reportApiDbTableReadability`。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make report-evidence-drawer-ui-smoke`，2 tests passed，marker 包含 `reportApiDbTableReadability`，且 `apiPathVisible=true`、`apiControllerVisible=true`、`dbFileVisible=true`、`mobile390Covered=true`、`narrow320Covered=true`、`textNotClipped=true`、`noHorizontalOverflow=true`。
- PASS：扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Hegel the 2nd / 019f352e-8c19-7e40-ba7e-b6907b9e5ab8`。

非范围：

- 不声明源数据、数据库或后端响应已永久脱敏。
- 不声明全站 UI 完成。
- 不改变后端扫描、报告生成、QA、AutoRepair、release verifier、真实 LLM provider 或 full release authority。

## P9/P11 增量：Scan report governance timeline readability

目标：扫描报告“修复治理时间线”是报告、AutoRepair、Agent、审计和门禁原因的闭环入口，必须在窄屏完整可读，不得用省略、单行强制或裁切隐藏治理证据。

验收要求：

- `.sl-report-governance-card span/strong/p` 必须可换行，拒绝 `ellipsis`、`nowrap`、`overflow:hidden`。
- `.sl-report-governance-stage-meta span` 和 `.sl-report-governance-stage-copy p` 必须可换行，拒绝 `ellipsis`、`nowrap`、`overflow:hidden`。
- `.sl-report-governance-event strong/p` 必须可换行，拒绝 `ellipsis`、`nowrap`、`overflow:hidden`。
- smoke 必须提供长治理事件 title/detail/gate reason fixture。
- smoke 必须在 1440、390、320 视口断言治理卡片、阶段、事件标题、事件详情、门禁原因和动作按钮不裁切。
- `REPORT_EVIDENCE_DRAWER_SMOKE_OK.reportGovernanceTimelineReadability` 必须输出 visible、cardCount、stageCount、eventVisible、gateReasonVisible、mobile/narrow 覆盖、textNotClipped、noHorizontalOverflow。
- `validate-frontend-ui.mjs` 必须锁定 CSS、smoke function 和 marker，防止治理时间线可读性回退。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`CI=true make report-evidence-drawer-ui-smoke`，2 tests passed，marker 包含 `reportGovernanceTimelineReadability`，且 `visible=true`、`eventVisible=true`、`gateReasonVisible=true`、`mobile390Covered=true`、`narrow320Covered=true`、`textNotClipped=true`、`noHorizontalOverflow=true`。
- PASS：扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Lovelace the 2nd / 019f353d-fe29-7fe1-ad5b-c88b263e9950`。

非范围：

- 不声明全站 UI 完成。
- 不改变后端 governance aggregate API、AutoRepair、AgentTask、审计数据或发布证据。
- 不刷新 full release authority；本轮 smoke 为 mocked API 证据。

## P6/P10/P11 增量：Project QA -> AutoRepair reason provenance and redaction

目标：Project QA verified citation 进入 AutoRepair 候选时，机器 reason code、来源证据和安全脱敏必须形成可验证闭环，避免只传 status 或把 raw secret 通过 display/copy/audit provenance 泄漏。

验收要求：

- `ProjectDetail.tsx` 的 QA AutoRepair URL 必须传递 `citationEnforcementReason`。
- `AutoRepairsPage.tsx` 必须解析 `citationEnforcementReason` 到 draft provenance。
- `autoRepair.ts` 的 `AutoRepairProvenance` 必须包含 `citationEnforcementReason`。
- `AutoRepairs.tsx` 的 draft receipt 和 candidate provenance receipt 必须展示 redacted `Citation Reason`。
- `AutoRepairRequest.Provenance` 和 `AutoRepairService.sanitizedProvenance` 必须保留 `citationEnforcementReason`。
- `AutoRepairService.putText` 必须先执行 `SensitiveDataSanitizer.sanitize(value)`，再去控制字符和截断。
- Project QA citation card、code_chunks evidence reason、copy citation、URL handoff、browser URL、create payload 和 audit provenance 必须对 seeded raw secrets 脱敏。
- `project-qa-autorepair-candidate-smoke.spec.ts` 必须在跳转前证明 citation/card/code_chunks display 已脱敏，并在 marker 输出 `qa-citation-card-evidence-reason-redacted-before-handoff` 与 `citationEnforcementReasonBound`。
- `validate-frontend-ui.mjs` 必须锁定 reason chain、citation card redaction、copy redaction、chunk evidence reason redaction 和 smoke redaction marker。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`cd backend-spring && mvn -Dtest=AutoRepairServiceTest test`，40 tests passed。
- PASS：`CI=true make project-qa-autorepair-candidate-ui-smoke`，1 test passed，marker 包含 `citationEnforcementReasonBound=true` 和 `qa-citation-card-evidence-reason-redacted-before-handoff`。
- PASS：`git diff --check` scoped。
- PARTIAL then PASS：扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核，runtime `Euler the 2nd / 019f354a-06e3-72d1-a3e0-9a3b2fccfaa7`；首轮指出 citation card/code_chunks display 和 backend provenance redaction 缺口，已补齐并二轮 PASS。

非范围：

- 不声明全站所有 UI 面已完成 secret redaction。
- 不声明 sanitizer 能识别所有任意形态 secret。
- 不改变 AutoRepair gate、PR 创建逻辑、真实 LLM provider、GitHub App E2E 或 full release authority。

## P6/P11 增量：code_chunks hosted Markdown evidence URL disambiguation

目标：把 Markdown 文档纳入 code location hint 的可定位路径集合，让报告、README、治理文档、release evidence 里的 hosted `.md` URL 能作为强路径信号进入 code_chunks 候选排序，降低同名文档 decoy 误导 QA citation 的风险。

验收要求：

- `CodeLocationHintParser` 的 source URL suffix、source path extension、evidence source URL suffix 清理必须支持 `.md`。
- hosted Markdown URL 解析后必须去掉 `github.com`、branch 噪声和 `#Lxx` 行号/hash。
- `pathSuffixHints` 必须为 `docs/CHAIRMAN_BRIEFING.md` 生成完整路径和 basename 变体。
- `listRetrievalCandidates` 必须能把 `docs/CHAIRMAN_BRIEFING.md` 排在 `archive/docs/CHAIRMAN_BRIEFING.md` 同名 decoy 前。
- 普通 `url` / `path` 字段不得因此变成 evidence anchor；远程 URL 不得被拉取、执行或信任为外部事实源。
- focused backend tests 和 Data/AI + QA + Security review 必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`，228 tests passed。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核，runtime `Peirce the 2nd / 019f355c-59e9-7240-8b28-8415d35d9164`。

非范围：

- 不改变远程 URL 拉取策略。
- 不把普通 `url` / `path` 字段升级为 evidence anchor。
- 不声明所有文档引用语义验证完成。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks indexed file extension path hint parity

目标：让 `CodeLocationHintParser` 的强路径 hint 支持范围与 `CodeChunkFileFilter` 当前索引范围对齐，避免 `.sh/.scss/.cpp/.kts` 等已索引文件无法被 hosted URL 或路径引用稳定召回。

验收要求：

- parser 必须使用统一 indexed extension pattern，覆盖当前 `CodeChunkFileFilter.SUPPORTED_EXTENSIONS`。
- 扩展名匹配必须长扩展优先，避免 `.kts/.tsx/.scss/properties` 被短扩展截断。
- PATH suffix 扩展名后必须有边界，避免 `.hbs/.jsonnet/.cppbackup` 被误截断为 `.h/.json/.cpp`。
- 当前未索引的普通 `.json` 不得作为强路径 hint。
- hosted `.sh` URL 必须可被 normalized，并在 retrieval 排序中压过同名 archive decoy。
- focused backend tests 和 Data/AI + QA + Security review 必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`，232 tests passed。
- PASS：scoped `git diff --check`。
- PARTIAL then PASS：梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核，runtime `Dewey the 2nd / 019f3564-b1f5-7fc0-a72c-52eb9c6c5bd8`；首轮指出 `json` parity 和扩展边界问题，已补齐并二轮 PASS。

非范围：

- 不新增普通 `.json` code chunk 索引。
- 不改变远程 URL 拉取、执行或信任策略。
- 不把普通 `url` / `path` 字段升级为 evidence anchor。
- 不刷新 full release authority。

## P6/P11 增量：Code QA source evidence indexed extension path parity

目标：让 Code QA 的 `sourceEvidenceRef.filePath` 归一化范围与当前 code_chunks 已索引文件类型保持一致，避免报告证据 URL 已能检索到 chunk，但 QA citation source evidence matching 因扩展名白名单过窄而无法绑定 PRIMARY 证据。

验收要求：

- `CodeQaController.normalizeEvidencePath(...)` 必须支持当前 indexed extension 集合，覆盖 `.sh/.md/.scss/.kts` 等已索引文件。
- hosted `.sh?plain=1#L12` 证据 URL 必须能归一化并匹配 `scripts/run-backend-dev.sh`。
- 命中后响应必须保持 `sourceEvidenceMatched=true`、`sourceEvidenceMatchType=REPORT_LINE_ANCHOR`、retrieved chunk `contextRole=PRIMARY`、citation coverage `PRIMARY`、claim role distribution `PRIMARY_BOUND`。
- 普通 `.json` 仍不得被纳入 indexed source evidence parity。
- 外部 URL 不得触发远程拉取、执行或外部信任升级。
- focused backend tests 和 Data/AI + QA + Security review 必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeQaControllerTest test`，76 tests passed。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核，runtime `Newton the 2nd / 019f3570-451a-74f2-b53e-ed744ff72b00`。

非范围：

- 不新增普通 `.json` code chunk 索引。
- 不改变远程 URL 拉取、执行或信任策略。
- 不放宽 ambiguous short path fail-closed。
- 不刷新 full release authority。

## P6/P10/P11 增量：code_chunks path hint middle-contains exact-anchor hardening

目标：把 code_chunks 路径 hint 中的“中间包含”匹配从 exact anchor / PRIMARY 候选语义中移除，只保留为低可信排序信号，避免 generated/noise 路径通过 `path.contains("/" + hint)` 被错误提升为 QA citation 主证据。

验收要求：

- `pathSuffixHintScore` 与 `evidenceFilePathHintScore` 必须区分 exact、real suffix、basename、compact、middle contains 的可信度。
- compact-only 真匹配必须高于 generated/noise middle contains。
- generated/metadata 路径如果只有 middle contains 命中，必须额外降权。
- `matchesEvidencePathHint`、`matchesStrictPathHint`、`matchesMethodAnchorFileHint` 不得再把 middle contains 当成 exact anchor。
- `isExactLocationAnchorMatch` 必须拒绝 path hint middle contains 和 qualified method file hint middle contains，同时接受 real suffix。
- service-level 回归必须证明 compact target 可压过 generated/noise middle contains decoy。
- 不改变远程 URL 拉取/执行策略，不放宽短路径多命中 PRIMARY。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeLocationHintParserTest,CodeChunkRankerTest,CodeChunkServiceTest test`，240 tests passed。
- PASS：scoped `git diff --check`。
- PARTIAL / PARTIAL / PARTIAL / PASS：梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核；runtime `Godel the 2nd / 019f357e-969a-7951-83ea-81f99c765869`、`Ampere the 2nd / 019f3583-6caf-75e2-966c-a7312a1e283f`、`Ramanujan the 2nd / 019f3587-cf4f-7bd2-be5e-74a84d4e50ad`、`Archimedes the 2nd / 019f358b-9976-7f61-acb9-6924c6517e8e`；前三轮打回项均已关闭。

非范围：

- 不声明完整 monorepo package-root resolver 完成。
- 不改变候选召回 SQL 或远程 URL 行为。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks module root hint disambiguation

目标：在不引入 DB/schema 字段的前提下，把 `sourceRoot: packages/admin`、hosted source URL 里的 `apps/client/...`、以及 path suffix 中的 module root 转成有界排序信号，降低 monorepo 同名文件跨 package 错配风险。

验收要求：

- parser 必须提取 `apps/*`、`packages/*`、`services/*`、`modules/*`、`libs/*` module root hint。
- ranker 只允许仓库根部真实 module root 加权，`archive/packages/admin/...` 不得获得 module-root 强匹配。
- module-root hint 只能参与本地候选排序，不新增数据库字段、不触发远程 URL 拉取/执行。
- hosted arbitrary branch 归一化必须保持保守边界，已有 `feature/app/...`、`feature/apps/...` 降级测试不得回退。
- service-level 回归必须证明 `packages/z-admin/src/pages/Login.tsx` 压过同 suffix 的 `packages/a-customer/...` 和 `archive/packages/z-admin/...`。
- focused backend tests 和 Data/AI + QA + Security review 必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeLocationHintParserTest,CodeChunkRankerTest,CodeChunkServiceTest test`，243 tests passed。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核，runtime `Planck the 2nd / 019f3597-5d46-7943-a445-e932015943f9`；可选 service archive decoy 建议已采纳。

非范围：

- 不实现完整 monorepo workspace resolver、provider metadata resolver 或 package manager graph。
- 不改变候选召回 SQL、远程 URL 拉取、执行或外部信任策略。
- 不刷新 full release authority。

## P6/P10/P11 增量：code_chunks workspace/module root metadata persistence

目标：把 module-root 消歧从 query-time heuristic 推进到 code_chunks 持久化 metadata。新 scan 写入 `workspace_root` 与 `module_root`，检索排序优先使用持久化 root，但继续保持路径边界和 API 防泄露。

验收要求：

- Flyway V032 必须幂等新增 nullable `workspace_root`、`module_root` 和按 `scan_task_id + root + file_path` 的 lookup indexes。
- `CodeChunk` entity、multi-row insert mapper、search DTO 和 controller 必须对齐新字段。
- `chunkAndSave` 必须基于 repo-relative path 写入 root metadata，不得写入本地绝对路径。
- repo 内 symlink 指向 repo 外文件时必须被 `Path#toRealPath()` + `Path.startsWith(realRepoPath)` 拦截。
- `moduleRootFromPath` 只允许 repo-root anchored `apps/*|packages/*|services/*|modules/*|libs/*`，不得从 `archive/packages/*` 中间路径提取 root。
- ranker 使用持久化 root metadata 时必须二次校验 `filePath` 仍 anchored 于该 root。
- API 暴露 `workspaceRoot/moduleRoot` 时必须拒绝绝对路径、parent traversal 和 Windows drive path。
- focused backend tests 和 Data/AI + QA + Security review 必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeChunkRankerTest,CodeChunkServiceTest,CodeLocationHintParserTest,CodeChunkControllerTest test`，253 tests passed。
- PASS：scoped `git diff --check`。
- BLOCK -> PARTIAL -> PASS：梁文峰 / Data-AI Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核，runtime `Sagan the 2nd / 019f35a0-b19f-7b81-b0e9-cd9e83574d7e`；BLOCK/PARTIAL 项均已关闭。

非范围：

- 不回填历史 scan 的 root metadata。
- 不实现完整 package manager workspace graph 或 provider metadata resolver。
- 不刷新 full release authority。
- test profile 当前关闭 Flyway，V032 真实 MySQL/Flyway integration coverage 作为后续 P11/P12-pre 补强项。

## P11/P12-pre 增量：code_chunks root metadata schema contract gate

目标：把 root metadata persistence 的 schema/mapper/API 同步关系纳入轻量 release gate，降低 V032、H2 test schema、mapper binding、DTO 或 controller sanitizer 后续漂移的风险。

验收要求：

- H2 `schema-test.sql` 必须包含 `code_chunks.workspace_root/module_root` 和 root lookup indexes。
- 必须有 mapper schema smoke 通过真实 Spring/H2 context 调用 `CodeChunkMapper.insertBatch` 并读回 root metadata。
- DB schema contract gate 必须检查 V032 guard、nullable column、H2 schema、entity 字段、mapper column/binding、search DTO 字段、controller sanitizer、root metadata service tests 和 mapper schema smoke。
- `verify-all.sh` 必须在 backend heavy tests 前执行 DB schema contract gate。
- focused backend tests、schema gate、shell syntax、scoped whitespace、code map check 和固定岗位复核必须 PASS。

验证结果：

- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`bash -n scripts/verify-all.sh`。
- PASS：`cd backend-spring && mvn -Dtest=CodeChunkMapperSchemaTest,CodeChunkRankerTest,CodeChunkServiceTest,CodeLocationHintParserTest,CodeChunkControllerTest test`，254 tests passed。
- PASS：scoped `git diff --check`。
- PASS：`node scripts/generate-project-code-map.mjs --check` after regeneration。
- PASS：比尔盖茨 / Backend Engineer + 黄仁勋 / DevOps Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核，runtime `Nash the 2nd / 019f35b0-51a5-77d0-99d5-dd6235a5b4f2`。

非范围：

- 不声明真实 MySQL/Flyway migration smoke 已完成。
- 不把 static substring gate 当作 SQL parser。
- 不改 production migration、不做历史 scan root metadata 回填。

## P12-pre 增量：disposable MySQL Flyway migration smoke gate

目标：补齐真实 MySQL/Flyway execution coverage，证明当前 32 个 migration 可从空库执行到 v032，并校验 V032 root metadata schema。

验收要求：

- smoke 必须使用一次性 MySQL container，不污染本地固定 `sourcelens` 数据库。
- MySQL image 默认必须 digest-pinned。
- 宿主端口必须绑定 loopback 随机端口，避免固定端口冲突。
- 脚本必须有 cleanup trap，默认删除一次性 container。
- JUnit smoke 默认跳过，只有显式 env opt-in 才运行。
- JUnit smoke 必须断言 `workspace_root/module_root`、root indexes 和 `flyway_schema_history` 中 V032 成功记录。
- Makefile 必须提供明确 target。
- DB schema contract gate 必须静态锁住 smoke test、script、Make target 和 success marker。
- 真实 smoke 和固定岗位复核必须 PASS。

验证结果：

- PASS：`make mysql-flyway-smoke`，真实 MySQL 8.4 上 Flyway applied 32 migrations to v032，输出 `MYSQL_FLYWAY_MIGRATION_SMOKE_OK database=sourcelens_migration_smoke v032=true`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`bash -n scripts/mysql-flyway-migration-smoke.sh && bash -n scripts/verify-all.sh`。
- PASS：`cd backend-spring && mvn -Dtest=MySqlFlywayMigrationSmokeTest test`，默认跳过 1 个 opt-in test。
- PASS：scoped `git diff --check`。
- PASS：黄仁勋 / DevOps Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核，runtime `Ohm the 2nd / 019f35bc-9bda-72f3-9628-bb68c625182b`。

非范围：

- 不进入日常 `make verify`。
- 不刷新 full release authority。
- 不改 production migration、不跑 GitHub App/private repo/production deploy。

## P6/P10/P11 增量：code_chunks workspace root manifest scan pruning

目标：让 workspace root manifest scan 与实际 code chunk file filter 使用同一 skip dir 边界，避免依赖包、构建目录或 Git 内部 manifest 污染 root metadata。

验收要求：

- workspace manifest scan 必须在 skip dir 处 `SKIP_SUBTREE`，不能继续递归扫描其内部 manifests。
- skip dir 判断必须复用 `CodeChunkFileFilter` 的目录边界。
- 合法 monorepo root 如 `packages/admin/package.json` 必须继续生效。
- `node_modules`、`dist`、`.git` 等 skip dirs 下的 manifest 不得产生 workspace root。
- focused backend tests 和固定岗位复核必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeChunkServiceRootIndexTest,CodeChunkServiceTest,CodeChunkRankerTest,CodeLocationHintParserTest test`，247 tests passed。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`，当前 `PROJECT_CODE_MAP_OK files=578 routes=89 frontendApiCalls=79`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer + 奥特曼 / Security Engineer 只读复核，runtime `Laplace the 2nd / 019f35c3-a1cb-7091-bfc4-0d8002f6bdd5`。

非范围：

- 不重写主代码切片遍历。
- 不改变 skip dir 策略。

## P6/P10/P11 增量：code_chunks main source scan subtree pruning

目标：让主代码切片遍历与 workspace root manifest scan、`CodeChunkFileFilter` 使用同一 skip dir 边界，在目录进入前剪枝依赖、构建和 Git 内部目录。

验收要求：

- 主切片遍历必须使用 `walkFileTree + SKIP_SUBTREE`。
- `node_modules`、`dist`、`.git` 等 skip dirs 下文件不得进入 `fileFilter.shouldInclude` 热路径。
- 合法普通源码文件必须继续进入 filter 并可被切片。
- symlink 逃逸保护不得放松；默认不跟随文件 symlink 的安全策略必须被测试锁住。
- focused backend tests 和固定岗位复核必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeChunkServiceRootIndexTest,CodeChunkServiceTest,CodeChunkRankerTest,CodeLocationHintParserTest test`，248 tests passed。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`，当前 `PROJECT_CODE_MAP_OK files=578 routes=89 frontendApiCalls=79`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：比尔盖茨 / Backend Engineer + 奥特曼 / Security Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Herschel the 2nd / 019f35cb-e708-7a02-b88d-941cf859cb7f`。

非范围：

- 不改变 skip dir 策略。
- 不支持或承诺 repo 内文件 symlink 源码收录。
- 不实现完整大仓性能 benchmark。

## P6/P11 增量：code_chunks streaming source file visitor

目标：主切片扫描候选文件不再预先构建完整 `List<Path>`，改为 visitor 流式处理，为大型公开仓库降低候选路径列表内存占用。

验收要求：

- `chunkAndSave` 必须调用 visitor 入口逐个处理候选文件。
- visitor 入口必须复用 `walkFileTree + SKIP_SUBTREE` skip dir 边界。
- `walkIncludedSourceFiles` 只能作为 visitor 的列表包装 helper，避免测试和生产遍历逻辑分叉。
- 合法源码、skip dir pruning、symlink safety、repo realPath boundary 行为必须保持。
- focused backend tests 和固定岗位复核必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeChunkServiceRootIndexTest,CodeChunkServiceTest,CodeChunkRankerTest,CodeLocationHintParserTest test`，249 tests passed。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`，当前 `PROJECT_CODE_MAP_OK files=578 routes=89 frontendApiCalls=79`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`bash -n scripts/mysql-flyway-migration-smoke.sh && bash -n scripts/verify-all.sh`。
- PASS：scoped `git diff --check`。
- PASS：比尔盖茨 / Backend Engineer + 黄仁勋 / DevOps Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Kierkegaard the 2nd / 019f35d3-ca9c-7f72-b335-b6455bc4ea32`。

非范围：

- 不改变 DB 批量写入策略。
- 不声明完整端到端 streaming persistence。
- 不新增完整大仓性能 benchmark。

## P6/P11 增量：code_chunks batched chunk flush

目标：切片结果不再整任务聚合后一次性写入，而是达到 `BATCH_SIZE` 即 flush，降低大型公开仓库分析中的切片结果内存峰值。

验收要求：

- `chunkAndSave` 必须使用批次 buffer flush，不得长期保留整任务切片列表。
- 单文件和跨文件累计达到 `BATCH_SIZE` 都必须触发 flush。
- 尾批必须正确写入。
- 满批写库失败必须向外抛出，不能被文件级 catch 吞掉。
- `missingEmbeddings` 状态必须跨 flush 保留，保证 async embedding 触发条件正确。
- focused backend tests 和固定岗位复核必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeChunkServiceRootIndexTest,CodeChunkServiceTest,CodeChunkRankerTest,CodeLocationHintParserTest test`，251 tests passed。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`，当前 `PROJECT_CODE_MAP_OK files=578 routes=89 frontendApiCalls=79`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`bash -n scripts/mysql-flyway-migration-smoke.sh && bash -n scripts/verify-all.sh`。
- PASS：scoped `git diff --check`。
- PASS：比尔盖茨 / Backend Engineer + 黄仁勋 / DevOps Engineer + 拉里佩奇 / QA Engineer 第一轮 `BLOCK`，runtime `Arendt the 2nd / 019f35d8-bf69-76c3-9e6c-c7cccd73e156`；修复后同 agent 复核 `PASS`。

非范围：

- 不改变 DB schema。
- 不改变 `BATCH_SIZE`。
- 不实现跨批次事务或失败补偿。
- 不声明完整大仓性能 benchmark。

## P6/P11 增量：code_chunks batch flush failure compensation

目标：批次落库失败后清理当前 scanTask partial chunks，避免失败扫描残留半套切片污染后续检索、Code QA 和报告引用。

验收要求：

- 初始旧切片清理失败必须直接抛出，不得静默继续。
- 满批 flush 失败、尾批失败、遍历级强失败必须尝试清理当前 scanTask partial chunks。
- 失败补偿 cleanup 必须绑定当前 `scanTaskId`，不得扩大删除范围。
- cleanup 失败必须保留在原异常中，不能覆盖原始失败。
- 失败路径不得触发 async embedding。
- focused backend tests 和固定岗位复核必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeChunkServiceRootIndexTest,CodeChunkServiceTest,CodeChunkRankerTest,CodeLocationHintParserTest test`，253 tests passed。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`，当前 `PROJECT_CODE_MAP_OK files=578 routes=89 frontendApiCalls=79`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`bash -n scripts/mysql-flyway-migration-smoke.sh && bash -n scripts/verify-all.sh`。
- PASS：scoped `git diff --check`。
- PASS：比尔盖茨 / Backend Engineer + 黄仁勋 / DevOps Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Boyle the 2nd / 019f35e1-6f45-79b3-bef2-77eac814836a`。

非范围：

- 不实现完整数据库事务。
- 不改变单文件读取失败继续扫描的容错策略。
- 不实现完整 package manager workspace graph。

## P6/P10/P11 增量：code_chunks chunkAndSave fail-fast validation

目标：无效扫描任务 ID 或仓库路径必须在清理旧 chunks 前失败，避免扫描误成功或旧 code_chunks 被错误删除。

验收要求：

- `scanTaskId=null` 必须直接抛出，不得触发 DB 删除、写入或 file filter。
- 空白 `repoPath` 必须直接抛出，不得触发 DB 删除、写入或 file filter。
- 缺失路径和普通文件路径必须在旧 chunks 清理前抛出。
- `toRealPath()` 失败必须在旧 chunks 清理前抛出。
- 无效输入不得被转换成“没有生成任何代码切片”的静默成功。
- focused backend tests 和固定岗位复核必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeChunkServiceRootIndexTest,CodeChunkServiceTest,CodeChunkRankerTest,CodeLocationHintParserTest test`，257 tests passed。
- PASS：比尔盖茨 / Backend Engineer + 奥特曼 / Security Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Anscombe the 2nd / 019f35ea-259a-71e3-9376-53b0e6fbde72`。

非范围：

- 不改变单文件读取/切片失败继续扫描的容错策略。
- 不新增跨平台不稳定的权限错误 fixture。
- 不实现完整数据库事务。

## P6/P11 增量：code_chunks previous-context root metadata preservation

目标：previous same-file context 参与 endpoint route ranking 时，不得丢失 current chunk 的 root metadata，确保 monorepo 同名文件消歧持续有效。

验收要求：

- `withPreviousContext` 合成评分对象必须保留 current chunk 的 `workspaceRoot/moduleRoot`。
- 合成评分对象必须保留 current chunk 的 `id/scanTaskId/filePath/contentHash/embedding/embeddingModel/createdAt/endLine`。
- 合成评分对象的 `startLine` 可以扩展为 previous context window 起点，作为评分上下文范围。
- `sourceRoot: packages/admin` 这类 module root hint 在 previous-context route ranking 中必须优先目标 module。
- focused backend tests 和固定岗位复核必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeChunkServiceRootIndexTest,CodeChunkServiceTest,CodeChunkRankerTest,CodeLocationHintParserTest,CodeQaRetrievalServiceTest test`，295 tests passed。
- PASS：梁文峰 / Data-AI Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Pasteur the 2nd / 019f35f6-3772-7303-8ec6-bc36b1235f7a`。

非范围：

- 不改变 endpoint route scoring 权重。
- 不改变 previous context 候选拉取策略。
- 不把合成评分对象暴露为 API 证据对象。

## P9/P11 增量：app shell topbar actions containment

目标：顶部右侧 action 区域必须可收缩、可换行并保持在 topbar 内，避免挤压或裁切页面标题。

验收要求：

- `.sl-topbar-actions` 必须显式 `display:flex`、`flex-wrap:wrap`、`overflow:visible`、`max-width:100%`。
- `.sl-topbar-actions > .ant-space-item` 必须 `min-width:0` 且 `max-width:100%`。
- app-shell smoke 必须断言 `.sl-topbar-actions` 在 `.sl-topbar` 内、`flexWrap=wrap` 且 overflow 不为 hidden。
- smoke marker 必须包含 `topbar-actions-wrap-without-clipping` 和 `topbar-actions-contained`。
- frontend static validator、build、app-shell smoke 和固定岗位复核必须 PASS。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`cd web-console && npm run build`。
- PASS：`cd web-console && npm run smoke:app-shell-ui`，1 test passed，39 route-viewport visits。
- PASS：乔布斯 / Product-Frontend Lead + 扎克伯格 / Frontend Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Carver the 2nd / 019f3600-977b-7ef3-b68a-012ce439fe97`。

非范围：

- 不重做整体 UI 视觉主题。
- 不改变用户菜单业务逻辑。
- 不取消桌面用户名业务级 ellipsis 或移动端次要标签隐藏策略。

## P10/P11 增量：artifact read/preview symlink escape guard

目标：artifact raw download 和 preview 必须拒绝当前 artifact root 内的 symlink 逃逸路径，legacy fallback 不能掩盖安全拒绝。

验收要求：

- storagePath 字符串必须先限制在当前 artifact root。
- symlink artifact 必须被拒绝，不得被当作普通文件读取。
- regular file 判断必须使用 no-follow 语义。
- 真实路径解析后仍必须落在当前 artifact root 内。
- 实际 raw 全量读取必须使用 no-follow input stream。
- 实际 preview 读取必须使用 no-follow channel，并保持 128KB 截断语义。
- legacy fallback 只允许当前 artifact root 外、形态符合 `artifacts/scan_task/{ownerId}` 的历史迁移路径。
- `SCAN_TASK + legacy summary + 当前 root 内 symlink escape` 必须仍返回 `BAD_REQUEST`，且不得查询 legacy summary。
- root 内 symlink 即使指向 root 内普通文件也必须拒绝，除非后续重新设计 allowlist。
- focused backend tests 和固定岗位复核必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=ArtifactStorageServiceTest,ArtifactControllerTest test`，25 tests passed。
- PASS：固定岗位 no-follow read hardening 复核，runtime `Hooke the 2nd / 019f3616-97f7-7f52-b521-cc460c4ba392`。

非范围：

- 不实现完整文件系统沙箱。
- 不实现 artifact 加密。
- 不改变历史 moved workspace JSON fallback 的兼容目标。
- 不支持合法内部 symlink artifact。
- 不声明完整父目录级 TOCTOU 闭环。

## P6/P11 增量：Code QA HTML deleted-text citation noise filter

目标：Code QA citation audit 必须忽略 HTML 删除线/撤销文本中的 citation-like token，避免被删除的 `[C1]` 把未引用代码事实伪装成 grounded。

验收要求：

- `auditableAnswerText(...)` 必须剥离闭合 `<del>...</del>`、`<s>...</s>`、`<strike>...</strike>` 整块内容。
- deleted-text block 里的 fake citation 不得让首次回答进入 `DIRECT_VERIFIED`。
- fake-only deleted-text citation 必须触发 citation retry；retry 后可见 citation 才能进入 `RETRY_VERIFIED`。
- HTML code、Markdown link destination、blockquote、entity citation 和既有 citation noise 过滤不得回退。
- focused backend tests 和固定岗位复核必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -Dtest=CodeQaControllerTest#codeQa_shouldIgnoreCitationInsideHtmlDeletedTextAndRetry,CodeQaControllerTest#codeQa_shouldIgnoreCitationInsideHtmlStrikeTextAndRetry,CodeQaControllerTest#codeQa_shouldIgnoreCitationInsideHtmlStrikeElementAndRetry test`，3 tests passed。
- PASS：`cd backend-spring && mvn -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,LlmClientAdapterTest test`，124 tests passed。
- PASS：梁文峰 / Data-AI Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Ptolemy the 2nd / 019f361f-7b47-7902-b9be-89aa9bea0c95`。

非范围：

- 不声明完整 HTML renderer/canonicalizer。
- 不处理未闭合 deleted tag。
- 不改变 citation 标签语法、DTO/API、DB schema、LLM provider 或前端 UI。

## P10/P11 增量：artifact write symlink parent and target guard

目标：artifact 写入必须拒绝 artifact root、父目录和目标文件 symlink 造成的写入逃逸；缺失 workspace base 的正常写入不能被安全加固破坏。

验收要求：

- `storeBytes(...)` 必须在写入前创建缺失的 workspace base，并对 workspace base、`artifacts` root、owner/type 父目录逐级执行 no-follow 目录校验。
- `artifacts` root 本身是 symlink 时必须返回 `BAD_REQUEST`，不得写入目标目录。
- 中间父目录是 symlink 时必须返回 `BAD_REQUEST`，不得创建 owner/type 子目录。
- 目标文件已存在且是 symlink 时必须返回 `BAD_REQUEST`，不得覆盖 symlink 指向的外部文件。
- 目标文件已存在且是普通文件时，overwrite 语义必须保留。
- 实际写入必须使用 no-follow byte channel 打开目标文件。
- 安全边界必须明确：artifact workspace/root 是服务私有目录，不得由非服务用户写入，不得依赖可被非可信方替换的 symlink 祖先路径；当前实现不声明完整 `SecureDirectoryStream` 级 TOCTOU 闭环。
- focused backend tests、static security regression、DB schema contract、scoped whitespace 和固定岗位复核必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=ArtifactStorageServiceTest,ArtifactControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核，runtime `Pauli the 2nd / 019f3654-70b3-7b01-a61c-081209b5d374`。
- PARTIAL：奥特曼 / Security Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `McClintock the 2nd / 019f362a-5b9d-7302-a772-871aa9e88519`；BLOCK 已解除，剩余边界通过私有 artifact root 安全模型和文档记录接受。

非范围：

- 不实现完整文件系统沙箱。
- 不实现 artifact 加密。
- 不支持合法内部 symlink artifact。
- 不承诺目录句柄级 race-free 写入；若 artifact root 未来可被非服务用户写入，必须升级为 `SecureDirectoryStream`/隔离挂载/更强 storage sandbox。

## P10/P11/P12-pre 增量：production artifact workspace private-root startup gate

目标：生产环境必须在启动时校验 artifact workspace 私有目录边界，把上一轮 artifact 写入侧 TOCTOU 剩余边界从“文档要求”升级为 prod fail-closed 门禁。

验收要求：

- `SecurityStartupValidator` 只在 `prod` profile 激活时执行 artifact workspace 私有目录门禁。
- `sourcelens.workspace.base-path` 在 prod 中必须非空、已存在、不是 symlink、是目录、权限可检查且不可 group/world writable。
- `${sourcelens.workspace.base-path}/artifacts` 如果已经存在，必须同样不是 symlink、是目录、权限可检查且不可 group/world writable。
- `dev` profile 必须继续允许开发默认值和缺失生产 workspace 私有目录，不影响本地开发。
- `application-prod.yml` 路径必须能通过外部 `SOURCELENS_WORKSPACE` 注入私有目录，并通过完整 prod validator。
- focused backend tests、static security regression、scoped whitespace 和固定岗位复核必须 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=SecurityStartupValidatorTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=SecurityStartupValidatorTest,ArtifactStorageServiceTest,ArtifactControllerTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：scoped `git diff --check`。
- PASS：奥特曼 / Security Engineer + 比尔盖茨 / Backend Engineer + 拉里佩奇 / QA Engineer 只读复核，runtime `Singer the 2nd / 019f3636-5364-77a0-a30b-cd2af1437d89`。

非范围：

- 不在 prod 启动时自动创建 workspace 目录；生产目录必须由部署/运维预置并设置权限。
- 不实现完整 `SecureDirectoryStream` 级 race-free 写入。
- 不影响 dev/test profile 的本地启动便利性。

## P6/P11 增量：code_chunks HTTP method route ranking

目标：当问题或报告证据带有 `GET /api/...`、`POST /api/...` 等明确 HTTP method + route 时，code_chunks ranking 必须把 HTTP method 作为 endpoint route 的确定性附加信号，降低同一路径不同 handler 被错选的风险。

验收要求：

- `CodeLocationHintParser.endpointHttpMethodHints(...)` 只能在存在 endpoint route hint 时返回 `get/post/put/delete/patch/head/options`，普通 `get user` 或源码路径中的 `POST` 不得触发该 hint。
- `CodeChunkRanker` 的 endpoint route scoring 必须读取 method hint。
- Spring `@GetMapping/@PostMapping/@PutMapping/@DeleteMapping/@PatchMapping` 必须能声明 chunk 的 HTTP method。
- `@RequestMapping(method = RequestMethod.GET/POST/...)` 必须能声明 chunk 的 HTTP method。
- 同一路径下错误 HTTP method 的 handler 不得压过正确 HTTP method handler，即使错误 handler 文本中出现额外 method 关键词噪声。
- 同一 chunk 内无关 `@GetMapping` / `@PostMapping` 不得污染当前 route literal 的 method match。
- previous same-file context 中的无关 method mapping 不得污染当前 composed route 的 method match。
- focused backend tests 必须覆盖 parser 正/负例、ranking 正例和 QA retrieval 组合回归。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 二次只读复核，runtime `Gauss the 2nd / 019f3643-f3c1-7290-b6f4-b84fe117a698`。

非范围：

- 不实现完整 Spring route graph。
- 不解析跨文件 route 常量。
- 不做 method-level symbol graph；当前仍是 chunk-level ranking signal。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks Spring regex path variable route recall

目标：让 Spring route template parser 支持常见单段 regex path variable，例如 `@GetMapping("/api/users/{id:\\d+}")`，避免 route literal 中的 regex `+` 被误判为 Java/Kotlin 字符串拼接。

验收要求：

- `SpringRouteExpression.isConcatenation()` 只能把 quoted literal 外的 `+` 视为拼接符。
- `resolveSpringRouteExpression(...)` 必须按 quoted literal 外的 `+` 拆分表达式，不能拆开 regex literal 内的 `+`。
- `{name:regex}` 必须被视为合法 Spring path variable segment。
- `{name:}`、空变量名、包含 `/` 的 regex segment 必须 fail closed。
- 直接 `@GetMapping("/api/users/{id:\\d+}")` 和 composed `@RequestMapping("/api/users") + @GetMapping("/{id:\\d+}")` 都必须能把 `/api/users/42` 排到正确 Controller 前。
- focused backend tests、static security regression、DB schema contract、scoped whitespace 和 Data-AI review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。

非范围：

- 不执行 regex 语义匹配。
- 不支持跨 segment regex route。
- 不实现完整 Spring route graph 或 AST parser。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks RequestMapping static-import HTTP method recall

目标：让 endpoint route ranking 支持 Spring `@RequestMapping(method = GET)` 和 `@RequestMapping(method = { GET, HEAD })` 这类静态导入写法，避免同一路径不同 HTTP method handler 被错误排序。

验收要求：

- `springRequestMappingHttpMethods(...)` 必须继续支持 `RequestMethod.GET/POST/...`。
- `method = GET`、`method = { GET, HEAD }` 必须作为 route-bound HTTP method 信号参与 ranking。
- 裸 `GET/POST/...` 只能在 `method = ...` 属性表达式内识别。
- qualified array `method = { RequestMethod.GET, RequestMethod.HEAD }` 必须保持支持。
- `HEAD /api/...` 必须能匹配 `HEAD` method handler。
- quoted text 例如 `name = "GET"`、`params = "method=GET"`、`params = "x=RequestMethod.GET"` 不得污染 method 判断。
- 注释中的 `GET` 或 `method = GET` 不得污染 method 判断。
- `CodeChunkServiceTest` 必须覆盖 static-import scalar、static-import array、qualified array、HEAD query、quoted text negative case、quoted method-like attribute negative case 和 comment negative case。
- focused backend tests、static security regression、DB schema contract、scoped whitespace 和 Data-AI review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest#rank_shouldBindRequestMappingRequestMethodToMatchingRoute,CodeChunkServiceTest#rank_shouldBindStaticImportedRequestMappingMethodToMatchingRoute,CodeChunkServiceTest#rank_shouldBindStaticImportedRequestMappingMethodArrayToMatchingRoute,CodeChunkServiceTest#rank_shouldBindQualifiedRequestMappingMethodArrayToMatchingRoute,CodeChunkServiceTest#rank_shouldUseHeadRequestMethodFromStaticImportedArray,CodeChunkServiceTest#rank_shouldNotTreatQuotedRequestMappingMethodTextAsHttpMethod,CodeChunkServiceTest#rank_shouldNotTreatQuotedQualifiedRequestMappingMethodTextAsHttpMethod,CodeChunkServiceTest#rank_shouldNotTreatQuotedMethodAttributeTextAsRequestMappingMethod,CodeChunkServiceTest#rank_shouldNotTreatQuotedQualifiedMethodAttributeTextAsRequestMappingMethod,CodeChunkServiceTest#rank_shouldNotTreatCommentedRequestMappingMethodTextAsHttpMethod,CodeChunkServiceTest#rank_shouldNotTreatCommentedMethodAttributeAsRequestMappingMethod,CodeChunkServiceTest#rank_shouldNotTreatBlockCommentInsideRequestMappingMethodArrayAsHttpMethod test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 三轮只读复核，runtime `Helmholtz the 2nd / 019f365a-b3a4-79f2-94ae-29892f102973`；前两轮 `PARTIAL` 指出 quote/comment-aware method 属性扫描缺口，已修复。

非范围：

- 不解析 Java import 或自定义枚举别名。
- 不实现完整 Spring AST。
- 不支持任意常量转发、复杂表达式求值或自定义 composed annotation。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks nested Spring/Kotlin annotation argument parsing

目标：让 Spring route parser 能处理注解参数中的嵌套括号，例如 Kotlin `@RequestMapping(method = arrayOf(RequestMethod.GET), path = "/api/auth/login")`，避免在 `arrayOf(...)` 的右括号处提前截断 annotation arguments。

验收要求：

- `springMappingLiterals(...)` 只能用正则定位 annotation 起点，不能再用非贪婪正则截取完整参数。
- annotation arguments 结束位置必须通过括号深度扫描确定。
- 括号扫描必须跳过 quoted string、line comment 和 block comment。
- 未闭合 quote 或 block comment 必须保守 fail closed，不得吞掉后续代码形成假 route。
- parser 合同测试必须证明 `arrayOf(RequestMethod.GET)` 后面的 `path` 被读取。
- ranking 测试必须证明 `GET /api/auth/login` 能在 Kotlin `arrayOf(RequestMethod.GET)` 与 `arrayOf(RequestMethod.POST)` 竞争中选中 GET chunk。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest#springMappingLiterals_shouldReadRouteAfterNestedKotlinRequestMappingArrayOfMethod,CodeChunkServiceTest#rank_shouldReadRouteAfterKotlinRequestMappingArrayOfMethod test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核，runtime `Bohr the 2nd / 019f366d-0fd8-7e31-a0b7-625d2d8d1bd1`。

非范围：

- 不实现完整 Spring/Kotlin AST parser。
- 不声明覆盖所有 Kotlin raw string、复杂 annotation 表达式或 comment/string 内伪 annotation 的全部误识别场景。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks ignore Spring mappings inside comments and strings

目标：让 Spring mapping parser 忽略 quoted string、line comment 和 block comment 中的伪 `@GetMapping(...)` / `@RequestMapping(...)`，避免注释示例或文档字符串被当成强结构化 route。

验收要求：

- `springMappingLiterals(...)` 在处理 annotation 起点前必须判断该起点是否位于 quoted string 或 Java/Kotlin 注释内。
- 字符串、`//` 行注释、`/* */` 块注释中的伪 mapping 不得进入 Spring mapping literal 列表。
- 真实 mapping 不得被误跳过。
- focused parser test 必须同时覆盖 string、line comment、block comment 伪注解和真实注解保留。
- focused ranking test 必须证明注释里的伪 Spring mapping 不会压过真实 Controller route。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest#springMappingLiterals_shouldIgnoreMappingsInsideCommentsAndStrings,CodeChunkServiceTest#rank_shouldIgnoreCommentedSpringMappingForEndpointRoute test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核，runtime `Bacon / 019f367b-3143-7581-b3d2-189fddcddd09`。

非范围：

- 不实现完整 Java/Kotlin lexer。
- 不声明注释/字符串中的 route 文本完全不会影响 ranking；普通 `exactRoute` / `routeMention` 弱文本得分仍存在。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks endpoint weak route comment stripping

目标：让 endpoint route weak scoring 忽略 `//` 与 `/* */` 注释中的 route 文本，避免历史注释、旧接口说明或文档示例中的 `"/api/auth/login"` 被当作真实 endpoint 证据。

验收要求：

- `endpointRouteHintScore(...)` 的 weak `exactRoute` 与 `routeMention` 必须基于 `stripJavaComments(content)` 后的内容计算。
- 真实 quoted route literal 必须保留召回能力，例如前端 `request.post('/api/auth/login')`。
- controller 文件里的 comment-only route mention 必须得 `0.0`。
- 非 controller/API 文件里的 `// "/api/auth/login"` 和 `/* "/api/auth/login" */` 必须得 `0.0`。
- Spring/Kotlin annotation route parser、HTTP method disambiguation 和真实 mapping 召回不得被误伤。
- focused tests、P6 backend suite、backend full test、static security regression、DB schema contract、scoped whitespace 和 Data-AI review 必须完成。

验证结果：

- PASS：新增测试先在旧实现下失败，证明注释 route 会得到 `150.0` 弱分。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest#endpointRouteHintScore_shouldIgnoreCommentOnlyRouteMentionButKeepRealStringRoute,CodeChunkServiceTest#endpointRouteHintScore_shouldIgnoreNonControllerCommentOnlyQuotedRoute,CodeChunkServiceTest#rank_shouldIgnoreCommentOnlyRouteMentionForEndpointRoute,CodeChunkServiceTest#rank_shouldIgnoreCommentedSpringMappingForEndpointRoute test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核，runtime `Raman / 019f3683-c237-7031-9065-f5b9152c721d`。

非范围：

- 不实现完整多语言 lexer。
- 不声明覆盖 Python `#`、HTML/XML 注释、Markdown prose、docstring 或整个 code_chunks endpoint 候选召回链路。
- 不刷新 full release authority。

## P6/P11 增量：Code QA citation example/format false-positive control

目标：让 Code QA citation audit 只过滤真正的引用格式示例行，不误删真实代码事实中的 `Example` / `Format` 类名、文件名或普通词组。

验收要求：

- `ExampleService uses FormatParser before validating token state [C1].` 必须保持 auditable，并让 Code QA 返回 `DIRECT_VERIFIED`。
- `example-service.ts wires format-parser.ts into auth flow [C2].` 必须保持 auditable。
- `Resource example component validates token state [C3].` 必须保持 auditable，避免普通代码事实因 `example` 单词被误删。
- `Example: cite concrete code facts as [C99].`、`Format: cite concrete code facts as [C96].`、`Citation format: [C98].`、`reference format [C95].`、`source example [C97].` 必须继续被过滤。
- focused tests、Code QA suite、backend full test、static security regression、DB schema contract、scoped whitespace 和 QA review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaControllerTest#codeQa_shouldKeepCodeNamesContainingExampleOrFormatAuditable,CodeQaControllerTest#auditableAnswerText_shouldKeepCodeNamesContainingExampleOrFormat test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,LlmClientAdapterTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。

非范围：

- 不实现完整 citation prose classifier。
- 不声明覆盖所有英文/中文引用示例表达。
- 不刷新 full release authority。

## P6/P11 增量：Code QA Markdown reference image citation filter

目标：让 Code QA citation audit 忽略 Markdown 图片 alt 文本里的 citation，特别是 reference-style 图片 `![... [C1]][id]`，避免不可作为正文证据的图片描述伪造 verified 状态。

验收要求：

- `![AuthService validates token [C1]][auth-diagram]` 不得让正文无引用的回答变成 `VERIFIED`。
- `![AuthService validates token [C1]](https://...)` 不得让正文无引用的回答变成 `VERIFIED`。
- 图片 reference definition 在 URL 被清理后仍必须作为非审计行丢弃，不能因为 `[auth-diagram]:` 残留而变成 `auth` claim。
- `[auth]: https://.../[C1]` 在 URL 被清理后不得贡献额外 `auth` claim 或有效 citation。
- 普通 Markdown link label 中的 citation 必须保持可审计，例如 `[AuthService [C1]](...)`。
- inline Markdown 图片已有过滤语义不得回退。
- focused Markdown tests、Code QA suite、backend full test、static security regression、DB schema contract、scoped whitespace 和 QA review 必须完成。

验证结果：

- RED：旧实现下 `codeQa_shouldIgnoreFakeCitationInsideMarkdownReferenceImageAltOnly` 返回 `VERIFIED`，证明 reference-style 图片 alt citation 会被误当正文引用。
- PASS：focused Markdown image/link/reference tests。
- PASS：QA 第一轮 `PARTIAL` 要求补 inline image 和 `[auth]: URL` 测试；补测后二轮 `PASS`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,LlmClientAdapterTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。

非范围：

- 不实现完整 CommonMark renderer。
- 不声明覆盖所有 nested Markdown dialect。
- 不刷新 full release authority。

## P6/P11 增量：Code QA citation range max-size off-by-one guard

目标：让 citation range 的最大数量限制按包含端点后的真实 label 数量计算，避免 `[C1-C51]` 这类超出上限的范围被误接受。

验收要求：

- `ANSWER_CITATION_MAX_RANGE_SIZE = 50` 必须表示最多 50 个 citation label。
- `[C1-C50]` 必须有效，并展开为 50 个 label。
- `[C1-C51]` 必须整体拒绝，且不得退化为 `C1` / `C51` 普通 token。
- 原有 `[C1-C2]` 正常范围和 reversed range 负例必须保持。
- focused tests、Code QA suite、backend full test、static security regression、DB schema contract、scoped whitespace 和 QA review 必须完成。

验证结果：

- RED：旧实现下 `[C1-C51]` 不为空，证明 `end - start > 50` 存在 off-by-one。
- PASS：citation range focused tests。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,LlmClientAdapterTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不改变 citation range 语法。
- 不实现复杂 range 表达式。
- 不刷新 full release authority。

## P6/P11 增量：Code QA fixed offline retrieval evaluation corpus

目标：把 P6 代码理解检索质量从分散单点测试推进到固定离线评估集，作为后续 ranking/refactor 的稳定回归门禁。

验收要求：

- `backend-spring/src/test/resources/p6-code-qa-retrieval-eval-cases.json` 必须存在，并声明 `version=1`。
- fixture 必须至少覆盖 4 类 P6 核心检索边界：中文接口问题定位 Controller、弱关键词语义召回压过文档噪声、路径行号锚点定位覆盖 chunk、exact anchor 不挤掉跨文件 service/mapper 证据。
- `CodeQaRetrievalEvalCorpusTest` 必须从 classpath 读取 fixture，不允许在测试中硬编码全部样本。
- evaluator 必须执行真实 `CodeQaRetrievalService.selectTopChunks(...)`，并断言 `expectedFirstPath`、`expectedFirstStartLine`、`expectedIncludedPaths` 和 `maxSelectedCountByPath`。
- evaluator 必须校验 fixture hygiene：case id 非空且唯一、question/expectedFirstPath 非空、expectedIncludedPaths 非空、chunks 非空、chunk path/content 非空。
- focused tests、backend full test、static security regression、DB schema contract、scoped whitespace 和 Data-AI review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest,CodeQaRetrievalServiceTest,CodeLocationHintParserTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核；hygiene 建议已补入 evaluator。

非范围：

- 不替代真实公开仓库 E2E。
- 不证明真实 LLM/embedding provider 输出质量。
- 不引入新 DB schema、外部服务或向量数据库。

## P6/P11 增量：Code QA fixed retrieval eval metrics gate

目标：让固定离线 retrieval eval corpus 具备量化阈值门禁，避免只靠逐样本断言而缺少整体指标。

验收要求：

- fixture 根部必须声明 `metrics.topK`、`metrics.minCaseCount`、`metrics.minRecallAtK`、`metrics.minMrrAtK`。
- evaluator 必须校验 `metrics` 存在、`topK > 0`，且 case 数不少于 `minCaseCount`。
- evaluator 必须计算平均 Recall@K：每个 case 的 `expectedIncludedPaths` 在 topK 内命中比例，再对所有 case 求平均。
- evaluator 必须计算平均 MRR@K：`expectedFirstPath` 在 topK 内的倒数排名，再对所有 case 求平均。
- Recall@K 与 MRR@K 必须按 fixture 阈值 fail closed。
- focused tests、backend full test、static security regression、DB schema contract、scoped whitespace 和 Data-AI review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest,CodeQaRetrievalServiceTest,CodeLocationHintParserTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。

非范围：

- 不声明真实项目/真实查询分布上的检索质量。
- 不替代 public repo E2E、真实 embedding provider eval 或性能基准。
- 不刷新 full release authority。

## P6/P11 增量：Code QA fixed retrieval eval realistic case expansion

目标：把固定离线 retrieval eval corpus 从 4 个核心样本扩展到 6 个样本，并把“固定金丝雀回归，不是泛化 benchmark”的口径写入可执行测试合同。

验收要求：

- `p6-code-qa-retrieval-eval-cases.json` 的 `metrics.minCaseCount` 必须提升到 `6`。
- fixture 必须新增 Vite source URL / stack frame 行号定位样本，覆盖 `ProjectDetail.tsx?t=...:245:19`、same-name legacy decoy、同函数 Dashboard decoy 和同文件非目标 chunk。
- fixture 必须新增 raw JSON `handler_class` + `handler_method` 定位样本，覆盖 billing/user 同名 `PaymentController` decoy。
- fixture `metrics` 必须声明 `evaluationScope=fixed_golden_regression` 与 `benchmarkClaim=false`。
- evaluator 必须强制校验上述两个口径字段，防止后续把该 corpus 误包装成真实检索 benchmark。
- Recall@4 / MRR@4 阈值继续通过。
- focused tests、backend full test、static security regression、DB schema contract、scoped whitespace 和 Data-AI 二轮 review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest,CodeQaRetrievalServiceTest,CodeLocationHintParserTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 第一轮 `PARTIAL`，要求避免 benchmark 误导；加入 `evaluationScope/benchmarkClaim` 测试合同后二轮 `PASS`。

非范围：

- 不声明真实公开仓库检索 benchmark。
- 不证明真实 embedding provider 质量。
- 不替代 public repo E2E、端到端报告追问验证或性能评估。

## P6/P11 增量：Code QA fixed retrieval eval GitHub source URL evidence anchors

目标：把 GitHub `blob` URL 与 `raw.githubusercontent.com` URL 形式的报告证据行号锚点纳入 fixed retrieval eval corpus，防止报告追问时同名文件、同函数或文档噪声干扰 Code QA 定位。

验收要求：

- `p6-code-qa-retrieval-eval-cases.json` 的 `metrics.minCaseCount` 必须提升到 `8`。
- fixture 必须新增 `github-blob-source-url-line-anchor-over-same-name-decoy`。
- fixture 必须新增 `github-raw-source-url-line-anchor-over-same-name-decoy`。
- 两个新增样本必须同时包含 target、same-name legacy decoy、Dashboard 同函数 decoy 和 docs/report 噪声。
- 两个新增样本必须断言 `expectedFirstPath=web-console/src/pages/ProjectDetail.tsx` 与 `expectedFirstStartLine=241`。
- `evaluationScope=fixed_golden_regression` 与 `benchmarkClaim=false` 必须保持。
- focused tests、backend full test、static security regression、DB schema contract、scoped whitespace 和 Data-AI review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest,CodeQaRetrievalServiceTest,CodeLocationHintParserTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。

非范围：

- 不声明任意 GitHub URL、任意分支、任意托管平台完整覆盖。
- 不声明真实公开仓库检索 benchmark。
- 不替代 public repo E2E、真实报告追问 smoke 或性能基准。

## P6/P11 增量：Code QA fixed retrieval eval feature branch app-root source URL anchors

目标：把 feature branch + monorepo app-root 的 hosted source URL 形态加入 fixed retrieval eval，降低上一轮 GitHub URL 样本同构风险，并覆盖 `apps/client` 与 `client/src/...` suffix decoy 的真实报告追问风险。

验收要求：

- `p6-code-qa-retrieval-eval-cases.json` 的 `metrics.minCaseCount` 必须提升到 `9`。
- fixture 必须新增 `github-feature-branch-app-root-source-url-over-suffix-decoy`。
- 新样本必须包含 `apps/client/src/pages/Login.tsx` target、`client/src/pages/Login.tsx` suffix decoy、`packages/admin/src/pages/Login.tsx` 同名 package decoy 和 `docs/report.md` 噪声。
- 新样本必须断言 `expectedFirstPath=apps/client/src/pages/Login.tsx` 与 `expectedFirstStartLine=40`。
- fixture `metrics.requiredCaseIds` 必须声明当前 9 个关键 case id。
- evaluator 必须强制校验 required case ids，防止未来只满足数量但替换掉关键样本。
- focused tests、backend full test、static security regression、DB schema contract、scoped whitespace 和 Data-AI review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest,CodeQaRetrievalServiceTest,CodeLocationHintParserTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。

非范围：

- 不声明完整 Git ref parser。
- 不声明任意含 slash 的 branch name 均能精确消歧。
- 不替代 public repo E2E、真实报告追问 smoke 或性能基准。

## P6/P11 增量：Code QA hosted app-root source evidence match without suffix decoy ambiguity

目标：让 Code QA API 层的 `sourceEvidenceMatched` 与 `sourceEvidenceMatchType` 支持 GitHub hosted app-root source URL 精确归一化，避免 target 与 suffix decoy 同时匹配时把真实报告证据误判为歧义失败。

验收要求：

- `sourceEvidenceRef.filePath=https://github.com/acme/source-lens/blob/feature/apps/client/src/pages/Login.tsx#L44` 必须能归一化到 `apps/client/src/pages/Login.tsx`。
- 当 retrieved chunks 同时包含 `apps/client/src/pages/Login.tsx` target 与 `client/src/pages/Login.tsx` suffix decoy 时，API 响应必须保持：
  - `sourceEvidenceMatched=true`
  - `sourceEvidenceMatchType=REPORT_LINE_ANCHOR`
  - `retrievedChunks[0].filePath=apps/client/src/pages/Login.tsx`
  - `retrievedChunks[0].contextRole=PRIMARY`
  - `citationCoverage.coverageScope=PRIMARY`
  - `claimCitationCoverage.roleDistribution.status=PRIMARY_BOUND`
- 已有 Vite source URL、本地 Vite URL、短路径 ambiguity fail-closed 和 hosted `.sh?plain=1#L12` 回归不得破坏。
- focused test、P6 Code QA/retrieval suite、backend full test、static security regression、DB schema contract、code-map check、scoped whitespace 和 QA review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaControllerTest#codeQa_shouldMatchHostedAppRootEvidenceRefWithoutSuffixDecoyAmbiguity test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaControllerTest,CodeQaRetrievalEvalCorpusTest,CodeQaRetrievalServiceTest,CodeLocationHintParserTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：scoped `git diff --check`。
- PASS：拉里佩奇 / QA Engineer 二轮只读复核；首轮 `PARTIAL` 指出 decoy-first PRIMARY 抢占风险，补 exact-first 实现与 decoy-first API 测试后二轮 `PASS`。

非范围：

- 不实现完整 Git ref parser。
- 不声明任意含 slash 的 branch name、任意 GitHub/GitLab URL 或真实公开仓库泛化能力。
- 不替代 public repo E2E、真实报告追问 smoke、provider metadata resolver 或 file index 消歧。

## P6/P11 增量：Public repo report evidence QA citation reason release gate

目标：把真实 public repo 报告证据 QA citation marker 的 citation enforcement reason code 纳入 release evidence 硬门禁，避免只检查 status 而漏掉机器原因码断链。

验收要求：

- `scripts/public-repo-analysis-smoke.sh` 的 `validate_report_evidence_qa_payload(...)` 必须读取并校验 `citationEnforcementReason`。
- `PUBLIC_REPO_REPORT_EVIDENCE_QA_MULTI_ANCHOR` 顶层必须输出 `citationEnforcementReasons`。
- `samples[]` 每项必须输出 `citationEnforcementReason`。
- `scripts/verify-release-evidence.sh` 必须强校验顶层 `citationEnforcementReasons` 和 sample `citationEnforcementReason`。
- 顶层 `citationEnforcementReasons` 必须精确等于 samples 中的 `citationEnforcementReason` 集合，不能只各自合法。
- 允许 reason code 仅限：
  - `DIRECT_VERIFIED`
  - `RETRY_VERIFIED`
  - `FALLBACK_PRIMARY_CITED`
- `scripts/security-regression-check.sh` 的合法 marker 必须补 reason code。
- security regression 必须包含缺失 reason code 的 forged marker 负例，且 verifier 必须拒绝。
- security regression 必须包含 top-level/sample reason set mismatch 的 forged marker 负例，且 verifier 必须拒绝。
- static security regression、bash syntax、DB schema contract、code-map、scoped whitespace 和 Quality Gate review 必须完成。

验证结果：

- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：scoped `git diff --check`。
- PASS：达里奥 / Quality Gate 只读复核；非阻断观察“顶层 reason set 未强制等于 sample reason set”已转为硬门禁并补 forged mismatch 负例。

非范围：

- 不刷新 full release authority。
- 不运行真实 public repo smoke。
- 不改变 Code QA API、DB schema、LLM provider 或前端 UI。

## P6/P11 增量：code_chunks qualified Spring route constants across previous chunk context

目标：让 code_chunks endpoint route ranking 支持同一 Controller 内 `Routes.AUTH + Routes.LOGIN` 这类 qualified route constants，并在大文件切片后通过 previous same-file context 仍能把查询定位到正确方法 chunk。

验收要求：

- 当前方法 chunk 使用 `@GetMapping(Routes.AUTH + Routes.LOGIN)`，前一 same-file chunk 定义 `Routes.AUTH="/api/auth"` 与 `Routes.LOGIN="/login"` 时，`GET /api/auth/login` 必须把方法 chunk 排在 POST decoy 前。
- `Routes.LOGIN` 缺失时，不能 fallback 到 `MarketingRoutes.LOGIN` 或任意 simple `LOGIN`。
- `MarketingRoutes.LOGIN` 与 `Routes.LOGIN` 同名并存时，qualified key 必须独立注册，`Routes.LOGIN` 不能因为 simple key 已存在而丢失。
- HTTP method mismatch gate 必须保持：POST `/api/auth/login` 不得满足 GET 查询。
- focused tests、完整 `CodeChunkServiceTest`、retrieval focused tests、backend full test、static security regression、DB schema contract、code-map check、scoped whitespace 和 Data-AI/QA review 必须完成。

验证结果：

- PASS：新增三条 qualified route constants focused tests。
- PASS：route focused tests。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkRankerTest,CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：梁文峰 / Data-AI Engineer、拉里佩奇 / QA Engineer 多轮只读复核；两轮 `PARTIAL` 打回项已修复，最终 `PASS`。

非范围：

- 不实现跨文件 route constants 解析。
- 不实现完整 Java/Kotlin AST。
- 不证明真实公开仓库 E2E 或 full release authority。

## P6/P11 增量：code_chunks bounded cross-file route holder constants

目标：让 endpoint route ranking 在候选池内识别 `*Routes.java`、`*Paths.kt`、`*Endpoints.java` 等 route holder 文件里的 qualified route constants，并保持 bounded parser 安全边界。

验收要求：

- endpoint route candidate query 必须纳入常见 route holder 文件名，但不得使用 `content LIKE` 做全库内容扫描。
- `@GetMapping(AuthRoutes.LOGIN)` 能通过候选池里的 `AuthRoutes.LOGIN="/api/auth/login"` 排在 POST literal decoy 前。
- `AuthRoutes.ROOT + AuthRoutes.LOGIN` 缺失 `AuthRoutes.LOGIN` 时，不能误用 `MarketingRoutes.LOGIN` 或 simple `LOGIN`。
- external route constants 只允许 qualified key 进入 annotation 解析；simple key 仍只来自当前 class range。
- route holder context 必须保持 bounded：最多 24 个 holder chunks / 24k chars，并有测试证明第 25 个 holder 不会泄漏影响排名。
- focused tests、完整 `CodeChunkServiceTest`、Code QA retrieval tests、backend full test、static security regression、DB schema contract、scoped whitespace 和 Data-AI/QA review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest#searchChunks_shouldResolveQualifiedRouteConstantsFromCandidateRouteHolderFile test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest#searchChunks_shouldNotFallbackCrossFileQualifiedRouteConstantToSimpleName test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest#rankWithPreviousSameFileContext_shouldBoundCrossFileRouteHolderContext test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核；拉里佩奇 / QA Engineer 多轮打回后最终 `PASS`。

非范围：

- 不实现完整 Java/Kotlin AST、import resolver、全局 route graph 或真实公开仓库 E2E。
- 不解析候选池外 route holder，不支持任意动态 route 表达式。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks API/URL route holder filename expansion

目标：在 bounded route holder 策略下覆盖更多真实项目常见命名，尤其是 `ApiConstants.java`、`UrlConstants.java`、`UriConstants.java`、`ApiUrls.java`、`ApiUris.java`、`Paths.java` 和 `Endpoints.java`。

验收要求：

- endpoint route candidate SQL 必须包含上述 Java holder 文件名。
- 每个 holder 文件名都必须有 focused test 同时证明 SQL 参数出现和 target Controller 排第一。
- `isRouteConstantHolder(...)` 不得用宽泛 `contains("uri")` / `contains("url")` 误伤普通文件名。
- `Constants.java` 和 `SecurityConstants.java` 不得作为 external route holder 影响 ranking。
- focused tests、完整 `CodeChunkServiceTest`、Code QA retrieval tests、backend full test、static security regression、DB schema contract、scoped whitespace 和 Data-AI/QA review 必须完成。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest='CodeChunkServiceTest#searchChunks_shouldResolveQualifiedRouteConstantsFromNamedApiUrlHolderFiles' test`。
- PASS：`cd backend-spring && mvn -q -Dtest='CodeChunkServiceTest#rankWithPreviousSameFileContext_shouldNotTreatGenericConstantsAsExternalRouteHolder' test`。
- PASS：`cd backend-spring && mvn -q -Dtest='CodeChunkServiceTest#rankWithPreviousSameFileContext_shouldNotTreatSecurityConstantsAsUriRouteHolder' test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 二轮复核。
- PASS：拉里佩奇 / QA Engineer 三轮复核。

非范围：

- Kotlin 变体已纳入候选 SQL，但本轮 focused ranking loop 只证明 Java holder 文件名。
- 不解析 import、不扫描候选池外文件、不承诺任意企业命名规则。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks Kotlin object route holder constants

目标：补齐 Kotlin `object ApiConstants { const val LOGIN = ... }` 这类真实 Spring/Kotlin route holder 场景，使 `@GetMapping(ApiConstants.LOGIN)` 能进入 qualified route constant ranking。

验收要求：

- `object` 必须作为 class-like declaration container 参与 nearest enclosing declaration 和 class boundary 判断。
- focused test 必须证明 `ApiConstants.kt` 出现在 SQL candidate 参数中。
- focused test 必须证明 `GET /api/auth/login` 查询下 `@GetMapping(ApiConstants.LOGIN)` 排在同路径 `@PostMapping("/api/auth/login")` 前面。
- 不扩大 route holder 候选池命名策略，不把任意 Kotlin object 文件当 route holder。
- focused test、完整 `CodeChunkServiceTest`、Code QA retrieval tests、backend full test、static security regression、DB schema contract 和 scoped whitespace 必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest='CodeChunkServiceTest#searchChunks_shouldResolveQualifiedRouteConstantsFromKotlinObjectHolderFile' test`。
- PASS：`cd backend-spring && mvn -q -Dtest='CodeChunkServiceTest#searchChunks_shouldResolveQualifiedRouteConstantsFromNamedApiUrlHolderFiles' test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 首轮 `PARTIAL` 后补 SQL candidate 断言，二轮复核通过。

非范围：

- 不实现完整 Kotlin AST、companion object、import alias、嵌套 object 或动态 route expression。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks nested Kotlin object route holder constants

目标：补齐 Kotlin `object ApiRoutes { object Auth { const val LOGIN = ... } }` 场景，使 `@GetMapping(ApiRoutes.Auth.LOGIN)` 能通过 cross-file holder context 被正确解析和排序。

验收要求：

- `springRouteConstants(...)` 必须同时注册 nearest qualifier 与完整 nested qualifier，例如 `Auth.LOGIN` 和 `ApiRoutes.Auth.LOGIN`。
- endpoint candidate SQL 必须包含 `ApiRoutes.java` 和 `ApiRoutes.kt`。
- focused search test 必须证明 `ApiRoutes.kt` 出现在 SQL candidate 参数中，且 `@GetMapping(ApiRoutes.Auth.LOGIN)` 排在同路径 POST literal 前。
- Kotlin holder 文件名矩阵必须覆盖 `ApiRoutes.kt`、`UrlConstants.kt`、`UriConstants.kt`、`ApiUrls.kt`、`ApiUris.kt`、`Paths.kt`、`Endpoints.kt`。
- 不破坏既有 Java inner class `Routes.AUTH` / previous same-file qualified constants 行为。
- focused tests、完整 `CodeChunkServiceTest`、Code QA retrieval tests、backend full test、static security regression、DB schema contract、code-map 和 scoped whitespace 必须通过。

验证结果：

- RED：旧实现下 `ApiRoutes.Auth.LOGIN` 解析为空，nested Kotlin search 被 POST literal 抢占。
- PASS：`cd backend-spring && mvn -q -Dtest='CodeChunkServiceTest#springRouteConstants_shouldParseNestedKotlinObjectQualifiedExpressions+searchChunks_shouldResolveQualifiedRouteConstantsFromNestedKotlinObjectHolderFile+searchChunks_shouldResolveQualifiedRouteConstantsFromNamedKotlinApiUrlHolderFiles+searchChunks_shouldResolveQualifiedRouteConstantsFromNamedApiUrlHolderFiles' test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不实现完整 Kotlin AST、import alias、companion object 全场景、动态 route expression 或真实公开仓库 E2E。
- 不刷新 full release authority。

## P6/P11 增量：Code QA route-holder-aware endpoint retrieval

目标：让 Project QA 的 endpoint route 问答与 code_chunks route-holder-aware ranking 保持一致，避免 `@GetMapping(ApiRoutes.Auth.LOGIN)` 被同路径 POST literal 抢占。

验收要求：

- `CodeQaRetrievalService` 的 endpoint route query 必须使用 route-holder-aware ranking。
- fixed eval corpus 必须包含 nested Kotlin route holder + POST literal decoy case。
- route-aware 候选不能使用无条件 synthetic high score；必须保留原始 route-aware 分数，并只把真实 route-aware 命中纳入强候选。
- 无真实 route-aware 命中时，semantic fallback 仍必须可参与排序。
- focused Code QA retrieval tests、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract 和 code-map 必须通过。

验证结果：

- RED：旧实现下 fixed eval 新 case 返回 `AuthPostController.kt`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：梁文峰 / Data-AI Engineer 首轮 `PARTIAL` 后修复 semantic fallback 风险，二轮复核通过。
- PASS：拉里佩奇 / QA Engineer 只读复核通过。

非范围：

- 不实现完整 Kotlin AST、import resolver、动态 route graph、真实 public repo E2E 或真实 LLM provider 质量证明。
- `>=150` route-aware 阈值仍允许弱 route mention 档位；后续可继续区分 docs/comment 裸 route 提及。
- 不刷新 full release authority。

## P6/P11 增量：Code QA endpoint route strong/weak split

目标：防止 endpoint route query 被 docs/prose 裸提 route、单独 route holder 或无关 source 误判为足够强的 retrieval 证据，从而关闭 semantic fallback。

验收要求：

- route-aware ranking 必须区分 `strongEndpointRouteMatch` 与 `springMappingRouteMatch`。
- Code QA 只有存在 Spring mapping route match 时，才允许 route-aware keyword candidates 关闭 semantic fallback。
- endpoint route semantic candidate 的 keyword score 只能由 Spring mapping route match 继承；docs/prose、holder literal 和无关 source 不得携带 route 高分污染语义排序。
- focused tests 必须覆盖 docs exact route mention 和 holder + unrelated source + semantic target 两个反例。
- focused tests、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract 和 code-map 必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：梁文峰 / Data-AI Engineer 首轮 `PARTIAL`，修复 holder context 传播假阳性后二轮通过。
- PASS：拉里佩奇 / QA Engineer 只读复核通过。

非范围：

- 不实现完整 route graph、import resolver、真实 public repo E2E 或真实 provider quality proof。
- 若用户明确询问 route constants 文件，后续需要 intent 分支，而不是把 holder 当 handler retrieval。
- 不刷新 full release authority。

## P6/P11 增量：Code QA route constants intent

目标：在默认 endpoint handler 查询和显式 route constants 查询之间建立清晰边界；用户问“路由常量在哪定义”时优先返回 holder，用户问 handler/API route 处理位置时仍优先返回 Controller。

验收要求：

- `CodeQaRetrievalService` 必须只有在明确 route constants intent 下才对 holder 加权。
- `api route` / `api routes` 这种泛化措辞不能触发 route constants intent。
- handler/controller/handles/handled by/处理/入口/控制器 意图必须优先排除 holder boost。
- `CodeQaRetrievalServiceTest` 必须同时覆盖 route constants 正向查询与 handler API route 负向查询。
- fixed retrieval eval corpus 必须把 handler API route wording case 加入 `requiredCaseIds`。
- focused tests、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract、code-map、scoped whitespace 和 Data-AI/QA review 必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 首轮 `PARTIAL` 后二轮 `PASS`。
- PASS：拉里佩奇 / QA Engineer 首轮 `PARTIAL` 后二轮 `PASS`。

非范围：

- 不实现完整 route graph、import resolver、跨文件 AST、真实 public repo E2E 或真实 provider quality proof。
- 不刷新 full release authority。

## P6/P11 增量：Code QA hosted app-root archive decoy hardening

目标：报告证据或 sourceUrl 指向 monorepo app-root 文件时，`archive/apps/client/...` 这类归档路径不能继承 exact source evidence，也不能通过短 suffix 变体抢占目标文件。

验收要求：

- `CodeLocationHintParser` 对 `apps/packages/services/modules/libs` 开头的 protected module-root path 不再生成更短 suffix 变体。
- `CodeChunkRanker.pathHintMatchScore(...)` 和 exact anchor 路径匹配不能让 `archive/<protected-root>/...` 继承 protected-root suffix。
- `CodeChunkRankerTest` 必须直接断言 archive decoy 的 `isExactLocationAnchorMatch(...) = false` 且 target 为 `true`。
- `CodeQaRetrievalServiceTest` 必须证明 archive decoy 不能抢占 sourceUrl 指向的 target。
- fixed retrieval eval corpus 必须加入 `github-app-root-archive-decoy-over-source-url-anchor` required case。
- focused tests、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract、code-map、scoped whitespace 和 Data-AI/QA review 必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest,CodeLocationHintParserTest,CodeChunkRankerTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 首轮 `PARTIAL` 后二轮 `PASS`。
- PASS：拉里佩奇 / QA Engineer 首轮 `PARTIAL` 后二轮 `PASS`。

非范围：

- 不实现完整 provider metadata/file index resolver、package-manager workspace graph 或真实公开仓库 E2E。
- 不刷新 full release authority。

## P6/P11 增量：code_chunks one-line nested Kotlin route constants

目标：`code_chunks` route parser 必须支持一行压缩的 nested Kotlin object route holder，例如 `object ApiRoutes { object Auth { const val LOGIN = "/api/auth/login" } }`，并在 `@GetMapping(ApiRoutes.Auth.LOGIN)` 场景下优先返回 GET Controller。

验收要求：

- `springRouteConstants(...)` 必须解析出 `LOGIN`、`Auth.LOGIN`、`ApiRoutes.Auth.LOGIN`。
- route constant declaration expression 只能在引号外遇到 `}` 时截断，不得放宽 route holder 文件识别策略。
- `searchChunks` 必须证明 `ApiRoutes.kt` 进入候选、GET target first、route holder included、POST literal decoy 不抢首位。
- focused tests、完整 `CodeChunkServiceTest`、P6 Code QA/ranker eval suite、backend full test、static security regression、DB schema contract、code-map 和 scoped whitespace 必须通过。
- Data-AI 与 QA 只读复核必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest,CodeLocationHintParserTest,CodeChunkRankerTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不实现完整 Kotlin AST、import alias、动态 route expression、函数调用、完整 route graph 或真实公开仓库 E2E。
- 不声明 holder 识别整体无假阳性。
- 不刷新 full release authority。

## P6/P11 增量：Code QA generated suffix source evidence decoy hardening

目标：报告证据/sourceUrl 指向真实源码时，`generated/...`、`.generated/...`、`metadata/...` 或 `.../generated/.../metadata.ts` 一类 generated/noise 路径不得继承 source evidence suffix/exact 权重。

验收要求：

- `pathHintMatchScore(...)` 对 generated/noise path 的 middle contains 和 suffix evidence 不再给路径分。
- `matchesEvidencePathHint(...)` 和 `matchesStrictPathHint(...)` 必须拒绝 generated/noise suffix 继承，只保留 exact path equals。
- `CodeChunkRankerTest` 必须证明 generated decoy exact=false，真实 target exact=true。
- `CodeQaRetrievalServiceTest` 必须证明 generated decoy 不抢首位。
- fixed retrieval eval corpus 必须加入 required case `github-generated-suffix-decoy-over-source-url-anchor`。
- focused tests、完整 `CodeChunkServiceTest`、P6 Code QA/ranker eval suite、backend full test、static security regression、DB schema contract、code-map 和 scoped whitespace 必须通过。
- Data-AI 与 QA 只读复核必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkRankerTest,CodeQaRetrievalServiceTest#selectTopChunks_shouldNotTreatGeneratedSuffixPathAsExactSourceEvidence,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest,CodeLocationHintParserTest,CodeChunkRankerTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：scoped `git diff --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不声明 generated decoy 完全不会进入结果集；它仍可能有 basename、关键词或 line hint 等弱信号。
- 不覆盖所有生成目录命名，例如 `dist/`、`build/`、`out/`。
- 不实现完整 provider metadata/file index resolver 或真实公开仓库 E2E。
- 不刷新 full release authority。

## P6/P11 增量：Code QA root-relative sourceUrl exact anchor over package suffix

目标：报告证据或用户追问携带 `sourceUrl=.../blob/main/src/pages/Login.tsx#L44` 时，如果当前 scan 中存在真实 `src/pages/Login.tsx` chunk，Code QA retrieval 必须优先使用该根目录相对 exact path，不得让 `packages/admin/src/pages/Login.tsx` 通过 suffix 匹配伪装成同等 strict exact source evidence。

验收要求：

- `CodeChunkRanker.isExactPathLocationAnchorMatch(...)` 必须区分宽松 exact-location 和 strict exact-path。
- `CodeQaRetrievalService` 只在真实 root-relative `src/...` exact path anchor 存在时过滤 suffix-only exact-location candidates。
- `feature/apps/client/src/pages/Login.tsx#L44` 的 app-root ambiguity 行为不得被本轮 root-relative 过滤误伤。
- `CodeChunkRankerTest` 必须直接证明 suffix decoy 宽松 exact=true、strict exact-path=false，target strict exact-path=true。
- `CodeQaRetrievalServiceTest` 必须证明 `src/pages/Login.tsx` 排在 `packages/admin/src/pages/Login.tsx` 前。
- fixed retrieval eval corpus 必须新增 required case `github-root-relative-exact-source-url-over-package-suffix-decoy`，并保留旧 case `github-feature-branch-app-root-source-url-over-suffix-decoy`。
- focused tests、P6 retrieval suite、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract、code-map 和 scoped whitespace 必须通过。
- Data-AI 与 QA 只读复核必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkRankerTest,CodeQaRetrievalServiceTest#selectTopChunks_shouldPreferRootRelativeExactSourcePathOverPackageSuffixDecoy,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest,CodeLocationHintParserTest,CodeChunkRankerTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不实现完整 provider metadata、file index resolver、package-manager workspace graph 或真实公开仓库 E2E。
- 不把所有 suffix exact-location 全部禁用；当真实 root-relative exact target 缺失时，仍保留现有召回/回退能力。
- 不改变单分支 `apps/client/...` hosted URL ambiguity 的保守降级策略。
- 不刷新 full release authority。

## P6/P11 增量：Code QA structured evidence path-line pair binding

目标：当 query 中存在多个 structured evidence location object 时，strict exact-path 判定必须绑定同一个 object 的 path 和 line，不能把一个 object 的 `filePath` 与另一个 object 的 `lineNumber` 组合成假阳性。

验收要求：

- `isExactPathLocationAnchorMatch(...)` 在存在 `EvidenceLocationHint` 时，必须要求同一个 hint 同时满足 path equals 和 line range 覆盖。
- structured evidence 存在时，不得先用全局 line hint 覆盖 chunk，再用另一个 evidence hint 的 path equals 放行 strict exact-path。
- 非 structured evidence/sourceUrl/path hint fallback 行为保持不变。
- `CodeChunkRankerTest` 必须新增负例证明 mixed evidence object path-line pairing 被拒绝，并保留正例证明同一 object path-line 成对命中仍通过。
- focused ranker/eval/service suite、P6 retrieval suite、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract 和 code-map 必须通过。
- Data-AI 与 QA 只读复核必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkRankerTest,CodeQaRetrievalEvalCorpusTest,CodeQaRetrievalServiceTest#selectTopChunks_shouldPreferRootRelativeExactSourcePathOverPackageSuffixDecoy test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest,CodeLocationHintParserTest,CodeChunkRankerTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不重写 structured evidence parser 或 JSON traversal。
- 不声明所有 raw/provider evidence schema 均已覆盖。
- 不刷新真实公开仓库 E2E 或 full release authority。

## P6/P11 增量：Code QA structured evidence startLine/endLine pair binding

目标：structured evidence 使用 `startLine/endLine` 表达范围时，strict exact-path 判定必须绑定同一个 evidence object 的 filePath 与 line range。

验收要求：

- parser 已能把 `startLine/endLine`、`start_line/end_line`、`lineStart/lineEnd` 等范围字段解析成同一个 `EvidenceLocationHint` 的 `LineHint`。
- `isExactPathLocationAnchorMatch(...)` 必须复用同一个 hint 同时校验 path equals 与 range 覆盖。
- `CodeChunkRankerTest` 必须新增 line range mixed negative 与 paired positive，和前一轮 `lineNumber` 风格形成互补。
- focused ranker/eval/service suite、P6 retrieval suite、完整 `CodeChunkServiceTest`、backend full test、static security regression、DB schema contract 和 code-map 必须通过。
- Data-AI 与 QA 只读复核必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkRankerTest,CodeQaRetrievalEvalCorpusTest,CodeQaRetrievalServiceTest#selectTopChunks_shouldPreferRootRelativeExactSourcePathOverPackageSuffixDecoy test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest,CodeLocationHintParserTest,CodeChunkRankerTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest test && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不证明真实检索链路、LLM evidence 输入全流程或真实公开仓库 E2E。
- 不覆盖所有 provider raw evidence schema。
- 不刷新 full release authority。

## P6/P11 增量：Code QA evidenceRef startLine/endLine API citation binding

目标：Code QA API 接收 report `evidenceRef.start_line/end_line` 时，必须把范围命中的 chunk 作为 PRIMARY citation，并把同文件但不重叠范围的 chunk 降为 adjacent context。

验收要求：

- MockMvc controller 测试必须使用 snake_case `start_line/end_line` 请求字段，并验证响应中 `sourceEvidenceRef.startLine/endLine` 不丢失。
- 同文件非重叠 decoy 必须出现在候选/返回结果中，且其 `retrievedChunks` 与 `answerCitations` 均为 `ADJACENT_CONTEXT`、`citedByAnswer=false`。
- 范围重叠 target 必须为 `PRIMARY`、`citedByAnswer=true`，并保留 citation `startLine/endLine`。
- `sourceEvidenceMatchType` 必须为 `REPORT_LINE_ANCHOR`，`citationCoverage.coverageScope` 必须为 `PRIMARY`。
- focused Code QA/P6 suite、backend full test、static security regression、DB schema contract 和 code-map 必须通过。
- Data-AI 与 QA 只读复核必须通过；QA 首轮 PARTIAL 必须按打回意见补强后再复核 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaControllerTest#codeQa_shouldMatchViteSourceUrlWithStartEndOnlyEvidenceRef test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaControllerTest,CodeChunkRankerTest,CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 二轮只读复核。

非范围：

- 不刷新真实公开仓库 E2E、浏览器 report drawer smoke 或 full release authority。
- 不证明真实 LLM provider 输出质量。
- 不覆盖全部 provider raw evidence schema。

## P6/P11 增量：public repo report evidence mixed lineNumber/startEnd QA gate

目标：真实公开仓库 smoke 的 report evidence -> Code QA citation marker 必须同时覆盖 `lineNumber` 和 `startLine/endLine` 两种 evidenceRef 输入形态，并由 release verifier 与 security regression 防伪。

验收要求：

- `public-repo-analysis-smoke.sh` 必须从真实 report `apiRoutes` 解析 line-anchor candidates，并交替发送 `LINE_NUMBER` 与 `START_END_ONLY` evidenceRef。
- `START_END_ONLY` 请求不得包含 `lineNumber`；响应 `sourceEvidenceRef` 不得合成 `lineNumber`，必须 echo `startLine/endLine`。
- `reportEvidenceQaCitationQuality` marker 必须输出 `evidenceRefModeStatus=MIXED_LINE_AND_START_END`、两类 sample count、两类 bound sample count 和每样本 request/response shape。
- `verify-release-evidence.sh` 必须拒绝非混合模式、模式计数不一致、START_END_ONLY 带 legacy lineNumber、start/end 不覆盖 evidence line、sourceEvidenceRef shape 不一致。
- `security-regression-check.sh` 必须覆盖 line-only、缺 start/end-only、start/end range miss、mode count forged 等负例。
- bash syntax、focused release marker security regression、static security regression 必须通过。
- Data-AI 与 QA 只读复核必须通过。

验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不刷新 full release authority。
- 不证明真实 LLM provider 输出质量、事实正确性或全量仓库覆盖。
- 不做 HTTP 原始 body 抓包；当前证据来自 smoke 构造请求、响应校验和 release marker/verifier。

## P6/P11 增量：Code QA fixture/testdata mirror sourceUrl decoy hardening

目标：sourceUrl 指向真实源码 `src/...` 时，fixture/testdata 镜像目录不能仅因尾部路径相同而继承 exact/suffix source evidence 强信号。

验收要求：

- `isGeneratedOrNoisePath(...)` 必须识别 `fixtures/`、`__fixtures__/`、`testdata/`、`test-data/` 的 root 和 nested 形态。
- 该规则只能阻断 suffix/contains evidence 继承，不能阻断真实 exact path。
- `CodeChunkRankerTest` 必须循环覆盖 `tests/fixtures/...`、`tests/__fixtures__/...`、`testdata/...`、`test-data/...` 四类 mirror path。
- `CodeQaRetrievalServiceTest` 必须证明四类 mirror path 不抢 `src/pages/Login.tsx` sourceUrl target 的首位。
- fixed eval corpus 必须增加 fixtures/testdata mirror sourceUrl decoy required cases，且 `minCaseCount` 与 required ids 对齐。
- focused test、P6 retrieval suite、backend full test、static security regression、DB schema contract、code-map 必须通过。
- Data-AI 与 QA 只读复核必须通过；QA 首轮 PARTIAL 必须按打回补强后再复核 PASS。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeChunkRankerTest#isExactLocationAnchorMatch_shouldRejectFixtureSuffixEvidencePathHints,CodeQaRetrievalServiceTest#selectTopChunks_shouldNotTreatFixtureMirrorPathAsExactSourceEvidence,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest,CodeLocationHintParserTest,CodeChunkRankerTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：梁文峰 / Data-AI Engineer 二轮只读复核。
- PASS：拉里佩奇 / QA Engineer 二轮只读复核。

非范围：

- 不声明 fixture/testdata 永不入选；basename/content 弱相关候选仍可能出现。
- 不声明完整 provider metadata、workspace graph 或 file index resolver 已完成。
- 不刷新 full release authority。

## P6/P11 增量：Code QA hosted branch strong-root ambiguity hardening

目标：GitHub/GitLab hosted sourceUrl 在 arbitrary branch 中出现 `web-console` 等 strong root 名称时，不能把 branch segment 误当源码根并错误选择同名文件。

验收要求：

- `feature/web-console/src/index.ts#L44` 必须保守解析为 `src/index.ts`，防止 `web-console/src/index.ts` branch-derived decoy 抢占。
- `feature/code-review/web-console/...` 必须继续识别真实 `web-console/...` strong root，不能破坏已有 nested branch 支持。
- `blob/master/...` 必须继续按 known branch 解析，兼容老 GitHub 默认分支。
- `CodeQaRetrievalServiceTest` 必须证明 root-relative `src/index.ts` 优先于 `web-console/src/index.ts` 和 package decoy。
- fixed eval corpus 必须新增 required case `github-branch-strong-root-decoy-over-root-relative-source-url`，`minCaseCount` 与 required ids 对齐。
- focused P6 retrieval suite、backend full test、static security regression、DB schema contract 和 code-map 必须通过。
- Data-AI 与 QA 只读复核必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest#normalizeEvidenceFilePathHint_shouldConservativelyDowngradeSingleBranchStrongRootAmbiguity,CodeQaRetrievalServiceTest#selectTopChunks_shouldPreferRootRelativeIndexWhenStrongRootOnlyAppearsInHostedBranch,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不声明所有 arbitrary branch + strong root URL 均能无歧义还原。
- 不接入 GitHub provider branch metadata、仓库 file index 或 package-manager workspace graph。
- 不刷新 full release authority。

## P6/P11 增量：Code QA sourceRoot metadata-aware hosted sourceUrl file-index resolver

目标：在保留无 `sourceRoot` 时保守降级的基础上，允许 report/provider 显式 `sourceRoot/workspaceRoot/moduleRoot` 元数据参与 hosted sourceUrl 消歧，让 `sourceRoot: web-console` + `feature/web-console/src/index.ts` 可以指向 `web-console/src/index.ts`。

验收要求：

- `CodeLocationHintParser` 必须识别 `sourceRoot/source_root/workspaceRoot/workspace_root/moduleRoot/module_root`。
- root hint 必须只接受可信强 root 或 monorepo root，拒绝 `src`、`../bad`、包含 `..` 的路径和过长路径。
- `CodeQaRetrievalService` 只能在 chunk root 匹配 sourceRoot 且 `isExactLocationAnchorMatch(...)` 成立时加入 metadata boost。
- 无 `sourceRoot` 时，`feature/web-console/src/index.ts` 仍必须保守选择 `src/index.ts`。
- 有 `sourceRoot: web-console` 时，同一 hosted URL 必须选择 `web-console/src/index.ts`，不能被噪声更多的 `src/index.ts` 抢占。
- fixed eval corpus 必须新增 required case `github-source-root-metadata-resolves-hosted-branch-strong-root-ambiguity`，`minCaseCount=18`，required ids 与 case 本体对齐。
- focused parser/service/eval suite、P6 retrieval suite、backend full test、static security regression、DB schema contract 和 code-map 必须通过。
- Data-AI 与 QA 只读复核必须通过。

验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest#selectTopChunks_shouldUseSourceRootMetadataToResolveHostedBranchStrongRootAmbiguity test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest#sourceRootHints_shouldExtractStrongAndMonorepoRootMetadata test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest#sourceRootHints_shouldExtractStrongAndMonorepoRootMetadata,CodeQaRetrievalServiceTest#selectTopChunks_shouldUseSourceRootMetadataToResolveHostedBranchStrongRootAmbiguity,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 只读复核。

非范围：

- 不声明 GitHub/GitLab arbitrary branch URL 都能自动还原。
- 不接入远端 provider branch metadata 查询。
- 不覆盖 file index 只存 module-local path 且完全依赖 root metadata 还原虚拟全路径的场景。
- 不刷新 full release authority。

## P6/P11 增量：Code QA module-local sourceRoot virtual path resolver

目标：当 code_chunks 以 module-local 形态存储 `filePath=src/index.ts`，并通过 `workspaceRoot/moduleRoot=web-console` 表达归属时，Code QA 必须能用 `sourceRoot: web-console` 选择正确 chunk，同时过滤同 path 的根目录或其他 package decoy。

验收要求：

- `matchesAnySourceRootHint(...)` 必须允许 `src/`、`test/`、`tests/`、`config/`、`public/`、`app/`、`lib/` 等 module-local path 在 root metadata 匹配时归属 sourceRoot。
- `chunkKey(...)` 必须包含 `workspaceRoot/moduleRoot`，避免同 path 同 line range 的不同模块 chunk 被误去重。
- sourceRoot metadata winner 存在时，同 normalized `filePath`、同 exact anchor、但 root metadata 不匹配的 decoy 必须被过滤。
- service test 必须覆盖同 path 根目录 decoy、同 path 错误非空 `packages/admin` decoy 和 `web-console` target 的竞争。
- eval harness 必须支持并校验 `expectedFirstWorkspaceRoot/expectedFirstModuleRoot`。
- fixed eval corpus 必须新增 `github-source-root-metadata-resolves-module-local-path`，`minCaseCount=19`，required ids 与 case 本体对齐。
- focused P6 retrieval suite、backend full test、static security regression、DB schema contract 和 code-map 必须通过。
- Data-AI 与 QA 只读复核必须通过；QA 首轮 PARTIAL 必须按打回意见补强后再复核 PASS。

验证结果：

- PASS：`rm -rf backend-spring/target && cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest#selectTopChunks_shouldUseSourceRootMetadataForModuleLocalPath test && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`node ... EVAL_JSON_OK cases=19 required=19 min=19`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 二轮只读复核。

非范围：

- 不查询远端 GitHub/GitLab branch metadata。
- 不声明任意 sourceRoot 都可信；错误/陈旧 metadata 仍可能强选错。
- 不把完整 workspace graph、package-manager graph 或多 context virtual path diversity 一次性完成。
- 不刷新 full release authority。

## P6/P11 增量：Code QA module-local virtual path context diversity

目标：当多个 module-local chunk 都以 `filePath=src/index.ts` 存储时，Code QA 的 context diversity 必须按 virtual path 分组，而不是按裸 `filePath` 把不同模块挤掉。

验收要求：

- `contextFileKey(...)` 必须优先返回 `moduleRoot/filePath`，再退到 `workspaceRoot/filePath`，前提是 `filePath` 是 module-local source path 且本身尚未位于 root 下。
- `diversifyByFile(...)` 和 `addRoleDiverseChunks(...)` 的每文件计数必须使用 virtual file key。
- service test 必须证明 `web-console`、`packages/admin`、`apps/client` 三个 module-local `src/index.ts` 进入前三个 context。
- service test 必须加入未声明 `packages/marketing` 同 path decoy，并证明它不进入前三个 context。
- eval harness 必须支持 `expectedIncludedWorkspaceRoots`。
- fixed eval corpus 必须新增 `github-source-root-metadata-keeps-module-local-virtual-path-diversity`，`minCaseCount=20`，required ids 与 case 本体对齐。
- backend full test、static security regression、DB schema contract 和 code-map 必须通过。
- Data-AI 与 QA 只读复核必须通过。

验证结果：

- PASS：`rm -rf backend-spring/target && cd backend-spring && mvn -q -Dtest=CodeQaRetrievalServiceTest#selectTopChunks_shouldUseVirtualPathDiversityForModuleLocalPaths test && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeLocationHintParserTest,CodeQaRetrievalServiceTest,CodeQaRetrievalEvalCorpusTest test`。
- PASS：`cd backend-spring && mvn -q test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：`node scripts/validate-db-schema-contract.mjs`。
- PASS：`make code-map && node scripts/generate-project-code-map.mjs --check`。
- PASS：`EVAL_JSON_OK cases=20 required=20 min=20`。
- PASS：梁文峰 / Data-AI Engineer 只读复核。
- PASS：拉里佩奇 / QA Engineer 二轮只读复核。

非范围：

- 不强制三个声明模块的固定排序。
- 不禁止第 4 个 context 由 role diversity 补入非 sourceRoot chunk。
- 不完成完整 workspace graph 或 package-manager graph。
- 不刷新 full release authority。

## P6/P11 增量：Live public repo Code QA evidence refresh

目标：把 P6 Code QA retrieval 和 report evidence citation 从离线/单测推进到真实公开仓库证据链，确保 P11 verifier 能复核该证据。

验收要求：

- 后端必须使用当前工作区 stable jar 启动，并通过 `/actuator/health`。
- `public-repo-smoke` 必须在 `Pawnshop-Management-System` 公开仓库上完成真实扫描。
- smoke 必须覆盖 execution steps、dependency graph、raw scan contract、report quality、code chunk search、method anchor retrieval、weak keyword eval、Code QA、claim citation noise boundary、semantic probe、report evidence QA citation、DB counts 和 artifact quality。
- release evidence 必须生成 focused evidence 包，并由 `verify-release-evidence.sh` 独立复核通过。
- `projectQaWeakKeywordEvaluation.cases[]` 必须显式写入 `scanTaskId`，且所有 case scan IDs 与顶层 scanTaskId 一致。

验证结果：

- PASS：stable backend `http://127.0.0.1:19081` health `UP`。
- PASS：direct live smoke 首轮 `scanTaskId=283`，`chunks=17001`。
- PASS：focused evidence `release-evidence/p6-public-repo-code-qa-20260707-000013`。
- PASS：`./scripts/verify-release-evidence.sh release-evidence/p6-public-repo-code-qa-20260707-000013`。
- PASS：marker 复核确认 `projectId=374`、`repositoryId=335`、`scanTaskId=285`，4 个 weak keyword case 的 `scanTaskId` 和 `retrievedChunkScanTaskIds` 均绑定 285。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/release-evidence.sh scripts/verify-release-evidence.sh`。

非范围：

- 不运行 public repo UI smoke。
- 不刷新 full release authority。
- 不把 `release-verifier-public-repo-marker` 安全回归计为通过；该回归本轮卡住，需要后续 P11 单独修复。

## P11 增量：release verifier public repo marker timeout/process-group closure

目标：关闭 `release-verifier-public-repo-marker` 在 macOS Node fallback 路径可能卡住或留下 nested verifier 子进程的风险，让 P6 focused public repo evidence 的安全回归门禁重新可用。

验收要求：

- `run_with_timeout` 在没有 GNU `timeout/gtimeout` 时必须使用 Node fallback。
- Node fallback 必须以 detached process group 启动被测命令。
- timeout 时必须先按进程组发送 `SIGTERM`，再按进程组发送 `SIGKILL`，并保留直接 child kill fallback。
- timeout exit code `124` 必须 fail-closed。
- `release-verifier-public-repo-marker` focused suite 必须在 verbose 和 silent 模式下 PASS。
- suite 结束后不得残留 `security-regression-check`、`verify-release-evidence` 或临时 `sourcelens-public-repo` 探针进程。
- Security Engineer 只读复核必须通过。

验证结果：

- PASS：`bash -n scripts/security-regression-check.sh scripts/verify-release-evidence.sh scripts/public-repo-analysis-smoke.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=true SOURCELENS_SECURITY_REGRESSION_VERIFY_TIMEOUT_SECONDS=20 ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：`./scripts/verify-release-evidence.sh release-evidence/p6-public-repo-code-qa-20260707-000013`。
- PASS：奥特曼 / Security Engineer runtime `Russell / 019f3839-94fb-7421-8aea-8623455987e0`。

非范围：

- 不刷新 full release authority。
- 不把约 4 分钟 suite runtime 优化在本轮完成。
- 不证明被测命令主动 `setsid`/daemonize 脱组后的 kill coverage。

## P6 阶段收口：code understanding and QA citation trust

目标：将 P6 第一阶段从连续 focused 增强收束为阶段可验收状态，允许主线优先转入 P9 UI 产品体验与 P11 verifier runtime cost。

验收要求：

- 必须存在当前 full local release authority，并明确它不是本轮刷新。
- 必须存在 P6 focused public repo evidence，并由 verifier 通过。
- fixed offline retrieval eval corpus 必须通过。
- public repo marker security regression 必须通过。
- `PROJECT_CODE_MAP.md` 必须与当前工作区同步。
- QA 只读复核若给出 PARTIAL，必须关闭其 stage close 文档打回项。
- 必须明确不能宣称的后置范围。

验证结果：

- PASS：当前 full authority baseline `release-current-schema-20260705-0610` 继续有效。
- PASS：focused evidence `p6-public-repo-code-qa-20260707-000013` verifier 通过。
- PASS：`cd backend-spring && mvn -q -Dtest=CodeQaRetrievalEvalCorpusTest test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`，`real 266.85s`。
- PASS：`node scripts/generate-project-code-map.mjs --check`。
- PASS：本地后端 health `UP`。
- PARTIAL -> ACCEPTED：拉里佩奇 / QA Engineer runtime `Ohm / 019f3844-3034-7373-b398-71a55ebdcf31` 的文档打回项已关闭。

非范围：

- 不刷新 full release authority。
- 不宣称真实 LLM provider 质量、全局 RAG benchmark、所有真实仓库泛化能力、完整 provider raw evidence schema、GitHub App/Webhook E2E、生产级灾备/回滚签署。
- 不要求 public repo UI 最新 focused evidence 阻塞 P6；该项进入 P9/P11。

## P9 增量：app shell topbar auxiliary responsive contract

目标：关闭全站顶部栏辅助信息挤压标题和 username 被省略号隐藏的 UI 风险，把 app shell 顶部可读性纳入静态门禁和多视口 smoke。

验收要求：

- 桌面端 `.sl-topbar-env`、`.sl-topbar-ports`、`.sl-topbar-username` 必须可见并限制在 `.sl-topbar` 内。
- 桌面端 username 必须可读，不允许 `overflow:hidden` 或 `text-overflow: ellipsis`。
- 320px 移动端 `.sl-topbar-env`、`.sl-topbar-ports`、`.sl-topbar-username` 必须折叠，避免挤压标题。
- 移动端 `.sl-user-button` 必须仍可见且保持紧凑。
- app-shell smoke 必须包含 `topbar-auxiliary-visible-on-desktop-and-collapsed-on-mobile` marker。
- 静态 UI 校验必须同时 require 新规则并 reject 旧 ellipsis/hidden 回退。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`cd web-console && npm run build`。
- PASS：`cd web-console && npm run smoke:app-shell-ui`，覆盖 13 个核心路由和 3 个视口，`actualVisitedRouteCount=39`。
- PASS：扎克伯格 / Frontend Engineer runtime `Turing / 019f3852-c9e6-7031-920d-e9e4f50bf4c7` 只读复核。

非范围：

- 不代表 P9 全站 UI 完成。
- 不重构所有页面局部布局、表格、抽屉或报告体验。
- 不刷新 full release authority。

## P9 增量：report evidence repair gate reason visibility

目标：让报告证据抽屉的修复候选门禁原因直接可见，避免用户只看到禁用按钮却不知道为什么不能继续。

验收要求：

- READY 状态必须显示“修复门禁已开放”和开放条件。
- GAP/REVIEW 状态必须显示“修复门禁未开放”和阻断原因。
- 门禁说明必须是页面可见文本，不能只放在 `title`、tooltip 或禁用按钮 aria 中。
- 门禁说明必须可换行、不省略、不裁切。
- report evidence drawer smoke 必须覆盖 READY 和 GAP 两类状态。
- READY 修复按钮必须显式证明 enabled。
- smoke marker 必须包含 `readyRepairActionEnabled=true` 和 `repairGateReasonVisible=true`。
- static UI validator 必须验证 action rail guard CSS、测试断言和 marker 字段。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`cd web-console && npm run build`。
- PASS：`cd web-console && npm run smoke:report-evidence-drawer`，2 tests PASS，3 视口覆盖。
- PASS：扎克伯格 / Frontend Engineer runtime `Hypatia / 019f385c-3a1d-7ad0-90e1-b29bc22ba8d9` 二轮只读复核。

非范围：

- 不改变 AutoRepair 后端候选生成逻辑。
- 不宣称真实 patch 质量或 production repair safety。
- 不治理全站所有 disabled action。
- 不刷新 full release authority。

## P11 增量：security regression Node fallback timeout micro-probe

目标：补齐 `run_with_timeout` Node fallback 的动态 timeout 分支证明，降低 macOS 无 GNU `timeout/gtimeout` 时回归门禁卡住或残留 nested child 的风险。

验收要求：

- 默认行为必须仍优先系统 `timeout` / `gtimeout`。
- 只有显式设置 `SOURCELENS_SECURITY_REGRESSION_FORCE_NODE_TIMEOUT=true` 时才强制 Node fallback。
- 内部 timeout probe 必须显式设置 `SOURCELENS_SECURITY_REGRESSION_INTERNAL_TIMEOUT_PROBE=true`，并要求 `SOURCELENS_SECURITY_REGRESSION_TIMEOUT_PROBE_PID_FILE`。
- `integration-drill` 必须动态运行内部 timeout probe，并确认：
  - 子进程非 0 退出；
  - 输出包含 `SECURITY CHECK TIMEOUT: timeout-probe-child exceeded 1s`；
  - 输出包含 `TIMEOUT timeout-probe-child after 1s`；
  - nested child PID 不残留。
- bash syntax、integration-drill、static suite 必须 PASS。

验证结果：

- PASS：`bash -n scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite integration-drill`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。
- PASS：残留进程检查未发现 timeout probe 相关进程。
- PASS：黄仁勋 / DevOps Engineer runtime `Kepler / 019f3867-30d7-7c41-8ba7-6984b3d6b346` 只读复核。

非范围：

- 不降低 `release-verifier-public-repo-marker` suite runtime。
- 不证明主动 `setsid` / daemonize 脱组后代可被清理。
- 不刷新 full release authority。

## P9 增量：ScanTaskDetail code knowledge gate reason visibility

目标：让扫描报告详情页的 code_chunks 操作门禁原因直接可见，避免用户只看到 `代码问答` / `检索切片` 禁用按钮却不知道 code_chunks 是否可用、状态是否失败、下一步该做什么。

验收要求：

- `CodeKnowledgePanel` 必须渲染 `代码知识库操作门禁说明` visible note。
- READY 状态必须显示门禁已开放、code_chunks 数量、召回模式和下一步。
- ERROR 状态必须显示状态读取失败，并明确问答/检索入口保持关闭。
- zero-chunk 状态必须显示需要完成 `chunk_code` 或检查切片落库。
- 门禁说明和 code knowledge 指标格必须可换行、不省略、不裁切。
- batch4A smoke 必须覆盖 blocked 和 ready 两类状态，并覆盖 `1440x900`、`390x740`、`320x740`。
- smoke marker 必须包含 `blockedReasonVisible=true`、`readyReasonVisible=true`、`textStyleSafe=true`、`gridTextStyleSafe=true`。
- static UI validator 必须验证 visible note、三态文案、CSS wrap 和 marker 字段。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`cd web-console && npm run smoke:p9-main-path-recoverable-error-states-batch4a`。
- PASS：扎克伯格 / Frontend Engineer runtime `Hilbert / 019f38ae-37f7-73f3-b1c1-0e4ebead24f6` 只读复核。

非范围：

- 不改变后端 code_chunks 检索、QA 排序、scan execution 或 AutoRepair gate。
- 不证明真实 LLM/embedding provider 质量。
- 不治理全站所有 disabled action。
- 不刷新 full release authority。

## P9 增量：ScanTaskDetail priority repair gate reason visibility

目标：让报告证据优先阅读区的修复候选门禁原因直接可见，避免用户把 QA citation/code_chunks 预检或治理闭环误解为文件级修复证据。

验收要求：

- `ReportEvidencePriorityItem` 必须包含 `repairGateReason`。
- `ReportEvidencePriorityRail` 三张卡必须渲染 `role=note` 的 `修复门禁说明`。
- 首要风险证据卡必须显示 `修复门禁已开放`，并说明文件级风险已绑定到当前扫描证据。
- 引用预检卡必须显示 `修复门禁未开放`，并说明 QA citation/code_chunks 不等同于文件级修复证据。
- 治理闭环卡必须显示 `修复门禁未开放`，并说明治理责任链不替代文件级风险证据。
- repair gate 和 priority card 文本必须可换行、不省略、不裁切。
- report evidence drawer smoke 必须覆盖 ready/blocked/reason 三类可见性。
- smoke marker 必须包含 `repairGateReadyVisible=true`、`repairGateBlockedVisible=true`、`repairGateReasonVisible=true`。
- static UI validator 必须验证字段、visible note、CSS wrap、边界文案和 marker 字段。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`cd web-console && npm run smoke:report-evidence-drawer`。
- PASS：扎克伯格 / Frontend Engineer runtime `Bohr / 019f38bb-2e0d-7b92-ae46-96a1e8574c39` 只读复核。

非范围：

- 不改变 AutoRepair 后端候选生成。
- 不生成 patch，不证明真实 patch 质量。
- 不治理全站所有 disabled action。
- 不刷新 full release authority。

## P9 增量：ScanTaskDetail recommended action gate reason visibility

目标：让报告总览第一步 `推荐下一步` 的动作边界直接可见，避免用户只看到按钮可用/不可用，却不知道当前推荐动作为什么开放、为什么阻断、以及它不能证明什么。

验收要求：

- `ReportRecommendedStep` 必须包含 `actionGateReason`。
- failed scan、running scan、file-bound high risk、project-level risk、evidence gap、code_chunks gap、file-bound repair、QA-ready 分支都必须有分支级动作门禁原因。
- `ReportRecommendedNextStep` 必须渲染 `报告推荐动作门禁说明` visible note。
- 门禁说明必须显示 `推荐动作门禁已开放` 或 `推荐动作门禁未开放`。
- 阻断状态必须列出当前不可执行的推荐按钮。
- 门禁说明必须可换行、不省略、不裁切。
- report evidence drawer smoke 必须覆盖 visible、style 和 no-overflow。
- smoke marker 必须包含 `recommendedStep.gateVisible=true`、`gateReasonVisible=true`、`gateReasonStyleSafe=true`、`mobile390Covered=true`、`narrow320Covered=true`、`noHorizontalOverflow=true`。
- static UI validator 必须验证字段、分支文案、visible note、CSS wrap、smoke helper 和 marker 字段。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`cd web-console && npm run smoke:report-evidence-drawer`。
- PASS：扎克伯格 / Frontend Engineer runtime `Schrodinger / 019f38c8-96e2-7302-a7b9-9212c30b8719` 只读复核。

非范围：

- 不改变后端 scan/report/QA/AutoRepair 逻辑。
- 不生成 patch，不证明真实 patch 质量。
- 不治理全站所有推荐动作或 disabled action。
- 不刷新 full release authority。

## P9 增量：ScanTaskDetail trace map action gate reason visibility

目标：让报告章节追踪卡片的动作边界直接可见，避免用户只看到 `打开 API / 打开数据库 / 打开图谱 / 打开产物 / 追问代码` 按钮可用或不可用，却不知道当前证据面缺少什么。

验收要求：

- `ReportTraceItem` 必须包含 `actionGateReason`。
- `质量风险`、`API 表面`、`数据模型`、`依赖图谱`、`产物证据` 五张 trace card 必须都有分支级动作门禁原因。
- `ReportTraceMap` 必须渲染每张卡的 `追踪动作门禁说明` visible note。
- 门禁说明必须显示 `追踪动作门禁已开放` 或 `追踪动作门禁未开放`。
- 门禁说明必须可换行、不省略、不裁切。
- report evidence drawer smoke 必须覆盖 5 张卡 gate visible、style 和 no-overflow。
- smoke marker 必须包含 `traceGateCount=5`、`traceGateVisible=true`、`traceGateReasonVisible=true`、`traceGateReasonStyleSafe=true`、`traceCardMinButtonCount=4`，并输出 3 个视口 × 5 张卡的 `traceGateProofs`。
- static UI validator 必须验证字段、分支文案、visible note、CSS wrap、smoke helper 和 marker 字段。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`cd web-console && npm run smoke:report-evidence-drawer`。
- PASS：扎克伯格 / Frontend Engineer runtime `Dewey / 019f38d2-3e15-7fd1-9b38-4ae1ca721c88` 首轮 PARTIAL 后二轮只读复核 PASS。

非范围：

- 不改变后端报告解析、artifact schema、QA、AutoRepair 或治理时间线逻辑。
- 不证明真实 LLM/provider 质量。
- 不治理全站所有状态面或 disabled action。
- 不刷新 full release authority。

## P9/P10/P11 增量：AuditLogs decision gate scope and source-health truthfulness

目标：让 AuditLogs 审计工作台明确区分“可作为当前页初步健康信号”“只代表筛选/分页/深链窗口”“不可作为审计结论”，避免用户把局部结果或源加载失败误读为全局审计健康。

验收要求：

- AuditLogs 必须显示 `审计判定门禁说明`，并区分 `READY / REVIEW / BLOCKED`。
- 手动提交的通用审计、Agent 工具、GitHub Webhook 筛选必须让门禁进入 `REVIEW`，即使当前返回结果 `total == visible`。
- 分页窗口 `total > visible` 必须进入 `REVIEW`，并显示当前结果窗口数量。
- 审计源失败或 deep link 精确目标未命中必须进入 `BLOCKED`。
- 顶部状态不得静态宣称 `审计链路在线`；必须随 source health 显示 `审计源可读取 / 审计源加载中 / 审计源需复核`。
- 门禁说明、数据源完整性、当前结果窗口、深链状态和 Raw 证据边界必须可换行、不省略、不裁切。
- `audit-logs-detail-selection` smoke 必须覆盖 READY、deep link REVIEW、deep link miss BLOCKED、手动筛选 REVIEW、分页 REVIEW、源错误 BLOCKED 和 1440/390/320 视口。
- static UI validator 必须锁住 submitted filter scope、动态状态线、decision gate DOM/CSS 和 smoke marker。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`cd web-console && npm run smoke:audit-logs-detail-selection`。
- PASS：扎克伯格 / Frontend Engineer runtime `Ramanujan / 019f38de-ac82-7693-9c94-d81dac61bc7d` 首轮 PARTIAL 后二轮只读复核 PASS。

非范围：

- 不改变后端审计 API、分页合同、Agent 工具调用 API 或 GitHub Webhook Delivery API。
- 不声明 AuditLogs 是全局安全裁判；它仍是当前项目、当前查询窗口的治理工作台。
- 不刷新 full release authority。

## P9/P10/P11 增量：AgentTasks action gate reason visibility

目标：让 AgentTasks 详情页明确说明当前任务动作门禁，避免用户只看到启动、取消、对话、扫描报告或产物入口，却不知道这些动作为什么开放或关闭。

验收要求：

- AgentTasks selected detail 必须显示 `Agent 任务动作门禁说明`。
- 门禁状态必须覆盖 `READY / REVIEW / BLOCKED`。
- `PENDING` 必须显示 `启动门禁开放，取消门禁关闭`，并说明未运行任务不可取消。
- `RUNNING` 必须显示 `取消门禁开放，启动门禁关闭`，并说明不可重复启动、可在检查点停止。
- 终态且有摘要或输出时必须显示 `状态变更门禁关闭，复盘入口开放`，并说明只能查看对话、扫描报告、步骤和产物证据。
- 终态但缺少摘要或输出时必须显示 `终态缺少复盘输出`，进入 BLOCKED 复核语义。
- 未知状态必须显示 `未知状态，动作门禁关闭`，并提示需要后端状态排查。
- 门禁说明、reason 和检查格必须可换行、不省略、不裁切。
- `agent-tasks-detail-selection` smoke 必须覆盖 completed、pending、running、terminal missing output、unknown status 和 1440/390/320 视口。
- static UI validator 必须锁住 action gate state machine、DOM/CSS、runtime smoke 文案和 marker 字段。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`npm --prefix web-console run smoke:agent-tasks-detail-selection`。
- PASS：smoke marker `actionGate.runningGateVisible=true`、`terminalMissingOutputBlocked=true`、`unknownStatusBlocked=true`、`noHorizontalOverflow=true`。
- PASS：扎克伯格 / Frontend Engineer runtime `Beauvoir / 019f38ef-f83d-7ff0-8dc5-614dc66df04d` 首轮 PASS 后，二轮复核确认 RUNNING / terminal missing output / unknown runtime coverage PASS。

非范围：

- 不改变后端 AgentTask 状态机、API、数据库或任务执行逻辑。
- 不新增真实复盘按钮；当前复盘入口指查看对话、扫描报告、步骤和产物证据。
- 不证明全站 Agent 任务流、AgentChat、AutoRepair、真实 worker 执行质量或 full release authority 完成。

## P9/P10/P11 增量：ExecutionTasks action gate reason visibility

目标：让执行任务详情页明确说明当前异步任务动作门禁，避免用户只看到取消、来源、产物、步骤或日志入口，却不知道这些动作为什么开放或关闭。

验收要求：

- ExecutionTasks selected detail 必须显示 `执行任务动作门禁说明`。
- 门禁状态必须覆盖 `READY / REVIEW / BLOCKED`。
- active 状态必须显示 `取消门禁开放，来源和证据复核同步开放`，并说明终态结论未形成。
- SUCCESS 必须显示 `状态变更门禁关闭，来源和产物复盘开放`。
- FAILED 且有错误/步骤/日志证据时必须显示 `失败复盘开放，状态变更门禁关闭`。
- FAILED 但缺少复盘证据时必须显示 `失败任务缺少复盘证据`，进入 BLOCKED 复核语义。
- CANCELLED 必须显示 `取消终态冻结，复盘入口开放`。
- 未知状态必须显示 `未知状态，动作门禁关闭`，并提示需要后端状态排查。
- 门禁说明、reason、检查格、步骤、日志和证据格必须可换行、不省略、不裁切。
- `execution-tasks-detail-selection` smoke 必须覆盖 success、running、failed with evidence、failed missing evidence、cancelled、unknown status 和 1440/390/320 视口。
- static UI validator 必须锁住 action gate state machine、DOM/CSS、runtime smoke 文案、marker 字段和日志脱敏边界。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`npm --prefix web-console run smoke:execution-tasks-detail-selection`。
- PASS：smoke marker `successGateVisible=true`、`runningGateVisible=true`、`failedWithEvidenceReviewVisible=true`、`failedMissingEvidenceBlocked=true`、`cancelledGateVisible=true`、`unknownStatusBlocked=true`、`noHorizontalOverflow=true`。
- PASS：扎克伯格 / Frontend Engineer runtime `Rawls / 019f38fd-1a36-7f71-9b12-8b80d5e47f1e` 首轮 PASS；补强 FAILED with evidence / CANCELLED runtime coverage 后二轮 PASS。

非范围：

- 不改变后端 ExecutionTask 状态机、API、数据库或执行器。
- 不证明后端存储/API 原始日志脱敏；本切片只证明前端 LogViewer display redaction。
- 不证明全站任务流水线、真实 worker 执行质量、AgentChat、AutoRepair 或 full release authority 完成。

## P9/P10/P11 增量：AgentChat closure rail action gate reason visibility

目标：让 AgentChat 右侧闭环栏明确说明当前对话能否进入审计、AgentTask 和扫描报告闭环，避免用户只看到按钮或缺按钮，却不知道为什么开放或关闭。

验收要求：

- AgentChat closure rail 必须显示 `Agent 闭环动作门禁说明`。
- 门禁状态必须覆盖未选中对话、linked ready、code-understanding handoff ready、unbound conversation、AgentTask loading、AgentTask detail error、AgentTask detail null、AgentTask without scanTaskId。
- linked/handoff ready 必须显示 `闭环动作门禁开放`，并说明工具审计、AgentTask 和扫描报告都可用。
- unbound conversation 必须显示 `闭环动作门禁部分开放`，并说明 AgentTask 和扫描报告入口关闭。
- loading 必须显示 `闭环动作门禁复核中`，并保持扫描报告按钮关闭。
- task detail error、missing task detail、no scanTaskId 必须关闭扫描报告入口并显示原因。
- no-active 必须显示 `闭环动作门禁关闭`，且不显示审计、AgentTask、扫描报告动作按钮。
- 门禁说明、reason、检查格和按钮必须可换行、不省略、不裁切。
- `agent-chat-closure-rail` smoke 必须覆盖上述所有门禁分支、handoff 手动发送、深链、脱敏、1440/320 视口和 marker 字段。
- static UI validator 必须锁住 action gate DOM/CSS、runtime smoke 文案、marker 字段和不可宣称项。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：`npm --prefix web-console run smoke:agent-chat-closure-rail`。
- PASS：smoke marker `closureGate.noActiveClosedVisible=true`、`linkedReadyVisible=true`、`handoffReadyVisible=true`、`unboundPartialVisible=true`、`loadingReviewVisible=true`、`taskErrorBlockedVisible=true`、`missingTaskDetailVisible=true`、`noScanBlockedVisible=true`、`providerQualityClaim=false`、`llmFactClaim=false`。
- PASS：扎克伯格 / Frontend Engineer runtime `Aristotle / 019f390c-511b-7c50-9651-a6adafdb530e` 首轮 PARTIAL 后二轮只读复核 PASS。

非范围：

- 不改变后端 AgentChat、AgentTask、AuditLogs 或 ScanTask API。
- 不新增真实 LLM provider 质量声明。
- 不证明全站 Agent 闭环、真实自动修复质量或 full release authority 完成。

## P6/P10/P11 增量：Code QA claim citation repair readiness API

目标：让后端 `claimCitationCoverage` 直接暴露 Project QA 是否可进入修复候选的机器可读门禁，避免前端或后续消费者只用 `status=READY` 误放行 context-only、unknown-only、invalid 或 uncited claim。

验收要求：

- `CodeQaClaimCitationCoverage` 必须暴露 `readyForRepair`、`readinessReason`、`readinessNote`。
- 只有 `claimCitationCoverage.status=READY`、全部 required claim 已引用、全部 required claim 绑定 PRIMARY 证据、文件闭环完整时，`readyForRepair=true` 且 `readinessReason=PRIMARY_BOUND_READY`。
- invalid label、无可审计 claim、uncited required claim、context-only claim、unknown-only claim、PRIMARY-bound 不完整必须返回 `readyForRepair=false` 和具体 reason。
- ProjectDetail 前端必须优先使用后端 `readyForRepair + PRIMARY_BOUND_READY`；旧响应没有该字段时，必须 fallback 到严格 `roleDistribution.status=PRIMARY_BOUND`、claim count、invalid/uncited/context/unknown/file count 一致性检查。
- `claimCitationAudit` 必须展示后端 `readinessNote`、修复门禁和原因码，避免用户只看 `status=READY`。
- `CodeQaControllerTest` 必须覆盖 PRIMARY_BOUND_READY、CONTEXT_ONLY_CLAIM、INVALID_LABEL、UNCITED_REQUIRED_CLAIM 和 UNKNOWN_ONLY_CLAIM。
- `validate-frontend-ui.mjs` 必须锁住 API 类型、严格 helper、前端修复门禁和审计展示字段。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：拉里佩奇 / QA Engineer runtime `Euclid / 019f391d-8f57-76c0-8a90-1d6aceed456c` 只读复核 PASS；其指出的 UNKNOWN_ONLY 单测缺口已补强并复测。

非范围：

- 不改变 AutoRepair 后端候选创建 API、数据库或真实 patch 生成逻辑。
- 不证明 LLM 回答事实一定正确；该门禁只证明 citation/claim 到 PRIMARY 代码证据的结构化 readiness。
- 不刷新 full release authority，不代表 P6 全阶段完成。

## P6/P10/P11 增量：Claim citation repair readiness release evidence gate

目标：把 `claimCitationCoverage.readyForRepair/readinessReason` 纳入 public repo smoke、release evidence verifier 和 security regression，防止发布证据只看 `status=READY` 就误放行修复入口。

验收要求：

- public repo Code QA smoke 必须要求 `claimCitationCoverage.readyForRepair=true` 且 `readinessReason=PRIMARY_BOUND_READY`。
- public repo UI smoke marker 的 verified `qaFromEvidence.claimCitationCoverage` 必须聚合 `readyForRepair` 和 `readinessReasons`。
- release verifier 的 `assertReadyClaimCitationCoverage` 必须硬性要求 `readyForRepair=true` 和唯一 `PRIMARY_BOUND_READY`。
- `sourceFileMatchRelease` 必须与 verified QA 的 `PRIMARY_BOUND_READY` readiness 一致。
- public repo UI `fileAnchorDrift.claimCitationCoverage` 必须保留 `status=READY`，但同时显式 `readyForRepair=false` 和唯一 `CONTEXT_ONLY_CLAIM`，证明 context-only 不是修复授权。
- security regression 必须拒绝 verified QA readiness 字段缺失、false、context-only reason 伪造。
- static UI validator 必须锁住 smoke marker、release verifier 和 security regression 的 readiness 门禁。

验证结果：

- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh && bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite public-repo-ui-marker`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite report-evidence-marker`。

非范围：

- 不改变后端 readiness 判定算法。
- 不改变 AutoRepair 服务端候选创建、数据库或真实 patch 生成。
- 不证明 LLM 事实质量、真实公开仓库完整 E2E 或 full release authority。

## P6/P9/P11 增量：code_chunks status performance and public repo live gate

目标：让 code_chunks readiness 成为独立、轻量、可稳定验收的产品能力，避免扫描详情页/项目详情页用搜索接口读取状态时被大仓库空 query 拖慢或超时。

验收要求：

- 后端必须提供 `GET /api/projects/{projectId}/code-chunks/status`，返回 `CodeChunkSearchResponse` 兼容结构，但不执行关键词搜索。
- ProjectDetail 和 ScanTaskDetail 的 code knowledge 状态读取必须使用 `/status`。
- ScanTaskDetail 必须避免旧 load 请求覆盖新状态。
- 空 query `/search` 仍必须可用于稳定回退检索，但不能重复 count 或使用错误索引导致 15s 超时。
- 大仓库状态接口必须在真实 MySQL 上稳定低于前端 15s timeout；本轮目标为亚秒级。
- public repo live smoke 必须通过，并覆盖桌面、移动端、报告证据抽屉、QA citation、治理时间线、AutoRepair handoff 和 artifact quality。

验证结果：

- PASS：`mvn -Dtest=CodeChunkControllerTest test`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npm --prefix web-console run build`。
- PASS：真实 MySQL 状态接口 `0.385s / 0.020s`，空 query search `0.066s / 0.039s`。
- PASS：`./scripts/public-repo-analysis-smoke.sh` with `SOURCELENS_BASE_URL=http://localhost:19082` and UI/report-evidence/weak-keyword flags。
- PASS：`PUBLIC_REPO_SMOKE_OK` and `PUBLIC_REPO_UI_SMOKE_OK` for project `379`, scan task `290`。

非范围：

- 不改变真实 LLM provider 质量、不证明私有仓库或 GitHub App E2E、不代表生产部署完成。
- 不把 context-only/file-anchor drift 证据提升为修复授权。

## P6/P11 增量：Code QA backend-flow same-domain retrieval neighbors

目标：提升后端流程类问题的跨文件候选质量。用户询问接口、后端流程、调用链、service、repository、mapper、entity 时，Code QA 应优先形成同一业务域的 controller/service/data-access/model 证据组合，降低角色词噪声抢占候选的概率。

验收要求：

- backend-flow intent 下，最终排序必须给同业务域 token 一致的代码文件加权。
- 主证据选中后，缺失的 backend flow 角色必须优先从同业务域候选中补齐。
- 不同业务域但堆叠 `controller/service/repository/flow/trace` 等词的噪声文件不能挤掉同业务链路证据。
- 该策略只作为启发式检索增强，不得宣称已经完成静态调用图、真实事实判定或完整跨文件依赖证明。

验证结果：

- PASS：`mvn -Dtest=CodeQaRetrievalServiceTest test`，51 tests。

非范围：

- 不改变数据库 schema、embedding provider、LLM prompt、前端 UI、AutoRepair 或 public repo full release authority。
- 不替代后续基于 symbol graph / relation graph 的精确跨文件理解。

## P6/P11 增量：Code QA relation-aware evidence reason

目标：让 Code QA 在已有 symbol/relation graph 可用时，把直接关系证据写入检索上下文和返回的 `evidenceReason`，使跨文件上下文不再只是“相邻/同域”启发式，而能说明 `source RELATION target`。

验收要求：

- QA 选出 topChunks 后，必须从 `GraphService.listSymbols/listRelations` 读取当前扫描任务图谱。
- 当 topChunk 内符号与候选 chunk 内符号存在直接关系时，候选 chunk 应作为 `ADJACENT_CONTEXT` 进入返回证据。
- relation-aware context 的 `evidenceReason` 必须包含 `Graph relation: ... CALLS|DEPENDS_ON|IMPLEMENTS|EXTENDS ...`。
- 图谱为空、图谱读取失败或没有直接关系时必须安全降级，不影响原有 QA 检索结果，且不得出现 `Graph relation` evidenceReason。
- 该能力不得宣称完整调用链、多跳依赖图、跨语言精确分析或 LLM 事实正确性。

验证结果：

- PASS：`mvn -Dtest=CodeQaControllerTest test`，90 tests，覆盖 `CALLS` happy path 和 empty graph fallback。

非范围：

- 不新增前端字段、不改变 GraphService 外部 API、不改变数据库 schema、不刷新 public repo full release authority。

## P6/P11 增量：relation-aware QA citation release evidence gate

目标：把 `Graph relation:` evidence reason 从后端单测能力推进到 report evidence QA citation 的可见、可验、防伪 release evidence 合同。

验收要求：

- `report-evidence-drawer-smoke` 的 QA citation fixture 必须包含 graph relation evidence reason。
- smoke 必须证明 `answerCitations`、`retrievedChunks` 和 UI 引用证据卡都能看到 `Graph relation:`。
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.relationAwareEvidenceReason` 必须输出 `status=OK`、`marker="Graph relation:"`、citation/chunk reason 计数、adjacent context 可见性和 UI 可见性。
- `verify-release-evidence.sh` 必须强制校验上述 marker。
- `security-regression-check.sh` 必须拒绝缺失、状态失败、marker 伪造、计数为 0、adjacent/UI 隐藏、provider overclaim 和 raw field。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`CI=true npm --prefix web-console run smoke:report-evidence-qa-citation`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker`。

非范围：

- 不要求真实 public repo smoke 必然出现 graph relation；该能力依赖 analyzer 图谱关系密度。
- 不证明完整静态调用图、多跳关系、真实 LLM 事实质量或 full release authority。

## P6/P11 增量：public repo relation-aware evidence optional-present strict gate

目标：真实 public repo UI smoke 不强制每轮都产生 graph relation，但只要真实 QA response 中出现 `Graph relation:` evidence reason，就必须把该能力纳入发布证据，并严格证明它来自 citation/chunk、可见于 UI、仍保留 PRIMARY 主证据。

验收要求：

- `public-repo-ui-smoke` 必须从真实 `answerCitations` 和 `retrievedChunks` 读取 `evidenceReason`，不得用固定 fixture 伪造 public repo relation marker。
- 当任一 viewport 出现 `Graph relation:` 时，所有 viewport 都必须输出 `qaFromEvidence.relationAwareEvidenceReason`。
- marker 必须输出 `surface=PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON`、`marker=Graph relation:`、`proofCount`、citation/chunk reason 计数、`adjacentContextReasonVisible=true`、`citedPrimaryStillPresent=true`、`uiReasonVisible=true`。
- marker 必须明确 `providerQualityClaim=false` 和 `llmFactClaim=false`。
- `verify-release-evidence.sh` 必须对该可选 marker 做严格校验；如果 marker 不存在则不强制失败，如果 marker 存在则任何字段不可信都必须失败。
- `security-regression-check.sh` 必须拒绝状态、surface、marker、计数、adjacent、primary、UI、provider/LLM overclaim 和 raw field 伪造。

验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：public repo UI smoke `--list` with placeholder env。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker`。

非范围：

- 不要求真实 public repo 每轮必然出现 graph relation。
- 不证明完整静态调用图、多跳关系、跨语言精确分析、真实 LLM 事实质量或 full release authority。

## P6/P11 增量：Java AST scoped method CALLS relation density

目标：提高 Java/Spring 项目真实 `CALLS` relation 产出密度，让 Code QA relation-aware evidence 不只依赖注入依赖和继承关系，也能利用明确的 `service.method()` 调用关系。

验收要求：

- Java AST parser 必须从字段、构造参数、方法参数和局部变量建立变量名到类型映射。
- 必须把 `variable.method()` 和 `this.variable.method()` 转成 `CALLS` relation。
- source id 必须指向当前方法 symbol，target id 必须指向目标类型的方法 symbol，格式与 `CodeSymbol.kind=METHOD` 的 symbol id 对齐。
- 同一个 source/target 的重复调用必须去重，避免 relation 图噪声放大。
- 不得解析无 scope 方法调用或动态调用为确定关系。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest,JavaFallbackAnalyzerTest,CodeGraphPersistenceServiceTest test`。

非范围：

- 不解析接口实现真实落点、Spring proxy、反射、lambda、链式返回类型或多跳调用链。
- 不证明完整静态调用图、真实 LLM 事实质量或 full release authority。

## P6/P11 增量：Java AST unique implementation CALLS relation resolution

目标：在 Java/Spring 项目中，当 `CALLS` target 是接口方法且该接口只有唯一实现类时，额外补充实现类方法 `CALLS`，提高 Code QA relation-aware evidence 对实际实现代码的锚定能力。

验收要求：

- 必须基于全项目 Java AST 的 `IMPLEMENTS` relation 建立接口到实现类映射。
- 只有接口存在唯一实现类时，才能补充 concrete implementation `CALLS`。
- 实现类必须存在同名 method symbol；缺少 method symbol 时不得补充。
- 多实现接口必须跳过，不得猜测。
- 补充 relation 必须进入 scan result JSON 和 parsed AST cache，保证后续落库可见。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaFallbackAnalyzerTest,JavaAstParserTest,CodeGraphPersistenceServiceTest test`。

非范围：

- 不解析 Spring `@Qualifier`、`@Primary`、profile、factory bean、代理、反射、动态分派、lambda 或链式返回类型。
- 不证明完整静态调用图、真实 LLM 事实质量或 full release authority。

## P6/P11 增量：Java AST same-class helper CALLS relation density

目标：提高 Java 类内部执行流的可见度，把 `helper()` 和 `this.helper()` 这类同类方法调用纳入 `CALLS` relation，支撑 Code QA 和报告引用解释类内证据链。

验收要求：

- Java AST parser 必须收集当前类声明的方法名集合。
- 无 scope 方法调用只有在目标方法名存在于当前类时，才能生成同类 `CALLS`。
- `this.method()` 只有在目标方法名存在于当前类时，才能生成同类 `CALLS`。
- 静态导入函数、外部工具函数或未知无 scope 函数不得被猜测成本类方法。
- 同一个 source/target 的重复调用必须去重。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest test`。

非范围：

- 不区分重载参数，不解析完整动态分派、local class/lambda 精确边界、跨语言调用图或多跳调用链。
- 不证明完整静态调用图、真实 LLM 事实质量或 full release authority。

## P6/P11 增量：Java AST imported project static class CALLS relation density

目标：提高 Java 跨文件静态工具方法调用的可见度，把显式 import 的项目内 `ClassName.method()` 纳入 `CALLS` relation，支撑 Code QA 和报告引用解释 mapper/factory/converter 证据链。

验收要求：

- Java AST parser 必须识别 `ImportedProjectClass.method()` 形式的静态类调用。
- 只允许非 static、非 wildcard 的显式 import 参与解析。
- import 必须与当前 package 共享前两段包根，避免外部库污染项目调用图。
- `java.*` 等外部 import 不得生成项目 `CALLS`。
- 同一个 source/target 的重复调用必须去重。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest test`。

非范围：

- 不解析 wildcard import、static import、完整 FQCN scope、构建系统模块边界、动态分派或多跳调用链。
- 不证明完整静态调用图、真实 LLM 事实质量或 full release authority。

## P6/P11 增量：Java AST CALLS persistence gate

目标：确保 Java AST parser 产出的关键 `CALLS` relation 不只存在于内存结果，而是能通过 `CodeGraphPersistenceService` 进入持久化 batch，供 GraphService 和 Code QA relation-aware evidence 消费。

验收要求：

- focused persistence test 必须使用 `JavaAstParser` 真实解析 Java 文件。
- 测试必须覆盖 scoped service call、same-class helper call、imported project static class call。
- 三类 `CALLS` 必须进入 `CodeRelationMapper.insertBatch`。
- 持久化 relation 必须继承当前 scanTaskId。
- Java scan result 中重复 Java relation 不得绕过 AST cache 路径污染持久化。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeGraphPersistenceServiceTest test`。

非范围：

- 不替代真实 MySQL public repo scan、GraphService UI、Code QA marker、真实 LLM provider 或 release authority。

## P6/P11 增量：code relation quality marker

目标：为真实 public repo scan 提供可重复的 code graph 质量量化入口，避免 P6 analyzer 增强只能靠单测和主观判断验收。

验收要求：

- 必须提供 `make code-relation-quality`。
- 必须输出唯一 `CODE_RELATION_QUALITY_OK` JSON marker。
- marker 必须包含 scanTaskId、symbolCount、methodSymbolCount、relationCount、CALLS/DEPENDS_ON/IMPLEMENTS/EXTENDS 计数、CALLS source/target method match percent、unresolvedCallTargets、externalLikeCallTargets。
- 必须支持 `SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID` 指定扫描任务。
- 必须支持 `SOURCELENS_RELATION_QUALITY_MIN_CALLS` 和 `SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT` fail-closed 阈值。
- marker 不得输出 DB password、JWT、token、secret、raw prompt、raw code content。

验证结果：

- PASS：`bash -n scripts/code-relation-quality-report.sh`。
- PASS：`make -n code-relation-quality`。
- PASS：`make code-relation-quality`，当前本地 `scanTaskId=290`，`relationCount=440`，`callCount=0`。
- PASS：`SOURCELENS_RELATION_QUALITY_MIN_CALLS=1 ./scripts/code-relation-quality-report.sh` fail-closed。

非范围：

- 不触发扫描，不替代 public repo smoke、GraphService UI、Code QA marker、真实 LLM provider 或 release authority。
- 当前 `CALLS=0` 是旧扫描基线，必须重新扫描公开仓库后再判定本轮 analyzer 增强效果。

## P6/P11 增量：code relation quality live scan gate

目标：把 `code relation quality marker` 接入真实公开仓库扫描后的 P6 focused gate，确保 analyzer relation graph 增强已经真实落库，而不是只存在于单测或旧基线。

验收要求：

- 必须使用重新扫描后的公开仓库 scanTaskId，不得继续使用旧 `CALLS=0` 基线作为 P6 关系质量结果。
- `make code-relation-quality-p6` 必须 fail-closed，默认要求 `CALLS >= 1` 且去重 edge 口径下的 `CALLS target method match percent >= 40`。
- marker 必须继续输出 `providerQualityClaim=false` 和 `llmFactClaim=false`，避免把图谱质量误宣称为真实 LLM 事实质量。
- 文档记录必须包含 scanTaskId、symbolCount、relationCount、callCount、target method match percent、unresolvedCallTargets。

验证结果：

- PASS：真实公开仓库 `https://github.com/LJunP/Pawnshop-Management-System.git` 重新扫描生成 `scanTaskId=291`。
- PASS：`make code-relation-quality` 输出 `scanTaskId=291`、`symbolCount=15727`、`methodSymbolCount=2360`、`relationCount=3402`、`callCount=2962`、去重 edge 口径 `callTargetMethodMatchPercent=40`、`methodSymbolDuplicateGroups=138`、`unresolvedCallTargets=1771`。
- PASS：临时后端日志确认 `CodeGraphPersistenceService` 为 `scanTaskId=291` 写入 `3808` 个 Java symbols 和 `3402` 个 Java relations。
- PASS：`make code-relation-quality-p6` 默认阈值可用于防止未来回退到 `CALLS=0` 或 target method match 低于当前可接受底线。

非范围：

- 该 gate 不证明完整静态调用图、多跳调用链、跨语言精确调用图、真实 LLM provider 质量、GitHub App E2E 或 full release authority。
- `callTargetMethodMatchPercent=40` 是去重 relation edge 后的当前 marker 口径，不是完整调用边语义准确率。
- `unresolvedCallTargets=1771` 仍需要后续按外部库调用、动态调用、缺失 symbol 和可解析缺口分桶分析。

## P6/P11 增量：Java common JDK type CALLS normalization and unresolved bucket marker

目标：降低 Java AST 把 `String`、`Map`、`List` 等 JDK 常见简单类型误拼成本包类的假 `CALLS` target，并让 relation marker 能量化 unresolved target 的来源分桶。

验收要求：

- `JavaAstParser` 必须把常见 `java.lang`、`java.util`、`java.math` 简单类型解析到 JDK package，不得默认拼成当前业务 package。
- `String#trim()`、`Map#get()` 等调用可以进入外部 JDK target，但不得生成 `com.example.String#trim()`、`com.example.Map#get()` 这类项目内假 target。
- `CODE_RELATION_QUALITY_OK` 必须输出 dominant project package prefix、unresolved known external targets、unresolved project-like targets、unresolved project-like JDK simple-type targets、unresolved other targets。
- 真实公开仓库重新扫描后，必须对比修复前后的 project-like JDK simple-type false target 数量。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest,JavaFallbackAnalyzerTest,CodeGraphPersistenceServiceTest test`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=292`，commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`。
- PASS：`SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID=292 make code-relation-quality-p6`。
- PASS：阈值 `SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT=41` 对 `scanTaskId=292` fail-closed。
- 对比：`unresolvedProjectLikeJdkSimpleTypeCallTargets` 从 `575` 降到 `53`。
- 对比：`unresolvedProjectLikeCallTargets` 从 `1175` 降到 `638`。
- 当前剩余：`callTargetMethodMatchPercent=40`、`methodSymbolDuplicateGroups=138`、`unresolvedCallTargets=1771`、`unresolvedKnownExternalCallTargets=1126`、`unresolvedOtherCallTargets=7`。

非范围：

- 该修复不提升完整静态调用图准确率，不解析动态分派、多跳调用链、Spring runtime bean、泛型真实类型或跨语言调用图。
- target method match 仍为 `40`，说明下一步应处理重复 method symbol 和剩余 project-like unresolved，而不是宣称 relation quality 完成。

## P6/P11 增量：Java overloaded method symbol deduplication

目标：在当前 name-level `symbol_id` schema 下，去除 Java 重载方法造成的重复 method symbol，避免 GraphService / Code QA relation expansion 只能 `putIfAbsent` 消费第一条重复 symbol，同时让 relation quality marker 能真实反映 symbol 表质量。

验收要求：

- `JavaAstParser` 在同一 class 内只允许为同一个 name-level method symbol 输出一条 `METHOD` symbol。
- `result.methodCount` 仍保持真实方法数量，不因为 symbol 去重丢失 analyzer 统计。
- 重载方法的签名级精确表达不得在本轮通过修改现有 `symbol_id` 格式强行实现；应作为未来 schema 升级处理。
- 真实公开仓库重新扫描后，`methodSymbolDuplicateGroups` 必须从当前 `138` 降为 `0`。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest,JavaFallbackAnalyzerTest,CodeGraphPersistenceServiceTest test`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=293`。
- PASS：`SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID=293 make code-relation-quality-p6`。
- PASS：`methodSymbolDuplicateGroups=0`。
- 对比：`symbolCount` 从 `15727 -> 15586`，`methodSymbolCount` 从 `2360 -> 2219`。

非范围：

- 该切片不提供签名级 symbol id，不区分 overloaded method 的参数类型，不提升 `callTargetMethodMatchPercent=40`。
- 剩余 `unresolvedProjectLikeCallTargets=638` 仍是下一步 P6 质量缺口。

## P6/P11 增量：Java wildcard/JDK external type CALLS normalization

目标：降低 Java AST 在 wildcard import 场景下把 JDK/第三方简单类型误拼成业务 package 的假 `CALLS` target，并把 JDK simple-type project-like false target 降到 0。

验收要求：

- `java.io.*`、`java.util.*` 等 JDK wildcard import 只能解析已知 JDK package 映射中的类型，不得随意猜测。
- 第三方/project wildcard import 可解析 Java class-name 风格类型，但 primitive type 不得生成 constructor dependency target。
- `File#exists()`、`Entry#getKey()`、`Instances#numAttributes()` 等 wildcard/import 相关调用不得继续被误拼成 `com.yb...` 假 target。
- 真实公开仓库重新扫描后，`unresolvedProjectLikeJdkSimpleTypeCallTargets` 必须归零，`methodSymbolDuplicateGroups` 不得回退。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest,JavaFallbackAnalyzerTest,CodeGraphPersistenceServiceTest test`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=294`。
- PASS：`SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID=294 make code-relation-quality-p6`。
- PASS：阈值 `SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT=41` 对 `scanTaskId=294` fail-closed。
- 对比：`unresolvedProjectLikeJdkSimpleTypeCallTargets` 从 `53` 降到 `0`。
- 对比：`unresolvedProjectLikeCallTargets` 从 `638` 降到 `512`。
- 当前剩余：`callTargetMethodMatchPercent=40`、`unresolvedCallTargets=1771`、`unresolvedKnownExternalCallTargets=1252`、`unresolvedOtherCallTargets=7`。

非范围：

- 该切片不实现完整 Java compiler/import resolver，不解析泛型真实类型、动态分派、反射、多跳调用链、Spring runtime bean 或真实 LLM 事实质量。
- 剩余 `unresolvedProjectLikeCallTargets=512` 继续作为下一步 P6 analyzer 质量缺口。

## P6/P11 增量：Java Lombok accessor symbol coverage

目标：为 Lombok `@Data/@Getter/@Setter` 生成的实体访问器补充 source-bound method symbol，降低 project-like unresolved target，并提高 Code QA / report evidence 对 entity getter/setter 调用的可解释性。

验收要求：

- class-level `@Data/@Getter/@Setter` 和 field-level `@Getter/@Setter` 必须生成对应 getter/setter method symbol。
- static fields 不得生成 accessor symbol；final fields 不得生成 setter symbol。
- primitive boolean 必须支持 `isX`，并保留 `getX` 兼容匹配。
- 真实公开仓库重新扫描后，entity getter/setter unresolved bucket 必须显著下降。
- P6 relation quality gate 必须把默认 target method match threshold 上调到 `45` 并保持 fail-closed。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest,JavaFallbackAnalyzerTest,CodeGraphPersistenceServiceTest test`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=295`。
- PASS：`SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID=295 make code-relation-quality-p6`。
- PASS：阈值 `SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT=47` 对 `scanTaskId=295` fail-closed。
- 对比：`callTargetMethodMatchPercent` 从 `40` 提升到 `46`。
- 对比：`unresolvedProjectLikeCallTargets` 从 `512` 降到 `317`。
- 对比：entity getter/setter unresolved bucket 从 `196` 降到 `4`。
- 当前剩余：`unresolvedCallTargets=1576`、`unresolvedKnownExternalCallTargets=1252`、`unresolvedProjectLikeCallTargets=317`、`unresolvedOtherCallTargets=7`。

非范围：

- 该切片不实现 Lombok 全语义、不生成方法体、不提供签名级 symbol schema、不解析 builder/chained/access-level 配置。
- 剩余 project-like unresolved 主要集中在 MyBatis-Plus `IService` 继承 CRUD 方法，后续必须单独设计 inherited framework method coverage。

## P6/P11 增量：Java MyBatis-Plus IService inherited method coverage

目标：为明确继承 MyBatis-Plus `IService<T>` 的 service interface 补充 inherited framework method symbols，降低 inherited CRUD 调用的 project-like unresolved 数量。

验收要求：

- 仅当接口明确继承 `com.baomidou.mybatisplus.extension.service.IService<T>` 时才生成 inherited framework method symbol。
- 覆盖真实公开仓库中出现的 `getOne/getById/save/saveOrUpdate/update/updateById/updateBatchById/remove/removeBatchByIds/count/list`。
- 本地同名 `IService` 不得被误判为 MyBatis-Plus。
- 真实公开仓库重新扫描后，`service_inherited_crud` unresolved bucket 必须归零。
- P6 relation quality gate 必须把默认 target method match threshold 上调到 `55` 并保持 fail-closed。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest,JavaFallbackAnalyzerTest,CodeGraphPersistenceServiceTest test`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=296` 和 `scanTaskId=297`。
- PASS：`SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID=297 make code-relation-quality-p6`。
- PASS：阈值 `SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT=57` 对 `scanTaskId=297` fail-closed。
- 对比：`callTargetMethodMatchPercent` 从 `46` 提升到 `56`。
- 对比：`unresolvedProjectLikeCallTargets` 从 `317` 降到 `36`。
- 对比：`service_inherited_crud` unresolved bucket 从 `272` 降到 `0`。
- 当前剩余：`unresolvedCallTargets=1295`、`unresolvedKnownExternalCallTargets=1252`、`unresolvedProjectLikeCallTargets=36`、`unresolvedOtherCallTargets=7`。

非范围：

- 该切片不生成业务方法体，不声明 framework inherited method 有源码实现，不实现完整 Java type solver。
- 剩余 36 个 project-like unresolved 需要后续处理 catch parameter/local type scope、CommonService package resolution、annotation/session 类型。

## P6/P11 增量：Java project-like unresolved closure

目标：关闭当前公开仓库基线中剩余 project-like false `CALLS` target，让 P6 relation graph 在项目内调用层面不再残留明显错误 package / 类型解析噪声。

验收要求：

- catch parameter 类型必须进入 method 可见作用域，`Exception/RuntimeException/IllegalAccessException` 不得回退到当前 package。
- wildcard import 多候选时，`*Service` 等类型必须优先解析到语义匹配 package，避免 `com.yb.entity.CommonService` 这类假 target。
- `jakarta.websocket.*` / `javax.websocket.*` 的 `Session` 不得解析成当前业务 package。
- annotation declaration 的 member method 必须生成 method symbol，用于匹配 `SysLog#value()` 等项目内 annotation 调用。
- `HashMap` / `LinkedHashMap` 子类可小范围暴露 `putAll()` inherited JDK method symbol，但不得宣称为源码显式方法体。
- 真实公开仓库重新扫描后，`unresolvedProjectLikeCallTargets` 必须降到 `0`，P6 relation quality gate 必须把默认 target method match threshold 上调到 `56` 并保持 fail-closed。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest,JavaFallbackAnalyzerTest,CodeGraphPersistenceServiceTest test`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=299`。
- PASS：`SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID=299 make code-relation-quality-p6`。
- PASS：阈值 `SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT=57` 对 `scanTaskId=299` fail-closed。
- 对比：`unresolvedProjectLikeCallTargets` 从 `36` 降到 `0`。
- 当前基线：`callTargetMethodMatchPercent=56`、`methodSymbolDuplicateGroups=0`、`unresolvedProjectLikeJdkSimpleTypeCallTargets=0`。

非范围：

- 该切片不实现完整 Java compiler/type solver、不解析所有外部库方法、不提供签名级 overload 图谱、不证明动态分派、多跳调用链、真实 LLM provider、Code QA 回答事实正确性或 full release authority。
- `unresolvedKnownExternalCallTargets=1305` 作为外部库/JDK/framework method symbol 缺口保留，不属于本轮 project-like false target 关闭范围。

## P6/P11 增量：Code QA required evidence citation coverage

目标：把 Code QA / report evidence QA 的引用覆盖状态从“全候选覆盖”细化为“必需主证据覆盖”和“辅助上下文覆盖”，避免必需证据已闭环但辅助上下文未全引用时被误判为不可放行。

验收要求：

- 后端 `citationCoverage.status` 必须支持 `REQUIRED_FULL`，含义是 required/primary evidence 已全引用，但 supplemental / adjacent context 可能未全引用。
- `PARTIAL` 必须继续表示仍有必需主证据或必需主张未被引用，不能被 `REQUIRED_FULL` 覆盖。
- 前端 QA trust、cross-file citation summary 和修复放行信号必须把 `REQUIRED_FULL` 显示为必需证据闭环，同时继续展示 context gap。
- public repo smoke 必须接受 `FULL` 与 `REQUIRED_FULL` 作为 required citation coverage satisfied，但仍保留 total coverage 和 uncited candidate metrics。
- 不得存储 raw prompt/raw answer，不得宣称真实 LLM provider 质量。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest test`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=300`。
- PASS：public repo smoke 覆盖 code chunk search、method anchor retrieval、Code QA、claim citation noise boundary、semantic pool probe、report evidence QA citation、DB counts 和 artifact quality。

非范围：

- `REQUIRED_FULL` 不代表所有候选证据都已引用，也不代表回答事实在真实 LLM provider 下被证明正确。
- 辅助上下文未引用仍必须作为 review signal 展示；不能把 context gap 当作已解决质量问题。
- 该切片不解决 embedding coverage 低、弱关键词样本 INCONCLUSIVE、完整外部库方法图谱或 full release authority。

## P6/P11 增量：Weak keyword no-embedding representative code fallback

目标：在没有 embeddings 且问题弱关键词命中为 0 时，Project QA 的 stable fallback 必须返回代表性代码证据，而不是 README/docs。

验收要求：

- `CodeChunkService` stable fallback 必须优先按 Controller、Service、Data Access、Domain Model、Frontend、Config、Test 等角色取候选。
- 代表性候选排序必须优先 Controller / Service / Data Access，避免空查询或弱查询直接落到仓库字典序中的 README/docs。
- `public-repo-analysis-smoke.sh` 在 no-embedding + `STABLE_FALLBACK` 场景必须检查 primary evidence：`DOCUMENTATION`、`README.md`、`/docs/` 必须 fail-closed。
- smoke marker 必须输出 `representativeFallbackHits` 和 case 级 `representativeFallbackPrimary`，便于后续复核。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest,CodeQaControllerTest,CodeQaRetrievalServiceTest test`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=302`。
- PASS：`projectQaWeakKeywordEvaluation.representativeFallbackHits=4`，4 个 weak keyword case 的 primary 均为 `CONTROLLER`，`representativeFallbackPrimary=true`。
- PASS：smoke 同时覆盖 method anchor retrieval、Code QA、claim citation noise boundary、semantic pool probe、report evidence QA citation、scan governance seed、DB counts 和 artifact quality。

非范围：

- `projectQaWeakKeywordEvaluation.status=INCONCLUSIVE` 在无 embeddings 时仍是正确边界；本轮只保证 fallback 不误导到文档，不宣称语义召回完成。
- 当前不证明真实 external embedding provider 质量、不证明完整跨文件排序完成、不证明 Code QA 回答事实正确性或 full release authority。

## P6/P11 增量：Weak keyword intent-aware representative fallback roles

目标：在 no-embedding stable fallback 场景中，代表性代码兜底必须按问题意图选择更合适的主代码层，而不是所有弱问题都默认 Controller。

验收要求：

- 空问题或无明确意图时，保持默认 Controller、Service、Data Access、Domain、Frontend、Config、Test 优先级。
- 安全、权限、危险命令、工具能力、任务调度类问题必须优先 Service，再考虑 Config / Controller。
- 运行时配置、环境、profile、feature flag 配置类问题必须优先 Config。
- 数据加载、查询、保存、数据库、mapper/dao 类问题必须优先 Data Access。
- public repo smoke 必须对 weak keyword case 记录并强制校验 `expectedFallbackPrimaryRoles` 与 `representativeFallbackRole`。
- `representativeFallbackRole` 必须可从 evidenceType 或 file path 推断，避免真实代码路径被泛化标成 `SOURCE` 时误判。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest,CodeQaControllerTest,CodeQaRetrievalServiceTest test`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=304`。
- PASS：`worker-tools-policy -> SERVICE`。
- PASS：`shell-safety-policy -> SERVICE`。
- PASS：`query-run-config -> CONFIG`，其中 API evidenceType 为 `SOURCE`，smoke 通过 file path 推断 `representativeFallbackRole=CONFIG`。
- PASS：`feature-flag-data -> DATA_ACCESS`。

非范围：

- 该切片仍不把 `no_embeddings` 改写成语义成功；`projectQaWeakKeywordEvaluation.status=INCONCLUSIVE` 是正确质量边界。
- 规则式 intent routing 是 P6 过渡能力，不替代后续 embedding coverage、query planning、跨文件排序和真实 provider 质量评估。

## P6/P11 增量：Code QA retrieval plan explainability

目标：Code QA API 必须暴露检索计划，让 weak keyword / stable fallback / role-intent 排序可审计，并保证实际候选排序与该计划一致。

验收要求：

- `CodeQaResponse` 必须返回 `retrievalPlan`，包含 `tokens`、`roleIntents`、`fallbackRolePriority`、`auxiliaryHintsPresent` 和 `fallbackReason`。
- `fallbackReason` 必须区分 `NO_SCAN`、`NO_CONTEXT`、`NO_KEYWORD_NO_EMBEDDING_DEFAULT_FALLBACK`、`NO_KEYWORD_NO_EMBEDDING_INTENT_ROLE_FALLBACK`、`NO_KEYWORD_SEMANTIC_OR_STABLE_FALLBACK`、`KEYWORD_WITH_ROLE_HINTS` 和 `KEYWORD`。
- 当主关键词无命中但 role/path 等辅助候选存在时，`CodeChunkService` 必须按 representative fallback role priority 重排候选，避免 API 计划和实际结果不一致。
- public repo weak keyword smoke 必须在 stable fallback 场景校验 `retrievalPlan.fallbackRolePriority[0]` 与 expected fallback role 一致，并校验 `fallbackReason=NO_KEYWORD_NO_EMBEDDING_INTENT_ROLE_FALLBACK`。
- 前端 API 类型必须承接 `retrievalPlan`，但本轮不要求新增 UI 展示面。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest#codeQa_shouldExposeStableFallbackProfileWhenNoKeywordOrUsableEmbeddingMatches+codeQa_shouldExposeIntentAwareRetrievalPlanForStableFallback,CodeChunkServiceTest#listRetrievalCandidates_shouldUseQuestionIntentToRankRepresentativeFallback+listRetrievalCandidates_shouldPreferDataAccessForWeakDataLoadingFallback test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest,CodeQaControllerTest,CodeQaRetrievalServiceTest test`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=305`，`PUBLIC_REPO_SMOKE_OK`。
- PASS：`projectQaWeakKeywordEvaluation` 4 个 case 均输出 `retrievalPlan`；stable fallback case 校验 `fallbackRolePriority` 和 `fallbackReason` 通过。

非范围：

- `retrievalPlan` 不是语义理解或事实正确性证明。
- 当前 no-embedding 场景保持 `INCONCLUSIVE/no_embeddings` 边界；本轮不宣称 embedding quality、真实 LLM provider 或 full release authority。

## P6/P11 增量：Code QA graph flow relation evidence primary citation

目标：当用户询问跨层调用链、流程或依赖关系时，graph relation 命中的跨文件证据必须进入 PRIMARY / required citation gate，而不是只作为可忽略上下文。

验收要求：

- 仅在明确 flow/call-chain/调用链/流程/跨层关系意图下，将 graph relation 扩展 chunk 加入 primary key set。
- 普通 graph-related adjacent context 不得被无条件升级为 PRIMARY。
- 被提升为 PRIMARY 的 graph relation chunk 仍必须展示 `Graph relation:` evidence reason。
- 未配置 LLM 时，fallback answer 必须引用全部 PRIMARY source labels，而不是只引用第一个 primary。
- citation coverage 必须能体现跨文件 PRIMARY 被引用：`PRIMARY_CROSS_FILE`、primary file cited count 覆盖 primary file count、claim role distribution 为 `PRIMARY_BOUND`。
- release verifier 必须接受 `REQUIRED_FULL`，因为 required/primary evidence 已全引用但 context evidence 可能仍未全引用。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest#codeQa_shouldPromoteGraphRelationEvidenceToPrimaryForFlowQuestion+codeQa_shouldNotAddGraphRelationContextWhenGraphIsEmpty+codeQa_shouldExposeStableFallbackProfileWhenNoKeywordOrUsableEmbeddingMatches+codeQa_shouldExposeIntentAwareRetrievalPlanForStableFallback test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkServiceTest test`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`node scripts/validate-api-design.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=306`，`PUBLIC_REPO_SMOKE_OK`。

真实 smoke 关键结果：

- `codeQa.citationCoverage.status=REQUIRED_FULL`。
- `codeQa.citationCoverage.citedPrimaryEvidenceFileCount=4`，`primaryEvidenceFileCount=4`。
- `codeQa.claimCitationCoverage.roleDistribution.status=PRIMARY_BOUND`。
- `crossFileCitationSummary.primaryCoverageSatisfied=true`，`requiredCitationCoverageSatisfied=true`。

非范围：

- 该切片不证明完整静态调用图、动态分派、多跳调用链、真实 LLM provider 或 full release authority。
- flow intent 判断仍是 bounded heuristic；复杂自然语言后续需要 query planner / relation-aware prompt 继续增强。

## P6/P11 增量：Code QA relation-aware graph evidence prompt

目标：把已进入 PRIMARY / required citation gate 的 graph relation 证据显式传递给 LLM prompt，避免调用链/流程问题退化为单文件片段问答。

验收要求：

- Code QA prompt 中每个代码片段必须展示 `Context role`、`Evidence type`、`Relevance score`、`Evidence reason` 和 matched terms。
- 当问题包含明确 flow/call-chain/调用链/流程意图，且 retrieved chunks 中存在包含 `Graph relation:` 的 PRIMARY 证据时，system prompt 必须要求优先使用这些关系证据组织回答。
- relation-aware prompt 指令只能基于服务端计算出的 `retrievedChunks[*].evidenceReason`，不得从模型输出或用户输入伪造。
- citation retry prompt 可展示 label、role、file 和 evidence reason，但不得展示 raw prompt、raw answer、secret 或完整 chunk content。
- 无 graph relation evidence 时不得强行输出 relation-aware release marker；public repo UI marker 继续保持 optional-present strict。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest#codeQa_shouldIncludeGraphRelationPrimaryEvidenceInstructionInPromptForFlowQuestion+codeQa_shouldPromoteGraphRelationEvidenceToPrimaryForFlowQuestion+codeQa_shouldNotAddGraphRelationContextWhenGraphIsEmpty+codeQa_shouldReturnEvidenceMetadataAndPromptSafetyBoundary test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkServiceTest test`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`node scripts/validate-api-design.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh`。
- PASS：真实公开仓库 smoke 重新扫描生成 `scanTaskId=307`，`PUBLIC_REPO_SMOKE_OK`。
- PASS：`奥特曼 / Security Engineer` 只读复核确认没有新增 raw prompt/raw evidence 持久化风险，PromptInjectionGuard 边界仍合理。
- PASS：`拉里佩奇 / QA Engineer` 只读复核确认新增测试覆盖 graph relation prompt 进入 LLM，普通 smoke/verifier 低风险。

非范围：

- relation-aware prompt 不证明真实 LLM provider 答案事实正确。
- 本轮不实现多跳调用链、动态分派、完整 query planner 或生产级 LLM provider 质量评估。
- 真实 public repo smoke 本轮没有强制出现 `Graph relation:` UI marker；该 marker 仍按 optional-present strict 执行。

## P6/P11 增量：Code QA relation-aware retrieval plan audit fields

目标：让 Code QA 的机器可读 `retrievalPlan` 直接暴露 relation-aware 检索路径，避免前端、smoke 或排障工具只能解析 prompt 或 evidence reason。

验收要求：

- `retrievalPlan.crossFileIntentPresent` 必须表示当前问题是否命中 bounded flow/call-chain/调用链/流程意图。
- `retrievalPlan.graphRelationEvidencePresent` 必须表示本次 retrieved chunks 中是否存在 `Graph relation:` evidence reason。
- `retrievalPlan.graphRelationPrimaryLabels` 必须只列出同一响应中 contextRole 为 `PRIMARY` 且 evidence reason 包含 `Graph relation:` 的 source labels。
- `retrievalPlan.graphRelationEvidenceCount` 必须是本次 retrieved chunks 中 graph relation evidence reason 的数量。
- 字段不得包含 raw prompt、raw answer、chunk content、secret、绝对路径或日志栈。
- public repo smoke 必须校验这些字段存在、类型正确、自洽，并输出到 `PUBLIC_REPO_SMOKE_OK.codeQa.retrievalPlan`。
- 真实公开仓库没有 graph relation evidence 时，必须输出 `graphRelationEvidencePresent=false`、`graphRelationEvidenceCount=0`、`graphRelationPrimaryLabels=[]`，不得伪造 relation marker。

验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest#codeQa_shouldIncludeGraphRelationPrimaryEvidenceInstructionInPromptForFlowQuestion+codeQa_shouldPromoteGraphRelationEvidenceToPrimaryForFlowQuestion+codeQa_shouldNotAddGraphRelationContextWhenGraphIsEmpty+codeQa_shouldExposeStableFallbackProfileWhenNoKeywordOrUsableEmbeddingMatches+codeQa_shouldExposeIntentAwareRetrievalPlanForStableFallback test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkServiceTest test`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`node scripts/validate-api-design.mjs`。
- PASS：`bash -n scripts/verify-release-evidence.sh`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh`。
- PASS：真实公开仓库 smoke `scanTaskId=308`，`PUBLIC_REPO_SMOKE_OK`。

非范围：

- 这些字段不证明完整调用链、动态分派、多跳关系、真实 LLM provider 或事实正确性。
- 这些字段不替代 `retrievedChunks[*].evidenceReason` / `answerCitations[*].evidenceReason`，只提供 response-level plan 摘要。

## P6/P11 增量：Code QA query strategy and embedding coverage audit fields

目标：让 Code QA 的检索路径和语义检索可用性成为 API 级事实，支撑 P6 检索质量排障和 P11 smoke/release evidence。

要求：

- `retrievalPlan.queryStrategy` 必须返回主要检索路线，允许值包括 `SOURCE_LOCATION_ANCHOR`、`ENDPOINT_ROUTE_LOOKUP`、`FRONTEND_BACKEND_BRIDGE`、`BACKEND_FLOW_ROLE_EXPANSION`、`SEMANTIC_FALLBACK`、`SEMANTIC_HYBRID`、`ROLE_INTENT_FALLBACK`、`KEYWORD`、`STABLE_FALLBACK`、`NO_CONTEXT`、`NO_SCAN`。
- `retrievalPlan.questionEmbeddingAvailable` 必须表示本次问题 embedding 是否成功生成。
- `retrievalPlan.embeddingCoveragePercent` 必须是 0 到 100 的整数，表示当前扫描任务在 active embedding model 下的 chunk 覆盖率。
- `retrievalPlan.embeddingCoverageStatus` 必须为 `NONE`、`LOW`、`PARTIAL` 或 `READY`。
- `retrievalPlan.semanticPoolAttempted`、`semanticPoolLoadedCount`、`semanticPoolLimit` 必须暴露 semantic pool 尝试和加载规模。
- `retrievalPlan.semanticPlanReason` 必须给出机器可读诊断码，例如 `NO_ACTIVE_LLM`、`QUESTION_EMBEDDING_FAILED`、`NO_MODEL_EMBEDDINGS`、`LOW_EMBEDDING_COVERAGE`、`SEMANTIC_POOL_READY`。

非范围：

- 不证明语义召回充分性。
- 不改变当前 semantic pool 加载策略。
- 不宣称 query planning 已完成。

## P6 增量：Code QA distributed semantic pool

目标：降低大仓库中 semantic pool 只覆盖前 500 个同模型 embedding chunk 的系统性偏差。

要求：

- Code QA 主路径必须调用带 `embeddedChunkCount` 的 semantic pool 加载逻辑。
- 当 active embedding model 下 `embeddedChunks <= semanticPoolLimit` 时，允许使用 `HEAD_ONLY`。
- 当 `embeddedChunks > semanticPoolLimit` 时，semantic pool 必须采用 `HEAD_DISTRIBUTED_WINDOWS`，即头部窗口加多个分布式 offset 窗口。
- 当 `embeddedChunks` 刚超过 `semanticPoolLimit` 时，窗口不得因重叠导致 loaded count 明显低于 pool limit；必须使用 compact tail windows 覆盖尾部目标并保持候选池接近上限。
- `retrievalPlan.semanticPoolStrategy` 必须暴露 `NOT_ATTEMPTED`、`HEAD_ONLY` 或 `HEAD_DISTRIBUTED_WINDOWS`。
- public repo smoke 必须校验 `semanticPoolStrategy` 类型和自洽性。

非范围：

- 该能力不等同于向量索引。
- 该能力不证明所有相关 chunk 都会被召回。

## P6/P11 增量：Code QA semantic pool truncation and coverage diagnostics

目标：让 semantic fallback 的候选池边界成为 API 级事实，支撑 QA、smoke 和后续向量索引决策。

要求：

- `retrievalPlan.semanticPoolTruncated` 必须为 boolean。
- 未尝试 semantic pool 时，`semanticPoolTruncated=false`。
- `retrievalPlan.semanticPoolCoveragePercent` 必须为 0 到 100 的整数。
- 未尝试 semantic pool 时，`semanticPoolCoveragePercent=0`。
- semantic pool 已尝试且 `embeddedChunks > semanticPoolLoadedCount` 时，`semanticPoolTruncated=true`。
- public repo smoke 必须校验字段类型和未尝试场景自洽性；semantic pool probe 必须校验大池截断场景。

非范围：

- 不把 coverage percent 当成召回质量评分。
- 不证明真实 provider 回答事实正确。
- 不替代生产级向量索引。

## P6/P11 增量：Code QA cross-file evidence coverage diagnostics

目标：让 Code QA 在跨文件/流程/调用链问题下直接暴露当前响应是否实际覆盖多个 PRIMARY 文件，避免只凭 `crossFileIntentPresent` 误判 citation 可信度。

要求：

- `retrievalPlan.crossFileEvidenceSatisfied` 必须为 boolean。
- `retrievalPlan.crossFilePrimaryFileCount` 必须为非负整数，表示本次响应中 PRIMARY 证据覆盖的唯一文件数。
- `retrievalPlan.crossFileEvidenceStatus` 必须为 `NOT_APPLICABLE`、`SATISFIED`、`SINGLE_PRIMARY_FILE` 或 `NO_PRIMARY_EVIDENCE`。
- `crossFileEvidenceSatisfied` 必须等价于 `crossFileIntentPresent && crossFilePrimaryFileCount >= 2`。
- `crossFileEvidenceStatus` 必须由 `crossFileIntentPresent` 与 `crossFilePrimaryFileCount` 唯一推导：无跨文件意图为 `NOT_APPLICABLE`，两个及以上 PRIMARY 文件为 `SATISFIED`，一个 PRIMARY 文件为 `SINGLE_PRIMARY_FILE`，零 PRIMARY 文件为 `NO_PRIMARY_EVIDENCE`。
- public repo smoke 必须 fail-closed 校验上述状态机，不允许字段只满足类型正确但语义漂移。
- 后端 focused tests 必须覆盖 `NOT_APPLICABLE`、`SATISFIED` 和 `SINGLE_PRIMARY_FILE`。

非范围：

- 不要求每个真实公开仓库样本都必须命中 `SATISFIED`。
- 不证明完整调用链、多跳关系、动态分派或真实 provider 答案事实正确。
- 不替代 `graphRelationEvidencePresent` / `graphRelationPrimaryLabels` 的关系证据审计。

验证结果：

- PASS：focused `CodeQaControllerTest` 覆盖 `NOT_APPLICABLE`、`SATISFIED` 和 `SINGLE_PRIMARY_FILE`。
- PASS：public repo smoke 静态 gate 校验 boolean 等价关系和 status 唯一映射。
- PASS：真实公开仓库 smoke `scanTaskId=313` 输出 `crossFileEvidenceSatisfied=true`、`crossFileEvidenceStatus=SATISFIED`、`crossFilePrimaryFileCount=4`。

## P6/P11 增量：Report evidence line anchor reason visibility

目标：让报告证据 QA 的 PRIMARY citation 不只证明“引用了哪个文件/行”，还要明确解释“为什么该 citation 是报告证据主锚点”。

要求：

- 当 request `evidenceRef.filePath` 与 chunk file path 匹配，且 `lineNumber` 或 `startLine/endLine` 与 chunk 行区间重叠时，PRIMARY `retrievedChunks[*].evidenceReason` 和对应 `answerCitations[*].evidenceReason` 必须包含 `Report evidence line anchor.`。
- 当 request 只提供 `evidenceRef.filePath` 且未提供行号/范围时，PRIMARY evidence reason 必须可包含 `Report evidence file anchor.`。
- 普通相邻上下文、非 PRIMARY chunk、file path 不匹配 chunk 不得携带 `Report evidence line anchor.`。
- public repo smoke 的 report evidence QA citation sample 必须 fail-closed 校验 line-anchor PRIMARY citation 的 `evidenceReason`。
- smoke marker 必须输出 `lineAnchorEvidenceReasonVisibleSampleCount`，便于 release evidence 和后续 QA 复核。
- Code QA response 不得返回 `retrievedChunks[*].content` 完整源码内容；只允许返回脱敏、截断后的 `contentPreview`。
- `sourceEvidenceRef.filePath` 响应不得回显用户本机绝对路径；本地绝对路径必须转仓库相对路径，无法识别时返回 `[local-path-redacted]`。

非范围：

- 不改变 citation label parser、claim split、LLM prompt 或 provider 选择。
- 不证明 LLM 事实正确、完整代码理解、完整调用链或向量召回充分。
- 不输出 raw prompt、raw answer、完整 chunk content、secret 或用户本地绝对路径。

当前验证结果：

- PASS：focused `CodeQaControllerTest` 覆盖 report evidence file+line anchor、start/end-only alias 和 adjacent context 不携带 line-anchor reason。
- PASS：focused `CodeQaControllerTest` 覆盖 QA response 不返回完整 chunk content、contentPreview 脱敏、本地绝对 evidence path 响应相对化。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh`。
- PASS：`Sartre = 拉里佩奇 / QA Engineer` 修复后只读复核 PASS。
- PASS：真实公开仓库 smoke `scanTaskId=315`，`reportEvidenceQaCitationQuality.lineAnchorEvidenceReasonVisibleSampleCount=4`，`lineAnchorCitationStatus=ALL_SAMPLES_BOUND`。

## P6/P10/P11 增量：Code QA raw chunk content absence smoke gate

目标：把 Code QA response 不返回完整 `retrievedChunks[*].content` 从后端 focused test 提升为 public repo smoke/release evidence 门禁。

要求：

- public repo smoke 必须 fail-closed 校验所有 `/qa` payload 的 `retrievedChunks` 不包含 `content` 字段。
- 校验范围必须覆盖普通 Code QA、report evidence QA citation、claim citation noise boundary、weak keyword eval 和 semantic pool probe。
- smoke marker 必须输出 `rawRetrievedChunkContentAbsent`、sample count 或 case count，证明该边界不是只靠文档声明。
- `contentPreview` 允许存在，但必须保持服务端脱敏和截断；smoke 对过长 preview 直接失败。

非范围：

- 不改变底层 code chunk search API 的 `content/contentPreview` 合同。
- 不新增 raw source 查看、下载或复制授权。
- 不证明真实 LLM provider 事实正确。

当前验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh`。
- PASS：public repo smoke Python heredoc compile。
- PASS：真实公开仓库 smoke `scanTaskId=317`，`PUBLIC_REPO_SMOKE_OK`。
- PASS：`codeQa.rawRetrievedChunkContentAbsent=true`，`claimCitationNoiseBoundary.rawRetrievedChunkContentAbsent=true`，`semanticWeakKeywordProbe.rawRetrievedChunkContentAbsent=true`。
- PASS：`reportEvidenceQaCitationQuality.rawRetrievedChunkContentAbsentSampleCount=4`，`projectQaWeakKeywordEvaluation.rawRetrievedChunkContentAbsentCaseCount=4`，`maxContentPreviewLength=615`。

## P6/P10/P11 增量：Release verifier raw chunk content absence gate

目标：把 Code QA raw content absence 从 smoke 输出提升为 release verifier 强制验收项。

要求：

- `verify-release-evidence.sh` 必须校验 `codeQa.rawRetrievedChunkContentAbsent=true` 和 `contentPreviewMaxLength <= 700`。
- claim citation noise boundary 必须校验同一 raw content absence marker。
- report evidence QA citation 必须校验 `rawRetrievedChunkContentAbsentSampleCount == sampleCount`，并校验每个 sample 的 raw marker 和 preview 长度。
- weak keyword eval 在非 disabled/skipped 状态下必须校验 raw marker 计数和 preview 长度；OK 状态必须校验每个 case。
- `semanticWeakKeywordProbe` 出现时必须校验 raw marker、semantic pool strategy、truncation 和 retrieved primary 边界。
- `security-regression-check.sh --suite release-verifier-public-repo-marker` 必须覆盖缺失/伪造 Code QA raw marker 被拒绝。

非范围：

- 不把 semantic probe 改为旧 evidence 的硬必选字段。
- 不改变 raw source/code chunk search API。
- 不证明真实 LLM provider 答案事实正确。

当前验证结果：

- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。
- PASS：`node scripts/validate-api-design.mjs`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh && bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh && git diff --check`。

## P6/P11 增量：Code QA semantic readiness status and reason

目标：把 Code QA semantic retrieval 的可用性从散落的诊断字段提升为机器可读状态机，便于前端、QA、release evidence 和后续告警直接判断。

要求：

- `retrievalPlan.semanticReadinessStatus` 必须返回固定状态：`NOT_APPLICABLE`、`DISABLED`、`UNAVAILABLE`、`DEGRADED`、`READY`。
- `retrievalPlan.semanticReadinessReason` 必须返回固定原因码：`NO_SCAN`、`NO_CONTEXT`、`NO_ACTIVE_LLM`、`QUESTION_EMBEDDING_FAILED`、`QUESTION_EMBEDDING_UNAVAILABLE`、`NO_MODEL_EMBEDDINGS`、`LOW_EMBEDDING_COVERAGE`、`PARTIAL_EMBEDDING_COVERAGE`、`SEMANTIC_POOL_EMPTY`、`SEMANTIC_POOL_TRUNCATED`、`SEMANTIC_READY`。
- 状态必须由 scan/context、active LLM、question embedding、embedding coverage、semantic pool 是否为空/截断唯一推导。
- public repo smoke 必须校验普通 Code QA 和 semantic weak keyword probe 的 readiness 字段。
- release verifier 必须在 semantic probe 出现时校验 readiness 状态和原因。

非范围：

- 不引入生产向量索引。
- 不证明真实 provider 答案事实正确。
- 不改变 raw access 权限模型。

当前验证结果：

- PASS：focused `CodeQaControllerTest`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh && bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`。
- PASS：`node scripts/validate-api-design.mjs`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：真实公开仓库 smoke `scanTaskId=318`，普通 Code QA `semanticReadinessStatus=DISABLED` / `semanticReadinessReason=NO_ACTIVE_LLM`；semantic weak keyword probe `semanticReadinessStatus=DEGRADED` / `semanticReadinessReason=LOW_EMBEDDING_COVERAGE`。

## P6/P11 增量：Code QA route-aware ranking prefilter

目标：削减大仓库 endpoint route Code QA 的 ranking 热点，避免明显无 route/mapping/constant/API 信号的 chunk 进入昂贵 previous-context scoring。

要求：

- prefilter 只在 endpoint route 查询启用；非 endpoint 查询行为不变。
- 必须保留 controller、Spring mapping annotation、route holder、frontend/API path、直接 route literal/segment mention。
- 若 prefilter 没有候选，必须回退全量候选，避免误杀极端仓库。
- previous same-file context 能力必须保留，`@RequestMapping("/api/auth")` + `@GetMapping("/login")` 仍应命中 `GET /api/auth/login`。

非范围：

- 不声明完整性能基准完成。
- 不改变 Code QA citation、semantic readiness 或 raw access 合同。
- 不证明真实 provider 答案质量。

当前验证结果：

- PASS：`CodeChunkServiceTest#rankWithPreviousSameFileContext_shouldPrefilterNonRouteNoiseForEndpointQueries`。
- PASS：route constant / previous context focused tests。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest test`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh && bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`。

## P6/P11 增量：Code QA Spring mapping lookup cache

目标：把 report evidence QA citation 暴露出的 Spring route ranking CPU 热点收口，避免每个候选在同一轮 scoring 中重复解析 mapping literals、class range、exact/template/composed route 和 HTTP method。

要求：

- direct context 和 previous same-file context 必须分别构建一次 `SpringMappingLookup` 并在 score、strong route match、Spring mapping match 中复用。
- Spring mapping lookup 必须覆盖 exact route、template route、composed class-level + method-level route 和 HTTP method matching。
- 非 Spring mapping 内容必须快速返回 empty lookup，避免 frontend/API/route holder 候选进入无意义 regex 扫描。
- 既有 route constant、previous same-file context、prefilter regression 和 Code QA retrieval 回归必须保持通过。

非范围：

- 不改变 API 响应结构。
- 不改变 raw access、citation coverage、semantic readiness 合同。
- 不声明完成生产级全量性能基准。

当前验证结果：

- PASS：focused route-aware ranking tests。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest test`。
- PASS：`node scripts/validate-api-design.mjs`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh && bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh && git diff --check`。
- PASS：真实公开仓库 smoke `scanTaskId=323`，`PUBLIC_REPO_SMOKE_OK`，总耗时 `63s`，`reportEvidenceQaCitationQuality.status=OK`。

## P6/P11 增量：Weak keyword role-intent ordering

目标：把弱关键词/低信号 Code QA 从“代码优先”推进到“按问题意图优先选择代码层”。

要求：

- operational policy 类问题，例如“子任务可以使用哪些能力在哪里判断”“危险命令参数在哪里被拒绝”，role intent 第一位必须是 `SERVICE`，并保留 `CONFIG` 和 `CONTROLLER` 作为后续候选层。
- data loading 类问题，例如“实验开关数据在哪里加载”，role intent 第一位必须是 `DATA_ACCESS`，并保留 `SERVICE` 和 `CONFIG`。
- role-intent score 必须尊重 intent 顺序，避免后加入的泛化角色压过首要角色。
- 配置源码路径，例如 `src/commands/config/index.ts`、`src/main/resources/application.yml`，证据类型必须归类为 `CONFIG`，不能泛化为 `SOURCE`。
- no-embedding 情况下 `projectQaWeakKeywordEvaluation.status=INCONCLUSIVE` 仍是正确质量边界，不得把 deterministic fallback 宣称为 semantic retrieval success。

非范围：

- 不引入向量数据库。
- 不证明真实 LLM provider 或真实 embedding provider 质量。
- 不刷新 full release authority。
- 不要求每个低信号自然语言问题都被完整 query planner 解析。

当前验证结果：

- PASS：focused `CodeChunkServiceTest` 覆盖 operational policy、data loading、CONFIG evidence type 和 weak keyword keyword-candidate ordering。
- PASS：`node scripts/validate-api-design.mjs`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh && bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh && git diff --check`。
- PASS：`Tesla = 拉里佩奇 / QA Engineer` 只读复核当前切片无必须补的测试缺口和阻塞 P6 focused 验收风险。

## P6/P11 增量：Bounded public repo retrieval quality matrix

目标：把 P6 检索质量从 focused tests 推进到真实公开仓库矩阵门禁，覆盖扫描、code_chunks、Code QA、弱关键词样本、semantic pool probe、report evidence QA citation 和 artifact quality。

要求：

- 新增 `scripts/p6-retrieval-quality-matrix.sh`，默认以 bounded public repo quality matrix 运行，不声明 benchmark、provider quality 或 full release authority。
- `Pawnshop-Management-System` 弱关键词样本必须与该仓库真实领域对齐，不得使用 SourceLens 专属 Agent/Sandbox 问题强套外部仓库。
- `src/main/resources/admin/src/**`、`src/main/resources/front/src/**` 这类前端静态资源必须归类为 `FRONTEND`，不能因路径包含 `config` 被归为 `CONFIG`。
- `pom.xml` / `pom-*.xml` / Gradle 构建文件必须归类为 `DOCUMENTATION`，不能作为运行配置证据压过业务代码。
- `src/commands/**` 和 JS/TS `src/utils/model/**` 必须归类为 `SOURCE`，不能因目录名 `config` 或 `model` 被归为 `CONFIG` / `DOMAIN_MODEL`。
- semantic pool probe 必须先清理当前临时 scan 的 embedding，再写入可控 head pool + target embedding，避免后台 embedding 任务导致窗口选择漂移。

非范围：

- 不引入向量数据库。
- 不证明真实 LLM provider 或真实 embedding provider 质量。
- 不宣称完成多仓库 benchmark。
- 不刷新 full release authority。

当前验证结果：

- PASS：`SOURCELENS_BASE_URL=http://localhost:19112 SOURCELENS_P6_RETRIEVAL_MATRIX_MIN_REPOS=1 SOURCELENS_P6_RETRIEVAL_MATRIX_CASES='default-java|https://github.com/LJunP/Pawnshop-Management-System.git|main|default-strong' ./scripts/p6-retrieval-quality-matrix.sh`。
- PASS：`P6_RETRIEVAL_QUALITY_MATRIX_OK`，`scanTaskId=339`，`durationSeconds=103`，`repoCount=1`，`benchmarkClaim=false`，`providerQualityClaim=false`。
- PASS：`projectQaWeakKeywordEvaluation.status=OK`，`qualityMode=INTENT_ROLE_BOUND`，4/4 role-bound。
- PASS：`semanticWeakKeywordProbe.status=OK`，`reportEvidenceQaCitationQuality.status=OK`，artifact quality OK。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaRetrievalEvalCorpusTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest test`。
- PASS：API/UI validators、release verifier marker security regression、`git diff --check`。

## P6/P11 增量：JavaParser Java 14+ compatibility and pattern variable graph coverage

目标：关闭 spring-petclinic 真实公开仓库暴露的 Java 14+ `instanceof pattern` 解析告警，并让 pattern variable 方法调用进入 AST CALLS relation。

要求：

- Java AST parser 必须使用支持现代 Java 语法的固定 language level，不能依赖 JavaParser 默认语言级别。
- `instanceof RuntimeException runtimeException` 这类 Java 14+ pattern matching 不能导致整文件 AST 解析失败。
- pattern variable 必须进入 method visible type map，使 `runtimeException.getMessage()` 可解析为 `java.lang.RuntimeException#getMessage()` CALLS relation。
- 修复必须保留既有 injected field、local variable、catch parameter、try resource、Lombok accessor、IService inherited method、wildcard import 和 JDK type normalization 回归。

非范围：

- 不升级 javaparser 依赖版本。
- 不引入完整 Java symbol solver。
- 不声明完整 Java 21 语义覆盖。
- 不证明真实 LLM provider answer quality。

当前验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest test`。
- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest,JavaFallbackAnalyzerTest,AnalysisServiceTest,CodeGraphPersistenceServiceTest,CodeChunkServiceTest test`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/p6-retrieval-quality-matrix.sh`。
- PASS：spring-petclinic public repo smoke `scanTaskId=349`，`PUBLIC_REPO_SMOKE_OK`，raw `symbols=292`，`graphNodes=292`，DB `relations=407`。
- PASS：后端扫描日志未再出现 JavaParser `ParseProblemException`；之前的 Java 14 `instanceof pattern` 文件级解析告警已关闭。

## P6/P11 增量：Java AST parse diagnostics and smoke fail-closed gate

目标：把 Java AST 文件级解析失败从“日志里的隐性问题”升级为 RAW_SCAN_RESULT 可审计字段和 public repo smoke 门禁。

要求：

- `JavaAstParser.ParseResult` 必须暴露解析是否成功和错误摘要。
- `RAW_SCAN_RESULT.java_ast_diagnostics` 必须包含 `total_java_files`、`parsed_java_files`、`failed_java_files`、`failed_file_paths` 和 `status`。
- public repo smoke 在 `java_ast_diagnostics` 存在时必须校验字段类型、计数自洽、失败路径数量一致。
- public repo smoke 必须在 `failed_java_files > 0` 或 `status != OK` 时 fail-closed。

非范围：

- 不引入完整 Java symbol solver。
- 不改变扫描任务成功/失败状态机。
- 不定义所有第三方仓库坏源码容忍策略。

当前验证结果：

- PASS：`mvn -q -f backend-spring/pom.xml -Dtest=JavaAstParserTest,JavaFallbackAnalyzerTest,AnalysisServiceTest,CodeGraphPersistenceServiceTest,CodeChunkServiceTest test`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/p6-retrieval-quality-matrix.sh`。
- PASS：`git diff --check`。
- PASS：spring-petclinic public repo smoke `scanTaskId=350`，`rawScanContract.javaAstDiagnostics.status=OK`，`totalJavaFiles=48`，`parsedJavaFiles=48`，`failedJavaFiles=0`。

## P6/P11 增量：Retrieval quality matrix Java AST diagnostics gate

目标：把 Java AST parse diagnostics 从单仓 public repo smoke 提升到 P6 多仓库质量矩阵门禁。

要求：

- `PUBLIC_REPO_SMOKE_OK.rawScanContract.javaAstDiagnostics` 必须带出 `status`、`totalJavaFiles`、`parsedJavaFiles`、`failedJavaFiles` 和 `failedFilePaths`。
- `p6-retrieval-quality-matrix.sh` 必须校验 Java diagnostics 字段类型、计数自洽、失败路径数量一致。
- `generic-java` profile 必须存在 Java diagnostics，且 `totalJavaFiles > 0`。
- matrix 必须在任一成功 marker 的 Java diagnostics `status != OK` 或 `failedJavaFiles > 0` 时 fail-closed。
- matrix 最终 marker 必须输出 `javaAstDiagnosticsRepoCount`，证明至少一个 Java 仓库进入该门禁。

非范围：

- 不新增仓库样本。
- 不声明完整 benchmark。
- 不证明真实 LLM provider 或真实 embedding provider 质量。
- 不刷新 full release authority。

当前验证结果：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/p6-retrieval-quality-matrix.sh`。
- PASS：默认双仓 `SOURCELENS_BASE_URL=http://localhost:19115 ./scripts/p6-retrieval-quality-matrix.sh`。
- PASS：`P6_RETRIEVAL_QUALITY_MATRIX_OK`，`repoCount=2`，`javaAstDiagnosticsRepoCount=2`。
- PASS：Pawnshop `scanTaskId=352`，`totalJavaFiles=289`，`parsedJavaFiles=289`，`failedJavaFiles=0`。
- PASS：spring-petclinic `scanTaskId=353`，`totalJavaFiles=48`，`parsedJavaFiles=48`，`failedJavaFiles=0`。

## P6/P11 增量：Three-repo retrieval matrix with generic Java library profile

目标：把 P6 默认 matrix 从业务系统 + Spring Web 扩展到纯 Java library 仓库，避免质量门禁只覆盖 Web/API 形态。

要求：

- 默认 `p6-retrieval-quality-matrix.sh` 必须包含 3 个公开仓库：
  - `LJunP/Pawnshop-Management-System.git` / `default-strong`
  - `spring-projects/spring-petclinic.git` / `generic-java`
  - `apache/commons-cli.git` / `generic-java-library`
- `generic-java-library` profile 不得强制 Controller/DataAccess/API route citation 等 Web 仓库假设。
- library profile 必须传入领域查询：
  - source role query：`src/main/java/org/apache/commons/cli/DefaultParser.java parse command line options`
  - Code QA question：`DefaultParser parse command line options flow`
  - cross-file proof query：`src/main/java org.apache.commons.cli option parser commandline`
- matrix marker 必须输出 `profileCounts`。
- 默认 matrix 必须输出 `repoCount=3` 和 `javaAstDiagnosticsRepoCount=3`。

非范围：

- 不声明完整 benchmark。
- 不证明真实 LLM provider 或真实 embedding provider 质量。
- 不要求纯 Java library 仓库具备 API route、DB entity、Controller 或 DataAccess 层。
- 不刷新 full release authority。

当前验证结果：

- PASS：commons-cli 单仓 smoke `scanTaskId=359`，`javaAstDiagnostics.status=OK,totalJavaFiles=87,parsedJavaFiles=87,failedJavaFiles=0`。
- PASS：默认三仓 matrix `P6_RETRIEVAL_QUALITY_MATRIX_OK`。
- PASS：`repoCount=3`，`javaAstDiagnosticsRepoCount=3`，`profileCounts={default-strong:1,generic-java:1,generic-java-library:1}`。
- PASS：Pawnshop `scanTaskId=360`，spring-petclinic `scanTaskId=361`，commons-cli `scanTaskId=362`。
- 已记录风险：commons-cli cross-file proof 仍偏测试文件，后续需要继续优化 library production-source ranking。

## P6/P11 增量：Java library production-source ranking gate

目标：关闭 commons-cli 暴露的 library cross-file proof TEST 偏置，让 `src/main/java` 查询稳定优先生产源码，并把该要求写入默认三仓矩阵。

要求：

- `sourceRootHints` 必须识别裸 `src/main/java`、`src/main/kotlin`、`src/main/resources` 等 source-root query。
- `CodeChunkRanker` 必须消费 source-root hint，且该排序信号不得覆盖精确文件、方法和行号锚点。
- 非 TEST 意图下，`src/test` 文件不得吃 primary source boost，并应被稳定降权。
- 显式测试文件查询仍必须能优先命中 TEST 文件。
- `generic-java-library` profile 必须要求 cross-file proof 至少包含 2 个非 TEST 主源码文件。

非范围：

- 不全局排除测试文件。
- 不声明完整 benchmark。
- 不证明真实 LLM provider 或真实 embedding provider 质量。
- 不引入向量数据库或重写 query planner。

当前验证结果：

- PASS：`mvn -q -Dtest=CodeChunkServiceTest test`。
- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/p6-retrieval-quality-matrix.sh`。
- PASS：commons-cli 单仓 smoke `scanTaskId=363`，`mainSourceUniqueFiles=8`，`minMainSourceFiles=2`。
- PASS：默认三仓 matrix `P6_RETRIEVAL_QUALITY_MATRIX_OK`。
- PASS：默认三仓 matrix：Pawnshop `scanTaskId=364`，spring-petclinic `scanTaskId=365`，commons-cli `scanTaskId=366`。
- PASS：commons-cli `crossFileRetrievalProof.fileDistribution` 前五项均为 `src/main/java/...` SOURCE 文件。

## P6/P11 增量：Five-repo retrieval matrix with JS/TS profiles

目标：把 P6 bounded retrieval quality matrix 从 Java/JVM 主导扩展到 5 个公开仓库，并纳入 JS/TS web framework 和 JS/TS library profile。

要求：

- 默认 `p6-retrieval-quality-matrix.sh` 必须包含 5 个唯一公开仓库：
  - `LJunP/Pawnshop-Management-System.git` / `default-strong`
  - `spring-projects/spring-petclinic.git` / `generic-java`
  - `apache/commons-cli.git` / `generic-java-library`
  - `expressjs/express.git` / `generic-js-ts-web`
  - `axios/axios.git` / `generic-js-ts-library`
- JS/TS profile 必须禁用 Java/Web/Spring 专用 role probe，不得要求 Java AST diagnostics。
- JS/TS cross-file proof 必须至少包含 2 个源码文件，不能只由 docs/config/test 文件凑数。
- matrix marker 必须输出 `languageFamilyCounts`、`profileCounts` 和 `jsTsNonJavaProfileCount`。
- `generic-js-ts-web` 和 `generic-js-ts-library` 至少各 1 个，JS/TS 非 Java profile 至少 2 个。

非范围：

- 不声明完整 benchmark。
- 不证明真实 LLM provider 或真实 embedding provider 质量。
- 不刷新 full release authority。
- 不把 redux 当前失败解释为产品失败；它是候选样本被 gate 拒绝的有效证据。

当前验证结果：

- PASS：axios 单仓 smoke `scanTaskId=371`，`sourceUniqueFiles=7`，`minSourceFiles=2`。
- PASS：默认五仓 matrix `P6_RETRIEVAL_QUALITY_MATRIX_OK`。
- PASS：matrix marker：`repoCount=5`，`javaAstDiagnosticsRepoCount=3`，`languageFamilyCounts={mixed:1,java:2,js-ts:2}`，`jsTsNonJavaProfileCount=2`。
- PASS：profile 覆盖 `default-strong/generic-java/generic-java-library/generic-js-ts-web/generic-js-ts-library`。
- 已拒绝候选：redux 单仓 smoke 因 `dependency graph has no nodes` 失败，不进入默认矩阵。

## P6/P11 增量：Retrieval matrix performance budget and QA citation trust gate

目标：把 P6 五仓矩阵从“功能通过”升级为“功能、引用可信度、耗时预算同时通过”。

要求：

- `p6-retrieval-quality-matrix.sh` 必须支持：
  - `SOURCELENS_P6_RETRIEVAL_MATRIX_PER_REPO_MAX_SECONDS`，默认 `240`。
  - `SOURCELENS_P6_RETRIEVAL_MATRIX_TOTAL_MAX_SECONDS`，默认 `600`。
- 单仓耗时超过预算时必须 fail-closed。
- 总耗时超过预算时必须 fail-closed。
- matrix marker 必须输出：
  - `totalDurationSeconds`
  - `maxCaseDurationSeconds`
  - `performanceBudget.status/perRepoMaxSeconds/totalMaxSeconds`
- Code QA citation 在 matrix 中不得为 `PARTIAL`，必须为 `FULL` 或 `REQUIRED_FULL`。
- `claimCitationCoverage.status` 必须为 `READY`。
- `crossFileCitationSummary` 必须满足：
  - `visible=true`
  - `currentScanOnly=true`
  - `citationBindingSatisfied=true`
  - `claimBindingSatisfied=true`

非范围：

- 不声明生产 P95/P99 benchmark。
- 不证明真实 LLM provider 或真实 embedding provider 质量。
- 不优化具体 ranking 热点。
- 不扩大仓库样本。

当前验证结果：

- PASS：默认五仓 matrix `P6_RETRIEVAL_QUALITY_MATRIX_OK`。
- PASS：`totalDurationSeconds=144`，`maxCaseDurationSeconds=111`。
- PASS：`performanceBudget={status:OK,perRepoMaxSeconds:240,totalMaxSeconds:600}`。
- PASS：5 个仓库均满足 `citationCoverageStatus=REQUIRED_FULL`、`claimCitationCoverageStatus=READY`、`crossFileCitationCurrentScanOnly=true`、`citationBindingSatisfied=true`、`claimBindingSatisfied=true`。

## P6/P11 增量：Extended eight-repo retrieval matrix preset

目标：保留默认 5 仓日常 gate，同时新增阶段验收用 extended preset，把 P6 检索质量覆盖扩展到 Python Web、JS/TS Web framework 变体和 JS/TS CLI library。

要求：

- `p6-retrieval-quality-matrix.sh` 必须支持 `SOURCELENS_P6_RETRIEVAL_MATRIX_PRESET=standard|extended`，默认 `standard`。
- `standard` 继续保持 5 仓，`extended` 必须至少 8 仓。
- extended 必须覆盖：
  - `generic-js-ts-web-koa`
  - `generic-python-web`
  - `generic-js-ts-cli-library`
- 未知 profile 必须 fail-closed，不能静默套用默认 profile。
- extended marker 必须输出并校验：
  - `preset=extended`
  - `repoCount=8`
  - `pythonProfileCount >= 1`
  - `cliLibraryCount >= 1`
  - `languageFamilyCounts`
  - `profileCounts`
  - `performanceBudget.status=OK`

非范围：

- 不把 extended preset 设为日常默认。
- 不声明完整生产 benchmark。
- 不证明真实 LLM provider、真实 embedding provider 或向量检索质量。

当前验证结果：

- PASS：extended 8 仓 matrix `P6_RETRIEVAL_QUALITY_MATRIX_OK`。
- PASS：`repoCount=8`，覆盖 Pawnshop、spring-petclinic、commons-cli、express、axios、koa、flask、commander。
- PASS：`languageFamilyCounts={mixed:1,java:2,js-ts:4,python:1}`。
- PASS：`profileCounts` 覆盖 `default-strong/generic-java/generic-java-library/generic-js-ts-web/generic-js-ts-library/generic-js-ts-web-koa/generic-python-web/generic-js-ts-cli-library`。
- PASS：`pythonProfileCount=1`，`cliLibraryCount=1`。
- PASS：`totalDurationSeconds=160`，`maxCaseDurationSeconds=102`，`performanceBudget={status:OK,perRepoMaxSeconds:240,totalMaxSeconds:600}`。
- 已拒绝候选：FastAPI 因 dependency graph 无节点失败；Chalk 因 Code QA 偏单文件未进入强矩阵。

## P9/P10/P12-pre 增量：Product positioning, access model and role-based information architecture

目标：把 SourceLens 的产品形态从“功能模块堆叠控制台”收敛为“前台体验 / 开发者控制台 / 后台治理”三平面产品结构，并明确目标用户到页面、权限、导航、主流程和指标的映射；历史英文 `Developer Workbench / Engineering Governance Console / Admin & Security Console` 只作为旧别名。

要求：

- `PRODUCT_POSITIONING_AND_ACCESS_MODEL.md` 必须作为 P9/P10/P12-pre 产品分层和 RBAC 方向的权威输入。
- 当前不拆成两个独立前端应用；继续在一个 `web-console` 内通过导航、路由分组和权限模型完成产品分层。
- P9 导航重构必须按三平面组织：
  - 前台体验
  - 开发者控制台
  - 后台治理
- P10/P12-pre RBAC 设计必须兼容：
  - `PlatformAdmin`
  - `OrgOwner`
  - `ProjectMaintainer`
  - `Developer`
  - `Viewer`
  - `SecurityAuditor`
  - `AgentOperator`
- 页面新增或重构时必须说明目标用户、主流程位置、允许动作、风险动作和指标归属。
- Dashboard 后续不得只展示功能卡片，必须围绕 Trusted Engineering Loop、仓库分析、报告证据、QA 可信度、任务闭环和风险恢复组织。

非范围：

- 本轮不立即实现完整组织、多用户、RBAC schema 或企业后台。
- 本轮不做营销官网。
- 本轮不把 GitHub App、私有仓库、多租户、生产部署前置到当前 P6 主链路。

当前验证结果：

- PASS：新增 `docs/PRODUCT_POSITIONING_AND_ACCESS_MODEL.md`，定义产品最终形态、三平面分层、目标用户优先级、权限矩阵、导航 IA、主流程和指标。
- PASS：README、Product Governance、Product Metrics、Backlog、Decision Register、Handoff 和 Product Progress 已同步该方向。

## P9 增量：Three-plane navigation and north-star Dashboard first slice

目标：把 P9 从产品定义推进到可见产品实现，先落地三平面导航和 Dashboard 北极星信息架构。

要求：

- App shell 导航必须按三平面组织：
  - 前台体验
  - 开发者控制台
  - 后台治理
- 顶部栏必须显示当前页面所属产品平面；窄屏必须折叠辅助标签，不能挤压标题。
- Dashboard 第一屏必须展示 `Trusted Engineering Loop Completion Rate`。
- Dashboard 必须展示仓库接入、可信扫描、代码证据、风险与下一步四阶段闭环状态。
- Dashboard 必须保留下一步行动和阻塞原因，不得只展示静态指标。
- Dashboard status、latest scan repo/project/meta 不得用 ellipsis/nowrap 裁切关键上下文。
- Smoke 必须覆盖 `1440x900 / 390x844 / 320x740`。

非范围：

- 不实现 RBAC。
- 不拆独立后台。
- 不改后端 Dashboard API。
- 不宣称 Admin & Security Console 已经是完整后台。
- 不宣称 P9 全部完成。

当前验证结果：

- PASS：`npm run build`。
- PASS：`npx playwright test tests/app-shell-ui-smoke.spec.ts --config=playwright.app-shell-ui.config.ts`。
- PASS：`npx playwright test tests/dashboard-next-action-smoke.spec.ts --config=playwright.dashboard-next-action.config.ts`。
- PASS：`git diff --check`。

## P9/P10/P11/P12-pre 增量：Top-level 62 operating definitions freeze

目标：把 SourceLens 顶级产品级必须明确的产品、工程、运营、企业交付和商业化定义封顶为 62 项，防止项目继续在制度层无限扩张，并把后续工作切回 P6/P9/P10/P11/P12-pre 产品主线。

要求：

- 必须新增 `TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md`，集中列出 1-62 项定义。
- 62 项必须覆盖：
  - 产品和工程基础定义 1-34。
  - 运营、规模化和平台化定义 35-50。
  - 公司级商业化与企业交付定义 51-62。
- 必须明确 62 项不是全部立刻实现，而是方向、边界、状态和归口全部明确。
- 必须明确封顶规则：后续不得继续新增“第 63 项”式制度扩张，除非战略转向、法律要求、重大安全事故或企业客户强制要求。
- 必须把总纲接入 README、董事长入口、公司操作系统、产品治理、backlog、ADR、进度、交接、风险和质量评分。

非范围：

- 不立即实现 RBAC、企业多租户、法务条款、SLO/SLA、定价、客户成功和认证路线。
- 不因为 62 项定义完成而宣称企业版、生产版或商业化完成。
- 不中断 P6/P9/P10/P11/P12-pre 主线。

当前验证结果：

- PASS：新增 `docs/TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md`。
- PASS：README、CHAIRMAN_BRIEFING、SOURCELENS_OPERATING_SYSTEM、PRODUCT_GOVERNANCE、PHASE_REQUIREMENTS、WORK_INTAKE、ADR、Progress、Handoff、Risk、Quality 已同步。
- PASS：`make code-map` 与 `make code-map-check` 已刷新并通过。

## P9 增量：ProjectDetail trusted engineering loop

目标：ProjectDetail 必须把项目主链路从“功能 tab 集合”提升为可见的可信工程闭环，直接展示 F1 仓库分析、F2 源码理解、F4 修复候选和 F5 安全审计。

要求：

- ProjectDetail 首屏主链路状态后必须展示 `项目主链路闭环` 面板。
- 面板必须包含 F1/F2/F4/F5 四个步骤，并为每步提供明确 owner、状态、解释和下一步动作。
- 移动端必须折叠为单列；极窄屏下 step 内部也必须单列，不能产生横向溢出。
- app-shell UI smoke 必须显式断言面板可见、步骤数量、步骤名称、响应式列数和 marker 覆盖项。

非范围：

- 不改后端 API、RBAC、真实指标持久化或 release evidence schema。
- 不声明 P9 全部完成。

当前验证结果：

- PASS：`npm run build`。
- PASS：`npx playwright test tests/app-shell-ui-smoke.spec.ts --config=playwright.app-shell-ui.config.ts`。
- PASS：`APP_SHELL_UI_SMOKE_OK.layoutGuards` 包含 `project-detail-trusted-loop-readable-and-responsive`。

## P9 增量：ScanTaskDetail trusted report loop

目标：ScanTaskDetail 必须把扫描报告从“报告模块集合”提升为可见的可信报告闭环，直接展示报告结论、证据引用、code_chunks、修复候选和审计治理五段责任链。

要求：

- 报告总览首屏必须展示 `扫描报告可信闭环` 面板。
- 面板必须包含 T1/T2/T3/T4/T5 五个步骤，并为每步提供明确 owner、状态、说明和下一步动作。
- 移动端必须折叠为单列，避免 390px/320px 下卡片拥挤或横向溢出。
- `report-evidence-drawer` smoke 必须显式断言面板可见、步骤数量、步骤名称、响应式列数和 marker 覆盖项。

非范围：

- 不改后端 API、RBAC、真实指标持久化、AutoRepair 后端逻辑或 release evidence schema。
- 不声明 P9 全部完成。

当前验证结果：

- PASS：`npm run build`。
- PASS：`npx playwright test tests/report-evidence-drawer-smoke.spec.ts --config=playwright.report-evidence-drawer.config.ts`。
- PASS：`REPORT_EVIDENCE_DRAWER_SMOKE_OK.trustedReportLoop.surface=SCAN_TASK_DETAIL_TRUSTED_REPORT_LOOP`。

## P9/P11 增量：Dashboard API-backed trusted loop metrics

目标：Dashboard 的 Trusted Engineering Loop 北极星指标必须进入后端 API 合同，前端只能优先展示 API 结果，并在 API 字段缺失或请求失败时明确 fallback。

要求：

- `/api/dashboard/stats` 必须返回 `trustedLoopCompletionRate`、`trustedLoopStatus`、`trustedLoopStatusLabel`、`trustedLoopReadyStages`、`trustedLoopTotalStages`、`reportEvidenceReady`、`codeQaReadiness`、`recoverySignal`、`trustedLoopMetricsSource`。
- 后端必须由 `ScanStatService` 根据仓库、扫描、code_chunks、风险和运行状态计算，不接受 Controller 纯静态拼字段。
- Dashboard 必须优先使用 API 字段；旧后端或失败场景必须保留本地 fallback。
- `dashboard-next-action` smoke 必须证明正常场景显示 `API-backed metrics`，请求失败和旧 stats 成功但缺新字段场景显示 `client fallback`，并把 API/fallback 覆盖写入 marker。

非范围：

- 不新增数据库表、不做独立指标仓库、不改 release evidence schema、不实现 RBAC 或生产 SLO。
- 不声明 P9/P11 全部完成。

当前验证结果：

- PASS：`cd backend-spring && mvn -q -Dtest=DashboardControllerTest,ScanStatServiceTest test`。
- PASS：`npm run build`。
- PASS：`npx playwright test tests/dashboard-next-action-smoke.spec.ts --config=playwright.dashboard-next-action.config.ts`。
- PASS：`npx playwright test tests/app-shell-ui-smoke.spec.ts --config=playwright.app-shell-ui.config.ts`。
- PASS：`Laplace / 019f3c19-e7b8-73f2-bed6-ee5bb06b0ee2 = 拉里佩奇 / QA Engineer` 二轮只读复核。

## P11/P9 增量：Dashboard metrics source release verifier gate

目标：Dashboard 指标来源进入 `/api/dashboard/stats` 后，release evidence verifier 必须强制证明 `dashboardStatsApiSignals`，防止发布证据只证明 Dashboard 推荐分支和截图，而漏掉 API-backed/fallback 来源。

要求：

- `verify-release-evidence.sh` 在 `dashboard-next-action-ui-smoke` 为 OK 时必须解析唯一 `DASHBOARD_NEXT_ACTION_SMOKE_OK`。
- marker 必须包含 `dashboardStatsApiSignals.sourceLabelSelector=.sl-dashboard-metrics-source`。
- marker 必须证明 6 个非失败场景为 API-backed：`connect-repository`、`watch-running-scan`、`start-first-scan`、`inspect-code-chunks`、`review-risk-report`、`ask-code-qa`。
- marker 必须证明 `recover-dashboard` 是请求失败 fallback。
- marker 必须证明 `legacyStatsFallbackCase=legacy-stats-without-api-fields`。
- `security-regression-check.sh --suite release-verifier-dashboard-ui-marker` 必须拒绝缺 `dashboardStatsApiSignals`、缺 API-backed case、缺 fallback case、缺 legacy fallback 和错误 source selector 的 forged marker。

非范围：

- 不改 release evidence 执行命令、不新增 smoke step、不改 Dashboard UI、不改后端 API、不做生产 SLO。
- 不声明 P11 全部完成。

当前验证结果：

- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-dashboard-ui-marker`。

## P11/P9 增量：Release evidence inventory Dashboard metrics source evidence

目标：release evidence inventory 必须盘点 Dashboard metrics source marker 的完整性，暴露旧 evidence 包缺少 `dashboardStatsApiSignals` 的事实，不允许把旧包误判为新指标来源证据完整。

要求：

- `release-evidence-inventory.mjs --json` 必须为每个 run 输出 `dashboardMetricsSourceEvidence`。
- 该对象必须包含 marker 存在性、marker 合法性、source selector、API-backed cases、fallback cases、legacy fallback case、各分项 complete 和总 complete。
- table summary 必须输出 `marker_present`、`marker_missing`、`marker_valid`、`marker_invalid`、`complete`、`incomplete`。
- inventory 必须保持只读，不移动、不删除、不归档 release-evidence 内容。
- self-test 必须覆盖完整 marker、缺 `dashboardStatsApiSignals`、缺 `apiBackedCases`、缺 `sourceLabelSelector`、缺 legacy fallback、marker missing 和 duplicate marker。

非范围：

- 不生成新 release evidence 包。
- 不改变 Dashboard smoke、release verifier、UI 或后端 API。
- 不声明 P11 完成。

当前验证结果：

- PASS：`node --check scripts/release-evidence-inventory.mjs`。
- PASS：`node --check scripts/release-evidence-inventory-self-test.mjs`。
- PASS：`make release-evidence-inventory-self-test`。
- PASS：`make release-evidence-inventory`，真实目录显示 `marker_present=31`、`marker_missing=71`、`marker_valid=31`、`marker_invalid=0`、`complete=0`、`incomplete=31`。
- PASS：`Carver / 019f3c6f-0cc4-7a90-b5c1-f088f0bdc2a0 = 黄仁勋 / DevOps Engineer` 二轮只读复核。

## P9/P11 增量：Projects portfolio trusted intake loop

目标：Projects 页必须从“项目列表”升级为 Developer Workbench 的项目组合入口，让用户一眼看到项目创建、公开仓库接入、扫描报告、代码问答和修复候选的可信主流程。

要求：

- Projects 页必须显示 `项目组合可信接入闭环`。
- P1/P2/P3/P4 必须分别对应项目壳、公开仓库、扫描报告、代码问答与修复。
- P2/P3/P4 必须显示当前目标项目；筛选无结果时不得暗中 fallback 到列表外项目。
- 响应式必须在 desktop 为 4 列，tablet 为 2 列，mobile 为 1 列。
- `app-shell-ui-smoke` 必须断言面板可见、4 个步骤、步骤名称、响应式列数和无横向溢出。
- `validate-frontend-ui.mjs` 必须静态钉住 Projects portfolio loop、无隐藏 fallback target、CSS 响应式和 smoke marker。

非范围：

- 不改后端 API。
- 不新增项目选择状态持久化。
- 不声明 P9 全部完成。

当前验证结果：

- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`node --check scripts/validate-frontend-ui.mjs`。
- PASS：`npx playwright test tests/app-shell-ui-smoke.spec.ts --config=playwright.app-shell-ui.config.ts`。
- PASS：`Carson / 019f3c7a-561d-73e0-ae84-de7928f15ed4 = 扎克伯格 / Frontend Engineer` 二轮只读复核。

## P9/P10/P11 增量：AgentChat conversation trust workbench

目标：AgentChat 必须从聊天工具升级为会话可信工作台，让用户发送前确认项目上下文、证据输入、工具审计和闭环任务四段链路。

要求：

- AgentChat 主内容区必须显示 `会话可信工作台`。
- 四段必须覆盖 `项目上下文`、`证据输入`、`工具审计`、`闭环任务`。
- 工具审计 deep link 只能在 `selectedConversation.projectId` 已确认后开放，不得用默认项目兜底。
- 切换会话、加载失败、异步乱序响应和 silent refresh 均不得让旧会话消息或工具统计污染当前可信状态。
- `agent-chat-closure-rail-smoke` 必须证明工作台可见、四段齐全、桌面 4 列、移动 1 列、无横向溢出。
- smoke 必须真实点击审计、AgentTask 和扫描报告入口，并证明 scan report 页面加载。
- `validate-frontend-ui.mjs` 必须静态钉住四段工作台、响应式 CSS、confirmed projectId、stale message guard、silent refresh loading guard 和 scan click marker。

非范围：

- 不改后端 API。
- 不实现真实 LLM provider、RBAC 或生产发布证据包刷新。
- 不声明 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test tests/agent-chat-closure-rail-smoke.spec.ts --config=playwright.agent-chat-closure-rail.config.ts`。
- PASS：`Bernoulli / 019f3c8b-2946-7e73-b6b9-e61dbb2b556b = 扎克伯格 / Frontend Engineer` 四轮只读复核。

## P9/P10/P11 增量：Artifacts custody chain workbench

目标：Artifacts 页必须从运行产物列表升级为产物可信保管工作台，让用户明确看到来源绑定、显示脱敏、Raw Access 审计和报告复盘四段责任链。

要求：

- Artifacts 页必须显示 `产物保管责任链`。
- 四段必须覆盖 `来源绑定`、`显示脱敏`、`Raw Access`、`复盘闭环`。
- 来源绑定必须基于当前 artifact owner/source 可跳转状态展示，不得暗示所有来源都已完整。
- 显示脱敏必须明确区分 preview display redaction 与 raw download，不能宣称 raw 内容已脱敏。
- Raw Access 必须在 raw download 确认后显示审计入口；有 receipt id 时显示 `receipt #...`，无 receipt id 时退化为资源过滤入口。
- 复盘闭环必须基于核心证据包 completeness 展示，不得宣称报告质量或 LLM 事实正确性。
- CSS 必须支持 desktop 4 列、<=1200px 2 列、<=720px 1 列，核心文本不得裁切。
- `artifacts-detail-selection-smoke` 必须证明 1440/390/320 三档 viewport 下责任链可见、四段齐全、列数正确、文本可读、无横向溢出，并证明 receipt/fallback 审计入口同步到责任链。
- `validate-frontend-ui.mjs` 必须静态钉住责任链实现、CSS 响应式和 smoke marker。

非范围：

- 不改后端 API、artifact storage schema 或 retention 后端策略。
- 不实现 RBAC、组织权限、生产审计报表或 full release evidence。
- 不宣称 provider 质量、LLM 事实正确性或 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test tests/artifacts-detail-selection-smoke.spec.ts --config=playwright.artifacts-detail-selection.config.ts`。
- PASS：`Turing / 019f3cd8-55e0-7223-9249-96b0cd6391f0 = 扎克伯格 / Frontend Engineer` 只读复核。

## P9/P10/P11 增量：AuditLogs investigation loop workbench

目标：AuditLogs 页必须从三源审计表格升级为审计调查闭环工作台，让用户明确看到风险发现、证据脱敏、资源追踪和复盘处置四段治理路径。

要求：

- AuditLogs 页必须显示 `审计调查闭环`。
- 四段必须覆盖 `风险发现`、`证据脱敏`、`资源追踪`、`复盘处置`。
- 风险发现必须基于失败审计、失败工具调用、异常 delivery、高权限工具和数据源错误展示，不得静态宣称健康。
- 证据脱敏必须明确当前只证明显示层脱敏，raw JSON 默认收起，不得宣称 raw 数据已脱敏或可外发。
- 资源追踪必须基于当前窗口可回跳资源、对话、扫描、产物或 delivery 展示，不得暗示全量覆盖。
- 复盘处置必须沿用审计判定门禁 READY/REVIEW/BLOCKED，不得绕开 fail-closed 深链策略。
- CSS 必须支持 desktop 4 列、<=1200px 2 列、<=720px 1 列，核心文本和按钮不得裁切。
- `audit-logs-detail-selection-smoke` 必须证明 1440/390/320 三档 viewport 下调查闭环可见、四段齐全、列数正确、文本可读、无横向溢出。
- smoke 必须继续证明三源表格、深链精确匹配、抽屉、raw JSON 显示脱敏、手动筛选 REVIEW、分页 REVIEW、source error BLOCKED 和 missing deep link fail-closed。
- `validate-frontend-ui.mjs` 必须静态钉住调查闭环实现、CSS 响应式和 smoke marker。

非范围：

- 不改后端 API、审计表 schema、组织/RBAC 权限、生产 SIEM 或告警系统。
- 不刷新 full release evidence。
- 不宣称完整审计覆盖、provider 质量、LLM 事实正确性或 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test tests/audit-logs-detail-selection-smoke.spec.ts --config=playwright.audit-logs-detail-selection.config.ts`。
- PASS：`Newton / 019f3ce2-4e59-78f3-af55-a54e48cde9e8 = 扎克伯格 / Frontend Engineer` 只读复核。

## P9/P10/P11 增量：ModelConfig provider governance loop workbench

目标：ModelConfig 页必须从模型配置表升级为模型供应商治理工作台，让用户明确看到激活、密钥、Endpoint 和下游调用能力的门禁状态。

要求：

- ModelConfig 页必须显示 `模型供应商治理闭环`。
- 四段必须覆盖 `激活门禁`、`密钥边界`、`Endpoint 风险`、`下游能力`。
- Endpoint 风险必须基于实际 `baseUrl` 与 provider preset 的偏离判断，不得只按 `provider === CUSTOM` 判断。
- API Key 表格显示必须有前端兜底脱敏，后端误返 raw token 时页面也不得显示明文。
- 治理文案必须明确 `激活/密钥存在` 不代表 provider 质量、供应商 SLA、LLM 事实正确或回答正确性。
- CSS 必须支持 desktop 4 列、<=1200px 2 列、<=720px 1 列；summary stat 和治理文本不得裁切。
- `model-config-recoverable-smoke` 必须覆盖 1440/390/320 三档 viewport，证明四段可见、列数正确、文本可读、无横向溢出。
- smoke 必须注入 raw API key fixture，并通过 DOM 文本负向断言证明 raw key 不显示，provider/LLM 过度宣称不存在。
- `validate-frontend-ui.mjs` 必须静态钉住四段实现、Endpoint override 判断、API key redaction fallback、CSS wrap、smoke marker 和 DOM 负向断言。

非范围：

- 不改后端 API、密钥存储 schema、真实 LLM provider、provider health check、RBAC 或组织权限。
- 不刷新 full release evidence。
- 不宣称 provider 质量、LLM 事实正确性或 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test -c playwright.model-config-recoverable.config.ts`。
- PASS：`Avicenna / 019f429b-eb84-7b43-9e7a-100033cb66e0 = 扎克伯格 / Frontend Engineer` 二轮只读复核。

## P9/P10/P11 增量：AutoRepair candidate governance loop workbench

目标：AutoRepair 页必须从任务表 + 详情门禁升级为自动修复候选治理工作台，让用户在列表级别看到候选来源、补丁生成、审查门禁和 PR 出口四段闭环。

要求：

- AutoRepairs 页必须显示 `自动修复候选治理闭环`。
- 四段必须覆盖 `候选来源`、`补丁生成`、`审查门禁`、`PR 出口`。
- 候选来源必须区分扫描绑定和人工候选，不得伪装 scanTask 来源。
- 补丁生成必须明确运行态或 PATCH_READY 只证明流程状态，不证明补丁正确。
- 审查门禁必须复用当前选中任务的 PATCH_READY 复核结果，并明确通过门禁不等于代码质量或业务正确性证明。
- PR 出口必须明确 PR_CREATED 仍需人工 review、CI 和审计复盘。
- CSS 必须支持 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；核心文本不得裁切。
- `patch-ready-smoke` 必须证明 1440/1024/390/320 四档 viewport 下治理闭环可见、四段齐全、列数正确、文本可读、无横向溢出。
- smoke marker 必须记录 `tabletColumns`、`twoColumnBreakpoint`、`fullRepairQualityClaim=false`、`llmFactClaim=false`。
- `validate-frontend-ui.mjs` 必须静态钉住治理闭环实现、CSS 响应式、文本 wrap 和 smoke tablet 断点证据。

非范围：

- 不改后端 API、AutoRepair 执行策略、真实 LLM provider、RBAC 或生产沙箱策略。
- 不刷新 full release evidence。
- 不宣称自动修复正确性、LLM 事实正确性或 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test -c playwright.patch-ready.config.ts`。
- PASS：`Newton / 019f42ac-154f-7403-9ce8-425d30a27bac = 扎克伯格 / Frontend Engineer` 首轮 PARTIAL 打回，修复后二轮 PASS。

## P9/P10/P11 增量：CI Diagnostics failure governance loop workbench

目标：CI Diagnostics 页必须从失败列表 + 单条详情升级为 CI 失败诊断治理工作台，让用户明确看到日志接入、根因证据、修复资格和 AutoRepair 交接四段路径。

要求：

- CI Diagnostics 页必须显示 `CI 失败诊断治理闭环`。
- 四段必须覆盖 `日志接入`、`根因证据`、`修复资格`、`AutoRepair 交接`。
- 日志接入必须明确页面展示脱敏不代表原始日志可以直接外发。
- 根因证据必须基于根因、相关文件和修复建议同时存在，不得把诊断完成宣称为根因正确或 LLM 输出事实正确。
- 修复资格必须基于仓库绑定、相关文件和修复建议，不得跳过证据门禁。
- AutoRepair 交接必须明确创建修复候选后仍需补丁审查、CI、人工 review 和审计复盘，不得把诊断建议视为已验证修复。
- CSS 必须支持 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；治理文本、状态和按钮不得裁切。
- `ci-diagnostics-detail-selection-smoke` 必须证明 1440/1024/390/320 四档 viewport 下治理闭环可见、四段齐全、列数正确、文本可读、无横向溢出。
- smoke marker 必须记录 `CI_DIAGNOSTICS_FAILURE_GOVERNANCE_LOOP_READABILITY`、`tabletColumns`、`mobileColumns`、`narrowColumns`、`fullRepairQualityClaim=false`、`llmFactClaim=false`。
- `validate-frontend-ui.mjs` 必须静态钉住治理闭环实现、CSS 响应式、文本 wrap 和 smoke marker。

非范围：

- 不改后端 API、CI provider webhook、真实 provider 质量、RBAC、组织权限或 full release evidence。
- 不宣称诊断根因正确、自动修复正确、LLM 事实正确或 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test -c playwright.ci-diagnostics-detail-selection.config.ts`。
- PASS：主 agent fallback review；修正 `governanceLoopSteps` 派生状态为 `useMemo` 后全部复测通过。
- BLOCKED：`Kuhn / 019f4442-23cd-7de1-9931-9dc0612dcad5 = 扎克伯格 / Frontend Engineer` 子 agent 因 Codex 使用额度限制失败，未形成独立岗位 PASS。

## P9/P10/P11 增量：PR Reviews governance loop workbench

目标：PR Reviews 页必须从 PR 审查表 + 单条详情升级为 PR 审查治理工作台，让用户明确看到 PR 输入、风险判定、合并门禁和 AutoRepair 交接四段路径。

要求：

- PR Reviews 页必须显示 `PR 审查治理闭环`。
- 四段必须覆盖 `PR 输入`、`风险判定`、`合并门禁`、`AutoRepair 交接`。
- PR 输入必须基于 PR 标题、分支、Diff 摘要、变更文件和 CI 状态，不得在输入缺失时伪装完整。
- 风险判定必须明确风险等级、风险点和行级评论共同决定审查结论。
- 合并门禁必须明确 CI 失败、阻断建议或需修改结论时不应直接合并。
- AutoRepair 交接必须只在仓库、目标文件和风险/评论证据齐全时开放修复候选。
- 治理文案必须明确 PR 审查完成不等于代码质量、业务正确性或安全性已被完全证明。
- 治理文案必须明确生成修复候选后仍需补丁审查、CI、人工 review 和审计复盘。
- CSS 必须支持 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；治理文本、状态和按钮不得裁切。
- `pr-reviews-detail-selection-smoke` 必须证明 1440/1024/390/320 四档 viewport 下治理闭环可见、四段齐全、列数正确、文本可读、AutoRepair URL 参数正确、无横向溢出。
- smoke marker 必须记录 `PR_REVIEWS_GOVERNANCE_LOOP_READABILITY`、`desktopColumns`、`tabletColumns`、`mobileColumns`、`narrowColumns`、`fullReviewQualityClaim=false`、`llmFactClaim=false`。
- `validate-frontend-ui.mjs` 必须静态钉住治理闭环实现、CSS 响应式、文本 wrap、smoke marker 和不过度宣称负向断言。

非范围：

- 不改后端 API、真实 PR provider、GitHub/GitLab merge gate、真实 AutoRepair candidate API、RBAC、组织权限或 full release evidence。
- 不宣称风险判定正确、合并门禁真实生效、自动修复正确、LLM 事实正确或 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test -c playwright.pr-reviews-detail-selection.config.ts`。
- PASS：`Ampere / 019f4457-150a-7420-9c28-ac03f3220c94 = 扎克伯格 / Frontend Engineer` 只读静态复核。
- PARTIAL：`Confucius / 019f4457-36f8-7e50-a3ab-6e0eb86f0c47 = 拉里佩奇 / QA Engineer` 指出当前 smoke 只证明前端治理闭环和 URL 交接，不证明真实 PR provider、后端 merge gate、风险分析正确性或 AutoRepair API 创建。

## P9/P10/P11 增量：Dashboard three-plane product structure map

目标：Dashboard 必须从指标首页升级为三平面产品结构入口，让用户一眼看清前台体验、开发者控制台、后台治理分别服务谁、进入哪些页面、当前处于什么状态、下一步做什么。

要求：

- Dashboard 必须显示 `SourceLens 三平面产品结构`。
- 三平面必须覆盖 `前台体验`、`开发者控制台`、`后台治理`。
- 前台体验必须映射项目与仓库、扫描报告、代码问答和修复候选入口。
- 开发者控制台必须映射执行任务、运行产物、CI 诊断、PR 审查和 Issue 拆解入口。
- 后台治理必须映射审计日志、模型配置、安全边界和发布证据入口。
- 每个平面必须显示状态值、说明、页面入口 chips 和动作按钮。
- 文案必须明确后台治理不等于 RBAC、多租户或生产部署已完成。
- CSS 必须支持 desktop 3 列、1024 tablet 2 列、390/320 mobile 1 列；标题、说明、状态、页面 chips 和按钮不得裁切。
- `dashboard-next-action-smoke` 必须覆盖 7 个 Dashboard 状态分支和 1440/1024/390/320 四档 viewport，证明三平面可见、列数正确、文本可读、动作存在、无横向溢出。
- smoke marker 必须记录 `DASHBOARD_THREE_PLANE_PRODUCT_STRUCTURE_READABILITY`、`desktopColumns`、`tabletColumns`、`mobileColumns`、`narrowColumns`、`rbacCompleteClaim=false`、`productionDeploymentClaim=false`。
- `validate-frontend-ui.mjs` 必须静态钉住三平面实现、CSS 响应式、文本 wrap、smoke marker 和不过度宣称负向断言。

非范围：

- 不改后端 API、真实 RBAC、多租户、组织权限、生产部署、商业化体系或 full release evidence。
- 不宣称前后台完全完成、后台权限隔离已完成、生产可用性已完成或 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test -c playwright.dashboard-next-action.config.ts`。
- PASS：主 agent fallback product/frontend review。
- BLOCKED：`Russell / 019f4491-8fd0-7592-aea7-0d6f6bfc08c8 = 乔布斯 / Product Manager` 因 Codex 使用额度限制失败，未形成独立产品复核。
- BLOCKED：`Gibbs / 019f4491-bf48-7330-ba36-37363bcbf854 = 扎克伯格 / Frontend Engineer` 因 Codex 使用额度限制失败，未形成独立前端复核。

## P9/P10/P11 增量：AppLayout global three-plane navigation contract

目标：把 Dashboard 已落地的三平面结构推进到全局 App shell，让核心路由、顶部 route plane、侧边栏和移动 Drawer 使用同一套前台体验 / 开发者控制台 / 后台治理信息架构。

要求：

- AppLayout 必须定义 `ProductPlane = '前台体验' | '开发者控制台' | '后台治理'`。
- `routeMeta` 必须为每条核心路由设置 title、desc 和 plane。
- 前台体验必须覆盖工程智能首页、项目与仓库、代码问答和修复候选。
- 开发者控制台必须覆盖执行任务、运行产物、Agent 任务、Issue 拆解、CI 诊断和 PR 审查。
- 后台治理必须覆盖审计日志和模型配置。
- 侧边栏和移动 Drawer 必须按 `前台体验`、`开发者控制台`、`后台治理` 三组组织。
- 顶部 `sl-topbar-plane` 必须从当前路由元信息渲染，不能写死。
- 旧英文分组 `Developer Workbench`、`Engineering Governance`、`Admin & Security` 不得继续出现在 AppLayout 或 app-shell smoke。
- `app-shell-ui-smoke` 必须覆盖 13 条核心路由 × 1440/390/320 三档 viewport，证明 route-to-plane 映射、移动 Drawer 三组、页面标题可读、无横向溢出和无错误 toast。
- smoke marker 必须记录 `productPlanes` 和 `routePlanes`，作为三平面导航证据。
- `validate-frontend-ui.mjs` 必须静态钉住 AppLayout 三平面源码、topbar plane 渲染、移动 Drawer 三组、smoke marker 和旧英文分组禁止项。

归属更新（2026-07-10）：本节对 `Issue 拆解` 的旧归属已被“按用户持久化工作视角与三平面导航仲裁”增量替代；当前权威归属为“开发工作台”。

非范围：

- 不改后端 API、RBAC、组织权限、多租户、生产部署、商业化体系或 full release evidence。
- 不宣称三平面导航等同于权限隔离、后台系统完成或 P9/P10/P11 完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test -c playwright.app-shell-ui.config.ts`。
- PASS：`Sartre / 019f4746-80b1-7120-b690-0fc5cb05bb6c = 乔布斯 / Product Manager` 二轮只读产品复核。
- PASS：`Pauli / 019f4746-d41e-75d0-8294-a1e4dc544a8e = 扎克伯格 / Frontend Engineer` 二轮只读前端复核。

## P9/P10/P11 增量：IssueDecomposition developer-control-plane governance loop

目标：把 IssueDecomposition 从需求拆解列表 + 计划信号 + 子任务表推进为开发者控制台内的 Issue 拆解治理工作台，让用户明确看到需求输入、任务拆解、验收门禁和执行交接四段路径。

要求：

- IssueDecomposition 页必须显示 `Issue 拆解治理闭环`。
- 四段必须覆盖 `需求输入`、`任务拆解`、`验收门禁`、`执行交接`。
- 需求输入必须基于选中 Issue 的标题、描述、业务背景或关联模块判断，不得把空泛需求伪装为可交付输入。
- 任务拆解必须基于完成状态、子任务数量和影响范围判断，不得把失败或未完成拆解交给开发。
- 验收门禁必须基于验收标准、风险和依赖数量展示，不得把缺少验收标准的任务视为已可证明。
- 执行交接必须基于子任务、建议分支和建议 Commit 粒度展示，并明确拆解完成不等于实现完成。
- 治理文案必须明确拆解结果只能作为开发计划证据，不能证明实现、测试、CI、PR 或 LLM 判断正确。
- CSS 必须支持 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；治理文本、阶段、证据和边界文案不得裁切。
- `issue-decomposition-detail-selection-smoke` 必须证明 1440/1024/390/320 四档 viewport 下治理闭环可见、四段齐全、列数正确、文本可读、无横向溢出。
- `issue-decomposition-detail-selection-smoke` 必须模拟 completed issue 子任务请求慢响应：先阻塞旧响应、切换到 failed issue、再释放旧响应，并证明 failed issue 仍保持选中、子任务为 0、旧 target task 不泄漏。
- smoke marker 必须记录 `ISSUE_DECOMPOSITION_GOVERNANCE_LOOP_READABILITY`、`desktopColumns`、`tabletColumns`、`mobileColumns`、`narrowColumns`、`fullImplementationClaim=false`、`llmFactClaim=false`。
- smoke marker 必须记录 `delayedCompletedIssueTasksRejectedAfterFailedSelection=true`。
- `validate-frontend-ui.mjs` 必须静态钉住治理闭环实现、CSS 响应式、文本 wrap、smoke marker、stale task request guard 和不过度宣称负向断言。

非范围：

- 不改后端 API、Issue 拆解算法、真实任务执行、CI/PR/AutoRepair E2E、RBAC、组织权限或 full release evidence。
- 不宣称拆解质量正确、实现已完成、测试已完成、CI/PR 已通过、LLM 事实正确或 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test -c playwright.issue-decomposition-detail-selection.config.ts`。
- PASS：`Jason / 019f4757-e8d2-7fc0-8ed9-bad4e2eef797 = 乔布斯 / Product Manager` 二轮只读产品复核。
- PASS：`Socrates / 019f4758-49f2-7751-97c8-2716448101b5 = 扎克伯格 / Frontend Engineer` 首轮 PARTIAL 指出 stale tasks 风险，修复后二轮 PASS。
- PASS：`Feynman / 019f4758-a080-7431-9022-1fda2a10133d = 拉里佩奇 / QA Engineer` 只读 QA 复核。

## P9/P10/P11 增量：ExecutionTasks lifecycle governance loop workbench

目标：把 ExecutionTasks 从执行任务列表 + pipeline signal + 详情动作门禁继续升级为开发者控制台内的执行生命周期治理工作台，让用户明确看到来源接入、调度控制、证据采集和复盘交接四段路径。

要求：

- ExecutionTasks 页必须显示 `执行生命周期治理闭环`。
- 四段必须覆盖 `来源接入`、`调度控制`、`证据采集`、`复盘交接`。
- 来源接入必须基于任务来源可回跳数量和来源覆盖率判断，不得把孤立执行记录包装成完整闭环。
- 调度控制必须基于活跃任务和疑似卡住任务判断，不得把运行中任务解释为终态结论。
- 证据采集必须基于选中任务的 attempt、步骤和日志数量判断，不得把缺少证据的任务作为执行结论。
- 复盘交接必须基于终态任务和失败任务数量判断，并明确失败任务必须先复盘来源、步骤和脱敏日志。
- 治理文案必须明确执行任务闭环只能证明任务状态、来源、步骤、日志和产物入口可追踪，不能证明真实执行质量、产物正确、CI/PR/AutoRepair 或 LLM 结果已经正确。
- CSS 必须支持 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；阶段标题、状态、说明和边界文案不得裁切。
- `execution-tasks-detail-selection-smoke` 必须证明 1440/1024/390/320 四档 viewport 下生命周期治理闭环可见、四段齐全、列数正确、文本可读、无横向溢出。
- `execution-tasks-detail-selection-smoke` 必须证明同一任务的旧 selected-detail refresh 响应不能覆盖较新的 cancel 结果。
- `execution-tasks-detail-selection-smoke` 必须证明显式 detail load 被 cancel 打断时，旧 load 响应不能覆盖较新的 cancel 结果，且 `detailLoading` 必须被清理。
- smoke marker 必须记录 `EXECUTION_TASKS_LIFECYCLE_GOVERNANCE_LOOP_READABILITY`、`EXECUTION_TASKS_SAME_TASK_STALE_DETAIL_GUARD`、`EXECUTION_TASKS_EXPLICIT_LOAD_STALE_DETAIL_GUARD`、`desktopColumns`、`tabletColumns`、`mobileColumns`、`narrowColumns`、`statusTextReadable=true`、`descriptionTextReadable=true`、`sameTaskStaleDetailRejected=true`、`staleExplicitLoadRejected=true`、`detailLoadingCleared=true`、`executionQualityClaim=false`、`llmFactClaim=false`。
- `validate-frontend-ui.mjs` 必须静态钉住生命周期治理闭环实现、CSS 响应式、文本 wrap、smoke marker、不过度宣称负向断言、refresh/cancel request sequence、cancel 清 detailLoading 和两个 stale guard 场景。

非范围：

- 不改后端 API、任务状态机、真实执行器、产物生成、CI/PR/AutoRepair E2E、RBAC、组织权限或 full release evidence。
- 不宣称真实执行质量正确、产物正确、CI/PR 已通过、AutoRepair 修复正确、LLM 事实正确或 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS：`npx playwright test -c playwright.execution-tasks-detail-selection.config.ts`。
- PASS：`Erdos / 019f476d-4cfc-74d1-bd74-3b682cdf7036 = 乔布斯 / Product Manager` 只读产品复核。
- PASS after PARTIAL fixes：`Averroes / 019f476d-4d63-7b02-bc0a-67fdb72a909b = 扎克伯格 / Frontend Engineer` 只读前端复核。
- PASS：`Dewey / 019f476d-4dac-78d1-ad76-d94083cd6a92 = 拉里佩奇 / QA Engineer` 只读 QA 复核。

## P9/P10/P11 增量：AgentTasks lifecycle governance loop workbench

目标：把 AgentTasks 从任务列表 + 详情动作门禁 + payload safety 继续升级为开发者控制台内的 Agent 任务治理工作台，让用户明确看到任务入口、执行控制、工具证据和复盘交接四段路径。

要求：

- AgentTasks 页必须显示 `Agent 任务治理闭环`。
- 四段必须覆盖 `任务入口`、`执行控制`、`工具证据`、`复盘交接`。
- 任务入口必须基于任务数量、扫描绑定数量和对话绑定数量判断，不得把孤立 Agent 任务包装成完整闭环。
- 执行控制必须基于活跃任务、高优先级任务和失败任务判断，不得把运行中或失败任务解释为已完成结论。
- 工具证据必须基于选中任务步骤数量和工具步骤数量判断，并继续保持 raw payload 默认隐藏。
- 复盘交接必须基于终态任务、失败任务和选中任务摘要/输出入口判断，不得把终态状态解释为模型判断正确。
- 治理文案必须明确 Agent 任务闭环只能证明任务元数据、步骤、对话、扫描报告和产物入口可追踪，不能证明模型判断正确、工具输出真实、修复/PR/CI 结果正确。
- `fetchSteps` 必须使用 request sequence 拒绝 stale step response，避免旧任务步骤污染当前选中任务和治理闭环。
- CSS 必须支持 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；阶段标题、状态、说明和边界文案不得裁切。
- `agent-tasks-detail-selection-smoke` 必须证明 1440/1024/390/320 四档 viewport 下 Agent 任务治理闭环可见、四段齐全、列数正确、标题/状态/说明文本可读、无横向溢出。
- smoke marker 必须记录 `AGENT_TASKS_LIFECYCLE_GOVERNANCE_LOOP_READABILITY`、`desktopColumns`、`tabletColumns`、`mobileColumns`、`narrowColumns`、`statusTextReadable=true`、`descriptionTextReadable=true`、`modelJudgementClaim=false`、`toolOutputTruthClaim=false`。
- `validate-frontend-ui.mjs` 必须静态钉住生命周期治理闭环实现、CSS 响应式、文本 wrap、smoke marker、不过度宣称负向断言和 steps request sequence guard。

非范围：

- 不改后端 API、Agent 执行器、真实 LLM/provider、工具调用真实性、CI/PR/AutoRepair E2E、RBAC、组织权限或 full release evidence。
- 不宣称模型判断正确、工具输出真实、修复结果正确、PR 已通过、CI 已通过或 P9/P10/P11 全部完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`npm run build`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npx playwright test -c playwright.agent-tasks-detail-selection.config.ts`。
- PASS：`make frontend-ui-check`。
- PASS：`Goodall / 019f4789-2a3a-7d00-bfa8-9d4733335492 = 乔布斯 / Product Manager` 只读产品复核。
- PASS：`Dalton / 019f4789-2aac-7301-97f4-2ed0e86ce841 = 扎克伯格 / Frontend Engineer` 只读前端复核。
- PASS：`Popper / 019f4789-2aff-72f1-b97f-a3d13f09cb36 = 拉里佩奇 / QA Engineer` 只读 QA 复核。

## P9/P6/P11 增量：Dashboard executive briefing and single AgentChat QA entry

目标：把 Dashboard 从三平面入口和下一步行动继续推进为管理层可读的决策仪表盘，同时统一 Dashboard 的代码问答主入口，避免 `/agent-chat` 与 `/projects/:id?tab=qa` 形成两套产品入口。

要求：

- Dashboard 必须显示 `管理层决策简报`。
- 决策简报必须覆盖 `阶段进度`、`质量状态`、`风险阻塞`、`下一步投入`。
- 决策简报必须明确该简报只汇总当前 Dashboard/API/页面证据，不证明 P9 全阶段完成、RBAC 权限隔离落地、生产部署可上线或商业化体系完成。
- Dashboard code QA 主入口必须统一跳转 `/agent-chat?handoff=code-understanding&source=DASHBOARD_CODE_QA_ENTRY`。
- Dashboard 不得继续把 `/projects/:id?tab=qa` 作为主代码问答产品入口。
- 三平面和管理层简报必须支持 1440 desktop、1024 landscape tablet、768 portrait tablet、390 mobile、320 narrow。
- 三平面头部和卡片头必须在 960px 前切单列，避免状态 Tag 挤压标题。
- 三平面状态 Tag 必须具备 `min-width:0`、wrap、clip 和 normal white-space，不得依赖 ellipsis。
- `dashboard-next-action-smoke` 必须证明管理层简报、三平面、QA URL、列数、文本可读、无横向溢出、无过度宣称和 mocked API only。
- `validate-frontend-ui.mjs` 必须静态钉住管理层简报、AgentChat QA handoff、拒绝项目 tab QA 主入口、960px 单列、Tag wrap、五视口 smoke marker。

非范围：

- 不改后端 API、真实指标数据模型、release evidence 执行命令、RBAC、多租户、生产部署、商业化体系或第 63 项顶层制度。
- 不宣称 P9 全阶段完成、后台权限隔离完成、生产部署可上线、商业化体系完成或 full release evidence 完成。

当前验证结果：

- PASS：`npx tsc --noEmit --pretty false`。
- PASS：`node scripts/validate-frontend-ui.mjs`。
- PASS：`npx playwright test -c playwright.dashboard-next-action.config.ts`。
- PASS：`npm run build`。
- PASS：`make frontend-ui-check`。
- PASS after PARTIAL fixes：`Hilbert / 019f47e1-40e3-7833-97de-8d522bab991e = 乔布斯 / Product Manager` 只读产品复核。
- PASS after PARTIAL fixes：`Mill / 019f47e1-4173-71b0-9fdf-22a281b6c0d4 = 扎克伯格 / Frontend Engineer` 只读前端复核。

## P11/P9 增量：Dashboard executive briefing release evidence gate

目标：把 `DASHBOARD_NEXT_ACTION_SMOKE_OK.executiveBriefing` 从 smoke 自报字段升级为可验证、可盘点、可防伪的发布证据合同。

要求：

- verifier 必须精确要求 `1440x900`、`1024x768`、`768x1024`、`390x844`、`320x740` 五档 viewport，以及 7 个 Dashboard case 在五档 viewport 的完整 `visitedCases`。
- `executiveBriefing.scope` 必须为 `DASHBOARD_EXECUTIVE_BRIEFING_DECISION_READABILITY`；signals 必须精确为阶段进度、质量状态、风险阻塞、下一步投入；`signalCount=4`。
- `expectedColumnsHonored`、五档 columns、`copyReadable`、`actionVisible` 必须为 true；P9/RBAC/生产部署/商业化完成宣称必须为 false。
- `visualEvidence` 必须精确包含五张唯一 `review-risk-report` PNG；verifier 必须校验稳定文件名、包内安全路径、实际 PNG、尺寸、bytes、像素多样性、panel/title/button viewport 边界和主按钮白字。
- inventory 必须独立输出 `dashboardExecutiveBriefingEvidence`，并区分 marker、fields、checks、viewport coverage、visual evidence coverage、complete 和 reason。
- security regression 必须证明缺/错 executive 字段、缺/重中间 viewport 截图、错误截图尺寸和四类 overclaim 都会被精确拒绝。

非范围：

- 不刷新 full release/nightly authority，不证明 Dashboard 指标业务真实性，不实现 RBAC、生产部署或商业化体系。

当前验证结果：

- PASS：`make release-evidence-inventory-self-test`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-dashboard-ui-marker`。
- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`node --check scripts/release-evidence-inventory.mjs` 和 self-test。
- PASS：`make dashboard-next-action-ui-smoke`，真实 marker 为 7 cases x 5 viewports，五张截图均生成。
- PASS after main-agent rejection：`Leibniz / 019f4801-2d75-7aa1-ac6a-bf39fc85cc29 = 黄仁勋 / DevOps Engineer` 修复两截图 verifier 缺口。
- PASS after main-agent rejection：`Confucius / 019f4801-8e98-7422-9f15-5f805e7505ae = 拉里佩奇 / QA Engineer` 补齐五截图 fixture 与 forged cases。

## P9 增量：Scan Report route-plane handoff

目标：让 Dashboard 与直接访问 `/scan-tasks` 使用同一套扫描报告路由语义，确保页面标题、产品平面和父菜单选择一致。

Must：

- `/scan-tasks` 的 topbar 必须显示 `扫描报告`，route plane 必须为 `前台体验`，侧边栏与移动 Drawer 必须选中 `/projects` 父菜单。
- Dashboard 进入扫描报告的 handoff 与 `/scan-tasks` 直接加载必须落到同一 route-plane contract。
- marker `P9_SCAN_REPORT_ROUTE_PLANE_HANDOFF_OK` 必须记录 `dashboardHandoff=10`、`directLoad=3`、`viewports=1440/390/320`、`mobileDrawerSelected=true`、`runtimeIssues=0`、`horizontalOverflow=true`。

验收：

- PASS：app-shell smoke `1 passed`，dashboard smoke `1 passed`。
- PASS：UI validator 与 frontend build。
- PASS：三档 viewport 下 topbar、plane、父菜单和移动 Drawer 选择状态符合 marker contract。

非范围：

- 不改后端 API、扫描业务语义、RBAC、组织权限或生产部署。
- 不把本路由交接切片解释为 P9 全阶段完成或 full release authority 已刷新。

## P11 增量：Dashboard productPlaneMap release evidence gate

目标：把 Dashboard 三平面产品结构从 smoke 自报字段升级为可由 verifier 严格验证、inventory 独立盘点并能抵抗伪造证据的发布合同。

Must：

- producer 必须在顶层输出 `productPlaneMap`，其中 `actionCount=3`，并提供 35 个 proofs。
- verifier 必须严格校验 `productPlaneMap` 的对象结构、字段、动作数量和 proofs，不接受缺失、错型或伪造值。
- inventory 必须独立输出 `dashboardProductPlaneEvidence`，清楚标示完整性与失败原因。
- self-test 必须覆盖有效与无效 product-plane evidence；security regression 必须覆盖 15 个 forged variants。

验收：

- PASS：producer 顶层 `actionCount=3`，35 proofs。
- PASS：strict verifier、`dashboardProductPlaneEvidence` inventory、self-test coverage 和 15 个 forged variants security regression。
- CONFIRMED BLOCKED/YELLOW：旧候选 `release-current-schema-20260705-0610` 最新复验退出 `1`，首个失败为 `productPlaneMap must be an object`。

非范围：

- 本增量不刷新 full release/nightly authority，不把旧候选恢复为 current authority。
- 不证明 Dashboard 数据业务真实性、RBAC、生产部署、商业化体系或 P11 全阶段完成。

## P11 增量：Current full authority refresh 与 repair-readiness fail-closed

目标：用当前源码刷新完整本地发布权威，并确保代码问答到修复候选、AgentChat 交接与证据包校验均采用 fail-closed 契约。

验收结果：

- PASS：`release-current-schema-20260710-114653` 完整 release profile，0 required failures、0 optional warnings、5 skipped。
- PASS：最新独立 verifier 与 checksum。
- PASS：真实公开仓库 clone/scan/code_chunks/Code QA/report citation/多视口 UI/cleanup。
- PASS：显式 `readyForRepair=true` 仍必须满足 roleDistribution、required claims、PRIMARY binding 和 file counts。
- PASS：`REQUIRED_FULL` 正向/伪造回归；AgentChat linked/handoff task ID 绑定回归。
- PASS：拉里佩奇 / QA Engineer 打回复核闭环。

阶段边界：

- P11 current local authority 恢复 GREEN，不等于 P11 全阶段或生产发布完成。
- 5 个高级集成步骤继续后置，不阻塞公开仓库主线。

## P9 增量：Dashboard / Projects 首屏上下文与动作仲裁

目标：在三平面导航已经可见的基础上，优先修复入口页“信息很多但首屏动作可能错误”的产品缺陷。

Must：

- Dashboard hero 的唯一 primary CTA 必须来自状态驱动 `nextAction`，不得固定显示“接入仓库”。
- Dashboard 加载失败时，首屏 primary CTA 只能是重试；审计等动作只能作为 secondary。
- Projects 初始 loading 或无缓存 fatal error 时，不得先显示 0 项目统计、项目闭环或新建项目主动作。
- Projects 必须区分：确认空项目、筛选无结果、保留旧数据的刷新失败和 fatal load failure。
- 390/320 顶栏仍必须显示当前产品平面身份，不能依赖打开 Drawer。
- 五档 viewport 初始 `scrollY=0`；平面身份、状态、主动作和按钮底边必须位于首屏；首屏只允许一个 primary CTA。
- 首屏 smoke 不得先调用 `scrollIntoViewIfNeeded()` 再声称元素位于 first viewport。

非范围：

- 不实现 RBAC、组织/团队、工作视角持久化或后端 API。
- 不在本增量内完成 ProjectDetail、ScanTaskDetail、AgentChat 的全部首屏重构。

交付结果（2026-07-10）：

- Dashboard 已把状态驱动 `nextAction` 移入 hero，移除固定“接入仓库”和后部重复推荐面板；7 种状态在 5 个视口均只有一个 primary。
- Projects 已区分 initial loading、fatal load、stale refresh、confirmed empty 和 filtered empty；fatal 不渲染 0 数据统计/闭环/表格，恢复、清筛选和新建动作按状态互斥。
- `<=960px` 顶栏直接显示当前产品平面，390/320 无需打开 Drawer 即可识别当前平面。
- PASS：Dashboard next-action smoke、Projects batch3 smoke、app-shell smoke、frontend build、`validate-frontend-ui.mjs`、`git diff --check`。
- 边界：本切片 focused GREEN，P9 全阶段仍未完成；不证明 RBAC、真实后端 E2E、生产部署或高级集成层完成。

## P9 增量：按用户持久化工作视角与三平面导航仲裁

目标：把已定义的三平面从“所有入口同时分组展示”推进为真实目标用户工作区，同时保持与 RBAC 权限边界严格分离。

Must：

- 提供开发工作台、工程治理、平台管理与安全三种工作视角，内部白名单值为 `workbench`、`governance`、`admin_security`，分别映射前台体验、开发者控制台、后台治理。
- 开发工作台必须包含 Dashboard、Projects/Scan Report、Code QA、Issue Decomposition、AutoRepair；工程治理包含 ExecutionTasks、Artifacts、AgentTasks、CI、PR；平台管理与安全包含 AuditLogs、ModelConfig。
- 无有效偏好时默认开发工作台；偏好键必须固定为 `sourcelens.work-view.v1.user.<authenticated user id>`，不能跨账号串用。
- 切换视角后导航只显示对应平面入口，并跳转到该平面主入口：Dashboard、ExecutionTasks、AuditLogs。
- 用户通过深链进入其他平面时，当前工作视角必须同步到真实路由平面，不能出现“后台页面 + 前台导航”的矛盾状态；深链不得覆盖用户显式保存的默认偏好。
- 本地存储值必须白名单解析；无效值回退开发工作台。
- 展开/折叠桌面 Sider、1024/768 和 390/320 移动 Drawer 均可识别和切换视角，无横向溢出或文字裁切。
- 页面必须明确“仅调整导航与默认首页，不改变访问权限”；直接路由保持可访问，不得宣称 RBAC 已完成。
- browser smoke 必须证明默认值、三次切换、持久化、用户隔离、无效值回退、深链同步和五视口布局；static UI gate 与 production build 必须 PASS。

非范围：

- 不新增后端角色、数据库 migration、组织/团队、权限矩阵、审批流或服务端偏好 API。
- 不把本地偏好作为安全控制；P10/P12 的 RBAC 继续后置。

交付结果（2026-07-10）：

- 偏好恢复已迁到中立根入口 `/`；三个具体首页和其他显式深链始终尊重 URL，不会被保存偏好吞掉，也不会反向覆盖偏好。
- 三个正式工作视角、首页、菜单归属和 `sourcelens.work-view.v1.user.<authenticated user id>` 白名单键已落地；Issue Decomposition 权威归属为开发工作台。
- 断点切换会关闭移动 Drawer，并恢复此前桌面折叠偏好；路由元信息改为完整路径段匹配。
- `npm run smoke:work-perspective`：2 passed，22.0s；覆盖五视口、三视角、逐用户偏好键隔离、无效值回退、深链不覆写、折叠/移动/断点行为和 localStorage 读写异常。
- PASS：`node scripts/validate-frontend-ui.mjs`、frontend production build、`git diff --check`。
- PASS after return：Product Manager 首轮 BLOCK、Frontend/QA 首轮 PARTIAL 的全部打回项已修正，三岗位二轮只读复核均 PASS。
- 边界：只证明客户端导航偏好和响应式信息架构，不证明 RBAC、角色识别、权限隔离、服务端偏好同步、真实后端 E2E 或 P9 全阶段完成。

## P9 增量：ProjectDetail 首屏状态真相与动作仲裁

目标：让项目工作台只有在当前 projectId 的核心数据已确认后才给出业务动作，并阻止旧项目异步响应污染当前页面。

Must：

- 状态优先级固定为 `INITIAL_LOADING -> FATAL_LOAD / STALE_REFRESH -> 六种业务状态`；错误和加载状态必须先于业务动作判断。
- 初始加载不得用空数组推导 `ADD_REPOSITORY`，不得显示 0 仓库、0 扫描、空可信闭环或业务 primary。
- project、repository、scan 任一核心源初次失败时，页面只显示致命错误和重试；不能渲染正常 cockpit、Tabs 或“无数据”结论。
- 已有可信快照后刷新失败必须标记过期数据，保留只读上下文，并把“重新同步”设为唯一 primary；旧的 OPEN_QA、START_SCAN 等动作不得保持 primary。
- `projectId` 变化时必须立即清理上一个项目的快照和交互状态；project/repository/scan/execution/overview/artifact/report/code_chunks 每条迟到响应都必须由 generation/project ownership guard 拒绝。
- 核心源成功确认后，保留并验证现有六态：ADD_REPOSITORY、START_SCAN、WATCH_SCAN、REVIEW_FAILED_SCAN、OPEN_ARTIFACTS、OPEN_QA。
- 1440x900、1024x768、768x1024、390x844、320x740 均必须在 `scrollY=0` 直接看到真实状态和主动作；INITIAL_LOADING primary=0，其余状态 primary=1，按钮完整位于 viewport，无横向溢出或裁切。
- 必须新增 A -> B 延迟响应浏览器回归，证明页面标题、仓库、扫描、动作 key 和证据均只属于 B；测试不得调用 `scrollIntoViewIfNeeded`。
- focused Playwright、frontend UI validator、production build、`git diff --check` 和三岗位复核必须 PASS。

非范围：

- 不改后端/API/数据库/schema，不在本轮处理 ScanTaskDetail fatal cockpit 或 AgentChat 移动端 composer；后两项继续留在 P9 后续切片。
- 不把 mocked browser smoke 描述为真实后端、RBAC、生产部署或 full release authority 证明。

交付结果（2026-07-10）：

- `ProjectDetail` 已实现 `INITIAL_LOADING / FATAL_LOAD / STALE_REFRESH / READY` 优先级；核心 project/repository/scan 作为同一可信快照提交，初始失败不再推导空业务态。
- project generation、core/detail sequence、full refresh owner 和 visible sync owner 已分离；递归 polling 会让位于 full refresh，旧请求不能提前清除 loading。
- artifact、preview、code_chunks 在 project/scan/record 归属确认后集中提交；code status 必须显式回显目标 scan id；删除仓库和取消扫描在发请求前验证可信实体归属。
- 移动端动作区已移动到 evidence checks 之前；`<=720px` 紧凑布局和 `<=360px` evidence 单列保留全部信息，未使用隐藏内容或程序化滚动换取通过。
- `make project-detail-first-viewport-ui-smoke`：11 passed / 54.9s；marker 为 `5 initial / 15 fatal / 30 six-state / 5 stale / 1 route-race`，`realApi=false`、`db=false`。
- 旧 batch4A ProjectDetail 回归已改为局部 overview retry + trusted snapshot `READY -> STALE_REFRESH -> READY`，聚焦 3 passed / 9.2s。
- PASS：frontend production build、frontend UI validator、`git diff --check`、桌面与 320 trace screenshot 人工复核、Product Manager 与 Architect 二轮只读验收。
- 边界：本增量不改后端/API/DB/schema，不刷新 current local full release authority；ScanTaskDetail 和 AgentChat 首屏仲裁继续作为下一 P9 切片。

## P9 增量：ScanTaskDetail 首屏状态真相与报告归属

目标：让扫描报告只有在当前 taskId 的任务和报告证据经过归属确认后才展示 cockpit 与风险结论，并阻止加载失败、旧 scan 响应和轮询竞态污染当前页面。

Must：

- 顶层状态固定为 `INITIAL_LOADING / FATAL_LOAD / STALE_REFRESH / READY`；状态真相先于报告指标、风险结论和业务动作。
- 首次 task detail、artifact list 或 task/artifact 归属校验失败时，只显示 fatal reason 和唯一 primary `重新加载扫描报告`；不得渲染 `.sl-scan-cockpit`、执行阶段、code knowledge、报告 Tabs、0 artifacts、0 风险或“暂无显著风险”。
- 当前 scan 已有可信快照后刷新失败必须进入 `STALE_REFRESH`，保留上次快照但明确其已过期；唯一 primary 为 `重新同步`，旧的报告/产物/执行动作不得继续作为 primary。
- 只有当前 scan 的架构报告成功解析且明确返回 `risks=[]`，才允许显示 `未识别到显著风险`；报告缺失、解析失败或未确认时显示 `风险状态不可用`，文件/模块/API/实体等未知值使用 `-`。
- task detail 必须回显当前 taskId；task.projectId 必须为正数；artifact 必须匹配 projectId + ownerType=SCAN_TASK + ownerId=taskId；preview record 必须与请求 artifact 和当前 scan 一致；execution 必须匹配 projectId + sourceType=SCAN_TASK + sourceId=taskId；code_chunks status 必须显式回显当前 scanTaskId，items 也必须全部归属当前 scan。
- taskId 切换必须立即清理旧 task/execution/artifacts/report/codeKnowledge 和交互状态；task/artifact/preview/execution/code_chunks 的迟到响应必须由 route generation 与独立 request sequence 拒绝。
- active scan polling 必须使用可取消的递归 `setTimeout`，每次请求结束后重新调度，并在 full refresh 进行时让位；旧请求不能提前清除当前 refreshing/loading。
- 1440x900、1024x768、768x1024、390x844、320x740 均在 `scrollY=0` 验证；INITIAL_LOADING primary=0，FATAL_LOAD/STALE_REFRESH primary=1；错误标题、完整原因和主按钮必须位于首屏且不裁切、不横向溢出、不低对比。
- 新增独立 focused Playwright/config 和 canonical package/Make target；必须覆盖 5 initial、至少 15 fatal source cases、5 stale、5 confirmed-empty-risk semantics 和 1 个 A -> B delayed core/detail race；测试全部 mock API，禁止 `scrollIntoViewIfNeeded`。
- 现有 batch4A 只证明 code_chunks 与 governance 局部恢复；其 marker 不得继续把未执行的 top-level `扫描报告加载失败` 当成运行证据。
- frontend UI validator、production build、`git diff --check`、桌面/320 visual trace 和 Product/Frontend/QA/Architect 复核必须 PASS。

非范围：

- 不改后端 API、数据库、Flyway、扫描状态机、analyzer 或 release evidence schema。
- 不证明真实扫描成功、报告事实正确、无安全风险、LLM 判断正确、RBAC、生产部署或 P9 全阶段完成。
- AgentChat 移动 composer/首屏仲裁保留为下一 P9 候选。

交付结果（2026-07-10）：

- `ScanTaskDetail` 已落地 `INITIAL_LOADING / FATAL_LOAD / STALE_REFRESH / READY`，并以 task、artifact、preview、execution、code_chunks 的 scan/project/generation 归属作为提交前提。
- preview 刷新失败且已有可信快照时保留旧快照并进入 `STALE_REFRESH`；首次无可信快照的 task、artifact list 或归属失败进入 `FATAL_LOAD`。
- 报告缺失、非法 JSON、缺少 codeQuality/risks 或 risks 非数组时统一显示“风险状态不可用”；仅明确 `risks=[]` 时显示“未识别到显著风险”。
- 无 execution steps 时显示“执行步骤证据未提供”，不再合成 `taskId=0 / PENDING` 的虚假排队步骤。
- focused smoke 7 passed / 48.5s；覆盖五视口、15 个独立 fatal 场景、5 个 confirmed-empty、5 类 risk fallback、preview stale/resync、五阶段 A -> B race 与真实递归 polling 竞态。
- desktop/320 的 READY 与 STALE 共 4 张成功 PNG 已落盘并人工复核；frontend UI validator、production build、`git diff --check` PASS。
- Product 首轮 BLOCK 与 QA 首轮 PARTIAL 的全部问题已返工关闭；Product、Frontend、QA、Architect 最终复核均 PASS。
- 边界：本切片 focused GREEN；不刷新 full release authority，不证明真实后端 E2E、报告事实正确、RBAC、生产部署或 P9 全阶段完成。
