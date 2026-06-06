import { Row, Col, Card, Statistic, Tag, List, Avatar, Typography, Progress, Spin } from 'antd'
import {
  CarOutlined,
  WarningOutlined,
  FireOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useState, useEffect, useMemo } from 'react'
import { riskApi, type DashboardSummary } from '@/api/client'

const { Title, Text } = Typography

const StatusTag = ({ status }: { status: string }) => {
  const map: Record<string, { color: string; text: string }> = {
    running: { color: 'green', text: '行驶中' },
    stopped: { color: 'default', text: '已停车' },
    warning: { color: 'orange', text: '预警' },
    danger: { color: 'red', text: '危险' },
    offline: { color: 'gray', text: '离线' },
  }
  const s = map[status] || map.offline
  return <Tag color={s.color}>{s.text}</Tag>
}

const WarningTypeTag = ({ type }: { type: string }) => {
  const map: Record<string, { color: string; text: string; icon: any }> = {
    temperature: { color: 'red', text: '温度超标', icon: '🌡️' },
    fatigue: { color: 'orange', text: '疲劳驾驶', icon: '😴' },
    overspeed: { color: 'volcano', text: '超速行驶', icon: '⚡' },
    pressure: { color: 'purple', text: '压力异常', icon: '💨' },
    tank_leak: { color: 'magenta', text: '罐体泄漏', icon: '⚠️' },
  }
  const t = map[type] || map.overspeed
  return (
    <Tag color={t.color}>
      <span className="mr-1">{t.icon}</span>
      {t.text}
    </Tag>
  )
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await riskApi.getDashboardSummary()
      setData(res)
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 5000)
    return () => clearInterval(timer)
  }, [])

  const sortedProvinces = useMemo(() => {
    if (!data) return []
    return [...data.provinceHeat].sort((a, b) => b.value - a.value).slice(0, 15)
  }, [data])

  const heatmapOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: {
      text: '全国各省份运输强度排名 TOP 15',
      subtext: '按在运车辆数量与预警综合指数排序',
      left: 'center',
      top: 10,
      textStyle: { color: '#e6f4ff', fontSize: 16, fontWeight: 600 },
      subtextStyle: { color: '#8c8c8c', fontSize: 12 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any[]) => {
        const p = params[0]
        const d = sortedProvinces[p.dataIndex]
        if (!d) return ''
        return `<b>${d.name}</b><br/>运输强度指数：${d.value}<br/>在运车辆：${d.vehicleCount}辆<br/>预警数量：${d.warningCount}次`
      },
      backgroundColor: 'rgba(0,21,41,0.95)',
      borderColor: '#1677ff',
      textStyle: { color: '#fff' },
    },
    grid: { left: 100, right: 60, top: 70, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#1677ff55' } },
      splitLine: { lineStyle: { color: '#1677ff22' } },
      axisLabel: { color: '#8c8c8c' },
    },
    yAxis: {
      type: 'category',
      data: sortedProvinces.map(p => p.name.replace(/省|市|自治区|壮族|回族|维吾尔/g, '')).reverse(),
      axisLine: { lineStyle: { color: '#1677ff55' } },
      axisLabel: { color: '#e6f4ff', fontSize: 11 },
    },
    visualMap: {
      min: 0,
      max: 500,
      right: 10,
      top: 'center',
      orient: 'vertical',
      text: ['高', '低'],
      textStyle: { color: '#e6f4ff' },
      calculable: true,
      itemWidth: 12,
      itemHeight: 120,
      inRange: {
        color: ['#0a3d62', '#1e6091', '#3c8dbc', '#52c41a', '#faad14', '#ff7a45', '#ff4d4f'],
      },
    },
    series: [
      {
        name: '运输强度指数',
        type: 'bar',
        data: sortedProvinces.map(p => p.value).reverse(),
        barWidth: 16,
        label: {
          show: true,
          position: 'right',
          color: '#e6f4ff',
          fontSize: 10,
        },
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
        },
      },
    ],
  }), [sortedProvinces])

  const statusPieOption = useMemo(() => {
    const dist = data?.statusDistribution || {}
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: '{b}: {c}辆 ({d}%)' },
      legend: { bottom: 0, textStyle: { color: '#595959' } },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          data: [
            { value: dist.running || 0, name: '行驶中', itemStyle: { color: '#52c41a' } },
            { value: dist.stopped || 0, name: '已停车', itemStyle: { color: '#8c8c8c' } },
            { value: dist.warning || 0, name: '预警', itemStyle: { color: '#faad14' } },
            { value: dist.danger || 0, name: '危险', itemStyle: { color: '#ff4d4f' } },
            { value: dist.offline || 0, name: '离线', itemStyle: { color: '#bfbfbf' } },
          ],
        },
      ],
    }
  }, [data])

  const violationTrendOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['违规数', '预警数'], bottom: 0 },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: data?.trendLabels || Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD')),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '违规数',
        type: 'line',
        smooth: true,
        data: data?.violationTrend || [],
        itemStyle: { color: '#ff4d4f' },
        areaStyle: { color: 'rgba(255,77,79,0.15)' },
      },
      {
        name: '预警数',
        type: 'line',
        smooth: true,
        data: data?.warningTrend || [],
        itemStyle: { color: '#faad14' },
        areaStyle: { color: 'rgba(250,173,20,0.15)' },
      },
    ],
  }), [data])

  if (loading || !data) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  const totalRunning = data.runningVehicles
  const totalWarning = data.warningVehicles
  const todayWarnings = data.todayWarningCount
  const totalVehicles = data.totalVehicles

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Card className="card-glow !rounded-xl border-0">
            <Statistic
              title={
                <span className="text-gray-600">
                  <CarOutlined className="mr-2" />
                  在运车辆
                </span>
              }
              value={totalRunning}
              suffix={`/ ${totalVehicles}`}
              valueStyle={{ color: '#1677ff', fontWeight: 700 }}
            />
            <Progress percent={Math.round((totalRunning / totalVehicles) * 100)} size="small" showInfo={false} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="card-glow !rounded-xl border-0">
            <Statistic
              title={
                <span className="text-gray-600">
                  <WarningOutlined className="mr-2" />
                  预警中车辆
                </span>
              }
              value={totalWarning}
              valueStyle={{ color: '#faad14', fontWeight: 700 }}
              prefix={<ThunderboltOutlined />}
            />
            <Progress percent={Math.round((totalWarning / totalVehicles) * 100)} status="exception" size="small" showInfo={false} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="card-glow !rounded-xl border-0">
            <Statistic
              title={
                <span className="text-gray-600">
                  <FireOutlined className="mr-2" />
                  今日预警
                </span>
              }
              value={todayWarnings}
              valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
              suffix="次"
            />
            <Progress percent={75} status="exception" size="small" showInfo={false} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="card-glow !rounded-xl border-0">
            <Statistic
              title={
                <span className="text-gray-600">
                  <SafetyOutlined className="mr-2" />
                  罐体达标率
                </span>
              }
              value={data.avgTankComplianceRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
            <div className="flex items-center gap-1 text-xs">
              {data.tankComplianceRateChange >= 0 ? (
                <><RiseOutlined className="text-green-500" /> <span className="text-green-500">+{data.tankComplianceRateChange}%</span></>
              ) : (
                <><FallOutlined className="text-red-500" /> <span className="text-red-500">{data.tankComplianceRateChange}%</span></>
              )}
              <span className="text-gray-400">较上周</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            className="!rounded-xl border-0 heatmap-container"
            styles={{ body: { padding: 0, minHeight: 480 } }}
          >
            <ReactECharts option={heatmapOption} style={{ height: 480 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <FireOutlined className="mr-2 text-red-500" />
                高风险路线排名 TOP 8
              </span>
            }
            className="!rounded-xl border-0"
            styles={{ body: { padding: 8 } }}
          >
            <List
              dataSource={data.highRiskRoutes}
              renderItem={(route, idx) => {
                const riskColor = route.riskLevel === 'high' ? '#ff4d4f' : route.riskLevel === 'medium' ? '#faad14' : '#52c41a'
                return (
                  <List.Item
                    className="!px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => navigate('/vehicles')}
                  >
                    <div className="w-full flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          idx < 3 ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gray-300'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{route.name}</div>
                        <div className="text-xs text-gray-500">{route.startCity} → {route.endCity} · {route.vehicleCount}辆车</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: riskColor }}>{route.riskScore}</div>
                        <div className="text-xs text-gray-400">{route.warningCount}次预警</div>
                      </div>
                    </div>
                  </List.Item>
                )
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card
            title={
              <span>
                <ThunderboltOutlined className="mr-2 text-orange-500" />
                实时预警
              </span>
            }
            className="!rounded-xl border-0"
            extra={
              <a onClick={() => navigate('/warnings')} className="text-blue-500 text-sm">
                查看全部 <EyeOutlined />
              </a>
            }
          >
            <List
              dataSource={data.recentWarnings.slice(0, 5)}
              renderItem={warn => (
                <List.Item
                  className="!px-0 hover:bg-gray-50 rounded-lg p-2 cursor-pointer"
                  onClick={() => navigate('/warnings')}
                >
                  <div className="w-full flex items-start gap-2">
                    <Avatar
                      style={{
                        backgroundColor: warn.level === 'level2' ? '#ff4d4f' : '#faad14',
                        flexShrink: 0,
                      }}
                      icon={<WarningOutlined />}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <WarningTypeTag type={warn.type} />
                        <Tag color={warn.level === 'level2' ? 'red' : 'orange'}>
                          {warn.level === 'level2' ? '二级' : '一级'}
                        </Tag>
                      </div>
                      <div className="text-sm text-gray-800 font-medium">{warn.plateNumber} · {warn.driver}</div>
                      <div className="text-xs text-gray-500 truncate">{warn.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{dayjs(warn.createdAt).format('HH:mm:ss')}</div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card
            title={
              <span>
                <CarOutlined className="mr-2 text-blue-500" />
                车辆状态分布
              </span>
            }
            className="!rounded-xl border-0"
          >
            <ReactECharts option={statusPieOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <ThunderboltOutlined className="mr-2 text-purple-500" />
                近7天违规/预警趋势
              </span>
            }
            className="!rounded-xl border-0"
          >
            <ReactECharts option={violationTrendOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
