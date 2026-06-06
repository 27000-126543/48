import {
  Row,
  Col,
  Card,
  Typography,
  Statistic,
  Table,
  Tag,
  List,
  Progress,
  Space,
  Button,
  Alert,
  Timeline,
  Divider,
  Tabs,
  Tooltip,
} from 'antd'
import {
  FileTextOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  SafetyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PrinterOutlined,
  DownloadOutlined,
  CalendarOutlined,
  BulbOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { mockWeeklyReport } from '@/data/mock'

const { Title, Text, Paragraph } = Typography

const TrendTag = ({ value, inverse = false }: { value: number; inverse?: boolean }) => {
  const positive = inverse ? value < 0 : value > 0
  const showValue = value > 0 ? `+${value}` : value
  const color = positive ? 'green' : value === 0 ? 'default' : 'red'
  const Icon = value >= 0 ? RiseOutlined : FallOutlined
  return (
    <Tag color={color} icon={<Icon />}>
      {showValue}%
    </Tag>
  )
}

const PriorityTag = ({ p }: { p: 'high' | 'medium' | 'low' }) => {
  const map: Record<string, { color: string; text: string; icon: any }> = {
    high: { color: 'red', text: '高', icon: <FireOutlined /> },
    medium: { color: 'orange', text: '中', icon: <WarningOutlined /> },
    low: { color: 'blue', text: '低', icon: <InfoCircleOutlined /> },
  }
  const m = map[p]
  return (
    <Tag color={m.color} icon={m.icon}>
      {m.text}优先级
    </Tag>
  )
}

const WeeklyReport = () => {
  const report = mockWeeklyReport

  const typeLabels: Record<string, string> = {
    temperature: '罐体温度超标',
    fatigue: '疲劳驾驶',
    overspeed: '超速行驶',
    pressure: '压力异常',
    tank_leak: '罐体泄漏',
  }

  const violationTypeOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
    legend: { bottom: 0, left: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{b}\n{d}%' },
        data: report.topViolations.map(v => ({
          value: v.count,
          name: typeLabels[v.type] || v.type,
          itemStyle: {
            color:
              v.type === 'overspeed'
                ? '#ff4d4f'
                : v.type === 'fatigue'
                ? '#faad14'
                : v.type === 'temperature'
                ? '#ff7a45'
                : v.type === 'pressure'
                ? '#722ed1'
                : '#eb2f96',
          },
        })),
      },
    ],
  }

  const weeklyTrendOption = {
    backgroundColor: 'transparent',
    title: { text: '近8周违规率/事故率趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['违规率(%)', '事故率(‰)'], bottom: 0 },
    grid: { left: 50, right: 50, top: 50, bottom: 40 },
    xAxis: { type: 'category', data: ['W16', 'W17', 'W18', 'W19', 'W20', 'W21', 'W22', 'W23'] },
    yAxis: [{ type: 'value', name: '违规率(%)' }, { type: 'value', name: '事故率(‰)' }],
    series: [
      {
        name: '违规率(%)',
        type: 'line',
        smooth: true,
        data: [8.2, 7.5, 7.1, 6.8, 6.5, 6.2, 6.23, 5.71],
        itemStyle: { color: '#ff4d4f' },
        markLine: { data: [{ type: 'average', name: '平均值' }] },
        areaStyle: { color: 'rgba(255,77,79,0.1)' },
      },
      {
        name: '事故率(‰)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: [0.25, 0.18, 0.22, 0.15, 0.18, 0.12, 0.12, 0.06],
        itemStyle: { color: '#722ed1' },
      },
    ],
  }

  const YoYOption = {
    backgroundColor: 'transparent',
    title: { text: '本周 vs 上周 vs 去年同期', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['违规数', '事故数', '预警数'], bottom: 0 },
    grid: { left: 40, right: 30, top: 50, bottom: 40 },
    xAxis: { type: 'category', data: ['去年同期', '上周', '本周'] },
    yAxis: { type: 'value' },
    series: [
      { name: '违规数', type: 'bar', data: [268, 203, 186], itemStyle: { color: '#ff4d4f' }, barWidth: 30 },
      { name: '事故数', type: 'bar', data: [5, 4, 2], itemStyle: { color: '#722ed1' }, barWidth: 30 },
      { name: '预警数', type: 'bar', data: [620, 458, 402], itemStyle: { color: '#faad14' }, barWidth: 30 },
    ],
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-xl border-0 !bg-gradient-to-r !from-blue-50 !to-indigo-50">
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileTextOutlined className="text-white text-3xl" />
            </div>
          </Col>
          <Col flex="auto">
            <Title level={3} className="!mb-1">
              全国危化品运输安全诊断报告
            </Title>
            <Space wrap className="!text-gray-600">
              <span>
                <CalendarOutlined className="mr-1" />
                第 {report.weekNumber} 周 ({report.startDate} ~ {report.endDate})
              </span>
              <Tag color="blue">报告编号: RPT-{report.year}-{String(report.weekNumber).padStart(2, '0')}</Tag>
              <Tag color="green" icon={<CheckCircleOutlined />}>
                自动生成
              </Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<PrinterOutlined />}>打印</Button>
              <Button type="primary" icon={<DownloadOutlined />}>
                下载 PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="!rounded-xl border-0">
            <Statistic
              title={
                <span className="text-gray-600">
                  <SafetyOutlined className="mr-1" />
                  监管车辆总数
                </span>
              }
              value={report.totalVehicles}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-xl border-0">
            <Statistic
              title={
                <span className="text-gray-600">
                  <WarningOutlined className="mr-1" />
                  本周违规总数
                </span>
              }
              value={report.totalViolations}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<TrendTag value={report.violationRateWoW} inverse />}
            />
            <div className="mt-2">
              <div className="text-xs text-gray-500 mb-1">违规率：{report.violationRate}%</div>
              <Progress percent={report.violationRate * 10} size="small" status="exception" showInfo={false} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-xl border-0">
            <Statistic
              title={
                <span className="text-gray-600">
                  <FireOutlined className="mr-1" />
                  本周事故数
                </span>
              }
              value={report.totalAccidents}
              valueStyle={{ color: '#722ed1' }}
              prefix={<TrendTag value={report.accidentRateWoW} inverse />}
            />
            <div className="mt-2">
              <div className="text-xs text-gray-500 mb-1">事故率：{report.accidentRate}‰</div>
              <Progress percent={report.accidentRate * 100} size="small" status="exception" showInfo={false} strokeColor="#722ed1" />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-xl border-0">
            <Statistic
              title={
                <span className="text-gray-600">
                  <ThunderboltOutlined className="mr-1" />
                  罐体达标率
                </span>
              }
              value={report.avgTankComplianceRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
              prefix={<TrendTag value={report.avgTankComplianceRateWoW} />}
            />
            <Progress percent={report.avgTankComplianceRate} size="small" strokeColor="#52c41a" showInfo={false} />
          </Card>
        </Col>
      </Row>

      <Alert
        type={report.violationRateWoW < 0 ? 'success' : 'warning'}
        showIcon
        message={
          <Space>
            {report.violationRateWoW < 0 ? (
              <><CheckCircleOutlined /> 本周安全形势总体向好</>
            ) : (
              <><ExclamationCircleOutlined /> 本周安全形势需重点关注</>
            )}
          </Space>
        }
        description={
          <Space direction="vertical" size={2}>
            <span>
              违规率同比上周 {report.violationRateWoW > 0 ? '上升' : '下降'} {Math.abs(report.violationRateWoW)}%，
              事故率 {report.accidentRateWoW > 0 ? '上升' : '下降'} {Math.abs(report.accidentRateWoW)}%
            </span>
            <span>罐体达标率 {report.avgTankComplianceRateWoW >= 0 ? '提升' : '下降'} {Math.abs(report.avgTankComplianceRateWoW)}%</span>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <WarningOutlined className="mr-1 text-red-500" />
                违规类型分布
              </span>
            }
            className="!rounded-xl border-0"
          >
            <ReactECharts option={violationTypeOption} style={{ height: 280 }} />
            <Divider className="!my-2" />
            <List
              size="small"
              dataSource={report.topViolations}
              renderItem={v => (
                <List.Item>
                  <span>{typeLabels[v.type]}</span>
                  <Space>
                    <Tag color="blue">{v.count} 次</Tag>
                    <Progress
                      percent={Math.round((v.count / report.totalViolations) * 100)}
                      size="small"
                      showInfo={false}
                      style={{ width: 80 }}
                    />
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="!rounded-xl border-0">
            <ReactECharts option={weeklyTrendOption} style={{ height: 380 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="!rounded-xl border-0">
            <ReactECharts option={YoYOption} style={{ height: 380 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                <FireOutlined className="mr-1 text-red-500" />
                高风险企业清单
              </span>
            }
            className="!rounded-xl border-0"
            extra={<Tag color="red">{report.highRiskCompanies.length} 家</Tag>}
          >
            <Table
              size="small"
              pagination={false}
              dataSource={report.highRiskCompanies}
              columns={[
                { title: '排名', dataIndex: 'idx', key: 'idx', width: 60, render: (_, __, i) => i + 1 },
                {
                  title: '企业名称',
                  dataIndex: 'company',
                  key: 'company',
                  render: t => <Text strong>{t}</Text>,
                },
                {
                  title: '违规次数',
                  dataIndex: 'violations',
                  key: 'violations',
                  width: 90,
                  render: n => <Tag color={n > 20 ? 'red' : 'orange'}>{n} 次</Tag>,
                },
                {
                  title: '风险等级',
                  dataIndex: 'riskLevel',
                  key: 'riskLevel',
                  width: 90,
                  render: l => (
                    <Tag color={l === 'high' ? 'red' : 'orange'}>
                      {l === 'high' ? '高风险' : '中风险'}
                    </Tag>
                  ),
                },
              ]}
            />
            <Alert
              type="warning"
              showIcon
              className="mt-3"
              message="监管建议"
              description="对高风险企业开展专项检查，约谈企业负责人，限期整改安全隐患。"
            />
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <span>
                <BulbOutlined className="mr-1 text-blue-500" />
                优化培训推荐
              </span>
            }
            className="!rounded-xl border-0"
          >
            <Timeline
              mode="left"
              items={report.trainingRecommendations.map((item, idx) => ({
                color: idx === 0 ? 'red' : idx === 1 ? 'orange' : 'blue',
                dot: <BulbOutlined />,
                children: (
                  <div>
                    <div className="font-semibold text-gray-800">培训项目 {idx + 1}</div>
                    <div className="text-gray-600 mt-1">{item}</div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FlagOutlined className="text-red-500" />
            <span>整改计划</span>
            <Tooltip title="根据本周违规和事故情况生成的整改建议，按优先级排序">
              <InfoCircleOutlined className="text-gray-400" />
            </Tooltip>
          </Space>
        }
        className="!rounded-xl border-0"
        extra={<Tag color="blue">共 {report.rectificationPlans.length} 项</Tag>}
      >
        <List
          dataSource={report.rectificationPlans}
          renderItem={(item, idx) => (
            <List.Item
              className="!p-4 !border !rounded-xl !mb-3 hover:!shadow-md transition-shadow"
              style={{ borderLeft: `4px solid ${item.priority === 'high' ? '#ff4d4f' : item.priority === 'medium' ? '#faad14' : '#1677ff'}` }}
            >
              <Row gutter={[16, 8]} align="middle" className="w-full">
                <Col flex="none">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                    {idx + 1}
                  </div>
                </Col>
                <Col flex="auto">
                  <div className="font-medium text-gray-800">{item.item}</div>
                  <Space className="mt-1" wrap>
                    <PriorityTag p={item.priority} />
                    <Tag icon={<ClockCircleOutlined />} color="blue">
                      截止：{item.deadline}
                    </Tag>
                  </Space>
                </Col>
                <Col flex="none">
                  <Space>
                    <Button size="small">指派</Button>
                    <Button type="primary" size="small">跟踪</Button>
                  </Space>
                </Col>
              </Row>
            </List.Item>
          )}
        />
      </Card>

      <Card className="!rounded-xl border-0 !bg-gray-50">
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <div className="text-xs text-gray-500">报告生成时间</div>
            <div className="font-semibold">{report.endDate} 18:00:00</div>
          </Col>
          <Col xs={12} md={6}>
            <div className="text-xs text-gray-500">数据范围</div>
            <div className="font-semibold">全国 31 省/市/自治区</div>
          </Col>
          <Col xs={12} md={6}>
            <div className="text-xs text-gray-500">数据来源</div>
            <div className="font-semibold">GPS · 罐体传感器 · 发货单/接收单</div>
          </Col>
          <Col xs={12} md={6}>
            <div className="text-xs text-gray-500">生成方式</div>
            <div className="font-semibold text-green-600"><CheckCircleOutlined /> AI 自动分析</div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default WeeklyReport
