import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Button, Card, Descriptions, Empty, Form, Input, Modal, Select, Space,
  Spin, Table, Tag, Tooltip, Typography, message
} from 'antd'
import {
  ApiOutlined,
  BugOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileSearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { ciApi, CiDiagnostic } from '../api/ciDiagnostic'
import { showApiError } from '../api/client'

const { Text, Paragraph } = Typography
const { TextArea } = Input

const STATUS_MAP: Record<string, { label: string; color: string; tone: DiagnosticTone; icon: ReactNode }> = {
  PENDING: { label: '排队中', color: 'default', tone: 'idle', icon: <SyncOutlined /> },
  ANALYZING: { label: '分析中', color: 'processing', tone: 'warning', icon: <SyncOutlined spin /> },
  COMPLETED: { label: '已完成', color: 'success', tone: 'ready', icon: <CheckCircleOutlined /> },
  FAILED: { label: '分析失败', color: 'error', tone: 'danger', icon: <CloseCircleOutlined /> },
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

type DiagnosticTone = 'ready' | 'warning' | 'danger' | 'idle'

interface DiagnosticSignal {
  label: string
  tone: DiagnosticTone
  summary: string
  nextAction: string
  checks: Array<{
    label: string
    value: string
    tone: DiagnosticTone
  }>
}

interface Props {
  projectId: number
}

export default function CiDiagnostics({ projectId }: Props) {
  const navigate = useNavigate()
  const [items, setItems] = useState<CiDiagnostic[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<CiDiagnostic | null>(null)
  const [form] = Form.useForm()

  const fetchItems = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    ciApi.listByProject(projectId, page, 20, statusFilter)
      .then(res => {
        const data = res.data.data
        setItems(data.items || [])
        setTotal(data.total)
        setSelected(prev => {
          if (!prev) return prev
          return data.items?.find(item => item.id === prev.id) || prev
        })
      })
      .catch(error => showApiError(error, '加载 CI 诊断失败'))
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [page, projectId, statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const activeCount = useMemo(() => items.filter(item => item.status === 'PENDING' || item.status === 'ANALYZING').length, [items])
  const completedCount = useMemo(() => items.filter(item => item.status === 'COMPLETED').length, [items])
  const failedCount = useMemo(() => items.filter(item => item.status === 'FAILED').length, [items])
  const actionableCount = useMemo(() => items.filter(item => parseJsonList(item.fixSuggestions).length > 0).length, [items])
  const selectedSignal = selected ? buildDiagnosticSignal(selected) : null
  const selectedRelatedFiles = selected ? parseJsonList(selected.relatedFiles) : []
  const selectedFixSuggestions = selected ? parseJsonList(selected.fixSuggestions) : []
  const repairUrl = selected ? autoRepairCandidateUrl(selected, selectedRelatedFiles, selectedFixSuggestions) : null

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setCreating(true)
      await ciApi.create({ ...values, projectId, conclusion: values.conclusion || 'failure' })
      message.success('CI 诊断已创建，正在分析...')
      setShowCreate(false)
      form.resetFields()
      fetchItems(true)
    } catch (error: any) {
      if (error?.errorFields) return
      showApiError(error, '创建 CI 诊断失败')
    } finally {
      setCreating(false)
    }
  }

  const handleReanalyze = async (id: number) => {
    try {
      await ciApi.reanalyze(id)
      message.success('重新分析已触发')
      fetchItems(true)
    } catch (error) {
      showApiError(error, '重新分析失败')
    }
  }

  const columns = [
    {
      title: '工作流',
      dataIndex: 'workflowName',
      key: 'workflowName',
      ellipsis: true,
      render: (name: string, record: CiDiagnostic) => (
        <Button type="link" className="sl-ci-table-link" onClick={() => setSelected(record)}>
          {name || `#${record.runNumber || record.id}`}
        </Button>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const cfg = STATUS_MAP[status] || { label: status || '-', color: 'default', icon: null }
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
      },
    },
    {
      title: '分类',
      dataIndex: 'errorCategory',
      key: 'errorCategory',
      width: 120,
      render: (category: string) => {
        const cfg = CATEGORY_MAP[category] || { label: category || '-', color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '分支',
      dataIndex: 'branch',
      key: 'branch',
      width: 130,
      render: (branch: string) => branch ? <Tag>{branch}</Tag> : '-',
    },
    {
      title: '提交',
      dataIndex: 'commitSha',
      key: 'commitSha',
      width: 92,
      render: (sha: string) => sha ? <Text code>{sha.substring(0, 7)}</Text> : '-',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 92,
      render: (_: unknown, record: CiDiagnostic) => (
        <Tooltip title="重新分析">
          <Button size="small" icon={<ReloadOutlined />} onClick={(event) => { event.stopPropagation(); handleReanalyze(record.id) }} />
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="sl-ci-page">
      <div className="sl-ci-cockpit">
        <section className="sl-ci-cockpit-main">
          <span className="sl-kicker">CI Failure Intelligence</span>
          <h1 className="sl-ci-title">CI 诊断与修复入口</h1>
          <p className="sl-ci-desc">
            将失败日志、提交上下文和规则/模型分析结果沉淀成可审计诊断，并把明确的修复建议推进到自动修码流程。
          </p>
          <div className="sl-ci-status-line">
            <span className="sl-live-dot" />
            <span>{activeCount > 0 ? `${activeCount} 个诊断正在排队或分析` : '当前无运行中的 CI 诊断'}</span>
            <span>{actionableCount} 个诊断已有修复建议</span>
          </div>
          <div className="sl-ci-actions">
            <Select
              allowClear
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              options={Object.keys(STATUS_MAP).map(status => ({ label: STATUS_MAP[status].label, value: status }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchItems(true)}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
              新建诊断
            </Button>
          </div>
        </section>

        <section className="sl-ci-boundary-card">
          <div className="sl-ci-boundary-head">
            <SafetyCertificateOutlined />
            <div>
              <span>Diagnosis boundary</span>
              <strong>日志脱敏 / 建议可追踪</strong>
            </div>
          </div>
          <div className="sl-ci-boundary-list">
            <div><CheckCircleOutlined /> 失败日志入库前脱敏截断</div>
            <div><CheckCircleOutlined /> LLM 失败会回退规则引擎</div>
            <div><CheckCircleOutlined /> 修复建议需进入 AutoRepair 审核</div>
          </div>
        </section>
      </div>

      <div className="sl-ci-summary-grid">
        <CiStat icon={<SyncOutlined />} label="运行中" value={activeCount} tone={activeCount > 0 ? 'warning' : 'idle'} />
        <CiStat icon={<CheckCircleOutlined />} label="已完成" value={completedCount} tone="ready" />
        <CiStat icon={<CloseCircleOutlined />} label="失败任务" value={failedCount} tone={failedCount > 0 ? 'danger' : 'idle'} />
        <CiStat icon={<ToolOutlined />} label="可修复建议" value={actionableCount} tone={actionableCount > 0 ? 'ready' : 'idle'} />
      </div>

      <div className={`sl-ci-workbench ${selected ? 'sl-ci-workbench-with-detail' : ''}`}>
        <Card className="sl-section-card sl-ci-table-card" title={<span className="sl-card-title"><BugOutlined /> 诊断列表</span>}>
          <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="middle"
            pagination={{
              current: page,
              total,
              pageSize: 20,
              showTotal: count => `共 ${count} 条`,
              onChange: setPage,
            }}
            rowClassName={(record) => selected?.id === record.id ? 'sl-ci-row-selected' : ''}
            onRow={(record) => ({
              onClick: () => setSelected(record),
            })}
          />
        </Card>

        {selected && selectedSignal && (
          <Card
            className="sl-section-card sl-ci-detail-card"
            title={
              <span className="sl-card-title">
                <Tag color={STATUS_MAP[selected.status]?.color || 'default'}>{STATUS_MAP[selected.status]?.label || selected.status}</Tag>
                {selected.workflowName || `#${selected.runNumber || selected.id}`}
              </span>
            }
            extra={
              <Space>
                {repairUrl && (
                  <Button size="small" type="primary" icon={<ToolOutlined />} onClick={() => navigate(repairUrl)}>
                    生成修复候选
                  </Button>
                )}
                <Button size="small" onClick={() => setSelected(null)}>关闭</Button>
              </Space>
            }
          >
            <div className="sl-ci-detail-stack">
              <DiagnosticSignalCard signal={selectedSignal} />

              {selected.status === 'COMPLETED' ? (
                <>
                  <InfoBlock title="失败摘要" content={selected.failureSummary} />
                  <InfoBlock title="根因分析" content={selected.rootCause} />

                  <section className="sl-ci-section">
                    <div className="sl-ci-section-title">相关文件</div>
                    {selectedRelatedFiles.length > 0 ? (
                      <div className="sl-ci-chip-list">
                        {selectedRelatedFiles.map((file, index) => <Tag key={`${file}-${index}`}>{file}</Tag>)}
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未识别相关文件" />
                    )}
                  </section>

                  <section className="sl-ci-section">
                    <div className="sl-ci-section-title">修复建议</div>
                    {selectedFixSuggestions.length > 0 ? (
                      <div className="sl-ci-suggestion-list">
                        {selectedFixSuggestions.map((suggestion, index) => (
                          <div key={`${suggestion}-${index}`}>
                            <CheckCircleOutlined />
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无修复建议" />
                    )}
                  </section>

                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="分支">{selected.branch || '-'}</Descriptions.Item>
                    <Descriptions.Item label="提交">{selected.commitSha ? <Text code>{selected.commitSha.substring(0, 7)}</Text> : '-'}</Descriptions.Item>
                    <Descriptions.Item label="提交信息" span={2}>{selected.commitMessage || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Provider">{selected.provider || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Run #">{selected.runNumber || '-'}</Descriptions.Item>
                  </Descriptions>
                </>
              ) : selected.status === 'ANALYZING' ? (
                <div className="sl-ci-running">
                  <Spin size="large" />
                  <Text type="secondary">正在分析 CI 日志...</Text>
                </div>
              ) : selected.status === 'FAILED' ? (
                <Alert type="error" showIcon message="诊断失败" description={selected.errorMessage || '分析任务失败'} />
              ) : (
                <Empty description="等待分析" />
              )}

              <section className="sl-ci-section">
                <div className="sl-ci-section-title">原始日志片段</div>
                {selected.rawLogSnippet ? (
                  <pre className="sl-ci-log">{selected.rawLogSnippet}</pre>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无日志数据" />
                )}
              </section>
            </div>
          </Card>
        )}
      </div>

      <Modal
        title="新建 CI 诊断"
        open={showCreate}
        onCancel={() => { setShowCreate(false); form.resetFields() }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="提交诊断"
        width={680}
      >
        <Form form={form} layout="vertical" className="sl-ci-form" initialValues={{ provider: 'GITHUB_ACTIONS', conclusion: 'failure' }}>
          <Alert type="info" showIcon message="粘贴失败日志可以显著提升分类和修复建议质量" />
          <Form.Item name="workflowName" label="工作流名称">
            <Input placeholder="例如 CI Build, Deploy Pipeline" />
          </Form.Item>
          <Form.Item name="rawLogSnippet" label="失败日志片段">
            <TextArea rows={6} placeholder="粘贴 CI 失败日志片段" />
          </Form.Item>
          <div className="sl-ci-form-grid">
            <Form.Item name="provider" label="CI 平台">
              <Select options={[
                { label: 'GitHub Actions', value: 'GITHUB_ACTIONS' },
                { label: 'GitLab CI', value: 'GITLAB_CI' },
                { label: 'Jenkins', value: 'JENKINS' },
              ]} />
            </Form.Item>
            <Form.Item name="conclusion" label="结论">
              <Select options={[
                { label: 'failure', value: 'failure' },
                { label: 'success', value: 'success' },
                { label: 'cancelled', value: 'cancelled' },
                { label: 'timed_out', value: 'timed_out' },
              ]} />
            </Form.Item>
            <Form.Item name="branch" label="分支">
              <Input placeholder="main 或 feature/xxx" />
            </Form.Item>
            <Form.Item name="commitSha" label="Commit SHA">
              <Input placeholder="abc1234" />
            </Form.Item>
          </div>
          <Form.Item name="commitMessage" label="提交信息">
            <Input placeholder="commit message" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function CiStat({ icon, label, value, tone = 'idle' }: { icon: ReactNode; label: string; value: number; tone?: DiagnosticTone }) {
  return (
    <div className={`sl-ci-stat sl-ci-stat-${tone}`}>
      <div className="sl-ci-stat-head">
        {icon}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  )
}

function DiagnosticSignalCard({ signal }: { signal: DiagnosticSignal }) {
  return (
    <section className={`sl-ci-diagnostic-signal sl-ci-diagnostic-signal-${signal.tone}`}>
      <div className="sl-ci-diagnostic-head">
        <FileSearchOutlined />
        <div>
          <span>诊断质量</span>
          <strong>{signal.label}</strong>
        </div>
      </div>
      <p>{signal.summary}</p>
      <div className="sl-ci-diagnostic-grid">
        {signal.checks.map(check => (
          <div className={`sl-ci-diagnostic-check sl-ci-diagnostic-check-${check.tone}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-ci-next-action">
        <ApiOutlined />
        <span>{signal.nextAction}</span>
      </div>
    </section>
  )
}

function InfoBlock({ title, content }: { title: string; content: string | null }) {
  if (!content) return null
  return (
    <section className="sl-ci-section">
      <div className="sl-ci-section-title">{title}</div>
      <Paragraph className="sl-ci-text-block">{content}</Paragraph>
    </section>
  )
}

function buildDiagnosticSignal(item: CiDiagnostic): DiagnosticSignal {
  const relatedFiles = parseJsonList(item.relatedFiles)
  const suggestions = parseJsonList(item.fixSuggestions)
  const hasRootCause = Boolean(item.rootCause)
  const hasLog = Boolean(item.rawLogSnippet)

  if (item.status === 'FAILED') {
    return {
      label: '分析失败',
      tone: 'danger',
      summary: item.errorMessage || '诊断任务未能完成，需要检查模型配置或输入日志质量。',
      nextAction: '查看错误信息，必要时重新分析。',
      checks: [
        { label: '任务状态', value: '失败', tone: 'danger' },
        { label: '日志输入', value: hasLog ? '已提供' : '缺失', tone: hasLog ? 'ready' : 'warning' },
        { label: '修复建议', value: '不可用', tone: 'danger' },
      ],
    }
  }

  if (item.status === 'PENDING' || item.status === 'ANALYZING') {
    return {
      label: item.status === 'ANALYZING' ? '分析中' : '等待分析',
      tone: 'warning',
      summary: '诊断还未完成，结果暂不可用于自动修复。',
      nextAction: '等待执行任务完成，或在长时间无进展后重新分析。',
      checks: [
        { label: '任务状态', value: STATUS_MAP[item.status]?.label || item.status, tone: 'warning' },
        { label: '日志输入', value: hasLog ? '已提供' : '缺失', tone: hasLog ? 'ready' : 'warning' },
        { label: '规则/模型', value: '待执行', tone: 'idle' },
      ],
    }
  }

  const strongEvidence = hasRootCause && relatedFiles.length > 0 && suggestions.length > 0
  const weakEvidence = suggestions.length === 0 || relatedFiles.length === 0
  return {
    label: strongEvidence ? '可行动' : weakEvidence ? '证据偏弱' : '已完成',
    tone: strongEvidence ? 'ready' : 'warning',
    summary: strongEvidence
      ? '诊断已识别根因、相关文件和修复建议，可以进入人工复核或自动修码候选。'
      : '诊断完成但缺少部分关键证据，建议结合原始日志复核后再生成修复任务。',
    nextAction: strongEvidence ? '生成修复候选或转入执行任务中心跟踪。' : '补充日志片段后重新分析，提升建议质量。',
    checks: [
      { label: '根因', value: hasRootCause ? '已识别' : '缺失', tone: hasRootCause ? 'ready' : 'warning' },
      { label: '相关文件', value: `${relatedFiles.length} 个`, tone: relatedFiles.length > 0 ? 'ready' : 'warning' },
      { label: '修复建议', value: `${suggestions.length} 条`, tone: suggestions.length > 0 ? 'ready' : 'warning' },
    ],
  }
}

function autoRepairCandidateUrl(item: CiDiagnostic, relatedFiles: string[], suggestions: string[]) {
  if (!item.repositoryId || relatedFiles.length === 0 || suggestions.length === 0) return null
  const targetDesc = [
    `CI 失败分类：${CATEGORY_MAP[item.errorCategory || '']?.label || item.errorCategory || 'UNKNOWN'}`,
    item.failureSummary ? `失败摘要：${item.failureSummary}` : null,
    item.rootCause ? `根因：${item.rootCause}` : null,
    `修复建议：${suggestions.join('；')}`,
  ].filter(Boolean).join('\n')
  const params = new URLSearchParams({
    repositoryId: String(item.repositoryId),
    filePath: relatedFiles[0],
    targetDesc,
    source: `ci-diagnostic-${item.id}`,
    openCreate: '1',
  })
  return `/auto-repairs?${params.toString()}`
}

function parseJsonList(json: string | null): string[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) return parsed.map(item => String(item)).filter(Boolean)
    return [String(parsed)]
  } catch {
    return [json]
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}
