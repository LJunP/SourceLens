import { useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Dropdown, Space, Tag, Typography, Drawer } from 'antd'
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
  ToolOutlined,
  ScheduleOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const routeMeta = [
  { match: '/dashboard', title: '运营仪表盘', desc: '跟踪仓库扫描、架构产物、Agent 任务和治理状态' },
  { match: '/projects', title: '项目与仓库', desc: '接入公开仓库，触发扫描并查看逆向分析结果' },
  { match: '/execution-tasks', title: '执行任务中心', desc: '统一观察扫描、Agent、修复和诊断任务的执行状态' },
  { match: '/artifacts', title: '运行产物库', desc: '集中检索报告、补丁、日志和结构化分析产物' },
  { match: '/audit-logs', title: '审计日志', desc: '查看关键操作、认证和自动化流程的审计记录' },
  { match: '/agent-tasks', title: 'Agent 任务', desc: '管理面向代码库的架构审查和自动化分析任务' },
  { match: '/agent-chat', title: 'AI 代码对话', desc: '基于扫描上下文与代码切片进行辅助理解' },
  { match: '/model-config', title: '模型配置', desc: '管理 LLM provider、endpoint 和密钥策略' },
  { match: '/issue-decomposition', title: 'Issue 拆解', desc: '把需求和缺陷拆成可执行的工程任务' },
  { match: '/ci-diagnostics', title: 'CI 诊断', desc: '分析构建失败并沉淀可追踪的诊断结果' },
  { match: '/pr-reviews', title: 'PR 审查', desc: '对变更风险、架构影响和代码质量进行审查' },
  { match: '/auto-repairs', title: '自动修码', desc: '生成、审计并验证自动修复补丁' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const currentMeta = useMemo(() => {
    return routeMeta.find(item => location.pathname.startsWith(item.match))
      || { title: 'SourceLens', desc: '代码逆向分析与 Agentic 工程治理平台' }
  }, [location.pathname])

  const menuItems = [
    {
      type: 'group' as const,
      label: '主链路',
      children: [
        { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
        { key: '/projects', icon: <ProjectOutlined />, label: '项目管理' },
        { key: '/execution-tasks', icon: <ScheduleOutlined />, label: '执行任务' },
        { key: '/artifacts', icon: <DatabaseOutlined />, label: '运行产物' },
      ],
    },
    {
      type: 'group' as const,
      label: 'Agent 与治理',
      children: [
        { key: '/agent-tasks', icon: <RobotOutlined />, label: 'Agent 任务' },
        { key: '/agent-chat', icon: <MessageOutlined />, label: 'AI 对话' },
        { key: '/auto-repairs', icon: <ToolOutlined />, label: '自动修码' },
        { key: '/issue-decomposition', icon: <FileTextOutlined />, label: 'Issue 拆解' },
        { key: '/ci-diagnostics', icon: <BugOutlined />, label: 'CI 诊断' },
        { key: '/pr-reviews', icon: <PullRequestOutlined />, label: 'PR 审查' },
      ],
    },
    {
      type: 'group' as const,
      label: '平台',
      children: [
        { key: '/audit-logs', icon: <SafetyCertificateOutlined />, label: '审计日志' },
        { key: '/model-config', icon: <SettingOutlined />, label: '模型配置' },
      ],
    },
  ]

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined aria-hidden />, label: '退出登录', onClick: () => { logout(); navigate('/login') } },
  ]

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const sync = () => {
      setIsNarrow(media.matches)
      if (media.matches) {
        setCollapsed(true)
      }
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/projects')) return '/projects'
    if (location.pathname.startsWith('/execution-tasks')) return '/execution-tasks'
    if (location.pathname.startsWith('/artifacts')) return '/artifacts'
    if (location.pathname.startsWith('/audit-logs')) return '/audit-logs'
    if (location.pathname.startsWith('/agent-tasks')) return '/agent-tasks'
    if (location.pathname.startsWith('/agent-chat')) return '/agent-chat'
    if (location.pathname.startsWith('/issue-decomposition')) return '/issue-decomposition'
    if (location.pathname.startsWith('/ci-diagnostics')) return '/ci-diagnostics'
    if (location.pathname.startsWith('/pr-reviews')) return '/pr-reviews'
    if (location.pathname.startsWith('/auto-repairs')) return '/auto-repairs'
    return location.pathname
  }

  const handleNavigate = (key: string) => {
    navigate(key)
    setMobileMenuOpen(false)
  }

  const menu = (theme: 'dark' | 'light') => (
    <Menu
      theme={theme}
      mode="inline"
      selectedKeys={[getSelectedKey()]}
      items={menuItems}
      onClick={({ key }) => handleNavigate(String(key))}
    />
  )

  return (
    <Layout className="sl-app-shell">
      {!isNarrow && (
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" width={248} className="sl-sider">
          <div className="sl-brand">
            <div className="sl-brand-mark">SL</div>
            {!collapsed && (
              <div className="sl-brand-text">
                <div className="sl-brand-title">SourceLens</div>
                <div className="sl-brand-subtitle">Code Intelligence</div>
              </div>
            )}
          </div>
          {menu('dark')}
        </Sider>
      )}
      <Layout>
        <Header className="sl-topbar">
          <div className="sl-topbar-left">
            {isNarrow && (
              <Button
                aria-expanded={mobileMenuOpen}
                aria-label="打开导航菜单"
                type="text"
                className="sl-mobile-menu-button"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
              />
            )}
            <div className="sl-topbar-copy">
              <div className="sl-topbar-title">{currentMeta.title}</div>
              <div className="sl-topbar-desc">{currentMeta.desc}</div>
            </div>
          </div>
          <Space size={12} className="sl-topbar-actions">
            <Tag color="blue" className="sl-topbar-env">Local Dev</Tag>
            <Text type="secondary" className="sl-topbar-ports">8080 / 5173</Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Button
                aria-haspopup="menu"
                aria-label={`用户菜单：${user?.username || '未登录用户'}`}
                type="text"
                className="sl-user-button"
              >
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="sl-topbar-username">{user?.username}</span>
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content className="sl-page">
          <div className="sl-page-inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
      <Drawer
        className="sl-mobile-nav"
        title={(
          <div className="sl-mobile-brand">
            <div className="sl-brand-mark">SL</div>
            <div>
              <div className="sl-brand-title">SourceLens</div>
              <div className="sl-brand-subtitle">Code Intelligence</div>
            </div>
          </div>
        )}
        placement="left"
        width={288}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        {menu('light')}
      </Drawer>
    </Layout>
  )
}
