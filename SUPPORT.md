# Support

状态：根目录支持入口。本文用于开发者、新 Codex、子 agent、未来用户快速定位问题。

## 1. Start Here

| Problem | First File |
| --- | --- |
| Cannot understand project status | `docs/aios/truth/project_state.yaml`, then `CHAIRMAN_BRIEFING.md` |
| Need to contribute or run a task | `CONTRIBUTING.md` |
| Local startup issue | `README.md` and `docs/OPERATIONS_RUNBOOK.md` |
| Backend/API issue | `docs/API_DESIGN.md` |
| Database issue | `docs/DATABASE_DESIGN.md` |
| Security issue | `SECURITY.md` |
| Release evidence issue | `docs/RELEASE_PROCESS.md` |
| Agent/team process issue | `docs/TEAM_OPERATING_MODEL.md` |

## 2. Common Local Checks

```bash
make up-infra
make analyzer
make backend
make frontend
make code-map-check
make api-design-check
```

## 3. Before Asking for Help

Collect:

- Exact command.
- Full error message.
- Current URL or API path if applicable.
- Whether backend is healthy at `http://localhost:8080`.
- Whether MySQL/Redis are running.
- Relevant `requestId` if the UI shows one.

## 4. Security

Do not paste secrets, private keys, `.env`, GitHub App private keys, webhook secrets, LLM keys, raw artifact contents, or private repository code into public issues.

Follow `SECURITY.md`.
