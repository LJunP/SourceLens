import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Tag, Typography, Button, Space, Input, Form, Select, Descriptions,
  Tabs, Empty, Spin, message, Modal, Badge, Tooltip
} from 'antd'
import {
  PlusOutlined, ExportOutlined, CheckCircleOutlined,
  ClockCircleOutlined, SyncOutlined, CloseCircleOutlined, FileTextOutlined
} from '@ant-design/icons'
import { issueApi, IssueDecomposition, IssueTask } from '../api/issueDecomposition'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const STATUS_MAP: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: 'default', icon: <ClockCircleOutlined /> },
  PROCESSING: { color: 'processing', icon: <SyncOutlined spin /> },
  COMPLETED: { color: 'success', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'error', icon: <CloseCircleOutlined /> },
}

const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: 'default',
  IN_PROGRESS: 'processing',
  DONE: 'success',
  SKIPPED: 'warning',
}

const RISK_COLORS: Record<string, string> = {
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'blue',
}

interface Props {
  projectId: number
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
  const [form] = Form.useForm()

  const fetchItems = useCallback(() => {
    setLoading(true)
    issueApi.listByProject(projectId, page, 20, statusFilter)
      .then(res => {
        setItems(res.data.data.items || [])
        setTotal(res.data.data.total)
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false))
  }, [projectId, page, statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const fetchTasks = (id: number) => {
    setTasksLoading(true)
    issueApi.listTasks(id)
      .then(res => setTasks(res.data.data || []))
      .catch(() => message.error('加载子任务失败'))
      .finally(() => setTasksLoading(false))
  }

  const handleSelect = (item: IssueDecomposition) => {
    setSelected(item)
    if (item.status === 'COMPLETED') fetchTasks(item.id)
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setCreating(true)
      await issueApi.create({ ...values, projectId })
      message.success('需求拆解已创建, 正在处理中...')
      setShowCreate(false)
      form.resetFields()
      fetchItems()
    } catch { /* validation */ }
    finally { setCreating(false) }
  }

  const handleExport = async (id: number) => {
    try {
      const res = await issueApi.exportMarkdown(id)
      const md = res.data.data
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `issue-decomposition-${id}.md`
      a.click()
      URL.revokeObjectURL(url)
      message.success('Markdown 导出成功')
    } catch { message.error('导出失败') }
  }

  const handleCopyMarkdown = async (id: number) => {
    try {
      const res = await issueApi.exportMarkdown(id)
      await navigator.clipboard.writeText(res.data.data)
      message.success('已复制到剪贴板')
    } catch { message.error('复制失败') }
  }

  const parseJsonList = (json: string | null): string[] => {
    if (!json) return []
    try { return JSON.parse(json) } catch { return [json] }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '标题', dataIndex: 'title', key: 'title', ellipsis: true,
      render: (title: string, record: IssueDecomposition) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => handleSelect(record)}>{title}</Button>
      ),
    },
    {
      title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (p: string) => <Tag color={RISK_COLORS[p]}>{p}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 110,
      render: (s: string) => {
        const cfg = STATUS_MAP[s] || { color: 'default', icon: null }
        return <Badge status={cfg.color as any} text={s} />
      },
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: unknown, record: IssueDecomposition) => (
        <Space size="small">
          {record.status === 'COMPLETED' && (
            <>
              <Tooltip title="复制 Markdown">
                <Button size="small" icon={<FileTextOutlined />} onClick={() => handleCopyMarkdown(record.id)} />
              </Tooltip>
              <Tooltip title="导出 .md 文件">
                <Button size="small" icon={<ExportOutlined />} onClick={() => handleExport(record.id)} />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <FileTextOutlined style={{ fontSize: 20 }} />
          <Title level={4} style={{ margin: 0 }}>Issue 需求拆解</Title>
        </Space>
        <Space>
          <Select
            allowClear placeholder="筛选状态" style={{ width: 130 }}
            value={statusFilter} onChange={setStatusFilter}
            options={Object.keys(STATUS_MAP).map(s => ({ label: s, value: s }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
            新建需求拆解
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: selected ? '1 1 45%' : '1 1 100%', minWidth: 0 }}>
          <Table
            dataSource={items} columns={columns} rowKey="id" loading={loading} size="middle"
            pagination={{
              current: page, total, pageSize: 20, showTotal: t => `共 ${t} 条`,
              onChange: setPage,
            }}
            onRow={(record) => ({
              onClick: () => handleSelect(record),
              style: { cursor: 'pointer', background: selected?.id === record.id ? '#e6f7ff' : undefined },
            })}
          />
        </div>

        {selected && (
          <div style={{ flex: '1 1 55%', minWidth: 420 }}>
            <Card
              title={<Space><Tag color={STATUS_MAP[selected.status]?.color}>{selected.status}</Tag><span>{selected.title}</span></Space>}
              extra={<Button size="small" onClick={() => setSelected(null)}>关闭</Button>}
            >
              <Tabs defaultActiveKey="result" items={[
                {
                  key: 'result',
                  label: '拆解结果',
                  children: selected.status === 'COMPLETED' ? (
                    <>
                      {selected.understanding && (
                        <Card title="需求理解" size="small" style={{ marginBottom: 12 }}>
                          <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selected.understanding}</Paragraph>
                        </Card>
                      )}
                      <Descriptions column={2} bordered size="small" style={{ marginBottom: 12 }}>
                        <Descriptions.Item label="影响模块">{selected.impactModules || '-'}</Descriptions.Item>
                        <Descriptions.Item label="影响数据库">{selected.impactDb || '-'}</Descriptions.Item>
                        <Descriptions.Item label="影响 API" span={2}>{selected.impactApis || '-'}</Descriptions.Item>
                        <Descriptions.Item label="建议分支" span={2}>
                          <Text code>{selected.suggestedBranch || '-'}</Text>
                        </Descriptions.Item>
                      </Descriptions>
                      {selected.risks && (
                        <Card title="风险点" size="small" style={{ marginBottom: 12 }}>
                          {parseJsonList(selected.risks).map((r, i) => <div key={i} style={{ marginBottom: 4 }}>{r}</div>)}
                        </Card>
                      )}
                      {selected.dependencies && (
                        <Card title="依赖事项" size="small" style={{ marginBottom: 12 }}>
                          {parseJsonList(selected.dependencies).map((d, i) => <div key={i} style={{ marginBottom: 4 }}>{d}</div>)}
                        </Card>
                      )}
                      {selected.acceptance && (
                        <Card title="验收标准" size="small" style={{ marginBottom: 12 }}>
                          {parseJsonList(selected.acceptance).map((a, i) => <div key={i} style={{ marginBottom: 4 }}><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />{a}</div>)}
                        </Card>
                      )}
                      {selected.suggestedCommit && (
                        <Card title="建议 Commit 粒度" size="small">
                          <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selected.suggestedCommit}</Paragraph>
                        </Card>
                      )}
                    </>
                  ) : selected.status === 'PROCESSING' ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}><Text type="secondary">正在分析需求并生成拆解方案...</Text></div>
                    </div>
                  ) : selected.status === 'FAILED' ? (
                    <Empty description={<Text type="danger">{selected.errorMessage || '拆解失败'}</Text>} />
                  ) : (
                    <Empty description="等待处理" />
                  ),
                },
                {
                  key: 'tasks',
                  label: `子任务 (${tasks.length})`,
                  children: tasksLoading ? (
                    <Spin style={{ display: 'block', margin: '40px auto' }} />
                  ) : tasks.length === 0 ? (
                    <Empty description="暂无子任务" />
                  ) : (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <Space>
                          <Text type="secondary">开发:</Text>{' '}
                          {tasks.filter(t => t.category === 'DEVELOP').length} 个 |{' '}
                          <Text type="secondary">测试:</Text>{' '}
                          {tasks.filter(t => t.category === 'TEST').length} 个 |{' '}
                          <Text type="secondary">预估工时:</Text>{' '}
                          {tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0).toFixed(1)}h
                        </Space>
                      </div>
                      <Table
                        dataSource={tasks}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        columns={[
                          { title: '#', dataIndex: 'taskOrder', key: 'taskOrder', width: 40 },
                          {
                            title: '类型', dataIndex: 'category', key: 'category', width: 70,
                            render: (c: string) => <Tag color={c === 'DEVELOP' ? 'blue' : 'green'}>{c === 'DEVELOP' ? '开发' : '测试'}</Tag>,
                          },
                          { title: '任务', dataIndex: 'title', key: 'title' },
                          {
                            title: '风险', dataIndex: 'riskLevel', key: 'riskLevel', width: 70,
                            render: (r: string) => <Tag color={RISK_COLORS[r] || 'default'}>{r}</Tag>,
                          },
                          {
                            title: '工时', dataIndex: 'estimatedHours', key: 'estimatedHours', width: 60,
                            render: (h: number) => h ? `${h}h` : '-',
                          },
                          {
                            title: '状态', dataIndex: 'status', key: 'status', width: 90,
                            render: (s: string) => <Tag color={TASK_STATUS_COLORS[s]}>{s}</Tag>,
                          },
                        ]}
                      />
                    </>
                  ),
                },
                {
                  key: 'markdown',
                  label: 'Markdown',
                  children: selected.status === 'COMPLETED' ? (
                    <div>
                      <Space style={{ marginBottom: 12 }}>
                        <Button size="small" icon={<FileTextOutlined />} onClick={() => handleCopyMarkdown(selected.id)}>复制</Button>
                        <Button size="small" icon={<ExportOutlined />} onClick={() => handleExport(selected.id)}>导出 .md</Button>
                      </Space>
                      <pre style={{
                        background: '#f5f5f5', padding: 16, borderRadius: 8,
                        fontSize: 12, lineHeight: 1.6, maxHeight: 500, overflow: 'auto', whiteSpace: 'pre-wrap',
                      }}>
                        {selected.outputJson ? JSON.stringify(JSON.parse(selected.outputJson), null, 2) : '无数据'}
                      </pre>
                    </div>
                  ) : (
                    <Empty description="拆解完成后可预览 Markdown" />
                  ),
                },
              ]} />
            </Card>
          </div>
        )}
      </div>

      <Modal
        title="新建需求拆解"
        open={showCreate}
        onCancel={() => { setShowCreate(false); form.resetFields() }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="提交拆解"
        width={640}
      >
        <Form form={form} layout="vertical" initialValues={{ priority: 'MEDIUM' }}>
          <Form.Item name="title" label="需求标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="例如: 支持用户头像上传" />
          </Form.Item>
          <Form.Item name="description" label="需求描述" rules={[{ required: true, message: '请输入描述' }]}>
            <TextArea rows={4} placeholder="详细描述需求的功能点、交互流程、技术要求..." />
          </Form.Item>
          <Form.Item name="businessContext" label="业务背景">
            <TextArea rows={2} placeholder="为什么要做这个需求, 业务价值是什么(选填)" />
          </Form.Item>
          <Space>
            <Form.Item name="priority" label="优先级">
              <Select style={{ width: 120 }} options={[
                { label: 'HIGH', value: 'HIGH' },
                { label: 'MEDIUM', value: 'MEDIUM' },
                { label: 'LOW', value: 'LOW' },
              ]} />
            </Form.Item>
            <Form.Item name="relatedModules" label="关联模块">
              <Input placeholder="逗号分隔, 如: user, project" style={{ width: 240 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}