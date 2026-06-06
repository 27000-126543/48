import { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Typography,
  Upload,
  Button,
  Table,
  Tag,
  Tabs,
  Progress,
  Space,
  Alert,
  Statistic,
  List,
  Tooltip,
  message,
  Divider,
  Badge,
} from 'antd'
import {
  CloudUploadOutlined,
  CloudOutlined,
  WarningOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  FileExcelOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  RocketOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { riskApi } from '@/api/client'
import type { WeatherData, RestrictionData, RouteRecommendation, HighRiskRoute } from '@/types'

const { Title, Text, Paragraph } = Typography

const riskColors: Record<string, string> = {
  high: '#ff4d4f',
  medium: '#faad14',
  low: '#52c41a',
}

const riskLabels: Record<string, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
}

const RiskPrediction = () => {
  const [weatherFileList, setWeatherFileList] = useState<UploadFile[]>([])
  const [restrictionFileList, setRestrictionFileList] = useState<UploadFile[]>([])
  const [predicting, setPredicting] = useState(false)
  const [predicted, setPredicted] = useState(false)

  const [weather, setWeather] = useState<WeatherData[]>([])
  const [restrictions, setRestrictions] = useState<RestrictionData[]>([])
  const [recommendations, setRecommendations] = useState<RouteRecommendation[]>([])
  const [highRiskRoutes, setHighRiskRoutes] = useState<HighRiskRoute[]>([])
  const [hourData, setHourData] = useState<{ hour: string; riskScore: number; vehicleCount: number }[]>([])
  const [riskPeriods, setRiskPeriods] = useState<{ high: string[]; medium: string[]; low: string[] }>({
    high: [],
    medium: [],
    low: [],
  })

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [weatherRes, restrictionsRes, predictionRes] = await Promise.all([
          riskApi.getWeather(),
          riskApi.getRestrictions(),
          riskApi.getPrediction(),
        ])
        setWeather(weatherRes.data)
        setRestrictions(restrictionsRes.data)
        setHourData(predictionRes.hourData)
        setRecommendations(predictionRes.recommendations)
        setHighRiskRoutes(predictionRes.highRiskRoutes)
        setRiskPeriods({
          high: predictionRes.highRiskPeriods,
          medium: predictionRes.mediumRiskPeriods,
          low: predictionRes.lowRiskPeriods,
        })
        setPredicted(true)
      } catch (err: any) {
        message.error(err.message || '加载数据失败')
      }
    }
    loadInitialData()
  }, [])

  const weatherProps: UploadProps = {
    onRemove: file => {
      setWeatherFileList(prev => prev.filter(f => f.uid !== file.uid))
    },
    beforeUpload: async file => {
      try {
        setWeatherFileList(prev => [...prev, { ...file, status: 'uploading' }])
        const res = await riskApi.uploadWeather(file as File)
        if (res.success) {
          setWeather(res.data)
          setWeatherFileList(prev =>
            prev.map(f => (f.uid === file.uid ? { ...f, status: 'done' as const } : f)),
          )
          message.success(`气象数据文件 "${file.name}" 上传成功，共解析 ${res.count} 条记录`)
        }
      } catch (err: any) {
        setWeatherFileList(prev =>
          prev.map(f => (f.uid === file.uid ? { ...f, status: 'error' as const } : f)),
        )
        message.error(err.message || '气象数据上传失败')
      }
      return false
    },
    accept: '.xlsx,.xls,.csv',
    fileList: weatherFileList,
  }

  const restrictionProps: UploadProps = {
    onRemove: file => {
      setRestrictionFileList(prev => prev.filter(f => f.uid !== file.uid))
    },
    beforeUpload: async file => {
      try {
        setRestrictionFileList(prev => [...prev, { ...file, status: 'uploading' }])
        const res = await riskApi.uploadRestriction(file as File)
        if (res.success) {
          setRestrictions(res.data)
          setRestrictionFileList(prev =>
            prev.map(f => (f.uid === file.uid ? { ...f, status: 'done' as const } : f)),
          )
          message.success(`限行数据文件 "${file.name}" 上传成功，共解析 ${res.count} 条记录`)
        }
      } catch (err: any) {
        setRestrictionFileList(prev =>
          prev.map(f => (f.uid === file.uid ? { ...f, status: 'error' as const } : f)),
        )
        message.error(err.message || '限行数据上传失败')
      }
      return false
    },
    accept: '.xlsx,.xls,.csv',
    fileList: restrictionFileList,
  }

  const runPrediction = async () => {
    try {
      setPredicting(true)
      const res = await riskApi.getPrediction()
      setHourData(res.hourData)
      setRecommendations(res.recommendations)
      setHighRiskRoutes(res.highRiskRoutes)
      setRiskPeriods({
        high: res.highRiskPeriods,
        medium: res.mediumRiskPeriods,
        low: res.lowRiskPeriods,
      })
      setPredicted(true)
      message.success('风险预测完成，已生成绕行路线推荐')
    } catch (err: any) {
      message.error(err.message || '风险预测失败')
    } finally {
      setPredicting(false)
    }
  }

  const riskPredictionOption = {
    backgroundColor: 'transparent',
    title: {
      text: '未来24小时运输风险预测',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: { trigger: 'axis' },
    legend: { data: ['风险指数', '在途车辆'], bottom: 0 },
    grid: { left: 50, right: 50, top: 50, bottom: 50 },
    xAxis: {
      type: 'category',
      data:
        hourData.length > 0
          ? hourData.map(h => h.hour)
          : Array.from({ length: 24 }, (_, i) => `${dayjs().hour(i).format('HH')}:00`),
      axisLabel: { fontSize: 10 },
    },
    yAxis: [
      { type: 'value', name: '风险指数', max: 100 },
      { type: 'value', name: '在途车辆' },
    ],
    series: [
      {
        name: '风险指数',
        type: 'line',
        smooth: true,
        data: hourData.length > 0 ? hourData.map(h => h.riskScore) : [],
        itemStyle: { color: '#ff4d4f' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255,77,79,0.4)' },
              { offset: 1, color: 'rgba(255,77,79,0.02)' },
            ],
          },
        },
        markLine: {
          silent: true,
          data: [
            { yAxis: 60, label: { formatter: '高风险阈值' }, lineStyle: { color: '#ff4d4f', type: 'dashed' } },
            { yAxis: 30, label: { formatter: '中风险阈值' }, lineStyle: { color: '#faad14', type: 'dashed' } },
          ],
        },
      },
      {
        name: '在途车辆',
        type: 'bar',
        yAxisIndex: 1,
        data: hourData.length > 0 ? hourData.map(h => h.vehicleCount) : [],
        itemStyle: { color: 'rgba(22,119,255,0.5)', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }

  const weatherColumns = [
    { title: '省份', dataIndex: 'province', key: 'province' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '天气', dataIndex: 'weather', key: 'weather', render: (w: string) => <Tag color="blue">{w}</Tag> },
    { title: '温度', dataIndex: 'temperature', key: 'temperature' },
    { title: '风力', dataIndex: 'wind', key: 'wind' },
    {
      title: '能见度',
      dataIndex: 'visibility',
      key: 'visibility',
      render: (v: number) => (
        <span className={v < 1 ? 'text-red-500 font-semibold' : v < 3 ? 'text-orange-500' : ''}>
          {v} km
        </span>
      ),
    },
    {
      title: '运输风险',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (r: string) => (
        <Tag color={riskColors[r]} style={{ fontWeight: 600 }}>
          {riskLabels[r]}
        </Tag>
      ),
    },
  ]

  const restrictionColumns = [
    { title: '省份', dataIndex: 'province', key: 'province' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '限行路段', dataIndex: 'road', key: 'road', render: (t: string) => <Text strong>{t}</Text> },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
    { title: '限行原因', dataIndex: 'reason', key: 'reason' },
  ]

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <CloudOutlined className="mr-2 text-blue-500" />
                气象数据上传
              </span>
            }
            className="!rounded-xl border-0"
            extra={<Tag color="blue">已加载 {weather.length} 条记录</Tag>}
          >
            <Upload.Dragger {...weatherProps} multiple className="!mb-3">
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽上传气象数据 Excel</p>
              <p className="ant-upload-hint">
                支持 .xlsx/.xls/.csv 格式，需包含：省份、城市、日期、天气、温度、风力、能见度
              </p>
            </Upload.Dragger>
            <Table
              size="small"
              columns={weatherColumns}
              dataSource={weather}
              rowKey={(r, i) => `${r.city}-${i}`}
              pagination={false}
              scroll={{ y: 180 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <EnvironmentOutlined className="mr-2 text-orange-500" />
                道路限行数据上传
              </span>
            }
            className="!rounded-xl border-0"
            extra={<Tag color="orange">已加载 {restrictions.length} 条记录</Tag>}
          >
            <Upload.Dragger {...restrictionProps} multiple className="!mb-3">
              <p className="ant-upload-drag-icon">
                <FileExcelOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽上传限行数据 Excel</p>
              <p className="ant-upload-hint">
                支持 .xlsx/.xls/.csv 格式，需包含：省份、城市、路段、开始时间、结束时间、限行原因
              </p>
            </Upload.Dragger>
            <Table
              size="small"
              columns={restrictionColumns}
              dataSource={restrictions}
              rowKey={(r, i) => `${r.road}-${i}`}
              pagination={false}
              scroll={{ y: 180 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        className="!rounded-xl border-0"
        title={
          <Space>
            <ThunderboltOutlined className="text-purple-500" />
            <span>风险预测引擎</span>
            <Tooltip title="基于实时气象、道路限行、历史事故、车辆状态等多维数据，采用机器学习模型预测未来24小时各时段运输风险">
              <InfoCircleOutlined className="text-gray-400" />
            </Tooltip>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />}>重新加载数据</Button>
            <Button type="primary" icon={<RocketOutlined />} loading={predicting} onClick={runPrediction}>
              {predicting ? '预测中...' : '运行风险预测'}
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={8}>
            <Card size="small" className="!bg-red-50 !text-center">
              <Statistic
                title="高风险时段"
                value={riskPeriods.high.length}
                suffix="个"
                valueStyle={{ color: '#ff4d4f' }}
              />
              <Text type="secondary" className="text-xs">
                {riskPeriods.high.length > 0 ? riskPeriods.high.join('、') : '暂无高风险时段'}
              </Text>
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small" className="!bg-orange-50 !text-center">
              <Statistic
                title="中风险时段"
                value={riskPeriods.medium.length}
                suffix="个"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small" className="!bg-green-50 !text-center">
              <Statistic
                title="低风险时段"
                value={riskPeriods.low.length}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
              <Text type="secondary" className="text-xs">建议优先安排运输</Text>
            </Card>
          </Col>
        </Row>

        <ReactECharts option={riskPredictionOption} style={{ height: 360 }} />

        {predicted && recommendations.length > 0 && (
          <Alert
            type="warning"
            showIcon
            className="mt-4"
            message="高风险预警"
            description={
              <Space direction="vertical" size={4}>
                {riskPeriods.high.length > 0 && (
                  <span>• 高风险时段：{riskPeriods.high.join('、')}，建议调整运输计划</span>
                )}
                {weather.filter(w => w.riskLevel === 'high').length > 0 && (
                  <span>
                    •{' '}
                    {weather
                      .filter(w => w.riskLevel === 'high')
                      .map(w => `${w.province}${w.city}`)
                      .join('、')}
                    天气恶劣，能见度低
                  </span>
                )}
                {restrictions.length > 0 && (
                  <span>• {restrictions.length} 条道路限行/管制记录，建议查看并规划绕行</span>
                )}
                {recommendations.length > 0 && (
                  <span>• 已生成 {recommendations.length} 条智能绕行路线推荐</span>
                )}
              </Space>
            }
          />
        )}
      </Card>

      <Card
        className="!rounded-xl border-0"
        title={
          <Space>
            <SafetyOutlined className="text-green-500" />
            <span>智能绕行路线推荐</span>
            <Badge count={recommendations.length} size="small" />
          </Space>
        }
      >
        {recommendations.map(rec => (
          <Card
            key={rec.id}
            size="small"
            className="!mb-3 hover:!shadow-md transition-shadow"
            styles={{ body: { padding: 16 } }}
          >
            <Row gutter={[16, 8]} align="middle">
              <Col xs={24} md={10}>
                <Space direction="vertical" size={4} className="w-full">
                  <div className="flex items-center gap-2">
                    <Tag color="red">原路线风险: {rec.originalRisk}</Tag>
                    <ArrowRightOutlined className="text-gray-400" />
                    <Tag color="green">绕行风险: {rec.alternateRisk}</Tag>
                    <Tag color="blue">
                      风险下降 {Math.round(((rec.originalRisk - rec.alternateRisk) / rec.originalRisk) * 100)}%
                    </Tag>
                  </div>
                  <div className="text-gray-800">
                    <Text delete type="secondary">
                      {rec.originalRoute}
                    </Text>
                  </div>
                  <div className="text-green-600 font-medium">
                    <ArrowRightOutlined className="mr-1" />
                    {rec.alternateRoute}
                  </div>
                </Space>
              </Col>
              <Col xs={12} md={6}>
                <div className="text-xs text-gray-500">额外里程</div>
                <div className="text-lg font-semibold">+{rec.extraDistance} km</div>
              </Col>
              <Col xs={12} md={6}>
                <div className="text-xs text-gray-500">额外时间</div>
                <div className="text-lg font-semibold">+{rec.extraTime} 分钟</div>
              </Col>
              <Col xs={24} md={2}>
                <Button type="primary" size="small" block>
                  采用
                </Button>
              </Col>
            </Row>
            <div className="mt-2 pt-2 border-t text-sm text-gray-600">
              💡 <span className="font-medium">推荐理由：</span>
              {rec.reason}
            </div>
          </Card>
        ))}
        {recommendations.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <SafetyOutlined className="text-4xl mb-3" />
            <div>暂无绕行路线推荐，当前路线风险较低</div>
          </div>
        )}
      </Card>

      <Card
        className="!rounded-xl border-0"
        title={
          <Space>
            <WarningOutlined className="text-red-500" />
            <span>当前高风险路段预警</span>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {highRiskRoutes
            .filter(r => r.riskLevel !== 'low')
            .map(route => (
              <Col xs={24} md={12} key={route.id}>
                <Card
                  size="small"
                  className={`!border-l-4 ${
                    route.riskLevel === 'high' ? '!border-l-red-500' : '!border-l-orange-400'
                  }`}
                >
                  <Row gutter={8} align="middle">
                    <Col flex="auto">
                      <div className="font-semibold text-gray-800">{route.name}</div>
                      <div className="text-xs text-gray-500">
                        {route.startCity} → {route.endCity} · {route.distance}km
                      </div>
                    </Col>
                    <Col flex="none">
                      <Tag color={riskColors[route.riskLevel]} className="!text-base !font-bold">
                        {route.riskScore} 分
                      </Tag>
                    </Col>
                  </Row>
                  <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs text-gray-500">
                    <span>在途 {route.vehicleCount} 辆</span>
                    <span className="text-red-500">预警 {route.warningCount} 次</span>
                    <span>平均时速 {route.avgSpeed}km/h</span>
                  </div>
                </Card>
              </Col>
            ))}
          {highRiskRoutes.filter(r => r.riskLevel !== 'low').length === 0 && (
            <Col span={24}>
              <div className="text-center py-12 text-gray-400">
                <SafetyOutlined className="text-4xl mb-3" />
                <div>暂无高风险路段，道路安全状态良好</div>
              </div>
            </Col>
          )}
        </Row>
      </Card>
    </div>
  )
}

export default RiskPrediction
