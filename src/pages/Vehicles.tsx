import { useState } from 'react'
import {
  Table,
  Tag,
  Input,
  Select,
  Card,
  Button,
  Space,
  Progress,
  Tooltip,
  Typography,
  Badge,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  WarningOutlined,
  CarOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { mockVehicles } from '@/data/mock'
import type { Vehicle, VehicleStatus } from '@/types'

const { Text } = Typography
const { Option } = Select

const StatusBadge = ({ status }: { status: VehicleStatus }) => {
  const map: Record<VehicleStatus, { color: string; text: string; dot?: boolean }> = {
    running: { color: 'success', text: '行驶中' },
    stopped: { color: 'default', text: '已停车' },
    warning: { color: 'warning', text: '预警' },
    danger: { color: 'error', text: '危险' },
    offline: { color: 'default', text: '离线' },
  }
  const s = map[status]
  return <Badge status={s.color as any} text={s.text} />
}

const Vehicles = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const filtered = mockVehicles.filter(v => {
    const matchKeyword =
      !keyword ||
      v.plateNumber.toLowerCase().includes(keyword.toLowerCase()) ||
      v.driver.includes(keyword) ||
      v.company.includes(keyword)
    const matchStatus = statusFilter === 'all' || v.status === statusFilter
    return matchKeyword && matchStatus
  })

  const columns: ColumnsType<Vehicle> = [
    {
      title: '车牌号码',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      width: 130,
      fixed: 'left',
      render: (text, record) => (
        <div>
          <div className="font-semibold text-blue-600">{text}</div>
          <div className="text-xs text-gray-400">{record.id}</div>
        </div>
      ),
    },
    {
      title: '司机',
      dataIndex: 'driver',
      key: 'driver',
      width: 100,
    },
    {
      title: '所属企业',
      dataIndex: 'company',
      key: 'company',
      width: 180,
      ellipsis: true,
    },
    {
      title: '运输货物',
      dataIndex: 'cargo',
      key: 'cargo',
      width: 140,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Tag color="purple" className="!mb-0">{text}</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.cargoType}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: s => <StatusBadge status={s} />,
      filters: [
        { text: '行驶中', value: 'running' },
        { text: '已停车', value: 'stopped' },
        { text: '预警', value: 'warning' },
        { text: '危险', value: 'danger' },
        { text: '离线', value: 'offline' },
      ],
      onFilter: (v, r) => r.status === v,
    },
    {
      title: '当前速度',
      dataIndex: 'currentSpeed',
      key: 'currentSpeed',
      width: 130,
      render: (speed: number, record) => {
        const over = speed > record.speedLimit
        return (
          <div>
            <span className={`font-bold ${over ? 'text-red-500' : 'text-gray-800'}`}>
              {speed}
            </span>
            <span className="text-gray-400 text-sm"> / {record.speedLimit} km/h</span>
            {over && (
              <Tag color="red" className="!ml-1">
                超速 +{Math.round(((speed - record.speedLimit) / record.speedLimit) * 100)}%
              </Tag>
            )}
          </div>
        )
      },
    },
    {
      title: '超速比',
      dataIndex: 'speedOverRatio',
      key: 'speedOverRatio',
      width: 140,
      sorter: (a, b) => a.speedOverRatio - b.speedOverRatio,
      render: (v: number) => (
        <div className="w-28">
          <Progress
            percent={v}
            size="small"
            strokeColor={v > 15 ? '#ff4d4f' : v > 8 ? '#faad14' : '#52c41a'}
            format={p => `${p}%`}
          />
        </div>
      ),
    },
    {
      title: '连续驾驶',
      dataIndex: 'continuousDrivingHours',
      key: 'continuousDrivingHours',
      width: 150,
      sorter: (a, b) => a.continuousDrivingHours - b.continuousDrivingHours,
      render: (h: number) => {
        const over = h > 4
        return (
          <div>
            <span className={`font-semibold ${over ? 'text-orange-500' : 'text-gray-800'}`}>
              {h} 小时
            </span>
            {over && (
              <Tooltip title="已超过4小时疲劳驾驶阈值">
                <WarningOutlined className="text-orange-500 ml-1" />
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      title: '罐体温度',
      dataIndex: 'tankTemperature',
      key: 'tankTemperature',
      width: 140,
      sorter: (a, b) => a.tankTemperature - b.tankTemperature,
      render: (temp: number, record) => {
        const over = temp > record.tankTempThreshold
        return (
          <div>
            <span className={`font-semibold ${over ? 'text-red-500' : 'text-gray-800'}`}>
              {temp}°C
            </span>
            <span className="text-gray-400 text-sm"> / {record.tankTempThreshold}°C</span>
          </div>
        )
      },
    },
    {
      title: '罐体达标率',
      dataIndex: 'tankComplianceRate',
      key: 'tankComplianceRate',
      width: 140,
      sorter: (a, b) => a.tankComplianceRate - b.tankComplianceRate,
      render: (v: number) => (
        <div className="w-24">
          <Progress
            percent={v}
            size="small"
            strokeColor={v < 90 ? '#ff4d4f' : v < 95 ? '#faad14' : '#52c41a'}
            format={p => `${p}%`}
          />
        </div>
      ),
    },
    {
      title: '行驶路线',
      dataIndex: 'route',
      key: 'route',
      width: 160,
      render: text => <span className="text-gray-700">{text}</span>,
    },
    {
      title: '当前位置',
      dataIndex: 'currentLocation',
      key: 'currentLocation',
      width: 180,
      ellipsis: true,
    },
    {
      title: '本月违规',
      dataIndex: 'violationsThisMonth',
      key: 'violationsThisMonth',
      width: 100,
      sorter: (a, b) => a.violationsThisMonth - b.violationsThisMonth,
      render: n => (
        <Tag color={n > 5 ? 'red' : n > 2 ? 'orange' : 'green'}>
          {n} 次
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/vehicles/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ]

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 800)
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-xl border-0">
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索车牌号、司机、企业..."
            allowClear
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
          >
            <Option value="all">全部状态</Option>
            <Option value="running">行驶中</Option>
            <Option value="stopped">已停车</Option>
            <Option value="warning">预警</Option>
            <Option value="danger">危险</Option>
            <Option value="offline">离线</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          <Space className="ml-auto">
            <Tag icon={<CarOutlined />} color="blue">共 {filtered.length} 辆车</Tag>
          </Space>
        </Space>
      </Card>

      <Card className="!rounded-xl border-0" styles={{ body: { padding: 0 } }}>
        <Table
          loading={loading}
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条记录`,
          }}
          onRow={record => ({
            onClick: () => navigate(`/vehicles/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

export default Vehicles
