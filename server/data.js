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

const random = (min, max) => Math.random() * (max - min) + min
const randomInt = (min, max) => Math.floor(random(min, max + 1))
const pick = (arr) => arr[randomInt(0, arr.length - 1)]

const generatePlateNumber = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const provinceShort = ['京', '津', '沪', '渝', '冀', '晋', '辽', '吉', '黑', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '桂', '琼', '川', '贵', '云', '陕', '甘', '青', '蒙', '宁', '新']
  return `${pick(provinceShort)}${pick(letters.split(''))}${randomInt(10000, 99999)}`
}

export const generateVehicles = (count = 80) => {
  return Array.from({ length: count }, (_, i) => {
    const cargo = pick(cargoTypes)
    const province = pick(provinces)
    const city = pick(cities)
    const departure = pick(cities)
    const destination = pick(cities.filter(c => c !== departure))
    const continuousDriving = random(0.5, 6.5)
    const speed = random(40, 120)
    const speedLimit = 80
    const tankTemp = random(18, 48)
    const status = (() => {
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
      currentLat: Number(random(20, 50).toFixed(4)),
      currentLng: Number(random(80, 135).toFixed(4)),
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
      lastUpdated: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
  })
}

export const generateInitialWarnings = (vehicles) => {
  const warnings = []
  let wid = 1

  const temperatureVehicles = vehicles.filter(v => v.tankTemperature > v.tankTempThreshold).slice(0, 2)
  temperatureVehicles.forEach(v => {
    warnings.push({
      id: `W${String(wid++).padStart(3, '0')}`,
      vehicleId: v.id,
      plateNumber: v.plateNumber,
      driver: v.driver,
      company: v.company,
      type: 'temperature',
      level: 'level1',
      message: `罐体温度超标：当前${v.tankTemperature}°C，阈值${v.tankTempThreshold}°C`,
      value: v.tankTemperature,
      threshold: v.tankTempThreshold,
      createdAt: dayjs().subtract(randomInt(1, 10), 'minute').format('YYYY-MM-DD HH:mm:ss'),
      escalationCount: 0,
      approvals: [],
      interventionEnabled: false,
    })
  })

  const fatigueVehicles = vehicles.filter(v => v.continuousDrivingHours > 4).slice(0, 2)
  fatigueVehicles.forEach(v => {
    warnings.push({
      id: `W${String(wid++).padStart(3, '0')}`,
      vehicleId: v.id,
      plateNumber: v.plateNumber,
      driver: v.driver,
      company: v.company,
      type: 'fatigue',
      level: 'level1',
      message: `连续驾驶时长超标：已驾驶${v.continuousDrivingHours}小时，阈值4小时`,
      value: v.continuousDrivingHours,
      threshold: 4,
      createdAt: dayjs().subtract(randomInt(1, 10), 'minute').format('YYYY-MM-DD HH:mm:ss'),
      escalationCount: 0,
      approvals: [],
      interventionEnabled: false,
    })
  })

  const overspeedVehicles = vehicles.filter(v => v.currentSpeed > v.speedLimit).slice(0, 1)
  overspeedVehicles.forEach(v => {
    warnings.push({
      id: `W${String(wid++).padStart(3, '0')}`,
      vehicleId: v.id,
      plateNumber: v.plateNumber,
      driver: v.driver,
      company: v.company,
      type: 'overspeed',
      level: 'level1',
      message: `超速行驶：当前${v.currentSpeed}km/h，限速${v.speedLimit}km/h`,
      value: v.currentSpeed,
      threshold: v.speedLimit,
      createdAt: dayjs().subtract(randomInt(1, 5), 'minute').format('YYYY-MM-DD HH:mm:ss'),
      escalationCount: 0,
      approvals: [],
      interventionEnabled: false,
    })
  })

  if (warnings.length > 0) {
    warnings[0].level = 'level2'
    warnings[0].escalationCount = 1
    warnings[0].createdAt = dayjs().subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss')
    warnings[0].approvalStatus = 'pending'
    warnings[0].approvals = [
      { level: 1, role: '安全主管', approver: '', status: 'pending' },
      { level: 2, role: '运输经理', approver: '', status: 'pending' },
      { level: 3, role: '企业法人', approver: '', status: 'pending' },
    ]
  }

  return warnings
}

export const updateVehicleRealtime = (v) => {
  const latDrift = random(-0.05, 0.05)
  const lngDrift = random(-0.05, 0.05)
  const speedDelta = random(-8, 8)
  const tempDelta = random(-1.2, 1.2)
  const pressureDelta = random(-0.08, 0.08)
  const hourDelta = random(0, 0.1)

  let newSpeed = Number((v.currentSpeed + speedDelta).toFixed(1))
  if (newSpeed < 0) newSpeed = 0
  if (newSpeed > 130) newSpeed = 130

  let newTemp = Number((v.tankTemperature + tempDelta).toFixed(1))
  if (newTemp < 15) newTemp = 15
  if (newTemp > 55) newTemp = 55

  let newPressure = Number((v.tankPressure + pressureDelta).toFixed(2))
  if (newPressure < 0.5) newPressure = 0.5
  if (newPressure > 3.0) newPressure = 3.0

  let newDriving = Number((v.continuousDrivingHours + hourDelta).toFixed(1))
  if (newSpeed < 5) {
    newDriving = Math.max(0, newDriving - 0.2)
  }
  if (newDriving > 8) newDriving = 8

  const speedOverRatio = newSpeed > v.speedLimit
    ? Number(Math.min(35, v.speedOverRatio + random(0.3, 1)).toFixed(1))
    : Number(Math.max(0, v.speedOverRatio - random(0, 0.5)).toFixed(1))

  const fatigueHours = newDriving > 4
    ? Number(Math.min(15, v.fatigueHours + hourDelta).toFixed(1))
    : v.fatigueHours

  const tankComplianceRate = newTemp < v.tankTempThreshold
    ? Number(Math.min(99.9, v.tankComplianceRate + random(0, 0.2)).toFixed(1))
    : Number(Math.max(70, v.tankComplianceRate - random(0.1, 0.5)).toFixed(1))

  let status = 'running'
  if (newTemp > v.tankTempThreshold + 5 || newDriving > 5) status = 'danger'
  else if (newTemp > v.tankTempThreshold || newDriving > 4 || newSpeed > v.speedLimit * 1.1) status = 'warning'
  else if (newSpeed < 5) status = 'stopped'

  return {
    ...v,
    currentLat: Number((v.currentLat + latDrift).toFixed(4)),
    currentLng: Number((v.currentLng + lngDrift).toFixed(4)),
    currentSpeed: newSpeed,
    continuousDrivingHours: newDriving,
    tankTemperature: newTemp,
    tankPressure: newPressure,
    speedOverRatio,
    fatigueHours,
    tankComplianceRate,
    status,
    lastUpdated: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  }
}

export const detectNewWarnings = (vehicles, existingWarnings, activeWarningVehicleIds) => {
  const newWarnings = []
  let nextIdNum = existingWarnings.length + 10

  vehicles.forEach(v => {
    if (activeWarningVehicleIds.has(v.id)) return

    if (v.tankTemperature > v.tankTempThreshold) {
      newWarnings.push({
        id: `W${String(nextIdNum++).padStart(3, '0')}`,
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        driver: v.driver,
        company: v.company,
        type: 'temperature',
        level: 'level1',
        message: `罐体温度超标：当前${v.tankTemperature}°C，阈值${v.tankTempThreshold}°C`,
        value: v.tankTemperature,
        threshold: v.tankTempThreshold,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        escalationCount: 0,
        approvals: [],
        interventionEnabled: false,
      })
    } else if (v.continuousDrivingHours > 4) {
      newWarnings.push({
        id: `W${String(nextIdNum++).padStart(3, '0')}`,
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        driver: v.driver,
        company: v.company,
        type: 'fatigue',
        level: 'level1',
        message: `连续驾驶时长超标：已驾驶${v.continuousDrivingHours}小时，阈值4小时`,
        value: v.continuousDrivingHours,
        threshold: 4,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        escalationCount: 0,
        approvals: [],
        interventionEnabled: false,
      })
    } else if (v.currentSpeed > v.speedLimit * 1.2) {
      newWarnings.push({
        id: `W${String(nextIdNum++).padStart(3, '0')}`,
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        driver: v.driver,
        company: v.company,
        type: 'overspeed',
        level: 'level1',
        message: `超速行驶：当前${v.currentSpeed}km/h，限速${v.speedLimit}km/h`,
        value: v.currentSpeed,
        threshold: v.speedLimit,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        escalationCount: 0,
        approvals: [],
        interventionEnabled: false,
      })
    }
  })

  return newWarnings
}

export { provinces, cities, companies, cargoTypes, drivers }
