import { Card, Typography, Button, Form, Input, message, Alert } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const { Title, Paragraph, Text } = Typography

const Login = () => {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password)
      navigate('/dashboard')
    } catch (e: any) {
      message.error(e.message || '登录失败')
    }
  }

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

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="space-y-4"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              size="large"
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入用户名"
              className="!rounded-xl"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请输入密码"
              className="!rounded-xl"
            />
          </Form.Item>
          <Form.Item className="!mb-0">
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              block
              loading={loading}
              className="h-12 text-base rounded-xl"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-6">
          <Alert
            type="info"
            showIcon
            message="测试账号"
            description={
              <div className="space-y-1 text-sm">
                <div><Text strong>省级监管：</Text>admin_province / 123456</div>
                <div><Text strong>市级监管：</Text>admin_city / 123456</div>
                <div><Text strong>企业管理：</Text>admin_company / 123456</div>
              </div>
            }
            className="!rounded-xl"
          />
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          演示系统 · 已预置演示账号和模拟数据
        </div>
      </Card>
    </div>
  )
}

export default Login
