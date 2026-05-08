import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Landing() {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '28px 16px',
        background: 'radial-gradient(1200px circle at 10% 0%, rgba(99,102,241,0.25), transparent 40%), #0b1220',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(16,185,129,0.95))',
                boxShadow: '0 18px 40px rgba(99,102,241,0.22)',
              }}
            />
            <div>
              <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>WorkSphere</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>Smart Team Task Manager</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/login"
              style={{
                textDecoration: 'none',
                padding: '10px 14px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              Login
            </Link>
            <Link
              to="/signup"
              style={{
                textDecoration: 'none',
                padding: '10px 14px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(16,185,129,0.95))',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              Sign up
            </Link>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          style={{ fontSize: 52, lineHeight: 1.02, margin: '14px 0 12px', letterSpacing: -0.6 }}
        >
          Tasks that move like a team.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          style={{ fontSize: 17, lineHeight: 1.7, maxWidth: 720, opacity: 0.92 }}
        >
          Create projects, assign work by roles, and track progress with overdue clarity. Built for responsive, real-world
          teams.
        </motion.p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 22 }}>
          {[
            { title: 'Kanban that listens', desc: 'Drag tasks between stages, with real validation.' },
            { title: 'Overdue heatmap', desc: 'Know what’s slipping before it becomes chaos.' },
            { title: 'RBAC by team role', desc: 'Admin, manager, member: permissions enforced server-side.' },
            { title: 'Activity feed', desc: 'A human timeline of what changed and why.' },
          ].map((c) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{
                padding: 16,
                borderRadius: 18,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 13, opacity: 0.86, lineHeight: 1.55 }}>{c.desc}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to="/signup"
            style={{
              textDecoration: 'none',
              padding: '12px 16px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(16,185,129,0.95))',
              border: '1px solid rgba(255,255,255,0.18)',
              fontWeight: 800,
            }}
          >
            Start building your team
          </Link>
          <div style={{ fontSize: 13, opacity: 0.85, alignSelf: 'center' }}>
            No templates. No copycats. Your UI will feel uniquely yours.
          </div>
        </div>
      </div>
    </div>
  )
}

