import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs, Table, Button, Modal, Form, Input, InputNumber, Space, Popconfirm, Tag, message, Typography, Card, Empty, Spin, Progress, Tooltip } from 'antd'
import {
  BranchesOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  FileOutlined,
  FileTextOutlined,
  FolderOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SearchOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { projectApi, Project } from '../api/project'
import { repositoryApi, Repository } from '../api/repository'
import { scanTaskApi, ScanTask } from '../api/scanTask'
import { artifactApi, ArtifactRecord } from '../api/artifact'
import { executionTaskApi, ExecutionTask } from '../api/executionTask'
import { codeChunkApi } from '../api/codeChunk'
import type { CodeChunkEvidenceProfile, CodeChunkSearchItem, CodeChunkSearchResponse } from '../api/codeChunk'
import { formatApiError, showApiError } from '../api/client'
import ArtifactLinkButton from '../components/ArtifactLinkButton'
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

interface QaMessage {
  role: 'user' | 'assistant'
  content: string
  chunks?: CodeChunkSearchItem[]
  scanTaskId?: number | null
  retrievalMode?: string | null
  evidenceProfile?: CodeChunkEvidenceProfile
}

type QaSignalTone = 'ready' | 'warning' | 'idle'

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

const DEFAULT_QA_STARTERS = [
  '请解释本项目核心 Controller Service Repository 调用链，并列出关键文件证据',
  '本项目最核心的数据模型和持久化路径是什么？',
  '请找出前端入口、API 调用和后端接口之间的对应关系',
]

const PROJECT_TAB_KEYS = new Set(['overview', 'repos', 'scans', 'qa', 'graph'])

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
  const [loadingRepos, setLoadingRepos] = useState(true)
  const [loadingScans, setLoadingScans] = useState(true)
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

  useEffect(() => {
    projectApi.detail(projectId).then((res) => setProject(res.data.data))
  }, [projectId])

  const loadRepos = () => {
    setLoadingRepos(true)
    repositoryApi.list(projectId).then((res) => setRepos(res.data.data)).finally(() => setLoadingRepos(false))
  }

  const loadScans = useCallback((silent = false) => {
    if (!silent) setLoadingScans(true)
    Promise.all([
      scanTaskApi.list(projectId),
      executionTaskApi.list(projectId, 1, 100).catch(() => null),
    ]).then(([scanRes, executionRes]) => {
      const items = scanRes.data.data.items || []
      const executions = executionRes?.data.data.items || []
      const executionByScanId: Record<number, ExecutionTask> = {}
      executions.forEach((task: ExecutionTask) => {
        if (task.sourceType === 'SCAN_TASK' && task.sourceId) {
          executionByScanId[task.sourceId] = task
        }
      })
      setScans(items)
      setScanExecutions(executionByScanId)
      const latest = items.find((t: ScanTask) => t.status === 'SUCCESS')
      setLatestScanTaskId(latest ? latest.id : null)
    }).finally(() => {
      if (!silent) setLoadingScans(false)
    })
  }, [projectId])

  const handleWorkspaceTabChange = (key: string) => {
    const nextParams = new URLSearchParams(searchParams)
    if (key === 'overview') {
      nextParams.delete('tab')
      nextParams.delete('question')
      nextParams.delete('scanTaskId')
      loadOverview()
    } else {
      nextParams.set('tab', key)
      if (key !== 'qa') {
        nextParams.delete('question')
        nextParams.delete('scanTaskId')
      }
    }
    setSearchParams(nextParams, { replace: true })
  }

  useEffect(() => {
    setLatestScanTaskId(null)
    setCodeKnowledge(null)
    setCodeKnowledgeError(null)
    loadRepos()
    loadScans()
    loadOverview()
  }, [projectId, loadScans])

  useEffect(() => {
    let cancelled = false
    if (!knowledgeScanTaskId) {
      setCodeKnowledge(null)
      setCodeKnowledgeLoading(false)
      setCodeKnowledgeError(null)
      return undefined
    }

    setCodeKnowledgeLoading(true)
    setCodeKnowledgeError(null)
    codeChunkApi.search(projectId, { scanTaskId: knowledgeScanTaskId, limit: 1 })
      .then((res) => {
        if (!cancelled) {
          setCodeKnowledge(res.data.data)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setCodeKnowledge(null)
          setCodeKnowledgeError(formatApiError(error, '加载 code_chunks 状态失败'))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCodeKnowledgeLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [projectId, knowledgeScanTaskId])

  const activeScanCount = scans.filter(scan => scan.status === 'RUNNING' || scan.status === 'PENDING').length

  useEffect(() => {
    if (activeScanCount <= 0) return undefined
    const timer = window.setTimeout(() => loadScans(true), 3000)
    return () => window.clearTimeout(timer)
  }, [activeScanCount, loadScans])

  // 加载最新扫描的总览数据
  const loadOverview = async () => {
    setOverviewLoading(true)
    setOverviewError(null)
    try {
      const scansRes = await scanTaskApi.list(projectId)
      const tasks: ScanTask[] = scansRes.data.data.items || []
      const latestSuccess = tasks.find((t: ScanTask) => t.status === 'SUCCESS')
      if (!latestSuccess) {
        setOverviewError('暂无成功的扫描结果')
        setOverview(null)
        setFileTree(null)
        setLatestArtifacts([])
        setReportQuality(null)
        return
      }
      setLatestScanTaskId(latestSuccess.id)
      const artifactsRes = await artifactApi.list(projectId, {
        ownerType: 'SCAN_TASK',
        ownerId: latestSuccess.id,
      })
      const artifacts: ArtifactRecord[] = artifactsRes.data.data || []
      setLatestArtifacts(artifacts)
      const reportArt = artifacts.find((a: ArtifactRecord) => a.artifactType === 'ARCHITECTURE_REPORT')
      if (reportArt) {
        try {
          const reportPreview = await artifactApi.preview(projectId, reportArt.id)
          const reportData = JSON.parse(reportPreview.data.data.text)
          setReportQuality(normalizeReportQuality(reportData.reportQuality))
        } catch {
          setReportQuality(null)
        }
      } else {
        setReportQuality(null)
      }
      const archArt = artifacts.find((a: ArtifactRecord) => a.artifactType === 'ARCHITECTURE_OVERVIEW')
      if (!archArt) {
        setOverviewError('未找到架构概览数据')
        setOverview(null)
        setFileTree(null)
        return
      }
      const previewRes = await artifactApi.preview(projectId, archArt.id)
      const data = JSON.parse(previewRes.data.data.text)
      // 后端 languages 返回对象格式 {"Java":{"file_count":10,"line_count":5000}}，需转为数组
      const rawLangs = data.languages
      const languages: LanguageStat[] = Array.isArray(rawLangs)
        ? rawLangs
        : rawLangs && typeof rawLangs === 'object'
          ? Object.entries(rawLangs).map(([name, val]: [string, any]) => ({
              name,
              file_count: val?.file_count ?? 0,
              line_count: val?.line_count ?? 0,
            }))
          : []
      setOverview({
        languages,
        framework: data.framework || null,
        totalFiles: data.totalFiles || 0,
        totalDirs: data.totalDirs || 0,
        totalLines: data.totalLines || 0,
        controllers: data.controllers || 0,
        services: data.services || 0,
        repositories: data.repositories || 0,
        entities: data.entities || 0,
      })
      setFileTree(data.entryPoints || null)
    } catch (error) {
      setOverviewError(formatApiError(error, '加载总览数据失败'))
      setOverview(null)
      setFileTree(null)
      setLatestArtifacts([])
      setReportQuality(null)
    } finally {
      setOverviewLoading(false)
    }
  }

  const handleAddRepo = async () => {
    try {
      const values = await repoForm.validateFields()
      await repositoryApi.add(projectId, values)
      message.success('仓库添加成功')
      setRepoModalOpen(false)
      repoForm.resetFields()
      loadRepos()
    } catch (error: any) {
      if (error?.errorFields) return
      showApiError(error, '仓库添加失败')
    }
  }

  const handleDeleteRepo = async (repoId: number) => {
    try {
      await repositoryApi.delete(repoId)
      message.success('仓库已删除')
      loadRepos()
    } catch (error) {
      showApiError(error, '仓库删除失败')
    }
  }

  const openGitHubAppModal = async (repo: Repository) => {
    setSelectedRepo(repo)
    githubAppForm.resetFields()
    if (repo.authType === 'GITHUB_APP') {
      try {
        const res = await repositoryApi.getGitHubAppInstallation(repo.id)
        const installation = res.data.data
        githubAppForm.setFieldsValue({
          installationId: installation.installationId,
          accountLogin: installation.accountLogin,
          accountType: installation.accountType,
          repositorySelection: installation.repositorySelection,
          permissionsJson: installation.permissionsJson,
        })
      } catch (error) {
        showApiError(error, '加载 GitHub App installation 失败')
        githubAppForm.setFieldsValue({ accountLogin: repo.owner })
      }
    } else {
      githubAppForm.setFieldsValue({ accountLogin: repo.owner, accountType: 'Organization', repositorySelection: 'selected' })
    }
    setGithubAppModalOpen(true)
  }

  const handleBindGitHubApp = async () => {
    if (!selectedRepo) return
    try {
      const values = await githubAppForm.validateFields()
      await repositoryApi.bindGitHubAppInstallation(selectedRepo.id, values)
      message.success('GitHub App installation 已绑定')
      setGithubAppModalOpen(false)
      setSelectedRepo(null)
      githubAppForm.resetFields()
      loadRepos()
    } catch (error: any) {
      if (error?.errorFields) return
      showApiError(error, '绑定 GitHub App installation 失败')
    }
  }

  const handleDisableGitHubApp = async () => {
    if (!selectedRepo) return
    try {
      await repositoryApi.disableGitHubAppInstallation(selectedRepo.id)
      message.success('GitHub App installation 已禁用')
      setGithubAppModalOpen(false)
      setSelectedRepo(null)
      githubAppForm.resetFields()
      loadRepos()
    } catch (error) {
      showApiError(error, '禁用 GitHub App installation 失败')
    }
  }

  const handleCreateScan = async (repo: Repository) => {
    setCreatingScan(repo.id)
    try {
      await scanTaskApi.create(repo.id, { projectId })
      message.success('扫描任务已创建')
      loadScans()
    } catch (error) {
      showApiError(error, '创建扫描任务失败')
    } finally {
      setCreatingScan(null)
    }
  }

  const handleCancelScan = async (scanTaskId: number) => {
    setCancellingScan(scanTaskId)
    try {
      await scanTaskApi.cancel(scanTaskId)
      message.success('扫描任务已取消')
      loadScans()
    } catch (error) {
      showApiError(error, '取消扫描任务失败')
    } finally {
      setCancellingScan(null)
    }
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

  return (
    <div>
      <div className="sl-project-cockpit">
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
          <div className="sl-project-cockpit-actions">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { repoForm.resetFields(); setRepoModalOpen(true) }}>
              添加仓库
            </Button>
            <Button
              icon={<SearchOutlined />}
              loading={primaryRepo ? creatingScan === primaryRepo.id : false}
              onClick={handlePrimaryScan}
            >
              {primaryRepo ? '触发扫描' : '先接入仓库'}
            </Button>
            <Button
              icon={<FileTextOutlined />}
              disabled={!latestSuccessScan}
              onClick={() => latestSuccessScan && navigate(`/scan-tasks/${latestSuccessScan.id}`)}
            >
              最新报告
            </Button>
            <Button
              icon={<DatabaseOutlined />}
              disabled={!latestScanTaskId}
              onClick={() => latestScanTaskId && navigate(`/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${latestScanTaskId}`)}
            >
              产物库
            </Button>
          </div>
        </section>

        <section className="sl-project-cockpit-side">
          <div className="sl-project-cockpit-side-head">
            <div>
              <span>Latest analysis</span>
              <strong>{latestScan ? `Scan #${latestScan.id}` : '暂无扫描'}</strong>
            </div>
            <Tooltip title="刷新项目、仓库、扫描和总览数据">
              <Button icon={<ReloadOutlined />} onClick={() => { loadRepos(); loadScans(); loadOverview() }} />
            </Tooltip>
          </div>
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
              <Button block icon={<FileTextOutlined />} onClick={() => navigate(`/scan-tasks/${latestScan.id}`)}>
                打开扫描详情
              </Button>
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
                <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
              ) : overviewError ? (
                <Empty description={overviewError} />
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
                <Button
                  aria-label="添加公开仓库"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => { repoForm.resetFields(); setRepoModalOpen(true) }}
                >
                  添加仓库
                </Button>
              </div>
              <Table
                className="sl-workflow-table"
                dataSource={repos}
                rowKey="id"
                loading={loadingRepos}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无仓库，请先接入一个公开 GitHub 仓库" /> }}
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
                        <Tooltip title="触发扫描">
                          <Button
                            aria-label={`扫描仓库 ${r.owner}/${r.name}`}
                            size="small"
                            icon={<SearchOutlined />}
                            loading={creatingScan === r.id}
                            onClick={() => handleCreateScan(r)}
                          />
                        </Tooltip>
                        <Tooltip title="GitHub App 高级集成">
                          <Button
                            aria-label={`配置 ${r.owner}/${r.name} 的 GitHub App`}
                            size="small"
                            icon={<SafetyCertificateOutlined />}
                            onClick={() => openGitHubAppModal(r)}
                          />
                        </Tooltip>
                        <Popconfirm title="确认删除此仓库？" onConfirm={() => handleDeleteRepo(r.id)}>
                          <Tooltip title="删除仓库">
                            <Button aria-label={`删除仓库 ${r.owner}/${r.name}`} size="small" danger icon={<DeleteOutlined />} />
                          </Tooltip>
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
                  <Button aria-label="刷新扫描任务" icon={<ReloadOutlined />} onClick={() => loadScans()}>刷新</Button>
                  {activeScanCount > 0 && <Tag color="processing">自动刷新中</Tag>}
                </Space>
              </div>
              <div className="sl-scan-summary-grid">
                <ScanSummary label="扫描总数" value={scans.length} />
                <ScanSummary label="成功扫描" value={successScanCount} />
                <ScanSummary label="失败扫描" value={failedScanCount} />
                <ScanSummary label="活跃扫描" value={activeScanCount} />
              </div>
              <Table
                className="sl-workflow-table"
                dataSource={scans}
                rowKey="id"
                loading={loadingScans}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无扫描任务，请先在仓库管理中触发扫描" /> }}
                pagination={{ pageSize: 10, showTotal: total => `共 ${total} 次扫描` }}
                scroll={{ x: 920 }}
                columns={[
                  {
                    title: '扫描',
                    key: 'scan',
                    width: 180,
                    render: (_: any, r: ScanTask) => (
                      <Space direction="vertical" size={4}>
                        <Button
                          aria-label={`查看扫描 #${r.id} 报告`}
                          type="link"
                          className="sl-inline-link"
                          onClick={() => navigate(`/scan-tasks/${r.id}`)}
                        >
                          扫描 #{r.id}
                        </Button>
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
                          <Tooltip title="查看报告">
                            <Button
                              aria-label={`查看扫描 #${r.id} 报告`}
                              size="small"
                              icon={<FileTextOutlined />}
                              onClick={() => navigate(`/scan-tasks/${r.id}`)}
                            />
                          </Tooltip>
                          {execution && (
                            <Tooltip title="执行详情">
                              <Button
                                aria-label={`查看扫描 #${r.id} 的执行详情`}
                                size="small"
                                icon={<ScheduleOutlined />}
                                onClick={() => navigate(`/execution-tasks?projectId=${projectId}&taskId=${execution.id}`)}
                              />
                            </Tooltip>
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
                              <Tooltip title="取消扫描">
                                <Button
                                  aria-label={`取消扫描 #${r.id}`}
                                  size="small"
                                  danger
                                  icon={<StopOutlined />}
                                  loading={cancellingScan === r.id}
                                />
                              </Tooltip>
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
          children: latestScanTaskId ? (
            <DependencyGraphView scanTaskId={latestScanTaskId} />
          ) : (
            <Empty description="暂无成功的扫描任务，请先执行扫描以生成依赖图谱" />
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
                <Button danger>禁用</Button>
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
  if (chunk.evidenceReason) return `${chunk.evidenceReason}${contextSuffix}`
  const score = chunk.relevanceScore ?? 0
  const scoreText = score >= 80 ? '高相关' : score >= 45 ? '中相关' : score > 0 ? '弱相关' : '结构匹配'
  const terms = (chunk.matchedTerms || []).filter(Boolean)
  const termText = terms.length > 0 ? `命中 ${terms.slice(0, 4).join(' / ')}` : '通过路径、类型或结构信号命中'
  const vectorText = chunk.hasEmbedding ? '含向量证据' : '关键词证据'
  return `${scoreText} · ${evidenceLabel(chunk.evidenceType)} · ${termText} · ${vectorText}${contextSuffix}`
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
          <Button icon={<DatabaseOutlined />} disabled={signal.coreReadyCount === 0} onClick={onOpenArtifacts}>
            产物证据
          </Button>
          <Button icon={<SendOutlined />} disabled={signal.tone === 'idle'} onClick={onOpenQa}>
            代码问答
          </Button>
          <Button icon={<BranchesOutlined />} disabled={signal.tone === 'idle'} onClick={onOpenGraph}>
            依赖图谱
          </Button>
          <Button icon={<FileTextOutlined />} disabled={signal.tone === 'idle'} onClick={onOpenScan}>
            扫描详情
          </Button>
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
  scanTaskId,
  knowledgeStatus,
  knowledgeLoading,
  knowledgeError,
  initialQuestion,
}: {
  projectId: number
  scanTaskId?: number | null
  knowledgeStatus: CodeChunkSearchResponse | null
  knowledgeLoading: boolean
  knowledgeError: string | null
  initialQuestion?: string | null
}) {
  const initialQuestionText = useMemo(() => (initialQuestion || '').trim(), [initialQuestion])
  const [messages, setMessages] = useState<QaMessage[]>([
    { role: 'assistant', content: '您好！我是您的代码库智能助手。您已开启本地 RAG 问答，我可以基于本项目已扫描的代码文件为您解答关于架构设计、实现细节或开发建议的问题。请问有什么我可以帮您的？' }
  ])
  const [question, setQuestion] = useState(initialQuestionText)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialQuestionText)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<CodeChunkSearchResponse | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

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
    } catch (error) {
      const errMsg = formatApiError(error, '代码切片检索失败')
      setSearchError(errMsg)
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

  const handleSend = async () => {
    if (!question.trim() || loading) return
    const curQuestion = question.trim()
    setQuestion('')
    setMessages(prev => [...prev, { role: 'user', content: curQuestion }])
    setLoading(true)
    void runChunkSearch(curQuestion, true)

    try {
      const res = await projectApi.codeQa(projectId, curQuestion, scanTaskId)
      const qa = res.data.data
      const answer = qa?.answer || '未获取到有效回答'
      const chunks = qa?.retrievedChunks || []
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: answer,
        chunks,
        scanTaskId: qa?.scanTaskId,
        retrievalMode: qa?.retrievalMode,
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
      setMessages(prev => [...prev, { role: 'assistant', content: `问答请求发生错误：${errMsg}` }])
    } finally {
      setLoading(false)
    }
  }

  const baselineKnowledge = searchResult || knowledgeStatus
  const activeSourceScanTaskId = baselineKnowledge?.scanTaskId ?? scanTaskId ?? null
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

  const copyChunkCitation = async (chunk: CodeChunkSearchItem) => {
    try {
      const citation = [
        `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}`,
        evidenceReason(chunk),
        '',
        chunk.contentPreview || chunk.content,
      ].join('\n')
      await navigator.clipboard.writeText(citation)
      message.success('已复制代码证据引用')
    } catch {
      message.error('复制失败')
    }
  }

  return (
    <div className="sl-qa-workbench">
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
            <Button icon={<ReloadOutlined />} size="small" onClick={() => setMessages([{ role: 'assistant', content: '对话已重置。请问有什么关于本项目代码的问题需要解答？' }])}>
              清空历史
            </Button>
          }
        >
          <div className="sl-qa-subhead">
            <Typography.Text type="secondary">最新成功扫描</Typography.Text>
            {activeSourceScanTaskId ? <Tag color="blue">#{activeSourceScanTaskId}</Tag> : <Tag>等待提问</Tag>}
          </div>

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
                    <div className="sl-chat-content">{msg.content}</div>
                    {!isUser && msg.chunks && msg.chunks.length > 0 && (
                      <div className="sl-evidence-block">
                        <Typography.Text type="secondary" className="sl-evidence-title">引用依据</Typography.Text>
                        <div className="sl-evidence-tags">
                          <Space size={[6, 6]} wrap>
                            {msg.chunks.map((chunk, chunkIndex) => (
                              <span className="sl-evidence-chip" title={evidenceReason(chunk)} key={`${chunk.id}-${chunkIndex}`}>
                                <Tag color={contextRoleColor(chunk)}>{contextRoleLabel(chunk)}</Tag>
                                <Tag color={evidenceColor(chunk.evidenceType)}>{evidenceLabel(chunk.evidenceType)}</Tag>
                                <Tag color="blue">Score {chunk.relevanceScore ?? 0}</Tag>
                                <span>[C{chunkIndex + 1}] {compactPath(chunk.filePath)}:{chunk.startLine}-{chunk.endLine}</span>
                              </span>
                            ))}
                          </Space>
                        </div>
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
                    <Spin size="small" />
                    <span>正在检索代码库并生成解答...</span>
                  </Space>
                </div>
              </div>
            )}
          </div>

          <div className="sl-qa-composer">
            <Input
              placeholder="请输入您对本项目代码的提问"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onPressEnter={handleSend}
              disabled={loading}
              size="large"
            />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading} size="large">
              发送
            </Button>
          </div>
        </Card>

        <Card
          className="sl-section-card sl-chunk-panel"
          title={<span className="sl-card-title"><SearchOutlined /> 证据检索</span>}
        >
          <Space.Compact style={{ width: '100%', marginBottom: 14 }}>
            <Input
              placeholder="搜索类名、函数名、路径或关键词"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onPressEnter={() => runChunkSearch()}
            />
            <Button icon={<SearchOutlined />} loading={searchLoading} onClick={() => runChunkSearch()}>
              检索
            </Button>
          </Space.Compact>
          {searchError && (
            <div className="sl-search-error" aria-live="polite">
              <Typography.Text type="danger">{searchError}</Typography.Text>
            </div>
          )}
          {!searchResult && knowledgeError && (
            <div className="sl-search-error" aria-live="polite">
              <Typography.Text type="danger">{knowledgeError}</Typography.Text>
            </div>
          )}

          <div className="sl-chunk-results">
            {searchLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
            ) : !searchResult ? (
              <Empty description="输入关键词后查看最新扫描生成的 code_chunks" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                {searchResult.items.length === 0 ? (
                  <Empty description={searchResult.scanTaskId ? '没有匹配的代码切片' : '暂无成功扫描，无法检索代码切片'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  searchResult.items.map((item) => (
                    <div key={item.id} className="sl-search-result-card">
                      <div className="sl-search-result-head">
                        <div className="sl-search-result-title">
                          <Typography.Text strong ellipsis style={{ maxWidth: 320 }} title={item.filePath}>
                            {item.filePath}
                          </Typography.Text>
                          <span>{compactPath(item.filePath)}:{item.startLine}-{item.endLine}</span>
                        </div>
                        <Space size={[6, 6]} wrap className="sl-search-result-badges">
                          <Tag color={contextRoleColor(item)}>{contextRoleLabel(item)}</Tag>
                          <Tag color={evidenceColor(item.evidenceType)}>{evidenceLabel(item.evidenceType)}</Tag>
                          <Tag color={(item.relevanceScore ?? 0) >= 80 ? 'green' : (item.relevanceScore ?? 0) >= 45 ? 'gold' : 'default'}>
                            Score {item.relevanceScore ?? 0}
                          </Tag>
                          <Tag color={item.hasEmbedding ? 'green' : 'default'}>
                            {item.hasEmbedding ? '已向量化' : '未向量化'}
                          </Tag>
                        </Space>
                      </div>
                      <div className={`sl-search-adoption sl-search-adoption-${chunkAdoptionSignal(item).tone}`}>
                        <CheckCircleOutlined />
                        <span>{chunkAdoptionSignal(item).text}</span>
                      </div>
                      <div className="sl-search-evidence-reason">{evidenceReason(item)}</div>
                      <Space wrap size={[6, 6]} className="sl-search-tags">
                        <Tag>Lines {item.startLine}-{item.endLine}</Tag>
                        {item.matchedTerms.map(term => <Tag color="gold" key={`${item.id}-${term}`}>{term}</Tag>)}
                        <Button size="small" onClick={() => copyChunkCitation(item)}>复制引用</Button>
                      </Space>
                      <div className="sl-search-result-meta-grid">
                        <div><span>文件</span><strong>{compactPath(item.filePath)}</strong></div>
                        <div><span>跨度</span><strong>{Math.max(item.endLine - item.startLine + 1, 1)} 行</strong></div>
                        <div><span>上下文角色</span><strong>{contextRoleLabel(item)}</strong></div>
                        <div><span>向量</span><strong>{item.hasEmbedding ? '可语义召回' : '关键词召回'}</strong></div>
                      </div>
                      <pre className="sl-code-block" style={{ maxHeight: 220, fontSize: 12 }}>
                        {item.contentPreview || item.content}
                      </pre>
                    </div>
                  ))
                )}
              </Space>
            )}
          </div>
        </Card>
      </div>
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

function QaHealthMetric({ label, value, tone = 'idle' }: { label: string; value: string; tone?: 'ready' | 'warning' | 'idle' }) {
  return (
    <div className={`sl-qa-health-card sl-qa-health-card-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
