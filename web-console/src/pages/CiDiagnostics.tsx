import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Card, Descriptions, Form, Input, Modal, Select, Space,
  Table, Tag, Typography, message
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
import { formatApiError, showApiError } from '../api/client'
import ActionButton from '../components/ui/ActionButton'
import IconActionButton from '../components/ui/IconActionButton'
import StateBlock from '../components/ui/StateBlock'
import { createSelectableTableRowProps } from '../components/ui/selectableTableRow'
import { redactSensitiveText } from '../utils/displayRedaction'

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

interface RepairReadiness {
  ready: boolean
  summary: string
  targetFile: string | null
  checks: Array<{
    label: string
    value: string
    tone: DiagnosticTone
  }>
}

interface CiGovernanceStep {
  key: 'log-intake' | 'root-cause-evidence' | 'repair-gate' | 'autorepair-handoff'
  sequence: string
  label: string
  state: DiagnosticTone
  status: string
  detail: string
  actionLabel?: string
  actionDisabled?: boolean
  onAction?: () => void
}

interface Props {
  projectId: number
  initialDiagnosticId?: number
}

function redactCiLogSnippet(value: string) {
  return redactSensitiveText(value)
}

export default function CiDiagnostics({ projectId, initialDiagnosticId }: Props) {
  const navigate = useNavigate()
  const [items, setItems] = useState<CiDiagnostic[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<CiDiagnostic | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [deepLinkError, setDeepLinkError] = useState<string | null>(null)
  const [form] = Form.useForm()
  const deepLinkRequestRef = useRef<number | null>(null)

  const fetchItems = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    ciApi.listByProject(projectId, page, 20, statusFilter)
      .then(res => {
        const data = res.data.data
        setListError(null)
        setItems(data.items || [])
        setTotal(data.total)
        setSelected(prev => {
          if (!prev) return prev
          return data.items?.find(item => item.id === prev.id) || prev
        })
      })
      .catch(error => {
        setListError(formatApiError(error, '加载 CI 诊断失败'))
        showApiError(error, '加载 CI 诊断失败')
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [page, projectId, statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  useEffect(() => {
    deepLinkRequestRef.current = null
    setDeepLinkError(null)
    setSelected(null)
  }, [projectId, initialDiagnosticId])

  useEffect(() => {
    if (!initialDiagnosticId || loading || selected?.id === initialDiagnosticId) return

    const listedDiagnostic = items.find(item => item.id === initialDiagnosticId)
    if (listedDiagnostic) {
      setDeepLinkError(null)
      setSelected(listedDiagnostic)
      return
    }

    if (deepLinkRequestRef.current === initialDiagnosticId) return
    deepLinkRequestRef.current = initialDiagnosticId
    ciApi.detail(initialDiagnosticId)
      .then(res => {
        const detail = res.data.data
        if (detail.projectId !== projectId) {
          setDeepLinkError(`目标 CI 诊断 #${initialDiagnosticId} 不属于当前项目，已保留当前列表。`)
          return
        }
        setDeepLinkError(null)
        setSelected(detail)
        setItems(prev => prev.some(item => item.id === detail.id) ? prev : [detail, ...prev])
      })
      .catch(error => {
        setDeepLinkError(formatApiError(error, `未找到 CI 诊断 #${initialDiagnosticId}`))
        showApiError(error, `未找到 CI 诊断 #${initialDiagnosticId}`)
      })
  }, [initialDiagnosticId, items, loading, projectId, selected?.id])

  const activeCount = useMemo(() => items.filter(item => item.status === 'PENDING' || item.status === 'ANALYZING').length, [items])
  const completedCount = useMemo(() => items.filter(item => item.status === 'COMPLETED').length, [items])
  const failedCount = useMemo(() => items.filter(item => item.status === 'FAILED').length, [items])
  const actionableCount = useMemo(() => items.filter(item => parseJsonList(item.fixSuggestions).length > 0).length, [items])
  const evidenceReadyCount = useMemo(
    () => items.filter(item => (
      item.status === 'COMPLETED'
      && Boolean(item.rootCause)
      && parseJsonList(item.relatedFiles).length > 0
      && parseJsonList(item.fixSuggestions).length > 0
    )).length,
    [items],
  )
  const selectedSignal = selected ? buildDiagnosticSignal(selected) : null
  const selectedRelatedFiles = selected ? parseJsonList(selected.relatedFiles) : []
  const selectedFixSuggestions = selected ? parseJsonList(selected.fixSuggestions) : []
  const repairUrl = selected ? autoRepairCandidateUrl(selected, selectedRelatedFiles, selectedFixSuggestions) : null
  const repairReadiness = selected ? buildRepairReadiness(selected, selectedRelatedFiles, selectedFixSuggestions) : null
  const governanceLoopSteps = useMemo<CiGovernanceStep[]>(() => [
    {
      key: 'log-intake',
      sequence: 'C1',
      label: '日志接入',
      state: listError ? 'danger' : total > 0 ? 'ready' : 'idle',
      status: listError ? '数据源异常' : total > 0 ? `${total} 条已接入` : '等待输入',
      detail: listError
        ? 'CI 诊断列表加载失败，当前数量和状态不可作为判断依据。'
        : '失败日志与提交上下文进入诊断队列；页面展示脱敏不代表原始日志可以直接外发。',
    },
    {
      key: 'root-cause-evidence',
      sequence: 'C2',
      label: '根因证据',
      state: evidenceReadyCount > 0 ? 'ready' : completedCount > 0 ? 'warning' : failedCount > 0 ? 'danger' : 'idle',
      status: evidenceReadyCount > 0
        ? `当前页 ${evidenceReadyCount} 条证据齐全`
        : completedCount > 0
          ? '已完成但证据不足'
          : failedCount > 0
            ? '诊断失败'
            : '等待分析',
      detail: '根因、相关文件和修复建议必须同时存在；诊断完成不代表根因正确或 LLM 输出事实正确。',
    },
    {
      key: 'repair-gate',
      sequence: 'C3',
      label: '修复资格',
      state: repairReadiness?.ready
        ? 'ready'
        : selected?.status === 'FAILED'
          ? 'danger'
          : selected
            ? 'warning'
            : 'idle',
      status: repairReadiness?.ready
        ? '候选条件满足'
        : selected
          ? '证据仍需补齐'
          : '等待选择诊断',
      detail: repairReadiness?.ready
        ? `已绑定仓库、相关文件和修复建议，目标文件为 ${repairReadiness.targetFile}。`
        : repairReadiness?.summary || '选择一条诊断后，系统会检查仓库、文件定位和修复建议是否齐全。',
    },
    {
      key: 'autorepair-handoff',
      sequence: 'C4',
      label: 'AutoRepair 交接',
      state: repairUrl ? 'ready' : selected ? 'warning' : 'idle',
      status: repairUrl ? '可以交接' : selected ? '交接受阻' : '等待修复资格',
      detail: repairUrl
        ? '创建修复候选只传递受控上下文，后续仍需补丁审查、CI、人工 review 和审计复盘。'
        : '只有修复资格门禁通过后才开放交接；不得把诊断建议直接视为已验证修复。',
      actionLabel: repairUrl ? '生成修复候选' : selected ? '补齐诊断证据' : '先选择诊断',
      actionDisabled: !repairUrl,
      onAction: repairUrl ? () => navigate(repairUrl) : undefined,
    },
  ], [completedCount, evidenceReadyCount, failedCount, listError, navigate, repairReadiness, repairUrl, selected, total])
  const selectedDetailId = selected ? `ci-diagnostic-detail-${selected.id}` : undefined
  const selectedTitleId = selected ? `ci-diagnostic-detail-title-${selected.id}` : undefined
  const selectedRedactedRawLogSnippet = useMemo(
    () => selected?.rawLogSnippet ? redactCiLogSnippet(selected.rawLogSnippet) : '',
    [selected?.rawLogSnippet],
  )

  const selectDiagnostic = useCallback((record: CiDiagnostic) => {
    setSelected(record)
  }, [])

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
        <ActionButton
          type="link"
          className="sl-ci-table-link"
          onClick={(event) => {
            event.stopPropagation()
            selectDiagnostic(record)
          }}
          label={name || `#${record.runNumber || record.id}`}
        />
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
        <IconActionButton
          label={`重新分析 CI 诊断 #${record.id}`}
          tooltip="重新分析"
          size="small"
          icon={<ReloadOutlined />}
          onClick={(event) => { event.stopPropagation(); handleReanalyze(record.id) }}
        />
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
            <ActionButton icon={<ReloadOutlined />} onClick={() => fetchItems(true)} label="刷新" />
            <ActionButton type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)} label="新建诊断" />
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

      <CiGovernanceLoop steps={governanceLoopSteps} />

      <div className={`sl-ci-workbench ${selected ? 'sl-ci-workbench-with-detail' : ''}`}>
        {deepLinkError && (
          <Alert
            className="sl-ci-deep-link-alert"
            type="warning"
            showIcon
            message="目标 CI 诊断未能定位"
            description={deepLinkError}
          />
        )}
        <Card className="sl-section-card sl-ci-table-card sl-selectable-table-card" title={<span className="sl-card-title"><BugOutlined /> 诊断列表</span>}>
          <Table
            className="sl-ci-diagnostics-table"
            dataSource={items}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="middle"
            scroll={{ x: 760 }}
            locale={{
              emptyText: listError ? (
                <StateBlock
                  compact
                  tone="error"
                  title="CI 诊断加载失败"
                  description={listError}
                  action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={() => fetchItems()} label="重试" />}
                />
              ) : (
                <StateBlock compact title="暂无 CI 诊断" description="粘贴失败日志或接入 CI 事件后会在这里生成诊断记录。" />
              ),
            }}
            pagination={{
              current: page,
              total,
              pageSize: 20,
              showTotal: count => `共 ${count} 条`,
              onChange: setPage,
            }}
            rowClassName={(record) => selected?.id === record.id ? 'sl-ci-row-selected' : ''}
            onRow={(record) => createSelectableTableRowProps({
              record,
              selected: selected?.id === record.id,
              onSelect: selectDiagnostic,
              controlsId: selectedDetailId,
              label: `CiDiagnostic #${record.id} ${record.workflowName || `#${record.runNumber || record.id}`} ${selected?.id === record.id ? '已选中' : '查看详情'}`,
            })}
          />
        </Card>

        {selected && selectedSignal && (
          <Card
            id={selectedDetailId}
            role="region"
            aria-labelledby={selectedTitleId}
            className="sl-section-card sl-ci-detail-card"
            title={
              <span className="sl-card-title" id={selectedTitleId}>
                <Tag color={STATUS_MAP[selected.status]?.color || 'default'}>{STATUS_MAP[selected.status]?.label || selected.status}</Tag>
                {selected.workflowName || `#${selected.runNumber || selected.id}`}
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
            <div className="sl-ci-detail-stack">
              <DiagnosticSignalCard signal={selectedSignal} />
              {repairReadiness && <RepairReadinessCard readiness={repairReadiness} />}

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
                      <StateBlock compact title="未识别相关文件" description="当前诊断结果没有返回可定位的文件路径。" />
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
                      <StateBlock compact title="暂无修复建议" description="当前诊断没有形成可直接推进到自动修码的建议。" />
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
                <StateBlock tone="loading" title="正在分析 CI 日志" description="系统正在提取失败摘要、根因和修复建议。" />
              ) : selected.status === 'FAILED' ? (
                <Alert type="error" showIcon message="诊断失败" description={selected.errorMessage || '分析任务失败'} />
              ) : (
                <StateBlock compact title="等待分析" description="诊断进入分析队列后会生成根因、相关文件和建议。" />
              )}

              <section className="sl-ci-section">
                <div className="sl-ci-section-title">原始日志片段</div>
                {selected.rawLogSnippet ? (
                  <pre className="sl-ci-log sl-ci-log-redacted" aria-label="脱敏 CI 日志片段">{selectedRedactedRawLogSnippet}</pre>
                ) : (
                  <StateBlock compact title="无日志数据" description="创建诊断时没有保存可展示的原始日志片段。" />
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

function CiGovernanceLoop({ steps }: { steps: CiGovernanceStep[] }) {
  const iconByStep: Record<CiGovernanceStep['key'], ReactNode> = {
    'log-intake': <BugOutlined />,
    'root-cause-evidence': <FileSearchOutlined />,
    'repair-gate': <SafetyCertificateOutlined />,
    'autorepair-handoff': <ToolOutlined />,
  }

  return (
    <section className="sl-ci-governance-loop" role="region" aria-label="CI 失败诊断治理闭环">
      <div className="sl-ci-governance-head">
        <div>
          <span>Failure governance</span>
          <h2>CI 失败诊断治理闭环</h2>
        </div>
        <p>把失败输入、根因证据、修复资格和 AutoRepair 出口放在同一条可审计链路中。</p>
      </div>
      <div className="sl-ci-governance-grid">
        {steps.map(step => (
          <article
            className={`sl-ci-governance-step sl-ci-governance-step-${step.state}`}
            data-sl-ci-governance-step={step.key}
            key={step.key}
          >
            <div className="sl-ci-governance-step-head">
              <div className="sl-ci-governance-icon">{iconByStep[step.key]}</div>
              <div className="sl-ci-governance-meta">
                <span>{step.sequence}</span>
                <strong>{step.status}</strong>
              </div>
            </div>
            <div className="sl-ci-governance-copy">
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

function RepairReadinessCard({ readiness }: { readiness: RepairReadiness }) {
  return (
    <section className={`sl-ci-repair-readiness ${readiness.ready ? 'sl-ci-repair-readiness-ready' : 'sl-ci-repair-readiness-warning'}`}>
      <div className="sl-ci-repair-readiness-head">
        <ToolOutlined />
        <div>
          <span>修复候选资格</span>
          <strong>{readiness.ready ? '可以生成' : '暂不可生成'}</strong>
        </div>
      </div>
      <p>{readiness.summary}</p>
      <div className="sl-ci-diagnostic-grid">
        {readiness.checks.map(check => (
          <div className={`sl-ci-diagnostic-check sl-ci-diagnostic-check-${check.tone}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
      </div>
      {readiness.targetFile && (
        <div className="sl-ci-next-action">
          <FileSearchOutlined />
          <span>候选会默认绑定第一个相关文件：{readiness.targetFile}</span>
        </div>
      )}
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

function buildRepairReadiness(item: CiDiagnostic, relatedFiles: string[], suggestions: string[]): RepairReadiness {
  const hasRepository = Boolean(item.repositoryId)
  const hasRelatedFile = relatedFiles.length > 0
  const hasSuggestion = suggestions.length > 0
  const ready = hasRepository && hasRelatedFile && hasSuggestion
  const missing = [
    hasRepository ? null : '仓库 ID',
    hasRelatedFile ? null : '相关文件',
    hasSuggestion ? null : '修复建议',
  ].filter(Boolean)

  return {
    ready,
    targetFile: ready ? relatedFiles[0] : null,
    summary: ready
      ? '当前诊断具备仓库、相关文件和修复建议，可以进入 AutoRepair 候选创建。'
      : `当前诊断缺少 ${missing.join('、')}，需要补充日志或重新分析后再生成修复候选。`,
    checks: [
      { label: '仓库绑定', value: hasRepository ? `#${item.repositoryId}` : '缺失', tone: hasRepository ? 'ready' : 'warning' },
      { label: '相关文件', value: `${relatedFiles.length} 个`, tone: hasRelatedFile ? 'ready' : 'warning' },
      { label: '修复建议', value: `${suggestions.length} 条`, tone: hasSuggestion ? 'ready' : 'warning' },
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
    projectId: String(item.projectId),
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
