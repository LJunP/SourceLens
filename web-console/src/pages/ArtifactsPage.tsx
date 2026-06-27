import { useSearchParams } from 'react-router-dom'
import ProjectSelector from '../components/ProjectSelector'
import Artifacts from './Artifacts'

export default function ArtifactsPage() {
  const [searchParams] = useSearchParams()
  const initialProjectId = Number(searchParams.get('projectId')) || undefined
  const ownerType = searchParams.get('ownerType') || undefined
  const ownerId = Number(searchParams.get('ownerId')) || undefined
  const repositoryId = Number(searchParams.get('repositoryId')) || undefined
  const artifactId = Number(searchParams.get('artifactId')) || undefined

  return (
    <ProjectSelector title="选择项目" initialProjectId={initialProjectId}>
      {(projectId) => (
        <Artifacts
          projectId={projectId}
          initialFilters={{
            ownerType,
            ownerId,
            repositoryId,
          }}
          initialArtifactId={artifactId}
        />
      )}
    </ProjectSelector>
  )
}
