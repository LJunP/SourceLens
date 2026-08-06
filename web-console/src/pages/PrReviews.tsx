import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Card, Descriptions, Form, Input, Modal, Select, Space,
  Table, Tag, Typography, message
} from 'antd'
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  PlusOutlined,
  PullRequestOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { prReviewApi, PrReview, PrReviewComment } from '../api/prReview'
import { formatApiError, showApiError } from '../api/client'
import ActionButton from '../components/ui/ActionButton'
import IconActionButton from '../components/ui/IconActionButton'
import StateBlock from '../components/ui/StateBlock'
import { createSelectableTableRowProps } from '../components/ui/selectableTableRow'

const { Text, Paragraph } = Typography
const { TextArea } = Input

type ReviewTone = 'ready' | 'warning' | 'danger' | 'idle'

const STATUS_MAP: Record<string, { label: string; color: string; tone: ReviewTone; icon: ReactNode }> = {
  PENDING: { label: '排队中', color: 'default', tone: 'idle', icon: <SyncOutlined /> },
  ANALYZING: { label: '分析中', color: 'processing', tone: 'warning', icon: <SyncOutlined spin /> },
  COMPLETED: { label: '已完成', color: 'success', tone: 'ready', icon: <CheckCircleOutlined /> },
  FAILED: { label: '分析失败', color: 'error', tone: 'danger', icon: <CloseCircleOutlined /> },
}

const RISK_MAP: Record<string, { label: string; color: string; tone: ReviewTone }> = {
  CRITICAL: { label: '严重', color: 'red', tone: 'danger' },
  HIGH: { label: '高', color: 'orange', tone: 'danger' },
  MEDIUM: { label: '中', color: 'gold', tone: 'warning' },
  LOW: { label: '低', color: 'green', tone: 'ready' },
}

const MERGE_MAP: Record<string, { label: string; color: string; tone: ReviewTone }> = {
  MERGE: { label: '可合并', color: 'success', tone: 'ready' },
  CHANGES_REQUESTED: { label: '需修改', color: 'warning', tone: 'warning' },
  BLOCKED: { label: '阻止合并', color: 'error', tone: 'danger' },
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'red',
  ERROR: 'orange',
  WARNING: 'gold',
  INFO: 'blue',
}

interface ReviewRisk {
  category: string
  severity: string
  message: string
}

interface ReviewDecisionSignal {
  label: string
  tone: ReviewTone
  summary: string
  nextAction: string
  checks: Array<{
    label: string
    value: string
    tone: ReviewTone
  }>
}

interface ReviewRepairReadiness {
  ready: boolean
  summary: string
  targetFile: string | null
  checks: Array<{
    label: string
    value: string
    tone: ReviewTone
  }>
}

interface PrGovernanceStep {
  key: 'pr-intake' | 'risk-decision' | 'merge-gate' | 'repair-handoff'
  sequence: string
  label: string
  state: ReviewTone
  status: string
  detail: string
  actionLabel?: string
  actionDisabled?: boolean
  onAction?: () => void
}

interface Props {
  projectId: number
}

export default function PrReviews({ projectId }: Props) {
  const navigate = useNavigate()
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
  const [listError, setListError] = useState<string | null>(null)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const commentsRequestSeq = useRef(0)
  const [form] = Form.useForm()

  const fetchItems = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    prReviewApi.listByProject(projectId, page, 20, statusFilter)
      .then(res => {
        const data = res.data.data
        setListError(null)
        setItems(data.items || [])
        setTotal(data.total)
        setSelected(prev => {
          if (!prev) return prev
          return data.items?.find(item => item.id === prev.id) || null
        })
      })
      .catch(error => {
        setListError(formatApiError(error, '加载 PR 审查失败'))
        showApiError(error, '加载 PR 审查失败')
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [page, projectId, statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const fetchComments = useCallback((id: number) => {
    const requestSeq = commentsRequestSeq.current + 1
    commentsRequestSeq.current = requestSeq
    setCommentsLoading(true)
    setCommentsError(null)
    prReviewApi.listComments(id)
      .then(res => {
        if (commentsRequestSeq.current !== requestSeq) return
        setCommentsError(null)
        setComments(res.data.data || [])
      })
      .catch(error => {
        if (commentsRequestSeq.current !== requestSeq) return
        setCommentsError(formatApiError(error, '加载行级评论失败'))
        showApiError(error, '加载行级评论失败')
      })
      .finally(() => {
        if (commentsRequestSeq.current === requestSeq) {
          setCommentsLoading(false)
        }
      })
  }, [])

  const handleSelect = useCallback((item: PrReview) => {
    commentsRequestSeq.current += 1
    setSelected(item)
    setComments([])
    setCommentsError(null)
    setCommentsLoading(false)
    if (item.status === 'COMPLETED') {
      fetchComments(item.id)
    }
  }, [fetchComments])

  const activeCount = useMemo(() => items.filter(item => item.status === 'PENDING' || item.status === 'ANALYZING').length, [items])
  const blockedCount = useMemo(() => items.filter(item => item.mergeRecommendation === 'BLOCKED').length, [items])
  const changesRequestedCount = useMemo(() => items.filter(item => item.mergeRecommendation === 'CHANGES_REQUESTED').length, [items])
  const mergeReadyCount = useMemo(() => items.filter(item => item.mergeRecommendation === 'MERGE').length, [items])
  const highRiskCount = useMemo(() => items.filter(item => item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL').length, [items])
  const completedReviewCount = useMemo(() => items.filter(item => item.status === 'COMPLETED').length, [items])
  const ciFailureCount = useMemo(() => items.filter(item => item.ciStatus === 'failure').length, [items])
  const selectedRisks = selected ? parseRisks(selected.risks) : []
  const selectedImpactScope = selected ? parseStringList(selected.impactScope) : []
  const selectedTestSuggestions = selected ? parseStringList(selected.testSuggestions) : []
  const selectedChangedFiles = selected ? parseStringList(selected.changedFiles) : []
  const selectedSignal = selected ? buildReviewDecisionSignal(selected, selectedRisks, comments, selectedChangedFiles) : null
  const repairUrl = selected ? autoRepairCandidateUrl(selected, selectedRisks, comments, selectedChangedFiles) : null
  const repairReadiness = selected ? buildReviewRepairReadiness(selected, selectedRisks, comments, selectedChangedFiles) : null
  const selectedCiFailed = selected?.ciStatus === 'failure'
  const governanceLoopSteps = useMemo<PrGovernanceStep[]>(() => [
    {
      key: 'pr-intake',
      sequence: 'R1',
      label: 'PR 输入',
      state: listError ? 'danger' : total > 0 ? 'ready' : 'idle',
      status: listError ? '数据源异常' : total > 0 ? `${total} 条已接入` : '等待 PR',
      detail: listError
        ? 'PR 审查列表加载失败，当前合并和风险状态不可作为准入依据。'
        : 'PR 标题、分支、Diff 摘要、变更文件和 CI 状态进入审查队列；缺少输入时必须先补上下文。',
    },
    {
      key: 'risk-decision',
      sequence: 'R2',
      label: '风险判定',
      state: blockedCount > 0 || highRiskCount > 0 ? 'danger' : changesRequestedCount > 0 ? 'warning' : completedReviewCount > 0 ? 'ready' : 'idle',
      status: blockedCount > 0
        ? `${blockedCount} 个阻止合并`
        : highRiskCount > 0
          ? `${highRiskCount} 个高风险`
          : changesRequestedCount > 0
            ? `${changesRequestedCount} 个需修改`
            : completedReviewCount > 0
              ? `${mergeReadyCount} 个可合并`
              : '等待分析',
      detail: '风险等级、风险点和行级评论共同决定审查结论；PR 审查完成不等于代码质量、业务正确性或安全性已被完全证明。',
    },
    {
      key: 'merge-gate',
      sequence: 'R3',
      label: '合并门禁',
      state: !selected
        ? ciFailureCount > 0 ? 'danger' : 'idle'
        : selected.mergeRecommendation === 'BLOCKED' || selectedCiFailed
          ? 'danger'
          : selected.mergeRecommendation === 'CHANGES_REQUESTED'
            ? 'warning'
            : selected.mergeRecommendation === 'MERGE'
              ? 'ready'
              : 'warning',
      status: !selected
        ? ciFailureCount > 0 ? `${ciFailureCount} 个 CI 失败` : '等待选择 PR'
        : selectedCiFailed
          ? 'CI 失败阻断'
          : MERGE_MAP[selected.mergeRecommendation || '']?.label || '需人工复核',
      detail: !selected
        ? '选择一条 PR 审查后，系统会结合合并建议、CI 状态、风险点和行级评论判断门禁；当前页 CI 失败记录不得直接合并。'
        : selected.mergeRecommendation === 'MERGE' && !selectedCiFailed
          ? '当前只表示审查未发现阻断项，合并前仍需确认测试、部署窗口和人工 review。'
          : '存在 CI 失败、阻断建议或需修改结论时，不应直接合并。',
    },
    {
      key: 'repair-handoff',
      sequence: 'R4',
      label: 'AutoRepair 交接',
      state: repairUrl ? 'ready' : selected ? 'warning' : 'idle',
      status: repairUrl ? '可以交接' : selected ? '交接受阻' : '等待门禁',
      detail: repairUrl
        ? '创建修复候选只传递受控风险和文件上下文，后续仍需补丁审查、CI、人工 review 和审计复盘。'
        : repairReadiness?.summary || '只有仓库、目标文件和风险/评论证据齐全时才开放修复候选交接。',
      actionLabel: repairUrl ? '生成修复候选' : selected ? '补齐修复证据' : '先选择 PR',
      actionDisabled: !repairUrl,
      onAction: repairUrl ? () => navigate(repairUrl) : undefined,
    },
  ], [
    blockedCount,
    changesRequestedCount,
    ciFailureCount,
    completedReviewCount,
    highRiskCount,
    listError,
    mergeReadyCount,
    navigate,
    repairReadiness,
    repairUrl,
    selected,
    selectedCiFailed,
    total,
  ])
  const selectedDetailId = selected ? `pr-review-detail-${selected.id}` : undefined
  const selectedTitleId = selected ? `pr-review-detail-title-${selected.id}` : undefined

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setCreating(true)
      await prReviewApi.create({ ...values, projectId })
      message.success('PR 审查已创建，正在分析...')
      setShowCreate(false)
      form.resetFields()
      fetchItems(true)
    } catch (error: any) {
      if (error?.errorFields) return
      showApiError(error, '创建 PR 审查失败')
    } finally {
      setCreating(false)
    }
  }

  const handleReanalyze = async (id: number) => {
    try {
      await prReviewApi.reanalyze(id)
      message.success('重新分析已触发')
      fetchItems(true)
    } catch (error) {
      showApiError(error, '重新分析失败')
    }
  }

  const columns = [
    {
      title: 'PR',
      key: 'pr',
      ellipsis: true,
      render: (_: unknown, record: PrReview) => (
        <ActionButton
          type="link"
          className="sl-pr-table-link"
          onClick={(event) => {
            event.stopPropagation()
            handleSelect(record)
          }}
          label={record.prTitle || `PR #${record.prNumber || record.id}`}
        />
      ),
    },
    {
      title: '决策',
      dataIndex: 'mergeRecommendation',
      key: 'mergeRecommendation',
      width: 118,
      render: (decision: string) => {
        const cfg = MERGE_MAP[decision] || { label: decision || '-', color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '风险',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 92,
      render: (risk: string) => {
        const cfg = RISK_MAP[risk] || { label: risk || '-', color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
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
      title: '分支',
      key: 'branch',
      width: 170,
      render: (_: unknown, record: PrReview) => record.branch
        ? <Tag>{record.branch} {'->'} {record.baseBranch || 'main'}</Tag>
        : '-',
    },
    {
      title: 'CI',
      dataIndex: 'ciStatus',
      key: 'ciStatus',
      width: 92,
      render: (status: string) => ciStatusTag(status),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 96,
      render: (author: string) => author || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 92,
      render: (_: unknown, record: PrReview) => (
        <IconActionButton
          label={`重新分析 PR 审查 #${record.id}`}
          tooltip="重新分析"
          size="small"
          icon={<ReloadOutlined />}
          onClick={(event) => { event.stopPropagation(); handleReanalyze(record.id) }}
        />
      ),
    },
  ]

  return (
    <div className="sl-pr-page">
      <div className="sl-pr-cockpit">
        <section className="sl-pr-cockpit-main">
          <span className="sl-kicker">Pull Request Governance</span>
          <h1 className="sl-pr-title">PR 风险审查与合并决策</h1>
          <p className="sl-pr-desc">
            将 PR 变更摘要、风险、行级评论、CI 状态和测试建议聚合成可执行的合并决策，并为高风险改动提供自动修复入口。
          </p>
          <div className="sl-pr-status-line">
            <span className="sl-live-dot" />
            <span>{activeCount > 0 ? `${activeCount} 个审查正在排队或分析` : '当前无运行中的 PR 审查'}</span>
            <span>{blockedCount} 个阻止合并</span>
            <span>{highRiskCount} 个高风险 PR</span>
          </div>
          <div className="sl-pr-actions">
            <Select
              allowClear
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              options={Object.keys(STATUS_MAP).map(status => ({ label: STATUS_MAP[status].label, value: status }))}
            />
            <ActionButton icon={<ReloadOutlined />} onClick={() => fetchItems(true)} label="刷新" />
            <ActionButton type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)} label="新建审查" />
          </div>
        </section>

        <section className="sl-pr-boundary-card">
          <div className="sl-pr-boundary-head">
            <SafetyCertificateOutlined />
            <div>
              <span>Review boundary</span>
              <strong>先审查 / 再合并 / 可追踪</strong>
            </div>
          </div>
          <div className="sl-pr-boundary-list">
            <div><CheckCircleOutlined /> 高风险与 CI 失败默认阻止合并</div>
            <div><CheckCircleOutlined /> 行级评论沉淀到审查记录</div>
            <div><CheckCircleOutlined /> 修复建议进入 AutoRepair 审核</div>
          </div>
        </section>
      </div>

      <div className="sl-pr-summary-grid">
        <PrStat icon={<SyncOutlined />} label="运行中" value={activeCount} tone={activeCount > 0 ? 'warning' : 'idle'} />
        <PrStat icon={<CloseCircleOutlined />} label="阻止合并" value={blockedCount} tone={blockedCount > 0 ? 'danger' : 'idle'} />
        <PrStat icon={<ExclamationCircleOutlined />} label="需修改" value={changesRequestedCount} tone={changesRequestedCount > 0 ? 'warning' : 'idle'} />
        <PrStat icon={<CheckCircleOutlined />} label="可合并" value={mergeReadyCount} tone="ready" />
      </div>

      <PrGovernanceLoop steps={governanceLoopSteps} />

      <div className={`sl-pr-workbench ${selected ? 'sl-pr-workbench-with-detail' : ''}`}>
        <Card className="sl-section-card sl-pr-table-card sl-selectable-table-card" title={<span className="sl-card-title"><PullRequestOutlined /> 审查列表</span>}>
          <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="middle"
            scroll={{ x: 860 }}
            locale={{
              emptyText: listError ? (
                <StateBlock
                  compact
                  tone="error"
                  title="PR 审查加载失败"
                  description={listError}
                  action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={() => fetchItems()} label="重试" />}
                />
              ) : (
                <StateBlock compact title="暂无 PR 审查" description="创建 PR 风险审查后，合并决策、风险点和行级评论会在这里汇总。" />
              ),
            }}
            pagination={{
              current: page,
              total,
              pageSize: 20,
              showTotal: count => `共 ${count} 条`,
              onChange: setPage,
            }}
            rowClassName={(record) => selected?.id === record.id ? 'sl-pr-row-selected' : ''}
            onRow={(record) => createSelectableTableRowProps({
              record,
              selected: selected?.id === record.id,
              onSelect: handleSelect,
              controlsId: selectedDetailId,
              label: `PrReview #${record.id} ${record.prTitle || `PR #${record.prNumber || record.id}`} ${selected?.id === record.id ? '已选中' : '查看详情'}`,
            })}
          />
        </Card>

        {selected && selectedSignal && (
          <Card
            id={selectedDetailId}
            role="region"
            aria-labelledby={selectedTitleId}
            className="sl-section-card sl-pr-detail-card"
            title={
              <span className="sl-card-title" id={selectedTitleId}>
                <Tag color={STATUS_MAP[selected.status]?.color || 'default'}>{STATUS_MAP[selected.status]?.label || selected.status}</Tag>
                {selected.prTitle || `PR #${selected.prNumber || selected.id}`}
              </span>
            }
            extra={
              <Space>
                {repairUrl && (
                  <ActionButton size="small" type="primary" icon={<ToolOutlined />} onClick={() => navigate(repairUrl)} label="生成修复候选" />
                )}
                <ActionButton size="small" onClick={() => setSelected(null)} label="关闭" />
              </Space>
            }
          >
            <div className="sl-pr-detail-stack">
              <ReviewDecisionCard signal={selectedSignal} />
              {repairReadiness && <ReviewRepairReadinessCard readiness={repairReadiness} />}

              {selected.status === 'COMPLETED' ? (
                <>
                  <InfoBlock title="变更摘要" content={selected.changeSummary} />

                  <section className="sl-pr-section">
                    <div className="sl-pr-section-title">影响范围</div>
                    {selectedImpactScope.length > 0 ? (
                      <div className="sl-pr-chip-list">
                        {selectedImpactScope.map((scope, index) => <Tag key={`${scope}-${index}`}>{scope}</Tag>)}
                      </div>
                    ) : (
                      <StateBlock compact title="未识别影响范围" description="当前审查没有返回模块、接口或文件层面的影响范围。" />
                    )}
                  </section>

                  <section className="sl-pr-section">
                    <div className="sl-pr-section-title">风险点</div>
                    {selectedRisks.length > 0 ? (
                      <div className="sl-pr-risk-list">
                        {selectedRisks.map((risk, index) => (
                          <div className={`sl-pr-risk-item sl-pr-risk-item-${riskTone(risk.severity)}`} key={`${risk.category}-${index}`}>
                            <Tag color={RISK_MAP[risk.severity]?.color || 'default'}>{risk.severity || '-'}</Tag>
                            <div>
                              <strong>{risk.category || 'GENERAL'}</strong>
                              <span>{risk.message || '-'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <StateBlock compact title="暂无风险点" description="当前审查没有发现需要单独处理的风险项。" />
                    )}
                  </section>

                  <section className="sl-pr-section">
                    <div className="sl-pr-section-title">行级评论</div>
                    {commentsError ? (
                      <StateBlock
                        compact
                        tone="error"
                        title="行级评论加载失败"
                        description={commentsError}
                        action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={() => fetchComments(selected.id)} label="重试" />}
                      />
                    ) : commentsLoading ? (
                      <StateBlock compact tone="loading" title="正在加载行级评论" description="评论加载完成后会按文件和行号展示。" />
                    ) : comments.length > 0 ? (
                      <div className="sl-pr-comment-list">
                        {comments.map(comment => (
                          <div className={`sl-pr-comment-item sl-pr-comment-${riskTone(comment.severity)}`} key={comment.id}>
                            <div className="sl-pr-comment-head">
                              <Tag color={SEVERITY_COLORS[comment.severity] || 'default'}>{comment.severity}</Tag>
                              <Text code>{comment.filePath}{comment.lineNumber ? `:${comment.lineNumber}` : ''}</Text>
                            </div>
                            <div className="sl-pr-comment-body">
                              <strong>{comment.category}</strong>
                              <span>{comment.message}</span>
                              {comment.suggestion && <small>{comment.suggestion}</small>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <StateBlock compact title="暂无行级评论" description="当前审查没有生成可定位到文件行号的评论。" />
                    )}
                  </section>

                  <section className="sl-pr-section">
                    <div className="sl-pr-section-title">测试建议</div>
                    {selectedTestSuggestions.length > 0 ? (
                      <div className="sl-pr-suggestion-list">
                        {selectedTestSuggestions.map((suggestion, index) => (
                          <div key={`${suggestion}-${index}`}>
                            <CheckCircleOutlined />
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <StateBlock compact title="暂无测试建议" description="当前审查没有返回额外测试建议。" />
                    )}
                  </section>

                  <section className="sl-pr-section">
                    <div className="sl-pr-section-title">变更文件</div>
                    {selectedChangedFiles.length > 0 ? (
                      <div className="sl-pr-chip-list">
                        {selectedChangedFiles.map((file, index) => <Tag key={`${file}-${index}`}>{file}</Tag>)}
                      </div>
                    ) : (
                      <StateBlock compact title="无变更文件信息" description="当前审查记录没有保存 changedFiles 数据。" />
                    )}
                  </section>

                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="分支">{selected.branch || '-'} {'->'} {selected.baseBranch || 'main'}</Descriptions.Item>
                    <Descriptions.Item label="Commit">{selected.commitSha ? <Text code>{selected.commitSha.substring(0, 7)}</Text> : '-'}</Descriptions.Item>
                    <Descriptions.Item label="作者">{selected.author || '-'}</Descriptions.Item>
                    <Descriptions.Item label="CI 状态">{ciStatusTag(selected.ciStatus)}</Descriptions.Item>
                    <Descriptions.Item label="PR 描述" span={2}>{selected.prDescription || '-'}</Descriptions.Item>
                  </Descriptions>

                  <InfoBlock title="Diff 摘要" content={selected.diffSummary} />
                </>
              ) : selected.status === 'ANALYZING' ? (
                <StateBlock tone="loading" title="正在分析 PR 变更" description="系统正在汇总风险、评论、测试建议和合并决策。" />
              ) : selected.status === 'FAILED' ? (
                <Alert type="error" showIcon message="审查失败" description={selected.errorMessage || '分析任务失败'} />
              ) : (
                <StateBlock compact title="等待分析" description="审查进入分析队列后会生成风险、影响范围和合并建议。" />
              )}
            </div>
          </Card>
        )}
      </div>

      <Modal
        title="新建 PR 审查"
        open={showCreate}
        onCancel={() => { setShowCreate(false); form.resetFields() }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="提交审查"
        width={680}
      >
        <Form form={form} layout="vertical" className="sl-pr-form" initialValues={{ baseBranch: 'main', ciStatus: 'pending' }}>
          <Alert type="info" showIcon message="提供变更文件和 Diff 摘要可以显著提升风险判断与行级评论质量" />
          <div className="sl-pr-form-grid">
            <Form.Item name="prTitle" label="PR 标题" rules={[{ required: true, message: '请输入标题' }]}>
              <Input placeholder="PR 标题" />
            </Form.Item>
            <Form.Item name="prNumber" label="PR 编号">
              <Input type="number" placeholder="#" />
            </Form.Item>
            <Form.Item name="branch" label="源分支">
              <Input placeholder="feature/xxx" />
            </Form.Item>
            <Form.Item name="baseBranch" label="目标分支">
              <Input placeholder="main" />
            </Form.Item>
            <Form.Item name="ciStatus" label="CI 状态">
              <Select options={[
                { label: 'pending', value: 'pending' },
                { label: 'success', value: 'success' },
                { label: 'failure', value: 'failure' },
              ]} />
            </Form.Item>
            <Form.Item name="commitSha" label="Commit SHA">
              <Input placeholder="abc1234" />
            </Form.Item>
            <Form.Item name="author" label="作者">
              <Input placeholder="作者" />
            </Form.Item>
          </div>
          <Form.Item name="prDescription" label="PR 描述">
            <TextArea rows={3} placeholder="PR 描述" />
          </Form.Item>
          <Form.Item name="changedFiles" label="变更文件">
            <Input placeholder="支持 JSON 数组或逗号分隔，如 src/main.java, src/test.java" />
          </Form.Item>
          <Form.Item name="diffSummary" label="Diff 摘要">
            <TextArea rows={4} placeholder="粘贴 diff 摘要" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function PrStat({ icon, label, value, tone = 'idle' }: { icon: ReactNode; label: string; value: number; tone?: ReviewTone }) {
  return (
    <div className={`sl-pr-stat sl-pr-stat-${tone}`}>
      <div className="sl-pr-stat-head">
        {icon}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  )
}

function PrGovernanceLoop({ steps }: { steps: PrGovernanceStep[] }) {
  const iconByStep: Record<PrGovernanceStep['key'], ReactNode> = {
    'pr-intake': <PullRequestOutlined />,
    'risk-decision': <FileSearchOutlined />,
    'merge-gate': <SafetyCertificateOutlined />,
    'repair-handoff': <ToolOutlined />,
  }

  return (
    <section className="sl-pr-governance-loop" role="region" aria-label="PR 审查治理闭环">
      <div className="sl-pr-governance-head">
        <div>
          <span>Review governance</span>
          <h2>PR 审查治理闭环</h2>
        </div>
        <p>把 PR 输入、风险判定、合并门禁和 AutoRepair 交接放到同一条可追踪链路中。</p>
      </div>
      <div className="sl-pr-governance-grid">
        {steps.map(step => (
          <article
            className={`sl-pr-governance-step sl-pr-governance-step-${step.state}`}
            data-sl-pr-governance-step={step.key}
            key={step.key}
          >
            <div className="sl-pr-governance-step-head">
              <div className="sl-pr-governance-icon">{iconByStep[step.key]}</div>
              <div className="sl-pr-governance-meta">
                <span>{step.sequence}</span>
                <strong>{step.status}</strong>
              </div>
            </div>
            <div className="sl-pr-governance-copy">
              <h3>{step.label}</h3>
              <p>{step.detail}</p>
            </div>
            {step.actionLabel && (
              <ActionButton
                type={step.onAction ? 'primary' : 'default'}
                disabled={step.actionDisabled}
                icon={<ToolOutlined />}
                onClick={step.onAction}
                label={step.actionLabel}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function ReviewDecisionCard({ signal }: { signal: ReviewDecisionSignal }) {
  return (
    <section className={`sl-pr-decision sl-pr-decision-${signal.tone}`}>
      <div className="sl-pr-decision-head">
        <FileSearchOutlined />
        <div>
          <span>合并决策</span>
          <strong>{signal.label}</strong>
        </div>
      </div>
      <p>{signal.summary}</p>
      <div className="sl-pr-decision-grid">
        {signal.checks.map(check => (
          <div className={`sl-pr-decision-check sl-pr-decision-check-${check.tone}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-pr-next-action">
        <ApiOutlined />
        <span>{signal.nextAction}</span>
      </div>
    </section>
  )
}

function ReviewRepairReadinessCard({ readiness }: { readiness: ReviewRepairReadiness }) {
  return (
    <section className={`sl-pr-repair-readiness ${readiness.ready ? 'sl-pr-repair-readiness-ready' : 'sl-pr-repair-readiness-warning'}`}>
      <div className="sl-pr-repair-readiness-head">
        <ToolOutlined />
        <div>
          <span>修复候选资格</span>
          <strong>{readiness.ready ? '可以生成' : '暂不可生成'}</strong>
        </div>
      </div>
      <p>{readiness.summary}</p>
      <div className="sl-pr-decision-grid">
        {readiness.checks.map(check => (
          <div className={`sl-pr-decision-check sl-pr-decision-check-${check.tone}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
      </div>
      {readiness.targetFile && (
        <div className="sl-pr-next-action">
          <FileSearchOutlined />
          <span>候选会优先绑定行级评论文件；无行级评论时使用第一个变更文件：{readiness.targetFile}</span>
        </div>
      )}
    </section>
  )
}

function InfoBlock({ title, content }: { title: string; content: string | null }) {
  if (!content) return null
  return (
    <section className="sl-pr-section">
      <div className="sl-pr-section-title">{title}</div>
      <Paragraph className="sl-pr-text-block">{content}</Paragraph>
    </section>
  )
}

function buildReviewDecisionSignal(review: PrReview, risks: ReviewRisk[], comments: PrReviewComment[], changedFiles: string[]): ReviewDecisionSignal {
  const statusCfg = STATUS_MAP[review.status] || STATUS_MAP.PENDING
  const mergeCfg = MERGE_MAP[review.mergeRecommendation || '']
  const riskCfg = RISK_MAP[review.riskLevel || '']
  const ciFailed = review.ciStatus === 'failure'

  if (review.status === 'FAILED') {
    return {
      label: '审查失败',
      tone: 'danger',
      summary: review.errorMessage || '审查任务未能完成，需要检查输入或模型配置。',
      nextAction: '查看错误信息，必要时重新分析。',
      checks: [
        { label: '任务状态', value: statusCfg.label, tone: 'danger' },
        { label: '变更文件', value: `${changedFiles.length} 个`, tone: changedFiles.length > 0 ? 'ready' : 'warning' },
        { label: '行级评论', value: '不可用', tone: 'danger' },
      ],
    }
  }

  if (review.status === 'PENDING' || review.status === 'ANALYZING') {
    return {
      label: statusCfg.label,
      tone: 'warning',
      summary: '审查尚未完成，合并决策暂不可作为准入依据。',
      nextAction: '等待执行任务完成，长时间无进展后重新分析。',
      checks: [
        { label: '任务状态', value: statusCfg.label, tone: 'warning' },
        { label: '变更文件', value: `${changedFiles.length} 个`, tone: changedFiles.length > 0 ? 'ready' : 'warning' },
        { label: 'CI 状态', value: review.ciStatus || '-', tone: ciFailed ? 'danger' : 'idle' },
      ],
    }
  }

  const tone = mergeCfg?.tone || riskCfg?.tone || 'warning'
  return {
    label: mergeCfg?.label || '待复核',
    tone,
    summary: decisionSummary(review.mergeRecommendation, review.riskLevel, ciFailed),
    nextAction: decisionNextAction(review.mergeRecommendation, comments.length),
    checks: [
      { label: '风险等级', value: riskCfg?.label || review.riskLevel || '-', tone: riskCfg?.tone || 'idle' },
      { label: '风险点', value: `${risks.length} 条`, tone: risks.length > 0 ? tone : 'ready' },
      { label: '行级评论', value: `${comments.length} 条`, tone: comments.length > 0 ? 'warning' : 'ready' },
      { label: 'CI 状态', value: review.ciStatus || '-', tone: ciFailed ? 'danger' : 'ready' },
    ],
  }
}

function decisionSummary(decision: string | null, riskLevel: string | null, ciFailed: boolean) {
  if (decision === 'BLOCKED') return ciFailed ? 'CI 未通过或存在严重风险，当前 PR 不应合并。' : '审查发现阻断级问题，必须先处理风险。'
  if (decision === 'CHANGES_REQUESTED') return `当前风险等级为 ${RISK_MAP[riskLevel || '']?.label || riskLevel || '-'}，建议修改后再进入合并。`
  if (decision === 'MERGE') return '当前审查未发现阻断级问题，可在确认测试通过后合并。'
  return '审查完成但合并建议不明确，需要人工复核。'
}

function decisionNextAction(decision: string | null, commentCount: number) {
  if (decision === 'BLOCKED') return '优先处理阻断风险和 CI 失败，再重新分析。'
  if (decision === 'CHANGES_REQUESTED') return commentCount > 0 ? '按行级评论生成修复候选或手动修改。' : '按风险点补充修复后重新审查。'
  if (decision === 'MERGE') return '确认测试和部署窗口后合并。'
  return '补充 Diff、变更文件或 CI 状态后重新分析。'
}

function buildReviewRepairReadiness(review: PrReview, risks: ReviewRisk[], comments: PrReviewComment[], changedFiles: string[]): ReviewRepairReadiness {
  const hasRepository = Boolean(review.repositoryId)
  const actionableComment = comments.find(item => item.filePath && (item.suggestion || item.message))
  const targetFile = actionableComment?.filePath || changedFiles[0] || null
  const hasTargetFile = Boolean(targetFile)
  const hasActionableEvidence = Boolean(actionableComment) || risks.length > 0
  const ready = hasRepository && hasTargetFile && hasActionableEvidence
  const missing = [
    hasRepository ? null : '仓库 ID',
    hasTargetFile ? null : '目标文件',
    hasActionableEvidence ? null : '风险或行级评论',
  ].filter(Boolean)

  return {
    ready,
    targetFile: ready ? targetFile : null,
    summary: ready
      ? '当前 PR 审查具备仓库、目标文件和可行动风险证据，可以进入 AutoRepair 候选创建。'
      : `当前 PR 审查缺少 ${missing.join('、')}，需要补充变更文件、行级评论或重新分析后再生成修复候选。`,
    checks: [
      { label: '仓库绑定', value: hasRepository ? `#${review.repositoryId}` : '缺失', tone: hasRepository ? 'ready' : 'warning' },
      { label: '目标文件', value: targetFile || '缺失', tone: hasTargetFile ? 'ready' : 'warning' },
      { label: '行级评论', value: `${comments.length} 条`, tone: comments.length > 0 ? 'warning' : 'idle' },
      { label: '风险点', value: `${risks.length} 条`, tone: risks.length > 0 ? 'warning' : 'idle' },
    ],
  }
}

function autoRepairCandidateUrl(review: PrReview, risks: ReviewRisk[], comments: PrReviewComment[], changedFiles: string[]) {
  if (!review.repositoryId) return null
  const comment = comments.find(item => item.filePath && (item.suggestion || item.message))
  const fallbackFile = changedFiles[0]
  const filePath = comment?.filePath || fallbackFile
  if (!filePath) return null
  const riskSummary = risks.slice(0, 3).map(risk => `${risk.category}: ${risk.message}`).join('；')
  const targetDesc = [
    `PR 审查：${review.prTitle || `PR #${review.prNumber || review.id}`}`,
    review.mergeRecommendation ? `合并建议：${MERGE_MAP[review.mergeRecommendation]?.label || review.mergeRecommendation}` : null,
    review.riskLevel ? `风险等级：${RISK_MAP[review.riskLevel]?.label || review.riskLevel}` : null,
    comment?.message ? `行级评论：${comment.message}` : null,
    comment?.suggestion ? `修复建议：${comment.suggestion}` : null,
    riskSummary ? `风险摘要：${riskSummary}` : null,
  ].filter(Boolean).join('\n')
  const params = new URLSearchParams({
    projectId: String(review.projectId),
    repositoryId: String(review.repositoryId),
    filePath,
    targetDesc,
    source: `pr-review-${review.id}`,
    openCreate: '1',
  })
  return `/auto-repairs?${params.toString()}`
}

function parseRisks(value: string | null): ReviewRisk[] {
  return parseUnknownList(value).map(item => {
    const record = asRecord(item)
    return {
      category: String(record.category || 'GENERAL'),
      severity: String(record.severity || 'LOW'),
      message: String(record.message || item || ''),
    }
  }).filter(item => item.message)
}

function parseStringList(value: string | null): string[] {
  if (!value) return []
  const parsed = parseUnknownList(value)
  if (parsed.length > 0) return parsed.map(item => String(item)).filter(Boolean)
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

function parseUnknownList(value: string | null): unknown[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object') return [parsed]
    if (parsed) return [parsed]
  } catch {
    return []
  }
  return []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function ciStatusTag(status: string | null) {
  if (status === 'success') return <Tag color="success">通过</Tag>
  if (status === 'failure') return <Tag color="error">失败</Tag>
  if (status === 'pending') return <Tag color="processing">等待</Tag>
  return <Tag>{status || '-'}</Tag>
}

function riskTone(value: string | null | undefined): ReviewTone {
  if (value === 'CRITICAL' || value === 'HIGH' || value === 'ERROR') return 'danger'
  if (value === 'MEDIUM' || value === 'WARNING') return 'warning'
  if (value === 'LOW' || value === 'INFO') return 'ready'
  return 'idle'
}
