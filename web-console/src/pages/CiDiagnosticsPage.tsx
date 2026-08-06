import { useSearchParams } from 'react-router-dom'
import ProjectSelector from '../components/ProjectSelector'
import CiDiagnostics from './CiDiagnostics'

export default function CiDiagnosticsPage() {
  const [searchParams] = useSearchParams()
  const initialProjectId = Number(searchParams.get('projectId')) || undefined
  const initialDiagnosticId = Number(searchParams.get('diagnosticId')) || undefined

  return (
    <ProjectSelector title="选择项目" initialProjectId={initialProjectId}>
      {(projectId) => <CiDiagnostics projectId={projectId} initialDiagnosticId={initialDiagnosticId} />}
    </ProjectSelector>
  )
}
