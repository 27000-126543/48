import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Space, Typography, Button } from 'antd'
import {
  DashboardOutlined,
  CarOutlined,
  WarningOutlined,
  CloudOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { mockWarnings } from '@/data/mock'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const pendingWarnings = mockWarnings.filter(w => w.level !== 'resolved').length

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '指挥看板' },
    { key: '/vehicles', icon: <CarOutlined />, label: '车辆监控' },
    {
      key: '/warnings',
      icon: (
        <Badge count={pendingWarnings} size="small">
          <WarningOutlined />
        </Badge>
      ),
      label: '预警中心',
    },
    { key: '/risk', icon: <CloudOutlined />, label: '风险预测' },
    { key: '/report', icon: <FileTextOutlined />, label: '安全报告' },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  const roleLabels: Record<string, string> = {
    provincial: '省级监管',
    municipal: '市级监管',
    enterprise: '企业管理',
  }

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        style={{ background: '#001529' }}
      >
        <div className="flex items-center gap-2 px-5 h-16 border-b border-blue-900/50">
          <SafetyOutlined className="text-blue-400 text-2xl" />
          {!collapsed && (
            <Title level={5} className="!text-white !m-0 whitespace-nowrap">
              危化品监测平台
            </Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="border-r-0 mt-2"
        />
      </Sider>
      <Layout>
        <Header className="bg-white border-b px-6 flex items-center justify-between h-16 shadow-sm">
          <Space>
            <Title level={4} className="!m-0">
              全国危化品运输安全监测与应急指挥分析平台
            </Title>
          </Space>
          <Space size="large">
            <Space>
              <Avatar icon={<UserOutlined />} />
              <div className="leading-tight">
                <div className="font-medium text-gray-800">{user?.name}</div>
                <div className="text-xs text-gray-500">
                  {roleLabels[user?.role || '']}
                  {user?.region ? ` · ${user.region}` : ''}
                  {user?.company ? ` · ${user.company}` : ''}
                </div>
              </div>
            </Space>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" icon={<UserOutlined />} />
            </Dropdown>
          </Space>
        </Header>
        <Content className="p-6 bg-gray-50">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
