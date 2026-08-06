import { useSearchParams } from 'react-router-dom'
import ProjectSelector from '../components/ProjectSelector'
import AutoRepairs from './AutoRepairs'
import type { AutoRepairProvenance } from '../api/autoRepair'

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
  const scanTaskId = parsePositiveId(searchParams.get('scanTaskId'))
  const filePath = searchParams.get('filePath') || undefined
  const targetDesc = searchParams.get('targetDesc') || undefined
  const source = searchParams.get('source') || undefined
  const openCreate = searchParams.get('openCreate') === '1'
  const provenance = parseProvenance(searchParams)
  const initialDraft = openCreate || repositoryId || filePath || targetDesc
    ? { repositoryId, scanTaskId, filePath, targetDesc, source, provenance }
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

function parseProvenance(searchParams: URLSearchParams): AutoRepairProvenance | undefined {
  const sourceType = searchParams.get('sourceType') || undefined
  if (!sourceType) return undefined
  return {
    sourceType,
    source: searchParams.get('source') || undefined,
    scanTaskId: parsePositiveId(searchParams.get('scanTaskId')),
    filePath: searchParams.get('filePath') || undefined,
    chunkId: parsePositiveId(searchParams.get('chunkId')),
    citationId: searchParams.get('citationId') || undefined,
    sourceLabel: searchParams.get('sourceLabel') || undefined,
    startLine: parsePositiveId(searchParams.get('startLine')),
    endLine: parsePositiveId(searchParams.get('endLine')),
    citedByAnswer: parseBoolean(searchParams.get('citedByAnswer')),
    groundingStatus: searchParams.get('groundingStatus') || undefined,
    citationEnforcementStatus: searchParams.get('citationEnforcementStatus') || undefined,
    citationEnforcementReason: searchParams.get('citationEnforcementReason') || undefined,
    evidenceType: searchParams.get('evidenceType') || undefined,
    evidenceReason: searchParams.get('evidenceReason') || undefined,
    sourceEvidenceCategory: searchParams.get('sourceEvidenceCategory') || undefined,
    sourceEvidenceSource: searchParams.get('sourceEvidenceSource') || undefined,
    sourceEvidenceTitle: searchParams.get('sourceEvidenceTitle') || undefined,
    sourceEvidenceFilePath: searchParams.get('sourceEvidenceFilePath') || undefined,
    sourceEvidenceLineNumber: searchParams.get('sourceEvidenceLineNumber') || undefined,
    sourceEvidenceMatched: parseBoolean(searchParams.get('sourceEvidenceMatched')),
    sourceEvidenceMatchType: searchParams.get('sourceEvidenceMatchType') || undefined,
    artifactId: parsePositiveId(searchParams.get('artifactId')),
    artifactType: searchParams.get('artifactType') || undefined,
    riskKey: searchParams.get('riskKey') || undefined,
    riskCategory: searchParams.get('riskCategory') || undefined,
    riskSeverity: searchParams.get('riskSeverity') || undefined,
    lineNumber: parsePositiveId(searchParams.get('lineNumber')),
  }
}

function parseBoolean(value: string | null) {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}
