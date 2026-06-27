import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Card, Descriptions, Empty, List, Popconfirm, Progress, Space, Table, Tabs, Tag, Typography, message } from 'antd'
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
  ReloadOutlined,
  RobotOutlined,
  ScheduleOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { artifactApi, ArtifactRecord } from '../api/artifact'
import { codeChunkApi } from '../api/codeChunk'
import type { CodeChunkSearchResponse } from '../api/codeChunk'
import { executionTaskApi, ExecutionStep, ExecutionTaskDetail } from '../api/executionTask'
import { scanTaskApi, ScanTask } from '../api/scanTask'
import { formatApiError } from '../api/client'
import ArtifactLinkButton from '../components/ArtifactLinkButton'
import DependencyGraphView from './DependencyGraph'

const { Text } = Typography

type ScanArtifactView = ArtifactRecord & {
  summaryJson?: string
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
  onOpen: () => void
  qaQuestion?: string
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
}

const CORE_REPORT_ARTIFACTS = ['ARCHITECTURE_REPORT', 'ARCHITECTURE_OVERVIEW', 'DEPENDENCY_GRAPH', 'CODE_METRICS']

export default function ScanTaskDetail() {
  const { id } = useParams<{ id: string }>()
  const taskId = Number(id)
  const navigate = useNavigate()
  const [task, setTask] = useState<ScanTask | null>(null)
  const [execution, setExecution] = useState<ExecutionTaskDetail | null>(null)
  const [artifacts, setArtifacts] = useState<ScanArtifactView[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeReportTab, setActiveReportTab] = useState('summary')
  const [codeKnowledge, setCodeKnowledge] = useState<CodeChunkSearchResponse | null>(null)
  const [codeKnowledgeLoading, setCodeKnowledgeLoading] = useState(false)
  const [codeKnowledgeError, setCodeKnowledgeError] = useState<string | null>(null)

  const load = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      setLoadError(null)
      const taskRes = await scanTaskApi.detail(taskId)
      const nextTask = taskRes.data.data
      setTask(nextTask)
      setCodeKnowledgeLoading(true)
      setCodeKnowledgeError(null)

      const [artifactRes, executionRes, chunkRes] = await Promise.all([
        artifactApi.list(nextTask.projectId, { ownerType: 'SCAN_TASK', ownerId: taskId }),
        executionTaskApi.detailBySource(nextTask.projectId, 'SCAN_TASK', taskId).catch(() => null),
        codeChunkApi.search(nextTask.projectId, { scanTaskId: taskId, limit: 1 }).catch(error => {
          setCodeKnowledgeError(formatApiError(error, '加载 code_chunks 状态失败'))
          return null
        }),
      ])
      const records = artifactRes.data.data || []
      const previews = await Promise.all(records.map(async (record) => {
        try {
          const previewRes = await artifactApi.preview(nextTask.projectId, record.id)
          return { ...record, summaryJson: previewRes.data.data.text }
        } catch {
          return record
        }
      }))
      setArtifacts(previews)
      setExecution(executionRes?.data.data || null)
      setCodeKnowledge(chunkRes?.data.data || null)
    } catch (error) {
      setTask(null)
      setExecution(null)
      setArtifacts([])
      setCodeKnowledge(null)
      setLoadError(formatApiError(error, '加载扫描任务失败'))
    } finally {
      setLoading(false)
      setRefreshing(false)
      setCodeKnowledgeLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!task || !['PENDING', 'RUNNING'].includes(task.status)) return undefined
    const timer = window.setTimeout(() => load(true), 3000)
    return () => window.clearTimeout(timer)
  }, [load, task?.status])

  const reportArtifact = artifacts.find(item => item.artifactType === 'ARCHITECTURE_REPORT')
  const reportData = useMemo(() => parseJson(reportArtifact?.summaryJson), [reportArtifact?.summaryJson])
  const overview = reportData?.overview || {}
  const modules = reportData?.modules || {}
  const codeQuality = reportData?.codeQuality || {}
  const riskCount = Array.isArray(codeQuality.risks) ? codeQuality.risks.length : 0
  const apiRouteCount = Array.isArray(reportData?.apiRoutes) ? reportData.apiRoutes.length : 0
  const dbEntityCount = Array.isArray(reportData?.dbEntities) ? reportData.dbEntities.length : 0
  const moduleCount = (modules.controllers || 0) + (modules.services || 0) + (modules.repositories || 0) + (modules.entities || 0)
  const progress = execution?.task?.progress ?? taskProgress(task?.status)
  const isActiveTask = Boolean(task && ['PENDING', 'RUNNING'].includes(task.status))
  const currentStep = execution?.task?.currentStep || (task?.status === 'PENDING' ? 'pending' : null)
  const normalizedSteps = normalizeSteps(execution?.steps, currentStep, task?.status)
  const codeKnowledgeSignal = buildCodeKnowledgeSignal(codeKnowledge, task?.status, codeKnowledgeError)

  const handleCancel = async () => {
    if (!task) return
    setCancelling(true)
    try {
      await scanTaskApi.cancel(task.id)
      message.success('扫描任务已取消')
      await load(true)
    } catch (error) {
      message.error(formatApiError(error, '取消扫描任务失败'))
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="sl-empty-panel">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="正在加载扫描报告..." />
      </div>
    )
  }

  return (
    <div>
      {loadError && (
        <Alert type="error" showIcon message="加载失败" description={loadError} style={{ marginBottom: 16 }} />
      )}

      <div className="sl-scan-cockpit">
        <section className="sl-scan-cockpit-main">
          <Button aria-label="返回上一页" icon={<ArrowLeftOutlined />} className="sl-scan-back-button" onClick={() => navigate(-1)}>
            返回
          </Button>
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
            {reportData && <span>{formatNumber(overview.totalFiles)} files</span>}
          </div>

          <Progress percent={progress} status={task?.status === 'FAILED' ? 'exception' : task?.status === 'SUCCESS' ? 'success' : 'active'} />

          <div className="sl-scan-meta-strip">
            <ScanMeta label="分支" value={task?.branch || '-'} />
            <ScanMeta label="Commit" value={task?.commitSha ? task.commitSha.substring(0, 12) : '-'} />
            <ScanMeta label="触发方式" value={task?.triggerType || '-'} />
            <ScanMeta label="执行任务" value={execution?.task ? `#${execution.task.id}` : '-'} />
            <ScanMeta label="开始时间" value={formatTime(task?.startedAt)} />
            <ScanMeta label="结束时间" value={formatTime(task?.finishedAt)} />
          </div>

          <div className="sl-scan-cockpit-actions">
            {task?.projectId && (
              <Button
                aria-label={`返回项目 #${task.projectId} 工作台`}
                icon={<BranchesOutlined />}
                onClick={() => navigate(`/projects/${task.projectId}`)}
              >
                项目工作台
              </Button>
            )}
            <Button aria-label={`刷新扫描 #${taskId} 报告`} icon={<ReloadOutlined spin={refreshing} />} onClick={() => load(true)}>
              刷新
            </Button>
            {task?.projectId && execution?.task && (
              <Button
                aria-label={`查看扫描 #${taskId} 的执行详情`}
                icon={<ScheduleOutlined />}
                onClick={() => navigate(`/execution-tasks?projectId=${task.projectId}&taskId=${execution.task.id}`)}
              >
                执行详情
              </Button>
            )}
            {task?.projectId && (
              <ArtifactLinkButton projectId={task.projectId} ownerType="SCAN_TASK" ownerId={taskId} size="middle" label="产物库" />
            )}
            {task?.projectId && (
              <Button
                aria-label={`查看扫描 #${taskId} 的审计追踪`}
                icon={<SafetyCertificateOutlined />}
                onClick={() => navigate(scanAuditUrl(task.projectId, taskId))}
              >
                审计追踪
              </Button>
            )}
            {isActiveTask && (
              <Popconfirm
                title="取消扫描任务"
                description="当前步骤会在下一个检查点停止。"
                okText="取消任务"
                cancelText="返回"
                onConfirm={handleCancel}
              >
                <Button aria-label={`取消扫描 #${taskId}`} danger icon={<StopOutlined />} loading={cancelling}>
                  取消
                </Button>
              </Popconfirm>
            )}
          </div>

          {task?.errorMessage && (
            <Alert type="error" showIcon message="扫描失败" description={task.errorMessage} style={{ marginTop: 16 }} />
          )}
        </section>

        <section className="sl-scan-evidence-panel">
          <div className="sl-scan-evidence-head">
            <div>
              <span>Analysis evidence</span>
              <strong>{riskCount > 0 ? `${riskCount} 个风险项` : '暂无显著风险'}</strong>
            </div>
            <WarningOutlined />
          </div>
          <div className="sl-scan-evidence-grid">
            <ScanEvidenceMetric icon={<FileSearchOutlined />} label="文件" value={formatNumber(overview.totalFiles)} />
            <ScanEvidenceMetric icon={<BranchesOutlined />} label="模块" value={formatNumber(moduleCount)} />
            <ScanEvidenceMetric icon={<ApiOutlined />} label="API" value={formatNumber(apiRouteCount)} />
            <ScanEvidenceMetric icon={<DatabaseOutlined />} label="实体" value={formatNumber(dbEntityCount)} />
          </div>
          <div className="sl-scan-evidence-actions">
            <Button disabled={!reportData} onClick={() => setActiveReportTab('quality')}>风险</Button>
            <Button disabled={!reportData} onClick={() => setActiveReportTab('api')}>API</Button>
            <Button disabled={!reportData} onClick={() => setActiveReportTab('db')}>数据库</Button>
            <Button disabled={!reportData} onClick={() => setActiveReportTab('graph')}>依赖图谱</Button>
          </div>
        </section>
      </div>

      {isActiveTask && (
        <Alert
          type="info"
          showIcon
          message={`正在执行：${formatStepLabel(currentStep)}`}
          description="页面会每 3 秒刷新一次任务状态；扫描完成后报告、依赖图谱和产物库会自动可用。"
          style={{ marginBottom: 14 }}
        />
      )}

      <div className="sl-scan-step-grid" aria-label="扫描执行阶段">
        {normalizedSteps.map((step, index) => (
          <ScanStepCard key={step.stepKey} step={step} index={index + 1} />
        ))}
      </div>

      <CodeKnowledgePanel
        signal={codeKnowledgeSignal}
        loading={codeKnowledgeLoading}
        error={codeKnowledgeError}
        onRetry={() => load(true)}
        onOpenQa={() => task?.projectId && navigate(projectQaUrl(task.projectId, null, taskId))}
        onOpenChunks={() => task?.projectId && navigate(projectQaUrl(task.projectId, null, taskId))}
        onOpenArtifacts={() => task?.projectId && navigate(`/artifacts?projectId=${task.projectId}&ownerType=SCAN_TASK&ownerId=${taskId}`)}
      />

      {task?.status === 'FAILED' ? (
        <Card className="sl-section-card">
          <Empty description="扫描任务失败，暂无可用报告" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      ) : reportData ? (
        <ArchitectureReport
          data={reportData}
          scanTaskId={taskId}
          projectId={task?.projectId || 0}
          repositoryId={task?.repositoryId || 0}
          executionTaskId={execution?.task?.id || null}
          artifacts={artifacts}
          taskStatus={task?.status || 'UNKNOWN'}
          progress={progress}
          activeTab={activeReportTab}
          onTabChange={setActiveReportTab}
        />
      ) : artifacts.length > 0 ? (
        <ArtifactFallback projectId={task?.projectId || 0} scanTaskId={taskId} artifacts={artifacts} />
      ) : isActiveTask ? (
        <Card className="sl-section-card">
          <Empty description="扫描执行中，报告会在分析和切片完成后生成" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      ) : (
        <div className="sl-empty-panel">
          <Empty description="暂无分析产物，扫描完成后会自动生成报告" />
        </div>
      )}

    </div>
  )
}

function ArchitectureReport({
  data,
  scanTaskId,
  projectId,
  repositoryId,
  executionTaskId,
  artifacts,
  taskStatus,
  progress,
  activeTab,
  onTabChange,
}: {
  data: any
  scanTaskId: number
  projectId: number
  repositoryId: number
  executionTaskId: number | null
  artifacts: ScanArtifactView[]
  taskStatus: string
  progress: number
  activeTab: string
  onTabChange: (key: string) => void
}) {
  const navigate = useNavigate()
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
  const firstRepairableRisk = risks.find((risk: any) => riskFilePath(risk))
  const highRiskCount = risks.filter((risk: any) => String(risk?.severity || '').toUpperCase() === 'HIGH').length
  const hasGraphArtifact = artifacts.some(artifact => artifact.artifactType === 'DEPENDENCY_GRAPH')
  const hasCoreReportArtifact = artifacts.some(artifact => artifact.artifactType === 'ARCHITECTURE_REPORT')
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
      value: firstRepairableRisk ? 'Candidate' : 'Blocked',
      detail: firstRepairableRisk
        ? '已有可定位到文件的风险项，可生成受控修复候选。'
        : '缺少可定位文件路径的风险项，暂不能生成修复候选。',
      tone: firstRepairableRisk ? 'ready' : risks.length > 0 ? 'warning' : 'idle',
      actionLabel: '生成候选',
      disabled: !(repositoryId > 0 && firstRepairableRisk),
      onClick: () => firstRepairableRisk && navigate(autoRepairCandidateUrl(projectId, repositoryId, scanTaskId, firstRepairableRisk)),
    },
  ]

  return (
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
              <ReportDecisionPanel signal={reportSignal} />
              <ReportActionBoard items={reportActionItems} />
              <ReportEvidenceProfilePanel
                profile={evidenceProfile}
                canOpenExecution={Boolean(executionTaskId)}
                canOpenAutoRepair={Boolean(repositoryId > 0 && firstRepairableRisk)}
                onOpenArtifacts={() => navigate(`/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${scanTaskId}`)}
                onOpenExecution={() => executionTaskId && navigate(`/execution-tasks?projectId=${projectId}&taskId=${executionTaskId}`)}
                onOpenQa={() => navigate(projectQaUrl(projectId, null, scanTaskId))}
                onOpenAutoRepair={() => firstRepairableRisk && navigate(autoRepairCandidateUrl(projectId, repositoryId, scanTaskId, firstRepairableRisk))}
              />
              <ReportTraceMap
                items={reportTraceItems}
                canOpenQa={projectId > 0}
                onOpenQa={(question) => navigate(projectQaUrl(projectId, question, scanTaskId))}
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
                    renderItem={(risk: any) => (
                      <List.Item
                        actions={riskFilePath(risk) && repositoryId > 0 ? [
                          <Button
                            key="repair"
                            size="small"
                            icon={<CodeOutlined />}
                            onClick={() => navigate(autoRepairCandidateUrl(projectId, repositoryId, scanTaskId, risk))}
                          >
                            生成修复候选
                          </Button>,
                        ] : undefined}
                      >
                        <List.Item.Meta
                          avatar={<ExclamationCircleOutlined style={{ color: riskColor(risk.severity) }} />}
                          title={<Space><Tag color={riskTag(risk.severity)}>{risk.severity || 'INFO'}</Tag>{risk.category}</Space>}
                          description={(
                            <Space direction="vertical" size={2}>
                              <span>{risk.message}</span>
                              {riskFilePath(risk) && <Text code>{riskFilePath(risk)}</Text>}
                            </Space>
                          )}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="未识别到显著风险" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>

              <Card className="sl-section-card sl-col-6" title="技术债">
                {debts.length > 0 ? (
                  <List
                    dataSource={debts}
                    renderItem={(debt: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={<Space><Tag color={riskTag(debt.severity)}>{debt.severity || 'INFO'}</Tag>{debt.category}</Space>}
                          description={debt.detail}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无技术债评估" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                          <span>{item}</span>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无建议" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                  { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true },
                  { title: 'Controller', dataIndex: 'handler_class', key: 'handler_class', ellipsis: true },
                  { title: '函数', dataIndex: 'handler_method', key: 'handler_method', width: 160 },
                  { title: '行号', dataIndex: 'line_number', key: 'line_number', width: 80 },
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
                    { title: '文件', dataIndex: 'file_path', key: 'file_path', ellipsis: true },
                  ]}
                />
              ) : (
                <Empty description="未检测到数据库实体" />
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
                <Button
                  aria-label={`打开 ${ARTIFACT_TITLES[artifact.artifactType] || artifact.artifactType} 产物库`}
                  size="small"
                  icon={<FileTextOutlined />}
                  onClick={() => navigate(artifactDetailUrl(projectId, scanTaskId, artifact.id))}
                  style={{ marginBottom: 10 }}
                >
                  查看产物
                </Button>
              )}
              {data ? (
                <pre className="sl-code-block">{JSON.stringify(data, null, 2)}</pre>
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
          <Button size="small" icon={<ReloadOutlined spin={loading} />} onClick={onRetry}>重试</Button>
        </div>
      )}

      <div className="sl-code-knowledge-actions">
        <Button icon={<FileSearchOutlined />} disabled={signal.totalChunks <= 0} onClick={onOpenQa}>
          代码问答
        </Button>
        <Button icon={<CodeOutlined />} disabled={signal.totalChunks <= 0} onClick={onOpenChunks}>
          检索切片
        </Button>
        <Button icon={<FileTextOutlined />} onClick={onOpenArtifacts}>
          产物证据
        </Button>
        <Button icon={<ReloadOutlined spin={loading} />} onClick={onRetry}>
          刷新状态
        </Button>
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

function ReportActionBoard({ items }: { items: ReportActionItem[] }) {
  return (
    <section className="sl-report-action-board" aria-label="报告后续行动">
      {items.map(item => (
        <div key={item.key} className={`sl-report-action-card sl-report-action-card-${item.tone}`}>
          <div className="sl-report-action-head">
            <div className="sl-report-action-icon">{item.icon}</div>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          </div>
          <p>{item.detail}</p>
          <Button size="small" disabled={item.disabled} onClick={item.onClick}>
            {item.actionLabel}
          </Button>
        </div>
      ))}
    </section>
  )
}

function ReportEvidenceProfilePanel({
  profile,
  canOpenExecution,
  canOpenAutoRepair,
  onOpenArtifacts,
  onOpenExecution,
  onOpenQa,
  onOpenAutoRepair,
}: {
  profile: ReportEvidenceProfile
  canOpenExecution: boolean
  canOpenAutoRepair: boolean
  onOpenArtifacts: () => void
  onOpenExecution: () => void
  onOpenQa: () => void
  onOpenAutoRepair: () => void
}) {
  return (
    <section className={`sl-report-evidence-profile sl-report-evidence-profile-${profile.tone}`}>
      <div className="sl-report-evidence-head">
        <div>
          <div className="sl-kicker">Evidence Contract</div>
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
        <Button icon={<FileTextOutlined />} onClick={onOpenArtifacts}>产物库</Button>
        <Button icon={<ScheduleOutlined />} disabled={!canOpenExecution} onClick={onOpenExecution}>执行流水线</Button>
        <Button icon={<FileSearchOutlined />} onClick={onOpenQa}>代码问答</Button>
        <Button icon={<CodeOutlined />} disabled={!canOpenAutoRepair} onClick={onOpenAutoRepair}>修复候选</Button>
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

function ReportTraceMap({
  items,
  canOpenQa,
  onOpenQa,
}: {
  items: ReportTraceItem[]
  canOpenQa: boolean
  onOpenQa: (question: string) => void
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
        {items.map(item => (
          <div key={item.key} className={`sl-report-trace-card sl-report-trace-card-${item.tone}`}>
            <div className="sl-report-trace-card-head">
              <div className="sl-report-trace-icon">{item.icon}</div>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
            <div className="sl-report-trace-source">{item.source}</div>
            <p>{item.detail}</p>
            <div className="sl-report-trace-actions">
              <Button size="small" disabled={item.disabled} onClick={item.onOpen}>
                {item.actionLabel}
              </Button>
              <Button
                size="small"
                disabled={!canOpenQa || !item.qaQuestion}
                onClick={() => item.qaQuestion && onOpenQa(item.qaQuestion)}
              >
                追问代码
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
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
  if (status === 'READY') return 'ready'
  if (status === 'RISK') return 'danger'
  if (status === 'WARNING' || status === 'GAP') return 'warning'
  return 'idle'
}

function normalizeSteps(steps: ExecutionStep[] | undefined, currentStep?: string | null, taskStatus?: string): ExecutionStep[] {
  const existing = steps || []
  if (existing.length > 0) return existing
  return ['prepare_repository', 'analyze_code', 'chunk_code', 'finalize_scan'].map((stepKey, index) => ({
    id: index + 1,
    taskId: 0,
    attemptId: null,
    stepKey,
    stepName: STEP_LABEL[stepKey],
    status: currentStep === stepKey && taskStatus === 'RUNNING' ? 'RUNNING' : 'PENDING',
    logSummary: null,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '',
    updatedAt: '',
  }))
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

function projectQaUrl(projectId: number, question?: string | null, scanTaskId?: number | null) {
  const params = new URLSearchParams()
  params.set('tab', 'qa')
  if (question && question.trim()) {
    params.set('question', question)
  }
  if (scanTaskId) {
    params.set('scanTaskId', String(scanTaskId))
  }
  return `/projects/${projectId}?${params.toString()}`
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

function scanAuditUrl(projectId: number, scanTaskId: number) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('scanTaskId', String(scanTaskId))
  return `/audit-logs?${params.toString()}`
}

function autoRepairCandidateUrl(projectId: number, repositoryId: number, scanTaskId: number, risk: any) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('repositoryId', String(repositoryId))
  params.set('openCreate', '1')
  params.set('source', `扫描报告 #${scanTaskId}`)
  const filePath = riskFilePath(risk)
  if (filePath) params.set('filePath', filePath)
  params.set('targetDesc', buildRiskRepairTarget(scanTaskId, risk))
  return `/auto-repairs?${params.toString()}`
}

function riskFilePath(risk: any) {
  return String(risk?.file_path || risk?.filePath || risk?.path || '').trim()
}

function buildRiskRepairTarget(scanTaskId: number, risk: any) {
  const parts = [
    `来自扫描报告 #${scanTaskId} 的风险项，请生成最小、可审查的单文件修复 patch。`,
    `严重级别：${risk?.severity || 'INFO'}`,
    `类别：${risk?.category || '未分类'}`,
    `问题描述：${risk?.message || risk?.detail || '请根据报告风险项修复该文件。'}`,
  ]
  const suggestion = risk?.suggestion || risk?.recommendation
  if (suggestion) {
    parts.push(`建议方向：${suggestion}`)
  }
  return parts.join('\n').slice(0, 1200)
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
