import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const stats = [
  { number: '12K+', label: 'Tasks Managed' },
  { number: '540+', label: 'Active Teams' },
  { number: '99%', label: 'Project Accuracy' },
]

const features = [
  {
    title: 'Kanban that listens',
    desc: 'Drag tasks between stages with real-time validation and smooth workflows.',
  },
  {
    title: 'Overdue heatmap',
    desc: 'See deadline pressure before it turns into project chaos.',
  },
  {
    title: 'RBAC by role',
    desc: 'Admin, manager, member — secure permissions handled server-side.',
  },
  {
    title: 'Realtime activity',
    desc: 'Track every update, assignment and completion instantly.',
  },
]

export default function Landing() {
  return (
    <div
      style={{
        minHeight: '100vh',
        overflow: 'hidden',
        position: 'relative',
        padding: '28px 18px',
        background:
          'radial-gradient(circle at top left, rgba(99,102,241,0.22), transparent 30%), #071120',
      }}
    >
      {/* BACKGROUND GLOW */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          background: 'rgba(99,102,241,0.18)',
          filter: 'blur(140px)',
          borderRadius: '50%',
          top: -120,
          left: -120,
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          background: 'rgba(16,185,129,0.15)',
          filter: 'blur(140px)',
          borderRadius: '50%',
          bottom: -150,
          right: -120,
        }}
      />

      <div style={{ maxWidth: 1220, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* NAVBAR */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 60,
            padding: '12px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.div
              animate={{ rotate: [0, 3, -3, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background:
                  'linear-gradient(135deg, rgba(99,102,241,1), rgba(16,185,129,1))',
                boxShadow: '0 18px 50px rgba(99,102,241,0.35)',
              }}
            />

            <div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>WorkSphere</div>
              <div style={{ opacity: 0.75 }}>Smart Team Task Manager</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              to="/login"
              style={{
                textDecoration: 'none',
                padding: '12px 18px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'white',
                fontWeight: 600,
              }}
            >
              Login
            </Link>

            <Link
              to="/signup"
              style={{
                textDecoration: 'none',
                padding: '12px 20px',
                borderRadius: 16,
                background:
                  'linear-gradient(135deg, rgba(99,102,241,1), rgba(16,185,129,1))',
                color: 'white',
                fontWeight: 700,
                boxShadow: '0 12px 30px rgba(99,102,241,0.35)',
              }}
            >
              Sign up
            </Link>
          </div>
        </motion.div>

        {/* HERO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: 40,
            alignItems: 'center',
          }}
        >
          {/* LEFT */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                fontSize: 72,
                lineHeight: 1,
                fontWeight: 900,
                marginBottom: 24,
                letterSpacing: -2,
              }}
            >
              Build smarter teams with AI-powered workflows.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: 19,
                lineHeight: 1.8,
                maxWidth: 680,
                opacity: 0.88,
              }}
            >
              Manage projects, assign tasks, monitor deadlines and boost team
              productivity in one intelligent workspace.
            </motion.p>

            {/* BUTTONS */}
            <div
              style={{
                display: 'flex',
                gap: 14,
                marginTop: 34,
                flexWrap: 'wrap',
              }}
            >
              <Link
                to="/signup"
                style={{
                  textDecoration: 'none',
                  padding: '15px 24px',
                  borderRadius: 18,
                  background:
                    'linear-gradient(135deg, rgba(99,102,241,1), rgba(16,185,129,1))',
                  color: 'white',
                  fontWeight: 800,
                  boxShadow: '0 16px 40px rgba(99,102,241,0.35)',
                }}
              >
                Start Building
              </Link>

              <button
                style={{
                  padding: '15px 24px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Live Preview
              </button>
            </div>

            {/* STATS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 18,
                marginTop: 45,
              }}
            >
              {stats.map((s) => (
                <motion.div
                  whileHover={{ y: -6 }}
                  key={s.label}
                  style={{
                    padding: 20,
                    borderRadius: 22,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div style={{ fontSize: 34, fontWeight: 900 }}>{s.number}</div>
                  <div style={{ opacity: 0.7, marginTop: 4 }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              position: 'relative',
            }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              style={{
                borderRadius: 30,
                padding: 24,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              }}
            >
              {/* FAKE DASHBOARD */}
              <div
                style={{
                  height: 18,
                  width: 140,
                  borderRadius: 20,
                  background:
                    'linear-gradient(135deg, rgba(99,102,241,1), rgba(16,185,129,1))',
                  marginBottom: 20,
                }}
              />

              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: 18,
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.04)',
                    marginBottom: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    style={{
                      width: '60%',
                      height: 14,
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.15)',
                      marginBottom: 12,
                    }}
                  />

                  <div
                    style={{
                      width: '100%',
                      height: 10,
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.08)',
                      marginBottom: 8,
                    }}
                  />

                  <div
                    style={{
                      width: '75%',
                      height: 10,
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.08)',
                    }}
                  />
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* FEATURES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
            gap: 18,
            marginTop: 70,
          }}
        >
          {features.map((f) => (
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              key={f.title}
              style={{
                padding: 22,
                borderRadius: 24,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 20,
                  marginBottom: 10,
                }}
              >
                {f.title}
              </div>

              <div
                style={{
                  opacity: 0.8,
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                {f.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}