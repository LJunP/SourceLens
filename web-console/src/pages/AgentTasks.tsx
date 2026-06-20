import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Tag, Typography, Button, Space, Select, Descriptions, Tabs,
  Timeline, Empty, Spin, Tooltip, Badge, Modal, Form, Input, message
} from 'antd'
import {
  RobotOutlined, PlayCircleOutlined, StopOutlined, PlusOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  SyncOutlined, MessageOutlined
} from '@ant-design/icons'
import { agentTaskApi, AgentTask, AgentTaskStep } from '../api/agentTask'

const { Title, Text } = Typography

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

const STEP_STATUS_MAP: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: 'default', icon: <ClockCircleOutlined /> },
  RUNNING: { color: 'processing', icon: <SyncOutlined spin /> },
  COMPLETED: { color: 'success', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'error', icon: <CloseCircleOutlined /> },
  SKIPPED: { color: 'warning', icon: <StopOutlined /> },
}

interface Props {
  projectId: number
}

export default function AgentTasks({ projectId }: Props) {
  const navigate = useNavigate()
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

  const fetchTasks = () => {
    setLoading(true)
    agentTaskApi.listByProject(projectId, page, 20, statusFilter)
      .then(res => {
        setTasks(res.data.data.items || [])
        setTotal(res.data.data.total)
      })
      .catch(() => message.error('加载任务失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [projectId, page, statusFilter])

  const fetchSteps = (taskId: number) => {
    setStepsLoading(true)
    agentTaskApi.listSteps(taskId)
      .then(res => setSteps(res.data.data || []))
      .catch(() => message.error('加载步骤失败'))
      .finally(() => setStepsLoading(false))
  }

  const handleSelectTask = (task: AgentTask) => {
    setSelectedTask(task)
    fetchSteps(task.id)
  }

  const handleStart = async (taskId: number) => {
    try {
      await agentTaskApi.start(taskId)
      message.success('任务已启动')
      fetchTasks()
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: 'RUNNING', startedAt: new Date().toISOString() })
      }
    } catch { message.error('启动失败') }
  }

  const handleCancel = async (taskId: number) => {
    try {
      await agentTaskApi.cancel(taskId)
      message.success('任务已取消')
      fetchTasks()
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: 'CANCELLED', finishedAt: new Date().toISOString() })
      }
    } catch { message.error('取消失败') }
  }

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      setCreateSubmitting(true)
      await agentTaskApi.create({
        projectId,
        taskType: values.taskType,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority || 'MEDIUM',
      })
      message.success('任务已创建')
      setCreateModalOpen(false)
      createForm.resetFields()
      fetchTasks()
    } catch { /* validation error */ }
    finally { setCreateSubmitting(false) }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

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
          {record.status === 'PENDING' && (
            <Tooltip title="启动"><Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStart(record.id)} /></Tooltip>
          )}
          {record.status === 'RUNNING' && (
            <Tooltip title="取消"><Button size="small" danger icon={<StopOutlined />} onClick={() => handleCancel(record.id)} /></Tooltip>
          )}
          <Tooltip title="详情"><Button size="small" onClick={() => handleSelectTask(record)}>详情</Button></Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <RobotOutlined style={{ fontSize: 20 }} />
          <Title level={4} style={{ margin: 0 }}>Agent 任务</Title>
        </Space>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            createForm.resetFields()
            createForm.setFieldsValue({ taskType: 'ARCHITECTURE_REVIEW', priority: 'MEDIUM' })
            setCreateModalOpen(true)
          }}>创建任务</Button>
          <Select
            allowClear
            placeholder="筛选状态"
            style={{ width: 130 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.keys(TASK_STATUS_MAP).map(s => ({ label: s, value: s }))}
          />
        </Space>
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
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="任务描述 (可选)" />
          </Form.Item>
        </Form>
      </Modal>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧任务列表 */}
        <div style={{ flex: selectedTask ? '1 1 50%' : '1 1 100%', minWidth: 0 }}>
          <Table
            dataSource={tasks}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              total,
              pageSize: 20,
              showTotal: (t) => `共 ${t} 个任务`,
              onChange: setPage,
            }}
            size="middle"
            onRow={(record) => ({
              onClick: () => handleSelectTask(record),
              style: { cursor: 'pointer', background: selectedTask?.id === record.id ? '#e6f7ff' : undefined },
            })}
          />
        </div>

        {/* 右侧任务详情 */}
        {selectedTask && (
          <div style={{ flex: '1 1 50%', minWidth: 400 }}>
            <Card
              title={
                <Space>
                  <Tag color={TASK_STATUS_MAP[selectedTask.status]?.color}>{selectedTask.status}</Tag>
                  <span>{selectedTask.title}</span>
                </Space>
              }
              extra={
                <Space>
                  {selectedTask.conversationId && (
                    <Button size="small" type="primary" onClick={() => navigate(`/agent-chat/${selectedTask.conversationId}`)}>打开对话</Button>
                  )}
                  <Button size="small" onClick={() => setSelectedTask(null)}>关闭</Button>
                </Space>
              }
            >
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
                        {selectedTask.scanTaskId || '无'}
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
                  children: stepsLoading ? (
                    <Spin style={{ display: 'block', margin: '40px auto' }} />
                  ) : steps.length === 0 ? (
                    <Empty description="暂无执行步骤" />
                  ) : (
                    <Timeline
                      items={steps.map(step => {
                        const cfg = STEP_STATUS_MAP[step.status] || { color: 'gray', icon: null }
                        return {
                          dot: cfg.icon,
                          color: cfg.color === 'success' ? 'green' : cfg.color === 'error' ? 'red' : cfg.color === 'processing' ? 'blue' : 'gray',
                          children: (
                            <div>
                              <Space>
                                <Tag>#{step.stepOrder}</Tag>
                                <Tag color={step.stepType === 'TOOL_CALL' ? 'blue' : step.stepType === 'ANALYSIS' ? 'purple' : step.stepType === 'DECISION' ? 'orange' : 'green'}>
                                  {step.stepType}
                                </Tag>
                                {step.toolName && <Tag>{step.toolName}</Tag>}
                                <Badge status={cfg.color as any} text={step.status} />
                                {step.durationMs != null && <Text type="secondary">{formatDuration(step.durationMs)}</Text>}
                              </Space>
                              {step.description && (
                                <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
                                  {step.description}
                                </div>
                              )}
                              {step.outputJson && (
                                <pre style={{ margin: '4px 0', fontSize: 11, maxHeight: 100, overflow: 'auto', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                                  {(() => { try { return JSON.stringify(JSON.parse(step.outputJson), null, 2) } catch { return step.outputJson } })()}
                                </pre>
                              )}
                              {step.errorMessage && (
                                <Text type="danger" style={{ fontSize: 12 }}>{step.errorMessage}</Text>
                              )}
                            </div>
                          ),
                        }
                      })}
                    />
                  ),
                },
              ]} />
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}