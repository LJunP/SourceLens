import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Alert,
  Badge,
  Card,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { BadgeProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ApiOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  DatabaseOutlined,
  ExportOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FlagOutlined,
  HourglassOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { issueApi, IssueDecomposition, IssueTask } from '../api/issueDecomposition'
import { showApiError } from '../api/client'
import ActionButton from '../components/ui/ActionButton'
import IconActionButton from '../components/ui/IconActionButton'
import StateBlock from '../components/ui/StateBlock'
import { createSelectableTableRowProps } from '../components/ui/selectableTableRow'
import { redactJsonOrText, redactSensitiveText } from '../utils/displayRedaction'

const { Text, Paragraph } = Typography
const { TextArea } = Input

type SignalTone = 'ready' | 'warning' | 'danger'

type IssueGovernanceStep = {
  key: string
  stage: string
  title: string
  summary: string
  evidence: string
  tone: SignalTone
  icon: ReactNode
}

const STATUS_CONFIG: Record<string, { label: string; badge: BadgeProps['status']; icon: ReactNode }> = {
  PENDING: { label: '等待处理', badge: 'default', icon: <ClockCircleOutlined /> },
  PROCESSING: { label: '拆解中', badge: 'processing', icon: <SyncOutlined spin /> },
  COMPLETED: { label: '已完成', badge: 'success', icon: <CheckCircleOutlined /> },
  FAILED: { label: '失败', badge: 'error', icon: <CloseCircleOutlined /> },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; tone: SignalTone }> = {
  HIGH: { label: '高优先级', color: 'red', tone: 'danger' },
  MEDIUM: { label: '中优先级', color: 'orange', tone: 'warning' },
  LOW: { label: '低优先级', color: 'blue', tone: 'ready' },
}

const TASK_STATUS_OPTIONS = [
  { label: '待处理', value: 'TODO' },
  { label: '进行中', value: 'IN_PROGRESS' },
  { label: '已完成', value: 'DONE' },
  { label: '已跳过', value: 'SKIPPED' },
]

const RISK_COLORS: Record<string, string> = {
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'blue',
}

interface Props {
  projectId: number
}

function parseJsonList(value: string | null | undefined, splitLoose = false): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item).trim()).filter(Boolean)
    }
    if (typeof parsed === 'string') return [parsed.trim()].filter(Boolean)
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed).map(item => String(item).trim()).filter(Boolean)
    }
  } catch {
    const normalized = value.trim()
    if (!normalized) return []
    if (!splitLoose) return normalized.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
    return normalized.split(/[\n,，;；]/).map(item => item.trim()).filter(Boolean)
  }
  return []
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function formatJsonPreview(value: string | null | undefined) {
  return redactJsonOrText(value, '无数据')
}

function redactIssuePlanningText(value: string) {
  return redactSensitiveText(value)
}

function sanitizeIssueMarkdownExport(value: string | null | undefined) {
  return redactIssuePlanningText(value || '')
}

function getPriorityConfig(priority: string | null | undefined) {
  return PRIORITY_CONFIG[priority || ''] || { label: priority || '未设置', color: 'default', tone: 'warning' as SignalTone }
}

function getStatusConfig(status: string | null | undefined) {
  return STATUS_CONFIG[status || ''] || { label: status || '未知状态', badge: 'default' as BadgeProps['status'], icon: null }
}

function buildPlanningSignal(
  selected: IssueDecomposition | null,
  taskCount: number,
  acceptanceCount: number,
  riskCount: number,
  dependencyCount: number,
) {
  if (!selected) {
    return {
      tone: 'warning' as SignalTone,
      title: '等待选择拆解记录',
      summary: '从左侧选择一个 Issue，查看它的任务边界、验收标准和执行计划。',
      action: '先选择最近一次已完成拆解，再进入任务状态推进。',
    }
  }
  if (selected.status === 'FAILED') {
    return {
      tone: 'danger' as SignalTone,
      title: '拆解失败，需要重新提交',
      summary: selected.errorMessage || '后端未返回可用拆解结果。',
      action: '补充更清晰的需求描述或业务背景后重新创建拆解。',
    }
  }
  if (selected.status !== 'COMPLETED') {
    return {
      tone: 'warning' as SignalTone,
      title: '拆解仍在生成',
      summary: '任务、风险和验收标准尚未稳定，不建议直接进入代码实现。',
      action: '等待拆解完成后再分配开发任务。',
    }
  }
  if (!taskCount || !acceptanceCount) {
    return {
      tone: 'warning' as SignalTone,
      title: '交付计划不完整',
      summary: '已生成拆解结果，但缺少子任务或验收标准，交付边界仍然偏弱。',
      action: '补齐验收标准与任务粒度，再进入实现阶段。',
    }
  }
  if (riskCount > 2 || dependencyCount > 2) {
    return {
      tone: 'warning' as SignalTone,
      title: '计划可执行，但存在协调成本',
      summary: '当前拆解已经具备执行条件，不过风险或依赖较多，需要先压实边界。',
      action: '优先处理高风险任务，并在提交前逐条验证依赖。',
    }
  }
  return {
    tone: 'ready' as SignalTone,
    title: '计划已具备执行条件',
    summary: '需求理解、验收标准和任务列表已经形成闭环，可以进入开发推进。',
    action: '按任务顺序推进，完成后回到这里更新交付状态。',
  }
}

function buildIssueGovernanceSteps(
  selected: IssueDecomposition | null,
  taskCount: number,
  acceptanceCount: number,
  riskCount: number,
  dependencyCount: number,
  impactCount: number,
  relatedModuleCount: number,
): IssueGovernanceStep[] {
  const completed = selected?.status === 'COMPLETED'
  const failed = selected?.status === 'FAILED'
  const hasInputContext = !!selected && !!selected.description && (!!selected.businessContext || relatedModuleCount > 0)
  const hasExecutableBreakdown = completed && taskCount > 0 && impactCount > 0
  const hasAcceptanceGate = completed && acceptanceCount > 0
  const hasExecutionHandoff = completed && taskCount > 0 && (!!selected?.suggestedBranch || !!selected?.suggestedCommit)

  return [
    {
      key: 'input',
      stage: 'R1',
      title: hasInputContext ? '需求输入可复述' : selected ? '需求上下文仍需补充' : '等待选择需求',
      summary: selected
        ? hasInputContext
          ? '标题、描述、业务背景或关联模块已经形成可复述输入，后续拆解可以追溯到明确需求来源。'
          : '当前记录缺少业务背景或关联模块，拆解前仍需补充目标用户、范围和输入输出。'
        : '请选择一条 Issue 拆解记录，确认需求描述、业务背景和关联模块是否足以进入拆解。',
      evidence: selected ? `Issue #${selected.id} · ${getPriorityConfig(selected.priority).label} · 关联模块 ${relatedModuleCount}` : '未选择记录',
      tone: hasInputContext ? 'ready' : 'warning',
      icon: <FileTextOutlined />,
    },
    {
      key: 'breakdown',
      stage: 'R2',
      title: failed ? '拆解失败阻断' : hasExecutableBreakdown ? '任务拆解可执行' : '拆解产物不足',
      summary: failed
        ? '后端未生成可执行拆解，不能把失败结果交给开发或测试。'
        : hasExecutableBreakdown
          ? '影响模块、API、数据库或子任务已经沉淀，开发可以按任务粒度推进。'
          : '拆解尚未完成，或缺少子任务/影响范围，不能直接进入编码。',
      evidence: `子任务 ${taskCount} · 影响项 ${impactCount}`,
      tone: failed ? 'danger' : hasExecutableBreakdown ? 'ready' : 'warning',
      icon: <BranchesOutlined />,
    },
    {
      key: 'acceptance',
      stage: 'R3',
      title: hasAcceptanceGate ? '验收门禁已建立' : '验收门禁不足',
      summary: hasAcceptanceGate
        ? '验收标准、风险和依赖会作为实现后的检查清单；高风险项仍需优先验证。'
        : '缺少验收标准时，任务完成无法被稳定证明，不能把拆解当作交付完成。',
      evidence: `验收 ${acceptanceCount} · 风险 ${riskCount} · 依赖 ${dependencyCount}`,
      tone: hasAcceptanceGate ? (riskCount > 2 || dependencyCount > 2 ? 'warning' : 'ready') : 'warning',
      icon: <CheckCircleOutlined />,
    },
    {
      key: 'handoff',
      stage: 'R4',
      title: hasExecutionHandoff ? '执行交接可追踪' : '执行交接未闭合',
      summary: hasExecutionHandoff
        ? '建议分支、Commit 粒度和子任务可作为开发入口；拆解完成不等于实现完成，仍需测试、CI、PR 审查和审计复盘。'
        : '还缺少可追踪的分支、Commit 粒度或任务列表，不能把计划直接解释为已开发完成。',
      evidence: selected ? `分支 ${selected.suggestedBranch || '未设置'} · Commit ${selected.suggestedCommit ? '已建议' : '未建议'}` : '未选择记录',
      tone: hasExecutionHandoff ? 'ready' : failed ? 'danger' : 'warning',
      icon: <FlagOutlined />,
    },
  ]
}

export default function IssueDecompositionView({ projectId }: Props) {
  const [items, setItems] = useState<IssueDecomposition[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<IssueDecomposition | null>(null)
  const [tasks, setTasks] = useState<IssueTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const selectedTaskRequestRef = useRef(0)
  const [form] = Form.useForm()

  const fetchItems = useCallback(() => {
    setLoading(true)
    issueApi.listByProject(projectId, page, 20, statusFilter)
      .then(res => {
        const nextItems = res.data.data.items || []
        setItems(nextItems)
        setTotal(res.data.data.total)
        setSelected(current => {
          if (!current) return current
          return nextItems.find(item => item.id === current.id) || current
        })
      })
      .catch(error => showApiError(error, '加载需求拆解失败'))
      .finally(() => setLoading(false))
  }, [projectId, page, statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const fetchTasks = useCallback((id: number) => {
    const requestId = ++selectedTaskRequestRef.current
    setTasksLoading(true)
    issueApi.listTasks(id)
      .then(res => {
        if (selectedTaskRequestRef.current !== requestId) return
        setTasks(res.data.data || [])
      })
      .catch(error => {
        if (selectedTaskRequestRef.current !== requestId) return
        showApiError(error, '加载子任务失败')
      })
      .finally(() => {
        if (selectedTaskRequestRef.current !== requestId) return
        setTasksLoading(false)
      })
  }, [])

  const handleSelect = useCallback((item: IssueDecomposition) => {
    selectedTaskRequestRef.current += 1
    setSelected(item)
    setTasks([])
    setTasksLoading(false)
  }, [])

  const handleCloseDetail = useCallback(() => {
    selectedTaskRequestRef.current += 1
    setSelected(null)
    setTasks([])
    setTasksLoading(false)
  }, [])

  useEffect(() => {
    if (!selected) return
    if (selected.status === 'COMPLETED') {
      fetchTasks(selected.id)
    } else {
      selectedTaskRequestRef.current += 1
      setTasks([])
      setTasksLoading(false)
    }
  }, [fetchTasks, selected?.id, selected?.status])

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setCreating(true)
      await issueApi.create({ ...values, projectId })
      message.success('需求拆解已创建，正在处理中')
      setShowCreate(false)
      form.resetFields()
      setPage(1)
      fetchItems()
    } catch (error: any) {
      if (error?.errorFields) return
      showApiError(error, '创建需求拆解失败')
    } finally {
      setCreating(false)
    }
  }

  const handleExport = async (id: number) => {
    try {
      const res = await issueApi.exportMarkdown(id)
      const blob = new Blob([sanitizeIssueMarkdownExport(res.data.data)], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `issue-decomposition-${id}.md`
      a.click()
      URL.revokeObjectURL(url)
      message.success('Markdown 已导出')
    } catch (error) {
      showApiError(error, '导出失败')
    }
  }

  const handleCopyMarkdown = async (id: number) => {
    try {
      const res = await issueApi.exportMarkdown(id)
      await navigator.clipboard.writeText(sanitizeIssueMarkdownExport(res.data.data))
      message.success('Markdown 已复制')
    } catch (error) {
      showApiError(error, '复制失败')
    }
  }

  const handleTaskStatusChange = async (task: IssueTask, status: string) => {
    try {
      await issueApi.updateTaskStatus(task.id, status)
      setTasks(current => current.map(item => item.id === task.id ? { ...item, status } : item))
      message.success('子任务状态已更新')
    } catch (error) {
      showApiError(error, '更新子任务状态失败')
    }
  }

  const summary = useMemo(() => {
    const completed = items.filter(item => item.status === 'COMPLETED').length
    const processing = items.filter(item => item.status === 'PROCESSING' || item.status === 'PENDING').length
    const failed = items.filter(item => item.status === 'FAILED').length
    const highPriority = items.filter(item => item.priority === 'HIGH').length
    return { completed, processing, failed, highPriority }
  }, [items])

  const selectedLists = useMemo(() => {
    if (!selected) {
      return {
        impactModules: [],
        impactApis: [],
        impactDb: [],
        risks: [],
        dependencies: [],
        acceptance: [],
        relatedModules: [],
      }
    }
    return {
      impactModules: parseJsonList(selected.impactModules, true),
      impactApis: parseJsonList(selected.impactApis, true),
      impactDb: parseJsonList(selected.impactDb, true),
      risks: parseJsonList(selected.risks),
      dependencies: parseJsonList(selected.dependencies),
      acceptance: parseJsonList(selected.acceptance),
      relatedModules: parseJsonList(selected.relatedModules, true),
    }
  }, [selected])

  const taskStats = useMemo(() => {
    const develop = tasks.filter(task => task.category === 'DEVELOP').length
    const test = tasks.filter(task => task.category === 'TEST').length
    const done = tasks.filter(task => task.status === 'DONE').length
    const inProgress = tasks.filter(task => task.status === 'IN_PROGRESS').length
    const highRisk = tasks.filter(task => task.riskLevel === 'HIGH').length
    const estimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
    return { develop, test, done, inProgress, highRisk, estimatedHours }
  }, [tasks])

  const planningSignal = useMemo(() => buildPlanningSignal(
    selected,
    tasks.length,
    selectedLists.acceptance.length,
    selectedLists.risks.length,
    selectedLists.dependencies.length,
  ), [selected, selectedLists.acceptance.length, selectedLists.dependencies.length, selectedLists.risks.length, tasks.length])
  const governanceSteps = useMemo(() => buildIssueGovernanceSteps(
    selected,
    tasks.length,
    selectedLists.acceptance.length,
    selectedLists.risks.length,
    selectedLists.dependencies.length,
    selectedLists.impactModules.length + selectedLists.impactApis.length + selectedLists.impactDb.length,
    selectedLists.relatedModules.length,
  ), [
    selected,
    selectedLists.acceptance.length,
    selectedLists.dependencies.length,
    selectedLists.impactApis.length,
    selectedLists.impactDb.length,
    selectedLists.impactModules.length,
    selectedLists.relatedModules.length,
    selectedLists.risks.length,
    tasks.length,
  ])
  const selectedDetailId = selected ? `issue-decomposition-detail-${selected.id}` : undefined
  const selectedTitleId = selected ? `issue-decomposition-detail-title-${selected.id}` : undefined

  const issueColumns: ColumnsType<IssueDecomposition> = [
    {
      title: 'Issue',
      dataIndex: 'title',
      key: 'title',
      minWidth: 260,
      render: (title: string, record) => (
        <div className="sl-issue-title-cell">
          <ActionButton
            type="link"
            className="sl-issue-table-link"
            onClick={event => {
              event.stopPropagation()
              handleSelect(record)
            }}
            label={title}
          />
          <span>{record.description || '无需求描述'}</span>
        </div>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority: string) => {
        const cfg = getPriorityConfig(priority)
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const cfg = getStatusConfig(status)
        return <Badge status={cfg.badge} text={cfg.label} />
      },
    },
    {
      title: '关联模块',
      dataIndex: 'relatedModules',
      key: 'relatedModules',
      width: 120,
      render: (value: string | null) => {
        const count = parseJsonList(value, true).length
        return count ? `${count} 个` : '-'
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: formatDate,
    },
    {
      title: '操作',
      key: 'action',
      width: 124,
      render: (_, record) => (
        <Space size="small" onClick={event => event.stopPropagation()}>
          {record.status === 'COMPLETED' && (
            <>
              <IconActionButton
                label={`复制 Issue 拆解 #${record.id} Markdown`}
                tooltip="复制 Markdown"
                size="small"
                icon={<CopyOutlined />}
                onClick={event => {
                  event.stopPropagation()
                  handleCopyMarkdown(record.id)
                }}
              />
              <IconActionButton
                label={`导出 Issue 拆解 #${record.id} Markdown`}
                tooltip="导出 Markdown"
                size="small"
                icon={<ExportOutlined />}
                onClick={event => {
                  event.stopPropagation()
                  handleExport(record.id)
                }}
              />
            </>
          )}
        </Space>
      ),
    },
  ]

  const taskColumns: ColumnsType<IssueTask> = [
    {
      title: '#',
      dataIndex: 'taskOrder',
      key: 'taskOrder',
      width: 56,
      render: (value: number) => <Text type="secondary">{value}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      width: 92,
      render: (category: string) => (
        <Tag color={category === 'DEVELOP' ? 'blue' : 'green'}>
          {category === 'DEVELOP' ? '开发' : '测试'}
        </Tag>
      ),
    },
    {
      title: '任务',
      dataIndex: 'title',
      key: 'title',
      minWidth: 300,
      render: (title: string, record) => {
        const files = parseJsonList(record.impactFiles, true)
        const suggestions = parseJsonList(record.testSuggestions)
        return (
          <div className="sl-issue-task-copy">
            <strong>{title}</strong>
            {record.description && <span>{record.description}</span>}
            {!!files.length && (
              <div className="sl-issue-chip-list">
                {files.slice(0, 4).map(file => <Tag key={file}>{file}</Tag>)}
                {files.length > 4 && <Tag>+{files.length - 4}</Tag>}
              </div>
            )}
            {!!suggestions.length && <small>{suggestions[0]}</small>}
          </div>
        )
      },
    },
    {
      title: '风险',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 90,
      render: (risk: string | null) => <Tag color={RISK_COLORS[risk || ''] || 'default'}>{risk || '-'}</Tag>,
    },
    {
      title: '工时',
      dataIndex: 'estimatedHours',
      key: 'estimatedHours',
      width: 80,
      render: (hours: number | null) => hours ? `${hours}h` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 136,
      render: (status: string, record) => (
        <div onClick={event => event.stopPropagation()}>
          <Select
            size="small"
            value={status}
            style={{ width: 116 }}
            onChange={nextStatus => handleTaskStatusChange(record, nextStatus)}
            options={TASK_STATUS_OPTIONS}
          />
        </div>
      ),
    },
  ]

  const renderChipSection = (
    title: string,
    icon: ReactNode,
    items: string[],
    emptyText: string,
  ) => (
    <div className="sl-issue-section">
      <div className="sl-issue-section-title">{icon}{title}</div>
      {items.length ? (
        <div className="sl-issue-chip-list">
          {items.map(item => <Tag key={item}>{item}</Tag>)}
        </div>
      ) : (
        <Text type="secondary">{emptyText}</Text>
      )}
    </div>
  )

  const renderChecklist = (
    title: string,
    items: string[],
    emptyText: string,
    tone: SignalTone,
    icon: ReactNode,
  ) => (
    <div className="sl-issue-section">
      <div className="sl-issue-section-title">{icon}{title}</div>
      {items.length ? (
        <div className="sl-issue-check-list">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className={`sl-issue-check-item sl-issue-check-${tone}`}>
              {tone === 'danger' ? <WarningOutlined /> : <CheckCircleOutlined />}
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : (
        <Text type="secondary">{emptyText}</Text>
      )}
    </div>
  )

  return (
    <div className="sl-issue-page">
      <section className="sl-issue-cockpit">
        <div className="sl-issue-cockpit-main">
          <Text className="sl-kicker">Issue Planning Workbench</Text>
          <h1 className="sl-issue-title">Issue 拆解与交付计划</h1>
          <p className="sl-issue-desc">
            将需求描述转化为可执行的任务边界、影响范围、风险依赖与验收标准，让后续开发从“看起来要做”进入“可以被交付和验证”。
          </p>
          <div className="sl-issue-status-line">
            <span><span className="sl-live-dot" />本地后端已接入</span>
            <span>项目 #{projectId}</span>
            <span>当前页 {items.length} 条</span>
          </div>
          <div className="sl-issue-actions">
            <Select
              allowClear
              placeholder="筛选状态"
              value={statusFilter}
              onChange={value => { setStatusFilter(value); setPage(1) }}
              options={Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ label: cfg.label, value }))}
            />
            <ActionButton icon={<ReloadOutlined />} onClick={fetchItems} loading={loading} label="刷新" />
            <ActionButton type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)} label="新建拆解" />
          </div>
        </div>

        <aside className="sl-issue-boundary-card">
          <div className="sl-issue-boundary-head">
            <SafetyCertificateOutlined />
            <div>
              <span>Planning Boundary</span>
              <strong>先压实计划，再进入编码</strong>
            </div>
          </div>
          <div className="sl-issue-boundary-list">
            <div><CheckCircleOutlined />需求理解必须可复述</div>
            <div><CheckCircleOutlined />影响模块与 API 必须可追踪</div>
            <div><CheckCircleOutlined />验收标准必须能被测试验证</div>
            <div><CheckCircleOutlined />高风险任务必须先处理</div>
          </div>
        </aside>
      </section>

      <section className="sl-issue-summary-grid">
        <div className="sl-issue-stat sl-issue-stat-ready">
          <div className="sl-issue-stat-head"><FileDoneOutlined />已完成拆解</div>
          <strong>{summary.completed}</strong>
        </div>
        <div className="sl-issue-stat sl-issue-stat-warning">
          <div className="sl-issue-stat-head"><HourglassOutlined />处理中</div>
          <strong>{summary.processing}</strong>
        </div>
        <div className="sl-issue-stat sl-issue-stat-danger">
          <div className="sl-issue-stat-head"><WarningOutlined />失败记录</div>
          <strong>{summary.failed}</strong>
        </div>
        <div className="sl-issue-stat">
          <div className="sl-issue-stat-head"><FlagOutlined />高优先级</div>
          <strong>{summary.highPriority}</strong>
        </div>
      </section>

      <section className="sl-issue-governance-loop" aria-label="Issue 拆解治理闭环">
        <div className="sl-issue-governance-head">
          <div>
            <span>DEVELOPER CONTROL PLANE</span>
            <h2>Issue 拆解治理闭环</h2>
          </div>
          <p>
            把需求输入、任务拆解、验收门禁和执行交接放到同一条责任链中；拆解结果只能作为开发计划证据，不能证明实现、测试、CI、PR 或 LLM 判断已经正确。
          </p>
        </div>
        <div className="sl-issue-governance-grid">
          {governanceSteps.map(step => (
            <article
              key={step.key}
              className={`sl-issue-governance-step sl-issue-governance-step-${step.tone}`}
              data-sl-issue-governance-step={step.key}
            >
              <div className="sl-issue-governance-step-head">
                <div className="sl-issue-governance-icon">{step.icon}</div>
                <div className="sl-issue-governance-meta">
                  <span>{step.stage}</span>
                  <strong>{step.title}</strong>
                </div>
              </div>
              <div className="sl-issue-governance-copy">
                <h3>{step.title}</h3>
                <p>{step.summary}</p>
                <p>{step.evidence}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`sl-issue-workbench ${selected ? 'sl-issue-workbench-with-detail' : ''}`}>
        <Card className="sl-issue-table-card sl-selectable-table-card" title="需求拆解队列">
          <Table
            className="sl-issue-main-table"
            dataSource={items}
            columns={issueColumns}
            rowKey="id"
            loading={loading}
            size="middle"
            scroll={{ x: 850 }}
            locale={{ emptyText: <StateBlock compact title="暂无需求拆解" description="新建拆解后，影响范围、验收标准和子任务会在这里沉淀。" /> }}
            pagination={{
              current: page,
              total,
              pageSize: 20,
              showTotal: value => `共 ${value} 条`,
              onChange: setPage,
            }}
            rowClassName={record => record.id === selected?.id ? 'sl-issue-row-selected' : ''}
            onRow={record => createSelectableTableRowProps({
              record,
              selected: selected?.id === record.id,
              onSelect: handleSelect,
              controlsId: selectedDetailId,
              label: `IssueDecomposition #${record.id} ${record.title} ${selected?.id === record.id ? '已选中' : '查看详情'}`,
            })}
          />
        </Card>

        {selected && (
          <Card
            id={selectedDetailId}
            role="region"
            aria-labelledby={selectedTitleId}
            className="sl-issue-detail-card"
            title={
              <Space wrap id={selectedTitleId}>
                <Tag color={getPriorityConfig(selected.priority).color}>{getPriorityConfig(selected.priority).label}</Tag>
                <Badge status={getStatusConfig(selected.status).badge} text={getStatusConfig(selected.status).label} />
                <Text strong>{selected.title}</Text>
              </Space>
            }
            extra={<ActionButton size="small" onClick={handleCloseDetail} label="关闭" />}
          >
            <div className="sl-issue-detail-stack">
              <div className={`sl-issue-signal sl-issue-signal-${planningSignal.tone}`}>
                <div className="sl-issue-signal-head">
                  {planningSignal.tone === 'danger' ? <CloseCircleOutlined /> : <SafetyCertificateOutlined />}
                  <div>
                    <span>Plan Signal</span>
                    <strong>{planningSignal.title}</strong>
                  </div>
                </div>
                <p>{planningSignal.summary}</p>
                <div className="sl-issue-signal-grid">
                  <div>
                    <span>验收标准</span>
                    <strong>{selectedLists.acceptance.length}</strong>
                  </div>
                  <div>
                    <span>子任务</span>
                    <strong>{tasks.length}</strong>
                  </div>
                  <div>
                    <span>风险项</span>
                    <strong>{selectedLists.risks.length}</strong>
                  </div>
                  <div>
                    <span>依赖项</span>
                    <strong>{selectedLists.dependencies.length}</strong>
                  </div>
                </div>
                <div className="sl-issue-next-action">
                  <CheckCircleOutlined />
                  <span>{planningSignal.action}</span>
                </div>
              </div>

              <Tabs
                defaultActiveKey="plan"
                items={[
                  {
                    key: 'plan',
                    label: '拆解方案',
                    children: selected.status === 'COMPLETED' ? (
                      <div className="sl-issue-detail-stack">
                        {selected.understanding && (
                          <div className="sl-issue-section">
                            <div className="sl-issue-section-title"><FileTextOutlined />需求理解</div>
                            <Paragraph className="sl-issue-text-block">{selected.understanding}</Paragraph>
                          </div>
                        )}
                        <div className="sl-issue-impact-grid">
                          {renderChipSection('影响模块', <CodeOutlined />, selectedLists.impactModules, '未返回影响模块')}
                          {renderChipSection('影响数据库', <DatabaseOutlined />, selectedLists.impactDb, '未返回数据库影响')}
                          {renderChipSection('影响 API', <ApiOutlined />, selectedLists.impactApis, '未返回 API 影响')}
                          {renderChipSection('关联模块', <BranchesOutlined />, selectedLists.relatedModules, '创建时未填写关联模块')}
                        </div>
                        <div className="sl-issue-branch-grid">
                          <div className="sl-issue-section">
                            <div className="sl-issue-section-title"><BranchesOutlined />建议分支</div>
                            <Text code>{selected.suggestedBranch || '-'}</Text>
                          </div>
                          <div className="sl-issue-section">
                            <div className="sl-issue-section-title"><CodeOutlined />建议 Commit 粒度</div>
                            <Paragraph className="sl-issue-text-block">{selected.suggestedCommit || '未返回建议 Commit'}</Paragraph>
                          </div>
                        </div>
                        {renderChecklist('验收标准', selectedLists.acceptance, '未生成验收标准', 'ready', <CheckCircleOutlined />)}
                        {renderChecklist('风险点', selectedLists.risks, '未识别到风险点', selectedLists.risks.length ? 'danger' : 'ready', <WarningOutlined />)}
                        {renderChecklist('依赖事项', selectedLists.dependencies, '未识别到外部依赖', 'warning', <BranchesOutlined />)}
                      </div>
                    ) : selected.status === 'PROCESSING' ? (
                      <StateBlock tone="loading" title="正在生成拆解方案" description="系统正在提取影响范围、验收标准、风险和子任务。" />
                    ) : selected.status === 'FAILED' ? (
                      <StateBlock tone="error" title="拆解失败" description={selected.errorMessage || '后端未返回可用拆解结果。'} />
                    ) : (
                      <StateBlock compact title="等待处理" description="拆解任务进入处理队列后会生成完整计划。" />
                    ),
                  },
                  {
                    key: 'tasks',
                    label: `子任务 (${tasks.length})`,
                    children: tasksLoading ? (
                      <StateBlock compact tone="loading" title="正在加载子任务" description="子任务加载完成后会按开发、测试和风险维度展示。" />
                    ) : tasks.length ? (
                      <div className="sl-issue-detail-stack">
                        <div className="sl-issue-task-summary-grid">
                          <div><span>开发任务</span><strong>{taskStats.develop}</strong></div>
                          <div><span>测试任务</span><strong>{taskStats.test}</strong></div>
                          <div><span>推进中</span><strong>{taskStats.inProgress}</strong></div>
                          <div><span>已完成</span><strong>{taskStats.done}</strong></div>
                          <div><span>高风险</span><strong>{taskStats.highRisk}</strong></div>
                          <div><span>预估工时</span><strong>{taskStats.estimatedHours.toFixed(1)}h</strong></div>
                        </div>
                        <Table
                          className="sl-issue-task-table"
                          dataSource={tasks}
                          columns={taskColumns}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          scroll={{ x: 820 }}
                        />
                      </div>
                    ) : (
                      <StateBlock
                        compact
                        title={selected.status === 'COMPLETED' ? '暂无子任务' : '等待拆解完成'}
                        description={selected.status === 'COMPLETED' ? '当前拆解结果没有返回可执行子任务。' : '拆解完成后会生成子任务。'}
                      />
                    ),
                  },
                  {
                    key: 'source',
                    label: '原始结果',
                    children: selected.status === 'COMPLETED' ? (
                      <div className="sl-issue-detail-stack">
                        <Space wrap>
                          <ActionButton size="small" icon={<CopyOutlined />} onClick={() => handleCopyMarkdown(selected.id)} label="复制 Markdown" />
                          <ActionButton size="small" icon={<ExportOutlined />} onClick={() => handleExport(selected.id)} label="导出 .md" />
                        </Space>
                        <Alert
                          type="info"
                          showIcon
                          message="原始结果安全边界"
                          description="此处预览、复制和导出的 Markdown 会在前端显示层脱敏敏感值；后端原始记录和接口权限仍按服务端安全边界治理。"
                        />
                        <pre className="sl-issue-source-preview sl-issue-source-preview-redacted" aria-label="脱敏 Issue 拆解原始结果">{formatJsonPreview(selected.outputJson)}</pre>
                      </div>
                    ) : (
                      <StateBlock compact title="等待拆解完成" description="拆解完成后可查看原始结果。" />
                    ),
                  },
                ]}
              />
            </div>
          </Card>
        )}
      </section>

      <Modal
        title="新建需求拆解"
        open={showCreate}
        onCancel={() => { setShowCreate(false); form.resetFields() }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="提交拆解"
        width={720}
      >
        <Alert
          className="sl-issue-create-alert"
          type="info"
          showIcon
          message="需求越具体，拆解出的任务、风险和验收标准越稳定。"
        />
        <Form form={form} layout="vertical" className="sl-issue-form" initialValues={{ priority: 'MEDIUM' }}>
          <Form.Item name="title" label="需求标题" rules={[{ required: true, message: '请输入需求标题' }]}>
            <Input placeholder="例如：支持仓库分析报告导出" />
          </Form.Item>
          <Form.Item name="description" label="需求描述" rules={[{ required: true, message: '请输入需求描述' }]}>
            <TextArea rows={5} placeholder="描述功能范围、核心流程、输入输出、异常场景与交付要求" />
          </Form.Item>
          <Form.Item name="businessContext" label="业务背景">
            <TextArea rows={3} placeholder="说明为什么要做、目标用户是谁、上线后如何判断有效" />
          </Form.Item>
          <div className="sl-issue-form-grid">
            <Form.Item name="priority" label="优先级">
              <Select options={[
                { label: '高优先级', value: 'HIGH' },
                { label: '中优先级', value: 'MEDIUM' },
                { label: '低优先级', value: 'LOW' },
              ]} />
            </Form.Item>
            <Form.Item name="relatedModules" label="关联模块">
              <Input placeholder="例如：agent, report, repository" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
