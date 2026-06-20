import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import ScanTaskDetail from './pages/ScanTaskDetail'
import AgentTasksPage from './pages/AgentTasksPage'
import ModelConfig from './pages/ModelConfig'
import IssueDecompositionPage from './pages/IssueDecompositionPage'
import CiDiagnosticsPage from './pages/CiDiagnosticsPage'
import PrReviewsPage from './pages/PrReviewsPage'
import AgentChat from './pages/AgentChat'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="scan-tasks/:id" element={<ScanTaskDetail />} />
          <Route path="agent-tasks" element={<AgentTasksPage />} />
          <Route path="model-config" element={<ModelConfig />} />
          <Route path="issue-decomposition" element={<IssueDecompositionPage />} />
          <Route path="ci-diagnostics" element={<CiDiagnosticsPage />} />
          <Route path="pr-reviews" element={<PrReviewsPage />} />
          <Route path="agent-chat" element={<AgentChat />} />
          <Route path="agent-chat/:conversationId" element={<AgentChat />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App