import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, message, Modal, Popconfirm, Progress, Select, Space, Table, Tag, Typography } from 'antd'
import {
  BranchesOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReloadOutlined,
  RobotOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { projectApi, Project } from '../api/project'
import { formatApiError, showApiError } from '../api/client'
import ActionButton from '../components/ui/ActionButton'
import IconActionButton from '../components/ui/IconActionButton'
import StateBlock from '../components/ui/StateBlock'

const { Text } = Typography

interface ProjectPortfolioLoopStep {
  index: string
  title: string
  owner: string
  value: string
  description: string
  tone: 'ready' | 'attention' | 'idle'
  icon: React.ReactNode
  actionLabel: string
  disabled?: boolean
  onAction: () => void
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [projectListError, setProjectListError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [languageFilter, setLanguageFilter] = useState('ALL')
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    setProjectListError(null)
    projectApi.list(1, 100)
      .then((res) => {
        setProjects(res.data.data.items || [])
        setProjectListError(null)
      })
      .catch(error => {
        setProjectListError(formatApiError(error, '加载项目列表失败'))
        showApiError(error, '加载项目列表失败')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => projects.filter(project => {
    const q = keyword.trim().toLowerCase()
    const matchedStatus = statusFilter === 'ALL' || project.status === statusFilter
    const matchedLanguage = languageFilter === 'ALL' || projectLanguage(project) === languageFilter
    if (!matchedStatus || !matchedLanguage) return false
    if (!q) return true
    return [
      project.name,
      project.description || '',
      projectLanguage(project),
      project.framework || '',
      project.status || '',
      String(project.id),
    ].some(value => value.toLowerCase().includes(q))
  }), [projects, keyword, statusFilter, languageFilter])

  const initialLoading = loading && projects.length === 0 && !projectListError
  const fatalLoadError = Boolean(projectListError && projects.length === 0)
  const staleRefreshError = Boolean(projectListError && projects.length > 0)
  const confirmedEmpty = !loading && !projectListError && projects.length === 0
  const filteredEmpty = !loading && !projectListError && projects.length > 0 && filtered.length === 0
  const portfolioCountLabel = initialLoading
    ? '正在加载项目'
    : fatalLoadError
      ? '项目数据不可用'
      : `${filtered.length} / ${projects.length} 个项目`

  const statusOptions = useMemo(() => [
    { value: 'ALL', label: '全部状态' },
    ...Array.from(new Set(projects.map(project => project.status).filter(Boolean))).sort().map(status => ({
      value: status,
      label: statusLabel(status),
    })),
  ], [projects])

  const languageStats = useMemo(() => Array.from(projects.reduce((map, project) => {
    const language = projectLanguage(project)
    const stat = map.get(language) || { language, count: 0 }
    stat.count += 1
    map.set(language, stat)
    return map
  }, new Map<string, { language: string; count: number }>()).values())
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language)), [projects])

  const summary = useMemo(() => {
    const healthyScores = projects
      .map(project => project.healthScore)
      .filter((score): score is number => typeof score === 'number')
    const averageHealth = healthyScores.length
      ? Math.round(healthyScores.reduce((sum, score) => sum + score, 0) / healthyScores.length)
      : null
    const activeCount = projects.filter(project => normalizeStatus(project.status) !== 'ARCHIVED').length
    return {
      activeCount,
      averageHealth,
      languageCount: languageStats.length,
    }
  }, [projects, languageStats.length])

  const openCreateModal = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (project: Project) => {
    setEditing(project)
    form.setFieldsValue(project)
    setModalOpen(true)
  }

  const clearFilters = () => {
    setKeyword('')
    setStatusFilter('ALL')
    setLanguageFilter('ALL')
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        await projectApi.update(editing.id, values)
        message.success('项目已更新')
      } else {
        await projectApi.create(values)
        message.success('项目已创建')
      }
      setModalOpen(false)
      form.resetFields()
      setEditing(null)
      load()
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      showApiError(error, editing ? '更新项目失败' : '创建项目失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await projectApi.delete(id)
      message.success('项目已删除')
      load()
    } catch (error) {
      showApiError(error, '删除项目失败')
    }
  }

  const leadProject = filtered[0] || null
  const leadProjectValue = leadProject
    ? `目标：${leadProject.name}`
    : projects.length > 0
      ? '无匹配项目'
      : '等待项目'
  const portfolioLoopSteps = useMemo<ProjectPortfolioLoopStep[]>(() => [
    {
      index: 'P1',
      title: '创建项目壳',
      owner: 'Developer Workbench',
      value: projects.length > 0 ? `${projects.length} 个项目` : '待创建',
      description: '先把一个公开仓库分析目标收敛成可追踪项目，后续仓库、扫描、报告和 Agent 证据都挂到同一责任链。',
      tone: projects.length > 0 ? 'ready' : 'attention',
      icon: <ProjectOutlined />,
      actionLabel: '新建项目',
      onAction: openCreateModal,
    },
    {
      index: 'P2',
      title: '接入公开仓库',
      owner: 'Repository Intake',
      value: leadProjectValue,
      description: '进入项目工作台后接入 GitHub 公开仓库，保留 clone、分支、commit 和扫描触发来源。',
      tone: leadProject ? 'ready' : 'idle',
      icon: <BranchesOutlined />,
      actionLabel: '打开仓库页',
      disabled: !leadProject,
      onAction: () => leadProject && navigate(`/projects/${leadProject.id}?tab=repos`),
    },
    {
      index: 'P3',
      title: '生成扫描报告',
      owner: 'Analysis Pipeline',
      value: leadProject ? `目标：${leadProject.name}` : projects.length > 0 ? '无匹配项目' : '待扫描',
      description: '触发源码逆向分析，生成 code_chunks、架构报告、风险证据和可审计产物。',
      tone: summary.averageHealth === null ? 'attention' : 'ready',
      icon: <FileTextOutlined />,
      actionLabel: '查看扫描',
      disabled: !leadProject,
      onAction: () => leadProject && navigate(`/projects/${leadProject.id}?tab=scans`),
    },
    {
      index: 'P4',
      title: '代码问答与修复',
      owner: 'Agent Workspace',
      value: leadProjectValue,
      description: '基于最新扫描证据进入 QA、Issue 拆解和 AutoRepair，避免脱离项目上下文的泛化回答。',
      tone: leadProject ? 'ready' : 'idle',
      icon: <RobotOutlined />,
      actionLabel: '打开代码问答',
      disabled: !leadProject,
      onAction: () => leadProject && navigate(`/projects/${leadProject.id}?tab=qa`),
    },
  ], [leadProject, leadProjectValue, navigate, projects.length, summary.averageHealth])

  return (
    <div>
      <div className="sl-projects-hero">
        <div>
          <div className="sl-kicker">Project Portfolio</div>
          <h1 className="sl-page-title">项目与仓库入口</h1>
          <div className="sl-workspace-tags">
            <Tag color="blue">公开仓库优先</Tag>
            <Tag color="cyan">克隆 / 扫描 / 逆向分析</Tag>
            <Tag>{portfolioCountLabel}</Tag>
          </div>
        </div>
        {!initialLoading && !fatalLoadError && (
          <div className="sl-projects-toolbar" aria-label="项目组合首屏动作">
            {projects.length > 0 && (
              <>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="搜索项目、语言、框架或状态"
                  value={keyword}
                  onChange={event => setKeyword(event.target.value)}
                />
                <Select value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
              </>
            )}
            {filteredEmpty && (
              <ActionButton
                aria-label="清除项目筛选"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={clearFilters}
                label="清除筛选"
              />
            )}
            {projects.length > 0 && !staleRefreshError && (
              <ActionButton aria-label="刷新项目列表" icon={<ReloadOutlined />} onClick={load} label="刷新" />
            )}
            <ActionButton
              aria-label="新建项目"
              type={!filteredEmpty && !staleRefreshError ? 'primary' : 'default'}
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              label="新建项目"
            />
          </div>
        )}
      </div>

      {initialLoading ? (
        <StateBlock
          tone="loading"
          title="正在加载项目组合"
          description="正在确认项目、仓库和扫描入口，请稍候。"
        />
      ) : fatalLoadError ? (
        <StateBlock
          tone="error"
          title="项目列表加载失败"
          description={projectListError}
          action={(
            <ActionButton
              type="primary"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={load}
              label="重新加载项目"
            />
          )}
        />
      ) : confirmedEmpty ? (
        <StateBlock
          title="还没有项目"
          description="新建项目后接入公开仓库，扫描、报告、代码问答和受控修复才会形成同一条证据链。"
        />
      ) : (
        <>
          {staleRefreshError && (
            <StateBlock
              compact
              tone="error"
              title="项目刷新失败，已保留上次成功数据"
              description={projectListError}
              action={(
                <ActionButton
                  type="primary"
                  icon={<ReloadOutlined />}
                  loading={loading}
                  onClick={load}
                  label="重新加载项目"
                />
              )}
            />
          )}

          <div className="sl-project-summary-grid">
            <ProjectStat icon={<ProjectOutlined />} label="项目总数" value={projects.length} footnote={`${filtered.length} 个当前可见`} />
            <ProjectStat icon={<CheckCircleOutlined />} label="活跃项目" value={summary.activeCount} footnote="非归档项目组合" />
            <ProjectStat icon={<CodeOutlined />} label="技术覆盖" value={summary.languageCount} footnote="主要语言类型" />
            <ProjectStat
              icon={<CheckCircleOutlined />}
              label="平均健康度"
              value={summary.averageHealth === null ? '-' : `${summary.averageHealth}%`}
              footnote="来自项目 healthScore"
            />
          </div>

          <ProjectPortfolioLoop steps={portfolioLoopSteps} />

          {languageStats.length > 0 && (
            <div className="sl-project-language-strip">
              {languageStats.slice(0, 8).map(stat => (
                <button
                  aria-pressed={languageFilter === stat.language}
                  className={`sl-project-language-chip ${languageFilter === stat.language ? 'sl-project-language-chip-active' : ''}`}
                  key={stat.language}
                  type="button"
                  onClick={() => setLanguageFilter(languageFilter === stat.language ? 'ALL' : stat.language)}
                >
                  <span>{stat.language}</span>
                  <strong>{stat.count}</strong>
                </button>
              ))}
            </div>
          )}

          <Card className="sl-section-card sl-project-table-card">
            <Table
              className="sl-project-list-table"
              dataSource={filtered}
              rowKey="id"
              loading={loading}
              locale={{
                emptyText: (
                  <StateBlock
                    compact
                    title="没有匹配的项目"
                    description="当前筛选条件没有匹配结果，请清除筛选后继续。"
                  />
                ),
              }}
              pagination={{ pageSize: 12, showTotal: total => `共 ${total} 个项目` }}
              scroll={{ x: 900 }}
              columns={[
            {
              title: '项目',
              dataIndex: 'name',
              key: 'name',
              width: 260,
              render: (value: string, record: Project) => (
                <Space direction="vertical" size={4}>
                  <Space wrap size="small">
                    <ActionButton type="link" className="sl-inline-link" onClick={() => navigate(`/projects/${record.id}`)} label={value} />
                    <Tag>#{record.id}</Tag>
                  </Space>
                  <Text type="secondary" className="sl-table-subtext">
                    {record.description || '暂无项目描述'}
                  </Text>
                </Space>
              ),
            },
            {
              title: '技术栈',
              key: 'tech',
              width: 180,
              render: (_: unknown, record: Project) => (
                <Space wrap size={[4, 4]}>
                  <Tag color="blue">{projectLanguage(record)}</Tag>
                  {record.framework && <Tag color="cyan">{record.framework}</Tag>}
                </Space>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              width: 130,
              render: (value: string) => <Tag color={statusColor(value)}>{statusLabel(value)}</Tag>,
            },
            {
              title: '健康度',
              dataIndex: 'healthScore',
              key: 'healthScore',
              width: 140,
              render: (value: number | null) => value === null || value === undefined
                ? <Text type="secondary">待扫描</Text>
                : <Progress percent={Math.round(value)} size="small" strokeColor={healthColor(value)} />,
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 160,
              render: (value: string) => value ? new Date(value).toLocaleString() : '-',
            },
            {
              title: '操作',
              key: 'action',
              width: 150,
              render: (_: unknown, record: Project) => (
                <Space size="small">
                  <IconActionButton
                    label={`查看 ${record.name} 工作台`}
                    tooltip="查看工作台"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/projects/${record.id}`)}
                  />
                  <IconActionButton
                    label={`编辑 ${record.name}`}
                    tooltip="编辑项目"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(record)}
                  />
                  <Popconfirm title="确认删除该项目？" onConfirm={() => handleDelete(record.id)}>
                    <IconActionButton label={`删除 ${record.name}`} tooltip="删除项目" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
            ]}
            />
          </Card>
        </>
      )}

      <Modal
        title={editing ? '编辑项目' : '新建项目'}
        open={modalOpen}
        okText={editing ? '保存' : '创建'}
        cancelText="取消"
        okButtonProps={{ 'aria-label': editing ? '保存项目' : '创建项目' }}
        cancelButtonProps={{ 'aria-label': '取消项目编辑' }}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields() }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="例如 SourceLens public repo smoke" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="描述该项目接入的仓库范围、分析目标或维护阶段" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function ProjectPortfolioLoop({ steps }: { steps: ProjectPortfolioLoopStep[] }) {
  return (
    <section className="sl-project-portfolio-loop" aria-label="项目组合可信接入闭环">
      <div className="sl-project-portfolio-loop-head">
        <div>
          <div className="sl-kicker">Portfolio Intake Loop</div>
          <h2>项目组合可信接入闭环</h2>
          <p>把项目创建、仓库接入、扫描报告、Agent 问答和修复候选收敛成一条可执行主链路。</p>
        </div>
        <Tag color="geekblue">Developer Workbench</Tag>
      </div>
      <div className="sl-project-portfolio-loop-grid">
        {steps.map(step => (
          <article className={`sl-project-portfolio-step sl-project-portfolio-step-${step.tone}`} key={step.index}>
            <div className="sl-project-portfolio-step-index">{step.index}</div>
            <div className="sl-project-portfolio-step-icon" aria-hidden>{step.icon}</div>
            <div className="sl-project-portfolio-step-copy">
              <span>{step.owner}</span>
              <strong>{step.title}</strong>
              <em>{step.value}</em>
              <p>{step.description}</p>
            </div>
            <ActionButton
              block
              type={step.tone === 'attention' ? 'primary' : 'default'}
              disabled={step.disabled}
              onClick={step.onAction}
              label={step.actionLabel}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

function ProjectStat({
  icon,
  label,
  value,
  footnote,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  footnote: string
}) {
  return (
    <div className="sl-project-stat">
      <div className="sl-project-stat-head">
        <span>{label}</span>
        {icon}
      </div>
      <div className="sl-project-stat-value">{value}</div>
      <div className="sl-project-stat-footnote">{footnote}</div>
    </div>
  )
}

function normalizeStatus(status: string) {
  return (status || '').toUpperCase()
}

function projectLanguage(project: Project) {
  return project.primaryLanguage || 'Unknown'
}

function statusLabel(status: string) {
  const normalized = normalizeStatus(status)
  const labels: Record<string, string> = {
    ACTIVE: '活跃',
    ARCHIVED: '已归档',
    DELETED: '已删除',
    DISABLED: '已停用',
  }
  return labels[normalized] || status || 'Unknown'
}

function statusColor(status: string) {
  const normalized = normalizeStatus(status)
  if (normalized === 'ACTIVE') return 'success'
  if (normalized === 'ARCHIVED') return 'default'
  if (normalized === 'DELETED' || normalized === 'DISABLED') return 'error'
  return 'blue'
}

function healthColor(value: number) {
  if (value >= 80) return '#16a34a'
  if (value >= 60) return '#2563eb'
  if (value >= 40) return '#d97706'
  return '#dc2626'
}
