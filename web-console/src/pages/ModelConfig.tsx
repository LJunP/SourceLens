import { useMemo, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  Alert, Card, Table, Tag, Typography, Button, Space, Modal, Form, Input, Select,
  InputNumber, message, Popconfirm, AutoComplete, Tooltip
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
import { showApiError } from '../api/client'

const { Text } = Typography

const PROVIDER_COLORS: Record<string, string> = {
  OPENAI: '#10a37f',
  ANTHROPIC: '#d97706',
  DEEPSEEK: '#6366f1',
  CUSTOM: '#64748b',
}

export default function ModelConfig() {
  const [configs, setConfigs] = useState<LlmConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LlmConfig | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('OPENAI')

  const activeConfig = useMemo(() => configs.find(config => config.isActive) || null, [configs])
  const providerCount = useMemo(() => new Set(configs.map(config => config.provider)).size, [configs])
  const configuredKeyCount = useMemo(() => configs.filter(config => Boolean(config.apiKey)).length, [configs])
  const customEndpointCount = useMemo(() => configs.filter(config => config.provider === 'CUSTOM').length, [configs])
  const readinessTone = !activeConfig ? 'danger' : configuredKeyCount < configs.length ? 'warning' : 'ready'

  const fetchConfigs = () => {
    setLoading(true)
    llmConfigApi.list()
      .then(res => setConfigs(res.data.data || []))
      .catch(error => showApiError(error, '加载配置失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchConfigs() }, [])

  const handleCreate = () => {
    setEditingConfig(null)
    form.resetFields()
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
      if (editingConfig) {
        await llmConfigApi.update(editingConfig.id, values)
        message.success('配置已更新')
      } else {
        await llmConfigApi.create(values)
        message.success('配置已创建')
      }
      setModalOpen(false)
      fetchConfigs()
    } catch (error: any) {
      if (error?.errorFields) return
      showApiError(error, '保存配置失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivate = async (configId: number) => {
    try {
      await llmConfigApi.activate(configId)
      message.success('已激活')
      fetchConfigs()
    } catch (error) {
      showApiError(error, '激活失败')
    }
  }

  const handleDelete = async (configId: number) => {
    try {
      await llmConfigApi.delete(configId)
      message.success('已删除')
      fetchConfigs()
    } catch (error) {
      showApiError(error, '删除失败')
    }
  }

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
          {record.provider === 'CUSTOM' && <Tag color="warning">自定义</Tag>}
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
            <Text type="secondary">{key}</Text>
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
            <Button size="small" type="primary" icon={<ThunderboltOutlined />}
              onClick={() => handleActivate(record.id)}>激活</Button>
          )}
          <Button size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该模型配置？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
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
            <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              添加配置
            </Button>
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
              <span>{customEndpointCount > 0 ? `${customEndpointCount} 个自定义 Endpoint` : '使用预设 Endpoint'}</span>
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

      <Card className="sl-section-card sl-model-table-card" title={<span className="sl-card-title"><SettingOutlined /> Provider 配置</span>}>
        <Table
          dataSource={configs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          rowClassName={(record) => record.isActive ? 'sl-model-row-active' : ''}
        />
      </Card>

      <Modal
        title={editingConfig ? '编辑模型配置' : '添加模型配置'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={560}
      >
        <Form form={form} layout="vertical" className="sl-model-form">
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
              <InputNumber min={0} max={2} step={0.1} addonAfter={<Tooltip title="越高越发散">T</Tooltip>} />
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
