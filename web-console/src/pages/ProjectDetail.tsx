import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Tabs, Table, Modal, Form, Input, InputNumber, Space, Popconfirm, Tag, message, Typography, Card, Progress } from 'antd'
import {
  BranchesOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  FileOutlined,
  FileTextOutlined,
  FolderOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SearchOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { projectApi, Project, type CodeQaCitation, type CodeQaCitationCoverage, type CodeQaClaimCitationCoverage, type CodeQaEvidenceRef } from '../api/project'
import { repositoryApi, Repository } from '../api/repository'
import { scanTaskApi, ScanTask } from '../api/scanTask'
import { artifactApi, ArtifactRecord } from '../api/artifact'
import { executionTaskApi, ExecutionTask } from '../api/executionTask'
import { codeChunkApi } from '../api/codeChunk'
import type { CodeChunkEvidenceProfile, CodeChunkSearchItem, CodeChunkSearchResponse } from '../api/codeChunk'
import { formatApiError, showApiError } from '../api/client'
import ArtifactLinkButton from '../components/ArtifactLinkButton'
import ActionButton from '../components/ui/ActionButton'
import IconActionButton from '../components/ui/IconActionButton'
import StateBlock from '../components/ui/StateBlock'
import { redactSensitiveText } from '../utils/displayRedaction'
import DependencyGraphView from './DependencyGraph'

interface LanguageStat {
  name: string
  file_count: number
  line_count: number
}

interface OverviewData {
  languages: LanguageStat[]
  framework: { name: string; version: string } | null
  totalFiles: number
  totalDirs: number
  totalLines: number
  controllers: number
  services: number
  repositories: number
  entities: number
}

interface ReportQualityData {
  readiness: string
  confidence: number
  summary: string
  gaps: string[]
  nextActions: string[]
  evidenceChecks: unknown[]
}

type AnalysisReadinessTone = 'ready' | 'warning' | 'danger' | 'idle'

interface AnalysisReadinessSignal {
  tone: AnalysisReadinessTone
  title: string
  summary: string
  confidence: number
  readinessLabel: string
  coreReadyCount: number
  coreTotalCount: number
  missingCoreArtifacts: string[]
  nextAction: string
  metrics: Array<{ label: string; value: string; tone: AnalysisReadinessTone }>
}

interface ProjectCodeKnowledgeStatus {
  tone: AnalysisReadinessTone
  flowTone: 'ready' | 'attention' | 'idle'
  value: string
  meta: string
  label: string
  summary: string
  nextAction: string
  totalChunks: number
  embeddedChunks: number
  embeddingCoverage: number
  retrievalMode: string | null
}

type ProjectWorkspaceActionKey =
  | 'STALE_REFRESH'
  | 'ADD_REPOSITORY'
  | 'START_SCAN'
  | 'WATCH_SCAN'
  | 'REVIEW_FAILED_SCAN'
  | 'OPEN_ARTIFACTS'
  | 'OPEN_QA'

type ProjectWorkspaceViewState = 'INITIAL_LOADING' | 'FATAL_LOAD' | 'STALE_REFRESH' | 'READY'

interface ProjectWorkspaceLoadOptions {
  silent?: boolean
  includeDetails?: boolean
}

interface ProjectWorkspaceNextAction {
  key: ProjectWorkspaceActionKey
  tone: AnalysisReadinessTone
  title: string
  summary: string
  blocker: string
  evidenceMaturity: string
  primaryLabel: string
  primaryIcon: React.ReactNode
  primaryDisabled?: boolean
  secondaryLabel?: string
  secondaryIcon?: React.ReactNode
  secondaryDisabled?: boolean
  checks: Array<{ label: string; value: string; ready: boolean }>
}

interface ProjectTrustedLoopStep {
  key: string
  index: string
  title: string
  owner: string
  value: string
  description: string
  tone: 'ready' | 'attention' | 'idle'
  actionLabel: string
  onAction: () => void
}

interface QaMessage {
  role: 'user' | 'assistant'
  content: string
  chunks?: CodeChunkSearchItem[]
  answerCitations?: CodeQaCitation[]
  scanTaskId?: number | null
  retrievalMode?: string | null
  groundingStatus?: string | null
  citationEnforcementStatus?: string | null
  citationEnforcementReason?: string | null
  citationEnforcementNote?: string | null
  citationCoverage?: CodeQaCitationCoverage
  claimCitationCoverage?: CodeQaClaimCitationCoverage
  sourceEvidenceRef?: CodeQaEvidenceRef | null
  sourceEvidenceMatched?: boolean | null
  sourceEvidenceMatchType?: string | null
  evidenceProfile?: CodeChunkEvidenceProfile
}

type QaSignalTone = 'ready' | 'warning' | 'idle'

type RepairEvidenceGateStatus = 'READY' | 'REVIEW' | 'BLOCKED'

interface RepairEvidenceGate {
  status: RepairEvidenceGateStatus
  label: string
  color: string
  summary: string
  checks: string[]
}

interface CitationCoverageAudit {
  tone: 'ready' | 'warning' | 'blocked'
  title: string
  summary: string
  metrics: Array<{ label: string; value: string }>
  checks: Array<{ label: string; ok: boolean }>
  roleDistribution?: {
    status: string
    roles: string[]
    files: string[]
  }
}

interface ClaimCitationAudit {
  tone: 'ready' | 'warning' | 'blocked'
  title: string
  summary: string
  metrics: Array<{ label: string; value: string }>
  roleDistribution?: {
    status: string
    primaryBound: number
    contextOnly: number
    unknownOnly: number
    requiredClaims: number
    primaryFiles: number
    contextFiles: number
    roles: string[]
    files: string[]
  }
  problemClaims: Array<{ id: string; status: string; text: string; labels: string }>
}

interface QaTrustSummary {
  tone: 'ready' | 'warning' | 'blocked'
  title: string
  summary: string
  nextAction: string
  metrics: Array<{ label: string; value: string }>
  checks: Array<{ label: string; ok: boolean }>
}

interface QaCrossFileCitationSummary {
  tone: 'ready' | 'warning' | 'blocked'
  status: string
  title: string
  summary: string
  metrics: Array<{ label: string; value: string }>
  checks: Array<{ label: string; ok: boolean }>
  contextGap: {
    evidence: number
    files: number
    visible: boolean
  }
}

interface QaSourceLocationConfidence {
  tone: 'ready' | 'warning' | 'blocked'
  title: string
  summary: string
  metrics: Array<{ label: string; value: string }>
  checks: Array<{ label: string; ok: boolean }>
}

interface QaAnswerSourceEvidenceReceipt {
  title: string
  source: string
  category: string
  fileReference: string
  lineKindLabel: string
  scanLabel: string
  matchLabel: string
  matchType: string
  matched: boolean
  locationConfidence: QaSourceLocationConfidence
}

interface QaSourceFileMatchRelease {
  tone: 'ready' | 'warning' | 'blocked'
  title: string
  summary: string
  targetReference: string
  citedReference: string
  matchLabel: string
  riskLabel: string
  nextAction: string
  checks: Array<{ label: string; ok: boolean; detail: string }>
}

interface QaReadableEvidenceViewModel {
  repairEvidenceGate: RepairEvidenceGate | null
  citationAudit: CitationCoverageAudit | null
  claimAudit: ClaimCitationAudit | null
  trustSummary: QaTrustSummary | null
  crossFileSummary: QaCrossFileCitationSummary | null
  sourceEvidenceReceipt: QaAnswerSourceEvidenceReceipt | null
  sourceFileRelease: QaSourceFileMatchRelease | null
}

interface QaNextActionRailProps {
  summary: QaTrustSummary
  previousUserQuestion: string
  primaryRepairUrl: string
  primaryCitation?: CodeQaCitation
  loading: boolean
  hasSourceScan: boolean
  onRetryQuestion: (question: string) => void
  onPrepareQuestion: (question: string) => void
  onRefreshEvidence: (question: string) => void
  onCopyCitation: (citation: CodeQaCitation) => void
  onOpenRepair: (url: string) => void
}

interface QaReadableEvidenceSectionProps {
  evidence: QaReadableEvidenceViewModel
  previousUserQuestion: string
  primaryRepairUrl: string
  primaryCitation?: CodeQaCitation
  loading: boolean
  hasSourceScan: boolean
  onRetryQuestion: (question: string) => void
  onPrepareQuestion: (question: string) => void
  onRefreshEvidence: (question: string) => void
  onCopyCitation: (citation: CodeQaCitation) => void
  onOpenRepair: (url: string) => void
}

interface QaDetailedEvidenceAuditSectionProps {
  citationAudit: CitationCoverageAudit | null
  claimAudit: ClaimCitationAudit | null
  repairEvidenceGate: RepairEvidenceGate | null
}

interface RagQualitySignal {
  label: string
  tone: QaSignalTone
  confidence: number
  summary: string
  nextAction: string
  details: string[]
}

interface QaStarterPrompt {
  key: string
  label: string
  prompt: string
  reason: string
  tone: QaSignalTone
}

interface ChunkEvidenceProfile {
  avgScore: number
  dominantEvidenceType: string
  embeddedCount: number
  evidenceTypeStats: Array<{ type: string; count: number }>
  fileStats: Array<{ filePath: string; count: number; bestScore: number }>
  lineSpan: number
  lowConfidenceCount: number
  topScore: number
  uniqueFiles: number
}

interface ChunkEvidenceCombination {
  tone: QaSignalTone
  label: string
  summary: string
  nextAction: string
  primaryCount: number
  contextCount: number
  uniqueFiles: number
  embeddedCount: number
  topSourceLabel: string
  topReference: string
  fileCoverage: string[]
  rolePath: string[]
  nextQuestions: string[]
}

type CodeUnderstandingQueryKind = 'IDLE' | 'FILE_LINE' | 'METHOD_ANCHOR' | 'STACK_TRACE' | 'GENERAL'

interface CodeUnderstandingQuerySignal {
  kind: CodeUnderstandingQueryKind
  label: string
  title: string
  hint: string
}

const DEFAULT_QA_STARTERS = [
  '请解释本项目核心 Controller Service Repository 调用链，并列出关键文件证据',
  '本项目最核心的数据模型和持久化路径是什么？',
  '请找出前端入口、API 调用和后端接口之间的对应关系',
  '请根据我粘贴的 file:line、Class#method 或浏览器 stack trace 定位对应代码，并说明上下文风险',
]

const PROJECT_TAB_KEYS = new Set(['overview', 'repos', 'scans', 'qa', 'graph'])
const REPORT_EVIDENCE_QUERY_PARAMS = [
  'evidenceCategory',
  'evidenceSource',
  'evidenceTitle',
  'evidenceSummary',
  'evidenceFile',
  'evidenceLine',
  'evidenceStartLine',
  'evidenceEndLine',
]

const CORE_ARTIFACT_TYPES = [
  'RAW_SCAN_RESULT',
  'ARCHITECTURE_OVERVIEW',
  'ARCHITECTURE_REPORT',
  'API_CATALOG',
  'DB_SCHEMA',
  'CODE_METRICS',
  'DEPENDENCY_GRAPH',
]

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [project, setProject] = useState<Project | null>(null)
  const [repos, setRepos] = useState<Repository[]>([])
  const [scans, setScans] = useState<ScanTask[]>([])
  const [scanExecutions, setScanExecutions] = useState<Record<number, ExecutionTask>>({})
  const [workspacePhase, setWorkspacePhase] = useState<ProjectWorkspaceViewState>('INITIAL_LOADING')
  const [workspaceSyncing, setWorkspaceSyncing] = useState(false)
  const [trustedSnapshotProjectId, setTrustedSnapshotProjectId] = useState<number | null>(null)
  const [projectError, setProjectError] = useState<string | null>(null)
  const [loadingRepos, setLoadingRepos] = useState(true)
  const [loadingScans, setLoadingScans] = useState(true)
  const [repoError, setRepoError] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [repoModalOpen, setRepoModalOpen] = useState(false)
  const [githubAppModalOpen, setGithubAppModalOpen] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [repoForm] = Form.useForm()
  const [githubAppForm] = Form.useForm()
  const [creatingScan, setCreatingScan] = useState<number | null>(null)
  const [cancellingScan, setCancellingScan] = useState<number | null>(null)
  const [latestScanTaskId, setLatestScanTaskId] = useState<number | null>(null)
  const requestedTab = searchParams.get('tab') || 'overview'
  const requestedQuestion = searchParams.get('question') || ''
  const requestedScanTaskId = parsePositiveInt(searchParams.get('scanTaskId'))
  const knowledgeScanTaskId = requestedScanTaskId ?? latestScanTaskId
  const activeWorkspaceTab = PROJECT_TAB_KEYS.has(requestedTab) ? requestedTab : 'overview'

  // Overview state
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [fileTree, setFileTree] = useState<any>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [latestArtifacts, setLatestArtifacts] = useState<ArtifactRecord[]>([])
  const [reportQuality, setReportQuality] = useState<ReportQualityData | null>(null)
  const [codeKnowledge, setCodeKnowledge] = useState<CodeChunkSearchResponse | null>(null)
  const [codeKnowledgeLoading, setCodeKnowledgeLoading] = useState(false)
  const [codeKnowledgeError, setCodeKnowledgeError] = useState<string | null>(null)
  const activeProjectIdRef = useRef(projectId)
  const projectGenerationRef = useRef(0)
  const coreRequestSeqRef = useRef(0)
  const detailRequestSeqRef = useRef(0)
  const fullRefreshOwnerRef = useRef<number | null>(null)
  const workspaceSyncOwnerRef = useRef<string | null>(null)
  const trustedSnapshotProjectIdRef = useRef<number | null>(null)
  const detailScanTaskIdRef = useRef<number | null>(null)
  activeProjectIdRef.current = projectId

  const loadWorkspace = useCallback(async ({ silent = false, includeDetails = true }: ProjectWorkspaceLoadOptions = {}) => {
    const ownerProjectId = projectId
    const projectGeneration = projectGenerationRef.current
    const coreSeq = coreRequestSeqRef.current + 1
    coreRequestSeqRef.current = coreSeq
    const fullRefresh = !silent && includeDetails
    const coreSyncToken = `${projectGeneration}:core:${coreSeq}`
    const hadTrustedSnapshot = trustedSnapshotProjectIdRef.current === ownerProjectId
    const isCurrentCore = () => (
      activeProjectIdRef.current === ownerProjectId
      && projectGenerationRef.current === projectGeneration
      && coreRequestSeqRef.current === coreSeq
    )
    const finishWorkspaceSync = (token: string | null) => {
      if (token && workspaceSyncOwnerRef.current === token) {
        workspaceSyncOwnerRef.current = null
        setWorkspaceSyncing(false)
      }
    }
    const finishFullRefresh = () => {
      if (fullRefresh && fullRefreshOwnerRef.current === coreSeq) {
        fullRefreshOwnerRef.current = null
      }
    }

    if (fullRefresh) {
      fullRefreshOwnerRef.current = coreSeq
      workspaceSyncOwnerRef.current = coreSyncToken
      setWorkspaceSyncing(true)
    }

    if (!Number.isInteger(ownerProjectId) || ownerProjectId <= 0) {
      if (isCurrentCore()) {
        setProjectError('项目 ID 无效，无法加载项目工作台。')
        setRepoError(null)
        setScanError(null)
        setWorkspacePhase(hadTrustedSnapshot ? 'STALE_REFRESH' : 'FATAL_LOAD')
        setLoadingRepos(false)
        setLoadingScans(false)
      }
      finishWorkspaceSync(fullRefresh ? coreSyncToken : null)
      finishFullRefresh()
      return
    }

    if (!hadTrustedSnapshot) {
      setWorkspacePhase('INITIAL_LOADING')
    }
    if (!silent || !hadTrustedSnapshot) {
      setLoadingRepos(true)
      setLoadingScans(true)
    }

    const [projectResult, reposResult, scansResult, executionsResult] = await Promise.allSettled([
      projectApi.detail(ownerProjectId),
      repositoryApi.list(ownerProjectId),
      scanTaskApi.list(ownerProjectId),
      executionTaskApi.list(ownerProjectId, 1, 100),
    ])
    if (!isCurrentCore()) {
      finishWorkspaceSync(fullRefresh ? coreSyncToken : null)
      finishFullRefresh()
      return
    }

    const nextProject = projectResult.status === 'fulfilled' ? projectResult.value.data.data : null
    const nextRepos: Repository[] = reposResult.status === 'fulfilled' ? (reposResult.value.data.data || []) : []
    const nextScans: ScanTask[] = scansResult.status === 'fulfilled' ? (scansResult.value.data.data.items || []) : []
    let nextProjectError = projectResult.status === 'rejected'
      ? formatApiError(projectResult.reason, '加载项目详情失败')
      : null
    let nextRepoError = reposResult.status === 'rejected'
      ? formatApiError(reposResult.reason, '加载仓库列表失败')
      : null
    let nextScanError = scansResult.status === 'rejected'
      ? formatApiError(scansResult.reason, '加载扫描任务失败')
      : null

    if (!nextProjectError && (!nextProject || Number(nextProject.id) !== ownerProjectId)) {
      nextProjectError = '项目详情归属校验失败，已拒绝应用响应。'
    }
    if (!nextRepoError && !nextRepos.every(repo => Number(repo.projectId) === ownerProjectId)) {
      nextRepoError = '仓库列表归属校验失败，已拒绝应用响应。'
    }
    if (!nextScanError && !nextScans.every(scan => Number(scan.projectId) === ownerProjectId)) {
      nextScanError = '扫描列表归属校验失败，已拒绝应用响应。'
    }

    if (nextProjectError || nextRepoError || nextScanError) {
      setProjectError(nextProjectError)
      setRepoError(nextRepoError)
      setScanError(nextScanError)
      setWorkspacePhase(hadTrustedSnapshot ? 'STALE_REFRESH' : 'FATAL_LOAD')
      setLoadingRepos(false)
      setLoadingScans(false)
      finishWorkspaceSync(fullRefresh ? coreSyncToken : null)
      finishFullRefresh()
      return
    }

    const nextExecutionByScanId: Record<number, ExecutionTask> = {}
    if (executionsResult.status === 'fulfilled') {
      const executions = executionsResult.value.data.data.items || []
      const executionResponseOwned = executions.every(task => Number(task.projectId) === ownerProjectId)
      if (executionResponseOwned) {
        const scanIds = new Set(nextScans.map(scan => scan.id))
        executions.forEach((task: ExecutionTask) => {
          if (task.sourceType === 'SCAN_TASK' && task.sourceId && scanIds.has(task.sourceId)) {
            nextExecutionByScanId[task.sourceId] = task
          }
        })
      }
    }

    const latestSuccess = nextScans.find(scan => scan.status === 'SUCCESS') || null
    setProject(nextProject)
    setRepos(nextRepos)
    setScans(nextScans)
    setScanExecutions(nextExecutionByScanId)
    setLatestScanTaskId(latestSuccess?.id || null)
    setProjectError(null)
    setRepoError(null)
    setScanError(null)
    setLoadingRepos(false)
    setLoadingScans(false)
    trustedSnapshotProjectIdRef.current = ownerProjectId
    setTrustedSnapshotProjectId(ownerProjectId)
    setWorkspacePhase('READY')

    const nextDetailScanTaskId = latestSuccess?.id || null
    const scanDetailsChanged = detailScanTaskIdRef.current !== nextDetailScanTaskId
    // Same-scan polling only advances core state; it must never starve an in-flight detail request.
    const shouldStartDetails = Boolean(latestSuccess && (includeDetails || scanDetailsChanged))
    const detailSeq = includeDetails || scanDetailsChanged
      ? detailRequestSeqRef.current + 1
      : detailRequestSeqRef.current
    if (includeDetails || scanDetailsChanged) {
      detailRequestSeqRef.current = detailSeq
    }
    const detailSyncToken = fullRefresh && shouldStartDetails
      ? `${projectGeneration}:detail:${detailSeq}`
      : null
    if (detailSyncToken && workspaceSyncOwnerRef.current === coreSyncToken) {
      workspaceSyncOwnerRef.current = detailSyncToken
    }

    if (!latestSuccess) {
      detailScanTaskIdRef.current = null
      setOverview(null)
      setFileTree(null)
      setLatestArtifacts([])
      setReportQuality(null)
      setCodeKnowledge(null)
      setOverviewError('暂无成功的扫描结果')
      setCodeKnowledgeError(null)
      setOverviewLoading(false)
      setCodeKnowledgeLoading(false)
      finishWorkspaceSync(fullRefresh ? coreSyncToken : null)
      finishFullRefresh()
      return
    }

    if (!shouldStartDetails) {
      finishWorkspaceSync(fullRefresh ? coreSyncToken : null)
      finishFullRefresh()
      return
    }

    if (scanDetailsChanged) {
      detailScanTaskIdRef.current = latestSuccess.id
      setOverview(null)
      setFileTree(null)
      setLatestArtifacts([])
      setReportQuality(null)
      setCodeKnowledge(null)
    }
    const isCurrentDetail = () => (
      activeProjectIdRef.current === ownerProjectId
      && projectGenerationRef.current === projectGeneration
      && detailRequestSeqRef.current === detailSeq
      && detailScanTaskIdRef.current === latestSuccess.id
    )
    setOverviewLoading(true)
    setOverviewError(null)
    setCodeKnowledgeLoading(true)
    setCodeKnowledgeError(null)

    const [artifactsResult, codeKnowledgeResult] = await Promise.allSettled([
      artifactApi.list(ownerProjectId, {
        ownerType: 'SCAN_TASK',
        ownerId: latestSuccess.id,
      }),
      codeChunkApi.status(ownerProjectId, { scanTaskId: latestSuccess.id, limit: 1 }),
    ])
    if (!isCurrentDetail()) return

    let nextCodeKnowledge: CodeChunkSearchResponse | undefined
    let nextCodeKnowledgeError: string | null = null
    if (codeKnowledgeResult.status === 'fulfilled') {
      const response = codeKnowledgeResult.value.data.data
      if (isCodeKnowledgeOwnedByScan(response, latestSuccess.id)) {
        nextCodeKnowledge = response
      } else {
        nextCodeKnowledgeError = 'code_chunks 归属校验失败，已拒绝应用响应。'
      }
    } else {
      nextCodeKnowledgeError = formatApiError(codeKnowledgeResult.reason, '加载 code_chunks 状态失败')
    }

    let nextArtifacts: ArtifactRecord[] | undefined
    let nextReportQuality: ReportQualityData | null | undefined
    let nextOverview: OverviewData | null | undefined
    let nextFileTree: any
    let commitOverview = false
    let nextOverviewError: string | null = null

    if (artifactsResult.status === 'rejected') {
      nextOverviewError = formatApiError(artifactsResult.reason, '加载总览数据失败')
    } else {
      const artifacts: ArtifactRecord[] = artifactsResult.value.data.data || []
      if (!artifacts.every(artifact => isArtifactOwnedByScan(artifact, ownerProjectId, latestSuccess.id))) {
        nextOverviewError = '扫描产物归属校验失败，已拒绝应用响应。'
      } else {
        nextArtifacts = artifacts
        const reportArtifact = artifacts.find(artifact => artifact.artifactType === 'ARCHITECTURE_REPORT')
        const overviewArtifact = artifacts.find(artifact => artifact.artifactType === 'ARCHITECTURE_OVERVIEW')
        const [reportPreviewResult, overviewPreviewResult] = await Promise.allSettled([
          reportArtifact ? artifactApi.preview(ownerProjectId, reportArtifact.id) : Promise.resolve(null),
          overviewArtifact ? artifactApi.preview(ownerProjectId, overviewArtifact.id) : Promise.resolve(null),
        ])
        if (!isCurrentDetail()) return

        if (!reportArtifact) {
          nextReportQuality = null
        } else if (
          reportPreviewResult.status === 'fulfilled'
          && reportPreviewResult.value
          && isArtifactPreviewOwnedByScan(reportPreviewResult.value.data.data.record, reportArtifact, ownerProjectId, latestSuccess.id)
        ) {
          try {
            const reportData = JSON.parse(reportPreviewResult.value.data.data.text)
            nextReportQuality = normalizeReportQuality(reportData.reportQuality)
          } catch {
            nextReportQuality = null
          }
        } else {
          nextReportQuality = null
        }

        if (!overviewArtifact) {
          nextOverviewError = '未找到架构概览数据'
          nextOverview = null
          nextFileTree = null
          commitOverview = true
        } else if (overviewPreviewResult.status === 'rejected') {
          nextOverviewError = formatApiError(overviewPreviewResult.reason, '加载总览数据失败')
        } else if (
          !overviewPreviewResult.value
          || !isArtifactPreviewOwnedByScan(overviewPreviewResult.value.data.data.record, overviewArtifact, ownerProjectId, latestSuccess.id)
        ) {
          nextOverviewError = '架构概览归属校验失败，已拒绝应用响应。'
        } else {
          try {
            const data = JSON.parse(overviewPreviewResult.value.data.data.text)
            const normalizedOverview = normalizeProjectOverview(data)
            nextOverview = normalizedOverview.overview
            nextFileTree = normalizedOverview.fileTree
            commitOverview = true
          } catch (error) {
            nextOverviewError = formatApiError(error, '加载总览数据失败')
          }
        }
      }
    }

    if (!isCurrentDetail()) return
    if (nextCodeKnowledge !== undefined) setCodeKnowledge(nextCodeKnowledge)
    setCodeKnowledgeError(nextCodeKnowledgeError)
    if (nextArtifacts !== undefined) setLatestArtifacts(nextArtifacts)
    if (nextReportQuality !== undefined) setReportQuality(nextReportQuality)
    if (commitOverview) {
      setOverview(nextOverview ?? null)
      setFileTree(nextFileTree ?? null)
    }
    setOverviewError(nextOverviewError)
    setCodeKnowledgeLoading(false)
    setOverviewLoading(false)
    finishWorkspaceSync(detailSyncToken)
    finishFullRefresh()
  }, [projectId])

  const loadRepos = useCallback(() => loadWorkspace(), [loadWorkspace])
  const loadScans = useCallback((silent = false) => loadWorkspace({ silent, includeDetails: !silent }), [loadWorkspace])
  const loadOverview = useCallback(() => loadWorkspace({ includeDetails: true }), [loadWorkspace])

  const handleWorkspaceTabChange = (key: string) => {
    const nextParams = new URLSearchParams(searchParams)
    if (key === 'overview') {
      nextParams.delete('tab')
      nextParams.delete('question')
      loadOverview()
    } else {
      nextParams.set('tab', key)
      if (key !== 'qa') {
        nextParams.delete('question')
      }
    }
    if (key !== 'qa') {
      REPORT_EVIDENCE_QUERY_PARAMS.forEach(param => nextParams.delete(param))
    }
    setSearchParams(nextParams, { replace: true })
  }

  useEffect(() => {
    const routeGeneration = projectGenerationRef.current + 1
    projectGenerationRef.current = routeGeneration
    coreRequestSeqRef.current += 1
    detailRequestSeqRef.current += 1
    fullRefreshOwnerRef.current = null
    workspaceSyncOwnerRef.current = null
    trustedSnapshotProjectIdRef.current = null
    detailScanTaskIdRef.current = null
    setTrustedSnapshotProjectId(null)
    setWorkspacePhase('INITIAL_LOADING')
    setWorkspaceSyncing(false)
    setProject(null)
    setRepos([])
    setScans([])
    setScanExecutions({})
    setProjectError(null)
    setRepoError(null)
    setScanError(null)
    setLoadingRepos(true)
    setLoadingScans(true)
    setLatestScanTaskId(null)
    setOverview(null)
    setFileTree(null)
    setOverviewError(null)
    setLatestArtifacts([])
    setReportQuality(null)
    setCodeKnowledge(null)
    setCodeKnowledgeLoading(false)
    setCodeKnowledgeError(null)
    setOverviewLoading(false)
    setRepoModalOpen(false)
    setGithubAppModalOpen(false)
    setSelectedRepo(null)
    setCreatingScan(null)
    setCancellingScan(null)
    repoForm.resetFields()
    githubAppForm.resetFields()
    void loadWorkspace()

    return () => {
      if (projectGenerationRef.current === routeGeneration) {
        projectGenerationRef.current += 1
      }
      coreRequestSeqRef.current += 1
      detailRequestSeqRef.current += 1
      fullRefreshOwnerRef.current = null
      workspaceSyncOwnerRef.current = null
    }
  }, [githubAppForm, loadWorkspace, projectId, repoForm])

  const activeScanCount = scans.filter(scan => scan.status === 'RUNNING' || scan.status === 'PENDING').length

  useEffect(() => {
    if (activeScanCount <= 0) return undefined
    let cancelled = false
    let timer: number | undefined
    const schedule = () => {
      if (!cancelled) timer = window.setTimeout(poll, 3000)
    }
    const poll = async () => {
      if (cancelled) return
      if (fullRefreshOwnerRef.current !== null) {
        schedule()
        return
      }
      try {
        await loadScans(true)
      } finally {
        schedule()
      }
    }
    schedule()
    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [activeScanCount, loadScans])

  const isProjectOperationCurrent = (ownerProjectId: number, generation: number) => (
    activeProjectIdRef.current === ownerProjectId
    && projectGenerationRef.current === generation
  )

  const handleAddRepo = async () => {
    const ownerProjectId = projectId
    const generation = projectGenerationRef.current
    try {
      const values = await repoForm.validateFields()
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      const response = await repositoryApi.add(ownerProjectId, values)
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      if (Number(response.data.data?.projectId) !== ownerProjectId) {
        message.error('仓库响应归属校验失败，未应用页面更新')
        return
      }
      message.success('仓库添加成功')
      setRepoModalOpen(false)
      repoForm.resetFields()
      void loadRepos()
    } catch (error: any) {
      if (error?.errorFields) return
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      showApiError(error, '仓库添加失败')
    }
  }

  const handleDeleteRepo = async (repoId: number) => {
    const ownerProjectId = projectId
    const generation = projectGenerationRef.current
    const ownedRepository = repos.find(repo => repo.id === repoId && Number(repo.projectId) === ownerProjectId)
    if (
      trustedSnapshotProjectIdRef.current !== ownerProjectId
      || !ownedRepository
      || !isProjectOperationCurrent(ownerProjectId, generation)
    ) {
      message.error('仓库不属于当前可信项目快照，已阻止删除')
      return
    }
    try {
      await repositoryApi.delete(repoId)
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      message.success('仓库已删除')
      void loadRepos()
    } catch (error) {
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      showApiError(error, '仓库删除失败')
    }
  }

  const openGitHubAppModal = async (repo: Repository) => {
    const ownerProjectId = projectId
    const generation = projectGenerationRef.current
    if (Number(repo.projectId) !== ownerProjectId) return
    setSelectedRepo(repo)
    githubAppForm.resetFields()
    if (repo.authType === 'GITHUB_APP') {
      try {
        const res = await repositoryApi.getGitHubAppInstallation(repo.id)
        if (!isProjectOperationCurrent(ownerProjectId, generation)) return
        const installation = res.data.data
        if (Number(installation?.projectId) !== ownerProjectId || Number(installation?.repositoryId) !== repo.id) {
          message.error('GitHub App installation 归属校验失败')
          setSelectedRepo(null)
          return
        }
        githubAppForm.setFieldsValue({
          installationId: installation.installationId,
          accountLogin: installation.accountLogin,
          accountType: installation.accountType,
          repositorySelection: installation.repositorySelection,
          permissionsJson: installation.permissionsJson,
        })
      } catch (error) {
        if (!isProjectOperationCurrent(ownerProjectId, generation)) return
        showApiError(error, '加载 GitHub App installation 失败')
        githubAppForm.setFieldsValue({ accountLogin: repo.owner })
      }
    } else {
      githubAppForm.setFieldsValue({ accountLogin: repo.owner, accountType: 'Organization', repositorySelection: 'selected' })
    }
    if (!isProjectOperationCurrent(ownerProjectId, generation)) return
    setGithubAppModalOpen(true)
  }

  const handleBindGitHubApp = async () => {
    if (!selectedRepo || Number(selectedRepo.projectId) !== projectId) return
    const ownerProjectId = projectId
    const generation = projectGenerationRef.current
    const repositoryId = selectedRepo.id
    try {
      const values = await githubAppForm.validateFields()
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      const response = await repositoryApi.bindGitHubAppInstallation(repositoryId, values)
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      const installation = response.data.data
      if (Number(installation?.projectId) !== ownerProjectId || Number(installation?.repositoryId) !== repositoryId) {
        message.error('GitHub App installation 归属校验失败')
        return
      }
      message.success('GitHub App installation 已绑定')
      setGithubAppModalOpen(false)
      setSelectedRepo(null)
      githubAppForm.resetFields()
      void loadRepos()
    } catch (error: any) {
      if (error?.errorFields) return
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      showApiError(error, '绑定 GitHub App installation 失败')
    }
  }

  const handleDisableGitHubApp = async () => {
    if (!selectedRepo || Number(selectedRepo.projectId) !== projectId) return
    const ownerProjectId = projectId
    const generation = projectGenerationRef.current
    try {
      await repositoryApi.disableGitHubAppInstallation(selectedRepo.id)
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      message.success('GitHub App installation 已禁用')
      setGithubAppModalOpen(false)
      setSelectedRepo(null)
      githubAppForm.resetFields()
      void loadRepos()
    } catch (error) {
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      showApiError(error, '禁用 GitHub App installation 失败')
    }
  }

  const handleCreateScan = async (repo: Repository) => {
    const ownerProjectId = projectId
    const generation = projectGenerationRef.current
    if (Number(repo.projectId) !== ownerProjectId) return
    setCreatingScan(repo.id)
    try {
      const response = await scanTaskApi.create(repo.id, { projectId: ownerProjectId })
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      const createdScan = response.data.data
      if (Number(createdScan?.projectId) !== ownerProjectId || Number(createdScan?.repositoryId) !== repo.id) {
        message.error('扫描任务归属校验失败，未应用页面更新')
        return
      }
      message.success('扫描任务已创建')
      void loadScans()
    } catch (error) {
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      showApiError(error, '创建扫描任务失败')
    } finally {
      if (isProjectOperationCurrent(ownerProjectId, generation)) setCreatingScan(null)
    }
  }

  const handleCancelScan = async (scanTaskId: number) => {
    const ownerProjectId = projectId
    const generation = projectGenerationRef.current
    const ownedScan = scans.find(scan => scan.id === scanTaskId && Number(scan.projectId) === ownerProjectId)
    if (
      trustedSnapshotProjectIdRef.current !== ownerProjectId
      || !ownedScan
      || !isProjectOperationCurrent(ownerProjectId, generation)
    ) {
      message.error('扫描任务不属于当前可信项目快照，已阻止取消')
      return
    }
    setCancellingScan(scanTaskId)
    try {
      const response = await scanTaskApi.cancel(scanTaskId)
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      if (Number(response.data.data?.projectId) !== ownerProjectId || Number(response.data.data?.id) !== scanTaskId) {
        message.error('扫描任务归属校验失败，未应用页面更新')
        return
      }
      message.success('扫描任务已取消')
      void loadScans()
    } catch (error) {
      if (!isProjectOperationCurrent(ownerProjectId, generation)) return
      showApiError(error, '取消扫描任务失败')
    } finally {
      if (isProjectOperationCurrent(ownerProjectId, generation)) setCancellingScan(null)
    }
  }

  const hasTrustedSnapshot = trustedSnapshotProjectId === projectId && Number(project?.id) === projectId
  const workspaceViewState: ProjectWorkspaceViewState = hasTrustedSnapshot
    ? workspacePhase === 'STALE_REFRESH' ? 'STALE_REFRESH' : 'READY'
    : workspacePhase === 'FATAL_LOAD' ? 'FATAL_LOAD' : 'INITIAL_LOADING'
  const coreErrorSummary = [projectError, repoError, scanError].filter(Boolean).join('；')

  if (workspaceViewState === 'INITIAL_LOADING') {
    return (
      <div
        className="sl-project-first-viewport-state"
        data-sl-project-state="INITIAL_LOADING"
        data-sl-project-id={projectId}
        aria-busy="true"
      >
        <StateBlock
          tone="loading"
          title="正在确认项目工作区"
          description="正在读取项目、仓库和扫描三个核心数据源；全部确认前不会展示业务动作或 0 数据结论。"
        />
      </div>
    )
  }

  if (workspaceViewState === 'FATAL_LOAD') {
    return (
      <div
        className="sl-project-first-viewport-state"
        data-sl-project-state="FATAL_LOAD"
        data-sl-project-id={projectId}
        aria-busy={workspaceSyncing}
      >
        <StateBlock
          tone="error"
          title="项目工作区加载失败"
          description={coreErrorSummary || '项目核心数据源不可用，当前没有可继续使用的可信快照。'}
          action={(
            <ActionButton
              type="primary"
              icon={<ReloadOutlined />}
              loading={workspaceSyncing}
              onClick={() => void loadWorkspace({ includeDetails: true })}
              label="重新加载项目工作区"
            />
          )}
        />
      </div>
    )
  }

  const statusColor: Record<string, string> = {
    SUCCESS: 'success', FAILED: 'error', RUNNING: 'processing', PENDING: 'warning', CANCELLED: 'default',
  }
  const latestSuccessScan = scans.find(scan => scan.status === 'SUCCESS')
  const latestScan = scans[0]
  const latestExecution = latestScan ? scanExecutions[latestScan.id] : undefined
  const primaryRepo = repos.find(repo => repo.status === 'ACTIVE' || repo.status === 'READY') || repos[0] || null
  const failedScanCount = scans.filter(scan => scan.status === 'FAILED').length
  const successScanCount = scans.filter(scan => scan.status === 'SUCCESS').length
  const repositoryReadyCount = repos.filter(repo => repo.status === 'ACTIVE' || repo.status === 'READY').length
  const latestScanProgress = latestExecution?.progress ?? (latestScan ? scanStatusProgress(latestScan.status) : 0)
  const codeKnowledgeStatus = buildProjectCodeKnowledgeStatus(
    codeKnowledge,
    codeKnowledgeLoading,
    codeKnowledgeError,
    knowledgeScanTaskId
  )
  const analysisReadiness = buildAnalysisReadinessSignal({
    activeScanCount,
    codeKnowledgeStatus,
    latestArtifacts,
    latestScan,
    latestSuccessScan,
    overview,
    reportQuality,
  })
  const reportAgentFlowReady = analysisReadiness.tone === 'ready'
  const reportAgentFlowValue = latestSuccessScan ? (reportAgentFlowReady ? 'Ready' : 'Review') : '-'
  const reportAgentFlowMeta = latestSuccessScan
    ? reportAgentFlowReady
      ? '报告、图谱、RAG 可用'
      : analysisReadiness.nextAction
      : '等待产物生成'

  const handlePrimaryScan = () => {
    if (primaryRepo) {
      void handleCreateScan(primaryRepo)
    } else {
      repoForm.resetFields()
      setRepoModalOpen(true)
    }
  }
  const workspaceNextAction = buildProjectWorkspaceNextAction({
    activeScanCount,
    analysisReadiness,
    codeKnowledgeStatus,
    latestScan,
    latestSuccessScan,
    primaryRepo,
    repos,
    scans,
    staleRefreshError: workspaceViewState === 'STALE_REFRESH' ? coreErrorSummary : null,
  })
  const workspacePrimaryLoading = workspaceNextAction.key === 'STALE_REFRESH'
    ? workspaceSyncing
    : workspaceNextAction.key === 'START_SCAN' && primaryRepo
      ? creatingScan === primaryRepo.id
      : false
  const projectTrustedLoop: ProjectTrustedLoopStep[] = [
    {
      key: 'f1-analysis',
      index: 'F1',
      title: '首次可信仓库分析',
      owner: 'Developer Workbench',
      value: latestSuccessScan ? `Scan #${latestSuccessScan.id}` : repositoryReadyCount > 0 ? '待扫描' : '待接入',
      description: latestSuccessScan
        ? '仓库、扫描和报告入口已形成，可进入报告复盘或 QA。'
        : repositoryReadyCount > 0
          ? '已有仓库，下一步应触发扫描形成报告证据。'
          : '还没有可扫描仓库，主链路尚未启动。',
      tone: latestSuccessScan ? 'ready' : repositoryReadyCount > 0 ? 'attention' : 'idle',
      actionLabel: latestSuccessScan ? '打开报告' : repositoryReadyCount > 0 ? '触发扫描' : '接入仓库',
      onAction: () => {
        if (latestSuccessScan) navigate(`/scan-tasks/${latestSuccessScan.id}`)
        else if (repositoryReadyCount > 0) handlePrimaryScan()
        else {
          repoForm.resetFields()
          setRepoModalOpen(true)
        }
      },
    },
    {
      key: 'f2-code-understanding',
      index: 'F2',
      title: '源码级理解',
      owner: 'Developer Workbench',
      value: codeKnowledgeStatus.totalChunks > 0 ? `${codeKnowledgeStatus.value} chunks` : codeKnowledgeStatus.value,
      description: codeKnowledgeStatus.totalChunks > 0
        ? 'code_chunks 已可用于带引用的代码问答和跨文件检索。'
        : '代码问答仍缺稳定切片证据，先检查扫描产物和 chunk_code 阶段。',
      tone: codeKnowledgeStatus.totalChunks > 0 ? 'ready' : latestSuccessScan ? 'attention' : 'idle',
      actionLabel: codeKnowledgeStatus.totalChunks > 0 ? '进入 QA' : '检查证据',
      onAction: () => {
        if (codeKnowledgeStatus.totalChunks > 0) handleWorkspaceTabChange('qa')
        else if (latestSuccessScan) navigate(`/scan-tasks/${latestSuccessScan.id}`)
        else handleWorkspaceTabChange('scans')
      },
    },
    {
      key: 'f4-repair-candidate',
      index: 'F4',
      title: 'Issue 到修复候选',
      owner: 'Developer Workbench',
      value: reportAgentFlowReady ? '可进入' : latestSuccessScan ? '需复核' : '未就绪',
      description: reportAgentFlowReady
        ? '报告、核心产物和代码知识库已具备修复候选前置证据。'
        : '修复候选必须绑定成功扫描、报告证据和 code_chunks，不能直接跳过复核。',
      tone: reportAgentFlowReady ? 'ready' : latestSuccessScan ? 'attention' : 'idle',
      actionLabel: reportAgentFlowReady ? '查看修复候选' : '打开报告',
      onAction: () => {
        if (reportAgentFlowReady) navigate(`/auto-repairs?projectId=${projectId}`)
        else if (latestSuccessScan) navigate(`/scan-tasks/${latestSuccessScan.id}`)
        else handleWorkspaceTabChange('scans')
      },
    },
    {
      key: 'f5-audit',
      index: 'F5',
      title: '安全与审计',
      owner: 'Admin & Security',
      value: latestSuccessScan ? '可追踪' : '等待证据',
      description: latestSuccessScan
        ? '当前项目已有扫描上下文，可进入审计日志复核关键操作和工具调用。'
        : '审计链路需要先产生仓库、扫描或自动化操作记录。',
      tone: latestSuccessScan ? 'ready' : 'idle',
      actionLabel: '打开审计',
      onAction: () => navigate(`/audit-logs?projectId=${projectId}`),
    },
  ]

  const handleWorkspacePrimaryAction = () => {
    if (workspaceNextAction.key === 'STALE_REFRESH') {
      void loadWorkspace({ includeDetails: true })
      return
    }
    if (workspaceNextAction.key === 'ADD_REPOSITORY') {
      repoForm.resetFields()
      setRepoModalOpen(true)
      return
    }
    if (workspaceNextAction.key === 'START_SCAN') {
      handlePrimaryScan()
      return
    }
    if (workspaceNextAction.key === 'WATCH_SCAN' || workspaceNextAction.key === 'REVIEW_FAILED_SCAN') {
      if (latestScan) navigate(`/scan-tasks/${latestScan.id}`)
      return
    }
    if (workspaceNextAction.key === 'OPEN_ARTIFACTS') {
      if (latestScanTaskId) navigate(`/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${latestScanTaskId}`)
      return
    }
    if (workspaceNextAction.key === 'OPEN_QA') {
      handleWorkspaceTabChange('qa')
    }
  }

  const handleWorkspaceSecondaryAction = () => {
    if (workspaceNextAction.key === 'ADD_REPOSITORY' || workspaceNextAction.key === 'START_SCAN') {
      handleWorkspaceTabChange('repos')
      return
    }
    if (workspaceNextAction.key === 'WATCH_SCAN') {
      handleWorkspaceTabChange('scans')
      return
    }
    if (workspaceNextAction.key === 'REVIEW_FAILED_SCAN') {
      handlePrimaryScan()
      return
    }
    if (workspaceNextAction.key === 'OPEN_ARTIFACTS') {
      if (latestSuccessScan) navigate(`/scan-tasks/${latestSuccessScan.id}`)
      return
    }
    if (workspaceNextAction.key === 'OPEN_QA') {
      if (latestSuccessScan) navigate(`/scan-tasks/${latestSuccessScan.id}`)
    }
  }

  return (
    <div data-sl-project-state={workspaceViewState} data-sl-project-id={projectId}>
      <div className="sl-project-cockpit" aria-busy={workspaceSyncing}>
        <section className="sl-project-cockpit-main">
          <div className="sl-kicker">Project Workspace</div>
          <h1 className="sl-project-cockpit-title">{project?.name || '加载中...'}</h1>
          <p className="sl-project-cockpit-desc">
            {project?.description || '仓库接入、扫描执行、代码切片、架构报告和代码问答的统一工作台。'}
          </p>
          <div className="sl-project-cockpit-status">
            <span className={`sl-live-dot ${activeScanCount > 0 ? 'sl-live-dot-running' : ''}`} />
            <span>{activeScanCount > 0 ? `${activeScanCount} 个扫描任务运行中` : '分析主链路待命'}</span>
            <span>{repos.length} repos</span>
            <span>{scans.length} scans</span>
            {latestScanTaskId && <span>knowledge source #{latestScanTaskId}</span>}
          </div>
          <ProjectWorkspaceNextActionRail
            action={workspaceNextAction}
            primaryLoading={workspacePrimaryLoading}
            onPrimary={handleWorkspacePrimaryAction}
            onSecondary={handleWorkspaceSecondaryAction}
          />
        </section>

        <section className="sl-project-cockpit-side">
          <div className="sl-project-cockpit-side-head">
            <div>
              <span>Latest analysis</span>
              <strong>{latestScan ? `Scan #${latestScan.id}` : '暂无扫描'}</strong>
            </div>
            <IconActionButton
              label="刷新项目、仓库、扫描和总览数据"
              tooltip="刷新全部"
              icon={<ReloadOutlined spin={workspaceSyncing} />}
              onClick={() => void loadWorkspace({ includeDetails: true })}
            />
          </div>
          {workspaceViewState === 'STALE_REFRESH' && (
            <Alert
              type="error"
              showIcon
              message="项目数据同步失败，正在使用上次可信快照"
              description={coreErrorSummary}
            />
          )}
          {latestScan ? (
            <>
              <Progress
                percent={latestScanProgress}
                status={latestScan.status === 'FAILED' ? 'exception' : latestScan.status === 'SUCCESS' ? 'success' : 'active'}
              />
              <div className="sl-project-latest-grid">
                <div>
                  <span>状态</span>
                  <strong>{formatStatusLabel(latestScan.status)}</strong>
                </div>
                <div>
                  <span>分支</span>
                  <strong>{latestScan.branch || '-'}</strong>
                </div>
                <div>
                  <span>Commit</span>
                  <strong>{latestScan.commitSha ? latestScan.commitSha.substring(0, 8) : '-'}</strong>
                </div>
                <div>
                  <span>阶段</span>
                  <strong>{formatStepLabel(latestExecution?.currentStep)}</strong>
                </div>
              </div>
              <ActionButton block icon={<FileTextOutlined />} onClick={() => navigate(`/scan-tasks/${latestScan.id}`)} label="打开扫描详情" />
            </>
          ) : (
            <div className="sl-project-empty-state">接入公开仓库后即可触发第一次逆向分析。</div>
          )}
        </section>
      </div>

      <div className="sl-project-flow-grid" aria-label="项目主链路状态">
        <ProjectFlowStage icon={<BranchesOutlined />} label="仓库接入" value={`${repositoryReadyCount}/${repos.length}`} meta={primaryRepo ? `${primaryRepo.owner}/${primaryRepo.name}` : '等待接入'} tone={repositoryReadyCount > 0 ? 'ready' : 'idle'} />
        <ProjectFlowStage icon={<CheckCircleOutlined />} label="扫描闭环" value={successScanCount} meta={failedScanCount > 0 ? `${failedScanCount} 次失败待复盘` : `${scans.length} 次扫描记录`} tone={failedScanCount > 0 ? 'attention' : successScanCount > 0 ? 'ready' : 'idle'} />
        <ProjectFlowStage icon={<CodeOutlined />} label="code_chunks" value={codeKnowledgeStatus.value} meta={codeKnowledgeStatus.meta} tone={codeKnowledgeStatus.flowTone} />
        <ProjectFlowStage icon={<FileTextOutlined />} label="报告/Agent" value={reportAgentFlowValue} meta={reportAgentFlowMeta} tone={reportAgentFlowReady ? 'ready' : latestSuccessScan ? 'attention' : 'idle'} />
      </div>

      <ProjectTrustedLoopPanel steps={projectTrustedLoop} />

      <AnalysisReadinessPanel
        signal={analysisReadiness}
        onOpenArtifacts={() => latestScanTaskId && navigate(`/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${latestScanTaskId}`)}
        onOpenQa={() => handleWorkspaceTabChange('qa')}
        onOpenGraph={() => handleWorkspaceTabChange('graph')}
        onOpenScan={() => latestScan && navigate(`/scan-tasks/${latestScan.id}`)}
      />

      <Tabs className="sl-report-tabs" activeKey={activeWorkspaceTab} onChange={handleWorkspaceTabChange} items={[
        {
          key: 'overview',
          label: '项目总览',
          children: (
            <div>
              {overviewLoading ? (
                <StateBlock tone="loading" title="正在加载项目总览" description="系统正在读取最新架构概览和报告质量信息。" />
              ) : overviewError ? (
                <StateBlock
                  tone="error"
                  title="项目总览加载失败"
                  description={overviewError}
                  action={<ActionButton icon={<ReloadOutlined />} onClick={loadOverview} label="重新加载总览" />}
                />
              ) : overview ? (
                <>
                  <div className="sl-insight-grid">
                    <InsightMetric label="文件总数" value={overview.totalFiles.toLocaleString()} />
                    <InsightMetric label="代码行数" value={overview.totalLines.toLocaleString()} />
                    <InsightMetric label="目录数" value={overview.totalDirs.toLocaleString()} />
                    <InsightMetric label="框架" value={overview.framework?.name || '-'} />
                    <InsightMetric label="Controller" value={overview.controllers.toLocaleString()} />
                    <InsightMetric label="Service" value={overview.services.toLocaleString()} />
                    <InsightMetric label="Repository" value={overview.repositories.toLocaleString()} />
                    <InsightMetric label="Entity" value={overview.entities.toLocaleString()} />
                  </div>

                  {overview.languages.length > 0 && (
                    <Card className="sl-section-card" title={<span className="sl-card-title"><CodeOutlined /> 语言占比</span>} style={{ marginBottom: 18 }}>
                      {overview.languages.map((lang) => {
                        const totalLines = overview.languages.reduce((s, l) => s + l.line_count, 0)
                        const percent = totalLines > 0 ? Math.round((lang.line_count / totalLines) * 100) : 0
                        return (
                          <div key={lang.name} className="sl-language-row">
                            <div className="sl-language-meta">
                              <Typography.Text strong>{lang.name}</Typography.Text>
                              <Typography.Text type="secondary">{lang.file_count} 文件 / {lang.line_count.toLocaleString()} 行 / {percent}%</Typography.Text>
                            </div>
                            <Progress percent={percent} showInfo={false} strokeColor={getLangColor(lang.name)} />
                          </div>
                        )
                      })}
                    </Card>
                  )}

                  {fileTree && (
                    <Card className="sl-section-card" title={<span className="sl-card-title"><FileOutlined /> 入口文件</span>} style={{ marginBottom: 18 }}>
                      <div className="sl-entry-list">
                        {Array.isArray(fileTree) && fileTree.map((f: string, i: number) => (
                          <div className="sl-entry-item" key={i}><FileOutlined />{f}</div>
                        ))}
                        {typeof fileTree === 'object' && !Array.isArray(fileTree) && Object.entries(fileTree).map(([k, v]) => (
                          <div className="sl-entry-item" key={k}><FolderOutlined />{k}: {String(v)}</div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              ) : null}
            </div>
          ),
        },
        {
          key: 'repos',
          label: '仓库管理',
          children: (
            <div className="sl-workflow-tab">
              <div className="sl-workflow-tab-head">
                <div>
                  <div className="sl-kicker">Repository Intake</div>
                  <h2>仓库接入与扫描入口</h2>
                  <p>公开仓库可以直接接入并触发扫描；GitHub App 和私有仓库能力保留为高级集成层，不阻塞当前主链路。</p>
                </div>
                <ActionButton
                  aria-label="添加公开仓库"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => { repoForm.resetFields(); setRepoModalOpen(true) }}
                  label="添加仓库"
                />
              </div>
              {repoError && (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={repos.length > 0 ? '仓库列表刷新失败' : '仓库列表加载失败'}
                  description={repoError}
                  action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={loadRepos} label="重新加载仓库" />}
                />
              )}
              <Table
                className="sl-workflow-table sl-project-repository-table"
                dataSource={repos}
                rowKey="id"
                loading={loadingRepos}
                locale={{
                  emptyText: repoError ? (
                    <StateBlock
                      compact
                      tone="error"
                      title={repos.length > 0 ? '仓库列表刷新失败，已保留上次成功数据' : '仓库列表加载失败'}
                      description={repoError}
                      action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={loadRepos} label="重新加载仓库" />}
                    />
                  ) : (
                    <StateBlock compact title="暂无仓库" description="请先接入一个公开 GitHub 仓库。" />
                  ),
                }}
                pagination={{ pageSize: 8, showTotal: total => `共 ${total} 个仓库` }}
                scroll={{ x: 900 }}
                columns={[
                  {
                    title: '仓库',
                    key: 'fullName',
                    width: 300,
                    render: (_: any, r: Repository) => (
                      <Space direction="vertical" size={4}>
                        <Space size="small" wrap>
                          <Tag color="blue">{r.provider || 'GIT'}</Tag>
                          <Typography.Text strong>{r.owner}/{r.name}</Typography.Text>
                        </Space>
                        <Typography.Text type="secondary" className="sl-table-subtext" title={r.url}>
                          {r.url}
                        </Typography.Text>
                      </Space>
                    )
                  },
                  { title: '默认分支', dataIndex: 'defaultBranch', key: 'defaultBranch', width: 120 },
                  {
                    title: '认证',
                    dataIndex: 'authType',
                    key: 'authType',
                    width: 130,
                    render: (authType: string) => <Tag color={authTypeColor(authType)}>{authType || 'NONE'}</Tag>
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    width: 120,
                    render: (status: string) => <Tag color={repoStatusColor(status)}>{status || 'UNKNOWN'}</Tag>
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    width: 160,
                    render: (value: string) => formatDateTime(value),
                  },
                  {
                    title: '操作', key: 'action', width: 210,
                    render: (_: any, r: Repository) => (
                      <Space size="small">
                        <IconActionButton
                          label={`扫描仓库 ${r.owner}/${r.name}`}
                          tooltip="触发扫描"
                          size="small"
                          icon={<SearchOutlined />}
                          loading={creatingScan === r.id}
                          onClick={() => handleCreateScan(r)}
                        />
                        <IconActionButton
                          label={`配置 ${r.owner}/${r.name} 的 GitHub App`}
                          tooltip="GitHub App 高级集成"
                          size="small"
                          icon={<SafetyCertificateOutlined />}
                          onClick={() => openGitHubAppModal(r)}
                        />
                        <Popconfirm title="确认删除此仓库？" onConfirm={() => handleDeleteRepo(r.id)}>
                          <IconActionButton label={`删除仓库 ${r.owner}/${r.name}`} tooltip="删除仓库" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    )
                  },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'scans',
          label: '扫描任务',
          children: (
            <div className="sl-workflow-tab">
              <div className="sl-workflow-tab-head">
                <div>
                  <div className="sl-kicker">Scan Pipeline</div>
                  <h2>扫描任务与报告闭环</h2>
                  <p>从扫描任务进入执行详情、架构报告和产物库，形成可追踪的逆向分析链路。</p>
                </div>
                <Space wrap>
                  <ActionButton aria-label="刷新扫描任务" icon={<ReloadOutlined />} onClick={() => loadScans()} label="刷新" />
                  {activeScanCount > 0 && <Tag color="processing">自动刷新中</Tag>}
                </Space>
              </div>
              {scanError && (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={scans.length > 0 ? '扫描任务刷新失败' : '扫描任务加载失败'}
                  description={scanError}
                  action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={() => loadScans()} label="重新加载扫描任务" />}
                />
              )}
              <div className="sl-scan-summary-grid">
                <ScanSummary label="扫描总数" value={scans.length} />
                <ScanSummary label="成功扫描" value={successScanCount} />
                <ScanSummary label="失败扫描" value={failedScanCount} />
                <ScanSummary label="活跃扫描" value={activeScanCount} />
              </div>
              <Table
                className="sl-workflow-table sl-project-scan-table"
                dataSource={scans}
                rowKey="id"
                loading={loadingScans}
                locale={{
                  emptyText: scanError ? (
                    <StateBlock
                      compact
                      tone="error"
                      title={scans.length > 0 ? '扫描任务刷新失败，已保留上次成功数据' : '扫描任务加载失败'}
                      description={scanError}
                      action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={() => loadScans()} label="重新加载扫描任务" />}
                    />
                  ) : (
                    <StateBlock compact title="暂无扫描任务" description="请先在仓库管理中触发扫描。" />
                  ),
                }}
                pagination={{ pageSize: 10, showTotal: total => `共 ${total} 次扫描` }}
                scroll={{ x: 920 }}
                columns={[
                  {
                    title: '扫描',
                    key: 'scan',
                    width: 180,
                    render: (_: any, r: ScanTask) => (
                      <Space direction="vertical" size={4}>
                        <ActionButton
                          aria-label={`查看扫描 #${r.id} 报告`}
                          type="link"
                          className="sl-inline-link"
                          onClick={() => navigate(`/scan-tasks/${r.id}`)}
                          label={`扫描 #${r.id}`}
                        />
                        <Typography.Text type="secondary" className="sl-table-subtext">
                          {r.triggerType || 'MANUAL'} · {r.branch || '-'}
                        </Typography.Text>
                      </Space>
                    )
                  },
                  { title: 'Commit', dataIndex: 'commitSha', key: 'commitSha', width: 110, render: (s: string) => s ? s.substring(0, 8) : '-' },
                  {
                    title: '当前步骤',
                    key: 'currentStep',
                    width: 150,
                    render: (_: any, r: ScanTask) => {
                      const execution = scanExecutions[r.id]
                      return execution?.currentStep ? formatStepLabel(execution.currentStep) : '-'
                    }
                  },
                  {
                    title: '进度',
                    key: 'progress',
                    width: 130,
                    render: (_: any, r: ScanTask) => {
                      const execution = scanExecutions[r.id]
                      const percent = execution?.progress ?? scanStatusProgress(r.status)
                      return (
                        <Progress
                          percent={percent}
                          size="small"
                          status={r.status === 'FAILED' ? 'exception' : r.status === 'SUCCESS' ? 'success' : 'active'}
                        />
                      )
                    }
                  },
                  {
                    title: '状态', dataIndex: 'status', key: 'status',
                    width: 110,
                    render: (s: string) => <Tag color={statusColor[s]}>{formatStatusLabel(s)}</Tag>
                  },
                  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: formatDateTime },
                  { title: '操作', key: 'action', width: 180,
                    render: (_: any, r: ScanTask) => {
                      const execution = scanExecutions[r.id]
                      return (
                        <Space size="small">
                          <IconActionButton
                            label={`查看扫描 #${r.id} 报告`}
                            tooltip="查看报告"
                            size="small"
                            icon={<FileTextOutlined />}
                            onClick={() => navigate(`/scan-tasks/${r.id}`)}
                          />
                          {execution && (
                            <IconActionButton
                              label={`查看扫描 #${r.id} 的执行详情`}
                              tooltip="执行详情"
                              size="small"
                              icon={<ScheduleOutlined />}
                              onClick={() => navigate(`/execution-tasks?projectId=${projectId}&taskId=${execution.id}`)}
                            />
                          )}
                          {r.status === 'SUCCESS' && (
                            <ArtifactLinkButton
                              projectId={projectId}
                              ownerType="SCAN_TASK"
                              ownerId={r.id}
                            />
                          )}
                          {(r.status === 'PENDING' || r.status === 'RUNNING') && (
                            <Popconfirm
                              title="取消扫描任务"
                              description="当前步骤会在下一个检查点停止。"
                              okText="取消任务"
                              cancelText="返回"
                              onConfirm={() => handleCancelScan(r.id)}
                            >
                              <IconActionButton
                                label={`取消扫描 #${r.id}`}
                                tooltip="取消扫描"
                                size="small"
                                danger
                                icon={<StopOutlined />}
                                loading={cancellingScan === r.id}
                              />
                            </Popconfirm>
                          )}
                        </Space>
                      )
                    }
                  },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'qa',
          label: '代码问答(RAG)',
          children: (
            <CodeQaTab
              projectId={projectId}
              repositories={repos}
              scanTasks={scans}
              scanTaskId={knowledgeScanTaskId}
              knowledgeStatus={codeKnowledge}
              knowledgeLoading={codeKnowledgeLoading}
              knowledgeError={codeKnowledgeError}
              initialQuestion={requestedQuestion}
            />
          ),
        },
        {
          key: 'graph',
          label: '依赖图谱',
          children: knowledgeScanTaskId ? (
            <DependencyGraphView scanTaskId={knowledgeScanTaskId} />
          ) : (
            <StateBlock title="暂无依赖图谱" description="请先完成一次成功扫描以生成依赖图谱。" />
          ),
        },
      ]} />

      <Modal
        title="添加仓库"
        open={repoModalOpen}
        okText="添加"
        cancelText="取消"
        okButtonProps={{ 'aria-label': '添加仓库' }}
        cancelButtonProps={{ 'aria-label': '取消添加仓库' }}
        onOk={handleAddRepo}
        onCancel={() => setRepoModalOpen(false)}
      >
        <Form form={repoForm} layout="vertical">
          <Form.Item name="url" label="仓库 URL" rules={[{ required: true, message: '请输入 GitHub 仓库 URL' }]}>
            <Input placeholder="https://github.com/owner/repo" />
          </Form.Item>
          <Form.Item name="defaultBranch" label="默认分支">
            <Input placeholder="main" />
          </Form.Item>
          <Form.Item name="token" label="Access Token（可选）" extra="公开仓库无需填写。私有仓库和 GitHub App 深度集成作为高级集成层后置推进。">
            <Input.Password placeholder="公开仓库留空" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedRepo ? `GitHub App: ${selectedRepo.owner}/${selectedRepo.name}` : 'GitHub App'}
        open={githubAppModalOpen}
        onOk={handleBindGitHubApp}
        onCancel={() => setGithubAppModalOpen(false)}
        okText="绑定"
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space>
            {selectedRepo?.authType === 'GITHUB_APP' && (
              <Popconfirm title="禁用 GitHub App installation？" onConfirm={handleDisableGitHubApp}>
                <ActionButton danger label="禁用" />
              </Popconfirm>
            )}
            <CancelBtn />
            <OkBtn />
          </Space>
        )}
      >
        <Form form={githubAppForm} layout="vertical">
          <Form.Item name="installationId" label="Installation ID" rules={[{ required: true, message: '请输入 installation id' }]}>
            <InputNumber style={{ width: '100%' }} min={1} precision={0} placeholder="12345678" />
          </Form.Item>
          <Form.Item name="accountLogin" label="Account Login" rules={[{ required: true, message: '请输入 account login' }]}>
            <Input placeholder="owner-or-org" />
          </Form.Item>
          <Form.Item name="accountType" label="Account Type">
            <Input placeholder="Organization / User" />
          </Form.Item>
          <Form.Item name="repositorySelection" label="Repository Selection">
            <Input placeholder="selected / all" />
          </Form.Item>
          <Form.Item name="permissionsJson" label="Permissions JSON">
            <Input.TextArea rows={4} placeholder='{"contents":"read","pull_requests":"write"}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function isCodeKnowledgeOwnedByScan(response: CodeChunkSearchResponse | null | undefined, scanTaskId: number): response is CodeChunkSearchResponse {
  if (!response) return false
  if (Number(response.scanTaskId) !== scanTaskId) return false
  return (response.items || []).every(item => Number(item.scanTaskId) === scanTaskId)
}

function isArtifactOwnedByScan(artifact: ArtifactRecord, projectId: number, scanTaskId: number): boolean {
  return Number(artifact.projectId) === projectId
    && artifact.ownerType === 'SCAN_TASK'
    && Number(artifact.ownerId) === scanTaskId
}

function isArtifactPreviewOwnedByScan(
  previewRecord: ArtifactRecord,
  expectedRecord: ArtifactRecord,
  projectId: number,
  scanTaskId: number,
): boolean {
  return Number(previewRecord.id) === Number(expectedRecord.id)
    && isArtifactOwnedByScan(previewRecord, projectId, scanTaskId)
}

function normalizeProjectOverview(data: any): { overview: OverviewData; fileTree: any } {
  const rawLanguages = data?.languages
  const languages: LanguageStat[] = Array.isArray(rawLanguages)
    ? rawLanguages
    : rawLanguages && typeof rawLanguages === 'object'
      ? Object.entries(rawLanguages).map(([name, value]: [string, any]) => ({
          name,
          file_count: value?.file_count ?? 0,
          line_count: value?.line_count ?? 0,
        }))
      : []

  return {
    overview: {
      languages,
      framework: data?.framework || null,
      totalFiles: data?.totalFiles || 0,
      totalDirs: data?.totalDirs || 0,
      totalLines: data?.totalLines || 0,
      controllers: data?.controllers || 0,
      services: data?.services || 0,
      repositories: data?.repositories || 0,
      entities: data?.entities || 0,
    },
    fileTree: data?.entryPoints || null,
  }
}

function getLangColor(name: string): string {
  const colors: Record<string, string> = {
    Java: '#b07219', JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Go: '#00ADD8', Rust: '#dea584', 'C++': '#f34b7d', C: '#555555', HTML: '#e34c26',
    CSS: '#563d7c', YAML: '#cb171e', XML: '#0060ac', JSON: '#292929', Markdown: '#083fa1',
    Shell: '#89e051', SQL: '#e38c00', PHP: '#4F5D95', Ruby: '#701516', Kotlin: '#A97BFF',
    Scala: '#c22d40', Swift: '#F05138', Dart: '#00B4AB', Vue: '#41b883', JSX: '#61dafb',
  }
  return colors[name] || '#8c8c8c'
}

function formatStepLabel(step?: string | null): string {
  const labels: Record<string, string> = {
    prepare_repository: '准备仓库',
    analyze_code: '代码逆向分析',
    chunk_code: '生成 code_chunks',
    finalize_scan: '收尾归档',
    clone_repository: '克隆仓库',
    generate_patch: '生成补丁',
    create_pull_request: '创建 PR',
    agent_analysis: 'Agent 分析',
    decompose_issue: '需求拆解',
    analyze_ci_failure: 'CI 诊断',
    analyze_pr_review: 'PR 审查',
    queued_pull_request: '等待 PR',
    cancelled: '已取消',
  }
  return step ? labels[step] || step : '-'
}

function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SUCCESS: '成功',
    FAILED: '失败',
    RUNNING: '运行中',
    PENDING: '排队中',
    CANCELLED: '已取消',
  }
  return labels[status] || status
}

function scanStatusProgress(status: string): number {
  if (status === 'SUCCESS') return 100
  if (status === 'FAILED' || status === 'CANCELLED') return 100
  if (status === 'RUNNING') return 45
  if (status === 'PENDING') return 8
  return 0
}

function repoStatusColor(status?: string | null): string {
  if (status === 'ACTIVE' || status === 'READY') return 'success'
  if (status === 'FAILED' || status === 'ERROR') return 'error'
  if (status === 'CLONING' || status === 'SYNCING') return 'processing'
  if (status === 'DISABLED' || status === 'DELETED') return 'default'
  return 'blue'
}

function authTypeColor(authType?: string | null): string {
  if (authType === 'GITHUB_APP') return 'green'
  if (authType === 'PAT') return 'blue'
  if (authType === 'NONE' || !authType) return 'default'
  return 'purple'
}

function formatDateTime(value?: string | null): string {
  return value ? new Date(value).toLocaleString() : '-'
}

function compactPath(path?: string | null): string {
  if (!path) return '-'
  const parts = path.split('/').filter(Boolean)
  if (parts.length <= 2) return path
  return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`
}

function evidenceLabel(type?: string | null): string {
  const labels: Record<string, string> = {
    CONTROLLER: 'Controller',
    SERVICE: 'Service',
    DATA_ACCESS: 'Data',
    DOMAIN_MODEL: 'Model',
    FRONTEND: 'Frontend',
    TEST: 'Test',
    DOCUMENTATION: 'Docs',
    CONFIG: 'Config',
    SOURCE: 'Source',
    OTHER: 'Other',
  }
  return type ? labels[type] || type : 'Other'
}

function evidenceColor(type?: string | null): string {
  const colors: Record<string, string> = {
    CONTROLLER: 'blue',
    SERVICE: 'green',
    DATA_ACCESS: 'purple',
    DOMAIN_MODEL: 'cyan',
    FRONTEND: 'geekblue',
    TEST: 'lime',
    DOCUMENTATION: 'default',
    CONFIG: 'gold',
    SOURCE: 'volcano',
    OTHER: 'default',
  }
  return type ? colors[type] || 'default' : 'default'
}

function retrievalModeLabel(mode?: string | null): string {
  const labels: Record<string, string> = {
    KEYWORD: '关键词召回',
    HYBRID: '混合召回',
    SEMANTIC_FALLBACK: '语义召回',
    STABLE_FALLBACK: '稳定回退',
    NO_SCAN: '未扫描',
    NO_CONTEXT: '无上下文',
  }
  return mode ? labels[mode] || mode : '关键词召回'
}

function retrievalModeColor(mode?: string | null): string {
  const colors: Record<string, string> = {
    KEYWORD: 'blue',
    HYBRID: 'green',
    SEMANTIC_FALLBACK: 'purple',
    STABLE_FALLBACK: 'default',
    NO_SCAN: 'default',
    NO_CONTEXT: 'orange',
  }
  return mode ? colors[mode] || 'default' : 'blue'
}

function readinessLabel(readiness?: string | null): string {
  const labels: Record<string, string> = {
    READY: '证据就绪',
    REVIEW: '需要复核',
    GAP: '证据缺口',
    IDLE: '等待扫描',
  }
  return readiness ? labels[readiness] || readiness : '证据质量'
}

function buildRagQualitySignal({
  retrievalMode,
  resultCount,
  displayedMatchedCount,
  totalChunks,
  embeddedChunks,
  embeddingCoverage,
  truncated,
  serverProfile,
}: {
  retrievalMode?: string | null
  resultCount: number
  displayedMatchedCount: number
  totalChunks: number
  embeddedChunks: number
  embeddingCoverage: number
  truncated: boolean
  serverProfile?: CodeChunkEvidenceProfile | null
}): RagQualitySignal {
  if (serverProfile) {
    const confidence = clampPercent(serverProfile.confidence)
    return {
      label: confidence >= 84
        ? '高可信'
        : confidence >= 64
          ? '可用'
          : confidence >= 42
            ? '需复核'
            : readinessLabel(serverProfile.readiness),
      tone: serverEvidenceTone(serverProfile.readiness, confidence),
      confidence,
      summary: serverProfile.summary || `${retrievalModeLabel(retrievalMode)} · ${resultCount} 条证据`,
      nextAction: serverProfile.nextAction || '建议打开引用文件复核关键路径后再采纳结论。',
      details: Array.isArray(serverProfile.details) && serverProfile.details.length > 0
        ? serverProfile.details
        : [`${totalChunks.toLocaleString()} 切片`, embeddedChunks > 0 ? `向量覆盖 ${embeddingCoverage}%` : '未生成向量'],
    }
  }

  if (retrievalMode === 'NO_SCAN') {
    return {
      label: '待扫描',
      tone: 'idle',
      confidence: 0,
      summary: '还没有可用扫描',
      nextAction: '先触发公开仓库扫描，成功后再进行代码问答。',
      details: ['未扫描', '无切片'],
    }
  }

  if (retrievalMode === 'NO_CONTEXT' || totalChunks <= 0) {
    return {
      label: '无上下文',
      tone: 'warning',
      confidence: 12,
      summary: '扫描未产出可检索代码切片',
      nextAction: '重新扫描并检查 analyzer 是否生成 code_chunks。',
      details: ['扫描可用', '0 切片'],
    }
  }

  if (resultCount <= 0) {
    return {
      label: '无命中',
      tone: 'warning',
      confidence: 18,
      summary: '当前问题没有找到直接证据',
      nextAction: '换用类名、函数名、路径或业务名重新检索。',
      details: [`${totalChunks.toLocaleString()} 切片`, `向量覆盖 ${embeddingCoverage}%`],
    }
  }

  const hitRatio = displayedMatchedCount > 0 ? Math.min(resultCount / displayedMatchedCount, 1) : 1
  const baseByMode: Record<string, number> = {
    HYBRID: 78,
    SEMANTIC_FALLBACK: 68,
    KEYWORD: 58,
    STABLE_FALLBACK: 38,
  }
  const base = baseByMode[retrievalMode || 'KEYWORD'] ?? 52
  const coverageBoost = Math.min(Math.round(embeddingCoverage / 5), 18)
  const hitBoost = Math.round(hitRatio * 12)
  const truncationPenalty = truncated ? 8 : 0
  const confidence = Math.max(5, Math.min(96, base + coverageBoost + hitBoost - truncationPenalty))

  const label = confidence >= 84
    ? '高可信'
    : confidence >= 64
      ? '可用'
      : confidence >= 42
        ? '需复核'
        : '低可信'
  const tone: QaSignalTone = confidence >= 76 ? 'ready' : confidence >= 42 ? 'warning' : 'idle'
  const modeText = retrievalMode ? retrievalModeLabel(retrievalMode) : '关键词召回'
  const vectorText = embeddedChunks > 0 ? `向量覆盖 ${embeddingCoverage}%` : '未生成向量'
  const nextAction = confidence >= 76
    ? '可基于当前证据继续追问实现细节或生成报告段落。'
    : retrievalMode === 'STABLE_FALLBACK'
      ? '当前只使用稳定回退证据，建议补充关键词或重新扫描。'
      : embeddingCoverage < 60
        ? '优先补齐 chunk embedding，提高语义召回稳定性。'
        : '建议打开引用文件复核关键路径后再采纳结论。'

  return {
    label,
    tone,
    confidence,
    summary: `${modeText} · ${resultCount} 条证据`,
    nextAction,
    details: [
      `${totalChunks.toLocaleString()} 切片`,
      vectorText,
      truncated ? '结果截断' : '完整结果',
    ],
  }
}

function buildQaStarterPrompts({
  knowledgeLoading,
  knowledgeError,
  scanTaskId,
  totalChunks,
  embeddedChunks,
  embeddingCoverage,
  retrievalMode,
  ragQuality,
}: {
  knowledgeLoading: boolean
  knowledgeError: string | null
  scanTaskId?: number | null
  totalChunks: number
  embeddedChunks: number
  embeddingCoverage: number
  retrievalMode?: string | null
  ragQuality: RagQualitySignal
}): QaStarterPrompt[] {
  if (knowledgeLoading) {
    return [
      {
        key: 'loading',
        label: '状态复核',
        prompt: '当前项目的 code_chunks 状态是否已经可用于代码问答？',
        reason: '等待最新扫描知识库状态返回',
        tone: 'idle',
      },
      ...DEFAULT_QA_STARTERS.slice(0, 2).map((prompt, index) => ({
        key: `default-loading-${index}`,
        label: index === 0 ? '调用链' : '数据模型',
        prompt,
        reason: '状态返回后可直接检索',
        tone: 'idle' as QaSignalTone,
      })),
    ]
  }

  if (knowledgeError) {
    return [
      {
        key: 'error',
        label: '接口异常',
        prompt: '为什么当前 code_chunks 检索接口不可用？请给出排查路径',
        reason: '优先处理知识库状态错误',
        tone: 'warning',
      },
      {
        key: 'fallback-report',
        label: '报告复盘',
        prompt: '在代码切片暂不可用时，本项目报告里还能复核哪些证据？',
        reason: '保留报告侧推进路径',
        tone: 'idle',
      },
    ]
  }

  if (totalChunks <= 0) {
    return [
      {
        key: 'missing-chunks',
        label: '切片缺失',
        prompt: scanTaskId
          ? `为什么扫描 #${scanTaskId} 没有生成 code_chunks？请定位可能的 analyzer 或落库问题`
          : '为什么当前项目没有生成 code_chunks？请定位扫描和落库链路',
        reason: 'RAG 问答前置依赖缺失',
        tone: 'warning',
      },
      {
        key: 'chunk-scope',
        label: '切片范围',
        prompt: '这个项目应该优先切分哪些目录、文件类型和入口代码？',
        reason: '确定后续扫描产物边界',
        tone: 'idle',
      },
      {
        key: 'scan-retry',
        label: '重扫准备',
        prompt: '重新扫描前需要检查哪些配置，才能确保代码切片可生成？',
        reason: '减少重复失败',
        tone: 'idle',
      },
    ]
  }

  if (embeddedChunks <= 0) {
    return [
      {
        key: 'keyword-context',
        label: '关键词证据',
        prompt: '当前代码问答会如何使用关键词 code_chunks 证据？请列出可复核文件',
        reason: `${totalChunks.toLocaleString()} 个切片可用，向量未生成`,
        tone: 'warning',
      },
      {
        key: 'core-flow',
        label: '调用链',
        prompt: DEFAULT_QA_STARTERS[0],
        reason: '关键词召回适合先查结构入口',
        tone: 'idle',
      },
      {
        key: 'embedding-next',
        label: '向量补齐',
        prompt: '哪些模块应该优先生成 embedding，以提升代码问答召回质量？',
        reason: '补齐语义检索能力',
        tone: 'idle',
      },
    ]
  }

  const vectorPrompt: QaStarterPrompt = embeddingCoverage >= 60
    ? {
      key: 'ready-core-flow',
      label: '核心链路',
      prompt: DEFAULT_QA_STARTERS[0],
      reason: `${retrievalModeLabel(retrievalMode)} · ${ragQuality.label}`,
      tone: 'ready',
    }
    : {
      key: 'partial-vector',
      label: '向量缺口',
      prompt: '哪些模块已有向量证据，哪些仍需要补齐 embedding？',
      reason: `向量覆盖 ${embeddingCoverage}%`,
      tone: 'warning',
    }

  return [
    vectorPrompt,
    {
      key: 'domain-model',
      label: '数据模型',
      prompt: DEFAULT_QA_STARTERS[1],
      reason: `${embeddedChunks.toLocaleString()}/${totalChunks.toLocaleString()} 个切片已向量化`,
      tone: embeddingCoverage >= 60 ? 'ready' : 'idle',
    },
    {
      key: 'stack-frame',
      label: '栈帧定位',
      prompt: DEFAULT_QA_STARTERS[3],
      reason: '可直接粘贴 file:line、Class#method 或浏览器 stack trace',
      tone: totalChunks > 0 ? 'ready' : 'idle',
    },
    {
      key: 'frontend-backend',
      label: '前后端映射',
      prompt: DEFAULT_QA_STARTERS[2],
      reason: '适合复核 API、页面和服务边界',
      tone: 'idle',
    },
  ]
}

function serverEvidenceTone(readiness?: string | null, confidence = 0): QaSignalTone {
  if (readiness === 'READY' || confidence >= 76) return 'ready'
  if (readiness === 'REVIEW' || readiness === 'GAP' || confidence >= 42) return 'warning'
  return 'idle'
}

function clampPercent(value?: number | null): number {
  if (!Number.isFinite(value ?? NaN)) return 0
  return Math.max(0, Math.min(100, Math.round(value as number)))
}

function parsePositiveInt(value?: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function normalizeEvidenceRef(ref: CodeQaEvidenceRef): CodeQaEvidenceRef | null {
  const normalized = Object.fromEntries(
    Object.entries(ref)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) =>
        (typeof value === 'string' && value.length > 0)
        || (typeof value === 'number' && Number.isFinite(value) && value > 0)
      )
  ) as CodeQaEvidenceRef
  return Object.keys(normalized).length > 0 ? normalized : null
}

function evidenceLineLabel(evidenceRef?: CodeQaEvidenceRef | null): string {
  return evidenceLineInfo(evidenceRef).label
}

function evidenceLineInfo(evidenceRef?: CodeQaEvidenceRef | null): {
  label: string
  kind: 'range' | 'single' | 'legacy' | 'none'
  metricLabel: string
  tagLabel: string
} {
  if (!evidenceRef) {
    return {
      label: '',
      kind: 'none',
      metricLabel: '行号',
      tagLabel: '行号缺失',
    }
  }
  const startLine = evidenceRef.startLine && evidenceRef.startLine > 0 ? evidenceRef.startLine : null
  const endLine = evidenceRef.endLine && evidenceRef.endLine > 0 ? evidenceRef.endLine : null
  if (startLine) {
    if (endLine && endLine > startLine) {
      return {
        label: `${startLine}-${endLine}`,
        kind: 'range',
        metricLabel: '行范围',
        tagLabel: `范围 ${startLine}-${endLine}`,
      }
    }
    return {
      label: String(startLine),
      kind: 'single',
      metricLabel: '行号',
      tagLabel: `行 ${startLine}`,
    }
  }
  if (evidenceRef.lineNumber) {
    return {
      label: evidenceRef.lineNumber,
      kind: 'legacy',
      metricLabel: '兼容行号',
      tagLabel: `兼容行 ${evidenceRef.lineNumber}`,
    }
  }
  return {
    label: '',
    kind: 'none',
    metricLabel: '行号',
    tagLabel: '行号缺失',
  }
}

function buildEvidenceBridgeSearchQuery(evidenceRef: CodeQaEvidenceRef | null, fallbackQuery: string): string {
  const safeEvidence = evidenceRef ? redactedEvidenceRefForOutput(evidenceRef) : null
  const lineLabel = evidenceLineLabel(safeEvidence)
  const fileAnchor = safeEvidence?.filePath
    ? lineLabel
      ? `${safeEvidence.filePath}:${lineLabel}`
      : safeEvidence.filePath
    : ''
  return [
    fileAnchor,
    safeEvidence?.title,
    safeEvidence?.source,
    safeEvidence?.category,
    safeEvidence?.summary,
    redactSensitiveText(fallbackQuery),
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900)
}

function buildEvidenceBridgeCopyText(scanTaskId: number | null | undefined, evidenceRef: CodeQaEvidenceRef): string {
  const safeEvidence = redactedEvidenceRefForOutput(evidenceRef)
  const lineLabel = evidenceLineLabel(safeEvidence)
  return [
    `scanTaskId: ${scanTaskId ?? '-'}`,
    `category: ${safeEvidence.category || '-'}`,
    `source: ${safeEvidence.source || '-'}`,
    `title: ${safeEvidence.title || '-'}`,
    `filePath: ${safeEvidence.filePath || '-'}`,
    `lineNumber: ${lineLabel || '-'}`,
    `startLine: ${safeEvidence.startLine ?? '-'}`,
    `endLine: ${safeEvidence.endLine ?? '-'}`,
    `summary: ${safeEvidence.summary || '-'}`,
  ].join('\n')
}

function redactedEvidenceRefForOutput(evidenceRef: CodeQaEvidenceRef): CodeQaEvidenceRef {
  return {
    category: evidenceRef.category ? redactSensitiveText(evidenceRef.category) : evidenceRef.category,
    source: evidenceRef.source ? redactSensitiveText(evidenceRef.source) : evidenceRef.source,
    title: evidenceRef.title ? redactSensitiveText(evidenceRef.title) : evidenceRef.title,
    summary: evidenceRef.summary ? redactSensitiveText(evidenceRef.summary) : evidenceRef.summary,
    filePath: evidenceRef.filePath ? redactSensitiveText(evidenceRef.filePath) : evidenceRef.filePath,
    lineNumber: evidenceRef.lineNumber ? redactSensitiveText(evidenceRef.lineNumber) : evidenceRef.lineNumber,
    startLine: evidenceRef.startLine,
    endLine: evidenceRef.endLine,
  }
}

function toChunkEvidenceProfile(profile: CodeChunkEvidenceProfile): ChunkEvidenceProfile {
  return {
    avgScore: profile.averageScore ?? 0,
    dominantEvidenceType: profile.dominantEvidenceType || 'OTHER',
    embeddedCount: profile.embeddedEvidenceCount ?? 0,
    evidenceTypeStats: profile.evidenceTypeStats || [],
    fileStats: profile.fileStats || [],
    lineSpan: profile.lineSpan ?? 0,
    lowConfidenceCount: profile.lowConfidenceCount ?? 0,
    topScore: profile.topScore ?? 0,
    uniqueFiles: profile.uniqueFiles ?? 0,
  }
}

function evidenceReason(chunk: CodeChunkSearchItem): string {
  const contextSuffix = isContextChunk(chunk) ? ' · 上下文补充' : ''
  if (chunk.evidenceReason) return `${redactSensitiveText(chunk.evidenceReason)}${contextSuffix}`
  const score = chunk.relevanceScore ?? 0
  const scoreText = score >= 80 ? '高相关' : score >= 45 ? '中相关' : score > 0 ? '弱相关' : '结构匹配'
  const terms = (chunk.matchedTerms || []).filter(Boolean)
  const termText = terms.length > 0 ? `命中 ${terms.slice(0, 4).join(' / ')}` : '通过路径、类型或结构信号命中'
  const vectorText = chunk.hasEmbedding ? '含向量证据' : '关键词证据'
  return redactSensitiveText(`${scoreText} · ${evidenceLabel(chunk.evidenceType)} · ${termText} · ${vectorText}${contextSuffix}`)
}

function chunkLineReference(chunk: CodeChunkSearchItem): string {
  const startLine = chunk.startLine || 1
  const endLine = chunk.endLine && chunk.endLine >= startLine ? chunk.endLine : startLine
  return `${chunk.filePath}:${startLine}-${endLine}`
}

function buildChunkFollowupQuestion(chunk: CodeChunkSearchItem): string {
  return `请基于 ${chunkLineReference(chunk)} 解释这段代码的职责、关键逻辑和潜在风险。`
}

function buildChunkDeepLink(projectId: number, chunk: CodeChunkSearchItem, questionText = chunkLineReference(chunk)): string {
  const params = new URLSearchParams()
  params.set('tab', 'qa')
  if (chunk.scanTaskId) params.set('scanTaskId', String(chunk.scanTaskId))
  params.set('question', questionText)
  return `${window.location.origin}/projects/${projectId}?${params.toString()}`
}

function buildCodeUnderstandingAgentHandoffUrl(
  projectId: number,
  chunk: CodeChunkSearchItem,
  querySignal: CodeUnderstandingQuerySignal,
  activeSourceScanTaskId?: number | null,
): string {
  const sourceScanTaskId = chunk.scanTaskId || activeSourceScanTaskId || null
  const safeFilePath = redactSensitiveText(chunk.filePath)
  const safeLineRef = redactSensitiveText(chunkLineReference(chunk))
  const safeSourceLabel = redactSensitiveText(chunk.sourceLabel || 'C1')
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('handoff', 'code-understanding')
  params.set('source', 'PROJECT_QA_CODE_UNDERSTANDING_LENS')
  params.set('inputKind', querySignal.kind)
  params.set('inputLabel', redactSensitiveText(querySignal.label))
  params.set('sourceLabel', safeSourceLabel)
  params.set('filePath', safeFilePath)
  params.set('lineRef', safeLineRef)
  params.set('contextRole', chunk.contextRole || (isContextChunk(chunk) ? 'ADJACENT_CONTEXT' : 'PRIMARY'))
  if (chunk.evidenceType) params.set('evidenceType', chunk.evidenceType)
  if (typeof chunk.relevanceScore === 'number') params.set('relevanceScore', String(chunk.relevanceScore))
  if (sourceScanTaskId) params.set('scanTaskId', String(sourceScanTaskId))
  return `/agent-chat?${params.toString()}`
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

function redactedChunkPreview(chunk: CodeChunkSearchItem): string {
  return redactSensitiveText(chunk.contentPreview || chunk.content || '')
}

function isContextChunk(chunk: CodeChunkSearchItem): boolean {
  return chunk.contextRole === 'ADJACENT_CONTEXT'
}

function contextRoleLabel(chunk: CodeChunkSearchItem): string {
  if (isContextChunk(chunk)) {
    return chunk.contextDistance && chunk.contextDistance > 1 ? `上下文 +${chunk.contextDistance}` : '上下文'
  }
  return '主证据'
}

function contextRoleColor(chunk: CodeChunkSearchItem): string {
  return isContextChunk(chunk) ? 'default' : 'green'
}

function groundingStatusLabel(status?: string | null): string {
  if (status === 'VERIFIED') return '引用已验证'
  if (status === 'PARTIAL') return '引用需复核'
  if (status === 'UNVERIFIED') return '回答未引用证据'
  if (status === 'NO_EVIDENCE') return '无代码证据'
  return '证据待确认'
}

function groundingStatusColor(status?: string | null): string {
  if (status === 'VERIFIED') return 'green'
  if (status === 'PARTIAL') return 'gold'
  if (status === 'UNVERIFIED' || status === 'NO_EVIDENCE') return 'red'
  return 'default'
}

function citationEnforcementLabel(status?: string | null): string {
  if (status === 'DIRECT_VERIFIED') return '首次引用已验证'
  if (status === 'RETRY_VERIFIED') return '引用已修正'
  if (status === 'FALLBACK_CITED') return '检索证据引用'
  if (status === 'RETRY_FAILED') return '引用需人工复核'
  if (status === 'UNVERIFIED') return '引用未验证'
  if (status === 'NO_EVIDENCE') return '无可用引用'
  return '引用策略记录'
}

function citationEnforcementColor(status?: string | null): string {
  if (status === 'DIRECT_VERIFIED' || status === 'RETRY_VERIFIED' || status === 'FALLBACK_CITED') return 'green'
  if (status === 'RETRY_FAILED' || status === 'UNVERIFIED' || status === 'NO_EVIDENCE') return 'red'
  return 'default'
}

function citationEnforcementReasonLabel(reason?: string | null): string {
  if (reason === 'DIRECT_VERIFIED') return '首次引用已验证'
  if (reason === 'RETRY_VERIFIED') return '重试后引用已验证'
  if (reason === 'FALLBACK_PRIMARY_CITED') return '检索主证据引用'
  if (reason === 'NO_EVIDENCE') return '无检索证据'
  if (reason === 'RETRY_CALL_FAILED') return '重试调用失败'
  if (reason === 'INVALID_LABEL') return '引用标签无效'
  if (reason === 'NO_AUDITABLE_CLAIM') return '无可审计主张'
  if (reason === 'CONTEXT_ONLY_CLAIM') return '仅上下文证据'
  if (reason === 'UNKNOWN_ONLY_CLAIM') return '未知证据角色'
  if (reason === 'UNCITED_REQUIRED_CLAIM') return '必需主张未引用'
  if (reason === 'NO_VALID_CITATION_LABEL') return '无有效引用标签'
  if (reason === 'NO_PRIMARY_CITATION') return '缺少主证据引用'
  if (reason === 'PRIMARY_BOUND_INCOMPLETE') return '主证据绑定不完整'
  if (reason === 'NOT_APPLICABLE') return '无需引用强制'
  return reason || '原因未返回'
}

function citationEnforcementReasonColor(reason?: string | null): string {
  if (reason === 'DIRECT_VERIFIED' || reason === 'RETRY_VERIFIED' || reason === 'FALLBACK_PRIMARY_CITED' || reason === 'NOT_APPLICABLE') return 'green'
  if (!reason) return 'default'
  return 'red'
}

function citationCoverageLabel(coverage?: CodeQaCitationCoverage): string {
  const total = coverage?.totalEvidenceCount ?? 0
  const cited = coverage?.citedEvidenceCount ?? 0
  const percent = coverage?.coveragePercent ?? 0
  const required = coverage?.requiredEvidenceCount ?? 0
  const citedRequired = coverage?.citedRequiredEvidenceCount ?? 0
  const requiredPercent = coverage?.requiredEvidenceCoveragePercent ?? 0
  if (required > 0 && (required !== total || requiredPercent !== percent)) {
    return `必需证据覆盖 ${citedRequired}/${required} (${requiredPercent}%)`
  }
  return `引用覆盖 ${cited}/${total} (${percent}%)`
}

function citationCoverageColor(coverage?: CodeQaCitationCoverage): string {
  if (!coverage || coverage.status === 'NO_EVIDENCE' || coverage.status === 'NONE') return 'red'
  if (coverage.status === 'FULL' || coverage.status === 'REQUIRED_FULL') return 'green'
  if (coverage.status === 'PARTIAL') return 'gold'
  return 'default'
}

function citationRepairCandidateLabel(coverage?: CodeQaCitationCoverage): string {
  return `可修复证据 ${coverage?.repairCandidateCount ?? 0}`
}

function successfulCitationEnforcement(status?: string | null): boolean {
  return status === 'DIRECT_VERIFIED' || status === 'RETRY_VERIFIED' || status === 'FALLBACK_CITED'
}

function sourceEvidenceMatchLabel(matchType?: string | null): string {
  if (matchType === 'REPORT_LINE_ANCHOR') return '行级锚点'
  if (matchType === 'REPORT_FILE_ANCHOR') return '文件锚点'
  if (matchType === 'NONE') return '未闭环'
  return '未闭环'
}

function normalizeSourceLocationPath(value?: string | null): string {
  if (!value) return ''
  return String(value)
    .trim()
    .replace(/\\/g, '/')
    .replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+\/+/i, '')
    .replace(/^webpack:\/\/\/?/i, '')
    .replace(/^file:\/\/\/?/i, '')
    .replace(/[?#].*$/, '')
    .replace(/:(\d+)(?::\d+)?$/, '')
    .replace(/^\/+/, '')
    .replace(/^\.\//, '')
}

function sourceLocationPathsMatch(sourcePath?: string | null, candidatePath?: string | null): boolean {
  const source = normalizeSourceLocationPath(sourcePath)
  const candidate = normalizeSourceLocationPath(candidatePath)
  if (!source || !candidate) return false
  return source === candidate || source.endsWith(`/${candidate}`) || candidate.endsWith(`/${source}`)
}

function sourceLocationFileName(value?: string | null): string {
  const normalized = normalizeSourceLocationPath(value)
  if (!normalized) return ''
  const parts = normalized.split('/').filter(Boolean)
  return parts[parts.length - 1] || normalized
}

function sourceLocationFileNameMatches(sourcePath?: string | null, candidatePath?: string | null): boolean {
  const source = sourceLocationFileName(sourcePath)
  const candidate = sourceLocationFileName(candidatePath)
  return Boolean(source && candidate && source === candidate)
}

function firstRelevantSourceCitation(msg: QaMessage, ref?: CodeQaEvidenceRef | null): CodeQaCitation | undefined {
  const citations = msg.answerCitations || []
  const cited = citations.filter(citation => citation.citedByAnswer === true && citation.filePath)
  return cited.find(citation => citation.contextRole !== 'ADJACENT_CONTEXT' && sourceLocationPathsMatch(ref?.filePath, citation.filePath))
    || cited.find(citation => sourceLocationPathsMatch(ref?.filePath, citation.filePath))
    || cited.find(citation => citation.contextRole !== 'ADJACENT_CONTEXT')
    || cited[0]
    || citations.find(citation => citation.filePath && sourceLocationPathsMatch(ref?.filePath, citation.filePath))
    || citations.find(citation => citation.filePath)
}

function qaSourceLocationConfidence(msg: QaMessage, ref: CodeQaEvidenceRef): QaSourceLocationConfidence {
  const hasFile = Boolean(ref.filePath)
  const lineInfo = evidenceLineInfo(ref)
  const lineLabel = lineInfo.label
  const hasLine = Boolean(lineLabel)
  const matched = msg.sourceEvidenceMatched === true
  const lineAnchored = msg.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR'
  const fileAnchored = msg.sourceEvidenceMatchType === 'REPORT_FILE_ANCHOR'
  const citedSourceFile = matched && Boolean(ref.filePath) && (msg.answerCitations || [])
    .some(citation => citation.citedByAnswer === true && sourceLocationPathsMatch(ref.filePath, citation.filePath))
  const candidateSourceFile = Boolean(ref.filePath) && (msg.answerCitations || [])
    .some(citation => sourceLocationPathsMatch(ref.filePath, citation.filePath))
  const coverage = msg.citationCoverage
  const requiredFileCount = Number(coverage?.requiredEvidenceFileCount || 0)
  const citedRequiredFileCount = Number(coverage?.citedRequiredEvidenceFileCount || 0)
  const requiredCoveragePercent = coverage?.requiredEvidenceCoveragePercent ?? coverage?.coveragePercent
  const requiredFileCoverage = requiredFileCount > 0 && citedRequiredFileCount >= requiredFileCount
  const ready = matched && lineAnchored && hasFile && hasLine && citedSourceFile
  const blocked = !hasFile || !matched || msg.sourceEvidenceMatchType === 'NONE'
  const tone: QaSourceLocationConfidence['tone'] = ready ? 'ready' : blocked ? 'blocked' : 'warning'
  const title = ready
    ? '来源定位可信'
    : blocked ? '来源定位未闭环' : '来源定位需复核'
  const summary = ready
    ? '报告证据文件、行号和回答引用已对齐，路径后缀已绑定；该信号只证明来源定位，不证明 LLM 事实语义正确。'
    : blocked
      ? '报告证据没有形成可用的代码位置锚点，不能把该回答直接用于修复或报告结论。'
      : fileAnchored
        ? '报告证据已匹配到文件，但缺少行级锚点；同名文件或 source URL 场景仍需人工确认具体行。'
        : '报告证据已有部分来源信号，但回答引用、行号或路径后缀还没有完全闭环。'

  return {
    tone,
    title,
    summary,
    metrics: [
      { label: '锚点', value: msg.sourceEvidenceMatchType || 'UNKNOWN' },
      { label: lineInfo.metricLabel, value: hasLine ? `第 ${lineLabel} 行` : '缺失' },
      { label: '引用文件', value: citedSourceFile ? '已绑定' : candidateSourceFile ? '候选' : '缺失' },
      { label: '必需覆盖', value: typeof requiredCoveragePercent === 'number' ? `${requiredCoveragePercent}%` : '-' },
    ],
    checks: [
      { label: '报告文件已回显', ok: hasFile },
      { label: hasLine ? '报告行号已回显' : '报告行号缺失', ok: hasLine },
      { label: `来源锚点 ${sourceEvidenceMatchLabel(msg.sourceEvidenceMatchType)}`, ok: lineAnchored },
      { label: '回答引用覆盖来源文件', ok: citedSourceFile },
      { label: requiredFileCount > 0 ? `必需文件 ${citedRequiredFileCount}/${requiredFileCount}` : '必需文件覆盖未提供', ok: requiredFileCount === 0 || requiredFileCoverage },
      { label: '定位不证明事实正确', ok: true },
    ],
  }
}

function qaSummaryTagText(tone: 'ready' | 'warning' | 'blocked'): string {
  if (tone === 'ready') return '可采信'
  if (tone === 'warning') return '需复核'
  return '已阻断'
}

function qaBindingTagText(tone: 'ready' | 'warning' | 'blocked'): string {
  if (tone === 'ready') return '已绑定'
  if (tone === 'warning') return '需复核'
  return '已阻断'
}

function qaCheckText(ok: boolean): string {
  return ok ? '通过' : '复核'
}

function qaAuditTagText(tone: 'ready' | 'warning' | 'blocked'): string {
  if (tone === 'ready') return '就绪'
  if (tone === 'warning') return '需复核'
  return '已阻断'
}

function repairGateStatusText(status?: string | null): string {
  if (status === 'READY') return '就绪（READY）'
  if (status === 'REVIEW') return '需复核（REVIEW）'
  if (status === 'BLOCKED') return '已阻断（BLOCKED）'
  return status ? `待确认（${status}）` : '待确认'
}

function coverageScopeText(scope?: string | null): string {
  if (scope === 'ALL') return '全部（ALL）'
  if (scope === 'REQUIRED') return '必需证据（REQUIRED）'
  if (scope === 'PRIMARY') return '主证据（PRIMARY）'
  if (scope === 'NONE') return '无覆盖（NONE）'
  return scope ? `待确认（${scope}）` : '待确认'
}

function evidenceRoleStatusText(status?: string | null): string {
  if (status === 'PRIMARY_BOUND') return '主证据已绑定（PRIMARY_BOUND）'
  if (status === 'PRIMARY_SINGLE_FILE') return '单文件主证据（PRIMARY_SINGLE_FILE）'
  if (status === 'PRIMARY_CROSS_FILE') return '跨文件主证据（PRIMARY_CROSS_FILE）'
  if (status === 'MIXED_PRIMARY_CONTEXT') return '主证据与上下文混合（MIXED_PRIMARY_CONTEXT）'
  if (status === 'CONTEXT_ONLY') return '仅上下文（CONTEXT_ONLY）'
  if (status === 'REVIEW_UNCITED') return '未引用需复核（REVIEW_UNCITED）'
  if (status === 'UNBACKED') return '未绑定（UNBACKED）'
  if (status === 'NO_EVIDENCE') return '无证据（NO_EVIDENCE）'
  if (status === 'UNKNOWN') return '未知（UNKNOWN）'
  return status ? `待确认（${status}）` : '待确认'
}

function claimProblemStatusText(status?: string | null): string {
  if (status === 'INVALID') return '无效引用'
  if (status === 'UNCITED') return '未引用'
  if (status === 'REVIEW') return '需复核'
  return status ? `待确认（${status}）` : '待确认'
}

function qaAnswerSourceEvidenceReceipt(msg: QaMessage): QaAnswerSourceEvidenceReceipt | null {
  const ref = msg.sourceEvidenceRef
  if (!ref || !ref.filePath) return null
  const safeRef = redactedEvidenceRefForOutput(ref)
  const lineInfo = evidenceLineInfo(safeRef)
  const lineLabel = lineInfo.label
  const lineSuffix = lineLabel ? `:${lineLabel}` : ''
  const fallbackFile = safeRef.filePath || redactSensitiveText(ref.filePath)
  return {
    title: safeRef.title || fallbackFile,
    source: safeRef.source || 'Unknown Source',
    category: safeRef.category || '未分类',
    fileReference: `${fallbackFile}${lineSuffix}`,
    lineKindLabel: lineInfo.tagLabel,
    scanLabel: msg.scanTaskId ? `Scan #${msg.scanTaskId}` : 'Scan -',
    matchLabel: sourceEvidenceMatchLabel(msg.sourceEvidenceMatchType),
    matchType: msg.sourceEvidenceMatchType || 'UNKNOWN',
    matched: msg.sourceEvidenceMatched === true,
    locationConfidence: qaSourceLocationConfidence(msg, ref),
  }
}

function qaSourceFileMatchRelease(msg: QaMessage, repairGate: RepairEvidenceGate): QaSourceFileMatchRelease | null {
  const ref = msg.sourceEvidenceRef
  if (!ref?.filePath) return null

  const safeRef = redactedEvidenceRefForOutput(ref)
  const citation = firstRelevantSourceCitation(msg, ref)
  const targetLineLabel = evidenceLineLabel(safeRef)
  const targetLine = targetLineLabel ? `:${targetLineLabel}` : ''
  const targetReference = `${safeRef.filePath || redactSensitiveText(ref.filePath)}${targetLine}`
  const citedReference = citation?.filePath
    ? redactSensitiveText(citationLineReference(citation))
    : '未找到已引用代码切片'
  const hasTargetFile = Boolean(ref.filePath)
  const hasTargetLine = Boolean(evidenceLineLabel(ref))
  const sourceMatched = msg.sourceEvidenceMatched === true
  const lineAnchored = sourceMatched && msg.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR' && hasTargetLine
  const fileAnchored = sourceMatched && msg.sourceEvidenceMatchType === 'REPORT_FILE_ANCHOR'
  const pathMatched = Boolean(citation?.filePath && sourceLocationPathsMatch(ref.filePath, citation.filePath))
  const fileNameMatched = Boolean(citation?.filePath && sourceLocationFileNameMatches(ref.filePath, citation.filePath))
  const fileNameOnly = fileNameMatched && !pathMatched
  const untrustedShortPathCandidate = fileNameMatched && !sourceMatched
  const trustedPathMatched = sourceMatched && pathMatched && !fileNameOnly
  const requiredEvidenceCount = msg.citationCoverage?.requiredEvidenceCount ?? msg.citationCoverage?.totalEvidenceCount ?? 0
  const citedRequiredEvidenceCount = msg.citationCoverage?.citedRequiredEvidenceCount ?? msg.citationCoverage?.citedEvidenceCount ?? 0
  const requiredCoveragePercent = msg.citationCoverage?.requiredEvidenceCoveragePercent ?? msg.citationCoverage?.coveragePercent ?? 0
  const requiredEvidenceReady = requiredEvidenceCount > 0 && requiredCoveragePercent >= 100 && citedRequiredEvidenceCount >= requiredEvidenceCount
  const claimCoverage = msg.claimCitationCoverage
  const claimRoleDistribution = claimCoverage?.roleDistribution
  const requiredClaimCount = Number(claimCoverage?.requiredClaimCount || claimRoleDistribution?.requiredClaimCount || 0)
  const primaryBoundClaimCount = Number(claimRoleDistribution?.requiredPrimaryBoundClaimCount || 0)
  const claimRoleReady = claimCitationCoverageReadyForRepair(claimCoverage)
  const matchLabel = lineAnchored && pathMatched
    ? '行级锚点'
    : sourceMatched && pathMatched
      ? '路径后缀一致'
      : fileNameOnly || untrustedShortPathCandidate
        ? '仅文件名一致，需复核'
        : '未形成来源闭环'
  const riskLabel = lineAnchored && pathMatched
    ? '低风险：报告目标文件、行号和已引用代码切片已对齐'
    : fileNameOnly || untrustedShortPathCandidate
      ? '同名文件风险：只看到候选路径信号，后端没有确认来源闭环'
      : fileAnchored
        ? '行号风险：来源锚点仍是文件锚点，需确认具体行号'
        : '闭环缺口：来源文件、回答引用或报告锚点缺失'
  const checks = [
    {
      label: '报告证据已回显',
      ok: hasTargetFile,
      detail: targetReference,
    },
    {
      label: '来源文件匹配',
      ok: trustedPathMatched,
      detail: matchLabel,
    },
    {
      label: '行级锚点',
      ok: lineAnchored && pathMatched,
      detail: lineAnchored
        ? '报告证据行号已进入 QA 响应'
        : fileAnchored
          ? '来源锚点仍是文件锚点，需确认具体行号'
          : '未形成行级来源锚点',
    },
    {
      label: '必需证据覆盖',
      ok: requiredEvidenceReady,
      detail: `必需证据 ${citedRequiredEvidenceCount}/${requiredEvidenceCount || '-'}`,
    },
    {
      label: '主张 PRIMARY 绑定',
      ok: claimRoleReady,
      detail: claimRoleDistribution
        ? `主张 PRIMARY 绑定 ${primaryBoundClaimCount}/${requiredClaimCount || '-'}`
        : '主张角色分布缺失，不能生成修复候选',
    },
    {
      label: '修复门禁',
      ok: repairGate.status === 'READY',
      detail: repairGateStatusText(repairGate.status),
    },
  ]
  const tone: QaSourceFileMatchRelease['tone'] = repairGate.status === 'READY'
    ? 'ready'
    : repairGate.status === 'REVIEW' || sourceMatched || untrustedShortPathCandidate
      ? 'warning'
      : 'blocked'
  const title = repairGate.status === 'READY'
    ? '满足修复候选放行'
    : repairGate.status === 'REVIEW'
      ? '修复候选需复核'
      : '修复候选已阻断'
  const summary = repairGate.status === 'READY'
    ? '来源文件、行级锚点、必需证据和主张 PRIMARY 绑定已形成闭环。该说明只证明证据绑定成熟，不证明 LLM 事实语义正确。'
    : fileAnchored
      ? '回答已绑定到报告目标文件，但来源仍停留在文件锚点，生成修复候选前必须确认具体行。'
      : fileNameOnly
        ? '当前只看到同名文件信号，目录后缀没有闭合，不能把该回答直接作为修复依据。'
        : '当前回答没有形成完整来源文件闭环，不能直接进入修复候选。'
  const nextAction = repairGate.status === 'READY'
    ? '下一步：可进入修复候选复核。'
    : fileAnchored
      ? '下一步：确认报告证据行号后重试此问题。'
      : !claimRoleDistribution
        ? '下一步：重新生成回答或补充引用，让主张绑定 PRIMARY 主证据。'
        : '下一步：重新检索证据或换用更具体的问题。'

  return {
    tone,
    title,
    summary,
    targetReference,
    citedReference,
    matchLabel,
    riskLabel,
    nextAction,
    checks,
  }
}

function claimCitationCoverageReadyForRepair(coverage?: CodeQaClaimCitationCoverage): boolean {
  if (!coverage) return false
  if (coverage.status !== 'READY') return false
  if (typeof coverage.readyForRepair === 'boolean'
    && (coverage.readyForRepair !== true || coverage.readinessReason !== 'PRIMARY_BOUND_READY')) return false
  const roleDistribution = coverage.roleDistribution
  if (!roleDistribution || roleDistribution.status !== 'PRIMARY_BOUND') return false
  const requiredClaimCount = Number(coverage.requiredClaimCount || 0)
  const citedRequiredClaimCount = Number(coverage.citedRequiredClaimCount || 0)
  const uncitedRequiredClaimCount = Number(coverage.uncitedRequiredClaimCount || 0)
  const invalidCitationClaimCount = Number(coverage.invalidCitationClaimCount || 0)
  const requiredPrimaryBoundClaimCount = Number(roleDistribution.requiredPrimaryBoundClaimCount || 0)
  const requiredPrimaryFileCount = Number(roleDistribution.requiredPrimaryFileCount || 0)
  const validCitationFileCount = Number(coverage.validCitationFileCount || 0)
  const requiredClaimCitationFileCount = Number(coverage.requiredClaimCitationFileCount || 0)
  return requiredClaimCount > 0
    && Number(roleDistribution.requiredClaimCount || 0) === requiredClaimCount
    && citedRequiredClaimCount === requiredClaimCount
    && uncitedRequiredClaimCount === 0
    && invalidCitationClaimCount === 0
    && requiredPrimaryBoundClaimCount === requiredClaimCount
    && Number(roleDistribution.requiredContextOnlyClaimCount || 0) === 0
    && Number(roleDistribution.requiredUnknownOnlyClaimCount || 0) === 0
    && Number(roleDistribution.unbackedRequiredClaimCount || 0) === 0
    && Number(roleDistribution.invalidRequiredClaimCount || 0) === 0
    && validCitationFileCount > 0
    && requiredClaimCitationFileCount > 0
    && Number(roleDistribution.validCitationFileCount || 0) === validCitationFileCount
    && Number(roleDistribution.requiredClaimCitationFileCount || 0) === requiredClaimCitationFileCount
    && requiredPrimaryFileCount > 0
}

function qaRepairEvidenceGate(msg: QaMessage): RepairEvidenceGate {
  const coverage = msg.citationCoverage
  const total = coverage?.requiredEvidenceCount ?? coverage?.totalEvidenceCount ?? msg.answerCitations?.length ?? 0
  const cited = coverage?.citedRequiredEvidenceCount ?? coverage?.citedEvidenceCount ?? msg.answerCitations?.filter(citation => citation.citedByAnswer).length ?? 0
  const requiredCoveragePercent = coverage?.requiredEvidenceCoveragePercent ?? coverage?.coveragePercent ?? (total ? Math.round((cited * 100) / total) : 0)
  const repairCandidates = coverage?.repairCandidateCount ?? 0
  const verified = msg.groundingStatus === 'VERIFIED'
  const citationGate = successfulCitationEnforcement(msg.citationEnforcementStatus)
  const responseBound = Boolean(msg.sourceEvidenceRef?.filePath)
  const sourceMatched = msg.sourceEvidenceMatched === true
  const lineAnchored = msg.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR'
  const claimCoverage = msg.claimCitationCoverage
  const claimRoleDistribution = claimCoverage?.roleDistribution
  const requiredClaimCount = Number(claimCoverage?.requiredClaimCount || 0)
  const citedRequiredClaimCount = Number(claimCoverage?.citedRequiredClaimCount || 0)
  const requiredPrimaryBoundClaimCount = Number(claimRoleDistribution?.requiredPrimaryBoundClaimCount || 0)
  const requiredPrimaryFileCount = Number(claimRoleDistribution?.requiredPrimaryFileCount || 0)
  const claimCoverageReady = claimCitationCoverageReadyForRepair(claimCoverage)
  const checks = [
    `必需证据 ${cited}/${total}`,
    `必需覆盖 ${requiredCoveragePercent}%`,
    `主张引用 ${claimCoverage?.status || 'MISSING'} ${citedRequiredClaimCount}/${requiredClaimCount || '-'}`,
    `主张角色 ${claimRoleDistribution?.status || 'MISSING'} ${requiredPrimaryBoundClaimCount}/${requiredClaimCount || '-'}`,
    `主张主文件 ${requiredPrimaryFileCount}`,
    `修复候选 ${repairCandidates}`,
    `报告证据 ${responseBound ? '已回显' : '缺失'}`,
    `来源锚点 ${sourceEvidenceMatchLabel(msg.sourceEvidenceMatchType)}`,
  ]

  if (msg.claimCitationCoverage?.status === 'BLOCKED') {
    return {
      status: 'BLOCKED',
      label: 'BLOCKED',
      color: 'red',
      summary: '回答中存在无效引用标签，不能作为自动修复依据。',
      checks,
    }
  }

  if (verified && citationGate && requiredCoveragePercent >= 100 && repairCandidates > 0 && responseBound && sourceMatched && lineAnchored && claimCoverageReady) {
    return {
      status: 'READY',
      label: 'READY',
      color: 'green',
      summary: '回答引用、报告证据和代码位置已形成可修复闭环。',
      checks,
    }
  }

  if (!verified || !citationGate || requiredCoveragePercent < 100 || repairCandidates === 0) {
    return {
      status: 'BLOCKED',
      label: 'BLOCKED',
      color: 'red',
      summary: '当前回答还不能直接进入自动修复，需要先完成引用验证或补足可修复证据。',
      checks,
    }
  }

  return {
    status: 'REVIEW',
    label: 'REVIEW',
    color: 'gold',
    summary: '代码引用可用，但报告证据回显或来源锚点仍需复核。',
    checks,
  }
}

function citationCoverageAudit(msg: QaMessage): CitationCoverageAudit | null {
  if (!msg.citationCoverage && !msg.answerCitations?.length && !msg.groundingStatus) {
    return null
  }
  const coverage = msg.citationCoverage
  const total = coverage?.totalEvidenceCount ?? msg.answerCitations?.length ?? 0
  const cited = coverage?.citedEvidenceCount ?? msg.answerCitations?.filter(citation => citation.citedByAnswer).length ?? 0
  const uncited = coverage?.uncitedCandidateCount ?? Math.max(total - cited, 0)
  const repairCandidates = coverage?.repairCandidateCount ?? 0
  const coveragePercent = coverage?.coveragePercent ?? (total ? Math.round((cited * 100) / total) : 0)
  const required = coverage?.requiredEvidenceCount ?? total
  const citedRequired = coverage?.citedRequiredEvidenceCount ?? cited
  const requiredFiles = coverage?.requiredEvidenceFileCount ?? coverage?.uniqueEvidenceFileCount ?? 0
  const citedRequiredFiles = coverage?.citedRequiredEvidenceFileCount ?? coverage?.citedEvidenceFileCount ?? 0
  const requiredCoveragePercent = coverage?.requiredEvidenceCoveragePercent ?? coveragePercent
  const coverageScope = coverage?.coverageScope || 'ALL'
  const roleDistribution = coverage?.evidenceRoleDistribution
  const roleDistributionAudit = roleDistribution
    ? {
        status: roleDistribution.status || 'UNKNOWN',
        roles: (roleDistribution.roles || []).map(role => {
          const name = role.role || 'UNKNOWN'
          const citedEvidence = role.citedEvidenceCount ?? 0
          const evidence = role.evidenceCount ?? 0
          const citedFiles = role.citedFileCount ?? 0
          const files = role.fileCount ?? 0
          return `${evidenceRoleStatusText(name)} ${citedEvidence}/${evidence} 证据 · ${citedFiles}/${files} 文件`
        }),
        files: (roleDistribution.files || []).map(file => {
          const primary = `${file.citedPrimaryEvidenceCount ?? 0}/${file.primaryEvidenceCount ?? 0}`
          const context = `${file.citedContextEvidenceCount ?? 0}/${file.contextEvidenceCount ?? 0}`
          return `${file.filePath || '-'} · P ${primary} · C ${context}`
        }),
      }
    : undefined
  const primaryCount = coverage?.primaryEvidenceCount ?? 0
  const contextCount = coverage?.contextEvidenceCount ?? Math.max(total - primaryCount, 0)
  const uncitedContextCount = Number(coverage?.uncitedContextEvidenceCount ?? Math.max(contextCount - (coverage?.citedContextEvidenceCount ?? 0), 0))
  const uncitedContextFiles = Number(coverage?.uncitedContextEvidenceFileCount ?? Math.max((coverage?.contextEvidenceFileCount ?? 0) - (coverage?.citedContextEvidenceFileCount ?? 0), 0))
  const verified = msg.groundingStatus === 'VERIFIED'
  const citationGate = successfulCitationEnforcement(msg.citationEnforcementStatus)
  const sourceBound = Boolean(msg.sourceEvidenceRef?.filePath)
  const sourceMatched = msg.sourceEvidenceMatched === true
  const lineAnchored = msg.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR'
  const requiredCoverageSatisfied = required > 0 && requiredCoveragePercent >= 100 && (requiredFiles === 0 || citedRequiredFiles >= requiredFiles)
  const ready = verified && citationGate && requiredCoverageSatisfied && repairCandidates > 0 && sourceBound && sourceMatched
  const checks = [
    { label: `必需证据 ${citedRequired}/${required}`, ok: required > 0 && requiredCoveragePercent >= 100 },
    { label: `必需文件 ${citedRequiredFiles}/${requiredFiles}`, ok: requiredFiles === 0 || citedRequiredFiles >= requiredFiles },
    { label: `主证据 ${coverage?.citedPrimaryEvidenceCount ?? 0}/${primaryCount}`, ok: primaryCount === 0 || (coverage?.citedPrimaryEvidenceCount ?? 0) >= primaryCount },
    { label: `主证据文件 ${coverage?.citedPrimaryEvidenceFileCount ?? 0}/${coverage?.primaryEvidenceFileCount ?? 0}`, ok: (coverage?.primaryEvidenceFileCount ?? 0) === 0 || (coverage?.citedPrimaryEvidenceFileCount ?? 0) >= (coverage?.primaryEvidenceFileCount ?? 0) },
    { label: `角色分布 ${roleDistributionAudit?.status || 'UNKNOWN'}`, ok: Boolean(roleDistributionAudit) },
    { label: `上下文 ${coverage?.citedContextEvidenceCount ?? 0}/${contextCount}`, ok: true },
    { label: `未引用上下文 ${uncitedContextCount} 条 / ${uncitedContextFiles} 文件`, ok: true },
    { label: `未引用候选 ${uncited}`, ok: coverage?.status === 'REQUIRED_FULL' || uncited === 0 },
    { label: `可修复证据 ${repairCandidates}`, ok: repairCandidates > 0 },
    { label: `报告证据${sourceBound ? '已回显' : '未回显'}`, ok: sourceBound },
    { label: sourceEvidenceMatchLabel(msg.sourceEvidenceMatchType), ok: sourceMatched },
  ]

  if (ready) {
    return {
      tone: lineAnchored ? 'ready' : 'warning',
      title: lineAnchored ? '引用覆盖可进入修复' : '引用覆盖可复核',
      summary: lineAnchored
        ? '必需证据、报告来源和行级锚点已形成闭环，可以进入修复候选复核；未引用上下文作为补充复核信号展示。'
        : '必需证据和报告来源已绑定，但缺少行级锚点，生成修复候选前需要人工确认具体位置。',
      metrics: [
        { label: '必需覆盖', value: `${requiredCoveragePercent}%` },
        { label: '必需文件', value: `${citedRequiredFiles}/${requiredFiles}` },
        { label: '角色', value: evidenceRoleStatusText(roleDistributionAudit?.status) },
        { label: '范围', value: coverageScopeText(coverageScope) },
        { label: '上下文缺口', value: `${uncitedContextCount}/${contextCount}` },
        { label: '可修复', value: String(repairCandidates) },
      ],
      checks,
      roleDistribution: roleDistributionAudit,
    }
  }

  return {
    tone: verified || cited > 0 ? 'warning' : 'blocked',
    title: verified || cited > 0 ? '引用覆盖需要复核' : '引用覆盖不足',
    summary: '当前回答还不能直接作为自动修复依据，需要补充可引用证据、重新检索或调整问题后再次确认。',
    metrics: [
      { label: '必需覆盖', value: `${requiredCoveragePercent}%` },
      { label: '必需文件', value: `${citedRequiredFiles}/${requiredFiles}` },
      { label: '角色', value: evidenceRoleStatusText(roleDistributionAudit?.status) },
      { label: '总覆盖', value: `${coveragePercent}%` },
      { label: '上下文缺口', value: `${uncitedContextCount}/${contextCount}` },
      { label: '可修复', value: String(repairCandidates) },
    ],
    checks,
    roleDistribution: roleDistributionAudit,
  }
}

function claimCitationAudit(msg: QaMessage): ClaimCitationAudit | null {
  const coverage = msg.claimCitationCoverage
  if (!coverage) {
    return null
  }
  const status = coverage.status || 'REVIEW'
  const readyForRepair = claimCitationCoverageReadyForRepair(coverage)
  const effectiveStatus = status === 'READY' && readyForRepair ? 'READY' : status === 'BLOCKED' ? 'BLOCKED' : 'REVIEW'
  const roleDistribution = coverage.roleDistribution
  const roleDistributionAudit = roleDistribution
    ? {
        status: roleDistribution.status || 'UNKNOWN',
        primaryBound: Number(roleDistribution.requiredPrimaryBoundClaimCount || 0),
        contextOnly: Number(roleDistribution.requiredContextOnlyClaimCount || 0),
        unknownOnly: Number(roleDistribution.requiredUnknownOnlyClaimCount || 0),
        requiredClaims: Number(roleDistribution.requiredClaimCount || coverage.requiredClaimCount || 0),
        primaryFiles: Number(roleDistribution.requiredPrimaryFileCount || roleDistribution.primaryFileCount || 0),
        contextFiles: Number(roleDistribution.requiredContextFileCount || roleDistribution.contextFileCount || 0),
        roles: (roleDistribution.roles || []).map(role => {
          const name = role.role || 'UNKNOWN'
          return `${evidenceRoleStatusText(name)} ${role.requiredClaimCount ?? role.claimCount ?? 0}/${role.claimCount ?? 0}`
        }),
        files: (roleDistribution.files || []).map(file => {
          const name = file.filePath || '-'
          return `${name} P${file.requiredPrimaryClaimCount ?? 0}/C${file.requiredContextClaimCount ?? 0}/U${file.requiredUnknownClaimCount ?? 0}`
        }).slice(0, 3),
      }
    : undefined
  const tone: ClaimCitationAudit['tone'] = effectiveStatus === 'READY' ? 'ready' : effectiveStatus === 'BLOCKED' ? 'blocked' : 'warning'
  const problemClaims = (coverage.claims || [])
    .filter(claim => claim.status === 'UNCITED' || claim.status === 'INVALID')
    .slice(0, 3)
    .map(claim => ({
      id: claim.claimId || '-',
      status: claim.status || 'REVIEW',
      text: claim.claimTextPreview || '-',
      labels: claim.invalidSourceLabels?.length
        ? `无效 ${claim.invalidSourceLabels.join(', ')}`
        : claim.sourceLabels?.length
          ? claim.sourceLabels.join(', ')
          : '未引用',
    }))

  return {
    tone,
    title: effectiveStatus === 'READY' ? '主张已绑定引用' : effectiveStatus === 'BLOCKED' ? '存在无效引用标签' : '主张引用需要复核',
    summary: coverage.readinessNote || (effectiveStatus === 'READY'
      ? '回答中的可审计主张都绑定了当前证据标签。该信号只证明引用绑定，不证明事实语义充分。'
      : effectiveStatus === 'BLOCKED'
        ? '回答包含不属于当前检索证据的引用标签，需要重新生成或人工修正。'
        : '部分代码主张没有绑定当前证据标签，进入修复候选前需要补充引用或人工确认。'),
    metrics: [
      { label: '主张', value: `${coverage.citedRequiredClaimCount ?? 0}/${coverage.requiredClaimCount ?? 0}` },
      { label: '覆盖率', value: `${coverage.claimCoveragePercent ?? 0}%` },
      { label: '修复门禁', value: coverage.readyForRepair ? 'READY' : 'REVIEW' },
      { label: '原因码', value: coverage.readinessReason || '-' },
      { label: '引用文件', value: String(coverage.validCitationFileCount ?? coverage.validCitationFiles?.length ?? 0) },
      { label: '必需文件', value: String(coverage.requiredClaimCitationFileCount ?? coverage.requiredClaimCitationFiles?.length ?? 0) },
      { label: '无效引用', value: String(coverage.invalidCitationClaimCount ?? 0) },
      { label: '主证据主张', value: roleDistributionAudit ? `${roleDistributionAudit.primaryBound}/${roleDistributionAudit.requiredClaims}` : '-' },
      { label: '仅上下文', value: roleDistributionAudit ? String(roleDistributionAudit.contextOnly) : '-' },
    ],
    roleDistribution: roleDistributionAudit,
    problemClaims,
  }
}

function qaCrossFileCitationSummary(msg: QaMessage): QaCrossFileCitationSummary | null {
  const coverage = msg.citationCoverage
  const claimCoverage = msg.claimCitationCoverage
  if (!coverage && !claimCoverage) {
    return null
  }

  const roleDistribution = coverage?.evidenceRoleDistribution
  const claimRoleDistribution = claimCoverage?.roleDistribution
  const roleStatus = roleDistribution?.status || 'NO_EVIDENCE'
  const totalFiles = Number(roleDistribution?.totalFileCount ?? coverage?.uniqueEvidenceFileCount ?? 0)
  const citedFiles = Number(roleDistribution?.citedFileCount ?? coverage?.citedEvidenceFileCount ?? 0)
  const primaryFiles = Number(roleDistribution?.primaryFileCount ?? coverage?.primaryEvidenceFileCount ?? 0)
  const citedPrimaryFiles = Number(roleDistribution?.citedPrimaryFileCount ?? coverage?.citedPrimaryEvidenceFileCount ?? 0)
  const contextFiles = Number(roleDistribution?.contextFileCount ?? coverage?.contextEvidenceFileCount ?? 0)
  const citedContextFiles = Number(roleDistribution?.citedContextFileCount ?? coverage?.citedContextEvidenceFileCount ?? 0)
  const contextEvidence = Number(coverage?.contextEvidenceCount ?? 0)
  const citedContextEvidence = Number(coverage?.citedContextEvidenceCount ?? 0)
  const uncitedContextEvidence = Number(coverage?.uncitedContextEvidenceCount ?? Math.max(contextEvidence - citedContextEvidence, 0))
  const uncitedContextFiles = Number(coverage?.uncitedContextEvidenceFileCount ?? Math.max(contextFiles - citedContextFiles, 0))
  const hasContextGap = uncitedContextEvidence > 0 || uncitedContextFiles > 0
  const requiredFiles = Number(coverage?.requiredEvidenceFileCount ?? 0)
  const citedRequiredFiles = Number(coverage?.citedRequiredEvidenceFileCount ?? 0)
  const requiredClaims = Number(claimCoverage?.requiredClaimCount ?? claimRoleDistribution?.requiredClaimCount ?? 0)
  const citedRequiredClaims = Number(claimCoverage?.citedRequiredClaimCount ?? 0)
  const requiredClaimFiles = Number(claimCoverage?.requiredClaimCitationFileCount ?? claimRoleDistribution?.requiredClaimCitationFileCount ?? 0)
  const requiredPrimaryFiles = Number(claimRoleDistribution?.requiredPrimaryFileCount ?? 0)
  const primaryBoundClaims = Number(claimRoleDistribution?.requiredPrimaryBoundClaimCount ?? 0)
  const crossFileContext = totalFiles >= 2 || (primaryFiles + contextFiles) >= 2
  const requiredFilesCovered = requiredFiles > 0 && citedRequiredFiles >= requiredFiles
  const primaryFilesCovered = primaryFiles > 0 && citedPrimaryFiles >= primaryFiles
  const claimPrimaryBound = claimCitationCoverageReadyForRepair(claimCoverage)
  const sourceLineAnchored = msg.sourceEvidenceMatched === true && msg.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR'
  const hasEvidence = totalFiles > 0 && Number(coverage?.totalEvidenceCount ?? 0) > 0
  const requiredCoverageSatisfied = (coverage?.status === 'FULL' || coverage?.status === 'REQUIRED_FULL')
    || (requiredFilesCovered && primaryFilesCovered)
  const ready = hasEvidence
    && requiredCoverageSatisfied
    && requiredFilesCovered
    && primaryFilesCovered
    && claimPrimaryBound
    && sourceLineAnchored
  const blocked = !hasEvidence
    || coverage?.status === 'NONE'
    || claimCoverage?.status === 'BLOCKED'
    || msg.groundingStatus === 'NO_EVIDENCE'
    || msg.groundingStatus === 'UNVERIFIED'
  const tone: QaCrossFileCitationSummary['tone'] = ready ? 'ready' : blocked ? 'blocked' : 'warning'
  const title = ready
    ? crossFileContext ? '跨文件引用可采信' : '单文件主证据可采信'
    : blocked ? '跨文件引用不足' : hasContextGap ? '上下文引用可复核' : '跨文件引用待复核'
  const summary = ready
    ? '必需证据文件、PRIMARY 主证据和代码主张已完成结构性绑定；未引用上下文仅作为补充复核信号。该摘要只证明引用覆盖，不证明 LLM 事实语义正确。'
    : blocked
      ? '当前回答缺少可采信的引用闭环，不能作为自动修复或报告结论依据。'
      : hasContextGap
        ? 'PRIMARY 主证据已绑定，adjacent context 仍有未引用证据；这些上下文用于补充复核，不阻塞必需证据门禁。'
        : '已有部分引用和文件分布信号，但跨文件上下文、主证据覆盖、claim 绑定或来源锚点仍需复核。'

  return {
    tone,
    status: roleStatus,
    title,
    summary,
    metrics: [
      { label: '证据文件', value: `${citedFiles}/${totalFiles}` },
      { label: '主证据文件', value: `${citedPrimaryFiles}/${primaryFiles}` },
      { label: '必需文件', value: `${citedRequiredFiles}/${requiredFiles}` },
      { label: '主张文件', value: `${requiredClaimFiles}` },
      { label: '主证据主张', value: `${primaryBoundClaims}/${requiredClaims || '-'}` },
      { label: '上下文文件', value: `${citedContextFiles}/${contextFiles}` },
      { label: '未引用上下文', value: `${uncitedContextEvidence} 条 / ${uncitedContextFiles} 文件` },
    ],
    checks: [
      { label: crossFileContext ? '跨文件上下文已出现' : '单文件证据路径', ok: crossFileContext },
      { label: `必需文件 ${citedRequiredFiles}/${requiredFiles}`, ok: requiredFilesCovered },
      { label: `PRIMARY 文件 ${citedPrimaryFiles}/${primaryFiles}`, ok: primaryFilesCovered },
      { label: `主张 PRIMARY 绑定 ${primaryBoundClaims}/${requiredClaims || '-'}`, ok: claimPrimaryBound },
      { label: `来源锚点 ${sourceEvidenceMatchLabel(msg.sourceEvidenceMatchType)}`, ok: sourceLineAnchored },
      { label: `上下文缺口 ${uncitedContextEvidence} 条 / ${uncitedContextFiles} 文件`, ok: true },
      { label: `证据角色 ${evidenceRoleStatusText(roleStatus)}`, ok: roleStatus !== 'NO_EVIDENCE' },
      { label: `主张文件 ${requiredClaimFiles}`, ok: requiredClaimFiles > 0 && requiredPrimaryFiles > 0 },
      { label: `主张 ${citedRequiredClaims}/${requiredClaims || '-'}`, ok: requiredClaims > 0 && citedRequiredClaims >= requiredClaims },
    ],
    contextGap: {
      evidence: uncitedContextEvidence,
      files: uncitedContextFiles,
      visible: hasContextGap,
    },
  }
}

function qaTrustSummary(
  msg: QaMessage,
  repairGate: RepairEvidenceGate | null,
  citationAudit: CitationCoverageAudit | null,
  claimAudit: ClaimCitationAudit | null,
): QaTrustSummary | null {
  if (!msg.groundingStatus && !msg.citationCoverage && !msg.claimCitationCoverage && !msg.answerCitations?.length) {
    return null
  }

  const coverage = msg.citationCoverage
  const claimCoverage = msg.claimCitationCoverage
  const roleDistribution = claimCoverage?.roleDistribution
  const requiredCoveragePercent = coverage?.requiredEvidenceCoveragePercent ?? coverage?.coveragePercent ?? 0
  const requiredEvidenceCount = coverage?.requiredEvidenceCount ?? coverage?.totalEvidenceCount ?? 0
  const citedRequiredEvidenceCount = coverage?.citedRequiredEvidenceCount ?? coverage?.citedEvidenceCount ?? 0
  const requiredClaimCount = claimCoverage?.requiredClaimCount ?? 0
  const citedRequiredClaimCount = claimCoverage?.citedRequiredClaimCount ?? 0
  const requiredPrimaryBoundClaimCount = roleDistribution?.requiredPrimaryBoundClaimCount ?? 0
  const primaryBound = claimCitationCoverageReadyForRepair(claimCoverage)
  const verified = msg.groundingStatus === 'VERIFIED'
  const citationVerified = successfulCitationEnforcement(msg.citationEnforcementStatus)
  const citationReason = msg.citationEnforcementReason || null
  const claimReady = claimCitationCoverageReadyForRepair(claimCoverage)
  const sourceLineAnchored = msg.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR'
  const sourceMatched = msg.sourceEvidenceMatched === true
  const gateStatus = repairGate?.status || 'REVIEW'
  const hardBlocked = msg.groundingStatus === 'NO_EVIDENCE'
    || msg.groundingStatus === 'UNVERIFIED'
    || claimCoverage?.status === 'BLOCKED'
    || gateStatus === 'BLOCKED'
  const ready = verified
    && citationVerified
    && requiredCoveragePercent >= 100
    && claimReady
    && primaryBound
    && sourceMatched
    && sourceLineAnchored
    && gateStatus === 'READY'
  const checks = [
    { label: `回答验证 ${groundingStatusLabel(msg.groundingStatus)}`, ok: verified },
    { label: `引用策略 ${citationEnforcementLabel(msg.citationEnforcementStatus)}`, ok: citationVerified },
    { label: `引用原因 ${citationEnforcementReasonLabel(citationReason)}`, ok: citationVerified || citationReason === 'NOT_APPLICABLE' },
    { label: `必需证据 ${citedRequiredEvidenceCount}/${requiredEvidenceCount}`, ok: requiredEvidenceCount > 0 && requiredCoveragePercent >= 100 },
    { label: `主张引用 ${citedRequiredClaimCount}/${requiredClaimCount || '-'}`, ok: claimReady && (requiredClaimCount === 0 || citedRequiredClaimCount >= requiredClaimCount) },
    { label: `PRIMARY 主证据 ${requiredPrimaryBoundClaimCount}/${requiredClaimCount || '-'}`, ok: primaryBound },
    { label: `来源锚点 ${sourceEvidenceMatchLabel(msg.sourceEvidenceMatchType)}`, ok: sourceLineAnchored },
    { label: `修复门禁 ${gateStatus}`, ok: gateStatus === 'READY' },
  ]

  if (ready) {
    return {
      tone: 'ready',
      title: '可采信并进入修复复核',
      summary: '回答、必需证据、代码主张和 PRIMARY 主证据已经形成闭环。该摘要证明证据绑定成熟，不等同于 LLM 事实裁判。',
      nextAction: '可以继续查看引用文件、生成修复候选，或把该回答纳入报告复盘。',
      metrics: [
        { label: '证据', value: `${requiredCoveragePercent}%` },
        { label: '主张', value: `${citedRequiredClaimCount}/${requiredClaimCount}` },
        { label: '主证据', value: `${requiredPrimaryBoundClaimCount}/${requiredClaimCount}` },
        { label: '门禁', value: repairGateStatusText(gateStatus) },
      ],
      checks,
    }
  }

  if (hardBlocked) {
    return {
      tone: 'blocked',
      title: '不可直接采信',
      summary: '当前回答缺少可靠引用、存在无效引用标签，或没有满足修复证据门禁。必须重新检索、重新生成或人工复核。',
      nextAction: claimCoverage?.status === 'BLOCKED'
        ? '优先重新生成回答，避免使用不存在的引用标签。'
        : '先补足可引用代码证据，再继续追问或生成修复候选。',
      metrics: [
        { label: '证据', value: `${requiredCoveragePercent}%` },
        { label: '主张', value: `${citedRequiredClaimCount}/${requiredClaimCount || 0}` },
        { label: '主证据', value: `${requiredPrimaryBoundClaimCount}/${requiredClaimCount || 0}` },
        { label: '门禁', value: repairGateStatusText(gateStatus) },
      ],
      checks,
    }
  }

  return {
    tone: 'warning',
    title: '需要人工复核',
    summary: citationAudit?.summary || claimAudit?.summary || '回答已有部分证据绑定，但仍缺少完整的引用覆盖、PRIMARY 主证据或来源锚点。',
    nextAction: sourceMatched && !sourceLineAnchored
      ? '先确认报告证据的具体行号，再决定是否生成修复候选。'
      : '打开引用文件复核关键路径，必要时换用更具体的问题重新检索。',
    metrics: [
      { label: '证据', value: `${requiredCoveragePercent}%` },
      { label: '主张', value: `${citedRequiredClaimCount}/${requiredClaimCount || 0}` },
      { label: '主证据', value: primaryBound ? '已绑定' : evidenceRoleStatusText(roleDistribution?.status || 'REVIEW') },
      { label: '门禁', value: repairGateStatusText(gateStatus) },
    ],
    checks,
  }
}

function buildQaReadableEvidenceViewModel(msg: QaMessage): QaReadableEvidenceViewModel {
  const repairEvidenceGate = msg.groundingStatus ? qaRepairEvidenceGate(msg) : null
  const citationAudit = citationCoverageAudit(msg)
  const claimAudit = claimCitationAudit(msg)
  const trustSummary = qaTrustSummary(msg, repairEvidenceGate, citationAudit, claimAudit)
  const crossFileSummary = qaCrossFileCitationSummary(msg)
  const sourceEvidenceReceipt = qaAnswerSourceEvidenceReceipt(msg)
  const sourceFileRelease = repairEvidenceGate ? qaSourceFileMatchRelease(msg, repairEvidenceGate) : null

  return {
    repairEvidenceGate,
    citationAudit,
    claimAudit,
    trustSummary,
    crossFileSummary,
    sourceEvidenceReceipt,
    sourceFileRelease,
  }
}

function isLowConfidenceGrounding(status?: string | null): boolean {
  return status === 'PARTIAL' || status === 'UNVERIFIED' || status === 'NO_EVIDENCE'
}

function qaEvidenceReviewTitle(status?: string | null): string {
  if (status === 'NO_EVIDENCE') return '没有可用代码证据'
  if (status === 'UNVERIFIED') return '回答未绑定证据'
  if (status === 'PARTIAL') return '引用需要复核'
  return '证据状态待确认'
}

function qaEvidenceReviewDescription(msg: QaMessage): string {
  const candidateCount = Math.max(msg.answerCitations?.length || 0, msg.chunks?.length || 0)
  if (msg.groundingStatus === 'NO_EVIDENCE') {
    return '本次检索没有返回可引用代码切片。请换一个更具体的问题，或在重新扫描后再询问。'
  }
  if (msg.groundingStatus === 'UNVERIFIED') {
    return candidateCount > 0
      ? `回答没有可靠引用标记，下方 ${candidateCount} 条候选证据仅供人工复核。`
      : '回答没有可靠引用标记，也没有候选证据可复核。'
  }
  if (msg.groundingStatus === 'PARTIAL') {
    return candidateCount > 0
      ? `系统找到 ${candidateCount} 条候选证据，但回答引用不完整，请人工确认后再采信。`
      : '回答只完成了部分证据绑定，请重新提问或重新扫描后复核。'
  }
  return msg.citationEnforcementNote || '请先复核候选证据，再把结论用于修复或发布判断。'
}

function citationLineReference(citation: CodeQaCitation): string {
  const filePath = citation.filePath || 'unknown'
  const startLine = citation.startLine || 1
  const endLine = citation.endLine && citation.endLine >= startLine ? citation.endLine : startLine
  return `${filePath}:${startLine}-${endLine}`
}

function citationEvidenceKey(citation: CodeQaCitation): string {
  return [
    citation.sourceLabel || '',
    normalizeSourceLocationPath(citation.filePath),
    citation.startLine || 1,
    citation.endLine && citation.endLine >= (citation.startLine || 1) ? citation.endLine : citation.startLine || 1,
  ].join('|')
}

function chunkEvidenceKey(chunk: CodeChunkSearchItem): string {
  return [
    chunk.sourceLabel || '',
    normalizeSourceLocationPath(chunk.filePath),
    chunk.startLine || 1,
    chunk.endLine && chunk.endLine >= (chunk.startLine || 1) ? chunk.endLine : chunk.startLine || 1,
  ].join('|')
}

function supplementalQaChunks(msg: QaMessage): CodeChunkSearchItem[] {
  const citedKeys = new Set((msg.answerCitations || []).map(citationEvidenceKey))
  return (msg.chunks || []).filter(chunk => !citedKeys.has(chunkEvidenceKey(chunk)))
}

function citationEvidenceReason(citation: CodeQaCitation): string {
  if (citation.evidenceReason) return citation.evidenceReason
  const role = citation.contextRole === 'ADJACENT_CONTEXT' ? '上下文补充' : '主证据'
  const score = typeof citation.relevanceScore === 'number' ? `相关分 ${citation.relevanceScore}` : '相关分 -'
  const type = citation.evidenceType || 'OTHER'
  return `${role} · ${type} · ${score}`
}

function qaCitationRepairTargetDesc(citation: CodeQaCitation, question: string): string {
  return [
    `请基于 Project QA 已验证引用 ${redactSensitiveText(citation.sourceLabel || 'C?')} 生成最小修复候选。`,
    `证据位置：${redactSensitiveText(citationLineReference(citation))}`,
    question ? `原始问题：${redactSensitiveText(question)}` : '',
    `证据说明：${redactSensitiveText(citationEvidenceReason(citation))}`,
  ].filter(Boolean).join('\n')
}

function appendSourceEvidenceParams(
  params: URLSearchParams,
  sourceEvidenceRef?: CodeQaEvidenceRef | null,
  sourceEvidenceMatched?: boolean | null,
  sourceEvidenceMatchType?: string | null,
) {
  if (!sourceEvidenceRef) return
  const safeEvidenceRef = redactedEvidenceRefForOutput(sourceEvidenceRef)
  if (safeEvidenceRef.category) params.set('sourceEvidenceCategory', safeEvidenceRef.category)
  if (safeEvidenceRef.source) params.set('sourceEvidenceSource', safeEvidenceRef.source)
  if (safeEvidenceRef.title) params.set('sourceEvidenceTitle', safeEvidenceRef.title)
  if (safeEvidenceRef.filePath) params.set('sourceEvidenceFilePath', safeEvidenceRef.filePath)
  const sourceLineLabel = evidenceLineLabel(safeEvidenceRef)
  if (sourceLineLabel) params.set('sourceEvidenceLineNumber', sourceLineLabel)
  if (sourceEvidenceMatched !== undefined && sourceEvidenceMatched !== null) params.set('sourceEvidenceMatched', String(sourceEvidenceMatched))
  if (sourceEvidenceMatchType) params.set('sourceEvidenceMatchType', sourceEvidenceMatchType)
}

function buildChunkEvidenceProfile(items: CodeChunkSearchItem[]): ChunkEvidenceProfile {
  const scoringItems = items.filter(item => !isContextChunk(item))
  const primaryItems = scoringItems.length > 0 ? scoringItems : items
  const fileMap = new Map<string, { filePath: string; count: number; bestScore: number }>()
  const evidenceTypeMap = new Map<string, number>()
  let totalScore = 0
  let topScore = 0
  let embeddedCount = 0
  let lineSpan = 0
  let lowConfidenceCount = 0

  for (const item of items) {
    lineSpan += Math.max(item.endLine - item.startLine + 1, 1)

    const fileEntry = fileMap.get(item.filePath) || { filePath: item.filePath, count: 0, bestScore: 0 }
    fileEntry.count += 1
    fileEntry.bestScore = Math.max(fileEntry.bestScore, item.relevanceScore ?? 0)
    fileMap.set(item.filePath, fileEntry)

    const evidenceType = item.evidenceType || 'OTHER'
    evidenceTypeMap.set(evidenceType, (evidenceTypeMap.get(evidenceType) || 0) + 1)
  }

  for (const item of primaryItems) {
    const score = item.relevanceScore ?? 0
    totalScore += score
    topScore = Math.max(topScore, score)
    if (item.hasEmbedding) embeddedCount += 1
    if (score < 45) lowConfidenceCount += 1
  }

  const evidenceTypeStats = Array.from(evidenceTypeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))

  const fileStats = Array.from(fileMap.values())
    .sort((a, b) => b.count - a.count || b.bestScore - a.bestScore || a.filePath.localeCompare(b.filePath))

  return {
    avgScore: primaryItems.length ? Math.round(totalScore / primaryItems.length) : 0,
    dominantEvidenceType: evidenceTypeStats[0]?.type || 'OTHER',
    embeddedCount,
    evidenceTypeStats,
    fileStats,
    lineSpan,
    lowConfidenceCount,
    topScore,
    uniqueFiles: fileMap.size,
  }
}

function buildChunkEvidenceCombination(items: CodeChunkSearchItem[]): ChunkEvidenceCombination | null {
  if (!items.length) return null

  const primaryItems = items.filter(item => !isContextChunk(item))
  const contextItems = items.filter(isContextChunk)
  const topChunk = [...(primaryItems.length > 0 ? primaryItems : items)]
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))[0]
  const uniqueFiles = Array.from(new Set(items.map(item => item.filePath).filter(Boolean)))
  const embeddedCount = items.filter(item => item.hasEmbedding).length
  const rolePath = [
    primaryItems.length > 0 ? `主证据 ${primaryItems.length}` : '',
    contextItems.length > 0 ? `上下文 ${contextItems.length}` : '',
    uniqueFiles.length > 1 ? `跨文件 ${uniqueFiles.length}` : '单文件路径',
  ].filter(Boolean)

  const tone: QaSignalTone = primaryItems.length > 0 && uniqueFiles.length > 1 && embeddedCount > 0
    ? 'ready'
    : primaryItems.length > 0 && embeddedCount > 0
      ? 'ready'
      : primaryItems.length > 0
        ? 'warning'
        : 'idle'

  const label = tone === 'ready'
    ? uniqueFiles.length > 1 ? '跨文件复核路径' : '主证据路径'
    : tone === 'warning'
      ? '主证据待复核'
      : '上下文线索'

  const topReference = topChunk ? chunkLineReference(topChunk) : '-'
  const topSourceLabel = topChunk?.sourceLabel || (topChunk ? 'C1' : '-')
  const fileCoverage = uniqueFiles.slice(0, 4).map(filePath => compactPath(filePath))
  const summary = primaryItems.length > 0
    ? `${topSourceLabel} 是当前阅读入口，${contextItems.length > 0 ? '结合相邻上下文复核调用链' : '先确认主证据职责与边界'}；覆盖 ${uniqueFiles.length} 个文件，${embeddedCount}/${items.length} 条含向量证据。`
    : `当前结果主要是上下文线索；覆盖 ${uniqueFiles.length} 个文件，建议补充类名、方法名或 file:line 后重新检索。`
  const nextAction = primaryItems.length > 0
    ? `先阅读 ${topSourceLabel}，再按文件覆盖顺序复核 ${fileCoverage.join(' / ') || '当前文件'}。`
    : '换用更具体的类名、方法名或报告证据行号重新检索。'
  const nextQuestions = primaryItems.length > 0
    ? [
        `解释 ${topSourceLabel} 的职责和关键分支`,
        contextItems.length > 0 ? '把主证据和相邻上下文串成调用链' : '补充搜索同名 Service / Repository 上下游',
        uniqueFiles.length > 1 ? '对比跨文件证据是否支持同一个结论' : '用 file:line 继续定位同文件相邻代码',
      ]
    : [
        '换用更具体的类名或方法名重新检索',
        '粘贴报告里的 file:line 作为证据锚点',
        '先查看最新成功扫描是否已生成 code_chunks',
      ]

  return {
    tone,
    label,
    summary,
    nextAction,
    primaryCount: primaryItems.length,
    contextCount: contextItems.length,
    uniqueFiles: uniqueFiles.length,
    embeddedCount,
    topSourceLabel,
    topReference,
    fileCoverage,
    rolePath,
    nextQuestions,
  }
}

function classifyCodeUnderstandingQuery(query: string): CodeUnderstandingQuerySignal {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      kind: 'IDLE',
      label: '等待定位',
      title: '粘贴代码锚点开始定位',
      hint: '支持 file:line、Class#method 和 Java/browser stack frame，定位结果仍以当前扫描 code_chunks 为准。',
    }
  }

  const hasStackFrame = trimmed.split(/\r?\n/).some(line => /^\s*at\s+\S+/.test(line))
    || /\bat\s+\S+[\s\S]*\([^()]+:\d+(?::\d+)?\)/.test(trimmed)
    || /\b[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?@(?:[a-z][a-z0-9+.-]*:\/\/)?[^\s)]+\.(?:java|kt|tsx|ts|jsx|js|vue|py|go|rs)(?:[?#][^\s):]*)?:\d+(?::\d+)?/.test(trimmed)
  if (hasStackFrame) {
    return {
      kind: 'STACK_TRACE',
      label: '栈帧定位',
      title: '按栈帧回查代码位置',
      hint: '只展示命中的文件、行号、证据角色和召回状态，不把原始栈帧写入证据 marker。',
    }
  }

  if (/(?:^|\s)[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*#[A-Za-z_$][\w$]*(?:\s|$|\()/.test(trimmed)
    || /\b[A-Z][A-Za-z0-9_$]*(?:Controller|Service|Repository|Mapper|Config)?\.[A-Za-z_$][\w$]*\s*\(/.test(trimmed)) {
    return {
      kind: 'METHOD_ANCHOR',
      label: '方法锚点',
      title: '按类名与方法名定位',
      hint: '适合从 Class#method 或异常栈里的 handler method 进入主证据。',
    }
  }

  if (/(?:^|\s|[("'])[^()\s"']+\.[A-Za-z0-9]+:\d+(?::\d+)?(?:\s|$|[)"'])/.test(trimmed)) {
    return {
      kind: 'FILE_LINE',
      label: '文件行号',
      title: '按 file:line 定位',
      hint: '适合从报告风险、日志或 IDE 跳转位置回到当前扫描证据。',
    }
  }

  return {
    kind: 'GENERAL',
    label: '关键词检索',
    title: '按关键词理解代码',
    hint: '建议补充类名、方法名、文件路径或行号，让证据闭环更稳定。',
  }
}

function chunkAdoptionSignal(chunk: CodeChunkSearchItem): { tone: 'ready' | 'warning' | 'idle'; text: string } {
  if (isContextChunk(chunk)) {
    return { tone: 'idle', text: '相邻代码上下文，用于补全类成员、方法前后文和调用链，不单独作为结论依据。' }
  }
  const score = chunk.relevanceScore ?? 0
  const matchedTerms = chunk.matchedTerms?.length || 0
  if (score >= 80 && chunk.hasEmbedding) {
    return { tone: 'ready', text: '高相关且含向量证据，可优先作为回答依据。' }
  }
  if (score >= 60 || matchedTerms >= 2) {
    return { tone: 'warning', text: '证据可用，建议结合相邻代码或文件上下文复核。' }
  }
  return { tone: 'idle', text: '相关性偏弱，适合作为补充线索，不建议单独采纳。' }
}

function ProjectFlowStage({
  icon,
  label,
  value,
  meta,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  meta: string
  tone: 'ready' | 'attention' | 'idle'
}) {
  return (
    <div className={`sl-project-flow-stage sl-project-flow-stage-${tone}`}>
      <div className="sl-project-flow-icon">{icon}</div>
      <div className="sl-project-flow-copy">
        <div className="sl-project-flow-label">{label}</div>
        <div className="sl-project-flow-value">{value}</div>
        <div className="sl-project-flow-meta">{meta}</div>
      </div>
    </div>
  )
}

function ProjectTrustedLoopPanel({ steps }: { steps: ProjectTrustedLoopStep[] }) {
  return (
    <section className="sl-project-trusted-loop" aria-label="项目可信工程闭环">
      <div className="sl-project-trusted-loop-head">
        <div>
          <span>Trusted Engineering Loop</span>
          <h2>项目主链路闭环</h2>
        </div>
        <p>把项目从仓库接入、源码理解、修复候选到安全审计串成一条可追踪流程，避免用户在功能页之间迷路。</p>
      </div>
      <div className="sl-project-trusted-loop-grid">
        {steps.map(step => (
          <article className={`sl-project-trusted-loop-step sl-project-trusted-loop-step-${step.tone}`} key={step.key}>
            <div className="sl-project-trusted-loop-index">{step.index}</div>
            <div className="sl-project-trusted-loop-copy">
              <div className="sl-project-trusted-loop-meta">
                <span>{step.owner}</span>
                <Tag color={step.tone === 'ready' ? 'success' : step.tone === 'attention' ? 'warning' : 'default'}>{step.value}</Tag>
              </div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              <ActionButton size="small" icon={<ArrowActionIcon tone={step.tone} />} onClick={step.onAction} label={step.actionLabel} />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ArrowActionIcon({ tone }: { tone: ProjectTrustedLoopStep['tone'] }) {
  if (tone === 'ready') return <CheckCircleOutlined />
  if (tone === 'attention') return <SearchOutlined />
  return <ScheduleOutlined />
}

function ProjectWorkspaceNextActionRail({
  action,
  primaryLoading,
  onPrimary,
  onSecondary,
}: {
  action: ProjectWorkspaceNextAction
  primaryLoading: boolean
  onPrimary: () => void
  onSecondary: () => void
}) {
  return (
    <section
      className={`sl-project-next-action sl-project-next-action-${action.tone}`}
      aria-label="项目下一步行动"
      data-sl-action-key={action.key}
      data-sl-primary-count="1"
    >
      <div className="sl-project-next-action-main">
        <div className="sl-project-next-action-icon">{action.primaryIcon}</div>
        <div className="sl-project-next-action-copy">
          <div className="sl-project-next-action-label">Next action</div>
          <h2>{action.title}</h2>
          <p>{action.summary}</p>
          <div className="sl-project-next-action-tags">
            <Tag color={analysisReadinessColor(action.tone)}>{action.evidenceMaturity}</Tag>
            <Tag color={action.tone === 'danger' ? 'red' : action.tone === 'warning' ? 'gold' : 'green'}>{action.blocker}</Tag>
          </div>
        </div>
      </div>

      <div className="sl-project-next-action-actions">
        <ActionButton
          type="primary"
          icon={action.primaryIcon}
          loading={primaryLoading}
          disabled={action.primaryDisabled}
          onClick={onPrimary}
          label={action.primaryLabel}
        />
        {action.secondaryLabel && action.secondaryIcon && (
          <ActionButton
            icon={action.secondaryIcon}
            disabled={action.secondaryDisabled}
            onClick={onSecondary}
            label={action.secondaryLabel}
          />
        )}
      </div>

      <div className="sl-project-next-action-checks" aria-label="项目下一步证据检查">
        {action.checks.map(check => (
          <div className={`sl-project-next-action-check ${check.ready ? 'sl-project-next-action-check-ready' : 'sl-project-next-action-check-gap'}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function AnalysisReadinessPanel({
  signal,
  onOpenArtifacts,
  onOpenQa,
  onOpenGraph,
  onOpenScan,
}: {
  signal: AnalysisReadinessSignal
  onOpenArtifacts: () => void
  onOpenQa: () => void
  onOpenGraph: () => void
  onOpenScan: () => void
}) {
  return (
    <section className={`sl-analysis-readiness sl-analysis-readiness-${signal.tone}`} aria-label="分析就绪度">
      <div className="sl-analysis-readiness-main">
        <div>
          <div className="sl-kicker">Analysis Readiness</div>
          <h2>{signal.title}</h2>
          <p>{signal.summary}</p>
          <div className="sl-analysis-readiness-tags">
            <Tag color={analysisReadinessColor(signal.tone)}>{signal.readinessLabel}</Tag>
            <Tag>{signal.coreReadyCount}/{signal.coreTotalCount} 核心产物</Tag>
            {signal.missingCoreArtifacts.slice(0, 2).map(type => (
              <Tag key={type} color="orange">缺 {artifactDisplayName(type)}</Tag>
            ))}
          </div>
        </div>
        <div className="sl-analysis-readiness-score">
          <span>可信度</span>
          <strong>{signal.confidence}%</strong>
        </div>
      </div>

      <div className="sl-analysis-readiness-metrics">
        {signal.metrics.map(metric => (
          <div className={`sl-analysis-readiness-metric sl-analysis-readiness-metric-${metric.tone}`} key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className="sl-analysis-readiness-actions">
        <div>
          <CheckCircleOutlined />
          <span>{signal.nextAction}</span>
        </div>
        <Space wrap>
          <ActionButton icon={<DatabaseOutlined />} disabled={signal.coreReadyCount === 0} onClick={onOpenArtifacts} label="产物证据" />
          <ActionButton icon={<SendOutlined />} disabled={signal.tone === 'idle'} onClick={onOpenQa} label="代码问答" />
          <ActionButton icon={<BranchesOutlined />} disabled={signal.tone === 'idle'} onClick={onOpenGraph} label="依赖图谱" />
          <ActionButton icon={<FileTextOutlined />} disabled={signal.tone === 'idle'} onClick={onOpenScan} label="扫描详情" />
        </Space>
      </div>
    </section>
  )
}

function ScanSummary({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="sl-scan-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function buildProjectWorkspaceNextAction({
  activeScanCount,
  analysisReadiness,
  codeKnowledgeStatus,
  latestScan,
  latestSuccessScan,
  primaryRepo,
  repos,
  scans,
  staleRefreshError,
}: {
  activeScanCount: number
  analysisReadiness: AnalysisReadinessSignal
  codeKnowledgeStatus: ProjectCodeKnowledgeStatus
  latestScan?: ScanTask
  latestSuccessScan?: ScanTask
  primaryRepo: Repository | null
  repos: Repository[]
  scans: ScanTask[]
  staleRefreshError?: string | null
}): ProjectWorkspaceNextAction {
  const repositoryReady = Boolean(primaryRepo)
  const hasSuccessfulScan = Boolean(latestSuccessScan)
  const hasCodeChunks = codeKnowledgeStatus.totalChunks > 0
  const coreReady = analysisReadiness.coreReadyCount
  const coreTotal = analysisReadiness.coreTotalCount
  const repoLabel = primaryRepo ? `${primaryRepo.owner}/${primaryRepo.name}` : '未接入'
  const checks = [
    { label: '仓库', value: repoLabel, ready: repositoryReady },
    { label: '扫描', value: hasSuccessfulScan ? `成功 #${latestSuccessScan?.id}` : latestScan ? formatStatusLabel(latestScan.status) : '无记录', ready: hasSuccessfulScan },
    { label: 'code_chunks', value: codeKnowledgeStatus.value, ready: codeKnowledgeStatus.tone !== 'danger' && hasCodeChunks },
    { label: '核心产物', value: `${coreReady}/${coreTotal}`, ready: coreReady === coreTotal && coreTotal > 0 },
  ]
  const evidenceMaturity = `${coreReady}/${coreTotal} 核心证据`

  if (staleRefreshError) {
    return {
      key: 'STALE_REFRESH',
      tone: 'danger',
      title: '先重新同步项目数据',
      summary: `当前保留的是上次可信快照，本次核心数据刷新失败：${staleRefreshError}`,
      blocker: '数据非最新',
      evidenceMaturity,
      primaryLabel: '重新同步',
      primaryIcon: <ReloadOutlined />,
      checks,
    }
  }

  if (!repositoryReady || repos.length === 0) {
    return {
      key: 'ADD_REPOSITORY',
      tone: 'idle',
      title: '先接入一个公开仓库',
      summary: '没有仓库时，扫描、code_chunks、报告和代码问答都没有可信输入源。',
      blocker: '缺少仓库',
      evidenceMaturity,
      primaryLabel: '添加仓库',
      primaryIcon: <PlusOutlined />,
      secondaryLabel: '查看仓库入口',
      secondaryIcon: <FolderOutlined />,
      checks,
    }
  }

  if (!latestScan || scans.length === 0) {
    return {
      key: 'START_SCAN',
      tone: 'warning',
      title: '触发第一次仓库扫描',
      summary: `${repoLabel} 已接入，下一步应生成扫描任务和基础产物。`,
      blocker: '缺少扫描',
      evidenceMaturity,
      primaryLabel: '触发扫描',
      primaryIcon: <SearchOutlined />,
      secondaryLabel: '查看仓库',
      secondaryIcon: <FolderOutlined />,
      checks,
    }
  }

  if (activeScanCount > 0 && latestScan.status !== 'SUCCESS') {
    return {
      key: 'WATCH_SCAN',
      tone: 'warning',
      title: '等待当前扫描完成',
      summary: `Scan #${latestScan.id} 当前为${formatStatusLabel(latestScan.status)}，报告和代码问答必须等任务闭环后再判断。`,
      blocker: '扫描运行中',
      evidenceMaturity,
      primaryLabel: '查看扫描进度',
      primaryIcon: <ScheduleOutlined />,
      secondaryLabel: '查看扫描列表',
      secondaryIcon: <SearchOutlined />,
      checks,
    }
  }

  if (!hasSuccessfulScan || latestScan.status === 'FAILED') {
    return {
      key: 'REVIEW_FAILED_SCAN',
      tone: 'danger',
      title: '先复盘失败扫描',
      summary: latestScan.errorMessage || `Scan #${latestScan.id} 没有形成可用报告，需要先定位失败步骤。`,
      blocker: '扫描失败',
      evidenceMaturity,
      primaryLabel: '打开失败详情',
      primaryIcon: <FileTextOutlined />,
      secondaryLabel: '重新扫描',
      secondaryIcon: <ReloadOutlined />,
      checks,
    }
  }

  if (analysisReadiness.tone !== 'ready' || codeKnowledgeStatus.tone !== 'ready') {
    return {
      key: 'OPEN_ARTIFACTS',
      tone: analysisReadiness.tone === 'danger' || codeKnowledgeStatus.tone === 'danger' ? 'danger' : 'warning',
      title: '补齐报告和代码证据',
      summary: analysisReadiness.nextAction || codeKnowledgeStatus.nextAction,
      blocker: analysisReadiness.tone === 'danger' || codeKnowledgeStatus.tone === 'danger' ? '证据缺口' : '需要复核',
      evidenceMaturity,
      primaryLabel: '打开产物证据',
      primaryIcon: <DatabaseOutlined />,
      primaryDisabled: !latestSuccessScan,
      secondaryLabel: '查看最新报告',
      secondaryIcon: <FileTextOutlined />,
      secondaryDisabled: !latestSuccessScan,
      checks,
    }
  }

  return {
    key: 'OPEN_QA',
    tone: 'ready',
    title: '进入代码问答复核',
    summary: '仓库、成功扫描、code_chunks 和核心报告证据已经就绪，可以开始带引用的代码理解和报告复盘。',
    blocker: '无阻塞',
    evidenceMaturity,
    primaryLabel: '进入代码问答',
    primaryIcon: <SendOutlined />,
    secondaryLabel: '打开最新报告',
    secondaryIcon: <FileTextOutlined />,
    checks,
  }
}

function buildProjectCodeKnowledgeStatus(
  response: CodeChunkSearchResponse | null,
  loading: boolean,
  error: string | null,
  scanTaskId: number | null
): ProjectCodeKnowledgeStatus {
  if (!scanTaskId) {
    return {
      tone: 'idle',
      flowTone: 'idle',
      value: '-',
      meta: '等待成功扫描',
      label: '未生成',
      summary: '项目还没有成功扫描，暂时无法建立代码知识库。',
      nextAction: '先接入公开仓库并完成一次成功扫描。',
      totalChunks: 0,
      embeddedChunks: 0,
      embeddingCoverage: 0,
      retrievalMode: null,
    }
  }

  if (loading) {
    return {
      tone: 'idle',
      flowTone: 'idle',
      value: '...',
      meta: `读取扫描 #${scanTaskId}`,
      label: '检查中',
      summary: '正在读取 code_chunks 状态。',
      nextAction: '等待知识库状态返回。',
      totalChunks: 0,
      embeddedChunks: 0,
      embeddingCoverage: 0,
      retrievalMode: null,
    }
  }

  if (error) {
    return {
      tone: 'danger',
      flowTone: 'attention',
      value: '异常',
      meta: '状态加载失败',
      label: '不可判定',
      summary: error,
      nextAction: '刷新项目数据或检查 code_chunks 检索接口。',
      totalChunks: 0,
      embeddedChunks: 0,
      embeddingCoverage: 0,
      retrievalMode: null,
    }
  }

  const totalChunks = response?.totalChunks ?? 0
  const embeddedChunks = response?.embeddedChunks ?? 0
  const embeddingCoverage = totalChunks > 0 ? Math.round((embeddedChunks / totalChunks) * 100) : 0
  const retrievalMode = response?.retrievalMode || null

  if (totalChunks <= 0) {
    return {
      tone: 'danger',
      flowTone: 'attention',
      value: '0',
      meta: `扫描 #${scanTaskId} 缺少切片`,
      label: '切片缺失',
      summary: '最新成功扫描没有生成 code_chunks，RAG 问答和证据检索不可用。',
      nextAction: '重新扫描并检查 chunk_code 步骤、文件过滤规则或切片落库。',
      totalChunks,
      embeddedChunks,
      embeddingCoverage,
      retrievalMode,
    }
  }

  if (embeddedChunks <= 0) {
    return {
      tone: 'warning',
      flowTone: 'attention',
      value: totalChunks.toLocaleString(),
      meta: '向量 0%，关键词可用',
      label: '基础切片可用',
      summary: `最新扫描已生成 ${totalChunks.toLocaleString()} 个 code_chunks，但尚未生成 embedding。`,
      nextAction: '可先使用关键词检索；后续补齐 embedding 以提升语义召回。',
      totalChunks,
      embeddedChunks,
      embeddingCoverage,
      retrievalMode,
    }
  }

  return {
    tone: embeddingCoverage >= 60 ? 'ready' : 'warning',
    flowTone: embeddingCoverage >= 60 ? 'ready' : 'attention',
    value: totalChunks.toLocaleString(),
    meta: `向量 ${embeddingCoverage}%`,
    label: embeddingCoverage >= 60 ? '知识库可用' : '向量覆盖偏低',
    summary: `最新扫描已生成 ${totalChunks.toLocaleString()} 个 code_chunks，${embeddedChunks.toLocaleString()} 个已向量化。`,
    nextAction: embeddingCoverage >= 60
      ? '可以进入代码问答、证据检索和报告复盘。'
      : '继续补齐 chunk embedding，提高语义召回稳定性。',
    totalChunks,
    embeddedChunks,
    embeddingCoverage,
    retrievalMode,
  }
}

function buildAnalysisReadinessSignal({
  activeScanCount,
  codeKnowledgeStatus,
  latestArtifacts,
  latestScan,
  latestSuccessScan,
  overview,
  reportQuality,
}: {
  activeScanCount: number
  codeKnowledgeStatus: ProjectCodeKnowledgeStatus
  latestArtifacts: ArtifactRecord[]
  latestScan?: ScanTask
  latestSuccessScan?: ScanTask
  overview: OverviewData | null
  reportQuality: ReportQualityData | null
}): AnalysisReadinessSignal {
  if (!latestScan) {
    return {
      tone: 'idle',
      title: '等待第一次扫描',
      summary: '当前项目还没有扫描记录。',
      confidence: 0,
      readinessLabel: '未开始',
      coreReadyCount: 0,
      coreTotalCount: CORE_ARTIFACT_TYPES.length,
      missingCoreArtifacts: CORE_ARTIFACT_TYPES,
      nextAction: '接入仓库并启动扫描。',
      metrics: [
        { label: '扫描', value: '0', tone: 'idle' },
        { label: '报告', value: '-', tone: 'idle' },
        { label: '证据', value: '0', tone: 'idle' },
        { label: 'code_chunks', value: codeKnowledgeStatus.value, tone: codeKnowledgeStatus.tone },
        { label: '代码规模', value: '-', tone: 'idle' },
      ],
    }
  }

  if (activeScanCount > 0 && latestScan.status !== 'SUCCESS') {
    return {
      tone: 'warning',
      title: '扫描正在运行',
      summary: `当前状态：${formatStatusLabel(latestScan.status)}。`,
      confidence: 20,
      readinessLabel: '生成中',
      coreReadyCount: 0,
      coreTotalCount: CORE_ARTIFACT_TYPES.length,
      missingCoreArtifacts: CORE_ARTIFACT_TYPES,
      nextAction: '等待扫描完成后复核产物证据。',
      metrics: [
        { label: '扫描', value: formatStatusLabel(latestScan.status), tone: 'warning' },
        { label: '报告', value: '生成中', tone: 'warning' },
        { label: '证据', value: '待产出', tone: 'warning' },
        { label: 'code_chunks', value: codeKnowledgeStatus.value, tone: codeKnowledgeStatus.tone },
        { label: '代码规模', value: '-', tone: 'idle' },
      ],
    }
  }

  if (!latestSuccessScan) {
    return {
      tone: 'danger',
      title: '扫描未形成可用报告',
      summary: latestScan.errorMessage || '最近一次扫描没有成功完成。',
      confidence: 8,
      readinessLabel: '失败',
      coreReadyCount: 0,
      coreTotalCount: CORE_ARTIFACT_TYPES.length,
      missingCoreArtifacts: CORE_ARTIFACT_TYPES,
      nextAction: '打开扫描详情定位失败步骤。',
      metrics: [
        { label: '扫描', value: formatStatusLabel(latestScan.status), tone: 'danger' },
        { label: '报告', value: '不可用', tone: 'danger' },
        { label: '证据', value: '0', tone: 'danger' },
        { label: 'code_chunks', value: codeKnowledgeStatus.value, tone: codeKnowledgeStatus.tone },
        { label: '代码规模', value: '-', tone: 'idle' },
      ],
    }
  }

  const artifactTypes = new Set(latestArtifacts.map(item => item.artifactType))
  const missingCoreArtifacts = CORE_ARTIFACT_TYPES.filter(type => !artifactTypes.has(type))
  const coreReadyCount = CORE_ARTIFACT_TYPES.length - missingCoreArtifacts.length
  const normalizedConfidence = normalizeConfidence(reportQuality?.confidence)
  const hasReportRisk = reportQuality?.readiness === 'RISK' || reportQuality?.readiness === 'GAP'
  const hasMissingCore = missingCoreArtifacts.length > 0
  const hasKnowledgeGap = codeKnowledgeStatus.tone === 'danger'
  const hasKnowledgeWarning = codeKnowledgeStatus.tone === 'warning'
  const tone: AnalysisReadinessTone = hasMissingCore || hasKnowledgeGap
    ? 'danger'
    : hasReportRisk || hasKnowledgeWarning || normalizedConfidence < 65
      ? 'warning'
      : 'ready'
  const nextAction = reportQuality?.nextActions?.[0]
    || (hasMissingCore
      ? `补齐核心产物：${missingCoreArtifacts.map(artifactDisplayName).join('、')}`
      : hasKnowledgeGap || hasKnowledgeWarning
        ? codeKnowledgeStatus.nextAction
      : tone === 'ready'
        ? '进入代码问答、依赖图谱或报告复盘。'
        : '复核报告缺口并补充证据。')
  const confidence = Math.min(
    normalizedConfidence,
    codeKnowledgeStatus.tone === 'danger'
      ? 45
      : codeKnowledgeStatus.tone === 'warning'
        ? 72
        : 100
  )

  return {
    tone,
    title: tone === 'ready'
      ? '分析证据可用'
      : tone === 'warning'
        ? '报告需要复核'
        : '核心证据缺失',
    summary: hasKnowledgeGap
      ? codeKnowledgeStatus.summary
      : reportQuality?.summary || `最新成功扫描 #${latestSuccessScan.id} 已生成 ${latestArtifacts.length} 个产物。`,
    confidence,
    readinessLabel: reportQuality?.readiness ? reportQuality.readiness : tone === 'ready' ? 'READY' : 'REVIEW',
    coreReadyCount,
    coreTotalCount: CORE_ARTIFACT_TYPES.length,
    missingCoreArtifacts,
    nextAction,
    metrics: [
      { label: '核心产物', value: `${coreReadyCount}/${CORE_ARTIFACT_TYPES.length}`, tone: hasMissingCore ? 'danger' : 'ready' },
      { label: '报告质量', value: reportQuality?.readiness || '-', tone: hasReportRisk ? 'warning' : 'ready' },
      { label: '缺口', value: String((reportQuality?.gaps?.length || 0) + missingCoreArtifacts.length), tone: ((reportQuality?.gaps?.length || 0) + missingCoreArtifacts.length) > 0 ? 'warning' : 'ready' },
      { label: 'code_chunks', value: codeKnowledgeStatus.value, tone: codeKnowledgeStatus.tone },
      { label: '代码规模', value: overview ? `${overview.totalFiles.toLocaleString()} 文件` : '-', tone: overview ? 'ready' : 'idle' },
    ],
  }
}

function normalizeReportQuality(value: any): ReportQualityData | null {
  if (!value || typeof value !== 'object') return null
  return {
    readiness: String(value.readiness || 'REVIEW'),
    confidence: Number(value.confidence || 0),
    summary: String(value.summary || ''),
    gaps: Array.isArray(value.gaps) ? value.gaps.map(String).filter(Boolean) : [],
    nextActions: Array.isArray(value.nextActions) ? value.nextActions.map(String).filter(Boolean) : [],
    evidenceChecks: Array.isArray(value.evidenceChecks) ? value.evidenceChecks : [],
  }
}

function normalizeConfidence(value?: number | null): number {
  if (!Number.isFinite(value ?? NaN)) return 0
  const numeric = Number(value)
  const percent = numeric <= 10 ? numeric * 10 : numeric
  return Math.max(0, Math.min(100, Math.round(percent)))
}

function analysisReadinessColor(tone: AnalysisReadinessTone): string {
  if (tone === 'ready') return 'green'
  if (tone === 'warning') return 'gold'
  if (tone === 'danger') return 'red'
  return 'default'
}

function artifactDisplayName(type: string): string {
  const labels: Record<string, string> = {
    RAW_SCAN_RESULT: '原始扫描',
    ARCHITECTURE_OVERVIEW: '架构概览',
    ARCHITECTURE_REPORT: '架构报告',
    API_CATALOG: 'API',
    DB_SCHEMA: '数据库',
    CODE_METRICS: '代码指标',
    DEPENDENCY_GRAPH: '依赖图谱',
  }
  return labels[type] || type
}

function InsightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="sl-insight-card">
      <div className="sl-insight-label">{label}</div>
      <div className="sl-insight-value" title={value}>{value}</div>
    </div>
  )
}

function CodeQaTab({
  projectId,
  repositories,
  scanTasks,
  scanTaskId,
  knowledgeStatus,
  knowledgeLoading,
  knowledgeError,
  initialQuestion,
}: {
  projectId: number
  repositories: Repository[]
  scanTasks: ScanTask[]
  scanTaskId?: number | null
  knowledgeStatus: CodeChunkSearchResponse | null
  knowledgeLoading: boolean
  knowledgeError: string | null
  initialQuestion?: string | null
}) {
  const navigate = useNavigate()
  const initialQuestionText = useMemo(() => (initialQuestion || '').trim(), [initialQuestion])
  const [qaSearchParams, setQaSearchParams] = useSearchParams()
  const [messages, setMessages] = useState<QaMessage[]>([
    { role: 'assistant', content: '您好！我是您的代码库智能助手。您已开启本地 RAG 问答，我可以基于本项目已扫描的代码文件为您解答关于架构设计、实现细节或开发建议的问题。请问有什么我可以帮您的？' }
  ])
  const [question, setQuestion] = useState(initialQuestionText)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialQuestionText)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<CodeChunkSearchResponse | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchFailedQuery, setSearchFailedQuery] = useState<string | null>(null)
  const [qaRequestError, setQaRequestError] = useState<{ question: string; message: string } | null>(null)
  const [manualCopyText, setManualCopyText] = useState<{ title: string; text: string } | null>(null)
  const evidenceRef = useMemo(() => normalizeEvidenceRef({
    category: qaSearchParams.get('evidenceCategory') || undefined,
    source: qaSearchParams.get('evidenceSource') || undefined,
    title: qaSearchParams.get('evidenceTitle') || undefined,
    summary: qaSearchParams.get('evidenceSummary') || undefined,
    filePath: qaSearchParams.get('evidenceFile') || undefined,
    lineNumber: qaSearchParams.get('evidenceLine') || undefined,
    startLine: parsePositiveInt(qaSearchParams.get('evidenceStartLine')),
    endLine: parsePositiveInt(qaSearchParams.get('evidenceEndLine')),
  }), [qaSearchParams])
  const evidenceRefLineInfo = useMemo(() => evidenceLineInfo(evidenceRef), [evidenceRef])

  const executeChunkSearch = useCallback(async (queryText: string, silent = false) => {
    if (!queryText) {
      if (!silent) message.warning('请输入要检索的代码关键词')
      return
    }
    setSearchLoading(true)
    setSearchError(null)
    try {
      const res = await codeChunkApi.search(projectId, { query: queryText, scanTaskId: scanTaskId || undefined, limit: 8 })
      setSearchResult(res.data.data)
      setSearchQuery(queryText)
      setSearchFailedQuery(null)
    } catch (error) {
      const errMsg = formatApiError(error, '代码切片检索失败')
      setSearchError(errMsg)
      setSearchFailedQuery(queryText)
      if (!silent) showApiError(error, '代码切片检索失败')
    } finally {
      setSearchLoading(false)
    }
  }, [projectId, scanTaskId])

  const runChunkSearch = useCallback((overrideQuery?: string, silent = false) => {
    const queryText = (overrideQuery ?? searchQuery).trim()
    return executeChunkSearch(queryText, silent)
  }, [executeChunkSearch, searchQuery])

  useEffect(() => {
    if (!initialQuestionText) return
    setQuestion(initialQuestionText)
    setSearchQuery(initialQuestionText)
    void executeChunkSearch(initialQuestionText, true)
  }, [executeChunkSearch, initialQuestionText])

  const submitQuestion = async (overrideQuestion?: string) => {
    const curQuestion = (overrideQuestion ?? question).trim()
    if (!curQuestion || loading) return
    setQuestion('')
    setQaRequestError(null)
    setMessages(prev => [...prev, { role: 'user', content: curQuestion }])
    setLoading(true)
    void runChunkSearch(curQuestion, true)

    try {
      const res = await projectApi.codeQa(projectId, curQuestion, scanTaskId, evidenceRef)
      const qa = res.data.data
      const answer = qa?.answer || '未获取到有效回答'
      const chunks = qa?.retrievedChunks || []
      setQaRequestError(null)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: answer,
        chunks,
        answerCitations: qa?.answerCitations || [],
        scanTaskId: qa?.scanTaskId,
        retrievalMode: qa?.retrievalMode,
        groundingStatus: qa?.groundingStatus,
        citationEnforcementStatus: qa?.citationEnforcementStatus,
        citationEnforcementReason: qa?.citationEnforcementReason,
        citationEnforcementNote: qa?.citationEnforcementNote,
        citationCoverage: qa?.citationCoverage,
        claimCitationCoverage: qa?.claimCitationCoverage,
        sourceEvidenceRef: qa?.sourceEvidenceRef,
        sourceEvidenceMatched: qa?.sourceEvidenceMatched,
        sourceEvidenceMatchType: qa?.sourceEvidenceMatchType,
        evidenceProfile: qa?.evidenceProfile,
      }])
      if (qa) {
        setSearchError(null)
        setSearchResult({
          scanTaskId: qa.scanTaskId,
          query: qa.question || curQuestion,
          limit: chunks.length,
          total: qa.matchedChunks ?? chunks.length,
          resultCount: qa.resultCount ?? chunks.length,
          retrievalMode: qa.retrievalMode,
          totalChunks: qa.totalChunks ?? chunks.length,
          embeddedChunks: qa.embeddedChunks ?? chunks.filter(chunk => chunk.hasEmbedding).length,
          truncated: qa.truncated ?? false,
          evidenceProfile: qa.evidenceProfile,
          items: chunks,
        })
      }
    } catch (error) {
      const errMsg = formatApiError(error, '请求失败，请检查大模型配置或网络连接。')
      setQaRequestError({ question: curQuestion, message: errMsg })
      setMessages(prev => [...prev, { role: 'assistant', content: `问答请求发生错误：${errMsg}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => {
    void submitQuestion()
  }

  const baselineKnowledge = searchResult || knowledgeStatus
  const activeSourceScanTaskId = baselineKnowledge?.scanTaskId ?? scanTaskId ?? null
  const evidenceBridgeScanTaskId = activeSourceScanTaskId || scanTaskId || null
  const evidenceBridgeQuery = useMemo(
    () => buildEvidenceBridgeSearchQuery(evidenceRef, searchQuery || initialQuestionText || question),
    [evidenceRef, initialQuestionText, question, searchQuery]
  )
  const resultCount = searchResult?.resultCount ?? searchResult?.items.length ?? 0
  const matchedCount = searchResult?.total ?? resultCount
  const displayedMatchedCount = Math.max(matchedCount, resultCount)
  const retrievalMode = baselineKnowledge?.retrievalMode
  const evidenceUnitLabel = retrievalMode === 'SEMANTIC_FALLBACK' || retrievalMode === 'STABLE_FALLBACK' ? '证据' : '匹配'
  const totalChunks = baselineKnowledge?.totalChunks ?? 0
  const embeddedChunks = baselineKnowledge?.embeddedChunks ?? 0
  const embeddingCoverage = totalChunks > 0 ? Math.round((embeddedChunks / totalChunks) * 100) : 0
  const serverEvidenceProfile = searchResult?.evidenceProfile || (!searchResult ? knowledgeStatus?.evidenceProfile : undefined)
  const evidenceProfile = useMemo(
    () => serverEvidenceProfile
      ? toChunkEvidenceProfile(serverEvidenceProfile)
      : buildChunkEvidenceProfile(searchResult?.items || []),
    [searchResult?.items, serverEvidenceProfile]
  )
  const evidenceCombination = useMemo(
    () => buildChunkEvidenceCombination(searchResult?.items || []),
    [searchResult?.items]
  )
  const displayEvidenceRef = useMemo(
    () => evidenceRef ? redactedEvidenceRefForOutput(evidenceRef) : null,
    [evidenceRef]
  )
  const ragQuality = buildRagQualitySignal({
    retrievalMode,
    resultCount,
    displayedMatchedCount,
    totalChunks,
    embeddedChunks,
    embeddingCoverage,
    truncated: searchResult?.truncated ?? false,
    serverProfile: serverEvidenceProfile,
  })
  const starterPrompts = useMemo(() => buildQaStarterPrompts({
    knowledgeLoading,
    knowledgeError,
    scanTaskId: activeSourceScanTaskId,
    totalChunks,
    embeddedChunks,
    embeddingCoverage,
    retrievalMode,
    ragQuality,
  }), [
    activeSourceScanTaskId,
    embeddedChunks,
    embeddingCoverage,
    knowledgeError,
    knowledgeLoading,
    ragQuality,
    retrievalMode,
    totalChunks,
  ])

  const playbookTone = knowledgeError || totalChunks <= 0
    ? 'warning'
    : embeddingCoverage >= 60
      ? 'ready'
      : embeddedChunks > 0
        ? 'warning'
        : 'idle'
  const playbookLabel = knowledgeError
    ? '知识库异常'
    : totalChunks <= 0
      ? '切片未就绪'
      : embeddedChunks <= 0
        ? '关键词可用'
        : embeddingCoverage >= 60
          ? 'RAG 可用'
          : '向量待补齐'

  const applyStarterPrompt = (prompt: string) => {
    setQuestion(prompt)
    setSearchQuery(prompt)
    void runChunkSearch(prompt, true)
  }

  const openEvidenceBridgeScanReport = () => {
    if (!evidenceBridgeScanTaskId) return
    navigate(`/scan-tasks/${evidenceBridgeScanTaskId}`)
  }

  const refreshEvidenceBridgeSearch = () => {
    const nextQuery = evidenceBridgeQuery.trim()
    if (!nextQuery) {
      message.warning('暂无可复用的证据检索上下文')
      return
    }
    setSearchQuery(nextQuery)
    void runChunkSearch(nextQuery, true)
  }

  const copyEvidenceBridgeReference = async () => {
    if (!evidenceRef) return
    const copyText = buildEvidenceBridgeCopyText(evidenceBridgeScanTaskId, evidenceRef)
    try {
      await copyTextToClipboard(copyText)
      message.success('已复制证据引用')
    } catch {
      setManualCopyText({ title: '手动复制证据引用', text: copyText })
      message.warning('浏览器阻止自动复制，请在弹窗中手动复制')
    }
  }

  const setQaEvidenceUrlState = useCallback((nextQuestion: string, sourceScanTaskId?: number | null) => {
    const nextParams = new URLSearchParams(qaSearchParams)
    nextParams.set('tab', 'qa')
    if (nextQuestion.trim()) {
      nextParams.set('question', nextQuestion.trim())
    } else {
      nextParams.delete('question')
    }
    if (sourceScanTaskId) {
      nextParams.set('scanTaskId', String(sourceScanTaskId))
    } else {
      nextParams.delete('scanTaskId')
    }
    setQaSearchParams(nextParams, { replace: true })
  }, [qaSearchParams, setQaSearchParams])

  const copyChunkCitation = async (chunk: CodeChunkSearchItem) => {
    const citation = [
      chunkLineReference(chunk),
      evidenceReason(chunk),
      '',
      redactedChunkPreview(chunk),
    ].join('\n')
    try {
      await copyTextToClipboard(citation)
      message.success('已复制代码证据引用')
    } catch {
      setManualCopyText({ title: '手动复制代码证据引用', text: citation })
      message.warning('浏览器阻止自动复制，请在弹窗中手动复制')
    }
  }

  const copyQaCitation = async (citation: CodeQaCitation) => {
    const citationText = [
      `${citation.sourceLabel || 'C?'} ${citationLineReference(citation)}`,
      `scanTaskId: ${citation.scanTaskId ?? '-'}`,
      redactSensitiveText(citationEvidenceReason(citation)),
    ].join('\n')
    try {
      await copyTextToClipboard(citationText)
      message.success('已复制回答引用')
    } catch {
      setManualCopyText({ title: '手动复制回答引用', text: citationText })
      message.warning('浏览器阻止自动复制，请在弹窗中手动复制')
    }
  }

  const qaCitationAutoRepairUrl = (
    citation: CodeQaCitation,
    question: string,
    groundingStatus?: string,
    citationEnforcementStatus?: string,
    citationEnforcementReason?: string,
    sourceEvidenceRef?: CodeQaEvidenceRef | null,
    sourceEvidenceMatched?: boolean | null,
    sourceEvidenceMatchType?: string | null,
  ) => {
    const citationScanTaskId = citation.scanTaskId || activeSourceScanTaskId
    const sourceScan = citationScanTaskId ? scanTasks.find(scan => scan.id === citationScanTaskId) : null
    const draftRepositoryId = sourceScan?.repositoryId || repositories[0]?.id
    if (!citation.citedByAnswer || !citation.filePath || !citationScanTaskId || !draftRepositoryId) {
      return ''
    }
    const params = new URLSearchParams()
    params.set('projectId', String(projectId))
    params.set('openCreate', '1')
    params.set('repositoryId', String(draftRepositoryId))
    params.set('scanTaskId', String(citationScanTaskId))
    params.set('filePath', citation.filePath)
    params.set('targetDesc', qaCitationRepairTargetDesc(citation, question))
    params.set('source', 'Project QA verified citation')
    params.set('sourceType', 'PROJECT_QA_VERIFIED_CITATION')
    if (citation.citationId) params.set('citationId', citation.citationId)
    if (citation.chunkId) params.set('chunkId', String(citation.chunkId))
    if (citation.sourceLabel) params.set('sourceLabel', citation.sourceLabel)
    if (citation.startLine) params.set('startLine', String(citation.startLine))
    if (citation.endLine) params.set('endLine', String(citation.endLine))
    params.set('citedByAnswer', String(Boolean(citation.citedByAnswer)))
    if (groundingStatus) params.set('groundingStatus', groundingStatus)
    if (citationEnforcementStatus) params.set('citationEnforcementStatus', citationEnforcementStatus)
    if (citationEnforcementReason) params.set('citationEnforcementReason', citationEnforcementReason)
    if (citation.evidenceType) params.set('evidenceType', citation.evidenceType)
    if (citation.evidenceReason) params.set('evidenceReason', redactSensitiveText(citation.evidenceReason))
    appendSourceEvidenceParams(params, sourceEvidenceRef, sourceEvidenceMatched, sourceEvidenceMatchType)
    return `/auto-repairs?${params.toString()}`
  }

  const copyChunkDeepLink = async (chunk: CodeChunkSearchItem) => {
    const link = buildChunkDeepLink(projectId, chunk)
    try {
      await copyTextToClipboard(link)
      message.success('已复制证据深链')
    } catch {
      setManualCopyText({ title: '手动复制证据深链', text: link })
      message.warning('浏览器阻止自动复制，请在弹窗中手动复制')
    }
  }

  const locateChunkEvidence = (chunk: CodeChunkSearchItem) => {
    const nextQuery = chunkLineReference(chunk)
    setSearchQuery(nextQuery)
    setQaEvidenceUrlState(nextQuery, chunk.scanTaskId || activeSourceScanTaskId)
    void runChunkSearch(nextQuery)
  }

  const askAboutChunkEvidence = (chunk: CodeChunkSearchItem) => {
    const nextQuestion = buildChunkFollowupQuestion(chunk)
    setSearchQuery(nextQuestion)
    setQaEvidenceUrlState(nextQuestion, chunk.scanTaskId || activeSourceScanTaskId)
    void submitQuestion(nextQuestion)
  }

  const handoffChunkToAgent = (chunk: CodeChunkSearchItem, querySignal: CodeUnderstandingQuerySignal) => {
    navigate(buildCodeUnderstandingAgentHandoffUrl(projectId, chunk, querySignal, activeSourceScanTaskId))
  }

  return (
    <div className="sl-qa-workbench">
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
          autoSize={{ minRows: 4, maxRows: 8 }}
          onFocus={(event) => event.currentTarget.select()}
        />
      </Modal>
      <section className="sl-qa-workbench-head">
        <div className="sl-qa-workbench-copy">
          <div className="sl-kicker">Code Intelligence Workbench</div>
          <h3>代码问答与证据检索</h3>
        </div>
        <div className="sl-qa-health-grid">
          <QaHealthMetric label="检索命中" value={`${resultCount}/${displayedMatchedCount}`} />
          <QaHealthMetric label="代码切片" value={knowledgeLoading ? '加载中' : totalChunks ? totalChunks.toLocaleString() : '-'} tone={totalChunks > 0 ? 'ready' : knowledgeError ? 'warning' : 'idle'} />
          <QaHealthMetric label="向量覆盖" value={totalChunks ? `${embeddingCoverage}%` : '-'} tone={embeddingCoverage >= 80 ? 'ready' : embeddedChunks > 0 ? 'warning' : 'idle'} />
          <QaHealthMetric label="证据源" value={activeSourceScanTaskId ? `#${activeSourceScanTaskId}` : '-'} tone={activeSourceScanTaskId ? 'ready' : 'idle'} />
          <QaHealthMetric label="召回模式" value={retrievalMode ? retrievalModeLabel(retrievalMode) : '-'} tone={retrievalMode === 'SEMANTIC_FALLBACK' || retrievalMode === 'HYBRID' ? 'ready' : 'idle'} />
          <QaHealthMetric label="证据质量" value={ragQuality.label} tone={ragQuality.tone} />
        </div>
      </section>

      <div className="sl-qa-layout">
        <Card
          className="sl-section-card sl-qa-panel"
          title={<span className="sl-card-title"><SendOutlined /> RAG 对话</span>}
          extra={
            <ActionButton icon={<ReloadOutlined />} size="small" onClick={() => setMessages([{ role: 'assistant', content: '对话已重置。请问有什么关于本项目代码的问题需要解答？' }])} label="清空历史" />
          }
        >
          <div className="sl-qa-subhead">
            <Typography.Text type="secondary">证据扫描</Typography.Text>
            {activeSourceScanTaskId ? <Tag color="blue">#{activeSourceScanTaskId}</Tag> : <Tag>等待提问</Tag>}
          </div>
          {displayEvidenceRef && (
            <div className="sl-qa-evidence-ref" aria-label="报告证据上下文">
              <div className="sl-qa-evidence-ref-head">
                <div>
                  <span>报告证据来源桥</span>
                  <strong>{displayEvidenceRef.title || displayEvidenceRef.filePath || displayEvidenceRef.source || '证据引用'}</strong>
                </div>
                {evidenceBridgeScanTaskId ? <Tag color="blue">Scan #{evidenceBridgeScanTaskId}</Tag> : <Tag>Scan -</Tag>}
              </div>
              {displayEvidenceRef.summary && (
                <Typography.Paragraph className="sl-qa-evidence-ref-summary">
                  {displayEvidenceRef.summary}
                </Typography.Paragraph>
              )}
              <Space className="sl-qa-evidence-ref-tags" wrap size={[6, 6]}>
                {displayEvidenceRef.category && <Tag>{displayEvidenceRef.category}</Tag>}
                {displayEvidenceRef.source && <Tag>{displayEvidenceRef.source}</Tag>}
                {displayEvidenceRef.filePath && <Tag color="blue" className="sl-qa-evidence-ref-long-tag">{displayEvidenceRef.filePath}</Tag>}
                {evidenceRefLineInfo.label && <Tag>{evidenceRefLineInfo.tagLabel}</Tag>}
              </Space>
              <Space className="sl-qa-evidence-ref-actions" wrap size={[6, 6]}>
                <ActionButton
                  size="small"
                  icon={<FileTextOutlined />}
                  onClick={openEvidenceBridgeScanReport}
                  disabled={!evidenceBridgeScanTaskId}
                  label="回到扫描报告"
                />
                <ActionButton
                  size="small"
                  icon={<ReloadOutlined />}
                  loading={searchLoading}
                  onClick={refreshEvidenceBridgeSearch}
                  disabled={!evidenceBridgeQuery || searchLoading}
                  label="重新检索证据"
                />
                <ActionButton
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => void copyEvidenceBridgeReference()}
                  label="复制证据引用"
                />
              </Space>
            </div>
          )}

          <div className={`sl-qa-playbook sl-qa-playbook-${playbookTone}`}>
            <div className="sl-qa-playbook-head">
              <div>
                <span>QA Playbook</span>
                <strong>{playbookLabel}</strong>
              </div>
              <Tag color={playbookTone === 'ready' ? 'green' : playbookTone === 'warning' ? 'gold' : 'default'}>
                {ragQuality.label}
              </Tag>
            </div>
            <div className="sl-qa-playbook-meta">
              <span>{totalChunks.toLocaleString()} chunks</span>
              <span>{embeddedChunks.toLocaleString()} embedded</span>
              <span>{retrievalModeLabel(retrievalMode)}</span>
            </div>
            <div className="sl-qa-suggestions">
              {starterPrompts.map(starter => (
                <button
                  key={starter.key}
                  type="button"
                  className={`sl-qa-starter-card sl-qa-starter-card-${starter.tone}`}
                  onClick={() => applyStarterPrompt(starter.prompt)}
                >
                  <span>{starter.label}</span>
                  <strong>{starter.prompt}</strong>
                  <small>{starter.reason}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="sl-chat-thread">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user'
              const lowConfidenceGrounding = !isUser && isLowConfidenceGrounding(msg.groundingStatus)
              const noEvidenceGrounding = msg.groundingStatus === 'NO_EVIDENCE'
              const readableEvidence = !isUser ? buildQaReadableEvidenceViewModel(msg) : null
              const repairEvidenceGate = readableEvidence?.repairEvidenceGate || null
              const citationAudit = readableEvidence?.citationAudit || null
              const claimAudit = readableEvidence?.claimAudit || null
              const trustSummary = readableEvidence?.trustSummary || null
              const supplementalChunks = !isUser ? supplementalQaChunks(msg) : []
              const duplicateChunkCount = !isUser ? Math.max(0, (msg.chunks?.length || 0) - supplementalChunks.length) : 0
              const previousUserQuestion = messages.slice(0, index).reverse().find(item => item.role === 'user')?.content || ''
              const primaryRepairCitation = !isUser
                ? msg.answerCitations?.find(citation => citation.citedByAnswer && citation.filePath)
                : undefined
              const primaryAutoRepairUrl = primaryRepairCitation
                && msg.groundingStatus === 'VERIFIED'
                && !lowConfidenceGrounding
                && repairEvidenceGate?.status === 'READY'
                && trustSummary?.tone === 'ready'
                ? qaCitationAutoRepairUrl(primaryRepairCitation, previousUserQuestion, msg.groundingStatus || undefined, msg.citationEnforcementStatus || undefined, msg.citationEnforcementReason || undefined, msg.sourceEvidenceRef, msg.sourceEvidenceMatched, msg.sourceEvidenceMatchType)
                : ''
              return (
                <div key={index} className={`sl-chat-row ${isUser ? 'sl-chat-row-user' : 'sl-chat-row-assistant'}`}>
                  <div className={`sl-chat-bubble ${isUser ? 'sl-chat-bubble-user' : 'sl-chat-bubble-assistant'}`}>
                    <div className="sl-chat-bubble-head">
                      <span>{isUser ? 'You' : 'SourceLens'}</span>
                      {!isUser && (msg.retrievalMode || msg.scanTaskId) && (
                        <small>
                          {msg.evidenceProfile?.readiness ? `${readinessLabel(msg.evidenceProfile.readiness)} · ${msg.evidenceProfile.confidence}%` : msg.retrievalMode ? retrievalModeLabel(msg.retrievalMode) : msg.scanTaskId ? `Scan #${msg.scanTaskId}` : ''}
                        </small>
                      )}
                    </div>
                    {!isUser && msg.groundingStatus && (
                      <div className="sl-answer-grounding">
                        <Tag color={groundingStatusColor(msg.groundingStatus)}>{groundingStatusLabel(msg.groundingStatus)}</Tag>
                        {msg.citationEnforcementStatus && (
                          <Tag color={citationEnforcementColor(msg.citationEnforcementStatus)}>
                            {citationEnforcementLabel(msg.citationEnforcementStatus)}
                          </Tag>
                        )}
                        {msg.citationEnforcementReason && (
                          <Tag color={citationEnforcementReasonColor(msg.citationEnforcementReason)}>
                            原因码 {msg.citationEnforcementReason}
                          </Tag>
                        )}
                        {msg.citationCoverage && (
                          <>
                            <Tag color={citationCoverageColor(msg.citationCoverage)}>
                              {citationCoverageLabel(msg.citationCoverage)}
                            </Tag>
                            <Tag color={msg.citationCoverage.repairCandidateCount ? 'green' : 'default'}>
                              {citationRepairCandidateLabel(msg.citationCoverage)}
                            </Tag>
                          </>
                        )}
                        {msg.scanTaskId && <Tag color="blue">Scan #{msg.scanTaskId}</Tag>}
                      </div>
                    )}
                    <div className="sl-chat-content">{redactSensitiveText(msg.content)}</div>
                    {readableEvidence && (
                      <QaReadableEvidenceSection
                        evidence={readableEvidence}
                        previousUserQuestion={previousUserQuestion}
                        primaryRepairUrl={primaryAutoRepairUrl}
                        primaryCitation={primaryRepairCitation}
                        loading={loading}
                        hasSourceScan={Boolean(activeSourceScanTaskId)}
                        onRetryQuestion={(nextQuestion) => void submitQuestion(nextQuestion)}
                        onPrepareQuestion={(nextQuestion) => {
                          setQuestion(nextQuestion)
                          setSearchQuery(nextQuestion)
                        }}
                        onRefreshEvidence={(nextQuestion) => void runChunkSearch(nextQuestion, true)}
                        onCopyCitation={(citation) => void copyQaCitation(citation)}
                        onOpenRepair={(nextUrl) => navigate(nextUrl)}
                      />
                    )}
                    <QaDetailedEvidenceAuditSection
                      citationAudit={citationAudit}
                      claimAudit={claimAudit}
                      repairEvidenceGate={repairEvidenceGate}
                    />
                    {lowConfidenceGrounding && (
                      <Alert
                        type={noEvidenceGrounding ? 'error' : 'warning'}
                        showIcon
                        aria-label="QA 低置信度证据状态"
                        message={qaEvidenceReviewTitle(msg.groundingStatus)}
                        description={
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Typography.Text>{qaEvidenceReviewDescription(msg)}</Typography.Text>
                            {msg.citationEnforcementNote && (
                              <Typography.Text type="secondary">{msg.citationEnforcementNote}</Typography.Text>
                            )}
                            <Space wrap size={[6, 6]}>
                              <Tag color="gold">低置信度</Tag>
                              {noEvidenceGrounding ? <Tag color="red">无证据</Tag> : <Tag color="orange">候选证据需复核</Tag>}
                              {msg.citationEnforcementReason && (
                                <Tag color={citationEnforcementReasonColor(msg.citationEnforcementReason)}>
                                  引用原因：{citationEnforcementReasonLabel(msg.citationEnforcementReason)}
                                </Tag>
                              )}
                              <Tag>下一步：重试此问题</Tag>
                              <Tag>换问题</Tag>
                              <Tag>重新检索证据</Tag>
                            </Space>
                            <Space wrap size={[6, 6]}>
                              <ActionButton
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={() => previousUserQuestion && void submitQuestion(previousUserQuestion)}
                                disabled={!previousUserQuestion || loading}
                                label="重试此问题"
                              />
                              <ActionButton
                                size="small"
                                icon={<SearchOutlined />}
                                onClick={() => {
                                  setQuestion(previousUserQuestion)
                                  setSearchQuery(previousUserQuestion)
                                }}
                                disabled={!previousUserQuestion}
                                label="换问题"
                              />
                              <ActionButton
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={() => activeSourceScanTaskId && void runChunkSearch(previousUserQuestion || searchQuery, true)}
                                disabled={!activeSourceScanTaskId || loading}
                                label="重新检索证据"
                              />
                            </Space>
                          </Space>
                        }
                      />
                    )}
                    {!isUser && msg.answerCitations && msg.answerCitations.length > 0 && (
                      <div className="sl-answer-citations" aria-label="回答引用证据">
                        <Typography.Text type="secondary" className="sl-evidence-title">{lowConfidenceGrounding ? '候选证据 / 引用复核' : '回答引用'}</Typography.Text>
                        <div className="sl-answer-citation-list">
                          {msg.answerCitations.map((citation, citationIndex) => {
                            const autoRepairUrl = msg.groundingStatus === 'VERIFIED' && !lowConfidenceGrounding && repairEvidenceGate?.status === 'READY' && trustSummary?.tone === 'ready'
                              ? qaCitationAutoRepairUrl(citation, previousUserQuestion, msg.groundingStatus || undefined, msg.citationEnforcementStatus || undefined, msg.citationEnforcementReason || undefined, msg.sourceEvidenceRef, msg.sourceEvidenceMatched, msg.sourceEvidenceMatchType)
                              : ''
                            const citationSourceLabel = citation.sourceLabel || `C${citationIndex + 1}`
                            const citationRef = citationLineReference(citation)
                            return (
                              <article
                                className={`sl-answer-citation-card ${citation.citedByAnswer ? 'sl-answer-citation-card-cited' : 'sl-answer-citation-card-uncited'}`}
                                key={`${citation.sourceLabel || 'citation'}-${citation.chunkId || citationIndex}`}
                                aria-label={`引用证据卡片 ${citationSourceLabel}`}
                              >
                                <div className="sl-answer-citation-head">
                                  <span className="sl-answer-citation-source">{citationSourceLabel}</span>
                                  <strong className="sl-answer-citation-line" title={citationRef}>{citationRef}</strong>
                                </div>
                                <div className="sl-answer-citation-tags">
                                  {citation.scanTaskId && <Tag color="blue">Scan #{citation.scanTaskId}</Tag>}
                                  <Tag color={citation.citedByAnswer ? 'green' : 'default'}>{citation.citedByAnswer ? '回答已引用' : '候选证据'}</Tag>
                                  {citation.contextRole && <Tag>{citation.contextRole === 'ADJACENT_CONTEXT' ? '相邻上下文' : '主证据'}</Tag>}
                                  {citation.evidenceType && <Tag>{citation.evidenceType}</Tag>}
                                  {typeof citation.relevanceScore === 'number' && <Tag>相关分 {citation.relevanceScore}</Tag>}
                                </div>
                                <div className="sl-answer-citation-reason">
                                  <span>证据说明</span>
                                  <p>{redactSensitiveText(citationEvidenceReason(citation))}</p>
                                </div>
                                <Space wrap size={[6, 6]}>
                                  <ActionButton
                                    className="sl-answer-citation-action"
                                    size="small"
                                    type="link"
                                    icon={<LinkOutlined />}
                                    onClick={() => copyQaCitation(citation)}
                                    label="复制引用"
                                  />
                                  {autoRepairUrl && (
                                    <ActionButton
                                      className="sl-answer-citation-action"
                                      size="small"
                                      icon={<BranchesOutlined />}
                                      data-sl-target-url={autoRepairUrl}
                                      onClick={() => navigate(autoRepairUrl)}
                                      label="生成修复候选"
                                    />
                                  )}
                                </Space>
                              </article>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {!isUser && msg.chunks && msg.chunks.length > 0 && (
                      <div className="sl-evidence-block">
                        <Typography.Text type="secondary" className="sl-evidence-title">
                          {lowConfidenceGrounding ? '候选代码切片' : `补充 code_chunks ${supplementalChunks.length} 条`}
                        </Typography.Text>
                        {duplicateChunkCount > 0 && (
                          <div className="sl-evidence-dedupe-note" aria-label="回答证据去重说明">
                            已引用证据 {duplicateChunkCount} 条不再重复展示为代码切片卡片。
                          </div>
                        )}
                        {supplementalChunks.length > 0 && (
                          <div className="sl-evidence-tags">
                            <div className="sl-evidence-chip-list">
                              {supplementalChunks.map((chunk, chunkIndex) => {
                              const chunkSourceLabel = chunk.sourceLabel || `C${chunkIndex + 1}`
                              const chunkRef = chunkLineReference(chunk)
                              return (
                                <article className="sl-evidence-chip" title={evidenceReason(chunk)} key={`${chunk.id}-${chunkIndex}`} aria-label={`代码切片证据 ${chunkSourceLabel}`}>
                                  <div className="sl-evidence-chip-head">
                                    <strong>{chunkSourceLabel}</strong>
                                    <span className="sl-evidence-chip-ref" title={chunkRef}>{chunkRef}</span>
                                  </div>
                                  <div className="sl-evidence-chip-badges">
                                    {chunk.scanTaskId && <Tag color="blue">Scan #{chunk.scanTaskId}</Tag>}
                                    <Tag color={contextRoleColor(chunk)}>{contextRoleLabel(chunk)}</Tag>
                                    <Tag color={evidenceColor(chunk.evidenceType)}>{evidenceLabel(chunk.evidenceType)}</Tag>
                                    <Tag color="blue">Score {chunk.relevanceScore ?? 0}</Tag>
                                    <Tag color={chunk.hasEmbedding ? 'green' : 'default'}>{chunk.hasEmbedding ? '已向量化' : '未向量化'}</Tag>
                                  </div>
                                  <p className="sl-evidence-chip-reason">{evidenceReason(chunk)}</p>
                                  <div className="sl-evidence-chip-actions">
                                    <ActionButton
                                      className="sl-evidence-chip-action"
                                      size="small"
                                      type="link"
                                      onClick={() => locateChunkEvidence(chunk)}
                                      label="定位"
                                    />
                                    <ActionButton
                                      className="sl-evidence-chip-action"
                                      size="small"
                                      type="link"
                                      onClick={() => askAboutChunkEvidence(chunk)}
                                      disabled={loading}
                                      label="追问"
                                    />
                                    <ActionButton
                                      className="sl-evidence-chip-action"
                                      size="small"
                                      type="link"
                                      onClick={() => copyChunkCitation(chunk)}
                                      label="复制引用"
                                    />
                                    <ActionButton
                                      className="sl-evidence-chip-action"
                                      size="small"
                                      type="link"
                                      icon={<LinkOutlined />}
                                      onClick={() => copyChunkDeepLink(chunk)}
                                      label="链接"
                                    />
                                  </div>
                                </article>
                              )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {loading && (
              <div className="sl-chat-row sl-chat-row-assistant">
                <div className="sl-chat-bubble sl-chat-bubble-assistant">
                  <Space size={8}>
                    <ReloadOutlined spin />
                    <span>正在检索代码库并生成解答...</span>
                  </Space>
                </div>
              </div>
            )}
          </div>

          {qaRequestError && (
            <StateBlock
              compact
              tone="error"
              title="代码问答请求失败"
              description={qaRequestError.message}
              action={
                <Space wrap size={[6, 6]}>
                  <ActionButton
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => void submitQuestion(qaRequestError.question)}
                    disabled={loading}
                    label="重试此问题"
                  />
                  <ActionButton
                    size="small"
                    onClick={() => {
                      setQuestion(qaRequestError.question)
                      setSearchQuery(qaRequestError.question)
                    }}
                    label="恢复到输入框"
                  />
                </Space>
              }
            />
          )}

          <div className="sl-qa-composer">
            <Input
              placeholder="输入问题，或粘贴 AuthService.java:85、Class#method、at fetchUser (.../auth-store.ts:85:13)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onPressEnter={handleSend}
              disabled={loading}
              size="large"
            />
            <ActionButton type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading} disabled={!question.trim() || loading} size="large" label="发送" />
          </div>
        </Card>

        <Card
          className="sl-section-card sl-chunk-panel"
          title={<span className="sl-card-title"><SearchOutlined /> 证据检索</span>}
        >
          <Space.Compact style={{ width: '100%', marginBottom: 14 }}>
            <Input
              placeholder="搜索类名、函数名、路径、file:line 或浏览器 stack trace"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onPressEnter={() => runChunkSearch()}
            />
            <ActionButton icon={<SearchOutlined />} loading={searchLoading} onClick={() => runChunkSearch()} label="检索" />
          </Space.Compact>
          <CodeUnderstandingLensPanel
            query={searchQuery}
            result={searchResult}
            activeSourceScanTaskId={activeSourceScanTaskId}
            retrievalMode={retrievalMode}
            loading={loading || searchLoading}
            onLocate={locateChunkEvidence}
            onAsk={askAboutChunkEvidence}
            onAgentHandoff={handoffChunkToAgent}
            onCopy={(chunk) => void copyChunkCitation(chunk)}
          />
          {searchError && searchResult && (
            <StateBlock
              compact
              tone="error"
              title="证据检索刷新失败，已保留上次成功结果"
              description={searchError}
              action={
                <ActionButton
                  size="small"
                  icon={<ReloadOutlined />}
                  loading={searchLoading}
                  onClick={() => runChunkSearch(searchFailedQuery || searchQuery)}
                  label="重新检索证据"
                />
              }
            />
          )}
          {!searchResult && knowledgeError && (
            <div className="sl-search-error" aria-live="polite">
              <Typography.Text type="danger">{knowledgeError}</Typography.Text>
            </div>
          )}

          <div className="sl-chunk-results">
            {searchLoading ? (
              <StateBlock compact tone="loading" title="正在检索代码切片" description="系统正在按关键词、路径和证据质量排序 code_chunks。" />
            ) : searchError && !searchResult ? (
              <StateBlock
                compact
                tone="error"
                title="证据检索失败"
                description={searchError}
                action={
                  <ActionButton
                    size="small"
                    icon={<ReloadOutlined />}
                    loading={searchLoading}
                    onClick={() => runChunkSearch(searchFailedQuery || searchQuery)}
                    label="重新检索证据"
                  />
                }
              />
            ) : !searchResult ? (
              <StateBlock compact title="输入关键词开始检索" description="可以搜索类名、函数名、文件路径或报告证据引用。" />
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div className="sl-search-summary">
                  {searchResult.scanTaskId && <Tag color="blue">扫描 #{searchResult.scanTaskId}</Tag>}
                  {retrievalMode && <Tag color={retrievalModeColor(retrievalMode)}>{retrievalModeLabel(retrievalMode)}</Tag>}
                  <Tag color={searchResult.truncated ? 'orange' : 'default'}>
                    展示 {resultCount}/{displayedMatchedCount} 个{evidenceUnitLabel}
                  </Tag>
                  <Tag>切片总量 {totalChunks.toLocaleString()}</Tag>
                  <Tag color={embeddingCoverage >= 80 ? 'green' : embeddedChunks > 0 ? 'gold' : 'default'}>
                    向量化 {embeddedChunks.toLocaleString()}/{totalChunks.toLocaleString()} ({embeddingCoverage}%)
                  </Tag>
                  {searchResult.truncated && <Tag color="orange">结果已截断</Tag>}
                </div>
                <div className={`sl-rag-quality-card sl-rag-quality-card-${ragQuality.tone}`}>
                  <div className="sl-rag-quality-main">
                    <div>
                      <span>证据质量</span>
                      <strong>{ragQuality.summary}</strong>
                    </div>
                    <Tag color={ragQuality.tone === 'ready' ? 'green' : ragQuality.tone === 'warning' ? 'gold' : 'default'}>
                      {ragQuality.label}
                    </Tag>
                  </div>
                  <Progress percent={ragQuality.confidence} size="small" showInfo={false} />
                  <div className="sl-rag-quality-details">
                    {ragQuality.details.map(detail => <Tag key={detail}>{detail}</Tag>)}
                  </div>
                  <div className="sl-rag-quality-next">{ragQuality.nextAction}</div>
                </div>
                <ChunkEvidenceProfileCard profile={evidenceProfile} totalResults={searchResult.items.length} />
                {evidenceCombination && <ChunkEvidenceCombinationCard combination={evidenceCombination} />}
                {searchResult.items.length === 0 ? (
                  <StateBlock
                    compact
                    title={searchResult.scanTaskId ? '没有匹配的代码切片' : '暂无成功扫描'}
                    description={searchResult.scanTaskId ? '请换用更具体的类名、方法名或文件路径重新检索。' : '成功扫描完成后才能检索 code_chunks。'}
                  />
                ) : (
                  searchResult.items.map((item, itemIndex) => {
                    const itemSourceLabel = item.sourceLabel || `C${itemIndex + 1}`
                    const lineRange = `${item.startLine}-${item.endLine}`
                    const itemLineRef = `${item.filePath}:${lineRange}`
                    const matchedTerms = (item.matchedTerms || []).filter(Boolean)
                    const adoptionSignal = chunkAdoptionSignal(item)
                    const displayPreview = redactedChunkPreview(item)
                    return (
                      <article key={item.id} className="sl-search-result-card" aria-label={`code_chunks 证据卡片 ${itemSourceLabel}`}>
                        <div className="sl-search-result-head">
                          <div className="sl-search-result-title">
                            <span className="sl-search-result-source">{itemSourceLabel}</span>
                            <div className="sl-search-result-primary">
                              <strong className="sl-search-result-path" title={item.filePath}>{item.filePath}</strong>
                              <span className="sl-search-result-line-ref" title={itemLineRef}>{itemLineRef}</span>
                            </div>
                          </div>
                          <div className="sl-search-result-badges">
                            <Tag color={contextRoleColor(item)}>{contextRoleLabel(item)}</Tag>
                            <Tag color={evidenceColor(item.evidenceType)}>{evidenceLabel(item.evidenceType)}</Tag>
                            <Tag color={(item.relevanceScore ?? 0) >= 80 ? 'green' : (item.relevanceScore ?? 0) >= 45 ? 'gold' : 'default'}>
                              相关分 {item.relevanceScore ?? 0}
                            </Tag>
                            <Tag color={item.hasEmbedding ? 'green' : 'default'}>
                              {item.hasEmbedding ? '已向量化' : '未向量化'}
                            </Tag>
                          </div>
                        </div>
                        <div className={`sl-search-adoption sl-search-adoption-${adoptionSignal.tone}`}>
                          <CheckCircleOutlined />
                          <span>{adoptionSignal.text}</span>
                        </div>
                        <div className="sl-search-evidence-reason">
                          <span>证据说明</span>
                          <p>{evidenceReason(item)}</p>
                        </div>
                        <div className="sl-search-matched-terms">
                          <span>命中词</span>
                          <div>
                            {matchedTerms.length > 0
                              ? matchedTerms.map(term => <Tag color="gold" key={`${item.id}-${term}`}>{term}</Tag>)
                              : <Tag>无显式关键词命中</Tag>}
                          </div>
                        </div>
                        <div className="sl-search-actions">
                          <ActionButton size="small" icon={<SearchOutlined />} onClick={() => locateChunkEvidence(item)} label="定位检索" />
                          <ActionButton size="small" type="primary" icon={<SendOutlined />} onClick={() => askAboutChunkEvidence(item)} disabled={loading} label="追问此处" />
                          <ActionButton size="small" onClick={() => copyChunkCitation(item)} label="复制引用" />
                          <ActionButton size="small" icon={<LinkOutlined />} onClick={() => copyChunkDeepLink(item)} label="复制链接" />
                        </div>
                        <div className="sl-search-result-meta-grid">
                          <div><span>证据编号</span><strong>{itemSourceLabel}</strong></div>
                          <div><span>文件路径</span><strong title={item.filePath}>{item.filePath}</strong></div>
                          <div><span>行号范围</span><strong>第 {lineRange} 行</strong></div>
                          <div><span>证据角色</span><strong>{contextRoleLabel(item)}</strong></div>
                          <div><span>证据类型</span><strong>{evidenceLabel(item.evidenceType)}</strong></div>
                          <div><span>相关分</span><strong>{item.relevanceScore ?? 0}</strong></div>
                          <div><span>召回方式</span><strong>{item.hasEmbedding ? '可语义召回' : '关键词召回'}</strong></div>
                        </div>
                        <pre className="sl-code-block sl-search-code-preview sl-search-code-preview-redacted" aria-label="脱敏 code chunk 搜索结果预览">
                          {displayPreview}
                        </pre>
                      </article>
                    )
                  })
                )}
              </Space>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function CodeUnderstandingLensPanel({
  query,
  result,
  activeSourceScanTaskId,
  retrievalMode,
  loading,
  onLocate,
  onAsk,
  onCopy,
  onAgentHandoff,
}: {
  query: string
  result: CodeChunkSearchResponse | null
  activeSourceScanTaskId?: number | null
  retrievalMode?: string | null
  loading: boolean
  onLocate: (chunk: CodeChunkSearchItem) => void
  onAsk: (chunk: CodeChunkSearchItem) => void
  onCopy: (chunk: CodeChunkSearchItem) => void
  onAgentHandoff: (chunk: CodeChunkSearchItem, querySignal: CodeUnderstandingQuerySignal) => void
}) {
  const querySignal = classifyCodeUnderstandingQuery(query)
  const primaryChunk = result?.items.find(item => !isContextChunk(item)) || result?.items[0]
  const sourceLabel = primaryChunk?.sourceLabel || (primaryChunk ? 'C1' : '-')
  const readiness = result?.evidenceProfile?.readiness || (primaryChunk ? 'RESULT' : 'WAITING')
  const resultRetrievalMode = result?.retrievalMode || retrievalMode || '-'
  const sameScan = Boolean(primaryChunk?.scanTaskId && activeSourceScanTaskId && primaryChunk.scanTaskId === activeSourceScanTaskId)
  const primaryRole = Boolean(primaryChunk && !isContextChunk(primaryChunk))
  const readyForExplanation = Boolean(primaryChunk && sameScan && primaryRole && !loading)
  const tone: QaSignalTone = primaryChunk && sameScan && primaryRole
    ? 'ready'
    : primaryChunk
      ? 'warning'
      : querySignal.kind === 'IDLE'
        ? 'idle'
        : 'warning'
  const title = primaryChunk
    ? `${querySignal.title}：${sourceLabel}`
    : querySignal.title
  const summary = primaryChunk
    ? `已从当前检索结果选出 ${sourceLabel} 作为阅读入口，先确认文件行号、证据角色和召回状态，再决定是否进入解释。`
    : querySignal.hint
  const location = primaryChunk ? chunkLineReference(primaryChunk) : '等待检索结果'
  const actionDisabled = !primaryChunk || loading
  const explainDisabledReason = !primaryChunk
    ? '等待主证据后可解释'
    : !sameScan
      ? '请先重新定位当前扫描证据'
      : !primaryRole
        ? '上下文线索不能直接交接'
        : loading
          ? '检索刷新中'
          : undefined

  return (
    <section className={`sl-code-understanding-lens sl-code-understanding-lens-${tone}`} aria-label="代码理解定位入口">
      <div className="sl-code-understanding-lens-head">
        <div>
          <span>代码理解入口</span>
          <strong>{title}</strong>
        </div>
        <Tag color={tone === 'ready' ? 'green' : tone === 'warning' ? 'gold' : 'default'}>{querySignal.label}</Tag>
      </div>
      <p>{summary}</p>
      <div className="sl-code-understanding-lens-grid">
        <div><span>当前扫描</span><strong>{activeSourceScanTaskId ? `Scan #${activeSourceScanTaskId}` : '-'}</strong></div>
        <div><span>主证据位置</span><strong title={location}>{location}</strong></div>
        <div><span>证据编号</span><strong>{sourceLabel}</strong></div>
        <div><span>证据角色</span><strong>{primaryChunk ? contextRoleLabel(primaryChunk) : '-'}</strong></div>
        <div><span>证据类型</span><strong>{primaryChunk ? evidenceLabel(primaryChunk.evidenceType) : '-'}</strong></div>
        <div><span>相关分</span><strong>{primaryChunk?.relevanceScore ?? '-'}</strong></div>
        <div><span>召回模式</span><strong>{resultRetrievalMode === '-' ? '-' : retrievalModeLabel(resultRetrievalMode)}</strong></div>
        <div><span>Readiness</span><strong>{readiness}</strong></div>
      </div>
      <div className="sl-code-understanding-lens-checks">
        <Tag color={sameScan ? 'green' : primaryChunk ? 'gold' : 'default'}>{sameScan ? '当前扫描已绑定' : primaryChunk ? '扫描需复核' : '等待扫描证据'}</Tag>
        <Tag color={primaryRole ? 'green' : primaryChunk ? 'gold' : 'default'}>{primaryRole ? 'PRIMARY 主证据' : primaryChunk ? '上下文线索' : '等待主证据'}</Tag>
        <Tag color={primaryChunk?.hasEmbedding ? 'green' : 'default'}>{primaryChunk?.hasEmbedding ? '含向量证据' : '关键词/结构证据'}</Tag>
        <Tag color={readyForExplanation ? 'green' : primaryChunk ? 'gold' : 'default'}>{readyForExplanation ? '可交给 Agent' : explainDisabledReason}</Tag>
      </div>
      <div
        className={`sl-code-understanding-lens-gate ${readyForExplanation ? 'sl-code-understanding-lens-gate-ready' : 'sl-code-understanding-lens-gate-blocked'}`}
        role="note"
        aria-label="Agent 交接门禁说明"
      >
        <span>{readyForExplanation ? 'Agent 交接门禁已开放' : 'Agent 交接门禁未开放'}</span>
        <strong>{readyForExplanation ? '当前扫描、PRIMARY 主证据和检索状态均满足交接条件。' : explainDisabledReason}</strong>
      </div>
      <div className="sl-code-understanding-lens-contract" aria-label="Agent 交接合约">
        <div>
          <span>交接字段</span>
          <strong>扫描 / 文件 / 行号 / 证据角色</strong>
        </div>
        <div>
          <span>不会携带</span>
          <strong>源码正文 / raw prompt / stack</strong>
        </div>
        <div>
          <span>执行方式</span>
          <strong>进入 AgentChat 后手动发送</strong>
        </div>
      </div>
      <div className="sl-code-understanding-lens-actions">
        <ActionButton size="small" icon={<SearchOutlined />} disabled={actionDisabled} onClick={() => primaryChunk && onLocate(primaryChunk)} label="定位检索" />
        <ActionButton size="small" type="primary" icon={<SendOutlined />} disabled={!readyForExplanation} title={explainDisabledReason} onClick={() => primaryChunk && readyForExplanation && onAsk(primaryChunk)} label="解释此处" />
        <ActionButton size="small" icon={<RobotOutlined />} disabled={!readyForExplanation} title={explainDisabledReason} onClick={() => primaryChunk && readyForExplanation && onAgentHandoff(primaryChunk, querySignal)} label="交给 Agent" />
        <ActionButton size="small" icon={<CopyOutlined />} disabled={!primaryChunk} onClick={() => primaryChunk && onCopy(primaryChunk)} label="复制引用" />
      </div>
    </section>
  )
}

function ChunkEvidenceCombinationCard({ combination }: { combination: ChunkEvidenceCombination }) {
  return (
    <div className={`sl-qa-evidence-combination sl-qa-evidence-combination-${combination.tone}`} aria-label="证据组合路径">
      <div className="sl-qa-evidence-combination-head">
        <div>
          <span>证据组合路径</span>
          <strong>{combination.label}</strong>
        </div>
        <Tag color={combination.tone === 'ready' ? 'green' : combination.tone === 'warning' ? 'gold' : 'default'}>
          {combination.topSourceLabel}
        </Tag>
      </div>
      <p>{combination.summary}</p>
      <div className="sl-qa-evidence-combination-grid">
        <div><span>主证据阅读起点</span><strong>{combination.topReference}</strong></div>
        <div><span>相邻上下文</span><strong>{combination.contextCount} 条</strong></div>
        <div><span>文件覆盖</span><strong>{combination.uniqueFiles} 个文件</strong></div>
        <div><span>向量证据</span><strong>{combination.embeddedCount} 条</strong></div>
      </div>
      <div className="sl-qa-evidence-combination-path">
        {combination.rolePath.map(role => <Tag key={role}>{role}</Tag>)}
        {combination.fileCoverage.map(file => <Tag color="blue" key={file}>{file}</Tag>)}
      </div>
      <div className="sl-qa-evidence-combination-next">
        <span>下一步追问 / 复核方向</span>
        <ul>
          {combination.nextQuestions.map(question => <li key={question}>{question}</li>)}
        </ul>
      </div>
      <div className="sl-qa-evidence-combination-action">{combination.nextAction}</div>
    </div>
  )
}

function ChunkEvidenceProfileCard({
  profile,
  totalResults,
}: {
  profile: ChunkEvidenceProfile
  totalResults: number
}) {
  if (!totalResults) return null
  const embeddingRate = totalResults > 0 ? Math.round((profile.embeddedCount / totalResults) * 100) : 0
  const fileCoverageText = `${profile.uniqueFiles} 个文件`
  const lowConfidenceText = profile.lowConfidenceCount > 0 ? `${profile.lowConfidenceCount} 条需复核` : '无低可信'

  return (
    <div className="sl-rag-evidence-profile">
      <div className="sl-rag-evidence-profile-head">
        <div>
          <span>Evidence Profile</span>
          <strong>{fileCoverageText} · 平均分 {profile.avgScore}</strong>
        </div>
        <Tag color={profile.lowConfidenceCount > 0 ? 'gold' : 'green'}>
          {profile.lowConfidenceCount > 0 ? '需人工复核' : '证据稳定'}
        </Tag>
      </div>
      <div className="sl-rag-evidence-profile-grid">
        <div><span>最高相关</span><strong>{profile.topScore}</strong></div>
        <div><span>向量证据</span><strong>{embeddingRate}%</strong></div>
        <div><span>代码跨度</span><strong>{profile.lineSpan} 行</strong></div>
        <div><span>主证据</span><strong>{evidenceLabel(profile.dominantEvidenceType)}</strong></div>
      </div>
      <div className="sl-rag-evidence-distribution">
        {profile.evidenceTypeStats.slice(0, 5).map(stat => (
          <Tag color={evidenceColor(stat.type)} key={stat.type}>{evidenceLabel(stat.type)} {stat.count}</Tag>
        ))}
        <Tag color={profile.lowConfidenceCount > 0 ? 'orange' : 'green'}>{lowConfidenceText}</Tag>
      </div>
      {profile.fileStats.length > 0 && (
        <div className="sl-rag-file-coverage">
          {profile.fileStats.slice(0, 4).map(file => (
            <div key={file.filePath}>
              <span>{compactPath(file.filePath)}</span>
              <strong>{file.count} 条 / Score {file.bestScore}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CitationCoverageAuditPanel({ audit }: { audit: CitationCoverageAudit }) {
  return (
    <div className={`sl-citation-coverage-audit sl-citation-coverage-audit-${audit.tone}`} aria-label="引用覆盖审计">
      <div className="sl-citation-coverage-audit-head">
        <div>
          <span>引用覆盖审计</span>
          <strong>{audit.title}</strong>
        </div>
        <Tag color={audit.tone === 'ready' ? 'green' : audit.tone === 'warning' ? 'gold' : 'red'}>
          {qaAuditTagText(audit.tone)}
        </Tag>
      </div>
      <p>{audit.summary}</p>
      <div className="sl-citation-coverage-audit-metrics">
        {audit.metrics.map(metric => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-citation-coverage-audit-checks">
        {audit.checks.map(check => (
          <Tag key={check.label} color={check.ok ? 'green' : 'gold'}>
            {qaCheckText(check.ok)} · {check.label}
          </Tag>
        ))}
      </div>
      {audit.roleDistribution ? (
        <div className="sl-citation-role-distribution" aria-label="证据角色分布">
          <div className="sl-citation-role-distribution-title">
            <span>证据角色分布</span>
            <Tag color={audit.roleDistribution.status === 'PRIMARY_CROSS_FILE' ? 'blue' : audit.roleDistribution.status === 'MIXED_PRIMARY_CONTEXT' ? 'gold' : 'default'}>
              {evidenceRoleStatusText(audit.roleDistribution.status)}
            </Tag>
          </div>
          <div className="sl-citation-role-distribution-grid">
            <div>
              <span>角色</span>
              {audit.roleDistribution.roles.length ? audit.roleDistribution.roles.map(role => <strong key={role}>{role}</strong>) : <strong>-</strong>}
            </div>
            <div>
              <span>文件</span>
              {audit.roleDistribution.files.length ? audit.roleDistribution.files.map(file => <strong key={file}>{file}</strong>) : <strong>-</strong>}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function QaAnswerSourceEvidenceReceiptPanel({ receipt }: { receipt: QaAnswerSourceEvidenceReceipt }) {
  return (
    <section
      className={`sl-qa-source-receipt ${receipt.matched ? 'sl-qa-source-receipt-ready' : 'sl-qa-source-receipt-review'}`}
      aria-label="QA 回答报告证据凭证"
    >
      <div className="sl-qa-source-receipt-head">
        <div>
          <span>回答来源凭证</span>
          <strong>{receipt.title}</strong>
        </div>
        <Tag color={receipt.matched ? 'green' : 'gold'}>{receipt.matchType}</Tag>
      </div>
      <Space className="sl-qa-source-receipt-tags" wrap size={[6, 6]}>
        <Tag color="blue">{receipt.scanLabel}</Tag>
        <Tag>{receipt.source}</Tag>
        <Tag>{receipt.category}</Tag>
        <Tag color="cyan">{receipt.lineKindLabel}</Tag>
        <Tag color={receipt.matched ? 'green' : 'gold'}>{receipt.matchLabel}</Tag>
      </Space>
      <div className="sl-qa-source-receipt-ref">
        <FileTextOutlined />
        <span>{receipt.fileReference}</span>
      </div>
      <QaSourceLocationConfidencePanel confidence={receipt.locationConfidence} />
    </section>
  )
}

function QaSourceLocationConfidencePanel({ confidence }: { confidence: QaSourceLocationConfidence }) {
  const tagText = confidence.tone === 'ready' ? '已绑定' : confidence.tone === 'warning' ? '需复核' : '已阻断'
  const tagColor = confidence.tone === 'ready' ? 'green' : confidence.tone === 'warning' ? 'gold' : 'red'
  return (
    <div className={`sl-qa-source-location-confidence sl-qa-source-location-confidence-${confidence.tone}`} aria-label="来源定位可信度">
      <div className="sl-qa-source-location-confidence-head">
        <div>
          <span>来源定位可信度</span>
          <strong>{confidence.title}</strong>
        </div>
        <Tag color={tagColor}>{tagText}</Tag>
      </div>
      <p>{confidence.summary}</p>
      <div className="sl-qa-source-location-confidence-metrics">
        {confidence.metrics.map(metric => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-qa-source-location-confidence-checks">
        {confidence.checks.map(check => (
          <Tag key={check.label} color={check.ok ? 'green' : 'gold'}>
            {qaCheckText(check.ok)} · {check.label}
          </Tag>
        ))}
      </div>
    </div>
  )
}

function QaSourceFileMatchReleasePanel({ release }: { release: QaSourceFileMatchRelease }) {
  const tagColor = release.tone === 'ready' ? 'green' : release.tone === 'warning' ? 'gold' : 'red'
  const tagText = qaAuditTagText(release.tone)
  return (
    <section className={`sl-qa-source-match-release sl-qa-source-match-release-${release.tone}`} aria-label="来源文件匹配说明">
      <div className="sl-qa-source-match-release-head">
        <div>
          <span>修复候选放行条件</span>
          <strong>{release.title}</strong>
        </div>
        <Tag color={tagColor}>{tagText}</Tag>
      </div>
      <p>{release.summary}</p>
      <div className="sl-qa-source-match-release-grid">
        <div>
          <span>报告目标</span>
          <strong>{release.targetReference}</strong>
        </div>
        <div>
          <span>已引用切片</span>
          <strong>{release.citedReference}</strong>
        </div>
        <div>
          <span>匹配结论</span>
          <strong>{release.matchLabel}</strong>
        </div>
        <div>
          <span>风险提示</span>
          <strong>{release.riskLabel}</strong>
        </div>
      </div>
      <div className="sl-qa-source-match-release-checks">
        {release.checks.map(check => (
          <div key={check.label} className={check.ok ? 'sl-qa-source-match-check-ok' : 'sl-qa-source-match-check-gap'}>
            {check.ok ? <CheckCircleOutlined /> : <StopOutlined />}
            <div>
              <strong>{check.ok ? `已满足：${check.label}` : `未满足：${check.label}`}</strong>
              <span>{check.detail}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="sl-qa-source-match-release-next">{release.nextAction}</div>
    </section>
  )
}

function QaReadableEvidenceSection({
  evidence,
  previousUserQuestion,
  primaryRepairUrl,
  primaryCitation,
  loading,
  hasSourceScan,
  onRetryQuestion,
  onPrepareQuestion,
  onRefreshEvidence,
  onCopyCitation,
  onOpenRepair,
}: QaReadableEvidenceSectionProps) {
  const {
    trustSummary,
    crossFileSummary,
    sourceEvidenceReceipt,
    sourceFileRelease,
  } = evidence
  const hasReadableEvidence = Boolean(trustSummary || crossFileSummary || sourceEvidenceReceipt || sourceFileRelease)
  if (!hasReadableEvidence) return null

  const tone = trustSummary?.tone || crossFileSummary?.tone || sourceFileRelease?.tone || 'warning'
  const tagColor = tone === 'ready' ? 'green' : tone === 'warning' ? 'gold' : 'red'

  return (
    <section className={`sl-qa-readable-evidence sl-qa-readable-evidence-${tone}`} aria-label="QA 可信证据">
      <div className="sl-qa-readable-evidence-head">
        <div>
          <span>QA Evidence</span>
          <strong>QA 可信证据</strong>
        </div>
        <Tag color={tagColor}>{qaSummaryTagText(tone)}</Tag>
      </div>
      <div className="sl-qa-readable-evidence-flow">
        {trustSummary && <QaTrustSummaryPanel summary={trustSummary} />}
        {crossFileSummary && <QaCrossFileCitationSummaryPanel summary={crossFileSummary} />}
        {sourceEvidenceReceipt && <QaAnswerSourceEvidenceReceiptPanel receipt={sourceEvidenceReceipt} />}
        {sourceFileRelease && <QaSourceFileMatchReleasePanel release={sourceFileRelease} />}
        {trustSummary && (
          <QaNextActionRail
            summary={trustSummary}
            previousUserQuestion={previousUserQuestion}
            primaryRepairUrl={primaryRepairUrl}
            primaryCitation={primaryCitation}
            loading={loading}
            hasSourceScan={hasSourceScan}
            onRetryQuestion={onRetryQuestion}
            onPrepareQuestion={onPrepareQuestion}
            onRefreshEvidence={onRefreshEvidence}
            onCopyCitation={onCopyCitation}
            onOpenRepair={onOpenRepair}
          />
        )}
      </div>
    </section>
  )
}

function QaTrustSummaryPanel({ summary }: { summary: QaTrustSummary }) {
  const tagText = qaSummaryTagText(summary.tone)
  const tagColor = summary.tone === 'ready' ? 'green' : summary.tone === 'warning' ? 'gold' : 'red'
  return (
    <section className={`sl-qa-trust-summary sl-qa-trust-summary-${summary.tone}`} aria-label="QA 可信度摘要">
      <div className="sl-qa-trust-summary-head">
        <div>
          <span>可信度结论</span>
          <strong>{summary.title}</strong>
        </div>
        <Tag color={tagColor}>{tagText}</Tag>
      </div>
      <p>{summary.summary}</p>
      <div className="sl-qa-trust-summary-metrics">
        {summary.metrics.map(metric => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-qa-trust-summary-checks">
        {summary.checks.map(check => (
          <Tag key={check.label} color={check.ok ? 'green' : 'gold'}>
            {qaCheckText(check.ok)} · {check.label}
          </Tag>
        ))}
      </div>
      <div className="sl-qa-trust-summary-next">
        <CheckCircleOutlined />
        <span>{summary.nextAction}</span>
      </div>
    </section>
  )
}

function QaCrossFileCitationSummaryPanel({ summary }: { summary: QaCrossFileCitationSummary }) {
  const tagText = qaBindingTagText(summary.tone)
  const tagColor = summary.tone === 'ready' ? 'green' : summary.tone === 'warning' ? 'gold' : 'red'
  return (
    <section className={`sl-qa-cross-file-summary sl-qa-cross-file-summary-${summary.tone}`} aria-label="跨文件引用摘要">
      <div className="sl-qa-cross-file-summary-head">
        <div>
          <span>跨文件引用结论</span>
          <strong>{summary.title}</strong>
        </div>
        <Tag color={tagColor}>{tagText}</Tag>
      </div>
      <p>{summary.summary}</p>
      <div className="sl-qa-cross-file-summary-metrics">
        {summary.metrics.map(metric => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-qa-cross-file-summary-checks">
        {summary.checks.map(check => (
          <Tag key={check.label} color={check.ok ? 'green' : 'gold'}>
            {qaCheckText(check.ok)} · {check.label}
          </Tag>
        ))}
      </div>
      <div className="sl-qa-cross-file-summary-status">
        <span>证据角色</span>
        <strong>{summary.status}</strong>
      </div>
      {summary.contextGap.visible && (
        <div className="sl-qa-cross-file-summary-status sl-qa-cross-file-summary-gap" aria-label="上下文引用缺口">
          <span>上下文引用缺口</span>
          <strong>{summary.contextGap.evidence} 条 / {summary.contextGap.files} 文件</strong>
        </div>
      )}
    </section>
  )
}

function QaDetailedEvidenceAuditSection({
  citationAudit,
  claimAudit,
  repairEvidenceGate,
}: QaDetailedEvidenceAuditSectionProps) {
  const hasAuditEvidence = Boolean(citationAudit || claimAudit || repairEvidenceGate)
  if (!hasAuditEvidence) return null

  const blocked = repairEvidenceGate?.status === 'BLOCKED' || citationAudit?.tone === 'blocked' || claimAudit?.tone === 'blocked'
  const warning = repairEvidenceGate?.status === 'REVIEW' || citationAudit?.tone === 'warning' || claimAudit?.tone === 'warning'
  const tone: 'ready' | 'warning' | 'blocked' = blocked ? 'blocked' : warning ? 'warning' : 'ready'
  const tagColor = tone === 'ready' ? 'green' : tone === 'warning' ? 'gold' : 'red'
  const summaryItems = [
    {
      key: 'citation',
      label: '引用覆盖',
      tone: citationAudit?.tone || 'warning',
      value: citationAudit?.title || '未提供引用覆盖',
      detail: citationAudit ? qaAuditTagText(citationAudit.tone) : '缺失',
    },
    {
      key: 'claim',
      label: '主张质量',
      tone: claimAudit?.tone || 'warning',
      value: claimAudit?.title || '未提供主张审计',
      detail: claimAudit ? qaAuditTagText(claimAudit.tone) : '缺失',
    },
    {
      key: 'gate',
      label: '修复门禁',
      tone: repairEvidenceGate?.status === 'READY' ? 'ready' : repairEvidenceGate?.status === 'BLOCKED' ? 'blocked' : 'warning',
      value: repairEvidenceGate?.label || '未提供门禁',
      detail: repairEvidenceGate?.status || '-',
    },
  ]

  return (
    <section className={`sl-qa-detailed-audit sl-qa-detailed-audit-${tone}`} aria-label="QA 底层审计证据">
      <div className="sl-qa-detailed-audit-head">
        <div>
          <span>Audit Evidence</span>
          <strong>QA 底层审计证据</strong>
        </div>
        <Tag color={tagColor}>{qaAuditTagText(tone)}</Tag>
      </div>
      <div className="sl-qa-detailed-audit-summary" aria-label="QA 底层审计摘要">
        {summaryItems.map(item => (
          <div key={item.key} className={`sl-qa-detailed-audit-summary-item sl-qa-detailed-audit-summary-item-${item.tone}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </div>
      <div className="sl-qa-detailed-audit-flow">
        {citationAudit && <CitationCoverageAuditPanel audit={citationAudit} />}
        {claimAudit && <ClaimCitationAuditPanel audit={claimAudit} />}
        {repairEvidenceGate && <QaRepairEvidenceGatePanel gate={repairEvidenceGate} />}
      </div>
    </section>
  )
}

function QaRepairEvidenceGatePanel({ gate }: { gate: RepairEvidenceGate }) {
  return (
    <div className={`sl-qa-repair-gate sl-qa-repair-gate-${gate.status.toLowerCase()}`} aria-label="修复证据门禁">
      <div className="sl-qa-repair-gate-head">
        <span>修复证据门禁</span>
        <Tag color={gate.color}>{gate.label}</Tag>
      </div>
      <p>{gate.summary}</p>
      <Space wrap size={[6, 6]}>
        {gate.checks.map(check => (
          <Tag key={check}>{check}</Tag>
        ))}
      </Space>
    </div>
  )
}

function QaNextActionRail({
  summary,
  previousUserQuestion,
  primaryRepairUrl,
  primaryCitation,
  loading,
  hasSourceScan,
  onRetryQuestion,
  onPrepareQuestion,
  onRefreshEvidence,
  onCopyCitation,
  onOpenRepair,
}: QaNextActionRailProps) {
  const normalizedQuestion = previousUserQuestion.trim()
  const canRetry = Boolean(normalizedQuestion) && !loading
  const canRefreshEvidence = Boolean(normalizedQuestion) && hasSourceScan && !loading
  const tagText = qaSummaryTagText(summary.tone)
  const tagColor = summary.tone === 'ready' ? 'green' : summary.tone === 'warning' ? 'gold' : 'red'

  return (
    <section className={`sl-qa-next-action-rail sl-qa-next-action-rail-${summary.tone}`} aria-label="QA 下一步动作">
      <div className="sl-qa-next-action-rail-copy">
        <span>下一步动作</span>
        <strong>{summary.nextAction}</strong>
      </div>
      <Tag color={tagColor}>{tagText}</Tag>
      <div className="sl-qa-next-action-rail-actions">
        {summary.tone === 'ready' ? (
          <>
            <ActionButton
              type="primary"
              icon={<BranchesOutlined />}
              disabled={!primaryRepairUrl}
              data-sl-target-url={primaryRepairUrl}
              onClick={() => primaryRepairUrl && onOpenRepair(primaryRepairUrl)}
              label="生成修复候选"
            />
            <ActionButton
              icon={<LinkOutlined />}
              disabled={!primaryCitation}
              onClick={() => primaryCitation && onCopyCitation(primaryCitation)}
              label="复制首条引用"
            />
            <ActionButton
              icon={<SearchOutlined />}
              disabled={!canRefreshEvidence}
              onClick={() => normalizedQuestion && onRefreshEvidence(normalizedQuestion)}
              label="重新检索证据"
            />
          </>
        ) : summary.tone === 'warning' ? (
          <>
            <ActionButton
              type="primary"
              icon={<SearchOutlined />}
              disabled={!canRefreshEvidence}
              onClick={() => normalizedQuestion && onRefreshEvidence(normalizedQuestion)}
              label="重新检索证据"
            />
            <ActionButton
              icon={<ReloadOutlined />}
              disabled={!canRetry}
              onClick={() => normalizedQuestion && onRetryQuestion(normalizedQuestion)}
              label="重试此问题"
            />
            <ActionButton
              icon={<SendOutlined />}
              disabled={!normalizedQuestion}
              onClick={() => normalizedQuestion && onPrepareQuestion(normalizedQuestion)}
              label="恢复到输入框"
            />
          </>
        ) : (
          <>
            <ActionButton
              type="primary"
              icon={<ReloadOutlined />}
              disabled={!canRetry}
              onClick={() => normalizedQuestion && onRetryQuestion(normalizedQuestion)}
              label="重试此问题"
            />
            <ActionButton
              icon={<SendOutlined />}
              disabled={!normalizedQuestion}
              onClick={() => normalizedQuestion && onPrepareQuestion(normalizedQuestion)}
              label="恢复到输入框"
            />
            <ActionButton
              icon={<SearchOutlined />}
              disabled={!canRefreshEvidence}
              onClick={() => normalizedQuestion && onRefreshEvidence(normalizedQuestion)}
              label="重新检索证据"
            />
          </>
        )}
      </div>
    </section>
  )
}

function ClaimCitationAuditPanel({ audit }: { audit: ClaimCitationAudit }) {
  return (
    <div className={`sl-claim-citation-audit sl-claim-citation-audit-${audit.tone}`} aria-label="主张引用质量">
      <div className="sl-claim-citation-audit-head">
        <div>
          <span>主张引用质量</span>
          <strong>{audit.title}</strong>
        </div>
        <Tag color={audit.tone === 'ready' ? 'green' : audit.tone === 'warning' ? 'gold' : 'red'}>
          {qaAuditTagText(audit.tone)}
        </Tag>
      </div>
      <p>{audit.summary}</p>
      <div className="sl-claim-citation-audit-metrics">
        {audit.metrics.map(metric => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      {audit.roleDistribution ? (
        <div className="sl-citation-role-distribution" aria-label="主张证据角色分布">
          <div className="sl-citation-role-distribution-title">
            <span>主张证据角色</span>
            <Tag color={audit.roleDistribution.status === 'PRIMARY_BOUND' ? 'blue' : audit.roleDistribution.status === 'CONTEXT_ONLY' ? 'gold' : 'default'}>
              {evidenceRoleStatusText(audit.roleDistribution.status)}
            </Tag>
          </div>
          <div className="sl-citation-role-distribution-grid">
            <div>
              <span>主张</span>
              <strong>主证据 {audit.roleDistribution.primaryBound}/{audit.roleDistribution.requiredClaims}</strong>
              <strong>上下文 {audit.roleDistribution.contextOnly}</strong>
              {audit.roleDistribution.unknownOnly > 0 && <strong>未知 {audit.roleDistribution.unknownOnly}</strong>}
            </div>
            <div>
              <span>文件</span>
              <strong>主证据 {audit.roleDistribution.primaryFiles}</strong>
              <strong>上下文 {audit.roleDistribution.contextFiles}</strong>
            </div>
            <div>
              <span>角色明细</span>
              {audit.roleDistribution.roles.length ? audit.roleDistribution.roles.map(role => <strong key={role}>{role}</strong>) : <strong>-</strong>}
            </div>
            <div>
              <span>文件明细</span>
              {audit.roleDistribution.files.length ? audit.roleDistribution.files.map(file => <strong key={file}>{file}</strong>) : <strong>-</strong>}
            </div>
          </div>
        </div>
      ) : null}
      {audit.problemClaims.length > 0 && (
        <div className="sl-claim-citation-audit-list">
          {audit.problemClaims.map(claim => (
            <div key={`${claim.id}-${claim.status}`}>
              <Tag color={claim.status === 'INVALID' ? 'red' : 'gold'}>{claimProblemStatusText(claim.status)}</Tag>
              <span>{claim.text}</span>
              <em>{claim.labels}</em>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QaHealthMetric({ label, value, tone = 'idle' }: { label: string; value: string; tone?: 'ready' | 'warning' | 'idle' }) {
  return (
    <div className={`sl-qa-health-card sl-qa-health-card-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
