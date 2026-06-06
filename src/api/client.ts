import type {
  Vehicle,
  Warning,
  TrackPoint,
  TankParamPoint,
  ViolationRecord,
  HighRiskRoute,
  ProvinceHeatData,
  WeatherData,
  RestrictionData,
  RouteRecommendation,
  WeeklyReport,
  User,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const getToken = (): string | null => {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

export const setToken = (token: string) => {
  localStorage.setItem('token', token)
}

export const clearToken = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const setStoredUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user))
}

export const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, any>
  formData?: FormData
}

const request = async <T,>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { params, formData, headers, ...rest } = options

  let url = `${API_BASE}${path}`
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params as any).toString()
    url += `?${qs}`
  }

  const token = getToken()
  const mergedHeaders: Record<string, string> = {
    ...(formData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string>),
  }
  if (token) {
    mergedHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...rest,
    headers: mergedHeaders,
    body: formData ? formData : rest.body,
  })

  const text = await response.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    const msg = data?.error || `HTTP ${response.status}`
    throw new Error(msg)
  }

  return data as T
}

export interface LoginResponse {
  token: string
  user: User
}

export const authApi = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ user: User }>('/auth/me'),
}

export interface VehiclesResponse {
  total: number
  items: Vehicle[]
  summary: {
    total: number
    running: number
    stopped: number
    warning: number
    danger: number
    offline: number
  }
}

export interface VehicleDetailResponse {
  vehicle: Vehicle
  trackPoints: TrackPoint[]
  tankParams: TankParamPoint[]
  violations: ViolationRecord[]
}

export const vehiclesApi = {
  list: () => request<VehiclesResponse>('/vehicles'),
  detail: (id: string) => request<VehicleDetailResponse>(`/vehicles/${id}`),
}

export interface WarningsResponse {
  total: number
  level1: number
  level2: number
  resolved: number
  items: Warning[]
}

export const warningsApi = {
  list: () => request<WarningsResponse>('/warnings'),
  respond: (id: string) =>
    request<{ success: boolean; warning: Warning }>(`/warnings/${id}/respond`, { method: 'POST' }),
  escalate: (id: string) =>
    request<{ success: boolean; warning: Warning }>(`/warnings/${id}/escalate`, { method: 'POST' }),
  approve: (id: string, level: number, status: 'approved' | 'rejected', comment: string) =>
    request<{ success: boolean; warning: Warning }>(`/warnings/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ level, status, comment }),
    }),
  intervene: (id: string) =>
    request<{ success: boolean; message: string }>(`/warnings/${id}/intervene`, { method: 'POST' }),
}

export interface WeatherUploadResponse {
  success: boolean
  count: number
  data: WeatherData[]
}

export interface RestrictionUploadResponse {
  success: boolean
  count: number
  data: RestrictionData[]
}

export interface RiskPredictionResponse {
  hourData: { hour: string; riskScore: number; vehicleCount: number }[]
  recommendations: RouteRecommendation[]
  highRiskRoutes: HighRiskRoute[]
  highRiskPeriods: string[]
  mediumRiskPeriods: string[]
  lowRiskPeriods: string[]
}

export interface DashboardSummary {
  totalVehicles: number
  runningVehicles: number
  warningVehicles: number
  todayWarningCount: number
  avgTankComplianceRate: number
  tankComplianceRateChange: number
  provinceHeat: ProvinceHeatData[]
  highRiskRoutes: HighRiskRoute[]
  recentWarnings: Warning[]
  statusDistribution: Record<string, number>
  violationTrend: number[]
  warningTrend: number[]
  trendLabels: string[]
}

export const riskApi = {
  getWeather: () => request<{ data: WeatherData[] }>('/weather'),
  getRestrictions: () => request<{ data: RestrictionData[] }>('/restrictions'),
  uploadWeather: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return request<WeatherUploadResponse>('/upload/weather', { method: 'POST', formData: fd })
  },
  uploadRestriction: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return request<RestrictionUploadResponse>('/upload/restriction', { method: 'POST', formData: fd })
  },
  getPrediction: () => request<RiskPredictionResponse>('/risk/prediction'),
  getDashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),
  getWeeklyReport: () => request<WeeklyReport>('/report/weekly'),
}
