import { useState, useEffect, useCallback } from 'react'
import {
  Row,
  Col,
  Card,
  List,
  Tag,
  Avatar,
  Button,
  Space,
  Typography,
  Statistic,
  Tabs,
  Modal,
  Steps,
  Form,
  Input,
  Radio,
  Descriptions,
  Badge,
  message,
  Timeline,
  Tooltip,
  Alert,
} from 'antd'
import {
  WarningOutlined,
  SafetyOutlined,
  FireOutlined,
  CheckOutlined,
  CloseOutlined,
  ThunderboltOutlined,
  CarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { Warning, WarningType, WarningLevel } from '@/types'
import { warningsApi } from '@/api/client'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps
const { TextArea } = Input

const WarningTypeTag = ({ type }: { type: WarningType }) => {
  const map: Record<WarningType, { color: string; text: string; icon: string }> = {
    temperature: { color: 'red', text: '罐体温度超标', icon: '🌡️' },
    fatigue: { color: 'orange', text: '疲劳驾驶', icon: '😴' },
    overspeed: { color: 'volcano', text: '超速行驶', icon: '⚡' },
    pressure: { color: 'purple', text: '罐体压力异常', icon: '💨' },
    tank_leak: { color: 'magenta', text: '罐体泄漏', icon: '⚠️' },
  }
  const m = map[type]
  return (
    <Tag color={m.color}>
      <span className="mr-1">{m.icon}</span>
      {m.text}
    </Tag>
  )
}

const LevelTag = ({ level }: { level: WarningLevel }) => {
  if (level === 'resolved') return <Tag color="green">已解除</Tag>
  return (
    <Tag color={level === 'level2' ? 'red' : 'orange'} icon={<WarningOutlined />}>
      {level === 'level2' ? '二级预警（15分钟未响应）' : '一级预警'}
    </Tag>
  )
}

const Warnings = () => {
  const navigate = useNavigate()
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [selected, setSelected] = useState<Warning | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [approvalForm] = Form.useForm()
  const [currentApprovalLevel, setCurrentApprovalLevel] = useState<number>(1)

  const fetchWarnings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await warningsApi.list()
      setWarnings(res.items)
    } catch (err: any) {
      message.error(err.message || '获取预警列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWarnings()
    const timer = setInterval(fetchWarnings, 5000)
    return () => clearInterval(timer)
  }, [fetchWarnings])

  const level1Warnings = warnings.filter(w => w.level === 'level1')
  const level2Warnings = warnings.filter(w => w.level === 'level2')
  const resolvedWarnings = warnings.filter(w => w.level === 'resolved')

  const openDetail = (w: Warning) => {
    setSelected(w)
    setDetailOpen(true)
  }

  const respondToWarning = async (id: string) => {
    try {
      const res = await warningsApi.respond(id)
      if (res.success) {
        setWarnings(prev => prev.map(w => (w.id === id ? res.warning : w)))
        message.success('预警已响应并解除')
        setDetailOpen(false)
      }
    } catch (err: any) {
      message.error(err.message || '响应预警失败')
    }
  }

  const escalateWarning = async (id: string) => {
    try {
      const res = await warningsApi.escalate(id)
      if (res.success) {
        setWarnings(prev => prev.map(w => (w.id === id ? res.warning : w)))
        message.warning('预警已升级为二级，启动三级审批流程')
      }
    } catch (err: any) {
      message.error(err.message || '升级预警失败')
    }
  }

  const openApproval = (w: Warning, level: number) => {
    setSelected(w)
    setCurrentApprovalLevel(level)
    approvalForm.resetFields()
    setApprovalOpen(true)
  }

  const submitApproval = async () => {
    if (!selected) return
    try {
      const values = await approvalForm.validateFields()
      const res = await warningsApi.approve(selected.id, currentApprovalLevel, values.status, values.comment)
      if (res.success) {
        setWarnings(prev => prev.map(w => (w.id === selected.id ? res.warning : w)))
        message.success(values.status === 'approved' ? '审批通过' : '已驳回')
        setApprovalOpen(false)
      }
    } catch (err: any) {
      message.error(err.message || '提交审批失败')
    }
  }

  const intervene = async (id: string) => {
    try {
      const res = await warningsApi.intervene(id)
      if (res.success) {
        message.success(res.message || '远程干预指令已下发')
        fetchWarnings()
      }
    } catch (err: any) {
      message.error(err.message || '远程干预失败')
    }
  }

  const WarningCard = ({ w }: { w: Warning }) => {
    const pendingLevel = w.approvals.findIndex(a => a.status === 'pending') + 1
    return (
      <Card
        className={`!rounded-xl mb-3 cursor-pointer hover:shadow-md transition-shadow ${
          w.level === 'level2' ? 'border-l-4 !border-l-red-500' : 'border-l-4 !border-l-orange-400'
        }`}
        onClick={() => openDetail(w)}
      >
        <Row gutter={[12, 8]} align="middle">
          <Col flex="none">
            <Avatar
              size={48}
              style={{
                backgroundColor: w.level === 'level2' ? '#ff4d4f' : '#faad14',
              }}
              icon={<WarningOutlined />}
            />
          </Col>
          <Col flex="auto">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <WarningTypeTag type={w.type} />
              <LevelTag level={w.level} />
            </div>
            <div className="font-semibold text-gray-800">
              {w.plateNumber} · {w.driver}
            </div>
            <div className="text-sm text-gray-500 mb-1">{w.message}</div>
            <div className="text-xs text-gray-400 flex items-center gap-3 flex-wrap">
              <span><ClockCircleOutlined /> {dayjs(w.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
              <span><UserOutlined /> {w.company}</span>
            </div>
            {w.level === 'level2' && w.approvals && (
              <div className="mt-2">
                <Steps size="small" current={pendingLevel - 1} className="!py-2">
                  {w.approvals.map(a => (
                    <Step
                      key={a.level}
                      title={a.role}
                      status={a.status === 'approved' ? 'finish' : a.status === 'rejected' ? 'error' : a.level === pendingLevel ? 'process' : 'wait'}
                    />
                  ))}
                </Steps>
                {w.interventionEnabled && (
                  <Tag color="green" icon={<CheckOutlined />}>三级审批通过，可执行远程干预</Tag>
                )}
              </div>
            )}
          </Col>
          <Col flex="none">
            <Space direction="vertical" size={8} align="end">
              {w.level === 'level1' && (
                <>
                  <Button type="primary" size="small" onClick={e => { e.stopPropagation(); respondToWarning(w.id) }}>
                    <CheckOutlined /> 立即响应
                  </Button>
                  <Button size="small" danger onClick={e => { e.stopPropagation(); escalateWarning(w.id) }}>
                    升级预警
                  </Button>
                </>
              )}
              {w.level === 'level2' && !w.interventionEnabled && (
                <>
                  {w.approvals[0].status === 'pending' && (
                    <Button type="primary" size="small" onClick={e => { e.stopPropagation(); openApproval(w, 1) }}>
                      安全主管审批
                    </Button>
                  )}
                  {w.approvals[0].status === 'approved' && w.approvals[1].status === 'pending' && (
                    <Button type="primary" size="small" onClick={e => { e.stopPropagation(); openApproval(w, 2) }}>
                      运输经理复核
                    </Button>
                  )}
                  {w.approvals[1].status === 'approved' && w.approvals[2].status === 'pending' && (
                    <Button type="primary" size="small" danger onClick={e => { e.stopPropagation(); openApproval(w, 3) }}>
                      企业法人批准
                    </Button>
                  )}
                </>
              )}
              {w.interventionEnabled && (
                <Button type="primary" size="small" danger icon={<RocketOutlined />} onClick={e => { e.stopPropagation(); intervene(w.id) }}>
                  执行远程干预
                </Button>
              )}
              <Button size="small" onClick={e => { e.stopPropagation(); navigate(`/vehicles/${w.vehicleId}`) }}>
                查看车辆
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="!rounded-xl !border-orange-200 bg-orange-50">
            <Statistic
              title={<span className="text-orange-700"><WarningOutlined className="mr-1" />一级预警</span>}
              value={level1Warnings.length}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
            <Text type="secondary" className="text-xs">需立即响应 · 15分钟未响应自动升级</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-xl !border-red-200 bg-red-50">
            <Statistic
              title={<span className="text-red-700"><FireOutlined className="mr-1" />二级预警</span>}
              value={level2Warnings.length}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ThunderboltOutlined />}
            />
            <Text type="secondary" className="text-xs">需三级审批方可远程干预</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-xl !border-green-200 bg-green-50">
            <Statistic
              title={<span className="text-green-700"><CheckOutlined className="mr-1" />今日已解除</span>}
              value={resolvedWarnings.length + 18}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-xl !border-blue-200 bg-blue-50">
            <Statistic
              title={<span className="text-blue-700"><SafetyOutlined className="mr-1" />平均响应时间</span>}
              value={4.2}
              suffix="分钟"
              precision={1}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="!rounded-xl border-0" styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-4 pt-2"
          items={[
            {
              key: 'active',
              label: (
                <span>
                  <WarningOutlined />
                  处理中预警
                  <Badge count={level1Warnings.length + level2Warnings.length} size="small" className="ml-2" />
                </span>
              ),
              children: (
                <div className="p-4">
                  {[...level2Warnings, ...level1Warnings].length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <SafetyOutlined className="text-5xl mb-4" />
                      <div>暂无处理中预警，安全状态良好</div>
                    </div>
                  ) : (
                    [...level2Warnings, ...level1Warnings].map(w => <WarningCard key={w.id} w={w} />)
                  )}
                </div>
              ),
            },
            {
              key: 'level1',
              label: <span><WarningOutlined /> 一级预警 ({level1Warnings.length})</span>,
              children: <div className="p-4">{level1Warnings.map(w => <WarningCard key={w.id} w={w} />)}</div>,
            },
            {
              key: 'level2',
              label: <span><FireOutlined /> 二级预警-审批中 ({level2Warnings.length})</span>,
              children: <div className="p-4">{level2Warnings.map(w => <WarningCard key={w.id} w={w} />)}</div>,
            },
            {
              key: 'history',
              label: <span><CheckOutlined /> 历史记录</span>,
              children: (
                <div className="p-4">
                  <AlertHistoryMock />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={
          <Space>
            <WarningOutlined className="text-orange-500 text-xl" />
            预警详情
          </Space>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width={720}
        footer={null}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <WarningTypeTag type={selected.type} />
              <LevelTag level={selected.level} />
              <Tag>{selected.company}</Tag>
            </div>
            <Alert type="warning" showIcon message={selected.message} description={
              selected.value !== undefined ? (
                <>
                  当前值：<b className="text-red-500">{selected.value}</b>，阈值：{selected.threshold}
                </>
              ) : null
            } />
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="车辆牌照">{selected.plateNumber}</Descriptions.Item>
              <Descriptions.Item label="司机">
                <Space>
                  {selected.driver}
                  <Button type="link" icon={<PhoneOutlined />} size="small">联系司机</Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="预警类型" span={2}>
                <WarningTypeTag type={selected.type} />
              </Descriptions.Item>
              <Descriptions.Item label="预警时间">{selected.createdAt}</Descriptions.Item>
              <Descriptions.Item label="升级次数">{selected.escalationCount} 次</Descriptions.Item>
            </Descriptions>

            {selected.level === 'level2' && (
              <div>
                <Title level={5} className="!mb-2">三级审批流程</Title>
                <Steps direction="vertical" size="small" current={selected.approvals.findIndex(a => a.status === 'pending')}>
                  {selected.approvals.map(a => (
                    <Step
                      key={a.level}
                      title={
                        <Space>
                          <span className="font-medium">{a.role}</span>
                          {a.status === 'approved' && <Tag color="green" icon={<CheckOutlined />}>已通过</Tag>}
                          {a.status === 'rejected' && <Tag color="red" icon={<CloseOutlined />}>已驳回</Tag>}
                          {a.status === 'pending' && <Tag color="orange">待审批</Tag>}
                        </Space>
                      }
                      description={
                        a.time ? (
                          <div>
                            <div>审批人：{a.approver} · {a.time}</div>
                            {a.comment && <div className="text-gray-600 mt-1">意见：{a.comment}</div>}
                          </div>
                        ) : (
                          <span className="text-gray-400">等待审批...</span>
                        )
                      }
                      status={a.status === 'approved' ? 'finish' : a.status === 'rejected' ? 'error' : 'process'}
                    />
                  ))}
                </Steps>
                {selected.interventionEnabled && (
                  <Card className="mt-3 !bg-green-50 !border-green-200">
                    <Space>
                      <CheckOutlined className="text-green-600 text-lg" />
                      <div>
                        <div className="font-semibold text-green-700">三级审批全部通过</div>
                        <div className="text-sm text-green-600">已授权执行远程干预操作（如：远程限速、强制停车等）</div>
                      </div>
                    </Space>
                  </Card>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              {selected.level === 'level1' && (
                <>
                  <Button onClick={() => escalateWarning(selected.id)}>升级至二级预警</Button>
                  <Button type="primary" icon={<CheckOutlined />} onClick={() => respondToWarning(selected.id)}>
                    响应并解除预警
                  </Button>
                </>
              )}
              <Button onClick={() => navigate(`/vehicles/${selected.vehicleId}`)} icon={<CarOutlined />}>
                查看车辆详情
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <SafetyOutlined className="text-blue-500" />
            {currentApprovalLevel === 1 && '安全主管确认'}
            {currentApprovalLevel === 2 && '运输经理复核'}
            {currentApprovalLevel === 3 && '企业法人批准（远程干预授权）'}
          </Space>
        }
        open={approvalOpen}
        onCancel={() => setApprovalOpen(false)}
        onOk={submitApproval}
        okText="提交审批"
        width={560}
      >
        {selected && (
          <div className="space-y-4">
            <Card size="small" className="!bg-gray-50">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="预警车辆">{selected.plateNumber} · {selected.driver}</Descriptions.Item>
                <Descriptions.Item label="预警内容">{selected.message}</Descriptions.Item>
                <Descriptions.Item label="预警时间">{selected.createdAt}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Form form={approvalForm} layout="vertical">
              <Form.Item
                label="审批意见"
                name="status"
                rules={[{ required: true, message: '请选择审批意见' }]}
              >
                <Radio.Group>
                  <Radio value="approved">
                    <Space className={currentApprovalLevel === 3 ? 'text-red-600' : 'text-green-600'}>
                      <CheckOutlined />
                      {currentApprovalLevel === 3 ? '批准远程干预（承担法律责任）' : '同意，通过审批'}
                    </Space>
                  </Radio>
                  <Radio value="rejected">
                    <Space className="text-red-600">
                      <CloseOutlined />
                      驳回
                    </Space>
                  </Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="审批说明" name="comment" rules={[{ required: true, message: '请填写审批说明' }]}>
                <TextArea rows={3} placeholder="请详细说明审批理由..." />
              </Form.Item>
            </Form>
            {currentApprovalLevel === 3 && (
              <Alert
                type="error"
                showIcon
                message="远程干预法律责任告知"
                description="批准远程干预即视为企业法人已确认安全风险，愿意承担由此产生的一切法律后果。远程干预包括但不限于：远程限速、发动机断油、强制停车等操作。"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

const AlertHistoryMock = () => {
  const history = [
    { time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), plate: '沪C99887', type: 'overspeed' as WarningType, msg: '超速行驶：112km/h，已解除', resolver: '安全主管-李刚' },
    { time: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'), plate: '京B66778', type: 'fatigue' as WarningType, msg: '连续驾驶4.5小时，司机已休息', resolver: '安全员-王芳' },
    { time: dayjs().subtract(8, 'hour').format('YYYY-MM-DD HH:mm:ss'), plate: '粤D11223', type: 'temperature' as WarningType, msg: '温度42.3°C，经喷淋降温后恢复正常', resolver: '司机自行处置' },
    { time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), plate: '浙A44556', type: 'pressure' as WarningType, msg: '罐体压力异常波动，已进检修站', resolver: '运输经理-陈总' },
  ]
  return (
    <Timeline
      items={history.map(h => ({
        color: 'green',
        dot: <CheckOutlined />,
        children: (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <WarningTypeTag type={h.type} />
              <Tag color="green">已解除</Tag>
              <Text strong>{h.plate}</Text>
              <Text type="secondary" className="text-xs">{h.time}</Text>
            </div>
            <div className="text-sm">{h.msg}</div>
            <div className="text-xs text-gray-400 mt-1">处置人：{h.resolver}</div>
          </div>
        ),
      }))}
    />
  )
}

export default Warnings
