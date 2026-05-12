import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => {
    const stored = localStorage.getItem('consultmee_user')
    return stored ? JSON.parse(stored) : null
  })

  function setUser(nextUser) {
    setUserState(nextUser)
    if (nextUser) {
      localStorage.setItem('consultmee_user', JSON.stringify(nextUser))
    } else {
      localStorage.removeItem('consultmee_user')
    }
  }

  function setAuthSession({ access, refresh, user: nextUser }) {
    localStorage.setItem('consultmee_access_token', access)
    localStorage.setItem('consultmee_refresh_token', refresh)
    setUser(nextUser)
  }

  function logout() {
    localStorage.removeItem('consultmee_access_token')
    localStorage.removeItem('consultmee_refresh_token')
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, setUser, setAuthSession, logout, isAuthenticated: Boolean(user) }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
