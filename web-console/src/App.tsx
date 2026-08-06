import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Spin } from 'antd'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout, { WorkPerspectiveEntry } from './components/AppLayout'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const ScanTaskDetail = lazy(() => import('./pages/ScanTaskDetail'))
const AgentTasksPage = lazy(() => import('./pages/AgentTasksPage'))
const ModelConfig = lazy(() => import('./pages/ModelConfig'))
const IssueDecompositionPage = lazy(() => import('./pages/IssueDecompositionPage'))
const CiDiagnosticsPage = lazy(() => import('./pages/CiDiagnosticsPage'))
const PrReviewsPage = lazy(() => import('./pages/PrReviewsPage'))
const AgentChat = lazy(() => import('./pages/AgentChat'))
const AutoRepairsPage = lazy(() => import('./pages/AutoRepairsPage'))
const ExecutionTasksPage = lazy(() => import('./pages/ExecutionTasksPage'))
const ArtifactsPage = lazy(() => import('./pages/ArtifactsPage'))
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'))

function PageFallback() {
  return (
    <div style={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
      <Spin />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<WorkPerspectiveEntry />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="scan-tasks/:id" element={<ScanTaskDetail />} />
              <Route path="agent-tasks" element={<AgentTasksPage />} />
              <Route path="execution-tasks" element={<ExecutionTasksPage />} />
              <Route path="artifacts" element={<ArtifactsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="model-config" element={<ModelConfig />} />
              <Route path="issue-decomposition" element={<IssueDecompositionPage />} />
              <Route path="ci-diagnostics" element={<CiDiagnosticsPage />} />
              <Route path="pr-reviews" element={<PrReviewsPage />} />
              <Route path="auto-repairs" element={<AutoRepairsPage />} />
              <Route path="agent-chat" element={<AgentChat />} />
              <Route path="agent-chat/:conversationId" element={<AgentChat />} />
            </Route>
          </Routes>
        </Suspense>
      </ChatProvider>
    </AuthProvider>
  )
}

export default App
