import ProjectSelector from '../components/ProjectSelector'
import IssueDecompositionView from './IssueDecomposition'

export default function IssueDecompositionPage() {
  return (
    <ProjectSelector title="选择项目">
      {(projectId) => <IssueDecompositionView projectId={projectId} />}
    </ProjectSelector>
  )
}