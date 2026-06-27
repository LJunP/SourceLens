import { useSearchParams } from 'react-router-dom'
import ProjectSelector from '../components/ProjectSelector'
import AgentTasks from './AgentTasks'

export default function AgentTasksPage() {
  const [searchParams] = useSearchParams()
  const initialProjectId = Number(searchParams.get('projectId')) || undefined
  return (
    <ProjectSelector title="选择项目" initialProjectId={initialProjectId}>
      {(projectId) => <AgentTasks projectId={projectId} />}
    </ProjectSelector>
  )
}
