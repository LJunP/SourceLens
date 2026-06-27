import { useSearchParams } from 'react-router-dom'
import ProjectSelector from '../components/ProjectSelector'
import AuditLogs from './AuditLogs'

export default function AuditLogsPage() {
  const [searchParams] = useSearchParams()
  const initialProjectId = Number(searchParams.get('projectId')) || undefined
  const initialToolScanTaskId = Number(searchParams.get('scanTaskId')) || undefined

  return (
    <ProjectSelector title="选择项目" initialProjectId={initialProjectId}>
      {(projectId) => <AuditLogs projectId={projectId} initialToolScanTaskId={initialToolScanTaskId} />}
    </ProjectSelector>
  )
}
