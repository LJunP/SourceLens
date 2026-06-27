import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card, Table, Tag, Typography, Button, Space, Select, Descriptions, Tabs,
  Tooltip, Badge, Modal, Form, Input, InputNumber, message, Empty, Alert, Progress, Popconfirm
} from 'antd'
import {
  RobotOutlined, PlayCircleOutlined, StopOutlined, PlusOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  SyncOutlined, MessageOutlined, SafetyCertificateOutlined
} from '@ant-design/icons'
import { agentTaskApi, AgentTask, AgentTaskStep } from '../api/agentTask'
import { showApiError } from '../api/client'
import ArtifactLinkButton from '../components/ArtifactLinkButton'
import TaskTimeline from '../components/TaskTimeline'

const { Text } = Typography

const TASK_STATUS_MAP: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: 'default', icon: <ClockCircleOutlined /> },
  RUNNING: { color: 'processing', icon: <SyncOutlined spin /> },
  COMPLETED: { color: 'success', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'error', icon: <CloseCircleOutlined /> },
  CANCELLED: { color: 'warning', icon: <StopOutlined /> },
}

const TASK_TYPE_LABELS: Record<string, string> = {
  ARCHITECTURE_REVIEW: '架构审查',
  RISK_SCAN: '风险扫描',
  CHANGE_IMPACT: '变更影响',
  CUSTOM: '自定义',
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'blue',
}

const ACTIVE_STATUSES = ['PENDING', 'RUNNING']
const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED']

type AgentTone = 'ready' | 'warning' | 'danger' | 'idle'

interface AgentTaskHealthSignal {
  label: string
  tone: AgentTone
  summary: string
  nextAction: string
  checks: Array<{
    label: string
    value: string
    tone: AgentTone
  }>
}

interface Props {
  projectId: number
}

export default function AgentTasks({ projectId }: Props) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null)
  const [steps, setSteps] = useState<AgentTaskStep[]>([])
  const [stepsLoading, setStepsLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createForm] = Form.useForm()
  const requestedScanTaskId = parsePositiveNumber(searchParams.get('scanTaskId'))
  const openCreate = searchParams.get('openCreate') === '1'
  const prefilledCreateKeyRef = useRef<string | null>(null)

  const fetchTasks = () => {
    setLoading(true)
    agentTaskApi.listByProject(projectId, page, 20, statusFilter, requestedScanTaskId)
      .then(res => {
        setTasks(res.data.data.items || [])
        setTotal(res.data.data.total)
      })
      .catch(error => showApiError(error, '加载任务失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [projectId, page, statusFilter, requestedScanTaskId])

  useEffect(() => {
    if (!openCreate) return
    const nextTaskType = searchParams.get('taskType') || 'ARCHITECTURE_REVIEW'
    const nextTitle = searchParams.get('title') || (requestedScanTaskId
      ? `扫描报告 #${requestedScanTaskId} 架构审查`
      : '架构审查')
    const nextDescription = searchParams.get('description') || (requestedScanTaskId
      ? `基于扫描报告 #${requestedScanTaskId} 创建 Agent 分析任务，保持报告、工具调用和产物证据一致。`
      : undefined)
    const prefillKey = `${projectId}:${requestedScanTaskId || 'latest'}:${nextTaskType}:${nextTitle}`
    if (prefilledCreateKeyRef.current === prefillKey) return
    prefilledCreateKeyRef.current = prefillKey
    createForm.resetFields()
    createForm.setFieldsValue({
      taskType: nextTaskType,
      priority: searchParams.get('priority') || 'MEDIUM',
      title: nextTitle,
      description: nextDescription,
      scanTaskId: requestedScanTaskId || undefined,
    })
    setCreateModalOpen(true)
  }, [createForm, openCreate, projectId, requestedScanTaskId, searchParams])

  const fetchSteps = (taskId: number) => {
    setStepsLoading(true)
    agentTaskApi.listSteps(taskId)
      .then(res => setSteps(res.data.data || []))
      .catch(error => showApiError(error, '加载步骤失败'))
      .finally(() => setStepsLoading(false))
  }

  const handleSelectTask = (task: AgentTask) => {
    setSelectedTask(task)
    fetchSteps(task.id)
  }

  const openScanTask = (scanTaskId?: number | null) => {
    if (scanTaskId) navigate(`/scan-tasks/${scanTaskId}`)
  }

  const handleStart = async (taskId: number) => {
    try {
      await agentTaskApi.start(taskId)
      message.success('任务已启动')
      fetchTasks()
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: 'RUNNING', startedAt: new Date().toISOString() })
      }
    } catch (error) { showApiError(error, '启动失败') }
  }

  const handleCancel = async (taskId: number) => {
    try {
      await agentTaskApi.cancel(taskId)
      message.success('任务已取消')
      fetchTasks()
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: 'CANCELLED', finishedAt: new Date().toISOString() })
      }
    } catch (error) { showApiError(error, '取消失败') }
  }

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      setCreateSubmitting(true)
      await agentTaskApi.create({
        projectId,
        scanTaskId: parsePositiveNumber(values.scanTaskId) || undefined,
        taskType: values.taskType,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority || 'MEDIUM',
      })
      message.success('任务已创建')
      setCreateModalOpen(false)
      createForm.resetFields()
      fetchTasks()
    } catch (error: any) {
      if (error?.errorFields) return
      showApiError(error, '创建任务失败')
    }
    finally { setCreateSubmitting(false) }
  }

  const summary = {
    activeCount: tasks.filter(task => ACTIVE_STATUSES.includes(task.status)).length,
    completedCount: tasks.filter(task => task.status === 'COMPLETED').length,
    failedCount: tasks.filter(task => task.status === 'FAILED').length,
    highPriorityCount: tasks.filter(task => task.priority === 'HIGH').length,
    terminalCount: tasks.filter(task => TERMINAL_STATUSES.includes(task.status)).length,
  }
  const selectedProgress = selectedTask ? agentTaskProgress(selectedTask, steps) : 0
  const selectedHealth = selectedTask ? buildAgentTaskHealthSignal(selectedTask, steps) : null

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: AgentTask) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => handleSelectTask(record)}>
          {title}
        </Button>
      ),
    },
    {
      title: '类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 100,
      render: (type: string) => <Tag>{TASK_TYPE_LABELS[type] || type}</Tag>,
    },
    {
      title: '扫描',
      dataIndex: 'scanTaskId',
      key: 'scanTaskId',
      width: 110,
      render: (scanTaskId: number | null, record: AgentTask) => scanTaskId ? (
        <Button
          type="link"
          size="small"
          style={{ padding: 0 }}
          onClick={(event) => {
            event.stopPropagation()
            openScanTask(record.scanTaskId)
          }}
        >
          #{scanTaskId}
        </Button>
      ) : (
        <Text type="secondary">-</Text>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: string) => <Tag color={PRIORITY_COLORS[p]}>{p}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = TASK_STATUS_MAP[status] || { color: 'default', icon: null }
        return <Badge status={cfg.color as any} text={status} />
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: AgentTask) => (
        <Space size="small">
          {record.conversationId && (
            <Tooltip title="打开对话"><Button size="small" type="primary" icon={<MessageOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/agent-chat/${record.conversationId}`) }} /></Tooltip>
          )}
          <span onClick={(e) => e.stopPropagation()}>
            <ArtifactLinkButton projectId={projectId} ownerType="AGENT_TASK" ownerId={record.id} />
          </span>
          {record.status === 'PENDING' && (
            <Tooltip title="启动"><Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStart(record.id)} /></Tooltip>
          )}
          {record.status === 'RUNNING' && (
            <Popconfirm
              title="取消 Agent 任务？"
              description="任务会在下一个检查点停止，已有步骤和产物记录会保留。"
              okText="取消任务"
              cancelText="返回"
              onConfirm={() => handleCancel(record.id)}
            >
              <Tooltip title="取消">
                <Button size="small" danger icon={<StopOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          <Tooltip title="详情"><Button size="small" onClick={() => handleSelectTask(record)}>详情</Button></Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="sl-agent-cockpit">
        <section className="sl-agent-cockpit-main">
          <div className="sl-kicker">Agent Workbench</div>
          <h1 className="sl-agent-title">Agent 辅助理解任务</h1>
          <p className="sl-agent-desc">
            将架构审查、风险扫描、变更影响和自定义分析纳入可追踪任务，默认以只读理解和产物审查为核心。
          </p>
          <div className="sl-agent-status-line">
            <span className={`sl-live-dot ${summary.activeCount > 0 ? 'sl-live-dot-running' : ''}`} />
            <span>{summary.activeCount > 0 ? `${summary.activeCount} 个 Agent 任务运行中` : 'Agent 队列待命'}</span>
            <span>{tasks.length} tasks</span>
            <span>{summary.completedCount} completed</span>
            {requestedScanTaskId && <span>scan #{requestedScanTaskId}</span>}
          </div>
          <div className="sl-agent-actions">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              createForm.resetFields()
              createForm.setFieldsValue({
                taskType: 'ARCHITECTURE_REVIEW',
                priority: 'MEDIUM',
                scanTaskId: requestedScanTaskId || undefined,
              })
              setCreateModalOpen(true)
            }}>创建任务</Button>
            <Select
              allowClear
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              options={Object.keys(TASK_STATUS_MAP).map(s => ({ label: s, value: s }))}
            />
          </div>
        </section>

        <section className="sl-agent-boundary-card">
          <div className="sl-agent-boundary-head">
            <div>
              <span>Tool boundary</span>
              <strong>默认只读优先</strong>
            </div>
            <SafetyCertificateOutlined />
          </div>
          <div className="sl-agent-boundary-list">
            <div><CheckCircleOutlined /> 工具调用进入审计记录</div>
            <div><CheckCircleOutlined /> 写入和 shell 能力显式授权</div>
            <div><CheckCircleOutlined /> 输出脱敏并限制上下文长度</div>
          </div>
        </section>
      </div>

      <div className="sl-agent-summary-grid">
        <AgentStat icon={<SyncOutlined spin={summary.activeCount > 0} />} label="活跃任务" value={summary.activeCount} footnote="排队或运行中" tone={summary.activeCount > 0 ? 'warning' : 'idle'} />
        <AgentStat icon={<CheckCircleOutlined />} label="已完成" value={summary.completedCount} footnote={`${summary.terminalCount} 个终态任务`} tone={summary.completedCount > 0 ? 'ready' : 'idle'} />
        <AgentStat icon={<CloseCircleOutlined />} label="失败任务" value={summary.failedCount} footnote="需查看步骤和错误" tone={summary.failedCount > 0 ? 'danger' : 'idle'} />
        <AgentStat icon={<ClockCircleOutlined />} label="高优先级" value={summary.highPriorityCount} footnote="优先复盘队列" tone={summary.highPriorityCount > 0 ? 'warning' : 'idle'} />
      </div>

      <Modal
        title="创建 Agent 任务"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={createSubmitting}
        width={520}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="例如: 架构审查 - SourceLens" />
          </Form.Item>
          <Form.Item name="taskType" label="任务类型" rules={[{ required: true }]}>
            <Select options={Object.entries(TASK_TYPE_LABELS).map(([k, v]) => ({ label: v, value: k }))} />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select options={[
              { label: 'HIGH', value: 'HIGH' },
              { label: 'MEDIUM', value: 'MEDIUM' },
              { label: 'LOW', value: 'LOW' },
            ]} />
          </Form.Item>
          <Form.Item name="scanTaskId" label="绑定扫描任务">
            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="默认使用最新成功扫描" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="任务描述 (可选)" />
          </Form.Item>
        </Form>
      </Modal>

      <div className={`sl-agent-workbench ${selectedTask ? 'sl-agent-workbench-with-detail' : ''}`}>
        <Card className="sl-section-card sl-agent-table-card" title={<span className="sl-card-title"><RobotOutlined /> Agent 任务列表</span>}>
          <Table
            dataSource={tasks}
            columns={columns}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 Agent 任务" /> }}
            pagination={{
              current: page,
              total,
              pageSize: 20,
              showTotal: (t) => `共 ${t} 个任务`,
              onChange: setPage,
            }}
            scroll={{ x: 1040 }}
            size="middle"
            rowClassName={(record) => selectedTask?.id === record.id ? 'sl-agent-row-selected' : ''}
            onRow={(record) => ({
              onClick: () => handleSelectTask(record),
            })}
          />
        </Card>

        {selectedTask && (
          <Card
            className="sl-section-card sl-agent-detail-card"
            title={
              <Space wrap>
                <Tag color={TASK_STATUS_MAP[selectedTask.status]?.color}>{selectedTask.status}</Tag>
                <span>{selectedTask.title}</span>
              </Space>
            }
            extra={
              <Space wrap>
                  {selectedTask.conversationId && (
                    <Button size="small" type="primary" onClick={() => navigate(`/agent-chat/${selectedTask.conversationId}`)}>打开对话</Button>
                  )}
                  {selectedTask.scanTaskId && (
                    <Button size="small" onClick={() => openScanTask(selectedTask.scanTaskId)}>打开扫描报告</Button>
                  )}
                  {selectedTask.status === 'RUNNING' && (
                    <Popconfirm
                      title="取消 Agent 任务？"
                      description="任务会在下一个检查点停止，已有步骤和产物记录会保留。"
                      okText="取消任务"
                      cancelText="返回"
                      onConfirm={() => handleCancel(selectedTask.id)}
                    >
                      <Button size="small" danger icon={<StopOutlined />}>取消</Button>
                    </Popconfirm>
                  )}
                  <ArtifactLinkButton
                  projectId={projectId}
                  ownerType="AGENT_TASK"
                  ownerId={selectedTask.id}
                  label="查看产物"
                />
                <Button size="small" onClick={() => setSelectedTask(null)}>关闭</Button>
              </Space>
            }
          >
            <div className="sl-agent-detail-stack">
              {selectedHealth && (
                <>
                  <AgentTaskHealthCard signal={selectedHealth} progress={selectedProgress} />
                  {selectedTask.errorMessage && (
                    <Alert type="error" showIcon message="Agent 任务错误" description={selectedTask.errorMessage} />
                  )}
                </>
              )}
              <Tabs defaultActiveKey="info" items={[
                {
                  key: 'info',
                  label: '基本信息',
                  children: (
                    <Descriptions column={2} bordered size="small">
                      <Descriptions.Item label="ID">{selectedTask.id}</Descriptions.Item>
                      <Descriptions.Item label="类型">
                        <Tag>{TASK_TYPE_LABELS[selectedTask.taskType] || selectedTask.taskType}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="优先级">
                        <Tag color={PRIORITY_COLORS[selectedTask.priority]}>{selectedTask.priority}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="项目 ID">{selectedTask.projectId}</Descriptions.Item>
                      <Descriptions.Item label="关联扫描" span={2}>
                        {selectedTask.scanTaskId ? (
                          <Button
                            type="link"
                            size="small"
                            style={{ padding: 0 }}
                            onClick={() => openScanTask(selectedTask.scanTaskId)}
                          >
                            扫描报告 #{selectedTask.scanTaskId}
                          </Button>
                        ) : '无'}
                      </Descriptions.Item>
                      <Descriptions.Item label="描述" span={2}>
                        {selectedTask.description || '无'}
                      </Descriptions.Item>
                      <Descriptions.Item label="开始时间">
                        {selectedTask.startedAt ? new Date(selectedTask.startedAt).toLocaleString('zh-CN') : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="结束时间">
                        {selectedTask.finishedAt ? new Date(selectedTask.finishedAt).toLocaleString('zh-CN') : '-'}
                      </Descriptions.Item>
                      {selectedTask.summary && (
                        <Descriptions.Item label="摘要" span={2}>
                          <Text>{selectedTask.summary}</Text>
                        </Descriptions.Item>
                      )}
                      {selectedTask.errorMessage && (
                        <Descriptions.Item label="错误" span={2}>
                          <Text type="danger">{selectedTask.errorMessage}</Text>
                        </Descriptions.Item>
                      )}
                      {selectedTask.inputJson && (
                        <Descriptions.Item label="输入" span={2}>
                          <pre style={{ margin: 0, fontSize: 12, maxHeight: 120, overflow: 'auto' }}>
                            {(() => { try { return JSON.stringify(JSON.parse(selectedTask.inputJson), null, 2) } catch { return selectedTask.inputJson } })()}
                          </pre>
                        </Descriptions.Item>
                      )}
                      {selectedTask.outputJson && (
                        <Descriptions.Item label="输出" span={2}>
                          <pre style={{ margin: 0, fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
                            {(() => { try { return JSON.stringify(JSON.parse(selectedTask.outputJson), null, 2) } catch { return selectedTask.outputJson } })()}
                          </pre>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  ),
                },
                {
                  key: 'steps',
                  label: `执行步骤 (${steps.length})`,
                  children: (
                    <TaskTimeline
                      loading={stepsLoading}
                      items={steps.map(step => ({
                        key: step.id,
                        title: `#${step.stepOrder}`,
                        status: step.status,
                        category: step.stepType,
                        toolName: step.toolName,
                        durationMs: step.durationMs,
                        description: step.description,
                        output: step.outputJson,
                        errorMessage: step.errorMessage,
                      }))}
                    />
                  ),
                },
              ]} />
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function parsePositiveNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function AgentStat({
  icon,
  label,
  value,
  footnote,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  footnote: string
  tone: AgentTone
}) {
  return (
    <div className={`sl-agent-stat sl-agent-stat-${tone}`}>
      <div className="sl-agent-stat-head">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{footnote}</small>
    </div>
  )
}

function AgentTaskHealthCard({ signal, progress }: { signal: AgentTaskHealthSignal; progress: number }) {
  return (
    <div className={`sl-agent-health sl-agent-health-${signal.tone}`}>
      <div className="sl-agent-health-head">
        <div>
          <span>Agent task health</span>
          <strong>{signal.summary}</strong>
        </div>
        <Tag color={agentToneColor(signal.tone)}>{signal.label}</Tag>
      </div>
      <Progress percent={progress} showInfo={false} />
      <div className="sl-agent-health-grid">
        {signal.checks.map(check => (
          <div className={`sl-agent-health-check sl-agent-health-check-${check.tone}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-agent-next-action">
        <CheckCircleOutlined />
        <span>{signal.nextAction}</span>
      </div>
    </div>
  )
}

function agentTaskProgress(task: AgentTask, steps: AgentTaskStep[]) {
  if (task.status === 'COMPLETED') return 100
  if (task.status === 'FAILED' || task.status === 'CANCELLED') return 100
  if (task.status === 'PENDING') return 10
  if (task.status === 'RUNNING') {
    if (!steps.length) return 38
    const done = steps.filter(step => step.status === 'COMPLETED' || step.status === 'SUCCESS' || step.status === 'FAILED').length
    return Math.max(42, Math.min(92, Math.round((done / steps.length) * 100)))
  }
  return 0
}

function buildAgentTaskHealthSignal(task: AgentTask, steps: AgentTaskStep[]): AgentTaskHealthSignal {
  const hasConversation = Boolean(task.conversationId)
  const hasArtifact = Boolean(task.outputJson || task.summary)
  const hasSteps = steps.length > 0
  const failedSteps = steps.filter(step => step.status === 'FAILED').length
  const toolCalls = steps.filter(step => Boolean(step.toolName)).length

  if (task.status === 'FAILED') {
    return {
      label: '失败',
      tone: 'danger',
      summary: 'Agent 任务失败，需要复盘步骤与输入输出',
      nextAction: hasConversation ? '打开关联对话复盘上下文，再查看失败步骤和错误摘要。' : '先查看失败步骤和输入输出，必要时创建新对话补充上下文。',
      checks: [
        { label: '失败步骤', value: String(failedSteps || '-'), tone: failedSteps > 0 ? 'danger' : 'warning' },
        { label: '对话', value: hasConversation ? '已关联' : '缺失', tone: hasConversation ? 'warning' : 'danger' },
        { label: '产物', value: hasArtifact ? '有输出' : '无输出', tone: hasArtifact ? 'warning' : 'danger' },
      ],
    }
  }

  if (task.status === 'CANCELLED') {
    return {
      label: '已停止',
      tone: 'idle',
      summary: 'Agent 任务已取消，后续不会继续写入',
      nextAction: hasConversation ? '可以打开对话复盘取消前的上下文。' : '保留当前步骤记录，必要时重新创建任务。',
      checks: [
        { label: '终态', value: '已冻结', tone: 'ready' },
        { label: '步骤', value: hasSteps ? `${steps.length} 个` : '无', tone: hasSteps ? 'warning' : 'idle' },
        { label: '工具', value: `${toolCalls} 次`, tone: toolCalls > 0 ? 'warning' : 'idle' },
      ],
    }
  }

  if (task.status === 'RUNNING' || task.status === 'PENDING') {
    return {
      label: task.status === 'RUNNING' ? '运行中' : '待启动',
      tone: 'warning',
      summary: task.status === 'RUNNING' ? 'Agent 正在分析或调用工具' : '任务已创建，等待启动',
      nextAction: task.status === 'RUNNING' ? '保持页面刷新；如任务卡住，可取消后用更明确的描述重建任务。' : '可启动任务，或先补充描述与关联扫描上下文。',
      checks: [
        { label: '优先级', value: task.priority, tone: task.priority === 'HIGH' ? 'warning' : 'idle' },
        { label: '对话', value: hasConversation ? '已关联' : '未关联', tone: hasConversation ? 'ready' : 'warning' },
        { label: '可取消', value: task.status === 'RUNNING' ? '是' : '-', tone: task.status === 'RUNNING' ? 'ready' : 'idle' },
      ],
    }
  }

  return {
    label: '健康',
    tone: 'ready',
    summary: 'Agent 任务完成，结果可进入复盘',
    nextAction: hasArtifact ? '查看产物或打开对话，把结论转入报告、修复候选或任务复盘。' : '任务已完成但缺少摘要产物，建议查看步骤输出并补齐结果记录。',
    checks: [
      { label: '步骤', value: hasSteps ? `${steps.length} 个` : '无', tone: hasSteps ? 'ready' : 'warning' },
      { label: '工具', value: `${toolCalls} 次`, tone: toolCalls > 0 ? 'ready' : 'idle' },
      { label: '产物', value: hasArtifact ? '有输出' : '缺失', tone: hasArtifact ? 'ready' : 'warning' },
    ],
  }
}

function agentToneColor(tone: AgentTone) {
  if (tone === 'ready') return 'green'
  if (tone === 'warning') return 'gold'
  if (tone === 'danger') return 'red'
  return 'default'
}
