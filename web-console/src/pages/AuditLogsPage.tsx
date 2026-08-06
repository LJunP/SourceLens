import { useSearchParams } from 'react-router-dom'
import ProjectSelector from '../components/ProjectSelector'
import AuditLogs from './AuditLogs'

export default function AuditLogsPage() {
  const [searchParams] = useSearchParams()
  const initialProjectId = Number(searchParams.get('projectId')) || undefined
  const initialToolScanTaskId = Number(searchParams.get('scanTaskId')) || undefined
  const initialToolConversationId = Number(searchParams.get('conversationId')) || undefined
  const initialAuditFilters = {
    auditLogId: Number(searchParams.get('auditLogId')) || undefined,
    resourceType: searchParams.get('resourceType') || undefined,
    resourceId: Number(searchParams.get('resourceId')) || undefined,
    action: searchParams.get('action') || undefined,
    status: searchParams.get('status') || undefined,
  }

  return (
    <ProjectSelector title="选择项目" initialProjectId={initialProjectId}>
      {(projectId) => (
        <AuditLogs
          projectId={projectId}
          initialToolScanTaskId={initialToolScanTaskId}
          initialToolConversationId={initialToolConversationId}
          initialAuditFilters={initialAuditFilters}
        />
      )}
    </ProjectSelector>
  )
}
