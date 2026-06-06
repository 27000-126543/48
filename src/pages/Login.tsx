import { Card, Radio, Typography, Button, Space, message } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SafetyOutlined } from '@ant-design/icons'
import type { UserRole } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

const { Title, Paragraph } = Typography

const Login = () => {
  const [role, setRole] = useState<UserRole>('provincial')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = () => {
    login(role)
    message.success('登录成功')
    navigate('/dashboard')
  }

  const roleOptions = [
    { label: '省级监管用户', value: 'provincial' as UserRole, desc: '查看全国数据，统筹监管' },
    { label: '市级监管用户', value: 'municipal' as UserRole, desc: '查看本市及所辖企业数据' },
    { label: '企业管理员', value: 'enterprise' as UserRole, desc: '管理本企业车辆和预警处置' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>
      <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-white/95 rounded-2xl border-0">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <SafetyOutlined className="text-white text-4xl" />
          </div>
          <Title level={3} className="!mb-2">
            危化品运输安全监测平台
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            全国危化品运输安全监测与应急指挥分析平台
          </Paragraph>
        </div>

        <div className="space-y-4 mb-6">
          <div className="text-sm font-medium text-gray-700 mb-2">选择登录身份</div>
          <Radio.Group
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full"
          >
            <div className="space-y-2">
              {roleOptions.map(opt => (
                <label
                  key={opt.value}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    role === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <Radio value={opt.value} className="!mt-0">
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-sm text-gray-500 ml-6">{opt.desc}</div>
                  </Radio>
                </label>
              ))}
            </div>
          </Radio.Group>
        </div>

        <Button
          type="primary"
          size="large"
          block
          onClick={handleLogin}
          className="h-12 text-base rounded-xl"
        >
          进入系统
        </Button>

        <div className="mt-6 text-center text-xs text-gray-400">
          演示系统 · 已预置演示账号和模拟数据
        </div>
      </Card>
    </div>
  )
}

export default Login
