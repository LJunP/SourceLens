import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Space, Tag, Typography, Drawer, Segmented } from 'antd'
import {
  CodeOutlined,
  ControlOutlined,
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
import ActionButton from './ui/ActionButton'
import IconActionButton from './ui/IconActionButton'

const { Header, Sider, Content } = Layout
const { Text } = Typography

type WorkPerspective = 'workbench' | 'governance' | 'admin_security'
type WorkPerspectiveLabel = '开发工作台' | '工程治理' | '平台管理与安全'
type ProductPlane = '前台体验' | '开发者控制台' | '后台治理'

type RouteMeta = {
  match: string
  title: string
  perspective: WorkPerspective
  plane: ProductPlane
  desc: string
}

const WORK_PERSPECTIVE_STORAGE_PREFIX = 'sourcelens.work-view.v1.user.'
const WORK_PERSPECTIVE_BOUNDARY = '仅调整导航与默认首页，不改变访问权限'

const workPerspectiveConfig: Record<WorkPerspective, { label: WorkPerspectiveLabel; plane: ProductPlane; home: string }> = {
  workbench: { label: '开发工作台', plane: '前台体验', home: '/dashboard' },
  governance: { label: '工程治理', plane: '开发者控制台', home: '/execution-tasks' },
  admin_security: { label: '平台管理与安全', plane: '后台治理', home: '/audit-logs' },
}

const workPerspectiveOptions = (Object.entries(workPerspectiveConfig) as Array<[
  WorkPerspective,
  (typeof workPerspectiveConfig)[WorkPerspective],
]>).map(([value, config]) => ({ value, label: config.label }))

const routeMeta = [
  { match: '/dashboard', title: '工程智能首页', perspective: 'workbench', plane: '前台体验', desc: '从仓库接入到可信结论的主链路状态与下一步行动' },
  { match: '/projects', title: '项目与仓库', perspective: 'workbench', plane: '前台体验', desc: '接入公开仓库，触发扫描并查看逆向分析结果' },
  { match: '/scan-tasks', title: '扫描报告', perspective: 'workbench', plane: '前台体验', desc: '复盘单次扫描的执行状态、分析产物、code_chunks 与治理证据链' },
  { match: '/agent-chat', title: '代码问答', perspective: 'workbench', plane: '前台体验', desc: '基于扫描上下文、code_chunks 和报告证据理解代码' },
  { match: '/issue-decomposition', title: 'Issue 拆解', perspective: 'workbench', plane: '前台体验', desc: '把需求和缺陷拆成可执行的工程任务' },
  { match: '/auto-repairs', title: '修复候选', perspective: 'workbench', plane: '前台体验', desc: '生成、审计并验证受控自动修复补丁' },
  { match: '/execution-tasks', title: '执行任务中心', perspective: 'governance', plane: '开发者控制台', desc: '统一观察扫描、Agent、修复和诊断任务的执行状态' },
  { match: '/artifacts', title: '运行产物库', perspective: 'governance', plane: '开发者控制台', desc: '集中检索报告、补丁、日志和结构化分析产物' },
  { match: '/agent-tasks', title: 'Agent 任务', perspective: 'governance', plane: '开发者控制台', desc: '管理面向代码库的架构审查和自动化分析任务' },
  { match: '/ci-diagnostics', title: 'CI 诊断', perspective: 'governance', plane: '开发者控制台', desc: '分析构建失败并沉淀可追踪的诊断结果' },
  { match: '/pr-reviews', title: 'PR 审查', perspective: 'governance', plane: '开发者控制台', desc: '对变更风险、架构影响和代码质量进行审查' },
  { match: '/audit-logs', title: '审计日志', perspective: 'admin_security', plane: '后台治理', desc: '查看关键操作、认证和自动化流程的审计记录' },
  { match: '/model-config', title: '模型配置', perspective: 'admin_security', plane: '后台治理', desc: '管理 LLM provider、endpoint 和密钥策略' },
] satisfies RouteMeta[]

const menuItemsByPerspective = {
  workbench: [
    {
      type: 'group' as const,
      label: workPerspectiveConfig.workbench.label,
      children: [
        { key: '/dashboard', icon: <DashboardOutlined />, label: '工程智能首页' },
        { key: '/projects', icon: <ProjectOutlined />, label: '项目与仓库' },
        { key: '/agent-chat', icon: <MessageOutlined />, label: '代码问答' },
        { key: '/issue-decomposition', icon: <FileTextOutlined />, label: 'Issue 拆解' },
        { key: '/auto-repairs', icon: <ToolOutlined />, label: '修复候选' },
      ],
    },
  ],
  governance: [
    {
      type: 'group' as const,
      label: workPerspectiveConfig.governance.label,
      children: [
        { key: '/execution-tasks', icon: <ScheduleOutlined />, label: '执行任务' },
        { key: '/artifacts', icon: <DatabaseOutlined />, label: '运行产物' },
        { key: '/agent-tasks', icon: <RobotOutlined />, label: 'Agent 任务' },
        { key: '/ci-diagnostics', icon: <BugOutlined />, label: 'CI 诊断' },
        { key: '/pr-reviews', icon: <PullRequestOutlined />, label: 'PR 审查' },
      ],
    },
  ],
  admin_security: [
    {
      type: 'group' as const,
      label: workPerspectiveConfig.admin_security.label,
      children: [
        { key: '/audit-logs', icon: <SafetyCertificateOutlined />, label: '审计日志' },
        { key: '/model-config', icon: <SettingOutlined />, label: '模型配置' },
      ],
    },
  ],
} satisfies Record<WorkPerspective, Parameters<typeof Menu>[0]['items']>

function isWorkPerspective(value: unknown): value is WorkPerspective {
  return value === 'workbench' || value === 'governance' || value === 'admin_security'
}

function getRouteMeta(pathname: string) {
  return routeMeta.find(item => pathname === item.match || pathname.startsWith(`${item.match}/`))
}

function getSavedWorkPerspective(userId: number): WorkPerspective {
  try {
    const value = window.localStorage.getItem(`${WORK_PERSPECTIVE_STORAGE_PREFIX}${userId}`)
    return isWorkPerspective(value) ? value : 'workbench'
  } catch {
    return 'workbench'
  }
}

function saveWorkPerspective(userId: number, perspective: WorkPerspective) {
  try {
    window.localStorage.setItem(`${WORK_PERSPECTIVE_STORAGE_PREFIX}${userId}`, perspective)
  } catch {
    // Navigation remains usable when browser storage is unavailable.
  }
}

export function WorkPerspectiveEntry() {
  const { user } = useAuth()
  const perspective = user ? getSavedWorkPerspective(user.id) : 'workbench'
  return <Navigate to={workPerspectiveConfig[perspective].home} replace />
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const desktopCollapsedRef = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const currentMeta = useMemo(() => {
    return getRouteMeta(location.pathname)
      || { title: 'SourceLens', perspective: 'workbench' as WorkPerspective, plane: '前台体验' as ProductPlane, desc: '代码逆向分析与 Agentic 工程治理平台' }
  }, [location.pathname])
  const visiblePerspective = currentMeta.perspective
  const menuItems = menuItemsByPerspective[visiblePerspective]

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined aria-hidden />, label: '退出登录', onClick: () => { logout(); navigate('/login') } },
  ]

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const sync = () => {
      const nextNarrow = media.matches
      setIsNarrow(nextNarrow)
      setMobileMenuOpen(false)
      setCollapsed(nextNarrow ? true : desktopCollapsedRef.current)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const handleCollapse = (nextCollapsed: boolean) => {
    desktopCollapsedRef.current = nextCollapsed
    setCollapsed(nextCollapsed)
  }

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/projects')) return '/projects'
    if (location.pathname.startsWith('/scan-tasks')) return '/projects'
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

  const handlePerspectiveChange = (value: string | number) => {
    if (!isWorkPerspective(value)) return
    if (user) saveWorkPerspective(user.id, value)
    setMobileMenuOpen(false)
    navigate(workPerspectiveConfig[value].home)
  }

  const perspectiveIcon = (perspective: WorkPerspective) => {
    if (perspective === 'workbench') return <CodeOutlined />
    if (perspective === 'governance') return <ControlOutlined />
    return <SafetyCertificateOutlined />
  }

  const perspectiveDropdownItems = workPerspectiveOptions.map(option => ({
    key: option.value,
    icon: perspectiveIcon(option.value),
    label: option.label,
  }))

  const expandedPerspectiveSwitcher = (surface: 'sider' | 'drawer') => (
    <div className={`sl-perspective-switcher sl-perspective-switcher-${surface}`}>
      <Segmented
        aria-label={surface === 'sider' ? '桌面工作视角切换' : '移动端工作视角切换'}
        block
        className="sl-perspective-segmented"
        options={workPerspectiveOptions}
        value={visiblePerspective}
        onChange={handlePerspectiveChange}
      />
      <div className="sl-perspective-boundary">{WORK_PERSPECTIVE_BOUNDARY}</div>
    </div>
  )

  const menu = (theme: 'dark' | 'light') => (
    <Menu
      theme={theme}
      mode="inline"
      selectedKeys={[getSelectedKey()]}
      items={menuItems}
      aria-label={`${workPerspectiveConfig[visiblePerspective].label}导航`}
      onClick={({ key }) => handleNavigate(String(key))}
    />
  )

  return (
    <Layout
      className="sl-app-shell"
      data-work-perspective={visiblePerspective}
      data-route-plane={currentMeta.plane}
    >
      {!isNarrow && (
        <Sider collapsible collapsed={collapsed} onCollapse={handleCollapse} theme="dark" width={248} className="sl-sider">
          <div className="sl-brand">
            <div className="sl-brand-mark">SL</div>
            {!collapsed && (
              <div className="sl-brand-text">
                <div className="sl-brand-title">SourceLens</div>
                <div className="sl-brand-subtitle">Code Intelligence</div>
              </div>
            )}
          </div>
          {collapsed ? (
            <div className="sl-perspective-switcher-collapsed">
              <Dropdown
                menu={{
                  items: perspectiveDropdownItems,
                  selectable: true,
                  selectedKeys: [visiblePerspective],
                  onClick: ({ key }) => handlePerspectiveChange(key),
                }}
                placement="bottomLeft"
                trigger={['click']}
              >
                <IconActionButton
                  aria-haspopup="menu"
                  aria-label={`切换工作视角，当前为${workPerspectiveConfig[visiblePerspective].label}`}
                  label={`切换工作视角，当前为${workPerspectiveConfig[visiblePerspective].label}`}
                  tooltip={`${workPerspectiveConfig[visiblePerspective].label}。${WORK_PERSPECTIVE_BOUNDARY}`}
                  type="text"
                  className="sl-perspective-dropdown-button"
                  icon={perspectiveIcon(visiblePerspective)}
                />
              </Dropdown>
            </div>
          ) : expandedPerspectiveSwitcher('sider')}
          {menu('dark')}
        </Sider>
      )}
      <Layout>
        <Header className="sl-topbar">
          <div className="sl-topbar-left">
            {isNarrow && (
              <IconActionButton
                aria-expanded={mobileMenuOpen}
                label="打开导航菜单"
                tooltip="打开导航菜单"
                type="text"
                className="sl-mobile-menu-button"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
              />
            )}
            <div className="sl-topbar-copy">
              <div className="sl-topbar-route-line">
                <div className="sl-topbar-title">{currentMeta.title}</div>
                <span className="sl-topbar-plane-compact" aria-label="当前产品平面">
                  {currentMeta.plane}
                </span>
              </div>
              <div className="sl-topbar-desc">{currentMeta.desc}</div>
            </div>
          </div>
          <Space size={12} className="sl-topbar-actions">
            <Tag color="geekblue" className="sl-topbar-plane">{currentMeta.plane}</Tag>
            <Tag color="blue" className="sl-topbar-env">Local Dev</Tag>
            <Text type="secondary" className="sl-topbar-ports">8080 / 5173</Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <ActionButton
                aria-haspopup="menu"
                aria-label={`用户菜单：${user?.username || '未登录用户'}`}
                type="text"
                className="sl-user-button"
                icon={<Avatar size="small" icon={<UserOutlined />} />}
                label={<span className="sl-topbar-username">{user?.username}</span>}
              />
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
        open={isNarrow && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        {expandedPerspectiveSwitcher('drawer')}
        {menu('light')}
      </Drawer>
    </Layout>
  )
}
