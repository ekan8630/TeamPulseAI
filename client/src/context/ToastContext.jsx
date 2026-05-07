import React, { createContext, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  function pushToast({ type = 'info', title, message }) {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200)
  }

  const value = useMemo(() => ({ pushToast }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 14,
          right: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              minWidth: 260,
              maxWidth: 360,
              borderRadius: 14,
              padding: '12px 14px',
              color: 'white',
              background:
                t.type === 'error'
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(124,45,18,0.95))'
                  : t.type === 'success'
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(6,95,70,0.95))'
                    : 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(30,64,175,0.95))',
              boxShadow: '0 14px 35px rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 4 }}>{t.title}</div>
            <div style={{ fontSize: 13, opacity: 0.95 }}>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

