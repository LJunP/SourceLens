import { useSearchParams } from 'react-router-dom'
import ProjectSelector from '../components/ProjectSelector'
import IssueDecompositionView from './IssueDecomposition'

export default function IssueDecompositionPage() {
  const [searchParams] = useSearchParams()
  const initialProjectId = Number(searchParams.get('projectId')) || undefined

  return (
    <ProjectSelector title="选择项目" initialProjectId={initialProjectId}>
      {(projectId) => <IssueDecompositionView projectId={projectId} />}
    </ProjectSelector>
  )
}
