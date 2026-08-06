# SourceLens Threat Model

> AIOS v2.3 状态：`SUPPORTING THREAT INPUT`。旧 P10 归属和岗位别名已失效；当前高风险执行边界由 Security Agent 依据 `aios/MASTER_EXECUTION_PROTOCOL.md` 重新分配。

状态：任务级威胁输入；当前阻断风险和责任分配以 AIOS 权威栈为准。

## 1. 核心资产

| 资产 | 风险 |
| --- | --- |
| 本地仓库副本 | 敏感文件、路径逃逸、磁盘膨胀 |
| scan artifacts | raw source、报告证据、误导性引用 |
| code_chunks / embeddings | 数据泄漏、跨项目污染、证据漂移 |
| LLM prompt/response | prompt injection、secret 泄漏、幻觉 |
| Agent tool calls | 越权工具、危险命令、审计缺失 |
| GitHub App/token | 私有仓库、PR 权限、webhook 伪造 |
| release evidence | 伪造 marker、过期 authority、误放行 |

## 2. 主要威胁

| ID | 威胁 | 防护 |
| --- | --- | --- |
| TM-SSRF-001 | clone URL 指向内网或本机敏感地址 | URL allow/deny、scheme 校验、网络边界 |
| TM-PATH-001 | artifact 或 repo path 路径逃逸 | canonical path、base dir 校验 |
| TM-RAW-001 | raw payload 在 UI、copy、download 中泄漏 secret | display redaction、raw access policy、audit receipt |
| TM-LLM-001 | prompt injection 诱导输出 secret 或错误操作 | prompt guard、tool boundary、LLM safety eval |
| TM-SANDBOX-001 | shell/Docker 命令越权 | command validator、sandbox drill、least privilege |
| TM-GITHUB-001 | webhook/installation/token 被伪造或滥用 | signature、installation binding、audit |
| TM-EVIDENCE-001 | release marker 被伪造或旧包冒充 authority | verifier、schema、current authority 记录 |
| TM-DATA-001 | code_chunks 或 artifacts 跨项目污染 | project/scan binding、query filters、tests |

## 3. 安全门禁

涉及以下能力必须触发 `奥特曼 / Security Engineer`：

- repo clone、file access、artifact preview/download。
- raw copy/export。
- LLM prompt、provider、tool use。
- sandbox、Docker、shell。
- GitHub App、webhook、PR。
- release verifier、安全回归。
- 数据删除、归档、备份恢复。

## 4. 关闭威胁的要求

- 有代码边界或配置边界。
- 有测试、smoke、drill 或 verifier。
- 有审计或错误追踪。
- 文档同步到 `SECURITY_BOUNDARY.md`、`DATA_GOVERNANCE.md` 或 raw access policy。
