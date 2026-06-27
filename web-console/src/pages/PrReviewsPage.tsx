import { useSearchParams } from 'react-router-dom'
import ProjectSelector from '../components/ProjectSelector'
import PrReviews from './PrReviews'

export default function PrReviewsPage() {
  const [searchParams] = useSearchParams()
  const initialProjectId = Number(searchParams.get('projectId')) || undefined

  return (
    <ProjectSelector title="选择项目" initialProjectId={initialProjectId}>
      {(projectId) => <PrReviews projectId={projectId} />}
    </ProjectSelector>
  )
}
