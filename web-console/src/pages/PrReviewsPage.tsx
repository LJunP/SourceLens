import ProjectSelector from '../components/ProjectSelector'
import PrReviews from './PrReviews'

export default function PrReviewsPage() {
  return (
    <ProjectSelector title="选择项目">
      {(projectId) => <PrReviews projectId={projectId} />}
    </ProjectSelector>
  )
}