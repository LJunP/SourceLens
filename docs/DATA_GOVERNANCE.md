# SourceLens Data Governance

> AIOS v2.3 状态：`SUPPORTING DATA POLICY`。旧 Owner 和 release authority 用语为历史；TaskSpec、Trace、Research Artifact 与 Patch Evidence 数据必须同时遵守 `aios/EVALUATION_PROTOCOL.md`。

状态：长期执行。本文定义 SourceLens 数据生命周期、保留边界和删除策略。

## 1. 数据类别

| 数据 | 示例 | 风险 | Owner |
| --- | --- | --- | --- |
| 仓库副本 | clone 到本地 workspace 的公开仓库 | 体积膨胀、潜在敏感文件、路径风险 | `奥特曼` / `黄仁勋` |
| 扫描任务 | scan_tasks、scan artifacts、报告 JSON | 过期证据、跨项目污染 | `比尔盖茨` |
| code_chunks | 文件片段、symbol、embedding metadata | 证据漂移、数据增长 | `梁文峰` |
| artifact records | report、preview、download receipt | raw payload 泄漏、权限边界 | `奥特曼` / `比尔盖茨` |
| audit logs | 操作、工具调用、webhook delivery | 长期保留与隐私边界 | `奥特曼` / `库克` |
| release evidence | 本地验收证据包 | 混淆 authority、磁盘膨胀 | `黄仁勋` / `达里奥` |
| secrets/env | `deploy/.env`、token、LLM key | 泄漏风险 | `奥特曼` |

## 2. 生命周期原则

- 公开仓库分析优先；私有仓库和 GitHub App 作为高级集成层后置。
- raw payload 默认不进入普通 UI；必须展示时先做脱敏、权限和审计。
- 删除项目时，未来必须级联处理 scan、artifact、chunk、task、audit 的关联策略。
- code_chunks 可重建时优先保留重建路径，不无限保存不可解释缓存。
- release evidence 删除前必须只读 inventory，不自动删除当前 authority。

## 3. 保留策略基线

| 数据 | 默认策略 |
| --- | --- |
| `deploy/.env` | 本地保留，永不提交 |
| `.sourcelens-runtime/` | 本地运行数据，清理前确认后端进程不依赖 |
| `release-evidence/` | 不入库；当前 authority 保留；历史包先 inventory 再人工归档 |
| `bin/`、`target/`、`dist/` | 可再生成，允许清理 |
| audit log | 默认保留，未来按企业/用户策略配置 |
| code_chunks | 与 scan/project 生命周期绑定，未来补重建和淘汰策略 |

## 4. 必须补测试或文档的变化

以下变化必须同步本文、`DATABASE_DESIGN.md` 或 `SECURITY_BOUNDARY.md`：

- 新增长期保存的表、文件、artifact 或缓存。
- 新增 raw download、preview、copy、export。
- 新增 embedding、向量索引、图谱或外部存储。
- 新增私有仓库、多用户、组织、权限或 GitHub App E2E。
- 新增自动清理、归档、删除或备份恢复逻辑。

## 5. 后续实现清单

- 项目删除时的数据级联策略。
- scan artifact 和 code_chunks retention 任务。
- audit log 保留期与导出策略。
- release evidence 真实归档命令，在人工 dry-run 审核后启用。
- 敏感文件类型扫描和入库前阻断。
