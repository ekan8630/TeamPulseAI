import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import http from '../api/http'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'

function formatDueCount(count) {
  if (count === 0) return 'No issues'
  if (count === 1) return '1 issue'
  return `${count} issues`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { pushToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [projects, setProjects] = useState([])
  const [dashboard, setDashboard] = useState(null)

  const [members, setMembers] = useState([])

  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [createTeamName, setCreateTeamName] = useState('')

  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')

  const [addMemberEmail, setAddMemberEmail] = useState('')
  const [addMemberRole, setAddMemberRole] = useState('member')

  const selectedTeam = useMemo(() => teams.find((t) => t.id === selectedTeamId) ?? null, [teams, selectedTeamId])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [teamsRes, dashRes] = await Promise.all([http.get('/teams'), http.get('/dashboard')])
        setTeams(teamsRes.data?.teams ?? [])
        setDashboard(dashRes.data)
        if (teamsRes.data?.teams?.length && !selectedTeamId) {
          const first = teamsRes.data.teams[0]
          setSelectedTeamId(first.id)
        }
      } catch (err) {
        pushToast({ type: 'error', title: 'Load failed', message: err?.response?.data?.message ?? 'Please try again' })
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedTeamId) return
    async function loadTeam() {
      try {
        const [projRes, memRes] = await Promise.all([
          http.get(`/projects/team/${selectedTeamId}/projects`),
          http.get(`/teams/${selectedTeamId}/members`),
        ])
        setProjects(projRes.data?.projects ?? [])
        setMembers(memRes.data?.members ?? [])
      } catch (err) {
        pushToast({ type: 'error', title: 'Team load failed', message: err?.response?.data?.message ?? 'Please try again' })
      }
    }
    loadTeam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId])

  const velocity24h = useMemo(() => {
    const items = dashboard?.recentActivities ?? []
    const now = Date.now()
    return items.filter((a) => new Date(a.createdAt).getTime() >= now - 24 * 60 * 60 * 1000).length
  }, [dashboard])

  function heatCellStyle(count) {
    const max = 6
    const t = Math.min(1, count / max)
    const bg = `rgba(99,102,241,${0.15 + 0.55 * t})`
    const border = `rgba(255,255,255,${0.1 + 0.4 * t})`
    const text = count === 0 ? 'rgba(255,255,255,0.75)' : 'white'
    return {
      background: bg,
      border: `1px solid ${border}`,
      color: text,
    }
  }

  async function onCreateTeam() {
    try {
      const res = await http.post('/teams', { name: createTeamName })
      setCreateTeamOpen(false)
      setCreateTeamName('')
      pushToast({ type: 'success', title: 'Team created', message: res.data?.team?.name ?? 'Saved' })
      const teamsRes = await http.get('/teams')
      setTeams(teamsRes.data?.teams ?? [])
      setSelectedTeamId(res.data?.team?.id ?? teamsRes.data?.teams?.[0]?.id ?? null)
    } catch (err) {
      pushToast({ type: 'error', title: 'Create team failed', message: err?.response?.data?.message ?? 'Please try again' })
    }
  }

  async function onCreateProject() {
    try {
      const res = await http.post(`/projects/team/${selectedTeamId}/projects`, { name: projectName, description: projectDesc })
      setCreateProjectOpen(false)
      setProjectName('')
      setProjectDesc('')
      pushToast({ type: 'success', title: 'Project created', message: res.data?.project?.name ?? 'Saved' })
      const projRes = await http.get(`/projects/team/${selectedTeamId}/projects`)
      setProjects(projRes.data?.projects ?? [])
    } catch (err) {
      pushToast({ type: 'error', title: 'Create project failed', message: err?.response?.data?.message ?? 'Please try again' })
    }
  }

  async function onAddMember() {
    try {
      await http.post(`/teams/${selectedTeamId}/members`, { email: addMemberEmail, role: addMemberRole })
      setAddMemberEmail('')
      setAddMemberRole('member')
      const memRes = await http.get(`/teams/${selectedTeamId}/members`)
      setMembers(memRes.data?.members ?? [])
      pushToast({ type: 'success', title: 'Member added', message: 'Role applied successfully' })
    } catch (err) {
      pushToast({ type: 'error', title: 'Add member failed', message: err?.response?.data?.message ?? 'Please try again' })
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: 'rgba(2,6,23,0.35)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,1), rgba(16,185,129,1))' }} />
          <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>WorkSphere</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Dashboard</div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            {user?.name ? `Hi, ${user.name}` : 'Signed in'}
          </div>
          <button
            onClick={logout}
            style={{
              padding: '10px 12px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 14, padding: 14, flexWrap: 'wrap' }}>
        <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', flex: '0 0 340px', minWidth: 300 }}>
          <div style={{ padding: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Your Teams</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => setCreateTeamOpen(true)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                + Create team
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 14 }}>
              <Spinner size={26} />
            </div>
          ) : teams.length === 0 ? (
            <div style={{ padding: 14, opacity: 0.9 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>No teams yet</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>Create your first team to start assigning tasks.</div>
            </div>
          ) : (
            <div style={{ padding: 12, display: 'grid', gap: 10 }}>
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 16,
                    border: t.id === selectedTeamId ? '1px solid rgba(99,102,241,0.65)' : '1px solid rgba(255,255,255,0.10)',
                    background:
                      t.id === selectedTeamId ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(16,185,129,0.14))' : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    color: 'white',
                  }}
                >
                  <div style={{ fontWeight: 950, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <span>{t.name}</span>
                    <span style={{ fontSize: 12, opacity: 0.9 }}>{t.myRole ? t.myRole.toUpperCase() : ''}</span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{t.memberCount} members</div>
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Projects</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <button
                disabled={!selectedTeamId}
                onClick={() => setCreateProjectOpen(true)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontWeight: 900,
                  cursor: selectedTeamId ? 'pointer' : 'not-allowed',
                  opacity: selectedTeamId ? 1 : 0.55,
                  fontSize: 13,
                }}
              >
                + Create project
              </button>
            </div>

            {!selectedTeamId ? (
              <div style={{ fontSize: 13, opacity: 0.85 }}>Pick a team to view projects.</div>
            ) : projects.length === 0 ? (
              <div style={{ fontSize: 13, opacity: 0.85 }}>No projects in this team yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    style={{
                      textAlign: 'left',
                      padding: 12,
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.10)',
                      background: 'rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      color: 'white',
                    }}
                  >
                    <div style={{ fontWeight: 950 }}>{p.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ opacity: 0.95 }}>Todo: {p.taskCounts?.todo ?? 0}</span>
                      <span style={{ opacity: 0.95 }}>In progress: {p.taskCounts?.in_progress ?? 0}</span>
                      <span style={{ opacity: 0.95 }}>Done: {p.taskCounts?.done ?? 0}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: 14, overflow: 'hidden', flex: '1 1 520px', minWidth: 320 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {dashboard ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 12 }}>
                  <div style={{ padding: 14, borderRadius: 18, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <div style={{ fontWeight: 900 }}>Task Mix</div>
                    <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>Todo: {dashboard.summary.taskCounts.todo}</div>
                    <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>In progress: {dashboard.summary.taskCounts.in_progress}</div>
                    <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>Done: {dashboard.summary.taskCounts.done}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 18, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <div style={{ fontWeight: 900 }}>Overdue Pulse</div>
                    <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>{formatDueCount(dashboard.summary.overdueCount)}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                      Velocity (last 24h): <span style={{ fontWeight: 950 }}>{velocity24h}</span>
                    </div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 18, background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <div style={{ fontWeight: 900 }}>My Progress</div>
                    <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>Todo: {dashboard.summary.myTaskCounts.todo}</div>
                    <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>In progress: {dashboard.summary.myTaskCounts.in_progress}</div>
                    <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>Done: {dashboard.summary.myTaskCounts.done}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
                  <div style={{ padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(2,6,23,0.28)' }}>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Due-date heatmap</div>
                    <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
                      Non-done tasks grouped by due day.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 8 }}>
                      {dashboard.heatmap.map((c) => (
                        <div
                          key={c.date}
                          title={`${c.date}: ${c.count} due`}
                          style={{
                            height: 56,
                            borderRadius: 14,
                            padding: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            ...heatCellStyle(c.count),
                          }}
                        >
                          <div style={{ fontSize: 11, opacity: 0.9 }}>{c.date.slice(5)}</div>
                          <div style={{ fontWeight: 950, fontSize: 18 }}>{c.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(2,6,23,0.28)' }}>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Recent activity</div>
                    <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>A human-style timeline of what changed.</div>
                    {dashboard.recentActivities?.length ? (
                      <div style={{ display: 'grid', gap: 10, maxHeight: 320, overflow: 'auto', paddingRight: 6 }}>
                        {dashboard.recentActivities.map((a) => (
                          <div
                            key={a.id}
                            style={{
                              padding: 12,
                              borderRadius: 16,
                              border: '1px solid rgba(255,255,255,0.10)',
                              background: 'rgba(255,255,255,0.04)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                              <div style={{ fontWeight: 950 }}>{a.message}</div>
                              <div style={{ fontSize: 12, opacity: 0.85 }}>
                                {new Date(a.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>{a.project?.name ?? ''}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, opacity: 0.85 }}>No activity yet.</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
                <Spinner size={30} />
              </div>
            )}

            {selectedTeam ? (
              <div style={{ marginTop: 12, padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(2,6,23,0.28)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>Team members</div>
                    <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
                      {selectedTeam.name} · {selectedTeam.myRole ? `Your role: ${selectedTeam.myRole.toUpperCase()}` : ''}
                    </div>
                  </div>
                  {selectedTeam.myRole === 'admin' ? (
                    <div style={{ fontSize: 12, opacity: 0.85 }}>Admin can add members</div>
                  ) : (
                    <div style={{ fontSize: 12, opacity: 0.85 }}>Read-only member management</div>
                  )}
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      value={addMemberEmail}
                      onChange={(e) => setAddMemberEmail(e.target.value)}
                      placeholder="Add by email"
                      disabled={selectedTeam.myRole !== 'admin'}
                      style={{
                        flex: 1,
                        minWidth: 220,
                        padding: '11px 12px',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: selectedTeam.myRole !== 'admin' ? 'rgba(2,6,23,0.25)' : 'rgba(2,6,23,0.4)',
                        color: 'white',
                        outline: 'none',
                        opacity: selectedTeam.myRole !== 'admin' ? 0.6 : 1,
                      }}
                    />
                    <select
                      value={addMemberRole}
                      onChange={(e) => setAddMemberRole(e.target.value)}
                      disabled={selectedTeam.myRole !== 'admin'}
                      style={{
                        padding: '11px 12px',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: 'rgba(2,6,23,0.4)',
                        color: 'white',
                        outline: 'none',
                        opacity: selectedTeam.myRole !== 'admin' ? 0.6 : 1,
                      }}
                    >
                      <option value="member">member</option>
                      <option value="viewer">viewer</option>
                      <option value="manager">manager</option>
                    </select>
                    <button
                      onClick={onAddMember}
                      disabled={selectedTeam.myRole !== 'admin'}
                      style={{
                        padding: '11px 14px',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.16)',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(16,185,129,0.95))',
                        color: 'white',
                        fontWeight: 900,
                        cursor: selectedTeam.myRole === 'admin' ? 'pointer' : 'not-allowed',
                        opacity: selectedTeam.myRole === 'admin' ? 1 : 0.55,
                      }}
                    >
                      Add member
                    </button>
                  </div>

                  <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                    {members.length ? (
                      members.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            padding: 12,
                            borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.10)',
                            background: 'rgba(255,255,255,0.04)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 10,
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'grid', gap: 2 }}>
                            <div style={{ fontWeight: 950 }}>{m.name}</div>
                            <div style={{ fontSize: 12, opacity: 0.85 }}>{m.email}</div>
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.92, fontWeight: 900 }}>{m.role.toUpperCase()}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, opacity: 0.85 }}>No members found.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Modal
        open={createTeamOpen}
        title="Create a new team"
        onClose={() => {
          setCreateTeamOpen(false)
          setCreateTeamName('')
        }}
        width={560}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <input
            value={createTeamName}
            onChange={(e) => setCreateTeamName(e.target.value)}
            placeholder="Team name"
            style={{
              padding: '12px 12px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(2,6,23,0.4)',
              color: 'white',
              outline: 'none',
            }}
          />
          <button
            onClick={onCreateTeam}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(16,185,129,0.95))',
              color: 'white',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            Create team
          </button>
        </div>
      </Modal>

      <Modal
        open={createProjectOpen}
        title="Create a new project"
        onClose={() => {
          setCreateProjectOpen(false)
          setProjectName('')
          setProjectDesc('')
        }}
        width={620}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            style={{
              padding: '12px 12px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(2,6,23,0.4)',
              color: 'white',
              outline: 'none',
            }}
          />
          <textarea
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
            placeholder="What are you building?"
            rows={4}
            style={{
              padding: '12px 12px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(2,6,23,0.4)',
              color: 'white',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <button
            onClick={onCreateProject}
            disabled={!selectedTeamId}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.16)',
              background: selectedTeamId
                ? 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(16,185,129,0.95))'
                : 'rgba(255,255,255,0.08)',
              color: 'white',
              fontWeight: 900,
              cursor: selectedTeamId ? 'pointer' : 'not-allowed',
              opacity: selectedTeamId ? 1 : 0.6,
            }}
          >
            Create project
          </button>
        </div>
      </Modal>
    </div>
  )
}

