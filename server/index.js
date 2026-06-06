import express from 'express'
import cors from 'cors'
import multer from 'multer'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek.js'
dayjs.extend(isoWeek)
import { users, generateToken, authMiddleware } from './auth.js'
import {
  generateVehicles,
  generateInitialWarnings,
  updateVehicleRealtime,
  detectNewWarnings,
} from './data.js'
import {
  calculate24HourRisk,
  generateRouteRecommendations,
  generateHighRiskRoutes,
  generateProvinceHeat,
  calculateWeatherRisk,
  getRiskLevel,
} from './risk.js'
import { parseWeatherExcel, parseRestrictionExcel } from './excelParser.js'

const app = express()
const PORT = 4000
const upload = multer({ storage: multer.memoryStorage() })

app.use(cors())
app.use(express.json())

let vehicles = generateVehicles(80)
let warnings = generateInitialWarnings(vehicles)

let weatherData = [
  { province: '江苏省', city: '南京', date: dayjs().format('YYYY-MM-DD'), weather: '暴雨', temperature: '22~28°C', wind: '东南风5-6级', visibility: 0.8 },
  { province: '浙江省', city: '杭州', date: dayjs().format('YYYY-MM-DD'), weather: '大雨', temperature: '23~29°C', wind: '南风4-5级', visibility: 1.2 },
  { province: '上海市', city: '上海', date: dayjs().format('YYYY-MM-DD'), weather: '中雨', temperature: '24~30°C', wind: '东南风4级', visibility: 2.5 },
  { province: '广东省', city: '广州', date: dayjs().format('YYYY-MM-DD'), weather: '雷阵雨', temperature: '26~33°C', wind: '南风3-4级', visibility: 3.0 },
  { province: '山东省', city: '济南', date: dayjs().format('YYYY-MM-DD'), weather: '晴', temperature: '18~32°C', wind: '微风', visibility: 15.0 },
  { province: '河北省', city: '石家庄', date: dayjs().format('YYYY-MM-DD'), weather: '多云', temperature: '20~31°C', wind: '微风', visibility: 10.0 },
].map(w => ({ ...w, riskLevel: getRiskLevel(calculateWeatherRisk(w)) }))

let restrictionData = [
  { province: '江苏省', city: '南京', road: 'G42沪蓉高速南京段', startTime: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm'), endTime: dayjs().add(8, 'hour').format('YYYY-MM-DD HH:mm'), reason: '道路施工' },
  { province: '浙江省', city: '杭州', road: 'G60沪昆高速杭州段', startTime: dayjs().add(4, 'hour').format('YYYY-MM-DD HH:mm'), endTime: dayjs().add(10, 'hour').format('YYYY-MM-DD HH:mm'), reason: '大型活动交通管制' },
  { province: '北京市', city: '北京', road: 'G45大广高速北京段', startTime: dayjs().add(1, 'hour').format('YYYY-MM-DD HH:mm'), endTime: dayjs().add(6, 'hour').format('YYYY-MM-DD HH:mm'), reason: '道路养护' },
]

setInterval(() => {
  vehicles = vehicles.map(v => updateVehicleRealtime(v))

  const activeWarningVehicleIds = new Set(
    warnings
      .filter(w => w.level !== 'resolved')
      .map(w => w.vehicleId),
  )
  const newWarnings = detectNewWarnings(vehicles, warnings, activeWarningVehicleIds)
  if (newWarnings.length > 0) {
    warnings = [...warnings, ...newWarnings]
    console.log(`[${dayjs().format('HH:mm:ss')}] 检测到 ${newWarnings.length} 条新预警`)
  }

  warnings = warnings.map(w => {
    if (w.level === 'level1') {
      const minutes = dayjs().diff(dayjs(w.createdAt), 'minute')
      if (minutes >= 15 && w.escalationCount === 0) {
        console.log(`[${dayjs().format('HH:mm:ss')}] 预警 ${w.id} 升级为二级`)
        return {
          ...w,
          level: 'level2',
          escalationCount: 1,
          approvalStatus: 'pending',
          approvals: [
            { level: 1, role: '安全主管', approver: '', status: 'pending' },
            { level: 2, role: '运输经理', approver: '', status: 'pending' },
            { level: 3, role: '企业法人', approver: '', status: 'pending' },
          ],
        }
      }
    }
    return w
  })

  console.log(`[${dayjs().format('HH:mm:ss')}] 实时数据已更新，在运车辆: ${vehicles.filter(v => v.status === 'running').length}`)
}, 5000)

const filterByRole = (data, user) => {
  if (user.role === 'provincial') return data
  if (user.role === 'municipal') {
    const city = user.city || user.region
    return data.filter(v => v.city === city || v.province?.includes(city))
  }
  if (user.role === 'enterprise') {
    return data.filter(v => v.company === user.company)
  }
  return data
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: dayjs().format('YYYY-MM-DD HH:mm:ss') })
})

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }
  const token = generateToken(user)
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      region: user.region,
      city: user.city,
      company: user.company,
    },
  })
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user })
})

app.get('/api/vehicles', authMiddleware, (req, res) => {
  const filtered = filterByRole(vehicles, req.user)
  res.json({
    total: filtered.length,
    items: filtered,
    summary: {
      total: filtered.length,
      running: filtered.filter(v => v.status === 'running').length,
      stopped: filtered.filter(v => v.status === 'stopped').length,
      warning: filtered.filter(v => v.status === 'warning').length,
      danger: filtered.filter(v => v.status === 'danger').length,
      offline: filtered.filter(v => v.status === 'offline').length,
    },
  })
})

app.get('/api/vehicles/:id', authMiddleware, (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id)
  if (!vehicle) return res.status(404).json({ error: '车辆不存在' })

  const trackPoints = []
  let lat = vehicle.currentLat
  let lng = vehicle.currentLng
  for (let i = 6 * 24; i >= 0; i -= 4) {
    lat += (Math.random() - 0.5) * 0.6
    lng += (Math.random() - 0.5) * 0.6
    trackPoints.push({
      time: dayjs().subtract(i, 'hour').format('YYYY-MM-DD HH:mm'),
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      speed: Number(Math.max(0, vehicle.currentSpeed + (Math.random() - 0.5) * 40).toFixed(1)),
      location: `${vehicle.city}市附近`,
    })
  }

  const tankParams = []
  for (let i = 6 * 24; i >= 0; i -= 2) {
    tankParams.push({
      time: dayjs().subtract(i, 'hour').format('YYYY-MM-DD HH:mm'),
      temperature: Number((vehicle.tankTemperature + (Math.random() - 0.5) * 8).toFixed(1)),
      pressure: Number((vehicle.tankPressure + (Math.random() - 0.5) * 0.3).toFixed(2)),
      level: Number(Math.max(20, Math.min(100, vehicle.tankLevel + (Math.random() - 0.5) * 5)).toFixed(1)),
    })
  }

  const vehicleViolations = warnings
    .filter(w => w.vehicleId === vehicle.id)
    .map(w => ({
      id: w.id,
      vehicleId: w.vehicleId,
      plateNumber: w.plateNumber,
      type: w.type,
      description: w.message,
      time: w.createdAt,
      location: vehicle.currentLocation,
      value: w.value,
      threshold: w.threshold,
      handled: w.level === 'resolved',
    }))

  res.json({
    vehicle,
    trackPoints,
    tankParams,
    violations: vehicleViolations,
  })
})

app.get('/api/warnings', authMiddleware, (req, res) => {
  const filtered = filterByRole(warnings, req.user)
  res.json({
    total: filtered.length,
    level1: filtered.filter(w => w.level === 'level1').length,
    level2: filtered.filter(w => w.level === 'level2').length,
    resolved: filtered.filter(w => w.level === 'resolved').length,
    items: filtered,
  })
})

app.post('/api/warnings/:id/respond', authMiddleware, (req, res) => {
  const w = warnings.find(x => x.id === req.params.id)
  if (!w) return res.status(404).json({ error: '预警不存在' })
  w.level = 'resolved'
  w.respondedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  w.resolvedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  res.json({ success: true, warning: w })
})

app.post('/api/warnings/:id/escalate', authMiddleware, (req, res) => {
  const w = warnings.find(x => x.id === req.params.id)
  if (!w) return res.status(404).json({ error: '预警不存在' })
  w.level = 'level2'
  w.escalationCount = (w.escalationCount || 0) + 1
  w.approvalStatus = 'pending'
  w.approvals = [
    { level: 1, role: '安全主管', approver: '', status: 'pending' },
    { level: 2, role: '运输经理', approver: '', status: 'pending' },
    { level: 3, role: '企业法人', approver: '', status: 'pending' },
  ]
  res.json({ success: true, warning: w })
})

app.post('/api/warnings/:id/approve', authMiddleware, (req, res) => {
  const { level, status, comment } = req.body
  const w = warnings.find(x => x.id === req.params.id)
  if (!w) return res.status(404).json({ error: '预警不存在' })
  if (!w.approvals || w.approvals.length === 0) {
    return res.status(400).json({ error: '预警未进入审批流程' })
  }
  const approval = w.approvals[level - 1]
  if (!approval) return res.status(400).json({ error: '审批级别无效' })
  approval.approver = req.user.name
  approval.status = status
  approval.comment = comment
  approval.time = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const allApproved = w.approvals.every(a => a.status === 'approved')
  if (allApproved) {
    w.approvalStatus = 'approved'
    w.interventionEnabled = true
  } else if (status === 'rejected') {
    w.approvalStatus = 'rejected'
  }

  res.json({ success: true, warning: w })
})

app.post('/api/warnings/:id/intervene', authMiddleware, (req, res) => {
  const w = warnings.find(x => x.id === req.params.id)
  if (!w) return res.status(404).json({ error: '预警不存在' })
  if (!w.interventionEnabled) {
    return res.status(403).json({ error: '未完成三级审批，无法执行远程干预' })
  }
  const vehicle = vehicles.find(v => v.id === w.vehicleId)
  if (vehicle) {
    vehicle.currentSpeed = 0
    vehicle.status = 'stopped'
  }
  w.level = 'resolved'
  w.resolvedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  res.json({ success: true, message: '远程干预指令已下发，车辆已限速停车', vehicle })
})

app.post('/api/upload/weather', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请上传文件' })
  const parsed = parseWeatherExcel(req.file.buffer)
  const enriched = parsed.map(w => ({
    ...w,
    riskLevel: getRiskLevel(calculateWeatherRisk(w)),
  }))
  if (enriched.length > 0) {
    weatherData = enriched
  }
  res.json({
    success: true,
    count: enriched.length,
    data: weatherData,
  })
})

app.post('/api/upload/restriction', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请上传文件' })
  const parsed = parseRestrictionExcel(req.file.buffer)
  if (parsed.length > 0) {
    restrictionData = parsed
  }
  res.json({
    success: true,
    count: parsed.length,
    data: restrictionData,
  })
})

app.get('/api/weather', authMiddleware, (req, res) => {
  res.json({ data: weatherData })
})

app.get('/api/restrictions', authMiddleware, (req, res) => {
  res.json({ data: restrictionData })
})

app.get('/api/risk/prediction', authMiddleware, (req, res) => {
  const hourData = calculate24HourRisk(weatherData, restrictionData)
  const recommendations = generateRouteRecommendations(restrictionData, weatherData)
  const highRiskRoutes = generateHighRiskRoutes(restrictionData, weatherData)
  res.json({
    hourData,
    recommendations,
    highRiskRoutes,
    highRiskPeriods: hourData.filter(h => h.riskScore >= 60).map(h => h.hour),
    mediumRiskPeriods: hourData.filter(h => h.riskScore >= 35 && h.riskScore < 60).map(h => h.hour),
    lowRiskPeriods: hourData.filter(h => h.riskScore < 35).map(h => h.hour),
  })
})

app.get('/api/dashboard/summary', authMiddleware, (req, res) => {
  const filtered = filterByRole(vehicles, req.user)
  const filteredWarnings = filterByRole(warnings, req.user)
  const provinceHeat = generateProvinceHeat(weatherData, filtered)
  const highRiskRoutes = generateHighRiskRoutes(restrictionData, weatherData).slice(0, 8)

  const today = dayjs().format('YYYY-MM-DD')
  const todayWarnings = filteredWarnings.filter(w => w.createdAt.startsWith(today))
  const avgCompliance = filtered.length > 0
    ? Number((filtered.reduce((s, v) => s + v.tankComplianceRate, 0) / filtered.length).toFixed(1))
    : 0

  res.json({
    totalVehicles: filtered.length,
    runningVehicles: filtered.filter(v => v.status === 'running').length,
    warningVehicles: filtered.filter(v => v.status === 'warning' || v.status === 'danger').length,
    todayWarningCount: todayWarnings.length,
    avgTankComplianceRate: avgCompliance,
    tankComplianceRateChange: 0.5,
    provinceHeat,
    highRiskRoutes,
    recentWarnings: [...filteredWarnings]
      .filter(w => w.level !== 'resolved')
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
      .slice(0, 5),
    statusDistribution: {
      running: filtered.filter(v => v.status === 'running').length,
      stopped: filtered.filter(v => v.status === 'stopped').length,
      warning: filtered.filter(v => v.status === 'warning').length,
      danger: filtered.filter(v => v.status === 'danger').length,
      offline: filtered.filter(v => v.status === 'offline').length,
    },
    violationTrend: [28, 35, 22, 30, 18, 25, 16],
    warningTrend: [58, 72, 56, 65, 48, 60, 42],
    trendLabels: Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD')),
  })
})

app.get('/api/report/weekly', authMiddleware, (req, res) => {
  const filtered = filterByRole(vehicles, req.user)
  const filteredWarnings = filterByRole(warnings, req.user)

  const violationsByType = {
    overspeed: filteredWarnings.filter(w => w.type === 'overspeed').length,
    fatigue: filteredWarnings.filter(w => w.type === 'fatigue').length,
    temperature: filteredWarnings.filter(w => w.type === 'temperature').length,
    pressure: filteredWarnings.filter(w => w.type === 'pressure').length,
    tank_leak: filteredWarnings.filter(w => w.type === 'tank_leak').length,
  }

  const topViolations = Object.entries(violationsByType)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }))

  const companyViolations = {}
  filteredWarnings.forEach(w => {
    companyViolations[w.company] = (companyViolations[w.company] || 0) + 1
  })
  const highRiskCompanies = Object.entries(companyViolations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([company, violations]) => ({
      company,
      violations,
      riskLevel: violations > 20 ? 'high' : violations > 10 ? 'medium' : 'low',
    }))

  const totalViolations = filteredWarnings.length
  const violationRate = filtered.length > 0 ? Number(((totalViolations / filtered.length) * 100).toFixed(2)) : 0
  const avgCompliance = filtered.length > 0
    ? Number((filtered.reduce((s, v) => s + v.tankComplianceRate, 0) / filtered.length).toFixed(1))
    : 0

  res.json({
    weekNumber: dayjs().isoWeek(),
    year: dayjs().year(),
    startDate: dayjs().startOf('week').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('week').format('YYYY-MM-DD'),
    totalVehicles: filtered.length,
    totalViolations,
    violationRate,
    violationRateWoW: -8.3,
    totalAccidents: Math.max(0, Math.round(totalViolations * 0.02)),
    accidentRate: 0.06,
    accidentRateWoW: -50.0,
    avgTankComplianceRate: avgCompliance,
    avgTankComplianceRateWoW: 0.5,
    topViolations,
    highRiskCompanies,
    trainingRecommendations: [
      '组织高温天气罐体安全操作专项培训，参训率需达100%',
      '开展疲劳驾驶危害警示教育，重点关注夜间和长途运输司机',
      '强化超速行驶危害培训，结合典型案例分析',
      '更新应急处置预案并组织演练，覆盖罐体泄漏、温度异常等场景',
    ],
    rectificationPlans: highRiskCompanies.slice(0, 2).map((c, idx) => ({
      item: `${c.company}需在7日内完成${idx === 0 ? '车辆监控设备全面排查' : '安全员配置增加'}`,
      priority: c.riskLevel,
      deadline: dayjs().add(idx === 0 ? 7 : 14, 'day').format('YYYY-MM-DD'),
    })).concat([
      { item: '全省范围开展夜间运输安全专项检查', priority: 'medium', deadline: dayjs().add(30, 'day').format('YYYY-MM-DD') },
      { item: '更新罐体传感器校准规范', priority: 'low', deadline: dayjs().add(45, 'day').format('YYYY-MM-DD') },
    ]),
  })
})

app.listen(PORT, () => {
  console.log(`🚀 危化品运输监测平台后端服务已启动: http://localhost:${PORT}`)
  console.log(`   测试账号:`)
  console.log(`   省级: admin_province / 123456`)
  console.log(`   市级: admin_city / 123456`)
  console.log(`   企业: admin_company / 123456`)
  console.log(`   实时数据每 5 秒自动刷新`)
})
