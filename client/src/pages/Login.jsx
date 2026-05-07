import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/Spinner'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { pushToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Login failed'
      pushToast({ type: 'error', title: 'Login error', message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '26px 16px', display: 'grid', placeItems: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 20,
          padding: 18,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Welcome back</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>Sign in to your TeamPulse workspace</div>
          </div>
          <Link to="/" style={{ fontSize: 13, opacity: 0.9, textDecoration: 'none' }}>
            Home
          </Link>
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={{
                padding: '12px 12px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(2,6,23,0.4)',
                color: 'white',
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
              style={{
                padding: '12px 12px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(2,6,23,0.4)',
                color: 'white',
                outline: 'none',
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(16,185,129,0.95))',
              color: 'white',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loading ? <Spinner size={18} /> : 'Login'}
          </button>

          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
            Don&apos;t have an account?{' '}
            <Link to="/signup" style={{ fontWeight: 900, textDecoration: 'none' }}>
              Create one
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

