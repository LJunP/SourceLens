import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Button, Modal, Form, Input, Space, Popconfirm, message, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { projectApi, Project } from '../api/project'

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    projectApi.list(1, 100).then((res) => setProjects(res.data.data.items)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    const values = await form.validateFields()
    if (editing) {
      await projectApi.update(editing.id, values)
      message.success('更新成功')
    } else {
      await projectApi.create(values)
      message.success('创建成功')
    }
    setModalOpen(false)
    form.resetFields()
    setEditing(null)
    load()
  }

  const handleDelete = async (id: number) => {
    await projectApi.delete(id)
    message.success('删除成功')
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>项目管理</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true) }}>新建项目</Button>
      </div>
      <Card>
        <Table
          dataSource={projects}
          rowKey="id"
          loading={loading}
          columns={[
            { title: '项目名称', dataIndex: 'name', key: 'name' },
            { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
            { title: '状态', dataIndex: 'status', key: 'status' },
            { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
            {
              title: '操作', key: 'action', width: 160,
              render: (_: any, record: Project) => (
                <Space>
                  <Button size="small" onClick={() => navigate(`/projects/${record.id}`)}>查看</Button>
                  <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue(record); setModalOpen(true) }} />
                  <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              )
            },
          ]}
        />
      </Card>
      <Modal
        title={editing ? '编辑项目' : '新建项目'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields() }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}