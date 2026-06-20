import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Dropdown, theme } from 'antd'
import {
  DashboardOutlined,
  ProjectOutlined,
  UserOutlined,
  LogoutOutlined,
  RobotOutlined,
  FileTextOutlined,
  BugOutlined,
  PullRequestOutlined,
  SettingOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Header, Sider, Content } = Layout

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/projects', icon: <ProjectOutlined />, label: '项目管理' },
    { key: '/agent-tasks', icon: <RobotOutlined />, label: 'Agent 任务' },
    { key: '/agent-chat', icon: <MessageOutlined />, label: 'AI 对话' },
    { key: '/model-config', icon: <SettingOutlined />, label: '模型配置' },
    { key: '/issue-decomposition', icon: <FileTextOutlined />, label: 'Issue 拆解' },
    { key: '/ci-diagnostics', icon: <BugOutlined />, label: 'CI 诊断' },
    { key: '/pr-reviews', icon: <PullRequestOutlined />, label: 'PR 审查' },
  ]

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login') } },
  ]

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/projects')) return '/projects'
    if (location.pathname.startsWith('/agent-tasks')) return '/agent-tasks'
    if (location.pathname.startsWith('/agent-chat')) return '/agent-chat'
    if (location.pathname.startsWith('/issue-decomposition')) return '/issue-decomposition'
    if (location.pathname.startsWith('/ci-diagnostics')) return '/ci-diagnostics'
    if (location.pathname.startsWith('/pr-reviews')) return '/pr-reviews'
    return location.pathname
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: 32, margin: 16, color: '#fff', fontSize: collapsed ? 14 : 18, fontWeight: 700, textAlign: 'center', lineHeight: '32px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {collapsed ? 'SL' : 'SourceLens'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text">
              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
              {user?.username}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}