import XLSX from 'xlsx'

const normalizeKeys = (obj) => {
  const result = {}
  Object.keys(obj).forEach(k => {
    const key = String(k).trim().toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[（(]/g, '')
      .replace(/[）)]/g, '')
    result[key] = obj[k]
  })
  return result
}

export const parseWeatherExcel = (buffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    if (json.length === 0) return []

    const parsed = json.map(row => {
      const r = normalizeKeys(row)

      const province =
        r['省份'] || r['省'] || r['所在省'] || r['province'] ||
        r['省份名称'] || ''

      const city =
        r['城市'] || r['市'] || r['所在市'] || r['city'] ||
        r['城市名称'] || ''

      const weather =
        r['天气'] || r['天气现象'] || r['weather'] ||
        r['天气状况'] || r['天气情况'] || ''

      const temperature =
        r['温度'] || r['气温'] || r['temperature'] ||
        r['最高气温最低气温'] || r['温度范围'] || ''

      const wind =
        r['风力'] || r['风'] || r['wind'] || r['风向风力'] ||
        r['风力风向'] || ''

      let visibility = r['能见度'] || r['visibility'] || r['能见度km'] || null
      if (typeof visibility === 'string') {
        const m = visibility.match(/([\d.]+)/)
        visibility = m ? parseFloat(m[1]) : null
      }

      const date =
        r['日期'] || r['date'] || r['预报日期'] ||
        new Date().toISOString().slice(0, 10)

      return {
        province: String(province).trim(),
        city: String(city).trim(),
        weather: String(weather).trim(),
        temperature: String(temperature).trim(),
        wind: String(wind).trim(),
        visibility: visibility ? Number(visibility) : null,
        date: String(date).trim(),
      }
    })

    return parsed.filter(r => r.province || r.city)
  } catch (error) {
    console.error('解析气象Excel失败:', error)
    return []
  }
}

export const parseRestrictionExcel = (buffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    if (json.length === 0) return []

    const parseDateTime = (val) => {
      if (!val) return ''
      if (val instanceof Date) {
        return val.toISOString().replace('T', ' ').slice(0, 16)
      }
      const s = String(val).trim()
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 16)
      if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(s)) {
        const parts = s.split(/[\/\s]/)
        return `${parts[0]}-${String(parts[1] || '1').padStart(2, '0')}-${String(parts[2] || '1').padStart(2, '0')} ${parts[3] || '00:00'}`
      }
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${s.padEnd(5, '0').slice(0, 5)}`
    }

    const parsed = json.map(row => {
      const r = normalizeKeys(row)

      return {
        province: String(r['省份'] || r['省'] || r['province'] || '').trim(),
        city: String(r['城市'] || r['市'] || r['city'] || '').trim(),
        road: String(r['路段'] || r['道路'] || r['限行路段'] || r['road'] || r['高速公路'] || '').trim(),
        startTime: parseDateTime(r['开始时间'] || r['起始时间'] || r['starttime'] || r['start'] || r['开始']),
        endTime: parseDateTime(r['结束时间'] || r['截止时间'] || r['endtime'] || r['end'] || r['结束']),
        reason: String(r['原因'] || r['限行原因'] || r['reason'] || r['管制原因'] || '').trim(),
      }
    })

    return parsed.filter(r => r.road || r.startTime)
  } catch (error) {
    console.error('解析限行Excel失败:', error)
    return []
  }
}
