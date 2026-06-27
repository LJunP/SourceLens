import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Card, Table, Tag, Typography, Button, Space, Input, Form, Select,
  Collapse, Spin, message, Modal, Alert, Empty, Popconfirm, Progress
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, CheckCircleOutlined,
  ClockCircleOutlined, SyncOutlined, CloseCircleOutlined,
  CodeOutlined, FileTextOutlined, BranchesOutlined, LinkOutlined,
  StopOutlined, SafetyCertificateOutlined
} from '@ant-design/icons'
import { autoRepairApi, AutoRepair } from '../api/autoRepair'
import { repositoryApi, Repository } from '../api/repository'
import { executionTaskApi, ExecutionTaskDetail } from '../api/executionTask'
import { showApiError } from '../api/client'
import ArtifactLinkButton from '../components/ArtifactLinkButton'
import DiffViewer from '../components/DiffViewer'
import LogViewer from '../components/LogViewer'
import TaskTimeline from '../components/TaskTimeline'

const { Text } = Typography
const { TextArea } = Input

const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
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

type RepairTone = 'ready' | 'warning' | 'danger' | 'idle'

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

interface Props {
  projectId: number
  initialRepairId?: number
  initialDraft?: {
    repositoryId?: number
    filePath?: string
    targetDesc?: string
    source?: string
  }
}

export default function AutoRepairs({ projectId, initialRepairId, initialDraft }: Props) {
  const [items, setItems] = useState<AutoRepair[]>([])
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [submittingPr, setSubmittingPr] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<AutoRepair | null>(null)
  const [executionDetail, setExecutionDetail] = useState<ExecutionTaskDetail | null>(null)
  const [draftSource, setDraftSource] = useState<string | null>(null)
  const [form] = Form.useForm()

  // 用于自动刷新运行中的任务
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const appliedInitialRepairIdRef = useRef<number | null>(null)
  const appliedDraftKeyRef = useRef<string | null>(null)

  const fetchItems = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    autoRepairApi.list(projectId)
      .then(res => {
        const list = res.data.data || []
        setItems(list)

        // 如果当前有选中的任务，且其在列表中更新了，同步刷新选中详情
        if (selected) {
          const updatedSelected = list.find(item => item.id === selected.id)
          if (updatedSelected) {
            setSelected(updatedSelected)
          }
        }
      })
      .catch(error => showApiError(error, '加载任务列表失败'))
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [projectId, selected])

  const fetchRepos = useCallback(() => {
    repositoryApi.list(projectId)
      .then(res => setRepos(res.data.data || []))
      .catch(error => showApiError(error, '加载仓库列表失败'))
  }, [projectId])

  const fetchExecutionDetail = useCallback((repairId: number) => {
    executionTaskApi.detailBySource(projectId, 'AUTO_REPAIR', repairId)
      .then(res => {
        setExecutionDetail(res.data.data)
      })
      .catch(() => {
        setExecutionDetail(null)
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
          filePath: initialDraft.filePath,
          targetDesc: initialDraft.targetDesc,
          source: initialDraft.source,
        })
      : null
    if (!initialDraft || !draftKey || appliedDraftKeyRef.current === draftKey) {
      return
    }
    form.setFieldsValue({
      repositoryId: initialDraft.repositoryId,
      filePath: initialDraft.filePath,
      targetDesc: initialDraft.targetDesc,
    })
    setShowCreate(true)
    setDraftSource(initialDraft.source || '扫描报告风险项')
    appliedDraftKeyRef.current = draftKey
  }, [form, initialDraft])

  useEffect(() => {
    if (!initialRepairId || loading || appliedInitialRepairIdRef.current === initialRepairId) {
      return
    }
    const matched = items.find(item => item.id === initialRepairId)
    if (!matched) {
      if (items.length > 0) {
        appliedInitialRepairIdRef.current = initialRepairId
        message.warning(`未找到自动修码任务 #${initialRepairId}`)
      }
      return
    }
    setSelected(matched)
    appliedInitialRepairIdRef.current = initialRepairId
  }, [initialRepairId, items, loading])

  useEffect(() => {
    if (!selected) {
      setExecutionDetail(null)
      return
    }
    fetchExecutionDetail(selected.id)
  }, [selected?.id, fetchExecutionDetail])

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
      await autoRepairApi.create(projectId, values)
      message.success('自动补丁任务已提交，正在隔离沙箱中生成 diff...')
      setShowCreate(false)
      setDraftSource(null)
      form.resetFields()
      fetchItems()
    } catch (error) {
      showApiError(error, '提交任务失败')
    } finally {
      setCreating(false)
    }
  }

  const handleSubmitPr = async () => {
    if (!selected) return
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
  const selectedMeta = selected ? STATUS_MAP[selected.status] || { color: 'default', label: selected.status, icon: null } : null
  const selectedProgress = selected ? repairProgress(selected.status) : 0
  const selectedReadiness = selected ? repairReadiness(selected, executionDetail) : null

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    {
      title: '文件路径',
      dataIndex: 'filePath',
      key: 'filePath',
      ellipsis: true,
      render: (path: string, record: AutoRepair) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => handleSelect(record)}>
          <Space>
            <CodeOutlined />
            <span>{path}</span>
          </Space>
        </Button>
      )
    },
    {
      title: '修改目标',
      dataIndex: 'targetDesc',
      key: 'targetDesc',
      ellipsis: true,
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
            <Button icon={<ReloadOutlined />} onClick={() => fetchItems()}>
              刷新列表
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
              新建修码任务
            </Button>
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

      <div className={`sl-autorepair-workbench ${selected ? 'sl-autorepair-workbench-with-detail' : ''}`}>
        <Card className="sl-section-card sl-autorepair-table-card" title={<span className="sl-card-title"><FileTextOutlined /> 修复任务列表</span>}>
          <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="middle"
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无自动修复任务" /> }}
            pagination={{ pageSize: 10, showTotal: total => `共 ${total} 个修复任务` }}
            scroll={{ x: 860 }}
            rowClassName={(record) => selected?.id === record.id ? 'sl-autorepair-row-selected' : ''}
            onRow={(record) => ({
              onClick: () => handleSelect(record),
            })}
          />
        </Card>

        {selected && (
          <Card
            className="sl-section-card sl-autorepair-detail-card"
            title={
              <Space wrap>
                <Tag color={selectedMeta?.color} icon={selectedMeta?.icon}>{selectedMeta?.label}</Tag>
                <span>任务详情 #{selected.id}</span>
              </Space>
            }
            extra={<Button size="small" onClick={() => setSelected(null)}>关闭</Button>}
          >
            <div className="sl-autorepair-detail-stack">
              {selectedReadiness && <RepairReadinessCard signal={selectedReadiness} progress={selectedProgress} />}

              <div className="sl-autorepair-field">
                <Text type="secondary">待修文件相对路径</Text>
                <pre>{selected.filePath}</pre>
              </div>

              <div className="sl-autorepair-field">
                <Text type="secondary">修复目标</Text>
                <div className="sl-autorepair-target">{selected.targetDesc}</div>
              </div>

              {selected.errorMessage && (
                <Alert
                  message="任务运行错误"
                  description={selected.errorMessage}
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
                      <Button danger icon={<StopOutlined />} loading={cancellingId === selected.id}>
                        取消
                      </Button>
                    </Popconfirm>
                  }
                />
              )}

              {selected.status === 'PATCH_READY' && (
                <Alert
                  message="补丁已生成"
                  description="请先审查 patch artifact。确认后可通过 GitHub App installation token 创建受控 Pull Request。"
                  type="success"
                  showIcon
                  action={
                    <Space wrap>
                      <ArtifactLinkButton
                        projectId={projectId}
                        ownerType="AUTO_REPAIR"
                        ownerId={selected.id}
                        label="查看补丁产物"
                      />
                      <Button
                        type="primary"
                        icon={<BranchesOutlined />}
                        loading={submittingPr}
                        onClick={handleSubmitPr}
                      >
                        创建 PR
                      </Button>
                    </Space>
                  }
                />
              )}

              {selected.status === 'PR_CREATED' && selected.prUrl && (
                <Alert
                  message="Pull Request 已创建"
                  description={selected.branchName ? `分支：${selected.branchName}` : undefined}
                  type="info"
                  showIcon
                  action={
                    <Button
                      icon={<LinkOutlined />}
                      href={selected.prUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      打开 PR
                    </Button>
                  }
                />
              )}

              {executionDetail && executionDetail.steps.length > 0 && (
                <div>
                  <div className="sl-autorepair-section-title">执行步骤</div>
                  <TaskTimeline
                    items={executionDetail.steps.map(step => ({
                      key: step.id,
                      title: step.stepName,
                      status: step.status,
                      description: step.errorMessage || step.logSummary || step.status,
                      errorMessage: step.errorMessage,
                    }))}
                  />
                </div>
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
                <div className="sl-autorepair-running">
                  <Spin indicator={<SyncOutlined spin style={{ fontSize: 24 }} />} />
                  <Text type="secondary">
                    {selected.status === 'PR_RUNNING'
                      ? '后台正在创建 Pull Request，请稍候...'
                      : 'Agent 正在隔离沙箱中生成补丁，请稍候...'}
                  </Text>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* 创建任务模态弹窗 */}
      <Modal
        title="发起自动补丁生成任务"
        open={showCreate}
        onCancel={() => { setShowCreate(false); setDraftSource(null); form.resetFields() }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="开始生成补丁"
        cancelText="取消"
        width={560}
      >
        <Form form={form} layout="vertical">
          {draftSource && (
            <Alert
              type="info"
              showIcon
              message={`已从${draftSource}带入修复候选`}
              description="请复核仓库、文件路径和修复目标后再提交。自动修复会先生成可审查 patch，不会直接写回源仓库。"
              style={{ marginBottom: 14 }}
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

function repairToneColor(tone: RepairTone) {
  if (tone === 'ready') return 'green'
  if (tone === 'warning') return 'gold'
  if (tone === 'danger') return 'red'
  return 'default'
}
