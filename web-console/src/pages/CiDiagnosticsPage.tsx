import ProjectSelector from '../components/ProjectSelector'
import CiDiagnostics from './CiDiagnostics'

export default function CiDiagnosticsPage() {
  return (
    <ProjectSelector title="选择项目">
      {(projectId) => <CiDiagnostics projectId={projectId} />}
    </ProjectSelector>
  )
}