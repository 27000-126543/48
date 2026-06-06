import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { mockUsers } from '@/data/mock'

interface AuthContextType {
  user: User | null
  login: (role: UserRole) => void
  logout: () => void
  canAccess: (requiredRole: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(mockUsers[0])

  const login = useCallback((role: UserRole) => {
    const found = mockUsers.find(u => u.role === role)
    if (found) setUser(found)
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const canAccess = useCallback((requiredRole: UserRole[]) => {
    if (!user) return false
    const hierarchy: UserRole[] = ['provincial', 'municipal', 'enterprise']
    const userIndex = hierarchy.indexOf(user.role)
    return requiredRole.some(r => hierarchy.indexOf(r) >= userIndex)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
