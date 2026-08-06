import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProjectOutlined, ReloadOutlined } from '@ant-design/icons'
import { Select, Typography } from 'antd'
import { projectApi, Project } from '../api/project'
import { formatApiError } from '../api/client'
import ActionButton from './ui/ActionButton'
import StateBlock from './ui/StateBlock'

const { Title } = Typography

interface Props {
  title?: string
  initialProjectId?: number
  children: (projectId: number) => React.ReactNode
}

export default function ProjectSelector({ title = '选择项目', initialProjectId, children }: Props) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadProjects = useCallback(() => {
    setLoading(true)
    setLoadError(null)
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
        } else {
          setSelectedProjectId(null)
        }
      })
      .catch((error) => {
        setProjects([])
        setSelectedProjectId(null)
        setLoadError(formatApiError(error, '加载项目列表失败'))
      })
      .finally(() => setLoading(false))
  }, [initialProjectId])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  if (loading) {
    return (
      <div style={{ padding: 60 }}>
        <StateBlock tone="loading" title="正在加载项目" description="项目列表加载完成后会自动选择当前工作区。" />
      </div>
    )
  }

  if (loadError) {
    return (
      <StateBlock
        tone="error"
        title="项目列表加载失败"
        description={loadError}
        action={<ActionButton icon={<ReloadOutlined />} onClick={loadProjects} label="重试加载" />}
      />
    )
  }

  if (projects.length === 0) {
    return (
      <StateBlock
        title="暂无项目"
        description="先创建项目并接入公开仓库，审计、任务、产物、修复和报告页面才能形成完整闭环。"
        action={
          <ActionButton
            type="primary"
            icon={<ProjectOutlined />}
            onClick={() => navigate('/projects')}
            label="去项目管理"
          />
        }
      />
    )
  }

  return (
    <div>
      <div className="sl-project-selector-bar">
        <Title level={5} style={{ margin: 0 }}>{title}：</Title>
        <Select
          className="sl-project-selector-select"
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
