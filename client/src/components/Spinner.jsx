import React from 'react'

export default function Spinner({ size = 20 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.25)',
        borderTopColor: 'rgba(255,255,255,0.95)',
        animation: 'tp_spin 0.9s linear infinite',
      }}
    />
  )
}

