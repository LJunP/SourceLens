import { useState, useEffect } from 'react'
import { Select, Typography, Spin, Empty } from 'antd'
import { projectApi, Project } from '../api/project'

const { Title } = Typography

interface Props {
  title?: string
  initialProjectId?: number
  children: (projectId: number) => React.ReactNode
}

export default function ProjectSelector({ title = '选择项目', initialProjectId, children }: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectApi
      .list(1, 100)
      .then((res) => {
        const items = res.data.data.items || []
        setProjects(items)
        if (items.length > 0) {
          const initial = initialProjectId && items.some(item => item.id === initialProjectId)
            ? initialProjectId
            : items[0].id
          setSelectedProjectId(initial)
        }
      })
      .finally(() => setLoading(false))
  }, [initialProjectId])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
        <div style={{ marginTop: 12, color: '#64748b' }}>加载中...</div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <Empty
        description="暂无项目，请先创建一个项目"
        style={{ marginTop: 60 }}
      />
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Title level={5} style={{ margin: 0 }}>{title}：</Title>
        <Select
          style={{ width: 300 }}
          placeholder="请选择项目"
          value={selectedProjectId}
          onChange={setSelectedProjectId}
          options={projects.map((p) => ({ label: p.name, value: p.id }))}
        />
      </div>
      {selectedProjectId && children(selectedProjectId)}
    </div>
  )
}
