import { useState, useEffect, useCallback, useMemo, useRef, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Tag, Typography, Space, Input, Form, Select,
  Collapse, message, Modal, Alert, Popconfirm, Progress
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, CheckCircleOutlined,
  ClockCircleOutlined, SyncOutlined, CloseCircleOutlined,
  CodeOutlined, FileTextOutlined, BranchesOutlined, LinkOutlined,
  StopOutlined, SafetyCertificateOutlined, EyeOutlined
} from '@ant-design/icons'
import { autoRepairApi, AutoRepair, AutoRepairProvenance } from '../api/autoRepair'
import { repositoryApi, Repository } from '../api/repository'
import { executionTaskApi, ExecutionAttempt, ExecutionStep, ExecutionTaskDetail } from '../api/executionTask'
import { auditApi, AuditLog } from '../api/audit'
import { formatApiError, showApiError } from '../api/client'
import ArtifactLinkButton from '../components/ArtifactLinkButton'
import ActionButton from '../components/ui/ActionButton'
import { createSelectableTableRowProps } from '../components/ui/selectableTableRow'
import StateBlock from '../components/ui/StateBlock'
import DiffViewer from '../components/DiffViewer'
import LogViewer from '../components/LogViewer'
import TaskTimeline from '../components/TaskTimeline'
import { redactSensitiveText } from '../utils/displayRedaction'

const { Text } = Typography
const { TextArea } = Input

const STATUS_MAP: Record<string, { color: string; label: string; icon: ReactNode }> = {
  PENDING: { color: 'default', label: '排队中', icon: <ClockCircleOutlined /> },
  RUNNING: { color: 'processing', label: '生成中', icon: <SyncOutlined spin /> },
  PATCH_READY: { color: 'success', label: '补丁已生成', icon: <CheckCircleOutlined /> },
  PR_RUNNING: { color: 'processing', label: 'PR 创建中', icon: <SyncOutlined spin /> },
  PR_CREATED: { color: 'blue', label: 'PR 已创建', icon: <BranchesOutlined /> },
  FAILED: { color: 'error', label: '已失败', icon: <CloseCircleOutlined /> },
  CANCELLED: { color: 'default', label: '已取消', icon: <StopOutlined /> },
}

const ACTIVE_STATUSES = ['PENDING', 'RUNNING', 'PR_RUNNING']
const TERMINAL_STATUSES = ['PATCH_READY', 'PR_CREATED', 'FAILED', 'CANCELLED']
const PATCH_GENERATION_STEP_KEYS = new Set(['prepare_workspace', 'generate_patch'])
const PR_SUBMISSION_STEP_KEYS = new Set([
  'queued_pull_request',
  'validate_submit_pr_runtime',
  'clone_repository',
  'apply_patch',
  'create_branch',
  'push_branch',
  'create_pull_request',
])

type RepairTone = 'ready' | 'warning' | 'danger' | 'idle'

interface AutoRepairGovernanceStep {
  key: 'candidate-source' | 'patch-generation' | 'review-gate' | 'pr-exit'
  icon: ReactNode
  label: string
  status: string
  detail: string
  tone: RepairTone
  actionLabel: string
  onAction: () => void
}

interface RepairReadinessSignal {
  label: string
  tone: RepairTone
  summary: string
  checks: Array<{
    label: string
    value: string
    tone: RepairTone
  }>
}

type PatchReviewGateStatus = 'ready' | 'warning' | 'blocked' | 'loading'

interface PatchReviewGateItem {
  key: 'sourceScan' | 'diff' | 'patchArtifact' | 'executionTask' | 'auditEvent'
  label: string
  value: string
  status: PatchReviewGateStatus
  blocking: boolean
}

interface PatchReviewGate {
  canSubmitPr: boolean
  blockingItems: PatchReviewGateItem[]
  warningItems: PatchReviewGateItem[]
  items: PatchReviewGateItem[]
}

interface Props {
  projectId: number
  initialRepairId?: number
  initialDraft?: {
    repositoryId?: number
    scanTaskId?: number
    filePath?: string
    targetDesc?: string
    source?: string
    provenance?: AutoRepairProvenance
  }
}

function redactAutoRepairText(value?: string | null): string {
  return redactSensitiveText(value || '')
}

function redactedAutoRepairProvenanceForOutput(provenance: AutoRepairProvenance): AutoRepairProvenance {
  return {
    ...provenance,
    sourceType: provenance.sourceType ? redactAutoRepairText(provenance.sourceType) : provenance.sourceType,
    source: provenance.source ? redactAutoRepairText(provenance.source) : provenance.source,
    filePath: provenance.filePath ? redactAutoRepairText(provenance.filePath) : provenance.filePath,
    citationId: provenance.citationId ? redactAutoRepairText(provenance.citationId) : provenance.citationId,
    sourceLabel: provenance.sourceLabel ? redactAutoRepairText(provenance.sourceLabel) : provenance.sourceLabel,
    groundingStatus: provenance.groundingStatus ? redactAutoRepairText(provenance.groundingStatus) : provenance.groundingStatus,
    citationEnforcementStatus: provenance.citationEnforcementStatus ? redactAutoRepairText(provenance.citationEnforcementStatus) : provenance.citationEnforcementStatus,
    citationEnforcementReason: provenance.citationEnforcementReason ? redactAutoRepairText(provenance.citationEnforcementReason) : provenance.citationEnforcementReason,
    evidenceType: provenance.evidenceType ? redactAutoRepairText(provenance.evidenceType) : provenance.evidenceType,
    evidenceReason: provenance.evidenceReason ? redactAutoRepairText(provenance.evidenceReason) : provenance.evidenceReason,
    sourceEvidenceCategory: provenance.sourceEvidenceCategory ? redactAutoRepairText(provenance.sourceEvidenceCategory) : provenance.sourceEvidenceCategory,
    sourceEvidenceSource: provenance.sourceEvidenceSource ? redactAutoRepairText(provenance.sourceEvidenceSource) : provenance.sourceEvidenceSource,
    sourceEvidenceTitle: provenance.sourceEvidenceTitle ? redactAutoRepairText(provenance.sourceEvidenceTitle) : provenance.sourceEvidenceTitle,
    sourceEvidenceFilePath: provenance.sourceEvidenceFilePath ? redactAutoRepairText(provenance.sourceEvidenceFilePath) : provenance.sourceEvidenceFilePath,
    sourceEvidenceLineNumber: provenance.sourceEvidenceLineNumber ? redactAutoRepairText(provenance.sourceEvidenceLineNumber) : provenance.sourceEvidenceLineNumber,
    sourceEvidenceMatchType: provenance.sourceEvidenceMatchType ? redactAutoRepairText(provenance.sourceEvidenceMatchType) : provenance.sourceEvidenceMatchType,
    repairEvidenceGate: provenance.repairEvidenceGate ? redactAutoRepairText(provenance.repairEvidenceGate) : provenance.repairEvidenceGate,
    repairEvidenceGateReason: provenance.repairEvidenceGateReason ? redactAutoRepairText(provenance.repairEvidenceGateReason) : provenance.repairEvidenceGateReason,
    repairEvidenceGateSource: provenance.repairEvidenceGateSource ? redactAutoRepairText(provenance.repairEvidenceGateSource) : provenance.repairEvidenceGateSource,
    artifactType: provenance.artifactType ? redactAutoRepairText(provenance.artifactType) : provenance.artifactType,
    riskKey: provenance.riskKey ? redactAutoRepairText(provenance.riskKey) : provenance.riskKey,
    riskCategory: provenance.riskCategory ? redactAutoRepairText(provenance.riskCategory) : provenance.riskCategory,
    riskSeverity: provenance.riskSeverity ? redactAutoRepairText(provenance.riskSeverity) : provenance.riskSeverity,
  }
}

export default function AutoRepairs({ projectId, initialRepairId, initialDraft }: Props) {
  const navigate = useNavigate()
  const [items, setItems] = useState<AutoRepair[]>([])
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [submittingPr, setSubmittingPr] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<AutoRepair | null>(null)
  const [executionDetail, setExecutionDetail] = useState<ExecutionTaskDetail | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [reposError, setReposError] = useState<string | null>(null)
  const [executionDetailError, setExecutionDetailError] = useState<string | null>(null)
  const [patchReadyAuditEvidence, setPatchReadyAuditEvidence] = useState<AuditLog | null>(null)
  const [patchReadyAuditLoading, setPatchReadyAuditLoading] = useState(false)
  const [patchReadyAuditError, setPatchReadyAuditError] = useState<string | null>(null)
  const [draftSource, setDraftSource] = useState<string | null>(null)
  const [draftProvenance, setDraftProvenance] = useState<AutoRepairProvenance | undefined>()
  const [candidateReceipt, setCandidateReceipt] = useState<AuditLog | null>(null)
  const [candidateReceiptError, setCandidateReceiptError] = useState<string | null>(null)
  const [form] = Form.useForm()

  // 用于自动刷新运行中的任务
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const appliedInitialRepairIdRef = useRef<number | null>(null)
  const appliedDraftKeyRef = useRef<string | null>(null)
  const executionDetailRequestSeqRef = useRef(0)

  const fetchItems = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    if (!silent) setListError(null)
    autoRepairApi.list(projectId)
      .then(res => {
        const list = res.data.data || []
        setListError(null)
        setItems(list)

        // 如果当前有选中的任务，且其在列表中更新了，同步刷新选中详情
        if (selected) {
          const updatedSelected = list.find(item => item.id === selected.id)
          if (updatedSelected) {
            setSelected(updatedSelected)
          }
        }
      })
      .catch(error => {
        setListError(formatApiError(error, '加载任务列表失败'))
        showApiError(error, '加载任务列表失败')
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [projectId, selected])

  const fetchRepos = useCallback(() => {
    setReposError(null)
    repositoryApi.list(projectId)
      .then(res => {
        setReposError(null)
        setRepos(res.data.data || [])
      })
      .catch(error => {
        setReposError(formatApiError(error, '加载仓库列表失败'))
        showApiError(error, '加载仓库列表失败')
      })
  }, [projectId])

  const fetchExecutionDetail = useCallback((repairId: number) => {
    const requestSeq = executionDetailRequestSeqRef.current + 1
    executionDetailRequestSeqRef.current = requestSeq
    setExecutionDetail(null)
    setExecutionDetailError(null)
    executionTaskApi.detailBySource(projectId, 'AUTO_REPAIR', repairId)
      .then(res => {
        if (executionDetailRequestSeqRef.current !== requestSeq) return
        if (res.data.data.task.sourceId !== repairId) return
        setExecutionDetailError(null)
        setExecutionDetail(res.data.data)
      })
      .catch(error => {
        if (executionDetailRequestSeqRef.current !== requestSeq) return
        setExecutionDetail(null)
        setExecutionDetailError(formatApiError(error, '加载执行证据失败'))
      })
  }, [projectId])

  useEffect(() => {
    fetchItems()
    fetchRepos()
  }, [projectId])

  useEffect(() => {
    appliedInitialRepairIdRef.current = null
    setSelected(null)
  }, [projectId, initialRepairId])

  useEffect(() => {
    const draftKey = initialDraft
      ? JSON.stringify({
          repositoryId: initialDraft.repositoryId,
          scanTaskId: initialDraft.scanTaskId,
          filePath: initialDraft.filePath,
          targetDesc: initialDraft.targetDesc,
          source: initialDraft.source,
          provenance: initialDraft.provenance,
        })
      : null
    if (!initialDraft || !draftKey || appliedDraftKeyRef.current === draftKey) {
      return
    }
    form.setFieldsValue({
      repositoryId: initialDraft.repositoryId,
      scanTaskId: initialDraft.scanTaskId,
      filePath: initialDraft.filePath ? redactAutoRepairText(initialDraft.filePath) : initialDraft.filePath,
      targetDesc: initialDraft.targetDesc ? redactAutoRepairText(initialDraft.targetDesc) : initialDraft.targetDesc,
    })
    setShowCreate(true)
    const safeDraftSource = initialDraft.source ? redactAutoRepairText(initialDraft.source) : undefined
    setDraftSource(initialDraft.scanTaskId
      ? `${safeDraftSource || '扫描报告风险项'}（Scan #${initialDraft.scanTaskId}）`
      : safeDraftSource || '扫描报告风险项')
    setDraftProvenance(initialDraft.provenance)
    appliedDraftKeyRef.current = draftKey
  }, [form, initialDraft])

  useEffect(() => {
    if (!initialRepairId || loading || appliedInitialRepairIdRef.current === initialRepairId) {
      return
    }
    const matched = items.find(item => item.id === initialRepairId)
    if (matched) {
      setSelected(matched)
      appliedInitialRepairIdRef.current = initialRepairId
      return
    }
    appliedInitialRepairIdRef.current = initialRepairId
    autoRepairApi.detail(projectId, initialRepairId)
      .then(res => {
        const detail = res.data.data
        setSelected(detail)
        setItems(prev => prev.some(item => item.id === detail.id) ? prev : [detail, ...prev])
      })
      .catch(error => {
        showApiError(error, `未找到自动修码任务 #${initialRepairId}`)
      })
  }, [initialRepairId, items, loading, projectId])

  useEffect(() => {
    if (!selected) {
      executionDetailRequestSeqRef.current += 1
      setExecutionDetail(null)
      setExecutionDetailError(null)
      return
    }
    fetchExecutionDetail(selected.id)
  }, [selected?.id, fetchExecutionDetail])

  const fetchCandidateReceipt = useCallback((repair: AutoRepair, shouldApply: () => boolean = () => true) => {
    setCandidateReceipt(null)
    setCandidateReceiptError(null)
    auditApi.listProjectLogs(projectId, {
      page: 1,
      pageSize: 1,
      resourceType: 'AUTO_REPAIR',
      resourceId: repair.id,
      action: 'AUTO_REPAIR_CANDIDATE_CREATED',
      status: 'SUCCESS',
    })
      .then(res => {
        if (!shouldApply()) return
        const match = (res.data.data?.items || []).find(log =>
          log.resourceType === 'AUTO_REPAIR'
          && log.resourceId === repair.id
          && log.action === 'AUTO_REPAIR_CANDIDATE_CREATED'
          && log.status === 'SUCCESS')
        setCandidateReceipt(match || null)
      })
      .catch(error => {
        if (shouldApply()) {
          setCandidateReceipt(null)
          setCandidateReceiptError(formatApiError(error, '加载候选来源凭证失败'))
        }
      })
  }, [projectId])

  useEffect(() => {
    if (!selected) {
      setCandidateReceipt(null)
      setCandidateReceiptError(null)
      return
    }

    let cancelled = false
    fetchCandidateReceipt(selected, () => !cancelled)
    return () => {
      cancelled = true
    }
  }, [fetchCandidateReceipt, selected?.id])

  const fetchPatchReadyAuditEvidence = useCallback((repair: AutoRepair, shouldApply: () => boolean = () => true) => {
    setPatchReadyAuditEvidence(null)
    setPatchReadyAuditError(null)
    setPatchReadyAuditLoading(true)
    auditApi.listProjectLogs(projectId, {
      page: 1,
      pageSize: 1,
      resourceType: 'AUTO_REPAIR',
      resourceId: repair.id,
      action: 'AUTO_REPAIR_PATCH_READY',
      status: 'SUCCESS',
    })
      .then(res => {
        if (!shouldApply()) return
        const match = (res.data.data?.items || []).find(log =>
          log.resourceType === 'AUTO_REPAIR'
          && log.resourceId === repair.id
          && log.action === 'AUTO_REPAIR_PATCH_READY'
          && log.status === 'SUCCESS')
        setPatchReadyAuditEvidence(match || null)
      })
      .catch(error => {
        if (shouldApply()) {
          setPatchReadyAuditEvidence(null)
          setPatchReadyAuditError(formatApiError(error, '加载 PATCH_READY 审计证据失败'))
        }
      })
      .finally(() => {
        if (shouldApply()) setPatchReadyAuditLoading(false)
      })
  }, [projectId])

  useEffect(() => {
    if (!selected || selected.status !== 'PATCH_READY') {
      setPatchReadyAuditEvidence(null)
      setPatchReadyAuditLoading(false)
      setPatchReadyAuditError(null)
      return
    }

    let cancelled = false
    fetchPatchReadyAuditEvidence(selected, () => !cancelled)
    return () => {
      cancelled = true
    }
  }, [fetchPatchReadyAuditEvidence, selected?.id, selected?.status])

  // 当有任务处于运行态时，自动轮询刷新进度
  useEffect(() => {
    const hasRunning = items.some(item => ACTIVE_STATUSES.includes(item.status))
    if (hasRunning) {
      timerRef.current = setTimeout(() => {
        fetchItems(true)
        if (selected && ACTIVE_STATUSES.includes(selected.status)) {
          fetchExecutionDetail(selected.id)
        }
      }, 3000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [items, selected?.id, selected?.status, fetchItems, fetchExecutionDetail])

  const handleSelect = (item: AutoRepair) => {
    setSelected(item)
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setCreating(true)
      const createPayload = draftProvenance ? { ...values, provenance: draftProvenance } : values
      const res = await autoRepairApi.create(projectId, createPayload)
      const created = res.data.data
      message.success('自动补丁任务已提交，正在隔离沙箱中生成 diff...')
      setShowCreate(false)
      setDraftSource(null)
      setDraftProvenance(undefined)
      form.resetFields()
      setItems(prev => upsertAutoRepair(prev, created))
      setSelected(created)
      fetchItems(true)
    } catch (error) {
      showApiError(error, '提交任务失败')
    } finally {
      setCreating(false)
    }
  }

  const handleSubmitPr = async () => {
    if (!selected) return
    const currentExecutionDetail = executionDetail?.task.sourceId === selected.id ? executionDetail : null
    const reviewGate = patchReadyReviewGate(selected, currentExecutionDetail, patchReadyAuditEvidence, patchReadyAuditLoading)
    if (!reviewGate.canSubmitPr) {
      const reason = reviewGate.blockingItems.map(item => item.label).join('、') || '复核证据'
      message.error(`创建 PR 已阻止：请先补齐 ${reason}`)
      return
    }
    setSubmittingPr(true)
    try {
      const res = await autoRepairApi.submitPr(projectId, selected.id)
      const updated = res.data.data
      setSelected(updated)
      setItems(prev => prev.map(item => item.id === updated.id ? updated : item))
      fetchExecutionDetail(updated.id)
      message.success('Pull Request 创建已启动')
    } catch (error) {
      showApiError(error, '创建 Pull Request 失败')
    } finally {
      setSubmittingPr(false)
    }
  }

  const handleCancelRepair = async (repair: AutoRepair) => {
    setCancellingId(repair.id)
    try {
      const res = await autoRepairApi.cancel(projectId, repair.id)
      const updated = res.data.data
      setSelected(prev => prev?.id === updated.id ? updated : prev)
      setItems(prev => prev.map(item => item.id === updated.id ? updated : item))
      fetchExecutionDetail(updated.id)
      message.success('自动修复任务已取消')
    } catch (error) {
      showApiError(error, '取消自动修复任务失败')
    } finally {
      setCancellingId(null)
    }
  }

  const activeCount = items.filter(item => ACTIVE_STATUSES.includes(item.status)).length
  const patchReadyCount = items.filter(item => item.status === 'PATCH_READY').length
  const prCreatedCount = items.filter(item => item.status === 'PR_CREATED').length
  const failedCount = items.filter(item => item.status === 'FAILED').length
  const completedCount = items.filter(item => TERMINAL_STATUSES.includes(item.status)).length
  const sourceBoundCount = items.filter(item => Boolean(item.scanTaskId)).length
  const manualCandidateCount = items.length - sourceBoundCount
  const selectedMeta = selected ? STATUS_MAP[selected.status] || { color: 'default', label: selected.status, icon: null } : null
  const selectedProgress = selected ? repairProgress(selected.status) : 0
  const selectedExecutionDetail = selected && executionDetail?.task.sourceId === selected.id ? executionDetail : null
  const selectedReadiness = selected ? repairReadiness(selected, selectedExecutionDetail) : null
  const selectedAuditUrl = selected ? patchReadyAuditUrl(projectId, selected) : ''
  const selectedExecutionUrl = selectedExecutionDetail?.task.id
    ? `/execution-tasks?projectId=${projectId}&taskId=${selectedExecutionDetail.task.id}`
    : `/execution-tasks?projectId=${projectId}`
  const selectedReviewGate = selected
    ? patchReadyReviewGate(selected, selectedExecutionDetail, patchReadyAuditEvidence, patchReadyAuditLoading)
    : null
  const selectedDetailId = selected ? `autorepair-detail-${selected.id}` : undefined
  const selectedTitleId = selected ? `autorepair-detail-title-${selected.id}` : undefined
  const governanceLoopSteps = useMemo<AutoRepairGovernanceStep[]>(() => [
    {
      key: 'candidate-source',
      icon: <FileTextOutlined />,
      label: '候选来源',
      status: items.length === 0 ? '待接入' : `${sourceBoundCount}/${items.length} 扫描绑定`,
      detail: manualCandidateCount > 0
        ? `${manualCandidateCount} 个人工候选保留身份，不伪装为扫描来源。`
        : '扫描风险、QA 候选或人工候选进入同一补丁队列，来源身份必须可追溯。',
      tone: items.length === 0 ? 'idle' : manualCandidateCount > 0 ? 'warning' : 'ready',
      actionLabel: '新建候选',
      onAction: () => {
        setDraftSource(null)
        setDraftProvenance(undefined)
        setShowCreate(true)
      },
    },
    {
      key: 'patch-generation',
      icon: <CodeOutlined />,
      label: '补丁生成',
      status: activeCount > 0 ? `${activeCount} 执行中` : `${patchReadyCount} 已就绪`,
      detail: activeCount > 0
        ? '隔离沙箱正在生成 diff 或 PR attempt；运行态只证明任务在执行，不证明补丁正确。'
        : patchReadyCount > 0
          ? '已有 PATCH_READY 候选，必须继续完成 diff、产物、执行步骤和审计复核。'
          : '暂无可审查补丁，后续从扫描风险、CI 诊断或人工候选创建。',
      tone: activeCount > 0 ? 'warning' : patchReadyCount > 0 ? 'ready' : 'idle',
      actionLabel: '刷新证据',
      onAction: () => fetchItems(),
    },
    {
      key: 'review-gate',
      icon: <SafetyCertificateOutlined />,
      label: '审查门禁',
      status: selectedReviewGate
        ? selectedReviewGate.canSubmitPr ? '允许 PR' : `${selectedReviewGate.blockingItems.length} 阻塞`
        : patchReadyCount > 0 ? '待选择' : '待生成',
      detail: selectedReviewGate
        ? selectedReviewGate.canSubmitPr
          ? '当前选中任务已通过 PR 前复核；这不等同于代码质量或业务正确性证明。'
          : `当前选中任务缺少 ${selectedReviewGate.blockingItems.map(item => item.label).join('、') || '复核证据'}。`
        : '选择 PATCH_READY 任务后检查来源、diff、补丁产物、执行步骤和审计事件。',
      tone: selectedReviewGate ? selectedReviewGate.canSubmitPr ? 'ready' : 'danger' : patchReadyCount > 0 ? 'warning' : 'idle',
      actionLabel: selected ? '查看详情' : '选择任务',
      onAction: () => {
        document
          .querySelector(selected ? '.sl-autorepair-detail-card' : '.sl-autorepair-table-card')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      },
    },
    {
      key: 'pr-exit',
      icon: <BranchesOutlined />,
      label: 'PR 出口',
      status: prCreatedCount > 0 ? `${prCreatedCount} 已创建` : failedCount > 0 ? `${failedCount} 失败待复盘` : '未进入 PR',
      detail: prCreatedCount > 0
        ? 'PR 已创建仍需人工 review、CI 和审计复盘，不代表已合入生产。'
        : failedCount > 0
          ? '失败任务必须保留日志、diff 和审计线索，不能覆盖 PATCH_READY 证据。'
          : '默认停在可审查 patch，只有门禁通过才允许进入 PR。',
      tone: prCreatedCount > 0 ? 'ready' : failedCount > 0 ? 'warning' : 'idle',
      actionLabel: '查看队列',
      onAction: () => document.querySelector('.sl-autorepair-table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    },
  ], [
    activeCount,
    failedCount,
    fetchItems,
    items.length,
    manualCandidateCount,
    patchReadyCount,
    prCreatedCount,
    selected,
    selectedReviewGate,
    sourceBoundCount,
  ])

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    {
      title: '文件路径',
      dataIndex: 'filePath',
      key: 'filePath',
      ellipsis: true,
      render: (path: string, record: AutoRepair) => (
        <ActionButton type="link" className="sl-inline-link" icon={<CodeOutlined />} onClick={() => handleSelect(record)} label={redactAutoRepairText(path)} />
      )
    },
    {
      title: '修改目标',
      dataIndex: 'targetDesc',
      key: 'targetDesc',
      ellipsis: true,
      render: (targetDesc: string) => redactAutoRepairText(targetDesc),
    },
    {
      title: '来源扫描',
      dataIndex: 'scanTaskId',
      key: 'scanTaskId',
      width: 124,
      render: (scanTaskId: number | null) => scanTaskId ? (
        <ActionButton
          type="link"
          size="small"
          className="sl-inline-link"
          icon={<FileTextOutlined />}
          onClick={(event) => {
            event.stopPropagation()
            navigate(`/scan-tasks/${scanTaskId}`)
          }}
          label={`Scan #${scanTaskId}`}
        />
      ) : <Tag>人工</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => {
        const cfg = STATUS_MAP[s] || { color: 'default', label: s, icon: null }
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 108,
      render: (_: unknown, record: AutoRepair) => (
        <ActionButton
          size="small"
          className="sl-autorepair-detail-action"
          icon={<EyeOutlined />}
          onClick={(event) => {
            event.stopPropagation()
            handleSelect(record)
          }}
          aria-label={`查看自动修复任务 #${record.id} 详情`}
          label="详情"
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (t: string) => t ? new Date(t).toLocaleString() : '-'
    }
  ]

  return (
    <div>
      <div className="sl-autorepair-cockpit">
        <section className="sl-autorepair-cockpit-main">
          <div className="sl-kicker">Controlled Patch Workbench</div>
          <h1 className="sl-autorepair-title">受控代码补丁生成</h1>
          <p className="sl-autorepair-desc">
            从扫描风险、人工候选或 Agent 分析进入单文件 patch 工作流，先生成可审查 diff，再按开关进入受控 Pull Request。
          </p>
          <div className="sl-autorepair-status-line">
            <span className={`sl-live-dot ${activeCount > 0 ? 'sl-live-dot-running' : ''}`} />
            <span>{activeCount > 0 ? `${activeCount} 个任务执行中` : '补丁队列待命'}</span>
            <span>{items.length} repairs</span>
            <span>{patchReadyCount} patches ready</span>
          </div>
          <div className="sl-autorepair-actions">
            <ActionButton icon={<ReloadOutlined />} onClick={() => fetchItems()} label="刷新列表" />
            <ActionButton type="primary" icon={<PlusOutlined />} onClick={() => { setDraftSource(null); setDraftProvenance(undefined); setShowCreate(true) }} label="新建修码任务" />
          </div>
        </section>

        <section className="sl-autorepair-boundary-card">
          <div className="sl-autorepair-boundary-head">
            <div>
              <span>Safety boundary</span>
              <strong>默认只生成 Patch</strong>
            </div>
            <SafetyCertificateOutlined />
          </div>
          <div className="sl-autorepair-boundary-list">
            <div><CheckCircleOutlined /> 单文件目标路径校验</div>
            <div><CheckCircleOutlined /> 沙箱克隆与隔离写入</div>
            <div><CheckCircleOutlined /> 人工审查后再创建 PR</div>
          </div>
        </section>
      </div>

      <div className="sl-autorepair-summary-grid">
        <RepairStat icon={<SyncOutlined />} label="执行中" value={activeCount} footnote="排队、生成中或 PR 创建中" tone={activeCount > 0 ? 'warning' : 'idle'} />
        <RepairStat icon={<CheckCircleOutlined />} label="补丁就绪" value={patchReadyCount} footnote="等待人工审查 diff" tone={patchReadyCount > 0 ? 'ready' : 'idle'} />
        <RepairStat icon={<BranchesOutlined />} label="PR 已创建" value={prCreatedCount} footnote="受控集成结果" tone={prCreatedCount > 0 ? 'ready' : 'idle'} />
        <RepairStat icon={<CloseCircleOutlined />} label="失败任务" value={failedCount} footnote={`${completedCount} 个终态任务`} tone={failedCount > 0 ? 'danger' : 'idle'} />
      </div>

      <AutoRepairGovernanceLoop steps={governanceLoopSteps} />

      <div className={`sl-autorepair-workbench ${selected ? 'sl-autorepair-workbench-with-detail' : ''}`}>
        <Card className="sl-section-card sl-autorepair-table-card sl-selectable-table-card" title={<span className="sl-card-title"><FileTextOutlined /> 修复任务列表</span>}>
          {listError && items.length > 0 && (
            <StateBlock
              compact
              tone="error"
              title="自动修复任务刷新失败"
              description={listError}
              action={<ActionButton size="small" icon={<ReloadOutlined />} loading={loading} onClick={() => fetchItems()} label="重试加载" />}
            />
          )}
          <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="middle"
            locale={{
              emptyText: listError ? (
                <StateBlock
                  compact
                  tone="error"
                  title="自动修复任务加载失败"
                  description={listError}
                  action={<ActionButton size="small" icon={<ReloadOutlined />} loading={loading} onClick={() => fetchItems()} label="重试加载" />}
                />
              ) : (
                <StateBlock compact title="暂无自动修复任务" description="从风险项、CI 诊断或人工候选创建补丁任务后会在这里追踪。" />
              ),
            }}
            pagination={{ pageSize: 10, showTotal: total => `共 ${total} 个修复任务` }}
            scroll={{ x: 1080 }}
            onRow={(record) => createSelectableTableRowProps({
              record,
              selected: selected?.id === record.id,
              onSelect: handleSelect,
              controlsId: selectedDetailId,
              label: `AutoRepair #${record.id} ${selected?.id === record.id ? '已选中' : '查看详情'}`,
              className: selected?.id === record.id ? 'sl-autorepair-row-selected' : '',
            })}
          />
        </Card>

        {selected && (
          <Card
            id={selectedDetailId}
            role="region"
            aria-labelledby={selectedTitleId}
            className="sl-section-card sl-autorepair-detail-card"
            title={
              <Space wrap id={selectedTitleId}>
                <Tag color={selectedMeta?.color} icon={selectedMeta?.icon}>{selectedMeta?.label}</Tag>
                <span>任务详情 #{selected.id}</span>
              </Space>
            }
            extra={<ActionButton size="small" onClick={() => setSelected(null)} label="关闭" />}
          >
            <div className="sl-autorepair-detail-stack">
              {selectedReadiness && <RepairReadinessCard signal={selectedReadiness} progress={selectedProgress} />}

              {executionDetailError && (
                <StateBlock
                  compact
                  tone="error"
                  title="执行证据加载失败"
                  description={executionDetailError}
                  action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={() => fetchExecutionDetail(selected.id)} label="重试加载" />}
                />
              )}

              <div className="sl-autorepair-field">
                <Text type="secondary">待修文件相对路径</Text>
                <pre>{redactAutoRepairText(selected.filePath)}</pre>
              </div>

              <div className="sl-autorepair-field">
                <Text type="secondary">修复目标</Text>
                <div className="sl-autorepair-target">{redactAutoRepairText(selected.targetDesc)}</div>
              </div>

              <AutoRepairSourceBridge
                projectId={projectId}
                repair={selected}
                onNavigate={navigate}
              />

              <CandidateProvenanceReceipt
                projectId={projectId}
                repair={selected}
                receipt={candidateReceipt}
                error={candidateReceiptError}
                onNavigate={navigate}
                onRetry={() => fetchCandidateReceipt(selected)}
              />

              {selected.errorMessage && (
                <Alert
                  message="任务运行错误"
                  description={redactAutoRepairText(selected.errorMessage)}
                  type="error"
                  showIcon
                />
              )}

              {ACTIVE_STATUSES.includes(selected.status) && (
                <Alert
                  message={selected.status === 'PR_RUNNING' ? 'Pull Request 创建中' : 'Patch 生成中'}
                  description={selected.status === 'PR_RUNNING'
                    ? '后台正在克隆仓库、应用补丁、推送分支并创建 Pull Request。'
                    : 'Agent 正在隔离沙箱中生成补丁，请稍候。'}
                  type="info"
                  showIcon
                  action={
                    <Popconfirm
                      title="取消自动修复任务？"
                      description="任务会在下一个检查点停止，已生成的终态产物不会被删除。"
                      okText="取消任务"
                      cancelText="返回"
                      onConfirm={() => handleCancelRepair(selected)}
                    >
                      <ActionButton danger icon={<StopOutlined />} loading={cancellingId === selected.id} label="取消" />
                    </Popconfirm>
                  }
                />
              )}

              {selected.status === 'PATCH_READY' && (
                <>
                  {patchReadyAuditError && (
                    <StateBlock
                      compact
                      tone="error"
                      title="PATCH_READY 审计证据加载失败"
                      description={patchReadyAuditError}
                      action={<ActionButton size="small" icon={<ReloadOutlined />} loading={patchReadyAuditLoading} onClick={() => fetchPatchReadyAuditEvidence(selected)} label="重试加载" />}
                    />
                  )}
                  <PatchReviewChecklist
                    projectId={projectId}
                    repair={selected}
                    reviewGate={selectedReviewGate!}
                    auditUrl={selectedAuditUrl}
                    executionUrl={selectedExecutionUrl}
                    onOpenScan={(scanTaskId) => navigate(`/scan-tasks/${scanTaskId}`)}
                    onOpenAudit={() => navigate(selectedAuditUrl)}
                    onOpenExecution={() => navigate(selectedExecutionUrl)}
                  />
                  <Alert
                    message="补丁已生成"
                    description={selectedReviewGate?.canSubmitPr
                      ? 'PR 前复核门禁已通过。确认来源、diff、补丁产物、执行步骤和审计事件后，再进入受控 Pull Request。'
                      : 'PR 前复核门禁未通过。缺少关键证据时禁止创建 Pull Request，人工候选缺少来源扫描仅作为风险提示。'}
                    type={selectedReviewGate?.canSubmitPr ? 'success' : 'warning'}
                    showIcon
                    action={
                      <Space wrap>
                        <ArtifactLinkButton
                          projectId={projectId}
                          ownerType="AUTO_REPAIR"
                          ownerId={selected.id}
                          label="查看补丁产物"
                        />
                        {selectedReviewGate?.canSubmitPr ? (
                          <Popconfirm
                            title="创建受控 Pull Request？"
                            overlayClassName="sl-autorepair-pr-popconfirm"
                            description={
                              <PatchReadyPrConfirmSummary
                                repair={selected}
                                reviewGate={selectedReviewGate}
                                candidateReceipt={candidateReceipt}
                                auditUrl={selectedAuditUrl}
                                executionUrl={selectedExecutionUrl}
                              />
                            }
                            okText="创建 PR"
                            cancelText="返回审查"
                            onConfirm={handleSubmitPr}
                          >
                            <ActionButton
                              type="primary"
                              icon={<BranchesOutlined />}
                              loading={submittingPr}
                              label="创建 PR"
                            />
                          </Popconfirm>
                        ) : (
                          <ActionButton
                            type="primary"
                            icon={<BranchesOutlined />}
                            disabled
                            loading={submittingPr}
                            aria-label="创建 PR（复核未通过）"
                            label="创建 PR"
                          />
                        )}
                      </Space>
                    }
                  />
                </>
              )}

              {selected.status === 'PR_CREATED' && selected.prUrl && (
                <Alert
                  message="Pull Request 已创建"
                  description={selected.branchName ? `分支：${redactAutoRepairText(selected.branchName)}` : undefined}
                  type="info"
                  showIcon
                  action={
                    <ActionButton
                      icon={<LinkOutlined />}
                      href={selected.prUrl}
                      target="_blank"
                      rel="noreferrer"
                      label="打开 PR"
                    />
                  }
                />
              )}

              {selectedExecutionDetail && (
                <AutoRepairAttemptTimeline repair={selected} detail={selectedExecutionDetail} />
              )}

              {selected.testLog && (
                <Collapse
                  ghost
                  size="small"
                  items={[
                    {
                      key: 'log',
                      label: (
                        <Space>
                          <CodeOutlined />
                          <Text strong>补丁生成日志</Text>
                        </Space>
                      ),
                      children: (
                        <LogViewer value={selected.testLog} />
                      )
                    }
                  ]}
                />
              )}

              <div>
                <div className="sl-autorepair-section-title">Patch Diff 变动对比</div>
                <DiffViewer diff={selected.diffContent} maxHeight={420} />
              </div>

              {(selected.status === 'RUNNING' || selected.status === 'PR_RUNNING') && (
                <StateBlock
                  tone="loading"
                  title={selected.status === 'PR_RUNNING' ? '正在创建 Pull Request' : '正在生成补丁'}
                  description={selected.status === 'PR_RUNNING'
                    ? '后台正在创建 Pull Request，请稍候。'
                    : 'Agent 正在隔离沙箱中生成补丁，请稍候。'}
                />
              )}
            </div>
          </Card>
        )}
      </div>

      {/* 创建任务模态弹窗 */}
      <Modal
        title="发起自动补丁生成任务"
        open={showCreate}
        forceRender
        rootClassName="sl-autorepair-create-modal-root"
        className="sl-autorepair-create-modal"
        onCancel={() => { setShowCreate(false); setDraftSource(null); setDraftProvenance(undefined); form.resetFields() }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="开始生成补丁"
        cancelText="取消"
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="scanTaskId" hidden>
            <Input type="hidden" />
          </Form.Item>

          {draftSource && (
            <Alert
              type="info"
              showIcon
              message={`已从${draftSource}带入修复候选`}
              description="请复核仓库、文件路径和修复目标后再提交。自动修复会先生成可审查 patch，不会直接写回源仓库。"
              style={{ marginBottom: 14 }}
            />
          )}
          {draftProvenance && (
            <AutoRepairDraftReceipt provenance={draftProvenance} />
          )}
          {reposError && (
            <StateBlock
              compact
              tone="error"
              title="仓库列表加载失败"
              description={reposError}
              action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={fetchRepos} label="重试加载" />}
            />
          )}
          <Form.Item
            name="repositoryId"
            label="关联仓库"
            rules={[{ required: true, message: '请选择关联的代码仓库' }]}
          >
            <Select placeholder="请选择要修改的代码仓库">
              {repos.map(r => (
                <Select.Option key={r.id} value={r.id}>
                  {r.name} ({r.url})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="filePath"
            label="待修文件相对路径"
            rules={[{ required: true, message: '请输入要修改的文件相对路径，如 src/main/java/...java' }]}
            tooltip="必须是仓库中的有效文件路径"
          >
            <Input placeholder="例如: README.md 或 src/main/java/com/sourcelens/App.java" />
          </Form.Item>

          <Form.Item
            name="targetDesc"
            label="修改的具体目标描述"
            rules={[{ required: true, message: '请输入具体的修改目标' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入你想让大模型如何自动修改此文件，描述越精准大模型改写效果越好。&#10;例如：&#10;- 在 README.md 末尾添加关于项目的全新说明说明。&#10;- 修复 ClassA.java 中第 45 行的方法，增加空指针防御。"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function AutoRepairDraftReceipt({ provenance }: { provenance: AutoRepairProvenance }) {
  const displayProvenance = redactedAutoRepairProvenanceForOutput(provenance)
  const sourceType = String(provenance.sourceType || 'MANUAL_CANDIDATE')
  const lineRange = provenance.startLine || provenance.endLine
    ? `${provenance.startLine || '?'}-${provenance.endLine || '?'}`
    : provenance.lineNumber
      ? `Line ${provenance.lineNumber}`
      : '-'
  const fields = [
    ['来源类型', redactAutoRepairText(sourceType)],
    ['Scan', provenance.scanTaskId ? `#${provenance.scanTaskId}` : '-'],
    ['文件', displayProvenance.filePath || '-'],
    ['引用', displayProvenance.sourceLabel || displayProvenance.citationId || '-'],
    ['Chunk', provenance.chunkId ? `#${provenance.chunkId}` : '-'],
    ['行号', lineRange],
    ['Grounding', displayProvenance.groundingStatus || '-'],
    ['Citation Gate', displayProvenance.citationEnforcementStatus || '-'],
    ['Citation Reason', displayProvenance.citationEnforcementReason || '-'],
    ['报告证据', displayProvenance.sourceEvidenceTitle || displayProvenance.sourceEvidenceFilePath || '-'],
    ['报告来源', displayProvenance.sourceEvidenceSource || displayProvenance.sourceEvidenceCategory || '-'],
    ['报告位置', displayProvenance.sourceEvidenceFilePath
      ? `${displayProvenance.sourceEvidenceFilePath}${displayProvenance.sourceEvidenceLineNumber ? `:${displayProvenance.sourceEvidenceLineNumber}` : ''}`
      : '-'],
    ['风险类别', displayProvenance.riskCategory || '-'],
    ['风险级别', displayProvenance.riskSeverity || '-'],
    ['Risk Key', displayProvenance.riskKey || '-'],
  ]

  return (
    <section className="sl-autorepair-draft-receipt" aria-label="修复候选草稿凭证">
      <div className="sl-autorepair-draft-head">
        <div>
          <span>Candidate Draft Receipt</span>
          <strong>提交前先核对来源凭证</strong>
        </div>
        <Tag color={sourceType === 'MANUAL_CANDIDATE' ? 'gold' : 'green'}>{sourceType}</Tag>
      </div>
      <div className="sl-autorepair-draft-grid">
        {fields.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="sl-autorepair-draft-note">
        这里只展示白名单来源字段，不展示完整问题、回答、原始代码或 prompt；提交后仍需在补丁详情页复核审计凭证。
      </p>
    </section>
  )
}

function RepairStat({
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
  tone: RepairTone
}) {
  return (
    <div className={`sl-autorepair-stat sl-autorepair-stat-${tone}`}>
      <div className="sl-autorepair-stat-head">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{footnote}</small>
    </div>
  )
}

function AutoRepairGovernanceLoop({ steps }: { steps: AutoRepairGovernanceStep[] }) {
  return (
    <section className="sl-autorepair-governance-loop" aria-label="自动修复候选治理闭环">
      <div className="sl-autorepair-governance-head">
        <div>
          <span>AutoRepair Governance Loop</span>
          <h2>自动修复候选治理闭环</h2>
          <p>把候选来源、补丁生成、PR 前审查和 PR 出口放到同一条受控链路，避免把“已生成 patch”误读成“已验证修复”。</p>
        </div>
        <Tag color="blue">Page-level gate</Tag>
      </div>
      <div className="sl-autorepair-governance-grid">
        {steps.map(step => (
          <div
            className={`sl-autorepair-governance-step sl-autorepair-governance-step-${step.tone}`}
            data-sl-autorepair-governance-step={step.key}
            key={step.key}
          >
            <div className="sl-autorepair-governance-step-head">
              <span className="sl-autorepair-governance-icon" aria-hidden="true">{step.icon}</span>
              <Tag color={repairToneColor(step.tone)}>{step.label}</Tag>
            </div>
            <div className="sl-autorepair-governance-copy">
              <span>{step.status}</span>
              <strong>{step.detail}</strong>
            </div>
            <ActionButton size="small" type="text" onClick={step.onAction} label={step.actionLabel} />
          </div>
        ))}
      </div>
    </section>
  )
}

function RepairReadinessCard({ signal, progress }: { signal: RepairReadinessSignal; progress: number }) {
  return (
    <div className={`sl-autorepair-readiness sl-autorepair-readiness-${signal.tone}`}>
      <div className="sl-autorepair-readiness-head">
        <div>
          <span>Patch readiness</span>
          <strong>{signal.summary}</strong>
        </div>
        <Tag color={repairToneColor(signal.tone)}>{signal.label}</Tag>
      </div>
      <Progress percent={progress} showInfo={false} />
      <div className="sl-autorepair-check-grid">
        {signal.checks.map(check => (
          <div className={`sl-autorepair-check sl-autorepair-check-${check.tone}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function AutoRepairAttemptTimeline({
  repair,
  detail,
}: {
  repair: AutoRepair
  detail: ExecutionTaskDetail
}) {
  const attemptsById = buildAttemptsById(detail)
  const patchSteps = detail.steps.filter(isPatchGenerationStep)
  const prSteps = detail.steps.filter(isPrSubmissionStep)
  const patchAttemptIds = attemptIdsFromSteps(patchSteps)
  const prAttemptIds = attemptIdsFromSteps(prSteps)
  const patchAttempts = detail.attempts.filter(attempt => patchAttemptIds.has(attempt.id))
  const inferredPatchAttempt = patchAttempts.length ? patchAttempts : detail.attempts.slice(0, 1)
  const prAttempts = detail.attempts.filter(attempt => (
    prAttemptIds.has(attempt.id)
    || (!patchAttemptIds.has(attempt.id) && inferredPatchAttempt.some(patchAttempt => attempt.attemptNo > patchAttempt.attemptNo))
  ))
  const patchEvidenceReady = Boolean(successfulPatchGenerationStep(detail))
  const prAttemptFailed = prAttempts.some(attempt => attempt.status === 'FAILED' || attempt.status === 'CANCELLED')

  return (
    <div>
      <div className="sl-autorepair-section-title">执行尝试</div>
      <div className="sl-autorepair-attempt-grid">
        <AttemptStagePanel
          title="Patch generation attempt"
          stageLabel="Patch generation"
          attempts={inferredPatchAttempt}
          steps={patchSteps.length ? patchSteps : detail.steps.filter(step => (
            step.attemptId !== null && inferredPatchAttempt.some(attempt => attempt.id === step.attemptId)
          ))}
          attemptsById={attemptsById}
          emptyText="等待补丁生成执行证据"
        />
        <AttemptStagePanel
          title="PR submission attempt"
          stageLabel="PR submission"
          attempts={prAttempts}
          steps={prSteps}
          attemptsById={attemptsById}
          emptyText={repair.status === 'PATCH_READY'
            ? 'PR submission not started / 等待人工创建 PR'
            : '等待 PR submission attempt 执行证据'}
        />
      </div>
      {patchEvidenceReady && prAttemptFailed && (
        <Alert
          type="warning"
          showIcon
          message="补丁证据仍可复用"
          description="generate_patch SUCCESS 已作为历史证据保留；PR submission attempt 失败或取消不会反向污染已生成的 patch。"
        />
      )}
      {!!detail.steps.length && (
        <div className="sl-autorepair-attempt-flat">
          <div className="sl-autorepair-section-title">执行步骤</div>
          <TaskTimeline
            items={detail.steps.map(step => ({
              key: step.id,
              title: attemptStepTitle(step, attemptsById),
              status: step.status,
              description: redactAutoRepairText(step.errorMessage || step.logSummary || step.status),
              errorMessage: step.errorMessage ? redactAutoRepairText(step.errorMessage) : step.errorMessage,
            }))}
          />
        </div>
      )}
    </div>
  )
}

function AttemptStagePanel({
  title,
  stageLabel,
  attempts,
  steps,
  attemptsById,
  emptyText,
}: {
  title: string
  stageLabel: string
  attempts: ExecutionAttempt[]
  steps: ExecutionStep[]
  attemptsById: Map<number, ExecutionAttempt>
  emptyText: string
}) {
  return (
    <section className="sl-autorepair-attempt-panel" aria-label={title}>
      <div className="sl-autorepair-attempt-panel-head">
        <div>
          <span>{title}</span>
          <strong>{attempts[0] ? `第 ${attempts[0].attemptNo} 次 · ${stageLabel}` : emptyText}</strong>
        </div>
        <Space size={6} wrap>
          {attempts.map(attempt => (
            <Tag key={attempt.id} color={statusColor(attempt.status)}>
              第 {attempt.attemptNo} 次 · {attempt.status}
            </Tag>
          ))}
        </Space>
      </div>
      {attempts.map(attempt => (
        <div className="sl-autorepair-attempt-meta" key={attempt.id}>
          <div>
            <span>当前步骤</span>
            <strong>{attempt.currentStep || '-'}</strong>
          </div>
          <div>
            <span>开始时间</span>
            <strong>{formatTime(attempt.startedAt) || '-'}</strong>
          </div>
          <div>
            <span>结束时间</span>
            <strong>{formatTime(attempt.finishedAt) || '-'}</strong>
          </div>
          {attempt.errorMessage && (
            <div>
              <span>失败原因</span>
              <strong>{redactAutoRepairText(attempt.errorMessage)}</strong>
            </div>
          )}
        </div>
      ))}
      {steps.length ? (
        <TaskTimeline
          items={steps.map(step => ({
            key: step.id,
            title: attemptStepTitle(step, attemptsById),
            status: step.status,
            description: redactAutoRepairText(step.errorMessage || step.logSummary || step.status),
            errorMessage: step.errorMessage ? redactAutoRepairText(step.errorMessage) : step.errorMessage,
          }))}
        />
      ) : (
        <Text type="secondary">{emptyText}</Text>
      )}
    </section>
  )
}

function PatchReviewChecklist({
  projectId,
  repair,
  reviewGate,
  auditUrl,
  executionUrl,
  onOpenScan,
  onOpenAudit,
  onOpenExecution,
}: {
  projectId: number
  repair: AutoRepair
  reviewGate: PatchReviewGate
  auditUrl: string
  executionUrl: string
  onOpenScan: (scanTaskId: number) => void
  onOpenAudit: () => void
  onOpenExecution: () => void
}) {
  const sourceScan = reviewGate.items.find(item => item.key === 'sourceScan')!
  const diff = reviewGate.items.find(item => item.key === 'diff')!
  const patchArtifact = reviewGate.items.find(item => item.key === 'patchArtifact')!
  const executionTask = reviewGate.items.find(item => item.key === 'executionTask')!
  const auditEvent = reviewGate.items.find(item => item.key === 'auditEvent')!
  const blockerCount = reviewGate.blockingItems.length
  const warningCount = reviewGate.warningItems.length

  return (
    <section className="sl-autorepair-review-strip" aria-label="PATCH_READY 补丁审查闭环">
      <div className="sl-autorepair-review-head">
        <div>
          <span>Patch review checklist</span>
          <strong>创建 PR 前完成四项证据复核</strong>
        </div>
        <Space size={6} wrap>
          <Tag color={reviewGate.canSubmitPr ? 'green' : 'red'}>{reviewGate.canSubmitPr ? '允许创建 PR' : '禁止创建 PR'}</Tag>
          <Tag color="green">PATCH_READY</Tag>
        </Space>
      </div>
      <div className="sl-autorepair-review-grid">
        <ReviewItem
          icon={<FileTextOutlined />}
          item={sourceScan}
          action={repair.scanTaskId
            ? <ActionButton size="small" icon={<FileTextOutlined />} onClick={() => onOpenScan(repair.scanTaskId!)} label="打开报告" />
            : undefined}
        />
        <ReviewItem
          icon={<CodeOutlined />}
          item={diff}
        />
        <ReviewItem
          icon={<CodeOutlined />}
          item={patchArtifact}
          action={
            <ArtifactLinkButton
              projectId={projectId}
              ownerType="AUTO_REPAIR"
              ownerId={repair.id}
              label="查看补丁"
            />
          }
        />
        <ReviewItem
          icon={<ClockCircleOutlined />}
          item={executionTask}
          action={<ActionButton size="small" icon={<ClockCircleOutlined />} onClick={onOpenExecution} label="查看任务" />}
        />
        <ReviewItem
          icon={<SafetyCertificateOutlined />}
          item={auditEvent}
          action={<ActionButton size="small" icon={<SafetyCertificateOutlined />} onClick={onOpenAudit} label="打开审计" />}
        />
      </div>
      <div
        className={`sl-autorepair-pr-gate ${reviewGate.canSubmitPr ? 'sl-autorepair-pr-gate-ready' : 'sl-autorepair-pr-gate-blocked'}`}
        role="region"
        aria-label="PR 前复核门禁"
      >
        <div>
          <span>PR 前复核门禁</span>
          <strong>{reviewGate.canSubmitPr ? '允许创建 PR' : `${blockerCount} 个阻塞项`}</strong>
        </div>
        {reviewGate.canSubmitPr ? (
          <Text type="secondary">全部阻塞项已关闭，warning 项 {warningCount} 个。</Text>
        ) : (
          <div className="sl-autorepair-pr-blockers" aria-label="PR 前复核阻塞项">
            {reviewGate.blockingItems.map(item => (
              <Tag color="red" key={item.key}>{item.label}: {item.value}</Tag>
            ))}
          </div>
        )}
      </div>
      <div className="sl-autorepair-review-links">
        <Text type="secondary">审计链接：{auditUrl}</Text>
        <Text type="secondary">执行任务：{executionUrl}</Text>
      </div>
    </section>
  )
}

function ReviewItem({
  icon,
  item,
  action,
}: {
  icon: React.ReactNode
  item: PatchReviewGateItem
  action?: React.ReactNode
}) {
  return (
    <div className={`sl-autorepair-review-item sl-autorepair-review-item-${item.status}`}>
      <div className="sl-autorepair-review-icon" aria-hidden="true">{icon}</div>
      <div className="sl-autorepair-review-copy">
        <span>{item.label}{item.blocking ? '（必需）' : '（提示）'}</span>
        <strong>{item.value}</strong>
      </div>
      {action && <div className="sl-autorepair-review-action">{action}</div>}
    </div>
  )
}

function PatchReadyPrConfirmSummary({
  repair,
  reviewGate,
  candidateReceipt,
  auditUrl,
  executionUrl,
}: {
  repair: AutoRepair
  reviewGate: PatchReviewGate
  candidateReceipt: AuditLog | null
  auditUrl: string
  executionUrl: string
}) {
  const provenance = candidateProvenanceFromAudit(candidateReceipt)
  const candidateGate = provenance ? candidateProvenanceGate(provenance) : null
  const candidateSourceType = provenance ? String(provenance.sourceType || 'MANUAL_CANDIDATE') : null
  const candidateGateSource = provenance?.repairEvidenceGateSource ? String(provenance.repairEvidenceGateSource) : null
  const displayCandidateGate = candidateGate ? redactedRepairReadinessSignalForOutput(candidateGate) : null

  return (
    <div className="sl-autorepair-pr-confirm">
      <div><strong>任务：</strong>AutoRepair #{repair.id} / {redactAutoRepairText(repair.filePath)}</div>
      <div><strong>来源：</strong>{repair.scanTaskId ? `Scan #${repair.scanTaskId}` : '人工候选（无 scanTaskId，已作为 warning）'}</div>
      <div><strong>候选凭证：</strong>{candidateGate ? `${redactAutoRepairText(candidateSourceType)} / ${displayCandidateGate?.label || '-'}` : '未查询到候选来源凭证（不作为 PATCH_READY 硬阻塞）'}</div>
      {candidateGateSource ? <div><strong>候选门禁来源：</strong>{redactAutoRepairText(candidateGateSource)}</div> : null}
      {displayCandidateGate?.summary ? <div><strong>候选门禁原因：</strong>{displayCandidateGate.summary}</div> : null}
      <div><strong>Diff：</strong>{reviewGate.items.find(item => item.key === 'diff')?.value}</div>
      <div><strong>Patch：</strong>{reviewGate.items.find(item => item.key === 'patchArtifact')?.value}</div>
      <div><strong>Execution：</strong>{reviewGate.items.find(item => item.key === 'executionTask')?.value}</div>
      <div><strong>Audit：</strong>{reviewGate.items.find(item => item.key === 'auditEvent')?.value}</div>
      <div><strong>审计入口：</strong>{auditUrl}</div>
      <div><strong>执行入口：</strong>{executionUrl}</div>
      <div>确认后系统会使用受控权限推送补丁分支并创建 PR，不直接写默认分支。</div>
    </div>
  )
}

function buildAttemptsById(detail: ExecutionTaskDetail) {
  return new Map(detail.attempts.map(attempt => [attempt.id, attempt]))
}

function attemptIdsFromSteps(steps: ExecutionStep[]) {
  return new Set(steps.map(step => step.attemptId).filter((attemptId): attemptId is number => attemptId !== null))
}

function isPatchGenerationStep(step: ExecutionStep) {
  return PATCH_GENERATION_STEP_KEYS.has(step.stepKey)
}

function isPrSubmissionStep(step: ExecutionStep) {
  return PR_SUBMISSION_STEP_KEYS.has(step.stepKey)
}

function successfulPatchGenerationStep(detail: ExecutionTaskDetail | null) {
  return detail?.steps.find(step => step.stepKey === 'generate_patch' && step.status === 'SUCCESS') || null
}

function attemptStepTitle(step: ExecutionStep, attemptsById: Map<number, ExecutionAttempt>) {
  if (!step.attemptId) return step.stepName
  const attempt = attemptsById.get(step.attemptId)
  return attempt ? `第 ${attempt.attemptNo} 次 · ${step.stepName}` : step.stepName
}

function AutoRepairSourceBridge({
  projectId,
  repair,
  onNavigate,
}: {
  projectId: number
  repair: AutoRepair
  onNavigate: (url: string) => void
}) {
  const hasScanSource = Boolean(repair.scanTaskId)
  const statusMeta = STATUS_MAP[repair.status] || { label: repair.status, color: 'default', icon: null }
  const scanTaskId = repair.scanTaskId || undefined
  const sourceOrigin = autoRepairSourceOrigin(repair)
  const targetQuestion = buildSourceBridgeQaQuestion(repair)
  const scanReportUrl = scanTaskId ? `/scan-tasks/${scanTaskId}` : ''
  const qaUrl = scanTaskId ? sourceBridgeQaUrl(projectId, scanTaskId, targetQuestion) : ''
  const agentTaskUrl = scanTaskId ? sourceBridgeAgentTaskUrl(projectId, scanTaskId) : ''
  const auditUrl = scanTaskId ? sourceBridgeScanAuditUrl(projectId, scanTaskId, repair) : ''

  const navigateTo = (url: string) => (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    onNavigate(url)
  }

  return (
    <section
      className={`sl-autorepair-source-bridge ${hasScanSource ? 'sl-autorepair-source-bridge-bound' : 'sl-autorepair-source-bridge-manual'}`}
      aria-label="来源扫描闭环"
    >
      <div className="sl-autorepair-source-head">
        <div>
          <span>Scan Source Bridge</span>
          <strong>来源扫描闭环</strong>
        </div>
        <Tag color={hasScanSource ? 'blue' : 'gold'}>
          {hasScanSource ? '扫描绑定' : '人工候选'}
        </Tag>
      </div>

      <div className="sl-autorepair-source-grid">
        <div>
          <span>来源</span>
          <strong>{hasScanSource ? `Scan #${scanTaskId}` : '未绑定扫描来源'}</strong>
        </div>
        <div>
          <span>当前状态</span>
          <strong>{statusMeta.label}</strong>
        </div>
        <div>
          <span>目标文件</span>
          <strong>{redactAutoRepairText(repair.filePath)}</strong>
        </div>
        <div>
          <span>下一步</span>
          <strong>{hasScanSource ? '回到同次扫描核对证据，再进入补丁审查' : '保留人工候选身份，PR 门禁不把 scanTask 作为硬阻塞'}</strong>
        </div>
      </div>

      <p className="sl-autorepair-source-copy">
        {hasScanSource
          ? sourceOrigin.description
          : '该任务没有 scanTaskId，系统不会把它伪装成扫描来源；PATCH_READY 强门禁仍以 diff、补丁产物、执行步骤和审计事件为准。'}
      </p>

      {hasScanSource && scanTaskId && (
        <div className="sl-autorepair-source-actions">
          <ActionButton
            size="small"
            icon={<FileTextOutlined />}
            data-sl-target-url={scanReportUrl}
            onClick={navigateTo(scanReportUrl)}
            label="打开报告"
          />
          <ActionButton
            size="small"
            icon={<SafetyCertificateOutlined />}
            data-sl-target-url={qaUrl}
            onClick={navigateTo(qaUrl)}
            label="QA 复核此文件"
          />
          <ActionButton
            size="small"
            icon={<BranchesOutlined />}
            data-sl-target-url={agentTaskUrl}
            onClick={navigateTo(agentTaskUrl)}
            label="创建 Agent 复核"
          />
          <ActionButton
            size="small"
            icon={<LinkOutlined />}
            data-sl-target-url={auditUrl}
            onClick={navigateTo(auditUrl)}
            label="扫描审计"
          />
        </div>
      )}
    </section>
  )
}

function CandidateProvenanceReceipt({
  projectId,
  repair,
  receipt,
  error,
  onNavigate,
  onRetry,
}: {
  projectId: number
  repair: AutoRepair
  receipt: AuditLog | null
  error: string | null
  onNavigate: (url: string) => void
  onRetry: () => void
}) {
  if (error) {
    return (
      <StateBlock
        compact
        tone="error"
        title="候选来源凭证加载失败"
        description={error}
        action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={onRetry} label="重试加载" />}
      />
    )
  }

  const provenance = candidateProvenanceFromAudit(receipt)
  if (!provenance) {
    return (
      <section className="sl-autorepair-source-bridge sl-autorepair-source-bridge-manual" aria-label="Candidate Provenance Receipt">
        <div className="sl-autorepair-source-head">
          <div>
            <span>Candidate Provenance Receipt</span>
            <strong>候选来源凭证</strong>
          </div>
          <Tag>等待审计</Tag>
        </div>
        <p className="sl-autorepair-source-copy">
          未查询到 AUTO_REPAIR_CANDIDATE_CREATED 审计事件。该凭证只展示白名单来源字段，不展示完整问题、回答、代码或 diff。
        </p>
      </section>
    )
  }

  const sourceType = String(provenance.sourceType || 'MANUAL_CANDIDATE')
  const displayProvenance = redactedAutoRepairProvenanceForOutput(provenance)
  const lineRange = provenance.startLine || provenance.endLine
    ? `${provenance.startLine || '?'}-${provenance.endLine || '?'}`
    : provenance.lineNumber
      ? `Line ${provenance.lineNumber}`
      : '-'
  const fields = [
    ['来源类型', redactAutoRepairText(sourceType)],
    ['Scan', provenance.scanTaskId ? `#${provenance.scanTaskId}` : '-'],
    ['文件', displayProvenance.filePath || '-'],
    ['引用', displayProvenance.sourceLabel || displayProvenance.citationId || '-'],
    ['Chunk', provenance.chunkId ? `#${provenance.chunkId}` : '-'],
    ['行号', lineRange],
    ['回答引用', provenance.citedByAnswer === undefined ? '-' : provenance.citedByAnswer ? '是' : '否'],
    ['Grounding', displayProvenance.groundingStatus || '-'],
    ['Citation Gate', displayProvenance.citationEnforcementStatus || '-'],
    ['Citation Reason', displayProvenance.citationEnforcementReason || '-'],
    ['报告证据', displayProvenance.sourceEvidenceTitle || displayProvenance.sourceEvidenceFilePath || '-'],
    ['报告来源', displayProvenance.sourceEvidenceSource || displayProvenance.sourceEvidenceCategory || '-'],
    ['报告位置', displayProvenance.sourceEvidenceFilePath
      ? `${displayProvenance.sourceEvidenceFilePath}${displayProvenance.sourceEvidenceLineNumber ? `:${displayProvenance.sourceEvidenceLineNumber}` : ''}`
      : '-'],
    ['服务端门禁', displayProvenance.repairEvidenceGate || '-'],
    ['门禁来源', displayProvenance.repairEvidenceGateSource || '-'],
    ['风险类别', displayProvenance.riskCategory || '-'],
    ['风险级别', displayProvenance.riskSeverity || '-'],
    ['Risk Key', displayProvenance.riskKey || '-'],
  ]
  const candidateGate = candidateProvenanceGate(provenance)
  const displayCandidateGate = redactedRepairReadinessSignalForOutput(candidateGate)
  const scanTaskId = provenance.scanTaskId || repair.scanTaskId || undefined
  const targetQuestion = buildCandidateReceiptQaQuestion(repair, provenance, candidateGate)
  const reportUrl = scanTaskId ? `/scan-tasks/${scanTaskId}` : ''
  const qaUrl = scanTaskId ? sourceBridgeQaUrl(projectId, scanTaskId, targetQuestion) : ''
  const auditUrl = autoRepairAuditUrl(projectId, repair.id, scanTaskId)
  const navigateTo = (url: string) => (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    onNavigate(url)
  }

  return (
    <section className="sl-autorepair-source-bridge sl-autorepair-source-bridge-bound" aria-label="Candidate Provenance Receipt">
      <div className="sl-autorepair-source-head">
        <div>
          <span>Candidate Provenance Receipt</span>
          <strong>候选来源凭证</strong>
        </div>
        <Tag color={sourceType === 'MANUAL_CANDIDATE' ? 'gold' : 'green'}>{redactAutoRepairText(sourceType)}</Tag>
      </div>
      <div className="sl-autorepair-source-grid">
        {fields.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className={`sl-candidate-evidence-gate sl-candidate-evidence-gate-${candidateGate.tone}`} aria-label="候选证据门禁">
        <div className="sl-candidate-evidence-gate-head">
          <div>
            <span>候选证据门禁</span>
            <strong>{displayCandidateGate.summary}</strong>
          </div>
          <Tag color={repairToneColor(candidateGate.tone)}>{displayCandidateGate.label}</Tag>
        </div>
        <div className="sl-autorepair-check-grid">
          {displayCandidateGate.checks.map(check => (
            <div className={`sl-autorepair-check sl-autorepair-check-${check.tone}`} key={check.label}>
              <span>{check.label}</span>
              <strong>{check.value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className={`sl-candidate-receipt-action-rail sl-candidate-receipt-action-rail-${candidateGate.tone}`} aria-label="候选凭证复核动作">
        <div className="sl-candidate-receipt-action-copy">
          <span>Receipt Review Actions</span>
          <strong>{candidateReceiptActionSummary(displayCandidateGate)}</strong>
        </div>
        <div className="sl-candidate-receipt-actions">
          {scanTaskId && (
            <ActionButton
              size="small"
              icon={<FileTextOutlined />}
              data-sl-target-url={reportUrl}
              onClick={navigateTo(reportUrl)}
              label="打开来源报告"
            />
          )}
          {scanTaskId && (
            <ActionButton
              size="small"
              icon={<SafetyCertificateOutlined />}
              data-sl-target-url={qaUrl}
              onClick={navigateTo(qaUrl)}
              label="QA 复核凭证"
            />
          )}
          <ActionButton
            size="small"
            icon={<LinkOutlined />}
            data-sl-target-url={auditUrl}
            onClick={navigateTo(auditUrl)}
            label="查看候选审计"
          />
        </div>
      </div>
      <p className="sl-autorepair-source-copy">
        审计动作：AUTO_REPAIR_CANDIDATE_CREATED。该凭证用于证明候选来自 QA 已验证引用、扫描报告风险或人工候选；敏感正文不进入前端凭证视图。
      </p>
    </section>
  )
}

function candidateProvenanceFromAudit(receipt: AuditLog | null): AutoRepairProvenance | null {
  const input = parseAuditInput(receipt)
  const provenance = input?.provenance
  if (!provenance || typeof provenance !== 'object') {
    return null
  }
  return provenance as AutoRepairProvenance
}

function redactedRepairReadinessSignalForOutput(signal: RepairReadinessSignal): RepairReadinessSignal {
  return {
    ...signal,
    label: redactAutoRepairText(signal.label),
    summary: redactAutoRepairText(signal.summary),
    checks: signal.checks.map(check => ({
      ...check,
      label: redactAutoRepairText(check.label),
      value: redactAutoRepairText(check.value),
    })),
  }
}

function candidateProvenanceGate(provenance: AutoRepairProvenance): RepairReadinessSignal {
  const sourceType = String(provenance.sourceType || 'MANUAL_CANDIDATE')
  const hasScan = Boolean(provenance.scanTaskId)
  const hasFile = Boolean(provenance.filePath)
  const hasCitation = Boolean(provenance.sourceLabel || provenance.citationId || provenance.chunkId)
  const hasReportEvidence = Boolean(provenance.sourceEvidenceFilePath || provenance.sourceEvidenceTitle)
  const sourceMatched = provenance.sourceEvidenceMatched === true
  const lineAnchored = provenance.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR'
  const cited = provenance.citedByAnswer === true
  const verified = provenance.groundingStatus === 'VERIFIED'
  const citationGate = successfulCandidateCitationGate(provenance.citationEnforcementStatus)
  const serverGate = normalizedServerRepairEvidenceGate(provenance.repairEvidenceGate)

  if (sourceType === 'PROJECT_QA_VERIFIED_CITATION') {
    const ready = hasScan && hasFile && hasCitation && hasReportEvidence && sourceMatched && lineAnchored && cited && verified && citationGate
    const review = hasScan && hasFile && hasCitation && hasReportEvidence && sourceMatched && cited && verified && citationGate
    const label = serverGate || (ready ? 'READY' : review ? 'REVIEW' : 'BLOCKED')
    const checks = [
      { label: '扫描绑定', value: hasScan ? '已绑定' : '缺失', tone: hasScan ? 'ready' : 'danger' },
      { label: '代码引用', value: hasCitation && cited ? '已引用' : '待复核', tone: hasCitation && cited ? 'ready' : 'danger' },
      { label: '报告证据', value: hasReportEvidence ? '已绑定' : '缺失', tone: hasReportEvidence ? 'ready' : 'warning' },
      { label: '来源锚点', value: provenance.sourceEvidenceMatchType || 'NONE', tone: lineAnchored ? 'ready' : sourceMatched ? 'warning' : 'danger' },
      { label: '引用门禁', value: verified && citationGate ? '已验证' : '未通过', tone: verified && citationGate ? 'ready' : 'danger' },
    ] satisfies RepairReadinessSignal['checks']
    return {
      label,
      tone: repairEvidenceGateTone(label),
      summary: provenance.repairEvidenceGateReason || (ready
        ? 'QA 引用、报告证据和目标文件已形成行级候选闭环'
        : review
          ? 'QA 引用和报告证据已绑定，仍需人工确认具体行号'
          : 'QA 候选来源证据不足，需复核后再推进'),
      checks,
    }
  }

  if (sourceType === 'SCAN_REPORT_RISK') {
    const hasRisk = Boolean(provenance.riskKey || provenance.riskCategory || provenance.riskSeverity)
    const ready = hasScan && hasFile && hasRisk
    const label = serverGate || (ready ? 'READY' : hasScan && hasFile ? 'REVIEW' : 'BLOCKED')
    return {
      label,
      tone: repairEvidenceGateTone(label),
      summary: provenance.repairEvidenceGateReason || (ready
        ? '扫描报告风险已绑定目标文件和风险字段'
        : hasScan && hasFile
          ? '报告风险来源字段不完整，建议复核'
          : '报告风险缺少扫描或目标文件绑定，暂不能推进'),
      checks: [
        { label: '扫描绑定', value: hasScan ? '已绑定' : '缺失', tone: hasScan ? 'ready' : 'danger' },
        { label: '目标文件', value: hasFile ? '已绑定' : '缺失', tone: hasFile ? 'ready' : 'danger' },
        { label: '风险字段', value: hasRisk ? '已记录' : '缺失', tone: hasRisk ? 'ready' : 'warning' },
      ],
    }
  }

  return {
    label: serverGate || 'REVIEW',
    tone: repairEvidenceGateTone(serverGate || 'REVIEW'),
    summary: provenance.repairEvidenceGateReason || '人工候选需要人工确认证据边界',
    checks: [
      { label: '来源类型', value: sourceType, tone: 'warning' },
      { label: '扫描绑定', value: hasScan ? '已绑定' : '缺失', tone: hasScan ? 'ready' : 'warning' },
      { label: '目标文件', value: hasFile ? '已绑定' : '缺失', tone: hasFile ? 'ready' : 'warning' },
    ],
  }
}

function normalizedServerRepairEvidenceGate(gate?: string): RepairReadinessSignal['label'] | null {
  if (gate === 'READY' || gate === 'REVIEW' || gate === 'BLOCKED') return gate
  return null
}

function repairEvidenceGateTone(gate: RepairReadinessSignal['label']): RepairReadinessSignal['tone'] {
  if (gate === 'READY') return 'ready'
  if (gate === 'BLOCKED') return 'danger'
  return 'warning'
}

function successfulCandidateCitationGate(status?: string): boolean {
  return status === 'DIRECT_VERIFIED' || status === 'RETRY_VERIFIED' || status === 'FALLBACK_CITED'
}

function parseAuditInput(receipt: AuditLog | null): any {
  if (!receipt?.inputJson) return null
  try {
    return JSON.parse(receipt.inputJson)
  } catch {
    return null
  }
}

function upsertAutoRepair(items: AutoRepair[], repair: AutoRepair) {
  return items.some(item => item.id === repair.id)
    ? items.map(item => item.id === repair.id ? repair : item)
    : [repair, ...items]
}

function autoRepairSourceOrigin(repair: AutoRepair) {
  if (repair.targetDesc.includes('Project QA 已验证引用')) {
    return {
      label: 'Project QA 已验证引用',
      description: '该修复候选来自 Project QA 已验证引用。审查 patch 时，应回到同一次扫描核对回答引用、代码证据、Agent 任务和审计留痕。',
    }
  }
  return {
    label: '扫描报告风险项',
    description: '该修复候选来自扫描报告风险项。审查 patch 时，应回到同一次扫描核对风险、QA 证据、Agent 任务和审计留痕。',
  }
}

function buildSourceBridgeQaQuestion(repair: AutoRepair) {
  return [
    `请基于 Scan #${repair.scanTaskId} 复核 AutoRepair #${repair.id} 的来源证据。`,
    `目标文件：${redactAutoRepairText(repair.filePath)}`,
    `修复目标：${redactAutoRepairText(repair.targetDesc)}`,
    '请判断该 patch 是否准确覆盖原始风险，并指出需要人工复核的证据缺口。',
  ].join('\n')
}

function buildCandidateReceiptQaQuestion(
  repair: AutoRepair,
  provenance: AutoRepairProvenance,
  candidateGate: RepairReadinessSignal,
) {
  const sourceType = String(provenance.sourceType || 'MANUAL_CANDIDATE')
  const displayProvenance = redactedAutoRepairProvenanceForOutput(provenance)
  const displayCandidateGate = redactedRepairReadinessSignalForOutput(candidateGate)
  return [
    `请复核 AutoRepair #${repair.id} 的候选来源凭证。`,
    `来源类型：${redactAutoRepairText(sourceType)}`,
    `候选门禁：${displayCandidateGate.label} / ${displayCandidateGate.summary}`,
    `目标文件：${displayProvenance.filePath || redactAutoRepairText(repair.filePath)}`,
    `修复目标：${redactAutoRepairText(repair.targetDesc)}`,
    '请核对报告证据、代码引用、候选门禁和审计留痕是否足以支持继续 PATCH 审查。',
  ].join('\n')
}

function sourceBridgeQaUrl(projectId: number, scanTaskId: number, question: string) {
  const params = new URLSearchParams()
  params.set('tab', 'qa')
  params.set('scanTaskId', String(scanTaskId))
  params.set('question', redactAutoRepairText(question).slice(0, 1400))
  return `/projects/${projectId}?${params.toString()}`
}

function sourceBridgeAgentTaskUrl(projectId: number, scanTaskId: number) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('openCreate', '1')
  params.set('scanTaskId', String(scanTaskId))
  return `/agent-tasks?${params.toString()}`
}

function sourceBridgeScanAuditUrl(projectId: number, scanTaskId: number, repair: AutoRepair) {
  return autoRepairAuditUrl(projectId, repair.id, scanTaskId)
}

function autoRepairAuditUrl(projectId: number, repairId: number, scanTaskId?: number) {
  const params = new URLSearchParams()
  params.set('projectId', String(projectId))
  params.set('resourceType', 'AUTO_REPAIR')
  params.set('resourceId', String(repairId))
  if (scanTaskId) {
    params.set('scanTaskId', String(scanTaskId))
  }
  return `/audit-logs?${params.toString()}`
}

function candidateReceiptActionSummary(candidateGate: RepairReadinessSignal) {
  if (candidateGate.label === 'READY') {
    return '候选证据已就绪，先回跳报告、QA 和审计完成交叉复核。'
  }
  if (candidateGate.label === 'BLOCKED') {
    return '候选证据不足，先补扫描、文件、引用或报告锚点后再推进。'
  }
  return '候选证据需要人工复核，优先核对 QA 问答、来源报告和审计留痕。'
}

function statusColor(status: string) {
  if (status === 'SUCCESS' || status === 'PATCH_READY' || status === 'PR_CREATED') return 'green'
  if (status === 'RUNNING' || status === 'PR_RUNNING') return 'processing'
  if (status === 'FAILED') return 'red'
  if (status === 'CANCELLED') return 'default'
  return 'default'
}

function formatTime(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

function patchReadyReviewGate(
  repair: AutoRepair,
  executionDetail: ExecutionTaskDetail | null,
  auditEvidence: AuditLog | null,
  auditLoading: boolean,
): PatchReviewGate {
  const hasDiff = Boolean(repair.diffContent?.trim())
  const hasPatchArtifact = Boolean(repair.patchArtifactPath)
  const executionTask = executionDetail?.task
  const executionSourceBound = executionTask?.sourceType === 'AUTO_REPAIR' && executionTask.sourceId === repair.id
  const patchGenerationStep = successfulPatchGenerationStep(executionDetail)
  const hasPatchGenerationEvidence = executionSourceBound && Boolean(patchGenerationStep)
  const auditMatched = Boolean(
    auditEvidence
    && auditEvidence.resourceType === 'AUTO_REPAIR'
    && auditEvidence.resourceId === repair.id
    && auditEvidence.action === 'AUTO_REPAIR_PATCH_READY'
    && auditEvidence.status === 'SUCCESS'
  )

  const items: PatchReviewGateItem[] = [
    {
      key: 'sourceScan',
      label: '来源扫描',
      value: repair.scanTaskId ? `Scan #${repair.scanTaskId}` : '人工候选',
      status: repair.scanTaskId ? 'ready' : 'warning',
      blocking: false,
    },
    {
      key: 'diff',
      label: 'Diff',
      value: hasDiff ? 'Diff 已生成' : '缺少可审查 diff',
      status: hasDiff ? 'ready' : 'blocked',
      blocking: true,
    },
    {
      key: 'patchArtifact',
      label: '补丁产物',
      value: hasPatchArtifact ? 'CHANGE_PATCH 已归档' : '缺少 patch artifact',
      status: hasPatchArtifact ? 'ready' : 'blocked',
      blocking: true,
    },
    {
	      key: 'executionTask',
	      label: '执行步骤',
	      value: hasPatchGenerationEvidence
	        ? patchGenerationStep?.logSummary || 'generate_patch SUCCESS / Patch evidence retained'
	        : executionTask
	          ? '缺少 generate_patch SUCCESS patch evidence'
	          : '等待执行证据',
      status: hasPatchGenerationEvidence ? 'ready' : 'blocked',
      blocking: true,
    },
    {
      key: 'auditEvent',
      label: '审计事件',
      value: auditLoading
        ? 'AUTO_REPAIR_PATCH_READY 校验中'
        : auditMatched
          ? 'AUTO_REPAIR_PATCH_READY SUCCESS'
          : '缺少 AUTO_REPAIR_PATCH_READY SUCCESS',
      status: auditLoading ? 'loading' : auditMatched ? 'ready' : 'blocked',
      blocking: true,
    },
  ]
  const blockingItems = items.filter(item => item.blocking && item.status !== 'ready')
  const warningItems = items.filter(item => !item.blocking && item.status !== 'ready')

  return {
    canSubmitPr: repair.status === 'PATCH_READY' && blockingItems.length === 0,
    blockingItems,
    warningItems,
    items,
  }
}

function repairProgress(status: string) {
  if (status === 'PENDING') return 12
  if (status === 'RUNNING') return 48
  if (status === 'PATCH_READY') return 76
  if (status === 'PR_RUNNING') return 88
  if (status === 'PR_CREATED') return 100
  if (status === 'FAILED' || status === 'CANCELLED') return 100
  return 0
}

function repairReadiness(repair: AutoRepair, executionDetail: ExecutionTaskDetail | null): RepairReadinessSignal {
  const hasDiff = Boolean(repair.diffContent?.trim())
  const hasPatchArtifact = Boolean(repair.patchArtifactPath)
  const hasSteps = Boolean(executionDetail?.steps.length)
  const hasLog = Boolean(repair.testLog?.trim())

  if (repair.status === 'FAILED') {
    return {
      label: '失败',
      tone: 'danger',
      summary: '补丁生成失败，需要复盘日志',
      checks: [
        { label: 'Diff', value: hasDiff ? '存在' : '缺失', tone: hasDiff ? 'warning' : 'danger' },
        { label: '步骤', value: hasSteps ? '可查看' : '缺失', tone: hasSteps ? 'warning' : 'danger' },
        { label: '日志', value: hasLog ? '可查看' : '缺失', tone: hasLog ? 'warning' : 'danger' },
      ],
    }
  }

  if (repair.status === 'CANCELLED') {
    return {
      label: '已停止',
      tone: 'idle',
      summary: '任务已取消，不会继续写入结果',
      checks: [
        { label: 'Diff', value: hasDiff ? '保留' : '无', tone: hasDiff ? 'warning' : 'idle' },
        { label: '步骤', value: hasSteps ? '可查看' : '无', tone: hasSteps ? 'warning' : 'idle' },
        { label: '远端', value: '未提交', tone: 'ready' },
      ],
    }
  }

  if (ACTIVE_STATUSES.includes(repair.status)) {
    return {
      label: '执行中',
      tone: 'warning',
      summary: repair.status === 'PR_RUNNING' ? 'PR 创建流程进行中' : 'Patch 正在生成',
      checks: [
        { label: '沙箱', value: '运行中', tone: 'warning' },
        { label: 'Diff', value: hasDiff ? '已产生' : '等待', tone: hasDiff ? 'ready' : 'idle' },
        { label: '可取消', value: '是', tone: 'ready' },
      ],
    }
  }

  if (repair.status === 'PR_CREATED') {
    return {
      label: '已集成',
      tone: 'ready',
      summary: '受控 Pull Request 已创建',
      checks: [
        { label: 'Diff', value: hasDiff ? '已审查' : '缺失', tone: hasDiff ? 'ready' : 'warning' },
        { label: 'PR', value: repair.prUrl ? '可打开' : '缺失', tone: repair.prUrl ? 'ready' : 'warning' },
        { label: '分支', value: repair.branchName ? '已生成' : '缺失', tone: repair.branchName ? 'ready' : 'warning' },
      ],
    }
  }

  return {
    label: hasDiff && hasPatchArtifact ? '可审查' : '需复核',
    tone: hasDiff && hasPatchArtifact ? 'ready' : 'warning',
    summary: hasDiff ? 'Patch 已生成，等待人工审查' : 'Patch 产物不完整',
    checks: [
      { label: 'Diff', value: hasDiff ? '已生成' : '缺失', tone: hasDiff ? 'ready' : 'danger' },
      { label: '产物', value: hasPatchArtifact ? '已归档' : '缺失', tone: hasPatchArtifact ? 'ready' : 'warning' },
      { label: '日志', value: hasLog ? '可查看' : '无', tone: hasLog ? 'ready' : 'idle' },
    ],
  }
}

function patchReadyAuditUrl(projectId: number, repair: AutoRepair) {
  const params = new URLSearchParams({
    projectId: String(projectId),
    resourceType: 'AUTO_REPAIR',
    resourceId: String(repair.id),
    action: 'AUTO_REPAIR_PATCH_READY',
    status: 'SUCCESS',
  })
  if (repair.scanTaskId) {
    params.set('scanTaskId', String(repair.scanTaskId))
  }
  return `/audit-logs?${params.toString()}`
}

function repairToneColor(tone: RepairTone) {
  if (tone === 'ready') return 'green'
  if (tone === 'warning') return 'gold'
  if (tone === 'danger') return 'red'
  return 'default'
}
