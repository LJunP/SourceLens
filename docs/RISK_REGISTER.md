# SourceLens Risk Register

> AIOS v2.3 状态：`SUPPORTING LEGACY RISK INPUT`。下方风险继续作为审计输入，但旧 Owner、优先级和关闭状态不覆盖 `aios/truth/project_state.yaml` 的 blocking risks；迁移后风险需通过新任务协议重新分配。

状态：迁移前风险输入；当前阻断风险只写入 `aios/truth/project_state.yaml`。

## 1. 风险等级

| 等级 | 含义 | 处理要求 |
| --- | --- | --- |
| P0 | 阻塞核心链路、导致数据泄露、越权、误执行危险操作或发布不可用 | 立即处理；不能阶段放行 |
| P1 | 严重影响核心体验、报告可信度、安全边界或任务可靠性 | 必须有 owner、缓解方案和复审时间 |
| P2 | 重要质量缺陷或可持续性问题 | 纳入阶段计划或明确延期 |
| P3 | 长期优化项 | 周期性复审 |

## 2. 当前风险台账

| ID | 等级 | 风险 | 影响 | Owner | 缓解方案 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-AI-001 | P1 | 报告或 QA 输出脱离源码证据 | 用户误信 AI 结论，AutoRepair 入口可能基于弱证据 | `梁文峰` / `张一鸣` | 强化 citation coverage、exact anchor、cross-file evidence、报告质量 smoke；Code QA 已暴露 uncited primary/context evidence 条数和文件数，单 primary + context 标记 `MIXED_PRIMARY_CONTEXT`，primary 跨文件 + context 保持 `PRIMARY_CROSS_FILE`；ProjectDetail 已在 PRIMARY 已引用但 adjacent context 未引用时显示 `上下文引用待补齐` 和 `上下文引用缺口`，release verifier 已强校验 primary gap=0、context gap>0、`contextGapVisible` 一致性；来源定位可信度已显示 `定位不证明事实正确`，release verifier 已强制 `deepEvidenceCardReadability.sourceLocationConfidence.llmFactBoundaryVisible=true`，security regression 会拒绝 missing/hidden forged marker；真实 public repo UI smoke 已在 `projectId=371/repositoryId=332/scanTaskId=282` 证明 `contextGapVisible=true`、`minUncitedContextEvidenceCount=7`、`minUncitedContextEvidenceFileCount=4`、`maxUncitedPrimaryEvidenceCount=0`；剩余风险是该证据为 focused gate，不是 full release authority refresh，且不等同于 LLM 事实正确性证明 | Active |
| RISK-SEC-001 | P1 | clone URL、artifact、raw payload、sandbox 边界不完整 | SSRF、路径逃逸、敏感信息扩散或危险命令执行 | `奥特曼` | 保持 security regression，新增边界时必须补 `SECURITY_BOUNDARY.md` 与测试 | Active |
| RISK-FE-001 | P1 | 前端可读性、对比度、裁切和状态面不稳定 | 用户看不清关键动作或误操作；长标题/长说明若被 topbar 省略号或 flex 宽度挤压，会再次出现顶部文字裁切和移动端横向溢出；项目下一步证据检查若强制 ellipsis，会隐藏证据成熟度和阻塞项；Artifacts focus/filter/table/drawer/preview/modal/receipt/raw JSON 文本若强制 ellipsis 或不换行，会隐藏 primary evidence、owner/source、类型、大小、content type、repository、抽屉操作/状态提示、预览指标、raw download 风险说明、审计追溯入口和 redacted raw JSON 证据等关键内容 | `扎克伯格` / `雷军` | P9 设计系统化治理，Playwright 多视口 smoke，`validate-frontend-ui.mjs` 静态门禁；app shell topbar 已支持长标题/说明换行并补充长文本 smoke；ProjectDetail next action checks 已改为可换行并补 batch4a 断言；Artifacts focus card、filter chips、table type/owner cells、drawer action/status、smart preview tiles、raw download confirm、raw download audit receipt 和 redacted raw JSON 已改为可换行并补 detail-selection smoke 断言；ProjectDetail repository/scan workflow tables、Dashboard recent scans table、Projects list table、IssueDecomposition main/task table、ModelConfig provider table 和 CiDiagnostics diagnostics table 已纳入 scroller containment smoke 与 static gate | Active |
| RISK-FE-002 | P2 | ProjectDetail 深层证据卡可读性回退 | QA 回答来源凭证、来源定位可信度或来源文件匹配说明在移动端被裁切，会让用户误判引用质量和修复候选入口 | `扎克伯格` / `达里奥` | `qaFromEvidence.deepEvidenceCardReadability` 已进入 report evidence release verifier；missing、clipped、range hidden、review repair visible、overflow、provider overclaim 和 raw-field forged marker 已由 security regression 拒绝 | Active |
| RISK-TASK-001 | P1 | 长任务状态机、重试、取消、幂等和 attempt 关系复杂 | 任务重复执行、终态覆盖、失败原因不清 | `比尔盖茨` / `马化腾` | 执行任务状态机专项、attempt 证据、审计追踪、任务失败分类 | Active |
| RISK-OPS-001 | P2 | release evidence、本地 runtime、历史包和生成物积累 | 仓库污染、证据混淆、磁盘膨胀 | `黄仁勋` / `库克` | 只读 inventory、dry-run retention、阶段收口清理 | Active |
| RISK-DATA-001 | P2 | repo scan、artifact、code_chunks、audit log 生命周期不清 | 数据膨胀、删除不彻底、企业化风险 | `比尔盖茨` / `梁文峰` | 执行 `DATA_GOVERNANCE.md`，后续实现 retention/cleanup 任务 | Active |
| RISK-AI-002 | P2 | 报告证据字段命名格式漂移 | 报告 JSON 使用 `file_path`、`filePath`、`source_file/sourceFile`、`source_path/sourcePath`、`source_url/sourceUrl`、`line_number`、`start_line/end_line`、`startLine/endLine`、`line_start/line_end`、`lineStart/lineEnd`、`handler_class`、`handler_method` 等字段时，QA/code_chunks 检索可能退化为普通关键词、同文件错误 chunk 或同名 controller 误选；handler 字段乱序、compact handler 字段格式、compact line 字段格式、`evidenceRef.lineNumber` 范围格式或 start/end 字段格式可能削弱行级闭环 | `梁文峰` / `达里奥` | 已支持 `file_path:`、quoted JSON `"file_path": "..."`、compact quoted `file_path/filePath/source_file/sourceFile/sourcefile/source_path/sourcePath/sourcepath/source_url/sourceUrl/sourceurl` evidence anchor、quoted JSON 与 compact `line/line_number/lineNumber`、raw 逐行和 compact `start_line/end_line`、`startLine/endLine`、`line_start/line_end`、`lineStart/lineEnd` range hint、flat compact evidence object 内 `file_path/filePath/sourceFile/sourcePath/sourceUrl + line/range` 绑定、bounded structured JSON object/array/nested evidence object 内同一 object 的 `file_path/filePath/sourceFile/sourcePath/sourceUrl + line/range` 绑定、普通 `path/url/location` 字段不作为 evidence anchor、parent file_path + child line_number 不跨层绑定、malformed JSON structured parse 失败后的 flat fallback、同 object 内 range 优先于 line_number、跨 object file-only + line-only 不绑定、compact object boundary guard、逐行与 compact quoted `handler_class/handler_method` evidence anchor、bounded structured JSON object/array/nested evidence object 内同一 object 的 `handler_class + handler_method` method anchor、parent handler_class + child handler_method 不跨层绑定、malformed compact handler fallback、handler 字段乱序配对、compact handler method-first 乱序、compact handler 跨 object 不误配和非法值 fail-closed、`evidenceRef.lineNumber` 范围重叠判断，以及 `CodeQaRequest.evidenceRef.startLine/endLine` + `start_line/end_line` 行级锚点；报告证据抽屉到 ProjectDetail QA deep link 已传递 `evidenceStartLine/evidenceEndLine`，并有 start/end-only smoke 断言证明无 legacy `lineNumber` 时仍能保持 request/response 行级绑定；ProjectDetail QA UI 已优先显示结构化 `startLine/endLine`，冲突 URL 中 legacy `evidenceLine=999` 不会覆盖 `范围 24-42`；`qaFromEvidence.evidenceLineRangePriority` 已进入 report evidence release verifier，缺失、旧行号可见、错误范围、移动端覆盖缺失和 overflow forged marker 会被 security regression 拒绝；后端已补 Vite source URL + start/end-only 回归，public repo UI release verifier 已要求 start/end-only marker 并由 forged security regression 防回退；focused package `release-evidence/public-repo-ui-start-end-only-20260705-042402` 已通过真实 public repo UI smoke 和 verifier；hosted source URL 已支持 trusted GitHub/GitLab/raw host 的 nested branch strong-root-first source-root heuristic；`CodeChunkRanker` 已对完整覆盖 line hint 的 chunk 加入 tight range preference，减少同一文件 broad chunk 覆盖目标行时压过更紧范围 chunk 的风险；剩余风险是 JSON candidate/traversal 是 bounded best-effort，不是完整 report evidence schema parser，超长、复杂坏 JSON、branch 自身包含 `web-console/backend-spring` 等 strong source-root segment 且真实文件只从 `src/docs/test` 等 generic root 开始的 hosted URL 歧义、或超过 traversal budget 的深结构会保守忽略或可能误剥离；后续新增报告字段格式或 line hint 排序调整必须补 parser/retrieval/前端 deep link/release verifier 回归测试 | Active |
| RISK-AI-003 | P2 | Code QA top context 被同类证据占满 | 多个高分 controller/service、同一文件 overlapping exact chunks 或文档噪声可能挤掉 service、mapper、domain model、普通 source 或 frontend 证据，导致回答缺少跨层链路基础 | `梁文峰` / `达里奥` | 已加入 evidence role diversity，覆盖 controller/service/data/model/source/frontend/test/config；前端页面组件问题已支持 `FRONTEND` intent 补池，前端动作到后端接口 bridge 问法受控补 `FRONTEND + CONTROLLER`，无“前端”字样的按钮/点击/提交/表单/onClick/fetch/axios 等 UI action surface + 接口入口词也覆盖，中文“登录页调用哪个接口”“详情页用哪个接口”“登录页对应哪个接口”“登录页面接口是什么”“登录页接口在哪里”“登录页面接口”和英文 `login page endpoint` 这类受控页面短写/关系/名词短语问法也覆盖；普通“登录接口请求”“分页接口请求”“分页接口用什么”“分页接口是什么”“分页接口在哪里”“分页接口”和 `pagination endpoint` 不误带 `FRONTEND`；backend database flow 问题已扩展 `CONTROLLER` + `SERVICE` + `DATA_ACCESS` role intents，table/entity flow、中文“写表/读表”、中文 CRUD 链路词、明确中文读操作和受控响应载荷意图额外扩展 `DOMAIN_MODEL` 并有 Entity 候选回归，普通 endpoint 定位保持 Controller-only，role-intent 场景 docs/build 噪声降权，并有跨层 retrieval 与 no `content LIKE` 回归；exact-anchor 首轮已增加 per-file cap，防止同文件 overlapping exact chunks 先挤满 top context，并有 service/mapper 跨文件保留回归；后续检索排序调整必须保留跨角色与 overlapping exact-anchor 回归测试 | Active |
| RISK-AI-004 | P2 | Code QA citation label 格式漂移 | LLM 常输出 `[C1, C2]`、`[C1-C2]`、`[C1–C2]`、`【C1】`、`【C1，C2】`、中文逗号或顿号合并引用、`[c01]`/`[C01]` 等大小写或零填充引用；首轮回答漏引用后的 retry 回答也可能使用这些格式；如果 parser 过宽还可能把 `[C1】` / `【C1]`、`[C2-C1]`、`[C2–C1]`、`[C0]`、代码块/日志/Markdown 引用块/HTML `<pre>` 或 `<code>` 容器、HTML comment、HTML tag attribute、HTML script/style block、Markdown link/reference URL 中的假 `[C1]` / `[C99]` 等 malformed 或非回答证据误判为有效引用；如果 parser 过窄又可能漏掉可见 HTML entity bracket citation，如 `&#91;C1&#93;` | `梁文峰` / `达里奥` | 已支持 ASCII/full-width citation block、方括号内多标签、ASCII dash 和 Unicode dash 短范围引用；已将大小写和零填充 label canonical 到 `C数字`，例如 `[c01] -> C1`；`[c00]`/`[C0]` 不生成有效标签；retry path 已有 full-width combined citation 回归；parser 已要求成对 bracket，invalid range 和 reversed Unicode dash range 不再降级为普通 token，retry prompt 已明确有效示例和无效反例；继续禁止普通数字、代码块、日志、Markdown blockquote 日志/异常/stack、HTML `<pre>/<code>`、HTML comment、HTML tag attribute、HTML script/style block、Markdown link/image destination、Markdown reference definition URL、裸 `http(s)://` / `www.` URL、受控无 scheme domain URL、`localhost` / IPv4 loopback 本地 URL、示例假引用和 malformed citation 进入真实 citation；普通 blockquote 正文 citation 仍有效，正文外部 citation 不受 HTML inline code 普通 token、HTML comment、HTML tag attribute、HTML script/style content、Markdown link URL、裸 URL、无 scheme domain URL 或本地 URL 噪声影响；`src/AuthService.java [C1]` 文件路径正文引用保持可审计；标签正文与 script/style 外的可见 citation 仍保留；可见 decimal/hex/named HTML bracket entity citation 已支持，且 attribute/link destination entity 负例已覆盖 | Active |
| RISK-AI-005 | P2 | Code QA claim sentence split 边界误判 | `AuthService.java`、`ProjectDetail.tsx` 等路径中的英文句号若被当作句子边界，会导致 claim preview 和 citation coverage 误切；多个代码事实用分号、同一行编号列表、同一行 bullet、Markdown 表格或 citation 后逗号转接词连接时，如果不拆分会让未引用事实被前一条 citation 覆盖 | `梁文峰` / `达里奥` | 已将英文句号边界收紧为后接空白或行尾才切分；已把中文/英文分号、citation 后同一行编号项、`-` bullet、`+` bullet、Markdown table block 数据行 cell、citation 后 `，此外/同时/另外/并且/...` 转接 claim 纳入边界；表头/分隔行不进入 claim audit，普通 pipe 文本不拆分；新增 file path、semicolon、inline numbered、inline bullet、plus bullet、Markdown table、citation 后中文逗号转接词正例和普通 pipe 负例回归测试 | Active |
| RISK-AI-006 | P1 | code_chunks keyword / role intent 查询对 `content` 做 MEDIUMTEXT LIKE 扫描 | 大型公开仓库反复 smoke 后 `code_chunks` 行数膨胀，QA/report evidence 检索可能卡住或拖垮 release evidence | `比尔盖茨` / `梁文峰` / `黄仁勋` | 已新增 V031 lookup indexes，并移除 `CodeChunkService` keyword wrapper 与 role intent candidate query 的 `content LIKE`；`CodeChunkServiceTest` 锁住 keyword 和 role intent SQL segment 不包含 `content LIKE`；static security suite 已新增断言防止运行代码回退 `like(CodeChunk::getContent)`；真实 public repo smoke、public repo UI smoke、`make verify` 和 `release-current-schema-20260705-0610` full release authority 均 PASS。剩余风险：DB keyword/role intent recall 改为 path/structure-first，全文语义召回质量需后续 P6 继续优化；不能回退到 MEDIUMTEXT LIKE | Mitigated / Monitor |

## 3. 新风险登记规则

出现以下情况必须登记：

- 新增 repo/file/shell/Docker/LLM/GitHub/credential 能力。
- 新增数据库表、长期保存 artifact 或 raw payload。
- 阶段 gate 失败但决定继续推进。
- AI 输出质量、报告引用、AutoRepair 候选存在可信度缺口。
- 前端核心页面出现看不清、裁切、误导性 CTA 或不可恢复错误态。
- release evidence、CI、备份、回滚或环境启动存在不可复现问题。

## 3.1 2026-07-05 P6 风险补充记录

- `RISK-AI-002` 补充缓解：报告 evidence path 字段中的 GitHub/GitLab hosted source browser/raw URL 已归一化为仓库内相对路径；`CodeChunkServiceTest` 覆盖 GitHub blob URL 与 raw.githubusercontent.com URL 在同名 decoy 场景下仍把目标文件排第一。
- 边界保持：普通 `path/url/location` 字段没有升级为 evidence anchor；host-aware 收紧后，普通相对 `modules/auth/blob/main/...` 和未知 host `https://example.com/.../blob/main/...` 不按 GitHub/GitLab hosted branch 规则剥离；完整 report evidence schema parser 仍不是本轮范围。
- `RISK-AI-001` 补充缓解：`来源定位可信度` 现在明确提示 `定位不证明事实正确`；该提示进入 report evidence drawer smoke marker、release verifier 和 forged marker security regression。边界保持：该提示只防止 UI/证据表述越界，不证明 LLM 事实语义正确。
- `RISK-AI-002` 补充缓解：`sourceUrl/source_url/sourceurl` 已纳入明确 evidence anchor 白名单；普通 `url/path/location` 继续不作为 evidence anchor；同名 `ProjectDetail.tsx` decoy 场景已证明 `sourceUrl + lineNumber` 可把目标文件排第一。边界保持：任意复杂分支名 hosted URL 不是本轮已解决范围。
- `RISK-AI-002` 补充缓解：GitHub/GitLab/raw hosted source URL nested branch 已支持 `feature/code-review`、`release/2026/q3` 等常见多段分支，并由 parser/retrieval 回归覆盖；source-root heuristic 已收紧为 strong project root 优先，覆盖 `feature/src/preview`、`feature/docs/review` 这类 generic root 分支名误剥离场景。边界保持：若分支名自身包含 `web-console/backend-spring` 等 strong source-root segment，仍需后续结合仓库 file index 或 provider metadata 消歧。
- `RISK-AI-004` 补充缓解：Code QA URL citation noise filter 已覆盖无 scheme domain/local URL 的 `/` / `?` / `#` 起始形态，并新增 bracketed IPv6 loopback `::1`；no-scheme domain URL regex 已加安全左边界，避免从 `src/fixture.test/[C1]` 这类 domain-like 相对路径中间误剥离 citation；`src/AuthService.java [C1]` 文件路径正文引用仍保持可审计。边界保持：这是 bounded URL noise filter，不是完整 URL parser；`[::1]` 是 exact loopback 支持，不泛化任意 IPv6。
- `RISK-AI-004` 补充缓解：Code QA common URI citation noise filter 已覆盖 `ftp/sftp/ssh/git/file/mailto/data/blob/javascript/vscode/idea` URI 内的假 `[C1]` / `[C99]`，并用 fake-only 与正文有效引用混合场景回归证明不会把 URI token 计入真实 evidence。边界保持：这是 bounded common URI filter，不是完整 URI parser；新增 scheme 必须追加回归测试。
- `RISK-FE-001` 补充缓解：共享 `ActionButton` label 已从 `nowrap + ellipsis` 改为可换行、自适应高度和 `overflow-wrap:anywhere`；`validate-frontend-ui.mjs` 已拒绝回退到旧裁切规则。边界保持：这是 shared button primitive focused change，不等同于所有页面视觉体系完成。
- `RISK-FE-001` 补充缓解：共享 `StateBlock` root、copy、title、description 和 action 区已补齐 `min-width/max-width/overflow/wrap` 防护；action 区支持 flex wrap；`validate-frontend-ui.mjs` 已拒绝 copy `nowrap/ellipsis` 和 action `nowrap/hidden/no-wrap flex` 回退。边界保持：这是 shared state primitive focused change，不等同于所有页面视觉体系完成。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `Tag` 与 `Badge` 文本已补齐 max-width/min-width/height/line-height/wrap/no-ellipsis 防护，降低状态、风险、证据类型、文件路径和 scan/task 标识被裁切的风险；`validate-frontend-ui.mjs` 已拒绝回退到 `nowrap` 或 `ellipsis`。边界保持：这是 shared metadata label focused change，不等同于所有页面视觉体系完成。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `Alert` root/content/message/description/action 已补齐 max-width/min-width/overflow/wrap/no-ellipsis 防护，降低错误、安全边界、补丁证据、raw access 提示和恢复动作被裁切的风险；`validate-frontend-ui.mjs` 已拒绝 copy `nowrap/ellipsis/hidden` 和 action `nowrap/hidden/no-wrap flex` 回退。边界保持：这是 shared alert surface focused change，不等同于所有页面视觉体系完成。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `Descriptions` root/view/item/label/content 已补齐 max-width/min-width/overflow/wrap/no-ellipsis 防护，降低项目、任务、产物、审计、模型配置和执行详情中的长 ID、路径、hash、URL、错误和元数据被裁切的风险；`validate-frontend-ui.mjs` 已拒绝单 selector/组合 selector 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。边界保持：这是 shared Descriptions focused change，不等同于所有页面视觉体系完成。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `List` root/item/meta/title/description/action 已补齐 max-width/min-width/overflow/wrap/no-ellipsis 防护，降低扫描报告风险、技术债、建议、产物预览、证据摘要、长路径、长 URL 和行级 action 被裁切或窄屏挤压的风险；`validate-frontend-ui.mjs` 已拒绝 metadata/action/action item 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap`。边界保持：这是 shared List focused change，不等同于所有页面视觉体系完成。
- `RISK-FE-001` 补充缓解：Ant `Modal` / `Confirm` 通过 `.ant-modal-root` 获得 portal 弹层兜底，root 限制在 `calc(100vw - 24px)`，title/content/form label/form explain/input/select/textarea/footer button/confirm button 支持长文本换行并拒绝 `nowrap`、`ellipsis`、`overflow:hidden` 和 footer no-wrap action 回退。边界保持：这是 shared Modal/Confirm focused change，不等同于所有 Modal 业务流程或全站 UI 体系完成。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `Card` header/title/extra/body 已补齐 max-width/min-width/wrap/no-ellipsis 防护，title/extra 内 Space 和 Space item 可换行可收缩，降低模块标题、状态标签、scan/task/repository 上下文和 extra action 被裁切或挤压主体的风险；`validate-frontend-ui.mjs` 已拒绝 Card title/extra 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 Space `flex-wrap:nowrap`。边界保持：这是 shared Card Header focused change，不等同于所有 Card 业务布局或全站 UI 体系完成。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `Tabs` root/nav/nav-wrap/nav-list/content/tabpane 和 tab label 已补齐 max-width/min-width/wrap/no-ellipsis 防护，报告页 `.sl-report-tabs .ant-tabs-nav` 已移除 `overflow:hidden` 局部覆盖；`validate-frontend-ui.mjs` 已拒绝 tab label 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 和 report tabs nav 回退到 `overflow:hidden`。边界保持：这是 shared Tabs focused change，不等同于所有业务 Tabs 逐个视觉验收或全站 UI 体系完成。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `Select` root/selector/selected item/placeholder/multiple overflow/value tag 已补齐 max-width/min-width/wrap/no-ellipsis 防护，`.ant-select-dropdown` portal option 已补齐可收缩和长文本换行规则；`validate-frontend-ui.mjs` 已拒绝 selected item、placeholder、multiple overflow 和 dropdown option 通过直接 selector、组合 selector 或更具体 selector 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap`。边界保持：这是 shared Select focused change，portal 范围只声明 SourceLens Ant Select 下拉层，不等同于所有 Select 交互逐个截图级验收或全站 UI 体系完成。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `Form` root/item/row/label/control/explain/extra 已补齐 max-width/min-width/wrap/no-ellipsis 防护，label、validation explain/error 和 extra/help 可换行；Modal/AutoRepair 的 `.ant-input` / `textarea` 已从文本换行组移出，仅保留布局 max/min width，降低误改编辑控件行为的风险；`validate-frontend-ui.mjs` 已拒绝 Form 文案通过直接 selector、组合 selector、更具体 selector 或 `!important` 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。边界保持：这是 shared Form label/help focused change，不等同于所有业务表单逐个截图级验收或全站 UI 体系完成。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `Space` root/item 已补齐 max-width/min-width/wrap/no-ellipsis 防护，普通 horizontal Space 支持 wrap，Space item 支持长 action、标签和证据文案换行；`validate-frontend-ui.mjs` 使用 selector-block 判断拒绝普通 Space 通过直接、重复或更具体 selector 回退到 `flex-wrap:nowrap`，并显式跳过真实 `.ant-space-compact` selector，降低 action row 裁切和 compact 误杀风险。边界保持：这是 shared Space action-row focused change，不等同于所有业务 action row 逐个截图级验收或全站 UI 体系完成。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `Typography`、inline `code` 和 `pre` 已补齐 max-width/min-width/wrap/no-ellipsis 防护，长标题、状态、说明、证据摘要、路径、hash、命令、错误片段和证据引用可换行，pre 保留 `overflow:auto` 兜底；`validate-frontend-ui.mjs` 已拒绝非 `.ant-typography-ellipsis` 普通 Typography 和 shared code/pre 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。Project next action dark-surface disabled button 已禁用 disabled 态 transition，避免动态 disabled 切换后 smoke 读取颜色中间值。边界保持：这是 shared Typography focused change，不等同于所有 Typography 场景逐个截图级验收或全站 UI 体系完成，且不改变表格列或局部单元格显式业务级 ellipsis 策略。
- `RISK-FE-001` 补充缓解：`.sl-app-shell` 内共享 Ant `Pagination` 已补齐 max-width/min-width/flex-wrap/visible overflow 防护，total text、page controls、options、page-size selector 和 quick jumper 可收缩，total/quick jumper 可换行；`validate-frontend-ui.mjs` 已拒绝 Pagination 或 total/quick jumper 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 no-wrap。边界保持：这是 shared Pagination focused change，不改变分页数据/API 查询逻辑、表格列宽、scroll.x、行选择或详情入口策略。
- `RISK-FE-001` 补充缓解：Ant `Drawer` 通过 `.ant-drawer` portal 层获得共享可读性兜底，content wrapper 受 `calc(100vw - 24px)` 约束，content/header/body/footer/header-title/title/extra 可收缩，title、extra、footer 和 action button 支持长上下文换行；`validate-frontend-ui.mjs` 已通过 selector-block 级检查拒绝 Drawer width containment 被关闭，或 header/header-title/title/extra/footer/action 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 no-wrap。边界保持：这是 shared Drawer focused change，不改变打开/关闭逻辑、数据加载、深链匹配、raw 展示、redaction、业务宽度配置或具体详情内容结构。
- `RISK-FE-001` 补充缓解：Ant `Empty` fallback 通过 `.sl-app-shell` 和 `.ant-select-dropdown` 获得共享兜底，description 和 footer action 可收缩可换行；`validate-frontend-ui.mjs` 已拒绝 Empty fallback 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 no-wrap。边界保持：核心产品空态仍必须优先使用 `StateBlock`，本轮不新增 raw Empty、不替换表格 emptyText、不改变 Select 数据或 API。
- `RISK-FE-001` 补充缓解：Ant `Menu` / `Dropdown` 通过展开态 `.sl-sider`、`.sl-mobile-nav` 和 `.ant-dropdown` 获得共享可读性兜底，导航 item、分组标题、Dropdown item 和 title content 支持长标签换行，icon 保持固定尺寸；`validate-frontend-ui.mjs` 已拒绝 Menu/Dropdown label 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。边界保持：这是 shared Menu/Dropdown focused change，不改变路由、权限、账号动作、移动菜单开关逻辑、Dropdown trigger/placement 或折叠侧栏紧凑行为。
- `RISK-FE-001` 补充缓解：Ant `Tooltip` / `Popover` / `Popconfirm` 通过 portal 层获得共享可读性兜底，弹层宽度受 `calc(100vw - 24px)` 约束，Tooltip inner、Popover title/content、Popconfirm message/description 和确认按钮支持长说明、路径、证据、风险后果换行；`validate-frontend-ui.mjs` 已拒绝文案回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 Popconfirm buttons no-wrap。边界保持：这是 shared Tooltip/Popover/Popconfirm focused change，不改变确认/取消逻辑、业务 gate、AutoRepair PR submit-pr 阻断、PATCH_READY smoke 合同或后端行为。
- `RISK-FE-001` 补充缓解：Ant `Message` / `Notification` 通过 portal 层获得共享可读性兜底，反馈宽度受 `calc(100vw - 24px)` 约束，message notice/content、notification message/description 和 action 区支持长错误、请求 ID、权限提示和恢复动作换行；`validate-frontend-ui.mjs` 已拒绝文案回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 notification action no-wrap。边界保持：这是 shared Message/Notification focused change，不改变触发位置、持续时间、业务文案、API 错误格式、redaction 策略或请求逻辑。
- `RISK-FE-001` 补充缓解：Ant `Progress` 通过 `.sl-app-shell` 获得共享可读性兜底，root/line/outer/inner 可收缩，progress text 支持长状态和百分比换行；`validate-frontend-ui.mjs` 已拒绝 progress text 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。边界保持：这是 shared Progress focused change，不改变百分比计算、状态映射、颜色、动画、showInfo 配置、页面数据请求或后端行为。
- `RISK-FE-001` 补充缓解：Ant `Timeline` 通过 `.sl-app-shell` 获得共享可读性兜底，root/item 可收缩，content/label 支持长步骤标题、错误、证据说明、路径和 URL 换行，marker/tail 保持稳定尺寸；`validate-frontend-ui.mjs` 已拒绝 Timeline content/label 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`。边界保持：这是 shared Timeline focused change，不改变 TaskTimeline raw output safety notice、步骤数据、状态映射、AutoRepair attempt 逻辑、治理时间线聚合或后端行为。
- `RISK-FE-001` 补充缓解：Ant `Input` / `InputNumber` / `TextArea` / `Input.Search` 通过 `.sl-app-shell` 获得共享容器兜底，root/wrapper/affix/group/search/number wrapper 可收缩，prefix/suffix/addon 和 search action 支持长标签换行；`validate-frontend-ui.mjs` 已拒绝 Input 容器关闭 containment、容器/affix/addon 裁切、addon 文案回退到 `nowrap` 或 `ellipsis`。边界保持：这是 shared Input focused change，不改变真实 input/password/number/textarea 的编辑文本行为、输入值、placeholder、表单校验或后端行为。
- `RISK-FE-001` 补充缓解：Ant `Table` 通过 `.sl-app-shell` 获得共享 containment，wrapper/table/container/content/body/spin 可收缩，content/body 承担 `overflow-x:auto`，非 `.ant-table-cell-ellipsis` 单元格支持长项目、任务、审计、产物和错误文本换行；`validate-frontend-ui.mjs` 已拒绝非 ellipsis cell 回退到 `nowrap`、`ellipsis` 或 `overflow:hidden`，并防止共享规则强行覆盖 `.ant-table-cell-ellipsis`；`app-shell-ui-smoke` 已补 `shared-table-non-ellipsis-cell-wraps-without-clipping` 与 `shared-table-ellipsis-cell-preserves-ellipsis` 浏览器级断言，覆盖 Projects 非 ellipsis cell 和 ModelConfig API 地址 ellipsis cell。边界保持：这是 shared Table focused change，不改变 columns、dataSource、rowKey、pagination、row selection、scroll.x、固定列、业务 ellipsis 列或后端行为；复杂固定列仍可后续逐页验收。
- `RISK-FE-001` 补充缓解：Ant `Radio` / `Radio.Button` 通过 `.sl-app-shell` 获得共享可读性兜底，group/wrapper/button wrapper 可收缩，group 支持 wrap，Radio wrapper、button wrapper 和 label span 支持长模式标签换行；`validate-frontend-ui.mjs` 已拒绝 shared Radio 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 no-wrap；`p9-main-path-recoverable-error-states-batch4b` 已在 DependencyGraph 恢复成功后注入长 Radio.Button 标签，并证明 1440/320 双视口不裁切、不横向溢出。边界保持：这是 shared Radio focused change，不改变 DependencyGraph 视图切换逻辑、Mermaid 导出、图谱数据或后端行为；其他业务 Radio 仍需后续页面级验收。
- `RISK-FE-001` 补充缓解：Ant `Collapse` 通过 `.sl-app-shell` 获得共享可读性兜底，root/item/header/header text/extra/content/content box 可收缩，header 与 content 支持长日志标题、路径、错误和证据摘要换行，expand icon 保持固定尺寸；`validate-frontend-ui.mjs` 已拒绝 shared Collapse 回退到 `nowrap`、`ellipsis`、`overflow:hidden` 或 no-wrap；`patch-ready-ui-smoke` 已在 AutoRepair 详情中打开日志 Collapse，注入长 header token，并证明 1440/390/320 三视口不裁切、不横向溢出。边界保持：这是 shared Collapse focused change，不改变 AutoRepair 日志内容、LogViewer/DiffViewer 脱敏策略、PR 创建门禁、执行任务 attempt 逻辑或后端行为；其他业务 Collapse 仍需后续页面级验收。
- `RISK-AI-002` 补充缓解：hosted source URL heuristic 已将 `app/apps/client/packages` 作为受控应用容器 root，避免复杂分支名中包含 `src` 片段时把 `app/src/...` 误截为过宽 `src/...`；新增 parser 回归证明 `feature/src-preview/app/src/pages/Login.tsx#L44` 会保留 `app/src/pages/Login.tsx`，`feature/app/src/...` 会保守回退为 `src/...`，多段分支后的 `apps/client/src/...` 会保留外层 `apps/client/...`，单段分支后的 `feature/apps/client/src/...` 会保守降级为 `client/src/...`。边界保持：该降级是无仓库 file index/provider metadata 时的有意保守边界；后续完全消歧需要结合真实仓库文件索引或 provider metadata。
- `RISK-AI-002` 补充缓解：新增 `CodeChunkServiceTest#listRetrievalCandidates_shouldUseHostedSourceUrlAppRootVariantBeforeAmbiguousSuffixDecoy`，证明当 `client/src/pages/Login.tsx` decoy 与 `apps/client/src/pages/Login.tsx` target 同时进入候选集时，现有排序会利用 raw hosted URL/path suffix 信号把 target 排第一。边界保持：该门禁只覆盖候选集内排序，不证明真实文件一定进入候选集，也不替代 file index/provider metadata 消歧。
- `RISK-AI-006` 补充缓解：code_chunks role intent 已新增 bounded `CONFIG` 召回，覆盖 CORS、`application.yml`、datasource、环境变量、数据库配置和 Spring Boot runtime config；`CodeChunkService` 只用 `file_path` 条件补召回 `/config/`、`/src/main/resources/`、`application.yml`、`.env`、`.yml/.yaml/.properties` 等配置文件，`CodeChunkServiceTest` 证明 README 与 frontend `ModelConfig.tsx` 噪声干扰时仍可把 `application.yml` 排到第一且 SQL 不含 `content LIKE`。边界保持：英文泛化 `config` 已收窄为必须带 runtime/server/backend/spring/database/port/security/jwt/credential 等上下文；`model config page button` / `ModelConfig page` 不触发 `CONFIG`；这仍是 path/structure-first 检索，不代表全文语义召回完成。
- `RISK-AI-006` 补充缓解：code_chunks role intent 已新增 bounded `TEST` 与 `DOCUMENTATION` 召回；测试文件优先于 service/controller/data/model 判型，避免 `AuthServiceTest.java` 被 `Service` 片段误归类；`CodeChunkService` 只用 `file_path` 条件补召回 `/test/`、`/tests/`、`*Test.java`、`*.spec.ts(x)`、`README.md`、`/docs/`、`runbook.md` 等测试/文档文件。`CodeChunkServiceTest` 证明源码/文档噪声下测试文件可补召回、源码/配置噪声下 README 可补召回，且 SQL 不含 `content LIKE`。边界保持：`latest/contest/protest`、中文“测试一下登录接口/登录页测试按钮”、`document parser service`、`uploaded document file`、`document file parser` 和“用户上传 document 文件”不会触发 TEST/DOCUMENTATION；这仍是 path/structure-first 检索，不代表完整测试覆盖图谱或文档语义分类器完成。
- `RISK-AI-006` 补充缓解：`countSearchMatches(...)` 已与 `searchChunks(...)` 的辅助召回候选池保持一致；普通关键词查询继续走 `selectCount` 快路径，存在 role/path/method/evidence 辅助信号时才按候选池 `chunkKey` 去重计数，避免 `total=0` 但实际 `items>0` 的 UI metadata 矛盾。`CodeChunkServiceTest` 证明普通关键词不触发 `selectList`，TEST role-intent 场景下 keyword 候选为空时 count 能包含 role 候选且 SQL 不含 `content LIKE`。边界保持：辅助召回 count 是受 `RANKING_CANDIDATE_MAX_LIMIT` 保护的 candidate-pool count，不是全库精确 count。
- `RISK-AI-006` 补充缓解：`CodeChunkController` 已把存在 role/path/method/evidence 辅助结构信号且命中的 code_chunks 搜索标记为既有合同内的 `HYBRID`，不再误标为普通 `KEYWORD`；`CodeChunkControllerTest` 覆盖 TEST role-intent 查询返回 `HYBRID`，`API_DESIGN.md` 已同步 code_chunks retrievalMode 合同。边界保持：`HYBRID` 只证明结构辅助参与召回，不证明 embedding 语义质量或 LLM 事实正确；未来新增更细 retrievalMode 必须同步前端、release verifier 和 smoke marker allowlist。
- `RISK-AI-002` 补充缓解：line hint 参与 code_chunks retrieval metadata 时已增加上下文门禁；file:line、source URL line、`AuthService line 85` 和 JSON `filePath + lineNumber` 可标记 `HYBRID`，但纯 `line 85` / `第85行` 不再触发结构召回元数据；中文行号解析收紧为 `第 N 行`，`生成 85 行代码` 与 `85行代码` 不再作为定位锚点。边界保持：纯行号没有文件、路径、方法或 evidence 上下文时只能作为稳定回退，不声明行级定位可信。
- `RISK-AI-006` 补充缓解：code_chunks 已新增 bounded endpoint route hint 召回；`/api/auth/login`、hosted API URL 和带 endpoint/接口上下文的 `/login` 可进入结构信号，`CodeChunkService` 只通过 controller/api `file_path` 候选池补召回，再由 `CodeChunkRanker` 在内存排序阶段用已取回 chunk content 判断 route 命中；focused test 证明目标 Controller 排第一且 SQL 不含 `content LIKE`。边界保持：这不是完整 HTTP route graph；带 endpoint/接口上下文的非典型无扩展名绝对路径仍可能被当作 route hint，但候选池限制在 controller/api 文件路径内且有 `RANKING_CANDIDATE_MAX_LIMIT` 上限。
- `RISK-AI-006` 补充缓解：Spring route composition 已支持同一 chunk 内 class-level `@RequestMapping(prefix)` + method-level mapping suffix，对 `/prefix/suffix` 查询进行内存排序加权；规则要求 prefix mapping 在 class/interface/record 声明前，suffix mapping 在类声明后，并用两个负例防止两个方法级 mapping 或方法级 `@RequestMapping(prefix)` 被误组合。边界保持：这仍是 bounded heuristic，不是完整 Spring route resolver；跨 chunk class annotation + method annotation、变量路径模板和 meta-annotation 仍需后续专门设计。
- `RISK-AI-006` 补充缓解：Spring route template recall 已支持单 segment path variable，例如 `/api/users/42` 可命中 direct `@GetMapping("/api/users/{id}")`，也可命中 class-level `@RequestMapping("/api/users")` + method-level `@GetMapping("/{id}")`；测试锁定 segment count 不一致不误命中，且 direct/composed template 查询 SQL 均不含 `content LIKE`。边界保持：这不是完整 Spring route resolver；跨 segment wildcard、复杂 path regex、`PathVariable` 类型约束、meta-annotation 和跨 chunk route graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：Spring route template ranking 已增加 specificity score，literal segment 权重大于 path variable segment；`/api/users/{id}` 会优先于 `/api/{resource}/{id}`，避免泛化 fallback Controller 抢走具体 Controller。边界保持：这是 bounded heuristic，不是完整 Spring specificity comparator；exact literal route vs template 的更细排序、复杂 regex、跨 chunk route graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：Spring exact literal route 已作为最高可信 route 信号；`/api/users/me` 会优先于 `/api/users/{id}`，且 frontend API client exact string 不会压过后端 exact Controller。composed route 现在要求 suffix mapping 落在当前 class declaration 后、下一个 class/interface/record declaration 前，避免同一 chunk 多 class 跨类误组合。边界保持：这仍不是完整 Spring resolver；annotation 多属性、数组 mapping、复杂 regex、meta-annotation 和跨 chunk route graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：Spring mapping parser 已支持 annotation 参数内非首个 route literal 和 `value/path` 数组 route literal；同时通过属性名过滤只允许隐式 value、`value`、`path` 进入 route matching，排除 `name/produces/consumes/headers/params` 的 scalar 与数组字符串，避免把 media type、header 或 mapping name 误当 endpoint。边界保持：这是 bounded regex parser，不是完整 Java annotation AST；常量 route、SpEL、复杂转义和嵌套 annotation 仍需后续设计。
- `RISK-AI-006` 补充缓解：Spring route parser 已支持同一 chunk 内简单 `String NAME = "/route"` 常量，并且仍通过 mapping 属性过滤限制只在隐式 value、`value`、`path` 位置参与 route matching；`name` / `produces` 常量不会误当 endpoint。边界保持：这是 same-chunk simple String heuristic，不是完整 Java constant resolver；跨文件常量、字符串拼接、常量表达式、SpEL 和非 String 常量仍需后续设计。
- `RISK-AI-006` 补充缓解：Spring route parser 已支持同一 chunk 内简单 route 拼接，完整可解析的 `USER_ROOT + "/me"`、`API_ROOT + "/users"` 可作为整体 route 参与匹配；拼接表达式内部片段会被跳过，无法完整解析的 `USER_ROOT + dynamicSuffix()` 不会部分命中，`produces` 拼接和 Controller 普通 route-looking 常量不会作为强 endpoint route。边界保持：这是 same-chunk simple `+` heuristic，不是完整 Java constant-expression resolver；跨文件常量、复杂表达式、方法调用、SpEL 和跨 chunk route graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：Spring route constants 已支持同一 chunk 内有界常量链解析；`API_ROOT="/api"; USER_ROOT=API_ROOT + "/users"; CURRENT=USER_ROOT + "/me"` 可完整解析，`API_ROOT + dynamicSuffix()` 这类未解析表达式 fail-closed，不会把 `/api` 作为强 route。常量表达式仍受 `value/path` 属性门禁，`produces/name` 不会误当 endpoint。边界保持：这是 same-chunk bounded heuristic，不是 class/member scope Java resolver；同一 chunk 多 class 共享常量表、跨文件常量、复杂表达式和跨 chunk route graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：Spring route constant 解析已从整 chunk 常量表收紧为 annotation 关联 class 范围；无 class range 时 fail-closed，不回退 whole content。class declaration scanner 会跳过注释和字符串内 fake `class`，并允许 mapping 与 class 之间存在注释、额外 annotation 和 modifier。边界保持：这是 bounded scanner，不是完整 Java AST；nested/inner class、复杂语法和跨 chunk route graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：Spring route constant parser 已支持 Kotlin `const val` / `val` 形式的同 class chunk route constants，并支持大写常量名和可选 `: String` 类型标注；annotation 常量引用也支持大写标识符，且继续只允许 value/path 产生 endpoint，`produces` 不进入 route matching。边界保持：这是 bounded regex/constant-expression heuristic，不是 Kotlin AST；Kotlin string templates、top-level/cross-file constants、import constants、函数调用、复杂表达式和跨 chunk route graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：Spring mapping `value/path` 数组参数已支持逐元素 route expression 解析；Java `{ USER_ROOT + "/me" }` 与 Kotlin `[USER_ROOT + "/me"]` 可作为整体 route 参与 matching，同时二次 literal/constant 扫描会跳过拼接表达式内部片段，避免 `"/me"` 或 `USER_ROOT` 被注册为独立 endpoint。边界保持：这是 bounded annotation argument scanner，不是完整 AST；shorthand array、nested arrays、Kotlin string templates、方法调用、枚举、外部类限定名和跨 chunk route graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：Spring mapping implicit value shorthand array 已支持逐元素 route expression 解析；`@GetMapping({ USER_ROOT + "/me", "/status" })` 可解析完整 route，同时拼接片段仍被 suppression 机制跳过，不注册为独立 endpoint。边界保持：这是 bounded shorthand array support，不是完整 AST；nested arrays、Kotlin string templates、方法调用、三元表达式、collection constants、跨文件常量、meta-annotation、alias/import alias 和跨 chunk route graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：endpoint route 查询已增加 previous same-file candidate context ranking；候选集中前一个同文件 chunk 的 class-level route prefix 可与当前 chunk 的 method-level suffix 临时合成参与 scoring，返回仍是原始 current chunk，并有 unrelated suffix 负例和 SQL no `content LIKE` 回归。边界保持：这是 bounded candidate-pool reranking，不主动查 DB，不支持 prefix 不在候选池、后向 chunk、完整 adjacency graph、跨文件 route graph 或完整 Spring AST/route graph。
- `RISK-AI-006` 补充缓解：endpoint route 查询已增加单次 bounded previous same-file context candidate pull；当初始候选缺 class prefix chunk 时，可用 `scan_task_id + file_path + start_line` 结构字段拉取前一同文件 chunk，继续保持 no `content LIKE`。边界保持：仅 endpoint route hint 生效，最多前 32 个 seeds 且受 LIMIT 保护；prefix 在后一个 chunk、跨文件 route graph、多段 previous chain、超出 seed/limit 的 prefix 和完整 Spring AST/route graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：endpoint route 搜索总数已与 previous same-file context-only candidates 隔离；`searchChunks(...)` 和 `listRetrievalCandidates(...)` 继续使用 previous context 改善 route ranking/QA retrieval，但 `countSearchMatches(...)` 在 auxiliary hint 计数时关闭 previous context candidate pull，避免 UI/API `total` 把 class-level prefix context chunk 计入真实匹配。边界保持：auxiliary count 仍是 bounded candidate-pool count，不是全库语义精确 count；role/path/method/evidence/endpoint primary auxiliary candidates 的计数策略不变。
- `RISK-AI-006` 补充缓解：previous same-file context candidate pull 已改为 `start_line DESC` nearest-first，降低大文件中 LIMIT 先拉到最早老 chunk、错过离 current method 最近 route prefix 的风险；method/path/evidence/endpoint primary auxiliary candidate 排序保持不变。边界保持：这是 bounded nearest-first，不是 per-seed fair top-N；多 seed、多文件、跨文件 route graph、后向 chunk、多段 previous chain 和完整 adjacency graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：previous same-file context scoring 已从单 previous chunk 扩展为最多 3 个 previous same-file chunks 的 bounded window；class-level route prefix 与 method mapping 中间隔着字段/构造器 chunk 时，仍可组合 route context 并返回原始 current method chunk。边界保持：超过 3 个 previous chunks、跨文件 route graph、后向 chunk、多文件 controller、复杂 AST 和完整 adjacency graph 仍需后续设计。
- `RISK-AI-006` 补充缓解：previous same-file context candidate pull 现在与 ranker 3-chunk window 对齐；DB 拉回 previousCandidates 后会按 seed 过滤为同文件、`previous.startLine < seed.startLine`，且每个 seed 最多保留最近 3 个 previous candidates，避免远早于 current method 的 context-only chunk 混入 search result / QA evidence 候选。边界保持：DB 仍是单次 bounded query，不是 per-seed SQL top-N；多 seed 大文件场景仍可能受全局 LIMIT 影响。
- `RISK-AI-006` 补充缓解：`searchChunks(...)` 现在将 previous context candidates 限定为 ranking-only；visible search results 只保留 primary candidates，避免 previous-context-only chunks 混入前端 items 并与 `countSearchMatches(...)` 语义不一致。边界保持：QA retrieval 仍保留 previous context candidates；未来若 UI 要展示上下文，应通过 context expansion/evidence drawer，而不是 search result item 混入。
- `RISK-AI-004` 补充缓解：Code QA fallback citation 现在优先绑定 `PRIMARY` evidence；未配置 LLM 与 LLM 调用失败两条 fallback 路径共用同一 PRIMARY-first selector，避免相邻上下文排在 retrieved chunks 前面时被误引用为主证据。`CodeQaControllerTest` 覆盖 adjacent-first 场景下 C1 为 `ADJACENT_CONTEXT`、C2 为 `PRIMARY` 时 fallback answer 必须引用 C2；fallback note 已同步为“优先显式引用 PRIMARY 证据”。边界保持：本轮不改变 retrieval ranking/context expansion，也不证明所有未来 PRIMARY 标记都正确。
- `RISK-AI-004` 补充缓解：Code QA citation enforcement 已从全局 label 校验收紧为 claim-aware + PRIMARY-bound gate；`DIRECT_VERIFIED` 与 `RETRY_VERIFIED` 现在必须同时满足 `groundingStatus == VERIFIED`、`claimCitationCoverage.status == READY`、required claims 全部 PRIMARY-bound，且 required context-only/unknown-only 为 0。新增回归证明事实句无引用、仅末尾 `Sources: [C1]` 时会触发 retry；retry 修正为事实句带 `[C1]` 后才 `RETRY_VERIFIED`；retry 返回 null/blank 时保留原答案并标记 `RETRY_FAILED`；claim 只引用 `ADJACENT_CONTEXT` 且 footer 单独引用 PRIMARY 时不得通过 verified enforcement。边界保持：claim coverage 是 bounded heuristic，不是完整事实语义验证器；未来若支持“全局 sources 合法格式”或允许 context-only facts，必须显式设计 claim-to-source binding。
- `RISK-AI-004` 补充缓解：Project QA recoverable smoke 现在要求成功 QA 响应输出 `citationEnforcementReason=DIRECT_VERIFIED`，页面可见 `原因码 DIRECT_VERIFIED`，并在 `PROJECT_QA_RECOVERABLE_SMOKE_OK.answerReadability.citationEnforcementReasons` 中落 marker。边界保持：这是 mocked-only UI evidence，不证明真实 LLM provider、真实模型质量或 full release authority；release 级权威仍以 release verifier、status、citationCoverage 和 claimCitationCoverage 为准。
- `RISK-AI-004` 补充缓解：Code QA citation retry prompt 已与 PRIMARY-bound enforcement 对齐，不再只暴露裸 label 列表；prompt 现在列出 `[Cx] role=PRIMARY/ADJACENT_CONTEXT file=...`，并明确每条需要证据的具体代码事实必须至少引用一个 PRIMARY 标签，ADJACENT_CONTEXT 只能补充、不能作为唯一引用。测试捕获第二次 LLM call 的 retry prompt 并断言这些规则。边界保持：prompt 不是可信安全边界；真实 provider 仍可能不遵守，最终仍依赖后端 enforcement gate。

## 4. 关闭条件

风险关闭必须满足：

- 有明确修复或规避措施。
- 有测试、smoke、verifier、文档或人工验收证据。
- 有 owner 确认剩余风险可接受。
- 若影响长期路线，已写入 `AGENT_DECISION_REGISTER.md`。
- `RISK-AI-004` 补充缓解：Code QA `RETRY_FAILED` failure note 已按失败原因分类，不再让 `groundingStatus=PARTIAL/UNVERIFIED` 提前吞掉 invalid label 或 context-only 诊断；invalid `C99` 命中“不存在或无效的证据标签”，pure `ADJACENT_CONTEXT` 命中未绑定 PRIMARY 证据，uncited claim 命中缺少逐条有效引用。边界保持：note 是诊断信息，不是安全边界；最终可信度仍由 enforcement gate、claimCitationCoverage 和 citationCoverage 决定。
- `RISK-AI-004` 补充缓解：Code QA 响应新增 `citationEnforcementReason` 机器可读诊断码，覆盖 verified、fallback、invalid label、context-only、uncited claim 等路径，降低前端、smoke 或 verifier 解析中文 `citationEnforcementNote` 的脆弱性。边界保持：reason code 不是新的安全边界，AutoRepair/release gate 仍必须以 status、citationCoverage 和 claimCitationCoverage 为准。

## 4.1 2026-07-06 P6/P9 风险补充记录

- `RISK-AI-004` 补充缓解：Project QA 前端已承接并显示 `citationEnforcementReason`，低置信度 smoke marker 已输出并断言 `DIRECT_VERIFIED`、`NO_EVIDENCE`、`NO_VALID_CITATION_LABEL`、`UNCITED_REQUIRED_CLAIM`，降低 UI/smoke 解析人读 note 的风险。边界保持：reason code 仍是诊断字段，不是 AutoRepair 或 release gate；可信放行仍必须依赖 status、citationCoverage、claimCitationCoverage 和 source evidence gate。
- `RISK-FE-001` 补充缓解：Project QA 低置信度面板新增中文 reason label，顶部证据标签新增机器 reason code；`project-qa-low-confidence-ui-smoke` 已覆盖 1440、390、320 三视口并证明 reasonCodesCovered、无横向溢出、低置信文案不裁切。边界保持：这是 Project QA focused UI 证据，不等同于全站 UI 重构完成。

## 4.2 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：`citationEnforcementReason` 已进入 public repo UI 与 report evidence QA citation release evidence marker；`verify-release-evidence.sh` 要求 reason 非空且只允许 `DIRECT_VERIFIED`、`RETRY_VERIFIED`、`FALLBACK_PRIMARY_CITED`，降低 forged marker 只伪造 status 或缺失 reason 的风险。边界保持：reason code 仍不是安全边界；可信放行继续依赖 status、citationCoverage、claimCitationCoverage 与 source evidence gate。
- `RISK-REL-001` 补充缓解：security regression 有效 payload 和手写 forged marker 样本已补合法 reason，`make security-regression-release-verifier-public-repo-ui-marker` 证明 verifier 仍拒绝原目标伪造字段，而不是被缺 reason 提前拒绝。边界保持：本轮未刷新 full release authority；历史缺 reason 的旧 release evidence 包会被新 verifier 拒绝。

## 4.3 2026-07-06 P9 风险补充记录

- `RISK-FE-001` 补充缓解：ScanTaskDetail 报告证据契约卡片和报告章节追踪卡片已移除关键文本 `nowrap/ellipsis/line-clamp/overflow:hidden` 风险，label/value/source/detail 均可换行；`validate-frontend-ui.mjs` 已系统拒绝这些区域回退。边界保持：这是 report evidence focused UI 切片，不等同于全站 UI 顶级化完成。
- `RISK-FE-001` 补充缓解：320px 下 report evidence drawer content wrapper 已收窄，handoff head 单列，handoff summary 被 `report-evidence-drawer-ui-smoke` 证明 `handoffSummaryContained=true`、`narrow320Covered=true`、`noHorizontalOverflow=true`。边界保持：smoke 使用 mocked API，不证明真实后端、真实 LLM provider 或 full release authority。

## 4.4 2026-07-06 P9/P10 风险补充记录

- `RISK-FE-001` 补充缓解：ScanTaskDetail 报告 API/DB 表格中的 API `路径`、API `Controller`、DB `文件` 三个证据字段已移除业务 `ellipsis: true`，改为 `.sl-report-table-evidence-text` 可换行展示；`report-evidence-drawer-ui-smoke` 已证明长 route、长 Controller、长 DB file path 在 1440、390、320 下 `textNotClipped=true`、`noHorizontalOverflow=true`。边界保持：这是 report evidence table focused change，不等同于全站表格或全站 UI 完成。
- `RISK-AI-SEC-DISPLAY` 补充缓解：上述三个报告证据字段在前端展示时调用 `redactReportEvidenceText(value || '-')`，降低 route/class/file 字段混入 token、key、password、JWT 时被直接渲染的风险。边界保持：这是展示层脱敏，不声明源数据、数据库、artifact 内容或后端响应已永久脱敏；后端和 artifact/raw access 仍必须按 `SECURITY_BOUNDARY` 与 `RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY` 执行。

## 4.5 2026-07-06 P9/P11 风险补充记录

- `RISK-FE-001` 补充缓解：ScanTaskDetail 报告“修复治理时间线”的治理卡片、阶段、事件标题、事件详情、门禁原因和动作按钮已纳入 wrap/no-ellipsis/no-hidden-overflow 防护；`report-evidence-drawer-ui-smoke` 已用长治理事件 fixture 证明 1440、390、320 下 `reportGovernanceTimelineReadability.textNotClipped=true`、`noHorizontalOverflow=true`。边界保持：这是 report governance timeline focused change，不等同于全站 UI 完成。
- `RISK-REL-001` 补充说明：治理时间线 smoke marker 现在输出 `eventVisible` 和 `gateReasonVisible`，降低发布证据中“门禁原因实际不可读但 marker 只证明区域存在”的风险。边界保持：本轮仍是 mocked API smoke，不刷新 full release authority，也不证明真实生产治理数据完整性。

## 4.6 2026-07-06 P6/P10/P11 风险补充记录

- `RISK-AI-004` 补充缓解：Project QA -> AutoRepair handoff 已携带 `citationEnforcementReason`，并在 AutoRepair draft/create payload/backend audit provenance/candidate receipt 中保留，降低只凭 `citationEnforcementStatus` 判断可信度或丢失失败原因码的风险。边界保持：reason code 是诊断和证据链字段，不替代 status、citationCoverage、claimCitationCoverage 或 source evidence gate。
- `RISK-AI-SEC-DISPLAY` 补充缓解：Project QA citation card、copy citation、code_chunks evidence reason helper、AutoRepair URL handoff、create payload 和 backend audit provenance 已增加 seeded raw secret redaction 证明；`project-qa-autorepair-candidate-ui-smoke` 在跳转前后检查 body、data-sl-target-url、browser URL 和 payload，`AutoRepairServiceTest` 证明 audit provenance 不保留 `secret=` 与 `apiKey=sk-...` raw 值。边界保持：不声明 sanitizer 能识别所有任意形态 secret，也不声明全站 UI 面已全部完成 redaction。

## 4.7 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-006` 补充缓解：code_chunks location hint parser 已把 hosted Markdown evidence URL 纳入路径消歧链路，`.md` 现在可通过 source URL suffix、source path extension 和 evidence source URL suffix 清理；focused tests 证明 `docs/CHAIRMAN_BRIEFING.md#L20` 可去掉 host/branch/hash 噪声，并在候选排序中压过 `archive/docs/CHAIRMAN_BRIEFING.md` 同名 decoy。边界保持：Markdown URL 只是本地候选定位信号，不证明远程文档内容可信或已被拉取验证。
- `RISK-AI-SEC-DISPLAY` 补充说明：本轮没有把普通 `url` / `path` 字段升级为 evidence anchor，也没有新增远程 URL 访问能力；未知 host 仍只会作为路径 hint 参与本地匹配。边界保持：外部链接可信度、artifact/raw access 和 release evidence 权威仍按现有安全边界与发布流程处理。

## 4.8 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-006` 补充缓解：`CodeLocationHintParser` 的 path hint 扩展范围已与当前 `CodeChunkFileFilter.SUPPORTED_EXTENSIONS` 对齐，覆盖 `.sh/.scss/.cpp/.kts` 等已索引文件；focused tests 证明 hosted 脚本 URL 可去掉 host/hash 噪声，并在候选排序中压过 archive 同名 decoy。边界保持：本轮只同步当前已索引扩展，不声明所有未来语言/配置格式都已支持。
- `RISK-AI-006` 补充缓解：扩展匹配已改为长扩展优先并增加后缀边界，降低 `.kts/.tsx/.scss/properties` 被短扩展截断，以及 `.hbs/.jsonnet/.cppbackup` 被误识别为强路径 hint 的风险。边界保持：仍是 regex-based hint parser，不是完整文件系统路径验证器；最终候选可信度仍依赖本地 code_chunks 是否存在对应 file_path。
- `RISK-AI-006` 补充说明：普通 `.json` 当前未进入强路径 hint parity，因为 `CodeChunkFileFilter` 不索引普通 `.json` 文件。若后续产品需要 package/tsconfig 等 JSON 配置检索，必须同步修改 filter、parser、噪声跳过规则和测试，不可只放开 parser。

## 4.9 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：Code QA `sourceEvidenceRef.filePath` 归一化已对齐 indexed extension parity，hosted `.sh?plain=1#L12` 可匹配本地 chunk 并保持 `sourceEvidenceMatched=true`、`REPORT_LINE_ANCHOR`、`PRIMARY`、`PRIMARY_BOUND`，降低报告证据已可检索但 QA citation 证据绑定失败的风险。边界保持：这是本地 path matching，不证明远程内容可信。
- `RISK-AI-006` 补充说明：Code QA controller 侧扩展集合与 `CodeLocationHintParser` / `CodeChunkFileFilter` 当前索引范围保持一致，仍不包含普通 `.json`。若未来支持 JSON 配置检索，必须同步修改 filter、parser、controller normalization 和测试。
- `RISK-AI-SEC-DISPLAY` 补充说明：本轮未新增远程 URL 访问、执行或外部信任能力；hosted source URL 只作为字符串路径 hint 参与本地 chunk path 匹配。

## 4.10 2026-07-06 P6/P10/P11 风险补充记录

- `RISK-AI-004` 补充缓解：code_chunks exact anchor 判定已移除 middle contains 语义；`matchesEvidencePathHint`、`matchesStrictPathHint`、`matchesMethodAnchorFileHint` 只接受 exact、real suffix 或 basename/compact fallback，避免 generated/noise 中间包含路径被错误提升为 QA citation PRIMARY。边界保持：这是 ranker/anchor heuristic hardening，不是完整事实语义验证器。
- `RISK-AI-006` 补充缓解：path hint scoring 已区分 exact、suffix、basename、compact 和 middle contains；middle contains 降为弱排序信号，generated/metadata only-middle 命中额外降权。`CodeChunkServiceTest` 证明 compact target 可压过 generated/noise middle contains decoy。边界保持：复杂 monorepo package-root resolver、source map resolver 和跨仓 workspace resolver 仍未完成。
- `RISK-AI-SEC-DISPLAY` 补充说明：本轮没有新增远程 URL 访问、执行或外部信任能力；URL/path 仍只作为本地字符串 hint 和本地 chunk path 匹配。

## 4.11 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-006` 补充缓解：code_chunks ranking 已增加 module-root hint 消歧，`sourceRoot: packages/z-admin`、hosted URL 里的 `apps/client/...` 和 path suffix 中的 module root 可作为本地排序信号，降低 monorepo 同名文件跨 package 错配风险。边界保持：这是 bounded ranking heuristic，不是完整 workspace/package graph resolver。
- `RISK-AI-006` 补充缓解：module-root 强匹配只允许仓库根部 `path.equals(root)` 或 `path.startsWith(root + "/")`，`archive/packages/z-admin/...` 不会获得 module-root 加权；service 回归已覆盖 archive decoy。边界保持：非标准嵌套 workspace、vendor mirror 和自定义 source root 仍需后续 provider metadata 或 workspace graph 设计。
- `RISK-AI-SEC-DISPLAY` 补充说明：本轮没有新增远程 URL 访问、执行、外部信任或 DB/schema 字段；外部 URL 仍只作为本地字符串 hint 和本地 chunk path 匹配。

## 4.12 2026-07-06 P6/P10/P11 风险补充记录

- `RISK-AI-006` 补充缓解：code_chunks 已新增持久化 `workspace_root/module_root`，新 scan 写入 root metadata，ranker 优先使用该 metadata 做 monorepo 同名文件消歧。边界保持：这仍是 bounded metadata，不是完整 package manager workspace graph；历史 scan 不回填。
- `RISK-AI-006` 补充缓解：持久化 `module_root/workspace_root` 即使被坏数据污染，也必须满足 `filePath` anchored 校验才加权；`archive/packages/admin/...` + `moduleRoot=packages/admin` 不会被提升。边界保持：非标准 workspace layout 仍可能需要后续 provider/workspace graph 支持。
- `RISK-AI-SEC-PATH` 补充缓解：`chunkAndSave` 的 repo 边界从字符串前缀改为 `Path#toRealPath()` + `Path.startsWith(realRepoPath)`，并补 symlink escape 测试，降低 repo 内符号链接读取 repo 外文件的风险。
- `RISK-AI-SEC-DISPLAY` 补充缓解：CodeChunk search API 暴露 `workspaceRoot/moduleRoot` 前会过滤绝对路径、parent traversal 和 Windows drive path，降低坏数据导致本地绝对路径泄露的风险。
- `RISK-REL-001` 补充说明：test profile 当前关闭 Flyway，V032 真实 MySQL/Flyway integration coverage 仍未自动化；本轮通过 migration review + focused mapping/write/API tests 接受，后续 P11/P12-pre 应补真实 migration/verifier gate。

## 4.13 2026-07-06 P11/P12-pre 风险补充记录

- `RISK-REL-001` 补充缓解：code_chunks root metadata 已新增 DB schema contract gate；`schema-test.sql` 对齐 `workspace_root/module_root` 和 root indexes，`CodeChunkMapperSchemaTest` 通过真实 Spring/H2 mapper insert/readback 验证 root metadata 写入，`validate-db-schema-contract.mjs` 锁住 V032、H2 schema、entity、mapper、DTO、controller sanitizer 和关键 tests，且该 gate 已接入 `verify-all.sh`。边界保持：这是 mapper/schema/API 合同漂移门禁，不是真实 MySQL/Flyway disposable migration smoke；后者仍是 P12-pre/release 前必须补的环境级验证。

## 4.14 2026-07-06 P12-pre 风险补充记录

- `RISK-REL-001` 补充缓解：真实 MySQL/Flyway disposable migration smoke 已补齐并通过；`make mysql-flyway-smoke` 使用一次性 MySQL 8.4 容器从空库执行全部 32 个 Flyway migrations 到 v032，并断言 `code_chunks.workspace_root/module_root`、root indexes 和 `flyway_schema_history` 中 `V032__add_code_chunk_root_metadata.sql` 成功记录。`validate-db-schema-contract.mjs` 也已锁住该 smoke 的 test、script、Make target 和 success marker。边界保持：该 smoke 依赖 Docker，不进入日常 `make verify`；Flyway 对 MySQL 8.4 输出 upgrade recommended warning，但本轮真实执行已经 PASS。

## 4.15 2026-07-06 P6/P10/P11 风险补充记录

- `RISK-AI-006` 补充缓解：workspace root manifest scan 已与 code chunk file filter 的 skip dir 边界对齐；`node_modules`、`dist`、`.git` 等不参与切片的目录在 manifest scan 阶段直接 `SKIP_SUBTREE`，降低依赖包、构建产物或 Git 内部 manifest 污染 `workspace_root/module_root` 消歧信号的风险。边界保持：主代码切片遍历仍由 `Files.walk(repoRoot)` 加 `fileFilter.shouldInclude` 过滤，完整 subtree pruning 是后续性能切片，不在本轮。

## 4.16 2026-07-06 P6/P10/P11 风险补充记录

- `RISK-AI-006` 补充缓解：主代码切片遍历已从 `Files.walk(repoRoot)` 后逐文件过滤，改为 `walkFileTree + SKIP_SUBTREE`；`node_modules`、`dist`、`.git` 等 skip dirs 下文件不会进入 `fileFilter.shouldInclude` 热路径，降低公开仓库分析中的依赖/构建目录扫描成本和噪声风险。
- `RISK-AI-SEC-PATH` 补充缓解：当前 `walkFileTree` 默认不 `FOLLOW_LINKS`，逃逸 symlink 文件不会被当作 regular file 收录；后续仍保留 `toRealPath()` + `startsWith(realRepoPath)` 作为后置仓库边界检查。边界保持：合法 repo 内文件 symlink 也不会被收录；本轮不是 symlink 源码支持功能。

## 4.17 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-006` 补充缓解：主切片候选文件遍历已从预先构建完整 `List<Path>` 改为 `visitIncludedSourceFiles` visitor 流式交付，降低大型公开仓库中候选路径列表的瞬时内存占用。边界保持：切片结果 `chunksToSave` 仍按扫描任务聚合后批量写入，本轮不是完整 streaming persistence。
- `RISK-REL-001` 补充说明：`walkIncludedSourceFiles` 保留为基于 visitor 的测试/兼容 helper，避免测试与生产遍历边界分叉；focused tests 已覆盖 visitor 行为和旧 helper 行为。

## 4.18 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-006` 补充缓解：切片结果已从整任务 `chunksToSave` 聚合改为 `chunkBuffer` 按 `BATCH_SIZE=200` flush，降低大型公开仓库分析时切片结果列表的内存峰值。边界保持：这不是完整事务流式持久化，仍按批次 `insertBatch`。
- `RISK-REL-001` 补充缓解：满批 `insertBatch` 失败现在会包装为 `ChunkBatchFlushException` 并向外抛出，全局遍历异常也会向外抛出，避免 ScanTask 在 code_chunks 不完整时继续误标 `SUCCESS`。边界保持：如果前序批次已写入、后续批次失败，仍可能留下部分切片；后续需要事务或失败补偿策略进一步收敛。

## 4.19 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-006` 补充缓解：批次写库失败、尾批失败和遍历级强失败后，`CodeChunkService` 会按当前 `scanTaskId` 清理 partial `code_chunks`，降低失败扫描残留半套切片污染检索、Code QA 和报告引用的风险。
- `RISK-REL-001` 补充缓解：初始旧切片清理失败现在直接抛出，不再继续写入新切片；cleanup 补偿失败会作为 suppressed exception 追加到原异常。边界保持：这不是数据库事务；单文件读取/切片失败仍按容错策略 warn 后跳过。

## 4.20 2026-07-06 P6/P10/P11 风险补充记录

- `RISK-AI-006` 补充缓解：`chunkAndSave` 在删除旧 `code_chunks` 前验证 `scanTaskId`、`repoPath`、目录存在性和真实路径解析；无效仓库输入会直接抛出并交给 `ScanTaskService` 失败路径处理，降低扫描误成功但没有有效 chunks 的风险。
- `RISK-AI-SEC-PATH` 补充缓解：缺失路径和普通文件路径不会进入 `fileFilter` 或 DB 清理/写入流程，避免错误输入触发不必要的仓库扫描和旧 chunks 破坏。边界保持：权限错误 fixture 跨平台不稳定，本轮以实现顺序和稳定输入测试覆盖 fail-fast 主路径。

## 4.21 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-006` 补充缓解：previous same-file context 的合成评分对象现在保留 current chunk 的 `workspace_root/module_root`，避免 endpoint route ranking 在拼接 class-level prefix 后丢失 monorepo package root 消歧信号。
- `RISK-AI-004` 补充说明：该合成对象只用于排序评分，最终返回给 Code QA/API 的仍是原始 current chunk，避免拼接 content 与原始 `contentHash/embedding` 语义不一致直接外泄。边界保持：未来若将合成对象作为可见证据输出，必须重新定义 hash、embedding 和 line range 语义。

## 4.22 2026-07-06 P9/P11 风险补充记录

- `RISK-FE-001` 补充缓解：App shell 顶部 action 区域现在显式 wrap、可收缩并限制在 topbar 内；app-shell smoke 已在 1440、390、320 视口和 13 个核心路由上证明 `topbar-actions-wrap-without-clipping` 与 `topbar-actions-contained`。边界保持：这是 app shell focused gate，不等于全站所有局部 action row 完成。
- `RISK-REL-001` 补充缓解：`validate-frontend-ui.mjs` 已锁住 `.sl-topbar-actions` CSS 和 smoke marker，降低后续 UI 回退但 smoke 证据未更新的风险。

## 4.23 2026-07-06 P10/P11 风险补充记录

- `RISK-AI-SEC-PATH` 补充缓解：artifact raw download 和 preview 的读取目标现在不仅要求 storagePath 字符串位于 artifact root 内，还会拒绝 symlink artifact，并对真实路径执行 artifact root containment 校验，降低 root 内 symlink 指向 root 外文件造成 raw content 泄露的风险。
- `RISK-AI-SEC-PATH` 补充缓解：regular file 判断改为 `Files.isRegularFile(target, LinkOption.NOFOLLOW_LINKS)`，避免 Java 文件判断在 artifact 读取路径上隐式跟随 symlink。
- `RISK-AI-SEC-PATH` 补充缓解：实际 raw 读取改为 `Files.newInputStream(..., LinkOption.NOFOLLOW_LINKS)`，preview 改为 `Files.newByteChannel(..., LinkOption.NOFOLLOW_LINKS)` 后读取 size 和前 128KB，降低校验后目标文件被替换为 symlink 时读取阶段继续跟随的风险。边界保持：这不是完整父目录级 TOCTOU 防护；后续如需更强保证，应评估 `SecureDirectoryStream` 或隔离存储挂载策略。
- `RISK-REL-001` 补充缓解：legacy fallback 已限制为当前 artifact root 外、形态符合 `artifacts/scan_task/{ownerId}` 的历史迁移路径；`ArtifactStorageServiceTest` 新增 `AUTO_REPAIR` 基础 symlink escape 拒绝，以及 `SCAN_TASK + legacy summary + 当前 root 内 symlink escape` 的 readBytes/readPreview 负向测试，证明安全拒绝不会被 fallback 掩盖。边界保持：本轮不实现完整文件系统沙箱、不声明 artifact 加密完成，也不改变历史扫描产物 fallback 兼容策略。
- `RISK-REL-001` 补充缓解：新增大文本 preview 截断测试，证明 no-follow channel 读取仍保留 `MAX_PREVIEW_BYTES=128KB` 截断语义。

## 4.24 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：Code QA citation audit 现在剥离 `<del>`、`<s>`、`<strike>` HTML deleted-text block，避免 LLM 把被删除/撤销的 `[C1]` 伪装成真实可审计引用，导致未引用 claim 被误判为 PRIMARY-bound verified。
- `RISK-AI-004` 补充缓解：新增 `<del>`、`<s>`、`<strike>` 三类 fake-only citation retry 测试，证明删除线 citation 不能让首次回答 `DIRECT_VERIFIED`，必须 retry 后用可见 citation 才能 `RETRY_VERIFIED`。
- `RISK-REL-001` 补充说明：本轮同时回归 HTML code、Markdown link destination 和 Code QA focused suite，降低删除线过滤对既有可见 citation、代码块噪声过滤和链接 destination 噪声过滤的回退风险。边界保持：这是 bounded regex sanitizer，不是完整 HTML rendering/canonicalization。

## 4.25 2026-07-06 P10/P11 风险补充记录

- `RISK-AI-SEC-PATH` 补充缓解：artifact 写入侧现在在创建缺失 workspace base 后，对 workspace base、`artifacts` root 和 owner/type 父目录逐级执行 no-follow 目录校验；`artifacts` root symlink、中间父目录 symlink 和目标文件 symlink 都会 `BAD_REQUEST`，避免写入阶段通过 symlink 覆盖 artifact root 外文件。
- `RISK-AI-SEC-PATH` 补充缓解：目标文件写入改为 no-follow byte channel；已有普通文件 overwrite 语义保留，已有 symlink target 拒绝，降低生成 artifact 时的 raw path escape 风险。
- `RISK-REL-001` 补充缓解：新增缺失 workspace base 正常写入、普通文件 overwrite、artifact root symlink、父目录 symlink 和目标 symlink 五类测试，并回归 artifact controller/download 路径。
- 边界保持：当前不是 `SecureDirectoryStream` 级完整 TOCTOU 闭环；安全模型要求 artifact workspace/root 是服务私有目录，不得由非服务用户写入或 group/world writable。若未来 artifact root 可被非服务用户写入，必须升级到目录句柄级写入、隔离挂载或更强 storage sandbox。

## 4.26 2026-07-06 P10/P11/P12-pre 风险补充记录

- `RISK-AI-SEC-PATH` 补充缓解：`SecurityStartupValidator` 现在在 `prod` profile fail-closed 校验 `sourcelens.workspace.base-path`，要求已存在、非 symlink、是目录、权限可检查且不可 group/world writable；若 `${workspace}/artifacts` 已存在，也执行同等校验。
- `RISK-REL-001` 补充缓解：`SecurityStartupValidatorTest` 新增缺失 workspace、workspace symlink、artifact root symlink、group writable workspace、dev 不受影响和 prod YAML `SOURCELENS_WORKSPACE` 外部私有目录正例，降低部署环境与安全文档漂移风险。
- 边界保持：非 POSIX 权限不可检查环境会 fail-closed；prod 启动不会自动创建 workspace 目录，必须由部署/运维预置。该门禁强化私有目录模型，不替代未来可能需要的 `SecureDirectoryStream` 或隔离挂载。

## 4.27 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：code_chunks endpoint route ranking 现在会在 query 存在 route hint 时抽取 `GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS` HTTP method，并只对匹配当前 route literal 或 class+method composed route 的 Spring mapping method 加权，降低同一路径不同 HTTP method 时 QA citation 锚错 handler 的风险。
- `RISK-AI-002` 补充缓解：新增 parser 负例证明普通自然语言 `get user account`、`GET /login`、`GET /src/pages/Login.tsx` 和源码路径中的 `POST ...Controller.java` 不会生成 endpoint method hint，避免把普通动词、前端路径或文件描述误当 endpoint method 证据。
- `RISK-AI-001` 补充缓解：新增同 chunk 无关 `@GetMapping`、previous same-file context 无关 `@GetMapping` 和 `@RequestMapping(method=RequestMethod.GET/POST)` 正负例，防止 chunk-level method 扫描污染当前 route 的检索排序。
- 边界保持：当前是 chunk-level bounded ranking signal，不是完整 Spring route graph、跨文件常量解析或 method-level symbol graph；同一 chunk 内多个 handler 的精确方法级消歧仍属于后续 P6 深化项。

## 4.28 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Spring route template parser 现在支持单段 regex path variable，例如 `{id:\\d+}`，降低真实 Spring Controller 使用 regex 约束时 code_chunks/QA 检索漏掉目标 handler 的风险。
- `RISK-AI-002` 补充缓解：route expression 拼接判断改为识别 quoted literal 外的 `+`，避免 regex literal 内的 `+` 被误判为字符串拼接并导致 route literal 被跳过。
- `RISK-AI-001` 补充缓解：新增直接 regex path variable route、class+method composed regex route、空 regex 和包含 `/` 的 regex fail-closed 回归。
- 边界保持：当前不执行 regex 语义，只把合法 `{name:regex}` 作为单段 path variable template；跨 segment regex、完整 Spring AST/route graph 和跨文件常量仍是后续 P6 深化项。

## 4.29 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：`@RequestMapping(method = GET)` 和 `method = { GET, HEAD }` 静态导入写法现在能作为 route-bound HTTP method 信号参与 ranking，降低真实 Spring 项目中 GET/POST 同路径 handler 混淆风险。
- `RISK-AI-002` 补充缓解：裸 `GET/POST/...` 只在 quote/comment-aware 的 `method = ...` 属性表达式中收集，避免 `name = "GET"`、`params = "method=GET"`、`params = "x=RequestMethod.GET"`、`/* method = GET */` 和 `method = { POST /* GET */, PUT }` 这类文本或注释污染 HTTP method 判断。
- `RISK-AI-001` 补充缓解：qualified array `method = { RequestMethod.GET, RequestMethod.HEAD }` 和 `HEAD /path` 查询均有回归覆盖，避免 HEAD/GET 同路径 handler 在报告追问中混淆。
- 边界保持：这是 annotation argument bounded parser，不解析 Java import、自定义常量别名或完整 Spring AST；若项目写 `method = READ` 且 `READ` 静态指向 `GET`，仍属于后续 P6 深化项。

## 4.30 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：`springMappingLiterals(...)` 现在通过括号深度扫描截取 annotation arguments，避免 Kotlin `arrayOf(RequestMethod.GET)` 的右括号提前截断后续 `path` route literal，降低 Spring/Kotlin Controller 在 code_chunks/QA 检索中漏召回风险。
- `RISK-AI-002` 补充缓解：括号扫描跳过 quoted string、line comment 和 block comment，未闭合 quote/block comment 保守跳过该 annotation，避免为了召回 route 而吞掉后续代码形成假 route。
- 边界保持：annotation 起点仍由 bounded regex 定位；本轮不声明完整 Spring/Kotlin AST、meta-annotation、复杂表达式求值或所有 Kotlin raw string 场景。

## 4.31 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：`springMappingLiterals(...)` 在处理 annotation match 前跳过 quoted string、line comment 和 block comment 内的伪 `@GetMapping/@RequestMapping`，避免注释示例、文档字符串或旧代码说明被当成强 Spring route 证据。
- `RISK-AI-001` 补充缓解：新增 parser 合同测试和 endpoint ranking 测试，证明注释中的伪 Spring mapping 不会压过真实 controller route。
- 边界保持：普通文本 `exactRoute/routeMention` 弱命中仍存在；本轮只移除伪注解作为强结构化 Spring mapping route 的影响，不声明完整 lexer 或全量注释文本降权。

## 4.32 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：`endpointRouteHintScore(...)` 的 weak `exactRoute` / `routeMention` 现在基于 `stripJavaComments(content)` 后的内容计算，避免 `// "/api/auth/login"` 或 `/* "/api/auth/login" */` 这类注释路径文本获得 endpoint weak score。
- `RISK-AI-001` 补充缓解：真实 quoted route literal 保留召回能力；新增 controller 与非 controller comment-only negative tests，降低 code_chunks/QA citation 被历史注释或旧接口说明污染的风险。
- 边界保持：本轮只覆盖 Java/JS/Kotlin 风格 `//` 和 `/* */` 注释的 endpoint weak scoring；不覆盖 Python `#`、HTML/XML 注释、Markdown prose、docstring 或整个候选召回链路。

## 4.33 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：Code QA citation format/example 噪声过滤从裸 `example|format` 收紧为引用格式语境，避免 `ExampleService`、`FormatParser`、`example-service.ts`、`format-parser.ts` 和普通 `Resource example` 事实句被误删，降低有效引用回答被错误降级为 `UNVERIFIED` 的风险。
- `RISK-AI-002` 补充缓解：真正的 `Example:`、`Format:`、`Citation format:`、`reference format` 和 `source example` 伪引用示例仍会过滤，避免 LLM 把格式说明或示例 citation 当成真实代码证据。
- 边界保持：当前仍是 bounded regex sanitizer，不是完整自然语言分类器；未来需要 citation eval corpus 持续覆盖更多 provider 输出风格。

## 4.34 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：Code QA Markdown sanitizer 现在识别 reference-style link/image span；图片 `![... [C1]][id]` 和 inline 图片 `![... [C1]](...)` 会丢弃 alt 文本，避免不可作为正文证据的图片描述伪造 citation verified。
- `RISK-AI-002` 补充缓解：普通 reference/link label 仍保留可见文本 citation，避免修复图片隐藏引用时误伤正常 Markdown 链接正文。
- `RISK-AI-004` 补充缓解：Markdown reference definition 允许 URL 清理后目标为空仍被丢弃，避免 `[auth-diagram]:` 或 `[auth]:` 残留被 claim audit 当成 `auth` 代码事实。边界保持：这是 bounded Markdown sanitizer，不是完整 CommonMark renderer 或 DOM 可见性判定。

## 4.35 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：citation range 上限现在按包含端点后的真实 label 数量计算，`[C1-C51]` 不再因为 off-by-one 被误认为 50 个以内，降低 LLM 用一个范围批量伪覆盖过多 evidence 的风险。
- `RISK-AI-002` 补充缓解：超长 range 仍会被整体拒绝，且不会退化为 range 内端点普通 token；反向 range 与 Unicode dash 反向 range 的既有负例保持。
- 边界保持：当前上限是产品策略和 bounded parser 防滥用措施，不等同于鼓励大范围 citation；更细粒度 claim-to-evidence 质量仍需后续 eval corpus。

## 4.36 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：新增固定离线 Code QA retrieval eval corpus，把中文接口定位、弱关键词语义召回、路径行号锚点和 exact anchor 跨文件保留作为可重复测试门禁，降低 ranking 调整只修单点、不知整体回退的风险。
- `RISK-REL-001` 补充缓解：eval fixture 与 evaluator 进入后端测试门禁，后续删样本、改断言或破坏核心检索质量会在 JUnit focused/full test 中暴露。
- `RISK-REL-001` 补充缓解：evaluator 校验 case id 唯一、必填字段和 expectedIncludedPaths 非空，降低 fixture 维护时静默退化为无效样本的风险。
- 边界保持：第一版是合成离线 corpus，不替代真实公开仓库 E2E、真实 embedding provider 质量评估或性能基准。

## 4.37 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：固定离线 retrieval eval corpus 新增 `Recall@4` 与 `MRR@4` 阈值门禁，后续 ranking 改动不仅要满足逐样本断言，也必须满足整体 topK 命中与首位排序质量指标。
- `RISK-REL-001` 补充说明：`MRR@4=1.0` 当前与 `expectedFirstPath == selected[0]` 有重叠，但作为未来扩展更多样本和放宽逐样本断言时的指标钩子保留。
- 边界保持：这些指标只证明固定合成 eval corpus 不回退，不证明真实公开仓库、真实用户查询分布或真实 embedding provider 质量。

## 4.38 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：固定离线 retrieval eval corpus 新增 Vite source URL / stack frame 行号样本和 raw JSON `handler_class` + `handler_method` 样本，覆盖更接近报告追问和 handler evidence 的真实输入形态。
- `RISK-REL-001` 补充缓解：`metrics.minCaseCount` 提升到 `6`，降低后续维护时删减真实化样本而静默退化的风险。
- `RISK-AI-002` 补充缓解：fixture 与 evaluator 强制声明 `evaluationScope=fixed_golden_regression`、`benchmarkClaim=false`，避免把固定金丝雀回归门禁误宣传为真实公开仓库检索 benchmark。
- 边界保持：新增样本仍与既有 service 单测同构度较高；它们证明固定回归边界，不证明真实仓库泛化能力、真实 embedding provider 质量或端到端报告追问效果。

## 4.39 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：固定离线 retrieval eval corpus 新增 GitHub `blob` 和 `raw.githubusercontent.com` source URL 行号锚点样本，降低报告证据追问时 URL 被当普通文本、同名 legacy 文件抢占首位或 `#L245` 行号被忽略的风险。
- `RISK-REL-001` 补充缓解：`metrics.minCaseCount` 提升到 `8`，后续删减 GitHub source URL 样本会触发 fixed eval 门禁。
- `RISK-AI-002` 边界保持：新增样本证明常见 GitHub blob/raw report evidence 的 fixed golden regression，不证明任意 GitHub URL、任意分支、任意托管平台或真实公开仓库泛化质量。
- `RISK-AI-002` 补充说明：parser 对 `main/master/develop/dev/trunk` 有直接模式，对其他分支依赖源码根目录启发式回退；后续需要真实公开仓库样本覆盖 feature branch、GitLab、自托管和 monorepo module root 组合。

## 4.40 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：fixed retrieval eval corpus 新增 feature branch + `apps/client` app-root source URL 样本，覆盖 `client/src/...` suffix decoy、`packages/admin/...` 同名页面和 docs/report 噪声，降低 monorepo 报告追问误定位风险。
- `RISK-REL-001` 补充缓解：fixture `metrics.requiredCaseIds` 现在声明当前 9 个关键样本，evaluator 强制校验；后续即使 case 总数达标，替换掉关键样本也会 fail closed。
- `RISK-AI-002` 边界保持：`blob/feature/apps/client/...` 主要验证 hosted URL 源码根/app-root 启发式归一化，不等于完整 Git ref parser；含 slash 的真实 branch name 仍需后续专门消歧样本。
- `RISK-REL-001` 后续项：可继续补 `archive/apps/client/src/pages/Login.tsx` 或 `apps/client-legacy/src/pages/Login.tsx` decoy，进一步压 contains/middle-path 误命中风险。

## 4.41 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：Code QA API 层 `sourceEvidenceMatched` 已加入 trusted hosted source URL source-root 归一化；当 `https://github.com/acme/source-lens/blob/feature/apps/client/src/pages/Login.tsx#L44` 与 retrieved chunks 中的 `apps/client/src/pages/Login.tsx`、`client/src/pages/Login.tsx` 同时存在时，仍能把 target 识别为 exact source evidence 并返回 `REPORT_LINE_ANCHOR`。
- `RISK-AI-001` 补充缓解：新增 API 回归测试覆盖 `sourceEvidenceMatched=true`、PRIMARY context role、citation coverage `PRIMARY` 和 claim role distribution `PRIMARY_BOUND`，避免 retrieval 能排对但 API 证据匹配层失败的链路断点。
- `RISK-REL-001` 补充缓解：本轮通过 focused test、P6 Code QA/retrieval suite、backend full test、static security regression、DB schema contract、code-map check 和 scoped whitespace，降低 path normalization 对既有 Vite URL、本地 URL、短路径 ambiguity fail-closed 和 hosted `.sh` evidence 的回归风险。
- 边界保持：这是 bounded source-root heuristic，不是完整 Git ref parser、provider metadata resolver 或真实公开仓库 E2E；复杂 branch path、未知 host、自托管平台和 file index 消歧仍需后续 P6/P12-pre 处理。

## 4.42 2026-07-06 P6/P11 风险补充记录

- `RISK-REL-001` 补充缓解：`PUBLIC_REPO_REPORT_EVIDENCE_QA_MULTI_ANCHOR` 现在必须输出并通过 verifier 校验 `citationEnforcementReasons`，避免真实 public repo 报告证据 QA marker 只证明 status 而漏掉机器 reason code。
- `RISK-AI-004` 补充缓解：每个 public repo report evidence QA sample 现在必须携带 `citationEnforcementReason`，且只允许 `DIRECT_VERIFIED`、`RETRY_VERIFIED`、`FALLBACK_PRIMARY_CITED`，让 release evidence 可稳定区分直接验证、重试验证和 fallback primary 引用。
- `RISK-REL-001` 补充缓解：security regression 新增缺失 reason code 的 forged marker 负例；伪造 `OK` 但删除 top-level/sample reason code 会被 verifier 拒绝。
- `RISK-REL-001` 补充缓解：release verifier 现在要求 top-level `citationEnforcementReasons` 精确等于 samples 的 `citationEnforcementReason` 集合；security regression 新增 top-level/sample mismatch forged marker 负例。
- 边界保持：该门禁证明 release evidence 合同和 marker 完整性，不证明真实 public repo smoke 已刷新、不证明真实 LLM provider 质量，也不改变 Code QA API 行为。

## 4.43 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：code_chunks route ranking 现在能通过 previous same-file context 解析同一 Controller 内的 qualified route constants，降低大文件切片后 `@GetMapping(Routes.AUTH + Routes.LOGIN)` 漏召回的风险。
- `RISK-AI-002` 补充缓解：qualified expression 不再 fallback 到 simple constant name；`Routes.LOGIN` 缺失时不会误用 `MarketingRoutes.LOGIN`，降低同名非 route holder 造成的假阳性。
- `RISK-REL-001` 补充缓解：新增 simple key collision 正例，确保 `MarketingRoutes.LOGIN` 先出现时，后出现的真实 `Routes.LOGIN` qualified key 仍会注册并命中。
- 边界保持：这是 bounded Java/Kotlin route parser；不解析跨文件 constants、不构建完整 AST、不证明真实公开仓库 E2E。

## 4.44 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：code_chunks endpoint route ranking 现在能从候选池内的 route holder 文件读取 qualified constants，降低 `@GetMapping(AuthRoutes.LOGIN)` 这类真实 Spring Controller 被 POST literal decoy 抢占的风险。
- `RISK-AI-002` 补充缓解：外部 holder context 只导入 qualified keys，simple-name constants 仍限定在当前 class range；`AuthRoutes.LOGIN` 缺失时不会误用 `MarketingRoutes.LOGIN`。
- `RISK-PERF-001` 补充缓解：route holder context 限制为最多 24 个 chunks / 24k chars，且新增第 25 个 holder 不泄漏的 focused 回归，避免候选打分阶段退化为无界全库 route graph。
- 边界保持：这是 candidate-pool bounded heuristic；不解析 import、不扫描候选池外文件、不声明完整 Java/Kotlin AST 或真实公开仓库泛化能力。

## 4.45 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：route holder 候选命名扩展到 `ApiConstants/UrlConstants/UriConstants/ApiUrls/ApiUris/Paths/Endpoints` Java 文件，降低真实项目中 API path holder 命名差异导致的漏召回风险。
- `RISK-AI-002` 补充缓解：`isRouteConstantHolder(...)` 移除宽泛 `contains("uri")` / `contains("url")`，改为明确命名匹配；新增 `SecurityConstants.java` 负例，避免 `security` 中的 `uri` 子串造成假 route holder。
- `RISK-AI-002` 补充缓解：普通 `Constants.java` 仍不进入 external route holder context，避免把业务常量文件泛化为接口路径来源。
- 边界保持：Kotlin holder 已在 SQL 候选名单中，但本轮 focused ranking loop 主要验证 Java 文件名；更广泛企业命名需后续真实公开仓库样本继续补充。

## 4.46 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Kotlin `object ApiConstants` route holder 现在能生成 `ApiConstants.LOGIN` qualified constant，降低 Kotlin Spring Controller 使用 `@GetMapping(ApiConstants.LOGIN)` 时被同路径 POST literal 抢占的风险。
- `RISK-AI-002` 补充缓解：新增测试强制证明 `ApiConstants.kt` 进入 SQL candidate；本轮只把 `object` 纳入声明容器识别，不扩大 route holder 候选命名策略。
- 边界保持：这是 bounded Kotlin route holder heuristic；不覆盖 companion object、嵌套 object、import alias、动态 route expression 或真实公开仓库 E2E。

## 4.47 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：nested Kotlin object route holder 现在能注册 `ApiRoutes.Auth.LOGIN`，降低 Kotlin Spring 项目用分层 route object 时 code_chunks/QA citation 漏召回目标 Controller 的风险。
- `RISK-AI-002` 补充缓解：常量注册保留 nearest qualifier 和完整 nested qualifier，但 external holder context 仍只导入 qualified keys，避免跨文件 simple-name fallback。
- `RISK-REL-001` 补充缓解：endpoint candidate SQL 新增 `ApiRoutes.java/.kt`，并用 Java/Kotlin holder 文件名矩阵证明 candidate 参数进入查询。
- 边界保持：这是 bounded parser；不声明完整 Kotlin AST、import resolver、动态 route graph 或真实公开仓库泛化能力。

## 4.48 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Code QA endpoint route retrieval 现在复用 route-holder-aware ranking，降低 `GET /api/auth/login` 问答引用同路径 POST literal decoy 的风险。
- `RISK-AI-002` 补充缓解：route-aware 候选保留原始分数，并只接收 `>=150` 的真实 route-aware 命中；不再用无条件 `1000+` synthetic score 关闭 semantic fallback。
- `RISK-REL-001` 补充缓解：新增 `GET /missing/route` 无 route 命中时 semantic target 仍排第一的回归测试，锁住 Data-AI 指出的 fallback 吞噬风险。
- 边界保持：`>=150` 仍包含弱 route mention 档位；后续可继续拆分强 Spring route 命中、holder-resolved 命中和 docs/comment 裸提及。

## 4.49 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：Code QA endpoint route retrieval 现在要求 route-aware candidates 中存在 `springMappingRouteMatch` 才能关闭 semantic fallback，避免 docs/prose、单独 holder 或无关 source 误充当 handler evidence。
- `RISK-AI-001` 补充缓解：`semanticKeywordScore(...)` 对 endpoint route query 只给 Spring mapping route 保留 keyword score，防止 holder literal 在 semantic 排序阶段继续压过 embedding target。
- `RISK-REL-001` 补充缓解：新增 docs exact route mention 和 holder + unrelated source + semantic target 两个 focused regressions，覆盖 Data-AI 打回的 holder context 传播假阳性。
- 边界保持：该策略优先定位处理器/实现位置；route constants 文件 intent 需要后续独立分支，不在本轮完成。

## 4.50 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Code QA 现在支持显式 route constants intent；用户问“GET /api/... 路由常量在哪定义”时，holder 文件可优先于 Controller 返回。
- `RISK-AI-002` 补充缓解：`api route` / `api routes` 不再触发 constants intent，且 handler/controller/handles/处理/入口/控制器 会直接排除 holder boost，降低默认 handler 查询被 ApiRoutes 抢占的风险。
- `RISK-REL-001` 补充缓解：fixed retrieval eval corpus 新增 required case `handler-api-route-wording-over-route-constants-holder`，防止后续改 ranking 时把普通 handler API route 问法误归类为 route constants。
- 边界保持：这是 bounded intent heuristic，不是完整自然语言意图分类器；未来仍需真实公开仓库 Code QA session 继续补充 query 语料。

## 4.51 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：`apps/packages/services/modules/libs` protected module-root sourceUrl 不再生成短 suffix 变体，降低 `archive/apps/client/...`、`apps/client-legacy/...` 一类路径通过模糊 suffix 抢占 source evidence 的风险。
- `RISK-AI-001` 补充缓解：`matchesStrictPathHint(...)` 现在拒绝 archive protected-root suffix 继承 exact anchor，避免归档 decoy 被展示为精确证据。
- `RISK-REL-001` 补充缓解：fixed retrieval eval corpus 新增 required case `github-app-root-archive-decoy-over-source-url-anchor`，并补 ranker 级 exact=false/true 断言。
- 边界保持：这是 bounded monorepo path heuristic，不替代 provider metadata、workspace graph、file index 或真实公开仓库 E2E。

## 4.52 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Kotlin route constants parser 现在能处理 one-line nested object holder，降低 `object ApiRoutes { object Auth { const val LOGIN = "/api/auth/login" } }` 被表达式尾部 `}` 污染后漏解析的风险。
- `RISK-AI-002` 补充缓解：修复只在 route constant declaration expression 内、引号外遇到 `}` 时截断，没有放宽 `isRouteConstantHolder(...)` 的文件名/内容启发式边界。
- `RISK-REL-001` 补充缓解：新增 parser 级断言和 service 级回归，证明 `ApiRoutes.kt` 进入候选、GET target first、route holder included、POST literal decoy 不抢首位。
- 边界保持：这是 bounded Kotlin parser fix，不是完整 Kotlin AST、import alias resolver、动态 route graph 或真实公开仓库 E2E。

## 4.53 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：generated/noise path 不再继承 source evidence suffix/exact 权重，降低 `generated/packages/admin/src/pages/Login.tsx` 伪装成 `packages/admin/src/pages/Login.tsx` 精确证据的风险。
- `RISK-AI-001` 补充缓解：真实 target 仍保留 exact path equals；本轮只拒绝 generated/noise suffix 继承，不破坏真实文件精确定位。
- `RISK-REL-001` 补充缓解：fixed retrieval eval corpus 新增 required case `github-generated-suffix-decoy-over-source-url-anchor`，`minCaseCount` 更新为 13，防止该反例从离线门禁中丢失。
- 边界保持：generated decoy 仍可能获得 basename、关键词或 line hint 弱信号；当前不覆盖 `dist/build/out` 等生成目录命名，不替代完整 provider metadata/file index resolver。

## 4.54 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：当真实 root-relative `src/...` exact path anchor 存在时，`packages/*/src/...` 这类 suffix decoy 不再能通过宽松 exact-location 伪装成 strict exact source evidence。
- `RISK-AI-001` 补充缓解：该过滤只在 root-relative `src/...` target 存在时启用；target 缺失时保留现有 suffix/fallback 召回，避免为了消歧过度牺牲可用性。
- `RISK-REL-001` 补充缓解：fixed retrieval eval corpus 新增 required case `github-root-relative-exact-source-url-over-package-suffix-decoy`，`minCaseCount` 更新为 14，同时保留 `github-feature-branch-app-root-source-url-over-suffix-decoy` 防止 app-root ambiguity 被误伤。
- 后续风险：多 location hint 混杂时，当前 strict exact-path 判断仍可能由 path equals 与任一 line hint 覆盖组合成立；后续 P6 需要评估 path-line evidence object 成对绑定。
- 边界保持：这是 bounded root-relative sourceUrl disambiguation，不替代 provider metadata、file index resolver、package-manager workspace graph 或真实公开仓库 E2E。

## 4.55 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：structured `EvidenceLocationHint` 现在必须由同一个 hint 同时满足 path equals 与 line range 覆盖，降低多个 evidence object 混杂时 A.path + B.line 组成假 strict exact anchor 的风险。
- `RISK-AI-001` 补充缓解：非 structured evidence/sourceUrl/path hint 路径仍保留原有 exact path fallback，不因本轮收窄破坏普通 sourceUrl 行号定位。
- `RISK-REL-001` 补充缓解：新增 ranker 级回归 `isExactPathLocationAnchorMatch_shouldRejectMixedEvidenceObjectPathLinePairing`，同时覆盖 mixed negative 和 paired positive。
- 边界保持：该修复只覆盖 strict exact-path 判定；不证明真实检索链路、LLM evidence 输入全流程或 line range 风格样本全部覆盖。

## 4.56 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：structured `startLine/endLine` evidence range 现在有 ranker 级回归，证明同 path 错误 range 不能借用另一个 evidence object 的 range 成为 strict exact anchor。
- `RISK-AI-001` 补充缓解：同 object path + range paired positive 仍通过，避免为了消除混拼假阳性而破坏合法范围定位。
- `RISK-REL-001` 补充缓解：lineNumber 与 startLine/endLine 两种 evidence 输入形态均有 mixed negative / paired positive 覆盖。
- 边界保持：该切片不证明真实 Code QA answer quality、真实 LLM provider 输出质量或完整 provider raw evidence schema。

## 4.57 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Code QA API 层现在有回归测试证明 `evidenceRef.start_line/end_line` 能产生 `REPORT_LINE_ANCHOR`，且范围命中 chunk 会成为 PRIMARY citation。
- `RISK-AI-002` 补充缓解：同文件但不重叠范围的 decoy 被显式放在目标 chunk 前面，并断言为 `ADJACENT_CONTEXT/citedByAnswer=false`，降低“只按文件路径不按行范围选 PRIMARY”的假阳性风险。
- `RISK-REL-001` 补充缓解：QA 首轮 `PARTIAL` 已打回并补强为多候选 API 回归，二轮复核 PASS。
- 边界保持：该切片仍是 MockMvc controller 回归，不替代真实 report drawer -> Code QA browser smoke、真实 LLM provider 或完整 provider evidence schema。

## 4.58 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：public repo smoke 的 `reportEvidenceQaCitationQuality` 现在必须混合 `LINE_NUMBER` 与 `START_END_ONLY` evidenceRef，降低只验证 legacy lineNumber handoff 的盲区。
- `RISK-AI-002` 补充缓解：START_END_ONLY 样本强制 request 不带 `lineNumber`、response 不合成 `lineNumber`，并要求 `startLine/endLine` 覆盖 report evidence line。
- `RISK-REL-001` 补充缓解：release verifier 和 security regression 新增 mode status、mode count、bound count、range miss、line-only、缺 start/end-only 等 forged marker 拒绝项。
- 边界保持：该切片不刷新 full release authority，不证明真实 LLM provider 输出质量，不覆盖没有足够 report line-anchor candidates 的公开仓库。

## 4.59 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：fixture/testdata mirror path 不再能通过 suffix/contains 继承 sourceUrl strong evidence，降低 `tests/fixtures/src/...` 抢占真实 `src/...` 的风险。
- `RISK-AI-001` 补充缓解：exact path 仍优先通过，避免真实 evidence 指向 fixture/testdata 文件本身时被错误拒绝。
- `RISK-REL-001` 补充缓解：ranker/service 循环覆盖 `fixtures/__fixtures__/testdata/test-data` 四类形态，fixed eval corpus 新增 fixtures 与 testdata 两个 required cases，`minCaseCount=16`。
- 边界保持：不能宣称 fixture/testdata 永不入选；本轮只阻断它们继承 sourceUrl/path+line 的强 exact/suffix 证据。

## 4.60 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：arbitrary hosted branch 中紧贴 branch 后的 `web-console` 等 strong root segment 不再直接被当作源码根，降低 `feature/web-console/src/index.ts` 误选 `web-console/src/index.ts` 的风险。
- `RISK-AI-001` 补充缓解：`feature/code-review/web-console/...` 这类 nested branch + 真实 strong root 仍保留，`master` known branch 也有 parser 回归保护。
- `RISK-REL-001` 补充缓解：fixed retrieval eval corpus 新增 required case `github-branch-strong-root-decoy-over-root-relative-source-url`，`minCaseCount=17`，防止该边界回退。
- 边界保持：这是保守 URL parser heuristic；单段 branch `feature` + 真实 `web-console/...` 与多段 branch `feature/web-console` + 真实 `src/...` 仅凭 URL 仍不可完全区分，后续需要 provider metadata / file index resolver。

## 4.61 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：显式 `sourceRoot/workspaceRoot/moduleRoot` 元数据现在可以恢复上一轮保守降级带来的歧义，让 `sourceRoot: web-console` 场景优先命中 `web-console/src/index.ts`。
- `RISK-AI-002` 补充缓解：sourceRoot metadata boost 只在 root 匹配且 exact location anchor 成立时生效；parser 拒绝 `src`、`../bad`、含 `..` 或过长 root，降低用户输入任意 root 造成错误强提权的风险。
- `RISK-REL-001` 补充缓解：fixed retrieval eval corpus 新增 required case `github-source-root-metadata-resolves-hosted-branch-strong-root-ambiguity`，`minCaseCount=18`，同时保留无 `sourceRoot` 的保守降级负例。
- 边界保持：这是 provider/report metadata-aware resolver 的第一步，不是完整 file index resolver；如果未来 chunk 仅存 module-local `src/index.ts`，还需要基于 workspaceRoot/moduleRoot 合成虚拟全路径。

## 4.62 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：module-local `filePath=src/index.ts` 现在可结合 `workspaceRoot/moduleRoot=web-console` 匹配 `sourceRoot: web-console`，降低 code_chunks 存储为模块内相对路径时的同名文件错配风险。
- `RISK-AI-002` 补充缓解：当 sourceRoot metadata winner 存在时，同 normalized path 但 root metadata 不匹配的 exact decoy 会被过滤，避免根目录或其他 package 的 `src/index.ts` 污染 QA context。
- `RISK-REL-001` 补充缓解：`chunkKey` 纳入 workspaceRoot/moduleRoot，eval harness 新增 expectedFirstWorkspaceRoot/moduleRoot 断言，fixed corpus 新增 `github-source-root-metadata-resolves-module-local-path`，`minCaseCount=19`。
- 边界保持：错误或陈旧 `sourceRoot` 仍可能强选错；多上下文 diversity 仍按 filePath 计数，未来如需同时返回多个 module-local context，需要升级为 virtual path grouping。

## 4.63 2026-07-06 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：context diversity 现在使用 virtual file key，module-local `src/index.ts` 会按 `moduleRoot/src/index.ts` 或 `workspaceRoot/src/index.ts` 分组，降低同路径多模块上下文被裸 filePath 限额挤掉的风险。
- `RISK-AI-002` 补充缓解：service/eval 已加入未声明 `packages/marketing` 同 path decoy，证明只声明的 `web-console`、`packages/admin`、`apps/client` 进入前三个 context。
- `RISK-REL-001` 补充缓解：eval harness 新增 `expectedIncludedWorkspaceRoots`，fixed corpus 新增 `github-source-root-metadata-keeps-module-local-virtual-path-diversity`，`minCaseCount=20`。
- 边界保持：多个 root hint 同时出现会扩大 sourceRoot metadata boost 的召回范围；第 4 个 context 仍可能由 role diversity 补入非 sourceRoot 噪声，后续需要 live evidence 观察是否影响回答质量。

## 4.64 2026-07-07 P6/P11 风险补充记录

- `RISK-REL-001` 补充缓解：真实公开仓库 focused evidence `p6-public-repo-code-qa-20260707-000013` 已通过 `verify-release-evidence.sh`，证明 P6 Code QA、weak keyword semantic fallback、claim citation boundary 和 report evidence QA citation marker 在真实扫描 `scanTaskId=285` 上可复核。
- `RISK-AI-001` 补充缓解：`projectQaWeakKeywordEvaluation.cases[]` 现在显式写入 `scanTaskId`，避免 case 级样本只靠外层 marker 或 retrieved chunk IDs 间接绑定当前 scan。
- `RISK-AI-002` 补充缓解：本轮先由 verifier 拒绝旧 marker，暴露缺失 case scan binding；修复后 marker 复核确认 4 个 weak keyword case 的 `scanTaskId` 与 `retrievedChunkScanTaskIds` 均等于顶层 `scanTaskId=285`。
- 后续风险：`release-verifier-public-repo-marker` 安全回归本轮卡在临时 verifier 子进程并被中断，需单独定位该回归耗时/卡死问题；本轮不刷新 full release authority，也不覆盖 public repo UI smoke。

## 4.65 2026-07-07 P11 风险补充记录

- `RISK-REL-001` 补充缓解：`release-verifier-public-repo-marker` 卡住/残留风险已通过 Node fallback process group kill 修复；无 `timeout/gtimeout` 的 macOS 路径会创建 detached process group，并在 timeout 时按进程组发送 `SIGTERM/SIGKILL`。
- `RISK-REL-001` 复核证据：focused security regression 在 verbose 与 silent 两种模式下均 PASS；奥特曼 / Security Engineer runtime `Russell / 019f3839-94fb-7421-8aea-8623455987e0` 确认无残留相关进程。
- 剩余风险：该 suite 仍耗时约 4 分钟，属于 P11 性能/可观测性风险；正常路径 PASS 不能单独证明 timeout 分支已被动态触发，后续可补极小 timeout harness。
- 边界保持：如果被测命令内部 `setsid` 或 daemonize 脱离当前子进程组，wrapper 不能保证杀掉脱组后代；当前 suite 未见该模式。

## 4.66 2026-07-07 P6 stage close 风险接受记录

- `RISK-AI-001` 阶段接受：P6 第一阶段已通过 fixed offline corpus、真实公开仓库 focused evidence 和 Code QA citation regression 支撑收口，但不宣称真实 LLM provider 事实质量或所有仓库泛化能力。
- `RISK-AI-002` 阶段接受：sourceUrl、sourceRoot、module-local virtual path、fixture/testdata、generated/archive decoy 等高风险错配已进入回归门禁；完整 provider raw evidence schema parser 和 file index resolver 仍是后续 P6/P12-pre 深化项。
- `RISK-REL-001` 阶段接受：当前 full authority 仍为 `release-current-schema-20260705-0610`；`p6-public-repo-code-qa-20260707-000013` 只作为 P6 focused evidence，不冒充 full authority。
- `RISK-OPS-001` 阶段接受：GitHub App/Webhook E2E、真实 LLM provider、生产级灾备恢复、回滚签署和生产部署继续后置，不阻塞当前公开仓库 P6 收口。
- `RISK-UI-001` 后续迁移：public repo UI 最新 focused 缺口与大厂级体验问题进入 P9，不作为 P6 stage close 阻塞项。

## 4.67 2026-07-07 P9 风险补充记录

- `RISK-FE-001` 补充缓解：app shell topbar 已新增桌面/移动响应式合同，桌面端 env/ports/username 必须可见且不裁切，320px 移动端 env/ports/username 必须折叠，避免辅助信息挤压页面标题。
- `RISK-FE-001` 回归防线：`.sl-topbar-username` 已禁止 `ellipsis` / `overflow:hidden` 回退；`validate-frontend-ui.mjs` 和 `app-shell-ui-smoke` 均锁住该合同。
- `RISK-REL-001` 补充缓解：本轮 frontend build、static UI gate 和 13 路由 × 3 视口 app-shell smoke PASS，降低后续顶部布局回退但未被发现的风险。
- 边界保持：该切片只覆盖 app shell topbar，不证明报告页、任务页、产物页、审计页或全站所有局部 action row 已完成大厂级 UI。

## 4.68 2026-07-07 P9/P10 风险补充记录

- `RISK-FE-001` 补充缓解：报告证据抽屉 action rail 现在有可见的修复门禁说明，READY/GAP 状态都能直接看到开放或阻断原因，不再只依赖 disabled button title。
- `RISK-AUDIT-001` 补充缓解：GAP 状态明确显示“缺少可用 code_chunks 主证据，暂不允许直接生成修复候选”，降低用户误以为 UI 故障或绕过复核直接修复的风险。
- `RISK-REL-001` 补充缓解：`report-evidence-drawer-smoke` marker 新增 `readyRepairActionEnabled=true` 和 `repairGateReasonVisible=true`，`validate-frontend-ui.mjs` 锁住 CSS、smoke 和 marker，降低 READY 开放证明与 GAP 阻断原因回退风险。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Hypatia / 019f385c-3a1d-7ad0-90e1-b29bc22ba8d9` 首轮 `PARTIAL` 的 READY enabled、marker 字段和断点 validator 语义已补强并二轮 PASS。
- 边界保持：该切片不证明真实 AutoRepair patch 质量、不覆盖所有 disabled action、不刷新 full release authority。

## 4.69 2026-07-07 P11 风险补充记录

- `RISK-REL-001` 补充缓解：`run_with_timeout` Node fallback 现在有 integration-drill 动态探针，强制 Node fallback 后触发 1 秒 timeout，并验证 timeout 文案和 nested child process group 清理。
- `RISK-OPS-001` 补充缓解：默认行为仍优先系统 `timeout/gtimeout`，强制 Node fallback 和内部 timeout probe 都需要显式 env，避免 CI/本地默认路径被误切换。
- `RISK-OPS-001` 复核闭环：黄仁勋 / DevOps Engineer runtime `Kepler / 019f3867-30d7-7c41-8ba7-6984b3d6b346` 确认内部 probe 在 suite filter 前直接进入 timeout 分支，无递归风险。
- 剩余风险：该切片不降低 `release-verifier-public-repo-marker` 约 4 分钟 runtime；不证明主动 daemonize / setsid 脱组的后代进程可被清理。

## 4.70 2026-07-07 P11 风险补充记录

- `RISK-REL-001` 补充缓解：`release-verifier-public-repo-marker` 的 3 个 public repo marker 负例现在共用一个已验证的 required-failure base fixture，降低重复 evidence 包生成和重复基础 verifier 校验。
- `RISK-REL-001` 回归证据：focused suite `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker` PASS。
- 剩余风险：suite 实测仍为 `real 4:14.81`，说明主要成本不是 base package 生成，而是大量 `verify-release-evidence.sh` 子进程逐个启动验证 marker mutation。
- 下一步风险处理：需要 batch verifier 或 marker-only batch validation；不能通过删减 mutation 矩阵来“优化”耗时。

## 4.71 2026-07-07 P11 风险补充记录

- `RISK-REL-001` 补充缓解：public repo marker high-frequency mutation 已改为 marker-only batch validation，同一 Node 进程复用 `verify-release-evidence.sh` 的权威 marker validator，避免逐个启动完整 verifier 子进程。
- `RISK-REL-001` 回归证据：`release-verifier-public-repo-marker` focused suite PASS，runtime 从 4 分钟级降为约 40 秒；黄仁勋 / DevOps Engineer runtime `Locke / 019f3880-7834-7e91-9bc1-1d07f8760f02` 复核 `PASS`。
- `RISK-OPS-001` 补充缓解：batch runner 仍通过 `run_security_node` 走统一 timeout；natural endpoint 的 `batch_dir` / `batch_output_file` 局部变量污染已按 DevOps 建议修复。
- 边界保持：该 batch runner 不刷新 full release authority；它证明 marker validator 规则矩阵，不证明 P6 检索质量本体或真实 LLM provider 事实质量。

## 4.72 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：P6 final focused evidence `p6-final-public-repo-code-qa-20260707-0153` 已在真实公开仓库上证明 `projectQaWeakKeywordEvaluation.status=OK`、`semanticFallbackHits=4`、`retrievalModeDistribution.SEMANTIC_FALLBACK=4`，且 4 个 case 均绑定 `scanTaskId=287`。
- `RISK-AI-002` 补充缓解：同包证明 `reportEvidenceQaCitationQuality.status=OK`、`sampleCount=4`、`evidenceRefModeStatus=MIXED_LINE_AND_START_END`、`narrativeCitationStatus=ALL_SAMPLES_NARRATIVE_BOUND`，降低 report evidence -> Code QA citation 断链风险。
- `RISK-REL-001` 补充缓解：同包 `required_failures=0`、`optional_warnings=0`，并通过 `verify-release-evidence.sh` 与 `release-verifier-public-repo-marker` focused security regression。
- 边界保持：该包是 focused authority，不刷新 full release authority；weak keyword 使用本地 MOCK embedding，不证明真实外部 provider 质量；不包含 public repo UI smoke。

## 4.73 2026-07-07 P9 风险补充记录

- `RISK-FE-001` 补充缓解：Dashboard command panel 的 QA/AutoRepair disabled action 现在显示可见阻断原因，避免用户只看到不可点击按钮却不知道缺少仓库、成功扫描或报告证据。
- `RISK-FE-001` 回归防线：`.sl-dashboard-command-disabled-reason`、`.sl-dashboard-command-label` 和 `.sl-dashboard-command-value` 均锁定为可换行、不省略、不隐藏；`validate-frontend-ui.mjs` 拒绝 nowrap ellipsis 回退。
- `RISK-REL-001` 补充缓解：`dashboard-next-action-smoke` 覆盖异常、空仓库、无成功扫描分支，`1440x900`、`390x844` 与 `320x740` 都断言 disabled reason 可见、不撑破 viewport，且 computed style 明确为 `overflow: visible`、`overflow-wrap: anywhere`、`text-overflow: clip`、`white-space: normal`。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Avicenna / 019f3899-0958-7eb2-a037-c603b4d170fa` PASS；其非阻断建议已补强为三断点 smoke 和 computed style 断言。
- 边界保持：该切片只覆盖 Dashboard command panel；全站 disabled action、public repo UI smoke、真实生产数据和 full release authority 仍需后续阶段继续验证。

## 4.74 2026-07-07 P9/P10 风险补充记录

- `RISK-FE-001` 补充缓解：ProjectDetail CodeUnderstandingLens 的“解释此处 / 交给 Agent”现在有独立 `Agent 交接门禁说明`，不再只依赖 disabled button title 或 Tag 文本表达阻断原因。
- `RISK-AUDIT-001` 补充缓解：stale scan 与 context-only 状态会明确显示不能交接的原因，降低错误扫描、上下文线索或非 PRIMARY 证据被误当作 Agent 输入的风险。
- `RISK-REL-001` 补充缓解：`project-qa-recoverable` smoke 覆盖 `1440x900`、`390x844`、`320x740`，并在 marker 中证明 `explicitGateReasonVisible`、`readyGateReasonVisible`、`readyGateReasonStyleSafe`、`blockedGateReasonVisible`、`contextOnlyGateReasonVisible`、`gateReasonStyleSafe` 均为 true。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Newton / 019f38a2-039f-72d1-8da8-67af66d939e3` PASS；非阻断建议已补强 READY gate computed style 对称断言并复测通过。
- `RISK-OPS-001` 边界保持：该 UI 门禁不自动创建 AgentTask、不自动发送 AgentChat、不改变后端 QA 检索、AutoRepair gate 或 release authority；它只降低用户在前端误操作和误解状态的风险。

## 4.75 2026-07-07 P9/P6 风险补充记录

- `RISK-FE-001` 补充缓解：ScanTaskDetail code knowledge 区域现在显示独立 `代码知识库操作门禁说明`，ready/error/zero-chunk 状态都能直接看到门禁开放或阻断原因，不再只依赖 `代码问答` / `检索切片` disabled button。
- `RISK-AI-002` 补充缓解：zero-chunk 和 error 状态明确提示检查 `chunk_code`、切片落库或重新读取状态，降低用户在没有 code_chunks 证据时误以为 QA/RAG 可用的风险。
- `RISK-REL-001` 补充缓解：batch4A smoke 覆盖 `1440x900`、`390x740`、`320x740`，marker 证明 `blockedReasonVisible=true`、`readyReasonVisible=true`、`textStyleSafe=true`、`gridTextStyleSafe=true`。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Hilbert / 019f38ae-37f7-73f3-b1c1-0e4ebead24f6` PASS；非阻断建议指出的 code knowledge grid ellipsis 已补强并复测。
- 边界保持：该切片只覆盖 ScanTaskDetail code knowledge 区域；不证明真实 LLM/embedding provider 质量、不改变后端 code_chunks 检索、不刷新 full release authority、不代表全站 P9 完成。

## 4.76 2026-07-07 P9/P10 风险补充记录

- `RISK-FE-001` 补充缓解：ScanTaskDetail report evidence priority rail 现在为首要风险证据、引用预检和治理闭环三张卡显示可见 `修复门禁说明`，不再只靠“可进入修复候选/不直接生成修复”标签表达状态。
- `RISK-AUDIT-001` 补充缓解：引用预检明确说明 QA citation/code_chunks 只证明引用预检，不等同于文件级修复证据；治理闭环明确说明不替代文件级风险证据，降低用户把预检/审计责任链误当成修复授权的风险。
- `RISK-REL-001` 补充缓解：`report-evidence-drawer-smoke` marker 证明 `repairGateReadyVisible=true`、`repairGateBlockedVisible=true`、`repairGateReasonVisible=true`；`validate-frontend-ui.mjs` 锁住 `repairGateReason`、visible note、CSS wrap 和 smoke marker。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Bohr / 019f38bb-2e0d-7b92-ae46-96a1e8574c39` PASS；非阻断建议中的完整字符串静态锁点和 priority card 文本 wrap 已补强。
- 边界保持：该切片只覆盖 ScanTaskDetail report evidence priority rail；不改变 AutoRepair 后端、不生成 patch、不证明真实 patch 质量、不刷新 full release authority。

## 4.77 2026-07-07 P9/P10 风险补充记录

- `RISK-FE-001` 补充缓解：ScanTaskDetail `报告推荐下一步` 现在显示独立 `报告推荐动作门禁说明`，不再只依赖按钮 disabled、标题或推荐状态表达当前主动作边界。
- `RISK-AUDIT-001` 补充缓解：failed/running/file-bound repair/project-level risk/evidence gap/code_chunks gap/QA-ready 分支均有独立动作门禁文案，降低用户把推荐动作误解为 QA、AutoRepair、审计或发布结论已成立的风险。
- `RISK-REL-001` 补充缓解：`report-evidence-drawer-smoke` marker 证明 `recommendedStep.gateVisible=true`、`gateReasonVisible=true`、`gateReasonStyleSafe=true`、390/320/no-overflow；`validate-frontend-ui.mjs` 锁住 action gate 字段、CSS、smoke 和 marker。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Schrodinger / 019f38c8-96e2-7302-a7b9-9212c30b8719` PASS；非阻断建议中的普通文件级修复分支静态锁点已补强。
- 边界保持：该切片只覆盖 ScanTaskDetail report overview 推荐下一步；不改变后端 scan/report/QA/AutoRepair 逻辑、不证明真实 patch 质量、不刷新 full release authority。

## 4.78 2026-07-07 P9/P10 风险补充记录

- `RISK-FE-001` 补充缓解：ScanTaskDetail report trace map 现在为五张证据面卡片显示可见 `追踪动作门禁说明`，不再只靠 disabled 按钮表达“打开来源/追问代码/复制问答链接”是否可用。
- `RISK-AUDIT-001` 补充缓解：质量风险、API 表面、数据模型、依赖图谱和产物证据分别说明当前动作依赖核心报告、扫描产物、图谱产物、项目上下文或产物归档，降低用户把缺证据状态误解为 UI 故障的风险。
- `RISK-REL-001` 补充缓解：`report-evidence-drawer-smoke` marker 证明 `traceGateCount=5`、`traceGateVisible=true`、`traceGateReasonVisible=true`、`traceGateReasonStyleSafe=true`、390/320/no-overflow；`validate-frontend-ui.mjs` 锁住字段、CSS、smoke 和 marker。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Dewey / 019f38d2-3e15-7fd1-9b38-4ae1ca721c88` 首轮 `PARTIAL` 指出只测 first gate 的缺口；已补 5 张卡逐卡 style/button proof 和 marker `traceGateProofs` 后二轮 `PASS`。
- 边界保持：该切片只覆盖 ScanTaskDetail report trace map；不改变后端报告解析、artifact schema、QA、AutoRepair 或治理时间线逻辑，不刷新 full release authority。

## 4.79 2026-07-07 P9/P10/P11 风险补充记录

- `RISK-FE-001` 补充缓解：AuditLogs 新增 `审计判定门禁说明`，明确 READY/REVIEW/BLOCKED，降低用户把分页、筛选或 deep link 局部结果误读为全局审计健康的风险。
- `RISK-AUDIT-001` 补充缓解：审计源失败和 deep link miss 会进入 BLOCKED；顶部状态改为 `审计源需复核`，不再静态宣称 `审计链路在线`。
- `RISK-REL-001` 补充缓解：`audit-logs-detail-selection` smoke 新增手动筛选 `total==visible` 仍 REVIEW、分页 `total>visible` REVIEW、源错误 BLOCKED 三类回归；`validate-frontend-ui.mjs` 锁住 submitted filter scope、动态状态线和 smoke marker。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Ramanujan / 019f38de-ac82-7693-9c94-d81dac61bc7d` 首轮 `PARTIAL` 指出手动筛选、静态在线文案和 smoke 覆盖缺口；修复后三项全部复测，二轮 `PASS`。
- 边界保持：该切片只覆盖 AuditLogs decision gate 和 source-health truthfulness；不改变后端审计 API，不证明全局安全裁判，不刷新 full release authority。

## 4.80 2026-07-07 P9/P10/P11 风险补充记录

- `RISK-FE-001` 补充缓解：AgentTasks 详情页新增 `Agent 任务动作门禁说明`，明确 PENDING、RUNNING、终态有输出、终态缺输出和未知状态下启动/取消/复盘/扫描/对话动作为什么开放或关闭。
- `RISK-AUDIT-001` 补充缓解：终态任务只开放复盘证据查看，不允许再次启动或取消；终态缺少摘要/输出时进入 BLOCKED 复核语义，降低缺证据任务被误当成可复盘结论的风险。
- `RISK-REL-001` 补充缓解：`agent-tasks-detail-selection` smoke 覆盖 `1440x900`、`390x844`、`320x740`，marker 证明 `runningGateVisible=true`、`terminalMissingOutputBlocked=true`、`unknownStatusBlocked=true`、`noHorizontalOverflow=true`。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Beauvoir / 019f38ef-f83d-7ff0-8dc5-614dc66df04d` 首轮 PASS；根据非阻断风险补强 RUNNING / terminal missing output / unknown runtime coverage 后二轮 PASS。
- 边界保持：该切片只覆盖 AgentTasks detail action gate；不改变后端 AgentTask 状态机、真实 worker 执行、AgentChat、AutoRepair 或 full release authority。

## 4.81 2026-07-07 P9/P10/P11 风险补充记录

- `RISK-FE-001` 补充缓解：ExecutionTasks 详情页新增 `执行任务动作门禁说明`，明确 active、SUCCESS、FAILED 有证据、FAILED 缺证据、CANCELLED 和 unknown 状态下取消、来源、步骤/日志、产物和终态结论为什么开放或关闭。
- `RISK-AUDIT-001` 补充缓解：FAILED 缺少错误/步骤/日志证据时进入 BLOCKED 复核语义，降低缺证据失败任务被误当成可复盘结论的风险；SUCCESS/CANCELLED/FAILED with evidence 只开放复盘证据查看，不允许状态变更。
- `RISK-REL-001` 补充缓解：`execution-tasks-detail-selection` smoke 覆盖 `1440x900`、`390x844`、`320x740`，marker 证明 `successGateVisible=true`、`runningGateVisible=true`、`failedWithEvidenceReviewVisible=true`、`failedMissingEvidenceBlocked=true`、`cancelledGateVisible=true`、`unknownStatusBlocked=true`、`noHorizontalOverflow=true`。
- `RISK-SEC-001` 边界声明：日志安全证据限定为 `LOG_VIEWER_DISPLAY_REDACTION_ONLY`，不宣称后端存储或 API 原始日志已脱敏。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Rawls / 019f38fd-1a36-7f71-9b12-8b80d5e47f1e` 首轮 PASS；根据非阻断风险补强 FAILED with evidence / CANCELLED runtime coverage 后二轮 PASS。
- 边界保持：该切片只覆盖 ExecutionTasks detail action gate；不改变后端 ExecutionTask 状态机、真实 worker 执行、AgentChat、AutoRepair 或 full release authority。

## 4.82 2026-07-07 P9/P10/P11 风险补充记录

- `RISK-FE-001` 补充缓解：AgentChat closure rail 新增 `Agent 闭环动作门禁说明`，明确 no-active、linked、handoff、unbound、loading、task-error、missing-task-detail、no-scan 状态下审计、AgentTask 和扫描报告入口为什么开放或关闭。
- `RISK-AUDIT-001` 补充缓解：unbound、task-error、missing-task-detail 和 no-scan 不再让用户误以为审计、任务和扫描报告证据链完整；扫描报告入口在 scanTaskId 未确认时保持关闭。
- `RISK-REL-001` 补充缓解：`agent-chat-closure-rail` smoke 覆盖 `1440x900`、`320x740`，marker 证明 `noActiveClosedVisible=true`、`loadingReviewVisible=true`、`taskErrorBlockedVisible=true`、`missingTaskDetailVisible=true`、`noScanBlockedVisible=true`、`providerQualityClaim=false`、`llmFactClaim=false`。
- `RISK-FE-001` 复核闭环：扎克伯格 / Frontend Engineer runtime `Aristotle / 019f390c-511b-7c50-9651-a6adafdb530e` 首轮 `PARTIAL` 指出 smoke/marker 证明力不足和 linked/handoff id 混淆；已补强分支 smoke、marker 断言和 static gate，二轮复核 `PASS`。
- 边界保持：该切片只覆盖 AgentChat closure rail 前端状态面；不改变后端 AgentChat/AgentTask/AuditLogs/ScanTask API，不证明真实 LLM provider、全站 Agent 闭环、AutoRepair 或 full release authority。

## 4.83 2026-07-07 P6/P10/P11 风险补充记录

- `RISK-AI-002` 补充缓解：`claimCitationCoverage` 新增 `readyForRepair`、`readinessReason`、`readinessNote`，避免后续消费者只读 `status=READY` 就把 context-only 或 unknown-only claim 当成可修复依据。
- `RISK-AUDIT-001` 补充缓解：ProjectDetail 修复候选入口优先使用后端 `readyForRepair=true && readinessReason=PRIMARY_BOUND_READY`，旧响应 fallback 仍要求 PRIMARY-bound roleDistribution、claim count、invalid/uncited/context/unknown/file count 完整一致。
- `RISK-REL-001` 补充缓解：`CodeQaControllerTest` 覆盖 PRIMARY-bound ready、context-only、invalid label、uncited review 和 UNKNOWN_ONLY 防御分支；`validate-frontend-ui.mjs` 锁住 API 类型和前端门禁消费。
- `RISK-AI-002` 复核闭环：拉里佩奇 / QA Engineer runtime `Euclid / 019f391d-8f57-76c0-8a90-1d6aceed456c` PASS；其非阻断 UNKNOWN_ONLY 单测建议已补强并复测。
- 边界保持：该切片不证明 LLM 事实质量、不改变 AutoRepair 服务端候选创建或真实 patch 生成、不刷新 full release authority。

## 4.84 2026-07-07 P6/P10/P11 风险补充记录

- `RISK-REL-001` 补充缓解：release verifier 现在要求 public repo verified QA marker 具备 `readyForRepair=true` 和唯一 `PRIMARY_BOUND_READY`，降低 `status=READY` 被误当作修复授权的风险。
- `RISK-AUDIT-001` 补充缓解：`sourceFileMatchRelease` 必须与 verified QA 的 PRIMARY-bound readiness 一致；证据链不完整时不能只靠 UI 文案通过发布证据。
- `RISK-AI-002` 补充缓解：`fileAnchorDrift` 显式记录 `readyForRepair=false` 和 `CONTEXT_ONLY_CLAIM`，避免 context-only 引用被误判为可进入 AutoRepair。
- `RISK-REL-001` 回归闭环：`security-regression-check.sh --suite public-repo-ui-marker` 和 `--suite report-evidence-marker` 均 PASS，覆盖 readiness 缺失、false、context-only reason 伪造。
- 边界保持：该切片只强化发布证据和防伪门禁；不证明真实公开仓库全链路、真实 LLM 事实质量、真实 patch 质量或 full release authority。

## 4.85 2026-07-07 P6/P9/P11 风险补充记录

- `RISK-REL-001` 补充缓解：code_chunks readiness 新增 `/code-chunks/status` 轻量接口，避免状态页复用 `/search` 空 query 导致大仓库超时。
- `RISK-PERF-001` 补充缓解：状态样例和空 query 稳定回退强制使用 `(scan_task_id,id)` 索引；真实 MySQL 17,001 chunks 状态接口降到亚秒级，空 query search 降到 0.1s 内。
- `RISK-FE-001` 补充缓解：ScanTaskDetail 增加 load sequence guard，减少旧请求覆盖新 code knowledge 状态的竞态风险。
- `RISK-REL-001` 回归闭环：完整 public repo smoke PASS，包含 `PUBLIC_REPO_UI_SMOKE_OK`、移动端报告证据抽屉、QA citation、治理时间线、AutoRepair handoff 和 artifact quality。
- 边界保持：该切片不证明 GitHub App E2E、私有仓库、多用户协作、真实 LLM provider 或生产部署完成；用户 8080 若仍是旧后端进程，需要重启后加载本轮代码。

## 4.86 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Code QA backend-flow 检索增加同业务域排序和邻接补齐，降低 controller/service/repository 等角色词噪声把无关文件排到主证据前面的风险。
- `RISK-AI-002` 补充缓解：同一业务域的 controller/service/data-access/domain-model 更容易同时进入候选上下文，提升后续 QA citation 的候选证据质量。
- `RISK-REL-001` 回归闭环：`CodeQaRetrievalServiceTest` 新增 backend-flow same-domain neighbor 用例并保持 51 tests PASS。
- 边界保持：该切片是启发式检索增强，不证明完整静态调用图、真实 LLM 事实质量、AutoRepair patch 质量、public repo full E2E 或 full release authority。

## 4.87 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Code QA 现在在已有 `code_symbols/code_relations` 直接关系时，把 graph relation 写入 `evidenceReason`，降低用户无法判断 adjacent context 为什么相关的风险。
- `RISK-AI-002` 补充缓解：relation-aware context 仍保持 `ADJACENT_CONTEXT`，不提升为 PRIMARY，避免把图谱邻接误当成主证据授权。
- `RISK-REL-001` 回归闭环：`CodeQaControllerTest` 覆盖 `CALLS` happy path 和 empty graph fallback；QA Engineer runtime `Noether / 019f396e-3df4-7ed0-a671-f7380762b83c` 首轮 PARTIAL 已关闭。
- 边界保持：该切片只证明 best-effort 直接关系解释；不证明多跳调用链、完整静态调用图、跨语言精确分析、真实 LLM 事实质量或 full release authority。

## 4.88 2026-07-07 P6/P11 风险补充记录

- `RISK-REL-001` 补充缓解：report evidence QA citation release marker 现在强制输出 `relationAwareEvidenceReason`，避免 graph relation evidence reason 只存在后端单测、没有发布证据证明。
- `RISK-AI-002` 补充缓解：marker 要求 relation reason 仍绑定 `ADJACENT_CONTEXT`，不把 graph 邻接误提升为 PRIMARY 或修复授权。
- `RISK-SEC-001` 补充缓解：release verifier 和 security regression 拒绝 relation-aware marker 中的 raw answer/prompt/content/sourceContent/stack/log，避免证据说明字段变成 raw 泄露通道。
- `RISK-REL-001` 回归闭环：`report-evidence-qa-citation` focused smoke PASS；`security-regression-check.sh --suite release-verifier-report-evidence-marker` PASS，覆盖缺失、伪造、计数为 0、UI 隐藏和 provider overclaim。
- 边界保持：该切片是 mocked report evidence QA citation release contract；真实 public repo graph relation 仍依赖 analyzer 图谱关系密度，不刷新 full release authority。

## 4.89 2026-07-07 P6/P11 风险补充记录

- `RISK-REL-001` 补充缓解：public repo UI marker 对 `Graph relation:` 采用 optional-present strict，避免没有真实 graph relation 时强行宣称能力，也避免出现真实 relation 后 release evidence 不校验。
- `RISK-AI-002` 补充缓解：marker 要求 `citedPrimaryStillPresent=true`，防止 `ADJACENT_CONTEXT` 的 graph 邻接证据替代 PRIMARY 主证据。
- `RISK-SEC-001` 补充缓解：release verifier 和 security regression 拒绝 relation-aware marker 中的 raw answer/prompt/content/sourceContent/stack/log，降低证据字段泄露 raw 内容的风险。
- `RISK-REL-001` 回归闭环：`security-regression-check.sh --suite release-verifier-public-repo-ui-marker` PASS，覆盖 relation marker 状态、surface、marker、计数、adjacent、primary、UI、provider/LLM overclaim 和 raw field 伪造。
- 边界保持：该切片不提高真实 public repo graph relation 必达率；真实图谱密度仍依赖 analyzer 输出，不刷新 full release authority。

## 4.90 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Java AST parser 现在把显式 `variable.method()` / `this.variable.method()` 转成 `CALLS` relation，降低 Java/Spring 主链路只有注入依赖、缺少方法调用证据的风险。
- `RISK-AI-002` 补充缓解：target method id 与 method symbol id 对齐，后续 Code QA relation-aware expansion 更容易把 controller 方法与 service 方法绑定为可解释 `Graph relation:`。
- `RISK-REL-001` 补充缓解：重复 source/target 调用去重，降低 relation graph 噪声放大和 release evidence marker 被低质量重复边污染的风险。
- `RISK-REL-001` 回归闭环：`JavaAstParserTest,JavaFallbackAnalyzerTest,CodeGraphPersistenceServiceTest` focused tests PASS。
- 边界保持：该切片不解析动态分派、接口实现真实落点、反射、lambda、链式返回类型或多跳调用链，不刷新 full release authority。

## 4.91 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：接口方法调用在唯一实现类存在时会补充 implementation method `CALLS`，降低 Code QA 只能引用接口、无法锚定实现代码的风险。
- `RISK-AI-002` 补充缓解：实现类必须存在同名 method symbol 才补 relation，减少 target method 不存在造成的 graph 断链。
- `RISK-REL-001` 补充缓解：多实现接口跳过，不做错误猜测，避免把运行时不确定的 Spring bean 绑定伪装成确定调用边。
- `RISK-REL-001` 回归闭环：`JavaFallbackAnalyzerTest` 覆盖唯一实现正例和多实现负例；`JavaAstParserTest`、`CodeGraphPersistenceServiceTest` 同轮 PASS。
- 边界保持：该切片不解析 `@Qualifier`、`@Primary`、profile、factory bean、代理、反射、动态分派或多跳调用链，不刷新 full release authority。

## 4.92 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Java AST parser 现在把同类 `helper()` / `this.helper()` 解析为 `CALLS` relation，降低类内执行流在报告和 Code QA 中不可见的风险。
- `RISK-AI-002` 补充缓解：仅当目标方法名存在于当前类声明时才补关系，降低静态导入或外部无 scope 函数被误判成本类方法的风险。
- `RISK-REL-001` 补充缓解：同一 source/target 去重，避免同类 helper 重复调用放大 relation graph 噪声。
- `RISK-REL-001` 回归闭环：`JavaAstParserTest` 覆盖 `validate()`、`this.audit()` 正例和静态导入 `requireNonNull()` 负例。
- 边界保持：该切片不区分重载参数，不解析完整动态分派、local class/lambda 精确边界、跨语言调用图或多跳调用链，不刷新 full release authority。

## 4.93 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Java AST parser 现在把显式 import 的项目内 `ClassName.method()` 解析为 `CALLS` relation，降低 mapper/factory/converter 静态工具调用在证据链中不可见的风险。
- `RISK-AI-002` 补充缓解：仅允许非 static、非 wildcard import，并要求与当前 package 共享前两段包根，降低外部库调用被写入项目 graph 的风险。
- `RISK-REL-001` 补充缓解：外部 import 负例覆盖 `java.util.Objects.requireNonNull()`，避免 release evidence 或 Code QA 后续消费不存在的项目符号。
- `RISK-REL-001` 回归闭环：`JavaAstParserTest` 覆盖 `OrderMapper.toDto()` 正例和 `Objects.requireNonNull()` 负例。
- 边界保持：该切片不解析 wildcard import、static import、完整 FQCN scope、构建系统模块边界、动态分派或多跳调用链，不刷新 full release authority。

## 4.94 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：新增 persistence gate 证明三类 Java AST `CALLS` 能进入 `CodeRelationMapper.insertBatch`，降低 parser 产物无法被 GraphService / Code QA 消费的风险。
- `RISK-AI-002` 补充缓解：持久化 relation 继承当前 `scanTaskId`，降低跨扫描任务图谱污染风险。
- `RISK-REL-001` 补充缓解：测试使用真实 `JavaAstParser` 解析文件，避免手写 fixture 掩盖 parser/persistence 接口断裂。
- `RISK-REL-001` 回归闭环：`CodeGraphPersistenceServiceTest` 覆盖 scoped service、same-class helper、imported project static class 三类 `CALLS` 的持久化。
- 边界保持：该切片是 mock mapper focused gate，不替代真实 MySQL public repo scan、GraphService UI、Code QA marker、真实 LLM provider 或 full release authority。

## 4.95 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：新增 `code-relation-quality-report.sh`，后续真实扫描后可量化 `CALLS` 数量、method symbol 匹配率、未解析 target 和外部噪声。
- `RISK-REL-001` 补充缓解：支持 `SOURCELENS_RELATION_QUALITY_MIN_CALLS` 与 `SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT` fail-closed 阈值，避免低质量图谱被误当作通过。
- `RISK-SEC-001` 补充缓解：marker 不输出 DB password、JWT、token、secret、raw prompt 或 raw code content。
- `RISK-REL-001` 当前基线：本地最新 `scanTaskId=290` 输出 `relationCount=440`、`symbolCount=15727`、`callCount=0`；这是旧扫描结果，不能用来否定本轮 analyzer 增强，必须重新运行 public repo scan 后再比较。
- 边界保持：该工具只读数据库，不触发扫描，不证明 GraphService UI、Code QA marker、真实 LLM provider、真实 public repo E2E 或 full release authority。

## 4.96 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：真实公开仓库重新扫描后，`scanTaskId=291` 已产生 `CALLS=2962` 和 `relationCount=3402`，旧 `scanTaskId=290 / CALLS=0` 不再作为当前 P6 relation density 基线。
- `RISK-REL-001` 补充缓解：`code-relation-quality-report.sh` 的 source/target method match 已改为 `COUNT(DISTINCT cr.id)` 去重 edge 口径，避免重复 `METHOD symbol_id` 造成百分比虚高。
- `RISK-REL-001` 补充缓解：新增 `make code-relation-quality-p6` 默认阈值 `MIN_CALLS=1`、`MIN_TARGET_METHOD_MATCH_PERCENT=40`；默认阈值通过，阈值提高到 `41` 会 fail-closed。
- `RISK-REL-001` 当前质量边界：最新 marker 为 `scanTaskId=291`、`callTargetMethodMatchPercent=40`、`methodSymbolDuplicateGroups=138`、`unresolvedCallTargets=1771`；这证明 relation density 提升，但不证明完整调用图质量。
- `RISK-SEC-001` 边界保持：marker 仍只输出聚合数字，不输出 DB password、token、secret、raw prompt 或 raw code content。
- QA 复核：拉里佩奇 / QA Engineer runtime `Ampere / 019f39b3-944a-7f42-b54d-00304853ac76` 给出 PARTIAL，指出旧 `73` 口径不可宣称为真实调用边准确率；已修正脚本、门禁阈值和文档。
- 边界保持：该切片不证明完整静态调用图、多跳调用链、跨语言精确分析、真实 LLM provider、Code QA 回答事实正确性、public repo full release authority 或 GitHub App E2E。

## 4.97 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：`JavaAstParser` 已把常见 JDK simple type 解析到 `java.lang`、`java.util`、`java.math`，减少 `com.yb.controller.String#equals()`、`com.yb.controller.Map#get()` 这类假 project target。
- `RISK-REL-001` 补充缓解：relation marker 新增 unresolved 分桶字段，能区分 known external、project-like、project-like JDK simple-type 和 other unresolved。
- `RISK-REL-001` 真实回归：public repo smoke `scanTaskId=292` PASS；`unresolvedProjectLikeJdkSimpleTypeCallTargets` 从 `575` 降到 `53`，`unresolvedProjectLikeCallTargets` 从 `1175` 降到 `638`。
- `RISK-REL-001` 当前质量边界：`callTargetMethodMatchPercent=40` 未提升，`methodSymbolDuplicateGroups=138` 和剩余 `unresolvedProjectLikeCallTargets=638` 仍需后续治理。
- 边界保持：该切片不证明完整静态调用图、动态分派、多跳调用链、Spring runtime bean、真实 LLM provider、Code QA 回答事实正确性或 full release authority。

## 4.98 2026-07-07 P6/P11 风险补充记录

- `RISK-REL-001` 补充缓解：`JavaAstParser` 在当前 name-level symbol schema 下去重同一 class 内的 overloaded method symbol，降低重复节点污染 GraphService / Code QA relation expansion 的风险。
- `RISK-REL-001` 真实回归：public repo smoke `scanTaskId=293` PASS；`methodSymbolDuplicateGroups` 从 `138` 降到 `0`，`symbolCount` 从 `15727` 降到 `15586`，`methodSymbolCount` 从 `2360` 降到 `2219`。
- `RISK-AI-002` 边界保持：该去重不提供签名级 overload 图谱，也不提升 `callTargetMethodMatchPercent=40`；剩余 `unresolvedProjectLikeCallTargets=638` 仍需后续分析。
- 边界保持：不证明完整静态调用图、动态分派、多跳调用链、真实 LLM provider、Code QA 回答事实正确性或 full release authority。

## 4.99 2026-07-07 P6/P11 风险补充记录

- `RISK-REL-001` 补充缓解：`JavaAstParser` 已补充 wildcard import 边界和常见 JDK 类型映射，降低 `File`、`Entry`、`Class`、`Calendar` 等类型被误拼成业务 package 的风险。
- `RISK-REL-001` 真实回归：public repo smoke `scanTaskId=294` PASS；`unresolvedProjectLikeJdkSimpleTypeCallTargets` 从 `53` 降到 `0`，`unresolvedProjectLikeCallTargets` 从 `638` 降到 `512`。
- `RISK-REL-001` 稳定性：`methodSymbolDuplicateGroups=0` 保持不回退。
- `RISK-AI-002` 边界保持：`callTargetMethodMatchPercent=40` 未提升，剩余 `unresolvedProjectLikeCallTargets=512` 仍需后续分桶，不能宣称完整静态调用图完成。
- 边界保持：不证明完整 Java compiler/import resolver、泛型真实类型、动态分派、多跳调用链、真实 LLM provider、Code QA 回答事实正确性或 full release authority。

## 4.100 2026-07-07 P6/P11 风险补充记录

- `RISK-REL-001` 补充缓解：`JavaAstParser` 已为 Lombok `@Data/@Getter/@Setter` instance fields 生成 source-bound getter/setter method symbols，降低 entity accessor 调用无法匹配 target symbol 的风险。
- `RISK-REL-001` 真实回归：public repo smoke `scanTaskId=295` PASS；`callTargetMethodMatchPercent` 从 `40` 提升到 `46`，`unresolvedProjectLikeCallTargets` 从 `512` 降到 `317`，entity getter/setter unresolved bucket 从 `196` 降到 `4`。
- `RISK-REL-001` 门禁收紧：`make code-relation-quality-p6` 默认 target method match threshold 从 `40` 上调到 `45`；`47` 阈值对当前 scanTaskId fail-closed。
- `RISK-AI-002` 边界保持：Lombok accessor symbol 指向字段行，不代表源码存在真实方法体，不提供签名级 symbol schema 或 Lombok 全语义。
- 边界保持：剩余 project-like unresolved 主要集中在 MyBatis-Plus `IService` 继承 CRUD 方法；不证明完整静态调用图、动态分派、多跳调用链、真实 LLM provider、Code QA 回答事实正确性或 full release authority。

## 4.101 2026-07-07 P6/P11 风险补充记录

- `RISK-REL-001` 补充缓解：`JavaAstParser` 已为明确继承 MyBatis-Plus `IService<T>` 的 service interface 生成 inherited framework method symbols，降低 inherited CRUD 调用无法匹配 target symbol 的风险。
- `RISK-REL-001` 误判控制：本地同名 `IService` 不会触发 MyBatis-Plus method symbol 生成。
- `RISK-REL-001` 真实回归：public repo smoke `scanTaskId=297` PASS；`callTargetMethodMatchPercent` 从 `46` 提升到 `56`，`unresolvedProjectLikeCallTargets` 从 `317` 降到 `36`，`service_inherited_crud` bucket 从 `272` 降到 `0`。
- `RISK-REL-001` 门禁收紧：`make code-relation-quality-p6` 默认 target method match threshold 从 `45` 上调到 `55`；`57` 阈值对当前 scanTaskId fail-closed。
- `RISK-AI-002` 边界保持：inherited framework method symbol 指向 interface extends 行，不代表源码存在真实业务方法体，不提供完整 Java type solver。
- 边界保持：剩余 36 个 project-like unresolved 仍需后续处理 catch parameter/local type scope、CommonService package resolution、annotation/session 类型；不证明完整静态调用图、动态分派、多跳调用链、真实 LLM provider、Code QA 回答事实正确性或 full release authority。

## 4.102 2026-07-07 P6/P11 风险补充记录

- `RISK-REL-001` 补充缓解：`JavaAstParser` 已处理 catch parameter 可见类型、websocket wildcard external type、annotation member method、`IllegalAccessException` 和 `HashMap#putAll` inherited JDK method symbol，降低剩余 project-like false target 风险。
- `RISK-REL-001` 补充缓解：wildcard import 多候选时按类型后缀优先匹配，避免 `com.yb.entity.*` 抢先把 `CommonService` 解析成 `com.yb.entity.CommonService`。
- `RISK-REL-001` 真实回归：public repo smoke `scanTaskId=299` PASS；`unresolvedProjectLikeCallTargets` 从 `36` 降到 `0`，`callTargetMethodMatchPercent=56`，`methodSymbolDuplicateGroups=0`。
- `RISK-REL-001` 门禁收紧：`make code-relation-quality-p6` 默认 target method match threshold 从 `55` 上调到 `56`；`57` 阈值对当前 scanTaskId fail-closed。
- `RISK-AI-002` 边界保持：inherited JDK method symbol 不代表源码显式方法体；`unresolvedKnownExternalCallTargets=1305` 仍是外部库/JDK/framework 方法图谱边界。
- 边界保持：不证明完整 Java compiler/type solver、动态分派、多跳调用链、签名级 overload 图谱、真实 LLM provider、Code QA 回答事实正确性或 full release authority。

## 4.103 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Code QA citation coverage 新增 `REQUIRED_FULL`，避免 required/primary evidence 已引用但 context candidates 未全引用时被误判成不可放行的 `PARTIAL`。
- `RISK-AI-002` 补充缓解：`PARTIAL` 仍保留为未引用必需主证据/必需主张的硬信号，防止 required evidence gap 被 `REQUIRED_FULL` 掩盖。
- `RISK-REL-001` 补充缓解：public repo smoke 已接受 `FULL` / `REQUIRED_FULL` 作为 required citation coverage satisfied，并继续输出 total coverage、uncited candidate 和 context gap 指标。
- `RISK-SEC-001` 边界保持：本轮没有扩大 raw prompt/raw answer 存储，不证明真实 LLM provider 质量。
- 真实回归：public repo smoke `scanTaskId=300` PASS；report evidence QA citation、Code QA、claim citation noise boundary、semantic pool probe、artifact quality 和 DB counts 均通过。
- 边界保持：`REQUIRED_FULL` 不等于 `FULL`；辅助上下文未引用仍是 review signal，不证明完整 Code QA 召回、弱关键词语义覆盖、真实回答事实正确性或 full release authority。

## 4.104 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：弱关键词且无 embeddings 时，stable fallback 现在优先返回代表性代码角色，降低 README/docs 被误当主要证据的风险。
- `RISK-AI-002` 补充缓解：public repo smoke 已新增 fail-closed 检查，`STABLE_FALLBACK` primary 为 `DOCUMENTATION`、`README.md` 或 `/docs/` 时直接失败。
- `RISK-REL-001` 补充缓解：真实公开仓库 `scanTaskId=302` 证明 4 个 weak keyword case 的 primary 均为 `CONTROLLER`，`representativeFallbackHits=4`。
- `RISK-SEC-001` 边界保持：smoke marker 只输出路径、类型和聚合统计，不输出 raw prompt/raw answer、secret 或完整源码内容。
- 边界保持：无 embeddings 时 `INCONCLUSIVE/no_embeddings` 仍是正确结论；本轮不证明语义召回、真实 provider 质量、完整跨文件排序或 full release authority。

## 4.105 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：representative fallback 从固定 Controller-first 改为 query-driven role priority，降低弱问题被路由到错误代码层的风险。
- `RISK-AI-002` 补充缓解：public repo smoke 对 4 个 weak keyword case 强制校验 expected fallback primary role，防止后续回退成“只要不是文档就通过”。
- `RISK-REL-001` 补充缓解：smoke 新增 `representativeFallbackRole`，当 API `evidenceType=SOURCE` 但路径表明是 config/data/service 时仍能复核真实角色。
- 真实回归：public repo smoke `scanTaskId=304` PASS；weak keyword case role 分别为 `SERVICE/SERVICE/CONFIG/DATA_ACCESS`。
- 边界保持：该能力仍是 deterministic fallback；不证明 embedding coverage、复杂自然语言 query planning、真实 LLM provider 质量或 full release authority。

## 4.106 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：Code QA API 新增 `retrievalPlan`，暴露 token、role intent、fallback role priority、辅助结构信号和 fallback reason，降低检索兜底不可审计风险。
- `RISK-AI-002` 补充缓解：当主关键词无命中但存在 role/path 辅助候选时，`CodeChunkService` 改为按 representative fallback priority 排序，降低 API 计划与实际候选排序不一致的风险。
- `RISK-REL-001` 补充缓解：public repo smoke 已校验 stable fallback case 的 `retrievalPlan.fallbackRolePriority` 与 `fallbackReason`，防止 marker 只看最终 primary role 而漏掉计划漂移。
- 真实回归：public repo smoke `scanTaskId=305` PASS；weak keyword eval 输出 retrieval plan，stable fallback case 的 `fallbackReason=NO_KEYWORD_NO_EMBEDDING_INTENT_ROLE_FALLBACK`。
- 边界保持：`retrievalPlan` 是 deterministic explanation，不证明语义理解、embedding coverage、真实 LLM provider 答案质量或 full release authority；`INCONCLUSIVE/no_embeddings` 仍是正确质量边界。

## 4.107 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：flow/call-chain 问题下，graph relation 扩展 chunk 会进入 PRIMARY evidence set，降低跨文件调用链证据只作为可忽略 context 而未被 required citation gate 约束的风险。
- `RISK-AI-002` 补充缓解：被提升为 PRIMARY 的 relation evidence 仍保留 `Graph relation:` evidence reason，避免主证据来源不可见。
- `RISK-AI-004` 补充缓解：未配置 LLM 的 fallback answer 现在引用全部 PRIMARY labels，降低 fallback answer 只引用第一个主证据导致 citation coverage 被误拉低的风险。
- `RISK-REL-001` 补充缓解：release verifier 已接受 `REQUIRED_FULL`，避免 required/primary evidence 已闭环但 context 未全引用时被旧 verifier 误拒绝。
- 真实回归：public repo smoke `scanTaskId=306` PASS；`codeQa.citationCoverage.status=REQUIRED_FULL`，`citedPrimaryEvidenceFileCount=4/primaryEvidenceFileCount=4`，`claimCitationCoverage.roleDistribution.status=PRIMARY_BOUND`。
- 边界保持：flow intent 是 bounded heuristic；该能力不证明完整静态调用图、动态分派、多跳调用链、真实 LLM provider 答案质量或 full release authority。

## 4.108 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：Code QA system prompt 现在在 flow/call-chain 问题存在 `Graph relation:` PRIMARY 证据时，明确要求优先使用这些关系证据，降低模型忽略跨文件关系、只按单文件片段回答的风险。
- `RISK-AI-002` 补充缓解：prompt chunk 展示 `Context role` 和 `Evidence reason`，让 PRIMARY / ADJACENT_CONTEXT 和 graph relation 来源进入 LLM 可见上下文。
- `RISK-AI-002` 补充缓解：citation retry prompt 展示 evidence reason，降低重试修正时丢失 relation evidence 来源的风险。
- `RISK-SEC-001` 边界复核：`奥特曼 / Security Engineer` 只读复核结论 PASS；本轮没有新增 raw prompt/raw answer 持久化路径，PromptInjectionGuard untrusted boundary 保持。
- `RISK-AI-002` 测试复核：`拉里佩奇 / QA Engineer` 只读复核结论 PASS；active LLM prompt capture 已证明 relation-aware instruction 进入 system prompt。
- 真实回归：public repo smoke `scanTaskId=307` PASS；`codeQa.citationCoverage.status=REQUIRED_FULL`，`claimCitationCoverage.roleDistribution.status=PRIMARY_BOUND`，`reportEvidenceQaCitationQuality.status=OK`，`noRawPromptOrAnswer=true`。
- 边界保持：relation-aware prompt 不证明真实 provider 答案事实正确；真实 public repo 未出现 `Graph relation:` 时不得伪造 UI/release marker。

## 4.109 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：`retrievalPlan` 新增 relation-aware audit fields，前端、smoke 和排障工具现在能直接看到 cross-file intent 与 graph relation evidence 状态，降低只能解析 prompt 的不可审计风险。
- `RISK-AI-002` 补充缓解：`graphRelationPrimaryLabels` 只列出同一响应内 PRIMARY relation evidence labels，便于后续复核 citation gate 是否绑定到主证据。
- `RISK-SEC-001` 边界保持：新增字段只包含 boolean、label 和 count 元数据，不包含 raw prompt、raw answer、chunk content、secret 或完整源码。
- `RISK-AI-004` 伪造控制：public repo smoke 已校验字段类型和自洽性；真实公开仓库没有 graph relation evidence 时必须输出 false/0/[]。
- 真实回归：public repo smoke `scanTaskId=308` PASS；`codeQa.retrievalPlan.crossFileIntentPresent=true`，`graphRelationEvidencePresent=false`，`graphRelationEvidenceCount=0`，`graphRelationPrimaryLabels=[]`。
- 边界保持：retrieval plan 是检索计划审计信号，不证明完整调用链、动态分派、多跳关系、真实 provider 答案质量或 full release authority。

## 4.110 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：`retrievalPlan.queryStrategy` 让排障工具能区分路径锚点、接口路由、前后端桥接、后端链路、语义兜底、角色兜底和稳定兜底。
- `RISK-AI-003` 补充缓解：`embeddingCoveragePercent/status` 和 `semanticPlanReason` 暴露 active embedding model 覆盖不足、无 active LLM、question embedding 失败、semantic pool empty 等问题。
- `RISK-AI-004` 边界保持：这些字段不证明语义召回充分性，不证明真实 provider 答案正确，不替代后续真实向量索引或 provider gate。
- `RISK-SEC-001` 边界保持：新增字段只包含 boolean、count、status 和 reason，不包含 raw prompt、raw answer、chunk content、secret 或完整源码。
- 验证：focused backend tests、P6 related backend tests、`node scripts/validate-api-design.mjs`、`bash -n scripts/public-repo-analysis-smoke.sh` PASS。
- 真实回归：public repo smoke `scanTaskId=309` PASS；`queryStrategy=BACKEND_FLOW_ROLE_EXPANSION`，`embeddingCoverageStatus=NONE`，`semanticPlanReason=NO_ACTIVE_LLM`。

## 4.111 2026-07-07 P6 风险补充记录

- `RISK-AI-003` 补充缓解：semantic pool 不再只依赖 id 正序前 500；大仓库下使用 head + distributed windows，降低仓库后段 chunk 永远不可见的风险。
- `RISK-AI-004` 可观测性：`semanticPoolStrategy` 暴露 pool 加载策略，便于 smoke、QA 和 release evidence 解释本轮候选覆盖方式。
- 边界保持：分布式窗口不是向量索引，不证明语义召回充分性，不证明真实 provider 答案正确。
- 验证：focused CodeChunkService tests 和 focused CodeQaController tests PASS；QA 打回后已补 Controller 大池 `HEAD_DISTRIBUTED_WINDOWS` 断言和具体 offset 分布断言。
- smoke 缓解：public repo semantic pool probe 已从小池 probe 升级为 target rank 501，强制触发 `HEAD_DISTRIBUTED_WINDOWS`。
- 真实回归：首次真实 smoke 暴露 `semanticPoolLoadedCount=461` 的 compact-tail 边界缺口；已改为接近 pool limit 时使用 compact tail windows。
- 真实回归：public repo smoke `scanTaskId=311` PASS；`semanticWeakKeywordProbe.embeddedChunks=501`，`semanticPoolLoadedCount=500`，`semanticPoolStrategy=HEAD_DISTRIBUTED_WINDOWS`，`targetRank=501`，`dbCounts.chunks=17001`。

## 4.112 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-003` 补充缓解：Code QA response 新增 `semanticPoolTruncated` 和 `semanticPoolCoveragePercent`，降低排障时把有限 semantic pool 误读为完整 active embedding pool 召回的风险。
- `RISK-AI-004` 可观测性：public repo smoke 已校验字段类型、未尝试场景自洽性和 semantic pool probe 截断状态，防止字段漂移。
- `RISK-SEC-001` 边界保持：新增字段只包含 boolean 和 percent，不包含 raw prompt、raw answer、chunk content、secret 或完整源码。
- 验证：focused Code QA retrievalPlan tests、API/UI 静态校验、public repo smoke shell syntax PASS。
- QA 打回处理：`Darwin = 拉里佩奇 / QA Engineer` 指出 `semanticPoolCoveragePercent>=99` 长期门禁脆弱；已改为按 `semanticPoolLoadedCount / embeddedChunks` 的公式校验，避免未来真实大池 coverage 低于 99 时被误判。
- 真实回归：public repo smoke `scanTaskId=312` PASS；`semanticWeakKeywordProbe.semanticPoolTruncated=true`，`semanticPoolCoveragePercent=100`，`semanticPoolLoadedCount=500`，`embeddedChunks=501`，`dbCounts.chunks=17001`。
- 边界保持：coverage percent 是候选池覆盖诊断，不是向量召回质量评分；不证明真实 provider 答案事实正确。

## 4.113 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-004` 补充缓解：Code QA response 新增 cross-file evidence coverage diagnostics，让排障工具能区分“识别了跨文件意图”和“当前响应实际返回了至少两个 PRIMARY 文件”。
- `RISK-AI-002` 补充缓解：`crossFileEvidenceStatus` 使用固定诊断码，避免前端或 release evidence 解析自由文本。
- `RISK-REL-001` 补充缓解：public repo smoke 已校验 `crossFileEvidenceSatisfied == crossFileIntentPresent && crossFilePrimaryFileCount >= 2`，并校验 status 由 intent/count 唯一推导。
- `RISK-SEC-001` 边界保持：新增字段只包含 boolean、count 和 status，不包含 raw prompt、raw answer、chunk content、secret 或完整源码。
- 验证：focused `CodeQaControllerTest`、API/UI 静态校验和 public repo smoke shell syntax PASS；`Maxwell = 拉里佩奇 / QA Engineer` 复核 PASS。
- 真实回归：public repo smoke `scanTaskId=313` PASS；`codeQa.retrievalPlan.crossFileEvidenceSatisfied=true`，`crossFileEvidenceStatus=SATISFIED`，`crossFilePrimaryFileCount=4`，`codeQa.crossFileCitationSummary.crossFileEvidenceSatisfied=true`。
- 边界保持：该字段只证明当前响应 PRIMARY 文件覆盖，不证明完整调用链、多跳关系、动态分派或真实 provider 答案事实正确。

## 4.114 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：report evidence file+line/range 命中 PRIMARY citation 时，`evidenceReason` 暴露 `Report evidence line anchor.`，降低“引用存在但主证据来源不可解释”的风险。
- `RISK-AI-004` 补充缓解：public repo smoke 已加入 line-anchor PRIMARY citation reason 检查，防止 report evidence QA 只验证 label/file/line 而漏掉 trust explanation。
- `RISK-SEC-001` 初始复核：`Sartre = 拉里佩奇 / QA Engineer` 指出 Code QA response 仍返回完整 `retrievedChunks.content`，且 `sourceEvidenceRef.filePath` 会回显用户本地绝对路径；结论 PARTIAL。
- `RISK-SEC-001` 已处理：Code QA response 不再返回完整 `retrievedChunks.content`；`contentPreview` 使用 `SensitiveDataSanitizer` 脱敏截断；本地绝对 `sourceEvidenceRef.filePath` 响应转仓库相对路径，无法识别时返回 `[local-path-redacted]`。
- `RISK-SEC-001` 边界保持：新增 reason 只包含固定诊断短语，不包含 raw prompt、raw answer、chunk content、secret 或用户本地绝对路径。
- `RISK-AI-002` 伪造控制：adjacent context 和非 PRIMARY chunk 不得携带 `Report evidence line anchor.`，避免辅助上下文被误认为报告主锚点。
- 验证：focused `CodeQaControllerTest` 覆盖 line-anchor reason、raw content 不返回、preview 脱敏和 local absolute path 相对化；`bash -n scripts/public-repo-analysis-smoke.sh` PASS。
- QA 复核：`Sartre = 拉里佩奇 / QA Engineer` 修复后只读复核 PASS。
- 真实回归：public repo smoke `scanTaskId=315` PASS；`reportEvidenceQaCitationQuality.lineAnchorEvidenceReasonVisibleSampleCount=4`，`lineAnchorCitationStatus=ALL_SAMPLES_BOUND`，`noRawPromptOrAnswer=true`。

## 4.115 2026-07-07 P6/P10/P11 风险补充记录

- `RISK-SEC-001` 补充缓解：public repo smoke 新增 QA payload raw content absence gate，防止后续 Code QA response 重新返回完整 `retrievedChunks.content` 而 release evidence 仍通过。
- 覆盖范围：普通 Code QA、report evidence QA citation、claim citation noise boundary、weak keyword eval 和 semantic pool probe。
- `RISK-REL-001` 补充缓解：smoke marker 输出 raw content absent sample/case count 和 `contentPreviewMaxLength`，让 release evidence 可审计。
- 边界保持：该门禁不改变底层 code chunk search API 的 raw content 合同；底层 raw access 仍需独立权限和审计治理。
- 验证：`bash -n scripts/public-repo-analysis-smoke.sh` PASS；public repo smoke Python heredoc compile PASS。
- 真实回归：public repo smoke `scanTaskId=317` PASS；`codeQa.rawRetrievedChunkContentAbsent=true`，`claimCitationNoiseBoundary.rawRetrievedChunkContentAbsent=true`，`semanticWeakKeywordProbe.rawRetrievedChunkContentAbsent=true`，`reportEvidenceQaCitationQuality.rawRetrievedChunkContentAbsentSampleCount=4`，`projectQaWeakKeywordEvaluation.rawRetrievedChunkContentAbsentCaseCount=4`，`maxContentPreviewLength=615`。

## 4.116 2026-07-07 P6/P10/P11 风险补充记录

- `RISK-REL-001` 补充缓解：release verifier 现在强制校验 Code QA raw content absence marker，防止 public repo smoke 输出字段后 release evidence 仍只做宽松验收。
- `RISK-SEC-001` 补充缓解：Code QA、claim citation noise、report evidence QA 和 weak keyword eval 的 release evidence 都必须证明不回传完整 `retrievedChunks.content`。
- `RISK-AI-004` 补充缓解：`semanticWeakKeywordProbe` 出现时 verifier 校验 semantic pool strategy、truncation、retrieved primary 和 raw marker，避免语义池诊断字段漂移。
- 边界保持：semantic probe 暂不 retroactive 强制旧 evidence 必选；该门禁不替代 raw access 权限系统、真实 provider E2E 或生产级向量索引。
- 验证：`security-regression-check.sh --suite release-verifier-public-repo-marker` PASS；API/UI static gate、shell syntax 和 `git diff --check` PASS。

## 4.117 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-003` 补充缓解：Code QA `retrievalPlan` 新增 `semanticReadinessStatus` 和 `semanticReadinessReason`，将语义检索可用性从多个字段聚合为固定状态机。
- `RISK-AI-004` 补充缓解：public repo smoke 校验 readiness 状态枚举、原因非空、READY 状态必须对应 `SEMANTIC_READY`，semantic weak keyword probe 必须暴露降级状态。
- `RISK-REL-001` 补充缓解：release verifier 在 `semanticWeakKeywordProbe` 出现时校验 readiness marker，避免 release evidence 丢失语义检索降级信息。
- `RISK-SEC-001` 边界保持：新增字段只包含固定状态和原因码，不包含 raw prompt、raw answer、chunk content、secret 或完整源码。
- `RISK-PERF-001` 新增观察：真实 smoke 在 report evidence QA citation 阶段触发大仓库 Code QA ranking 高 CPU，最终通过但耗时偏高；P6 后续必须加入 ranking 性能预算和热点优化。
- 验证：focused `CodeQaControllerTest`、API/UI static gate、shell syntax、真实公开仓库 smoke `scanTaskId=318` PASS。

## 4.118 2026-07-07 P6/P11 风险补充记录

- `RISK-PERF-001` 缓解：endpoint route Code QA ranking 新增 route-aware prefilter，明显非 route/mapping/API/constant chunk 不再进入昂贵 previous-context scoring。
- `RISK-AI-004` 边界保持：prefilter 只用于 endpoint route ranking 的性能收敛，不改变 semantic readiness、citation coverage 或 raw access 合同。
- `RISK-REL-001` 回归控制：focused test 覆盖 500 个非 route 噪声 chunk、previous same-file context 和 route constant 场景，防止性能优化误杀核心 route 解析能力。
- 真实回归：public repo smoke `scanTaskId=323` PASS，总耗时 `63s`，`report evidence QA citation: OK`。
- 残余风险：该 live timing 不是完整多仓库 benchmark；真实 provider、生产向量索引和弱关键词质量仍需后续收口。
- 验证：`CodeChunkServiceTest,CodeQaRetrievalServiceTest` 和 shell syntax gates PASS。

## 4.119 2026-07-07 P6/P11 风险补充记录

- `RISK-PERF-001` 进一步缓解：`CodeChunkRanker` 新增 `SpringMappingLookup`，避免同一 direct/previous context 在 score、strong route match 和 Spring mapping match 中重复解析 mapping literals、class declaration 和 HTTP method。
- `RISK-REL-001` 回归控制：focused route tests、`CodeChunkServiceTest,CodeQaRetrievalServiceTest`、API/UI validators、shell syntax 和 `git diff --check` 均通过。
- `RISK-AI-004` 边界保持：lookup cache 只改变 route ranking 解析成本，不改变 citation coverage、semantic readiness、raw access 或 provider quality 声明。
- 真实回归：public repo smoke `scanTaskId=323` PASS，17001 chunks，`PUBLIC_REPO_SMOKE_OK`，总耗时 `63s`，`reportEvidenceQaCitationQuality.status=OK`。
- 残余风险：`projectQaWeakKeywordEvaluation.status=INCONCLUSIVE` 继续说明弱关键词/embedding 召回质量未完成；P6 仍需后续真实 provider、embedding/vector retrieval 和多仓库 benchmark。

## 4.120 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：弱关键词 role intent 新增 operational policy 和 data loading 细分，降低低信号问题被错误代码层吸走的风险。
- `RISK-AI-004` 补充缓解：role-intent scoring 现在尊重 intent 顺序，让 retrieval plan 的第一优先级和实际候选排序保持一致。
- `RISK-AI-002` 补充缓解：CONFIG path 证据类型归类为 `CONFIG`，避免 `SOURCE` 泛化掩盖配置代码证据。
- `RISK-REL-001` 回归控制：focused `CodeChunkServiceTest`、API/UI validators、shell syntax gates 和 `git diff --check` 均通过；`Tesla = 拉里佩奇 / QA Engineer` 只读复核 PASS。
- 边界保持：该切片不把 no-embedding `INCONCLUSIVE` 升级为 OK，不证明真实 provider、生产向量索引、多仓库泛化或 full release authority。

## 4.121 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：新增 bounded public repo retrieval quality matrix，把 P6 检索质量从 focused tests 推进到真实公开仓库链路验证。
- `RISK-AI-002` 补充缓解：修正 evidence type 边界，前端静态资源、构建文件、JS/TS command/model 源码不再误判为 CONFIG/DOMAIN_MODEL。
- `RISK-AI-004` 补充缓解：semantic pool probe 先清理当前 scan embedding，再写入可控 mock embedding，降低后台 embedding 任务导致 probe 漂移的风险。
- `RISK-REL-001` 回归控制：`P6_RETRIEVAL_QUALITY_MATRIX_OK` 证明真实公开仓库扫描、Code QA、weak keyword role-bound、semantic probe、report evidence QA citation 和 artifact quality 可同时通过。
- 边界保持：本轮是 single-repo bounded matrix，不是完整 benchmark，不证明真实 provider quality，不刷新 full release authority。
- 验证：matrix `scanTaskId=339` PASS；P6 retrieval focused tests、API/UI validators、release marker security regression 和 `git diff --check` PASS。

## 4.122 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：P6 retrieval matrix 已从 single-repo 推进到 two-repo，覆盖 Pawnshop 和 spring-petclinic 两个真实公开仓库。
- `RISK-AI-002` 补充缓解：Java AST cache 现在回填 raw `symbols`、`relations` 和 `graph`，降低 scan artifact 结构化证据为空导致报告/QA 退化的风险。
- `RISK-AI-003` 补充缓解：service/business intent 新增 main-source fallback，并对非测试意图降权 test chunks，降低弱意图问题被测试文件或文档噪声吸走的风险。
- `RISK-REL-001` 回归控制：two-repo matrix 输出 `P6_RETRIEVAL_QUALITY_MATRIX_OK`，`repoCount=2`；spring-petclinic raw scan contract 输出 `symbols=277`、`graphNodes=277`。
- `RISK-OPS-001` 缓解：本轮 smoke-created projects/repositories/tasks 已软删除清理，active smoke projects 为 0。
- 边界保持：generic Java 仓库不存在 service layer 时不强制 service probe；真实 provider、生产 embedding/vector retrieval 和完整 benchmark 仍未完成。

## 4.123 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：Java AST parser 固定使用 `JAVA_21` language level，关闭 spring-petclinic 中 Java 14 `instanceof pattern` 导致文件级解析失败的已观测风险。
- `RISK-AI-004` 补充缓解：pattern variable 已进入 method visible type map，`runtimeException.getMessage()` 可产出 `java.lang.RuntimeException#getMessage()` CALLS relation，降低现代 Java 语法下 relation graph 缺边风险。
- `RISK-REL-001` 回归控制：focused `JavaAstParserTest`、P6 focused backend tests、spring-petclinic public repo smoke 和 `git diff --check` 均通过。
- 真实回归：spring-petclinic `scanTaskId=349` PASS，raw `symbols=292`、`graphNodes=292`、DB `relations=407`，后端日志未再出现 JavaParser `ParseProblemException`。
- 边界保持：该修复不等于完整 Java 21 语义覆盖，不引入 symbol solver，不证明真实 provider/embedding quality。

## 4.124 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-002` 补充缓解：RAW_SCAN_RESULT 新增 `java_ast_diagnostics`，让 Java AST 文件级解析失败进入可审计产物，而不是只留在日志中。
- `RISK-REL-001` 回归控制：public repo smoke 校验 diagnostics 字段类型、计数自洽和失败路径数量，并在 `failed_java_files > 0` 或 `status != OK` 时 fail-closed。
- `RISK-AI-004` 补充缓解：JavaParser partial AST 现在必须通过 `parseResult.isSuccessful()` 才算成功，避免带 parse problems 的文件污染代码图质量。
- 真实回归：spring-petclinic `scanTaskId=350` PASS，`javaAstDiagnostics.status=OK,totalJavaFiles=48,parsedJavaFiles=48,failedJavaFiles=0`。
- 边界保持：故意坏源码或生成中间文件会触发 smoke fail-closed；如需容忍必须先设计 allowlist，不得静默忽略。

## 4.125 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：P6 默认 retrieval matrix 已扩展到三仓，新增 `generic-java-library` profile 覆盖 Apache Commons CLI 纯 Java library 仓库。
- `RISK-AI-002` 补充缓解：三仓均进入 `javaAstDiagnostics` 门禁，Pawnshop `289/289`、spring-petclinic `48/48`、commons-cli `87/87` Java 文件解析成功。
- `RISK-REL-001` 回归控制：默认三仓 matrix 输出 `P6_RETRIEVAL_QUALITY_MATRIX_OK`，`repoCount=3`，`javaAstDiagnosticsRepoCount=3`，profile 覆盖 `default-strong/generic-java/generic-java-library`。
- `RISK-AI-003` 新增残余风险：commons-cli library cross-file proof 当前仍偏向 TEST 文件，说明 production-source ranking 在 library 场景仍需继续优化；当前 source-role query 首个结果已命中 `src/main/java/org/apache/commons/cli/DefaultParser.java`，但不能宣称该问题彻底解决。
- 边界保持：library profile 不强制 Web/API/DB 形态，不证明真实 provider 或完整 benchmark。

## 4.126 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-003` 补充缓解：commons-cli library cross-file proof TEST 偏置已通过 source-root hint、非 TEST 意图测试文件降权、`src/test` primary boost 修正和 smoke gate 关闭。
- `RISK-REL-001` 回归控制：`generic-java-library` profile 现在要求 cross-file proof 至少包含 2 个非 TEST 主源码文件；commons-cli 单仓 smoke `scanTaskId=363` 输出 `mainSourceUniqueFiles=8,minMainSourceFiles=2`。
- `RISK-REL-001` 回归控制：默认三仓 matrix 重新 PASS，Pawnshop `scanTaskId=364`、spring-petclinic `scanTaskId=365`、commons-cli `scanTaskId=366`，`repoCount=3`，`javaAstDiagnosticsRepoCount=3`。
- 边界保持：显式 TEST 查询仍允许返回测试文件；该修复不是完整 semantic query planner，不证明真实 LLM provider、真实 embedding provider 或完整生产 benchmark。

## 4.127 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：P6 默认 retrieval matrix 已从 3 仓扩展到 5 仓，新增 Express JS/TS web framework 和 Axios JS/TS library profile。
- `RISK-AI-002` 边界保持：JS/TS profile 不要求 Java AST diagnostics；Java diagnostics gate 仍由 3 个 Java/JVM 仓库覆盖，`javaAstDiagnosticsRepoCount=3`。
- `RISK-AI-003` 补充缓解：JS/TS cross-file proof 新增 `sourceUniqueFiles` gate，要求至少 2 个源码文件，避免 docs/config/test 文件凑出跨文件假通过。
- `RISK-REL-001` 回归控制：默认五仓 matrix 输出 `P6_RETRIEVAL_QUALITY_MATRIX_OK`，`repoCount=5`，`languageFamilyCounts={mixed:1,java:2,js-ts:2}`，`jsTsNonJavaProfileCount=2`。
- `RISK-REL-001` 候选治理：redux 因 dependency graph 无节点被拒绝，未进入默认矩阵；该失败作为候选样本筛选证据保留。
- 边界保持：本轮仍是 bounded deterministic gate，不证明真实 LLM provider、真实 embedding provider、向量检索质量或完整生产 benchmark。

## 4.128 2026-07-07 P6/P11 风险补充记录

- `RISK-PERF-001` 补充缓解：P6 默认 retrieval matrix 新增单仓和总耗时预算，默认 `perRepoMaxSeconds=240,totalMaxSeconds=600`，避免 matrix 变慢但仍绿灯。
- `RISK-AI-004` 补充缓解：matrix 不再接受 `PARTIAL` citation coverage，必须达到 `FULL` 或 `REQUIRED_FULL`。
- `RISK-AI-004` 补充缓解：matrix 强制 `claimCitationCoverage.status=READY`，并校验 `crossFileCitationSummary` 当前 scan、citation binding、claim binding 均满足。
- `RISK-REL-001` 回归控制：默认五仓 matrix PASS，`totalDurationSeconds=144,maxCaseDurationSeconds=111,performanceBudget.status=OK`。
- 边界保持：该预算是本地 bounded regression gate，不代表生产 P95/P99 benchmark；真实 provider、embedding provider 和向量检索质量仍需后续门禁。

## 4.129 2026-07-07 P6/P11 风险补充记录

- `RISK-AI-001` 补充缓解：P6 新增 extended 8 仓 retrieval matrix preset，覆盖 mixed、Java、JS/TS、Python 和 CLI-library，降低默认 5 仓样本过窄导致的泛化误判。
- `RISK-AI-003` 补充缓解：新增 Koa、Flask、Commander profile，并要求 extended preset 至少包含 1 个 Python profile 和 1 个 CLI library profile。
- `RISK-REL-001` 回归控制：extended matrix 输出 `P6_RETRIEVAL_QUALITY_MATRIX_OK`，`repoCount=8`，`languageFamilyCounts={mixed:1,java:2,js-ts:4,python:1}`，`totalDurationSeconds=160,maxCaseDurationSeconds=102`。
- `RISK-REL-001` 候选治理：FastAPI 因 dependency graph 无节点被拒绝；Chalk 因 Code QA 偏单文件未进入强矩阵；Redux 仍保持拒绝状态。
- 边界保持：extended preset 是阶段验收 gate，不是完整生产 benchmark；真实 LLM provider、真实 embedding provider、向量检索质量和生产 P95/P99 仍未关闭。

## 4.130 2026-07-07 P9/P10/P12-pre 风险补充记录

- `RISK-PRODUCT-001` 新增缓解：产品最终形态、三平面分层、目标用户优先级、权限方向、导航 IA、主流程和北极星指标已在 `PRODUCT_POSITIONING_AND_ACCESS_MODEL.md` 锁定。
- `RISK-PRODUCT-001` 历史残余风险：当时 `web-console` 仍按功能模块导航，尚未实现当前口径的 `前台体验 / 开发者控制台 / 后台治理` 三平面 UI；历史英文三平面名仅作旧别名。
- `RISK-SEC-002` 残余风险：后端当前主要是登录用户 + 项目 owner 校验，尚未实现组织、多用户和角色 RBAC；因此不得宣称企业级权限体系完成。
- `RISK-PRODUCT-002` 残余风险：Dashboard 和产品指标尚未完全围绕 Trusted Engineering Loop Completion Rate 落地到 API、UI 或 release evidence。
- 边界保持：本轮锁定方向，不实现 RBAC schema，不拆独立后台，不前置 GitHub App、私有仓库、多用户协作和生产部署。

## 4.131 2026-07-07 P9/P10/P11/P12-pre 风险补充记录

- `RISK-PRODUCT-003` 新增缓解：SourceLens 顶级产品定义体系已封顶为 62 项，并写入 `TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md`。
- `RISK-PRODUCT-003` 残余风险：62 项是方向和边界，不是全部实现；不得把定义完成误宣传为企业版、商业化、SaaS、RBAC、法务或安全认证完成。
- `RISK-OPS-002` 新增缓解：公司操作系统已明确后续新需求必须优先映射到 62 项，不再默认新增制度文件，降低治理膨胀风险。
- `RISK-PRODUCT-001` 后续风险：如果 P9 不尽快落地三平面导航和 Dashboard 主链路，产品仍会停留在功能堆叠控制台。
- 边界保持：当前下一步应回到 P6/P9/P10/P11/P12-pre 产品主线，不能继续停在定义建设。

## 4.132 2026-07-07 P9 风险补充记录

- `RISK-PRODUCT-001` 缓解：App shell 已落地 `前台体验 / 开发者控制台 / 后台治理` 三平面导航，降低功能堆叠控制台风险；历史英文三平面名仅作旧别名。
- `RISK-PRODUCT-002` 缓解：Dashboard 第一屏已展示 Trusted Engineering Loop Completion Rate、四阶段闭环状态、产品指标条和下一步行动。
- `RISK-UI-001` 缓解：Dashboard status 与 latest scan repo/project/meta 已移除 ellipsis/nowrap 裁切，相关 smoke 覆盖 1440/390/320 三档 viewport。
- `RISK-SEC-002` 残余风险：三平面导航不是权限系统；后端 RBAC、组织、成员、角色仍未实现，不得宣称 Admin & Security Console 已具备企业级隔离。
- `RISK-PRODUCT-002` 残余风险：北极星指标当前由现有 Dashboard stats 派生，尚未进入独立指标 API、数据库或 release evidence。
- 验证：`npm run build`、`app-shell-ui` smoke、`dashboard-next-action` smoke、`git diff --check` PASS。

## 4.133 2026-07-07 P9 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：ProjectDetail 已新增 `项目主链路闭环`，把 F1 首次可信仓库分析、F2 源码级理解、F4 Issue 到修复候选、F5 安全与审计放到同一可见路径，降低项目详情页功能 tab 化和用户迷路风险。
- `RISK-UI-001` 进一步缓解：trusted loop 面板在 1440/390/320 三档视口进入 app-shell smoke，显式校验 4/1/1 响应式列数、步骤文案和无横向溢出。
- `RISK-REL-001` 回归控制：`APP_SHELL_UI_SMOKE_OK.layoutGuards` 已增加 `project-detail-trusted-loop-readable-and-responsive`，避免源码断言存在但 release marker 不自证。
- `RISK-SEC-002` 残余风险：F5 安全与审计入口是信息架构和跳转增强，不是 RBAC、权限隔离或审计策略完成。
- 边界保持：该切片不改后端 API、真实指标持久化、ScanTaskDetail 信息架构或 full release authority。
- 验证：`npm run build`、`app-shell-ui` smoke PASS。

## 4.134 2026-07-07 P9/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：ScanTaskDetail 已新增 `扫描报告可信闭环`，把 T1 报告结论、T2 证据引用、T3 code_chunks、T4 修复候选、T5 审计治理放到同一可见路径，降低扫描报告页模块堆叠和静态阅读化风险。
- `RISK-UI-001` 进一步缓解：trusted report loop 面板在 1440/390/320 三档视口进入 `report-evidence-drawer` smoke，显式校验 desktop 5 列、390/320 单列、步骤文案和无横向溢出。
- `RISK-REL-001` 回归控制：`REPORT_EVIDENCE_DRAWER_SMOKE_OK.trustedReportLoop.surface=SCAN_TASK_DETAIL_TRUSTED_REPORT_LOOP` 已进入 marker，避免测试源码覆盖但 marker 不自证。
- `RISK-SEC-002` 残余风险：T5 审计治理是信息架构和跳转增强，不是 RBAC、审计策略或权限隔离完成。
- 边界保持：该切片不改后端 API、AutoRepair 后端逻辑、真实指标持久化、release evidence schema 或 full release authority。
- 验证：`npm run build`、`report-evidence-drawer` smoke PASS。

## 4.135 2026-07-07 P9/P11 风险补充记录

- `RISK-PRODUCT-002` 进一步缓解：Dashboard Trusted Engineering Loop 指标已从纯前端推导推进到 `/api/dashboard/stats` 合同，返回 completion、status、ready stages、report evidence、Code QA readiness、recovery signal 和 metrics source。
- `RISK-REL-001` 回归控制：后端 focused tests 覆盖 Controller 字段透出和 `ScanStatService` 计算逻辑，避免指标字段变成静态拼接。
- `RISK-UI-001` 回归控制：Dashboard 显示 `API-backed metrics` / `client fallback`，并覆盖请求失败与旧 stats 缺新字段两类 fallback，避免用户误以为所有指标均来自同一来源。
- 残余风险：该切片仍未把指标写入独立数据库、release evidence package、生产 SLO 或审计报表；不能宣称生产级指标体系完成。
- 验证：focused backend tests、frontend build、dashboard smoke、app-shell smoke PASS。

## 4.136 2026-07-07 P11/P9 风险补充记录

- `RISK-REL-001` 进一步缓解：release verifier 对 `OK dashboard-next-action-ui-smoke` 新增 `dashboardStatsApiSignals` 强校验，避免发布证据只证明分支和截图、不证明 Dashboard 指标来源。
- `RISK-PRODUCT-002` 进一步缓解：发布证据必须证明 Dashboard 指标正常场景为 API-backed，并证明请求失败和旧 stats 缺字段两类 fallback。
- `RISK-REL-001` forged marker 控制：security regression 新增缺 `dashboardStatsApiSignals`、缺 API-backed case、缺 fallback case、缺 legacy fallback、错误 selector 五类反例。
- `RISK-REL-001` 反例精度修复：旧 visualEvidence hardcoded forged marker 已改为从 valid marker 派生，保留 `dashboardStatsApiSignals`，避免先被新 stats source gate 拒绝而掩盖原 visualEvidence 失败点。
- 残余风险：该切片仍未把 Dashboard 指标纳入完整 release evidence inventory、生产指标存储或所有发布 profile 的真实包验收。
- 验证：脚本语法 PASS；focused `release-verifier-dashboard-ui-marker` security suite 重跑 PASS。

## 4.137 2026-07-07 P11/P9 风险补充记录

- `RISK-REL-001` 进一步缓解：release evidence inventory 已新增 Dashboard metrics source 证据盘点，JSON 输出 `dashboardMetricsSourceEvidence`，table 输出 marker missing/invalid/incomplete 计数。
- `RISK-REL-001` 旧证据显性化：真实 `release-evidence` 目录当前 `marker_present=31`、`complete=0`、`incomplete=31`，明确暴露旧 Dashboard marker 缺新 `dashboardStatsApiSignals`，不会误判为完整指标来源证据。
- `RISK-OPS-002` 回归控制：inventory 仍只读，未引入移动、删除或归档动作；归档仍只允许 dry-run/manual review 路径。
- `RISK-REL-001` 打回修复：DevOps 首轮 PARTIAL 指出 self-test 缺新字段缺失反例、table summary 缺 missing/incomplete 明细；已补齐并二轮 PASS。
- 残余风险：该切片只是 evidence inventory 盘点，不生成新的 full release authority，也不证明所有发布 profile 都已包含新 Dashboard metrics source marker。
- 验证：语法、自测、真实 inventory 表格、DevOps 二轮复核 PASS。

## 4.138 2026-07-07 P9/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：Projects 页新增 `项目组合可信接入闭环`，把项目创建、公开仓库接入、扫描报告、代码问答和修复候选串成 Developer Workbench 组合入口。
- `RISK-UI-001` 进一步缓解：portfolio loop 在 app-shell smoke 中覆盖 1440/390/320，断言 4/1/1 列数、步骤标题不裁切和无横向溢出。
- `RISK-PRODUCT-001` 打回修复：Frontend Engineer 首轮指出筛选无结果时会暗中 fallback 到全量首项目；已改为 `filtered[0] || null`，并在 P2/P3/P4 显示 `目标：<项目名>` 或 `无匹配项目`。
- `RISK-REL-001` 回归控制：`validate-frontend-ui.mjs` 已新增 Projects portfolio loop 静态规则，防止后续删除 P1-P4、隐藏 fallback target、CSS 4/2/1 响应式或 smoke marker。
- 残余风险：该切片不实现 RBAC、后端项目权限、真实仓库 E2E 或完整 P9。
- 验证：frontend build、frontend-ui-check、app-shell smoke、Frontend Engineer 二轮复核 PASS。

## 4.139 2026-07-07 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：AgentChat 新增 `会话可信工作台`，把项目上下文、证据输入、工具审计和闭环任务前置到发送前，降低 AI 对话脱离证据链的风险。
- `RISK-SEC-002` 进一步缓解：工具审计入口只在 `selectedConversation.projectId` 已确认后开放，不再用默认项目兜底生成可能错误的审计 deep link。
- `RISK-UI-001` 进一步缓解：工作台在 AgentChat smoke 中覆盖 1440/320，断言 4/1 列数、四段文案和无横向溢出。
- `RISK-REL-001` 回归控制：smoke marker 已证明 scan report action 被真实点击并加载 ScanTaskDetail，`validate-frontend-ui.mjs` 钉住 scan click proof、stale message guard 和 silent refresh loading guard。
- `RISK-UI-002` 打回修复：Frontend Engineer 连续指出旧消息污染、错误项目审计兜底、scan action 未点击、异步乱序覆盖、silent refresh loading 卡死；均已修复并四轮 PASS。
- 残余风险：快速切换会话 race 尚无专门 Playwright 场景，当前由实现 guard、静态门禁和 Frontend 复核覆盖；后续 P11 可补 race smoke。
- 验证：frontend build、frontend-ui-check、AgentChat smoke、Frontend Engineer 四轮复核 PASS。

## 4.140 2026-07-07 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：Artifacts 新增 `产物保管责任链`，把来源绑定、显示脱敏、Raw Access 审计和复盘闭环放到同一工作台，降低运行产物页退化为文件列表的风险。
- `RISK-SEC-002` 进一步缓解：责任链明确 raw download 需要确认，并在有 receipt id 和无 receipt id 两种情况下都提供低敏审计入口，避免 raw access 只停留在 toast 或隐式下载。
- `RISK-UI-001` 进一步缓解：Artifacts smoke 覆盖 1440/390/320 三档 viewport，断言责任链 4/1/1 列数、四段文案、文本可读和无横向溢出。
- `RISK-REL-001` 回归控制：`ARTIFACTS_DETAIL_SELECTION_SMOKE_OK.artifactCustodyChain.scope=ARTIFACTS_CUSTODY_CHAIN_READABILITY` 已进入 marker，`validate-frontend-ui.mjs` 钉住责任链实现、CSS 响应式和 smoke marker。
- 残余风险：该切片不实现后端 RBAC、artifact retention 后端策略、生产审计报表、真实 provider 质量或 full release evidence。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、Artifacts smoke、Frontend Engineer 复核 PASS。

## 4.141 2026-07-07 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：AuditLogs 新增 `审计调查闭环`，把风险发现、证据脱敏、资源追踪和复盘处置前置到三源表格上方，降低审计页退化为日志表格堆叠的风险。
- `RISK-SEC-002` 进一步缓解：调查闭环明确 raw JSON 只证明显示层脱敏且默认收起，并沿用 READY/REVIEW/BLOCKED 审计判定门禁，不绕开 fail-closed 深链策略。
- `RISK-UI-001` 进一步缓解：AuditLogs smoke 覆盖 1440/390/320 三档 viewport，断言调查闭环 4/1/1 列数、四段文案、文本可读和无横向溢出。
- `RISK-REL-001` 回归控制：`AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK.auditInvestigationLoop.scope=AUDIT_LOGS_INVESTIGATION_LOOP_READABILITY` 已进入 marker，`validate-frontend-ui.mjs` 钉住调查闭环实现、CSS 响应式和 smoke marker。
- 残余风险：该切片不实现后端 RBAC、组织权限、生产 SIEM、告警系统、全量审计覆盖、真实 provider 质量或 full release evidence。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、AuditLogs smoke 7 项、Frontend Engineer 复核 PASS。

## 4.142 2026-07-09 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：ModelConfig 新增 `模型供应商治理闭环`，把激活门禁、密钥边界、Endpoint 风险和下游能力放到同一 Admin & Security 工作台，降低模型配置页退化为表格 CRUD 的风险。
- `RISK-SEC-002` 进一步缓解：API Key 表格显示新增 `displayApiKeyBoundary` 前端兜底脱敏，smoke 注入 raw API key fixture 并通过 DOM 文本负向断言证明 raw key 不渲染。
- `RISK-SEC-003` 进一步缓解：Endpoint 风险改为基于实际 `baseUrl` 与 provider preset 比对，非 `CUSTOM` provider 被改成代理或私有网关时也会进入 `覆盖/需复核` 路径。
- `RISK-UI-001` 进一步缓解：ModelConfig smoke 覆盖 1440/390/320 三档 viewport，断言治理闭环 4/1/1 列数、四段文案、文本可读、summary stat 可换行和无横向溢出。
- `RISK-REL-001` 回归控制：`MODEL_CONFIG_RECOVERABLE_SMOKE_OK.providerGovernanceLoop.scope=MODEL_CONFIG_PROVIDER_GOVERNANCE_LOOP_READABILITY` 已进入 marker，`displayBoundaries.rawApiKeysHidden=true`、`providerQualityOverclaimAbsent=true`、`llmFactOverclaimAbsent=true` 均由 DOM 断言派生；`validate-frontend-ui.mjs` 钉住 Endpoint override、API key redaction fallback、CSS wrap 和 smoke marker。
- 残余风险：该切片不实现后端密钥存储审计、真实 provider health check、额度/SLA 验证、RBAC、组织权限、生产 LLM provider 或 full release evidence。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、ModelConfig smoke、Frontend Engineer 二轮复核 PASS。

## 4.143 2026-07-09 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：AutoRepairs 新增 `自动修复候选治理闭环`，把候选来源、补丁生成、审查门禁和 PR 出口放到任务表上方，降低自动修复页退化为任务列表或单任务详情的风险。
- `RISK-SEC-002` 进一步缓解：候选来源明确扫描绑定与人工候选边界，页面不伪造 scanTask 来源；PR 出口文案明确 PR_CREATED 仍需人工 review、CI 和审计复盘。
- `RISK-UI-001` 进一步缓解：治理闭环 CSS 支持 1440 四列、1024 两列、390/320 单列，关键状态和说明使用 wrap/anywhere，不依赖 ellipsis 裁切。
- `RISK-REL-001` 回归控制：`PATCH_READY_UI_SMOKE_OK.autoRepairGovernanceLoop.scope=AUTOREPAIRS_GOVERNANCE_LOOP_READABILITY` 已进入 marker，证明四阶段、四视口、tablet 两列断点、无横向溢出、`fullRepairQualityClaim=false` 和 `llmFactClaim=false`。
- 打回修复：Frontend Engineer 首轮 PARTIAL 指出 smoke 未覆盖 <=1200 的两列断点；已补 `1024x768` tablet 视口、`tabletColumns`、`twoColumnBreakpoint` 和静态门禁，二轮 PASS。
- 残余风险：该切片不证明自动修复质量、后端沙箱完整性、真实 LLM provider、RBAC、生产权限隔离或 full release evidence。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、patch-ready smoke、Frontend Engineer 二轮复核 PASS。

## 4.144 2026-07-09 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：CI Diagnostics 新增 `CI 失败诊断治理闭环`，把日志接入、根因证据、修复资格和 AutoRepair 交接放到列表与详情之前，降低 CI 页退化为失败表格或孤立诊断详情的风险。
- `RISK-SEC-002` 进一步缓解：治理文案明确页面展示脱敏不代表原始日志可外发；现有日志显示继续使用 `redactSensitiveText` 并由 smoke 注入 bearer、apiKey、password、quoted secret、JWT 和 private key 反向验证。
- `RISK-UI-001` 进一步缓解：治理闭环 CSS 支持 1440 四列、1024 两列、390/320 单列，关键状态和说明使用 wrap/anywhere，不依赖 ellipsis 裁切。
- `RISK-REL-001` 回归控制：`CI_DIAGNOSTICS_DETAIL_SELECTION_SMOKE_OK.ciGovernanceLoop.scope=CI_DIAGNOSTICS_FAILURE_GOVERNANCE_LOOP_READABILITY` 已进入 marker，证明四阶段、四视口、tablet/mobile/narrow 断点、无横向溢出、`fullRepairQualityClaim=false` 和 `llmFactClaim=false`。
- `RISK-TEAM-001` 复核缺口：`Kuhn / 019f4442-23cd-7de1-9931-9dc0612dcad5 = 扎克伯格 / Frontend Engineer` 子 agent 启动后因 Codex 使用额度限制失败，未形成独立岗位 PASS；本轮采用主 agent fallback review，后续额度恢复可补只读复核。
- 残余风险：该切片不证明 CI provider webhook、后端权限、真实诊断质量、自动修复质量、真实 LLM provider、RBAC、生产权限隔离或 full release evidence。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、ci-diagnostics smoke、主 agent fallback review PASS。

## 4.145 2026-07-09 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：PR Reviews 新增 `PR 审查治理闭环`，把 PR 输入、风险判定、合并门禁和 AutoRepair 交接放到同一工作台，降低 PR 审查页退化为表格和孤立详情的风险。
- `RISK-SEC-002` 进一步缓解：治理文案明确 PR 审查完成不等于代码质量、业务正确性或安全性完全证明；修复候选创建后仍需补丁审查、CI、人工 review 和审计复盘。
- `RISK-UI-001` 进一步缓解：治理闭环 CSS 支持 1440 四列、1024 两列、390/320 单列，关键状态、说明和动作按钮使用 wrap/full-width 规则，不依赖 ellipsis 裁切。
- `RISK-REL-001` 回归控制：`PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK.prGovernanceLoop.scope=PR_REVIEWS_GOVERNANCE_LOOP_READABILITY` 已进入 marker，证明四阶段、四视口、tablet/mobile/narrow 断点、无横向溢出、`fullReviewQualityClaim=false` 和 `llmFactClaim=false`。
- `RISK-QA-001` 真实边界：`Confucius / 019f4457-36f8-7e50-a3ab-6e0eb86f0c47 = 拉里佩奇 / QA Engineer` 给出 PARTIAL，明确当前 smoke 只证明前端治理闭环和 URL 交接，不证明真实 PR provider、风险判定正确、后端 merge gate、AutoRepair API 创建或端到端闭环。
- 残余风险：该切片不证明真实 PR 输入解析、LLM/规则分析准确性、后端合并阻断、权限校验、CI 状态真实联动、AutoRepair 候选创建落库、RBAC 或 full release evidence。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、pr-reviews smoke、Frontend Engineer PASS、QA Engineer PARTIAL 边界记录。

## 4.146 2026-07-09 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：Dashboard 新增 `SourceLens 三平面产品结构`，把前台体验、开发者控制台和后台治理映射到页面入口、状态和动作，降低首页只有指标、缺少产品结构解释的风险。
- `RISK-UI-001` 进一步缓解：三平面 CSS 支持 1440 三列、1024 两列、390/320 单列，标题、说明、状态 tag、页面 chips 和按钮使用 wrap/full-width 规则，不依赖 ellipsis 裁切。
- `RISK-REL-001` 回归控制：`DASHBOARD_NEXT_ACTION_SMOKE_OK.productPlaneMap.scope=DASHBOARD_THREE_PLANE_PRODUCT_STRUCTURE_READABILITY` 已进入 marker，证明 7 个 Dashboard 状态分支 × 4 视口下三平面可见、列数正确、文本可读、动作存在、无横向溢出、`rbacCompleteClaim=false` 和 `productionDeploymentClaim=false`。
- `RISK-SCOPE-001` 边界控制：三平面文案明确后台治理不等于 RBAC、多租户或生产部署已完成，避免把产品结构入口误读成后端权限或生产化能力已经落地。
- `RISK-TEAM-001` 复核缺口：`Russell / 019f4491-8fd0-7592-aea7-0d6f6bfc08c8 = 乔布斯 / Product Manager` 与 `Gibbs / 019f4491-bf48-7330-ba36-37363bcbf854 = 扎克伯格 / Frontend Engineer` 均因 Codex 使用额度限制失败，未形成独立岗位 PASS；本轮采用主 agent fallback review，后续额度恢复可补只读复核。
- 残余风险：该切片不实现真实 RBAC、多租户、组织权限、生产部署、商业化体系、路由权限分层或 full release evidence。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、dashboard-next-action smoke、主 agent fallback review PASS。

## 4.147 2026-07-09 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：AppLayout 已把三平面从 Dashboard 入口推进到全局路由元信息、侧边栏、移动 Drawer 和 topbar plane，降低核心页面仍按功能堆叠导航的风险。
- `RISK-UI-001` 进一步缓解：app-shell smoke 覆盖 13 条核心路由 × 1440/390/320 三档 viewport，并继续验证页面标题、顶部信息、移动抽屉、主按钮、状态行和共享表格不裁切、不横向溢出。
- `RISK-REL-001` 回归控制：`APP_SHELL_UI_SMOKE_OK.productPlanes` 和 `routePlanes` 已进入 marker，证明每条核心路由映射到 `前台体验`、`开发者控制台` 或 `后台治理`。
- `RISK-SCOPE-001` 边界控制：该切片只证明导航与信息架构，不证明 RBAC、后台权限隔离、多租户、生产部署、商业化体系或 full release evidence。
- `RISK-TEAM-001` 复核状态：`Sartre / 019f4746-80b1-7120-b690-0fc5cb05bb6c = 乔布斯 / Product Manager` 与 `Pauli / 019f4746-d41e-75d0-8294-a1e4dc544a8e = 扎克伯格 / Frontend Engineer` 一轮均给出 PARTIAL；已修复文档口径、独立登记、390/320 移动抽屉、390/320 topbar plane 折叠和 product overclaim 证据后二轮 PASS。
- 残余风险：真实前后台权限分层、组织/成员/角色、后台管理域、生产部署和发布证据汇总仍是后续 P10/P11/P12-pre 工作。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、app-shell smoke、Product Manager 二轮复核、Frontend Engineer 二轮复核 PASS。

## 4.148 2026-07-09 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：IssueDecomposition 新增 `Issue 拆解治理闭环`，把需求输入、任务拆解、验收门禁和执行交接放到同一工作台，降低需求拆解页退化为列表、tabs 和导出工具的风险。
- `RISK-UI-001` 进一步缓解：治理闭环 CSS 支持 1440 四列、1024 两列、390/320 单列，阶段标题、证据、边界文案使用 wrap/anywhere，不依赖 ellipsis 裁切。
- `RISK-REL-001` 回归控制：`ISSUE_DECOMPOSITION_DETAIL_SELECTION_SMOKE_OK.issueGovernanceLoop.scope=ISSUE_DECOMPOSITION_GOVERNANCE_LOOP_READABILITY` 已进入 marker，证明四阶段、四视口、列数、文本可读、无横向溢出、`fullImplementationClaim=false` 和 `llmFactClaim=false`。
- `RISK-DATA-001` 进一步缓解：`IssueDecomposition` 使用 `selectedTaskRequestRef` 拒绝 stale 子任务 success/error/finally；smoke 已模拟 completed issue 子任务慢响应晚到 failed issue 后被拒绝，marker 记录 `delayedCompletedIssueTasksRejectedAfterFailedSelection=true`。
- `RISK-SCOPE-001` 边界控制：治理文案明确拆解结果只能作为开发计划证据，不能证明实现、测试、CI、PR 或 LLM 判断正确。
- `RISK-TEAM-001` 复核状态：`Jason = 乔布斯 / Product Manager` 二轮 PASS；`Socrates = 扎克伯格 / Frontend Engineer` 首轮 PARTIAL 指出 stale tasks 风险，修复后二轮 PASS；`Feynman = 拉里佩奇 / QA Engineer` PASS。
- 残余风险：该切片不证明真实 LLM 拆解质量、后端任务生成正确性、真实执行状态机、CI/PR/AutoRepair E2E、RBAC 或 full release evidence。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、issue-decomposition smoke、Product/Frontend/QA 复核 PASS。

## 4.149 2026-07-09 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：ExecutionTasks 新增 `执行生命周期治理闭环`，把来源接入、调度控制、证据采集和复盘交接放到同一工作台，降低执行任务中心退化为表格、进度条和详情动作的风险。
- `RISK-UI-001` 进一步缓解：生命周期闭环 CSS 支持 1440 四列、1024 两列、390/320 单列，阶段标题、状态、说明和边界文案使用 wrap/anywhere，不依赖 ellipsis 裁切。
- `RISK-REL-001` 回归控制：`EXECUTION_TASKS_DETAIL_SELECTION_SMOKE_OK.executionLifecycleLoop.scope=EXECUTION_TASKS_LIFECYCLE_GOVERNANCE_LOOP_READABILITY` 已进入 marker，证明四阶段、四视口、列数、文本可读、无横向溢出、`executionQualityClaim=false` 和 `llmFactClaim=false`。
- `RISK-DATA-001` 进一步缓解：`refreshSelectedDetail`、`handleCancel` 和显式 `loadDetail` 共享 `detailRequestSeqRef` 防 stale response；smoke 先挂起同任务 refresh 再取消、以及先挂起 explicit load 再取消，释放旧响应后均证明 stale sentinel 不渲染、cancel response 保留、detailLoading 清理。
- `RISK-SCOPE-001` 边界控制：治理文案明确执行任务闭环只能证明任务状态、来源、步骤、日志和产物入口可追踪，不能证明真实执行质量、产物正确、CI/PR/AutoRepair 或 LLM 结果已经正确。
- `RISK-TEAM-001` 复核状态：`Erdos = 乔布斯 / Product Manager` PASS；`Averroes = 扎克伯格 / Frontend Engineer` 首轮 PARTIAL 指出 status/description readability 与 stale detail guard 缺口、二轮 PARTIAL 指出 cancel 打断 explicit load 后 detailLoading 可能卡住，修复后三轮 PASS；`Dewey = 拉里佩奇 / QA Engineer` PASS。
- 残余风险：该切片不证明真实任务执行正确性、产物质量、CI/PR/AutoRepair E2E、后端权限、RBAC 或 full release evidence。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、execution-tasks smoke PASS。

## 4.150 2026-07-09 P9/P10/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：AgentTasks 新增 `Agent 任务治理闭环`，把任务入口、执行控制、工具证据和复盘交接放到同一工作台，降低 Agent 任务页退化为任务表、详情和启动/取消按钮的风险。
- `RISK-UI-001` 进一步缓解：治理闭环 CSS 支持 1440 四列、1024 两列、390/320 单列，阶段标题、状态、说明和边界文案使用 wrap/anywhere，不依赖 ellipsis 裁切。
- `RISK-REL-001` 回归控制：`AGENT_TASKS_DETAIL_SELECTION_SMOKE_OK.agentLifecycleLoop.scope=AGENT_TASKS_LIFECYCLE_GOVERNANCE_LOOP_READABILITY` 已进入 marker，证明四阶段、四视口、列数、状态/说明文本可读、无横向溢出、`modelJudgementClaim=false` 和 `toolOutputTruthClaim=false`。
- `RISK-DATA-001` 进一步缓解：`AgentTasks.fetchSteps` 使用 `stepsRequestSeqRef` 拒绝 stale step response，避免旧任务步骤污染当前选中任务和治理闭环。
- `RISK-SCOPE-001` 边界控制：治理文案明确 Agent 任务闭环只能证明任务元数据、步骤、对话、扫描报告和产物入口可追踪，不能证明模型判断正确、工具输出真实、修复/PR/CI 结果正确。
- `RISK-TEAM-001` 复核状态：`Goodall = 乔布斯 / Product Manager`、`Dalton = 扎克伯格 / Frontend Engineer`、`Popper = 拉里佩奇 / QA Engineer` 只读复核均为 PASS。
- 残余风险：该切片不证明真实 LLM 判断正确、工具输出真实、Agent 执行器正确、CI/PR/AutoRepair E2E、后端权限、RBAC 或 full release evidence。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、agent-tasks smoke PASS。

## 4.151 2026-07-10 P9/P6/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：Dashboard 新增 `管理层决策简报`，把阶段进度、质量状态、风险阻塞和下一步投入放到同一决策面板，降低 Dashboard 只显示指标和页面入口、不能指导投入优先级的风险。
- `RISK-PRODUCT-002` 入口一致性缓解：Dashboard code QA 主入口统一到 `/agent-chat?handoff=code-understanding&source=DASHBOARD_CODE_QA_ENTRY`，降低 `/agent-chat` 与 `/projects/:id?tab=qa` 双 QA 产品入口漂移风险。
- `RISK-UI-001` 进一步缓解：Dashboard smoke 覆盖 1440/1024/768/390/320 五档 viewport；管理层简报 4/2/2/1/1 列、三平面 3/2/2/1/1 列均进入 marker；三平面头部和卡片头在 960px 前单列，Tag 可收缩可换行。
- `RISK-REL-001` 回归控制：`DASHBOARD_NEXT_ACTION_SMOKE_OK.executiveBriefing.scope=DASHBOARD_EXECUTIVE_BRIEFING_DECISION_READABILITY` 已进入 marker，证明四项信号、列数、文本可读、action 可见和无 P9/RBAC/生产/商业化过度宣称。
- `RISK-SCOPE-001` 边界控制：管理层简报明确只汇总当前 Dashboard/API/页面证据，不证明 P9 全阶段完成、RBAC 权限隔离落地、生产部署可上线或商业化体系完成。
- `RISK-TEAM-001` 复核状态：`Hilbert = 乔布斯 / Product Manager` 首轮 PARTIAL 指出 QA 入口不统一和管理层决策面缺口，修复后二轮 PASS；`Mill = 扎克伯格 / Frontend Engineer` 首轮 PARTIAL 指出 768/Tag/头部挤压风险，修复后二轮 PASS。
- 残余风险：该切片不证明真实指标权威、release evidence verifier 已纳入新 executive marker、RBAC、生产部署、商业化体系或 P9/P6/P11 全部完成。
- 验证：TypeScript noEmit、frontend build、frontend-ui-check、dashboard-next-action smoke PASS。

## 4.152 2026-07-10 P11/P9 风险补充记录

- `RISK-REL-001` 已缓解：release verifier 现在强制校验 Dashboard executive briefing 的四类信号、五视口 visited coverage、布局/可读性/action 和四类 no-overclaim 字段。
- `RISK-REL-002` 已缓解：五张 `visualEvidence` PNG 必须唯一且进入 package allowlist；文件名、路径、实际 PNG、尺寸、bytes、像素多样性和 viewport 边界均受 verifier 约束。
- `RISK-SEC-004` 已缓解：Dashboard forgery suite 覆盖缺 executiveBriefing、错误 scope/signal/count、布局/可读性/action 失败、P9/RBAC/生产/商业化过度宣称、缺失/重复中间截图和错误移动截图尺寸。
- `RISK-OPS-001` 可见性增强：inventory 新增独立 `dashboardExecutiveBriefingEvidence`、`viewportCoverageComplete` 和 `visualEvidenceCoverageComplete`，旧包不能伪装成新 schema complete。
- `RISK-QA-001` 打回记录：主 agent 首轮复核发现真实 smoke 输出五张截图而 verifier/fixture 仍只接受两张，已打回 DevOps/QA 并完成第二轮修复和复跑。
- 残余风险：当前 full authority `release-current-schema-20260705-0610` 早于新 schema，inventory 显示其 Dashboard executive evidence incomplete；必须在后续 release/nightly 刷新，当前 focused gate 不改变 authority。
- 验证：inventory self-test、Dashboard verifier forgery suite、bash/node syntax、真实 dashboard smoke PASS。

## 4.153 2026-07-10 P9/P11 风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：扫描报告路由现在保留“扫描报告 / 前台体验 / 项目与仓库”全局身份，Dashboard 交接与直接加载均不再落入通用 `SourceLens` fallback。
- `RISK-UI-001` 进一步缓解：app-shell 与 Dashboard smoke 覆盖 1440/390/320，桌面 Sider 和移动 Drawer 父菜单选中一致，`runtimeIssues=0`、`horizontalOverflow=true`。
- `RISK-REL-001` 当前升级为阻断：历史 full authority `release-current-schema-20260705-0610` 被最新 verifier 以 `productPlaneMap must be an object` 拒绝；刷新前不得称为 current authority。
- `RISK-REL-002` 进一步缓解：productPlaneMap 已进入 producer、verifier、inventory、self-test 和 15 个 forged variant 回归，旧包不能伪装成三平面证据完整。
- `RISK-TEAM-001` 过程风险已收敛：`Anscombe / 019f49b2-dbcf-7202-b678-69e6c6d7d677` 与 `Kuhn / 019f49b6-eee8-7b73-808c-f3c800bb7796` 长时间无成果物返回后被关闭；任务拆小后由 `Parfit`、`Planck`、`Feynman`、`Huygens`、`Hegel` 完成。`Hegel` 首轮 PARTIAL 也被打回补齐精确拒绝断言。
- 残余风险：新 full release profile 尚未运行；工作树仍包含大量未提交阶段成果，刷新 authority 前需使用当前源码构建稳定 runtime，并保留 local authority 边界。
- 验证：P9 两组 Playwright、frontend build/UI validator、inventory self-test、Dashboard verifier forgery suite、bash/node syntax、API/DB contract、backend compile PASS；旧 authority verifier 预期 FAIL。

## 4.154 2026-07-10 P9/P11 风险补充记录

- `RISK-REL-001` 阻断已解除：`release-current-schema-20260710-114653` 完成 release profile，0 required failures、0 optional warnings、5 skipped，并通过最新独立 verifier 与 checksum 校验。
- `RISK-REL-002` 进一步缓解：`REQUIRED_FULL` 只能在 PRIMARY/必需证据全覆盖时派生 `requiredCitationCoverageSatisfied=true`；确定性正向夹具与隔离 forged case 均已通过。
- `RISK-SEC-004` 进一步缓解：前端不再因显式 `readyForRepair=true` 绕过 roleDistribution、必需主张、PRIMARY 绑定和文件计数一致性；缺失/矛盾样本保持 REVIEW 且隐藏修复候选入口。
- `RISK-DATA-001` 进一步缓解：AgentChat closure verifier 区分当前 `linkedAgentTaskId` 与代码理解交接 `handoffAgentTaskId`，绑定只能指向交接任务，错绑伪造会被拒绝。
- `RISK-TEAM-001` 复核闭环：`Plato / 019f4a19-48b0-7130-bade-0f8b06c218d6 = 拉里佩奇 / QA Engineer` 首轮 PARTIAL，补齐 REQUIRED_FULL 正向与隔离负例后 PASS。
- 残余风险：5 个高级集成步骤继续按策略跳过；RBAC、多租户、GitHub App/Webhook E2E、真实 LLM provider、灾备签署与生产部署仍不得宣称完成。
- 验证：full release profile、独立 verifier、public-repo live UI、report evidence drawer Playwright、frontend UI validator、public repo/AgentChat verifier security suites PASS。

## 4.155 2026-07-10 P9 首屏动作风险补充记录

- `RISK-FE-001` 进一步缓解：Dashboard 不再固定主推“接入仓库”，7 种状态均由 `nextAction` 仲裁唯一 primary；错误态主动作只能是重试。
- `RISK-PRODUCT-001` 进一步缓解：Projects 不再把 fatal load failure 显示成 0 项目组合；initial/fatal/stale/confirmed-empty/filtered-empty 已分离。
- `RISK-FE-001` 移动端缓解：`<=960px` 顶栏直接显示产品平面，用户无需打开 Drawer 才能判断当前前台/开发者/后台上下文。
- `RISK-QA-001` 过程缺陷已修复：旧 smoke 通过 `scrollIntoViewIfNeeded()` 伪造首屏证据；当前 Dashboard smoke 强制 `scrollY=0`，验证 1440/1024/768/390/320 的按钮底边和唯一 primary。
- 当时残余风险：持久化工作视角尚未实现（已由 4.156 focused gate 关闭）；ProjectDetail、ScanTaskDetail、AgentChat 等关键页仍需同样的首屏动作仲裁；本 focused gate 使用 mocked API，不证明真实后端 E2E。

## 4.156 2026-07-10 P9 工作视角风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：三工作视角已从“所有菜单同时展示”推进为逐用户导航偏好；中立根入口负责恢复默认视角，具体首页和其他深链保持 URL 权威。
- `RISK-SCOPE-001` 过度宣称已收敛：backlog、marker 和 UI 统一使用“逐用户偏好键隔离”，明确不代表角色识别、RBAC 或权限隔离。
- `RISK-FE-001` 进一步缓解：完整路径段匹配替代裸 `startsWith`；跨 720px 时关闭 Drawer，并恢复桌面折叠偏好，避免双导航层残留。
- `RISK-QA-001` 过程缺陷已修复：新增 22 秒 canonical focused smoke，移除隐藏 radio/force click 和 Drawer 动画竞态；全站 240 秒超时不再覆盖聚焦用例。
- `RISK-CLIENT-STORAGE-001` 已受控：localStorage 白名单、读写 try/catch、非法值和 Storage 抛错用例均 fail-safe；该存储永不作为授权来源。
- `RISK-TEAM-001` 复核闭环：Product 首轮 BLOCK、Frontend/QA 首轮 PARTIAL 均被打回；修复根入口、归属、断点、路径匹配、真实点击、存储异常和证据归因后二轮全部 PASS。
- 残余风险：服务端 RBAC、组织角色、服务端/跨设备偏好、真实后端 E2E 和 P9 其他关键页首屏仲裁仍未完成。
- 验证：`npm run smoke:work-perspective` 2 passed / 22.0s、frontend UI validator、production build、`git diff --check`、Product/Frontend/QA 二轮复核 PASS。

## 4.157 2026-07-10 P9 ProjectDetail 首屏与异步所有权风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：项目核心数据未确认时不再把初始空数组解释为“无仓库/无扫描”；致命错误只主推重试，陈旧快照只主推重新同步。
- `RISK-FE-001` 进一步缓解：project generation、core/detail sequence、full refresh owner 和 visible sync owner 分离；递归 polling 不再只执行一次，也不能吞掉 full refresh 或提前清除 loading。
- `RISK-DATA-001` 进一步缓解：project/repository/scan/execution/artifact/preview/code_chunks 全部要求当前 project/scan 归属；A -> B 延迟 core/code_chunks/preview smoke PASS。
- `RISK-SEC-004` 进一步缓解：删除仓库和取消扫描在发送 mutation 前验证可信快照和实体归属，避免仅在响应后阻断错误写入。
- `RISK-UI-001` 进一步缓解：主动作置于 evidence checks 之前；五视口 `scrollY=0`、按钮边界、唯一 primary、无横向溢出均通过，320 trace 证明没有隐藏证据换取首屏。
- `RISK-QA-001` 过程缺陷已修复：首个 QA agent 无交付；第二个 QA 首轮暴露 320x740 按钮底边 888.25px，修复后 canonical 11 passed；race 初次失败是非唯一 locator，修正后单测与全套均 PASS。
- `RISK-TEAM-001` 复核闭环：Architect 首轮提出 3 个 P1 和 2 个 P2，被主 agent 判定为阻断并打回；修复后二轮 Architect/Product 均 PASS。
- 残余风险：ScanTaskDetail 和 AgentChat 尚未完成同等级首屏仲裁；mocked API 不证明真实后端 E2E；RBAC、生产部署和 P9 整体仍未完成。
- 验证：canonical ProjectDetail smoke 11 passed / 54.9s，batch4A focused 3 passed / 9.2s，frontend build/UI validator/diff check 和桌面/320 visual trace PASS。

## 4.158 2026-07-10 P9 ScanTaskDetail 首屏与报告归属风险补充记录

- `RISK-PRODUCT-001` 进一步缓解：未确认任务/产物/报告时不再展示 cockpit、0 风险或可信报告；无 execution steps 时不再伪造 PENDING 流程，明确显示“执行步骤证据未提供”。
- `RISK-DATA-001` 进一步缓解：task/artifact/preview/execution/code_chunks 使用 scan/project/generation/owner 校验；A -> B 五阶段迟到响应和旧 polling 均被拒绝。
- `RISK-FE-001` 进一步缓解：preview 刷新失败保留旧可信快照并进入 STALE，唯一 primary 为重新同步；成功后恢复 READY 与 active polling。
- `RISK-QA-001` 过程缺陷已修复：首版 marker 把 3 个 fatal source × 5 viewport 宣称为 15 个 source case，且未测完整错误原因；现已改为 15 个独立场景、reason bounding/wrap/字号检查和 4 张成功 PNG。
- `RISK-TEAM-001` 复核闭环：QA 首轮 PARTIAL 暴露 preview snapshot、场景口径和错误原因问题；Product 首轮 BLOCK 暴露成功态与 synthetic PENDING steps 冲突；全部打回修复后 Product/Frontend/QA/Architect PASS。
- 残余风险：focused smoke 全部 mock API，不证明真实后端 E2E、报告事实正确、RBAC、生产部署或 P9 全阶段；AgentChat 首屏/移动 composer 仍未完成同级仲裁。
- 验证：focused 7 passed / 48.5s、frontend production build、UI validator、`git diff --check`、desktop/320 READY+STALE PNG 人工复核 PASS。
