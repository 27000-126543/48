export type UserRole = 'provincial' | 'municipal' | 'enterprise'

export interface User {
  id: string
  name: string
  role: UserRole
  region?: string
  company?: string
  avatar?: string
}

export type VehicleStatus = 'running' | 'stopped' | 'warning' | 'danger' | 'offline'

export interface Vehicle {
  id: string
  plateNumber: string
  driver: string
  driverPhone: string
  company: string
  province: string
  city: string
  cargo: string
  cargoType: string
  status: VehicleStatus
  currentSpeed: number
  speedLimit: number
  continuousDrivingHours: number
  restHoursToday: number
  currentLat: number
  currentLng: number
  currentLocation: string
  route: string
  departure: string
  destination: string
  departureTime: string
  estimatedArrival: string
  tankTemperature: number
  tankPressure: number
  tankLevel: number
  tankTempThreshold: number
  speedOverRatio: number
  fatigueHours: number
  tankComplianceRate: number
  violationsThisMonth: number
}

export type WarningLevel = 'level1' | 'level2' | 'resolved'
export type WarningType = 'temperature' | 'fatigue' | 'overspeed' | 'pressure' | 'tank_leak'

export interface Warning {
  id: string
  vehicleId: string
  plateNumber: string
  driver: string
  company: string
  type: WarningType
  level: WarningLevel
  message: string
  value?: number
  threshold?: number
  createdAt: string
  respondedAt?: string
  resolvedAt?: string
  createdBy?: string
  escalationCount: number
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  approvals: WarningApproval[]
  interventionEnabled: boolean
}

export interface WarningApproval {
  level: number
  role: string
  approver: string
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  time?: string
}

export interface ViolationRecord {
  id: string
  vehicleId: string
  plateNumber: string
  type: WarningType
  description: string
  time: string
  location: string
  value?: number
  threshold?: number
  handled: boolean
}

export interface TrackPoint {
  time: string
  lat: number
  lng: number
  speed: number
  location: string
}

export interface TankParamPoint {
  time: string
  temperature: number
  pressure: number
  level: number
}

export interface HighRiskRoute {
  id: string
  name: string
  startCity: string
  endCity: string
  riskScore: number
  riskLevel: 'high' | 'medium' | 'low'
  vehicleCount: number
  warningCount: number
  avgSpeed: number
  distance: number
}

export interface ProvinceHeatData {
  name: string
  value: number
  vehicleCount: number
  warningCount: number
}

export interface WeatherData {
  province: string
  city: string
  date: string
  weather: string
  temperature: string
  wind: string
  visibility: number
  riskLevel: 'high' | 'medium' | 'low'
}

export interface RestrictionData {
  province: string
  city: string
  road: string
  startTime: string
  endTime: string
  reason: string
}

export interface RouteRecommendation {
  id: string
  originalRoute: string
  alternateRoute: string
  originalRisk: number
  alternateRisk: number
  extraDistance: number
  extraTime: number
  reason: string
}

export interface WeeklyReport {
  weekNumber: number
  year: number
  startDate: string
  endDate: string
  totalVehicles: number
  totalViolations: number
  violationRate: number
  violationRateWoW: number
  totalAccidents: number
  accidentRate: number
  accidentRateWoW: number
  avgTankComplianceRate: number
  avgTankComplianceRateWoW: number
  topViolations: { type: WarningType; count: number }[]
  highRiskCompanies: { company: string; violations: number; riskLevel: string }[]
  trainingRecommendations: string[]
  rectificationPlans: { item: string; priority: 'high' | 'medium' | 'low'; deadline: string }[]
}
