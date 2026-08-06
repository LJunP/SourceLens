import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card, Table, Tag, Typography, Space, Select, Descriptions, Tabs,
  Badge, Modal, Form, Input, InputNumber, message, Alert, Progress, Popconfirm
} from 'antd'
import {
  RobotOutlined, PlayCircleOutlined, StopOutlined, PlusOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  SyncOutlined, MessageOutlined, SafetyCertificateOutlined, ReloadOutlined
} from '@ant-design/icons'
import { agentTaskApi, AgentTask, AgentTaskStep } from '../api/agentTask'
import { formatApiError, showApiError } from '../api/client'
import ArtifactLinkButton from '../components/ArtifactLinkButton'
import ActionButton from '../components/ui/ActionButton'
import IconActionButton from '../components/ui/IconActionButton'
import { createSelectableTableRowProps } from '../components/ui/selectableTableRow'
import StateBlock from '../components/ui/StateBlock'
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

interface AgentTaskActionGate {
  status: 'READY' | 'REVIEW' | 'BLOCKED'
  tone: AgentTone
  summary: string
  reason: string
  checks: Array<{
    label: string
    value: string
    tone: AgentTone
  }>
}

interface AgentTaskLifecycleStage {
  key: string
  stage: string
  title: string
  status: string
  description: string
  tone: AgentTone
  icon: React.ReactNode
}

interface Props {
  projectId: number
}

export default function AgentTasks({ projectId }: Props) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [taskListError, setTaskListError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null)
  const [steps, setSteps] = useState<AgentTaskStep[]>([])
  const [stepsLoading, setStepsLoading] = useState(false)
  const [stepsError, setStepsError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createForm] = Form.useForm()
  const requestedScanTaskId = parsePositiveNumber(searchParams.get('scanTaskId'))
  const requestedTaskId = parsePositiveNumber(searchParams.get('taskId'))
  const openCreate = searchParams.get('openCreate') === '1'
  const prefilledCreateKeyRef = useRef<string | null>(null)
  const appliedRequestedTaskIdRef = useRef<number | null>(null)
  const stepsRequestSeqRef = useRef(0)

  const fetchTasks = () => {
    setLoading(true)
    setTaskListError(null)
    agentTaskApi.listByProject(projectId, page, 20, statusFilter, requestedScanTaskId)
      .then(res => {
        setTasks(res.data.data.items || [])
        setTotal(res.data.data.total)
        setTaskListError(null)
      })
      .catch(error => {
        setTaskListError(formatApiError(error, '加载任务失败'))
        showApiError(error, '加载任务失败')
      })
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
    const requestSeq = stepsRequestSeqRef.current + 1
    stepsRequestSeqRef.current = requestSeq
    setStepsLoading(true)
    setStepsError(null)
    agentTaskApi.listSteps(taskId)
      .then(res => {
        if (stepsRequestSeqRef.current !== requestSeq) return
        setSteps(res.data.data || [])
        setStepsError(null)
      })
      .catch(error => {
        if (stepsRequestSeqRef.current !== requestSeq) return
        setStepsError(formatApiError(error, '加载步骤失败'))
        showApiError(error, '加载步骤失败')
      })
      .finally(() => {
        if (stepsRequestSeqRef.current === requestSeq) {
          setStepsLoading(false)
        }
      })
  }

  const handleSelectTask = (task: AgentTask) => {
    setSelectedTask(task)
    setSteps([])
    setStepsError(null)
    fetchSteps(task.id)
  }

  useEffect(() => {
    if (!requestedTaskId || appliedRequestedTaskIdRef.current === requestedTaskId) return
    const matched = tasks.find(task => task.id === requestedTaskId)
    if (matched) {
      appliedRequestedTaskIdRef.current = requestedTaskId
      handleSelectTask(matched)
      return
    }
    if (loading) return
    appliedRequestedTaskIdRef.current = requestedTaskId
    agentTaskApi.detail(requestedTaskId)
      .then(res => {
        const detail = res.data.data
        if (!detail) return
        setTasks(prev => prev.some(task => task.id === detail.id) ? prev : [detail, ...prev])
        handleSelectTask(detail)
      })
      .catch(error => showApiError(error, '加载指定 Agent 任务失败'))
  }, [loading, requestedTaskId, tasks])

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
    scanBoundCount: tasks.filter(task => Boolean(task.scanTaskId)).length,
    conversationBoundCount: tasks.filter(task => Boolean(task.conversationId)).length,
  }
  const selectedProgress = selectedTask ? agentTaskProgress(selectedTask, steps) : 0
  const selectedHealth = selectedTask ? buildAgentTaskHealthSignal(selectedTask, steps) : null
  const selectedActionGate = selectedTask ? buildAgentTaskActionGate(selectedTask) : null
  const lifecycleStages = useMemo(
    () => buildAgentTaskLifecycleStages(tasks, summary, selectedTask, steps),
    [selectedTask, steps, summary, tasks],
  )
  const selectedDetailId = selectedTask ? `agent-task-detail-${selectedTask.id}` : undefined
  const selectedTitleId = selectedTask ? `agent-task-detail-title-${selectedTask.id}` : undefined
  const taskListEmptyText = taskListError ? (
    <StateBlock
      compact
      tone="error"
      title="Agent 任务加载失败"
      description={taskListError}
      action={<ActionButton size="small" icon={<ReloadOutlined />} loading={loading} onClick={fetchTasks} label="重试加载" />}
    />
  ) : (
    <StateBlock compact title="暂无 Agent 任务" description="创建架构审查、风险扫描或变更影响任务后会在这里追踪步骤。" />
  )

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
        <ActionButton
          type="link"
          className="sl-inline-link"
          onClick={(event) => {
            event.stopPropagation()
            handleSelectTask(record)
          }}
          label={title}
        />
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
        <ActionButton
          type="link"
          size="small"
          className="sl-inline-link"
          onClick={(event) => {
            event.stopPropagation()
            openScanTask(record.scanTaskId)
          }}
          label={`#${scanTaskId}`}
        />
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
        <Space size="small" onClick={(event) => event.stopPropagation()}>
          {record.conversationId && (
            <IconActionButton
              label={`打开 Agent 任务 #${record.id} 对话`}
              tooltip="打开对话"
              size="small"
              type="primary"
              icon={<MessageOutlined />}
              onClick={(event) => { event.stopPropagation(); navigate(`/agent-chat/${record.conversationId}`) }}
            />
          )}
          <span onClick={(e) => e.stopPropagation()}>
            <ArtifactLinkButton projectId={projectId} ownerType="AGENT_TASK" ownerId={record.id} />
          </span>
          {record.status === 'PENDING' && (
            <IconActionButton
              label={`启动 Agent 任务 #${record.id}`}
              tooltip="启动"
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={(event) => {
                event.stopPropagation()
                handleStart(record.id)
              }}
            />
          )}
          {record.status === 'RUNNING' && (
            <Popconfirm
              title="取消 Agent 任务？"
              description="任务会在下一个检查点停止，已有步骤和产物记录会保留。"
              okText="取消任务"
              cancelText="返回"
              onConfirm={() => handleCancel(record.id)}
            >
              <IconActionButton
                label={`取消 Agent 任务 #${record.id}`}
                tooltip="取消"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={(event) => event.stopPropagation()}
              />
            </Popconfirm>
          )}
          <ActionButton
            size="small"
            className="sl-agent-detail-action"
            onClick={(event) => {
              event.stopPropagation()
              handleSelectTask(record)
            }}
            aria-label={`查看 Agent 任务 #${record.id} 详情`}
            label="详情"
          />
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
            <ActionButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                createForm.resetFields()
                createForm.setFieldsValue({
                  taskType: 'ARCHITECTURE_REVIEW',
                  priority: 'MEDIUM',
                  scanTaskId: requestedScanTaskId || undefined,
                })
                setCreateModalOpen(true)
              }}
              label="创建任务"
            />
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

      <AgentTaskLifecycleLoop stages={lifecycleStages} />

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
        <Card className="sl-section-card sl-agent-table-card sl-selectable-table-card" title={<span className="sl-card-title"><RobotOutlined /> Agent 任务列表</span>}>
          {taskListError && tasks.length > 0 && (
            <StateBlock
              compact
              tone="error"
              title="Agent 任务刷新失败"
              description={taskListError}
              action={<ActionButton size="small" icon={<ReloadOutlined />} loading={loading} onClick={fetchTasks} label="重试加载" />}
            />
          )}
          <Table
            dataSource={tasks}
            columns={columns}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: taskListEmptyText }}
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
            onRow={(record) => createSelectableTableRowProps({
              record,
              selected: selectedTask?.id === record.id,
              onSelect: handleSelectTask,
              controlsId: selectedDetailId,
              label: `AgentTask #${record.id} ${selectedTask?.id === record.id ? '已选中' : '查看详情'}`,
            })}
          />
        </Card>

        {selectedTask && (
          <Card
            id={selectedDetailId}
            role="region"
            aria-labelledby={selectedTitleId}
            className="sl-section-card sl-agent-detail-card"
            title={
              <Space wrap id={selectedTitleId}>
                <Tag color={TASK_STATUS_MAP[selectedTask.status]?.color}>{selectedTask.status}</Tag>
                <span>{selectedTask.title}</span>
              </Space>
            }
            extra={
              <Space wrap>
                  {selectedTask.conversationId && (
                    <ActionButton size="small" type="primary" icon={<MessageOutlined />} onClick={() => navigate(`/agent-chat/${selectedTask.conversationId}`)} label="打开对话" />
                  )}
                  {selectedTask.scanTaskId && (
                    <ActionButton size="small" onClick={() => openScanTask(selectedTask.scanTaskId)} label="打开扫描报告" />
                  )}
                  {selectedTask.status === 'RUNNING' && (
                    <Popconfirm
                      title="取消 Agent 任务？"
                      description="任务会在下一个检查点停止，已有步骤和产物记录会保留。"
                      okText="取消任务"
                      cancelText="返回"
                      onConfirm={() => handleCancel(selectedTask.id)}
                    >
                      <ActionButton size="small" danger icon={<StopOutlined />} label="取消" />
                    </Popconfirm>
                  )}
                  <ArtifactLinkButton
                  projectId={projectId}
                  ownerType="AGENT_TASK"
                  ownerId={selectedTask.id}
                  label="查看产物"
                />
                <ActionButton size="small" onClick={() => setSelectedTask(null)} label="关闭" />
              </Space>
            }
          >
            <div className="sl-agent-detail-stack">
              {selectedHealth && (
                <>
                  <AgentTaskHealthCard signal={selectedHealth} progress={selectedProgress} />
                  {selectedActionGate && <AgentTaskActionGatePanel gate={selectedActionGate} />}
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
                    <>
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
                            <ActionButton
                              type="link"
                              size="small"
                              className="sl-inline-link"
                              onClick={() => openScanTask(selectedTask.scanTaskId)}
                              label={`扫描报告 #${selectedTask.scanTaskId}`}
                            />
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
                            <Text type="secondary">已留存，原始输入默认隐藏；请通过审计日志或授权产物复核。</Text>
                          </Descriptions.Item>
                        )}
                        {selectedTask.outputJson && (
                          <Descriptions.Item label="输出" span={2}>
                            <Text type="secondary">已留存，原始输出默认隐藏；当前页面仅展示摘要、步骤和可审计产物。</Text>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                      {(selectedTask.inputJson || selectedTask.outputJson) && (
                        <section className="sl-agent-payload-safety" aria-label="原始 Payload 安全边界">
                          <SafetyCertificateOutlined />
                          <div>
                            <span>原始 Payload 默认隐藏</span>
                            <p>任务输入和输出可能包含 prompt、路径、模型中间内容或工具结果；当前详情只展示摘要、步骤和产物入口，原文必须通过授权审计链路复核。</p>
                          </div>
                        </section>
                      )}
                    </>
                  ),
                },
                {
                  key: 'steps',
                  label: `执行步骤 (${steps.length})`,
                  children: stepsError ? (
                    <StateBlock
                      compact
                      tone="error"
                      title="执行步骤加载失败"
                      description={stepsError}
                      action={<ActionButton size="small" icon={<ReloadOutlined />} loading={stepsLoading} onClick={() => fetchSteps(selectedTask.id)} label="重试加载" />}
                    />
                  ) : (
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

function AgentTaskLifecycleLoop({ stages }: { stages: AgentTaskLifecycleStage[] }) {
  return (
    <section className="sl-agent-lifecycle-loop" aria-label="Agent 任务治理闭环">
      <div className="sl-agent-lifecycle-head">
        <SafetyCertificateOutlined />
        <div>
          <span>DEVELOPER CONTROL PLANE</span>
          <h2>Agent 任务治理闭环</h2>
          <p>Agent 任务闭环只能证明任务元数据、步骤、对话、扫描报告和产物入口可追踪，不能证明模型判断正确、工具输出真实、修复/PR/CI 结果正确。</p>
        </div>
      </div>
      <div className="sl-agent-lifecycle-grid">
        {stages.map(stage => (
          <article
            key={stage.key}
            className={`sl-agent-lifecycle-stage sl-agent-lifecycle-stage-${stage.tone}`}
            data-sl-agent-lifecycle-stage={stage.key}
          >
            <div className="sl-agent-lifecycle-stage-head">
              <div className="sl-agent-lifecycle-icon">{stage.icon}</div>
              <div>
                <span>{stage.stage}</span>
                <strong>{stage.title}</strong>
              </div>
            </div>
            <div className="sl-agent-lifecycle-status">{stage.status}</div>
            <p>{stage.description}</p>
          </article>
        ))}
      </div>
    </section>
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

function AgentTaskActionGatePanel({ gate }: { gate: AgentTaskActionGate }) {
  return (
    <section
      className={`sl-agent-action-gate sl-agent-action-gate-${gate.tone}`}
      aria-label="Agent 任务动作门禁说明"
    >
      <div className="sl-agent-action-gate-head">
        <SafetyCertificateOutlined />
        <div>
          <span>Agent Task Action Gate</span>
          <strong>{gate.summary}</strong>
        </div>
        <Tag color={agentToneColor(gate.tone)}>{gate.status}</Tag>
      </div>
      <p>{gate.reason}</p>
      <div className="sl-agent-action-gate-grid">
        {gate.checks.map(check => (
          <div className={`sl-agent-action-gate-check sl-agent-action-gate-check-${check.tone}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
      </div>
    </section>
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

function buildAgentTaskLifecycleStages(
  tasks: AgentTask[],
  summary: {
    activeCount: number
    completedCount: number
    failedCount: number
    highPriorityCount: number
    terminalCount: number
    scanBoundCount: number
    conversationBoundCount: number
  },
  selectedTask: AgentTask | null,
  steps: AgentTaskStep[],
): AgentTaskLifecycleStage[] {
  const taskCount = tasks.length
  const selectedStepCount = selectedTask ? steps.length : 0
  const selectedToolStepCount = selectedTask ? steps.filter(step => Boolean(step.toolName)).length : 0
  const selectedHasReviewOutput = Boolean(selectedTask?.summary || selectedTask?.outputJson)
  const sourceCoverage = taskCount ? Math.round((summary.scanBoundCount / taskCount) * 100) : 0
  const conversationCoverage = taskCount ? Math.round((summary.conversationBoundCount / taskCount) * 100) : 0
  const intakeTone: AgentTone = !taskCount ? 'idle' : sourceCoverage >= 70 ? 'ready' : 'warning'
  const controlTone: AgentTone = summary.failedCount > 0 ? 'danger' : summary.activeCount > 0 ? 'warning' : taskCount ? 'ready' : 'idle'
  const evidenceTone: AgentTone = !selectedTask ? 'idle' : selectedStepCount > 0 ? 'ready' : 'warning'
  const handoffTone: AgentTone = summary.failedCount > 0 ? 'danger' : summary.terminalCount > 0 ? 'ready' : summary.activeCount > 0 ? 'warning' : 'idle'

  return [
    {
      key: 'task-intake',
      stage: 'A1',
      title: '任务入口',
      status: taskCount ? `${summary.scanBoundCount}/${taskCount} 绑定扫描` : '等待任务',
      description: taskCount
        ? `Agent 任务应绑定扫描、对话或明确描述；当前扫描绑定率 ${sourceCoverage}%，对话绑定率 ${conversationCoverage}%。`
        : '创建架构审查、风险扫描或变更影响任务后，才会形成可治理 Agent 工作单。',
      tone: intakeTone,
      icon: <RobotOutlined />,
    },
    {
      key: 'execution-control',
      stage: 'A2',
      title: '执行控制',
      status: `${summary.activeCount} 活跃 · ${summary.highPriorityCount} 高优先级`,
      description: summary.failedCount > 0
        ? '存在失败 Agent 任务，必须先复核步骤、错误和上下文，再决定是否重建任务。'
        : summary.activeCount > 0
          ? '排队或运行中的任务只能通过显式启动、受控取消和动作门禁推进。'
          : '当前没有活跃 Agent 任务，后续应从终态复盘或新建任务进入。',
      tone: controlTone,
      icon: summary.activeCount > 0 ? <SyncOutlined spin /> : <PlayCircleOutlined />,
    },
    {
      key: 'tool-evidence',
      stage: 'A3',
      title: '工具证据',
      status: selectedTask ? `${selectedStepCount} 步骤 · ${selectedToolStepCount} 工具` : '未选择任务',
      description: selectedTask
        ? selectedStepCount > 0
          ? '选中任务已有步骤或工具调用证据，但 raw payload 默认隐藏，必须通过授权审计链路复核。'
          : '选中任务缺少步骤证据，不能直接作为 Agent 分析结论。'
        : '选择一条 Agent 任务后，才能判断步骤、工具、对话和产物入口是否足够。',
      tone: evidenceTone,
      icon: <SafetyCertificateOutlined />,
    },
    {
      key: 'review-handoff',
      stage: 'A4',
      title: '复盘交接',
      status: `${summary.terminalCount} 终态 · ${summary.failedCount} 失败`,
      description: selectedTask
        ? selectedHasReviewOutput
          ? '选中任务已有摘要或输出入口，可进入报告、修复候选或对话复盘；仍不能宣称模型判断正确。'
          : '选中任务缺少摘要或输出入口，必须先补齐复盘证据。'
        : summary.terminalCount > 0
          ? '终态任务只开放对话、扫描报告、步骤和产物复盘，不代表业务结论已正确。'
          : '尚未形成终态任务，不能进行复盘交接或质量宣称。',
      tone: handoffTone,
      icon: <MessageOutlined />,
    },
  ]
}

function buildAgentTaskActionGate(task: AgentTask): AgentTaskActionGate {
  const hasConversation = Boolean(task.conversationId)
  const hasScan = Boolean(task.scanTaskId)
  const hasReviewOutput = Boolean(task.outputJson || task.summary)
  const isPending = task.status === 'PENDING'
  const isRunning = task.status === 'RUNNING'
  const isTerminal = TERMINAL_STATUSES.includes(task.status)

  if (isPending) {
    return {
      status: 'READY',
      tone: 'warning',
      summary: '启动门禁开放，取消门禁关闭',
      reason: '任务仍处于 PENDING，可由用户显式启动；取消只对 RUNNING 任务开放，避免把未执行任务误标成中断。',
      checks: [
        { label: '启动', value: '可执行', tone: 'ready' },
        { label: '取消', value: '未运行不可取消', tone: 'idle' },
        { label: '扫描报告', value: hasScan ? `已绑定 #${task.scanTaskId}` : '未绑定', tone: hasScan ? 'ready' : 'warning' },
        { label: '对话', value: hasConversation ? '可打开' : '未关联', tone: hasConversation ? 'ready' : 'warning' },
      ],
    }
  }

  if (isRunning) {
    return {
      status: 'REVIEW',
      tone: 'warning',
      summary: '取消门禁开放，启动门禁关闭',
      reason: '任务正在运行，只允许进入受控取消；再次启动会破坏状态机幂等性，必须保持关闭。',
      checks: [
        { label: '启动', value: '运行中不可重复启动', tone: 'idle' },
        { label: '取消', value: '可在检查点停止', tone: 'ready' },
        { label: '扫描报告', value: hasScan ? `已绑定 #${task.scanTaskId}` : '未绑定', tone: hasScan ? 'ready' : 'warning' },
        { label: '对话', value: hasConversation ? '可打开' : '未关联', tone: hasConversation ? 'ready' : 'warning' },
      ],
    }
  }

  if (isTerminal) {
    return {
      status: hasReviewOutput ? 'REVIEW' : 'BLOCKED',
      tone: hasReviewOutput ? 'ready' : 'danger',
      summary: hasReviewOutput ? '状态变更门禁关闭，复盘入口开放' : '终态缺少复盘输出',
      reason: hasReviewOutput
        ? '任务已进入终态，不允许再次启动或取消；后续只能查看对话、扫描报告、步骤和产物证据。'
        : '任务已进入终态但缺少摘要或输出，不能直接作为复盘证据，需要检查步骤和错误记录。',
      checks: [
        { label: '启动/取消', value: '终态关闭', tone: 'idle' },
        { label: '对话', value: hasConversation ? '可复盘' : '未关联', tone: hasConversation ? 'ready' : 'warning' },
        { label: '扫描报告', value: hasScan ? `可回跳 #${task.scanTaskId}` : '未绑定', tone: hasScan ? 'ready' : 'warning' },
        { label: '复盘输出', value: hasReviewOutput ? '有摘要或输出' : '缺失', tone: hasReviewOutput ? 'ready' : 'danger' },
      ],
    }
  }

  return {
    status: 'BLOCKED',
    tone: 'danger',
    summary: '未知状态，动作门禁关闭',
    reason: `任务状态 ${task.status} 不在已知状态机内，不能执行启动或取消。`,
    checks: [
      { label: '启动', value: '关闭', tone: 'danger' },
      { label: '取消', value: '关闭', tone: 'danger' },
      { label: '状态', value: task.status, tone: 'danger' },
      { label: '复核', value: '需要后端状态排查', tone: 'warning' },
    ],
  }
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
