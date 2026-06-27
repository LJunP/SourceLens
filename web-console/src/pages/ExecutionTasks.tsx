import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Empty, Input, Popconfirm, Progress, Select, Space, Table, Tag, Tooltip, Typography, message } from 'antd'
import {
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  FileDoneOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  StopOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { executionTaskApi, ExecutionAttempt, ExecutionLog, ExecutionTask, ExecutionTaskDetail, ExecutionStep } from '../api/executionTask'
import { showApiError } from '../api/client'
import ArtifactLinkButton from '../components/ArtifactLinkButton'
import LogViewer from '../components/LogViewer'
import TaskTimeline from '../components/TaskTimeline'

const { Title, Text } = Typography

interface Props {
  projectId: number
  initialTaskId?: number
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'default',
  QUEUED: 'warning',
  RUNNING: 'processing',
  WAITING_USER: 'purple',
  SUCCESS: 'success',
  FAILED: 'error',
  CANCELLED: 'default',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: '排队中',
  QUEUED: '已入队',
  RUNNING: '运行中',
  WAITING_USER: '等待确认',
  SUCCESS: '成功',
  FAILED: '失败',
  CANCELLED: '已取消',
}

const TASK_TYPE_LABEL: Record<string, string> = {
  SCAN: '代码扫描',
  SCAN_TASK: '代码扫描',
  AGENT: 'Agent 分析',
  AGENT_TASK: 'Agent 分析',
  AUTO_REPAIR: '补丁生成',
  CI_DIAGNOSTIC: 'CI 诊断',
  CI: 'CI 诊断',
  PR_REVIEW: 'PR 审查',
  REVIEW: 'PR 审查',
  ISSUE_DECOMPOSITION: 'Issue 拆解',
}

type ExecutionTone = 'ready' | 'warning' | 'danger' | 'idle'

interface ExecutionHealthSignal {
  label: string
  tone: ExecutionTone
  summary: string
  nextAction: string
  checks: Array<{
    label: string
    value: string
    tone: ExecutionTone
  }>
}

interface PipelineSignal {
  label: string
  tone: ExecutionTone
  summary: string
  nextAction: string
  checks: Array<{
    label: string
    value: string
    tone: ExecutionTone
  }>
}

export default function ExecutionTasks({ projectId, initialTaskId }: Props) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<ExecutionTask[]>([])
  const [selected, setSelected] = useState<ExecutionTask | null>(null)
  const [detail, setDetail] = useState<ExecutionTaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialTaskLoadedRef = useRef<string | null>(null)

  const hasActiveTask = useMemo(
    () => tasks.some(task => isActive(task.status)),
    [tasks]
  )

  const loadTasks = useCallback((nextPage = page, nextPageSize = pageSize, silent = false) => {
    if (!silent) setLoading(true)
    executionTaskApi.list(projectId, nextPage, nextPageSize)
      .then(res => {
        const data = res.data.data
        const list = data?.items || []
        setTasks(list)
        setPage(data?.page || nextPage)
        setPageSize(data?.pageSize || nextPageSize)
        setTotal(data?.total || 0)
        if (selected) {
          const updated = list.find(item => item.id === selected.id)
          if (updated) setSelected(updated)
        }
      })
      .catch(error => showApiError(error, '加载执行任务失败'))
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [page, pageSize, projectId, selected])

  const loadDetail = useCallback((task: ExecutionTask) => {
    setSelected(task)
    setDetailLoading(true)
    executionTaskApi.detail(projectId, task.id)
      .then(res => setDetail(res.data.data))
      .catch(error => {
        setDetail(null)
        showApiError(error, '加载任务详情失败')
      })
      .finally(() => setDetailLoading(false))
  }, [projectId])

  const refreshSelectedDetail = useCallback((taskId: number) => {
    executionTaskApi.detail(projectId, taskId)
      .then(res => {
        setDetail(res.data.data)
        setSelected(res.data.data.task)
      })
      .catch(() => undefined)
  }, [projectId])

  const handleCancel = async (task: ExecutionTask) => {
    setCancellingId(task.id)
    try {
      const res = await executionTaskApi.cancel(projectId, task.id)
      setDetail(res.data.data)
      setSelected(res.data.data.task)
      message.success('执行任务已取消')
      loadTasks(page, pageSize, true)
    } catch (error) {
      showApiError(error, '取消执行任务失败')
    } finally {
      setCancellingId(null)
    }
  }

  const openSource = (task: ExecutionTask) => {
    if (task.sourceType === 'SCAN_TASK' && task.sourceId) {
      navigate(`/scan-tasks/${task.sourceId}`)
      return
    }
    if (task.sourceType === 'AGENT_TASK') {
      navigate('/agent-tasks')
      return
    }
    if (task.sourceType === 'AUTO_REPAIR' && task.sourceId) {
      navigate(`/auto-repairs?projectId=${projectId}&repairId=${task.sourceId}`)
      return
    }
    if (task.sourceType === 'CI_DIAGNOSTIC' && task.sourceId) {
      navigate(`/ci-diagnostics?projectId=${projectId}&diagnosticId=${task.sourceId}`)
      return
    }
    if (task.sourceType === 'PR_REVIEW' && task.sourceId) {
      navigate(`/pr-reviews?projectId=${projectId}&reviewId=${task.sourceId}`)
      return
    }
    if (task.sourceType === 'ISSUE_DECOMPOSITION' && task.sourceId) {
      navigate(`/issue-decomposition?projectId=${projectId}&decompositionId=${task.sourceId}`)
    }
  }

  useEffect(() => {
    loadTasks(1, pageSize)
  }, [projectId])

  useEffect(() => {
    if (!initialTaskId) return
    const loadKey = `${projectId}:${initialTaskId}`
    if (initialTaskLoadedRef.current === loadKey) return
    initialTaskLoadedRef.current = loadKey
    setDetailLoading(true)
    executionTaskApi.detail(projectId, initialTaskId)
      .then(res => {
        setDetail(res.data.data)
        setSelected(res.data.data.task)
      })
      .catch(error => showApiError(error, '加载指定执行任务失败'))
      .finally(() => setDetailLoading(false))
  }, [initialTaskId, projectId])

  useEffect(() => {
    if (hasActiveTask) {
      timerRef.current = setTimeout(() => loadTasks(page, pageSize, true), 3000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [hasActiveTask, loadTasks, page, pageSize])

  useEffect(() => {
    if (selected && hasActiveTask) {
      refreshSelectedDetail(selected.id)
    }
  }, [refreshSelectedDetail, selected?.id, hasActiveTask, tasks])

  const filteredTasks = useMemo(() => tasks.filter(task => {
    const q = keyword.trim().toLowerCase()
    const matchedStatus = statusFilter === 'ALL' || task.status === statusFilter
    const matchedType = typeFilter === 'ALL' || task.taskType === typeFilter
    if (!matchedStatus || !matchedType) return false
    if (!q) return true
    return [
      String(task.id),
      TASK_TYPE_LABEL[task.taskType] || task.taskType,
      task.taskType,
      STATUS_LABEL[task.status] || task.status,
      task.status,
      task.currentStep || '',
      task.sourceType || '',
      String(task.sourceId || ''),
      task.errorMessage || '',
    ].some(value => value.toLowerCase().includes(q))
  }), [keyword, statusFilter, tasks, typeFilter])

  const statusOptions = useMemo(() => [
    { value: 'ALL', label: '全部状态' },
    ...Array.from(new Set(tasks.map(task => task.status))).sort().map(status => ({
      value: status,
      label: STATUS_LABEL[status] || status,
    })),
  ], [tasks])

  const typeOptions = useMemo(() => [
    { value: 'ALL', label: '全部类型' },
    ...Array.from(new Set(tasks.map(task => task.taskType))).sort().map(type => ({
      value: type,
      label: TASK_TYPE_LABEL[type] || type,
    })),
  ], [tasks])

  const summary = useMemo(() => {
    const activeCount = tasks.filter(task => isActive(task.status)).length
    const failedCount = tasks.filter(task => task.status === 'FAILED').length
    const successCount = tasks.filter(task => task.status === 'SUCCESS').length
    const cancelledCount = tasks.filter(task => task.status === 'CANCELLED').length
    const terminalCount = tasks.filter(task => isTerminal(task.status)).length
    const sourceLinkedCount = tasks.filter(canOpenSource).length
    const sourceCoverage = tasks.length ? Math.round((sourceLinkedCount / tasks.length) * 100) : 0
    const stalledCount = tasks.filter(isPotentiallyStalled).length
    const averageProgress = tasks.length
      ? Math.round(tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length)
      : 0
    const typeStats = Array.from(tasks.reduce((map, task) => {
      const stat = map.get(task.taskType) || { type: task.taskType, count: 0, active: 0 }
      stat.count += 1
      if (isActive(task.status)) stat.active += 1
      map.set(task.taskType, stat)
      return map
    }, new Map<string, { type: string; count: number; active: number }>()).values())
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))
    return {
      activeCount,
      cancelledCount,
      failedCount,
      successCount,
      terminalCount,
      sourceLinkedCount,
      sourceCoverage,
      stalledCount,
      averageProgress,
      typeStats,
    }
  }, [tasks])

  const pipelineSignal = useMemo(() => buildPipelineSignal(tasks.length, summary), [summary, tasks.length])

  const columns = [
    {
      title: '任务',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 210,
      render: (type: string, record: ExecutionTask) => (
        <Space direction="vertical" size={4}>
          <Button
            aria-label={`查看任务 #${record.id} 详情`}
            type="link"
            className="sl-inline-link"
            onClick={() => loadDetail(record)}
          >
            <Space size="small">
              <ScheduleOutlined />
              <span>{TASK_TYPE_LABEL[type] || type}</span>
            </Space>
          </Button>
          <Text type="secondary" className="sl-table-subtext">
            #{record.id} · {record.currentStep || '等待调度'}
          </Text>
        </Space>
      )
    },
    {
      title: '来源',
      key: 'source',
      width: 130,
      render: (_: unknown, record: ExecutionTask) => (
        <Space direction="vertical" size={2}>
          <Tag>{record.sourceType || 'UNKNOWN'}</Tag>
          <Text type="secondary">#{record.sourceId || '-'}</Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => (
        <Tag color={STATUS_COLOR[status] || 'default'}>{STATUS_LABEL[status] || status}</Tag>
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 130,
      render: (value: number, record: ExecutionTask) => (
        <Progress percent={value || 0} size="small" status={progressStatus(record.status)} />
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 145,
      render: (value: string) => formatTime(value)
    },
    {
      title: '操作',
      key: 'actions',
      width: 125,
      render: (_: unknown, record: ExecutionTask) => (
        <Space size="small" onClick={(event) => event.stopPropagation()}>
          <Tooltip title="打开来源">
            <Button
              aria-label={`打开任务 #${record.id} 来源`}
              size="small"
              icon={<LinkOutlined />}
              disabled={!canOpenSource(record)}
              onClick={() => openSource(record)}
            />
          </Tooltip>
          <ArtifactLinkButton
            projectId={projectId}
            ownerType={artifactOwnerType(record)}
            ownerId={record.sourceId}
          />
          {isActive(record.status) && (
            <Popconfirm
              title="取消执行任务"
              description="取消会同步到来源任务，长耗时步骤将在下一个检查点停止。"
              okText="取消任务"
              cancelText="返回"
              onConfirm={() => handleCancel(record)}
            >
              <Tooltip title="取消任务">
                <Button
                  aria-label={`取消任务 #${record.id}`}
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  loading={cancellingId === record.id}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  const attemptsById = useMemo(() => {
    const map = new Map<number, ExecutionAttempt>()
    ;(detail?.attempts || []).forEach(attempt => map.set(attempt.id, attempt))
    return map
  }, [detail?.attempts])

  const executionLogText = useMemo(
    () => formatExecutionLogs(detail?.logs || [], attemptsById),
    [attemptsById, detail?.logs]
  )
  const selectedHealth = selected ? buildExecutionHealthSignal(selected, detail) : null

  return (
    <div>
      <section className="sl-execution-cockpit">
        <div className="sl-execution-cockpit-main">
          <div className="sl-kicker">Execution Control</div>
          <h1 className="sl-execution-title">执行任务中心</h1>
          <p className="sl-execution-desc">
            统一观察代码扫描、Agent 分析、自动修复、CI 诊断、PR 审查和 Issue 拆解的执行状态，把异步任务变成可追踪、可取消、可复盘的工程流水线。
          </p>
          <div className="sl-execution-status-line">
            <Tag color={hasActiveTask ? 'processing' : 'default'}>{hasActiveTask ? '自动刷新中' : '当前稳定'}</Tag>
            <Tag>{filteredTasks.length} / {tasks.length} 个任务</Tag>
            {selected && <Tag color="blue">已选任务 #{selected.id}</Tag>}
          </div>
          <div className="sl-execution-toolbar">
            <Input
              allowClear
              prefix={<ScheduleOutlined />}
              placeholder="搜索任务、来源、步骤或错误"
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
            />
            <Select value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
            <Select value={typeFilter} options={typeOptions} onChange={setTypeFilter} />
            <Button aria-label="刷新执行任务" icon={<ReloadOutlined />} onClick={() => loadTasks()}>
              刷新
            </Button>
          </div>
        </div>

        <aside className="sl-execution-boundary-card">
          <div className="sl-execution-boundary-head">
            <SafetyCertificateOutlined />
            <div>
              <span>Pipeline Boundary</span>
              <strong>每个异步动作都要留下证据</strong>
            </div>
          </div>
          <div className="sl-execution-boundary-list">
            <div><BranchesOutlined />来源任务可跳转</div>
            <div><CheckCircleOutlined />步骤状态可复盘</div>
            <div><CheckCircleOutlined />日志和产物可追踪</div>
            <div><CheckCircleOutlined />长耗时任务可取消</div>
          </div>
        </aside>
      </section>

      <div className="sl-execution-summary-grid">
        <ExecutionStat icon={<ScheduleOutlined />} label="任务总数" value={tasks.length} footnote={`${filteredTasks.length} 个当前可见`} tone="default" />
        <ExecutionStat icon={<SyncOutlined spin={summary.activeCount > 0} />} label="活跃任务" value={summary.activeCount} footnote="排队、运行或待确认" />
        <ExecutionStat icon={<FileDoneOutlined />} label="终态任务" value={summary.terminalCount} footnote={`${summary.successCount} 成功 / ${summary.cancelledCount} 取消`} tone="ready" />
        <ExecutionStat icon={summary.failedCount > 0 ? <WarningOutlined /> : <ClockCircleOutlined />} label="平均进度" value={`${summary.averageProgress}%`} footnote={`${summary.failedCount} 个失败任务`} tone={summary.failedCount ? 'danger' : 'default'} />
      </div>

      <ExecutionPipelineSignal signal={pipelineSignal} />

      {summary.typeStats.length > 0 && (
        <div className="sl-execution-type-strip">
          {summary.typeStats.slice(0, 8).map(stat => (
            <button
              aria-pressed={typeFilter === stat.type}
              className={`sl-execution-type-chip ${typeFilter === stat.type ? 'sl-execution-type-chip-active' : ''}`}
              key={stat.type}
              type="button"
              onClick={() => setTypeFilter(typeFilter === stat.type ? 'ALL' : stat.type)}
            >
              <span>{TASK_TYPE_LABEL[stat.type] || stat.type}</span>
              <strong>{stat.count}</strong>
              <small>{stat.active} 个活跃</small>
            </button>
          ))}
        </div>
      )}

      <div className={`sl-execution-layout ${selected ? 'sl-execution-layout-with-detail' : ''}`}>
        <Card className="sl-section-card sl-execution-table-card">
          <Table
            dataSource={filteredTasks}
            columns={columns}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无执行任务" /> }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: value => `共 ${value} 条`,
            }}
            scroll={{ x: 850 }}
            onChange={(next) => loadTasks(next.current || 1, next.pageSize || 20)}
            onRow={(record) => ({
              onClick: () => loadDetail(record),
              className: selected?.id === record.id ? 'sl-execution-row-active' : '',
            })}
          />
        </Card>

        {selected && (
          <Card
            className="sl-section-card sl-execution-detail-card"
            title={(
              <Space size="small">
                <ScheduleOutlined />
                <span>任务 #{selected.id}</span>
              </Space>
            )}
            extra={(
              <Button
                aria-label="关闭任务详情"
                type="text"
                icon={<CloseOutlined />}
                onClick={() => {
                  setSelected(null)
                  setDetail(null)
                }}
              />
            )}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div className="sl-execution-detail-head">
                <div>
                  <Text type="secondary">{selected.sourceType || 'UNKNOWN'} #{selected.sourceId || '-'}</Text>
                  <Title level={5}>{TASK_TYPE_LABEL[selected.taskType] || selected.taskType}</Title>
                </div>
                <Tag color={STATUS_COLOR[selected.status] || 'default'}>{STATUS_LABEL[selected.status] || selected.status}</Tag>
              </div>

              <Progress percent={selected.progress || 0} status={progressStatus(selected.status)} />
              {selectedHealth && <ExecutionHealthCard signal={selectedHealth} />}
              <ExecutionEvidenceGrid task={selected} detail={detail} />

              <Space wrap>
                <Button
                  aria-label={`打开任务 #${selected.id} 来源`}
                  icon={<LinkOutlined />}
                  disabled={!canOpenSource(selected)}
                  onClick={() => openSource(selected)}
                >
                  打开来源
                </Button>
                <ArtifactLinkButton
                  projectId={projectId}
                  ownerType={artifactOwnerType(selected)}
                  ownerId={selected.sourceId}
                  size="middle"
                  label="查看产物"
                />
                {isActive(selected.status) && (
                  <Popconfirm
                    title="取消执行任务"
                    description="取消会同步到来源任务，长耗时步骤将在下一个检查点停止。"
                    okText="取消任务"
                    cancelText="返回"
                    onConfirm={() => handleCancel(selected)}
                  >
                    <Button
                      aria-label={`取消任务 #${selected.id}`}
                      danger
                      icon={<StopOutlined />}
                      loading={cancellingId === selected.id}
                    >
                      取消任务
                    </Button>
                  </Popconfirm>
                )}
              </Space>

              {selected.errorMessage && (
                <Alert type="error" showIcon message="任务错误" description={selected.errorMessage} />
              )}

              <div className="sl-execution-meta-grid">
                <div>
                  <span>当前步骤</span>
                  <strong>{selected.currentStep || '-'}</strong>
                </div>
                <div>
                  <span>开始时间</span>
                  <strong>{formatTime(selected.startedAt) || '-'}</strong>
                </div>
                <div>
                  <span>结束时间</span>
                  <strong>{formatTime(selected.finishedAt) || '-'}</strong>
                </div>
                <div>
                  <span>更新时间</span>
                  <strong>{formatTime(selected.updatedAt) || '-'}</strong>
                </div>
              </div>

              {!!detail?.attempts?.length && (
                <Space size={[6, 6]} wrap>
                  <Text type="secondary">执行次数：</Text>
                  {detail.attempts.map(attempt => (
                    <Tag key={attempt.id} color={STATUS_COLOR[attempt.status] || 'default'}>
                      第 {attempt.attemptNo} 次 · {STATUS_LABEL[attempt.status] || attempt.status}
                    </Tag>
                  ))}
                </Space>
              )}

              <TaskTimeline
                loading={detailLoading}
                items={(detail?.steps || []).map(step => ({
                  key: step.id,
                  title: stepTitle(step, attemptsById),
                  status: step.status,
                  description: stepDescription(step),
                  errorMessage: step.errorMessage,
                }))}
              />

              <div>
                <Text strong>执行日志</Text>
                <div className="sl-execution-log">
                  <LogViewer value={executionLogText} maxHeight={240} />
                </div>
              </div>
            </Space>
          </Card>
        )}
      </div>
    </div>
  )
}

function ExecutionStat({
  icon,
  label,
  value,
  footnote,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  footnote: string
  tone?: ExecutionTone | 'default'
}) {
  return (
    <div className={`sl-execution-stat sl-execution-stat-${tone}`}>
      <div className="sl-execution-stat-head">
        <span>{label}</span>
        {icon}
      </div>
      <div className="sl-execution-stat-value">{value}</div>
      <div className="sl-execution-stat-footnote">{footnote}</div>
    </div>
  )
}

function ExecutionPipelineSignal({ signal }: { signal: PipelineSignal }) {
  return (
    <div className={`sl-execution-pipeline-signal sl-execution-pipeline-signal-${signal.tone}`}>
      <div className="sl-execution-pipeline-head">
        {signal.tone === 'danger' ? <WarningOutlined /> : <SafetyCertificateOutlined />}
        <div>
          <span>Pipeline Signal</span>
          <strong>{signal.summary}</strong>
        </div>
        <Tag color={executionToneColor(signal.tone)}>{signal.label}</Tag>
      </div>
      <div className="sl-execution-pipeline-grid">
        {signal.checks.map(check => (
          <div className={`sl-execution-pipeline-check sl-execution-pipeline-check-${check.tone}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-execution-next-action">
        <CheckCircleOutlined />
        <span>{signal.nextAction}</span>
      </div>
    </div>
  )
}

function ExecutionHealthCard({ signal }: { signal: ExecutionHealthSignal }) {
  return (
    <div className={`sl-execution-health sl-execution-health-${signal.tone}`}>
      <div className="sl-execution-health-head">
        <div>
          <span>Execution health</span>
          <strong>{signal.summary}</strong>
        </div>
        <Tag color={executionToneColor(signal.tone)}>{signal.label}</Tag>
      </div>
      <div className="sl-execution-health-grid">
        {signal.checks.map(check => (
          <div className={`sl-execution-health-check sl-execution-health-check-${check.tone}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-execution-next-action">
        <CheckCircleOutlined />
        <span>{signal.nextAction}</span>
      </div>
    </div>
  )
}

function ExecutionEvidenceGrid({ task, detail }: { task: ExecutionTask; detail: ExecutionTaskDetail | null }) {
  const attemptCount = detail?.attempts?.length || 0
  const stepCount = detail?.steps?.length || 0
  const logCount = detail?.logs?.length || 0
  const ownerType = artifactOwnerType(task)

  return (
    <div className="sl-execution-evidence-grid">
      <div>
        <span>来源闭环</span>
        <strong>{canOpenSource(task) ? '可跳转' : '缺失'}</strong>
      </div>
      <div>
        <span>执行次数</span>
        <strong>{attemptCount ? `${attemptCount} 次` : '无'}</strong>
      </div>
      <div>
        <span>步骤证据</span>
        <strong>{stepCount ? `${stepCount} 个` : '无'}</strong>
      </div>
      <div>
        <span>日志证据</span>
        <strong>{logCount ? `${logCount} 条` : '无'}</strong>
      </div>
      <div>
        <span>产物 Owner</span>
        <strong>{ownerType || '无'}</strong>
      </div>
      <div>
        <span>创建人</span>
        <strong>{task.createdBy || '-'}</strong>
      </div>
    </div>
  )
}

function buildPipelineSignal(taskCount: number, summary: {
  activeCount: number
  failedCount: number
  terminalCount: number
  sourceCoverage: number
  stalledCount: number
}): PipelineSignal {
  if (!taskCount) {
    return {
      label: '空闲',
      tone: 'idle',
      summary: '当前项目还没有执行任务',
      nextAction: '先发起一次代码扫描或 Agent 分析，让任务流水线产生可观测证据。',
      checks: [
        { label: '任务数', value: '0', tone: 'idle' },
        { label: '来源覆盖', value: '0%', tone: 'idle' },
        { label: '终态任务', value: '0', tone: 'idle' },
      ],
    }
  }

  if (summary.failedCount > 0 || summary.stalledCount > 0) {
    return {
      label: '复核',
      tone: 'danger',
      summary: summary.stalledCount > 0 ? '存在疑似卡住的执行任务' : '存在失败的执行任务',
      nextAction: '优先打开失败或长时间未更新的任务，核对步骤、日志和来源上下文。',
      checks: [
        { label: '失败任务', value: `${summary.failedCount}`, tone: summary.failedCount ? 'danger' : 'ready' },
        { label: '疑似卡住', value: `${summary.stalledCount}`, tone: summary.stalledCount ? 'danger' : 'ready' },
        { label: '来源覆盖', value: `${summary.sourceCoverage}%`, tone: summary.sourceCoverage >= 80 ? 'ready' : 'warning' },
      ],
    }
  }

  if (summary.activeCount > 0) {
    return {
      label: '运行中',
      tone: 'warning',
      summary: '当前有任务正在排队、运行或等待人工确认',
      nextAction: '保持自动刷新；如果长时间停留在同一步骤，再进入详情查看日志并决定是否取消。',
      checks: [
        { label: '活跃任务', value: `${summary.activeCount}`, tone: 'warning' },
        { label: '终态任务', value: `${summary.terminalCount}`, tone: 'ready' },
        { label: '来源覆盖', value: `${summary.sourceCoverage}%`, tone: summary.sourceCoverage >= 80 ? 'ready' : 'warning' },
      ],
    }
  }

  return {
    label: '健康',
    tone: summary.sourceCoverage >= 80 ? 'ready' : 'warning',
    summary: summary.sourceCoverage >= 80 ? '任务流水线处于稳定终态' : '任务已稳定，但部分来源跳转不完整',
    nextAction: summary.sourceCoverage >= 80 ? '继续保持任务、日志、产物三者闭环。' : '补齐缺失的来源映射，让执行任务能回到对应业务页面。',
    checks: [
      { label: '终态任务', value: `${summary.terminalCount}`, tone: 'ready' },
      { label: '失败任务', value: `${summary.failedCount}`, tone: summary.failedCount ? 'danger' : 'ready' },
      { label: '来源覆盖', value: `${summary.sourceCoverage}%`, tone: summary.sourceCoverage >= 80 ? 'ready' : 'warning' },
    ],
  }
}

function buildExecutionHealthSignal(task: ExecutionTask, detail: ExecutionTaskDetail | null): ExecutionHealthSignal {
  const stepCount = detail?.steps?.length || 0
  const attemptCount = detail?.attempts?.length || 0
  const logCount = detail?.logs?.length || 0
  const hasError = Boolean(task.errorMessage)
  const hasSource = canOpenSource(task)

  if (task.status === 'FAILED') {
    return {
      label: '失败',
      tone: 'danger',
      summary: '任务失败，需要复盘步骤和日志',
      nextAction: hasSource ? '先打开来源页面复核业务上下文，再查看失败步骤和执行日志。' : '先查看失败步骤和执行日志，补齐来源关联后再重跑。',
      checks: [
        { label: '错误摘要', value: hasError ? '存在' : '缺失', tone: hasError ? 'danger' : 'warning' },
        { label: '步骤', value: stepCount ? `${stepCount} 个` : '缺失', tone: stepCount ? 'warning' : 'danger' },
        { label: '日志', value: logCount ? `${logCount} 条` : '缺失', tone: logCount ? 'warning' : 'danger' },
      ],
    }
  }

  if (task.status === 'CANCELLED') {
    return {
      label: '已停止',
      tone: 'idle',
      summary: '任务已取消，终态不会被后台覆盖',
      nextAction: hasSource ? '可回到来源页面重新创建任务或复盘取消前的步骤记录。' : '保留当前执行证据，必要时重新发起来源任务。',
      checks: [
        { label: '终态', value: '已冻结', tone: 'ready' },
        { label: '步骤', value: stepCount ? `${stepCount} 个` : '无', tone: stepCount ? 'warning' : 'idle' },
        { label: '日志', value: logCount ? `${logCount} 条` : '无', tone: logCount ? 'warning' : 'idle' },
      ],
    }
  }

  if (isActive(task.status)) {
    return {
      label: task.status === 'WAITING_USER' ? '待确认' : '运行中',
      tone: 'warning',
      summary: task.status === 'WAITING_USER' ? '任务等待人工确认' : '任务正在执行或排队',
      nextAction: task.status === 'WAITING_USER' ? '打开来源页面完成确认，或在此处取消任务。' : '保持页面自动刷新；如任务卡住，可先查看日志再取消。',
      checks: [
        { label: '进度', value: `${task.progress || 0}%`, tone: task.progress > 0 ? 'warning' : 'idle' },
        { label: '当前步骤', value: task.currentStep || '等待', tone: task.currentStep ? 'warning' : 'idle' },
        { label: '可取消', value: '是', tone: 'ready' },
      ],
    }
  }

  if (task.status === 'SUCCESS') {
    return {
      label: '健康',
      tone: 'ready',
      summary: '任务成功完成，证据链可追踪',
      nextAction: hasSource ? '可打开来源页面查看报告、产物或后续自动化结果。' : '可查看执行日志和产物库，补齐来源跳转会更完整。',
      checks: [
        { label: '进度', value: `${task.progress || 100}%`, tone: 'ready' },
        { label: 'Attempt', value: attemptCount ? `${attemptCount} 次` : '无', tone: attemptCount ? 'ready' : 'warning' },
        { label: '日志', value: logCount ? `${logCount} 条` : '无', tone: logCount ? 'ready' : 'warning' },
      ],
    }
  }

  return {
    label: '待观察',
    tone: 'idle',
    summary: '任务状态尚未形成明确结论',
    nextAction: '等待任务进入运行或终态后再判断健康度。',
    checks: [
      { label: '状态', value: STATUS_LABEL[task.status] || task.status, tone: 'idle' },
      { label: '来源', value: hasSource ? '可打开' : '缺失', tone: hasSource ? 'ready' : 'warning' },
      { label: '步骤', value: stepCount ? `${stepCount} 个` : '无', tone: stepCount ? 'warning' : 'idle' },
    ],
  }
}

function executionToneColor(tone: ExecutionTone) {
  if (tone === 'ready') return 'green'
  if (tone === 'warning') return 'gold'
  if (tone === 'danger') return 'red'
  return 'default'
}

function stepTitle(step: ExecutionStep, attemptsById: Map<number, ExecutionAttempt>) {
  if (!step.attemptId) return step.stepName
  const attempt = attemptsById.get(step.attemptId)
  return attempt ? `第 ${attempt.attemptNo} 次 · ${step.stepName}` : step.stepName
}

function stepDescription(step: ExecutionStep) {
  if (step.errorMessage) return step.errorMessage
  if (step.logSummary) return step.logSummary
  return step.status
}

function formatExecutionLogs(logs: ExecutionLog[], attemptsById: Map<number, ExecutionAttempt>) {
  return logs.map(log => {
    const attempt = log.attemptId ? attemptsById.get(log.attemptId) : null
    const attemptText = attempt ? ` 第${attempt.attemptNo}次` : ''
    const stepText = log.stepKey ? ` ${log.stepKey}` : ''
    return `${formatTime(log.createdAt)} [${log.level}]${attemptText}${stepText} ${log.message}`.trim()
  }).join('\n')
}

function formatTime(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

function isActive(status: string) {
  return status === 'PENDING' || status === 'QUEUED' || status === 'RUNNING' || status === 'WAITING_USER'
}

function isTerminal(status: string) {
  return status === 'SUCCESS' || status === 'FAILED' || status === 'CANCELLED'
}

function isPotentiallyStalled(task: ExecutionTask) {
  if (!isActive(task.status) || !task.updatedAt) return false
  return Date.now() - new Date(task.updatedAt).getTime() > 10 * 60 * 1000
}

function progressStatus(status: string): 'success' | 'exception' | 'active' | 'normal' {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'exception'
  if (isActive(status)) return 'active'
  return 'normal'
}

function canOpenSource(task: ExecutionTask) {
  return (task.sourceType === 'SCAN_TASK' && Boolean(task.sourceId))
    || task.sourceType === 'AGENT_TASK'
    || (task.sourceType === 'AUTO_REPAIR' && Boolean(task.sourceId))
    || (task.sourceType === 'CI_DIAGNOSTIC' && Boolean(task.sourceId))
    || (task.sourceType === 'PR_REVIEW' && Boolean(task.sourceId))
    || (task.sourceType === 'ISSUE_DECOMPOSITION' && Boolean(task.sourceId))
}

function artifactOwnerType(task: ExecutionTask) {
  if (task.sourceType === 'SCAN_TASK') return 'SCAN_TASK'
  if (task.sourceType === 'AUTO_REPAIR') return 'AUTO_REPAIR'
  if (task.sourceType === 'AGENT_TASK') return 'AGENT_TASK'
  return ''
}
