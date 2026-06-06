import type {
  Vehicle,
  Warning,
  ViolationRecord,
  TrackPoint,
  TankParamPoint,
  HighRiskRoute,
  ProvinceHeatData,
  WeeklyReport,
  WeatherData,
  RestrictionData,
  RouteRecommendation,
  User,
} from '@/types'
import dayjs from 'dayjs'

const provinces = [
  '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省',
  '黑龙江省', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
  '湖北省', '湖南省', '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省',
  '甘肃省', '青海省', '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
]

const cities = ['北京', '上海', '广州', '深圳', '天津', '重庆', '成都', '武汉', '西安', '杭州', '南京', '苏州', '青岛', '大连', '宁波', '厦门', '长沙', '郑州', '沈阳', '哈尔滨']

const companies = [
  '华宇危化物流有限公司',
  '国安化工运输集团',
  '中石化运输分公司',
  '中石油天然气运输公司',
  '盛达危险品物流',
  '恒运化工运输',
  '通达危化品物流',
  '鑫源危险化学品运输',
]

const cargoTypes = [
  { name: '液化石油气', type: '易燃易爆' },
  { name: '汽油', type: '易燃易爆' },
  { name: '柴油', type: '易燃易爆' },
  { name: '浓硫酸', type: '强腐蚀性' },
  { name: '液氨', type: '有毒有害' },
  { name: '甲醇', type: '易燃易爆' },
  { name: '苯', type: '有毒有害' },
  { name: '环氧乙烷', type: '易燃易爆有毒' },
]

const drivers = ['张建国', '李明辉', '王志强', '刘伟东', '陈海波', '杨金宝', '赵大勇', '孙涛', '周军', '吴德胜', '郑文博', '钱飞']

const random = (min: number, max: number) => Math.random() * (max - min) + min
const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1))
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)]
const pickMany = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < n && copy.length > 0; i++) {
    result.push(copy.splice(randomInt(0, copy.length - 1), 1)[0])
  }
  return result
}

const generatePlateNumber = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const provinceShort = ['京', '津', '沪', '渝', '冀', '晋', '辽', '吉', '黑', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '桂', '琼', '川', '贵', '云', '陕', '甘', '青', '蒙', '宁', '新']
  return `${pick(provinceShort)}${pick(letters.split(''))}${randomInt(10000, 99999)}`
}

export const mockUsers: User[] = [
  { id: '1', name: '监管员-省级', role: 'provincial', region: '全国', avatar: '' },
  { id: '2', name: '监管员-市级', role: 'municipal', region: '上海市', avatar: '' },
  { id: '3', name: '企业管理员', role: 'enterprise', company: '华宇危化物流有限公司', avatar: '' },
]

export const mockVehicles: Vehicle[] = Array.from({ length: 80 }, (_, i) => {
  const cargo = pick(cargoTypes)
  const province = pick(provinces)
  const city = pick(cities)
  const departure = pick(cities)
  const destination = pick(cities.filter(c => c !== departure))
  const continuousDriving = random(0.5, 6.5)
  const speed = random(40, 120)
  const speedLimit = 80
  const tankTemp = random(18, 48)
  const status: Vehicle['status'] = (() => {
    if (tankTemp > 45 || continuousDriving > 5) return 'danger'
    if (tankTemp > 40 || continuousDriving > 4 || speed > speedLimit * 1.1) return 'warning'
    if (speed < 5) return 'stopped'
    return 'running'
  })()

  return {
    id: `V${String(i + 1).padStart(4, '0')}`,
    plateNumber: generatePlateNumber(),
    driver: pick(drivers),
    driverPhone: `1${randomInt(3, 9)}${String(randomInt(100000000, 999999999))}`,
    company: pick(companies),
    province,
    city,
    cargo: cargo.name,
    cargoType: cargo.type,
    status,
    currentSpeed: Number(speed.toFixed(1)),
    speedLimit,
    continuousDrivingHours: Number(continuousDriving.toFixed(1)),
    restHoursToday: Number(random(0, 8).toFixed(1)),
    currentLat: random(20, 50),
    currentLng: random(80, 135),
    currentLocation: `${city}市${pick(['东', '西', '南', '北'])}郊高速路段`,
    route: `${departure} → ${destination}`,
    departure,
    destination,
    departureTime: dayjs().subtract(randomInt(1, 480), 'minute').format('YYYY-MM-DD HH:mm'),
    estimatedArrival: dayjs().add(randomInt(60, 720), 'minute').format('YYYY-MM-DD HH:mm'),
    tankTemperature: Number(tankTemp.toFixed(1)),
    tankPressure: Number(random(0.8, 2.5).toFixed(2)),
    tankLevel: Number(random(30, 95).toFixed(1)),
    tankTempThreshold: 40,
    speedOverRatio: Number(random(0, 25).toFixed(1)),
    fatigueHours: Number(random(0, 12).toFixed(1)),
    tankComplianceRate: Number(random(85, 99.8).toFixed(1)),
    violationsThisMonth: randomInt(0, 8),
  }
})

export const mockWarnings: Warning[] = [
  {
    id: 'W001',
    vehicleId: 'V0001',
    plateNumber: '京A88234',
    driver: '张建国',
    company: '华宇危化物流有限公司',
    type: 'temperature',
    level: 'level1',
    message: '罐体温度超标：当前47.2°C，阈值40°C',
    value: 47.2,
    threshold: 40,
    createdAt: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    escalationCount: 0,
    approvals: [],
    interventionEnabled: false,
  },
  {
    id: 'W002',
    vehicleId: 'V0002',
    plateNumber: '沪B55678',
    driver: '李明辉',
    company: '国安化工运输集团',
    type: 'fatigue',
    level: 'level1',
    message: '连续驾驶时长超标：已驾驶4.8小时，阈值4小时',
    value: 4.8,
    threshold: 4,
    createdAt: dayjs().subtract(8, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    escalationCount: 0,
    approvals: [],
    interventionEnabled: false,
  },
  {
    id: 'W003',
    vehicleId: 'V0003',
    plateNumber: '粤C12345',
    driver: '王志强',
    company: '中石化运输分公司',
    type: 'temperature',
    level: 'level2',
    message: '罐体温度持续超标：当前46.5°C，已超过15分钟未响应',
    value: 46.5,
    threshold: 40,
    createdAt: dayjs().subtract(25, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    escalationCount: 1,
    approvalStatus: 'pending',
    approvals: [
      { level: 1, role: '安全主管', approver: '', status: 'pending' },
      { level: 2, role: '运输经理', approver: '', status: 'pending' },
      { level: 3, role: '企业法人', approver: '', status: 'pending' },
    ],
    interventionEnabled: false,
  },
  {
    id: 'W004',
    vehicleId: 'V0004',
    plateNumber: '苏D67890',
    driver: '刘伟东',
    company: '中石油天然气运输公司',
    type: 'overspeed',
    level: 'level1',
    message: '超速行驶：当前108km/h，限速80km/h',
    value: 108,
    threshold: 80,
    createdAt: dayjs().subtract(3, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    escalationCount: 0,
    approvals: [],
    interventionEnabled: false,
  },
  {
    id: 'W005',
    vehicleId: 'V0005',
    plateNumber: '浙E24680',
    driver: '陈海波',
    company: '盛达危险品物流',
    type: 'fatigue',
    level: 'level2',
    message: '疲劳驾驶持续预警：已驾驶5.2小时，超过15分钟未响应',
    value: 5.2,
    threshold: 4,
    createdAt: dayjs().subtract(35, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    escalationCount: 1,
    approvalStatus: 'pending',
    approvals: [
      { level: 1, role: '安全主管', approver: '赵安全', status: 'approved', comment: '情况属实，建议远程干预', time: dayjs().subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss') },
      { level: 2, role: '运输经理', approver: '孙经理', status: 'approved', comment: '同意，安排就近服务区休息', time: dayjs().subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss') },
      { level: 3, role: '企业法人', approver: '', status: 'pending' },
    ],
    interventionEnabled: false,
  },
]

export const mockViolations: ViolationRecord[] = Array.from({ length: 30 }, (_, i) => {
  const types: Warning['type'][] = ['temperature', 'fatigue', 'overspeed', 'pressure']
  const type = pick(types)
  const v = pick(mockVehicles)
  const descs = {
    temperature: '罐体温度超标',
    fatigue: '疲劳驾驶',
    overspeed: '超速行驶',
    pressure: '罐体压力异常',
    tank_leak: '罐体泄漏检测',
  }
  return {
    id: `VR${String(i + 1).padStart(4, '0')}`,
    vehicleId: v.id,
    plateNumber: v.plateNumber,
    type,
    description: descs[type],
    time: dayjs().subtract(randomInt(1, 500), 'minute').format('YYYY-MM-DD HH:mm:ss'),
    location: `${pick(cities)}市境内`,
    handled: Math.random() > 0.3,
  }
})

export const generateTrackPoints = (vehicleId: string): TrackPoint[] => {
  const points: TrackPoint[] = []
  let lat = random(30, 40)
  let lng = random(110, 125)
  for (let i = 6 * 24; i >= 0; i -= 4) {
    lat += random(-0.3, 0.3)
    lng += random(-0.3, 0.3)
    points.push({
      time: dayjs().subtract(i, 'hour').format('YYYY-MM-DD HH:mm'),
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      speed: Number(random(0, 110).toFixed(1)),
      location: `${pick(cities)}市附近`,
    })
  }
  return points
}

export const generateTankParams = (vehicleId: string): TankParamPoint[] => {
  const points: TankParamPoint[] = []
  for (let i = 6 * 24; i >= 0; i -= 2) {
    points.push({
      time: dayjs().subtract(i, 'hour').format('YYYY-MM-DD HH:mm'),
      temperature: Number(random(25, 45).toFixed(1)),
      pressure: Number(random(1.0, 2.0).toFixed(2)),
      level: Number(random(35, 90).toFixed(1)),
    })
  }
  return points
}

export const mockHighRiskRoutes: HighRiskRoute[] = [
  { id: 'R001', name: '京沪高速-山东段', startCity: '北京', endCity: '上海', riskScore: 88, riskLevel: 'high', vehicleCount: 156, warningCount: 42, avgSpeed: 92, distance: 1262 },
  { id: 'R002', name: '京港澳高速-河南段', startCity: '北京', endCity: '广州', riskScore: 82, riskLevel: 'high', vehicleCount: 128, warningCount: 36, avgSpeed: 88, distance: 2120 },
  { id: 'R003', name: '连霍高速-陕西段', startCity: '连云港', endCity: '霍尔果斯', riskScore: 76, riskLevel: 'high', vehicleCount: 98, warningCount: 28, avgSpeed: 85, distance: 4395 },
  { id: 'R004', name: '沪昆高速-江西段', startCity: '上海', endCity: '昆明', riskScore: 72, riskLevel: 'medium', vehicleCount: 87, warningCount: 22, avgSpeed: 82, distance: 2730 },
  { id: 'R005', name: '大广高速-湖北段', startCity: '大庆', endCity: '广州', riskScore: 68, riskLevel: 'medium', vehicleCount: 112, warningCount: 19, avgSpeed: 86, distance: 3550 },
  { id: 'R006', name: '沈海高速-浙江段', startCity: '沈阳', endCity: '海口', riskScore: 65, riskLevel: 'medium', vehicleCount: 145, warningCount: 25, avgSpeed: 89, distance: 3710 },
  { id: 'R007', name: '沪蓉高速-四川段', startCity: '上海', endCity: '成都', riskScore: 60, riskLevel: 'medium', vehicleCount: 76, warningCount: 15, avgSpeed: 78, distance: 1966 },
  { id: 'R008', name: '青银高速-山西段', startCity: '青岛', endCity: '银川', riskScore: 55, riskLevel: 'low', vehicleCount: 58, warningCount: 10, avgSpeed: 80, distance: 1610 },
]

export const mockProvinceHeat: ProvinceHeatData[] = provinces.map(name => ({
  name,
  value: randomInt(20, 500),
  vehicleCount: randomInt(50, 2000),
  warningCount: randomInt(0, 120),
}))

export const mockWeeklyReport: WeeklyReport = {
  weekNumber: 23,
  year: 2026,
  startDate: '2026-06-01',
  endDate: '2026-06-07',
  totalVehicles: 3256,
  totalViolations: 186,
  violationRate: 5.71,
  violationRateWoW: -8.3,
  totalAccidents: 2,
  accidentRate: 0.06,
  accidentRateWoW: -50.0,
  avgTankComplianceRate: 96.8,
  avgTankComplianceRateWoW: 0.5,
  topViolations: [
    { type: 'overspeed', count: 78 },
    { type: 'fatigue', count: 52 },
    { type: 'temperature', count: 34 },
    { type: 'pressure', count: 16 },
    { type: 'tank_leak', count: 6 },
  ],
  highRiskCompanies: [
    { company: '鑫源危险化学品运输', violations: 28, riskLevel: 'high' },
    { company: '恒运化工运输', violations: 22, riskLevel: 'high' },
    { company: '盛达危险品物流', violations: 18, riskLevel: 'medium' },
    { company: '通达危化品物流', violations: 15, riskLevel: 'medium' },
  ],
  trainingRecommendations: [
    '组织高温天气罐体安全操作专项培训，参训率需达100%',
    '开展疲劳驾驶危害警示教育，重点关注夜间和长途运输司机',
    '强化超速行驶危害培训，结合典型案例分析',
    '更新应急处置预案并组织演练，覆盖罐体泄漏、温度异常等场景',
  ],
  rectificationPlans: [
    { item: '鑫源危险化学品运输需在7日内完成车辆监控设备全面排查', priority: 'high', deadline: '2026-06-14' },
    { item: '恒运化工运输需增加安全员配置比例至1:20', priority: 'high', deadline: '2026-06-21' },
    { item: '全省范围开展夜间运输安全专项检查', priority: 'medium', deadline: '2026-06-30' },
    { item: '更新罐体传感器校准规范', priority: 'low', deadline: '2026-07-15' },
  ],
}

export const mockWeather: WeatherData[] = [
  { province: '江苏省', city: '南京', date: dayjs().format('YYYY-MM-DD'), weather: '暴雨', temperature: '22~28°C', wind: '东南风5-6级', visibility: 0.8, riskLevel: 'high' },
  { province: '浙江省', city: '杭州', date: dayjs().format('YYYY-MM-DD'), weather: '大雨', temperature: '23~29°C', wind: '南风4-5级', visibility: 1.2, riskLevel: 'high' },
  { province: '上海市', city: '上海', date: dayjs().format('YYYY-MM-DD'), weather: '中雨', temperature: '24~30°C', wind: '东南风4级', visibility: 2.5, riskLevel: 'medium' },
  { province: '广东省', city: '广州', date: dayjs().format('YYYY-MM-DD'), weather: '雷阵雨', temperature: '26~33°C', wind: '南风3-4级', visibility: 3.0, riskLevel: 'medium' },
  { province: '山东省', city: '济南', date: dayjs().format('YYYY-MM-DD'), weather: '晴', temperature: '18~32°C', wind: '微风', visibility: 15.0, riskLevel: 'low' },
  { province: '河北省', city: '石家庄', date: dayjs().format('YYYY-MM-DD'), weather: '多云', temperature: '20~31°C', wind: '微风', visibility: 10.0, riskLevel: 'low' },
]

export const mockRestrictions: RestrictionData[] = [
  { province: '江苏省', city: '南京', road: 'G42沪蓉高速南京段', startTime: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm'), endTime: dayjs().add(8, 'hour').format('YYYY-MM-DD HH:mm'), reason: '道路施工' },
  { province: '浙江省', city: '杭州', road: 'G60沪昆高速杭州段', startTime: dayjs().add(4, 'hour').format('YYYY-MM-DD HH:mm'), endTime: dayjs().add(10, 'hour').format('YYYY-MM-DD HH:mm'), reason: '大型活动交通管制' },
  { province: '北京市', city: '北京', road: 'G45大广高速北京段', startTime: dayjs().add(1, 'hour').format('YYYY-MM-DD HH:mm'), endTime: dayjs().add(6, 'hour').format('YYYY-MM-DD HH:mm'), reason: '道路养护' },
]

export const mockRouteRecommendations: RouteRecommendation[] = [
  { id: 'REC001', originalRoute: '南京 → 上海 (G42沪蓉高速)', alternateRoute: '南京 → 上海 (G50沪渝高速绕行)', originalRisk: 85, alternateRisk: 42, extraDistance: 35, extraTime: 25, reason: 'G42南京段暴雨，能见度低，且有道路施工' },
  { id: 'REC002', originalRoute: '杭州 → 宁波 (G60沪昆高速)', alternateRoute: '杭州 → 宁波 (G92杭州湾环线)', originalRisk: 78, alternateRisk: 38, extraDistance: 28, extraTime: 20, reason: 'G60杭州段交通管制，建议绕行' },
  { id: 'REC003', originalRoute: '北京 → 天津 (G45大广高速)', alternateRoute: '北京 → 天津 (G2京沪高速)', originalRisk: 70, alternateRisk: 35, extraDistance: 18, extraTime: 12, reason: 'G45北京段道路养护，预计拥堵2小时' },
]
