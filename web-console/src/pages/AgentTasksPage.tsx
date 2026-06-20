import ProjectSelector from '../components/ProjectSelector'
import AgentTasks from './AgentTasks'

export default function AgentTasksPage() {
  return (
    <ProjectSelector title="选择项目">
      {(projectId) => <AgentTasks projectId={projectId} />}
    </ProjectSelector>
  )
}