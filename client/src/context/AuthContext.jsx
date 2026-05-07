import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import http, { setAuthToken } from '../api/http'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('tp_token') ?? null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    setAuthToken(token)
    http
      .get('/auth/me')
      .then((res) => setUser(res.data.user ?? null))
      .catch(() => {
        localStorage.removeItem('tp_token')
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const value = useMemo(() => {
    return {
      token,
      user,
      loading,
      async login({ email, password }) {
        const res = await http.post('/auth/login', { email, password })
        localStorage.setItem('tp_token', res.data.token)
        setAuthToken(res.data.token)
        setToken(res.data.token)
        setUser(res.data.user ?? null)
        return res.data.user
      },
      async signup({ name, email, password }) {
        const res = await http.post('/auth/register', { name, email, password })
        localStorage.setItem('tp_token', res.data.token)
        setAuthToken(res.data.token)
        setToken(res.data.token)
        setUser(res.data.user ?? null)
        return res.data.user
      },
      logout() {
        localStorage.removeItem('tp_token')
        setAuthToken(null)
        setToken(null)
        setUser(null)
      },
    }
  }, [token, user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

