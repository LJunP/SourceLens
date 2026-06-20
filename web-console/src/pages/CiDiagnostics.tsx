import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Tag, Typography, Button, Space, Input, Form, Select, Descriptions,
  Tabs, Empty, Spin, message, Modal, Badge, Tooltip
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, CheckCircleOutlined,
  ClockCircleOutlined, SyncOutlined, CloseCircleOutlined, BugOutlined
} from '@ant-design/icons'
import { ciApi, CiDiagnostic } from '../api/ciDiagnostic'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const STATUS_MAP: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: 'default', icon: <ClockCircleOutlined /> },
  ANALYZING: { color: 'processing', icon: <SyncOutlined spin /> },
  COMPLETED: { color: 'success', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'error', icon: <CloseCircleOutlined /> },
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  COMPILE: { label: '编译错误', color: 'red' },
  TEST: { label: '测试失败', color: 'orange' },
  DEPENDENCY: { label: '依赖问题', color: 'volcano' },
  LINT: { label: 'Lint 失败', color: 'purple' },
  DOCKER: { label: 'Docker 构建', color: 'blue' },
  ENV: { label: '环境配置', color: 'cyan' },
  UNKNOWN: { label: '未知', color: 'default' },
}

const parseJsonList = (json: string | null): string[] => {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [json] }
}

interface Props {
  projectId: number
}

export default function CiDiagnostics({ projectId }: Props) {
  const [items, setItems] = useState<CiDiagnostic[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<CiDiagnostic | null>(null)
  const [form] = Form.useForm()

  const fetchItems = useCallback(() => {
    setLoading(true)
    ciApi.listByProject(projectId, page, 20, statusFilter)
      .then(res => {
        setItems(res.data.data.items || [])
        setTotal(res.data.data.total)
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false))
  }, [projectId, page, statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setCreating(true)
      await ciApi.create({ ...values, projectId, conclusion: values.conclusion || 'failure' })
      message.success('CI 诊断已创建, 正在分析...')
      setShowCreate(false)
      form.resetFields()
      fetchItems()
    } catch { /* validation */ }
    finally { setCreating(false) }
  }

  const handleReanalyze = async (id: number) => {
    try {
      await ciApi.reanalyze(id)
      message.success('重新分析已触发')
      fetchItems()
    } catch { message.error('重新分析失败') }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    {
      title: '工作流', dataIndex: 'workflowName', key: 'workflowName', ellipsis: true,
      render: (name: string, record: CiDiagnostic) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => setSelected(record)}>
          {name || `#${record.runNumber || record.id}`}
        </Button>
      ),
    },
    {
      title: '分支', dataIndex: 'branch', key: 'branch', width: 120,
      render: (b: string) => b ? <Tag>{b}</Tag> : '-',
    },
    {
      title: '结论', dataIndex: 'conclusion', key: 'conclusion', width: 90,
      render: (c: string) => c === 'failure'
        ? <Tag color="error">失败</Tag>
        : c === 'success' ? <Tag color="success">成功</Tag> : <Tag>{c || '-'}</Tag>,
    },
    {
      title: '错误分类', dataIndex: 'errorCategory', key: 'errorCategory', width: 100,
      render: (cat: string) => {
        const cfg = CATEGORY_MAP[cat] || { label: cat || '-', color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const cfg = STATUS_MAP[s] || { color: 'default', icon: null }
        return <Badge status={cfg.color as any} text={s} />
      },
    },
    {
      title: '提交', dataIndex: 'commitSha', key: 'commitSha', width: 80,
      render: (s: string) => s ? <Text code style={{ fontSize: 11 }}>{s.substring(0, 7)}</Text> : '-',
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, record: CiDiagnostic) => (
        <Tooltip title="重新分析">
          <Button size="small" icon={<ReloadOutlined />} onClick={() => handleReanalyze(record.id)} />
        </Tooltip>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <BugOutlined style={{ fontSize: 20 }} />
          <Title level={4} style={{ margin: 0 }}>CI 诊断</Title>
        </Space>
        <Space>
          <Select allowClear placeholder="筛选状态" style={{ width: 130 }}
            value={statusFilter} onChange={setStatusFilter}
            options={Object.keys(STATUS_MAP).map(s => ({ label: s, value: s }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
            新建诊断
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: selected ? '1 1 45%' : '1 1 100%', minWidth: 0 }}>
          <Table dataSource={items} columns={columns} rowKey="id" loading={loading} size="middle"
            pagination={{
              current: page, total, pageSize: 20, showTotal: t => `共 ${t} 条`,
              onChange: setPage,
            }}
            onRow={(record) => ({
              onClick: () => setSelected(record),
              style: { cursor: 'pointer', background: selected?.id === record.id ? '#e6f7ff' : undefined },
            })}
          />
        </div>

        {selected && (
          <div style={{ flex: '1 1 55%', minWidth: 420 }}>
            <Card
              title={<Space><Tag color={STATUS_MAP[selected.status]?.color}>{selected.status}</Tag><span>{selected.workflowName || `#${selected.runNumber || selected.id}`}</span></Space>}
              extra={<Button size="small" onClick={() => setSelected(null)}>关闭</Button>}
            >
              <Tabs defaultActiveKey="diagnosis" items={[
                {
                  key: 'diagnosis',
                  label: '诊断结果',
                  children: selected.status === 'COMPLETED' ? (
                    <>
                      {selected.errorCategory && (
                        <div style={{ marginBottom: 16 }}>
                          <Space>
                            <Text strong>错误分类:</Text>
                            <Tag color={CATEGORY_MAP[selected.errorCategory]?.color || 'default'}>
                              {CATEGORY_MAP[selected.errorCategory]?.label || selected.errorCategory}
                            </Tag>
                          </Space>
                        </div>
                      )}
                      {selected.failureSummary && (
                        <Card title="失败摘要" size="small" style={{ marginBottom: 12 }}>
                          <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selected.failureSummary}</Paragraph>
                        </Card>
                      )}
                      {selected.rootCause && (
                        <Card title="根因分析" size="small" style={{ marginBottom: 12 }}>
                          <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selected.rootCause}</Paragraph>
                        </Card>
                      )}
                      {selected.relatedFiles && (
                        <Card title="相关文件" size="small" style={{ marginBottom: 12 }}>
                          {parseJsonList(selected.relatedFiles).map((f, i) => (
                            <div key={i} style={{ marginBottom: 4 }}><Tag>{f}</Tag></div>
                          ))}
                        </Card>
                      )}
                      {selected.fixSuggestions && (
                        <Card title="修复建议" size="small" style={{ marginBottom: 12 }}>
                          {parseJsonList(selected.fixSuggestions).map((s, i) => (
                            <div key={i} style={{ marginBottom: 8, paddingLeft: 12, borderLeft: '3px solid #1890ff' }}>{s}</div>
                          ))}
                        </Card>
                      )}
                      <Descriptions column={2} bordered size="small">
                        <Descriptions.Item label="分支">{selected.branch || '-'}</Descriptions.Item>
                        <Descriptions.Item label="提交">
                          {selected.commitSha ? <Text code>{selected.commitSha.substring(0, 7)}</Text> : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="提交信息" span={2}>{selected.commitMessage || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Provider">{selected.provider}</Descriptions.Item>
                        <Descriptions.Item label="Run #">{selected.runNumber || '-'}</Descriptions.Item>
                      </Descriptions>
                    </>
                  ) : selected.status === 'ANALYZING' ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}><Text type="secondary">正在分析 CI 日志...</Text></div>
                    </div>
                  ) : selected.status === 'FAILED' ? (
                    <Empty description={<Text type="danger">{selected.errorMessage || '分析失败'}</Text>} />
                  ) : (
                    <Empty description="等待分析" />
                  ),
                },
                {
                  key: 'log',
                  label: '原始日志',
                  children: selected.rawLogSnippet ? (
                    <pre style={{
                      background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8,
                      fontSize: 12, lineHeight: 1.5, maxHeight: 500, overflow: 'auto', whiteSpace: 'pre-wrap',
                    }}>
                      {selected.rawLogSnippet}
                    </pre>
                  ) : (
                    <Empty description="无日志数据" />
                  ),
                },
              ]} />
            </Card>
          </div>
        )}
      </div>

      <Modal
        title="新建 CI 诊断"
        open={showCreate}
        onCancel={() => { setShowCreate(false); form.resetFields() }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="提交诊断"
        width={640}
      >
        <Form form={form} layout="vertical" initialValues={{ provider: 'GITHUB_ACTIONS', conclusion: 'failure' }}>
          <Form.Item name="workflowName" label="工作流名称">
            <Input placeholder="例如: CI Build, Deploy Pipeline" />
          </Form.Item>
          <Form.Item name="rawLogSnippet" label="失败日志片段">
            <TextArea rows={6} placeholder="粘贴 CI 失败的日志片段(可选, 有日志可更精准诊断)" />
          </Form.Item>
          <Space>
            <Form.Item name="provider" label="CI 平台">
              <Select style={{ width: 160 }} options={[
                { label: 'GitHub Actions', value: 'GITHUB_ACTIONS' },
                { label: 'GitLab CI', value: 'GITLAB_CI' },
                { label: 'Jenkins', value: 'JENKINS' },
              ]} />
            </Form.Item>
            <Form.Item name="conclusion" label="结论">
              <Select style={{ width: 120 }} options={[
                { label: 'failure', value: 'failure' },
                { label: 'success', value: 'success' },
                { label: 'cancelled', value: 'cancelled' },
                { label: 'timed_out', value: 'timed_out' },
              ]} />
            </Form.Item>
          </Space>
          <Space>
            <Form.Item name="branch" label="分支">
              <Input placeholder="例如: main, feature/xxx" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="commitSha" label="Commit SHA">
              <Input placeholder="例如: abc1234" style={{ width: 180 }} />
            </Form.Item>
          </Space>
          <Form.Item name="commitMessage" label="提交信息">
            <Input placeholder="commit message" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}