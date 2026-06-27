import { useSearchParams } from 'react-router-dom'
import ProjectSelector from '../components/ProjectSelector'
import AutoRepairs from './AutoRepairs'

function parsePositiveId(value: string | null) {
  if (!value) return undefined
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

export default function AutoRepairsPage() {
  const [searchParams] = useSearchParams()
  const projectId = parsePositiveId(searchParams.get('projectId'))
  const repairId = parsePositiveId(searchParams.get('repairId'))
  const repositoryId = parsePositiveId(searchParams.get('repositoryId'))
  const filePath = searchParams.get('filePath') || undefined
  const targetDesc = searchParams.get('targetDesc') || undefined
  const source = searchParams.get('source') || undefined
  const openCreate = searchParams.get('openCreate') === '1'
  const initialDraft = openCreate || repositoryId || filePath || targetDesc
    ? { repositoryId, filePath, targetDesc, source }
    : undefined

  return (
    <ProjectSelector title="选择项目" initialProjectId={projectId}>
      {(selectedProjectId) => (
        <AutoRepairs
          projectId={selectedProjectId}
          initialRepairId={repairId}
          initialDraft={initialDraft}
        />
      )}
    </ProjectSelector>
  )
}
