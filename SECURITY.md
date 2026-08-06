# Security Policy

状态：根目录安全入口。当前阻断风险见 `docs/aios/truth/project_state.yaml`；专项边界见 `docs/SECURITY_BOUNDARY.md`、`docs/THREAT_MODEL.md`、`docs/RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md`。

## 1. Report Security Issues

Do not open a public issue for security vulnerabilities.

Report privately to the project owner first:

```text
GitHub owner: LJunP
Project: SourceLens
Security contact: private channel with the owner
```

Until a private contact channel is formally published, keep security findings out of public issues and pull requests.

## 2. What Counts as Security

Security issues include:

- Secret, token, private key, `.env`, webhook secret, GitHub App credential exposure.
- SSRF or unsafe repository clone URL handling.
- Path traversal or artifact download outside allowed project boundaries.
- Raw artifact, raw prompt, raw LLM response, Agent task input/output, or tool call result leakage.
- Sandbox escape, unsafe shell/Docker command execution, or command injection.
- GitHub App installation, webhook signature, PR permission, or token misuse.
- Release evidence forgery, stale authority misuse, or verifier bypass.
- Cross-project scan, artifact, code_chunk, audit log, or AutoRepair data contamination.

## 3. Immediate Handling

If a secret is exposed:

1. Stop using the exposed credential.
2. Rotate the credential.
3. Remove it from tracked files and generated artifacts.
4. Check `release-evidence/`, `.sourcelens-runtime/`, logs, screenshots, and copied reports.
5. Record the incident in `docs/OBSERVABILITY_AND_INCIDENTS.md` if impact is material.

## 4. Security Review Rules

Security-impacting changes require the `Security Agent`, `CTO Agent` and an independent `Quality & Evaluation Agent` gate, following:

- `docs/SECURITY_BOUNDARY.md`
- `docs/THREAT_MODEL.md`
- `docs/RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md`
- `docs/DATA_GOVERNANCE.md`
- `docs/COMPLIANCE_AND_PRIVACY.md`

Required checks depend on the change, but security boundary changes normally require:

```bash
make security-regression-check
make api-design-check
make code-map-check
```

## 5. Public Disclosure

Do not disclose details publicly until:

- The issue is reproduced.
- The impact is understood.
- A fix or mitigation exists.
- The owner approves disclosure.
