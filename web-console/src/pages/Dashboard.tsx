import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Empty, Progress, Space, Table, Tag, Typography } from 'antd'
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
  primary?: boolean
  disabled?: boolean
  onClick: () => void
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
      ? `/projects/${latestSuccessfulScan.projectId}?${new URLSearchParams({ tab: 'qa', question: qaQuestion }).toString()}`
      : latestSuccessfulScan
        ? `/scan-tasks/${latestSuccessfulScan.id}`
        : '/projects'
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
        primary: !repositoryReady,
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
        primary: Boolean(latestSuccessfulScan),
        onClick: () => navigate(scanTarget),
      },
      {
        key: 'qa',
        icon: <RobotOutlined />,
        label: '代码问答',
        value: codeKnowledgeReady ? `${formatNumber(latestCodeChunks)} chunks` : latestAnalysisReady ? '待切片' : '等待扫描',
        detail: codeKnowledgeReady
          ? '进入项目 QA 工作台，基于 code_chunks 检索和报告证据理解代码。'
          : latestAnalysisReady
            ? '最新扫描已有报告，但 code_chunks 未就绪，先打开扫描详情复核切片状态。'
          : '完成扫描和切片后，代码问答会获得可追踪证据上下文。',
        tone: codeKnowledgeReady ? 'ready' : latestAnalysisReady ? 'warning' : 'idle',
        actionLabel: codeKnowledgeReady ? '进入 QA' : latestAnalysisReady ? '检查切片' : '先去项目',
        disabled: !repositoryReady,
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

  return (
    <div>
      <div className="sl-dashboard-hero">
        <div className="sl-dashboard-hero-main">
          <div className="sl-kicker">SourceLens Control Plane</div>
          <h1 className="sl-dashboard-title">源码逆向分析控制台</h1>
          <div className="sl-dashboard-status">
            <span className={`sl-live-dot ${activeScans > 0 ? 'sl-live-dot-running' : ''}`} />
            <span>{activeScans > 0 ? '扫描任务运行中' : '主链路待命'}</span>
            <span>{formatNumber(stats?.latestTotalFiles)} files indexed</span>
            <span>{latestCodeChunks == null ? '-' : formatNumber(latestCodeChunks)} chunks ready</span>
            <span>{formatNumber(stats?.latestTotalLines)} lines mapped</span>
          </div>
          <div className="sl-dashboard-actions">
            <Button type="primary" icon={<ProjectOutlined />} onClick={() => navigate('/projects')}>
              接入仓库
            </Button>
            <Button icon={<DashboardOutlined />} onClick={() => navigate('/execution-tasks')}>
              执行任务
            </Button>
            <Button icon={<DatabaseOutlined />} onClick={() => navigate('/artifacts')}>
              查看产物
            </Button>
            <Button icon={<ReloadOutlined spin={refreshing} />} onClick={() => loadDashboard(true)}>
              刷新
            </Button>
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
              <Button
                block
                icon={<ArrowRightOutlined />}
                onClick={() => navigate(`/scan-tasks/${latestScan.id}`)}
              >
                打开扫描详情
              </Button>
            </>
          ) : (
            <div className="sl-dashboard-scan-empty">暂无扫描记录</div>
          )}
        </div>
      </div>

      {loadError && (
        <Alert
          type="error"
          showIcon
          className="sl-dashboard-alert"
          message="仪表盘数据加载失败"
          description={loadError}
          action={<Button size="small" onClick={() => loadDashboard(true)}>重试</Button>}
        />
      )}

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
              <Empty description="暂无扫描结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
              <Empty description="暂无语言数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </Card>

        <Card
          className="sl-section-card sl-col-7"
          title={<span className="sl-card-title"><FieldTimeOutlined /> 最近扫描</span>}
          loading={loading}
        >
          <Table
            dataSource={scans}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: '暂无扫描记录' }}
            size="small"
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

function DashboardCommandPanel({ items }: { items: DashboardCommandItem[] }) {
  return (
    <section className="sl-dashboard-command-panel" aria-label="主链路行动面板">
      <div className="sl-dashboard-command-head">
        <div>
          <span>Workflow Command</span>
          <strong>下一步行动</strong>
        </div>
        <p>从仓库接入、报告复盘、代码问答、自动修复到审计治理，按当前数据状态选择下一步。</p>
      </div>
      <div className="sl-dashboard-command-grid">
        {items.map(item => (
          <div className={`sl-dashboard-command-card sl-dashboard-command-card-${item.tone}`} key={item.key}>
            <div className="sl-dashboard-command-card-head">
              <div className="sl-dashboard-command-icon">{item.icon}</div>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
            <p>{item.detail}</p>
            <Button
              type={item.primary ? 'primary' : 'default'}
              size="small"
              disabled={item.disabled}
              onClick={item.onClick}
              icon={<ArrowRightOutlined />}
            >
              {item.actionLabel}
            </Button>
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
