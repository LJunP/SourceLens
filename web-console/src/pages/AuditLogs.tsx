import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
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
import type { AutoRepairProvenance } from '../api/autoRepair'
import { formatApiError } from '../api/client'
import ActionButton from '../components/ui/ActionButton'
import IconActionButton from '../components/ui/IconActionButton'
import { createSelectableTableRowProps } from '../components/ui/selectableTableRow'
import { redactJsonOrText } from '../utils/displayRedaction'

const { Text, Paragraph } = Typography

interface Props {
  projectId: number
  initialToolScanTaskId?: number
  initialToolConversationId?: number
  initialAuditFilters?: Partial<AuditLogQuery>
}

type SignalTone = 'ready' | 'warning' | 'danger'
type AuditSourceKey = 'audit' | 'tools' | 'deliveries'
type AuditSourceErrors = Partial<Record<AuditSourceKey, string>>

interface AuditInvestigationStep {
  key: string
  icon: ReactNode
  label: string
  status: string
  detail: string
  tone: SignalTone
  actionLabel: string
  onAction: () => void
}

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
  'ARTIFACT',
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

function formatRedactedJson(value?: string | null) {
  return redactJsonOrText(value, '-')
}

function compactJson(value?: string | null) {
  const formatted = formatRedactedJson(value)
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

function matchesInitialAuditFilters(item: AuditLog, filters?: Partial<AuditLogQuery>) {
  if (!filters?.auditLogId && !filters?.resourceId) return false
  if (filters.auditLogId && item.id !== filters.auditLogId) return false
  if (filters.resourceId && item.resourceId !== filters.resourceId) return false
  if (filters.resourceType && item.resourceType !== filters.resourceType) return false
  if (filters.action && item.action !== filters.action) return false
  if (filters.status && item.status !== filters.status) return false
  return true
}

function initialAuditTargetLabel(filters?: Partial<AuditLogQuery>) {
  if (!filters?.auditLogId && !filters?.resourceId) return '目标审计事件'
  const parts = [
    filters.auditLogId ? `Audit #${filters.auditLogId}` : undefined,
    filters.resourceType || (filters.resourceId ? '资源' : undefined),
    filters.resourceId ? `#${filters.resourceId}` : undefined,
    filters.action,
    filters.status,
  ].filter(Boolean)
  return parts.join(' / ')
}

function hasSubmittedAuditFilters(filters: AuditLogQuery, initialFilters?: Partial<AuditLogQuery>) {
  return Boolean(
    initialFilters?.auditLogId ||
    filters.resourceType ||
    filters.resourceId ||
    filters.action?.trim() ||
    filters.status
  )
}

function hasSubmittedToolFilters(filters: AgentToolCallQuery) {
  return Boolean(filters.toolName?.trim() || filters.conversationId || filters.scanTaskId || filters.success != null)
}

function hasSubmittedDeliveryFilters(filters: GitHubWebhookDeliveryQuery) {
  return Boolean(filters.eventType?.trim() || filters.status)
}

export default function AuditLogs({ projectId, initialToolScanTaskId, initialToolConversationId, initialAuditFilters }: Props) {
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
  const [auditDeepLinkMiss, setAuditDeepLinkMiss] = useState(false)
  const [auditQueryScoped, setAuditQueryScoped] = useState(false)
  const [toolQueryScoped, setToolQueryScoped] = useState(false)
  const [deliveryQueryScoped, setDeliveryQueryScoped] = useState(false)
  const hasInitialAuditFilters = Boolean(
    initialAuditFilters?.resourceType ||
    initialAuditFilters?.auditLogId ||
    initialAuditFilters?.resourceId ||
    initialAuditFilters?.action ||
    initialAuditFilters?.status
  )
  const hasInitialToolFilters = Boolean(initialToolScanTaskId || initialToolConversationId)
  const [activeTab, setActiveTab] = useState(hasInitialAuditFilters ? 'audit-logs' : hasInitialToolFilters ? 'agent-tool-calls' : 'audit-logs')
  const appliedInitialAuditKeyRef = useRef<string | null>(null)

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
    setAuditQueryScoped(hasSubmittedAuditFilters(filters, initialAuditFilters))
    auditApi.listProjectLogs(projectId, {
      page,
      pageSize,
        resourceType: filters.resourceType,
        auditLogId: initialAuditFilters?.auditLogId,
        resourceId: filters.resourceId,
      action: filters.action?.trim() || undefined,
      status: filters.status,
    })
      .then(res => {
        const data = res.data.data
        const items = data.items || []
        setLogs(items)
        setPagination({ page: data.page, pageSize: data.pageSize, total: data.total })
        const initialKey = initialAuditFilters ? JSON.stringify(initialAuditFilters) : null
        if (initialKey && appliedInitialAuditKeyRef.current !== initialKey && (initialAuditFilters?.auditLogId || initialAuditFilters?.resourceId)) {
          const matched = items.find(item => matchesInitialAuditFilters(item, initialAuditFilters))
          if (matched) {
            setSelected(matched)
            setAuditDeepLinkMiss(false)
            appliedInitialAuditKeyRef.current = initialKey
          } else {
            setSelected(null)
            setAuditDeepLinkMiss(true)
          }
        }
      })
      .catch(error => setSourceError('audit', formatApiError(error, '加载审计日志失败')))
      .finally(() => setLoading(false))
  }, [form, initialAuditFilters, projectId, setSourceError])

  const loadToolCalls = useCallback((page = 1, pageSize = 20) => {
    setToolLoading(true)
    setSourceError('tools', null)
    const filters = toolForm.getFieldsValue()
    setToolQueryScoped(hasSubmittedToolFilters(filters))
    agentToolCallApi.listProjectCalls(projectId, {
      page,
      pageSize,
      toolName: filters.toolName?.trim() || undefined,
      conversationId: filters.conversationId,
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
    setDeliveryQueryScoped(hasSubmittedDeliveryFilters(filters))
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
    setAuditDeepLinkMiss(false)
    setPagination({ page: 1, pageSize: 20, total: 0 })
    setToolPagination({ page: 1, pageSize: 20, total: 0 })
    setDeliveryPagination({ page: 1, pageSize: 20, total: 0 })
    form.setFieldsValue({
      resourceType: initialAuditFilters?.resourceType,
      resourceId: initialAuditFilters?.resourceId,
      action: initialAuditFilters?.action,
      status: initialAuditFilters?.status,
    })
    toolForm.setFieldsValue({ conversationId: initialToolConversationId, scanTaskId: initialToolScanTaskId })
    setActiveTab(hasInitialAuditFilters ? 'audit-logs' : hasInitialToolFilters ? 'agent-tool-calls' : 'audit-logs')
    loadLogs(1, 20)
    loadToolCalls(1, 20)
    loadDeliveries(1, 20)
  }, [form, hasInitialAuditFilters, hasInitialToolFilters, initialAuditFilters, initialToolConversationId, initialToolScanTaskId, loadDeliveries, loadLogs, loadToolCalls, projectId, toolForm])

  const refreshAll = () => {
    loadLogs(pagination.page, pagination.pageSize)
    loadToolCalls(toolPagination.page, toolPagination.pageSize)
    loadDeliveries(deliveryPagination.page, deliveryPagination.pageSize)
  }

  const getAuditResourcePath = (record: AuditLog) => {
    if (!record.resourceType || !record.resourceId) return null
    if (record.resourceType === 'SCAN_TASK') return `/scan-tasks/${record.resourceId}`
    if (record.resourceType === 'PROJECT') return `/projects/${record.resourceId}`
    if (record.resourceType === 'ARTIFACT') return `/artifacts?projectId=${projectId}&artifactId=${record.resourceId}`
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

  const selectAuditLog = useCallback((record: AuditLog) => {
    setSelected(record)
    setSelectedToolCall(null)
    setSelectedDelivery(null)
  }, [])

  const selectToolCall = useCallback((record: AgentToolCall) => {
    setSelected(null)
    setSelectedToolCall(record)
    setSelectedDelivery(null)
  }, [])

  const selectDelivery = useCallback((record: GitHubWebhookDelivery) => {
    setSelected(null)
    setSelectedToolCall(null)
    setSelectedDelivery(record)
  }, [])

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

  const selectedAuditDetailId = selected ? `audit-log-detail-${selected.id}` : undefined
  const selectedAuditTitleId = selected ? `audit-log-detail-title-${selected.id}` : undefined
  const selectedToolDetailId = selectedToolCall ? `agent-tool-call-detail-${selectedToolCall.id}` : undefined
  const selectedToolTitleId = selectedToolCall ? `agent-tool-call-detail-title-${selectedToolCall.id}` : undefined
  const selectedDeliveryDetailId = selectedDelivery ? `github-webhook-delivery-detail-${selectedDelivery.id}` : undefined
  const selectedDeliveryTitleId = selectedDelivery ? `github-webhook-delivery-detail-title-${selectedDelivery.id}` : undefined

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
  const visibleAuditEventCount = logs.length + toolCalls.length + deliveries.length
  const totalAuditEventCount = pagination.total + toolPagination.total + deliveryPagination.total
  const hasScopedAuditQuery = auditQueryScoped || toolQueryScoped || deliveryQueryScoped || hasInitialAuditFilters || hasInitialToolFilters
  const auditDecisionGateStatus = sourceErrorCount || auditDeepLinkMiss
    ? 'BLOCKED'
    : totalAuditEventCount > visibleAuditEventCount || hasScopedAuditQuery
      ? 'REVIEW'
      : 'READY'
  const auditDecisionGateTone: SignalTone = auditDecisionGateStatus === 'READY'
    ? 'ready'
    : auditDecisionGateStatus === 'BLOCKED'
      ? 'danger'
      : 'warning'
  const auditDecisionGateReason = auditDecisionGateStatus === 'BLOCKED'
    ? '存在不可用审计源或精确深链未命中，当前页面不能作为完整审计结论。'
    : auditDecisionGateStatus === 'REVIEW'
      ? '当前视图受分页、筛选或深链范围影响，只能证明当前结果窗口，需要结合全量查询或指定资源复核。'
      : '三类审计源当前页均可读取，且没有筛选/深链收窄；可作为当前项目审计工作台的初步健康信号。'
  const auditStatusLineLabel = sourceErrorCount
    ? '审计源需复核'
    : loading || toolLoading || deliveryLoading
      ? '审计源加载中'
      : '审计源可读取'
  const resourceTraceCount = logs.filter(log => getAuditResourcePath(log)).length
    + toolCalls.filter(call => call.conversationId || call.scanTaskId).length
    + deliveries.length
  const investigationSteps = useMemo<AuditInvestigationStep[]>(() => {
    const failureCount = stats.auditFailed + stats.toolFailed + stats.deliveryRisk
    const privilegedRisk = stats.privilegedTools > 0
    const hasRedactedEvidence = Boolean(logs.length || toolCalls.length || deliveries.length)
    const hasTraceTargets = resourceTraceCount > 0
    return [
      {
        key: 'risk-detection',
        icon: failureCount ? <WarningOutlined /> : <SafetyCertificateOutlined />,
        label: '风险发现',
        status: failureCount ? `${failureCount} 个待复核事件` : sourceErrorCount ? '审计源异常' : '当前窗口健康',
        detail: sourceErrorCount
          ? '至少一个审计源不可用，先恢复数据源再判断风险。'
          : failureCount
            ? '失败审计、失败工具调用或异常 delivery 已进入调查范围。'
            : '当前结果窗口没有失败事件，继续观察高权限和慢事件。',
        tone: sourceErrorCount || failureCount ? 'danger' : privilegedRisk || stats.slowEvents ? 'warning' : 'ready',
        actionLabel: failureCount || sourceErrorCount ? '查看失败源' : '查看审计表',
        onAction: () => {
          if (sourceErrors.audit || stats.auditFailed) setActiveTab('audit-logs')
          else if (sourceErrors.tools || stats.toolFailed || privilegedRisk) setActiveTab('agent-tool-calls')
          else if (sourceErrors.deliveries || stats.deliveryRisk) setActiveTab('github-webhook-deliveries')
          else setActiveTab('audit-logs')
        },
      },
      {
        key: 'evidence-redaction',
        icon: <SearchOutlined />,
        label: '证据脱敏',
        status: hasRedactedEvidence ? '显示层脱敏' : '等待证据',
        detail: hasRedactedEvidence
          ? '输入、工具参数和 delivery 结果只展示脱敏 JSON，原始块默认收起。'
          : '三类审计源暂无可展示证据，不能形成完整调查结论。',
        tone: hasRedactedEvidence ? 'ready' : 'warning',
        actionLabel: '检查 JSON',
        onAction: () => setActiveTab('audit-logs'),
      },
      {
        key: 'resource-trace',
        icon: <LinkOutlined />,
        label: '资源追踪',
        status: hasTraceTargets ? `${resourceTraceCount} 个可追踪入口` : '缺少资源入口',
        detail: hasTraceTargets
          ? '审计事件、工具调用和 delivery 可回跳关联资源、对话、扫描或产物。'
          : '当前窗口缺少可跳转资源，后续需要补充 resourceType/resourceId 绑定。',
        tone: hasTraceTargets ? 'ready' : 'warning',
        actionLabel: '查看追踪入口',
        onAction: () => setActiveTab('audit-logs'),
      },
      {
        key: 'review-closure',
        icon: auditDecisionGateStatus === 'READY' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
        label: '复盘处置',
        status: auditDecisionGateStatus,
        detail: auditDecisionGateStatus === 'READY'
          ? '三源可读取且当前窗口未收窄，可作为初步健康信号。'
          : auditDecisionGateStatus === 'BLOCKED'
            ? '存在不可用审计源或精确深链未命中，必须先关闭阻塞项。'
            : '当前视图受筛选、分页或深链影响，只能作为范围内复盘证据。',
        tone: auditDecisionGateTone,
        actionLabel: auditDecisionGateStatus === 'BLOCKED' ? '重新加载' : '查看门禁',
        onAction: auditDecisionGateStatus === 'BLOCKED' ? refreshAll : () => setActiveTab('audit-logs'),
      },
    ]
  }, [
    auditDecisionGateStatus,
    auditDecisionGateTone,
    deliveries.length,
    logs.length,
    refreshAll,
    resourceTraceCount,
    sourceErrorCount,
    sourceErrors.audit,
    sourceErrors.deliveries,
    sourceErrors.tools,
    stats.auditFailed,
    stats.deliveryRisk,
    stats.privilegedTools,
    stats.slowEvents,
    stats.toolFailed,
    toolCalls.length,
  ])

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
        <ActionButton
          type="link"
          className="sl-audit-table-link"
          icon={<SafetyCertificateOutlined />}
          onClick={event => {
            event.stopPropagation()
            selectAuditLog(record)
          }}
          label={value}
        />
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
            <IconActionButton
              label={`打开审计事件 #${record.id} 关联资源`}
              tooltip="打开关联资源"
              size="small"
              type="text"
              data-sl-target-url={getAuditResourcePath(record) || undefined}
              icon={<LinkOutlined />}
              onClick={event => {
                event.stopPropagation()
                openAuditResource(record)
              }}
            />
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
        <ActionButton
          type="link"
          className="sl-audit-table-link"
          icon={<ToolOutlined />}
          onClick={event => {
            event.stopPropagation()
            selectToolCall(record)
          }}
          label={value}
        />
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
          <IconActionButton
            label={`打开工具调用 #${record.id} 对话`}
            tooltip="打开对话"
            size="small"
            type="text"
            icon={<LinkOutlined />}
            onClick={event => {
              event.stopPropagation()
              openToolConversation(record)
            }}
          />
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
          <IconActionButton
            label={`打开工具调用 #${record.id} 扫描报告`}
            tooltip="打开扫描报告"
            size="small"
            type="text"
            icon={<LinkOutlined />}
            onClick={event => {
              event.stopPropagation()
              openToolScanTask(record)
            }}
          />
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
        <ActionButton
          type="link"
          className="sl-audit-table-link"
          icon={<GithubOutlined />}
          onClick={event => {
            event.stopPropagation()
            selectDelivery(record)
          }}
          label={value}
        />
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
    <details className="sl-audit-json-block">
      <summary>
        <span>{title}</span>
        <em>原始 JSON 默认收起</em>
      </summary>
      <pre className="sl-audit-json-redacted" aria-label={`${title} 脱敏 JSON`}>
        {formatRedactedJson(value)}
      </pre>
    </details>
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
            <span><span className="sl-live-dot" />{auditStatusLineLabel}</span>
            <span>项目 #{projectId}</span>
            <span>三类审计源</span>
            {initialToolConversationId && <span>conv #{initialToolConversationId}</span>}
            {initialToolScanTaskId && <span>scan #{initialToolScanTaskId}</span>}
          </div>
          <div className="sl-audit-actions">
            <ActionButton
              icon={<ReloadOutlined />}
              onClick={refreshAll}
              loading={loading || toolLoading || deliveryLoading}
              label="刷新全部"
            />
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

      <section
        className={`sl-audit-decision-gate sl-audit-decision-gate-${auditDecisionGateTone}`}
        aria-label="审计判定门禁说明"
      >
        <div className="sl-audit-decision-gate-head">
          <SafetyCertificateOutlined />
          <div>
            <span>Audit Decision Gate</span>
            <strong>审计判定门禁说明</strong>
          </div>
          <Tag color={auditDecisionGateTone === 'ready' ? 'green' : auditDecisionGateTone === 'danger' ? 'red' : 'gold'}>
            {auditDecisionGateStatus}
          </Tag>
        </div>
        <p>{auditDecisionGateReason}</p>
        <div className="sl-audit-decision-gate-grid">
          <div>
            <span>数据源完整性</span>
            <strong>{sourceErrorCount ? `${sourceErrorCount} 个审计源不可用` : '三源可读取'}</strong>
          </div>
          <div>
            <span>当前结果窗口</span>
            <strong>{visibleAuditEventCount}/{totalAuditEventCount} 条</strong>
          </div>
          <div>
            <span>深链状态</span>
            <strong>{auditDeepLinkMiss ? '精确目标未命中' : hasScopedAuditQuery ? '已按筛选或深链收窄' : '未收窄'}</strong>
          </div>
          <div>
            <span>Raw 证据边界</span>
            <strong>只展示脱敏摘要，原始 JSON 默认收起</strong>
          </div>
        </div>
      </section>

      <AuditInvestigationLoopPanel steps={investigationSteps} />

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
                  <ActionButton size="small" icon={<ReloadOutlined />} onClick={source.retry} label="重试" />
                </div>
              )}
            </div>
          )
        })}
      </section>

      {auditDeepLinkMiss && (
        <div className="sl-audit-inline-error sl-audit-deep-link-miss" role="status">
          <WarningOutlined />
          <span>未找到目标审计事件：{initialAuditTargetLabel(initialAuditFilters)}。当前筛选已应用，可重试或调整筛选条件。</span>
          <ActionButton size="small" icon={<ReloadOutlined />} onClick={() => loadLogs(1, pagination.pageSize)} label="重新查询" />
        </div>
      )}

      <Card className="sl-audit-workbench-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
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
                    <Form.Item name="resourceId" label="资源 ID">
                      <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="例如 AutoRepair ID" />
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
                      <ActionButton type="primary" icon={<SearchOutlined />} onClick={() => loadLogs(1, pagination.pageSize)} label="查询" />
                      <ActionButton onClick={() => { form.resetFields(); loadLogs(1, pagination.pageSize) }} label="重置" />
                    </div>
                  </Form>
                  {sourceErrors.audit && (
                    <AuditSourceError message={sourceErrors.audit} onRetry={() => loadLogs(pagination.page, pagination.pageSize)} />
                  )}
                  <Table
                    className="sl-audit-table-card sl-selectable-table-card"
                    rowKey="id"
                    onRow={record => createSelectableTableRowProps({
                      record,
                      selected: selected?.id === record.id,
                      onSelect: selectAuditLog,
                      controlsId: selectedAuditDetailId,
                      label: `AuditLog #${record.id} ${record.action} ${selected?.id === record.id ? '已选中' : '查看详情'}`,
                      className: selected?.id === record.id ? 'sl-audit-row-selected' : '',
                    })}
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
                    <Form.Item name="conversationId" label="对话 ID">
                      <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="Conversation ID" />
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
                      <ActionButton type="primary" icon={<SearchOutlined />} onClick={() => loadToolCalls(1, toolPagination.pageSize)} label="查询" />
                      <ActionButton onClick={() => { toolForm.resetFields(); loadToolCalls(1, toolPagination.pageSize) }} label="重置" />
                    </div>
                  </Form>
                  {sourceErrors.tools && (
                    <AuditSourceError message={sourceErrors.tools} onRetry={() => loadToolCalls(toolPagination.page, toolPagination.pageSize)} />
                  )}
                  <Table
                    className="sl-audit-table-card sl-selectable-table-card"
                    rowKey="id"
                    onRow={record => createSelectableTableRowProps({
                      record,
                      selected: selectedToolCall?.id === record.id,
                      onSelect: selectToolCall,
                      controlsId: selectedToolDetailId,
                      label: `AgentToolCall #${record.id} ${record.toolName} ${selectedToolCall?.id === record.id ? '已选中' : '查看详情'}`,
                      className: selectedToolCall?.id === record.id ? 'sl-audit-row-selected' : '',
                    })}
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
                      <ActionButton type="primary" icon={<SearchOutlined />} onClick={() => loadDeliveries(1, deliveryPagination.pageSize)} label="查询" />
                      <ActionButton onClick={() => { deliveryForm.resetFields(); loadDeliveries(1, deliveryPagination.pageSize) }} label="重置" />
                    </div>
                  </Form>
                  {sourceErrors.deliveries && (
                    <AuditSourceError message={sourceErrors.deliveries} onRetry={() => loadDeliveries(deliveryPagination.page, deliveryPagination.pageSize)} />
                  )}
                  <Table
                    className="sl-audit-table-card sl-selectable-table-card"
                    rowKey="id"
                    onRow={record => createSelectableTableRowProps({
                      record,
                      selected: selectedDelivery?.id === record.id,
                      onSelect: selectDelivery,
                      controlsId: selectedDeliveryDetailId,
                      label: `GitHubWebhookDelivery #${record.id} ${record.deliveryId} ${selectedDelivery?.id === record.id ? '已选中' : '查看详情'}`,
                      className: selectedDelivery?.id === record.id ? 'sl-audit-row-selected' : '',
                    })}
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
        title={selected ? <span id={selectedAuditTitleId}>审计事件 #{selected.id}</span> : '审计事件'}
        open={!!selected}
        onClose={() => setSelected(null)}
        width="min(680px, 92vw)"
      >
        {selected && (
          <div
            id={selectedAuditDetailId}
            role="region"
            aria-labelledby={selectedAuditTitleId}
            className="sl-audit-drawer-stack"
          >
            <div className={`sl-audit-drawer-signal sl-audit-drawer-${selected.status === 'FAILED' ? 'danger' : 'ready'}`}>
              <div>
                <span>Audit Event</span>
                <strong>{selected.action}</strong>
              </div>
              <Badge status={getStatusBadge(selected.status)} text={selected.status} />
            </div>
            {getAuditResourcePath(selected) && (
              <ActionButton
                data-sl-target-url={getAuditResourcePath(selected) || undefined}
                icon={<LinkOutlined />}
                onClick={() => openAuditResource(selected)}
                label="打开关联资源"
              />
            )}
            {isCandidateReceiptAudit(selected) && (
              <AuditCandidateReceiptReviewPanel
                projectId={projectId}
                log={selected}
                provenance={candidateProvenanceFromAudit(selected)}
                onNavigate={navigate}
              />
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
        title={selectedToolCall ? <span id={selectedToolTitleId}>工具调用 #{selectedToolCall.id}</span> : '工具调用'}
        open={!!selectedToolCall}
        onClose={() => setSelectedToolCall(null)}
        width="min(680px, 92vw)"
      >
        {selectedToolCall && (
          <div
            id={selectedToolDetailId}
            role="region"
            aria-labelledby={selectedToolTitleId}
            className="sl-audit-drawer-stack"
          >
            <div className={`sl-audit-drawer-signal sl-audit-drawer-${selectedToolCall.success ? 'ready' : 'danger'}`}>
              <div>
                <span>Agent Tool Call</span>
                <strong>{selectedToolCall.toolName}</strong>
              </div>
              <Badge status={selectedToolCall.success ? 'success' : 'error'} text={selectedToolCall.success ? 'SUCCESS' : 'FAILED'} />
            </div>
            {selectedToolCall.conversationId && (
              <ActionButton icon={<LinkOutlined />} onClick={() => openToolConversation(selectedToolCall)} label="打开对话" />
            )}
            {selectedToolCall.scanTaskId && (
              <ActionButton icon={<LinkOutlined />} onClick={() => openToolScanTask(selectedToolCall)} label="打开扫描报告" />
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
        title={selectedDelivery ? <span id={selectedDeliveryTitleId}>Webhook Delivery #{selectedDelivery.id}</span> : 'Webhook Delivery'}
        open={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        width="min(680px, 92vw)"
      >
        {selectedDelivery && (
          <div
            id={selectedDeliveryDetailId}
            role="region"
            aria-labelledby={selectedDeliveryTitleId}
            className="sl-audit-drawer-stack"
          >
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

function AuditInvestigationLoopPanel({ steps }: { steps: AuditInvestigationStep[] }) {
  return (
    <section className="sl-audit-investigation-loop" aria-label="审计调查闭环">
      <div className="sl-audit-investigation-head">
        <div>
          <span>Audit Investigation Loop</span>
          <strong>审计调查闭环</strong>
        </div>
        <Tag>四段处置</Tag>
      </div>
      <div className="sl-audit-investigation-grid">
        {steps.map((step, index) => (
          <article
            className={`sl-audit-investigation-step sl-audit-investigation-step-${step.tone}`}
            data-sl-audit-investigation-step={step.key}
            key={step.key}
          >
            <div className="sl-audit-investigation-step-head">
              <div className="sl-audit-investigation-step-icon">{step.icon}</div>
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="sl-audit-investigation-step-copy">
              <span>{step.label}</span>
              <strong>{step.status}</strong>
              <p>{step.detail}</p>
            </div>
            <ActionButton size="small" type="text" onClick={step.onAction} label={step.actionLabel} />
          </article>
        ))}
      </div>
    </section>
  )
}

function AuditCandidateReceiptReviewPanel({
  projectId,
  log,
  provenance,
  onNavigate,
}: {
  projectId: number
  log: AuditLog
  provenance: AutoRepairProvenance | null
  onNavigate: (url: string) => void
}) {
  const sourceType = String(provenance?.sourceType || 'UNKNOWN_SOURCE')
  const scanTaskId = candidateReceiptScanTaskId(log, provenance)
  const repairId = log.resourceId || undefined
  const repairUrl = repairId ? auditAutoRepairUrl(projectId, repairId, scanTaskId) : ''
  const reportUrl = scanTaskId ? `/scan-tasks/${scanTaskId}` : ''
  const qaUrl = scanTaskId ? auditCandidateReceiptQaUrl(projectId, scanTaskId, log, provenance) : ''
  const gate = provenance?.repairEvidenceGate || 'REVIEW'
  const gateTone = gate === 'READY' ? 'ready' : gate === 'BLOCKED' ? 'danger' : 'warning'

  return (
    <section
      className={`sl-audit-candidate-receipt sl-audit-candidate-receipt-${gateTone}`}
      aria-label="审计候选凭证复核"
    >
      <div className="sl-audit-candidate-receipt-head">
        <div>
          <span>Candidate Receipt Review</span>
          <strong>候选来源凭证复核</strong>
        </div>
        <Tag color={gateTone === 'ready' ? 'green' : gateTone === 'danger' ? 'red' : 'gold'}>{gate}</Tag>
      </div>
      <div className="sl-audit-candidate-receipt-grid">
        <div><span>来源类型</span><strong>{sourceType}</strong></div>
        <div><span>扫描</span><strong>{scanTaskId ? `#${scanTaskId}` : '-'}</strong></div>
        <div><span>目标文件</span><strong>{provenance?.filePath || provenance?.sourceEvidenceFilePath || '-'}</strong></div>
        <div><span>门禁来源</span><strong>{provenance?.repairEvidenceGateSource || '-'}</strong></div>
      </div>
      <p>
        {provenance?.repairEvidenceGateReason || '从审计事件解析候选来源凭证，复核时应回到同一报告、QA 问答和 AutoRepair 详情交叉确认。'}
      </p>
      <div className="sl-audit-candidate-receipt-actions">
        {repairUrl && (
          <ActionButton
            size="small"
            icon={<LinkOutlined />}
            data-sl-target-url={repairUrl}
            onClick={() => onNavigate(repairUrl)}
            label="打开修复详情"
          />
        )}
        {scanTaskId && (
          <ActionButton
            size="small"
            icon={<SafetyCertificateOutlined />}
            data-sl-target-url={reportUrl}
            onClick={() => onNavigate(reportUrl)}
            label="打开来源报告"
          />
        )}
        {scanTaskId && (
          <ActionButton
            size="small"
            icon={<SearchOutlined />}
            data-sl-target-url={qaUrl}
            onClick={() => onNavigate(qaUrl)}
            label="QA 复核来源"
          />
        )}
      </div>
    </section>
  )
}

function isCandidateReceiptAudit(log: AuditLog) {
  return log.resourceType === 'AUTO_REPAIR' && log.action === 'AUTO_REPAIR_CANDIDATE_CREATED'
}

function parseAuditInputObject(log: AuditLog): any {
  if (!log.inputJson) return null
  try {
    return JSON.parse(log.inputJson)
  } catch {
    return null
  }
}

function candidateProvenanceFromAudit(log: AuditLog): AutoRepairProvenance | null {
  const input = parseAuditInputObject(log)
  const provenance = input?.provenance
  if (!provenance || typeof provenance !== 'object') return null
  return provenance as AutoRepairProvenance
}

function positiveNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function candidateReceiptScanTaskId(log: AuditLog, provenance: AutoRepairProvenance | null) {
  return positiveNumber(provenance?.scanTaskId) || positiveNumber(parseAuditInputObject(log)?.scanTaskId)
}

function auditAutoRepairUrl(projectId: number, repairId: number, scanTaskId?: number) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('repairId', String(repairId))
  if (scanTaskId) {
    params.set('scanTaskId', String(scanTaskId))
  }
  return `/auto-repairs?${params.toString()}`
}

function auditCandidateReceiptQaUrl(
  projectId: number,
  scanTaskId: number,
  log: AuditLog,
  provenance: AutoRepairProvenance | null,
) {
  const params = new URLSearchParams()
  params.set('tab', 'qa')
  params.set('scanTaskId', String(scanTaskId))
  params.set('question', [
    `请复核 AuditLog #${log.id} 中 AUTO_REPAIR_CANDIDATE_CREATED 的候选来源凭证。`,
    `AutoRepair：#${log.resourceId || '-'}`,
    `来源类型：${provenance?.sourceType || 'UNKNOWN_SOURCE'}`,
    `目标文件：${provenance?.filePath || provenance?.sourceEvidenceFilePath || '-'}`,
    `候选门禁：${provenance?.repairEvidenceGate || 'REVIEW'}`,
    '请确认该候选是否仍能由同一扫描报告、QA 引用和审计留痕支持。',
  ].join('\n'))
  return `/projects/${projectId}?${params.toString()}`
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
      <ActionButton size="small" icon={<ReloadOutlined />} onClick={onRetry} label="重试" />
    </div>
  )
}
