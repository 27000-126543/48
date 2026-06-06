import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import Dashboard from '@/pages/Dashboard'
import Vehicles from '@/pages/Vehicles'
import VehicleDetail from '@/pages/VehicleDetail'
import Warnings from '@/pages/Warnings'
import RiskPrediction from '@/pages/RiskPrediction'
import WeeklyReport from '@/pages/WeeklyReport'
import Login from '@/pages/Login'

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="vehicles/:id" element={<VehicleDetail />} />
        <Route path="warnings" element={<Warnings />} />
        <Route path="risk" element={<RiskPrediction />} />
        <Route path="report" element={<WeeklyReport />} />
      </Route>
    </Routes>
  )
}

export default App
