# SourceLens Frontend Design System

> AIOS v2.3 状态：`SUPPORTING UI REFERENCE / FEATURE WORK FROZEN IN P0`。现有可访问性与视觉规范继续有效，但旧 P9 扩展主线已冻结；新 UI 只在 P4 证据闭环需要时以 bounded task 启动。

状态：任务级支持参考；P0期间不拥有功能排期或产品阶段权威。

## 1. 设计原则

- 操作型工具优先：信息密度高、层级清楚、状态明确。
- 不做营销页式视觉，不用装饰性大卡片堆叠。
- 页面第一屏必须直接服务任务，而不是介绍产品。
- 所有关键文字必须可读，不裁切，不低对比。
- 移动端和窄屏必须保留核心动作和状态。

## 2. UI 原语

| 元素 | 标准 |
| --- | --- |
| Button | 明确动作语义；主按钮必须高对比；危险操作必须二次确认 |
| Table | 支持行选择、键盘访问、详情入口、空态、错误态；容器必须可收缩，横向滚动由 table content/body 承担，非 ellipsis 单元格可换行 |
| Drawer/Modal | 只承载详情、确认或复杂编辑，不做页面主布局替代；标题、extra action、footer action 和窄屏宽度必须可读可控 |
| Card | 只用于重复实体、证据块或工具面板；禁止卡片套卡片 |
| Status | loading、empty、error、success、warning 必须可区分 |
| Empty fallback | 核心页面空态优先使用 StateBlock；Ant Empty 仅作为内部/portal fallback，描述和 footer action 必须可换行 |
| Menu / Dropdown | 侧边栏、移动抽屉菜单和用户下拉菜单必须可换行，不得裁切导航标签或账号动作 |
| Tooltip / Popover / Popconfirm | 说明、确认和风险摘要必须限制在 viewport 内，可换行，不得裁切；确认按钮必须可换行 |
| Message / Notification | 即时反馈、API 错误、请求 ID 和恢复动作必须限制在 viewport 内，可换行，不得裁切 |
| Progress | 扫描、任务、修复和报告进度必须可收缩，进度文本不得被裁切或省略 |
| Timeline | 执行步骤、修复尝试和治理事件必须可收缩，步骤标题、标签、错误、证据和 URL 不得被裁切或省略 |
| Input | 仓库 URL、分支、路径、token、搜索词和数值输入必须可收缩；prefix、suffix、addon 和搜索按钮不得挤压或裁切 |
| Form | 错误信息靠近字段，提交失败必须可恢复；label、校验错误和 extra/help 文案必须可换行 |
| Evidence view | 证据必须显示来源、置信度、限制和下一步 |
| Tag / Badge | 状态、风险、证据类型、路径和治理标签必须可换行，不得用省略号隐藏关键上下文 |
| Alert | 错误、风险、安全边界、证据说明和恢复动作必须可换行，不得裁切 |
| Descriptions | ID、路径、hash、URL、错误和审计详情必须可换行，不得裁切或省略 |
| List | 风险、技术债、建议、证据摘要和 action 必须可换行，不得挤压或隐藏 |
| Modal / Confirm | 标题、正文、表单错误和底部 action 必须在窄屏内可换行，不得撑破 viewport |
| Card Header | 卡片标题、状态标签和 extra action 必须可换行，不得挤压主体或隐藏 |
| Space | action row、标签组、证据组和标题组合必须可收缩可换行；`Space.Compact` 输入组合不应被强行拆开 |
| Typography / Code | 普通非 ellipsis 文本、inline code 和 preformatted 文本必须可收缩；路径、hash、命令、状态、摘要和证据引用不得横向溢出 |
| Pagination | 分页器、总数文本、页码跳转和 page-size 控件必须可换行，不得在表格底部挤压或横向溢出 |
| Tabs | Tab 容器必须可收缩；tab label 必须可换行，不得用省略号或隐藏裁切关键上下文；nav-wrap 可作为横向滚动层 |
| Select | 选择器已选值、placeholder、多选标签和下拉选项必须可换行，不得隐藏项目名、仓库名、分支名、模型名或状态上下文；下拉面板按 Ant portal 共享层治理 |

## 3. 可读性门禁

必须满足：

- 正文、按钮、标签对比度足够。
- 长路径、长标题、长错误信息可换行。
- 关键 CTA 不使用灰字低对比。
- 320px 宽度不横向溢出核心内容。
- 页面顶部标题不被浏览器或布局裁切。
- App shell topbar 的标题和辅助信息必须按优先级响应式显示：桌面端环境、端口、用户名可读；窄屏端辅助信息折叠，不能挤压标题。
- 报告、修复、审计等高风险 action rail 的禁用或开放原因必须是可见文本，不能只依赖 disabled button、hover title 或隐含状态色。
- 共享 `StateBlock` 的标题、说明和操作区必须支持长错误码、URL、路径、API message 和 retry 文案换行。
- 共享 Ant `Empty` fallback 只用于内部/portal 空态兜底，description 和 footer action 必须支持长说明和恢复动作换行；核心产品空态仍优先使用 `StateBlock`。
- 共享 Ant `Menu` / `Dropdown` 的导航标签、分组标题和用户动作必须支持长文本换行；桌面折叠侧栏不应被强行展开，移动抽屉菜单和 Dropdown portal 必须保持可读。
- 共享 Ant `Tooltip` / `Popover` / `Popconfirm` 的 portal 容器必须限制在窄屏 viewport 内；说明文案、风险摘要、确认描述和确认按钮必须可换行。
- 共享 Ant `Message` / `Notification` 的 portal 容器必须限制在窄屏 viewport 内；API 错误、请求 ID、操作反馈和通知 action 必须可换行。
- 共享 Ant `Progress` 的 root、line、outer/inner 和 text 必须可收缩；进度百分比、状态文本和异常标识不得被裁切。
- 共享 Ant `Timeline` 的 root、item、content 和 label 必须可收缩；执行步骤标题、状态、错误、证据说明、路径和 URL 不得被裁切。
- 共享 Ant `Input` / `InputNumber` / `TextArea` / `Input.Search` 的 root、wrapper、affix、addon 和 search action 必须可收缩；不得改变真实输入框、密码框、数值框或 TextArea 的编辑行为。
- 共享 Ant `Radio` / `Radio.Button` 的 group、wrapper、button wrapper 和 label span 必须可收缩并支持长选项文案换行；不得让 DependencyGraph 视图切换、模式选择或治理筛选在窄屏裁切。
- 共享 Ant `Collapse` 的 root、item、header、header text、extra、content 和 content box 必须可收缩并支持长日志标题、路径、错误、证据摘要和 action 文案换行；expand icon 必须保持稳定尺寸。
- 共享 Ant `Tag` / `Badge` 文本必须支持长状态、路径、证据标签和 task/scan 标识换行。
- 共享 Ant `Alert` 的 message、description 和 action 必须支持长错误、路径、安全说明和恢复动作换行。
- 共享 Ant `Descriptions` 的 label 和 content 必须支持长 ID、路径、hash、URL、错误和审计详情换行。
- 共享 Ant `List` 的 title、description 和 action 必须支持长风险、路径、URL、证据摘要和恢复动作换行。
- 共享 Ant `Modal` / `Confirm` 的 title、content、form label、form error、footer button 和 confirm button 必须支持长错误、路径、hash、URL、风险说明和操作文案换行。
- 共享 Ant `Drawer` 的 content wrapper、header、title、extra、footer 和 action button 必须受 viewport 约束并支持长标题、路径、hash、审计事件、产物信息和 action 文案换行。
- 共享 Ant `Card` 的 head title、extra、title/extra 中的 Space 和 Space item 必须支持长标题、状态标签和 action 换行。
- 共享 Ant `Space` 的 horizontal action row、标签组、证据组和标题组合必须支持 wrap；`Space.Compact` 输入组合必须保持不被共享 wrap 规则拆开。
- 共享 Ant `Typography` 容器必须可收缩；非 `.ant-typography-ellipsis` 的普通 Text/Title/Paragraph 必须支持长标题、摘要、状态、路径和证据说明换行；inline `code` 和 `pre` 必须支持长路径、hash、命令、错误片段和证据引用换行；不应覆盖表格列中已有的业务级 ellipsis 策略。
- 共享 Ant `Table` wrapper、container、content、body 和 spin 容器必须可收缩；table content/body 必须承担横向滚动；非 `.ant-table-cell-ellipsis` 的单元格必须支持长项目名、仓库名、任务状态、审计事件、产物信息和错误说明换行；显式 ellipsis 单元格必须保留业务级省略策略。
- 共享 Ant `Pagination` 的分页器、总数文本、page-size 选择和 quick jumper 必须可收缩可换行，不得在 Table/Card 底部造成横向溢出。
- 共享 Ant `Tabs` 的容器、nav、content 和 tab label 必须支持长报告标签、审计标签、产物预览标签和工作区标签换行；允许 nav-wrap 横向滚动，但不得由 nav 或 tab label 裁切文本。
- 共享 Ant `Select` 的 selected item、placeholder、多选 value tag 和 dropdown option 必须支持长项目名、仓库名、分支名、模型名、状态标签和 provider 标签换行；dropdown option 通过 `.ant-select-dropdown` portal 层统一治理。
- 共享 Ant `Form` 的 label、validation explain/error 和 extra/help 文案必须支持长 URL、token 策略、分支名、权限说明、字段名和恢复说明换行。

## 4. 响应式基线

核心 smoke 至少覆盖：

- `1440x900`
- `390x844`
- `320x740`

## 5. P9 优先治理页面

1. Dashboard
2. ProjectDetail / ScanTaskDetail
3. AuditLogs
4. AgentTasks / ExecutionTasks
5. Artifacts
6. AutoRepairs
7. IssueDecomposition
8. PrReviews
9. ModelConfig

## 6. 禁止事项

- 禁止低对比按钮文字。
- 禁止关键状态只靠颜色表达。
- 禁止内容被省略号隐藏而无详情入口。
- 禁止状态面的错误说明或恢复操作被 `nowrap` / `ellipsis` 隐藏。
- 禁止把核心产品空态从 `StateBlock` 回退为 raw Ant `Empty`；Ant Empty fallback 的 description 或 footer action 不得被 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 隐藏。
- 禁止侧边栏、移动抽屉菜单或 Dropdown 菜单标签被 `nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏；禁止为了长标签强行展开折叠侧栏。
- 禁止 Tooltip、Popover 或 Popconfirm 的 title、description、message、inner content 或确认按钮被 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 隐藏。
- 禁止 Message 或 Notification 的 notice content、custom content、message、description 或通知按钮被 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 隐藏。
- 禁止 Progress 的 text 被 `nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏。
- 禁止 Timeline 的 label 或 content 被 `nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏。
- 禁止 Input prefix、suffix、addon、InputNumber addon 或搜索按钮被 `nowrap`、`ellipsis`、`overflow:hidden`、无限宽度或容器裁切隐藏；禁止为了可读性改写输入控件本身的编辑文本换行行为。
- 禁止 Radio / Radio.Button 选项标签被 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 隐藏。
- 禁止 Collapse header、header text、extra 或 content box 被 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 隐藏。
- 禁止状态、风险、证据标签或 badge 文本被 `nowrap` / `ellipsis` 隐藏。
- 禁止 Alert 的错误说明、安全边界或 action 被 `nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏。
- 禁止 Descriptions 的详情字段被 `nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏。
- 禁止 List 的 title、description 或 action 被 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 隐藏。
- 禁止 Modal / Confirm 的 title、content 或 footer action 被 `nowrap`、`ellipsis`、`overflow:hidden`、`flex-wrap:nowrap` 或无限宽度撑破 viewport。
- 禁止 Drawer 的 title、extra action 或 footer action 被 `nowrap`、`ellipsis`、`overflow:hidden`、`flex-wrap:nowrap` 或无限宽度撑破 viewport。
- 禁止 Card header title 或 extra action 被 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 隐藏。
- 禁止普通 horizontal Space action row 或 Space item 被 `flex-wrap:nowrap`、`nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏；禁止把该规则误套到 `Space.Compact` 输入组合。
- 禁止非 `.ant-typography-ellipsis` 的 Typography 普通文本被 `nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏；禁止 inline `code` 或 `pre` 被 `nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏。
- 禁止共享 Table 容器撑破 app shell；禁止非 `.ant-table-cell-ellipsis` 单元格被 `nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏；禁止共享 Table 规则强行覆盖 `.ant-table-cell-ellipsis` 的业务省略策略。
- 禁止 Pagination 总数文本、quick jumper 或 options 被 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 隐藏。
- 禁止 Tabs 的 tab label 被 `nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏；禁止报告页 Tabs nav 用 `overflow:hidden` 覆盖共享可读性规则。
- 禁止 Select 已选值、placeholder、多选 value tag 或下拉选项被 `nowrap`、`ellipsis`、`overflow:hidden` 或 `flex-wrap:nowrap` 隐藏。
- 禁止 Form label、validation explain/error 或 extra/help 文案被 `nowrap`、`ellipsis` 或 `overflow:hidden` 隐藏。
- 禁止页面主要信息被顶部布局裁切。
- 禁止 app shell topbar username 用 `ellipsis`、`overflow:hidden` 或 `nowrap` 隐藏真实账号信息；窄屏必须折叠辅助信息而不是挤压标题。
- 禁止高风险 action 只显示禁用按钮而不显示可读阻断原因；修复候选、raw access、审计导出和凭据相关操作必须说明开放或阻断原因。
- 禁止新增裸散样式绕过共享 UI 原语。
