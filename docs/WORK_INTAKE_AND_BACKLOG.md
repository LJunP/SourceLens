# SourceLens Work Intake and Backlog

> AIOS v2.3 状态：`LEGACY BACKLOG / FROZEN`。旧 backlog 不会自动进入新路线。P0 期间只有 `aios/truth/project_state.yaml` 中的 active P0 work 和符合 Master Task Contract 的任务可执行。

> DEFAULT AGENT CONTEXT: `EXCLUDED`。禁止从本文自动恢复任务；只有当前 Task Contract 明确引用时，才可读取指定条目作为历史证据。

状态：冻结的迁移前需求台账；不再接收、排序或启动当前任务。

## 1. 入口规则

所有工作必须先归类，再进入开发。

| 类型 | 示例 | 处理 |
| --- | --- | --- |
| Bug | 后端报错、UI 裁切、任务状态错误 | 按影响定 P0-P3 |
| Feature | code_chunks、报告体验、AutoRepair、GitHub App | 先写验收标准 |
| Refactor | 架构、状态机、UI 原语、数据模型 | 必须说明收益和风险 |
| Security | SSRF、raw access、secret、sandbox | 默认高优先级 |
| Ops | CI、release evidence、backup、rollback | 阶段/发布前必查 |
| Docs/Governance | 制度、交接、代码地图 | 按维护分级处理 |

## 2. 优先级

| 优先级 | 定义 | SLA |
| --- | --- | --- |
| P0 | 主链路不可用、安全泄漏、数据破坏、危险操作误执行 | 立即处理，不能继续阶段放行 |
| P1 | 核心体验严重受损、报告可信度下降、任务可靠性缺陷 | 当前阶段必须 owner 化 |
| P2 | 重要增强、可维护性、性能和体验改善 | 纳入阶段计划 |
| P3 | 长期优化、非核心体验、低风险清理 | 周期处理 |
| Later | 高级集成或未来商业化能力 | 不阻塞当前主线 |

## 3. 进入主线条件

一项工作进入实现前必须满足：

- 所属 phase 和 track 明确。
- 用户价值明确。
- 非目标明确。
- 验收标准明确。
- owner 明确。
- 风险等级明确。
- 需要的 agent 角色明确。

## 4. Backlog 字段

```text
ID:
Title:
Priority:
Phase:
Track:
Owner:
User value:
Scope:
Non-goals:
Acceptance:
Risks:
Dependencies:
Status:
```

## 5. 拒绝进入主线的情况

- 没有用户价值或工程风险消除目标。
- 只因为“看起来高级”而引入复杂技术。
- 会阻塞 P6/P9/P10/P11 主线但收益不明确。
- GitHub App、私有仓库、多用户、生产部署等后置层被提前强行塞进当前主线。
- 无法定义验收标准。

## 6. 已进入主线的近期工作

```text
ID: P6-HOSTED-SOURCE-URL-EVIDENCE-PATH-NORMALIZATION-20260705
Title: Hosted source URL evidence path normalization
Priority: P1
Phase: P6
Track: code_chunks retrieval / report evidence URL anchor / same-name file disambiguation / backend regression
Owner: 梁文峰 / 拉里佩奇 / 达里奥 / 特朗普
User value: 用户从 GitHub/GitLab 代码浏览页或 raw URL 复制 `filePath/sourcePath` 证据时，Code QA/code_chunks 应归一化到仓库内相对路径，避免同名文件 decoy 只靠 basename fallback 抢占第一结果。
Scope: `CodeLocationHintParser` hosted source URL path normalization、`CodeChunkServiceTest` same-name decoy 回归、必要阶段记录。
Non-goals: 不开放普通 `url/path/location` 字段为 evidence anchor；不改 API/DTO/DB schema、ranking 权重、前端 UI、release evidence schema、真实 LLM provider 或 GitHub App。
Acceptance: `https://github.com/{owner}/{repo}/blob/main/...#L245` 和 `https://raw.githubusercontent.com/{owner}/{repo}/main/...#L245` 在 evidence file path 白名单字段中归一化为仓库内相对路径；同名 decoy 在 mapper 结果中排在目标前时，目标仍为第一结果；focused backend test、static security regression、diff whitespace 和 QA 只读复核 PASS。
Risks: 只对源码托管浏览 URL 做路径前缀归一化；普通 `path` 字段继续不作为 evidence anchor；完整 report evidence schema parser 仍后置。
Dependencies: Existing evidence file path whitelist, pathSuffixHints, evidenceFilePathHintScore, exact line anchor ranking。
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS / HOST-AWARE BOUNDARY TIGHTENED

ID: P6-CODE-QA-CITATION-LABEL-CANONICAL-NORMALIZATION-20260705
Title: Code QA citation label canonical normalization
Priority: P1
Phase: P6
Track: Code QA citation enforcement / claim coverage / answer citation normalization / backend regression
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: LLM 回答输出 `[c01]`、`[C01]` 等大小写或零填充 citation label 时，应被规范化为现有证据标签 `C1`，避免真实引用被误判为 invalid 或触发无意义 retry。
Scope: CodeQaController citedLabels normalization、CodeQaControllerTest、LlmClientAdapterTest focused regression、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、CodeChunkSearchItem sourceLabel 生成规则、前端 UI、release evidence schema、LLM provider；不放宽混用括号、代码块、日志行、示例行和不存在标签的安全边界。
Acceptance: `[c01]` canonical 成 `C1` 并让 grounding/citationCoverage/claimCoverage 均视为有效引用；`C0` 或无法解析数字不产生有效标签；既有 combined citation block、range citation、fake citation noise、malformed mixed bracket 回归继续通过；focused controller/adapter 测试和 static security regression PASS。
Risks: 仅规范化 citation label 数字形式，不改变可用标签集合；过大标签仍会在 available-label 校验中 fail-closed。
Dependencies: Existing answer citation parser, claimCitationCoverage, groundingStatus, CodeQaControllerTest citation matrix。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P11-CODECHUNKS-ROOT-METADATA-SCHEMA-GATE-20260706
Title: code_chunks root metadata schema contract gate
Priority: P1
Phase: P11 / P12-pre
Track: release evidence / DB schema drift prevention / code_chunks root metadata
Owner: 比尔盖茨 / 黄仁勋 / 拉里佩奇 / 奥特曼 / 特朗普
User value: root metadata persistence 已进入 code_chunks 主链路后，测试 schema、mapper、DTO、controller sanitizer 和 V032 migration 不得再次漂移，避免发布前才暴露 schema/mapper 不一致。
Scope: `schema-test.sql`、`CodeChunkMapperSchemaTest`、`validate-db-schema-contract.mjs`、`verify-all.sh`、必要阶段记录和 code map freshness。
Non-goals: 不声明真实 MySQL/Flyway migration smoke 已完成；不改 production migration 内容；不做历史 scan 回填；不引入完整 package-manager workspace graph。
Acceptance: H2 test schema 包含 `workspace_root/module_root` 与 root indexes；mapper schema smoke 通过真实 Spring/H2 context 插入并读回 root metadata；静态 DB schema contract gate 锁住 V032、H2 schema、entity、mapper、DTO、controller sanitizer 和关键 tests；`verify-all.sh` 在 heavy backend tests 前执行该 gate；focused backend tests、schema gate、shell syntax、scoped whitespace、code-map-check 和固定岗位复核 PASS。
Risks: 真实 MySQL/Flyway disposable migration smoke 仍是 P12-pre/release 前必须补的环境级验证，不由本轮 substring/static gate 替代。
Dependencies: `P6/P10/P11 code_chunks workspace/module root metadata persistence`、V032 migration、`CodeChunkMapper.insertBatch`、`CodeChunkController.safeRootMetadata`。
Status: DONE / DB SCHEMA CONTRACT + BACKEND FOCUSED TEST + ROLE REVIEW PASS / MYSQL FLYWAY SMOKE REMAINS RELEASE GATE。

ID: P12PRE-MYSQL-FLYWAY-MIGRATION-SMOKE-20260706
Title: disposable MySQL Flyway migration smoke gate
Priority: P1
Phase: P12-pre / P11
Track: production readiness / Flyway migration execution / release gate
Owner: 黄仁勋 / 比尔盖茨 / 拉里佩奇 / 奥特曼 / 特朗普
User value: V032 和既有 32 个 migration 必须在真实 MySQL/Flyway 环境中可执行，不能只依赖 H2 schema parity 或静态 contract gate。
Scope: `MySqlFlywayMigrationSmokeTest`、`mysql-flyway-migration-smoke.sh`、`Makefile mysql-flyway-smoke`、`validate-db-schema-contract.mjs`。
Non-goals: 不把 Docker/MySQL heavy smoke 强塞进日常 `make verify`；不改 production migration；不跑私有仓库、GitHub App 或生产部署。
Acceptance: 一次性 MySQL 8.4 digest-pinned container 启动在随机 loopback port；Spring/Flyway 真实执行 32 个 migration 到 v032；测试断言 V032 schema history、`workspace_root/module_root` 和 root indexes；脚本输出 `MYSQL_FLYWAY_MIGRATION_SMOKE_OK`；默认 Maven 测试跳过 opt-in smoke；固定岗位复核 PASS。
Risks: 该 smoke 依赖本机 Docker；Flyway 对 MySQL 8.4 输出 upgrade recommended warning，但真实执行已通过。作为 release/P12-pre gate，不作为日常轻量 verify gate。
Dependencies: `P11-CODECHUNKS-ROOT-METADATA-SCHEMA-GATE-20260706`、V032 migration、Docker。
Status: DONE / REAL MYSQL FLYWAY SMOKE PASS / DEVOPS-BACKEND-QA-SEC REVIEW PASS。

ID: P6-CODECHUNKS-WORKSPACE-ROOT-MANIFEST-SCAN-PRUNING-20260706
Title: code_chunks workspace root manifest scan pruning
Priority: P1
Phase: P6 / P10 / P11
Track: code_chunks root metadata / scan performance / dependency-build pollution control
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 奥特曼 / 特朗普
User value: code_chunks root metadata 不应把 `node_modules`、`dist`、`.git` 等不参与切片的目录中的 manifest 当作 workspace root，避免同名文件消歧被依赖包或构建产物污染。
Scope: `CodeChunkFileFilter` skip dir helper、`CodeChunkService.WorkspaceRootIndex.from` manifest traversal、`CodeChunkServiceRootIndexTest`。
Non-goals: 不重写主切片 `Files.walk` 遍历，不改变 skip dir 策略，不实现完整 package manager workspace graph，不刷新 full release authority。
Acceptance: workspace root manifest scan 对 skip dirs 使用 subtree pruning；合法 `packages/admin/package.json` 仍产生 workspace root；`node_modules/react/package.json`、`dist/apps/web/package.json`、`.git/package.json` 不产生 root；focused backend tests、scoped whitespace 和固定岗位复核 PASS。
Risks: 主切片遍历仍是 `Files.walk(repoRoot)` 后再由 `fileFilter.shouldInclude` 排除文件；后续可作为独立性能切片继续剪枝。
Dependencies: `P6-CODECHUNKS-ROOT-METADATA-PERSISTENCE-20260706`、`CodeChunkFileFilter` skip dir policy。
Status: DONE / BACKEND FOCUSED TEST PASS / DATA-BACKEND-QA-SEC REVIEW PASS。

ID: P6-CODE-QA-STRUCTURED-JSON-HANDLER-METHOD-ANCHOR-20260705
Title: Code QA structured JSON handler_class/handler_method method anchor
Priority: P1
Phase: P6
Track: Code QA retrieval / structured report handler evidence JSON / method anchor precision / backend regression
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 用户粘贴包含数组或嵌套 evidence object 的 report JSON 时，handler_class/handler_method 不应退化为普通关键词，也不得把父 object 的 handler_class 和子 object 的 handler_method 跨层误配；Code QA 应用结构化方法锚点定位正确 controller/service chunk。
Scope: CodeLocationHintParser structured JSON handler parser、legacy multiline handler object-boundary guard、methodAnchorFileHints、CodeLocationHintParserTest、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、controller EvidenceRef、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不支持 handlerClass/handlerMethod 新字段名，不实现完整 report evidence schema。
Acceptance: structured JSON object/array/nested object 中同一 object 的 handler_class + handler_method 解析为 MethodHint；parent handler_class + child handler_method 不跨层绑定；legacy compact/multiline handler 正例继续通过；nested/array handler evidence 能影响 Code QA retrieval 排序；focused parser/retrieval 测试和 static security regression PASS。
Risks: JSON candidate scanner 是 bounded best-effort；只支持当前 snake_case handler 字段；复杂坏 JSON 或超过 traversal budget 的深结构会被忽略或退回 legacy fallback。
Dependencies: Existing compact handler parser, structured JSON candidate traversal, methodAnchorFileHints, CodeChunkRanker method scoring。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-STRUCTURED-JSON-EVIDENCE-OBJECT-PARSER-20260705
Title: Code QA structured JSON evidence object parser
Priority: P1
Phase: P6
Track: Code QA retrieval / structured report evidence JSON / exact anchor precision / backend regression
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 用户粘贴包含数组、嵌套 evidence object、驼峰字段或 source URL path 的 report JSON 时，Code QA 应解析结构化 JSON object 内的 file_path/filePath + line/range 绑定，而不是只能依赖 flat regex 或 query-level hints。
Scope: CodeLocationHintParser structured JSON candidate parser、bounded JSON traversal、EvidenceLocationHint traversal、CodeLocationHintParserTest、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、controller EvidenceRef、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不实现完整 report evidence schema、跨父子 object 字段绑定或超长/恶意 JSON 深解析。
Acceptance: structured JSON object/array/nested object 中同一 object 的 file_path/filePath + line/range 解析为 EvidenceLocationHint；parent file_path + child line_number 不跨层绑定；malformed snippets 安全忽略 structured parse 并保留 flat fallback；nested/array evidence 能影响 Code QA retrieval 排序；focused parser/retrieval 测试和 static security regression PASS。
Risks: JSON candidate scanner 是 bounded best-effort；超长、复杂坏 JSON 或超过 traversal budget 的深结构会被忽略或退回 flat/query-level hints；完整 evidence object model 仍需后续演进。
Dependencies: Existing EvidenceLocationHint flat binding, compact file_path/line/range parsers, range-over-line priority, CodeChunkRanker exact anchor scoring。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-EVIDENCE-OBJECT-RANGE-OVER-LINE-PRIORITY-20260705
Title: Code QA evidence object range-over-line priority
Priority: P1
Phase: P6
Track: Code QA retrieval / report evidence object binding / line range precision / backend regression
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 同一个 compact evidence object 同时包含 `line_number` 与 `start_line/end_line` 时，Code QA 应优先使用更完整的范围证据，避免旧单行字段把检索带到错误 chunk。
Scope: CodeLocationHintParser EvidenceLocationHint range priority、CodeLocationHintParserTest、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、controller EvidenceRef、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不实现完整 JSON parser、嵌套 JSON 解析或复杂多 range 语义。
Acceptance: 同一 flat compact evidence object 中 `start_line/end_line` 优先于 `line/line_number/lineNumber`；parser 产出 range hint；Code QA retrieval 在错误 `line_number` 与正确 range 同时存在时返回 range 覆盖 chunk；focused parser/retrieval 测试和 static security regression PASS。
Risks: flat JSON object regex 不是完整 JSON parser；多个 range 字段时取第一组成对结果；倒序/坏值仍按现有 range 归一化规则处理。
Dependencies: EvidenceLocationHint file_path + line binding anchor, compact line number parser, compact start/end range parser, CodeChunkRanker exact anchor scoring。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-EVIDENCE-OBJECT-LOCATION-BINDING-20260705
Title: Code QA evidence object file_path + line binding anchor
Priority: P1
Phase: P6
Track: Code QA retrieval / report evidence object binding / exact anchor precision / backend regression
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 用户一次粘贴多个 compact raw JSON evidence object 时，Code QA 不应把 A 对象的 `file_path` 与 B 对象的 `line_number/start_line/end_line` 交叉拼成假 exact anchor；系统应优先使用同一 evidence object 内的 file+line 绑定。
Scope: CodeLocationHintParser EvidenceLocationHint parser、CodeChunkRanker exact anchor/scoring、CodeLocationHintParserTest、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、controller EvidenceRef、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不实现完整 JSON parser、嵌套 JSON 解析或非 compact/flat object 的强绑定。
Acceptance: 同一 flat compact JSON object 内 `file_path/filePath + line/line_number/lineNumber` 或 `start_line/end_line` 解析成 EvidenceLocationHint；跨 object 的 file-only + line-only 不产生绑定；Code QA exact anchor 使用绑定 hints 防止跨 object 误配；focused parser/retrieval 测试和 static security regression PASS。
Risks: flat JSON object regex 不是完整 JSON parser；超长、嵌套、非引号 path、复杂转义会退回旧 query-level hints；同一 object 同时存在 line_number 与 start/end 时当前优先单行字段。
Dependencies: Existing compact file_path, compact line number, compact start/end, exact anchor candidate merge, CodeChunkRanker line/path scoring。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-COMPACT-RAW-LINE-NUMBER-EVIDENCE-ANCHOR-20260705
Title: Code QA compact raw JSON line_number evidence anchor
Priority: P1
Phase: P6
Track: Code QA retrieval / compact report evidence JSON / line number anchor precision / backend regression
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 用户粘贴 compact raw JSON report evidence 时，`line/line_number/lineNumber` 不应丢失行号锚点；Code QA 应能结合 `file_path` 与 compact line field 定位覆盖目标行的 chunk，而不是被同文件错误行或同名文件噪声带偏。
Scope: CodeLocationHintParser compact line field parser、token cleanup、CodeLocationHintParserTest、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、controller EvidenceRef、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不实现完整 JSON parser、跨 object 严格绑定或结构化 evidence object model。
Acceptance: compact `line/line_number/lineNumber` 解析成 LineHint；`deadline/outline_line` 等非 evidence 字段不误识别；compact line fields 从 tokenization 中清理且保留文件名；compact raw `file_path + line_number` 能让 Code QA retrieval 优先返回目标文件中覆盖行号的 chunk；focused parser/retrieval 测试和 static security regression PASS。
Risks: 这是 regex 级字段提取，不是真 JSON parser；`line_number` 与 `file_path` 通过同一 query hints 联合打分，不是严格绑定同一 JSON object；多 object 异常混排仍可能需要后续结构化 parser。
Dependencies: Existing compact file_path evidence anchor, lineHintScore, exact anchor candidate merge, tight line range preference。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-COMPACT-RAW-HANDLER-METHOD-ANCHOR-20260705
Title: Code QA compact raw JSON handler_class/handler_method anchor
Priority: P1
Phase: P6
Track: Code QA retrieval / compact report evidence JSON / method anchor precision / backend regression
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 用户粘贴 compact raw JSON report evidence 时，`handler_class/handler_method` 不应丢失方法级锚点；Code QA 应能根据报告指定的处理类和方法定位正确 controller/service chunk，而不是被同名类、同名方法或关键词噪声带偏。
Scope: CodeLocationHintParser compact handler parser、CodeLocationHintParserTest、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、controller EvidenceRef、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不实现完整 JSON parser、非引号 handler 值解析或嵌套 JSON 解析。
Acceptance: compact quoted `handler_class/handler_method` 解析成 MethodHint；跨 compact object 的 handler_class-only + handler_method-only 不得误配；methodAnchorFileHints 包含 qualified package path variants；compact raw handler anchor 能让目标完整路径压过同名高噪声 decoy；focused parser/retrieval 测试和 static security regression PASS。
Risks: 这是 regex 级字段提取，不是真 JSON parser；只支持 Java identifier/package 风格 handler 值；对象边界 guard 是字符级，字符串值或嵌套对象含 `{}` 时可能保守丢弃。
Dependencies: Existing handler_class/handler_method parser, compact object-boundary guard, CodeChunkRanker methodHintScore and qualifiedClassPathScore。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-COMPACT-RAW-FILE-PATH-EVIDENCE-ANCHOR-20260705
Title: Code QA compact raw JSON file_path evidence anchor
Priority: P1
Phase: P6
Track: Code QA retrieval / compact report evidence JSON / file path anchor precision / backend regression
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户粘贴 compact raw JSON evidence 时，`file_path/filePath` 应进入 evidenceFilePathHints 强锚点，而不是只靠普通 pathSuffix 兜底；目标完整路径应能压过同名高噪声 decoy。
Scope: CodeLocationHintParser compact file_path parser、CodeLocationHintParserTest、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、controller EvidenceRef、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不实现完整 JSON parser 或非引号 compact path 值解析。
Acceptance: compact quoted `file_path/filePath` 被解析进 evidenceFilePathHints；非 evidence 的 `path` 字段不被接受；compact raw `file_path + start_line/end_line` 能让 Code QA retrieval 的目标完整路径压过同名高噪声 decoy；既有 line range、object-boundary、Vite/source URL 回归继续通过；focused parser/retrieval 测试和 static security regression PASS。
Risks: 这是 regex 级字段提取，不是真 JSON parser；compact 场景只支持带引号值；异常值主要靠后续 path matching 约束。
Dependencies: Existing compact raw start/end parser, object-boundary guard, CodeChunkRanker evidenceFilePathHintScore。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-COMPACT-RAW-START-END-OBJECT-BOUNDARY-GUARD-20260705
Title: Code QA compact raw JSON start/end object-boundary guard
Priority: P1
Phase: P6
Track: Code QA retrieval / compact report evidence JSON / line range precision / parser safety
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户粘贴多个 compact raw JSON evidence object 时，前一个对象的 `start_line` 不应与后一个对象的 `end_line` 误配成虚假的行范围；合法连续对象仍应各自解析范围。
Scope: CodeLocationHintParser object boundary reset、CodeLocationHintParserTest、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、controller EvidenceRef、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不实现完整 JSON parser、嵌套 JSON 解析或字符串内 brace 识别。
Acceptance: `start_line` 和 `end_line` 之间出现 `{` 或 `}` 时重置 pending range；跨 compact object 的 start-only/end-only 不产生 hint；连续合法 compact object ranges 仍解析；既有 multiline/compact raw range、Vite/source URL、retrieval first result 测试继续通过；聚焦 parser/retrieval 测试和 static security regression PASS。
Risks: 该 guard 是字符级边界，不是真 JSON parser；同一对象内字符串值或嵌套对象包含 `{}` 可能导致合法 range 被保守丢弃。
Dependencies: Existing compact raw start/end range parser and CodeQaRetrievalService raw range tests。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-COMPACT-RAW-START-END-LINE-RANGE-PARSER-20260705
Title: Code QA compact raw JSON start/end line range parser
Priority: P1
Phase: P6
Track: Code QA retrieval / compact report evidence JSON / line range precision / backend regression
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户把压缩成单行的报告 JSON 直接粘贴进 Code QA 问题时，`start_line/end_line` 或 `startLine/endLine` 不应丢失行范围锚点；系统应解析范围并定位覆盖目标范围的 chunk。
Scope: CodeLocationHintParser compact start/end range field scanning、parser token cleanup、CodeLocationHintParserTest、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、controller 结构化 EvidenceRef、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不实现完整 JSON object parser 或跨对象作用域绑定。
Acceptance: compact raw JSON 中成对 `start_line/end_line` 与 `startLine/endLine` 解析成 `LineHint(start,end)`；未成对 start/end 不产生 hint；tokenization 清理 compact start/end 字段；compact raw `file_path + start_line/end_line` 能让 Code QA retrieval 优先定位覆盖范围的 chunk；聚焦 parser/retrieval 测试和 static security regression PASS。
Risks: start/end 配对是全文流式配对，不按 JSON object 或 file_path 作用域隔离；多对象同一行混排可能误配；compact `file_path` 主要依赖 pathSuffixHints，不是 evidenceFilePathHints。
Dependencies: Existing raw multiline start/end range parser, CodeLocationHintParser line/path/source URL parser, CodeQaRetrievalService exact anchor tests。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-RAW-START-END-LINE-RANGE-PARSER-20260705
Title: Code QA raw JSON start/end line range parser
Priority: P1
Phase: P6
Track: Code QA retrieval / report evidence raw JSON / line range precision / backend regression
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户把报告 raw JSON 或证据片段直接粘贴进 Code QA 问题时，`start_line/end_line` 或 `startLine/endLine` 不应丢失行范围锚点；系统应把它解析成 line range，用于定位覆盖目标范围的 chunk。
Scope: CodeLocationHintParser raw start/end range fields、parser token cleanup order、CodeLocationHintParserTest、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 DTO/API/DB schema、controller 结构化 EvidenceRef、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不实现完整 JSON parser 或单行压缩 JSON 解析。
Acceptance: raw JSON/text 中成对 `start_line/end_line` 与 `startLine/endLine` 解析成 `LineHint(start,end)`；未成对 start/end 不产生 hint；tokenization 先清理 evidence line fields 再清理通用 path line hints；raw `file_path + start_line/end_line` 能让 Code QA retrieval 优先定位覆盖范围的 chunk；聚焦 parser/retrieval 测试和 static security regression PASS。
Risks: 当前是逐行字段解析，不是完整 JSON parser；压缩成单行的 raw JSON 不在本轮范围；倒置范围按 start-start 归一化。
Dependencies: Existing CodeLocationHintParser line/path/source URL parser and CodeQaRetrievalService exact anchor tests。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-TIGHT-LINE-RANGE-PREFERENCE-20260705
Title: Code QA tight line range preference
Priority: P1
Phase: P6
Track: Code QA retrieval / exact line anchor / line range precision / backend regression
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户从报告行号、stack trace 或 source URL 进入 Code QA 时，如果同一文件多个 chunk 都覆盖目标行，系统应偏向更紧的行范围，减少 broad chunk 抢占首位导致定位不精确。
Scope: CodeChunkRanker lineHintScore、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 API/DTO/DB schema、embedding/LLM provider、前端 UI、release evidence schema、GitHub App；不声明严格最短范围排序或真实项目整体质量已证明提升。
Acceptance: 完整覆盖 line hint 的 chunk 获得 tight range bonus；部分重叠/近邻逻辑不变；同一路径 broad 1-500 与 tight 81-92 都覆盖 :85 时，tight chunk 排第一；既有 exact line/method/stack/source URL 和 per-file cap 测试继续通过；聚焦后端测试和 static security regression PASS。
Risks: tight bonus 是分档偏好，不是绝对最短范围保证；同一档或 broad chunk 内容分明显更高时仍可能反超。
Dependencies: Existing CodeChunkRanker line hint and CodeQaRetrievalService exact anchor tests。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P6-CODE-QA-EXACT-ANCHOR-PER-FILE-CAP-20260705
Title: Code QA exact-anchor per-file first-pass cap
Priority: P1
Phase: P6
Track: Code QA retrieval / exact anchor / cross-file evidence quality / backend regression
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户从报告行号、stack trace 或源码位置进入 Code QA 时，目标文件的重叠 chunk 不能把 top context 全部占满，必须给 service/mapper 等跨文件证据留出上下文空间。
Scope: CodeQaRetrievalService exact-anchor first pass、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: 不改 API/DTO/DB schema、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App；不声明全局最优检索或真实项目整体质量提升。
Acceptance: exact-anchor 首轮每文件最多选择 1 个 chunk；首条 exact anchor 仍优先；overlapping same-file exact anchors 场景下 service 和 mapper 仍进入 selected top context；既有 line/method/stack/Vite source URL exact anchor 测试继续通过；聚焦后端测试和 static security regression PASS。
Risks: 该 cap 只限制首轮 exact-anchor 选择，后续 role/backfill 仍可按既有 `MAX_CONTEXT_CHUNKS_PER_FILE=2` 补入第二个同文件 chunk；不等于最终全局每文件只保留一个 exact chunk。
Dependencies: Existing CodeQaRetrievalService exact anchor and role diversity tests。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS。

ID: P9-PROJECT-DETAIL-WORKFLOW-TABLE-SCROLLER-20260705
Title: ProjectDetail workflow tables scroller containment
Priority: P2
Phase: P9
Track: frontend readability / project detail workflow table overflow / app shell smoke
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 用户在项目工作台查看仓库接入表和扫描任务表时，320px 窄屏下横向内容由表格自身滚动承接，不把整页撑宽。
Scope: ProjectDetail repository workflow table、scan workflow table、CSS scroller contract、app-shell-ui smoke、frontend static gate。
Non-goals: 全站表格治理、真实横向拖动距离验证、真实后端数据质量、后端/API/DB、release authority refresh、GitHub App。
Acceptance: 仓库表有稳定 `sl-project-repository-table` class 且保留 `scroll={{ x: 900 }}`；扫描表有稳定 `sl-project-scan-table` class 且保留 `scroll={{ x: 920 }}`；CSS 让 `.sl-workflow-table .ant-table-content` 承接 `overflow-x:auto`；app-shell smoke 返回非空长文本 repository/scan 行，mock code_chunks status probe，并在 desktop/390px/320px 视口切到仓库管理/扫描任务 tab 检查两个表格横向 containment；`validate-frontend-ui`、TypeScript、app-shell smoke、frontend build PASS。
Risks: 该切片只覆盖 ProjectDetail repository/scan workflow table 的横向 containment，不证明真实拖动滚动距离、全站表格、真实生产数据或全站 P9 完成。
Dependencies: P9 frontend readability track。
Status: DONE / focused P9 gate PASS。

ID: P9-DASHBOARD-RECENT-TABLE-SCROLLER-20260705
Title: Dashboard recent scans table scroller containment
Priority: P2
Phase: P9
Track: frontend readability / dashboard table overflow / app shell smoke
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 用户在运营仪表盘查看最近扫描的仓库、状态、Commit、触发方式、耗时和创建时间时，320px 窄屏下横向内容由表格自身滚动承接，不把整页撑宽。
Scope: Dashboard recent scans table、CSS scroller contract、app-shell-ui smoke、frontend static gate。
Non-goals: 全站表格治理、真实横向拖动距离验证、后端/API/DB、release authority refresh、GitHub App。
Acceptance: Dashboard 最近扫描表格有稳定 `sl-dashboard-recent-table` class；保留 `scroll={{ x: 760 }}`；CSS 让 `.ant-table-content` 承接 `overflow-x:auto`；app-shell smoke 返回非空长文本 recent scan 并在 desktop/390px/320px 视口检查 Dashboard 表格横向 containment；`validate-frontend-ui`、TypeScript、app-shell smoke、frontend build PASS。
Risks: 该切片只覆盖 Dashboard recent scans table 的横向 containment，不证明真实拖动滚动距离、全站表格、真实生产数据或全站 P9 完成。
Dependencies: P9 frontend readability track。
Status: DONE / focused P9 gate PASS。

ID: P9-PROJECTS-TABLE-SCROLLER-20260705
Title: Projects list table scroller containment
Priority: P2
Phase: P9
Track: frontend readability / projects table overflow / app shell smoke
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 用户在项目管理入口查看项目、技术栈、状态、健康度、创建时间和操作时，320px 窄屏下横向内容由表格自身滚动承接，不把整页撑宽。
Scope: Projects list table、CSS scroller contract、app-shell-ui smoke、frontend static gate。
Non-goals: 全站表格治理、真实横向拖动交互验证、后端/API/DB、release authority refresh、GitHub App。
Acceptance: Projects 表格有稳定 `sl-project-list-table` class；保留 `scroll={{ x: 900 }}`；CSS 让 `.ant-table-content` 承接 `overflow-x:auto`；app-shell smoke 在 desktop/390px/320px 视口访问 `/projects` 并检查表格横向 containment；`validate-frontend-ui`、TypeScript、app-shell smoke、frontend build PASS。
Risks: 该切片只覆盖 Projects list table 的横向 containment，不证明全站表格、真实滚动拖动交互、真实生产数据或全站 P9 完成。
Dependencies: P9 frontend readability track。
Status: DONE / focused P9 gate PASS。

ID: P9-CI-DIAGNOSTICS-TABLE-SCROLLER-20260705
Title: CiDiagnostics diagnostics table scroller containment
Priority: P2
Phase: P9
Track: frontend readability / CI diagnostics table overflow / browser smoke
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 用户在 CI 诊断页查看 workflow、状态、分类、分支、提交和重新分析操作时，320px 窄屏下横向内容由表格自身滚动承接，不把整页撑宽。
Scope: CiDiagnostics diagnostics table、CSS scroller contract、ci-diagnostics-detail-selection smoke、frontend static gate。
Non-goals: 全站表格治理、真实 CI 质量、真实 AutoRepair 质量、后端/API/DB、release authority refresh、GitHub App。
Acceptance: CI 诊断表格有稳定 class；CSS 让 `.ant-table-content` 承接 `overflow-x:auto`；smoke 在 desktop/narrow 视口检查 diagnostics table scroller；`validate-frontend-ui`、TypeScript、CI Diagnostics smoke、frontend build PASS。
Risks: 该切片只覆盖 CiDiagnostics diagnostics table，不证明其他页面表格、真实 CI/AutoRepair 质量或全站 P9 完成。
Dependencies: P9 frontend readability track。
Status: DONE / focused P9 gate PASS。

ID: P9-MODEL-CONFIG-PROVIDER-TABLE-SCROLLER-20260705
Title: ModelConfig provider table scroller containment
Priority: P2
Phase: P9
Track: frontend readability / model provider table overflow / browser smoke
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 用户在模型配置页查看 provider、endpoint、密钥状态和操作时，320px 窄屏下横向内容由表格自身滚动承接，不把整页撑宽。
Scope: ModelConfig provider table、CSS scroller contract、model-config-recoverable smoke、frontend static gate。
Non-goals: 全站表格治理、真实密钥/LLM provider 验收、后端/API/DB、release authority refresh、GitHub App。
Acceptance: Provider 表格有稳定 class；CSS 让 `.ant-table-content` 承接 `overflow-x:auto`；smoke 在 desktop/narrow 视口检查 provider table scroller；`validate-frontend-ui`、TypeScript、ModelConfig smoke、frontend build PASS。
Risks: 该切片只覆盖 ModelConfig provider table，不证明其他页面表格、真实 provider 调用或全站 P9 完成。
Dependencies: P9 frontend readability track。
Status: DONE / focused P9 gate PASS。

ID: P9-ISSUE-DECOMPOSITION-TABLE-SCROLLER-20260705
Title: IssueDecomposition main/task table scroller containment
Priority: P2
Phase: P9
Track: frontend readability / table overflow / browser smoke
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 用户在 Issue 拆解页面查看拆解队列和子任务时，窄屏下横向内容由表格自身滚动承接，不再把整页撑宽或隐藏关键列。
Scope: IssueDecomposition main table、task table、CSS scroller contract、issue-decomposition-detail-selection smoke、frontend static gate。
Non-goals: 全站表格治理、真实生产数据覆盖、后端/API/DB、release authority refresh、GitHub App 或真实 LLM provider。
Acceptance: 主表和子任务表有稳定 class；CSS 让 `.ant-table-content` 承接 `overflow-x:auto`；smoke 在 desktop/narrow 视口检查主表和子任务表 scroller；`validate-frontend-ui`、TypeScript、IssueDecomposition smoke、frontend build PASS。
Risks: 该切片只覆盖 IssueDecomposition detail selection 的 main/task table，不证明其他页面表格完成。
Dependencies: P9 frontend readability track。
Status: DONE / focused P9 gate PASS。

ID: P6-CODE-CHUNKS-ROLE-INTENT-NO-CONTENT-LIKE-20260705
Title: Code chunks role intent no-content-like hot path
Priority: P1
Phase: P6
Track: code_chunks retrieval / DB hot path / backend regression
Owner: 比尔盖茨 / 梁文峰 / 达里奥 / 特朗普
User value: 用户进行公开仓库 QA、报告追问或 code_chunks 检索时，controller/service/data/model intent 补池不能继续扫描 `code_chunks.content` 大字段导致卡顿。
Scope: CodeChunkService role intent candidate query、CodeChunkServiceTest、必要阶段记录。
Non-goals: 全文索引、向量库、新检索服务、DB schema 改动、前端 UI、release authority refresh、真实 LLM provider。
Acceptance: `addRoleIntentConditions(...)` 不再使用 `CodeChunk::getContent`；role intent 查询只使用 `file_path` 结构信号；Java/Kotlin 常见路径后缀保留；定向后端测试 PASS；运行代码中无 `content LIKE` 查询命中；`security-regression-check.sh --suite static` 锁住运行代码不得回退 `like(CodeChunk::getContent)`。
Risks: path/structure-first 会放弃非常规命名文件中的注解 content 召回；后续如需补召回，应使用索引化字段或 analyzer metadata，不回退到 MEDIUMTEXT LIKE。
Dependencies: P6/P11 Code Chunk Query Hot Path and Release Authority Refresh。
Status: DONE / BACKEND TEST + STATIC SECURITY PASS
```

```text
ID: P6-CODE-QA-ROLE-DIVERSITY-20260705
Title: Code QA retrieval evidence role diversity
Priority: P1
Phase: P6
Track: Code QA retrieval / cross-file evidence quality / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: 用户问一个业务链路时，QA 检索结果不能被多个同类 controller 或 service 填满，必须尽量覆盖 controller、service、data-access 等不同证据角色。
Scope: CodeQaRetrievalService、CodeQaRetrievalServiceTest、必要项目记录。
Non-goals: 不改 API/DTO/DB schema、embedding provider、LLM provider、前端 UI、release evidence schema 或 GitHub App。
Acceptance: 保留首条最高相关结果；在通用回填前按 evidenceType 补齐不同角色；高分同类 controller 噪声存在时，top context 仍包含 service 和 mapper/data-access；聚焦 Maven 测试通过。
Risks: 角色多样性不能压过 exact location anchor；不能让前端 route 问题错误优先 backend controller。
Dependencies: 既有 CodeChunkRanker.evidenceType、Code QA selectTopChunks、P6 report evidence anchor。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P11-PUBLIC-REPO-UI-START-END-ONLY-FOCUSED-EVIDENCE-20260705
Title: Public repo UI start/end-only focused release evidence
Priority: P1
Phase: P11 / P6
Track: Release evidence / public repo UI smoke / QA citation trust
Owner: 达里奥 / 特朗普
User value: 用真实公开仓库 smoke 和 release verifier 证明 start/end-only QA 证据链已经进入发布证据门禁，而不是只靠单测或伪造样本。
Scope: focused release evidence package、public repo UI marker inspection、release verifier run、必要阶段记录。
Non-goals: full release authority、DB schema、真实 LLM provider、GitHub App、私有仓库、多用户、生产部署。
Acceptance: 证据包 public-repo-smoke OK；`PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.startEndOnlyEvidenceRef` 存在；request/response 均无 legacy `lineNumber`；`REPORT_LINE_ANCHOR`、PRIMARY、current scan 绑定成立；`verify-release-evidence.sh` PASS。
Risks: 该证据包是 focused evidence，不覆盖所有 release profile、灾备、GitHub App、真实 LLM provider 或生产发布能力。
Dependencies: P6/P11 public repo UI start/end-only release marker。
Status: DONE / FOCUSED RELEASE EVIDENCE VERIFIED
Evidence: release-evidence/public-repo-ui-start-end-only-20260705-042402
```

```text
ID: P9-QA-EVIDENCE-RANGE-DISPLAY-PRIORITY-20260705
Title: QA evidence range display priority
Priority: P1
Phase: P9 / P6
Track: ProjectDetail QA / report evidence bridge / start-end-only readability
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 当旧 evidenceLine 与结构化 start/end 同时存在时，QA 页面必须优先展示结构化范围，避免用户误读来源行号。
Scope: ProjectDetail evidenceRef display model、QA evidence bridge UI、report-evidence-drawer smoke marker。
Non-goals: 后端、DB schema、真实 LLM provider、release verifier、GitHub App、移除 lineNumber fallback。
Acceptance: `startLine/endLine` 有效时显示 `范围 xx-yy`；旧 `evidenceLine=999` 冲突时不显示旧值；来源可信度显示 `行范围` / `第 xx-yy 行`；desktop/mobile/narrow smoke PASS。
Risks: 该切片只覆盖 ProjectDetail QA UI，不证明 public-repo direct API proof 的页面显示。
Dependencies: P6/P9 report evidence start/end QA deeplink。
Status: DONE / FRONTEND BUILD+SMOKE PASS
```

```text
ID: P11-PUBLIC-REPO-UI-START-END-ONLY-RELEASE-MARKER-20260705
Title: Public repo UI start/end-only release marker gate
Priority: P1
Phase: P6 / P11
Track: release verifier / public repo UI smoke marker / forged security regression
Owner: 达里奥 / 黄仁勋 / 特朗普
User value: start/end-only 证据链不能只停留在单测和 mocked smoke；release evidence 必须证明 public repo UI QA 也能用无 legacy `lineNumber` 的 start/end-only evidenceRef 形成行级锚点。
Scope: `public-repo-ui-smoke` marker、`verify-release-evidence.sh`、`security-regression-check.sh` public repo UI marker forgery suite、必要治理记录。
Non-goals: 真实 GitHub App、DB schema、真实 LLM provider、新 release package、生产部署。
Acceptance: `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.startEndOnlyEvidenceRef` 存在；verifier 强校验 request/response bound、无 legacy lineNumber、`REPORT_LINE_ANCHOR`、PRIMARY、`coverageScopes` 包含 PRIMARY；security regression 拒绝 missing/legacy line/file-anchor/primary-unbound forged marker。
Risks: 本轮不生成新的 full release evidence package；下一次 release evidence 运行会吸收该 marker schema。
Dependencies: P6-BACKEND-SOURCE-URL-START-END-ONLY-QA-20260705。
Status: DONE / FRONTEND BUILD + SECURITY REGRESSION PASS
```

```text
ID: P6P9P11-REPORT-EVIDENCE-START-END-ONLY-QA-SMOKE-20260705
Title: Report evidence start/end-only QA smoke
Priority: P1
Phase: P6 / P9 / P11
Track: Report evidence drawer / Code QA evidenceRef / frontend smoke
Owner: 扎克伯格 / 拉里佩奇 / 达里奥 / 特朗普
User value: 报告证据只有 `start_line/end_line`、没有 legacy `line_number` 时，用户从报告证据抽屉进入 QA 仍必须保留结构化行号范围，不能退化为无行号或错误单行。
Scope: `report-evidence-drawer-smoke` primary report fixture、QA request/response assertions、必要治理记录。
Non-goals: DB schema、真实 LLM provider、AutoRepair provenance schema、GitHub App、full release evidence package。
Acceptance: fixture 不提供 `line_number`；drawer/query/QA request/QA response 均使用 `24-42` / `startLine=24` / `endLine=42`；`lineNumber` 不被前端合成；smoke 2 tests PASS。
Risks: 该切片证明 mocked frontend smoke 链路，不等同于 full public-repo live release authority。
Dependencies: P6/P9/P11 报告证据 start/end 行号 QA 深链 smoke。
Status: DONE / FRONTEND BUILD+SMOKE PASS
```

```text
ID: P6-BACKEND-SOURCE-URL-START-END-ONLY-QA-20260705
Title: Backend Code QA source URL start/end-only anchor contract
Priority: P1
Phase: P6 / P11
Track: Code QA evidenceRef / source URL normalization / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: 前端堆栈、Vite source URL 或报告 URL 只提供 `start_line/end_line` 时，后端仍必须形成行级证据锚点，不能要求调用方额外合成 `lineNumber`。
Scope: `CodeQaControllerTest` 增加 source URL + start/end-only evidenceRef 回归；必要治理记录。
Non-goals: 生产代码改造、DB schema、真实 LLM provider、AutoRepair provenance schema、GitHub App、full release evidence package。
Acceptance: request 使用 full Vite source URL + `start_line=245/end_line=250`；response 不包含 `sourceEvidenceRef.lineNumber`；保留 `startLine/endLine`；`sourceEvidenceMatchType=REPORT_LINE_ANCHOR`；PRIMARY/coverageScope 合同成立；focused backend test PASS。
Risks: 该切片是后端 mocked service 单测，不等同于完整 public repo live smoke。
Dependencies: P6P9P11-REPORT-EVIDENCE-START-END-ONLY-QA-SMOKE-20260705。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-EVIDENCE-START-END-LINE-20260705
Title: Code QA evidenceRef startLine/endLine anchors
Priority: P1
Phase: P6
Track: Code QA source evidence matching / API contract / frontend evidence bridge
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 报告证据常见 `start_line/end_line` 或 `startLine/endLine` 字段时，代码问答必须能形成行级证据闭环，而不是要求前端先拼成 `lineNumber=85-120`。
Scope: CodeQaRequest.EvidenceRef、CodeQaController source evidence matching、ProjectDetail evidence bridge、API_DESIGN、focused tests。
Non-goals: DB schema、AutoRepair provenance schema、真实 LLM provider、release evidence package、GitHub App。
Acceptance: `start_line/end_line` snake_case 请求可反序列化；`startLine/endLine` 能派生 `line: x-y` 检索上下文；与 chunk 行区间重叠时返回 `REPORT_LINE_ANCHOR` 和 PRIMARY；无效 `lineNumber` 可回退到 start/end；有效 `lineNumber` 与 start/end 冲突时保持旧字段优先；前端 build 和 API contract gate PASS。
Risks: 该切片不证明所有报告字段来源都会传 start/end；同名短路径仍必须依赖既有 ambiguous fail-closed。
Dependencies: P6-REPORT-EVIDENCE-ANCHOR-RANGE-AND-HANDLER-ORDER-20260705。
Status: DONE / BACKEND+FRONTEND BUILD PASS
```

```text
ID: P6P9P11-REPORT-EVIDENCE-START-END-QA-DEEPLINK-20260705
Title: Report evidence start/end line QA deeplink smoke
Priority: P1
Phase: P6 / P9 / P11
Track: report evidence drawer / ProjectDetail QA bridge / frontend smoke
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 用户从报告证据抽屉进入代码问答时，`start_line/end_line` 不能只停留在后端 DTO；前端深链、QA 请求和 QA 响应必须都保留结构化行号范围。
Scope: ScanTaskDetail report evidence model and deeplink params、ProjectDetail URL parsing、report-evidence-drawer Playwright smoke、必要阶段记录。
Non-goals: DB schema、AutoRepair provenance schema、真实 LLM provider、full release evidence package、GitHub App。
Acceptance: 报告风险/API 证据可读取 `start_line/end_line`；QA deep link 写入 `evidenceStartLine/evidenceEndLine`；ProjectDetail 解析为 `evidenceRef.startLine/endLine`；smoke 断言 QA request/response 均绑定 start/end；frontend build 和 report-evidence smoke PASS；生成物已清理。
Risks: QA 页 UI 仍优先显示 `lineNumber`，有单行字段时不强制展示区间；本轮只证明链路传递，不改变显示优先级。
Dependencies: P6-CODE-QA-EVIDENCE-START-END-LINE-20260705。
Status: DONE / FRONTEND BUILD+SMOKE PASS
```

```text
ID: P6-REPORT-EVIDENCE-ANCHOR-RANGE-AND-HANDLER-ORDER-20260705
Title: Report evidence line range and handler field order anchors
Priority: P1
Phase: P6
Track: report evidence anchor / code_chunks retrieval / Code QA source evidence matching
Owner: 梁文峰 / 达里奥 / 特朗普
User value: 用户从报告 JSON 或证据抽屉追问时，`handler_method`/`handler_class` 字段顺序不应影响方法锚点；`lineNumber=85-120` 这类范围行号若与 chunk 重叠，必须保持行级证据闭环。
Scope: CodeLocationHintParser JSON handler parser、CodeQaController source evidence line range matching、CodeChunkServiceTest、CodeQaControllerTest、必要阶段记录。
Non-goals: API/DTO/DB schema、泛化 `path:` 字段、start_line/end_line 解析、retrieval ranking 大改、前端 UI、release evidence schema、GitHub App。
Acceptance: 反序 `handler_method` + `handler_class` 仍补入目标 method anchor candidate；`evidenceRef.lineNumber=85-120` 与同文件 chunk `100-130` 重叠时返回 `REPORT_LINE_ANCHOR` 且 chunk 为 PRIMARY；focused backend tests PASS。
Risks: 范围行号只从 `evidenceRef.lineNumber` 解析，不扩大到报告 JSON `start_line/end_line`，避免误触发既有边界。
Dependencies: Existing report evidence anchor and Code QA source evidence matching tests。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-CHUNKS-ROLE-DIVERSITY-FRONTEND-SOURCE-20260705
Title: Code chunks frontend intent pool and source role diversity
Priority: P1
Phase: P6
Track: code_chunks retrieval / cross-file evidence / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: 代码问答和检索不能被同类 Controller 或文档噪声挤满；中文“前端页面/组件”问题必须能主动补前端候选，普通源码实现类也必须保留跨角色证据位。
Scope: CodeChunkRanker role intent、CodeChunkService role intent candidate pool、CodeQaRetrievalService role diversity、CodeChunkServiceTest、CodeQaRetrievalServiceTest、必要阶段记录。
Non-goals: API/DTO/DB schema、embedding provider、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: `FRONTEND` role intent 可由中文/英文前端页面组件问题触发；Service 查询补前端候选；Top context diversity 纳入 `SOURCE`；focused backend tests PASS。
Risks: 该切片增强候选召回和排序，不证明真实仓库所有前端框架路径都已完全覆盖。
Dependencies: Existing code_chunks retrieval and Code QA retrieval tests。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-UNICODE-RANGE-AND-PLUS-BULLET-20260705
Title: Code QA Unicode citation range and plus bullet claim split
Priority: P1
Phase: P6
Track: Code QA citation trust / claim coverage / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: LLM 常用 `[C1–C2]` 这类 Unicode dash 范围和 `+` Markdown bullet。系统必须正确展开有效范围、拒绝反向 malformed range，并把 `+` 后未引用代码事实单独标记为 UNCITED。
Scope: CodeQaController citation range parser、claim split pattern、claim normalization、CodeQaControllerTest、必要阶段记录。
Non-goals: API/DTO/DB schema、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: Unicode dash range 纳入 range parser；`[C2–C1]` 不降级为普通 token；citation 后 `+ TokenRepository ...` 拆为独立 claim；focused controller tests PASS。
Risks: 该切片只覆盖 citation/claim audit parser，不证明真实 LLM provider 输出质量。
Dependencies: P6-CODE-QA-INVALID-RANGE-STRICTNESS-20260705、P6-CODE-QA-CLAIM-SPLIT-FILE-PATH-20260705。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P9-ARTIFACT-FOCUS-CARD-READABILITY-20260705
Title: Artifacts focus card evidence readability
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / artifact evidence readability / Playwright smoke
Owner: 扎克伯格 / 雷军 / 达里奥 / 特朗普
User value: 运行产物证据中心的 primary evidence 和 owner/source 等焦点证据值必须完整可读，不能在桌面或移动端被 `nowrap + ellipsis` 隐藏。
Scope: Artifacts focus card CSS、artifacts detail-selection smoke、必要阶段记录。
Non-goals: 后端 API、artifact schema、raw download policy、报告事实质量、release evidence package、GitHub App。
Acceptance: `.sl-artifact-focus-head strong` 和 `.sl-artifact-focus-meta strong` 必须允许换行；1440px、390px、320px smoke 必须检查 focus card critical text 不被单行裁切且无横向溢出；frontend UI validator 和 build PASS。
Risks: 该切片只覆盖 Artifacts focus card，不声明所有产物页面 chip、table cell 或 drawer copy 都已完成治理。
Dependencies: P9 前端可读性治理、Artifacts detail-selection smoke。
Status: DONE / FRONTEND SMOKE PASS
```

```text
ID: P9-ARTIFACT-FILTER-CHIP-READABILITY-20260705
Title: Artifacts filter chip evidence readability
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / artifact evidence filter readability / Playwright smoke
Owner: 扎克伯格 / 雷军 / 达里奥 / 特朗普
User value: 运行产物证据中心的证据包 chip 和产物类型 chip 必须完整展示 owner、meta、来源、类型和大小，不能在桌面或移动端被 `nowrap + ellipsis` 隐藏。
Scope: Artifacts bundle/type chip CSS、artifacts detail-selection smoke、必要阶段记录。
Non-goals: 后端 API、artifact schema、raw download policy、报告事实质量、release evidence package、GitHub App。
Acceptance: `.sl-artifact-bundle-chip span/small/i` 和 `.sl-artifact-type-chip span/small` 必须允许换行；1440px、390px、320px smoke 必须检查 filter chip critical text 不被单行裁切且无横向溢出；frontend UI validator 和 build PASS。
Risks: 该切片只覆盖 Artifacts filter chips，不声明所有产物 table cell 或 drawer copy 都已完成治理。
Dependencies: P9-ARTIFACT-FOCUS-CARD-READABILITY-20260705、Artifacts detail-selection smoke。
Status: DONE / FRONTEND SMOKE PASS
```

```text
ID: P9-ARTIFACT-TABLE-CELL-READABILITY-20260705
Title: Artifacts table cell evidence readability
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / artifact table readability / Playwright smoke
Owner: 扎克伯格 / 雷军 / 达里奥 / 特朗普
User value: 运行产物表格的 artifact type、content type、owner 和 repository 关键证据必须完整可读，不能在表格列内被默认单行样式裁切。
Scope: Artifacts table type/owner cell markup and CSS、artifacts detail-selection smoke、必要阶段记录。
Non-goals: 后端 API、artifact schema、raw download policy、报告事实质量、release evidence package、GitHub App。
Acceptance: 表格 type/owner 单元格有稳定 class；`.sl-artifact-table-type-cell` 和 `.sl-artifact-table-owner-cell` 内 tag/typography 必须允许换行；1440px、390px、320px smoke 必须检查目标行和二级行关键文本不被单行裁切；frontend UI validator 和 build PASS。
Risks: 该切片只覆盖 Artifacts table type/owner 列，不声明所有表格操作列、时间列或 drawer copy 都已完成治理。
Dependencies: P9-ARTIFACT-FILTER-CHIP-READABILITY-20260705、Artifacts detail-selection smoke。
Status: DONE / FRONTEND SMOKE PASS
```

```text
ID: P9-ARTIFACT-DRAWER-ACTION-STATUS-READABILITY-20260705
Title: Artifacts drawer action and status readability
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / artifact drawer readability / Playwright smoke
Owner: 扎克伯格 / 雷军 / 达里奥 / 特朗普
User value: 运行产物抽屉的来源、预览、下载、加载预览和状态提示必须完整可读，不能依赖 Ant 默认按钮/Alert 单行裁切。
Scope: Artifacts drawer action/status alert CSS、drawer alert class、artifacts detail-selection smoke、必要阶段记录。
Non-goals: 后端 API、artifact schema、raw download policy、报告事实质量、release evidence package、GitHub App。
Acceptance: drawer extra action labels 和 drawer status alert message/action 必须允许换行；1440px、390px、320px smoke 必须检查 drawer action/status critical text 不被单行裁切且无横向溢出；frontend UI validator 和 build PASS。
Risks: 该切片只覆盖 Artifacts drawer action/status 文案，不声明所有 raw preview、modal confirm 或 audit receipt 文案都已完成治理。
Dependencies: P9-ARTIFACT-TABLE-CELL-READABILITY-20260705、Artifacts detail-selection smoke。
Status: DONE / FRONTEND SMOKE PASS
```

```text
ID: P9-ARTIFACT-PREVIEW-TILE-READABILITY-20260705
Title: Artifacts preview tile readability
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / artifact preview readability / Playwright smoke
Owner: 扎克伯格 / 雷军 / 达里奥 / 特朗普
User value: 运行产物智能预览总览里的文件、代码行、API、风险等指标必须完整可读，不能被 preview tile 的单行 ellipsis 隐藏。
Scope: ArtifactPreviewRenderer preview tile markup、Artifacts preview tile CSS、artifacts detail-selection smoke、必要阶段记录。
Non-goals: 后端 API、artifact schema、raw download policy、报告事实质量、release evidence package、GitHub App。
Acceptance: preview tile label/value 必须有稳定 class；`.sl-artifact-preview-tile-label/value` 必须允许换行；1440px、390px、320px smoke 必须检查四个 preview tiles 的 label/value 不被单行裁切；frontend UI validator 和 build PASS。
Risks: 该切片只覆盖 smart preview summary tiles，不声明 raw JSON、modal confirm 或 audit receipt 文案都已完成治理。
Dependencies: P9-ARTIFACT-DRAWER-ACTION-STATUS-READABILITY-20260705、Artifacts detail-selection smoke。
Status: DONE / FRONTEND SMOKE PASS
```

```text
ID: P9-ARTIFACT-RAW-DOWNLOAD-CONFIRM-READABILITY-20260705
Title: Artifacts raw download confirm readability
Priority: P1
Phase: P9 / P10 / P11
Track: Frontend product experience / raw access boundary readability / Playwright smoke
Owner: 扎克伯格 / 奥特曼 / 雷军 / 达里奥 / 特朗普
User value: 原始产物下载确认弹窗是 raw access 安全边界，标题、风险说明、取消和确认下载按钮必须完整可读，避免用户误操作下载未脱敏 artifact。
Scope: Artifacts raw download Modal.confirm class/CSS、artifacts detail-selection smoke、必要阶段记录。
Non-goals: 后端 API、artifact schema、raw download policy、报告事实质量、release evidence package、GitHub App。
Acceptance: raw download confirm modal 必须有稳定 class；modal title/content/buttons 必须允许换行；1440px、390px、320px smoke 必须检查两次 raw download confirm 的 title/content/cancel/confirm 不被单行裁切；frontend UI validator 和 build PASS。
Risks: 该切片只覆盖 raw download confirm modal，不声明 audit receipt 或 raw JSON 文案都已完成治理。
Dependencies: P9-ARTIFACT-PREVIEW-TILE-READABILITY-20260705、Artifacts detail-selection smoke。
Status: DONE / FRONTEND SMOKE PASS
```

```text
ID: P9-ARTIFACT-RAW-DOWNLOAD-AUDIT-RECEIPT-READABILITY-20260705
Title: Artifacts raw download audit receipt readability
Priority: P1
Phase: P9 / P10 / P11
Track: Frontend product experience / raw access audit receipt readability / Playwright smoke
Owner: 扎克伯格 / 奥特曼 / 雷军 / 达里奥 / 特朗普
User value: 原始产物下载后的审计 receipt 和 fallback receipt 必须完整展示标题、receipt/fallback 说明和“查看下载审计”入口，保证 raw access 可追溯链路可读。
Scope: Artifacts raw download audit receipt CSS、artifacts detail-selection smoke、必要阶段记录。
Non-goals: 后端 API、artifact schema、raw download policy、报告事实质量、release evidence package、GitHub App。
Acceptance: `.sl-artifact-download-audit-receipt` 的 title/description/action 必须允许换行；1440px、390px、320px smoke 必须检查 success receipt 和 fallback receipt 不被单行裁切且无横向溢出；frontend UI validator 和 build PASS。
Risks: 该切片只覆盖 raw download audit receipt，不声明 raw JSON 文案都已完成治理。
Dependencies: P9-ARTIFACT-RAW-DOWNLOAD-CONFIRM-READABILITY-20260705、Artifacts detail-selection smoke。
Status: DONE / FRONTEND SMOKE PASS
```

```text
ID: P9-ARTIFACT-RAW-JSON-READABILITY-20260705
Title: Artifacts raw JSON readability
Priority: P1
Phase: P9 / P10 / P11
Track: Frontend product experience / redacted raw JSON readability / Playwright smoke
Owner: 扎克伯格 / 奥特曼 / 达里奥 / 特朗普
User value: 智能预览展开的原始 JSON 是脱敏后证据复核入口，summary 和 redacted raw JSON 内容必须完整可读，并且不能造成页面横向溢出。
Scope: Artifacts raw JSON details/pre CSS、artifacts detail-selection smoke、必要阶段记录。
Non-goals: 后端 API、artifact schema、raw download policy、脱敏算法、报告事实质量、release evidence package、GitHub App。
Acceptance: `.sl-artifact-raw-json summary` 和 `.sl-artifact-redacted-raw-json` 必须允许换行/断词；1440px、390px、320px smoke 必须检查 raw JSON summary/pre computed style，并证明展开后无横向溢出；frontend UI validator 和 build PASS。
Risks: 该切片只覆盖 display-redacted raw JSON readability，不改变 raw download 或脱敏规则。
Dependencies: P9-ARTIFACT-RAW-DOWNLOAD-AUDIT-RECEIPT-READABILITY-20260705、Artifacts detail-selection smoke。
Status: DONE / FRONTEND SMOKE PASS
```

```text
ID: P9P11-REPORT-REVIEW-GATE-20260705
Title: ScanTaskDetail report review gate release contract
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / release evidence verifier
Owner: 扎克伯格 / 达里奥 / 特朗普
User value: 用户在报告进入治理前可以看到报告可信度、证据包、代码知识库、修复入口、审计追踪和治理时间线 6 个门禁信号，并且移动端不再裁切文字。
Scope: ScanTaskDetail.tsx、app.css、report-evidence-drawer-smoke.spec.ts、validate-frontend-ui.mjs、verify-release-evidence.sh、security-regression-check.sh、focused release evidence、必要文档。
Non-goals: 后端 API/DTO/DB/ranker/LLM/GitHub App/webhook/full authority refresh。
Acceptance: validator PASS；web build PASS；report evidence drawer smoke PASS；security regression PASS；focused evidence package verifier PASS；marker 输出 reviewGate.visible=true、gateCount=6、gateKeys 精确顺序、minReadyCount 有效、390/320 移动视口覆盖、textNotClipped=true 和 noHorizontalOverflow=true。
```

```text
ID: P9P11-REPORT-ACTION-BOARD-20260705
Title: ScanTaskDetail report action board
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / release evidence verifier
Owner: 扎克伯格 / 达里奥 / 特朗普
User value: 用户在报告总览中可以直接分流到风险复核、代码问答、Agent 复核、审计追踪、依赖复核和修复候选，不再只看到静态报告结论。
Scope: ScanTaskDetail.tsx、app.css、report-evidence-drawer-smoke.spec.ts、validate-frontend-ui.mjs、verify-release-evidence.sh、security-regression-check.sh、focused release evidence、必要文档。
Non-goals: 后端 API/DTO/DB/ranker/LLM/GitHub App/webhook/full authority refresh。
Acceptance: validator PASS；web build PASS；report evidence drawer smoke PASS；security regression PASS；focused evidence package verifier PASS；marker 输出 actionBoard.visible=true、actionCount=6、actionKeys 精确顺序、codeQaLinkVisible=true、repairCandidateVisible=true、390/320 移动视口覆盖和 noHorizontalOverflow=true。
```

```text
ID: P9P11-REPORT-MAIN-PATH-GUIDE-20260705
Title: ScanTaskDetail report main path guide
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / release evidence verifier
Owner: 扎克伯格 / 达里奥 / 特朗普
User value: 用户在报告总览中看到明确的 3 步推进路径：先执行推荐动作，再复核报告引用质量，最后按优先级打开证据入口。
Scope: ScanTaskDetail.tsx、app.css、report-evidence-drawer-smoke.spec.ts、validate-frontend-ui.mjs、verify-release-evidence.sh、security-regression-check.sh、focused release evidence、必要文档。
Non-goals: 后端 API/DTO/DB/ranker/LLM/GitHub App/webhook/full authority refresh。
Acceptance: validator PASS；web build PASS；report evidence drawer smoke PASS；security regression PASS；focused evidence package verifier PASS；marker 输出 mainPathGuide.visible=true、stepCount=3、order 精确顺序、390/320 移动视口覆盖和 noHorizontalOverflow=true。
Risks: 导览只整理现有报告主链路，不新增业务放行规则，不证明报告事实正确或 LLM 事实正确。
Dependencies: Report recommended next step、reportCitationQuality、evidence priority rail。
Status: DONE / SMOKE PASS / SECURITY REGRESSION PASS / FOCUSED EVIDENCE PASS
```

```text
ID: P6P11-CODE-CHUNKS-SNAKE-CASE-EVIDENCE-PATH-20260705
Title: code_chunks snake_case report evidence file path anchor
Priority: P1
Phase: P6 / P11
Track: Code understanding / report evidence retrieval / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: 用户从分析报告或 JSON 复制 `file_path + line_number` 或 `handler_class + handler_method + line_number` 字段追问时，code_chunks 能把它当作报告证据路径、方法和行号锚点，而不是退化为普通关键词检索。
Scope: CodeLocationHintParser、CodeChunkRanker、CodeLocationHintParserTest、CodeChunkServiceTest。
Non-goals: 不改 API/DTO/DB schema、embedding、LLM provider、前端 UI、release evidence schema 或 GitHub App。
Acceptance: `file_path:`、`"file_path": "..."` 与既有 `filePath:` 进入同一 evidence file path hint 归一化链路；`line_number` / `lineNumber` / `line` JSON 字段进入 line hint；`handler_class` / `handler_method` JSON pair 进入 method anchor hints；检索服务会追加 evidence file path 或 method anchor candidates；明确 evidence path hint 比报告文档普通文本命中优先；目标 chunk 在同路径同 line 或同 handler method 证据下排第一；聚焦 Maven 测试通过。
Risks: 只接受明确 `filePath` / `file_path`、`line` / `lineNumber` / `line_number` 和 `handler_class` / `handler_method` 字段，不放宽到泛化 `path:` 或 `start_line`，避免普通文本和范围元数据误触发定位锚点。
Dependencies: 既有报告证据 QA 和 code_chunks exact anchor 逻辑。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-SEMICOLON-CLAIM-SPLIT-20260705
Title: Code QA semicolon claim split
Priority: P1
Phase: P6
Track: Code QA claim citation coverage / multi-fact answer audit / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: 回答把多个代码事实用 `;` 或 `；` 连在一起时，claim audit 必须按事实拆分，不能让未引用的后半句被前一个 `[C1]` 覆盖。
Scope: CodeQaController claim split pattern、CodeQaControllerTest、必要阶段记录。
Non-goals: API/DTO/DB schema、citation parser 新语法、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: `AuthController handles login [C1]; TokenRepository persists token data.` 必须拆为两个 required claims；第一条 CITED，第二条 UNCITED；claim coverage REVIEW；focused controller tests PASS。
Risks: 该切片只处理分号连接事实，不覆盖所有复杂列表、冒号、括号或 markdown table claim 边界。
Dependencies: Existing Code QA claim citation coverage、P6-CODE-QA-CLAIM-SPLIT-FILE-PATH-20260705。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-INLINE-NUMBERED-CLAIM-SPLIT-20260705
Title: Code QA inline numbered claim split
Priority: P1
Phase: P6
Track: Code QA claim citation coverage / multi-fact answer audit / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: LLM 把多个代码事实写在同一行编号列表中时，例如 `1. A [C1] 2. B`，claim audit 必须拆成独立事实，不能让未引用的第二项被第一项 citation 覆盖。
Scope: CodeQaController claim split pattern、CodeQaControllerTest、必要阶段记录。
Non-goals: API/DTO/DB schema、citation parser 新语法、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: `1. AuthController handles login [C1] 2. TokenRepository persists token data` 必须拆为两个 required claims；第一条 CITED，第二条 UNCITED；claim coverage REVIEW；focused controller tests PASS。
Risks: 只在 citation block 后识别同一行编号项，避免误伤版本号、端口号或普通数字列表；更复杂 markdown/表格边界后续另设切片。
Dependencies: Existing Code QA claim citation coverage、P6-CODE-QA-SEMICOLON-CLAIM-SPLIT-20260705。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-INLINE-BULLET-CLAIM-SPLIT-20260705
Title: Code QA inline bullet claim split
Priority: P1
Phase: P6
Track: Code QA claim citation coverage / multi-fact answer audit / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: LLM 把多个代码事实写成同一行 bullet 时，例如 `A [C1] - B`，claim audit 必须拆成独立事实，不能让未引用的 bullet 项被前一条 citation 覆盖。
Scope: CodeQaController claim split pattern、CodeQaControllerTest、必要阶段记录。
Non-goals: API/DTO/DB schema、citation parser 新语法、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: `AuthController handles login [C1] - TokenRepository persists token data` 必须拆为两个 required claims；第一条 CITED，第二条 UNCITED；claim coverage REVIEW；focused controller tests PASS。
Risks: 只在 citation block 后识别 inline bullet，避免泛化拆分普通短横线；更复杂 markdown/表格边界后续另设切片。
Dependencies: Existing Code QA claim citation coverage、P6-CODE-QA-INLINE-NUMBERED-CLAIM-SPLIT-20260705。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P9-APP-SHELL-LONG-TOPBAR-WRAP-20260705
Title: App shell long topbar copy wrap
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / app shell readability / Playwright smoke
Owner: 扎克伯格 / 雷军 / 达里奥 / 特朗普
User value: 页面顶部标题和说明必须在桌面与移动端完整可读，不能因为长文本被省略号隐藏、顶部裁切或产生 320px 横向溢出。
Scope: app shell topbar CSS、app-shell-ui smoke、必要阶段记录。
Non-goals: 不改路由信息架构、后端 API、业务数据、报告页内容、release evidence package 或 GitHub App。
Acceptance: `.sl-topbar-title` / `.sl-topbar-desc` 支持换行；长标题桌面和 320px 移动端不裁切、不横向溢出；`smoke:app-shell-ui`、`validate-frontend-ui`、前端 build PASS。
Risks: 该切片只覆盖 app shell 顶部，不证明所有页面内部卡片、表格、按钮文本都已完成 P9 治理。
Dependencies: `FRONTEND_DESIGN_SYSTEM.md` 可读性门禁、`app-shell-ui-smoke.spec.ts`。
Status: DONE / FRONTEND SMOKE PASS
```

```text
ID: P9-PROJECT-NEXT-ACTION-CHECK-WRAP-20260705
Title: ProjectDetail next action checks wrap
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / ProjectDetail readability / Playwright smoke
Owner: 扎克伯格 / 雷军 / 达里奥 / 特朗普
User value: 项目工作台“下一步证据检查”的 label/value 必须完整可读，不能用省略号隐藏仓库、扫描、code_chunks、报告等成熟度信息。
Scope: ProjectDetail next action check CSS、p9-main-path-recoverable-error-states-batch4a smoke、必要阶段记录。
Non-goals: 不改项目状态计算、后端 API、路由、业务数据、release evidence package 或 GitHub App。
Acceptance: `.sl-project-next-action-check span/strong` 不再强制 `nowrap + ellipsis`；桌面、390px、320px 下 6 个 next-action 分支均不横向溢出，check 文本 computed style 不为 `nowrap/ellipsis`；`smoke:p9-main-path-recoverable-error-states-batch4a`、`validate-frontend-ui`、前端 build PASS。
Risks: 该切片只覆盖 ProjectDetail next action checks，不证明所有内部卡片、表格、按钮文本都已完成 P9 治理。
Dependencies: `FRONTEND_DESIGN_SYSTEM.md` 可读性门禁、`p9-main-path-recoverable-error-states-batch4a.spec.ts`。
Status: DONE / FRONTEND SMOKE PASS
```

```text
ID: P9-PROJECT-COCKPIT-STATUS-DISABLED-READABILITY-20260705
Title: Project cockpit status and disabled next-action readability
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / ProjectDetail readability / App Shell smoke
Owner: 扎克伯格 / 雷军 / 拉里佩奇 / 特朗普
User value: 项目工作台 cockpit 状态行和下一步操作按钮必须在暗色区域保持完整可读，不能用省略号隐藏 knowledge source、仓库/扫描上下文，也不能让 disabled action 变成低对比灰字。
Scope: ProjectDetail cockpit status CSS、next-action disabled button CSS、app-shell-ui smoke、validate-frontend-ui 静态门禁、必要阶段记录。
Non-goals: 不改项目状态计算、后端 API、路由、业务数据、release evidence package、真实 disabled 业务分支全集或 GitHub App。
Acceptance: `.sl-project-cockpit-status span:not(.sl-live-dot)` 不再使用 `nowrap + ellipsis + hidden`；`.sl-project-next-action-actions` disabled button 暗色面可读；`APP_SHELL_UI_SMOKE_OK.layoutGuards` 包含 project cockpit status 和 disabled next-action guards；`validate-frontend-ui`、TypeScript、`app-shell-ui-smoke`、前端 build PASS。
Risks: 该切片只覆盖 ProjectDetail cockpit status 和 next-action default disabled readability，不证明所有按钮、所有真实 disabled 分支、所有缩放/字体环境或全站 P9 已完成。
Dependencies: `P9-APP-SHELL-LONG-TOPBAR-WRAP-20260705`、`P9-PROJECT-NEXT-ACTION-CHECK-WRAP-20260705`、`app-shell-ui-smoke.spec.ts`。
Status: DONE / FRONTEND STATIC + SMOKE PASS
```

```text
ID: P9-CORE-ROUTE-STATUS-LINE-READABILITY-20260705
Title: Core route status line readability guard
Priority: P1
Phase: P9 / P11
Track: Frontend product experience / App Shell route matrix / status line readability
Owner: 扎克伯格 / 雷军 / 拉里佩奇 / 特朗普
User value: 核心页面顶部状态条必须完整展示运行、仓库、扫描、Agent、审计、CI、PR、Issue、AutoRepair 等上下文，不能用 `nowrap + ellipsis` 隐藏关键状态。
Scope: shared status line CSS、app-shell-ui smoke、validate-frontend-ui 静态门禁、必要阶段记录。
Non-goals: 不重做所有页面视觉系统；不证明所有表格、详情卡、drawer 或业务 disabled 状态都完成；不改后端/API/DB/release authority/GitHub App。
Acceptance: Dashboard、Project、Scan、Graph、Execution、Agent、Artifacts、Audit、CI、PR、Issue、AutoRepair status line 共享 late wrap/no-ellipsis guard；`APP_SHELL_UI_SMOKE_OK.guardedStatusLineCount >= 12`；实际 smoke 覆盖 30 个 status line；`validate-frontend-ui` 和 `app-shell-ui-smoke` PASS。
Risks: 该切片只证明 app-shell route matrix 中可见 status line；不证明深层 tab、表格单元格、drawer、真实生产数据或所有缩放/字体组合。
Dependencies: `P9-PROJECT-COCKPIT-STATUS-DISABLED-READABILITY-20260705`、`app-shell-ui-smoke.spec.ts`。
Status: DONE / FRONTEND STATIC + SMOKE PASS
```

```text
ID: P6P9P11-REPORT-CITATION-SOURCE-ORDER-20260705
Title: Report citation source coverage reading order
Priority: P1
Phase: P6 / P9 / P11
Track: Report citation quality / frontend readability / release evidence
Owner: 扎克伯格 / 达里奥 / 特朗普
User value: 用户在报告引用质量面板中按报告阅读顺序看到来源覆盖：扫描范围、模块图、API/数据面、扫描指纹、风险信号，而不是按内部字段名字母序阅读。
Scope: ScanTaskDetail.tsx、report-evidence-drawer-smoke.spec.ts、validate-frontend-ui.mjs、verify-release-evidence.sh、security-regression-check.sh、focused release evidence、必要文档。
Non-goals: 后端 API/DTO/DB/ranker/LLM/GitHub App/webhook/full authority refresh。
Acceptance: validator PASS；web build PASS；report evidence drawer smoke PASS；security regression PASS；focused evidence package verifier PASS；marker 输出 sourceSectionOrder 和 sourceSectionLabelOrder 精确顺序。
Risks: 顺序只证明 UI/marker 合同，不证明报告事实正确、LLM 事实正确或代码无风险。
Dependencies: Report citation source coverage、source labels、detail disclosure、verdict rail。
Status: DONE / SMOKE PASS / SECURITY REGRESSION PASS / FOCUSED EVIDENCE PASS
```

```text
ID: P12PRE-API-NESTED-REQUEST-DTO-20260704
Title: Nested Request DTO field contract gate
Priority: P2
Phase: P12-pre
Track: API contract / documentation drift prevention
Owner: 比尔盖茨 / 拉里佩奇
User value: 防止 Code QA evidenceRef 和 AutoRepair provenance 等关键嵌套请求对象与 API 文档漂移。
Scope: scripts/validate-api-design.mjs、docs/API_DESIGN.md、Makefile、verify-all、必要治理文档。
Non-goals: OpenAPI 生成、Response DTO 检查、多层递归、Map/raw String schema、真实 API smoke、full authority refresh。
Acceptance: node --check；node scripts/validate-api-design.mjs 输出 checked=23 nestedChecked=2 skipped=4；make api-design-check；定向 git diff --check。
Risks: Java parser 仍是轻量静态解析，未来 record/generic/deeper nested DTO 需要升级。
Dependencies: 现有 API_DESIGN route heading 和 Request JSON 结构。
Status: DONE / LOCAL GATE PASS
```

```text
ID: P6P9-REPORT-CITATION-QUALITY-PANEL-20260704
Title: ScanTaskDetail report citation quality panel
Priority: P1
Phase: P6 / P9
Track: Report credibility visibility / frontend product experience
Owner: 雷军 / 扎克伯格 / 达里奥
User value: 用户在报告总览直接看到 reportQuality.reportCitationQuality 的 citation quality、source diversity 和 narrative binding，不需要读取 release evidence JSON。
Scope: ScanTaskDetail.tsx、app.css、report-evidence-drawer-smoke.spec.ts、validate-frontend-ui.mjs、必要阶段日志。
Non-goals: 后端 API/DTO/DB/ranker/LLM/GitHub App/webhook/full authority refresh。
Acceptance: validator PASS；web build PASS；report evidence drawer smoke PASS；marker 输出 reportCitationQuality；no-overclaim 边界可见；targeted diff check PASS。
Risks: source diversity 是报告 section 来源分布，不是外部来源真实性或事实质量。
Dependencies: 既有 PUBLIC_REPO_SMOKE_OK.reportQuality.reportCitationQuality 合同。
Status: DONE / UI SMOKE PASS / NO OVERCLAIM
```

```text
ID: P11-REPORT-CITATION-QUALITY-UI-MARKER-VERIFIER-20260704
Title: Report citation quality UI marker release verifier hardening
Priority: P1
Phase: P11
Track: Release evidence verifier / security regression / repository hygiene
Owner: 达里奥 / 黄仁勋 / 特朗普
User value: 防止 ScanTaskDetail 报告引用质量面板只停留在前端 smoke，确保 release evidence verifier 会拒绝伪造、越权或 overclaim 的 UI marker。
Scope: verify-release-evidence.sh、security-regression-check.sh、worktree-inventory.sh、OPERATIONS_RUNBOOK.md、必要阶段日志。
Non-goals: 刷新 full release authority、改后端 API/DTO/DB、改 UI 面板、改 LLM provider、推进 GitHub App E2E。
Acceptance: bash syntax PASS；strict worktree inventory Other 为空；release-verifier-report-evidence-marker suite PASS；focused release evidence package verifier PASS；targeted diff check PASS。
Risks: 该合同采用 optional-present strict，兼容旧证据包；下一次 full release evidence 应吸收 marker 成为当前包事实。
Dependencies: P6/P9 ScanTaskDetail report citation quality panel 已输出 REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality。
Status: DONE / SECURITY REGRESSION PASS / FOCUSED EVIDENCE PASS / INVENTORY STRICT PASS
```

```text
ID: P6P9P11-REPORT-CITATION-QUALITY-VERDICT-RAIL-20260704
Title: Report citation quality verdict rail and release marker gate
Priority: P1
Phase: P6 / P9 / P11
Track: Report credibility UX / release evidence hardening
Owner: 扎克伯格 / 达里奥 / 特朗普
User value: 用户在 ScanTaskDetail 报告总览直接看到报告是否可推进的裁决依据；发布证据 verifier 会拒绝缺少 verdict rail 的 UI marker。
Scope: ScanTaskDetail.tsx、app.css、report-evidence-drawer-smoke.spec.ts、validate-frontend-ui.mjs、verify-release-evidence.sh、security-regression-check.sh、focused release evidence。
Non-goals: 后端 API/DTO/DB/ranker/LLM/GitHub App/webhook/full authority refresh。
Acceptance: validator PASS；web build PASS；report evidence drawer smoke PASS；security regression PASS；focused evidence package verifier PASS；marker 输出 verdictVisible=true、verdictItemCount>=4、verdictBoundaryVisible=true。
Risks: verdict rail 只证明报告字段和扫描产物绑定，不证明 LLM 事实正确或代码无风险。
Dependencies: P6/P9 report citation quality panel；P11 optional-present strict verifier。
Status: DONE / SMOKE PASS / SECURITY REGRESSION PASS / FOCUSED EVIDENCE PASS
```

```text
ID: P9P11-REPORT-CITATION-DETAIL-DISCLOSURE-20260705
Title: Report citation binding details disclosure
Priority: P1
Phase: P9 / P11
Track: Frontend information density / release evidence
Owner: 扎克伯格 / 达里奥 / 特朗普
User value: 报告总览常显摘要、来源、裁决和边界，低频 section/narrative binding 明细默认收起，用户需要时再展开。
Scope: ScanTaskDetail.tsx、app.css、report-evidence-drawer-smoke.spec.ts、validate-frontend-ui.mjs、verify-release-evidence.sh、security-regression-check.sh、focused release evidence。
Non-goals: 后端 API/DTO/DB/ranker/LLM/GitHub App/webhook/full authority refresh。
Acceptance: validator PASS；web build PASS；report evidence drawer smoke PASS；security regression PASS；focused evidence package verifier PASS；marker 输出 detailToggleVisible=true、detailDefaultCollapsed=true、detailOpens=true。
Risks: 折叠只优化信息密度，不改变引用质量判定或报告事实边界。
Dependencies: Report citation quality panel、source coverage、source labels、verdict rail。
Status: DONE / SMOKE PASS / SECURITY REGRESSION PASS / FOCUSED EVIDENCE PASS
```

```text
ID: P6P9P11-REPORT-CITATION-SOURCE-LABELS-20260704
Title: Report citation source coverage Chinese labels
Priority: P1
Phase: P6 / P9 / P11
Track: Report citation quality / frontend readability / release evidence
Owner: 扎克伯格 / 达里奥 / 特朗普
User value: 用户看到 overview/modules/apiRoutes 等来源时，能同时看到中文语义，不需要理解内部字段名。
Scope: ScanTaskDetail.tsx、report-evidence-drawer-smoke.spec.ts、validate-frontend-ui.mjs、verify-release-evidence.sh、security-regression-check.sh、focused release evidence。
Non-goals: 后端 API/DTO/DB/ranker/LLM/GitHub App/webhook/full authority refresh。
Acceptance: validator PASS；web build PASS；report evidence drawer smoke PASS；security regression PASS；focused evidence package verifier PASS；marker 输出 sourceSections 和 sourceSectionLabels 完整集合。
Risks: 中文标签只是内部 section 的用户可读解释，不证明报告事实正确或外部来源真实性。
Dependencies: Report citation source coverage summary。
Status: DONE / SMOKE PASS / SECURITY REGRESSION PASS / FOCUSED EVIDENCE PASS
```

```text
ID: P6P9P11-REPORT-CITATION-SOURCE-COVERAGE-20260704
Title: Report citation source coverage summary and marker gate
Priority: P1
Phase: P6 / P9 / P11
Track: Report citation quality / frontend product experience / release evidence
Owner: 扎克伯格 / 达里奥 / 特朗普
User value: 用户看到 Source diversity 时能直接知道覆盖了哪些报告来源 section，而不是只看到一个数字。
Scope: ScanTaskDetail.tsx、app.css、report-evidence-drawer-smoke.spec.ts、validate-frontend-ui.mjs、verify-release-evidence.sh、security-regression-check.sh、focused release evidence。
Non-goals: 后端 API/DTO/DB/ranker/LLM/GitHub App/webhook/full authority refresh。
Acceptance: validator PASS；web build PASS；report evidence drawer smoke PASS；security regression PASS；focused evidence package verifier PASS；marker 输出 sourceCoverageVisible=true、sourceSectionCount>=5、sourceSections 完整集合。
Risks: Source coverage 只证明报告字段来自扫描产物的 section 分布，不证明外部来源真实性、LLM 事实正确或代码无风险。
Dependencies: Report citation quality panel 和 verdict rail。
Status: DONE / SMOKE PASS / SECURITY REGRESSION PASS / FOCUSED EVIDENCE PASS
```

```text
ID: P6-CODE-QA-COMBINED-CITATION-LABELS-20260705
Title: Code QA combined citation labels
Priority: P1
Phase: P6
Track: Code QA citation trust / claim coverage / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: LLM 使用 [C1, C2] 或 [C1-C2] 这类常见合并引用时，系统必须把它识别为多个证据标签，而不是错误判成未引用或部分可信。
Scope: CodeQaController citation parser、CodeQaControllerTest、必要阶段记录。
Non-goals: API/DTO/DB schema、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: [C1] 单标签继续有效；[C1, C2] 多标签有效；[C1-C2] 短范围有效；[C99] 未知引用继续 BLOCKED/PARTIAL；code fence/log/sample citation 过滤继续有效；focused controller tests PASS。
Risks: 只解析方括号内明确 C-label，不把普通数字、日志、代码块、示例文本当作真实引用。
Dependencies: Existing Code QA citation coverage and claim coverage DTOs。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-FULLWIDTH-CITATION-BRACKETS-20260705
Title: Code QA full-width citation brackets
Priority: P1
Phase: P6
Track: Code QA citation trust / Chinese LLM output compatibility / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: 中文回答中常见的 `【C1】`、`【C1，C2】` 必须被识别为真实代码证据引用，避免 citation coverage 被错误降级。
Scope: CodeQaController citation parser、citation example filtering、CodeQaControllerTest、必要阶段记录。
Non-goals: API/DTO/DB schema、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: ASCII `[C1]` 继续有效；full-width `【C1】` 有效；`【C1，C2】` 有效；citation example / code fence / log filtering 继续有效；focused controller tests PASS。
Risks: 只扩展 citation block 边界，不把普通中文括号、数字或示例文本当作真实引用。
Dependencies: P6-CODE-QA-COMBINED-CITATION-LABELS-20260705。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-RETRY-COMBINED-CITATION-20260705
Title: Code QA retry combined citation enforcement
Priority: P1
Phase: P6
Track: Code QA citation enforcement / retry answer audit / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: 首轮回答漏引用后，二次修正回答如果使用 `【C1，C2】` 这类合并引用，系统必须判定为 RETRY_VERIFIED，并正确更新 coverage。
Scope: CodeQaControllerTest retry enforcement coverage、必要阶段记录。
Non-goals: API/DTO/DB schema、parser 新语法、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: 首轮无 citation 触发 retry；二轮 `【C1，C2】` 被识别；`citationEnforcementStatus=RETRY_VERIFIED`；两个 answer citations 均 `citedByAnswer=true`；claim coverage READY；focused controller tests PASS。
Risks: 该切片证明 retry path 使用同一 citation parser，不证明真实 LLM provider 一定会稳定按要求修正。
Dependencies: P6-CODE-QA-COMBINED-CITATION-LABELS-20260705、P6-CODE-QA-FULLWIDTH-CITATION-BRACKETS-20260705。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-PAIRED-CITATION-BRACKETS-20260705
Title: Code QA paired citation bracket enforcement
Priority: P1
Phase: P6
Track: Code QA citation trust / malformed citation rejection / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: `[]` 和 `【】` 都可用，但混用括号 `[C1】` / `【C1]` 不应被误判为有效证据引用，避免 malformed citation 污染 grounding 和 coverage。
Scope: CodeQaController citation parser、citation example filtering、CodeQaControllerTest、必要阶段记录。
Non-goals: API/DTO/DB schema、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: `[C1]` 和 `【C1】` 继续有效；`[C1】` / `【C1]` 不进入真实 cited labels；混用括号回答保持 UNVERIFIED/RETRY_FAILED；claim coverage REVIEW；focused controller tests PASS。
Risks: 收紧 parser 会拒绝 malformed citation；这是正确边界，用户/LLM 应输出成对 citation block。
Dependencies: P6-CODE-QA-FULLWIDTH-CITATION-BRACKETS-20260705。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-RETRY-PROMPT-CITATION-FORMAT-20260705
Title: Code QA retry prompt citation format contract
Priority: P1
Phase: P6
Track: Code QA citation enforcement / prompt contract / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: 当首轮回答漏引用时，retry prompt 必须明确要求 LLM 使用成对 citation bracket，减少二次回答继续输出 malformed citation 的概率。
Scope: CodeQaController retry prompt、CodeQaControllerTest prompt capture、必要阶段记录。
Non-goals: API/DTO/DB schema、parser 新语法、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: retry prompt 必须包含成对括号要求、有效示例 `[C1]` / `【C1】`、无效反例 `[C1】` / `【C1]`；focused controller tests PASS。
Risks: Prompt contract 不能保证所有真实 LLM provider 都稳定遵守，但能降低格式漂移并让回归测试锁住本地 contract。
Dependencies: P6-CODE-QA-PAIRED-CITATION-BRACKETS-20260705。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-CLAIM-SPLIT-FILE-PATH-20260705
Title: Code QA claim split preserves file paths
Priority: P1
Phase: P6
Track: Code QA claim citation coverage / file path audit / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: 回答中出现 `src/AuthService.java` 这类文件路径时，claim audit 不能把 `.java` 当句子边界切碎，否则会影响 claim citation coverage 的可信度。
Scope: CodeQaController claim split pattern、CodeQaControllerTest、必要阶段记录。
Non-goals: API/DTO/DB schema、citation parser 新语法、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: 英文句号只在后接空白或行尾时作为句子边界；`src/AuthService.java validates ... [C1].` 保持单个 claim；claim preview 保留完整路径；focused controller tests PASS。
Risks: 该修复保守处理英文句号，不解决所有自然语言缩写边界；后续如发现 `e.g.` / version number 误切再补专项。
Dependencies: Existing Code QA claim citation coverage。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P6-CODE-QA-INVALID-RANGE-STRICTNESS-20260705
Title: Code QA invalid citation range strictness
Priority: P1
Phase: P6
Track: Code QA citation trust / malformed range rejection / backend regression
Owner: 梁文峰 / 达里奥 / 特朗普
User value: `[C2-C1]` 这类反向 range 不能被误判为 `C1` 和 `C2` 两个有效引用，避免 malformed citation 污染 grounding 和 coverage。
Scope: CodeQaController citation block parser、CodeQaControllerTest、必要阶段记录。
Non-goals: API/DTO/DB schema、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: 有效 `[C1-C2]` 继续展开；无效 `[C2-C1]` 不降级为普通 token；两个端点即使都存在也不得标记 cited；focused controller tests PASS。
Risks: 该修复拒绝 malformed range；后续若支持更复杂 range 表达式，必须同时补 negative tests。
Dependencies: P6-CODE-QA-COMBINED-CITATION-LABELS-20260705。
Status: DONE / BACKEND TEST PASS
```

```text
ID: P11-REPORT-EVIDENCE-RANGE-PRIORITY-VERIFIER-20260705
Title: Report evidence QA range priority release verifier gate
Priority: P1
Phase: P11 / P6 / P9
Track: Release verifier / report evidence marker / forged regression
Owner: 特朗普 / 达里奥 / 奥特曼
User value: QA evidence range display priority must be enforced by release evidence, not only by frontend smoke.
Scope: verify-release-evidence.sh report evidence QA marker contract, security-regression forged marker suite, minimal governance records.
Non-goals: Backend API, DB schema, real LLM provider, GitHub App, private repo integration, production deployment, full release evidence package refresh.
Acceptance: verifier requires `qaFromEvidence.evidenceLineRangePriority`; marker must prove structured range `24-42` wins over legacy line `999`; desktop/mobile/narrow coverage and no overflow are required; forged markers for missing/false/wrong fields are rejected; focused security regression and smoke pass.
Risks: The verifier now rejects older report evidence packages that predate `evidenceLineRangePriority`; those packages remain historical evidence, not current authority.
Dependencies: P9/P6 QA evidence range display priority.
Status: DONE / SECURITY REGRESSION + SMOKE PASS
```

```text
ID: P6-CODE-QA-MARKDOWN-TABLE-CLAIM-SPLIT-20260705
Title: Code QA Markdown table claim split
Priority: P1
Phase: P6
Track: Code QA citation trust / claim citation coverage / backend regression
Owner: 梁文峰 / 达里奥 / 奥特曼 / 特朗普
User value: LLM 常把代码问答输出成 Markdown 表格；表格中未引用的代码事实不能被前一个 `[C1]` 覆盖，否则 claim citation coverage 会误报 READY。
Scope: CodeQaController claim audit text normalization、CodeQaControllerTest、必要风险和质量记录。
Non-goals: API/DTO/DB schema、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: Markdown 表格只拆数据行 cell；表头和 separator 行不进入 required claim；普通 pipe 文本不被误判为表格；未引用表格数据行进入 UNCITED/REVIEW；targeted controller test 与 static security regression PASS；安全和 QA 二次复核 PASS。
Risks: 只识别标准 Markdown table block，不解析任意 pipe-delimited 文本；普通 pipe 文本保持原 claim，后续如要支持更多表格变体必须补负例。
Dependencies: Existing Code QA claim citation coverage。
Status: DONE / BACKEND TEST + SECURITY REGRESSION + AGENT REVIEW PASS
```

```text
ID: P6-CODE-QA-BLOCKQUOTE-LOG-CITATION-FILTER-20260705
Title: Code QA blockquote log fake citation filter
Priority: P1
Phase: P6
Track: Code QA citation trust / fake citation rejection / backend regression
Owner: 梁文峰 / 奥特曼 / 拉里佩奇 / 特朗普
User value: LLM 常把日志、异常和 stack trace 包在 Markdown 引用块里；`> ERROR ... [C1]` 这类假引用不能污染 grounding、citation coverage 或 claim coverage。
Scope: CodeQaController non-auditable line filtering、CodeQaControllerTest、必要风险和质量记录。
Non-goals: API/DTO/DB schema、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: blockquoted log/exception/stack fake citation 不计入真实 cited labels；普通 blockquote 正文里的 `[C1]` 仍保持有效；targeted controller test、static security regression 和安全/QA 复核均 PASS。
Risks: 只在 non-auditable line 判定时剥离 Markdown quote prefix，不删除普通引用正文；后续若支持更多 Markdown 容器，必须补正反两类边界测试。
Dependencies: Existing Code QA fake citation filtering。
Status: DONE / BACKEND TEST + SECURITY REGRESSION + AGENT REVIEW PASS
```

```text
ID: P6-CODE-QA-HTML-CODE-CITATION-FILTER-20260705
Title: Code QA HTML code fake citation filter
Priority: P1
Phase: P6
Track: Code QA citation trust / HTML code block fake citation rejection / backend regression
Owner: 梁文峰 / 奥特曼 / 拉里佩奇 / 特朗普
User value: LLM 或报告复制内容可能把日志、代码和错误样例包在 HTML <pre>/<code> 里；这些区域里的 `[C1]` 不能污染 grounding、citation coverage 或 claim coverage。
Scope: CodeQaController auditable answer normalization、CodeQaControllerTest、必要风险和质量记录。
Non-goals: API/DTO/DB schema、retrieval ranking、LLM provider、前端 UI、release evidence schema、GitHub App。
Acceptance: <pre>/<code> 块中的假 `[C1]` 不计入真实 cited labels；HTML inline code 中的普通 token 不破坏外部 prose citation；外部有效 `[C1]` 继续 DIRECT_VERIFIED；HTML 内无效 `[C99]` 不污染 invalid citation claims；targeted controller test、static security regression 和 QA 复核 PASS。
Risks: 当前按成对 HTML <pre>/<code> 标签剔除可审计文本；malformed HTML 仍按 fail-closed/现有 line filter 处理，后续若支持更多 HTML/Markdown 容器必须补正反测试。
Dependencies: Existing Code QA fake citation filtering and blockquote log fake citation filter。
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-BACKEND-FLOW-ROLE-INTENT-RETRIEVAL-20260705
Title: Code chunks retrieval expands backend flow questions across controller/service/data-access roles
Priority: P1
Phase: P6
Track: code_chunks retrieval / cross-file code understanding / Code QA evidence pool
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户问“这个接口如何查数据库/落库/从 controller 到 mapper”时，SourceLens 不能只返回入口 Controller 或关键词文档，必须把 Controller、Service、Mapper/Repository 等跨层证据放进候选池。
Scope: CodeChunkRanker role intent detection and ranking, CodeChunkServiceTest focused backend retrieval regression, necessary risk/quality/activity records.
Non-goals: Static call graph, full dependency tracing, ORM/SQL binding analysis, DTO/API changes, DB schema, frontend UI, release evidence authority refresh, GitHub App.
Acceptance: backend database flow questions produce CONTROLLER + SERVICE + DATA_ACCESS role intents; plain endpoint lookup remains CONTROLLER-only; method-anchor/backend-flow questions can still expand role intents; role-intent ranking demotes docs/build noise below matching source roles; retrieval/search tests prove Controller/Service/Mapper enter results without `content LIKE`; focused backend tests, static security regression, diff check and Data-AI review PASS.
Risks: This is a bounded retrieval heuristic, not semantic call graph proof; role keywords must not over-expand plain endpoint location questions.
Dependencies: Existing P6 role intent candidate merge and codeUnderstandingFixture work.
Status: DONE / BACKEND TEST + SECURITY REGRESSION + DIFF/RG CHECK + DATA-AI REVIEW PASS
```

```text
ID: P6-CODE-QA-HTML-ENTITY-CITATION-BRACKETS-20260705
Title: Code QA recognizes visible HTML entity citation brackets
Priority: P1
Phase: P6
Track: Code QA citation trust / answer citation parser / claim citation audit
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Some rendered answers contain visible citation brackets encoded as HTML entities, such as `&#91;C1&#93;`. SourceLens must treat those visible citations as valid while still ignoring hidden entity citations inside attributes or link destinations.
Scope: CodeQaController auditable answer text, CodeQaControllerTest, focused QA/risk/quality records.
Non-goals: Full HTML entity decoder, HTML sanitizer, DOM parser, front-end rendering change, DB schema, retrieval ranking, release evidence authority refresh, GitHub App.
Acceptance: visible decimal/hex/named bracket entities decode to `[C1]` after non-auditable regions are stripped; visible entity citations produce VERIFIED / DIRECT_VERIFIED / FULL / READY; tag-attribute and Markdown-link-destination entity citations remain UNVERIFIED / RETRY_FAILED / citedByAnswer=false / UNCITED; targeted tests, CodeQaControllerTest, static security regression, diff check and QA review PASS.
Risks: The decoder is intentionally bounded to citation bracket entities only; it must not be described as a general HTML entity decoder.
Dependencies: P6-CODE-QA-HTML-SCRIPT-STYLE-CITATION-NOISE-20260705.
Status: DONE / BACKEND TEST + SECURITY REGRESSION + DIFF/RG CHECK + QA REVIEW PASS
```

```text
ID: P6-CODE-QA-HTML-SCRIPT-STYLE-CITATION-NOISE-20260705
Title: Code QA ignores fake citation labels inside HTML script/style blocks
Priority: P1
Phase: P6
Track: Code QA citation trust / answer citation parser / claim citation audit
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: LLM answers may include rendered snippets with script/style blocks. Citation audit must ignore non-auditable script/style content while preserving visible prose citations outside those blocks.
Scope: CodeQaController auditable answer text, CodeQaControllerTest, focused QA/risk/quality records.
Non-goals: Full HTML sanitizer, DOM parser, JavaScript/CSS parser, front-end rendering change, DB schema, retrieval ranking, release evidence authority refresh, GitHub App.
Acceptance: script/style blocks are stripped before citation audit; script/style-only fake citation remains UNVERIFIED / RETRY_FAILED / citedByAnswer=false / UNCITED; visible citation outside script/style remains VERIFIED / DIRECT_VERIFIED / FULL / READY; targeted tests, CodeQaControllerTest, static security regression, diff check and QA review PASS.
Risks: The filter is bounded to paired `<script>` / `<style>` blocks and is not a JavaScript/CSS/HTML sanitizer; malformed HTML should not be overclaimed as fully parsed.
Dependencies: P6-CODE-QA-HTML-TAG-ATTRIBUTE-CITATION-NOISE-20260705.
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-CODE-QA-HTML-TAG-ATTRIBUTE-CITATION-NOISE-20260705
Title: Code QA ignores fake citation labels inside HTML tag attributes
Priority: P1
Phase: P6
Track: Code QA citation trust / answer citation parser / claim citation audit
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Rendered snippets can include HTML attributes such as `<span data-source="[C1]">`. Citation audit must ignore hidden tag attributes while preserving visible tag text citations.
Scope: CodeQaController auditable answer text, CodeQaControllerTest, focused QA/risk/quality records.
Non-goals: Full HTML sanitizer, HTML DOM parser, front-end rendering change, DB schema, retrieval ranking, release evidence authority refresh, GitHub App.
Acceptance: HTML tags are stripped before citation audit; attribute-only fake citation remains UNVERIFIED / RETRY_FAILED / citedByAnswer=false / UNCITED; visible tag text citation remains VERIFIED / DIRECT_VERIFIED / FULL / READY; targeted tests, CodeQaControllerTest, static security regression, diff check and QA review PASS.
Risks: The filter is bounded to ordinary single-tag syntax and is not a full HTML sanitizer; malformed HTML should not be overclaimed as fully parsed.
Dependencies: P6-CODE-QA-HTML-COMMENT-CITATION-NOISE-20260705.
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-CODE-QA-HTML-COMMENT-CITATION-NOISE-20260705
Title: Code QA ignores fake citation labels inside HTML comments
Priority: P1
Phase: P6
Track: Code QA citation trust / answer citation parser / claim citation audit
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: LLM answers or rendered report snippets may contain hidden HTML comments. Citation audit must ignore `<!-- hidden [C1] -->` so invisible text cannot make an uncited answer look grounded.
Scope: CodeQaController auditable answer text, CodeQaControllerTest, focused QA/risk/quality records.
Non-goals: Full HTML sanitizer, front-end rendering change, DB schema, retrieval ranking, release evidence authority refresh, GitHub App.
Acceptance: HTML comments are stripped before citedLabels and claimCitationCoverage audit; an answer whose only `[C1]` appears in `<!-- ... -->` remains UNVERIFIED / RETRY_FAILED, answerCitations C1 has citedByAnswer=false, and the code fact claim is UNCITED; targeted CodeQaControllerTest, static security regression, diff check and QA review PASS.
Risks: The filter is bounded to complete `<!-- ... -->` comments before citation audit; it is not a general HTML sanitizer and must not be described as one.
Dependencies: P6 Code QA HTML code fake citation filter; P6 Code QA Markdown link citation noise filter.
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-REPORT-EVIDENCE-LINE-START-END-ALIASES-20260705
Title: Report evidence lineStart/lineEnd alias parsing
Priority: P1
Phase: P6
Track: code_chunks retrieval / report citation anchors / line range evidence
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 外部报告、工具输出或前端证据片段常使用 lineStart/lineEnd、line_start/line_end；这些字段必须像 startLine/endLine 一样绑定正确 code chunk，避免同文件多 chunk 时定位退化。
Scope: CodeLocationHintParser line range aliases、CodeLocationHintParserTest、CodeChunkServiceTest、必要风险和质量记录。
Non-goals: API/DTO/DB schema、ranking 权重、前端 UI、release evidence schema、GitHub App。
Acceptance: parseLineHints 识别 lineStart/lineEnd 和 line_start/line_end；stripLocationHintsForTokenization 清理这些字段噪声；evidenceLocationHints 在同一 object 内绑定 filePath + alias range；同文件多 chunk 检索把覆盖 alias range 的目标 chunk 排第一；focused backend tests、static security regression 和 QA 复核 PASS。
Risks: 只新增常见字段别名，不泛化任意 `start/end` 字段，避免把业务字段误当行号；跨 object 配对仍必须 fail-closed。
Dependencies: Existing P6 report evidence startLine/endLine anchor parsing。
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-REPORT-EVIDENCE-SOURCE-FILE-ALIASES-20260705
Title: Report evidence sourceFile/source_file alias parsing
Priority: P1
Phase: P6
Track: code_chunks retrieval / report citation anchors / evidence file path aliases
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 外部报告和第三方工具常把证据文件写成 sourceFile/source_file；这些字段必须像 filePath/file_path 一样进入 code_chunks 锚点检索，避免报告追问只靠自然语言命中。
Scope: CodeLocationHintParser file path aliases、CodeLocationHintParserTest、CodeChunkServiceTest、必要风险和质量记录。
Non-goals: 泛化普通 path 字段、API/DTO/DB schema、ranking 权重、前端 UI、release evidence schema、GitHub App。
Acceptance: evidenceFilePathHints 支持 sourceFile/source_file/sourcefile；evidenceLocationHints 能在同一 object 内绑定 sourceFile/source_file + line/range；普通 path 字段不能作为 evidence anchor；sourceFile + lineNumber 在同文件多 chunk 场景必须把覆盖行号的目标 chunk 排第一；focused backend tests、static security regression 和 QA 复核 PASS。
Risks: 只新增明确证据来源文件别名，不接受泛化 path，避免 API route path、docs path 或业务 path 被误当源码锚点。
Dependencies: Existing P6 report evidence filePath/file_path and line range anchor parsing。
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-REPORT-EVIDENCE-SOURCE-PATH-ALIASES-20260705
Title: Report evidence sourcePath/source_path alias parsing
Priority: P1
Phase: P6
Track: code_chunks retrieval / report citation anchors / evidence source path aliases
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 外部报告和第三方工具常把源码路径写成 sourcePath/source_path；这些字段必须像 sourceFile/source_file 一样进入 code_chunks 锚点检索，避免报告追问只靠自然语言命中。
Scope: CodeLocationHintParser file path aliases、CodeLocationHintParserTest、CodeChunkServiceTest、必要风险和质量记录。
Non-goals: 泛化普通 path 字段、API/DTO/DB schema、ranking 权重、前端 UI、release evidence schema、GitHub App。
Acceptance: evidenceFilePathHints 支持 sourcePath/source_path/sourcepath；evidenceLocationHints 能在同一 object 内绑定 sourcePath/source_path + line/range；普通 path 字段不能作为 evidence anchor；sourcePath + lineNumber 在同文件多 chunk 场景必须把覆盖行号的目标 chunk 排第一；focused backend tests、static security regression 和 QA 复核 PASS。
Risks: 只新增明确源码路径别名，不接受泛化 path；pathSuffixHints 仍可处理普通文本中的源码路径，但不等于 evidence `path` 字段升级。
Dependencies: P6-REPORT-EVIDENCE-SOURCE-FILE-ALIASES-20260705。
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P11-REPORT-EVIDENCE-DEEP-READABILITY-VERIFIER-20260705
Title: Report evidence deep evidence card readability release verifier gate
Priority: P1
Phase: P11 / P9 / P6
Track: Release verifier / report evidence marker / ProjectDetail deep evidence readability
Owner: 特朗普 / 达里奥 / 扎克伯格
User value: Deep evidence readability must be enforced by release evidence, not only by frontend smoke marker output.
Scope: verify-release-evidence.sh report evidence QA marker contract, security-regression forged marker suite, minimal governance records.
Non-goals: Frontend UI redesign, backend API, DB schema, real LLM provider, GitHub App, private repo integration, production deployment, full release evidence package refresh.
Acceptance: verifier requires `qaFromEvidence.deepEvidenceCardReadability`; source receipt, source location confidence and source file match release nested proof must all be true; mobile/narrow/no-overflow and no provider/LLM overclaim are required; forged markers for missing/clipped/range-hidden/overflow/raw fields are rejected; focused security regression and smoke pass.
Risks: Older report evidence packages lacking `deepEvidenceCardReadability` remain historical evidence only and cannot represent current report evidence QA marker authority.
Dependencies: P9 ProjectDetail Deep Evidence Card Readability Gate.
Status: DONE / SECURITY REGRESSION + SMOKE PASS
```

```text
ID: P6-CODE-QA-MIXED-EVIDENCE-COVERAGE-20260705
Title: Code QA mixed primary/context evidence coverage audit
Priority: P1
Phase: P6
Track: Code QA citation trust / cross-file evidence quality / report citation coverage
Owner: 梁文峰 / 拉里佩奇 / 达里奥 / 特朗普
User value: 当回答只引用主证据但检索结果包含 adjacent context 时，SourceLens 必须明确暴露 context 证据未引用 gap，避免用户误以为跨文件/上下文证据已经完整支撑。
Scope: CodeQaCitationCoverage DTO、CodeQaController coverage 计算、CodeQaControllerTest、ProjectDetail 展示、front-end smoke mock、public smoke、release verifier、API_DESIGN、必要风险和质量记录。
Non-goals: DB schema、retrieval ranking、真实 LLM provider、GitHub App、生产部署、完整 release evidence 刷新。
Acceptance: response 暴露 uncited primary/context evidence count 与 file count；单 primary + context 返回 MIXED_PRIMARY_CONTEXT；primary 跨文件 + context 保持 PRIMARY_CROSS_FILE；同一 context 文件部分 cited/uncited 时 uncitedContextEvidenceFileCount=1；前端、smoke、verifier 和 API 文档识别新状态；focused backend test、frontend UI validator、static security regression、diff check 和 QA 复核 PASS。
Risks: 新枚举属于 additive API 变化；旧前端或历史 release evidence 包可能仍只识别 PRIMARY_SINGLE_FILE/PRIMARY_CROSS_FILE，需以当前 verifier 和 UI 类型为准。
Dependencies: Existing Code QA citation coverage and report evidence QA smoke.
Status: DONE / BACKEND TEST + UI STATIC + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P9-SHARED-ANT-ALERT-READABILITY-20260705
Title: Shared Ant Alert readability
Priority: P1
Phase: P9
Track: frontend product experience / shared alert surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: SourceLens 多个核心页面使用 Ant Alert 展示错误、风险、安全边界、补丁证据和恢复动作；Alert message、description 和 action 必须默认可读，不能裁切长错误、路径、证据说明或按钮文案。
Scope: app shell scoped Ant Alert CSS, frontend UI validator, frontend design system and focused governance records.
Non-goals: 页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 完成声明。
Acceptance: `.sl-app-shell .ant-alert` root/content/message/description/action 具备 max-width/min-width/overflow/wrap/no-ellipsis 防护；action row 支持 recovery button 折行；validator 锁住共享规则并拒绝 alert copy/action 回退到 nowrap、ellipsis、hidden 或 no-wrap flex；frontend validator、build、app-shell UI smoke、产品/前端复核和 diff/rg checks PASS。
Risks: 这是 shared alert surface focused change；只证明 app shell 内 Ant Alert 获得基础防裁切能力，不等同于所有页面视觉体系完成。
Dependencies: P9 Shared ActionButton label readability；P9 Shared Ant Tag and Badge readability；P9 Shared StateBlock readability。
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-DRAWER-READABILITY-20260705
Title: Shared Ant Drawer readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared portal drawer surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Drawer 承载审计事件、工具调用、Webhook Delivery、产物详情、报告证据和移动端导航；标题、extra action、footer action 和长上下文不能在窄屏裁切或撑破 viewport。
Scope: shared Ant Drawer CSS under `.ant-drawer`, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: Drawer 打开/关闭逻辑、数据加载、深链匹配、raw 展示、redaction、业务宽度配置、具体详情内容结构、页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、所有业务 Drawer 截图级验收。
Acceptance: Drawer content wrapper 受 viewport 约束；content/header/body/footer/header-title/title/extra 可收缩；title/extra/footer/action 支持换行；validator 锁定正向规则并拒绝 max-width none、nowrap、ellipsis、hidden 或 no-wrap；frontend validator、build、Drawer focused smoke、app-shell smoke 和产品/前端二轮复核 PASS。
Risks: 共享规则可能让抽屉 header/action 在窄屏变高，但可读性和无越界优先；页面级 redaction、深链和内容结构仍由各 focused smoke 负责。
Dependencies: P9 Shared Ant Modal/Confirm readability; P9 Shared Ant Pagination readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + DRAWER SMOKE + APP SHELL SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-PROGRESS-READABILITY-20260705
Title: Shared Ant Progress readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / progress indicator readability / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 扫描、任务、修复、报告质量和健康度进度必须在卡片、表格、详情面板和窄屏中可读，不能因为进度文本或容器宽度裁切关键状态。
Scope: shared Ant Progress CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: progress 百分比计算、状态映射、颜色、动画、showInfo 配置、业务逻辑、页面数据请求、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 完成声明。
Acceptance: Progress root/line/outer/inner 可收缩；progress text 可换行；validator 锁定正向规则并拒绝任意 scoped progress text 回退到 nowrap、ellipsis 或 hidden；frontend validator、build、app-shell smoke 和产品/前端复核 PASS。
Risks: 共享规则可能让带 info 的进度条在极窄容器中更高，但状态文本完整可读优先；内部进度条裁剪和动画不由本轮改动改变。
Dependencies: P9 Shared Ant Card Header readability; P9 Shared Ant Typography code/pre readability; dashboard/app-shell smoke.
Status: DONE / FRONTEND VALIDATOR + BUILD + APP SHELL SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-MESSAGE-NOTIFICATION-READABILITY-20260705
Title: Shared Ant Message and Notification readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / portal feedback readability / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 登录、创建、删除、复制、API 错误和请求 ID 等即时反馈必须在窄屏中可读，不能因为 toast 宽度、图标布局或省略号隐藏关键错误。
Scope: shared Ant Message/Notification CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: message/notification 触发位置、持续时间、业务文案、API 错误格式、redaction 策略、请求逻辑、新增 notification 业务流程、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 完成声明。
Acceptance: Message/Notification portal 受 viewport 约束；notice/content/message/description 可换行；icon 不被挤压；notification action 区可换行；validator 锁定正向规则并拒绝 nowrap、ellipsis、hidden 或 notification action no-wrap；frontend validator、build、app-shell smoke 和产品/前端复核 PASS。
Risks: 共享规则可能让长错误 toast 更高，但错误上下文、请求 ID 和恢复反馈完整可读优先。
Dependencies: P9 Shared Ant Tooltip/Popover/Popconfirm readability; P9 Shared Ant Alert readability; API error display policy.
Status: DONE / FRONTEND VALIDATOR + BUILD + APP SHELL SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-TOOLTIP-POPOVER-READABILITY-20260705
Title: Shared Ant Tooltip, Popover and Popconfirm readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / portal confirmation readability / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 图标说明、删除/取消/禁用确认和 AutoRepair PR 风险摘要必须在窄屏中可读，不能隐藏路径、证据、后果或确认按钮。
Scope: shared Ant Tooltip/Popover/Popconfirm CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: Tooltip/Popover/Popconfirm 触发方式、确认/取消逻辑、placement、业务判断、AutoRepair PR evidence gate、submit-pr 阻断、PATCH_READY smoke 合同、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 完成声明。
Acceptance: Tooltip/Popover portal 受 viewport 约束；Tooltip inner、Popover title/content、Popconfirm message/description 可换行；Popconfirm buttons 和 button labels 可换行；validator 锁定正向规则并拒绝文案 nowrap、ellipsis、hidden，以及 scoped Popconfirm buttons/button label no-wrap、ellipsis 或 hidden；frontend validator、build、app-shell smoke 和产品/前端复核 PASS。
Risks: 共享规则可能让确认弹层更高，但确认风险、路径和按钮完整可读优先；业务级 PR Popconfirm gate 不得被本轮改动改变。
Dependencies: P9 Shared Ant Menu/Dropdown readability; P9 Shared Ant Modal/Confirm readability; PATCH_READY Popconfirm evidence gate.
Status: DONE / FRONTEND VALIDATOR + BUILD + APP SHELL SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-MENU-DROPDOWN-READABILITY-20260705
Title: Shared Ant Menu and Dropdown readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / navigation readability / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 桌面侧栏、移动抽屉导航和用户 Dropdown 是进入核心链路的固定入口；导航标签、分组标题和账号动作不能因为长文本或窄屏被裁切、省略或横向溢出。
Scope: shared Ant Menu/Dropdown CSS for expanded `.sl-sider`, `.sl-mobile-nav` and `.ant-dropdown`, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 路由、权限、认证、用户菜单动作、移动菜单开关逻辑、菜单数据结构、信息架构、sidebar 品牌视觉、Dropdown trigger/placement、后端、安全策略、release evidence schema、GitHub App、全站 UI 完成声明。
Acceptance: 展开侧栏、移动导航抽屉和 Dropdown portal 的 Menu/Dropdown 容器可收缩；item/title-content/group-title 可换行；icon 不被挤压；validator 锁定正向规则并拒绝 nowrap、ellipsis 或 hidden；不强行展开 collapsed sider；frontend validator、build、app-shell smoke 和产品/前端复核 PASS。
Risks: 共享规则可能让长导航标签增加行高，但导航可读性和无越界优先；折叠侧栏只保留 icon 紧凑行为。
Dependencies: P9 Shared Ant Drawer readability; P9 Shared ActionButton label readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + APP SHELL SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-EMPTY-FALLBACK-READABILITY-20260705
Title: Shared Ant Empty fallback readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / internal empty fallback / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 核心空态仍用 StateBlock；当 Ant 内部组件或 Select dropdown portal 使用 Empty fallback 时，空态说明和 footer action 不能低可读、裁切或横向溢出。
Scope: shared Ant Empty fallback CSS for `.sl-app-shell` and `.ant-select-dropdown`, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 新增 raw Empty 使用、替换 StateBlock、表格 emptyText 改造、Select 数据/查询/API、页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 完成声明。
Acceptance: app shell 和 Select dropdown 的 Ant Empty fallback 可收缩；description/footer 可换行；validator 锁定正向规则并拒绝 nowrap、ellipsis、hidden 或 no-wrap；既有核心页面 raw Empty 禁用策略保持；frontend validator、build、app-shell smoke 和产品/前端复核 PASS。
Risks: 该规则只治理兜底 fallback，不允许团队把核心产品空态降级为 raw Ant Empty；页面级空态仍需 StateBlock 和业务恢复动作。
Dependencies: P9 Shared StateBlock readability; P9 Shared Ant Select readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + APP SHELL SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-PAGINATION-READABILITY-20260705
Title: Shared Ant Pagination readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared table pagination surface / anti-overflow gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 表格分页器承载总数、页码、page-size 和 quick jumper；这些控件不能在项目、任务、产物、审计、CI、PR、Issue、AutoRepair 和模型配置页面底部挤压或横向溢出。
Scope: app shell shared Ant Pagination CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 分页数据/API 查询逻辑、表格列宽/scroll.x/行选择/详情入口、页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 重构完成声明。
Acceptance: `.sl-app-shell .ant-pagination` 可收缩并换行；total text、page controls、options、page-size selector 和 quick jumper 不裁切；validator 锁定正向规则并拒绝 nowrap、ellipsis、hidden 或 no-wrap；frontend validator、build、app-shell smoke 和产品/前端二轮复核 PASS。
Risks: 共享 wrap 可能让窄屏表格底部分页器变高，但可读性和无横向溢出优先；复杂业务表格仍需页面级视觉验收。
Dependencies: P9 Shared Ant Typography code/pre readability; P9 Shared Ant Select readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-TYPOGRAPHY-CODE-PRE-READABILITY-20260705
Title: Shared Ant Typography code/pre readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared code and evidence text surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Typography、inline code 和 pre 承载路径、hash、命令、错误片段和证据引用；这些内容不能横向溢出、被裁切或被省略。
Scope: app shell shared Ant Typography/code/pre CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、表格列业务级 ellipsis 策略、全站 UI 重构完成声明。
Acceptance: `.sl-app-shell .ant-typography` 可收缩；shared code/pre 支持长文本换行和 pre 横向滚动兜底；validator 锁定正向规则并拒绝 code/pre 回退到 nowrap、ellipsis 或 hidden；frontend validator、build、app-shell smoke 和产品/前端复核 PASS。
Risks: 该规则是共享文本兜底，不替代逐个报告、日志、代码片段和表格单元格的信息架构验收；表格列业务级 ellipsis 必须由页面级策略继续控制。
Dependencies: P9 Shared Ant Space action-row readability; P9 Shared Ant Form label/help readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-SPACE-ACTION-ROW-READABILITY-20260705
Title: Shared Ant Space action-row readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared action-row surface / tag and evidence group readability / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Space 承载标题组合、状态标签、证据标签、表格行操作和工具栏 action；这些内容不能在窄屏或 dense surface 中被挤压、裁切、省略或隐藏。
Scope: app shell shared Ant Space CSS, frontend UI validator selector-block gate, frontend design system, focused P9 docs and review record.
Non-goals: 改变 Space.Compact 输入组合行为、页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、所有业务 action row 逐个截图级验证。
Acceptance: `.sl-app-shell` 内 Space root/item 可收缩；普通 horizontal Space 允许 wrap；Space item 支持 wrap/no-ellipsis/no-hidden；validator 用 selector-block 判断拒绝普通 Space nowrap 回退并显式跳过真实 compact selector；frontend validator、build、app-shell smoke 和产品/前端二轮复核 PASS。
Risks: 共享规则会让部分 action row 在窄屏变为多行，但保留动作顺序和 Compact 输入组合行为；逐个业务 action row 的视觉密度仍需后续页面级验收。
Dependencies: P9 Shared Ant Card Header readability; P9 Shared Ant Form label/help readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-FORM-LABEL-HELP-READABILITY-20260705
Title: Shared Ant Form label/help readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared form surface / validation and helper text readability / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Form 承载仓库 URL、token 策略、GitHub App 后置说明、CI/PR/Issue/AutoRepair/ModelConfig 等高价值输入；label、校验错误和 extra/help 文案不能被省略、裁切或隐藏。
Scope: app shell shared Ant Form label/explain/error/extra CSS, modal/autorepair input editing behavior correction, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 改变输入框/TextArea/InputNumber/Password 编辑行为、页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、所有业务表单逐个截图级验证。
Acceptance: `.sl-app-shell` 内 Form root/item/row/label/control/explain/extra 可收缩；label/explain/error/extra 支持 auto height 和 wrap/no-ellipsis/no-hidden；Modal 和 AutoRepair 输入控件只保留 max/min width，不强制文本换行；validator 拒绝直接 selector、组合 selector、更具体 selector 和 `!important` 回退到 nowrap、ellipsis 或 hidden；frontend validator、build、app-shell smoke 和产品/前端二轮复核 PASS。
Risks: 该规则保护表单说明文案，不替代每个业务表单的信息架构和截图级验收；输入控件行为边界已修正为不强制改变编辑文本行为。
Dependencies: P9 Shared Ant Select readability; P9 Shared Ant Modal/Confirm readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-SELECT-READABILITY-20260705
Title: Shared Ant Select readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared select surface / portal dropdown readability / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Select 承载项目、仓库、分支、模型、provider、状态筛选和多选标签；这些上下文不能在过滤器、表单、项目选择器或下拉面板中被省略、裁切或隐藏。
Scope: app shell shared Ant Select CSS, Ant Select portal dropdown option CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、所有 Select 下拉交互逐个截图级验证、非 SourceLens 独立 portal 适配声明。
Acceptance: `.sl-app-shell` 内 Select root/selector/selected item/placeholder/multiple overflow 可收缩且可换行；multiple value tag 自适应高度；`.ant-select-dropdown` portal option 可收缩且可换行；validator 锁定正向规则并拒绝直接 selector、组合 selector 和更具体 selector 回退到 nowrap、ellipsis、hidden 或 flex-wrap nowrap；frontend validator、build、app-shell smoke 和产品/前端二轮复核 PASS。
Risks: `.ant-select-dropdown` 是 portal 层共享规则，本轮明确按 SourceLens Ant Select portal 治理；未来若接入非 SourceLens 独立 portal，需要重新做作用域隔离。
Dependencies: P9 Shared Ant Tabs readability; P9 Shared Ant Modal/Confirm readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-TABS-READABILITY-20260705
Title: Shared Ant Tabs readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared tab surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Tabs 承载报告、审计、产物预览、Agent 详情和项目工作区的切换上下文；tab label 不能在窄屏或报告页局部样式中被 nowrap、ellipsis 或 hidden 裁切。
Scope: app shell shared Ant Tabs CSS, report tabs local override, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、所有业务 Tabs 场景逐个视觉完成声明。
Acceptance: `.sl-app-shell` 内 Tabs root/nav/nav-wrap/nav-list/content/pane 可收缩；tab label 支持 wrap/no-ellipsis/no-hidden；`.sl-report-tabs .ant-tabs-nav` 不得用 `overflow:hidden` 覆盖共享可读性；validator 锁定正向规则并拒绝 tab label 和 report tabs nav 回退；frontend validator、build、app-shell smoke 和产品/前端二轮复核 PASS。
Risks: 共享规则降低默认裁切风险，但不替代每个业务 Tabs 的信息架构和截图级视觉验收；nav-wrap 横向滚动是允许的滚动层，不应被 validator 误杀。
Dependencies: P9 Shared Ant Card Header readability; P9 Shared Ant Modal/Confirm readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-TAG-BADGE-READABILITY-20260705
Title: Shared Ant Tag and Badge readability
Priority: P1
Phase: P9
Track: frontend product experience / shared metadata labels / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: SourceLens 大量页面使用 Ant Tag/Badge 展示状态、风险、证据类型、文件路径、scan/task 标识和治理标签；这些标签必须默认可读，不能用 nowrap/ellipsis 隐藏关键上下文。
Scope: app shell scoped Ant Tag/Badge CSS, frontend UI validator, frontend design system and focused governance records.
Non-goals: 页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 完成声明。
Acceptance: `.sl-app-shell .ant-tag` 和 `.sl-app-shell .ant-badge-status-text` 具备 max-width/min-width/height/line-height/wrap/no-ellipsis 防护；`.sl-app-shell .ant-badge` root 可收缩；validator 锁住共享规则并拒绝 tag/badge text 回退到 nowrap 或 ellipsis，且 badge status text standalone override 有独立 reject；frontend validator、build、app-shell UI smoke、产品/前端二轮复核和 diff/rg checks PASS。
Risks: 这是 shared metadata label focused change；只证明 app shell 内 Ant Tag/Badge 获得基础防裁切能力，不等同于所有页面视觉体系完成。
Dependencies: P9 Shared ActionButton label readability；P9 Shared StateBlock readability。
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-STATEBLOCK-READABILITY-20260705
Title: Shared StateBlock title, description and action readability
Priority: P1
Phase: P9
Track: frontend product experience / shared state surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 错误态、空态、加载态和恢复动作经常承载长错误码、URL、路径和按钮文案；共享 StateBlock 必须默认可读，不得裁切或横向撑破页面。
Scope: StateBlock shared CSS, frontend UI validator, frontend design system and focused governance records.
Non-goals: 页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 完成声明。
Acceptance: StateBlock root/copy/title/description/action 区均具备 max-width/min-width/overflow/wrap 防护；description 支持长 API message/URL/path 换行；action row 支持 retry buttons 和长 label 折行；validator 锁住这些规则并拒绝 copy/action nowrap、ellipsis、hidden 和 nowrap flex 回退；frontend validator、build、app-shell UI smoke、产品/前端二轮复核和 diff/rg checks PASS。
Risks: 这是 shared state primitive focused change；只能证明使用 StateBlock 的状态面获得基础防溢出能力，不等同于所有页面视觉体系完成。
Dependencies: P9 Shared ActionButton label readability。
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P6-P9-QA-CONTEXT-GAP-VISIBLE-20260705
Title: Code QA context evidence gap visible in ProjectDetail and release evidence
Priority: P1
Phase: P6 / P9 / P11
Track: Code QA citation trust / ProjectDetail report evidence UX / release evidence verifier
Owner: 扎克伯格 / 梁文峰 / 达里奥 / 拉里佩奇 / 特朗普
User value: 当 PRIMARY 主证据已经引用但 adjacent context 仍有未引用证据时，用户必须在 QA 证据 UI 中直接看到“上下文引用待补齐”和具体缺口，不能被“主证据可采信”误导。
Scope: ProjectDetail cross-file citation summary、report evidence drawer smoke、public repo UI smoke marker contract、frontend UI validator、release verifier、focused quality/risk/handoff records.
Non-goals: 后端 coverage 计算、DB schema、retrieval ranking、真实 LLM provider、GitHub App、完整 release evidence authority refresh。
Acceptance: ProjectDetail 的 verified mixed primary/context QA 显示 warning tone、`上下文引用待补齐`、`上下文引用缺口`；file-anchor drift/context-only 场景继续 BLOCKED 且无修复候选；smoke marker 输出 `maxUncitedPrimaryEvidenceCount=0`、`maxUncitedPrimaryEvidenceFileCount=0`、`minUncitedContextEvidenceCount>0`、`minUncitedContextEvidenceFileCount>0`、`contextGapVisible=true`；release verifier 强校验这些字段；frontend validator、build、report evidence drawer smoke、static security regression 和 diff check PASS。
Risks: 本轮已补跑真实公开仓库 UI smoke；该证据只证明当前 focused context-gap gate，不等同于 full release authority refresh。
Dependencies: P6-CODE-QA-MIXED-EVIDENCE-COVERAGE-20260705。
Status: DONE / FOCUSED UI SMOKE + PUBLIC REPO LIVE UI SMOKE + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-CODE-QA-MARKDOWN-LINK-CITATION-NOISE-20260705
Title: Code QA ignores fake citation labels inside Markdown link destinations
Priority: P1
Phase: P6
Track: Code QA citation trust / answer citation parser / claim citation audit
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: LLM answers often include Markdown links. Citation audit must keep visible `[C1]` labels while ignoring `[C99]` noise inside link URLs or reference-definition URLs, otherwise valid answers can be falsely blocked.
Scope: CodeQaController auditable answer text, Markdown link scanner, Markdown reference-definition filtering, CodeQaControllerTest.
Non-goals: Full Markdown parser, HTML sanitizer expansion, citation syntax expansion, front-end UI, DB schema, release evidence authority refresh.
Acceptance: Visible link label `[C1]` stays valid; URL/destination/reference-definition `[C99]` does not enter `invalidCitationClaimCount`; nested visible label and URL parentheses are covered; compact `[ref]:url` definitions are ignored; CodeQaControllerTest, static security regression, diff check and QA复核 PASS.
Risks: Scanner is intentionally bounded for single-line Markdown links/reference definitions; malformed multi-line Markdown is fail-closed as normal text and must not be claimed as fully parsed Markdown.
Dependencies: P6 Code QA HTML code fake citation filter.
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-P9-REPORT-EVIDENCE-SOURCE-LOCATION-LLM-FACT-BOUNDARY-20260705
Title: Report evidence source location confidence must not imply LLM factual correctness
Priority: P1
Phase: P6 / P9 / P11
Track: QA citation trust / ProjectDetail evidence UX / release evidence verifier
Owner: 扎克伯格 / 拉里佩奇 / 达里奥 / 特朗普
User value: 用户看到“来源定位可信”时，必须同时看到该结论只证明来源锚点绑定，不证明 LLM 事实语义正确，避免把定位证据误读为 AI 事实背书。
Scope: ProjectDetail 来源定位可信度提示、report-evidence-drawer smoke marker、release evidence verifier、security regression forged marker、必要风险/质量/交接记录。
Non-goals: 后端 citation coverage 计算、retrieval ranking、DB schema、真实 LLM provider、GitHub App、完整 release authority refresh。
Acceptance: 来源定位可信度组件显示“定位不证明事实正确”；smoke marker 输出 `qaFromEvidence.deepEvidenceCardReadability.sourceLocationConfidence.llmFactBoundaryVisible=true`；release verifier 强制该字段；public repo sourceLocationReadability 不误加该字段；security regression 接受合法 marker 并拒绝 missing/hidden forged marker；frontend validator、syntax、focused security suite、diff check 和 QA 复核 PASS。
Risks: 该字段证明 UI 边界提示和 release marker 约束，不证明 LLM 回答事实正确；事实正确性仍依赖 citation coverage、claim audit 和人工/后续自动复核。
Dependencies: P6/P9 context gap visibility gate；P11 deep evidence card readability release gate。
Status: DONE / UI STATIC + RELEASE VERIFIER + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-REPORT-EVIDENCE-SOURCE-URL-ALIASES-20260705
Title: Report evidence sourceUrl/source_url alias parsing
Priority: P1
Phase: P6
Track: code_chunks retrieval / report citation anchors / hosted source URL evidence aliases
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 外部报告和工具输出常把源码证据写成 sourceUrl/source_url；SourceLens 必须把这些明确源码来源字段当作 evidence anchor，同时继续拒绝普通 url/path/location 字段，避免同名文件或普通链接误导 code_chunks 检索。
Scope: CodeLocationHintParser sourceUrl/source_url/sourceurl 白名单、CodeLocationHintParserTest、CodeChunkServiceTest、必要风险和质量记录。
Non-goals: 泛化普通 url/path/location 字段、任意分支名 hosted URL 解析、API/DTO/DB schema、ranking 权重、前端 UI、release evidence schema、GitHub App。
Acceptance: evidenceFilePathHints 支持 sourceUrl/source_url/sourceurl；structured JSON、compact quoted JSON 和逐行 field 共用该白名单；普通 url/path 不作为 evidence anchor；hosted sourceUrl + lineNumber 在同名 ProjectDetail.tsx decoy 场景必须把目标文件排第一；focused backend tests、static security regression、diff check 和 QA 复核 PASS。
Risks: 当前 hosted URL branch stripping 仍按既有 common branch set 处理 main/master/develop/dev/trunk；任意复杂分支名是后续 P6 parser 扩展，不在本轮声明。
Dependencies: P6 Hosted source URL evidence path normalization；P6 sourcePath/source_path alias parsing。
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-HOSTED-SOURCE-URL-NESTED-BRANCH-NORMALIZATION-20260705
Title: Hosted source URL nested branch normalization
Priority: P1
Phase: P6
Track: code_chunks retrieval / hosted source URL evidence / report citation anchors
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户复制 GitHub/GitLab/raw URL 时，分支名经常是 feature/code-review、release/2026/q3 这类多段路径；SourceLens 不能只支持 main/master，否则真实报告 evidence URL 会退化为同名文件 basename fallback。
Scope: CodeLocationHintParser hosted source URL branch stripping、CodeLocationHintParserTest、CodeChunkServiceTest、必要风险和质量记录。
Non-goals: 普通 url/path/location evidence anchor 扩容、unknown host hosted rules、完整 Git provider URL parser、API/DTO/DB schema、前端 UI、release evidence schema、GitHub App。
Acceptance: GitHub blob nested branch、GitLab blob nested branch、raw.githubusercontent nested branch 均归一化为仓库内相对路径；unknown host 仍不套用 hosted branch rules；相对 `modules/auth/blob/main/...` 仍不剥离；sourceUrl nested branch + lineNumber 在同名 ProjectDetail.tsx decoy 场景目标文件排第一；source-root heuristic 必须 strong project root 优先，避免 `feature/src/preview` 抢占 `web-console/backend-spring` 目标根；focused backend tests、static security regression、diff check 和 QA 复核 PASS。
Risks: nested branch 归一化通过 trusted hosted URL + strong-root-first source root heuristic 完成；分支名包含 `src/docs/test` 等 generic root 且后续路径包含 `web-console/backend-spring` 时已有回归覆盖；剩余风险是分支名本身包含 `web-console/backend-spring` 等 strong root 且真实文件只从 `src/docs/test` 等 generic root 开始时仍有歧义，需后续结合仓库实际 file index 或 provider metadata 消除。
Dependencies: P6-REPORT-EVIDENCE-SOURCE-URL-ALIASES-20260705。
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-HOSTED-SOURCE-URL-APP-ROOT-NORMALIZATION-20260705
Title: Hosted source URL app root normalization
Priority: P1
Phase: P6
Track: code_chunks retrieval / hosted source URL evidence / report citation anchors
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 公开仓库常见 `app/src`、`apps/...`、`client/...`、`packages/...` 结构；当 GitHub/GitLab URL 的复杂分支名包含 `src` 片段时，SourceLens 不应把真实仓库根目录截掉，导致报告证据定位退化为过宽 suffix。
Scope: CodeLocationHintParser hosted source root heuristic、CodeLocationHintParserTest、必要风险/质量/交接记录。
Non-goals: 完整 Git provider URL parser、仓库 file index disambiguation、普通 url/path/location evidence anchor 扩容、API/DTO/DB schema、前端 UI、release evidence schema、GitHub App。
Acceptance: `https://github.com/.../blob/feature/src-preview/app/src/pages/Login.tsx#L44` 必须归一化为 `app/src/pages/Login.tsx` 而不是 `src/pages/Login.tsx`；`feature/app/src/...` 必须保守归一化为 `src/...`，避免把分支片段误当应用根；多段分支后的 `apps/client/src/...` 必须保留外层 `apps/client/...`；单段分支后的 `feature/apps/client/src/...` 作为不可消歧边界保守降级为 `client/src/...` 并由测试锁住；既有 nested branch / sourceUrl alias parser tests 继续通过；static security regression、diff check 和 QA 复核 PASS。
Risks: hosted source root heuristic 仍无法完全消除 branch segment 与 source root segment 同名的歧义；本轮将 `app/apps/client/packages` 作为受控应用容器 root 处理，并明确单段 branch ambiguity 的保守降级边界；后续完全消歧需要结合仓库 file index 或 provider metadata。
Dependencies: P6-HOSTED-SOURCE-URL-NESTED-BRANCH-NORMALIZATION-20260705。
Status: DONE / BACKEND TEST + SECURITY REGRESSION + QA REVIEW PASS
```

```text
ID: P6-P11-HOSTED-SOURCE-URL-APP-ROOT-CANDIDATE-DISAMBIGUATION-20260705
Title: Hosted source URL app root candidate disambiguation regression gate
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / hosted source URL evidence / regression gate
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 当 parser 层必须对 `feature/apps/client/src/...` 做保守降级时，code_chunks 候选集排序仍应利用 raw hosted URL / path suffix 信号，把真实 `apps/client/src/...` 排在 `client/src/...` decoy 前面。
Scope: CodeChunkServiceTest focused regression, necessary quality/progress/risk/handoff/activity records.
Non-goals: 生产代码改动、完整 Git provider URL parser、仓库 file index/provider metadata、API/DTO/DB schema、前端 UI、release evidence schema、GitHub App。
Acceptance: `sourceUrl=https://github.com/.../blob/feature/apps/client/src/pages/Login.tsx#L44` 且候选集中同时存在 `client/src/pages/Login.tsx` decoy 和 `apps/client/src/pages/Login.tsx` target 时，`CodeChunkService.listRetrievalCandidates(...)` 必须把 target 排第一；focused backend test、static security regression、diff check 和 QA 复核 PASS。
Risks: 该测试证明当前候选集内排序可以消除一个重要 decoy，不证明所有 branch/root 歧义都已解决；没有进入候选池的真实文件仍需要后续 file index/provider metadata 或更强 SQL candidate expansion。
Dependencies: P6-HOSTED-SOURCE-URL-APP-ROOT-NORMALIZATION-20260705。
Status: DONE / BACKEND TEST + QA REVIEW PASS
```

```text
ID: P9-SHARED-ANT-DESCRIPTIONS-READABILITY-20260705
Title: Shared Ant Design Descriptions readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared metadata-detail surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Descriptions 承载项目、任务、产物、审计、模型配置和执行详情中的 ID、路径、hash、URL、错误和元数据；这些内容不能被 nowrap、ellipsis 或 hidden 裁切。
Scope: app shell shared Ant Descriptions CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 重构完成声明。
Acceptance: `.sl-app-shell .ant-descriptions*` root 可收缩且不裁切；item/label/content 支持 anywhere wrap、normal white-space、clip text-overflow 和 top align；validator 锁定正向规则并拒绝单 selector/组合 selector 回退到 nowrap、ellipsis 或 hidden；frontend validator、build、app-shell smoke 和产品/前端二轮复核 PASS。
Risks: 该规则是共享兜底，不替代每个业务页面的信息架构重排；复杂表格或极密集 Descriptions 场景仍需页面级审查。
Dependencies: P9 Shared Ant Tag/Badge readability; P9 Shared Ant Alert readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-LIST-READABILITY-20260705
Title: Shared Ant List readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared list surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Ant List 承载风险、技术债、建议、证据摘要、路径、URL 和行级 action；这些内容不能在窄屏或 dense surface 中被 nowrap、ellipsis、hidden 或横向挤压隐藏。
Scope: app shell shared Ant List CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 重构完成声明。
Acceptance: `.sl-app-shell .ant-list*` root/item/meta/meta-content 可收缩且不裁切；title/description 支持 anywhere wrap、normal white-space 和 clip text-overflow；action/action item 支持 flex wrap、normal white-space、clip text-overflow 和 visible overflow；validator 锁定正向规则并拒绝 metadata/action/action item 回退到 nowrap、ellipsis、hidden 或 no-wrap flex；frontend validator、build、app-shell smoke 和产品/前端二轮复核 PASS。
Risks: 该规则是共享兜底，不替代每个业务 List 的信息架构整理；`ant-list-item-action` 的 flex/gap 可能轻微改变 dense list 默认间距，但可读性收益高于该局部视觉差异。
Dependencies: P9 Shared Ant Descriptions readability; P9 Shared Ant Alert readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-MODAL-CONFIRM-READABILITY-20260705
Title: Shared Ant Modal and Confirm readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / portal modal surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Modal 和 Confirm 承载新建项目、审查、配置、Issue 拆解、AutoRepair 候选、原始产物下载确认等高价值动作；标题、长错误、路径、hash、URL、表单错误和按钮文案不能在窄屏被裁切或撑破 viewport。
Scope: shared Ant Modal/Confirm CSS under `.ant-modal-root`, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、所有 Modal 业务流程或全站 UI 重构完成声明。
Acceptance: Modal/Confirm portal roots stay within `calc(100vw - 24px)`; containers remain shrinkable; title/content/form label/form explain/input/select/textarea and footer/confirm buttons wrap long text; validator locks positive rules and rejects max-width none, nowrap, ellipsis, hidden and no-wrap actions; frontend validator、build、app-shell smoke 和产品/前端二轮复核 PASS。
Risks: 该规则是共享 portal 弹层兜底，不替代每个业务 Modal 的字段布局审查；局部 scoped modal 可以继续通过更具体 selector 保留业务差异。
Dependencies: P9 Shared Ant List readability; P9 Shared Ant Alert readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```

```text
ID: P9-SHARED-ANT-CARD-HEADER-READABILITY-20260705
Title: Shared Ant Card Header readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared card header surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Card header 承载页面模块标题、状态标签、scan/task/repository 上下文和 extra action；这些内容不能在窄屏或 dense card 中被 nowrap、ellipsis、hidden 或 action 挤压隐藏。
Scope: app shell shared Ant Card header CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 页面业务逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、所有 Card 业务布局或全站 UI 重构完成声明。
Acceptance: `.sl-app-shell` 内 Card root/head/head-wrapper/title/extra/body 可收缩；title 支持 wrap/no-ellipsis/no-hidden；extra 支持 flex wrap；title/extra Space 和 Space item 可收缩可换行；validator 锁定正向规则并拒绝 title/extra 回退到 nowrap、ellipsis、hidden 或 Space no-wrap；frontend validator、build、app-shell smoke 和产品/前端复核 PASS。
Risks: 共享规则可能让密集 card header 变高，但不改变 DOM 顺序和按钮顺序；逐个业务 Card 的视觉细节仍需后续页面级验收。
Dependencies: P9 Shared Ant Modal/Confirm readability; P9 Shared Ant List readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + UI SMOKE + PRODUCT-FE REVIEW PASS
```
```text
ID: P9-SHARED-ANT-TIMELINE-READABILITY-20260705
Title: Shared Ant Timeline readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared timeline surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 执行任务、Agent 步骤、AutoRepair 尝试和扫描治理链路依赖 Timeline 承载状态、错误、证据和下一步；长步骤标题、错误、路径、URL 和证据说明不能在窄屏或密集卡片中被裁切。
Scope: app shell shared Ant Timeline CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: TaskTimeline raw output safety notice、步骤数据、状态映射、图标、顺序、AutoRepair attempt 逻辑、治理时间线聚合、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 重构完成声明。
Acceptance: `.sl-app-shell .ant-timeline` root/item 可收缩；content/label 支持 anywhere wrap、normal white-space、clip text-overflow 和 visible overflow；marker/tail 不被长内容挤压；validator 锁定正向规则并拒绝任意 scoped Timeline content/label 回退到 nowrap、ellipsis 或 hidden；frontend validator、build、app-shell smoke 和 QA/Product review PASS。
Risks: 该规则是共享兜底，不替代每个业务 timeline 的信息架构重排；本轮不改变 raw output safety 和审计边界。
Dependencies: P9 Shared Ant Progress readability; P9 TaskTimeline step output raw payload safety.
Status: DONE / FRONTEND VALIDATOR + BUILD + APP SHELL SMOKE + QA-PRODUCT REVIEW PASS
```

```text
ID: P9-SHARED-ANT-TYPOGRAPHY-READABLE-TEXT-20260705
Title: Shared Ant Typography readable text
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared typography surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 标题、状态、说明、证据摘要、任务描述和治理说明必须完整可读；普通 Typography 不能在卡片、详情和窄屏中被默认单行、省略号或 hidden 裁切。
Scope: app shell shared non-ellipsis Ant Typography CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 改变显式 `.ant-typography-ellipsis` 业务策略、表格列省略策略、模型 URL/审计/产物局部单元格策略、Typography DOM、页面文案、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 重构完成声明。
Acceptance: `.sl-app-shell .ant-typography` 可收缩；非 `.ant-typography-ellipsis` 普通 Typography 支持 anywhere wrap、normal white-space、clip text-overflow 和 visible overflow；inline code/pre 既有规则保留；validator 锁定正向规则并拒绝非 ellipsis Typography 回退到 nowrap、ellipsis 或 hidden；frontend validator、build、app-shell smoke 和 QA/Product review PASS。
Risks: 该规则只做普通 Typography 共享兜底；业务显式 ellipsis 继续由页面/表格局部策略控制。
Dependencies: P9 Shared Ant Typography code/pre readability; P9 Shared Ant Input readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + APP SHELL SMOKE + QA-PRODUCT REVIEW PASS
```

```text
ID: P9-SHARED-ANT-INPUT-READABILITY-20260705
Title: Shared Ant Input readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared input surface / anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 仓库 URL、分支、路径、token、搜索词、过滤条件和数值输入是 SourceLens 主链路入口；Input 系列控件不能在窄屏、弹窗、工具栏或密集表单中撑破布局、裁切 prefix/suffix/addon 或挤压搜索动作。
Scope: app shell shared Ant Input/InputNumber/TextArea/Search containment CSS, frontend UI validator, frontend design system, focused P9 docs and review record.
Non-goals: 改变真实 input、password、number、textarea 的编辑文本行为、输入值、placeholder、表单校验、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 重构完成声明。
Acceptance: `.sl-app-shell` 内 Input/TextArea/Input.Search/InputNumber/affix/group/number wrappers 可收缩；affix/search/number wrapper 不裁切；prefix/suffix/addon 可收缩可换行且不挤压编辑控件；search action button 长标签可读；validator 锁定正向规则并拒绝容器关闭 containment、容器/affix/addon hidden 裁切、addon 文案 nowrap/ellipsis 回退；frontend validator、build、app-shell smoke 和 QA/Product review PASS。
Risks: 该规则只做共享容器兜底，不替代每个业务表单字段布局审查；必须保持输入控件编辑行为不变。
Dependencies: P9 Shared Ant Form label/help readability; P9 Shared Ant Timeline readability.
Status: DONE / FRONTEND VALIDATOR + BUILD + APP SHELL SMOKE + QA-PRODUCT REVIEW PASS
```

```text
ID: P9-SHARED-ANT-TABLE-READABILITY-20260705
Title: Shared Ant Table readability / ellipsis boundary
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared table surface / scroller containment / ellipsis boundary
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: Table 是项目、任务、审计、产物、CI、PR、Issue 和模型配置的最高频信息载体；长仓库名、任务状态、错误说明和证据摘要必须在非 ellipsis 单元格中可读，同时路径、ID、URL、密钥等显式 ellipsis 列不能被共享规则破坏。
Scope: app shell shared Ant Table containment CSS, non-ellipsis cell readability, ellipsis boundary guard, frontend UI validator, focused P9 docs and review record.
Non-goals: 改变 Table columns、dataSource、rowKey、pagination、row selection、onRow、emptyText、scroll.x、业务 ellipsis 列、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 重构完成声明。
Acceptance: Table wrapper/table/container/content/body/spin containers 可收缩；content/body 负责 horizontal scroll；非 `.ant-table-cell-ellipsis` cell 支持 anywhere/break-word wrap、normal white-space、clip text-overflow；共享规则不得强制 `.ant-table-cell-ellipsis` 换行或禁用省略策略；app-shell smoke 必须输出 `shared-table-non-ellipsis-cell-wraps-without-clipping` 与 `shared-table-ellipsis-cell-preserves-ellipsis`；frontend validator、build、app-shell smoke 和 QA/Product review PASS。
Risks: 共享规则只做 Table 容器与非 ellipsis 单元格兜底；复杂列宽、固定列和页面级信息架构仍需后续逐页验收；已补 app-shell browser smoke 覆盖非 ellipsis cell wrap 与 ModelConfig ellipsis boundary。
Dependencies: P9 Shared Ant Typography readable text; P9 page-level table scroller containment gates.
Status: DONE / FRONTEND VALIDATOR + BUILD + APP SHELL SMOKE + QA-PRODUCT REVIEW PASS
```

```text
ID: P9-SHARED-ANT-RADIO-READABILITY-20260705
Title: Shared Ant Radio readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared radio surface / action-row anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: DependencyGraph 视图切换和后续模式筛选不能因为 Radio.Button 长标签、窄屏或 action row 挤压而隐藏关键选项。
Scope: app shell shared Ant Radio CSS, frontend UI validator, DependencyGraph batch4B browser smoke, focused P9 docs and review record.
Non-goals: DependencyGraph 视图切换逻辑、Mermaid 导出、图谱数据、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 重构完成声明。
Acceptance: Radio group/wrapper/button wrapper 可收缩；group 支持 wrap；Radio wrapper、button wrapper 和 label span 支持 anywhere/break-word wrap、normal white-space、clip text-overflow 和 visible overflow；validator 拒绝 shared Radio 回退到 nowrap、ellipsis、hidden 或 no-wrap；batch4B smoke 在 DependencyGraph 恢复成功后注入长 Radio.Button 标签并证明 1440/320 双视口不裁切、不横向溢出；frontend validator、build 和 batch4B smoke PASS。
Risks: 该规则是共享 Radio 兜底，不替代每个业务筛选器的信息架构重排；Radio.Button 长标签可能增加 action row 高度，但可读性优先。
Dependencies: P9 Shared Ant Table readability / ellipsis boundary; P9 DependencyGraph recoverable error state smoke.
Status: DONE / FRONTEND VALIDATOR + BUILD + DEPENDENCYGRAPH UI SMOKE + QA-PRODUCT REVIEW PASS
```

```text
ID: P9-SHARED-ANT-COLLAPSE-READABILITY-20260705
Title: Shared Ant Collapse readability
Priority: P1
Phase: P9 / P11
Track: frontend product experience / shared collapse surface / expandable evidence anti-clipping gate
Owner: 雷军 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: AutoRepair 日志、报告详情、审计详情和治理详情不能因为 Collapse header/content 长文本、窄屏或 action row 挤压而隐藏关键证据。
Scope: app shell shared Ant Collapse CSS, frontend UI validator, PATCH_READY AutoRepair browser smoke, focused P9 docs and review record.
Non-goals: AutoRepair 日志内容、LogViewer 脱敏策略、DiffViewer 脱敏策略、PR 创建门禁、执行任务 attempt 逻辑、API/DTO、DB schema、后端、安全策略、release evidence schema、GitHub App、全站 UI 重构完成声明。
Acceptance: Collapse root/item/header/header text/extra/content/content box 可收缩；header 和 content 支持 anywhere/break-word wrap、normal white-space、clip text-overflow 和 visible overflow；expand icon 稳定不被挤压；validator 拒绝 shared Collapse 回退到 nowrap、ellipsis、hidden 或 no-wrap；PATCH_READY smoke 打开 AutoRepair 日志 Collapse，注入长 header token 并证明 1440/390/320 三视口不裁切、不横向溢出；frontend validator、build 和 patch-ready smoke PASS。
Risks: 该规则是共享 Collapse 兜底，不替代每个业务折叠区的信息架构重排；极长标题可能增加 header 高度，但可读性优先。
Dependencies: P9 Shared Ant Radio readability; PATCH_READY AutoRepair browser smoke.
Status: DONE / FRONTEND VALIDATOR + BUILD + PATCH_READY UI SMOKE + QA-PRODUCT REVIEW PASS
```

```text
ID: P6-CODEQA-COMMON-URI-CITATION-NOISE-20260705
Title: Code QA common URI citation noise filter
Priority: P1
Phase: P6 / P11
Track: Code QA citation trust / fake citation rejection / backend regression
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户复制 LLM 回答、报告链接、本地文件链接或 IDE deep link 时，URI 内的 [C1] 不能被误判为真实源码证据引用，避免未引用回答被伪装成 grounded。
Scope: CodeQaController auditable answer text URI stripping; CodeQaControllerTest fake-only and valid-prose-plus-URI-noise regression coverage.
Non-goals: 完整 URL/URI parser、citation 语法扩展、API/DTO、DB schema、检索排序、LLM provider、前端 UI、release evidence schema、GitHub App、full release authority refresh。
Acceptance: ftp/sftp/ssh/git/file/mailto/data/blob/javascript/vscode/idea URI 中的 citation-like token 被过滤；正文 src/AuthService.java [C1] 保持可审计；fake-only 和 prose-valid-plus-noise 两类场景均由 CodeQaControllerTest 锁定；QA/Data-AI review PASS。
Risks: 这是 bounded common URI noise filter；后续如果支持更多 scheme，需要追加测试而不是扩大成不受控 parser。
Dependencies: P6 Code QA bare URL citation noise filter; RISK-AI-004 citation label format drift controls.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODEQA-FALLBACK-PRIMARY-CITATION-20260706
Title: Code QA fallback primary evidence citation
Priority: P1
Phase: P6 / P11
Track: QA citation trust / fallback answer grounding / evidence role boundary
Owner: 拉里佩奇 / 梁文峰 / 特朗普
User value: Code QA 在未配置 LLM 或 LLM 调用失败时，fallback answer 必须优先引用 PRIMARY evidence，而不是盲目引用 retrievedChunks 第一条，避免相邻上下文被误当主证据。
Scope: CodeQaController fallback citation evidence selection, fallback enforcement note copy, CodeQaControllerTest no-LLM and LLM-error adjacent-first coverage.
Non-goals: 不改变 retrieval ranking、CodeChunkService context expansion、DTO schema、DB schema、LLM retry strategy、前端 UI、release evidence schema 或 GitHub App。
Acceptance: fallbackCitedAnswer/fallbackCitedLabels 共用 PRIMARY-first evidence selector；没有 PRIMARY 时才回退第一条可引用证据；未配置 LLM adjacent-first 场景引用 C2 PRIMARY 而非 C1 context；LLM error adjacent-first 场景同样引用 C2 PRIMARY；focused CodeQaControllerTest PASS；P6 related backend suite PASS；QA/Data-AI review PASS，建议已处理。
Risks: 如果 topChunks 本身被错误标记，fallback 会跟随 PRIMARY 标记；本轮只收口 fallback 引用选择，不证明 retrieval PRIMARY 标记在所有未来场景都正确。
Dependencies: P6-CODECHUNKS-SPRING-ROUTE-ARRAY-EXPRESSIONS-20260706, P6-CODECHUNKS-PREVIOUS-CHUNK-CONTEXT-CANDIDATES-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS-AFTER-FOLLOWUP
```

```text
ID: P6-CODECHUNKS-SEARCH-VISIBLE-CONTEXT-BOUNDARY-20260706
Title: code_chunks search visible result context boundary
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / search metadata correctness / candidate-pool noise control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: endpoint route 搜索可以继续使用 previous context 提升 method chunk 排序，但前端 `items` 不应展示 previous-context-only chunks，避免 search items 与 count 语义不一致。
Scope: `CodeChunkService.searchChunks(...)` primary-visible filtering, previous context scoring preservation, CodeChunkServiceTest visible result boundary updates.
Non-goals: 不改变 QA retrieval context candidate 行为、不改变 count 边界、不改变 ranker 3-chunk window、不改 API/DTO/DB schema、不刷新 full release authority。
Acceptance: `searchChunks(...)` 先取 primary candidates，再合并 previous context candidates 仅用于 scoring；最终 visible results 只保留 primary candidates；previous context-only classPrefix/filler chunks 不返回；method chunk 仍可借助 context 排第一；`listRetrievalCandidates(...)` 仍保留 previous context candidates；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: search visible results 不再直接展示 context-only prefix/filler chunks；如果未来 UI 需要展示上下文，应通过 evidence expansion/context drawer，而不是 search result item 混入。
Dependencies: P6-CODECHUNKS-PREVIOUS-CANDIDATE-PULL-WINDOW-20260706; P6-CODECHUNKS-SEARCH-COUNT-CONTEXT-BOUNDARY-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-PREVIOUS-CANDIDATE-PULL-WINDOW-20260706
Title: code_chunks bounded previous-context candidate pull window
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / bounded adjacent context candidates / candidate-pool noise control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: endpoint route 查询需要 previous context 时，SourceLens 只把每个 current seed 最近 3 个 previous chunks 加入候选池，避免远早于 current method 的 context-only chunk 混入搜索结果和 QA evidence 候选。
Scope: `CodeChunkService.listPreviousSameFileContextCandidates(...)` DB 查询后 per-seed window 过滤，`CodeChunkServiceTest` 增加服务级候选池边界回归。
Non-goals: 不改变 ranker 3-chunk scoring window、不改变 count 边界、不实现 per-seed SQL top-N、不跨文件、不后向、不改 API/DTO/DB schema、不刷新 full release authority。
Acceptance: previous context query 仍 endpoint-only；最多 32 seeds；SQL 不使用 `content LIKE`；query 仍 nearest-first；每个 seed 最多保留 3 个 previous context candidates；DB 返回 4 个 previous chunks 时最早 prefix 不进入 result；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: DB 仍执行单次 bounded query，不是 per-seed SQL top-N；多 seed 大文件场景仍可能受全局 LIMIT 影响；完整 route graph、跨文件、后向 chunk 和 provider/file-index 消歧仍需后续设计。
Dependencies: P6-CODECHUNKS-PREVIOUS-CONTEXT-WINDOW-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-PREVIOUS-CONTEXT-WINDOW-20260706
Title: code_chunks bounded previous same-file context window
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / cross-chunk route context / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Spring Controller 被切成多段时，class-level route prefix 在前前 chunk、中间 chunk 只有字段/构造器、method mapping 在当前 chunk，SourceLens 仍能把 `/api/users/42` 定位到当前 method chunk。
Scope: `CodeChunkRanker.rankWithPreviousSameFileContext(...)` 从单 previous chunk 扩展为最多 3 个 previous same-file chunks 的 bounded scoring window；CodeChunkServiceTest 增加三段 window 正例。
Non-goals: 不主动扩大 DB 查询 LIMIT、不跨文件、不后向、不做完整 route graph、不改变返回 chunk identity、不新增 API/DTO/DB schema、不刷新 full release authority。
Acceptance: endpoint route 查询才使用 previous context window；window 最多 3 个 previous same-file chunks；前置 chunks 按 startLine 顺序拼接后只参与 scoring；返回仍是原始 current chunk；class prefix 在前前 chunk 时 method chunk 排第一；超过 3 个 previous chunks 时过早 prefix 不参与组合；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: 这是 bounded window heuristic，不是完整 adjacency graph；超过 3 个 previous chunks、多文件 controller、后向 route prefix、复杂 AST 和 provider/file-index 消歧仍需后续设计。
Dependencies: P6-CODECHUNKS-PREVIOUS-CONTEXT-NEAREST-FIRST-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-PREVIOUS-CONTEXT-NEAREST-FIRST-20260706
Title: code_chunks nearest previous same-file context candidate pull
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / bounded adjacent context candidates / large-file recall quality
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: endpoint route 查询在大文件后半段命中 method chunk 时，previous context query 应优先拉取离 method 最近的前置 chunk，避免 LIMIT 被文件最早的老 chunk 占满后错过真正的 class-level route prefix。
Scope: `CodeChunkService.listPreviousSameFileContextCandidates(...)` nearest-first query ordering, CodeChunkServiceTest query-order regression.
Non-goals: 不改变 method/path/evidence/endpoint primary candidate 排序、不改变 search count 边界、不实现完整 route graph、不新增 DB schema、不刷新 full release authority、不保证跨文件/后向/multi-chain route context。
Acceptance: previous context query 使用 `start_line DESC` nearest-first，并保持 `file_path ASC` 稳定排序；其他 auxiliary candidate query 保持原排序；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: 这是 bounded LIMIT 内 nearest-first 优化，不是 per-seed fair top-N，也不是完整 adjacency graph；多 seed、多文件、超出 LIMIT 或跨文件 route graph 仍需后续设计。
Dependencies: P6-CODECHUNKS-PREVIOUS-CHUNK-CONTEXT-CANDIDATES-20260706; P6-CODECHUNKS-SEARCH-COUNT-CONTEXT-BOUNDARY-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-SEARCH-COUNT-CONTEXT-BOUNDARY-20260706
Title: code_chunks endpoint search count context boundary
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / search metadata correctness / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: endpoint route 搜索可以继续用 previous same-file context 改善排序，但 UI/接口的搜索总数不能把仅用于辅助排序的 previous context chunk 算成真实匹配，避免 `total` 被 class-level prefix chunk 虚增。
Scope: `CodeChunkService.countSearchMatches(...)` 与 `listSearchCandidates(...)` 的 context candidate 开关拆分，CodeChunkServiceTest count 边界回归。
Non-goals: 不改变 search result items ranking、不改变 QA retrieval candidate context、不新增 DTO/API schema、不改变 DB schema、不实现完整 route graph、不刷新 full release authority、不中断 previous same-file candidate pull。
Acceptance: `searchChunks(...)` 继续包含 previous same-file context candidates；`listRetrievalCandidates(...)` 继续包含 previous same-file context candidates；`countSearchMatches(...)` 在 auxiliary hint 场景只统计 primary candidates，不执行 previous context query；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: auxiliary search count 仍是 bounded candidate-pool count，不是全库精确 count；本轮只隔离 previous context-only chunk，不改变其他 role/path/method/evidence/endpoint auxiliary candidate 的计数策略。
Dependencies: P6-CODECHUNKS-PREVIOUS-CHUNK-CONTEXT-CANDIDATES-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-SPRING-COMPOSED-ROUTE-RECALL-20260706
Title: code_chunks Spring class-level + method-level route composition recall
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route composition / content LIKE avoidance
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户查询 `/api/auth/login` 时，SourceLens 能识别同一 Controller chunk 内 `@RequestMapping("/api/auth")` + `@PostMapping("/login")` 这类 Spring 组合路由，并优先定位真实 Controller。
Scope: CodeChunkRanker composed Spring route scoring, CodeChunkServiceTest positive and negative route composition regression coverage.
Non-goals: 完整 HTTP route graph、跨 chunk route composition、变量路径/PathVariable 模板展开、Spring meta-annotation、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: class-level `@RequestMapping(prefix)` 出现在 class/interface/record 声明前，method mapping 出现在类声明后时，`/prefix/suffix` 查询可给 Controller 加权；两个无父子关系的方法级 mapping 不得被误组合；方法级 `@RequestMapping(prefix)` + 后续 method mapping 不得误组合；endpoint route 查询 SQL 不含 `content LIKE`；focused Maven tests PASS；QA/Data-AI 三轮复核 PASS。
Risks: 这是同 chunk bounded heuristic，不是完整 Spring route resolver；跨 chunk class annotation 与 method annotation 暂不组合。
Dependencies: P6-CODECHUNKS-ENDPOINT-ROUTE-HINT-RECALL-20260706; RISK-AI-006 content LIKE removal.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PARTIAL-FIXED-THEN-PASS
```

```text
ID: P6-CODECHUNKS-CONFIG-ROLE-INTENT-RECALL-20260705
Title: code_chunks CONFIG role-intent recall
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / runtime configuration questions / content LIKE avoidance
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户询问 CORS、application.yml、datasource、环境变量、端口、Spring Boot runtime config 等运行配置位置时，SourceLens 能从路径结构召回配置文件，而不是被 README 或前端配置页噪声截断。
Scope: CodeChunkRanker CONFIG intent, CodeChunkService CONFIG role file_path conditions, CodeChunkServiceTest role-intent regression coverage.
Non-goals: 全文 content LIKE、完整语义检索、仓库级配置知识图谱、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: 运行配置语义进入 CONFIG intent；泛化英文 config 必须有 runtime/server/backend/spring/database/port/security/jwt/credential 等上下文；model config page / ModelConfig page 不触发 CONFIG；CONFIG role query 只基于 file_path；README 和 frontend config page 噪声场景下 application.yml 可被补召回；CodeChunkServiceTest PASS；QA/Data-AI review issue 已修正。
Risks: 这是 path/structure-first 的 bounded role intent，不是全文语义检索；后续如果配置文件命名极端非标准，仍需要 embedding 或 file-index 辅助。
Dependencies: RISK-AI-006 content LIKE removal; P6 backend role intent retrieval.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PARTIAL-FIXED
```

```text
ID: P6-CODECHUNKS-TEST-DOCS-ROLE-INTENT-RECALL-20260705
Title: code_chunks TEST / DOCUMENTATION role-intent recall
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / test and documentation questions / content LIKE avoidance
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户询问测试文件、测试用例、Playwright spec、README、docs 或 runbook 位置时，SourceLens 能从路径结构召回对应测试/文档文件，而不是被源码类、配置文件或 README 噪声截断。
Scope: CodeChunkRanker TEST/DOCUMENTATION intent, evidence type ordering, CodeChunkService TEST/DOCUMENTATION role file_path conditions, CodeChunkServiceTest role-intent regression coverage.
Non-goals: 全文 content LIKE、完整文档语义分类器、测试覆盖图谱、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: AuthServiceTest.java 优先判 TEST；TEST intent 覆盖测试文件/用例/spec/smoke/e2e/JUnit/Playwright 定位语义并排除 latest/contest/protest/测试一下接口/测试按钮；DOCUMENTATION intent 覆盖 README/docs/runbook/项目文档定位语义并排除 document parser/uploaded document file；role query 只基于 file_path；CodeChunkServiceTest PASS；QA/Data-AI review issue 已修正。
Risks: 这是 path/structure-first 的 bounded role intent，不是完整测试覆盖图谱或文档语义分类器；非标准命名仍需 embedding、file index 或 provider metadata 辅助。
Dependencies: RISK-AI-006 content LIKE removal; P6 CONFIG role-intent recall.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PARTIAL-FIXED
```

```text
ID: P6-CODECHUNKS-SEARCH-COUNT-CONSISTENCY-20260705
Title: code_chunks search/count consistency for auxiliary recall
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval metadata / search total consistency / content LIKE avoidance
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 当 role/path/method/evidence 辅助召回能返回测试、文档、配置或定位候选时，搜索接口的 total/truncated/evidence profile 不再因为 keyword count 为 0 而和 items 发生矛盾。
Scope: CodeChunkService countSearchMatches auxiliary path, shared search candidate pool, CodeChunkServiceTest count regression coverage.
Non-goals: 全量精确数据库 count、全文 content LIKE、DTO schema 调整、API 路由调整、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: 普通关键词查询继续走 selectCount 快路径；存在 role/path/method/evidence 辅助召回信号时 count 复用 searchChunks 候选池并按 chunkKey 去重；SQL 不含 content LIKE；CodeChunkServiceTest PASS；QA/Data-AI review PASS。
Risks: 辅助召回 count 是 candidate-pool count，受 RANKING_CANDIDATE_MAX_LIMIT 保护，不是全库精确 count；这是为保证 UI metadata 与实际候选一致的 bounded tradeoff。
Dependencies: P6 TEST/DOCUMENTATION role-intent recall; RISK-AI-006 content LIKE removal.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-HYBRID-RETRIEVAL-METADATA-20260705
Title: code_chunks HYBRID retrieval metadata for auxiliary structural recall
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval metadata / evidence profile accuracy / API contract
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 当用户通过测试、文档、配置、路径、方法锚点或报告证据路径等结构化信号命中代码切片时，接口不再把该结果伪装成普通 KEYWORD，而是明确标记为 HYBRID，便于前端、报告和 release evidence 正确解释证据来源。
Scope: CodeChunkController retrievalMode decision, CodeChunkService auxiliary hint exposure, CodeChunkControllerTest regression, API_DESIGN retrievalMode contract.
Non-goals: 新增陌生 retrievalMode 枚举、改变 DTO schema、改变 search ranking、DB schema、前端 UI、LLM provider、release verifier schema、GitHub App、full release authority refresh。
Acceptance: 普通关键词命中继续返回 KEYWORD；空 query 继续 STABLE_FALLBACK；无 code_chunks 继续 NO_CONTEXT；非成功扫描继续 NO_SCAN；存在 role/path/method/evidence 辅助信号且命中时返回 HYBRID；evidenceProfile summary 使用混合召回；前端标签和 release verifier allowlist 兼容；CodeChunkControllerTest + CodeChunkServiceTest PASS；QA/Data-AI review PASS。
Risks: HYBRID 表示结构辅助参与召回，不证明语义 embedding 或 LLM 回答事实正确；如果未来引入更细枚举，必须同步 release verifier、前端标签、API 设计和 smoke marker。
Dependencies: P6-CODECHUNKS-SEARCH-COUNT-CONSISTENCY-20260705; existing release verifier HYBRID allowlist.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-LINE-HINT-HYBRID-METADATA-20260706
Title: code_chunks line-hint HYBRID metadata boundary
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval metadata / line anchor trust / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: file:line、source URL line 和 JSON evidence line 这类行级定位参与排序时，搜索接口返回 HYBRID；纯 `line 85`、`第85行` 或“生成 85 行代码”不会被误当成可靠结构锚点。
Scope: CodeLocationHintParser CJK line hint boundary, CodeChunkService auxiliary hint context guard, CodeChunkController retrievalMode guard, parser/service/controller focused tests.
Non-goals: 新增 retrievalMode 枚举、改变 DTO schema、改变 DB schema、完整 file-index、完整自然语言行号语义分类器、前端 UI、LLM provider、GitHub App、full release authority refresh。
Acceptance: `第85行` 仍解析为 line hint；`生成 85 行代码` 与 `85行代码` 不解析；plain keyword 不触发 auxiliary；纯 `line 85` / `第85行` 不触发 HYBRID；`AuthService line 85`、file:line、JSON `filePath + lineNumber` 触发 auxiliary；controller 对 source URL line hint 返回 HYBRID，对纯 line query 返回 STABLE_FALLBACK；focused Maven tests PASS；QA/Data-AI 二轮复核 PASS。
Risks: line hint metadata 只证明结构锚点参与检索，不证明 LLM 事实正确；纯行号没有文件或关键词上下文时只能作为稳定回退，不应声称行级定位。
Dependencies: P6-CODECHUNKS-HYBRID-RETRIEVAL-METADATA-20260705; CodeLocationHintParser line hint contract.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PARTIAL-FIXED-THEN-PASS
```

```text
ID: P6-CODECHUNKS-ENDPOINT-ROUTE-HINT-RECALL-20260706
Title: code_chunks endpoint route hint recall
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / endpoint route lookup / content LIKE avoidance
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户直接用 `/api/auth/login`、`http://localhost:8080/api/auth/login?...` 或带 endpoint/接口上下文的 `/login` 查询时，SourceLens 能把真正声明接口路径的 Controller/API candidate 召回并优先排序，而不是只靠文件名 token。
Scope: CodeLocationHintParser endpoint route hints, CodeChunkRanker endpoint route scoring, CodeChunkService endpoint route candidate pool, focused parser/service tests.
Non-goals: 全文 `content LIKE`、完整 HTTP route graph、Spring class-level + method-level route composition、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: `/api/auth/login` 和带 host/query 的 URL 能解析为 route hint；source URL、本机绝对路径和无 route 上下文 `/login` 不触发；endpoint route 查询补召回 controller/api 路径候选；SQL 不含 `content LIKE`；目标 Controller 排第一；focused Maven tests PASS；QA/Data-AI review PASS。
Risks: 这是 bounded route hint，不是完整路由解析器；带 endpoint/接口上下文的非典型无扩展名绝对路径仍可能被解析为 route hint，但候选池限制在 controller/api 文件路径内并有数量上限。
Dependencies: RISK-AI-006 content LIKE removal; P6-CODECHUNKS-LINE-HINT-HYBRID-METADATA-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-PATH-VARIABLE-ROUTE-TEMPLATE-RECALL-20260706
Title: code_chunks Spring path variable route template recall
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route template / content LIKE avoidance
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 用户用具体接口路径 `/api/users/42` 查询时，SourceLens 能命中后端 `@GetMapping("/api/users/{id}")` 或 `@RequestMapping("/api/users") + @GetMapping("/{id}")` 这类真实 Spring Controller 模板路由。
Scope: CodeChunkRanker single-segment path variable template scoring, composed template route scoring, CodeChunkServiceTest regression coverage.
Non-goals: 完整 Spring route resolver、跨 chunk route composition、跨 segment wildcard、复杂 path regex、PathVariable 类型约束、Spring meta-annotation、全文 content LIKE、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: direct template route 和 class/method composed template route 查询均优先返回 Controller；segment count 不一致不误命中；新增核心路径 SQL 断言不含 `content LIKE`；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI 二轮复核 PASS。
Risks: 这是 bounded single-segment template recall，不是完整路由图；更具体模板优先级和跨文件组合仍需后续设计。
Dependencies: P6-CODECHUNKS-ENDPOINT-ROUTE-HINT-RECALL-20260706; P6-CODECHUNKS-SPRING-COMPOSED-ROUTE-RECALL-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PARTIAL-FIXED-THEN-PASS
```

```text
ID: P6-CODECHUNKS-PATH-VARIABLE-TEMPLATE-SPECIFICITY-20260706
Title: code_chunks Spring path variable template specificity ranking
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route template ranking / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 当 `/api/users/42` 同时匹配 `/api/users/{id}` 与 `/api/{resource}/{id}` 时，SourceLens 优先返回更具体的 UserController，而不是泛化 fallback Controller。
Scope: CodeChunkRanker route template specificity scoring, CodeChunkServiceTest specific-vs-generic regression coverage.
Non-goals: exact literal route 细粒度排序、完整 Spring route resolver、跨 chunk route graph、复杂 path regex、PathVariable 类型约束、Spring meta-annotation、全文 content LIKE、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: literal segment 多的模板必须优先于 path variable segment 多的泛模板；segment count mismatch 仍不命中；composed template class boundary 保持；SQL 不含 `content LIKE`；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: 这是 route template ranking heuristic，不是完整 Spring specificity comparator；exact literal route vs template 的更细排序后续可补。
Dependencies: P6-CODECHUNKS-PATH-VARIABLE-ROUTE-TEMPLATE-RECALL-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-EXACT-ROUTE-OVER-TEMPLATE-20260706
Title: code_chunks exact Spring route priority over path-variable template
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route ranking / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 当 `/api/users/me` 同时匹配 exact literal route 与 `/api/users/{id}` 模板时，SourceLens 优先返回 exact Controller；同一 chunk 多 class 场景不会把 A 类 class-level prefix 和 B 类 method mapping 误组合。
Scope: CodeChunkRanker exact Spring route scoring, same-class composed route boundary, CodeChunkServiceTest exact-vs-template and multi-class false-positive regressions.
Non-goals: 完整 Spring route resolver、跨 chunk route graph、annotation 多属性/数组解析、复杂 path regex、PathVariable 类型约束、Spring meta-annotation、全文 content LIKE、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: exact Spring literal route 优先于 path-variable template；frontend API exact string 不抢走后端 exact Controller；`/api/users/{id}` 仍优先于 `/api/{resource}/{id}`；多 class chunk 不跨类组合；SQL 不含 `content LIKE`；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI 二轮复核 PASS。
Risks: 这是 bounded route ranking heuristic，不是完整 Spring resolver；annotation 多属性、数组 mapping 和跨 chunk route graph 仍需后续设计。
Dependencies: P6-CODECHUNKS-PATH-VARIABLE-TEMPLATE-SPECIFICITY-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PARTIAL-FIXED-THEN-PASS
```

```text
ID: P6-CODECHUNKS-SPRING-MAPPING-MULTI-LITERAL-ROUTE-20260706
Title: code_chunks Spring mapping annotation value/path multi-literal route parsing
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring mapping parser / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Spring Controller 使用 `@GetMapping(name="x", value="/api/users/me")`、`path={...}` 或 class/method 多属性组合时，SourceLens 仍能识别真实 route；同时不会把 `name/produces/headers` 等非 route 属性误当 endpoint。
Scope: CodeChunkRanker springMappingLiterals parsing, value/path attribute filter, CodeChunkServiceTest positive/negative route parser coverage.
Non-goals: 完整 Java annotation parser、字符串内部转义解析、复杂 SpEL/常量引用、跨 chunk route graph、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: 支持非首个 `value/path` 字符串、class/method composed 多属性 route、`path` 数组后续 literal；排除 scalar `name/produces`、`produces` 数组、`headers` 数组和 composed `name+name`；SQL 不含 `content LIKE`；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI 三轮复核 PASS。
Risks: 这是 bounded regex parser，不是完整 Java annotation AST；复杂转义、常量 route、SpEL、嵌套 annotation 仍需后续设计。
Dependencies: P6-CODECHUNKS-EXACT-ROUTE-OVER-TEMPLATE-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PARTIAL-FIXED-THEN-PASS
```

```text
ID: P6-CODECHUNKS-SPRING-SAME-CHUNK-ROUTE-CONSTANTS-20260706
Title: code_chunks same-chunk Spring route constants
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route constants / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Spring Controller 将 route 提取为同一 chunk 内简单 `String` 常量时，SourceLens 仍能识别 endpoint；例如 `private static final String USER_ME = "/api/users/me"; @GetMapping(USER_ME)`。
Scope: CodeChunkRanker same-chunk String route constant extraction, route attribute gating, CodeChunkServiceTest direct/composed constant positive and name/produces constant negative coverage.
Non-goals: 跨文件常量解析、字符串拼接、常量表达式求值、非 String 常量、完整 Java AST、SpEL、复杂转义、跨 chunk route graph、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: direct route constant 可命中；class-level + method-level 常量 route 可组合；`name` / `produces` 常量不误当 route；SQL 不含 `content LIKE`；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: 这是 same-chunk simple String heuristic，不是完整 Java constant resolver；跨文件常量和拼接表达式仍需后续设计。
Dependencies: P6-CODECHUNKS-SPRING-MAPPING-MULTI-LITERAL-ROUTE-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-SPRING-ROUTE-CONCATENATION-20260706
Title: code_chunks same-chunk simple Spring route concatenation
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route concatenation / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Spring Controller 使用同一 chunk 内简单 route 常量拼接时，SourceLens 能识别完整 endpoint；例如 `@GetMapping(USER_ROOT + "/me")` 和 `@RequestMapping(path = API_ROOT + "/users") + @GetMapping("/{id}")`。
Scope: CodeChunkRanker same-chunk simple `+` route expression resolver, concatenation fragment suppression, Controller plain constant weak-signal boundary, CodeChunkServiceTest positive/negative coverage.
Non-goals: 跨文件常量解析、复杂表达式求值、方法调用求值、SpEL、完整 Java AST、完整 Spring route graph、跨 chunk route graph、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: 完整可解析拼接 route 可命中；class-level 拼接 + method-level route 可组合；`produces` 拼接不误当 route；拼接片段 `/api/users`、`/me`、`/api`、`/users` 不作为独立 Spring route；无法完整解析的拼接不部分命中；Controller 普通 route-looking 常量不作为强 endpoint route；SQL 不含 `content LIKE`；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: 这是 same-chunk simple `+` heuristic，不是完整 Java constant-expression resolver；跨文件常量、复杂表达式和真实 route graph 仍需后续设计。
Dependencies: P6-CODECHUNKS-SPRING-SAME-CHUNK-ROUTE-CONSTANTS-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-SPRING-ROUTE-CONSTANT-EXPRESSIONS-20260706
Title: code_chunks same-chunk Spring route constant expressions
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route constant expressions / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Spring Controller 使用同一 chunk 内 route 常量链时，SourceLens 能识别最终 endpoint；例如 `API_ROOT="/api"; USER_ROOT=API_ROOT + "/users"; @GetMapping(USER_ROOT + "/me")`。
Scope: CodeChunkRanker same-chunk String route constant declaration collection, bounded constant-expression resolution, unresolved expression fail-closed behavior, CodeChunkServiceTest direct/composed/negative coverage.
Non-goals: class/member scope resolver、跨文件常量解析、方法调用求值、复杂表达式求值、SpEL、完整 Java AST、完整 Spring route graph、跨 chunk route graph、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: route 常量链可完整解析；direct constant expression route 可命中；class-level constant expression + method-level route 可组合；无法完整解析的常量表达式不部分命中；`produces` 常量表达式不误当 endpoint；核心正向路径 SQL 不含 `content LIKE`；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: 这是 same-chunk bounded constant-expression heuristic，不是 class/member scope Java resolver；同一 chunk 多 class/常量共享常量表仍是已知边界，后续完整 scope resolver 或跨 chunk route graph 需单独设计。
Dependencies: P6-CODECHUNKS-SPRING-ROUTE-CONCATENATION-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-SPRING-ROUTE-CONSTANT-SCOPE-20260706
Title: code_chunks Spring route constant class-scope isolation inside a chunk
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route constant scope / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 单个 code chunk 包含多个 Spring Controller class 且定义同名 route 常量时，SourceLens 不会把后一个 class 的常量串到前一个 class 的 mapping 上，降低接口定位误命中。
Scope: CodeChunkRanker annotation-to-class range detection, class declaration scanner, scoped same-chunk route constants, duplicate constant regression coverage.
Non-goals: 完整 Java parser、nested/inner class scope resolver、跨文件常量解析、跨 chunk route graph、方法调用求值、复杂表达式求值、SpEL、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: class-level mapping 读取关联 class 内常量；method-level mapping 读取所在 class 内常量；同 chunk 后续 class 同名常量不污染前一个 class；注释/字符串内 fake `class` 不污染 class boundary；mapping 与 class 之间的注释、额外 annotation、modifier 可跳过；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI 三轮复核 PASS。
Risks: 这是 bounded class declaration scanner，不是完整 Java AST；nested/inner class、复杂语法和跨 chunk route graph 仍需后续设计。
Dependencies: P6-CODECHUNKS-SPRING-ROUTE-CONSTANT-EXPRESSIONS-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PARTIAL-FIXED-THEN-PASS
```

```text
ID: P6-CODECHUNKS-KOTLIN-SPRING-ROUTE-CONSTANTS-20260706
Title: code_chunks Kotlin Spring route constants
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Kotlin Spring route constants / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Kotlin Spring Controller 使用同一 class chunk 内 `const val` 或 `val` route constants 时，SourceLens 能识别 endpoint；例如 `const val API_ROOT = "/api"; val USER_ME: String = API_ROOT + "/users/me"; @GetMapping(USER_ME)`。
Scope: CodeChunkRanker Kotlin `val` / `const val` constant extraction, uppercase constant identifier support, optional `: String` annotation support, mapping value/path gate, CodeChunkServiceTest parser-level and service-level Kotlin coverage.
Non-goals: Kotlin string templates、top-level/cross-file constants、import/static import constants、函数调用、复杂表达式、完整 Kotlin AST、跨 chunk route graph、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: Java/Kotlin uppercase route constants 可解析；Kotlin `val` / `const val` 可选 `: String` 可解析；mapping annotation 常量引用支持大写常量；只采 value/path route，不采 `produces`；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI 二轮复核 PASS。
Risks: 这是 same-class chunk 内 bounded regex/constant-expression heuristic，不是 Kotlin compiler parser；注释或普通文本中伪造完整常量声明仍是理论边界，后续若要完全解决需 AST 或 file index/provider metadata。
Dependencies: P6-CODECHUNKS-SPRING-ROUTE-CONSTANT-SCOPE-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW BLOCK-FIXED-THEN-PASS
```

```text
ID: P6-CODECHUNKS-SPRING-ROUTE-ARRAY-EXPRESSIONS-20260706
Title: code_chunks Spring value/path array route expressions
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route array expressions / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Spring Controller 在 `value/path` 数组内使用常量拼接 route 时，SourceLens 能识别完整 endpoint；例如 Java `path = { USER_ROOT + "/me" }` 和 Kotlin `value = [USER_ROOT + "/me"]`。
Scope: CodeChunkRanker `springRouteExpressions(...)` array element parsing, concatenated expression suppression, Java/Kotlin parser-level coverage, CodeChunkServiceTest service-level ranking and SQL boundary tests.
Non-goals: shorthand array 拼接 `@GetMapping({ USER_ROOT + "/me" })`、nested arrays 深层展开、完整 Java/Kotlin annotation AST、Kotlin string templates、方法调用/枚举/外部类限定名/数组变量引用、跨 chunk route graph、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: `value/path = { ... }` 与 `value/path = [ ... ]` 可逐元素解析；数组内 `USER_ROOT + "/me"` 可解析为完整 route；拼接片段 `"/me"` 和 `USER_ROOT` 不额外注册为独立 route；`produces` 仍不进入 route matching；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: 这是 bounded annotation argument scanner，不是完整 AST；复杂嵌套 annotation、shorthand array、Kotlin string templates 和复杂表达式仍需后续设计。
Dependencies: P6-CODECHUNKS-KOTLIN-SPRING-ROUTE-CONSTANTS-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-SPRING-SHORTHAND-ARRAY-ROUTE-EXPRESSIONS-20260706
Title: code_chunks Spring shorthand array route expressions
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring shorthand route arrays / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Java Spring Controller 使用 implicit value shorthand array 时，SourceLens 能识别完整 endpoint；例如 `@GetMapping({ USER_ROOT + "/me", "/status" })`。
Scope: CodeChunkRanker no-attribute `springRouteExpressions(...)` array branch, shorthand array element parsing, concatenation fragment suppression, CodeChunkServiceTest parser-level and service-level shorthand coverage.
Non-goals: nested arrays 深层展开、完整 Java/Kotlin annotation AST、Kotlin string templates、方法调用、运行时表达式、三元表达式、collection constants、跨文件常量、meta-annotation、alias/import alias、跨 chunk route graph、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: `@GetMapping({ USER_ROOT + "/me", "/status" })` 可解析 `/api/users/me` 和 `/status`；拼接片段 `"/me"` 与 `USER_ROOT` 不注册为独立 route；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: 这是 bounded shorthand array support，不是 AST parser；复杂 annotation 参数和运行时表达式仍会保守失败或需要后续专门设计。
Dependencies: P6-CODECHUNKS-SPRING-ROUTE-ARRAY-EXPRESSIONS-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-PREVIOUS-CHUNK-ROUTE-CONTEXT-20260706
Title: code_chunks previous same-file chunk Spring route context
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / cross-chunk route context / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Spring Controller 被切成多个 code_chunks 时，class-level `@RequestMapping("/api/users")` 在前一个 chunk、method-level `@GetMapping("/{id}")` 在当前 chunk，SourceLens 仍能把 `/api/users/42` 定位到当前 method chunk。
Scope: CodeChunkService endpoint-route-only context ranking, CodeChunkRanker previous same-file candidate context scoring, positive/negative CodeChunkServiceTest coverage.
Non-goals: 主动 DB 邻接查询、prefix 不在候选池时的召回、后向 chunk context、跨文件 route graph、完整 chunk adjacency graph、完整 Spring AST/route graph、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: endpoint route 查询才启用 previous same-file context ranking；合成 chunk 只参与 scoring，返回仍是原始 current chunk；前一 chunk class prefix + 当前 method suffix 可命中；前一 prefix + unrelated method suffix 不误命中；SQL 不含 `content LIKE`；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: 这是 bounded candidate-pool reranking，不是完整 route graph；prefix chunk 不在候选池、prefix 在后一个 chunk、跨文件 controller composition 和复杂 AST 仍需后续设计。
Dependencies: P6-CODECHUNKS-SPRING-SHORTHAND-ARRAY-ROUTE-EXPRESSIONS-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-PREVIOUS-CHUNK-CONTEXT-CANDIDATES-20260706
Title: code_chunks previous same-file route context candidate pull
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / bounded adjacent context candidates / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: endpoint route 查询的初始候选池只有 method chunk、缺少前一 class-level route prefix chunk 时，SourceLens 可受限拉取前一同文件 chunk，让 `/api/users/42` 仍定位到当前 method chunk。
Scope: CodeChunkService endpoint-only previous same-file context candidate query, bounded seed/limit guard, no `content LIKE`, CodeChunkServiceTest positive and regression coverage.
Non-goals: N+1 per-candidate query、普通关键词查询 previous context、后向 chunk、跨文件 route graph、完整 adjacency graph、完整 Spring AST/route graph、prefix 超出 seed/limit 的召回保证、API/DTO、DB schema、前端 UI、LLM provider、release evidence schema、GitHub App、full release authority refresh。
Acceptance: 仅 endpoint route hint 时执行 previous context candidate query；单次 bounded query，最多前 32 个 seeds，LIMIT 受 `RANKING_CANDIDATE_MAX_LIMIT` 保护；previous 查询只使用 scan_task_id、file_path、start_line 条件；不含 `content LIKE`；初始候选缺 prefix 时可拉回 previous chunk 并命中当前 method chunk；focused Maven tests PASS；P6 backend suite PASS；QA/Data-AI review PASS。
Risks: 这是 bounded adjacent candidate pull，不是完整 route graph；prefix 在后一个 chunk、跨文件、超出 seed/limit 或多段 previous chain 仍需后续设计。
Dependencies: P6-CODECHUNKS-PREVIOUS-CHUNK-ROUTE-CONTEXT-20260706.
Status: DONE / BACKEND TEST + QA-DATA REVIEW PASS
```

```text
ID: P6-CODEQA-CLAIM-AWARE-CITATION-ENFORCEMENT-20260706
Title: Code QA claim-aware citation enforcement
Priority: P1
Phase: P6 / P10 / P11
Track: QA citation trust / claim-level grounding / LLM answer safety
Owner: 梁文峰 / 拉里佩奇 / 奥特曼 / 特朗普
User value: Code QA 不能仅凭答案末尾 `Sources: [C1]` 或全局出现 PRIMARY label 就把具体代码事实判定为已验证；每条需要证据的 claim 必须逐条带有效 PRIMARY-bound 引用。
Scope: CodeQaController citation enforcement gate, retry blank fallback preservation, CodeQaControllerTest claim-aware enforcement regression and existing split-claim expectation alignment.
Non-goals: 新增 DTO schema、改变 retrieval ranking、改变 prompt injection guard、改变 LLM provider、前端 UI、DB schema、GitHub App、release evidence schema、完整事实语义验证器。
Acceptance: DIRECT_VERIFIED / RETRY_VERIFIED 必须同时满足 `groundingStatus == VERIFIED`、`claimCitationCoverage.status == READY`、required claims 全部 PRIMARY-bound、required context-only/unknown-only 为 0；trailing source-only answer 必须触发 retry；retry blank/null 不覆盖原答案且状态为 RETRY_FAILED；claim 引 context 但 footer 引 primary 不得通过；split-claim REVIEW 用例不得直接通过；focused Maven tests PASS；P6 backend suite PASS；QA/Data/Security review 完成。
Risks: claim coverage 仍是 heuristic，不等同于完整自然语言事实验证；若未来 answer format 新增“全局 sources 合法格式”或允许 context-only facts，必须显式设计 claim-to-source binding，而不是放宽 enforcement。
Dependencies: P6-CODEQA-FALLBACK-PRIMARY-CITATION-BOUNDARY-20260706.
Status: DONE / BACKEND TEST PASS / QA-DATA SECOND REVIEW PENDING / SECURITY REVIEW PASS
```

```text
ID: P6-CODEQA-PRIMARY-BOUND-RETRY-PROMPT-20260706
Title: Code QA primary-bound citation retry prompt
Priority: P1
Phase: P6 / P10 / P11
Track: QA citation trust / retry prompt contract / LLM answer correction
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 当 Code QA 首次回答未满足 PRIMARY-bound 引用规则时，citation retry prompt 必须明确告诉 LLM 哪些标签是 PRIMARY、哪些只是 ADJACENT_CONTEXT，避免 retry 继续生成 context-only 引用。
Scope: CodeQaController citationRetryMessages evidence list formatting, primary-bound retry instruction, CodeQaControllerTest retry prompt contract assertion.
Non-goals: 新增 DTO schema、改变 enforcement gate、改变 retrieval ranking、改变 prompt injection guard、真实 LLM provider E2E、前端 UI、DB schema、GitHub App、完整语义事实验证器。
Acceptance: retry prompt 列出 `[Cx] role=PRIMARY/ADJACENT_CONTEXT file=...`；retry prompt 明确每条需要证据的具体代码事实必须至少引用一个 PRIMARY 标签；ADJACENT_CONTEXT 只能补充不能作为唯一引用；测试捕获第二次 LLM call 并断言上述规则；focused Maven tests PASS；P6 backend suite PASS；QA/Data review 完成。
Risks: prompt 约束仍依赖 LLM 遵守，因此后端 enforcement gate 仍是最终可信边界；本轮不证明真实 provider 会始终按格式修正。
Dependencies: P6-CODEQA-CLAIM-AWARE-CITATION-ENFORCEMENT-20260706.
Status: DONE / BACKEND TEST PASS / QA-DATA REVIEW PENDING
```

```text
ID: P6-CODEQA-ENFORCEMENT-FAILURE-NOTES-20260706
Title: Code QA citation enforcement failure note precision
Priority: P1
Phase: P6 / P10 / P11
Track: QA citation trust / retry failure diagnosis / product feedback clarity
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: Code QA 在 citation retry 后仍失败时，前端和用户能看到更准确的失败原因：无证据、无有效标签、无效标签、未逐条引用、只绑定 ADJACENT_CONTEXT、只绑定 UNKNOWN 或没有可审计 claim，而不是统一泛化为“引用不完整”。
Scope: CodeQaController citationEnforcementFailureNote priority, invalid-label/context-only/uncited failure note tests, QA/Data-AI review loop.
Non-goals: 新增 DTO schema、改变 verified enforcement gate、改变 retrieval ranking、改变 LLM provider、前端 UI、DB schema、GitHub App、release evidence schema、完整事实语义验证器。
Acceptance: RETRY_FAILED note 不被 groundingStatus 提前吞掉更准确的 claimCoverage 原因；invalid label 命中“不存在或无效的证据标签”；pure ADJACENT_CONTEXT 命中 ADJACENT_CONTEXT + PRIMARY 证据提示；uncited required claim 命中“缺少逐条有效引用”；focused Maven tests PASS；P6 backend suite PASS；QA/Data 首轮 PARTIAL 已打回修复，二轮 PASS。
Risks: note 是诊断信息，不是新的安全边界；enforcement gate 和 claimCoverage 字段仍是权威状态。UNKNOWN-only 分支当前主要作为防御性兜底，正常 endpoint 构造只产生 PRIMARY / ADJACENT_CONTEXT。
Dependencies: P6-CODEQA-CLAIM-AWARE-CITATION-ENFORCEMENT-20260706, P6-CODEQA-PRIMARY-BOUND-RETRY-PROMPT-20260706.
Status: DONE / BACKEND TEST PASS / QA-DATA SECOND REVIEW PASS
```

```text
ID: P6-CODEQA-ENFORCEMENT-REASON-CODE-20260706
Title: Code QA citation enforcement machine-readable reason code
Priority: P1
Phase: P6 / P10 / P11
Track: QA citation trust / structured diagnostics / verifier readiness
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 前端、smoke 和 release verifier 不再需要解析中文 `citationEnforcementNote` 来判断 retry failure 原因，可直接读取稳定 `citationEnforcementReason` 机器码。
Scope: CodeQaResponse DTO, CodeQaController response/enforcement result, CodeQaControllerTest reason assertions, web-console CodeQaResponse type, API_DESIGN contract.
Non-goals: 改变 verified enforcement gate、改变 AutoRepair gate、前端 UI 展示改造、release verifier 强校验改造、DB schema、LLM provider、GitHub App。
Acceptance: 响应新增 optional `citationEnforcementReason`；成功路径覆盖 DIRECT_VERIFIED / RETRY_VERIFIED / FALLBACK_PRIMARY_CITED；失败路径覆盖 UNCITED_REQUIRED_CLAIM / CONTEXT_ONLY_CLAIM / INVALID_LABEL；旧 `citationEnforcementStatus` 与 `citationEnforcementNote` 保持兼容；focused Maven tests PASS；P6 backend suite PASS；frontend build PASS；QA/Data review PASS。
Risks: reason code 是诊断字段，不是新的安全边界；后续前端/verifier 接入时仍必须以 status + coverage + claimCoverage 作为权威门禁。
Dependencies: P6-CODEQA-ENFORCEMENT-FAILURE-NOTES-20260706.
Status: DONE / BACKEND TEST PASS / FRONTEND BUILD PASS / QA-DATA REVIEW PASS
```

```text
ID: P6-P9-CODEQA-ENFORCEMENT-REASON-UI-MARKER-20260706
Title: Project QA citation enforcement reason UI and smoke marker propagation
Priority: P1
Phase: P6 / P9 / P11
Track: QA citation trust / frontend evidence UX / smoke release evidence
Owner: 扎克伯格 / 拉里佩奇 / 梁文峰 / 特朗普
User value: Project QA 页面和低置信度 smoke marker 可以直接展示并证明 `citationEnforcementReason` 机器码，避免只靠 status 或人读 note 判断失败原因。
Scope: ProjectDetail QA message model/trust summary/low-confidence panel, project API type gate, project-qa-low-confidence smoke fixtures/assertions/marker, frontend static validator.
Non-goals: 改变后端 enforcement gate、改变 AutoRepair 放行逻辑、release verifier hard gate、DB schema、LLM provider、GitHub App、完整 UI 重构。
Acceptance: `CodeQaResponse` 类型、`QaMessage`、Project QA assistant message state 均承接 `citationEnforcementReason`；UI 显示 reason code 与中文 reason label；trust summary 检查包含 reason；low-confidence smoke 覆盖并输出 `DIRECT_VERIFIED`、`NO_EVIDENCE`、`NO_VALID_CITATION_LABEL`、`UNCITED_REQUIRED_CLAIM`；`validate-frontend-ui.mjs` 同时锁定 API 类型、UI 消费和 smoke marker；frontend static gate PASS；frontend build PASS；Project QA low-confidence smoke PASS；Frontend/QA review 首轮 PARTIAL 已修正。
Risks: reason code 是诊断字段，不是新的安全边界；AutoRepair/release gate 仍必须依赖 status、citationCoverage、claimCitationCoverage 和 source evidence gate。
Dependencies: P6-CODEQA-ENFORCEMENT-REASON-CODE-20260706.
Status: DONE / FRONTEND STATIC + BUILD + SMOKE PASS / FE-QA SECOND REVIEW PASS
```

```text
ID: P6-P11-CODEQA-ENFORCEMENT-REASON-RELEASE-EVIDENCE-20260706
Title: Code QA citation enforcement reason release evidence gate
Priority: P1
Phase: P6 / P10 / P11
Track: QA citation trust / release evidence / verifier anti-forgery
Owner: 黄仁勋 / 拉里佩奇 / 特朗普
User value: release evidence 不再只证明 citation enforcement status 存在，还必须证明成功路径带有稳定 `citationEnforcementReason`，避免通过缺失原因码或人读 note 伪造 QA citation 可信度。
Scope: public repo UI smoke marker, report evidence QA citation smoke marker, release evidence verifier, security regression forged marker payloads, frontend static validator.
Non-goals: 改变后端 enforcement gate、改变 AutoRepair 放行逻辑、刷新 full release authority、GitHub App、真实私有仓库 E2E、完整语义事实验证器。
Acceptance: `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.citationEnforcementReasons` 和 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.citationEnforcementReasons` 必须非空；verifier 只允许 `DIRECT_VERIFIED`、`RETRY_VERIFIED`、`FALLBACK_PRIMARY_CITED`；security regression 的有效 payload 和手写伪造样本必须带合法 reason，防止被缺字段提前拒绝；`validate-frontend-ui.mjs` 锁定 smoke、verifier、security payload 三层；frontend static gate PASS；frontend build PASS；focused report evidence QA citation smoke PASS；release verifier public repo UI marker security suite PASS；DevOps/QA review 二轮 PASS。
Risks: reason code 是诊断和 release evidence 证明字段，不替代 `citationEnforcementStatus`、`citationCoverage`、`claimCitationCoverage` 或 source evidence gate；历史旧 release evidence 包若没有 reason 字段，会被当前 verifier 拒绝，这是 schema 收紧的预期结果。
Dependencies: P6-CODEQA-ENFORCEMENT-REASON-CODE-20260706, P6-P9-CODEQA-ENFORCEMENT-REASON-UI-MARKER-20260706.
Status: DONE / STATIC + BUILD + SMOKE + SECURITY REGRESSION PASS / DEVOPS-QA SECOND REVIEW PASS
```

```text
ID: P6-P11-PROJECT-QA-RECOVERABLE-REASON-MARKER-20260706
Title: Project QA recoverable smoke citation enforcement reason marker
Priority: P1
Phase: P6 / P9 / P11
Track: QA citation trust / recoverable UX smoke / marker evidence
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: Project QA recoverable smoke 不再只证明 `citationEnforcementStatus` 与引用 UI 存在，还必须证明成功 QA 响应的 `citationEnforcementReason=DIRECT_VERIFIED` 已进入页面可见状态和 marker。
Scope: `project-qa-recoverable-smoke.spec.ts` mock response、UI reason assertion、marker aggregation, `validate-frontend-ui.mjs` static gate.
Non-goals: 不改变后端 enforcement gate、AutoRepair gate、release verifier hard gate、DB schema、LLM provider、GitHub App、真实 provider eval、full release authority。
Acceptance: qaPayload 返回 `citationEnforcementReason`；QA 重试成功后页面显示 `原因码 DIRECT_VERIFIED`；marker 输出 `answerReadability.citationEnforcementReasons=["DIRECT_VERIFIED"]` 与 `directVerifiedReasonVisible=true`；frontend static gate/build/focused smoke PASS；Frontend/QA review PASS。
Risks: 该 smoke 为 mocked-only UI evidence，不证明真实 LLM 事实正确性或真实 provider 质量；权威门禁仍是后端 status、citationCoverage、claimCitationCoverage 和 release verifier。
Dependencies: P6-P9-CODEQA-ENFORCEMENT-REASON-UI-MARKER-20260706, P6-P11-CODEQA-ENFORCEMENT-REASON-RELEASE-EVIDENCE-20260706.
Status: DONE / STATIC + BUILD + SMOKE PASS / FE-QA REVIEW PASS
```

```text
ID: P9-SCAN-REPORT-EVIDENCE-TRACE-READABILITY-20260706
Title: Scan report evidence profile and trace map readability hardening
Priority: P1
Phase: P9 / P11
Track: Report UX / mobile readability / regression gate
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 扫描报告主页面的证据契约卡片、报告章节追踪卡片和报告证据抽屉交接包在桌面、390px、320px 下不再用 nowrap、ellipsis、line-clamp 或 overflow hidden 隐藏关键信息。
Scope: `web-console/src/styles/app.css`, `web-console/tests/report-evidence-drawer-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`.
Non-goals: 不重做全站 UI、不改变后端扫描/QA/AutoRepair 逻辑、不声明真实 LLM provider、真实后端 E2E 或 full release authority。
Acceptance: evidence profile 的 label/value/detail 可换行不裁切；trace map 的 label/value/source/detail 可换行不裁切；320px 报告证据抽屉 handoff summary 保持在 viewport 内；smoke marker 输出 `evidenceProfileTraceMapReadability` 且覆盖 1440/390/320；static validator 拒绝这些区域回退到 ellipsis/nowrap/overflow hidden/line-clamp；frontend static/build/focused smoke PASS；FE/QA 二轮复核 PASS。
Risks: 本轮是 report evidence focused UI 证据，不等同于全站 UI 顶级化完成；smoke 使用 mocked API，不证明真实 LLM 或生产发布证据。
Dependencies: RISK-FE-001, report evidence drawer smoke.
Status: DONE / STATIC + BUILD + SMOKE PASS / FE-QA SECOND REVIEW PASS
```

```text
ID: P9-SCAN-REPORT-API-DB-TABLE-READABILITY-20260706
Title: Scan report API and DB table evidence field readability hardening
Priority: P1
Phase: P9 / P10 / P11
Track: Report UX / evidence readability / display redaction / regression gate
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 扫描报告 API/DB 表格中的长 route、Controller 类名和实体文件路径不再被业务 ellipsis 隐藏，用户在 1440、390、320 视口下可以直接读到完整证据字段。
Scope: `web-console/src/pages/ScanTaskDetail.tsx`, `web-console/src/styles/app.css`, `web-console/tests/report-evidence-drawer-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`.
Non-goals: 不改变后端报告数据、DB 存储、扫描结果生成、全站表格策略、真实 LLM provider、full release authority 或 GitHub App E2E。
Acceptance: API `路径`、API `Controller`、DB `文件` 列移除 `ellipsis: true`；三列使用 `.sl-report-table-evidence-text` 并经 `redactReportEvidenceText` 展示层脱敏；CSS 保证 wrap/no ellipsis/no hidden overflow；smoke 使用长 route/class/file mock 并在 1440/390/320 下证明不裁切、无横向溢出；marker 输出 `reportApiDbTableReadability` 且三项 visible=true；static validator 拒绝三列回退到 `ellipsis: true`；frontend static/build/focused smoke PASS；FE/QA review PASS。
Risks: 本轮只声明展示层脱敏和 UI/smoke/static gate，不声明源数据、数据库、后端返回体已被永久脱敏；仍是 report evidence focused UI 切片，不等同于全站 UI 完成。
Dependencies: P9-SCAN-REPORT-EVIDENCE-TRACE-READABILITY-20260706, RISK-FE-001.
Status: DONE / STATIC + BUILD + SMOKE PASS / FE-QA REVIEW PASS
```

```text
ID: P9-SCAN-REPORT-GOVERNANCE-TIMELINE-READABILITY-20260706
Title: Scan report governance timeline readability hardening
Priority: P1
Phase: P9 / P11
Track: Report UX / repair governance / mobile readability / regression gate
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 扫描报告中的修复治理时间线承载 AutoRepair、Agent、审计和门禁原因，必须在桌面、390px、320px 下完整可读，不能裁切治理卡片、阶段、事件标题、门禁原因或动作按钮。
Scope: `web-console/src/styles/app.css`, `web-console/tests/report-evidence-drawer-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`.
Non-goals: 不改变后端 governance aggregate API、AutoRepair、AgentTask、审计数据、真实生产发布证据、GitHub App E2E、全站 UI 完成声明。
Acceptance: governance card label/value/detail 可换行不裁切；stage label/reason/action 可读；event meta/title/detail/gate reason/action 可读；smoke 使用长 governance event fixture 并在 1440/390/320 证明 `reportGovernanceTimelineReadability`；static validator 拒绝 governance 文本回退到 `ellipsis/nowrap/overflow:hidden`；focused test timeout 调整到 90s 且不放宽断言；frontend static/build/focused smoke PASS；FE/QA review PASS。
Risks: 本轮是 mocked API 的 report governance UI 可读性证明，不声明真实后端治理数据、真实 LLM provider、full release authority 或全站 UI 已完成。
Dependencies: P9-SCAN-REPORT-API-DB-TABLE-READABILITY-20260706, RISK-FE-001.
Status: DONE / STATIC + BUILD + SMOKE PASS / FE-QA REVIEW PASS
```

```text
ID: P6-P10-P11-PROJECT-QA-AUTOREPAIR-REASON-PROVENANCE-20260706
Title: Project QA to AutoRepair citation enforcement reason and provenance redaction chain
Priority: P1
Phase: P6 / P10 / P11
Track: QA citation trust / AutoRepair provenance / display redaction / audit safety
Owner: 扎克伯格 / 拉里佩奇 / 奥特曼 / 特朗普
User value: Project QA 生成 AutoRepair 候选时，`citationEnforcementReason` 必须随 verified citation 从 QA message 贯穿到 URL、draft provenance、create payload、后端 DTO 和审计 provenance；同时相关 display、copy 和 audit provenance 不能泄漏 seeded raw secrets。
Scope: `ProjectDetail.tsx`, `AutoRepairsPage.tsx`, `AutoRepairs.tsx`, `autoRepair.ts`, AutoRepair DTO/service/test, Project QA AutoRepair smoke, frontend static validator.
Non-goals: 不声明全站 UI/redaction 完成，不声明 sanitizer 能识别所有任意 secret 形态，不改变 AutoRepair 放行语义、GitHub App E2E、真实 LLM provider 或 full release authority。
Acceptance: URL/search params 包含 `citationEnforcementReason=DIRECT_VERIFIED`；AutoRepair draft/create payload/provenance/audit receipt 保留 reason；Project QA citation card、code_chunks evidence reason、copy citation、data-sl-target-url、browser URL、create payload 和 backend audit provenance 对 seeded raw secrets 脱敏；static validator 锁定 reason chain 和 redaction gate；frontend static/build/focused smoke PASS；backend focused test PASS；FE/QA/Security review 二轮 PASS。
Risks: reason code 是诊断和证据链字段，不替代 status、citationCoverage、claimCitationCoverage 或 source evidence gate；sanitizer 覆盖当前规则集和测试哨兵，不等同于所有未知 secret 形态。
Dependencies: P6-P11-CODEQA-ENFORCEMENT-REASON-RELEASE-EVIDENCE-20260706, P6-P11-PROJECT-QA-RECOVERABLE-REASON-MARKER-20260706.
Status: DONE / STATIC + BUILD + BACKEND TEST + SMOKE PASS / FE-QA-SEC SECOND REVIEW PASS
```

```text
ID: P6-CODECHUNKS-MARKDOWN-EVIDENCE-URL-DISAMBIGUATION-20260706
Title: code_chunks hosted Markdown evidence URL disambiguation
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / report evidence citation trust / documentation evidence
Owner: 梁文峰 / 拉里佩奇 / 奥特曼 / 特朗普
User value: 报告、README、治理文档和 release evidence 中的 Markdown 证据 URL 现在可以被 code_chunks 作为强路径信号识别，避免只按同名文件弱匹配导致 QA citation 指向旧文档或 archive decoy。
Scope: `CodeLocationHintParser`, `CodeLocationHintParserTest`, `CodeChunkServiceTest`.
Non-goals: 不改变远程 URL 拉取策略、不把普通 `url/path` 字段升级为 evidence anchor、不声明所有文档引用语义验证完成、不刷新 full release authority。
Acceptance: hosted `.md` URL 经过 path suffix 解析后不携带 host、branch、hash 噪声；`docs/CHAIRMAN_BRIEFING.md#L20` 类 URL 能在候选排序中压过 `archive/docs/CHAIRMAN_BRIEFING.md` 同名 decoy；focused backend tests PASS；Data/AI + QA + Security review PASS。
Risks: Markdown URL 仍只是本地候选定位信号，不代表远程内容可信或已被拉取验证；未知 host 仍只作为路径 hint 做本地匹配。
Dependencies: code_chunks file path hint parser, RISK-AI-006.
Status: DONE / BACKEND FOCUSED TEST PASS / DATA-QA-SEC REVIEW PASS
```

```text
ID: P6-CODECHUNKS-ROOT-METADATA-PERSISTENCE-20260706
Title: code_chunks workspace/module root metadata persistence
Priority: P1
Phase: P6 / P10 / P11
Track: code_chunks retrieval / monorepo metadata / API contract / path boundary safety
Owner: 梁文峰 / 拉里佩奇 / 奥特曼 / 特朗普
User value: code_chunks 在切片写入时持久化 `workspace_root` 与 `module_root`，让 monorepo 同名文件消歧从纯 query-time heuristic 推进到可复用 metadata，为后续 provider/workspace graph 打基础。
Scope: `CodeChunk` entity/mapper/DTO/controller, `CodeChunkService`, `CodeChunkRanker`, V032 migration, focused tests.
Non-goals: 不实现完整 package-manager workspace graph，不回填历史 scan，不刷新 full release authority，不新增远程 URL 拉取/执行/信任。
Acceptance: V032 幂等新增 nullable `workspace_root/module_root` 与 lookup indexes；`chunkAndSave` 写入 repo-relative root metadata；repo escape symlink 被 `toRealPath` 边界拦截；ranker 优先使用持久化 metadata 但必须校验 `filePath` anchored；API 暴露 root metadata 但拒绝绝对路径、parent traversal 和 Windows drive path；focused backend tests PASS；Data/AI + QA + Security review 最终 PASS。
Risks: migration integration 仍未用真实 MySQL/Flyway test profile 自动验证；作为后续 P11/P12-pre release authority 补强项记录，不阻塞本 focused P6 切片。
Dependencies: P6-CODECHUNKS-MODULE-ROOT-HINT-DISAMBIGUATION-20260706, RISK-AI-006.
Status: DONE / BACKEND FOCUSED TEST PASS / DATA-QA-SEC THIRD REVIEW PASS
```

```text
ID: P6-CODECHUNKS-PATH-HINT-MIDDLE-CONTAINS-ANCHOR-HARDENING-20260706
Title: code_chunks path hint middle-contains exact-anchor hardening
Priority: P1
Phase: P6 / P10 / P11
Track: code_chunks retrieval / QA citation trust / generated path noise control
Owner: 梁文峰 / 拉里佩奇 / 奥特曼 / 特朗普
User value: 在 monorepo、generated metadata 和同名文件场景中，`legacy/.../src/pages/Foo.tsx/generated/metadata.ts` 这类中间包含路径不再被当成 exact anchor 或 PRIMARY 证据，只能作为弱排序信号，降低 QA citation 锚错文件的风险。
Scope: `CodeChunkRanker`, `CodeChunkRankerTest`, `CodeChunkServiceTest`.
Non-goals: 不改变候选召回 SQL，不放宽短路径多命中 PRIMARY，不新增远程 URL 拉取/执行，不声明完整 monorepo file graph resolver 完成。
Acceptance: path/evidence/method exact anchor 只接受 exact、real suffix 或 basename/compact fallback；middle contains 只保留为低分排序信号；generated/metadata only-middle 命中降权；compact file name 必须高于 middle contains；service-level 回归证明 compact target 压过 generated/noise middle contains decoy；focused backend tests PASS；Data/AI + QA + Security review PASS。
Risks: 这是 ranker/anchor heuristic hardening，不是完整路径解析器；复杂 monorepo package-root、generated source map 和跨仓 workspace resolver 仍需后续设计。
Dependencies: P6-CODEQA-SOURCE-EVIDENCE-INDEXED-EXTENSION-PARITY-20260706, RISK-AI-004, RISK-AI-006.
Status: DONE / BACKEND FOCUSED TEST PASS / DATA-QA-SEC FOURTH REVIEW PASS
```

```text
ID: P6-CODECHUNKS-MODULE-ROOT-HINT-DISAMBIGUATION-20260706
Title: code_chunks module root hint disambiguation
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / monorepo same-name file disambiguation / QA citation trust
Owner: 梁文峰 / 拉里佩奇 / 奥特曼 / 特朗普
User value: 在 monorepo 中多个 `src/pages/Login.tsx`、`src/index.ts` 或同名模块文件并存时，报告证据里的 `sourceRoot: packages/admin`、hosted URL 里的 `apps/client/...` 可以作为有界排序信号，减少 QA citation 和 code_chunks 候选指向错误 package 的概率。
Scope: `CodeLocationHintParser`, `CodeChunkRanker`, `CodeLocationHintParserTest`, `CodeChunkRankerTest`, `CodeChunkServiceTest`.
Non-goals: 不新增 DB/schema 字段，不实现完整 monorepo workspace resolver，不改变远程 URL 拉取/执行/信任策略，不刷新 full release authority。
Acceptance: parser 能提取 `apps/*`、`packages/*`、`services/*`、`modules/*`、`libs/*` module root hint；ranker 只对仓库根部真实 module root 加权，不提升 `archive/packages/admin/...` 中间路径；hosted arbitrary branch 保守归一化边界继续受测试保护；service-level 回归证明目标 package 压过同 suffix decoy 和 archive decoy；focused backend tests PASS；Data/AI + QA + Security review PASS。
Risks: 这是 bounded module-root ranking heuristic，不是 provider metadata、package manager workspace graph 或跨仓 resolver；复杂多 workspace、嵌套 package 和非标准目录仍需后续 P6/P12-pre 设计。
Dependencies: P6-CODECHUNKS-PATH-HINT-MIDDLE-CONTAINS-ANCHOR-HARDENING-20260706, RISK-AI-006.
Status: DONE / BACKEND FOCUSED TEST PASS / DATA-QA-SEC REVIEW PASS
```

```text
ID: P6-CODECHUNKS-INDEXED-EXTENSION-HINT-PARITY-20260706
Title: code_chunks indexed file extension path hint parity
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / path hint parser / indexed file parity
Owner: 梁文峰 / 拉里佩奇 / 奥特曼 / 特朗普
User value: 已被 code_chunks 索引的脚本、样式、native/kotlin script 等文件类型，现在也能被路径 hint parser 作为强路径信号识别，避免 QA citation 对 `.sh/.scss/.cpp/.kts` 文件只能弱匹配或漏召回。
Scope: `CodeLocationHintParser`, `CodeLocationHintParserTest`, `CodeChunkServiceTest`.
Non-goals: 不新增普通 `.json` 文件索引，不改变远程 URL 拉取策略，不把普通 `url/path` 字段升级为 evidence anchor，不刷新 full release authority。
Acceptance: parser 的 indexed extension 集合与 `CodeChunkFileFilter.SUPPORTED_EXTENSIONS` 对齐；长扩展优先避免 `.kts/.tsx/.scss/properties` 被短扩展截断；路径扩展后必须有边界，避免 `.hbs/.jsonnet/.cppbackup` 被误截断；hosted `.sh` URL 能在 retrieval 候选排序中压过同名 archive decoy；focused backend tests PASS；Data/AI + QA + Security review PASS。
Risks: `.json` 仍未作为普通 code chunk 索引类型；若未来要支持 package/tsconfig 等 JSON 配置检索，需要同步扩展 filter、parser、测试和噪声控制。
Dependencies: P6-CODECHUNKS-MARKDOWN-EVIDENCE-URL-DISAMBIGUATION-20260706, RISK-AI-006.
Status: DONE / BACKEND FOCUSED TEST PASS / DATA-QA-SEC SECOND REVIEW PASS
```

```text
ID: P6-CODEQA-SOURCE-EVIDENCE-INDEXED-EXTENSION-PARITY-20260706
Title: Code QA source evidence indexed extension path parity
Priority: P1
Phase: P6 / P11
Track: Code QA citation trust / sourceEvidenceRef normalization / indexed file parity
Owner: 梁文峰 / 拉里佩奇 / 奥特曼 / 特朗普
User value: 报告证据跳转到 Code QA 时，hosted `.sh/.md/.scss/.kts` 等已索引文件 URL 能被 sourceEvidenceRef 归一化为真实本地 chunk path，避免 evidence 已命中检索但 QA citation 仍无法标记 PRIMARY 或 REPORT_LINE_ANCHOR。
Scope: `CodeQaController`, `CodeQaControllerTest`.
Non-goals: 不新增普通 `.json` code chunk 索引，不改变远程 URL 拉取/执行/信任策略，不放宽 ambiguous short path fail-closed，不刷新 full release authority。
Acceptance: `CodeQaController.normalizeEvidencePath` 的 indexed extension 集合与 `CodeLocationHintParser` / `CodeChunkFileFilter` 当前索引范围保持一致；hosted `.sh?plain=1#L12` sourceEvidenceRef 能匹配 `scripts/run-backend-dev.sh` chunk；响应必须证明 `sourceEvidenceMatched=true`、`REPORT_LINE_ANCHOR`、retrieved chunk `PRIMARY`、citation coverage `PRIMARY`、claim role distribution `PRIMARY_BOUND`；focused backend test PASS；Data/AI + QA + Security review PASS。
Risks: `.md` 在 controller 层依赖同一 normalization 链路和扩展集合，不单独增加重复 case；外部 URL 仍只作为本地路径 hint，不证明远程内容可信。
Dependencies: P6-CODECHUNKS-INDEXED-EXTENSION-HINT-PARITY-20260706, RISK-AI-004, RISK-AI-006.
Status: DONE / BACKEND FOCUSED TEST PASS / DATA-QA-SEC REVIEW PASS
```

```text
ID: P6-CODECHUNKS-MAIN-SCAN-SUBTREE-PRUNING-20260706
Title: code_chunks main source scan subtree pruning
Priority: P1
Phase: P6 / P10 / P11
Track: code_chunks scan performance / repository boundary / skipped directory policy
Owner: 比尔盖茨 / 奥特曼 / 拉里佩奇 / 特朗普
User value: 主代码切片不再先递归进入 `node_modules`、`dist`、`.git` 等跳过目录后再逐文件过滤，降低公开仓库分析中的无效扫描成本和依赖/构建目录噪声。
Scope: `CodeChunkService`, `CodeChunkServiceRootIndexTest`, `CodeChunkServiceTest`.
Non-goals: 不改变 skip dir 列表，不新增 symlink 跟随策略，不实现完整 workspace/package manager graph，不刷新 full release authority。
Acceptance: 主切片遍历必须使用 `walkFileTree + SKIP_SUBTREE`；skip dir 下文件不得进入 `fileFilter.shouldInclude` 热路径；合法源码仍能被收录；symlink 逃逸保护不得放松；focused backend tests PASS；Backend + Security + QA review PASS。
Risks: 默认不跟随文件 symlink，合法 repo 内 symlink 源码不会被收录；这是安全收紧，不是 symlink 源码支持。完整性能基准和生产大仓 benchmark 后续仍需 P11/P12-pre 覆盖。
Dependencies: P6-CODECHUNKS-WORKSPACE-ROOT-MANIFEST-SCAN-PRUNING-20260706, RISK-AI-006, RISK-AI-SEC-PATH.
Status: DONE / BACKEND FOCUSED TEST PASS / BACKEND-SEC-QA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-STREAMING-SOURCE-FILE-VISITOR-20260706
Title: code_chunks streaming source file visitor
Priority: P1
Phase: P6 / P11
Track: code_chunks scan efficiency / large repository memory profile / regression guard
Owner: 比尔盖茨 / 黄仁勋 / 拉里佩奇 / 特朗普
User value: 主切片扫描不再先构建完整候选文件 `List<Path>` 才开始处理，降低大型公开仓库中候选路径列表的瞬时内存占用，并为后续大仓 benchmark 和分批写入打基础。
Scope: `CodeChunkService`, `CodeChunkServiceRootIndexTest`.
Non-goals: 不改变切片内容、不改变 skip dir 策略、不改变 DB 批量写入策略、不声明完整大仓性能基准完成。
Acceptance: `chunkAndSave` 必须通过 visitor 流式处理候选文件；`walkIncludedSourceFiles` 仅保留为测试/兼容 helper；skip dir pruning、repo boundary、symlink safety、合法源码收录行为保持；focused backend tests PASS；Backend + DevOps + QA review PASS。
Risks: `chunksToSave` 仍按扫描任务聚合后批量写库，本轮只消除候选路径列表预收集，不是端到端 streaming persistence。
Dependencies: P6-CODECHUNKS-MAIN-SCAN-SUBTREE-PRUNING-20260706.
Status: DONE / BACKEND FOCUSED TEST PASS / BACKEND-DEVOPS-QA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-BATCHED-CHUNK-FLUSH-20260706
Title: code_chunks batched chunk flush
Priority: P1
Phase: P6 / P11
Track: code_chunks scan efficiency / batch persistence / failure propagation
Owner: 比尔盖茨 / 黄仁勋 / 拉里佩奇 / 特朗普
User value: 主切片扫描不再把整次扫描的全部 `CodeChunk` 长期堆在内存里，达到 `BATCH_SIZE` 后即批量落库，降低大型公开仓库分析中的切片结果内存峰值。
Scope: `CodeChunkService`, `CodeChunkServiceTest`.
Non-goals: 不改变 DB schema，不改变 embedding provider，不改变 `BATCH_SIZE`，不实现跨扫描任务事务，不声明完整性能 benchmark 完成。
Acceptance: 切片 buffer 达到 `BATCH_SIZE` 必须 flush；跨多个文件累计到 200 也必须 flush；尾批必须保留；满批写库失败必须向外抛出，不能被文件级 catch 吞掉；async embedding 必须只在存在缺失 embedding 的切片时触发；focused backend tests PASS；Backend + DevOps + QA review PASS。
Risks: 中途批次已落库后如果后续批次失败，仍可能出现部分写入；调用方会进入失败路径，后续需要事务/补偿策略进一步收敛。
Dependencies: P6-CODECHUNKS-STREAMING-SOURCE-FILE-VISITOR-20260706.
Status: DONE / BACKEND FOCUSED TEST PASS / BACKEND-DEVOPS-QA REVIEW PASS AFTER BLOCK FIX
```

```text
ID: P6-CODECHUNKS-BATCH-FLUSH-FAILURE-COMPENSATION-20260706
Title: code_chunks batch flush failure compensation
Priority: P1
Phase: P6 / P11
Track: code_chunks batch persistence / partial write cleanup / scan task correctness
Owner: 比尔盖茨 / 黄仁勋 / 拉里佩奇 / 特朗普
User value: 批次写库失败时，当前 scanTask 已部分写入的 code_chunks 会被清理，避免扫描失败后残留半套切片影响后续 Code QA、检索和报告引用可信度。
Scope: `CodeChunkService`, `CodeChunkServiceTest`.
Non-goals: 不引入数据库事务，不改变 scan task 状态机，不改变 DB schema，不实现跨模块补偿事务。
Acceptance: 初始旧切片清理失败必须直接抛错；满批 flush 失败、尾批失败和遍历级异常必须尝试清理当前 scanTask partial chunks 并向外抛；失败路径不得触发 async embedding；focused backend tests PASS；Backend + DevOps + QA review PASS。
Risks: 清理补偿本身失败时只能把 cleanup 异常追加到原异常 suppressed，仍需后续事务/操作告警进一步强化。
Dependencies: P6-CODECHUNKS-BATCHED-CHUNK-FLUSH-20260706.
Status: DONE / BACKEND FOCUSED TEST PASS / BACKEND-DEVOPS-QA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-CHUNK-AND-SAVE-FAIL-FAST-VALIDATION-20260706
Title: code_chunks chunkAndSave fail-fast input and repository path validation
Priority: P1
Phase: P6 / P10 / P11
Track: code_chunks scan correctness / repo boundary / stale chunk protection
Owner: 比尔盖茨 / 奥特曼 / 拉里佩奇 / 特朗普
User value: 当 scanTaskId 或仓库路径无效时，扫描任务必须进入失败路径，不能先清空旧 code_chunks，也不能静默返回后让调用方误标扫描成功。
Scope: `CodeChunkService`, `CodeChunkServiceTest`.
Non-goals: 不改变单文件读取失败继续扫描的容错策略，不新增权限错误专用 fixture，不实现完整数据库事务。
Acceptance: `scanTaskId=null`、空白 repoPath、缺失 repoPath、普通文件 repoPath 必须在删除旧 chunks 前 fail-fast；`toRealPath()` 失败必须在清理旧 chunks 前抛出；无效路径不得调用 mapper delete/insert 或 fileFilter；focused backend tests PASS；Backend + Security + QA review PASS。
Risks: `toRealPath()` 权限失败在不同 OS/文件系统上 fixture 不稳定，本轮用实现顺序和更稳定的 missing/regular-file 测试证明主要边界；生产权限错误仍会走同一 fail-fast 分支。
Dependencies: P6-CODECHUNKS-BATCH-FLUSH-FAILURE-COMPENSATION-20260706.
Status: DONE / BACKEND FOCUSED TEST PASS / BACKEND-SEC-QA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-PREVIOUS-CONTEXT-ROOT-METADATA-PRESERVATION-20260706
Title: code_chunks previous-context root metadata preservation
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / monorepo disambiguation / QA citation trust
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: previous same-file context 参与 route ranking 时，合成评分对象必须保留当前 chunk 的 workspaceRoot/moduleRoot，避免 monorepo 同名 controller 在 sourceRoot/moduleRoot hint 下丢失 package 消歧信号。
Scope: `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不改变 DB schema，不改变 endpoint route scoring 权重，不扩大 previous context 可见结果，不实现完整 package manager workspace graph。
Acceptance: `withPreviousContext` 保留 current chunk 的 id/scanTaskId/filePath/workspaceRoot/moduleRoot/contentHash/embedding/embeddingModel/createdAt/endLine；startLine 扩展为 previous window 起点；previous-context route ranking 在 `sourceRoot: packages/admin` 场景中优先目标 module；focused backend tests PASS；Data-AI + Backend + QA review PASS。
Risks: 合成 chunk 仅用于评分，最终返回原始 current chunk；若未来把合成对象直接暴露给 API，必须重新审查 contentHash/embedding 与拼接 content 的一致性。
Dependencies: P6 code_chunks root metadata, P6 previous same-file context route ranking.
Status: DONE / BACKEND FOCUSED TEST PASS / DATA-BACKEND-QA REVIEW PASS
```

```text
ID: P9-APP-SHELL-TOPBAR-ACTIONS-CONTAINMENT-20260706
Title: App shell topbar actions containment and wrapping guard
Priority: P1
Phase: P9 / P11
Track: frontend app shell readability / responsive topbar / UI smoke evidence
Owner: 乔布斯 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 顶部标题区域右侧的环境、端口和用户菜单不能挤压或裁切页面标题；核心页面在 1440、390、320 视口下必须保持顶部文字和操作区都可见、可控、无横向溢出。
Scope: `web-console/src/styles/app.css`, `web-console/tests/app-shell-ui-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`.
Non-goals: 不重做整体 UI 主题，不改变路由结构，不改变登录状态或用户菜单业务行为，不刷新 full release authority。
Acceptance: `.sl-topbar-actions` 必须 flex wrap、可收缩、overflow visible；Space item 必须可收缩；app-shell smoke 必须断言 action 区域在 topbar 内、wrap 且不 hidden；marker 必须包含 `topbar-actions-wrap-without-clipping` 和 `topbar-actions-contained`；static validator/build/app-shell smoke PASS；Frontend + QA review PASS。
Risks: 桌面长用户名仍保留业务级 ellipsis；移动端继续隐藏次要标签以保护主标题，这是已有产品边界。
Dependencies: P9 app shell topbar readability gate.
Status: DONE / FRONTEND STATIC+BUILD+SMOKE PASS / FRONTEND-QA REVIEW PASS
```

```text
ID: P10-ARTIFACT-READ-PREVIEW-SYMLINK-ESCAPE-GUARD-20260706
Title: artifact read/preview symlink escape guard
Priority: P1
Phase: P10 / P11
Track: artifact raw access / storage path boundary / security regression gate
Owner: 奥特曼 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: artifact raw download 和 preview 不能通过 artifact root 内的 symlink 读取 root 外文件，避免本地敏感文件被伪装为分析产物暴露。
Scope: `ArtifactStorageService`, `ArtifactStorageServiceTest`.
Non-goals: 不改变 artifact 存储结构，不实现 artifact 加密，不改变 legacy moved workspace JSON fallback，不声明完整文件系统沙箱完成。
Acceptance: 读取路径必须先限制在 artifact root；symlink artifact 必须被拒绝；regular file 检查不得跟随 symlink；真实路径必须仍落在 artifact root；实际 readBytes/readPreview 打开文件时也必须使用 no-follow 读取语义；legacy fallback 不得掩盖当前 root 内安全拒绝；readBytes/readPreview 两条路径必须有回归测试；focused backend tests PASS；Security + Backend + QA review PASS。
Risks: 本轮选择拒绝 symlink artifact，包括指向 root 内的 symlink；legacy fallback 只保留给当前 artifact root 外、形态符合 `artifacts/scan_task/{ownerId}` 的历史迁移路径；no-follow 读取降低校验后目标文件被替换为 symlink 的风险，但不声明完整 SecureDirectoryStream 级 TOCTOU 闭环；如果未来产品需要合法内部 symlink，必须重新设计 allowlist 和审计策略。
Dependencies: P10 raw access boundary, P11 artifact focused regression tests.
Status: DONE / BACKEND FOCUSED TEST PASS / SECURITY-BACKEND-QA REVIEW PASS FOR NO-FOLLOW READ HARDENING
```

```text
ID: P6-CODEQA-HTML-DELETED-TEXT-CITATION-NOISE-FILTER-20260706
Title: Code QA HTML deleted-text citation noise filter
Priority: P1
Phase: P6 / P11
Track: Code QA citation trust / claim citation coverage / hidden-or-revoked answer text
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: LLM 输出 `<del>[C1]</del>`、`<s>[C1]</s>` 或 `<strike>[C1]</strike>` 这类删除线引用时，SourceLens 不能把它当作真实可审计 citation，否则未引用的代码事实会被伪装成已验证。
Scope: `CodeQaController`, `CodeQaControllerTest`.
Non-goals: 不改变 citation 标签语法，不改变 DTO/API/DB schema，不新增前端 UI，不刷新 full release authority。
Acceptance: citation audit 必须剥离 HTML deleted-text block；`<del>`、`<s>`、`<strike>` 里的 fake citation 不能让首次回答 DIRECT_VERIFIED；retry 后只有可见 citation 才允许 RETRY_VERIFIED；HTML code、Markdown link destination、blockquote 和既有 citation 过滤行为不得回退；focused backend tests PASS；Data-AI + Backend + QA review PASS。
Risks: 这是 regex-based bounded sanitizer，不是完整 HTML renderer；复杂坏 HTML 仍可能需要后续 parser 化。
Dependencies: P6 Code QA citation noise filters, P6 claim-aware citation enforcement.
Status: DONE / BACKEND FOCUSED TEST PASS / DATA-BACKEND-QA REVIEW PASS
```

```text
ID: P10-ARTIFACT-WRITE-SYMLINK-PARENT-GUARD-20260706
Title: artifact write symlink parent and target guard
Priority: P1
Phase: P10 / P11
Track: artifact storage write boundary / raw access safety / backend regression
Owner: 奥特曼 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: artifact 写入不能因为 `artifacts` 根目录、owner/type 父目录或目标文件 symlink 被替换而写到 artifact root 外，避免生成产物阶段覆盖本地敏感文件或污染非 SourceLens 目录。
Scope: `ArtifactStorageService`, `ArtifactStorageServiceTest`, security boundary docs.
Non-goals: 不实现完整 `SecureDirectoryStream` 级 TOCTOU 闭环，不支持合法 symlink artifact，不改变 artifact 存储结构、加密策略、download/preview API 或 legacy moved workspace read fallback。
Acceptance: 缺失 workspace base 可正常创建；`artifacts` root symlink 必须拒绝；中间父目录 symlink 必须拒绝；已有目标文件 symlink 必须拒绝；已有普通文件 overwrite 仍必须成功；写入打开文件必须使用 no-follow 语义；artifact workspace 必须作为服务私有目录记录到安全边界；focused backend tests、static security regression、DB schema contract 和固定岗位复核至少 PARTIAL-with-documented-boundary。
Risks: 当前实现通过服务私有 artifact root、no-follow 校验和 no-follow open 收敛写入逃逸风险；不是目录句柄级 race-free 写入。如果未来 artifact root 可被非服务用户写入，必须升级为 `SecureDirectoryStream`/隔离挂载或更强 storage sandbox。
Dependencies: P10 artifact read/preview symlink escape guard, P10 raw access boundary.
Status: DONE / BACKEND FOCUSED TEST PASS / SECURITY-BACKEND-QA REVIEW PARTIAL WITH DOCUMENTED PRIVATE-ROOT BOUNDARY
```

```text
ID: P10-ARTIFACT-PROD-WORKSPACE-STARTUP-GATE-20260706
Title: production artifact workspace private-root startup gate
Priority: P1
Phase: P10 / P11 / P12-pre
Track: production startup security / artifact workspace private-root boundary / regression gate
Owner: 奥特曼 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: artifact 写入侧 symlink 防护依赖“artifact root 是服务私有目录”的安全模型；生产启动必须 fail-closed 校验该目录边界，不能只停留在文档要求。
Scope: `SecurityStartupValidator`, `SecurityStartupValidatorTest`, security boundary docs.
Non-goals: 不影响 dev/test profile，不创建生产 workspace 目录，不实现 `SecureDirectoryStream` 级 race-free 写入，不改变 artifact API 或存储结构。
Acceptance: prod profile 必须要求 `sourcelens.workspace.base-path` 已存在、非 symlink、权限可检查、不可 group/world writable；若 `${workspace}/artifacts` 已存在，也必须同样校验；dev profile 不受该门禁影响；prod YAML 测试必须使用外部 `SOURCELENS_WORKSPACE` 私有临时目录并通过完整 validator；focused backend tests、static security regression、scoped whitespace 和固定岗位复核 PASS。
Risks: 该门禁把 artifact root 私有目录模型从文档要求提升为生产启动前置条件；非 POSIX 权限不可检查环境会 fail-closed。完整目录句柄级 TOCTOU 仍不是本轮目标。
Dependencies: P10-ARTIFACT-WRITE-SYMLINK-PARENT-GUARD-20260706, SecurityStartupValidator production fail-closed boundary.
Status: DONE / BACKEND FOCUSED TEST PASS / SECURITY-BACKEND-QA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-HTTP-METHOD-ROUTE-RANKING-20260706
Title: code_chunks HTTP method route ranking
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / endpoint route disambiguation / QA citation trust
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 当报告、QA 或用户问题明确写出 `GET /path`、`POST /path` 等 HTTP 方法时，SourceLens 必须优先找到同一路径下正确 HTTP method 的 Spring handler，降低 QA citation 锚到错误接口实现的风险。
Scope: `CodeLocationHintParser`, `CodeChunkRanker`, `CodeLocationHintParserTest`, `CodeChunkServiceTest`.
Non-goals: 不实现完整 Spring route graph，不解析跨文件常量，不改变 DB schema/API，不刷新 full release authority。
Acceptance: route hint 存在时才抽取 HTTP method hint；普通自然语言 `get user` 不得触发 endpoint method hint；Spring `@GetMapping/@PostMapping/...` 和 `RequestMethod.*` 必须参与 endpoint route ranking；同一路径不同 HTTP method 时正确 handler 必须排在错误 handler 前；同 chunk 无关 mapping 和 previous-context 无关 mapping 不得污染当前 route method match；focused backend tests PASS；Data-AI review PASS。
Risks: 当前是 bounded ranking signal，不是完整 Spring mapping semantic parser；同一 chunk 内多个同 route 多 method handler 仍不能替代后续 method-level symbol graph。
Dependencies: P6 code_chunks route ranking, P6 QA citation trust, P11 focused regression tests.
Status: DONE / BACKEND FOCUSED TEST PASS / STATIC GATES PASS / DATA-AI REVIEW PASS
```

```text
ID: P6-CODECHUNKS-SPRING-REGEX-PATH-VARIABLE-20260706
Title: code_chunks Spring regex path variable route recall
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route template recall / QA citation trust
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 真实 Spring 项目常用 `@GetMapping("/api/users/{id:\\d+}")` 约束路径变量；SourceLens 必须能把这类 route template 识别为 `/api/users/42` 的代码证据，避免 QA 和报告追问漏掉正确 Controller。
Scope: `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不执行 regex 语义匹配，不支持跨 segment regex，不实现完整 Spring route graph，不改变 DB/API schema。
Acceptance: quoted route literal 中的 `+` 不得被误判为字符串拼接；`{name:regex}` 可作为单 segment Spring path variable 匹配 concrete route；空 regex 和包含 `/` 的 regex fail closed；直接 route 和 class+method composed route 都必须回归；focused backend tests、static security regression、DB schema contract 和 Data-AI review 完成。
Risks: 当前只判断 regex path variable segment 结构，不执行 regex 本身；`{id:[0-9]+}` 会匹配任意非空单段 concrete value，这是 recall-oriented bounded heuristic。
Dependencies: P6 code_chunks Spring route template recall, P6 route ranking, P11 focused regression tests.
Status: DONE / BACKEND FOCUSED TEST PASS / STATIC GATES PASS / DATA-AI REVIEW PASS
```

```text
ID: P6-CODECHUNKS-REQUESTMAPPING-STATIC-METHOD-20260706
Title: code_chunks RequestMapping static-import HTTP method recall
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route method disambiguation / QA citation trust
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 真实 Spring 项目常用静态导入 `RequestMethod.GET` 后写 `@RequestMapping(method = GET)` 或 `method = { GET, HEAD }`；SourceLens 必须能识别这些 HTTP method，避免 GET/POST 同路径接口在 QA citation 中混淆。
Scope: `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不解析完整 Java import，不实现 Spring AST，不改变 DB/API schema，不刷新 full release authority。
Acceptance: 保持 `RequestMethod.GET/POST` 支持；支持 `method = GET`、`method = { GET, HEAD }` 和 `method = { RequestMethod.GET, RequestMethod.HEAD }`；`HEAD /path` 能匹配 HEAD handler；裸枚举只能在 quote/comment-aware 的 `method = ...` 属性中生效；`name = "GET"`、`params = "method=GET"`、`params = "x=RequestMethod.GET"`、`/* method = GET */` 和 `method = { POST /* GET */, PUT }` 不得污染 method 判断；focused backend tests、static security regression、DB schema contract、Data-AI review PASS。
Risks: 这是 annotation-argument bounded parser，不是完整 Java compiler/import resolver；如果项目用自定义常量别名如 `READ = GET`，仍属于后续 P6 深化项。
Dependencies: P6 code_chunks HTTP method route ranking, P6 QA citation trust, P11 focused regression tests.
Status: DONE / BACKEND FOCUSED TEST PASS / STATIC GATES PASS / DATA-AI THIRD REVIEW PASS
```

```text
ID: P6-CODECHUNKS-NESTED-ANNOTATION-ARGUMENT-PARSING-20260706
Title: code_chunks nested Spring/Kotlin annotation argument parsing
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring-Kotlin route recall / QA citation trust
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: Kotlin/Spring 项目常写 `@RequestMapping(method = arrayOf(RequestMethod.GET), path = "/api/...")`；SourceLens 必须跨过 `arrayOf(...)` 继续读取 route，否则 QA 和报告追问会漏掉正确 Controller。
Scope: `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不实现完整 Spring/Kotlin AST，不声明支持所有 Kotlin raw string、复杂 annotation 表达式或 meta-annotation。
Acceptance: `springMappingLiterals(...)` 不再用第一个 `)` 截断 annotation arguments；括号深度扫描必须跳过 quoted string、line comment 和 block comment；Kotlin `arrayOf(RequestMethod.GET)` 后面的 `path` 可被解析为 route literal；GET/POST 竞争场景中 GET query 选中正确 chunk；focused backend tests、P6 backend suite、static security regression、DB schema contract、Data-AI review PASS。
Risks: annotation 起点仍是正则定位；未闭合 quote/block comment 保守跳过该 annotation；完整 AST/semantic parser 后置。
Dependencies: P6 code_chunks Spring route parsing, P6 RequestMapping static method recall, P11 focused regression tests.
Status: DONE / BACKEND FOCUSED TEST PASS / STATIC GATES PASS / DATA-AI REVIEW PASS
```

```text
ID: P6-CODECHUNKS-IGNORE-COMMENTED-SPRING-MAPPINGS-20260706
Title: code_chunks ignore Spring mappings inside comments and strings
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route parser false-positive control / QA citation trust
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 注释或字符串里的 `@GetMapping("/fake")` 不应被当成真实 Spring route，否则 code_chunks 和 Code QA 可能把文档示例、注释说明或旧代码当成接口实现引用。
Scope: `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不实现完整 Java/Kotlin lexer；不移除普通文本 routeMention/exactRoute 弱命中；不声明注释中的路径文本完全不会影响 ranking。
Acceptance: `springMappingLiterals(...)` 在处理 annotation 起点前必须跳过 quoted string、line comment 和 block comment 内的 match；真实 annotation 仍可正常解析；parser 合同测试覆盖 string/line-comment/block-comment 伪注解；ranking 测试证明注释中的伪 mapping 不压过真实 controller route；focused backend tests、P6 backend suite、static security regression、DB schema contract、Data-AI review PASS。
Risks: 注释里的 path literal 仍可能作为弱文本 route mention 得分；本轮只禁止其作为强 Spring mapping route 信号。
Dependencies: P6 Spring route parsing, P6 endpoint route ranking, P11 focused regression tests.
Status: DONE / BACKEND FOCUSED TEST PASS / STATIC GATES PASS / DATA-AI REVIEW PASS
```

```text
ID: P6-CODECHUNKS-ENDPOINT-WEAK-ROUTE-COMMENT-STRIP-20260706
Title: code_chunks strip comments from endpoint weak route mention scoring
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / endpoint route false-positive control / QA citation trust
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 注释里的 `"/api/auth/login"` 等历史路径说明不应作为 endpoint weak route 证据污染 code_chunks 排序；真实前端 API 字符串和 Spring/Kotlin Controller route 仍必须可被召回。
Scope: `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不实现完整多语言 lexer；不声明覆盖 Python `#`、HTML/XML 注释、Markdown prose 或整个候选召回链路；不刷新 full release authority。
Acceptance: `endpointRouteHintScore(...)` 的 weak `exactRoute/routeMention` 必须基于去 Java/JS/Kotlin 风格注释后的内容；真实 quoted route literal 仍保留；line comment 和 block comment 中的 quoted route 在 controller 与非 controller 文件中均不得得分；focused/backend/static/schema gates PASS；Data-AI review PASS。
Risks: 当前只处理 `//` 与 `/* */` 注释形式；文档正文、非 Java-style 注释和其他召回信号仍需后续 P6 评测集继续约束。
Dependencies: P6 Spring mapping comment/string false-positive control, P6 endpoint route ranking, P11 focused regression tests.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI REVIEW PASS
```

```text
ID: P6-CODECHUNKS-NESTED-KOTLIN-OBJECT-ROUTE-CONSTANTS-20260706
Title: code_chunks nested Kotlin object route holder constants
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Kotlin nested object parser / QA citation trust
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: Kotlin 项目常用 `object ApiRoutes { object Auth { const val LOGIN = ... } }` 组织 route；SourceLens 必须能把 `@GetMapping(ApiRoutes.Auth.LOGIN)` 定位到正确 GET Controller，而不是被同路径 POST literal 抢占。
Scope: `CodeChunkRanker`, `CodeChunkService`, `CodeChunkServiceTest`.
Non-goals: 不实现完整 Kotlin AST、import resolver、完整 Spring route graph、companion object 全场景或真实公开仓库 E2E。
Acceptance: route constants 同时注册 nearest qualifier 和完整 nested qualifier；`ApiRoutes.java/.kt` 进入 endpoint route candidate；Kotlin holder 文件名矩阵覆盖常见 `.kt` 命名；focused/backend full/static/schema/code-map gates PASS；Data-AI/QA review PASS。
Risks: 仍是 bounded parser；复杂 branch/import alias/动态 route expression 和深层 Kotlin 语法仍需后续样本。
Dependencies: P6 Kotlin object holder constants, P6 API/URL route holder filename expansion, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-FIXTURE-MIRROR-SOURCEURL-DECOY-20260706
Title: Code QA fixture/testdata mirror sourceUrl decoy hardening
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / provider-file-index disambiguation / source evidence false-positive control
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 报告证据指向真实 `src/pages/Login.tsx` 时，`tests/fixtures/src/pages/Login.tsx`、`testdata/src/pages/Login.tsx` 等镜像样例文件不能继承 sourceUrl suffix/exact 强证据并抢占真实源码。
Scope: `CodeChunkRanker`, `CodeChunkRankerTest`, `CodeQaRetrievalServiceTest`, `p6-code-qa-retrieval-eval-cases.json`.
Non-goals: 不实现完整 file index resolver；不禁止 fixture/testdata 通过 basename/content 作为弱相关候选出现；不声明所有 fixture 目录变体均进入 fixed eval corpus；不刷新 full release authority。
Acceptance: `fixtures/__fixtures__/testdata/test-data` noise path 只阻断 suffix/contains 强证据继承，不阻断 exact path；ranker/service 循环覆盖四类 mirror path；fixed eval corpus 增加 fixtures 与 testdata 两个 required case 且 `minCaseCount=16`；focused/P6 retrieval/backend full/static/schema/code-map gates PASS；Data-AI PASS，QA 首轮 PARTIAL 后二轮 PASS。
Risks: 生产源码如果真实放在 fixture/testdata 目录且只给后缀 hint，将失去 suffix 强分；exact path、basename/content 仍保留。当前是 bounded path heuristic，不替代 provider metadata 或 file index resolver。
Dependencies: P6 sourceUrl exact anchor, generated/archive decoy hardening, P11 fixed retrieval eval gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-PUBLIC-REPO-REPORT-EVIDENCE-START-END-QA-20260706
Title: Public repo report evidence QA mixed lineNumber/startEnd evidenceRef gate
Priority: P1
Phase: P6 / P11
Track: report evidence -> Code QA citation E2E / release evidence verifier / forged marker rejection
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 公开仓库 smoke 不能只证明 `lineNumber` evidenceRef；必须同时证明报告证据以 `startLine/endLine` 传入 Code QA 时，不合成 legacy lineNumber，且仍绑定 PRIMARY citation。
Scope: `scripts/public-repo-analysis-smoke.sh`, `scripts/verify-release-evidence.sh`, `scripts/security-regression-check.sh`.
Non-goals: 不刷新 full release authority；不证明真实 LLM provider 输出质量；不做 HTTP 原始 body 抓包；不替代浏览器 report drawer smoke。
Acceptance: public repo smoke reportEvidenceQaCitationQuality 必须混合 `LINE_NUMBER` 与 `START_END_ONLY` 样本；START_END_ONLY request 不带 `lineNumber`、response 不合成 `lineNumber` 且 echo `startLine/endLine`；release verifier 强制 `MIXED_LINE_AND_START_END`、模式计数、bound 计数和每样本 shape；security regression 拒绝 line-only、缺 start/end-only、range miss、计数伪造等 forged marker；bash syntax、focused release marker regression、static security regression PASS；Data-AI 与 QA 只读复核 PASS。
Risks: 只有 public repo smoke 开启且有足够 report line-anchor candidates 时才证明该链路；本轮不宣称 provider factual quality 或全量仓库覆盖。
Dependencies: P6 Code QA evidenceRef startLine/endLine API citation binding, P11 release evidence verifier, public repo smoke.
Status: DONE / STATIC GATES PASS / DATA-AI+QA REVIEW PASS / FULL RELEASE AUTHORITY NOT REFRESHED
```

```text
ID: P6-CODEQA-EVIDENCE-REF-RANGE-CITATION-20260706
Title: Code QA evidenceRef startLine/endLine API citation binding
Priority: P1
Phase: P6 / P11
Track: Code QA citation trust / report evidence API contract / PRIMARY citation boundary
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 报告 evidenceRef 只提供 `start_line/end_line` 范围时，Code QA API 必须把范围命中的 chunk 标为 PRIMARY citation，并且不能让同文件但不重叠范围的 decoy 被答案引用。
Scope: `CodeQaControllerTest`.
Non-goals: 不重写控制器实现；不证明真实公开仓库 E2E、真实 LLM provider 输出质量或完整 provider raw evidence schema。
Acceptance: API 测试必须覆盖 snake_case `start_line/end_line` 入参、`sourceEvidenceRef.startLine/endLine` 出参、`REPORT_LINE_ANCHOR`、同文件非重叠 decoy 为 `ADJACENT_CONTEXT/citedByAnswer=false`、范围命中 chunk 为 `PRIMARY/citedByAnswer=true`；focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 当前仍是 MockMvc controller 回归，不替代真实 report evidence drawer -> QA citation browser smoke。
Dependencies: P6 Code QA controller citation response, evidenceRef line range support, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-EVIDENCE-RANGE-PAIR-BINDING-20260706
Title: Code QA structured evidence startLine/endLine pair binding
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / evidence citation trust / line range exact anchor control
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 当报告 evidence 使用 `startLine/endLine` 范围表达位置时，Code QA 必须把 filePath 与 line range 作为同一个 evidence object 绑定，不能跨 object 混拼出假 strict exact anchor。
Scope: `CodeLocationHintParser`, `CodeChunkRanker`, `CodeChunkRankerTest`.
Non-goals: 不新增真实公开仓库 E2E；不扩展所有 provider raw evidence schema；不刷新 full release authority。
Acceptance: 新增 line range mixed negative 和 paired positive；`startLine/endLine` 通过 parser 进入同一个 `EvidenceLocationHint`; focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 该切片证明 ranker strict exact-path 的 line range 绑定，不证明完整 Code QA answer quality 或真实 LLM provider 输出质量。
Dependencies: P6 structured evidence path-line pair binding, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-EVIDENCE-LOCATION-PAIR-BINDING-20260706
Title: Code QA structured evidence path-line pair binding for strict exact anchors
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / evidence citation trust / exact anchor false-positive control
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 当报告或 raw evidence 中有多个 location object 时，Code QA 不能把 A 对象的 filePath 和 B 对象的 lineNumber 拼接成假的 strict exact source anchor。
Scope: `CodeChunkRanker`, `CodeChunkRankerTest`.
Non-goals: 不改 JSON parser traversal；不实现完整 evidence object graph；不刷新真实公开仓库 E2E 或 full release authority。
Acceptance: `isExactPathLocationAnchorMatch(...)` 在存在 structured `EvidenceLocationHint` 时，必须要求同一个 hint 同时满足 path equals 和 line range 覆盖；新增负例证明 path-line 交叉绑定被拒绝，正例证明同 object path-line 成对命中仍通过；focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 该修复只覆盖 strict exact-path 判定；宽松 exact-location、score 加权和更多复杂 evidence schema 仍需后续 P6 corpus 扩展。
Dependencies: P6 root-relative sourceUrl exact anchor hardening, structured evidence location parser, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-ROOT-RELATIVE-SOURCE-ANCHOR-20260706
Title: Code QA root-relative sourceUrl exact anchor over package suffix
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / source evidence path disambiguation / monorepo package suffix decoy control
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 报告证据指向仓库根目录相对 `src/pages/Login.tsx#L44` 时，`packages/admin/src/pages/Login.tsx` 这类 package suffix decoy 不能被当作同等 exact source evidence 并抢占首位。
Scope: `CodeQaRetrievalService`, `CodeChunkRanker`, `CodeQaRetrievalServiceTest`, `CodeChunkRankerTest`, `p6-code-qa-retrieval-eval-cases.json`.
Non-goals: 不实现完整 provider metadata/file index resolver；不改变 `feature/apps/client/...` 这类 app-root ambiguity 的既有解析和回退行为；不刷新 full release authority。
Acceptance: 当真实 root-relative `src/...` exact path anchor 存在时，suffix decoy 只能保留弱/宽松信号，不能作为 strict exact path anchor；新增 service/ranker/eval 三层回归；旧 app-root sourceUrl eval case 继续存在并通过；focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 多个 evidence location hint 混杂时，当前 exact path 判断仍是 path equals + 任一 line hint 覆盖，不是严格同一 evidence object path-line 成对绑定；后续 P6 需要继续收敛。
Dependencies: P6 sourceUrl evidence anchors, generated/archive decoy hardening, P11 fixed retrieval eval gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-KOTLIN-OBJECT-HOLDER-CONSTANTS-20260706
Title: code_chunks Kotlin object route holder constants
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Kotlin Spring route parser / QA citation trust
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: Kotlin 项目常用 `object ApiConstants { const val LOGIN = ... }` 保存 route；SourceLens 必须能把 `@GetMapping(ApiConstants.LOGIN)` 定位到正确 GET Controller，而不是被同路径 POST literal 抢占。
Scope: `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不实现完整 Kotlin parser、import resolver、完整 Spring route graph 或真实公开仓库 E2E。
Acceptance: Kotlin `object` 被识别为 class-like declaration container；`ApiConstants.LOGIN` qualified key 可从 external holder context 解析；SQL candidate 必须证明包含 `ApiConstants.kt`；focused/backend full/static/schema gates PASS；Data-AI/QA review PASS。
Risks: 仍是 bounded parser；不覆盖所有 Kotlin object/companion edge cases、嵌套 object、import alias 或动态 route expression。
Dependencies: P6 bounded cross-file route holder constants, P6 API/URL route holder filename expansion, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-CANDIDATE-ROUTE-HOLDER-CONSTANTS-20260706
Title: code_chunks bounded cross-file route holder constants
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route parser / QA citation trust
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 真实 Spring 仓库常把 route 常量放在 `AuthRoutes.java`、`ApiPaths.java` 或 `Endpoints.kt` 这类 holder 文件；当 Controller 写 `@GetMapping(AuthRoutes.LOGIN)` 时，检索必须能定位正确 GET handler，而不是被同路径 POST literal 或无关 simple-name constant 抢占。
Scope: `CodeChunkService`, `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不实现全库 AST、import resolver、完整 Spring route graph、任意跨文件常量解析或真实公开仓库 E2E。
Acceptance: endpoint route candidate pool 纳入 bounded route holder 文件名；外部 holder 只提供 qualified constants；simple-name fallback 继续禁止；route holder context 限 24 chunks / 24k chars 并有 focused 回归证明；focused/backend full/static/schema gates PASS；Data-AI 与 QA review PASS。
Risks: `Routes/Paths/Endpoints` 文件名启发式不能覆盖所有团队命名；候选池外 holder 不解析；复杂表达式、跨模块 import 和动态 route 仍需后续 P6/P12-pre 增强。
Dependencies: P6 qualified route constants, P6 previous same-file context, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-API-URL-HOLDER-NAMES-20260706
Title: code_chunks API/URL route holder filename expansion
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / route holder recall / false-positive control
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 真实 Java/Spring 项目常用 `ApiConstants.java`、`UrlConstants.java`、`Paths.java` 或 `Endpoints.java` 保存接口路径；SourceLens 需要在不放开 generic constants 的前提下召回这些 holder，提升 Code QA 对 Controller route 的定位质量。
Scope: `CodeChunkService`, `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不把所有 `Constants.java` 纳入 route holder；不解析 import；不做完整 route graph；不刷新 full release authority。
Acceptance: endpoint route candidate SQL 覆盖 ApiConstants/UrlConstants/UriConstants/ApiUrls/ApiUris/Paths/Endpoints Java holder；ranking 能通过这些 holder 解析 qualified constants；普通 `Constants.java` 与 `SecurityConstants.java` 不得被误当 route holder；focused/backend full/static/schema gates PASS；Data-AI/QA review PASS。
Risks: Kotlin 变体已在候选 SQL 中，但 focused ranking 循环优先验证 Java 文件名；更广泛团队命名仍需真实公开仓库样本继续扩充。
Dependencies: P6 bounded cross-file route holder constants, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-PUBLIC-REPO-REPORT-EVIDENCE-QA-REASON-GATE-20260706
Title: Public repo report evidence QA citation reason release gate
Priority: P1
Phase: P6 / P11
Track: report evidence QA citation / release evidence verifier / machine-readable reason gate
Owner: 达里奥 / 拉里佩奇 / 梁文峰 / 特朗普
User value: 真实 public repo 报告证据 QA marker 不能只证明 citation enforcement status，还必须证明机器可读 reason code；否则 release evidence 可能绕过 `citationEnforcementReason` 断链，前端和发布门禁无法稳定区分 direct/retry/fallback 成功原因。
Scope: `scripts/public-repo-analysis-smoke.sh`, `scripts/verify-release-evidence.sh`, `scripts/security-regression-check.sh`, `PROJECT_CODE_MAP`.
Non-goals: 不刷新 full release authority；不运行真实 public repo smoke；不改变 Code QA API contract、DB schema、LLM provider 或前端 UI。
Acceptance: `PUBLIC_REPO_REPORT_EVIDENCE_QA_MULTI_ANCHOR` 必须输出 top-level `citationEnforcementReasons`；每个 sample 必须输出 `citationEnforcementReason`；release verifier 必须强校验 reason code 只允许 `DIRECT_VERIFIED`、`RETRY_VERIFIED`、`FALLBACK_PRIMARY_CITED`，且 top-level reason set 必须精确等于 sample reason set；security regression 必须包含合法样本、缺失 reason code forged marker 负例和 top-level/sample reason mismatch 负例；static security regression、bash syntax、DB schema contract、code-map 和 scoped whitespace PASS；Quality Gate review PASS。
Risks: 该门禁证明 release evidence marker 合同，不证明真实 LLM 质量、真实 provider 可用性或 full public repo run 已刷新。
Dependencies: P6 report evidence QA citation, P11 release evidence verifier, security regression suite.
Status: DONE / STATIC GATES PASS / QUALITY GATE REVIEW PASS
```

```text
ID: P6-CODEQA-SOURCE-EVIDENCE-HOSTED-APP-ROOT-MATCH-20260706
Title: Code QA hosted app-root source evidence match without suffix decoy ambiguity
Priority: P1
Phase: P6 / P11
Track: Code QA source evidence trust / report evidence QA citation / hosted URL normalization
Owner: 拉里佩奇 / 梁文峰 / 比尔盖茨 / 特朗普
User value: 报告证据追问从 GitHub hosted URL 跳到 QA 时，API 层不能因为 `apps/client/src/pages/Login.tsx` 与 `client/src/pages/Login.tsx` 同时 suffix match 而把真实证据判成歧义失败；否则报告引用质量和 QA citation 可信度会在 monorepo 场景下退化。
Scope: `CodeQaController`, `CodeQaControllerTest`, `PROJECT_CODE_MAP`.
Non-goals: 不实现完整 Git ref parser；不声明任意 branch name、任意托管平台或真实公开仓库 E2E 已完整覆盖；不改变 DB schema、LLM provider 或前端 UI。
Acceptance: `https://github.com/acme/source-lens/blob/feature/apps/client/src/pages/Login.tsx#L44` 必须归一化并匹配 `apps/client/src/pages/Login.tsx`；同时返回 `client/src/pages/Login.tsx` suffix decoy 时仍必须 `sourceEvidenceMatched=true`、`sourceEvidenceMatchType=REPORT_LINE_ANCHOR`、target chunk `contextRole=PRIMARY`、citation coverage `PRIMARY`；Vite URL、本地 URL、短路径 ambiguity fail-closed 和 `.sh?plain=1#L12` hosted URL 回归不得破坏；focused/backend/static/schema/code-map gates PASS；QA review PASS。
Risks: 这是 bounded hosted source URL source-root heuristic，不是完整 Git provider metadata resolver；复杂 branch path 仍需结合真实仓库 file index 或 provider metadata 做后续消歧。
Dependencies: P6 Code QA source evidence matching, P6 fixed retrieval eval feature branch app-root sample, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / QA REVIEW PASS
```

```text
ID: P6-CODEQA-RETRIEVAL-EVAL-GITHUB-SOURCE-URL-20260706
Title: Code QA fixed retrieval eval GitHub source URL evidence anchors
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / report evidence URL anchors / fixed golden regression
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 报告追问经常带 GitHub `blob` 或 `raw.githubusercontent.com` source URL；固定检索评估集必须覆盖 URL 行号锚点，防止系统只按 basename 命中同名旧文件或忽略 `#L245` 行号证据。
Scope: `p6-code-qa-retrieval-eval-cases.json`, `CodeQaRetrievalEvalCorpusTest`.
Non-goals: 不声明任意 GitHub URL/任意分支完整覆盖；不声明真实公开仓库检索 benchmark；不替代 CodeChunkService 候选扩展测试或 public repo E2E。
Acceptance: fixture 样本数提升到 8；新增 GitHub blob `filePath` 样本；新增 raw.githubusercontent.com `sourcePath` 样本；两个样本必须带 same-name legacy decoy、Dashboard decoy 和 docs 噪声；`minCaseCount=8`；`evaluationScope=fixed_golden_regression` 和 `benchmarkClaim=false` 保持；focused/backend/static/schema gates PASS；Data-AI review PASS。
Risks: 两个样本同构度较高，主要证明常见报告 URL 证据回归边界；任意分支、任意托管平台和真实仓库泛化仍需后续样本与 E2E。
Dependencies: P6 fixed retrieval eval corpus, CodeLocationHintParser hosted source URL normalization, CodeQaRetrievalService.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI REVIEW PASS
```

```text
ID: P6-CODEQA-RETRIEVAL-EVAL-FEATURE-APP-ROOT-SOURCE-URL-20260706
Title: Code QA fixed retrieval eval feature branch app-root source URL anchors
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / monorepo app-root source URL / fixed golden regression
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 上一轮 GitHub URL 样本集中在同一个 `ProjectDetail.tsx#L245`；本轮增加 feature branch + `apps/client` app-root 样本，防止 fixed eval 过度同构，并覆盖 monorepo 中 `client/src/...` suffix decoy、`packages/admin/...` 同名页面和 docs 噪声。
Scope: `p6-code-qa-retrieval-eval-cases.json`, `CodeQaRetrievalEvalCorpusTest`.
Non-goals: 不声明精确解析任意含 slash 的 Git branch；不声明任意托管平台/任意 URL 泛化；不替代真实 public repo E2E。
Acceptance: fixture 样本数提升到 9；新增 `github-feature-branch-app-root-source-url-over-suffix-decoy`；metrics 必须声明 9 个 required case ids 并由 evaluator 强制校验；`minCaseCount=9`；focused/backend/static/schema gates PASS；Data-AI review PASS。
Risks: 当前 feature branch URL 依赖源码根/app-root 启发式归一化，不等于完整 Git ref parser；后续应补 feature branch slash disambiguation、archive app-root decoy 和真实仓库 E2E。
Dependencies: P6 fixed retrieval eval corpus, CodeLocationHintParser hosted source URL app-root fallback, CodeChunkRanker moduleRoot/path evidence scoring.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI REVIEW PASS
```

```text
ID: P6-CODEQA-RETRIEVAL-EVAL-METRICS-GATE-20260706
Title: Code QA fixed retrieval eval metrics gate
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / fixed eval metrics / regression gate
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 固定检索评估集需要有量化阈值，而不仅是逐样本断言；后续 ranking 改动必须同时满足 Recall@4 和 MRR@4 的最低门槛。
Scope: `p6-code-qa-retrieval-eval-cases.json`, `CodeQaRetrievalEvalCorpusTest`.
Non-goals: 不声明真实项目检索质量 benchmark；不证明真实 embedding provider 质量；不替代 public repo E2E。
Acceptance: fixture 必须声明 `metrics.topK/minCaseCount/minRecallAtK/minMrrAtK`；evaluator 必须计算平均 Recall@K 和 MRR@K 并按阈值 fail closed；focused/backend/static/schema gates PASS；Data-AI review PASS。
Risks: 当前 `MRR@4=1.0` 与 first path 逐样本断言有重叠，更多是未来扩展钩子；指标只适用于当前固定合成 corpus。
Dependencies: P6 fixed offline retrieval eval corpus, CodeQaRetrievalService, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI REVIEW PASS
```

```text
ID: P6-CODEQA-ROUTE-STRONG-WEAK-SPLIT-20260706
Title: Code QA endpoint route strong/weak retrieval split
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval / semantic fallback / route false-positive control
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: Project QA 问 endpoint route 时，docs/prose 裸提 route、单独 route holder 或无关 source 不能关闭 semantic fallback；只有真实 Spring mapping route 命中才可作为足够强的 route-aware retrieval 证据。
Scope: `CodeChunkRanker`, `CodeQaRetrievalService`, `CodeQaRetrievalServiceTest`.
Non-goals: 不实现完整 route graph、import resolver、真实 public repo E2E 或真实 LLM provider quality proof。
Acceptance: `RouteAwareScoredChunk` 区分 `strongEndpointRouteMatch` 与 `springMappingRouteMatch`; Code QA 只有存在 Spring mapping route match 时才返回 route-aware keyword candidates；endpoint semantic keyword score 只给 Spring mapping route 加分；docs route mention 和 holder+unrelated source 反例均由 focused tests 覆盖；focused/backend full/static/schema/code-map gates PASS；Data-AI/QA review PASS。
Risks: 该策略偏向“回答处理器/实现位置”而非单独 route holder；若用户明确询问 route constants 文件，后续可增加 intent 分支。
Dependencies: P6 route-holder-aware retrieval, P6 fixed retrieval eval corpus, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-CITATION-EXAMPLE-FORMAT-FALSE-POSITIVE-20260706
Title: Code QA citation example/format false-positive control
Priority: P1
Phase: P6 / P11
Track: Code QA citation trust / claim audit sanitizer / report evidence quality
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: Code QA 真实回答中出现 `ExampleService`、`FormatParser`、`example-service.ts` 或普通 `Resource example` 代码事实时，不应被 citation format/example 噪声过滤误删，否则会把有引用的有效回答误判为 UNVERIFIED。
Scope: `CodeQaController`, `CodeQaControllerTest`.
Non-goals: 不实现完整 NLP 语义分类器；不重构 citation audit 全链路；不刷新 full release authority。
Acceptance: 保留真实代码名和文件名中的 `Example/Format/example/format`；保留普通 `Resource example... [C3]` 事实句；继续过滤 `Example:`、`Format:`、`Citation format:`、`reference format`、`source example` 等真正引用格式示例噪声；focused tests、Code QA suite、backend full test、static security regression、DB schema contract、QA review PASS。
Risks: 仍是 bounded regex sanitizer；更广泛自然语言 citation 示例需要后续 eval corpus 约束。
Dependencies: P6 Code QA citation parser, P6 claim citation coverage, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / QA REVIEW PASS
```

```text
ID: P6-CODEQA-ROUTE-HOLDER-AWARE-RETRIEVAL-20260706
Title: Code QA route-holder-aware endpoint retrieval
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval / code_chunks parity / QA citation trust
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: Project QA 问 `GET /api/auth/login` 时必须复用 code_chunks route holder context，让 `@GetMapping(ApiRoutes.Auth.LOGIN)` 排在同路径 POST literal 之前，避免 code search 已修但 QA 检索仍错引用。
Scope: `CodeQaRetrievalService`, `CodeChunkRanker`, `p6-code-qa-retrieval-eval-cases.json`, `CodeQaRetrievalServiceTest`, `CodeQaRetrievalEvalCorpusTest`.
Non-goals: 不实现完整 Kotlin parser、import resolver、真实 public repo E2E、完整 LLM provider quality proof 或完整 route graph。
Acceptance: endpoint route question 走 `CodeChunkRanker.rankWithPreviousSameFileContextScores`; fixed eval corpus 增加 nested Kotlin route holder case；旧实现 red 返回 POST decoy；新实现 target GET Controller first；route-aware 候选必须保留原始分数并只接收 `>=150` 的真实 route-aware 命中，避免 synthetic score 吞掉 semantic fallback；focused/backend full/static/schema/code-map gates PASS；Data-AI/QA review PASS。
Risks: `>=150` 仍接收弱 route mention 档位；后续可继续区分强 route 命中与 docs/comment 裸 route 提及。one-line/minified Kotlin const parser 未在本轮修复。
Dependencies: P6 nested Kotlin route holder constants, P6 fixed retrieval eval corpus, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-RETRIEVAL-FIXED-EVAL-CORPUS-20260706
Title: Code QA fixed offline retrieval evaluation corpus
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / fixed eval corpus / regression gate
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: P6 不能只靠单点回归测试判断检索质量；需要一套固定、离线、可重复的 eval corpus，防止后续 ranking 调整破坏中文接口定位、弱关键词语义召回、路径行号锚点和跨文件证据保留。
Scope: `p6-code-qa-retrieval-eval-cases.json`, `CodeQaRetrievalEvalCorpusTest`.
Non-goals: 不替代真实公开仓库 E2E；不声明真实 embedding provider 质量；不引入新 DB schema、向量数据库或外部网络依赖。
Acceptance: fixture 至少覆盖 4 个核心 P6 检索场景；JUnit evaluator 必须读取 fixture 并执行 `CodeQaRetrievalService`; 断言 first path、included paths、first startLine 和 per-path cap；同时校验 case id 唯一、必填字段和 expectedIncludedPaths 非空；focused/backend/static/schema gates PASS；Data-AI review PASS。
Risks: 第一版是离线合成 corpus，不能代表所有真实仓库；后续需要持续扩充真实公开仓库样本和性能基准。
Dependencies: P6 code_chunks retrieval, CodeQaRetrievalService, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI REVIEW PASS
```

```text
ID: P6-CODEQA-CITATION-RANGE-MAX-SIZE-OFF-BY-ONE-20260706
Title: Code QA citation range max-size off-by-one guard
Priority: P1
Phase: P6 / P11
Track: Code QA citation trust / range parser / overclaim prevention
Owner: 拉里佩奇 / 比尔盖茨 / 梁文峰 / 特朗普
User value: LLM 输出 `[C1-C51]` 这类大范围 citation 时，不能因为 off-by-one 允许超过上限的证据批量覆盖，避免一次性伪引用过多 code_chunks。
Scope: `CodeQaController`, `CodeQaControllerTest`.
Non-goals: 不改变 citation range 语法；不改变 API contract；不刷新 full release authority。
Acceptance: `ANSWER_CITATION_MAX_RANGE_SIZE = 50` 必须表示包含端点后最多 50 个 label；`[C1-C50]` 有效；`[C1-C51]` 整体拒绝且不退化为 `C1/C51` 普通 token；原有 `[C1-C2]` 与 reversed range 回归保持；focused/backend/static/schema gates PASS；QA review PASS。
Risks: 当前仍是 bounded parser，不支持复杂 range 表达式或跨 block 语法；范围上限是产品策略，不代表所有场景都应鼓励大范围 citation。
Dependencies: P6 Code QA citation parser, P6 claim coverage, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / QA REVIEW PASS
```

```text
ID: P6-CODEQA-MARKDOWN-REFERENCE-IMAGE-CITATION-FILTER-20260706
Title: Code QA Markdown reference image citation filter
Priority: P1
Phase: P6 / P11
Track: Code QA citation trust / Markdown sanitizer / hidden citation false-positive control
Owner: 拉里佩奇 / 比尔盖茨 / 梁文峰 / 特朗普
User value: LLM 回答如果只在 Markdown 图片 alt 文本中放 `[C1]`，系统不能把它当作正文代码事实引用；否则截图/图示语法会伪造 Code QA verified 状态。
Scope: `CodeQaController`, `CodeQaControllerTest`.
Non-goals: 不实现完整 Markdown renderer；不移除普通 Markdown link label 中的可见 citation；不改变 citation API contract。
Acceptance: `![... [C1]][id]` 和 `![... [C1]](...)` 中的 citation 不计入 auditable answer；reference definition 在 URL 清理后不会变成 `auth` 等代码事实 claim；普通 link label `[AuthService [C1]](...)` 保持有效；focused Markdown tests、Code QA suite、backend full test、static security regression、DB schema contract、QA review PASS。
Risks: 这是 bounded Markdown sanitizer，不覆盖所有 Markdown dialect 或 HTML rendering 差异；复杂嵌套 image/link 仍需后续 eval corpus。
Dependencies: P6 Code QA citation audit, P6 Markdown link destination filtering, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / QA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-QUALIFIED-ROUTE-CONSTANTS-20260706
Title: code_chunks qualified Spring route constants across previous chunk context
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Spring route parser / QA citation trust
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 真实 Spring 仓库常把 route 写成 `Routes.AUTH + Routes.LOGIN`，且常量与方法可能被切在相邻 code_chunks 中；检索必须能命中正确 GET Controller，不能被 POST 字面量 route 或同名非 route holder 抢占。
Scope: `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不实现跨文件常量解析；不实现完整 Java AST；不刷新 full release authority。
Acceptance: previous same-file context 中的 qualified route constants 可解析；qualified expression 不再 fallback 到 simple name；simple key 碰撞时 qualified key 仍独立注册；HTTP method mismatch gate 不削弱；backend full test、retrieval tests、static security regression、DB schema contract、code-map 和 Data-AI/QA review PASS。
Risks: 仍是 bounded parser；只覆盖同一 class range / previous same-file context；跨文件 route holder 仍是后续 P6 深化项。
Dependencies: P6 code_chunks route ranking, P6 previous same-file context, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-RETRIEVAL-EVAL-REALISTIC-CASES-20260706
Title: Code QA fixed retrieval eval realistic case expansion
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / fixed golden regression / benchmark-claim control
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 固定离线 retrieval eval 不能只停留在最小合成样本；需要纳入更贴近真实报告追问的 Vite source URL 行号定位和 raw JSON handler_class/handler_method 定位，并明确该 corpus 只是固定回归门禁，不是泛化 benchmark。
Scope: `p6-code-qa-retrieval-eval-cases.json`, `CodeQaRetrievalEvalCorpusTest`.
Non-goals: 不声明真实公开仓库检索 benchmark；不证明真实 embedding provider 质量；不替代 public repo E2E 或性能评估。
Acceptance: fixture 样本数提升到 6；新增 Vite source URL same-name decoy 样本；新增 raw JSON handler_class/handler_method same-controller decoy 样本；metrics 必须声明 `evaluationScope=fixed_golden_regression` 和 `benchmarkClaim=false` 并由 evaluator 强制校验；Recall@4/MRR@4 阈值保持通过；focused/backend/static/schema gates PASS；Data-AI 二轮 review PASS。
Risks: 新样本仍接近已有 service 单测，主要价值是固定金丝雀回归；后续还需要真实公开仓库样本和端到端报告追问证据。
Dependencies: P6 fixed offline retrieval eval corpus, CodeQaRetrievalService, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI REVIEW PASS
```

```text
ID: P6-CODEQA-ROUTE-CONSTANT-INTENT-20260706
Title: Code QA explicit route constants intent over default endpoint handler retrieval
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / route constants intent / endpoint handler false-positive control
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 当用户明确问“GET /api/... 路由常量在哪定义”时，Code QA 应优先给出 ApiRoutes/Constants holder；但普通 “Which API route handles GET ...” 仍必须优先返回 Controller/handler，不能被 constants holder boost 抢占。
Scope: `CodeQaRetrievalService`, `CodeQaRetrievalServiceTest`, `p6-code-qa-retrieval-eval-cases.json`.
Non-goals: 不实现完整 route graph、import resolver、跨文件 AST 或真实 public repo E2E；不把普通 `api route` 文案当作 route constants intent。
Acceptance: route constants intent 只由 `route constant/holder/apiroutes/* constant/路由常量/常量在哪/在哪定义+常量` 等明确表达触发；handler/controller/handles/处理/入口/控制器意图必须排除 constants boost；fixed eval 必须包含 handler API route wording 负向保护；focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 仍是 bounded natural-language intent heuristic；未来需要用真实 Code QA session 与 public repo report follow-up 样本继续扩充意图语料。
Dependencies: P6 endpoint route strong/weak split, route-holder-aware ranking, P11 regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-APP-ROOT-ARCHIVE-DECOY-20260706
Title: Code QA hosted app-root sourceUrl archive decoy hardening
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / source evidence path disambiguation / monorepo app-root decoy control
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 报告证据指向 `apps/client/src/api/index.ts` 时，归档目录 `archive/apps/client/src/api/index.ts` 不能通过 suffix 匹配伪装成 exact source evidence，也不能靠关键词堆叠抢占首位。
Scope: `CodeLocationHintParser`, `CodeChunkRanker`, `CodeQaRetrievalServiceTest`, `CodeChunkRankerTest`, `p6-code-qa-retrieval-eval-cases.json`.
Non-goals: 不实现完整 provider metadata/file index resolver；不改变 `src/...`、`web-console/...` 既有 suffix 兼容合同；不刷新 full release authority。
Acceptance: protected module-root hints `apps/packages/services/modules/libs` 不生成更短模糊 suffix；archive module-root suffix 不得被判为 exact anchor；fixed eval 必须加入 archive decoy required case；focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 当前仍是 bounded path heuristic；真实 provider metadata、workspace graph 和 file index 消歧仍是后续 P6 深化项。
Dependencies: P6 sourceUrl evidence anchors, moduleRootHintScore, P11 fixed retrieval eval gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODECHUNKS-ONELINE-KOTLIN-ROUTE-CONSTANTS-20260706
Title: code_chunks one-line nested Kotlin route constants
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval / Kotlin route parser / QA citation trust
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: Kotlin Spring 项目可能把 route holder 压缩成 `object ApiRoutes { object Auth { const val LOGIN = "/api/auth/login" } }`；检索必须能解析 `ApiRoutes.Auth.LOGIN`，让 GET Controller 优先于同路径 POST 字面量 decoy。
Scope: `CodeChunkRanker`, `CodeChunkServiceTest`.
Non-goals: 不实现完整 Kotlin AST；不解析 import alias、函数调用、动态 route expression 或完整 route graph；不刷新 full release authority。
Acceptance: one-line nested Kotlin object 解析出 `LOGIN`、`Auth.LOGIN`、`ApiRoutes.Auth.LOGIN`；`searchChunks` 证明 `ApiRoutes.kt` 进入候选、GET target first、route holder included、POST literal decoy 不抢首位；focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 仍是 bounded regex/parser heuristic；holder 识别仍基于文件名+内容特征，不能宣称整体无假阳性。
Dependencies: P6 Kotlin route holder constants, P6 Code QA route-aware retrieval, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-GENERATED-SUFFIX-DECOY-20260706
Title: Code QA generated suffix source evidence decoy hardening
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / source evidence path disambiguation / generated artifact decoy control
Owner: 梁文峰 / 拉里佩奇 / 比尔盖茨 / 特朗普
User value: 报告证据指向真实源码 `packages/admin/src/pages/Login.tsx` 时，`generated/packages/admin/src/pages/Login.tsx` 不能通过 suffix 匹配伪装成 exact source evidence，也不能靠噪声关键词抢首位。
Scope: `CodeChunkRanker`, `CodeQaRetrievalServiceTest`, `CodeChunkRankerTest`, `p6-code-qa-retrieval-eval-cases.json`.
Non-goals: 不实现完整 provider metadata/file index resolver；不覆盖所有生成目录命名如 `dist/build/out`；不禁止真实非 generated suffix 兼容；不刷新 full release authority。
Acceptance: generated/noise path 不继承 source evidence suffix/exact；generated middle path score 为 0；真实 target exact=true；service test 和 fixed eval 均证明 generated decoy 不抢首位；focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: generated decoy 仍可能获得 basename、关键词、line hint 等弱信号；当前只保证不继承 exact/suffix evidence 且不抢本轮样本首位。
Dependencies: P6 sourceUrl evidence anchors, generated/noise path scoring, P11 fixed retrieval eval gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-HOSTED-BRANCH-STRONG-ROOT-AMBIGUITY-20260706
Title: Code QA hosted sourceUrl branch-derived strong-root ambiguity hardening
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / hosted sourceUrl disambiguation / fixed eval corpus
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 当 GitHub hosted sourceUrl 使用 arbitrary branch 且 branch 第一段后紧贴 `web-console` 等 strong root 名称时，系统不能把 branch 名误判为源码根，导致 `web-console/src/index.ts` 抢占真实 `src/index.ts`。
Scope: `CodeLocationHintParser`, `CodeLocationHintParserTest`, `CodeQaRetrievalServiceTest`, `p6-code-qa-retrieval-eval-cases.json`.
Non-goals: 不实现 GitHub provider branch metadata 查询；不宣称所有 arbitrary branch URL 均可无歧义还原；不刷新 full release authority。
Acceptance: `feature/web-console/src/index.ts` 保守降级为 `src/index.ts`；`feature/code-review/web-console/...` 仍识别真实 strong root；`master` 默认分支保持兼容；retrieval service 证明 root-relative target 优先于 branch-derived strong-root decoy；fixed eval corpus 新增 required case 且 `minCaseCount=17`；focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 单段 branch `feature` + 真实 `web-console/...` 与多段 branch `feature/web-console` + 真实 `src/...` 仅凭 URL 无法完全区分；后续仍需要 provider metadata/file index resolver。
Dependencies: hosted sourceUrl parser, P6 fixed retrieval eval corpus, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-SOURCEROOT-METADATA-FILE-INDEX-RESOLVER-20260706
Title: Code QA sourceRoot metadata-aware hosted sourceUrl file-index resolver
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / provider metadata disambiguation / fixed eval corpus
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 上一轮把 `feature/web-console/src/index.ts` 保守降级到 `src/index.ts`；但当报告/provider 明确给出 `sourceRoot: web-console`、`workspaceRoot` 或 `moduleRoot` 时，系统必须能用该元数据把同名文件重新消歧到 `web-console/src/index.ts`。
Scope: `CodeLocationHintParser`, `CodeChunkRanker`, `CodeQaRetrievalService`, `CodeLocationHintParserTest`, `CodeQaRetrievalServiceTest`, `p6-code-qa-retrieval-eval-cases.json`.
Non-goals: 不接入 GitHub API 查询 branch；不构建完整 workspace graph；不声明任意用户输入的 `sourceRoot` 均可信；不刷新 full release authority。
Acceptance: parser 提取 `sourceRoot/source_root/workspaceRoot/workspace_root/moduleRoot/module_root`；拒绝 `src`、`../bad` 等非可信 root；retrieval 仅在 root 匹配且 exact location anchor 成立时给 sourceRoot metadata boost；无 `sourceRoot` 的保守降级负例仍保留；fixed eval corpus 新增 required case 且 `minCaseCount=18`；focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 当前仍要求 chunk path/root metadata 能表达同一 root；如果 file index 只存 module-local `src/index.ts` 并仅靠 metadata 表达归属，还需要下一轮虚拟全路径 resolver。
Dependencies: P6-CODEQA-HOSTED-BRANCH-STRONG-ROOT-AMBIGUITY-20260706, P6 fixed retrieval eval corpus, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-MODULE-LOCAL-SOURCEROOT-VIRTUAL-PATH-20260706
Title: Code QA module-local sourceRoot virtual path resolver
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / code_chunks root metadata / fixed eval corpus
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 真实 monorepo 索引可能把模块内文件存成 `filePath=src/index.ts`，只用 `workspaceRoot/moduleRoot=web-console` 表达归属；当报告证据有 `sourceRoot: web-console` 时，系统必须选中该 module-local chunk，而不是根目录或其他 package 的同 path chunk。
Scope: `CodeQaRetrievalService`, `CodeQaRetrievalServiceTest`, `CodeQaRetrievalEvalCorpusTest`, `p6-code-qa-retrieval-eval-cases.json`.
Non-goals: 不构建完整 workspace graph；不查询 provider branch metadata；不改变无 `sourceRoot` 时的保守降级；不刷新 full release authority。
Acceptance: `filePath=src/index.ts + workspaceRoot/moduleRoot=web-console` 可匹配 `sourceRoot: web-console`；同 path 根目录 decoy 与同 path `packages/admin` decoy 均不能进入最终 selected context；chunk 去重 key 必须包含 workspaceRoot/moduleRoot；eval harness 必须校验 expectedFirstWorkspaceRoot/moduleRoot；fixed corpus `minCaseCount=19` 并对齐 required ids；focused/backend/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 如果上游传入错误或陈旧 `sourceRoot`，metadata boost 会坚定选错；后续多 context diversity 仍需评估是否应按 virtual path 而非纯 filePath 分组。
Dependencies: P6-CODEQA-SOURCEROOT-METADATA-FILE-INDEX-RESOLVER-20260706, P6 fixed retrieval eval corpus, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-CODEQA-MODULE-LOCAL-VIRTUAL-PATH-DIVERSITY-20260706
Title: Code QA module-local virtual path context diversity
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval quality / context selection / fixed eval corpus
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 当多个模块都以 `filePath=src/index.ts` 存储时，Code QA 上下文不能因为裸 `filePath` 相同而只保留一两个模块；报告追问同时涉及 `web-console`、`packages/admin`、`apps/client` 时，三个 module-local exact anchors 必须同时进入 context。
Scope: `CodeQaRetrievalService`, `CodeQaRetrievalServiceTest`, `CodeQaRetrievalEvalCorpusTest`, `p6-code-qa-retrieval-eval-cases.json`.
Non-goals: 不改变 TOP_CONTEXT_LIMIT；不强制三个模块固定排序；不做完整 workspace/package graph；不刷新 full release authority。
Acceptance: context selection 使用 virtual file key 计数，module-local path 优先合成 `moduleRoot/filePath`，再退到 `workspaceRoot/filePath`；三个声明 root 的 `src/index.ts` 必须进入前三个 context；未声明 `packages/marketing` 同 path decoy 不能进入前三；eval corpus 新增 required case 且 `minCaseCount=20`；backend full/static/schema/code-map gates PASS；Data-AI 与 QA review PASS。
Risks: 多 root hint 同时出现会扩大 sourceRoot boost 召回；第 4 个 context 仍可能由 role diversity 补入噪声，需要后续 live evidence 观察。
Dependencies: P6-CODEQA-MODULE-LOCAL-SOURCEROOT-VIRTUAL-PATH-20260706, P6 fixed retrieval eval corpus, P11 backend regression gates.
Status: DONE / BACKEND FULL TEST PASS / STATIC GATES PASS / DATA-AI+QA REVIEW PASS
```

```text
ID: P6-P11-LIVE-PUBLIC-REPO-CODE-QA-EVIDENCE-20260707
Title: Live public repo Code QA evidence refresh
Priority: P1
Phase: P6 / P11
Track: public repo analysis / Code QA citation / release evidence verifier
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: 最近几轮 Code QA retrieval、weak keyword semantic fallback、claim citation boundary 和 report evidence QA citation 改动必须在真实公开 GitHub 仓库主链路上通过，而不是只依赖单测和离线 corpus。
Scope: `scripts/public-repo-analysis-smoke.sh`, `scripts/release-evidence.sh`, `scripts/verify-release-evidence.sh`, focused release evidence.
Non-goals: 不运行 public repo UI smoke；不刷新 full release authority；不修复本轮发现的 public repo marker security regression 卡死问题。
Acceptance: stable backend jar health UP；`Pawnshop-Management-System` live smoke PASS；focused release evidence required_failures=0 optional_warnings=0；`verify-release-evidence.sh` PASS；weak keyword eval 每个 case 显式绑定当前 scanTaskId；marker 不能包含 raw prompt/answer 或 provider quality 过度声明。
Risks: `release-verifier-public-repo-marker` 安全回归本轮卡在临时 verifier 子进程；focused evidence 不代表完整 release authority。
Dependencies: P6-CODEQA-MODULE-LOCAL-VIRTUAL-PATH-DIVERSITY-20260706, P11 release evidence verifier.
Status: DONE / LIVE SMOKE PASS / FOCUSED EVIDENCE VERIFIED / SECURITY REGRESSION FOLLOW-UP NEEDED
```

```text
ID: P11-RELEASE-VERIFIER-PUBLIC-REPO-MARKER-TIMEOUT-20260707
Title: release-verifier public repo marker timeout/process-group closure
Priority: P1
Phase: P11 / P6
Track: security regression / release evidence verifier / public repo marker gate
Owner: 奥特曼 / 拉里佩奇 / 特朗普
User value: `release-verifier-public-repo-marker` 必须稳定收尾，不能在 macOS Node fallback 路径留下 nested verifier 子进程，也不能把超时误判为成功。
Scope: `scripts/security-regression-check.sh`, focused security regression commands, P6 focused evidence verifier.
Non-goals: 不刷新 full release authority；不拆分整个 release verifier matrix；不证明被测命令 daemonize 脱组后仍可杀掉。
Acceptance: Node fallback 必须使用 detached process group；timeout 必须按进程组 SIGTERM/SIGKILL；exit code 124 必须 fail-closed；focused marker suite verbose/silent 均 PASS；结束后无相关残留进程；Security Engineer 复核 PASS。
Risks: suite runtime 仍约 4 分钟；本轮正常路径未动态触发 timeout branch。
Dependencies: P6-P11-LIVE-PUBLIC-REPO-CODE-QA-EVIDENCE-20260707, P11 release evidence verifier.
Status: DONE / FOCUSED SECURITY REGRESSION PASS / SECURITY REVIEW PASS
```

```text
ID: P6-STAGE-CLOSE-CODE-UNDERSTANDING-QA-CITATION-20260707
Title: P6 stage close for code understanding and QA citation trust
Priority: P1
Phase: P6
Track: code_chunks / cross-file retrieval / report citation / QA citation trust
Owner: 特朗普 / 拉里佩奇 / 梁文峰 / 奥特曼
User value: 把 P6 从连续 focused 修复收束为阶段可验收状态，明确哪些证据足够、哪些边界后置，避免无限小修拖住 P9/P11 主线。
Scope: P6 focused evidence, fixed retrieval eval corpus, public repo marker regression, stage close docs, code map sync.
Non-goals: 不刷新 full release authority；不宣称真实 LLM provider、全局 RAG benchmark、GitHub App/Webhook E2E、生产部署、灾备恢复或回滚签署。
Acceptance: focused evidence verified；fixed eval corpus PASS；public repo marker regression PASS；code map check PASS；QA 只读复核打回项关闭；风险/质量/交接/阶段要求同步。
Risks: focused evidence 不能冒充 full authority；P9 UI 和 P11 suite runtime cost 继续后置推进。
Dependencies: P6-P11-LIVE-PUBLIC-REPO-CODE-QA-EVIDENCE-20260707, P11-RELEASE-VERIFIER-PUBLIC-REPO-MARKER-TIMEOUT-20260707.
Status: DONE / STAGE CLOSE ACCEPTED / PARTIAL AUTHORITY
```

```text
ID: P9-APP-SHELL-TOPBAR-AUXILIARY-RESPONSIVE-CONTRACT-20260707
Title: App shell topbar auxiliary responsive contract
Priority: P1
Phase: P9 / P11
Track: frontend product UI / responsive readability / app shell regression
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 页面顶部标题、说明、环境、端口和用户信息不能互相挤压；桌面端辅助信息必须可读，移动端辅助信息必须折叠，避免顶部文字裁切和横向溢出。
Scope: `web-console/src/styles/app.css`, `web-console/tests/app-shell-ui-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9 docs.
Non-goals: 不重做全站视觉语言；不覆盖所有局部页面 action row；不刷新 full release authority；不改变认证或用户菜单业务逻辑。
Acceptance: `.sl-topbar-username` 不得使用 ellipsis/overflow hidden；桌面端 env/ports/username 可见且不裁切；320px 移动端 env/ports/username 折叠且 user button 保持紧凑；static UI gate、frontend build、app-shell smoke PASS；Frontend Engineer 复核 PASS。
Risks: 该门禁覆盖 app shell，不等于 P9 全站 UI 完成；后续仍需治理报告、审计、任务、产物和模型配置页面的局部密度与状态面。
Dependencies: P6-STAGE-CLOSE-CODE-UNDERSTANDING-QA-CITATION-20260707, P9 frontend design system.
Status: DONE / STATIC+SMOKE+BUILD PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-REPORT-EVIDENCE-REPAIR-GATE-REASON-VISIBILITY-20260707
Title: Report evidence repair gate reason visibility
Priority: P1
Phase: P9 / P11
Track: report experience / QA citation handoff / AutoRepair safety UX
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 报告证据抽屉中，用户必须看见修复候选为何开放或被阻断，不能只依赖 disabled button、hover title 或隐含文案。
Scope: `ScanTaskDetail.tsx`, `app.css`, `report-evidence-drawer-smoke.spec.ts`, `validate-frontend-ui.mjs`, P9 docs.
Non-goals: 不改变 AutoRepair 后端生成逻辑；不声明真实 patch 质量；不治理全站所有 disabled action；不刷新 full release authority。
Acceptance: READY action rail 显示修复门禁已开放和开放条件，且修复按钮显式 enabled；GAP/REVIEW action rail 显示修复门禁未开放和阻断原因；门禁说明可换行、不裁切；report evidence drawer smoke 覆盖 READY/GAP 并输出 `readyRepairActionEnabled=true`、`repairGateReasonVisible=true`；static UI gate、frontend build、smoke PASS；Frontend Engineer 只读复核 PASS。
Risks: 如果后续新增其他 action rail，仍需单独纳入可见阻断原因合同。
Dependencies: P9-APP-SHELL-TOPBAR-AUXILIARY-RESPONSIVE-CONTRACT-20260707, P9 frontend design system, report evidence drawer smoke.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-SCAN-CODE-KNOWLEDGE-GATE-REASON-VISIBILITY-20260707
Title: ScanTaskDetail code knowledge gate reason visibility
Priority: P1
Phase: P9 / P6 / P11
Track: frontend product experience / ScanTaskDetail / code_chunks readiness / blocked action readability
Owner: 扎克伯格 / 梁文峰 / 特朗普
User value: 扫描报告详情页不能只把“代码问答/检索切片”按钮置灰。code_chunks 状态读取失败、code_chunks 为 0 或可用时，用户必须直接看到门禁是否开放、为什么开放/阻断、下一步该做什么。
Scope: `web-console/src/pages/ScanTaskDetail.tsx`, `web-console/src/styles/app.css`, `web-console/tests/p9-main-path-recoverable-error-states-batch4a.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9 docs.
Non-goals: 不改变 code_chunks 后端检索、QA 质量、真实 LLM/embedding provider、scan execution、release authority 或全站所有 disabled action。
Acceptance: CodeKnowledgePanel 渲染 `代码知识库操作门禁说明` visible note；ready/error/zero-chunk 三态均有明确原因；code knowledge 指标格和门禁说明可换行、不省略、不隐藏；batch4A smoke 覆盖 1440/390/320 视口、blocked/ready 两态和 grid style；static UI gate、frontend build、focused smoke PASS；Frontend Engineer 只读复核 PASS。
Risks: 该切片只覆盖 ScanTaskDetail code knowledge 区域；不代表全站 P9、public repo UI smoke、真实生产数据或 full release authority 完成。
Dependencies: P9-PROJECT-QA-AGENT-HANDOFF-GATE-REASON-VISIBILITY-20260707, P6 code_chunks readiness, P9 batch4A recoverable smoke.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P11-SECURITY-REGRESSION-NODE-TIMEOUT-MICRO-PROBE-20260707
Title: security regression Node fallback timeout micro-probe
Priority: P1
Phase: P11 / P10
Track: security regression / timeout fallback / process cleanup
Owner: 黄仁勋 / 奥特曼 / 特朗普
User value: macOS Node fallback timeout 不能只靠静态代码审查；必须有快速动态探针证明 timeout fail-closed 并清理 nested child process group。
Scope: `scripts/security-regression-check.sh`, P11 docs.
Non-goals: 不优化 public repo marker suite 4 分钟 runtime；不证明 daemonized/setsid 脱组进程可被清理；不刷新 full release authority。
Acceptance: 默认仍优先 `timeout/gtimeout`；显式 `SOURCELENS_SECURITY_REGRESSION_FORCE_NODE_TIMEOUT=true` 才强制 Node fallback；内部 timeout probe 必须显式启用且要求 PID 文件；`integration-drill` 必须触发 timeout、检查 timeout 输出、确认 nested child 不残留；bash syntax、integration-drill、static gates PASS；DevOps 只读复核 PASS。
Risks: timeout micro-probe 只覆盖同进程组子进程，不覆盖主动脱组 daemon。
Dependencies: P11-RELEASE-VERIFIER-PUBLIC-REPO-MARKER-TIMEOUT-20260707.
Status: DONE / STATIC+INTEGRATION PASS / DEVOPS REVIEW PASS
```

```text
ID: P11-PUBLIC-REPO-MARKER-SHARED-FIXTURE-20260707
Title: public repo marker security regression shared base fixture
Priority: P1
Phase: P11 / P6
Track: release evidence verifier / security regression runtime cost / public repo marker gate
Owner: 黄仁勋 / 拉里佩奇 / 特朗普
User value: `release-verifier-public-repo-marker` 不应为 3 个 marker 负例重复生成相同 required-failure evidence 包；基础包生成和基础 verifier 校验应只做一次，后续负例复制该 verified fixture 再篡改。
Scope: `scripts/security-regression-check.sh`, focused `release-verifier-public-repo-marker` suite.
Non-goals: 不减少 public repo marker mutation 覆盖；不跳过 marker 语义拒绝；不刷新 full release authority；本切片不解决 verifier 多次子进程启动导致的 4 分钟 runtime。
Acceptance: shared base fixture 只生成一次并先通过 verifier；without-marker、without-natural-endpoint-probes、weak-keyword-eval-forgery 三个函数都复制该 base fixture 后再篡改；focused suite PASS；文档明确 runtime 仍高，下一步进入 batch verifier 方案。
Risks: 当前 suite 仍为 4 分钟级别；真正瓶颈是大量 `verify-release-evidence.sh` 子进程逐个启动。
Dependencies: P11-SECURITY-REGRESSION-NODE-TIMEOUT-MICRO-PROBE-20260707.
Status: DONE / FOCUSED PASS / PARTIAL RUNTIME IMPROVEMENT
```

```text
ID: P11-PUBLIC-REPO-MARKER-BATCH-VALIDATION-20260707
Title: public repo marker batch validation
Priority: P1
Phase: P11 / P6
Track: release evidence verifier / security regression runtime cost / public repo marker gate
Owner: 黄仁勋 / 拉里佩奇 / 特朗普
User value: public repo marker 回归门禁必须足够快，才能支持 P6 final evidence refresh 和后续频繁回归；不能靠删减 mutation 矩阵换速度。
Scope: `scripts/security-regression-check.sh`, focused `release-verifier-public-repo-marker` suite, P11 docs.
Non-goals: 不刷新 full release authority；不改变 `verify-release-evidence.sh` 权威 validator 规则；不修改 P6 检索业务逻辑；不引入新的制度文件。
Acceptance: batch runner 复用 verifier public repo marker Node validator；high-frequency mutation 改为 batch；保留完整 verifier wiring proof；focused suite 从 4 分钟级降到约 40 秒；bash syntax、integration-drill、diff check、残留进程检查 PASS；DevOps 复核 PASS。
Risks: batch runner 依赖 verifier heredoc 可抽取，未来 verifier 重构需同步；focused gate 不能冒充 full release authority。
Dependencies: P11-PUBLIC-REPO-MARKER-SHARED-FIXTURE-20260707.
Status: DONE / FOCUSED PASS / DEVOPS REVIEW PASS
```

```text
ID: P6-FINAL-FOCUSED-PUBLIC-REPO-EVIDENCE-REFRESH-20260707
Title: P6 final focused public repo evidence refresh
Priority: P1
Phase: P6 / P11
Track: public repo analysis / Code QA citation / weak keyword semantic fallback / report evidence QA citation
Owner: 梁文峰 / 拉里佩奇 / 特朗普
User value: P6 stage close 需要在 P11 marker runtime 修复后重新跑真实公开仓库主链路，确认 Code QA、weak keyword semantic fallback、claim citation 和 report evidence QA citation 仍可端到端复核。
Scope: stable backend jar runtime, `release-evidence/p6-final-public-repo-code-qa-20260707-0153`, `verify-release-evidence.sh`, public repo marker security regression.
Non-goals: 不运行 public repo UI smoke；不刷新 full release authority；不证明真实外部 LLM/embedding provider 质量；不推进 GitHub App E2E、私有仓库或生产部署。
Acceptance: stable jar backend health UP；focused release evidence required_failures=0 optional_warnings=0；verifier PASS；`projectQaWeakKeywordEvaluation.status=OK` 且 4 个 weak keyword case 均为 `SEMANTIC_FALLBACK` 并绑定当前 scanTaskId；`semanticWeakKeywordProbe.status=OK`；`reportEvidenceQaCitationQuality.status=OK`；Code QA claim READY 和 cross-file summary 成立；public repo marker regression PASS；Data-AI review PASS。
Risks: 该 evidence 是 focused authority，不替代 full release authority；MOCK embedding 只证明链路与门禁，不证明真实 provider 质量。
Dependencies: P11-PUBLIC-REPO-MARKER-BATCH-VALIDATION-20260707, P6-STAGE-CLOSE-CODE-UNDERSTANDING-QA-CITATION-20260707.
Status: DONE / LIVE SMOKE PASS / FOCUSED EVIDENCE VERIFIED / DATA-AI REVIEW PASS
```

```text
ID: P9-DASHBOARD-COMMAND-DISABLED-REASON-VISIBILITY-20260707
Title: Dashboard command disabled reason visibility
Priority: P1
Phase: P9 / P11
Track: frontend product experience / dashboard command panel / recoverable blocked action readability
Owner: 扎克伯格 / 拉里佩奇 / 特朗普
User value: 仪表盘主链路行动面板不能只显示不可点击按钮。代码问答、自动修复等高价值动作被阻断时，用户必须直接看见原因，知道下一步该先接入仓库、完成扫描或生成报告。
Scope: `web-console/src/pages/Dashboard.tsx`, `web-console/src/styles/app.css`, `web-console/tests/dashboard-next-action-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9 docs.
Non-goals: 不重做 Dashboard 全视觉系统；不治理全站所有 disabled action；不改变后端 API、状态计算、导航路由、release evidence 或 public repo UI smoke。
Acceptance: Dashboard command item 必须带 `disabledReason`；QA/AutoRepair disabled action 必须显示可见 `role=note` 原因；原因可换行、不省略、不依赖 hover/title；command label/value 不再用 nowrap ellipsis 隐藏状态；dashboard next-action smoke 覆盖异常、空仓库、无成功扫描分支和 1440/390/320 视口；marker 输出 `commandDisabledReasonCases`；static UI gate、frontend build、focused smoke PASS；Frontend Engineer 只读复核 PASS。
Risks: 该切片只覆盖 Dashboard command panel 的 disabled reason；不代表所有页面、所有按钮、所有真实生产数据或全站 P9 已完成。
Dependencies: P9-APP-SHELL-TOPBAR-AUXILIARY-RESPONSIVE-CONTRACT-20260707, P9 frontend design system, dashboard next-action smoke.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-PROJECT-QA-AGENT-HANDOFF-GATE-REASON-VISIBILITY-20260707
Title: Project QA Agent handoff gate reason visibility
Priority: P1
Phase: P9 / P10 / P11
Track: frontend product experience / ProjectDetail QA / Agent handoff safety UX
Owner: 扎克伯格 / 奥特曼 / 特朗普
User value: ProjectDetail 代码理解入口中的“解释此处”和“交给 Agent”不能只通过 disabled button、title 或 Tag 暗示阻断原因。当前扫描不一致、只有上下文线索或检索刷新时，用户必须直接看见为什么不能交给 Agent，并知道需要先绑定当前扫描和 PRIMARY 主证据。
Scope: `web-console/src/pages/ProjectDetail.tsx`, `web-console/src/styles/app.css`, `web-console/tests/project-qa-recoverable-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9 docs.
Non-goals: 不新增 AgentTask，不自动发送 AgentChat，不改变 QA 检索/排序/后端 API/DTO/DB，不改变 AutoRepair gate、release evidence、GitHub App 或真实 LLM provider。
Acceptance: CodeUnderstandingLens 必须渲染 `Agent 交接门禁说明`；READY 状态显示门禁开放条件；stale scan 和 context-only 状态显示独立可见阻断原因；原因可换行、不省略、不隐藏；project-qa-recoverable smoke 覆盖 1440/390/320、READY/stale scan/context-only、computed style、marker fields；static UI gate、frontend build、focused smoke PASS；Frontend Engineer 只读复核 PASS。
Risks: 该切片只覆盖 ProjectDetail QA CodeUnderstandingLens 的 Agent handoff gate，不代表全站 AgentChat、AgentTasks、AutoRepair 或所有 disabled action 都完成。
Dependencies: P9-DASHBOARD-COMMAND-DISABLED-REASON-VISIBILITY-20260707, P6 Project QA citation/cross-file evidence gates, project-qa-recoverable smoke.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-SCAN-PRIORITY-REPAIR-GATE-REASON-VISIBILITY-20260707
Title: ScanTaskDetail priority repair gate reason visibility
Priority: P1
Phase: P9 / P10 / P11
Track: frontend product experience / report evidence priority rail / AutoRepair safety UX
Owner: 扎克伯格 / 奥特曼 / 特朗普
User value: 报告证据优先阅读不能只显示“可进入修复候选/不直接生成修复”。用户必须直接知道为什么文件级风险证据可进入受控修复候选，而 QA citation/code_chunks 预检和治理闭环不等同于文件级修复证据。
Scope: `web-console/src/pages/ScanTaskDetail.tsx`, `web-console/src/styles/app.css`, `web-console/tests/report-evidence-drawer-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9 docs.
Non-goals: 不改变 AutoRepair 后端候选生成、不生成 patch、不改变 QA/citation/治理数据、不证明真实 patch 质量、不刷新 full release authority。
Acceptance: ReportEvidencePriorityRail 三张卡必须显示 `role=note` 修复门禁说明；risk card 显示门禁已开放和文件级风险证据原因；citation/governance cards 显示门禁未开放，并明确“不等同/不替代文件级修复证据”；说明可换行、不省略、不裁切；report evidence drawer smoke marker 输出 `repairGateReadyVisible=true`、`repairGateBlockedVisible=true`、`repairGateReasonVisible=true`；static UI gate、frontend build、focused smoke PASS；Frontend Engineer 只读复核 PASS。
Risks: 该切片只覆盖 ScanTaskDetail report evidence priority rail；不代表全站 disabled action、AutoRepair 生产安全、真实 LLM/provider 或 full release authority 完成。
Dependencies: P9-SCAN-CODE-KNOWLEDGE-GATE-REASON-VISIBILITY-20260707, report-evidence-drawer smoke, P10 AutoRepair evidence boundary.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-SCAN-RECOMMENDED-ACTION-GATE-REASON-VISIBILITY-20260707
Title: ScanTaskDetail recommended action gate reason visibility
Priority: P1
Phase: P9 / P10 / P11
Track: frontend product experience / report main path / recommended action safety UX
Owner: 扎克伯格 / 奥特曼 / 特朗普
User value: 报告总览第一步“推荐下一步”不能只通过按钮 disabled 或推荐标题暗示可执行边界。用户必须直接看到推荐动作为什么开放或阻断，以及当前推荐动作不能被误解为 QA、AutoRepair、审计或发布结论已成立。
Scope: `web-console/src/pages/ScanTaskDetail.tsx`, `web-console/src/styles/app.css`, `web-console/tests/report-evidence-drawer-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9 docs.
Non-goals: 不改变后端 scan/report/AutoRepair/QA 逻辑；不证明真实 patch 质量；不治理全站所有推荐动作；不刷新 full release authority。
Acceptance: `ReportRecommendedStep` 必须包含分支级 `actionGateReason`；failed/running/file-bound repair/project-risk/evidence-gap/code_chunks-gap/QA-ready 分支均有明确边界文案；`ReportRecommendedNextStep` 必须渲染 `报告推荐动作门禁说明` visible note；门禁说明可换行、不省略、不裁切；report evidence drawer smoke marker 输出 `recommendedStep.gateVisible=true`、`gateReasonVisible=true`、`gateReasonStyleSafe=true`、390/320/no-overflow；static UI gate、frontend build、focused smoke PASS；Frontend Engineer 只读复核 PASS。
Risks: 该切片只覆盖 ScanTaskDetail report overview 的推荐下一步；不代表全站 P9、真实生产数据、AutoRepair 生产安全或 full release authority 完成。
Dependencies: P9-SCAN-PRIORITY-REPAIR-GATE-REASON-VISIBILITY-20260707, report-evidence-drawer smoke, P10 AutoRepair evidence boundary.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-SCAN-TRACE-MAP-ACTION-GATE-REASON-VISIBILITY-20260707
Title: ScanTaskDetail trace map action gate reason visibility
Priority: P1
Phase: P9 / P10 / P11
Track: frontend product experience / report trace map / evidence action safety UX
Owner: 扎克伯格 / 奥特曼 / 特朗普
User value: 报告章节追踪卡片不能只通过 disabled 按钮表达“打开 API/数据库/图谱/产物/追问代码”是否可用。用户必须直接看到每个证据面的动作门禁原因，知道缺的是产物、扫描规则、项目上下文还是 code evidence 复核。
Scope: `web-console/src/pages/ScanTaskDetail.tsx`, `web-console/src/styles/app.css`, `web-console/tests/report-evidence-drawer-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9 docs.
Non-goals: 不改变后端报告解析、artifact schema、QA、AutoRepair 或治理时间线逻辑；不证明真实 LLM/provider 质量；不刷新 full release authority。
Acceptance: `ReportTraceItem` 必须包含 `actionGateReason`；五张 trace card 均渲染 `追踪动作门禁说明` visible note；说明可换行、不省略、不裁切；trace map smoke 覆盖 5 张卡 gate visible/style/no-overflow；marker 输出 `traceGateCount=5`、`traceGateVisible=true`、`traceGateReasonVisible=true`、`traceGateReasonStyleSafe=true`；static UI gate、frontend build、focused smoke PASS；Frontend Engineer 只读复核 PASS。
Risks: 该切片只覆盖 ScanTaskDetail report trace map；不代表全站状态面、真实生产数据、QA 事实质量或 full release authority 完成。
Dependencies: P9-SCAN-RECOMMENDED-ACTION-GATE-REASON-VISIBILITY-20260707, report-evidence-drawer smoke, P6 report evidence traceability.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-AUDIT-DECISION-GATE-SCOPE-TRUTHFULNESS-20260707
Title: AuditLogs decision gate scope and source-health truthfulness
Priority: P1
Phase: P9 / P10 / P11
Track: frontend product experience / audit governance / source-health truthfulness
Owner: 扎克伯格 / 奥特曼 / 特朗普
User value: 审计日志页不能让用户把当前页、筛选窗口、分页窗口或源失败状态误读为全局审计健康。页面必须直接说明当前审计判定是 READY、REVIEW 还是 BLOCKED，并说明为什么。
Scope: `web-console/src/pages/AuditLogs.tsx`, `web-console/src/styles/app.css`, `web-console/tests/audit-logs-detail-selection-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9/P10/P11 docs.
Non-goals: 不改变后端审计 API；不改变分页、Agent 工具调用或 GitHub Webhook Delivery 数据合同；不声明 AuditLogs 是全局安全裁判；不刷新 full release authority。
Acceptance: `审计判定门禁说明` 必须显示 READY/REVIEW/BLOCKED；手动筛选、初始深链和分页窗口进入 REVIEW；源错误和 deep link miss 进入 BLOCKED；顶部状态不得静态宣称 `审计链路在线`；门禁文本可换行、不省略、不裁切；audit-logs detail-selection smoke 覆盖 READY、REVIEW、BLOCKED、手动筛选、分页和源错误；static UI gate、frontend build、focused smoke PASS；Frontend Engineer 首轮 PARTIAL 后二轮 PASS。
Risks: 动态 smoke 手动筛选主要覆盖 audit action filter；tool/delivery 手动筛选由实现和 static gate 兜底，后续可按需扩展。
Dependencies: AuditLogs shared selectable row adoption, AuditLogs raw JSON display redaction safety, P10 audit boundary.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS AFTER PARTIAL
```

```text
ID: P9-AGENT-TASKS-ACTION-GATE-REASON-VISIBILITY-20260707
Title: AgentTasks action gate reason visibility
Priority: P1
Phase: P9 / P10 / P11
Track: frontend product experience / AgentTasks governance / task action safety UX
Owner: 扎克伯格 / 奥特曼 / 特朗普
User value: AgentTasks 详情页不能只展示启动、取消、对话、扫描报告和产物入口。用户必须直接看到当前任务状态下哪些动作开放、哪些动作关闭，以及为什么。
Scope: `web-console/src/pages/AgentTasks.tsx`, `web-console/src/styles/app.css`, `web-console/tests/agent-tasks-detail-selection-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9/P10/P11 docs.
Non-goals: 不改变后端 AgentTask API、状态机、执行器或数据库；不新增真实复盘按钮；不证明全站 Agent 任务流、真实 worker 执行质量或 full release authority。
Acceptance: selected detail 显示 `Agent 任务动作门禁说明`；PENDING/RUNNING/终态有输出/终态缺输出/未知状态均有明确 gate reason；reason 和 check grid 可换行、不裁切；smoke 覆盖 completed、pending、running、terminal missing output、unknown status 和 1440/390/320；static UI gate、frontend build、focused smoke PASS；Frontend Engineer 二轮复核 PASS。
Risks: 复盘入口当前表示查看对话、扫描报告、步骤和产物证据，不是独立复盘动作；marker 字段为断言后 hardcoded true，但断言失败不会输出 marker。
Dependencies: AgentTasks shared selectable row adoption, AgentTasks raw payload safety boundary, P9 AuditLogs decision gate scope.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-EXECUTION-TASKS-ACTION-GATE-REASON-VISIBILITY-20260707
Title: ExecutionTasks action gate reason visibility
Priority: P1
Phase: P9 / P10 / P11
Track: frontend product experience / execution pipeline governance / task action safety UX
Owner: 扎克伯格 / 奥特曼 / 特朗普
User value: 执行任务详情页不能只展示取消、来源、产物、步骤和日志入口。用户必须直接看到当前异步任务状态下哪些动作开放、哪些动作关闭，以及为什么。
Scope: `web-console/src/pages/ExecutionTasks.tsx`, `web-console/src/styles/app.css`, `web-console/tests/execution-tasks-detail-selection-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9/P10/P11 docs.
Non-goals: 不改变后端 ExecutionTask API、状态机、执行器或数据库；不证明后端存储/API 原始日志脱敏；不证明全站任务流水线、真实 worker 执行质量或 full release authority。
Acceptance: selected detail 显示 `执行任务动作门禁说明`；active/SUCCESS/FAILED with evidence/FAILED missing evidence/CANCELLED/unknown 均有明确 gate reason；reason 和 check grid 可换行、不裁切；smoke 覆盖六类状态和 1440/390/320；static UI gate、frontend build、focused smoke PASS；Frontend Engineer 二轮复核 PASS。
Risks: 日志安全范围限定为 `LOG_VIEWER_DISPLAY_REDACTION_ONLY`；marker 字段为断言后 proof summary，但断言失败不会输出 marker。
Dependencies: ExecutionTasks shared selectable row adoption, ExecutionTasks log display redaction, P9 AgentTasks action gate reason visibility.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-AGENT-CHAT-CLOSURE-GATE-REASON-VISIBILITY-20260707
Title: AgentChat closure rail action gate reason visibility
Priority: P1
Phase: P9 / P10 / P11
Track: frontend product experience / AgentChat closure rail / evidence chain safety UX
Owner: 扎克伯格 / 奥特曼 / 特朗普
User value: AgentChat 右侧闭环栏不能只展示审计、AgentTask 和扫描报告按钮。用户必须直接看到当前对话为什么能进入完整闭环，或者为什么只能进入部分入口。
Scope: `web-console/src/pages/AgentChat.tsx`, `web-console/src/styles/app.css`, `web-console/tests/agent-chat-closure-rail-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, P9/P10/P11 docs.
Non-goals: 不改变后端 AgentChat、AgentTask、AuditLogs、ScanTask API 或数据库；不证明真实 LLM provider 质量；不证明全站 Agent 闭环、AutoRepair 或 full release authority。
Acceptance: closure rail 显示 `Agent 闭环动作门禁说明`；no-active/linked/handoff/unbound/loading/task-error/missing-task/no-scan 均有明确 gate reason；scanTaskId 未确认时扫描报告按钮关闭；reason 和 check grid 可换行、不裁切；smoke 覆盖上述分支和 1440/320；static UI gate、frontend build、focused smoke PASS；Frontend Engineer 二轮复核关闭。
Risks: 该切片只提升前端状态面和证据链可解释性，不改变真实任务执行、报告质量或 LLM 答案质量。
Dependencies: AgentChat code-understanding handoff, AgentTasks deep link, AuditLogs conversation filter, ScanTask report deep link.
Status: DONE / STATIC+BUILD+SMOKE PASS / FRONTEND REVIEW PASS AFTER PARTIAL
```

```text
ID: P6-CODE-QA-CLAIM-CITATION-REPAIR-READINESS-API-20260707
Title: Code QA claim citation repair readiness API
Priority: P1
Phase: P6 / P10 / P11
Track: Code QA citation trust / AutoRepair evidence gate / API contract
Owner: 比尔盖茨 / 拉里佩奇 / 奥特曼 / 特朗普
User value: Project QA 不应只凭 claimCitationCoverage.status=READY 进入修复候选。系统必须直接给出机器可读的修复 readiness，告诉前端和后续消费者该回答是否真正 PRIMARY-bound。
Scope: `CodeQaClaimCitationCoverage.java`, `CodeQaController.java`, `CodeQaControllerTest.java`, `web-console/src/api/project.ts`, `web-console/src/pages/ProjectDetail.tsx`, `scripts/validate-frontend-ui.mjs`, API/P6 docs.
Non-goals: 不改变 AutoRepair 后端候选创建、数据库、真实 patch 生成或 LLM provider；不证明 LLM 回答事实一定正确；不刷新 full release authority。
Acceptance: 后端返回 readyForRepair/readinessReason/readinessNote；PRIMARY-bound 完整闭环返回 PRIMARY_BOUND_READY；context-only、unknown-only、invalid、uncited 和不完整文件闭环均不放行；前端优先使用后端 readiness 并保留严格旧数据 fallback；claim audit 展示 readiness note、修复门禁和原因码；focused backend test、static UI gate、frontend build、QA review PASS。
Risks: 后续新增消费者若只读 status=READY 会绕过新语义，必须以 readyForRepair + PRIMARY_BOUND_READY 为准。
Dependencies: Existing claimCitationCoverage, Project QA repair evidence gate, Code QA citation enforcement.
Status: DONE / BACKEND TEST + STATIC UI + BUILD PASS / QA REVIEW PASS
```

```text
ID: P6-P11-CLAIM-CITATION-READINESS-RELEASE-GATE-20260707
Title: Claim citation repair readiness release evidence gate
Priority: P1
Phase: P6 / P10 / P11
Track: Code QA citation trust / public repo smoke / release evidence verifier
Owner: 比尔盖茨 / 拉里佩奇 / 黄仁勋 / 奥特曼 / 特朗普
User value: public repo 主链路的发布证据不能只凭 claimCitationCoverage.status=READY 放行。release evidence 必须证明 verified QA 是 PRIMARY_BOUND_READY，同时证明 file-anchor drift 等 context-only 路径不会进入修复候选。
Scope: `web-console/tests/public-repo-ui-smoke.spec.ts`, `scripts/public-repo-analysis-smoke.sh`, `scripts/verify-release-evidence.sh`, `scripts/security-regression-check.sh`, `scripts/validate-frontend-ui.mjs`, P6/P11 docs.
Non-goals: 不改变 CodeQaController readiness 判定本身；不改变 AutoRepair 后端候选创建；不刷新 full release authority；不证明真实 LLM 事实质量或 patch 质量。
Acceptance: public repo smoke marker 必须输出 verified QA 的 `readyForRepair/readinessReasons`；Code QA smoke 必须要求 `readyForRepair=true && readinessReason=PRIMARY_BOUND_READY`；release verifier 必须拒绝缺失、false 或 context-only readiness 的 verified QA marker；fileAnchorDrift 必须显式 `readyForRepair=false && readinessReasons=["CONTEXT_ONLY_CLAIM"]`；security regression 必须覆盖 readiness 字段伪造；static UI validator、shell syntax、focused release verifier suites PASS。
Risks: 当前完成的是发布证据门禁和 fixture 防伪，不等价于完整 public repo full release authority；全量 public repo E2E 仍需后续真实仓库回归。
Dependencies: P6 Code QA claim citation repair readiness API, public repo UI smoke, release evidence verifier, P11 security regression suites.
Status: DONE / STATIC + SYNTAX + FOCUSED SECURITY REGRESSION PASS
```

```text
ID: P6-CODE-CHUNKS-STATUS-PERFORMANCE-LIVE-GATE-20260707
Title: code_chunks status performance and public repo live gate
Priority: P1
Phase: P6 / P9 / P11
Track: code_chunks readiness / public repo UI smoke / report evidence drawer
Owner: 比尔盖茨 / 黄仁勋 / 扎克伯格 / 拉里佩奇 / 特朗普
User value: 扫描详情页和项目详情页必须稳定显示 code_chunks readiness；大仓库不能因为状态读取复用搜索接口导致移动端报告抽屉出现网络异常。
Scope: `CodeChunkController.java`, `CodeChunkService.java`, `CodeChunkMapper.java`, `CodeChunkStatusCounts.java`, `web-console/src/api/codeChunk.ts`, `ProjectDetail.tsx`, `ScanTaskDetail.tsx`, affected Playwright mocks, API/P6/P11 docs.
Non-goals: 不改变真实 LLM provider、不证明 GitHub App/私有仓库/多人协作/生产部署；不改变 AutoRepair 后端 patch 质量。
Acceptance: 新增 `/code-chunks/status`；前端状态读取改用 status；空 query search 和 status 均走稳定索引路径；真实 MySQL 17k chunks 状态接口亚秒级；CodeChunkControllerTest、frontend build、static UI gate、完整 public repo smoke PASS。
Risks: 8080 主后端若是旧进程，需要重启才会加载本轮代码；status 复用响应结构但语义不是证据检索。
Dependencies: Existing code_chunks table indexes, public repo smoke, P6 report evidence drawer and QA citation gates.
Status: DONE / FULL PUBLIC REPO SMOKE PASS
```

```text
ID: P6-CODE-QA-BACKEND-FLOW-DOMAIN-NEIGHBORS-20260707
Title: Code QA backend-flow same-domain retrieval neighbors
Priority: P1
Phase: P6 / P11
Track: code_chunks retrieval quality / cross-file code understanding / QA citation candidate quality
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 用户问后端流程、调用链或接口到服务/数据访问链路时，候选证据不能被只堆叠 controller/service/repository 等角色词的无关文件抢占，必须优先补齐同一业务域的 controller/service/repository/model 证据。
Scope: `CodeQaRetrievalService.java`, `CodeQaRetrievalServiceTest.java`, P6/P11 docs.
Non-goals: 不改变数据库 schema、embedding provider、LLM prompt、前端 UI、AutoRepair 或 public repo full release authority；不宣称所有跨文件调用图已精确解析。
Acceptance: backend flow intent 下，同业务域 token 优先参与最终排序；选中主证据后优先补齐同业务域缺失角色；高分但不同业务域的 service/mapper 噪声不得挤掉 OrderController/OrderService/OrderRepository 这类同业务链路；focused retrieval test PASS。
Risks: 该策略是启发式业务域邻接，不等价于静态调用图；后续仍需结合 code relation / symbol graph 做更强证明。
Dependencies: Existing CodeChunkRanker evidenceType, role intent, code_chunks candidate pool.
Status: DONE / FOCUSED BACKEND RETRIEVAL TEST PASS
```

```text
ID: P6-CODE-QA-RELATION-AWARE-EVIDENCE-REASON-20260707
Title: Code QA relation-aware evidence reason
Priority: P1
Phase: P6 / P11
Track: code graph / Code QA evidence explainability / cross-file retrieval quality
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: Code QA 不应只返回“相邻上下文”。当已有 symbol/relation graph 能证明候选之间存在 CALLS/DEPENDS_ON/IMPLEMENTS/EXTENDS 关系时，返回证据必须直接说明图谱关系，帮助用户判断跨文件引用是否可信。
Scope: `CodeQaController.java`, `CodeQaControllerTest.java`, P6/P11 docs.
Non-goals: 不新增前端 API 字段、不改变 GraphService 页面接口、不改变数据库 schema、不证明真实 LLM 事实质量、不声明完整静态调用图完成。
Acceptance: QA topChunks 选出主证据后，服务端从 `GraphService.listSymbols/listRelations` 查找直接相连的候选 chunk；related chunk 作为 `ADJACENT_CONTEXT` 进入 retrievedChunks；`evidenceReason` 包含 `Graph relation: source RELATION target`；空图必须安全回退且不出现 graph relation reason；focused controller test PASS。
Risks: 当前只做直接关系解释和候选补齐，不做多跳调用链、不做跨语言完整静态分析；图谱缺失时必须安全降级为原有检索结果。
Dependencies: Existing code_symbols/code_relations, GraphService, Code QA retrievedChunks evidenceReason.
Status: DONE / FOCUSED CONTROLLER TEST PASS / QA REVIEW PARTIAL CLOSED
```

```text
ID: P6-P11-RELATION-AWARE-QA-CITATION-RELEASE-GATE-20260707
Title: Relation-aware QA citation release evidence gate
Priority: P1
Phase: P6 / P11
Track: report evidence QA citation / release evidence verifier / graph relation evidence reason
Owner: 梁文峰 / 拉里佩奇 / 奥特曼 / 特朗普
User value: 后端返回的 `Graph relation: source RELATION target` 不能只存在于单测；报告证据 QA citation 的 UI smoke、release verifier 和 security regression 必须能证明该 relation-aware evidence reason 可见、可验、防伪。
Scope: `web-console/tests/report-evidence-drawer-smoke.spec.ts`, `scripts/verify-release-evidence.sh`, `scripts/security-regression-check.sh`, `scripts/validate-frontend-ui.mjs`, P6/P11 docs.
Non-goals: 不要求真实公开仓库每轮必然产生 graph relation marker；不证明完整静态调用图、多跳关系、跨语言精确分析、真实 LLM 事实质量或 full release authority。
Acceptance: mocked report evidence QA citation response 包含 graph relation evidence reason；smoke 断言 citation、retrieved chunk 和 UI 引用证据卡可见该 reason；`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.relationAwareEvidenceReason` 输出计数、相邻上下文和 UI 可见性 proof；release verifier 强制校验；security regression 覆盖缺失、伪造、计数为 0、UI 隐藏、provider overclaim 和 raw field；focused smoke、static gate、security suite PASS。
Risks: 该 gate 是 report evidence mocked release contract，不替代真实 public repo graph relation E2E；真实图谱密度和 analyzer relation 质量仍需后续 P6/P12-pre 继续提升。
Dependencies: P6 Code QA relation-aware evidence reason, report evidence drawer smoke, release evidence verifier, P11 security regression suites.
Status: DONE / FOCUSED UI SMOKE + SECURITY REGRESSION PASS
```

```text
ID: P6-P11-PUBLIC-REPO-RELATION-AWARE-EVIDENCE-OPTIONAL-GATE-20260707
Title: Public repo UI relation-aware evidence optional-present strict gate
Priority: P1
Phase: P6 / P11
Track: public repo UI smoke / QA citation trust / release evidence verifier
Owner: 梁文峰 / 拉里佩奇 / 奥特曼 / 特朗普
User value: 真实 public repo UI smoke 不能强行宣称每轮都有 graph relation，但一旦真实 QA response 出现 `Graph relation:` evidence reason，发布证据必须证明 citation、retrieved chunk、邻接上下文、保留主证据和 UI 可见性都成立。
Scope: `web-console/tests/public-repo-ui-smoke.spec.ts`, `scripts/verify-release-evidence.sh`, `scripts/security-regression-check.sh`, `scripts/validate-frontend-ui.mjs`, P6/P11 docs.
Non-goals: 不要求真实公开仓库每轮必然产生 graph relation；不刷新 full release authority；不证明完整静态调用图、多跳关系、跨语言精确分析或真实 LLM 事实质量。
Acceptance: public repo UI smoke 只在真实 response 存在 `Graph relation:` 时输出 `qaFromEvidence.relationAwareEvidenceReason`；marker 必须包含 `surface=PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON`、`marker=Graph relation:`、proofCount、citation/chunk reason 计数、adjacent context 可见、cited primary 保留、UI 可见、无 provider/LLM overclaim；release verifier 对可选 marker 严格校验；security regression 覆盖状态、surface、marker、计数、adjacent、primary、UI、overclaim 和 raw field 伪造；static gate、shell syntax、public repo UI marker security suite PASS。
Risks: 该 gate 是 optional-present strict，不等价于真实 public repo graph relation 必达率；真实图谱密度仍依赖 analyzer 产出。
Dependencies: P6 Code QA relation-aware evidence reason, public repo UI smoke, release evidence verifier, P11 security regression suites.
Status: DONE / OPTIONAL-PRESENT STRICT / STATIC + SECURITY REGRESSION PASS
```

```text
ID: P6-JAVA-AST-SCOPED-CALL-RELATIONS-20260707
Title: Java AST scoped method CALLS relation density
Priority: P1
Phase: P6 / P11
Track: analyzer relation graph / code_symbols / Code QA relation-aware evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 公开仓库 Java/Spring 主链路中大量关系体现为 `controller.service.method()` 或局部变量 `service.method()` 调用。Analyzer 必须把明确变量作用域的方法调用落成 `CALLS`，让 Code QA 后续更容易生成真实 `Graph relation:` evidence reason。
Scope: `JavaAstParser.java`, `JavaAstParserTest.java`, P6/P11 docs.
Non-goals: 不解析无 scope 方法调用、不做动态分派、不做多跳调用链、不保证所有 Java 调用都能解析、不刷新 public repo full release authority。
Acceptance: Java AST parser 从字段、构造参数、方法参数和局部变量建立变量名到类型的映射；解析 `variable.method()` / `this.variable.method()` 为 `sourceMethod -> targetClass#method()` 的 `CALLS` relation；target method id 与已有 method symbol id 格式一致；重复调用去重；focused parser/fallback/persistence tests PASS。
Risks: 该增强只覆盖静态显式 scope 调用；接口实现解析、Spring proxy、反射、lambda 和链式返回类型仍需后续增强。
Dependencies: JavaParser AST, CodeGraphPersistenceService, Code QA relation-aware expansion.
Status: DONE / FOCUSED ANALYZER TEST PASS
```

```text
ID: P6-JAVA-AST-UNIQUE-IMPLEMENTATION-CALL-RELATIONS-20260707
Title: Java AST unique implementation CALLS relation resolution
Priority: P1
Phase: P6 / P11
Track: analyzer relation graph / Java interface implementation / Code QA relation-aware evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: Spring 项目常以接口类型注入 service。Analyzer 只产出 `Controller#method -> Service#method()` 仍不足以把证据锚定到实现类代码。若接口只有唯一实现且实现类存在同名方法，必须额外产出 `Controller#method -> ServiceImpl#method()`。
Scope: `JavaFallbackAnalyzer.java`, `JavaFallbackAnalyzerTest.java`, P6/P11 docs.
Non-goals: 不解析多实现选择、不做 Spring bean qualifier/profile 条件推断、不处理动态分派、代理、反射、lambda 或链式返回类型。
Acceptance: 聚合全项目 Java AST 后，根据 `IMPLEMENTS` 建立接口到实现类映射；仅当接口唯一实现且实现类存在目标方法 symbol 时，补充 concrete implementation `CALLS`；多实现必须跳过，不得猜测；scan result JSON 和 parsed AST cache 都包含补充关系；focused tests PASS。
Risks: 唯一实现推断是保守静态增强，不代表运行时 bean 必然一致；多实现场景仍需后续 qualifier/profile/bean name 解析。
Dependencies: JavaAstParser scoped CALLS relation, JavaFallbackAnalyzer parsedAstMap, CodeGraphPersistenceService.
Status: DONE / FOCUSED ANALYZER TEST PASS
```

```text
ID: P6-JAVA-AST-SAME-CLASS-CALL-RELATIONS-20260707
Title: Java AST same-class helper CALLS relation density
Priority: P1
Phase: P6 / P11
Track: analyzer relation graph / Java intra-class flow / Code QA relation-aware evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 真实 Java 代码大量主流程会调用同类 private/helper 方法。Analyzer 必须把 `helper()` 和 `this.helper()` 落成同类方法 `CALLS`，否则报告和 Code QA 会丢失类内执行流。
Scope: `JavaAstParser.java`, `JavaAstParserTest.java`, P6/P11 docs.
Non-goals: 不解析静态导入函数为本类方法、不解析重载签名差异、不做跨语言调用图、不刷新 public repo full release authority。
Acceptance: Java AST parser 仅在目标方法名存在于当前类声明时，把无 scope 方法调用和 `this.method()` 转为同类 `CALLS`；静态导入函数如 `requireNonNull()` 不得误判；重复 source/target 去重；focused parser/fallback/persistence tests PASS。
Risks: 该增强仍使用 method name 级符号，不区分重载参数；local class/lambda 深层调用仍属于 best-effort AST 扫描边界。
Dependencies: JavaAstParser scoped CALLS relation, CodeGraphPersistenceService, Code QA relation-aware expansion.
Status: DONE / FOCUSED ANALYZER TEST PASS
```

```text
ID: P6-JAVA-AST-IMPORTED-STATIC-CLASS-CALL-RELATIONS-20260707
Title: Java AST imported project static class CALLS relation density
Priority: P1
Phase: P6 / P11
Track: analyzer relation graph / Java static utility calls / Code QA relation-aware evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: Java 项目常用 `Mapper.toDto()`、`Factory.create()` 等静态工具方法承接业务转换。Analyzer 应识别显式 import 的项目内静态类调用，补充跨文件 `CALLS` 关系。
Scope: `JavaAstParser.java`, `JavaAstParserTest.java`, P6/P11 docs.
Non-goals: 不解析外部库静态调用、不解析 wildcard import、不解析 static import、不解析完整 FQCN scope、不刷新 public repo full release authority。
Acceptance: 对 `ImportedProjectClass.method()`，当 `ImportedProjectClass` 来自非 static、非 wildcard 的显式 import，且 import 与当前 package 共享前两段包根时，生成 `CALLS`；`java.*` 等外部 import 不得污染项目 graph；focused parser/fallback/persistence tests PASS。
Risks: 包根相同是保守项目内判断，不等价于构建系统模块边界；单字母或一段 package 项目不会启用该静态调用解析。
Dependencies: JavaAstParser scoped/same-class CALLS relation, CodeGraphPersistenceService, Code QA relation-aware expansion.
Status: DONE / FOCUSED ANALYZER TEST PASS
```

```text
ID: P6-P11-JAVA-AST-CALLS-PERSISTENCE-GATE-20260707
Title: Java AST CALLS persistence gate for Code QA graph consumers
Priority: P1
Phase: P6 / P11
Track: code graph persistence / analyzer relation graph / Code QA relation-aware evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: Parser 产出 `CALLS` 不足以支撑产品能力；这些关系必须经过 `CodeGraphPersistenceService` 带正确 scanTaskId 落入 code_relations，后续 GraphService / Code QA 才能消费。
Scope: `CodeGraphPersistenceServiceTest.java`, P6/P11 docs.
Non-goals: 不改数据库 schema、不改 mapper、不声明真实 public repo full E2E、不刷新 release authority。
Acceptance: focused persistence test 必须从 `JavaAstParser` 真实解析 scoped service call、same-class helper call、imported project static class call，并证明三类 `CALLS` 均进入 `CodeRelationMapper.insertBatch` 且继承 scanTaskId。
Risks: 该 gate 是 mock mapper 层验证，不替代真实 MySQL public repo scan；真实 relation 数量和 QA marker 命中率仍需后续实仓验证。
Dependencies: JavaAstParser CALLS relation enhancements, CodeGraphPersistenceService, Code QA relation-aware expansion.
Status: DONE / FOCUSED PERSISTENCE TEST PASS
```

```text
ID: P6-P11-CODE-RELATION-QUALITY-MARKER-20260707
Title: Code relation quality marker for public repo graph measurement
Priority: P1
Phase: P6 / P11
Track: code graph observability / public repo scan evidence / QA citation trust
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: Analyzer 增强必须可量化。真实仓库扫描后，需要一个只读工具输出 symbol/relation/CALLS 密度、method symbol 匹配率、未解析 target 和外部噪声，以判断 P6 代码理解是否真的变好。
Scope: `scripts/code-relation-quality-report.sh`, `Makefile`, P6/P11 docs.
Non-goals: 不触发扫描、不写数据库、不调用 LLM、不替代 public repo smoke、GraphService UI 或 release authority。
Acceptance: `make code-relation-quality` 输出唯一 `CODE_RELATION_QUALITY_OK` JSON marker；支持 `SOURCELENS_RELATION_QUALITY_SCAN_TASK_ID`、`SOURCELENS_RELATION_QUALITY_MIN_CALLS`、`SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT`；阈值不足必须 fail closed；不得输出 DB password/token/secret；当前本地最新 scanTaskId 可生成 marker。
Risks: 当前本地最新 scanTaskId=290 的 `CALLS=0`，说明数据库仍是旧扫描结果；必须重新运行 public repo scan 才能观察本轮 analyzer 增强后的 relation quality。
Dependencies: code_symbols/code_relations schema, local MySQL or Docker MySQL, public repo scan output.
Status: DONE / REAL LOCAL READ-ONLY MARKER PASS / BASELINE CALLS=0
```

```text
ID: P6-P11-CODE-RELATION-QUALITY-LIVE-GATE-20260707
Title: Code relation quality live scan gate
Priority: P1
Phase: P6 / P11
Track: public repo scan evidence / analyzer relation graph / QA citation trust
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: P6 analyzer 增强必须用真实公开仓库扫描证明已经落库，不能继续以旧 scanTaskId=290 / CALLS=0 作为当前状态。
Scope: `Makefile`, `docs/PHASE_REQUIREMENTS.md`, `docs/PRODUCT_PROGRESS_LOG.md`, `docs/QUALITY_SCORECARD.md`, `docs/CODEX_HANDOFF.md`, `docs/RISK_REGISTER.md`, `docs/AGENT_ACTIVITY_LOG.md`.
Non-goals: 不刷新 full release authority，不声明完整静态调用图，不声明真实 LLM 事实质量，不把 target method match percent 宣称为真实语义准确率，不推进 GitHub App E2E 或生产部署。
Acceptance: 真实公开仓库重新扫描生成新 scanTaskId；`make code-relation-quality` 输出 CALLS > 0；新增 `make code-relation-quality-p6` 默认 fail-closed 阈值；method match 按唯一 relation edge 计数；文档记录 scanTaskId、relationCount、callCount、target method match percent、duplicate method symbols 和 unresolved target 边界。
Risks: `methodSymbolDuplicateGroups` 与 `unresolvedCallTargets` 仍需分桶分析；CALLS 密度提高不等于所有调用都可解析。
Dependencies: public repo smoke, local MySQL, code_symbols/code_relations, Java fallback AST relation enhancements.
Status: DONE / LIVE PUBLIC REPO RELATION DENSITY MARKER PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-JAVA-COMMON-JDK-TYPE-CALLS-NORMALIZATION-20260707
Title: Java common JDK type CALLS normalization and unresolved bucket marker
Priority: P1
Phase: P6 / P11
Track: analyzer relation graph / unresolved target reduction / public repo evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 减少 `String`、`Map`、`List` 等 JDK 常见类型被误拼成项目 package 的假 CALLS target，让 P6 relation graph 更干净。
Scope: `JavaAstParser.java`, `JavaAstParserTest.java`, `scripts/code-relation-quality-report.sh`, P6/P11 docs.
Non-goals: 不声明完整静态调用图，不解析动态分派、多跳调用链、Spring runtime bean、泛型真实类型或真实 LLM 事实质量。
Acceptance: JDK simple type 不再生成当前 package 假 target；relation marker 输出 unresolved 分桶；真实公开仓库重新扫描后 project-like JDK simple-type false target 明显下降；focused tests 和 public repo smoke PASS。
Risks: target method match 仍为 40；剩余 duplicate method symbols 和 project-like unresolved 仍需后续治理。
Dependencies: JavaAstParser, public repo smoke, code_symbols/code_relations, local MySQL.
Status: DONE / LIVE PUBLIC REPO IMPROVEMENT PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-JAVA-PROJECT-LIKE-UNRESOLVED-CLOSURE-20260707
Title: Java project-like unresolved CALLS target closure
Priority: P1
Phase: P6 / P11
Track: analyzer relation graph / project-like false target closure / public repo evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: SourceLens 的代码理解、报告证据和 QA citation 不能把项目内调用解析到错误 package，也不能把外部类型误判成项目类型。本需求关闭当前公开仓库基线剩余 project-like false target。
Scope: `JavaAstParser.java`, `JavaAstParserTest.java`, `Makefile`, P6/P11 docs.
Non-goals: 不实现完整 Java compiler/type solver，不解析所有外部库 method symbol，不提供签名级 overload 图谱，不证明真实 LLM provider 或 full release authority。
Acceptance: catch parameter、websocket Session、annotation member、IllegalAccessException、CommonService wildcard disambiguation、HashMap putAll inherited symbol 有 focused test；public repo scan 后 `unresolvedProjectLikeCallTargets=0`；P6 relation quality threshold ratchet 到 56；57 阈值 fail-closed。
Risks: inherited JDK/framework symbol 不等于源码显式方法体；known external unresolved 仍保留为外部库图谱边界。
Dependencies: JavaAstParser, public repo smoke, code relation quality marker, local MySQL.
Status: DONE / LIVE PUBLIC REPO PROJECT-LIKE UNRESOLVED CLOSED / QUALITY PARTIAL
```

```text
ID: P6-P11-JAVA-OVERLOADED-METHOD-SYMBOL-DEDUP-20260707
Title: Java overloaded method symbol deduplication under name-level schema
Priority: P1
Phase: P6 / P11
Track: analyzer symbol quality / code graph observability / public repo evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 当前 symbol_id 不表达参数签名，重载方法会制造重复 METHOD symbol。去重可以降低图谱噪声，让 GraphService 和 Code QA 消费的 symbol 表更稳定。
Scope: `JavaAstParser.java`, `JavaAstParserTest.java`, P6/P11 docs.
Non-goals: 不实现签名级 symbol schema，不改变现有 class#method 查询合同，不提升动态分派或多跳调用图。
Acceptance: 同一 class 内同名 method symbol 只输出一条；真实公开仓库重新扫描后 `methodSymbolDuplicateGroups=0`；focused tests 和 public repo smoke PASS。
Risks: 去重后无法区分 overload line-level symbol；这是当前 schema 的诚实边界，签名级图谱需后续 schema 升级。
Dependencies: JavaAstParser, CodeGraphPersistenceService, code relation quality marker.
Status: DONE / LIVE PUBLIC REPO SYMBOL DEDUP PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-JAVA-WILDCARD-JDK-TYPE-CALLS-NORMALIZATION-20260707
Title: Java wildcard/JDK external type CALLS normalization
Priority: P1
Phase: P6 / P11
Track: analyzer relation graph / wildcard import normalization / public repo evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: 真实 Java 项目大量使用 wildcard import。SourceLens 需要避免把 `java.io.File`、`java.util.Map.Entry`、第三方 `weka.core.Instances` 等外部类型误拼成业务 package，降低假 project-like unresolved target。
Scope: `JavaAstParser.java`, `JavaAstParserTest.java`, P6/P11 docs.
Non-goals: 不实现完整 Java compiler/import resolver，不解析泛型真实类型、动态分派、反射、多跳调用链、Spring runtime bean、真实 LLM provider 或 full release authority。
Acceptance: JDK wildcard 只解析已知 JDK package 映射类型；第三方/project wildcard 可解析 Java class-name 风格类型；primitive type 不生成 constructor dependency target；真实公开仓库重新扫描后 `unresolvedProjectLikeJdkSimpleTypeCallTargets=0` 且 `methodSymbolDuplicateGroups=0` 不回退。
Risks: 剩余 `unresolvedProjectLikeCallTargets=512` 仍需后续分桶；`callTargetMethodMatchPercent=40` 未提升。
Dependencies: JavaAstParser, public repo smoke, code relation quality marker, local MySQL.
Status: DONE / LIVE PUBLIC REPO IMPROVEMENT PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-JAVA-LOMBOK-ACCESSOR-SYMBOL-COVERAGE-20260707
Title: Java Lombok accessor symbol coverage
Priority: P1
Phase: P6 / P11
Track: analyzer symbol quality / Lombok generated accessor matching / public repo evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: Java/Spring 项目大量实体使用 Lombok `@Data`。SourceLens 需要把源码字段对应的生成访问器纳入 symbol graph，避免 entity getter/setter 被误判为 unresolved project target。
Scope: `JavaAstParser.java`, `JavaAstParserTest.java`, `Makefile`, P6/P11 docs.
Non-goals: 不实现 Lombok 全语义、不生成方法体、不实现签名级 symbol schema、不解析 builder/chained/access-level 配置、不处理 MyBatis-Plus `IService` inherited CRUD。
Acceptance: `@Data/@Getter/@Setter` instance fields 生成 getter/setter method symbols；static fields 不生成；final fields 不生成 setter；primitive boolean 支持 `isX/getX`；public repo scan 后 entity getter/setter unresolved bucket 明显下降；P6 relation quality threshold ratchet 到 45。
Risks: 生成 symbol 指向字段行，不等于真实源码方法体；剩余 project-like unresolved 主要是 inherited framework CRUD，需要后续单独治理。
Dependencies: JavaAstParser, public repo smoke, code relation quality marker, local MySQL.
Status: DONE / LIVE PUBLIC REPO IMPROVEMENT PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-JAVA-MYBATIS-PLUS-ISERVICE-INHERITED-METHOD-COVERAGE-20260707
Title: Java MyBatis-Plus IService inherited method coverage
Priority: P1
Phase: P6 / P11
Track: analyzer symbol quality / inherited framework method matching / public repo evidence
Owner: 梁文峰 / 比尔盖茨 / 拉里佩奇 / 特朗普
User value: MyBatis-Plus service interface 继承方法是 Spring 项目常见主链路调用。SourceLens 需要识别这些 inherited CRUD 方法，避免把 `getOne/getById/save/count/updateById` 误判为 unresolved project target。
Scope: `JavaAstParser.java`, `JavaAstParserTest.java`, `Makefile`, P6/P11 docs.
Non-goals: 不生成业务方法体，不实现完整 Java type solver，不处理所有 ORM/framework，不把 inherited framework symbol 宣称为源码显式方法。
Acceptance: 仅明确继承 `com.baomidou.mybatisplus.extension.service.IService<T>` 的接口生成 inherited method symbols；本地同名 `IService` 不误判；public repo scan 后 `service_inherited_crud=0`；P6 relation quality threshold ratchet 到 55。
Risks: 生成 symbol 指向 interface extends 行，不等于真实源码方法体；剩余 project-like unresolved 需要后续处理 catch/local scope 和包解析。
Dependencies: JavaAstParser, public repo smoke, code relation quality marker, local MySQL.
Status: DONE / LIVE PUBLIC REPO IMPROVEMENT PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-CODE-QA-REQUIRED-CITATION-COVERAGE-20260707
Title: Code QA required evidence citation coverage status
Priority: P1
Phase: P6 / P11
Track: Code QA citation trust / report evidence QA / frontend release signal / public repo evidence
Owner: 特朗普 / 梁文峰 / 拉里佩奇
User value: Code QA 和报告证据 QA 必须区分“必需主证据已全部引用”和“辅助上下文未全部引用”。否则真实可放行的回答会被误显示为 PARTIAL，影响报告复盘、自动修复候选和用户信任。
Scope: `CodeQaController.java`, `CodeQaControllerTest.java`, `web-console/src/api/project.ts`, `web-console/src/pages/ProjectDetail.tsx`, `scripts/public-repo-analysis-smoke.sh`, P6/P11 docs.
Non-goals: 不证明真实 LLM provider 回答事实正确性，不要求引用所有辅助上下文，不改变 raw prompt/raw answer retention 边界，不把 Code QA readiness 扩大为 full release authority。
Acceptance: 后端新增 `REQUIRED_FULL` citation coverage 状态；前端把 `REQUIRED_FULL` 作为必需证据闭环但辅助上下文可复核的 ready 信号；public repo smoke 接受该状态并继续暴露 total coverage/context gap；focused tests 和真实公开仓库 smoke PASS。
Risks: 总引用覆盖率仍可能低于 100%；辅助上下文未引用必须继续作为 review signal 展示，不能被静默吞掉。
Dependencies: CodeQaController, ProjectDetail QA evidence panels, public repo smoke, local MySQL.
Status: DONE / LIVE PUBLIC REPO QA CITATION PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-WEAK-KEYWORD-REPRESENTATIVE-FALLBACK-20260707
Title: Weak keyword no-embedding representative code fallback
Priority: P1
Phase: P6 / P11
Track: Project QA retrieval / code chunk fallback / public repo smoke
Owner: 特朗普 / 梁文峰 / 拉里佩奇
User value: 当公开仓库没有 embeddings 且用户问题没有强关键词时，SourceLens 不能把 README/docs 作为主要证据误导用户；兜底结果必须优先返回 Controller、Service、Data Access、Domain、Frontend、Config、Test 等代表性代码证据。
Scope: `CodeChunkService.java`, `CodeChunkServiceTest.java`, `scripts/public-repo-analysis-smoke.sh`, P6/P11 docs.
Non-goals: 不证明真实 external embedding provider 质量，不把 `INCONCLUSIVE/no_embeddings` 改写成语义召回成功，不解决全部跨文件排序和 Code QA 回答事实正确性。
Acceptance: stable fallback 先按代表性代码角色取候选；角色排序优先 Controller/Service/Data Access；public repo weak keyword evaluation 在 no-embedding 场景必须 fail-closed 拒绝 README/docs/DOCUMENTATION primary；focused tests 和真实公开仓库 smoke PASS。
Risks: 无 embedding 时仍只能作为代表性代码兜底，不能宣称语义理解完成；当前样本 primary 集中在 Controller，后续仍需更细的意图到角色映射。
Dependencies: CodeChunkService retrieval fallback, public repo smoke, local MySQL.
Status: DONE / LIVE PUBLIC REPO REPRESENTATIVE FALLBACK PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-WEAK-KEYWORD-INTENT-ROLE-FALLBACK-20260707
Title: Weak keyword intent-aware representative fallback roles
Priority: P1
Phase: P6 / P11
Track: Project QA retrieval / intent routing / public repo smoke
Owner: 特朗普 / 梁文峰 / 拉里佩奇
User value: no-embedding 弱问题不应全部落到 Controller。SourceLens 需要按问题意图返回更合理的代表性代码层，例如安全/任务能力优先 Service，运行配置优先 Config，数据加载优先 Data Access。
Scope: `CodeChunkService.java`, `CodeChunkServiceTest.java`, `scripts/public-repo-analysis-smoke.sh`, P6/P11 docs.
Non-goals: 不实现完整语义检索，不证明真实 embedding provider 质量，不解决所有自然语言 intent 分类，不把 no-embedding `INCONCLUSIVE` 改写成 OK。
Acceptance: fallback ranking 支持 query-driven role priority；blank/default query 保持原默认优先级；public repo smoke 对 4 个 weak keyword case 强制校验 expected fallback primary role；focused tests 和真实公开仓库 smoke PASS。
Risks: 规则式 intent 只能覆盖高价值样本；复杂问题仍需后续 semantic embedding / LLM-assisted query planning。
Dependencies: P6-P11-WEAK-KEYWORD-REPRESENTATIVE-FALLBACK-20260707, CodeChunkService, public repo smoke.
Status: DONE / LIVE PUBLIC REPO INTENT ROLE FALLBACK PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-CODE-QA-RETRIEVAL-PLAN-EXPLAINABILITY-20260707
Title: Code QA retrieval plan explainability
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval trust / weak keyword planning / public repo smoke
Owner: 特朗普 / 梁文峰 / 拉里佩奇
User value: 用户和验证脚本需要看见 Code QA 为什么进入 keyword、stable fallback 或 intent-aware fallback；否则弱关键词兜底即使结果正确，也无法审计查询计划、角色优先级和辅助结构信号。
Scope: `CodeQaController.java`, `CodeQaResponse.java`, `CodeQaRetrievalPlan.java`, `CodeChunkService.java`, `CodeChunkRanker.java`, `CodeQaControllerTest.java`, `CodeChunkServiceTest.java`, `web-console/src/api/project.ts`, `scripts/public-repo-analysis-smoke.sh`, P6/P11 docs.
Non-goals: 不做新的 UI 展示面，不证明真实 embedding/provider 质量，不把 `no_embeddings` 改写成 OK，不实现完整 LLM query planner。
Acceptance: Code QA API 返回 `retrievalPlan.tokens/roleIntents/fallbackRolePriority/auxiliaryHintsPresent/fallbackReason`；无主关键词命中但有意图候选时实际候选排序与 fallback plan 一致；public repo weak keyword smoke 必须校验 stable fallback 的 `fallbackRolePriority` 和 `fallbackReason`；focused tests 和真实公开仓库 smoke PASS。
Risks: 该计划是 deterministic retrieval explanation，不是事实正确性证明；复杂自然语言仍可能需要 embedding 和后续 query planner。
Dependencies: P6-P11-WEAK-KEYWORD-INTENT-ROLE-FALLBACK-20260707, Code QA response contract, public repo smoke.
Status: DONE / LIVE PUBLIC REPO RETRIEVAL PLAN PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-CODE-QA-GRAPH-FLOW-PRIMARY-CITATION-20260707
Title: Code QA graph flow relation evidence primary citation
Priority: P1
Phase: P6 / P11
Track: cross-file code understanding / graph relation evidence / QA citation trust
Owner: 特朗普 / 梁文峰 / 拉里佩奇
User value: 当用户询问 controller->service、service->repository 等调用链/流程时，图谱关系命中的跨文件证据必须作为必需主证据参与引用门禁，而不是只作为可忽略上下文。
Scope: `CodeQaController.java`, `CodeQaControllerTest.java`, `scripts/verify-release-evidence.sh`, P6/P11 docs.
Non-goals: 不把所有 graph-related context 都升级为 PRIMARY，不证明完整调用图或 LLM 事实正确，不改变普通相邻上下文的 review 属性。
Acceptance: flow/call-chain 问题下 graph relation chunk 升级为 `PRIMARY`；relation evidence reason 在 PRIMARY 证据上仍可见；无 LLM fallback answer 引用所有 PRIMARY labels；citationCoverage/claimCitationCoverage 证明跨文件 primary cited；release verifier 接受 `REQUIRED_FULL`；focused tests 和真实 public repo smoke PASS。
Risks: flow intent 是 bounded heuristic；复杂表达仍可能需要后续 query planner 和 relation-aware prompt 优化。
Dependencies: P6 relation graph, Code QA citation coverage, public repo smoke.
Status: DONE / LIVE PUBLIC REPO CROSS-FILE PRIMARY CITATION PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-CODE-QA-RELATION-AWARE-PROMPT-20260707
Title: Code QA relation-aware graph evidence prompt
Priority: P1
Phase: P6 / P11
Track: cross-file code understanding / graph relation prompt / QA citation trust
Owner: 特朗普 / 奥特曼 / 拉里佩奇
User value: 当后端已经把 graph relation 跨文件证据提升为 PRIMARY 后，LLM prompt 也必须显式理解这些证据代表调用链/流程关系，否则模型仍可能只按单文件片段回答。
Scope: `CodeQaController.java`, `CodeQaControllerTest.java`, P6/P11 docs.
Non-goals: 不新增 raw prompt/raw answer 持久化，不改变 public repo UI relation marker 的 optional-present strict 规则，不证明真实 provider 答案事实正确。
Acceptance: prompt chunk 展示 `Context role` 和 `Evidence reason`；flow/call-chain 问题存在 `Graph relation:` PRIMARY 证据时，system prompt 明确要求优先使用这些关系证据；citation retry prompt 暴露 evidence reason 但不暴露 chunk content；focused tests、门禁脚本、安全/QA 子 agent 复核和真实 public repo smoke PASS。
Risks: relation-aware prompt 是模型指导，不是事实裁判；真实 response 未出现 `Graph relation:` 时不能伪造 release marker。
Dependencies: P6-P11-CODE-QA-GRAPH-FLOW-PRIMARY-CITATION-20260707, PromptInjectionGuard, public repo smoke.
Status: DONE / LIVE PUBLIC REPO RELATION-AWARE PROMPT PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-CODE-QA-RELATION-AWARE-RETRIEVAL-PLAN-20260707
Title: Code QA relation-aware retrieval plan audit fields
Priority: P1
Phase: P6 / P11
Track: Code QA retrieval explainability / graph relation evidence / public repo smoke
Owner: 特朗普 / 奥特曼 / 拉里佩奇
User value: relation-aware prompt 已经能使用 graph relation 证据，但前端、smoke 和排障工具不能只靠解析 prompt 判断是否进入跨文件关系路径。retrievalPlan 必须直接暴露跨文件意图和 graph relation 证据状态。
Scope: `CodeQaRetrievalPlan.java`, `CodeQaController.java`, `CodeQaControllerTest.java`, `web-console/src/api/project.ts`, `scripts/public-repo-analysis-smoke.sh`, `docs/API_DESIGN.md`, P6/P11 docs.
Non-goals: 不强制真实公开仓库每轮都产生 `Graph relation:`，不泄露 raw prompt/raw answer/chunk content，不证明完整调用链或真实 provider 答案事实正确。
Acceptance: Code QA `retrievalPlan` 返回 `crossFileIntentPresent`、`graphRelationEvidencePresent`、`graphRelationPrimaryLabels`、`graphRelationEvidenceCount`；后端测试覆盖有 graph relation、无 graph relation 和 stable fallback；public repo smoke 校验字段类型和自洽性并写入 `PUBLIC_REPO_SMOKE_OK.codeQa.retrievalPlan`；真实公开仓库 smoke PASS。
Risks: 这些字段是检索计划和证据状态，不是事实正确性裁判；真实仓库没有 relation evidence 时必须返回 false/0/[]，不得伪造。
Dependencies: P6-P11-CODE-QA-RELATION-AWARE-PROMPT-20260707, Code QA response contract, public repo smoke.
Status: DONE / LIVE PUBLIC REPO RELATION-AWARE PLAN PASS / QUALITY PARTIAL
```

```text
ID: P6-P11-CODE-QA-QUERY-SEMANTIC-PLAN-20260707
Title: Code QA query strategy and embedding coverage audit fields
Owner: 梁文峰 / Data-AI Engineer, 主 agent integration
Phase: P6 / P11
Type: Product quality / retrieval observability / API contract
Priority: P0
User value: Code QA 检索质量出现问题时，前端、smoke 和排障工具必须能直接判断本轮是路径锚点、接口路由、前后端桥接、后端链路、语义兜底、角色兜底还是稳定兜底，并能看到 active embedding model 下的覆盖率和 semantic pool 状态。
Scope: `CodeQaRetrievalPlan.java`, `CodeQaController.java`, `CodeQaControllerTest.java`, `web-console/src/api/project.ts`, `scripts/public-repo-analysis-smoke.sh`, `docs/API_DESIGN.md`, P6/P11 docs.
Non-goals: 不引入向量数据库，不改变 semantic pool 按 id limit 加载策略，不宣称真实世界召回率达标，不把 fixed eval corpus 包装成 benchmark。
Acceptance: Code QA `retrievalPlan` 返回 `queryStrategy`、`questionEmbeddingAvailable`、`embeddingCoveragePercent`、`embeddingCoverageStatus`、`semanticPoolAttempted`、`semanticPoolLoadedCount`、`semanticPoolLimit`、`semanticPlanReason`；后端测试覆盖 no LLM stable fallback、intent fallback、semantic fallback 和 backend flow；public repo smoke 校验字段类型和自洽性。
Risks: 这些字段是诊断信号，不是检索质量评分；semantic pool 仍是有限候选池，不代表大仓库向量召回完整。
Dependencies: P6 relation-aware retrieval plan audit fields, Code QA response contract, public repo smoke.
Status: DONE / LIVE PUBLIC REPO QUERY SEMANTIC PLAN PASS
```

```text
ID: P6-CODE-QA-DISTRIBUTED-SEMANTIC-POOL-20260707
Title: Code QA distributed semantic pool for large embedded repositories
Owner: 梁文峰 / Data-AI Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval quality / semantic candidate coverage / regression gate
Priority: P0
User value: 大仓库里同模型 embedding chunk 超过 500 时，Code QA 不应只取 id 最靠前的 500 个语义候选；候选池需要覆盖仓库后段，并把采用的 pool strategy 暴露给 smoke 和排障工具。
Scope: `CodeChunkService.java`, `CodeQaController.java`, `CodeChunkServiceTest.java`, `CodeQaControllerTest.java`, `CodeQaRetrievalPlan.java`, `web-console/src/api/project.ts`, `scripts/public-repo-analysis-smoke.sh`, `docs/API_DESIGN.md`, P6/P11 docs.
Non-goals: 不引入 pgvector/向量数据库，不承诺生产级语义召回，不改变最终 rerank 算法，不把 fixed eval 或 smoke 解释成 benchmark。
Acceptance: 新增带 `embeddedChunkCount` 的 semantic pool 重载；embedded chunk 大于 pool limit 时采用 head + distributed windows；接近 pool limit 的大池采用 compact tail windows 避免窗口重叠导致候选不足；Code QA response 暴露 `semanticPoolStrategy`；测试覆盖大仓库分布式窗口、compact tail 边界和主问答路径；smoke 校验策略字段自洽。
Risks: 分布式窗口提高覆盖面但仍不是向量索引；后续仍需要真正的 model-aware vector retrieval。
Dependencies: P6-P11-CODE-QA-QUERY-SEMANTIC-PLAN-20260707, active embedding model, Code QA retrieval service.
Status: DONE / LIVE PUBLIC REPO DISTRIBUTED SEMANTIC POOL PASS
```

```text
ID: P6-P11-CODE-QA-SEMANTIC-POOL-COVERAGE-DIAGNOSTICS-20260707
Title: Code QA semantic pool truncation and coverage diagnostics
Owner: 梁文峰 / Data-AI Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval observability / semantic candidate coverage / smoke contract
Priority: P0
User value: Code QA 进入 semantic fallback 时，前端、smoke 和排障工具必须能直接判断 semantic pool 是否被 500 上限截断，以及本次实际加载候选覆盖 active embedding pool 的比例，避免把有限候选池误读成完整向量召回。
Scope: `CodeQaRetrievalPlan.java`, `CodeQaController.java`, `CodeQaControllerTest.java`, `web-console/src/api/project.ts`, `scripts/public-repo-analysis-smoke.sh`, `docs/API_DESIGN.md`, P6/P11 docs.
Non-goals: 不引入向量数据库，不改变 rerank，不证明真实 provider 质量，不宣称 semantic recall 达标。
Acceptance: Code QA `retrievalPlan` 返回 `semanticPoolTruncated` 和 `semanticPoolCoveragePercent`；未尝试 semantic pool 时二者分别为 false/0；大池部分加载时 truncated=true 且 coverage 为 0-100 整数；smoke 校验字段类型和自洽性；focused tests PASS。
Risks: 这些字段是候选池覆盖诊断，不是召回质量评分；生产级向量索引仍后置。
Dependencies: P6-CODE-QA-DISTRIBUTED-SEMANTIC-POOL-20260707, Code QA response contract, public repo smoke.
Status: DONE / LIVE PUBLIC REPO SEMANTIC POOL COVERAGE DIAGNOSTICS PASS
```

```text
ID: P6-P11-CODE-QA-CROSS-FILE-EVIDENCE-COVERAGE-20260707
Title: Code QA cross-file evidence coverage diagnostics
Owner: 梁文峰 / Data-AI Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval observability / citation trust / smoke contract
Priority: P0
User value: 当用户问流程、调用链或跨文件关系时，前端、报告和 smoke 不能只知道“识别了跨文件意图”，还必须知道本次响应是否实际返回了至少两个 PRIMARY 文件，否则 citation 可信度无法量化。
Scope: `CodeQaRetrievalPlan.java`, `CodeQaController.java`, `CodeQaControllerTest.java`, `web-console/src/api/project.ts`, `scripts/public-repo-analysis-smoke.sh`, `docs/API_DESIGN.md`, P6/P11 docs.
Non-goals: 不证明完整调用链、多跳关系、动态分派或真实 provider 事实正确；不要求每个真实公开仓库样本都必须命中 `SATISFIED`。
Acceptance: Code QA `retrievalPlan` 返回 `crossFileEvidenceSatisfied`、`crossFilePrimaryFileCount` 和 `crossFileEvidenceStatus`；状态必须由 `crossFileIntentPresent` 与 PRIMARY 文件数唯一推导；后端测试覆盖 `NOT_APPLICABLE`、`SATISFIED` 和 `SINGLE_PRIMARY_FILE`；public repo smoke fail-closed 校验状态机等价关系；API 文档和前端类型同步。
Risks: 该字段只证明当前响应的 PRIMARY 文件覆盖，不证明调用关系完整性；没有真实 graph relation 时不得伪造 relation evidence。
Dependencies: P6-P11-CODE-QA-RELATION-AWARE-RETRIEVAL-PLAN-20260707, Code QA response contract, public repo smoke.
Status: DONE / LIVE PUBLIC REPO CROSS-FILE EVIDENCE COVERAGE PASS
```

```text
ID: P6-P11-REPORT-EVIDENCE-LINE-ANCHOR-REASON-20260707
Title: Report evidence line anchor reason visibility for Code QA citations
Owner: 梁文峰 / Data-AI Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Citation trust / report evidence QA / smoke contract
Priority: P0
User value: 报告证据 QA 命中某个文件行号时，用户和 smoke 不能只看到 citation 已引用，还必须能看到该 PRIMARY citation 为什么可信，即它来自报告证据行号锚点。
Scope: `CodeQaController.java`, `CodeQaControllerTest.java`, `scripts/public-repo-analysis-smoke.sh`, `docs/API_DESIGN.md`, P6/P10/P11 docs.
Non-goals: 不改变 LLM prompt，不新增 raw prompt/raw answer 持久化，不证明真实 provider 答案事实正确，不把相邻上下文伪装成报告行号锚点。
Acceptance: PRIMARY 且匹配 `evidenceRef.filePath + line/range` 的 retrieved chunk 和 answer citation 暴露 `Report evidence line anchor.`；file-only evidence ref 暴露 `Report evidence file anchor.`；相邻上下文不得携带 line anchor reason；Code QA response 不返回完整 `retrievedChunks.content`；`contentPreview` 脱敏截断；本地绝对 evidence path 响应相对化或 redacted；public repo smoke 对 report evidence QA sample fail-closed 校验 `lineAnchorEvidenceReasonVisible`。
Risks: evidenceReason 是解释性元数据，不是事实正确性裁判；必须避免泄露 raw source content、绝对路径、secret 或 prompt。
Dependencies: P6/P11 report evidence QA citation path, Code QA citation coverage, public repo smoke.
Status: DONE / QA PASS / LIVE PUBLIC REPO REPORT EVIDENCE REASON PASS
```

```text
ID: P6-P10-P11-CODE-QA-RAW-CONTENT-SMOKE-GATE-20260707
Title: Code QA raw chunk content absence smoke gate
Owner: 奥特曼 / Security Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P10 / P11
Type: Security boundary / release evidence / smoke contract
Priority: P0
User value: Code QA 已收紧为不返回完整 `retrievedChunks.content`，但必须让 public repo smoke fail-closed 锁住该边界，防止后续重构回归后仍通过 release evidence。
Scope: `scripts/public-repo-analysis-smoke.sh`, P6/P10/P11 docs.
Non-goals: 不改变底层 code chunk search API，不改变 Code QA ranking，不新增 raw access 入口，不证明真实 provider 答案质量。
Acceptance: public repo smoke 的 Code QA、report evidence QA、claim citation noise、weak keyword eval 和 semantic pool probe 都校验 `retrievedChunks` 不含 `content` 字段；marker 输出 `rawRetrievedChunkContentAbsent` / sample count / case count；Python heredoc syntax gate PASS。
Risks: `contentPreview` 仍是脱敏截断预览，不等同于 raw content 授权；底层 code chunk search 的 raw content 暴露属于独立 raw access 治理范围。
Dependencies: P6-P11-REPORT-EVIDENCE-LINE-ANCHOR-REASON-20260707, public repo smoke.
Status: DONE / LIVE PUBLIC REPO RAW CONTENT ABSENCE GATE PASS
```

```text
ID: P6-P10-P11-RELEASE-VERIFIER-RAW-CONTENT-GATE-20260707
Title: Release verifier raw chunk content absence gate
Owner: 奥特曼 / Security Engineer, 拉里佩奇 / QA Engineer, 黄仁勋 / DevOps Engineer, 主 agent integration
Phase: P6 / P10 / P11
Type: Release verifier / security boundary / regression gate
Priority: P0
User value: public repo smoke 已输出 Code QA raw content absence marker，但 release verifier 也必须 fail-closed 校验这些 marker，防止伪造或缺失的 release evidence 被误判通过。
Scope: `scripts/verify-release-evidence.sh`, `scripts/security-regression-check.sh`, P6/P10/P11 docs.
Non-goals: 不强制旧 evidence 一次性补齐 semantic probe；不改变底层 raw code chunk search API；不证明真实 provider 答案质量。
Acceptance: release verifier 必须校验 Code QA、claim citation noise、report evidence QA、weak keyword eval 的 raw content absence marker；semantic weak keyword probe 出现时必须严格校验；security regression 必须拒绝缺失/伪造 Code QA raw marker。
Risks: 这是 release evidence 结构门禁，不是底层 raw access 权限系统；旧 focused evidence 可能缺少新 marker，后续 full authority 刷新时必须使用新格式。
Dependencies: P6-P10-P11-CODE-QA-RAW-CONTENT-SMOKE-GATE-20260707, release evidence verifier.
Status: DONE / FOCUSED RELEASE VERIFIER REGRESSION PASS
```

```text
ID: P6-P11-CODE-QA-SEMANTIC-READINESS-STATUS-20260707
Title: Code QA semantic readiness status and reason
Owner: 梁文峰 / Data-AI Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval observability / semantic readiness / smoke contract
Priority: P0
User value: Code QA 的 retrievalPlan 必须给出机器可读的 semantic readiness 状态和原因，让前端、报告和 release evidence 能直接判断语义检索是未适用、未启用、不可用、降级还是可用。
Scope: `CodeQaRetrievalPlan.java`, `CodeQaController.java`, `CodeQaControllerTest.java`, `web-console/src/api/project.ts`, `scripts/public-repo-analysis-smoke.sh`, `scripts/verify-release-evidence.sh`, `docs/API_DESIGN.md`, P6/P11 docs.
Non-goals: 不引入向量数据库，不证明真实 provider 答案质量，不把低覆盖 semantic fallback 宣称为生产级语义召回。
Acceptance: `semanticReadinessStatus` 必须为 `NOT_APPLICABLE` / `DISABLED` / `UNAVAILABLE` / `DEGRADED` / `READY`；`semanticReadinessReason` 必须给出固定诊断码；public repo smoke 校验状态和原因自洽；semantic weak keyword probe 必须暴露 `DEGRADED`；release verifier 校验 semantic probe readiness marker。
Risks: readiness 是可观测诊断，不是答案事实正确性评分；真实向量索引、provider E2E 和召回评测仍是后续工作。
Dependencies: P6 semantic diagnostics, P6 raw content absence gate, public repo smoke.
Status: DONE / LIVE PUBLIC REPO SEMANTIC READINESS PASS
```

```text
ID: P6-P11-CODE-QA-ROUTE-RANKING-PREFILTER-20260707
Title: Code QA route-aware ranking prefilter
Owner: 梁文峰 / Data-AI Engineer, 比尔盖茨 / Backend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval performance / route-aware ranking / regression gate
Priority: P0
User value: 大仓库 Code QA endpoint route 查询不能对所有 chunk 跑昂贵 previous-context route scoring；必须先排除明显不可能参与 route 解析的噪声 chunk，同时保留 controller mapping、route holder、frontend API 和 previous same-file context 能力。
Scope: `CodeChunkRanker.java`, `CodeChunkServiceTest.java`, P6/P11 docs.
Non-goals: 不改变非 endpoint 查询排序，不改变 code_chunks DB 查询合同，不引入向量数据库，不证明真实 provider 答案质量。
Acceptance: endpoint route 查询启用 route-aware prefilter；500 个非 route service 噪声不会进入 route-aware scoring 候选；previous same-file context 仍能让 `@RequestMapping` + `@GetMapping` 组合 route 命中目标 method；P6 retrieval focused tests PASS。
Risks: 这是 endpoint route ranking 热点削减，不是完整全站性能基准；真实 provider、生产向量索引和多仓库 benchmark 仍是后续范围。
Dependencies: P6 semantic readiness smoke observation, Code QA route retrieval tests.
Status: DONE / LIVE PUBLIC REPO ROUTE RANKING PERFORMANCE PASS
```

```text
ID: P6-P11-CODE-QA-SPRING-MAPPING-LOOKUP-CACHE-20260707
Title: Code QA Spring mapping lookup cache for route ranking
Owner: 比尔盖茨 / Backend Engineer, 梁文峰 / Data-AI Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval performance / report evidence QA citation / regression gate
Priority: P0
User value: 公开仓库 smoke 的 report evidence QA citation 不能在 Spring route ranking 中反复全量扫描 class declaration 和 mapping literals；同一候选内容必须复用解析结果，保证大仓库 QA citation 在可接受时间内完成。
Scope: `CodeChunkRanker.java`, `CodeChunkServiceTest.java`, public repo smoke evidence, P6/P11 docs.
Non-goals: 不改变 API 合同，不改变非 route 查询排序，不引入向量数据库，不证明真实 LLM provider 答案事实正确。
Acceptance: route-aware ranking 对 direct/previous context 复用 `SpringMappingLookup`；Spring exact/template/composed route、HTTP method matching 仍通过既有回归；真实公开仓库 smoke `PUBLIC_REPO_SMOKE_OK` 且 report evidence QA citation 通过。
Risks: 该缓存降低单次 ranking CPU，不替代正式 benchmark；后续仍需真实 provider、embedding/vector retrieval 和更大样本仓库验证。
Dependencies: P6-P11-CODE-QA-ROUTE-RANKING-PREFILTER-20260707, public repo smoke.
Status: DONE / LIVE PUBLIC REPO SMOKE PASS
```

```text
ID: P6-P11-WEAK-KEYWORD-ROLE-INTENT-ORDER-20260707
Title: Weak keyword role-intent ordering for Code QA retrieval
Owner: 梁文峰 / Data-AI Engineer, 比尔盖茨 / Backend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval quality / weak keyword fallback / regression gate
Priority: P0
User value: 弱关键词问题在没有 embedding 或关键词信号偏弱时，不能只返回“某个代码文件”，而必须按问题意图优先命中正确代码层，例如安全/工具策略优先 Service，数据加载优先 Data Access。
Scope: `CodeChunkRanker.java`, `CodeChunkServiceTest.java`, focused static gates, agent activity log.
Non-goals: 不把 no-embedding `INCONCLUSIVE` 改成 OK，不证明真实 provider 质量，不引入向量数据库，不刷新 full release authority。
Acceptance: operational policy 问法首个 role intent 为 `SERVICE` 且包含 `CONFIG/CONTROLLER`；data loading 问法首个 role intent 为 `DATA_ACCESS` 且包含 `SERVICE/CONFIG`；CONFIG path 证据不再被泛化为 `SOURCE`；focused tests 和 static gates PASS；QA 子 agent 只读复核 PASS。
Risks: 这是 deterministic role-intent ordering，不等于完整自然语言 query planner；真实 embedding/vector retrieval、多仓库 benchmark 和 provider E2E 仍是后续 P6/P12-pre 范围。
Dependencies: P6 weak keyword intent fallback, P6 semantic readiness, Code QA retrieval plan.
Status: DONE / FOCUSED ROLE-INTENT ORDERING PASS
```

```text
ID: P6-P11-RETRIEVAL-QUALITY-MATRIX-20260707
Title: Bounded public repo retrieval quality matrix and evidence type correction
Owner: 梁文峰 / Data-AI Engineer, 比尔盖茨 / Backend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval quality / public repo smoke / release evidence guard
Priority: P0
User value: P6 不能只靠单测判断完成，必须用真实公开仓库证明扫描、code_chunks、Code QA、弱关键词、semantic pool probe、report evidence QA citation 和 artifact quality 能一起通过。
Scope: `CodeChunkRanker.java`, `CodeChunkServiceTest.java`, `p6-code-qa-retrieval-eval-cases.json`, `public-repo-analysis-smoke.sh`, `p6-retrieval-quality-matrix.sh`, Makefile, P6/P11 docs.
Non-goals: 不声明完整 benchmark，不证明真实 provider 答案质量，不引入向量数据库，不刷新 full release authority。
Acceptance: 单仓 `LJunP/Pawnshop-Management-System.git` bounded matrix 输出 `P6_RETRIEVAL_QUALITY_MATRIX_OK`；弱关键词样本与 Pawnshop 仓库真实领域对齐；semantic probe 使用可控 embedding 集合；前端静态资源、构建文件、JS/TS command/model 源码不得误判为后端 CONFIG/DOMAIN_MODEL。
Risks: 当前 matrix 是 bounded single-repo gate；P6 仍需多仓库矩阵、真实 provider/embedding provider E2E 和 UI 主链路体验收口。
Dependencies: P6 weak keyword role-intent ordering, public repo smoke, release evidence verifier.
Status: DONE / SINGLE-REPO MATRIX PASS
```

```text
ID: P6-P11-JAVA-PARSER-LANGUAGE-LEVEL-20260707
Title: JavaParser Java 14+ language compatibility and pattern variable CALLS coverage
Owner: 梁文峰 / Data-AI Engineer, 比尔盖茨 / Backend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Code understanding / Java AST parser / public repo smoke regression
Priority: P0
User value: 真实公开 Java/Spring 仓库不能因为 Java 14+ `instanceof pattern` 等现代语法导致 AST 文件级解析失败；pattern variable 上的方法调用也应该进入 CALLS relation，提升 code graph、QA citation 和 report evidence 的代码理解基础。
Scope: `JavaAstParser.java`, `JavaAstParserTest.java`, focused P6 backend tests, spring-petclinic public repo smoke.
Non-goals: 不升级 javaparser 依赖版本，不声明完整 Java 21 语法覆盖，不引入 symbol solver，不证明真实 LLM provider answer quality。
Acceptance: Java parser 使用支持 Java 14+ 的 language level；`instanceof RuntimeException runtimeException` fixture 可解析并产出 method symbol；pattern variable `runtimeException.getMessage()` 产出 `java.lang.RuntimeException#getMessage()` CALLS relation；spring-petclinic public repo smoke PASS 且不再出现 JavaParser `ParseProblemException`。
Risks: JavaParser `JAVA_21` 只覆盖当前库支持的语法范围；record pattern、sealed、switch pattern 等更复杂现代 Java 语义仍需要后续仓库样本和 focused tests 扩展。
Dependencies: P6 two-repo retrieval matrix, Java AST raw graph closure, public repo smoke.
Status: DONE / LIVE SPRING-PETCLINIC PARSER COMPATIBILITY PASS / QA PASS
```

```text
ID: P6-P11-JAVA-AST-PARSE-DIAGNOSTICS-20260707
Title: Java AST parse diagnostics in RAW_SCAN_RESULT and public repo smoke gate
Owner: 梁文峰 / Data-AI Engineer, 比尔盖茨 / Backend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Code understanding observability / raw scan contract / release evidence guard
Priority: P0
User value: Java AST parser 不能在文件解析失败时只打日志而让 smoke 继续通过；RAW_SCAN_RESULT 必须暴露 Java AST 解析总数、成功数、失败数和失败路径，公开仓库 smoke 必须在失败数大于 0 时 fail-closed。
Scope: `JavaAstParser.java`, `JavaFallbackAnalyzer.java`, `JavaAstParserTest.java`, `JavaFallbackAnalyzerTest.java`, `public-repo-analysis-smoke.sh`, `API_DESIGN.md`, P6/P11 docs.
Non-goals: 不引入完整 symbol solver，不改变扫描任务状态机，不因为任意第三方仓库坏源码直接定义生产不可用策略；本轮只把诊断和 smoke gate 做实。
Acceptance: `ParseResult` 暴露 `parseSucceeded/parseErrorMessage`；raw scan 暴露 `java_ast_diagnostics`；坏 Java fixture 输出 `PARTIAL` 和失败路径；public repo smoke 校验 `failed_java_files=0,status=OK`；spring-petclinic smoke marker 输出 `javaAstDiagnostics.status=OK,totalJavaFiles=48,parsedJavaFiles=48,failedJavaFiles=0`。
Risks: 对包含故意坏源码或生成中间文件的仓库，public repo smoke 会 fail-closed；后续若需要容忍特定路径，必须显式增加 allowlist 规则和风险记录。
Dependencies: P6-P11-JAVA-PARSER-LANGUAGE-LEVEL-20260707, public repo smoke, RAW_SCAN_RESULT artifact.
Status: DONE / LIVE SPRING-PETCLINIC JAVA AST DIAGNOSTICS PASS
```

```text
ID: P6-P11-RETRIEVAL-MATRIX-JAVA-AST-DIAGNOSTICS-GATE-20260707
Title: P6 retrieval quality matrix Java AST diagnostics gate
Owner: 梁文峰 / Data-AI Engineer, 比尔盖茨 / Backend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval quality matrix / raw scan contract / release evidence guard
Priority: P0
User value: P6 多仓库质量矩阵不能只校验 code_chunks 和 Code QA，还必须证明 Java 仓库的 AST 文件级解析没有隐藏失败，避免报告引用质量建立在不完整代码图谱上。
Scope: `public-repo-analysis-smoke.sh`, `p6-retrieval-quality-matrix.sh`, P6/P11 docs.
Non-goals: 不新增仓库样本，不声明完整 benchmark，不证明真实 LLM provider 或真实 embedding provider 质量，不刷新 full release authority。
Acceptance: `PUBLIC_REPO_SMOKE_OK.rawScanContract.javaAstDiagnostics` 带出 `failedFilePaths`；matrix 校验 Java diagnostics 字段、计数自洽、`status=OK` 和 `failedJavaFiles=0`；`generic-java` profile 必须有 Java 文件诊断；最终 marker 输出 `javaAstDiagnosticsRepoCount`；默认双仓 matrix PASS。
Risks: 当前 matrix 仍是 bounded two-repo gate，不是生产 benchmark；后续新增语言和仓库样本时需要扩展 profile 规则。
Dependencies: P6-P11-JAVA-AST-PARSE-DIAGNOSTICS-20260707, public repo smoke, raw scan contract.
Status: DONE / TWO-REPO MATRIX JAVA AST DIAGNOSTICS PASS
```

```text
ID: P6-P11-THREE-REPO-RETRIEVAL-MATRIX-LIBRARY-PROFILE-20260707
Title: Three-repo P6 retrieval matrix with generic Java library profile
Owner: 梁文峰 / Data-AI Engineer, 比尔盖茨 / Backend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval quality matrix / library repo coverage / public repo smoke gate
Priority: P0
User value: P6 matrix 不能只覆盖业务管理系统和 Spring Web 应用，还必须覆盖无 Controller/API/DB 的纯 Java library 仓库，证明 code_chunks、Code QA、Java AST diagnostics 和 artifact quality 在不同项目形态下仍能工作。
Scope: `public-repo-analysis-smoke.sh`, `p6-retrieval-quality-matrix.sh`, Apache Commons CLI public repo smoke, P6/P11 docs.
Non-goals: 不声明完整 benchmark，不证明真实 LLM/embedding provider 质量，不强制 Java library 仓库拥有 Web/API 分层，不刷新 full release authority。
Acceptance: 默认 matrix 增加 `apache-commons-cli|https://github.com/apache/commons-cli.git|master|generic-java-library`；`generic-java-library` profile 使用库领域查询并禁用 Web/API 专用强探针；默认 matrix 输出 `repoCount=3`、`profileCounts.default-strong=1`、`profileCounts.generic-java=1`、`profileCounts.generic-java-library=1`、`javaAstDiagnosticsRepoCount=3`；commons-cli `87/87` Java files parsed，Code QA citation 和 artifact quality PASS。
Risks: commons-cli cross-file proof 当前仍偏向 TEST 文件，虽然 source-role query 首个结果已命中 `src/main/java/.../DefaultParser.java`；后续需要继续优化 library production-source ranking。
Dependencies: P6-P11-RETRIEVAL-MATRIX-JAVA-AST-DIAGNOSTICS-GATE-20260707, public repo smoke, Code QA citation gate.
Status: DONE / THREE-REPO MATRIX PASS / LIBRARY TEST-DOMINANCE RISK RECORDED
```

```text
ID: P6-P11-LIBRARY-PRODUCTION-SOURCE-RANKING-20260707
Title: Java library retrieval production-source ranking and smoke gate
Owner: 梁文峰 / Data-AI Engineer, 比尔盖茨 / Backend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval quality / ranking / public repo smoke gate
Priority: P0
User value: P6 纯 Java library 仓库不能由 TEST 文件凑出 cross-file proof；当用户查询 `src/main/java` 和库源码领域问题时，结果必须稳定优先返回生产源码，并且 smoke gate 必须能阻止 TEST 主导的假通过。
Scope: `CodeLocationHintParser.java`, `CodeChunkRanker.java`, `CodeChunkServiceTest.java`, `public-repo-analysis-smoke.sh`, `p6-retrieval-quality-matrix.sh`, P6/P11 docs.
Non-goals: 不全局排除测试文件，不破坏显式 test query，不引入向量数据库，不声明完整 benchmark，不证明真实 LLM provider 事实质量。
Acceptance: 裸 `src/main/java` 可作为 source-root hint；非 TEST 意图下 `src/test` 不再吃 primary source boost 并被稳定降权；显式 `DefaultParserTest test file` 仍能优先命中 TEST；commons-cli 单仓 smoke 输出 `mainSourceUniqueFiles >= 2`；默认三仓 matrix PASS。
Risks: 该修复覆盖 Java library source-root ranking 和 smoke gate，不等于完整 semantic query planner；后续仍需扩大仓库样本并接入真实 embedding/provider E2E。
Dependencies: P6-P11-THREE-REPO-RETRIEVAL-MATRIX-LIBRARY-PROFILE-20260707, public repo smoke, Code QA citation gate.
Status: DONE / THREE-REPO MATRIX PASS / LIBRARY PRODUCTION-SOURCE GATE PASS
```

```text
ID: P6-P11-FIVE-REPO-JS-TS-MATRIX-20260707
Title: Five-repo P6 retrieval matrix with JS/TS web and library profiles
Owner: 梁文峰 / Data-AI Retrieval Engineer, 比尔盖茨 / Backend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval quality matrix / multi-language public repo gate / code understanding evidence
Priority: P0
User value: P6 不能只证明 Java/Spring/Java library 可用；公开仓库分析主链路必须覆盖 JS/TS web framework 和 JS/TS library，防止 Java-only profile 假装多语言泛化。
Scope: `p6-retrieval-quality-matrix.sh`, `public-repo-analysis-smoke.sh`, `CodeChunkRanker.java`, `CodeChunkServiceTest.java`, P6/P11 docs.
Non-goals: 不声明完整 benchmark，不证明真实 LLM provider 或 embedding provider 质量，不刷新 full release authority，不要求 JS/TS 仓库有 Java AST diagnostics。
Acceptance: 默认 matrix 至少 5 个唯一公开仓库；profile 覆盖 `default-strong/generic-java/generic-java-library/generic-js-ts-web/generic-js-ts-library`；JS/TS profile 不要求 Java AST；JS/TS cross-file proof 至少 2 个源码文件；matrix marker 输出 `languageFamilyCounts` 和 `jsTsNonJavaProfileCount=2`；默认 5 仓 matrix PASS。
Risks: redux 作为 JS/TS library 候选因 dependency graph 无节点被拒绝，说明候选仓库必须进入失败样本记录；当前仍是 bounded deterministic gate，不是完整语义 benchmark。
Dependencies: P6-P11-LIBRARY-PRODUCTION-SOURCE-RANKING-20260707, public repo smoke, Code QA citation gate.
Status: DONE / FIVE-REPO MATRIX PASS / JS-TS PROFILE GATE PASS
```

```text
ID: P6-P11-MATRIX-PERFORMANCE-CITATION-BUDGET-20260707
Title: P6 retrieval matrix performance budget and QA citation trust gate
Owner: 梁文峰 / Data-AI Retrieval Engineer, 黄仁勋 / DevOps-Performance Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval quality matrix / performance regression gate / citation trust gate
Priority: P0
User value: P6 matrix 不能只证明功能通过，还必须发现耗时膨胀、引用覆盖降级、claim 未绑定和跨 scan 证据污染，避免报告体验和代码问答在质量表面绿灯下退化。
Scope: `p6-retrieval-quality-matrix.sh`, P6/P11 docs, performance benchmark record.
Non-goals: 不做真实 provider benchmark，不扩大仓库样本，不优化具体 ranking 热点，不刷新 full release authority。
Acceptance: matrix 支持 `SOURCELENS_P6_RETRIEVAL_MATRIX_PER_REPO_MAX_SECONDS` 和 `SOURCELENS_P6_RETRIEVAL_MATRIX_TOTAL_MAX_SECONDS`；默认预算单仓 240s、总 600s；marker 输出 `totalDurationSeconds/maxCaseDurationSeconds/performanceBudget`；matrix 要求 Code QA citation 为 `FULL/REQUIRED_FULL`、claim coverage `READY`、cross-file citation summary 当前 scan 且 citation/claim binding 均满足；默认 5 仓 matrix PASS。
Risks: 本轮预算是本地 bounded gate，不等于生产 P95/P99 benchmark；后续仍需真实 provider、向量检索和更大仓库性能基线。
Dependencies: P6-P11-FIVE-REPO-JS-TS-MATRIX-20260707, public repo smoke, Code QA citation gate.
Status: DONE / FIVE-REPO MATRIX PERFORMANCE AND CITATION GATE PASS
```

```text
ID: P6-P11-EXTENDED-RETRIEVAL-MATRIX-PRESET-20260707
Title: Optional eight-repo P6 retrieval matrix preset with Python and CLI coverage
Owner: 梁文峰 / Data-AI Retrieval Engineer, 黄仁勋 / DevOps-Performance Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P6 / P11
Type: Retrieval quality matrix / multi-language public repo gate / optional extended regression
Priority: P0
User value: P6 不能只停留在默认 5 仓日常 gate；阶段验收需要一个更强的可选 extended preset，覆盖 Python Web、JS/TS Web framework 变体和 JS/TS CLI library，证明公开仓库检索质量不是只对 Java/Express/Axios 有效。
Scope: `p6-retrieval-quality-matrix.sh`, Koa/Flask/Commander public repo profile, P6/P11 docs.
Non-goals: 不把 extended preset 设为日常默认，不声明完整生产 benchmark，不证明真实 LLM provider 或真实 embedding provider 质量，不刷新 full release authority。
Acceptance: `SOURCELENS_P6_RETRIEVAL_MATRIX_PRESET=extended` 至少覆盖 8 个唯一公开仓库；新增 `generic-js-ts-web-koa/generic-python-web/generic-js-ts-cli-library`；未知 profile 必须 fail-closed；extended marker 必须输出 `pythonProfileCount >= 1`、`cliLibraryCount >= 1`、`languageFamilyCounts`、`profileCounts`、耗时预算；8 仓 matrix PASS。
Risks: FastAPI 候选因 dependency graph 无节点被拒绝；Chalk 候选 Code QA 偏单文件，未进入强矩阵；当前仍不是真实 provider/vector benchmark。
Dependencies: P6-P11-MATRIX-PERFORMANCE-CITATION-BUDGET-20260707, public repo smoke, Code QA citation gate.
Status: DONE / EXTENDED EIGHT-REPO MATRIX PASS
```

```text
ID: P9-P10-P12-PRODUCT-POSITIONING-ACCESS-MODEL-20260707
Title: SourceLens product positioning, front/back plane split and role-based access model
Owner: 乔布斯 / Product Design, 库克 / Product Operations, 奥特曼 / Security, 比尔盖茨 / Backend, 扎克伯格 / Frontend, 主 agent integration
Phase: P9 / P10 / P12-pre
Type: Product strategy / information architecture / RBAC direction / metrics governance
Priority: P0
User value: 继续推进 P6/P9/P10 前，必须明确 SourceLens 到底服务谁、是否分前后台、页面如何按用户任务组织、权限如何演进、成功指标如何量化，避免项目变成功能堆叠。
Scope: `docs/PRODUCT_POSITIONING_AND_ACCESS_MODEL.md`, README, Product Governance, Product Metrics, Phase Requirements, Decision Register, Handoff.
Non-goals: 不立即实现完整 RBAC schema，不拆两个独立前端应用，不做营销官网，不把企业多租户和私有仓库前置为当前主链路。
Acceptance: 明确 SourceLens 是 Agentic Engineering Intelligence Platform；当前不拆应用，当前实现统一按 `前台体验 / 开发者控制台 / 后台治理` 三平面分层，历史英文 `Developer Workbench / Engineering Governance Console / Admin & Security Console` 仅作为旧别名；目标用户映射到页面、权限、导航、主流程和指标；列出当前不明确项和处理结论；后续 P9/P10/P12 工作以该文档为产品输入。
Risks: 若后续 UI 继续按功能堆叠而不按角色/任务分层，P9 会形成体验债；若 RBAC 长期不落地，私有仓库和企业化不能宣称完成。
Dependencies: P6 public repo main path, P9 UI refactor, P10 security boundary, P12-pre enterprise integration layer.
Status: DONE / PRODUCT DIRECTION LOCKED / IMPLEMENTATION FOLLOW-UP REQUIRED
```

```text
ID: P9-P10-P11-P12-TOP-LEVEL-62-DEFINITIONS-FREEZE-20260707
Title: Freeze SourceLens top-level 62 product operating definitions
Owner: 乔布斯 / Product Design, 库克 / Product Operations, 达里奥 / Quality Gate, 奥特曼 / Security, 主 agent integration
Phase: P9 / P10 / P11 / P12-pre
Type: Product operating model / governance freeze / execution guardrail
Priority: P0
User value: 用户要求一次性把顶级项目还缺的定义全部补齐，避免未来边做边返工；同时要求补完后不要继续无节制补制度，而是回到产品主线开发。
Scope: `docs/TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md`, README, Chairman briefing, operating system, governance, phase requirements, risk, quality, progress, handoff.
Non-goals: 不立即实现 62 项中的全部企业能力，不启动法务/定价/客户成功，不宣称企业化、SaaS 或生产版完成。
Acceptance: 1-62 项完整列出并分成产品工程基础、运营平台化、公司级商业化交付三层；每项有 SourceLens 定版结论、当前状态和归口；封顶规则明确；权威入口和交接文档已同步；code-map-check PASS。
Risks: 如果后续继续扩制度，会拖慢 P6/P9/P10/P11；如果把定义当实现，会误宣称企业版/商业化完成。
Dependencies: PRODUCT_POSITIONING_AND_ACCESS_MODEL, SOURCELENS_OPERATING_SYSTEM, existing governance docs.
Status: DONE / 62 DEFINITIONS FROZEN / RETURN TO PRODUCT MAINLINE
```

```text
ID: P9-THREE-PLANE-NAV-DASHBOARD-NORTH-STAR-20260707
Title: P9 first product-mainline implementation for three-plane navigation and north-star Dashboard
Owner: 乔布斯 / Frontend Product Lead, 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9
Type: Frontend information architecture / Dashboard product metrics / UI readability
Priority: P0
User value: 把 SourceLens 从功能堆叠控制台推进到按 `前台体验 / 开发者控制台 / 后台治理` 三平面组织的产品入口，并让 Dashboard 第一屏回答可信工程闭环走到哪一步；历史英文三平面名只作为旧别名，不再作为当前 UI 文案。
Scope: `web-console/src/components/AppLayout.tsx`, `web-console/src/pages/Dashboard.tsx`, `web-console/src/styles/app.css`, `web-console/tests/app-shell-ui-smoke.spec.ts`, `web-console/tests/dashboard-next-action-smoke.spec.ts`.
Non-goals: 不实现 RBAC，不拆独立后台，不接入真实 provider，不改后端 Dashboard API，不宣称 P9 全部完成。
Acceptance: 侧边栏和移动 Drawer 按三平面分组；顶部显示当前产品平面并在窄屏折叠；Dashboard 首屏展示 Trusted Engineering Loop Completion Rate、四阶段闭环状态、产品指标条和下一步行动；320/390/1440 smoke 无裁切和横向溢出；前端 build PASS。
Risks: 北极星指标当前由现有 Dashboard 数据派生，不是独立指标存储；RBAC 未落地时三平面仍是信息架构分层而非权限隔离。
Dependencies: PRODUCT_POSITIONING_AND_ACCESS_MODEL, FRONTEND_DESIGN_SYSTEM, app shell and dashboard smoke suites.
Status: DONE / P9 FIRST SLICE PASS / FOLLOW-UP REQUIRED FOR RBAC AND METRICS API
```

```text
ID: P9-PROJECT-DETAIL-TRUSTED-LOOP-20260707
Title: ProjectDetail trusted engineering loop information architecture
Owner: 乔布斯 / Frontend Product Lead, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9
Type: Frontend information architecture / Developer Workbench / app-shell UI smoke
Priority: P1
User value: 用户进入项目详情后，应直接看到从仓库接入、源码理解、修复候选到安全审计的一条可信主链路，而不是在多个功能 tab 和侧边导航之间猜下一步。
Scope: ProjectDetail trusted loop panel、responsive CSS、app-shell UI smoke explicit guard、必要阶段记录。
Non-goals: 不改后端 API、RBAC、真实指标持久化、ScanTaskDetail 信息架构或 release evidence schema。
Acceptance: ProjectDetail 显示 F1/F2/F4/F5 trusted loop；1440/390/320 三档视口下无横向溢出；app-shell smoke 显式断言面板标题、四个步骤和移动端列数；frontend build PASS。
Risks: 该切片是 ProjectDetail 信息架构增强，不等于 P9 全部完成，也不等于 Admin & Security RBAC 已落地。
Dependencies: P9-THREE-PLANE-NAV-DASHBOARD-NORTH-STAR-20260707。
Status: DONE / FRONTEND BUILD + APP-SHELL SMOKE PASS / QA REVIEW PASS
```

```text
ID: P9-SCAN-TASK-DETAIL-TRUSTED-REPORT-LOOP-20260707
Title: ScanTaskDetail trusted report loop information architecture
Owner: 乔布斯 / Frontend Product Lead, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P11
Type: Frontend information architecture / report evidence UX / smoke marker
Priority: P1
User value: 用户进入扫描报告后，应直接看到报告结论、证据引用、code_chunks、修复候选和审计治理的可信闭环，而不是把报告复盘理解为静态阅读。
Scope: ScanTaskDetail trusted report loop panel、responsive CSS、report-evidence-drawer smoke explicit guard、必要阶段记录。
Non-goals: 不改后端 API、RBAC、真实指标持久化、AutoRepair 后端逻辑或 release evidence schema。
Acceptance: ScanTaskDetail 报告总览显示 T1/T2/T3/T4/T5 trusted report loop；1440/390/320 三档视口下无横向溢出；report-evidence smoke marker 输出 `trustedReportLoop.surface=SCAN_TASK_DETAIL_TRUSTED_REPORT_LOOP`、5 个步骤、desktop 5 列、390/320 单列；frontend build PASS。
Risks: 该切片是 ScanTaskDetail 信息架构增强，不等于 P9 全部完成，也不等于修复候选、审计治理或 RBAC 后端能力完成。
Dependencies: P9-PROJECT-DETAIL-TRUSTED-LOOP-20260707, report-evidence-drawer smoke。
Status: DONE / FRONTEND BUILD + REPORT-EVIDENCE SMOKE PASS / QA REVIEW PASS
```

```text
ID: P9-DASHBOARD-API-BACKED-TRUSTED-LOOP-METRICS-20260707
Title: Dashboard API-backed trusted loop metrics
Owner: 比尔盖茨 / Backend Engineer, 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P11
Type: Dashboard API contract / frontend product metrics / smoke marker
Priority: P1
User value: Dashboard 的 Trusted Engineering Loop 不应长期只由前端本地推导；用户需要看到北极星指标来自后端 API 合同，并在 API 异常时有明确 fallback。
Scope: `/api/dashboard/stats` trusted loop 指标字段、ScanStat 计算、Dashboard 前端优先 API 接入、dashboard-next-action smoke API-backed/fallback marker。
Non-goals: 不新增数据库表、不做独立指标仓库、不改 release evidence schema、不实现 RBAC 或生产 SLO。
Acceptance: `/api/dashboard/stats` 返回 trustedLoopCompletionRate/status/statusLabel/readyStages/totalStages/reportEvidenceReady/codeQaReadiness/recoverySignal/trustedLoopMetricsSource；Dashboard 显示 `API-backed metrics`，请求失败和旧 stats 成功但缺新字段场景显示 `client fallback`；focused backend tests、frontend build、dashboard smoke、app-shell smoke PASS。
Risks: 该切片把北极星指标推进到 API 合同，但仍未进入持久化指标仓库、release evidence package 或生产级指标口径。
Dependencies: P9-THREE-PLANE-NAV-DASHBOARD-NORTH-STAR-20260707。
Status: DONE / BACKEND FOCUSED TEST + FRONTEND BUILD + DASHBOARD SMOKE + APP-SHELL SMOKE PASS / QA REVIEW PASS
```

```text
ID: P11-DASHBOARD-METRICS-SOURCE-RELEASE-VERIFIER-20260707
Title: Dashboard metrics source release verifier gate
Owner: 黄仁勋 / DevOps Engineer, 达里奥 / Quality Gate, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P11 / P9
Type: Release evidence verifier / dashboard marker contract / forged marker regression
Priority: P1
User value: Dashboard Trusted Engineering Loop 指标进入 API 合同后，发布证据也必须证明指标来源，不允许 release evidence 只验证 7 个分支和截图却漏掉 API-backed/fallback 来源。
Scope: `scripts/verify-release-evidence.sh` Dashboard marker 校验、`scripts/security-regression-check.sh` valid fixture 和 forged variants、必要阶段记录。
Non-goals: 不改 release evidence 执行命令、不新增 smoke step、不改 Dashboard UI、不改后端 API、不做生产 SLO。
Acceptance: `OK dashboard-next-action-ui-smoke` 必须证明 `dashboardStatsApiSignals.sourceLabelSelector`、6 个 API-backed cases、`recover-dashboard` fallback case、`legacy-stats-without-api-fields` fallback；security regression 必须拒绝缺 dashboardStatsApiSignals、缺 API-backed case、缺 fallback case、缺 legacy fallback、错误 selector 的 forged marker；bash syntax、focused security suite、code-map、diff check PASS。
Risks: 这是发布证据 gate 强化，不等于完整 release evidence inventory、生产指标存储或 Dashboard 指标进入所有发布包。
Dependencies: P9-DASHBOARD-API-BACKED-TRUSTED-LOOP-METRICS-20260707, dashboard-next-action-ui-smoke。
Status: DONE / VERIFIER PATCHED + SECURITY REGRESSION PASS / QUALITY GATE PARTIAL FIXED
```

```text
ID: P11-RELEASE-EVIDENCE-INVENTORY-DASHBOARD-METRICS-SOURCE-20260707
Title: Release evidence inventory Dashboard metrics source evidence
Owner: 黄仁勋 / DevOps Engineer, 达里奥 / Quality Gate, 主 agent integration
Phase: P11 / P9
Type: Release evidence inventory / dashboard marker observability / self-test
Priority: P1
User value: release evidence 目录不能只分类包状态，也要能盘点 Dashboard Trusted Engineering Loop 指标来源证据，明确旧包是否缺 API-backed/fallback marker。
Scope: `scripts/release-evidence-inventory.mjs`, `scripts/release-evidence-inventory-self-test.mjs`, `Makefile`, 必要阶段记录。
Non-goals: 不移动、不删除、不归档 release-evidence；不生成新 release evidence 包；不改 Dashboard smoke、verifier、UI 或后端 API。
Acceptance: inventory JSON 为每个 run 输出 `dashboardMetricsSourceEvidence`；table summary 输出 marker_present/marker_missing/marker_valid/marker_invalid/complete/incomplete；self-test 覆盖完整、缺 dashboardStatsApiSignals、缺 apiBackedCases、缺 source selector、缺 legacy fallback、marker missing、duplicate marker；真实 inventory 不把旧 evidence 误判为完整；DevOps 复核 PASS。
Risks: 当前真实 release-evidence 目录中旧 Dashboard marker 均缺新 `dashboardStatsApiSignals`，因此 complete=0；这暴露旧证据不足，不代表当前 verifier 逻辑失败。
Dependencies: P11-DASHBOARD-METRICS-SOURCE-RELEASE-VERIFIER-20260707。
Status: DONE / INVENTORY + SELF-TEST PASS / DEVOPS PARTIAL FIXED
```

```text
ID: P9-PROJECTS-PORTFOLIO-INTAKE-LOOP-20260707
Title: Projects portfolio trusted intake loop
Owner: 乔布斯 / Frontend Product Lead, 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P11
Type: Developer Workbench information architecture / Projects page UI / app-shell smoke
Priority: P1
User value: Projects 页不能只是项目表格；它必须把项目创建、公开仓库接入、扫描报告、代码问答和修复候选收敛成清晰的组合入口。
Scope: `web-console/src/pages/Projects.tsx`, `web-console/src/styles/app.css`, `web-console/tests/app-shell-ui-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不新增项目选择状态持久化、不实现 RBAC、不刷新 full release evidence。
Acceptance: Projects 页显示 `项目组合可信接入闭环`；P1-P4 覆盖项目壳、公开仓库、扫描报告、代码问答与修复；P2/P3/P4 不在筛选无结果时暗中 fallback 到隐藏项目；CSS 支持 1440 四列、<=1200 两列、<=720 单列；app-shell smoke 断言可见性、4 步、列数和无横向溢出；frontend build、frontend-ui-check、app-shell smoke PASS；Frontend Engineer 二轮 PASS。
Risks: 该切片是 Projects 信息架构入口增强，不等于项目级后端权限、仓库 E2E、真实扫描质量或 P9 全部完成。
Dependencies: P9-THREE-PLANE-NAV-DASHBOARD-NORTH-STAR-20260707, P9-PROJECT-DETAIL-TRUSTED-LOOP-20260707。
Status: DONE / FRONTEND BUILD + UI CHECK + APP-SHELL SMOKE PASS / FRONTEND PARTIAL FIXED
```

```text
ID: P9-AGENT-CHAT-TRUST-WORKBENCH-20260707
Title: AgentChat conversation trust workbench
Owner: 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Developer Workbench information architecture / AgentChat trust loop / smoke marker
Priority: P1
User value: AI 对话页不能只是聊天框；用户发送前必须看到项目上下文、证据输入、工具审计和闭环任务四段可信状态，并能从当前会话回跳审计、AgentTask 和扫描报告。
Scope: `web-console/src/pages/AgentChat.tsx`, `web-console/src/styles/app.css`, `web-console/tests/agent-chat-closure-rail-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不实现真实 LLM provider、不新增 RBAC、不刷新 full release evidence、不声明 P9 全部完成。
Acceptance: AgentChat 显示 `会话可信工作台`；四段覆盖项目上下文、证据输入、工具审计、闭环任务；审计深链只在确认 selectedConversation.projectId 后开放；消息加载具备 stale async response 防护；scan report action 被真实点击并加载 ScanTaskDetail；frontend build、frontend-ui-check、AgentChat smoke PASS；Frontend Engineer 四轮复核 PASS。
Risks: 当前快速切换会话 race 主要靠静态规则和人工复核守住，尚无专门 Playwright race smoke；后续 P11 可补专项 race 场景。
Dependencies: P9-PROJECTS-PORTFOLIO-INTAKE-LOOP-20260707, P9-PROJECT-DETAIL-TRUSTED-LOOP-20260707。
Status: DONE / FRONTEND BUILD + UI CHECK + AGENTCHAT SMOKE PASS / FRONTEND PARTIAL FIXED
```

```text
ID: P9-ARTIFACTS-CUSTODY-CHAIN-20260707
Title: Artifacts custody chain workbench
Owner: 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Developer Workbench information architecture / Artifact governance UI / smoke marker
Priority: P1
User value: 运行产物页不能只展示文件列表；用户必须能看到每个产物从来源绑定、显示脱敏、raw access 审计到报告复盘的责任链。
Scope: `web-console/src/pages/Artifacts.tsx`, `web-console/src/styles/app.css`, `web-console/tests/artifacts-detail-selection-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不改 artifact storage schema、不新增 RBAC、不刷新 full release evidence、不声明 P9/P10/P11 全部完成。
Acceptance: Artifacts 显示 `产物保管责任链`；四段覆盖 `来源绑定`、`显示脱敏`、`Raw Access`、`复盘闭环`；raw download receipt 和无 receipt fallback 都同步到责任链审计入口；desktop/390/320 smoke 证明四段可见、文本可读、响应式列数正确且无横向溢出；frontend build、frontend-ui-check、Artifacts smoke PASS；Frontend Engineer 复核 PASS。
Risks: 该切片强化前端治理可见性和 raw access 审计入口，不等于后端 RBAC、artifact retention 策略、真实生产审计报表或 full release evidence 完成。
Dependencies: P9-AGENT-CHAT-TRUST-WORKBENCH-20260707, RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + ARTIFACTS SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-AUDIT-INVESTIGATION-LOOP-20260707
Title: AuditLogs investigation loop workbench
Owner: 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Governance Console information architecture / audit investigation UI / smoke marker
Priority: P1
User value: 审计日志页不能只是三张表；用户需要看到风险发现、证据脱敏、资源追踪和复盘处置四段调查路径，才能把失败、raw access、工具权限和 webhook 事件转化为可执行治理动作。
Scope: `web-console/src/pages/AuditLogs.tsx`, `web-console/src/styles/app.css`, `web-console/tests/audit-logs-detail-selection-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不实现 RBAC/组织权限、不接生产 SIEM、不声明完整审计覆盖或 full release evidence 完成。
Acceptance: AuditLogs 显示 `审计调查闭环`；四段覆盖 `风险发现`、`证据脱敏`、`资源追踪`、`复盘处置`；desktop/390/320 smoke 证明四段可见、文本可读、响应式列数正确且无横向溢出；保留三源表格、深链、抽屉、raw JSON 显示脱敏、fail-closed 和门禁 smoke；frontend build、frontend-ui-check、AuditLogs smoke PASS；Frontend Engineer 复核 PASS。
Risks: 该切片强化前端审计调查工作台和 smoke 证据，不等于完整后端权限隔离、生产审计平台、全量审计覆盖或 provider/LLM 质量证明。
Dependencies: P9-ARTIFACTS-CUSTODY-CHAIN-20260707, SECURITY_BOUNDARY.md, RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + AUDITLOGS SMOKE PASS / FRONTEND REVIEW PASS
```

```text
ID: P9-MODEL-CONFIG-PROVIDER-GOVERNANCE-LOOP-20260709
Title: ModelConfig provider governance loop workbench
Owner: 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Admin & Security Console information architecture / provider governance UI / smoke marker
Priority: P1
User value: 模型配置页不能只是 provider 表格；用户必须能看到激活配置、密钥边界、Endpoint 风险和下游能力四段门禁，并确认页面不泄露 raw API key、不宣称 provider/LLM 质量。
Scope: `web-console/src/pages/ModelConfig.tsx`, `web-console/src/styles/app.css`, `web-console/tests/model-config-recoverable-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不接真实 LLM provider、不实现 RBAC/组织权限、不刷新 full release evidence、不声明 P9/P10/P11 全部完成。
Acceptance: ModelConfig 显示 `模型供应商治理闭环`；四段覆盖 `激活门禁`、`密钥边界`、`Endpoint 风险`、`下游能力`；Endpoint 风险基于实际 baseUrl 与 provider preset 比对；API Key 表格前端兜底脱敏；desktop/390/320 smoke 证明四段可见、列数正确、文本可读、无横向溢出、raw key 不渲染、无 provider/LLM 过度宣称；frontend build、frontend-ui-check、ModelConfig smoke PASS；Frontend Engineer 二轮复核 PASS。
Risks: 该切片强化前端治理可见性和显示层安全，不等于后端密钥存储审计、provider 真实可用性、额度/SLA、RBAC、生产 LLM provider 或完整 P9/P10/P11。
Dependencies: SECURITY_BOUNDARY.md, THREAT_MODEL.md, FRONTEND_DESIGN_SYSTEM.md, TEST_STRATEGY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + MODEL-CONFIG SMOKE PASS / FRONTEND PARTIAL FIXED
```

```text
ID: P9-AUTOREPAIR-GOVERNANCE-LOOP-20260709
Title: AutoRepair candidate governance loop workbench
Owner: 扎克伯格 / Frontend Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Developer Workbench information architecture / AutoRepair governance UI / patch-ready smoke marker
Priority: P1
User value: AutoRepair 页不能只展示修复任务表和 PATCH_READY 详情；用户必须在页面级别看到候选来源、补丁生成、审查门禁和 PR 出口四段闭环，避免把“已生成 patch”误读成“已验证修复”。
Scope: `web-console/src/pages/AutoRepairs.tsx`, `web-console/src/styles/app.css`, `web-console/tests/patch-ready-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不实现真实自动修复质量判定、不新增 RBAC、不刷新 full release evidence、不声明 P9/P10/P11 全部完成。
Acceptance: AutoRepairs 显示 `自动修复候选治理闭环`；四段覆盖 `候选来源`、`补丁生成`、`审查门禁`、`PR 出口`；文案明确 patch/PR 状态不代表修复正确或 LLM 事实正确；CSS 支持 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；patch-ready smoke 断言四视口、四阶段、列数、文本可读、无横向溢出和不过度宣称；frontend build、frontend-ui-check、patch-ready smoke PASS；Frontend Engineer 二轮复核 PASS。
Risks: 该切片强化 AutoRepair 前端治理可见性和 smoke 证据，不等于后端修复质量证明、真实 LLM provider、安全沙箱完整性、RBAC 或 full release evidence 完成。
Dependencies: P9-MODEL-CONFIG-PROVIDER-GOVERNANCE-LOOP-20260709, SECURITY_BOUNDARY.md, FRONTEND_DESIGN_SYSTEM.md, TEST_STRATEGY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + PATCH-READY SMOKE PASS / FRONTEND PARTIAL FIXED
```

```text
ID: P9-CI-DIAGNOSTICS-GOVERNANCE-LOOP-20260709
Title: CI Diagnostics failure governance loop workbench
Owner: 扎克伯格 / Frontend Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Developer Workbench information architecture / CI failure governance UI / smoke marker
Priority: P1
User value: CI 诊断页不能只展示失败列表和单条详情；用户必须在页面级别看到日志接入、根因证据、修复资格和 AutoRepair 交接四段闭环，避免把诊断建议误读成已验证修复。
Scope: `web-console/src/pages/CiDiagnostics.tsx`, `web-console/src/styles/app.css`, `web-console/tests/ci-diagnostics-detail-selection-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不实现真实 CI provider webhook、不新增 RBAC、不刷新 full release evidence、不声明 P9/P10/P11 全部完成。
Acceptance: CiDiagnostics 显示 `CI 失败诊断治理闭环`；四段覆盖 `日志接入`、`根因证据`、`修复资格`、`AutoRepair 交接`；文案明确显示层脱敏不等于原始日志可外发，诊断完成不等于根因/LLM/修复正确；CSS 支持 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；ci-diagnostics smoke 断言四视口、四阶段、列数、文本可读、无横向溢出和不过度宣称；frontend build、frontend-ui-check、ci-diagnostics smoke PASS；主 agent fallback review PASS。
Risks: 固定岗位子 agent `Kuhn / 019f4442-23cd-7de1-9931-9dc0612dcad5 = 扎克伯格 / Frontend Engineer` 启动后因 Codex 使用额度限制失败，未形成独立岗位 PASS；后续额度恢复可补只读复核。
Dependencies: P9-AUTOREPAIR-GOVERNANCE-LOOP-20260709, FRONTEND_DESIGN_SYSTEM.md, SECURITY_BOUNDARY.md, RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md, TEST_STRATEGY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + CI-DIAGNOSTICS SMOKE PASS / SUBAGENT REVIEW BLOCKED BY USAGE LIMIT / MAIN FALLBACK REVIEW PASS
```

```text
ID: P9-PR-REVIEWS-GOVERNANCE-LOOP-20260709
Title: PR Reviews governance loop workbench
Owner: 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Developer Workbench information architecture / PR review governance UI / smoke marker
Priority: P1
User value: PR 审查页不能只展示审查表和单条详情；用户必须在页面级别看到 PR 输入、风险判定、合并门禁和 AutoRepair 交接四段闭环，避免把 PR 审查完成误读成代码质量、业务正确性或安全性已经被完全证明。
Scope: `web-console/src/pages/PrReviews.tsx`, `web-console/src/styles/app.css`, `web-console/tests/pr-reviews-detail-selection-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不接真实 PR provider、不实现真实 merge 阻断、不创建 AutoRepair 候选 API、不刷新 full release evidence、不声明 P9/P10/P11 全部完成。
Acceptance: PrReviews 显示 `PR 审查治理闭环`；四段覆盖 `PR 输入`、`风险判定`、`合并门禁`、`AutoRepair 交接`；文案明确 PR 审查完成不等于代码质量/业务正确性/安全性完全证明，合并和修复候选仍需测试、人工 review、CI 和审计复盘；CSS 支持 desktop 4 列、1024 tablet 2 列、390/320 mobile 1 列；pr-reviews smoke 断言四视口、四阶段、列数、文本可读、AutoRepair 交接 URL、无横向溢出和不过度宣称；frontend build、frontend-ui-check、PrReviews smoke PASS；Frontend Engineer 只读复核 PASS；QA Engineer 明确该 smoke 仅证明前端治理闭环，不证明业务 E2E。
Risks: 该切片强化 PR Reviews 前端治理可见性和 URL 交接证据，不等于真实 PR provider、后端 merge gate、风险分析正确性、AutoRepair API 创建、RBAC 或 full release evidence 完成。
Dependencies: P9-CI-DIAGNOSTICS-GOVERNANCE-LOOP-20260709, FRONTEND_DESIGN_SYSTEM.md, SECURITY_BOUNDARY.md, TEST_STRATEGY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + PR-REVIEWS SMOKE PASS / FRONTEND REVIEW PASS / QA PARTIAL BOUNDARY RECORDED
```

```text
ID: P9-DASHBOARD-THREE-PLANE-PRODUCT-STRUCTURE-20260709
Title: Dashboard three-plane product structure map
Owner: 乔布斯 / Product Manager, 扎克伯格 / Frontend Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Dashboard information architecture / front-office developer-console back-office product plane UI / smoke marker
Priority: P0
User value: Dashboard 不能只显示指标和下一步动作；用户必须直接看到 SourceLens 的前台体验、开发者控制台和后台治理三平面结构，以及每个平面对应的页面入口、当前状态和下一步动作。
Scope: `web-console/src/pages/Dashboard.tsx`, `web-console/src/styles/app.css`, `web-console/tests/dashboard-next-action-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不实现 RBAC/多租户/组织权限、不改真实导航权限、不刷新 full release evidence、不声明三平面产品全部完成。
Acceptance: Dashboard 显示 `SourceLens 三平面产品结构`；三段覆盖 `前台体验`、`开发者控制台`、`后台治理`；每段显示目标页面入口、状态值、说明和动作；文案明确后台治理不等于 RBAC、多租户或生产部署已完成；CSS 支持 desktop 3 列、1024 tablet 2 列、390/320 mobile 1 列；dashboard next-action smoke 覆盖 7 个状态分支 × 4 视口，断言三平面可见、列数正确、文本可读、动作存在、无横向溢出且无 RBAC/生产部署过度宣称；TypeScript、frontend build、frontend-ui-check、dashboard-next-action smoke PASS；子 agent 因额度限制未形成独立 PASS，主 agent fallback review 记录边界。
Risks: 该切片只落地 Dashboard 三平面产品结构入口，不等于路由级权限、后台管理系统、多用户协作、生产部署或商业化体系完成。
Dependencies: TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md, PRODUCT_POSITIONING_AND_ACCESS_MODEL.md, FRONTEND_DESIGN_SYSTEM.md, TEST_STRATEGY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + DASHBOARD SMOKE PASS / SUBAGENT REVIEW BLOCKED BY USAGE LIMIT / MAIN FALLBACK REVIEW PASS
```

```text
ID: P9-APP-SHELL-THREE-PLANE-NAVIGATION-20260709
Title: AppLayout global three-plane navigation contract
Owner: 乔布斯 / Product Manager, 扎克伯格 / Frontend Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: App shell information architecture / front-office developer-console back-office navigation / smoke marker
Priority: P0
User value: Dashboard 的三平面结构必须进入全局路由和导航层；用户在任何核心页面都应能看到当前页面属于前台体验、开发者控制台还是后台治理，移动端抽屉也必须按同一结构组织。
Scope: `web-console/src/components/AppLayout.tsx`, `web-console/tests/app-shell-ui-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不实现 RBAC/多租户/组织权限、不拆独立前后台应用、不改真实路由权限、不刷新 full release evidence、不声明三平面产品全部完成。
Acceptance: AppLayout 定义 `ProductPlane` 三类；routeMeta 为每条核心路由设置 plane；侧边栏和移动 Drawer 按 `前台体验`、`开发者控制台`、`后台治理` 分组；顶部显示当前 route plane 并在窄屏按现有规则折叠；app-shell smoke 覆盖 13 条核心路由 × 1440/390/320 三档 viewport，断言 route-to-plane 映射、390/320 移动 Drawer 三组、390/320 topbar plane 折叠、无横向溢出、无错误 toast 和无 RBAC/完整后台/生产部署过度宣称；`validate-frontend-ui.mjs` 静态钉住 AppLayout 源码、smoke marker、旧英文分组禁止项；TypeScript、frontend build、frontend-ui-check、app-shell smoke PASS；Product Manager 与 Frontend Engineer 二轮复核 PASS。
Risks: 该切片只落地全局信息架构和导航可见性，不等于后台权限隔离、企业 RBAC、多用户协作、生产部署、商业化体系或完整 release evidence 完成。
Dependencies: P9-DASHBOARD-THREE-PLANE-PRODUCT-STRUCTURE-20260709, TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md, PRODUCT_POSITIONING_AND_ACCESS_MODEL.md, FRONTEND_DESIGN_SYSTEM.md, TEST_STRATEGY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + APP-SHELL SMOKE PASS / PRODUCT + FRONTEND REVIEW PASS
```

```text
ID: P9-ISSUE-DECOMPOSITION-GOVERNANCE-LOOP-20260709
Title: IssueDecomposition developer-control-plane governance loop
Owner: 乔布斯 / Product Manager, 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Developer control plane information architecture / issue planning governance UI / smoke marker
Priority: P1
User value: Issue 拆解页不能只展示需求列表、计划信号和子任务表；用户必须在页面级别看到需求输入、任务拆解、验收门禁和执行交接四段闭环，避免把“已拆解”误读为“已实现、已测试或 LLM 判断正确”。
Scope: `web-console/src/pages/IssueDecomposition.tsx`, `web-console/src/styles/app.css`, `web-console/tests/issue-decomposition-detail-selection-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不改变 Issue 拆解算法、不实现真实任务执行、不实现 CI/PR/AutoRepair E2E、不刷新 full release evidence、不声明 P9/P10/P11 全部完成。
Acceptance: IssueDecomposition 显示 `Issue 拆解治理闭环`；四段覆盖 `需求输入`、`任务拆解`、`验收门禁`、`执行交接`；文案明确拆解结果只能作为开发计划证据，不能证明实现、测试、CI、PR 或 LLM 判断正确；CSS 支持 1440 四列、1024 两列、390/320 单列；issue-decomposition smoke 覆盖 1440/1024/390/320 四档 viewport，断言四阶段、列数、文本可读、无横向溢出、无过度宣称，并保留可访问选择、任务状态隔离、delayed completed issue tasks stale response rejection、复制/导出脱敏；TypeScript、frontend build、frontend-ui-check、focused smoke PASS；Product/Frontend/QA 只读复核 PASS。
Risks: 该切片强化 IssueDecomposition 前端治理可见性和 smoke 证据，不等于真实 LLM 拆解质量、任务执行正确性、CI/PR/AutoRepair 交接落库、后端权限、RBAC 或 full release evidence 完成。
Dependencies: P9-APP-SHELL-THREE-PLANE-NAVIGATION-20260709, FRONTEND_DESIGN_SYSTEM.md, SECURITY_BOUNDARY.md, TEST_STRATEGY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + ISSUE-DECOMPOSITION SMOKE PASS / PRODUCT + FRONTEND + QA REVIEW PASS
```

```text
ID: P9-EXECUTION-TASKS-LIFECYCLE-GOVERNANCE-LOOP-20260709
Title: ExecutionTasks lifecycle governance loop workbench
Owner: 乔布斯 / Product Manager, 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Developer control plane information architecture / execution pipeline lifecycle governance UI / smoke marker
Priority: P1
User value: 执行任务中心不能只展示任务列表、pipeline signal、详情和动作门禁；用户必须在页面级别看到来源接入、调度控制、证据采集和复盘交接四段执行生命周期，避免把任务状态误读为真实执行质量、产物正确或 LLM/CI/PR/AutoRepair 结果正确。
Scope: `web-console/src/pages/ExecutionTasks.tsx`, `web-console/src/styles/app.css`, `web-console/tests/execution-tasks-detail-selection-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不改变任务状态机、不实现真实执行器质量证明、不实现 CI/PR/AutoRepair E2E、不刷新 full release evidence、不声明 P9/P10/P11 全部完成。
Acceptance: ExecutionTasks 显示 `执行生命周期治理闭环`；四段覆盖 `来源接入`、`调度控制`、`证据采集`、`复盘交接`；文案明确执行任务闭环只能证明任务状态、来源、步骤、日志和产物入口可追踪，不能证明真实执行质量、产物正确、CI/PR/AutoRepair 或 LLM 结果正确；CSS 支持 1440 四列、1024 两列、390/320 单列；execution-tasks smoke 覆盖 1440/1024/390/320 四档 viewport，断言四阶段、列数、标题/状态/说明文本可读、无横向溢出、无过度宣称，并保留可访问选择、动作门禁、表格 scroller、日志脱敏；详情请求序列防止同任务旧 refresh 和旧 explicit load 覆盖新的 cancel 结果，且 cancel 会清理 detailLoading；TypeScript、frontend build、frontend-ui-check、focused smoke PASS；Product/Frontend/QA 只读复核 PASS。
Risks: 该切片强化 ExecutionTasks 前端治理可见性和 smoke 证据，不等于真实任务执行正确性、产物质量、CI/PR/AutoRepair 成功、后端权限、RBAC 或 full release evidence 完成。
Dependencies: P9-APP-SHELL-THREE-PLANE-NAVIGATION-20260709, P9-EXECUTION-TASKS-ACTION-GATE-REASON-VISIBILITY-20260707, FRONTEND_DESIGN_SYSTEM.md, TEST_STRATEGY.md, SECURITY_BOUNDARY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + EXECUTION-TASKS SMOKE PASS / PRODUCT + FRONTEND + QA REVIEW PASS
```

```text
ID: P9-AGENT-TASKS-LIFECYCLE-GOVERNANCE-LOOP-20260709
Title: AgentTasks lifecycle governance loop workbench
Owner: 乔布斯 / Product Manager, 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Developer control plane information architecture / Agent task governance UI / smoke marker
Priority: P1
User value: AgentTasks 不能只展示任务列表、详情、动作门禁和 payload safety；用户必须在页面级别看到任务入口、执行控制、工具证据和复盘交接四段闭环，避免把 Agent 状态、步骤或工具调用误读为模型判断正确、工具输出真实或修复/PR/CI 结果正确。
Scope: `web-console/src/pages/AgentTasks.tsx`, `web-console/src/styles/app.css`, `web-console/tests/agent-tasks-detail-selection-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不改变 Agent 执行器、不实现真实 LLM/provider 质量证明、不实现工具输出真实性证明、不实现 CI/PR/AutoRepair E2E、不刷新 full release evidence、不声明 P9/P10/P11 全部完成。
Acceptance: AgentTasks 显示 `Agent 任务治理闭环`；四段覆盖 `任务入口`、`执行控制`、`工具证据`、`复盘交接`；文案明确 Agent 任务闭环只能证明任务元数据、步骤、对话、扫描报告和产物入口可追踪，不能证明模型判断正确、工具输出真实、修复/PR/CI 结果正确；CSS 支持 1440 四列、1024 两列、390/320 单列；agent-tasks smoke 覆盖 1440/1024/390/320 四档 viewport，断言四阶段、列数、标题/状态/说明文本可读、无横向溢出、无过度宣称，并保留可访问选择、动作门禁、表格 scroller、payload safety、步骤输出 safety；`fetchSteps` 使用 request sequence 拒绝 stale step response；TypeScript、frontend build、frontend-ui-check、focused smoke PASS；Product/Frontend/QA 只读复核 PASS。
Risks: 该切片强化 AgentTasks 前端治理可见性和 smoke 证据，不等于真实 LLM 判断正确、工具输出真实、Agent 执行器正确、CI/PR/AutoRepair 成功、后端权限、RBAC 或 full release evidence 完成。
Dependencies: P9-APP-SHELL-THREE-PLANE-NAVIGATION-20260709, P9-AGENT-TASKS-ACTION-GATE-REASON-VISIBILITY-20260707, FRONTEND_DESIGN_SYSTEM.md, TEST_STRATEGY.md, SECURITY_BOUNDARY.md, RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + AGENT-TASKS SMOKE PASS / PRODUCT + FRONTEND + QA REVIEW PASS
```

```text
ID: P9-DASHBOARD-EXECUTIVE-BRIEFING-QA-ENTRY-20260710
Title: Dashboard executive briefing and single AgentChat QA entry
Owner: 乔布斯 / Product Manager, 扎克伯格 / Frontend Engineer, 主 agent integration
Phase: P9 / P6 / P11
Type: Dashboard information architecture / executive decision surface / QA entry consistency / smoke marker
Priority: P1
User value: Dashboard 不能只展示北极星指标、三平面入口和下一步行动；董事长/管理层视角必须看到阶段进度、质量状态、风险阻塞和下一步投入，同时普通用户和研发用户不能在 Dashboard 被分流到两套“代码问答”入口。
Scope: `web-console/src/pages/Dashboard.tsx`, `web-console/src/styles/app.css`, `web-console/tests/dashboard-next-action-smoke.spec.ts`, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、不新增第 63 项顶层制度、不实现 RBAC/多租户/生产部署/商业化体系、不刷新 full release evidence、不声明 P9 全阶段完成。
Acceptance: Dashboard 显示 `管理层决策简报`；四项信号覆盖 `阶段进度`、`质量状态`、`风险阻塞`、`下一步投入`；文案明确该简报只汇总当前 Dashboard/API/页面证据，不证明 P9 全阶段完成、RBAC 权限隔离落地、生产部署可上线或商业化体系完成；Dashboard QA 主入口统一到 `/agent-chat?handoff=code-understanding&source=DASHBOARD_CODE_QA_ENTRY`，不得继续用 `/projects/:id?tab=qa` 作为主 QA 产品入口；CSS 支持 1440 四列、1024/768 两列、390/320 单列；三平面头部和卡片头在 960px 前单列，Tag 可收缩可换行；dashboard-next-action smoke 覆盖 1440/1024/768/390/320 五档 viewport，断言管理层简报、三平面、QA URL、列数、文本可读、无横向溢出、无过度宣称；TypeScript、frontend build、frontend-ui-check、focused smoke PASS；Product/Frontend 二轮复核 PASS。
Risks: 该切片强化 Dashboard 管理层决策面板和 QA 入口一致性，不等于真实指标权威、RBAC、后台权限隔离、生产部署、商业化体系、full release evidence 或 P9/P6/P11 全部完成。
Dependencies: P9-APP-SHELL-THREE-PLANE-NAVIGATION-20260709, P9/P11 Dashboard metrics source release verifier gate, FRONTEND_DESIGN_SYSTEM.md, TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md, TEST_STRATEGY.md。
Status: DONE / FRONTEND BUILD + UI CHECK + DASHBOARD SMOKE PASS / PRODUCT + FRONTEND REVIEW PASS
```

```text
ID: P11-DASHBOARD-EXECUTIVE-BRIEFING-RELEASE-EVIDENCE-GATE-20260710
Title: Dashboard executive briefing release evidence verifier and inventory gate
Owner: 黄仁勋 / DevOps Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P11 / P9
Type: Release evidence schema / verifier hardening / inventory visibility / forgery regression
Priority: P0
User value: Dashboard 管理层决策简报不能只存在于前端 smoke 输出；发布证据必须证明四类决策信号、五档响应式布局、动作可见性和不过度宣称边界，并能识别缺失、重复或伪造 marker/截图。
Scope: `scripts/verify-release-evidence.sh`, `scripts/release-evidence-inventory.mjs`, `scripts/release-evidence-inventory-self-test.mjs`, `scripts/security-regression-check.sh`, `Makefile`, active runbook and stage records.
Non-goals: 不刷新 full release/nightly authority、不改变 Dashboard 后端数据源、不证明指标业务真实性、不实现 RBAC/生产部署/商业化体系、不新增第 63 项顶层制度。
Acceptance: verifier 精确要求 7 cases x 5 viewports visited coverage；`executiveBriefing` scope、四 signals、signalCount、布局/可读性/动作布尔值正确，四类 overclaim 为 false；`visualEvidence` 精确包含五张唯一 PNG，并校验路径、尺寸、bytes、像素和 viewport 边界；inventory 独立输出 `dashboardExecutiveBriefingEvidence`、`viewportCoverageComplete`、`visualEvidenceCoverageComplete`、checks/complete/reason；self-test 和 dashboard marker forgery suite 覆盖缺字段、错误 scope/signal/count、布局/可读性/action 失败、四类 overclaim、缺/重 screenshot 和错误尺寸；真实 dashboard smoke、syntax、自测、security suite PASS。
Risks: 当前 full authority `release-current-schema-20260705-0610` 早于新 schema，其 Dashboard executive evidence 为 incomplete；后续必须由新 release/nightly run 刷新 authority，本切片不能冒充 full authority 已更新。
Dependencies: P9-DASHBOARD-EXECUTIVE-BRIEFING-QA-ENTRY-20260710, RELEASE_PROCESS.md, TEST_STRATEGY.md, OPERATIONS_RUNBOOK.md, RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md.
Status: DONE / VERIFIER + INVENTORY + SELF-TEST + FORGERY SUITE + REAL DASHBOARD SMOKE PASS / FULL AUTHORITY REFRESH PENDING
```

```text
ID: P9-SCAN-REPORT-ROUTE-PLANE-HANDOFF-20260710
Title: Scan Report route-plane handoff
Owner: 库克 / Project Manager, 扎克伯格 / Frontend Engineer, 主 agent integration
Phase: P9
Type: Route information architecture / Dashboard handoff / app-shell smoke marker
Priority: P0
User value: 用户从 Dashboard 或直接访问 `/scan-tasks` 时，必须看到一致的扫描报告标题、前台体验产品平面和项目父菜单选择，避免同一入口被解释为不同产品区域。
Scope: `web-console/src/components/AppLayout.tsx`, `web-console/src/pages/Dashboard.tsx`, app-shell/dashboard smoke, `scripts/validate-frontend-ui.mjs`, 必要阶段记录。
Non-goals: 不改后端 API、扫描业务语义、RBAC、组织权限、生产部署或 full release evidence authority。
Acceptance: `/scan-tasks` topbar=`扫描报告`、plane=`前台体验`、`/projects` 父菜单选中；marker `P9_SCAN_REPORT_ROUTE_PLANE_HANDOFF_OK` 记录 `dashboardHandoff=10`、`directLoad=3`、`viewports=1440/390/320`、`mobileDrawerSelected=true`、`runtimeIssues=0`、`horizontalOverflow=true`；app-shell smoke `1 passed`、dashboard smoke `1 passed`、UI validator 和 frontend build PASS。
Risks: 该切片只证明路由、导航与 handoff 合同，不等于扫描结果正确、权限隔离完成、P9 全阶段完成或 current full authority 有效。
Dependencies: P9-APP-SHELL-THREE-PLANE-NAVIGATION-20260709, P9-DASHBOARD-THREE-PLANE-PRODUCT-STRUCTURE-20260709, FRONTEND_DESIGN_SYSTEM.md, TEST_STRATEGY.md。
Status: DONE / APP-SHELL SMOKE + DASHBOARD SMOKE + UI VALIDATOR + FRONTEND BUILD PASS
```

```text
ID: P11-DASHBOARD-PRODUCT-PLANE-MAP-RELEASE-EVIDENCE-GATE-20260710
Title: Dashboard productPlaneMap release evidence gate
Owner: 黄仁勋 / DevOps Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P11 / P9
Type: Release evidence schema / verifier hardening / inventory visibility / forgery regression
Priority: P0
User value: Dashboard 三平面产品结构不能只靠 smoke 自报；发布证据必须严格证明 productPlaneMap 的对象结构、三项动作和完整 proofs，并拒绝缺失、错型或伪造证据。
Scope: Dashboard smoke producer, `scripts/verify-release-evidence.sh`, `scripts/release-evidence-inventory.mjs`, inventory self-test, `scripts/security-regression-check.sh`, 必要阶段记录。
Non-goals: 不刷新 full release/nightly authority、不证明 Dashboard 数据业务真实性、不实现 RBAC/生产部署/商业化体系、不声明 P11 全阶段完成。
Acceptance: producer 顶层 `productPlaneMap.actionCount=3` 且提供 35 proofs；verifier strict productPlaneMap；inventory 独立输出 `dashboardProductPlaneEvidence`；self-test covered；security regression 15 forged variants PASS；旧候选 `release-current-schema-20260705-0610` 在最新 verifier 下退出 `1`，首个失败为 `productPlaneMap must be an object`。
Risks: contract 实现已 DONE，但旧 authority 已失效；刷新 release/nightly evidence 并通过最新 verifier 前，P11 authority 必须保持 BLOCKED/YELLOW。
Dependencies: P9-DASHBOARD-THREE-PLANE-PRODUCT-STRUCTURE-20260709, P11-DASHBOARD-EXECUTIVE-BRIEFING-RELEASE-EVIDENCE-GATE-20260710, RELEASE_PROCESS.md, TEST_STRATEGY.md。
Status: DONE / PRODUCER + VERIFIER + INVENTORY + SELF-TEST + 15 FORGED VARIANTS PASS / AUTHORITY BLOCKED-YELLOW PENDING REFRESH
```

```text
ID: P11-CURRENT-FULL-AUTHORITY-REFRESH-20260710
Title: Current full release authority refresh and repair-readiness fail-closed closure
Owner: 黄仁勋 / DevOps Engineer, 拉里佩奇 / QA Engineer, 扎克伯格 / Frontend Engineer, 主 agent integration
Phase: P11 / P9 / P10
Type: Full release evidence / verifier hardening / repair safety / live public repository E2E
Priority: P0
User value: 当前源码必须由真实公开仓库、浏览器主链路、安全门禁和独立 verifier 同时证明；修复候选入口不能因单个服务端布尔值或错绑任务 ID 被错误放行。
Scope: release evidence package、public repo smoke、report evidence drawer、ProjectDetail repair gate、release verifier、security regression、必要权威文档。
Non-goals: 不实现 RBAC、多租户、GitHub App/Webhook E2E、真实 LLM provider、灾备签署或生产部署；不声明 P9/P10/P11 整体完成。
Acceptance: release profile required_failures=0、optional_warnings=0；独立 verifier/checksum PASS；真实 public repo UI PASS；REQUIRED_FULL 派生严格；readyForRepair 不绕过 role/count consistency；AgentChat linked/handoff IDs 分离；QA PASS。
Risks: 5 个高级集成步骤仍为 skipped；后续产品增量改变 marker schema 时必须再次刷新 authority。
Dependencies: P11-DASHBOARD-PRODUCT-PLANE-MAP-RELEASE-EVIDENCE-GATE-20260710, P9-SCAN-REPORT-ROUTE-PLANE-HANDOFF-20260710, RELEASE_PROCESS.md, TEST_STRATEGY.md, SECURITY_BOUNDARY.md。
Status: DONE / CURRENT AUTHORITY release-current-schema-20260710-114653 / 0 REQUIRED FAILURES / INDEPENDENT VERIFIER PASS / QA PASS
```

```text
ID: P9-FIRST-VIEWPORT-CONTEXT-ACTION-ARBITRATION-20260710
Title: Dashboard and Projects first-viewport context and action arbitration
Owner: 乔布斯 / Product Manager, 雷军 / Product Design and UX Research Advisor, 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P11
Type: First viewport information hierarchy / state arbitration / recoverable UI
Priority: P0
User value: 用户打开首页或项目入口时，首屏必须先显示当前产品平面、可信状态和唯一主动作；加载、错误或空态不能被误解释为可继续接入、扫描或修复。
Scope: AppLayout mobile plane identity, Dashboard hero command, Projects loading/error/empty/filter states, focused Playwright and static UI gates.
Non-goals: 不实现 RBAC、工作视角持久化、组织/团队、多租户、后端 API 变更，也不重构 ProjectDetail/ScanTaskDetail/AgentChat 全部首屏。
Acceptance: Dashboard hero primary CTA 严格来自 nextAction，load error 时只能以重试为 primary；Projects 初始 loading 与 fatal error 不显示统计、可信闭环或新建主动作；确认空项目与筛选无结果区分；390/320 仍显示产品平面身份；1440/1024/768/390/320 初始 scrollY=0，首屏 primary CTA=1、主动作完整位于 viewport；不得用 scrollIntoViewIfNeeded 伪造首屏证据；build/UI validator/focused browser smoke PASS。
Risks: 当前只治理 Dashboard/Projects 两个入口；其他详情页的首屏仲裁继续登记为后续 P9 增量。
Dependencies: PRODUCT_POSITIONING_AND_ACCESS_MODEL.md, FRONTEND_DESIGN_SYSTEM.md, TEST_STRATEGY.md, P9 Three-plane navigation.
Status: DONE / FOCUSED P9 GREEN / DASHBOARD 7 STATES X 5 VIEWPORTS PASS / PROJECTS STATE ARBITRATION PASS / BUILD PASS
Evidence: Dashboard next-action smoke PASS at 1440/1024/768/390/320 with scrollY=0 and exactly one primary action; Projects batch3 11 broad cases PASS plus confirmed-empty/filtered-empty focused case PASS; app-shell smoke PASS; frontend build, UI validator and git diff check PASS.
Authority boundary: 本增量不改 API/DB/schema，不刷新 full release package；current local release authority 仍为 release-current-schema-20260710-114653。ProjectDetail、ScanTaskDetail、AgentChat 首屏仲裁和持久化工作视角继续作为后续 P9 增量。
```

```text
ID: P9-PERSISTED-WORK-PERSPECTIVE-20260710
Title: Per-user persisted work perspective and three-plane navigation arbitration
Owner: 乔布斯 / Product Manager, 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P10 / P11
Type: Target-user navigation / local preference persistence / responsive information architecture
Priority: P0
User value: 每个已认证用户可保存自己的导航偏好，进入系统时直接落到常用主流程；该偏好只降低混合导航的认知负担，不代表系统识别了用户角色或授予了权限。
Scope: neutral root entry, AppLayout three work perspectives, per-user local preference persistence, route-plane synchronization, expanded/collapsed Sider and mobile Drawer controls, focused browser/static/build gates.
Non-goals: 不实现 RBAC、组织/团队、后端角色字段、权限审批、服务端偏好同步或跨设备同步；工作视角不得阻断直接路由，也不得被描述为权限。
Acceptance: 仅允许 workbench/governance/admin_security，显示为开发工作台/工程治理/平台管理与安全；无有效偏好时默认 workbench；键固定为 sourcelens.work-view.v1.user.<authenticated user id>；登录后通过中立根入口 `/` 恢复偏好，显式切换分别落到 Dashboard/ExecutionTasks/AuditLogs 并持久化；`/dashboard`、`/execution-tasks`、`/audit-logs` 等显式深链始终以 URL 为准且不覆盖 saved preference；Issue Decomposition 归开发工作台；无效值或存储读写异常回退且导航保持可用；1440/1024/768/390/320 均可识别和切换；折叠 Sider、移动 Drawer 和跨 720px 断点切换可操作；UI 明确“仅调整导航与默认首页，不改变访问权限”；mocked browser smoke 证明 preference persistence/per-user preference-key isolation/direct-route behavior；build/UI validator PASS。
Risks: localStorage 可被客户端修改，因此只能用于导航偏好；未来 RBAC 上线时必须由服务端权限决定可见性和可执行性。
Dependencies: PRODUCT_POSITIONING_AND_ACCESS_MODEL.md, FRONTEND_DESIGN_SYSTEM.md, AppLayout routeMeta, AuthContext authenticated user id.
Status: DONE / FOCUSED P9 GREEN / PRODUCT BLOCK RETURN CLOSED / 2 BOUNDED PLAYWRIGHT TESTS PASS / BUILD PASS
Evidence: `npm run smoke:work-perspective` 2 passed in 22.0s，marker 为 `WORK_PERSPECTIVE_UI_SMOKE_OK` 与 `WORK_PERSPECTIVE_STORAGE_FAILURE_SMOKE_OK`；五视口、三视角、逐用户偏好键隔离、非法值回退、深链不覆写、折叠 Sider、移动 Drawer、断点清理、桌面折叠恢复和存储异常均有断言；`node scripts/validate-frontend-ui.mjs`、frontend production build、`git diff --check` PASS；Product/Frontend/QA 二轮只读复核均 PASS。
Authority boundary: 本增量不改后端/API/DB/schema，不刷新 full release package；current local release authority 仍为 `release-current-schema-20260710-114653`。工作视角是客户端导航偏好，不是 RBAC、组织角色、服务端权限或跨设备偏好同步。
```

```text
ID: P9-PROJECT-DETAIL-FIRST-VIEWPORT-ACTION-ARBITRATION-20260710
Title: ProjectDetail first-viewport state truth and action arbitration
Owner: 乔布斯 / Product Manager, 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 主 agent integration
Phase: P9 / P11
Type: First-viewport state machine / request ownership / recoverable UI
Priority: P0
User value: 用户进入项目工作台时，只能在项目、仓库、扫描和核心证据已确认后看到接入、扫描、报告或 QA 动作；请求未完成、加载失败或旧项目响应晚到时，页面不能伪造“无仓库”“无扫描”或可继续执行的结论。
Scope: ProjectDetail core-source loading state, per-project request generation guard, first-viewport next-action arbitration, responsive CSS, dedicated focused Playwright and static UI gate.
Non-goals: 不改后端/API/DB/schema，不重构 ScanTaskDetail 或 AgentChat，不实现 RBAC、服务端缓存、真实 provider 或 full release evidence schema。
Acceptance: 初始加载必须为 `INITIAL_LOADING`，不得渲染 cockpit 业务统计、可信闭环或添加仓库/触发扫描动作；无可用快照且 project/repository/scan 任一核心源失败时进入 `FATAL_LOAD`，首屏唯一 primary 为重试；已有可信快照后刷新失败进入 `STALE_REFRESH`，保留旧数据但唯一 primary 为重新同步，不得继续主推 QA/扫描；核心源确认成功后才进入 ADD_REPOSITORY、START_SCAN、WATCH_SCAN、REVIEW_FAILED_SCAN、OPEN_ARTIFACTS、OPEN_QA 六态；切换 projectId 必须清空旧快照并拒绝旧 project/repository/scan/execution/overview/artifact/code_chunks 响应；1440/1024/768/390/320 在 scrollY=0 下状态和主动作位于首屏，INITIAL_LOADING primary=0，其余状态 primary=1，无横向溢出、文字裁切或 `scrollIntoViewIfNeeded` 伪证据；focused browser smoke、UI validator、production build、diff check 和 Product/Frontend/QA 复核 PASS。
Risks: ProjectDetail 当前四条核心请求独立落状态且 overview 重复读取 scans；若只补 loading 文案而不做 generation guard，跨项目数据污染仍会导致错误扫描、产物或 QA 入口。
Dependencies: P9-FIRST-VIEWPORT-CONTEXT-ACTION-ARBITRATION-20260710, P9-PERSISTED-WORK-PERSPECTIVE-20260710, FRONTEND_DESIGN_SYSTEM.md, TEST_STRATEGY.md, PRODUCT_POSITIONING_AND_ACCESS_MODEL.md.
Status: DONE / FOCUSED P9 GREEN / PRODUCT + ARCHITECT + QA PASS / 11 PLAYWRIGHT TESTS PASS / BUILD PASS
Evidence: `make project-detail-first-viewport-ui-smoke` 11 passed in 54.9s；marker 为 `initialChecked=5`、`fatalChecked=15`、`sixStateChecked=30`、`staleChecked=5`、`routeRaceChecked=1`、`realApi=false`、`db=false`；1440/1024/768/390/320 的初始、致命、陈旧和六业务态均验证自然首屏；A -> B 延迟 core/code_chunks/preview 均被拒绝；旧 batch4A 合同已迁移并聚焦 3 passed；frontend production build、UI validator、`git diff --check`、桌面/320 trace screenshot 复核 PASS；Product 与 Architect 二轮只读验收 PASS。
Authority boundary: 本增量没有修改后端、API、数据库或 schema，也没有运行或刷新 full release package；current local release authority 仍为 `release-evidence/release-current-schema-20260710-114653`。mocked smoke 不证明真实后端 E2E、RBAC、生产部署或 P9 全阶段完成。
```

```text
ID: P9-SCAN-TASK-DETAIL-FATAL-COCKPIT-20260710
Title: ScanTaskDetail first-viewport state truth and report ownership
Owner: 乔布斯 / Product Manager, 扎克伯格 / Frontend Engineer, 拉里佩奇 / QA Engineer, 马斯克 / Architect, 主 agent integration
Phase: P9 / P11
Type: First-viewport state machine / report evidence ownership / recoverable UI
Priority: P0
User value: 扫描报告数据未加载、加载失败或属于旧 scan 时，页面不能把“没有证据”伪装成“暂无显著风险”、0 artifacts 或可继续复核的可信报告。
Scope: ScanTaskDetail initial/fatal/stale/ready state truth, task/artifact/preview/execution/code_chunks ownership, active polling/full refresh arbitration, first-viewport retry/resync, risk empty-state semantics, dedicated mocked Playwright/static/build gates.
Non-goals: 不改后端/API/DB/schema/analyzer，不重构完整报告证据抽屉或推荐动作板，不处理 AgentChat composer，不刷新 full release authority。
Acceptance: 状态优先级固定为 INITIAL_LOADING -> FATAL_LOAD / STALE_REFRESH -> READY；首次 task detail、artifact list 或归属失败只显示 fatal reason 与唯一 primary“重新加载扫描报告”，不得渲染 cockpit、执行阶段、code knowledge、Tabs、0 指标或“暂无显著风险”；可信快照刷新失败保留旧上下文但明确 stale，唯一 primary 为“重新同步”；只有成功解析且明确 risks=[] 的当前 scan 报告才显示“未识别到显著风险”，报告缺失/未确认使用“风险状态不可用”和 `-`；task/project/artifact owner/preview record/execution source/code_chunks scanTaskId 必须归属当前 scan；taskId A -> B 迟到响应必须拒绝；递归 polling 必须让位于 full refresh；1440x900、1024x768、768x1024、390x844、320x740 在 scrollY=0 下 initial primary=0、fatal/stale primary=1、按钮和完整原因位于首屏，无横向溢出、裁切、低对比或 scrollIntoViewIfNeeded 伪证据；focused smoke、UI validator、build、diff、Product/Frontend/QA/Architect review PASS。
Risks: 已关闭 task detail 提前提交、fatal 后继续渲染 cockpit、artifact/preview/code status 归属缺失、单次 polling、preview 刷新覆盖旧可信快照和 synthetic PENDING steps 风险。残余风险仅为 mocked smoke 不证明真实后端 E2E、报告事实正确或生产发布能力。
Dependencies: P9-PROJECT-DETAIL-FIRST-VIEWPORT-ACTION-ARBITRATION-20260710, FRONTEND_DESIGN_SYSTEM.md, TEST_STRATEGY.md, PRODUCT_POSITIONING_AND_ACCESS_MODEL.md.
Status: DONE / FOCUSED P9 GREEN / PRODUCT BLOCK + QA PARTIAL RETURN CLOSED / 7 PLAYWRIGHT TESTS PASS / BUILD PASS
Evidence: `npm run smoke:scan-task-detail-first-viewport` 7 passed / 48.5s；marker 证明 initial=5、15 个独立 fatal scenario、stale=5、confirmed-empty=5、risk fallback=5、route race=1、polling race=1、successful PNG=4、`realApi=false`、`db=false`；desktop/320 READY+STALE PNG 人工复核 PASS；frontend UI validator、production build、`git diff --check` PASS；Product/Frontend/QA/Architect 最终复核均 PASS。
Authority boundary: 本增量没有修改后端、API、数据库、Flyway、analyzer 或 release evidence schema，也没有刷新 full release package；current local authority 仍为 `release-evidence/release-current-schema-20260710-114653`。本 focused gate 不证明真实扫描、报告事实正确、RBAC、生产部署或 P9 全阶段完成。
```
