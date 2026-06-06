import { useState, useMemo, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Descriptions,
  Tag,
  Button,
  Tabs,
  Table,
  Progress,
  Avatar,
  Badge,
  Space,
  Typography,
  Statistic,
  Divider,
  Spin,
} from 'antd'
import {
  ArrowLeftOutlined,
  CarOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  WarningOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { vehiclesApi } from '@/api/client'
import type { ColumnsType } from 'antd/es/table'
import type { TrackPoint, TankParamPoint, ViolationRecord, Vehicle } from '@/types'

const { Title, Text } = Typography

const VehicleDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([])
  const [tankParams, setTankParams] = useState<TankParamPoint[]>([])
  const [vehicleViolations, setVehicleViolations] = useState<ViolationRecord[]>([])

  const fetchDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await vehiclesApi.detail(id)
      setVehicle(response.vehicle)
      setTrackPoints(response.trackPoints)
      setTankParams(response.tankParams)
      setVehicleViolations(response.violations)
    } catch (error) {
      console.error('Failed to fetch vehicle detail:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
    const interval = setInterval(fetchDetail, 5000)
    return () => clearInterval(interval)
  }, [id])

  const [activeTab, setActiveTab] = useState('track')

  const trackOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: {
      text: '近7天行驶轨迹',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => {
        if (p.data?.time) {
          return `<b>${p.data.time}</b><br/>位置：${p.data.location}<br/>速度：${p.data.speed} km/h<br/>坐标：${p.data.lng}, ${p.data.lat}`
        }
        return ''
      },
    },
    grid: { left: 40, right: 30, top: 60, bottom: 40 },
    xAxis: {
      type: 'category',
      data: trackPoints.map(p => p.time.split(' ')[0].slice(5)),
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: { type: 'value', name: '速度(km/h)' },
    series: [
      {
        name: '行驶速度',
        type: 'line',
        smooth: true,
        data: trackPoints.map(p => ({
          value: p.speed,
          time: p.time,
          location: p.location,
          lat: p.lat,
          lng: p.lng,
        })),
        areaStyle: { color: 'rgba(22,119,255,0.15)' },
        itemStyle: { color: '#1677ff' },
        markLine: {
          silent: true,
          data: [{ yAxis: 80, label: { formatter: '限速80' }, lineStyle: { color: '#ff4d4f', type: 'dashed' } }],
        },
      },
    ],
  }), [trackPoints])

  const tankOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: {
      text: '近7天罐体参数变化曲线',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: { trigger: 'axis' },
    legend: { data: ['温度(°C)', '压力(MPa)', '液位(%)'], bottom: 0 },
    grid: { left: 50, right: 60, top: 50, bottom: 50 },
    xAxis: {
      type: 'category',
      data: tankParams.map(p => p.time.slice(0, 13)),
      axisLabel: { rotate: 45, fontSize: 9 },
    },
    yAxis: [
      { type: 'value', name: '温度/液位', position: 'left' },
      { type: 'value', name: '压力(MPa)', position: 'right' },
    ],
    series: [
      {
        name: '温度(°C)',
        type: 'line',
        smooth: true,
        data: tankParams.map(p => p.temperature),
        itemStyle: { color: '#ff4d4f' },
        markLine: {
          silent: true,
          data: [{ yAxis: 40, label: { formatter: '温度阈值' }, lineStyle: { color: '#ff4d4f', type: 'dashed' } }],
        },
      },
      {
        name: '压力(MPa)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: tankParams.map(p => p.pressure),
        itemStyle: { color: '#722ed1' },
      },
      {
        name: '液位(%)',
        type: 'line',
        smooth: true,
        data: tankParams.map(p => p.level),
        itemStyle: { color: '#13c2c2' },
        areaStyle: { color: 'rgba(19,194,194,0.1)' },
      },
    ],
  }), [tankParams])

  const violationColumns: ColumnsType<ViolationRecord> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 170,
      render: t => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '违规类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: t => {
        const map: Record<string, { color: string; text: string }> = {
          temperature: { color: 'red', text: '温度超标' },
          fatigue: { color: 'orange', text: '疲劳驾驶' },
          overspeed: { color: 'volcano', text: '超速行驶' },
          pressure: { color: 'purple', text: '压力异常' },
          tank_leak: { color: 'magenta', text: '罐体泄漏' },
        }
        const m = map[t] || map.overspeed
        return <Tag color={m.color}>{m.text}</Tag>
      },
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    {
      title: '处理状态',
      dataIndex: 'handled',
      key: 'handled',
      width: 100,
      render: h => (
        <Badge status={h ? 'success' : 'warning'} text={h ? '已处理' : '待处理'} />
      ),
    },
  ]

  const StatusBadge = ({ status }: { status: Vehicle['status'] }) => {
    const map: Record<Vehicle['status'], { color: string; text: string }> = {
      running: { color: 'success', text: '行驶中' },
      stopped: { color: 'default', text: '已停车' },
      warning: { color: 'warning', text: '预警' },
      danger: { color: 'error', text: '危险' },
      offline: { color: 'default', text: '离线' },
    }
    const s = map[status]
    return <Badge status={s.color as any} text={s.text} />
  }

  if (!vehicle) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/vehicles')}>
          返回列表
        </Button>
        <Title level={4} className="!m-0">
          车辆详情：{vehicle.plateNumber}
        </Title>
        <StatusBadge status={vehicle.status} />
        <Button icon={<ReloadOutlined />} className="ml-auto" onClick={fetchDetail} loading={loading}>刷新数据</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title={<span><CarOutlined className="mr-2" />基本信息</span>} className="!rounded-xl border-0">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="车辆编号">{vehicle.id}</Descriptions.Item>
              <Descriptions.Item label="车牌号">{vehicle.plateNumber}</Descriptions.Item>
              <Descriptions.Item label="所属企业">{vehicle.company}</Descriptions.Item>
              <Descriptions.Item label="所在地区">{vehicle.province} {vehicle.city}</Descriptions.Item>
              <Descriptions.Item label="司机">
                <Space>
                  <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                    {vehicle.driver[0]}
                  </Avatar>
                  {vehicle.driver}
                  <Button type="link" icon={<PhoneOutlined />} size="small">
                    {vehicle.driverPhone}
                  </Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="运输货物">
                <Tag color="purple">{vehicle.cargo}</Tag>
                <Tag color="magenta">{vehicle.cargoType}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <Divider className="!my-3" />
            <Descriptions column={1} size="small" title="运输任务">
              <Descriptions.Item label="运输路线">
                <span className="font-medium">{vehicle.route}</span>
              </Descriptions.Item>
              <Descriptions.Item label="出发时间">{vehicle.departureTime}</Descriptions.Item>
              <Descriptions.Item label="预计到达">{vehicle.estimatedArrival}</Descriptions.Item>
              <Descriptions.Item label="当前位置">
                <Space>
                  <EnvironmentOutlined className="text-blue-500" />
                  {vehicle.currentLocation}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="坐标">
                <Text type="secondary">
                  {vehicle.currentLat.toFixed(4)}, {vehicle.currentLng.toFixed(4)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title={<span><SafetyOutlined className="mr-2" />实时安全指标</span>} className="!rounded-xl border-0">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <Card size="small" className={vehicle.currentSpeed > vehicle.speedLimit ? 'bg-red-50' : ''}>
                  <Statistic
                    title="当前速度"
                    value={vehicle.currentSpeed}
                    suffix={`/ ${vehicle.speedLimit} km/h`}
                    valueStyle={{ color: vehicle.currentSpeed > vehicle.speedLimit ? '#ff4d4f' : '#1677ff', fontSize: 20 }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small" className={vehicle.continuousDrivingHours > 4 ? 'bg-orange-50' : ''}>
                  <Statistic
                    title="连续驾驶"
                    value={vehicle.continuousDrivingHours}
                    suffix="小时"
                    valueStyle={{ color: vehicle.continuousDrivingHours > 4 ? '#fa8c16' : '#1677ff', fontSize: 20 }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small" className={vehicle.tankTemperature > vehicle.tankTempThreshold ? 'bg-red-50' : ''}>
                  <Statistic
                    title="罐体温度"
                    value={vehicle.tankTemperature}
                    suffix={`°C (阈值${vehicle.tankTempThreshold})`}
                    valueStyle={{ color: vehicle.tankTemperature > vehicle.tankTempThreshold ? '#ff4d4f' : '#1677ff', fontSize: 20 }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic
                    title="罐体压力"
                    value={vehicle.tankPressure}
                    suffix="MPa"
                    valueStyle={{ color: '#722ed1', fontSize: 20 }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic
                    title="液位"
                    value={vehicle.tankLevel}
                    suffix="%"
                    valueStyle={{ color: '#13c2c2', fontSize: 20 }}
                  />
                  <Progress percent={vehicle.tankLevel} size="small" showInfo={false} strokeColor="#13c2c2" />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic
                    title="今日休息"
                    value={vehicle.restHoursToday}
                    suffix="小时"
                    valueStyle={{ color: '#52c41a', fontSize: 20 }}
                  />
                </Card>
              </Col>
            </Row>
            <Divider className="!my-4" />
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={8}>
                <div className="text-sm text-gray-500 mb-1">超速比（本月）</div>
                <Progress
                  percent={vehicle.speedOverRatio}
                  strokeColor={vehicle.speedOverRatio > 15 ? '#ff4d4f' : vehicle.speedOverRatio > 8 ? '#faad14' : '#52c41a'}
                  status={vehicle.speedOverRatio > 15 ? 'exception' : 'active'}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div className="text-sm text-gray-500 mb-1">疲劳驾驶时长（本周）</div>
                <Progress
                  percent={Math.min(100, vehicle.fatigueHours * 10)}
                  strokeColor={vehicle.fatigueHours > 8 ? '#ff4d4f' : vehicle.fatigueHours > 4 ? '#faad14' : '#52c41a'}
                  format={() => `${vehicle.fatigueHours} h`}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div className="text-sm text-gray-500 mb-1">罐体状态达标率</div>
                <Progress
                  percent={vehicle.tankComplianceRate}
                  strokeColor={vehicle.tankComplianceRate < 90 ? '#ff4d4f' : vehicle.tankComplianceRate < 95 ? '#faad14' : '#52c41a'}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card className="!rounded-xl border-0" styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'track',
              label: (
                <span>
                  <EnvironmentOutlined />
                  7天行驶轨迹
                </span>
              ),
              children: (
                <div className="p-4">
                  <ReactECharts option={trackOption} style={{ height: 360 }} />
                  <Divider className="!my-4" />
                  <Title level={5} className="!mb-3">轨迹点列表</Title>
                  <Table
                    size="small"
                    dataSource={trackPoints.slice(-20)}
                    columns={[
                      { title: '时间', dataIndex: 'time', key: 'time', width: 150 },
                      { title: '位置', dataIndex: 'location', key: 'location' },
                      { title: '纬度', dataIndex: 'lat', key: 'lat', width: 100 },
                      { title: '经度', dataIndex: 'lng', key: 'lng', width: 100 },
                      {
                        title: '速度',
                        dataIndex: 'speed',
                        key: 'speed',
                        width: 120,
                        render: (s: number) => (
                          <span className={s > 80 ? 'text-red-500 font-semibold' : ''}>{s} km/h</span>
                        ),
                      },
                    ]}
                    rowKey="time"
                    pagination={false}
                    scroll={{ y: 240 }}
                  />
                </div>
              ),
            },
            {
              key: 'tank',
              label: (
                <span>
                  <ThunderboltOutlined />
                  罐体参数曲线
                </span>
              ),
              children: (
                <div className="p-4">
                  <ReactECharts option={tankOption} style={{ height: 400 }} />
                </div>
              ),
            },
            {
              key: 'violations',
              label: (
                <span>
                  <WarningOutlined />
                  违规记录
                  <Badge count={vehicleViolations.length} size="small" className="ml-2" />
                </span>
              ),
              children: (
                <div className="p-4">
                  <Row gutter={[16, 16]} className="mb-4">
                    <Col xs={12} sm={6}>
                      <Card size="small">
                        <Statistic title="本月违规总数" value={vehicle.violationsThisMonth} valueStyle={{ color: '#ff4d4f' }} />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card size="small">
                        <Statistic
                          title="待处理"
                          value={vehicleViolations.filter(v => !v.handled).length}
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Table
                    size="small"
                    columns={violationColumns}
                    dataSource={vehicleViolations}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default VehicleDetail
