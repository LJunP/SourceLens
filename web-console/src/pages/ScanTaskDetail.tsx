import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, App, Card, Descriptions, Drawer, Input, List, Modal, Popconfirm, Progress, Space, Table, Tabs, Tag, Typography } from 'antd'
import {
  ApiOutlined,
  ArrowLeftOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ClusterOutlined,
  CodeOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ReloadOutlined,
  RobotOutlined,
  ScheduleOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { artifactApi, ArtifactRecord } from '../api/artifact'
import type { AgentTask } from '../api/agentTask'
import type { AgentToolCall } from '../api/agentToolCall'
import type { AuditLog } from '../api/audit'
import type { AutoRepair } from '../api/autoRepair'
import { codeChunkApi } from '../api/codeChunk'
import type { CodeChunkSearchItem, CodeChunkSearchResponse } from '../api/codeChunk'
import { executionTaskApi, ExecutionStep, ExecutionTaskDetail } from '../api/executionTask'
import { scanTaskApi, ScanTask } from '../api/scanTask'
import { scanGovernanceTimelineApi } from '../api/scanGovernanceTimeline'
import type { GovernanceEvent as ScanGovernanceEvent } from '../api/scanGovernanceTimeline'
import { formatApiError } from '../api/client'
import ArtifactLinkButton from '../components/ArtifactLinkButton'
import ActionButton from '../components/ui/ActionButton'
import StateBlock from '../components/ui/StateBlock'
import { redactSensitiveText, stringifyRedactedPayload } from '../utils/displayRedaction'
import DependencyGraphView from './DependencyGraph'

const { Text } = Typography

type ScanArtifactView = ArtifactRecord & {
  summaryJson?: string
}

type ScanTaskDetailViewState = 'INITIAL_LOADING' | 'FATAL_LOAD' | 'STALE_REFRESH' | 'READY'

interface ScanTaskDetailSnapshot {
  scanTaskId: number
  projectId: number
  generation: number
  capturedAt: string
  task: ScanTask
  execution: ExecutionTaskDetail | null
  artifacts: ScanArtifactView[]
  codeKnowledge: CodeChunkSearchResponse | null
}

interface ScanTaskDetailSurface {
  scanTaskId: number
  generation: number
  state: ScanTaskDetailViewState
  error: string | null
}

interface ScanRequestOwner {
  scanTaskId: number
  generation: number
  owner: number
}

type ReportSignalTone = 'ready' | 'warning' | 'danger' | 'idle'

interface ReportQualitySignal {
  label: string
  tone: ReportSignalTone
  confidence: number
  summary: string
  nextActions: string[]
  metrics: Array<{
    label: string
    value: string
    tone: ReportSignalTone
  }>
}

interface ReportEvidenceItem {
  key: string
  label: string
  value: string
  detail: string
  tone: ReportSignalTone
}

interface ReportEvidenceProfile {
  label: string
  tone: ReportSignalTone
  summary: string
  items: ReportEvidenceItem[]
  missingCoreArtifacts: string[]
}

interface ReportActionItem {
  key: string
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  tone: ReportSignalTone
  actionLabel: string
  disabled: boolean
  onClick: () => void
  onCopyLink?: () => void
}

interface ReportRecommendedStep {
  key: string
  tone: ReportSignalTone
  icon: React.ReactNode
  label: string
  title: string
  detail: string
  actionGateReason: string
  primaryLabel: string
  primaryDisabled?: boolean
  onPrimary: () => void
  secondaryLabel?: string
  secondaryDisabled?: boolean
  onSecondary?: () => void
}

interface ReportMainPathStep {
  key: string
  index: string
  tone: ReportSignalTone
  title: string
  detail: string
}

interface ReportTrustedLoopStep {
  key: string
  index: string
  tone: ReportSignalTone
  icon: React.ReactNode
  title: string
  owner: string
  value: string
  detail: string
  actionLabel: string
  disabled?: boolean
  onAction: () => void
}

interface ReportEvidencePriorityItem {
  key: string
  tone: ReportSignalTone
  label: string
  title: string
  summary: string
  meta: string
  actionLabel: string
  disabled?: boolean
  onOpen: () => void
  repairActionVisible: boolean
  repairGateReason: string
}

interface ReportTraceItem {
  key: string
  icon: React.ReactNode
  label: string
  value: string
  source: string
  detail: string
  tone: ReportSignalTone
  actionLabel: string
  disabled: boolean
  actionGateReason: string
  onOpen: () => void
  qaQuestion?: string
}

interface ReportReviewGateItem {
  key: string
  label: string
  value: string
  detail: string
  tone: ReportSignalTone
}

interface ReportEvidenceField {
  label: string
  value: string
}

interface ReportEvidenceDrawerData {
  key: string
  title: string
  category: string
  source: string
  summary: string
  tone: ReportSignalTone
  qaQuestion: string
  fields: ReportEvidenceField[]
  artifactTypes?: string[]
  filePath?: string
  lineNumber?: string
  startLine?: number
  endLine?: number
  repairRisk?: any
}

interface ReportCitationReadiness {
  status: 'READY' | 'REVIEW' | 'GAP'
  tone: ReportSignalTone
  title: string
  summary: string
  metrics: Array<{ label: string; value: string }>
  checks: Array<{ label: string; ok: boolean }>
}

interface ReportCitationQualityCheck {
  key: string
  label: string
  sourceSection: string
  status: string
  tone: ReportSignalTone
}

interface ReportCitationQualitySummary {
  status: 'READY' | 'REVIEW' | 'GAP'
  tone: ReportSignalTone
  title: string
  summary: string
  metrics: Array<{ label: string; value: string; tone: ReportSignalTone }>
  sourceSections: Array<{ section: string; label: string }>
  verdict: Array<{ label: string; value: string; tone: ReportSignalTone }>
  checks: ReportCitationQualityCheck[]
  narrativeBindings: ReportCitationQualityCheck[]
  nextAction: string
  boundary: string
}

interface CodeKnowledgeSignal {
  tone: ReportSignalTone
  title: string
  summary: string
  readinessLabel: string
  confidence: number
  totalChunks: number
  embeddedChunks: number
  embeddingCoverage: number
  retrievalMode: string
  nextAction: string
  sampleFile: string
}

function codeKnowledgeGate(signal: CodeKnowledgeSignal) {
  if (signal.totalChunks > 0) {
    return {
      ready: true,
      title: '代码知识库门禁已开放',
      detail: `${formatNumber(signal.totalChunks)} 个 code_chunks 可用于代码问答和切片检索；当前召回模式 ${signal.retrievalMode}，下一步：${signal.nextAction}。`,
    }
  }

  if (signal.readinessLabel === 'ERROR') {
    return {
      ready: false,
      title: '代码知识库门禁未开放',
      detail: 'code_chunks 状态读取失败，先重新读取状态；在状态恢复前，代码问答和切片检索入口保持关闭。',
    }
  }

  return {
    ready: false,
    title: '代码知识库门禁未开放',
    detail: `当前 code_chunks 为 0，先完成扫描的 chunk_code 步骤或检查切片落库；下一步：${signal.nextAction}。`,
  }
}

interface ReportGovernanceSnapshot {
  autoRepairs: AutoRepair[]
  agentTasks: AgentTask[]
  agentToolCalls: AgentToolCall[]
  auditLogs: AuditLog[]
  artifacts: ArtifactRecord[]
  repairExecutions: ExecutionTaskDetail[]
  agentExecutions: ExecutionTaskDetail[]
  timelineEvents: ScanGovernanceEvent[]
}

interface ReportGovernanceCard {
  key: string
  label: string
  value: string
  detail: string
  tone: ReportSignalTone
}

interface ReportGovernanceEvent {
  key: string
  source: string
  title: string
  detail: string
  status: string
  tone: ReportSignalTone
  timestamp: string | null
  actionLabel: string
  onOpen: () => void
  targetUrl?: string
  actions?: ReportGovernanceEventAction[]
  repairEvidenceGate?: string | null
  repairEvidenceGateReason?: string | null
  repairEvidenceGateSource?: string | null
}

interface ReportGovernanceEventAction {
  key: string
  label: string
  onOpen: () => void
  targetUrl?: string
}

interface ReportGovernanceStage {
  key: string
  label: string
  state: 'ready' | 'running' | 'blocked' | 'empty'
  stateLabel: string
  reason: string
  actionLabel: string
  icon: React.ReactNode
  disabled?: boolean
  onAction: () => void
}

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: 'success',
  FAILED: 'error',
  RUNNING: 'processing',
  PENDING: 'warning',
  CANCELLED: 'default',
}

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
  RUNNING: '运行中',
  PENDING: '排队中',
  CANCELLED: '已取消',
}

const STEP_LABEL: Record<string, string> = {
  pending: '排队中',
  prepare_repository: '准备仓库',
  analyze_code: '代码逆向分析',
  chunk_code: '生成 code_chunks',
  finalize_scan: '收尾归档',
  generate_patch: '生成补丁',
  generate_report: '生成 Agent 报告',
}

const ARTIFACT_TITLES: Record<string, string> = {
  ARCHITECTURE_OVERVIEW: '架构概览',
  ARCHITECTURE_REPORT: '架构分析报告',
  DEPENDENCY_GRAPH: '依赖分析',
  API_CATALOG: 'API 目录',
  DB_SCHEMA: '数据库 Schema',
  CODE_METRICS: '代码指标',
  RISK_REPORT: '风险报告',
  RAW_SCAN_RESULT: '原始扫描数据',
  CHANGE_PATCH: '代码补丁',
  AGENT_REPORT: 'Agent 报告',
}

const CORE_REPORT_ARTIFACTS = ['ARCHITECTURE_REPORT', 'ARCHITECTURE_OVERVIEW', 'DEPENDENCY_GRAPH', 'CODE_METRICS']

class ScanOwnershipError extends Error {}

function sameScanTaskId(left: number, right: number) {
  return Object.is(left, right)
}

function assertOwnedScanTask(task: ScanTask | null | undefined, scanTaskId: number, projectId?: number) {
  if (!task || Number(task.id) !== scanTaskId || Number(task.projectId) <= 0) {
    throw new ScanOwnershipError(`扫描任务响应归属不匹配：期望 Scan #${scanTaskId}`)
  }
  if (projectId !== undefined && Number(task.projectId) !== projectId) {
    throw new ScanOwnershipError(`扫描任务响应项目归属不匹配：期望 Project #${projectId}`)
  }
}

function assertOwnedArtifact(record: ArtifactRecord | null | undefined, projectId: number, scanTaskId: number, artifactId?: number) {
  if (
    !record
    || Number(record.projectId) !== projectId
    || record.ownerType !== 'SCAN_TASK'
    || Number(record.ownerId) !== scanTaskId
    || (artifactId !== undefined && Number(record.id) !== artifactId)
  ) {
    throw new ScanOwnershipError(`扫描产物响应归属不匹配：期望 Project #${projectId} / Scan #${scanTaskId}`)
  }
}

function isOwnedExecutionDetail(
  execution: ExecutionTaskDetail | null | undefined,
  projectId: number,
  sourceType: string,
  sourceId: number,
) {
  if (!execution) return false
  const executionTaskId = Number(execution.task?.id)
  if (
    !Number.isInteger(executionTaskId)
    || executionTaskId <= 0
    || Number(execution.task?.projectId) !== projectId
    || execution.task?.sourceType !== sourceType
    || Number(execution.task?.sourceId) !== sourceId
    || !Array.isArray(execution.attempts)
    || !Array.isArray(execution.steps)
    || !Array.isArray(execution.logs)
  ) {
    return false
  }
  const attemptIds = new Set(execution.attempts.map(attempt => Number(attempt.id)))
  const currentAttemptId = execution.task.currentAttemptId
  const nestedOwnershipMismatch = execution.attempts.some(attempt => (
    !Number.isInteger(Number(attempt.id))
    || Number(attempt.id) <= 0
    || Number(attempt.taskId) !== executionTaskId
  )) || execution.steps.some(step => (
    Number(step.taskId) !== executionTaskId
    || (step.attemptId != null && !attemptIds.has(Number(step.attemptId)))
  )) || execution.logs.some(log => (
    Number(log.taskId) !== executionTaskId
    || (log.attemptId != null && !attemptIds.has(Number(log.attemptId)))
  )) || (currentAttemptId != null && !attemptIds.has(Number(currentAttemptId)))
  return !nestedOwnershipMismatch
}

function assertOwnedExecution(
  execution: ExecutionTaskDetail | null,
  projectId: number,
  sourceType: string,
  sourceId: number,
) {
  if (!execution) return
  if (!isOwnedExecutionDetail(execution, projectId, sourceType, sourceId)) {
    throw new ScanOwnershipError(`执行详情响应归属不匹配：期望 Project #${projectId} / ${sourceType} #${sourceId}`)
  }
}

function assertOwnedCodeKnowledge(value: CodeChunkSearchResponse | null | undefined, scanTaskId: number) {
  if (
    !value
    || Number(value.scanTaskId) !== scanTaskId
    || !Array.isArray(value.items)
    || value.items.some(item => Number(item.scanTaskId) !== scanTaskId)
  ) {
    throw new ScanOwnershipError(`code_chunks 响应归属不匹配：期望 Scan #${scanTaskId}`)
  }
}

function scanLoadError(error: unknown, fallback: string) {
  return error instanceof ScanOwnershipError ? error.message : formatApiError(error, fallback)
}

function reportMetricNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export default function ScanTaskDetail() {
  const { id } = useParams<{ id: string }>()
  const taskId = Number(id)
  const navigate = useNavigate()
  const { message: messageApi } = App.useApp()
  const [snapshot, setSnapshot] = useState<ScanTaskDetailSnapshot | null>(null)
  const [surface, setSurface] = useState<ScanTaskDetailSurface>({
    scanTaskId: taskId,
    generation: 0,
    state: 'INITIAL_LOADING',
    error: null,
  })
  const [fullPendingOwner, setFullPendingOwner] = useState<ScanRequestOwner | null>(null)
  const [cancelPendingOwner, setCancelPendingOwner] = useState<ScanRequestOwner | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [activeReportTab, setActiveReportTab] = useState('summary')
  const [codeKnowledgeError, setCodeKnowledgeError] = useState<string | null>(null)
  const [codeKnowledgePendingOwner, setCodeKnowledgePendingOwner] = useState<ScanRequestOwner | null>(null)
  const [pollRestartEpoch, setPollRestartEpoch] = useState(0)
  const activeTaskIdRef = useRef(taskId)
  const routeGenerationRef = useRef(0)
  const coreSeqRef = useRef(0)
  const detailSeqRef = useRef(0)
  const refreshOwnerSeqRef = useRef(0)
  const cancelOwnerSeqRef = useRef(0)
  const codeKnowledgeOwnerSeqRef = useRef(0)
  const fullRefreshOwnerRef = useRef<number | null>(null)
  const activeCodeKnowledgeOwnerRef = useRef<number | null>(null)
  const trustedSnapshotRef = useRef<ScanTaskDetailSnapshot | null>(null)
  activeTaskIdRef.current = taskId

  const runFullLoad = useCallback(async (expectedTaskId: number, expectedGeneration: number) => {
    if (!sameScanTaskId(activeTaskIdRef.current, expectedTaskId) || routeGenerationRef.current !== expectedGeneration) return

    const owner = refreshOwnerSeqRef.current + 1
    refreshOwnerSeqRef.current = owner
    fullRefreshOwnerRef.current = owner
    const coreSeq = coreSeqRef.current + 1
    coreSeqRef.current = coreSeq
    const detailSeq = detailSeqRef.current + 1
    detailSeqRef.current = detailSeq
    const requestOwner = { scanTaskId: expectedTaskId, generation: expectedGeneration, owner }
    setFullPendingOwner(requestOwner)
    codeKnowledgeOwnerSeqRef.current += 1
    activeCodeKnowledgeOwnerRef.current = null
    setCodeKnowledgePendingOwner(null)
    setExecutionError(null)
    setPreviewError(null)
    setCodeKnowledgeError(null)

    const isCoreCurrent = () => (
      sameScanTaskId(activeTaskIdRef.current, expectedTaskId)
      && routeGenerationRef.current === expectedGeneration
      && coreSeqRef.current === coreSeq
      && fullRefreshOwnerRef.current === owner
    )
    const isDetailCurrent = () => isCoreCurrent() && detailSeqRef.current === detailSeq

    try {
      if (!Number.isInteger(expectedTaskId) || expectedTaskId <= 0) {
        throw new ScanOwnershipError('扫描任务 ID 无效，无法加载报告。')
      }

      const taskRes = await scanTaskApi.detail(expectedTaskId)
      if (!isCoreCurrent()) return
      const nextTask = taskRes.data.data
      assertOwnedScanTask(nextTask, expectedTaskId)
      const projectId = Number(nextTask.projectId)

      const artifactRes = await artifactApi.list(projectId, { ownerType: 'SCAN_TASK', ownerId: expectedTaskId })
      if (!isCoreCurrent()) return
      const rawRecords = artifactRes.data.data
      if (!Array.isArray(rawRecords)) {
        throw new ScanOwnershipError('扫描产物列表响应格式无效。')
      }
      rawRecords.forEach(record => assertOwnedArtifact(record, projectId, expectedTaskId))

      const previewPromise = Promise.all(rawRecords.map(async (record): Promise<{ artifact: ScanArtifactView; error: string | null }> => {
        try {
          const previewRes = await artifactApi.preview(projectId, record.id)
          if (!isDetailCurrent()) return { artifact: record, error: null }
          const preview = previewRes.data.data
          assertOwnedArtifact(preview?.record, projectId, expectedTaskId, record.id)
          return { artifact: { ...record, summaryJson: preview.text }, error: null }
        } catch (error) {
          if (error instanceof ScanOwnershipError) throw error
          return {
            artifact: record,
            error: formatApiError(error, `加载${ARTIFACT_TITLES[record.artifactType] || record.artifactType}预览失败`),
          }
        }
      }))
      const executionPromise: Promise<{ value: ExecutionTaskDetail | null; error: string | null }> = executionTaskApi
        .detailBySource(projectId, 'SCAN_TASK', expectedTaskId)
        .then(response => {
          if (!isDetailCurrent()) return { value: null, error: null }
          const value = response.data.data || null
          try {
            assertOwnedExecution(value, projectId, 'SCAN_TASK', expectedTaskId)
            return { value, error: null }
          } catch (error) {
            return { value: null, error: scanLoadError(error, '加载执行详情失败') }
          }
        })
        .catch(error => ({ value: null, error: scanLoadError(error, '加载执行详情失败') }))
      const codeKnowledgePromise: Promise<{ value: CodeChunkSearchResponse | null; error: string | null }> = codeChunkApi
        .status(projectId, { scanTaskId: expectedTaskId, limit: 1 })
        .then(response => {
          if (!isDetailCurrent()) return { value: null, error: null }
          const value = response.data.data
          try {
            assertOwnedCodeKnowledge(value, expectedTaskId)
            return { value, error: null }
          } catch (error) {
            return { value: null, error: scanLoadError(error, '加载 code_chunks 状态失败') }
          }
        })
        .catch(error => ({ value: null, error: scanLoadError(error, '加载 code_chunks 状态失败') }))

      const [previewResults, executionResult, codeKnowledgeResult] = await Promise.all([
        previewPromise,
        executionPromise,
        codeKnowledgePromise,
      ])
      if (!isDetailCurrent()) return
      const previews = previewResults.map(result => result.artifact)
      const previewErrors = previewResults.flatMap(result => result.error ? [result.error] : [])

      const trusted = trustedSnapshotRef.current
      const canPreserveTrustedSnapshot = Boolean(
        trusted
        && trusted.scanTaskId === expectedTaskId
        && trusted.task.id === expectedTaskId
        && trusted.projectId === projectId
        && trusted.generation === expectedGeneration
      )
      if (previewErrors.length > 0 && canPreserveTrustedSnapshot) {
        const previewError = previewErrors.join('；')
        setExecutionError(executionResult.error)
        setPreviewError(previewError)
        setCodeKnowledgeError(codeKnowledgeResult.error)
        setSurface({
          scanTaskId: expectedTaskId,
          generation: expectedGeneration,
          state: 'STALE_REFRESH',
          error: previewError,
        })
        return
      }

      const nextSnapshot: ScanTaskDetailSnapshot = {
        scanTaskId: expectedTaskId,
        projectId,
        generation: expectedGeneration,
        capturedAt: new Date().toISOString(),
        task: nextTask,
        execution: executionResult.value,
        artifacts: previews,
        codeKnowledge: codeKnowledgeResult.value,
      }
      trustedSnapshotRef.current = nextSnapshot
      setSnapshot(nextSnapshot)
      setExecutionError(executionResult.error)
      setPreviewError(previewErrors.length > 0 ? previewErrors.join('；') : null)
      setCodeKnowledgeError(codeKnowledgeResult.error)
      setSurface({
        scanTaskId: expectedTaskId,
        generation: expectedGeneration,
        state: 'READY',
        error: null,
      })
      if (['PENDING', 'RUNNING'].includes(nextTask.status)) {
        setPollRestartEpoch(epoch => epoch + 1)
      }
    } catch (error) {
      if (!isDetailCurrent()) return
      const trusted = trustedSnapshotRef.current
      const hasTrustedSnapshot = Boolean(
        trusted
        && trusted.scanTaskId === expectedTaskId
        && trusted.generation === expectedGeneration
        && trusted.task.id === expectedTaskId
      )
      setSurface({
        scanTaskId: expectedTaskId,
        generation: expectedGeneration,
        state: hasTrustedSnapshot ? 'STALE_REFRESH' : 'FATAL_LOAD',
        error: scanLoadError(error, '加载扫描任务失败'),
      })
    } finally {
      if (
        sameScanTaskId(activeTaskIdRef.current, expectedTaskId)
        && routeGenerationRef.current === expectedGeneration
        && fullRefreshOwnerRef.current === owner
      ) {
        fullRefreshOwnerRef.current = null
        setFullPendingOwner(current => current?.owner === owner ? null : current)
      }
    }
  }, [])

  useEffect(() => {
    const generation = routeGenerationRef.current + 1
    routeGenerationRef.current = generation
    coreSeqRef.current += 1
    detailSeqRef.current += 1
    cancelOwnerSeqRef.current += 1
    codeKnowledgeOwnerSeqRef.current += 1
    fullRefreshOwnerRef.current = null
    activeCodeKnowledgeOwnerRef.current = null
    trustedSnapshotRef.current = null
    setSnapshot(null)
    setSurface({ scanTaskId: taskId, generation, state: 'INITIAL_LOADING', error: null })
    setFullPendingOwner(null)
    setCancelPendingOwner(null)
    setExecutionError(null)
    setPreviewError(null)
    setCodeKnowledgeError(null)
    setCodeKnowledgePendingOwner(null)
    setActiveReportTab('summary')
    void runFullLoad(taskId, generation)

    return () => {
      routeGenerationRef.current += 1
      coreSeqRef.current += 1
      detailSeqRef.current += 1
      cancelOwnerSeqRef.current += 1
      codeKnowledgeOwnerSeqRef.current += 1
      fullRefreshOwnerRef.current = null
      activeCodeKnowledgeOwnerRef.current = null
      trustedSnapshotRef.current = null
    }
  }, [runFullLoad, taskId])

  const pollCore = useCallback(async () => {
    if (fullRefreshOwnerRef.current !== null) return true
    const trusted = trustedSnapshotRef.current
    if (
      !trusted
      || trusted.scanTaskId !== taskId
      || trusted.generation !== routeGenerationRef.current
      || !['PENDING', 'RUNNING'].includes(trusted.task.status)
    ) return false

    const expectedGeneration = trusted.generation
    const coreSeq = coreSeqRef.current + 1
    coreSeqRef.current = coreSeq
    const isCurrent = () => (
      sameScanTaskId(activeTaskIdRef.current, taskId)
      && routeGenerationRef.current === expectedGeneration
      && coreSeqRef.current === coreSeq
      && fullRefreshOwnerRef.current === null
    )

    try {
      const response = await scanTaskApi.detail(taskId)
      if (!isCurrent()) return false
      const nextTask = response.data.data
      const latest = trustedSnapshotRef.current
      if (
        !latest
        || latest.scanTaskId !== taskId
        || latest.generation !== expectedGeneration
        || latest.projectId !== trusted.projectId
      ) return false
      assertOwnedScanTask(nextTask, taskId, latest.projectId)
      if (nextTask.status !== latest.task.status) {
        await runFullLoad(taskId, expectedGeneration)
        return false
      }
      const nextSnapshot = { ...latest, task: nextTask }
      trustedSnapshotRef.current = nextSnapshot
      setSnapshot(nextSnapshot)
      return ['PENDING', 'RUNNING'].includes(nextTask.status)
    } catch (error) {
      if (!isCurrent()) return false
      setSurface({
        scanTaskId: taskId,
        generation: expectedGeneration,
        state: 'STALE_REFRESH',
        error: scanLoadError(error, '刷新扫描任务失败'),
      })
      return false
    }
  }, [runFullLoad, taskId])

  const ownedSnapshot = snapshot?.scanTaskId === taskId && snapshot.task.id === taskId ? snapshot : null
  const ownedSurface = sameScanTaskId(surface.scanTaskId, taskId)
    ? surface
    : { scanTaskId: taskId, generation: routeGenerationRef.current, state: 'INITIAL_LOADING' as const, error: null }
  const task = ownedSnapshot?.task || null
  const execution = ownedSnapshot?.execution || null
  const artifacts = ownedSnapshot?.artifacts || []
  const codeKnowledge = ownedSnapshot?.codeKnowledge || null
  const isFullPending = Boolean(
    fullPendingOwner
    && sameScanTaskId(fullPendingOwner.scanTaskId, taskId)
    && fullPendingOwner.generation === routeGenerationRef.current
    && fullRefreshOwnerRef.current === fullPendingOwner.owner
  )
  const refreshing = Boolean(isFullPending && ownedSnapshot)
  const codeKnowledgeReloading = Boolean(
    codeKnowledgePendingOwner
    && codeKnowledgePendingOwner.scanTaskId === taskId
    && codeKnowledgePendingOwner.generation === routeGenerationRef.current
    && activeCodeKnowledgeOwnerRef.current === codeKnowledgePendingOwner.owner
    && codeKnowledgeOwnerSeqRef.current === codeKnowledgePendingOwner.owner
  )

  useEffect(() => {
    if (ownedSurface.state !== 'READY' || !task || !['PENDING', 'RUNNING'].includes(task.status)) return undefined
    let cancelled = false
    let timer: number | undefined
    const schedule = () => {
      timer = window.setTimeout(async () => {
        if (cancelled) return
        const shouldContinue = await pollCore()
        if (!cancelled && shouldContinue) schedule()
      }, 3000)
    }
    schedule()
    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [ownedSurface.state, pollCore, pollRestartEpoch, task?.status])

  const reloadCurrent = useCallback(() => {
    void runFullLoad(taskId, routeGenerationRef.current)
  }, [runFullLoad, taskId])

  const reloadCodeKnowledge = useCallback(async () => {
    if (fullRefreshOwnerRef.current !== null) return
    const trusted = trustedSnapshotRef.current
    const generation = routeGenerationRef.current
    if (
      !trusted
      || trusted.scanTaskId !== taskId
      || trusted.task.id !== taskId
      || trusted.generation !== generation
      || trusted.projectId <= 0
      || !sameScanTaskId(activeTaskIdRef.current, taskId)
    ) return

    const projectId = trusted.projectId
    const owner = codeKnowledgeOwnerSeqRef.current + 1
    codeKnowledgeOwnerSeqRef.current = owner
    activeCodeKnowledgeOwnerRef.current = owner
    setCodeKnowledgePendingOwner({ scanTaskId: taskId, generation, owner })
    const isCurrent = () => {
      const current = trustedSnapshotRef.current
      return Boolean(
        sameScanTaskId(activeTaskIdRef.current, taskId)
        && routeGenerationRef.current === generation
        && fullRefreshOwnerRef.current === null
        && codeKnowledgeOwnerSeqRef.current === owner
        && activeCodeKnowledgeOwnerRef.current === owner
        && current
        && current.scanTaskId === taskId
        && current.task.id === taskId
        && current.projectId === projectId
        && current.generation === generation
      )
    }

    try {
      const response = await codeChunkApi.status(projectId, { scanTaskId: taskId, limit: 1 })
      if (!isCurrent()) return
      const value = response.data.data
      assertOwnedCodeKnowledge(value, taskId)
      const current = trustedSnapshotRef.current!
      const nextSnapshot = { ...current, codeKnowledge: value }
      trustedSnapshotRef.current = nextSnapshot
      setSnapshot(nextSnapshot)
      setCodeKnowledgeError(null)
    } catch (error) {
      if (isCurrent()) {
        setCodeKnowledgeError(scanLoadError(error, '加载 code_chunks 状态失败'))
      }
    } finally {
      if (activeCodeKnowledgeOwnerRef.current === owner) {
        activeCodeKnowledgeOwnerRef.current = null
        setCodeKnowledgePendingOwner(current => current?.owner === owner ? null : current)
      }
    }
  }, [taskId])

  const reportArtifact = artifacts.find(item => item.artifactType === 'ARCHITECTURE_REPORT')
  const reportData = useMemo(() => parseJson(reportArtifact?.summaryJson), [reportArtifact?.summaryJson])
  const overview = reportData?.overview || {}
  const modules = reportData?.modules || {}
  const codeQuality = reportData?.codeQuality || {}
  const hasParsedReport = Boolean(reportData && typeof reportData === 'object' && !Array.isArray(reportData))
  const hasConfirmedRiskArray = hasParsedReport && Array.isArray(codeQuality.risks)
  const riskCount = hasConfirmedRiskArray ? codeQuality.risks.length : null
  const apiRouteCount = hasParsedReport && Array.isArray(reportData?.apiRoutes) ? reportData.apiRoutes.length : null
  const dbEntityCount = hasParsedReport && Array.isArray(reportData?.dbEntities) ? reportData.dbEntities.length : null
  const moduleValues = ['controllers', 'services', 'repositories', 'entities'].map(key => reportMetricNumber(modules[key]))
  const moduleCount = hasParsedReport && moduleValues.every(value => value !== null)
    ? moduleValues.reduce<number>((total, value) => total + (value || 0), 0)
    : null
  const fileCount = hasParsedReport ? reportMetricNumber(overview.totalFiles) : null
  const progress = execution?.task?.progress ?? taskProgress(task?.status)
  const isActiveTask = Boolean(task && ['PENDING', 'RUNNING'].includes(task.status))
  const currentStep = execution?.task?.currentStep || (task?.status === 'PENDING' ? 'pending' : null)
  const verifiedSteps = execution?.steps || []
  const codeKnowledgeSignal = buildCodeKnowledgeSignal(codeKnowledge, task?.status, codeKnowledgeError)

  const handleCancel = async () => {
    const trusted = trustedSnapshotRef.current
    const generation = routeGenerationRef.current
    if (
      !trusted
      || trusted.scanTaskId !== taskId
      || trusted.task.id !== taskId
      || trusted.generation !== generation
      || !sameScanTaskId(activeTaskIdRef.current, taskId)
    ) {
      messageApi.warning('当前扫描上下文已变化，请重新加载后再取消。')
      return
    }
    const owner = cancelOwnerSeqRef.current + 1
    cancelOwnerSeqRef.current = owner
    const requestOwner = { scanTaskId: taskId, generation, owner }
    setCancelPendingOwner(requestOwner)
    const isCurrent = () => (
      sameScanTaskId(activeTaskIdRef.current, taskId)
      && routeGenerationRef.current === generation
      && cancelOwnerSeqRef.current === owner
    )
    try {
      const response = await scanTaskApi.cancel(taskId)
      if (!isCurrent()) return
      assertOwnedScanTask(response.data.data, taskId, trusted.projectId)
      messageApi.success('扫描任务已取消')
      await runFullLoad(taskId, generation)
    } catch (error) {
      if (isCurrent()) messageApi.error(scanLoadError(error, '取消扫描任务失败'))
    } finally {
      if (isCurrent()) {
        setCancelPendingOwner(current => current?.owner === owner ? null : current)
      }
    }
  }

  const cancelling = Boolean(
    cancelPendingOwner
    && cancelPendingOwner.scanTaskId === taskId
    && cancelPendingOwner.generation === routeGenerationRef.current
    && cancelOwnerSeqRef.current === cancelPendingOwner.owner
  )

  if (ownedSurface.state === 'INITIAL_LOADING' || (!ownedSnapshot && ownedSurface.state !== 'FATAL_LOAD')) {
    return (
      <div
        className="sl-scan-first-viewport-state sl-scan-first-viewport-loading"
        data-sl-scan-state="INITIAL_LOADING"
        data-sl-scan-id={taskId}
        data-sl-primary-count="0"
      >
        <StateBlock tone="loading" title="正在加载扫描报告" description="系统正在读取扫描任务、执行步骤、产物和 code_chunks 状态。" />
      </div>
    )
  }

  if (ownedSurface.state === 'FATAL_LOAD') {
    return (
      <div
        className="sl-scan-first-viewport-state sl-scan-first-viewport-fatal"
        data-sl-scan-state="FATAL_LOAD"
        data-sl-scan-id={taskId}
        data-sl-primary-count="1"
      >
        <StateBlock
          tone="error"
          title="扫描报告加载失败"
          description={ownedSurface.error || '当前扫描任务或产物归属无法建立可信快照。'}
          action={(
            <ActionButton
              type="primary"
              icon={<ReloadOutlined spin={isFullPending} />}
              loading={isFullPending}
              onClick={reloadCurrent}
              label="重新加载扫描报告"
            />
          )}
        />
      </div>
    )
  }

  const isStale = ownedSurface.state === 'STALE_REFRESH'

  return (
    <div
      className={`sl-scan-detail-state sl-scan-detail-state-${ownedSurface.state.toLowerCase()}`}
      data-sl-scan-state={ownedSurface.state}
      data-sl-scan-id={taskId}
      data-sl-primary-count={isStale ? '1' : undefined}
    >
      <div className={`sl-scan-cockpit ${isStale ? 'sl-scan-cockpit-stale' : ''}`}>
        <section className="sl-scan-cockpit-main">
          <ActionButton aria-label="返回上一页" icon={<ArrowLeftOutlined />} className="sl-scan-back-button" onClick={() => navigate(-1)} label="返回" />
          <div className="sl-kicker">Scan Task #{taskId}</div>
          <div className="sl-scan-title-row">
            <div>
              <h1 className="sl-scan-title">仓库逆向分析报告</h1>
              <p className="sl-scan-desc">
                从仓库克隆、代码结构解析、符号图谱、报告产物到 code_chunks 生成的完整执行视图。
              </p>
            </div>
            <Tag color={STATUS_COLOR[task?.status || ''] || 'default'} className="sl-scan-status-tag">
              {STATUS_LABEL[task?.status || ''] || task?.status || '-'}
            </Tag>
          </div>

          <div className="sl-scan-status-line">
            <span className={`sl-live-dot ${isActiveTask ? 'sl-live-dot-running' : ''}`} />
            <span>{isActiveTask ? `正在执行：${formatStepLabel(currentStep)}` : `当前阶段：${formatStepLabel(currentStep)}`}</span>
            <span>{artifacts.length} artifacts</span>
            {hasParsedReport && <span>{formatNumber(fileCount)} files</span>}
          </div>

          {isStale && (
            <div className="sl-scan-stale-rail">
              <StateBlock
                compact
                tone="warning"
                title="当前显示上次可信快照"
                description={`快照保存于 ${formatTime(ownedSnapshot?.capturedAt)}。本次同步失败：${ownedSurface.error || '扫描任务或产物暂时不可用。'}`}
                action={(
                  <ActionButton
                    type="primary"
                    icon={<ReloadOutlined spin={refreshing} />}
                    loading={refreshing}
                    onClick={reloadCurrent}
                    label="重新同步"
                  />
                )}
              />
            </div>
          )}

          <Progress percent={progress} status={task?.status === 'FAILED' ? 'exception' : task?.status === 'SUCCESS' ? 'success' : 'active'} />

          <div className="sl-scan-meta-strip">
            <ScanMeta label="分支" value={task?.branch || '-'} />
            <ScanMeta label="Commit" value={task?.commitSha ? task.commitSha.substring(0, 12) : '-'} />
            <ScanMeta label="触发方式" value={task?.triggerType || '-'} />
            <ScanMeta label="执行任务" value={execution?.task ? `#${execution.task.id}` : '-'} />
            <ScanMeta label="开始时间" value={formatTime(task?.startedAt)} />
            <ScanMeta label="结束时间" value={formatTime(task?.finishedAt)} />
          </div>

          {!isStale && <div className="sl-scan-cockpit-actions">
            {task?.projectId && (
              <ActionButton
                aria-label={`返回项目 #${task.projectId} 工作台`}
                icon={<BranchesOutlined />}
                onClick={() => navigate(`/projects/${task.projectId}`)}
                label="项目工作台"
              />
            )}
            <ActionButton aria-label={`刷新扫描 #${taskId} 报告`} icon={<ReloadOutlined spin={refreshing} />} onClick={reloadCurrent} label="刷新" />
            {task?.projectId && execution?.task && (
              <ActionButton
                aria-label={`查看扫描 #${taskId} 的执行详情`}
                icon={<ScheduleOutlined />}
                onClick={() => navigate(`/execution-tasks?projectId=${task.projectId}&taskId=${execution.task.id}`)}
                label="执行详情"
              />
            )}
            {task?.projectId && (
              <ArtifactLinkButton projectId={task.projectId} ownerType="SCAN_TASK" ownerId={taskId} size="middle" label="产物库" />
            )}
            {task?.projectId && (
              <ActionButton
                aria-label={`查看扫描 #${taskId} 的审计追踪`}
                icon={<SafetyCertificateOutlined />}
                onClick={() => navigate(scanAuditUrl(task.projectId, taskId))}
                label="审计追踪"
              />
            )}
            {isActiveTask && (
              <Popconfirm
                title="取消扫描任务"
                description="当前步骤会在下一个检查点停止。"
                okText="取消任务"
                cancelText="返回"
                onConfirm={handleCancel}
              >
                <ActionButton aria-label={`取消扫描 #${taskId}`} danger icon={<StopOutlined />} loading={cancelling} label="取消" />
              </Popconfirm>
            )}
          </div>}

          {!isStale && task?.errorMessage && (
            <Alert type="error" showIcon message="扫描失败" description={task.errorMessage} style={{ marginTop: 16 }} />
          )}
        </section>

        {!isStale && <section className="sl-scan-evidence-panel">
          <div className="sl-scan-evidence-head">
            <div>
              <span>Analysis evidence</span>
              <strong>{riskCount === null ? '风险状态不可用' : riskCount > 0 ? `${riskCount} 个风险项` : '未识别到显著风险'}</strong>
            </div>
            <WarningOutlined />
          </div>
          <div className="sl-scan-evidence-grid">
            <ScanEvidenceMetric icon={<FileSearchOutlined />} label="文件" value={fileCount ?? '-'} />
            <ScanEvidenceMetric icon={<BranchesOutlined />} label="模块" value={moduleCount ?? '-'} />
            <ScanEvidenceMetric icon={<ApiOutlined />} label="API" value={apiRouteCount ?? '-'} />
            <ScanEvidenceMetric icon={<DatabaseOutlined />} label="实体" value={dbEntityCount ?? '-'} />
          </div>
          <div className="sl-scan-evidence-actions">
            <ActionButton disabled={!hasConfirmedRiskArray} onClick={() => setActiveReportTab('quality')} label="风险" />
            <ActionButton disabled={!hasConfirmedRiskArray} onClick={() => setActiveReportTab('api')} label="API" />
            <ActionButton disabled={!hasConfirmedRiskArray} onClick={() => setActiveReportTab('db')} label="数据库" />
            <ActionButton disabled={!hasConfirmedRiskArray} onClick={() => setActiveReportTab('graph')} label="依赖图谱" />
          </div>
        </section>}
      </div>

      {!isStale && executionError && (
        <Alert
          type="warning"
          showIcon
          message="执行详情暂时不可用"
          description={executionError}
          action={<ActionButton size="small" icon={<ReloadOutlined spin={refreshing} />} onClick={reloadCurrent} label="重新读取执行详情" />}
          style={{ marginBottom: 14 }}
        />
      )}

      {!isStale && previewError && (
        <Alert
          type="warning"
          showIcon
          message="报告产物预览暂时不可用"
          description={previewError}
          action={<ActionButton size="small" icon={<ReloadOutlined spin={refreshing} />} onClick={reloadCurrent} label="重新加载报告预览" />}
          style={{ marginBottom: 14 }}
        />
      )}

      {!isStale && isActiveTask && (
        <Alert
          type="info"
          showIcon
          message={`正在执行：${formatStepLabel(currentStep)}`}
          description="页面会每 3 秒刷新一次任务状态；扫描完成后报告、依赖图谱和产物库会自动可用。"
          style={{ marginBottom: 14 }}
        />
      )}

      {!isStale && <>{verifiedSteps.length > 0 ? (
        <div className="sl-scan-step-grid" aria-label="扫描执行阶段">
          {verifiedSteps.map((step, index) => (
            <ScanStepCard key={step.stepKey} step={step} index={index + 1} />
          ))}
        </div>
      ) : (
        <Card className="sl-section-card sl-scan-step-evidence-missing">
          <StateBlock
            compact
            tone="warning"
            title="执行步骤证据未提供"
            description="当前执行详情没有返回步骤记录；页面不会把预期流程伪装成已排队或已执行状态。"
          />
        </Card>
      )}

      <CodeKnowledgePanel
        signal={codeKnowledgeSignal}
        loading={refreshing || codeKnowledgeReloading}
        error={codeKnowledgeError}
        onRetry={reloadCodeKnowledge}
        onOpenQa={() => task?.projectId && navigate(projectQaUrl(task.projectId, null, taskId))}
        onOpenChunks={() => task?.projectId && navigate(projectQaUrl(task.projectId, null, taskId))}
        onOpenArtifacts={() => task?.projectId && navigate(`/artifacts?projectId=${task.projectId}&ownerType=SCAN_TASK&ownerId=${taskId}`)}
      />

      {task?.status === 'FAILED' ? (
        <Card className="sl-section-card">
          <StateBlock tone="error" title="扫描任务失败" description="当前扫描没有可采信报告，请先查看执行详情和日志。" />
        </Card>
      ) : hasConfirmedRiskArray ? (
        <ArchitectureReport
          data={reportData}
          scanTaskId={taskId}
          projectId={task?.projectId || 0}
          repositoryId={task?.repositoryId || 0}
          executionTaskId={execution?.task?.id || null}
          execution={execution}
          artifacts={artifacts}
          taskStatus={task?.status || 'UNKNOWN'}
          progress={progress}
          codeKnowledgeSignal={codeKnowledgeSignal}
          activeTab={activeReportTab}
          onTabChange={setActiveReportTab}
        />
      ) : artifacts.length > 0 ? (
        <ArtifactFallback projectId={task?.projectId || 0} scanTaskId={taskId} artifacts={artifacts} />
      ) : isActiveTask ? (
        <Card className="sl-section-card">
          <StateBlock tone="loading" title="扫描执行中" description="报告会在分析和切片完成后生成。" />
        </Card>
      ) : (
        <div className="sl-empty-panel">
          <StateBlock title="暂无分析产物" description="扫描完成后会自动生成报告、图谱和产物证据。" />
        </div>
      )}
      </>}
    </div>
  )
}

function ArchitectureReport({
  data,
  scanTaskId,
  projectId,
  repositoryId,
  executionTaskId,
  execution,
  artifacts,
  taskStatus,
  progress,
  codeKnowledgeSignal,
  activeTab,
  onTabChange,
}: {
  data: any
  scanTaskId: number
  projectId: number
  repositoryId: number
  executionTaskId: number | null
  execution: ExecutionTaskDetail | null
  artifacts: ScanArtifactView[]
  taskStatus: string
  progress: number
  codeKnowledgeSignal: CodeKnowledgeSignal
  activeTab: string
  onTabChange: (key: string) => void
}) {
  const navigate = useNavigate()
  const { message: messageApi } = App.useApp()
  const [manualCopyText, setManualCopyText] = useState<{ title: string; text: string } | null>(null)
  const [activeEvidence, setActiveEvidence] = useState<ReportEvidenceDrawerData | null>(null)
  const [evidenceChunkResult, setEvidenceChunkResult] = useState<CodeChunkSearchResponse | null>(null)
  const [evidenceChunkLoading, setEvidenceChunkLoading] = useState(false)
  const [evidenceChunkError, setEvidenceChunkError] = useState<string | null>(null)
  const [governance, setGovernance] = useState<ReportGovernanceSnapshot | null>(null)
  const [governanceLoading, setGovernanceLoading] = useState(false)
  const [governanceError, setGovernanceError] = useState<string | null>(null)
  const governanceRequestSeqRef = useRef(0)
  const overview = data.overview || {}
  const techStack = data.techStack || {}
  const directories = data.directories || {}
  const modules = data.modules || {}
  const codeQuality = data.codeQuality || {}
  const risks = Array.isArray(codeQuality.risks) ? codeQuality.risks : []
  const debts = Array.isArray(data.technicalDebt) ? data.technicalDebt : []
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : []
  const apiRoutes = Array.isArray(data.apiRoutes) ? data.apiRoutes : []
  const dbEntities = Array.isArray(data.dbEntities) ? data.dbEntities : []
  const fingerprint = data.scanFingerprint || {}
  const reportQuality = data.reportQuality || {}
  const reportSignal = buildReportQualitySignal({
    taskStatus,
    progress,
    overview,
    modules,
    risks,
    debts,
    suggestions,
    apiRoutes,
    dbEntities,
    artifacts,
    fingerprint,
    reportQuality,
  })
  const evidenceProfile = buildReportEvidenceProfile({
    overview,
    modules,
    risks,
    apiRoutes,
    dbEntities,
    artifacts,
    fingerprint,
    reportQuality,
  })
  const reportCitationQuality = buildReportCitationQualitySummary(reportQuality)
  const firstHighRiskFileBoundRisk = risks.find((risk: any) => String(risk?.severity || '').toUpperCase() === 'HIGH' && riskFilePath(risk))
  const firstFileBoundRisk = risks.find((risk: any) => riskFilePath(risk))
  const firstRepairableRisk = firstHighRiskFileBoundRisk || firstFileBoundRisk
  const repairCandidateQuestion = buildRiskFileLocalizationQuestion(scanTaskId, risks)
  const canStartRepairFlow = repositoryId > 0 && (Boolean(firstRepairableRisk) || risks.length > 0)
  const openRepairFlow = () => {
    if (firstRepairableRisk) {
      navigate(autoRepairCandidateUrl(projectId, repositoryId, scanTaskId, firstRepairableRisk))
      return
    }
    navigate(projectQaUrl(projectId, repairCandidateQuestion, scanTaskId))
  }
  const copyRepairFlowLink = () => {
    if (firstRepairableRisk) {
      return copyAutoRepairDeepLink(firstRepairableRisk)
    }
    return copyReportQaDeepLink(repairCandidateQuestion)
  }
  const highRiskCount = risks.filter((risk: any) => String(risk?.severity || '').toUpperCase() === 'HIGH').length
  const hasGraphArtifact = artifacts.some(artifact => artifact.artifactType === 'DEPENDENCY_GRAPH')
  const hasCoreReportArtifact = artifacts.some(artifact => artifact.artifactType === 'ARCHITECTURE_REPORT')
  const governanceCards = buildReportGovernanceCards({
    risks,
    artifacts,
    execution,
    taskStatus,
    progress,
    governance,
  })
  const governanceEvents = buildReportGovernanceEvents({
    projectId,
    scanTaskId,
    execution,
    artifacts,
    governance,
    onOpenArtifacts: (ownerType = 'SCAN_TASK', ownerId = scanTaskId) => navigate(`/artifacts?projectId=${projectId}&ownerType=${ownerType}&ownerId=${ownerId}`),
    onOpenAutoRepair: (repairId?: number) => navigate(autoRepairUrl(projectId, scanTaskId, repairId)),
    onOpenExecution: (taskId?: number | null) => navigate(taskId ? `/execution-tasks?projectId=${projectId}&taskId=${taskId}` : `/execution-tasks?projectId=${projectId}`),
    onOpenUrl: url => navigate(url),
    onOpenQa: (question?: string | null) => navigate(projectQaUrl(projectId, question, scanTaskId)),
    onOpenScanReport: () => navigate(`/scan-tasks/${scanTaskId}`),
  })
  const governanceStages = buildReportGovernanceStages({
    risks,
    artifacts,
    governance,
    onOpenEvidence: () => navigate(`/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${scanTaskId}`),
    onOpenQa: () => navigate(projectQaUrl(projectId, repairCandidateQuestion, scanTaskId)),
    onCreateRepair: openRepairFlow,
    onOpenAutoRepair: () => navigate(autoRepairUrl(projectId, scanTaskId)),
    onOpenAudit: () => navigate(scanAuditUrl(projectId, scanTaskId)),
  })
  const governanceReadyCount = governanceCards.filter(card => card.tone === 'ready').length
  const governanceFailedCount = governanceCards.filter(card => card.tone === 'danger').length
  const reportReviewGateItems: ReportReviewGateItem[] = [
    {
      key: 'report-readiness',
      label: '报告可信度',
      value: `${reportSignal.confidence}%`,
      detail: reportSignal.label,
      tone: reportSignal.tone,
    },
    {
      key: 'evidence-bundle',
      label: '证据包',
      value: evidenceProfile.label,
      detail: evidenceProfile.missingCoreArtifacts.length > 0
        ? `缺 ${evidenceProfile.missingCoreArtifacts.length} 类核心产物`
        : `${artifacts.length} 个产物可追溯`,
      tone: evidenceProfile.tone,
    },
    {
      key: 'code-knowledge',
      label: '代码知识库',
      value: `${formatNumber(codeKnowledgeSignal.totalChunks)} chunks`,
      detail: codeKnowledgeSignal.readinessLabel,
      tone: codeKnowledgeSignal.tone,
    },
    {
      key: 'repair-readiness',
      label: '修复入口',
      value: firstRepairableRisk ? '可生成候选' : risks.length > 0 ? '需定位文件' : '无需修复',
      detail: firstRepairableRisk ? riskFilePath(firstRepairableRisk) || '已绑定风险文件' : `${risks.length} 个风险项`,
      tone: firstRepairableRisk ? 'ready' : risks.length > 0 ? 'warning' : 'idle',
    },
    {
      key: 'audit-trace',
      label: '审计追踪',
      value: projectId > 0 ? '已绑定扫描' : '未绑定',
      detail: projectId > 0 ? `Scan #${scanTaskId}` : '缺少项目上下文',
      tone: projectId > 0 ? 'ready' : 'warning',
    },
    {
      key: 'governance-timeline',
      label: '治理时间线',
      value: governanceLoading ? '加载中' : `${governanceReadyCount}/${governanceCards.length}`,
      detail: governanceError
        ? '治理聚合加载失败'
        : governanceFailedCount > 0
          ? `${governanceFailedCount} 类闭环信号需要处理`
          : '修复、任务、执行、产物和审计已绑定当前扫描',
      tone: governanceError ? 'danger' : governanceFailedCount > 0 ? 'warning' : governanceReadyCount > 0 ? 'ready' : 'idle',
    },
  ]
  const copyReportQaDeepLink = async (question?: string | null) => {
    const link = projectQaDeepLink(projectId, question, scanTaskId)
    try {
      await copyTextToClipboard(link)
      messageApi.success('已复制报告问答深链')
    } catch {
      setManualCopyText({ title: '手动复制报告问答深链', text: link })
      messageApi.warning('浏览器阻止自动复制，请在弹窗中手动复制')
    }
  }
  const copyAutoRepairDeepLink = async (risk: any) => {
    const link = autoRepairCandidateDeepLink(projectId, repositoryId, scanTaskId, risk)
    try {
      await copyTextToClipboard(link)
      messageApi.success('已复制修复候选深链')
    } catch {
      setManualCopyText({ title: '手动复制修复候选深链', text: link })
      messageApi.warning('浏览器阻止自动复制，请在弹窗中手动复制')
    }
  }
  const openEvidenceQa = (evidence: ReportEvidenceDrawerData) => {
    navigate(projectQaUrl(projectId, evidence.qaQuestion, scanTaskId, evidence))
  }
  const copyEvidenceReference = async (evidence: ReportEvidenceDrawerData) => {
    const text = buildEvidenceReference(scanTaskId, evidence)
    try {
      await copyTextToClipboard(text)
      messageApi.success('已复制证据引用')
    } catch {
      setManualCopyText({ title: '手动复制证据引用', text })
      messageApi.warning('浏览器阻止自动复制，请在弹窗中手动复制')
    }
  }
  const openEvidenceRepairFlow = (evidence: ReportEvidenceDrawerData) => {
    if (evidence.repairRisk && riskFilePath(evidence.repairRisk) && repositoryId > 0) {
      navigate(autoRepairCandidateUrl(projectId, repositoryId, scanTaskId, evidence.repairRisk))
      return
    }
    navigate(projectQaUrl(projectId, evidence.qaQuestion, scanTaskId, evidence))
  }
  const buildTraceEvidence = (item: ReportTraceItem): ReportEvidenceDrawerData => ({
    key: `trace-${item.key}`,
    title: item.label,
    category: '报告章节',
    source: item.source,
    summary: item.detail,
    tone: item.tone,
    qaQuestion: item.qaQuestion || `请基于扫描报告 #${scanTaskId} 解释 ${item.label} 的证据来源、可信度和下一步行动。`,
    artifactTypes: item.source.split('/').map(part => part.trim()).filter(Boolean),
    fields: [
      { label: '证据面', value: item.value },
      { label: '当前动作', value: item.actionLabel },
      { label: '状态', value: item.disabled ? '入口不可用' : '入口可用' },
    ],
  })
  const buildRiskEvidence = (risk: any, index: number): ReportEvidenceDrawerData => {
    const filePath = riskFilePath(risk)
    const lineNumber = risk?.line_number || risk?.lineNumber || risk?.line
    const startLine = reportEvidencePositiveLine(risk?.start_line, risk?.startLine, risk?.start)
    const endLine = reportEvidencePositiveLine(risk?.end_line, risk?.endLine, risk?.end)
    const qaQuestion = filePath
      ? `请基于扫描报告 #${scanTaskId} 和 code_chunks，解释 ${filePath}${lineNumber || startLine ? `:${lineNumber || (endLine && endLine > startLine! ? `${startLine}-${endLine}` : startLine)}` : ''} 中这个风险的证据、影响和最小修复建议：${risk?.message || risk?.detail || risk?.category || '风险项'}`
      : buildRiskFileLocalizationQuestion(scanTaskId, [risk])
    return {
      key: `risk-${index}`,
      title: risk?.category || `风险项 #${index + 1}`,
      category: '质量风险',
      source: 'ARCHITECTURE_REPORT / RISK_REPORT',
      summary: risk?.message || risk?.detail || '当前风险项缺少描述。',
      tone: String(risk?.severity || '').toUpperCase() === 'HIGH' ? 'danger' : 'warning',
      qaQuestion,
      artifactTypes: ['ARCHITECTURE_REPORT', 'RISK_REPORT'],
      filePath,
      lineNumber: lineNumber ? String(lineNumber) : undefined,
      startLine,
      endLine,
      repairRisk: risk,
      fields: [
        { label: '严重级别', value: risk?.severity || 'INFO' },
        { label: '风险类别', value: risk?.category || '未分类' },
        { label: '影响', value: risk?.impact || '-' },
        { label: '建议', value: risk?.suggestion || risk?.recommendation || '-' },
      ],
    }
  }
  const buildApiEvidence = (record: any, index: number): ReportEvidenceDrawerData => {
    const filePath = record?.file_path || record?.filePath || ''
    const lineNumber = record?.line_number || record?.lineNumber || record?.line
    const startLine = reportEvidencePositiveLine(record?.start_line, record?.startLine, record?.start)
    const endLine = reportEvidencePositiveLine(record?.end_line, record?.endLine, record?.end)
    const title = `${record?.method || 'API'} ${record?.path || `#${index + 1}`}`
    return {
      key: `api-${index}`,
      title,
      category: 'API 表面',
      source: 'API_CATALOG',
      summary: record?.handler_class
        ? `${record.handler_class}${record.handler_method ? `#${record.handler_method}` : ''}`
        : '当前 API 记录缺少 handler 详情。',
      tone: 'ready',
      qaQuestion: `请基于扫描报告 #${scanTaskId} 和 code_chunks，解释 API ${record?.method || ''} ${record?.path || ''} 的 Controller 职责、调用边界、输入校验和潜在风险。`,
      artifactTypes: ['API_CATALOG', 'ARCHITECTURE_REPORT'],
      filePath,
      lineNumber: lineNumber ? String(lineNumber) : undefined,
      startLine,
      endLine,
      fields: [
        { label: 'HTTP 方法', value: record?.method || '-' },
        { label: '路径', value: record?.path || '-' },
        { label: 'Controller', value: record?.handler_class || '-' },
        { label: '函数', value: record?.handler_method || '-' },
      ],
    }
  }
  const buildDbEvidence = (record: any, index: number): ReportEvidenceDrawerData => {
    const filePath = record?.file_path || record?.filePath || ''
    const title = record?.class_name || record?.table_name || `数据库实体 #${index + 1}`
    return {
      key: `db-${index}`,
      title,
      category: '数据模型',
      source: 'DB_SCHEMA',
      summary: record?.table_name ? `映射表：${record.table_name}` : '当前实体未声明明确表名。',
      tone: 'ready',
      qaQuestion: `请基于扫描报告 #${scanTaskId} 和 code_chunks，解释数据实体 ${title} 的表结构、业务职责、字段风险和与服务层的关系。`,
      artifactTypes: ['DB_SCHEMA', 'ARCHITECTURE_REPORT'],
      filePath,
      fields: [
        { label: '类名', value: record?.class_name || '-' },
        { label: '表名', value: record?.table_name || '未指定' },
        { label: '字段数', value: String(record?.field_count ?? '-') },
        { label: '文件', value: filePath || '-' },
      ],
    }
  }
  const loadGovernance = useCallback(async () => {
    const requestSeq = governanceRequestSeqRef.current + 1
    governanceRequestSeqRef.current = requestSeq
    const isCurrent = () => governanceRequestSeqRef.current === requestSeq
    if (projectId <= 0 || scanTaskId <= 0) {
      if (isCurrent()) {
        setGovernance(null)
        setGovernanceError(null)
        setGovernanceLoading(false)
      }
      return
    }

    setGovernanceLoading(true)
    setGovernanceError(null)

    try {
      const response = await scanGovernanceTimelineApi.get(projectId, scanTaskId)
      if (!isCurrent()) return
      const timeline = response.data.data
      if (Number(timeline?.projectId) !== projectId || Number(timeline?.scanTaskId) !== scanTaskId) {
        throw new ScanOwnershipError(`治理时间线响应归属不匹配：期望 Project #${projectId} / Scan #${scanTaskId}`)
      }
      const resources = timeline?.resources
      const autoRepairs = (resources?.autoRepairs || [])
        .filter(repair => Number(repair.projectId) === projectId && Number(repair.scanTaskId) === scanTaskId)
      const repairIds = new Set(autoRepairs.map(repair => Number(repair.id)))
      const agentTasks = (resources?.agentTasks || [])
        .filter(task => Number(task.projectId) === projectId && Number(task.scanTaskId) === scanTaskId)
      const agentTaskIds = new Set(agentTasks.map(task => Number(task.id)))
      const agentToolCalls = (resources?.agentToolCalls || [])
        .filter(call => Number(call.projectId) === projectId && Number(call.scanTaskId) === scanTaskId)
      const auditLogs = (resources?.auditLogs || [])
        .filter(log => {
          if (Number(log.projectId) !== projectId) return false
          if (log.resourceType === 'SCAN_TASK') return Number(log.resourceId) === scanTaskId
          if (log.resourceType === 'AUTO_REPAIR') return repairIds.has(Number(log.resourceId))
          if (log.resourceType === 'AGENT_TASK') return agentTaskIds.has(Number(log.resourceId))
          return false
        })
      const governanceArtifacts = (resources?.artifacts || [])
        .filter(artifact => {
          if (Number(artifact.projectId) !== projectId) return false
          if (artifact.ownerType === 'SCAN_TASK') return Number(artifact.ownerId) === scanTaskId
          if (artifact.ownerType === 'AUTO_REPAIR') return repairIds.has(Number(artifact.ownerId))
          if (artifact.ownerType === 'AGENT_TASK') return agentTaskIds.has(Number(artifact.ownerId))
          return false
        })
      const repairExecutions = (resources?.repairExecutions || [])
        .filter(detail => {
          const sourceId = Number(detail?.task?.sourceId)
          return repairIds.has(sourceId)
            && isOwnedExecutionDetail(detail, projectId, 'AUTO_REPAIR', sourceId)
        })
      const agentExecutions = (resources?.agentExecutions || [])
        .filter(detail => {
          const sourceId = Number(detail?.task?.sourceId)
          return agentTaskIds.has(sourceId)
            && isOwnedExecutionDetail(detail, projectId, 'AGENT_TASK', sourceId)
        })
      if (!isCurrent()) return
      setGovernance({
        autoRepairs,
        agentTasks,
        agentToolCalls,
        auditLogs,
        artifacts: governanceArtifacts,
        repairExecutions: repairExecutions as ExecutionTaskDetail[],
        agentExecutions: agentExecutions as ExecutionTaskDetail[],
        timelineEvents: (timeline?.events || [])
          .filter(event => isCurrentScanGovernanceEvent(event, projectId, scanTaskId)),
      })
    } catch (error) {
      if (!isCurrent()) return
      setGovernanceError(scanLoadError(error, '加载修复治理时间线失败'))
    } finally {
      if (isCurrent()) {
        setGovernanceLoading(false)
      }
    }
  }, [projectId, scanTaskId])

  useEffect(() => {
    void loadGovernance()

    return () => {
      governanceRequestSeqRef.current += 1
    }
  }, [loadGovernance])

  useEffect(() => {
    if (!activeEvidence || projectId <= 0) {
      setEvidenceChunkResult(null)
      setEvidenceChunkError(null)
      setEvidenceChunkLoading(false)
      return undefined
    }

    let cancelled = false
    setEvidenceChunkLoading(true)
    setEvidenceChunkError(null)
    setEvidenceChunkResult(null)
    codeChunkApi.search(projectId, {
      scanTaskId,
      query: buildEvidenceChunkQuery(activeEvidence),
      limit: 3,
    }).then(response => {
      if (cancelled) return
      const value = response.data.data
      assertOwnedCodeKnowledge(value, scanTaskId)
      setEvidenceChunkResult(value)
    }).catch(error => {
      if (cancelled) return
      setEvidenceChunkResult(null)
      setEvidenceChunkError(scanLoadError(error, '加载证据 code_chunks 失败'))
    }).finally(() => {
      if (!cancelled) {
        setEvidenceChunkLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeEvidence, projectId, scanTaskId])

  const priorityEvidenceItems: ReportEvidencePriorityItem[] = [
    firstRepairableRisk ? {
      key: 'risk-evidence',
      tone: String(firstRepairableRisk?.severity || '').toUpperCase() === 'HIGH' ? 'danger' : 'warning',
      label: '首要风险证据',
      title: redactReportEvidenceText(firstRepairableRisk?.category || '文件级风险'),
      summary: redactReportEvidenceText(firstRepairableRisk?.message || firstRepairableRisk?.detail || '打开报告证据，先确认风险是否能被代码片段支撑。'),
      meta: riskFilePath(firstRepairableRisk)
        ? `${redactReportEvidenceText(riskFilePath(firstRepairableRisk))}:${riskLineNumber(firstRepairableRisk) || '?'}`
        : '待定位文件',
      actionLabel: '查看证据',
      onOpen: () => setActiveEvidence(buildRiskEvidence(firstRepairableRisk, risks.indexOf(firstRepairableRisk))),
      repairActionVisible: true,
      repairGateReason: '文件级风险已绑定到当前扫描证据，可进入受控修复候选；仍需先复核引用和审计链路。',
    } : {
      key: 'risk-evidence',
      tone: risks.length > 0 ? 'warning' : 'ready',
      label: risks.length > 0 ? '风险待定位' : '风险状态',
      title: risks.length > 0 ? '先定位可修文件' : '暂无显著风险',
      summary: risks.length > 0
        ? '当前风险缺少文件级证据，先进入代码问答定位最小修复面。'
        : '当前报告未发现需要立即修复的风险，可继续复核 API、数据模型和依赖图谱。',
      meta: `${formatNumber(risks.length)} risks`,
      actionLabel: risks.length > 0 ? '进入 QA 定位' : '查看质量概览',
      onOpen: risks.length > 0 ? () => navigate(projectQaUrl(projectId, repairCandidateQuestion, scanTaskId)) : () => onTabChange('quality'),
      repairActionVisible: false,
      repairGateReason: risks.length > 0
        ? '当前风险尚未绑定可修文件，必须先用代码问答定位最小修复面，不能直接生成修复候选。'
        : '当前报告没有需要立即修复的风险，保留复核入口但不开放修复候选。',
    },
    {
      key: 'citation-readiness',
      tone: codeKnowledgeSignal.tone === 'ready' ? 'ready' : codeKnowledgeSignal.tone === 'danger' ? 'danger' : 'warning',
      label: '引用预检',
      title: codeKnowledgeSignal.readinessLabel,
      summary: codeKnowledgeSignal.nextAction,
      meta: `${formatNumber(codeKnowledgeSignal.totalChunks)} chunks / ${formatNumber(codeKnowledgeSignal.embeddedChunks)} vectors`,
      actionLabel: codeKnowledgeSignal.totalChunks > 0 ? '打开代码问答' : '查看产物',
      disabled: projectId <= 0,
      onOpen: codeKnowledgeSignal.totalChunks > 0
        ? () => navigate(projectQaUrl(projectId, null, scanTaskId))
        : () => navigate(`/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${scanTaskId}`),
      repairActionVisible: false,
      repairGateReason: '引用预检只证明 QA citation 和 code_chunks 状态，不等同于文件级修复证据；不直接生成修复候选。',
    },
    {
      key: 'governance-blocker',
      tone: governanceError || governanceFailedCount > 0 ? 'danger' : governanceReadyCount > 0 ? 'ready' : 'warning',
      label: '治理闭环',
      title: governanceError ? '治理聚合加载失败' : governanceFailedCount > 0 ? '治理阻塞待处理' : governanceReadyCount > 0 ? '治理证据已绑定' : '治理证据待生成',
      summary: governanceError
        ? '先重新加载治理时间线，避免基于不完整闭环做修复判断。'
        : governanceFailedCount > 0
          ? `${governanceFailedCount} 类闭环信号需要处理，优先打开审计或修复详情。`
          : governanceReadyCount > 0
            ? '修复、任务、执行、产物和审计已绑定当前扫描。'
            : '尚未形成修复或 Agent 治理证据，可从审计追踪开始复核。',
      meta: `${governanceReadyCount}/${governanceCards.length} signals`,
      actionLabel: governanceError ? '重新加载治理' : governanceFailedCount > 0 ? '打开审计' : '治理时间线',
      onOpen: governanceError ? () => void loadGovernance() : () => navigate(scanAuditUrl(projectId, scanTaskId)),
      repairActionVisible: false,
      repairGateReason: governanceError
        ? '治理聚合失败时无法确认修复、任务、产物和审计闭环，不能直接生成修复候选。'
        : '治理闭环用于复核修复事件和审计责任链，不替代文件级风险证据。',
    },
  ]

  const riskActions = (risk: any, index: number) => {
    const actions = [
      <ActionButton
        key="evidence"
        size="small"
        icon={<FileSearchOutlined />}
        onClick={() => setActiveEvidence(buildRiskEvidence(risk, index))}
        label="查看证据"
      />,
    ]
    if (riskFilePath(risk) && repositoryId > 0) {
      actions.push(
        <ActionButton
          key="repair"
          size="small"
          icon={<CodeOutlined />}
          onClick={() => navigate(autoRepairCandidateUrl(projectId, repositoryId, scanTaskId, risk))}
          label="生成修复候选"
        />,
        <ActionButton
          key="repair-link"
          size="small"
          icon={<LinkOutlined />}
          onClick={() => copyAutoRepairDeepLink(risk)}
          label="复制修复链接"
        />,
      )
      return actions
    }
    if (repositoryId > 0) {
      actions.push(
        <ActionButton
          key="locate"
          size="small"
          icon={<FileSearchOutlined />}
          onClick={() => navigate(projectQaUrl(projectId, buildRiskFileLocalizationQuestion(scanTaskId, [risk]), scanTaskId))}
          label="定位文件"
        />,
        <ActionButton
          key="locate-link"
          size="small"
          icon={<LinkOutlined />}
          onClick={() => copyReportQaDeepLink(buildRiskFileLocalizationQuestion(scanTaskId, [risk]))}
          label="复制问答链接"
        />,
      )
    }
    return actions
  }
  const reportTraceItems: ReportTraceItem[] = [
    {
      key: 'quality-risks',
      icon: <WarningOutlined />,
      label: '质量风险',
      value: risks.length > 0 ? `${risks.length} risks` : 'Clean',
      source: 'ARCHITECTURE_REPORT / RISK_REPORT',
      detail: highRiskCount > 0
        ? `${highRiskCount} 个高风险项需要优先确认文件路径和修复范围。`
        : risks.length > 0
          ? '存在可复核风险项，可继续进入代码问答确认上下文。'
          : '当前报告未发现显著风险，可继续复核结构和边界。',
      tone: highRiskCount > 0 ? 'danger' : risks.length > 0 ? 'warning' : 'ready',
      actionLabel: risks.length > 0 ? '打开风险' : '质量概览',
      disabled: !hasCoreReportArtifact,
      actionGateReason: hasCoreReportArtifact
        ? '核心风险报告已归档，可打开质量风险证据；追问代码仍需要项目上下文和扫描绑定。'
        : '缺少核心风险报告产物，风险证据入口不可用；先补齐报告产物或查看执行详情。',
      onOpen: () => onTabChange('quality'),
      qaQuestion: risks.length > 0
        ? `请基于扫描报告 #${scanTaskId} 解释最需要优先处理的质量风险，并引用对应代码证据。`
        : `请基于扫描报告 #${scanTaskId} 总结当前项目的主要质量风险和可维护性状态。`,
    },
    {
      key: 'api-surface',
      icon: <ApiOutlined />,
      label: 'API 表面',
      value: `${apiRoutes.length} routes`,
      source: 'API_CATALOG',
      detail: apiRoutes.length > 0
        ? '接口目录已抽取，可复核 Controller 到业务服务的边界。'
        : '未识别到 API 路由，需确认项目类型或扫描规则。',
      tone: apiRoutes.length > 0 ? 'ready' : 'idle',
      actionLabel: '打开 API',
      disabled: apiRoutes.length <= 0,
      actionGateReason: apiRoutes.length > 0
        ? 'API 目录已从当前扫描产物抽取，可打开接口证据并继续用 QA 复核 Controller 边界。'
        : '当前扫描没有可展示 API 路由，API 入口不可用；先确认项目类型或扫描规则。',
      onOpen: () => onTabChange('api'),
      qaQuestion: `请基于扫描报告 #${scanTaskId} 梳理主要 API 入口、Controller 职责和可能的边界问题。`,
    },
    {
      key: 'data-model',
      icon: <DatabaseOutlined />,
      label: '数据模型',
      value: `${dbEntities.length} entities`,
      source: 'DB_SCHEMA',
      detail: dbEntities.length > 0
        ? '数据库实体已抽取，可继续检查表模型与业务模块映射。'
        : '未识别到数据库实体，可能是非持久化服务或注解规则未覆盖。',
      tone: dbEntities.length > 0 ? 'ready' : 'idle',
      actionLabel: '打开数据库',
      disabled: dbEntities.length <= 0,
      actionGateReason: dbEntities.length > 0
        ? '数据库实体已从当前扫描产物抽取，可打开数据模型证据并复核表模型与模块映射。'
        : '当前扫描没有可展示数据库实体，数据库入口不可用；先确认持久化框架或实体识别规则。',
      onOpen: () => onTabChange('db'),
      qaQuestion: `请基于扫描报告 #${scanTaskId} 说明数据库实体、核心表关系和潜在建模风险。`,
    },
    {
      key: 'dependency-graph',
      icon: <BranchesOutlined />,
      label: '依赖图谱',
      value: hasGraphArtifact ? 'Ready' : 'Missing',
      source: 'DEPENDENCY_GRAPH',
      detail: hasGraphArtifact
        ? '依赖图谱已归档，可复核模块调用方向和跨层依赖。'
        : '缺少依赖图谱产物，先检查 analyze_code 或图谱持久化步骤。',
      tone: hasGraphArtifact ? 'ready' : 'warning',
      actionLabel: '打开图谱',
      disabled: !hasGraphArtifact,
      actionGateReason: hasGraphArtifact
        ? '依赖图谱产物已归档，可打开图谱证据；图谱结论仍需结合代码问答和报告引用复核。'
        : '缺少依赖图谱产物，图谱入口不可用；先检查 analyze_code 或图谱持久化步骤。',
      onOpen: () => onTabChange('graph'),
      qaQuestion: `请基于扫描报告 #${scanTaskId} 分析模块依赖方向、循环依赖风险和应优先解耦的边界。`,
    },
    {
      key: 'artifact-bundle',
      icon: <FileTextOutlined />,
      label: '产物证据',
      value: `${artifacts.length} artifacts`,
      source: 'Artifact Store',
      detail: artifacts.length > 0
        ? '报告、图谱、指标和原始扫描数据可在产物库中追溯。'
        : '当前扫描缺少可追溯产物，需重新扫描或检查归档步骤。',
      tone: artifacts.length > 0 ? 'ready' : 'warning',
      actionLabel: '打开产物',
      disabled: artifacts.length <= 0,
      actionGateReason: artifacts.length > 0
        ? '当前扫描已有可追溯产物，可打开产物库复核报告、图谱、指标和原始扫描数据。'
        : '当前扫描缺少可追溯产物，产物入口不可用；先重新扫描或检查归档步骤。',
      onOpen: () => navigate(`/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${scanTaskId}`),
      qaQuestion: `请基于扫描报告 #${scanTaskId} 总结当前产物证据是否足以支撑架构结论。`,
    },
  ]
  const reportActionItems: ReportActionItem[] = [
    {
      key: 'risk-review',
      icon: <WarningOutlined />,
      label: '风险定位',
      value: risks.length > 0 ? `${risks.length} risks` : 'Clean',
      detail: highRiskCount > 0
        ? `${highRiskCount} 个高风险项需要先进入质量风险页复核。`
        : risks.length > 0
          ? '存在中低风险项，可继续做代码层定位。'
          : '当前报告未识别到显著风险。',
      tone: highRiskCount > 0 ? 'danger' : risks.length > 0 ? 'warning' : 'ready',
      actionLabel: risks.length > 0 ? '查看风险' : '质量概览',
      disabled: !hasCoreReportArtifact,
      onClick: () => onTabChange('quality'),
    },
    {
      key: 'code-qa',
      icon: <FileSearchOutlined />,
      label: '代码问答',
      value: reportSignal.tone === 'ready' ? 'Ready' : 'Review',
      detail: reportSignal.tone === 'danger'
        ? '报告存在高风险，问答前应优先确认风险证据。'
        : '把当前报告与 code_chunks 串起来追问实现细节。',
      tone: reportSignal.tone === 'danger' ? 'warning' : 'ready',
      actionLabel: '进入问答',
      disabled: projectId <= 0,
      onClick: () => navigate(projectQaUrl(projectId, null, scanTaskId)),
      onCopyLink: () => copyReportQaDeepLink(),
    },
    {
      key: 'agent-review',
      icon: <RobotOutlined />,
      label: 'Agent 审查',
      value: 'Bound',
      detail: '创建绑定当前扫描报告的 Agent 任务，避免工具调用漂移到其他扫描结果。',
      tone: hasCoreReportArtifact ? 'ready' : 'warning',
      actionLabel: '创建任务',
      disabled: projectId <= 0,
      onClick: () => navigate(agentTaskDraftUrl(projectId, scanTaskId)),
    },
    {
      key: 'audit-trace',
      icon: <SafetyCertificateOutlined />,
      label: '审计追踪',
      value: 'Trace',
      detail: '查看当前扫描报告关联的 Agent 工具调用审计，复核工具权限、输入和结果摘要。',
      tone: 'ready',
      actionLabel: '打开审计',
      disabled: projectId <= 0,
      onClick: () => navigate(scanAuditUrl(projectId, scanTaskId)),
    },
    {
      key: 'dependency-review',
      icon: <BranchesOutlined />,
      label: '依赖复盘',
      value: hasGraphArtifact ? 'Graph' : 'Missing',
      detail: hasGraphArtifact
        ? '依赖图谱已归档，可检查模块边界和调用方向。'
        : '缺少依赖图谱产物，需重新扫描或检查图谱生成步骤。',
      tone: hasGraphArtifact ? 'ready' : 'warning',
      actionLabel: '打开图谱',
      disabled: !hasGraphArtifact,
      onClick: () => onTabChange('graph'),
    },
    {
      key: 'repair-candidate',
      icon: <CodeOutlined />,
      label: '修复候选',
      value: firstRepairableRisk ? 'Candidate' : risks.length > 0 ? 'Locate file' : 'No risk',
      detail: firstRepairableRisk
        ? '已有可定位到文件的风险项，可生成受控修复候选。'
        : risks.length > 0
          ? '当前风险是项目级问题，先进入代码问答定位可修文件，再生成候选。'
          : '当前报告没有需要生成修复候选的风险项。',
      tone: firstRepairableRisk ? 'ready' : risks.length > 0 ? 'warning' : 'idle',
      actionLabel: firstRepairableRisk ? '生成候选' : risks.length > 0 ? '定位文件' : '无需修复',
      disabled: !canStartRepairFlow,
      onClick: openRepairFlow,
      onCopyLink: canStartRepairFlow ? copyRepairFlowLink : undefined,
    },
  ]
  const recommendedNextStep: ReportRecommendedStep = (() => {
    const openArtifacts = () => navigate(`/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${scanTaskId}`)
    const openExecution = () => {
      if (executionTaskId) {
        navigate(`/execution-tasks?projectId=${projectId}&taskId=${executionTaskId}`)
        return
      }
      navigate(`/execution-tasks?projectId=${projectId}`)
    }
    const openQa = (question?: string | null) => navigate(projectQaUrl(projectId, question, scanTaskId))
    const openRiskTab = () => onTabChange('quality')
    const openAudit = () => navigate(scanAuditUrl(projectId, scanTaskId))

    if (taskStatus === 'FAILED') {
      return {
        key: 'recover-failed-scan',
        tone: 'danger',
        icon: <WarningOutlined />,
        label: 'Execution Recovery',
        title: '先定位失败步骤，再重新扫描',
        detail: '当前报告不可采信，主行动应进入执行详情确认失败日志、步骤和可重试边界。',
        actionGateReason: '失败扫描不能直接进入 QA、修复或治理结论；推荐动作只开放执行详情和产物库，用于确认失败日志、步骤和可重试边界。',
        primaryLabel: '查看执行详情',
        primaryDisabled: projectId <= 0,
        onPrimary: openExecution,
        secondaryLabel: '查看产物库',
        secondaryDisabled: projectId <= 0,
        onSecondary: openArtifacts,
      }
    }

    if (taskStatus === 'RUNNING' || taskStatus === 'PENDING') {
      return {
        key: 'watch-running-scan',
        tone: 'idle',
        icon: <ScheduleOutlined />,
        label: 'Execution Watch',
        title: '等待扫描完成并跟踪当前步骤',
        detail: '扫描还在生成报告和 code_chunks，先观察执行详情，避免基于半成品做治理判断。',
        actionGateReason: '扫描未完成时报告和 code_chunks 仍可能变化，推荐动作只开放执行跟踪和刷新，不开放修复候选或最终审计判断。',
        primaryLabel: '跟踪执行',
        primaryDisabled: projectId <= 0,
        onPrimary: openExecution,
        secondaryLabel: '刷新报告',
        onSecondary: () => window.location.reload(),
      }
    }

    if (firstHighRiskFileBoundRisk) {
      return {
        key: 'repair-high-risk-file',
        tone: 'danger',
        icon: <CodeOutlined />,
        label: 'File-bound Risk',
        title: '优先生成最高风险修复候选',
        detail: `${riskFilePath(firstHighRiskFileBoundRisk)} 已绑定高风险证据，下一步应进入受控修复候选而不是继续浏览报告。`,
        actionGateReason: '文件级高风险已绑定当前扫描证据，主行动可进入受控修复候选；仍需保留风险证据复核，不能把候选生成等同于 patch 质量已验证。',
        primaryLabel: '生成修复候选',
        primaryDisabled: !canStartRepairFlow,
        onPrimary: openRepairFlow,
        secondaryLabel: '查看风险证据',
        secondaryDisabled: !hasCoreReportArtifact,
        onSecondary: openRiskTab,
      }
    }

    if (risks.length > 0 && !firstRepairableRisk) {
      return {
        key: 'locate-project-risk',
        tone: 'warning',
        icon: <FileSearchOutlined />,
        label: 'Risk Localization',
        title: '先用代码问答定位可修文件',
        detail: '当前风险没有绑定具体文件，不适合直接生成 patch；先让 QA 基于报告和 code_chunks 找到最小修复面。',
        actionGateReason: '项目级风险没有文件级修复证据，推荐动作只开放 QA 定位和风险列表复核，不开放直接生成修复候选。',
        primaryLabel: '进入 QA 定位',
        primaryDisabled: projectId <= 0,
        onPrimary: () => openQa(repairCandidateQuestion),
        secondaryLabel: '查看风险列表',
        secondaryDisabled: !hasCoreReportArtifact,
        onSecondary: openRiskTab,
      }
    }

    if (evidenceProfile.missingCoreArtifacts.length > 0) {
      return {
        key: 'complete-evidence-bundle',
        tone: 'warning',
        icon: <FileTextOutlined />,
        label: 'Evidence Gap',
        title: '先补齐核心报告产物',
        detail: `缺少 ${evidenceProfile.missingCoreArtifacts.map(type => ARTIFACT_TITLES[type] || type).join('、')}，当前结论需要产物证据补强。`,
        actionGateReason: '核心报告产物缺失时，推荐动作只开放产物库和执行详情，用于补齐证据包；不要把当前报告结论直接用于 QA、修复或发布判断。',
        primaryLabel: '打开产物库',
        primaryDisabled: projectId <= 0,
        onPrimary: openArtifacts,
        secondaryLabel: '查看执行详情',
        secondaryDisabled: projectId <= 0,
        onSecondary: openExecution,
      }
    }

    if (codeKnowledgeSignal.totalChunks <= 0 || codeKnowledgeSignal.tone === 'danger') {
      return {
        key: 'inspect-code-chunks',
        tone: 'warning',
        icon: <ClusterOutlined />,
        label: 'Code Knowledge Gap',
        title: '检查 code_chunks 生成状态',
        detail: '报告可读但代码知识库不可用，优先确认 chunk_code 步骤和产物，避免 QA 引用漂移。',
        actionGateReason: 'code_chunks 不可用时，推荐动作只开放执行详情和产物库检查，不能把 QA citation、跨文件检索或修复候选视为已就绪。',
        primaryLabel: '查看执行详情',
        primaryDisabled: projectId <= 0,
        onPrimary: openExecution,
        secondaryLabel: '打开产物库',
        secondaryDisabled: projectId <= 0,
        onSecondary: openArtifacts,
      }
    }

    if (firstRepairableRisk) {
      return {
        key: 'repair-file-bound-risk',
        tone: 'warning',
        icon: <CodeOutlined />,
        label: 'Repair Candidate',
        title: '生成文件级修复候选',
        detail: `${riskFilePath(firstRepairableRisk)} 已绑定可修复证据，适合进入受控修复候选流程。`,
        actionGateReason: '文件级风险证据已绑定当前扫描，推荐动作可进入受控修复候选；候选生成后仍必须经过审计、测试和人工复核。',
        primaryLabel: '生成修复候选',
        primaryDisabled: !canStartRepairFlow,
        onPrimary: openRepairFlow,
        secondaryLabel: '查看风险证据',
        secondaryDisabled: !hasCoreReportArtifact,
        onSecondary: openRiskTab,
      }
    }

    return {
      key: 'qa-review-ready-report',
      tone: reportSignal.tone === 'ready' ? 'ready' : 'warning',
      icon: <FileSearchOutlined />,
      label: 'Review Ready',
      title: '基于报告进入 QA 复核',
      detail: '报告、证据和 code_chunks 已具备可追溯基础，下一步应对关键模块、API 边界和风险结论做引用复核。',
      actionGateReason: '报告和 code_chunks 已具备可追溯基础，推荐动作开放代码问答和审计追踪；这只证明可进入复核，不证明 LLM 事实结论或修复质量。',
      primaryLabel: '进入代码问答',
      primaryDisabled: projectId <= 0,
      onPrimary: () => openQa(null),
      secondaryLabel: '审计追踪',
      secondaryDisabled: projectId <= 0,
      onSecondary: openAudit,
    }
  })()
  const reportTrustedLoopSteps: ReportTrustedLoopStep[] = [
    {
      key: 't1-report-decision',
      index: 'T1',
      tone: reportSignal.tone,
      icon: <FileTextOutlined />,
      title: '报告结论可信度',
      owner: 'Engineering Governance',
      value: reportSignal.label,
      detail: reportSignal.summary,
      actionLabel: '查看风险',
      onAction: () => onTabChange('quality'),
    },
    {
      key: 't2-evidence-citation',
      index: 'T2',
      tone: reportCitationQuality.tone,
      icon: <FileSearchOutlined />,
      title: '证据与引用质量',
      owner: 'Engineering Governance',
      value: reportCitationQuality.status,
      detail: reportCitationQuality.nextAction,
      actionLabel: priorityEvidenceItems.length > 0 ? '打开证据' : '查看报告',
      onAction: () => {
        if (priorityEvidenceItems.length > 0) priorityEvidenceItems[0].onOpen()
        else onTabChange('quality')
      },
    },
    {
      key: 't3-code-knowledge',
      index: 'T3',
      tone: codeKnowledgeSignal.tone,
      icon: <ClusterOutlined />,
      title: 'Code Knowledge 可用性',
      owner: 'Developer Workbench',
      value: codeKnowledgeSignal.totalChunks > 0 ? `${formatNumber(codeKnowledgeSignal.totalChunks)} chunks` : codeKnowledgeSignal.readinessLabel,
      detail: codeKnowledgeSignal.summary,
      actionLabel: '进入 QA',
      disabled: projectId <= 0 || codeKnowledgeSignal.totalChunks <= 0,
      onAction: () => navigate(projectQaUrl(projectId, null, scanTaskId)),
    },
    {
      key: 't4-repair-candidate',
      index: 'T4',
      tone: firstRepairableRisk ? 'warning' : risks.length > 0 ? 'warning' : 'idle',
      icon: <CodeOutlined />,
      title: '修复候选入口',
      owner: 'Developer Workbench',
      value: firstRepairableRisk ? '可生成' : risks.length > 0 ? '需定位' : '无需修复',
      detail: firstRepairableRisk
        ? `${riskFilePath(firstRepairableRisk)} 已绑定文件级风险证据，可进入受控候选流程。`
        : risks.length > 0
          ? '仍需把项目级风险定位到文件和代码证据后再生成候选。'
          : '当前报告没有需要生成修复候选的风险项。',
      actionLabel: firstRepairableRisk ? '生成候选' : risks.length > 0 ? '定位风险' : '查看审计',
      disabled: firstRepairableRisk ? !canStartRepairFlow : false,
      onAction: () => {
        if (firstRepairableRisk) openRepairFlow()
        else if (risks.length > 0) navigate(projectQaUrl(projectId, repairCandidateQuestion, scanTaskId))
        else navigate(scanAuditUrl(projectId, scanTaskId))
      },
    },
    {
      key: 't5-governance',
      index: 'T5',
      tone: governanceError ? 'danger' : governanceEvents.length > 0 ? 'ready' : governanceLoading ? 'idle' : 'warning',
      icon: <SafetyCertificateOutlined />,
      title: '审计与治理留痕',
      owner: 'Admin & Security',
      value: governanceEvents.length > 0 ? `${formatNumber(governanceEvents.length)} events` : governanceLoading ? '加载中' : '待复核',
      detail: governanceEvents.length > 0
        ? '当前扫描已绑定修复、审计、Agent 或工具调用事件，可复盘责任链。'
        : governanceError
          ? governanceError
          : '还需要产物、审计或修复事件把报告结论接入治理链路。',
      actionLabel: '打开审计',
      disabled: projectId <= 0,
      onAction: () => navigate(scanAuditUrl(projectId, scanTaskId)),
    },
  ]
  const reportMainPathSteps: ReportMainPathStep[] = [
    {
      key: 'recommended-action',
      index: '01',
      tone: recommendedNextStep.tone,
      title: recommendedNextStep.title,
      detail: recommendedNextStep.detail,
    },
    {
      key: 'citation-quality',
      index: '02',
      tone: reportCitationQuality.tone,
      title: reportCitationQuality.title,
      detail: reportCitationQuality.nextAction,
    },
    {
      key: 'evidence-priority',
      index: '03',
      tone: priorityEvidenceItems.some(item => item.tone === 'danger')
        ? 'danger'
        : priorityEvidenceItems.some(item => item.tone === 'warning')
          ? 'warning'
          : 'ready',
      title: '按优先级打开证据入口',
      detail: '先风险证据，再引用预检，最后治理闭环；非文件级证据不直接生成修复。',
    },
  ]

  return (
    <>
      <Modal
        title={manualCopyText?.title || '手动复制'}
        open={Boolean(manualCopyText)}
        onCancel={() => setManualCopyText(null)}
        footer={<ActionButton type="primary" onClick={() => setManualCopyText(null)} label="关闭" />}
      >
        <Typography.Paragraph type="secondary">
          当前浏览器环境阻止自动写入剪贴板。
        </Typography.Paragraph>
        <Input.TextArea
          value={manualCopyText?.text || ''}
          readOnly
          autoSize={{ minRows: 3, maxRows: 8 }}
          onFocus={(event) => event.currentTarget.select()}
        />
      </Modal>
      <ReportEvidenceDrawer
        evidence={activeEvidence}
        open={Boolean(activeEvidence)}
        onClose={() => setActiveEvidence(null)}
        onOpenQa={openEvidenceQa}
        onCopyReference={copyEvidenceReference}
        onOpenRepair={openEvidenceRepairFlow}
        chunkResult={evidenceChunkResult}
        chunkLoading={evidenceChunkLoading}
        chunkError={evidenceChunkError}
        scanTaskId={scanTaskId}
      />
      <Tabs
        className="sl-report-tabs"
        activeKey={activeTab}
        onChange={onTabChange}
        items={[
        {
          key: 'summary',
          label: '报告总览',
          children: (
            <>
              <ReportTrustedLoopPanel steps={reportTrustedLoopSteps} />
              <ReportDecisionPanel signal={reportSignal} />
              <ReportCitationQualityPanel quality={reportCitationQuality} />
              <ReportRecommendedNextStep item={recommendedNextStep} />
              <ReportMainPathGuide steps={reportMainPathSteps} />
              <ReportEvidencePriorityRail items={priorityEvidenceItems} />
              <ReportReviewGate items={reportReviewGateItems} />
              <ReportActionBoard items={reportActionItems} />
              <ReportEvidenceProfilePanel
                profile={evidenceProfile}
                canOpenExecution={Boolean(executionTaskId)}
                canOpenAutoRepair={canStartRepairFlow}
                autoRepairActionLabel={firstRepairableRisk ? '修复候选' : risks.length > 0 ? '定位文件' : '修复候选'}
                onOpenArtifacts={() => navigate(`/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${scanTaskId}`)}
                onOpenExecution={() => executionTaskId && navigate(`/execution-tasks?projectId=${projectId}&taskId=${executionTaskId}`)}
                onOpenQa={() => navigate(projectQaUrl(projectId, null, scanTaskId))}
                onOpenAutoRepair={openRepairFlow}
              />
              <ReportGovernanceTimeline
                cards={governanceCards}
                stages={governanceStages}
                events={governanceEvents}
                loading={governanceLoading}
                error={governanceError}
                scanTaskId={scanTaskId}
                onRetry={() => void loadGovernance()}
                onCreateRepair={openRepairFlow}
                onCreateAgentTask={() => navigate(agentTaskDraftUrl(projectId, scanTaskId))}
                onOpenAudit={() => navigate(scanAuditUrl(projectId, scanTaskId))}
              />
              <ReportTraceMap
                items={reportTraceItems}
                canOpenQa={projectId > 0}
                onOpenEvidence={(item) => setActiveEvidence(buildTraceEvidence(item))}
                onOpenQa={(question) => navigate(projectQaUrl(projectId, question, scanTaskId))}
                onCopyQa={(question) => copyReportQaDeepLink(question)}
              />
              <div className="sl-section-grid">
                <Card className="sl-section-card sl-col-7" title={<span className="sl-card-title"><InfoCircleOutlined /> 技术栈与规模</span>}>
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="框架">{techStack.name || 'Unknown'}</Descriptions.Item>
                    <Descriptions.Item label="版本">{techStack.version || 'Unknown'}</Descriptions.Item>
                    <Descriptions.Item label="文件">{formatNumber(overview.totalFiles)}</Descriptions.Item>
                    <Descriptions.Item label="代码行">{formatNumber(overview.totalLines)}</Descriptions.Item>
                    <Descriptions.Item label="目录">{formatNumber(overview.totalDirs)}</Descriptions.Item>
                    <Descriptions.Item label="测试文件">{formatNumber(overview.testFiles)}</Descriptions.Item>
                    {Array.isArray(techStack.evidence) && techStack.evidence.length > 0 && (
                      <Descriptions.Item label="识别证据" span={2}>
                        <Space wrap>
                          {techStack.evidence.map((item: string) => <Tag key={item}>{item}</Tag>)}
                        </Space>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>

                <Card className="sl-section-card sl-col-5" title={<span className="sl-card-title"><BranchesOutlined /> 模块分布</span>}>
                  <div className="sl-status-cluster">
                    <StatusTile label="Controller" value={modules.controllers || 0} />
                    <StatusTile label="Service" value={modules.services || 0} />
                    <StatusTile label="Repository" value={modules.repositories || 0} />
                    <StatusTile label="Entity" value={modules.entities || 0} />
                  </div>
                </Card>

                <Card className="sl-section-card sl-col-12" title={<span className="sl-card-title"><FileTextOutlined /> 产物清单</span>}>
                  <div className="sl-report-artifact-strip">
                    {artifacts.map(artifact => (
                      <button
                        aria-label={`打开 ${ARTIFACT_TITLES[artifact.artifactType] || artifact.artifactType} 产物库`}
                        key={artifact.id}
                        type="button"
                        onClick={() => navigate(artifactDetailUrl(projectId, scanTaskId, artifact.id))}
                      >
                        <span>{ARTIFACT_TITLES[artifact.artifactType] || artifact.artifactType}</span>
                        <small>{formatBytes(artifact.sizeBytes)}</small>
                      </button>
                    ))}
                  </div>
                </Card>

                {Object.keys(fingerprint).length > 0 && (
                  <Card className="sl-section-card sl-col-12" title={<span className="sl-card-title"><DatabaseOutlined /> 扫描指纹</span>}>
                    <Descriptions column={4} size="small" bordered>
                      <Descriptions.Item label="Manifest 文件">{formatNumber(fingerprint.manifestFiles)}</Descriptions.Item>
                      <Descriptions.Item label="已哈希文件">{formatNumber(fingerprint.hashedFiles)}</Descriptions.Item>
                      <Descriptions.Item label="二进制文件">{formatNumber(fingerprint.binaryFiles)}</Descriptions.Item>
                      <Descriptions.Item label="大文件">{formatNumber(fingerprint.largeFiles)}</Descriptions.Item>
                      {fingerprint.repoContentHash && (
                        <Descriptions.Item label="内容哈希" span={4}>
                          <Text code copyable>{fingerprint.repoContentHash}</Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                )}
              </div>
            </>
          ),
        },
        {
          key: 'quality',
          label: `质量风险 (${risks.length})`,
          children: (
            <div className="sl-section-grid">
              <Card className="sl-section-card sl-col-4" title={<span className="sl-card-title"><CodeOutlined /> 质量指标</span>}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="总类数">{formatNumber(codeQuality.totalClasses)}</Descriptions.Item>
                  <Descriptions.Item label="总方法数">{formatNumber(codeQuality.totalMethods)}</Descriptions.Item>
                  <Descriptions.Item label="平均方法/类">{formatNumber(codeQuality.avgMethodsPerClass)}</Descriptions.Item>
                </Descriptions>
              </Card>

              <Card className="sl-section-card sl-col-8" title={<span className="sl-card-title"><WarningOutlined /> 风险项</span>}>
                {risks.length > 0 ? (
                  <List
                    dataSource={risks}
                    renderItem={(risk: any, index: number) => (
                      <List.Item
                        actions={riskActions(risk, index)}
                      >
                        <List.Item.Meta
                          avatar={<ExclamationCircleOutlined style={{ color: riskColor(risk.severity) }} />}
                          title={<Space><Tag color={riskTag(risk.severity)}>{redactReportEvidenceText(risk.severity || 'INFO')}</Tag>{redactReportEvidenceText(risk.category || '未分类')}</Space>}
                          description={(
                            <Space direction="vertical" size={2}>
                              <span>{redactReportEvidenceText(risk.message || risk.detail || '未提供描述')}</span>
                              {riskFilePath(risk) && <Text code>{redactReportEvidenceText(riskFilePath(risk))}</Text>}
                            </Space>
                          )}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <StateBlock compact tone="success" title="未识别到显著风险" description="当前报告没有返回需要优先处理的风险项。" />
                )}
              </Card>

              <Card className="sl-section-card sl-col-6" title="技术债">
                {debts.length > 0 ? (
                  <List
                    dataSource={debts}
                    renderItem={(debt: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={<Space><Tag color={riskTag(debt.severity)}>{redactReportEvidenceText(debt.severity || 'INFO')}</Tag>{redactReportEvidenceText(debt.category || '未分类')}</Space>}
                          description={redactReportEvidenceText(debt.detail || '未提供描述')}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <StateBlock compact title="暂无技术债评估" description="当前报告没有返回技术债条目。" />
                )}
              </Card>

              <Card className="sl-section-card sl-col-6" title="改进建议">
                {suggestions.length > 0 ? (
                  <List
                    dataSource={suggestions}
                    renderItem={(item: string) => (
                      <List.Item>
                        <Space align="start">
                          <CheckCircleOutlined style={{ color: '#059669', marginTop: 4 }} />
                          <span>{redactReportEvidenceText(item)}</span>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <StateBlock compact title="暂无建议" description="当前报告没有返回额外改进建议。" />
                )}
              </Card>
            </div>
          ),
        },
        {
          key: 'api',
          label: `API (${apiRoutes.length})`,
          children: (
            <Card className="sl-section-card" title={<span className="sl-card-title"><ApiOutlined /> API 接口目录</span>}>
              <Table
                dataSource={apiRoutes}
                rowKey={(record: any) => `${record.method}-${record.path}-${record.line_number}`}
                size="small"
                pagination={{ pageSize: 20 }}
                scroll={{ x: 760 }}
                columns={[
                  { title: '方法', dataIndex: 'method', key: 'method', width: 90, render: (value: string) => <Tag>{value}</Tag> },
                  {
                    title: '路径',
                    dataIndex: 'path',
                    key: 'path',
                    className: 'sl-report-api-path-cell',
                    width: 240,
                    render: (value: string) => <span className="sl-report-table-evidence-text">{redactReportEvidenceText(value || '-')}</span>,
                  },
                  {
                    title: 'Controller',
                    dataIndex: 'handler_class',
                    key: 'handler_class',
                    className: 'sl-report-api-controller-cell',
                    width: 240,
                    render: (value: string) => <span className="sl-report-table-evidence-text">{redactReportEvidenceText(value || '-')}</span>,
                  },
                  { title: '函数', dataIndex: 'handler_method', key: 'handler_method', width: 160 },
                  { title: '行号', dataIndex: 'line_number', key: 'line_number', width: 80 },
                  {
                    title: '证据',
                    key: 'evidence',
                    width: 110,
                    render: (_: unknown, record: any, index: number) => (
                      <ActionButton
                        size="small"
                        icon={<FileSearchOutlined />}
                        onClick={() => setActiveEvidence(buildApiEvidence(record, index))}
                        label="查看证据"
                      />
                    ),
                  },
                ]}
              />
            </Card>
          ),
        },
        {
          key: 'db',
          label: `数据库 (${dbEntities.length})`,
          children: (
            <Card className="sl-section-card" title={<span className="sl-card-title"><DatabaseOutlined /> 数据库实体</span>}>
              {dbEntities.length > 0 ? (
                <Table
                  dataSource={dbEntities}
                  rowKey={(record: any) => record.class_name || record.file_path}
                  size="small"
                  scroll={{ x: 720 }}
                  columns={[
                    { title: '类名', dataIndex: 'class_name', key: 'class_name' },
                    { title: '表名', dataIndex: 'table_name', key: 'table_name', render: (value: string) => value || <Tag>未指定</Tag> },
                    { title: '字段数', dataIndex: 'field_count', key: 'field_count', width: 90 },
                    {
                      title: '文件',
                      dataIndex: 'file_path',
                      key: 'file_path',
                      className: 'sl-report-db-file-cell',
                      width: 280,
                      render: (value: string) => <span className="sl-report-table-evidence-text">{redactReportEvidenceText(value || '-')}</span>,
                    },
                    {
                      title: '证据',
                      key: 'evidence',
                      width: 110,
                      render: (_: unknown, record: any, index: number) => (
                        <ActionButton
                          size="small"
                          icon={<FileSearchOutlined />}
                          onClick={() => setActiveEvidence(buildDbEvidence(record, index))}
                          label="查看证据"
                        />
                      ),
                    },
                  ]}
                />
              ) : (
                <StateBlock compact title="未检测到数据库实体" description="当前扫描没有识别到可展示的数据实体。" />
              )}
            </Card>
          ),
        },
        {
          key: 'structure',
          label: '目录结构',
          children: (
            <Card className="sl-section-card" title={<span className="sl-card-title"><ClusterOutlined /> 分层结构识别</span>}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="src/main">
                  <Tag color={directories.srcMain ? 'success' : 'default'}>{directories.srcMain ? '存在' : '缺失'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="src/test">
                  <Tag color={directories.srcTest ? 'success' : 'error'}>{directories.srcTest ? '存在' : '缺失'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Controller 目录">{formatList(directories.controllerDirs)}</Descriptions.Item>
                <Descriptions.Item label="Service 目录">{formatList(directories.serviceDirs)}</Descriptions.Item>
                <Descriptions.Item label="Repository 目录">{formatList(directories.repositoryDirs)}</Descriptions.Item>
                <Descriptions.Item label="Entity 目录">{formatList(directories.entityDirs)}</Descriptions.Item>
                <Descriptions.Item label="DTO 目录">{formatList(directories.dtoDirs)}</Descriptions.Item>
                <Descriptions.Item label="Config 目录">{formatList(directories.configDirs)}</Descriptions.Item>
              </Descriptions>
            </Card>
          ),
        },
        {
          key: 'graph',
          label: '依赖图谱',
          children: <DependencyGraphView scanTaskId={scanTaskId} />,
        },
      ]}
      />
    </>
  )
}

function ArtifactFallback({
  projectId,
  scanTaskId,
  artifacts,
}: {
  projectId: number
  scanTaskId: number
  artifacts: ScanArtifactView[]
}) {
  const navigate = useNavigate()
  return (
    <Card className="sl-section-card" title="分析产物">
      <div className="sl-section-grid">
        {artifacts.map(artifact => {
          const data = parseJson(artifact.summaryJson)
          return (
            <Card className="sl-section-card sl-col-6" key={artifact.id} title={ARTIFACT_TITLES[artifact.artifactType] || artifact.artifactType}>
              {projectId > 0 && (
                <ActionButton
                  aria-label={`打开 ${ARTIFACT_TITLES[artifact.artifactType] || artifact.artifactType} 产物库`}
                  size="small"
                  icon={<FileTextOutlined />}
                  onClick={() => navigate(artifactDetailUrl(projectId, scanTaskId, artifact.id))}
                  style={{ marginBottom: 10 }}
                  label="查看产物"
                />
              )}
              {data ? (
                <pre className="sl-code-block sl-artifact-fallback-redacted-raw-json" aria-label="脱敏分析产物 JSON">
                  {stringifyRedactedPayload(data, 2)}
                </pre>
              ) : (
                <Text type="secondary">当前产物不可预览</Text>
              )}
            </Card>
          )
        })}
      </div>
    </Card>
  )
}

function ScanStepCard({ step, index }: { step: ExecutionStep; index: number }) {
  return (
    <div className={`sl-scan-step-card sl-scan-step-card-${step.status.toLowerCase()}`}>
      <div className="sl-scan-step-index">{index}</div>
      <div className="sl-scan-step-copy">
        <div className="sl-scan-step-name">{STEP_LABEL[step.stepKey] || step.stepName || step.stepKey}</div>
        <div className="sl-scan-step-summary">
          {step.errorMessage || step.logSummary || formatStepTime(step)}
        </div>
      </div>
      <Tag color={STATUS_COLOR[step.status] || 'default'}>{STATUS_LABEL[step.status] || step.status}</Tag>
    </div>
  )
}

function ScanMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="sl-scan-meta-item">
      <div className="sl-scan-meta-label">{label}</div>
      <div className="sl-scan-meta-value" title={value}>{value}</div>
    </div>
  )
}

function ScanEvidenceMetric({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="sl-scan-evidence-metric">
      <div className="sl-scan-evidence-metric-head">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{formatNumber(value)}</strong>
    </div>
  )
}

function CodeKnowledgePanel({
  signal,
  loading,
  error,
  onRetry,
  onOpenQa,
  onOpenChunks,
  onOpenArtifacts,
}: {
  signal: CodeKnowledgeSignal
  loading: boolean
  error: string | null
  onRetry: () => void
  onOpenQa: () => void
  onOpenChunks: () => void
  onOpenArtifacts: () => void
}) {
  const gate = codeKnowledgeGate(signal)
  return (
    <section className={`sl-code-knowledge-panel sl-code-knowledge-panel-${signal.tone}`} aria-label="Code Knowledge readiness">
      <div className="sl-code-knowledge-main">
        <div>
          <div className="sl-kicker">Code Knowledge</div>
          <h2>{signal.title}</h2>
          <p>{signal.summary}</p>
          <div className="sl-code-knowledge-tags">
            <Tag color={reportToneColor(signal.tone)}>{signal.readinessLabel}</Tag>
            <Tag>{formatNumber(signal.totalChunks)} code_chunks</Tag>
            <Tag color={signal.embeddingCoverage > 0 ? 'green' : 'default'}>向量覆盖 {signal.embeddingCoverage}%</Tag>
            <Tag>{retrievalModeLabel(signal.retrievalMode)}</Tag>
          </div>
        </div>
        <div className="sl-code-knowledge-score">
          <span>证据可信度</span>
          <strong>{signal.confidence}%</strong>
          <Progress percent={signal.confidence} showInfo={false} />
        </div>
      </div>

      <div className="sl-code-knowledge-grid">
        <div>
          <span>切片总量</span>
          <strong>{formatNumber(signal.totalChunks)}</strong>
        </div>
        <div>
          <span>已向量化</span>
          <strong>{formatNumber(signal.embeddedChunks)}</strong>
        </div>
        <div>
          <span>样例文件</span>
          <strong title={signal.sampleFile}>{signal.sampleFile}</strong>
        </div>
        <div>
          <span>下一步</span>
          <strong>{signal.nextAction}</strong>
        </div>
      </div>

      {error && (
        <div className="sl-code-knowledge-error" role="alert">
          <WarningOutlined />
          <span>{error}</span>
          <ActionButton size="small" icon={<ReloadOutlined spin={loading} />} onClick={onRetry} label="重新读取 code_chunks" />
        </div>
      )}

      <div
        className={`sl-code-knowledge-gate sl-code-knowledge-gate-${gate.ready ? 'ready' : 'blocked'}`}
        role="note"
        aria-label="代码知识库操作门禁说明"
      >
        <span>{gate.title}</span>
        <strong>{gate.detail}</strong>
      </div>

      <div className="sl-code-knowledge-actions">
        <ActionButton icon={<FileSearchOutlined />} disabled={signal.totalChunks <= 0} onClick={onOpenQa} label="代码问答" />
        <ActionButton icon={<CodeOutlined />} disabled={signal.totalChunks <= 0} onClick={onOpenChunks} label="检索切片" />
        <ActionButton icon={<FileTextOutlined />} onClick={onOpenArtifacts} label="产物证据" />
        <ActionButton icon={<ReloadOutlined spin={loading} />} onClick={onRetry} label="刷新状态" />
      </div>
    </section>
  )
}

function StatusTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="sl-status-tile">
      <div className="sl-status-tile-label">{label}</div>
      <div className="sl-status-tile-value">{value}</div>
    </div>
  )
}

function ReportDecisionPanel({ signal }: { signal: ReportQualitySignal }) {
  return (
    <section className={`sl-report-decision-panel sl-report-decision-panel-${signal.tone}`}>
      <div className="sl-report-decision-main">
        <div className="sl-report-decision-copy">
          <div className="sl-kicker">Report Decision</div>
          <h2>{signal.summary}</h2>
          <div className="sl-report-decision-tags">
            <Tag color={reportToneColor(signal.tone)}>{signal.label}</Tag>
            <Tag>可信度 {signal.confidence}%</Tag>
          </div>
        </div>
        <div className="sl-report-decision-score">
          <span>报告可信度</span>
          <strong>{signal.confidence}%</strong>
          <Progress percent={signal.confidence} showInfo={false} />
        </div>
      </div>
      <div className="sl-report-signal-grid">
        {signal.metrics.map(metric => (
          <div key={metric.label} className={`sl-report-signal-card sl-report-signal-card-${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-report-next-actions">
        {signal.nextActions.map(action => (
          <div key={action}>
            <CheckCircleOutlined />
            <span>{action}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReportRecommendedNextStep({ item }: { item: ReportRecommendedStep }) {
  const primaryBlocked = Boolean(item.primaryDisabled)
  const secondaryBlocked = Boolean(item.secondaryLabel && item.secondaryDisabled)
  const gateReady = !primaryBlocked && !secondaryBlocked
  const blockedActions = [
    primaryBlocked ? item.primaryLabel : null,
    secondaryBlocked ? item.secondaryLabel : null,
  ].filter(Boolean).join('、')
  const gateTitle = gateReady ? '推荐动作门禁已开放' : '推荐动作门禁未开放'
  const gateReason = gateReady
    ? item.actionGateReason
    : `${blockedActions || '推荐动作'} 当前不可执行。${item.actionGateReason}`

  return (
    <section
      className={`sl-report-recommended-step sl-report-recommended-step-${item.tone}`}
      aria-label="报告推荐下一步"
      data-recommended-step={item.key}
    >
      <div className="sl-report-recommended-step-icon">{item.icon}</div>
      <div className="sl-report-recommended-step-copy">
        <span>{item.label}</span>
        <strong>{item.title}</strong>
        <p>{item.detail}</p>
      </div>
      <div className="sl-report-recommended-step-actions">
        <ActionButton
          type="primary"
          disabled={item.primaryDisabled}
          onClick={item.onPrimary}
          label={item.primaryLabel}
        />
        {item.secondaryLabel && item.onSecondary && (
          <ActionButton
            disabled={item.secondaryDisabled}
            onClick={item.onSecondary}
            label={item.secondaryLabel}
          />
        )}
      </div>
      <div
        className={`sl-report-recommended-step-gate sl-report-recommended-step-gate-${gateReady ? 'ready' : 'blocked'}`}
        role="note"
        aria-label="报告推荐动作门禁说明"
      >
        <span>{gateTitle}</span>
        <strong>{gateReason}</strong>
      </div>
    </section>
  )
}

function ReportTrustedLoopPanel({ steps }: { steps: ReportTrustedLoopStep[] }) {
  return (
    <section className="sl-report-trusted-loop" aria-label="扫描报告可信闭环">
      <div className="sl-report-trusted-loop-head">
        <div>
          <span>Trusted Report Loop</span>
          <h2>扫描报告可信闭环</h2>
        </div>
        <p>把报告结论、引用证据、code_chunks、修复候选和治理留痕放在同一条责任链上，避免报告复盘只停留在阅读层。</p>
      </div>
      <div className="sl-report-trusted-loop-grid">
        {steps.map(step => (
          <article
            key={step.key}
            className={`sl-report-trusted-loop-step sl-report-trusted-loop-step-${step.tone}`}
            data-trusted-loop-step={step.key}
          >
            <div className="sl-report-trusted-loop-index">{step.index}</div>
            <div className="sl-report-trusted-loop-copy">
              <div className="sl-report-trusted-loop-meta">
                <span>{step.owner}</span>
                <Tag color={reportToneColor(step.tone)}>{step.value}</Tag>
              </div>
              <div className="sl-report-trusted-loop-title">
                <span className="sl-report-trusted-loop-icon">{step.icon}</span>
                <strong>{step.title}</strong>
              </div>
              <p>{step.detail}</p>
              <ActionButton size="small" icon={step.icon} disabled={step.disabled} onClick={step.onAction} label={step.actionLabel} />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ReportMainPathGuide({ steps }: { steps: ReportMainPathStep[] }) {
  return (
    <section className="sl-report-main-path" aria-label="报告主链路导览">
      <div className="sl-report-main-path-head">
        <div>
          <span>Execution Path</span>
          <strong>按这个顺序推进报告复核</strong>
        </div>
        <Tag>3 steps</Tag>
      </div>
      <div className="sl-report-main-path-list">
        {steps.map(step => (
          <article
            key={step.key}
            className={`sl-report-main-path-step sl-report-main-path-step-${step.tone}`}
            data-main-path-step={step.key}
          >
            <span className="sl-report-main-path-index">{step.index}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ReportEvidencePriorityRail({ items }: { items: ReportEvidencePriorityItem[] }) {
  return (
    <section className="sl-report-priority-rail" aria-label="报告证据优先阅读">
      <div className="sl-report-priority-rail-head">
        <div>
          <span>Evidence Priority</span>
          <strong>先看这 3 个证据入口</strong>
        </div>
        <Tag>Scan-bound</Tag>
      </div>
      <div className="sl-report-priority-grid">
        {items.map(item => (
          <article
            key={item.key}
            className={`sl-report-priority-card sl-report-priority-card-${item.tone}`}
            data-priority-key={item.key}
          >
            <div className="sl-report-priority-card-head">
              <span>{item.label}</span>
              <Tag color={reportToneColor(item.tone)}>{item.tone === 'ready' ? 'READY' : item.tone === 'danger' ? 'BLOCKED' : 'REVIEW'}</Tag>
            </div>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
            <div className="sl-report-priority-meta">{item.meta}</div>
            <div className="sl-report-priority-actions">
              <ActionButton size="small" disabled={item.disabled} onClick={item.onOpen} label={item.actionLabel} />
              {item.repairActionVisible && <Tag color="green">可进入修复候选</Tag>}
              {!item.repairActionVisible && <Tag color="default">不直接生成修复</Tag>}
            </div>
            <div
              className={`sl-report-priority-repair-gate sl-report-priority-repair-gate-${item.repairActionVisible ? 'ready' : 'blocked'}`}
              role="note"
              aria-label={`${item.label} 修复门禁说明`}
            >
              <span>{item.repairActionVisible ? '修复门禁已开放' : '修复门禁未开放'}</span>
              <strong>{item.repairGateReason}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ReportReviewGate({ items }: { items: ReportReviewGateItem[] }) {
  return (
    <section className="sl-report-review-gate" aria-label="报告复核门禁">
      <div className="sl-report-review-gate-head">
        <div>
          <div className="sl-kicker">报告复核门禁</div>
          <h3>报告进入治理前检查</h3>
        </div>
        <Tag>{items.filter(item => item.tone === 'ready').length}/{items.length} Ready</Tag>
      </div>
      <div className="sl-report-review-gate-grid">
        {items.map(item => (
          <div
            key={item.key}
            className={`sl-report-review-gate-item sl-report-review-gate-item-${item.tone}`}
            data-review-gate-key={item.key}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function reportCitationReadiness(
  evidence: ReportEvidenceDrawerData,
  chunkResult: CodeChunkSearchResponse | null,
  chunkLoading: boolean,
  chunkError: string | null,
): ReportCitationReadiness {
  const items = chunkResult?.items || []
  const primary = items.find(item => item.contextRole === 'PRIMARY') || items[0]
  const confidence = chunkResult?.evidenceProfile?.confidence
  const readiness = chunkResult?.evidenceProfile?.readiness || 'UNKNOWN'
  const score = typeof primary?.relevanceScore === 'number' ? Math.round(primary.relevanceScore) : null
  const fileAnchored = Boolean(primary && evidence.filePath && sameReportEvidencePath(evidence.filePath, primary.filePath))
  const lineNumber = firstReportEvidenceLine(evidence.lineNumber) || evidence.startLine || null
  const hasLineEvidence = Boolean(evidence.lineNumber || evidence.startLine)
  const lineAnchored = Boolean(primary && lineNumber && fileAnchored && lineOverlapsReportEvidence(lineNumber, primary.startLine, primary.endLine))
  const primaryEvidence = Boolean(primary && primary.contextRole === 'PRIMARY')
  const usableConfidence = typeof confidence === 'number' ? confidence >= 60 : true
  const usableScore = score == null || score >= 45
  const checks = [
    { label: `当前扫描 ${primary?.scanTaskId ? `#${primary.scanTaskId}` : '待确认'}`, ok: Boolean(primary?.scanTaskId) },
    { label: `主证据 ${primaryEvidence ? '命中' : '缺失'}`, ok: primaryEvidence },
    { label: `文件锚点 ${fileAnchored ? '命中' : '待复核'}`, ok: fileAnchored || !evidence.filePath },
    { label: `行号锚点 ${lineAnchored ? '命中' : '待复核'}`, ok: lineAnchored || !hasLineEvidence },
  ]

  if (chunkLoading) {
    return {
      status: 'REVIEW',
      tone: 'warning',
      title: '正在预检引用质量',
      summary: '系统正在用当前报告证据检索 code_chunks，完成后再判断是否适合进入 QA 引用复核。',
      metrics: [
        { label: 'Readiness', value: 'LOADING' },
        { label: 'Hits', value: '...' },
        { label: 'Score', value: '-' },
      ],
      checks,
    }
  }

  if (chunkError || items.length === 0) {
    return {
      status: 'GAP',
      tone: 'danger',
      title: '引用质量存在缺口',
      summary: chunkError
        ? '当前证据检索失败，不应直接把该报告证据推进到修复候选。请先重新检索或检查 code_chunks。'
        : '当前报告证据没有命中可展示的 code_chunks，建议先扩大检索或复核扫描产物。',
      metrics: [
        { label: 'Readiness', value: chunkError ? 'ERROR' : 'GAP' },
        { label: 'Hits', value: '0' },
        { label: 'Score', value: '-' },
      ],
      checks,
    }
  }

  if (primaryEvidence && usableConfidence && usableScore && (fileAnchored || !evidence.filePath)) {
    return {
      status: lineAnchored || !hasLineEvidence ? 'READY' : 'REVIEW',
      tone: lineAnchored || !hasLineEvidence ? 'ready' : 'warning',
      title: lineAnchored || !hasLineEvidence ? '可进入 QA 引用复核' : '可追问，行号需复核',
      summary: lineAnchored || !hasLineEvidence
        ? '当前报告证据已命中主代码证据和来源锚点，可以进入 QA，并由回答引用证据再次确认。'
        : '当前报告证据命中文件级主证据，但行号未完全对齐，进入 QA 后仍需人工确认具体位置。',
      metrics: [
        { label: 'Readiness', value: readiness },
        { label: 'Hits', value: String(chunkResult?.resultCount || items.length) },
        { label: 'Score', value: score == null ? '-' : String(score) },
      ],
      checks,
    }
  }

  return {
    status: 'REVIEW',
    tone: 'warning',
    title: '可追问，但需要复核',
    summary: '当前证据有 code_chunks 命中，但主证据、分数、可信度或来源锚点仍不足，QA 回答不能直接作为修复依据。',
    metrics: [
      { label: 'Readiness', value: readiness },
      { label: 'Hits', value: String(chunkResult?.resultCount || items.length) },
      { label: 'Score', value: score == null ? '-' : String(score) },
    ],
    checks,
  }
}

function ReportCitationReadinessPanel({ readiness }: { readiness: ReportCitationReadiness }) {
  return (
    <section className={`sl-report-citation-readiness sl-report-citation-readiness-${readiness.status.toLowerCase()}`} aria-label="引用质量预检">
      <div className="sl-report-citation-readiness-head">
        <div>
          <span>引用质量预检</span>
          <strong>{readiness.title}</strong>
        </div>
        <Tag color={readiness.status === 'READY' ? 'green' : readiness.status === 'REVIEW' ? 'gold' : 'red'}>
          {readiness.status}
        </Tag>
      </div>
      <p>{readiness.summary}</p>
      <div className="sl-report-citation-readiness-metrics">
        {readiness.metrics.map(metric => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-report-citation-readiness-checks">
        {readiness.checks.map(check => (
          <Tag key={check.label} color={check.ok ? 'green' : 'gold'}>
            {check.ok ? 'OK' : 'REVIEW'} · {check.label}
          </Tag>
        ))}
      </div>
    </section>
  )
}

function ReportEvidenceDecisionSummary({
  evidence,
  readiness,
  chunkResult,
}: {
  evidence: ReportEvidenceDrawerData
  readiness: ReportCitationReadiness
  chunkResult: CodeChunkSearchResponse | null
}) {
  const hitCount = chunkResult?.resultCount || chunkResult?.items.length || 0
  const readinessLabel = chunkResult?.evidenceProfile?.readiness || (hitCount > 0 ? 'READY' : '待检索')
  const confidence = typeof chunkResult?.evidenceProfile?.confidence === 'number'
    ? `${chunkResult.evidenceProfile.confidence}%`
    : '-'
  const canOpenRepair = Boolean(evidence.repairRisk && readiness.status === 'READY')
  const items: Array<{ key: string; label: string; tone: ReportSignalTone; value: string; detail: string }> = [
    {
      key: 'citation',
      label: '引用状态',
      tone: readiness.tone,
      value: readiness.status,
      detail: readiness.title,
    },
    {
      key: 'chunks',
      label: 'code_chunks',
      tone: hitCount > 0 ? 'ready' : 'warning',
      value: `${formatNumber(hitCount)} hits`,
      detail: `${readinessLabel} · 可信度 ${confidence}`,
    },
    {
      key: 'repair',
      label: '修复动作',
      tone: canOpenRepair ? 'ready' : readiness.status === 'GAP' ? 'danger' : 'warning',
      value: canOpenRepair ? '可生成候选' : '先复核证据',
      detail: canOpenRepair ? '文件级风险已达 READY' : '不直接放行修复候选',
    },
  ]

  return (
    <section className="sl-report-evidence-decision-summary" aria-label="报告证据决策摘要">
      {items.map(item => (
        <div key={item.key} className={`sl-report-evidence-decision-item sl-report-evidence-decision-item-${item.tone}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.detail}</small>
        </div>
      ))}
    </section>
  )
}

function ReportEvidenceHandoffSummary({
  evidence,
  readiness,
  chunkResult,
  chunkLoading,
  scanTaskId,
}: {
  evidence: ReportEvidenceDrawerData
  readiness: ReportCitationReadiness
  chunkResult: CodeChunkSearchResponse | null
  chunkLoading: boolean
  scanTaskId: number
}) {
  const primary = chunkResult?.items.find(item => item.contextRole === 'PRIMARY')
  const displayScanTaskId = chunkResult?.scanTaskId || primary?.scanTaskId || scanTaskId
  const hitCount = chunkLoading ? '检索中' : `${formatNumber(chunkResult?.resultCount || chunkResult?.items.length || 0)} hits`
  const confidence = typeof chunkResult?.evidenceProfile?.confidence === 'number'
    ? `${chunkResult.evidenceProfile.confidence}%`
    : '-'
  const filePath = evidence.filePath || primary?.filePath || '待确认'
  const lineNumber = reportEvidenceLineLabel(evidence) || (primary ? `${primary.startLine}-${primary.endLine}` : '待确认')
  const actionMeaning = readiness.status === 'READY'
    ? '可进入 QA 复核并开放修复候选'
    : readiness.status === 'REVIEW'
      ? '需要人工复核，只能追问/复制'
      : '只能追问/复制，修复候选不放行'
  const primaryLabel = primary ? 'PRIMARY 主证据已命中' : 'PRIMARY 主证据缺失'

  return (
    <section className={`sl-report-evidence-handoff-summary sl-report-evidence-handoff-summary-${readiness.status.toLowerCase()}`} aria-label="报告证据交接包">
      <div className="sl-report-evidence-handoff-head">
        <div className="sl-report-evidence-handoff-copy">
          <span>报告证据交接包</span>
          <strong>Scan #{displayScanTaskId} · {evidence.title}</strong>
        </div>
        <Tag color={readiness.status === 'READY' ? 'green' : readiness.status === 'REVIEW' ? 'gold' : 'red'}>
          {readiness.status}
        </Tag>
      </div>
      <div className="sl-report-evidence-handoff-grid">
        <div className="sl-report-evidence-handoff-item sl-report-evidence-handoff-item-wide">
          <span>目标文件</span>
          <strong title={filePath}>{filePath}</strong>
        </div>
        <div className="sl-report-evidence-handoff-item">
          <span>行号</span>
          <strong>{lineNumber}</strong>
        </div>
        <div className="sl-report-evidence-handoff-item">
          <span>Hits</span>
          <strong>{hitCount}</strong>
        </div>
        <div className="sl-report-evidence-handoff-item">
          <span>可信度</span>
          <strong>{confidence}</strong>
        </div>
        <div className="sl-report-evidence-handoff-item">
          <span>主证据</span>
          <strong>{primaryLabel}</strong>
        </div>
      </div>
      <p className="sl-report-evidence-handoff-action">当前动作含义：{actionMeaning}</p>
    </section>
  )
}

function ReportEvidenceActionRail({
  evidence,
  readiness,
  onOpenQa,
  onCopyReference,
  onOpenRepair,
}: {
  evidence: ReportEvidenceDrawerData
  readiness: ReportCitationReadiness
  onOpenQa: (evidence: ReportEvidenceDrawerData) => void
  onCopyReference: (evidence: ReportEvidenceDrawerData) => void
  onOpenRepair: (evidence: ReportEvidenceDrawerData) => void
}) {
  const canOpenRepair = Boolean(evidence.repairRisk && readiness.status === 'READY')
  const tagColor = readiness.status === 'READY' ? 'green' : readiness.status === 'REVIEW' ? 'gold' : 'red'
  const title = readiness.status === 'READY'
    ? '证据已就绪，先复核引用后进入修复'
    : readiness.status === 'REVIEW'
      ? '先完成 QA 引用复核'
      : '先补证据，不直接生成修复候选'
  const detail = readiness.status === 'READY'
    ? '当前报告证据已命中 code_chunks 主证据和来源锚点，可进入 QA 复核；文件级风险可继续生成受控修复候选。'
    : readiness.status === 'REVIEW'
      ? '当前证据还需要确认主证据、分数或行号锚点，建议先进入 QA 复核后再决定是否生成修复候选。'
      : '当前报告证据没有可用 code_chunks 命中或检索失败，先复制证据或进入 QA 扩大检索范围。'
  const repairGateTitle = canOpenRepair ? '修复门禁已开放' : '修复门禁未开放'
  const repairGateDetail = canOpenRepair
    ? 'READY 证据和文件级风险同时成立，允许生成受控修复候选。'
    : readiness.status === 'REVIEW'
      ? '引用质量仍需复核，暂不允许直接生成修复候选。'
      : '缺少可用 code_chunks 主证据，暂不允许直接生成修复候选。'

  return (
    <section className={`sl-report-evidence-action-rail sl-report-evidence-action-rail-${readiness.status.toLowerCase()}`} aria-label="报告证据下一步动作">
      <div className="sl-report-evidence-action-rail-copy">
        <span>下一步动作</span>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <Tag color={tagColor}>{readiness.status}</Tag>
      <div className="sl-report-evidence-action-rail-actions">
        <ActionButton
          type="primary"
          icon={<FileSearchOutlined />}
          onClick={() => onOpenQa(evidence)}
          label="基于此证据追问"
        />
        <ActionButton
          icon={<CodeOutlined />}
          disabled={!canOpenRepair}
          title={canOpenRepair ? '生成受控修复候选' : '引用质量未达 READY，先定位文件并完成 QA 复核'}
          onClick={() => onOpenRepair(evidence)}
          label={canOpenRepair ? '生成修复候选' : '定位修复文件'}
        />
        <ActionButton
          icon={<LinkOutlined />}
          onClick={() => onCopyReference(evidence)}
          label="复制证据引用"
        />
      </div>
      <div className={`sl-report-evidence-action-rail-guard sl-report-evidence-action-rail-guard-${canOpenRepair ? 'ready' : 'blocked'}`} aria-label="报告证据修复门禁说明">
        <span>{repairGateTitle}</span>
        <strong>{repairGateDetail}</strong>
      </div>
    </section>
  )
}

function sameReportEvidencePath(left?: string | null, right?: string | null) {
  const normalizedLeft = normalizeReportEvidencePath(left)
  const normalizedRight = normalizeReportEvidencePath(right)
  if (!normalizedLeft || !normalizedRight) {
    return false
  }
  return normalizedLeft === normalizedRight
    || normalizedLeft.endsWith(`/${normalizedRight}`)
    || normalizedRight.endsWith(`/${normalizedLeft}`)
}

function normalizeReportEvidencePath(value?: string | null) {
  if (!value || !value.trim()) {
    return ''
  }
  return value.trim().replace(/\\/g, '/').replace(/\/+/g, '/')
}

function firstReportEvidenceLine(value?: string | null) {
  if (!value) {
    return null
  }
  const match = value.match(/\d+/)
  if (!match) {
    return null
  }
  const parsed = Number(match[0])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function reportEvidencePositiveLine(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = Number(value)
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }
  return undefined
}

function reportEvidenceLineLabel(evidence: Pick<ReportEvidenceDrawerData, 'lineNumber' | 'startLine' | 'endLine'>): string {
  if (evidence.lineNumber) return evidence.lineNumber
  if (!evidence.startLine) return ''
  if (!evidence.endLine || evidence.endLine <= evidence.startLine) return String(evidence.startLine)
  return `${evidence.startLine}-${evidence.endLine}`
}

function lineOverlapsReportEvidence(line: number, start?: number | null, end?: number | null) {
  const safeStart = start && start > 0 ? start : line
  const safeEnd = end && end >= safeStart ? end : safeStart
  return line >= safeStart && line <= safeEnd
}

function redactReportEvidenceText(value?: string | null): string {
  return redactSensitiveText(value || '')
}

function redactedReportEvidenceForOutput(evidence: ReportEvidenceDrawerData): ReportEvidenceDrawerData {
  return {
    ...evidence,
    title: redactReportEvidenceText(evidence.title),
    category: redactReportEvidenceText(evidence.category),
    source: redactReportEvidenceText(evidence.source),
    summary: redactReportEvidenceText(evidence.summary),
    qaQuestion: redactReportEvidenceText(evidence.qaQuestion),
    filePath: evidence.filePath ? redactReportEvidenceText(evidence.filePath) : evidence.filePath,
    lineNumber: evidence.lineNumber ? redactReportEvidenceText(evidence.lineNumber) : evidence.lineNumber,
    startLine: evidence.startLine,
    endLine: evidence.endLine,
    fields: evidence.fields.map(field => ({
      label: redactReportEvidenceText(field.label),
      value: redactReportEvidenceText(field.value),
    })),
    artifactTypes: evidence.artifactTypes?.map(type => redactReportEvidenceText(type)),
  }
}

function ReportEvidenceDrawer({
  evidence,
  open,
  onClose,
  onOpenQa,
  onCopyReference,
  onOpenRepair,
  chunkResult,
  chunkLoading,
  chunkError,
  scanTaskId,
}: {
  evidence: ReportEvidenceDrawerData | null
  open: boolean
  onClose: () => void
  onOpenQa: (evidence: ReportEvidenceDrawerData) => void
  onCopyReference: (evidence: ReportEvidenceDrawerData) => void
  onOpenRepair: (evidence: ReportEvidenceDrawerData) => void
  chunkResult: CodeChunkSearchResponse | null
  chunkLoading: boolean
  chunkError: string | null
  scanTaskId: number
}) {
  const citationReadiness = evidence ? reportCitationReadiness(evidence, chunkResult, chunkLoading, chunkError) : null
  const displayEvidence = evidence ? redactedReportEvidenceForOutput(evidence) : null
  return (
    <Drawer
      className="sl-report-evidence-drawer"
      title="报告证据抽屉"
      width="min(560px, 92vw)"
      open={open}
      onClose={onClose}
      extra={displayEvidence ? <Tag color={reportToneColor(displayEvidence.tone)}>{displayEvidence.category}</Tag> : null}
    >
      {evidence && displayEvidence && (
        <div className="sl-report-evidence-drawer-stack">
          <section className={`sl-report-evidence-drawer-signal sl-report-evidence-drawer-${displayEvidence.tone}`}>
            <div>
              <span>{displayEvidence.source}</span>
              <strong>{displayEvidence.title}</strong>
              <p>{displayEvidence.summary}</p>
            </div>
            <Tag color={reportToneColor(displayEvidence.tone)}>{displayEvidence.tone}</Tag>
          </section>

          <section className="sl-report-evidence-drawer-grid" aria-label="证据字段">
            {displayEvidence.fields.map(field => (
              <div key={field.label}>
                <span>{field.label}</span>
                <strong title={field.value}>{field.value}</strong>
              </div>
            ))}
          </section>

          {(displayEvidence.filePath || reportEvidenceLineLabel(displayEvidence) || displayEvidence.artifactTypes?.length) && (
            <section className="sl-report-evidence-drawer-context" aria-label="证据上下文">
              {displayEvidence.filePath && (
                <div>
                  <span>文件路径</span>
                  <Text code copyable>{displayEvidence.filePath}</Text>
                </div>
              )}
              {reportEvidenceLineLabel(displayEvidence) && (
                <div>
                  <span>行号</span>
                  <Text code>{reportEvidenceLineLabel(displayEvidence)}</Text>
                </div>
              )}
              {displayEvidence.artifactTypes && displayEvidence.artifactTypes.length > 0 && (
                <div>
                  <span>报告来源</span>
                  <Space wrap>
                    {displayEvidence.artifactTypes.map(type => (
                      <Tag key={type}>{ARTIFACT_TITLES[type] || type}</Tag>
                    ))}
                  </Space>
                </div>
              )}
            </section>
          )}

          <section className="sl-report-evidence-drawer-question" aria-label="绑定当前扫描的问答上下文">
            <span>绑定问题</span>
            <pre className="sl-report-evidence-question-redacted" aria-label="脱敏报告证据问题">{displayEvidence.qaQuestion}</pre>
          </section>

          <section className="sl-report-evidence-chunks" aria-label="code_chunks 命中摘要">
            <div className="sl-report-evidence-chunks-head">
              <div>
                <span>Code chunks</span>
                <strong>{chunkLoading ? '检索中' : `${formatNumber(chunkResult?.resultCount || 0)} / ${formatNumber(chunkResult?.total || 0)} hits`}</strong>
              </div>
              <Space wrap>
                <Tag>{retrievalModeLabel(chunkResult?.retrievalMode || 'NO_CONTEXT')}</Tag>
                {chunkResult?.evidenceProfile?.readiness && <Tag>{chunkResult.evidenceProfile.readiness}</Tag>}
                {typeof chunkResult?.evidenceProfile?.confidence === 'number' && <Tag>可信度 {chunkResult.evidenceProfile.confidence}%</Tag>}
                {typeof chunkResult?.evidenceProfile?.uniqueFiles === 'number' && <Tag>{chunkResult.evidenceProfile.uniqueFiles} files</Tag>}
              </Space>
            </div>
            {chunkError ? (
              <div className="sl-report-evidence-chunk-error" role="alert">
                <WarningOutlined />
                <span>{chunkError}</span>
              </div>
            ) : chunkResult && chunkResult.items.length > 0 ? (
              <div className="sl-report-evidence-chunk-list">
                {chunkResult.items.slice(0, 3).map(item => (
                  <CodeChunkEvidenceCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <StateBlock compact title={chunkLoading ? '正在检索代码证据' : '暂无代码片段命中'} description={chunkLoading ? '系统正在用当前证据上下文检索 code_chunks。' : '当前证据暂未命中可展示的 code_chunks，可继续进入代码问答扩大检索范围。'} />
            )}
          </section>

          {citationReadiness && <ReportCitationReadinessPanel readiness={citationReadiness} />}

          {citationReadiness && (
            <ReportEvidenceDecisionSummary
              evidence={evidence}
              readiness={citationReadiness}
              chunkResult={chunkResult}
            />
          )}

          {citationReadiness && (
            <ReportEvidenceHandoffSummary
              evidence={evidence}
              readiness={citationReadiness}
              chunkResult={chunkResult}
              chunkLoading={chunkLoading}
              scanTaskId={scanTaskId}
            />
          )}

          {citationReadiness && (
            <ReportEvidenceActionRail
              evidence={evidence}
              readiness={citationReadiness}
              onOpenQa={onOpenQa}
              onCopyReference={onCopyReference}
              onOpenRepair={onOpenRepair}
            />
          )}
        </div>
      )}
    </Drawer>
  )
}

function CodeChunkEvidenceCard({ item }: { item: CodeChunkSearchItem }) {
  const lineRange = item.startLine && item.endLine ? `${item.startLine}-${item.endLine}` : '-'
  const reference = item.startLine && item.endLine ? `${item.filePath}:${lineRange}` : item.filePath
  const scoreValue = typeof item.relevanceScore === 'number' ? Math.round(item.relevanceScore) : null
  const needsReview = scoreValue != null && scoreValue < 45
  const isPrimary = item.contextRole === 'PRIMARY'
  const isFrontend = item.evidenceType === 'FRONTEND'
  const reason = item.evidenceReason || `${isPrimary ? '主证据' : '相邻上下文'} · ${item.evidenceType || 'OTHER'} · Score ${scoreValue ?? 0}`
  const redactedPreview = redactCodeChunkPreview(item.contentPreview || item.content || '')
  return (
    <article className={`sl-report-evidence-chunk-card ${needsReview || !isPrimary || isFrontend ? 'sl-report-evidence-chunk-card-review' : ''}`}>
      <div className="sl-report-evidence-chunk-meta">
        <strong title={reference}>{reference}</strong>
        <Tag>{lineRange}</Tag>
      </div>
      <Text code copyable className="sl-report-evidence-chunk-reference">{reference}</Text>
      <div className="sl-report-evidence-chunk-tags">
        <Tag color="blue">Scan #{item.scanTaskId}</Tag>
        {item.sourceLabel && <Tag>{item.sourceLabel}</Tag>}
        {item.contextRole && <Tag color={isPrimary ? 'green' : 'default'}>{isPrimary ? '主证据' : '相邻上下文'}</Tag>}
        {item.evidenceType && <Tag>{item.evidenceType}</Tag>}
        {scoreValue != null && <Tag color={needsReview ? 'gold' : 'blue'}>Score {scoreValue}</Tag>}
        <Tag>{item.hasEmbedding ? '语义证据' : '关键词证据'}</Tag>
        {(needsReview || !isPrimary || isFrontend) && <Tag color="gold">需复核</Tag>}
      </div>
      <p>{reason}</p>
      <pre className="sl-report-evidence-chunk-preview-redacted" aria-label="脱敏 code chunk 预览">
        {redactedPreview}
      </pre>
      {item.matchedTerms.length > 0 && (
        <div className="sl-report-evidence-chunk-terms">
          {item.matchedTerms.slice(0, 3).map(term => <Tag key={term}>{term}</Tag>)}
        </div>
      )}
    </article>
  )
}

function redactCodeChunkPreview(value: string): string {
  return redactSensitiveText(value)
}

function ReportActionBoard({ items }: { items: ReportActionItem[] }) {
  return (
    <section className="sl-report-action-board" aria-label="报告后续行动">
      <div className="sl-report-action-board-head">
        <div>
          <span>Action Routing</span>
          <strong>后续行动分流</strong>
        </div>
        <Tag>{items.length} actions</Tag>
      </div>
      <div className="sl-report-action-grid">
        {items.map(item => (
          <div key={item.key} className={`sl-report-action-card sl-report-action-card-${item.tone}`} data-action-key={item.key}>
            <div className="sl-report-action-head">
              <div className="sl-report-action-icon">{item.icon}</div>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
            <p>{item.detail}</p>
            <div className="sl-report-action-buttons">
              <ActionButton size="small" disabled={item.disabled} onClick={item.onClick} label={item.actionLabel} />
              {item.onCopyLink && (
                <ActionButton size="small" icon={<LinkOutlined />} disabled={item.disabled} onClick={item.onCopyLink} label="复制链接" />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReportEvidenceProfilePanel({
  profile,
  canOpenExecution,
  canOpenAutoRepair,
  autoRepairActionLabel,
  onOpenArtifacts,
  onOpenExecution,
  onOpenQa,
  onOpenAutoRepair,
}: {
  profile: ReportEvidenceProfile
  canOpenExecution: boolean
  canOpenAutoRepair: boolean
  autoRepairActionLabel: string
  onOpenArtifacts: () => void
  onOpenExecution: () => void
  onOpenQa: () => void
  onOpenAutoRepair: () => void
}) {
  return (
    <section className={`sl-report-evidence-profile sl-report-evidence-profile-${profile.tone}`}>
      <div className="sl-report-evidence-head">
        <div>
          <div className="sl-kicker">证据契约</div>
          <h3>{profile.summary}</h3>
        </div>
        <Tag color={reportToneColor(profile.tone)}>{profile.label}</Tag>
      </div>
      <div className="sl-report-evidence-matrix">
        {profile.items.map(item => (
          <div key={item.key} className={`sl-report-evidence-item sl-report-evidence-item-${item.tone}`}>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="sl-report-workflow-bridge">
        <ActionButton icon={<FileTextOutlined />} onClick={onOpenArtifacts} label="产物库" />
        <ActionButton icon={<ScheduleOutlined />} disabled={!canOpenExecution} onClick={onOpenExecution} label="执行流水线" />
        <ActionButton icon={<FileSearchOutlined />} onClick={onOpenQa} label="代码问答" />
        <ActionButton icon={<CodeOutlined />} disabled={!canOpenAutoRepair} onClick={onOpenAutoRepair} label={autoRepairActionLabel} />
      </div>
      {profile.missingCoreArtifacts.length > 0 && (
        <div className="sl-report-evidence-gap">
          <WarningOutlined />
          <span>缺口：{profile.missingCoreArtifacts.map(type => ARTIFACT_TITLES[type] || type).join('、')}</span>
        </div>
      )}
    </section>
  )
}

function ReportCitationQualityPanel({ quality }: { quality: ReportCitationQualitySummary }) {
  return (
    <section
      className={`sl-report-citation-quality sl-report-citation-quality-${quality.status.toLowerCase()}`}
      aria-label="报告引用质量"
    >
      <div className="sl-report-citation-quality-head">
        <div>
          <div className="sl-kicker">Report Citation Quality</div>
          <h3>{quality.title}</h3>
          <p>{quality.summary}</p>
        </div>
        <Tag color={quality.status === 'READY' ? 'green' : quality.status === 'REVIEW' ? 'gold' : 'red'}>
          {quality.status}
        </Tag>
      </div>
      <div className="sl-report-citation-quality-metrics">
        {quality.metrics.map(metric => (
          <div key={metric.label} className={`sl-report-citation-quality-metric sl-report-citation-quality-metric-${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-report-citation-quality-source-coverage" role="group" aria-label="报告引用来源覆盖">
        <div>
          <span>Source coverage</span>
          <strong>{quality.sourceSections.length > 0 ? `${quality.sourceSections.length} sections` : 'Missing'}</strong>
        </div>
        <div className="sl-report-citation-quality-source-list">
          {quality.sourceSections.length > 0
            ? quality.sourceSections.map(source => <Tag key={source.section}>{source.section} · {source.label}</Tag>)
            : <Tag color="red">Missing</Tag>}
        </div>
      </div>
      <div className="sl-report-citation-quality-verdict" role="group" aria-label="报告引用质量裁决依据">
        {quality.verdict.map(signal => (
          <div key={signal.label} className={`sl-report-citation-quality-verdict-item sl-report-citation-quality-verdict-${signal.tone}`}>
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
          </div>
        ))}
      </div>
      <details className="sl-report-citation-quality-details" aria-label="报告引用质量绑定明细">
        <summary>
          <span>Binding details</span>
          <strong>{quality.checks.length + quality.narrativeBindings.length} checks</strong>
        </summary>
        <div className="sl-report-citation-quality-grid">
          <div className="sl-report-citation-quality-list" aria-label="报告结构证据绑定">
            <span>Section bindings</span>
            {quality.checks.slice(0, 6).map(check => (
              <div key={check.key}>
                <strong>{check.label}</strong>
                <small>{check.sourceSection}</small>
                <Tag color={reportToneColor(check.tone)}>{check.status}</Tag>
              </div>
            ))}
          </div>
          <div className="sl-report-citation-quality-list" aria-label="报告叙事绑定">
            <span>Narrative binding</span>
            {quality.narrativeBindings.slice(0, 6).map(binding => (
              <div key={binding.key}>
                <strong>{binding.label}</strong>
                <small>{binding.sourceSection}</small>
                <Tag color={reportToneColor(binding.tone)}>{binding.status}</Tag>
              </div>
            ))}
          </div>
        </div>
      </details>
      <div className="sl-report-citation-quality-footer">
        <div>
          <strong>下一步</strong>
          <span>{quality.nextAction}</span>
        </div>
        <div>
          <strong>边界</strong>
          <span>{quality.boundary}</span>
        </div>
      </div>
    </section>
  )
}

function ReportGovernanceTimeline({
  cards,
  stages,
  events,
  loading,
  error,
  scanTaskId,
  onRetry,
  onCreateRepair,
  onCreateAgentTask,
  onOpenAudit,
}: {
  cards: ReportGovernanceCard[]
  stages: ReportGovernanceStage[]
  events: ReportGovernanceEvent[]
  loading: boolean
  error: string | null
  scanTaskId: number
  onRetry: () => void
  onCreateRepair: () => void
  onCreateAgentTask: () => void
  onOpenAudit: () => void
}) {
  return (
    <section className="sl-report-governance" aria-label="修复治理时间线">
      <div className="sl-report-governance-head">
        <div>
          <div className="sl-kicker">Repair Governance</div>
          <h3>修复治理时间线</h3>
          <p>把当前扫描报告的风险、修复、Agent 任务、执行、产物和审计留痕绑定到同一条闭环。</p>
        </div>
        <Space wrap>
          <Tag>Scan #{scanTaskId}</Tag>
          <Tag color={error ? 'red' : loading ? 'gold' : 'green'}>{error ? 'PARTIAL' : loading ? 'LOADING' : 'BOUND'}</Tag>
        </Space>
      </div>

      <div className="sl-report-governance-grid">
        {cards.map(card => (
          <div key={card.key} className={`sl-report-governance-card sl-report-governance-card-${card.tone}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="sl-report-governance-stage-rail" aria-label="修复治理阶段轨道">
        {stages.map((stage, index) => (
          <article key={stage.key} className={`sl-report-governance-stage sl-report-governance-stage-${stage.state}`}>
            <div className="sl-report-governance-stage-index" aria-hidden="true">{index + 1}</div>
            <div className="sl-report-governance-stage-icon" aria-hidden="true">{stage.icon}</div>
            <div className="sl-report-governance-stage-copy">
              <div className="sl-report-governance-stage-meta">
                <span>{stage.label}</span>
                <Tag color={governanceStageColor(stage.state)}>{stage.stateLabel}</Tag>
              </div>
              <p>{stage.reason}</p>
            </div>
            <ActionButton
              size="small"
              type={stage.state === 'blocked' ? 'primary' : undefined}
              disabled={stage.disabled}
              onClick={stage.onAction}
              label={stage.actionLabel}
            />
          </article>
        ))}
      </div>

      {error ? (
        <div className="sl-report-governance-error" role="alert">
          <WarningOutlined />
          <span>{error}</span>
          <ActionButton size="small" icon={<ReloadOutlined spin={loading} />} onClick={onRetry} label="重新加载治理时间线" />
        </div>
      ) : events.length > 0 ? (
        <div className="sl-report-governance-events" aria-label="治理事件">
          {events.slice(0, 12).map(event => (
            <article key={event.key} className={`sl-report-governance-event sl-report-governance-event-${event.tone}`}>
              <div className="sl-report-governance-event-main">
                <div className="sl-report-governance-event-meta">
                  <Tag color={reportToneColor(event.tone)}>{event.source}</Tag>
                  {event.repairEvidenceGate ? (
                    <Tag color={repairEvidenceGateColor(event.repairEvidenceGate)}>门禁 {event.repairEvidenceGate}</Tag>
                  ) : null}
                  {event.repairEvidenceGateSource ? (
                    <Tag>门禁来源 {event.repairEvidenceGateSource}</Tag>
                  ) : null}
                  <span>{formatTime(event.timestamp)}</span>
                </div>
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
                {event.repairEvidenceGateReason ? (
                  <p className="sl-report-governance-event-reason">门禁原因 {event.repairEvidenceGateReason}</p>
                ) : null}
              </div>
              <div className="sl-report-governance-event-action">
                <Tag>{event.status}</Tag>
                {(event.actions && event.actions.length > 0) ? (
                  <div className="sl-report-governance-event-action-list" aria-label={`${event.title} 复核动作`}>
                    {event.actions.map(action => (
                      <ActionButton
                        key={action.key}
                        size="small"
                        data-sl-target-url={action.targetUrl}
                        onClick={action.onOpen}
                        label={action.label}
                      />
                    ))}
                  </div>
                ) : (
                  <ActionButton size="small" data-sl-target-url={event.targetUrl} onClick={event.onOpen} label={event.actionLabel} />
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="sl-report-governance-empty">
          <StateBlock
            compact
            title={loading ? '正在聚合治理信号' : '尚未形成修复闭环'}
            description={loading ? '系统正在读取当前扫描的修复、任务、执行、产物和审计记录。' : '这份报告还没有绑定修复候选或 Agent 任务，可先生成候选或创建审查任务。'}
          />
        </div>
      )}

      <div className="sl-report-governance-actions">
        <ActionButton icon={<CodeOutlined />} onClick={onCreateRepair} label="生成修复候选" />
        <ActionButton icon={<RobotOutlined />} onClick={onCreateAgentTask} label="创建 Agent 任务" />
        <ActionButton icon={<SafetyCertificateOutlined />} onClick={onOpenAudit} label="打开审计" />
        <ActionButton icon={<ReloadOutlined spin={loading} />} onClick={onRetry} label="刷新治理" />
      </div>
    </section>
  )
}

function ReportTraceMap({
  items,
  canOpenQa,
  onOpenEvidence,
  onOpenQa,
  onCopyQa,
}: {
  items: ReportTraceItem[]
  canOpenQa: boolean
  onOpenEvidence: (item: ReportTraceItem) => void
  onOpenQa: (question: string) => void
  onCopyQa: (question: string) => void
}) {
  return (
    <section className="sl-report-trace-map" aria-label="报告证据追踪">
      <div className="sl-report-trace-head">
        <div>
          <div className="sl-kicker">Trace Map</div>
          <h3>报告章节追踪</h3>
        </div>
        <Tag>{items.length} 个证据面</Tag>
      </div>
      <div className="sl-report-trace-grid">
        {items.map(item => {
          const sourceActionReady = !item.disabled
          const qaActionReady = canOpenQa && Boolean(item.qaQuestion)
          const gateReady = sourceActionReady && qaActionReady
          const blockedActions = [
            sourceActionReady ? null : item.actionLabel,
            qaActionReady ? null : '追问代码/复制问答链接',
          ].filter(Boolean).join('、')
          const gateTitle = gateReady ? '追踪动作门禁已开放' : '追踪动作门禁未开放'
          const gateReason = gateReady
            ? item.actionGateReason
            : `${blockedActions || '追踪动作'} 当前不可执行。${item.actionGateReason}`

          return (
            <div
              key={item.key}
              className={`sl-report-trace-card sl-report-trace-card-${item.tone}`}
              data-trace-key={item.key}
              data-trace-source={item.source}
            >
              <div className="sl-report-trace-card-head">
                <div className="sl-report-trace-icon">{item.icon}</div>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </div>
              <div className="sl-report-trace-source">{item.source}</div>
              <p>{item.detail}</p>
              <div
                className={`sl-report-trace-gate sl-report-trace-gate-${gateReady ? 'ready' : 'blocked'}`}
                role="note"
                aria-label={`${item.label} 追踪动作门禁说明`}
              >
                <span>{gateTitle}</span>
                <strong>{gateReason}</strong>
              </div>
              <div className="sl-report-trace-actions">
                <ActionButton size="small" icon={<FileSearchOutlined />} onClick={() => onOpenEvidence(item)} label="查看证据" />
                <ActionButton size="small" disabled={item.disabled} onClick={item.onOpen} label={item.actionLabel} />
                <ActionButton
                  size="small"
                  disabled={!canOpenQa || !item.qaQuestion}
                  onClick={() => item.qaQuestion && onOpenQa(item.qaQuestion)}
                  label="追问代码"
                />
                <ActionButton
                  size="small"
                  icon={<LinkOutlined />}
                  disabled={!canOpenQa || !item.qaQuestion}
                  onClick={() => item.qaQuestion && onCopyQa(item.qaQuestion)}
                  label="复制问答链接"
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function buildReportGovernanceStages({
  risks,
  artifacts,
  governance,
  onOpenEvidence,
  onOpenQa,
  onCreateRepair,
  onOpenAutoRepair,
  onOpenAudit,
}: {
  risks: any[]
  artifacts: ScanArtifactView[]
  governance: ReportGovernanceSnapshot | null
  onOpenEvidence: () => void
  onOpenQa: () => void
  onCreateRepair: () => void
  onOpenAutoRepair: () => void
  onOpenAudit: () => void
}): ReportGovernanceStage[] {
  const autoRepairs = governance?.autoRepairs || []
  const auditLogs = governance?.auditLogs || []
  const toolCalls = governance?.agentToolCalls || []
  const governanceArtifacts = governance?.artifacts || []
  const fileBoundRisks = risks.filter(risk => riskFilePath(risk)).length
  const candidateReceiptCount = auditLogs.filter(log => log.action === 'AUTO_REPAIR_CANDIDATE_CREATED').length
  const patchArtifacts = Math.max(
    autoRepairs.filter(repair => repair.patchArtifactPath).length,
    governanceArtifacts.filter(artifact => artifact.ownerType === 'AUTO_REPAIR' && artifact.artifactType === 'CHANGE_PATCH').length,
  )
  const runningRepairs = autoRepairs.filter(item => isRunningStatus(item.status)).length
  const failedRepairs = autoRepairs.filter(item => isFailedStatus(item.status)).length
  const patchReadyRepairs = autoRepairs.filter(item => ['PATCH_READY', 'PR_CREATED', 'PR_MERGED'].includes(String(item.status || '').toUpperCase())).length
  const prCreatedRepairs = autoRepairs.filter(item => ['PR_CREATED', 'PR_MERGED'].includes(String(item.status || '').toUpperCase())).length
  const prGateLogs = auditLogs.filter(isAutoRepairPrGateLog)
  const latestPrGateLog = latestAuditLog(prGateLogs)
  const prQueuedLogs = prGateLogs.filter(log => log.action === 'AUTO_REPAIR_PR_QUEUED').length
  const prCreatedLogs = prGateLogs.filter(log => log.action === 'AUTO_REPAIR_PR_CREATED').length
  const prRejectedLogs = prGateLogs.filter(log => log.action === 'AUTO_REPAIR_PR_REJECTED').length
  const prFailedLogs = prGateLogs.filter(log => log.action === 'AUTO_REPAIR_PR_FAILED').length
  const prBlockedLogs = prRejectedLogs + prFailedLogs
  const latestPrGateAction = latestPrGateLog?.action || ''
  const archivedEvidence = artifacts.length + governanceArtifacts.length + auditLogs.length + toolCalls.length

  return [
    {
      key: 'risk-localization',
      label: '风险定位',
      state: risks.length <= 0 ? 'ready' : fileBoundRisks > 0 ? 'ready' : 'blocked',
      stateLabel: risks.length <= 0 ? 'ready' : fileBoundRisks > 0 ? 'ready' : 'blocked',
      reason: risks.length <= 0
        ? '当前报告未发现需要修复的风险，仍可复核产物证据。'
        : fileBoundRisks > 0
          ? `${formatNumber(fileBoundRisks)} 个风险已绑定文件，可进入修复候选。`
          : '报告风险尚未绑定文件，需先用代码问答定位证据。',
      actionLabel: fileBoundRisks > 0 || risks.length <= 0 ? '查看证据' : '定位文件',
      icon: <FileSearchOutlined />,
      onAction: fileBoundRisks > 0 || risks.length <= 0 ? onOpenEvidence : onOpenQa,
    },
    {
      key: 'repair-candidate',
      label: '修复候选',
      state: autoRepairs.length > 0 ? runningRepairs > 0 ? 'running' : failedRepairs > 0 ? 'blocked' : 'ready' : risks.length > 0 ? 'blocked' : 'empty',
      stateLabel: autoRepairs.length > 0 ? runningRepairs > 0 ? 'running' : failedRepairs > 0 ? 'blocked' : 'ready' : risks.length > 0 ? 'blocked' : 'empty',
      reason: autoRepairs.length > 0
        ? `${formatNumber(autoRepairs.length)} 个修复候选已绑定当前扫描，${formatNumber(candidateReceiptCount)} 个有来源凭证。`
        : risks.length > 0
          ? '还没有从报告风险生成修复候选。'
          : '当前报告没有待修复风险，修复候选可保持空闲。',
      actionLabel: autoRepairs.length > 0 ? '打开修复' : '生成候选',
      icon: <CodeOutlined />,
      disabled: risks.length <= 0 && autoRepairs.length <= 0,
      onAction: autoRepairs.length > 0 ? onOpenAutoRepair : onCreateRepair,
    },
    {
      key: 'patch-evidence',
      label: 'Patch 证据',
      state: patchArtifacts > 0 || patchReadyRepairs > 0 ? 'ready' : runningRepairs > 0 ? 'running' : autoRepairs.length > 0 ? 'blocked' : 'empty',
      stateLabel: patchArtifacts > 0 || patchReadyRepairs > 0 ? 'ready' : runningRepairs > 0 ? 'running' : autoRepairs.length > 0 ? 'blocked' : 'empty',
      reason: patchArtifacts > 0
        ? `${formatNumber(patchArtifacts)} 个 patch artifact 已归档，可复核 Diff 和执行证据。`
        : patchReadyRepairs > 0
          ? `${formatNumber(patchReadyRepairs)} 个候选已进入 PATCH_READY。`
          : autoRepairs.length > 0
            ? '修复候选尚未形成可归档 patch 证据。'
            : '生成修复候选后才会产生 patch 证据。',
      actionLabel: patchArtifacts > 0 ? '产物库' : '打开修复',
      icon: <BranchesOutlined />,
      disabled: autoRepairs.length <= 0 && patchArtifacts <= 0,
      onAction: patchArtifacts > 0 ? onOpenEvidence : onOpenAutoRepair,
    },
    {
      key: 'pr-review',
      label: 'PR 复核',
      state: latestPrGateAction === 'AUTO_REPAIR_PR_CREATED' || prCreatedRepairs > 0
        ? 'ready'
        : ['AUTO_REPAIR_PR_REJECTED', 'AUTO_REPAIR_PR_FAILED'].includes(latestPrGateAction) || prBlockedLogs > 0
          ? 'blocked'
          : latestPrGateAction === 'AUTO_REPAIR_PR_QUEUED' || prQueuedLogs > 0 || patchReadyRepairs > 0
            ? 'running'
            : failedRepairs > 0
              ? 'blocked'
              : 'empty',
      stateLabel: latestPrGateAction === 'AUTO_REPAIR_PR_CREATED' || prCreatedRepairs > 0
        ? 'ready'
        : ['AUTO_REPAIR_PR_REJECTED', 'AUTO_REPAIR_PR_FAILED'].includes(latestPrGateAction) || prBlockedLogs > 0
          ? 'blocked'
          : latestPrGateAction === 'AUTO_REPAIR_PR_QUEUED' || prQueuedLogs > 0 || patchReadyRepairs > 0
            ? 'running'
            : failedRepairs > 0
              ? 'blocked'
              : 'empty',
      reason: prCreatedLogs > 0 || prCreatedRepairs > 0
        ? `${formatNumber(prCreatedRepairs)} 个 PR 已创建或合并。`
        : prBlockedLogs > 0
          ? `${formatNumber(prRejectedLogs)} 个 PR Gate 拒绝，${formatNumber(prFailedLogs)} 个 PR 创建失败。`
          : prQueuedLogs > 0
            ? `${formatNumber(prQueuedLogs)} 个 PR 创建已排队，等待执行结果。`
        : patchReadyRepairs > 0
          ? 'Patch 已就绪，下一步进入创建 PR 前人工复核。'
          : failedRepairs > 0
            ? '修复失败阻断 PR 复核，需要先处理失败原因。'
            : '等待 Patch 证据形成后进入 PR 复核。',
      actionLabel: '打开修复',
      icon: <SafetyCertificateOutlined />,
      disabled: autoRepairs.length <= 0,
      onAction: onOpenAutoRepair,
    },
    {
      key: 'audit-archive',
      label: '审计归档',
      state: archivedEvidence > 0 ? 'ready' : 'empty',
      stateLabel: archivedEvidence > 0 ? 'ready' : 'empty',
      reason: archivedEvidence > 0
        ? `当前扫描已绑定 ${formatNumber(archivedEvidence)} 条产物、审计或工具调用证据。`
        : '关键动作尚未进入产物和审计链路。',
      actionLabel: '打开审计',
      icon: <CheckCircleOutlined />,
      disabled: archivedEvidence <= 0,
      onAction: onOpenAudit,
    },
  ]
}

function governanceStageColor(state: ReportGovernanceStage['state']) {
  if (state === 'ready') return 'green'
  if (state === 'running') return 'blue'
  if (state === 'blocked') return 'red'
  return 'default'
}

function buildReportGovernanceCards({
  risks,
  artifacts,
  execution,
  taskStatus,
  progress,
  governance,
}: {
  risks: any[]
  artifacts: ScanArtifactView[]
  execution: ExecutionTaskDetail | null
  taskStatus: string
  progress: number
  governance: ReportGovernanceSnapshot | null
}): ReportGovernanceCard[] {
  const fileBoundRisks = risks.filter(risk => riskFilePath(risk)).length
  const highRisks = risks.filter(risk => String(risk?.severity || '').toUpperCase() === 'HIGH').length
  const autoRepairs = governance?.autoRepairs || []
  const agentTasks = governance?.agentTasks || []
  const toolCalls = governance?.agentToolCalls || []
  const auditLogs = governance?.auditLogs || []
  const governanceArtifacts = governance?.artifacts || []
  const repairExecutions = governance?.repairExecutions || []
  const patchArtifacts = Math.max(
    autoRepairs.filter(repair => repair.patchArtifactPath).length,
    governanceArtifacts.filter(artifact => artifact.ownerType === 'AUTO_REPAIR' && artifact.artifactType === 'CHANGE_PATCH').length,
  )
  const agentReportArtifacts = governanceArtifacts.filter(artifact =>
    artifact.ownerType === 'AGENT_TASK' && artifact.artifactType === 'AGENT_REPORT'
  ).length
  const failedRepairs = autoRepairs.filter(item => isFailedStatus(item.status)).length
  const readyRepairs = autoRepairs.filter(item => ['PATCH_READY', 'PR_CREATED', 'PR_MERGED'].includes(String(item.status || '').toUpperCase())).length
  const runningRepairs = autoRepairs.filter(item => isRunningStatus(item.status)).length
  const failedAgentTasks = agentTasks.filter(item => isFailedStatus(item.status)).length
  const runningAgentTasks = agentTasks.filter(item => isRunningStatus(item.status)).length
  const finishedAgentTasks = agentTasks.filter(item => ['SUCCESS', 'COMPLETED', 'DONE'].includes(String(item.status || '').toUpperCase())).length
  const failedExecutions = [execution, ...repairExecutions, ...(governance?.agentExecutions || [])]
    .filter(detail => detail?.task && isFailedStatus(detail.task.status)).length
  const failedToolCalls = toolCalls.filter(call => call.success === false).length

  return [
    {
      key: 'report-risks',
      label: '报告风险',
      value: `${formatNumber(risks.length)} risks`,
      detail: `高风险 ${formatNumber(highRisks)} / 已定位文件 ${formatNumber(fileBoundRisks)} / 待定位 ${formatNumber(Math.max(0, risks.length - fileBoundRisks))}`,
      tone: highRisks > 0 ? 'danger' : risks.length > 0 ? 'warning' : 'ready',
    },
    {
      key: 'auto-repair',
      label: 'AutoRepair',
      value: `${formatNumber(autoRepairs.length)} repairs`,
      detail: readyRepairs > 0
        ? `${formatNumber(readyRepairs)} 个补丁就绪，${formatNumber(patchArtifacts)} 个 patch artifact`
        : failedRepairs > 0
          ? `${formatNumber(failedRepairs)} 个失败，需查看错误摘要`
          : `${formatNumber(runningRepairs)} 个运行中，${formatNumber(patchArtifacts)} 个 patch artifact`,
      tone: failedRepairs > 0 ? 'danger' : readyRepairs > 0 ? 'ready' : autoRepairs.length > 0 ? 'warning' : 'idle',
    },
    {
      key: 'agent-tasks',
      label: 'Agent 任务',
      value: `${formatNumber(agentTasks.length)} tasks`,
      detail: `${formatNumber(finishedAgentTasks)} 完成 / ${formatNumber(runningAgentTasks)} 运行中 / ${formatNumber(failedAgentTasks)} 失败`,
      tone: failedAgentTasks > 0 ? 'danger' : agentTasks.length > 0 ? 'ready' : 'idle',
    },
    {
      key: 'execution-tasks',
      label: '执行任务',
      value: `${formatNumber(progress)}%`,
      detail: `扫描 ${statusLabel(taskStatus)} / 修复执行 ${formatNumber(repairExecutions.length)} 个 / 失败 ${formatNumber(failedExecutions)} 个`,
      tone: failedExecutions > 0 ? 'danger' : progress >= 100 ? 'ready' : isRunningStatus(taskStatus) ? 'warning' : 'idle',
    },
    {
      key: 'artifacts',
      label: '产物证据',
      value: `${formatNumber(artifacts.length + patchArtifacts + agentReportArtifacts)} artifacts`,
      detail: `扫描产物 ${formatNumber(artifacts.length)} / patch ${formatNumber(patchArtifacts)} / Agent report ${formatNumber(agentReportArtifacts)}`,
      tone: artifacts.length > 0 && (risks.length <= 0 || patchArtifacts > 0 || autoRepairs.length <= 0) ? 'ready' : artifacts.length > 0 ? 'warning' : 'idle',
    },
    {
      key: 'audit-tools',
      label: '审计留痕',
      value: `${formatNumber(auditLogs.length)} logs`,
      detail: `工具调用 ${formatNumber(toolCalls.length)} / 失败工具 ${formatNumber(failedToolCalls)}`,
      tone: failedToolCalls > 0 ? 'danger' : auditLogs.length + toolCalls.length > 0 ? 'ready' : 'idle',
    },
  ]
}

function buildReportGovernanceEvents({
  projectId,
  scanTaskId,
  execution,
  artifacts,
  governance,
  onOpenArtifacts,
  onOpenAutoRepair,
  onOpenExecution,
  onOpenUrl,
  onOpenQa,
  onOpenScanReport,
}: {
  projectId: number
  scanTaskId: number
  execution: ExecutionTaskDetail | null
  artifacts: ScanArtifactView[]
  governance: ReportGovernanceSnapshot | null
  onOpenArtifacts: (ownerType?: string, ownerId?: number) => void
  onOpenAutoRepair: (repairId?: number) => void
  onOpenExecution: (taskId?: number | null) => void
  onOpenUrl: (url: string) => void
  onOpenQa: (question?: string | null) => void
  onOpenScanReport: () => void
}): ReportGovernanceEvent[] {
  const events: ReportGovernanceEvent[] = []

  if (execution?.task) {
    const executionDetail = execution.task.errorMessage
      || execution.steps.find(step => step.errorMessage || step.logSummary || step.stepName)?.errorMessage
      || execution.steps.find(step => step.logSummary || step.stepName)?.logSummary
      || `${formatStepLabel(execution.task.currentStep)}，进度 ${formatNumber(execution.task.progress)}%`
    events.push({
      key: `scan-execution-${execution.task.id}`,
      source: 'ExecutionTask',
      title: `扫描执行任务 #${execution.task.id}`,
      detail: executionDetail,
      status: statusLabel(execution.task.status),
      tone: statusTone(execution.task.status),
      timestamp: execution.task.updatedAt || execution.task.finishedAt || execution.task.startedAt || execution.task.createdAt,
      actionLabel: '打开执行详情',
      onOpen: () => onOpenExecution(execution.task.id),
      targetUrl: executionTaskUrl(projectId, execution.task.id),
    })
  }

  if (artifacts.length > 0) {
    events.push({
      key: `scan-artifacts-${scanTaskId}`,
      source: 'Artifact',
      title: `扫描产物已归档 ${formatNumber(artifacts.length)} 个`,
      detail: artifacts.slice(0, 3).map(artifact => ARTIFACT_TITLES[artifact.artifactType] || artifact.artifactType).join('、'),
      status: '产物可验',
      tone: 'ready',
      timestamp: latestTimestamp(artifacts.map(artifact => artifact.createdAt)),
      actionLabel: '打开产物库',
      onOpen: () => onOpenArtifacts('SCAN_TASK', scanTaskId),
      targetUrl: artifactsUrl(projectId, 'SCAN_TASK', scanTaskId),
    })
  }

  const timelineEvents = (governance?.timelineEvents || [])
    .filter(event => isCurrentScanGovernanceEvent(event, projectId, scanTaskId))
  const backendCandidateReceipts = timelineEvents
    .filter(event => event.eventType === 'AUTO_REPAIR_CANDIDATE_RECEIPT')
  const backendPrGateEvents = timelineEvents
    .filter(event => isAutoRepairPrGateAction(event.eventType))
  for (const event of backendCandidateReceipts) {
    const repairId = event.actionTarget?.type === 'AUTO_REPAIR'
      ? event.actionTarget.id || event.resource?.id || undefined
      : event.resource?.type === 'AUTO_REPAIR'
        ? event.resource.id || undefined
        : undefined
    const targetUrl = repairId ? autoRepairUrl(projectId, scanTaskId, repairId) : scanAuditUrl(projectId, scanTaskId)
    events.push({
      key: `candidate-receipt-${event.id}`,
      source: 'CandidateReceipt',
      title: event.title || '候选来源凭证',
      detail: event.detail || '候选来源凭证已进入审计链路',
      status: statusLabel(event.status || 'SUCCESS'),
      tone: statusTone(event.status || 'SUCCESS'),
      timestamp: event.occurredAt,
      actionLabel: repairId ? '打开修复详情' : '打开审计日志',
      onOpen: () => onOpenUrl(targetUrl),
      targetUrl,
      actions: candidateReceiptTimelineActions({
        projectId,
        scanTaskId,
        repairId,
        title: event.title || '候选来源凭证',
        detail: event.detail || '候选来源凭证已进入审计链路',
        repairEvidenceGate: event.repairEvidenceGate,
        onOpenAutoRepair,
        onOpenQa,
        onOpenScanReport,
      }),
      repairEvidenceGate: event.repairEvidenceGate,
      repairEvidenceGateReason: event.repairEvidenceGateReason,
      repairEvidenceGateSource: event.repairEvidenceGateSource,
    })
  }

  for (const event of backendPrGateEvents) {
    const repairId = event.actionTarget?.type === 'AUTO_REPAIR'
      ? event.actionTarget.id || event.resource?.id || undefined
      : event.resource?.type === 'AUTO_REPAIR'
        ? event.resource.id || undefined
        : undefined
    const targetUrl = repairId ? autoRepairUrl(projectId, scanTaskId, repairId) : scanAuditUrl(projectId, scanTaskId)
    events.push({
      key: `pr-gate-${event.id}`,
      source: 'PrGate',
      title: event.title || 'PR Gate 审计',
      detail: event.detail || 'AutoRepair PR gate 已进入审计链路',
      status: statusLabel(event.status || 'SUCCESS'),
      tone: statusTone(event.status || 'SUCCESS'),
      timestamp: event.occurredAt,
      actionLabel: repairId ? '打开修复详情' : '打开审计日志',
      onOpen: () => onOpenUrl(targetUrl),
      targetUrl,
    })
  }

  const derivedArtifacts = (governance?.artifacts || [])
    .filter(artifact => ['AUTO_REPAIR', 'AGENT_TASK'].includes(artifact.ownerType))
  const artifactsByOwner = new Map<string, ArtifactRecord[]>()
  for (const artifact of derivedArtifacts) {
    const key = `${artifact.ownerType}:${artifact.ownerId}`
    artifactsByOwner.set(key, [...(artifactsByOwner.get(key) || []), artifact])
  }
  for (const ownerArtifacts of artifactsByOwner.values()) {
    const first = ownerArtifacts[0]
    const ownerLabel = first.ownerType === 'AUTO_REPAIR' ? 'AutoRepair' : 'Agent'
    const targetUrl = artifactsUrl(projectId, first.ownerType, first.ownerId, first.id)
    events.push({
      key: `derived-artifacts-${first.ownerType}-${first.ownerId}`,
      source: 'Artifact',
      title: `${ownerLabel} 产物已归档 ${formatNumber(ownerArtifacts.length)} 个`,
      detail: ownerArtifacts.map(artifact => ARTIFACT_TITLES[artifact.artifactType] || artifact.artifactType).join('、'),
      status: '产物可验',
      tone: 'ready',
      timestamp: latestTimestamp(ownerArtifacts.map(artifact => artifact.createdAt)),
      actionLabel: first.ownerType === 'AUTO_REPAIR' ? '打开补丁产物' : '打开 Agent 报告',
      onOpen: () => onOpenUrl(targetUrl),
      targetUrl,
    })
  }

  for (const repair of governance?.autoRepairs || []) {
    events.push({
      key: `repair-${repair.id}`,
      source: 'AutoRepair',
      title: `修复候选 #${repair.id} ${statusLabel(repair.status)}`,
      detail: repair.errorMessage || repair.targetDesc || repair.filePath || repair.patchArtifactPath || '修复候选已绑定当前扫描',
      status: statusLabel(repair.status),
      tone: statusTone(repair.status),
      timestamp: repair.updatedAt || repair.createdAt,
      actionLabel: '打开修复详情',
      onOpen: () => onOpenAutoRepair(repair.id),
      targetUrl: autoRepairUrl(repair.projectId, repair.scanTaskId || scanTaskId, repair.id),
    })
  }

  for (const detail of governance?.repairExecutions || []) {
    if (!detail?.task) continue
    const repairStepSummary = detail.steps.find(step => step.stepKey || step.logSummary || step.stepName)
    const repairStepKey = repairStepSummary?.stepKey || detail.task.currentStep
    const executionDetail = detail.task.errorMessage
      || [
        `${formatStepLabel(detail.task.currentStep)} (${repairStepKey})，进度 ${formatNumber(detail.task.progress)}%`,
        repairStepSummary?.logSummary || repairStepSummary?.stepName,
      ].filter(Boolean).join(' / ')
    events.push({
      key: `repair-execution-${detail.task.id}`,
      source: 'ExecutionTask',
      title: `修复执行任务 #${detail.task.id}`,
      detail: executionDetail,
      status: statusLabel(detail.task.status),
      tone: statusTone(detail.task.status),
      timestamp: detail.task.updatedAt || detail.task.finishedAt || detail.task.startedAt || detail.task.createdAt,
      actionLabel: '打开执行详情',
      onOpen: () => onOpenExecution(detail.task.id),
      targetUrl: executionTaskUrl(projectId, detail.task.id),
    })
  }

  for (const detail of governance?.agentExecutions || []) {
    if (!detail?.task) continue
    const executionStepSummary = detail.steps.find(step => step.logSummary || step.stepName)?.logSummary
      || detail.steps.find(step => step.logSummary || step.stepName)?.stepName
    const executionDetail = detail.task.errorMessage
      || [
        `${formatStepLabel(detail.task.currentStep)}，进度 ${formatNumber(detail.task.progress)}%`,
        executionStepSummary,
      ].filter(Boolean).join(' / ')
    events.push({
      key: `agent-execution-${detail.task.id}`,
      source: 'ExecutionTask',
      title: `Agent 执行任务 #${detail.task.id}`,
      detail: executionDetail,
      status: statusLabel(detail.task.status),
      tone: statusTone(detail.task.status),
      timestamp: detail.task.updatedAt || detail.task.finishedAt || detail.task.startedAt || detail.task.createdAt,
      actionLabel: '打开执行详情',
      onOpen: () => onOpenExecution(detail.task.id),
      targetUrl: executionTaskUrl(projectId, detail.task.id),
    })
  }

  for (const task of governance?.agentTasks || []) {
    const title = task.title || `Agent 任务 #${task.id}`
    const targetUrl = agentTaskUrl(projectId, scanTaskId, task.id)
    events.push({
      key: `agent-task-${task.id}`,
      source: 'AgentTask',
      title,
      detail: firstDistinctDetail(title, [task.errorMessage, task.summary, task.description], 'Agent 任务已绑定当前扫描'),
      status: statusLabel(task.status),
      tone: statusTone(task.status),
      timestamp: task.updatedAt || task.finishedAt || task.startedAt || task.createdAt,
      actionLabel: '打开 Agent 任务',
      onOpen: () => onOpenUrl(targetUrl),
      targetUrl,
    })
  }

  for (const call of governance?.agentToolCalls || []) {
    const title = `${call.toolName} 工具调用`
    const targetUrl = scanAuditUrl(projectId, scanTaskId, {
      conversationId: call.conversationId || undefined,
    })
    events.push({
      key: `tool-call-${call.id}`,
      source: 'AgentToolCall',
      title,
      detail: firstDistinctDetail(title, [call.errorMessage, call.resultSummary], '工具调用已记录权限和结果摘要'),
      status: call.success === false ? '失败' : '成功',
      tone: call.success === false ? 'danger' : 'ready',
      timestamp: call.createdAt,
      actionLabel: '打开审计日志',
      onOpen: () => onOpenUrl(targetUrl),
      targetUrl,
    })
  }

  for (const log of governance?.auditLogs || []) {
    const candidateReceipt = log.action === 'AUTO_REPAIR_CANDIDATE_CREATED'
    const prGate = isAutoRepairPrGateLog(log)
    const candidateProvenance = candidateReceipt ? candidateProvenanceFromAudit(log) : null
    if (candidateReceipt && backendCandidateReceipts.length > 0) {
      continue
    }
    if (prGate && backendPrGateEvents.length > 0) {
      continue
    }
    const title = candidateReceipt ? '候选来源凭证' : prGate ? prGateTitle(log.action) : `${log.action} 审计留痕`
    const repairTargetUrl = (candidateReceipt || prGate) && log.resourceId
      ? autoRepairUrl(projectIdFromLog(log) || projectId, scanTaskId, Number(log.resourceId))
      : null
    const auditTargetUrl = scanAuditUrl(projectId, scanTaskId, {
      resourceType: log.resourceType || undefined,
      resourceId: log.resourceId || undefined,
      action: log.action || undefined,
      status: log.status || undefined,
    })
    const targetUrl = repairTargetUrl || auditTargetUrl
    events.push({
      key: `audit-log-${log.id}`,
      source: candidateReceipt ? 'CandidateReceipt' : prGate ? 'PrGate' : 'AuditLog',
      title,
      detail: candidateReceipt
        ? candidateReceiptDetail(log)
        : prGate
          ? firstDistinctDetail(title, [log.outputSummary, log.requestId], 'AutoRepair PR gate 已进入审计链路')
        : firstDistinctDetail(title, [log.outputSummary, log.requestId], '关键动作已进入审计链路'),
      status: statusLabel(log.status),
      tone: statusTone(log.status),
      timestamp: log.createdAt,
      actionLabel: (candidateReceipt || prGate) && log.resourceId ? '打开修复详情' : '打开审计日志',
      onOpen: () => onOpenUrl(targetUrl),
      targetUrl,
      actions: candidateReceipt ? candidateReceiptTimelineActions({
        projectId: projectIdFromLog(log) || projectId,
        scanTaskId,
        repairId: log.resourceId || undefined,
        title,
        detail: candidateReceiptDetail(log),
        repairEvidenceGate: candidateProvenance ? stringField(candidateProvenance.repairEvidenceGate, '') : null,
        onOpenAutoRepair,
        onOpenQa,
        onOpenScanReport,
      }) : undefined,
      repairEvidenceGate: candidateProvenance ? stringField(candidateProvenance.repairEvidenceGate, '') : null,
      repairEvidenceGateReason: candidateProvenance ? stringField(candidateProvenance.repairEvidenceGateReason, '') : null,
      repairEvidenceGateSource: candidateProvenance ? stringField(candidateProvenance.repairEvidenceGateSource, '') : null,
    })
  }

  return events
    .sort((a, b) => governanceEventPriority(a) - governanceEventPriority(b) || timestampValue(b.timestamp) - timestampValue(a.timestamp))
    .slice(0, 12)
}

function projectIdFromLog(log: AuditLog) {
  return Number(log.projectId || 0)
}

function isCurrentScanGovernanceEvent(event: ScanGovernanceEvent, projectId: number, scanTaskId: number) {
  const bindings = [
    governanceRefScanBinding(event.resource, projectId, scanTaskId),
    governanceRefScanBinding(event.source, projectId, scanTaskId),
  ]
  return bindings.some(binding => binding.matchesCurrent)
    && bindings.every(binding => !binding.conflicts)
}

function governanceRefScanBinding(ref: ScanGovernanceEvent['resource'], projectId: number, scanTaskId: number) {
  if (!ref) return { matchesCurrent: false, conflicts: false }
  const refProjectId = Number(ref.projectId)
  const refScanTaskId = Number(ref.scanTaskId)
  const refId = Number(ref.id)
  const hasProjectId = Number.isFinite(refProjectId) && refProjectId > 0
  const hasScanTaskId = Number.isFinite(refScanTaskId) && refScanTaskId > 0
  const hasScanResourceId = ref.type === 'SCAN_TASK' && Number.isFinite(refId) && refId > 0
  const conflicts = (hasProjectId && refProjectId !== projectId)
    || (hasScanTaskId && refScanTaskId !== scanTaskId)
    || (hasScanResourceId && refId !== scanTaskId)
  const matchesCurrent = (hasScanTaskId && refScanTaskId === scanTaskId)
    || (hasScanResourceId && refId === scanTaskId)
  return { matchesCurrent, conflicts }
}

function governanceEventPriority(event: ReportGovernanceEvent) {
  if (event.title.startsWith('Agent 执行任务')) return 0
  if (event.title.startsWith('修复执行任务')) return 1
  if (event.source === 'CandidateReceipt' || event.source === 'PrGate') return 2
  if (event.source === 'AutoRepair') return 3
  if (event.source === 'AgentTask') return 4
  if (event.title.startsWith('扫描执行任务')) return 5
  if (event.source === 'Artifact') return 6
  if (event.source === 'AuditLog') return 7
  return 8
}

function isAutoRepairPrGateLog(log: AuditLog) {
  return isAutoRepairPrGateAction(log.action)
}

function isAutoRepairPrGateAction(action?: string | null) {
  return [
    'AUTO_REPAIR_PR_QUEUED',
    'AUTO_REPAIR_PR_CREATED',
    'AUTO_REPAIR_PR_REJECTED',
    'AUTO_REPAIR_PR_FAILED',
  ].includes(String(action || '').toUpperCase())
}

function latestAuditLog(logs: AuditLog[]) {
  return [...logs].sort((a, b) => timestampValue(b.createdAt) - timestampValue(a.createdAt))[0] || null
}

function prGateTitle(action?: string | null) {
  switch (String(action || '').toUpperCase()) {
    case 'AUTO_REPAIR_PR_QUEUED':
      return 'PR 创建已排队'
    case 'AUTO_REPAIR_PR_CREATED':
      return 'PR 已创建'
    case 'AUTO_REPAIR_PR_REJECTED':
      return 'PR Gate 已拒绝'
    case 'AUTO_REPAIR_PR_FAILED':
      return 'PR 创建失败'
    default:
      return 'PR Gate 审计'
  }
}

function candidateReceiptDetail(log: AuditLog) {
  const provenance = candidateProvenanceFromAudit(log)
  if (!provenance) {
    return firstDistinctDetail('候选来源凭证', [log.outputSummary, log.requestId], '候选来源凭证已进入审计链路')
  }
  const parts = [
    `来源 ${stringField(provenance.sourceType, 'MANUAL_CANDIDATE')}`,
    provenance.scanTaskId ? `Scan #${provenance.scanTaskId}` : null,
    provenance.filePath ? `文件 ${provenance.filePath}` : null,
    provenance.sourceLabel || provenance.citationId || provenance.chunkId
      ? `引用 ${stringField(provenance.sourceLabel || provenance.citationId || provenance.chunkId, '-')}`
      : null,
    provenance.startLine || provenance.endLine
      ? `行 ${stringField(provenance.startLine, '?')}-${stringField(provenance.endLine, '?')}`
      : provenance.lineNumber
        ? `Line ${provenance.lineNumber}`
        : null,
    provenance.groundingStatus ? `Grounding ${provenance.groundingStatus}` : null,
    provenance.citationEnforcementStatus ? `Citation ${provenance.citationEnforcementStatus}` : null,
    provenance.riskCategory ? `风险 ${provenance.riskCategory}` : null,
    provenance.riskSeverity ? `级别 ${provenance.riskSeverity}` : null,
    provenance.riskKey ? `riskKey ${provenance.riskKey}` : null,
    provenance.repairEvidenceGate ? `门禁 ${stringField(provenance.repairEvidenceGate, '-')}` : null,
    provenance.repairEvidenceGateSource ? `门禁来源 ${stringField(provenance.repairEvidenceGateSource, '-')}` : null,
    provenance.repairEvidenceGateReason ? `门禁原因 ${stringField(provenance.repairEvidenceGateReason, '-')}` : null,
  ]
  return parts.filter(Boolean).join(' / ')
}

function candidateReceiptTimelineActions({
  projectId,
  scanTaskId,
  repairId,
  title,
  detail,
  repairEvidenceGate,
  onOpenAutoRepair,
  onOpenQa,
  onOpenScanReport,
}: {
  projectId: number
  scanTaskId: number
  repairId?: number | null
  title: string
  detail: string
  repairEvidenceGate?: string | null
  onOpenAutoRepair: (repairId?: number) => void
  onOpenQa: (question?: string | null) => void
  onOpenScanReport: () => void
}): ReportGovernanceEventAction[] {
  const qaQuestion = candidateReceiptTimelineQaQuestion({
    scanTaskId,
    repairId,
    title,
    detail,
    repairEvidenceGate,
  })
  const actions: Array<ReportGovernanceEventAction | null> = [
    repairId ? {
      key: 'open-repair-detail',
      label: '打开修复详情',
      targetUrl: autoRepairUrl(projectId, scanTaskId, repairId),
      onOpen: () => onOpenAutoRepair(Number(repairId)),
    } : null,
    {
      key: 'open-source-report',
      label: '打开来源报告',
      targetUrl: `/scan-tasks/${scanTaskId}`,
      onOpen: onOpenScanReport,
    },
    {
      key: 'qa-review-source',
      label: 'QA 复核来源',
      targetUrl: projectQaUrl(projectId, qaQuestion, scanTaskId),
      onOpen: () => onOpenQa(qaQuestion),
    },
  ]
  return actions.filter((action): action is ReportGovernanceEventAction => Boolean(action))
}

function candidateReceiptTimelineQaQuestion({
  scanTaskId,
  repairId,
  title,
  detail,
  repairEvidenceGate,
}: {
  scanTaskId: number
  repairId?: number | null
  title: string
  detail: string
  repairEvidenceGate?: string | null
}) {
  return [
    `请复核 Scan #${scanTaskId} 治理时间线中的候选来源凭证。`,
    repairId ? `AutoRepair：#${repairId}` : 'AutoRepair：未绑定',
    `事件：${title}`,
    `候选门禁：${repairEvidenceGate || 'REVIEW'}`,
    `凭证明细：${detail}`,
    '请确认该候选是否仍能由同一扫描报告、QA 引用和审计留痕支持。',
  ].join('\n')
}

function candidateProvenanceFromAudit(log: AuditLog): Record<string, any> | null {
  if (!log.inputJson) return null
  try {
    const parsed = JSON.parse(log.inputJson)
    return parsed?.provenance && typeof parsed.provenance === 'object' ? parsed.provenance : null
  } catch {
    return null
  }
}

function stringField(value: unknown, fallback: string) {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

const REPORT_CITATION_QUALITY_LABELS: Record<string, string> = {
  scan_scope: '扫描范围',
  test_signal: '测试信号',
  module_map: '模块图',
  api_data_surface: 'API/数据面',
  fingerprint: '扫描指纹',
  risk_signal: '风险信号',
  summary_risk_posture: '风险摘要',
  high_risk_count: '高风险计数',
  medium_risk_count: '中风险计数',
  technical_debt_count: '技术债计数',
  suggestion_count: '建议计数',
  next_actions_risk_priority: '风险优先动作',
}

const REPORT_CITATION_SOURCE_SECTION_LABELS: Record<string, string> = {
  overview: '扫描范围',
  modules: '模块图',
  'apiRoutes/dbEntities': 'API/数据面',
  scanFingerprint: '扫描指纹',
  'codeQuality.risks': '风险信号',
}

const REPORT_CITATION_SOURCE_SECTION_ORDER = [
  'overview',
  'modules',
  'apiRoutes/dbEntities',
  'scanFingerprint',
  'codeQuality.risks',
]

function compareReportCitationSourceSections(left: string, right: string): number {
  const leftIndex = REPORT_CITATION_SOURCE_SECTION_ORDER.indexOf(left)
  const rightIndex = REPORT_CITATION_SOURCE_SECTION_ORDER.indexOf(right)
  const leftRank = leftIndex >= 0 ? leftIndex : REPORT_CITATION_SOURCE_SECTION_ORDER.length
  const rightRank = rightIndex >= 0 ? rightIndex : REPORT_CITATION_SOURCE_SECTION_ORDER.length
  if (leftRank !== rightRank) {
    return leftRank - rightRank
  }
  return left.localeCompare(right)
}

function buildReportCitationQualitySummary(reportQuality: any): ReportCitationQualitySummary {
  const raw = reportQuality?.reportCitationQuality
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      status: 'GAP',
      tone: 'danger',
      title: '报告引用质量未输出',
      summary: '当前报告缺少 reportQuality.reportCitationQuality，不能证明报告字段已经和扫描产物建立可追溯绑定。',
      metrics: [
        { label: 'Citation quality', value: 'Missing', tone: 'danger' },
        { label: 'Source diversity', value: '0/6', tone: 'danger' },
        { label: 'Narrative binding', value: 'Missing', tone: 'danger' },
      ],
      sourceSections: [],
      verdict: [
        { label: '合同', value: 'Missing', tone: 'danger' },
        { label: '结构绑定', value: '0/6', tone: 'danger' },
        { label: '叙事绑定', value: 'Missing', tone: 'danger' },
        { label: '边界', value: 'Blocked', tone: 'danger' },
      ],
      checks: [],
      narrativeBindings: [],
      nextAction: '重新生成报告质量 marker，或先进入 QA 引用复核确认关键结论。',
      boundary: '只证明报告字段和扫描产物绑定，不证明 LLM 事实正确。',
    }
  }

  const requiredCheckCount = Math.max(0, toFiniteNumber(raw.requiredCheckCount))
  const boundCheckCount = Math.max(0, toFiniteNumber(raw.boundCheckCount))
  const requiredNarrativeBindingCount = Math.max(0, toFiniteNumber(raw.requiredNarrativeBindingCount))
  const narrativeBindingCount = Math.max(0, toFiniteNumber(raw.narrativeBindingCount))
  const sectionBindings = Array.isArray(raw.sectionBindings) ? raw.sectionBindings : []
  const narrativeBindingsRaw = Array.isArray(raw.narrativeBindings) ? raw.narrativeBindings : []
  const sourceSections = Array.from(
    new Set<string>(sectionBindings.map((binding: any) => String(binding?.sourceSection || '').trim()).filter(Boolean)),
  ).sort(compareReportCitationSourceSections)
  const sourceCoverage = sourceSections.map(section => ({
    section,
    label: REPORT_CITATION_SOURCE_SECTION_LABELS[section] || '未命名来源',
  }))
  const providerQualityClaim = raw.providerQualityClaim === false
  const llmFactClaim = raw.llmFactClaim === false
  const noRawPromptOrAnswer = raw.noRawPromptOrAnswer !== false
  const contractOk = String(raw.status || '').toUpperCase() === 'OK'
  const sectionsReady = requiredCheckCount > 0 && boundCheckCount >= requiredCheckCount
  const narrativeReady = String(raw.narrativeBindingStatus || '').toUpperCase() === 'ALL_BOUND'
    && requiredNarrativeBindingCount > 0
    && narrativeBindingCount >= requiredNarrativeBindingCount
  const claimBoundaryReady = providerQualityClaim && llmFactClaim && noRawPromptOrAnswer
  const status: ReportCitationQualitySummary['status'] = contractOk && sectionsReady && narrativeReady && claimBoundaryReady
    ? 'READY'
    : claimBoundaryReady && (sectionsReady || narrativeReady)
      ? 'REVIEW'
      : 'GAP'
  const tone: ReportSignalTone = status === 'READY' ? 'ready' : status === 'REVIEW' ? 'warning' : 'danger'
  const checks: ReportCitationQualityCheck[] = sectionBindings.map((binding: any, index: number) => {
    const key = String(binding?.key || `section-${index}`)
    const bindingStatus = String(binding?.status || 'GAP').toUpperCase()
    return {
      key,
      label: REPORT_CITATION_QUALITY_LABELS[key] || key,
      sourceSection: stringField(binding?.sourceSection, 'Unknown section'),
      status: bindingStatus,
      tone: reportCheckTone(bindingStatus),
    }
  })
  const narrativeBindings: ReportCitationQualityCheck[] = narrativeBindingsRaw.map((binding: any, index: number) => {
    const key = String(binding?.key || `narrative-${index}`)
    const bindingStatus = String(binding?.status || 'GAP').toUpperCase()
    const sourceMetric = stringField(binding?.sourceMetric, '')
    return {
      key,
      label: REPORT_CITATION_QUALITY_LABELS[key] || key,
      sourceSection: sourceMetric ? `${stringField(binding?.sourceSection, 'Unknown section')} / ${sourceMetric}` : stringField(binding?.sourceSection, 'Unknown section'),
      status: bindingStatus,
      tone: bindingStatus === 'BOUND' ? 'ready' : reportCheckTone(bindingStatus),
    }
  })
  const title = status === 'READY'
    ? '报告引用链已绑定扫描产物'
    : status === 'REVIEW'
      ? '报告引用质量需要复核'
      : '报告引用质量存在缺口'
  const summary = status === 'READY'
    ? '结构证据、来源分布和叙事绑定均达到当前报告质量规则，可进入 QA 引用复核和报告复盘。'
    : status === 'REVIEW'
      ? '报告已有部分引用质量信号，但结构证据、叙事绑定或来源分布仍需人工确认。'
      : '报告引用质量合同未达标，不能直接把报告结论推进到修复候选。'
  const nextAction = status === 'READY'
    ? '进入 QA 引用复核，确认关键结论的代码证据后再推进修复候选。'
    : status === 'REVIEW'
      ? '补齐缺失的 section bindings 或 narrative bindings，再更新报告质量 marker。'
      : '先重新生成报告质量 marker，并检查是否缺少扫描产物、指纹或风险绑定。'
  const verdict = [
    {
      label: '合同',
      value: contractOk ? 'OK' : stringField(raw.status, 'Missing'),
      tone: contractOk ? 'ready' : 'danger',
    },
    {
      label: '结构绑定',
      value: requiredCheckCount > 0 ? `${boundCheckCount}/${requiredCheckCount}` : 'Missing',
      tone: sectionsReady ? 'ready' : boundCheckCount > 0 ? 'warning' : 'danger',
    },
    {
      label: '叙事绑定',
      value: requiredNarrativeBindingCount > 0 ? `${narrativeBindingCount}/${requiredNarrativeBindingCount}` : 'Missing',
      tone: narrativeReady ? 'ready' : narrativeBindingCount > 0 ? 'warning' : 'danger',
    },
    {
      label: '边界',
      value: claimBoundaryReady ? 'No overclaim' : 'Review',
      tone: claimBoundaryReady ? 'ready' : 'danger',
    },
  ] satisfies ReportCitationQualitySummary['verdict']

  return {
    status,
    tone,
    title,
    summary,
    metrics: [
      {
        label: 'Citation quality',
        value: requiredCheckCount > 0 ? `${boundCheckCount}/${requiredCheckCount}` : 'Missing',
        tone: sectionsReady ? 'ready' : boundCheckCount > 0 ? 'warning' : 'danger',
      },
      {
        label: 'Source diversity',
        value: requiredCheckCount > 0 ? `${sourceCoverage.length}/${requiredCheckCount}` : 'Missing',
        tone: sourceCoverage.length >= Math.min(requiredCheckCount, 4) ? 'ready' : sourceCoverage.length > 0 ? 'warning' : 'danger',
      },
      {
        label: 'Narrative binding',
        value: requiredNarrativeBindingCount > 0 ? `${narrativeBindingCount}/${requiredNarrativeBindingCount}` : 'Missing',
        tone: narrativeReady ? 'ready' : narrativeBindingCount > 0 ? 'warning' : 'danger',
      },
    ],
    sourceSections: sourceCoverage,
    verdict,
    checks,
    narrativeBindings,
    nextAction,
    boundary: claimBoundaryReady
      ? '只证明报告字段和扫描产物绑定，不证明 LLM 事实正确。'
      : '质量声明边界缺失或异常：不得声称 provider 质量、LLM 事实正确或代码无风险。',
  }
}

function buildReportEvidenceProfile({
  overview,
  modules,
  risks,
  apiRoutes,
  dbEntities,
  artifacts,
  fingerprint,
  reportQuality,
}: {
  overview: any
  modules: any
  risks: any[]
  apiRoutes: any[]
  dbEntities: any[]
  artifacts: ScanArtifactView[]
  fingerprint: any
  reportQuality: any
}): ReportEvidenceProfile {
  const artifactTypes = new Set(artifacts.map(artifact => artifact.artifactType))
  const presentCoreArtifacts = CORE_REPORT_ARTIFACTS.filter(type => artifactTypes.has(type))
  const missingCoreArtifacts = CORE_REPORT_ARTIFACTS.filter(type => !artifactTypes.has(type))
  const totalFiles = toFiniteNumber(overview.totalFiles)
  const totalLines = toFiniteNumber(overview.totalLines)
  const testFiles = toFiniteNumber(overview.testFiles)
  const moduleCount = ['controllers', 'services', 'repositories', 'entities']
    .reduce((sum, key) => sum + toFiniteNumber(modules[key]), 0)
  const highRiskCount = risks.filter(risk => String(risk?.severity || '').toUpperCase() === 'HIGH').length
  const mediumRiskCount = risks.filter(risk => String(risk?.severity || '').toUpperCase() === 'MEDIUM').length
  const hasFingerprint = Boolean(fingerprint?.repoContentHash)

  const localItems: ReportEvidenceItem[] = [
    {
      key: 'core-artifacts',
      label: '核心产物',
      value: `${presentCoreArtifacts.length}/${CORE_REPORT_ARTIFACTS.length}`,
      detail: missingCoreArtifacts.length > 0
        ? `待补齐 ${missingCoreArtifacts.map(type => ARTIFACT_TITLES[type] || type).join('、')}`
        : '架构、依赖、指标与总览产物均已归档',
      tone: missingCoreArtifacts.length > 0 ? 'warning' : 'ready',
    },
    {
      key: 'scan-scope',
      label: '扫描范围',
      value: `${formatNumber(totalFiles)} files`,
      detail: `${formatNumber(totalLines)} 行代码 / ${formatNumber(testFiles)} 个测试文件`,
      tone: totalFiles <= 0 ? 'idle' : testFiles > 0 ? 'ready' : 'warning',
    },
    {
      key: 'module-map',
      label: '结构识别',
      value: `${formatNumber(moduleCount)} modules`,
      detail: `Controller ${formatNumber(modules.controllers)} / Service ${formatNumber(modules.services)} / Repository ${formatNumber(modules.repositories)} / Entity ${formatNumber(modules.entities)}`,
      tone: moduleCount > 0 ? 'ready' : 'warning',
    },
    {
      key: 'risk-signal',
      label: '风险证据',
      value: `${formatNumber(risks.length)} risks`,
      detail: `高风险 ${formatNumber(highRiskCount)} / 中风险 ${formatNumber(mediumRiskCount)}`,
      tone: highRiskCount > 0 ? 'danger' : risks.length > 0 ? 'warning' : 'ready',
    },
    {
      key: 'surface-map',
      label: '接口/数据面',
      value: `${formatNumber(apiRoutes.length)} / ${formatNumber(dbEntities.length)}`,
      detail: 'API 路由 / 数据库实体',
      tone: apiRoutes.length + dbEntities.length > 0 ? 'ready' : 'idle',
    },
    {
      key: 'fingerprint',
      label: '扫描指纹',
      value: hasFingerprint ? shortHash(fingerprint.repoContentHash) : 'Missing',
      detail: hasFingerprint ? '可用于后续报告对比和漂移检测' : '缺少内容哈希，难以判断报告漂移',
      tone: hasFingerprint ? 'ready' : 'warning',
    },
  ]
  const serverItems = toReportEvidenceItems(reportQuality?.evidenceChecks)
  const items = serverItems.length > 0 ? serverItems : localItems

  const dangerItems = items.filter(item => item.tone === 'danger').length
  const warningItems = items.filter(item => item.tone === 'warning').length
  const tone: ReportSignalTone = dangerItems > 0 ? 'danger' : warningItems > 0 ? 'warning' : 'ready'
  const readiness = String(reportQuality?.readiness || '').toUpperCase()
  const finalTone = readiness ? reportReadinessTone(readiness) : tone
  const label = readiness ? reportReadinessLabel(readiness) : tone === 'ready' ? '证据闭环' : tone === 'warning' ? '存在缺口' : '优先排险'
  const fallbackSummary = finalTone === 'ready'
    ? '报告证据链完整，可进入问答、图谱复盘与自动化治理'
    : finalTone === 'warning'
      ? '报告已生成，但仍有覆盖或指纹缺口需要复核'
      : '报告存在高风险证据，应优先进入修复候选和执行日志复盘'
  const summary = typeof reportQuality?.summary === 'string' && reportQuality.summary
    ? reportQuality.summary
    : fallbackSummary

  return {
    label,
    tone: finalTone,
    summary,
    items,
    missingCoreArtifacts,
  }
}

function toReportEvidenceItems(value: unknown): ReportEvidenceItem[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      key: String(item.key || `server-check-${index}`),
      label: String(item.label || item.key || '证据项'),
      value: String(item.value || '-'),
      detail: String(item.detail || ''),
      tone: reportCheckTone(item.status),
    }))
}

function buildReportQualitySignal({
  taskStatus,
  progress,
  overview,
  modules,
  risks,
  debts,
  suggestions,
  apiRoutes,
  dbEntities,
  artifacts,
  fingerprint,
  reportQuality,
}: {
  taskStatus: string
  progress: number
  overview: any
  modules: any
  risks: any[]
  debts: any[]
  suggestions: string[]
  apiRoutes: any[]
  dbEntities: any[]
  artifacts: ScanArtifactView[]
  fingerprint: any
  reportQuality: any
}): ReportQualitySignal {
  const artifactTypes = new Set(artifacts.map(artifact => artifact.artifactType))
  const presentCoreArtifacts = CORE_REPORT_ARTIFACTS.filter(type => artifactTypes.has(type))
  const missingCoreArtifacts = CORE_REPORT_ARTIFACTS.filter(type => !artifactTypes.has(type))
  const artifactScore = Math.round((presentCoreArtifacts.length / CORE_REPORT_ARTIFACTS.length) * 100)
  const totalFiles = toFiniteNumber(overview.totalFiles)
  const testFiles = toFiniteNumber(overview.testFiles)
  const moduleCount = ['controllers', 'services', 'repositories', 'entities']
    .reduce((sum, key) => sum + toFiniteNumber(modules[key]), 0)
  const highRiskCount = risks.filter(risk => String(risk?.severity || '').toUpperCase() === 'HIGH').length
  const mediumRiskCount = risks.filter(risk => String(risk?.severity || '').toUpperCase() === 'MEDIUM').length
  const hasFingerprint = Boolean(fingerprint?.repoContentHash)

  if (taskStatus === 'FAILED') {
    return {
      label: '不可用',
      tone: 'danger',
      confidence: 8,
      summary: '扫描失败，报告不可采信',
      nextActions: ['先查看执行详情中的失败步骤和日志，再重新扫描。'],
      metrics: [
        { label: '执行状态', value: '失败', tone: 'danger' },
        { label: '核心产物', value: `${presentCoreArtifacts.length}/${CORE_REPORT_ARTIFACTS.length}`, tone: 'warning' },
        { label: '文件规模', value: formatNumber(totalFiles), tone: totalFiles > 0 ? 'ready' : 'idle' },
        { label: '后续动作', value: '排障', tone: 'danger' },
      ],
    }
  }

  if (taskStatus === 'RUNNING' || taskStatus === 'PENDING') {
    return {
      label: '生成中',
      tone: 'idle',
      confidence: Math.max(10, Math.min(progress, 72)),
      summary: '扫描仍在执行，报告尚未定稿',
      nextActions: ['等待扫描完成后再依据风险、API、数据库和产物完整度做判断。'],
      metrics: [
        { label: '执行进度', value: `${progress}%`, tone: 'idle' },
        { label: '核心产物', value: `${presentCoreArtifacts.length}/${CORE_REPORT_ARTIFACTS.length}`, tone: presentCoreArtifacts.length > 0 ? 'warning' : 'idle' },
        { label: '文件规模', value: formatNumber(totalFiles), tone: totalFiles > 0 ? 'ready' : 'idle' },
        { label: '当前结论', value: '等待', tone: 'idle' },
      ],
    }
  }

  let confidence = 54
  confidence += Math.round(artifactScore * 0.18)
  confidence += totalFiles > 0 ? 8 : -14
  confidence += moduleCount > 0 ? 7 : -8
  confidence += apiRoutes.length > 0 ? 4 : 0
  confidence += dbEntities.length > 0 ? 3 : 0
  confidence += testFiles > 0 ? 5 : -6
  confidence += hasFingerprint ? 6 : -5
  confidence -= highRiskCount * 12
  confidence -= mediumRiskCount * 4
  confidence -= missingCoreArtifacts.length * 6
  confidence = Math.max(5, Math.min(96, confidence))
  const serverConfidence = toFiniteNumber(reportQuality?.confidence)
  if (serverConfidence > 0) {
    confidence = Math.round((confidence + serverConfidence) / 2)
  }
  const serverReadiness = String(reportQuality?.readiness || '').toUpperCase()

  const fallbackTone: ReportSignalTone = highRiskCount > 0 || confidence < 48
    ? 'danger'
    : confidence < 72 || missingCoreArtifacts.length > 0
      ? 'warning'
      : 'ready'
  const tone: ReportSignalTone = serverReadiness ? reportReadinessTone(serverReadiness) : fallbackTone
  const fallbackLabel = tone === 'ready'
    ? '可采信'
    : tone === 'warning'
      ? '需复核'
      : '高风险'
  const label = serverReadiness ? reportReadinessLabel(serverReadiness) : fallbackLabel
  const fallbackSummary = tone === 'ready'
    ? '报告证据完整，可进入复盘与问答'
    : tone === 'warning'
      ? '报告可读，但仍有证据缺口'
      : '报告发现高风险，需要优先处理'
  const summary = typeof reportQuality?.summary === 'string' && reportQuality.summary
    ? reportQuality.summary
    : fallbackSummary
  const nextActions: string[] = []

  if (highRiskCount > 0) {
    nextActions.push(`优先处理 ${highRiskCount} 个高风险项，再进入自动修复或重构计划。`)
  }
  if (missingCoreArtifacts.length > 0) {
    nextActions.push(`补齐核心产物：${missingCoreArtifacts.map(type => ARTIFACT_TITLES[type] || type).join('、')}。`)
  }
  if (testFiles <= 0) {
    nextActions.push('扫描未识别到测试文件，建议先补充测试证据再评估可维护性。')
  }
  if (!hasFingerprint) {
    nextActions.push('缺少仓库内容哈希，建议补齐扫描指纹以便后续报告对比。')
  }
  if (nextActions.length === 0) {
    nextActions.push(suggestions[0] || '可以基于当前报告继续进入 code_chunks 问答、依赖图谱复盘和自动修复候选筛选。')
  }

  return {
    label,
    tone,
    confidence,
    summary,
    nextActions,
    metrics: [
      { label: '核心产物', value: `${presentCoreArtifacts.length}/${CORE_REPORT_ARTIFACTS.length}`, tone: artifactScore >= 100 ? 'ready' : artifactScore > 0 ? 'warning' : 'idle' },
      { label: '风险项', value: `${risks.length} 个`, tone: highRiskCount > 0 ? 'danger' : risks.length > 0 ? 'warning' : 'ready' },
      { label: 'API / DB', value: `${apiRoutes.length}/${dbEntities.length}`, tone: apiRoutes.length + dbEntities.length > 0 ? 'ready' : 'idle' },
      { label: '技术债/建议', value: `${debts.length}/${suggestions.length}`, tone: debts.length > 0 ? 'warning' : 'ready' },
      { label: '测试文件', value: formatNumber(testFiles), tone: testFiles > 0 ? 'ready' : 'warning' },
      { label: '扫描指纹', value: hasFingerprint ? '已生成' : '缺失', tone: hasFingerprint ? 'ready' : 'warning' },
      { label: '报告质量', value: serverReadiness ? reportReadinessLabel(serverReadiness) : `${confidence}%`, tone },
    ],
  }
}

function buildCodeKnowledgeSignal(
  response: CodeChunkSearchResponse | null,
  taskStatus?: string,
  error?: string | null,
): CodeKnowledgeSignal {
  if (error) {
    return {
      tone: 'danger',
      title: '代码知识库状态不可用',
      summary: '扫描详情页暂时无法读取 code_chunks 状态，报告和产物仍可继续查看。',
      readinessLabel: 'ERROR',
      confidence: 0,
      totalChunks: 0,
      embeddedChunks: 0,
      embeddingCoverage: 0,
      retrievalMode: 'ERROR',
      nextAction: '重试读取状态',
      sampleFile: '-',
    }
  }

  const totalChunks = response?.totalChunks || 0
  const embeddedChunks = response?.embeddedChunks || 0
  const embeddingCoverage = totalChunks > 0 ? Math.round((embeddedChunks / totalChunks) * 100) : 0
  const profile = response?.evidenceProfile
  const sampleFile = response?.items?.[0]?.filePath || '-'
  const retrievalMode = response?.retrievalMode || (totalChunks > 0 ? 'STABLE_FALLBACK' : 'NO_CONTEXT')
  const profileConfidence = toFiniteNumber(profile?.confidence)

  if (taskStatus === 'RUNNING' || taskStatus === 'PENDING') {
    return {
      tone: totalChunks > 0 ? 'warning' : 'idle',
      title: totalChunks > 0 ? '代码切片正在生成' : '等待 code_chunks 生成',
      summary: totalChunks > 0
        ? `已生成 ${formatNumber(totalChunks)} 个代码切片，扫描完成后可进入问答和证据检索。`
        : '扫描仍在执行，chunk_code 步骤完成后会产出可检索代码切片。',
      readinessLabel: totalChunks > 0 ? 'PARTIAL' : 'PENDING',
      confidence: totalChunks > 0 ? Math.max(profileConfidence, 35) : 12,
      totalChunks,
      embeddedChunks,
      embeddingCoverage,
      retrievalMode,
      nextAction: '等待扫描完成',
      sampleFile,
    }
  }

  if (totalChunks <= 0) {
    return {
      tone: taskStatus === 'SUCCESS' ? 'danger' : 'idle',
      title: taskStatus === 'SUCCESS' ? 'code_chunks 缺失' : '暂无代码知识库',
      summary: taskStatus === 'SUCCESS'
        ? '扫描已结束但没有 code_chunks，需检查 chunk_code 步骤、文件过滤规则或切片落库。'
        : '当前扫描还没有可检索代码切片。',
      readinessLabel: 'GAP',
      confidence: 12,
      totalChunks: 0,
      embeddedChunks: 0,
      embeddingCoverage: 0,
      retrievalMode: 'NO_CONTEXT',
      nextAction: '检查 chunk_code',
      sampleFile: '-',
    }
  }

  const readiness = String(profile?.readiness || '').toUpperCase()
  const hasEmbeddings = embeddedChunks > 0
  const tone: ReportSignalTone = readiness === 'GAP'
    ? 'warning'
    : hasEmbeddings || profileConfidence >= 68
      ? 'ready'
      : 'warning'
  const readinessLabel = hasEmbeddings
    ? (readiness || 'READY')
    : 'KEYWORD_READY'
  const confidence = Math.max(
    hasEmbeddings ? 72 : 54,
    Math.min(96, profileConfidence || (hasEmbeddings ? 78 : 58)),
  )
  const summary = hasEmbeddings
    ? `已生成 ${formatNumber(totalChunks)} 个 code_chunks，向量覆盖 ${embeddingCoverage}%，可进入 RAG 问答和证据检索。`
    : `已生成 ${formatNumber(totalChunks)} 个 code_chunks，当前未向量化，代码问答会先使用关键词和稳定回退证据。`

  return {
    tone,
    title: hasEmbeddings ? '代码知识库可用' : '代码切片可用，语义召回待补齐',
    summary: profile?.summary || summary,
    readinessLabel,
    confidence,
    totalChunks,
    embeddedChunks,
    embeddingCoverage,
    retrievalMode,
    nextAction: profile?.nextAction || (hasEmbeddings ? '进入代码问答' : '补齐 embedding'),
    sampleFile,
  }
}

function reportToneColor(tone: ReportSignalTone) {
  if (tone === 'ready') return 'green'
  if (tone === 'warning') return 'gold'
  if (tone === 'danger') return 'red'
  return 'default'
}

function repairEvidenceGateColor(gate?: string | null) {
  const normalized = String(gate || '').toUpperCase()
  if (normalized === 'READY') return 'green'
  if (normalized === 'REVIEW') return 'gold'
  if (normalized === 'BLOCKED') return 'red'
  return 'default'
}

function retrievalModeLabel(mode?: string | null): string {
  if (mode === 'HYBRID') return '混合召回'
  if (mode === 'SEMANTIC_FALLBACK') return '语义召回'
  if (mode === 'STABLE_FALLBACK') return '稳定回退'
  if (mode === 'KEYWORD') return '关键词'
  if (mode === 'NO_SCAN') return '未扫描'
  if (mode === 'NO_CONTEXT') return '无上下文'
  if (mode === 'ERROR') return '不可用'
  return mode || '-'
}

function reportReadinessTone(value: string): ReportSignalTone {
  if (value === 'READY') return 'ready'
  if (value === 'RISK') return 'danger'
  if (value === 'REVIEW' || value === 'WARNING' || value === 'GAP') return 'warning'
  return 'idle'
}

function reportReadinessLabel(value: string) {
  if (value === 'READY') return '证据闭环'
  if (value === 'RISK') return '优先排险'
  if (value === 'REVIEW') return '需复核'
  if (value === 'WARNING' || value === 'GAP') return '存在缺口'
  return value || '-'
}

function reportCheckTone(value: unknown): ReportSignalTone {
  const status = String(value || '').toUpperCase()
  if (status === 'READY' || status === 'BOUND') return 'ready'
  if (status === 'RISK') return 'danger'
  if (status === 'WARNING' || status === 'GAP') return 'warning'
  return 'idle'
}

function formatStepLabel(step?: string | null) {
  return step ? STEP_LABEL[step] || step : '-'
}

function parseJson(json?: string) {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function taskProgress(status?: string) {
  if (status === 'SUCCESS') return 100
  if (status === 'FAILED' || status === 'CANCELLED') return 100
  if (status === 'RUNNING') return 45
  if (status === 'PENDING') return 12
  return 0
}

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function timestampValue(value?: string | null) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

function latestTimestamp(values: Array<string | null | undefined>) {
  const sorted = values
    .filter(Boolean)
    .sort((a, b) => timestampValue(b) - timestampValue(a))
  return sorted[0] || null
}

function statusLabel(status?: string | null) {
  const value = String(status || '').toUpperCase()
  return STATUS_LABEL[value] || value || '-'
}

function isFailedStatus(status?: string | null) {
  return ['FAILED', 'ERROR', 'CANCELLED'].includes(String(status || '').toUpperCase())
}

function isRunningStatus(status?: string | null) {
  return ['RUNNING', 'PENDING', 'PROCESSING', 'QUEUED'].includes(String(status || '').toUpperCase())
}

function statusTone(status?: string | null): ReportSignalTone {
  const value = String(status || '').toUpperCase()
  if (['SUCCESS', 'COMPLETED', 'DONE', 'PATCH_READY', 'PR_CREATED', 'PR_MERGED'].includes(value)) return 'ready'
  if (isFailedStatus(value)) return 'danger'
  if (isRunningStatus(value)) return 'warning'
  return 'idle'
}

function firstDistinctDetail(title: string, candidates: Array<string | null | undefined>, fallback: string) {
  const normalizedTitle = title.trim()
  const match = candidates.find(candidate => {
    const value = String(candidate || '').trim()
    return value && value !== normalizedTitle && !normalizedTitle.includes(value)
  })
  return match || fallback
}

function formatStepTime(step: ExecutionStep) {
  if (!step.startedAt) return '等待执行'
  if (!step.finishedAt) return `开始于 ${formatTime(step.startedAt)}`
  return `${formatTime(step.startedAt)} - ${formatTime(step.finishedAt)}`
}

function formatNumber(value: number | string | null | undefined) {
  if (value == null || value === '') return '-'
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString() : '-'
  return value
}

function toFiniteNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatBytes(value: number | null | undefined) {
  if (!value) return '0 B'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function shortHash(value?: string | null) {
  if (!value) return '-'
  return value.length > 12 ? `${value.slice(0, 12)}...` : value
}

function artifactDetailUrl(projectId: number, scanTaskId: number, artifactId: number) {
  return `/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${scanTaskId}&artifactId=${artifactId}`
}

function artifactsUrl(projectId: number, ownerType: string, ownerId?: number | null, artifactId?: number | null) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('ownerType', ownerType)
  if (ownerId) params.set('ownerId', String(ownerId))
  if (artifactId) params.set('artifactId', String(artifactId))
  return `/artifacts?${params.toString()}`
}

function autoRepairUrl(projectId: number, scanTaskId: number, repairId?: number) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('scanTaskId', String(scanTaskId))
  if (repairId) params.set('repairId', String(repairId))
  return `/auto-repairs?${params.toString()}`
}

function executionTaskUrl(projectId: number, taskId?: number | null) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  if (taskId) params.set('taskId', String(taskId))
  return `/execution-tasks?${params.toString()}`
}

function agentTaskUrl(projectId: number, scanTaskId: number, taskId?: number | null) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('scanTaskId', String(scanTaskId))
  if (taskId) params.set('taskId', String(taskId))
  return `/agent-tasks?${params.toString()}`
}

function projectQaUrl(projectId: number, question?: string | null, scanTaskId?: number | null, evidence?: ReportEvidenceDrawerData | null) {
  const params = new URLSearchParams()
  params.set('tab', 'qa')
  const safeQuestion = redactReportEvidenceText(question || '')
  if (safeQuestion.trim()) {
    params.set('question', safeQuestion)
  }
  if (scanTaskId) {
    params.set('scanTaskId', String(scanTaskId))
  }
  if (evidence) {
    const safeEvidence = redactedReportEvidenceForOutput(evidence)
    params.set('evidenceCategory', safeEvidence.category)
    params.set('evidenceSource', safeEvidence.source)
    params.set('evidenceTitle', safeEvidence.title)
    params.set('evidenceSummary', safeEvidence.summary)
    if (safeEvidence.filePath) params.set('evidenceFile', safeEvidence.filePath)
    if (safeEvidence.lineNumber) params.set('evidenceLine', safeEvidence.lineNumber)
    if (safeEvidence.startLine) params.set('evidenceStartLine', String(safeEvidence.startLine))
    if (safeEvidence.endLine) params.set('evidenceEndLine', String(safeEvidence.endLine))
  }
  return `/projects/${projectId}?${params.toString()}`
}

function projectQaDeepLink(projectId: number, question?: string | null, scanTaskId?: number | null) {
  return `${window.location.origin}${projectQaUrl(projectId, question, scanTaskId)}`
}

async function copyTextToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {
    // Fall back for browser contexts where Clipboard API is blocked.
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '-1000px'
  textarea.style.left = '-1000px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!copied) {
    throw new Error('clipboard copy failed')
  }
}

function agentTaskDraftUrl(projectId: number, scanTaskId: number) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('openCreate', '1')
  params.set('scanTaskId', String(scanTaskId))
  params.set('taskType', 'ARCHITECTURE_REVIEW')
  params.set('title', `扫描报告 #${scanTaskId} 架构审查`)
  params.set('description', `基于扫描报告 #${scanTaskId} 创建 Agent 架构审查任务，要求分析结论引用该次扫描的符号、关系和产物证据。`)
  return `/agent-tasks?${params.toString()}`
}

function scanAuditUrl(projectId: number, scanTaskId: number, filters?: {
  resourceType?: string | null
  resourceId?: number | null
  action?: string | null
  status?: string | null
  conversationId?: number | null
}) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('scanTaskId', String(scanTaskId))
  if (filters?.resourceType) params.set('resourceType', filters.resourceType)
  if (filters?.resourceId) params.set('resourceId', String(filters.resourceId))
  if (filters?.action) params.set('action', filters.action)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.conversationId) params.set('conversationId', String(filters.conversationId))
  return `/audit-logs?${params.toString()}`
}

function autoRepairCandidateUrl(projectId: number, repositoryId: number, scanTaskId: number, risk: any) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('repositoryId', String(repositoryId))
  params.set('openCreate', '1')
  params.set('scanTaskId', String(scanTaskId))
  params.set('source', `扫描报告 #${scanTaskId}`)
  params.set('sourceType', 'SCAN_REPORT_RISK')
  const filePath = riskFilePath(risk)
  if (filePath) params.set('filePath', filePath)
  params.set('targetDesc', buildRiskRepairTarget(scanTaskId, risk))
  if (risk?.category) params.set('riskCategory', redactReportEvidenceText(String(risk.category)))
  if (risk?.severity) params.set('riskSeverity', redactReportEvidenceText(String(risk.severity)))
  const lineNumber = riskLineNumber(risk)
  if (lineNumber) params.set('lineNumber', String(lineNumber))
  params.set('riskKey', buildRiskKey(risk, filePath))
  return `/auto-repairs?${params.toString()}`
}

function autoRepairCandidateDeepLink(projectId: number, repositoryId: number, scanTaskId: number, risk: any) {
  return `${window.location.origin}${autoRepairCandidateUrl(projectId, repositoryId, scanTaskId, risk)}`
}

function buildEvidenceReference(scanTaskId: number, evidence: ReportEvidenceDrawerData) {
  const safeEvidence = redactedReportEvidenceForOutput(evidence)
  const lines = [
    `SourceLens evidence reference`,
    `scanTaskId: ${scanTaskId}`,
    `category: ${safeEvidence.category}`,
    `title: ${safeEvidence.title}`,
    `source: ${safeEvidence.source}`,
    `summary: ${safeEvidence.summary}`,
  ]
  if (safeEvidence.filePath) lines.push(`filePath: ${safeEvidence.filePath}`)
  const lineLabel = reportEvidenceLineLabel(safeEvidence)
  if (lineLabel) lines.push(`line: ${lineLabel}`)
  if (safeEvidence.startLine) lines.push(`startLine: ${safeEvidence.startLine}`)
  if (safeEvidence.endLine) lines.push(`endLine: ${safeEvidence.endLine}`)
  if (safeEvidence.artifactTypes?.length) lines.push(`artifacts: ${safeEvidence.artifactTypes.join(', ')}`)
  for (const field of safeEvidence.fields) {
    lines.push(`${field.label}: ${field.value}`)
  }
  lines.push(`question: ${safeEvidence.qaQuestion}`)
  return lines.join('\n').slice(0, 1800)
}

function buildEvidenceChunkQuery(evidence: ReportEvidenceDrawerData) {
  const safeEvidence = redactedReportEvidenceForOutput(evidence)
  const fieldValues = safeEvidence.fields
    .map(field => field.value)
    .filter(value => value && value !== '-')
    .slice(0, 4)
  const fileAnchor = safeEvidence.filePath
    ? `${safeEvidence.filePath}${reportEvidenceLineLabel(safeEvidence) ? `:${reportEvidenceLineLabel(safeEvidence)}` : ''}`
    : null
  return [
    fileAnchor,
    safeEvidence.title,
    safeEvidence.category,
    safeEvidence.summary,
    ...fieldValues,
  ].filter(Boolean).join('\n').slice(0, 900)
}

function riskFilePath(risk: any) {
  return String(risk?.file_path || risk?.filePath || risk?.path || '').trim()
}

function riskLineNumber(risk: any) {
  const value = Number(risk?.line_number || risk?.lineNumber || risk?.line)
  return Number.isFinite(value) && value > 0 ? value : 0
}

function buildRiskKey(risk: any, filePath?: string) {
  const category = redactReportEvidenceText(String(risk?.category || 'risk')).trim()
  const path = String(filePath || riskFilePath(risk) || 'project').trim()
  const line = riskLineNumber(risk)
  return [category, path, line || 'project'].join(':').slice(0, 120)
}

function buildRiskRepairTarget(scanTaskId: number, risk: any) {
  const parts = [
    `来自扫描报告 #${scanTaskId} 的风险项，请生成最小、可审查的单文件修复 patch。`,
    `严重级别：${redactReportEvidenceText(risk?.severity || 'INFO')}`,
    `类别：${redactReportEvidenceText(risk?.category || '未分类')}`,
    `问题描述：${redactReportEvidenceText(risk?.message || risk?.detail || '请根据报告风险项修复该文件。')}`,
  ]
  const suggestion = risk?.suggestion || risk?.recommendation
  if (suggestion) {
    parts.push(`建议方向：${redactReportEvidenceText(suggestion)}`)
  }
  return parts.join('\n').slice(0, 1200)
}

function buildRiskFileLocalizationQuestion(scanTaskId: number, risks: any[]) {
  const riskLines = risks.slice(0, 5).map((risk, index) => {
    const severity = redactReportEvidenceText(risk?.severity || 'INFO')
    const category = redactReportEvidenceText(risk?.category || '未分类')
    const message = redactReportEvidenceText(risk?.message || risk?.detail || '未提供描述')
    const impact = risk?.impact ? `，影响：${redactReportEvidenceText(risk.impact)}` : ''
    return `${index + 1}. ${severity} / ${category}：${message}${impact}`
  })
  return [
    `请基于扫描报告 #${scanTaskId} 和当前 code_chunks，定位这些项目级风险最应该优先修复或补测试的具体文件。`,
    '请返回可作为自动修复候选的文件路径、原因、建议修改范围，并说明哪些风险不适合直接生成单文件 patch。',
    ...riskLines,
  ].join('\n').slice(0, 1200)
}

function formatList(value: unknown) {
  return Array.isArray(value) && value.length > 0 ? value.join(', ') : '未识别'
}

function riskColor(severity?: string) {
  if (severity === 'HIGH') return '#dc2626'
  if (severity === 'MEDIUM') return '#d97706'
  return '#64748b'
}

function riskTag(severity?: string) {
  if (severity === 'HIGH') return 'red'
  if (severity === 'MEDIUM') return 'orange'
  return 'default'
}
