import client from './client'
import type { Result } from './client'

export interface DashboardStats {
  projectCount: number
  repositoryCount: number
  totalScans: number
  successScans: number
  failedScans: number
  runningScans: number
  pendingScans: number
  agentTaskCount: number
  agentTaskRunning: number
  agentTaskCompleted: number
  issueCount: number
  issueCompleted: number
  latestTotalFiles: number | null
  latestTotalLines: number | null
  latestTotalDirs: number | null
  latestControllers: number | null
  latestServices: number | null
  latestRiskCount: number | null
  latestCodeChunks: number | null
  latestEmbeddedChunks: number | null
  languagesJson: string | null
  trustedLoopCompletionRate?: number | null
  trustedLoopStatus?: string | null
  trustedLoopStatusLabel?: string | null
  trustedLoopReadyStages?: number | null
  trustedLoopTotalStages?: number | null
  reportEvidenceReady?: boolean | null
  codeQaReadiness?: string | null
  recoverySignal?: string | null
  trustedLoopMetricsSource?: string | null
}

export interface LanguageStat {
  name: string
  file_count: number
  line_count: number
}

export interface RecentScan {
  id: number
  projectId: number
  projectName: string
  repositoryId: number
  repositoryName: string
  branch: string
  commitSha: string | null
  status: string
  triggerType: string
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  durationMs: number | null
  errorMessage: string | null
}

export const dashboardApi = {
  stats: () =>
    client.get<Result<DashboardStats>>('/dashboard/stats'),
  recentScans: (limit = 10) =>
    client.get<Result<RecentScan[]>>('/dashboard/recent-scans', { params: { limit } }),
}
