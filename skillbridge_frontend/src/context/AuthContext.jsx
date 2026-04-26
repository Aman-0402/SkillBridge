import { createContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/profile/')
      setUser(response.data)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Profile fetch failed:', error)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (username, email, password, password2, role) => {
    try {
      const response = await api.post('/auth/register/', {
        username,
        email,
        password,
        password2,
        role,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  }, [])

  const login = useCallback(async (username, password) => {
    try {
      const response = await api.post('/auth/login/', {
        username,
        password,
      })
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      await fetchProfile()
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  }, [fetchProfile])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
