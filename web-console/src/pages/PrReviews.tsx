import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Tag, Typography, Button, Space, Input, Form, Select, Descriptions,
  Tabs, Empty, Spin, message, Modal, Badge, Tooltip, List
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, CheckCircleOutlined,
  ClockCircleOutlined, SyncOutlined, CloseCircleOutlined, PullRequestOutlined
} from '@ant-design/icons'
import { prReviewApi, PrReview, PrReviewComment } from '../api/prReview'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const STATUS_MAP: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: 'default', icon: <ClockCircleOutlined /> },
  ANALYZING: { color: 'processing', icon: <SyncOutlined spin /> },
  COMPLETED: { color: 'success', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'error', icon: <CloseCircleOutlined /> },
}

const RISK_MAP: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: '严重', color: 'red' },
  HIGH: { label: '高', color: 'orange' },
  MEDIUM: { label: '中', color: 'gold' },
  LOW: { label: '低', color: 'green' },
}

const MERGE_MAP: Record<string, { label: string; color: string }> = {
  MERGE: { label: '可合并', color: 'success' },
  CHANGES_REQUESTED: { label: '需修改', color: 'warning' },
  BLOCKED: { label: '阻止', color: 'error' },
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'red',
  ERROR: 'orange',
  WARNING: 'gold',
  INFO: 'blue',
}

const parseJsonList = (json: string | null): any[] => {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [] }
}

interface Props {
  projectId: number
}

export default function PrReviews({ projectId }: Props) {
  const [items, setItems] = useState<PrReview[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<PrReview | null>(null)
  const [comments, setComments] = useState<PrReviewComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [form] = Form.useForm()

  const fetchItems = useCallback(() => {
    setLoading(true)
    prReviewApi.listByProject(projectId, page, 20, statusFilter)
      .then(res => {
        setItems(res.data.data.items || [])
        setTotal(res.data.data.total)
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false))
  }, [projectId, page, statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const fetchComments = (id: number) => {
    setCommentsLoading(true)
    prReviewApi.listComments(id)
      .then(res => setComments(res.data.data || []))
      .catch(() => message.error('加载评论失败'))
      .finally(() => setCommentsLoading(false))
  }

  const handleSelect = (item: PrReview) => {
    setSelected(item)
    if (item.status === 'COMPLETED') fetchComments(item.id)
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setCreating(true)
      await prReviewApi.create({ ...values, projectId })
      message.success('PR 审查已创建, 正在分析...')
      setShowCreate(false)
      form.resetFields()
      fetchItems()
    } catch { /* validation */ }
    finally { setCreating(false) }
  }

  const handleReanalyze = async (id: number) => {
    try {
      await prReviewApi.reanalyze(id)
      message.success('重新分析已触发')
      fetchItems()
    } catch { message.error('重新分析失败') }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    {
      title: 'PR', key: 'pr', width: 200,
      render: (_: unknown, record: PrReview) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => handleSelect(record)}>
          {record.prTitle || `PR #${record.prNumber || record.id}`}
        </Button>
      ),
    },
    {
      title: '分支', key: 'branch', width: 150,
      render: (_: unknown, record: PrReview) => record.branch
        ? <Tag>{record.branch} → {record.baseBranch || 'main'}</Tag>
        : '-',
    },
    {
      title: '风险', dataIndex: 'riskLevel', key: 'riskLevel', width: 70,
      render: (r: string) => {
        const cfg = RISK_MAP[r] || { label: r || '-', color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '合并建议', dataIndex: 'mergeRecommendation', key: 'mergeRecommendation', width: 100,
      render: (m: string) => {
        const cfg = MERGE_MAP[m] || { label: m || '-', color: 'default' }
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
      title: '作者', dataIndex: 'author', key: 'author', width: 80,
      render: (a: string) => a || '-',
    },
    {
      title: '操作', key: 'action', width: 60,
      render: (_: unknown, record: PrReview) => (
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
          <PullRequestOutlined style={{ fontSize: 20 }} />
          <Title level={4} style={{ margin: 0 }}>PR 风险审查</Title>
        </Space>
        <Space>
          <Select allowClear placeholder="筛选状态" style={{ width: 130 }}
            value={statusFilter} onChange={setStatusFilter}
            options={Object.keys(STATUS_MAP).map(s => ({ label: s, value: s }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
            新建审查
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
              onClick: () => handleSelect(record),
              style: { cursor: 'pointer', background: selected?.id === record.id ? '#e6f7ff' : undefined },
            })}
          />
        </div>

        {selected && (
          <div style={{ flex: '1 1 55%', minWidth: 420 }}>
            <Card
              title={
                <Space>
                  <Tag color={STATUS_MAP[selected.status]?.color}>{selected.status}</Tag>
                  <span>{selected.prTitle || `PR #${selected.prNumber || selected.id}`}</span>
                  {selected.riskLevel && (
                    <Tag color={RISK_MAP[selected.riskLevel]?.color}>
                      风险: {RISK_MAP[selected.riskLevel]?.label}
                    </Tag>
                  )}
                  {selected.mergeRecommendation && (
                    <Tag color={MERGE_MAP[selected.mergeRecommendation]?.color}>
                      {MERGE_MAP[selected.mergeRecommendation]?.label}
                    </Tag>
                  )}
                </Space>
              }
              extra={<Button size="small" onClick={() => setSelected(null)}>关闭</Button>}
            >
              <Tabs defaultActiveKey="review" items={[
                {
                  key: 'review',
                  label: '审查结果',
                  children: selected.status === 'COMPLETED' ? (
                    <>
                      {selected.changeSummary && (
                        <Card title="变更摘要" size="small" style={{ marginBottom: 12 }}>
                          <Paragraph style={{ margin: 0 }}>{selected.changeSummary}</Paragraph>
                        </Card>
                      )}
                      {selected.impactScope && (
                        <Card title="影响范围" size="small" style={{ marginBottom: 12 }}>
                          {parseJsonList(selected.impactScope).map((scope: string, i: number) => (
                            <Tag key={i} style={{ marginBottom: 4 }}>{scope}</Tag>
                          ))}
                        </Card>
                      )}
                      {selected.risks && (
                        <Card title="风险点" size="small" style={{ marginBottom: 12 }}>
                          {parseJsonList(selected.risks).map((risk: any, i: number) => (
                            <div key={i} style={{ marginBottom: 8 }}>
                              <Space>
                                <Tag color={RISK_MAP[risk.severity]?.color || 'default'}>{risk.category}</Tag>
                                <Text>{risk.message}</Text>
                              </Space>
                            </div>
                          ))}
                        </Card>
                      )}
                      {selected.testSuggestions && (
                        <Card title="测试建议" size="small" style={{ marginBottom: 12 }}>
                          {parseJsonList(selected.testSuggestions).map((s: string, i: number) => (
                            <div key={i} style={{ marginBottom: 4, paddingLeft: 12, borderLeft: '3px solid #52c41a' }}>{s}</div>
                          ))}
                        </Card>
                      )}
                      <Descriptions column={2} bordered size="small">
                        <Descriptions.Item label="分支">
                          {selected.branch} → {selected.baseBranch || 'main'}
                        </Descriptions.Item>
                        <Descriptions.Item label="提交">
                          {selected.commitSha ? <Text code>{selected.commitSha.substring(0, 7)}</Text> : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="作者">{selected.author || '-'}</Descriptions.Item>
                        <Descriptions.Item label="CI 状态">
                          {selected.ciStatus === 'success'
                            ? <Tag color="success">通过</Tag>
                            : selected.ciStatus === 'failure'
                              ? <Tag color="error">失败</Tag>
                              : <Tag>{selected.ciStatus || '-'}</Tag>
                          }
                        </Descriptions.Item>
                      </Descriptions>
                    </>
                  ) : selected.status === 'ANALYZING' ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}><Text type="secondary">正在分析 PR 变更...</Text></div>
                    </div>
                  ) : selected.status === 'FAILED' ? (
                    <Empty description={<Text type="danger">{selected.errorMessage || '分析失败'}</Text>} />
                  ) : (
                    <Empty description="等待分析" />
                  ),
                },
                {
                  key: 'comments',
                  label: `行级评论 (${comments.length})`,
                  children: commentsLoading ? (
                    <Spin style={{ display: 'block', margin: '40px auto' }} />
                  ) : comments.length === 0 ? (
                    <Empty description="暂无行级评论" />
                  ) : (
                    <List
                      dataSource={comments}
                      renderItem={(comment: PrReviewComment) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Tag color={SEVERITY_COLORS[comment.severity]}>
                                {comment.severity}
                              </Tag>
                            }
                            title={
                              <Space>
                                <Tag>{comment.category}</Tag>
                                <Text code>{comment.filePath}{comment.lineNumber ? `:${comment.lineNumber}` : ''}</Text>
                              </Space>
                            }
                            description={
                              <>
                                <div style={{ marginBottom: 4 }}>{comment.message}</div>
                                {comment.suggestion && (
                                  <div style={{ color: '#52c41a', fontSize: 12 }}>建议: {comment.suggestion}</div>
                                )}
                              </>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ),
                },
                {
                  key: 'files',
                  label: '变更文件',
                  children: selected.changedFiles ? (
                    <div>
                      {parseJsonList(selected.changedFiles).map((file: string, i: number) => (
                        <Tag key={i} style={{ marginBottom: 4 }}>{file}</Tag>
                      ))}
                    </div>
                  ) : (
                    <Empty description="无变更文件信息" />
                  ),
                },
              ]} />
            </Card>
          </div>
        )}
      </div>

      <Modal
        title="新建 PR 审查"
        open={showCreate}
        onCancel={() => { setShowCreate(false); form.resetFields() }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="提交审查"
        width={640}
      >
        <Form form={form} layout="vertical" initialValues={{ baseBranch: 'main', ciStatus: 'pending' }}>
          <Space>
            <Form.Item name="prTitle" label="PR 标题" rules={[{ required: true, message: '请输入标题' }]} style={{ flex: 1 }}>
              <Input placeholder="PR 标题" style={{ width: 280 }} />
            </Form.Item>
            <Form.Item name="prNumber" label="PR 编号" style={{ width: 100 }}>
              <Input type="number" placeholder="#" />
            </Form.Item>
          </Space>
          <Form.Item name="prDescription" label="PR 描述">
            <TextArea rows={3} placeholder="PR 描述(可选)" />
          </Form.Item>
          <Space>
            <Form.Item name="branch" label="源分支">
              <Input placeholder="feature/xxx" style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="baseBranch" label="目标分支">
              <Input placeholder="main" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="ciStatus" label="CI 状态">
              <Select style={{ width: 120 }} options={[
                { label: 'pending', value: 'pending' },
                { label: 'success', value: 'success' },
                { label: 'failure', value: 'failure' },
              ]} />
            </Form.Item>
          </Space>
          <Space>
            <Form.Item name="commitSha" label="Commit SHA">
              <Input placeholder="abc1234" style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="author" label="作者">
              <Input placeholder="作者" style={{ width: 160 }} />
            </Form.Item>
          </Space>
          <Form.Item name="changedFiles" label="变更文件(逗号分隔)">
            <Input placeholder="src/main.java, src/test.java" />
          </Form.Item>
          <Form.Item name="diffSummary" label="Diff 摘要">
            <TextArea rows={4} placeholder="粘贴 diff 摘要(可选)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}