import { expect, test, type Page, type Request, type Route } from '@playwright/test'

const projectId = 1
const repositoryId = 11
const scanTaskId = 8801
const foreignScanTaskId = 9901
const executionTaskId = 7101
const repairId = 6101
const foreignRepairId = 9601
const agentTaskId = 9101
const foreignAgentTaskId = 9901
const agentToolCallId = 11101
const foreignAgentToolCallId = 11901
const agentExecutionTaskId = 9102
const foreignAgentExecutionTaskId = 9902
const reportArtifactId = 5101
const governanceArtifactId = 5102
const patchArtifactId = 5103
const foreignArtifactId = 9501
const foreignPatchArtifactId = 9502
const candidateGateReason = 'QA citation, report evidence and target file are line-anchored for candidate review'

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'narrow', width: 320, height: 740 },
]

type RuntimeIssue = {
  type: string
  message: string
}

const currentMarkers = [
  'GOV-AUTOREPAIR-CURRENT 修复 Controller 边界',
  'GOV-AGENTTASK-CURRENT 扫描治理复核',
  'GOVERNANCE_TIMELINE_ARTIFACT_CURRENT',
  'GOV_AUDIT_CURRENT_REPAIR_APPROVED',
  '候选来源凭证',
  'PROJECT_QA_VERIFIED_CITATION',
  'GOV_CANDIDATE_RECEIPT_CURRENT',
  'PR Gate 已拒绝',
  'GOV_PR_GATE_CURRENT',
  'GOV_PATCH_READY_AUDIT_CURRENT',
  'gov_tool_current_scan_read_file',
  'GOV-AGENT-EXECUTION-CURRENT Agent 复核执行完成',
]

const foreignMarkers = [
  'GOV-AUTOREPAIR-FOREIGN 不应出现在当前扫描',
  'GOV-AGENTTASK-FOREIGN 不应出现在当前扫描',
  'GOV-EXECUTION-FOREIGN 不应出现在当前扫描',
  'GOVERNANCE_TIMELINE_ARTIFACT_FOREIGN',
  'GOV_AUDIT_FOREIGN_REPAIR_APPROVED',
  'GOV_CANDIDATE_RECEIPT_FOREIGN',
  'GOV_CANDIDATE_RECEIPT_FOREIGN_TIMELINE',
  'GOV_PR_GATE_FOREIGN',
  'GOV_PATCH_READY_AUDIT_FOREIGN',
  'GOV_PATCH_ARTIFACT_FOREIGN',
  'gov_tool_foreign_scan_read_file',
  'GOV-AGENT-EXECUTION-FOREIGN 不应出现在当前扫描',
  'RAW_AGENT_PROMPT_SHOULD_NOT_RENDER',
  'RAW_AGENT_ANSWER_SHOULD_NOT_RENDER',
]

const governanceStageLabels = ['风险定位', '修复候选', 'Patch 证据', 'PR 复核', '审计归档']
const governanceStageStates = ['ready', 'ready', 'ready', 'blocked', 'ready']

const project = {
  id: projectId,
  name: 'Scan Governance Timeline Smoke',
  description: 'Mocked project for scan governance timeline smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 91,
  createdBy: 1,
  createdAt: '2026-06-30T10:00:00Z',
}

const repository = {
  id: repositoryId,
  projectId,
  provider: 'GITHUB',
  owner: 'sourcelens',
  name: 'scan-governance-timeline-smoke',
  url: 'https://github.com/sourcelens/scan-governance-timeline-smoke',
  defaultBranch: 'main',
  visibility: 'PUBLIC',
  authType: 'NONE',
  status: 'ACTIVE',
  createdAt: '2026-06-30T09:58:00Z',
}

const scanTask = {
  id: scanTaskId,
  projectId,
  repositoryId,
  branch: 'main',
  commitSha: 'abc1234567890timeline',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-06-30T10:01:00Z',
  finishedAt: '2026-06-30T10:04:00Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-06-30T10:00:30Z',
}

const reportData = {
  overview: {
    totalFiles: 42,
    totalLines: 3200,
    totalDirs: 12,
    testFiles: 6,
  },
  techStack: {
    name: 'Spring Boot',
    version: '3.3',
    evidence: ['pom.xml', 'TimelineController.java'],
  },
  directories: {
    srcMain: true,
    srcTest: true,
    controllerDirs: ['src/main/java/demo'],
    serviceDirs: ['src/main/java/demo/service'],
    repositoryDirs: ['src/main/java/demo/repository'],
    entityDirs: ['src/main/java/demo/domain'],
  },
  modules: {
    controllers: 1,
    services: 2,
    repositories: 1,
    entities: 1,
  },
  codeQuality: {
    totalClasses: 5,
    totalMethods: 24,
    avgMethodsPerClass: 4.8,
    risks: [
      {
        severity: 'HIGH',
        category: 'Governance timeline risk',
        message: 'Timeline smoke risk for repair governance.',
        file_path: 'src/main/java/demo/TimelineController.java',
        line_number: 27,
        impact: '修复治理链路需要可追溯',
        suggestion: 'Show scan-bound repair, agent, execution, artifact, audit and tool-call records.',
      },
    ],
  },
  technicalDebt: [],
  suggestions: ['补齐扫描治理时间线'],
  apiRoutes: [],
  dbEntities: [],
  scanFingerprint: {
    manifestFiles: 1,
    hashedFiles: 42,
    binaryFiles: 0,
    largeFiles: 0,
    repoContentHash: 'timeline-feedface',
  },
  reportQuality: {
    readiness: 'READY',
    confidence: 90,
    summary: '扫描报告可用于治理时间线 smoke。',
    evidenceChecks: [],
  },
}

const artifacts = [
  {
    id: reportArtifactId,
    projectId,
    repositoryId,
    ownerType: 'SCAN_TASK',
    ownerId: scanTaskId,
    artifactType: 'ARCHITECTURE_REPORT',
    contentType: 'application/json',
    sizeBytes: 4096,
    checksumSha256: 'report-checksum',
    metadataJson: null,
    createdBy: 1,
    createdAt: '2026-06-30T10:04:00Z',
  },
  {
    id: governanceArtifactId,
    projectId,
    repositoryId,
    ownerType: 'SCAN_TASK',
    ownerId: scanTaskId,
    artifactType: 'GOVERNANCE_TIMELINE_ARTIFACT_CURRENT',
    contentType: 'application/json',
    sizeBytes: 2048,
    checksumSha256: 'current-governance-artifact-checksum',
    metadataJson: JSON.stringify({ marker: 'GOVERNANCE_TIMELINE_ARTIFACT_CURRENT' }),
    createdBy: 1,
    createdAt: '2026-06-30T10:05:00Z',
  },
  {
    id: patchArtifactId,
    projectId,
    repositoryId,
    ownerType: 'AUTO_REPAIR',
    ownerId: repairId,
    artifactType: 'CHANGE_PATCH',
    contentType: 'text/x-diff',
    sizeBytes: 1536,
    checksumSha256: 'current-patch-artifact-checksum',
    metadataJson: JSON.stringify({ marker: 'GOV_PATCH_ARTIFACT_CURRENT', patchArtifactPath: 'artifacts/current.patch' }),
    createdBy: 1,
    createdAt: '2026-06-30T10:09:30Z',
  },
  {
    id: foreignArtifactId,
    projectId,
    repositoryId,
    ownerType: 'SCAN_TASK',
    ownerId: foreignScanTaskId,
    artifactType: 'GOVERNANCE_TIMELINE_ARTIFACT_FOREIGN',
    contentType: 'application/json',
    sizeBytes: 1024,
    checksumSha256: 'foreign-governance-artifact-checksum',
    metadataJson: JSON.stringify({ marker: 'GOVERNANCE_TIMELINE_ARTIFACT_FOREIGN' }),
    createdBy: 1,
    createdAt: '2026-06-30T10:06:00Z',
  },
  {
    id: foreignPatchArtifactId,
    projectId,
    repositoryId,
    ownerType: 'AUTO_REPAIR',
    ownerId: foreignRepairId,
    artifactType: 'CHANGE_PATCH',
    contentType: 'text/x-diff',
    sizeBytes: 1536,
    checksumSha256: 'foreign-patch-artifact-checksum',
    metadataJson: JSON.stringify({ marker: 'GOV_PATCH_ARTIFACT_FOREIGN', patchArtifactPath: 'artifacts/foreign.patch' }),
    createdBy: 1,
    createdAt: '2026-06-30T10:09:30Z',
  },
]

const scanExecutionDetail = {
  task: {
    id: executionTaskId,
    projectId,
    repositoryId,
    taskType: 'SCAN_REPOSITORY',
    sourceType: 'SCAN_TASK',
    sourceId: scanTaskId,
    status: 'SUCCESS',
    currentStep: 'GOV-EXECUTION-CURRENT 执行扫描 finalize',
    currentAttemptId: 1,
    progress: 100,
    errorMessage: null,
    createdBy: 1,
    startedAt: '2026-06-30T10:01:00Z',
    finishedAt: '2026-06-30T10:04:00Z',
    createdAt: '2026-06-30T10:00:30Z',
    updatedAt: '2026-06-30T10:04:00Z',
  },
  attempts: [
    {
      id: 7201,
      taskId: executionTaskId,
      attemptNo: 1,
      status: 'SUCCESS',
      currentStep: 'GOV-EXECUTION-CURRENT 执行扫描 finalize',
      errorMessage: null,
      startedAt: '2026-06-30T10:01:00Z',
      finishedAt: '2026-06-30T10:04:00Z',
      createdAt: '2026-06-30T10:01:00Z',
      updatedAt: '2026-06-30T10:04:00Z',
    },
  ],
  steps: [
    {
      id: 7301,
      taskId: executionTaskId,
      attemptId: 7201,
      stepKey: 'timeline_finalize',
      stepName: 'GOV-EXECUTION-CURRENT 执行扫描 finalize',
      status: 'SUCCESS',
      logSummary: 'GOV-EXECUTION-CURRENT 执行扫描 finalize',
      errorMessage: null,
      startedAt: '2026-06-30T10:03:00Z',
      finishedAt: '2026-06-30T10:04:00Z',
      createdAt: '2026-06-30T10:03:00Z',
      updatedAt: '2026-06-30T10:04:00Z',
    },
  ],
  logs: [
    {
      id: 7401,
      taskId: executionTaskId,
      attemptId: 7201,
      stepKey: 'timeline_finalize',
      level: 'INFO',
      message: 'GOV-EXECUTION-CURRENT 执行扫描 finalize',
      createdAt: '2026-06-30T10:04:00Z',
    },
  ],
}

const autoRepairExecutionDetail = {
  task: {
    id: 8101,
    projectId,
    repositoryId,
    taskType: 'AUTO_REPAIR',
    sourceType: 'AUTO_REPAIR',
    sourceId: repairId,
    status: 'SUCCESS',
    currentStep: 'generate_patch',
    currentAttemptId: 1,
    progress: 100,
    errorMessage: null,
    createdBy: 1,
    startedAt: '2026-06-30T10:08:00Z',
    finishedAt: '2026-06-30T10:10:00Z',
    createdAt: '2026-06-30T10:08:00Z',
    updatedAt: '2026-06-30T10:10:00Z',
  },
  attempts: [],
  steps: [
    {
      id: 8201,
      taskId: 8101,
      attemptId: null,
      stepKey: 'generate_patch',
      stepName: '生成补丁',
      status: 'SUCCESS',
      logSummary: 'GOV-PATCH-GENERATION-CURRENT generate_patch SUCCESS',
      errorMessage: null,
      startedAt: '2026-06-30T10:08:00Z',
      finishedAt: '2026-06-30T10:10:00Z',
      createdAt: '2026-06-30T10:08:00Z',
      updatedAt: '2026-06-30T10:10:00Z',
    },
  ],
  logs: [],
}

const agentExecutionDetail = {
  task: {
    id: agentExecutionTaskId,
    projectId,
    repositoryId,
    taskType: 'AGENT_TASK',
    sourceType: 'AGENT_TASK',
    sourceId: agentTaskId,
    status: 'SUCCESS',
    currentStep: 'GOV-AGENT-EXECUTION-CURRENT Agent 复核执行完成',
    currentAttemptId: 1,
    progress: 100,
    errorMessage: null,
    createdBy: 1,
    startedAt: '2026-06-30T10:13:50Z',
    finishedAt: '2026-06-30T10:14:20Z',
    createdAt: '2026-06-30T10:13:50Z',
    updatedAt: '2026-06-30T10:14:20Z',
  },
  attempts: [
    {
      id: 9201,
      taskId: agentExecutionTaskId,
      attemptNo: 1,
      status: 'SUCCESS',
      currentStep: 'GOV-AGENT-EXECUTION-CURRENT Agent 复核执行完成',
      errorMessage: null,
      startedAt: '2026-06-30T10:13:50Z',
      finishedAt: '2026-06-30T10:14:20Z',
      createdAt: '2026-06-30T10:13:50Z',
      updatedAt: '2026-06-30T10:14:20Z',
    },
  ],
  steps: [
    {
      id: 9301,
      taskId: agentExecutionTaskId,
      attemptId: 9201,
      stepKey: 'agent_review_finish',
      stepName: 'GOV-AGENT-EXECUTION-CURRENT Agent 复核执行完成',
      status: 'SUCCESS',
      logSummary: 'GOV-AGENT-EXECUTION-CURRENT Agent 复核执行完成',
      errorMessage: null,
      startedAt: '2026-06-30T10:14:00Z',
      finishedAt: '2026-06-30T10:14:20Z',
      createdAt: '2026-06-30T10:14:00Z',
      updatedAt: '2026-06-30T10:14:20Z',
    },
  ],
  logs: [],
}

const foreignAgentExecutionDetail = {
  task: {
    id: foreignAgentExecutionTaskId,
    projectId,
    repositoryId,
    taskType: 'AGENT_TASK',
    sourceType: 'AGENT_TASK',
    sourceId: foreignAgentTaskId,
    status: 'SUCCESS',
    currentStep: 'GOV-AGENT-EXECUTION-FOREIGN 不应出现在当前扫描',
    currentAttemptId: 1,
    progress: 100,
    errorMessage: null,
    createdBy: 1,
    startedAt: '2026-06-30T10:13:50Z',
    finishedAt: '2026-06-30T10:14:25Z',
    createdAt: '2026-06-30T10:13:50Z',
    updatedAt: '2026-06-30T10:14:25Z',
  },
  attempts: [],
  steps: [
    {
      id: 9903,
      taskId: foreignAgentExecutionTaskId,
      attemptId: null,
      stepKey: 'foreign_agent_review_finish',
      stepName: 'GOV-AGENT-EXECUTION-FOREIGN 不应出现在当前扫描',
      status: 'SUCCESS',
      logSummary: 'GOV-AGENT-EXECUTION-FOREIGN 不应出现在当前扫描',
      errorMessage: null,
      startedAt: '2026-06-30T10:14:00Z',
      finishedAt: '2026-06-30T10:14:25Z',
      createdAt: '2026-06-30T10:14:00Z',
      updatedAt: '2026-06-30T10:14:25Z',
    },
  ],
  logs: [],
}

const autoRepairs = [
  {
    id: repairId,
    projectId,
    repositoryId,
    scanTaskId,
    filePath: 'src/main/java/demo/TimelineController.java',
    targetDesc: 'GOV-AUTOREPAIR-CURRENT 修复 Controller 边界',
    status: 'PATCH_READY',
    branchName: 'repair/timeline-current',
    diffContent: 'diff --git a/TimelineController.java b/TimelineController.java',
    patchArtifactPath: 'artifacts/current.patch',
    testLog: 'smoke tests passed',
    prUrl: 'https://example.test/current-repair',
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-06-30T10:07:00Z',
    updatedAt: '2026-06-30T10:10:00Z',
  },
  {
    id: foreignRepairId,
    projectId,
    repositoryId,
    scanTaskId: foreignScanTaskId,
    filePath: 'src/main/java/demo/ForeignTimelineController.java',
    targetDesc: 'GOV-AUTOREPAIR-FOREIGN 不应出现在当前扫描',
    status: 'PATCH_READY',
    branchName: 'repair/timeline-foreign',
    diffContent: 'foreign diff',
    patchArtifactPath: 'artifacts/foreign.patch',
    testLog: 'foreign smoke tests passed',
    prUrl: 'https://example.test/foreign-repair',
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-06-30T10:07:00Z',
    updatedAt: '2026-06-30T10:10:00Z',
  },
]

const agentTasks = [
  {
    id: agentTaskId,
    scanTaskId,
    conversationId: 3101,
    projectId,
    taskType: 'ARCHITECTURE_REVIEW',
    title: 'GOV-AGENTTASK-CURRENT 扫描治理复核',
    description: 'Current scan governance task',
    status: 'COMPLETED',
    priority: 'HIGH',
    inputJson: JSON.stringify({ scanTaskId, prompt: 'RAW_AGENT_PROMPT_SHOULD_NOT_RENDER' }),
    outputJson: JSON.stringify({ marker: 'GOV-AGENTTASK-CURRENT 扫描治理复核', answer: 'RAW_AGENT_ANSWER_SHOULD_NOT_RENDER' }),
    summary: 'GOV-AGENTTASK-CURRENT 扫描治理复核',
    startedAt: '2026-06-30T10:11:00Z',
    finishedAt: '2026-06-30T10:12:00Z',
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-06-30T10:11:00Z',
    updatedAt: '2026-06-30T10:12:00Z',
  },
  {
    id: foreignAgentTaskId,
    scanTaskId: foreignScanTaskId,
    conversationId: 3901,
    projectId,
    taskType: 'ARCHITECTURE_REVIEW',
    title: 'GOV-AGENTTASK-FOREIGN 不应出现在当前扫描',
    description: 'Foreign scan governance task',
    status: 'COMPLETED',
    priority: 'HIGH',
    inputJson: JSON.stringify({ scanTaskId: foreignScanTaskId }),
    outputJson: JSON.stringify({ marker: 'GOV-AGENTTASK-FOREIGN 不应出现在当前扫描' }),
    summary: 'GOV-AGENTTASK-FOREIGN 不应出现在当前扫描',
    startedAt: '2026-06-30T10:11:00Z',
    finishedAt: '2026-06-30T10:12:00Z',
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-06-30T10:11:00Z',
    updatedAt: '2026-06-30T10:12:00Z',
  },
]

const agentTaskSteps = [
  {
    id: 9151,
    taskId: agentTaskId,
    stepOrder: 1,
    stepType: 'TOOL_CALL',
    toolName: 'gov_tool_current_scan_read_file',
    description: '读取当前扫描文件',
    inputJson: JSON.stringify({ scanTaskId, path: 'src/main/java/demo/TimelineController.java' }),
    outputJson: JSON.stringify({ marker: 'GOV-AGENTTASK-CURRENT 扫描治理复核' }),
    status: 'SUCCESS',
    errorMessage: null,
    durationMs: 18,
    createdAt: '2026-06-30T10:14:05Z',
  },
]

const auditLogs = [
  {
    id: 10100,
    userId: 1,
    projectId,
    resourceType: 'AUTO_REPAIR',
    resourceId: repairId,
    action: 'AUTO_REPAIR_CANDIDATE_CREATED',
    status: 'SUCCESS',
    inputJson: JSON.stringify({
      provenance: {
        sourceType: 'PROJECT_QA_VERIFIED_CITATION',
        source: 'Project QA verified citation',
        scanTaskId,
        filePath: 'src/main/java/demo/TimelineController.java',
        citationId: 'GOV_CANDIDATE_RECEIPT_CURRENT',
        sourceLabel: 'C1',
        chunkId: 880101,
        startLine: 27,
        endLine: 42,
        citedByAnswer: true,
        groundingStatus: 'VERIFIED',
        citationEnforcementStatus: 'DIRECT_VERIFIED',
        repairEvidenceGate: 'READY',
        repairEvidenceGateReason: candidateGateReason,
        repairEvidenceGateSource: 'SERVER_DERIVED',
      },
    }),
    outputSummary: '自动修复候选已创建',
    durationMs: 12,
    requestId: 'req-current-candidate-receipt',
    createdAt: '2026-06-30T10:13:30Z',
  },
  {
    id: 10101,
    userId: 1,
    projectId,
    resourceType: 'SCAN_TASK',
    resourceId: scanTaskId,
    action: 'GOV_AUDIT_CURRENT_REPAIR_APPROVED',
    status: 'SUCCESS',
    inputJson: JSON.stringify({ scanTaskId }),
    outputSummary: 'GOV_AUDIT_CURRENT_REPAIR_APPROVED',
    durationMs: 34,
    requestId: 'req-current-governance',
    createdAt: '2026-06-30T10:13:00Z',
  },
  {
    id: 10102,
    userId: 1,
    projectId,
    resourceType: 'AUTO_REPAIR',
    resourceId: repairId,
    action: 'AUTO_REPAIR_PR_REJECTED',
    status: 'FAILED',
    inputJson: JSON.stringify({ scanTaskId, repairId, gate: 'human_approval_required' }),
    outputSummary: 'GOV_PR_GATE_CURRENT 缺少人工批准，无法提交 PR',
    durationMs: 19,
    requestId: 'req-current-pr-gate',
    createdAt: '2026-06-30T10:13:45Z',
  },
  {
    id: 10103,
    userId: 1,
    projectId,
    resourceType: 'AUTO_REPAIR',
    resourceId: repairId,
    action: 'AUTO_REPAIR_PATCH_READY',
    status: 'SUCCESS',
    inputJson: JSON.stringify({ scanTaskId, repairId, patchArtifactId, patchArtifactPath: 'artifacts/current.patch', executionTaskId: 8101 }),
    outputSummary: 'GOV_PATCH_READY_AUDIT_CURRENT patch evidence retained',
    durationMs: 28,
    requestId: 'req-current-patch-ready',
    createdAt: '2026-06-30T10:13:20Z',
  },
  {
    id: 10900,
    userId: 1,
    projectId,
    resourceType: 'AUTO_REPAIR',
    resourceId: foreignRepairId,
    action: 'AUTO_REPAIR_CANDIDATE_CREATED',
    status: 'SUCCESS',
    inputJson: JSON.stringify({
      provenance: {
        sourceType: 'PROJECT_QA_VERIFIED_CITATION',
        scanTaskId: foreignScanTaskId,
        filePath: 'src/main/java/demo/ForeignTimelineController.java',
        citationId: 'GOV_CANDIDATE_RECEIPT_FOREIGN',
        sourceLabel: 'FX',
      },
    }),
    outputSummary: 'GOV_CANDIDATE_RECEIPT_FOREIGN',
    durationMs: 12,
    requestId: 'req-foreign-candidate-receipt',
    createdAt: '2026-06-30T10:13:30Z',
  },
  {
    id: 10901,
    userId: 1,
    projectId,
    resourceType: 'SCAN_TASK',
    resourceId: foreignScanTaskId,
    action: 'GOV_AUDIT_FOREIGN_REPAIR_APPROVED',
    status: 'SUCCESS',
    inputJson: JSON.stringify({ scanTaskId: foreignScanTaskId }),
    outputSummary: 'GOV_AUDIT_FOREIGN_REPAIR_APPROVED',
    durationMs: 34,
    requestId: 'req-foreign-governance',
    createdAt: '2026-06-30T10:13:00Z',
  },
  {
    id: 10902,
    userId: 1,
    projectId,
    resourceType: 'AUTO_REPAIR',
    resourceId: foreignRepairId,
    action: 'AUTO_REPAIR_PR_REJECTED',
    status: 'FAILED',
    inputJson: JSON.stringify({ scanTaskId: foreignScanTaskId, repairId: foreignRepairId }),
    outputSummary: 'GOV_PR_GATE_FOREIGN 不应出现在当前扫描',
    durationMs: 19,
    requestId: 'req-foreign-pr-gate',
    createdAt: '2026-06-30T10:13:45Z',
  },
  {
    id: 10903,
    userId: 1,
    projectId,
    resourceType: 'AUTO_REPAIR',
    resourceId: foreignRepairId,
    action: 'AUTO_REPAIR_PATCH_READY',
    status: 'SUCCESS',
    inputJson: JSON.stringify({ scanTaskId: foreignScanTaskId, repairId: foreignRepairId, patchArtifactId: foreignPatchArtifactId }),
    outputSummary: 'GOV_PATCH_READY_AUDIT_FOREIGN 不应出现在当前扫描',
    durationMs: 28,
    requestId: 'req-foreign-patch-ready',
    createdAt: '2026-06-30T10:13:20Z',
  },
]

const agentToolCalls = [
  {
    id: agentToolCallId,
    conversationId: 3101,
    projectId,
    scanTaskId,
    toolName: 'gov_tool_current_scan_read_file',
    permissionLevel: 'READ_ONLY',
    argumentsJson: JSON.stringify({ path: 'src/main/java/demo/TimelineController.java' }),
    resultSummary: 'gov_tool_current_scan_read_file',
    success: true,
    errorMessage: null,
    durationMs: 18,
    createdBy: 1,
    createdAt: '2026-06-30T10:14:00Z',
  },
  {
    id: foreignAgentToolCallId,
    conversationId: 3901,
    projectId,
    scanTaskId: foreignScanTaskId,
    toolName: 'gov_tool_foreign_scan_read_file',
    permissionLevel: 'READ_ONLY',
    argumentsJson: JSON.stringify({ path: 'src/main/java/demo/ForeignTimelineController.java' }),
    resultSummary: 'gov_tool_foreign_scan_read_file',
    success: true,
    errorMessage: null,
    durationMs: 18,
    createdBy: 1,
    createdAt: '2026-06-30T10:14:00Z',
  },
]

const governanceTimeline = {
  projectId,
  repositoryId,
  scanTaskId,
  scanStatus: 'SUCCESS',
  generatedAt: '2026-06-30T10:15:00Z',
  summary: {
    status: 'BOUND',
    counts: {
      autoRepairs: 1,
      agentTasks: 1,
      agentToolCalls: 1,
      auditLogs: 4,
      artifacts: 2,
      scanExecutions: 1,
      repairExecutions: 1,
      agentExecutions: 1,
    },
    hasErrors: true,
    attributionGapCount: 0,
  },
  resources: {
    artifacts: [artifacts[1], artifacts[2], artifacts[3], artifacts[4]],
    scanExecution: scanExecutionDetail,
    repairExecutions: [autoRepairExecutionDetail],
    agentExecutions: [agentExecutionDetail, foreignAgentExecutionDetail],
    autoRepairs,
    agentTasks,
    agentToolCalls,
    auditLogs,
  },
  events: [
    {
      id: 'audit-log-10102',
      eventType: 'AUTO_REPAIR_PR_REJECTED',
      title: 'PR Gate 已拒绝',
      detail: 'GOV_PR_GATE_CURRENT 缺少人工批准，无法提交 PR',
      status: 'FAILED',
      tone: 'danger',
      occurredAt: '2026-06-30T10:13:45Z',
      resource: { type: 'AUTO_REPAIR', id: repairId, projectId, repositoryId, scanTaskId },
      source: { type: 'AUDIT_LOG', id: 10102, projectId, repositoryId, scanTaskId },
      attribution: {
        mode: 'DIRECT',
        confidence: 'HIGH',
        reason: 'auditLog.AUTO_REPAIR_PR_* scan-bound autoRepair',
      },
      errorMessage: null,
      actionTarget: { type: 'AUTO_REPAIR', id: repairId, url: '/auto-repairs' },
      repairEvidenceGate: 'READY',
      repairEvidenceGateReason: candidateGateReason,
      repairEvidenceGateSource: 'SERVER_DERIVED',
    },
    {
      id: 'audit-log-10100',
      eventType: 'AUTO_REPAIR_CANDIDATE_RECEIPT',
      title: '候选来源凭证',
      detail: `来源 PROJECT_QA_VERIFIED_CITATION / Scan #8801 / 文件 src/main/java/demo/TimelineController.java / 引用 GOV_CANDIDATE_RECEIPT_CURRENT / 行 27-42 / Grounding VERIFIED / Citation DIRECT_VERIFIED / 门禁 READY / 门禁来源 SERVER_DERIVED / 门禁原因 ${candidateGateReason}`,
      status: 'SUCCESS',
      tone: 'ready',
      occurredAt: '2026-06-30T10:13:30Z',
      resource: { type: 'AUTO_REPAIR', id: repairId, projectId, repositoryId, scanTaskId },
      source: { type: 'AUDIT_LOG', id: 10100, projectId, repositoryId, scanTaskId },
      attribution: {
        mode: 'DIRECT',
        confidence: 'HIGH',
        reason: 'auditLog.AUTO_REPAIR_CANDIDATE_CREATED sanitized provenance',
      },
      errorMessage: null,
      actionTarget: { type: 'AUTO_REPAIR', id: repairId, url: '/auto-repairs' },
      repairEvidenceGate: 'READY',
      repairEvidenceGateReason: candidateGateReason,
      repairEvidenceGateSource: 'SERVER_DERIVED',
    },
    {
      id: 'audit-log-10900',
      eventType: 'AUTO_REPAIR_CANDIDATE_RECEIPT',
      title: '候选来源凭证',
      detail: 'GOV_CANDIDATE_RECEIPT_FOREIGN_TIMELINE should be filtered by scanTaskId',
      status: 'SUCCESS',
      tone: 'ready',
      occurredAt: '2026-06-30T10:13:31Z',
      resource: { type: 'AUTO_REPAIR', id: foreignRepairId, projectId, repositoryId, scanTaskId: foreignScanTaskId },
      source: { type: 'AUDIT_LOG', id: 10900, projectId, repositoryId, scanTaskId: foreignScanTaskId },
      attribution: {
        mode: 'DIRECT',
        confidence: 'HIGH',
        reason: 'foreign auditLog.AUTO_REPAIR_CANDIDATE_CREATED should not be visible',
      },
      errorMessage: null,
      actionTarget: { type: 'AUTO_REPAIR', id: foreignRepairId, url: '/auto-repairs' },
      repairEvidenceGate: 'READY',
      repairEvidenceGateReason: 'Foreign scan candidate receipt should not render',
      repairEvidenceGateSource: 'SERVER_DERIVED',
    },
  ],
  limits: {
    autoRepairs: { limit: 10, total: 1, returned: 1, truncated: false },
    agentTasks: { limit: 10, total: 1, returned: 1, truncated: false },
    agentToolCalls: { limit: 10, total: 1, returned: 1, truncated: false },
    auditLogs: { limit: 10, total: 4, returned: 4, truncated: false },
    artifacts: { limit: 10, total: 2, returned: 2, truncated: false },
    events: { limit: 30, total: 10, returned: 10, truncated: false },
  },
  truncated: false,
  warnings: [],
  attributionGaps: [],
}

function result<T>(data: T) {
  return {
    code: 'SUCCESS',
    message: 'OK',
    data,
  }
}

function pageResult<T>(items: T[], search: URLSearchParams) {
  return {
    items,
    page: Number(search.get('page') || 1),
    pageSize: Number(search.get('pageSize') || items.length || 20),
    total: items.length,
  }
}

function requestFramePath(request: Request) {
  try {
    return new URL(request.frame().url()).pathname
  } catch {
    return ''
  }
}

function isScanDetailApiRequest(request: Request) {
  return requestFramePath(request) === `/scan-tasks/${scanTaskId}`
}

function matchesNumberFilter(value: number | null | undefined, filter: string | null) {
  return !filter || Number(value) === Number(filter)
}

function matchesTextFilter(value: string | null | undefined, filter: string | null) {
  return !filter || value === filter
}

function filteredArtifacts(search: URLSearchParams) {
  return artifacts.filter(artifact =>
    matchesTextFilter(artifact.ownerType, search.get('ownerType'))
    && matchesNumberFilter(artifact.ownerId, search.get('ownerId'))
    && matchesNumberFilter(artifact.repositoryId, search.get('repositoryId'))
  )
}

function filteredAuditLogs(search: URLSearchParams) {
  return auditLogs.filter(log =>
    matchesTextFilter(log.resourceType, search.get('resourceType'))
    && matchesNumberFilter(log.resourceId, search.get('resourceId'))
    && matchesTextFilter(log.action, search.get('action'))
    && matchesTextFilter(log.status, search.get('status'))
  )
}

function filteredAgentTasks(search: URLSearchParams) {
  return agentTasks.filter(task =>
    matchesNumberFilter(task.scanTaskId, search.get('scanTaskId'))
    && matchesTextFilter(task.status, search.get('status'))
  )
}

function filteredAgentToolCalls(search: URLSearchParams) {
  return agentToolCalls.filter(call =>
    matchesNumberFilter(call.conversationId, search.get('conversationId'))
    && matchesNumberFilter(call.scanTaskId, search.get('scanTaskId'))
    && matchesTextFilter(call.toolName, search.get('toolName'))
  )
}

async function fulfillJson(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(data),
  })
}

function installRuntimeGuards(page: Page) {
  const issues: RuntimeIssue[] = []

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (message.text().includes('findDOMNode is deprecated')) return
    if (message.text().includes('findDOMNode') && message.text().includes('deprecated in StrictMode')) return
    issues.push({ type: 'console.error', message: message.text() })
  })
  page.on('pageerror', (error) => {
    issues.push({ type: 'pageerror', message: error.message })
  })
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (url.pathname.startsWith('/api/') && response.status() >= 500) {
      issues.push({ type: 'api.5xx', message: `${response.request().method()} ${url.pathname}${url.search}: ${response.status()}` })
    }
  })

  return issues
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))
  const overflow = Math.max(layout.scrollWidth, layout.bodyScrollWidth) - layout.innerWidth
  expect(overflow, `${label} has horizontal overflow: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(1)
}

async function installScanGovernanceTimelineMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const governanceTimelineUrls: string[] = []
  const legacyTimelineRequests: string[] = []
  const artifactQueries: string[] = []
  const artifactLandingQueries: string[] = []
  const auditLandingQueries: string[] = []
  const toolCallLandingQueries: string[] = []
  const agentTaskLandingQueries: string[] = []
  const autoRepairLandingQueries: string[] = []
  const executionTaskLandingUrls: string[] = []
  const scanExecutionSourceUrls: string[] = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'scan-governance-timeline-smoke-token')
  })

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()
    const fromScanDetail = isScanDetailApiRequest(request)

    if (!path.startsWith('/api/')) {
      await route.continue()
      return
    }

    if (method === 'GET' && path === '/api/auth/me') {
      await fulfillJson(route, result({ id: 1, username: 'scan_governance_smoke', email: 'smoke@local.test', status: 'ACTIVE' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}`) {
      await fulfillJson(route, result(project))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/repositories`) {
      await fulfillJson(route, result([repository]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/scan-tasks`) {
      await fulfillJson(route, result(pageResult([scanTask], url.searchParams)))
      return
    }

    if (method === 'GET' && path === `/api/scan-tasks/${scanTaskId}`) {
      await fulfillJson(route, result(scanTask))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      if (fromScanDetail) {
        artifactQueries.push(url.search)
      } else {
        artifactLandingQueries.push(url.search)
      }
      await fulfillJson(route, result(filteredArtifacts(url.searchParams)))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${reportArtifactId}/preview`) {
      await fulfillJson(route, result({ record: artifacts[0], text: JSON.stringify(reportData), truncated: false, previewBytes: 4096 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${governanceArtifactId}/preview`) {
      await fulfillJson(route, result({ record: artifacts[1], text: JSON.stringify({ marker: 'GOVERNANCE_TIMELINE_ARTIFACT_CURRENT' }), truncated: false, previewBytes: 128 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${foreignArtifactId}/preview`) {
      await fulfillJson(route, result({ record: artifacts[2], text: JSON.stringify({ marker: 'GOVERNANCE_TIMELINE_ARTIFACT_FOREIGN' }), truncated: false, previewBytes: 128 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${patchArtifactId}/preview`) {
      await fulfillJson(route, result({ record: artifacts[2], text: 'diff --git a/TimelineController.java b/TimelineController.java\n+GOV_PATCH_ARTIFACT_CURRENT', truncated: false, previewBytes: 256 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/SCAN_TASK/${scanTaskId}`) {
      scanExecutionSourceUrls.push(`${path}${url.search}`)
      await fulfillJson(route, result(scanExecutionDetail))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/AUTO_REPAIR/${repairId}`) {
      if (fromScanDetail) {
        legacyTimelineRequests.push(`${method} ${path}${url.search}`)
        await fulfillJson(route, result(pageResult([], url.searchParams)))
        return
      }
      await fulfillJson(route, result(autoRepairExecutionDetail))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks`) {
      await fulfillJson(route, result(pageResult([
        scanExecutionDetail.task,
        autoRepairExecutionDetail.task,
        agentExecutionDetail.task,
      ], url.searchParams)))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/${autoRepairExecutionDetail.task.id}`) {
      executionTaskLandingUrls.push(`${path}${url.search}`)
      await fulfillJson(route, result(autoRepairExecutionDetail))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/${agentExecutionDetail.task.id}`) {
      executionTaskLandingUrls.push(`${path}${url.search}`)
      await fulfillJson(route, result(agentExecutionDetail))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/scan-tasks/${scanTaskId}/governance-timeline`) {
      governanceTimelineUrls.push(`${path}${url.search}`)
      await fulfillJson(route, result(governanceTimeline))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/auto-repairs`) {
      if (fromScanDetail) {
        legacyTimelineRequests.push(`${method} ${path}${url.search}`)
        await fulfillJson(route, result([]))
        return
      }
      autoRepairLandingQueries.push(url.search)
      await fulfillJson(route, result(autoRepairs.filter(repair =>
        matchesNumberFilter(repair.scanTaskId, url.searchParams.get('scanTaskId'))
      )))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/auto-repairs/${repairId}`) {
      await fulfillJson(route, result(autoRepairs[0]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/agent-tasks`) {
      if (fromScanDetail) {
        legacyTimelineRequests.push(`${method} ${path}${url.search}`)
        await fulfillJson(route, result(pageResult([], url.searchParams)))
        return
      }
      agentTaskLandingQueries.push(url.search)
      await fulfillJson(route, result(pageResult(filteredAgentTasks(url.searchParams), url.searchParams)))
      return
    }

    if (method === 'GET' && path === `/api/agent-tasks/${agentTaskId}`) {
      await fulfillJson(route, result(agentTasks[0]))
      return
    }

    if (method === 'GET' && path === `/api/agent-tasks/${agentTaskId}/steps`) {
      await fulfillJson(route, result(agentTaskSteps))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/agent-tool-calls`) {
      if (fromScanDetail) {
        legacyTimelineRequests.push(`${method} ${path}${url.search}`)
        await fulfillJson(route, result(pageResult([], url.searchParams)))
        return
      }
      toolCallLandingQueries.push(url.search)
      await fulfillJson(route, result(pageResult(filteredAgentToolCalls(url.searchParams), url.searchParams)))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/audit-logs`) {
      if (fromScanDetail) {
        legacyTimelineRequests.push(`${method} ${path}${url.search}`)
        await fulfillJson(route, result(pageResult([], url.searchParams)))
        return
      }
      auditLandingQueries.push(url.search)
      await fulfillJson(route, result(pageResult(filteredAuditLogs(url.searchParams), url.searchParams)))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/github-webhook-deliveries`) {
      await fulfillJson(route, result(pageResult([], url.searchParams)))
      return
    }

    if (method === 'GET' && (path === `/api/projects/${projectId}/code-chunks/search` || path === `/api/projects/${projectId}/code-chunks/status`)) {
      await fulfillJson(route, result({
        scanTaskId,
        query: url.searchParams.get('query') || '',
        limit: Number(url.searchParams.get('limit') || 1),
        total: 1,
        resultCount: 1,
        totalChunks: 128,
        embeddedChunks: 96,
        truncated: false,
        retrievalMode: 'STABLE_FALLBACK',
        evidenceProfile: {
          readiness: 'READY',
          confidence: 90,
          summary: 'Governance timeline smoke has code knowledge.',
          nextAction: 'Review governance timeline',
          details: [],
          uniqueFiles: 1,
          embeddedEvidenceCount: 1,
          lowConfidenceCount: 0,
          topScore: 90,
          averageScore: 90,
          lineSpan: 12,
          dominantEvidenceType: 'CONTROLLER',
          evidenceTypeStats: [{ type: 'CONTROLLER', count: 1 }],
          fileStats: [{ filePath: 'src/main/java/demo/TimelineController.java', count: 1, bestScore: 90 }],
        },
        items: [],
      }))
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await route.fulfill({
      status: 599,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(result(null)),
    })
  })

  return {
    governanceTimelineUrls,
    legacyTimelineRequests,
    artifactQueries,
    artifactLandingQueries,
    auditLandingQueries,
    toolCallLandingQueries,
    agentTaskLandingQueries,
    autoRepairLandingQueries,
    executionTaskLandingUrls,
    scanExecutionSourceUrls,
    unhandledApiRequests,
  }
}

async function openTimelineAndAssert(page: Page, viewportName: string) {
  await page.goto(`/scan-tasks/${scanTaskId}`)

  await expect(page.getByText('GOV-EXECUTION-CURRENT 执行扫描 finalize', { exact: false }).first(), `${viewportName} should show scan execution marker in the report shell`).toBeVisible()

  const timeline = page.getByLabel('修复治理时间线')
  await expect(timeline).toBeVisible()
  const stageRail = timeline.getByLabel('修复治理阶段轨道')
  await expect(stageRail, `${viewportName} should show governance stage rail`).toBeVisible()

  for (const label of governanceStageLabels) {
    await expect(stageRail.getByText(label, { exact: true }), `${viewportName} should show governance stage: ${label}`).toBeVisible()
  }

  for (const marker of currentMarkers) {
    await expect(timeline.getByText(marker, { exact: false }), `${viewportName} should show current scan marker: ${marker}`).toBeVisible()
  }
  await expect(timeline.getByText('1 个修复候选已绑定当前扫描，1 个有来源凭证。', { exact: false })).toBeVisible()
  await expect(timeline.getByText('1 个 patch artifact 已归档，可复核 Diff 和执行证据。', { exact: false })).toBeVisible()
  await expect(timeline.getByText('1 个 PR Gate 拒绝，0 个 PR 创建失败。', { exact: false })).toBeVisible()
  await expect(timeline.getByText('DIRECT_VERIFIED', { exact: false })).toBeVisible()
  await expect(timeline.getByText('src/main/java/demo/TimelineController.java', { exact: false }).first()).toBeVisible()
  await expect(timeline.getByText('PATCH_READY', { exact: false }).first()).toBeVisible()
  const candidateReceiptEvent = timeline.locator('.sl-report-governance-event').filter({ hasText: 'GOV_CANDIDATE_RECEIPT_CURRENT' }).first()
  await expect(candidateReceiptEvent.getByText('门禁 READY', { exact: true })).toBeVisible()
  await expect(candidateReceiptEvent.getByText('门禁来源 SERVER_DERIVED', { exact: true })).toBeVisible()
  await expect(candidateReceiptEvent.getByText(`门禁原因 ${candidateGateReason}`, { exact: true })).toBeVisible()
  await expect(candidateReceiptEvent.getByRole('button', { name: '打开修复详情' })).toBeVisible()
  await expect(candidateReceiptEvent.getByRole('button', { name: '打开修复详情' })).toHaveAttribute(
    'data-sl-target-url',
    `/auto-repairs?projectId=${projectId}&scanTaskId=${scanTaskId}&repairId=${repairId}`,
  )
  await expect(candidateReceiptEvent.getByRole('button', { name: '打开来源报告' })).toHaveAttribute('data-sl-target-url', `/scan-tasks/${scanTaskId}`)
  const candidateQaUrl = await candidateReceiptEvent.getByRole('button', { name: 'QA 复核来源' }).getAttribute('data-sl-target-url')
  expect(candidateQaUrl || '').toContain(`/projects/${projectId}?`)
  expect(candidateQaUrl || '').toContain('tab=qa')
  expect(candidateQaUrl || '').toContain(`scanTaskId=${scanTaskId}`)
  const decodedCandidateQaUrl = decodeURIComponent(candidateQaUrl || '').replace(/\+/g, ' ')
  expect(decodedCandidateQaUrl).toContain('治理时间线中的候选来源凭证')
  expect(decodedCandidateQaUrl).toContain(`AutoRepair：#${repairId}`)
  expect(decodedCandidateQaUrl).toContain('候选门禁：READY')
  expect(decodedCandidateQaUrl).toContain('GOV_CANDIDATE_RECEIPT_CURRENT')
  const patchArtifactEvent = timeline.locator('.sl-report-governance-event').filter({ hasText: 'AutoRepair 产物已归档 1 个' }).first()
  await expect(patchArtifactEvent.getByText('代码补丁', { exact: false })).toBeVisible()
  await expect(patchArtifactEvent.getByRole('button', { name: '打开补丁产物' })).toHaveAttribute(
    'data-sl-target-url',
    `/artifacts?projectId=${projectId}&ownerType=AUTO_REPAIR&ownerId=${repairId}&artifactId=${patchArtifactId}`,
  )
  const repairExecutionEvent = timeline.locator('.sl-report-governance-event').filter({ hasText: `修复执行任务 #${autoRepairExecutionDetail.task.id}` }).first()
  await expect(repairExecutionEvent.getByText('generate_patch', { exact: false })).toBeVisible()
  await expect(repairExecutionEvent.getByRole('button', { name: '打开执行详情' })).toHaveAttribute(
    'data-sl-target-url',
    `/execution-tasks?projectId=${projectId}&taskId=${autoRepairExecutionDetail.task.id}`,
  )
  const patchReadyAuditEvent = timeline.locator('.sl-report-governance-event').filter({ hasText: 'GOV_PATCH_READY_AUDIT_CURRENT' }).first()
  await expect(patchReadyAuditEvent.getByText('AUTO_REPAIR_PATCH_READY', { exact: false })).toBeVisible()
  await expect(patchReadyAuditEvent.getByRole('button', { name: '打开审计日志' })).toHaveAttribute(
    'data-sl-target-url',
    `/audit-logs?projectId=${projectId}&scanTaskId=${scanTaskId}&resourceType=AUTO_REPAIR&resourceId=${repairId}&action=AUTO_REPAIR_PATCH_READY&status=SUCCESS`,
  )
  const prGateEvent = timeline.locator('.sl-report-governance-event').filter({ hasText: 'GOV_PR_GATE_CURRENT' }).first()
  await expect(prGateEvent.getByRole('button', { name: '打开修复详情' })).toHaveAttribute(
    'data-sl-target-url',
    `/auto-repairs?projectId=${projectId}&scanTaskId=${scanTaskId}&repairId=${repairId}`,
  )
  const agentTaskEvent = timeline.locator('.sl-report-governance-event').filter({ hasText: 'GOV-AGENTTASK-CURRENT 扫描治理复核' }).first()
  await expect(agentTaskEvent.getByRole('button', { name: '打开 Agent 任务' })).toHaveAttribute(
    'data-sl-target-url',
    `/agent-tasks?projectId=${projectId}&scanTaskId=${scanTaskId}&taskId=${agentTaskId}`,
  )
  const agentToolCallEvent = timeline.locator('.sl-report-governance-event').filter({ hasText: 'gov_tool_current_scan_read_file' }).first()
  await expect(agentToolCallEvent.getByRole('button', { name: '打开审计日志' })).toHaveAttribute(
    'data-sl-target-url',
    `/audit-logs?projectId=${projectId}&scanTaskId=${scanTaskId}&conversationId=${agentToolCalls[0].conversationId}`,
  )
  const agentExecutionEvent = timeline.locator('.sl-report-governance-event').filter({ hasText: 'GOV-AGENT-EXECUTION-CURRENT Agent 复核执行完成' }).first()
  await expect(agentExecutionEvent.getByRole('button', { name: '打开执行详情' })).toHaveAttribute(
    'data-sl-target-url',
    `/execution-tasks?projectId=${projectId}&taskId=${agentExecutionDetail.task.id}`,
  )

  for (const marker of foreignMarkers) {
    await expect(timeline.getByText(marker, { exact: false }), `${viewportName} should not show foreign scan marker: ${marker}`).toHaveCount(0)
  }

  await expectNoHorizontalOverflow(page, `${viewportName}:scan-governance-timeline`)
}

async function clickTimelineActionAndAssertLanding(
  page: Page,
  eventText: string,
  buttonName: string,
  assertLanding: (targetUrl: string) => Promise<void>,
) {
  await page.goto(`/scan-tasks/${scanTaskId}`)
  const timeline = page.getByLabel('修复治理时间线')
  await expect(timeline).toBeVisible()
  const event = timeline.locator('.sl-report-governance-event').filter({ hasText: eventText }).first()
  await expect(event, `Timeline event should be visible before clicking ${buttonName}: ${eventText}`).toBeVisible()
  const button = event.getByRole('button', { name: buttonName }).first()
  await expect(button, `Timeline action should be visible: ${buttonName}`).toBeVisible()
  const targetUrl = await button.getAttribute('data-sl-target-url')
  expect(targetUrl, `Timeline action ${buttonName} should expose a target URL`).toBeTruthy()
  const expected = new URL(targetUrl || '/', 'http://127.0.0.1')
  await Promise.all([
    page.waitForURL(url => url.pathname === expected.pathname && url.search === expected.search),
    button.click(),
  ])
  await assertLanding(targetUrl || '')
  return targetUrl || ''
}

function targetParams(targetUrl: string) {
  return new URL(targetUrl, 'http://127.0.0.1').searchParams
}

async function runActionLandingAssertions(page: Page) {
  const actionLanding = {
    clickedActionCount: 0,
    allLandingPagesLoaded: false,
    allSelectedOrFiltered: false,
    autoRepairSelected: false,
    artifactSelected: false,
    executionTaskSelected: false,
    auditResourceFiltered: false,
    toolCallFiltered: false,
    agentTaskSelected: false,
    rawAgentTaskPayloadHidden: false,
    qaContextBound: false,
  }

  await page.setViewportSize({ width: 1440, height: 900 })

  await clickTimelineActionAndAssertLanding(page, 'GOV_CANDIDATE_RECEIPT_CURRENT', '打开修复详情', async (targetUrl) => {
    const params = targetParams(targetUrl)
    expect(params.get('repairId')).toBe(String(repairId))
    expect(params.get('scanTaskId')).toBe(String(scanTaskId))
    await expect(page.getByText(`任务详情 #${repairId}`, { exact: false })).toBeVisible()
    await expect(page.getByText('GOV-AUTOREPAIR-CURRENT 修复 Controller 边界', { exact: false }).first()).toBeVisible()
    actionLanding.autoRepairSelected = true
  })
  actionLanding.clickedActionCount += 1

  await clickTimelineActionAndAssertLanding(page, 'AutoRepair 产物已归档 1 个', '打开补丁产物', async (targetUrl) => {
    const params = targetParams(targetUrl)
    expect(params.get('ownerType')).toBe('AUTO_REPAIR')
    expect(params.get('ownerId')).toBe(String(repairId))
    expect(params.get('artifactId')).toBe(String(patchArtifactId))
    await expect(page.getByText(`补丁文件 #${patchArtifactId}`, { exact: false })).toBeVisible()
    await expect(page.getByText('GOV_PATCH_ARTIFACT_CURRENT', { exact: false })).toBeVisible()
    actionLanding.artifactSelected = true
  })
  actionLanding.clickedActionCount += 1

  await clickTimelineActionAndAssertLanding(page, `修复执行任务 #${autoRepairExecutionDetail.task.id}`, '打开执行详情', async (targetUrl) => {
    const params = targetParams(targetUrl)
    expect(params.get('taskId')).toBe(String(autoRepairExecutionDetail.task.id))
    await expect(page.getByRole('region', { name: new RegExp(`任务 #${autoRepairExecutionDetail.task.id}`) })).toBeVisible()
    await expect(page.getByText('generate_patch', { exact: false }).first()).toBeVisible()
    actionLanding.executionTaskSelected = true
  })
  actionLanding.clickedActionCount += 1

  await clickTimelineActionAndAssertLanding(page, 'GOV_PATCH_READY_AUDIT_CURRENT', '打开审计日志', async (targetUrl) => {
    const params = targetParams(targetUrl)
    expect(params.get('resourceType')).toBe('AUTO_REPAIR')
    expect(params.get('resourceId')).toBe(String(repairId))
    expect(params.get('action')).toBe('AUTO_REPAIR_PATCH_READY')
    expect(params.get('status')).toBe('SUCCESS')
    await expect(page.getByRole('tab', { name: '通用审计' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('审计事件 #10103', { exact: false })).toBeVisible()
    await expect(page.getByText('AUTO_REPAIR_PATCH_READY', { exact: false }).first()).toBeVisible()
    actionLanding.auditResourceFiltered = true
  })
  actionLanding.clickedActionCount += 1

  await clickTimelineActionAndAssertLanding(page, 'GOV-AGENTTASK-CURRENT 扫描治理复核', '打开 Agent 任务', async (targetUrl) => {
    const params = targetParams(targetUrl)
    expect(params.get('scanTaskId')).toBe(String(scanTaskId))
    expect(params.get('taskId')).toBe(String(agentTaskId))
    await expect(page.getByRole('region', { name: /GOV-AGENTTASK-CURRENT 扫描治理复核/ })).toBeVisible()
    await expect(page.getByText(`扫描报告 #${scanTaskId}`, { exact: false })).toBeVisible()
    await expect(page.getByText('RAW_AGENT_PROMPT_SHOULD_NOT_RENDER', { exact: false })).toHaveCount(0)
    await expect(page.getByText('RAW_AGENT_ANSWER_SHOULD_NOT_RENDER', { exact: false })).toHaveCount(0)
    actionLanding.agentTaskSelected = true
    actionLanding.rawAgentTaskPayloadHidden = true
  })
  actionLanding.clickedActionCount += 1

  await clickTimelineActionAndAssertLanding(page, 'GOV_CANDIDATE_RECEIPT_CURRENT', 'QA 复核来源', async (targetUrl) => {
    const params = targetParams(targetUrl)
    const question = params.get('question') || ''
    expect(params.get('tab')).toBe('qa')
    expect(params.get('scanTaskId')).toBe(String(scanTaskId))
    expect(question).toContain('治理时间线中的候选来源凭证')
    await expect(page.getByRole('tab', { name: '代码问答(RAG)' })).toHaveAttribute('aria-selected', 'true')
    const questionInputValue = await page.getByPlaceholder(/输入问题/).inputValue()
    expect(questionInputValue.replace(/\s+/g, '')).toBe(question.replace(/\s+/g, ''))
    await expect(page.getByText(`#${scanTaskId}`, { exact: false }).first()).toBeVisible()
    actionLanding.qaContextBound = true
  })
  actionLanding.clickedActionCount += 1

  await clickTimelineActionAndAssertLanding(page, 'gov_tool_current_scan_read_file', '打开审计日志', async (targetUrl) => {
    const params = targetParams(targetUrl)
    expect(params.get('conversationId')).toBe(String(agentToolCalls[0].conversationId))
    expect(params.get('scanTaskId')).toBe(String(scanTaskId))
    await expect(page.getByRole('tab', { name: 'Agent 工具调用' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('gov_tool_current_scan_read_file', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('gov_tool_foreign_scan_read_file', { exact: false })).toHaveCount(0)
    actionLanding.toolCallFiltered = true
  })
  actionLanding.clickedActionCount += 1

  actionLanding.allSelectedOrFiltered = actionLanding.autoRepairSelected
    && actionLanding.artifactSelected
    && actionLanding.executionTaskSelected
    && actionLanding.auditResourceFiltered
    && actionLanding.toolCallFiltered
    && actionLanding.agentTaskSelected
    && actionLanding.rawAgentTaskPayloadHidden
    && actionLanding.qaContextBound
  actionLanding.allLandingPagesLoaded = actionLanding.clickedActionCount === 7 && actionLanding.allSelectedOrFiltered

  return actionLanding
}

function expectQueryParamOnEveryRequest(queries: string[], key: string, value: string, label: string) {
  expect(queries.length, `${label} should be requested for each viewport.`).toBeGreaterThanOrEqual(viewportMatrix.length)
  for (const query of queries) {
    const params = new URLSearchParams(query)
    expect(params.get(key), `${label} should include ${key}=${value}: ${query}`).toBe(value)
  }
}

function expectGovernanceApiOnEveryViewport(urls: string[]) {
  expect(urls.length, 'Scan governance timeline aggregate API should be requested for each viewport.').toBeGreaterThanOrEqual(viewportMatrix.length)
  for (const url of urls) {
    expect(url, `Governance aggregate URL should be project and scan scoped: ${url}`)
      .toBe(`/api/projects/${projectId}/scan-tasks/${scanTaskId}/governance-timeline`)
  }
}

test('ScanTaskDetail shows scan-bound repair governance timeline with mocked API only', async ({ page }) => {
  const network = await installScanGovernanceTimelineMocks(page)
  const issues = installRuntimeGuards(page)
  const baseURLHost = new URL(test.info().project.use.baseURL || page.url() || 'http://127.0.0.1').hostname || '127.0.0.1'

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await openTimelineAndAssert(page, viewport.name)
  }

  const actionLanding = await runActionLandingAssertions(page)

  expectGovernanceApiOnEveryViewport(network.governanceTimelineUrls)
  expect(network.legacyTimelineRequests, 'Timeline should not call legacy multi-endpoint API fan-out after aggregate migration.').toEqual([])
  expectQueryParamOnEveryRequest(network.artifactQueries, 'ownerType', 'SCAN_TASK', 'artifacts')
  expectQueryParamOnEveryRequest(network.artifactQueries, 'ownerId', String(scanTaskId), 'artifacts')
  expect(network.autoRepairLandingQueries.length, 'AutoRepair landing should load the target page API without being counted as legacy timeline fan-out.').toBeGreaterThan(0)
  expect(network.artifactLandingQueries.some(query => {
    const params = new URLSearchParams(query)
    return params.get('ownerType') === 'AUTO_REPAIR' && params.get('ownerId') === String(repairId)
  }), 'Artifact landing should request owner-scoped artifacts for the patch owner.').toBe(true)
  expect(network.executionTaskLandingUrls.some(url => url.includes(`/execution-tasks/${autoRepairExecutionDetail.task.id}`)), 'Execution task landing should request the selected task detail.').toBe(true)
  expect(network.auditLandingQueries.some(query => {
    const params = new URLSearchParams(query)
    return params.get('resourceType') === 'AUTO_REPAIR'
      && params.get('resourceId') === String(repairId)
      && params.get('action') === 'AUTO_REPAIR_PATCH_READY'
      && params.get('status') === 'SUCCESS'
  }), 'Audit landing should request resource/action/status filtered audit logs.').toBe(true)
  expect(network.agentTaskLandingQueries.some(query => new URLSearchParams(query).get('scanTaskId') === String(scanTaskId)), 'Agent task landing should request scan-bound Agent tasks.').toBe(true)
  expect(network.toolCallLandingQueries.some(query => {
    const params = new URLSearchParams(query)
    return params.get('conversationId') === String(agentToolCalls[0].conversationId)
      && params.get('scanTaskId') === String(scanTaskId)
  }), 'Tool call landing should request conversation and scan scoped tool calls.').toBe(true)
  expect(actionLanding.allLandingPagesLoaded, 'Every clicked governance action should load its landing page.').toBe(true)
  expect(actionLanding.allSelectedOrFiltered, 'Every clicked governance action should select or filter the target record/context.').toBe(true)

  expect(network.scanExecutionSourceUrls.length, 'Scan execution source should be requested for each viewport.').toBeGreaterThanOrEqual(viewportMatrix.length)
  expect(network.scanExecutionSourceUrls.every(url => url.includes(`/source/SCAN_TASK/${scanTaskId}`)), 'Scan execution source URL should be scan-bound.').toBe(true)

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in scan governance timeline smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('SCAN_GOVERNANCE_TIMELINE_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: network.unhandledApiRequests.length,
    scanTaskId,
    foreignScanExcluded: true,
    actionLanding: {
      clickedActionCount: actionLanding.clickedActionCount,
      allLandingPagesLoaded: actionLanding.allLandingPagesLoaded,
      allSelectedOrFiltered: actionLanding.allSelectedOrFiltered,
      autoRepairSelected: actionLanding.autoRepairSelected,
      artifactSelected: actionLanding.artifactSelected,
      executionTaskSelected: actionLanding.executionTaskSelected,
      auditResourceFiltered: actionLanding.auditResourceFiltered,
      toolCallFiltered: actionLanding.toolCallFiltered,
      agentTaskSelected: actionLanding.agentTaskSelected,
      rawAgentTaskPayloadHidden: actionLanding.rawAgentTaskPayloadHidden,
      qaContextBound: actionLanding.qaContextBound,
    },
    stageRail: {
      visible: true,
      stages: governanceStageLabels,
      states: governanceStageStates,
    },
    candidateReceipt: {
      eventVisible: true,
      sourceTypeVisible: true,
      repairEvidenceGate: 'READY',
      repairEvidenceGateReason: candidateGateReason,
      repairEvidenceGateSource: 'SERVER_DERIVED',
      serverDerivedGateVisible: true,
      currentReceiptVisible: true,
      foreignReceiptHidden: true,
      autoRepairDeepLinkBound: true,
      sourceReportDeepLinkBound: true,
      qaReviewDeepLinkBound: true,
      actionLabels: ['打开修复详情', '打开来源报告', 'QA 复核来源'],
      noRawPromptOrAnswer: true,
    },
    prGate: {
      eventVisible: true,
      action: 'AUTO_REPAIR_PR_REJECTED',
      currentRepairVisible: true,
      foreignPrGateHidden: true,
      autoRepairDeepLinkBound: true,
      actionLabel: '打开修复详情',
      auditSourceBound: true,
      scanTaskIdBound: true,
      noRawPromptOrAnswer: true,
    },
    patchEvidence: {
      repairVisible: true,
      autoRepairId: repairId,
      repairStatus: 'PATCH_READY',
      scanTaskIdBound: true,
      targetFileVisible: true,
      diffVisible: true,
      patchArtifactVisible: true,
      patchArtifactOwnerType: 'AUTO_REPAIR',
      patchArtifactOwnerId: repairId,
      patchArtifactType: 'CHANGE_PATCH',
      patchArtifactActionVisible: true,
      patchArtifactActionLabel: '打开补丁产物',
      patchArtifactDeepLinkBound: true,
      repairExecutionVisible: true,
      repairExecutionSourceType: 'AUTO_REPAIR',
      repairExecutionSourceId: repairId,
      repairExecutionStatus: 'SUCCESS',
      repairExecutionActionLabel: '打开执行详情',
      repairExecutionDeepLinkBound: true,
      patchGenerationStepVisible: true,
      patchGenerationStepKey: 'generate_patch',
      patchGenerationStepStatus: 'SUCCESS',
      patchReadyAuditVisible: true,
      patchReadyAuditAction: 'AUTO_REPAIR_PATCH_READY',
      patchReadyAuditStatus: 'SUCCESS',
      patchReadyAuditActionLabel: '打开审计日志',
      patchReadyAuditDeepLinkBound: true,
      auditSourceBound: true,
      foreignPatchEvidenceHidden: true,
      noRawPromptOrAnswer: true,
    },
    agentReview: {
      currentAgentTaskVisible: true,
      currentAgentTaskId: agentTaskId,
      agentTaskActionLabel: '打开 Agent 任务',
      agentTaskDeepLinkBound: true,
      foreignAgentTaskHidden: true,
      toolCallAuditVisible: true,
      currentToolCallId: agentToolCallId,
      toolCallAuditActionLabel: '打开审计日志',
      toolCallAuditDeepLinkBound: true,
      foreignToolCallHidden: true,
      agentExecutionBound: true,
      currentAgentExecutionVisible: true,
      agentExecutionSourceType: 'AGENT_TASK',
      agentExecutionSourceId: agentTaskId,
      agentExecutionActionLabel: '打开执行详情',
      agentExecutionDeepLinkBound: true,
      scanTaskIdBound: true,
      noRawPromptOrAnswer: true,
    },
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    baseURLHost,
    spec: 'scan-governance-timeline-smoke.spec.ts',
  }))
})
