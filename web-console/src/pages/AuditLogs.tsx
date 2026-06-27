import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { BadgeProps } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  GithubOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { auditApi, AuditLog, AuditLogQuery } from '../api/audit'
import { agentToolCallApi, AgentToolCall, AgentToolCallQuery } from '../api/agentToolCall'
import { githubWebhookDeliveryApi, GitHubWebhookDelivery, GitHubWebhookDeliveryQuery } from '../api/githubWebhookDelivery'
import { formatApiError } from '../api/client'

const { Text, Paragraph } = Typography

interface Props {
  projectId: number
  initialToolScanTaskId?: number
}

type SignalTone = 'ready' | 'warning' | 'danger'
type AuditSourceKey = 'audit' | 'tools' | 'deliveries'
type AuditSourceErrors = Partial<Record<AuditSourceKey, string>>

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: 'success',
  PROCESSED: 'success',
  FAILED: 'error',
  ERROR: 'error',
  CANCELLED: 'default',
  PROCESSING: 'processing',
  PENDING: 'processing',
}

const STATUS_BADGE: Record<string, BadgeProps['status']> = {
  SUCCESS: 'success',
  PROCESSED: 'success',
  FAILED: 'error',
  ERROR: 'error',
  CANCELLED: 'default',
  PROCESSING: 'processing',
  PENDING: 'processing',
}

const RESOURCE_OPTIONS = [
  'PROJECT',
  'REPOSITORY',
  'SCAN_TASK',
  'AUTO_REPAIR',
  'GITHUB_APP_INSTALLATION',
]

const STATUS_OPTIONS = ['SUCCESS', 'FAILED']

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function formatDuration(value?: number | null) {
  if (value == null) return '-'
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`
  return `${value}ms`
}

function tryFormatJson(value?: string | null) {
  if (!value) return '-'
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function compactJson(value?: string | null) {
  const formatted = tryFormatJson(value)
  return formatted.length > 140 ? `${formatted.slice(0, 140)}...` : formatted
}

function getStatusBadge(status?: string | null) {
  return STATUS_BADGE[status || ''] || 'default'
}

function getStatusColor(status?: string | null) {
  return STATUS_COLOR[status || ''] || 'default'
}

function getPermissionColor(permission?: string | null) {
  const value = (permission || '').toUpperCase()
  if (value.includes('ADMIN') || value.includes('WRITE') || value.includes('DANGER')) return 'red'
  if (value.includes('APPROVE') || value.includes('MUTATE')) return 'orange'
  if (value.includes('READ')) return 'blue'
  return 'default'
}

function getDeliveryTone(status?: string | null): SignalTone {
  const value = (status || '').toUpperCase()
  if (value.includes('FAIL') || value.includes('ERROR')) return 'danger'
  if (value.includes('PENDING') || value.includes('PROCESS')) return 'warning'
  return 'ready'
}

function buildGovernanceSignal(auditFailed: number, toolFailed: number, deliveryRisk: number, slowEvents: number, sourceErrors: number) {
  if (sourceErrors) {
    return {
      tone: 'danger' as SignalTone,
      title: '审计源存在不可用项',
      summary: '当前页至少有一个审计源加载失败，已保留其他可用数据，需先恢复不可用数据源再判断治理状态。',
      action: '查看下方数据源状态，优先重试失败的数据源并使用请求 ID 定位后端日志。',
    }
  }
  if (auditFailed || toolFailed || deliveryRisk) {
    return {
      tone: 'danger' as SignalTone,
      title: '存在需要复核的安全事件',
      summary: '当前页检测到失败审计、失败工具调用或异常 Webhook Delivery，需要优先排查。',
      action: '先打开失败记录详情，确认输入参数、错误摘要和关联资源。',
    }
  }
  if (slowEvents) {
    return {
      tone: 'warning' as SignalTone,
      title: '审计链路可用，但存在慢事件',
      summary: '当前页没有明显失败事件，但部分操作耗时偏高，可能影响排障体验。',
      action: '定位耗时较长的动作，判断是否需要后端异步化或缓存优化。',
    }
  }
  return {
    tone: 'ready' as SignalTone,
    title: '审计链路健康',
    summary: '通用审计、Agent 工具调用和 Webhook Delivery 在当前页没有发现明显异常。',
    action: '继续保持关键操作留痕，后续可接入告警和审计保留策略。',
  }
}

export default function AuditLogs({ projectId, initialToolScanTaskId }: Props) {
  const navigate = useNavigate()
  const [form] = Form.useForm<AuditLogQuery>()
  const [toolForm] = Form.useForm<AgentToolCallQuery>()
  const [deliveryForm] = Form.useForm<GitHubWebhookDeliveryQuery>()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [toolCalls, setToolCalls] = useState<AgentToolCall[]>([])
  const [deliveries, setDeliveries] = useState<GitHubWebhookDelivery[]>([])
  const [loading, setLoading] = useState(false)
  const [toolLoading, setToolLoading] = useState(false)
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const [selectedToolCall, setSelectedToolCall] = useState<AgentToolCall | null>(null)
  const [selectedDelivery, setSelectedDelivery] = useState<GitHubWebhookDelivery | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [toolPagination, setToolPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [deliveryPagination, setDeliveryPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [sourceErrors, setSourceErrors] = useState<AuditSourceErrors>({})

  const setSourceError = useCallback((source: AuditSourceKey, error: string | null) => {
    setSourceErrors(prev => {
      const next = { ...prev }
      if (error) {
        next[source] = error
      } else {
        delete next[source]
      }
      return next
    })
  }, [])

  const loadLogs = useCallback((page = 1, pageSize = 20) => {
    setLoading(true)
    setSourceError('audit', null)
    const filters = form.getFieldsValue()
    auditApi.listProjectLogs(projectId, {
      page,
      pageSize,
      resourceType: filters.resourceType,
      action: filters.action?.trim() || undefined,
      status: filters.status,
    })
      .then(res => {
        const data = res.data.data
        setLogs(data.items || [])
        setPagination({ page: data.page, pageSize: data.pageSize, total: data.total })
      })
      .catch(error => setSourceError('audit', formatApiError(error, '加载审计日志失败')))
      .finally(() => setLoading(false))
  }, [form, projectId, setSourceError])

  const loadToolCalls = useCallback((page = 1, pageSize = 20) => {
    setToolLoading(true)
    setSourceError('tools', null)
    const filters = toolForm.getFieldsValue()
    agentToolCallApi.listProjectCalls(projectId, {
      page,
      pageSize,
      toolName: filters.toolName?.trim() || undefined,
      scanTaskId: filters.scanTaskId,
      success: filters.success,
    })
      .then(res => {
        const data = res.data.data
        setToolCalls(data.items || [])
        setToolPagination({ page: data.page, pageSize: data.pageSize, total: data.total })
      })
      .catch(error => setSourceError('tools', formatApiError(error, '加载 Agent 工具调用失败')))
      .finally(() => setToolLoading(false))
  }, [projectId, setSourceError, toolForm])

  const loadDeliveries = useCallback((page = 1, pageSize = 20) => {
    setDeliveryLoading(true)
    setSourceError('deliveries', null)
    const filters = deliveryForm.getFieldsValue()
    githubWebhookDeliveryApi.listProjectDeliveries(projectId, {
      page,
      pageSize,
      eventType: filters.eventType?.trim() || undefined,
      status: filters.status,
    })
      .then(res => {
        const data = res.data.data
        setDeliveries(data.items || [])
        setDeliveryPagination({ page: data.page, pageSize: data.pageSize, total: data.total })
      })
      .catch(error => setSourceError('deliveries', formatApiError(error, '加载 GitHub webhook delivery 失败')))
      .finally(() => setDeliveryLoading(false))
  }, [deliveryForm, projectId, setSourceError])

  useEffect(() => {
    setLogs([])
    setToolCalls([])
    setDeliveries([])
    setSourceErrors({})
    setPagination({ page: 1, pageSize: 20, total: 0 })
    setToolPagination({ page: 1, pageSize: 20, total: 0 })
    setDeliveryPagination({ page: 1, pageSize: 20, total: 0 })
    toolForm.setFieldsValue({ scanTaskId: initialToolScanTaskId })
    loadLogs(1, 20)
    loadToolCalls(1, 20)
    loadDeliveries(1, 20)
  }, [initialToolScanTaskId, loadDeliveries, loadLogs, loadToolCalls, projectId, toolForm])

  const refreshAll = () => {
    loadLogs(pagination.page, pagination.pageSize)
    loadToolCalls(toolPagination.page, toolPagination.pageSize)
    loadDeliveries(deliveryPagination.page, deliveryPagination.pageSize)
  }

  const getAuditResourcePath = (record: AuditLog) => {
    if (!record.resourceType || !record.resourceId) return null
    if (record.resourceType === 'SCAN_TASK') return `/scan-tasks/${record.resourceId}`
    if (record.resourceType === 'PROJECT') return `/projects/${record.resourceId}`
    if (record.resourceType === 'AUTO_REPAIR') return `/auto-repairs?projectId=${projectId}&repairId=${record.resourceId}`
    if (record.resourceType === 'REPOSITORY') return `/projects/${projectId}`
    if (record.resourceType === 'GITHUB_APP_INSTALLATION') return `/projects/${projectId}`
    return null
  }

  const openAuditResource = (record: AuditLog) => {
    const path = getAuditResourcePath(record)
    if (path) navigate(path)
  }

  const openToolConversation = (record: AgentToolCall) => {
    if (record.conversationId) navigate(`/agent-chat/${record.conversationId}`)
  }

  const openToolScanTask = (record: AgentToolCall) => {
    if (record.scanTaskId) navigate(`/scan-tasks/${record.scanTaskId}`)
  }

  const stats = useMemo(() => {
    const auditFailed = logs.filter(log => log.status === 'FAILED').length
    const toolFailed = toolCalls.filter(call => !call.success).length
    const privilegedTools = toolCalls.filter(call => getPermissionColor(call.permissionLevel) !== 'blue').length
    const deliveryRisk = deliveries.filter(delivery => getDeliveryTone(delivery.status) !== 'ready').length
    const durations = [
      ...logs.map(log => log.durationMs),
      ...toolCalls.map(call => call.durationMs),
    ].filter((value): value is number => value != null)
    const slowEvents = durations.filter(value => value > 3000).length
    const avgDuration = durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : null
    return { auditFailed, toolFailed, privilegedTools, deliveryRisk, slowEvents, avgDuration }
  }, [deliveries, logs, toolCalls])

  const sourceErrorCount = Object.values(sourceErrors).filter(Boolean).length
  const governanceSignal = useMemo(
    () => buildGovernanceSignal(stats.auditFailed, stats.toolFailed, stats.deliveryRisk, stats.slowEvents, sourceErrorCount),
    [sourceErrorCount, stats.auditFailed, stats.deliveryRisk, stats.slowEvents, stats.toolFailed],
  )

  const sourceHealth = [
    {
      key: 'audit' as AuditSourceKey,
      label: '通用审计',
      description: '认证、项目、扫描和高价值业务动作',
      loading,
      error: sourceErrors.audit,
      count: logs.length,
      total: pagination.total,
      retry: () => loadLogs(pagination.page, pagination.pageSize),
    },
    {
      key: 'tools' as AuditSourceKey,
      label: 'Agent 工具',
      description: '工具名、权限等级、输入输出和失败摘要',
      loading: toolLoading,
      error: sourceErrors.tools,
      count: toolCalls.length,
      total: toolPagination.total,
      retry: () => loadToolCalls(toolPagination.page, toolPagination.pageSize),
    },
    {
      key: 'deliveries' as AuditSourceKey,
      label: 'GitHub Webhook',
      description: 'Delivery 幂等记录和 webhook 处理结果',
      loading: deliveryLoading,
      error: sourceErrors.deliveries,
      count: deliveries.length,
      total: deliveryPagination.total,
      retry: () => loadDeliveries(deliveryPagination.page, deliveryPagination.pageSize),
    },
  ]

  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: formatDate,
    },
    {
      title: '动作',
      dataIndex: 'action',
      minWidth: 220,
      ellipsis: true,
      render: (value: string, record) => (
        <Button type="link" className="sl-audit-table-link" onClick={() => setSelected(record)}>
          <SafetyCertificateOutlined />
          <span>{value}</span>
        </Button>
      ),
    },
    {
      title: '资源',
      key: 'resource',
      width: 210,
      render: (_, record) => (
        <Space size={6}>
          <Text type="secondary">{record.resourceType || '-'} #{record.resourceId || '-'}</Text>
          {getAuditResourcePath(record) && (
            <Tooltip title="打开关联资源">
              <Button size="small" type="text" icon={<LinkOutlined />} onClick={() => openAuditResource(record)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 112,
      render: (status: string) => <Badge status={getStatusBadge(status)} text={status} />,
    },
    {
      title: '操作者',
      dataIndex: 'userId',
      width: 100,
      render: (value: number | null) => value || '-',
    },
    {
      title: '摘要',
      dataIndex: 'outputSummary',
      minWidth: 240,
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '耗时',
      dataIndex: 'durationMs',
      width: 100,
      render: formatDuration,
    },
  ]

  const toolColumns: ColumnsType<AgentToolCall> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: formatDate,
    },
    {
      title: '工具',
      dataIndex: 'toolName',
      minWidth: 210,
      ellipsis: true,
      render: (value: string, record) => (
        <Button type="link" className="sl-audit-table-link" onClick={() => setSelectedToolCall(record)}>
          <ToolOutlined />
          <span>{value}</span>
        </Button>
      ),
    },
    {
      title: '权限',
      dataIndex: 'permissionLevel',
      width: 130,
      render: (value: string) => <Tag color={getPermissionColor(value)}>{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'success',
      width: 112,
      render: (success: boolean) => (
        <Badge status={success ? 'success' : 'error'} text={success ? 'SUCCESS' : 'FAILED'} />
      ),
    },
    {
      title: '对话',
      dataIndex: 'conversationId',
      width: 110,
      render: (value: number | null, record) => value ? (
        <Space size={6}>
          <Text type="secondary">#{value}</Text>
          <Tooltip title="打开对话">
            <Button size="small" type="text" icon={<LinkOutlined />} onClick={() => openToolConversation(record)} />
          </Tooltip>
        </Space>
      ) : '-',
    },
    {
      title: '扫描',
      dataIndex: 'scanTaskId',
      width: 118,
      render: (value: number | null, record) => value ? (
        <Space size={6}>
          <Tag color="blue">#{value}</Tag>
          <Tooltip title="打开扫描报告">
            <Button size="small" type="text" icon={<LinkOutlined />} onClick={() => openToolScanTask(record)} />
          </Tooltip>
        </Space>
      ) : '-',
    },
    {
      title: '摘要',
      key: 'summary',
      minWidth: 260,
      ellipsis: true,
      render: (_, record) => record.success ? (record.resultSummary || '-') : (record.errorMessage || '-'),
    },
    {
      title: '耗时',
      dataIndex: 'durationMs',
      width: 100,
      render: formatDuration,
    },
  ]

  const deliveryColumns: ColumnsType<GitHubWebhookDelivery> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: formatDate,
    },
    {
      title: 'Delivery',
      dataIndex: 'deliveryId',
      minWidth: 260,
      ellipsis: true,
      render: (value: string, record) => (
        <Button type="link" className="sl-audit-table-link" onClick={() => setSelectedDelivery(record)}>
          <GithubOutlined />
          <span>{value}</span>
        </Button>
      ),
    },
    {
      title: '事件',
      dataIndex: 'eventType',
      width: 180,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 130,
      render: (status: string) => <Badge status={getStatusBadge(status)} text={status} />,
    },
    {
      title: '结果',
      dataIndex: 'resultJson',
      minWidth: 280,
      ellipsis: true,
      render: (value: string | null) => compactJson(value),
    },
  ]

  const renderJsonBlock = (title: string, value?: string | null) => (
    <div className="sl-audit-json-block">
      <Text type="secondary">{title}</Text>
      <pre>{tryFormatJson(value)}</pre>
    </div>
  )

  return (
    <div className="sl-audit-page">
      <section className="sl-audit-cockpit">
        <div className="sl-audit-cockpit-main">
          <Text className="sl-kicker">Security Governance Console</Text>
          <h1 className="sl-audit-title">审计日志与安全治理</h1>
          <p className="sl-audit-desc">
            把关键动作、Agent 工具调用、GitHub Webhook Delivery 汇总到同一条追责链路中，方便定位失败、复核权限、追踪资源影响。
          </p>
          <div className="sl-audit-status-line">
            <span><span className="sl-live-dot" />审计链路在线</span>
            <span>项目 #{projectId}</span>
            <span>三类审计源</span>
            {initialToolScanTaskId && <span>scan #{initialToolScanTaskId}</span>}
          </div>
          <div className="sl-audit-actions">
            <Button icon={<ReloadOutlined />} onClick={refreshAll} loading={loading || toolLoading || deliveryLoading}>
              刷新全部
            </Button>
          </div>
        </div>

        <aside className="sl-audit-boundary-card">
          <div className="sl-audit-boundary-head">
            <SafetyCertificateOutlined />
            <div>
              <span>Audit Boundary</span>
              <strong>所有高价值操作必须可追踪</strong>
            </div>
          </div>
          <div className="sl-audit-boundary-list">
            <div><CheckCircleOutlined />输入参数必须脱敏留痕</div>
            <div><CheckCircleOutlined />Agent 工具调用必须记录权限</div>
            <div><CheckCircleOutlined />Webhook Delivery 必须具备幂等记录</div>
            <div><CheckCircleOutlined />失败事件必须能跳转定位</div>
          </div>
        </aside>
      </section>

      <section className="sl-audit-summary-grid">
        <div className={`sl-audit-stat sl-audit-stat-${governanceSignal.tone}`}>
          <div className="sl-audit-stat-head"><SafetyCertificateOutlined />治理信号</div>
          <strong>{governanceSignal.tone === 'ready' ? '健康' : governanceSignal.tone === 'warning' ? '关注' : '复核'}</strong>
        </div>
        <div className="sl-audit-stat sl-audit-stat-danger">
          <div className="sl-audit-stat-head"><WarningOutlined />失败审计</div>
          <strong>{stats.auditFailed + stats.toolFailed}</strong>
        </div>
        <div className="sl-audit-stat sl-audit-stat-warning">
          <div className="sl-audit-stat-head"><ToolOutlined />高权限工具</div>
          <strong>{stats.privilegedTools}</strong>
        </div>
        <div className="sl-audit-stat">
          <div className="sl-audit-stat-head"><ClockCircleOutlined />平均耗时</div>
          <strong>{formatDuration(stats.avgDuration)}</strong>
        </div>
      </section>

      <div className={`sl-audit-signal sl-audit-signal-${governanceSignal.tone}`}>
        <div className="sl-audit-signal-head">
          {governanceSignal.tone === 'danger' ? <CloseCircleOutlined /> : <SafetyCertificateOutlined />}
          <div>
            <span>Governance Signal</span>
            <strong>{governanceSignal.title}</strong>
          </div>
        </div>
        <p>{governanceSignal.summary}</p>
        <div className="sl-audit-next-action">
          <CheckCircleOutlined />
          <span>{governanceSignal.action}</span>
        </div>
      </div>

      <section className="sl-audit-source-health" aria-label="审计数据源状态">
        {sourceHealth.map(source => {
          const status = source.error ? 'danger' : source.loading ? 'warning' : 'ready'
          return (
            <div className={`sl-audit-source-card sl-audit-source-card-${status}`} key={source.key}>
              <div>
                <span>{source.label}</span>
                <strong>{source.error ? '不可用' : source.loading ? '加载中' : '在线'}</strong>
              </div>
              <p>{source.description}</p>
              <div className="sl-audit-source-meta">
                <Tag color={status === 'danger' ? 'red' : status === 'warning' ? 'gold' : 'green'}>
                  {source.error ? 'ERROR' : source.loading ? 'LOADING' : 'READY'}
                </Tag>
                <span>{source.count}/{source.total} 条</span>
              </div>
              {source.error && (
                <div className="sl-audit-source-error">
                  <span>{source.error}</span>
                  <Button size="small" icon={<ReloadOutlined />} onClick={source.retry}>重试</Button>
                </div>
              )}
            </div>
          )
        })}
      </section>

      <Card className="sl-audit-workbench-card">
        <Tabs
          defaultActiveKey={initialToolScanTaskId ? 'agent-tool-calls' : 'audit-logs'}
          items={[
            {
              key: 'audit-logs',
              label: '通用审计',
              forceRender: true,
              children: (
                <div className="sl-audit-tab-panel">
                  <Form form={form} layout="vertical" className="sl-audit-filter-form">
                    <Form.Item name="resourceType" label="资源类型">
                      <Select
                        allowClear
                        placeholder="全部资源"
                        options={RESOURCE_OPTIONS.map(value => ({ value, label: value }))}
                      />
                    </Form.Item>
                    <Form.Item name="status" label="状态">
                      <Select
                        allowClear
                        placeholder="全部状态"
                        options={STATUS_OPTIONS.map(value => ({ value, label: value }))}
                      />
                    </Form.Item>
                    <Form.Item name="action" label="动作">
                      <Input allowClear placeholder="按动作关键词查询" />
                    </Form.Item>
                    <div className="sl-audit-filter-actions">
                      <Button type="primary" icon={<SearchOutlined />} onClick={() => loadLogs(1, pagination.pageSize)}>
                        查询
                      </Button>
                      <Button onClick={() => { form.resetFields(); loadLogs(1, pagination.pageSize) }}>
                        重置
                      </Button>
                    </div>
                  </Form>
                  {sourceErrors.audit && (
                    <AuditSourceError message={sourceErrors.audit} onRetry={() => loadLogs(pagination.page, pagination.pageSize)} />
                  )}
                  <Table
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={logs}
                    scroll={{ x: 1180 }}
                    onChange={(next: TablePaginationConfig) => loadLogs(next.current || 1, next.pageSize || 20)}
                    pagination={{
                      current: pagination.page,
                      pageSize: pagination.pageSize,
                      total: pagination.total,
                      showSizeChanger: true,
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'agent-tool-calls',
              label: 'Agent 工具调用',
              forceRender: true,
              children: (
                <div className="sl-audit-tab-panel">
                  <Form form={toolForm} layout="vertical" className="sl-audit-filter-form sl-audit-filter-form-compact">
                    <Form.Item name="toolName" label="工具名">
                      <Input allowClear placeholder="按工具名查询" />
                    </Form.Item>
                    <Form.Item name="scanTaskId" label="扫描任务">
                      <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="ScanTask ID" />
                    </Form.Item>
                    <Form.Item name="success" label="状态">
                      <Select
                        allowClear
                        placeholder="全部状态"
                        options={[
                          { value: true, label: 'SUCCESS' },
                          { value: false, label: 'FAILED' },
                        ]}
                      />
                    </Form.Item>
                    <div className="sl-audit-filter-actions">
                      <Button type="primary" icon={<SearchOutlined />} onClick={() => loadToolCalls(1, toolPagination.pageSize)}>
                        查询
                      </Button>
                      <Button onClick={() => { toolForm.resetFields(); loadToolCalls(1, toolPagination.pageSize) }}>
                        重置
                      </Button>
                    </div>
                  </Form>
                  {sourceErrors.tools && (
                    <AuditSourceError message={sourceErrors.tools} onRetry={() => loadToolCalls(toolPagination.page, toolPagination.pageSize)} />
                  )}
                  <Table
                    rowKey="id"
                    loading={toolLoading}
                    columns={toolColumns}
                    dataSource={toolCalls}
                    scroll={{ x: 1100 }}
                    onChange={(next: TablePaginationConfig) => loadToolCalls(next.current || 1, next.pageSize || 20)}
                    pagination={{
                      current: toolPagination.page,
                      pageSize: toolPagination.pageSize,
                      total: toolPagination.total,
                      showSizeChanger: true,
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'github-webhook-deliveries',
              label: 'GitHub Webhook',
              forceRender: true,
              children: (
                <div className="sl-audit-tab-panel">
                  <Form form={deliveryForm} layout="vertical" className="sl-audit-filter-form sl-audit-filter-form-compact">
                    <Form.Item name="eventType" label="事件类型">
                      <Input allowClear placeholder="例如 installation 或 push" />
                    </Form.Item>
                    <Form.Item name="status" label="状态">
                      <Select
                        allowClear
                        placeholder="全部状态"
                        options={[
                          { value: 'PROCESSED', label: 'PROCESSED' },
                          { value: 'FAILED', label: 'FAILED' },
                          { value: 'PROCESSING', label: 'PROCESSING' },
                        ]}
                      />
                    </Form.Item>
                    <div className="sl-audit-filter-actions">
                      <Button type="primary" icon={<SearchOutlined />} onClick={() => loadDeliveries(1, deliveryPagination.pageSize)}>
                        查询
                      </Button>
                      <Button onClick={() => { deliveryForm.resetFields(); loadDeliveries(1, deliveryPagination.pageSize) }}>
                        重置
                      </Button>
                    </div>
                  </Form>
                  {sourceErrors.deliveries && (
                    <AuditSourceError message={sourceErrors.deliveries} onRetry={() => loadDeliveries(deliveryPagination.page, deliveryPagination.pageSize)} />
                  )}
                  <Table
                    rowKey="id"
                    loading={deliveryLoading}
                    columns={deliveryColumns}
                    dataSource={deliveries}
                    scroll={{ x: 980 }}
                    onChange={(next: TablePaginationConfig) => loadDeliveries(next.current || 1, next.pageSize || 20)}
                    pagination={{
                      current: deliveryPagination.page,
                      pageSize: deliveryPagination.pageSize,
                      total: deliveryPagination.total,
                      showSizeChanger: true,
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        className="sl-audit-drawer"
        title={selected ? `审计事件 #${selected.id}` : '审计事件'}
        open={!!selected}
        onClose={() => setSelected(null)}
        width={680}
      >
        {selected && (
          <div className="sl-audit-drawer-stack">
            <div className={`sl-audit-drawer-signal sl-audit-drawer-${selected.status === 'FAILED' ? 'danger' : 'ready'}`}>
              <div>
                <span>Audit Event</span>
                <strong>{selected.action}</strong>
              </div>
              <Badge status={getStatusBadge(selected.status)} text={selected.status} />
            </div>
            {getAuditResourcePath(selected) && (
              <Button icon={<LinkOutlined />} onClick={() => openAuditResource(selected)}>
                打开关联资源
              </Button>
            )}
            <div className="sl-audit-drawer-grid">
              <div><span>资源</span><strong>{selected.resourceType || '-'} #{selected.resourceId || '-'}</strong></div>
              <div><span>操作者</span><strong>{selected.userId || '-'}</strong></div>
              <div><span>时间</span><strong>{formatDate(selected.createdAt)}</strong></div>
              <div><span>耗时</span><strong>{formatDuration(selected.durationMs)}</strong></div>
            </div>
            <div className="sl-audit-section">
              <Text type="secondary">摘要</Text>
              <Paragraph>{selected.outputSummary || '-'}</Paragraph>
            </div>
            {renderJsonBlock('Sanitized Input', selected.inputJson)}
            <div className="sl-audit-section">
              <Text type="secondary">请求 ID</Text>
              <Paragraph copyable={!!selected.requestId}>{selected.requestId || '-'}</Paragraph>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        className="sl-audit-drawer"
        title={selectedToolCall ? `工具调用 #${selectedToolCall.id}` : '工具调用'}
        open={!!selectedToolCall}
        onClose={() => setSelectedToolCall(null)}
        width={680}
      >
        {selectedToolCall && (
          <div className="sl-audit-drawer-stack">
            <div className={`sl-audit-drawer-signal sl-audit-drawer-${selectedToolCall.success ? 'ready' : 'danger'}`}>
              <div>
                <span>Agent Tool Call</span>
                <strong>{selectedToolCall.toolName}</strong>
              </div>
              <Badge status={selectedToolCall.success ? 'success' : 'error'} text={selectedToolCall.success ? 'SUCCESS' : 'FAILED'} />
            </div>
            {selectedToolCall.conversationId && (
              <Button icon={<LinkOutlined />} onClick={() => openToolConversation(selectedToolCall)}>
                打开对话
              </Button>
            )}
            {selectedToolCall.scanTaskId && (
              <Button icon={<LinkOutlined />} onClick={() => openToolScanTask(selectedToolCall)}>
                打开扫描报告
              </Button>
            )}
            <div className="sl-audit-drawer-grid">
              <div><span>权限</span><strong><Tag color={getPermissionColor(selectedToolCall.permissionLevel)}>{selectedToolCall.permissionLevel}</Tag></strong></div>
              <div><span>对话</span><strong>{selectedToolCall.conversationId || '-'}</strong></div>
              <div><span>扫描</span><strong>{selectedToolCall.scanTaskId ? `#${selectedToolCall.scanTaskId}` : '-'}</strong></div>
              <div><span>操作者</span><strong>{selectedToolCall.createdBy || '-'}</strong></div>
              <div><span>耗时</span><strong>{formatDuration(selectedToolCall.durationMs)}</strong></div>
            </div>
            {renderJsonBlock('Arguments', selectedToolCall.argumentsJson)}
            <div className="sl-audit-section">
              <Text type="secondary">结果摘要</Text>
              <Paragraph>{selectedToolCall.resultSummary || '-'}</Paragraph>
            </div>
            <div className="sl-audit-section">
              <Text type="secondary">错误</Text>
              <Paragraph>{selectedToolCall.errorMessage || '-'}</Paragraph>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        className="sl-audit-drawer"
        title={selectedDelivery ? `Webhook Delivery #${selectedDelivery.id}` : 'Webhook Delivery'}
        open={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        width={680}
      >
        {selectedDelivery && (
          <div className="sl-audit-drawer-stack">
            <div className={`sl-audit-drawer-signal sl-audit-drawer-${getDeliveryTone(selectedDelivery.status)}`}>
              <div>
                <span>GitHub Webhook Delivery</span>
                <strong>{selectedDelivery.deliveryId}</strong>
              </div>
              <Badge status={getStatusBadge(selectedDelivery.status)} text={selectedDelivery.status} />
            </div>
            <div className="sl-audit-drawer-grid">
              <div><span>事件</span><strong>{selectedDelivery.eventType}</strong></div>
              <div><span>创建时间</span><strong>{formatDate(selectedDelivery.createdAt)}</strong></div>
              <div><span>更新时间</span><strong>{formatDate(selectedDelivery.updatedAt)}</strong></div>
              <div><span>状态</span><strong><Tag color={getStatusColor(selectedDelivery.status)}>{selectedDelivery.status}</Tag></strong></div>
            </div>
            <div className="sl-audit-section">
              <Text type="secondary">Delivery ID</Text>
              <Paragraph copyable>{selectedDelivery.deliveryId}</Paragraph>
            </div>
            {renderJsonBlock('Result', selectedDelivery.resultJson)}
          </div>
        )}
      </Drawer>
    </div>
  )
}

function AuditSourceError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="sl-audit-inline-error" role="alert">
      <WarningOutlined />
      <span>{message}</span>
      <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
        重试
      </Button>
    </div>
  )
}
