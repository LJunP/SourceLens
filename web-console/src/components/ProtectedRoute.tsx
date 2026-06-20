import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spin } from 'antd'
import { ReactNode } from 'react'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}