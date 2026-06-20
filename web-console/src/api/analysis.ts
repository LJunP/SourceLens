import client from './client'
import type { Result } from './client'

export interface ScanArtifact {
  id: number
  scanTaskId: number
  artifactType: string
  storagePath: string
  summaryJson: string
  createdAt: string
}

export interface CodeSymbol {
  id: number
  scanTaskId: number
  symbolId: string
  name: string
  kind: string
  package_: string
  filePath: string
  lineNumber: number
  endLine: number | null
  returnType: string | null
  parentClass: string | null
}

export interface CodeRelation {
  id: number
  scanTaskId: number
  sourceId: string
  targetId: string
  relationType: string
  filePath: string
  lineNumber: number
}

export interface GraphNode {
  id: string
  label: string
  kind: string
  filePath?: string
  package?: string
  lineNumber?: number
}

export interface GraphEdge {
  source: string
  target: string
  relationType: string
}

export interface DependencyGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  summary: {
    totalNodes: number
    totalEdges: number
    byKind: Record<string, number>
    byRelation: Record<string, number>
  }
}

export const analysisApi = {
  listByTask: (scanTaskId: number) =>
    client.get<Result<ScanArtifact[]>>(`/scan-tasks/${scanTaskId}/artifacts`),
  getByType: (scanTaskId: number, artifactType: string) =>
    client.get<Result<ScanArtifact>>(`/scan-tasks/${scanTaskId}/artifacts/${artifactType}`),

  // V0.4: 图谱 API
  listSymbols: (scanTaskId: number, kind?: string) => {
    const params = kind ? `?kind=${kind}` : ''
    return client.get<Result<CodeSymbol[]>>(`/scan-tasks/${scanTaskId}/symbols${params}`)
  },
  listRelations: (scanTaskId: number, relationType?: string) => {
    const params = relationType ? `?relationType=${relationType}` : ''
    return client.get<Result<CodeRelation[]>>(`/scan-tasks/${scanTaskId}/relations${params}`)
  },
  getGraph: (scanTaskId: number) =>
    client.get<Result<DependencyGraph>>(`/scan-tasks/${scanTaskId}/graph`),
}