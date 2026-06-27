import { useSearchParams } from 'react-router-dom'
import ProjectSelector from '../components/ProjectSelector'
import ExecutionTasks from './ExecutionTasks'

export default function ExecutionTasksPage() {
  const [searchParams] = useSearchParams()
  const initialProjectId = Number(searchParams.get('projectId')) || undefined
  const initialTaskId = Number(searchParams.get('taskId')) || undefined

  return (
    <ProjectSelector title="选择项目" initialProjectId={initialProjectId}>
      {(projectId) => <ExecutionTasks projectId={projectId} initialTaskId={initialTaskId} />}
    </ProjectSelector>
  )
}
