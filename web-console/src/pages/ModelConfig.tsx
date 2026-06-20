import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Typography, Button, Space, Modal, Form, Input, Select,
  InputNumber, message, Popconfirm
} from 'antd'
import {
  SettingOutlined, PlusOutlined, DeleteOutlined,
  ThunderboltOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import { llmConfigApi, LlmConfig, PROVIDER_PRESETS } from '../api/modelConfig'

const { Title, Text } = Typography

export default function ModelConfig() {
  const [configs, setConfigs] = useState<LlmConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LlmConfig | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('OPENAI')

  const fetchConfigs = () => {
    setLoading(true)
    llmConfigApi.list()
      .then(res => setConfigs(res.data.data || []))
      .catch(() => message.error('加载配置失败'))
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
      apiKey: config.apiKey,
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
    } catch {
      // validation error
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivate = async (configId: number) => {
    try {
      await llmConfigApi.activate(configId)
      message.success('已激活')
      fetchConfigs()
    } catch {
      message.error('激活失败')
    }
  }

  const handleDelete = async (configId: number) => {
    try {
      await llmConfigApi.delete(configId)
      message.success('已删除')
      fetchConfigs()
    } catch {
      message.error('删除失败')
    }
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return '***'
    return key.slice(0, 4) + '****' + key.slice(-4)
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
      render: (p: string) => {
        const colors: Record<string, string> = {
          OPENAI: '#10a37f', ANTHROPIC: '#d97706', DEEPSEEK: '#6366f1', CUSTOM: '#666'
        }
        return <Tag color={colors[p] || '#666'}>{p}</Tag>
      },
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
      render: (url: string) => <Text type="secondary" copyable>{url}</Text>,
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      width: 160,
      render: (key: string) => <Text code>{maskKey(key)}</Text>,
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
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <SettingOutlined style={{ fontSize: 20 }} />
          <Title level={4} style={{ margin: 0 }}>模型配置</Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          添加配置
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Text type="secondary">
          配置 LLM 模型后,Agent 任务将自动使用 AI 进行深度代码分析。支持 OpenAI、Anthropic (Claude)、DeepSeek 等 OpenAI 兼容 API。
          当前激活的配置会自动用于所有 Agent 任务。
        </Text>
      </Card>

      <Table
        dataSource={configs}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
      />

      <Modal
        title={editingConfig ? '编辑模型配置' : '添加模型配置'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="provider" label="提供商" rules={[{ required: true }]}>
            <Select onChange={handleProviderChange}>
              <Select.Option value="OPENAI">OpenAI</Select.Option>
              <Select.Option value="ANTHROPIC">Anthropic (Claude)</Select.Option>
              <Select.Option value="DEEPSEEK">DeepSeek</Select.Option>
              <Select.Option value="CUSTOM">自定义 (OpenAI 兼容)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="modelName" label="模型名称" rules={[{ required: true }]}>
            <Select
              showSearch
              allowClear
              placeholder="选择或输入模型名称"
              options={
                PROVIDER_PRESETS[selectedProvider]?.models.map(m => ({ label: m, value: m })) || []
              }
            />
          </Form.Item>

          <Form.Item name="apiKey" label="API Key" rules={[{ required: true }]}>
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Form.Item name="baseUrl" label="API 地址" rules={[{ required: true }]}>
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Space size="large">
            <Form.Item name="temperature" label="Temperature">
              <InputNumber min={0} max={2} step={0.1} />
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