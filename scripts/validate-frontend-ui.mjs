#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const cssPath = path.join(rootDir, 'web-console/src/styles/app.css')
const dashboardPath = path.join(rootDir, 'web-console/src/pages/Dashboard.tsx')
const projectsPath = path.join(rootDir, 'web-console/src/pages/Projects.tsx')
const executionTasksPath = path.join(rootDir, 'web-console/src/pages/ExecutionTasks.tsx')
const artifactsPath = path.join(rootDir, 'web-console/src/pages/Artifacts.tsx')
const auditLogsPath = path.join(rootDir, 'web-console/src/pages/AuditLogs.tsx')
const auditLogsPagePath = path.join(rootDir, 'web-console/src/pages/AuditLogsPage.tsx')
const projectDetailPath = path.join(rootDir, 'web-console/src/pages/ProjectDetail.tsx')
const projectApiPath = path.join(rootDir, 'web-console/src/api/project.ts')
const artifactApiPath = path.join(rootDir, 'web-console/src/api/artifact.ts')
const scanTaskDetailPath = path.join(rootDir, 'web-console/src/pages/ScanTaskDetail.tsx')
const agentChatPath = path.join(rootDir, 'web-console/src/pages/AgentChat.tsx')
const agentToolCallPath = path.join(rootDir, 'web-console/src/components/AgentToolCall.tsx')
const dependencyGraphPath = path.join(rootDir, 'web-console/src/pages/DependencyGraph.tsx')
const modelConfigPath = path.join(rootDir, 'web-console/src/pages/ModelConfig.tsx')
const loginPath = path.join(rootDir, 'web-console/src/pages/Login.tsx')
const registerPath = path.join(rootDir, 'web-console/src/pages/Register.tsx')
const agentTasksPath = path.join(rootDir, 'web-console/src/pages/AgentTasks.tsx')
const autoRepairApiPath = path.join(rootDir, 'web-console/src/api/autoRepair.ts')
const autoRepairRequestPath = path.join(rootDir, 'backend-spring/src/main/java/com/sourcelens/module/autorepair/dto/AutoRepairRequest.java')
const autoRepairServicePath = path.join(rootDir, 'backend-spring/src/main/java/com/sourcelens/module/autorepair/service/AutoRepairService.java')
const codeLocationHintParserPath = path.join(rootDir, 'backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeLocationHintParser.java')
const scanTaskGovernanceTimelineServicePath = path.join(rootDir, 'backend-spring/src/main/java/com/sourcelens/module/scantask/service/ScanTaskGovernanceTimelineService.java')
const scanGovernanceTimelineApiPath = path.join(rootDir, 'web-console/src/api/scanGovernanceTimeline.ts')
const autoRepairsPath = path.join(rootDir, 'web-console/src/pages/AutoRepairs.tsx')
const autoRepairsPagePath = path.join(rootDir, 'web-console/src/pages/AutoRepairsPage.tsx')
const ciDiagnosticsPath = path.join(rootDir, 'web-console/src/pages/CiDiagnostics.tsx')
const ciDiagnosticsPagePath = path.join(rootDir, 'web-console/src/pages/CiDiagnosticsPage.tsx')
const prReviewsPath = path.join(rootDir, 'web-console/src/pages/PrReviews.tsx')
const issueDecompositionPath = path.join(rootDir, 'web-console/src/pages/IssueDecomposition.tsx')
const taskTimelinePath = path.join(rootDir, 'web-console/src/components/TaskTimeline.tsx')
const displayRedactionPath = path.join(rootDir, 'web-console/src/utils/displayRedaction.ts')
const appPath = path.join(rootDir, 'web-console/src/App.tsx')
const appLayoutPath = path.join(rootDir, 'web-console/src/components/AppLayout.tsx')
const actionButtonPath = path.join(rootDir, 'web-console/src/components/ui/ActionButton.tsx')
const iconActionButtonPath = path.join(rootDir, 'web-console/src/components/ui/IconActionButton.tsx')
const stateBlockPath = path.join(rootDir, 'web-console/src/components/ui/StateBlock.tsx')
const selectableTableRowPath = path.join(rootDir, 'web-console/src/components/ui/selectableTableRow.ts')
const packageJsonPath = path.join(rootDir, 'web-console/package.json')
const viteConfigPath = path.join(rootDir, 'web-console/vite.config.ts')
const makefilePath = path.join(rootDir, 'Makefile')
const releaseEvidencePath = path.join(rootDir, 'scripts/release-evidence.sh')
const releaseEvidenceVerifierPath = path.join(rootDir, 'scripts/verify-release-evidence.sh')
const securityRegressionPath = path.join(rootDir, 'scripts/security-regression-check.sh')
const publicRepoAnalysisSmokePath = path.join(rootDir, 'scripts/public-repo-analysis-smoke.sh')
const patchReadySmokeConfigPath = path.join(rootDir, 'web-console/playwright.patch-ready.config.ts')
const patchReadySmokeSpecPath = path.join(rootDir, 'web-console/tests/patch-ready-smoke.spec.ts')
const publicRepoUiSmokeConfigPath = path.join(rootDir, 'web-console/playwright.public-repo-ui.config.ts')
const publicRepoUiSmokeSpecPath = path.join(rootDir, 'web-console/tests/public-repo-ui-smoke.spec.ts')
const dashboardNextActionSmokeConfigPath = path.join(rootDir, 'web-console/playwright.dashboard-next-action.config.ts')
const dashboardNextActionSmokeSpecPath = path.join(rootDir, 'web-console/tests/dashboard-next-action-smoke.spec.ts')
const reportEvidenceDrawerSmokeConfigPath = path.join(rootDir, 'web-console/playwright.report-evidence-drawer.config.ts')
const reportEvidenceQaCitationSmokeConfigPath = path.join(rootDir, 'web-console/playwright.report-evidence-qa-citation.config.ts')
const reportEvidenceDrawerSmokeSpecPath = path.join(rootDir, 'web-console/tests/report-evidence-drawer-smoke.spec.ts')
const scanGovernanceTimelineSmokeConfigPath = path.join(rootDir, 'web-console/playwright.scan-governance-timeline.config.ts')
const scanGovernanceTimelineSmokeSpecPath = path.join(rootDir, 'web-console/tests/scan-governance-timeline-smoke.spec.ts')
const appShellUiSmokeConfigPath = path.join(rootDir, 'web-console/playwright.app-shell-ui.config.ts')
const appShellUiSmokeSpecPath = path.join(rootDir, 'web-console/tests/app-shell-ui-smoke.spec.ts')
const projectDetailFirstViewportSmokeConfigPath = path.join(rootDir, 'web-console/playwright.project-detail-first-viewport.config.ts')
const projectDetailFirstViewportSmokeSpecPath = path.join(rootDir, 'web-console/tests/project-detail-first-viewport-smoke.spec.ts')
const scanTaskDetailFirstViewportSmokeConfigPath = path.join(rootDir, 'web-console/playwright.scan-task-detail-first-viewport.config.ts')
const scanTaskDetailFirstViewportSmokeSpecPath = path.join(rootDir, 'web-console/tests/scan-task-detail-first-viewport-smoke.spec.ts')
const agentChatFirstViewportSmokeConfigPath = path.join(rootDir, 'web-console/playwright.agent-chat-first-viewport.config.ts')
const agentChatFirstViewportSmokeSpecPath = path.join(rootDir, 'web-console/tests/agent-chat-first-viewport-smoke.spec.ts')
const agentChatClosureRailSmokeConfigPath = path.join(rootDir, 'web-console/playwright.agent-chat-closure-rail.config.ts')
const agentChatClosureRailSmokeSpecPath = path.join(rootDir, 'web-console/tests/agent-chat-closure-rail-smoke.spec.ts')
const agentChatAuditSmokeSpecPath = path.join(rootDir, 'web-console/tests/agent-chat-audit-smoke.spec.ts')
const agentTasksDetailSelectionSmokeConfigPath = path.join(rootDir, 'web-console/playwright.agent-tasks-detail-selection.config.ts')
const agentTasksDetailSelectionSmokeSpecPath = path.join(rootDir, 'web-console/tests/agent-tasks-detail-selection-smoke.spec.ts')
const executionTasksDetailSelectionSmokeConfigPath = path.join(rootDir, 'web-console/playwright.execution-tasks-detail-selection.config.ts')
const executionTasksDetailSelectionSmokeSpecPath = path.join(rootDir, 'web-console/tests/execution-tasks-detail-selection-smoke.spec.ts')
const artifactsDetailSelectionSmokeConfigPath = path.join(rootDir, 'web-console/playwright.artifacts-detail-selection.config.ts')
const artifactsDetailSelectionSmokeSpecPath = path.join(rootDir, 'web-console/tests/artifacts-detail-selection-smoke.spec.ts')
const p9RecoverableErrorBatch3SmokeConfigPath = path.join(rootDir, 'web-console/playwright.p9-main-path-recoverable-error-states-batch3.config.ts')
const p9RecoverableErrorBatch3SmokeSpecPath = path.join(rootDir, 'web-console/tests/p9-main-path-recoverable-error-states-batch3.spec.ts')
const p9RecoverableErrorBatch4ASmokeConfigPath = path.join(rootDir, 'web-console/playwright.p9-main-path-recoverable-error-states-batch4a.config.ts')
const p9RecoverableErrorBatch4ASmokeSpecPath = path.join(rootDir, 'web-console/tests/p9-main-path-recoverable-error-states-batch4a.spec.ts')
const p9RecoverableErrorBatch4BSmokeConfigPath = path.join(rootDir, 'web-console/playwright.p9-main-path-recoverable-error-states-batch4b.config.ts')
const p9RecoverableErrorBatch4BSmokeSpecPath = path.join(rootDir, 'web-console/tests/p9-main-path-recoverable-error-states-batch4b.spec.ts')
const modelConfigRecoverableSmokeConfigPath = path.join(rootDir, 'web-console/playwright.model-config-recoverable.config.ts')
const modelConfigRecoverableSmokeSpecPath = path.join(rootDir, 'web-console/tests/model-config-recoverable-smoke.spec.ts')
const auditLogsDetailSelectionSmokeConfigPath = path.join(rootDir, 'web-console/playwright.audit-logs-detail-selection.config.ts')
const auditLogsDetailSelectionSmokeSpecPath = path.join(rootDir, 'web-console/tests/audit-logs-detail-selection-smoke.spec.ts')
const ciDiagnosticsDetailSelectionSmokeConfigPath = path.join(rootDir, 'web-console/playwright.ci-diagnostics-detail-selection.config.ts')
const ciDiagnosticsDetailSelectionSmokeSpecPath = path.join(rootDir, 'web-console/tests/ci-diagnostics-detail-selection-smoke.spec.ts')
const prReviewsDetailSelectionSmokeConfigPath = path.join(rootDir, 'web-console/playwright.pr-reviews-detail-selection.config.ts')
const prReviewsDetailSelectionSmokeSpecPath = path.join(rootDir, 'web-console/tests/pr-reviews-detail-selection-smoke.spec.ts')
const issueDecompositionDetailSelectionSmokeConfigPath = path.join(rootDir, 'web-console/playwright.issue-decomposition-detail-selection.config.ts')
const issueDecompositionDetailSelectionSmokeSpecPath = path.join(rootDir, 'web-console/tests/issue-decomposition-detail-selection-smoke.spec.ts')
const reportAutoRepairCandidateSmokeConfigPath = path.join(rootDir, 'web-console/playwright.report-autorepair-candidate.config.ts')
const reportAutoRepairCandidateSmokeSpecPath = path.join(rootDir, 'web-console/tests/report-autorepair-candidate-smoke.spec.ts')
const projectQaLowConfidenceSmokeConfigPath = path.join(rootDir, 'web-console/playwright.project-qa-low-confidence.config.ts')
const projectQaLowConfidenceSmokeSpecPath = path.join(rootDir, 'web-console/tests/project-qa-low-confidence-smoke.spec.ts')
const projectQaRecoverableSmokeConfigPath = path.join(rootDir, 'web-console/playwright.project-qa-recoverable.config.ts')
const projectQaRecoverableSmokeSpecPath = path.join(rootDir, 'web-console/tests/project-qa-recoverable-smoke.spec.ts')
const projectQaAutoRepairCandidateSmokeConfigPath = path.join(rootDir, 'web-console/playwright.project-qa-autorepair-candidate.config.ts')
const projectQaAutoRepairCandidateSmokeSpecPath = path.join(rootDir, 'web-console/tests/project-qa-autorepair-candidate-smoke.spec.ts')

const failures = []

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function sourceFilesUnder(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      return sourceFilesUnder(entryPath)
    }
    if (entry.isFile() && /\.(tsx|ts|css)$/.test(entry.name)) {
      return [entryPath]
    }
    return []
  })
}

function fail(message) {
  failures.push(message)
}

function requirePattern(source, pattern, message) {
  if (!pattern.test(source)) {
    fail(message)
  }
}

function rejectPattern(source, pattern, message) {
  if (pattern.test(source)) {
    fail(message)
  }
}

function blockForSelector(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm'))
  return match?.[1] ?? ''
}

function selectorBlocks(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(match => ({
    selectors: match[1].split(',').map(selector => selector.trim()).filter(Boolean),
    declarations: match[2],
  }))
}

function requireSelectorDeclaration(blocks, selector, declarationPattern, message) {
  const matchedBlock = blocks.find(block => block.selectors.includes(selector))
  if (!matchedBlock || !declarationPattern.test(matchedBlock.declarations)) {
    fail(message)
  }
}

function hasDeclaration(declarations, property, valuePattern) {
  return new RegExp(`${property}\\s*:\\s*${valuePattern.source}(?:\\s*!important)?\\s*;`, 'i').test(declarations)
}

function parseRootVariables(css) {
  const rootBlock = blockForSelector(css, ':root')
  const variables = new Map()
  for (const match of rootBlock.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    variables.set(match[1], match[2].trim())
  }
  return variables
}

function hexToRgb(hex) {
  const normalized = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    throw new Error(`Unsupported color format: ${hex}`)
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function relativeLuminance({ r, g, b }) {
  const channel = (value) => {
    const normalized = value / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(colorA, colorB) {
  const lumA = relativeLuminance(hexToRgb(colorA))
  const lumB = relativeLuminance(hexToRgb(colorB))
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

function requireContrast(name, foreground, background, minRatio) {
  const ratio = contrastRatio(foreground, background)
  if (ratio < minRatio) {
    fail(`${name} contrast ${ratio.toFixed(2)} is below ${minRatio}: ${foreground} on ${background}`)
  }
}

const css = readFile(cssPath)
const dashboard = readFile(dashboardPath)
const projects = readFile(projectsPath)
const executionTasks = readFile(executionTasksPath)
const artifacts = readFile(artifactsPath)
const auditLogs = readFile(auditLogsPath)
const auditLogsPage = readFile(auditLogsPagePath)
const projectDetail = readFile(projectDetailPath)
const projectApi = readFile(projectApiPath)
const artifactApi = readFile(artifactApiPath)
const scanTaskDetail = readFile(scanTaskDetailPath)
const agentChat = readFile(agentChatPath)
const agentToolCall = readFile(agentToolCallPath)
const dependencyGraph = readFile(dependencyGraphPath)
const modelConfig = readFile(modelConfigPath)
const login = readFile(loginPath)
const register = readFile(registerPath)
const agentTasks = readFile(agentTasksPath)
const autoRepairApi = readFile(autoRepairApiPath)
const autoRepairRequest = readFile(autoRepairRequestPath)
const autoRepairService = readFile(autoRepairServicePath)
const codeLocationHintParser = readFile(codeLocationHintParserPath)
const scanTaskGovernanceTimelineService = readFile(scanTaskGovernanceTimelineServicePath)
const scanGovernanceTimelineApi = readFile(scanGovernanceTimelineApiPath)
const autoRepairs = readFile(autoRepairsPath)
const autoRepairsPage = readFile(autoRepairsPagePath)
const ciDiagnostics = readFile(ciDiagnosticsPath)
const ciDiagnosticsPage = readFile(ciDiagnosticsPagePath)
const prReviews = readFile(prReviewsPath)
const issueDecomposition = readFile(issueDecompositionPath)
const taskTimeline = readFile(taskTimelinePath)
const displayRedaction = readFile(displayRedactionPath)
const app = readFile(appPath)
const appLayout = readFile(appLayoutPath)
const actionButton = readFile(actionButtonPath)
const iconActionButton = readFile(iconActionButtonPath)
const stateBlock = readFile(stateBlockPath)
const selectableTableRow = readFile(selectableTableRowPath)

requirePattern(
  displayRedaction,
  /export const REDACTED_DISPLAY_VALUE = '\[REDACTED\]'[\s\S]*?const SENSITIVE_DISPLAY_KEYS = \[[\s\S]*?'authorization'[\s\S]*?'bearer'[\s\S]*?'token'[\s\S]*?'apiKey'[\s\S]*?'apikey'[\s\S]*?'api_key'[\s\S]*?'secret'[\s\S]*?'password'[\s\S]*?'privateKey'[\s\S]*?'private_key'[\s\S]*?'accessToken'[\s\S]*?'access_token'[\s\S]*?'refreshToken'[\s\S]*?'refresh_token'[\s\S]*?\]/,
  'displayRedaction shared utility must centralize the common display secret key list.'
)
requirePattern(
  displayRedaction,
  /AUTHORIZATION_BEARER_PATTERN[\s\S]*?BEARER_PATTERN[\s\S]*?SENSITIVE_QUOTED_ASSIGNMENT_PATTERN[\s\S]*?SENSITIVE_ASSIGNMENT_PATTERN[\s\S]*?OPENAI_KEY_PATTERN[\s\S]*?JWT_LIKE_PATTERN[\s\S]*?export function redactSensitiveText\(value: string\): string[\s\S]*?AUTHORIZATION_BEARER_PATTERN[\s\S]*?BEARER_PATTERN[\s\S]*?SENSITIVE_QUOTED_ASSIGNMENT_PATTERN[\s\S]*?SENSITIVE_ASSIGNMENT_PATTERN[\s\S]*?OPENAI_KEY_PATTERN[\s\S]*?JWT_LIKE_PATTERN/s,
  'displayRedaction shared utility must redact Authorization/Bearer, key assignments, sk-* and JWT-like text.'
)
requirePattern(
  displayRedaction,
  /export function redactDisplayValue\(value: unknown, key\?: string, seen = new WeakSet<object>\(\)\): unknown[\s\S]*?isSensitiveDisplayKey\(key\)[\s\S]*?redactSensitiveText\(value\)[\s\S]*?Array\.isArray\(value\)[\s\S]*?seen\.has\(value\)[\s\S]*?Object\.entries\(value as Record<string, unknown>\)\.map/,
  'displayRedaction shared utility must recursively redact structured display payloads and guard circular data.'
)
requirePattern(
  displayRedaction,
  /export function stringifyRedactedPayload\(value: unknown, space = 2\): string[\s\S]*?JSON\.stringify\(redactDisplayValue\(value\), null, space\)[\s\S]*?export function redactJsonOrText\(value: string \| null \| undefined, emptyFallback = ''\): string[\s\S]*?JSON\.parse\(value\)[\s\S]*?redactSensitiveText\(value\)[\s\S]*?export function redactAndTruncateText/,
  'displayRedaction shared utility must expose JSON-or-text formatting and truncation helpers.'
)
const packageJson = readFile(packageJsonPath)
const viteConfig = readFile(viteConfigPath)
const makefile = readFile(makefilePath)
const releaseEvidenceScript = readFile(releaseEvidencePath)
const releaseEvidenceVerifierScript = readFile(releaseEvidenceVerifierPath)
const securityRegressionScript = readFile(securityRegressionPath)
const publicRepoAnalysisSmokeScript = readFile(publicRepoAnalysisSmokePath)
const patchReadySmokeConfig = readFile(patchReadySmokeConfigPath)
const patchReadySmokeSpec = readFile(patchReadySmokeSpecPath)
const publicRepoUiSmokeConfig = readFile(publicRepoUiSmokeConfigPath)
const publicRepoUiSmokeSpec = readFile(publicRepoUiSmokeSpecPath)
const dashboardNextActionSmokeConfig = readFile(dashboardNextActionSmokeConfigPath)
const dashboardNextActionSmokeSpec = readFile(dashboardNextActionSmokeSpecPath)
const reportEvidenceDrawerSmokeConfig = readFile(reportEvidenceDrawerSmokeConfigPath)
const reportEvidenceQaCitationSmokeConfig = readFile(reportEvidenceQaCitationSmokeConfigPath)
const reportEvidenceDrawerSmokeSpec = readFile(reportEvidenceDrawerSmokeSpecPath)
const scanGovernanceTimelineSmokeConfig = readFile(scanGovernanceTimelineSmokeConfigPath)
const scanGovernanceTimelineSmokeSpec = readFile(scanGovernanceTimelineSmokeSpecPath)
const appShellUiSmokeConfig = readFile(appShellUiSmokeConfigPath)
const appShellUiSmokeSpec = readFile(appShellUiSmokeSpecPath)
const projectDetailFirstViewportSmokeConfig = readFile(projectDetailFirstViewportSmokeConfigPath)
const projectDetailFirstViewportSmokeSpec = readFile(projectDetailFirstViewportSmokeSpecPath)
const scanTaskDetailFirstViewportSmokeConfig = readFile(scanTaskDetailFirstViewportSmokeConfigPath)
const scanTaskDetailFirstViewportSmokeSpec = readFile(scanTaskDetailFirstViewportSmokeSpecPath)
const agentChatFirstViewportSmokeConfig = readFile(agentChatFirstViewportSmokeConfigPath)
const agentChatFirstViewportSmokeSpec = readFile(agentChatFirstViewportSmokeSpecPath)
const agentChatClosureRailSmokeConfig = readFile(agentChatClosureRailSmokeConfigPath)
const agentChatClosureRailSmokeSpec = readFile(agentChatClosureRailSmokeSpecPath)
const agentChatAuditSmokeSpec = readFile(agentChatAuditSmokeSpecPath)
const agentTasksDetailSelectionSmokeConfig = readFile(agentTasksDetailSelectionSmokeConfigPath)
const agentTasksDetailSelectionSmokeSpec = readFile(agentTasksDetailSelectionSmokeSpecPath)
const executionTasksDetailSelectionSmokeConfig = readFile(executionTasksDetailSelectionSmokeConfigPath)
const executionTasksDetailSelectionSmokeSpec = readFile(executionTasksDetailSelectionSmokeSpecPath)
const artifactsDetailSelectionSmokeConfig = readFile(artifactsDetailSelectionSmokeConfigPath)
const artifactsDetailSelectionSmokeSpec = readFile(artifactsDetailSelectionSmokeSpecPath)
const p9RecoverableErrorBatch3SmokeConfig = readFile(p9RecoverableErrorBatch3SmokeConfigPath)
const p9RecoverableErrorBatch3SmokeSpec = readFile(p9RecoverableErrorBatch3SmokeSpecPath)
const p9RecoverableErrorBatch4ASmokeConfig = readFile(p9RecoverableErrorBatch4ASmokeConfigPath)
const p9RecoverableErrorBatch4ASmokeSpec = readFile(p9RecoverableErrorBatch4ASmokeSpecPath)
const p9RecoverableErrorBatch4BSmokeConfig = readFile(p9RecoverableErrorBatch4BSmokeConfigPath)
const p9RecoverableErrorBatch4BSmokeSpec = readFile(p9RecoverableErrorBatch4BSmokeSpecPath)
const modelConfigRecoverableSmokeConfig = readFile(modelConfigRecoverableSmokeConfigPath)
const modelConfigRecoverableSmokeSpec = readFile(modelConfigRecoverableSmokeSpecPath)
const auditLogsDetailSelectionSmokeConfig = readFile(auditLogsDetailSelectionSmokeConfigPath)
const auditLogsDetailSelectionSmokeSpec = readFile(auditLogsDetailSelectionSmokeSpecPath)
const ciDiagnosticsDetailSelectionSmokeConfig = readFile(ciDiagnosticsDetailSelectionSmokeConfigPath)
const ciDiagnosticsDetailSelectionSmokeSpec = readFile(ciDiagnosticsDetailSelectionSmokeSpecPath)
const prReviewsDetailSelectionSmokeConfig = readFile(prReviewsDetailSelectionSmokeConfigPath)
const prReviewsDetailSelectionSmokeSpec = readFile(prReviewsDetailSelectionSmokeSpecPath)
const issueDecompositionDetailSelectionSmokeConfig = readFile(issueDecompositionDetailSelectionSmokeConfigPath)
const issueDecompositionDetailSelectionSmokeSpec = readFile(issueDecompositionDetailSelectionSmokeSpecPath)
const reportAutoRepairCandidateSmokeConfig = readFile(reportAutoRepairCandidateSmokeConfigPath)
const reportAutoRepairCandidateSmokeSpec = readFile(reportAutoRepairCandidateSmokeSpecPath)
const projectQaLowConfidenceSmokeConfig = readFile(projectQaLowConfidenceSmokeConfigPath)
const projectQaLowConfidenceSmokeSpec = readFile(projectQaLowConfidenceSmokeSpecPath)
const projectQaRecoverableSmokeConfig = readFile(projectQaRecoverableSmokeConfigPath)
const projectQaRecoverableSmokeSpec = readFile(projectQaRecoverableSmokeSpecPath)
const projectQaAutoRepairCandidateSmokeConfig = readFile(projectQaAutoRepairCandidateSmokeConfigPath)
const projectQaAutoRepairCandidateSmokeSpec = readFile(projectQaAutoRepairCandidateSmokeSpecPath)
const blocks = selectorBlocks(css)
const frontendStateSources = [
  ...sourceFilesUnder(path.join(rootDir, 'web-console/src/pages')),
  ...sourceFilesUnder(path.join(rootDir, 'web-console/src/components')),
]

const variables = parseRootVariables(css)
const primary = variables.get('sl-primary')
const primaryDark = variables.get('sl-primary-dark')
const primaryContrast = variables.get('sl-primary-contrast')
const disabledBg = variables.get('sl-disabled-bg')
if (!primary || !primaryDark || !primaryContrast || !disabledBg) {
  fail('Missing --sl-primary, --sl-primary-dark, --sl-primary-contrast or --sl-disabled-bg in :root')
} else {
  requireContrast('Primary button', primaryContrast, primary, 4.5)
  requireContrast('Primary button hover', primaryContrast, primaryDark, 4.5)
  requireContrast('Disabled primary button', variables.get('sl-muted') || '#637083', disabledBg, 4.5)
}

const primaryButtonSelectors = [
  '.sl-app-shell .ant-btn.ant-btn-primary:not(:disabled):not(.ant-btn-disabled)',
  '.sl-app-shell .ant-btn.ant-btn-color-primary.ant-btn-variant-solid:not(:disabled):not(.ant-btn-disabled)',
  '.sl-dashboard-command-card .ant-btn.ant-btn-primary:not(:disabled):not(.ant-btn-disabled)',
  '.sl-dashboard-command-card .ant-btn.ant-btn-color-primary.ant-btn-variant-solid:not(:disabled):not(.ant-btn-disabled)',
]
for (const selector of primaryButtonSelectors) {
  requireSelectorDeclaration(
    blocks,
    selector,
    /color:\s*#fff\s*!important\s*;/,
    `Primary button selector must keep forced white text: ${selector}`
  )
}

requirePattern(
  css,
  /\.sl-app-shell\s+:where\(\.ant-btn\.ant-btn-primary,\s*\.ant-btn\.ant-btn-color-primary\.ant-btn-variant-solid\):not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s*\{[^}]*color:\s*#fff\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Global primary buttons must force white text and text-fill color.'
)
requirePattern(
  css,
  /\.sl-app-shell\s+:where\(\.ant-btn\.ant-btn-primary,\s*\.ant-btn\.ant-btn-color-primary\.ant-btn-variant-solid\):not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+:where\(\.ant-btn-icon,\s*\.anticon,\s*span,\s*svg\)\s*\{[^}]*color:\s*inherit\s*!important\s*;[^}]*-webkit-text-fill-color:\s*currentColor\s*!important\s*;/s,
  'Global primary button child nodes must inherit the forced contrast color.'
)
requirePattern(
  css,
  /\.sl-app-shell\s+\.ant-btn\.ant-btn-primary:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+\*,\s*\.sl-app-shell\s+\.ant-btn\.ant-btn-color-primary\.ant-btn-variant-solid:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+\*\s*\{[^}]*color:\s*#fff\s*!important\s*;[^}]*fill:\s*currentColor\s*!important\s*;[^}]*stroke:\s*currentColor\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Global primary button descendant fallback must force readable text and icon colors after page-level styles.'
)
requirePattern(
  css,
  /\.sl-dashboard-command-card\s+\.ant-btn\.ant-btn-primary:not\(:disabled\):not\(\.ant-btn-disabled\)\s+\*,\s*\.sl-dashboard-command-card\s+\.ant-btn\.ant-btn-color-primary\.ant-btn-variant-solid:not\(:disabled\):not\(\.ant-btn-disabled\)\s+\*\s*\{[^}]*color:\s*#fff\s*!important\s*;[^}]*fill:\s*currentColor\s*!important\s*;[^}]*stroke:\s*currentColor\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Dashboard command primary buttons must force readable descendant text and icon colors.'
)
requirePattern(
  css,
  /\.sl-action-button\s*\{[^}]*display:\s*inline-flex\s*;[^}]*align-items:\s*center\s*;[^}]*justify-content:\s*center\s*;[^}]*height:\s*auto\s*;[^}]*min-height:\s*32px\s*;[^}]*max-width:\s*100%\s*;[^}]*padding-block:\s*4px\s*;[^}]*white-space:\s*normal\s*;/s,
  'ActionButton must use a stable auto-height inline-flex layout so wrapped labels and icons stay aligned.'
)
requirePattern(
  css,
  /\.sl-action-button\.ant-btn-sm\s*\{[^}]*min-height:\s*28px\s*;[^}]*padding-block:\s*3px\s*;/s,
  'Small ActionButton controls must keep a compact but auto-height hitbox for wrapped labels.'
)
requirePattern(
  css,
  /\.sl-action-button-label\s*\{[^}]*color:\s*inherit\s*!important\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-align:\s*center\s*;[^}]*text-overflow:\s*clip\s*;[^}]*-webkit-text-fill-color:\s*currentColor\s*!important\s*;[^}]*white-space:\s*normal\s*;[^}]*line-height:\s*1\.25\s*;/s,
  'ActionButton labels must wrap and stay readable instead of using nowrap ellipsis.'
)
rejectPattern(
  css,
  /\.sl-action-button-label\s*\{[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s,
  'ActionButton labels must not use nowrap ellipsis because it hides critical action text.'
)
requirePattern(
  css,
  /\.sl-action-button:where\(\.ant-btn-primary,\s*\.ant-btn-color-primary\.ant-btn-variant-solid\):not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+\.sl-action-button-label,[\s\S]*?\.sl-action-button:where\(\.ant-btn-primary,\s*\.ant-btn-color-primary\.ant-btn-variant-solid\):not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+\.anticon\s*\{[^}]*color:\s*#fff\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Primary ActionButton labels and icons must force readable white text even under page-level overrides.'
)
requirePattern(
  css,
  /\.sl-action-button\.sl-action-button-primary:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s*\{[^}]*border-color:\s*var\(--sl-primary\)\s*!important\s*;[^}]*background:\s*var\(--sl-primary\)\s*!important\s*;[^}]*color:\s*#fff\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Primary ActionButton root must force readable white text and stable primary surface.'
)
requirePattern(
  css,
  /\.sl-action-button\.sl-action-button-primary:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+\*,[\s\S]*?\.sl-action-button\.sl-action-button-primary:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+:where\(\.ant-btn-icon,\s*\.anticon,\s*svg,\s*span,\s*\.sl-action-button-label\)\s*\{[^}]*color:\s*#fff\s*!important\s*;[^}]*fill:\s*currentColor\s*!important\s*;[^}]*stroke:\s*currentColor\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Primary ActionButton descendants must not inherit muted page text colors.'
)
requirePattern(
  css,
  /\.sl-action-button\[data-sl-variant='primary'\]:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s*\{[^}]*border-color:\s*var\(--sl-primary\)\s*!important\s*;[^}]*background:\s*var\(--sl-primary\)\s*!important\s*;[^}]*color:\s*#fff\s*!important\s*;[^}]*opacity:\s*1\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Primary ActionButton data variant root must force a readable primary surface and white text.'
)
requirePattern(
  css,
  /\.sl-action-button\[data-sl-variant='primary'\]:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+:where\(\.sl-action-button-label,\s*\.sl-action-button-label-primary,\s*\.sl-action-button-icon-primary,\s*\.ant-btn-icon,\s*\.anticon,\s*svg,\s*span\)\s*\{[^}]*color:\s*#fff\s*!important\s*;[^}]*fill:\s*currentColor\s*!important\s*;[^}]*stroke:\s*currentColor\s*!important\s*;[^}]*opacity:\s*1\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Primary ActionButton data variant children must force white text and icon color.'
)
requirePattern(
  css,
  /\.sl-dashboard-command-card\s+\.sl-action-button\[data-sl-variant='primary'\]:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\),[\s\S]*?\.sl-dashboard-command-card\s+\.sl-action-button\[data-sl-variant='primary'\]:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+:where\(\.sl-action-button-label,\s*\.sl-action-button-label-primary,\s*\.sl-action-button-icon-primary,\s*\.ant-btn-icon,\s*\.anticon,\s*svg,\s*span\)\s*\{[^}]*color:\s*#fff\s*!important\s*;[^}]*fill:\s*currentColor\s*!important\s*;[^}]*stroke:\s*currentColor\s*!important\s*;[^}]*opacity:\s*1\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Dashboard command primary ActionButton must not inherit muted card text colors.'
)
requirePattern(
  css,
  /\.sl-action-button\.sl-action-button-primary:disabled,[\s\S]*?\.sl-action-button\.sl-action-button-primary\[disabled\]\s*\{[^}]*border-color:\s*var\(--sl-border-strong\)\s*!important\s*;[^}]*background:\s*var\(--sl-disabled-bg\)\s*!important\s*;[^}]*color:\s*var\(--sl-muted\)\s*!important\s*;[^}]*box-shadow:\s*none\s*!important\s*;[^}]*-webkit-text-fill-color:\s*var\(--sl-muted\)\s*!important\s*;/s,
  'Disabled primary ActionButton must use a neutral disabled surface instead of blue background with muted text.'
)
requirePattern(
  css,
  /\.sl-action-button\.sl-action-button-primary:disabled\s+\*,[\s\S]*?\.sl-action-button\.sl-action-button-primary\[disabled\]\s+:where\(\.ant-btn-icon,\s*\.anticon,\s*svg,\s*span,\s*\.sl-action-button-label\)\s*\{[^}]*color:\s*var\(--sl-muted\)\s*!important\s*;[^}]*fill:\s*currentColor\s*!important\s*;[^}]*stroke:\s*currentColor\s*!important\s*;[^}]*-webkit-text-fill-color:\s*var\(--sl-muted\)\s*!important\s*;/s,
  'Disabled primary ActionButton descendants must inherit the neutral disabled text color.'
)
requirePattern(
  actionButton,
  /const\s+isPrimary\s*=\s*props\.type\s*===\s*'primary'[\s\S]*?const\s+isDisabledPrimary\s*=\s*isPrimary\s*&&\s*props\.disabled[\s\S]*?const\s+isReadablePrimary\s*=\s*isPrimary\s*&&\s*!props\.disabled/s,
  'ActionButton must detect enabled primary buttons for a component-level contrast fallback.'
)
requirePattern(
  actionButton,
  /const\s+PRIMARY_SURFACE\s*=\s*'var\(--sl-primary\)'[\s\S]*?const\s+PRIMARY_CONTRAST\s*=\s*'#ffffff'[\s\S]*?const\s+DISABLED_SURFACE\s*=\s*'var\(--sl-disabled-bg\)'[\s\S]*?const\s+DISABLED_BORDER\s*=\s*'var\(--sl-border-strong\)'[\s\S]*?const\s+DISABLED_TEXT\s*=\s*'var\(--sl-muted\)'/s,
  'ActionButton primary contrast fallback must use a literal white value so AntD/runtime style ordering cannot downgrade readable text.'
)
requirePattern(
  actionButton,
  /const\s+buttonStyle:[\s\S]*?background:\s*PRIMARY_SURFACE[\s\S]*?borderColor:\s*PRIMARY_SURFACE[\s\S]*?color:\s*PRIMARY_CONTRAST[\s\S]*?WebkitTextFillColor:\s*PRIMARY_CONTRAST/s,
  'ActionButton primary root must include an inline high-contrast text/text-fill fallback.'
)
requirePattern(
  actionButton,
  /isDisabledPrimary[\s\S]*?background:\s*DISABLED_SURFACE[\s\S]*?borderColor:\s*DISABLED_BORDER[\s\S]*?color:\s*DISABLED_TEXT[\s\S]*?WebkitTextFillColor:\s*DISABLED_TEXT/s,
  'ActionButton disabled primary root must use a neutral inline fallback instead of blue background with muted text.'
)
requirePattern(
  actionButton,
  /const\s+labelStyle:[\s\S]*?color:\s*PRIMARY_CONTRAST[\s\S]*?WebkitTextFillColor:\s*PRIMARY_CONTRAST[\s\S]*?isDisabledPrimary[\s\S]*?color:\s*DISABLED_TEXT[\s\S]*?WebkitTextFillColor:\s*DISABLED_TEXT/s,
  'ActionButton primary label must include an inline high-contrast text/text-fill fallback.'
)
requirePattern(
  actionButton,
  /const\s+readablePrimaryIconStyle:[\s\S]*?color:\s*PRIMARY_CONTRAST[\s\S]*?fill:\s*'currentColor'[\s\S]*?stroke:\s*'currentColor'[\s\S]*?WebkitTextFillColor:\s*PRIMARY_CONTRAST[\s\S]*?isDisabledPrimary[\s\S]*?color:\s*DISABLED_TEXT[\s\S]*?fill:\s*'currentColor'[\s\S]*?stroke:\s*'currentColor'[\s\S]*?WebkitTextFillColor:\s*DISABLED_TEXT/s,
  'ActionButton primary icons must include an inline high-contrast icon fallback.'
)
requirePattern(
  actionButton,
  /data-sl-variant=\{variant\}[\s\S]*?style=\{buttonStyle\}/,
  'ActionButton must apply the explicit variant marker and primary contrast fallback to the Ant Button root.'
)
requirePattern(
  actionButton,
  /className=\{labelClasses\}\s+style=\{labelStyle\}/,
  'ActionButton must apply the primary contrast fallback to the visible label span.'
)
requirePattern(
  actionButton,
  /icon=\{decorativeIcon\(icon,\s*readablePrimaryIconStyle,\s*iconToneClass\)\}/,
  'ActionButton must apply the primary contrast fallback to the visible icon.'
)
requirePattern(
  css,
  /\.sl-topbar\s*\{[^}]*position:\s*relative\s*;[^}]*z-index:\s*2\s*;[^}]*flex:\s*0 0 auto\s*;[^}]*min-height:\s*78px\s*;[^}]*height:\s*auto\s*!important\s*;[^}]*padding:\s*10px 28px\s*;[^}]*line-height:\s*1\.2\s*;[^}]*overflow:\s*visible\s*;/s,
  'Topbar must use adaptive height and padding so page titles are not vertically clipped.'
)
rejectPattern(
  css,
  /\.sl-topbar\s*\{[^}]*height:\s*64px\s*;/s,
  'Topbar must not use a fixed 64px height because it clips title text under larger fonts or zoom.'
)
requirePattern(
  css,
  /\.sl-page\s*\{[^}]*min-height:\s*calc\(100vh - 78px\)\s*;/s,
  'Page content height must track the adaptive desktop topbar height.'
)
requirePattern(
  css,
  /\.sl-topbar-copy\s*\{[^}]*display:\s*grid\s*;[^}]*gap:\s*2px\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Topbar copy must not clip title or description text inside the adaptive header.'
)
requirePattern(
  css,
  /\.sl-topbar-actions\s*\{[^}]*flex:\s*0 1 auto\s*;[^}]*display:\s*flex\s*;[^}]*align-items:\s*center\s*;[^}]*justify-content:\s*flex-end\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*gap:\s*8px 12px\s*;[^}]*min-width:\s*0\s*;[^}]*max-width:\s*100%\s*;[^}]*overflow:\s*visible\s*;/s,
  'Topbar actions must wrap and stay contained so they cannot squeeze or clip the page title.'
)
requirePattern(
  css,
  /\.sl-topbar-actions > \.ant-space-item\s*\{[^}]*min-width:\s*0\s*;[^}]*max-width:\s*100%\s*;/s,
  'Topbar action Space items must be shrinkable inside the adaptive header.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*?\.sl-topbar-desc,\s*\.sl-topbar-env,\s*\.sl-topbar-plane,\s*\.sl-topbar-ports\s*\{[^}]*display:\s*none\s*;/s,
  'Topbar secondary copy, environment tag and port hint must collapse on tablet widths before squeezing the route title.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-topbar-desc,\s*\.sl-topbar-env,\s*\.sl-topbar-plane,\s*\.sl-topbar-ports,\s*\.sl-topbar-username\s*\{[^}]*display:\s*none\s*;/s,
  'Mobile topbar must hide auxiliary environment, port and username text so core route title stays readable.'
)
requirePattern(
  css,
  /\.sl-topbar-username\s*\{[^}]*max-width:\s*210px\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Desktop topbar username must wrap instead of being clipped behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-topbar-username\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Desktop topbar username must not hide account identity behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-topbar-username\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Desktop topbar username must not clip account identity.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function assertTopbarAuxiliaryResponsiveContract\(page: Page\)[\s\S]*?desktop-topbar-username-text[\s\S]*?for \(const viewport of mobileNavigationViewports\)[\s\S]*?'\.sl-topbar-env'[\s\S]*?'\.sl-topbar-ports'[\s\S]*?'\.sl-topbar-username'[\s\S]*?user button must stay compact/s,
  'App shell smoke must prove topbar auxiliary information is desktop-readable and mobile-collapsed.'
)
requirePattern(
  appShellUiSmokeSpec,
  /topbar-auxiliary-visible-on-desktop-and-collapsed-on-mobile/,
  'App shell smoke marker must expose the topbar auxiliary responsive contract.'
)
requirePattern(
  css,
  /\.sl-page\s*\{[^}]*position:\s*relative\s*;[^}]*z-index:\s*0\s*;[^}]*min-height:\s*calc\(100vh - 78px\)\s*;/s,
  'Page content must remain below the topbar stacking layer.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-topbar\s*\{[^}]*min-height:\s*58px\s*;[^}]*padding:\s*8px 10px 8px 8px\s*;[\s\S]*?\.sl-page\s*\{[^}]*min-height:\s*calc\(100vh - 58px\)\s*;/s,
  'Mobile topbar and page content must use matching adaptive heights.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-topbar-desc,\s*\.sl-topbar-env,\s*\.sl-topbar-plane,\s*\.sl-topbar-ports,\s*\.sl-topbar-username\s*\{[^}]*display:\s*none\s*;/s,
  'Mobile topbar must hide long secondary labels so the page title cannot be squeezed or clipped.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-user-button\s*\{[^}]*width:\s*34px\s*;[^}]*min-width:\s*34px\s*;[^}]*padding:\s*0\s*;[^}]*justify-content:\s*center\s*;/s,
  'Mobile user menu must keep a stable compact hitbox instead of expanding with long usernames.'
)
requirePattern(
  appLayout,
  /type WorkPerspective = 'workbench' \| 'governance' \| 'admin_security'[\s\S]*?type WorkPerspectiveLabel = '开发工作台' \| '工程治理' \| '平台管理与安全'[\s\S]*?type ProductPlane = '前台体验' \| '开发者控制台' \| '后台治理'/,
  'AppLayout must define the three persisted work perspectives and product planes as typed contracts.'
)
requirePattern(
  appLayout,
  /const routeMeta = \[[\s\S]*?perspective:\s*'workbench'[\s\S]*?plane:\s*'前台体验'[\s\S]*?perspective:\s*'governance'[\s\S]*?plane:\s*'开发者控制台'[\s\S]*?perspective:\s*'admin_security'[\s\S]*?plane:\s*'后台治理'[\s\S]*?\] satisfies RouteMeta\[\]/,
  'AppLayout route metadata must map routes into Workbench, Engineering Governance and Admin Security perspectives.'
)
requirePattern(
  appLayout,
  /\{ match: '\/scan-tasks', title: '扫描报告', perspective: 'workbench', plane: '前台体验', desc: '复盘单次扫描的执行状态、分析产物、code_chunks 与治理证据链' \}/,
  'AppLayout must give /scan-tasks an explicit Workbench scan-report identity and accurate evidence-chain description.'
)
requirePattern(
  appLayout,
  /const getSelectedKey = \(\) => \{[\s\S]*?if \(location\.pathname\.startsWith\('\/scan-tasks'\)\) return '\/projects'[\s\S]*?return location\.pathname/,
  'AppLayout must map scan report routes to the /projects parent menu instead of leaving Sider and Drawer unselected.'
)
rejectPattern(
  appLayout,
  /location\.pathname\.startsWith\('\/scan-tasks'\)\) return location\.pathname/,
  'AppLayout must not regress scan report menu selection to an unmapped route key.'
)
requirePattern(
  appLayout,
  /const menuItemsByPerspective = \{[\s\S]*?workbench:[\s\S]*?Issue 拆解[\s\S]*?governance:[\s\S]*?Agent 任务[\s\S]*?admin_security:[\s\S]*?审计日志[\s\S]*?\} satisfies Record<WorkPerspective/,
  'AppLayout navigation must render one authoritative menu inventory per work perspective, with Issue Decomposition in Workbench.'
)
requirePattern(
  appLayout,
  /className="sl-topbar-plane">\{currentMeta\.plane\}<\/Tag>/,
  'AppLayout topbar must render the current route product plane from route metadata.'
)
rejectPattern(
  appLayout,
  /Developer Workbench|Engineering Governance|Admin & Security/,
  'AppLayout must not keep obsolete English navigation group labels after the three-plane split.'
)
requirePattern(
  appLayout,
  /const WORK_PERSPECTIVE_STORAGE_PREFIX = 'sourcelens\.work-view\.v1\.user\.'[\s\S]*?function isWorkPerspective\(value: unknown\): value is WorkPerspective[\s\S]*?value === 'workbench' \|\| value === 'governance' \|\| value === 'admin_security'[\s\S]*?function getSavedWorkPerspective\(userId: number\)[\s\S]*?localStorage\.getItem\(`\$\{WORK_PERSPECTIVE_STORAGE_PREFIX\}\$\{userId\}`\)[\s\S]*?return isWorkPerspective\(value\) \? value : 'workbench'[\s\S]*?catch \{[\s\S]*?return 'workbench'/,
  'Work perspective persistence must be per authenticated user, whitelist parsed and fail closed to Workbench.'
)
requirePattern(
  appLayout,
  /const workPerspectiveConfig:[\s\S]*?workbench:\s*\{ label:\s*'开发工作台', plane:\s*'前台体验', home:\s*'\/dashboard' \}[\s\S]*?governance:\s*\{ label:\s*'工程治理', plane:\s*'开发者控制台', home:\s*'\/execution-tasks' \}[\s\S]*?admin_security:\s*\{ label:\s*'平台管理与安全', plane:\s*'后台治理', home:\s*'\/audit-logs' \}/,
  'Work perspective labels, route planes and default homes must remain distinct and explicitly mapped.'
)
requirePattern(
  appLayout,
  /function saveWorkPerspective\(userId: number, perspective: WorkPerspective\)[\s\S]*?localStorage\.setItem\(`\$\{WORK_PERSPECTIVE_STORAGE_PREFIX\}\$\{userId\}`, perspective\)[\s\S]*?const handlePerspectiveChange[\s\S]*?isWorkPerspective\(value\)[\s\S]*?if \(user\) saveWorkPerspective\(user\.id, value\)[\s\S]*?navigate\(workPerspectiveConfig\[value\]\.home\)/,
  'Only an explicit work-perspective switch may persist a preference and navigate to that perspective home.'
)
requirePattern(
  appLayout,
  /export function WorkPerspectiveEntry\(\)[\s\S]*?getSavedWorkPerspective\(user\.id\)[\s\S]*?<Navigate to=\{workPerspectiveConfig\[perspective\]\.home\} replace \/>/,
  'AppLayout must restore a saved default perspective only from the neutral root entry.'
)
requirePattern(
  app,
  /import AppLayout, \{ WorkPerspectiveEntry \} from '.\/components\/AppLayout'[\s\S]*?<Route index element=\{<WorkPerspectiveEntry \/>\} \/>/,
  'The protected root route must use WorkPerspectiveEntry instead of treating /dashboard as an implicit redirect entry.'
)
requirePattern(
  login,
  /await login\(values\.username, values\.password\)[\s\S]*?navigate\('\/'\)/,
  'Login must enter through the neutral root so the saved navigation preference can choose a default home.'
)
rejectPattern(
  appLayout,
  /location\.pathname === '\/dashboard'[\s\S]{0,500}getSavedWorkPerspective|navigate\(target, \{ replace: true \}\)/,
  'Explicit /dashboard deep links must not be swallowed by saved work-perspective restoration.'
)
requirePattern(
  appLayout,
  /function getRouteMeta\(pathname: string\)[\s\S]*?pathname === item\.match \|\| pathname\.startsWith\(`\$\{item\.match\}\/`\)/,
  'Route metadata must match complete path segments rather than ambiguous bare prefixes.'
)
requirePattern(
  appLayout,
  /const desktopCollapsedRef = useRef\(false\)[\s\S]*?setMobileMenuOpen\(false\)[\s\S]*?setCollapsed\(nextNarrow \? true : desktopCollapsedRef\.current\)[\s\S]*?onCollapse=\{handleCollapse\}[\s\S]*?open=\{isNarrow && mobileMenuOpen\}/,
  'Responsive work-perspective navigation must close the Drawer at breakpoint changes and preserve the desktop collapse preference.'
)
requirePattern(
  appLayout,
  /const WORK_PERSPECTIVE_BOUNDARY = '仅调整导航与默认首页，不改变访问权限'[\s\S]*?<Segmented[\s\S]*?aria-label=\{surface === 'sider' \? '桌面工作视角切换' : '移动端工作视角切换'\}[\s\S]*?className="sl-perspective-boundary"[\s\S]*?sl-perspective-switcher-collapsed[\s\S]*?<Dropdown[\s\S]*?className="sl-perspective-dropdown-button"/,
  'Expanded Sider, mobile Drawer and collapsed Sider must expose accessible work-perspective controls plus the no-RBAC boundary.'
)
requirePattern(
  css,
  /\.sl-perspective-switcher\s*\{[\s\S]*?\.sl-perspective-segmented \.ant-segmented-item-label\s*\{[^}]*overflow-wrap:\s*anywhere;[^}]*white-space:\s*normal;[\s\S]*?\.sl-perspective-boundary\s*\{[^}]*overflow-wrap:\s*anywhere;[^}]*white-space:\s*normal;[\s\S]*?\.sl-perspective-switcher-collapsed\s*\{[^}]*place-items:\s*center;/,
  'Work perspective controls and permission boundary must remain readable in expanded, collapsed and narrow layouts.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*360px\)\s*\{[\s\S]*?\.sl-page\s*\{[^}]*padding:\s*14px 10px 24px\s*;/s,
  '320px narrow floor CSS must compact page spacing.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*360px\)\s*\{[\s\S]*?\.sl-action-button-label,\s*\.sl-inline-link \.sl-action-button-label\s*\{[^}]*white-space:\s*normal\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;/s,
  '320px narrow floor CSS must allow action button labels to wrap instead of clipping or overflowing.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*360px\)\s*\{[\s\S]*?\.sl-app-shell \.ant-alert-action\s*\{[^}]*width:\s*100%\s*;[^}]*margin-inline-start:\s*0\s*;/s,
  '320px narrow floor CSS must make Ant Alert actions full-width and aligned under content.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*360px\)\s*\{[\s\S]*?\.sl-app-shell \.ant-alert-action \.ant-btn,\s*\.sl-app-shell \.ant-list-item-action,\s*\.sl-app-shell \.ant-list-item-action > li,\s*\.sl-app-shell \.ant-list-item-action \.ant-btn\s*\{[^}]*width:\s*100%\s*;[\s\S]*?\.sl-app-shell \.ant-list-item\s*\{[^}]*align-items:\s*stretch\s*;[^}]*flex-direction:\s*column\s*;/s,
  '320px narrow floor CSS must make Ant List actions stack vertically instead of squeezing horizontally.'
)
requirePattern(
  css,
  /\.sl-icon-action-button\s*\{[^}]*display:\s*inline-grid\s*;[^}]*width:\s*28px\s*;[^}]*min-width:\s*28px\s*;[^}]*padding-inline:\s*0\s*;/s,
  'IconActionButton must keep a stable compact hitbox in dense tables.'
)
requirePattern(
  css,
  /\.sl-icon-action-button-primary:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s*\{[^}]*border-color:\s*var\(--sl-primary\)\s*!important\s*;[^}]*background:\s*var\(--sl-primary\)\s*!important\s*;[^}]*color:\s*#fff\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Primary IconActionButton must force a readable primary surface and white icon color.'
)
requirePattern(
  css,
  /\.sl-icon-action-button:where\(\.sl-icon-action-button-default,\s*\.sl-icon-action-button-danger,\s*\.sl-icon-action-button-text\):not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+:where\(\.ant-btn-icon,\s*\.anticon,\s*svg,\s*span\)\s*\{[^}]*color:\s*inherit\s*!important\s*;[^}]*fill:\s*currentColor\s*!important\s*;[^}]*stroke:\s*currentColor\s*!important\s*;[^}]*-webkit-text-fill-color:\s*currentColor\s*!important\s*;/s,
  'Default, danger and text IconActionButton icons must inherit the stabilized root color.'
)
requirePattern(
  css,
  /\.sl-icon-action-button-primary:not\(:disabled\):not\(\.ant-btn-disabled\):not\(\[disabled\]\)\s+:where\(\.ant-btn-icon,\s*\.anticon,\s*svg,\s*span\)\s*\{[^}]*color:\s*#fff\s*!important\s*;[^}]*fill:\s*currentColor\s*!important\s*;[^}]*stroke:\s*currentColor\s*!important\s*;[^}]*-webkit-text-fill-color:\s*#fff\s*!important\s*;/s,
  'Primary IconActionButton descendants must stay white instead of inheriting muted page text.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-tag,\s*\.sl-app-shell \.ant-badge-status-text\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*height:\s*auto\s*;[^}]*line-height:\s*1\.35\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Tag and Badge text must wrap long status, path and evidence labels inside the app shell.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-badge\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Badge roots must stay shrinkable inside dense app surfaces.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-tag(?:,\s*\.sl-app-shell \.ant-badge-status-text)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Tag and Badge text must not force long labels onto one line.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-tag(?:,\s*\.sl-app-shell \.ant-badge-status-text)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Tag and Badge text must not hide long labels behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-badge-status-text\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Badge status text must not force long labels onto one line.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-badge-status-text\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Badge status text must not hide long labels behind ellipsis.'
)
requirePattern(
  css,
  /\.sl-sider:not\(\.ant-layout-sider-collapsed\) \.ant-menu,\s*\.sl-mobile-nav \.ant-menu,\s*\.ant-dropdown \.ant-dropdown-menu\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Menu and Dropdown containers must stay shrinkable and avoid clipping navigation content.'
)
requirePattern(
  css,
  /\.sl-sider:not\(\.ant-layout-sider-collapsed\) \.ant-menu-item,\s*\.sl-sider:not\(\.ant-layout-sider-collapsed\) \.ant-menu-submenu-title,\s*\.sl-mobile-nav \.ant-menu-item,\s*\.sl-mobile-nav \.ant-menu-submenu-title,\s*\.ant-dropdown \.ant-dropdown-menu-item,\s*\.ant-dropdown \.ant-dropdown-menu-submenu-title\s*\{[^}]*height:\s*auto\s*;[^}]*min-height:\s*40px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*white-space:\s*normal\s*;/s,
  'Shared Ant Menu and Dropdown rows must support wrapped labels without clipping.'
)
requirePattern(
  css,
  /\.sl-sider:not\(\.ant-layout-sider-collapsed\) \.ant-menu-title-content,\s*\.sl-sider:not\(\.ant-layout-sider-collapsed\) \.ant-menu-item-group-title,\s*\.sl-mobile-nav \.ant-menu-title-content,\s*\.sl-mobile-nav \.ant-menu-item-group-title,\s*\.ant-dropdown \.ant-dropdown-menu-title-content\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*line-height:\s*1\.35\s*;/s,
  'Shared Ant Menu and Dropdown labels must wrap long navigation and user action text.'
)
requirePattern(
  css,
  /\.sl-sider:not\(\.ant-layout-sider-collapsed\) \.ant-menu-item-icon,\s*\.sl-sider:not\(\.ant-layout-sider-collapsed\) \.ant-menu-submenu-title \.anticon,\s*\.sl-mobile-nav \.ant-menu-item-icon,\s*\.sl-mobile-nav \.ant-menu-submenu-title \.anticon,\s*\.ant-dropdown \.ant-dropdown-menu-item-icon\s*\{[^}]*flex:\s*0 0 auto\s*;/s,
  'Shared Ant Menu and Dropdown icons must keep a stable size next to wrapped labels.'
)
rejectPattern(
  css,
  /\.(?:sl-sider|sl-mobile-nav|ant-dropdown) [^{]*(?:ant-menu-title-content|ant-menu-item-group-title|ant-dropdown-menu-title-content)[^{]*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Menu and Dropdown labels must not force one-line text.'
)
rejectPattern(
  css,
  /\.(?:sl-sider|sl-mobile-nav|ant-dropdown) [^{]*(?:ant-menu-title-content|ant-menu-item-group-title|ant-dropdown-menu-title-content)[^{]*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Menu and Dropdown labels must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.(?:sl-sider|sl-mobile-nav|ant-dropdown) [^{]*(?:ant-menu-title-content|ant-menu-item-group-title|ant-dropdown-menu-title-content)[^{]*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Menu and Dropdown labels must not clip long text.'
)
requirePattern(
  css,
  /\.ant-tooltip,\s*\.ant-popover\s*\{[^}]*max-width:\s*calc\(100vw - 24px\)\s*;/s,
  'Shared Ant Tooltip and Popover portals must stay inside narrow viewports.'
)
requirePattern(
  css,
  /\.ant-tooltip \.ant-tooltip-inner,\s*\.ant-popover \.ant-popover-inner,\s*\.ant-popover \.ant-popover-title,\s*\.ant-popover \.ant-popover-inner-content,\s*\.ant-popover \.ant-popconfirm-message,\s*\.ant-popover \.ant-popconfirm-message-text,\s*\.ant-popover \.ant-popconfirm-description\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Tooltip, Popover and Popconfirm text must wrap long labels, risks and confirmation copy.'
)
requirePattern(
  css,
  /\.ant-popover \.ant-popconfirm-message\s*\{[^}]*align-items:\s*flex-start\s*;/s,
  'Shared Ant Popconfirm message rows must align icons with wrapped confirmation text.'
)
requirePattern(
  css,
  /\.ant-popover \.ant-popconfirm-buttons\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*justify-content:\s*flex-end\s*;[^}]*gap:\s*8px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Popconfirm buttons must wrap instead of squeezing confirmation actions.'
)
requirePattern(
  css,
  /\.ant-popover \.ant-popconfirm-buttons \.ant-btn\s*\{[^}]*height:\s*auto\s*;[^}]*min-height:\s*28px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*margin-inline-start:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Popconfirm action buttons must keep long labels readable.'
)
rejectPattern(
  css,
  /\.(?:ant-tooltip|ant-popover) [^{]*(?:ant-tooltip-inner|ant-popover-inner|ant-popover-title|ant-popover-inner-content|ant-popconfirm-message|ant-popconfirm-message-text|ant-popconfirm-description)[^{]*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Tooltip, Popover and Popconfirm text must not force one-line content.'
)
rejectPattern(
  css,
  /\.(?:ant-tooltip|ant-popover) [^{]*(?:ant-tooltip-inner|ant-popover-inner|ant-popover-title|ant-popover-inner-content|ant-popconfirm-message|ant-popconfirm-message-text|ant-popconfirm-description)[^{]*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Tooltip, Popover and Popconfirm text must not hide content behind ellipsis.'
)
rejectPattern(
  css,
  /\.(?:ant-tooltip|ant-popover) [^{]*(?:ant-tooltip-inner|ant-popover-inner|ant-popover-title|ant-popover-inner-content|ant-popconfirm-message|ant-popconfirm-message-text|ant-popconfirm-description)[^{]*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Tooltip, Popover and Popconfirm text must not clip content.'
)
rejectPattern(
  css,
  /\.ant-popover \.ant-popconfirm-buttons[^{]*\{[^}]*flex-wrap:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Popconfirm buttons must not disable wrapping.'
)
rejectPattern(
  css,
  /[^{]*\.ant-popconfirm-buttons(?:\s|[.#:[>+~])[^{}]*\{[^}]*flex-wrap:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Popconfirm button groups must not disable wrapping through scoped overrides.'
)
rejectPattern(
  css,
  /[^{]*\.ant-popconfirm-buttons\s+\.ant-btn[^{}]*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Popconfirm action buttons must not force one-line labels through scoped overrides.'
)
rejectPattern(
  css,
  /[^{]*\.ant-popconfirm-buttons\s+\.ant-btn[^{}]*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Popconfirm action buttons must not hide labels behind ellipsis through scoped overrides.'
)
rejectPattern(
  css,
  /[^{]*\.ant-popconfirm-buttons\s+\.ant-btn[^{}]*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Popconfirm action buttons must not clip labels through scoped overrides.'
)
requirePattern(
  css,
  /\.ant-message,\s*\.ant-notification\s*\{[^}]*max-width:\s*calc\(100vw - 24px\)\s*;/s,
  'Shared Ant Message and Notification portals must stay inside narrow viewports.'
)
requirePattern(
  css,
  /\.ant-message \.ant-message-notice,\s*\.ant-notification \.ant-notification-notice\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Message and Notification notices must stay shrinkable.'
)
requirePattern(
  css,
  /\.ant-message \.ant-message-notice-content,\s*\.ant-message \.ant-message-custom-content,\s*\.ant-notification \.ant-notification-notice-message,\s*\.ant-notification \.ant-notification-notice-description\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Message and Notification text must wrap long API errors, request ids and action feedback.'
)
requirePattern(
  css,
  /\.ant-message \.ant-message-custom-content,\s*\.ant-notification \.ant-notification-notice-with-icon \.ant-notification-notice-message,\s*\.ant-notification \.ant-notification-notice-with-icon \.ant-notification-notice-description\s*\{[^}]*display:\s*flex\s*;[^}]*align-items:\s*flex-start\s*;[^}]*gap:\s*8px\s*;/s,
  'Shared Ant Message and Notification icon rows must align icons with wrapped feedback text.'
)
requirePattern(
  css,
  /\.ant-message \.anticon,\s*\.ant-notification \.ant-notification-notice-icon\s*\{[^}]*flex:\s*0 0 auto\s*;/s,
  'Shared Ant Message and Notification icons must keep a stable size next to wrapped text.'
)
requirePattern(
  css,
  /\.ant-notification \.ant-notification-notice-btn\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*justify-content:\s*flex-end\s*;[^}]*gap:\s*8px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Notification action buttons must wrap instead of squeezing controls.'
)
rejectPattern(
  css,
  /\.(?:ant-message|ant-notification) [^{]*(?:ant-message-notice-content|ant-message-custom-content|ant-notification-notice-message|ant-notification-notice-description)[^{]*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Message and Notification text must not force one-line feedback.'
)
rejectPattern(
  css,
  /\.(?:ant-message|ant-notification) [^{]*(?:ant-message-notice-content|ant-message-custom-content|ant-notification-notice-message|ant-notification-notice-description)[^{]*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Message and Notification text must not hide feedback behind ellipsis.'
)
rejectPattern(
  css,
  /\.(?:ant-message|ant-notification) [^{]*(?:ant-message-notice-content|ant-message-custom-content|ant-notification-notice-message|ant-notification-notice-description)[^{]*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Message and Notification text must not clip feedback.'
)
rejectPattern(
  css,
  /[^{]*\.ant-notification-notice-btn[^{}]*\{[^}]*flex-wrap:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Notification action buttons must not disable wrapping.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-progress\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Progress roots must stay shrinkable in dashboard, task and report surfaces.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-progress-line\s*\{[^}]*display:\s*flex\s*;[^}]*align-items:\s*flex-start\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Progress line layout must leave room for wrapped progress text.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-progress-outer,\s*\.sl-app-shell \.ant-progress-inner\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Progress bar containers must stay shrinkable.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-progress-line \.ant-progress-text\s*\{[^}]*flex:\s*0 1 auto\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*line-height:\s*1\.35\s*;/s,
  'Shared Ant Progress text must wrap long status or percent labels.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-progress(?:-line)? [^{]*\.ant-progress-text[^{]*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Progress text must not force one-line labels.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-progress(?:-line)? [^{]*\.ant-progress-text[^{]*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Progress text must not hide labels behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-progress(?:-line)? [^{]*\.ant-progress-text[^{]*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Progress text must not clip labels.'
)
rejectPattern(
  css,
  /[^{]*\.ant-progress-text[^{}]*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Progress text must not force one-line labels through scoped overrides.'
)
rejectPattern(
  css,
  /[^{]*\.ant-progress-text[^{}]*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Progress text must not hide labels behind ellipsis through scoped overrides.'
)
rejectPattern(
  css,
  /[^{]*\.ant-progress-text[^{}]*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Progress text must not clip labels through scoped overrides.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-timeline\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Timeline roots must stay shrinkable in task, repair and governance surfaces.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-timeline \.ant-timeline-item\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Timeline items must stay shrinkable.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-timeline \.ant-timeline-item-content,\s*\.sl-app-shell \.ant-timeline \.ant-timeline-item-label\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Timeline labels and content must wrap long step titles, evidence, errors and URLs.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-timeline \.ant-timeline-item-head,\s*\.sl-app-shell \.ant-timeline \.ant-timeline-item-tail\s*\{[^}]*flex:\s*0 0 auto\s*;/s,
  'Shared Ant Timeline markers must keep stable sizing beside wrapped content.'
)
rejectPattern(
  css,
  /[^{]*\.ant-timeline-item-(?:content|label)[^{}]*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Timeline labels and content must not force one-line text through scoped overrides.'
)
rejectPattern(
  css,
  /[^{]*\.ant-timeline-item-(?:content|label)[^{}]*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Timeline labels and content must not hide text behind ellipsis through scoped overrides.'
)
rejectPattern(
  css,
  /[^{]*\.ant-timeline-item-(?:content|label)[^{}]*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Timeline labels and content must not clip text through scoped overrides.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-input,\s*\.sl-app-shell textarea\.ant-input,\s*\.sl-app-shell \.ant-input-affix-wrapper,\s*\.sl-app-shell \.ant-input-group-wrapper,\s*\.sl-app-shell \.ant-input-wrapper,\s*\.sl-app-shell \.ant-input-group,\s*\.sl-app-shell \.ant-input-search,\s*\.sl-app-shell \.ant-input-number,\s*\.sl-app-shell \.ant-input-number-affix-wrapper,\s*\.sl-app-shell \.ant-input-number-group-wrapper,\s*\.sl-app-shell \.ant-input-number-wrapper\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Input roots, wrappers, search and number controls must stay shrinkable without changing editing text behavior.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-input-affix-wrapper,\s*\.sl-app-shell \.ant-input-search,\s*\.sl-app-shell \.ant-input-number-affix-wrapper\s*\{[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Input affix/search wrappers must not clip prefix, suffix or search action surfaces.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-input-affix-wrapper > input\.ant-input,\s*\.sl-app-shell \.ant-input-number-input,\s*\.sl-app-shell \.ant-input-number-input-wrap\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Input inner editing controls must stay shrinkable.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-input-prefix,\s*\.sl-app-shell \.ant-input-suffix,\s*\.sl-app-shell \.ant-input-group-addon,\s*\.sl-app-shell \.ant-input-number-group-addon\s*\{[^}]*flex:\s*0 1 auto\s*;[^}]*max-width:\s*45%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Input prefix, suffix and addons must wrap long labels without squeezing the editing control.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-input-search \.ant-input-group-addon \.ant-btn\s*\{[^}]*height:\s*auto\s*;[^}]*min-height:\s*32px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Input search action buttons must keep long labels readable.'
)
const inputContainerClasses = [
  'ant-input-affix-wrapper',
  'ant-input-group-wrapper',
  'ant-input-wrapper',
  'ant-input-group',
  'ant-input-search',
  'ant-input-number',
  'ant-input-number-affix-wrapper',
  'ant-input-number-group-wrapper',
  'ant-input-number-wrapper',
  'ant-input-prefix',
  'ant-input-suffix',
  'ant-input-group-addon',
  'ant-input-number-group-addon',
]
const inputEditingClasses = [
  'ant-input',
  'ant-input-number-input',
]
const inputAddonClasses = [
  'ant-input-prefix',
  'ant-input-suffix',
  'ant-input-group-addon',
  'ant-input-number-group-addon',
]
const inputSearchActionClasses = [
  'ant-input-search-button',
]

function selectorHasClass(selector, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\.${escaped}(?=$|[\\s.#:[>+~),])`).test(selector)
}

// Ignore classes that only appear inside :not(...) when checking positive selector targets.
function stripNotClauses(selector) {
  return selector.replace(/:not\([^)]*\)/g, '')
}

function selectorHasPositiveClass(selector, className) {
  return selectorHasClass(stripNotClauses(selector), className)
}

function selectorHasAnyClass(selector, classNames) {
  return classNames.some(className => selectorHasClass(selector, className))
}

function selectorTargetsSharedInputSearchAction(selector) {
  return selector.includes('.sl-app-shell')
    && (selectorHasAnyClass(selector, inputSearchActionClasses)
      || (selectorHasClass(selector, 'ant-input-search')
        && selectorHasClass(selector, 'ant-input-group-addon')
        && selectorHasClass(selector, 'ant-btn')))
}

function selectorTargetsSharedInputEditingControl(selector) {
  return selector.includes('.sl-app-shell') && selectorHasAnyClass(selector, inputEditingClasses)
}

function selectorTargetsSharedInputAddon(selector) {
  return selector.includes('.sl-app-shell') && selectorHasAnyClass(selector, inputAddonClasses)
}

function selectorTargetsSharedInputContainer(selector) {
  return selector.includes('.sl-app-shell') && selectorHasAnyClass(selector, inputContainerClasses)
}

const inputEditingBehaviorDeclarations = [
  ['white-space', /(?:normal|nowrap|pre|pre-wrap|pre-line|break-spaces)/],
  ['overflow-wrap', /(?:anywhere|break-word|normal)/],
  ['word-break', /(?:break-word|break-all|keep-all|normal)/],
]

for (const block of blocks) {
  const hasInputContainerSelector = block.selectors.some(selectorTargetsSharedInputContainer)

  if (!hasInputContainerSelector) {
    continue
  }

  if (hasDeclaration(block.declarations, 'max-width', /none/)) {
    fail('Shared Ant Input containers must not disable width containment through direct or more specific selectors.')
  }
  if (hasDeclaration(block.declarations, 'overflow', /hidden/)) {
    fail('Shared Ant Input containers, affixes and addons must not clip controls or long addon labels.')
  }
}
for (const block of blocks) {
  if (block.selectors.some(selectorTargetsSharedInputEditingControl)) {
    for (const [property, valuePattern] of inputEditingBehaviorDeclarations) {
      if (hasDeclaration(block.declarations, property, valuePattern)) {
        fail('Shared Ant Input readability must not change real input, password, number or textarea editing text behavior.')
      }
    }
  }

  if (block.selectors.some(selectorTargetsSharedInputSearchAction)) {
    if (hasDeclaration(block.declarations, 'overflow', /hidden/)) {
      fail('Shared Ant Input search actions must not clip labels through direct or more specific selectors.')
    }
    if (hasDeclaration(block.declarations, 'white-space', /nowrap/)) {
      fail('Shared Ant Input search actions must not force one-line labels through direct or more specific selectors.')
    }
    if (hasDeclaration(block.declarations, 'text-overflow', /ellipsis/)) {
      fail('Shared Ant Input search actions must not hide labels behind ellipsis.')
    }
  }

  if (block.selectors.some(selectorTargetsSharedInputAddon)) {
    if (hasDeclaration(block.declarations, 'white-space', /nowrap/)) {
      fail('Shared Ant Input prefix, suffix and addons must not force one-line labels in the shared app shell scope.')
    }
    if (hasDeclaration(block.declarations, 'text-overflow', /ellipsis/)) {
      fail('Shared Ant Input prefix, suffix and addons must not hide labels behind ellipsis in the shared app shell scope.')
    }
  }
}
requirePattern(
  css,
  /\.sl-app-shell \.ant-radio-group,\s*\.sl-app-shell \.ant-radio-wrapper,\s*\.sl-app-shell \.ant-radio-button-wrapper\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Radio roots, wrappers and button wrappers must stay shrinkable in dense app surfaces.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-radio-group\s*\{[^}]*display:\s*inline-flex\s*;[^}]*flex-wrap:\s*wrap\s*;/s,
  'Shared Ant Radio groups must wrap options instead of forcing horizontal overflow.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-radio-wrapper\s*\{[^}]*align-items:\s*flex-start\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Radio wrappers must wrap long option labels without clipping.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-radio,\s*\.sl-app-shell \.ant-radio-button\s*\{[^}]*flex:\s*0 0 auto\s*;/s,
  'Shared Ant Radio controls must keep the actual radio icon/button from shrinking.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-radio-button-wrapper\s*\{[^}]*display:\s*inline-flex\s*;[^}]*align-items:\s*center\s*;[^}]*height:\s*auto\s*;[^}]*min-height:\s*32px\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*line-height:\s*1\.35\s*;/s,
  'Shared Ant Radio button wrappers must support multiline labels without clipping.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-radio-button-wrapper > span:not\(\.ant-radio-button\)\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Radio button label spans must wrap long labels without ellipsis.'
)
for (const block of blocks) {
  const targetsSharedRadio = block.selectors.some(selector =>
    selector.includes('.sl-app-shell')
      && (selectorHasClass(selector, 'ant-radio-group')
        || selectorHasClass(selector, 'ant-radio-wrapper')
        || selectorHasClass(selector, 'ant-radio-button-wrapper'))
  )

  if (!targetsSharedRadio) {
    continue
  }

  if (hasDeclaration(block.declarations, 'white-space', /nowrap/)) {
    fail('Shared Ant Radio labels must not force nowrap in the shared app shell scope.')
  }
  if (hasDeclaration(block.declarations, 'text-overflow', /ellipsis/)) {
    fail('Shared Ant Radio labels must not hide long option text behind ellipsis.')
  }
  if (hasDeclaration(block.declarations, 'overflow', /hidden/)) {
    fail('Shared Ant Radio labels must not clip long option text.')
  }
  if (hasDeclaration(block.declarations, 'flex-wrap', /nowrap/)) {
    fail('Shared Ant Radio labels must not disable option wrapping.')
  }
}
requirePattern(
  css,
  /\.sl-app-shell \.ant-collapse,\s*\.sl-app-shell \.ant-collapse-item,\s*\.sl-app-shell \.ant-collapse-content,\s*\.sl-app-shell \.ant-collapse-content-box\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Collapse roots, items and content must stay shrinkable and avoid clipping.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-collapse-header\s*\{[^}]*align-items:\s*flex-start\s*;[^}]*height:\s*auto\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*white-space:\s*normal\s*;/s,
  'Shared Ant Collapse headers must support multiline labels in dense app surfaces.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-collapse-expand-icon\s*\{[^}]*flex:\s*0 0 auto\s*;/s,
  'Shared Ant Collapse expand icons must keep stable sizing beside wrapped labels.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-collapse-header-text,\s*\.sl-app-shell \.ant-collapse-extra\s*\{[^}]*flex:\s*1 1 auto\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Collapse header text and extra content must wrap long evidence labels.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-collapse-header-text \.ant-space,\s*\.sl-app-shell \.ant-collapse-extra \.ant-space\s*\{[^}]*flex-wrap:\s*wrap\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Collapse header Space children must wrap instead of squeezing labels.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-collapse-content-box\s*\{[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Collapse content boxes must wrap long logs, paths and evidence text.'
)
for (const block of blocks) {
  const targetsSharedCollapse = block.selectors.some(selector =>
    selector.includes('.sl-app-shell')
      && (selectorHasClass(selector, 'ant-collapse-header')
        || selectorHasClass(selector, 'ant-collapse-header-text')
        || selectorHasClass(selector, 'ant-collapse-extra')
        || selectorHasClass(selector, 'ant-collapse-content-box'))
  )

  if (!targetsSharedCollapse) {
    continue
  }

  if (hasDeclaration(block.declarations, 'white-space', /nowrap/)) {
    fail('Shared Ant Collapse labels and content must not force nowrap in the shared app shell scope.')
  }
  if (hasDeclaration(block.declarations, 'text-overflow', /ellipsis/)) {
    fail('Shared Ant Collapse labels and content must not hide long text behind ellipsis.')
  }
  if (hasDeclaration(block.declarations, 'overflow', /hidden/)) {
    fail('Shared Ant Collapse labels and content must not clip long text.')
  }
  if (hasDeclaration(block.declarations, 'flex-wrap', /nowrap/)) {
    fail('Shared Ant Collapse header actions must not disable wrapping.')
  }
}
requirePattern(
  css,
  /\.sl-app-shell \.ant-alert\s*\{[^}]*align-items:\s*flex-start\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Alert roots must stay shrinkable and avoid clipping status content.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-alert-content\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Alert content must stay shrinkable inside dense app surfaces.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-alert-message,\s*\.sl-app-shell \.ant-alert-description\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Alert message and description must wrap long API, path, risk and evidence text.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-alert-action\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*gap:\s*8px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Alert actions must wrap recovery buttons and long labels.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-alert-(?:message|description)\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Alert copy must not force long status text onto one line.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-alert-(?:message|description)\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Alert copy must not hide long status text behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-alert-(?:message|description)\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Alert copy must not clip long status text.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-alert-action\s*\{[^}]*flex-wrap:\s*nowrap\s*;/s,
  'Shared Ant Alert actions must not disable wrapping for recovery buttons.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-alert-action\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Alert actions must not force recovery buttons onto one line.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-alert-action\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Alert actions must not clip recovery buttons or long labels.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-descriptions,\s*\.sl-app-shell \.ant-descriptions-view\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Descriptions roots must stay shrinkable and avoid clipping details.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-descriptions-item,\s*\.sl-app-shell \.ant-descriptions-item-label,\s*\.sl-app-shell \.ant-descriptions-item-content\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*vertical-align:\s*top\s*;/s,
  'Shared Ant Descriptions labels and content must wrap long IDs, paths, hashes, URLs and errors.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-descriptions-item(?:-(?:label|content))?(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Descriptions details must not force long values onto one line.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-descriptions-item(?:-(?:label|content))?(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Descriptions details must not hide long values behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-descriptions-item(?:-(?:label|content))?(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Descriptions details must not clip long values.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-list,\s*\.sl-app-shell \.ant-list-items\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant List roots must stay shrinkable inside dense app surfaces.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-list-item\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant List items must avoid clipping long risk and evidence rows.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-list-item-meta\s*\{[^}]*align-items:\s*flex-start\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant List metadata must align icons with wrapped titles and descriptions.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-list-item-meta-content\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant List metadata content must stay shrinkable.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-list-item-meta-title,\s*\.sl-app-shell \.ant-list-item-meta-description\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant List titles and descriptions must wrap long risks, paths, URLs and evidence summaries.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-list-item-action\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*gap:\s*8px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant List actions must wrap instead of squeezing controls on narrow screens.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-list-item-action > li\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant List action items must keep long action text readable.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-list-item-meta-(?:title|description)(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant List metadata text must not force long values onto one line.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-list-item-meta-(?:title|description)(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant List metadata text must not hide long values behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-list-item-meta-(?:title|description)(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant List metadata text must not clip long values.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-list-item-action\s*\{[^}]*flex-wrap:\s*nowrap\s*;/s,
  'Shared Ant List actions must not disable wrapping.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-list-item-action\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant List actions must not clip action controls.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-list-item-action(?:\s*>\s*li)?(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant List actions must not force action text onto one line.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-list-item-action(?:\s*>\s*li)?(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant List actions must not hide action text behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-list-item-action\s*>\s*li(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant List action items must not clip action controls.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-card,\s*\.sl-app-shell \.ant-card-head,\s*\.sl-app-shell \.ant-card-head-wrapper,\s*\.sl-app-shell \.ant-card-head-title,\s*\.sl-app-shell \.ant-card-extra,\s*\.sl-app-shell \.ant-card-body\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Card containers must stay shrinkable in the app shell.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-card-head-wrapper\s*\{[^}]*align-items:\s*flex-start\s*;[^}]*gap:\s*8px\s*;/s,
  'Shared Ant Card headers must align wrapped titles and actions from the top.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-card-head-title\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Card titles must wrap long titles and evidence context.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-card-extra\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*justify-content:\s*flex-end\s*;[^}]*gap:\s*8px\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Card extra actions must wrap instead of squeezing controls.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-card-extra \.ant-space,\s*\.sl-app-shell \.ant-card-head-title \.ant-space\s*\{[^}]*flex-wrap:\s*wrap\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Card title and extra Space groups must allow wrapping.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-card-extra \.ant-space-item,\s*\.sl-app-shell \.ant-card-head-title \.ant-space-item\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Card title and extra Space items must stay shrinkable.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-card-head-title(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Card titles must not force one-line text.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-card-head-title(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Card titles must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-card-head-title(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Card titles must not clip long text.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-card-extra(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Card extra actions must not force one-line text.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-card-extra(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Card extra actions must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-card-extra(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Card extra actions must not clip controls.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-card-(?:extra|head-title) \.ant-space\s*\{[^}]*flex-wrap:\s*nowrap\s*;/s,
  'Shared Ant Card title and extra Space groups must not disable wrapping.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-space,\s*\.sl-app-shell \.ant-space-item\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Space containers and items must stay shrinkable in the app shell.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-space-horizontal:not\(\.ant-space-compact\)\s*\{[^}]*flex-wrap:\s*wrap\s*;/s,
  'Shared Ant horizontal Space rows must wrap unless they are compact input groups.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-space-horizontal:not\(\.ant-space-compact\) > \.ant-space-item\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant horizontal Space items must keep action, tag and evidence labels readable.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-space(?:-horizontal)?(?:\s*,[^{}]*)?\s*\{[^}]*flex-wrap:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Space rows must not disable wrapping.'
)
for (const block of blocks) {
  if (!hasDeclaration(block.declarations, 'flex-wrap', /nowrap/)) {
    continue
  }

  const hasWrappedHorizontalSpaceSelector = block.selectors.some(selector => {
    if (!selector.includes('.sl-app-shell') || !selector.includes('.ant-space-horizontal')) {
      return false
    }
    const explicitlyTargetsCompact = selector.includes('.ant-space-compact') && !selector.includes(':not(.ant-space-compact)')
    return !explicitlyTargetsCompact
  })

  if (hasWrappedHorizontalSpaceSelector) {
    fail('Shared Ant horizontal Space rows must not disable wrapping through direct, repeated or more specific non-compact selectors.')
  }
}
rejectPattern(
  css,
  /\.sl-app-shell \.ant-space-horizontal:not\(\.ant-space-compact\) > \.ant-space-item(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Space items must not force one-line text.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-space-horizontal:not\(\.ant-space-compact\) > \.ant-space-item(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Space items must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-space-horizontal:not\(\.ant-space-compact\) > \.ant-space-item(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Space items must not clip controls or text.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-typography\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Typography containers must stay shrinkable in the app shell.'
)
requirePattern(
  css,
  /\.sl-app-shell :where\(\.ant-typography\):not\(\.ant-typography-ellipsis\)\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared non-ellipsis Ant Typography text must wrap long titles, summaries, evidence and status copy.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-typography:not\(\.ant-typography-ellipsis\)\s*\{/s,
  'Shared non-ellipsis Ant Typography readability must use low-specificity :where(.ant-typography) so business ellipsis cells can override it.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-typography code,\s*\.sl-app-shell code\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared code text must wrap long file paths, hashes, commands and inline evidence references.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-typography pre,\s*\.sl-app-shell pre\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*auto\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*white-space:\s*pre-wrap\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared preformatted text must preserve readability without overflowing the app shell.'
)
rejectPattern(
  css,
  /\.sl-app-shell (?:\.ant-typography )?(?:code|pre)(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared code and preformatted text must not force one-line text.'
)
rejectPattern(
  css,
  /\.sl-app-shell (?:\.ant-typography )?(?:code|pre)(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared code and preformatted text must not hide evidence behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell (?:\.ant-typography )?(?:code|pre)(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared code and preformatted text must not clip evidence.'
)
for (const block of blocks) {
  const targetsNonEllipsisTypography = block.selectors.some(selector => {
    return selector.includes('.sl-app-shell')
      && (selectorHasClass(selector, 'ant-typography') || selector.includes(':where(.ant-typography)'))
      && (!selectorHasClass(selector, 'ant-typography-ellipsis')
        || selector.includes(':not(.ant-typography-ellipsis)'))
  })

  if (!targetsNonEllipsisTypography) {
    continue
  }

  if (hasDeclaration(block.declarations, 'white-space', /nowrap/)) {
    fail('Shared non-ellipsis Ant Typography text must not force one-line copy through direct or more specific selectors.')
  }
  if (hasDeclaration(block.declarations, 'text-overflow', /ellipsis/)) {
    fail('Shared non-ellipsis Ant Typography text must not hide copy behind ellipsis.')
  }
  if (hasDeclaration(block.declarations, 'overflow', /hidden/)) {
    fail('Shared non-ellipsis Ant Typography text must not clip copy.')
  }
}
requirePattern(
  css,
  /\.sl-app-shell \.ant-table-wrapper,\s*\.sl-app-shell \.ant-table,\s*\.sl-app-shell \.ant-table-container,\s*\.sl-app-shell \.ant-table-content,\s*\.sl-app-shell \.ant-table-body,\s*\.sl-app-shell \.ant-spin-nested-loading,\s*\.sl-app-shell \.ant-spin-container\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Table wrappers must stay shrinkable in the app shell.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-table-content,\s*\.sl-app-shell \.ant-table-body\s*\{[^}]*overflow-x:\s*auto\s*;/s,
  'Shared Ant Table content/body must own horizontal scrolling instead of escaping the app shell.'
)
requirePattern(
  css,
  /\.sl-app-shell :where\(\.ant-table-cell\):not\(\.ant-table-cell-ellipsis\)\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared non-ellipsis Ant Table cells must wrap long task, repository, audit and artifact text.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-table-cell:not\(\.ant-table-cell-ellipsis\)\s*\{/s,
  'Shared non-ellipsis Ant Table cell readability must use low-specificity :where(.ant-table-cell) so business ellipsis cells can override it.'
)
for (const block of blocks) {
  const targetsSharedTableCell = block.selectors.some(selector => {
    return selector.includes('.sl-app-shell')
      && (selectorHasPositiveClass(selector, 'ant-table-cell') || selector.includes(':where(.ant-table-cell)'))
  })
  const targetsSharedEllipsisTableCell = block.selectors.some(selector => {
    return selector.includes('.sl-app-shell')
      && selectorHasPositiveClass(selector, 'ant-table-cell-ellipsis')
  })
  const targetsNonEllipsisTableCell = block.selectors.some(selector => {
    return selector.includes('.sl-app-shell')
      && (selectorHasPositiveClass(selector, 'ant-table-cell') || selector.includes(':where(.ant-table-cell)'))
      && !selectorHasPositiveClass(selector, 'ant-table-cell-ellipsis')
  })

  if (targetsSharedEllipsisTableCell) {
    if (hasDeclaration(block.declarations, 'white-space', /normal/)) {
      fail('Shared Ant Table rules must not force ellipsis cells to wrap.')
    }
    if (hasDeclaration(block.declarations, 'text-overflow', /clip/)) {
      fail('Shared Ant Table rules must not disable ellipsis cell overflow signaling.')
    }
    if (hasDeclaration(block.declarations, 'overflow', /visible/)) {
      fail('Shared Ant Table rules must not make ellipsis cells overflow visibly.')
    }
  }

  if (targetsSharedTableCell && !targetsNonEllipsisTableCell && hasDeclaration(block.declarations, 'white-space', /normal/)) {
    fail('Shared Ant Table cell wrapping must be scoped to :not(.ant-table-cell-ellipsis).')
  }

  if (!targetsNonEllipsisTableCell) {
    continue
  }

  if (hasDeclaration(block.declarations, 'white-space', /nowrap/)) {
    fail('Shared non-ellipsis Ant Table cells must not force one-line text.')
  }
  if (hasDeclaration(block.declarations, 'text-overflow', /ellipsis/)) {
    fail('Shared non-ellipsis Ant Table cells must not hide text behind ellipsis.')
  }
  if (hasDeclaration(block.declarations, 'overflow', /hidden/)) {
    fail('Shared non-ellipsis Ant Table cells must not clip text.')
  }
}
requirePattern(
  css,
  /\.sl-app-shell \.ant-tabs,\s*\.sl-app-shell \.ant-tabs-nav,\s*\.sl-app-shell \.ant-tabs-nav-wrap,\s*\.sl-app-shell \.ant-tabs-nav-list,\s*\.sl-app-shell \.ant-tabs-content-holder,\s*\.sl-app-shell \.ant-tabs-content,\s*\.sl-app-shell \.ant-tabs-tabpane\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Tabs containers must stay shrinkable in the app shell.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-tabs-nav\s*\{[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Tabs nav must not clip wrapped tab labels.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-tabs-tab\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Tabs tabs must stay shrinkable.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-tabs-tab-btn\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Tabs tab labels must wrap long labels and evidence context.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-tabs-tab-btn(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Tabs tab labels must not force one-line text.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-tabs-tab-btn(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Tabs tab labels must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-tabs-tab-btn(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Tabs tab labels must not clip long text.'
)
rejectPattern(
  css,
  /\.sl-report-tabs \.ant-tabs-nav\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Report Tabs nav must not override shared tab-label readability by clipping wrapped labels.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-select,\s*\.sl-app-shell \.ant-select-selector,\s*\.sl-app-shell \.ant-select-selection-overflow,\s*\.sl-app-shell \.ant-select-selection-overflow-item,\s*\.sl-app-shell \.ant-select-selection-search,\s*\.sl-app-shell \.ant-select-selection-item,\s*\.sl-app-shell \.ant-select-selection-placeholder\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Select containers and selected values must stay shrinkable in the app shell.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-select-selector\s*\{[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Select selector must not clip selected values.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-select-selection-item,\s*\.sl-app-shell \.ant-select-selection-placeholder\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Select selected values and placeholders must wrap long project, repository, status and model labels.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-select-multiple \.ant-select-selection-overflow\s*\{[^}]*flex-wrap:\s*wrap\s*;/s,
  'Shared Ant Select multiple values must wrap instead of squeezing tags.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-select-multiple \.ant-select-selection-item\s*\{[^}]*height:\s*auto\s*;[^}]*min-height:\s*24px\s*;/s,
  'Shared Ant Select multiple value tags must allow wrapped text height.'
)
requirePattern(
  css,
  /\.ant-select-dropdown \.ant-select-item,\s*\.ant-select-dropdown \.ant-select-item-option,\s*\.ant-select-dropdown \.ant-select-item-option-content\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Select dropdown options must stay shrinkable.'
)
requirePattern(
  css,
  /\.ant-select-dropdown \.ant-select-item-option-content\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Select dropdown option text must wrap long project, repository, branch and model labels.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-select-selection-(?:item|placeholder)(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Select selected values and placeholders must not force one-line text.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-select-selection-(?:item|placeholder)[^{]*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Select selected values and placeholders must not force one-line text through a more specific selector.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-select-selection-(?:item|placeholder)(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Select selected values and placeholders must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-select-selection-(?:item|placeholder)[^{]*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Select selected values and placeholders must not hide text behind ellipsis through a more specific selector.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-select-selection-(?:item|placeholder)(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Select selected values and placeholders must not clip long text.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-select-selection-(?:item|placeholder)[^{]*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Select selected values and placeholders must not clip long text through a more specific selector.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-select-multiple \.ant-select-selection-overflow\s*\{[^}]*flex-wrap:\s*nowrap\s*;/s,
  'Shared Ant Select multiple values must not disable wrapping.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-select-multiple [^{]*\.ant-select-selection-overflow[^{]*\{[^}]*flex-wrap:\s*nowrap\s*;/s,
  'Shared Ant Select multiple values must not disable wrapping through a more specific selector.'
)
rejectPattern(
  css,
  /\.ant-select-dropdown \.ant-select-item-option-content(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Select dropdown options must not force one-line text.'
)
rejectPattern(
  css,
  /\.ant-select-dropdown [^{]*\.ant-select-item(?:-option)?(?:-content)?[^{]*\{[^}]*flex-wrap:\s*nowrap\s*;/s,
  'Shared Ant Select dropdown options must not disable wrapping.'
)
rejectPattern(
  css,
  /\.ant-select-dropdown [^{]*\.ant-select-item-option-content[^{]*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Select dropdown options must not force one-line text through a more specific selector.'
)
rejectPattern(
  css,
  /\.ant-select-dropdown \.ant-select-item-option-content(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Select dropdown options must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.ant-select-dropdown [^{]*\.ant-select-item-option-content[^{]*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Select dropdown options must not hide text behind ellipsis through a more specific selector.'
)
rejectPattern(
  css,
  /\.ant-select-dropdown \.ant-select-item-option-content(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Select dropdown options must not clip long text.'
)
rejectPattern(
  css,
  /\.ant-select-dropdown [^{]*\.ant-select-item-option-content[^{]*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Select dropdown options must not clip long text through a more specific selector.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-pagination\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Pagination must stay shrinkable and wrap on narrow screens.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-pagination-total-text,\s*\.sl-app-shell \.ant-pagination-item,\s*\.sl-app-shell \.ant-pagination-prev,\s*\.sl-app-shell \.ant-pagination-next,\s*\.sl-app-shell \.ant-pagination-jump-prev,\s*\.sl-app-shell \.ant-pagination-jump-next,\s*\.sl-app-shell \.ant-pagination-options,\s*\.sl-app-shell \.ant-pagination-options-size-changer,\s*\.sl-app-shell \.ant-pagination-options-quick-jumper\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Pagination items, total text and options must stay shrinkable.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-pagination-total-text,\s*\.sl-app-shell \.ant-pagination-options-quick-jumper\s*\{[^}]*height:\s*auto\s*;[^}]*line-height:\s*1\.4\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Pagination total text and quick jumper labels must wrap instead of clipping.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-pagination-options\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*align-items:\s*center\s*;[^}]*gap:\s*6px\s*;/s,
  'Shared Ant Pagination options must wrap page-size and jumper controls.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-pagination(?:\s*,[^{}]*)?\s*\{[^}]*flex-wrap:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Pagination must not disable wrapping.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-pagination[^{]*\{[^}]*flex-wrap:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Pagination must not disable wrapping through a more specific selector.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-pagination-(?:total-text|options-quick-jumper)(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Pagination total text and quick jumper labels must not force one-line text.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-pagination-(?:total-text|options-quick-jumper)[^{]*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Pagination total text and quick jumper labels must not force one-line text through a more specific selector.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-pagination-(?:total-text|options-quick-jumper)(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Pagination total text and quick jumper labels must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-pagination-(?:total-text|options-quick-jumper)[^{]*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Pagination total text and quick jumper labels must not hide text behind ellipsis through a more specific selector.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-pagination-(?:total-text|options-quick-jumper)(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Pagination total text and quick jumper labels must not clip text.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-pagination-(?:total-text|options-quick-jumper)[^{]*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Pagination total text and quick jumper labels must not clip text through a more specific selector.'
)
const paginationReadableSelectors = [
  '.ant-pagination',
  '.ant-pagination-total-text',
  '.ant-pagination-item',
  '.ant-pagination-prev',
  '.ant-pagination-next',
  '.ant-pagination-jump-prev',
  '.ant-pagination-jump-next',
  '.ant-pagination-options',
  '.ant-pagination-options-size-changer',
  '.ant-pagination-options-quick-jumper',
]

for (const block of blocks) {
  const hasPaginationSelector = block.selectors.some(selector => {
    return selector.includes('.sl-app-shell') && paginationReadableSelectors.some(target => selector.includes(target))
  })

  if (!hasPaginationSelector) {
    continue
  }

  if (hasDeclaration(block.declarations, 'overflow', /hidden/)) {
    fail('Shared Ant Pagination controls must not clip total text, page controls or options through direct or more specific selectors.')
  }
  if (hasDeclaration(block.declarations, 'white-space', /nowrap/)) {
    fail('Shared Ant Pagination controls must not force one-line text through direct or more specific selectors.')
  }
  if (hasDeclaration(block.declarations, 'text-overflow', /ellipsis/)) {
    fail('Shared Ant Pagination controls must not hide total text, page controls or options behind ellipsis.')
  }
  if (hasDeclaration(block.declarations, 'flex-wrap', /nowrap/)) {
    fail('Shared Ant Pagination controls must not disable wrapping through direct or more specific selectors.')
  }
}
requirePattern(
  css,
  /\.sl-app-shell \.ant-form,\s*\.sl-app-shell \.ant-form-item,\s*\.sl-app-shell \.ant-form-item-row,\s*\.sl-app-shell \.ant-form-item-label,\s*\.sl-app-shell \.ant-form-item-control,\s*\.sl-app-shell \.ant-form-item-control-input,\s*\.sl-app-shell \.ant-form-item-control-input-content,\s*\.sl-app-shell \.ant-form-item-explain,\s*\.sl-app-shell \.ant-form-item-extra\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Form containers, labels and helper text must stay shrinkable in the app shell.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-form-item-label\s*\{[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Form label container must not clip wrapped labels.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-form-item-label > label,\s*\.sl-app-shell \.ant-form-item-explain,\s*\.sl-app-shell \.ant-form-item-extra,\s*\.sl-app-shell \.ant-form-item-explain-error\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*height:\s*auto\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Form labels, validation errors and helper text must wrap long URLs, tokens, branches, field names and policy copy.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-form-item-(?:label|explain|extra)(?:\s*> label)?(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Form labels and helper text must not force one-line text.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-form-item-(?:label|explain|extra)(?:\s*> label)?[^{]*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Form labels and helper text must not force one-line text through a more specific selector.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-form-item-(?:label|explain|extra)(?:\s*> label)?(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Form labels and helper text must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-form-item-(?:label|explain|extra)(?:\s*> label)?[^{]*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Form labels and helper text must not hide text behind ellipsis through a more specific selector.'
)
rejectPattern(
  css,
  /\.sl-app-shell \.ant-form-item-(?:label|explain|extra)(?:\s*> label)?(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Form labels and helper text must not clip long text.'
)
rejectPattern(
  css,
  /\.sl-app-shell [^{]*\.ant-form-item-(?:label|explain|extra)(?:\s*> label)?[^{]*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Form labels and helper text must not clip long text through a more specific selector.'
)
requirePattern(
  css,
  /\.ant-modal-root \.ant-modal,\s*\.ant-modal-root \.ant-modal-confirm\s*\{[^}]*max-width:\s*calc\(100vw - 24px\)\s*;/s,
  'Shared Ant Modal roots must stay inside the narrow viewport.'
)
requirePattern(
  css,
  /\.ant-modal-root \.ant-modal-content,\s*\.ant-modal-root \.ant-modal-header,\s*\.ant-modal-root \.ant-modal-body,\s*\.ant-modal-root \.ant-modal-footer,\s*\.ant-modal-root \.ant-modal-confirm-body-wrapper,\s*\.ant-modal-root \.ant-modal-confirm-body,\s*\.ant-modal-root \.ant-modal-confirm-paragraph\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Modal containers must stay shrinkable.'
)
requirePattern(
  css,
  /\.ant-modal-root \.ant-modal-title,\s*\.ant-modal-root \.ant-modal-confirm-title,\s*\.ant-modal-root \.ant-modal-confirm-content,\s*\.ant-modal-root \.ant-modal-confirm-content :where\(p, div, span, code, pre\),\s*\.ant-modal-root \.ant-form-item-label > label,\s*\.ant-modal-root \.ant-form-item-explain,\s*\.ant-modal-root \.ant-select-selection-item\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Modal titles, form copy and confirm content must wrap long paths, hashes, errors and risk text.'
)
requirePattern(
  css,
  /\.ant-modal-root \.ant-input,\s*\.ant-modal-root textarea\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Modal inputs must stay shrinkable without changing editing text behavior.'
)
requirePattern(
  css,
  /\.ant-modal-root \.ant-modal-footer,\s*\.ant-modal-root \.ant-modal-confirm-btns\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*gap:\s*8px\s*;[^}]*justify-content:\s*flex-end\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Modal footer actions must wrap instead of squeezing controls.'
)
requirePattern(
  css,
  /\.ant-modal-root \.ant-modal-footer \.ant-btn,\s*\.ant-modal-root \.ant-modal-confirm-btns \.ant-btn\s*\{[^}]*height:\s*auto\s*;[^}]*min-height:\s*32px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Modal action buttons must keep long labels readable.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal(?:-confirm)?(?:\s*,[^{}]*)?\s*\{[^}]*max-width:\s*none\s*;/s,
  'Shared Ant Modal roots must not disable viewport width containment.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal-(?:title|confirm-title|confirm-content)(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Modal title and confirm content must not force one-line text.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal-(?:title|confirm-title|confirm-content)(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Modal title and confirm content must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal-(?:title|confirm-title|confirm-content)(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Modal title and confirm content must not clip long text.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal(?:-confirm)?-(?:footer|btns)\s*\{[^}]*flex-wrap:\s*nowrap\s*;/s,
  'Shared Ant Modal footer actions must not disable wrapping.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal(?:-confirm)?-(?:footer|btns)\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Modal footer actions must not clip controls.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.(?:ant-form-item-explain|ant-input|ant-select-selection-item)(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Modal form copy and values must not force one-line text.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-form-item-label > label(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Modal form labels must not force one-line text.'
)
rejectPattern(
  css,
  /\.ant-modal-root textarea(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Modal textarea content must not force one-line text.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.(?:ant-form-item-explain|ant-input|ant-select-selection-item)(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Modal form copy and values must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-form-item-label > label(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Modal form labels must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.ant-modal-root textarea(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Modal textarea content must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.(?:ant-form-item-explain|ant-input|ant-select-selection-item)(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Modal form copy and values must not clip long text.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-form-item-label > label(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Modal form labels must not clip long text.'
)
rejectPattern(
  css,
  /\.ant-modal-root textarea(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Modal textarea content must not clip long text.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal-footer \.ant-btn(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Modal footer buttons must not force one-line labels.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal-confirm-btns \.ant-btn(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'Shared Ant Modal confirm buttons must not force one-line labels.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal-footer \.ant-btn(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Modal footer buttons must not hide labels behind ellipsis.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal-confirm-btns \.ant-btn(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'Shared Ant Modal confirm buttons must not hide labels behind ellipsis.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal-footer \.ant-btn(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Modal footer buttons must not clip labels.'
)
rejectPattern(
  css,
  /\.ant-modal-root \.ant-modal-confirm-btns \.ant-btn(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'Shared Ant Modal confirm buttons must not clip labels.'
)
requirePattern(
  css,
  /\.ant-drawer \.ant-drawer-content-wrapper\s*\{[^}]*max-width:\s*calc\(100vw - 24px\)\s*;/s,
  'Shared Ant Drawer content wrapper must stay inside the narrow viewport.'
)
requirePattern(
  css,
  /\.ant-drawer \.ant-drawer-content,\s*\.ant-drawer \.ant-drawer-header,\s*\.ant-drawer \.ant-drawer-body,\s*\.ant-drawer \.ant-drawer-footer,\s*\.ant-drawer \.ant-drawer-header-title,\s*\.ant-drawer \.ant-drawer-title,\s*\.ant-drawer \.ant-drawer-extra\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Drawer containers must stay shrinkable.'
)
requirePattern(
  css,
  /\.ant-drawer \.ant-drawer-header\s*\{[^}]*align-items:\s*flex-start\s*;[^}]*gap:\s*10px\s*;/s,
  'Shared Ant Drawer header must leave room for wrapped titles and actions.'
)
requirePattern(
  css,
  /\.ant-drawer \.ant-drawer-header-title\s*\{[^}]*display:\s*flex\s*;[^}]*align-items:\s*flex-start\s*;[^}]*gap:\s*10px\s*;/s,
  'Shared Ant Drawer header title wrapper must let long titles shrink beside close and extra actions.'
)
requirePattern(
  css,
  /\.ant-drawer \.ant-drawer-title\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Drawer titles must wrap long artifact, audit, scan and evidence context.'
)
requirePattern(
  css,
  /\.ant-drawer \.ant-drawer-extra\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*justify-content:\s*flex-end\s*;[^}]*gap:\s*8px\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Drawer extra actions must wrap instead of clipping.'
)
requirePattern(
  css,
  /\.ant-drawer \.ant-drawer-extra \.ant-space\s*\{[^}]*flex-wrap:\s*wrap\s*;[^}]*justify-content:\s*flex-end\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;/s,
  'Shared Ant Drawer extra Space groups must wrap actions.'
)
requirePattern(
  css,
  /\.ant-drawer \.ant-drawer-footer\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*gap:\s*8px\s*;[^}]*justify-content:\s*flex-end\s*;/s,
  'Shared Ant Drawer footer actions must wrap instead of squeezing controls.'
)
requirePattern(
  css,
  /\.ant-drawer \.ant-drawer-footer \.ant-btn,\s*\.ant-drawer \.ant-drawer-extra \.ant-btn\s*\{[^}]*height:\s*auto\s*;[^}]*min-height:\s*32px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Drawer footer and extra buttons must keep long labels readable.'
)
rejectPattern(
  css,
  /\.ant-drawer \.ant-drawer-content-wrapper(?:\s*,[^{}]*)?\s*\{[^}]*max-width:\s*none\s*;/s,
  'Shared Ant Drawer content wrapper must not disable viewport containment.'
)
rejectPattern(
  css,
  /\.ant-drawer \.ant-drawer-title(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Drawer titles must not force one-line text.'
)
rejectPattern(
  css,
  /\.ant-drawer \.ant-drawer-title(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Drawer titles must not hide text behind ellipsis.'
)
rejectPattern(
  css,
  /\.ant-drawer \.ant-drawer-title(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Drawer titles must not clip long text.'
)
rejectPattern(
  css,
  /\.ant-drawer \.ant-drawer-(?:extra|footer)(?:\s*,[^{}]*)?\s*\{[^}]*flex-wrap:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Drawer action areas must not disable wrapping.'
)
rejectPattern(
  css,
  /\.ant-drawer \.ant-drawer-(?:extra|footer)(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Drawer action areas must not clip controls.'
)
rejectPattern(
  css,
  /\.ant-drawer \.ant-drawer-(?:extra|footer) \.ant-btn(?:\s*,[^{}]*)?\s*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Drawer action buttons must not force one-line labels.'
)
rejectPattern(
  css,
  /\.ant-drawer \.ant-drawer-(?:extra|footer) \.ant-btn(?:\s*,[^{}]*)?\s*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Drawer action buttons must not hide labels behind ellipsis.'
)
rejectPattern(
  css,
  /\.ant-drawer \.ant-drawer-(?:extra|footer) \.ant-btn(?:\s*,[^{}]*)?\s*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Drawer action buttons must not clip labels.'
)
const drawerReadableSelectors = [
  '.ant-drawer-content-wrapper',
  '.ant-drawer-header',
  '.ant-drawer-header-title',
  '.ant-drawer-title',
  '.ant-drawer-extra',
  '.ant-drawer-footer',
]

for (const block of blocks) {
  const hasDrawerSelector = block.selectors.some(selector => {
    return drawerReadableSelectors.some(target => selector.includes(target))
  })

  if (!hasDrawerSelector) {
    continue
  }

  if (hasDeclaration(block.declarations, 'max-width', /none/)) {
    fail('Shared Ant Drawer width containment must not be disabled through direct or more specific selectors.')
  }
  if (hasDeclaration(block.declarations, 'overflow', /hidden/)) {
    fail('Shared Ant Drawer title and action areas must not clip content through direct or more specific selectors.')
  }
  if (hasDeclaration(block.declarations, 'white-space', /nowrap/)) {
    fail('Shared Ant Drawer title and action areas must not force one-line content through direct or more specific selectors.')
  }
  if (hasDeclaration(block.declarations, 'text-overflow', /ellipsis/)) {
    fail('Shared Ant Drawer title and action areas must not hide content behind ellipsis.')
  }
  if (hasDeclaration(block.declarations, 'flex-wrap', /nowrap/)) {
    fail('Shared Ant Drawer action areas must not disable wrapping through direct or more specific selectors.')
  }
}
requirePattern(
  css,
  /\.sl-app-shell \.ant-empty,\s*\.ant-select-dropdown \.ant-empty\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*margin-inline:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*color:\s*var\(--sl-muted\)\s*;/s,
  'Shared Ant Empty fallback must stay readable and contained in app and select dropdown surfaces.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-empty-description,\s*\.ant-select-dropdown \.ant-empty-description\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Shared Ant Empty descriptions must wrap long empty-state explanations.'
)
requirePattern(
  css,
  /\.sl-app-shell \.ant-empty-footer,\s*\.ant-select-dropdown \.ant-empty-footer\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*justify-content:\s*center\s*;[^}]*gap:\s*8px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'Shared Ant Empty footer actions must wrap.'
)
rejectPattern(
  css,
  /\.(?:sl-app-shell|ant-select-dropdown) [^{]*\.ant-empty(?:-description|-footer)?[^{]*\{[^}]*overflow:\s*hidden(?:\s*!important)?\s*;/s,
  'Shared Ant Empty fallback must not clip description or footer content.'
)
rejectPattern(
  css,
  /\.(?:sl-app-shell|ant-select-dropdown) [^{]*\.ant-empty(?:-description)?[^{]*\{[^}]*white-space:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Empty fallback must not force one-line description text.'
)
rejectPattern(
  css,
  /\.(?:sl-app-shell|ant-select-dropdown) [^{]*\.ant-empty(?:-description)?[^{]*\{[^}]*text-overflow:\s*ellipsis(?:\s*!important)?\s*;/s,
  'Shared Ant Empty fallback must not hide descriptions behind ellipsis.'
)
rejectPattern(
  css,
  /\.(?:sl-app-shell|ant-select-dropdown) [^{]*\.ant-empty-footer[^{]*\{[^}]*flex-wrap:\s*nowrap(?:\s*!important)?\s*;/s,
  'Shared Ant Empty fallback footer actions must not disable wrapping.'
)
requirePattern(
  css,
  /\.sl-state-block\s*\{[^}]*display:\s*grid\s*;[^}]*justify-items:\s*center\s*;[^}]*width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*max-width:\s*100%\s*;[^}]*min-height:\s*132px\s*;[^}]*overflow:\s*visible\s*;[^}]*text-align:\s*center\s*;/s,
  'StateBlock must provide a stable unframed status layout.'
)
requirePattern(
  css,
  /\.sl-state-block-compact\s*\{[^}]*min-height:\s*86px\s*;[^}]*padding:\s*18px 12px\s*;/s,
  'StateBlock compact mode must stay dense enough for table empty states.'
)
requirePattern(
  css,
  /\.sl-state-block-error\s+\.sl-state-block-icon\s*\{[^}]*color:\s*var\(--sl-danger\)\s*;/s,
  'StateBlock error tone must use the shared danger token.'
)
requirePattern(
  css,
  /\.sl-state-block-warning\s+\.sl-state-block-icon\s*\{[^}]*color:\s*var\(--sl-warning\)\s*;/s,
  'StateBlock warning tone must use the shared warning token.'
)
requirePattern(
  css,
  /\.sl-state-block-copy strong\s*\{[^}]*display:\s*block\s*;[^}]*max-width:\s*100%\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'StateBlock titles must wrap long unbroken text instead of overflowing their container.'
)
requirePattern(
  css,
  /\.sl-state-block-copy p\s*\{[^}]*min-width:\s*0\s*;[^}]*max-width:\s*520px\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'StateBlock descriptions must wrap long API messages, URLs and paths instead of overflowing.'
)
requirePattern(
  css,
  /\.sl-state-block-action\s*\{[^}]*display:\s*flex\s*;[^}]*flex-wrap:\s*wrap\s*;[^}]*justify-content:\s*center\s*;[^}]*gap:\s*8px\s*;[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;/s,
  'StateBlock action rows must wrap retry buttons and long labels inside narrow containers.'
)
rejectPattern(
  css,
  /\.sl-state-block-copy\s+(?:strong|p)\s*\{[^}]*text-overflow:\s*ellipsis\s*;[^}]*white-space:\s*nowrap\s*;/s,
  'StateBlock copy must not hide long status text behind ellipsis or nowrap.'
)
rejectPattern(
  css,
  /\.sl-state-block-copy\s+(?:strong|p)\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'StateBlock copy must not force long status text onto one line.'
)
rejectPattern(
  css,
  /\.sl-state-block-copy\s+(?:strong|p)\s*\{[^}]*text-overflow:\s*ellipsis\s*;/s,
  'StateBlock copy must not hide long status text behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-state-block-action\s*\{[^}]*flex-wrap:\s*nowrap\s*;/s,
  'StateBlock action rows must not disable wrapping for retry buttons.'
)
rejectPattern(
  css,
  /\.sl-state-block-action\s*\{[^}]*white-space:\s*nowrap\s*;/s,
  'StateBlock action rows must not force retry buttons onto one line.'
)
rejectPattern(
  css,
  /\.sl-state-block-action\s*\{[^}]*overflow:\s*hidden\s*;/s,
  'StateBlock action rows must not clip retry buttons or long labels.'
)
requirePattern(
  selectableTableRow,
  /export const SELECTABLE_TABLE_ROW_INTERACTIVE_TARGET_SELECTOR\s*=[\s\S]*?'button,a,\[role="button"\],\[role="combobox"\],input,textarea,select,\[contenteditable="true"\],\.ant-select,\.ant-select-selector,\.ant-dropdown-trigger'/,
  'Selectable table row helper must share the full interactive-target guard including Ant Select and dropdown triggers.'
)
requirePattern(
  selectableTableRow,
  /export function isSelectableTableRowKeyboardEvent\(event: KeyboardEvent<HTMLElement>\): boolean \{[\s\S]*?target\?\.closest\(SELECTABLE_TABLE_ROW_INTERACTIVE_TARGET_SELECTOR\)[\s\S]*?return event\.key === 'Enter' \|\| event\.key === ' '/,
  'Selectable table row helper must only allow Enter/Space row selection outside nested interactive controls.'
)
requirePattern(
  selectableTableRow,
  /export function createSelectableTableRowProps<TRecord>\([\s\S]*?onClick: \(\) => onSelect\(record\),[\s\S]*?onKeyDown: \(event: KeyboardEvent<HTMLElement>\) => \{[\s\S]*?isSelectableTableRowKeyboardEvent\(event\)[\s\S]*?event\.preventDefault\(\)[\s\S]*?onSelect\(record\)[\s\S]*?tabIndex: 0,[\s\S]*?'aria-selected': selected,[\s\S]*?'aria-controls': selected \? controlsId : undefined,[\s\S]*?'aria-label': label/s,
  'Selectable table row helper must generate click, keyboard, tabIndex, aria-selected, aria-controls and aria-label row props.'
)
requirePattern(
  css,
  /\.sl-selectable-table-card \.ant-table-row\s*\{[^}]*cursor:\s*pointer;[\s\S]*?\.sl-selectable-table-card \.ant-table-row:focus-visible > td\s*\{[^}]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.64\);[\s\S]*?\.sl-selectable-table-card \.ant-table-row\[aria-selected='true'\] > td/s,
  'Selectable table card utility must style pointer, keyboard focus and aria-selected rows.'
)

const primaryButtonChildSelectors = [
  '.sl-app-shell .ant-btn.ant-btn-primary:not(:disabled):not(.ant-btn-disabled) > span',
  '.sl-app-shell .ant-btn.ant-btn-primary:not(:disabled):not(.ant-btn-disabled) .ant-btn-icon',
  '.sl-app-shell .ant-btn.ant-btn-primary:not(:disabled):not(.ant-btn-disabled) .anticon',
  '.sl-app-shell .ant-btn.ant-btn-color-primary.ant-btn-variant-solid:not(:disabled):not(.ant-btn-disabled) > span',
  '.sl-app-shell .ant-btn.ant-btn-color-primary.ant-btn-variant-solid:not(:disabled):not(.ant-btn-disabled) .ant-btn-icon',
  '.sl-app-shell .ant-btn.ant-btn-color-primary.ant-btn-variant-solid:not(:disabled):not(.ant-btn-disabled) .anticon',
  '.sl-dashboard-command-card .ant-btn.ant-btn-primary:not(:disabled):not(.ant-btn-disabled) > span',
  '.sl-dashboard-command-card .ant-btn.ant-btn-primary:not(:disabled):not(.ant-btn-disabled) .ant-btn-icon',
  '.sl-dashboard-command-card .ant-btn.ant-btn-primary:not(:disabled):not(.ant-btn-disabled) .anticon',
  '.sl-dashboard-command-card .ant-btn.ant-btn-color-primary.ant-btn-variant-solid:not(:disabled):not(.ant-btn-disabled) > span',
  '.sl-dashboard-command-card .ant-btn.ant-btn-color-primary.ant-btn-variant-solid:not(:disabled):not(.ant-btn-disabled) .ant-btn-icon',
  '.sl-dashboard-command-card .ant-btn.ant-btn-color-primary.ant-btn-variant-solid:not(:disabled):not(.ant-btn-disabled) .anticon',
  '.sl-dashboard-command-card .ant-btn.ant-btn-primary:not(:disabled):not(.ant-btn-disabled) .sl-action-button-label',
  '.sl-dashboard-command-card .ant-btn.ant-btn-color-primary.ant-btn-variant-solid:not(:disabled):not(.ant-btn-disabled) .sl-action-button-label',
]
for (const selector of primaryButtonChildSelectors) {
  requireSelectorDeclaration(
    blocks,
    selector,
    /color:\s*#fff\s*!important\s*;/,
    `Primary button child selector must force readable white text/icon color: ${selector}`
  )
}

for (const filePath of frontendStateSources) {
  rejectPattern(
    readFile(filePath),
    /<Button\b[^>]*\btype="primary"/s,
    `${path.relative(rootDir, filePath)} must not use raw Ant Button type="primary"; use ActionButton or IconActionButton.`
  )
}

const rawButtonAllowedFiles = new Set([
  actionButtonPath,
  iconActionButtonPath,
])
for (const filePath of frontendStateSources) {
  if (rawButtonAllowedFiles.has(filePath)) {
    continue
  }
  const source = readFile(filePath)
  rejectPattern(
    source,
    /import\s+\{[\s\S]*?\bButton\b[\s\S]*?\}\s+from\s+['"]antd['"]/,
    `${path.relative(rootDir, filePath)} must not import raw Ant Design Button; use ActionButton or IconActionButton.`
  )
  rejectPattern(
    source,
    /<\/?Button\b/,
    `${path.relative(rootDir, filePath)} must not render raw Ant Design Button; use ActionButton or IconActionButton.`
  )
}

rejectPattern(
  css,
  /\.sl-dashboard-command-card\s+\.ant-btn(?:-[a-z-]+)?\s*(?:>| )\s*span\s*\{[^}]*color:\s*(?!inherit\b)/s,
  'Dashboard command button spans must not receive a custom non-inherited text color.'
)

requirePattern(
  css,
  /\.sl-topbar\s*\{[^}]*line-height:\s*1\.2\s*;/s,
  'Topbar must reset Ant Design Header line-height to avoid clipped title text.'
)
requirePattern(
  css,
  /\.sl-topbar-title\s*\{[^}]*display:\s*block\s*;[^}]*min-height:\s*26px\s*;[^}]*padding-block:\s*2px\s*;[^}]*line-height:\s*1\.4\s*;/s,
  'Topbar title must use line-height, min-height and padding that prevent vertical clipping.'
)
requirePattern(
  css,
  /\.sl-topbar-desc\s*\{[^}]*line-height:\s*1\.45\s*;/s,
  'Topbar description must define its own line-height.'
)
requirePattern(
  css,
  /\.sl-project-cockpit-status\s+span:not\(\.sl-live-dot\)\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Project cockpit status text must wrap instead of using nowrap ellipsis for knowledge/source context.'
)
requirePattern(
  css,
  /:is\([\s\S]*?\.sl-dashboard-status,[\s\S]*?\.sl-project-cockpit-status,[\s\S]*?\.sl-scan-status-line,[\s\S]*?\.sl-graph-status-line,[\s\S]*?\.sl-execution-status-line,[\s\S]*?\.sl-agent-status-line,[\s\S]*?\.sl-artifact-cockpit-status,[\s\S]*?\.sl-audit-status-line,[\s\S]*?\.sl-ci-status-line,[\s\S]*?\.sl-pr-status-line,[\s\S]*?\.sl-issue-status-line,[\s\S]*?\.sl-autorepair-status-line[\s\S]*?\)\s+span:not\(\.sl-live-dot\)\s*\{[^}]*max-width:\s*100%\s*;[^}]*min-width:\s*0\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Core route status line text must share a late wrap/no-ellipsis guard.'
)
requirePattern(
  projectDetail,
  /<div className="sl-project-cockpit-status">[\s\S]*?<span className=\{`sl-live-dot[\s\S]*?<span>\{activeScanCount > 0 \? `\$\{activeScanCount\} 个扫描任务运行中` : '分析主链路待命'\}<\/span>[\s\S]*?<span>\{repos\.length\} repos<\/span>[\s\S]*?<span>\{scans\.length\} scans<\/span>[\s\S]*?\{latestScanTaskId && <span>knowledge source #\{latestScanTaskId\}<\/span>\}/s,
  'ProjectDetail cockpit status DOM must keep the stable status span structure covered by readability smoke.'
)
requirePattern(
  css,
  /\.sl-project-next-action-actions\s+\.sl-action-button\[disabled\],[\s\S]*?\.sl-project-next-action-actions\s+\.ant-btn\.ant-btn-disabled\s*\{[^}]*border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.16\)\s*!important\s*;[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.08\)\s*!important\s*;[^}]*color:\s*rgba\(255,\s*255,\s*255,\s*0\.68\)\s*!important\s*;[^}]*opacity:\s*1\s*!important\s*;[^}]*-webkit-text-fill-color:\s*rgba\(255,\s*255,\s*255,\s*0\.68\)\s*!important\s*;/s,
  'Project next action disabled buttons must keep readable text on the dark hero surface.'
)
requirePattern(
  css,
  /\.sl-project-next-action-actions\s+\.sl-action-button\[disabled\]\s+:where\(\.ant-btn-icon,\s*\.anticon,\s*svg,\s*span,\s*\.sl-action-button-label\),[\s\S]*?\.sl-project-next-action-actions\s+\.ant-btn\.ant-btn-disabled\s+:where\(\.ant-btn-icon,\s*\.anticon,\s*svg,\s*span,\s*\.sl-action-button-label\)\s*\{[^}]*color:\s*inherit\s*!important\s*;[^}]*fill:\s*currentColor\s*!important\s*;[^}]*stroke:\s*currentColor\s*!important\s*;[^}]*-webkit-text-fill-color:\s*currentColor\s*!important\s*;/s,
  'Project next action disabled button descendants must inherit readable disabled text color.'
)
requirePattern(
  appShellUiSmokeSpec,
  /const coreStatusLineSelector = \[[\s\S]*?'\.sl-dashboard-status'[\s\S]*?'\.sl-project-cockpit-status'[\s\S]*?'\.sl-scan-status-line'[\s\S]*?'\.sl-graph-status-line'[\s\S]*?'\.sl-execution-status-line'[\s\S]*?'\.sl-agent-status-line'[\s\S]*?'\.sl-artifact-cockpit-status'[\s\S]*?'\.sl-audit-status-line'[\s\S]*?'\.sl-ci-status-line'[\s\S]*?'\.sl-pr-status-line'[\s\S]*?'\.sl-issue-status-line'[\s\S]*?'\.sl-autorepair-status-line'[\s\S]*?\]\.join\(', '\)[\s\S]*?async function assertCoreStatusLinesReadableOnCurrentPage\(page: Page, routeCase: RouteCase, viewportName: string\)[\s\S]*?return guardedStatusLineCount[\s\S]*?guardedStatusLineCount:\s*await assertCoreStatusLinesReadableOnCurrentPage\(page, routeCase, viewportName\)[\s\S]*?guardedStatusLineCount \+= routeProof\.guardedStatusLineCount[\s\S]*?toBeGreaterThanOrEqual\(12\)[\s\S]*?guardedStatusLineCount,[\s\S]*?'project-cockpit-status-wraps-without-ellipsis'[\s\S]*?'core-route-status-lines-wrap-without-ellipsis'[\s\S]*?'project-next-action-disabled-buttons-readable-on-dark-surface'/s,
  'App shell smoke marker must expose project cockpit status, core status-line and disabled next-action readability assertions.'
)
requirePattern(
  css,
  /\.sl-project-next-action\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-project-next-action-checks\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);[\s\S]*?\.sl-project-next-action-actions\s*\{[\s\S]*?display:\s*flex;[\s\S]*?\.sl-project-next-action-actions\s+\.ant-btn-default\s*\{[\s\S]*?color:\s*#e2e8f0;/,
  'Project workspace next action rail must have dedicated readable dark-surface styles.'
)
requirePattern(
  css,
  /@media \(max-width:\s*1200px\)\s*\{[\s\S]*?\.sl-project-next-action-checks\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*;/,
  'Project workspace next action checks must collapse to two columns before mobile widths.'
)
requirePattern(
  css,
  /@media \(max-width:\s*360px\)\s*\{[\s\S]*?\.sl-project-next-action-checks\s*\{[^}]*grid-template-columns:\s*1fr\s*;/,
  'Project workspace evidence checks must collapse to one column on 320px screens without pushing actions behind them.'
)
requirePattern(
  css,
  /@media \(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-analysis-readiness-actions\s*\{[^}]*align-items:\s*stretch\s*;[^}]*flex-direction:\s*column\s*;[\s\S]*?\.sl-analysis-readiness-actions\s+\.ant-space-item\s*\{[^}]*width:\s*100%\s*;/s,
  'Analysis readiness actions must stack and stretch on mobile to prevent clipped controls.'
)
requirePattern(
  css,
  /@media \(max-width:\s*360px\)\s*\{[\s\S]*?\.sl-app-shell\s+\.ant-btn,\s*\.sl-action-button\s*\{[^}]*height:\s*auto\s*;[^}]*min-height:\s*32px\s*;[^}]*padding-block:\s*4px\s*;[\s\S]*?\.sl-action-button\.ant-btn-sm\s*\{[^}]*min-height:\s*28px\s*;[^}]*padding-block:\s*3px\s*;[\s\S]*?\.sl-action-button-label,\s*\.sl-inline-link\s+\.sl-action-button-label\s*\{[^}]*line-height:\s*1\.25\s*;[^}]*white-space:\s*normal\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;/s,
  'Narrow viewport action buttons must allow wrapped labels without clipping.'
)

requirePattern(
  css,
  /\.sl-dashboard-command-label\s*\{/,
  'Dashboard command card label styles must use a dedicated class instead of broad span selectors.'
)
requirePattern(
  css,
  /\.sl-dashboard-command-value\s*\{/,
  'Dashboard command card value styles must use a dedicated class instead of broad strong selectors.'
)
requirePattern(
  css,
  /\.sl-dashboard-command-label\s*\{[^}]*overflow:\s*visible;[^}]*overflow-wrap:\s*anywhere;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;/s,
  'Dashboard command card labels must wrap instead of hiding key workflow labels behind ellipsis.'
)
requirePattern(
  css,
  /\.sl-dashboard-command-value\s*\{[^}]*overflow:\s*visible;[^}]*overflow-wrap:\s*anywhere;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;/s,
  'Dashboard command card values must wrap instead of hiding repo, scan or chunk status behind ellipsis.'
)
requirePattern(
  css,
  /\.sl-dashboard-command-disabled-reason\s*\{[^}]*background:\s*#ffffff;[^}]*color:\s*var\(--sl-muted\);[^}]*overflow:\s*visible;[^}]*overflow-wrap:\s*anywhere;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;/s,
  'Dashboard command disabled reasons must be visible, wrapped and readable instead of hidden in disabled button state.'
)
rejectPattern(
  css,
  /\.sl-dashboard-command-(?:label|value|disabled-reason)\s*\{[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s,
  'Dashboard command card text and disabled reasons must not use nowrap ellipsis.'
)
rejectPattern(
  css,
  /\.sl-dashboard-command-card-head\s+span\s*\{/,
  'Dashboard command card labels must not use broad head span selectors; they can override button labels.'
)
rejectPattern(
  css,
  /\.sl-dashboard-command-card-head\s+strong\s*\{/,
  'Dashboard command card values must not use broad head strong selectors; use dedicated classes.'
)
rejectPattern(
  css,
  /\.sl-dashboard-command-card\s+span\s*\{/,
  'Do not style all spans inside dashboard command cards; this overrides Ant Design button labels.'
)
rejectPattern(
  css,
  /\.sl-dashboard-command-card\s+strong\s*\{/,
  'Do not style all strong tags inside dashboard command cards; scope typography to the card head.'
)

requirePattern(
  dashboard,
  /<Table[\s\S]*?className="sl-dashboard-recent-table"[\s\S]*?scroll=\{\{ x: 760 \}\}/,
  'Dashboard recent scans table must expose a stable sl-dashboard-recent-table class while retaining horizontal scroll ownership.'
)
requirePattern(
  css,
  /\.sl-dashboard-recent-table\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?\.sl-dashboard-recent-table \.ant-table-container,[\s\S]*?\.sl-dashboard-recent-table \.ant-table-wrapper,[\s\S]*?\.sl-dashboard-recent-table \.ant-spin-nested-loading,[\s\S]*?\.sl-dashboard-recent-table \.ant-spin-container\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-dashboard-recent-table \.ant-table-content\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*auto;/s,
  'Dashboard recent scans table CSS must constrain table wrappers and let .ant-table-content own horizontal scrolling.'
)
requirePattern(
  appShellUiSmokeSpec,
  /const recentScan = \{[\s\S]*?repositoryName:\s*'source-lens-dashboard-recent-scan-table-long-repository-name'[\s\S]*?\/api\/dashboard\/recent-scans[\s\S]*?result\(\[recentScan\]\)[\s\S]*?async function expectDashboardRecentTableScrollerContained\(page: Page, label: string\)[\s\S]*?\.sl-dashboard-recent-table[\s\S]*?dashboard recent table must not escape viewport left[\s\S]*?dashboard recent table must not escape viewport right[\s\S]*?\.ant-table-content[\s\S]*?overflowX[\s\S]*?routeCase\.path === '\/dashboard'[\s\S]*?expectDashboardRecentTableScrollerContained\(page, `\$\{routeCase\.path\}:\$\{viewportName\}`\)[\s\S]*?dashboard-recent-table-scroller-contained/s,
  'App shell UI smoke must verify Dashboard recent scans table scroller containment on /dashboard across the viewport matrix.'
)
requirePattern(
  dashboard,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'Dashboard must use the shared ActionButton primitive for top-level actions.'
)
requirePattern(
  dashboard,
  /<span className="sl-dashboard-command-label">\{item\.label\}<\/span>/,
  'Dashboard command cards must render labels with the dedicated label class.'
)
requirePattern(
  dashboard,
  /<strong className="sl-dashboard-command-value">\{item\.value\}<\/strong>/,
  'Dashboard command cards must render values with the dedicated value class.'
)
requirePattern(
  dashboard,
  /interface DashboardCommandItem \{[\s\S]*?disabled\?: boolean[\s\S]*?disabledReason\?: string/s,
  'Dashboard command items must carry a visible disabledReason for blocked high-value actions.'
)
requirePattern(
  dashboard,
  /item\.disabled && item\.disabledReason[\s\S]*?<div className="sl-dashboard-command-disabled-reason" role="note">[\s\S]*?\{item\.disabledReason\}/,
  'Dashboard command cards must render disabledReason as visible note text, not only as a disabled button or tooltip.'
)
requirePattern(
  dashboard,
  /const nextAction:\s*DashboardNextAction\s*=\s*useMemo\(\(\)\s*=>\s*\{[\s\S]*?key:\s*'connect-repository'[\s\S]*?key:\s*'watch-running-scan'[\s\S]*?key:\s*'start-first-scan'[\s\S]*?key:\s*'inspect-code-chunks'[\s\S]*?key:\s*'review-risk-report'[\s\S]*?key:\s*'ask-code-qa'/,
  'Dashboard must compute a state-driven recommended next action across repository, scan, code_chunks, risk and QA states.'
)
requirePattern(
  dashboard,
  /<DashboardNextActionPanel action=\{nextAction\}\s*\/>/,
  'Dashboard must render the recommended next action panel before the command grid.'
)
requirePattern(
  dashboard,
  /interface DashboardProductPlane[\s\S]*?key:\s*'front-office' \| 'developer-console' \| 'back-office'[\s\S]*?const productPlanes = useMemo<DashboardProductPlane\[\]>\(\(\) => \{[\s\S]*?label:\s*'前台体验'[\s\S]*?label:\s*'开发者控制台'[\s\S]*?label:\s*'后台治理'[\s\S]*?<DashboardProductPlaneMap planes=\{productPlanes\} \/>[\s\S]*?function DashboardProductPlaneMap[\s\S]*?aria-label="继承产品三平面（P0冻结）"[\s\S]*?不定义 AIOS 当前产品路线、开发任务或阶段投入[\s\S]*?data-sl-dashboard-plane=\{plane\.key\}/,
  'Dashboard must render a page-level three-plane product structure map for front office, developer console and back-office governance.'
)
requirePattern(
  dashboard,
  /function buildDashboardAgentChatHandoffUrl\(scan: RecentScan, question: string\)[\s\S]*?\/agent-chat\?\$\{new URLSearchParams\(\{[\s\S]*?handoff:\s*'code-understanding'[\s\S]*?source:\s*'DASHBOARD_CODE_QA_ENTRY'[\s\S]*?scanTaskId:\s*String\(scan\.id\)[\s\S]*?const qaTarget = codeKnowledgeReady && latestSuccessfulScan[\s\S]*?buildDashboardAgentChatHandoffUrl\(latestSuccessfulScan, qaQuestion\)[\s\S]*?primaryLabel:\s*'进入 QA'[\s\S]*?onPrimary:\s*\(\) => navigate\(buildDashboardAgentChatHandoffUrl\(/,
  'Dashboard QA entry must route through the single AgentChat code-understanding handoff surface instead of a parallel project tab QA entry.'
)
rejectPattern(
  dashboard,
  /tab:\s*'qa'|\/projects\/\$\{latestSuccessfulScan\.projectId\}\?\$\{new URLSearchParams\(\{\s*tab:\s*'qa'/,
  'Dashboard must not reintroduce a parallel project tab QA URL as the primary code QA product entry.'
)
requirePattern(
  dashboard,
  /后台治理不等于 RBAC、多租户或生产部署已完成/,
  'Dashboard three-plane map must explicitly avoid claiming RBAC, multi-tenant or production deployment completion.'
)
requirePattern(
  dashboard,
  /interface DashboardExecutiveSignal[\s\S]*?label:\s*string[\s\S]*?const executiveSignals = useMemo<DashboardExecutiveSignal\[\]>\(\(\) => \[[\s\S]*?label:\s*'阶段进度'[\s\S]*?label:\s*'继承链路状态'[\s\S]*?label:\s*'风险阻塞'[\s\S]*?label:\s*'当前项目任务'[\s\S]*?value:\s*'P0-05 Baseline Slicing'[\s\S]*?<DashboardExecutiveBriefing signals=\{executiveSignals\} \/>[\s\S]*?function DashboardExecutiveBriefing[\s\S]*?aria-label="管理层决策简报"[\s\S]*?不证明 P0 Gate 已通过、VTSR 已测量、可信 Agent 闭环已实现或系统达到生产可用[\s\S]*?P0 Gate: NOT_READY[\s\S]*?data-sl-dashboard-executive-signal=\{signal\.key\}/,
  'Dashboard must render an executive decision briefing with phase, quality, risk and investment signals plus explicit no-overclaim boundary copy.'
)
requirePattern(
  dashboard,
  /function DashboardNextActionPanel\(\{ action \}:[\s\S]*?aria-label="继承产品运行建议（非项目任务）"[\s\S]*?不生成 AIOS 开发任务，也不改变 P0-05 的唯一优先级[\s\S]*?aria-label="主链路证据成熟度"[\s\S]*?aria-label="当前阻塞项"/,
  'Dashboard next action panel must expose recommendation, evidence maturity and blocker semantics.'
)
requirePattern(
  css,
  /\.sl-dashboard-executive-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-dashboard-executive-head h2,\s*\.sl-dashboard-executive-head p,\s*\.sl-dashboard-executive-card span,\s*\.sl-dashboard-executive-card strong,\s*\.sl-dashboard-executive-card p\s*\{[^}]*overflow:\s*visible;[^}]*overflow-wrap:\s*anywhere;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;[^}]*word-break:\s*break-word;/s,
  'Dashboard executive briefing must use a stable four-column desktop grid and wrap all decision text without clipping.'
)
requirePattern(
  css,
  /\.sl-dashboard-product-plane-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s,
  'Dashboard three-plane product map must use a stable three-column desktop grid.'
)
requirePattern(
  css,
  /@media \(max-width:\s*1200px\)[\s\S]*?\.sl-dashboard-product-plane-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  'Dashboard three-plane product map must collapse to two columns below 1200px.'
)
requirePattern(
  css,
  /@media \(max-width:\s*960px\)[\s\S]*?\.sl-dashboard-executive-head,[\s\S]*?\.sl-dashboard-product-plane-head,[\s\S]*?\.sl-dashboard-product-plane-card-head\s*\{[\s\S]*?grid-template-columns:\s*1fr;/s,
  'Dashboard executive and three-plane headers must switch to single-column layout before narrow tablet widths can squeeze labels and tags.'
)
requirePattern(
  css,
  /@media \(max-width:\s*720px\)[\s\S]*?\.sl-dashboard-product-plane-head,[\s\S]*?\.sl-dashboard-product-plane-grid,[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\.sl-dashboard-product-plane-card \.ant-btn\s*\{[\s\S]*?width:\s*100%;[\s\S]*?justify-content:\s*center;/s,
  'Dashboard three-plane product map must collapse to one column with full-width actions on mobile.'
)
requirePattern(
  css,
  /\.sl-dashboard-product-plane-card \.ant-tag\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;[^}]*overflow:\s*visible;[^}]*overflow-wrap:\s*anywhere;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;[^}]*word-break:\s*break-word;/s,
  'Dashboard three-plane status tags must be shrinkable and wrap without clipping.'
)
requirePattern(
  css,
  /\.sl-dashboard-product-plane-card-head span,\s*\.sl-dashboard-product-plane-card-head strong,\s*\.sl-dashboard-product-plane-card p,\s*\.sl-dashboard-product-plane-pages span\s*\{[^}]*overflow:\s*visible;[^}]*overflow-wrap:\s*anywhere;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;[^}]*word-break:\s*break-word;/s,
  'Dashboard three-plane product map labels, descriptions and page chips must wrap without clipping.'
)
requirePattern(
  css,
  /\.sl-dashboard-next-action\s*\{[\s\S]*?border:\s*1px solid var\(--sl-border\)[\s\S]*?\.sl-dashboard-next-evidence\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
  'Dashboard next action panel must have a stable evidence grid layout.'
)
requirePattern(
  css,
  /@media \(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-dashboard-next-main\s*\{[\s\S]*?grid-template-columns:\s*1fr[\s\S]*?\.sl-dashboard-next-actions \.ant-btn\s*\{[\s\S]*?width:\s*100%[\s\S]*?\.sl-dashboard-next-evidence\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
  'Dashboard next action panel must collapse main layout, buttons and evidence grid at 720px.'
)
requirePattern(
  css,
  /@media \(max-width:\s*360px\)\s*\{[\s\S]*?\.sl-dashboard-next-action\s*\{[\s\S]*?padding:\s*12px[\s\S]*?\.sl-dashboard-next-title\s*\{[\s\S]*?font-size:\s*18px[\s\S]*?\.sl-dashboard-next-evidence\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
  'Dashboard next action panel must collapse evidence grid to one column at 360px.'
)
rejectPattern(
  dashboard,
  /<Button\b/,
  'Dashboard must not reintroduce raw Ant Design Button for action controls.'
)
requirePattern(
  dashboard,
  /if \(loadError\) \{[\s\S]*?key:\s*'recover-dashboard'[\s\S]*?primaryLabel:\s*'重试加载'[\s\S]*?onPrimary:\s*\(\) => loadDashboard\(true\)[\s\S]*?title=\{stats \|\| scans\.length > 0 \? '仪表盘刷新失败，已保留上次成功数据' : '仪表盘数据加载失败'\}[\s\S]*?description=\{loadError\}/,
  'Dashboard data failures must make retry the state-driven hero primary action while preserving cached-data failure disclosure.'
)
requirePattern(
  projectDetail,
  /<Table[\s\S]*?className="sl-workflow-table sl-project-repository-table"[\s\S]*?scroll=\{\{ x: 900 \}\}/,
  'ProjectDetail repository workflow table must expose a stable sl-project-repository-table class while retaining horizontal scroll ownership.'
)
requirePattern(
  projectDetail,
  /<Table[\s\S]*?className="sl-workflow-table sl-project-scan-table"[\s\S]*?scroll=\{\{ x: 920 \}\}/,
  'ProjectDetail scan workflow table must expose a stable sl-project-scan-table class while retaining horizontal scroll ownership.'
)
requirePattern(
  css,
  /\.sl-workflow-table\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?\.sl-workflow-table \.ant-table-container,[\s\S]*?\.sl-workflow-table \.ant-table-wrapper,[\s\S]*?\.sl-workflow-table \.ant-spin-nested-loading,[\s\S]*?\.sl-workflow-table \.ant-spin-container\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-workflow-table \.ant-table-content\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*auto;/s,
  'ProjectDetail workflow table CSS must constrain table wrappers and let .ant-table-content own horizontal scrolling.'
)
requirePattern(
  appShellUiSmokeSpec,
  /const repository = \{[\s\S]*?name:\s*'project-detail-repository-table-long-repository-name'[\s\S]*?const scanTask = \{[\s\S]*?branch:\s*'feature\/project-detail-workflow-table-scroller-containment-proof'[\s\S]*?\/api\/projects\/\$\{projectId\}\/repositories[\s\S]*?result\(\[repository\]\)[\s\S]*?\/api\/projects\/\$\{projectId\}\/scan-tasks[\s\S]*?items:\s*\[scanTask\][\s\S]*?\/api\/projects\/\$\{projectId\}\/code-chunks\/search[\s\S]*?MOCKED_APP_SHELL_STATUS_PROBE[\s\S]*?async function expectProjectDetailWorkflowTablesContained\(page: Page, label: string\)[\s\S]*?getByRole\('tab', \{ name: '仓库管理' \}\)\.click\(\)[\s\S]*?\.sl-project-repository-table[\s\S]*?getByRole\('tab', \{ name: '扫描任务' \}\)\.click\(\)[\s\S]*?\.sl-project-scan-table[\s\S]*?routeCase\.path === `\/projects\/\$\{projectId\}`[\s\S]*?expectProjectDetailWorkflowTablesContained\(page, `\$\{routeCase\.path\}:\$\{viewportName\}`\)[\s\S]*?project-detail-workflow-table-scroller-contained/s,
  'App shell UI smoke must verify ProjectDetail repository and scan workflow table scroller containment across the viewport matrix.'
)
requirePattern(
  projectDetail,
  /nextProjectError = projectResult\.status === 'rejected'[\s\S]*?formatApiError\(projectResult\.reason, '加载项目详情失败'\)[\s\S]*?workspaceViewState === 'FATAL_LOAD'[\s\S]*?label="重新加载项目工作区"/,
  'ProjectDetail initial project loading failure must enter the isolated fatal state with a precise workspace retry action.'
)
requirePattern(
  projectDetail,
  /nextRepoError = reposResult\.status === 'rejected'[\s\S]*?formatApiError\(reposResult\.reason, '加载仓库列表失败'\)[\s\S]*?setWorkspacePhase\(hadTrustedSnapshot \? 'STALE_REFRESH' : 'FATAL_LOAD'\)/,
  'ProjectDetail repository core failure must preserve only a previously trusted snapshot and otherwise enter the fatal state.'
)
requirePattern(
  projectDetail,
  /nextScanError = scansResult\.status === 'rejected'[\s\S]*?formatApiError\(scansResult\.reason, '加载扫描任务失败'\)[\s\S]*?setWorkspacePhase\(hadTrustedSnapshot \? 'STALE_REFRESH' : 'FATAL_LOAD'\)/,
  'ProjectDetail scan core failure must preserve only a previously trusted snapshot and otherwise enter the fatal state.'
)
requirePattern(
  projectDetail,
  /nextOverviewError = formatApiError\([\s\S]*?'加载总览数据失败'\)[\s\S]*?title="项目总览加载失败"[\s\S]*?label="重新加载总览"/,
  'ProjectDetail overview failures must expose a retryable StateBlock.'
)
requirePattern(
  scanTaskDetail,
  /ownedSurface\.state === 'FATAL_LOAD'[\s\S]*?data-sl-scan-state="FATAL_LOAD"[\s\S]*?data-sl-primary-count="1"[\s\S]*?title="扫描报告加载失败"[\s\S]*?description=\{ownedSurface\.error \|\|[\s\S]*?label="重新加载扫描报告"/,
  'ScanTaskDetail top-level loading failure must isolate the fatal state with one precise retry action.'
)
requirePattern(
  scanTaskDetail,
  /codeKnowledgePromise[\s\S]*?scanLoadError\(error, '加载 code_chunks 状态失败'\)[\s\S]*?setCodeKnowledgeError\(codeKnowledgeResult\.error\)[\s\S]*?label="重新读取 code_chunks"/,
  'ScanTaskDetail code_chunks status failures must be locally visible and retryable.'
)
requirePattern(
  scanTaskDetail,
  /function codeKnowledgeGate\(signal: CodeKnowledgeSignal\)[\s\S]*?代码知识库门禁已开放[\s\S]*?代码知识库门禁未开放[\s\S]*?code_chunks 状态读取失败[\s\S]*?当前 code_chunks 为 0[\s\S]*?role="note"[\s\S]*?aria-label="代码知识库操作门禁说明"[\s\S]*?\{gate\.title\}[\s\S]*?\{gate\.detail\}/s,
  'ScanTaskDetail code knowledge actions must render an explicit visible gate reason for ready, error and zero-chunk states.'
)
requirePattern(
  scanTaskDetail,
  /scanGovernanceTimelineApi\.get\(projectId, scanTaskId\)[\s\S]*?setGovernanceError\(scanLoadError\(error, '加载修复治理时间线失败'\)\)[\s\S]*?label="重新加载治理时间线"/,
  'ScanTaskDetail governance timeline failures must be locally visible and retryable.'
)
requirePattern(
  projects,
  /<Table[\s\S]*?className="sl-project-list-table"[\s\S]*?scroll=\{\{ x: 900 \}\}/,
  'Projects table must expose a stable sl-project-list-table class while retaining horizontal scroll ownership.'
)
requirePattern(
  projects,
  /interface ProjectPortfolioLoopStep[\s\S]*?const leadProject = filtered\[0\] \|\| null[\s\S]*?const leadProjectValue = leadProject[\s\S]*?无匹配项目[\s\S]*?const portfolioLoopSteps = useMemo<ProjectPortfolioLoopStep\[\]>\(\(\) => \[[\s\S]*?创建项目壳[\s\S]*?接入公开仓库[\s\S]*?生成扫描报告[\s\S]*?代码问答与修复[\s\S]*?<ProjectPortfolioLoop steps=\{portfolioLoopSteps\} \/>/s,
  'Projects page must expose a project portfolio intake loop with visible P1-P4 mainline steps and no hidden fallback target.'
)
requirePattern(
  css,
  /\.sl-project-table-card\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?\.sl-project-table-card \.ant-card-body,[\s\S]*?\.sl-project-list-table,[\s\S]*?\.sl-project-table-card \.ant-table-container,[\s\S]*?\.sl-project-table-card \.ant-table-wrapper,[\s\S]*?\.sl-project-table-card \.ant-spin-nested-loading,[\s\S]*?\.sl-project-table-card \.ant-spin-container\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-project-table-card \.ant-table-content\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*auto;/s,
  'Projects table card CSS must constrain table wrappers and let .ant-table-content own horizontal scrolling.'
)
requirePattern(
  css,
  /\.sl-project-portfolio-loop\s*\{[\s\S]*?overflow-wrap[\s\S]*?\.sl-project-portfolio-loop-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)[\s\S]*?@media \(max-width:\s*1200px\)\s*\{[\s\S]*?\.sl-project-portfolio-loop-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)[\s\S]*?@media \(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-project-portfolio-loop-grid\s*\{[^}]*grid-template-columns:\s*1fr\s*;/s,
  'Projects portfolio intake loop must have desktop, tablet and mobile grid contracts with wrapped text.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function expectProjectsTableScrollerContained\(page: Page, label: string\)[\s\S]*?\.sl-project-list-table[\s\S]*?project table must not escape viewport left[\s\S]*?project table must not escape viewport right[\s\S]*?\.ant-table-content[\s\S]*?overflowX[\s\S]*?routeCase\.path === '\/projects'[\s\S]*?expectProjectsTableScrollerContained\(page, `\$\{routeCase\.path\}:\$\{viewportName\}`\)[\s\S]*?projects-table-scroller-contained/s,
  'App shell UI smoke must verify Projects table scroller containment on /projects across the viewport matrix.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function expectProjectsPortfolioLoopReadable\(page: Page, label: string\)[\s\S]*?\.sl-project-portfolio-loop[\s\S]*?项目组合可信接入闭环[\s\S]*?创建项目壳[\s\S]*?接入公开仓库[\s\S]*?生成扫描报告[\s\S]*?代码问答与修复[\s\S]*?viewportWidth <= 720 \? 1 : viewportWidth <= 1200 \? 2 : 4[\s\S]*?routeCase\.path === '\/projects'[\s\S]*?expectProjectsPortfolioLoopReadable\(page, `\$\{routeCase\.path\}:\$\{viewportName\}`\)[\s\S]*?projects-portfolio-loop-readable-and-responsive/s,
  'App shell UI smoke must verify Projects portfolio intake loop readability and responsive columns.'
)
requirePattern(
  projects,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'Projects page toolbar must use the shared ActionButton primitive for top-level actions.'
)
requirePattern(
  projects,
  /import \{ formatApiError,\s*showApiError \} from '\.\.\/api\/client'/,
  'Projects recoverable list errors must use formatApiError while retaining showApiError toast.'
)
requirePattern(
  projects,
  /const \[projectListError,\s*setProjectListError\] = useState<string \| null>\(null\)[\s\S]*?setProjectListError\(formatApiError\(error,\s*'加载项目列表失败'\)\)[\s\S]*?showApiError\(error,\s*'加载项目列表失败'\)/,
  'Projects list loading failure must keep an in-page formatted error state and toast.'
)
requirePattern(
  projects,
  /<StateBlock[\s\S]*?tone="error"[\s\S]*?title="项目列表加载失败"[\s\S]*?description=\{projectListError\}[\s\S]*?label="重新加载项目"/,
  'Projects list loading failure must render a retryable StateBlock error instead of a misleading empty state.'
)
requirePattern(
  projects,
  /const staleRefreshError = Boolean\(projectListError && projects\.length > 0\)[\s\S]*?\{staleRefreshError && \([\s\S]*?compact[\s\S]*?tone="error"[\s\S]*?title="项目刷新失败，已保留上次成功数据"[\s\S]*?description=\{projectListError\}[\s\S]*?type="primary"[\s\S]*?label="重新加载项目"/,
  'Projects refresh failure must preserve already loaded table data and show a compact retryable error state.'
)
requirePattern(
  projects,
  /const initialLoading = loading && projects\.length === 0 && !projectListError[\s\S]*?const fatalLoadError = Boolean\(projectListError && projects\.length === 0\)[\s\S]*?const staleRefreshError = Boolean\(projectListError && projects\.length > 0\)[\s\S]*?const confirmedEmpty = !loading && !projectListError && projects\.length === 0[\s\S]*?const filteredEmpty = !loading && !projectListError && projects\.length > 0 && filtered\.length === 0[\s\S]*?initialLoading \?[\s\S]*?正在加载项目组合[\s\S]*?fatalLoadError \?[\s\S]*?项目列表加载失败[\s\S]*?confirmedEmpty \?[\s\S]*?还没有项目[\s\S]*?没有匹配的项目/,
  'Projects must arbitrate initial loading, fatal failure, confirmed empty and filtered-empty states without rendering misleading portfolio data.'
)
requirePattern(
  projects,
  /import IconActionButton from '\.\.\/components\/ui\/IconActionButton'/,
  'Projects table actions must use the shared IconActionButton primitive.'
)
requirePattern(
  projects,
  /<ActionButton\s+aria-label="刷新项目列表"[\s\S]*?label="刷新"\s*\/>/,
  'Projects toolbar refresh action must use ActionButton with a visible stable label.'
)
requirePattern(
  projects,
  /<ActionButton[\s\S]*?aria-label="新建项目"[\s\S]*?type=\{!filteredEmpty && !staleRefreshError \? 'primary' : 'default'\}[\s\S]*?label="新建项目"/,
  'Projects toolbar create action must yield primary semantics to recovery and clear-filter actions.'
)
requirePattern(
  projects,
  /<ActionButton\s+type="link"\s+className="sl-inline-link"\s+onClick=\{\(\)\s*=>\s*navigate\(`\/projects\/\$\{record\.id\}`\)\}\s+label=\{value\}\s*\/>/,
  'Projects table project name link must use ActionButton.'
)
requirePattern(
  projects,
  /<IconActionButton[\s\S]*?label=\{`查看 \$\{record\.name\} 工作台`\}[\s\S]*?tooltip="查看工作台"[\s\S]*?icon=\{<EyeOutlined\s+\/>\}[\s\S]*?navigate\(`\/projects\/\$\{record\.id\}`\)[\s\S]*?\/>/,
  'Projects table workspace action must use IconActionButton.'
)
requirePattern(
  projects,
  /<IconActionButton[\s\S]*?label=\{`编辑 \$\{record\.name\}`\}[\s\S]*?tooltip="编辑项目"[\s\S]*?icon=\{<EditOutlined\s+\/>\}[\s\S]*?openEditModal\(record\)[\s\S]*?\/>/,
  'Projects table edit action must use IconActionButton.'
)
requirePattern(
  projects,
  /<IconActionButton\s+label=\{`删除 \$\{record\.name\}`\}\s+tooltip="删除项目"\s+size="small"\s+danger\s+icon=\{<DeleteOutlined\s+\/>\}\s*\/>/,
  'Projects table delete action must use IconActionButton.'
)
rejectPattern(
  projects,
  /<Button\b/,
  'Projects must not reintroduce raw Ant Design Button for project actions.'
)
requirePattern(
  executionTasks,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'ExecutionTasks toolbar must use the shared ActionButton primitive.'
)
requirePattern(
  executionTasks,
  /import \{ formatApiError,\s*showApiError \} from '\.\.\/api\/client'/,
  'ExecutionTasks recoverable query errors must use formatApiError while retaining showApiError toast.'
)
requirePattern(
  executionTasks,
  /const \[listError,\s*setListError\] = useState<string \| null>\(null\)[\s\S]*?const \[detailError,\s*setDetailError\] = useState<string \| null>\(null\)/,
  'ExecutionTasks must keep separate list and detail recoverable error states.'
)
requirePattern(
  executionTasks,
  /setListError\(formatApiError\(error,\s*'加载执行任务失败'\)\)[\s\S]*?showApiError\(error,\s*'加载执行任务失败'\)/,
  'ExecutionTasks list loading failure must set an in-page formatted error and keep toast feedback.'
)
requirePattern(
  executionTasks,
  /setDetailError\(formatApiError\(error,\s*'加载任务详情失败'\)\)[\s\S]*?showApiError\(error,\s*'加载任务详情失败'\)/,
  'ExecutionTasks detail loading failure must set an in-page formatted error and keep toast feedback.'
)
requirePattern(
  executionTasks,
  /title="执行任务加载失败"[\s\S]*?description=\{listError\}[\s\S]*?label="重新加载任务"[\s\S]*?title="任务详情加载失败"[\s\S]*?description=\{detailError\}[\s\S]*?label="重新加载任务"/,
  'ExecutionTasks list and detail failures must render retryable StateBlock error states.'
)
requirePattern(
  executionTasks,
  /import IconActionButton from '\.\.\/components\/ui\/IconActionButton'/,
  'ExecutionTasks dense task actions must use the shared IconActionButton primitive.'
)
requirePattern(
  executionTasks,
  /import \{ createSelectableTableRowProps \} from '\.\.\/components\/ui\/selectableTableRow'/,
  'ExecutionTasks detail selection must use the shared selectable table row helper instead of local keyboard handling.'
)
rejectPattern(
  executionTasks,
  /handleRowKeyDown|KeyboardEvent<HTMLElement>/,
  'ExecutionTasks must not keep page-local row keyboard handlers after adopting the shared selectable table row helper.'
)
requirePattern(
  executionTasks,
  /<ActionButton\s+aria-label="刷新执行任务"[\s\S]*?label="刷新"\s*\/>/,
  'ExecutionTasks toolbar refresh action must use ActionButton.'
)
requirePattern(
  executionTasks,
  /<ActionButton[\s\S]*?aria-label=\{`查看任务 #\$\{record\.id\} 详情`\}[\s\S]*?type="link"[\s\S]*?event\.stopPropagation\(\)[\s\S]*?loadDetail\(record\)[\s\S]*?icon=\{<ScheduleOutlined\s+\/>\}[\s\S]*?label=\{TASK_TYPE_LABEL\[type\] \|\| type\}[\s\S]*?\/>/,
  'ExecutionTasks table task title action must use ActionButton without bubbling into the row click handler.'
)
requirePattern(
  executionTasks,
  /<IconActionButton[\s\S]*?label=\{`打开任务 #\$\{record\.id\} 来源`\}[\s\S]*?tooltip="打开来源"[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?disabled=\{!canOpenSource\(record\)\}[\s\S]*?event\.stopPropagation\(\)[\s\S]*?openSource\(record\)[\s\S]*?\/>/,
  'ExecutionTasks table source action must use IconActionButton without bubbling into the row click handler.'
)
requirePattern(
  executionTasks,
  /<IconActionButton[\s\S]*?label=\{`取消任务 #\$\{record\.id\}`\}[\s\S]*?tooltip="取消任务"[\s\S]*?danger[\s\S]*?icon=\{<StopOutlined\s+\/>\}[\s\S]*?loading=\{cancellingId === record\.id\}[\s\S]*?event\.stopPropagation\(\)[\s\S]*?\/>/,
  'ExecutionTasks table cancel action must use IconActionButton without bubbling into the row click handler.'
)
requirePattern(
  executionTasks,
  /<ActionButton[\s\S]*?size="small"[\s\S]*?className="sl-execution-detail-action"[\s\S]*?event\.stopPropagation\(\)[\s\S]*?loadDetail\(record\)[\s\S]*?aria-label=\{`查看执行任务 #\$\{record\.id\} 详情`\}[\s\S]*?label="详情"[\s\S]*?\/>/,
  'ExecutionTasks table detail action must use ActionButton with an explicit accessible task-specific label.'
)
requirePattern(
  executionTasks,
  /<Card className="sl-section-card sl-execution-table-card sl-selectable-table-card"[\s\S]*?onRow=\{\(record\) => createSelectableTableRowProps\(\{[\s\S]*?record,[\s\S]*?selected: selected\?\.id === record\.id,[\s\S]*?onSelect: loadDetail,[\s\S]*?controlsId: selectedDetailId,[\s\S]*?label: `ExecutionTask #\$\{record\.id\} \$\{selected\?\.id === record\.id \? '已选中' : '查看详情'\}`[\s\S]*?className: selected\?\.id === record\.id \? 'sl-execution-row-active' : ''/,
  'ExecutionTasks table rows must use the shared selectable row helper with selected state, aria-controls and stable row labels.'
)
requirePattern(
  executionTasks,
  /<Card[\s\S]*?id=\{selectedDetailId\}[\s\S]*?role="region"[\s\S]*?aria-labelledby=\{selectedTitleId\}[\s\S]*?className="sl-section-card sl-execution-detail-card"[\s\S]*?<Space size="small" id=\{selectedTitleId\}>/,
  'ExecutionTasks detail card must expose a labelled region connected from the selected row.'
)
requirePattern(
  executionTasks,
  /const detailRequestSeqRef = useRef\(0\)[\s\S]*?const loadDetail = useCallback\(\(task: ExecutionTask\) => \{[\s\S]*?detailRequestSeqRef\.current = requestSeq[\s\S]*?setDetail\(null\)[\s\S]*?if \(detailRequestSeqRef\.current !== requestSeq\) return[\s\S]*?const selectedDetail = selected && detail\?\.task\?\.id === selected\.id \? detail : null[\s\S]*?ExecutionEvidenceGrid task=\{selected\} detail=\{selectedDetail\}[\s\S]*?items=\{\(selectedDetail\?\.steps \|\| \[\]\)\.map/,
  'ExecutionTasks detail loading must clear stale detail data and only render evidence, timeline and logs when the loaded detail belongs to the selected task.'
)
requirePattern(
  executionTasks,
  /const refreshSelectedDetail = useCallback\(\(taskId: number\) => \{[\s\S]*?const requestSeq = detailRequestSeqRef\.current \+ 1[\s\S]*?detailRequestSeqRef\.current = requestSeq[\s\S]*?executionTaskApi\.detail\(projectId, taskId\)[\s\S]*?if \(detailRequestSeqRef\.current !== requestSeq\) return[\s\S]*?const nextDetail = res\.data\.data[\s\S]*?if \(nextDetail\?\.task\?\.id !== taskId\) return[\s\S]*?setDetail\(nextDetail\)[\s\S]*?setSelected\(nextDetail\.task\)/,
  'ExecutionTasks selected-detail refresh must advance the detail request sequence and reject stale same-task responses.'
)
requirePattern(
  executionTasks,
  /useEffect\(\(\) => \{[\s\S]*?if \(selected && hasActiveTask && !detailLoading\) \{[\s\S]*?refreshSelectedDetail\(selected\.id\)[\s\S]*?\}, \[refreshSelectedDetail, selected\?\.id, hasActiveTask, detailLoading, tasks\]\)/,
  'ExecutionTasks silent selected-detail refresh must not invalidate an explicit detail load while detailLoading is active.'
)
requirePattern(
  executionTasks,
  /const handleCancel = async \(task: ExecutionTask\) => \{[\s\S]*?const requestSeq = detailRequestSeqRef\.current \+ 1[\s\S]*?detailRequestSeqRef\.current = requestSeq[\s\S]*?executionTaskApi\.cancel\(projectId, task\.id\)[\s\S]*?const nextDetail = res\.data\.data[\s\S]*?if \(detailRequestSeqRef\.current === requestSeq && nextDetail\?\.task\?\.id === task\.id\)[\s\S]*?setDetail\(nextDetail\)[\s\S]*?setSelected\(nextDetail\.task\)/,
  'ExecutionTasks cancel response must own a fresh detail request sequence so older refresh responses cannot overwrite the cancel result.'
)
requirePattern(
  executionTasks,
  /const handleCancel = async \(task: ExecutionTask\) => \{[\s\S]*?setDetailError\(null\)[\s\S]*?\}\s*finally \{[\s\S]*?if \(detailRequestSeqRef\.current === requestSeq\) \{[\s\S]*?setDetailLoading\(false\)[\s\S]*?setCancellingId\(null\)/,
  'ExecutionTasks cancel must clear detailLoading for the current request sequence, including when it interrupts an explicit detail load.'
)
requirePattern(
  executionTasks,
  /interface ExecutionActionGate[\s\S]*?status:\s*'READY' \| 'REVIEW' \| 'BLOCKED'[\s\S]*?selectedActionGate = selected \? buildExecutionActionGate\(selected, selectedDetail\) : null[\s\S]*?ExecutionActionGatePanel gate=\{selectedActionGate\}/,
  'ExecutionTasks detail must define and render an explicit action gate derived from the selected task state.'
)
requirePattern(
  executionTasks,
  /function ExecutionActionGatePanel[\s\S]*?aria-label="执行任务动作门禁说明"[\s\S]*?Execution Action Gate[\s\S]*?gate\.reason[\s\S]*?sl-execution-action-gate-grid/,
  'ExecutionTasks action gate panel must expose a labelled readable region with summary, reason and check grid.'
)
requirePattern(
  executionTasks,
  /function buildExecutionActionGate\(task: ExecutionTask, detail: ExecutionTaskDetail \| null\): ExecutionActionGate(?=[\s\S]*?取消门禁开放，来源和证据复核同步开放)(?=[\s\S]*?状态变更门禁关闭，来源和产物复盘开放)(?=[\s\S]*?失败复盘开放，状态变更门禁关闭)(?=[\s\S]*?失败任务缺少复盘证据)(?=[\s\S]*?取消终态冻结，复盘入口开放)(?=[\s\S]*?未知状态，动作门禁关闭)(?=[\s\S]*?需要后端状态排查)/,
  'ExecutionTasks action gate state machine must cover active, success, failed-with-evidence, failed-missing-evidence, cancelled and unknown statuses.'
)
requirePattern(
  executionTasks,
  /interface ExecutionLifecycleStage[\s\S]*?key:\s*string[\s\S]*?stage:\s*string[\s\S]*?tone:\s*ExecutionTone[\s\S]*?icon:\s*React\.ReactNode[\s\S]*?function buildExecutionLifecycleStages\([\s\S]*?taskCount: number[\s\S]*?sourceCoverage: number[\s\S]*?sourceLinkedCount: number[\s\S]*?selected: ExecutionTask \| null[\s\S]*?selectedDetail: ExecutionTaskDetail \| null[\s\S]*?\): ExecutionLifecycleStage\[\]/,
  'ExecutionTasks must derive a typed lifecycle governance loop from task list summary, selected task and selected detail evidence.'
)
requirePattern(
  executionTasks,
  /key:\s*'source-intake'[\s\S]*?title:\s*'来源接入'[\s\S]*?key:\s*'dispatch-control'[\s\S]*?title:\s*'调度控制'[\s\S]*?key:\s*'evidence-capture'[\s\S]*?title:\s*'证据采集'[\s\S]*?key:\s*'review-handoff'[\s\S]*?title:\s*'复盘交接'/,
  'ExecutionTasks lifecycle governance loop must cover source intake, dispatch control, evidence capture and review handoff.'
)
requirePattern(
  executionTasks,
  /<ExecutionPipelineSignal signal=\{pipelineSignal\} \/>[\s\S]*?<ExecutionLifecycleLoop stages=\{executionLifecycleStages\} \/>[\s\S]*?function ExecutionLifecycleLoop[\s\S]*?aria-label="执行生命周期治理闭环"[\s\S]*?DEVELOPER CONTROL PLANE[\s\S]*?执行生命周期治理闭环[\s\S]*?不能证明真实执行质量、产物正确、CI\/PR\/AutoRepair 或 LLM 结果已经正确[\s\S]*?data-sl-execution-lifecycle-stage=\{stage\.key\}/,
  'ExecutionTasks must render the developer-control-plane execution lifecycle governance loop with explicit no-overclaim boundary copy and stable markers.'
)
requirePattern(
  css,
  /\.sl-selectable-table-card \.ant-table-row\s*\{[^}]*cursor:\s*pointer;[\s\S]*?\.sl-selectable-table-card \.ant-table-row:focus-visible > td\s*\{[^}]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.64\);[\s\S]*?\.sl-selectable-table-card \.ant-table-row\[aria-selected='true'\] > td[\s\S]*?\.sl-execution-detail-action\s*\{[^}]*min-width:\s*76px;/s,
  'ExecutionTasks table must inherit pointer, keyboard focus and aria-selected row styling from the shared selectable table card utility.'
)
requirePattern(
  css,
  /\.sl-execution-lifecycle-loop\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-execution-lifecycle-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-execution-lifecycle-stage\s*\{[\s\S]*?min-height:\s*204px;[\s\S]*?\.sl-execution-lifecycle-stage-ready[\s\S]*?\.sl-execution-lifecycle-stage-warning[\s\S]*?\.sl-execution-lifecycle-stage-danger[\s\S]*?\.sl-execution-lifecycle-head h2,[\s\S]*?\.sl-execution-lifecycle-stage p\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;/s,
  'ExecutionTasks lifecycle governance loop must define readable 4-column desktop cards with ready/warning/danger states and wrapping text.'
)
requirePattern(
  css,
  /\.sl-execution-table-card,\s*\.sl-execution-detail-card\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow:\s*hidden;[\s\S]*?\.sl-execution-table-card \.ant-table-content\s*\{[\s\S]*?overflow-x:\s*auto;[\s\S]*?\.sl-execution-detail-card \.ant-card-head-title \.ant-space\s*\{[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?\.sl-execution-meta-grid strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-execution-evidence-grid strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-execution-health-check span,\s*\.sl-execution-health-check strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-task-timeline-description\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-task-timeline-error\s*\{[\s\S]*?overflow-wrap:\s*anywhere;/s,
  'ExecutionTasks detail/table CSS must keep table scrolling local and allow critical detail, evidence, health, timeline and log text to wrap on narrow screens.'
)
requirePattern(
  css,
  /\.sl-execution-action-gate\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;[\s\S]*?\.sl-execution-action-gate-head strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;[\s\S]*?\.sl-execution-action-gate p\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;[\s\S]*?\.sl-execution-action-gate-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-execution-action-gate-check span,[\s\S]*?\.sl-execution-action-gate-check strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;/,
  'ExecutionTasks action gate CSS must keep reason and check text readable without clipping.'
)
requirePattern(
  css,
  /\.sl-execution-lifecycle-grid,[\s\S]*?\.sl-execution-summary-grid,[\s\S]*?\.sl-execution-pipeline-grid,[\s\S]*?\.sl-execution-action-gate-grid,[\s\S]*?\.sl-execution-evidence-grid[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-execution-lifecycle-grid,[\s\S]*?\.sl-execution-summary-grid,[\s\S]*?\.sl-execution-meta-grid,[\s\S]*?\.sl-execution-health-grid,[\s\S]*?\.sl-execution-action-gate-grid,[\s\S]*?\.sl-execution-pipeline-grid[\s\S]*?grid-template-columns:\s*1fr;/,
  'ExecutionTasks lifecycle and action gate grids must collapse at tablet and mobile breakpoints.'
)
requirePattern(
  executionTasks,
  /<IconActionButton[\s\S]*?label="关闭任务详情"[\s\S]*?tooltip="关闭"[\s\S]*?type="text"[\s\S]*?icon=\{<CloseOutlined\s+\/>\}[\s\S]*?setDetail\(null\)[\s\S]*?\/>/,
  'ExecutionTasks detail close action must use IconActionButton.'
)
requirePattern(
  executionTasks,
  /<ActionButton[\s\S]*?aria-label=\{`打开任务 #\$\{selected\.id\} 来源`\}[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?disabled=\{!canOpenSource\(selected\)\}[\s\S]*?onClick=\{\(\)\s*=>\s*openSource\(selected\)\}[\s\S]*?label="打开来源"[\s\S]*?\/>/,
  'ExecutionTasks detail source action must use ActionButton.'
)
requirePattern(
  executionTasks,
  /<ActionButton[\s\S]*?aria-label=\{`取消任务 #\$\{selected\.id\}`\}[\s\S]*?danger[\s\S]*?icon=\{<StopOutlined\s+\/>\}[\s\S]*?loading=\{cancellingId === selected\.id\}[\s\S]*?label="取消任务"[\s\S]*?\/>/,
  'ExecutionTasks detail cancel action must use ActionButton.'
)
rejectPattern(
  executionTasks,
  /<Button\b/,
  'ExecutionTasks must not reintroduce raw Ant Design Button for task actions.'
)
requirePattern(
  artifacts,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'Artifacts toolbar must use the shared ActionButton primitive.'
)
requirePattern(
  artifactApi,
  /download:\s*\(projectId:\s*number,\s*artifactId:\s*number,\s*rawDownloadAcknowledged\s*=\s*false\)[\s\S]*?params:\s*\{\s*rawDownloadAcknowledged\s*\}[\s\S]*?responseType:\s*'blob'/,
  'Artifact API raw download must carry an explicit rawDownloadAcknowledged boundary parameter.'
)
requirePattern(
  artifacts,
  /import \{ Alert, Card, Descriptions, Drawer, Input, Modal, Select, Space, Table, Tag, Typography \} from 'antd'/,
  'Artifacts raw download must use an explicit confirmation modal before requesting raw blob data.'
)
requirePattern(
  artifacts,
  /setLoadError\(formatApiError\(error,\s*'加载运行产物失败'\)\)[\s\S]*?showApiError\(error,\s*'加载运行产物失败'\)/,
  'Artifacts list loading failure must set an in-page formatted error and keep toast feedback.'
)
requirePattern(
  artifacts,
  /title=\{records\.length > 0 \? '产物刷新失败，已保留上次成功数据' : '运行产物加载失败'\}[\s\S]*?description=\{loadError\}[\s\S]*?label="重新加载产物"/,
  'Artifacts list loading failure must render a retryable StateBlock error and preserve cached data semantics.'
)
requirePattern(
  artifacts,
  /emptyText: loadError \? \([\s\S]*?tone="error"[\s\S]*?title="运行产物加载失败"[\s\S]*?description=\{loadError\}[\s\S]*?label="重新加载产物"/,
  'Artifacts empty table state must distinguish loading failure from no artifacts.'
)
requirePattern(
  artifacts,
  /previewError && \([\s\S]*?<StateBlock[\s\S]*?tone="error"[\s\S]*?title="智能预览加载失败"[\s\S]*?description=\{previewError\}[\s\S]*?label="重新加载预览"/,
  'Artifacts preview loading failure must render a retryable StateBlock error.'
)
requirePattern(
  artifacts,
  /<ActionButton\s+aria-label="刷新运行产物"[\s\S]*?label="刷新"\s*\/>/,
  'Artifacts toolbar refresh action must use ActionButton.'
)
requirePattern(
  artifacts,
  /<ActionButton\s+block\s+icon=\{<EyeOutlined\s+\/>\}\s+disabled=\{!isTextPreviewable\(primaryRecord\)\}\s+onClick=\{\(\)\s*=>\s*previewArtifact\(primaryRecord\)\}\s+label="打开智能预览"\s*\/>/,
  'Artifacts focus preview action must use ActionButton.'
)
requirePattern(
  artifacts,
  /<ActionButton\s+block\s+icon=\{<LinkOutlined\s+\/>\}\s+disabled=\{!canOpenArtifactSource\(primaryRecord\)\}\s+onClick=\{\(\)\s*=>\s*openArtifactSource\(primaryRecord\)\}\s+label="打开来源"\s*\/>/,
  'Artifacts focus source action must use ActionButton.'
)
requirePattern(
  artifacts,
  /interface ArtifactCustodyStep[\s\S]*?const custodySteps = useMemo<ArtifactCustodyStep\[\]>\(\(\) => \{[\s\S]*?key:\s*'source-binding'[\s\S]*?label:\s*'来源绑定'[\s\S]*?key:\s*'display-redaction'[\s\S]*?label:\s*'显示脱敏'[\s\S]*?key:\s*'raw-access-audit'[\s\S]*?label:\s*'Raw Access'[\s\S]*?key:\s*'review-loop'[\s\S]*?label:\s*'复盘闭环'[\s\S]*?<ArtifactCustodyChainPanel steps=\{custodySteps\} \/>[\s\S]*?function ArtifactCustodyChainPanel[\s\S]*?aria-label="产物保管责任链"[\s\S]*?data-sl-custody-step=\{step\.key\}/,
  'Artifacts must expose a four-step artifact custody chain covering source binding, display redaction, raw access audit and review loop.'
)
requirePattern(
  artifacts,
  /action=\{<ActionButton\s+size="small"\s+icon=\{<ReloadOutlined\s+\/>\}\s+loading=\{loading\}\s+onClick=\{loadArtifacts\}\s+label="重新加载产物"\s*\/>\}/,
  'Artifacts load retry action must use ActionButton.'
)
requirePattern(
  css,
  /\.sl-artifact-smart-preview \.ant-descriptions-view\s*\{[^}]*max-width:\s*100%\s*;[^}]*overflow-x:\s*auto\s*;/s,
  'Artifact smart preview descriptions must allow horizontal scroll instead of forcing narrow viewport overflow.'
)
requirePattern(
  css,
  /\.sl-artifact-table-card\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-artifact-table-card \.ant-card-body,[\s\S]*?\.sl-artifact-table-card \.ant-table-container\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-artifact-table-card \.ant-table-content\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*auto;/s,
  'Artifacts table card must keep horizontal overflow owned by the internal table scroller.'
)
requirePattern(
  css,
  /\.sl-artifact-drawer\.ant-drawer-content-wrapper,[\s\S]*?\.sl-artifact-drawer \.ant-descriptions-view\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-artifact-drawer \.ant-drawer-extra \.ant-space\s*\{[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?\.sl-artifact-drawer \.ant-descriptions-item-content,[\s\S]*?\.sl-artifact-drawer code\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;/s,
  'Artifacts drawer must wrap long SHA/type/owner/description text instead of clipping it.'
)
requirePattern(
  css,
  /\.sl-artifact-custody-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*?@media \(max-width: 1200px\)[\s\S]*?\.sl-artifact-custody-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?@media \(max-width: 720px\)[\s\S]*?\.sl-artifact-custody-grid,[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\.sl-artifact-custody-step-copy span,[\s\S]*?\.sl-artifact-custody-step-copy strong,[\s\S]*?\.sl-artifact-custody-step-copy p,[\s\S]*?overflow-wrap:\s*anywhere;/s,
  'Artifacts custody chain CSS must use 4/2/1 responsive columns and keep step copy readable on narrow screens.'
)
requirePattern(
  artifacts,
  /import IconActionButton from '\.\.\/components\/ui\/IconActionButton'/,
  'Artifacts dense table actions must use the shared IconActionButton primitive.'
)
requirePattern(
  artifacts,
  /import \{ createSelectableTableRowProps \} from '\.\.\/components\/ui\/selectableTableRow'/,
  'Artifacts detail selection must use the shared selectable table row helper instead of local keyboard handling.'
)
rejectPattern(
  artifacts,
  /handleRowKeyDown|KeyboardEvent<HTMLElement>/,
  'Artifacts must not keep page-local row keyboard handlers after adopting the shared selectable table row helper.'
)
requirePattern(
  artifacts,
  /const selectedDetailId = selected \? `artifact-detail-\$\{selected\.id\}` : undefined[\s\S]*?const selectedTitleId = selected \? `artifact-detail-title-\$\{selected\.id\}` : undefined/,
  'Artifacts must derive stable detail and title ids for selectable row aria-controls.'
)
requirePattern(
  artifacts,
  /<Card className="sl-section-card sl-artifact-table-card sl-selectable-table-card"[\s\S]*?<Table[\s\S]*?rowKey="id"[\s\S]*?onRow=\{record => createSelectableTableRowProps\(\{[\s\S]*?record,[\s\S]*?selected: selected\?\.id === record\.id,[\s\S]*?onSelect: openDetail,[\s\S]*?controlsId: selectedDetailId,[\s\S]*?label: `Artifact #\$\{record\.id\} \$\{artifactLabel\(record\.artifactType\)\} \$\{selected\?\.id === record\.id \? '已选中' : '查看详情'\}`[\s\S]*?className: selected\?\.id === record\.id \? 'sl-artifact-row-selected' : ''/,
  'Artifacts table rows must use the shared selectable row helper with selected state, aria-controls and stable artifact row labels.'
)
requirePattern(
  artifacts,
  /<Space[\s\S]*?id=\{selectedDetailId\}[\s\S]*?role="region"[\s\S]*?aria-labelledby=\{selectedTitleId\}[\s\S]*?direction="vertical"/,
  'Artifacts drawer content must expose a labelled region connected from the selected row.'
)
requirePattern(
  css,
  /\.sl-selectable-table-card \.ant-table-row\s*\{[^}]*cursor:\s*pointer;[\s\S]*?\.sl-selectable-table-card \.ant-table-row:focus-visible > td\s*\{[^}]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.64\);[\s\S]*?\.sl-selectable-table-card \.ant-table-row\[aria-selected='true'\] > td[\s\S]*?\.sl-artifact-detail-action\s*\{[^}]*min-width:\s*76px;/s,
  'Artifacts table must inherit pointer, keyboard focus and aria-selected row styling from the shared selectable table card utility.'
)
const artifactIconActions = [
  ['详情', /<IconActionButton[\s\S]*?tooltip="详情"[\s\S]*?className="sl-artifact-detail-action"[\s\S]*?icon=\{<FileTextOutlined\s+\/>\}[\s\S]*?onClick=\{event => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?openDetail\(record\)[\s\S]*?\}\}[\s\S]*?\/>/],
  ['打开来源', /<IconActionButton[\s\S]*?tooltip="打开来源"[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?onClick=\{event => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?openArtifactSource\(record\)[\s\S]*?\}\}[\s\S]*?disabled=\{!canOpenArtifactSource\(record\)\}[\s\S]*?\/>/],
  ['预览', /<IconActionButton[\s\S]*?tooltip="预览"[\s\S]*?icon=\{<EyeOutlined\s+\/>\}[\s\S]*?onClick=\{event => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?previewArtifact\(record\)[\s\S]*?\}\}[\s\S]*?disabled=\{!isTextPreviewable\(record\)\}[\s\S]*?\/>/],
  ['下载', /<IconActionButton[\s\S]*?tooltip="下载"[\s\S]*?icon=\{<DownloadOutlined\s+\/>\}[\s\S]*?onClick=\{event => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?downloadArtifact\(record\)[\s\S]*?\}\}[\s\S]*?\/>/],
]
for (const [name, pattern] of artifactIconActions) {
  requirePattern(artifacts, pattern, `Artifacts table ${name} action must use IconActionButton and stop row propagation.`)
}
requirePattern(
  artifacts,
  /<Space[\s\S]*?size="small"[\s\S]*?onClick=\{event => event\.stopPropagation\(\)\}[\s\S]*?onKeyDown=\{event => event\.stopPropagation\(\)\}[\s\S]*?>[\s\S]*?<IconActionButton/,
  'Artifacts table action group must stop click and keyboard propagation before row handlers.'
)
requirePattern(
  artifacts,
  /<ActionButton[\s\S]*?aria-label=\{`打开 \$\{artifactLabel\(selected\.artifactType\)\} #\$\{selected\.id\} 来源`\}[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?disabled=\{!canOpenArtifactSource\(selected\)\}[\s\S]*?onClick=\{\(\)\s*=>\s*openArtifactSource\(selected\)\}[\s\S]*?label="来源"[\s\S]*?\/>/,
  'Artifacts drawer source action must use ActionButton.'
)
requirePattern(
  artifacts,
  /<ActionButton[\s\S]*?aria-label=\{`预览 \$\{artifactLabel\(selected\.artifactType\)\} #\$\{selected\.id\}`\}[\s\S]*?icon=\{<EyeOutlined\s+\/>\}[\s\S]*?loading=\{previewLoading\}[\s\S]*?disabled=\{!isTextPreviewable\(selected\)\}[\s\S]*?onClick=\{\(\)\s*=>\s*previewArtifact\(selected\)\}[\s\S]*?label="预览"[\s\S]*?\/>/,
  'Artifacts drawer preview action must use ActionButton.'
)
requirePattern(
  artifacts,
  /<ActionButton[\s\S]*?aria-label=\{`下载 \$\{artifactLabel\(selected\.artifactType\)\} #\$\{selected\.id\}`\}[\s\S]*?icon=\{<DownloadOutlined\s+\/>\}[\s\S]*?onClick=\{\(\)\s*=>\s*downloadArtifact\(selected\)\}[\s\S]*?label="下载"[\s\S]*?\/>/,
  'Artifacts drawer download action must use ActionButton.'
)
requirePattern(
  artifacts,
  /action=\{<ActionButton\s+size="small"\s+icon=\{<ReloadOutlined\s+\/>\}\s+loading=\{previewLoading\}\s+onClick=\{\(\)\s*=>\s*loadPreview\(selected\)\}\s+label="重新加载预览"\s*\/>\}/,
  'Artifacts preview retry action must use ActionButton.'
)
requirePattern(
  artifacts,
  /action=\{<ActionButton\s+size="small"\s+onClick=\{\(\)\s*=>\s*loadPreview\(selected\)\}\s+label="加载预览"\s*\/>\}/,
  'Artifacts lazy preview action must use ActionButton.'
)
rejectPattern(
  artifacts,
  /<Button\b/,
  'Artifacts must not reintroduce raw Ant Design Button for artifact actions.'
)
requirePattern(
  artifacts,
  /Modal\.confirm\(\{[\s\S]*?title:\s*'确认下载原始产物'[\s\S]*?未经显示层脱敏处理的原始 artifact[\s\S]*?okText:\s*'确认下载'[\s\S]*?artifactApi\.download\(projectId,\s*record\.id,\s*true\)/,
  'Artifacts raw download must require user acknowledgement and pass rawDownloadAcknowledged=true.'
)
requirePattern(
  artifacts,
  /const auditLogId = parseRawDownloadAuditLogId\(res\.headers\)[\s\S]*?setRawDownloadAuditTarget\(\{[\s\S]*?artifactId:\s*record\.id[\s\S]*?artifactType:\s*record\.artifactType[\s\S]*?auditLogId,[\s\S]*?auditUrl:\s*artifactRawDownloadAuditUrl\(projectId,\s*record\.id,\s*auditLogId\)[\s\S]*?\}\)/,
  'Artifacts must expose the raw download audit deep link with receipt id only after the acknowledged download request succeeds.'
)
requirePattern(
  artifacts,
  /rawDownloadAuditTarget && \([\s\S]*?className="sl-artifact-download-audit-receipt"[\s\S]*?title=\{rawDownloadAuditTarget\.auditLogId \? '原始产物下载已记录审计' : '原始产物下载审计定位入口已准备'\}[\s\S]*?未返回 receipt id[\s\S]*?按资源、动作和状态过滤审计日志[\s\S]*?data-sl-target-url=\{rawDownloadAuditTarget\.auditUrl\}[\s\S]*?navigate\(rawDownloadAuditTarget\.auditUrl\)[\s\S]*?label="查看下载审计"/,
  'Artifacts must render a download audit receipt action with exact target URL and fail-soft no-receipt-id copy.'
)
requirePattern(
  artifacts,
  /function artifactRawDownloadAuditUrl\(projectId: number, artifactId: number, auditLogId\?: number\) \{[\s\S]*?resourceType:\s*'ARTIFACT'[\s\S]*?resourceId:\s*String\(artifactId\)[\s\S]*?action:\s*'ARTIFACT_RAW_DOWNLOAD'[\s\S]*?status:\s*'SUCCESS'[\s\S]*?params\.set\('auditLogId', String\(auditLogId\)\)[\s\S]*?return `\/audit-logs\?\$\{params\.toString\(\)\}`/,
  'Artifacts raw download audit URL must use low-sensitive audit filter fields plus optional positive receipt id.'
)
requirePattern(
  artifacts,
  /function parseRawDownloadAuditLogId\(headers: unknown\) \{[\s\S]*?getHeaderValue\(headers, 'x-sourcelens-audit-log-id'\)[\s\S]*?Number\.isSafeInteger\(parsed\) && parsed > 0 \? parsed : undefined/,
  'Artifacts must parse only positive integer raw download audit receipt ids from the response header.'
)
rejectPattern(
  artifacts,
  /artifactApi\.download\(projectId,\s*record\.id\)(?!,)/,
  'Artifacts raw download must not call artifactApi.download without acknowledgement.'
)
requirePattern(
  auditLogs,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'AuditLogs action surfaces must use the shared ActionButton primitive.'
)
requirePattern(
  auditLogs,
  /import IconActionButton from '\.\.\/components\/ui\/IconActionButton'/,
  'AuditLogs dense table resource actions must use the shared IconActionButton primitive.'
)
requirePattern(
  auditLogs,
  /const RESOURCE_OPTIONS = \[[\s\S]*?'ARTIFACT'[\s\S]*?\]/,
  'AuditLogs resource filter options must include ARTIFACT for artifact raw download receipts.'
)
requirePattern(
  auditLogs,
  /<ActionButton[\s\S]*?label="刷新全部"\s*\/>/,
  'AuditLogs top-level refresh action must use ActionButton.'
)
requirePattern(
  auditLogs,
  /import \{ createSelectableTableRowProps \} from '\.\.\/components\/ui\/selectableTableRow'/,
  'AuditLogs detail selection must use the shared selectable table row helper instead of local keyboard handling.'
)
rejectPattern(
  auditLogs,
  /KeyboardEvent<HTMLElement>|handleAuditRowKeyDown|handleToolRowKeyDown|handleDeliveryRowKeyDown|isNestedInteractiveTarget/,
  'AuditLogs must not keep page-local row keyboard handlers after adopting the shared selectable table row helper.'
)
requirePattern(
  auditLogs,
  /const selectedAuditDetailId = selected \? `audit-log-detail-\$\{selected\.id\}` : undefined[\s\S]*?const selectedAuditTitleId = selected \? `audit-log-detail-title-\$\{selected\.id\}` : undefined[\s\S]*?const selectedToolDetailId = selectedToolCall \? `agent-tool-call-detail-\$\{selectedToolCall\.id\}` : undefined[\s\S]*?const selectedToolTitleId = selectedToolCall \? `agent-tool-call-detail-title-\$\{selectedToolCall\.id\}` : undefined[\s\S]*?const selectedDeliveryDetailId = selectedDelivery \? `github-webhook-delivery-detail-\$\{selectedDelivery\.id\}` : undefined[\s\S]*?const selectedDeliveryTitleId = selectedDelivery \? `github-webhook-delivery-detail-title-\$\{selectedDelivery\.id\}` : undefined/,
  'AuditLogs must derive stable detail and title ids for all three selectable audit sources.'
)
for (const [name, pattern] of [
  ['audit table', /<Table[\s\S]*?className="sl-audit-table-card sl-selectable-table-card"[\s\S]*?rowKey="id"[\s\S]*?onRow=\{record => createSelectableTableRowProps\(\{[\s\S]*?record,[\s\S]*?selected: selected\?\.id === record\.id,[\s\S]*?onSelect: selectAuditLog,[\s\S]*?controlsId: selectedAuditDetailId,[\s\S]*?label: `AuditLog #\$\{record\.id\} \$\{record\.action\} \$\{selected\?\.id === record\.id \? '已选中' : '查看详情'\}`[\s\S]*?className: selected\?\.id === record\.id \? 'sl-audit-row-selected' : ''/],
  ['tool table', /<Table[\s\S]*?className="sl-audit-table-card sl-selectable-table-card"[\s\S]*?rowKey="id"[\s\S]*?onRow=\{record => createSelectableTableRowProps\(\{[\s\S]*?record,[\s\S]*?selected: selectedToolCall\?\.id === record\.id,[\s\S]*?onSelect: selectToolCall,[\s\S]*?controlsId: selectedToolDetailId,[\s\S]*?label: `AgentToolCall #\$\{record\.id\} \$\{record\.toolName\} \$\{selectedToolCall\?\.id === record\.id \? '已选中' : '查看详情'\}`[\s\S]*?className: selectedToolCall\?\.id === record\.id \? 'sl-audit-row-selected' : ''/],
  ['delivery table', /<Table[\s\S]*?className="sl-audit-table-card sl-selectable-table-card"[\s\S]*?rowKey="id"[\s\S]*?onRow=\{record => createSelectableTableRowProps\(\{[\s\S]*?record,[\s\S]*?selected: selectedDelivery\?\.id === record\.id,[\s\S]*?onSelect: selectDelivery,[\s\S]*?controlsId: selectedDeliveryDetailId,[\s\S]*?label: `GitHubWebhookDelivery #\$\{record\.id\} \$\{record\.deliveryId\} \$\{selectedDelivery\?\.id === record\.id \? '已选中' : '查看详情'\}`[\s\S]*?className: selectedDelivery\?\.id === record\.id \? 'sl-audit-row-selected' : ''/],
]) {
  requirePattern(auditLogs, pattern, `AuditLogs ${name} must expose accessible row detail selection.`)
}
requirePattern(
  auditLogs,
  /title=\{selected \? <span id=\{selectedAuditTitleId\}>审计事件 #\{selected\.id\}<\/span> : '审计事件'\}[\s\S]*?<div[\s\S]*?id=\{selectedAuditDetailId\}[\s\S]*?role="region"[\s\S]*?aria-labelledby=\{selectedAuditTitleId\}[\s\S]*?className="sl-audit-drawer-stack"[\s\S]*?title=\{selectedToolCall \? <span id=\{selectedToolTitleId\}>工具调用 #\{selectedToolCall\.id\}<\/span> : '工具调用'\}[\s\S]*?<div[\s\S]*?id=\{selectedToolDetailId\}[\s\S]*?role="region"[\s\S]*?aria-labelledby=\{selectedToolTitleId\}[\s\S]*?className="sl-audit-drawer-stack"[\s\S]*?title=\{selectedDelivery \? <span id=\{selectedDeliveryTitleId\}>Webhook Delivery #\{selectedDelivery\.id\}<\/span> : 'Webhook Delivery'\}[\s\S]*?<div[\s\S]*?id=\{selectedDeliveryDetailId\}[\s\S]*?role="region"[\s\S]*?aria-labelledby=\{selectedDeliveryTitleId\}[\s\S]*?className="sl-audit-drawer-stack"/,
  'AuditLogs drawers must expose labelled regions connected from all three selected row sources.'
)
requirePattern(
  css,
  /\.sl-selectable-table-card \.ant-table-row\s*\{[^}]*cursor:\s*pointer;[\s\S]*?\.sl-selectable-table-card \.ant-table-row:focus-visible > td\s*\{[^}]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.64\);[\s\S]*?\.sl-selectable-table-card \.ant-table-row\[aria-selected='true'\] > td[\s\S]*?\.sl-audit-row-selected > td/s,
  'AuditLogs table must inherit pointer, keyboard focus and aria-selected row styling from the shared selectable table card utility.'
)
for (const [name, pattern] of [
  ['audit action', /<ActionButton[\s\S]*?type="link"[\s\S]*?className="sl-audit-table-link"[\s\S]*?icon=\{<SafetyCertificateOutlined\s+\/>\}[\s\S]*?onClick=\{event => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?selectAuditLog\(record\)[\s\S]*?\}\}[\s\S]*?label=\{value\}[\s\S]*?\/>/],
  ['tool name', /<ActionButton[\s\S]*?type="link"[\s\S]*?className="sl-audit-table-link"[\s\S]*?icon=\{<ToolOutlined\s+\/>\}[\s\S]*?onClick=\{event => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?selectToolCall\(record\)[\s\S]*?\}\}[\s\S]*?label=\{value\}[\s\S]*?\/>/],
  ['delivery id', /<ActionButton[\s\S]*?type="link"[\s\S]*?className="sl-audit-table-link"[\s\S]*?icon=\{<GithubOutlined\s+\/>\}[\s\S]*?onClick=\{event => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?selectDelivery\(record\)[\s\S]*?\}\}[\s\S]*?label=\{value\}[\s\S]*?\/>/],
]) {
  requirePattern(auditLogs, pattern, `AuditLogs ${name} table link must use ActionButton and stop row propagation.`)
}
for (const [name, pattern] of [
  ['audit resource', /<IconActionButton[\s\S]*?label=\{`打开审计事件 #\$\{record\.id\} 关联资源`\}[\s\S]*?tooltip="打开关联资源"[\s\S]*?type="text"[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?onClick=\{event => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?openAuditResource\(record\)[\s\S]*?\}\}[\s\S]*?\/>/],
  ['tool conversation', /<IconActionButton[\s\S]*?label=\{`打开工具调用 #\$\{record\.id\} 对话`\}[\s\S]*?tooltip="打开对话"[\s\S]*?type="text"[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?onClick=\{event => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?openToolConversation\(record\)[\s\S]*?\}\}[\s\S]*?\/>/],
  ['tool scan task', /<IconActionButton[\s\S]*?label=\{`打开工具调用 #\$\{record\.id\} 扫描报告`\}[\s\S]*?tooltip="打开扫描报告"[\s\S]*?type="text"[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?onClick=\{event => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?openToolScanTask\(record\)[\s\S]*?\}\}[\s\S]*?\/>/],
]) {
  requirePattern(auditLogs, pattern, `AuditLogs ${name} table action must use IconActionButton and stop row propagation.`)
}
requirePattern(
  auditLogs,
  /<ActionButton\s+size="small"\s+icon=\{<ReloadOutlined\s+\/>\}\s+onClick=\{source\.retry\}\s+label="重试"\s*\/>/,
  'AuditLogs source health retry action must use ActionButton.'
)
requirePattern(
  auditLogs,
  /<ActionButton\s+size="small"\s+icon=\{<ReloadOutlined\s+\/>\}\s+onClick=\{onRetry\}\s+label="重试"\s*\/>/,
  'AuditLogs inline error retry action must use ActionButton.'
)
for (const [name, pattern] of [
  ['drawer audit resource', /<ActionButton[\s\S]*?data-sl-target-url=\{getAuditResourcePath\(selected\) \|\| undefined\}[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?onClick=\{\(\)\s*=>\s*openAuditResource\(selected\)\}[\s\S]*?label="打开关联资源"[\s\S]*?\/>/],
  ['drawer conversation', /<ActionButton\s+icon=\{<LinkOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*openToolConversation\(selectedToolCall\)\}\s+label="打开对话"\s*\/>/],
  ['drawer scan task', /<ActionButton\s+icon=\{<LinkOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*openToolScanTask\(selectedToolCall\)\}\s+label="打开扫描报告"\s*\/>/],
]) {
  requirePattern(auditLogs, pattern, `AuditLogs ${name} action must use ActionButton.`)
}
requirePattern(
  auditLogs,
  /isCandidateReceiptAudit\(selected\)[\s\S]*?<AuditCandidateReceiptReviewPanel[\s\S]*?projectId=\{projectId\}[\s\S]*?log=\{selected\}[\s\S]*?provenance=\{candidateProvenanceFromAudit\(selected\)\}[\s\S]*?onNavigate=\{navigate\}/,
  'AuditLogs drawer must render a candidate receipt review panel for AUTO_REPAIR_CANDIDATE_CREATED events.'
)
requirePattern(
  auditLogs,
  /function AuditCandidateReceiptReviewPanel\([\s\S]*?aria-label="审计候选凭证复核"[\s\S]*?Candidate Receipt Review[\s\S]*?label="打开修复详情"[\s\S]*?data-sl-target-url=\{reportUrl\}[\s\S]*?label="打开来源报告"[\s\S]*?data-sl-target-url=\{qaUrl\}[\s\S]*?label="QA 复核来源"/,
  'AuditLogs candidate receipt panel must expose AutoRepair, source report and QA review deep links.'
)
requirePattern(
  auditLogs,
  /function candidateProvenanceFromAudit\(log: AuditLog\): AutoRepairProvenance \| null[\s\S]*?parseAuditInputObject\(log\)[\s\S]*?input\?\.provenance[\s\S]*?function auditCandidateReceiptQaUrl\([\s\S]*?AUTO_REPAIR_CANDIDATE_CREATED[\s\S]*?候选门禁/,
  'AuditLogs candidate receipt panel must parse sanitized provenance and build a QA review prompt without backend changes.'
)
const auditQueryActionCount = (auditLogs.match(/<ActionButton\s+type="primary"\s+icon=\{<SearchOutlined\s+\/>\}[\s\S]*?label="查询"\s*\/>/g) || []).length
if (auditQueryActionCount !== 3) {
  fail(`AuditLogs must keep three primary query ActionButton controls, found ${auditQueryActionCount}`)
}
const auditResetActionCount = (auditLogs.match(/<ActionButton\s+onClick=\{\(\)\s*=>\s*\{[\s\S]*?resetFields\(\)[\s\S]*?label="重置"\s*\/>/g) || []).length
if (auditResetActionCount !== 3) {
  fail(`AuditLogs must keep three reset ActionButton controls, found ${auditResetActionCount}`)
}
requirePattern(
  auditLogsPage,
  /const initialToolScanTaskId\s*=\s*Number\(searchParams\.get\('scanTaskId'\)\) \|\| undefined[\s\S]*?const initialToolConversationId\s*=\s*Number\(searchParams\.get\('conversationId'\)\) \|\| undefined/,
  'AuditLogsPage must parse scanTaskId and conversationId for Agent tool-call deep links.'
)
requirePattern(
  auditLogsPage,
  /const initialAuditFilters\s*=\s*\{[\s\S]*?auditLogId:\s*Number\(searchParams\.get\('auditLogId'\)\) \|\| undefined[\s\S]*?resourceType:\s*searchParams\.get\('resourceType'\)[\s\S]*?resourceId:\s*Number\(searchParams\.get\('resourceId'\)\) \|\| undefined[\s\S]*?action:\s*searchParams\.get\('action'\)[\s\S]*?status:\s*searchParams\.get\('status'\)[\s\S]*?\}/,
  'AuditLogsPage must parse auditLogId, resourceType, resourceId, action and status deep-link filters.'
)
requirePattern(
  auditLogsPage,
  /<AuditLogs[\s\S]*?initialToolScanTaskId=\{initialToolScanTaskId\}[\s\S]*?initialToolConversationId=\{initialToolConversationId\}[\s\S]*?initialAuditFilters=\{initialAuditFilters\}[\s\S]*?\/>/,
  'AuditLogsPage must pass Agent tool-call and audit deep-link filters into AuditLogs.'
)
requirePattern(
  auditLogs,
  /initialToolScanTaskId\?:\s*number[\s\S]*?initialToolConversationId\?:\s*number[\s\S]*?initialAuditFilters\?:\s*Partial<AuditLogQuery>/,
  'AuditLogs must accept scanTaskId, conversationId and audit deep-link filters.'
)
requirePattern(
  auditLogs,
  /activeKey=\{activeTab\}[\s\S]*?onChange=\{setActiveTab\}/,
  'AuditLogs tabs must be controlled so audit deep links can open the common audit tab.'
)
requirePattern(
  auditLogs,
  /auditLogId:\s*initialAuditFilters\?\.auditLogId[\s\S]*?resourceId:\s*filters\.resourceId/,
  'AuditLogs common audit query must include receipt id and resourceId.'
)
requirePattern(
  auditLogs,
  /const hasInitialToolFilters\s*=\s*Boolean\(initialToolScanTaskId \|\| initialToolConversationId\)[\s\S]*?hasInitialToolFilters \? 'agent-tool-calls' : 'audit-logs'/,
  'AuditLogs must open Agent tool-call tab when conversationId or scanTaskId is deep-linked.'
)
requirePattern(
  auditLogs,
  /conversationId:\s*filters\.conversationId/,
  'AuditLogs Agent tool-call query must include conversationId.'
)
requirePattern(
  auditLogs,
  /toolForm\.setFieldsValue\(\{ conversationId:\s*initialToolConversationId,\s*scanTaskId:\s*initialToolScanTaskId \}\)/,
  'AuditLogs must initialize Agent tool-call filters from conversationId and scanTaskId deep links.'
)
requirePattern(
  auditLogs,
  /<Form\.Item name="conversationId" label="对话 ID">[\s\S]*?<InputNumber min=\{1\} precision=\{0\}[\s\S]*?placeholder="Conversation ID"/,
  'AuditLogs Agent tool-call filter form must expose conversationId.'
)
requirePattern(
  auditLogs,
  /<Form\.Item\s+name="resourceId"\s+label="资源 ID">[\s\S]*?<InputNumber[\s\S]*?placeholder="例如 AutoRepair ID"/,
  'AuditLogs common audit filter must expose resourceId for AUTO_REPAIR audit events.'
)
requirePattern(
  auditLogs,
  /function matchesInitialAuditFilters\(item: AuditLog, filters\?: Partial<AuditLogQuery>\)[\s\S]*?filters\.auditLogId && item\.id !== filters\.auditLogId[\s\S]*?filters\.resourceId && item\.resourceId !== filters\.resourceId[\s\S]*?filters\.resourceType && item\.resourceType !== filters\.resourceType[\s\S]*?filters\.action && item\.action !== filters\.action[\s\S]*?filters\.status && item\.status !== filters\.status[\s\S]*?const matched = items\.find\(item => matchesInitialAuditFilters\(item, initialAuditFilters\)\)[\s\S]*?setSelected\(matched\)[\s\S]*?setAuditDeepLinkMiss\(false\)[\s\S]*?setAuditDeepLinkMiss\(true\)/,
  'AuditLogs must auto-open audit deep links only when auditLogId/resourceId/resourceType/action/status match, and fail closed with a miss notice.'
)
requirePattern(
  auditLogs,
  /auditDeepLinkMiss[\s\S]*?未找到目标审计事件[\s\S]*?initialAuditTargetLabel\(initialAuditFilters\)[\s\S]*?label="重新查询"/,
  'AuditLogs must show an in-page miss notice instead of opening the wrong audit drawer when an exact audit deep link is not found.'
)
requirePattern(
  auditLogs,
  /function hasSubmittedAuditFilters\(filters: AuditLogQuery, initialFilters\?: Partial<AuditLogQuery>\)[\s\S]*?filters\.action\?\.trim\(\)[\s\S]*?function hasSubmittedToolFilters\(filters: AgentToolCallQuery\)[\s\S]*?filters\.toolName\?\.trim\(\)[\s\S]*?function hasSubmittedDeliveryFilters\(filters: GitHubWebhookDeliveryQuery\)[\s\S]*?filters\.eventType\?\.trim\(\)[\s\S]*?setAuditQueryScoped\(hasSubmittedAuditFilters\(filters, initialAuditFilters\)\)[\s\S]*?setToolQueryScoped\(hasSubmittedToolFilters\(filters\)\)[\s\S]*?setDeliveryQueryScoped\(hasSubmittedDeliveryFilters\(filters\)\)[\s\S]*?const hasScopedAuditQuery = auditQueryScoped \|\| toolQueryScoped \|\| deliveryQueryScoped \|\| hasInitialAuditFilters \|\| hasInitialToolFilters[\s\S]*?const auditDecisionGateStatus = sourceErrorCount \|\| auditDeepLinkMiss[\s\S]*?'BLOCKED'[\s\S]*?totalAuditEventCount > visibleAuditEventCount \|\| hasScopedAuditQuery[\s\S]*?'REVIEW'[\s\S]*?'READY'[\s\S]*?aria-label="审计判定门禁说明"[\s\S]*?Audit Decision Gate[\s\S]*?审计判定门禁说明[\s\S]*?数据源完整性[\s\S]*?当前结果窗口[\s\S]*?深链状态[\s\S]*?Raw 证据边界/,
  'AuditLogs must expose a visible audit decision gate that distinguishes blocked, scoped-review and ready audit conclusions.'
)
requirePattern(
  auditLogs,
  /const auditStatusLineLabel = sourceErrorCount[\s\S]*?'审计源需复核'[\s\S]*?loading \|\| toolLoading \|\| deliveryLoading[\s\S]*?'审计源加载中'[\s\S]*?'审计源可读取'[\s\S]*?<span><span className="sl-live-dot" \/>\{auditStatusLineLabel\}<\/span>/,
  'AuditLogs cockpit status line must be derived from source health instead of statically claiming the audit chain is online.'
)
requirePattern(
  auditLogs,
  /interface AuditInvestigationStep[\s\S]*?const investigationSteps = useMemo<AuditInvestigationStep\[\]>\(\(\) => \{[\s\S]*?key:\s*'risk-detection'[\s\S]*?label:\s*'风险发现'[\s\S]*?key:\s*'evidence-redaction'[\s\S]*?label:\s*'证据脱敏'[\s\S]*?key:\s*'resource-trace'[\s\S]*?label:\s*'资源追踪'[\s\S]*?key:\s*'review-closure'[\s\S]*?label:\s*'复盘处置'[\s\S]*?<AuditInvestigationLoopPanel steps=\{investigationSteps\} \/>[\s\S]*?function AuditInvestigationLoopPanel[\s\S]*?aria-label="审计调查闭环"[\s\S]*?data-sl-audit-investigation-step=\{step\.key\}/,
  'AuditLogs must expose a four-step investigation loop covering risk detection, evidence redaction, resource trace and review closure.'
)
requirePattern(
  auditLogs,
  /import \{ redactJsonOrText \} from '\.\.\/utils\/displayRedaction'[\s\S]*?function formatRedactedJson\(value\?: string \| null\)[\s\S]*?return redactJsonOrText\(value, '-'\)[\s\S]*?function compactJson\(value\?: string \| null\)[\s\S]*?formatRedactedJson\(value\)[\s\S]*?const renderJsonBlock = \(title: string, value\?: string \| null\) => \([\s\S]*?<details className="sl-audit-json-block">[\s\S]*?<summary>[\s\S]*?<span>\{title\}<\/span>[\s\S]*?<em>原始 JSON 默认收起<\/em>[\s\S]*?<pre className="sl-audit-json-redacted" aria-label=\{`\$\{title\} 脱敏 JSON`\}>[\s\S]*?\{formatRedactedJson\(value\)\}[\s\S]*?<\/pre>[\s\S]*?<\/details>/,
  'AuditLogs drawer raw JSON blocks and compact previews must render display-redacted JSON while staying collapsible and default closed.'
)
rejectPattern(
  auditLogs,
  /<pre>\{tryFormatJson\(value\)\}<\/pre>/,
  'AuditLogs must not render raw formatted JSON directly inside drawer pre blocks.'
)
requirePattern(
  css,
  /\.sl-audit-drawer-grid strong\s*\{[^}]*line-height:\s*1\.35;[^}]*overflow-wrap:\s*anywhere;[^}]*white-space:\s*normal;[^}]*\}/s,
  'AuditLogs drawer critical metadata values must wrap instead of single-line truncating.'
)
requirePattern(
  css,
  /\.sl-audit-json-block summary\s*\{[^}]*cursor:\s*pointer;[^}]*justify-content:\s*space-between;[^}]*overflow-wrap:\s*anywhere;[\s\S]*?\.sl-audit-json-block summary:focus-visible\s*\{[^}]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.64\);/s,
  'AuditLogs collapsible JSON summary must be readable and keyboard focus-visible.'
)
requirePattern(
  css,
  /\.sl-audit-workbench-card \.ant-card-body\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;[^}]*\}[\s\S]*?\.sl-audit-tab-panel\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;[^}]*\}[\s\S]*?\.sl-audit-table-card\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*min-width:\s*0;[^}]*\}[\s\S]*?\.sl-audit-table-card \.ant-table-content\s*\{[^}]*max-width:\s*100%;[^}]*overflow-x:\s*auto;/s,
  'AuditLogs workbench must constrain table overflow to the table content layer.'
)
requirePattern(
  css,
  /\.sl-audit-decision-gate\s*\{[^}]*min-width:\s*0;[\s\S]*?\.sl-audit-decision-gate-head\s*\{[^}]*min-width:\s*0;[\s\S]*?\.sl-audit-decision-gate p\s*\{[^}]*overflow-wrap:\s*anywhere;[\s\S]*?\.sl-audit-decision-gate-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-audit-decision-gate-grid span,[\s\S]*?\.sl-audit-decision-gate-grid strong\s*\{[^}]*overflow-wrap:\s*anywhere;/s,
  'AuditLogs audit decision gate must wrap long gate reasons and scoped evidence labels without clipping.'
)
requirePattern(
  css,
  /\.sl-audit-investigation-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-audit-investigation-step-copy strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-audit-investigation-step-copy p\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?@media \(max-width: 1200px\)[\s\S]*?\.sl-audit-investigation-grid,[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?@media\s*\(max-width:\s*720px\)[\s\S]*?\.sl-audit-investigation-grid,[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\.sl-audit-investigation-step \.ant-btn\s*\{[\s\S]*?width:\s*100%;/s,
  'AuditLogs investigation loop CSS must use 4/2/1 responsive columns and keep copy/actions readable on narrow screens.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-audit-workbench-card \.ant-tabs-nav-wrap\s*\{[^}]*overflow-x:\s*auto;[\s\S]*?\.sl-audit-filter-actions\s*\{[^}]*align-items:\s*stretch;[^}]*flex-direction:\s*column;[\s\S]*?\.sl-audit-filter-actions \.ant-btn\s*\{[^}]*width:\s*100%;[^}]*justify-content:\s*center;/s,
  'AuditLogs mobile filters and tabs must remain usable instead of being squeezed by dense tables.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*1200px\)\s*\{[\s\S]*?\.sl-audit-decision-gate-grid[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-audit-decision-gate-grid[\s\S]*?grid-template-columns:\s*1fr;/s,
  'AuditLogs audit decision gate must collapse from four columns to two on narrower screens and one column on mobile.'
)
requirePattern(
  css,
  /@media\s*\(min-width:\s*361px\)\s*and\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-audit-summary-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  'AuditLogs 390px mobile summary should keep two columns while 320px can fall back to one column.'
)
rejectPattern(
  auditLogs,
  /<Button\b/,
  'AuditLogs must not reintroduce raw Ant Design Button for audit actions.'
)
for (const [name, source, label] of [
  ['Login', login, '登录'],
  ['Register', register, '注册'],
]) {
  requirePattern(
    source,
    /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
    `${name} submit action must use the shared ActionButton primitive.`
  )
  requirePattern(
    source,
    new RegExp(`<ActionButton\\s+type="primary"\\s+htmlType="submit"[\\s\\S]*?label="${label}"\\s*\\/>`),
    `${name} submit action must keep primary ActionButton semantics.`
  )
}
requirePattern(
  dependencyGraph,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'DependencyGraph export action must use the shared ActionButton primitive.'
)
requirePattern(
  dependencyGraph,
  /import \{ formatApiError \} from '\.\.\/api\/client'/,
  'DependencyGraph recoverable graph errors must use formatApiError.'
)
requirePattern(
  dependencyGraph,
  /const loadGraph = useCallback\(\(\) => \{[\s\S]*?analysisApi\.getGraph\(scanTaskId\)[\s\S]*?setError\(formatApiError\(error,\s*'加载依赖图谱失败'\)\)[\s\S]*?\}, \[scanTaskId\]\)/,
  'DependencyGraph must wrap graph loading in a retryable loadGraph callback with formatted API errors.'
)
requirePattern(
  dependencyGraph,
  /title="依赖图谱加载失败"[\s\S]*?description=\{error\}[\s\S]*?onClick=\{loadGraph\}[\s\S]*?label="重新加载图谱"/,
  'DependencyGraph failure state must expose a retry action that reloads only the graph.'
)
requirePattern(
  dependencyGraph,
  /<ActionButton\s+type="primary"\s+onClick=\{exportMermaid\}\s+label="导出 Mermaid"\s*\/>/,
  'DependencyGraph Mermaid export must use a primary ActionButton.'
)
requirePattern(
  agentChat,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'AgentChat send action must use the shared ActionButton primitive.'
)
requirePattern(
  agentChat,
  /import IconActionButton from '\.\.\/components\/ui\/IconActionButton'/,
  'AgentChat icon-only sidebar actions must use IconActionButton.'
)
requirePattern(
  agentChat,
  /<IconActionButton\s+label="新建对话"[\s\S]*?type="primary"[\s\S]*?icon=\{<PlusOutlined\s+\/>\}[\s\S]*?onClick=\{handleNewConversation\}\s*\/>/,
  'AgentChat new conversation action must use a primary IconActionButton.'
)
requirePattern(
  agentChat,
  /<ActionButton[\s\S]*?type="primary"[\s\S]*?icon=\{<SendOutlined\s+\/>\}[\s\S]*?onClick=\{handleSend\}[\s\S]*?label="发送"\s*\/>/,
  'AgentChat send action must use a primary ActionButton.'
)
requirePattern(
  agentChat,
  /<AgentChatStateBanner[\s\S]*?onStop=\{abortStream\}[\s\S]*?function AgentChatStateBanner[\s\S]*?state === 'STREAMING' \? \([\s\S]*?<ActionButton data-agent-chat-primary-action="stop" danger icon=\{<StopOutlined\s+\/>\} onClick=\{onStop\} label="停止生成" \/>/,
  'AgentChat centralized STREAMING state must expose exactly the ActionButton-backed abort action wired to abortStream.'
)
requirePattern(
  agentChat,
  /className="sl-agent-chat-message-log"[\s\S]*?role="log"[\s\S]*?aria-label="Agent 消息流"[\s\S]*?aria-live="polite"[\s\S]*?aria-relevant="additions text"[\s\S]*?aria-busy=\{isStreamingCurrent\}/,
  'AgentChat message stream must expose a polite live log with busy state.'
)
requirePattern(
  agentChat,
  /<Input\.TextArea[\s\S]*?aria-label="输入给 SourceLens Agent 的问题"/,
  'AgentChat composer textarea must have a stable accessible label.'
)
requirePattern(
  agentChat,
  /<article className=\{`sl-agent-chat-row \$\{isUser \? 'sl-agent-chat-row-user' : 'sl-agent-chat-row-assistant'\}`\} aria-label=\{`\$\{speaker\} 消息，\$\{formatDateTime\(msg\.createdAt\)\}`\}/,
  'AgentChat persisted messages must expose article semantics and readable speaker labels.'
)
requirePattern(
  agentChat,
  /<section className="sl-agent-chat-evidence" aria-label="本轮工具证据">[\s\S]*?本轮证据[\s\S]*?\{summary\.label\}[\s\S]*?未出现写入工具/,
  'AgentChat assistant messages must summarize tool evidence before raw tool details.'
)
requirePattern(
  agentChat,
  /function agentToolAuditUrl\(projectId:\s*number,\s*conversationId:\s*number\)[\s\S]*?projectId:\s*String\(projectId\)[\s\S]*?conversationId:\s*String\(conversationId\)[\s\S]*?return `\/audit-logs\?\$\{params\.toString\(\)\}`/,
  'AgentChat must build project-scoped Agent tool-call audit deep links by conversationId.'
)
requirePattern(
  agentChat,
  /import \{ agentTaskApi,\s*AgentTask \} from '\.\.\/api\/agentTask'[\s\S]*?const \[closureTask,\s*setClosureTask\] = useState<AgentTask \| null>\(null\)[\s\S]*?agentTaskApi\.detail\(taskId\)[\s\S]*?<AgentChatClosureRail[\s\S]*?conversation=\{selectedConversation\}[\s\S]*?task=\{closureTask\}[\s\S]*?taskLoading=\{closureTaskLoading\}[\s\S]*?onNavigate=\{onNavigate\}/,
  'AgentChat must load linked AgentTask detail and pass it into the closure rail without new backend APIs.'
)
requirePattern(
  agentChat,
  /function AgentChatClosureRail[\s\S]*?aria-label="Agent 闭环下一步"[\s\S]*?data-sl-target-url=\{auditUrl\}[\s\S]*?label="查看工具审计"[\s\S]*?data-sl-target-url=\{taskUrl\}[\s\S]*?label="打开 Agent 任务"[\s\S]*?data-sl-target-url=\{scanUrl\}[\s\S]*?label="打开扫描报告"/,
  'AgentChat closure rail must expose audit, AgentTask and scan report actions with inspectable deep-link targets.'
)
requirePattern(
  agentChat,
  /interface AgentChatTrustLoopStep[\s\S]*?const agentTrustLoopSteps = useMemo<AgentChatTrustLoopStep\[\]>\(\(\) => \{[\s\S]*?key:\s*'project-context'[\s\S]*?title:\s*'项目上下文'[\s\S]*?key:\s*'evidence-input'[\s\S]*?title:\s*'证据输入'[\s\S]*?key:\s*'tool-audit'[\s\S]*?title:\s*'工具审计'[\s\S]*?key:\s*'closure-task'[\s\S]*?title:\s*'闭环任务'[\s\S]*?<AgentChatTrustLoopPanel steps=\{agentTrustLoopSteps\} onNavigate=\{navigate\} \/>[\s\S]*?function AgentChatTrustLoopPanel[\s\S]*?aria-label="Agent 会话可信工作台"/,
  'AgentChat must expose a four-step trust workbench for project context, evidence input, tool audit and closure task before the composer.'
)
requirePattern(
  agentChat,
  /const auditProjectId = selectedConversation\?\.projectId \|\| null/,
  'AgentChat trust workbench and audit deep links must only open after confirmed selectedConversation.projectId, not default project fallback.'
)
requirePattern(
  agentChat,
  /useLayoutEffect\(\(\) => \{[\s\S]*?activeConversationRef\.current !== activeConvId[\s\S]*?latestMessagesRequestRef\.current \+= 1[\s\S]*?activeConversationRef\.current = activeConvId[\s\S]*?messageSnapshotConversationRef\.current !== activeConvId[\s\S]*?messageSnapshotConversationRef\.current = null[\s\S]*?setMessageSnapshotConversationId\(null\)[\s\S]*?setMessages\(\[\]\)[\s\S]*?setMessagesError\(null\)[\s\S]*?setLoading\(Boolean\(activeConvId\)\)[\s\S]*?\}, \[activeConvId\]\)[\s\S]*?const loadMessages = useCallback\(\(conversation: number, silent = false\) => \{[\s\S]*?const hasTrustedSnapshot = messageSnapshotConversationRef\.current === conversation[\s\S]*?if \(!hasTrustedSnapshot\) \{[\s\S]*?setMessages\(\[\]\)[\s\S]*?setLoading\(true\)/,
  'AgentChat conversation switches must invalidate ownership and clear old messages, while silent refresh may retain only the matching trusted snapshot.'
)
requirePattern(
  agentChat,
  /const activeConversationRef = useRef<number \| null>\(null\)[\s\S]*?const latestMessagesRequestRef = useRef\(0\)[\s\S]*?activeConversationRef\.current = activeConvId[\s\S]*?const requestGeneration = latestMessagesRequestRef\.current \+ 1[\s\S]*?latestMessagesRequestRef\.current = requestGeneration[\s\S]*?const shouldApply = \(\) => \([\s\S]*?latestMessagesRequestRef\.current === requestGeneration[\s\S]*?activeConversationRef\.current === conversation[\s\S]*?\.then\(\(res\) => \{[\s\S]*?if \(!shouldApply\(\)\) return[\s\S]*?\.catch\(error => \{[\s\S]*?if \(!shouldApply\(\)\) return[\s\S]*?\.finally\(\(\) => \{[\s\S]*?if \(shouldApply\(\)\) setLoading\(false\)/,
  'AgentChat message loading must use request generation plus active owner guards for success, failure and completion, including silent refresh.'
)
requirePattern(
  agentChat,
  /type AgentChatViewState = 'INITIAL_LOADING' \| 'FATAL_LOAD' \| 'STREAMING' \| 'STALE_REFRESH' \| 'EMPTY' \| 'READY'[\s\S]*?const AGENT_CHAT_STATE_LABELS: Record<AgentChatViewState, string> = \{[\s\S]*?INITIAL_LOADING: '初始加载中'[\s\S]*?FATAL_LOAD: '加载失败'[\s\S]*?STREAMING: '生成中'[\s\S]*?STALE_REFRESH: '上下文已陈旧'[\s\S]*?EMPTY: '等待输入'[\s\S]*?READY: '上下文已就绪'[\s\S]*?data-sl-agent-chat-state=\{viewState\}[\s\S]*?<AgentChatStateBanner[\s\S]*?data-agent-chat-state-indicator=\{state\}[\s\S]*?data-agent-chat-primary-actions=\{primaryAction \? 1 : 0\}/,
  'AgentChat must expose the canonical six states, Chinese labels, root state marker and centralized primary-action count.'
)
requirePattern(
  agentChat,
  /const latestProjectsRequestRef = useRef\(0\)[\s\S]*?const latestConversationsRequestRef = useRef\(0\)[\s\S]*?const latestMessagesRequestRef = useRef\(0\)[\s\S]*?const loadProjects = useCallback[\s\S]*?const requestGeneration = latestProjectsRequestRef\.current \+ 1[\s\S]*?latestProjectsRequestRef\.current === requestGeneration[\s\S]*?const loadConversations = useCallback[\s\S]*?const requestGeneration = latestConversationsRequestRef\.current \+ 1[\s\S]*?latestConversationsRequestRef\.current === requestGeneration[\s\S]*?projectIdRef\.current === targetProjectId[\s\S]*?const loadMessages = useCallback[\s\S]*?const requestGeneration = latestMessagesRequestRef\.current \+ 1[\s\S]*?latestMessagesRequestRef\.current === requestGeneration[\s\S]*?activeConversationRef\.current === conversation/,
  'AgentChat project, conversation-list and message requests must all carry generation and owner guards.'
)
requirePattern(
  agentChat,
  /const messagesScrollRef = useRef<HTMLDivElement>\(null\)[\s\S]*?const messageContainer = messagesScrollRef\.current[\s\S]*?window\.requestAnimationFrame\(\(\) => \{[\s\S]*?messageContainer\.scrollTo\(\{ top: messageContainer\.scrollHeight, behavior: 'auto' \}\)[\s\S]*?\}, \[messages, visibleStreamingMsg\]\)[\s\S]*?className="sl-agent-chat-thread" ref=\{messagesScrollRef\} data-agent-chat-scroll-container="messages"/,
  'AgentChat must scroll only the owned message container on message or stream changes, never the document.'
)
requirePattern(
  agentChat,
  /window\.matchMedia\('\(max-width: 1200px\)'\)[\s\S]*?setIsThreadFirstLayout\(media\.matches\)[\s\S]*?data-agent-chat-thread-priority=\{isThreadFirstLayout \? 'first' : 'desktop-grid'\}[\s\S]*?\{!isThreadFirstLayout && conversationSidebar\}[\s\S]*?label="打开会话池"[\s\S]*?<Drawer[\s\S]*?rootClassName="sl-agent-chat-conversation-drawer"[\s\S]*?open=\{isThreadFirstLayout && conversationDrawerOpen\}[\s\S]*?onClose=\{\(\) => setConversationDrawerOpen\(false\)\}/,
  'AgentChat <=1200 layout must prioritize the thread, remove the inline pool and expose a controlled readable Drawer.'
)
requirePattern(
  css,
  /@media \(max-width: 1200px\)[\s\S]*?\.sl-agent-chat-shell\s*\{[\s\S]*?display:\s*block;[\s\S]*?\.sl-agent-chat-thread-panel,[\s\S]*?\.sl-agent-chat-thread-panel-handoff\s*\{[\s\S]*?height:\s*calc\(100dvh - 112px\);[\s\S]*?grid-template-rows:\s*auto auto minmax\(0,\s*1fr\) auto;[\s\S]*?@media \(max-width: 720px\)[\s\S]*?\.sl-agent-chat-thread-panel,[\s\S]*?height:\s*calc\(100dvh - 104px\);[\s\S]*?\.sl-agent-chat-composer\s*\{[\s\S]*?padding:\s*8px 9px 9px;[\s\S]*?\.sl-agent-chat-input-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\) auto;[\s\S]*?\.sl-agent-chat-input-row \.ant-btn\s*\{[\s\S]*?min-width:\s*68px;/s,
  'AgentChat responsive CSS must reserve a first-viewport thread at <=1200 and keep the full composer row visible at <=720.'
)
requirePattern(
  agentChat,
  /const closureGate = buildAgentChatClosureGate\(conversation,\s*task,\s*taskLoading,\s*taskError\)[\s\S]*?<AgentChatClosureGatePanel gate=\{closureGate\} \/>[\s\S]*?function AgentChatClosureGatePanel[\s\S]*?aria-label="Agent 闭环动作门禁说明"[\s\S]*?function buildAgentChatClosureGate(?=[\s\S]*?闭环动作门禁开放)(?=[\s\S]*?闭环动作门禁部分开放)(?=[\s\S]*?工具审计可用)(?=[\s\S]*?AgentTask 可定位)(?=[\s\S]*?扫描报告可回跳)(?=[\s\S]*?AgentTask 入口关闭)(?=[\s\S]*?扫描报告入口关闭)/,
  'AgentChat closure rail must expose an explicit action gate with ready, partial and blocked reasons for audit, AgentTask and scan report entries.'
)
requirePattern(
  css,
  /\.sl-agent-chat-trust-loop-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)[\s\S]*?@media[\s\S]*?\.sl-agent-chat-trust-loop-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)[\s\S]*?@media[\s\S]*?\.sl-agent-chat-trust-loop-grid,[\s\S]*?grid-template-columns:\s*1fr/,
  'AgentChat trust workbench must define 4-column desktop, 2-column tablet and single-column mobile layouts.'
)
requirePattern(
  agentChat,
  /useSearchParams[\s\S]*?parseCodeUnderstandingHandoff\(searchParams\)[\s\S]*?handleCreateHandoffAgentTask[\s\S]*?let targetConversationId = activeConvId \|\| null[\s\S]*?conversationApi\.create\(targetProjectId, \{ title \}\)[\s\S]*?prev\.some\(item => item\.id === conversation\.id\)[\s\S]*?targetConversationId = conversation\.id[\s\S]*?rawPromptStored:\s*false[\s\S]*?autoStarted:\s*false[\s\S]*?agentTaskApi\.create[\s\S]*?conversationId:\s*targetConversationId[\s\S]*?taskType:\s*'CUSTOM'/,
  'AgentChat must consume code-understanding handoff params and expose an explicit PENDING AgentTask binding CTA that creates/selects a conversation, blocks missing scanTaskId, and never auto-starts or stores raw prompt.'
)
requirePattern(
  agentChat,
  /function CodeUnderstandingHandoffPanel[\s\S]*?const canCreateBoundTask = Boolean\(handoff\.scanTaskId\)[\s\S]*?const createDisabledReason = canCreateBoundTask \? null : '缺少成功扫描任务，无法创建绑定 AgentTask。'[\s\S]*?aria-label="代码理解交接包"[\s\S]*?\{activeConversationId && \([\s\S]*?label="使用交接问题"[\s\S]*?disabled=\{!canCreateBoundTask \|\| binding\}[\s\S]*?label=\{activeConversationId \? '创建绑定任务' : '创建绑定任务并进入会话'\}[\s\S]*?label="仅新建对话"/,
  'AgentChat handoff panel must hide use-prompt before a conversation exists, make create-bound-task the primary pre-conversation CTA, and disable it without scanTaskId.'
)
requirePattern(
  projectDetail,
  /function buildCodeUnderstandingAgentHandoffUrl[\s\S]*?const safeFilePath = redactSensitiveText\(chunk\.filePath\)[\s\S]*?const safeLineRef = redactSensitiveText\(chunkLineReference\(chunk\)\)[\s\S]*?params\.set\('handoff', 'code-understanding'\)[\s\S]*?params\.set\('source', 'PROJECT_QA_CODE_UNDERSTANDING_LENS'\)[\s\S]*?params\.set\('inputKind', querySignal\.kind\)[\s\S]*?params\.set\('inputLabel', redactSensitiveText\(querySignal\.label\)\)[\s\S]*?params\.set\('filePath', safeFilePath\)[\s\S]*?params\.set\('lineRef', safeLineRef\)[\s\S]*?return `\/agent-chat\?\$\{params\.toString\(\)\}`/,
  'ProjectDetail code understanding lens must build a structured display-redacted AgentChat handoff URL without embedding raw code.'
)
rejectPattern(
  projectDetail,
  /function buildCodeUnderstandingAgentHandoffUrl[\s\S]*?params\.set\('prompt'/,
  'ProjectDetail AgentChat handoff URL must not store raw prompt text in query params.'
)
rejectPattern(
  projectDetail,
  /function buildCodeUnderstandingAgentHandoffUrl[\s\S]*?params\.set\('filePath', chunk\.filePath\)|function buildCodeUnderstandingAgentHandoffUrl[\s\S]*?params\.set\('lineRef', chunkLineReference\(chunk\)\)/,
  'ProjectDetail AgentChat handoff URL must not store raw filePath or raw lineRef directly.'
)
requirePattern(
  agentChat,
  /function agentTaskDeepLinkUrl\(projectId:\s*number,\s*taskId:\s*number\)[\s\S]*?projectId:\s*String\(projectId\)[\s\S]*?taskId:\s*String\(taskId\)[\s\S]*?return `\/agent-tasks\?\$\{params\.toString\(\)\}`/,
  'AgentChat closure rail must build AgentTasks deep links with projectId and taskId.'
)
requirePattern(
  agentChat,
  /auditUrl=\{auditProjectId && activeConvId \? agentToolAuditUrl\(auditProjectId,\s*activeConvId\) : undefined\}/,
  'AgentChat tool evidence block must receive an audit deep link for the active conversation.'
)
requirePattern(
  agentChat,
  /<ActionButton[\s\S]*?href=\{auditUrl\}[\s\S]*?label="查看审计"/,
  'AgentChat tool evidence strip must expose a visible audit action.'
)
requirePattern(
  agentChat,
  /className="sl-agent-chat-streaming-line" role="status" aria-live="polite"/,
  'AgentChat streaming status must be announced politely.'
)
requirePattern(
  agentChat,
  /import \{ redactSensitiveText \} from '\.\.\/utils\/displayRedaction'[\s\S]*?function redactAgentChatText\(value\?: string \| null\): string[\s\S]*?return value \? redactSensitiveText\(value\) : ''/,
  'AgentChat message and error display text must use the shared displayRedaction utility.'
)
requirePattern(
  agentChat,
  /<div className="sl-agent-chat-content">\{redactAgentChatText\(msg\.content\)\}<\/div>[\s\S]*?\{msg\.errorMessage && <Tag color="error">\{redactAgentChatText\(msg\.errorMessage\)\}<\/Tag>\}/,
  'AgentChat persisted message content and errorMessage must render only redacted display text.'
)
requirePattern(
  agentChat,
  /<div className="sl-agent-chat-content">[\s\S]*?\{redactAgentChatText\(msg\.content\)\}[\s\S]*?\{msg\.status === 'streaming' && <span className="cursor-blink">\|<\/span>\}/,
  'AgentChat streaming message content must render redacted display text.'
)
requirePattern(
  agentChat,
  /<h1>\{redactAgentChatText\(selectedConversation\?\.title \|\| '代码理解会话'\)\}<\/h1>/,
  'AgentChat selected conversation title must render only redacted display text.'
)
requirePattern(
  agentChat,
  /const title = redactAgentChatText\(conversation\.title \|\| '新对话'\)[\s\S]*?<strong>\{title\}<\/strong>[\s\S]*?label=\{`删除对话 \$\{title \|\| conversation\.id\}`\}/,
  'AgentChat sidebar title and delete accessible label must render only redacted display text.'
)
requirePattern(
  agentChat,
  /const sourceLabel = redactAgentChatText\(handoff\.sourceLabel\)[\s\S]*?const lineRef = redactAgentChatText\(handoff\.lineRef\)[\s\S]*?const filePath = redactAgentChatText\(handoff\.filePath\)[\s\S]*?<strong>\{sourceLabel\} · \{lineRef\}<\/strong>[\s\S]*?title=\{filePath\}[\s\S]*?\{filePath\}/,
  'AgentChat code-understanding handoff source label, lineRef, filePath and title attribute must render only redacted display text.'
)
requirePattern(
  agentChat,
  /function sanitizeCodeUnderstandingHandoffParams\(params: URLSearchParams\): URLSearchParams \| null[\s\S]*?const textKeys = \[[\s\S]*?'filePath'[\s\S]*?'lineRef'[\s\S]*?\][\s\S]*?const redacted = redactAgentChatText\(value\)[\s\S]*?sanitized\.set\(key,\s*redacted\)/,
  'AgentChat code-understanding handoff URL params must be replaced with redacted query values when they contain sensitive text.'
)
rejectPattern(
  agentChat,
  /<div className="sl-agent-chat-content">\{msg\.content/,
  'AgentChat must not render raw msg.content directly.'
)
rejectPattern(
  agentChat,
  /<Tag color="error">\{msg\.errorMessage\}<\/Tag>/,
  'AgentChat must not render raw msg.errorMessage directly.'
)
rejectPattern(
  agentChat,
  /<h1>\{selectedConversation\?\.title/,
  'AgentChat must not render raw selectedConversation.title directly.'
)
rejectPattern(
  agentChat,
  /<strong>\{conversation\.title \|\| '新对话'\}<\/strong>/,
  'AgentChat must not render raw conversation.title directly.'
)
rejectPattern(
  agentChat,
  /title=\{handoff\.filePath\}|>\{handoff\.filePath\}<\/div>|>\{handoff\.lineRef\}<\/strong>/,
  'AgentChat handoff filePath and lineRef must not render raw URL/query values directly.'
)
requirePattern(
  agentChat,
  /<IconActionButton label="刷新当前会话" tooltip="刷新当前会话" icon=\{<ReloadOutlined\s+\/>\} onClick=\{handleRefresh\} \/>/,
  'AgentChat header refresh command must use the labelled IconActionButton in READY and EMPTY states.'
)
requirePattern(
  agentChat,
  /const title = redactAgentChatText\(conversation\.title \|\| '新对话'\)[\s\S]*?<IconActionButton[\s\S]*?label=\{`删除对话 \$\{title \|\| conversation\.id\}`\}[\s\S]*?tooltip="删除"[\s\S]*?icon=\{<DeleteOutlined\s+\/>\}[\s\S]*?event\.stopPropagation\(\)[\s\S]*?\/>/,
  'AgentChat conversation delete action must use IconActionButton.'
)
requirePattern(
  agentChat,
  /className="sl-agent-chat-conversation-list"\s+role="list"\s+aria-label="会话池"/,
  'AgentChat conversation list must expose list semantics and an accessible name.'
)
requirePattern(
  agentChat,
  /<div\s+role="listitem"[\s\S]*?className=\{`sl-agent-chat-conversation \$\{active \? 'sl-agent-chat-conversation-active' : ''\}`\}/,
  'AgentChat conversation rows must be list items instead of simulated buttons.'
)
requirePattern(
  agentChat,
  /<Link[\s\S]*?to=\{`\/agent-chat\/\$\{conversation\.id\}`\}[\s\S]*?aria-current=\{active \? 'page' : undefined\}[\s\S]*?className="sl-agent-chat-conversation-select"/,
  'AgentChat conversation selection must use a native Link with current-page semantics.'
)
requirePattern(
  css,
  /\.sl-agent-chat-conversation-select\s*\{(?=[^}]*width:\s*100%;)(?=[^}]*text-align:\s*left;)(?=[^}]*background:\s*transparent;)(?=[^}]*border:\s*0;)[^}]*\}/s,
  'AgentChat conversation selection Link must reset button-like layout without becoming a nested interactive container.'
)
requirePattern(
  css,
  /\.sl-agent-chat-conversation-select:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--sl-primary\);[^}]*outline-offset:\s*2px;/s,
  'AgentChat conversation selection Link must show a visible keyboard focus ring.'
)
rejectPattern(
  agentChat,
  /role="button"[\s\S]*?className=\{`sl-agent-chat-conversation/,
  'AgentChat conversation rows must not use simulated div role=button controls.'
)
rejectPattern(
  css,
  /\.sl-agent-chat-conversation\s*\{[^}]*outline:\s*none\s*;/s,
  'AgentChat conversation rows must not suppress outlines on the row container.'
)
rejectPattern(
  agentChat,
  /<Button\b/,
  'AgentChat must not reintroduce raw Ant Design Button for chat actions.'
)
requirePattern(
  agentTasks,
  /const requestedTaskId = parsePositiveNumber\(searchParams\.get\('taskId'\)\)[\s\S]*?appliedRequestedTaskIdRef[\s\S]*?tasks\.find\(task => task\.id === requestedTaskId\)[\s\S]*?agentTaskApi\.detail\(requestedTaskId\)[\s\S]*?handleSelectTask\(detail\)/,
  'AgentTasks must support taskId URL deep links with list match and detail API fallback.'
)
requirePattern(
  css,
  /\.sl-agent-chat-closure-rail\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-agent-chat-closure-gate\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-agent-chat-closure-gate-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-agent-chat-manual-send-proof\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-agent-chat-manual-send-proof-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-agent-chat-closure-actions\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-agent-chat-closure-actions \.ant-btn\s*\{[\s\S]*?width:\s*100%;[\s\S]*?\.sl-agent-chat-closure-copy\s*\{[\s\S]*?overflow-wrap:\s*anywhere;/s,
  'AgentChat closure rail CSS must keep the action gate, manual send proof, actions and long copy readable at narrow widths.'
)
requirePattern(
  css,
  /\.sl-agent-chat-thread-panel-handoff\s*\{[\s\S]*?grid-template-rows:\s*auto auto auto auto minmax\(0,\s*1fr\) auto;[\s\S]*?\.sl-agent-chat-handoff\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-agent-chat-handoff-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-agent-chat-handoff-file\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?@media \(max-width: 1200px\)[\s\S]*?\.sl-agent-chat-thread-panel,[\s\S]*?\.sl-agent-chat-thread-panel-handoff\s*\{[\s\S]*?grid-template-rows:\s*auto auto minmax\(0,\s*1fr\) auto;[\s\S]*?\.sl-agent-chat-mobile-secondary \.sl-agent-chat-handoff\s*\{[\s\S]*?margin:\s*0;/s,
  'AgentChat handoff CSS must preserve the six-row desktop state/banner grid, long-path wrapping and thread-first secondary placement.'
)
requirePattern(
  agentToolCall,
  /import \{ useId,\s*useState \} from 'react'/,
  'AgentToolCall must use stable generated ids for button/body/status ARIA relationships.'
)
requirePattern(
  agentToolCall,
  /aria-expanded=\{expanded\}[\s\S]*?aria-controls=\{bodyId\}[\s\S]*?aria-describedby=\{statusId\}[\s\S]*?aria-label=\{`\$\{label\}：\$\{summary \|\| '无摘要'\}，\$\{statusText\}`\}/,
  'AgentToolCall toggle must expose expanded state, controlled region and readable status.'
)
requirePattern(
  agentToolCall,
  /<div id=\{bodyId\} className="sl-agent-tool-call-body" role="region" aria-labelledby=\{buttonId\}>/,
  'AgentToolCall expanded body must be a labelled region controlled by the toggle.'
)
requirePattern(
  agentToolCall,
  /<span id=\{statusId\} className="sl-agent-tool-call-status">[\s\S]*?等待结果[\s\S]*?执行成功[\s\S]*?执行失败/,
  'AgentToolCall status must include localized visible pending, success and failure text.'
)
requirePattern(
  agentToolCall,
  /function buildResultSummary\(result:\s*string \| null,\s*success\?:\s*boolean\):\s*string[\s\S]*?工具调用已返回 \$\{lineCount\} 行内容/,
  'AgentToolCall expanded content must include a human-readable result summary before raw payload.'
)
requirePattern(
  agentToolCall,
  /import \{ redactAndTruncateText,\s*redactSensitiveText,\s*stringifyRedactedPayload \} from '\.\.\/utils\/displayRedaction'/,
  'AgentToolCall must use the shared displayRedaction utility for args, result and summary redaction.'
)
requirePattern(
  agentToolCall,
  /const redactedArgsPreview = stringifyRedactedPayload\(args\)[\s\S]*?const redactedResultPreview = buildRedactedPayloadPreview\(result\)/,
  'AgentToolCall must build redacted args and result previews before rendering expanded payloads.'
)
requirePattern(
  agentToolCall,
  /function buildRedactedPayloadPreview\(value: string \| null\): string \| null[\s\S]*?return redactAndTruncateText\(value, 3000\)/,
  'AgentToolCall result preview must go through the shared JSON-or-text display redaction and truncation helper.'
)
requirePattern(
  agentToolCall,
  /case 'shell_exec':[\s\S]*?return redactSensitiveText\(String\(args\.command \|\| ''\)\)\.slice\(0, 80\)[\s\S]*?default:[\s\S]*?return redactSensitiveText\(stringifyRedactedPayload\(args\)\)\.slice\(0, 60\)/,
  'AgentToolCall summaries must use shared text/payload redaction before rendering compact labels.'
)
rejectPattern(
  agentToolCall,
  /JSON\.stringify\(args\b/,
  'AgentToolCall must not render raw JSON.stringify(args); use stringifyRedactedPayload(args).'
)
rejectPattern(
  agentToolCall,
  /<pre[^>]*>\s*\{resultPreview\}\s*<\/pre>/s,
  'AgentToolCall result <pre> must render a redacted preview, not raw resultPreview.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /rawSecretSentinel[\s\S]*?toolCallsJson:[\s\S]*?authorization[\s\S]*?apiKey[\s\S]*?api_key[\s\S]*?privateKey[\s\S]*?private_key[\s\S]*?accessToken[\s\S]*?access_token[\s\S]*?refreshToken[\s\S]*?refresh_token[\s\S]*?toolResultsJson:[\s\S]*?apiKey=\$\{rawSecretSentinel\}[\s\S]*?not\.toContain\(rawSecretSentinel\)[\s\S]*?toContain\(redactedSecretLabel\)/,
  'AgentChat closure rail smoke must seed raw AgentToolCall secrets and assert redacted UI output.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /agentToolCallRedaction:\s*\{[\s\S]*?scope:\s*'AGENT_TOOL_CALL_ARGS_RESULT_DISPLAY_REDACTION_ONLY'[\s\S]*?fixtureHasJsonArgsSecret:\s*true[\s\S]*?fixtureHasPlainTextArgsSecret:\s*true[\s\S]*?fixtureHasJsonResultSecret:\s*true[\s\S]*?fixtureHasPlainTextResultSecret:\s*true[\s\S]*?rawSecretsHidden:[\s\S]*?bodyRawSecretsHidden:[\s\S]*?redactionVisible:[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?markerText[\s\S]*?not\.toContain\(rawSecretSentinel\)/,
  'AgentChat closure rail smoke marker must include AgentToolCall args/result display redaction proof and exclude raw secret sentinels.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /agentChatMessageSafeMarker[\s\S]*?agentChatErrorSafeMarker[\s\S]*?rawAgentChatAuthorizationSecret[\s\S]*?rawAgentChatBearerSecret[\s\S]*?rawAgentChatApiKeySecret[\s\S]*?rawAgentChatJwtSecret[\s\S]*?rawAgentChatPasswordSecret[\s\S]*?content:[\s\S]*?agentChatMessageSafeMarker[\s\S]*?errorMessage:[\s\S]*?agentChatErrorSafeMarker[\s\S]*?forbiddenAgentChatMessageSecrets[\s\S]*?not\.toContain\(secret\)[\s\S]*?agentChatMessageErrorRedaction:\s*\{[\s\S]*?scope:\s*'AGENT_CHAT_MESSAGE_ERROR_DISPLAY_REDACTION_ONLY'[\s\S]*?fixtureHasMessageContentSecret:\s*true[\s\S]*?fixtureHasErrorMessageSecret:\s*true[\s\S]*?messageRawSecretsHidden:[\s\S]*?errorRawSecretsHidden:[\s\S]*?bodyRawSecretsHidden:[\s\S]*?urlRawSecretsHidden:[\s\S]*?markerContainsRawSecret:\s*false/,
  'AgentChat closure rail smoke must seed message/error secrets and prove persisted message/error display redaction separately from tool-call redaction.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /rawAgentChatTitleSecret[\s\S]*?agentChatTitleSafeMarker[\s\S]*?rawAgentChatHandoffPathSecret[\s\S]*?rawAgentChatApiErrorSecret[\s\S]*?agentChatApiErrorSafeMarker[\s\S]*?forbiddenAgentChatTitleSecrets[\s\S]*?forbiddenAgentChatHandoffSecrets[\s\S]*?forbiddenAgentChatApiErrorSecrets[\s\S]*?agentChatConversationTitleRedaction:\s*\{[\s\S]*?scope:\s*'AGENT_CHAT_CONVERSATION_TITLE_DISPLAY_REDACTION_ONLY'[\s\S]*?titleRawSecretsHidden:[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?agentChatHandoffDisplayRedaction:\s*\{[\s\S]*?scope:\s*'AGENT_CHAT_HANDOFF_TITLE_FILE_PATH_DISPLAY_REDACTION_ONLY'[\s\S]*?handoffRawSecretsHidden:[\s\S]*?urlRawSecretsHidden:[\s\S]*?requestInputRawSecretsHidden:[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?agentChatApiErrorStateRedaction:\s*\{[\s\S]*?scope:\s*'AGENT_CHAT_API_ERROR_STATE_DISPLAY_REDACTION_ONLY'[\s\S]*?errorStateRawSecretsHidden:[\s\S]*?toastRawSecretsHidden:[\s\S]*?markerContainsRawSecret:\s*false/,
  'AgentChat closure rail smoke must prove title, handoff URL/display and API error/toast display redaction with separate marker scopes.'
)
requirePattern(
  css,
  /\.sl-agent-tool-call-head:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--sl-primary\);[^}]*outline-offset:\s*2px;/s,
  'AgentToolCall toggle must expose a visible keyboard focus ring.'
)
requirePattern(
  css,
  /\.sl-agent-chat-evidence-strip\s*\{[^}]*flex-wrap:\s*wrap;/s,
  'AgentChat evidence summary strip must wrap safely.'
)
requirePattern(
  css,
  /\.sl-agent-chat-evidence-strip strong\s*\{[^}]*overflow-wrap:\s*anywhere;/s,
  'AgentChat evidence summary text must break long evidence summaries safely.'
)
requirePattern(
  modelConfig,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'ModelConfig primary actions must use the shared ActionButton primitive.'
)
requirePattern(
  modelConfig,
  /import \{ formatApiError,\s*showApiError \} from '\.\.\/api\/client'/,
  'ModelConfig recoverable provider errors must use formatApiError while retaining showApiError toast.'
)
requirePattern(
  modelConfig,
  /import StateBlock from '\.\.\/components\/ui\/StateBlock'/,
  'ModelConfig provider config failures must use the shared StateBlock primitive.'
)
requirePattern(
  modelConfig,
  /<ActionButton\s+size="small"\s+type="primary"\s+icon=\{<ThunderboltOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*handleActivate\(record\.id\)\}\s+label="激活"\s*\/>/,
  'ModelConfig activate action must use a primary ActionButton.'
)
requirePattern(
  modelConfig,
  /<ActionButton\s+type="primary"\s+icon=\{<PlusOutlined\s+\/>\}\s+onClick=\{handleCreate\}\s+label="添加配置"\s*\/>/,
  'ModelConfig create action must use a primary ActionButton.'
)
requirePattern(
  modelConfig,
  /const \[loadError,\s*setLoadError\] = useState<string \| null>\(null\)[\s\S]*?setLoadError\(formatApiError\(error,\s*'加载模型配置失败'\)\)[\s\S]*?showApiError\(error,\s*'加载模型配置失败'\)/,
  'ModelConfig list failures must preserve a retryable page-level error while retaining the toast.'
)
requirePattern(
  modelConfig,
  /title="模型配置加载失败"[\s\S]*?description=\{loadError\}[\s\S]*?label="重新加载配置"/,
  'ModelConfig initial provider list failures must render a retryable StateBlock.'
)
requirePattern(
  modelConfig,
  /title="模型配置刷新失败，已保留上次成功数据"[\s\S]*?description=\{loadError\}[\s\S]*?label="重新加载配置"/,
  'ModelConfig refresh failures must preserve cached table data and expose retry.'
)
requirePattern(
  modelConfig,
  /const \[operationError,\s*setOperationError\] = useState<\{ title: string; description: string \} \| null>\(null\)[\s\S]*?title=\{operationError\.title\}[\s\S]*?description=\{operationError\.description\}/,
  'ModelConfig activate/delete failures must surface a persistent operation error state.'
)
requirePattern(
  modelConfig,
  /const \[submitError,\s*setSubmitError\] = useState<string \| null>\(null\)[\s\S]*?message=\{editingConfig \? '模型配置保存失败' : '模型配置创建失败'\}[\s\S]*?description=\{submitError\}/,
  'ModelConfig save/create failures must render an inline modal error.'
)
requirePattern(
  modelConfig,
  /locale=\{\{\s*emptyText:\s*<StateBlock compact title="暂无模型配置"/,
  'ModelConfig empty provider table must use compact StateBlock instead of a generic empty table.'
)
requirePattern(
  modelConfig,
  /interface ModelGovernanceStep[\s\S]*?const governanceSteps = useMemo<ModelGovernanceStep\[\]>\(\(\) => \[[\s\S]*?key: 'activation-gate'[\s\S]*?label: '激活门禁'[\s\S]*?key: 'secret-boundary'[\s\S]*?label: '密钥边界'[\s\S]*?key: 'endpoint-risk'[\s\S]*?label: 'Endpoint 风险'[\s\S]*?key: 'downstream-capability'[\s\S]*?label: '下游能力'[\s\S]*?<ModelProviderGovernancePanel steps=\{governanceSteps\} \/>[\s\S]*?aria-label="模型供应商治理闭环"[\s\S]*?data-sl-model-governance-step=\{step\.key\}/,
  'ModelConfig must render a provider governance loop covering activation, secret boundary, endpoint risk and downstream capability.'
)
requirePattern(
  modelConfig,
  /function normalizeEndpoint\(url: string \| null \| undefined\)[\s\S]*?function isPresetEndpoint\(config: LlmConfig\)[\s\S]*?PROVIDER_PRESETS\[config\.provider\][\s\S]*?normalizeEndpoint\(config\.baseUrl\) === normalizeEndpoint\(preset\.baseUrl\)[\s\S]*?function hasEndpointOverride\(config: LlmConfig\)[\s\S]*?const endpointOverrideCount = useMemo\(\(\) => configs\.filter\(hasEndpointOverride\)\.length[\s\S]*?status: endpointOverrideCount > 0 \? `\$\{endpointOverrideCount\} 个需复核`[\s\S]*?\{hasEndpointOverride\(record\) &&[\s\S]*?<Tag color="warning">\{record\.provider === 'CUSTOM' \? '自定义' : '覆盖'\}<\/Tag>/,
  'ModelConfig Endpoint risk must detect actual baseUrl overrides, not only provider=CUSTOM.'
)
requirePattern(
  modelConfig,
  /function displayApiKeyBoundary\(apiKey: string\)[\s\S]*?return apiKey\.includes\('\*\*\*'\) \? apiKey : '已脱敏'[\s\S]*?<Text type="secondary">\{displayApiKeyBoundary\(key\)\}<\/Text>/,
  'ModelConfig must display API key boundary state through a redaction fallback instead of rendering raw apiKey.'
)
requirePattern(
  scanTaskDetail,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'ScanTaskDetail primary modal action must use the shared ActionButton primitive.'
)
rejectPattern(
  scanTaskDetail,
  /<Button\b/,
  'ScanTaskDetail must not reintroduce raw Ant Design Button for report and cockpit actions.'
)
requirePattern(
  scanTaskDetail,
  /<ActionButton aria-label="返回上一页"[\s\S]*?className="sl-scan-back-button"[\s\S]*?label="返回"\s*\/>/,
  'ScanTaskDetail back action must use ActionButton so cockpit button text keeps shared contrast rules.'
)
requirePattern(
  scanTaskDetail,
  /<ActionButton aria-label=\{`刷新扫描 #\$\{taskId\} 报告`\}[\s\S]*?label="刷新"\s*\/>/,
  'ScanTaskDetail refresh action must use ActionButton.'
)
requirePattern(
  scanTaskDetail,
  /<ActionButton disabled=\{!hasConfirmedRiskArray\} onClick=\{\(\)\s*=>\s*setActiveReportTab\('quality'\)\} label="风险" \/>[\s\S]*?<ActionButton disabled=\{!hasConfirmedRiskArray\} onClick=\{\(\)\s*=>\s*setActiveReportTab\('graph'\)\} label="依赖图谱" \/>/,
  'ScanTaskDetail evidence tab shortcuts must use ActionButton with visible labels.'
)
requirePattern(
  scanTaskDetail,
  /footer=\{<ActionButton\s+type="primary"\s+onClick=\{\(\)\s*=>\s*setManualCopyText\(null\)\}\s+label="关闭"\s*\/>\}/,
  'ScanTaskDetail manual-copy modal close action must use a primary ActionButton.'
)
requirePattern(
  scanTaskDetail,
  /codeKnowledgeSignal=\{codeKnowledgeSignal\}/,
  'ScanTaskDetail report summary must pass code_chunks readiness into the report review gate.'
)
requirePattern(
  scanTaskDetail,
  /function ReportReviewGate\(\{ items \}: \{ items: ReportReviewGateItem\[\] \}\)[\s\S]*aria-label="报告复核门禁"[\s\S]*报告进入治理前检查[\s\S]*data-review-gate-key=\{item\.key\}/,
  'ScanTaskDetail must render a stable report review gate before report actions.'
)
requirePattern(
  scanTaskDetail,
  /key: 'report-readiness'[\s\S]*key: 'evidence-bundle'[\s\S]*key: 'code-knowledge'[\s\S]*key: 'repair-readiness'[\s\S]*key: 'audit-trace'/,
  'ScanTaskDetail report review gate must cover report, evidence, code_chunks, repair and audit readiness.'
)
requirePattern(
  actionButton,
  /cloneElement\(icon as ReactElement<DecorativeIconProps>,\s*\{[\s\S]*?'aria-hidden':\s*true,[\s\S]*?className:\s*\[currentClassName,\s*toneClass\]\.filter\(Boolean\)\.join\(' '\)\s*\|\|\s*undefined,[\s\S]*?focusable:\s*false,[\s\S]*?style:\s*style/s,
  'ActionButton must mark visible-label icons as decorative so icon names do not pollute accessible names.'
)
requirePattern(
  actionButton,
  /isPrimary\s*\?\s*'sl-action-button-primary'\s*:\s*null/,
  'ActionButton must attach a primary class so contrast safeguards do not depend only on Ant Design internals.'
)
requirePattern(
  actionButton,
  /'sl-action-button',[\s\S]*?isPrimary\s*\?\s*'sl-action-button-primary'\s*:\s*null,[\s\S]*?className,/,
  'ActionButton must attach shared and variant classes before consumer className.'
)
requirePattern(
  actionButton,
  /const\s+labelClasses\s*=\s*\[[\s\S]*?'sl-action-button-label'[\s\S]*?isReadablePrimary\s*\?\s*'sl-action-button-label-primary'\s*:\s*null[\s\S]*?isDisabledPrimary\s*\?\s*'sl-action-button-label-disabled'\s*:\s*null[\s\S]*?\]\.filter\(Boolean\)\.join\(' '\)/s,
  'ActionButton must add explicit label state classes for contrast safeguards.'
)
requirePattern(
  actionButton,
  /<span\s+className=\{labelClasses\}\s+style=\{labelStyle\}>\{label\}<\/span>/,
  'ActionButton must wrap visible text in the stable label container with the primary contrast fallback.'
)
requirePattern(
  iconActionButton,
  /aria-label=\{label\}/,
  'IconActionButton must expose its label as the accessible name.'
)
requirePattern(
  iconActionButton,
  /<Tooltip title=\{tooltip \|\| label\}>\{button\}<\/Tooltip>/,
  'IconActionButton must pair icon-only actions with a tooltip.'
)
requirePattern(
  iconActionButton,
  /const\s+variant\s*=\s*props\.type === 'primary'[\s\S]*?\?\s*'primary'[\s\S]*?:\s*props\.danger[\s\S]*?\?\s*'danger'[\s\S]*?:\s*props\.type === 'text'[\s\S]*?\?\s*'text'[\s\S]*?:\s*'default'/s,
  'IconActionButton must derive a stable primary/danger/text/default variant.'
)
requirePattern(
  iconActionButton,
  /'sl-icon-action-button',[\s\S]*?`sl-icon-action-button-\$\{variant\}`,[\s\S]*?className,[\s\S]*?\]\.filter\(Boolean\)\.join\(' '\)/s,
  'IconActionButton must attach shared and variant classes before consumer className.'
)
requirePattern(
  iconActionButton,
  /data-sl-variant=\{variant\}/,
  'IconActionButton must expose its stable variant for CSS and tests.'
)
requirePattern(
  iconActionButton,
  /cloneElement\(icon as ReactElement<DecorativeIconProps>,\s*\{\s*'aria-hidden':\s*true,\s*focusable:\s*false,\s*\}/s,
  'IconActionButton must mark icons as decorative and use aria-label for the action name.'
)
requirePattern(
  stateBlock,
  /role=\{tone === 'error' \? 'alert' : 'status'\}/,
  'StateBlock must expose error states as alerts and other states as status regions.'
)
requirePattern(
  stateBlock,
  /aria-live="polite"/,
  'StateBlock must announce state changes politely for assistive tech.'
)
requirePattern(
  stateBlock,
  /`sl-state-block-\$\{tone\}`/,
  'StateBlock must expose tone-specific class names for product-level styling.'
)
requirePattern(
  stateBlock,
  /compact \? 'sl-state-block-compact' : ''/,
  'StateBlock must support compact density for tables and drawers.'
)

const stateBlockPages = [
  ['Projects', projects],
  ['ExecutionTasks', executionTasks],
  ['Artifacts', artifacts],
  ['AgentTasks', agentTasks],
  ['AutoRepairs', autoRepairs],
  ['CiDiagnostics', ciDiagnostics],
  ['PrReviews', prReviews],
  ['IssueDecomposition', issueDecomposition],
]
for (const [name, source] of stateBlockPages) {
  requirePattern(
    source,
    /import StateBlock from '\.\.\/components\/ui\/StateBlock'/,
    `${name} must use the shared StateBlock primitive for empty/error/loading surfaces.`
  )
  requirePattern(
    source,
    /locale=\{\{\s*emptyText:[\s\S]*?(?:<StateBlock\s+compact[\s\S]*?title=|taskListEmptyText)/,
    `${name} primary table empty state must use compact StateBlock.`
  )
  rejectPattern(
    source,
    /locale=\{\{\s*emptyText:\s*<Empty\b/,
    `${name} primary table empty state must not use raw Ant Empty.`
  )
  rejectPattern(
    source,
    /<(Empty|Spin)\b/,
    `${name} must not use raw Ant Empty or Spin for product state surfaces covered by StateBlock.`
  )
}
for (const filePath of frontendStateSources) {
  rejectPattern(
    readFile(filePath),
    /\bEmpty\b|<Spin\b/,
    `${path.relative(rootDir, filePath)} must not use raw Ant Empty or Spin; use StateBlock or an explicit product component.`
  )
}
const additionalStateBlockSurfaces = [
  ['Dashboard', dashboard],
  ['ProjectDetail', projectDetail],
  ['ScanTaskDetail', scanTaskDetail],
  ['AgentChat', readFile(path.join(rootDir, 'web-console/src/pages/AgentChat.tsx'))],
  ['DependencyGraph', readFile(path.join(rootDir, 'web-console/src/pages/DependencyGraph.tsx'))],
  ['ArtifactPreviewRenderer', readFile(path.join(rootDir, 'web-console/src/components/ArtifactPreviewRenderer.tsx'))],
  ['TaskTimeline', readFile(path.join(rootDir, 'web-console/src/components/TaskTimeline.tsx'))],
  ['DiffViewer', readFile(path.join(rootDir, 'web-console/src/components/DiffViewer.tsx'))],
  ['LogViewer', readFile(path.join(rootDir, 'web-console/src/components/LogViewer.tsx'))],
  ['ProjectSelector', readFile(path.join(rootDir, 'web-console/src/components/ProjectSelector.tsx'))],
  ['ProtectedRoute', readFile(path.join(rootDir, 'web-console/src/components/ProtectedRoute.tsx'))],
]
for (const [name, source] of additionalStateBlockSurfaces) {
  requirePattern(
    source,
    /StateBlock/,
    `${name} must use StateBlock for loading/empty/error state surfaces.`
  )
}
const logViewer = readFile(path.join(rootDir, 'web-console/src/components/LogViewer.tsx'))
const diffViewer = readFile(path.join(rootDir, 'web-console/src/components/DiffViewer.tsx'))
const artifactPreviewRenderer = readFile(path.join(rootDir, 'web-console/src/components/ArtifactPreviewRenderer.tsx'))
requirePattern(
  logViewer,
  /import \{ redactSensitiveText \} from '\.\.\/utils\/displayRedaction'[\s\S]*?function redactSensitiveLog\(value: string\)[\s\S]*?return redactSensitiveText\(value\)[\s\S]*?const redactedValue = redactSensitiveLog\(value\)[\s\S]*?<pre className="sl-log-viewer" aria-label="脱敏执行日志"[\s\S]*?\{redactedValue\}/,
  'LogViewer must redact sensitive log tokens before rendering and expose a stable sanitized log region.'
)
rejectPattern(
  logViewer,
  /<pre[\s\S]*?\{value\}[\s\S]*?<\/pre>/,
  'LogViewer must not render the raw log value directly.'
)
requirePattern(
  diffViewer,
  /import \{ redactSensitiveText \} from '\.\.\/utils\/displayRedaction'[\s\S]*?function redactDiffLine\(line: string\): string \{[\s\S]*?return redactSensitiveText\(line\)/,
  'DiffViewer must use the shared displayRedaction text helper for sanitized diff lines.'
)
requirePattern(
  diffViewer,
  /<pre className="sl-diff-viewer sl-diff-viewer-redacted" aria-label="脱敏 diff 内容"[\s\S]*?const displayLine = redactDiffLine\(line\)[\s\S]*?\{displayLine\}/,
  'DiffViewer must render redacted displayLine values inside a stable sanitized diff region.'
)
rejectPattern(
  diffViewer,
  /<div[\s\S]*?>\s*\{line\}\s*<\/div>/,
  'DiffViewer must not render raw diff {line}; render display-redacted lines instead.'
)
requirePattern(
  artifactPreviewRenderer,
  /import \{ redactDisplayValue,\s*redactSensitiveText \} from '\.\.\/utils\/displayRedaction'/,
  'ArtifactPreviewRenderer must use the shared recursive display redaction utility for artifact previews.'
)
requirePattern(
  artifactPreviewRenderer,
  /const parsed = parseJson\(preview\.text\)[\s\S]*?formatPreview\(preview\.text, record\.contentType\)[\s\S]*?const redactedData = redactDisplayValue\(parsed\.data\)[\s\S]*?JSON\.stringify\(redactedData, null, 2\)[\s\S]*?<div className="sl-artifact-smart-preview sl-artifact-redacted-preview" aria-label="redacted artifact preview">[\s\S]*?renderByType\(record\.artifactType, asRecord\(redactedData\)\)[\s\S]*?<pre className="sl-code-block sl-artifact-preview sl-artifact-redacted-raw-json" aria-label="redacted raw artifact JSON">[\s\S]*?\{JSON\.stringify\(redactedData, null, 2\)\}/,
  'ArtifactPreviewRenderer must render only redacted preview text and redacted raw JSON while preserving smart preview structure.'
)
rejectPattern(
  artifactPreviewRenderer,
  /JSON\.stringify\(parsed\.data, null, 2\)/,
  'ArtifactPreviewRenderer must not stringify parsed raw artifact data directly into visible UI.'
)
requirePattern(
  readFile(path.join(rootDir, 'web-console/src/components/ProjectSelector.tsx')),
  /import\s+\{\s*useNavigate\s*\}\s+from\s+['"]react-router-dom['"][\s\S]*?import ActionButton from '\.\/ui\/ActionButton'/,
  'ProjectSelector empty state must import navigation and ActionButton so blocked workflows have a direct next action.'
)
requirePattern(
  readFile(path.join(rootDir, 'web-console/src/components/ProjectSelector.tsx')),
  /<StateBlock[\s\S]*?title="暂无项目"[\s\S]*?description="先创建项目并接入公开仓库，审计、任务、产物、修复和报告页面才能形成完整闭环。"[\s\S]*?<ActionButton[\s\S]*?type="primary"[\s\S]*?onClick=\{\(\)\s*=>\s*navigate\('\/projects'\)\}[\s\S]*?label="去项目管理"[\s\S]*?\/>[\s\S]*?\/>/,
  'ProjectSelector empty state must provide a primary “去项目管理” action for project-dependent workflows.'
)
requirePattern(
  ciDiagnostics,
  /<StateBlock\s+tone="loading"\s+title="正在分析 CI 日志"[\s\S]*?\/>/,
  'CiDiagnostics analyzing detail state must use StateBlock loading tone.'
)
requirePattern(
  prReviews,
  /<StateBlock\s+tone="loading"\s+title="正在分析 PR 变更"[\s\S]*?\/>/,
  'PrReviews analyzing detail state must use StateBlock loading tone.'
)
for (const [name, source, pageErrorTitle] of [
  ['AgentTasks', agentTasks, 'Agent 任务加载失败'],
  ['PrReviews', prReviews, 'PR 审查加载失败'],
  ['CiDiagnostics', ciDiagnostics, 'CI 诊断加载失败'],
]) {
  requirePattern(
    source,
    /import \{ formatApiError,\s*showApiError \} from '\.\.\/api\/client'/,
    `${name} recoverable query failures must retain a page-level formatted API error.`
  )
  requirePattern(
    source,
    new RegExp(`StateBlock[\\s\\S]*?tone="error"[\\s\\S]*?title="${pageErrorTitle}"[\\s\\S]*?<ActionButton[\\s\\S]*?icon=\\{<ReloadOutlined\\s+\\/>\\}[\\s\\S]*?label="(?:重试|重试加载)"`),
    `${name} list query failures must render a visible StateBlock error with retry.`
  )
}
requirePattern(
  agentTasks,
  /const \[taskListError,\s*setTaskListError\] = useState<string \| null>\(null\)[\s\S]*?setTaskListError\(formatApiError\(error,\s*'加载任务失败'\)\)[\s\S]*?showApiError\(error,\s*'加载任务失败'\)/,
  'AgentTasks task list loading failure must set a recoverable page error while preserving the toast.'
)
requirePattern(
  agentTasks,
  /const \[stepsError,\s*setStepsError\] = useState<string \| null>\(null\)[\s\S]*?setStepsError\(formatApiError\(error,\s*'加载步骤失败'\)\)[\s\S]*?showApiError\(error,\s*'加载步骤失败'\)/,
  'AgentTasks step loading failure must set a recoverable detail error while preserving the toast.'
)
requirePattern(
  agentTasks,
  /children:\s*stepsError \? \([\s\S]*?<StateBlock[\s\S]*?tone="error"[\s\S]*?title="执行步骤加载失败"[\s\S]*?onClick=\{\(\)\s*=>\s*fetchSteps\(selectedTask\.id\)\}[\s\S]*?label="重试加载"/,
  'AgentTasks steps tab must show a retryable error state instead of falling through to an empty timeline.'
)
requirePattern(
  prReviews,
  /const \[listError,\s*setListError\] = useState<string \| null>\(null\)[\s\S]*?setListError\(formatApiError\(error,\s*'加载 PR 审查失败'\)\)[\s\S]*?showApiError\(error,\s*'加载 PR 审查失败'\)/,
  'PrReviews list loading failure must set a recoverable page error while preserving the toast.'
)
requirePattern(
  prReviews,
  /const \[commentsError,\s*setCommentsError\] = useState<string \| null>\(null\)[\s\S]*?setCommentsError\(formatApiError\(error,\s*'加载行级评论失败'\)\)[\s\S]*?showApiError\(error,\s*'加载行级评论失败'\)/,
  'PrReviews comment loading failure must set a recoverable detail error while preserving the toast.'
)
requirePattern(
  prReviews,
  /commentsError \? \([\s\S]*?<StateBlock[\s\S]*?tone="error"[\s\S]*?title="行级评论加载失败"[\s\S]*?onClick=\{\(\)\s*=>\s*fetchComments\(selected\.id\)\}[\s\S]*?label="重试"/,
  'PrReviews line comments must show a retryable error state instead of falling through to empty comments.'
)
requirePattern(
  ciDiagnostics,
  /const \[listError,\s*setListError\] = useState<string \| null>\(null\)[\s\S]*?setListError\(formatApiError\(error,\s*'加载 CI 诊断失败'\)\)[\s\S]*?showApiError\(error,\s*'加载 CI 诊断失败'\)/,
  'CiDiagnostics list loading failure must set a recoverable page error while preserving the toast.'
)
requirePattern(
  ciDiagnostics,
  /import \{ redactSensitiveText \} from '\.\.\/utils\/displayRedaction'[\s\S]*?function redactCiLogSnippet\(value: string\)[\s\S]*?return redactSensitiveText\(value\)[\s\S]*?const selectedRedactedRawLogSnippet = useMemo\([\s\S]*?redactCiLogSnippet\(selected\.rawLogSnippet\)[\s\S]*?<pre className="sl-ci-log sl-ci-log-redacted" aria-label="脱敏 CI 日志片段">\{selectedRedactedRawLogSnippet\}<\/pre>/,
  'CiDiagnostics must display-redact rawLogSnippet before rendering the visible CI log snippet.'
)
rejectPattern(
  ciDiagnostics,
  /<pre className="sl-ci-log">\{selected\.rawLogSnippet\}<\/pre>/,
  'CiDiagnostics must not render selected.rawLogSnippet directly.'
)
for (const [name, source] of [
  ['AutoRepairs', autoRepairs],
]) {
  requirePattern(
    source,
    /import \{ formatApiError,\s*showApiError \} from '\.\.\/api\/client'/,
    `${name} recoverable query failures must retain a page-level formatted API error.`
  )
}
requirePattern(
  agentChat,
  /import \{ formatApiError \} from '\.\.\/api\/client'[\s\S]*?function redactAgentChatApiError\(error: unknown,\s*fallback: string\): string[\s\S]*?return redactAgentChatText\(formatApiError\(error,\s*fallback\)\)[\s\S]*?function showRedactedAgentChatApiError\(error: unknown,\s*fallback: string\): void[\s\S]*?antdMessage\.error\(redactAgentChatApiError\(error,\s*fallback\)\)/,
  'AgentChat recoverable query failures must format API errors and redact them before page state or toast display.'
)
requirePattern(
  agentChat,
  /const \[projectListError,\s*setProjectListError\] = useState<string \| null>\(null\)[\s\S]*?const errorText = redactAgentChatApiError\(error,\s*'加载项目列表失败'\)[\s\S]*?if \(projectSnapshotReadyRef\.current\) \{[\s\S]*?markStaleRefresh\(\{ scope: 'projects', ownerId: null, message: errorText \}\)[\s\S]*?\} else \{[\s\S]*?setProjectListError\(errorText\)[\s\S]*?showRedactedAgentChatApiError\(error,\s*'加载项目列表失败'\)[\s\S]*?const handleFatalRetry = \(\) => \{[\s\S]*?if \(!projectSnapshotReady\) \{[\s\S]*?loadProjects\(\)[\s\S]*?title="项目列表加载失败"[\s\S]*?onClick=\{\(\) => loadProjects\(\)\}[\s\S]*?label="重试加载"/,
  'AgentChat project failures must retain a trusted snapshot as STALE, otherwise route retry through the centralized fatal action and Drawer/sidebar retry.'
)
requirePattern(
  agentChat,
  /const \[conversationListError,\s*setConversationListError\] = useState<string \| null>\(null\)[\s\S]*?const errorText = redactAgentChatApiError\(error,\s*'加载对话列表失败'\)[\s\S]*?if \(conversationSnapshotProjectRef\.current === targetProjectId\) \{[\s\S]*?markStaleRefresh\(\{ scope: 'conversations', ownerId: targetProjectId, message: errorText \}\)[\s\S]*?\} else \{[\s\S]*?setConversationListError\(errorText\)[\s\S]*?showRedactedAgentChatApiError\(error,\s*'加载对话列表失败'\)[\s\S]*?if \(projectId && !hasTrustedConversations\) loadConversations\(\)[\s\S]*?title="会话列表加载失败"[\s\S]*?onClick=\{\(\) => loadConversations\(\)\}[\s\S]*?label="重试加载"/,
  'AgentChat conversation-list failures must distinguish trusted STALE data from fatal unconfirmed ownership and keep both centralized and pool retry paths.'
)
requirePattern(
  agentChat,
  /const \[messagesError,\s*setMessagesError\] = useState<string \| null>\(null\)[\s\S]*?const errorText = redactAgentChatApiError\(error,\s*'加载对话消息失败'\)[\s\S]*?if \(messageSnapshotConversationRef\.current === conversation\) \{[\s\S]*?markStaleRefresh\(\{ scope: 'messages', ownerId: conversation, message: errorText \}\)[\s\S]*?\} else \{[\s\S]*?setMessages\(\[\]\)[\s\S]*?setMessagesError\(errorText\)[\s\S]*?showRedactedAgentChatApiError\(error,\s*'加载对话消息失败'\)[\s\S]*?if \(activeConvId && !hasTrustedMessages\) loadMessages\(activeConvId\)[\s\S]*?messagesError && !hasTrustedMessages \? \([\s\S]*?title="对话消息加载失败"[\s\S]*?\) : messages\.length === 0/,
  'AgentChat message failures must retain trusted messages as STALE, use centralized fatal retry when unconfirmed, and render the error branch before EMPTY.'
)
requirePattern(
  agentChat,
  /const \[closureTaskError,\s*setClosureTaskError\] = useState<string \| null>\(null\)[\s\S]*?setClosureTaskError\(redactAgentChatApiError\(error,\s*'加载 Agent 任务闭环失败'\)\)[\s\S]*?showRedactedAgentChatApiError\(error,\s*'加载 Agent 任务闭环失败'\)[\s\S]*?title="Agent 任务闭环加载失败"[\s\S]*?onClick=\{onRetry\}[\s\S]*?label="重试加载"/,
  'AgentChat closure rail task loading failure must render a retryable in-page error without treating unbound conversations as errors.'
)
requirePattern(
  autoRepairs,
  /const \[listError,\s*setListError\] = useState<string \| null>\(null\)[\s\S]*?setListError\(formatApiError\(error,\s*'加载任务列表失败'\)\)[\s\S]*?showApiError\(error,\s*'加载任务列表失败'\)[\s\S]*?title="自动修复任务加载失败"[\s\S]*?onClick=\{\(\)\s*=>\s*fetchItems\(\)\}[\s\S]*?label="重试加载"/,
  'AutoRepairs list loading failure must render a retryable in-page error state.'
)
requirePattern(
  autoRepairs,
  /const \[reposError,\s*setReposError\] = useState<string \| null>\(null\)[\s\S]*?setReposError\(formatApiError\(error,\s*'加载仓库列表失败'\)\)[\s\S]*?showApiError\(error,\s*'加载仓库列表失败'\)[\s\S]*?title="仓库列表加载失败"[\s\S]*?onClick=\{fetchRepos\}[\s\S]*?label="重试加载"/,
  'AutoRepairs repository loading failure must render a retryable in-page error state in the create flow.'
)
requirePattern(
  autoRepairs,
  /const \[executionDetailError,\s*setExecutionDetailError\] = useState<string \| null>\(null\)[\s\S]*?setExecutionDetailError\(formatApiError\(error,\s*'加载执行证据失败'\)\)[\s\S]*?title="执行证据加载失败"[\s\S]*?onClick=\{\(\)\s*=>\s*fetchExecutionDetail\(selected\.id\)\}[\s\S]*?label="重试加载"/,
  'AutoRepairs execution evidence loading failure must render a retryable detail error without bypassing PATCH_READY gates.'
)
requirePattern(
  autoRepairs,
  /const \[patchReadyAuditError,\s*setPatchReadyAuditError\] = useState<string \| null>\(null\)[\s\S]*?setPatchReadyAuditError\(formatApiError\(error,\s*'加载 PATCH_READY 审计证据失败'\)\)[\s\S]*?title="PATCH_READY 审计证据加载失败"[\s\S]*?onClick=\{\(\)\s*=>\s*fetchPatchReadyAuditEvidence\(selected\)\}[\s\S]*?label="重试加载"/,
  'AutoRepairs PATCH_READY audit evidence loading failure must render a retryable error and keep the PR gate fail-closed.'
)
requirePattern(
  autoRepairs,
  /import \{ redactSensitiveText \} from '\.\.\/utils\/displayRedaction'[\s\S]*?function redactAutoRepairText\(value\?: string \| null\): string[\s\S]*?return redactSensitiveText\(value \|\| ''\)[\s\S]*?function redactedAutoRepairProvenanceForOutput\(provenance: AutoRepairProvenance\): AutoRepairProvenance[\s\S]*?sourceEvidenceTitle:[\s\S]*?redactAutoRepairText\(provenance\.sourceEvidenceTitle\)[\s\S]*?repairEvidenceGateReason:[\s\S]*?redactAutoRepairText\(provenance\.repairEvidenceGateReason\)[\s\S]*?riskKey:[\s\S]*?redactAutoRepairText\(provenance\.riskKey\)/,
  'AutoRepairs must use shared displayRedaction for provenance, report evidence, risk key and gate reason display fields.'
)
requirePattern(
  autoRepairs,
  /render: \(targetDesc: string\) => redactAutoRepairText\(targetDesc\)[\s\S]*?<pre>\{redactAutoRepairText\(selected\.filePath\)\}<\/pre>[\s\S]*?<div className="sl-autorepair-target">\{redactAutoRepairText\(selected\.targetDesc\)\}<\/div>[\s\S]*?description=\{redactAutoRepairText\(selected\.errorMessage\)\}/,
  'AutoRepairs list/detail target text, file path and runtime error display must pass through display redaction.'
)
requirePattern(
  autoRepairs,
  /function AutoRepairDraftReceipt\(\{ provenance \}: \{ provenance: AutoRepairProvenance \}\)[\s\S]*?const displayProvenance = redactedAutoRepairProvenanceForOutput\(provenance\)[\s\S]*?displayProvenance\.sourceEvidenceTitle[\s\S]*?displayProvenance\.riskKey/,
  'AutoRepairs draft provenance receipt must render display-redacted provenance fields.'
)
requirePattern(
  autoRepairs,
  /function CandidateProvenanceReceipt\([\s\S]*?const displayProvenance = redactedAutoRepairProvenanceForOutput\(provenance\)(?=[\s\S]*?displayProvenance\.sourceEvidenceTitle)(?=[\s\S]*?displayProvenance\.riskKey)(?=[\s\S]*?const displayCandidateGate = redactedRepairReadinessSignalForOutput\(candidateGate\))(?=[\s\S]*?displayCandidateGate\.summary)(?=[\s\S]*?displayCandidateGate\.label)(?=[\s\S]*?displayCandidateGate\.checks\.map)/,
  'AutoRepairs candidate provenance receipt must render display-redacted provenance fields and gate summaries.'
)
requirePattern(
  autoRepairs,
  /function redactedRepairReadinessSignalForOutput\(signal: RepairReadinessSignal\): RepairReadinessSignal[\s\S]*?summary: redactAutoRepairText\(signal\.summary\)[\s\S]*?value: redactAutoRepairText\(check\.value\)[\s\S]*?function buildSourceBridgeQaQuestion\(repair: AutoRepair\)[\s\S]*?redactAutoRepairText\(repair\.targetDesc\)[\s\S]*?function buildCandidateReceiptQaQuestion\([\s\S]*?redactedAutoRepairProvenanceForOutput\(provenance\)[\s\S]*?redactedRepairReadinessSignalForOutput\(candidateGate\)[\s\S]*?function sourceBridgeQaUrl\(projectId: number, scanTaskId: number, question: string\)[\s\S]*?redactAutoRepairText\(question\)\.slice\(0, 1400\)/,
  'AutoRepairs QA handoff URLs must be built from display-redacted target, provenance and candidate gate text.'
)
requirePattern(
  autoRepairs,
  /const executionDetailRequestSeqRef = useRef\(0\)[\s\S]*?const fetchExecutionDetail = useCallback\(\(repairId: number\) => \{[\s\S]*?executionDetailRequestSeqRef\.current = requestSeq[\s\S]*?setExecutionDetail\(null\)[\s\S]*?if \(executionDetailRequestSeqRef\.current !== requestSeq\) return[\s\S]*?if \(res\.data\.data\.task\.sourceId !== repairId\) return[\s\S]*?const selectedExecutionDetail = selected && executionDetail\?\.task\.sourceId === selected\.id \? executionDetail : null[\s\S]*?AutoRepairAttemptTimeline repair=\{selected\} detail=\{selectedExecutionDetail\}/,
  'AutoRepairs execution detail must clear stale evidence and only render execution timeline when the execution source matches the selected repair.'
)
requirePattern(
  issueDecomposition,
  /<StateBlock\s+tone="error"\s+title="拆解失败"[\s\S]*?\/>/,
  'IssueDecomposition failed detail state must use StateBlock error tone.'
)
requirePattern(
  autoRepairs,
  /<StateBlock\s+tone="loading"[\s\S]*?title=\{selected\.status === 'PR_RUNNING' \? '正在创建 Pull Request' : '正在生成补丁'\}[\s\S]*?\/>/,
  'AutoRepairs running detail state must use StateBlock loading tone.'
)
requirePattern(
  dashboard,
  /function DashboardNextActionPanel[\s\S]*?<ActionButton type="primary"[\s\S]*?label=\{action\.primaryLabel\}[\s\S]*?function DashboardCommandPanel[\s\S]*?<ActionButton[\s\S]*?label=\{item\.actionLabel\}/,
  'Dashboard must reserve primary semantics for the state-driven next action and keep secondary command actions default.'
)
requirePattern(
  dashboard,
  /function DashboardCommandPanel[\s\S]*?aria-label="继承产品操作面板（非项目任务）"[\s\S]*?继承产品操作（P0冻结）[\s\S]*?不生成 AIOS 开发任务，不进入项目排期，也不改变 P0-05 的唯一优先级/,
  'Dashboard command panel must classify all inherited product operations as non-project work during P0.'
)

requirePattern(
  projectDetail,
  /function buildChunkDeepLink\(projectId:\s*number,\s*chunk:\s*CodeChunkSearchItem/,
  'Project QA must keep stable evidence deep-link generation for code chunk references.'
)
requirePattern(
  projectDetail,
  /async function copyTextToClipboard\(text:\s*string\):\s*Promise<void>/,
  'Project QA copy actions must keep a Clipboard API fallback helper.'
)
requirePattern(
  projectDetail,
  /document\.execCommand\('copy'\)/,
  'Project QA copy actions must keep a fallback for browser contexts where Clipboard API is blocked.'
)
requirePattern(
  projectDetail,
  /const setQaEvidenceUrlState\s*=\s*useCallback/,
  'Project QA evidence actions must keep URL state synchronized with question and scanTaskId.'
)
requirePattern(
  projectDetail,
  /const REPORT_EVIDENCE_QUERY_PARAMS = \[[\s\S]*?'evidenceCategory'[\s\S]*?'evidenceSource'[\s\S]*?'evidenceTitle'[\s\S]*?'evidenceSummary'[\s\S]*?'evidenceFile'[\s\S]*?'evidenceLine'[\s\S]*?\][\s\S]*?if \(key !== 'qa'\) \{[\s\S]*?REPORT_EVIDENCE_QUERY_PARAMS\.forEach\(param => nextParams\.delete\(param\)\)/,
  'Project workspace tab changes must clear stale report evidence URL params when leaving QA.'
)
rejectPattern(
  projectDetail,
  /const handleWorkspaceTabChange\s*=\s*\(key:\s*string\)\s*=>\s*\{[\s\S]*?nextParams\.delete\('scanTaskId'\)[\s\S]*?setSearchParams\(nextParams,\s*\{\s*replace:\s*true\s*\}\)/,
  'Project workspace tab changes must preserve scanTaskId so report-origin QA, graph and audit context cannot drift.'
)
requirePattern(
  projectDetail,
  /function buildEvidenceBridgeSearchQuery\(evidenceRef: CodeQaEvidenceRef \| null, fallbackQuery: string\)[\s\S]*?const safeEvidence = evidenceRef \? redactedEvidenceRefForOutput\(evidenceRef\) : null[\s\S]*?const lineLabel = evidenceLineLabel\(safeEvidence\)[\s\S]*?safeEvidence\?\.filePath[\s\S]*?`\$\{safeEvidence\.filePath\}:\$\{lineLabel\}`[\s\S]*?safeEvidence\?\.title[\s\S]*?safeEvidence\?\.source[\s\S]*?safeEvidence\?\.category[\s\S]*?safeEvidence\?\.summary[\s\S]*?redactSensitiveText\(fallbackQuery\)[\s\S]*?slice\(0, 900\)/,
  'Project QA report evidence source bridge must build a bounded display-redacted file-line/title/source/category/summary search query without adding an API.'
)
requirePattern(
  projectDetail,
  /function buildEvidenceBridgeCopyText\(scanTaskId: number \| null \| undefined, evidenceRef: CodeQaEvidenceRef\)[\s\S]*?const safeEvidence = redactedEvidenceRefForOutput\(evidenceRef\)[\s\S]*?const lineLabel = evidenceLineLabel\(safeEvidence\)[\s\S]*?scanTaskId:[\s\S]*?category: \$\{safeEvidence\.category \|\| '-'\}[\s\S]*?source: \$\{safeEvidence\.source \|\| '-'\}[\s\S]*?title: \$\{safeEvidence\.title \|\| '-'\}[\s\S]*?filePath: \$\{safeEvidence\.filePath \|\| '-'\}[\s\S]*?lineNumber: \$\{lineLabel \|\| '-'\}[\s\S]*?startLine: \$\{safeEvidence\.startLine \?\? '-'\}[\s\S]*?endLine: \$\{safeEvidence\.endLine \?\? '-'\}[\s\S]*?summary: \$\{safeEvidence\.summary \|\| '-'\}/,
  'Project QA report evidence source bridge copy text must include only display-redacted evidence metadata fields.'
)
requirePattern(
  projectDetail,
  /function redactedEvidenceRefForOutput\(evidenceRef: CodeQaEvidenceRef\): CodeQaEvidenceRef[\s\S]*?category:[\s\S]*?redactSensitiveText\(evidenceRef\.category\)[\s\S]*?source:[\s\S]*?redactSensitiveText\(evidenceRef\.source\)[\s\S]*?title:[\s\S]*?redactSensitiveText\(evidenceRef\.title\)[\s\S]*?summary:[\s\S]*?redactSensitiveText\(evidenceRef\.summary\)[\s\S]*?filePath:[\s\S]*?redactSensitiveText\(evidenceRef\.filePath\)[\s\S]*?lineNumber:[\s\S]*?redactSensitiveText\(evidenceRef\.lineNumber\)/,
  'Project QA report evidence source bridge must have a shared display-redaction helper for URL-derived evidence metadata.'
)
requirePattern(
  projectDetail,
  /function qaAnswerSourceEvidenceReceipt\(msg: QaMessage\): QaAnswerSourceEvidenceReceipt \| null[\s\S]*?const safeRef = redactedEvidenceRefForOutput\(ref\)[\s\S]*?title: safeRef\.title \|\| fallbackFile[\s\S]*?source: safeRef\.source \|\| 'Unknown Source'[\s\S]*?category: safeRef\.category \|\| '未分类'[\s\S]*?fileReference: `\$\{fallbackFile\}\$\{lineSuffix\}`/,
  'Project QA answer source receipt must display redacted source evidence title/source/category/file reference.'
)
requirePattern(
  projectDetail,
  /function qaSourceFileMatchRelease\(msg: QaMessage, repairGate: RepairEvidenceGate\): QaSourceFileMatchRelease \| null[\s\S]*?const safeRef = redactedEvidenceRefForOutput\(ref\)[\s\S]*?const targetReference = `\$\{safeRef\.filePath \|\| redactSensitiveText\(ref\.filePath\)\}\$\{targetLine\}`[\s\S]*?redactSensitiveText\(citationLineReference\(citation\)\)/,
  'Project QA source file release panel must display redacted source/citation file references.'
)
requirePattern(
  projectDetail,
  /function qaCitationRepairTargetDesc\(citation: CodeQaCitation, question: string\): string[\s\S]*?redactSensitiveText\(citation\.sourceLabel \|\| 'C\?'\)[\s\S]*?redactSensitiveText\(citationLineReference\(citation\)\)[\s\S]*?redactSensitiveText\(question\)[\s\S]*?redactSensitiveText\(citationEvidenceReason\(citation\)\)/,
  'Project QA AutoRepair targetDesc must redact question, citation location and evidence reason before URL handoff.'
)
requirePattern(
  projectDetail,
  /function appendSourceEvidenceParams\([\s\S]*?const safeEvidenceRef = redactedEvidenceRefForOutput\(sourceEvidenceRef\)[\s\S]*?safeEvidenceRef\.category[\s\S]*?sourceEvidenceCategory[\s\S]*?safeEvidenceRef\.source[\s\S]*?sourceEvidenceSource[\s\S]*?safeEvidenceRef\.title[\s\S]*?sourceEvidenceTitle[\s\S]*?safeEvidenceRef\.filePath[\s\S]*?sourceEvidenceFilePath[\s\S]*?const sourceLineLabel = evidenceLineLabel\(safeEvidenceRef\)[\s\S]*?sourceLineLabel[\s\S]*?sourceEvidenceLineNumber/,
  'Project QA AutoRepair source evidence URL params must use redacted source evidence fields.'
)
requirePattern(
  projectDetail,
  /params\.set\('evidenceReason', redactSensitiveText\(citation\.evidenceReason\)\)[\s\S]*?appendSourceEvidenceParams\(params, sourceEvidenceRef, sourceEvidenceMatched, sourceEvidenceMatchType\)/,
  'Project QA AutoRepair URL must redact citation evidenceReason before setting query params.'
)
requirePattern(
  projectDetail,
  /<div className="sl-chat-content">\{redactSensitiveText\(msg\.content\)\}<\/div>/,
  'Project QA chat content must use display redaction before rendering user or assistant text.'
)
requirePattern(
  projectDetail,
  /const evidenceBridgeScanTaskId = activeSourceScanTaskId \|\| scanTaskId \|\| null[\s\S]*?const evidenceBridgeQuery = useMemo[\s\S]*?const openEvidenceBridgeScanReport = \(\) => \{[\s\S]*?navigate\(`\/scan-tasks\/\$\{evidenceBridgeScanTaskId\}`\)[\s\S]*?const refreshEvidenceBridgeSearch = \(\) => \{[\s\S]*?runChunkSearch\(nextQuery, true\)[\s\S]*?const copyEvidenceBridgeReference = async \(\) => \{[\s\S]*?copyTextToClipboard\(copyText\)[\s\S]*?setManualCopyText\(\{ title: '手动复制证据引用', text: copyText \}\)/,
  'Project QA report evidence source bridge must wire report navigation, silent evidence refresh and clipboard/manual copy actions.'
)
requirePattern(
  projectDetail,
  /const displayEvidenceRef = useMemo\([\s\S]*?redactedEvidenceRefForOutput\(evidenceRef\)[\s\S]*?aria-label="报告证据上下文"[\s\S]*?报告证据来源桥[\s\S]*?Scan #\{evidenceBridgeScanTaskId\}[\s\S]*?displayEvidenceRef\.summary[\s\S]*?sl-qa-evidence-ref-long-tag[\s\S]*?label="回到扫描报告"[\s\S]*?label="重新检索证据"[\s\S]*?label="复制证据引用"/,
  'Project QA must render the report evidence source bridge with display-redacted metadata, compatible aria label, scan, summary, long file tag and three actions.'
)
requirePattern(
  css,
  /\.sl-qa-evidence-ref[\s\S]*?\.sl-qa-evidence-ref-head[\s\S]*?\.sl-qa-evidence-ref-summary[\s\S]*?\.sl-qa-evidence-ref-tags \.ant-tag[\s\S]*?max-width:\s*320px[\s\S]*?white-space:\s*normal[\s\S]*?overflow-wrap:\s*anywhere/,
  'Project QA report evidence source bridge must keep long paths and tag text wrapped within a 320px safety width.'
)
requirePattern(
  projectDetail,
  /<CodeQaTab[\s\S]*?scanTaskId=\{knowledgeScanTaskId\}[\s\S]*?\/>/,
  'Project QA tab must use the requested evidence scanTaskId when present.'
)
requirePattern(
  projectDetail,
  /<DependencyGraphView\s+scanTaskId=\{knowledgeScanTaskId\}\s*\/>/,
  'Project dependency graph tab must use the requested evidence scanTaskId when present.'
)
requirePattern(
  projectDetail,
  /<Typography\.Text\s+type="secondary">证据扫描<\/Typography\.Text>/,
  'Project QA subhead must describe the active scan as evidence-bound, not implicitly latest-only.'
)
rejectPattern(
  projectDetail,
  /最新成功扫描<\/Typography\.Text>/,
  'Project QA subhead must not claim latest-success context when a report-origin scanTaskId may be active.'
)
requirePattern(
  projectDetail,
  /const copyChunkDeepLink\s*=\s*async\s*\(chunk:\s*CodeChunkSearchItem\)/,
  'Project QA must keep copyable evidence deep links.'
)
requirePattern(
  projectApi,
  /export interface CodeQaResponse[\s\S]*?citationCoverage\?: CodeQaCitationCoverage[\s\S]*?claimCitationCoverage\?: CodeQaClaimCitationCoverage[\s\S]*?export interface CodeQaCitationCoverage[\s\S]*?uniqueEvidenceFileCount\?: number[\s\S]*?citedEvidenceFileCount\?: number[\s\S]*?primaryEvidenceFileCount\?: number[\s\S]*?citedPrimaryEvidenceFileCount\?: number[\s\S]*?requiredEvidenceFileCount\?: number[\s\S]*?citedRequiredEvidenceFileCount\?: number[\s\S]*?evidenceRoleDistribution\?: CodeQaEvidenceRoleDistribution[\s\S]*?export interface CodeQaEvidenceRoleDistribution[\s\S]*?roles\?: CodeQaEvidenceRoleStat\[\][\s\S]*?files\?: CodeQaEvidenceFileStat\[\][\s\S]*?export interface CodeQaClaimCitationCoverage[\s\S]*?requiredClaimCount\?: number[\s\S]*?citedRequiredClaimCount\?: number[\s\S]*?validCitationFileCount\?: number[\s\S]*?requiredClaimCitationFileCount\?: number[\s\S]*?readyForRepair\?: boolean[\s\S]*?readinessReason\?: string[\s\S]*?readinessNote\?: string[\s\S]*?validCitationFiles\?: string\[\][\s\S]*?requiredClaimCitationFiles\?: string\[\][\s\S]*?claims\?: CodeQaClaimCitation\[\][\s\S]*?export interface CodeQaClaimCitation[\s\S]*?invalidSourceLabels\?: string\[\][\s\S]*?validSourceFiles\?: string\[\]/,
  'Project QA API types must expose deterministic citation file distribution, role distribution, claim citation coverage, backend repair readiness reason and per-claim invalid labels.'
)
requirePattern(
  projectDetail,
  /groundingStatusLabel\(status\?:\s*string\s*\|\s*null\)[\s\S]*?引用已验证[\s\S]*?引用需复核[\s\S]*?回答未引用证据/,
  'Project QA must surface answer grounding status instead of relying on natural-language answers alone.'
)
requirePattern(
  projectDetail,
  /citationEnforcementLabel\(status\?:\s*string\s*\|\s*null\)[\s\S]*?首次引用已验证[\s\S]*?引用已修正[\s\S]*?检索证据引用[\s\S]*?引用需人工复核/,
  'Project QA must surface citation enforcement status.'
)
requirePattern(
  projectDetail,
  /citationCoverageLabel\(coverage\?: CodeQaCitationCoverage\)[\s\S]*?requiredEvidenceCoveragePercent[\s\S]*?必需证据覆盖 \$\{citedRequired\}\/\$\{required\} \(\$\{requiredPercent\}%\)[\s\S]*?引用覆盖 \$\{cited\}\/\$\{total\} \(\$\{percent\}%\)[\s\S]*?citationRepairCandidateLabel\(coverage\?: CodeQaCitationCoverage\)[\s\S]*?可修复证据/,
  'Project QA must surface required evidence coverage, total citation coverage and repair candidate counts.'
)
requirePattern(
  projectDetail,
  /function citationCoverageAudit[\s\S]*?requiredEvidenceFileCount[\s\S]*?citedRequiredEvidenceFileCount[\s\S]*?requiredCoveragePercent[\s\S]*?coverageScope[\s\S]*?主证据文件[\s\S]*?primaryEvidenceFileCount/,
  'Project QA must derive citation coverage audit from required evidence and evidence file distribution fields.'
)
requirePattern(
  projectDetail,
  /function citationCoverageAudit[\s\S]*?sourceEvidenceMatchLabel\(msg\.sourceEvidenceMatchType\)[\s\S]*?引用覆盖可进入修复[\s\S]*?引用覆盖不足/,
  'Project QA must keep citation coverage audit repair/source states visible.'
)
requirePattern(
  projectDetail,
  /function citationCoverageAudit\(msg: QaMessage\): CitationCoverageAudit \| null[\s\S]*?必需文件[\s\S]*?主证据文件[\s\S]*?必需覆盖[\s\S]*?必需文件[\s\S]*?范围[\s\S]*?可修复/,
  'Project QA citation coverage audit must expose user-readable required coverage, required files, primary file, scope and repairable metrics.'
)
requirePattern(
  projectDetail,
  /function CitationCoverageAuditPanel\(\{ audit \}: \{ audit: CitationCoverageAudit \}\)[\s\S]*?aria-label="引用覆盖审计"[\s\S]*?qaAuditTagText\(audit\.tone\)[\s\S]*?aria-label="证据角色分布"[\s\S]*?证据角色分布[\s\S]*?function QaDetailedEvidenceAuditSection\([\s\S]*?<CitationCoverageAuditPanel audit=\{citationAudit\} \/>/,
  'Project QA must render a visible citation coverage audit panel with Chinese summary states, metrics and evidence role distribution.'
)
requirePattern(
  projectDetail,
  /interface ClaimCitationAudit[\s\S]*?function claimCitationAudit\(msg: QaMessage\): ClaimCitationAudit \| null[\s\S]*?claimCitationCoverage[\s\S]*?主张已绑定引用[\s\S]*?存在无效引用标签[\s\S]*?主张引用需要复核[\s\S]*?必需文件[\s\S]*?function ClaimCitationAuditPanel\(\{ audit \}: \{ audit: ClaimCitationAudit \}\)[\s\S]*?aria-label="主张引用质量"[\s\S]*?qaAuditTagText\(audit\.tone\)/,
  'Project QA must render deterministic claim citation quality with READY, REVIEW, BLOCKED and file distribution signals.'
)
requirePattern(
  projectDetail,
  /interface QaTrustSummary[\s\S]*?function qaTrustSummary\([\s\S]*?RepairEvidenceGate \| null[\s\S]*?CitationCoverageAudit \| null[\s\S]*?ClaimCitationAudit \| null[\s\S]*?可采信并进入修复复核[\s\S]*?不可直接采信[\s\S]*?需要人工复核[\s\S]*?function QaTrustSummaryPanel\(\{ summary \}: \{ summary: QaTrustSummary \}\)[\s\S]*?aria-label="QA 可信度摘要"[\s\S]*?可信度结论[\s\S]*?qaSummaryTagText\(summary\.tone\)/,
  'Project QA must render a user-readable trust summary above raw citation and claim audit details.'
)
requirePattern(
  projectDetail,
  /interface QaCrossFileCitationSummary[\s\S]*?function qaCrossFileCitationSummary\(msg: QaMessage\): QaCrossFileCitationSummary \| null[\s\S]*?crossFileContext[\s\S]*?requiredFilesCovered[\s\S]*?claimPrimaryBound[\s\S]*?sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR'[\s\S]*?function QaCrossFileCitationSummaryPanel\(\{ summary \}: \{ summary: QaCrossFileCitationSummary \}\)[\s\S]*?qaBindingTagText\(summary\.tone\)[\s\S]*?aria-label="跨文件引用摘要"[\s\S]*?跨文件引用结论/,
  'Project QA must render a user-readable cross-file citation summary derived from citation coverage and claim citation coverage.'
)
requirePattern(
  projectDetail,
  /interface QaReadableEvidenceViewModel[\s\S]*?repairEvidenceGate: RepairEvidenceGate \| null[\s\S]*?citationAudit: CitationCoverageAudit \| null[\s\S]*?claimAudit: ClaimCitationAudit \| null[\s\S]*?trustSummary: QaTrustSummary \| null[\s\S]*?crossFileSummary: QaCrossFileCitationSummary \| null[\s\S]*?sourceEvidenceReceipt: QaAnswerSourceEvidenceReceipt \| null[\s\S]*?sourceFileRelease: QaSourceFileMatchRelease \| null[\s\S]*?function buildQaReadableEvidenceViewModel\(msg: QaMessage\): QaReadableEvidenceViewModel[\s\S]*?qaRepairEvidenceGate\(msg\)[\s\S]*?citationCoverageAudit\(msg\)[\s\S]*?claimCitationAudit\(msg\)[\s\S]*?qaTrustSummary\(msg, repairEvidenceGate, citationAudit, claimAudit\)[\s\S]*?qaCrossFileCitationSummary\(msg\)[\s\S]*?qaAnswerSourceEvidenceReceipt\(msg\)[\s\S]*?qaSourceFileMatchRelease\(msg, repairEvidenceGate\)[\s\S]*?const readableEvidence = !isUser \? buildQaReadableEvidenceViewModel\(msg\) : null/,
  'Project QA must centralize user-readable trust, cross-file citation, source receipt and repair release semantics in QaReadableEvidenceViewModel before rendering.'
)
requirePattern(
  projectDetail,
  /interface QaReadableEvidenceSectionProps[\s\S]*?evidence: QaReadableEvidenceViewModel[\s\S]*?primaryRepairUrl: string[\s\S]*?onRefreshEvidence: \(question: string\) => void[\s\S]*?<QaReadableEvidenceSection[\s\S]*?evidence=\{readableEvidence\}[\s\S]*?function QaReadableEvidenceSection\([\s\S]*?aria-label="QA 可信证据"[\s\S]*?QA 可信证据[\s\S]*?<QaTrustSummaryPanel summary=\{trustSummary\} \/>[\s\S]*?<QaCrossFileCitationSummaryPanel summary=\{crossFileSummary\} \/>[\s\S]*?<QaAnswerSourceEvidenceReceiptPanel receipt=\{sourceEvidenceReceipt\} \/>[\s\S]*?<QaSourceFileMatchReleasePanel release=\{sourceFileRelease\} \/>[\s\S]*?<QaNextActionRail[\s\S]*?summary=\{trustSummary\}/,
  'Project QA must group trust summary, cross-file summary, source receipt, source-file release and next action into one QA readable evidence section in that order.'
)
requirePattern(
  projectDetail,
  /<QaDetailedEvidenceAuditSection[\s\S]*?citationAudit=\{citationAudit\}[\s\S]*?claimAudit=\{claimAudit\}[\s\S]*?repairEvidenceGate=\{repairEvidenceGate\}[\s\S]*?function QaDetailedEvidenceAuditSection\([\s\S]*?summaryItems = \[[\s\S]*?label: '引用覆盖'[\s\S]*?qaAuditTagText\(citationAudit\.tone\)[\s\S]*?label: '主张质量'[\s\S]*?qaAuditTagText\(claimAudit\.tone\)[\s\S]*?label: '修复门禁'[\s\S]*?repairEvidenceGate\?\.status \|\| '-'[\s\S]*?aria-label="QA 底层审计证据"[\s\S]*?aria-label="QA 底层审计摘要"[\s\S]*?<CitationCoverageAuditPanel audit=\{citationAudit\} \/>[\s\S]*?<ClaimCitationAuditPanel audit=\{claimAudit\} \/>[\s\S]*?<QaRepairEvidenceGatePanel gate=\{repairEvidenceGate\} \/>/,
  'Project QA detailed citation audit, claim audit and repair evidence gate must remain outside the QA readable evidence summary section and grouped in a visible detailed audit section.'
)
requirePattern(
  projectDetail,
  /interface QaNextActionRailProps[\s\S]*?function QaNextActionRail\([\s\S]*?sl-qa-next-action-rail[\s\S]*?aria-label="QA 下一步动作"[\s\S]*?summary\.tone === 'ready'[\s\S]*?label="生成修复候选"[\s\S]*?label="复制首条引用"[\s\S]*?summary\.tone === 'warning'[\s\S]*?label="重新检索证据"[\s\S]*?label="重试此问题"[\s\S]*?label="恢复到输入框"/,
  'Project QA must translate trust summary states into a visible next-action rail with repair, citation copy, retry, restore and evidence refresh actions.'
)
requirePattern(
  projectDetail,
  /function claimCitationCoverageReadyForRepair\(coverage\?: CodeQaClaimCitationCoverage\): boolean[\s\S]*?coverage\.status !== 'READY'[\s\S]*?typeof coverage\.readyForRepair === 'boolean'[\s\S]*?coverage\.readyForRepair !== true \|\| coverage\.readinessReason !== 'PRIMARY_BOUND_READY'[\s\S]*?!roleDistribution \|\| roleDistribution\.status !== 'PRIMARY_BOUND'[\s\S]*?requiredClaimCount > 0[\s\S]*?Number\(roleDistribution\.requiredClaimCount \|\| 0\) === requiredClaimCount[\s\S]*?citedRequiredClaimCount === requiredClaimCount[\s\S]*?uncitedRequiredClaimCount === 0[\s\S]*?invalidCitationClaimCount === 0[\s\S]*?requiredPrimaryBoundClaimCount === requiredClaimCount[\s\S]*?requiredContextOnlyClaimCount \|\| 0\) === 0[\s\S]*?requiredUnknownOnlyClaimCount \|\| 0\) === 0[\s\S]*?unbackedRequiredClaimCount \|\| 0\) === 0[\s\S]*?invalidRequiredClaimCount \|\| 0\) === 0[\s\S]*?validCitationFileCount > 0[\s\S]*?requiredClaimCitationFileCount > 0[\s\S]*?Number\(roleDistribution\.validCitationFileCount \|\| 0\) === validCitationFileCount[\s\S]*?Number\(roleDistribution\.requiredClaimCitationFileCount \|\| 0\) === requiredClaimCitationFileCount[\s\S]*?requiredPrimaryFileCount > 0[\s\S]*?qaRepairEvidenceGate\(msg: QaMessage\)[\s\S]*?const claimCoverageReady = claimCitationCoverageReadyForRepair\(claimCoverage\)[\s\S]*?`主张引用 \$\{claimCoverage\?\.status \|\| 'MISSING'\} \$\{citedRequiredClaimCount\}\/\$\{requiredClaimCount \|\| '-'\}`[\s\S]*?msg\.claimCitationCoverage\?\.status === 'BLOCKED'/,
  'Project QA repair evidence gate must prefer backend claim readiness reason and fall back to strict role distribution before READY.'
)
requirePattern(
  projectDetail,
  /function claimCitationAudit\(msg: QaMessage\): ClaimCitationAudit \| null[\s\S]*?readyForRepair = claimCitationCoverageReadyForRepair\(coverage\)[\s\S]*?effectiveStatus = status === 'READY' && readyForRepair \? 'READY'[\s\S]*?tone: ClaimCitationAudit\['tone'\] = effectiveStatus === 'READY'[\s\S]*?title: effectiveStatus === 'READY' \? '主张已绑定引用'[\s\S]*?coverage\.readinessNote[\s\S]*?修复门禁[\s\S]*?coverage\.readyForRepair \? 'READY' : 'REVIEW'[\s\S]*?原因码[\s\S]*?coverage\.readinessReason/,
  'Project QA claim citation audit must reuse strict ready-for-repair logic and surface backend readiness note/reason before showing READY wording.'
)
requirePattern(
  projectDetail,
  /function qaTrustSummary\([\s\S]*?const primaryBound = claimCitationCoverageReadyForRepair\(claimCoverage\)[\s\S]*?const claimReady = claimCitationCoverageReadyForRepair\(claimCoverage\)[\s\S]*?&& claimReady[\s\S]*?&& primaryBound/,
  'Project QA trust summary must reuse strict claim citation helper for PRIMARY-bound readiness.'
)
rejectPattern(
  projectDetail,
  /!msg\.claimCitationCoverage\s*\|\|[\s\S]{0,120}?claimCitationCoverage\.status === 'READY'/,
  'Project QA repair evidence gate must not treat missing claimCitationCoverage as READY-compatible for report evidence context.'
)
requirePattern(
  css,
  /\.sl-citation-coverage-audit[\s\S]*?\.sl-citation-coverage-audit-ready[\s\S]*?\.sl-citation-coverage-audit-warning[\s\S]*?\.sl-citation-coverage-audit-blocked[\s\S]*?\.sl-citation-coverage-audit-metrics/,
  'Project QA citation coverage audit panel must have dedicated readable styles.'
)
requirePattern(
  css,
  /\.sl-claim-citation-audit[\s\S]*?\.sl-claim-citation-audit-ready[\s\S]*?\.sl-claim-citation-audit-warning[\s\S]*?\.sl-claim-citation-audit-blocked[\s\S]*?\.sl-claim-citation-audit-metrics/,
  'Project QA claim citation audit panel must have dedicated readable styles.'
)
requirePattern(
  css,
  /\.sl-qa-trust-summary[\s\S]*?\.sl-qa-trust-summary-ready[\s\S]*?\.sl-qa-trust-summary-warning[\s\S]*?\.sl-qa-trust-summary-blocked[\s\S]*?\.sl-qa-trust-summary-metrics[\s\S]*?\.sl-qa-trust-summary-next/,
  'Project QA trust summary must have dedicated readable responsive styles.'
)
requirePattern(
  css,
  /\.sl-qa-cross-file-summary[\s\S]*?\.sl-qa-cross-file-summary-ready[\s\S]*?\.sl-qa-cross-file-summary-warning[\s\S]*?\.sl-qa-cross-file-summary-blocked[\s\S]*?\.sl-qa-cross-file-summary-metrics[\s\S]*?\.sl-qa-cross-file-summary-status/,
  'Project QA cross-file citation summary must have dedicated readable responsive styles.'
)
requirePattern(
  css,
  /\.sl-qa-next-action-rail[\s\S]*?\.sl-qa-next-action-rail-ready[\s\S]*?\.sl-qa-next-action-rail-warning[\s\S]*?\.sl-qa-next-action-rail-blocked[\s\S]*?\.sl-qa-next-action-rail-actions[\s\S]*?\.sl-qa-next-action-rail-actions \.ant-btn/,
  'Project QA next action rail must have dedicated readable responsive styles with wrapped action buttons.'
)
requirePattern(
  projectDetail,
  /qaRepairEvidenceGate\(msg: QaMessage\)[\s\S]*?requiredEvidenceCoveragePercent[\s\S]*?requiredCoveragePercent >= 100[\s\S]*?msg\.citationCoverage[\s\S]*?citationCoverageLabel\(msg\.citationCoverage\)[\s\S]*?citationRepairCandidateLabel\(msg\.citationCoverage\)[\s\S]*?msg\.answerCitations[\s\S]*?aria-label="回答引用证据"[\s\S]*?citationLineReference\(citation\)[\s\S]*?redactSensitiveText\(citationEvidenceReason\(citation\)\)[\s\S]*?label="复制引用"/,
  'Project QA assistant messages must render answer-level citations with line references, redacted evidence reason and copy action.'
)
requirePattern(
  projectDetail,
  /Tag color=\{groundingStatusColor\(msg\.groundingStatus\)\}\>\{groundingStatusLabel\(msg\.groundingStatus\)\}<\/Tag>[\s\S]*?Scan #\{msg\.scanTaskId\}/,
  'Project QA assistant messages must show grounding status and scanTaskId together.'
)
requirePattern(
  projectDetail,
  /const \[manualCopyText,\s*setManualCopyText\]\s*=\s*useState/,
  'Project QA copy actions must keep a manual-copy fallback state.'
)
requirePattern(
  projectDetail,
  /const \[searchFailedQuery,\s*setSearchFailedQuery\]\s*=\s*useState<string \| null>\(null\)[\s\S]*?setSearchFailedQuery\(queryText\)/,
  'Project QA code_chunks search failures must remember the failed query for retry.'
)
requirePattern(
  projectDetail,
  /const \[qaRequestError,\s*setQaRequestError\]\s*=\s*useState<\{ question: string; message: string \} \| null>\(null\)[\s\S]*?setQaRequestError\(\{ question: curQuestion, message: errMsg \}\)/,
  'Project QA request failures must keep the failed question and formatted error for retry.'
)
requirePattern(
  projectDetail,
  /title="代码问答请求失败"[\s\S]*?description=\{qaRequestError\.message\}[\s\S]*?label="重试此问题"[\s\S]*?label="恢复到输入框"/,
  'Project QA request failures must render a recoverable StateBlock with retry and restore actions.'
)
requirePattern(
  projectDetail,
  /title="证据检索刷新失败，已保留上次成功结果"[\s\S]*?label="重新检索证据"[\s\S]*?title="证据检索失败"[\s\S]*?label="重新检索证据"/,
  'Project QA code_chunks search failures must show initial and cached-refresh recoverable StateBlocks.'
)
requirePattern(
  projectDetail,
  /disabled=\{!question\.trim\(\) \|\| loading\}[\s\S]*?label="发送"/,
  'Project QA send action must be disabled for empty questions and during loading.'
)
requirePattern(
  projectDetail,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'Project detail visible actions must use the shared ActionButton primitive.'
)
requirePattern(
  projectDetail,
  /import IconActionButton from '\.\.\/components\/ui\/IconActionButton'/,
  'Project detail dense table actions must use the shared IconActionButton primitive.'
)
requirePattern(
  projectDetail,
  /const workspaceNextAction = buildProjectWorkspaceNextAction\([\s\S]*?<ProjectWorkspaceNextActionRail[\s\S]*?action=\{workspaceNextAction\}[\s\S]*?onPrimary=\{handleWorkspacePrimaryAction\}[\s\S]*?onSecondary=\{handleWorkspaceSecondaryAction\}/,
  'Project cockpit primary actions must be driven by the ProjectWorkspaceNextActionRail state machine.'
)
requirePattern(
  projectDetail,
  /type ProjectWorkspaceActionKey =[\s\S]*?'ADD_REPOSITORY'[\s\S]*?'START_SCAN'[\s\S]*?'WATCH_SCAN'[\s\S]*?'REVIEW_FAILED_SCAN'[\s\S]*?'OPEN_ARTIFACTS'[\s\S]*?'OPEN_QA'/,
  'Project workspace next action rail must explicitly model the six main project states.'
)
requirePattern(
  projectDetail,
  /function buildProjectWorkspaceNextAction\([\s\S]*?key:\s*'ADD_REPOSITORY'[\s\S]*?key:\s*'START_SCAN'[\s\S]*?key:\s*'WATCH_SCAN'[\s\S]*?key:\s*'REVIEW_FAILED_SCAN'[\s\S]*?key:\s*'OPEN_ARTIFACTS'[\s\S]*?key:\s*'OPEN_QA'/,
  'Project workspace next action builder must cover no repo, no scan, running, failed, evidence gap and ready states.'
)
requirePattern(
  projectDetail,
  /aria-label="项目下一步行动"[\s\S]*?data-sl-action-key=\{action\.key\}[\s\S]*?data-sl-primary-count="1"[\s\S]*?<ActionButton[\s\S]*?type="primary"[\s\S]*?label=\{action\.primaryLabel\}[\s\S]*?<ActionButton[\s\S]*?label=\{action\.secondaryLabel\}[\s\S]*?aria-label="项目下一步证据检查"/,
  'Project workspace next action rail must expose one labeled primary action, an optional secondary action and evidence checks.'
)
requirePattern(
  projectDetail,
  /type ProjectWorkspaceViewState = 'INITIAL_LOADING' \| 'FATAL_LOAD' \| 'STALE_REFRESH' \| 'READY'/,
  'ProjectDetail must model initial, fatal, stale-refresh and trusted-ready workspace states explicitly.'
)
requirePattern(
  projectDetail,
  /Promise\.allSettled\(\[[\s\S]*?projectApi\.detail\(ownerProjectId\)[\s\S]*?repositoryApi\.list\(ownerProjectId\)[\s\S]*?scanTaskApi\.list\(ownerProjectId\)[\s\S]*?executionTaskApi\.list\(ownerProjectId, 1, 100\)/,
  'ProjectDetail core snapshot must load project, repositories, scans and executions as one owned request generation.'
)
requirePattern(
  projectDetail,
  /Number\(nextProject\.id\) !== ownerProjectId[\s\S]*?nextRepos\.every\(repo => Number\(repo\.projectId\) === ownerProjectId\)[\s\S]*?nextScans\.every\(scan => Number\(scan\.projectId\) === ownerProjectId\)/,
  'ProjectDetail must reject foreign project, repository and scan responses before committing a trusted snapshot.'
)
requirePattern(
  projectDetail,
  /projectGenerationRef[\s\S]*?coreRequestSeqRef[\s\S]*?detailRequestSeqRef[\s\S]*?fullRefreshOwnerRef[\s\S]*?workspaceSyncOwnerRef/,
  'ProjectDetail must keep separate route, core, detail, full-refresh and visible-sync ownership tokens.'
)
requirePattern(
  projectDetail,
  /const schedule = \(\) => \{[\s\S]*?window\.setTimeout\(poll, 3000\)[\s\S]*?fullRefreshOwnerRef\.current !== null[\s\S]*?await loadScans\(true\)[\s\S]*?finally \{[\s\S]*?schedule\(\)/,
  'ProjectDetail active-scan polling must reschedule after each request and must yield to a full refresh owner.'
)
requirePattern(
  projectDetail,
  /if \(workspaceViewState === 'INITIAL_LOADING'\)[\s\S]*?data-sl-project-state="INITIAL_LOADING"[\s\S]*?if \(workspaceViewState === 'FATAL_LOAD'\)[\s\S]*?data-sl-project-state="FATAL_LOAD"[\s\S]*?data-sl-project-state=\{workspaceViewState\}[\s\S]*?data-sl-project-id=\{projectId\}/,
  'ProjectDetail must render isolated initial/fatal surfaces before the trusted workspace root.'
)
requirePattern(
  projectDetail,
  /function isCodeKnowledgeOwnedByScan\([\s\S]*?Number\(response\.scanTaskId\) !== scanTaskId[\s\S]*?every\(item => Number\(item\.scanTaskId\) === scanTaskId\)/,
  'ProjectDetail code knowledge status must require an explicit matching scan id for the response and every item.'
)
requirePattern(
  projectDetail,
  /const ownedRepository = repos\.find\([\s\S]*?trustedSnapshotProjectIdRef\.current !== ownerProjectId[\s\S]*?await repositoryApi\.delete\(repoId\)[\s\S]*?const ownedScan = scans\.find\([\s\S]*?trustedSnapshotProjectIdRef\.current !== ownerProjectId[\s\S]*?await scanTaskApi\.cancel\(scanTaskId\)/,
  'ProjectDetail destructive repository and scan mutations must validate current trusted ownership before sending the request.'
)
requirePattern(
  projectDetail,
  /className="sl-project-next-action-actions"[\s\S]*?type="primary"[\s\S]*?className="sl-project-next-action-checks"/,
  'ProjectDetail must place the primary action before supporting evidence checks in the first viewport.'
)
requirePattern(
  css,
  /@media \(max-width: 720px\)[\s\S]*?\.sl-project-cockpit-main\s*\{[^}]*padding:\s*14px;[\s\S]*?\.sl-project-next-action-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  'ProjectDetail cockpit and action rail must use a compact two-action layout on mobile viewports.'
)
requirePattern(
  projectDetail,
  /<IconActionButton[\s\S]*?tooltip="触发扫描"[\s\S]*?icon=\{<SearchOutlined\s+\/>\}[\s\S]*?onClick=\{\(\)\s*=>\s*handleCreateScan\(r\)\}[\s\S]*?\/>/,
  'Project repository table scan action must use IconActionButton.'
)
requirePattern(
  projectDetail,
  /<IconActionButton[\s\S]*?tooltip="GitHub App 高级集成"[\s\S]*?icon=\{<SafetyCertificateOutlined\s+\/>\}[\s\S]*?onClick=\{\(\)\s*=>\s*openGitHubAppModal\(r\)\}[\s\S]*?\/>/,
  'Project repository table GitHub App action must use IconActionButton.'
)
requirePattern(
  projectDetail,
  /<IconActionButton\s+label=\{`删除仓库 \$\{r\.owner\}\/\$\{r\.name\}`\}\s+tooltip="删除仓库"[\s\S]*?icon=\{<DeleteOutlined\s+\/>\}\s*\/>/,
  'Project repository table delete action must use IconActionButton.'
)
requirePattern(
  projectDetail,
  /<ActionButton\s+aria-label="刷新扫描任务"[\s\S]*?label="刷新"\s*\/>/,
  'Project scan tab refresh action must use ActionButton.'
)
requirePattern(
  projectDetail,
  /<ActionButton[\s\S]*?aria-label=\{`查看扫描 #\$\{r\.id\} 报告`\}[\s\S]*?type="link"[\s\S]*?className="sl-inline-link"[\s\S]*?onClick=\{\(\)\s*=>\s*navigate\(`\/scan-tasks\/\$\{r\.id\}`\)\}[\s\S]*?label=\{`扫描 #\$\{r\.id\}`\}[\s\S]*?\/>/,
  'Project scan table title link must use ActionButton.'
)
requirePattern(
  projectDetail,
  /<IconActionButton[\s\S]*?tooltip="查看报告"[\s\S]*?icon=\{<FileTextOutlined\s+\/>\}[\s\S]*?onClick=\{\(\)\s*=>\s*navigate\(`\/scan-tasks\/\$\{r\.id\}`\)\}[\s\S]*?\/>/,
  'Project scan table report action must use IconActionButton.'
)
requirePattern(
  projectDetail,
  /<IconActionButton[\s\S]*?tooltip="执行详情"[\s\S]*?icon=\{<ScheduleOutlined\s+\/>\}[\s\S]*?onClick=\{\(\)\s*=>\s*navigate\(`\/execution-tasks\?projectId=\$\{projectId\}&taskId=\$\{execution\.id\}`\)\}[\s\S]*?\/>/,
  'Project scan table execution action must use IconActionButton.'
)
requirePattern(
  projectDetail,
  /<IconActionButton[\s\S]*?tooltip="取消扫描"[\s\S]*?danger[\s\S]*?icon=\{<StopOutlined\s+\/>\}[\s\S]*?loading=\{cancellingScan === r\.id\}[\s\S]*?\/>/,
  'Project scan table cancel action must use IconActionButton.'
)
requirePattern(
  projectDetail,
  /<ActionButton\s+icon=\{<DatabaseOutlined\s+\/>\}[\s\S]*?label="产物证据"\s*\/>[\s\S]*?<ActionButton\s+icon=\{<SendOutlined\s+\/>\}[\s\S]*?label="代码问答"\s*\/>[\s\S]*?<ActionButton\s+icon=\{<BranchesOutlined\s+\/>\}[\s\S]*?label="依赖图谱"\s*\/>[\s\S]*?<ActionButton\s+icon=\{<FileTextOutlined\s+\/>\}[\s\S]*?label="扫描详情"\s*\/>/,
  'Project readiness panel actions must use ActionButton.'
)
requirePattern(
  projectDetail,
  /浏览器阻止自动复制，请在弹窗中手动复制/,
  'Project QA copy actions must guide users when browser clipboard permissions are blocked.'
)
requirePattern(
  projectDetail,
  /当前浏览器环境阻止自动写入剪贴板/,
  'Project QA manual-copy fallback must explain why the modal is shown.'
)
requirePattern(
  projectDetail,
  /<ActionButton\s+size="small"\s+icon=\{<LinkOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*copyChunkDeepLink\(item\)\}\s+label="复制链接"\s*\/>/,
  'Project QA search result cards must expose a visible copy-link action.'
)
requirePattern(
  projectDetail,
  /<ActionButton[\s\S]*?className="sl-evidence-chip-action"[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?onClick=\{\(\)\s*=>\s*copyChunkDeepLink\(chunk\)\}[\s\S]*?label="链接"[\s\S]*?\/>/,
  'Project QA evidence chips must expose a compact copy-link action.'
)
requirePattern(
  projectDetail,
  /import \{ redactSensitiveText \} from '\.\.\/utils\/displayRedaction'[\s\S]*?function redactedChunkPreview\(chunk: CodeChunkSearchItem\): string[\s\S]*?return redactSensitiveText\(chunk\.contentPreview \|\| chunk\.content \|\| ''\)/,
  'Project QA code_chunks search results must use the shared displayRedaction utility for chunk preview display.'
)
requirePattern(
  projectDetail,
  /const copyChunkCitation = async \(chunk: CodeChunkSearchItem\) => \{[\s\S]*?redactedChunkPreview\(chunk\)[\s\S]*?copyTextToClipboard\(citation\)/,
  'Project QA code_chunks copy citation must use display-redacted chunk preview text.'
)
requirePattern(
  projectDetail,
  /const displayPreview = redactedChunkPreview\(item\)[\s\S]*?<article key=\{item\.id\} className="sl-search-result-card"[\s\S]*?aria-label=\{`code_chunks 证据卡片 \$\{itemSourceLabel\}`\}[\s\S]*?className="sl-search-result-source"[\s\S]*?className="sl-search-result-path"[\s\S]*?className="sl-search-result-line-ref"[\s\S]*?className="sl-search-evidence-reason"[\s\S]*?证据说明[\s\S]*?命中词[\s\S]*?className="sl-search-actions"[\s\S]*?label="定位检索"[\s\S]*?label="追问此处"[\s\S]*?label="复制引用"[\s\S]*?label="复制链接"[\s\S]*?className="sl-code-block sl-search-code-preview sl-search-code-preview-redacted" aria-label="脱敏 code chunk 搜索结果预览"[\s\S]*?\{displayPreview\}/,
  'Project QA search result card must render a readable evidence contract with path, line, reason, terms, actions and preview.'
)
rejectPattern(
  projectDetail,
  /<pre className="sl-code-block sl-search-code-preview">\s*\{item\.contentPreview \|\| item\.content\}\s*<\/pre>/,
  'Project QA search result cards must not render raw item.contentPreview || item.content.'
)
rejectPattern(
  projectDetail,
  /const copyChunkCitation = async \(chunk: CodeChunkSearchItem\) => \{[\s\S]*?chunk\.contentPreview \|\| chunk\.content[\s\S]*?\}\.join\('\\n'\)/,
  'Project QA copy citation must not copy raw chunk.contentPreview || chunk.content.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /projectQaChunkRawSecretSentinel[\s\S]*?projectQaChunkRawSkSecret[\s\S]*?projectQaChunkRawJwtSecret[\s\S]*?forbiddenProjectQaChunkSecrets[\s\S]*?candidateChunk[\s\S]*?Authorization: Bearer \$\{projectQaChunkRawSecretSentinel\}[\s\S]*?apiKey=\$\{projectQaChunkRawSkSecret\}[\s\S]*?jwt=\$\{projectQaChunkRawJwtSecret\}[\s\S]*?adjacentContextChunk[\s\S]*?Authorization: Bearer \$\{projectQaChunkRawSecretSentinel\}/,
  'Project QA recoverable smoke must seed raw Project QA code chunk preview secrets.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /assertProjectQaChunkPreviewRedaction[\s\S]*?sl-search-code-preview-redacted[\s\S]*?toContainText\(redactedSecretLabel\)[\s\S]*?not\.toContainText\(secret\)[\s\S]*?复制引用[\s\S]*?__projectQaLastClipboardText[\s\S]*?not\.toContain\(secret\)/,
  'Project QA recoverable smoke must assert redacted preview and copied citation do not expose raw chunk secrets.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /redaction:\s*\{[\s\S]*?scope:\s*'PROJECT_QA_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY'[\s\S]*?surface:\s*'PROJECT_QA_CODE_CHUNKS_SEARCH'[\s\S]*?fixtureHasRawSecretSentinel[\s\S]*?fixtureHasBearerSecret[\s\S]*?fixtureHasApiKeySecret[\s\S]*?fixtureHasJwtSecret[\s\S]*?rawSecretsHidden[\s\S]*?bodyRawSecretsHidden[\s\S]*?redactionVisible[\s\S]*?sanitizedPreviewVisible[\s\S]*?copiedCitationRedacted[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?Project QA marker must not contain raw Project QA chunk secret/,
  'Project QA recoverable smoke marker must include code chunk preview/copy redaction proof and exclude raw secrets.'
)
requirePattern(
  projectDetail,
  /interface ChunkEvidenceCombination[\s\S]*?primaryCount:\s*number[\s\S]*?contextCount:\s*number[\s\S]*?uniqueFiles:\s*number[\s\S]*?nextQuestions:\s*string\[\][\s\S]*?function buildChunkEvidenceCombination\(items: CodeChunkSearchItem\[\]\): ChunkEvidenceCombination \| null[\s\S]*?primaryItems = items\.filter\(item => !isContextChunk\(item\)\)[\s\S]*?contextItems = items\.filter\(isContextChunk\)[\s\S]*?sort\(\(a, b\) => \(b\.relevanceScore \?\? 0\) - \(a\.relevanceScore \?\? 0\)\)[\s\S]*?nextQuestions[\s\S]*?function ChunkEvidenceCombinationCard\(\{ combination \}: \{ combination: ChunkEvidenceCombination \}\)[\s\S]*?aria-label="证据组合路径"[\s\S]*?证据组合路径[\s\S]*?主证据阅读起点[\s\S]*?相邻上下文[\s\S]*?文件覆盖[\s\S]*?下一步追问 \/ 复核方向/,
  'Project QA must derive and render a deterministic evidence combination summary from visible code_chunks.'
)
requirePattern(
  projectDetail,
  /type CodeUnderstandingQueryKind = 'IDLE' \| 'FILE_LINE' \| 'METHOD_ANCHOR' \| 'STACK_TRACE' \| 'GENERAL'[\s\S]*?function classifyCodeUnderstandingQuery\(query: string\): CodeUnderstandingQuerySignal[\s\S]*?STACK_TRACE[\s\S]*?METHOD_ANCHOR[\s\S]*?FILE_LINE[\s\S]*?function CodeUnderstandingLensPanel\([\s\S]*?const sameScan = Boolean[\s\S]*?const primaryRole = Boolean[\s\S]*?const readyForExplanation = Boolean\(primaryChunk && sameScan && primaryRole && !loading\)[\s\S]*?aria-label="代码理解定位入口"[\s\S]*?代码理解入口[\s\S]*?当前扫描[\s\S]*?主证据位置[\s\S]*?证据编号[\s\S]*?召回模式[\s\S]*?Readiness[\s\S]*?aria-label="Agent 交接合约"[\s\S]*?扫描 \/ 文件 \/ 行号 \/ 证据角色[\s\S]*?源码正文 \/ raw prompt \/ stack[\s\S]*?进入 AgentChat 后手动发送[\s\S]*?label="定位检索"[\s\S]*?disabled=\{!readyForExplanation\}[\s\S]*?label="解释此处"[\s\S]*?disabled=\{!readyForExplanation\}[\s\S]*?label="交给 Agent"[\s\S]*?label="复制引用"/,
  'Project QA must expose a code-understanding lens and Agent handoff contract for file:line, method anchor and stack-frame inputs without adding a new API.'
)
requirePattern(
  projectDetail,
  /className=\{`sl-code-understanding-lens-gate \$\{readyForExplanation \? 'sl-code-understanding-lens-gate-ready' : 'sl-code-understanding-lens-gate-blocked'\}`\}[\s\S]*?role="note"[\s\S]*?aria-label="Agent 交接门禁说明"[\s\S]*?Agent 交接门禁已开放[\s\S]*?Agent 交接门禁未开放[\s\S]*?explainDisabledReason/s,
  'Project QA code-understanding lens must render an explicit visible Agent handoff gate reason instead of relying on button title or tag text.'
)
requirePattern(
  projectDetail,
  /function classifyCodeUnderstandingQuery\(query: string\): CodeUnderstandingQuerySignal[\s\S]*?const hasStackFrame[\s\S]*?@\(\?:\[a-z\][\s\S]*?\\\/\\\/[\s\S]*?kind:\s*'STACK_TRACE'/,
  'Project QA code-understanding lens must classify browser function@source-url stack frames as STACK_TRACE instead of plain file:line.'
)
requirePattern(
  codeLocationHintParser,
  /FUNCTION_AT_FILE_HINT_PATTERN[\s\S]*?@[\s\S]*?\[a-z\]\[a-z0-9\+\.\-\]\*:\/\/[\s\S]*?addFunctionFileHints\(hints, FUNCTION_AT_FILE_HINT_PATTERN\.matcher\(queryText\)\)[\s\S]*?simpleFunctionName/,
  'Code location hint parser must extract browser function@source-url stack frames as function/file hints without keeping raw source URLs.'
)
requirePattern(
  css,
  /\.sl-code-understanding-lens-contract\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-code-understanding-lens-contract span,[\s\S]*?\.sl-code-understanding-lens-contract strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;/,
  'Project QA code-understanding Agent handoff contract must have dedicated responsive wrapping styles.'
)
requirePattern(
  css,
  /\.sl-code-understanding-lens-gate\s*\{[\s\S]*?border:[\s\S]*?\.sl-code-understanding-lens-gate-ready[\s\S]*?\.sl-code-understanding-lens-gate-blocked[\s\S]*?\.sl-code-understanding-lens-gate span,[\s\S]*?\.sl-code-understanding-lens-gate strong\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;/,
  'Project QA Agent handoff gate reason must have dedicated visible wrapping styles.'
)
requirePattern(
  projectDetail,
  /className="sl-answer-citation-source"[\s\S]*?className="sl-answer-citation-line"[\s\S]*?className="sl-answer-citation-reason"[\s\S]*?redactSensitiveText\(citationEvidenceReason\(citation\)\)/,
  'Project QA answer citation cards must expose source label, full line reference and redacted readable reason.'
)
requirePattern(
  projectDetail,
  /function evidenceReason\(chunk: CodeChunkSearchItem\): string \{[\s\S]*?if \(chunk\.evidenceReason\) return `\$\{redactSensitiveText\(chunk\.evidenceReason\)\}\$\{contextSuffix\}`[\s\S]*?return redactSensitiveText\(`/,
  'Project QA code chunk evidenceReason helper must redact raw evidence reason before display, title or clipboard use.'
)
requirePattern(
  projectDetail,
  /const copyQaCitation = async \(citation: CodeQaCitation\) => \{[\s\S]*?const citationText = \[[\s\S]*?redactSensitiveText\(citationEvidenceReason\(citation\)\)[\s\S]*?\]\.join\('\\n'\)/,
  'Project QA copy citation action must redact citation evidence reason before clipboard output.'
)
requirePattern(
  projectDetail,
  /className="sl-evidence-chip-list"[\s\S]*?aria-label=\{`代码切片证据 \$\{chunkSourceLabel\}`\}[\s\S]*?className="sl-evidence-chip-head"[\s\S]*?className="sl-evidence-chip-ref"[\s\S]*?className="sl-evidence-chip-reason"[\s\S]*?className="sl-evidence-chip-actions"/,
  'Project QA retrieved chunk evidence must render as readable cards instead of a compressed inline tag string.'
)
requirePattern(
  css,
  /\.sl-search-result-card\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-search-result-source[\s\S]*?\.sl-search-result-path,[\s\S]*?\.sl-search-result-line-ref[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-search-evidence-reason[\s\S]*?\.sl-search-matched-terms[\s\S]*?\.sl-search-actions[\s\S]*?\.sl-search-code-preview/,
  'Project QA search result cards must have dedicated readable responsive styles.'
)
requirePattern(
  css,
  /\.sl-code-understanding-lens\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-code-understanding-lens-ready[\s\S]*?\.sl-code-understanding-lens-warning[\s\S]*?\.sl-code-understanding-lens-grid[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);[\s\S]*?\.sl-code-understanding-lens-grid span,[\s\S]*?\.sl-code-understanding-lens-grid strong[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-code-understanding-lens-actions/,
  'Project QA code-understanding lens must have dedicated readable responsive styles.'
)
requirePattern(
  css,
  /\.sl-qa-evidence-combination\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-qa-evidence-combination-ready[\s\S]*?\.sl-qa-evidence-combination-grid[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);[\s\S]*?\.sl-qa-evidence-combination-path[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?\.sl-qa-evidence-combination-next[\s\S]*?\.sl-qa-evidence-combination-next li[\s\S]*?overflow-wrap:\s*anywhere;/,
  'Project QA evidence combination summary must have dedicated readable responsive styles.'
)
requirePattern(
  css,
  /@media \(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-chat-row-assistant\s+\.sl-chat-bubble\s*\{[^}]*max-width:\s*100%\s*;/,
  'Project QA assistant answer bubble must use the full available mobile width so evidence cards are not double-compressed.'
)
requirePattern(
  css,
  /\.sl-answer-citation-tags\s+\.ant-tag,\s*\.sl-qa-evidence-combination-path\s+\.ant-tag,\s*\.sl-search-summary\s+\.ant-tag\s*\{[^}]*max-width:\s*100%\s*;[^}]*white-space:\s*normal\s*;[^}]*overflow-wrap:\s*anywhere\s*;/s,
  'Project QA deep evidence tags must wrap safely in citation, combination and search summary surfaces.'
)
requirePattern(
  css,
  /\.sl-evidence-chip-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(260px, 100%\), 1fr\)\);[\s\S]*?\.sl-evidence-chip\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-evidence-chip-badges,[\s\S]*?\.sl-evidence-chip-actions[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?\.sl-evidence-chip-ref[\s\S]*?overflow-wrap:\s*anywhere;/,
  'Project QA evidence chip cards must wrap safely on narrow viewports.'
)
requirePattern(
  projectDetail,
  /label:\s*'栈帧定位'[\s\S]*?file:line[\s\S]*?browser stack trace|label:\s*'栈帧定位'[\s\S]*?浏览器 stack trace/s,
  'Project QA Playbook must expose file:line and browser stack trace定位入口.'
)
requirePattern(
  projectDetail,
  /placeholder="输入问题，或粘贴 AuthService\.java:85、Class#method、at fetchUser \(\.\.\.\/auth-store\.ts:85:13\)"/,
  'Project QA composer placeholder must advertise file:line, Class#method and browser stack frame inputs.'
)
requirePattern(
  projectDetail,
  /placeholder="搜索类名、函数名、路径、file:line 或浏览器 stack trace"/,
  'Project QA evidence search placeholder must advertise file:line and browser stack trace inputs.'
)
requirePattern(
  projectDetail,
  /<Popconfirm title="禁用 GitHub App installation？" onConfirm=\{handleDisableGitHubApp\}>\s*<ActionButton danger label="禁用" \/>/s,
  'Project GitHub App disable action must use ActionButton.'
)
rejectPattern(
  projectDetail,
  /<Button\b/,
  'ProjectDetail must not reintroduce raw Ant Design Button for project workspace actions.'
)

requirePattern(
  agentTasks,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'AgentTasks visible actions must use the shared ActionButton primitive.'
)
requirePattern(
  agentTasks,
  /import IconActionButton from '\.\.\/components\/ui\/IconActionButton'/,
  'AgentTasks dense table actions must use the shared IconActionButton primitive.'
)
requirePattern(
  agentTasks,
  /import \{ createSelectableTableRowProps \} from '\.\.\/components\/ui\/selectableTableRow'/,
  'AgentTasks detail selection must use the shared selectable table row helper instead of local keyboard handling.'
)
rejectPattern(
  agentTasks,
  /handleRowKeyDown|KeyboardEvent<HTMLElement>/,
  'AgentTasks must not keep page-local row keyboard handlers after adopting the shared selectable table row helper.'
)
requirePattern(
  agentTasks,
  /<ActionButton[\s\S]*?type="link"[\s\S]*?className="sl-inline-link"[\s\S]*?event\.stopPropagation\(\)[\s\S]*?handleSelectTask\(record\)[\s\S]*?label=\{title\}[\s\S]*?\/>/,
  'AgentTasks table title link must use ActionButton without bubbling into the row click handler.'
)
requirePattern(
  agentTasks,
  /<ActionButton[\s\S]*?type="link"[\s\S]*?size="small"[\s\S]*?className="sl-inline-link"[\s\S]*?event\.stopPropagation\(\)[\s\S]*?openScanTask\(record\.scanTaskId\)[\s\S]*?label=\{`#\$\{scanTaskId\}`\}[\s\S]*?\/>/,
  'AgentTasks table scan report link must use ActionButton.'
)
requirePattern(
  agentTasks,
  /<IconActionButton[\s\S]*?tooltip="打开对话"[\s\S]*?type="primary"[\s\S]*?icon=\{<MessageOutlined\s+\/>\}[\s\S]*?navigate\(`\/agent-chat\/\$\{record\.conversationId\}`\)[\s\S]*?\/>/,
  'AgentTasks table conversation action must use IconActionButton.'
)
requirePattern(
  agentTasks,
  /<IconActionButton[\s\S]*?tooltip="启动"[\s\S]*?type="primary"[\s\S]*?icon=\{<PlayCircleOutlined\s+\/>\}[\s\S]*?event\.stopPropagation\(\)[\s\S]*?handleStart\(record\.id\)[\s\S]*?\/>/,
  'AgentTasks table start action must use IconActionButton without bubbling into the row click handler.'
)
requirePattern(
  agentTasks,
  /<IconActionButton[\s\S]*?label=\{`取消 Agent 任务 #\$\{record\.id\}`\}[\s\S]*?tooltip="取消"[\s\S]*?icon=\{<StopOutlined\s+\/>\}[\s\S]*?event\.stopPropagation\(\)[\s\S]*?\/>/,
  'AgentTasks table cancel action must use IconActionButton without bubbling into the row click handler.'
)
requirePattern(
  agentTasks,
  /<ActionButton[\s\S]*?size="small"[\s\S]*?className="sl-agent-detail-action"[\s\S]*?event\.stopPropagation\(\)[\s\S]*?handleSelectTask\(record\)[\s\S]*?aria-label=\{`查看 Agent 任务 #\$\{record\.id\} 详情`\}[\s\S]*?label="详情"[\s\S]*?\/>/,
  'AgentTasks table detail action must use ActionButton with an explicit accessible task-specific label.'
)
requirePattern(
  agentTasks,
  /<Card className="sl-section-card sl-agent-table-card sl-selectable-table-card"[\s\S]*?onRow=\{\(record\) => createSelectableTableRowProps\(\{[\s\S]*?record,[\s\S]*?selected: selectedTask\?\.id === record\.id,[\s\S]*?onSelect: handleSelectTask,[\s\S]*?controlsId: selectedDetailId,[\s\S]*?label: `AgentTask #\$\{record\.id\} \$\{selectedTask\?\.id === record\.id \? '已选中' : '查看详情'\}`/,
  'AgentTasks table rows must use the shared selectable row helper with selected state, aria-controls and stable row labels.'
)
requirePattern(
  agentTasks,
  /<Card[\s\S]*?id=\{selectedDetailId\}[\s\S]*?role="region"[\s\S]*?aria-labelledby=\{selectedTitleId\}[\s\S]*?className="sl-section-card sl-agent-detail-card"[\s\S]*?<Space wrap id=\{selectedTitleId\}>/,
  'AgentTasks detail card must expose a labelled region connected from the selected row.'
)
requirePattern(
  css,
  /\.sl-selectable-table-card \.ant-table-row\s*\{[^}]*cursor:\s*pointer;[\s\S]*?\.sl-selectable-table-card \.ant-table-row:focus-visible > td\s*\{[^}]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.64\);[\s\S]*?\.sl-selectable-table-card \.ant-table-row\[aria-selected='true'\] > td[\s\S]*?\.sl-agent-table-card \.ant-table-content\s*\{[\s\S]*?overflow-x:\s*auto;[\s\S]*?\.sl-agent-detail-action\s*\{[^}]*min-width:\s*76px;[\s\S]*?\.sl-agent-payload-safety\s*\{[\s\S]*?grid-template-columns:\s*auto minmax\(0,\s*1fr\);/s,
  'AgentTasks table must inherit selectable row styling and keep table scroller plus payload safety panel readable.'
)
requirePattern(
  agentTasks,
  /<ActionButton[\s\S]*?type="primary"[\s\S]*?icon=\{<PlusOutlined\s+\/>\}[\s\S]*?setCreateModalOpen\(true\)[\s\S]*?label="创建任务"[\s\S]*?\/>/,
  'AgentTasks cockpit create action must use ActionButton.'
)
requirePattern(
  agentTasks,
  /<ActionButton\s+size="small"\s+type="primary"\s+icon=\{<MessageOutlined\s+\/>\}[\s\S]*?label="打开对话"\s*\/>/,
  'AgentTasks detail conversation action must use ActionButton.'
)
requirePattern(
  agentTasks,
  /<ActionButton[\s\S]*?type="link"[\s\S]*?size="small"[\s\S]*?className="sl-inline-link"[\s\S]*?onClick=\{\(\)\s*=>\s*openScanTask\(selectedTask\.scanTaskId\)\}[\s\S]*?label=\{`扫描报告 #\$\{selectedTask\.scanTaskId\}`\}[\s\S]*?\/>/,
  'AgentTasks detail scan report link must use ActionButton.'
)
requirePattern(
  agentTasks,
  /<ActionButton\s+size="small"\s+danger\s+icon=\{<StopOutlined\s+\/>\}\s+label="取消"\s*\/>/,
  'AgentTasks detail cancel action must use ActionButton.'
)
requirePattern(
  agentTasks,
  /selectedTask\.inputJson[\s\S]*?原始输入默认隐藏[\s\S]*?selectedTask\.outputJson[\s\S]*?原始输出默认隐藏[\s\S]*?aria-label="原始 Payload 安全边界"[\s\S]*?原始 Payload 默认隐藏/,
  'AgentTasks detail must not render raw task input/output JSON and must show an explicit raw Payload safety boundary.'
)
requirePattern(
  agentTasks,
  /interface AgentTaskActionGate[\s\S]*?status:\s*'READY' \| 'REVIEW' \| 'BLOCKED'[\s\S]*?selectedActionGate = selectedTask \? buildAgentTaskActionGate\(selectedTask\) : null[\s\S]*?AgentTaskActionGatePanel gate=\{selectedActionGate\}/,
  'AgentTasks detail must define and render an explicit action gate derived from the selected task state.'
)
requirePattern(
  agentTasks,
  /const stepsRequestSeqRef = useRef\(0\)[\s\S]*?const fetchSteps = \(taskId: number\) => \{[\s\S]*?const requestSeq = stepsRequestSeqRef\.current \+ 1[\s\S]*?stepsRequestSeqRef\.current = requestSeq[\s\S]*?if \(stepsRequestSeqRef\.current !== requestSeq\) return[\s\S]*?setSteps\(res\.data\.data \|\| \[\]\)[\s\S]*?if \(stepsRequestSeqRef\.current === requestSeq\) \{[\s\S]*?setStepsLoading\(false\)/,
  'AgentTasks step loading must reject stale step responses before lifecycle and detail evidence use them.'
)
requirePattern(
  agentTasks,
  /function AgentTaskActionGatePanel[\s\S]*?aria-label="Agent 任务动作门禁说明"[\s\S]*?Agent Task Action Gate[\s\S]*?gate\.reason[\s\S]*?sl-agent-action-gate-grid/,
  'AgentTasks action gate panel must expose a labelled readable region with summary, reason and check grid.'
)
requirePattern(
  agentTasks,
  /interface AgentTaskLifecycleStage[\s\S]*?key:\s*string[\s\S]*?stage:\s*string[\s\S]*?title:\s*string[\s\S]*?tone:\s*AgentTone[\s\S]*?function buildAgentTaskLifecycleStages\([\s\S]*?tasks: AgentTask\[\][\s\S]*?scanBoundCount: number[\s\S]*?conversationBoundCount: number[\s\S]*?selectedTask: AgentTask \| null[\s\S]*?steps: AgentTaskStep\[\][\s\S]*?\): AgentTaskLifecycleStage\[\]/,
  'AgentTasks must derive a typed lifecycle governance loop from task list summary, selected task and selected step evidence.'
)
requirePattern(
  agentTasks,
  /key:\s*'task-intake'[\s\S]*?title:\s*'任务入口'[\s\S]*?key:\s*'execution-control'[\s\S]*?title:\s*'执行控制'[\s\S]*?key:\s*'tool-evidence'[\s\S]*?title:\s*'工具证据'[\s\S]*?key:\s*'review-handoff'[\s\S]*?title:\s*'复盘交接'/,
  'AgentTasks lifecycle governance loop must cover task intake, execution control, tool evidence and review handoff.'
)
requirePattern(
  agentTasks,
  /<AgentTaskLifecycleLoop stages=\{lifecycleStages\} \/>[\s\S]*?function AgentTaskLifecycleLoop[\s\S]*?aria-label="Agent 任务治理闭环"[\s\S]*?DEVELOPER CONTROL PLANE[\s\S]*?Agent 任务治理闭环[\s\S]*?不能证明模型判断正确、工具输出真实、修复\/PR\/CI 结果正确[\s\S]*?data-sl-agent-lifecycle-stage=\{stage\.key\}/,
  'AgentTasks must render the developer-control-plane Agent task lifecycle governance loop with explicit no-overclaim boundary copy and stable markers.'
)
requirePattern(
  agentTasks,
  /function buildAgentTaskActionGate\(task: AgentTask\): AgentTaskActionGate(?=[\s\S]*?启动门禁开放，取消门禁关闭)(?=[\s\S]*?未运行不可取消)(?=[\s\S]*?取消门禁开放，启动门禁关闭)(?=[\s\S]*?运行中不可重复启动)(?=[\s\S]*?状态变更门禁关闭，复盘入口开放)(?=[\s\S]*?终态缺少复盘输出)(?=[\s\S]*?终态关闭)(?=[\s\S]*?未知状态，动作门禁关闭)/,
  'AgentTasks action gate state machine must cover pending, running, terminal with review output, terminal without output and unknown statuses.'
)
requirePattern(
  css,
  /\.sl-agent-action-gate\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-agent-action-gate-head strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;[\s\S]*?\.sl-agent-action-gate-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-agent-action-gate-check span,[\s\S]*?\.sl-agent-action-gate-check strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;/,
  'AgentTasks action gate CSS must keep reason and check text readable without clipping.'
)
requirePattern(
  css,
  /\.sl-agent-lifecycle-loop\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-agent-lifecycle-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-agent-lifecycle-stage\s*\{[\s\S]*?min-height:\s*184px;[\s\S]*?\.sl-agent-lifecycle-stage-ready[\s\S]*?\.sl-agent-lifecycle-stage-warning[\s\S]*?\.sl-agent-lifecycle-stage-danger[\s\S]*?\.sl-agent-lifecycle-head h2,[\s\S]*?\.sl-agent-lifecycle-stage p\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;/s,
  'AgentTasks lifecycle governance loop must define readable 4-column desktop cards with ready/warning/danger states and wrapping text.'
)
requirePattern(
  css,
  /\.sl-agent-lifecycle-grid,[\s\S]*?\.sl-agent-summary-grid,[\s\S]*?\.sl-agent-action-gate-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-agent-lifecycle-grid,[\s\S]*?\.sl-agent-summary-grid,[\s\S]*?\.sl-agent-health-grid,[\s\S]*?\.sl-agent-action-gate-grid,[\s\S]*?\.sl-artifact-preview-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
  'AgentTasks lifecycle and action gate grids must collapse at tablet and mobile breakpoints.'
)
rejectPattern(
  agentTasks,
  /JSON\.parse\(selectedTask\.(inputJson|outputJson)\)|selectedTask\.inputJson\s*\}\)|selectedTask\.outputJson\s*\}\)/,
  'AgentTasks detail must not parse and print selectedTask inputJson/outputJson into the UI.'
)
requirePattern(
  taskTimeline,
  /SafetyCertificateOutlined[\s\S]*?item\.output[\s\S]*?className="sl-task-timeline-output-notice"[\s\S]*?aria-label="步骤输出安全边界"[\s\S]*?步骤输出已留存，默认隐藏/,
  'TaskTimeline must replace raw step output rendering with an explicit step output safety notice.'
)
rejectPattern(
  taskTimeline,
  /<pre[\s\S]*?item\.output|formatJson\(item\.output\)|JSON\.parse\(value\)/,
  'TaskTimeline must not render or parse step output raw JSON into the ordinary timeline UI.'
)
rejectPattern(
  agentTasks,
  /<Button\b/,
  'AgentTasks must not reintroduce raw Ant Design Button for Agent task actions.'
)

requirePattern(
  autoRepairs,
  /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
  'AutoRepairs visible actions must use the shared ActionButton primitive.'
)
requirePattern(
  autoRepairs,
  /<ActionButton\s+type="link"\s+className="sl-inline-link"\s+icon=\{<CodeOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*handleSelect\(record\)\}\s+label=\{redactAutoRepairText\(path\)\}\s*\/>/,
  'AutoRepairs table file path link must use ActionButton.'
)
requirePattern(
  autoRepairs,
  /<ActionButton\s+icon=\{<ReloadOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*fetchItems\(\)\}\s+label="刷新列表"\s*\/>/,
  'AutoRepairs refresh action must use ActionButton.'
)
requirePattern(
  autoRepairs,
  /<ActionButton\s+type="primary"\s+icon=\{<PlusOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*\{[\s\S]*?setDraftSource\(null\);[\s\S]*?setDraftProvenance\(undefined\);[\s\S]*?setShowCreate\(true\)[\s\S]*?\}\}\s+label="新建修码任务"\s*\/>/,
  'AutoRepairs create action must use ActionButton.'
)
requirePattern(
  autoRepairs,
  /extra=\{<ActionButton\s+size="small"\s+onClick=\{\(\)\s*=>\s*setSelected\(null\)\}\s+label="关闭"\s*\/>\}/,
  'AutoRepairs detail close action must use ActionButton.'
)
requirePattern(
  autoRepairs,
  /<ActionButton\s+danger\s+icon=\{<StopOutlined\s+\/>\}\s+loading=\{cancellingId === selected\.id\}\s+label="取消"\s*\/>/,
  'AutoRepairs cancel action must use ActionButton.'
)
requirePattern(
  autoRepairs,
  /<Popconfirm[\s\S]*?title="创建受控 Pull Request？"[\s\S]*?onConfirm=\{handleSubmitPr\}[\s\S]*?<ActionButton[\s\S]*?type="primary"[\s\S]*?icon=\{<BranchesOutlined\s+\/>\}[\s\S]*?loading=\{submittingPr\}[\s\S]*?label="创建 PR"[\s\S]*?\/>[\s\S]*?<\/Popconfirm>/,
  'AutoRepairs create PR action must require confirmation and use ActionButton.'
)
requirePattern(
  autoRepairs,
  /<Popconfirm[\s\S]*?title="创建受控 Pull Request？"[\s\S]*?overlayClassName="sl-autorepair-pr-popconfirm"[\s\S]*?description=\{[\s\S]*?<PatchReadyPrConfirmSummary/,
  'AutoRepairs PR confirmation popover must use a scoped class for narrow-screen readability controls.'
)
requirePattern(
  autoRepairs,
  /<ActionButton[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?href=\{selected\.prUrl\}[\s\S]*?label="打开 PR"[\s\S]*?\/>/,
  'AutoRepairs open PR action must use ActionButton.'
)
rejectPattern(
  autoRepairs,
  /<Button\b/,
  'AutoRepairs must not reintroduce raw Ant Design Button for repair actions.'
)
requirePattern(
  css,
  /\.sl-autorepair-table-card,\s*\.sl-autorepair-detail-card\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow:\s*hidden;[\s\S]*?\.sl-autorepair-table-card \.ant-table-content\s*\{[\s\S]*?overflow-x:\s*auto;[\s\S]*?\.sl-autorepair-detail-card \.ant-card-head-title \.ant-space\s*\{[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?\.sl-autorepair-check span,\s*\.sl-autorepair-check strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-autorepair-review-copy span,\s*\.sl-autorepair-review-copy strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-autorepair-pr-popconfirm\s*\{[\s\S]*?max-width:\s*calc\(100vw - 24px\);/s,
  'AutoRepairs CSS must keep table scrolling local and prevent detail, review, candidate and PR confirmation text from clipping on narrow screens.'
)

for (const [name, source] of [
  ['CiDiagnostics', ciDiagnostics],
  ['PrReviews', prReviews],
  ['IssueDecomposition', issueDecomposition],
]) {
  requirePattern(
    source,
    /import ActionButton from '\.\.\/components\/ui\/ActionButton'/,
    `${name} visible actions must use the shared ActionButton primitive.`
  )
}

for (const [name, source] of [
  ['CiDiagnostics', ciDiagnostics],
  ['PrReviews', prReviews],
  ['IssueDecomposition', issueDecomposition],
]) {
  requirePattern(
    source,
    /import IconActionButton from '\.\.\/components\/ui\/IconActionButton'/,
    `${name} dense table actions must use the shared IconActionButton primitive.`
  )
}

requirePattern(
  ciDiagnosticsPage,
  /const initialDiagnosticId = Number\(searchParams\.get\('diagnosticId'\)\) \|\| undefined[\s\S]*?<CiDiagnostics projectId=\{projectId\} initialDiagnosticId=\{initialDiagnosticId\} \/>/,
  'CiDiagnosticsPage must parse diagnosticId and pass it to the CI diagnostics page for source deep links.'
)
requirePattern(
  ciDiagnostics,
  /import type \{ ReactNode \} from 'react'[\s\S]*?import \{ createSelectableTableRowProps \} from '\.\.\/components\/ui\/selectableTableRow'/,
  'CiDiagnostics detail selection must use the shared selectable table row helper instead of local keyboard handling.'
)
requirePattern(
  ciDiagnostics,
  /const selectDiagnostic = useCallback\(\(record: CiDiagnostic\) => \{[\s\S]*?setSelected\(record\)[\s\S]*?\}, \[\]\)/,
  'CiDiagnostics detail selection must centralize row selection through selectDiagnostic.'
)
rejectPattern(
  ciDiagnostics,
  /handleDiagnosticRowKeyDown|KeyboardEvent<HTMLElement>/,
  'CiDiagnostics must not keep page-local row keyboard handlers after adopting the shared selectable table row helper.'
)
requirePattern(
  ciDiagnostics,
  /<ActionButton[\s\S]*?type="link"[\s\S]*?className="sl-ci-table-link"[\s\S]*?onClick=\{\(event\) => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?selectDiagnostic\(record\)[\s\S]*?\}\}[\s\S]*?label=\{name \|\| `#\$\{record\.runNumber \|\| record\.id\}`\}[\s\S]*?\/>/,
  'CiDiagnostics workflow table link must use ActionButton and must not bubble into row selection.'
)
requirePattern(
  ciDiagnostics,
  /<IconActionButton[\s\S]*?label=\{`重新分析 CI 诊断 #\$\{record\.id\}`\}[\s\S]*?tooltip="重新分析"[\s\S]*?icon=\{<ReloadOutlined\s+\/>\}[\s\S]*?handleReanalyze\(record\.id\)[\s\S]*?\/>/,
  'CiDiagnostics table reanalyze action must use IconActionButton.'
)
requirePattern(
  ciDiagnostics,
  /<Card className="sl-section-card sl-ci-table-card sl-selectable-table-card"[\s\S]*?<Table[\s\S]*?className="sl-ci-diagnostics-table"[\s\S]*?onRow=\{\(record\) => createSelectableTableRowProps\(\{[\s\S]*?record,[\s\S]*?selected: selected\?\.id === record\.id,[\s\S]*?onSelect: selectDiagnostic,[\s\S]*?controlsId: selectedDetailId,[\s\S]*?label: `CiDiagnostic #\$\{record\.id\}/,
  'CiDiagnostics table rows must use the shared selectable row helper with selected state, aria-controls and stable row labels.'
)
requirePattern(
  ciDiagnostics,
  /<Card[\s\S]*?id=\{selectedDetailId\}[\s\S]*?role="region"[\s\S]*?aria-labelledby=\{selectedTitleId\}[\s\S]*?className="sl-section-card sl-ci-detail-card"[\s\S]*?<span className="sl-card-title" id=\{selectedTitleId\}>/,
  'CiDiagnostics detail card must expose a labelled region connected from the selected row.'
)
requirePattern(
  ciDiagnostics,
  /const repairReadiness = selected \? buildRepairReadiness\(selected, selectedRelatedFiles, selectedFixSuggestions\) : null[\s\S]*?<RepairReadinessCard readiness=\{repairReadiness\} \/>[\s\S]*?function buildRepairReadiness\(item: CiDiagnostic, relatedFiles: string\[\], suggestions: string\[\]\)/,
  'CiDiagnostics detail must explain AutoRepair candidate readiness instead of hiding why the action is unavailable.'
)
requirePattern(
  ciDiagnostics,
  /initialDiagnosticId\?: number[\s\S]*?useRef<number \| null>\(null\)[\s\S]*?ciApi\.detail\(initialDiagnosticId\)[\s\S]*?detail\.projectId !== projectId[\s\S]*?setItems\(prev => prev\.some\(item => item\.id === detail\.id\) \? prev : \[detail, \.\.\.prev\]\)/,
  'CiDiagnostics must hydrate diagnosticId source deep links through the detail API when the target is absent from the current list page.'
)
requirePattern(
  ciDiagnostics,
  /const params = new URLSearchParams\(\{[\s\S]*?projectId: String\(item\.projectId\),[\s\S]*?repositoryId: String\(item\.repositoryId\),[\s\S]*?source: `ci-diagnostic-\$\{item\.id\}`,[\s\S]*?openCreate: '1'/,
  'CiDiagnostics AutoRepair handoff URL must preserve projectId, repositoryId, source and openCreate.'
)
requirePattern(
  css,
  /\.sl-selectable-table-card \.ant-table-row\s*\{[^}]*cursor:\s*pointer;[\s\S]*?\.sl-selectable-table-card \.ant-table-row:focus-visible > td\s*\{[^}]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.64\);[\s\S]*?\.sl-selectable-table-card \.ant-table-row\[aria-selected='true'\] > td/s,
  'CiDiagnostics table must inherit pointer, keyboard focus and aria-selected row styling from the shared selectable table card utility.'
)
requirePattern(
  css,
  /\.sl-ci-repair-readiness\s*\{[\s\S]*?\.sl-ci-repair-readiness-ready\s*\{[\s\S]*?\.sl-ci-repair-readiness-warning\s*\{/s,
  'CiDiagnostics repair readiness card must have explicit ready and warning states.'
)
requirePattern(
  css,
  /\.sl-ci-table-card,\s*\.sl-ci-detail-card\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?\.sl-ci-table-card \.ant-card-body,[\s\S]*?\.sl-ci-diagnostics-table,[\s\S]*?\.sl-ci-table-card \.ant-table-container\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-ci-table-card \.ant-table-content\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*auto;/s,
  'CiDiagnostics table must keep horizontal overflow owned by the table scroller.'
)
requirePattern(
  prReviews,
  /import type \{ ReactNode \} from 'react'[\s\S]*?import \{ createSelectableTableRowProps \} from '\.\.\/components\/ui\/selectableTableRow'/,
  'PrReviews detail selection must use the shared selectable table row helper instead of local keyboard handling.'
)
requirePattern(
  prReviews,
  /const handleSelect = useCallback\(\(item: PrReview\) => \{[\s\S]*?setSelected\(item\)[\s\S]*?setComments\(\[\]\)[\s\S]*?item\.status === 'COMPLETED'[\s\S]*?fetchComments\(item\.id\)[\s\S]*?\}, \[fetchComments\]\)/,
  'PrReviews selection must centralize selected review changes and clear stale comments before loading completed review comments.'
)
rejectPattern(
  prReviews,
  /handleReviewRowKeyDown|KeyboardEvent<HTMLElement>/,
  'PrReviews must not keep page-local row keyboard handlers after adopting the shared selectable table row helper.'
)
requirePattern(
  prReviews,
  /<ActionButton[\s\S]*?type="link"[\s\S]*?className="sl-pr-table-link"[\s\S]*?onClick=\{\(event\) => \{[\s\S]*?event\.stopPropagation\(\)[\s\S]*?handleSelect\(record\)[\s\S]*?\}\}[\s\S]*?label=\{record\.prTitle \|\| `PR #\$\{record\.prNumber \|\| record\.id\}`\}[\s\S]*?\/>/,
  'PrReviews PR title table link must use ActionButton and must not bubble into row selection.'
)
requirePattern(
  prReviews,
  /<IconActionButton[\s\S]*?label=\{`重新分析 PR 审查 #\$\{record\.id\}`\}[\s\S]*?tooltip="重新分析"[\s\S]*?icon=\{<ReloadOutlined\s+\/>\}[\s\S]*?handleReanalyze\(record\.id\)[\s\S]*?\/>/,
  'PrReviews table reanalyze action must use IconActionButton.'
)
requirePattern(
  prReviews,
  /<Card className="sl-section-card sl-pr-table-card sl-selectable-table-card"[\s\S]*?onRow=\{\(record\) => createSelectableTableRowProps\(\{[\s\S]*?record,[\s\S]*?selected: selected\?\.id === record\.id,[\s\S]*?onSelect: handleSelect,[\s\S]*?controlsId: selectedDetailId,[\s\S]*?label: `PrReview #\$\{record\.id\}/,
  'PrReviews table rows must use the shared selectable row helper with selected state, aria-controls and stable row labels.'
)
requirePattern(
  prReviews,
  /<Card[\s\S]*?id=\{selectedDetailId\}[\s\S]*?role="region"[\s\S]*?aria-labelledby=\{selectedTitleId\}[\s\S]*?className="sl-section-card sl-pr-detail-card"[\s\S]*?<span className="sl-card-title" id=\{selectedTitleId\}/,
  'PrReviews detail card must expose a labelled region connected from the selected row.'
)
requirePattern(
  prReviews,
  /const repairReadiness = selected \? buildReviewRepairReadiness\(selected, selectedRisks, comments, selectedChangedFiles\) : null[\s\S]*?<ReviewRepairReadinessCard readiness=\{repairReadiness\} \/>[\s\S]*?function buildReviewRepairReadiness\(review: PrReview, risks: ReviewRisk\[\], comments: PrReviewComment\[\], changedFiles: string\[\]\)/,
  'PrReviews detail must explain AutoRepair candidate readiness instead of hiding why the action is unavailable.'
)
requirePattern(
  prReviews,
  /interface PrGovernanceStep[\s\S]*?key:\s*'pr-intake' \| 'risk-decision' \| 'merge-gate' \| 'repair-handoff'[\s\S]*?const governanceLoopSteps = useMemo<PrGovernanceStep\[\]>\(\(\) => \[[\s\S]*?<PrGovernanceLoop steps=\{governanceLoopSteps\} \/>[\s\S]*?function PrGovernanceLoop[\s\S]*?aria-label="PR 审查治理闭环"[\s\S]*?data-sl-pr-governance-step=\{step\.key\}/,
  'PrReviews must render a page-level PR intake, risk decision, merge gate and AutoRepair handoff governance loop.'
)
requirePattern(
  prReviews,
  /PR 审查完成不等于代码质量、业务正确性或安全性已被完全证明[\s\S]*?合并前仍需确认测试、部署窗口和人工 review[\s\S]*?后续仍需补丁审查、CI、人工 review 和审计复盘/,
  'PrReviews governance loop must avoid overclaiming PR review quality, merge safety or repair correctness.'
)
requirePattern(
  prReviews,
  /projectId:\s*String\(review\.projectId\)[\s\S]*?repositoryId:\s*String\(review\.repositoryId\)[\s\S]*?source:\s*`pr-review-\$\{review\.id\}`/,
  'PrReviews AutoRepair candidate URL must preserve projectId, repositoryId and source binding.'
)
requirePattern(
  css,
  /\.sl-pr-table-card \.ant-table-row\s*\{[^}]*cursor:\s*pointer;[\s\S]*?\.sl-pr-table-card \.ant-table-row:focus-visible > td\s*\{[^}]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.64\);[\s\S]*?\.sl-pr-table-card \.ant-table-row\[aria-selected='true'\] > td/s,
  'PrReviews table must style pointer, keyboard focus and aria-selected rows.'
)
requirePattern(
  css,
  /\.sl-pr-repair-readiness\s*\{[\s\S]*?\.sl-pr-repair-readiness-ready\s*\{[\s\S]*?\.sl-pr-repair-readiness-warning\s*\{/s,
  'PrReviews repair readiness card must have explicit ready and warning states.'
)
requirePattern(
  css,
  /\.sl-pr-governance-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s,
  'PR reviews governance loop must use a stable four-column desktop grid.'
)
requirePattern(
  css,
  /@media \(max-width: 1200px\)[\s\S]*?\.sl-pr-summary-grid,\s*\.sl-pr-governance-grid,[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  'PR reviews governance loop must collapse to two columns below 1200px.'
)
requirePattern(
  css,
  /@media \(max-width: 720px\)[\s\S]*?\.sl-pr-summary-grid,\s*\.sl-pr-governance-grid,[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\.sl-pr-governance-step \.ant-btn\s*\{[\s\S]*?width:\s*100%;[\s\S]*?justify-content:\s*center;/s,
  'PR reviews governance loop must collapse to one column with a full-width handoff action on mobile.'
)
requirePattern(
  css,
  /\.sl-pr-governance-meta span,\s*\.sl-pr-governance-meta strong,\s*\.sl-pr-governance-copy h3,\s*\.sl-pr-governance-copy p\s*\{[^}]*overflow:\s*visible;[^}]*overflow-wrap:\s*anywhere;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;[^}]*word-break:\s*break-word;/s,
  'PR reviews governance loop labels, statuses and evidence details must wrap without clipping.'
)
requirePattern(
  css,
  /\.sl-pr-table-card,[\s\S]*?\.sl-pr-detail-card\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-pr-table-card \.ant-card-body,[\s\S]*?\.sl-pr-table-card \.ant-table-container\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-pr-table-card \.ant-table-content\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*auto;/s,
  'PrReviews table card must keep horizontal overflow owned by the internal table scroller.'
)
requirePattern(
  css,
  /\.sl-pr-detail-card \.ant-card-head,[\s\S]*?\.sl-pr-detail-card \.ant-space-item\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-pr-detail-card \.ant-card-extra \.ant-space\s*\{[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?\.sl-pr-decision-check strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;[\s\S]*?\.sl-pr-next-action span,[\s\S]*?\.sl-pr-detail-card \.ant-descriptions-item-label\s*\{[\s\S]*?overflow-wrap:\s*anywhere;/s,
  'PrReviews detail card must wrap long paths, decisions, tags and action text instead of clipping them.'
)

for (const [name, source] of [
  ['CiDiagnostics', ciDiagnostics],
  ['PrReviews', prReviews],
]) {
  requirePattern(
    source,
    /<ActionButton\s+icon=\{<ReloadOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*fetchItems\(true\)\}\s+label="刷新"\s*\/>/,
    `${name} refresh action must use ActionButton.`
  )
  requirePattern(
    source,
    /<ActionButton\s+type="primary"\s+icon=\{<PlusOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*setShowCreate\(true\)\}\s+label="新建(?:诊断|审查)"\s*\/>/,
    `${name} create action must use ActionButton.`
  )
  requirePattern(
    source,
    /<ActionButton\s+size="small"\s+type="primary"\s+icon=\{<ToolOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*navigate\(repairUrl\)\}\s+label="生成修复候选"\s*\/>/,
    `${name} repair candidate action must use ActionButton.`
  )
  requirePattern(
    source,
    /<ActionButton\s+size="small"\s+onClick=\{\(\)\s*=>\s*setSelected\(null\)\}\s+label="关闭"\s*\/>/,
    `${name} detail close action must use ActionButton.`
  )
}

requirePattern(
  issueDecomposition,
  /<ActionButton[\s\S]*?type="link"[\s\S]*?className="sl-issue-table-link"[\s\S]*?handleSelect\(record\)[\s\S]*?label=\{title\}[\s\S]*?\/>/,
  'IssueDecomposition issue title table link must use ActionButton.'
)
requirePattern(
  issueDecomposition,
  /import type \{ ReactNode \} from 'react'[\s\S]*?import \{ createSelectableTableRowProps \} from '\.\.\/components\/ui\/selectableTableRow'/,
  'IssueDecomposition detail selection must use the shared selectable table row helper instead of local keyboard handling.'
)
requirePattern(
  issueDecomposition,
  /const handleSelect = useCallback\(\(item: IssueDecomposition\) => \{[\s\S]*?setSelected\(item\)[\s\S]*?setTasks\(\[\]\)[\s\S]*?\}, \[\]\)/,
  'IssueDecomposition selection must clear stale tasks before loading completed issue tasks.'
)
rejectPattern(
  issueDecomposition,
  /handleIssueRowKeyDown|KeyboardEvent<HTMLElement>/,
  'IssueDecomposition must not keep page-local row keyboard handlers after adopting the shared selectable table row helper.'
)
requirePattern(
  issueDecomposition,
  /<Card className="sl-issue-table-card sl-selectable-table-card"[\s\S]*?<Table[\s\S]*?className="sl-issue-main-table"[\s\S]*?onRow=\{record => createSelectableTableRowProps\(\{[\s\S]*?record,[\s\S]*?selected: selected\?\.id === record\.id,[\s\S]*?onSelect: handleSelect,[\s\S]*?controlsId: selectedDetailId,[\s\S]*?label: `IssueDecomposition #\$\{record\.id\}/,
  'IssueDecomposition table rows must use the shared selectable row helper with selected state, aria-controls and stable row labels.'
)
requirePattern(
  issueDecomposition,
  /<Table[\s\S]*?className="sl-issue-task-table"[\s\S]*?dataSource=\{tasks\}[\s\S]*?columns=\{taskColumns\}[\s\S]*?scroll=\{\{ x: 820 \}\}/,
  'IssueDecomposition task table must expose a stable class and own horizontal scroll contract.'
)
requirePattern(
  issueDecomposition,
  /<Card[\s\S]*?id=\{selectedDetailId\}[\s\S]*?role="region"[\s\S]*?aria-labelledby=\{selectedTitleId\}[\s\S]*?className="sl-issue-detail-card"[\s\S]*?<Space wrap id=\{selectedTitleId\}>/,
  'IssueDecomposition detail card must expose a labelled region connected from the selected row.'
)
requirePattern(
  issueDecomposition,
  /<IconActionButton[\s\S]*?tooltip="复制 Markdown"[\s\S]*?icon=\{<CopyOutlined\s+\/>\}[\s\S]*?handleCopyMarkdown\(record\.id\)[\s\S]*?\/>/,
  'IssueDecomposition table copy action must use IconActionButton.'
)
requirePattern(
  issueDecomposition,
  /<IconActionButton[\s\S]*?tooltip="导出 Markdown"[\s\S]*?icon=\{<ExportOutlined\s+\/>\}[\s\S]*?handleExport\(record\.id\)[\s\S]*?\/>/,
  'IssueDecomposition table export action must use IconActionButton.'
)
requirePattern(
  issueDecomposition,
  /<ActionButton\s+icon=\{<ReloadOutlined\s+\/>\}\s+onClick=\{fetchItems\}\s+loading=\{loading\}\s+label="刷新"\s*\/>/,
  'IssueDecomposition refresh action must use ActionButton.'
)
requirePattern(
  issueDecomposition,
  /<ActionButton\s+type="primary"\s+icon=\{<PlusOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*setShowCreate\(true\)\}\s+label="新建拆解"\s*\/>/,
  'IssueDecomposition create action must use ActionButton.'
)
requirePattern(
  issueDecomposition,
  /extra=\{<ActionButton\s+size="small"\s+onClick=\{handleCloseDetail\}\s+label="关闭"\s*\/>\}/,
  'IssueDecomposition detail close action must use ActionButton and invalidate stale task requests.'
)
requirePattern(
  issueDecomposition,
  /<ActionButton\s+size="small"\s+icon=\{<CopyOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*handleCopyMarkdown\(selected\.id\)\}\s+label="复制 Markdown"\s*\/>/,
  'IssueDecomposition detail copy action must use ActionButton.'
)
requirePattern(
  issueDecomposition,
  /<ActionButton\s+size="small"\s+icon=\{<ExportOutlined\s+\/>\}\s+onClick=\{\(\)\s*=>\s*handleExport\(selected\.id\)\}\s+label="导出 \.md"\s*\/>/,
  'IssueDecomposition detail export action must use ActionButton.'
)
requirePattern(
  issueDecomposition,
  /import \{ redactJsonOrText,\s*redactSensitiveText \} from '\.\.\/utils\/displayRedaction'/,
  'IssueDecomposition must use the shared displayRedaction utility for raw result and Markdown display redaction.'
)
requirePattern(
  issueDecomposition,
  /function formatJsonPreview\(value: string \| null \| undefined\)[\s\S]*?return redactJsonOrText\(value, '无数据'\)/s,
  'IssueDecomposition raw result preview must render redacted JSON or redacted plain text.'
)
requirePattern(
  issueDecomposition,
  /function redactIssuePlanningText\(value: string\)[\s\S]*?return redactSensitiveText\(value\)/s,
  'IssueDecomposition Markdown display redaction must use the shared text redaction helper.'
)
requirePattern(
  issueDecomposition,
  /function sanitizeIssueMarkdownExport\(value: string \| null \| undefined\)[\s\S]*?return redactIssuePlanningText\(value \|\| ''\)[\s\S]*?new Blob\(\[sanitizeIssueMarkdownExport\(res\.data\.data\)\][\s\S]*?navigator\.clipboard\.writeText\(sanitizeIssueMarkdownExport\(res\.data\.data\)\)/s,
  'IssueDecomposition copy/export Markdown must pass through the same display redaction boundary.'
)
requirePattern(
  issueDecomposition,
  /<pre className="sl-issue-source-preview sl-issue-source-preview-redacted" aria-label="脱敏 Issue 拆解原始结果">\{formatJsonPreview\(selected\.outputJson\)\}<\/pre>/,
  'IssueDecomposition raw result preview must expose a labelled redacted preview region.'
)
requirePattern(
  issueDecomposition,
  /type IssueGovernanceStep = \{[\s\S]*?stage:\s*string[\s\S]*?tone:\s*SignalTone[\s\S]*?icon:\s*ReactNode[\s\S]*?function buildIssueGovernanceSteps\([\s\S]*?selected: IssueDecomposition \| null[\s\S]*?acceptanceCount: number[\s\S]*?riskCount: number[\s\S]*?dependencyCount: number[\s\S]*?impactCount: number[\s\S]*?relatedModuleCount: number[\s\S]*?\): IssueGovernanceStep\[\]/,
  'IssueDecomposition must derive a typed four-stage governance loop from the selected issue, tasks, acceptance, risk, dependency and impact evidence.'
)
requirePattern(
  issueDecomposition,
  /key:\s*'input'[\s\S]*?title: hasInputContext \? '需求输入可复述'[\s\S]*?key:\s*'breakdown'[\s\S]*?title: failed \? '拆解失败阻断'[\s\S]*?key:\s*'acceptance'[\s\S]*?title: hasAcceptanceGate \? '验收门禁已建立'[\s\S]*?key:\s*'handoff'[\s\S]*?title: hasExecutionHandoff \? '执行交接可追踪'/,
  'IssueDecomposition governance loop must cover input, breakdown, acceptance gate and execution handoff stages.'
)
requirePattern(
  issueDecomposition,
  /拆解完成不等于实现完成，仍需测试、CI、PR 审查和审计复盘/,
  'IssueDecomposition governance copy must state that decomposition completion is not implementation completion.'
)
requirePattern(
  issueDecomposition,
  /<section className="sl-issue-governance-loop" aria-label="Issue 拆解治理闭环">[\s\S]*?DEVELOPER CONTROL PLANE[\s\S]*?Issue 拆解治理闭环[\s\S]*?拆解结果只能作为开发计划证据[\s\S]*?不能证明实现、测试、CI、PR 或 LLM 判断已经正确[\s\S]*?data-sl-issue-governance-step=\{step\.key\}/,
  'IssueDecomposition must render the developer-control-plane governance loop with explicit no-overclaim boundary copy and stable step markers.'
)
requirePattern(
  issueDecomposition,
  /const selectedTaskRequestRef = useRef\(0\)[\s\S]*?const fetchTasks = useCallback\(\(id: number\) => \{[\s\S]*?const requestId = \+\+selectedTaskRequestRef\.current[\s\S]*?issueApi\.listTasks\(id\)[\s\S]*?if \(selectedTaskRequestRef\.current !== requestId\) return[\s\S]*?setTasks\(res\.data\.data \|\| \[\]\)[\s\S]*?catch\(error => \{[\s\S]*?if \(selectedTaskRequestRef\.current !== requestId\) return[\s\S]*?showApiError\(error, '加载子任务失败'\)[\s\S]*?finally\(\(\) => \{[\s\S]*?if \(selectedTaskRequestRef\.current !== requestId\) return[\s\S]*?setTasksLoading\(false\)/,
  'IssueDecomposition must reject stale task responses, stale task errors and stale task loading updates when selected issue changes.'
)
requirePattern(
  issueDecomposition,
  /const handleSelect = useCallback\(\(item: IssueDecomposition\) => \{[\s\S]*?selectedTaskRequestRef\.current \+= 1[\s\S]*?setSelected\(item\)[\s\S]*?setTasks\(\[\]\)[\s\S]*?setTasksLoading\(false\)[\s\S]*?const handleCloseDetail = useCallback\(\(\) => \{[\s\S]*?selectedTaskRequestRef\.current \+= 1[\s\S]*?setSelected\(null\)[\s\S]*?setTasks\(\[\]\)[\s\S]*?setTasksLoading\(false\)[\s\S]*?selected\.status === 'COMPLETED'[\s\S]*?fetchTasks\(selected\.id\)[\s\S]*?selectedTaskRequestRef\.current \+= 1[\s\S]*?setTasks\(\[\]\)[\s\S]*?setTasksLoading\(false\)/,
  'IssueDecomposition must invalidate in-flight task requests on selection, close and non-completed issue states.'
)
rejectPattern(
  issueDecomposition,
  /<pre className="sl-issue-source-preview">\{formatJsonPreview\(selected\.outputJson\)\}<\/pre>/,
  'IssueDecomposition must not render raw outputJson through the old unlabelled source preview.'
)
rejectPattern(
  ciDiagnostics,
  /<Button\b/,
  'CiDiagnostics must not reintroduce raw Ant Design Button for diagnostic actions.'
)
rejectPattern(
  prReviews,
  /<Button\b/,
  'PrReviews must not reintroduce raw Ant Design Button for review actions.'
)
rejectPattern(
  issueDecomposition,
  /<Button\b/,
  'IssueDecomposition must not reintroduce raw Ant Design Button for planning actions.'
)
requirePattern(
  css,
  /\.sl-issue-table-card \.ant-table-row\s*\{[^}]*cursor:\s*pointer;[\s\S]*?\.sl-issue-table-card \.ant-table-row:focus-visible > td\s*\{[^}]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.64\);[\s\S]*?\.sl-issue-table-card \.ant-table-row\[aria-selected='true'\] > td/s,
  'IssueDecomposition table must style pointer, keyboard focus and aria-selected rows.'
)
requirePattern(
  css,
  /\.sl-issue-table-card,\s*\.sl-issue-detail-card\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?\.sl-issue-table-card \.ant-card-body,[\s\S]*?\.sl-issue-detail-card \.ant-card-body,[\s\S]*?\.sl-issue-main-table,[\s\S]*?\.sl-issue-task-table,[\s\S]*?\.sl-issue-table-card \.ant-table-container,[\s\S]*?\.sl-issue-detail-card \.ant-table-container\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-issue-table-card \.ant-table-content,[\s\S]*?\.sl-issue-task-table \.ant-table-content\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*auto;/s,
  'IssueDecomposition main and task tables must keep horizontal overflow owned by table scrollers.'
)
requirePattern(
  css,
  /\.sl-issue-governance-loop\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.sl-issue-governance-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-issue-governance-step\s*\{[\s\S]*?min-height:\s*218px;[\s\S]*?\.sl-issue-governance-step-ready[\s\S]*?\.sl-issue-governance-step-warning[\s\S]*?\.sl-issue-governance-step-danger/s,
  'IssueDecomposition governance loop must define a four-column desktop grid with ready/warning/danger states.'
)
requirePattern(
  css,
  /\.sl-issue-governance-head h2,[\s\S]*?\.sl-issue-governance-copy p\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;/s,
  'IssueDecomposition governance text must wrap instead of clipping or using ellipsis.'
)
requirePattern(
  css,
  /@media\s*\(max-width:\s*1200px\)\s*\{[\s\S]*?\.sl-issue-governance-grid,[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.sl-issue-governance-grid,[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\.sl-issue-governance-head\s*\{[\s\S]*?flex-direction:\s*column;/s,
  'IssueDecomposition governance loop must degrade from 4 columns to 2 columns at tablet and 1 column on mobile.'
)

requirePattern(
  scanTaskDetail,
  /function projectQaDeepLink\(projectId:\s*number,\s*question\?:\s*string\s*\|\s*null,\s*scanTaskId\?:\s*number\s*\|\s*null\)/,
  'Scan report pages must keep absolute project QA deep-link generation.'
)
requirePattern(
  scanTaskDetail,
  /const copyReportQaDeepLink\s*=\s*async\s*\(question\?:\s*string\s*\|\s*null\)/,
  'Scan report pages must keep copyable QA deep links bound to the current scanTaskId.'
)
requirePattern(
  scanTaskDetail,
  /手动复制报告问答深链/,
  'Scan report pages must keep manual-copy fallback for report QA deep links.'
)
requirePattern(
  scanTaskDetail,
  /const copyAutoRepairDeepLink\s*=\s*async\s*\(risk:\s*any\)/,
  'Scan report pages must expose copyable auto-repair candidate links.'
)
requirePattern(
  scanTaskDetail,
  /手动复制修复候选深链/,
  'Scan report pages must keep manual-copy fallback for auto-repair candidate links.'
)
requirePattern(
  scanTaskDetail,
  /function autoRepairCandidateUrl\(projectId:\s*number,\s*repositoryId:\s*number,\s*scanTaskId:\s*number,\s*risk:\s*any\)[\s\S]*?params\.set\('scanTaskId',\s*String\(scanTaskId\)\)[\s\S]*?params\.set\('source',\s*`扫描报告 #\$\{scanTaskId\}`\)[\s\S]*?params\.set\('targetDesc',\s*buildRiskRepairTarget\(scanTaskId,\s*risk\)\)/,
  'Scan report auto-repair links must carry scanTaskId, source and targetDesc context.'
)
requirePattern(
  scanTaskDetail,
  /function autoRepairCandidateDeepLink\(projectId:\s*number,\s*repositoryId:\s*number,\s*scanTaskId:\s*number,\s*risk:\s*any\)[\s\S]*?window\.location\.origin[\s\S]*?autoRepairCandidateUrl\(projectId,\s*repositoryId,\s*scanTaskId,\s*risk\)/,
  'Scan report auto-repair links must support absolute deep-link copying.'
)
requirePattern(
  scanTaskDetail,
  /const canStartRepairFlow\s*=\s*repositoryId > 0 && \(Boolean\(firstRepairableRisk\) \|\| risks\.length > 0\)/,
  'Scan report action board must allow project-level risks to continue into file localization instead of dead-ending.'
)
requirePattern(
  scanTaskDetail,
  /const openRepairFlow\s*=\s*\(\)\s*=>\s*\{[\s\S]*?firstRepairableRisk[\s\S]*?autoRepairCandidateUrl\(projectId,\s*repositoryId,\s*scanTaskId,\s*firstRepairableRisk\)[\s\S]*?projectQaUrl\(projectId,\s*repairCandidateQuestion,\s*scanTaskId\)/,
  'Scan report repair flow must route file-level risks to AutoRepair and project-level risks to scan-bound QA localization.'
)
requirePattern(
  scanTaskDetail,
  /function buildRiskFileLocalizationQuestion\(scanTaskId:\s*number,\s*risks:\s*any\[\]\)[\s\S]*?不适合直接生成单文件 patch/,
  'Scan report project-level risks must generate a QA question that asks for concrete repairable files and single-file patch suitability.'
)
requirePattern(
  scanTaskDetail,
  /key:\s*'repair-candidate'[\s\S]*?label:\s*'修复候选'[\s\S]*?actionLabel:\s*firstRepairableRisk \? '生成候选' : risks\.length > 0 \? '定位文件' : '无需修复'[\s\S]*?onClick:\s*openRepairFlow[\s\S]*?onCopyLink:\s*canStartRepairFlow \? copyRepairFlowLink : undefined/,
  'Scan report action board must expose AutoRepair candidates when file-bound and QA localization when risks are project-level.'
)
requirePattern(
  scanTaskDetail,
  /const recommendedNextStep:\s*ReportRecommendedStep[\s\S]*?key:\s*'repair-high-risk-file'[\s\S]*?key:\s*'locate-project-risk'[\s\S]*?key:\s*'complete-evidence-bundle'[\s\S]*?key:\s*'inspect-code-chunks'[\s\S]*?key:\s*'qa-review-ready-report'/,
  'Scan report summary must derive one recommended next step from file-bound risk, project-level risk, evidence gap, code_chunks gap and ready-review states.'
)
requirePattern(
  scanTaskDetail,
  /interface ReportRecommendedStep[\s\S]*?actionGateReason:\s*string[\s\S]*?function ReportRecommendedNextStep\([\s\S]*?const gateReady = !primaryBlocked && !secondaryBlocked[\s\S]*?const gateTitle = gateReady \? '推荐动作门禁已开放' : '推荐动作门禁未开放'[\s\S]*?aria-label="报告推荐下一步"[\s\S]*?data-recommended-step=\{item\.key\}[\s\S]*?type="primary"[\s\S]*?item\.primaryLabel[\s\S]*?item\.secondaryLabel[\s\S]*?role="note"[\s\S]*?aria-label="报告推荐动作门禁说明"[\s\S]*?\{gateTitle\}[\s\S]*?\{gateReason\}/,
  'Scan report recommended next step must expose a stable aria region, CTAs and a visible action gate reason.'
)
requirePattern(
  scanTaskDetail,
  /actionGateReason:\s*'失败扫描不能直接进入 QA、修复或治理结论[\s\S]*?actionGateReason:\s*'扫描未完成时报告和 code_chunks 仍可能变化[\s\S]*?actionGateReason:\s*'文件级高风险已绑定当前扫描证据[\s\S]*?actionGateReason:\s*'项目级风险没有文件级修复证据[\s\S]*?actionGateReason:\s*'核心报告产物缺失时[\s\S]*?actionGateReason:\s*'code_chunks 不可用时[\s\S]*?actionGateReason:\s*'文件级风险证据已绑定当前扫描[\s\S]*?actionGateReason:\s*'报告和 code_chunks 已具备可追溯基础/,
  'Scan report recommended next step must provide branch-specific action gate reasons for failed, running, repair, localization, evidence, code_chunks and QA-ready states.'
)
requirePattern(
  scanTaskDetail,
  /interface ReportMainPathStep[\s\S]*?index:\s*string[\s\S]*?const reportMainPathSteps:\s*ReportMainPathStep\[\]\s*=\s*\[[\s\S]*?key:\s*'recommended-action'[\s\S]*?key:\s*'citation-quality'[\s\S]*?key:\s*'evidence-priority'/,
  'Scan report summary must derive a stable three-step main path guide for recommended action, citation quality and evidence priority.'
)
requirePattern(
  scanTaskDetail,
  /function ReportMainPathGuide\([\s\S]*?aria-label="报告主链路导览"[\s\S]*?按这个顺序推进报告复核[\s\S]*?data-main-path-step=\{step\.key\}/,
  'Scan report main path guide must expose a stable aria region and step keys.'
)
requirePattern(
  scanTaskDetail,
  /interface ReportEvidencePriorityItem[\s\S]*?const priorityEvidenceItems:\s*ReportEvidencePriorityItem\[\][\s\S]*?key:\s*'risk-evidence'[\s\S]*?key:\s*'citation-readiness'[\s\S]*?key:\s*'governance-blocker'[\s\S]*?<ReportRecommendedNextStep item=\{recommendedNextStep\} \/>[\s\S]*?<ReportMainPathGuide steps=\{reportMainPathSteps\} \/>[\s\S]*?<ReportEvidencePriorityRail items=\{priorityEvidenceItems\} \/>[\s\S]*?<ReportReviewGate items=\{reportReviewGateItems\} \/>/,
  'Scan report summary must render the main path guide after the recommended next step and before the evidence priority rail.'
)
requirePattern(
  scanTaskDetail,
  /interface ReportEvidencePriorityItem[\s\S]*?repairGateReason:\s*string[\s\S]*?function ReportEvidencePriorityRail\([\s\S]*?aria-label="报告证据优先阅读"[\s\S]*?data-priority-key=\{item\.key\}[\s\S]*?item\.actionLabel[\s\S]*?item\.repairActionVisible[\s\S]*?可进入修复候选[\s\S]*?不直接生成修复[\s\S]*?role="note"[\s\S]*?修复门禁已开放[\s\S]*?修复门禁未开放[\s\S]*?\{item\.repairGateReason\}/,
  'Scan report evidence priority rail must expose stable cards, actionable CTAs, repair/non-repair labels and visible repair gate reasons.'
)
requirePattern(
  scanTaskDetail,
  /label="复制修复链接"/,
  'Scan report risk list must expose per-risk auto-repair deep-link copying.'
)
requirePattern(
  scanTaskDetail,
  /const riskActions\s*=\s*\(risk:\s*any,\s*index:\s*number\)\s*=>\s*\{[\s\S]*?label="查看证据"[\s\S]*?autoRepairCandidateUrl\(projectId,\s*repositoryId,\s*scanTaskId,\s*risk\)[\s\S]*?label="生成修复候选"/,
  'Scan report file-bound risks must open AutoRepair candidate links with projectId, repositoryId, scanTaskId and risk context.'
)
requirePattern(
  scanTaskDetail,
  /function ReportEvidenceDrawer\([\s\S]*?className="sl-report-evidence-drawer"[\s\S]*?title="报告证据抽屉"[\s\S]*?<ReportEvidenceActionRail[\s\S]*?readiness=\{citationReadiness\}[\s\S]*?onOpenQa=\{onOpenQa\}[\s\S]*?onCopyReference=\{onCopyReference\}[\s\S]*?onOpenRepair=\{onOpenRepair\}/,
  'Scan report evidence drawer must expose state-driven next actions bound to scan QA, reference copy and repair/localization callbacks.'
)
requirePattern(
  scanTaskDetail,
  /function ReportEvidenceHandoffSummary\([\s\S]*?chunkResult: CodeChunkSearchResponse \| null[\s\S]*?const primary = chunkResult\?\.items\.find\(item => item\.contextRole === 'PRIMARY'\)[\s\S]*?aria-label="报告证据交接包"[\s\S]*?Scan #\{displayScanTaskId\}[\s\S]*?目标文件[\s\S]*?行号[\s\S]*?Hits[\s\S]*?可信度[\s\S]*?当前动作含义/,
  'Scan report evidence drawer must render a compact evidence handoff summary with scan, target file, line, hits, confidence and PRIMARY evidence status.'
)
requirePattern(
  scanTaskDetail,
  /<ReportEvidenceHandoffSummary[\s\S]*?evidence=\{evidence\}[\s\S]*?readiness=\{citationReadiness\}[\s\S]*?chunkResult=\{chunkResult\}[\s\S]*?chunkLoading=\{chunkLoading\}[\s\S]*?scanTaskId=\{scanTaskId\}/,
  'Scan report evidence drawer must mount the handoff summary beside citation readiness and action rail using the current drawer evidence context.'
)
requirePattern(
  scanTaskDetail,
  /width="min\(560px,\s*92vw\)"/,
  'Scan report evidence drawer must use viewport-constrained width on narrow screens.'
)
requirePattern(
  scanTaskDetail,
  /function redactReportEvidenceText\(value\?: string \| null\): string[\s\S]*?return redactSensitiveText\(value \|\| ''\)[\s\S]*?function redactedReportEvidenceForOutput\(evidence: ReportEvidenceDrawerData\): ReportEvidenceDrawerData[\s\S]*?title: redactReportEvidenceText\(evidence\.title\)[\s\S]*?summary: redactReportEvidenceText\(evidence\.summary\)[\s\S]*?qaQuestion: redactReportEvidenceText\(evidence\.qaQuestion\)[\s\S]*?fields: evidence\.fields\.map/,
  'Scan report evidence drawer must have a shared redaction helper for report-derived title, summary, question and fields.'
)
requirePattern(
  scanTaskDetail,
  /质量风险 \(\$\{risks\.length\}\)[\s\S]*?redactReportEvidenceText\(risk\.severity \|\| 'INFO'\)[\s\S]*?redactReportEvidenceText\(risk\.category \|\| '未分类'\)[\s\S]*?redactReportEvidenceText\(risk\.message \|\| risk\.detail \|\| '未提供描述'\)[\s\S]*?redactReportEvidenceText\(riskFilePath\(risk\)\)[\s\S]*?redactReportEvidenceText\(debt\.detail \|\| '未提供描述'\)[\s\S]*?redactReportEvidenceText\(item\)/,
  'Scan report quality risk, technical debt and suggestion lists must display report-derived text through the shared redaction helper.'
)
requirePattern(
  scanTaskDetail,
  /function buildRiskRepairTarget\(scanTaskId:\s*number,\s*risk:\s*any\)[\s\S]*?redactReportEvidenceText\(risk\?\.category \|\| '未分类'\)[\s\S]*?redactReportEvidenceText\(risk\?\.message \|\| risk\?\.detail \|\| '请根据报告风险项修复该文件。'\)[\s\S]*?redactReportEvidenceText\(suggestion\)[\s\S]*?function buildRiskFileLocalizationQuestion\(scanTaskId:\s*number,\s*risks:\s*any\[\]\)[\s\S]*?redactReportEvidenceText\(risk\?\.message \|\| risk\?\.detail \|\| '未提供描述'\)[\s\S]*?redactReportEvidenceText\(risk\.impact\)/,
  'Scan report risk-derived repair targets and QA localization questions must redact report-derived fields before handoff.'
)
requirePattern(
  scanTaskDetail,
  /function buildEvidenceReference\(scanTaskId:\s*number,\s*evidence:\s*ReportEvidenceDrawerData\)[\s\S]*?const safeEvidence = redactedReportEvidenceForOutput\(evidence\)[\s\S]*?scanTaskId:[\s\S]*?category: \$\{safeEvidence\.category\}[\s\S]*?source: \$\{safeEvidence\.source\}[\s\S]*?summary: \$\{safeEvidence\.summary\}[\s\S]*?question: \$\{safeEvidence\.qaQuestion\}/,
  'Scan report evidence drawer must copy a structured display-redacted evidence reference with scanTaskId, category, source, summary and question.'
)
requirePattern(
  scanTaskDetail,
  /function projectQaUrl\(projectId: number, question\?: string \| null, scanTaskId\?: number \| null, evidence\?: ReportEvidenceDrawerData \| null\)[\s\S]*?const safeQuestion = redactReportEvidenceText\(question \|\| ''\)[\s\S]*?params\.set\('question', safeQuestion\)[\s\S]*?const safeEvidence = redactedReportEvidenceForOutput\(evidence\)[\s\S]*?params\.set\('evidenceSummary', safeEvidence\.summary\)/,
  'Scan report evidence drawer must put only display-redacted question and evidence metadata into Project QA URLs.'
)
requirePattern(
  scanTaskDetail,
  /const displayEvidence = evidence \? redactedReportEvidenceForOutput\(evidence\) : null[\s\S]*?<strong>\{displayEvidence\.title\}<\/strong>[\s\S]*?<p>\{displayEvidence\.summary\}<\/p>[\s\S]*?displayEvidence\.fields\.map[\s\S]*?<pre className="sl-report-evidence-question-redacted" aria-label="脱敏报告证据问题">\{displayEvidence\.qaQuestion\}<\/pre>/,
  'Scan report evidence drawer must render display-redacted summary, fields and bound question.'
)
requirePattern(
  scanTaskDetail,
  /codeChunkApi\.search\(projectId,\s*\{\s*scanTaskId,[\s\S]*?query:\s*buildEvidenceChunkQuery\(activeEvidence\),[\s\S]*?limit:\s*3,[\s\S]*?\}\)/,
  'Scan report evidence drawer must lazily search code_chunks with scanTaskId, evidence query and limit 3.'
)
requirePattern(
  scanTaskDetail,
  /setEvidenceChunkResult\(null\)[\s\S]*?codeChunkApi\.search\(projectId,/,
  'Scan report evidence drawer must clear stale chunk results before loading the next evidence query.'
)
requirePattern(
  scanTaskDetail,
  /function buildEvidenceChunkQuery\(evidence:\s*ReportEvidenceDrawerData\)[\s\S]*?const safeEvidence = redactedReportEvidenceForOutput\(evidence\)[\s\S]*?safeEvidence\.fields[\s\S]*?fileAnchor[\s\S]*?reportEvidenceLineLabel\(safeEvidence\)[\s\S]*?safeEvidence\.summary[\s\S]*?slice\(0,\s*900\)/,
  'Scan report evidence chunk query must use display-redacted evidence, include filePath:line context and keep query length bounded.'
)
requirePattern(
  scanTaskDetail,
  /aria-label="code_chunks 命中摘要"[\s\S]*?chunkResult\?\.evidenceProfile\?\.confidence[\s\S]*?CodeChunkEvidenceCard/,
  'Scan report evidence drawer must render code_chunks summary with evidence profile confidence and chunk cards.'
)
requirePattern(
  scanTaskDetail,
  /interface ReportCitationReadiness[\s\S]*?function reportCitationReadiness\([\s\S]*?chunkResult: CodeChunkSearchResponse \| null[\s\S]*?sameReportEvidencePath[\s\S]*?lineOverlapsReportEvidence[\s\S]*?READY[\s\S]*?REVIEW[\s\S]*?GAP/,
  'Scan report evidence drawer must derive citation readiness from current code_chunks result and evidence anchors.'
)
requirePattern(
  scanTaskDetail,
  /function reportCitationReadiness\([\s\S]*?Readiness[\s\S]*?Hits[\s\S]*?Score/,
  'Scan report citation readiness must expose Readiness, Hits and Score metrics.'
)
requirePattern(
  scanTaskDetail,
  /function ReportCitationReadinessPanel\(\{ readiness \}: \{ readiness: ReportCitationReadiness \}\)[\s\S]*?aria-label="引用质量预检"[\s\S]*?引用质量预检[\s\S]*?READY[\s\S]*?REVIEW/,
  'Scan report evidence drawer must render a stable citation readiness preflight panel.'
)
requirePattern(
  scanTaskDetail,
  /interface ReportCitationQualitySummary[\s\S]*?function buildReportCitationQualitySummary\(reportQuality: any\)[\s\S]*?reportQuality\?\.reportCitationQuality[\s\S]*?providerQualityClaim[\s\S]*?llmFactClaim[\s\S]*?不证明 LLM 事实正确/,
  'Scan report summary must derive a user-readable report citation quality panel from reportQuality.reportCitationQuality without overclaiming provider or LLM fact quality.'
)
requirePattern(
  scanTaskDetail,
  /function ReportCitationQualityPanel\(\{ quality \}: \{ quality: ReportCitationQualitySummary \}\)[\s\S]*?aria-label="报告引用质量"[\s\S]*?Report Citation Quality[\s\S]*?sl-report-citation-quality-metrics[\s\S]*?aria-label="报告引用来源覆盖"[\s\S]*?Source coverage[\s\S]*?\{source\.section\} · \{source\.label\}[\s\S]*?sl-report-citation-quality-verdict[\s\S]*?aria-label="报告引用质量裁决依据"[\s\S]*?<details className="sl-report-citation-quality-details" aria-label="报告引用质量绑定明细">[\s\S]*?<summary>[\s\S]*?Binding details[\s\S]*?sl-report-citation-quality-grid[\s\S]*?边界[\s\S]*?Citation quality[\s\S]*?Source diversity[\s\S]*?Narrative binding/,
  'Scan report summary must render citation quality, source diversity, narrative binding, verdict basis and boundary copy as a page-level panel.'
)
requirePattern(
  scanTaskDetail,
  /REPORT_CITATION_SOURCE_SECTION_LABELS[\s\S]*?overview[\s\S]*?扫描范围[\s\S]*?modules[\s\S]*?模块图[\s\S]*?apiRoutes\/dbEntities[\s\S]*?API\/数据面[\s\S]*?scanFingerprint[\s\S]*?扫描指纹[\s\S]*?codeQuality\.risks[\s\S]*?风险信号[\s\S]*?REPORT_CITATION_SOURCE_SECTION_ORDER[\s\S]*?overview[\s\S]*?modules[\s\S]*?apiRoutes\/dbEntities[\s\S]*?scanFingerprint[\s\S]*?codeQuality\.risks[\s\S]*?compareReportCitationSourceSections[\s\S]*?sort\(compareReportCitationSourceSections\)/,
  'Scan report citation source coverage must map raw report sections to user-readable Chinese labels in report reading order.'
)
requirePattern(
  scanTaskDetail,
  /<ReportDecisionPanel signal=\{reportSignal\} \/>[\s\S]*?<ReportCitationQualityPanel quality=\{reportCitationQuality\} \/>[\s\S]*?<ReportRecommendedNextStep/,
  'Scan report citation quality panel must appear directly in the report summary flow after the decision panel.'
)
requirePattern(
  scanTaskDetail,
  /function ReportEvidenceDecisionSummary[\s\S]*?evidence: ReportEvidenceDrawerData[\s\S]*?readiness: ReportCitationReadiness[\s\S]*?chunkResult: CodeChunkSearchResponse \| null[\s\S]*?const canOpenRepair = Boolean\(evidence\.repairRisk && readiness\.status === 'READY'\)[\s\S]*?label: '引用状态'[\s\S]*?label: 'code_chunks'[\s\S]*?label: '修复动作'[\s\S]*?value: canOpenRepair \? '可生成候选' : '先复核证据'[\s\S]*?aria-label="报告证据决策摘要"/,
  'Scan report evidence drawer must render a three-part decision summary for citation status, code_chunks evidence and repair action without deriving a new release rule.'
)
requirePattern(
  scanTaskDetail,
  /<ReportCitationReadinessPanel readiness=\{citationReadiness\} \/>[\s\S]*?<ReportEvidenceDecisionSummary[\s\S]*?evidence=\{evidence\}[\s\S]*?readiness=\{citationReadiness\}[\s\S]*?chunkResult=\{chunkResult\}[\s\S]*?<ReportEvidenceHandoffSummary/,
  'Scan report evidence drawer must place the decision summary between citation readiness and the handoff summary.'
)
requirePattern(
  scanTaskDetail,
  /function ReportEvidenceActionRail\([\s\S]*?const canOpenRepair = Boolean\(evidence\.repairRisk && readiness\.status === 'READY'\)[\s\S]*?证据已就绪，先复核引用后进入修复[\s\S]*?先补证据，不直接生成修复候选[\s\S]*?aria-label="报告证据下一步动作"[\s\S]*?label="基于此证据追问"[\s\S]*?disabled=\{!canOpenRepair\}[\s\S]*?label=\{canOpenRepair \? '生成修复候选' : '定位修复文件'\}[\s\S]*?label="复制证据引用"/,
  'Scan report evidence drawer must translate READY/REVIEW/GAP citation readiness into a visible next-action rail and disable repair/localization when evidence is not READY.'
)
requirePattern(
  css,
  /\.sl-report-citation-readiness[\s\S]*?\.sl-report-citation-readiness-ready[\s\S]*?\.sl-report-citation-readiness-review[\s\S]*?\.sl-report-citation-readiness-gap[\s\S]*?\.sl-report-citation-readiness-metrics/,
  'Scan report citation readiness preflight must have dedicated readable styles.'
)
requirePattern(
  css,
  /\.sl-report-citation-quality[\s\S]*?\.sl-report-citation-quality-ready[\s\S]*?\.sl-report-citation-quality-review[\s\S]*?\.sl-report-citation-quality-gap[\s\S]*?\.sl-report-citation-quality-metrics[\s\S]*?\.sl-report-citation-quality-source-coverage[\s\S]*?\.sl-report-citation-quality-verdict[\s\S]*?\.sl-report-citation-quality-details[\s\S]*?\.sl-report-citation-quality-grid[\s\S]*?\.sl-report-citation-quality-footer/,
  'Scan report citation quality panel must have dedicated readable status, metric, source coverage, verdict, collapsible binding and boundary styles.'
)
requirePattern(
  css,
  /\.sl-report-evidence-decision-summary[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)[\s\S]*?\.sl-report-evidence-decision-item-ready[\s\S]*?\.sl-report-evidence-decision-item-warning,[\s\S]*?\.sl-report-evidence-decision-item-idle[\s\S]*?\.sl-report-evidence-decision-item-danger[\s\S]*?\.sl-report-evidence-decision-item small/,
  'Scan report evidence decision summary must have three-column responsive styles and ready/warning/danger item states.'
)
requirePattern(
  css,
  /\.sl-report-evidence-handoff-summary[\s\S]*?\.sl-report-evidence-handoff-summary-ready[\s\S]*?\.sl-report-evidence-handoff-summary-review[\s\S]*?\.sl-report-evidence-handoff-summary-gap[\s\S]*?\.sl-report-evidence-handoff-grid[\s\S]*?\.sl-report-evidence-handoff-action/,
  'Scan report evidence handoff summary must have dedicated compact responsive styles.'
)
requirePattern(
  css,
  /\.sl-report-evidence-action-rail[\s\S]*?\.sl-report-evidence-action-rail-ready[\s\S]*?\.sl-report-evidence-action-rail-review[\s\S]*?\.sl-report-evidence-action-rail-gap[\s\S]*?\.sl-report-evidence-action-rail-actions[\s\S]*?\.sl-report-evidence-action-rail-actions \.ant-btn[\s\S]*?\.sl-report-evidence-action-rail-guard[\s\S]*?\.sl-report-evidence-action-rail-guard-ready[\s\S]*?\.sl-report-evidence-action-rail-guard-blocked[\s\S]*?\.sl-report-evidence-action-rail-guard span[\s\S]*?\.sl-report-evidence-action-rail-guard strong/,
  'Scan report evidence action rail must have dedicated readable responsive styles with wrapped action buttons and visible repair gate reasons.'
)
requirePattern(
  css,
  /\.sl-report-evidence-item span\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*\}[\s\S]*?\.sl-report-evidence-item strong\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*\}[\s\S]*?\.sl-report-evidence-item p\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Scan report evidence profile cards must wrap labels, values and details without ellipsis or line clamp.'
)
requirePattern(
  css,
  /\.sl-report-trace-card-head span\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*\}[\s\S]*?\.sl-report-trace-card-head strong\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*\}[\s\S]*?\.sl-report-trace-source\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*\}[\s\S]*?\.sl-report-trace-card p\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Scan report trace cards must wrap labels, values, source names and details without ellipsis.'
)
requirePattern(
  css,
  /\.sl-report-table-evidence-text\s*\{[^}]*display:\s*block\s*;[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Scan report API and DB table evidence text must wrap without hidden overflow or ellipsis.'
)
requirePattern(
  scanTaskDetail,
  /title:\s*'路径'[\s\S]*?dataIndex:\s*'path'[\s\S]*?className:\s*'sl-report-api-path-cell'[\s\S]*?render:\s*\(value: string\) => <span className="sl-report-table-evidence-text">\{redactReportEvidenceText\(value \|\| '-'\)\}<\/span>/,
  'Scan report API path column must use a wrapped display-redacted evidence cell instead of business ellipsis.'
)
requirePattern(
  scanTaskDetail,
  /title:\s*'Controller'[\s\S]*?dataIndex:\s*'handler_class'[\s\S]*?className:\s*'sl-report-api-controller-cell'[\s\S]*?render:\s*\(value: string\) => <span className="sl-report-table-evidence-text">\{redactReportEvidenceText\(value \|\| '-'\)\}<\/span>/,
  'Scan report API Controller column must use a wrapped display-redacted evidence cell instead of business ellipsis.'
)
requirePattern(
  scanTaskDetail,
  /title:\s*'文件'[\s\S]*?dataIndex:\s*'file_path'[\s\S]*?className:\s*'sl-report-db-file-cell'[\s\S]*?render:\s*\(value: string\) => <span className="sl-report-table-evidence-text">\{redactReportEvidenceText\(value \|\| '-'\)\}<\/span>/,
  'Scan report DB file column must use a wrapped display-redacted evidence cell instead of business ellipsis.'
)
rejectPattern(
  scanTaskDetail,
  /title:\s*'路径'[\s\S]*?dataIndex:\s*'path'[\s\S]*?ellipsis:\s*true/,
  'Scan report API path column must not hide report evidence behind Ant Table ellipsis.'
)
rejectPattern(
  scanTaskDetail,
  /title:\s*'Controller'[\s\S]*?dataIndex:\s*'handler_class'[\s\S]*?ellipsis:\s*true/,
  'Scan report API Controller column must not hide report evidence behind Ant Table ellipsis.'
)
rejectPattern(
  scanTaskDetail,
  /title:\s*'文件'[\s\S]*?dataIndex:\s*'file_path'[\s\S]*?ellipsis:\s*true/,
  'Scan report DB file column must not hide report evidence behind Ant Table ellipsis.'
)
rejectPattern(
  css,
  /\.sl-report-evidence-item (?:span|strong|p)\s*\{[^}]*text-overflow:\s*ellipsis/s,
  'Scan report evidence profile cards must not hide labels, values or details behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-report-evidence-item (?:span|strong|p)\s*\{[^}]*white-space:\s*nowrap/s,
  'Scan report evidence profile cards must not force labels, values or details onto one line.'
)
rejectPattern(
  css,
  /\.sl-report-evidence-item (?:span|strong|p)\s*\{[^}]*overflow:\s*hidden/s,
  'Scan report evidence profile cards must not clip labels, values or details with overflow hidden.'
)
rejectPattern(
  css,
  /\.sl-report-evidence-item (?:span|strong|p)\s*\{[^}]*-webkit-line-clamp/s,
  'Scan report evidence profile cards must not line-clamp critical evidence copy.'
)
rejectPattern(
  css,
  /\.sl-report-trace-(?:card-head (?:span|strong)|source|card p)\s*\{[^}]*text-overflow:\s*ellipsis/s,
  'Scan report trace cards must not hide labels, values, source names or details behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-report-trace-(?:card-head (?:span|strong)|source|card p)\s*\{[^}]*white-space:\s*nowrap/s,
  'Scan report trace cards must not force labels, values, source names or details onto one line.'
)
rejectPattern(
  css,
  /\.sl-report-trace-(?:card-head (?:span|strong)|source|card p)\s*\{[^}]*overflow:\s*hidden/s,
  'Scan report trace cards must not clip labels, values, source names or details with overflow hidden.'
)
rejectPattern(
  css,
  /\.sl-report-trace-(?:card-head (?:span|strong)|source|card p)\s*\{[^}]*-webkit-line-clamp/s,
  'Scan report trace cards must not line-clamp labels, values, source names or details.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /function assertReportEvidenceProfileAndTraceMapReadability[\s\S]*?sl-report-evidence-profile[\s\S]*?sl-report-evidence-item[\s\S]*?report-evidence-profile-labels[\s\S]*?report-evidence-profile-values[\s\S]*?report-evidence-profile-details[\s\S]*?报告证据追踪[\s\S]*?sl-report-trace-card[\s\S]*?report-trace-card-labels[\s\S]*?report-trace-card-values[\s\S]*?report-trace-card-sources[\s\S]*?report-trace-card-details/,
  'Report evidence drawer smoke must verify page-level evidence profile and trace map text readability, not only the drawer.'
)
requirePattern(
  scanTaskDetail,
  /interface ReportTraceItem[\s\S]*?actionGateReason:\s*string[\s\S]*?const reportTraceItems:\s*ReportTraceItem\[\][\s\S]*?key:\s*'quality-risks'[\s\S]*?actionGateReason:[\s\S]*?key:\s*'api-surface'[\s\S]*?actionGateReason:[\s\S]*?key:\s*'data-model'[\s\S]*?actionGateReason:[\s\S]*?key:\s*'dependency-graph'[\s\S]*?actionGateReason:[\s\S]*?key:\s*'artifact-bundle'[\s\S]*?actionGateReason:/,
  'Scan report trace map items must carry branch-specific action gate reasons for every trace card.'
)
requirePattern(
  scanTaskDetail,
  /function ReportTraceMap\([\s\S]*?aria-label="报告证据追踪"[\s\S]*?const sourceActionReady = !item\.disabled[\s\S]*?const qaActionReady = canOpenQa && Boolean\(item\.qaQuestion\)[\s\S]*?const gateTitle = gateReady \? '追踪动作门禁已开放' : '追踪动作门禁未开放'[\s\S]*?role="note"[\s\S]*?aria-label=\{`\$\{item\.label\} 追踪动作门禁说明`\}[\s\S]*?\{gateTitle\}[\s\S]*?\{gateReason\}[\s\S]*?label="查看证据"[\s\S]*?label=\{item\.actionLabel\}[\s\S]*?label="追问代码"[\s\S]*?label="复制问答链接"/,
  'Scan report trace map must render visible action gate reasons before trace action buttons.'
)
requirePattern(
  css,
  /\.sl-report-trace-gate\s*\{[\s\S]*?border:[\s\S]*?\.sl-report-trace-gate-ready[\s\S]*?\.sl-report-trace-gate-blocked[\s\S]*?\.sl-report-trace-gate span,[\s\S]*?\.sl-report-trace-gate strong\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;/,
  'Scan report trace map action gate reasons must have dedicated visible wrapping styles.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /function assertReportEvidenceProfileAndTraceMapReadability[\s\S]*?const traceGateLabels = \['质量风险', 'API 表面', '数据模型', '依赖图谱', '产物证据'\][\s\S]*?const traceGateProofs:[\s\S]*?for \(let index = 0; index < traceGateLabels\.length; index \+= 1\)[\s\S]*?getByLabel\(`\$\{label\} 追踪动作门禁说明`\)[\s\S]*?traceGateStyles\.overflow[\s\S]*?traceGateStyles\.overflowWrap[\s\S]*?traceGateStyles\.textOverflow[\s\S]*?traceGateStyles\.whiteSpace[\s\S]*?toHaveCount\(4\)[\s\S]*?traceGateProofs\.push[\s\S]*?evaluateAll\(nodes => nodes\.map/,
  'Report evidence drawer smoke must assert trace map action gate visibility, wrapping style and button count per card.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /function assertReportApiDbTableReadability\(page: Page, viewportName: string\)[\s\S]*?getByRole\('tab', \{ name: \/API\/ \}\)\.click\(\)[\s\S]*?sl-report-api-path-cell[\s\S]*?longApiRoutePath[\s\S]*?sl-report-api-controller-cell[\s\S]*?longApiControllerName[\s\S]*?getByRole\('tab', \{ name: \/数据库\/ \}\)\.click\(\)[\s\S]*?sl-report-db-file-cell[\s\S]*?longDbEntityFile[\s\S]*?getByRole\('tab', \{ name: \/报告总览\/ \}\)\.click\(\)/,
  'Report evidence drawer smoke must verify ScanTaskDetail API and DB table evidence fields wrap and then return to report overview.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /evidenceProfileTraceMapReadability:\s*\{[\s\S]*?surface:\s*'SCAN_TASK_DETAIL_REPORT_EVIDENCE_PROFILE_AND_TRACE_MAP'[\s\S]*?profileItemCount:\s*Math\.min\(\.\.\.evidenceProfileTraceMapProofs\.map\(proof => proof\.profileItemCount\)\)[\s\S]*?traceCardCount:\s*Math\.min\(\.\.\.evidenceProfileTraceMapProofs\.map\(proof => proof\.traceCardCount\)\)[\s\S]*?traceGateCount:\s*Math\.min\(\.\.\.evidenceProfileTraceMapProofs\.map\(proof => proof\.traceGateCount\)\)[\s\S]*?traceGateProofs:\s*evidenceProfileTraceMapProofs\.map\(proof => \(\{[\s\S]*?cards:\s*proof\.traceGateProofs[\s\S]*?traceGateVisible:\s*evidenceProfileTraceMapProofs\.every\(proof => proof\.traceGateVisible\)[\s\S]*?traceGateReasonVisible:\s*evidenceProfileTraceMapProofs\.every\(proof => proof\.traceGateReasonVisible\)[\s\S]*?traceGateReasonStyleSafe:\s*evidenceProfileTraceMapProofs\.every\(proof => proof\.traceGateReasonStyleSafe\)[\s\S]*?traceCardMinButtonCount:\s*Math\.min\(\.\.\.evidenceProfileTraceMapProofs\.map\(proof => proof\.traceCardMinButtonCount\)\)[\s\S]*?mobile390Covered:[\s\S]*?narrow320Covered:[\s\S]*?textNotClipped:[\s\S]*?noHorizontalOverflow:/s,
  'Report evidence drawer smoke marker must expose page-level evidence profile and trace map readability proof.'
)
requirePattern(
  scanTaskDetail,
  /function CodeChunkEvidenceCard\(\{ item \}: \{ item: CodeChunkSearchItem \}\)[\s\S]*?Score \{scoreValue\}[\s\S]*?item\.hasEmbedding \? '语义证据' : '关键词证据'/,
  'Scan report evidence chunk cards must display direct 0-100 score and semantic/keyword evidence mode.'
)
requirePattern(
  scanTaskDetail,
  /function CodeChunkEvidenceCard\(\{ item \}: \{ item: CodeChunkSearchItem \}\)[\s\S]*?const reason = item\.evidenceReason \|\|[\s\S]*?Scan #\{item\.scanTaskId\}[\s\S]*?item\.sourceLabel[\s\S]*?<p>\{reason\}<\/p>/,
  'Scan report evidence chunk cards must show scanTaskId, sourceLabel and fallback evidence reason.'
)
rejectPattern(
  scanTaskDetail,
  /relevanceScore\s*\*\s*100/,
  'Scan report evidence chunk score must not multiply backend 0-100 relevanceScore.'
)
requirePattern(
  scanTaskDetail,
  /const buildRiskEvidence[\s\S]*?source:\s*'ARCHITECTURE_REPORT \/ RISK_REPORT'[\s\S]*?const buildApiEvidence[\s\S]*?source:\s*'API_CATALOG'[\s\S]*?const buildDbEvidence[\s\S]*?source:\s*'DB_SCHEMA'/,
  'Scan report evidence drawer must support risk, API and DB evidence sources.'
)
requirePattern(
  scanTaskDetail,
  /onOpenEvidence=\{\(item\)\s*=>\s*setActiveEvidence\(buildTraceEvidence\(item\)\)\}/,
  'Scan report trace map must open the evidence drawer from trace cards.'
)
requirePattern(
  scanTaskDetail,
  /title:\s*'证据'[\s\S]*?setActiveEvidence\(buildApiEvidence\(record,\s*index\)\)[\s\S]*?title:\s*'证据'[\s\S]*?setActiveEvidence\(buildDbEvidence\(record,\s*index\)\)/,
  'Scan report API and DB tables must expose row-level evidence drawer actions.'
)
requirePattern(
  scanTaskDetail,
  /label="定位文件"/,
  'Scan report risk list must expose file localization for project-level risks without file paths.'
)
requirePattern(
  scanTaskDetail,
  /<ActionButton[\s\S]*?icon=\{<LinkOutlined\s+\/>\}[\s\S]*?onClick=\{\(\)\s*=>\s*item\.qaQuestion && onCopyQa\(item\.qaQuestion\)\}[\s\S]*?label="复制问答链接"\s*\/>/,
  'Scan report trace map must expose copyable QA question links.'
)
requirePattern(
  autoRepairsPage,
  /const scanTaskId\s*=\s*parsePositiveId\(searchParams\.get\('scanTaskId'\)\)/,
  'AutoRepairsPage must preserve scanTaskId from report-origin repair links.'
)
requirePattern(
  autoRepairsPage,
  /\{\s*repositoryId,\s*scanTaskId,\s*filePath,\s*targetDesc,\s*source,\s*provenance\s*\}/,
  'AutoRepairsPage initial draft must pass scanTaskId with repair context.'
)
requirePattern(
  autoRepairs,
  /scanTaskId\?:\s*number/,
  'AutoRepairs draft context must accept scanTaskId.'
)
requirePattern(
  autoRepairs,
  /initialDraft\.scanTaskId[\s\S]*?Scan #\$\{initialDraft\.scanTaskId\}/,
  'AutoRepairs create modal must surface the source scanTaskId for report-origin repairs.'
)
requirePattern(
  autoRepairs,
  /autoRepairApi\.detail\(projectId,\s*initialRepairId\)[\s\S]*?setSelected\(detail\)[\s\S]*?setItems\(prev => prev\.some\(item => item\.id === detail\.id\) \? prev : \[detail,\s*\.\.\.prev\]\)/,
  'AutoRepairs repairId deep links must fall back to the detail API when the target repair is not present in the current list page.'
)
requirePattern(
  autoRepairApi,
  /scanTaskId:\s*number\s*\|\s*null/,
  'AutoRepair API type must expose persisted scanTaskId.'
)
requirePattern(
  autoRepairApi,
  /scanTaskId\?:\s*number/,
  'AutoRepair create API must accept scanTaskId from report-origin repair candidates.'
)
requirePattern(
  autoRepairs,
  /scanTaskId:\s*initialDraft\.scanTaskId/,
  'AutoRepairs create form must preserve initialDraft.scanTaskId for submission.'
)
requirePattern(
  autoRepairs,
  /<Form\.Item\s+name="scanTaskId"\s+hidden>\s*<Input\s+type="hidden"\s*\/>\s*<\/Form\.Item>/,
  'AutoRepairs create form must submit source scanTaskId through a hidden field.'
)
requirePattern(
  autoRepairs,
  /title:\s*'来源扫描'[\s\S]*?dataIndex:\s*'scanTaskId'[\s\S]*?navigate\(`\/scan-tasks\/\$\{scanTaskId\}`\)[\s\S]*?label=\{`Scan #\$\{scanTaskId\}`\}/,
  'AutoRepairs table must expose persisted source scanTaskId and link back to the scan report.'
)
requirePattern(
  autoRepairs,
  /title:\s*'操作'[\s\S]*?className="sl-autorepair-detail-action"[\s\S]*?event\.stopPropagation\(\)[\s\S]*?handleSelect\(record\)[\s\S]*?aria-label=\{`查看自动修复任务 #\$\{record\.id\} 详情`\}[\s\S]*?label="详情"/,
  'AutoRepairs table must expose an explicit accessible detail action for each repair row.'
)
requirePattern(
  autoRepairs,
  /import \{ createSelectableTableRowProps \} from '\.\.\/components\/ui\/selectableTableRow'/,
  'AutoRepairs detail selection must use the shared selectable table row helper instead of local keyboard handling.'
)
rejectPattern(
  autoRepairs,
  /handleRowKeyDown|KeyboardEvent<HTMLElement>/,
  'AutoRepairs must not keep page-local row keyboard handlers after adopting the shared selectable table row helper.'
)
requirePattern(
  autoRepairs,
  /const selectedDetailId = selected \? `autorepair-detail-\$\{selected\.id\}` : undefined[\s\S]*?const selectedTitleId = selected \? `autorepair-detail-title-\$\{selected\.id\}` : undefined/,
  'AutoRepairs must derive stable detail and title ids for selectable row aria-controls.'
)
requirePattern(
  autoRepairs,
  /<Card className="sl-section-card sl-autorepair-table-card sl-selectable-table-card"[\s\S]*?<Table[\s\S]*?rowKey="id"[\s\S]*?onRow=\{\(record\) => createSelectableTableRowProps\(\{[\s\S]*?record,[\s\S]*?selected: selected\?\.id === record\.id,[\s\S]*?onSelect: handleSelect,[\s\S]*?controlsId: selectedDetailId,[\s\S]*?label: `AutoRepair #\$\{record\.id\} \$\{selected\?\.id === record\.id \? '已选中' : '查看详情'\}`[\s\S]*?className: selected\?\.id === record\.id \? 'sl-autorepair-row-selected' : ''/,
  'AutoRepairs table rows must use the shared selectable row helper with selected state, aria-controls and stable row labels.'
)
requirePattern(
  autoRepairs,
  /<Card[\s\S]*?id=\{selectedDetailId\}[\s\S]*?role="region"[\s\S]*?aria-labelledby=\{selectedTitleId\}[\s\S]*?className="sl-section-card sl-autorepair-detail-card"[\s\S]*?title=\{[\s\S]*?<Space wrap id=\{selectedTitleId\}>/,
  'AutoRepairs detail card must expose a labelled region connected from the selected row.'
)
requirePattern(
  autoRepairs,
  /<Table[\s\S]*?columns=\{columns\}[\s\S]*?scroll=\{\{ x: 1080 \}\}/,
  'AutoRepairs table must reserve horizontal space for the explicit detail action column.'
)
requirePattern(
  css,
  /\.sl-selectable-table-card \.ant-table-row:focus-visible > td\s*\{[^}]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.64\);[\s\S]*?\.sl-selectable-table-card \.ant-table-row\[aria-selected='true'\] > td[\s\S]*?\.sl-autorepair-detail-action\s*\{[^}]*min-width:\s*76px;/s,
  'AutoRepairs table must use shared selectable row focus/aria-selected styles and preserve the explicit detail action width.'
)
requirePattern(
  autoRepairs,
  /<AutoRepairSourceBridge[\s\S]*?projectId=\{projectId\}[\s\S]*?repair=\{selected\}[\s\S]*?onNavigate=\{navigate\}[\s\S]*?function AutoRepairSourceBridge[\s\S]*?aria-label="来源扫描闭环"[\s\S]*?Scan Source Bridge[\s\S]*?data-sl-target-url=\{scanReportUrl\}[\s\S]*?label="打开报告"[\s\S]*?data-sl-target-url=\{qaUrl\}[\s\S]*?label="QA 复核此文件"[\s\S]*?data-sl-target-url=\{agentTaskUrl\}[\s\S]*?label="创建 Agent 复核"[\s\S]*?data-sl-target-url=\{auditUrl\}[\s\S]*?label="扫描审计"/,
  'AutoRepairs detail must render a source scan bridge with report, QA, Agent and audit deep links.'
)
requirePattern(
  autoRepairs,
  /未绑定扫描来源[\s\S]*?PR 门禁不把 scanTask 作为硬阻塞[\s\S]*?PATCH_READY 强门禁仍以 diff、补丁产物、执行步骤和审计事件为准/,
  'AutoRepairs source bridge must show an explicit manual-candidate fallback without turning missing scanTaskId into a hard gate.'
)
requirePattern(
  css,
  /\.sl-autorepair-source-bridge\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-autorepair-source-actions\s*\{[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?\.sl-autorepair-source-grid,[\s\S]*?\.sl-autorepair-review-grid,[\s\S]*?\{[\s\S]*?grid-template-columns:\s*1fr;/s,
  'AutoRepairs source bridge CSS must wrap long source text/actions and collapse to one column on narrow screens.'
)
requirePattern(
  autoRepairs,
  /const selectedExecutionDetail\s*=\s*selected && executionDetail\?\.task\.sourceId === selected\.id \? executionDetail : null[\s\S]*?const selectedReadiness\s*=\s*selected \? repairReadiness\(selected,\s*selectedExecutionDetail\) : null/,
  'AutoRepairs detail must compute patch readiness from the selected repair and source-bound execution task evidence.'
)
requirePattern(
  autoRepairs,
  /const selectedReviewGate\s*=\s*selected[\s\S]*?\? patchReadyReviewGate\(selected,\s*selectedExecutionDetail,\s*patchReadyAuditEvidence,\s*patchReadyAuditLoading\)[\s\S]*?: null/,
  'AutoRepairs PATCH_READY detail must compute a structured PR review gate from diff, artifact, source-bound execution and audit evidence.'
)
requirePattern(
  autoRepairs,
  /const fetchPatchReadyAuditEvidence = useCallback\(\(repair: AutoRepair[\s\S]*?auditApi\.listProjectLogs\(projectId,[\s\S]*?resourceType:\s*'AUTO_REPAIR'[\s\S]*?resourceId:\s*repair\.id[\s\S]*?action:\s*'AUTO_REPAIR_PATCH_READY'[\s\S]*?status:\s*'SUCCESS'[\s\S]*?log\.resourceId === repair\.id[\s\S]*?setPatchReadyAuditEvidence\(match \|\| null\)/,
  'AutoRepairs PATCH_READY gate must load matching AUTO_REPAIR_PATCH_READY SUCCESS audit evidence instead of treating a URL as proof.'
)
requirePattern(
  autoRepairs,
  /const currentExecutionDetail = executionDetail\?\.task\.sourceId === selected\.id \? executionDetail : null[\s\S]*?const reviewGate = patchReadyReviewGate\(selected,\s*currentExecutionDetail,\s*patchReadyAuditEvidence,\s*patchReadyAuditLoading\)[\s\S]*?if \(!reviewGate\.canSubmitPr\)[\s\S]*?message\.error\(`创建 PR 已阻止/,
  'AutoRepairs submit-pr handler must fail closed when the source-bound PATCH_READY review gate is not satisfied.'
)
requirePattern(
  autoRepairs,
  /selectedReadiness && <RepairReadinessCard signal=\{selectedReadiness\} progress=\{selectedProgress\} \/>/,
  'AutoRepairs detail must render the patch readiness card for selected repairs.'
)
requirePattern(
  autoRepairs,
  /selected\.status === 'PATCH_READY'[\s\S]*?message="补丁已生成"[\s\S]*?<ArtifactLinkButton[\s\S]*?projectId=\{projectId\}[\s\S]*?ownerType="AUTO_REPAIR"[\s\S]*?ownerId=\{selected\.id\}[\s\S]*?label="查看补丁产物"/,
  'AutoRepairs PATCH_READY detail must expose a patch artifact action bound to AUTO_REPAIR and the selected repair id.'
)
requirePattern(
  autoRepairs,
  /selected\.status === 'PATCH_READY'[\s\S]*?<PatchReviewChecklist[\s\S]*?reviewGate=\{selectedReviewGate!\}[\s\S]*?auditUrl=\{selectedAuditUrl\}[\s\S]*?executionUrl=\{selectedExecutionUrl\}/,
  'AutoRepairs PATCH_READY detail must render the patch review checklist with audit, execution and step evidence.'
)
requirePattern(
  autoRepairs,
  /aria-label="PATCH_READY 补丁审查闭环"[\s\S]*?Patch review checklist[\s\S]*?创建 PR 前完成四项证据复核[\s\S]*?aria-label="PR 前复核门禁"/,
  'AutoRepairs PATCH_READY checklist must expose an accessible review boundary and decision heading.'
)
requirePattern(
  autoRepairs,
  /key:\s*'sourceScan'[\s\S]*?Scan #\$\{repair\.scanTaskId\}[\s\S]*?key:\s*'diff'[\s\S]*?Diff 已生成[\s\S]*?key:\s*'patchArtifact'[\s\S]*?CHANGE_PATCH 已归档[\s\S]*?key:\s*'executionTask'[\s\S]*?generate_patch SUCCESS \/ Patch evidence retained[\s\S]*?key:\s*'auditEvent'[\s\S]*?AUTO_REPAIR_PATCH_READY SUCCESS/,
  'AutoRepairs PATCH_READY checklist must aggregate source scan, patch artifact, immutable generate_patch evidence and audit event evidence.'
)
requirePattern(
  autoRepairs,
  /successfulPatchGenerationStep\(executionDetail\)[\s\S]*?hasPatchGenerationEvidence[\s\S]*?generate_patch SUCCESS \/ Patch evidence retained/,
  'AutoRepairs PATCH_READY gate must use immutable generate_patch SUCCESS evidence instead of aggregate task SUCCESS.'
)
requirePattern(
  autoRepairs,
  /<ArtifactLinkButton[\s\S]*?ownerType="AUTO_REPAIR"[\s\S]*?ownerId=\{repair\.id\}[\s\S]*?label="查看补丁"/,
  'AutoRepairs PATCH_READY checklist must provide a compact patch artifact review action bound to the selected repair.'
)
requirePattern(
  autoRepairs,
  /selectedReviewGate\?\.canSubmitPr \? \([\s\S]*?<Popconfirm[\s\S]*?description=\{[\s\S]*?<PatchReadyPrConfirmSummary[\s\S]*?reviewGate=\{selectedReviewGate\}[\s\S]*?candidateReceipt=\{candidateReceipt\}[\s\S]*?onConfirm=\{handleSubmitPr\}[\s\S]*?: \([\s\S]*?<ActionButton[\s\S]*?disabled[\s\S]*?aria-label="创建 PR（复核未通过）"/,
  'AutoRepairs PATCH_READY create-PR action must use Popconfirm only when the review gate passes and a disabled action when blocked.'
)
requirePattern(
  autoRepairs,
  /function PatchReadyPrConfirmSummary\([\s\S]*?candidateReceipt[\s\S]*?candidateProvenanceFromAudit\(candidateReceipt\)[\s\S]*?candidateProvenanceGate\(provenance\)[\s\S]*?候选凭证：[\s\S]*?不作为 PATCH_READY 硬阻塞[\s\S]*?候选门禁来源：[\s\S]*?候选门禁原因：/,
  'AutoRepairs PATCH_READY PR confirmation must show candidate receipt gate/source while keeping it non-blocking for PATCH_READY.'
)
requirePattern(
  autoRepairs,
  /function patchReadyReviewGate\([\s\S]*?blockingItems = items\.filter\(item => item\.blocking && item\.status !== 'ready'\)[\s\S]*?canSubmitPr:\s*repair\.status === 'PATCH_READY' && blockingItems\.length === 0/,
  'AutoRepairs PATCH_READY review gate must derive canSubmitPr from blocking structured evidence items.'
)
requirePattern(
  autoRepairs,
  /key:\s*'sourceScan'[\s\S]*?status:\s*repair\.scanTaskId \? 'ready' : 'warning'[\s\S]*?blocking:\s*false/,
  'AutoRepairs PATCH_READY review gate must keep missing scanTaskId as warning-only for manual candidates.'
)
requirePattern(
  autoRepairs,
  /function patchReadyAuditUrl\(projectId:\s*number,\s*repair:\s*AutoRepair\)[\s\S]*?resourceType:\s*'AUTO_REPAIR'[\s\S]*?action:\s*'AUTO_REPAIR_PATCH_READY'[\s\S]*?status:\s*'SUCCESS'[\s\S]*?params\.set\('scanTaskId',\s*String\(repair\.scanTaskId\)\)/,
  'AutoRepairs PATCH_READY checklist must build an audit deep link scoped to AUTO_REPAIR_PATCH_READY and scanTaskId.'
)
requirePattern(
  autoRepairs,
  /<AutoRepairAttemptTimeline repair=\{selected\} detail=\{selectedExecutionDetail\} \/>[\s\S]*?function AutoRepairAttemptTimeline[\s\S]*?Patch generation attempt[\s\S]*?PR submission attempt[\s\S]*?attemptStepTitle\(step,\s*attemptsById\)/,
  'AutoRepairs detail must render source-bound AUTO_REPAIR execution evidence as split patch and PR attempts with attempt-aware step titles.'
)
requirePattern(
  autoRepairs,
  /const attemptsById = buildAttemptsById\(detail\)[\s\S]*?patchSteps = detail\.steps\.filter\(isPatchGenerationStep\)[\s\S]*?prSteps = detail\.steps\.filter\(isPrSubmissionStep\)/,
  'AutoRepairs attempt timeline must group execution steps by patch generation and PR submission responsibilities.'
)
requirePattern(
  artifacts,
  /if \(record\.ownerType === 'AUTO_REPAIR'\) return `\/auto-repairs\?projectId=\$\{projectId\}&repairId=\$\{record\.ownerId\}`/,
  'Artifacts must deep-link AUTO_REPAIR artifacts back to the AutoRepair detail page.'
)
requirePattern(
  auditLogs,
  /if \(record\.resourceType === 'AUTO_REPAIR'\) return `\/auto-repairs\?projectId=\$\{projectId\}&repairId=\$\{record\.resourceId\}`/,
  'AuditLogs must deep-link AUTO_REPAIR audit records back to the AutoRepair detail page.'
)
requirePattern(
  auditLogs,
  /if \(record\.resourceType === 'ARTIFACT'\) return `\/artifacts\?projectId=\$\{projectId\}&artifactId=\$\{record\.resourceId\}`/,
  'AuditLogs must deep-link ARTIFACT audit records back to the Artifacts detail page.'
)
requirePattern(
  auditLogs,
  /data-sl-target-url=\{getAuditResourcePath\(record\) \|\| undefined\}/,
  'AuditLogs table resource action must expose the exact associated resource target URL for smoke proof.'
)
requirePattern(
  auditLogs,
  /data-sl-target-url=\{getAuditResourcePath\(selected\) \|\| undefined\}/,
  'AuditLogs drawer resource action must expose the exact associated resource target URL for smoke proof.'
)
requirePattern(
  executionTasks,
  /if \(task\.sourceType === 'AUTO_REPAIR' && task\.sourceId\) \{[\s\S]*?navigate\(`\/auto-repairs\?projectId=\$\{projectId\}&repairId=\$\{task\.sourceId\}`\)/,
  'ExecutionTasks must open AUTO_REPAIR source tasks on the AutoRepair detail page.'
)
requirePattern(
  executionTasks,
  /if \(task\.sourceType === 'AUTO_REPAIR'\) return 'AUTO_REPAIR'/,
  'ExecutionTasks artifact links must preserve AUTO_REPAIR owner type.'
)
requirePattern(
  packageJson,
  /"smoke:patch-ready":\s*"playwright test -c playwright\.patch-ready\.config\.ts"/,
  'package.json must expose the PATCH_READY Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:project-detail-first-viewport":\s*"playwright test -c playwright\.project-detail-first-viewport\.config\.ts"/,
  'package.json must expose the focused ProjectDetail first-viewport browser smoke entrypoint.'
)
requirePattern(
  projectDetailFirstViewportSmokeConfig,
  /testMatch:\s*\/project-detail-first-viewport-smoke\\\.spec\\\.ts\/[\s\S]*?fullyParallel:\s*false[\s\S]*?workers:\s*1/,
  'ProjectDetail first-viewport smoke config must select only its focused spec and run deterministically with one worker.'
)
requirePattern(
  makefile,
  /project-detail-first-viewport-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:project-detail-first-viewport/,
  'Makefile must expose the canonical ProjectDetail first-viewport smoke target.'
)
requirePattern(
  projectDetailFirstViewportSmokeSpec,
  /width:\s*1440,\s*height:\s*900[\s\S]*?width:\s*1024,\s*height:\s*768[\s\S]*?width:\s*768,\s*height:\s*1024[\s\S]*?width:\s*390,\s*height:\s*844[\s\S]*?width:\s*320,\s*height:\s*740/,
  'ProjectDetail first-viewport smoke must cover the required desktop, tablet and mobile viewport matrix.'
)
requirePattern(
  projectDetailFirstViewportSmokeSpec,
  /ADD_REPOSITORY[\s\S]*?START_SCAN[\s\S]*?WATCH_SCAN[\s\S]*?REVIEW_FAILED_SCAN[\s\S]*?OPEN_ARTIFACTS[\s\S]*?OPEN_QA[\s\S]*?INITIAL_LOADING[\s\S]*?FATAL_LOAD[\s\S]*?STALE_REFRESH/,
  'ProjectDetail first-viewport smoke must cover initial, fatal, stale and all six trusted business states.'
)
requirePattern(
  projectDetailFirstViewportSmokeSpec,
  /expectButtonInsideViewport[\s\S]*?window\.scrollY[\s\S]*?expectNoHorizontalOverflow[\s\S]*?data-sl-primary-count/,
  'ProjectDetail first-viewport smoke must prove primary button visibility, zero initial scroll, no horizontal overflow and primary cardinality.'
)
requirePattern(
  projectDetailFirstViewportSmokeSpec,
  /ignores delayed A core and detail responses after client-side switch to B[\s\S]*?delayKind:\s*'core'[\s\S]*?delayKind = 'code-chunks'[\s\S]*?delayKind = 'previews'[\s\S]*?expectRaceProjectBOnly/,
  'ProjectDetail first-viewport smoke must reject delayed A core, code-chunk and preview responses after switching to project B.'
)
requirePattern(
  projectDetailFirstViewportSmokeSpec,
  /PROJECT_DETAIL_FIRST_VIEWPORT_STATE_SMOKE_OK[\s\S]*?initialChecked:[\s\S]*?fatalChecked:[\s\S]*?sixStateChecked:[\s\S]*?staleChecked:[\s\S]*?routeRaceChecked:[\s\S]*?realApi:\s*false[\s\S]*?db:\s*false/,
  'ProjectDetail first-viewport success marker must report every bounded contract and state that no real API or database was used.'
)
rejectPattern(
  projectDetailFirstViewportSmokeSpec,
  /scrollIntoView(?:IfNeeded)?/,
  'ProjectDetail first-viewport smoke must validate the natural first viewport without programmatic scrolling.'
)
requirePattern(
  packageJson,
  /"smoke:scan-task-detail-first-viewport":\s*"playwright test -c playwright\.scan-task-detail-first-viewport\.config\.ts"/,
  'package.json must expose the focused ScanTaskDetail first-viewport browser smoke entrypoint.'
)
requirePattern(
  scanTaskDetailFirstViewportSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5218\)[\s\S]*?testMatch:\s*\/scan-task-detail-first-viewport-smoke\\\.spec\\\.ts\/[\s\S]*?fullyParallel:\s*false[\s\S]*?workers:\s*1[\s\S]*?preserveOutput:\s*'always'/,
  'ScanTaskDetail first-viewport smoke config must use its dedicated port, focused spec, one deterministic worker and retained success evidence.'
)
requirePattern(
  makefile,
  /scan-task-detail-first-viewport-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:scan-task-detail-first-viewport/,
  'Makefile must expose the canonical ScanTaskDetail first-viewport smoke target.'
)
requirePattern(
  scanTaskDetail,
  /type ScanTaskDetailViewState = 'INITIAL_LOADING' \| 'FATAL_LOAD' \| 'STALE_REFRESH' \| 'READY'[\s\S]*?trustedSnapshotRef[\s\S]*?routeGenerationRef[\s\S]*?coreSeqRef[\s\S]*?detailSeqRef/,
  'ScanTaskDetail must keep an explicit four-state surface plus trusted snapshot, route generation and independent request sequences.'
)
requirePattern(
  scanTaskDetail,
  /assertOwnedScanTask[\s\S]*?assertOwnedArtifact[\s\S]*?assertOwnedExecution[\s\S]*?assertOwnedCodeKnowledge[\s\S]*?preview\?\.record/,
  'ScanTaskDetail must validate task, artifact, preview, execution and code_chunks ownership before committing report state.'
)
requirePattern(
  scanTaskDetail,
  /ownedSurface\.state === 'INITIAL_LOADING'[\s\S]*?data-sl-primary-count="0"[\s\S]*?ownedSurface\.state === 'FATAL_LOAD'[\s\S]*?data-sl-primary-count="1"[\s\S]*?const isStale = ownedSurface\.state === 'STALE_REFRESH'[\s\S]*?label="重新同步"/,
  'ScanTaskDetail must render isolated initial, fatal and stale states with explicit primary-action cardinality.'
)
requirePattern(
  scanTaskDetail,
  /const verifiedSteps = execution\?\.steps \|\| \[\][\s\S]*?verifiedSteps\.length > 0[\s\S]*?title="执行步骤证据未提供"[\s\S]*?页面不会把预期流程伪装成已排队或已执行状态/,
  'ScanTaskDetail must render execution steps only from returned evidence and show an explicit unavailable state when step records are absent.'
)
rejectPattern(
  scanTaskDetail,
  /function normalizeSteps[\s\S]*?taskId:\s*0[\s\S]*?status:[\s\S]*?'PENDING'/,
  'ScanTaskDetail must not synthesize pending execution steps when the execution API did not return step evidence.'
)
requirePattern(
  scanTaskDetail,
  /const hasConfirmedRiskArray = hasParsedReport && Array\.isArray\(codeQuality\.risks\)[\s\S]*?const riskCount = hasConfirmedRiskArray \? codeQuality\.risks\.length : null[\s\S]*?riskCount === null \? '风险状态不可用' : riskCount > 0 \? `\$\{riskCount\} 个风险项` : '未识别到显著风险'[\s\S]*?task\?\.status === 'FAILED'[\s\S]*?: hasConfirmedRiskArray \? \([\s\S]*?<ArchitectureReport/,
  'ScanTaskDetail must distinguish an unconfirmed risk state from an explicitly confirmed empty risk list.'
)
requirePattern(
  scanTaskDetail,
  /const pollCore = useCallback[\s\S]*?fullRefreshOwnerRef\.current !== null[\s\S]*?const schedule = \(\) =>[\s\S]*?window\.setTimeout[\s\S]*?if \(!cancelled && shouldContinue\) schedule\(\)/,
  'ScanTaskDetail active polling must use cancellable recursive scheduling and yield to a full refresh owner.'
)
requirePattern(
  scanTaskDetail,
  /setPollRestartEpoch\(epoch => epoch \+ 1\)[\s\S]*?const latest = trustedSnapshotRef\.current[\s\S]*?latest\.scanTaskId !== taskId[\s\S]*?const nextSnapshot = \{ \.\.\.latest, task: nextTask \}[\s\S]*?pollRestartEpoch/,
  'ScanTaskDetail polling must merge into the latest trusted snapshot and restart after a successful active full refresh.'
)
requirePattern(
  scanTaskDetail,
  /const attemptIds = new Set\(execution\.attempts\.map[\s\S]*?attempt\.taskId\) !== executionTaskId[\s\S]*?step\.taskId\) !== executionTaskId[\s\S]*?log\.taskId\) !== executionTaskId[\s\S]*?currentAttemptId != null && !attemptIds\.has/,
  'ScanTaskDetail execution ownership must cover nested attempts, steps, logs and current attempt references.'
)
requirePattern(
  scanTaskDetail,
  /const governanceRequestSeqRef = useRef\(0\)[\s\S]*?const requestSeq = governanceRequestSeqRef\.current \+ 1[\s\S]*?const isCurrent = \(\) => governanceRequestSeqRef\.current === requestSeq[\s\S]*?governanceRequestSeqRef\.current \+= 1/,
  'ScanTaskDetail governance loading must use a latest-request-wins owner that is invalidated on cleanup.'
)
requirePattern(
  scanTaskDetail,
  /previewResults\.flatMap[\s\S]*?setPreviewError[\s\S]*?message="报告产物预览暂时不可用"[\s\S]*?label="重新加载报告预览"/,
  'ScanTaskDetail preview transport failures must remain locally visible and retryable without promoting the whole page to fatal.'
)
requirePattern(
  scanTaskDetail,
  /const canPreserveTrustedSnapshot = Boolean\([\s\S]*?previewErrors\.length > 0 && canPreserveTrustedSnapshot[\s\S]*?state: 'STALE_REFRESH'[\s\S]*?error: previewError/,
  'ScanTaskDetail preview refresh failures must preserve the prior trusted snapshot and move the surface to STALE_REFRESH.'
)
requirePattern(
  scanTaskDetail,
  /Number\(timeline\?\.projectId\) !== projectId \|\| Number\(timeline\?\.scanTaskId\) !== scanTaskId[\s\S]*?assertOwnedCodeKnowledge\(value, scanTaskId\)[\s\S]*?setEvidenceChunkResult\(value\)/,
  'ScanTaskDetail deep governance and evidence search responses must reject foreign project or scan ownership locally.'
)
requirePattern(
  scanTaskDetailFirstViewportSmokeSpec,
  /width:\s*1440,\s*height:\s*900[\s\S]*?width:\s*1024,\s*height:\s*768[\s\S]*?width:\s*768,\s*height:\s*1024[\s\S]*?width:\s*390,\s*height:\s*844[\s\S]*?width:\s*320,\s*height:\s*740/,
  'ScanTaskDetail first-viewport smoke must cover the required five-view viewport matrix.'
)
requirePattern(
  scanTaskDetailFirstViewportSmokeSpec,
  /fatalScenariosByViewport:[\s\S]*?'task-transport'[\s\S]*?'task-null'[\s\S]*?'task-foreign-id'[\s\S]*?'task-invalid-project'[\s\S]*?'artifacts-transport'[\s\S]*?'artifacts-malformed-list'[\s\S]*?'artifact-null-record'[\s\S]*?'artifact-foreign-project'[\s\S]*?'artifact-foreign-owner-type'[\s\S]*?'artifact-foreign-owner-id'[\s\S]*?'preview-missing-record'[\s\S]*?'preview-foreign-id'[\s\S]*?'preview-foreign-project'[\s\S]*?'preview-foreign-owner-type'[\s\S]*?'preview-foreign-owner-id'/,
  'ScanTaskDetail first-viewport smoke must cover fifteen distinct fatal transport, shape and ownership scenarios rather than multiplying three sources by viewport count.'
)
requirePattern(
  scanTaskDetailFirstViewportSmokeSpec,
  /fallbackReportModeByViewport:[\s\S]*?'none'[\s\S]*?'invalid-json'[\s\S]*?'missing-code-quality'[\s\S]*?'missing-risks'[\s\S]*?'non-array-risks'[\s\S]*?confirmedEmptyRiskChecked[\s\S]*?riskFallbackChecked/,
  'ScanTaskDetail first-viewport smoke must distinguish a confirmed empty risk list from missing, malformed and unconfirmed report risk states.'
)
requirePattern(
  scanTaskDetailFirstViewportSmokeSpec,
  /expectReadableReason[\s\S]*?scrollWidth[\s\S]*?scrollHeight[\s\S]*?fontSize[\s\S]*?fatal reason[\s\S]*?stale reason/,
  'ScanTaskDetail first-viewport smoke must measure full fatal and stale reason readability inside the natural viewport.'
)
requirePattern(
  scanTaskDetailFirstViewportSmokeSpec,
  /getByText\('执行步骤证据未提供'[\s\S]*?页面不会把预期流程伪装成已排队或已执行状态[\s\S]*?locator\('\.sl-scan-step-grid'\)[\s\S]*?toHaveCount\(0\)[\s\S]*?getByText\('等待执行'/,
  'ScanTaskDetail focused smoke must prove missing execution evidence is explicit and synthetic pending steps are absent.'
)
requirePattern(
  scanTaskDetailFirstViewportSmokeSpec,
  /readyScreenshotPath = testInfo\.outputPath[\s\S]*?page\.screenshot\(\{ path: readyScreenshotPath, fullPage: false, animations: 'disabled' \}\)[\s\S]*?testInfo\.attach\(`scan-task-detail-\$\{viewport\.name\}-ready`[\s\S]*?staleScreenshotPath = testInfo\.outputPath[\s\S]*?page\.screenshot\(\{ path: staleScreenshotPath, fullPage: false, animations: 'disabled' \}\)[\s\S]*?testInfo\.attach\(`scan-task-detail-\$\{viewport\.name\}-stale`[\s\S]*?visualEvidenceChecked/,
  'ScanTaskDetail focused smoke must retain successful desktop and 320px READY/STALE visual attachments.'
)
requirePattern(
  scanTaskDetailFirstViewportSmokeSpec,
  /const proof = \{[\s\S]*?initialChecked[\s\S]*?fatalChecked[\s\S]*?staleChecked[\s\S]*?confirmedEmptyRiskChecked[\s\S]*?riskFallbackChecked[\s\S]*?visualEvidenceChecked[\s\S]*?routeRaceChecked[\s\S]*?SCAN_TASK_DETAIL_FIRST_VIEWPORT_SMOKE_OK[\s\S]*?fatalScenarioCount[\s\S]*?successfulVisualAttachmentCount[\s\S]*?mockedApiOnly:\s*true[\s\S]*?realApi:\s*false[\s\S]*?db:\s*false/,
  'ScanTaskDetail first-viewport marker must report the complete mocked-only contract and deny real API or database evidence.'
)
requirePattern(
  scanTaskDetailFirstViewportSmokeSpec,
  /function navigateClientSide[\s\S]*?window\.history\.pushState[\s\S]*?new PopStateEvent\('popstate'[\s\S]*?raceStages:\s*RaceStage\[\] = \['task-detail', 'artifact-list', 'artifact-preview', 'execution-detail', 'code-status'\][\s\S]*?expectTaskBOnly[\s\S]*?releaseDelayed/,
  'ScanTaskDetail route-race smoke must keep one SPA runtime and cover delayed task, artifact, preview, execution and code responses.'
)
requirePattern(
  scanTaskDetailFirstViewportSmokeSpec,
  /keeps recovered code knowledge across a late RUNNING poll and restarts polling[\s\S]*?codeStatusFailuresRemaining\.set\(runningTaskId, 3\)[\s\S]*?the next real 3s RUNNING poll must enter hold[\s\S]*?released stale poll snapshot[\s\S]*?polling must restart after full refresh supersedes the old poll[\s\S]*?pollingRaceChecked \+= 1/,
  'ScanTaskDetail smoke must exercise real recursive polling, local code recovery, old-poll rejection and post-refresh restart.'
)
rejectPattern(
  scanTaskDetailFirstViewportSmokeSpec,
  /\.scrollIntoView(?:IfNeeded)?\s*\(/,
  'ScanTaskDetail first-viewport smoke must validate the natural first viewport without scrollIntoView helpers.'
)
requirePattern(
  packageJson,
  /"smoke:agent-chat-first-viewport":\s*"playwright test -c playwright\.agent-chat-first-viewport\.config\.ts"/,
  'package.json must expose the canonical focused AgentChat first-viewport smoke entrypoint.'
)
requirePattern(
  agentChatFirstViewportSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5221\)[\s\S]*?testMatch:\s*\/agent-chat-first-viewport-smoke\\\.spec\\\.ts\/[\s\S]*?fullyParallel:\s*false[\s\S]*?workers:\s*1[\s\S]*?preserveOutput:\s*'always'/,
  'AgentChat first-viewport smoke config must use its dedicated port, focused spec, one worker and retained success output.'
)
requirePattern(
  makefile,
  /agent-chat-first-viewport-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:agent-chat-first-viewport/,
  'Makefile must expose the canonical AgentChat first-viewport smoke target.'
)
requirePattern(
  agentChatFirstViewportSmokeSpec,
  /width:\s*1440,\s*height:\s*900[\s\S]*?width:\s*1024,\s*height:\s*768[\s\S]*?width:\s*768,\s*height:\s*1024[\s\S]*?width:\s*390,\s*height:\s*844[\s\S]*?width:\s*320,\s*height:\s*740/,
  'AgentChat first-viewport smoke must cover the required five viewport matrix.'
)
requirePattern(
  agentChatFirstViewportSmokeSpec,
  /const stateContracts: Record<AgentChatState[\s\S]*?INITIAL_LOADING:[\s\S]*?FATAL_LOAD:[\s\S]*?EMPTY:[\s\S]*?READY:[\s\S]*?STREAMING:[\s\S]*?STALE_REFRESH:[\s\S]*?data-agent-chat-state-indicator[\s\S]*?data-agent-chat-primary-actions[\s\S]*?data-agent-chat-primary-action/,
  'AgentChat focused smoke must dynamically verify all six states, Chinese labels and primary-action cardinality/semantics.'
)
requirePattern(
  agentChatFirstViewportSmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?unhandledApiRequests\.push[\s\S]*?Unhandled AgentChat first viewport API[\s\S]*?, 599\)[\s\S]*?mockedApiOnly:\s*true[\s\S]*?realApi:\s*false[\s\S]*?db:\s*false[\s\S]*?unhandledApiRequests:\s*proof\.unhandledApiRequests/,
  'AgentChat focused smoke must fail closed for every unhandled API request and mark mocked-only, no-real-API and no-database evidence.'
)
requirePattern(
  agentChatFirstViewportSmokeSpec,
  /function expectNoHorizontalOverflow[\s\S]*?document\.documentElement\.scrollWidth[\s\S]*?function expectInsideViewport[\s\S]*?boundingBox\(\)[\s\S]*?function expectState[\s\S]*?window\.scrollY[\s\S]*?expectNoHorizontalOverflow[\s\S]*?function expectComposerCanSend[\s\S]*?getByLabel\('输入给 SourceLens Agent 的问题'\)[\s\S]*?getByRole\('button', \{ name: '发送' \}\)[\s\S]*?textarea\.fill\(question\)[\s\S]*?window\.scrollY[\s\S]*?selectedEmptyThreadChecked[\s\S]*?readyComposerSendChecked/,
  'AgentChat focused smoke must prove natural scrollY=0, no overflow and fully bounded input/send controls for active EMPTY and READY.'
)
requirePattern(
  agentChatFirstViewportSmokeSpec,
  /viewport\.width <= 1200[\s\S]*?\.sl-agent-chat-shell > \.sl-agent-chat-sidebar[\s\S]*?getByRole\('button', \{ name: '打开会话池' \}\)[\s\S]*?\.sl-agent-chat-conversation-drawer\.ant-drawer-open[\s\S]*?\.ant-drawer-close[\s\S]*?link\.click\(\)[\s\S]*?threadFirstDrawerChecked/,
  'AgentChat focused smoke must prove the <=1200 conversation pool is absent by default and the Drawer can be opened, read, closed and used for selection.'
)
requirePattern(
  agentChatFirstViewportSmokeSpec,
  /failNextDetails\.add\(conversationAId\)[\s\S]*?expectState\(page, 'STALE_REFRESH'[\s\S]*?messageA\.content[\s\S]*?expectComposerLocked[\s\S]*?data-agent-chat-primary-action="resync"[\s\S]*?expectState\(page, 'READY'/,
  'AgentChat focused smoke must derive STALE from a failed silent refresh, retain trusted messages, lock compose, expose one resync action and recover to READY.'
)
requirePattern(
  agentChatFirstViewportSmokeSpec,
  /completed:\s*false[\s\S]*?new ReadableStream<Uint8Array>[\s\S]*?MOCK_SSE_HELD_OPEN[\s\S]*?expectState\(page, 'STREAMING'[\s\S]*?streaming-switch-b[\s\S]*?Conv #\$\{conversationAId\}[\s\S]*?data-agent-chat-primary-action="stop"[\s\S]*?sseMockHeldOpen:\s*true/,
  'AgentChat focused smoke must keep mocked SSE unfinished, lock input, expose one stop action and explain A occupancy after switching to B.'
)
requirePattern(
  agentChatFirstViewportSmokeSpec,
  /rejects delayed A detail and list responses after B takes ownership[\s\S]*?holdConversationLists\.add\(projectAId\)[\s\S]*?holdDetails\.add\(raceConversationAId\)[\s\S]*?navigateClientSide\(page, raceConversationBId\)[\s\S]*?releaseDelayed\('detail', raceConversationAId\)[\s\S]*?releaseDelayed\('conversation-list', projectAId\)[\s\S]*?data-sl-agent-chat-message-owner[\s\S]*?raceMessageA\.content[\s\S]*?toHaveCount\(0\)/,
  'AgentChat focused smoke must reject delayed A detail and list responses after B owns the route and messages.'
)
requirePattern(
  agentChatFirstViewportSmokeSpec,
  /agent-chat-\$\{viewport\.name\}-ready\.png[\s\S]*?page\.screenshot\(\{ path: screenshotPath, fullPage: false, animations: 'disabled' \}\)[\s\S]*?agent-chat-\$\{viewport\.name\}-stale\.png[\s\S]*?visualEvidence[\s\S]*?'desktop:READY'[\s\S]*?'desktop:STALE_REFRESH'[\s\S]*?'narrow:READY'[\s\S]*?'narrow:STALE_REFRESH'/,
  'AgentChat focused smoke must retain desktop and 320px READY/STALE PNG evidence.'
)
requirePattern(
  agentChatFirstViewportSmokeSpec,
  /AGENT_CHAT_FIRST_VIEWPORT_SMOKE_OK[\s\S]*?testCount:\s*6[\s\S]*?mockedApiOnly:\s*true[\s\S]*?realApi:\s*false[\s\S]*?db:\s*false[\s\S]*?unhandledApiRequests:[\s\S]*?documentScrollY:\s*0[\s\S]*?scrollIntoViewIfNeeded:\s*false[\s\S]*?forceClick:\s*false[\s\S]*?preserveOutput:\s*'always'[\s\S]*?workers:\s*1[\s\S]*?fullyParallel:\s*false/,
  'AgentChat first-viewport success marker must report test count, mock boundary, geometry, retained evidence and deterministic config.'
)
rejectPattern(
  agentChatFirstViewportSmokeSpec,
  /\.scrollIntoView(?:IfNeeded)?\s*\(|\.click\(\{[^}]*force:\s*true/,
  'AgentChat first-viewport smoke must not programmatically scroll or force-click around first-viewport defects.'
)
requirePattern(
  viteConfig,
  /build:\s*\{[\s\S]*?chunkSizeWarningLimit:\s*1100[\s\S]*?manualChunks\(id\)[\s\S]*?vendor-react[\s\S]*?vendor-http[\s\S]*?vendor-antd/,
  'Vite build must keep stable vendor chunks for React, HTTP and Ant Design, with the known Ant Design vendor cache boundary above the default chunk warning threshold.'
)
requirePattern(
  viteConfig,
  /id\.indexOf\('\/antd\/'\)[\s\S]*?id\.indexOf\('\/@ant-design\/icons\/'\)[\s\S]*?id\.indexOf\('\/@ant-design\/cssinjs\/'\)[\s\S]*?id\.indexOf\('\/rc-'\)[\s\S]*?return 'vendor-antd'/,
  'Vite build must keep Ant Design, icons, css-in-js and rc dependencies in one vendor-antd chunk to avoid circular manual chunk warnings.'
)
requirePattern(
  packageJson,
  /"smoke:public-repo-ui":\s*"playwright test -c playwright\.public-repo-ui\.config\.ts"/,
  'package.json must expose the public repo live UI Playwright smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:dashboard-next-action":\s*"playwright test -c playwright\.dashboard-next-action\.config\.ts"/,
  'package.json must expose the Dashboard next action Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:report-evidence-drawer":\s*"playwright test -c playwright\.report-evidence-drawer\.config\.ts"/,
  'package.json must expose the report evidence drawer Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:report-evidence-qa-citation":\s*"playwright test -c playwright\.report-evidence-qa-citation\.config\.ts"/,
  'package.json must expose the report evidence to QA citation Playwright browser smoke entrypoint through its dedicated config.'
)
rejectPattern(
  packageJson,
  /"smoke:report-evidence-qa-citation":\s*"playwright test -c playwright\.report-evidence-drawer\.config\.ts"/,
  'package.json must not route report evidence QA citation smoke through the drawer config.'
)
requirePattern(
  packageJson,
  /"smoke:scan-governance-timeline":\s*"playwright test -c playwright\.scan-governance-timeline\.config\.ts"/,
  'package.json must expose the scan governance timeline Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:app-shell-ui":\s*"playwright test -c playwright\.app-shell-ui\.config\.ts"/,
  'package.json must expose the app shell UI Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:work-perspective":\s*"playwright test -c playwright\.app-shell-ui\.config\.ts --grep \\"Work perspective\\""/,
  'package.json must expose a bounded work-perspective browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:agent-tasks-detail-selection":\s*"playwright test -c playwright\.agent-tasks-detail-selection\.config\.ts"/,
  'package.json must expose the AgentTasks detail selection Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:execution-tasks-detail-selection":\s*"playwright test -c playwright\.execution-tasks-detail-selection\.config\.ts"/,
  'package.json must expose the ExecutionTasks detail selection Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:artifacts-detail-selection":\s*"playwright test -c playwright\.artifacts-detail-selection\.config\.ts"/,
  'package.json must expose the Artifacts detail selection Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:p9-main-path-recoverable-error-states-batch3":\s*"playwright test -c playwright\.p9-main-path-recoverable-error-states-batch3\.config\.ts"/,
  'package.json must expose the P9 batch 3 recoverable error states Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:p9-main-path-recoverable-error-states-batch4a":\s*"playwright test -c playwright\.p9-main-path-recoverable-error-states-batch4a\.config\.ts"/,
  'package.json must expose the P9 batch 4A deep page recoverable error states Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:p9-main-path-recoverable-error-states-batch4b":\s*"playwright test -c playwright\.p9-main-path-recoverable-error-states-batch4b\.config\.ts"/,
  'package.json must expose the P9 batch 4B DependencyGraph recoverable error states Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:model-config-recoverable":\s*"playwright test -c playwright\.model-config-recoverable\.config\.ts"/,
  'package.json must expose the ModelConfig recoverable provider config Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:audit-logs-detail-selection":\s*"playwright test -c playwright\.audit-logs-detail-selection\.config\.ts"/,
  'package.json must expose the AuditLogs detail selection Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:ci-diagnostics-detail-selection":\s*"playwright test -c playwright\.ci-diagnostics-detail-selection\.config\.ts"/,
  'package.json must expose the CI Diagnostics detail selection Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:pr-reviews-detail-selection":\s*"playwright test -c playwright\.pr-reviews-detail-selection\.config\.ts"/,
  'package.json must expose the PR Reviews detail selection Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:issue-decomposition-detail-selection":\s*"playwright test -c playwright\.issue-decomposition-detail-selection\.config\.ts"/,
  'package.json must expose the IssueDecomposition detail selection Playwright browser smoke entrypoint.'
)
requirePattern(
  packageJson,
  /"smoke:report-autorepair-candidate":\s*"playwright test -c playwright\.report-autorepair-candidate\.config\.ts"/,
  'package.json must expose the report-to-AutoRepair candidate Playwright browser smoke entrypoint.'
)
requirePattern(
  makefile,
  /patch-ready-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:patch-ready/,
  'Makefile must expose patch-ready-ui-smoke as the canonical PATCH_READY browser smoke target.'
)
requirePattern(
  makefile,
  /public-repo-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:public-repo-ui/,
  'Makefile must expose public-repo-ui-smoke as the canonical public repo live page smoke target.'
)
requirePattern(
  makefile,
  /dashboard-next-action-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:dashboard-next-action/,
  'Makefile must expose dashboard-next-action-ui-smoke as the canonical Dashboard next action browser smoke target.'
)
requirePattern(
  makefile,
  /report-evidence-drawer-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:report-evidence-drawer/,
  'Makefile must expose report-evidence-drawer-ui-smoke as the canonical report evidence drawer browser smoke target.'
)
requirePattern(
  makefile,
  /report-evidence-qa-citation-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:report-evidence-qa-citation/,
  'Makefile must expose report-evidence-qa-citation-ui-smoke as the canonical report evidence to QA citation browser smoke target.'
)
requirePattern(
  makefile,
  /scan-governance-timeline-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:scan-governance-timeline/,
  'Makefile must expose scan-governance-timeline-ui-smoke as the canonical scan governance timeline browser smoke target.'
)
requirePattern(
  makefile,
  /app-shell-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:app-shell-ui/,
  'Makefile must expose app-shell-ui-smoke as the canonical app shell UI browser smoke target.'
)
requirePattern(
  makefile,
  /agent-tasks-detail-selection-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:agent-tasks-detail-selection/,
  'Makefile must expose agent-tasks-detail-selection-ui-smoke as the canonical AgentTasks detail selection browser smoke target.'
)
requirePattern(
  packageJson,
  /"smoke:agent-chat-closure-rail":\s*"playwright test -c playwright\.agent-chat-closure-rail\.config\.ts"/,
  'package.json must expose the AgentChat closure rail Playwright browser smoke entrypoint.'
)
requirePattern(
  makefile,
  /agent-chat-closure-rail-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:agent-chat-closure-rail/,
  'Makefile must expose agent-chat-closure-rail-ui-smoke as the canonical AgentChat closure rail browser smoke target.'
)
requirePattern(
  makefile,
  /execution-tasks-detail-selection-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:execution-tasks-detail-selection/,
  'Makefile must expose execution-tasks-detail-selection-ui-smoke as the canonical ExecutionTasks detail selection browser smoke target.'
)
requirePattern(
  makefile,
  /artifacts-detail-selection-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:artifacts-detail-selection/,
  'Makefile must expose artifacts-detail-selection-ui-smoke as the canonical Artifacts detail selection browser smoke target.'
)
requirePattern(
  makefile,
  /p9-main-path-recoverable-error-states-batch3-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:p9-main-path-recoverable-error-states-batch3/,
  'Makefile must expose p9-main-path-recoverable-error-states-batch3-ui-smoke as the canonical P9 batch 3 browser smoke target.'
)
requirePattern(
  makefile,
  /p9-main-path-recoverable-error-states-batch4a-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:p9-main-path-recoverable-error-states-batch4a/,
  'Makefile must expose p9-main-path-recoverable-error-states-batch4a-ui-smoke as the canonical P9 batch 4A browser smoke target.'
)
requirePattern(
  makefile,
  /p9-main-path-recoverable-error-states-batch4b-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:p9-main-path-recoverable-error-states-batch4b/,
  'Makefile must expose p9-main-path-recoverable-error-states-batch4b-ui-smoke as the canonical P9 batch 4B browser smoke target.'
)
requirePattern(
  makefile,
  /model-config-recoverable-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:model-config-recoverable/,
  'Makefile must expose model-config-recoverable-ui-smoke as the canonical ModelConfig recoverable provider config browser smoke target.'
)
requirePattern(
  makefile,
  /audit-logs-detail-selection-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:audit-logs-detail-selection/,
  'Makefile must expose audit-logs-detail-selection-ui-smoke as the canonical AuditLogs detail selection browser smoke target.'
)
requirePattern(
  makefile,
  /ci-diagnostics-detail-selection-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:ci-diagnostics-detail-selection/,
  'Makefile must expose ci-diagnostics-detail-selection-ui-smoke as the canonical CI Diagnostics detail selection browser smoke target.'
)
requirePattern(
  makefile,
  /pr-reviews-detail-selection-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:pr-reviews-detail-selection/,
  'Makefile must expose pr-reviews-detail-selection-ui-smoke as the canonical PR Reviews detail selection browser smoke target.'
)
requirePattern(
  makefile,
  /issue-decomposition-detail-selection-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:issue-decomposition-detail-selection/,
  'Makefile must expose issue-decomposition-detail-selection-ui-smoke as the canonical IssueDecomposition detail selection browser smoke target.'
)
requirePattern(
  makefile,
  /report-autorepair-candidate-ui-smoke:[^\n]*\n\tcd web-console && npm run smoke:report-autorepair-candidate/,
  'Makefile must expose report-autorepair-candidate-ui-smoke as the canonical report-to-AutoRepair candidate browser smoke target.'
)
requirePattern(
  patchReadySmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5183\)/,
  'PATCH_READY browser smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  patchReadySmokeConfig,
  /testMatch:\s*\/patch-ready-smoke\\\.spec\\\.ts\//,
  'PATCH_READY browser smoke config must target only patch-ready-smoke.spec.ts.'
)
requirePattern(
  patchReadySmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?if \(!path\.startsWith\('\/api\/'\)\) \{[\s\S]*?await route\.continue\(\)[\s\S]*?return[\s\S]*?\}/,
  'PATCH_READY browser smoke must not intercept Vite source modules such as /src/api/*.ts.'
)
requirePattern(
  patchReadySmokeSpec,
  /unhandledApiRequests\.push\(`\$\{method\} \$\{path\}\$\{url\.search\}`\)[\s\S]*?status:\s*599/,
  'PATCH_READY browser smoke must fail closed for unmocked real /api requests.'
)
requirePattern(
  patchReadySmokeSpec,
  /expect\(network\.unhandledApiRequests,[\s\S]*?\)\.toEqual\(\[\]\)/,
  'PATCH_READY browser smoke must assert that every real /api request was mocked.'
)
requirePattern(
  patchReadySmokeSpec,
  /list response omitted repair #101/,
  'PATCH_READY browser smoke fallback assertion must document that the list intentionally omits the target repair.'
)
requirePattern(
  patchReadySmokeSpec,
  /getDetailFallbackCount\(\)[\s\S]*?toBeGreaterThanOrEqual\(1\)/,
  'PATCH_READY browser smoke must prove repairId deep links use detail fallback when the list omits the target repair.'
)
requirePattern(
  patchReadySmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'PATCH_READY browser smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  patchReadySmokeSpec,
  /document\.documentElement\.scrollWidth[\s\S]*document\.body\.scrollWidth[\s\S]*toBeLessThanOrEqual\(1\)/,
  'PATCH_READY browser smoke must assert no horizontal overflow at every viewport.'
)
requirePattern(
  patchReadySmokeSpec,
  /function expectLocatorTextNotClipped[\s\S]*?whiteSpace[\s\S]*?textOverflow[\s\S]*?not\.toBe\('ellipsis'\)[\s\S]*?function expectAutoRepairTableScrollerContained[\s\S]*?overflowX[\s\S]*?function assertAutoRepairDetailReadability[\s\S]*?reviewChecklist[\s\S]*?sourceBridge[\s\S]*?candidateReceipt[\s\S]*?function assertAutoRepairPrConfirmReadability[\s\S]*?sl-autorepair-pr-popconfirm/,
  'PATCH_READY browser smoke must assert detail, table scroller, candidate receipt and PR Popconfirm readability without clipped critical text.'
)
requirePattern(
  patchReadySmokeSpec,
  /installRuntimeGuards\(page\)[\s\S]*Runtime issues must be empty/,
  'PATCH_READY browser smoke must fail on console/page runtime errors.'
)
requirePattern(
  patchReadySmokeSpec,
  /viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)/,
  'PATCH_READY browser smoke evidence marker must include the viewport matrix.'
)
requirePattern(
  dashboardNextActionSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5187\)/,
  'Dashboard next action browser smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  dashboardNextActionSmokeConfig,
  /testMatch:\s*\/dashboard-next-action-smoke\\\.spec\\\.ts\//,
  'Dashboard next action browser smoke config must target only dashboard-next-action-smoke.spec.ts.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?if \(!path\.startsWith\('\/api\/'\)\) \{[\s\S]*?await route\.continue\(\)[\s\S]*?return[\s\S]*?\}/,
  'Dashboard next action browser smoke must not intercept Vite source modules such as /src/api/*.ts.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /\/api\/auth\/me[\s\S]*?\/api\/dashboard\/stats[\s\S]*?\/api\/dashboard\/recent-scans/,
  'Dashboard next action browser smoke must mock auth, dashboard stats and recent scan APIs.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /(?:unhandledApiRequests|activeUnhandledApiRequests\?)\.push\(`\$\{method\} \$\{path\}\$\{url\.search\}`\)[\s\S]*?status:\s*599/,
  'Dashboard next action browser smoke must fail closed for unmocked real /api requests.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /expect\(network\.unhandledApiRequests,[\s\S]*?\)\.toEqual\(\[\]\)/,
  'Dashboard next action browser smoke must assert that every real /api request was mocked.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'tablet', width: 1024, height: 768 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'Dashboard next action browser smoke must include the design-system 1440px, 1024px, 390px and 320px viewport matrix.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /document\.documentElement\.scrollWidth[\s\S]*document\.body\.scrollWidth[\s\S]*toBeLessThanOrEqual\(1\)/,
  'Dashboard next action browser smoke must assert no horizontal overflow at every viewport.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /installRuntimeGuards\(page\)[\s\S]*Runtime issues must be empty/,
  'Dashboard next action browser smoke must fail on console/page runtime errors.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /'恢复仪表盘数据'[\s\S]*?'接入第一个公开仓库'[\s\S]*?'跟踪运行中的扫描任务'[\s\S]*?'触发一次仓库扫描'[\s\S]*?'检查 code_chunks 生成状态'[\s\S]*?'复盘风险证据并生成修复候选'[\s\S]*?'进入代码问答复盘主链路'/,
  'Dashboard next action browser smoke must cover every recommendation branch including error, repository, scan, chunks, risk and QA states.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /clickNextActionAndAssertUrl[\s\S]*?dashboardCase\.primaryUrl[\s\S]*?dashboardCase\.secondaryUrl/,
  'Dashboard next action browser smoke must click primary and secondary buttons and assert their destination URLs.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /async function assertScanReportRoutePlane\([\s\S]*?\.sl-topbar-title[\s\S]*?toHaveText\('扫描报告'\)[\s\S]*?\.sl-topbar-plane[\s\S]*?toHaveText\('前台体验'\)[\s\S]*?getByRole\('heading', \{ name: '仓库逆向分析报告' \}\)[\s\S]*?\.sl-sider \.ant-menu-item-selected[\s\S]*?\.sl-mobile-nav[\s\S]*?\.ant-menu-item-selected[\s\S]*?toContainText\('项目与仓库'\)[\s\S]*?expectNoHorizontalOverflow/s,
  'Dashboard next action smoke must verify scan report topbar title, plane, H1, desktop parent menu, mobile Drawer selection and overflow after handoff.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /await expect\(page\)\.toHaveURL\(expectedUrl\)[\s\S]*?label === '打开报告'[\s\S]*?assertScanReportRoutePlane\(page, 'dashboardHandoff', viewportName\)[\s\S]*?await page\.goto\('\/dashboard'\)/,
  'Dashboard 打开报告 handoff must assert landing-page route-plane identity before returning to Dashboard, not only the URL.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /const scanReportDirectLoadViewports = viewportMatrix\.filter[\s\S]*?'desktop'[\s\S]*?'mobile'[\s\S]*?'narrow'[\s\S]*?for \(const viewport of scanReportDirectLoadViewports\)[\s\S]*?page\.goto\('\/scan-tasks\/24'\)[\s\S]*?assertScanReportRoutePlane\(page, 'directLoad', viewport\.name\)/s,
  'Dashboard route-plane evidence must include direct scan report loads at the explicit desktop, mobile and narrow viewport floor.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /INHERITED_SCAN_REPORT_ROUTE_PLANE_HANDOFF_OK[\s\S]*?dashboardHandoff:\s*scanReportDashboardHandoffProofs[\s\S]*?directLoad:\s*scanReportDirectLoadProofs[\s\S]*?topbarTitle:\s*'扫描报告'[\s\S]*?plane:\s*'前台体验'[\s\S]*?selectedMenuKey:\s*'\/projects'[\s\S]*?mobileDrawerSelected:[\s\S]*?viewports:\s*scanReportDirectLoadViewports\.map[\s\S]*?runtimeIssues:\s*issues\.length[\s\S]*?horizontalOverflow:\s*scanReportRoutePlaneProofs\.every/s,
  'Inherited scan report route-plane marker must expose Dashboard handoff, direct load, title, plane, parent menu, mobile Drawer, viewports, runtime and overflow evidence.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /aria-label="主链路证据成熟度"[\s\S]*?toHaveCount\(4\)[\s\S]*?aria-label="当前阻塞项"/,
  'Dashboard next action browser smoke must assert the four evidence maturity items and blocker region.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /commandDisabledReasons\?: string\[\][\s\S]*?\.sl-dashboard-command-disabled-reason[\s\S]*?toHaveCount\(dashboardCase\.commandDisabledReasons\.length\)[\s\S]*?disabled command reason width must stay within viewport[\s\S]*?reasonStyles\.overflow[\s\S]*?reasonStyles\.overflowWrap[\s\S]*?reasonStyles\.textOverflow[\s\S]*?reasonStyles\.whiteSpace/s,
  'Dashboard next action browser smoke must assert visible disabled command reasons, viewport containment and computed wrapping styles.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /type DashboardProductPlaneProof[\s\S]*?assertDashboardProductPlaneMap[\s\S]*?getByRole\('region', \{ name: '继承产品三平面（P0冻结）' \}\)[\s\S]*?front-office[\s\S]*?developer-console[\s\S]*?back-office[\s\S]*?expectedColumns = \(viewport\?\.width \|\| 0\) <= 720 \? 1 : \(viewport\?\.width \|\| 0\) <= 1200 \? 2 : 3[\s\S]*?DASHBOARD_THREE_PLANE_PRODUCT_STRUCTURE_READABILITY/,
  'Dashboard next action browser smoke must prove the front office, developer console and back-office product plane map is visible and responsive.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /type DashboardExecutiveBriefingProof[\s\S]*?assertDashboardExecutiveBriefing[\s\S]*?getByRole\('region', \{ name: '管理层决策简报' \}\)[\s\S]*?阶段进度[\s\S]*?继承链路状态[\s\S]*?风险阻塞[\s\S]*?当前项目任务[\s\S]*?P0-05 Baseline Slicing[\s\S]*?P0 Gate: NOT_READY[\s\S]*?不证明 P0 Gate 已通过[\s\S]*?expectedColumns = \(viewport\?\.width \|\| 0\) <= 720 \? 1 : \(viewport\?\.width \|\| 0\) <= 1200 \? 2 : 4[\s\S]*?DASHBOARD_EXECUTIVE_BRIEFING_DECISION_READABILITY/s,
  'Dashboard next action browser smoke must prove the executive briefing is visible, responsive and explicit about completion boundaries.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /expect\([\s\S]*?productPlaneProofs\.every\(proof => proof\.actionCount === 3\)[\s\S]*?\)\.toBe\(true\)[\s\S]*?productPlaneMap:\s*\{[\s\S]*?scope:\s*'DASHBOARD_THREE_PLANE_PRODUCT_STRUCTURE_READABILITY'[\s\S]*?surface:\s*'FRONT_OFFICE_DEVELOPER_CONSOLE_BACK_OFFICE'[\s\S]*?desktopColumns:[\s\S]*?tabletColumns:[\s\S]*?mobileColumns:[\s\S]*?narrowColumns:[\s\S]*?copyReadable:[\s\S]*?actionCount:\s*3,[\s\S]*?rbacCompleteClaim:[\s\S]*?productionDeploymentClaim:/,
  'Dashboard next action browser smoke must assert every product-plane proof has three actions and expose actionCount as numeric 3 in the marker.'
)
rejectPattern(
  dashboardNextActionSmokeSpec,
  /productPlaneMap:\s*\{[\s\S]*?actionCount:\s*productPlaneProofs\.every\(/,
  'Dashboard next action browser smoke marker actionCount must not regress from numeric 3 to a boolean aggregate.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /executiveBriefing:\s*\{[\s\S]*?scope:\s*'DASHBOARD_EXECUTIVE_BRIEFING_DECISION_READABILITY'[\s\S]*?signals:\s*\['阶段进度', '继承链路状态', '风险阻塞', '当前项目任务'\][\s\S]*?desktopColumns:[\s\S]*?tabletColumns:[\s\S]*?tabletPortraitColumns:[\s\S]*?mobileColumns:[\s\S]*?narrowColumns:[\s\S]*?copyReadable:[\s\S]*?projectActionAbsent:[\s\S]*?p0GatePassedClaim:[\s\S]*?vtsrMeasuredClaim:[\s\S]*?trustedAgentLoopCompleteClaim:[\s\S]*?productionReadyClaim:/,
  'Dashboard next action browser smoke marker must include executive briefing columns, readability and no completion overclaim evidence.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /viewportMatrix = \[[\s\S]*?width:\s*1440,\s*height:\s*900[\s\S]*?width:\s*1024,\s*height:\s*768[\s\S]*?width:\s*768,\s*height:\s*1024[\s\S]*?width:\s*390,\s*height:\s*844[\s\S]*?width:\s*320,\s*height:\s*740/,
  'Dashboard next action browser smoke must include desktop, landscape tablet, portrait tablet, mobile and narrow viewports.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /primaryUrl:\s*\/\\\/agent-chat\\\?handoff=code-understanding&source=DASHBOARD_CODE_QA_ENTRY&\//,
  'Dashboard next action browser smoke must prove the primary QA path opens the single AgentChat code-understanding handoff entry.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /DASHBOARD_NEXT_ACTION_SMOKE_OK[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?cases:\s*cases\.map[\s\S]*?nextActions:\s*cases\.map[\s\S]*?commandDisabledReasonCases:[\s\S]*?viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)/,
  'Dashboard next action browser smoke marker must include mocked-only status, unhandled API count, cases, next actions, disabled reason cases and viewport matrix.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /inflateSync[\s\S]*?inspectPngPixels[\s\S]*?distinctColorCount[\s\S]*?toBeGreaterThanOrEqual\(16\)/,
  'Dashboard next action browser smoke must decode screenshot PNG pixels and reject blank or near-empty visual evidence.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /page\.screenshot\(\{ path:\s*screenshotPath,\s*fullPage:\s*false \}\)[\s\S]*?test\.info\(\)\.attach\(screenshotName/,
  'Dashboard next action browser smoke must persist viewport screenshots as Playwright attachments.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /SOURCELENS_DASHBOARD_NEXT_ACTION_UI_ARTIFACT_DIR[\s\S]*?mkdir\(artifactDir,\s*\{ recursive:\s*true,\s*mode:\s*0o700 \}\)[\s\S]*?writeFile\(path\.join\(artifactDir,\s*screenshotName\),\s*screenshot,\s*\{ mode:\s*0o600 \}\)[\s\S]*?dashboard-next-action-ui-smoke\/\$\{screenshotName\}/,
  'Dashboard next action browser smoke must opt in to private release evidence screenshot artifact export.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /panelLeft[\s\S]*?panelRight[\s\S]*?panelBottom[\s\S]*?titleBottom[\s\S]*?primaryButtonBottom[\s\S]*?primaryButtonTextColor/,
  'Dashboard next action visual evidence must include viewport bounds and readable primary button text evidence.'
)
requirePattern(
  dashboardNextActionSmokeSpec,
  /visualEvidence\.push\(await captureDashboardVisualEvidence\(page,\s*dashboardCase,\s*viewport\)\)[\s\S]*?expect\(visualEvidence\)\.toHaveLength\(viewportMatrix\.length\)[\s\S]*?visualEvidence/,
  'Dashboard next action browser smoke marker must include captured visual evidence for every required viewport.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /visualEvidence[\s\S]*?artifact[\s\S]*?readFileSync\(artifactPath\)[\s\S]*?inspectPngPixels\(artifact\)[\s\S]*?record_expected_package_file "dashboard-next-action-ui-smoke\/dashboard-next-action-review-risk-report-1440x900\.png"[\s\S]*?record_expected_package_file "dashboard-next-action-ui-smoke\/dashboard-next-action-review-risk-report-320x740\.png"/,
  'Release evidence verifier must read archived Dashboard next action PNG artifacts, validate pixels, and add them to the package allowlist.'
)
requirePattern(
  releaseEvidenceScript,
  /SOURCELENS_DASHBOARD_NEXT_ACTION_UI_ARTIFACT_DIR="\$1"[\s\S]*?\$\{RUN_DIR\}\/dashboard-next-action-ui-smoke/,
  'Release evidence wrapper must pass a controlled Dashboard next action screenshot artifact directory only for release evidence runs.'
)
requirePattern(
  securityRegressionScript,
  /missing-png-artifact[\s\S]*?non-png-artifact[\s\S]*?mismatched-png-artifact[\s\S]*?blank-png-artifact[\s\S]*?unexpected-extra-png[\s\S]*?png-permission[\s\S]*?png-symlink[\s\S]*?missing-visual-evidence[\s\S]*?unsafe-screenshot-name/,
  'Security regression check must reject forged Dashboard next action visual evidence markers and invalid screenshot artifact packages.'
)
requirePattern(
  reportEvidenceDrawerSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5185\)/,
  'Report evidence drawer browser smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  reportEvidenceDrawerSmokeConfig,
  /testMatch:\s*\/report-evidence-drawer-smoke\\\.spec\\\.ts\//,
  'Report evidence drawer browser smoke config must target only report-evidence-drawer-smoke.spec.ts.'
)
requirePattern(
  reportEvidenceQaCitationSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5204\)/,
  'Report evidence QA citation browser smoke must use a dedicated default dev-server port instead of the drawer smoke port.'
)
requirePattern(
  reportEvidenceQaCitationSmokeConfig,
  /testMatch:\s*\/report-evidence-drawer-smoke\\\.spec\\\.ts\//,
  'Report evidence QA citation browser smoke config must target the shared report-evidence-drawer-smoke.spec.ts while the release verifier depends on both markers.'
)
rejectPattern(
  reportEvidenceQaCitationSmokeConfig,
  /report-evidence-drawer\.config/,
  'Report evidence QA citation browser smoke config must not import or re-export the drawer config.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function assertReportReviewGate[\s\S]*?getByRole\('region', \{ name: '报告复核门禁' \}\)[\s\S]*?data-review-gate-key[\s\S]*?report-readiness[\s\S]*?evidence-bundle[\s\S]*?code-knowledge[\s\S]*?repair-readiness[\s\S]*?audit-trace[\s\S]*?governance-timeline[\s\S]*?expectAllLocatorTextNotClipped\(gate\.locator\('\.sl-report-review-gate-item span'[\s\S]*?expectAllLocatorTextNotClipped\(gate\.locator\('\.sl-report-review-gate-item strong'[\s\S]*?expectAllLocatorTextNotClipped\(gate\.locator\('\.sl-report-review-gate-item p'[\s\S]*?expectNoHorizontalOverflow\(page, `\$\{viewportName\}:report-review-gate`\)/,
  'Report evidence drawer smoke must assert report review gate order, text wrapping and no horizontal overflow.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /REPORT_EVIDENCE_DRAWER_SMOKE_OK[\s\S]*?reviewGate:\s*\{[\s\S]*?visible:\s*reviewGateProofs\.every\(proof => proof\.visible\)[\s\S]*?gateCount:\s*Math\.min\(\.\.\.reviewGateProofs\.map\(proof => proof\.gateCount\)\)[\s\S]*?gateKeys:\s*reviewGateProofs\[0\]\?\.gateKeys \|\| \[\][\s\S]*?minReadyCount:\s*Math\.min\(\.\.\.reviewGateProofs\.map\(proof => proof\.readyCount\)\)[\s\S]*?mobile390Covered:\s*reviewGateProofs\.some\(proof => proof\.viewportName === 'mobile'\)[\s\S]*?narrow320Covered:\s*reviewGateProofs\.some\(proof => proof\.viewportName === 'narrow'\)[\s\S]*?textNotClipped:\s*reviewGateProofs\.every\(proof => proof\.textNotClipped\)[\s\S]*?noHorizontalOverflow:\s*reviewGateProofs\.every\(proof => proof\.noHorizontalOverflow\)/,
  'Report evidence drawer smoke marker must include report review gate proof.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?if \(!path\.startsWith\('\/api\/'\)\) \{[\s\S]*?await route\.continue\(\)[\s\S]*?return[\s\S]*?\}/,
  'Report evidence drawer browser smoke must not intercept Vite source modules such as /src/api/*.ts.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /unhandledApiRequests\.push\(`\$\{method\} \$\{path\}\$\{url\.search\}`\)[\s\S]*?status:\s*599/,
  'Report evidence drawer browser smoke must fail closed for unmocked real /api requests.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /expect\(network\.unhandledApiRequests,[\s\S]*?\)\.toEqual\(\[\]\)/,
  'Report evidence drawer browser smoke must assert that every real /api request was mocked.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'Report evidence drawer browser smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /document\.documentElement\.scrollWidth[\s\S]*document\.body\.scrollWidth[\s\S]*toBeLessThanOrEqual\(1\)/,
  'Report evidence drawer browser smoke must assert no horizontal overflow at every viewport.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /installRuntimeGuards\(page\)[\s\S]*Runtime issues must be empty/,
  'Report evidence drawer browser smoke must fail on console/page runtime errors.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /\/api\/projects\/\$\{projectId\}\/code-chunks\/search[\s\S]*?url\.searchParams\.get\('limit'\) === '3'/,
  'Report evidence drawer browser smoke must mock and identify the scan-bound drawer code_chunks query.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /expect\(drawerQueries\.length,[\s\S]*?\)\.toBe\(viewportMatrix\.length \* 2\)[\s\S]*?readyDrawerQueries[\s\S]*?gapDrawerQueries[\s\S]*?decodeURIComponent\(query\)\)\.toContain\(targetFile\)[\s\S]*?decodeURIComponent\(query\)\)\.toContain\(`:\$\{evidenceLineRange\}`\)[\s\S]*?decodeURIComponent\(query\)\)\.toContain\(gapEvidenceFile\)[\s\S]*?decodeURIComponent\(query\)\)\.toContain\(':99'\)/,
  'Report evidence drawer browser smoke must prove READY and GAP drawer code_chunks queries carry scanTaskId, limit=3, target files and line anchors.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /getByRole\('dialog', \{ name: '报告证据抽屉' \}\)[\s\S]*?getByRole\('region', \{ name: 'code_chunks 命中摘要' \}\)[\s\S]*?2 \/ 2 hits[\s\S]*?Score 91[\s\S]*?getByRole\('region', \{ name: '引用质量预检' \}\)[\s\S]*?引用质量预检[\s\S]*?getByRole\('region', \{ name: '报告证据交接包' \}\)[\s\S]*?Scan #\$\{scanTaskId\}[\s\S]*?targetFile[\s\S]*?2 hits[\s\S]*?91%[\s\S]*?PRIMARY 主证据已命中[\s\S]*?getByRole\('region', \{ name: '报告证据下一步动作' \}\)[\s\S]*?getByText\('READY', \{ exact: true \}\)[\s\S]*?const readyRepairAction = actionRail\.getByRole\('button', \{ name: '生成修复候选' \}\)[\s\S]*?toBeVisible\(\)[\s\S]*?toBeEnabled\(\)[\s\S]*?getByLabel\('报告证据修复门禁说明'\)[\s\S]*?修复门禁已开放/,
  'Report evidence drawer browser smoke must assert READY code_chunks summary, citation readiness, handoff package and repair-capable next action rail.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /function expectContainedInViewport[\s\S]*?function expectLocatorTextNotClipped[\s\S]*?function assertReportEvidenceDrawerReadability[\s\S]*?report-evidence-drawer-content[\s\S]*?\.sl-report-evidence-chunk-card[\s\S]*?报告证据决策摘要[\s\S]*?drawer-decision-summary[\s\S]*?drawer-decision-item-count[\s\S]*?drawer-decision-\$\{key\}-label[\s\S]*?drawer-decision-\$\{key\}-value[\s\S]*?drawer-decision-\$\{key\}-detail[\s\S]*?报告证据交接包[\s\S]*?报告证据下一步动作/,
  'Report evidence drawer browser smoke must assert drawer, code_chunks, citation readiness, decision summary labels/values/details, handoff and action rail containment/readability.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function assertPriorityRailAndOpenFirstEvidence\(page: Page, viewportName: string\)[\s\S]*?getByLabel\('报告证据优先阅读'\)[\s\S]*?data-priority-key="risk-evidence"[\s\S]*?data-priority-key="citation-readiness"[\s\S]*?data-priority-key="governance-blocker"[\s\S]*?getByRole\('button', \{ name: '查看证据' \}\)\.click\(\)[\s\S]*?getByRole\('dialog', \{ name: '报告证据抽屉' \}\)/,
  'Report evidence drawer browser smoke must open the first evidence drawer from the summary priority rail, not only from the quality tab.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /reportCitationQuality:\s*\{[\s\S]*?requiredCheckCount:\s*6[\s\S]*?boundCheckCount:\s*6[\s\S]*?sectionBindings:[\s\S]*?narrativeBindingStatus:\s*'ALL_BOUND'[\s\S]*?narrativeBindingCount:\s*6[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Report evidence drawer smoke fixture must include reportQuality.reportCitationQuality with section and narrative binding proof and no provider/LLM fact quality claim.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function assertReportCitationQualityPanel\(page: Page, viewportName: string\)[\s\S]*?getByRole\('region', \{ name: '报告引用质量' \}\)[\s\S]*?Report Citation Quality[\s\S]*?Citation quality[\s\S]*?Source diversity[\s\S]*?Narrative binding[\s\S]*?getByRole\('group', \{ name: '报告引用来源覆盖' \}\)[\s\S]*?Source coverage[\s\S]*?apiRoutes\/dbEntities[\s\S]*?API\/数据面[\s\S]*?扫描范围[\s\S]*?getByRole\('group', \{ name: '报告引用质量裁决依据' \}\)[\s\S]*?No overclaim[\s\S]*?details\.locator\('summary'\)[\s\S]*?detailInitiallyOpen[\s\S]*?toBe\(false\)[\s\S]*?toHaveAttribute\('open', ''\)[\s\S]*?只证明报告字段和扫描产物绑定，不证明 LLM 事实正确。[\s\S]*?expectNoHorizontalOverflow\(page, `\$\{viewportName\}:report-citation-quality`\)/,
  'Report evidence drawer smoke must assert the page-level report citation quality panel, source coverage, collapsible details, verdict basis, no-overclaim boundary and no overflow.'
)
requirePattern(
  css,
  /\.sl-report-recommended-step-gate\s*\{[\s\S]*?grid-column:\s*2 \/ -1;[\s\S]*?\.sl-report-recommended-step-gate-ready[\s\S]*?\.sl-report-recommended-step-gate-blocked[\s\S]*?\.sl-report-recommended-step-gate span,[\s\S]*?\.sl-report-recommended-step-gate strong\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;[\s\S]*?@media \(max-width:\s*720px\)[\s\S]*?\.sl-report-recommended-step-gate[\s\S]*?grid-column:\s*auto;/,
  'Scan report recommended next step gate reason must have dedicated wrapping styles and collapse safely on mobile.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function assertReportRecommendedNextStep\(page: Page, viewportName: string\)[\s\S]*?getByRole\('region', \{ name: '报告推荐下一步' \}\)[\s\S]*?getByLabel\('报告推荐动作门禁说明'\)[\s\S]*?推荐动作门禁已开放\|推荐动作门禁未开放[\s\S]*?gateStyles\.overflow[\s\S]*?gateStyles\.overflowWrap[\s\S]*?gateStyles\.textOverflow[\s\S]*?gateStyles\.whiteSpace[\s\S]*?expectNoHorizontalOverflow\(page, `\$\{viewportName\}:report-recommended-next-step`\)/,
  'Report evidence drawer smoke must assert recommended next step action gate reason visibility, wrapping style and no overflow.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /recommendedStep:\s*\{[\s\S]*?visible:\s*recommendedStepProofs\.every\(proof => proof\.visible\)[\s\S]*?stepKeys:\s*Array\.from\(new Set\(recommendedStepProofs\.map\(proof => proof\.stepKey \|\| ''\)\)\)[\s\S]*?gateVisible:\s*recommendedStepProofs\.every\(proof => proof\.gateVisible\)[\s\S]*?gateReadyVisible:\s*recommendedStepProofs\.some\(proof => proof\.gateReadyVisible\)[\s\S]*?gateReasonVisible:\s*recommendedStepProofs\.every\(proof => proof\.gateReasonVisible\)[\s\S]*?gateReasonStyleSafe:\s*recommendedStepProofs\.every\(proof => proof\.gateReasonStyleSafe\)[\s\S]*?mobile390Covered:\s*recommendedStepProofs\.some\(proof => proof\.viewportName === 'mobile'\)[\s\S]*?narrow320Covered:\s*recommendedStepProofs\.some\(proof => proof\.viewportName === 'narrow'\)[\s\S]*?noHorizontalOverflow:\s*recommendedStepProofs\.every\(proof => proof\.noHorizontalOverflow\)/,
  'Report evidence drawer smoke marker must include recommended next step action gate proof across mobile and narrow viewports.'
)
requirePattern(
  css,
  /\.sl-report-priority-rail[\s\S]*?\.sl-report-priority-grid[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)[\s\S]*?\.sl-report-priority-card strong[\s\S]*?overflow:\s*visible;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;[\s\S]*?\.sl-report-priority-card p[\s\S]*?overflow:\s*visible;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;[\s\S]*?\.sl-report-priority-meta[\s\S]*?overflow:\s*visible;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;[\s\S]*?@media \(max-width:\s*720px\)[\s\S]*?\.sl-report-priority-grid[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)[\s\S]*?\.sl-report-priority-actions \.ant-btn[\s\S]*?width:\s*100%[\s\S]*?@media \(max-width:\s*360px\)[\s\S]*?\.sl-report-priority-grid[\s\S]*?grid-template-columns:\s*1fr/,
  'Report evidence priority rail CSS must provide wrapping text and responsive 3/2/1-column layouts with full-width mobile buttons.'
)
requirePattern(
  css,
  /\.sl-report-priority-repair-gate\s*\{[\s\S]*?border:[\s\S]*?\.sl-report-priority-repair-gate-ready[\s\S]*?\.sl-report-priority-repair-gate-blocked[\s\S]*?\.sl-report-priority-repair-gate span,[\s\S]*?\.sl-report-priority-repair-gate strong\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;/,
  'Report evidence priority repair gate reasons must have dedicated visible wrapping styles.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function assertPriorityRailAndOpenFirstEvidence[\s\S]*?getByLabel\('首要风险证据 修复门禁说明'\)[\s\S]*?getByLabel\('引用预检 修复门禁说明'\)[\s\S]*?getByLabel\('治理闭环 修复门禁说明'\)[\s\S]*?修复门禁已开放[\s\S]*?文件级风险已绑定到当前扫描证据[\s\S]*?修复门禁未开放[\s\S]*?引用预检只证明 QA citation[\s\S]*?不等同于文件级修复证据[\s\S]*?治理闭环用于复核修复事件和审计责任链[\s\S]*?不替代文件级风险证据[\s\S]*?sl-report-priority-repair-gate span[\s\S]*?sl-report-priority-repair-gate strong/,
  'Report evidence drawer smoke must assert priority rail ready and blocked repair gate reasons are visible and readable.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /priorityRail:\s*\{[\s\S]*?repairGateReadyVisible:\s*priorityRailProofs\.every\(proof => proof\.repairGateReadyVisible\)[\s\S]*?repairGateBlockedVisible:\s*priorityRailProofs\.every\(proof => proof\.repairGateBlockedVisible\)[\s\S]*?repairGateReasonVisible:\s*priorityRailProofs\.every\(proof => proof\.repairGateReasonVisible\)/,
  'Report evidence drawer smoke marker must include priority rail repair gate visibility proof.'
)
requirePattern(
  css,
  /\.sl-report-evidence-chunk-meta strong[\s\S]*?overflow-wrap:\s*anywhere[\s\S]*?white-space:\s*normal[\s\S]*?word-break:\s*break-word/,
  'Report evidence drawer code_chunks file path must wrap instead of using ellipsis.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function openGapEvidenceDrawerAndAssert[\s\S]*?Missing code evidence[\s\S]*?0 \/ 0 hits[\s\S]*?暂无代码片段命中[\s\S]*?getByText\('GAP', \{ exact: true \}\)\.first\(\)[\s\S]*?getByRole\('region', \{ name: '报告证据交接包' \}\)[\s\S]*?gapEvidenceFile[\s\S]*?0 hits[\s\S]*?PRIMARY 主证据缺失[\s\S]*?只能追问\/复制，修复候选不放行[\s\S]*?getByRole\('region', \{ name: '报告证据下一步动作' \}\)[\s\S]*?先补证据，不直接生成修复候选[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)\)\.toHaveCount\(0\)[\s\S]*?getByRole\('button', \{ name: '定位修复文件' \}\)\)\.toBeVisible\(\)[\s\S]*?getByRole\('button', \{ name: '定位修复文件' \}\)\)\.toBeDisabled\(\)[\s\S]*?getByLabel\('报告证据修复门禁说明'\)[\s\S]*?修复门禁未开放[\s\S]*?缺少可用 code_chunks 主证据/,
  'Report evidence drawer browser smoke must assert GAP handoff evidence keeps disabled file-localization action without exposing repair candidate creation.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /REPORT_EVIDENCE_DRAWER_SMOKE_OK[\s\S]*?drawerQueryCount:\s*drawerQueries\.length[\s\S]*?readyDrawerQueryCount:\s*readyDrawerQueries\.length[\s\S]*?gapDrawerQueryCount:\s*gapDrawerQueries\.length[\s\S]*?drawerActionRail:\s*\{[\s\S]*?readyVisible:\s*true[\s\S]*?gapVisible:\s*true[\s\S]*?readyRepairActionVisible:\s*true[\s\S]*?readyRepairActionEnabled:\s*true[\s\S]*?gapRepairCreationActionHidden:\s*true[\s\S]*?gapLocalizationActionVisible:\s*true[\s\S]*?gapLocalizationActionDisabled:\s*true[\s\S]*?repairGateReasonVisible:\s*gapEvidenceProofs\.every\(proof => proof\.repairGateBlockedReasonVisible\)[\s\S]*?mainPathGuide:\s*\{[\s\S]*?visible:\s*mainPathGuideProofs\.every\(proof => proof\.visible\)[\s\S]*?stepCount:\s*Math\.min\(\.\.\.mainPathGuideProofs\.map\(proof => proof\.stepCount\)\)[\s\S]*?order:\s*mainPathGuideProofs\[0\]\?\.order \|\| \[\][\s\S]*?labels:\s*mainPathGuideProofs\[0\]\?\.labels \|\| \[\][\s\S]*?mobile390Covered:\s*mainPathGuideProofs\.some\(proof => proof\.viewportName === 'mobile'\)[\s\S]*?narrow320Covered:\s*mainPathGuideProofs\.some\(proof => proof\.viewportName === 'narrow'\)[\s\S]*?noHorizontalOverflow:\s*mainPathGuideProofs\.every\(proof => proof\.noHorizontalOverflow\)[\s\S]*?actionBoard:\s*\{[\s\S]*?visible:\s*actionBoardProofs\.every\(proof => proof\.visible\)[\s\S]*?actionCount:\s*Math\.min\(\.\.\.actionBoardProofs\.map\(proof => proof\.actionCount\)\)[\s\S]*?actionKeys:\s*actionBoardProofs\[0\]\?\.actionKeys \|\| \[\][\s\S]*?codeQaLinkVisible:\s*actionBoardProofs\.every\(proof => proof\.codeQaLinkVisible\)[\s\S]*?repairCandidateVisible:\s*actionBoardProofs\.every\(proof => proof\.repairCandidateVisible\)[\s\S]*?mobile390Covered:\s*actionBoardProofs\.some\(proof => proof\.viewportName === 'mobile'\)[\s\S]*?narrow320Covered:\s*actionBoardProofs\.some\(proof => proof\.viewportName === 'narrow'\)[\s\S]*?noHorizontalOverflow:\s*actionBoardProofs\.every\(proof => proof\.noHorizontalOverflow\)[\s\S]*?priorityRail:\s*\{[\s\S]*?visible:\s*priorityRailProofs\.every\(proof => proof\.visible\)[\s\S]*?firstEvidenceOpensDrawer:\s*priorityRailProofs\.every\(proof => proof\.firstEvidenceOpensDrawer\)[\s\S]*?readyActionVisible:\s*priorityRailProofs\.every\(proof => proof\.readyActionVisible\)[\s\S]*?gapRepairHiddenOrDisabled:\s*gapEvidenceProofs\.every\(proof => proof\.gapRepairHiddenOrDisabled\)[\s\S]*?mobile390Covered:\s*priorityRailProofs\.some\(proof => proof\.viewportName === 'mobile'\)[\s\S]*?narrow320Covered:\s*priorityRailProofs\.some\(proof => proof\.viewportName === 'narrow'\)[\s\S]*?noHorizontalOverflow:\s*priorityRailProofs\.every\(proof => proof\.noHorizontalOverflow\)[\s\S]*?codeChunksSearchRedaction:\s*\{[\s\S]*?rawReportSecretsHidden:\s*drawerQueries\.every[\s\S]*?redactionMarkerVisibleInReadyQuery:\s*readyDrawerQueries\.every[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*network\.unhandledApiRequests\.length[\s\S]*?viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)/,
  'Report evidence drawer browser smoke marker must include action rail READY/GAP proof, mocked-only status, unhandled API count and viewport matrix.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /reportApiDbTableReadability:\s*\{[\s\S]*?surface:\s*'SCAN_TASK_DETAIL_REPORT_API_DB_TABLE_EVIDENCE_FIELDS'[\s\S]*?apiPathVisible:\s*apiDbTableReadabilityProofs\.every\(proof => proof\.apiPathVisible\)[\s\S]*?apiControllerVisible:\s*apiDbTableReadabilityProofs\.every\(proof => proof\.apiControllerVisible\)[\s\S]*?dbFileVisible:\s*apiDbTableReadabilityProofs\.every\(proof => proof\.dbFileVisible\)[\s\S]*?mobile390Covered:\s*apiDbTableReadabilityProofs\.some\(proof => proof\.viewportName === 'mobile'\)[\s\S]*?narrow320Covered:\s*apiDbTableReadabilityProofs\.some\(proof => proof\.viewportName === 'narrow'\)[\s\S]*?textNotClipped:\s*apiDbTableReadabilityProofs\.every\(proof => proof\.textNotClipped\)[\s\S]*?noHorizontalOverflow:\s*apiDbTableReadabilityProofs\.every\(proof => proof\.noHorizontalOverflow\)/,
  'Report evidence drawer browser smoke marker must include ScanTaskDetail API/DB table evidence readability proof across mobile and narrow viewports.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /reportGovernanceTimelineReadability:\s*\{[\s\S]*?surface:\s*'SCAN_TASK_DETAIL_REPORT_GOVERNANCE_TIMELINE'[\s\S]*?visible:\s*governanceTimelineReadabilityProofs\.every\(proof => proof\.visible\)[\s\S]*?cardCount:\s*Math\.min\(\.\.\.governanceTimelineReadabilityProofs\.map\(proof => proof\.cardCount\)\)[\s\S]*?stageCount:\s*Math\.min\(\.\.\.governanceTimelineReadabilityProofs\.map\(proof => proof\.stageCount\)\)[\s\S]*?eventVisible:\s*governanceTimelineReadabilityProofs\.every\(proof => proof\.eventVisible\)[\s\S]*?gateReasonVisible:\s*governanceTimelineReadabilityProofs\.every\(proof => proof\.gateReasonVisible\)[\s\S]*?mobile390Covered:\s*governanceTimelineReadabilityProofs\.some\(proof => proof\.viewportName === 'mobile'\)[\s\S]*?narrow320Covered:\s*governanceTimelineReadabilityProofs\.some\(proof => proof\.viewportName === 'narrow'\)[\s\S]*?textNotClipped:\s*governanceTimelineReadabilityProofs\.every\(proof => proof\.textNotClipped\)[\s\S]*?noHorizontalOverflow:\s*governanceTimelineReadabilityProofs\.every\(proof => proof\.noHorizontalOverflow\)/,
  'Report evidence drawer browser smoke marker must include ScanTaskDetail governance timeline readability proof across mobile and narrow viewports.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK[\s\S]*?reportCitationQuality:\s*\{[\s\S]*?surface:\s*'SCAN_TASK_DETAIL_REPORT_CITATION_QUALITY_PANEL'[\s\S]*?visibleAcrossViewports:\s*reportCitationQualityProofs\.every\(proof => proof\.visible\)[\s\S]*?sourceDiversityVisible:\s*reportCitationQualityProofs\.every\(proof => proof\.sourceDiversityVisible\)[\s\S]*?sourceCoverageVisible:\s*reportCitationQualityProofs\.every\(proof => proof\.sourceCoverageVisible\)[\s\S]*?sourceSectionCount:\s*Math\.min\(\.\.\.reportCitationQualityProofs\.map\(proof => proof\.sourceSectionCount\)\)[\s\S]*?sourceSections:\s*Array\.from\(new Set\(reportCitationQualityProofs\.flatMap\(proof => proof\.sourceSections\)\)\)\.sort\(\)[\s\S]*?sourceSectionLabels:\s*Array\.from\(new Set\(reportCitationQualityProofs\.flatMap\(proof => proof\.sourceSectionLabels\)\)\)\.sort\(\)[\s\S]*?sourceSectionOrder:\s*reportCitationQualityProofs\[0\]\?\.sourceSectionOrder \|\| \[\][\s\S]*?sourceSectionLabelOrder:\s*reportCitationQualityProofs\[0\]\?\.sourceSectionLabelOrder \|\| \[\][\s\S]*?detailToggleVisible:\s*reportCitationQualityProofs\.every\(proof => proof\.detailToggleVisible\)[\s\S]*?detailDefaultCollapsed:\s*reportCitationQualityProofs\.every\(proof => proof\.detailDefaultCollapsed\)[\s\S]*?detailOpens:\s*reportCitationQualityProofs\.every\(proof => proof\.detailOpens\)[\s\S]*?verdictVisible:\s*reportCitationQualityProofs\.every\(proof => proof\.verdictVisible\)[\s\S]*?verdictItemCount:\s*Math\.min\(\.\.\.reportCitationQualityProofs\.map\(proof => proof\.verdictItems\)\)[\s\S]*?verdictBoundaryVisible:\s*reportCitationQualityProofs\.every\(proof => proof\.verdictBoundary\)[\s\S]*?boundaryVisible:\s*reportCitationQualityProofs\.every\(proof => proof\.boundaryVisible\)[\s\S]*?noOverclaim:\s*reportCitationQualityProofs\.every\(proof => proof\.noOverclaim\)[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Report evidence QA citation smoke marker must expose report citation quality source coverage and verdict proof without provider or LLM fact quality claims.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /layoutDensity:\s*\{[\s\S]*?mobile390Covered[\s\S]*?narrow320Covered[\s\S]*?drawerContained[\s\S]*?codeChunksContained[\s\S]*?citationReadinessContained[\s\S]*?decisionSummaryContained[\s\S]*?handoffSummaryContained[\s\S]*?actionRailContained[\s\S]*?noHorizontalOverflow[\s\S]*?mobileReadability:\s*\{[\s\S]*?criticalTextsWrap[\s\S]*?targetFileNotClipped[\s\S]*?chunkEvidenceNotClipped[\s\S]*?readinessTextNotClipped[\s\S]*?decisionSummaryNotClipped[\s\S]*?handoffTextNotClipped[\s\S]*?actionButtonsNotClipped/,
  'Report evidence drawer browser smoke marker must include layoutDensity and mobileReadability proof fields.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /method === 'POST' && path === `\/api\/projects\/\$\{projectId\}\/qa`[\s\S]*?qaRequests\.push\(payload\)[\s\S]*?wantsUnverifiedCitation[\s\S]*?wantsClaimCitationNoiseBoundary[\s\S]*?wantsReviewCitation[\s\S]*?wantsFileAnchorDrift[\s\S]*?wantsContextOnlyReview[\s\S]*?groundingStatus:\s*wantsContextOnlyReview \? 'PARTIAL' : 'VERIFIED'[\s\S]*?citationEnforcementStatus:\s*wantsContextOnlyReview \? 'RETRY_FAILED' : 'DIRECT_VERIFIED'[\s\S]*?citationCoverage[\s\S]*?coverageScope:\s*wantsFileAnchorDrift \? 'ALL' : 'PRIMARY'[\s\S]*?evidenceRoleDistribution:\s*\{[\s\S]*?status:\s*wantsFileAnchorDrift \? 'CONTEXT_ONLY' : 'MIXED_PRIMARY_CONTEXT'[\s\S]*?sourceEvidenceMatchType:\s*wantsFileAnchorDrift \? 'REPORT_FILE_ANCHOR' : 'REPORT_LINE_ANCHOR'[\s\S]*?answerCitations/,
  'Report evidence QA citation smoke must mock verified, unverified and REPORT_FILE_ANCHOR line-mismatch context-only QA responses with answer-level citations.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function openQaFromEvidenceAndAssert\(page: Page, viewportName: string\)[\s\S]*?getByRole\('button', \{ name: '基于此证据追问' \}\)\.click\(\)[\s\S]*?decodedUrl[\s\S]*?reportEvidenceSafeMarker[\s\S]*?decodedUrl[\s\S]*?'\[REDACTED\]'[\s\S]*?for \(const secret of forbiddenReportEvidenceSecretSnippets\)[\s\S]*?decodedUrl[\s\S]*?not\.toContain\(secret\)[\s\S]*?getByLabel\('报告证据上下文'\)[\s\S]*?报告证据来源桥[\s\S]*?evidenceTitle[\s\S]*?reportEvidenceSafeMarker[\s\S]*?'\[REDACTED\]'[\s\S]*?not\.toContainText\(secret\)[\s\S]*?evidenceLineRange[\s\S]*?getByRole\('button', \{ name: '回到扫描报告' \}\)[\s\S]*?getByRole\('button', \{ name: '重新检索证据' \}\)[\s\S]*?getByRole\('button', \{ name: '复制证据引用' \}\)[\s\S]*?qaResponse\.request\(\)\.postData\(\)[\s\S]*?qaRequestPayload\.evidenceRef\?\.filePath[\s\S]*?qaRequestPayload\.evidenceRef\?\.title[\s\S]*?qaRequestPayload\.evidenceRef\?\.lineNumber[\s\S]*?toBeUndefined\(\)[\s\S]*?qaRequestPayload\.evidenceRef\?\.startLine[\s\S]*?qaRequestPayload\.evidenceRef\?\.endLine[\s\S]*?qaData\.sourceEvidenceRef\?\.title[\s\S]*?qaData\.sourceEvidenceRef\?\.lineNumber[\s\S]*?toBeUndefined\(\)[\s\S]*?qaData\.sourceEvidenceRef\?\.startLine[\s\S]*?qaData\.sourceEvidenceRef\?\.endLine[\s\S]*?getByLabel\('回答引用证据'\)/,
  'Report evidence QA citation smoke must click from the drawer into QA, assert redacted source bridge URL/UI/actions plus title/line request and response binding, and verify visible answer citations.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /expect\(network\.qaRequests\.length,[\s\S]*?\)\.toBe\(viewportMatrix\.length \* 6\)[\s\S]*?request\.evidenceRef\?\.filePath[\s\S]*?request\.evidenceRef\?\.category[\s\S]*?request\.evidenceRef\?\.source[\s\S]*?request\.evidenceRef\?\.title[\s\S]*?request\.evidenceRef\?\.lineNumber/,
  'Report evidence QA citation smoke must prove success, unverified, REPORT_FILE_ANCHOR and claim role drift evidence-bound QA requests per viewport.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /test\('ScanTaskDetail evidence drawer loads scan-bound code_chunks summary'[\s\S]*?test\.setTimeout\(300_000\)[\s\S]*?for \(const viewport of viewportMatrix\)[\s\S]*?qaProofs\.push\(await openQaFromEvidenceAndAssert[\s\S]*?unverifiedQaProofs\.push\(await submitUnverifiedQaAndAssert[\s\S]*?claimCitationNoiseBoundaryProofs\.push\(await submitUnverifiedQaAndAssert[\s\S]*?fileAnchorDriftQaProofs\.push\(await submitFileAnchorDriftQaAndAssert[\s\S]*?claimRoleDistributionMissingProofs\.push\(await submitClaimRoleDistributionDriftQaAndAssert[\s\S]*?claimRoleDistributionMismatchProofs\.push\(await submitClaimRoleDistributionDriftQaAndAssert[\s\S]*?viewportMatrix\.length \* 6/,
  'Report evidence drawer long smoke must keep the five-viewport, six-QA-request coverage under a 300000ms total timeout.'
)
rejectPattern(
  reportEvidenceDrawerSmokeSpec,
  /test\.setTimeout\(90_000\)/,
  'Report evidence drawer long smoke must not regress to the insufficient 90000ms total timeout.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function openQaFromEvidenceAndAssert[\s\S]*?page\.waitForResponse\([\s\S]*?timeout:\s*15_000[\s\S]*?async function submitUnverifiedQaAndAssert[\s\S]*?page\.waitForResponse\([\s\S]*?timeout:\s*15_000[\s\S]*?async function submitFileAnchorDriftQaAndAssert[\s\S]*?page\.waitForResponse\([\s\S]*?timeout:\s*15_000[\s\S]*?async function submitClaimRoleDistributionDriftQaAndAssert[\s\S]*?page\.waitForResponse\([\s\S]*?timeout:\s*15_000/,
  'Report evidence drawer smoke must retain the 15-second response timeout on every QA response waiter.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function submitUnverifiedQaAndAssert(?=[\s\S]*?mode: 'uncited' \| 'fake-noise')(?=[\s\S]*?未验证态回归)(?=[\s\S]*?假引用噪声)(?=[\s\S]*?evidenceRef\?\.filePath)(?=[\s\S]*?'PARTIAL')(?=[\s\S]*?'RETRY_FAILED')(?=[\s\S]*?citedByAnswer\s*===\s*false)(?=[\s\S]*?引用需复核)(?=[\s\S]*?引用需人工复核)(?=[\s\S]*?候选证据)/,
  'Report evidence QA citation smoke must assert visible PARTIAL/RETRY_FAILED unverified citation state.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function submitFileAnchorDriftQaAndAssert\(page: Page, viewportName: string\)(?=[\s\S]*?文件锚点漂移)(?=[\s\S]*?REPORT_FILE_ANCHOR)(?=[\s\S]*?toBe\('PARTIAL'\))(?=[\s\S]*?toBe\('RETRY_FAILED'\))(?=[\s\S]*?coverageScope[\s\S]*?toBe\('ALL'\))(?=[\s\S]*?primaryEvidenceCount[\s\S]*?toBe\(0\))(?=[\s\S]*?evidenceRoleDistribution\?\.status[\s\S]*?toBe\('CONTEXT_ONLY'\))(?=[\s\S]*?claimCitationCoverage\.status[\s\S]*?toBe\('REVIEW'\))(?=[\s\S]*?claimRoleDistribution\.status[\s\S]*?toBe\('CONTEXT_ONLY'\))(?=[\s\S]*?requiredPrimaryBoundClaimCount[\s\S]*?toBe\(0\))(?=[\s\S]*?getByText\('不可直接采信'\))(?=[\s\S]*?getByText\('BLOCKED', \{ exact: true \}\))(?=[\s\S]*?getByText\('上下文引用可复核'\))(?=[\s\S]*?getByLabel\('上下文引用缺口'\))(?=[\s\S]*?getByLabel\('来源定位可信度'\))(?=[\s\S]*?getByText\('来源定位需复核', \{ exact: true \}\))(?=[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)\)\.toHaveCount\(0\))/,
  'Report evidence QA citation smoke must assert REPORT_FILE_ANCHOR line mismatch downgrades to context-only BLOCKED with no repair candidate action.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function submitClaimRoleDistributionDriftQaAndAssert\(page: Page, viewportName: string, mode: 'missing' \| 'mismatch'\)[\s\S]*?主张角色分布缺失[\s\S]*?主张角色计数矛盾[\s\S]*?REPORT_LINE_ANCHOR[\s\S]*?claimCitationCoverage\.status[\s\S]*?toBe\('READY'\)[\s\S]*?roleDistributionPresent[\s\S]*?toBe\(false\)[\s\S]*?claimRoleDistribution\.status[\s\S]*?toBe\('PRIMARY_BOUND'\)[\s\S]*?Object\.values\(mismatchFlags\)\.some\(Boolean\)[\s\S]*?getByText\('需要人工复核'\)[\s\S]*?getByText\('REVIEW', \{ exact: true \}\)[\s\S]*?getByText\('主张引用需要复核'\)[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)\)\.toHaveCount\(0\)/,
  'Report evidence QA citation smoke must assert missing and mismatched claim role distribution downgrade READY parent coverage to REVIEW with no repair action.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /claimCitationCoverage[\s\S]*?toBe\('READY'\)[\s\S]*?主张引用质量[\s\S]*?主张已绑定引用[\s\S]*?claimCitationCoverage[\s\S]*?toBe\('REVIEW'\)[\s\S]*?主张引用需要复核/,
  'Report evidence QA citation smoke must assert verified READY and unverified REVIEW claim citation quality in the UI.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /getByLabel\('QA 可信度摘要'\)\.first\(\)[\s\S]*?可采信并进入修复复核[\s\S]*?可信度结论[\s\S]*?getByLabel\('来源定位可信度'\)\.first\(\)[\s\S]*?来源定位可信[\s\S]*?sourceLocationConfidenceReadyVisible[\s\S]*?getByLabel\('QA 可信度摘要'\)\.last\(\)[\s\S]*?不可直接采信/,
  'Report evidence QA citation smoke must assert the user-readable QA trust summary and source location confidence in verified and unverified paths.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /function assertQaDeepEvidenceCardReadability\(page: Page, viewportName: string, mode: 'ready' \| 'review'\)[\s\S]*?\.sl-qa-source-receipt[\s\S]*?\.sl-qa-source-receipt-head strong[\s\S]*?\.sl-qa-source-receipt-ref span[\s\S]*?\.sl-qa-source-receipt-tags \.ant-tag[\s\S]*?getByLabel\('来源定位可信度'\)[\s\S]*?\.sl-qa-source-location-confidence-head strong[\s\S]*?\.sl-qa-source-location-confidence-metrics strong[\s\S]*?\.sl-qa-source-location-confidence-checks \.ant-tag[\s\S]*?\.sl-qa-source-match-release[\s\S]*?\.sl-qa-source-match-release-grid strong[\s\S]*?\.sl-qa-source-match-release-checks strong[\s\S]*?\.sl-qa-source-match-release-next/,
  'Report evidence QA citation smoke must include deep evidence card containment and text-not-clipped assertions for source receipt, source location confidence and source file match release.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /const deepEvidenceReadability = await assertQaDeepEvidenceCardReadability\(page, viewportName, 'ready'\)[\s\S]*?deepEvidenceReadability[\s\S]*?const deepEvidenceReadability = await assertQaDeepEvidenceCardReadability\(page, viewportName, 'review'\)[\s\S]*?deepEvidenceReadability/,
  'Report evidence QA citation smoke must run deep evidence readability assertions in both READY and FILE_ANCHOR REVIEW paths.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /getByLabel\('跨文件引用摘要'\)\.first\(\)[\s\S]*?跨文件引用结论[\s\S]*?跨文件引用可采信[\s\S]*?上下文缺口 1 条 \/ 1 文件[\s\S]*?上下文引用缺口[\s\S]*?getByLabel\('跨文件引用摘要'\)\.last\(\)[\s\S]*?跨文件引用不足/,
  'Report evidence QA citation smoke must assert the cross-file citation summary in verified and unverified paths.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /crossFileCitationSummary:\s*\{[\s\S]*?qaProofs\.every\(proof => proof\.crossFileSummaryVisible\)[\s\S]*?contextGapVisible[\s\S]*?minUncitedContextEvidenceCount[\s\S]*?minUncitedContextEvidenceFileCount[\s\S]*?minEvidenceFileCount[\s\S]*?minRequiredPrimaryBoundClaimCount[\s\S]*?unverifiedCitation:\s*\{[\s\S]*?crossFileCitationSummary:\s*\{[\s\S]*?unverifiedQaProofs\.every\(proof => proof\.crossFileSummaryVisible\)[\s\S]*?maxCitedEvidenceFileCount[\s\S]*?maxRequiredPrimaryBoundClaimCount/,
  'Report evidence QA citation marker must include verified and unverified cross-file citation summary proof fields.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /const verifiedAndUnverifiedQaRequestCount = qaProofs\.length \+ unverifiedQaProofs\.length[\s\S]*?const fileAnchorDriftQaRequestCount = fileAnchorDriftQaProofs\.length[\s\S]*?REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK[\s\S]*?qaRequestCount:\s*verifiedAndUnverifiedQaRequestCount[\s\S]*?qaTotalRequestCount:\s*network\.qaRequests\.length[\s\S]*?mockedApiOnly:\s*true[\s\S]*?qaFromEvidence:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?citationCount[\s\S]*?citationCoverage:\s*\{[\s\S]*?minRepairCandidateCount[\s\S]*?minUniqueEvidenceFileCount[\s\S]*?minCitedEvidenceFileCount[\s\S]*?minPrimaryEvidenceFileCount[\s\S]*?minCitedPrimaryEvidenceFileCount[\s\S]*?minRequiredEvidenceFileCount[\s\S]*?minCitedRequiredEvidenceFileCount[\s\S]*?coverageScopes[\s\S]*?evidenceRoleDistribution:\s*\{[\s\S]*?minRoleCount[\s\S]*?minFileEntryCount[\s\S]*?claimCitationCoverage:\s*\{[\s\S]*?readyForRepair:\s*qaProofs\.every\(proof => proof\.claimReadyForRepair\)[\s\S]*?readinessReasons:\s*Array\.from\(new Set\(qaProofs\.map\(proof => proof\.claimReadinessReason\)\.filter\(Boolean\)\)\)\.sort\(\)[\s\S]*?minClaimCoveragePercent[\s\S]*?maxInvalidCitationClaimCount[\s\S]*?minValidCitationFileCount[\s\S]*?minRequiredClaimCitationFileCount[\s\S]*?roleDistribution:\s*\{[\s\S]*?minRequiredPrimaryBoundClaimCount[\s\S]*?minRequiredPrimaryFileCount[\s\S]*?groundingStatuses[\s\S]*?citationEnforcementStatuses[\s\S]*?citationEnforcementReasons[\s\S]*?citedChunkCount[\s\S]*?evidenceRef:\s*\{[\s\S]*?requestBound:\s*true[\s\S]*?responseBound:\s*true[\s\S]*?contextVisible:\s*true[\s\S]*?filePath:\s*targetFile[\s\S]*?lineNumber:\s*null[\s\S]*?lineRange:\s*evidenceLineRange[\s\S]*?startLine:\s*evidenceStartLine[\s\S]*?endLine:\s*evidenceEndLine[\s\S]*?category:\s*evidenceCategory[\s\S]*?source:\s*evidenceSource[\s\S]*?title:\s*evidenceTitle[\s\S]*?repairEvidenceGate:\s*\{[\s\S]*?readyVisible:\s*true[\s\S]*?sourceEvidenceMatchType:\s*'REPORT_LINE_ANCHOR'[\s\S]*?unverifiedCitation:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?citationCoverage:\s*\{[\s\S]*?minRepairCandidateCount[\s\S]*?minUniqueEvidenceFileCount[\s\S]*?maxCitedEvidenceFileCount[\s\S]*?minPrimaryEvidenceFileCount[\s\S]*?maxCitedPrimaryEvidenceFileCount[\s\S]*?minRequiredEvidenceFileCount[\s\S]*?maxCitedRequiredEvidenceFileCount[\s\S]*?coverageScopes[\s\S]*?evidenceRoleDistribution:\s*\{[\s\S]*?maxCitedPrimaryFileCount[\s\S]*?minFileEntryCount[\s\S]*?claimCitationCoverage:\s*\{[\s\S]*?minClaimCoveragePercent[\s\S]*?maxUncitedRequiredClaimCount[\s\S]*?maxValidCitationFileCount[\s\S]*?maxRequiredClaimCitationFileCount[\s\S]*?roleDistribution:\s*\{[\s\S]*?maxRequiredPrimaryBoundClaimCount[\s\S]*?maxRoleCount[\s\S]*?groundingStatuses[\s\S]*?citationEnforcementStatuses[\s\S]*?uncitedCandidateCount[\s\S]*?evidenceRefRequestBound:\s*true[\s\S]*?evidenceRefResponseBound:\s*true[\s\S]*?repairEvidenceGateBlockedVisible:\s*true[\s\S]*?fileAnchorDrift:\s*\{[\s\S]*?requestCount:\s*fileAnchorDriftQaRequestCount[\s\S]*?sourceEvidenceMatchTypes[\s\S]*?citationCoverage:\s*\{[\s\S]*?coverageScopes[\s\S]*?maxPrimaryEvidenceCount[\s\S]*?maxRepairCandidateCount[\s\S]*?evidenceRoleDistribution[\s\S]*?claimCitationCoverage[\s\S]*?maxRequiredPrimaryBoundClaimCount[\s\S]*?maxRequiredPrimaryFileCount[\s\S]*?minRequiredContextOnlyClaimCount[\s\S]*?repairEvidenceGateBlockedVisible[\s\S]*?trustSummaryBlockedVisible[\s\S]*?crossFileSummaryContextGapVisible[\s\S]*?latestNextActionRepairHidden[\s\S]*?latestCitationRepairHidden[\s\S]*?fullReleaseAuthorityRefreshed:\s*false/,
  'Report evidence QA citation smoke marker must include verified and unverified citation file distribution, evidence role distribution, claim citation, grounding, enforcement, evidenceRef and full-release boundary proof fields.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence\.citationEnforcementReasons must be a non-empty array[\s\S]*?DIRECT_VERIFIED[\s\S]*?RETRY_VERIFIED[\s\S]*?FALLBACK_PRIMARY_CITED[\s\S]*?PUBLIC_REPO_UI_SMOKE_OK qaFromEvidence\.citationEnforcementReasons must prove successful citation enforcement reasons/,
  'Release verifier must hard-require public repo UI qaFromEvidence.citationEnforcementReasons with a successful reason allowlist.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /const allowedCitationEnforcementReasons = new Set\(\["DIRECT_VERIFIED", "RETRY_VERIFIED", "FALLBACK_PRIMARY_CITED"\]\)[\s\S]*?QA citation citationEnforcementReasons must be a non-empty array[\s\S]*?allowedCitationEnforcementReasons\.has\(reason\)[\s\S]*?QA citation citationEnforcementReasons must prove successful citation enforcement reasons/,
  'Release verifier must hard-require report evidence QA citationEnforcementReasons with the shared successful reason allowlist.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /relationAwareEvidenceReason:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?marker:\s*'Graph relation:'[\s\S]*?minCitationReasonCount[\s\S]*?minRetrievedChunkReasonCount[\s\S]*?adjacentContextReasonVisible[\s\S]*?uiReasonVisible[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Report evidence QA citation smoke marker must expose relation-aware graph evidence reason proof fields.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /relationAwareEvidenceReason[\s\S]*?QA citation relationAwareEvidenceReason\.status must be OK[\s\S]*?QA citation relationAwareEvidenceReason\.marker must prove graph relation evidence reason[\s\S]*?minCitationReasonCount must be positive[\s\S]*?minRetrievedChunkReasonCount must be positive[\s\S]*?adjacentContextReasonVisible must be true[\s\S]*?uiReasonVisible must be true[\s\S]*?providerQualityClaim must be false[\s\S]*?llmFactClaim must be false/,
  'Release verifier must hard-require report evidence QA relation-aware graph evidence reason proof fields.'
)
requirePattern(
  securityRegressionScript,
  /relationAwareEvidenceReason[\s\S]*?missing-relation-aware-evidence-reason[\s\S]*?relation-aware-evidence-reason-status-fail[\s\S]*?relation-aware-evidence-reason-marker-forged[\s\S]*?relation-aware-evidence-reason-citation-zero[\s\S]*?relation-aware-evidence-reason-chunk-zero[\s\S]*?relation-aware-evidence-reason-adjacent-hidden[\s\S]*?relation-aware-evidence-reason-ui-hidden[\s\S]*?relation-aware-evidence-reason-provider-claim[\s\S]*?relation-aware-evidence-reason-raw-field/,
  'Security regression must reject forged report evidence QA relation-aware graph evidence reason markers.'
)
requirePattern(
  securityRegressionScript,
  /valid_qa_marker_payload='[\s\S]*?"citationEnforcementStatuses":\["DIRECT_VERIFIED"\],"citationEnforcementReasons":\["DIRECT_VERIFIED"\],"citedChunkCount"/,
  'Security regression valid report evidence QA marker payload must include citationEnforcementReasons so verifier tests do not pass by missing-field rejection.'
)
requirePattern(
  securityRegressionScript,
  /citation-count-zero[\s\S]*?"citationEnforcementStatuses":\["DIRECT_VERIFIED"\],"citationEnforcementReasons":\["DIRECT_VERIFIED"\],"citedChunkCount"[\s\S]*?retry-failed-enforcement[\s\S]*?"citationEnforcementStatuses":\["RETRY_FAILED"\],"citationEnforcementReasons":\["DIRECT_VERIFIED"\],"citedChunkCount"/,
  'Security regression hand-written report evidence QA forged markers must include valid reason fields so each case tests its intended forged field.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /deepEvidenceCardReadability:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?mobile390Covered[\s\S]*?narrow320Covered[\s\S]*?sourceReceipt:\s*\{[\s\S]*?readyVisible[\s\S]*?reviewVisible[\s\S]*?contained[\s\S]*?referenceWraps[\s\S]*?titleNotClipped[\s\S]*?tagsNotClipped[\s\S]*?sourceLocationConfidence:\s*\{[\s\S]*?readyContained[\s\S]*?reviewContained[\s\S]*?metricsNotClipped[\s\S]*?checksWrap[\s\S]*?llmFactBoundaryVisible[\s\S]*?sourceFileMatchRelease:\s*\{[\s\S]*?readyContained[\s\S]*?reviewContained[\s\S]*?targetReferenceNotClipped[\s\S]*?citedReferenceNotClipped[\s\S]*?checksNotClipped[\s\S]*?noRepairOnReview[\s\S]*?noHorizontalOverflow[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Report evidence QA citation marker must include deepEvidenceCardReadability proof without provider-quality or LLM-fact claims.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /claimCitationNoiseBoundaryProofs\.push\(await submitUnverifiedQaAndAssert\(page, viewport\.name, 'fake-noise'\)\)[\s\S]*?claimCitationNoiseBoundary:\s*\{[\s\S]*?requestCount:\s*claimCitationNoiseBoundaryQaRequestCount[\s\S]*?noiseKinds[\s\S]*?coverageStatus:\s*'NONE'[\s\S]*?maxCitedEvidenceCount[\s\S]*?maxRepairCandidateCount[\s\S]*?claimCitationStatus:\s*'REVIEW'[\s\S]*?maxCitedRequiredClaimCount[\s\S]*?maxInvalidCitationClaimCount[\s\S]*?roleDistributionStatus:\s*'REVIEW_UNCITED'[\s\S]*?maxRequiredPrimaryBoundClaimCount[\s\S]*?answerCitationsCitedByAnswer:\s*false[\s\S]*?repairEvidenceGateBlockedVisible[\s\S]*?rawAnswerStored:\s*false[\s\S]*?rawPromptStored:\s*false[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Report evidence QA citation marker must include claimCitationNoiseBoundary REVIEW/BLOCKED proof without raw answer, raw prompt, provider quality, or LLM fact claims.'
)
rejectPattern(
  reportEvidenceDrawerSmokeSpec,
  /evidenceRef:\s*\{[\s\S]{0,500}summary:/,
  'Report evidence QA citation smoke marker must not store evidenceRef.summary or other large raw report text.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /claimRoleDistributionMissingQaRequestCount = claimRoleDistributionMissingProofs\.length[\s\S]*?claimRoleDistributionMismatchQaRequestCount = claimRoleDistributionMismatchProofs\.length[\s\S]*?const claimRoleDistributionMissingMarker = \{[\s\S]*?requestCount:\s*claimRoleDistributionMissingQaRequestCount[\s\S]*?sourceEvidenceMatchType:\s*'REPORT_LINE_ANCHOR'[\s\S]*?claimCitationStatus:\s*'READY'[\s\S]*?roleDistributionPresent[\s\S]*?repairEvidenceGateReviewVisible[\s\S]*?trustSummaryReviewVisible[\s\S]*?latestNextActionRepairHidden[\s\S]*?latestCitationRepairHidden[\s\S]*?const claimRoleDistributionMismatchMarker = \{[\s\S]*?requestCount:\s*claimRoleDistributionMismatchQaRequestCount[\s\S]*?sourceEvidenceMatchType:\s*'REPORT_LINE_ANCHOR'[\s\S]*?claimCitationStatus:\s*'READY'[\s\S]*?roleDistributionPresent[\s\S]*?mismatchFlags:\s*\{[\s\S]*?requiredPrimaryBoundClaimCountMismatch[\s\S]*?nonZeroContextOnly[\s\S]*?nonZeroUnbacked[\s\S]*?nonZeroInvalid[\s\S]*?validCitationFileCountMismatch[\s\S]*?requiredClaimCitationFileCountMismatch[\s\S]*?repairEvidenceGateReviewVisible[\s\S]*?trustSummaryReviewVisible[\s\S]*?latestNextActionRepairHidden[\s\S]*?latestCitationRepairHidden[\s\S]*?drift:\s*\{[\s\S]*?claimRoleDistributionMissing:\s*claimRoleDistributionMissingMarker[\s\S]*?claimRoleDistributionMismatch:\s*claimRoleDistributionMismatchMarker[\s\S]*?claimRoleDistributionMissing:\s*\{[\s\S]*?\.\.\.claimRoleDistributionMissingMarker[\s\S]*?claimRoleDistributionMismatch:\s*\{[\s\S]*?\.\.\.claimRoleDistributionMismatchMarker/,
  'Report evidence QA citation marker must record claim role distribution REVIEW/no-repair proof fields under qaFromEvidence.drift while preserving legacy direct fields.'
)
requirePattern(
  projectDetail,
  /function isLowConfidenceGrounding\(status\?: string \| null\): boolean \{[\s\S]*?status === 'PARTIAL'[\s\S]*?status === 'UNVERIFIED'[\s\S]*?status === 'NO_EVIDENCE'[\s\S]*?function qaEvidenceReviewTitle[\s\S]*?没有可用代码证据[\s\S]*?function qaEvidenceReviewDescription/,
  'ProjectDetail QA must classify PARTIAL, UNVERIFIED and NO_EVIDENCE as explicit low-confidence grounding states.'
)
requirePattern(
  projectApi,
  /export interface CodeQaResponse \{[\s\S]*?groundingStatus\?: 'VERIFIED' \| 'PARTIAL' \| 'UNVERIFIED' \| 'NO_EVIDENCE' \| string[\s\S]*?citationEnforcementStatus\?: string[\s\S]*?citationEnforcementReason\?: string[\s\S]*?citationEnforcementNote\?: string[\s\S]*?retrievedChunks: CodeChunkSearchItem\[\]/,
  'Project API CodeQaResponse must expose grounding status plus citation enforcement status, reason and note fields.'
)
requirePattern(
  projectDetail,
  /aria-label="QA 低置信度证据状态"[\s\S]*?低置信度[\s\S]*?无证据[\s\S]*?候选证据需复核[\s\S]*?下一步：重试此问题[\s\S]*?换问题[\s\S]*?重新检索证据/,
  'ProjectDetail QA low-confidence panel must visibly show downgrade status, candidate/no-evidence wording, and retry/change-question/research-evidence next steps.'
)
requirePattern(
  projectDetail,
  /citationEnforcementReason\?: string \| null[\s\S]*?function citationEnforcementReasonLabel\(reason\?: string \| null\): string[\s\S]*?UNCITED_REQUIRED_CLAIM[\s\S]*?NO_VALID_CITATION_LABEL[\s\S]*?citationEnforcementReason: qa\?\.citationEnforcementReason[\s\S]*?原因码 \{msg\.citationEnforcementReason\}[\s\S]*?引用原因：\{citationEnforcementReasonLabel\(msg\.citationEnforcementReason\)\}/,
  'ProjectDetail QA must propagate citationEnforcementReason from API responses into message state and visible trust/review UI.'
)
requirePattern(
  projectDetail,
  /lowConfidenceGrounding \? '候选证据 \/ 引用复核' : '回答引用'[\s\S]*?lowConfidenceGrounding \? '候选代码切片' : `补充 code_chunks \$\{supplementalChunks\.length\} 条`/,
  'ProjectDetail QA must label low-confidence answer citations and chunks as candidates instead of normal verified evidence.'
)
requirePattern(
  projectDetail,
  /function qaCitationRepairTargetDesc\(citation: CodeQaCitation, question: string\)[\s\S]*?Project QA 已验证引用[\s\S]*?citationLineReference\(citation\)[\s\S]*?citationEvidenceReason\(citation\)/,
  'ProjectDetail QA must build a structured AutoRepair target description from verified answer citations.'
)
requirePattern(
  projectDetail,
  /const qaCitationAutoRepairUrl = \([\s\S]*?citation: CodeQaCitation,[\s\S]*?question: string,[\s\S]*?groundingStatus\?: string,[\s\S]*?citationEnforcementStatus\?: string,[\s\S]*?citationEnforcementReason\?: string,[\s\S]*?sourceEvidenceRef\?: CodeQaEvidenceRef \| null,[\s\S]*?sourceEvidenceMatched\?: boolean \| null,[\s\S]*?sourceEvidenceMatchType\?: string \| null,[\s\S]*?\) => \{[\s\S]*?scanTasks\.find\(scan => scan\.id === citationScanTaskId\)[\s\S]*?sourceScan\?\.repositoryId \|\| repositories\[0\]\?\.id[\s\S]*?!citation\.citedByAnswer[\s\S]*?!citation\.filePath[\s\S]*?!citationScanTaskId[\s\S]*?!draftRepositoryId[\s\S]*?params\.set\('openCreate', '1'\)[\s\S]*?params\.set\('repositoryId', String\(draftRepositoryId\)\)[\s\S]*?params\.set\('scanTaskId', String\(citationScanTaskId\)\)[\s\S]*?params\.set\('filePath', citation\.filePath\)[\s\S]*?params\.set\('source', 'Project QA verified citation'\)[\s\S]*?params\.set\('sourceType', 'PROJECT_QA_VERIFIED_CITATION'\)[\s\S]*?params\.set\('citationId', citation\.citationId\)[\s\S]*?params\.set\('chunkId', String\(citation\.chunkId\)\)[\s\S]*?params\.set\('sourceLabel', citation\.sourceLabel\)[\s\S]*?params\.set\('citedByAnswer', String\(Boolean\(citation\.citedByAnswer\)\)\)[\s\S]*?params\.set\('groundingStatus', groundingStatus\)[\s\S]*?params\.set\('citationEnforcementStatus', citationEnforcementStatus\)[\s\S]*?params\.set\('citationEnforcementReason', citationEnforcementReason\)[\s\S]*?appendSourceEvidenceParams\(params, sourceEvidenceRef, sourceEvidenceMatched, sourceEvidenceMatchType\)/,
  'ProjectDetail QA must map verified answer citations into scan-bound AutoRepair draft URLs with enforcement status and reason.'
)
requirePattern(
  projectDetail,
  /msg\.groundingStatus === 'VERIFIED' && !lowConfidenceGrounding && repairEvidenceGate\?\.status === 'READY' && trustSummary\?\.tone === 'ready'[\s\S]*?qaCitationAutoRepairUrl\(citation, previousUserQuestion, msg\.groundingStatus \|\| undefined, msg\.citationEnforcementStatus \|\| undefined, msg\.citationEnforcementReason \|\| undefined, msg\.sourceEvidenceRef, msg\.sourceEvidenceMatched, msg\.sourceEvidenceMatchType\)[\s\S]*?data-sl-target-url=\{autoRepairUrl\}[\s\S]*?navigate\(autoRepairUrl\)[\s\S]*?label="生成修复候选"/,
  'ProjectDetail QA must show AutoRepair candidate action only for verified cited answer citations whose repair evidence gate and trust summary are READY.'
)
requirePattern(
  projectDetail,
  /function qaRepairEvidenceGate\(msg: QaMessage\)(?=[\s\S]*?groundingStatus === 'VERIFIED')(?=[\s\S]*?successfulCitationEnforcement\(msg\.citationEnforcementStatus\))(?=[\s\S]*?requiredCoveragePercent >= 100)(?=[\s\S]*?repairCandidates > 0)(?=[\s\S]*?sourceEvidenceMatched === true)(?=[\s\S]*?sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR')(?=[\s\S]*?claimCitationCoverageReadyForRepair\(claimCoverage\))(?=[\s\S]*?msg\.claimCitationCoverage\?\.status === 'BLOCKED')(?=[\s\S]*?status: 'READY')(?=[\s\S]*?status: 'BLOCKED')/,
  'ProjectDetail QA must compute a READY/BLOCKED repair evidence gate from grounding, required evidence coverage, claim citation status and source evidence anchor fields.'
)
requirePattern(
  projectDetail,
  /primaryAutoRepairUrl[\s\S]*?repairEvidenceGate\?\.status === 'READY'[\s\S]*?trustSummary\?\.tone === 'ready'[\s\S]*?qaCitationAutoRepairUrl/,
  'ProjectDetail QA primary AutoRepair URL must be gated by the same ready trust summary as the visible action rail.'
)
requirePattern(
  projectDetail,
  /function QaRepairEvidenceGatePanel\(\{ gate \}: \{ gate: RepairEvidenceGate \}\)[\s\S]*?aria-label="修复证据门禁"[\s\S]*?gate\.label[\s\S]*?gate\.summary[\s\S]*?gate\.checks\.map/,
  'ProjectDetail QA must render the repair evidence gate with status, summary and checks.'
)
requirePattern(
  projectDetail,
  /function qaSourceLocationConfidence\(msg: QaMessage, ref: CodeQaEvidenceRef\): QaSourceLocationConfidence(?=[\s\S]*?sourceLocationPathsMatch\(ref\.filePath, citation\.filePath\))(?=[\s\S]*?REPORT_LINE_ANCHOR)(?=[\s\S]*?来源定位可信)(?=[\s\S]*?不证明 LLM 事实语义正确)/,
  'ProjectDetail QA must derive a source location confidence summary from sourceEvidenceRef, sourceEvidenceMatchType and cited answer files without claiming LLM factual correctness.'
)
requirePattern(
  projectDetail,
  /function qaAnswerSourceEvidenceReceipt\(msg: QaMessage\): QaAnswerSourceEvidenceReceipt \| null[\s\S]*?msg\.sourceEvidenceRef[\s\S]*?sourceEvidenceMatchLabel\(msg\.sourceEvidenceMatchType\)[\s\S]*?matched: msg\.sourceEvidenceMatched === true[\s\S]*?locationConfidence: qaSourceLocationConfidence\(msg, ref\)/,
  'ProjectDetail QA must derive an answer-level report evidence receipt from sourceEvidenceRef and sourceEvidenceMatchType and attach source location confidence.'
)
requirePattern(
  projectDetail,
  /function QaAnswerSourceEvidenceReceiptPanel\(\{ receipt \}: \{ receipt: QaAnswerSourceEvidenceReceipt \}\)[\s\S]*?aria-label="QA 回答报告证据凭证"[\s\S]*?回答来源凭证[\s\S]*?receipt\.scanLabel[\s\S]*?receipt\.fileReference[\s\S]*?<QaSourceLocationConfidencePanel confidence=\{receipt\.locationConfidence\} \/>/,
  'ProjectDetail QA must render a visible answer source evidence receipt with scan/file-line binding and source location confidence.'
)
requirePattern(
  projectDetail,
  /function QaSourceLocationConfidencePanel\(\{ confidence \}: \{ confidence: QaSourceLocationConfidence \}\)(?=[\s\S]*?aria-label="来源定位可信度")(?=[\s\S]*?来源定位可信度)(?=[\s\S]*?已绑定)(?=[\s\S]*?需复核)(?=[\s\S]*?已阻断)(?=[\s\S]*?confidence\.checks\.map)/,
  'ProjectDetail QA must render source location confidence with Chinese user-facing states and deterministic checks.'
)
requirePattern(
  projectDetail,
  /function qaSourceFileMatchRelease\(msg: QaMessage, repairGate: RepairEvidenceGate\): QaSourceFileMatchRelease \| null(?=[\s\S]*?sourceLocationFileNameMatches\(ref\.filePath, citation\.filePath\))(?=[\s\S]*?行级锚点)(?=[\s\S]*?路径后缀一致)(?=[\s\S]*?仅文件名一致，需复核)(?=[\s\S]*?未形成来源闭环)(?=[\s\S]*?主张角色分布缺失，不能生成修复候选)(?=[\s\S]*?不证明 LLM 事实语义正确)/,
  'ProjectDetail QA must derive a user-readable source file match and AutoRepair release checklist without changing backend gates or claiming LLM factual correctness.'
)
requirePattern(
  projectDetail,
  /function QaReadableEvidenceSection\([\s\S]*?const \{[\s\S]*?sourceFileRelease,[\s\S]*?\} = evidence[\s\S]*?<QaSourceFileMatchReleasePanel release=\{sourceFileRelease\} \/>/,
  'ProjectDetail QA must render the source file match release checklist for source-evidence-bound assistant answers.'
)
requirePattern(
  projectDetail,
  /function QaSourceFileMatchReleasePanel\(\{ release \}: \{ release: QaSourceFileMatchRelease \}\)(?=[\s\S]*?aria-label="来源文件匹配说明")(?=[\s\S]*?修复候选放行条件)(?=[\s\S]*?报告目标)(?=[\s\S]*?已引用切片)(?=[\s\S]*?匹配结论)(?=[\s\S]*?风险提示)(?=[\s\S]*?已满足：)(?=[\s\S]*?未满足：)(?=[\s\S]*?release\.nextAction)/,
  'ProjectDetail QA must render source file matching and repair release conditions as a compact Chinese audit panel.'
)
requirePattern(
  css,
  /\.sl-qa-readable-evidence[\s\S]*?\.sl-qa-readable-evidence-ready[\s\S]*?\.sl-qa-readable-evidence-warning[\s\S]*?\.sl-qa-readable-evidence-blocked[\s\S]*?\.sl-qa-readable-evidence-head[\s\S]*?\.sl-qa-readable-evidence-flow[\s\S]*?\.sl-qa-readable-evidence-flow > \.sl-qa-trust-summary,[\s\S]*?\.sl-qa-readable-evidence-flow > \.sl-qa-next-action-rail[\s\S]*?margin:\s*0[\s\S]*?\.sl-qa-source-receipt[\s\S]*?\.sl-qa-source-receipt-ready[\s\S]*?\.sl-qa-source-receipt-review[\s\S]*?\.sl-qa-source-receipt-tags \.ant-tag[\s\S]*?max-width:\s*100%[\s\S]*?white-space:\s*normal[\s\S]*?overflow-wrap:\s*anywhere[\s\S]*?\.sl-qa-source-receipt-ref[\s\S]*?\.sl-qa-source-location-confidence[\s\S]*?\.sl-qa-source-location-confidence-ready[\s\S]*?\.sl-qa-source-location-confidence-warning[\s\S]*?\.sl-qa-source-location-confidence-blocked[\s\S]*?\.sl-qa-source-location-confidence-metrics[\s\S]*?\.sl-qa-source-match-release[\s\S]*?\.sl-qa-source-match-release-grid[\s\S]*?\.sl-qa-source-match-release-checks[\s\S]*?@media \(max-width: 720px\)[\s\S]*?\.sl-qa-readable-evidence-head,[\s\S]*?\.sl-qa-source-receipt-head,[\s\S]*?\.sl-qa-source-location-confidence-head,[\s\S]*?\.sl-qa-source-match-release-head,[\s\S]*?\.sl-qa-evidence-combination-head[\s\S]*?flex-direction:\s*column/,
  'ProjectDetail QA readable evidence section, source receipt, source location confidence and source match release checklist must have stable responsive styles, wrapping tags and mobile vertical heads.'
)
requirePattern(
  css,
  /\.sl-qa-detailed-audit[\s\S]*?\.sl-qa-detailed-audit-ready[\s\S]*?\.sl-qa-detailed-audit-warning[\s\S]*?\.sl-qa-detailed-audit-blocked[\s\S]*?\.sl-qa-detailed-audit-head[\s\S]*?\.sl-qa-detailed-audit-summary[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)[\s\S]*?\.sl-qa-detailed-audit-summary-item[\s\S]*?\.sl-qa-detailed-audit-summary-item-ready[\s\S]*?\.sl-qa-detailed-audit-summary-item-warning[\s\S]*?\.sl-qa-detailed-audit-summary-item-blocked[\s\S]*?\.sl-qa-detailed-audit-summary-item strong[\s\S]*?overflow-wrap:\s*anywhere[\s\S]*?\.sl-qa-detailed-audit-summary-item small[\s\S]*?overflow-wrap:\s*anywhere[\s\S]*?\.sl-qa-detailed-audit-flow[\s\S]*?\.sl-qa-detailed-audit-flow > \.sl-qa-repair-gate[\s\S]*?margin:\s*0[\s\S]*?\.sl-qa-detailed-audit-summary,[\s\S]*?\.sl-qa-source-location-confidence-metrics[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)[\s\S]*?\.sl-qa-detailed-audit-summary,[\s\S]*?\.sl-qa-source-location-confidence-metrics[\s\S]*?grid-template-columns:\s*1fr/,
  'ProjectDetail QA detailed audit summary must have stable three-column, responsive, wrapped status styles without hiding detailed audit panels.'
)
requirePattern(
  autoRepairRequest,
  /private Provenance provenance;[\s\S]*?public static class Provenance[\s\S]*?private String sourceType;[\s\S]*?private Long scanTaskId;[\s\S]*?private String filePath;[\s\S]*?private Long chunkId;[\s\S]*?private String citationId;[\s\S]*?private String sourceEvidenceFilePath;[\s\S]*?private Boolean sourceEvidenceMatched;[\s\S]*?private String sourceEvidenceMatchType;[\s\S]*?private String riskKey;/,
  'AutoRepairRequest must expose a structured provenance DTO for QA citation, scan-risk and manual candidate receipts.'
)
requirePattern(
  autoRepairService,
  /AUTO_REPAIR_CANDIDATE_CREATED[\s\S]*?autoRepairCandidateCreatedInput[\s\S]*?sanitizedProvenance[\s\S]*?putServerDerivedRepairEvidenceGate[\s\S]*?repairEvidenceGate[\s\S]*?SERVER_DERIVED[\s\S]*?normalizeSourceType[\s\S]*?PROJECT_QA_VERIFIED_CITATION[\s\S]*?SCAN_REPORT_RISK[\s\S]*?MANUAL_CANDIDATE[\s\S]*?putText[\s\S]*?putPositiveInteger/,
  'AutoRepairService must write a sanitized AUTO_REPAIR_CANDIDATE_CREATED audit receipt with source type allowlisting and server-derived repair evidence gate.'
)
requirePattern(
  autoRepairApi,
  /export interface AutoRepairProvenance[\s\S]*?sourceType\?:[\s\S]*?PROJECT_QA_VERIFIED_CITATION[\s\S]*?SCAN_REPORT_RISK[\s\S]*?citationId\?: string[\s\S]*?sourceEvidenceFilePath\?: string[\s\S]*?sourceEvidenceMatched\?: boolean[\s\S]*?sourceEvidenceMatchType\?: string[\s\S]*?repairEvidenceGate\?:[\s\S]*?repairEvidenceGateReason\?: string[\s\S]*?repairEvidenceGateSource\?: string[\s\S]*?riskKey\?: string[\s\S]*?provenance\?: AutoRepairProvenance/,
  'AutoRepair API client must expose provenance on create requests.'
)
requirePattern(
  autoRepairsPage,
  /const provenance = parseProvenance\(searchParams\)[\s\S]*?\{ repositoryId, scanTaskId, filePath, targetDesc, source, provenance \}[\s\S]*?function parseProvenance\(searchParams: URLSearchParams\): AutoRepairProvenance \| undefined[\s\S]*?sourceType[\s\S]*?citationId[\s\S]*?sourceEvidenceFilePath[\s\S]*?sourceEvidenceMatched[\s\S]*?sourceEvidenceMatchType[\s\S]*?riskKey[\s\S]*?parseBoolean/,
  'AutoRepairsPage must parse provenance from deep-link query parameters into the create draft.'
)
requirePattern(
  autoRepairs,
  /const createPayload = draftProvenance \? \{ \.\.\.values, provenance: draftProvenance \} : values[\s\S]*?autoRepairApi\.create\(projectId, createPayload\)/,
  'AutoRepairs must send provenance on create requests.'
)
requirePattern(
  autoRepairs,
  /AUTO_REPAIR_CANDIDATE_CREATED[\s\S]*?setCandidateReceipt[\s\S]*?CandidateProvenanceReceipt[\s\S]*?候选来源凭证/,
  'AutoRepairs must send provenance on create and render the AUTO_REPAIR_CANDIDATE_CREATED candidate receipt.'
)
requirePattern(
  autoRepairs,
  /function candidateProvenanceGate\(provenance: AutoRepairProvenance\)(?=[\s\S]*?normalizedServerRepairEvidenceGate\(provenance\.repairEvidenceGate\))(?=[\s\S]*?PROJECT_QA_VERIFIED_CITATION)(?=[\s\S]*?sourceEvidenceMatched === true)(?=[\s\S]*?sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR')(?=[\s\S]*?serverGate \|\| \(ready \? 'READY' : review \? 'REVIEW' : 'BLOCKED'\))(?=[\s\S]*?repairEvidenceGateReason)/,
  'AutoRepairs candidate receipt must prefer server-derived READY/REVIEW/BLOCKED and fall back to QA citation/source evidence match derivation.'
)
requirePattern(
  autoRepairs,
  /const displayCandidateGate = redactedRepairReadinessSignalForOutput\(candidateGate\)[\s\S]*?aria-label="候选证据门禁"[\s\S]*?displayCandidateGate\.summary[\s\S]*?displayCandidateGate\.label[\s\S]*?displayCandidateGate\.checks\.map/,
  'AutoRepairs candidate receipt must render the candidate evidence gate with status, summary and checks.'
)
requirePattern(
  autoRepairs,
  /function CandidateProvenanceReceipt\([\s\S]*?projectId[\s\S]*?repair[\s\S]*?buildCandidateReceiptQaQuestion\(repair, provenance, candidateGate\)[\s\S]*?aria-label="候选凭证复核动作"[\s\S]*?label="打开来源报告"[\s\S]*?data-sl-target-url=\{qaUrl\}[\s\S]*?label="QA 复核凭证"[\s\S]*?data-sl-target-url=\{auditUrl\}[\s\S]*?label="查看候选审计"/,
  'AutoRepairs candidate receipt must expose report, QA and audit review actions from the receipt itself.'
)
requirePattern(
  scanTaskDetail,
  /function autoRepairCandidateUrl\(projectId: number, repositoryId: number, scanTaskId: number, risk: any\)[\s\S]*?params\.set\('sourceType', 'SCAN_REPORT_RISK'\)[\s\S]*?params\.set\('riskCategory', redactReportEvidenceText\(String\(risk\.category\)\)\)[\s\S]*?params\.set\('riskSeverity', redactReportEvidenceText\(String\(risk\.severity\)\)\)[\s\S]*?params\.set\('lineNumber', String\(lineNumber\)\)[\s\S]*?params\.set\('riskKey', buildRiskKey\(risk, filePath\)\)/,
  'ScanTaskDetail must bind scan report risk provenance fields into AutoRepair candidate URLs.'
)
requirePattern(
  autoRepairs,
  /const createPayload = draftProvenance \? \{ \.\.\.values, provenance: draftProvenance \} : values[\s\S]*?const res = await autoRepairApi\.create\(projectId, createPayload\)[\s\S]*?const created = res\.data\.data[\s\S]*?setItems\(prev => upsertAutoRepair\(prev, created\)\)[\s\S]*?setSelected\(created\)[\s\S]*?fetchItems\(true\)/,
  'AutoRepairs must immediately select the newly created repair so QA-origin candidates land on a reviewable source bridge instead of only refreshing the list.'
)
requirePattern(
  autoRepairs,
  /function upsertAutoRepair\(items: AutoRepair\[\], repair: AutoRepair\)[\s\S]*?items\.some\(item => item\.id === repair\.id\)[\s\S]*?items\.map\(item => item\.id === repair\.id \? repair : item\)[\s\S]*?\[repair, \.\.\.items\]/,
  'AutoRepairs must upsert newly created repairs into the local table state before the async refresh returns.'
)
requirePattern(
  autoRepairs,
  /function autoRepairSourceOrigin\(repair: AutoRepair\)[\s\S]*?repair\.targetDesc\.includes\('Project QA 已验证引用'\)[\s\S]*?Project QA 已验证引用[\s\S]*?回答引用、代码证据、Agent 任务和审计留痕[\s\S]*?扫描报告风险项/,
  'AutoRepairs source bridge must distinguish Project QA verified citation candidates from scan-report risk candidates.'
)
requirePattern(
  projectQaLowConfidenceSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5191\)[\s\S]*?testMatch:\s*\/project-qa-low-confidence-smoke\\\.spec\\\.ts\//,
  'Project QA low-confidence smoke config must use a dedicated default port and target only project-qa-low-confidence-smoke.spec.ts.'
)
requirePattern(
  packageJson,
  /"smoke:project-qa-low-confidence":\s*"playwright test -c playwright\.project-qa-low-confidence\.config\.ts"/,
  'package.json must expose smoke:project-qa-low-confidence for the focused Project QA smoke.'
)
requirePattern(
  packageJson,
  /"smoke:project-qa-recoverable":\s*"playwright test -c playwright\.project-qa-recoverable\.config\.ts"/,
  'package.json must expose smoke:project-qa-recoverable for the focused Project QA recoverable states smoke.'
)
requirePattern(
  packageJson,
  /"smoke:project-qa-autorepair-candidate":\s*"playwright test -c playwright\.project-qa-autorepair-candidate\.config\.ts"/,
  'package.json must expose smoke:project-qa-autorepair-candidate for the focused Project QA AutoRepair candidate smoke.'
)
requirePattern(
  makefile,
  /project-qa-low-confidence-ui-smoke:[\s\S]*?npm run smoke:project-qa-low-confidence/,
  'Makefile must expose project-qa-low-confidence-ui-smoke target.'
)
requirePattern(
  makefile,
  /project-qa-recoverable-ui-smoke:[\s\S]*?npm run smoke:project-qa-recoverable/,
  'Makefile must expose project-qa-recoverable-ui-smoke target.'
)
requirePattern(
  makefile,
  /project-qa-autorepair-candidate-ui-smoke:[\s\S]*?npm run smoke:project-qa-autorepair-candidate/,
  'Makefile must expose project-qa-autorepair-candidate-ui-smoke target.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?if \(!path\.startsWith\('\/api\/'\)\) \{[\s\S]*?await route\.continue\(\)[\s\S]*?return[\s\S]*?\}/,
  'Project QA low-confidence smoke must not intercept Vite source modules such as /src/api/*.ts.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /unhandledApiRequests\.push\(`\$\{method\} \$\{path\}\$\{url\.search\}`\)[\s\S]*?status:\s*599/,
  'Project QA low-confidence smoke must fail closed for unmocked real /api requests.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile390', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow320', width: 320, height: 740 \}[\s\S]*?\]/,
  'Project QA low-confidence smoke must cover desktop, mobile390 and narrow320 viewports.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /method === 'POST' && path === `\/api\/projects\/\$\{projectId\}\/qa`[\s\S]*?qaAttemptsByQuestion\.get\(question\)[\s\S]*?qaRequests\.push\(payload\)[\s\S]*?qaFixtureFor\(question, attempt\)/,
  'Project QA low-confidence smoke must mock /api/projects/{id}/qa through status-specific fixtures.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /groundingStatus:\s*'VERIFIED'[\s\S]*?citationEnforcementStatus:\s*'DIRECT_VERIFIED'[\s\S]*?citationEnforcementReason:\s*'DIRECT_VERIFIED'[\s\S]*?citedByAnswer:\s*index === 0[\s\S]*?groundingStatus:\s*'NO_EVIDENCE'[\s\S]*?citationEnforcementStatus:\s*'NO_EVIDENCE'[\s\S]*?citationEnforcementReason:\s*'NO_EVIDENCE'[\s\S]*?groundingStatus:\s*status[\s\S]*?citationEnforcementStatus:\s*status === 'UNVERIFIED' \? 'UNVERIFIED' : 'RETRY_FAILED'[\s\S]*?citationEnforcementReason:\s*status === 'UNVERIFIED' \? 'NO_VALID_CITATION_LABEL' : 'UNCITED_REQUIRED_CLAIM'/,
  'Project QA low-confidence smoke fixtures must cover retry VERIFIED, NO_EVIDENCE, UNVERIFIED and PARTIAL/RETRY_FAILED outcomes with machine-readable citation reason codes.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /await expect\(latestPanel\.getByText\('低置信度'\)\)\.toBeVisible\(\)[\s\S]*?await expect\(latestPanel\.getByText\('下一步：重试此问题'\)\)\.toBeVisible\(\)[\s\S]*?getByRole\('button', \{ name: '重试此问题' \}\)[\s\S]*?getByRole\('button', \{ name: '换问题' \}\)[\s\S]*?getByRole\('button', \{ name: '重新检索证据' \}\)/,
  'Project QA low-confidence smoke must assert visible downgrade label and retry/change-question/research-evidence next steps.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /function expectContainedInViewport[\s\S]*?getBoundingClientRect[\s\S]*?function expectLocatorTextNotClipped[\s\S]*?scrollWidth[\s\S]*?textOverflow[\s\S]*?function assertActionButtonsReadability[\s\S]*?function assertLowConfidencePanelReadability[\s\S]*?assertCandidateEvidenceReadability[\s\S]*?assertNoEvidenceReadability[\s\S]*?assertRetryRecoveryReadability/,
  'Project QA low-confidence smoke must include containment and text-not-clipped helpers for panels, candidate evidence, no-evidence, retry recovery and action buttons.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /submitQaCase\(page, viewport\.name, 'PARTIAL'\)[\s\S]*?submitQaCase\(page, viewport\.name, 'UNVERIFIED'\)[\s\S]*?submitQaCase\(page, viewport\.name, 'NO_EVIDENCE'\)[\s\S]*?viewportMatrix\.length \* 5/,
  'Project QA low-confidence smoke must run independent PARTIAL, UNVERIFIED and NO_EVIDENCE downgrade cases per viewport.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /getByText\('候选证据 \/ 引用复核'\)[\s\S]*?getByText\(targetFile\)[\s\S]*?getByText\('候选证据'\)[\s\S]*?getByText\('候选代码切片'\)[\s\S]*?assertCandidateEvidenceReadability\(page, viewportName\)/,
  'Project QA low-confidence smoke must assert visible and readable candidate answer citations and candidate chunks.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /getByText\('没有可用代码证据'\)[\s\S]*?getByText\('无证据'\)[\s\S]*?assertNoEvidenceReadability\(page, latestPanel, viewportName\)/,
  'Project QA low-confidence smoke must assert visible and readable no-evidence state.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /const verifiedLabel = page\.getByText\(\/引用已验证\|首次引用已验证\|回答已引用\/\)[\s\S]*?const verifiedCountBefore = await verifiedLabel\.count\(\)[\s\S]*?await expect\(verifiedLabel\)\.toHaveCount\(verifiedCountBefore\)[\s\S]*?noVerifiedMislabel/,
  'Project QA low-confidence smoke must assert downgraded QA results do not add misleading verified labels while allowing prior verified retry messages.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /async function submitRetryRecoveryCase\(page: Page, viewportName: string\)[\s\S]*?PROJECT_QA_RETRY_VERIFIED_[\s\S]*?toBe\('UNCITED_REQUIRED_CLAIM'\)[\s\S]*?getByRole\('button', \{ name: '重试此问题' \}\)\.click\(\)[\s\S]*?toBe\('VERIFIED'\)[\s\S]*?toBe\('DIRECT_VERIFIED'\)[\s\S]*?toBe\('DIRECT_VERIFIED'\)[\s\S]*?citedByAnswer === true && citation\.scanTaskId === scanTaskId && citation\.filePath === targetFile[\s\S]*?assertRetryRecoveryReadability\(page, viewportName\)/,
  'Project QA low-confidence smoke must click low-confidence retry and assert readable VERIFIED answer citation recovery plus citation reason transition bound to the active scan.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /retryRecovery\s*=\s*\{[\s\S]*?retriedRequestCount[\s\S]*?verifiedAfterRetry[\s\S]*?scanTaskIdBound[\s\S]*?citationVisible[\s\S]*?citedByAnswer[\s\S]*?\}/,
  'Project QA low-confidence smoke must aggregate retry recovery proof fields.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /expect\(network\.unhandledApiRequests,[\s\S]*?\)\.toEqual\(\[\]\)[\s\S]*?Runtime issues must be empty/,
  'Project QA low-confidence smoke must assert all API requests are mocked and runtime issues are empty.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK[\s\S]*?markerVersion:\s*2[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)[\s\S]*?groundingStatuses[\s\S]*?citationEnforcementStatuses[\s\S]*?citationEnforcementReasons[\s\S]*?lowConfidenceVisible[\s\S]*?noEvidenceVisible[\s\S]*?noVerifiedMislabel[\s\S]*?retryRecovery[\s\S]*?layoutDensity[\s\S]*?mobileReadability[\s\S]*?viewportProofs[\s\S]*?statusProofs[\s\S]*?runtimeIssues:\s*issues\.length/,
  'Project QA low-confidence smoke marker must include marker version, mocked-only status, viewports, grounding/enforcement statuses, machine-readable enforcement reasons, visibility flags, retry recovery, layout density, mobile readability, per-viewport/status proof and runtime issue count.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /layoutDensity\s*=\s*\{[\s\S]*?desktopCovered[\s\S]*?mobile390Covered[\s\S]*?narrow320Covered[\s\S]*?lowConfidencePanelContained[\s\S]*?candidateEvidenceContained[\s\S]*?noEvidenceStateContained[\s\S]*?retryRecoveryContained[\s\S]*?actionButtonsContained[\s\S]*?noHorizontalOverflow[\s\S]*?\}[\s\S]*?mobileReadability\s*=\s*\{[\s\S]*?mobile390Covered[\s\S]*?narrow320Covered[\s\S]*?lowConfidenceTextNotClipped[\s\S]*?candidateEvidenceTextNotClipped[\s\S]*?noEvidenceTextNotClipped[\s\S]*?retryRecoveryTextNotClipped[\s\S]*?actionButtonsNotClipped/,
  'Project QA low-confidence smoke marker must expose layoutDensity and mobileReadability fields for three-viewport readability proof.'
)
requirePattern(
  projectQaLowConfidenceSmokeSpec,
  /viewportProofs\s*=\s*viewportMatrix\.map[\s\S]*?partialCovered[\s\S]*?unverifiedCovered[\s\S]*?noEvidenceCovered[\s\S]*?retryRecovered[\s\S]*?noVerifiedMislabel[\s\S]*?statusProofs\s*=\s*\{[\s\S]*?partial[\s\S]*?unverified[\s\S]*?noEvidence[\s\S]*?verifiedRetry/,
  'Project QA low-confidence smoke must expose per-viewport and per-status proof so marker coverage is auditable.'
)
requirePattern(
  projectQaRecoverableSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5202\)[\s\S]*?testMatch:\s*\/project-qa-recoverable-smoke\\\.spec\\\.ts\//,
  'Project QA recoverable smoke config must use a dedicated default port and target only project-qa-recoverable-smoke.spec.ts.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?if \(!path\.startsWith\('\/api\/'\)\) \{[\s\S]*?await route\.continue\(\)[\s\S]*?return[\s\S]*?\}/,
  'Project QA recoverable smoke must not intercept Vite source modules such as /src/api/*.ts.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /unhandledApiRequests\.push\(`\$\{method\} \$\{path\}\$\{url\.search\}`\)[\s\S]*?status:\s*599/,
  'Project QA recoverable smoke must fail closed for unmocked real /api requests.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'Project QA recoverable smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /const markerPayload = \{[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)[\s\S]*?assertions[\s\S]*?counters[\s\S]*?candidateEvidenceFile[\s\S]*?console\.log\('PROJECT_QA_RECOVERABLE_SMOKE_OK', markerText\)/,
  'Project QA recoverable smoke marker must include mocked-only status, unhandled API count, viewports, assertions, counters and candidate evidence file.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /const codeChunkEvidenceReadableFields = \[[\s\S]*?'filePath'[\s\S]*?'lineRange'[\s\S]*?'contextRole'[\s\S]*?'evidenceType'[\s\S]*?'score'[\s\S]*?'embeddingState'[\s\S]*?'matchedTerms'[\s\S]*?'evidenceReason'[\s\S]*?'metaGrid'[\s\S]*?'contentPreview'[\s\S]*?'actions'[\s\S]*?\][\s\S]*?function assertCodeChunkEvidenceCard[\s\S]*?getByRole\('article', \{ name: 'code_chunks 证据卡片 C1' \}\)[\s\S]*?targetFile[\s\S]*?第 51-89 行[\s\S]*?主证据[\s\S]*?Service[\s\S]*?相关分 86[\s\S]*?已向量化[\s\S]*?证据说明[\s\S]*?命中词[\s\S]*?证据编号[\s\S]*?文件路径[\s\S]*?行号范围[\s\S]*?证据角色[\s\S]*?证据类型[\s\S]*?召回方式[\s\S]*?定位检索[\s\S]*?追问此处[\s\S]*?复制引用[\s\S]*?复制链接/,
  'Project QA recoverable smoke must assert localized readable code chunk evidence card fields and actions.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /codeChunkEvidenceCard:\s*\{[\s\S]*?visible:\s*assertions\.has\('code-chunk-evidence-card-readable'\)[\s\S]*?preservedAfterRefreshFailure:\s*assertions\.has\('code-chunk-evidence-card-preserved-after-refresh-failure'\)[\s\S]*?readableFields:\s*codeChunkEvidenceReadableFields[\s\S]*?localizedLabels:\s*assertions\.has\('code-chunk-evidence-card-localized-labels'\)[\s\S]*?textNotClipped:\s*assertions\.has\('code-chunk-evidence-card-text-not-clipped'\)[\s\S]*?mobile390Covered:\s*assertions\.has\('project-qa-recoverable-mobile-390-covered'\)[\s\S]*?primary:\s*\{[\s\S]*?filePath:\s*targetFile[\s\S]*?lineRange:\s*'51-89'[\s\S]*?contextRole:\s*'主证据'[\s\S]*?evidenceType:\s*'Service'[\s\S]*?score:\s*86[\s\S]*?embeddingState:\s*'已向量化'[\s\S]*?matchedTerms:\s*\['OrderService', 'createOrder'\][\s\S]*?contentPreviewVisible:\s*true[\s\S]*?noHorizontalOverflow:\s*assertions\.has\('code-chunk-evidence-card-no-horizontal-overflow'\)/,
  'Project QA recoverable smoke marker must include structured localized evidence card readability proof.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /async function assertAnswerFirstAndEvidenceDeduped\(page: Page, label: string\)[\s\S]*?sl-chat-content[\s\S]*?expectLocatorAbove\(bubble\.locator\('\.sl-chat-content'\), bubble\.getByLabel\('回答引用证据'\)[\s\S]*?回答证据去重说明[\s\S]*?已引用证据 1 条不再重复展示为代码切片卡片[\s\S]*?getByRole\('article', \{ name: '代码切片证据 C1' \}\)\)\.toHaveCount\(0\)/,
  'Project QA recoverable smoke must prove answer content renders before evidence details and duplicate retrieved chunks are deduped.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /answerReadability:\s*\{[\s\S]*?answerContentBeforeEvidenceDetails:\s*assertions\.has\('qa-answer-content-before-evidence-details'\)[\s\S]*?duplicateRetrievedChunkDeduped:\s*assertions\.has\('qa-duplicate-retrieved-chunk-deduped'\)/,
  'Project QA recoverable smoke marker must include answer-first and duplicate evidence de-dupe proof.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /citationEnforcementReason:\s*verifiedCitationEnforcementReason[\s\S]*?getByText\(`原因码 \$\{verifiedCitationEnforcementReason\}`\)[\s\S]*?qa-citation-enforcement-reason-direct-verified[\s\S]*?const citationEnforcementReasons = Array\.from\(new Set\([\s\S]*?citationEnforcementReason[\s\S]*?toContain\(verifiedCitationEnforcementReason\)[\s\S]*?answerReadability:\s*\{[\s\S]*?citationEnforcementReasons[\s\S]*?directVerifiedReasonVisible:\s*assertions\.has\('qa-citation-enforcement-reason-direct-verified'\)/,
  'Project QA recoverable smoke must propagate citationEnforcementReason into UI assertions and marker evidence.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /function projectQaEvidenceUrl\(question: string, evidenceLine: string\)[\s\S]*?evidenceCategory[\s\S]*?evidenceSource[\s\S]*?evidenceFile[\s\S]*?evidenceLine[\s\S]*?async function submitEvidenceBoundQa\(page: Page, label: string\)[\s\S]*?\/api\/projects\/\$\{projectId\}\/qa[\s\S]*?requestPayload\.evidenceRef\?\.filePath[\s\S]*?requestPayload\.evidenceRef\?\.lineNumber[\s\S]*?async function assertSourceLocationConfidenceReady[\s\S]*?REPORT_LINE_ANCHOR[\s\S]*?getByLabel\('来源定位可信度'\)[\s\S]*?来源定位可信[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)[\s\S]*?async function assertSourceLocationConfidenceFileAnchorReview[\s\S]*?REPORT_FILE_ANCHOR[\s\S]*?getByLabel\('来源定位可信度'\)[\s\S]*?来源定位需复核[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)[\s\S]*?toHaveCount\(0\)/,
  'Project QA recoverable smoke must prove source-location confidence ready/review states from request-bound evidenceRef without exposing repair action for file-anchor drift.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /async function expectContainedInViewport\(locator: Locator, label: string\)[\s\S]*?async function expectLocatorCanWrap\(locator: Locator, label: string\)[\s\S]*?type SourceLocationReadabilityProof[\s\S]*?sourceReceipt[\s\S]*?sourceLocationConfidence[\s\S]*?sourceFileMatchRelease[\s\S]*?noHorizontalOverflow:\s*true[\s\S]*?const sourceLocationReadabilityProofs:\s*SourceLocationReadabilityProof\[\]\s*=\s*\[\][\s\S]*?sourceLocationReadabilityProofs\.push\(await assertSourceLocationConfidenceReady[\s\S]*?sourceLocationReadabilityProofs\.push\(await assertSourceLocationConfidenceFileAnchorReview[\s\S]*?project-qa-recoverable-narrow-320-covered/,
  'Project QA recoverable smoke must collect source-location readability proofs with containment, wrapping, 390px and 320px coverage.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /const sourceLocationReadability = \{[\s\S]*?status:\s*'OK'[\s\S]*?proofCount:\s*sourceLocationReadabilityProofs\.length[\s\S]*?mobile390Covered:\s*sourceLocationReadabilityProofs\.some[\s\S]*?narrow320Covered:\s*sourceLocationReadabilityProofs\.some[\s\S]*?sourceReceipt:\s*\{[\s\S]*?readyContained[\s\S]*?reviewContained[\s\S]*?referenceWraps[\s\S]*?titleNotClipped[\s\S]*?tagsNotClipped[\s\S]*?sourceLocationConfidence:\s*\{[\s\S]*?readyContained[\s\S]*?reviewContained[\s\S]*?metricsNotClipped[\s\S]*?checksWrap[\s\S]*?sourceFileMatchRelease:\s*\{[\s\S]*?readyContained[\s\S]*?reviewContained[\s\S]*?targetReferenceNotClipped[\s\S]*?citedReferenceNotClipped[\s\S]*?checksNotClipped[\s\S]*?noRepairOnReview[\s\S]*?noHorizontalOverflow[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Project QA recoverable smoke marker must aggregate source-location readability proof fields without provider-quality or LLM-fact overclaims.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /sourceLocationConfidence:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?surface:\s*'PROJECT_QA_SOURCE_LOCATION_CONFIDENCE'[\s\S]*?requestCount:\s*network\.qaRequests\.filter[\s\S]*?requestFilePathBound[\s\S]*?requestLineNumberBound[\s\S]*?lineAnchor:\s*\{[\s\S]*?sourceEvidenceMatched:\s*true[\s\S]*?sourceEvidenceMatchType:\s*'REPORT_LINE_ANCHOR'[\s\S]*?sourceLocationConfidenceReadyVisible:\s*assertions\.has\('source-location-confidence-ready-visible'\)[\s\S]*?repairCandidateActionVisible:\s*assertions\.has\('source-location-line-anchor-repair-action-visible'\)[\s\S]*?fileAnchorDrift:\s*\{[\s\S]*?sourceEvidenceMatched:\s*true[\s\S]*?sourceEvidenceMatchType:\s*'REPORT_FILE_ANCHOR'[\s\S]*?sourceLocationConfidenceReviewVisible:\s*assertions\.has\('source-location-confidence-review-visible'\)[\s\S]*?repairCandidateActionHidden:\s*assertions\.has\('source-location-file-anchor-repair-action-hidden'\)[\s\S]*?readability:\s*sourceLocationReadability[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Project QA recoverable smoke marker must include source-location confidence proof with no provider-quality or LLM-fact overclaims.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /const evidenceCombinationReadableFields = \[[\s\S]*?'topSource'[\s\S]*?'primaryCount'[\s\S]*?'adjacentContextCount'[\s\S]*?'uniqueFileCount'[\s\S]*?'embeddedEvidenceCount'[\s\S]*?'rolePath'[\s\S]*?'nextQuestions'[\s\S]*?\][\s\S]*?const adjacentContextChunk = \{[\s\S]*?contextRole:\s*'ADJACENT_CONTEXT'[\s\S]*?sourceLabel:\s*'C2'[\s\S]*?function assertEvidenceCombinationSummary[\s\S]*?getByLabel\('证据组合路径'\)[\s\S]*?跨文件复核路径[\s\S]*?主证据阅读起点[\s\S]*?相邻上下文[\s\S]*?文件覆盖[\s\S]*?解释 C1 的职责和关键分支[\s\S]*?把主证据和相邻上下文串成调用链/,
  'Project QA recoverable smoke must assert the evidence combination summary fields and cross-file context fixture.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /evidenceCombinationSummary:\s*\{[\s\S]*?visible:\s*assertions\.has\('evidence-combination-summary-readable'\)[\s\S]*?preservedAfterRefreshFailure:\s*assertions\.has\('evidence-combination-summary-preserved-after-refresh-failure'\)[\s\S]*?readableFields:\s*evidenceCombinationReadableFields[\s\S]*?primarySourceLabel:\s*'C1'[\s\S]*?adjacentContextCount:\s*1[\s\S]*?uniqueFileCount:\s*2[\s\S]*?embeddedEvidenceCount:\s*2[\s\S]*?nextQuestionCount:\s*3[\s\S]*?noHorizontalOverflow:\s*assertions\.has\('evidence-combination-summary-no-horizontal-overflow'\)/,
  'Project QA recoverable smoke marker must include structured evidence combination readability proof.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /async function assertCodeUnderstandingLens\(page: Page, label: string\)[\s\S]*?getByLabel\('代码理解定位入口'\)[\s\S]*?getByLabel\('Agent 交接合约'\)[\s\S]*?方法锚点[\s\S]*?按类名与方法名定位[\s\S]*?Scan #\$\{scanTaskId\}[\s\S]*?targetFile[\s\S]*?PRIMARY 主证据[\s\S]*?源码正文 \/ raw prompt \/ stack[\s\S]*?进入 AgentChat 后手动发送[\s\S]*?getByRole\('button', \{ name: '定位检索' \}\)[\s\S]*?getByRole\('button', \{ name: '解释此处' \}\)[\s\S]*?toBeEnabled\(\)[\s\S]*?getByRole\('button', \{ name: '交给 Agent' \}\)[\s\S]*?toBeEnabled\(\)[\s\S]*?async function assertCodeUnderstandingActionGate[\s\S]*?toBeDisabled\(\)[\s\S]*?STALE_SCAN_ACTION_GATE[\s\S]*?CONTEXT_ONLY_ACTION_GATE[\s\S]*?codeUnderstandingLens:\s*\{[\s\S]*?inputKind:\s*'METHOD_ANCHOR'[\s\S]*?currentScanBound:\s*assertions\.has\('code-understanding-lens-current-scan-bound'\)[\s\S]*?sourceLabel:\s*'C1'[\s\S]*?primaryReference:\s*`\$\{targetFile\}:51-89`[\s\S]*?retrievalMode:\s*'HYBRID'[\s\S]*?readiness:\s*'READY'[\s\S]*?agentHandoffContract:\s*\{[\s\S]*?visible:\s*assertions\.has\('code-understanding-lens-agent-handoff-contract-visible'\)[\s\S]*?structuredFieldsOnly:\s*true[\s\S]*?fields:\s*\['scanTaskId', 'filePath', 'lineRef', 'contextRole'\][\s\S]*?rawSourceBodyStored:\s*false[\s\S]*?rawStackStored:\s*false[\s\S]*?rawPromptStored:\s*false[\s\S]*?autoSent:\s*false[\s\S]*?manualSendRequired:\s*assertions\.has\('code-understanding-lens-agent-handoff-manual-send-visible'\)[\s\S]*?\}[\s\S]*?actionGate:\s*\{[\s\S]*?currentScanPrimaryRequired:\s*true[\s\S]*?agentHandoffEnabledWhenReady:\s*assertions\.has\('code-understanding-lens-agent-handoff-enabled-when-ready'\)[\s\S]*?staleScanExplainBlocked:\s*assertions\.has\('code-understanding-lens-stale-scan-explain-blocked'\)[\s\S]*?contextOnlyAgentHandoffBlocked:\s*assertions\.has\('code-understanding-lens-context-only-agent-handoff-blocked'\)[\s\S]*?\}[\s\S]*?handoffUrlSafety:\s*\{[\s\S]*?sourceSanitizedBeforeNavigation:\s*true[\s\S]*?rawPromptInUrl:\s*false[\s\S]*?rawStackInUrl:\s*false[\s\S]*?rawCodeInUrl:\s*false[\s\S]*?\}[\s\S]*?rawStackStored:\s*false[\s\S]*?rawPromptStored:\s*false/,
  'Project QA recoverable smoke marker must include method-anchor code-understanding lens and Agent handoff contract proof without raw stack, prompt or source-body storage.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /getByLabel\('Agent 交接门禁说明'\)[\s\S]*?Agent 交接门禁已开放[\s\S]*?readyGateStyles\.overflow[\s\S]*?readyGateStyles\.overflowWrap[\s\S]*?readyGateStyles\.textOverflow[\s\S]*?readyGateStyles\.whiteSpace[\s\S]*?Agent 交接门禁未开放[\s\S]*?gateStyles\.overflow[\s\S]*?gateStyles\.overflowWrap[\s\S]*?gateStyles\.textOverflow[\s\S]*?gateStyles\.whiteSpace[\s\S]*?explicitGateReasonVisible:\s*assertions\.has\('code-understanding-lens-agent-handoff-gate-reason-visible'\)[\s\S]*?readyGateReasonVisible:\s*assertions\.has\('code-understanding-lens-agent-handoff-gate-ready-visible'\)[\s\S]*?readyGateReasonStyleSafe:\s*assertions\.has\('code-understanding-lens-agent-handoff-gate-ready-style-safe'\)[\s\S]*?blockedGateReasonVisible:\s*assertions\.has\('code-understanding-lens-agent-handoff-gate-blocked-visible'\)[\s\S]*?contextOnlyGateReasonVisible:\s*assertions\.has\('code-understanding-lens-agent-handoff-gate-context-only-visible'\)[\s\S]*?gateReasonStyleSafe:\s*assertions\.has\('code-understanding-lens-agent-handoff-gate-reason-style-safe'\)/,
  'Project QA recoverable smoke must assert visible Agent handoff gate reasons, ready/blocked computed wrapping styles and marker proof fields.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /initial-code-chunk-search-error-state[\s\S]*?code-chunk-search-retry-recovers-results[\s\S]*?cached-code-chunk-refresh-error-preserves-results[\s\S]*?qa-request-error-state[\s\S]*?qa-retry-recovers-answer-citation/,
  'Project QA recoverable smoke must assert search initial failure, search retry, cached refresh preservation, QA failure and QA retry citation recovery.'
)
requirePattern(
  projectQaRecoverableSmokeSpec,
  /getByRole\('button', \{ name: '重新检索证据' \}\)[\s\S]*?getByRole\('button', \{ name: '重试此问题' \}\)[\s\S]*?getByRole\('button', \{ name: '恢复到输入框' \}\)/,
  'Project QA recoverable smoke must assert visible retry and restore controls.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5203\)[\s\S]*?testMatch:\s*\/project-qa-autorepair-candidate-smoke\\\.spec\\\.ts\//,
  'Project QA AutoRepair candidate smoke config must use a dedicated default port and target only project-qa-autorepair-candidate-smoke.spec.ts.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?if \(!path\.startsWith\('\/api\/'\)\) \{[\s\S]*?await route\.continue\(\)[\s\S]*?return[\s\S]*?\}/,
  'Project QA AutoRepair candidate smoke must not intercept Vite source modules such as /src/api/*.ts.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /unhandledApiRequests\.push\(`\$\{method\} \$\{path\}\$\{url\.search\}`\)[\s\S]*?status:\s*599/,
  'Project QA AutoRepair candidate smoke must fail closed for unmocked real /api requests.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'Project QA AutoRepair candidate smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  autoRepairs,
  /rootClassName="sl-autorepair-create-modal-root"[\s\S]*?className="sl-autorepair-create-modal"[\s\S]*?AutoRepairDraftReceipt[\s\S]*?aria-label="修复候选草稿凭证"[\s\S]*?Candidate Draft Receipt[\s\S]*?不展示完整问题、回答、原始代码或 prompt/,
  'AutoRepair create modal must use a scoped modal class and render a white-listed draft receipt before candidate submission.'
)
requirePattern(
  css,
  /\.sl-autorepair-create-modal[\s\S]*?max-width:\s*calc\(100vw - 24px\)[\s\S]*?\.sl-autorepair-create-modal \.ant-modal-footer[\s\S]*?flex-wrap:\s*wrap[\s\S]*?\.sl-autorepair-draft-receipt[\s\S]*?\.sl-autorepair-draft-grid[\s\S]*?overflow-wrap:\s*anywhere/,
  'AutoRepair create modal CSS must keep the draft receipt, form fields and footer buttons readable inside mobile viewports.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /PROJECT_QA_VERIFIED_UNCITED_[\s\S]*?citedByAnswer\)\.toBe\(false\)[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)\)\.toHaveCount\(0\)[\s\S]*?PROJECT_QA_PARTIAL_[\s\S]*?getByLabel\('QA 低置信度证据状态'\)[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)\)\.toHaveCount\(0\)[\s\S]*?PROJECT_QA_VERIFIED_CLAIM_REVIEW_[\s\S]*?claimCitationCoverage\?\.status\)\.toBe\('REVIEW'\)[\s\S]*?getByLabel\('主张引用质量'\)[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)\)\.toHaveCount\(0\)/,
  'Project QA AutoRepair candidate smoke must prove uncited VERIFIED, low-confidence citations and claim REVIEW citations do not expose repair actions.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /getByLabel\('QA 下一步动作'\)\.last\(\)[\s\S]*?getByText\('已阻断', \{ exact: true \}\)[\s\S]*?getByRole\('button', \{ name: '重试此问题' \}\)[\s\S]*?getByRole\('button', \{ name: '恢复到输入框' \}\)[\s\S]*?getByRole\('button', \{ name: '重新检索证据' \}\)[\s\S]*?getByText\('需复核', \{ exact: true \}\)[\s\S]*?getByText\('可采信', \{ exact: true \}\)[\s\S]*?getByRole\('button', \{ name: '复制首条引用' \}\)[\s\S]*?nextActionRailReadyAutoRepairDeepLinkBound:\s*true/,
  'Project QA AutoRepair candidate smoke must assert QA next action rail states and controls for blocked, review and trusted responses.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /PROJECT_QA_VERIFIED_CITED_[\s\S]*?citedByAnswer\)\.toBe\(true\)[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)\.last\(\)[\s\S]*?data-sl-target-url[\s\S]*?searchParams\.get\('projectId'\)[\s\S]*?searchParams\.get\('repositoryId'\)[\s\S]*?searchParams\.get\('scanTaskId'\)[\s\S]*?searchParams\.get\('filePath'\)[\s\S]*?searchParams\.get\('source'\)[\s\S]*?Project QA verified citation[\s\S]*?searchParams\.get\('sourceType'\)\)\.toBe\('PROJECT_QA_VERIFIED_CITATION'\)[\s\S]*?searchParams\.get\('citationId'\)[\s\S]*?searchParams\.get\('chunkId'\)[\s\S]*?searchParams\.get\('groundingStatus'\)\)\.toBe\('VERIFIED'\)[\s\S]*?searchParams\.get\('citationEnforcementStatus'\)\)\.toBe\('DIRECT_VERIFIED'\)[\s\S]*?searchParams\.get\('citationEnforcementReason'\)\)\.toBe\('DIRECT_VERIFIED'\)/,
  'Project QA AutoRepair candidate smoke must prove VERIFIED cited answer citations expose a scan-bound AutoRepair draft URL with citation enforcement reason.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /getByRole\('dialog', \{ name: '发起自动补丁生成任务' \}\)[\s\S]*?Project QA verified citation[\s\S]*?Scan #601[\s\S]*?getByLabel\('待修文件相对路径'\)[\s\S]*?getByLabel\('修改的具体目标描述'\)[\s\S]*?getByRole\('button', \{ name: '开始生成补丁' \}\)\.click\(\)/,
  'Project QA AutoRepair candidate smoke must prove the AutoRepair create modal receives the QA citation draft.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /function expectContainedInViewport[\s\S]*?function expectLocatorTextNotClipped[\s\S]*?function assertAutoRepairCreateModalReadability[\s\S]*?\.sl-autorepair-create-modal[\s\S]*?\.sl-autorepair-draft-receipt[\s\S]*?function assertCandidateReceiptReadability[\s\S]*?candidate-receipt-action-rail/,
  'Project QA AutoRepair candidate smoke must assert create-modal and candidate-receipt containment/readability, not just horizontal overflow.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /getByRole\('region', \{ name: \/任务详情 #9901\/ \}\)[\s\S]*?Scan Source Bridge[\s\S]*?来源扫描闭环[\s\S]*?该修复候选来自 Project QA 已验证引用[\s\S]*?Candidate Provenance Receipt[\s\S]*?PROJECT_QA_VERIFIED_CITATION[\s\S]*?#9201[\s\S]*?51-89[\s\S]*?DIRECT_VERIFIED[\s\S]*?getByRole\('button', \{ name: 'QA 复核此文件' \}\)[\s\S]*?data-sl-target-url[\s\S]*?AutoRepair #9901[\s\S]*?getByRole\('button', \{ name: '扫描审计' \}\)[\s\S]*?resourceType=AUTO_REPAIR[\s\S]*?resourceId=9901/,
  'Project QA AutoRepair candidate smoke must prove the created repair is immediately selected and its source bridge is bound to QA and audit deep links.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /getByLabel\('QA 回答报告证据凭证'\)\.last\(\)[\s\S]*?projectQaAutoRepairSafeMarker[\s\S]*?\[REDACTED\][\s\S]*?`\$\{sourceEvidenceRef\.filePath\}:\$\{sourceEvidenceRef\.lineNumber\}`[\s\S]*?`Scan #\$\{scanTaskId\}`[\s\S]*?'REPORT_LINE_ANCHOR'[\s\S]*?'行级锚点'/,
  'Project QA AutoRepair candidate smoke must prove the QA answer source receipt exposes redacted source evidence, scan and line anchor.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /locator\('\[aria-label="候选凭证复核动作"\]'\)[\s\S]*?Receipt Review Actions[\s\S]*?候选证据已就绪[\s\S]*?getByRole\('button', \{ name: '打开来源报告' \}\)[\s\S]*?data-sl-target-url[\s\S]*?\/scan-tasks\/\$\{scanTaskId\}[\s\S]*?getByRole\('button', \{ name: 'QA 复核凭证' \}\)[\s\S]*?PROJECT_QA_VERIFIED_CITATION[\s\S]*?getByRole\('button', \{ name: '查看候选审计' \}\)[\s\S]*?resourceId=9901/,
  'Project QA AutoRepair candidate smoke must prove candidate receipt review actions bind report, QA and audit deep links.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /expect\(network\.createRequests[\s\S]*?\)\.toHaveLength\(viewportMatrix\.length\)[\s\S]*?request\.payload\.repositoryId\)\.toBe\(repositoryId\)[\s\S]*?request\.payload\.scanTaskId\)\.toBe\(scanTaskId\)[\s\S]*?request\.payload\.filePath\)\.toBe\(targetFile\)[\s\S]*?Project QA 已验证引用 C1[\s\S]*?request\.payload\.provenance\?\.sourceType\)\.toBe\('PROJECT_QA_VERIFIED_CITATION'\)[\s\S]*?request\.payload\.provenance\?\.citationId[\s\S]*?request\.payload\.provenance\?\.citationEnforcementStatus\)\.toBe\('DIRECT_VERIFIED'\)[\s\S]*?request\.payload\.provenance\?\.citationEnforcementReason\)\.toBe\('DIRECT_VERIFIED'\)/,
  'Project QA AutoRepair candidate smoke must assert AutoRepair create payload binding to repository, scan, file, QA citation target and enforcement reason.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /const markerPayload = \{[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?qaRequestCount[\s\S]*?createRequestCount[\s\S]*?createPayloadBound[\s\S]*?provenancePayloadBound[\s\S]*?sourceEvidenceRefPayloadBound[\s\S]*?actionVisibility[\s\S]*?verifiedCitedVisible:\s*true[\s\S]*?verifiedUncitedHidden:\s*true[\s\S]*?lowConfidenceHidden:\s*true[\s\S]*?claimReviewHidden:\s*true[\s\S]*?nextActionRailTrustedVisible:\s*true[\s\S]*?nextActionRailReviewVisible:\s*true[\s\S]*?nextActionRailBlockedVisible:\s*true[\s\S]*?nextActionRailReadyAutoRepairDeepLinkBound:\s*true[\s\S]*?repairEvidenceGate:\s*\{[\s\S]*?readyVisible:\s*true[\s\S]*?blockedVisible:\s*true[\s\S]*?sourceEvidenceMatchType:\s*'REPORT_LINE_ANCHOR'[\s\S]*?createdRepairSelected:\s*true[\s\S]*?sourceBridge:\s*\{[\s\S]*?visible:\s*true[\s\S]*?qaCitationOriginVisible:\s*true[\s\S]*?scanTaskIdBound:\s*true[\s\S]*?qaDeepLinkBound:\s*true[\s\S]*?auditDeepLinkBound:\s*true[\s\S]*?candidateReceipt:\s*\{[\s\S]*?auditAction:\s*'AUTO_REPAIR_CANDIDATE_CREATED'[\s\S]*?citationEnforcementReasonBound:\s*true[\s\S]*?evidenceGateReady:\s*true[\s\S]*?sourceEvidenceMatchType:\s*'REPORT_LINE_ANCHOR'[\s\S]*?repairEvidenceGateSource:\s*'SERVER_DERIVED'[\s\S]*?actionRailVisible:\s*true[\s\S]*?reportDeepLinkBound:\s*true[\s\S]*?qaDeepLinkBound:\s*true[\s\S]*?auditDeepLinkBound:\s*true[\s\S]*?noRawPromptOrAnswer:\s*true[\s\S]*?console\.log\('PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK', markerText\)/,
  'Project QA AutoRepair candidate smoke marker must include mocked-only status, request counts, payload binding, action visibility, created repair selection and source bridge proof.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /layoutDensity:\s*\{[\s\S]*?mobile390Covered[\s\S]*?narrow320Covered[\s\S]*?dialogContained[\s\S]*?candidateReceiptContained[\s\S]*?actionRailContained[\s\S]*?noHorizontalOverflow[\s\S]*?mobileReadability:\s*\{[\s\S]*?criticalTextsWrap[\s\S]*?targetFileNotClipped[\s\S]*?targetDescNotClipped[\s\S]*?candidateReceiptTextNotClipped[\s\S]*?primaryButtonLabelNotClipped[\s\S]*?actionButtonsNotClipped[\s\S]*?qaHandoff:\s*\{[\s\S]*?qaDeepLinkBound[\s\S]*?scanTaskIdBound[\s\S]*?sourceTypeVisible/,
  'Project QA AutoRepair candidate smoke marker must include layoutDensity, mobileReadability and qaHandoff proof.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /qaAnswerSourceReceipt:\s*\{[\s\S]*?visible:\s*true[\s\S]*?sourceEvidenceTitleVisible:\s*true[\s\S]*?lineAnchorVisible:\s*true[\s\S]*?scanTaskIdBound:\s*true[\s\S]*?sourceEvidenceMatchType:\s*'REPORT_LINE_ANCHOR'[\s\S]*?noRawPromptOrAnswer:\s*true/,
  'Project QA AutoRepair candidate smoke marker must include QA answer source receipt visibility, scan binding and line-anchor proof.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /const projectQaAutoRepairSafeMarker[\s\S]*?const projectQaRawBearerSecret[\s\S]*?const projectQaRawAuthorizationSecret[\s\S]*?const projectQaRawApiKeySecret[\s\S]*?const projectQaRawPasswordSecret[\s\S]*?const projectQaRawJwtSecret[\s\S]*?forbiddenProjectQaAutoRepairSecrets/,
  'Project QA AutoRepair candidate smoke must inject raw secret sentinels before claiming display redaction.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /function assertProjectQaAutoRepairSecretsHidden[\s\S]*?bodyText[\s\S]*?not\.toContain\(secret\)[\s\S]*?data-sl-target-url[\s\S]*?decodedUrls[\s\S]*?not\.toContain\(secret\)[\s\S]*?browserUrl[\s\S]*?not\.toContain\(secret\)[\s\S]*?project-qa-citation-card-before-autorepair-handoff[\s\S]*?qa-citation-card-evidence-reason-redacted-before-handoff/,
  'Project QA AutoRepair candidate smoke must assert body, data-sl-target-url and browser URL do not contain raw secrets before and after handoff.'
)
requirePattern(
  projectQaAutoRepairCandidateSmokeSpec,
  /redaction:\s*\{[\s\S]*?scope:\s*'PROJECT_QA_AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY'[\s\S]*?surface:\s*'PROJECT_QA_VERIFIED_CITATION_AUTOREPAIR_CANDIDATE_RECEIPT'[\s\S]*?fixtureHasBearerSecret:\s*true[\s\S]*?fixtureHasAuthorizationSecret:\s*true[\s\S]*?fixtureHasApiKeySecret:\s*true[\s\S]*?fixtureHasPasswordSecret:\s*true[\s\S]*?fixtureHasJwtSecret:\s*true[\s\S]*?safeMarkerVisible:\s*true[\s\S]*?uiRawSecretsHidden:\s*true[\s\S]*?bodyRawSecretsHidden:\s*true[\s\S]*?urlRawSecretsHidden:\s*true[\s\S]*?payloadRawSecretsHidden:\s*true[\s\S]*?redactionVisible:\s*true[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?markerText[\s\S]*?not\.toContain\(secret\)/,
  'Project QA AutoRepair candidate smoke marker must include display redaction proof and exclude raw secret values.'
)
requirePattern(
  scanGovernanceTimelineSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5186\)/,
  'Scan governance timeline browser smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  scanGovernanceTimelineSmokeConfig,
  /testMatch:\s*\/scan-governance-timeline-smoke\\\.spec\\\.ts\//,
  'Scan governance timeline browser smoke config must target only scan-governance-timeline-smoke.spec.ts.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?if \(!path\.startsWith\('\/api\/'\)\) \{[\s\S]*?await route\.continue\(\)[\s\S]*?return[\s\S]*?\}/,
  'Scan governance timeline browser smoke must not intercept Vite source modules such as /src/api/*.ts.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /unhandledApiRequests\.push\(`\$\{method\} \$\{path\}\$\{url\.search\}`\)[\s\S]*?status:\s*599/,
  'Scan governance timeline browser smoke must fail closed for unmocked real /api requests.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'Scan governance timeline browser smoke must include a 320px narrow viewport in addition to desktop.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /getByLabel\('修复治理时间线'\)[\s\S]*?currentMarkers[\s\S]*?foreignMarkers[\s\S]*?toHaveCount\(0\)/,
  'Scan governance timeline browser smoke must assert current scan records appear and foreign scan records stay hidden.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /const governanceStageLabels = \['风险定位', '修复候选', 'Patch 证据', 'PR 复核', '审计归档'\][\s\S]*?getByLabel\('修复治理阶段轨道'\)[\s\S]*?governanceStageLabels[\s\S]*?stageRail\.getByText\(label, \{ exact: true \}\)/,
  'Scan governance timeline browser smoke must assert the visible staged repair governance rail.'
)
requirePattern(
  scanTaskGovernanceTimelineService,
  /AUTO_REPAIR_CANDIDATE_CREATED[\s\S]*?AUTO_REPAIR_CANDIDATE_RECEIPT[\s\S]*?候选来源凭证[\s\S]*?candidateReceiptDetail[\s\S]*?auditLog\.AUTO_REPAIR_CANDIDATE_CREATED sanitized provenance/,
  'ScanTaskGovernanceTimelineService must promote AutoRepair candidate-created audit logs into explicit candidate receipt events.'
)
requirePattern(
  scanTaskGovernanceTimelineService,
  /candidateReceiptDetail[\s\S]*?repairEvidenceGate[\s\S]*?门禁 [\s\S]*?repairEvidenceGateSource[\s\S]*?门禁来源 [\s\S]*?repairEvidenceGateReason[\s\S]*?门禁原因 /,
  'ScanTaskGovernanceTimelineService candidate receipt detail must surface server-derived repair evidence gate, source and reason.'
)
requirePattern(
  scanTaskDetail,
  /timelineEvents: ScanGovernanceEvent\[\][\s\S]*?timelineEvents:\s*\(timeline\?\.events \|\| \[\]\)[\s\S]*?\.filter\(event => isCurrentScanGovernanceEvent\(event, projectId, scanTaskId\)\)/,
  'ScanTaskDetail must preserve aggregate timeline events from the governance timeline API after applying scan-bound filtering.'
)
requirePattern(
  scanTaskDetail,
  /function isCurrentScanGovernanceEvent\(event: ScanGovernanceEvent, projectId: number, scanTaskId: number\)[\s\S]*?governanceRefScanBinding\(event\.resource, projectId, scanTaskId\)[\s\S]*?governanceRefScanBinding\(event\.source, projectId, scanTaskId\)[\s\S]*?bindings\.some\(binding => binding\.matchesCurrent\)[\s\S]*?bindings\.every\(binding => !binding\.conflicts\)[\s\S]*?hasProjectId && refProjectId !== projectId[\s\S]*?hasScanTaskId && refScanTaskId !== scanTaskId[\s\S]*?hasScanResourceId && refId !== scanTaskId/,
  'ScanTaskDetail must require a current-scan event anchor and reject any conflicting resource or source reference.'
)
requirePattern(
  scanGovernanceTimelineApi,
  /export interface GovernanceEvent[\s\S]*?repairEvidenceGate\?:[\s\S]*?repairEvidenceGateReason\?: string \| null[\s\S]*?repairEvidenceGateSource\?: string \| null/,
  'Scan governance timeline API types must preserve structured server-derived repair evidence gate fields.'
)
requirePattern(
  scanTaskDetail,
  /backendCandidateReceipts[\s\S]*?event\.eventType === 'AUTO_REPAIR_CANDIDATE_RECEIPT'[\s\S]*?const targetUrl = repairId \? autoRepairUrl\(projectId, scanTaskId, repairId\) : scanAuditUrl\(projectId, scanTaskId\)[\s\S]*?source: 'CandidateReceipt'[\s\S]*?actionLabel: repairId \? '打开修复详情' : '打开审计日志'[\s\S]*?onOpen: \(\) => onOpenUrl\(targetUrl\)[\s\S]*?actions: candidateReceiptTimelineActions\(/,
  'ScanTaskDetail must render aggregate candidate receipt events with multi-action review helpers.'
)
requirePattern(
  scanTaskDetail,
  /const candidateReceipt = log\.action === 'AUTO_REPAIR_CANDIDATE_CREATED'[\s\S]*?const repairTargetUrl = \(candidateReceipt \|\| prGate\) && log\.resourceId[\s\S]*?const auditTargetUrl = scanAuditUrl\(projectId, scanTaskId,[\s\S]*?resourceType: log\.resourceType \|\| undefined[\s\S]*?action: log\.action \|\| undefined[\s\S]*?status: log\.status \|\| undefined[\s\S]*?const targetUrl = repairTargetUrl \|\| auditTargetUrl[\s\S]*?actionLabel: \(candidateReceipt \|\| prGate\) && log\.resourceId \? '打开修复详情' : '打开审计日志'[\s\S]*?onOpen: \(\) => onOpenUrl\(targetUrl\)[\s\S]*?actions: candidateReceipt \? candidateReceiptTimelineActions\(/,
  'ScanTaskDetail must render fallback audit-log candidate receipt events with multi-action review helpers.'
)
requirePattern(
  scanTaskDetail,
  /function candidateReceiptTimelineActions\([\s\S]*?label: '打开修复详情'[\s\S]*?targetUrl: autoRepairUrl\(projectId, scanTaskId, repairId\)[\s\S]*?label: '打开来源报告'[\s\S]*?targetUrl: `\/scan-tasks\/\$\{scanTaskId\}`[\s\S]*?label: 'QA 复核来源'[\s\S]*?targetUrl: projectQaUrl\(projectId, qaQuestion, scanTaskId\)/,
  'ScanTaskDetail candidate receipt timeline helper must expose repair, source report and QA review deep links.'
)
requirePattern(
  scanTaskDetail,
  /function candidateReceiptDetail\(log: AuditLog\)[\s\S]*?repairEvidenceGate[\s\S]*?门禁 \$\{stringField\(provenance\.repairEvidenceGate[\s\S]*?repairEvidenceGateSource[\s\S]*?门禁来源 \$\{stringField\(provenance\.repairEvidenceGateSource[\s\S]*?repairEvidenceGateReason[\s\S]*?门禁原因 \$\{stringField\(provenance\.repairEvidenceGateReason/,
  'ScanTaskDetail fallback candidate receipt detail must render server-derived repair evidence gate, source and reason.'
)
requirePattern(
  scanTaskDetail,
  /event\.actions && event\.actions\.length > 0[\s\S]*?data-sl-target-url=\{action\.targetUrl\}[\s\S]*?label=\{action\.label\}[\s\S]*?data-sl-target-url=\{event\.targetUrl\}[\s\S]*?label=\{event\.actionLabel\}/,
  'ScanTaskDetail governance event actions must expose stable target URLs for multi-action candidate receipts and normal single-action events.'
)
requirePattern(
  scanTaskDetail,
  /function artifactsUrl\(projectId: number, ownerType: string, ownerId\?: number \| null, artifactId\?: number \| null\)[\s\S]*?params\.set\('ownerType', ownerType\)[\s\S]*?params\.set\('artifactId', String\(artifactId\)\)[\s\S]*?function executionTaskUrl\(projectId: number, taskId\?: number \| null\)[\s\S]*?params\.set\('taskId', String\(taskId\)\)[\s\S]*?function agentTaskUrl\(projectId: number, scanTaskId: number, taskId\?: number \| null\)[\s\S]*?params\.set\('scanTaskId', String\(scanTaskId\)\)[\s\S]*?params\.set\('taskId', String\(taskId\)\)/,
  'ScanTaskDetail must provide explicit artifact, execution and Agent task deep-link helpers for governance timeline actions.'
)
requirePattern(
  scanTaskDetail,
  /function scanAuditUrl\(projectId: number, scanTaskId: number, filters\?:[\s\S]*?resourceType\?: string \| null[\s\S]*?conversationId\?: number \| null[\s\S]*?params\.set\('scanTaskId', String\(scanTaskId\)\)[\s\S]*?params\.set\('resourceType', filters\.resourceType\)[\s\S]*?params\.set\('conversationId', String\(filters\.conversationId\)\)/,
  'ScanTaskDetail audit deep links must support scan, resource/action/status and conversation filters already understood by AuditLogsPage.'
)
requirePattern(
  scanTaskDetail,
  /source: 'PrGate'[\s\S]*?actionLabel: repairId \? '打开修复详情' : '打开审计日志'[\s\S]*?onOpen: \(\) => onOpenUrl\(targetUrl\)[\s\S]*?targetUrl/,
  'ScanTaskDetail PR gate governance events must use explicit repair/audit labels and target URLs.'
)
requirePattern(
  scanTaskDetail,
  /const targetUrl = artifactsUrl\(projectId, first\.ownerType, first\.ownerId, first\.id\)[\s\S]*?source: 'Artifact'[\s\S]*?actionLabel: first\.ownerType === 'AUTO_REPAIR' \? '打开补丁产物' : '打开 Agent 报告'[\s\S]*?onOpen: \(\) => onOpenUrl\(targetUrl\)[\s\S]*?targetUrl/,
  'ScanTaskDetail derived patch/agent artifact events must use owner and artifact-scoped deep links.'
)
requirePattern(
  scanTaskDetail,
  /source: 'AgentTask'[\s\S]*?actionLabel: '打开 Agent 任务'[\s\S]*?onOpen: \(\) => onOpenUrl\(targetUrl\)[\s\S]*?targetUrl/,
  'ScanTaskDetail Agent task governance events must open the exact Agent task deep link.'
)
requirePattern(
  scanTaskDetail,
  /conversationId: call\.conversationId \|\| undefined[\s\S]*?source: 'AgentToolCall'[\s\S]*?actionLabel: '打开审计日志'[\s\S]*?onOpen: \(\) => onOpenUrl\(targetUrl\)[\s\S]*?targetUrl/,
  'ScanTaskDetail Agent tool-call governance events must open scan/conversation-scoped audit logs.'
)
rejectPattern(
  scanTaskDetail,
  /actionLabel: '审计'|actionLabel: '任务列表'|actionLabel: '执行详情'|actionLabel: '产物库'|actionLabel: repairId \? '打开修复'/,
  'ScanTaskDetail governance timeline must not regress to vague legacy action labels.'
)
requirePattern(
  scanTaskDetail,
  /candidateReceiptCount = auditLogs\.filter\(log => log\.action === 'AUTO_REPAIR_CANDIDATE_CREATED'\)\.length[\s\S]*?个修复候选已绑定当前扫描，\$\{formatNumber\(candidateReceiptCount\)\} 个有来源凭证/,
  'ScanTaskDetail repair-candidate stage must quantify candidate receipts.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /AUTO_REPAIR_CANDIDATE_CREATED[\s\S]*?AUTO_REPAIR_CANDIDATE_RECEIPT[\s\S]*?候选来源凭证[\s\S]*?PROJECT_QA_VERIFIED_CITATION[\s\S]*?GOV_CANDIDATE_RECEIPT_CURRENT/,
  'Scan governance timeline smoke must include a current AutoRepair candidate receipt event.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /AUTO_REPAIR_CANDIDATE_RECEIPT[\s\S]*?repairEvidenceGateReason:\s*candidateGateReason[\s\S]*?GOV_CANDIDATE_RECEIPT_FOREIGN_TIMELINE[\s\S]*?getByText\('门禁 READY'[\s\S]*?getByText\('门禁来源 SERVER_DERIVED'[\s\S]*?getByText\(`门禁原因 \$\{candidateGateReason\}`[\s\S]*?repairEvidenceGate:\s*'READY'[\s\S]*?repairEvidenceGateReason:\s*candidateGateReason[\s\S]*?repairEvidenceGateSource:\s*'SERVER_DERIVED'[\s\S]*?serverDerivedGateVisible:\s*true/,
  'Scan governance timeline smoke must prove the candidate receipt server-derived repair evidence gate, source and reason are visible and included in the marker.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /GOV_CANDIDATE_RECEIPT_FOREIGN_TIMELINE[\s\S]*?getByRole\('button', \{ name: '打开修复详情' \}\)[\s\S]*?\/auto-repairs\?projectId=\$\{projectId\}&scanTaskId=\$\{scanTaskId\}&repairId=\$\{repairId\}[\s\S]*?getByRole\('button', \{ name: '打开来源报告' \}\)[\s\S]*?\/scan-tasks\/\$\{scanTaskId\}[\s\S]*?getByRole\('button', \{ name: 'QA 复核来源' \}\)[\s\S]*?治理时间线中的候选来源凭证[\s\S]*?foreignMarkers[\s\S]*?toHaveCount\(0\)[\s\S]*?foreignReceiptHidden:\s*true[\s\S]*?autoRepairDeepLinkBound:\s*true[\s\S]*?sourceReportDeepLinkBound:\s*true[\s\S]*?qaReviewDeepLinkBound:\s*true/,
  'Scan governance timeline smoke must prove current candidate receipt repair/report/QA deep links and foreign candidate receipt exclusion from aggregate timeline events.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /expectGovernanceApiOnEveryViewport\(network\.governanceTimelineUrls\)[\s\S]*?expect\(network\.legacyTimelineRequests,[\s\S]*?\)\.toEqual\(\[\]\)[\s\S]*?expectQueryParamOnEveryRequest\(network\.artifactQueries, 'ownerType', 'SCAN_TASK', 'artifacts'\)[\s\S]*?expectQueryParamOnEveryRequest\(network\.artifactQueries, 'ownerId', String\(scanTaskId\), 'artifacts'\)/,
  'Scan governance timeline browser smoke must prove the aggregate API is project/scan scoped and legacy fan-out is not used.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /expectGovernanceApiOnEveryViewport\(urls: string\[\]\)[\s\S]*?\/projects\/\$\{projectId\}\/scan-tasks\/\$\{scanTaskId\}\/governance-timeline/,
  'Scan governance timeline browser smoke must prove the aggregate URL is project and scan scoped.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /scanExecutionSourceUrls\.every\(url => url\.includes\(`\/source\/SCAN_TASK\/\$\{scanTaskId\}`\)\)/,
  'Scan governance timeline browser smoke must prove the scan execution source URL is scan-bound.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /expect\(network\.unhandledApiRequests,[\s\S]*?\)\.toEqual\(\[\]\)[\s\S]*?Runtime issues must be empty/,
  'Scan governance timeline browser smoke must assert mocked-only API handling and no runtime errors.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /async function clickTimelineActionAndAssertLanding\([\s\S]*?data-sl-target-url[\s\S]*?page\.waitForURL[\s\S]*?button\.click\(\)[\s\S]*?assertLanding\(targetUrl/,
  'Scan governance timeline browser smoke must click real timeline actions and assert landing pages, not only inspect data-sl-target-url.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /runActionLandingAssertions\(page: Page\)[\s\S]*?clickedActionCount: 0[\s\S]*?autoRepairSelected: false[\s\S]*?artifactSelected: false[\s\S]*?executionTaskSelected: false[\s\S]*?auditResourceFiltered: false[\s\S]*?toolCallFiltered: false[\s\S]*?agentTaskSelected: false[\s\S]*?rawAgentTaskPayloadHidden: false[\s\S]*?qaContextBound: false[\s\S]*?clickedActionCount === 7[\s\S]*?allSelectedOrFiltered/,
  'Scan governance timeline browser smoke must summarize all required action landing selections and filters.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /GOV-AGENTTASK-CURRENT 扫描治理复核[\s\S]*?打开 Agent 任务[\s\S]*?RAW_AGENT_PROMPT_SHOULD_NOT_RENDER[\s\S]*?toHaveCount\(0\)[\s\S]*?RAW_AGENT_ANSWER_SHOULD_NOT_RENDER[\s\S]*?toHaveCount\(0\)[\s\S]*?rawAgentTaskPayloadHidden = true/,
  'Scan governance timeline browser smoke must actually prove AgentTask landing hides raw prompt and answer payloads.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /AutoRepair 产物已归档 1 个[\s\S]*?打开补丁产物[\s\S]*?params\.get\('artifactId'\)\)\.toBe\(String\(patchArtifactId\)\)[\s\S]*?补丁文件 #\$\{patchArtifactId\}/,
  'Scan governance timeline browser smoke must prove artifact action landing consumes artifactId and opens the selected artifact preview.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /SCAN_GOVERNANCE_TIMELINE_SMOKE_OK[\s\S]*?actionLanding[\s\S]*?clickedActionCount[\s\S]*?allLandingPagesLoaded[\s\S]*?allSelectedOrFiltered[\s\S]*?rawAgentTaskPayloadHidden[\s\S]*?qaContextBound/,
  'Scan governance timeline browser smoke marker must include actionLanding with clicked count and selected or filtered landing proof.'
)
requirePattern(
  scanGovernanceTimelineSmokeSpec,
  /SCAN_GOVERNANCE_TIMELINE_SMOKE_OK[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*network\.unhandledApiRequests\.length[\s\S]*?scanTaskId[\s\S]*?foreignScanExcluded:\s*true[\s\S]*?stageRail:\s*\{[\s\S]*?visible:\s*true[\s\S]*?stages:\s*governanceStageLabels[\s\S]*?states:\s*governanceStageStates[\s\S]*?candidateReceipt:\s*\{[\s\S]*?eventVisible:\s*true[\s\S]*?sourceTypeVisible:\s*true[\s\S]*?currentReceiptVisible:\s*true[\s\S]*?foreignReceiptHidden:\s*true[\s\S]*?autoRepairDeepLinkBound:\s*true[\s\S]*?noRawPromptOrAnswer:\s*true[\s\S]*?prGate:\s*\{[\s\S]*?eventVisible:\s*true[\s\S]*?action:\s*'AUTO_REPAIR_PR_REJECTED'[\s\S]*?currentRepairVisible:\s*true[\s\S]*?foreignPrGateHidden:\s*true[\s\S]*?autoRepairDeepLinkBound:\s*true[\s\S]*?auditSourceBound:\s*true[\s\S]*?scanTaskIdBound:\s*true[\s\S]*?noRawPromptOrAnswer:\s*true[\s\S]*?patchEvidence:\s*\{[\s\S]*?repairVisible:\s*true[\s\S]*?autoRepairId:\s*repairId[\s\S]*?repairStatus:\s*'PATCH_READY'[\s\S]*?scanTaskIdBound:\s*true[\s\S]*?targetFileVisible:\s*true[\s\S]*?diffVisible:\s*true[\s\S]*?patchArtifactVisible:\s*true[\s\S]*?patchArtifactOwnerType:\s*'AUTO_REPAIR'[\s\S]*?patchArtifactOwnerId:\s*repairId[\s\S]*?patchArtifactType:\s*'CHANGE_PATCH'[\s\S]*?patchArtifactActionVisible:\s*true[\s\S]*?repairExecutionVisible:\s*true[\s\S]*?repairExecutionSourceType:\s*'AUTO_REPAIR'[\s\S]*?repairExecutionSourceId:\s*repairId[\s\S]*?repairExecutionStatus:\s*'SUCCESS'[\s\S]*?patchGenerationStepVisible:\s*true[\s\S]*?patchGenerationStepKey:\s*'generate_patch'[\s\S]*?patchGenerationStepStatus:\s*'SUCCESS'[\s\S]*?patchReadyAuditVisible:\s*true[\s\S]*?patchReadyAuditAction:\s*'AUTO_REPAIR_PATCH_READY'[\s\S]*?patchReadyAuditStatus:\s*'SUCCESS'[\s\S]*?auditSourceBound:\s*true[\s\S]*?foreignPatchEvidenceHidden:\s*true[\s\S]*?noRawPromptOrAnswer:\s*true[\s\S]*?agentReview:\s*\{[\s\S]*?currentAgentTaskVisible:\s*true[\s\S]*?currentAgentTaskId:\s*agentTaskId[\s\S]*?foreignAgentTaskHidden:\s*true[\s\S]*?toolCallAuditVisible:\s*true[\s\S]*?currentToolCallId:\s*agentToolCallId[\s\S]*?foreignToolCallHidden:\s*true[\s\S]*?agentExecutionBound:\s*true[\s\S]*?currentAgentExecutionVisible:\s*true[\s\S]*?agentExecutionSourceType:\s*'AGENT_TASK'[\s\S]*?agentExecutionSourceId:\s*agentTaskId[\s\S]*?scanTaskIdBound:\s*true[\s\S]*?noRawPromptOrAnswer:\s*true[\s\S]*?viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)/,
  'Scan governance timeline browser smoke marker must include mocked-only status, unhandled API count, scan id, foreign exclusion, staged rail proof, candidate receipt proof, PR gate proof and viewport matrix.'
)
requirePattern(
  appShellUiSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5188\)/,
  'App shell UI smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  appShellUiSmokeConfig,
  /testMatch:\s*\/app-shell-ui-smoke\\\.spec\\\.ts\//,
  'App shell UI smoke config must target only app-shell-ui-smoke.spec.ts.'
)
requirePattern(
  agentTasksDetailSelectionSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5189\)/,
  'AgentTasks detail selection smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  agentChatClosureRailSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5196\)/,
  'AgentChat closure rail smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  agentChatClosureRailSmokeConfig,
  /testMatch:\s*\/agent-chat-closure-rail-smoke\\\.spec\\\.ts\//,
  'AgentChat closure rail smoke config must target only agent-chat-closure-rail-smoke.spec.ts.'
)
requirePattern(
  agentTasksDetailSelectionSmokeConfig,
  /testMatch:\s*\/agent-tasks-detail-selection-smoke\\\.spec\\\.ts\//,
  'AgentTasks detail selection smoke config must target only agent-tasks-detail-selection-smoke.spec.ts.'
)
requirePattern(
  executionTasksDetailSelectionSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5190\)/,
  'ExecutionTasks detail selection smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  executionTasksDetailSelectionSmokeConfig,
  /testMatch:\s*\/execution-tasks-detail-selection-smoke\\\.spec\\\.ts\//,
  'ExecutionTasks detail selection smoke config must target only execution-tasks-detail-selection-smoke.spec.ts.'
)
requirePattern(
  artifactsDetailSelectionSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5191\)/,
  'Artifacts detail selection smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  artifactsDetailSelectionSmokeConfig,
  /testMatch:\s*\/artifacts-detail-selection-smoke\\\.spec\\\.ts\//,
  'Artifacts detail selection smoke config must target only artifacts-detail-selection-smoke.spec.ts.'
)
requirePattern(
  p9RecoverableErrorBatch3SmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5197\)/,
  'P9 batch 3 recoverable error states smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  p9RecoverableErrorBatch3SmokeConfig,
  /testMatch:\s*\/p9-main-path-recoverable-error-states-batch3\\\.spec\\\.ts\//,
  'P9 batch 3 recoverable error states smoke config must target only p9-main-path-recoverable-error-states-batch3.spec.ts.'
)
requirePattern(
  p9RecoverableErrorBatch4ASmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5198\)/,
  'P9 batch 4A recoverable error states smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  p9RecoverableErrorBatch4ASmokeConfig,
  /testMatch:\s*\/p9-main-path-recoverable-error-states-batch4a\\\.spec\\\.ts\//,
  'P9 batch 4A recoverable error states smoke config must target only p9-main-path-recoverable-error-states-batch4a.spec.ts.'
)
requirePattern(
  p9RecoverableErrorBatch4BSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5199\)/,
  'P9 batch 4B recoverable error states smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  p9RecoverableErrorBatch4BSmokeConfig,
  /testMatch:\s*\/p9-main-path-recoverable-error-states-batch4b\\\.spec\\\.ts\//,
  'P9 batch 4B recoverable error states smoke config must target only p9-main-path-recoverable-error-states-batch4b.spec.ts.'
)
requirePattern(
  modelConfigRecoverableSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5201\)/,
  'ModelConfig recoverable smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  modelConfigRecoverableSmokeConfig,
  /testMatch:\s*\/model-config-recoverable-smoke\\\.spec\\\.ts\//,
  'ModelConfig recoverable smoke config must target only model-config-recoverable-smoke.spec.ts.'
)
requirePattern(
  auditLogsDetailSelectionSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5192\)/,
  'AuditLogs detail selection smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  auditLogsDetailSelectionSmokeConfig,
  /testMatch:\s*\/audit-logs-detail-selection-smoke\\\.spec\\\.ts\//,
  'AuditLogs detail selection smoke config must target only audit-logs-detail-selection-smoke.spec.ts.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5193\)/,
  'CI Diagnostics detail selection smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeConfig,
  /testMatch:\s*\/ci-diagnostics-detail-selection-smoke\\\.spec\\\.ts\//,
  'CI Diagnostics detail selection smoke config must target only ci-diagnostics-detail-selection-smoke.spec.ts.'
)
requirePattern(
  prReviewsDetailSelectionSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5194\)/,
  'PR Reviews detail selection smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  prReviewsDetailSelectionSmokeConfig,
  /testMatch:\s*\/pr-reviews-detail-selection-smoke\\\.spec\\\.ts\//,
  'PR Reviews detail selection smoke config must target only pr-reviews-detail-selection-smoke.spec.ts.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5195\)/,
  'IssueDecomposition detail selection smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeConfig,
  /testMatch:\s*\/issue-decomposition-detail-selection-smoke\\\.spec\\\.ts\//,
  'IssueDecomposition detail selection smoke config must target only issue-decomposition-detail-selection-smoke.spec.ts.'
)
requirePattern(
  appShellUiSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'App shell UI smoke must include a 320px narrow viewport in addition to desktop.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'tablet', width: 1024, height: 768 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'AgentTasks detail selection smoke must include desktop, 1024px tablet, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'ExecutionTasks detail selection smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'Artifacts detail selection smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'AuditLogs detail selection smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'CI Diagnostics detail selection smoke must include a 320px narrow viewport in addition to desktop.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'PR Reviews detail selection smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'tablet', width: 1024, height: 768 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'IssueDecomposition detail selection smoke must include desktop, 1024px tablet, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /path === `\/api\/projects\/\$\{projectId\}\/agent-tasks`/,
  'AgentTasks detail selection smoke must mock the project task list API.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /path === `\/api\/projects\/\$\{projectId\}\/execution-tasks`/,
  'ExecutionTasks detail selection smoke must mock the project task list API.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /path === `\/api\/projects\/\$\{projectId\}\/artifacts`/,
  'Artifacts detail selection smoke must mock the project artifact list API.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /path === `\/api\/projects\/\$\{projectId\}\/ci-diagnostics`/,
  'CI Diagnostics detail selection smoke must mock the project CI diagnostics list API.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /path === `\/api\/projects\/\$\{projectId\}\/auto-repairs`[\s\S]*?path === `\/api\/projects\/\$\{projectId\}\/repositories`/,
  'CI Diagnostics detail selection smoke must mock AutoRepair destination APIs when checking candidate navigation.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /path === `\/api\/projects\/\$\{projectId\}\/pr-reviews`/,
  'PR Reviews detail selection smoke must mock the project PR reviews list API.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /path === `\/api\/projects\/\$\{projectId\}\/issue-decompositions`/,
  'IssueDecomposition detail selection smoke must mock the project decomposition list API.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /path\.match\(\^?\/?[\s\S]*?issue-decompositions[\s\S]*?tasks/,
  'IssueDecomposition detail selection smoke must mock the decomposition tasks API.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /path\.match\(\^?\/?[\s\S]*?issue-decompositions[\s\S]*?export[\s\S]*?markdown/,
  'IssueDecomposition detail selection smoke must mock Markdown export API.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /path\.match\(\^?\/?[\s\S]*?issue-tasks[\s\S]*?\\d\+/,
  'IssueDecomposition detail selection smoke must mock task status update API.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /path === `\/api\/projects\/\$\{projectId\}\/auto-repairs`[\s\S]*?path === `\/api\/projects\/\$\{projectId\}\/repositories`/,
  'PR Reviews detail selection smoke must mock AutoRepair destination APIs when checking candidate navigation.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /path\.match\(\^?\/?[\s\S]*?pr-reviews[\s\S]*?comments/,
  'PR Reviews detail selection smoke must mock the review comments API.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /path\.match\(\^?\/?[\s\S]*?pr-reviews[\s\S]*?reanalyze/,
  'PR Reviews detail selection smoke must mock the reanalyze API.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /path\.match\(\^?\/?[\s\S]*?ci-diagnostics[\s\S]*?reanalyze/,
  'CI Diagnostics detail selection smoke must mock the reanalyze API.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /const detailMatch = path\.match\(\^?\/?[\s\S]*?ci-diagnostics[\s\S]*?\\d\+[\s\S]*?\)[\s\S]*?detailRequests\.push\(diagnosticId\)[\s\S]*?detachedDiagnostic/,
  'CI Diagnostics detail selection smoke must mock the CI diagnostic detail API for source deep-link hydration.'
)
for (const [name, pattern] of [
  ['audit logs', /path === `\/api\/projects\/\$\{projectId\}\/audit-logs`/],
  ['agent tool calls', /path === `\/api\/projects\/\$\{projectId\}\/agent-tool-calls`/],
  ['github webhook deliveries', /path === `\/api\/projects\/\$\{projectId\}\/github-webhook-deliveries`/],
]) {
  requirePattern(auditLogsDetailSelectionSmokeSpec, pattern, `AuditLogs detail selection smoke must mock ${name} API.`)
}
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /path\.match\(\^?\/?[\s\S]*?agent-tasks[\s\S]*?steps/,
  'AgentTasks detail selection smoke must mock the task steps API.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /path\.match\(\^?\/?[\s\S]*?execution-tasks[\s\S]*?\\d\+/,
  'ExecutionTasks detail selection smoke must mock the task detail API.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /path\.match\(\^?\/?[\s\S]*?artifacts[\s\S]*?preview/,
  'Artifacts detail selection smoke must mock artifact preview API requests.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /path\.match\(\^?\/?[\s\S]*?artifacts[\s\S]*?download/,
  'Artifacts detail selection smoke must mock artifact download API requests.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /url\.searchParams\.get\('rawDownloadAcknowledged'\) === 'true'[\s\S]*?downloadBoundaries\.push\(\{[\s\S]*?acknowledgementPresent[\s\S]*?rawDownloadRedactionClaim:\s*false/,
  'Artifacts detail selection smoke must prove raw download requests carry acknowledgement and do not claim redaction.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /getByRole\('button', \{ name: `查看 Agent 任务 #\$\{targetTaskId\} 详情` \}\)[\s\S]*?toHaveAttribute\('aria-selected', 'true'\)[\s\S]*?keyboard\.press\('Enter'\)[\s\S]*?keyboard\.press\('Space'\)[\s\S]*?nestedActionsDoNotHijackSelection:\s*true/s,
  'AgentTasks detail selection smoke must prove explicit detail action, aria-selected state, Enter/Space opening and nested action isolation.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /getByRole\('button', \{ name: `查看执行任务 #\$\{targetTaskId\} 详情` \}\)[\s\S]*?toHaveAttribute\('aria-selected', 'true'\)[\s\S]*?keyboard\.press\('Enter'\)[\s\S]*?keyboard\.press\('Space'\)[\s\S]*?nestedActionsDoNotHijackSelection:\s*true/s,
  'ExecutionTasks detail selection smoke must prove explicit detail action, aria-selected state, Enter/Space opening and nested action isolation.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /function assertLinkedDetailRegion[\s\S]*?toHaveAttribute\('aria-controls', detailId\)[\s\S]*?toHaveAttribute\('role', 'region'\)[\s\S]*?toHaveAttribute\('aria-labelledby', titleId\)[\s\S]*?getByRole\('button', \{ name: `查看 架构报告 #\$\{targetArtifactId\} 详情` \}\)[\s\S]*?toHaveAttribute\('aria-selected', 'true'\)[\s\S]*?assertLinkedDetailRegion\(page, targetArtifactId\)[\s\S]*?keyboard\.press\('Enter'\)[\s\S]*?assertLinkedDetailRegion\(page, targetArtifactId\)[\s\S]*?keyboard\.press\('Space'\)[\s\S]*?assertLinkedDetailRegion\(page, secondaryArtifactId\)[\s\S]*?getByRole\('button', \{ name: `预览 架构报告 #\$\{targetArtifactId\}` \}\)[\s\S]*?assertLinkedDetailRegion\(page, targetArtifactId\)[\s\S]*?nestedActionsDoNotHijackSelection:\s*true/s,
  'Artifacts detail selection smoke must prove explicit detail action, linked detail region, aria-selected state, Enter/Space opening, preview binding and nested action isolation.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /function assertLinkedDetailRegion[\s\S]*?toHaveAttribute\('aria-controls', detailId\)[\s\S]*?toHaveAttribute\('role', 'region'\)[\s\S]*?toHaveAttribute\('aria-labelledby', titleId\)[\s\S]*?rowFor\(page, new RegExp\(`AuditLog #\$\{targetAuditLogId\}`\)\)[\s\S]*?getByRole\('button', \{ name: 'AUTO_REPAIR_CANDIDATE_CREATED' \}\)[\s\S]*?toHaveAttribute\('aria-selected', 'true'\)[\s\S]*?assertLinkedDetailRegion\([\s\S]*?`audit-log-detail-\$\{targetAuditLogId\}`[\s\S]*?getByRole\('region', \{ name: '审计候选凭证复核' \}\)[\s\S]*?getByRole\('button', \{ name: '打开修复详情' \}\)[\s\S]*?getByRole\('button', \{ name: '打开来源报告' \}\)[\s\S]*?getByRole\('button', \{ name: 'QA 复核来源' \}\)[\s\S]*?keyboard\.press\('Enter'\)[\s\S]*?assertLinkedDetailRegion\([\s\S]*?`audit-log-detail-\$\{targetAuditLogId\}`[\s\S]*?keyboard\.press\('Space'\)[\s\S]*?assertLinkedDetailRegion\([\s\S]*?`audit-log-detail-\$\{secondaryAuditLogId\}`[\s\S]*?selectTab\(page, 'Agent 工具调用'\)[\s\S]*?assertLinkedDetailRegion\([\s\S]*?`agent-tool-call-detail-\$\{targetToolCallId\}`[\s\S]*?assertLinkedDetailRegion\([\s\S]*?`agent-tool-call-detail-\$\{secondaryToolCallId\}`[\s\S]*?selectTab\(page, 'GitHub Webhook'\)[\s\S]*?assertLinkedDetailRegion\([\s\S]*?`github-webhook-delivery-detail-\$\{targetDeliveryId\}`[\s\S]*?assertLinkedDetailRegion\([\s\S]*?`github-webhook-delivery-detail-\$\{secondaryDeliveryId\}`[\s\S]*?nestedActionsDoNotHijackSelection:\s*true/s,
  'AuditLogs detail selection smoke must prove explicit detail actions, linked detail regions, aria-selected state, Enter/Space opening and three governance tabs.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /function expectReadableCriticalText[\s\S]*?whiteSpace[\s\S]*?overflowWrap[\s\S]*?scrollWidth[\s\S]*?function assertAuditDrawerDensity[\s\S]*?\.ant-drawer-open \.ant-drawer-content-wrapper[\s\S]*?expectNoHorizontalOverflow\(page, `\$\{label\}:audit-drawer-open`\)[\s\S]*?details\.sl-audit-json-block[\s\S]*?raw-json-default-collapsed[\s\S]*?pre\.sl-audit-json-redacted[\s\S]*?raw-json-expanded/,
  'AuditLogs detail selection smoke must assert drawer open-state readability, critical text wrapping and collapsible redacted raw JSON.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /auditRawBearerSecret[\s\S]*?auditRawAuthorizationSecret[\s\S]*?auditRawApiKeySecret[\s\S]*?auditRawPasswordSecret[\s\S]*?auditRawQuotedSecret[\s\S]*?auditRawJwtSecret[\s\S]*?auditRawPrivateKeySecret[\s\S]*?forbiddenAuditJsonSecrets[\s\S]*?function assertRedactedAuditJsonBlock[\s\S]*?pre\.sl-audit-json-redacted\[aria-label="\$\{title\} 脱敏 JSON"\][\s\S]*?toContainText\('\[REDACTED\]'\)[\s\S]*?not\.toContainText\(secret\)[\s\S]*?assertRedactedAuditJsonBlock\(page, viewport\.name, 'Sanitized Input'[\s\S]*?assertRedactedAuditJsonBlock\(page, `\$\{viewport\.name\}:agent-tools`, 'Arguments'[\s\S]*?assertRedactedAuditJsonBlock\(page, `\$\{viewport\.name\}:deliveries`, 'Result'/,
  'AuditLogs detail selection smoke must inject raw audit JSON secrets and prove all three expanded JSON blocks render only redacted display text.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /function expectAuditTableScrollerContained[\s\S]*?\.sl-audit-tab-panel:visible \.sl-audit-table-card[\s\S]*?expectContainedInViewport\(tableCard[\s\S]*?\.ant-table-content[\s\S]*?overflowX/,
  'AuditLogs detail selection smoke must verify dense table scrollers remain viewport-contained on narrow screens.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /test\('AuditLogs audit deep links land on exact resource action and status'[\s\S]*?resourceType=AUTO_REPAIR&resourceId=601&action=AUTO_REPAIR_CANDIDATE_CREATED&status=SUCCESS[\s\S]*?not\.toContainText\(`审计事件 #\$\{conflictingAuditLogId\}`\)[\s\S]*?AUDIT_LOGS_EXACT_DEEP_LINK_SMOKE_OK[\s\S]*?resourceActionStatusMatched:\s*true/,
  'AuditLogs exact audit deep-link smoke must prove action/status filters prevent same-resource wrong drawer selection.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /test\('AuditLogs audit deep links fail closed when no exact event matches'[\s\S]*?action=DOES_NOT_EXIST&status=SUCCESS[\s\S]*?openDrawer\(page\)\)\.toHaveCount\(0\)[\s\S]*?未找到目标审计事件[\s\S]*?AUDIT_LOGS_DEEP_LINK_MISS_SMOKE_OK[\s\S]*?failClosedWhenMissing:\s*true/,
  'AuditLogs deep-link miss smoke must prove missing exact events do not open an incorrect drawer.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /test\('AuditLogs artifact raw download audit deep links return to artifact detail'[\s\S]*?auditLogId=\$\{artifactDownloadAuditLogId\}[\s\S]*?params\.get\('auditLogId'\) === String\(artifactDownloadAuditLogId\)[\s\S]*?AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK[\s\S]*?auditLogId:\s*artifactDownloadAuditLogId[\s\S]*?auditLogIdBound:\s*true[\s\S]*?resourceActionStatusMatched:\s*true[\s\S]*?associatedResourceReturnBound:\s*true/,
  'AuditLogs artifact raw download deep-link smoke must prove receipt-id-bound exact matching and artifact detail return.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /page\.goto\(`\/ci-diagnostics\?projectId=\$\{projectId\}&diagnosticId=\$\{detachedDiagnosticId\}`\)[\s\S]*?toHaveAttribute\('aria-controls', `ci-diagnostic-detail-\$\{detachedDiagnosticId\}`\)[\s\S]*?network\.detailRequests\)\.toContain\(detachedDiagnosticId\)[\s\S]*?page\.goto\(`\/ci-diagnostics\?projectId=\$\{projectId\}&diagnosticId=\$\{targetDiagnosticId\}`\)[\s\S]*?rowFor\(page, new RegExp\(`CiDiagnostic #\$\{targetDiagnosticId\}`\)\)[\s\S]*?toHaveAttribute\('aria-selected', 'true'\)[\s\S]*?getByRole\('button', \{ name: 'CI Build' \}\)[\s\S]*?keyboard\.press\('Enter'\)[\s\S]*?keyboard\.press\('Space'\)[\s\S]*?getByRole\('button', \{ name: `重新分析 CI 诊断 #\$\{targetDiagnosticId\}` \}\)[\s\S]*?nestedActionsDoNotHijackSelection:\s*true/s,
  'CI Diagnostics detail selection smoke must prove diagnosticId source deep links, explicit workflow action, aria-selected state, Enter/Space opening and reanalyze isolation.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /getByRole\('button', \{ name: '生成修复候选' \}\)[\s\S]*?expect\(repairUrl\.searchParams\.get\('projectId'\)\)\.toBe\(String\(projectId\)\)[\s\S]*?expect\(repairUrl\.searchParams\.get\('repositoryId'\)\)\.toBe\('11'\)[\s\S]*?expect\(repairUrl\.searchParams\.get\('filePath'\)\)\.toBe\('backend-spring\/src\/main\/java\/demo\/OrderService\.java'\)[\s\S]*?expect\(repairUrl\.searchParams\.get\('source'\)\)\.toBe\(`ci-diagnostic-\$\{targetDiagnosticId\}`\)[\s\S]*?expect\(repairUrl\.searchParams\.get\('openCreate'\)\)\.toBe\('1'\)/,
  'CI Diagnostics detail selection smoke must prove AutoRepair candidate query preserves projectId, repositoryId, filePath, source and openCreate.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /rowFor\(page, new RegExp\(`PrReview #\$\{targetReviewId\}`\)\)[\s\S]*?getByRole\('button', \{ name: 'Guard order settlement race condition' \}\)[\s\S]*?toHaveAttribute\('aria-selected', 'true'\)[\s\S]*?toHaveAttribute\('aria-controls', `pr-review-detail-\$\{targetReviewId\}`\)[\s\S]*?keyboard\.press\('Enter'\)[\s\S]*?keyboard\.press\('Space'\)[\s\S]*?getByRole\('button', \{ name: `重新分析 PR 审查 #\$\{targetReviewId\}` \}\)[\s\S]*?nestedActionsDoNotHijackSelection:\s*true/s,
  'PR Reviews detail selection smoke must prove explicit title action, aria-selected/aria-controls state, Enter/Space opening and reanalyze isolation.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /getByRole\('button', \{ name: '生成修复候选' \}\)[\s\S]*?expect\(url\.searchParams\.get\('projectId'\)\)\.toBe\(String\(projectId\)\)[\s\S]*?expect\(url\.searchParams\.get\('repositoryId'\)\)\.toBe\('22'\)[\s\S]*?expect\(url\.searchParams\.get\('filePath'\)\)\.toBe\('backend-spring\/src\/main\/java\/demo\/OrderSettlementService\.java'\)[\s\S]*?expect\(url\.searchParams\.get\('source'\)\)\.toBe\(`pr-review-\$\{targetReviewId\}`\)/,
  'PR Reviews detail selection smoke must prove AutoRepair candidate query preserves projectId, repositoryId, filePath and source.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /function expectReadableCriticalText[\s\S]*?whiteSpace[\s\S]*?overflowWrap[\s\S]*?scrollWidth[\s\S]*?function expectPrTableScrollerContained[\s\S]*?\.sl-pr-table-card[\s\S]*?\.ant-table-content[\s\S]*?overflowX[\s\S]*?function assertPrDetailReadability[\s\S]*?backend-spring\/src\/main\/java\/demo\/OrderSettlementService\.java[\s\S]*?Retry path can publish payment event twice/,
  'PR Reviews detail selection smoke must assert critical text wrapping and table scroller containment.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /rowFor\(page, new RegExp\(`IssueDecomposition #\$\{targetIssueId\}`\)\)[\s\S]*?getByRole\('button', \{ name: 'Add repository report export' \}\)[\s\S]*?toHaveAttribute\('aria-selected', 'true'\)[\s\S]*?toHaveAttribute\('aria-controls', `issue-decomposition-detail-\$\{targetIssueId\}`\)[\s\S]*?getByRole\('tab', \{ name: \/子任务\/ \}\)[\s\S]*?locator\('\.sl-issue-detail-card \.ant-select-selector'\)[\s\S]*?getByRole\('tab', \{ name: '原始结果' \}\)[\s\S]*?keyboard\.press\('Enter'\)[\s\S]*?keyboard\.press\('Space'\)[\s\S]*?nestedActionsDoNotHijackSelection:\s*true/s,
  'IssueDecomposition detail selection smoke must prove explicit title action, aria-selected/aria-controls state, tabs, Enter/Space opening and nested action isolation.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /async function expectIssueTableScrollerContained\(page: Page, tableSelector: string, label: string\)[\s\S]*?expectContainedInViewport\(page, tableSelector[\s\S]*?\.ant-table-content[\s\S]*?overflowX[\s\S]*?expectIssueTableScrollerContained\(page, '\.sl-issue-main-table'[\s\S]*?expectIssueTableScrollerContained\(page, '\.sl-issue-task-table'/s,
  'IssueDecomposition detail selection smoke must assert main and task table scroller containment.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /async function expectIssueGovernanceLoop\(page: Page, viewportName: string\)[\s\S]*?\.sl-issue-governance-loop[\s\S]*?Issue 拆解治理闭环[\s\S]*?for \(const text of \['需求输入', '任务拆解', '验收门禁', '执行交接'\][\s\S]*?拆解结果只能作为开发计划证据[\s\S]*?不能证明实现、测试、CI、PR 或 LLM 判断已经正确[\s\S]*?expectedColumns = viewportName === 'desktop' \? 4 : viewportName === 'tablet' \? 2 : 1[\s\S]*?fullImplementationClaim:\s*false[\s\S]*?llmFactClaim:\s*false/s,
  'IssueDecomposition detail selection smoke must assert governance loop stages, no-overclaim copy, 4/2/1 columns and no implementation/LLM fact claims.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /expectLocatorTextNotClipped\(readableTargets\.nth\(index\), `\$\{viewportName\}:issue-governance-readable-\$\{index\}`\)/,
  'IssueDecomposition detail selection smoke must check governance loop text is not clipped.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /getByRole\('button', \{ name: '复制 Markdown' \}\)[\s\S]*?getByRole\('button', \{ name: '导出 \.md' \}\)[\s\S]*?getByRole\('button', \{ name: `复制 Issue 拆解 #\$\{targetIssueId\} Markdown` \}\)[\s\S]*?exportActions:\s*\{[\s\S]*?copyIsolated:\s*true[\s\S]*?downloadIsolated:\s*true/,
  'IssueDecomposition detail selection smoke must prove copy/export actions are isolated from row selection.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /issueRawSecretSentinel[\s\S]*?issueBearerSecret[\s\S]*?issueApiKeySecret[\s\S]*?issueJwtSecret[\s\S]*?forbiddenIssueSecretSnippets[\s\S]*?outputJson: JSON\.stringify\([\s\S]*?authorization:[\s\S]*?apiKey:[\s\S]*?password:[\s\S]*?jwt:[\s\S]*?notes:/,
  'IssueDecomposition detail selection smoke must inject raw outputJson secrets before claiming preview redaction.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /markdownByIssue[\s\S]*?Authorization: Bearer \$\{issueBearerSecret\}[\s\S]*?apiKey=\$\{issueApiKeySecret\}[\s\S]*?password="\$\{issueRawSecretSentinel\}"[\s\S]*?jwt=\$\{issueJwtSecret\}/,
  'IssueDecomposition detail selection smoke must inject raw Markdown export secrets before claiming copy/export redaction.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /async function assertIssueRawResultRedaction[\s\S]*?getByLabel\('脱敏 Issue 拆解原始结果'\)[\s\S]*?toContainText\('\[REDACTED\]'\)[\s\S]*?not\.toContainText\(secret\)[\s\S]*?body-hides/s,
  'IssueDecomposition detail selection smoke must prove the raw result preview and body hide injected secrets.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /const copied = await page\.evaluate\(\(\) => window\.localStorage\.getItem\('issue-decomposition-copied-markdown'\)\)[\s\S]*?expect\(copied\)\.toContain\('\[REDACTED\]'\)[\s\S]*?not\.toContain\(secret\)[\s\S]*?const downloadedMarkdown = fs\.readFileSync\(String\(downloadPath\), 'utf8'\)[\s\S]*?expect\(downloadedMarkdown\)\.toContain\('\[REDACTED\]'\)[\s\S]*?not\.toContain\(secret\)/s,
  'IssueDecomposition detail selection smoke must prove copied and downloaded Markdown are redacted.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /function assertLinkedDetailRegion[\s\S]*?toHaveAttribute\('aria-controls', detailId\)[\s\S]*?toHaveAttribute\('role', 'region'\)[\s\S]*?toHaveAttribute\('aria-labelledby', titleId\)[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?detailAction:\s*\{[\s\S]*?visible:\s*true[\s\S]*?clickedTaskId:\s*targetTaskId[\s\S]*?detailPanelMatched:\s*true[\s\S]*?keyboardOpen:\s*\{[\s\S]*?enter:\s*true[\s\S]*?space:\s*true[\s\S]*?accessibleSelection:\s*true[\s\S]*?nestedActionsDoNotHijackSelection:\s*true[\s\S]*?sharedSelectableRow:\s*\{[\s\S]*?ariaControlsLinked:\s*true[\s\S]*?detailRegionLinked:\s*true[\s\S]*?selectedRowIds:\s*\[targetTaskId, secondaryTaskId\][\s\S]*?spec:\s*'agent-tasks-detail-selection-smoke\.spec\.ts'[\s\S]*?AGENT_TASKS_DETAIL_SELECTION_SMOKE_OK/,
  'AgentTasks detail selection smoke marker must include mocked-only status, linked detail region, accessible selection and nested action isolation proof.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /rawTaskInputSentinel[\s\S]*?rawTaskOutputSentinel[\s\S]*?rawStepOutputSentinel[\s\S]*?rawStepSecretSentinel[\s\S]*?rawSecretSentinel[\s\S]*?rawAuthorizationSentinel[\s\S]*?forbiddenRawPayloadSnippets[\s\S]*?not\.toContainText\(snippet\)[\s\S]*?markerText[\s\S]*?not\.toContain\(snippet\)/,
  'AgentTasks detail selection smoke must use task and step raw payload sentinels and prove they are absent from page text and marker JSON.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /getByRole\('note', \{ name: '步骤输出安全边界' \}\)[\s\S]*?toHaveCount\(2\)[\s\S]*?步骤输出已留存，默认隐藏[\s\S]*?locator\('\.sl-task-timeline-output'\)[\s\S]*?toHaveCount\(0\)/,
  'AgentTasks detail selection smoke must prove TaskTimeline step output uses the safety notice and no raw pre output remains.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /getByRole\('region', \{ name: 'Agent 任务动作门禁说明' \}\)(?=[\s\S]*?状态变更门禁关闭，复盘入口开放)(?=[\s\S]*?终态关闭)(?=[\s\S]*?有摘要或输出)(?=[\s\S]*?启动门禁开放，取消门禁关闭)(?=[\s\S]*?未运行不可取消)(?=[\s\S]*?已绑定 #502)(?=[\s\S]*?取消门禁开放，启动门禁关闭)(?=[\s\S]*?运行中不可重复启动)(?=[\s\S]*?可在检查点停止)(?=[\s\S]*?终态缺少复盘输出)(?=[\s\S]*?未知状态，动作门禁关闭)(?=[\s\S]*?需要后端状态排查)/,
  'AgentTasks detail selection smoke must prove terminal, pending, running, terminal-missing-output and unknown action gate reasons are visible to users.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /actionGateReadable:\s*true[\s\S]*?actionGate:\s*\{[\s\S]*?visible:\s*true[\s\S]*?completedGateVisible:\s*true[\s\S]*?pendingGateVisible:\s*true[\s\S]*?runningGateVisible:\s*true[\s\S]*?terminalMissingOutputBlocked:\s*true[\s\S]*?unknownStatusBlocked:\s*true[\s\S]*?terminalMutationBlocked:\s*true[\s\S]*?pendingStartReady:\s*true[\s\S]*?pendingCancelBlocked:\s*true[\s\S]*?scanBindingVisible:\s*true/,
  'AgentTasks detail selection smoke marker must record action gate readability and state-specific gate proof.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /function expectAgentLifecycleLoop[\s\S]*?getByRole\('region', \{ name: 'Agent 任务治理闭环' \}\)[\s\S]*?任务入口[\s\S]*?执行控制[\s\S]*?工具证据[\s\S]*?复盘交接[\s\S]*?expectedColumns = viewportName === 'desktop' \? 4 : viewportName === 'tablet' \? 2 : 1[\s\S]*?模型判断正确已证明[\s\S]*?工具输出真实已证明[\s\S]*?agentLifecycleLoop:\s*\{[\s\S]*?scope:\s*'AGENT_TASKS_LIFECYCLE_GOVERNANCE_LOOP_READABILITY'[\s\S]*?tabletColumns:[\s\S]*?statusTextReadable:[\s\S]*?descriptionTextReadable:[\s\S]*?modelJudgementClaim:\s*false[\s\S]*?toolOutputTruthClaim:\s*false/s,
  'AgentTasks detail selection smoke must prove the lifecycle governance loop stages, tablet/mobile columns, readable status/description text and overclaim boundaries.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /layoutDensity:\s*\{[\s\S]*?mobile390Covered:\s*visitedViewports\.includes\('390x844'\)[\s\S]*?narrow320Covered:\s*visitedViewports\.includes\('320x740'\)[\s\S]*?detailCardContained[\s\S]*?tableScrollerContained[\s\S]*?noHorizontalOverflow[\s\S]*?layoutGuards[\s\S]*?readabilityGuards[\s\S]*?tableOverflowOwnedByScroller[\s\S]*?mobileReadability:\s*\{[\s\S]*?hiddenPayloadNoticeReadable:\s*true/,
  'AgentTasks detail selection smoke marker must include layout density, layout guards, readability guards, table scroller and hidden payload notice readability.'
)
requirePattern(
  agentTasksDetailSelectionSmokeSpec,
  /payloadSafety:\s*\{[\s\S]*?scope:\s*'TASK_AND_TIMELINE_STEP_RAW_OUTPUT_ONLY'[\s\S]*?fixtureHasRawTaskInput:\s*true[\s\S]*?fixtureHasRawTaskOutput:\s*true[\s\S]*?fixtureHasRawStepOutput:\s*true[\s\S]*?rawInputJsonHidden[\s\S]*?rawOutputJsonHidden[\s\S]*?rawStepOutputHidden[\s\S]*?rawTaskInputRendered:\s*false[\s\S]*?rawTaskOutputRendered:\s*false[\s\S]*?rawStepOutputRendered:\s*false[\s\S]*?rawPayloadNoticeVisible[\s\S]*?rawStepOutputNoticeVisible[\s\S]*?rawStepOutputPreAbsent[\s\S]*?markerContainsRawPayload:\s*false/,
  'AgentTasks detail selection smoke marker must prove task-level raw input/output and TaskTimeline step output payload safety.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?if \(!path\.startsWith\('\/api\/'\)\) \{[\s\S]*?await route\.continue\(\)[\s\S]*?return[\s\S]*?\}/,
  'AgentChat closure rail smoke must not intercept Vite source modules such as /src/api/*.ts.'
)
requirePattern(
  agentChatAuditSmokeSpec,
  /await page\.getByRole\('button', \{ name: '查看审计' \}\)\.click\(\)[\s\S]*?toHaveURL\(new RegExp\(`\/audit-logs\\\\\?projectId=\$\{projectId\}&conversationId=\$\{conversationId\}\$`\)\)[\s\S]*?getByRole\('tab', \{ name: 'Agent 工具调用' \}\)[\s\S]*?getByLabel\('对话 ID'\)/,
  'AgentChat audit smoke must use the unique audit button role and prove the conversation-filtered audit destination.'
)
rejectPattern(
  agentChatAuditSmokeSpec,
  /getByText\('查看审计'\)(?:\.first\(\))?\.click\(\)/,
  'AgentChat audit smoke must not regress to a text-only audit action locator.'
)
rejectPattern(
  agentChatAuditSmokeSpec,
  /getByRole\('button', \{ name: '查看审计' \}\)\.first\(\)\.click\(\)/,
  'AgentChat audit smoke must not hide audit-button ambiguity with first().'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /unhandledApiRequests\.push\(`\$\{method\} \$\{path\}\$\{url\.search\}`\)[\s\S]*?status:\s*599/,
  'AgentChat closure rail smoke must fail closed for unmocked real /api requests.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /getByRole\('region', \{ name: 'Agent 闭环下一步' \}\)[\s\S]*?data-sl-target-url[\s\S]*?\/audit-logs\?projectId=\$\{projectId\}&conversationId=\$\{conversationId\}[\s\S]*?\/agent-tasks\?projectId=\$\{projectId\}&taskId=\$\{agentTaskId\}[\s\S]*?\/scan-tasks\/\$\{scanTaskId\}/,
  'AgentChat closure rail smoke must assert audit, AgentTask and scan report deep-link targets.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /getByRole\('button', \{ name: '打开扫描报告' \}\)\.click\(\)[\s\S]*?toHaveURL\(new RegExp\(`\/scan-tasks\/\$\{scanTaskId\}\$`\)\)[\s\S]*?getByRole\('heading', \{ name: '仓库逆向分析报告' \}\)[\s\S]*?scanReportClickProofs\.push\(\{[\s\S]*?clicked:\s*true[\s\S]*?reportLoaded:\s*true/,
  'AgentChat closure rail smoke must actually click the scan report action and prove the report page loaded.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /toHaveURL\(new RegExp\(`\/agent-tasks\\\\\?projectId=\$\{projectId\}&taskId=\$\{agentTaskId\}\$`\)\)[\s\S]*?toHaveAttribute\('aria-selected', 'true'\)[\s\S]*?agent-task-detail-\$\{agentTaskId\}[\s\S]*?agentTaskStepRequests/,
  'AgentChat closure rail smoke must prove AgentTasks taskId deep links auto-select and load steps.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /toHaveURL\(new RegExp\(`\/audit-logs\\\\\?projectId=\$\{projectId\}&conversationId=\$\{conversationId\}\$`\)\)[\s\S]*?getByRole\('tab', \{ name: 'Agent 工具调用' \}\)[\s\S]*?getByLabel\('对话 ID'\)[\s\S]*?toolQueries/,
  'AgentChat closure rail smoke must prove audit deep links preserve conversation filtering.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /handoff:\s*'code-understanding'[\s\S]*?source:\s*'PROJECT_QA_CODE_UNDERSTANDING_LENS'[\s\S]*?expect\(handoffUrl\.searchParams\.has\('prompt'\)[\s\S]*?toBe\(false\)[\s\S]*?getByRole\('region', \{ name: '代码理解交接包' \}\)[\s\S]*?getByLabel\('输入给 SourceLens Agent 的问题'\)[\s\S]*?toHaveCount\(0\)[\s\S]*?getByRole\('button', \{ name: '使用交接问题' \}\)[\s\S]*?toHaveCount\(0\)[\s\S]*?getByRole\('button', \{ name: '创建绑定任务并进入会话' \}\)[\s\S]*?toBeEnabled\(\)[\s\S]*?createdTaskBody\?\.conversationId[\s\S]*?toBe\(handoffConversationId\)[\s\S]*?createdTaskInput\.rawPromptStored[\s\S]*?toBe\(false\)[\s\S]*?createdTaskInput\.autoStarted[\s\S]*?toBe\(false\)[\s\S]*?代码理解手动发送闭环[\s\S]*?messageRequestsBeforeClick[\s\S]*?toBe\(messageRequestsBeforeBinding\)[\s\S]*?getByRole\('button', \{ name: '发送' \}\)\.click\(\)[\s\S]*?messageRequestsBeforeClick \+ 1[\s\S]*?agentTaskStartRequests[\s\S]*?toHaveLength\(0\)[\s\S]*?缺少成功扫描任务，无法创建绑定 AgentTask。[\s\S]*?getByRole\('button', \{ name: '创建绑定任务并进入会话' \}\)[\s\S]*?toBeDisabled\(\)/,
  'AgentChat closure rail smoke must prove code-understanding handoff creates a structured PENDING AgentTask binding and only sends after an explicit user click.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /const markerPayload = \{[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?linkedAgentTaskId:\s*agentTaskId[\s\S]*?handoffAgentTaskId[\s\S]*?codeUnderstandingHandoff:\s*\{[\s\S]*?surface:\s*'PROJECT_DETAIL_CODE_UNDERSTANDING_AGENT_HANDOFF'[\s\S]*?source:\s*'PROJECT_QA_CODE_UNDERSTANDING_LENS'[\s\S]*?inputKind:\s*'FILE_LINE'[\s\S]*?queryShape:\s*'file:line'[\s\S]*?agentTaskBinding:\s*\{[\s\S]*?taskStatus:\s*'PENDING'[\s\S]*?taskType:\s*'CUSTOM'[\s\S]*?sameProjectBound:\s*true[\s\S]*?sameScanBound:\s*true[\s\S]*?conversationBound:[\s\S]*?boundByBackend:\s*true[\s\S]*?structuredInputOnly:[\s\S]*?rawPromptStored:\s*false[\s\S]*?rawStackStored:\s*false[\s\S]*?autoStarted:[\s\S]*?agentTaskCreated:[\s\S]*?\}[\s\S]*?manualSend:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?triggeredByUser:[\s\S]*?messageRequestAfterClick:[\s\S]*?autoSentBeforeClick:[\s\S]*?agentTaskStillPending:[\s\S]*?autoStarted:[\s\S]*?writeToolTriggered:[\s\S]*?closureRailStillBound:[\s\S]*?auditReviewVisible:[\s\S]*?rawPromptStored:[\s\S]*?rawStackStored:[\s\S]*?\}[\s\S]*?rawPromptInUrl:[\s\S]*?rawPromptInUrlBlocked:[\s\S]*?handoffVisible:[\s\S]*?draftPrefilled:[\s\S]*?conversationCreatedOrSelected:[\s\S]*?autoSent:[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false[\s\S]*?preConversationState:\s*\{[\s\S]*?usePromptHiddenOrDisabled:[\s\S]*?createBoundTaskPrimaryCta:[\s\S]*?createTaskDisabledWhenMissingScan:[\s\S]*?missingScanTaskCreateBlocked:[\s\S]*?missingScanReasonVisible:[\s\S]*?noAutoSentWithoutScan:[\s\S]*?\}[\s\S]*?viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)[\s\S]*?actionBar:\s*\{[\s\S]*?visible:\s*actionProofs\.every[\s\S]*?unboundConversationFallbackVisible:\s*actionProofs\.every[\s\S]*?actions:\s*\{[\s\S]*?audit:[\s\S]*?visible:\s*actionProofs\.every[\s\S]*?conversationFilterBound:\s*true[\s\S]*?agentTask:[\s\S]*?visible:\s*actionProofs\.every[\s\S]*?autoSelectedDetail:\s*true[\s\S]*?scanReport:[\s\S]*?visible:\s*actionProofs\.every[\s\S]*?scanTaskDeepLinkBound:\s*true[\s\S]*?clicked:\s*scanReportClickProofs\.every\(proof => proof\.clicked\)[\s\S]*?reportLoaded:\s*scanReportClickProofs\.every\(proof => proof\.reportLoaded\)[\s\S]*?runtimeIssues:\s*0[\s\S]*?noHorizontalOverflow:\s*true[\s\S]*?spec:\s*'agent-chat-closure-rail-smoke\.spec\.ts'[\s\S]*?console\.log\('AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK', markerText\)/,
  'AgentChat closure rail smoke marker must include mocked-only status, controlled AgentTask binding, manual-send proof, actions, task deep-link, scan link, runtime and overflow proof.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /function assertAgentChatTrustWorkbench\(page: Page,[\s\S]*?getByRole\('region', \{ name: 'Agent 会话可信工作台' \}\)[\s\S]*?toContainText\('项目上下文'\)[\s\S]*?toContainText\('证据输入'\)[\s\S]*?toContainText\('工具审计'\)[\s\S]*?toContainText\('闭环任务'\)[\s\S]*?toHaveCount\(4\)[\s\S]*?gridTemplateColumns[\s\S]*?agentChatTrustWorkbench:\s*\{[\s\S]*?scope:\s*'AGENT_CHAT_TRUST_WORKBENCH_READABILITY'[\s\S]*?surface:\s*'AGENT_CHAT_PROJECT_EVIDENCE_TOOL_TASK_LOOP'[\s\S]*?desktopColumns:[\s\S]*?mobileColumns:[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false[\s\S]*?expect\(markerPayload\.agentChatTrustWorkbench\.stepCount[\s\S]*?toBe\(4\)[\s\S]*?expect\(markerPayload\.agentChatTrustWorkbench\.desktopColumns[\s\S]*?toBe\(4\)[\s\S]*?expect\(markerPayload\.agentChatTrustWorkbench\.mobileColumns[\s\S]*?toBe\(1\)/,
  'AgentChat closure rail smoke must prove the trust workbench has four visible steps and responsive desktop/mobile layout.'
)
requirePattern(
  agentChatClosureRailSmokeSpec,
  /getByRole\('region', \{ name: 'Agent 闭环动作门禁说明' \}\)(?=[\s\S]*?闭环动作门禁关闭)(?=[\s\S]*?选择对话后开放闭环入口)(?=[\s\S]*?闭环动作门禁开放)(?=[\s\S]*?审计、任务和扫描报告证据链完整)(?=[\s\S]*?工具审计可用)(?=[\s\S]*?AgentTask 可定位)(?=[\s\S]*?扫描报告可回跳)(?=[\s\S]*?闭环动作门禁部分开放)(?=[\s\S]*?未绑定 AgentTask，任务闭环未形成)(?=[\s\S]*?AgentTask 入口关闭)(?=[\s\S]*?扫描报告入口关闭)(?=[\s\S]*?闭环动作门禁复核中)(?=[\s\S]*?等待任务详情)(?=[\s\S]*?Agent 任务闭环加载失败)(?=[\s\S]*?Agent 任务详情未返回)(?=[\s\S]*?任务存在但未绑定扫描报告)[\s\S]*?closureGate:\s*\{[\s\S]*?visible:[\s\S]*?noActiveClosedVisible:[\s\S]*?linkedReadyVisible:[\s\S]*?handoffReadyVisible:[\s\S]*?unboundPartialVisible:[\s\S]*?loadingReviewVisible:[\s\S]*?taskErrorBlockedVisible:[\s\S]*?missingTaskDetailVisible:[\s\S]*?noScanBlockedVisible:[\s\S]*?auditOpenReasonVisible:[\s\S]*?agentTaskOpenReasonVisible:[\s\S]*?scanReportOpenReasonVisible:[\s\S]*?unboundAgentTaskBlocked:[\s\S]*?unboundScanBlocked:[\s\S]*?loadingScanButtonBlocked:[\s\S]*?taskErrorScanButtonBlocked:[\s\S]*?missingTaskScanButtonBlocked:[\s\S]*?noScanButtonBlocked:[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false[\s\S]*?expect\(markerPayload\.closureGate\.visible[\s\S]*?toBe\(true\)[\s\S]*?expect\(markerPayload\.closureGate\.noActiveClosedVisible[\s\S]*?expect\(markerPayload\.closureGate\.loadingReviewVisible[\s\S]*?expect\(markerPayload\.closureGate\.taskErrorBlockedVisible[\s\S]*?expect\(markerPayload\.closureGate\.missingTaskDetailVisible[\s\S]*?expect\(markerPayload\.closureGate\.noScanBlockedVisible/s,
  'AgentChat closure rail smoke must prove no-active, linked, handoff, unbound, loading, task-error, missing-task and no-scan action gate reasons are visible and marker-asserted without provider quality claims.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /function assertLinkedDetailRegion[\s\S]*?toHaveAttribute\('aria-controls', detailId\)[\s\S]*?toHaveAttribute\('role', 'region'\)[\s\S]*?toHaveAttribute\('aria-labelledby', titleId\)[\s\S]*?const markerPayload = \{[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?detailAction:\s*\{[\s\S]*?visible:\s*true[\s\S]*?clickedTaskId:\s*targetTaskId[\s\S]*?detailPanelMatched:\s*true[\s\S]*?keyboardOpen:\s*\{[\s\S]*?enter:\s*true[\s\S]*?space:\s*true[\s\S]*?accessibleSelection:\s*true[\s\S]*?nestedActionsDoNotHijackSelection:\s*true[\s\S]*?sharedSelectableRow:\s*\{[\s\S]*?ariaControlsLinked:\s*true[\s\S]*?detailRegionLinked:\s*true[\s\S]*?selectedRowIds:\s*\[targetTaskId, secondaryTaskId\][\s\S]*?spec:\s*'execution-tasks-detail-selection-smoke\.spec\.ts'[\s\S]*?EXECUTION_TASKS_DETAIL_SELECTION_SMOKE_OK/,
  'ExecutionTasks detail selection smoke marker must include mocked-only status, linked detail region, accessible detail selection and nested action isolation proof.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /function expectExecutionTableScrollerContained[\s\S]*?\.sl-execution-table-card[\s\S]*?expectContainedInViewport\(tableCard[\s\S]*?\.ant-table-content[\s\S]*?overflowX[\s\S]*?function assertExecutionDetailReadability[\s\S]*?expectNoHorizontalOverflow\(page,[\s\S]*?detail-open[\s\S]*?targetLongStep[\s\S]*?secondaryLongStep[\s\S]*?targetLogSafePrefix[\s\S]*?secondaryLogSafePrefix[\s\S]*?getByLabel\('脱敏执行日志'\)/,
  'ExecutionTasks detail selection smoke must assert table scroller containment, detail readability and sanitized log region visibility.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /getByRole\('region', \{ name: '执行任务动作门禁说明' \}\)(?=[\s\S]*?状态变更门禁关闭，来源和产物复盘开放)(?=[\s\S]*?终态关闭)(?=[\s\S]*?可复盘)(?=[\s\S]*?取消门禁开放，来源和证据复核同步开放)(?=[\s\S]*?可在检查点停止)(?=[\s\S]*?未形成)(?=[\s\S]*?失败复盘开放，状态变更门禁关闭)(?=[\s\S]*?先复盘再重跑)(?=[\s\S]*?失败任务缺少复盘证据)(?=[\s\S]*?先补证据)(?=[\s\S]*?取消终态冻结，复盘入口开放)(?=[\s\S]*?回来源发起)(?=[\s\S]*?未知状态，动作门禁关闭)(?=[\s\S]*?需要后端状态排查)/,
  'ExecutionTasks detail selection smoke must prove success, running, failed-with-evidence, failed-missing-evidence, cancelled and unknown action gate reasons are visible to users.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /viewportMatrix[\s\S]*?name:\s*'tablet',\s*width:\s*1024,\s*height:\s*768[\s\S]*?function expectExecutionLifecycleLoop[\s\S]*?getByRole\('region', \{ name: '执行生命周期治理闭环' \}\)[\s\S]*?来源接入[\s\S]*?调度控制[\s\S]*?证据采集[\s\S]*?复盘交接[\s\S]*?expectedColumns = viewportName === 'desktop' \? 4 : viewportName === 'tablet' \? 2 : 1[\s\S]*?真实执行质量已证明[\s\S]*?LLM 判断正确已证明/s,
  'ExecutionTasks detail selection smoke must prove the lifecycle governance loop stages, tablet/mobile columns and overclaim boundaries.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /function expectEveryReadableCriticalText[\s\S]*?expectReadableCriticalText\(locator\.nth\(index\)[\s\S]*?function expectExecutionLifecycleLoop[\s\S]*?\.sl-execution-lifecycle-status[\s\S]*?\.sl-execution-lifecycle-stage p[\s\S]*?statusTextReadable:\s*true[\s\S]*?descriptionTextReadable:\s*true/s,
  'ExecutionTasks lifecycle smoke must assert status and description text readability, not only lifecycle card titles.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /staleDetailSentinel[\s\S]*?secondaryCancelResponseSentinel[\s\S]*?delayNextSecondaryDetailRequest[\s\S]*?releaseDelayedSecondaryDetail[\s\S]*?function assertDelayedSecondaryRefreshCannotOverwriteCancel[\s\S]*?刷新执行任务[\s\S]*?取消任务 #\$\{secondaryTaskId\}[\s\S]*?not\.toContainText\(staleDetailSentinel\)[\s\S]*?sameTaskStaleDetailProofs[\s\S]*?sameTaskStaleDetailGuard:\s*\{[\s\S]*?scope:\s*'EXECUTION_TASKS_SAME_TASK_STALE_DETAIL_GUARD'[\s\S]*?sameTaskStaleDetailRejected:[\s\S]*?releasedDelayedSecondaryDetailResponses/s,
  'ExecutionTasks detail selection smoke must prove delayed same-task refresh details cannot overwrite a newer cancel result.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /function assertDelayedSecondaryLoadCannotOverwriteCancel[\s\S]*?explicit secondary detail load must be delayed[\s\S]*?取消任务 #\$\{secondaryTaskId\}[\s\S]*?detail loading cleared by cancel[\s\S]*?stale explicit detail sentinel rejected[\s\S]*?detailLoadingCleared:\s*true[\s\S]*?explicitLoadStaleDetailProofs[\s\S]*?explicitLoadStaleDetailGuard:\s*\{[\s\S]*?scope:\s*'EXECUTION_TASKS_EXPLICIT_LOAD_STALE_DETAIL_GUARD'[\s\S]*?staleExplicitLoadRejected:[\s\S]*?detailLoadingCleared:/s,
  'ExecutionTasks detail selection smoke must prove a delayed explicit detail load cannot overwrite a newer cancel result or leave detailLoading stuck.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /rawBearerSecret[\s\S]*?rawAuthorizationSecret[\s\S]*?rawApiKeySecret[\s\S]*?rawPasswordSecret[\s\S]*?rawJwtSecret[\s\S]*?forbiddenLogSecretSnippets[\s\S]*?not\.toContainText\(snippet\)[\s\S]*?getByLabel\('脱敏执行日志'\)[\s\S]*?toContainText\('\[REDACTED'\)[\s\S]*?markerText[\s\S]*?not\.toContain\(snippet\)/,
  'ExecutionTasks detail selection smoke must inject common log secrets, prove visible logs are redacted and keep raw secrets out of the marker.'
)
requirePattern(
  patchReadySmokeSpec,
  /patchReadyBearerSecret[\s\S]*?patchReadyAuthorizationSecret[\s\S]*?patchReadyTokenSecret[\s\S]*?patchReadyApiKeySecret[\s\S]*?patchReadyPasswordSecret[\s\S]*?patchReadyQuotedSecret[\s\S]*?patchReadyJwtSecret[\s\S]*?patchReadyForbiddenLogSecretSnippets[\s\S]*?function assertPatchReadyLogSafety[\s\S]*?getByLabel\('脱敏执行日志'\)[\s\S]*?toContainText\(patchReadyLogSafePrefix\)[\s\S]*?toContainText\('\[REDACTED'\)[\s\S]*?not\.toContainText\(snippet\)[\s\S]*?markerText[\s\S]*?not\.toContain\(snippet\)/,
  'PATCH_READY smoke must inject common AutoRepair testLog secrets, prove visible logs are redacted and keep raw secrets out of the marker.'
)
requirePattern(
  executionTasksDetailSelectionSmokeSpec,
  /const markerPayload = \{[\s\S]*?layoutDensity:\s*\{[\s\S]*?mobile390Covered:\s*visitedViewports\.includes\('390x844'\)[\s\S]*?narrow320Covered:\s*visitedViewports\.includes\('320x740'\)[\s\S]*?detailCardContained:\s*true[\s\S]*?tableScrollerContained:\s*true[\s\S]*?noHorizontalOverflow:\s*true[\s\S]*?mobileReadability:\s*\{[\s\S]*?criticalTextsWrap:\s*true[\s\S]*?timelineReadable:\s*true[\s\S]*?logReadable:\s*true[\s\S]*?actionGateReadable:\s*true[\s\S]*?tableScrollerContained:\s*true[\s\S]*?executionLifecycleLoop:\s*\{[\s\S]*?scope:\s*'EXECUTION_TASKS_LIFECYCLE_GOVERNANCE_LOOP_READABILITY'[\s\S]*?stages:\s*\['来源接入', '调度控制', '证据采集', '复盘交接'\][\s\S]*?desktopColumns:[\s\S]*?tabletColumns:[\s\S]*?mobileColumns:[\s\S]*?narrowColumns:[\s\S]*?textReadable:[\s\S]*?executionQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false[\s\S]*?actionGate:\s*\{[\s\S]*?visible:\s*true[\s\S]*?successGateVisible:\s*true[\s\S]*?runningGateVisible:\s*true[\s\S]*?failedWithEvidenceReviewVisible:\s*true[\s\S]*?failedMissingEvidenceBlocked:\s*true[\s\S]*?cancelledGateVisible:\s*true[\s\S]*?unknownStatusBlocked:\s*true[\s\S]*?terminalMutationBlocked:\s*true[\s\S]*?cancelGateReady:\s*true[\s\S]*?sourceGateVisible:\s*true[\s\S]*?tableScroller:\s*\{[\s\S]*?containedInViewport:\s*true[\s\S]*?overflowXAuto:\s*true[\s\S]*?logSafety:\s*\{[\s\S]*?scope:\s*'LOG_VIEWER_DISPLAY_REDACTION_ONLY'[\s\S]*?fixtureHasBearerSecret:\s*true[\s\S]*?fixtureHasApiKeySecret:\s*true[\s\S]*?fixtureHasPasswordSecret:\s*true[\s\S]*?fixtureHasJwtSecret:\s*true[\s\S]*?rawSecretsHidden[\s\S]*?redactionVisible[\s\S]*?sanitizedLogVisible[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?runtimeIssues:\s*0[\s\S]*?noHorizontalOverflow:\s*true[\s\S]*?EXECUTION_TASKS_DETAIL_SELECTION_SMOKE_OK/s,
  'ExecutionTasks detail selection smoke marker must include 390px mobile readability, table scroller, log redaction, runtime and overflow proof.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /function assertLinkedDetailRegion[\s\S]*?toHaveAttribute\('aria-controls', detailId\)[\s\S]*?toHaveAttribute\('role', 'region'\)[\s\S]*?toHaveAttribute\('aria-labelledby', titleId\)[\s\S]*?const markerPayload = \{[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?detailAction:\s*\{[\s\S]*?visible:\s*true[\s\S]*?clickedArtifactId:\s*targetArtifactId[\s\S]*?detailPanelMatched:\s*true[\s\S]*?previewAction:\s*\{[\s\S]*?visible:\s*true[\s\S]*?previewPanelMatched:\s*true[\s\S]*?keyboardOpen:\s*\{[\s\S]*?enter:\s*true[\s\S]*?space:\s*true[\s\S]*?accessibleSelection:\s*true[\s\S]*?nestedActionsDoNotHijackSelection:\s*true[\s\S]*?sharedSelectableRow:\s*\{[\s\S]*?ariaControlsLinked:\s*true[\s\S]*?detailRegionLinked:\s*true[\s\S]*?selectedArtifactIds:\s*\[targetArtifactId, secondaryArtifactId\][\s\S]*?spec:\s*'artifacts-detail-selection-smoke\.spec\.ts'[\s\S]*?ARTIFACTS_DETAIL_SELECTION_SMOKE_OK/,
  'Artifacts detail selection smoke marker must include mocked-only status, linked detail region, accessible detail/preview selection and nested action isolation proof.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /function expectArtifactTableScrollerContained[\s\S]*?\.sl-artifact-table-card[\s\S]*?\.ant-table-content[\s\S]*?overflowX[\s\S]*?function assertArtifactDrawerReadability[\s\S]*?expectNoHorizontalOverflow\(page,[\s\S]*?drawer-open[\s\S]*?function assertArtifactPreviewReadability[\s\S]*?\.sl-artifact-raw-json[\s\S]*?toHaveAttribute\('open'\)[\s\S]*?function assertArtifactPreviewRedaction[\s\S]*?\.sl-artifact-redacted-preview[\s\S]*?toContainText\('\[REDACTED\]'\)[\s\S]*?\.sl-artifact-redacted-raw-json[\s\S]*?not\.toContainText\(secret\)/,
  'Artifacts detail selection smoke must assert table scroller containment, drawer open-state readability and redacted preview/raw JSON.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /artifactRawBearerSecret[\s\S]*?artifactRawAuthorizationSecret[\s\S]*?artifactRawApiKeySecret[\s\S]*?artifactRawPasswordSecret[\s\S]*?artifactRawQuotedSecret[\s\S]*?artifactRawJwtSecret[\s\S]*?artifactRawPrivateKeySecret[\s\S]*?forbiddenArtifactPreviewSecrets[\s\S]*?securitySummary[\s\S]*?textArtifactId[\s\S]*?malformedJsonArtifactId[\s\S]*?assertArtifactPreviewRedaction\(page, `artifacts:\$\{viewport\.name\}:structured-preview`[\s\S]*?assertArtifactPreviewRedaction\(page, `artifacts:\$\{viewport\.name\}:text-preview`[\s\S]*?assertArtifactPreviewRedaction\(page, `artifacts:\$\{viewport\.name\}:malformed-json-preview`/,
  'Artifacts detail selection smoke must inject common artifact preview secrets and prove structured JSON, text and malformed JSON previews are redacted.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /const markerPayload = \{[\s\S]*?layoutDensity:\s*\{[\s\S]*?mobile390Covered:\s*visitedViewports\.includes\('390x844'\)[\s\S]*?narrow320Covered:\s*visitedViewports\.includes\('320x740'\)[\s\S]*?drawerContained:\s*true[\s\S]*?tableScrollerContained:\s*true[\s\S]*?noHorizontalOverflow:\s*true[\s\S]*?mobileReadability:\s*\{[\s\S]*?criticalFieldsWrap:\s*true[\s\S]*?checksumWraps:\s*true[\s\S]*?previewContentReadable:\s*true[\s\S]*?tableScrollerContained:\s*true/s,
  'Artifacts detail selection smoke marker must include 390px mobile readability, drawer containment, checksum wrapping and table scroller proof.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /const markerPayload = \{[\s\S]*?runtimeIssues:\s*0[\s\S]*?noHorizontalOverflow:\s*true[\s\S]*?drawerReadability:\s*\{[\s\S]*?openStateChecked:\s*true[\s\S]*?criticalTextWraps:\s*true[\s\S]*?rawJsonDefaultCollapsed:\s*true[\s\S]*?tableScroller:\s*\{[\s\S]*?containedInViewport:\s*true[\s\S]*?overflowXAuto:\s*true[\s\S]*?previewReadability:\s*\{[\s\S]*?smartPreviewVisible:\s*true[\s\S]*?tabsContained:\s*true[\s\S]*?rawJsonExpandable:\s*true[\s\S]*?artifactPreviewSafety:\s*\{[\s\S]*?scope:\s*'ARTIFACTS_PREVIEW_DISPLAY_REDACTION_ONLY'[\s\S]*?rawSecretsHidden:[\s\S]*?structuredJsonRedacted:[\s\S]*?rawJsonRedacted:[\s\S]*?textPreviewRedacted:[\s\S]*?malformedJsonRedacted:[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?const markerText = JSON\.stringify\(markerPayload\)[\s\S]*?marker must not include raw artifact preview secret[\s\S]*?console\.log\('ARTIFACTS_DETAIL_SELECTION_SMOKE_OK', markerText\)/s,
  'Artifacts detail selection smoke marker must include runtime, overflow, drawer, table scroller, preview readability and artifact preview redaction proof.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /function assertArtifactCustodyChain[\s\S]*?getByRole\('region', \{ name: '产物保管责任链' \}\)[\s\S]*?toContainText\('来源绑定'\)[\s\S]*?toContainText\('显示脱敏'\)[\s\S]*?toContainText\('Raw Access'\)[\s\S]*?toContainText\('复盘闭环'\)[\s\S]*?toHaveCount\(4\)[\s\S]*?gridTemplateColumns[\s\S]*?custodyChainAfterReceipt[\s\S]*?receipt #\$\{rawDownloadAuditLogId\}[\s\S]*?custodyChainAfterFallback[\s\S]*?按资源过滤[\s\S]*?artifactCustodyChain:\s*\{[\s\S]*?scope:\s*'ARTIFACTS_CUSTODY_CHAIN_READABILITY'[\s\S]*?surface:\s*'ARTIFACT_SOURCE_PREVIEW_RAW_ACCESS_REVIEW_LOOP'[\s\S]*?expectedColumnsHonored:[\s\S]*?desktopColumns:[\s\S]*?mobileColumns:[\s\S]*?sourceBindingVisible:[\s\S]*?displayRedactionVisible:[\s\S]*?rawAccessVisible:[\s\S]*?reviewLoopVisible:[\s\S]*?rawAccessReceiptVisible:[\s\S]*?rawAccessFallbackVisible:[\s\S]*?rawAccessUrlLowSensitive:[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/s,
  'Artifacts detail selection smoke must prove the custody chain is readable, responsive and linked to raw access audit receipts without provider/LLM quality claims.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /rawDownloadBoundary:\s*\{[\s\S]*?scope:\s*'ARTIFACTS_RAW_DOWNLOAD_ACKNOWLEDGEMENT_AUDIT_BOUNDARY_ONLY'[\s\S]*?requestBound:[\s\S]*?acknowledgementPresent:[\s\S]*?receiptBoundaryExpected:\s*true[\s\S]*?artifactIdBound:[\s\S]*?noDrawerHijack:\s*true[\s\S]*?rawDownloadRedactionClaim:\s*false[\s\S]*?markerContainsRawContent:\s*false/,
  'Artifacts detail selection smoke marker must include focused raw download acknowledgement/audit boundary proof.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /rawDownloadAuditLogId[\s\S]*?x-sourcelens-audit-log-id[\s\S]*?rawDownloadAuditDeepLink:\s*\{[\s\S]*?scope:\s*'ARTIFACTS_RAW_DOWNLOAD_AUDIT_DEEP_LINK_ONLY'[\s\S]*?auditLogId:\s*rawDownloadAuditLogId[\s\S]*?auditLogIdBound:\s*true[\s\S]*?resourceType:\s*'ARTIFACT'[\s\S]*?action:\s*'ARTIFACT_RAW_DOWNLOAD'[\s\S]*?status:\s*'SUCCESS'[\s\S]*?lowSensitiveQueryOnly:\s*true[\s\S]*?urlHasRawPayload:\s*false[\s\S]*?urlHasStoragePath:\s*false[\s\S]*?urlHasFileName:\s*false/,
  'Artifacts detail selection smoke marker must include receipt-id-bound raw download audit deep-link proof.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /artifactId === binaryArtifactId \? undefined : rawDownloadAuditLogId[\s\S]*?artifactId !== binaryArtifactId[\s\S]*?未返回 receipt id[\s\S]*?not\.toContain\('auditLogId='\)[\s\S]*?rawDownloadAuditFallback:\s*\{[\s\S]*?scope:\s*'ARTIFACTS_RAW_DOWNLOAD_AUDIT_FALLBACK_WITHOUT_RECEIPT_ID_ONLY'[\s\S]*?receiptIdMissing:[\s\S]*?fallbackUsesResourceActionStatus:\s*true[\s\S]*?fallbackUrlHasAuditLogId:\s*false[\s\S]*?fallbackDoesNotClaimReceiptId:\s*true[\s\S]*?urlHasRawPayload:\s*false[\s\S]*?urlHasFileName:\s*false/,
  'Artifacts detail selection smoke must prove no-header raw download falls back to resource/action/status audit URL without claiming a receipt id.'
)
requirePattern(
  artifactsDetailSelectionSmokeSpec,
  /artifactRawDownloadPayloadSecret[\s\S]*?marker must not include raw artifact download payload/,
  'Artifacts detail selection smoke must keep raw downloaded payload out of marker JSON.'
)
requirePattern(
  p9RecoverableErrorBatch3SmokeSpec,
  /P9_MAIN_PATH_RECOVERABLE_ERROR_STATES_BATCH3_SMOKE_OK[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?pages:\s*\['Projects', 'ExecutionTasks', 'Artifacts'\][\s\S]*?projects:\s*\['项目列表加载失败', '重新加载项目'\][\s\S]*?projectsCachedRefresh:\s*\['项目刷新失败，已保留上次成功数据', 'Batch3 Recoverable Project'\][\s\S]*?executionTasks:\s*\['执行任务加载失败', '任务详情加载失败', '重新加载任务'\][\s\S]*?artifacts:\s*\['运行产物加载失败', '智能预览加载失败', '重新加载产物', '重新加载预览'\][\s\S]*?spec:\s*'p9-main-path-recoverable-error-states-batch3\.spec\.ts'/,
  'P9 batch 3 recoverable error states smoke marker must prove mocked-only Projects, ExecutionTasks and Artifacts failure/retry coverage.'
)
requirePattern(
  p9RecoverableErrorBatch3SmokeSpec,
  /const projectFirstViewportSupplementMatrix = \[[\s\S]*?width:\s*1024[\s\S]*?width:\s*768[\s\S]*?width:\s*390[\s\S]*?async function expectProjectsFatalFirstViewportContract[\s\S]*?window\.scrollY[\s\S]*?\.sl-project-summary-grid[\s\S]*?\.sl-project-portfolio-loop[\s\S]*?\.sl-project-table-card[\s\S]*?button\.ant-btn-primary:visible[\s\S]*?toHaveCount\(1\)[\s\S]*?retry action must remain in the initial viewport[\s\S]*?for \(const viewport of projectFirstViewportSupplementMatrix\)/,
  'P9 batch 3 smoke must prove Projects fatal-state action arbitration at initial scroll position across 1440, 1024, 768, 390 and 320 widths.'
)
requirePattern(
  p9RecoverableErrorBatch3SmokeSpec,
  /Projects confirmed-empty and filtered-empty states each expose one relevant primary action[\s\S]*?emptyProjects = true[\s\S]*?还没有项目[\s\S]*?button\.ant-btn-primary:visible[\s\S]*?name:\s*'新建项目'[\s\S]*?emptyProjects = false[\s\S]*?no-such-project[\s\S]*?没有匹配的项目[\s\S]*?name:\s*'清除项目筛选'[\s\S]*?not\.toHaveClass\(\/ant-btn-primary\//,
  'P9 batch 3 smoke must distinguish confirmed-empty and filtered-empty Projects states with exactly one relevant primary action.'
)
requirePattern(
  p9RecoverableErrorBatch4ASmokeSpec,
  /P9_MAIN_PATH_RECOVERABLE_ERROR_STATES_BATCH4A_SMOKE_OK[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?pages:\s*\['Dashboard', 'ProjectDetail', 'ScanTaskDetail'\][\s\S]*?dependencyGraph:\s*'batch4B requires graph retry action before recoverable smoke'[\s\S]*?dashboard:\s*\['仪表盘数据加载失败', '重试加载'\][\s\S]*?projectDetail:\s*\['项目总览加载失败', '重新加载总览', 'STALE_REFRESH', '重新同步'\][\s\S]*?scanTaskDetail:\s*\['code_chunks 状态临时不可用', '重新读取 code_chunks', '修复治理时间线临时不可用', '重新加载治理时间线'\][\s\S]*?spec:\s*'p9-main-path-recoverable-error-states-batch4a\.spec\.ts'/,
  'P9 batch 4A marker must keep mocked-only Dashboard and ProjectDetail recovery plus ScanTaskDetail local code/governance recovery without claiming the new top-level contract.'
)
requirePattern(
  p9RecoverableErrorBatch4ASmokeSpec,
  /getByLabel\('代码知识库操作门禁说明'\)[\s\S]*?代码知识库门禁未开放[\s\S]*?code_chunks 状态读取失败[\s\S]*?代码知识库门禁已开放[\s\S]*?128 个 code_chunks 可用于代码问答和切片检索[\s\S]*?expectCodeKnowledgeGridReadable\(page[\s\S]*?scanCodeKnowledgeGate:\s*\{[\s\S]*?surface:\s*'SCAN_TASK_DETAIL_CODE_KNOWLEDGE_GATE'[\s\S]*?blockedReasonVisible:\s*scanCodeKnowledgeGateProofs\.every\(proof => proof\.blockedVisible\)[\s\S]*?readyReasonVisible:\s*scanCodeKnowledgeGateProofs\.every\(proof => proof\.readyVisible\)[\s\S]*?textStyleSafe:\s*scanCodeKnowledgeGateProofs\.every\(proof => proof\.styleSafe\)[\s\S]*?gridTextStyleSafe:\s*scanCodeKnowledgeGateProofs\.every\(proof => proof\.gridStyleSafe\)/,
  'P9 batch 4A smoke must prove ScanTaskDetail code knowledge gate blocked and ready reasons plus grid text are visible and style-safe.'
)
requirePattern(
  p9RecoverableErrorBatch4ASmokeSpec,
  /PROJECT_WORKSPACE_NEXT_ACTION_SMOKE_OK[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?branchCount:\s*workspaceActionScenarios\.length[\s\S]*?branches:\s*workspaceActionScenarios\.map\(scenario => scenario\.actionKey\)[\s\S]*?viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)[\s\S]*?checkedCases:\s*workspaceNextActionOverflowChecks\.length[\s\S]*?expectedCheckedCases:\s*expectedWorkspaceNextActionChecks[\s\S]*?overflowFailures:\s*workspaceNextActionOverflowFailures\.length[\s\S]*?noHorizontalOverflow:\s*true[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Project workspace next action smoke marker must prove six mocked-only branches, 390/320 mobile coverage, no overflow and no LLM/provider quality claim.'
)
requirePattern(
  p9RecoverableErrorBatch4ASmokeSpec,
  /workspaceActionScenarios:[\s\S]*?'ADD_REPOSITORY'[\s\S]*?'START_SCAN'[\s\S]*?'WATCH_SCAN'[\s\S]*?'REVIEW_FAILED_SCAN'[\s\S]*?'OPEN_ARTIFACTS'[\s\S]*?'OPEN_QA'[\s\S]*?toHaveLength\(6\)[\s\S]*?for \(const scenario of workspaceActionScenarios\)[\s\S]*?toHaveAttribute\('data-sl-action-key', scenario\.actionKey\)[\s\S]*?const overflow = await expectNoHorizontalOverflow\(page, `project-next-action:\$\{scenario\.scenario\}:\$\{viewport\.name\}`\)[\s\S]*?workspaceNextActionOverflowChecks\.push/,
  'Project workspace next action smoke must exercise and assert all six state branches.'
)
requirePattern(
  p9RecoverableErrorBatch4BSmokeSpec,
  /P9_MAIN_PATH_RECOVERABLE_ERROR_STATES_BATCH4B_SMOKE_OK[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?pages:\s*\['DependencyGraph'\][\s\S]*?dependencyGraph:\s*\['依赖图谱加载失败', '重新加载图谱', '依赖图谱与架构洞察'\][\s\S]*?layoutReadability:\s*\{[\s\S]*?graphRadioLabelWrapsWithoutClipping:\s*true[\s\S]*?graphRadioGroupContained:\s*true[\s\S]*?spec:\s*'p9-main-path-recoverable-error-states-batch4b\.spec\.ts'/,
  'P9 batch 4B recoverable error states smoke marker must prove mocked-only DependencyGraph failure/retry coverage and graph radio label readability.'
)
requirePattern(
  p9RecoverableErrorBatch4BSmokeSpec,
  /async function assertGraphRadioReadable\(page: Page, label: string\)[\s\S]*?\.sl-graph-actions \.ant-radio-group[\s\S]*?dependency-graph-radio-view-mode-long-label-must-wrap-without-clipping[\s\S]*?expectLocatorTextNotClipped\(graphRadio[\s\S]*?expectNoHorizontalOverflow\(page, `\$\{label\}:radio-group`\)/,
  'P9 batch 4B smoke must mutate DependencyGraph radio labels to a long token and prove they wrap without clipping or page overflow.'
)
requirePattern(
  modelConfigRecoverableSmokeSpec,
  /async function expectModelProviderTableScrollerContained\(page: Page, label: string\)[\s\S]*?\.sl-model-provider-table[\s\S]*?\.ant-table-content[\s\S]*?overflowX[\s\S]*?expectModelProviderTableScrollerContained\(page, `model-config:\$\{viewport\.name\}:loaded`\)[\s\S]*?expectModelProviderTableScrollerContained\(page, `model-config:\$\{viewport\.name\}:cached-refresh-error`\)[\s\S]*?MODEL_CONFIG_RECOVERABLE_SMOKE_OK[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?initial-load-error-state[\s\S]*?retry-recovers-provider-table[\s\S]*?cached-refresh-error-preserves-table[\s\S]*?provider-table-scroller-contained[\s\S]*?activate-failure-governance-state[\s\S]*?create-failure-inline-modal-state[\s\S]*?delete-failure-governance-state[\s\S]*?tableScroller:\s*\{[\s\S]*?providerTableContained:\s*true[\s\S]*?overflowXAuto:\s*true/,
  'ModelConfig recoverable smoke marker must prove mocked-only failures and provider table scroller containment.'
)
requirePattern(
  modelConfigRecoverableSmokeSpec,
  /import \{ expect, test, type Locator, type Page, type Route \} from '@playwright\/test'[\s\S]*?const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?rawActiveApiKeySecret[\s\S]*?rawInactiveApiKeySecret[\s\S]*?forbiddenApiKeySecrets[\s\S]*?providerQualityOverclaimPhrases[\s\S]*?llmFactOverclaimPhrases[\s\S]*?function assertModelConfigDisplayBoundaries\(page: Page, label: string\)[\s\S]*?locator\('body'\)\.innerText\(\)[\s\S]*?not\.toContain\(secret\)[\s\S]*?providerQualityOverclaimAbsent[\s\S]*?llmFactOverclaimAbsent[\s\S]*?function assertModelProviderGovernanceLoop\(page: Page, label: string, expectedColumns: number\)[\s\S]*?getByRole\('region', \{ name: '模型供应商治理闭环' \}\)[\s\S]*?toContainText\('激活门禁'\)[\s\S]*?toContainText\('密钥边界'\)[\s\S]*?toContainText\('Endpoint 风险'\)[\s\S]*?toContainText\('下游能力'\)[\s\S]*?displayBoundaryProofs\.push[\s\S]*?MODEL_CONFIG_PROVIDER_GOVERNANCE_LOOP_READABILITY[\s\S]*?surface:\s*'ACTIVATION_SECRET_ENDPOINT_DOWNSTREAM_GATE'[\s\S]*?expectedColumnsHonored:[\s\S]*?desktopColumns:[\s\S]*?mobileColumns:[\s\S]*?apiKeyPlaintextRendered:\s*displayBoundaryProofs\.some\(proof => !proof\.rawApiKeysHidden\)[\s\S]*?providerQualityClaim:\s*displayBoundaryProofs\.some\(proof => !proof\.providerQualityOverclaimAbsent\)[\s\S]*?llmFactClaim:\s*displayBoundaryProofs\.some\(proof => !proof\.llmFactOverclaimAbsent\)[\s\S]*?displayBoundaries:\s*\{[\s\S]*?rawApiKeysHidden:\s*displayBoundaryProofs\.every\(proof => proof\.rawApiKeysHidden\)/s,
  'ModelConfig recoverable smoke must prove provider governance readability, responsive columns, raw API key redaction and bounded quality/LLM claims across desktop, 390px and 320px viewports.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /function assertLinkedDetailRegion[\s\S]*?toHaveAttribute\('aria-controls', detailId\)[\s\S]*?toHaveAttribute\('role', 'region'\)[\s\S]*?toHaveAttribute\('aria-labelledby', titleId\)[\s\S]*?const markerPayload = \{[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?tabsCovered:\s*\['audit-logs', 'agent-tool-calls', 'github-webhook-deliveries'\][\s\S]*?detailAction:\s*\{[\s\S]*?visible:\s*true[\s\S]*?clickedAuditLogId:\s*targetAuditLogId[\s\S]*?clickedToolCallId:\s*targetToolCallId[\s\S]*?clickedDeliveryId:\s*targetDeliveryId[\s\S]*?detailPanelMatched:\s*true[\s\S]*?keyboardOpen:\s*\{[\s\S]*?enter:\s*true[\s\S]*?space:\s*true[\s\S]*?candidateReceiptReview:\s*\{[\s\S]*?visible:\s*true[\s\S]*?sourceTypeBound:\s*true[\s\S]*?repairDeepLinkBound:\s*true[\s\S]*?reportDeepLinkBound:\s*true[\s\S]*?qaDeepLinkBound:\s*true[\s\S]*?auditEventBound:\s*true[\s\S]*?auditJsonSafety:\s*\{[\s\S]*?scope:\s*'AUDIT_LOGS_RAW_JSON_DISPLAY_REDACTION_ONLY'[\s\S]*?rawSecretsHidden:[\s\S]*?redactionVisible:\s*true[\s\S]*?auditInputRedacted:[\s\S]*?toolArgumentsRedacted:[\s\S]*?deliveryResultRedacted:[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?accessibleSelection:\s*true[\s\S]*?nestedActionsDoNotHijackSelection:\s*true[\s\S]*?sharedSelectableRow:\s*\{[\s\S]*?ariaControlsLinked:\s*true[\s\S]*?detailRegionLinked:\s*true[\s\S]*?selectedAuditLogIds:\s*\[targetAuditLogId, secondaryAuditLogId\][\s\S]*?selectedToolCallIds:\s*\[targetToolCallId, secondaryToolCallId\][\s\S]*?selectedDeliveryIds:\s*\[targetDeliveryId, secondaryDeliveryId\][\s\S]*?spec:\s*'audit-logs-detail-selection-smoke\.spec\.ts'[\s\S]*?const markerText = JSON\.stringify\(markerPayload\)[\s\S]*?marker must not include raw audit JSON secret[\s\S]*?console\.log\('AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK', markerText\)/,
  'AuditLogs detail selection smoke marker must include mocked-only status, three source tabs, linked detail regions, candidate receipt review deep links, audit JSON redaction proof, accessible selection and nested action isolation proof.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /getByRole\('region', \{ name: '审计判定门禁说明' \}\)[\s\S]*?toContainText\('READY'\)[\s\S]*?toContainText\('三源可读取'\)[\s\S]*?toContainText\('只展示脱敏摘要'\)[\s\S]*?auditDecisionGate:\s*\{[\s\S]*?visible:\s*true[\s\S]*?statusesCovered:\s*\['READY'\][\s\S]*?dataSourceIntegrityVisible:\s*true[\s\S]*?pageWindowVisible:\s*true[\s\S]*?deepLinkScopeVisible:\s*true[\s\S]*?rawEvidenceBoundaryVisible:\s*true[\s\S]*?decisionGateStatus:\s*'REVIEW'[\s\S]*?decisionGateStatus:\s*'BLOCKED'/,
  'AuditLogs detail selection smoke must prove the audit decision gate across ready, scoped-review and blocked deep-link states.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /function assertAuditInvestigationLoop[\s\S]*?getByRole\('region', \{ name: '审计调查闭环' \}\)[\s\S]*?toContainText\('风险发现'\)[\s\S]*?toContainText\('证据脱敏'\)[\s\S]*?toContainText\('资源追踪'\)[\s\S]*?toContainText\('复盘处置'\)[\s\S]*?toHaveCount\(4\)[\s\S]*?gridTemplateColumns[\s\S]*?auditInvestigationLoop:\s*\{[\s\S]*?scope:\s*'AUDIT_LOGS_INVESTIGATION_LOOP_READABILITY'[\s\S]*?surface:\s*'RISK_DETECTION_EVIDENCE_REDACTION_RESOURCE_TRACE_REVIEW_CLOSURE'[\s\S]*?expectedColumnsHonored:[\s\S]*?desktopColumns:[\s\S]*?mobileColumns:[\s\S]*?riskDetectionVisible:[\s\S]*?evidenceRedactionVisible:[\s\S]*?resourceTraceVisible:[\s\S]*?reviewClosureVisible:[\s\S]*?rawJsonDisplayRedactionOnly:\s*true[\s\S]*?fullAuditCoverageClaim:\s*false[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/s,
  'AuditLogs detail selection smoke must prove the investigation loop is readable, responsive and bounded to display redaction without broad audit/provider/LLM claims.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /AuditLogs manual filters keep audit decision gate scoped even when all returned rows fit one page[\s\S]*?SCAN_TASK_FAILED[\s\S]*?已按筛选或深链收窄[\s\S]*?AUDIT_LOGS_MANUAL_FILTER_SCOPE_SMOKE_OK[\s\S]*?totalEqualsVisibleStillScoped:\s*true/,
  'AuditLogs smoke must prove manually submitted filters keep the audit decision gate in REVIEW even when total equals visible rows.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /AuditLogs paginated audit windows keep audit decision gate in review[\s\S]*?auditTotal:\s*auditLogs\.length \+ 10[\s\S]*?当前结果窗口[\s\S]*?AUDIT_LOGS_PAGINATED_DECISION_GATE_SMOKE_OK[\s\S]*?pageScoped:\s*true/,
  'AuditLogs smoke must prove paginated result windows keep the audit decision gate in REVIEW.'
)
requirePattern(
  auditLogsDetailSelectionSmokeSpec,
  /AuditLogs unavailable source blocks audit decision gate without claiming the chain is online[\s\S]*?failAuditLogs:\s*true[\s\S]*?审计源需复核[\s\S]*?审计链路在线[\s\S]*?toHaveCount\(0\)[\s\S]*?AUDIT_LOGS_SOURCE_ERROR_DECISION_GATE_SMOKE_OK[\s\S]*?onlineClaimRemoved:\s*true/,
  'AuditLogs smoke must prove unavailable audit sources block the decision gate and remove the stale online claim.'
)
requirePattern(
  patchReadySmokeSpec,
  /function assertLinkedAutoRepairDetailRegion[\s\S]*?toHaveAttribute\('aria-controls', detailId\)[\s\S]*?toHaveAttribute\('role', 'region'\)[\s\S]*?toHaveAttribute\('aria-labelledby', titleId\)[\s\S]*?const markerPayload = \{[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?mockedApiOnly:\s*true[\s\S]*?tableDetailAction:\s*\{[\s\S]*?visible:\s*true[\s\S]*?clickedRepairId:\s*repairId[\s\S]*?detailPanelMatched:\s*true[\s\S]*?keyboardOpen:\s*\{[\s\S]*?enter:\s*true[\s\S]*?space:\s*true[\s\S]*?accessibleSelection:\s*true[\s\S]*?sharedSelectableRow:\s*\{[\s\S]*?ariaControlsLinked:\s*true[\s\S]*?detailRegionLinked:\s*true[\s\S]*?selectedRepairIds:\s*\[repairId, blockedRepairId\][\s\S]*?scanSourceBridge:\s*\{[\s\S]*?visible:\s*true[\s\S]*?scanTaskId[\s\S]*?qaDeepLinkBound:\s*true[\s\S]*?agentTaskDraftBound:\s*true[\s\S]*?auditDeepLinkBound:\s*true[\s\S]*?missingScanFallbackVisible:\s*true[\s\S]*?reviewGate:\s*\{[\s\S]*?requiredEvidence:\s*\['diff', 'patchArtifact', 'patchGenerationStep', 'auditEvent'\][\s\S]*?missingEvidenceBlocked[\s\S]*?attemptSplit:[\s\S]*?PATCH_READY_UI_SMOKE_OK/,
  'PATCH_READY smoke marker must preserve PR gate evidence while proving AutoRepairs shared selectable row and source bridge adoption.'
)
requirePattern(
  patchReadySmokeSpec,
  /const markerPayload = \{[\s\S]*?layoutDensity:\s*\{[\s\S]*?mobile390Covered:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)\.includes\('390x844'\)[\s\S]*?narrow320Covered:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)\.includes\('320x740'\)[\s\S]*?detailCardContained:\s*true[\s\S]*?reviewChecklistContained:\s*true[\s\S]*?sourceBridgeContained:\s*true[\s\S]*?tableScrollerContained:\s*true[\s\S]*?logCollapseContained:\s*true[\s\S]*?prPopconfirmContained:\s*true[\s\S]*?noHorizontalOverflow:\s*true[\s\S]*?mobileReadability:\s*\{[\s\S]*?criticalTextsWrap:\s*true[\s\S]*?targetFileNotClipped:\s*true[\s\S]*?reviewGateTextNotClipped:\s*true[\s\S]*?candidateReceiptTextNotClipped:\s*true[\s\S]*?prConfirmTextNotClipped:\s*true[\s\S]*?logCollapseHeaderNotClipped:\s*true[\s\S]*?primaryButtonLabelNotClipped:\s*true[\s\S]*?primaryButtonLabelIconSvgWhite:\s*true[\s\S]*?tableScroller:\s*\{[\s\S]*?containedInViewport:\s*true[\s\S]*?overflowXAuto:\s*true[\s\S]*?logSafety:\s*\{[\s\S]*?scope:\s*'LOG_VIEWER_DISPLAY_REDACTION_ONLY'[\s\S]*?fixtureHasBearerSecret:\s*true[\s\S]*?fixtureHasApiKeySecret:\s*true[\s\S]*?fixtureHasPasswordSecret:\s*true[\s\S]*?fixtureHasQuotedSecret:\s*true[\s\S]*?fixtureHasJwtSecret:\s*true[\s\S]*?rawSecretsHidden[\s\S]*?redactionVisible[\s\S]*?sanitizedLogVisible[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?executionDetailGuard:\s*\{[\s\S]*?selectedDetailSourceBound:\s*true[\s\S]*?staleExecutionDetailRejected:\s*true[\s\S]*?runtimeIssues:\s*0[\s\S]*?noHorizontalOverflow:\s*true[\s\S]*?PATCH_READY_UI_SMOKE_OK/,
  'PATCH_READY smoke marker must include three-viewport layout density, mobile readability, table scroller, log redaction and execution-detail guard proof.'
)
requirePattern(
  patchReadySmokeSpec,
  /async function assertAutoRepairLogCollapseReadability\(page: Page, label: string\)[\s\S]*?\.sl-autorepair-detail-card[\s\S]*?\.ant-collapse[\s\S]*?补丁生成日志[\s\S]*?auto-repair-log-collapse-header-long-label-must-wrap-without-clipping-or-horizontal-overflow[\s\S]*?expectLocatorTextNotClipped\(headerText[\s\S]*?expectContainedInViewport\(contentBox[\s\S]*?expectNoHorizontalOverflow\(page, `\$\{label\}:log-collapse-readable`\)/,
  'PATCH_READY smoke must mutate the AutoRepair log Collapse header to a long token and prove it is readable without overflow.'
)
requirePattern(
  patchReadySmokeSpec,
  /patchReadyRawDiffSecretSentinel[\s\S]*?patchReadyDiffSkSecret[\s\S]*?patchReadyDiffJwtSecret[\s\S]*?patchReadyForbiddenDiffSecretSnippets[\s\S]*?diffContent:[\s\S]*?Authorization: Bearer \$\{patchReadyRawDiffSecretSentinel\}[\s\S]*?String token = "\$\{patchReadyRawDiffSecretSentinel\}"[\s\S]*?String apiKey = "\$\{patchReadyDiffSkSecret\}"[\s\S]*?String private_key = "\$\{patchReadyRawDiffSecretSentinel\}"[\s\S]*?String access_token = "\$\{patchReadyRawDiffSecretSentinel\}"[\s\S]*?String refresh_token = "\$\{patchReadyRawDiffSecretSentinel\}"[\s\S]*?String jwt = "\$\{patchReadyDiffJwtSecret\}"[\s\S]*?function assertPatchReadyDiffSafety[\s\S]*?getByLabel\('脱敏 diff 内容'\)[\s\S]*?toContainText\('\[REDACTED\]'\)[\s\S]*?patchReadyForbiddenDiffSecretSnippets[\s\S]*?not\.toContainText\(snippet\)/,
  'PATCH_READY smoke must inject raw diff secret sentinels and prove the visible sanitized diff hides them.'
)
requirePattern(
  patchReadySmokeSpec,
  /patchDiffSafety:\s*\{[\s\S]*?scope:\s*'DIFF_VIEWER_DISPLAY_REDACTION_ONLY'[\s\S]*?fixtureHasRawSecretSentinel:\s*true[\s\S]*?fixtureHasAuthorizationBearerSecret:\s*true[\s\S]*?fixtureHasTokenSecret:\s*true[\s\S]*?fixtureHasApiKeySecret:\s*true[\s\S]*?fixtureHasSecretPasswordPrivateKeySecret:\s*true[\s\S]*?fixtureHasAccessRefreshTokenSecret:\s*true[\s\S]*?fixtureHasSkSecret:\s*true[\s\S]*?fixtureHasJwtSecret:\s*true[\s\S]*?rawSecretsHidden:[\s\S]*?redactionVisible:[\s\S]*?sanitizedDiffVisible:[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?markerText[\s\S]*?PATCH_READY marker must not contain raw diff secret sentinel/,
  'PATCH_READY diff safety marker must prove DiffViewer display redaction and keep raw diff sentinels out of the evidence marker.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /async function expectCiDiagnosticsTableScrollerContained\(page: Page, label: string\)[\s\S]*?\.sl-ci-diagnostics-table[\s\S]*?\.ant-table-content[\s\S]*?overflowX[\s\S]*?expectCiDiagnosticsTableScrollerContained\(page, `ci-diagnostics:\$\{viewport\.name\}:initial`\)[\s\S]*?expectCiDiagnosticsTableScrollerContained\(page, `ci-diagnostics:\$\{viewport\.name\}:after-repair-return`\)[\s\S]*?const markerPayload = \{[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?detailAction:\s*\{[\s\S]*?visible:\s*true[\s\S]*?clickedDiagnosticId:\s*targetDiagnosticId[\s\S]*?detailPanelMatched:\s*true[\s\S]*?keyboardOpen:\s*\{[\s\S]*?enter:\s*true[\s\S]*?space:\s*true[\s\S]*?diagnosticSignal:\s*\{[\s\S]*?visible:\s*true[\s\S]*?strongEvidence:\s*true[\s\S]*?repairReadiness:\s*\{[\s\S]*?targetFileExplained:\s*true[\s\S]*?unavailableReasonExplained:\s*true[\s\S]*?accessibleSelection:\s*true[\s\S]*?nestedActionsDoNotHijackSelection:\s*true[\s\S]*?reanalyze:\s*\{[\s\S]*?triggeredDiagnosticId:\s*targetDiagnosticId[\s\S]*?selectionPreserved:\s*true[\s\S]*?tableScroller:\s*\{[\s\S]*?diagnosticsTableContained:\s*true[\s\S]*?overflowXAuto:\s*true[\s\S]*?ciLogSafety:\s*\{[\s\S]*?scope:\s*'CI_DIAGNOSTICS_RAW_LOG_DISPLAY_REDACTION_ONLY'[\s\S]*?rawSecretsHidden:[\s\S]*?redactionVisible:[\s\S]*?sanitizedLogVisible:[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?spec:\s*'ci-diagnostics-detail-selection-smoke\.spec\.ts'[\s\S]*?CI_DIAGNOSTICS_DETAIL_SELECTION_SMOKE_OK/,
  'CI Diagnostics detail selection smoke marker must include mocked-only status, accessible selection, repair readiness, table scroller containment, CI log redaction and nested action isolation proof.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /const markerPayload = \{[\s\S]*?sourceDeepLink:\s*\{[\s\S]*?selectedListedDiagnosticId:\s*targetDiagnosticId[\s\S]*?loadedDetachedDiagnosticId:\s*detachedDiagnosticId[\s\S]*?detailApiHydratedWhenMissingFromList:\s*true[\s\S]*?autoRepairHandoff:\s*\{[\s\S]*?projectIdPreserved:\s*true[\s\S]*?repositoryIdPreserved:\s*true[\s\S]*?filePathPreserved:\s*true[\s\S]*?sourcePreserved:\s*true[\s\S]*?openCreatePreserved:\s*true/,
  'CI Diagnostics detail selection smoke marker must include source deep-link hydration and AutoRepair handoff evidence.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /ciRawBearerSecret[\s\S]*?ciRawAuthorizationSecret[\s\S]*?ciRawApiKeySecret[\s\S]*?ciRawPasswordSecret[\s\S]*?ciRawQuotedSecret[\s\S]*?ciRawJwtSecret[\s\S]*?ciRawPrivateKeySecret[\s\S]*?forbiddenCiLogSecretSnippets[\s\S]*?function assertCiLogRedaction[\s\S]*?\.sl-ci-log-redacted\[aria-label="脱敏 CI 日志片段"\][\s\S]*?toContainText\(ciLogSafeContext\)[\s\S]*?toContainText\('\[REDACTED\]'\)[\s\S]*?not\.toContainText\(secret\)[\s\S]*?markerText[\s\S]*?marker must not include raw CI log secret/,
  'CI Diagnostics detail selection smoke must inject common CI log secrets, prove visible logs are redacted and keep raw secrets out of the marker.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?detailAction:\s*\{[\s\S]*?visible:\s*true[\s\S]*?clickedReviewId:\s*targetReviewId[\s\S]*?detailPanelMatched:\s*true[\s\S]*?keyboardOpen:\s*\{[\s\S]*?enter:\s*true[\s\S]*?space:\s*true[\s\S]*?reviewDecisionSignal:\s*\{[\s\S]*?mergeDecisionVisible:\s*true[\s\S]*?riskChecksVisible:\s*true[\s\S]*?commentCountReflected:\s*true[\s\S]*?comments:\s*\{[\s\S]*?loadedForCompletedReviewId:\s*targetReviewId[\s\S]*?lineLevelCommentVisible:\s*true[\s\S]*?repairReadiness:\s*\{[\s\S]*?targetFileDerived:\s*true[\s\S]*?unavailableWhenMissingRepositoryOrFile:\s*true[\s\S]*?projectIdPreserved:\s*true[\s\S]*?usesSelectedReviewCommentsOnly:\s*staleGuardProofs\.every\(proof => proof\.repairReadinessUsesSelectedReviewCommentsOnly\)[\s\S]*?commentStaleGuard:\s*\{[\s\S]*?completedToCompletedSwitch:\s*staleGuardProofs\.every\(proof => proof\.completedToCompletedSwitch\)[\s\S]*?staleCommentLeakCount:\s*Math\.max\(\.\.\.staleGuardProofs\.map\(proof => proof\.staleCommentLeakCount\)\)[\s\S]*?selectedCommentReviewIdMatches:\s*staleGuardProofs\.every\(proof => proof\.selectedCommentReviewIdMatches\)[\s\S]*?commentRequests:\s*network\.commentRequests[\s\S]*?accessibleSelection:\s*true[\s\S]*?nestedActionsDoNotHijackSelection:\s*true[\s\S]*?staleDetailRejected:\s*true[\s\S]*?sharedSelectableRow:\s*\{[\s\S]*?ariaControlsLinked:\s*true[\s\S]*?detailRegionLinked:\s*true[\s\S]*?selectedReviewIds:\s*\[targetReviewId, secondaryReviewId, staleGuardReviewId\][\s\S]*?runtimeIssues:\s*issues\.length[\s\S]*?noHorizontalOverflow:\s*true[\s\S]*?spec:\s*'pr-reviews-detail-selection-smoke\.spec\.ts'/,
  'PR Reviews detail selection smoke marker must include mocked-only status, accessible selection, comments, stale comment guard, repair readiness, project binding and nested action isolation proof.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /type PrGovernanceLoopProof[\s\S]*?assertPrGovernanceLoop[\s\S]*?getByRole\('region', \{ name: 'PR 审查治理闭环' \}\)[\s\S]*?pr-intake[\s\S]*?risk-decision[\s\S]*?merge-gate[\s\S]*?repair-handoff[\s\S]*?PR_REVIEWS_GOVERNANCE_LOOP_READABILITY/,
  'PR Reviews detail selection smoke must prove the four-stage governance loop is visible and readable.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /viewportMatrix[\s\S]*?name:\s*'tablet',\s*width:\s*1024,\s*height:\s*768[\s\S]*?expectedColumns = viewport\.width <= 720 \? 1 : viewport\.width <= 1200 \? 2 : 4[\s\S]*?prGovernanceLoop:\s*\{[\s\S]*?scope:\s*'PR_REVIEWS_GOVERNANCE_LOOP_READABILITY'[\s\S]*?surface:\s*'PR_INTAKE_RISK_DECISION_MERGE_GATE_REPAIR_HANDOFF'[\s\S]*?desktopColumns:[\s\S]*?tabletColumns:[\s\S]*?mobileColumns:[\s\S]*?narrowColumns:[\s\S]*?fullReviewQualityClaim:[\s\S]*?llmFactClaim:/,
  'PR Reviews smoke must cover desktop, tablet, mobile and narrow governance-loop breakpoints and overclaim markers.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK[\s\S]*?mobileReadability:\s*\{[\s\S]*?mobile390Covered:\s*visitedViewports\.includes\('390x844'\)[\s\S]*?detailCardContained:\s*true[\s\S]*?criticalTextsWrap:\s*true[\s\S]*?tableScrollerContained:\s*true/,
  'PR Reviews detail selection smoke marker must include 390px mobile readability and table scroller containment proof.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK[\s\S]*?layoutDensity:\s*\{[\s\S]*?mobile390Covered:\s*visitedViewports\.includes\('390x844'\)[\s\S]*?narrow320Covered:\s*visitedViewports\.includes\('320x740'\)[\s\S]*?detailCardContained:\s*true[\s\S]*?tableScrollerContained:\s*true[\s\S]*?noHorizontalOverflow:\s*true/,
  'PR Reviews detail selection smoke marker must include desktop/mobile/narrow layout density and no-overflow proof.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /delayNextTargetCommentRequest[\s\S]*?releaseDelayedTargetComments[\s\S]*?staleGuardReviewId[\s\S]*?network\.delayNextTargetCommentRequest\(\)[\s\S]*?await targetTitleAction\.click\(\)[\s\S]*?await staleGuardTitleAction\.click\(\)[\s\S]*?network\.releaseDelayedTargetComments\(\)[\s\S]*?staleCommentLeakCount[\s\S]*?repairReadinessUsesSelectedReviewCommentsOnly[\s\S]*?toBe\(0\)[\s\S]*?toBe\(true\)/,
  'PR Reviews detail selection smoke must simulate a slow completed-review comments response and prove it cannot leak into the newly selected review.'
)
requirePattern(
  prReviewsDetailSelectionSmokeSpec,
  /PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK[\s\S]*?tableScroller:\s*\{[\s\S]*?containedInViewport:\s*true[\s\S]*?overflowXAuto:\s*true/,
  'PR Reviews detail selection smoke marker must include explicit table scroller containment and overflow ownership proof.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /const markerPayload = \{[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?detailAction:\s*\{[\s\S]*?visible:\s*true[\s\S]*?clickedIssueId:\s*targetIssueId[\s\S]*?detailPanelMatched:\s*true[\s\S]*?keyboardOpen:\s*\{[\s\S]*?enter:\s*true[\s\S]*?space:\s*true[\s\S]*?planningSignal:\s*\{[\s\S]*?visible:\s*true[\s\S]*?countsAligned:\s*true[\s\S]*?failedStateExplained:\s*true[\s\S]*?issueGovernanceLoop:\s*\{[\s\S]*?scope:\s*'ISSUE_DECOMPOSITION_GOVERNANCE_LOOP_READABILITY'[\s\S]*?steps:\s*\['需求输入', '任务拆解', '验收门禁', '执行交接'\][\s\S]*?desktopColumns:[\s\S]*?tabletColumns:[\s\S]*?mobileColumns:[\s\S]*?narrowColumns:[\s\S]*?textReadable:[\s\S]*?fullImplementationClaim:\s*false[\s\S]*?llmFactClaim:\s*false[\s\S]*?tasks:\s*\{[\s\S]*?loadedForCompletedIssueId:\s*targetIssueId[\s\S]*?statusUpdateIsolated:\s*true[\s\S]*?staleTasksClearedForFailedIssue:\s*true[\s\S]*?mainTableScrollerContained:\s*true[\s\S]*?taskTableScrollerContained:\s*true[\s\S]*?exportActions:\s*\{[\s\S]*?copyIsolated:\s*true[\s\S]*?downloadIsolated:\s*true[\s\S]*?rawResultSafety:\s*\{[\s\S]*?scope:\s*'ISSUE_DECOMPOSITION_OUTPUT_JSON_DISPLAY_REDACTION_ONLY'[\s\S]*?fixtureHasRawSecretSentinel:\s*true[\s\S]*?fixtureHasBearerSecret:\s*true[\s\S]*?fixtureHasApiKeySecret:\s*true[\s\S]*?fixtureHasJwtSecret:\s*true[\s\S]*?previewRedactionVisible:[\s\S]*?previewRawSecretsHidden:[\s\S]*?bodyRawSecretsHidden:[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?markdownExportSafety:\s*\{[\s\S]*?scope:\s*'ISSUE_DECOMPOSITION_MARKDOWN_COPY_EXPORT_DISPLAY_REDACTION_ONLY'[\s\S]*?copyMarkdownRedacted:[\s\S]*?downloadMarkdownRedacted:[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?accessibleSelection:\s*true[\s\S]*?nestedActionsDoNotHijackSelection:\s*true[\s\S]*?spec:\s*'issue-decomposition-detail-selection-smoke\.spec\.ts'[\s\S]*?markerText[\s\S]*?ISSUE_DECOMPOSITION marker must not include raw issue secret[\s\S]*?console\.log\('ISSUE_DECOMPOSITION_DETAIL_SELECTION_SMOKE_OK', markerText\)/s,
  'IssueDecomposition detail selection smoke marker must include mocked-only status, accessible selection, governance loop, planning signal, task isolation, export action isolation, raw result redaction and Markdown copy/export redaction proof.'
)
requirePattern(
  issueDecompositionDetailSelectionSmokeSpec,
  /delayNextTargetTaskRequest[\s\S]*?delayedTargetTaskRoute[\s\S]*?delayedTargetTaskRequests[\s\S]*?releasedDelayedTargetTaskResponses[\s\S]*?network\.delayNextTargetTaskRequest\(\)[\s\S]*?await targetTitleAction\.click\(\)[\s\S]*?network\.delayedTargetTaskRequests[\s\S]*?await failedRow\.focus\(\)[\s\S]*?await page\.keyboard\.press\('Space'\)[\s\S]*?await network\.releaseDelayedTargetTasks\(\)[\s\S]*?network\.releasedDelayedTargetTaskResponses[\s\S]*?staleTargetTasksRejected[\s\S]*?delayedCompletedIssueTasksRejectedAfterFailedSelection:[\s\S]*?delayedTaskResponsesReleased:/s,
  'IssueDecomposition detail selection smoke must simulate a slow completed-issue task response and prove it cannot leak into a later failed issue selection.'
)
for (const routePath of [
  '/dashboard',
  '/projects',
  '/execution-tasks',
  '/artifacts',
  '/agent-tasks',
  '/agent-chat',
  '/auto-repairs',
  '/issue-decomposition',
  '/ci-diagnostics',
  '/pr-reviews',
  '/audit-logs',
  '/model-config',
]) {
  requirePattern(
    appShellUiSmokeSpec,
    new RegExp(routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `App shell UI smoke must cover the protected top-level route ${routePath}.`
  )
}
requirePattern(
  appShellUiSmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?if \(!path\.startsWith\('\/api\/'\)\) \{[\s\S]*?await route\.continue\(\)[\s\S]*?return[\s\S]*?\}/,
  'App shell UI smoke must not intercept Vite source modules such as /src/api/*.ts.'
)
requirePattern(
  appShellUiSmokeSpec,
  /unhandledApiRequests\.push\(`\$\{method\} \$\{path\}\$\{url\.search\}`\)[\s\S]*?status:\s*599/,
  'App shell UI smoke must fail closed for unmocked real /api requests.'
)
requirePattern(
  appShellUiSmokeSpec,
  /expect\(network\.unhandledApiRequests,[\s\S]*?\)\.toEqual\(\[\]\)/,
  'App shell UI smoke must assert that every real /api request was mocked.'
)
requirePattern(
  appShellUiSmokeSpec,
  /expectBoxInsideViewport\(page, '\.sl-topbar-title'[\s\S]*?expectBoxInsideViewport\(page, pageHeadingSelector/,
  'App shell UI smoke must assert the topbar title and page heading are visible and not clipped.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function expectLocatorTextNotClipped\(locator: Locator, label: string\)[\s\S]*?scrollWidth[\s\S]*?clientWidth \+ clipTolerancePx[\s\S]*?scrollHeight[\s\S]*?clientHeight \+ clipTolerancePx/,
  'App shell UI smoke must detect horizontal and vertical text clipping using scroll/client dimensions.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function expectBoxInsideContainer\(page: Page, childSelector: string, containerSelector: string, label: string\)[\s\S]*?child must not escape container top[\s\S]*?child must not escape container bottom/,
  'App shell UI smoke must verify text boxes are contained inside their layout containers.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function expectTopbarAndPageSeparated\(page: Page, label: string\)[\s\S]*?topbar-title-contained[\s\S]*?topbar-desc-contained[\s\S]*?page content must start after the adaptive topbar[\s\S]*?page heading must be visually separated from topbar/,
  'App shell UI smoke must verify topbar text containment and page content separation.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function expectTopbarAndPageSeparated\(page: Page, label: string\)[\s\S]*?expectBoxInsideContainer\(page, '\.sl-topbar-actions', '\.sl-topbar'[\s\S]*?topbar-actions-contained[\s\S]*?const topbarActionStyle = await page\.locator\('\.sl-topbar-actions'\)[\s\S]*?flexWrap:[\s\S]*?overflow:[\s\S]*?topbar actions must wrap instead of squeezing title text[\s\S]*?toBe\('wrap'\)[\s\S]*?topbar actions must not clip actions[\s\S]*?not\.toBe\('hidden'\)/s,
  'App shell UI smoke must execute runtime containment, wrap and overflow checks for topbar actions.'
)
requirePattern(
  appShellUiSmokeSpec,
  /await expectTopbarAndPageSeparated\(page, `\$\{routeCase\.path\}:\$\{viewportName\}`\)/,
  'App shell UI smoke must run topbar/page separation checks on every core route and viewport.'
)
requirePattern(
  appShellUiSmokeSpec,
  /document\.documentElement\.scrollWidth[\s\S]*document\.body\.scrollWidth[\s\S]*toBeLessThanOrEqual\(1\)/,
  'App shell UI smoke must assert no horizontal overflow at every viewport.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function expectPrimaryButtonsReadable\(page: Page, label: string\)[\s\S]*?expectPaintWhite\(button[\s\S]*?for \(const childSelector of \['\.sl-action-button-label', '\.ant-btn-icon'\]\)[\s\S]*?expectPaintWhite\(child[\s\S]*?childSelector === '\.sl-action-button-label'[\s\S]*?expectLocatorTextNotClipped\(child[\s\S]*?button\.locator\('svg, svg \*'\)[\s\S]*?node\.textFillColor[\s\S]*?readableWhite/s,
  'App shell UI smoke must assert primary button root, label, icon wrapper and visible SVG nodes stay white, and label text is not clipped.'
)
requirePattern(
  appShellUiSmokeSpec,
  /expectTextNotClipped\(page, '\.sl-topbar-title'[\s\S]*?expectTextNotClipped\(page, '\.sl-topbar-desc'[\s\S]*?expectTextNotClipped\(page, pageHeadingSelector/s,
  'App shell UI smoke must assert topbar title, visible topbar description and page heading text are not clipped.'
)
requirePattern(
  appShellUiSmokeSpec,
  /\.ant-message-notice-error,\s*\.ant-notification-notice-error/,
  'App shell UI smoke must fail on both AntD message and notification error surfaces.'
)
requirePattern(
  appShellUiSmokeSpec,
  /getByRole\('button', \{ name: '打开导航菜单' \}\)[\s\S]*?\.sl-mobile-nav[\s\S]*?getByRole\('menuitem', \{ name: \/项目与仓库\/ \}\)[\s\S]*?getByRole\('menuitem', \{ name: \/审计日志\/ \}\)/,
  'App shell UI smoke must assert the 320px mobile drawer navigation remains reachable.'
)
requirePattern(
  appShellUiSmokeSpec,
  /const mobileNavigationViewports = viewportMatrix\.filter\(viewport => viewport\.name === 'mobile' \|\| viewport\.name === 'narrow'\)[\s\S]*?async function assertMobileNavigation\(page: Page\)[\s\S]*?for \(const viewport of mobileNavigationViewports\)[\s\S]*?项目与仓库[\s\S]*?审计日志[\s\S]*?toHaveCount\(0\)[\s\S]*?\.sl-perspective-segmented[\s\S]*?workPerspectiveCases[\s\S]*?workPerspectiveBoundary[\s\S]*?`\$\{viewport\.name\}-navigation-drawer`/s,
  'App shell UI smoke must open both mobile drawers, expose the perspective switcher and render only the active Workbench menu.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function assertTopbarAuxiliaryResponsiveContract\(page: Page\)[\s\S]*?for \(const viewport of mobileNavigationViewports\)[\s\S]*?'\.sl-topbar-plane'[\s\S]*?toBe\('none'\)[\s\S]*?`\$\{viewport\.name\}-topbar-auxiliary-collapse`/s,
  'App shell UI smoke must prove topbar plane and auxiliary labels collapse on both 390px and 320px mobile viewports.'
)
requirePattern(
  appShellUiSmokeSpec,
  /topbarPlane:\s*'前台体验'[\s\S]*?topbarPlane:\s*'开发者控制台'[\s\S]*?topbarPlane:\s*'后台治理'[\s\S]*?toHaveText\(routeCase\.topbarPlane\)/,
  'App shell UI smoke must assert each core route maps to the expected topbar product plane.'
)
requirePattern(
  appShellUiSmokeSpec,
  /const workPerspectiveCases:[\s\S]*?value:\s*'workbench'[\s\S]*?label:\s*'开发工作台'[\s\S]*?value:\s*'governance'[\s\S]*?label:\s*'工程治理'[\s\S]*?value:\s*'admin_security'[\s\S]*?label:\s*'平台管理与安全'/,
  'App shell UI smoke must define the three authoritative Chinese work perspective labels and values.'
)
requirePattern(
  appShellUiSmokeSpec,
  /productPlanes:\s*\['前台体验', '开发者控制台', '后台治理'\][\s\S]*?routePlanes:\s*routeCases\.map\(routeCase => `\$\{routeCase\.path\}:\$\{routeCase\.topbarPlane\}`\)/,
  'App shell UI smoke marker must expose route-to-product-plane evidence.'
)
requirePattern(
  appShellUiSmokeSpec,
  /const workPerspectiveViewportMatrix = \[[\s\S]*?width:\s*1440[\s\S]*?width:\s*1024[\s\S]*?width:\s*768[\s\S]*?width:\s*390[\s\S]*?width:\s*320[\s\S]*?async function assertWorkPerspectiveContract[\s\S]*?controls\.userId = 1[\s\S]*?switchPerspective[\s\S]*?sl-perspective-dropdown-button[\s\S]*?localStorage\.setItem\(key, 'admin_security'\)[\s\S]*?controls\.userId = 2[\s\S]*?forged-perspective[\s\S]*?perUserPreferenceKeyIsolation:\s*true[\s\S]*?invalidFallback:\s*true[\s\S]*?deepLinkDoesNotOverwritePreference:\s*true[\s\S]*?collapsedSider:\s*true[\s\S]*?mobileDrawer:\s*true[\s\S]*?breakpointDrawerCleanup:\s*true[\s\S]*?desktopCollapsePreferenceRestored:\s*true[\s\S]*?rbacCompleteClaim:\s*false/,
  'App shell UI smoke must prove five-viewport switching, per-user preference-key isolation, deep-link isolation, invalid fallback, collapsed Sider, mobile Drawer and no RBAC claim.'
)
requirePattern(
  appShellUiSmokeSpec,
  /workPerspectiveStorageKeyPrefix = 'sourcelens\.work-view\.v1\.user\.'[\s\S]*?const controls = \{ userId:\s*1 \}[\s\S]*?id:\s*controls\.userId[\s\S]*?return \{ unhandledApiRequests, controls \}[\s\S]*?const workPerspective = await assertWorkPerspectiveContract\(page, network\.controls\)[\s\S]*?workPerspective,/,
  'App shell UI smoke must bind the persistence contract to a mutable authenticated user id and publish its marker evidence.'
)
requirePattern(
  appShellUiSmokeSpec,
  /page\.goto\('\/'\)[\s\S]*?toHaveURL\(\/\\\/execution-tasks\$\/\)[\s\S]*?page\.goto\('\/dashboard'\)[\s\S]*?toHaveURL\(\/\\\/dashboard\$\/\)[\s\S]*?localStorage\.getItem\(key\)[\s\S]*?toBe\('governance'\)/,
  'Saved preference restoration must occur at / while an explicit /dashboard deep link remains authoritative and does not overwrite the preference.'
)
rejectPattern(
  appShellUiSmokeSpec,
  /item\.click\(\{ force:\s*true \}\)/,
  'Work-perspective smoke must exercise the visible control without force-clicking through real actionability failures.'
)
requirePattern(
  appShellUiSmokeSpec,
  /WORK_PERSPECTIVE_UI_SMOKE_OK[\s\S]*?Work perspective remains usable when preference storage throws[\s\S]*?Storage\.prototype\.getItem[\s\S]*?Storage\.prototype\.setItem[\s\S]*?WORK_PERSPECTIVE_STORAGE_FAILURE_SMOKE_OK/,
  'Work-perspective smoke must expose a dedicated runtime marker and prove localStorage read/write failures keep navigation usable.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function assertNoAppShellProductOverclaim\(page: Page\)[\s\S]*?blockedClaims = \['RBAC 已完成', '权限隔离已完成', '完整后台已完成', '多租户已完成', '生产部署已完成'\][\s\S]*?rbacCompleteClaim:\s*false[\s\S]*?adminSystemCompleteClaim:\s*false[\s\S]*?productionDeploymentClaim:\s*false[\s\S]*?productOverclaim/s,
  'App shell UI smoke must prove the navigation slice does not overclaim RBAC, complete back-office, multi-tenant or production deployment completion.'
)
requirePattern(
  appShellUiSmokeSpec,
  /mobileNavigationViewports:\s*mobileNavigationViewports\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)[\s\S]*?topbarPlaneCollapseViewports:\s*mobileNavigationViewports\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)[\s\S]*?productOverclaim/s,
  'App shell UI smoke marker must expose mobile drawer, topbar plane collapse and overclaim evidence.'
)
rejectPattern(
  appShellUiSmokeSpec,
  /Developer Workbench|Engineering Governance|Admin & Security/,
  'App shell UI smoke must not keep obsolete English navigation group labels after the three-plane split.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function assertSharedTableCellBoundary\(page: Page\)[\s\S]*?\.sl-project-list-table \.ant-table-tbody td:not\(\.ant-table-cell-ellipsis\)[\s\S]*?shared-table-non-ellipsis-cell-long-project-task-audit-artifact-status-token-must-wrap-without-clipping[\s\S]*?\['anywhere', 'break-word'\][\s\S]*?toContain\(nonEllipsisStyle\.overflowWrap\)[\s\S]*?textOverflow[\s\S]*?toBe\('clip'\)[\s\S]*?whiteSpace[\s\S]*?toBe\('normal'\)[\s\S]*?nonEllipsisWrapMetrics[\s\S]*?toBeGreaterThan\(nonEllipsisWrapMetrics\.lineHeight \* 1\.5\)[\s\S]*?expectLocatorTextNotClipped\(nonEllipsisCell[\s\S]*?\.sl-model-provider-table \.sl-model-endpoint-cell[\s\S]*?ancestor::td\[contains\(@class, "ant-table-cell-ellipsis"\)\]\[1\][\s\S]*?ellipsisCellStyle\.overflow[\s\S]*?toBe\('hidden'\)[\s\S]*?ellipsisCellStyle\.textOverflow[\s\S]*?toBe\('ellipsis'\)[\s\S]*?ellipsisCellStyle\.whiteSpace[\s\S]*?toBe\('nowrap'\)[\s\S]*?ellipsisTypographyStyle\.overflow[\s\S]*?toBe\('hidden'\)[\s\S]*?ellipsisTypographyStyle\.textOverflow[\s\S]*?toBe\('ellipsis'\)[\s\S]*?ellipsisTypographyStyle\.whiteSpace[\s\S]*?toBe\('nowrap'\)/s,
  'App shell UI smoke must prove shared Table non-ellipsis cells wrap while ellipsis cells preserve business ellipsis.'
)
requirePattern(
  appShellUiSmokeSpec,
  /await assertSharedTableCellBoundary\(page\)/,
  'App shell UI smoke must execute the shared Table cell boundary guard.'
)
requirePattern(
  appShellUiSmokeSpec,
  /installRuntimeGuards\(page\)[\s\S]*Runtime issues must be empty/,
  'App shell UI smoke must fail on console/page runtime errors except known third-party dev warnings.'
)
requirePattern(
  appShellUiSmokeSpec,
  /APP_SHELL_UI_SMOKE_OK[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*0[\s\S]*?viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)[\s\S]*?routes:\s*routeCases\.map[\s\S]*?expectedVisitedRouteCount[\s\S]*?actualVisitedRouteCount:\s*visitedRoutes\.length[\s\S]*?assertions:[\s\S]*?topbar-title-visible-and-unclipped[\s\S]*?topbar-title-scroll-size-within-box[\s\S]*?topbar-desc-scroll-size-within-box[\s\S]*?topbar-actions-wrap-without-clipping[\s\S]*?topbar-text-contained-by-adaptive-header[\s\S]*?page-content-separated-from-topbar[\s\S]*?page-heading-scroll-size-within-box[\s\S]*?primary-button-label-icon-svg-white[\s\S]*?primary-button-label-scroll-size-within-box[\s\S]*?no-error-toast-or-notification[\s\S]*?layoutGuards:[\s\S]*?topbar-title-contained[\s\S]*?topbar-desc-contained-when-visible[\s\S]*?topbar-actions-contained[\s\S]*?dashboard-recent-table-scroller-contained[\s\S]*?projects-table-scroller-contained[\s\S]*?project-detail-workflow-table-scroller-contained[\s\S]*?shared-table-non-ellipsis-cell-wraps-without-clipping[\s\S]*?shared-table-ellipsis-cell-preserves-ellipsis[\s\S]*?page-content-starts-after-topbar[\s\S]*?page-heading-below-topbar[\s\S]*?spec:\s*'app-shell-ui-smoke\.spec\.ts'/,
  'App shell UI smoke marker must include mocked-only status, routes, viewport matrix, exact route visit counts and topbar/page layout guards.'
)
requirePattern(
  appShellUiSmokeSpec,
  /const expectedVisitedRouteCount = viewportMatrix\.length \* routeCases\.length[\s\S]*?expect\(visitedRoutes,\s*'App shell smoke must visit each core route exactly once per viewport\.'\)\.toHaveLength\(expectedVisitedRouteCount\)/,
  'App shell UI smoke must fail when route visits are duplicated or missing.'
)
requirePattern(
  appShellUiSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'App shell UI smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  appShellUiSmokeSpec,
  /\{ path: `\/scan-tasks\/\$\{scanTaskId\}`, topbarTitle: '扫描报告', topbarPlane: '前台体验', pageHeading: '仓库逆向分析报告', selectedMenuKey: '\/projects', selectedMenuLabel: '项目与仓库' \}/,
  'App shell UI smoke must cover direct scan report loads with explicit topbar, plane, H1 and parent-menu expectations.'
)
requirePattern(
  appShellUiSmokeSpec,
  /async function assertExpectedSelectedMenu\([\s\S]*?\.sl-sider \.ant-menu-item-selected[\s\S]*?getByRole\('button', \{ name: '打开导航菜单' \}\)[\s\S]*?\.sl-mobile-nav[\s\S]*?\.ant-menu-item-selected[\s\S]*?toHaveCount\(1\)[\s\S]*?toContainText\(routeCase\.selectedMenuLabel\)[\s\S]*?surface: isMobile \? 'mobileDrawer' : 'desktopSider'/s,
  'App shell UI smoke must prove /scan-tasks keeps /projects selected in both desktop Sider and mobile Drawer.'
)
requirePattern(
  appShellUiSmokeSpec,
  /\/api\/scan-tasks\/\$\{scanTaskId\}[\s\S]*?\/api\/projects\/\$\{projectId\}\/execution-tasks\/source\/SCAN_TASK\/\$\{scanTaskId\}[\s\S]*?\/api\/projects\/\$\{projectId\}\/scan-tasks\/\$\{scanTaskId\}\/governance-timeline/,
  'App shell UI smoke must fail closed while mocking the scan report task, execution and governance requests needed by direct loads.'
)
requirePattern(
  appShellUiSmokeSpec,
  /scanReportRoutePlane:\s*\{[\s\S]*?directLoad:\s*scanReportSelectedMenuProofs[\s\S]*?topbarTitle:\s*'扫描报告'[\s\S]*?plane:\s*'前台体验'[\s\S]*?pageHeading:\s*'仓库逆向分析报告'[\s\S]*?selectedMenuKey:\s*'\/projects'[\s\S]*?mobileDrawerSelected:[\s\S]*?viewports:\s*viewportMatrix\.map[\s\S]*?horizontalOverflow:\s*true[\s\S]*?runtimeIssues:\s*issues\.length/s,
  'App shell marker must expose direct scan report route-plane and selected-parent-menu evidence across 1440, 390 and 320.'
)
requirePattern(
  appShellUiSmokeSpec,
  /\{ path: `\/projects\/\$\{projectId\}`,[\s\S]*?topbarTitle:\s*'项目与仓库'[\s\S]*?pageHeading:\s*'App Shell Smoke Project'[\s\S]*?requiresPrimaryButton:\s*true/,
  'App shell UI smoke must cover the ProjectDetail route, not only the Projects list.'
)
requirePattern(
  appShellUiSmokeSpec,
  /if \(method === 'GET' && path === `\/api\/projects\/\$\{projectId\}`\)[\s\S]*?fulfillJson\(route, result\(project\)\)[\s\S]*?if \(method === 'GET' && path === `\/api\/projects\/\$\{projectId\}\/scan-tasks`\)/,
  'App shell UI smoke must mock ProjectDetail project detail and scan task APIs when covering /projects/:id.'
)
requirePattern(
  reportAutoRepairCandidateSmokeConfig,
  /const port = Number\(process\.env\.SL_UI_SMOKE_PORT \|\| 5189\)/,
  'Report AutoRepair candidate smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  reportAutoRepairCandidateSmokeConfig,
  /testMatch:\s*\/report-autorepair-candidate-smoke\\\.spec\\\.ts\//,
  'Report AutoRepair candidate smoke config must target only report-autorepair-candidate-smoke.spec.ts.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'Report AutoRepair candidate smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /page\.route\('\*\*\/api\/\*\*'[\s\S]*?if \(!path\.startsWith\('\/api\/'\)\) \{[\s\S]*?await route\.continue\(\)[\s\S]*?return[\s\S]*?\}/,
  'Report AutoRepair candidate smoke must not intercept Vite source modules such as /src/api/*.ts.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /unhandledApiRequests\.push\(`\$\{method\} \$\{path\}\$\{url\.search\}`\)[\s\S]*?status:\s*599/,
  'Report AutoRepair candidate smoke must fail closed for unmocked real /api requests.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /expect\(network\.unhandledApiRequests,[\s\S]*?\)\.toEqual\(\[\]\)/,
  'Report AutoRepair candidate smoke must assert that every real /api request was mocked.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /page\.goto\(`\/scan-tasks\/\$\{scanTaskId\}`\)[\s\S]*?getByRole\('button', \{ name: '查看证据' \}\)[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)[\s\S]*?toHaveURL\(new RegExp\(`\/auto-repairs\\\\\?\.\*openCreate=1`\)\)[\s\S]*?searchParams\.get\('sourceType'\)\)\.toBe\('SCAN_REPORT_RISK'\)[\s\S]*?searchParams\.get\('riskCategory'\)\)\.toBe\('Controller boundary'\)[\s\S]*?searchParams\.get\('riskSeverity'\)\)\.toBe\('HIGH'\)/,
  'Report AutoRepair candidate smoke must prove the report evidence drawer opens the AutoRepair candidate route.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /function expectContainedInViewport[\s\S]*?function expectLocatorTextNotClipped[\s\S]*?function assertAutoRepairCreateModalReadability[\s\S]*?\.sl-autorepair-create-modal[\s\S]*?\.sl-autorepair-draft-receipt[\s\S]*?function assertCandidateReceiptReadability[\s\S]*?candidate-receipt-action-rail/,
  'Report AutoRepair candidate smoke must assert create-modal and candidate-receipt containment/readability, not just horizontal overflow.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /POST' && path === `\/api\/projects\/\$\{projectId\}\/auto-repairs`[\s\S]*?request\.postDataJSON\(\)[\s\S]*?createRequests\.push/,
  'Report AutoRepair candidate smoke must capture the AutoRepair create POST payload.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /request\.payload\.repositoryId\)\.toBe\(repositoryId\)[\s\S]*?request\.payload\.scanTaskId\)\.toBe\(scanTaskId\)[\s\S]*?request\.payload\.filePath\)\.toBe\(targetFile\)[\s\S]*?request\.payload\.targetDesc \|\| ''\)\.toContain\(`扫描报告 #\$\{scanTaskId\}`\)[\s\S]*?request\.payload\.provenance\?\.sourceType\)\.toBe\('SCAN_REPORT_RISK'\)[\s\S]*?request\.payload\.provenance\?\.riskCategory\)\.toBe\('Controller boundary'\)[\s\S]*?request\.payload\.provenance\?\.riskSeverity\)\.toBe\('HIGH'\)/,
  'Report AutoRepair candidate smoke must assert repositoryId, scanTaskId, filePath and targetDesc payload binding.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /locator\('\[aria-label="候选凭证复核动作"\]'\)[\s\S]*?Receipt Review Actions[\s\S]*?候选证据已就绪[\s\S]*?getByRole\('button', \{ name: '打开来源报告' \}\)[\s\S]*?data-sl-target-url[\s\S]*?\/scan-tasks\/\$\{scanTaskId\}[\s\S]*?getByRole\('button', \{ name: 'QA 复核凭证' \}\)[\s\S]*?SCAN_REPORT_RISK[\s\S]*?getByRole\('button', \{ name: '查看候选审计' \}\)[\s\S]*?resourceId=8801/,
  'Report AutoRepair candidate smoke must prove candidate receipt review actions bind report, QA and audit deep links.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /const autoRepairCandidateSafeMarker = 'AUTOREPAIR_CANDIDATE_SAFE_MARKER'[\s\S]*?forbiddenAutoRepairSecretSnippets[\s\S]*?reportRepairGateReasonWithSecrets[\s\S]*?rawPrompt[\s\S]*?rawQuestion[\s\S]*?rawAnswer[\s\S]*?rawCode[\s\S]*?rawDiff[\s\S]*?debugContext[\s\S]*?provenance:[\s\S]*?repairEvidenceGateReason: reportRepairGateReasonWithSecrets/,
  'Report AutoRepair candidate smoke must seed raw secrets into report-derived targetDesc and mocked candidate provenance receipt fields.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /async function assertAutoRepairCandidateRedaction[\s\S]*?not\.toContainText\(secret\)[\s\S]*?locator\('body'\)\.innerText\(\)[\s\S]*?\[data-sl-target-url\][\s\S]*?decodeURIComponent[\s\S]*?AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY/,
  'Report AutoRepair candidate smoke must assert candidate receipt UI, body and data-sl-target-url redaction.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /candidateReceiptRedaction:\s*\{[\s\S]*?scope:\s*'AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY'[\s\S]*?surface:\s*'AUTOREPAIR_SOURCE_BRIDGE_CANDIDATE_PROVENANCE_RECEIPT'[\s\S]*?fixtureHasBearerSecret[\s\S]*?uiRawSecretsHidden[\s\S]*?urlRawSecretsHidden[\s\S]*?bodyRawSecretsHidden[\s\S]*?redactionVisible[\s\S]*?safeMarkerVisible[\s\S]*?markerContainsRawSecret:\s*false[\s\S]*?markerText[\s\S]*?not\.toContain\(secret\)/,
  'Report AutoRepair candidate smoke marker must include candidate receipt display redaction proof and exclude raw secret values.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /const markerPayload = \{[\s\S]*?createEndpoint[\s\S]*?createRequestCount:\s*network\.createRequests\.length[\s\S]*?createPayloadBound:\s*network\.createRequests\.every[\s\S]*?provenancePayloadBound[\s\S]*?candidateReceipt:\s*\{[\s\S]*?auditAction:\s*'AUTO_REPAIR_CANDIDATE_CREATED'[\s\S]*?actionRailVisible:\s*true[\s\S]*?reportDeepLinkBound:\s*true[\s\S]*?qaDeepLinkBound:\s*true[\s\S]*?auditDeepLinkBound:\s*true[\s\S]*?noRawPromptOrAnswer:\s*true[\s\S]*?sourceScanVisible:\s*true[\s\S]*?mockedApiOnly:\s*true[\s\S]*?unhandledApiRequests:\s*network\.unhandledApiRequests\.length[\s\S]*?viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)[\s\S]*?spec:\s*'report-autorepair-candidate-smoke\.spec\.ts'[\s\S]*?console\.log\('REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK', markerText\)/,
  'Report AutoRepair candidate smoke marker must include create endpoint/count, payload binding, source scan visibility, mocked-only status, unhandled API count and viewport matrix.'
)
requirePattern(
  reportAutoRepairCandidateSmokeSpec,
  /layoutDensity:\s*\{[\s\S]*?mobile390Covered[\s\S]*?narrow320Covered[\s\S]*?dialogContained[\s\S]*?candidateReceiptContained[\s\S]*?actionRailContained[\s\S]*?noHorizontalOverflow[\s\S]*?mobileReadability:\s*\{[\s\S]*?criticalTextsWrap[\s\S]*?targetFileNotClipped[\s\S]*?targetDescNotClipped[\s\S]*?candidateReceiptTextNotClipped[\s\S]*?primaryButtonLabelNotClipped[\s\S]*?actionButtonsNotClipped[\s\S]*?qaHandoff:\s*\{[\s\S]*?qaDeepLinkBound[\s\S]*?scanTaskIdBound[\s\S]*?sourceTypeVisible/,
  'Report AutoRepair candidate smoke marker must include layoutDensity, mobileReadability and qaHandoff proof.'
)
requirePattern(
  modelConfig,
  /<Table[\s\S]*?className="sl-model-provider-table"[\s\S]*?columns=\{columns\}[\s\S]*?scroll=\{\{ x: 780 \}\}/,
  'ModelConfig table must set horizontal scroll so provider/action columns remain usable at 320px.'
)
requirePattern(
  css,
  /\.sl-model-table-card\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?\.sl-model-table-card \.ant-card-body,[\s\S]*?\.sl-model-provider-table,[\s\S]*?\.sl-model-table-card \.ant-table-container\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-model-table-card \.ant-table-content\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*auto;/s,
  'ModelConfig provider table must keep horizontal overflow owned by the table scroller.'
)
requirePattern(
  css,
  /\.sl-model-provider-governance\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?\.sl-model-provider-governance-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\.sl-model-provider-governance-step-copy strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\.sl-model-provider-governance-step p\s*\{[\s\S]*?overflow-wrap:\s*anywhere;/s,
  'ModelConfig provider governance loop CSS must provide a four-column desktop grid and wrapping text boundaries.'
)
requirePattern(
  css,
  /\.sl-model-stat strong\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;/s,
  'ModelConfig summary stat values must wrap instead of clipping long model names.'
)
requirePattern(
  css,
  /@media \(max-width: 1200px\)[\s\S]*?\.sl-model-summary-grid,\s*\.sl-model-provider-governance-grid,[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?@media \(max-width: 720px\)[\s\S]*?\.sl-model-provider-governance-step \.ant-btn\s*\{[\s\S]*?width:\s*100%;[\s\S]*?\.sl-model-summary-grid,\s*\.sl-model-provider-governance-grid,[\s\S]*?grid-template-columns:\s*1fr;/s,
  'ModelConfig provider governance loop CSS must collapse to two columns at tablet width and one column with full-width actions on mobile.'
)
requirePattern(
  ciDiagnostics,
  /<Table[\s\S]*?columns=\{columns\}[\s\S]*?scroll=\{\{ x: 760 \}\}/,
  'CiDiagnostics table must set horizontal scroll so diagnostic columns remain usable at 320px.'
)
requirePattern(
  prReviews,
  /<Table[\s\S]*?columns=\{columns\}[\s\S]*?scroll=\{\{ x: 860 \}\}/,
  'PrReviews table must set horizontal scroll so review columns remain usable at 320px.'
)
requirePattern(
  publicRepoUiSmokeConfig,
  /const port = Number\(process\.env\.SL_PUBLIC_REPO_UI_PORT \|\| 5184\)/,
  'Public repo UI smoke must use a dedicated default dev-server port instead of the normal 5173 app port.'
)
requirePattern(
  publicRepoAnalysisSmokeScript,
  /first_matches_exact_anchor[\s\S]*?"queryHadScheme": ":\/\/" in query[\s\S]*?"queryHadViteQueryParam": "\?t=" in query[\s\S]*?"queryHadColumn": query_had_column[\s\S]*?"queryHadWebpackScheme": "webpack:\/\/" in query[\s\S]*?"firstResultIndex": 0[\s\S]*?"firstResultFile"[\s\S]*?"firstResultMatchesExactAnchor": first_matches_exact_anchor[\s\S]*?"exactAnchorPreservedAsFirstResult": first_matches_exact_anchor[\s\S]*?"sourceLocationProbeContractVersion": 4/,
  'Public repo analysis smoke sourceLocationProbes v4 must prove exact-anchor first-result preservation and sanitized query-shape booleans.'
)
requirePattern(
  publicRepoAnalysisSmokeScript,
  /run_source_location_probe\([\s\S]*?"viteQuerySourceUrl"[\s\S]*?f"http:\/\/localhost:5173\/\{anchor_file\}\?t=1782991000000:\{anchor_line\}:19"[\s\S]*?expected_port=5173[\s\S]*?expected_column=19/,
  'Public repo analysis smoke must exercise a real Vite query source URL probe with port, query parameter and column.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /"firstResultIndex"[\s\S]*?"firstResultFile"[\s\S]*?"firstResultMatchesExactAnchor"[\s\S]*?"exactAnchorPreservedAsFirstResult"[\s\S]*?queryShapeProofRequired = sourceLocationProbeContractVersion === 3 \|\| sourceLocationProbeContractVersion === 4[\s\S]*?firstResultProofRequired = sourceLocationProbeContractVersion === 4[\s\S]*?firstResultIndex === 0[\s\S]*?firstResultFile === value\.targetFile[\s\S]*?firstResultMatchesExactAnchor === true[\s\S]*?exactAnchorPreservedAsFirstResult === true[\s\S]*?expectedKind === "viteQuerySourceUrl"[\s\S]*?queryHadViteQueryParam === true[\s\S]*?queryShape === "anonymous-stack-frame"[\s\S]*?queryHadWebpackScheme === true/,
  'Release evidence verifier must reject v4 sourceLocationProbes that do not prove exact-anchor first-result preservation and query-shape booleans.'
)
requirePattern(
  securityRegressionScript,
  /sourceLocationProbeContractVersion: 4[\s\S]*?firstResultMatchesExactAnchor: true[\s\S]*?exactAnchorPreservedAsFirstResult: true[\s\S]*?queryHadScheme: true[\s\S]*?queryHadViteQueryParam: true[\s\S]*?queryHadColumn: true[\s\S]*?queryHadWebpackScheme: true[\s\S]*?source-url-no-scheme[\s\S]*?source-url-no-column[\s\S]*?v3-missing-shape-proof[\s\S]*?vite-no-query-param[\s\S]*?vite-webpack-claim[\s\S]*?webpack-no-scheme[\s\S]*?first-result-file-mismatch[\s\S]*?first-result-line-miss[\s\S]*?first-result-index-not-zero[\s\S]*?first-result-match-false[\s\S]*?exact-anchor-not-preserved/,
  'Security regression must reject forged sourceLocationProbes that claim source-url shapes or exact-anchor first-result preservation without proof.'
)
requirePattern(
  publicRepoUiSmokeConfig,
  /testMatch:\s*\/public-repo-ui-smoke\\\.spec\\\.ts\//,
  'Public repo UI smoke config must target only public-repo-ui-smoke.spec.ts.'
)
requirePattern(
  publicRepoUiSmokeConfig,
  /VITE_API_PROXY_TARGET=\$\{apiProxyTarget\} npm run dev/,
  'Public repo UI smoke must proxy Vite /api requests to the real backend under test.'
)
rejectPattern(
  publicRepoUiSmokeSpec,
  /page\.route\(/,
  'Public repo UI smoke must not mock or intercept API requests; it must use the real backend sample.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /requiredEnv\('SL_PUBLIC_REPO_UI_TOKEN'\)/,
  'Public repo UI smoke must require an explicit short-lived JWT from the public repo smoke.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /requiredIntEnv\('SL_PUBLIC_REPO_UI_PROJECT_ID'\)[\s\S]*requiredIntEnv\('SL_PUBLIC_REPO_UI_REPOSITORY_ID'\)[\s\S]*requiredIntEnv\('SL_PUBLIC_REPO_UI_SCAN_TASK_ID'\)/,
  'Public repo UI smoke must require project, repository and scan task ids from the real smoke fixture.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /document\.documentElement\.scrollWidth[\s\S]*document\.body\.scrollWidth[\s\S]*toBeLessThanOrEqual\(1\)/,
  'Public repo UI smoke must assert no horizontal overflow.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /const viewportMatrix = \[[\s\S]*?\{ name: 'desktop', width: 1440, height: 900 \}[\s\S]*?\{ name: 'mobile', width: 390, height: 844 \}[\s\S]*?\{ name: 'narrow', width: 320, height: 740 \}[\s\S]*?\]/,
  'Public repo UI smoke must include desktop, 390px mobile and 320px narrow viewports.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /viewports:\s*viewportMatrix\.map\(viewport => `\$\{viewport\.width\}x\$\{viewport\.height\}`\)/,
  'Public repo UI smoke evidence marker must include the viewport matrix.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /type QaEvidenceHandoffProof(?=[\s\S]*?sourceLocationConfidenceVisible: boolean)(?=[\s\S]*?sourceLocationConfidenceReadyVisible: boolean)(?=[\s\S]*?getByLabel\('来源定位可信度'\)\.last\(\))(?=[\s\S]*?getByText\('来源定位可信', \{ exact: true \}\))(?=[\s\S]*?sourceLocationConfidenceReadyVisible: true)(?=[\s\S]*?sourceLocationConfidenceReadyVisible: qaEvidenceHandoffProofs\.every)/,
  'Public repo UI smoke must record source location confidence visibility in the QA evidence handoff marker.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /ProjectDetail[\s\S]*ScanTaskDetail[\s\S]*ProjectDetail QA[\s\S]*Artifacts[\s\S]*AuditLogs[\s\S]*AutoRepair candidate/,
  'Public repo UI smoke marker must describe the real page matrix it covers.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /waitForGovernanceTimeline\(page: Page, viewportName: string\)[\s\S]*?\/api\/projects\/\$\{projectId\}\/scan-tasks\/\$\{scanTaskId\}\/governance-timeline[\s\S]*?response\.request\(\)\.method\(\) === 'GET'[\s\S]*?response\.status\(\) === 200[\s\S]*?governanceBody\.code[\s\S]*?toBe\('SUCCESS'\)[\s\S]*?governanceData\.projectId[\s\S]*?toBe\(projectId\)[\s\S]*?governanceData\.repositoryId[\s\S]*?toBe\(repositoryId\)[\s\S]*?governanceData\.scanTaskId[\s\S]*?toBe\(scanTaskId\)/,
  'Public repo UI smoke must wait for the real scan governance aggregate API and assert GET, 200, SUCCESS and project/repository/scan binding.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /summary\.counts[\s\S]*?requiredCountKeys[\s\S]*?normalizedCounts\.artifacts[\s\S]*?toBeGreaterThan\(0\)[\s\S]*?normalizedCounts\.scanExecutions[\s\S]*?toBe\(1\)[\s\S]*?resources\.artifacts[\s\S]*?ownerType === 'SCAN_TASK'[\s\S]*?ownerId === scanTaskId[\s\S]*?resources\.scanExecution\?\.task\?\.sourceType[\s\S]*?toBe\('SCAN_TASK'\)[\s\S]*?resources\.scanExecution\?\.task\?\.sourceId[\s\S]*?toBe\(scanTaskId\)[\s\S]*?governanceData\.events[\s\S]*?governanceData\.limits\?\.events\?\.returned/,
  'Public repo UI smoke must assert governance counts, resources, events and limits stay scan-bound.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /page\.getByLabel\('修复治理时间线'\)[\s\S]*?getByText\(`Scan #\$\{scanTaskId\}`\)[\s\S]*?getByText\(\/报告风险\/\)[\s\S]*?getByText\(\/AutoRepair\/\)[\s\S]*?getByText\(\/Agent 任务\/\)[\s\S]*?getByText\(\/执行任务\/\)[\s\S]*?getByText\(\/产物证据\/\)[\s\S]*?getByText\(\/审计留痕\/\)/,
  'Public repo UI smoke must assert the live scan governance timeline and six card labels are visible.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /expectNoErrorToast[\s\S]*?加载修复治理时间线失败[\s\S]*?治理聚合加载失败/,
  'Public repo UI smoke must fail when governance timeline loading errors are visible.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /getByRole\('region', \{ name: '报告证据追踪' \}\)[\s\S]*?getByRole\('button', \{ name: '查看证据' \}\)\.first\(\)[\s\S]*?getByRole\('dialog', \{ name: '报告证据抽屉' \}\)/,
  'Public repo UI smoke must click a real ScanTaskDetail report evidence drawer entry.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /page\.waitForResponse\(\(response\) => \{[\s\S]*?\/api\/projects\/\$\{projectId\}\/code-chunks\/search[\s\S]*?scanTaskId'\) === String\(scanTaskId\)[\s\S]*?limit'\) === '3'/,
  'Public repo UI smoke must listen for the real scan-bound code_chunks drawer request with scanTaskId and limit=3.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /drawerData\.scanTaskId[\s\S]*?toBe\(scanTaskId\)[\s\S]*?item\?\.scanTaskId[\s\S]*?toBe\(scanTaskId\)/,
  'Public repo UI smoke must assert drawer code_chunks response and items stay bound to the current scanTaskId.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /pages:\s*\[[\s\S]*?'Report Evidence Drawer'[\s\S]*?\][\s\S]*?evidenceDrawer:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?opened:\s*true[\s\S]*?codeChunksSummaryVisible:\s*true[\s\S]*?displayedChunk:\s*true[\s\S]*?scanTaskId[\s\S]*?limit:\s*3[\s\S]*?resultCount:\s*minReportEvidenceChunkHits[\s\S]*?expectedEvidenceFile[\s\S]*?codeKnowledge:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?scanTaskId[\s\S]*?responseStatus:\s*200[\s\S]*?resultCount:\s*minCodeKnowledgeResultCount[\s\S]*?totalChunks:\s*minCodeKnowledgeTotalChunks[\s\S]*?embeddedChunks:\s*minCodeKnowledgeEmbeddedChunks[\s\S]*?retrievalModes:\s*codeKnowledgeRetrievalModes[\s\S]*?readiness:\s*codeKnowledgeReadiness[\s\S]*?minConfidence:\s*minCodeKnowledgeConfidence[\s\S]*?uniqueFiles:\s*minCodeKnowledgeUniqueFiles[\s\S]*?evidenceProfileVisible[\s\S]*?currentScanOnly[\s\S]*?sourceLabelsVisible[\s\S]*?filePathsVisible[\s\S]*?expectedEvidenceFileVisible[\s\S]*?fileStatsVisible[\s\S]*?contextRoles:\s*codeKnowledgeContextRoles[\s\S]*?evidenceTypes:\s*codeKnowledgeEvidenceTypes[\s\S]*?readinessUsable[\s\S]*?crossFileEvidence:\s*\{[\s\S]*?limit:\s*24[\s\S]*?uniqueFiles:\s*minCrossFileUniqueFiles[\s\S]*?fileStatsUniqueFiles:\s*minCrossFileFileStatsUniqueFiles[\s\S]*?minFileEvidenceSatisfied/,
  'Public repo UI smoke marker must include Report Evidence Drawer and live codeKnowledge readiness proof fields.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /const codeKnowledge: CodeKnowledgeProof = \{[\s\S]*?totalChunks:\s*Number\(drawerData\.totalChunks \|\| 0\)[\s\S]*?embeddedChunks:\s*Number\(drawerData\.embeddedChunks \|\| 0\)[\s\S]*?retrievalMode[\s\S]*?readiness[\s\S]*?evidenceProfileVisible[\s\S]*?currentScanOnly[\s\S]*?sourceLabelsVisible[\s\S]*?filePathsVisible[\s\S]*?expectedEvidenceFileVisible[\s\S]*?fileStatsVisible[\s\S]*?readinessUsable[\s\S]*?crossFileEvidence[\s\S]*?\}[\s\S]*?codeKnowledge\.totalChunks[\s\S]*?toBeGreaterThan\(0\)[\s\S]*?codeKnowledge\.currentScanOnly[\s\S]*?toBe\(true\)[\s\S]*?codeKnowledge\.crossFileEvidence\.minFileEvidenceSatisfied[\s\S]*?toBe\(true\)/,
  'Public repo UI smoke must derive codeKnowledge readiness from the live code-chunks search response and assert current-scan usable evidence.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /async function verifyViewport[\s\S]*?const codeKnowledgeReadiness = page\.getByRole\('region', \{ name: 'Code Knowledge readiness' \}\)[\s\S]*?expect\(codeKnowledgeReadiness,[\s\S]*?\)\.toBeVisible\(\)[\s\S]*?codeKnowledgeReadiness\.getByText\('Code Knowledge', \{ exact: true \}\)[\s\S]*?const codeKnowledgeChunkTag = codeKnowledgeReadiness[\s\S]*?\.locator\('\.sl-code-knowledge-tags \.ant-tag'\)[\s\S]*?\.filter\(\{ hasText: \/\^\[1-9\]\\d\{0,2\}\(\?:,\\d\{3\}\)\* code_chunks\$\/ \}\)[\s\S]*?expect\(codeKnowledgeChunkTag,[\s\S]*?\)\.toBeVisible\(\)/,
  'Public repo UI smoke must scope exact Code Knowledge identity and positive code_chunks total assertions to the visible readiness region.'
)
rejectPattern(
  publicRepoUiSmokeSpec,
  /page\.getByText\(\/code_chunks\|Code Knowledge\/\)\.first\(\)/,
  'Public repo UI smoke must not use the global Code Knowledge text locator that can match hidden mobile topbar copy.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /async function verifyCrossFileCodeKnowledge\(page: Page, viewportName: string\): Promise<CrossFileEvidenceProof>[\s\S]*?query = ''[\s\S]*?limit = 24[\s\S]*?\/api\/projects\/\$\{projectId\}\/code-chunks\/search[\s\S]*?Authorization: `Bearer \$\{token\}`[\s\S]*?uniqueFiles[\s\S]*?fileStatsUniqueFiles[\s\S]*?minFileEvidenceSatisfied[\s\S]*?toBe\(true\)/,
  'Public repo UI smoke must prove cross-file code knowledge through a live broad code-chunks search probe.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /async function verifyQaFromEvidence\(page: Page, viewportName: string, drawerEvidenceAnchors: ReportEvidenceDrawerProof\['evidenceAnchors'\]\)[\s\S]*?Promise<QaFromEvidenceProof>[\s\S]*?evidenceLine[\s\S]*?evidenceLineParam[\s\S]*?\/api\/projects\/\$\{projectId\}\/qa[\s\S]*?qaResponse\.request\(\)\.postData\(\)[\s\S]*?answerCitations[\s\S]*?citationCoverage[\s\S]*?evidenceRoleDistribution[\s\S]*?groundingStatus[\s\S]*?citationEnforcementStatus[\s\S]*?evidenceRefRequestBound[\s\S]*?qaRequestPayload\?\.evidenceRef\?\.filePath[\s\S]*?qaRequestPayload\?\.evidenceRef\?\.lineNumber[\s\S]*?evidenceRefResponseBound[\s\S]*?qaData\?\.sourceEvidenceRef\?\.filePath[\s\S]*?qaData\?\.sourceEvidenceRef\?\.lineNumber[\s\S]*?toBe\('REPORT_LINE_ANCHOR'\)[\s\S]*?toBe\('VERIFIED'\)[\s\S]*?citedByAnswer[\s\S]*?repairCandidateCount[\s\S]*?getByLabel\('引用覆盖审计'\)[\s\S]*?getByLabel\('证据角色分布'\)[\s\S]*?getByLabel\('回答引用证据'\)[\s\S]*?coverageRepairCandidateCount/,
  'Public repo UI smoke must submit real scan-bound QA with report evidence line binding and require cited answer-level citations with role distribution.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /qaFromEvidenceProofs\.every\(proof => \['REQUIRED_FULL', 'FULL', 'PARTIAL'\]\.includes\(proof\.coverageStatus\)\)\)\.toBe\(true\)/,
  'Public repo UI smoke must allow only REQUIRED_FULL, FULL or PARTIAL final QA evidence coverage statuses.'
)
rejectPattern(
  publicRepoUiSmokeSpec,
  /qaFromEvidenceProofs\.every\(proof => \['FULL', 'PARTIAL'\]\.includes\(proof\.coverageStatus\)\)\)\.toBe\(true\)/,
  'Public repo UI smoke must not regress to the legacy FULL/PARTIAL-only coverage status allowlist.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /verifyQaFromEvidence[\s\S]*?claimCitationCoverage[\s\S]*?claimRoleDistribution[\s\S]*?toBe\('READY'\)[\s\S]*?requiredClaimCount[\s\S]*?citedRequiredClaimCount[\s\S]*?invalidCitationClaimCount[\s\S]*?toBe\('PRIMARY_BOUND'\)[\s\S]*?requiredPrimaryBoundClaimCount[\s\S]*?getByLabel\('主张引用质量'\)[\s\S]*?getByText\('主张已绑定引用'\)[\s\S]*?getByLabel\('主张证据角色分布'\)/,
  'Public repo UI smoke must prove live QA claim citation quality is READY and visible.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /getByLabel\('QA 可信度摘要'\)\.first\(\)[\s\S]*?可采信并进入修复复核/,
  'Public repo UI smoke must assert the user-readable QA trust summary is visible for live verified QA.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /getByLabel\('跨文件引用摘要'\)\.first\(\)[\s\S]*?跨文件引用结论[\s\S]*?getByText\('跨文件引用可采信', \{ exact: true \}\)\.first\(\)[\s\S]*?上下文引用缺口[\s\S]*?crossFileCitationSummary:\s*\{[\s\S]*?visible:[\s\S]*?tones:[\s\S]*?crossFileEvidenceSatisfied:[\s\S]*?citationBindingSatisfied:[\s\S]*?claimBindingSatisfied:[\s\S]*?contextGapVisible:\s*qaFromEvidenceProofs\.every\(proof => proof\.crossFileSummaryContextGapVisible\)[\s\S]*?minUncitedContextEvidenceCount[\s\S]*?minUncitedContextEvidenceFileCount[\s\S]*?sourceEvidenceMatchTypes:[\s\S]*?minEvidenceFileCount[\s\S]*?minRequiredPrimaryBoundClaimCount/,
  'Public repo UI smoke must assert and emit the cross-file citation summary marker for live verified QA.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /async function verifyFileAnchorDrift[\s\S]*?getByLabel\('跨文件引用摘要'\)\.last\(\)[\s\S]*?getByText\('上下文引用可复核', \{ exact: true \}\)[\s\S]*?getByLabel\('上下文引用缺口'\)/,
  'Public repo UI file-anchor drift smoke must assert the exact context-reference-review title.'
)
rejectPattern(
  publicRepoUiSmokeSpec,
  /上下文引用待补齐/,
  'Public repo UI smoke must not regress to the removed context-reference-pending title.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /type EvidenceCombinationSummaryProof = \{[\s\S]*?surface: 'PROJECT_QA_CODE_CHUNKS_SEARCH'[\s\S]*?primaryCount: number[\s\S]*?adjacentContextCount: number[\s\S]*?uniqueFileCount: number[\s\S]*?embeddedEvidenceCount: number[\s\S]*?derivedFromVisibleResults: boolean[\s\S]*?resultSetOnly: boolean[\s\S]*?providerQualityClaim: boolean[\s\S]*?llmFactClaim: boolean[\s\S]*?async function verifyEvidenceCombinationSummary\(page: Page, viewportName: string, chunks: any\[\]\)[\s\S]*?getByLabel\('证据组合路径'\)\.last\(\)[\s\S]*?证据组合路径[\s\S]*?主证据阅读起点[\s\S]*?相邻上下文[\s\S]*?文件覆盖[\s\S]*?向量证据[\s\S]*?nextQuestionCount[\s\S]*?toBeGreaterThanOrEqual\(3\)[\s\S]*?providerQualityClaim: false[\s\S]*?llmFactClaim: false/,
  'Public repo UI smoke must assert the visible Project QA evidence combination summary without provider-quality or LLM-fact overclaims.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /projectQaEvidenceCombinationSummary:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?surface:\s*'PROJECT_QA_CODE_CHUNKS_SEARCH'[\s\S]*?scanTaskId[\s\S]*?requestScanTaskId:\s*scanTaskId[\s\S]*?responseScanTaskId:\s*scanTaskId[\s\S]*?currentScanOnly[\s\S]*?resultCount[\s\S]*?visibleCardCount[\s\S]*?minPrimaryCount[\s\S]*?minUniqueFileCount[\s\S]*?minNextQuestionCount[\s\S]*?sourceLabelsVisible[\s\S]*?filePathsVisible[\s\S]*?derivedFromVisibleResults[\s\S]*?resultSetOnly[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false[\s\S]*?noHorizontalOverflow/,
  'Public repo UI smoke marker must emit a top-level Project QA evidence-combination proof bound to the current scan.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /type CodeUnderstandingLensProof = \{[\s\S]*?surface: 'PROJECT_QA_CODE_UNDERSTANDING_LENS'[\s\S]*?inputKind: 'FILE_LINE'[\s\S]*?queryShape: 'file:line'[\s\S]*?primaryMatched: boolean[\s\S]*?targetFileMatchesExpected: boolean[\s\S]*?locateSearchVisible: boolean[\s\S]*?explainHereVisible: boolean[\s\S]*?copyReferenceVisible: boolean[\s\S]*?rawStackStored: boolean[\s\S]*?providerQualityClaim: boolean[\s\S]*?llmFactClaim: boolean/,
  'Public repo UI smoke must define a codeUnderstandingLens proof with file:line, action, raw-input, and overclaim guard fields.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /async function verifyCodeUnderstandingLens\([\s\S]*?targetAnchor\?: \{ filePath\?: string \| null; lineNumber\?: number \| string \| null \}[\s\S]*?const targetFile = String\(targetAnchor\?\.filePath \|\| ''\)[\s\S]*?const targetLine = Number\(targetAnchor\?\.lineNumber \|\| 0\)[\s\S]*?\/api\/projects\/\$\{projectId\}\/code-chunks\/search[\s\S]*?scanTaskId'\) === String\(scanTaskId\)[\s\S]*?getByLabel\('代码理解定位入口'\)[\s\S]*?按 file:line 定位[\s\S]*?getByRole\('button', \{ name: '定位检索' \}\)[\s\S]*?getByRole\('button', \{ name: '解释此处' \}\)[\s\S]*?getByRole\('button', \{ name: '复制引用' \}\)[\s\S]*?primaryMatched[\s\S]*?targetFileMatchesExpected[\s\S]*?rawStackStored: false[\s\S]*?providerQualityClaim: false[\s\S]*?llmFactClaim: false/,
  'Public repo UI smoke must prove the code understanding lens through the report evidence anchor, a real current-scan code-chunks request and visible UI actions.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /codeUnderstandingLens:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?surface:\s*'PROJECT_QA_CODE_UNDERSTANDING_LENS'[\s\S]*?scanTaskId[\s\S]*?requestScanTaskId:\s*scanTaskId[\s\S]*?responseScanTaskId:\s*scanTaskId[\s\S]*?responseStatus[\s\S]*?resultCount[\s\S]*?currentScanOnly[\s\S]*?inputKinds[\s\S]*?queryShapes[\s\S]*?primaryMatched[\s\S]*?sourceLabels[\s\S]*?primaryReferences[\s\S]*?readinessUsable[\s\S]*?targetFileMatchesExpected[\s\S]*?locateSearchVisible[\s\S]*?explainHereVisible[\s\S]*?copyReferenceVisible[\s\S]*?rawStackStored:\s*false[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false[\s\S]*?noHorizontalOverflow/,
  'Public repo UI smoke marker must emit a top-level codeUnderstandingLens release proof bound to the current scan.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /function assertEvidenceCombinationSummary\(value, label, expectedScanTaskId\)[\s\S]*?surface[\s\S]*?PROJECT_QA_CODE_CHUNKS_SEARCH[\s\S]*?scanTaskId === expectedScanTaskId[\s\S]*?requestScanTaskId === expectedScanTaskId[\s\S]*?responseScanTaskId === expectedScanTaskId[\s\S]*?providerQualityClaim === false[\s\S]*?llmFactClaim === false[\s\S]*?Object\.prototype\.hasOwnProperty\.call\(uiPayload, "projectQaEvidenceCombinationSummary"\)[\s\S]*?assertEvidenceCombinationSummary\(uiPayload\.projectQaEvidenceCombinationSummary[\s\S]*?uiPayload\.scanTaskId/,
  'Release evidence verifier must strictly validate optional Project QA evidence-combination markers when present while keeping existing authorities compatible.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /function assertCodeUnderstandingLens\(value, label, expectedScanTaskId, expectedEvidenceFile\)[\s\S]*?PROJECT_QA_CODE_UNDERSTANDING_LENS[\s\S]*?scanTaskId === expectedScanTaskId[\s\S]*?requestScanTaskId === expectedScanTaskId[\s\S]*?responseScanTaskId === expectedScanTaskId[\s\S]*?inputKinds[\s\S]*?FILE_LINE[\s\S]*?primaryReferences[\s\S]*?assertSafeEvidencePath[\s\S]*?targetFileMatchesExpected[\s\S]*?providerQualityClaim[\s\S]*?llmFactClaim[\s\S]*?assertCodeUnderstandingLens\(\s*uiPayload\.codeUnderstandingLens/,
  'Release evidence verifier must strictly validate the public repo UI codeUnderstandingLens marker.'
)
requirePattern(
  securityRegressionScript,
  /projectQaEvidenceCombinationSummary[\s\S]*?project-qa-evidence-combination-status-fail[\s\S]*?project-qa-evidence-combination-provider-claim[\s\S]*?project-qa-evidence-combination-llm-fact-claim[\s\S]*?project-qa-evidence-combination-raw-content[\s\S]*?for evidence_combination_mutation in[\s\S]*?project-qa-evidence-combination-array[\s\S]*?project-qa-evidence-combination-overflow[\s\S]*?verify_public_repo_ui_marker_rejects "\$evidence_combination_mutation"/,
  'Security regression must reject forged Project QA evidence-combination marker fields when the optional marker is present.'
)
requirePattern(
  securityRegressionScript,
  /codeUnderstandingLens[\s\S]*?missing-code-understanding-lens[\s\S]*?code-understanding-lens-general-kind[\s\S]*?code-understanding-lens-unsafe-path[\s\S]*?code-understanding-lens-raw-stack[\s\S]*?code-understanding-lens-provider-claim[\s\S]*?for code_understanding_lens_mutation in[\s\S]*?code-understanding-lens-invalid-line-range[\s\S]*?code-understanding-lens-llm-fact-claim[\s\S]*?verify_public_repo_ui_marker_rejects "\$code_understanding_lens_mutation"/,
  'Security regression must reject forged public repo UI codeUnderstandingLens marker fields.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /qaFromEvidence:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?scanTaskId[\s\S]*?responseStatus:\s*200[\s\S]*?resultCount:\s*minQaResultCount[\s\S]*?citationCount:\s*minQaCitationCount[\s\S]*?citationCoverage:\s*\{[\s\S]*?minRepairCandidateCount[\s\S]*?minUniqueEvidenceFileCount[\s\S]*?minCitedEvidenceFileCount[\s\S]*?minPrimaryEvidenceFileCount[\s\S]*?minCitedPrimaryEvidenceFileCount[\s\S]*?minRequiredEvidenceFileCount[\s\S]*?minCitedRequiredEvidenceFileCount[\s\S]*?evidenceRoleDistribution:\s*\{[\s\S]*?minRoleCount[\s\S]*?minFileEntryCount[\s\S]*?claimCitationCoverage:\s*\{[\s\S]*?minClaimCoveragePercent[\s\S]*?maxInvalidCitationClaimCount[\s\S]*?minValidCitationFileCount[\s\S]*?minRequiredClaimCitationFileCount[\s\S]*?roleDistribution:\s*\{[\s\S]*?minRequiredPrimaryBoundClaimCount[\s\S]*?minRequiredPrimaryFileCount[\s\S]*?groundingStatuses[\s\S]*?citationEnforcementStatuses[\s\S]*?citationEnforcementReasons[\s\S]*?citedChunkCount[\s\S]*?expectedEvidenceFileVisible:\s*true[\s\S]*?evidenceRef:\s*\{[\s\S]*?requestBound:\s*true[\s\S]*?responseBound:\s*true[\s\S]*?contextVisible:\s*true[\s\S]*?filePath/,
  'Public repo UI smoke marker must include qaFromEvidence cited answer, citation file distribution, evidence role distribution, claim citation, and evidenceRef binding proof fields.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /claimCitationCoverage:\s*\{[\s\S]*?statuses:[\s\S]*?minRequiredClaimCitationFileCount[\s\S]*?readyForRepair:\s*qaFromEvidenceProofs\.every\(proof => proof\.claimReadyForRepair\)[\s\S]*?readinessReasons:\s*Array\.from\(new Set\(qaFromEvidenceProofs\.map\(proof => proof\.claimReadinessReason\)\.filter\(Boolean\)\)\)\.sort\(\)[\s\S]*?roleDistribution:/,
  'Public repo UI smoke marker must emit claim citation repair readiness and PRIMARY_BOUND readiness reasons.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /function assertReadyClaimCitationCoverage\(value, label\)[\s\S]*?value\.readyForRepair === true[\s\S]*?PRIMARY_BOUND_READY[\s\S]*?readinessReasons must contain only PRIMARY_BOUND_READY/,
  'Release verifier must hard-require repair-ready claim citation coverage with PRIMARY_BOUND_READY readiness.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /PUBLIC_REPO_SMOKE_OK codeQa\.claimCitationCoverage\.readyForRepair must be true[\s\S]*?PUBLIC_REPO_SMOKE_OK codeQa\.claimCitationCoverage\.readinessReason must be PRIMARY_BOUND_READY/,
  'Release verifier must hard-require public repo Code QA claim readiness fields.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /type QaEvidenceHandoffProof = \{[\s\S]*?surface: 'PROJECT_QA_REPORT_EVIDENCE_HANDOFF'[\s\S]*?sourceEvidenceReceiptVisible: boolean[\s\S]*?repairCandidateActionVisible: boolean[\s\S]*?autoRepairDraftUrlBound: boolean[\s\S]*?sourceEvidenceParamsBound: boolean[\s\S]*?candidateFormOpened: boolean[\s\S]*?providerQualityClaim: boolean[\s\S]*?llmFactClaim: boolean/,
  'Public repo UI smoke must define a QA evidence handoff proof without provider-quality or LLM-fact overclaims.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /getByLabel\('QA 回答报告证据凭证'\)\.last\(\)[\s\S]*?toContainText\(evidenceTitle\)[\s\S]*?toContainText\('public repo UI smoke'\)[\s\S]*?toContainText\('REPORT_LINE_ANCHOR'\)[\s\S]*?getByLabel\('QA 下一步动作'\)\.last\(\)[\s\S]*?getByRole\('button', \{ name: '生成修复候选' \}\)[\s\S]*?getAttribute\('data-sl-target-url'\)[\s\S]*?new URL\(autoRepairDraftPath[\s\S]*?sourceEvidenceParamsBound/,
  'Public repo UI smoke must prove the live QA answer source receipt and parse the QA verified-citation AutoRepair handoff URL.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /openAndAssert\([\s\S]*?qaFromEvidenceProof\.qaEvidenceHandoff\.autoRepairDraftPath[\s\S]*?'受控代码补丁生成'[\s\S]*?Project QA verified citation[\s\S]*?candidateInputValues[\s\S]*?qaFromEvidenceProof\.qaEvidenceHandoff\.candidateFilePath[\s\S]*?candidateFormOpened = true/,
  'Public repo UI smoke must open the AutoRepair candidate form from the QA verified-citation handoff URL instead of a manual fallback URL.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /evidenceHandoff:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?surface:\s*'PROJECT_QA_REPORT_EVIDENCE_HANDOFF'[\s\S]*?answerSourceReceiptVisible[\s\S]*?sourceEvidenceMatchTypes[\s\S]*?readyForAutoRepair[\s\S]*?repairCandidateActionVisible[\s\S]*?autoRepairDraftUrlBound[\s\S]*?sourceTypes[\s\S]*?sourceEvidenceParamsBound[\s\S]*?candidateFormOpened[\s\S]*?noRawPromptOrAnswer[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false[\s\S]*?noHorizontalOverflow/,
  'Public repo UI smoke marker must emit a qaFromEvidence.evidenceHandoff proof without raw URLs, prompt, answer or source content.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /type SourceFileMatchReleaseProof = \{[\s\S]*?surface: 'PROJECT_QA_SOURCE_FILE_MATCH_RELEASE'[\s\S]*?releaseState: 'READY' \| 'REVIEW'[\s\S]*?pathMatchType: 'PATH_SUFFIX' \| 'FILE_NAME_ONLY' \| 'NONE'[\s\S]*?requiredEvidenceCovered: boolean[\s\S]*?primaryClaimBound: boolean[\s\S]*?readyForAutoRepair: boolean[\s\S]*?sourceBindingOnlyNoticeVisible: boolean[\s\S]*?noRawPromptOrAnswer: boolean[\s\S]*?providerQualityClaim: boolean[\s\S]*?llmFactClaim: boolean/,
  'Public repo UI smoke must define a source-file match release proof without raw source content or LLM-fact overclaims.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /getByLabel\('来源文件匹配说明'\)\.last\(\)[\s\S]*?修复候选放行条件[\s\S]*?满足修复候选放行[\s\S]*?已满足：行级锚点[\s\S]*?已满足：主张 PRIMARY 绑定[\s\S]*?不证明 LLM 事实语义正确[\s\S]*?sourceFileMatchRelease:\s*\{[\s\S]*?surface:\s*'PROJECT_QA_SOURCE_FILE_MATCH_RELEASE'[\s\S]*?sourceEvidenceMatchTypes[\s\S]*?pathMatchType[\s\S]*?requiredEvidenceCovered[\s\S]*?primaryClaimBound[\s\S]*?nextActionKey[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Public repo UI smoke marker must emit qaFromEvidence.sourceFileMatchRelease proof from the visible source-file match release panel.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /type ClaimCitationNoiseBoundaryProof = \{[\s\S]*?surface: 'PUBLIC_REPO_UI_CLAIM_CITATION_NOISE_BOUNDARY'[\s\S]*?noiseKinds: string\[\][\s\S]*?coverageStatus: string[\s\S]*?claimCitationStatus: string[\s\S]*?roleDistributionStatus: string[\s\S]*?answerCitationsCitedByAnswer: boolean[\s\S]*?trustSummaryReadyVisible: boolean[\s\S]*?repairCandidateActionVisible: boolean[\s\S]*?repairEvidenceGateBlockedVisible: boolean[\s\S]*?rawAnswerStored: boolean[\s\S]*?rawPromptStored: boolean[\s\S]*?providerQualityClaim: boolean[\s\S]*?llmFactClaim: boolean[\s\S]*?llmSetup: LlmConfigProbeState[\s\S]*?llmCleanup: LlmConfigProbeState/,
  'Public repo UI smoke must define a dedicated claim citation noise boundary proof type with UI blocking and raw-content safety fields.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /configureMockLlmConfig\(page, `public-repo-ui-claim-noise-\$\{viewportName\}`\)[\s\S]*?removeMockLlmConfig\(page, llmSetup\)[\s\S]*?expect\(llmCleanup\.status[\s\S]*?toBe\('OK'\)/,
  'Public repo UI claim citation noise smoke must configure MOCK LLM deterministically and clean it up as a hard gate.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /verifyClaimCitationNoiseBoundary\([\s\S]*?detectClaimCitationNoiseKinds\(answer\)[\s\S]*?toEqual\(\['exception-line', 'fenced-code', 'inline-code', 'timestamp-log'\]\)[\s\S]*?citationEnforcementStatus[\s\S]*?toBe\('RETRY_FAILED'\)[\s\S]*?coverage must remain NONE[\s\S]*?claim coverage must remain REVIEW[\s\S]*?role distribution must remain REVIEW_UNCITED/,
  'Public repo UI claim citation noise smoke must prove fake code/log/exception citation markers stay REVIEW/BLOCKED instead of verified.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /const latestTrustSummary = page\.getByLabel\('QA 可信度摘要'\)\.last\(\)[\s\S]*?const latestRepairGate = page\.getByLabel\('修复证据门禁'\)\.last\(\)[\s\S]*?const latestActionRail = page\.getByLabel\('QA 下一步动作'\)\.last\(\)[\s\S]*?不可直接采信[\s\S]*?not\.toContainText\('可采信并进入修复复核'\)[\s\S]*?toContainText\('BLOCKED'\)[\s\S]*?已阻断[\s\S]*?latestActionRail\.getByRole\('button', \{ name: '生成修复候选' \}\)[\s\S]*?toBe\(0\)/,
  'Public repo UI claim citation noise smoke must verify the actual visible blocked UI state and hidden AutoRepair action.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /claimCitationNoiseBoundaryProofs\.length[\s\S]*?toBe\(viewportMatrix\.length\)[\s\S]*?claimCitationNoiseBoundary:\s*\{[\s\S]*?surface:\s*'PUBLIC_REPO_UI_CLAIM_CITATION_NOISE_BOUNDARY'[\s\S]*?coverageStatus:\s*'NONE'[\s\S]*?claimCitationStatus:\s*'REVIEW'[\s\S]*?roleDistributionStatus:\s*'REVIEW_UNCITED'[\s\S]*?answerCitationsCitedByAnswer[\s\S]*?trustSummaryReadyVisible[\s\S]*?repairCandidateActionVisible[\s\S]*?repairEvidenceGateBlockedVisible[\s\S]*?rawAnswerStored:\s*false[\s\S]*?rawPromptStored:\s*false[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Public repo UI smoke marker must aggregate claimCitationNoiseBoundary proof for every viewport without raw answer/prompt or overclaims.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /type FileAnchorDriftProof[\s\S]*?PUBLIC_REPO_UI_FILE_ANCHOR_DRIFT[\s\S]*?async function verifyFileAnchorDrift[\s\S]*?evidenceLine = '999999999'[\s\S]*?REPORT_FILE_ANCHOR[\s\S]*?CONTEXT_ONLY[\s\S]*?fileAnchorDriftProofs\.length[\s\S]*?toBe\(viewportMatrix\.length\)[\s\S]*?fileAnchorDrift:\s*\{[\s\S]*?surface:\s*'PUBLIC_REPO_UI_FILE_ANCHOR_DRIFT'[\s\S]*?sourceEvidenceMatchTypes[\s\S]*?citationCoverage[\s\S]*?maxPrimaryEvidenceCount[\s\S]*?maxRepairCandidateCount[\s\S]*?claimCitationCoverage[\s\S]*?maxRequiredPrimaryBoundClaimCount[\s\S]*?latestNextActionRepairHidden[\s\S]*?latestCitationRepairHidden[\s\S]*?rawAnswerStored:\s*false[\s\S]*?rawPromptStored:\s*false/,
  'Public repo UI smoke marker must aggregate real file-anchor drift proof for every viewport without raw answer/prompt or repair overclaims.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /type SourceLocationReadabilityProof[\s\S]*?surface: 'PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY'[\s\S]*?mode: 'ready' \| 'review'[\s\S]*?sourceReceiptContained: boolean[\s\S]*?sourceLocationConfidenceMetricsNotClipped: boolean[\s\S]*?sourceFileMatchChecksNotClipped: boolean[\s\S]*?repairActionHiddenWhenReview: boolean[\s\S]*?async function assertSourceLocationReadability\([\s\S]*?expectContainedInViewport\(sourceReceipt[\s\S]*?expectLocatorCanWrap\(sourceLocationConfidence[\s\S]*?expectContainedInViewport\(sourceFileMatchRelease[\s\S]*?expectNoHorizontalOverflow\(page, `\$\{viewportName\}:\$\{mode\}:source-location-readability`\)[\s\S]*?surface: 'PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY'/,
  'Public repo UI smoke must define source-location readability proof helpers for receipt, confidence, release panel and horizontal overflow.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /const sourceLocationReadabilityProofs = \[[\s\S]*?qaFromEvidenceProofs\.map\(proof => proof\.sourceLocationReadability\)[\s\S]*?fileAnchorDriftProofs\.map\(proof => proof\.sourceLocationReadability\)[\s\S]*?sourceLocationReadabilityProofs\.length[\s\S]*?toBe\(viewportMatrix\.length \* 2\)[\s\S]*?readySourceLocationReadabilityProofs[\s\S]*?reviewSourceLocationReadabilityProofs[\s\S]*?providerQualityClaim[\s\S]*?llmFactClaim[\s\S]*?noHorizontalOverflow/,
  'Public repo UI smoke must aggregate source-location readability proofs for ready and review states across all viewports.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /qaFromEvidence:\s*\{[\s\S]*?sourceLocationReadability:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?surface:\s*'PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY'[\s\S]*?proofCount:\s*sourceLocationReadabilityProofs\.length[\s\S]*?mobile390Covered:\s*sourceLocationReadabilityProofs\.some[\s\S]*?narrow320Covered:\s*sourceLocationReadabilityProofs\.some[\s\S]*?sourceReceipt:\s*\{[\s\S]*?readyContained[\s\S]*?reviewContained[\s\S]*?referenceWraps[\s\S]*?titleNotClipped[\s\S]*?tagsNotClipped[\s\S]*?sourceLocationConfidence:\s*\{[\s\S]*?readyContained[\s\S]*?reviewContained[\s\S]*?metricsNotClipped[\s\S]*?checksWrap[\s\S]*?sourceFileMatchRelease:\s*\{[\s\S]*?readyContained[\s\S]*?reviewContained[\s\S]*?targetReferenceNotClipped[\s\S]*?citedReferenceNotClipped[\s\S]*?checksNotClipped[\s\S]*?noRepairOnReview[\s\S]*?noHorizontalOverflow[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Public repo UI smoke marker must emit qaFromEvidence.sourceLocationReadability with containment, wrapping and no-overclaim fields.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /type RelationAwareEvidenceReasonProof = \{[\s\S]*?surface: 'PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON'[\s\S]*?marker: 'Graph relation:'[\s\S]*?citationReasonCount: number[\s\S]*?retrievedChunkReasonCount: number[\s\S]*?adjacentContextReasonVisible: boolean[\s\S]*?citedPrimaryStillPresent: boolean[\s\S]*?uiReasonVisible: boolean[\s\S]*?providerQualityClaim: false[\s\S]*?llmFactClaim: false[\s\S]*?graphRelationCitations[\s\S]*?graphRelationChunks[\s\S]*?page\.getByText\('Graph relation:'\)\.first\(\)/,
  'Public repo UI smoke must derive relation-aware evidence reason from real Graph relation citations/chunks and assert UI visibility.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /relationAwareEvidenceReasonProofs\.length === 0 \|\| relationAwareEvidenceReasonProofs\.length === viewportMatrix\.length[\s\S]*?relationAwareEvidenceReason:\s*\{[\s\S]*?surface:\s*'PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON'[\s\S]*?marker:\s*'Graph relation:'[\s\S]*?proofCount:\s*relationAwareEvidenceReasonProofs\.length[\s\S]*?minCitationReasonCount[\s\S]*?minRetrievedChunkReasonCount[\s\S]*?adjacentContextReasonVisible[\s\S]*?citedPrimaryStillPresent[\s\S]*?uiReasonVisible[\s\S]*?providerQualityClaim:\s*false[\s\S]*?llmFactClaim:\s*false/,
  'Public repo UI marker must emit optional-present strict relation-aware evidence reason proof when real graph relation evidence exists.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /function assertQaEvidenceHandoff\(value, label, expectedScanTaskId\)[\s\S]*?PROJECT_QA_REPORT_EVIDENCE_HANDOFF[\s\S]*?sourceEvidenceMatchTypes[\s\S]*?REPORT_LINE_ANCHOR[\s\S]*?PROJECT_QA_VERIFIED_CITATION[\s\S]*?candidateFormOpened === true[\s\S]*?providerQualityClaim === false[\s\S]*?Object\.prototype\.hasOwnProperty\.call\(qaFromEvidence, "evidenceHandoff"\)[\s\S]*?assertQaEvidenceHandoff\(qaFromEvidence\.evidenceHandoff/,
  'Release evidence verifier must strictly validate optional qaFromEvidence.evidenceHandoff markers when present.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /function assertSourceFileMatchRelease\(value, label, expectedScanTaskId, qaFromEvidence\)[\s\S]*?PROJECT_QA_SOURCE_FILE_MATCH_RELEASE[\s\S]*?sourceEvidenceMatchTypes[\s\S]*?REPORT_LINE_ANCHOR[\s\S]*?pathMatchType === "PATH_SUFFIX"[\s\S]*?requiredEvidenceCovered === true[\s\S]*?primaryClaimBound === true[\s\S]*?readyForAutoRepair === true[\s\S]*?providerQualityClaim === false[\s\S]*?llmFactClaim === false[\s\S]*?Object\.prototype\.hasOwnProperty\.call\(qaFromEvidence, "sourceFileMatchRelease"\)[\s\S]*?assertSourceFileMatchRelease\(qaFromEvidence\.sourceFileMatchRelease/,
  'Release evidence verifier must strictly validate optional qaFromEvidence.sourceFileMatchRelease markers when present.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /function assertPublicRepoUiFileAnchorDrift\(value, label, expectedScanTaskId\)[\s\S]*?PUBLIC_REPO_UI_FILE_ANCHOR_DRIFT[\s\S]*?sourceEvidenceMatchTypes[\s\S]*?REPORT_FILE_ANCHOR[\s\S]*?groundingStatuses[\s\S]*?PARTIAL[\s\S]*?citationEnforcementStatuses[\s\S]*?RETRY_FAILED[\s\S]*?maxPrimaryEvidenceCount[\s\S]*?maxRepairCandidateCount[\s\S]*?claimCitationCoverage[\s\S]*?statuses, \["READY"\][\s\S]*?latestNextActionRepairHidden[\s\S]*?llmCleanup\.status must be OK[\s\S]*?assertPublicRepoUiFileAnchorDrift\(qaFromEvidence\.fileAnchorDrift/,
  'Release evidence verifier must strictly validate required public repo UI qaFromEvidence.fileAnchorDrift markers.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /function assertPublicRepoUiSourceLocationReadability\(value, label, qaFromEvidence\)[\s\S]*?PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY[\s\S]*?proofCount[\s\S]*?mobile390Covered[\s\S]*?narrow320Covered[\s\S]*?sourceReceipt[\s\S]*?referenceWraps[\s\S]*?sourceLocationConfidence[\s\S]*?metricsNotClipped[\s\S]*?checksWrap[\s\S]*?sourceFileMatchRelease[\s\S]*?targetReferenceNotClipped[\s\S]*?noRepairOnReview[\s\S]*?providerQualityClaim[\s\S]*?llmFactClaim[\s\S]*?REPORT_LINE_ANCHOR[\s\S]*?REPORT_FILE_ANCHOR[\s\S]*?Object\.prototype\.hasOwnProperty\.call\(qaFromEvidence, "sourceLocationReadability"\)[\s\S]*?assertPublicRepoUiSourceLocationReadability\(qaFromEvidence\.sourceLocationReadability/,
  'Release evidence verifier must strictly validate optional public repo UI source-location readability markers when present.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /function assertPublicRepoUiRelationAwareEvidenceReason\(value, label\)[\s\S]*?PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON[\s\S]*?Graph relation:[\s\S]*?minCitationReasonCount[\s\S]*?minRetrievedChunkReasonCount[\s\S]*?must prove Graph relation from citations or retrieved chunks[\s\S]*?adjacentContextReasonVisible[\s\S]*?citedPrimaryStillPresent[\s\S]*?uiReasonVisible[\s\S]*?providerQualityClaim[\s\S]*?llmFactClaim[\s\S]*?Object\.prototype\.hasOwnProperty\.call\(qaFromEvidence, "relationAwareEvidenceReason"\)[\s\S]*?assertPublicRepoUiRelationAwareEvidenceReason\(qaFromEvidence\.relationAwareEvidenceReason/,
  'Release verifier must strictly validate public repo UI relation-aware evidence reason when the optional marker is present.'
)
requirePattern(
  securityRegressionScript,
  /evidenceHandoff[\s\S]*?qa-evidence-handoff-status-fail[\s\S]*?qa-evidence-handoff-url-unbound[\s\S]*?qa-evidence-handoff-source-type-manual[\s\S]*?qa-evidence-handoff-form-hidden[\s\S]*?qa-evidence-handoff-raw-answer[\s\S]*?for qa_evidence_handoff_mutation in[\s\S]*?qa-evidence-handoff-array[\s\S]*?qa-evidence-handoff-token-field[\s\S]*?verify_public_repo_ui_marker_rejects "\$qa_evidence_handoff_mutation"/,
  'Security regression must reject forged qaFromEvidence.evidenceHandoff marker fields when the optional marker is present.'
)
requirePattern(
  securityRegressionScript,
  /sourceFileMatchRelease[\s\S]*?source-file-match-release-status-fail[\s\S]*?source-file-match-release-file-anchor[\s\S]*?source-file-match-release-filename-only[\s\S]*?source-file-match-release-primary-unbound[\s\S]*?source-file-match-release-raw-answer[\s\S]*?for source_file_match_release_mutation in[\s\S]*?source-file-match-release-array[\s\S]*?source-file-match-release-token-field[\s\S]*?verify_public_repo_ui_marker_rejects "\$source_file_match_release_mutation"/,
  'Security regression must reject forged qaFromEvidence.sourceFileMatchRelease marker fields when the optional marker is present.'
)
requirePattern(
  securityRegressionScript,
  /fileAnchorDrift[\s\S]*?readyForRepair:\s*false[\s\S]*?readinessReasons:\s*\["CONTEXT_ONLY_CLAIM"\]/,
  'Security regression valid public repo UI fileAnchorDrift fixture must mark claim citations as context-only and not repair-ready.'
)
requirePattern(
  securityRegressionScript,
  /for qa_file_anchor_mutation in[\s\S]*?qa-from-evidence-file-anchor-missing[\s\S]*?qa-from-evidence-file-anchor-grounding-verified[\s\S]*?qa-from-evidence-file-anchor-enforcement-direct[\s\S]*?qa-from-evidence-file-anchor-line-anchor-forged[\s\S]*?qa-from-evidence-file-anchor-coverage-primary-forged[\s\S]*?qa-from-evidence-file-anchor-repair-candidate-forged[\s\S]*?qa-from-evidence-file-anchor-repair-action-visible[\s\S]*?verify_public_repo_ui_marker_rejects "\$qa_file_anchor_mutation"/,
  'Security regression must reject forged public repo UI fileAnchorDrift marker fields.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /fileAnchorDrift:\s*\{[\s\S]*?claimCitationCoverage:\s*\{[\s\S]*?statuses:[\s\S]*?readyForRepair:\s*fileAnchorDriftProofs\.every\(proof => proof\.claimCitationCoverage\.readyForRepair\)[\s\S]*?readinessReasons:\s*Array\.from\(new Set\(fileAnchorDriftProofs\.flatMap\(proof => proof\.claimCitationCoverage\.readinessReasons\)\)\)\.sort\(\)/,
  'Public repo UI smoke marker must emit file-anchor drift claim readiness as context-only and not repair-ready.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /file-anchor drift claim citations must expose the context-only readiness reason[\s\S]*?CONTEXT_ONLY_CLAIM/,
  'Public repo UI smoke must assert file-anchor drift claim readiness reason is CONTEXT_ONLY_CLAIM before marker aggregation.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /claimCoverage\.readyForRepair === false[\s\S]*?CONTEXT_ONLY_CLAIM[\s\S]*?readinessReasons must contain only CONTEXT_ONLY_CLAIM/,
  'Release verifier must keep file-anchor drift claim citation readiness blocked as CONTEXT_ONLY_CLAIM.'
)
requirePattern(
  securityRegressionScript,
  /qa-from-evidence-claim-ready-for-repair-missing[\s\S]*?qa-from-evidence-claim-ready-for-repair-false[\s\S]*?qa-from-evidence-claim-readiness-reason-context/,
  'Security regression must dynamically reject claim citation readiness forgeries.'
)
requirePattern(
  securityRegressionScript,
  /sourceLocationReadability[\s\S]*?PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY[\s\S]*?source-location-readability-status-fail[\s\S]*?source-location-readability-proof-count-low[\s\S]*?source-location-readability-mobile-missing[\s\S]*?source-location-readability-narrow-missing[\s\S]*?source-location-readability-ready-uncontained[\s\S]*?source-location-readability-review-uncontained[\s\S]*?source-location-readability-metrics-clipped[\s\S]*?source-location-readability-checks-nowrap[\s\S]*?source-location-readability-target-clipped[\s\S]*?source-location-readability-repair-review-forged[\s\S]*?source-location-readability-provider-claim[\s\S]*?source-location-readability-llm-fact-claim[\s\S]*?for source_location_readability_mutation in[\s\S]*?verify_public_repo_ui_marker_rejects "\$source_location_readability_mutation"/,
  'Security regression must reject forged public repo UI source-location readability marker fields when the optional marker is present.'
)
requirePattern(
  securityRegressionScript,
  /relationAwareEvidenceReason[\s\S]*?PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON[\s\S]*?qa-relation-aware-array[\s\S]*?qa-relation-aware-status-fail[\s\S]*?qa-relation-aware-surface-mismatch[\s\S]*?qa-relation-aware-marker-forged[\s\S]*?qa-relation-aware-proof-count-zero[\s\S]*?qa-relation-aware-citation-and-chunk-zero[\s\S]*?qa-relation-aware-adjacent-hidden[\s\S]*?qa-relation-aware-primary-missing[\s\S]*?qa-relation-aware-ui-hidden[\s\S]*?qa-relation-aware-provider-claim[\s\S]*?qa-relation-aware-llm-fact-claim[\s\S]*?qa-relation-aware-raw-answer[\s\S]*?for relation_aware_evidence_reason_mutation in[\s\S]*?verify_public_repo_ui_marker_rejects "\$relation_aware_evidence_reason_mutation"/,
  'Security regression must reject forged public repo UI relation-aware evidence reason markers.'
)
requirePattern(
  releaseEvidenceVerifierScript,
  /uiClaimCitationNoiseBoundary = qaFromEvidence\.claimCitationNoiseBoundary[\s\S]*?PUBLIC_REPO_UI_CLAIM_CITATION_NOISE_BOUNDARY[\s\S]*?groundingStatuses must not claim VERIFIED[\s\S]*?claimCitationNoiseBoundary\.claimCitationStatus must be REVIEW[\s\S]*?repairCandidateActionVisible must be false[\s\S]*?repairEvidenceGateBlockedVisible must be true[\s\S]*?claimCitationNoiseBoundary must not contain \$\{field\}[\s\S]*?llmSetup\.status must be OK[\s\S]*?llmCleanup\.status must be OK/,
  'Release evidence verifier must strictly validate public repo UI claimCitationNoiseBoundary markers.'
)
requirePattern(
  securityRegressionScript,
  /claimCitationNoiseBoundary[\s\S]*?qa-from-evidence-claim-noise-ready-forged[\s\S]*?qa-from-evidence-claim-noise-verified-forged[\s\S]*?qa-from-evidence-claim-noise-answer-cited-forged[\s\S]*?qa-from-evidence-claim-noise-repair-visible[\s\S]*?qa-from-evidence-claim-noise-raw-answer[\s\S]*?qa-from-evidence-claim-noise-cleanup-warn[\s\S]*?for qa_claim_noise_mutation in[\s\S]*?verify_public_repo_ui_marker_rejects "\$qa_claim_noise_mutation"/,
  'Security regression must reject forged public repo UI claimCitationNoiseBoundary marker fields when present.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /pages:\s*\[[\s\S]*?'Scan Governance Timeline'[\s\S]*?\][\s\S]*?governanceTimeline:\s*\{[\s\S]*?status:\s*'OK'[\s\S]*?aggregateApiCalled:\s*true[\s\S]*?endpoint:\s*`\/api\/projects\/\$\{projectId\}\/scan-tasks\/\$\{scanTaskId\}\/governance-timeline`[\s\S]*?responseStatus:\s*200[\s\S]*?visible:\s*true[\s\S]*?projectId[\s\S]*?repositoryId[\s\S]*?scanTaskId[\s\S]*?scanStatus:\s*'SUCCESS'[\s\S]*?summaryStatus[\s\S]*?hasErrors[\s\S]*?attributionGapCount[\s\S]*?counts[\s\S]*?hasSummary:\s*true[\s\S]*?hasResources:\s*true[\s\S]*?hasLimits:\s*true[\s\S]*?resourceArrays:\s*governanceResourceArrays[\s\S]*?eventCount:\s*minGovernanceEventCount[\s\S]*?resourcesBound:\s*true[\s\S]*?derivedAuditResourceTypes[\s\S]*?derivedArtifactOwnerTypes[\s\S]*?derivedArtifactTypes[\s\S]*?derivedGovernanceVisible[\s\S]*?patchEvidence:\s*\{[\s\S]*?repairVisible[\s\S]*?scanTaskIdBound[\s\S]*?patchArtifactVisible[\s\S]*?patchReadyAuditVisible[\s\S]*?repairExecutionVisible[\s\S]*?patchGenerationStepVisible[\s\S]*?foreignPatchEvidenceHidden/,
  'Public repo UI smoke marker must include live scan governance timeline, derived governance, and patch evidence proof fields.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /type GovernanceAgentReviewProof = \{[\s\S]*?agentTaskVisible: boolean[\s\S]*?agentTaskId: number[\s\S]*?agentTaskStatus: string[\s\S]*?scanTaskIdBound: boolean[\s\S]*?agentReportArtifactVisible: boolean[\s\S]*?agentReportOwnerType: string[\s\S]*?agentReportOwnerId: number[\s\S]*?agentReportArtifactType: string[\s\S]*?agentAuditVisible: boolean[\s\S]*?agentAuditAction: string[\s\S]*?agentAuditSourceBound: boolean[\s\S]*?agentExecutionVisible: boolean[\s\S]*?agentExecutionSourceType: string[\s\S]*?agentExecutionSourceId: number[\s\S]*?agentExecutionStepKey: string[\s\S]*?foreignAgentEvidenceHidden: boolean[\s\S]*?noRawPromptOrAnswer: boolean/,
  'Public repo UI smoke marker must include live Agent review owner, audit, execution and raw prompt/answer safety proof fields.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /agentReview:\s*\{[\s\S]*?\.\.\.agentReviewProof[\s\S]*?agentTaskVisible: governanceTimelineProofs\.every\(proof => proof\.agentReview\.agentTaskVisible\)[\s\S]*?scanTaskIdBound: governanceTimelineProofs\.every\(proof => proof\.agentReview\.scanTaskIdBound\)[\s\S]*?agentReportArtifactVisible: governanceTimelineProofs\.every\(proof => proof\.agentReview\.agentReportArtifactVisible\)[\s\S]*?agentAuditVisible: governanceTimelineProofs\.every\(proof => proof\.agentReview\.agentAuditVisible\)[\s\S]*?agentExecutionVisible: governanceTimelineProofs\.every\(proof => proof\.agentReview\.agentExecutionVisible\)[\s\S]*?foreignAgentEvidenceHidden: governanceTimelineProofs\.every\(proof => proof\.agentReview\.foreignAgentEvidenceHidden\)[\s\S]*?noRawPromptOrAnswer: governanceTimelineProofs\.every\(proof => proof\.agentReview\.noRawPromptOrAnswer\)/,
  'Public repo UI smoke marker must aggregate Agent review evidence across every live viewport.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /if \(expectDerivedGovernance\) \{[\s\S]*?derivedAuditResourceTypes[\s\S]*?AUTO_REPAIR[\s\S]*?AGENT_TASK[\s\S]*?derivedArtifactTypes[\s\S]*?CHANGE_PATCH[\s\S]*?AGENT_REPORT[\s\S]*?patchEvidence\.repairVisible[\s\S]*?patchEvidence\.patchArtifactOwnerId[\s\S]*?patchEvidence\.patchReadyAuditAction[\s\S]*?patchEvidence\.repairExecutionSourceId[\s\S]*?patchEvidence\.patchGenerationStepKey[\s\S]*?patchEvidence\.foreignPatchEvidenceHidden[\s\S]*?agentReview\.agentTaskVisible[\s\S]*?agentReview\.agentReportOwnerId[\s\S]*?agentReview\.agentAuditAction[\s\S]*?agentReview\.agentExecutionSourceId[\s\S]*?agentReview\.agentExecutionStepKey[\s\S]*?agentReview\.foreignAgentEvidenceHidden[\s\S]*?agentReview\.noRawPromptOrAnswer/,
  'Public repo UI smoke must be able to require derived AutoRepair, AgentTask, patch evidence and Agent review evidence visibility.'
)
requirePattern(
  publicRepoUiSmokeSpec,
  /PUBLIC_REPO_UI_SMOKE_OK/,
  'Public repo UI smoke must emit PUBLIC_REPO_UI_SMOKE_OK marker for evidence logs.'
)
requirePattern(
  ciDiagnostics,
  /interface CiGovernanceStep[\s\S]*?key:\s*'log-intake' \| 'root-cause-evidence' \| 'repair-gate' \| 'autorepair-handoff'[\s\S]*?const governanceLoopSteps = useMemo<CiGovernanceStep\[\]>\(\(\) => \[[\s\S]*?<CiGovernanceLoop steps=\{governanceLoopSteps\} \/>[\s\S]*?function CiGovernanceLoop[\s\S]*?aria-label="CI 失败诊断治理闭环"[\s\S]*?data-sl-ci-governance-step=\{step\.key\}/,
  'CiDiagnostics must render a page-level log intake, root-cause evidence, repair gate and AutoRepair handoff governance loop.'
)
requirePattern(
  ciDiagnostics,
  /页面展示脱敏不代表原始日志可以直接外发[\s\S]*?诊断完成不代表根因正确或 LLM 输出事实正确[\s\S]*?不得把诊断建议直接视为已验证修复/,
  'CiDiagnostics governance loop must preserve display-redaction and diagnosis/repair correctness claim boundaries.'
)
requirePattern(
  css,
  /\.sl-ci-governance-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s,
  'CI diagnostics governance loop must use a stable four-column desktop grid.'
)
requirePattern(
  css,
  /@media \(max-width: 1200px\)[\s\S]*?\.sl-ci-summary-grid,\s*\.sl-ci-governance-grid,[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  'CI diagnostics governance loop must collapse to two columns below 1200px.'
)
requirePattern(
  css,
  /@media \(max-width: 720px\)[\s\S]*?\.sl-ci-summary-grid,\s*\.sl-ci-governance-grid,[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\.sl-ci-governance-step \.ant-btn\s*\{[\s\S]*?width:\s*100%;[\s\S]*?justify-content:\s*center;/s,
  'CI diagnostics governance loop must collapse to one column with a full-width handoff action on mobile.'
)
requirePattern(
  css,
  /\.sl-ci-governance-meta span,\s*\.sl-ci-governance-meta strong,\s*\.sl-ci-governance-copy h3,\s*\.sl-ci-governance-copy p\s*\{[^}]*overflow:\s*visible;[^}]*overflow-wrap:\s*anywhere;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;[^}]*word-break:\s*break-word;/s,
  'CI diagnostics governance loop labels, statuses and evidence details must wrap without clipping.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /type CiGovernanceLoopProof[\s\S]*?assertCiGovernanceLoop[\s\S]*?getByRole\('region', \{ name: 'CI 失败诊断治理闭环' \}\)[\s\S]*?log-intake[\s\S]*?root-cause-evidence[\s\S]*?repair-gate[\s\S]*?autorepair-handoff[\s\S]*?CI_DIAGNOSTICS_FAILURE_GOVERNANCE_LOOP_READABILITY/,
  'CI diagnostics detail-selection smoke must prove the four-stage governance loop is visible and readable.'
)
requirePattern(
  ciDiagnosticsDetailSelectionSmokeSpec,
  /viewportMatrix[\s\S]*?name:\s*'tablet',\s*width:\s*1024,\s*height:\s*768[\s\S]*?name:\s*'mobile',\s*width:\s*390,\s*height:\s*844[\s\S]*?expectedColumns = viewport\.width <= 720 \? 1 : viewport\.width <= 1200 \? 2 : 4[\s\S]*?tabletColumns:[\s\S]*?mobileColumns:[\s\S]*?fullRepairQualityClaim:[\s\S]*?llmFactClaim:/,
  'CI diagnostics smoke must cover desktop, tablet, mobile and narrow governance-loop breakpoints and overclaim markers.'
)
requirePattern(
  autoRepairs,
  /interface AutoRepairGovernanceStep[\s\S]*?key:\s*'candidate-source' \| 'patch-generation' \| 'review-gate' \| 'pr-exit'[\s\S]*?const governanceLoopSteps = useMemo<AutoRepairGovernanceStep\[\]>[\s\S]*?<AutoRepairGovernanceLoop steps=\{governanceLoopSteps\} \/>[\s\S]*?function AutoRepairGovernanceLoop[\s\S]*?aria-label="自动修复候选治理闭环"[\s\S]*?data-sl-autorepair-governance-step=\{step\.key\}/,
  'AutoRepairs must render a page-level candidate source, patch generation, review gate and PR exit governance loop.'
)
requirePattern(
  autoRepairs,
  /不证明补丁正确[\s\S]*?不等同于代码质量或业务正确性证明[\s\S]*?避免把“已生成 patch”误读成“已验证修复”/,
  'AutoRepairs governance loop must explicitly avoid overclaiming patch correctness.'
)
requirePattern(
  css,
  /\.sl-autorepair-governance-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s,
  'AutoRepair governance loop must use a stable four-column desktop grid.'
)
requirePattern(
  css,
  /@media \(max-width: 1200px\)[\s\S]*?\.sl-autorepair-summary-grid,\s*[\s\S]*?\.sl-autorepair-governance-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  'AutoRepair governance loop must collapse to two columns below 1200px.'
)
requirePattern(
  css,
  /@media \(max-width: 720px\)[\s\S]*?\.sl-autorepair-summary-grid,\s*[\s\S]*?\.sl-autorepair-governance-grid,[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\.sl-autorepair-governance-step \.ant-btn\s*\{[\s\S]*?width:\s*100%;[\s\S]*?justify-content:\s*center;/s,
  'AutoRepair governance loop must collapse to one column with full-width actions on mobile.'
)
requirePattern(
  css,
  /\.sl-autorepair-governance-copy span,\s*[\s\S]*?\.sl-autorepair-governance-copy strong\s*\{[^}]*overflow:\s*visible;[^}]*overflow-wrap:\s*anywhere;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;[^}]*word-break:\s*break-word;/s,
  'AutoRepair governance loop copy must wrap critical statuses without ellipsis or hidden overflow.'
)
requirePattern(
  patchReadySmokeSpec,
  /type AutoRepairGovernanceLoopProof[\s\S]*?assertAutoRepairGovernanceLoop[\s\S]*?getByRole\('region', \{ name: '自动修复候选治理闭环' \}\)[\s\S]*?candidate-source[\s\S]*?patch-generation[\s\S]*?review-gate[\s\S]*?pr-exit[\s\S]*?fullRepairQualityClaim[\s\S]*?llmFactClaim[\s\S]*?AUTOREPAIRS_GOVERNANCE_LOOP_READABILITY/,
  'PATCH_READY smoke must prove the AutoRepair governance loop is visible, readable and does not overclaim repair or LLM correctness.'
)
requirePattern(
  patchReadySmokeSpec,
  /viewportMatrix[\s\S]*?name:\s*'tablet',\s*width:\s*1024,\s*height:\s*768[\s\S]*?expectedGovernanceColumns = viewport\.width <= 720 \? 1 : viewport\.width <= 1200 \? 2 : 4[\s\S]*?tabletColumns:[\s\S]*?twoColumnBreakpoint:/,
  'PATCH_READY smoke must cover and record the AutoRepair governance loop two-column tablet breakpoint.'
)
requirePattern(
  patchReadySmokeSpec,
  /sourceBridge[\s\S]*?getByRole\('region', \{ name: '来源扫描闭环' \}\)[\s\S]*?getByText\(`Scan #\$\{scanTaskId\}`\)[\s\S]*?getByRole\('button', \{ name: '打开报告' \}\)[\s\S]*?data-sl-target-url[\s\S]*?QA 复核此文件[\s\S]*?创建 Agent 复核[\s\S]*?扫描审计/,
  'PATCH_READY browser smoke must assert the source scan bridge and its report, QA, Agent and audit actions are visible and bound.'
)
requirePattern(
  patchReadySmokeSpec,
  /qaUrl\.searchParams\.get\('tab'\)\)\.toBe\('qa'\)[\s\S]*?qaUrl\.searchParams\.get\('scanTaskId'\)\)\.toBe\(String\(scanTaskId\)\)[\s\S]*?agentUrl\.searchParams\.get\('openCreate'\)\)\.toBe\('1'\)[\s\S]*?auditUrl\.searchParams\.get\('resourceType'\)\)\.toBe\('AUTO_REPAIR'\)/,
  'PATCH_READY browser smoke must verify source bridge deep-link query parameters.'
)
requirePattern(
  patchReadySmokeSpec,
  /verifyBlockedPatchReadyGate[\s\S]*?getByRole\('region', \{ name: '来源扫描闭环' \}\)[\s\S]*?未绑定扫描来源[\s\S]*?PR 门禁不把 scanTask 作为硬阻塞[\s\S]*?getByRole\('button', \{ name: '打开报告' \}\)\)\.toHaveCount\(0\)/,
  'PATCH_READY browser smoke must prove manual AutoRepair candidates do not expose fake scan actions.'
)
requirePattern(
  patchReadySmokeSpec,
  /getByText\('Mock LLM response'\)/,
  'PATCH_READY browser smoke must assert the generated diff content is visible.'
)
requirePattern(
  patchReadySmokeSpec,
  /getByRole\('button', \{ name: `查看 AUTO_REPAIR #\$\{repairId\} 产物` \}\)/,
  'PATCH_READY browser smoke must assert the patch artifact action is bound to the selected AutoRepair.'
)
requirePattern(
  patchReadySmokeSpec,
  /expectPrimaryButtonWhiteText[\s\S]*?webkitTextFillColor[\s\S]*?rgb\(255,\s*255,\s*255\)/,
  'PATCH_READY browser smoke must assert primary button text and text-fill remain white.'
)
requirePattern(
  patchReadySmokeSpec,
  /getByRole\('region', \{ name: 'PATCH_READY 补丁审查闭环' \}\)[\s\S]*?Patch review checklist[\s\S]*?Diff 已生成[\s\S]*?CHANGE_PATCH 已归档[\s\S]*?longPatchEvidenceSummary[\s\S]*?AUTO_REPAIR_PATCH_READY SUCCESS[\s\S]*?打开审计/,
  'PATCH_READY browser smoke must assert the visible patch review checklist and audit action.'
)
requirePattern(
  patchReadySmokeSpec,
  /targetRow[\s\S]*?getByRole\('button', \{ name: `查看自动修复任务 #\$\{repairId\} 详情` \}\)[\s\S]*?toHaveAttribute\('aria-selected', 'true'\)[\s\S]*?detailAction\.click\(\)[\s\S]*?targetRow\.focus\(\)[\s\S]*?keyboard\.press\('Enter'\)/,
  'PATCH_READY browser smoke must prove explicit detail action, aria-selected state and keyboard row opening.'
)
requirePattern(
  patchReadySmokeSpec,
  /verifyBlockedPatchReadyGate[\s\S]*?缺少可审查 diff[\s\S]*?缺少 patch artifact[\s\S]*?缺少 generate_patch SUCCESS patch evidence[\s\S]*?缺少 AUTO_REPAIR_PATCH_READY SUCCESS[\s\S]*?toBeDisabled\(\)[\s\S]*?getSubmitPrCount\(\)[\s\S]*?toBe\(0\)/,
  'PATCH_READY browser smoke must prove missing hard evidence disables create PR and never calls submit-pr.'
)
requirePattern(
  patchReadySmokeSpec,
  /创建受控 Pull Request？[\s\S]*?Diff：[\s\S]*?CHANGE_PATCH 已归档[\s\S]*?longPatchEvidenceSummary[\s\S]*?AUTO_REPAIR_PATCH_READY SUCCESS[\s\S]*?getSubmitPrCount\(\)[\s\S]*?toBe\(0\)[\s\S]*?返回审查[\s\S]*?getSubmitPrCount\(\)[\s\S]*?toBe\(0\)/,
  'PATCH_READY browser smoke must open and cancel PR Popconfirm without calling submit-pr.'
)
requirePattern(
  patchReadySmokeSpec,
  /Patch generation attempt[\s\S]*?PR submission attempt[\s\S]*?第 1 次 · generate_patch[\s\S]*?第 2 次 · create_pull_request[\s\S]*?补丁证据仍可复用/,
  'PATCH_READY browser smoke must assert visible split attempts and reusable patch evidence after PR failure.'
)
requirePattern(
  patchReadySmokeSpec,
  /`"scanTaskId": \$\{scanTaskId\}`[\s\S]*?`"patchArtifactPath": "\$\{patchArtifactPath\}"`/,
  'PATCH_READY browser smoke must assert the audit deep link drawer shows scanTaskId and patchArtifactPath.'
)
requirePattern(
  patchReadySmokeSpec,
  /latestAuditQuery[\s\S]*?resourceType=AUTO_REPAIR[\s\S]*?resourceId=\$\{repairId\}[\s\S]*?action=AUTO_REPAIR_PATCH_READY[\s\S]*?status=SUCCESS/,
  'PATCH_READY browser smoke must assert the audit deep link query is scoped to AUTO_REPAIR_PATCH_READY SUCCESS.'
)
requirePattern(
  patchReadySmokeSpec,
  /getByRole\('button', \{ name: \/打开关联资源\/ \}\)\.click\(\)[\s\S]*?toHaveURL\(new RegExp\(`\/auto-repairs\\\\\?projectId=\$\{projectId\}&repairId=\$\{repairId\}\$`\)\)/,
  'PATCH_READY browser smoke must prove audit associated-resource navigation returns to AutoRepair detail.'
)
requirePattern(
  patchReadySmokeSpec,
  /tableDetailAction:\s*\{[\s\S]*?visible:\s*true[\s\S]*?clickedRepairId:\s*repairId[\s\S]*?detailPanelMatched:\s*true[\s\S]*?keyboardOpen:\s*\{[\s\S]*?enter:\s*true[\s\S]*?space:\s*true[\s\S]*?accessibleSelection:\s*true[\s\S]*?sharedSelectableRow:\s*\{[\s\S]*?ariaControlsLinked:\s*true[\s\S]*?detailRegionLinked:\s*true[\s\S]*?reviewGate:\s*\{[\s\S]*?requiredEvidence:\s*\['diff',\s*'patchArtifact',\s*'patchGenerationStep',\s*'auditEvent'\][\s\S]*?blockingEvidenceSatisfied:\s*true[\s\S]*?missingEvidenceBlocked[\s\S]*?manualCandidateScanTaskWarningOnly:\s*true[\s\S]*?popconfirmSummaryVisible:\s*true[\s\S]*?prConfirmCandidateGate:\s*\{[\s\S]*?sourceType:\s*'PROJECT_QA_VERIFIED_CITATION'[\s\S]*?repairEvidenceGate:\s*'READY'[\s\S]*?repairEvidenceGateSource:\s*'SERVER_DERIVED'[\s\S]*?warningOnlyForPatchReady:\s*true[\s\S]*?attemptSplit:\s*\{[\s\S]*?prExecutionAttemptSplit:\s*true[\s\S]*?attemptIds:\s*\[1,\s*2\][\s\S]*?attemptNos:\s*\[1,\s*2\][\s\S]*?patchAttemptStepKeys:\s*\['prepare_workspace',\s*'generate_patch'\][\s\S]*?prAttemptStepKeys:\s*\['create_branch',\s*'push_branch',\s*'create_pull_request'\][\s\S]*?prFailureDoesNotBlockPatchEvidence:\s*true/,
  'PATCH_READY browser smoke marker must record table detail action, review gate evidence, split attempts and PR-failure-safe patch evidence.'
)
requirePattern(
  scanGovernanceTimelineApi,
  /export const scanGovernanceTimelineApi[\s\S]*?get:\s*\(projectId: number, scanTaskId: number\)[\s\S]*?`\/projects\/\$\{projectId\}\/scan-tasks\/\$\{scanTaskId\}\/governance-timeline`/,
  'Scan governance timeline API client must expose a project/scan scoped aggregate endpoint.'
)
requirePattern(
  scanTaskDetail,
  /import \{ scanGovernanceTimelineApi \} from '\.\.\/api\/scanGovernanceTimeline'[\s\S]*?scanGovernanceTimelineApi\.get\(projectId, scanTaskId\)/,
  'ScanTaskDetail governance timeline must use the backend aggregate governance API.'
)
requirePattern(
  scanTaskDetail,
  /function ReportGovernanceTimeline\([\s\S]*?aria-label="修复治理时间线"[\s\S]*?报告风险[\s\S]*?AutoRepair[\s\S]*?Agent 任务[\s\S]*?执行任务[\s\S]*?产物证据[\s\S]*?审计留痕/,
  'ScanTaskDetail must render an accessible repair governance timeline with the six required governance cards.'
)
requirePattern(
  scanTaskDetail,
  /interface ReportGovernanceStage[\s\S]*?state:\s*'ready' \| 'running' \| 'blocked' \| 'empty'[\s\S]*?function buildReportGovernanceStages\([\s\S]*?风险定位[\s\S]*?修复候选[\s\S]*?Patch 证据[\s\S]*?PR 复核[\s\S]*?审计归档/,
  'ScanTaskDetail must derive a staged repair governance rail from current scan-bound governance data.'
)
requirePattern(
  scanTaskDetail,
  /aria-label="修复治理阶段轨道"[\s\S]*?stages\.map[\s\S]*?sl-report-governance-stage-\$\{stage\.state\}[\s\S]*?stage\.actionLabel/,
  'ScanTaskDetail governance timeline must render the staged rail with state classes and action buttons.'
)
requirePattern(
  scanTaskDetail,
  /ReportEvidenceProfilePanel[\s\S]*?<ReportGovernanceTimeline[\s\S]*?<ReportTraceMap/,
  'ScanTaskDetail governance timeline must sit between ReportEvidenceProfilePanel and ReportTraceMap.'
)
requirePattern(
  scanTaskDetail,
  /key:\s*'governance-timeline'[\s\S]*?label:\s*'治理时间线'/,
  'ScanTaskDetail review gate must include a governance-timeline readiness item.'
)
requirePattern(
  scanTaskDetail,
  /loadGovernance[\s\S]*?scanGovernanceTimelineApi\.get\(projectId, scanTaskId\)[\s\S]*?resources\?\.autoRepairs[\s\S]*?resources\?\.agentTasks[\s\S]*?resources\?\.agentToolCalls[\s\S]*?resources\?\.auditLogs[\s\S]*?resources\?\.artifacts[\s\S]*?resources\?\.repairExecutions/,
  'ScanTaskDetail governance timeline must derive its snapshot, including artifacts, from the aggregate response resources.'
)
rejectPattern(
  scanTaskDetail,
  /autoRepairApi\.list\(projectId, \{ scanTaskId \}\)|agentTaskApi\.listByProject\(projectId, 1, 10, undefined, scanTaskId\)|agentToolCallApi\.listProjectCalls\(projectId, \{ page: 1, pageSize: 10, scanTaskId \}\)|auditApi\.listProjectLogs\(projectId, \{ page: 1, pageSize: 10, resourceType: 'SCAN_TASK', resourceId: scanTaskId \}\)/,
  'ScanTaskDetail governance timeline must not regress to frontend multi-endpoint API fan-out.'
)
requirePattern(
  scanTaskDetail,
  /filter\(repair => Number\(repair\.projectId\) === projectId && Number\(repair\.scanTaskId\) === scanTaskId\)[\s\S]*?filter\(task => Number\(task\.projectId\) === projectId && Number\(task\.scanTaskId\) === scanTaskId\)[\s\S]*?agentTaskIds[\s\S]*?filter\(call => Number\(call\.projectId\) === projectId && Number\(call\.scanTaskId\) === scanTaskId\)[\s\S]*?resourceType === 'SCAN_TASK'[\s\S]*?resourceType === 'AUTO_REPAIR'[\s\S]*?repairIds\.has\(Number\(log\.resourceId\)\)[\s\S]*?resourceType === 'AGENT_TASK'[\s\S]*?agentTaskIds\.has\(Number\(log\.resourceId\)\)[\s\S]*?ownerType === 'SCAN_TASK'[\s\S]*?ownerType === 'AUTO_REPAIR'[\s\S]*?repairIds\.has\(Number\(artifact\.ownerId\)\)[\s\S]*?ownerType === 'AGENT_TASK'[\s\S]*?agentTaskIds\.has\(Number\(artifact\.ownerId\)\)/,
  'ScanTaskDetail governance timeline must defensively exclude foreign scan records while keeping derived AutoRepair/AgentTask audit logs and artifacts.'
)
requirePattern(
  scanTaskDetail,
  /resources\?\.repairExecutions[\s\S]*?repairIds\.has\(sourceId\)[\s\S]*?isOwnedExecutionDetail\(detail, projectId, 'AUTO_REPAIR', sourceId\)[\s\S]*?resources\?\.agentExecutions[\s\S]*?agentTaskIds\.has\(sourceId\)[\s\S]*?isOwnedExecutionDetail\(detail, projectId, 'AGENT_TASK', sourceId\)/,
  'ScanTaskDetail governance timeline must accept only fully owned AutoRepair and Agent execution details.'
)
requirePattern(
  css,
  /\.sl-report-action-board-head[\s\S]*?justify-content:\s*space-between[\s\S]*?\.sl-report-action-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(210px,\s*1fr\)\)\s*;/s,
  'Scan report action board must have a bounded heading and responsive action grid.'
)
requirePattern(
  scanTaskDetail,
  /function ReportActionBoard\([\s\S]*?aria-label="报告后续行动"[\s\S]*?Action Routing[\s\S]*?后续行动分流[\s\S]*?data-action-key=\{item\.key\}[\s\S]*?sl-report-action-buttons/,
  'Scan report action board must expose a stable action-routing region, heading and per-action keys.'
)
requirePattern(
  css,
  /\.sl-report-action-buttons\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*;/s,
  'Scan report action cards must keep a stable two-button layout for open/copy actions.'
)
requirePattern(
  css,
  /\.sl-report-review-gate-grid\s*\{[^}]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)\s*;/s,
  'Scan report review gate must expose the six readiness checks in a stable desktop grid.'
)
requirePattern(
  css,
  /\.sl-report-review-gate-item span\s*\{[^}]*overflow-wrap:\s*anywhere[\s\S]*?\.sl-report-review-gate-item strong\s*\{[^}]*overflow-wrap:\s*anywhere[\s\S]*?\.sl-report-review-gate-item p\s*\{[^}]*overflow-wrap:\s*anywhere/s,
  'Scan report review gate text must wrap instead of clipping on narrow viewports.'
)
requirePattern(
  css,
  /\.sl-report-governance\s*\{[^}]*display:\s*grid;[^}]*min-width:\s*0;[^}]*border:\s*1px solid var\(--sl-border\);/s,
  'Scan report governance timeline must have a bounded responsive container.'
)
requirePattern(
  css,
  /\.sl-report-governance-grid\s*\{[^}]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\);/s,
  'Scan report governance cards must use a stable six-column desktop grid.'
)
requirePattern(
  css,
  /\.sl-report-governance-card p\s*\{[^}]*overflow-wrap:\s*anywhere;/s,
  'Scan report governance cards must wrap long paths and summaries.'
)
requirePattern(
  css,
  /\.sl-report-governance-event\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto;[\s\S]*?\.sl-report-governance-event p\s*\{[^}]*overflow-wrap:\s*anywhere;/s,
  'Scan report governance timeline events must keep actions stable and wrap long text.'
)
requirePattern(
  css,
  /\.sl-report-governance-card span\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*\}[\s\S]*?\.sl-report-governance-card strong\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*\}[\s\S]*?\.sl-report-governance-card p\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Scan report governance cards must wrap labels, values and details without ellipsis or hidden overflow.'
)
requirePattern(
  css,
  /\.sl-report-governance-stage-meta span\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*\}[\s\S]*?\.sl-report-governance-stage-copy p\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Scan report governance stages must wrap labels and reasons without ellipsis or hidden overflow.'
)
requirePattern(
  css,
  /\.sl-report-governance-event strong\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;[^}]*\}[\s\S]*?\.sl-report-governance-event p\s*\{[^}]*overflow:\s*visible\s*;[^}]*overflow-wrap:\s*anywhere\s*;[^}]*text-overflow:\s*clip\s*;[^}]*white-space:\s*normal\s*;[^}]*word-break:\s*break-word\s*;/s,
  'Scan report governance events must wrap title, detail and gate reason without ellipsis or hidden overflow.'
)
rejectPattern(
  css,
  /\.sl-report-governance-(?:card (?:span|strong|p)|stage-meta span|stage-copy p|event (?:strong|p))\s*\{[^}]*text-overflow:\s*ellipsis/s,
  'Scan report governance timeline text must not hide labels, values, reasons or event details behind ellipsis.'
)
rejectPattern(
  css,
  /\.sl-report-governance-(?:card (?:span|strong|p)|stage-meta span|stage-copy p|event (?:strong|p))\s*\{[^}]*white-space:\s*nowrap/s,
  'Scan report governance timeline text must not force labels, values, reasons or event details onto one line.'
)
rejectPattern(
  css,
  /\.sl-report-governance-(?:card (?:span|strong|p)|stage-meta span|stage-copy p|event (?:strong|p))\s*\{[^}]*overflow:\s*hidden/s,
  'Scan report governance timeline text must not clip labels, values, reasons or event details with overflow hidden.'
)
requirePattern(
  css,
  /\.sl-code-knowledge-gate\s*\{[\s\S]*?border:[\s\S]*?\.sl-code-knowledge-gate-ready[\s\S]*?\.sl-code-knowledge-gate-blocked[\s\S]*?\.sl-code-knowledge-gate span,[\s\S]*?\.sl-code-knowledge-gate strong\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?word-break:\s*break-word;/,
  'ScanTaskDetail code knowledge gate reason must have dedicated visible wrapping styles.'
)
requirePattern(
  css,
  /\.sl-code-knowledge-grid span\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;[\s\S]*?\.sl-code-knowledge-grid strong\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?text-overflow:\s*clip;[\s\S]*?white-space:\s*normal;[\s\S]*?word-break:\s*break-word;/,
  'ScanTaskDetail code knowledge grid labels and values must wrap instead of clipping with ellipsis.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /function assertReportGovernanceTimelineReadability\(page: Page, viewportName: string\)[\s\S]*?getByRole\('region', \{ name: '修复治理时间线' \}\)[\s\S]*?sl-report-governance-card[\s\S]*?report-governance-card-labels[\s\S]*?report-governance-card-values[\s\S]*?report-governance-card-details[\s\S]*?getByLabel\('修复治理阶段轨道'\)[\s\S]*?report-governance-stage-labels[\s\S]*?report-governance-stage-reasons[\s\S]*?longGovernanceEventTitle[\s\S]*?longGovernanceEventDetail[\s\S]*?longGovernanceGateReason[\s\S]*?report-governance-event-actions[\s\S]*?expectNoHorizontalOverflow\(page, `\$\{viewportName\}:report-governance-timeline`\)/,
  'Report evidence drawer smoke must verify ScanTaskDetail governance timeline cards, stages, event detail, gate reason and actions remain readable.'
)
requirePattern(
  css,
  /\.sl-report-evidence-chunks\s*\{[^}]*display:\s*grid;[^}]*border:\s*1px solid var\(--sl-border\);/s,
  'Scan report evidence drawer must style the code_chunks summary block.'
)
requirePattern(
  css,
  /\.sl-report-evidence-chunk-card pre\s*\{[^}]*max-height:\s*150px;[^}]*overflow:\s*auto;[^}]*white-space:\s*pre-wrap;[^}]*word-break:\s*break-word;/s,
  'Scan report evidence chunk previews must wrap and scroll instead of overflowing the drawer.'
)
requirePattern(
  scanTaskDetail,
  /import \{ redactSensitiveText,\s*stringifyRedactedPayload \} from '\.\.\/utils\/displayRedaction'/,
  'ScanTaskDetail must use the shared displayRedaction utility for code chunk preview redaction.'
)
requirePattern(
  scanTaskDetail,
  /function redactCodeChunkPreview\(value: string\): string[\s\S]*?return redactSensitiveText\(value\)/s,
  'ScanTaskDetail must redact code chunk preview text before rendering it in the report evidence drawer.'
)
requirePattern(
  scanTaskDetail,
  /const redactedPreview = redactCodeChunkPreview\(item\.contentPreview \|\| item\.content \|\| ''\)[\s\S]*?<pre className="sl-report-evidence-chunk-preview-redacted" aria-label="脱敏 code chunk 预览">[\s\S]*?\{redactedPreview\}[\s\S]*?<\/pre>/s,
  'ScanTaskDetail code chunk cards must render the redacted preview instead of raw contentPreview/content.'
)
rejectPattern(
  scanTaskDetail,
  /<pre>\s*\{item\.contentPreview \|\| item\.content\}\s*<\/pre>/,
  'ScanTaskDetail code chunk cards must not render raw contentPreview/content directly.'
)
requirePattern(
  scanTaskDetail,
  /function ArtifactFallback\([\s\S]*?const data = parseJson\(artifact\.summaryJson\)[\s\S]*?<pre className="sl-code-block sl-artifact-fallback-redacted-raw-json" aria-label="脱敏分析产物 JSON">[\s\S]*?\{stringifyRedactedPayload\(data, 2\)\}[\s\S]*?<\/pre>/s,
  'ScanTaskDetail ArtifactFallback must render parsed summaryJson through shared display redaction.'
)
rejectPattern(
  scanTaskDetail,
  /<pre className="sl-code-block">\s*\{JSON\.stringify\(data,\s*null,\s*2\)\}\s*<\/pre>/,
  'ScanTaskDetail ArtifactFallback must not render raw JSON.stringify(data, null, 2).'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /codeChunkRawSecretSentinel[\s\S]*?codeChunkBearerSecret[\s\S]*?codeChunkApiKeySecret[\s\S]*?codeChunkJwtSecret[\s\S]*?forbiddenCodeChunkSecretSnippets/s,
  'Report evidence drawer smoke must inject raw code chunk preview secret sentinels.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /reportEvidenceSafeMarker[\s\S]*?reportEvidenceRawBearerSecret[\s\S]*?reportEvidenceRawApiKeySecret[\s\S]*?reportEvidenceRawPasswordSecret[\s\S]*?reportEvidenceRawJwtSecret[\s\S]*?forbiddenReportEvidenceSecretSnippets[\s\S]*?evidenceSummary = \[[\s\S]*?Authorization: Bearer \$\{reportEvidenceRawBearerSecret\}[\s\S]*?apiKey=\$\{reportEvidenceRawApiKeySecret\}[\s\S]*?password=\$\{reportEvidenceRawPasswordSecret\}[\s\S]*?jwt=\$\{reportEvidenceRawJwtSecret\}/s,
  'Report evidence drawer smoke must inject raw report evidence metadata secrets into report-derived summary/question material.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function assertReportEvidenceQuestionReferenceRedaction[\s\S]*?getByLabel\('脱敏报告证据问题'\)[\s\S]*?not\.toContainText\(secret\)[\s\S]*?__reportEvidenceClipboardWrites[\s\S]*?manualCopyDialog[\s\S]*?textarea[\s\S]*?scope: 'SCAN_TASK_DETAIL_REPORT_EVIDENCE_DRAWER_QUESTION_REFERENCE_DEEPLINK_DISPLAY_REDACTION_ONLY'/s,
  'Report evidence drawer smoke must prove report evidence question/reference display, clipboard and manual copy are display-redacted.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /artifactFallbackSafeMarker[\s\S]*?artifactFallbackBearerSecret[\s\S]*?artifactFallbackApiKeySecret[\s\S]*?artifactFallbackQuotedSecret[\s\S]*?artifactFallbackPasswordSecret[\s\S]*?artifactFallbackPlainApiKeySecret[\s\S]*?artifactFallbackJwtSecret[\s\S]*?forbiddenArtifactFallbackSecretSnippets/s,
  'Report evidence drawer smoke must inject raw ArtifactFallback summaryJson secret sentinels.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function installArtifactFallbackMocks[\s\S]*?summaryJson: JSON\.stringify\(fallbackSummary\)[\s\S]*?not-json-report-preview/s,
  'Report evidence drawer smoke must force ScanTaskDetail ArtifactFallback with raw summaryJson fixture data.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /const artifactCardTitle = page\.locator\('\.sl-section-card \.ant-card-head-title'\)\.filter\(\{ hasText: \/\^分析产物\$\/ \}\)[\s\S]*?expect\(artifactCardTitle,[\s\S]*?artifact fallback card must render[\s\S]*?\)\.toBeVisible\(\)/,
  'Report evidence drawer artifact fallback smoke must prove the exact visible Analysis Artifact card title.'
)
rejectPattern(
  reportEvidenceDrawerSmokeSpec,
  /page\.getByText\('分析产物'\)\.first\(\)/,
  'Report evidence drawer artifact fallback smoke must not use a broad text locator that can match hidden topbar copy.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /scope: 'SCAN_TASK_DETAIL_ARTIFACT_FALLBACK_SUMMARY_JSON_DISPLAY_REDACTION_ONLY'[\s\S]*?surface: 'SCAN_TASK_DETAIL_ARTIFACT_FALLBACK'[\s\S]*?fixtureHasRawSecret[\s\S]*?fallbackVisible[\s\S]*?safeMarkerVisible[\s\S]*?rawSecretsHidden[\s\S]*?bodyRawSecretsHidden[\s\S]*?redactionVisible[\s\S]*?markerContainsRawSecret: false[\s\S]*?SCAN_TASK_DETAIL_ARTIFACT_FALLBACK_SMOKE_OK/s,
  'Report evidence drawer smoke must prove ScanTaskDetail ArtifactFallback summaryJson display redaction without raw secret marker leakage.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /async function assertCodeChunkPreviewRedaction[\s\S]*?getByLabel\('脱敏 code chunk 预览'\)[\s\S]*?not\.toContainText\(secret\)[\s\S]*?scope: 'REPORT_EVIDENCE_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY'/s,
  'Report evidence drawer smoke must prove code chunk previews are display-redacted.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /codeChunkPreviewRedaction:\s*\{[\s\S]*?scope: 'REPORT_EVIDENCE_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY'[\s\S]*?rawSecretsHidden[\s\S]*?bodyHidden[\s\S]*?redactionVisible[\s\S]*?markerContainsRawSecret: false/s,
  'REPORT_EVIDENCE_DRAWER_SMOKE_OK must include code chunk preview redaction proof without raw secret values.'
)
requirePattern(
  reportEvidenceDrawerSmokeSpec,
  /questionReferenceDeeplinkRedaction:\s*\{[\s\S]*?scope: 'SCAN_TASK_DETAIL_REPORT_EVIDENCE_DRAWER_QUESTION_REFERENCE_DEEPLINK_DISPLAY_REDACTION_ONLY'[\s\S]*?fixtureHasRawSecret[\s\S]*?safeMarkerVisible[\s\S]*?questionRawSecretsHidden[\s\S]*?drawerRawSecretsHidden[\s\S]*?bodyRawSecretsHidden[\s\S]*?clipboardRawSecretsHidden[\s\S]*?manualCopyRawSecretsHidden[\s\S]*?redactionVisible[\s\S]*?markerContainsRawSecret: false/s,
  'REPORT_EVIDENCE_DRAWER_SMOKE_OK must include report evidence question/reference/deeplink redaction proof without raw secret values.'
)
requirePattern(
  css,
  /@media \(max-width: 1200px\)[\s\S]*?\.sl-report-review-gate-grid,[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)\s*;/s,
  'Scan report review gate must collapse to three columns before compact desktop widths.'
)
requirePattern(
  css,
  /@media \(max-width: 720px\)[\s\S]*?\.sl-report-review-gate-grid,[\s\S]*?grid-template-columns:\s*1fr\s*;/s,
  'Scan report review gate must collapse to one column on mobile for readable gate text.'
)

if (failures.length > 0) {
  console.error('Frontend UI regression check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Frontend UI regression checks passed.')
