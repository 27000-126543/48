import dayjs from 'dayjs'

export const calculateWeatherRisk = (weatherItem) => {
  let risk = 10

  if (weatherItem.visibility !== undefined) {
    if (weatherItem.visibility < 0.5) risk += 35
    else if (weatherItem.visibility < 1) risk += 25
    else if (weatherItem.visibility < 2) risk += 15
    else if (weatherItem.visibility < 3) risk += 8
  }

  if (weatherItem.weather) {
    const w = String(weatherItem.weather)
    if (w.includes('暴') || w.includes('雷') || w.includes('雹')) risk += 30
    else if (w.includes('大') && (w.includes('雨') || w.includes('雪'))) risk += 22
    else if (w.includes('中') && (w.includes('雨') || w.includes('雪'))) risk += 15
    else if (w.includes('小') && (w.includes('雨') || w.includes('雪'))) risk += 8
    else if (w.includes('雾') || w.includes('霾')) risk += 20
  }

  if (weatherItem.wind) {
    const w = String(weatherItem.wind)
    if (w.includes('8') || w.includes('9') || w.includes('10') || w.includes('暴')) risk += 25
    else if (w.includes('6') || w.includes('7')) risk += 15
    else if (w.includes('4') || w.includes('5')) risk += 8
  }

  if (weatherItem.temperature) {
    const m = String(weatherItem.temperature).match(/(\d+)\s*[~～-]\s*(\d+)/)
    if (m) {
      const maxT = Math.max(parseInt(m[1]), parseInt(m[2]))
      if (maxT >= 38) risk += 15
      else if (maxT >= 35) risk += 10
      else if (maxT >= 32) risk += 5
    }
  }

  return Math.min(100, risk)
}

export const getRiskLevel = (score) => {
  if (score >= 60) return 'high'
  if (score >= 35) return 'medium'
  return 'low'
}

export const calculate24HourRisk = (weatherList = [], restrictions = []) => {
  const hours = []
  for (let i = 0; i < 24; i++) {
    const baseRisk = 20
    let hourRisk = baseRisk

    const peakHour = (i >= 7 && i <= 9) || (i >= 17 && i <= 19)
    if (peakHour) hourRisk += 20

    const nightHour = (i >= 0 && i <= 5)
    if (nightHour) hourRisk += 8

    weatherList.forEach(w => {
      hourRisk += calculateWeatherRisk(w) * 0.35
    })

    const now = dayjs().hour(i)
    const activeRestrictions = restrictions.filter(r => {
      const start = dayjs(r.startTime)
      const end = dayjs(r.endTime)
      return now.isAfter(start) && now.isBefore(end)
    })
    hourRisk += activeRestrictions.length * 15

    const vehicleCount = Math.round(
      200 +
      800 * Math.exp(-Math.pow((i - 8) / 4, 2)) +
      1000 * Math.exp(-Math.pow((i - 18) / 3, 2)) +
      (i >= 1 && i <= 5 ? -100 : 0)
    )

    hours.push({
      hour: `${String(i).padStart(2, '0')}:00`,
      riskScore: Math.min(100, Math.round(hourRisk)),
      vehicleCount: Math.max(150, vehicleCount),
    })
  }
  return hours
}

export const generateRouteRecommendations = (restrictions = [], weatherList = []) => {
  if (restrictions.length === 0) return []

  return restrictions.map((r, idx) => {
    const extraDistance = Math.round(Math.random() * 40 + 15)
    const extraTime = Math.round(extraDistance * 0.7 + 10)

    const weatherRisk = weatherList
      .filter(w => (r.province && w.province && w.province.includes(r.province)) || (r.city && w.city && w.city.includes(r.city)))
      .reduce((sum, w) => sum + calculateWeatherRisk(w), 0)

    const originalRisk = Math.min(100, 60 + restrictions.length * 5 + weatherRisk * 0.4)
    const alternateRisk = Math.max(20, originalRisk - Math.round(30 + Math.random() * 20))

    return {
      id: `REC${String(idx + 1).padStart(3, '0')}`,
      originalRoute: `${r.city || r.province} - ${r.road || '受限路段'}`,
      alternateRoute: `${r.city || r.province} - 推荐绕行路线 (避开施工/管制)`,
      originalRisk: Math.round(originalRisk),
      alternateRisk: Math.round(alternateRisk),
      extraDistance,
      extraTime,
      reason: [
        r.reason ? `${r.road}${r.reason}` : '原路线交通管制',
        r.startTime && r.endTime ? `，管制时间：${dayjs(r.startTime).format('MM-DD HH:mm')}~${dayjs(r.endTime).format('HH:mm')}` : '',
        weatherRisk > 20 ? '，叠加恶劣天气风险' : '',
      ].join(''),
    }
  })
}

export const generateHighRiskRoutes = (restrictions = [], weatherList = []) => {
  const baseRoutes = [
    { name: '京沪高速-山东段', startCity: '北京', endCity: '上海', provinces: ['北京市', '天津市', '河北省', '山东省', '江苏省', '上海市'], distance: 1262, avgSpeed: 92 },
    { name: '京港澳高速-河南段', startCity: '北京', endCity: '广州', provinces: ['北京市', '河北省', '河南省', '湖北省', '湖南省', '广东省'], distance: 2120, avgSpeed: 88 },
    { name: '连霍高速-陕西段', startCity: '连云港', endCity: '霍尔果斯', provinces: ['江苏省', '安徽省', '河南省', '陕西省', '甘肃省', '新疆维吾尔自治区'], distance: 4395, avgSpeed: 85 },
    { name: '沪昆高速-江西段', startCity: '上海', endCity: '昆明', provinces: ['上海市', '浙江省', '江西省', '湖南省', '贵州省', '云南省'], distance: 2730, avgSpeed: 82 },
    { name: '大广高速-湖北段', startCity: '大庆', endCity: '广州', provinces: ['黑龙江省', '吉林省', '辽宁省', '河北省', '河南省', '湖北省', '江西省', '广东省'], distance: 3550, avgSpeed: 86 },
    { name: '沈海高速-浙江段', startCity: '沈阳', endCity: '海口', provinces: ['辽宁省', '山东省', '江苏省', '上海市', '浙江省', '福建省', '广东省', '海南省'], distance: 3710, avgSpeed: 89 },
    { name: '沪蓉高速-四川段', startCity: '上海', endCity: '成都', provinces: ['上海市', '江苏省', '安徽省', '湖北省', '重庆市', '四川省'], distance: 1966, avgSpeed: 78 },
    { name: '青银高速-山西段', startCity: '青岛', endCity: '银川', provinces: ['山东省', '河北省', '山西省', '陕西省', '宁夏回族自治区'], distance: 1610, avgSpeed: 80 },
  ]

  return baseRoutes.map(route => {
    let risk = 30
    let warningCount = 8
    let vehicleCount = 50 + Math.round(Math.random() * 100)

    const matchedWeather = weatherList.filter(w => route.provinces.some(p => p.includes(w.province || '') || p.includes(w.city || '')))
    matchedWeather.forEach(w => {
      risk += calculateWeatherRisk(w) * 0.25
      warningCount += Math.round(calculateWeatherRisk(w) / 8)
    })

    const matchedRestrictions = restrictions.filter(r =>
      route.provinces.some(p => (r.province && p.includes(r.province)) || (r.city && p.includes(r.city))) ||
      (r.road && route.name.includes(r.road))
    )
    risk += matchedRestrictions.length * 8
    warningCount += matchedRestrictions.length * 3

    risk = Math.min(100, Math.round(risk + Math.random() * 15))
    warningCount = warningCount + Math.round(Math.random() * 15)
    vehicleCount = vehicleCount + Math.round(Math.random() * 30)

    return {
      id: `R${String(route.name.charCodeAt(0)).slice(-3)}`,
      ...route,
      riskScore: risk,
      riskLevel: getRiskLevel(risk),
      vehicleCount,
      warningCount,
    }
  }).sort((a, b) => b.riskScore - a.riskScore)
}

export const generateProvinceHeat = (weatherList = [], vehicles = []) => {
  const provinceNames = [
    '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省',
    '黑龙江省', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
    '湖北省', '湖南省', '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省',
    '甘肃省', '青海省', '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
  ]

  return provinceNames.map(name => {
    const base = 30 + Math.round(Math.random() * 200)
    const matchedWeather = weatherList.filter(w => w.province && name.includes(w.province))
    const weatherBonus = matchedWeather.reduce((s, w) => s + calculateWeatherRisk(w), 0) * 0.5
    const value = Math.round(base + weatherBonus)
    const vehicleCount = vehicles.filter(v => v.province === name).length || Math.round(50 + Math.random() * 400)
    const warningCount = Math.round(weatherBonus / 5 + Math.random() * 20)

    return { name, value, vehicleCount, warningCount }
  })
}
