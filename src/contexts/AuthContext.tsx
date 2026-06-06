import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { authApi, setToken, clearToken, setStoredUser, getStoredUser } from '@/api/client'
import { message } from 'antd'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  canAccess: (requiredRole: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      setToken(res.token)
      setStoredUser(res.user)
      setUser(res.user)
      message.success(`登录成功，欢迎 ${res.user.name}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const canAccess = useCallback((requiredRole: UserRole[]) => {
    if (!user) return false
    const hierarchy: UserRole[] = ['provincial', 'municipal', 'enterprise']
    const userIndex = hierarchy.indexOf(user.role)
    return requiredRole.some(r => hierarchy.indexOf(r) >= userIndex)
  }, [user])

  useEffect(() => {
    const t = getStoredUser()
    if (t && !user) setUser(t)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
