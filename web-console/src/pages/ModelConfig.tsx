import { useMemo, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  Alert, Card, Table, Tag, Typography, Space, Modal, Form, Input, Select,
  InputNumber, message, Popconfirm, AutoComplete
} from 'antd'
import {
  ApiOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  KeyOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { llmConfigApi, LlmConfig, PROVIDER_PRESETS } from '../api/modelConfig'
import { formatApiError, showApiError } from '../api/client'
import ActionButton from '../components/ui/ActionButton'
import IconActionButton from '../components/ui/IconActionButton'
import StateBlock from '../components/ui/StateBlock'

const { Text } = Typography

const PROVIDER_COLORS: Record<string, string> = {
  OPENAI: '#10a37f',
  ANTHROPIC: '#d97706',
  DEEPSEEK: '#6366f1',
  CUSTOM: '#64748b',
}

type ModelGovernanceTone = 'ready' | 'warning' | 'danger'

interface ModelGovernanceStep {
  key: string
  icon: ReactNode
  label: string
  status: string
  detail: string
  tone: ModelGovernanceTone
  actionLabel: string
  onAction: () => void
}

function normalizeEndpoint(url: string | null | undefined) {
  return (url || '').trim().replace(/\/+$/, '').toLowerCase()
}

function isPresetEndpoint(config: LlmConfig) {
  const preset = PROVIDER_PRESETS[config.provider]
  if (!preset || config.provider === 'CUSTOM') return false
  return normalizeEndpoint(config.baseUrl) === normalizeEndpoint(preset.baseUrl)
}

function hasEndpointOverride(config: LlmConfig) {
  return !isPresetEndpoint(config)
}

function displayApiKeyBoundary(apiKey: string) {
  if (!apiKey) return ''
  return apiKey.includes('***') ? apiKey : '已脱敏'
}

export default function ModelConfig() {
  const [configs, setConfigs] = useState<LlmConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LlmConfig | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('OPENAI')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [operationError, setOperationError] = useState<{ title: string; description: string } | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const activeConfig = useMemo(() => configs.find(config => config.isActive) || null, [configs])
  const providerCount = useMemo(() => new Set(configs.map(config => config.provider)).size, [configs])
  const configuredKeyCount = useMemo(() => configs.filter(config => Boolean(config.apiKey)).length, [configs])
  const endpointOverrideCount = useMemo(() => configs.filter(hasEndpointOverride).length, [configs])
  const readinessTone = !activeConfig ? 'danger' : configuredKeyCount < configs.length ? 'warning' : 'ready'
  const missingKeyCount = Math.max(configs.length - configuredKeyCount, 0)

  const fetchConfigs = () => {
    setLoading(true)
    llmConfigApi.list()
      .then(res => {
        setConfigs(res.data.data || [])
        setLoadError(null)
      })
      .catch(error => {
        setLoadError(formatApiError(error, '加载模型配置失败'))
        showApiError(error, '加载模型配置失败')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchConfigs() }, [])

  const handleCreate = () => {
    setEditingConfig(null)
    form.resetFields()
    setSubmitError(null)
    setSelectedProvider('OPENAI')
    form.setFieldsValue({
      provider: 'OPENAI',
      baseUrl: PROVIDER_PRESETS.OPENAI.baseUrl,
      temperature: 0.7,
      maxTokens: 4096,
    })
    setModalOpen(true)
  }

  const handleEdit = (config: LlmConfig) => {
    setEditingConfig(config)
    setSubmitError(null)
    setSelectedProvider(config.provider)
    form.setFieldsValue({
      provider: config.provider,
      modelName: config.modelName,
      apiKey: '',
      baseUrl: config.baseUrl,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    })
    setModalOpen(true)
  }

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider)
    const preset = PROVIDER_PRESETS[provider]
    if (preset) {
      form.setFieldsValue({ baseUrl: preset.baseUrl })
      if (preset.models.length > 0) {
        form.setFieldsValue({ modelName: preset.models[0] })
      }
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      setSubmitError(null)
      if (editingConfig) {
        await llmConfigApi.update(editingConfig.id, values)
        message.success('配置已更新')
      } else {
        await llmConfigApi.create(values)
        message.success('配置已创建')
      }
      setOperationError(null)
      setModalOpen(false)
      fetchConfigs()
    } catch (error: any) {
      if (error?.errorFields) return
      setSubmitError(formatApiError(error, '保存模型配置失败'))
      setOperationError({
        title: editingConfig ? '模型配置保存失败' : '模型配置创建失败',
        description: formatApiError(error, '保存模型配置失败'),
      })
      showApiError(error, '保存配置失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivate = async (configId: number) => {
    try {
      await llmConfigApi.activate(configId)
      message.success('已激活')
      setOperationError(null)
      fetchConfigs()
    } catch (error) {
      setOperationError({
        title: '模型激活失败',
        description: formatApiError(error, '激活模型配置失败'),
      })
      showApiError(error, '激活失败')
    }
  }

  const handleDelete = async (configId: number) => {
    try {
      await llmConfigApi.delete(configId)
      message.success('已删除')
      setOperationError(null)
      fetchConfigs()
    } catch (error) {
      setOperationError({
        title: '模型配置删除失败',
        description: formatApiError(error, '删除模型配置失败'),
      })
      showApiError(error, '删除失败')
    }
  }

  const scrollToProviderTable = () => {
    document.querySelector('.sl-model-table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const governanceSteps = useMemo<ModelGovernanceStep[]>(() => [
    {
      key: 'activation-gate',
      icon: <ThunderboltOutlined />,
      label: '激活门禁',
      status: activeConfig ? activeConfig.modelName : '未激活',
      detail: activeConfig
        ? '当前仅证明 SourceLens 已选择一个调用入口，不代表模型质量、回答正确性或供应商 SLA。'
        : '没有激活配置时，Agent、代码问答、自动修复和诊断链路必须保持不可调用或降级。',
      tone: activeConfig ? 'ready' : 'danger',
      actionLabel: activeConfig ? '查看配置' : '添加配置',
      onAction: activeConfig ? scrollToProviderTable : handleCreate,
    },
    {
      key: 'secret-boundary',
      icon: <KeyOutlined />,
      label: '密钥边界',
      status: `${configuredKeyCount}/${configs.length || 0}`,
      detail: missingKeyCount > 0
        ? `${missingKeyCount} 个配置缺少密钥。页面只展示脱敏状态，不提供明文回显或复制。`
        : configs.length > 0
          ? '所有配置均具备密钥状态。该状态只证明配置存在，不证明密钥可用或额度充足。'
          : '尚无配置，无法形成可验证的密钥边界。',
      tone: configs.length === 0 ? 'danger' : missingKeyCount > 0 ? 'warning' : 'ready',
      actionLabel: '复核密钥',
      onAction: scrollToProviderTable,
    },
    {
      key: 'endpoint-risk',
      icon: <ApiOutlined />,
      label: 'Endpoint 风险',
      status: endpointOverrideCount > 0 ? `${endpointOverrideCount} 个需复核` : configs.length > 0 ? '预设地址' : '待配置',
      detail: endpointOverrideCount > 0
        ? '非预设 Endpoint 需要额外复核代理、私有网关、审计和出网边界。'
        : configs.length > 0
          ? '当前使用预设 Endpoint，仍需要由后端连接测试和审计日志证明真实可用。'
          : '缺少配置时无法判断 Endpoint 风险。',
      tone: configs.length === 0 ? 'danger' : endpointOverrideCount > 0 ? 'warning' : 'ready',
      actionLabel: '查看 Endpoint',
      onAction: scrollToProviderTable,
    },
    {
      key: 'downstream-capability',
      icon: <SafetyCertificateOutlined />,
      label: '下游能力',
      status: !activeConfig ? '不可用' : missingKeyCount > 0 ? '需复核' : '可进入调用',
      detail: !activeConfig
        ? '下游 Agent、QA、AutoRepair 必须等待激活配置完成后再进入真实调用。'
        : missingKeyCount > 0
          ? '存在配置缺口时只允许受控调用，不能宣称供应商质量或 LLM 事实正确。'
          : '下游链路可以读取激活配置，但最终质量必须由任务证据、引用和回归测试证明。',
      tone: !activeConfig ? 'danger' : missingKeyCount > 0 ? 'warning' : 'ready',
      actionLabel: '查看门禁',
      onAction: scrollToProviderTable,
    },
  ], [activeConfig, configs.length, configuredKeyCount, endpointOverrideCount, missingKeyCount])

  const columns = [
    {
      title: '状态',
      key: 'active',
      width: 70,
      render: (_: unknown, record: LlmConfig) =>
        record.isActive ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>激活</Tag>
        ) : (
          <Tag>未激活</Tag>
        ),
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
      render: (provider: string) => <Tag color={PROVIDER_COLORS[provider] || '#64748b'}>{provider}</Tag>,
    },
    {
      title: '模型',
      dataIndex: 'modelName',
      key: 'modelName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'API 地址',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      ellipsis: true,
      render: (url: string, record: LlmConfig) => (
        <div className="sl-model-endpoint-cell">
          <Text type="secondary" copyable>{url}</Text>
          {hasEndpointOverride(record) && (
            <Tag color="warning">{record.provider === 'CUSTOM' ? '自定义' : '覆盖'}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '密钥状态',
      dataIndex: 'apiKey',
      key: 'apiKey',
      width: 180,
      render: (key: string) => (
        key ? (
          <div className="sl-model-secret-cell">
            <Tag color="success" icon={<LockOutlined />}>已加密保存</Tag>
            <Text type="secondary">{displayApiKeyBoundary(key)}</Text>
          </div>
        ) : (
          <Tag color="error" icon={<WarningOutlined />}>未配置</Tag>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: LlmConfig) => (
        <Space size="small">
          {!record.isActive && (
            <ActionButton size="small" type="primary" icon={<ThunderboltOutlined />} onClick={() => handleActivate(record.id)} label="激活" />
          )}
          <ActionButton size="small" onClick={() => handleEdit(record)} label="编辑" />
          <Popconfirm title="确认删除该模型配置？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(record.id)}>
            <IconActionButton label={`删除模型配置 ${record.modelName}`} tooltip="删除" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="sl-model-page">
      <div className="sl-model-cockpit">
        <section className="sl-model-cockpit-main">
          <span className="sl-kicker">LLM Provider Control</span>
          <h1 className="sl-model-title">模型配置与密钥边界</h1>
          <p className="sl-model-desc">
            管理 Agent、代码问答、自动修复和诊断链路使用的模型入口，确保激活配置、Endpoint 与密钥状态可被快速判断。
          </p>
          <div className="sl-model-actions">
            <ActionButton icon={<ReloadOutlined />} onClick={fetchConfigs} label="刷新" />
            <ActionButton type="primary" icon={<PlusOutlined />} onClick={handleCreate} label="添加配置" />
          </div>
        </section>

        <section className={`sl-model-readiness sl-model-readiness-${readinessTone}`}>
          <div className="sl-model-readiness-head">
            <SafetyCertificateOutlined />
            <div>
              <span>Provider readiness</span>
              <strong>{readinessLabel(readinessTone)}</strong>
            </div>
          </div>
          <div className="sl-model-readiness-list">
            <div>
              {activeConfig ? <CheckCircleOutlined /> : <WarningOutlined />}
              <span>{activeConfig ? `当前激活 ${activeConfig.modelName}` : '尚未激活模型配置'}</span>
            </div>
            <div>
              <LockOutlined />
              <span>{configuredKeyCount}/{configs.length || 0} 个配置具备密钥</span>
            </div>
            <div>
              <ApiOutlined />
              <span>{endpointOverrideCount > 0 ? `${endpointOverrideCount} 个 Endpoint 需复核` : '使用预设 Endpoint'}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="sl-model-summary-grid">
        <ModelStat icon={<ThunderboltOutlined />} label="激活配置" value={activeConfig ? activeConfig.modelName : '未激活'} tone={activeConfig ? 'ready' : 'danger'} />
        <ModelStat icon={<SettingOutlined />} label="配置数量" value={String(configs.length)} />
        <ModelStat icon={<ApiOutlined />} label="Provider" value={String(providerCount)} />
        <ModelStat icon={<KeyOutlined />} label="密钥覆盖" value={`${configuredKeyCount}/${configs.length || 0}`} tone={configuredKeyCount === configs.length && configs.length > 0 ? 'ready' : 'warning'} />
      </div>

      <ModelProviderGovernancePanel steps={governanceSteps} />

      {operationError && (
        <StateBlock
          tone="error"
          title={operationError.title}
          description={operationError.description}
          action={<ActionButton icon={<ReloadOutlined />} onClick={fetchConfigs} label="重新同步配置" />}
        />
      )}

      <Card className="sl-section-card sl-model-table-card" title={<span className="sl-card-title"><SettingOutlined /> Provider 配置</span>}>
        {loadError && configs.length === 0 ? (
          <StateBlock
            tone="error"
            title="模型配置加载失败"
            description={loadError}
            action={<ActionButton icon={<ReloadOutlined />} onClick={fetchConfigs} label="重新加载配置" />}
          />
        ) : (
          <>
            {loadError && (
              <StateBlock
                compact
                tone="error"
                title="模型配置刷新失败，已保留上次成功数据"
                description={loadError}
                action={<ActionButton icon={<ReloadOutlined />} onClick={fetchConfigs} label="重新加载配置" />}
              />
            )}
            <Table
              className="sl-model-provider-table"
              dataSource={configs}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              scroll={{ x: 780 }}
              rowClassName={(record) => record.isActive ? 'sl-model-row-active' : ''}
              locale={{ emptyText: <StateBlock compact title="暂无模型配置" description="添加 provider、模型和密钥后，Agent、代码问答和自动修复才能调用模型能力。" /> }}
            />
          </>
        )}
      </Card>

      <Modal
        title={editingConfig ? '编辑模型配置' : '添加模型配置'}
        open={modalOpen}
        onCancel={() => {
          setSubmitError(null)
          setModalOpen(false)
        }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={560}
      >
        <Form form={form} layout="vertical" className="sl-model-form">
          {submitError && (
            <Alert
              type="error"
              showIcon
              message={editingConfig ? '模型配置保存失败' : '模型配置创建失败'}
              description={submitError}
            />
          )}
          <Alert
            type={editingConfig ? 'info' : 'warning'}
            showIcon
            message={editingConfig ? '留空 API Key 会保留当前密钥' : 'API Key 只会加密保存，前端不会再次显示明文'}
          />

          <Form.Item name="provider" label="提供商" rules={[{ required: true }]}>
            <Select onChange={handleProviderChange}>
              <Select.Option value="OPENAI">OpenAI</Select.Option>
              <Select.Option value="ANTHROPIC">Anthropic (Claude)</Select.Option>
              <Select.Option value="DEEPSEEK">DeepSeek</Select.Option>
              <Select.Option value="CUSTOM">自定义 (OpenAI 兼容)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="modelName" label="模型名称" rules={[{ required: true, message: '请选择或输入模型名称' }]}>
            <AutoComplete
              options={
                PROVIDER_PRESETS[selectedProvider]?.models.map(m => ({ value: m })) || []
              }
              placeholder="选择或输入模型名称，例如: gpt-4o, deepseek-chat"
              filterOption={(inputValue, option) =>
                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={editingConfig ? [] : [{ required: true, message: '请输入 API Key' }]}
            extra={editingConfig ? '留空则保留当前 API Key' : undefined}
          >
            <Input.Password placeholder={editingConfig ? '留空则不修改' : '输入 provider token'} />
          </Form.Item>

          <Form.Item name="baseUrl" label="API 地址" rules={[{ required: true }]}>
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Space size="large" className="sl-model-param-row">
            <Form.Item name="temperature" label="Temperature">
              <InputNumber min={0} max={2} step={0.1} placeholder="0.7" />
            </Form.Item>
            <Form.Item name="maxTokens" label="Max Tokens">
              <InputNumber min={256} max={128000} step={256} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

function ModelProviderGovernancePanel({ steps }: { steps: ModelGovernanceStep[] }) {
  return (
    <section className="sl-model-provider-governance" aria-label="模型供应商治理闭环">
      <div className="sl-model-provider-governance-head">
        <div>
          <span className="sl-kicker">Provider Governance Loop</span>
          <h2>模型供应商治理闭环</h2>
          <p>把模型配置从普通表单提升为四段门禁：激活、密钥、Endpoint 和下游能力。</p>
        </div>
        <Tag color="blue">四段门禁</Tag>
      </div>
      <div className="sl-model-provider-governance-grid">
        {steps.map(step => (
          <article
            key={step.key}
            className={`sl-model-provider-governance-step sl-model-provider-governance-step-${step.tone}`}
            data-sl-model-governance-step={step.key}
          >
            <div className="sl-model-provider-governance-step-head">
              <span className="sl-model-provider-governance-icon">{step.icon}</span>
              <div className="sl-model-provider-governance-step-copy">
                <span>{step.label}</span>
                <strong>{step.status}</strong>
              </div>
            </div>
            <p>{step.detail}</p>
            <ActionButton size="small" type="text" onClick={step.onAction} label={step.actionLabel} />
          </article>
        ))}
      </div>
    </section>
  )
}

function ModelStat({ icon, label, value, tone = 'idle' }: { icon: ReactNode; label: string; value: string; tone?: 'ready' | 'warning' | 'danger' | 'idle' }) {
  return (
    <div className={`sl-model-stat sl-model-stat-${tone}`}>
      <div className="sl-model-stat-head">
        {icon}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  )
}

function readinessLabel(tone: 'ready' | 'warning' | 'danger') {
  if (tone === 'ready') return '可用'
  if (tone === 'warning') return '需复核'
  return '未就绪'
}
