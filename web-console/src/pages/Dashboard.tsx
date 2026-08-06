import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Progress, Space, Table, Tag, Typography } from 'antd'
import {
  ApiOutlined,
  ArrowRightOutlined,
  BranchesOutlined,
  CodeOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FieldTimeOutlined,
  FileSearchOutlined,
  ProjectOutlined,
  ReloadOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { formatApiError } from '../api/client'
import { dashboardApi, DashboardStats, LanguageStat, RecentScan } from '../api/dashboard'
import ActionButton from '../components/ui/ActionButton'
import StateBlock from '../components/ui/StateBlock'

const { Text } = Typography

const LANG_COLORS: Record<string, string> = {
  Java: '#b07219',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  HTML: '#e34c26',
  CSS: '#563d7c',
  YAML: '#cb171e',
  XML: '#0060ac',
  JSON: '#292929',
  Markdown: '#083fa1',
  Shell: '#89e051',
  SQL: '#e38c00',
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

type CommandTone = 'ready' | 'warning' | 'danger' | 'idle'

interface DashboardCommandItem {
  key: string
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  tone: CommandTone
  actionLabel: string
  disabled?: boolean
  disabledReason?: string
  onClick: () => void
}

interface DashboardNextAction {
  key: string
  icon: React.ReactNode
  title: string
  label: string
  description: string
  tone: CommandTone
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  evidence: { label: string; value: string; tone: CommandTone }[]
  blockers: string[]
}

interface TrustedLoopStage {
  key: string
  label: string
  status: CommandTone
  value: string
  description: string
}

interface DashboardProductPlane {
  key: 'front-office' | 'developer-console' | 'back-office'
  label: string
  subtitle: string
  value: string
  status: CommandTone
  description: string
  pages: string[]
  actionLabel: string
  onAction: () => void
}

interface DashboardExecutiveSignal {
  key: string
  label: string
  value: string
  detail: string
  tone: CommandTone
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const min = Math.floor(ms / 60_000)
  const sec = Math.round((ms % 60_000) / 1000)
  return `${min}m ${sec}s`
}

function formatNumber(value: number | null | undefined) {
  return value == null ? '-' : value.toLocaleString()
}

function clampPercent(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeCommandTone(value: string | null | undefined): CommandTone | null {
  if (value === 'ready' || value === 'warning' || value === 'danger' || value === 'idle') {
    return value
  }
  return null
}

function buildDashboardAgentChatHandoffUrl(scan: RecentScan, question: string) {
  return `/agent-chat?${new URLSearchParams({
    handoff: 'code-understanding',
    source: 'DASHBOARD_CODE_QA_ENTRY',
    inputKind: 'DASHBOARD_RECOMMENDED_QUESTION',
    inputLabel: 'Dashboard 推荐问题',
    sourceLabel: `Scan #${scan.id}`,
    projectId: String(scan.projectId),
    scanTaskId: String(scan.id),
    filePath: scan.repositoryName || 'repository',
    lineRef: question,
    contextRole: 'dashboard-next-action',
    evidenceType: 'code_chunks',
    relevanceScore: 'dashboard',
  }).toString()}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [scans, setScans] = useState<RecentScan[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadDashboard = useCallback((silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    Promise.all([dashboardApi.stats(), dashboardApi.recentScans(12)])
      .then(([statsRes, scansRes]) => {
        setLoadError(null)
        setStats(statsRes.data.data)
        setScans(scansRes.data.data)
      })
      .catch(error => setLoadError(formatApiError(error, '加载仪表盘失败')))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const languages: LanguageStat[] = useMemo(() => {
    if (!stats?.languagesJson) return []
    try {
      const parsed = JSON.parse(stats.languagesJson)
      if (Array.isArray(parsed)) return parsed
      return Object.entries(parsed).map(([name, val]: [string, any]) => ({
        name,
        file_count: val?.file_count ?? 0,
        line_count: val?.line_count ?? 0,
      }))
    } catch {
      return []
    }
  }, [stats?.languagesJson])

  const totalLangLines = languages.reduce((sum, lang) => sum + (lang.line_count || 0), 0)
  const totalCompleted = (stats?.successScans || 0) + (stats?.failedScans || 0)
  const successRate = totalCompleted > 0 ? Math.round(((stats?.successScans || 0) / totalCompleted) * 100) : 0
  const activeScans = (stats?.runningScans || 0) + (stats?.pendingScans || 0)
  const latestScan = scans[0]
  const latestSuccessfulScan = scans.find(scan => scan.status === 'SUCCESS')
  const riskCount = stats?.latestRiskCount ?? 0
  const latestCodeChunks = stats?.latestCodeChunks
  const latestEmbeddedChunks = stats?.latestEmbeddedChunks
  const repositoryReady = (stats?.repositoryCount || 0) > 0
  const latestAnalysisReady = stats?.latestTotalFiles != null
  const codeKnowledgeReady = (latestCodeChunks || 0) > 0
  const embeddingCoverage = latestCodeChunks && latestCodeChunks > 0
    ? Math.round(((latestEmbeddedChunks || 0) / latestCodeChunks) * 100)
    : 0
  const reportEvidenceReady = Boolean(latestSuccessfulScan)
  const nextStepReady = codeKnowledgeReady || riskCount > 0
  const trustedLoopStages: TrustedLoopStage[] = [
    {
      key: 'repository',
      label: '仓库接入',
      status: repositoryReady ? 'ready' : 'warning',
      value: repositoryReady ? `${formatNumber(stats?.repositoryCount)} 个仓库` : '未接入',
      description: repositoryReady ? '公开仓库上下文可用' : '先接入 GitHub HTTPS 公开仓库',
    },
    {
      key: 'scan',
      label: '可信扫描',
      status: activeScans > 0 ? 'idle' : latestSuccessfulScan ? 'ready' : 'warning',
      value: activeScans > 0 ? `${activeScans} 运行中` : latestSuccessfulScan ? `Scan #${latestSuccessfulScan.id}` : '无成功扫描',
      description: activeScans > 0 ? '等待 analyzer 和 artifact 产出' : latestSuccessfulScan ? '已有可复盘报告入口' : '需要至少一次成功扫描',
    },
    {
      key: 'knowledge',
      label: '代码证据',
      status: codeKnowledgeReady ? 'ready' : latestAnalysisReady ? 'warning' : 'idle',
      value: codeKnowledgeReady ? `${formatNumber(latestCodeChunks)} chunks` : latestAnalysisReady ? '待切片' : '等待扫描',
      description: codeKnowledgeReady ? `embedding coverage ${embeddingCoverage}%` : 'QA 和报告引用还缺少稳定代码切片',
    },
    {
      key: 'evidence',
      label: '风险与下一步',
      status: nextStepReady ? (riskCount > 0 ? 'danger' : 'ready') : 'idle',
      value: riskCount > 0 ? `${riskCount} 个风险` : nextStepReady ? '可进入 QA' : '未形成动作',
      description: riskCount > 0 ? '先复盘证据再创建修复候选' : nextStepReady ? '已具备源码级问答入口' : '完成扫描和切片后生成下一步',
    },
  ]
  const localTrustedLoopReadyCount = trustedLoopStages.filter(stage => stage.status === 'ready' || stage.status === 'danger').length
  const localTrustedLoopCompletion = Math.round((localTrustedLoopReadyCount / trustedLoopStages.length) * 100)
  const apiTrustedLoopCompletion = clampPercent(stats?.trustedLoopCompletionRate)
  const trustedLoopCompletion = apiTrustedLoopCompletion ?? localTrustedLoopCompletion
  const trustedLoopStatus: CommandTone = loadError
    ? 'danger'
    : normalizeCommandTone(stats?.trustedLoopStatus)
      ?? (trustedLoopCompletion >= 100 && riskCount === 0
        ? 'ready'
        : trustedLoopCompletion >= 50
          ? 'warning'
          : 'idle')
  const trustedLoopStatusLabel = loadError
    ? '数据异常'
    : stats?.trustedLoopStatusLabel
      || (trustedLoopCompletion >= 100 && riskCount === 0
        ? '闭环可用'
        : trustedLoopCompletion >= 50
          ? '需要复核'
          : '等待启动')
  const metricsSourceLabel = stats?.trustedLoopMetricsSource === 'API' ? 'API-backed metrics' : 'client fallback'
  const apiReportEvidenceReady = typeof stats?.reportEvidenceReady === 'boolean' ? stats.reportEvidenceReady : reportEvidenceReady
  const apiCodeQaReadiness = stats?.codeQaReadiness || (codeKnowledgeReady ? 'READY' : latestAnalysisReady ? 'REVIEW' : 'GAP')
  const apiRecoverySignal = loadError ? 'FAIL' : stats?.recoverySignal || (activeScans > 0 ? 'RUNNING' : riskCount > 0 ? 'RISK' : 'OK')
  const productMetrics = [
    {
      label: 'Trusted Loop',
      value: `${trustedLoopCompletion}%`,
      detail: `${trustedLoopStatusLabel} / ${metricsSourceLabel}`,
      tone: trustedLoopStatus,
    },
    {
      label: 'Report Evidence',
      value: latestSuccessfulScan ? `Scan #${latestSuccessfulScan.id}` : '-',
      detail: apiReportEvidenceReady ? '报告入口可用' : '等待成功扫描',
      tone: apiReportEvidenceReady ? 'ready' as CommandTone : 'warning' as CommandTone,
    },
    {
      label: 'Code QA Readiness',
      value: apiCodeQaReadiness,
      detail: codeKnowledgeReady ? `${formatNumber(latestCodeChunks)} chunks` : 'code_chunks 未就绪',
      tone: codeKnowledgeReady ? 'ready' as CommandTone : latestAnalysisReady ? 'warning' as CommandTone : 'idle' as CommandTone,
    },
    {
      label: 'Recovery Signal',
      value: apiRecoverySignal,
      detail: loadError ? '需要重试加载' : activeScans > 0 ? '任务执行中' : riskCount > 0 ? '风险待复盘' : '无阻断信号',
      tone: loadError ? 'danger' as CommandTone : activeScans > 0 || riskCount > 0 ? 'warning' as CommandTone : 'ready' as CommandTone,
    },
  ]
  const productPlanes = useMemo<DashboardProductPlane[]>(() => {
    const reportTarget = latestSuccessfulScan ? `/scan-tasks/${latestSuccessfulScan.id}` : '/projects'
    const qaQuestion = '请基于当前 scan 的 code_chunks 解释核心业务调用链，并列出文件证据'
    const qaTarget = latestSuccessfulScan ? buildDashboardAgentChatHandoffUrl(latestSuccessfulScan, qaQuestion) : '/agent-chat'
    const governanceTarget = latestSuccessfulScan ? `/audit-logs?projectId=${latestSuccessfulScan.projectId}` : '/audit-logs'

    return [
      {
        key: 'front-office',
        label: '前台体验',
        subtitle: '用户可见主流程',
        value: latestSuccessfulScan ? `Scan #${latestSuccessfulScan.id}` : repositoryReady ? '等待成功扫描' : '等待仓库',
        status: latestSuccessfulScan ? (riskCount > 0 ? 'warning' : 'ready') : repositoryReady ? 'warning' : 'idle',
        description: '面向普通使用者展示项目接入、扫描报告、风险证据、QA 问答和修复入口；前台体验必须先让主链路可理解、可点击、可恢复。',
        pages: ['项目与仓库', '扫描报告', '代码问答', '修复候选'],
        actionLabel: latestSuccessfulScan ? '打开报告' : '进入项目',
        onAction: () => navigate(reportTarget),
      },
      {
        key: 'developer-console',
        label: '开发者控制台',
        subtitle: '工程执行与证据台',
        value: codeKnowledgeReady ? `${formatNumber(latestCodeChunks)} chunks` : latestAnalysisReady ? '切片待复核' : '等待扫描',
        status: codeKnowledgeReady ? 'ready' : latestAnalysisReady ? 'warning' : 'idle',
        description: '面向研发和 Agent 协作，统一从代码问答进入 code_chunks、报告引用、任务流水线、CI 诊断、PR 审查和 Issue 拆解，避免形成两套 QA 产品入口。',
        pages: ['执行任务', '运行产物', 'CI 诊断', 'PR 审查', 'Issue 拆解'],
        actionLabel: codeKnowledgeReady ? '进入 QA' : latestSuccessfulScan ? '检查切片' : '查看任务',
        onAction: () => navigate(codeKnowledgeReady ? qaTarget : latestSuccessfulScan ? `/scan-tasks/${latestSuccessfulScan.id}` : '/execution-tasks'),
      },
      {
        key: 'back-office',
        label: '后台治理',
        subtitle: '安全、审计与配置',
        value: loadError ? '数据异常' : riskCount > 0 ? `${riskCount} 个风险` : '治理在线',
        status: loadError ? 'danger' : riskCount > 0 ? 'warning' : 'ready',
        description: '面向管理员和安全负责人，集中审计日志、模型配置、raw access 边界、凭据策略和发布证据；后台治理不等于 RBAC、多租户或生产部署已完成。',
        pages: ['审计日志', '模型配置', '安全边界', '发布证据'],
        actionLabel: '打开审计',
        onAction: () => navigate(governanceTarget),
      },
    ]
  }, [
    codeKnowledgeReady,
    latestAnalysisReady,
    latestCodeChunks,
    latestSuccessfulScan,
    loadError,
    navigate,
    repositoryReady,
    riskCount,
  ])

  const pipeline = [
    {
      key: 'repo',
      label: '仓库接入',
      value: stats?.repositoryCount ?? 0,
      meta: `${stats?.projectCount ?? 0} 个项目空间`,
      icon: <ProjectOutlined />,
      state: repositoryReady ? 'ready' : 'idle',
    },
    {
      key: 'scan',
      label: '扫描执行',
      value: stats?.totalScans ?? 0,
      meta: activeScans > 0 ? `${activeScans} 个任务运行中` : `成功率 ${successRate}%`,
      icon: activeScans > 0 ? <ReloadOutlined spin /> : <ExperimentOutlined />,
      state: activeScans > 0 ? 'running' : totalCompleted > 0 ? 'ready' : 'idle',
    },
    {
      key: 'knowledge',
      label: '代码知识库',
      value: latestCodeChunks == null ? '-' : formatNumber(latestCodeChunks),
      meta: latestCodeChunks == null
        ? `${formatNumber(stats?.latestTotalLines)} 行代码`
        : `向量覆盖 ${embeddingCoverage}%`,
      icon: <CodeOutlined />,
      state: codeKnowledgeReady ? 'ready' : latestAnalysisReady ? 'attention' : 'idle',
    },
    {
      key: 'evidence',
      label: '风险证据',
      value: riskCount,
      meta: riskCount > 0 ? '需要审阅' : '暂无风险项',
      icon: riskCount > 0 ? <WarningOutlined /> : <SafetyCertificateOutlined />,
      state: riskCount > 0 ? 'attention' : latestAnalysisReady ? 'ready' : 'idle',
    },
  ]

  const commandItems: DashboardCommandItem[] = useMemo(() => {
    const scanTarget = latestSuccessfulScan
      ? `/scan-tasks/${latestSuccessfulScan.id}`
      : activeScans > 0
        ? '/execution-tasks'
        : '/projects'
    const projectTarget = latestSuccessfulScan ? `/projects/${latestSuccessfulScan.projectId}` : '/projects'
    const qaQuestion = embeddingCoverage >= 60
      ? '请解释本项目核心 Controller Service Repository 调用链，并列出关键文件证据'
      : latestEmbeddedChunks && latestEmbeddedChunks > 0
        ? '哪些模块已有向量证据，哪些仍需要补齐 embedding？'
        : '当前代码问答可以使用哪些 code_chunks 证据？'
    const qaTarget = codeKnowledgeReady && latestSuccessfulScan
      ? buildDashboardAgentChatHandoffUrl(latestSuccessfulScan, qaQuestion)
      : latestSuccessfulScan
        ? `/scan-tasks/${latestSuccessfulScan.id}`
        : '/agent-chat'
    const repairParams = latestSuccessfulScan
      ? new URLSearchParams({
        projectId: String(latestSuccessfulScan.projectId),
        repositoryId: String(latestSuccessfulScan.repositoryId),
        openCreate: '1',
        source: `仪表盘风险复核 / scan #${latestSuccessfulScan.id}`,
      }).toString()
      : ''
    const repairTarget = repairParams ? `/auto-repairs?${repairParams}` : '/auto-repairs'
    const auditTarget = latestSuccessfulScan ? `/audit-logs?projectId=${latestSuccessfulScan.projectId}` : '/audit-logs'

    return [
      {
        key: 'repository',
        icon: <ProjectOutlined />,
        label: '仓库接入',
        value: repositoryReady ? `${formatNumber(stats?.repositoryCount)} repos` : '未接入',
        detail: repositoryReady
          ? '公开仓库已接入，可继续触发扫描或复盘现有报告。'
          : '先创建项目并接入 GitHub HTTPS 公开仓库。',
        tone: repositoryReady ? 'ready' : 'warning',
        actionLabel: repositoryReady ? '管理项目' : '接入仓库',
        onClick: () => navigate(projectTarget),
      },
      {
        key: 'report',
        icon: <FileSearchOutlined />,
        label: '报告复盘',
        value: latestSuccessfulScan ? `Scan #${latestSuccessfulScan.id}` : activeScans > 0 ? '生成中' : '无报告',
        detail: latestSuccessfulScan
          ? '打开最新成功扫描，查看报告决策、风险证据和后续行动。'
          : activeScans > 0
            ? '扫描仍在执行，先进入任务中心观察进度和日志。'
            : '需要先完成一次仓库扫描，才能进入报告复盘。',
        tone: latestSuccessfulScan ? (riskCount > 0 ? 'warning' : 'ready') : activeScans > 0 ? 'idle' : 'warning',
        actionLabel: latestSuccessfulScan ? '打开报告' : activeScans > 0 ? '查看任务' : '触发扫描',
        onClick: () => navigate(scanTarget),
      },
      {
        key: 'qa',
        icon: <RobotOutlined />,
        label: '代码问答',
        value: codeKnowledgeReady ? `${formatNumber(latestCodeChunks)} chunks` : latestAnalysisReady ? '待切片' : '等待扫描',
        detail: codeKnowledgeReady
          ? '进入代码问答工作台，基于 code_chunks 检索和报告证据理解代码。'
          : latestAnalysisReady
            ? '最新扫描已有报告，但 code_chunks 未就绪，先打开扫描详情复核切片状态。'
          : '完成扫描和切片后，代码问答会获得可追踪证据上下文。',
        tone: codeKnowledgeReady ? 'ready' : latestAnalysisReady ? 'warning' : 'idle',
        actionLabel: codeKnowledgeReady ? '进入 QA' : latestAnalysisReady ? '检查切片' : '先去项目',
        disabled: !repositoryReady,
        disabledReason: !repositoryReady ? '需要先接入可扫描仓库，代码问答才能获得项目和 code_chunks 上下文。' : undefined,
        onClick: () => navigate(qaTarget),
      },
      {
        key: 'repair',
        icon: <ToolOutlined />,
        label: '自动修复',
        value: riskCount > 0 ? `${riskCount} risks` : '待候选',
        detail: riskCount > 0 && latestSuccessfulScan
          ? '基于最新风险报告创建受控修复候选，后续只生成可审查 patch。'
          : '没有明确风险项时，先从报告页确认修复目标再进入补丁流程。',
        tone: riskCount > 0 ? 'danger' : latestSuccessfulScan ? 'warning' : 'idle',
        actionLabel: riskCount > 0 ? '生成候选' : '查看修复',
        disabled: !latestSuccessfulScan,
        disabledReason: !latestSuccessfulScan ? '需要先完成一次成功扫描并生成报告，自动修复才能绑定证据和目标文件。' : undefined,
        onClick: () => navigate(repairTarget),
      },
      {
        key: 'governance',
        icon: <SafetyCertificateOutlined />,
        label: '审计治理',
        value: loadError ? '异常' : '在线',
        detail: '复核关键操作、Agent 工具调用和 Webhook Delivery 的追责链路。',
        tone: loadError ? 'danger' : 'ready',
        actionLabel: '打开审计',
        onClick: () => navigate(auditTarget),
      },
    ]
  }, [
    activeScans,
    codeKnowledgeReady,
    embeddingCoverage,
    latestAnalysisReady,
    latestCodeChunks,
    latestSuccessfulScan,
    loadError,
    navigate,
    repositoryReady,
    riskCount,
    stats?.repositoryCount,
  ])

  const nextAction: DashboardNextAction = useMemo(() => {
    const evidence = [
      {
        label: '仓库',
        value: repositoryReady ? `${formatNumber(stats?.repositoryCount)} ready` : '未接入',
        tone: repositoryReady ? 'ready' as CommandTone : 'warning' as CommandTone,
      },
      {
        label: '扫描',
        value: activeScans > 0 ? `${activeScans} running` : latestSuccessfulScan ? `#${latestSuccessfulScan.id}` : '无成功扫描',
        tone: activeScans > 0 ? 'idle' as CommandTone : latestSuccessfulScan ? 'ready' as CommandTone : 'warning' as CommandTone,
      },
      {
        label: 'code_chunks',
        value: codeKnowledgeReady ? formatNumber(latestCodeChunks) : latestAnalysisReady ? '待生成' : '等待扫描',
        tone: codeKnowledgeReady ? 'ready' as CommandTone : latestAnalysisReady ? 'warning' as CommandTone : 'idle' as CommandTone,
      },
      {
        label: '风险',
        value: riskCount > 0 ? `${riskCount} risks` : latestAnalysisReady ? '清洁' : '未知',
        tone: riskCount > 0 ? 'danger' as CommandTone : latestAnalysisReady ? 'ready' as CommandTone : 'idle' as CommandTone,
      },
    ]

    if (loadError) {
      return {
        key: 'recover-dashboard',
        icon: <ReloadOutlined spin={refreshing} />,
        title: '恢复仪表盘数据',
        label: '数据异常',
        description: '当前统计数据加载失败，先恢复控制台数据再继续判断主链路状态。',
        tone: 'danger',
        primaryLabel: '重试加载',
        onPrimary: () => loadDashboard(true),
        secondaryLabel: '打开审计',
        onSecondary: () => navigate('/audit-logs'),
        evidence,
        blockers: ['仪表盘 API 返回异常或网络不可达'],
      }
    }
    if (!repositoryReady) {
      return {
        key: 'connect-repository',
        icon: <ProjectOutlined />,
        title: '接入第一个公开仓库',
        label: '主链路入口',
        description: '先创建项目并接入 GitHub HTTPS 公开仓库，后续扫描、报告、QA 和自动修复才有数据来源。',
        tone: 'warning',
        primaryLabel: '接入仓库',
        onPrimary: () => navigate('/projects'),
        evidence,
        blockers: ['缺少可扫描仓库'],
      }
    }
    if (activeScans > 0) {
      return {
        key: 'watch-running-scan',
        icon: <ReloadOutlined spin />,
        title: '跟踪运行中的扫描任务',
        label: '任务流水线',
        description: '扫描尚未完成，先查看执行任务日志，确认 clone、analyzer、artifact 和 code_chunks 阶段是否继续推进。',
        tone: 'idle',
        primaryLabel: '查看任务',
        onPrimary: () => navigate('/execution-tasks'),
        secondaryLabel: '刷新状态',
        onSecondary: () => loadDashboard(true),
        evidence,
        blockers: ['等待扫描完成后才能复盘报告'],
      }
    }
    if (!latestSuccessfulScan) {
      return {
        key: 'start-first-scan',
        icon: <ExperimentOutlined />,
        title: '触发一次仓库扫描',
        label: '缺少报告',
        description: '已有仓库但没有成功扫描，下一步应进入项目管理触发扫描，形成报告和可检索代码证据。',
        tone: 'warning',
        primaryLabel: '打开项目',
        onPrimary: () => navigate('/projects'),
        evidence,
        blockers: ['缺少成功扫描记录'],
      }
    }
    if (!codeKnowledgeReady) {
      return {
        key: 'inspect-code-chunks',
        icon: <CodeOutlined />,
        title: '检查 code_chunks 生成状态',
        label: '检索能力未就绪',
        description: '最新扫描已完成，但代码知识库尚未形成可用切片。先打开扫描详情，确认 analyzer artifact 和 code_chunks 入库状态。',
        tone: 'warning',
        primaryLabel: '打开扫描详情',
        onPrimary: () => navigate(`/scan-tasks/${latestSuccessfulScan.id}`),
        secondaryLabel: '查看产物',
        onSecondary: () => navigate('/artifacts'),
        evidence,
        blockers: ['code_chunks 为 0，QA 和证据抽屉质量不足'],
      }
    }
    if (riskCount > 0) {
      const repairParams = new URLSearchParams({
        projectId: String(latestSuccessfulScan.projectId),
        repositoryId: String(latestSuccessfulScan.repositoryId),
        openCreate: '1',
        source: `仪表盘风险复核 / scan #${latestSuccessfulScan.id}`,
      }).toString()
      return {
        key: 'review-risk-report',
        icon: <WarningOutlined />,
        title: '复盘风险证据并生成修复候选',
        label: '有风险待处理',
        description: '最新报告包含风险项。先打开报告核对证据，再按明确文件或风险创建受控 AutoRepair 候选。',
        tone: 'danger',
        primaryLabel: '打开报告',
        onPrimary: () => navigate(`/scan-tasks/${latestSuccessfulScan.id}`),
        secondaryLabel: '生成候选',
        onSecondary: () => navigate(`/auto-repairs?${repairParams}`),
        evidence,
        blockers: [],
      }
    }
    return {
      key: 'ask-code-qa',
      icon: <RobotOutlined />,
      title: '进入代码问答复盘主链路',
      label: '证据就绪',
      description: '仓库、扫描和 code_chunks 已就绪。下一步用 QA 验证核心调用链，再从报告证据进入修复或审计闭环。',
      tone: 'ready',
      primaryLabel: '进入 QA',
      onPrimary: () => navigate(buildDashboardAgentChatHandoffUrl(
        latestSuccessfulScan,
        '请基于当前 scan 的 code_chunks 解释核心业务调用链，并列出文件证据',
      )),
      secondaryLabel: '打开报告',
      onSecondary: () => navigate(`/scan-tasks/${latestSuccessfulScan.id}`),
      evidence,
      blockers: [],
    }
  }, [
    activeScans,
    codeKnowledgeReady,
    latestAnalysisReady,
    latestCodeChunks,
    latestSuccessfulScan,
    loadDashboard,
    loadError,
    navigate,
    refreshing,
    repositoryReady,
    riskCount,
    stats?.repositoryCount,
  ])
  const executiveSignals = useMemo<DashboardExecutiveSignal[]>(() => [
    {
      key: 'phase-progress',
      label: '阶段进度',
      value: 'P0 Strategic Foundation',
      detail: '当前只建立可审查源码基线并执行 P0-05；P1 及正常功能开发仍被 Gate 阻断。',
      tone: 'warning',
    },
    {
      key: 'quality-state',
      label: '继承链路状态',
      value: `${trustedLoopCompletion}% / ${trustedLoopStatusLabel}`,
      detail: `${metricsSourceLabel}；该百分比只描述继承产品链路就绪度，不是 Verified Task Success Rate。`,
      tone: trustedLoopStatus,
    },
    {
      key: 'risk-blocker',
      label: '风险阻塞',
      value: loadError ? '数据异常' : riskCount > 0 ? `${riskCount} risks` : activeScans > 0 ? `${activeScans} running` : '无当前阻断',
      detail: loadError
        ? '继承产品运行信号：先恢复 Dashboard API 或网络；不生成 AIOS 项目任务。'
        : riskCount > 0
          ? '继承产品运行信号：先复盘报告证据，再进入修复候选或审计；不改变 P0-05 优先级。'
          : activeScans > 0
            ? '继承产品运行信号：等待扫描完成后再查看报告和 code_chunks。'
            : '继承产品运行未发现显式阻断；项目开发仍只执行 P0-05。',
      tone: loadError ? 'danger' : riskCount > 0 ? 'danger' : activeScans > 0 ? 'idle' : 'ready',
    },
    {
      key: 'current-project-task',
      label: '当前项目任务',
      value: 'P0-05 Baseline Slicing',
      detail: '这是当前唯一项目开发任务；下方产品操作只用于访问继承系统，不进入 AIOS 排期或阶段投入。',
      tone: 'warning',
    },
  ], [
    activeScans,
    loadError,
    metricsSourceLabel,
    riskCount,
    trustedLoopCompletion,
    trustedLoopStatus,
    trustedLoopStatusLabel,
  ])

  return (
    <div>
      <div className="sl-dashboard-hero">
        <div className="sl-dashboard-hero-main">
          <div className="sl-kicker">P0 Research Control Plane / Evidence Loop</div>
          <h1 className="sl-dashboard-title">工程智能首页</h1>
          <p className="sl-dashboard-hero-lede">
            当前处于 P0 Strategic Foundation。先建立可审查源码基线和研究证据合同，再进入可信软件工程 Agent 的能力开发。
          </p>
          <DashboardNextActionPanel action={nextAction} />
          <div className="sl-dashboard-status">
            <span className={`sl-live-dot ${activeScans > 0 ? 'sl-live-dot-running' : ''}`} />
            <span>{activeScans > 0 ? '扫描任务运行中' : '主链路待命'}</span>
            <span>{formatNumber(stats?.latestTotalFiles)} files indexed</span>
            <span>{latestCodeChunks == null ? '-' : formatNumber(latestCodeChunks)} chunks ready</span>
            <span>{formatNumber(stats?.latestTotalLines)} lines mapped</span>
          </div>
        </div>

        <div className={`sl-dashboard-north-star sl-dashboard-north-star-${trustedLoopStatus}`}>
          <div className="sl-dashboard-north-star-head">
            <span>North Star</span>
            <span className="sl-dashboard-metrics-source">{metricsSourceLabel}</span>
            <Tag color={trustedLoopStatus === 'ready' ? 'success' : trustedLoopStatus === 'danger' ? 'error' : trustedLoopStatus === 'warning' ? 'warning' : 'default'}>
              {trustedLoopStatusLabel}
            </Tag>
          </div>
          <strong>Not measured</strong>
          <p>Verified Task Success Rate</p>
          <small>P1 基线尚未建立；下方仅展示继承产品链路状态，不构成 VTSR 测量。</small>
          <div className="sl-dashboard-north-star-steps">
            {trustedLoopStages.map(stage => (
              <div className={`sl-dashboard-north-star-step sl-dashboard-north-star-step-${stage.status}`} key={stage.key}>
                <span>{stage.label}</span>
                <strong>{stage.value}</strong>
                <small>{stage.description}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="sl-dashboard-scan-card">
          <div className="sl-dashboard-scan-head">
            <span>Latest scan</span>
            <Tag color={STATUS_COLOR[latestScan?.status || ''] || 'default'}>
              {STATUS_LABEL[latestScan?.status || ''] || latestScan?.status || '暂无'}
            </Tag>
          </div>
          {latestScan ? (
            <>
              <div className="sl-dashboard-scan-repo">{latestScan.repositoryName || '-'}</div>
              <div className="sl-dashboard-scan-project">{latestScan.projectName}</div>
              <div className="sl-dashboard-scan-meta">
                <span>{latestScan.commitSha ? latestScan.commitSha.substring(0, 7) : '-'}</span>
                <span>{formatDuration(latestScan.durationMs)}</span>
                <span>{latestScan.createdAt ? new Date(latestScan.createdAt).toLocaleDateString('zh-CN') : '-'}</span>
              </div>
              <ActionButton
                block
                icon={<ArrowRightOutlined />}
                onClick={() => navigate(`/scan-tasks/${latestScan.id}`)}
                label="打开扫描详情"
              />
            </>
          ) : (
            <StateBlock compact title="暂无扫描记录" description="接入仓库并触发扫描后会显示最新任务。" />
          )}
        </div>
      </div>

      {loadError && (
        <StateBlock
          compact
          tone="error"
          title={stats || scans.length > 0 ? '仪表盘刷新失败，已保留上次成功数据' : '仪表盘数据加载失败'}
          description={loadError}
        />
      )}

      <div className="sl-dashboard-product-metrics" aria-label="SourceLens 北极星指标和产品信号">
        {productMetrics.map(metric => (
          <div className={`sl-dashboard-product-metric sl-dashboard-product-metric-${metric.tone}`} key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </div>
        ))}
      </div>

      <DashboardExecutiveBriefing signals={executiveSignals} />

      <DashboardProductPlaneMap planes={productPlanes} />

      <div className="sl-dashboard-pipeline" aria-label="SourceLens 主链路状态">
        {pipeline.map((item, index) => (
          <div className={`sl-pipeline-stage sl-pipeline-stage-${item.state}`} key={item.key}>
            <div className="sl-pipeline-index">{index + 1}</div>
            <div className="sl-pipeline-icon">{item.icon}</div>
            <div className="sl-pipeline-copy">
              <div className="sl-pipeline-label">{item.label}</div>
              <div className="sl-pipeline-value">{item.value}</div>
              <div className="sl-pipeline-meta">{item.meta}</div>
            </div>
          </div>
        ))}
      </div>

      <DashboardCommandPanel items={commandItems} />

      <div className="sl-section-grid">
        <Card
          className="sl-section-card sl-col-4"
          title={<span className="sl-card-title"><DashboardOutlined /> 运行健康</span>}
          loading={loading}
        >
          <div className="sl-status-cluster">
            <StatusTile label="成功扫描" value={stats?.successScans ?? 0} tone="success" />
            <StatusTile label="失败扫描" value={stats?.failedScans ?? 0} tone="danger" />
            <StatusTile label="活跃扫描" value={activeScans} tone="primary" />
            <StatusTile label="Issue 完成" value={stats?.issueCompleted ?? 0} tone="warning" />
          </div>
        </Card>

        <Card
          className="sl-section-card sl-col-8"
          title={<span className="sl-card-title"><CodeOutlined /> 最新扫描画像</span>}
          loading={loading}
        >
          {stats?.latestTotalFiles != null ? (
            <div className="sl-section-grid">
              <MiniFact icon={<DatabaseOutlined />} label="目录" value={formatNumber(stats.latestTotalDirs)} />
              <MiniFact icon={<ApiOutlined />} label="Controller" value={formatNumber(stats.latestControllers)} />
              <MiniFact icon={<BranchesOutlined />} label="Service" value={formatNumber(stats.latestServices)} />
              <MiniFact
                icon={<WarningOutlined />}
                label="风险项"
                value={formatNumber(stats.latestRiskCount)}
                danger={(stats.latestRiskCount || 0) > 0}
              />
            </div>
          ) : (
            <div className="sl-empty-panel">
              <StateBlock compact title="暂无扫描结果" description="完成首次成功扫描后会生成代码画像。" />
            </div>
          )}
        </Card>

        <Card
          className="sl-section-card sl-col-5"
          title={<span className="sl-card-title"><DatabaseOutlined /> 语言分布</span>}
          loading={loading}
        >
          {languages.length > 0 ? (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {languages.slice(0, 8).map(lang => {
                const percent = totalLangLines > 0 ? Math.round((lang.line_count / totalLangLines) * 100) : 0
                return (
                  <div key={lang.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                      <Text strong>{lang.name}</Text>
                      <Text type="secondary">{lang.file_count} 文件 / {lang.line_count.toLocaleString()} 行</Text>
                    </div>
                    <Progress
                      percent={percent}
                      showInfo={false}
                      strokeColor={LANG_COLORS[lang.name] || '#64748b'}
                      trailColor="#eef2f7"
                      size="small"
                    />
                  </div>
                )
              })}
            </Space>
          ) : (
            <div className="sl-empty-panel">
              <StateBlock compact title="暂无语言数据" description="扫描完成后会统计仓库语言和代码行分布。" />
            </div>
          )}
        </Card>

        <Card
          className="sl-section-card sl-col-7"
          title={<span className="sl-card-title"><FieldTimeOutlined /> 最近扫描</span>}
          loading={loading}
        >
          <Table
            className="sl-dashboard-recent-table"
            dataSource={scans}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: <StateBlock compact title="暂无扫描记录" description="最近扫描会在任务创建后出现在这里。" /> }}
            size="small"
            scroll={{ x: 760 }}
            columns={[
              {
                title: '仓库',
                key: 'repo',
                render: (_: unknown, record: RecentScan) => (
                  <div>
                    <div style={{ fontWeight: 720 }}>{record.repositoryName || '-'}</div>
                    <Text type="secondary">{record.projectName}</Text>
                  </div>
                ),
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 100,
                render: (status: string) => (
                  <Tag
                    icon={status === 'RUNNING' ? <ReloadOutlined spin /> : undefined}
                    color={STATUS_COLOR[status] || 'default'}
                  >
                    {STATUS_LABEL[status] || status}
                  </Tag>
                ),
              },
              {
                title: 'Commit',
                dataIndex: 'commitSha',
                key: 'commitSha',
                width: 96,
                render: (sha: string | null) => sha ? <Text code>{sha.substring(0, 7)}</Text> : '-',
              },
              {
                title: '耗时',
                dataIndex: 'durationMs',
                key: 'durationMs',
                width: 90,
                render: formatDuration,
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                key: 'createdAt',
                width: 160,
                render: (value: string) => value ? new Date(value).toLocaleString('zh-CN') : '-',
              },
            ]}
          />
        </Card>
      </div>
    </div>
  )
}

function DashboardExecutiveBriefing({
  signals,
}: {
  signals: DashboardExecutiveSignal[]
}) {
  return (
    <section className="sl-dashboard-executive" role="region" aria-label="管理层决策简报">
      <div className="sl-dashboard-executive-head">
        <div>
          <span>Executive briefing</span>
          <h2>管理层决策简报</h2>
        </div>
        <p>
          汇总当前 P0 阶段、继承链路状态、风险阻塞和唯一项目任务。该简报不证明 P0 Gate 已通过、VTSR 已测量、可信 Agent 闭环已实现或系统达到生产可用。
        </p>
        <Tag color="warning">P0 Gate: NOT_READY</Tag>
      </div>
      <div className="sl-dashboard-executive-grid">
        {signals.map(signal => (
          <article
            className={`sl-dashboard-executive-card sl-dashboard-executive-card-${signal.tone}`}
            data-sl-dashboard-executive-signal={signal.key}
            key={signal.key}
          >
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
            <p>{signal.detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function DashboardProductPlaneMap({ planes }: { planes: DashboardProductPlane[] }) {
  return (
    <section className="sl-dashboard-product-plane" role="region" aria-label="继承产品三平面（P0冻结）">
      <div className="sl-dashboard-product-plane-head">
        <div>
          <span>Inherited product surfaces</span>
          <h2>继承产品界面（P0冻结）</h2>
        </div>
        <p>这些入口只用于访问和核对继承能力，不定义 AIOS 当前产品路线、开发任务或阶段投入。</p>
      </div>
      <div className="sl-dashboard-product-plane-grid">
        {planes.map(plane => (
          <article
            className={`sl-dashboard-product-plane-card sl-dashboard-product-plane-card-${plane.status}`}
            data-sl-dashboard-plane={plane.key}
            key={plane.key}
          >
            <div className="sl-dashboard-product-plane-card-head">
              <div>
                <span>{plane.subtitle}</span>
                <strong>{plane.label}</strong>
              </div>
              <Tag color={plane.status === 'ready' ? 'success' : plane.status === 'danger' ? 'error' : plane.status === 'warning' ? 'warning' : 'default'}>
                {plane.value}
              </Tag>
            </div>
            <p>{plane.description}</p>
            <div className="sl-dashboard-product-plane-pages" aria-label={`${plane.label}页面入口`}>
              {plane.pages.map(page => <span key={page}>{page}</span>)}
            </div>
            <ActionButton
              size="small"
              icon={<ArrowRightOutlined />}
              onClick={plane.onAction}
              label={plane.actionLabel}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

function DashboardNextActionPanel({ action }: { action: DashboardNextAction }) {
  return (
    <section className={`sl-dashboard-next-action sl-dashboard-next-action-hero sl-dashboard-next-action-${action.tone}`} aria-label="继承产品运行建议（非项目任务）">
      <div className="sl-dashboard-next-main">
        <div className="sl-dashboard-next-icon">{action.icon}</div>
        <div className="sl-dashboard-next-copy">
          <span className="sl-dashboard-next-label">{action.label}</span>
          <strong className="sl-dashboard-next-title">{action.title}</strong>
          <p>{action.description}</p>
          <small>仅用于操作继承系统，不生成 AIOS 开发任务，也不改变 P0-05 的唯一优先级。</small>
        </div>
        <div className="sl-dashboard-next-actions">
          <ActionButton type="primary" icon={<ArrowRightOutlined />} onClick={action.onPrimary} label={action.primaryLabel} />
          {action.secondaryLabel && action.onSecondary && (
            <ActionButton icon={<FileSearchOutlined />} onClick={action.onSecondary} label={action.secondaryLabel} />
          )}
        </div>
      </div>
      <div className="sl-dashboard-next-evidence" aria-label="主链路证据成熟度">
        {action.evidence.map(item => (
          <div className={`sl-dashboard-next-evidence-item sl-dashboard-next-evidence-${item.tone}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      {action.blockers.length > 0 && (
        <div className="sl-dashboard-next-blockers" aria-label="当前阻塞项">
          {action.blockers.map(blocker => (
            <span key={blocker}>{blocker}</span>
          ))}
        </div>
      )}
    </section>
  )
}

function DashboardCommandPanel({ items }: { items: DashboardCommandItem[] }) {
  return (
    <section className="sl-dashboard-command-panel" aria-label="继承产品操作面板（非项目任务）">
      <div className="sl-dashboard-command-head">
        <div>
          <span>Inherited runtime operations</span>
          <strong>继承产品操作（P0冻结）</strong>
        </div>
        <p>这些入口只用于操作继承系统，不生成 AIOS 开发任务，不进入项目排期，也不改变 P0-05 的唯一优先级。</p>
      </div>
      <div className="sl-dashboard-command-grid">
        {items.map(item => (
          <div className={`sl-dashboard-command-card sl-dashboard-command-card-${item.tone}`} key={item.key}>
            <div className="sl-dashboard-command-card-head">
              <div className="sl-dashboard-command-icon">{item.icon}</div>
              <div>
                <span className="sl-dashboard-command-label">{item.label}</span>
                <strong className="sl-dashboard-command-value">{item.value}</strong>
              </div>
            </div>
            <p>{item.detail}</p>
            {item.disabled && item.disabledReason && (
              <div className="sl-dashboard-command-disabled-reason" role="note">
                {item.disabledReason}
              </div>
            )}
            <ActionButton
              size="small"
              disabled={item.disabled}
              onClick={item.onClick}
              icon={<ArrowRightOutlined />}
              label={item.actionLabel}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function StatusTile({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'success' | 'warning' | 'danger' }) {
  const colors = {
    primary: '#2563eb',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
  }
  return (
    <div className="sl-status-tile">
      <div className="sl-status-tile-label">{label}</div>
      <div className="sl-status-tile-value" style={{ color: colors[tone] }}>{value}</div>
    </div>
  )
}

function MiniFact({ icon, label, value, danger = false }: { icon: React.ReactNode; label: string; value: string; danger?: boolean }) {
  return (
    <div className="sl-status-tile sl-col-3">
      <Space size={8}>
        {icon}
        <Text type="secondary">{label}</Text>
      </Space>
      <div className="sl-status-tile-value" style={{ color: danger ? '#dc2626' : '#162033' }}>{value}</div>
    </div>
  )
}
