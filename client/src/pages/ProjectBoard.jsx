import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import http from '../api/http'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'

const STATUS = [
  { key: 'todo', label: 'Todo', tint: 'rgba(99,102,241,0.18)', border: 'rgba(99,102,241,0.35)' },
  {
    key: 'in_progress',
    label: 'In progress',
    tint: 'rgba(245,158,11,0.14)',
    border: 'rgba(245,158,11,0.35)',
  },
  { key: 'done', label: 'Done', tint: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.35)' },
]

function initialsFromName(name) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase() || '?'
}

function formatDue(dueDate) {
  if (!dueDate) return null
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString()
}

function dueBadgeStyle({ dueDate, overdue }) {
  if (overdue) {
    return {
      background: 'rgba(239,68,68,0.18)',
      border: '1px solid rgba(239,68,68,0.45)',
      color: 'rgba(255,255,255,0.98)',
    }
  }
  if (dueDate) {
    const d = new Date(dueDate)
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const dd = new Date(d)
    dd.setHours(0, 0, 0, 0)
    const diffDays = Math.round((dd - start) / (24 * 60 * 60 * 1000))
    if (diffDays === 0) {
      return {
        background: 'rgba(245,158,11,0.16)',
        border: '1px solid rgba(245,158,11,0.45)',
        color: 'rgba(255,255,255,0.98)',
      }
    }
  }
  return {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.92)',
  }
}

export default function ProjectBoard() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pushToast } = useToast()

  const searchRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [teamId, setTeamId] = useState(null)
  const [myRole, setMyRole] = useState(null)
  const [members, setMembers] = useState([])

  const [tasks, setTasks] = useState([])

  const [overdueOnly, setOverdueOnly] = useState(false)
  const [focusMode, setFocusMode] = useState(true)
  const [query, setQuery] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [activityItems, setActivityItems] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)

  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPriority, setFormPriority] = useState('medium')
  const [formStatus, setFormStatus] = useState('todo')
  const [formDue, setFormDue] = useState('')
  const [formAssigned, setFormAssigned] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [pRes, tRes] = await Promise.all([http.get(`/projects/${projectId}`), http.get(`/projects/${projectId}/tasks`)])
        setProject(pRes.data?.project ?? null)
        setTeamId(pRes.data?.project?.teamId ?? null)
        setTasks(tRes.data?.tasks ?? [])
      } catch (err) {
        pushToast({ type: 'error', title: 'Load failed', message: err?.response?.data?.message ?? 'Please try again' })
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    if (!teamId) return
    http
      .get(`/teams/${teamId}/members`)
      .then((res) => setMembers(res.data?.members ?? []))
      .catch(() => {})

    http
      .get('/teams')
      .then((res) => {
        const team = (res.data?.teams ?? []).find((t) => String(t.id) === String(teamId))
        setMyRole(team?.myRole ?? null)
      })
      .catch(() => {})
  }, [teamId])

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    const meId = user?.id

    return tasks.filter((t) => {
      if (overdueOnly && !t.overdue) return false
      if (focusMode && meId) {
        const assignedMe = t.assignedTo?.some((u) => String(u._id) === String(meId)) ?? false
        const createdMe = String(t.createdBy?._id ?? t.createdBy?.id ?? '') === String(meId)
        if (!assignedMe && !createdMe) return false
      }
      if (q) {
        const hay = `${t.title ?? ''} ${t.description ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [tasks, overdueOnly, focusMode, query, user])

  function groupByStatus(statusKey) {
    return filteredTasks
      .filter((t) => t.status === statusKey)
      .sort((a, b) => {
        // Overdue first, then dueDate, then createdAt.
        const ao = a.overdue ? 1 : 0
        const bo = b.overdue ? 1 : 0
        if (ao !== bo) return bo - ao
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY
        if (ad !== bd) return ad - bd
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }

  function smartDueDate(priority) {
    const days = priority === 'high' ? 2 : priority === 'medium' ? 4 : 7
    const d = new Date()
    d.setDate(d.getDate() + days)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().slice(0, 10)
  }

  async function onDragStatus(task, newStatus) {
    if (myRole === 'viewer') return
    if (!task || task.status === newStatus) return
    try {
      // Optimistic update for a “human” snappy feel.
      setTasks((prev) => prev.map((t) => (String(t._id) === String(task._id) ? { ...t, status: newStatus } : t)))
      await http.patch(`/tasks/${task._id}`, { status: newStatus })
      // Refresh just the dragged task shape.
      const res = await http.get(`/projects/${projectId}/tasks?status=${newStatus}`)
      setTasks((prev) => {
        const map = new Map()
        prev.forEach((x) => map.set(String(x._id), x))
        res.data?.tasks?.forEach((x) => map.set(String(x._id), x))
        return Array.from(map.values())
      })
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Status update failed'
      pushToast({ type: 'error', title: 'Cannot move', message: msg })
      // Re-load tasks on failure to ensure consistency.
      const tRes = await http.get(`/projects/${projectId}/tasks`)
      setTasks(tRes.data?.tasks ?? [])
    }
  }

  function openCreate() {
    if (myRole === 'viewer') {
      pushToast({ type: 'error', title: 'Read-only', message: 'Your team role is viewer.' })
      return
    }
    setActiveTask(null)
    setFormTitle('')
    setFormDesc('')
    setFormPriority('medium')
    setFormStatus('todo')
    setFormDue('')
    setFormAssigned([])
    setCreateOpen(true)
  }

  function openEdit(task) {
    if (myRole === 'viewer') {
      pushToast({ type: 'error', title: 'Read-only', message: 'Your team role is viewer.' })
      return
    }
    setActiveTask(task)
    setFormTitle(task.title ?? '')
    setFormDesc(task.description ?? '')
    setFormPriority(task.priority ?? 'medium')
    setFormStatus(task.status ?? 'todo')
    setFormDue(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '')
    setFormAssigned((task.assignedTo ?? []).map((u) => u._id))
    setEditOpen(true)
  }

  async function submitCreate() {
    try {
      const assignedTo = formAssigned
      const res = await http.post(`/projects/${projectId}/tasks`, {
        title: formTitle,
        description: formDesc,
        priority: formPriority,
        status: formStatus,
        dueDate: formDue ? formDue : null,
        assignedTo,
      })
      setCreateOpen(false)
      pushToast({ type: 'success', title: 'Task created', message: res.data?.task?.title ?? 'Saved' })
      const tRes = await http.get(`/projects/${projectId}/tasks`)
      setTasks(tRes.data?.tasks ?? [])
    } catch (err) {
      pushToast({ type: 'error', title: 'Create failed', message: err?.response?.data?.message ?? 'Please try again' })
    }
  }

  async function submitEdit() {
    if (!activeTask) return
    try {
      const prevAssigned = (activeTask.assignedTo ?? []).map((u) => u._id)
      const nextAssigned = formAssigned

      // Patch main fields including status.
      await http.patch(`/tasks/${activeTask._id}`, {
        title: formTitle,
        description: formDesc,
        priority: formPriority,
        status: formStatus,
        dueDate: formDue ? formDue : null,
      })

      // If assignees changed, use the explicit assign endpoint.
      const changed =
        prevAssigned.length !== nextAssigned.length ||
        prevAssigned.some((id) => !nextAssigned.some((nid) => String(nid) === String(id)))
      if (changed) {
        await http.post(`/tasks/${activeTask._id}/assign`, { assignedTo: nextAssigned })
      }

      setEditOpen(false)
      pushToast({ type: 'success', title: 'Task updated', message: 'Changes saved successfully' })
      const tRes = await http.get(`/projects/${projectId}/tasks`)
      setTasks(tRes.data?.tasks ?? [])
    } catch (err) {
      pushToast({ type: 'error', title: 'Update failed', message: err?.response?.data?.message ?? 'Please try again' })
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 12px',
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(2,6,23,0.35)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
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
            Back
          </button>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>{project?.name ?? 'Project'}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{project?.teamName ? `${project.teamName} team` : ''}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks... (Ctrl+K)"
            style={{
              width: 260,
              maxWidth: '80vw',
              padding: '11px 12px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(2,6,23,0.4)',
              color: 'white',
              outline: 'none',
            }}
          />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, opacity: 0.9 }}>
            <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
            Overdue only
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, opacity: 0.9 }}>
            <input type="checkbox" checked={focusMode} onChange={(e) => setFocusMode(e.target.checked)} />
            Focus mode
          </label>
          <button
            onClick={openCreate}
            disabled={myRole === 'viewer'}
            style={{
              padding: '11px 14px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(16,185,129,0.95))',
              color: 'white',
              fontWeight: 900,
              cursor: myRole === 'viewer' ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              opacity: myRole === 'viewer' ? 0.55 : 1,
            }}
          >
            + Create task
          </button>
          <button
            onClick={async () => {
              setActivityOpen(true)
              setActivityLoading(true)
              try {
                const res = await http.get(`/dashboard/projects/${projectId}/activity?limit=20`)
                setActivityItems(res.data?.activities ?? [])
              } catch (err) {
                pushToast({ type: 'error', title: 'Activity load failed', message: err?.response?.data?.message ?? 'Please try again' })
              } finally {
                setActivityLoading(false)
              }
            }}
            style={{
              padding: '11px 14px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontWeight: 900,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            View activity
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ marginTop: 14, display: 'grid', placeItems: 'center', minHeight: 420 }}>
          <Spinner size={34} />
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
          {STATUS.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('text/taskId')
                const task = tasks.find((t) => String(t._id) === String(id))
                if (task) onDragStatus(task, col.key)
              }}
              style={{
                borderRadius: 18,
                border: `1px solid ${col.border}`,
                background: col.tint,
                overflow: 'hidden',
                minHeight: 520,
                minWidth: 300,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: 14, borderBottom: '1px solid rgba(255,255,255,0.10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 950 }}>{col.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                    {groupByStatus(col.key).length} tasks
                  </div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>
                  {col.key === 'done' ? 'Lock-in' : col.key === 'in_progress' ? 'Momentum' : 'Plan'}
                </div>
              </div>

              <div style={{ padding: 12, display: 'grid', gap: 10, alignContent: 'start' }}>
                {groupByStatus(col.key).length === 0 ? (
                  <div style={{ padding: 14, borderRadius: 16, border: '1px dashed rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.03)', opacity: 0.9 }}>
                    <div style={{ fontWeight: 900 }}>Nothing here</div>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>Drop a task to start moving work.</div>
                  </div>
                ) : (
                  groupByStatus(col.key).map((t) => {
                    const dueText = t.overdue ? 'Overdue' : t.dueDate ? 'Due' : null
                    const dueStyle = dueBadgeStyle({ dueDate: t.dueDate, overdue: t.overdue })
                    return (
                      <div
                        key={t._id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/taskId', t._id)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onClick={() => openEdit(t)}
                        role="button"
                        tabIndex={0}
                        style={{
                          padding: 12,
                          borderRadius: 16,
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'rgba(2,6,23,0.25)',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 950, lineHeight: 1.25, wordBreak: 'break-word' }}>{t.title}</div>
                            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6, lineHeight: 1.4 }}>
                              {t.description ? t.description.slice(0, 78) : 'No description'}
                              {t.description && t.description.length > 78 ? '...' : ''}
                            </div>
                          </div>
                          <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
                            <div
                              style={{
                                padding: '6px 8px',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.12)',
                                background:
                                  t.priority === 'high'
                                    ? 'rgba(239,68,68,0.18)'
                                    : t.priority === 'medium'
                                      ? 'rgba(245,158,11,0.16)'
                                      : 'rgba(59,130,246,0.16)',
                                fontSize: 12,
                                fontWeight: 950,
                                textTransform: 'capitalize',
                              }}
                            >
                              {t.priority}
                            </div>
                            {t.dueDate ? (
                              <div
                                style={{
                                  ...dueStyle,
                                  padding: '6px 8px',
                                  borderRadius: 12,
                                  fontSize: 12,
                                  fontWeight: 950,
                                }}
                                title={formatDue(t.dueDate)}
                              >
                                {dueText}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                          {(t.assignedTo ?? []).slice(0, 3).map((u) => (
                            <div
                              key={u._id}
                              title={`${u.name ?? 'User'} (${u.email ?? ''})`}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 999,
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: 12,
                                fontWeight: 950,
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.14)',
                              }}
                            >
                              {initialsFromName(u.name)}
                            </div>
                          ))}
                          {(t.assignedTo ?? []).length > 3 ? (
                            <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>
                              +{(t.assignedTo ?? []).length - 3}
                            </div>
                          ) : null}
                          {t.assignedTo?.some((u) => String(u._id) === String(user?.id)) ? (
                            <div style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.9, fontWeight: 900 }}>
                              Assigned to you
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} title="Create a task" onClose={() => setCreateOpen(false)} width={760}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Title</div>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Prepare sprint plan"
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
            <div style={{ fontSize: 13, opacity: 0.9 }}>Description</div>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="What does success look like?"
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
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Priority</div>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                style={{
                  padding: '12px 12px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(2,6,23,0.4)',
                  color: 'white',
                  outline: 'none',
                }}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Start status</div>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                style={{
                  padding: '12px 12px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(2,6,23,0.4)',
                  color: 'white',
                  outline: 'none',
                }}
              >
                <option value="todo">todo</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'grid', gap: 6, flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Due date</div>
              <input
                type="date"
                value={formDue}
                onChange={(e) => setFormDue(e.target.value)}
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
              onClick={() => setFormDue(smartDueDate(formPriority))}
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.16)',
                background: 'rgba(255,255,255,0.06)',
                color: 'white',
                fontWeight: 900,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Auto-pick a due date based on priority"
            >
              Smart due
            </button>
          </div>

          <div style={{ paddingTop: 6 }}>
            <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 900, marginBottom: 8 }}>Assign to</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {members.map((m) => {
                const checked = formAssigned.some((id) => String(id) === String(m.id))
                return (
                  <label
                    key={m.id}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      padding: '9px 10px',
                      borderRadius: 14,
                      border: checked ? '1px solid rgba(99,102,241,0.65)' : '1px solid rgba(255,255,255,0.10)',
                      background: checked ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setFormAssigned((prev) => [...prev, m.id])
                        else setFormAssigned((prev) => prev.filter((id) => String(id) !== String(m.id)))
                      }}
                    />
                    <span style={{ fontWeight: 900, fontSize: 13 }}>{m.name}</span>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>{m.role}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              onClick={() => setCreateOpen(false)}
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={submitCreate}
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
              Create task
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} title="Edit task" onClose={() => setEditOpen(false)} width={820}>
        {activeTask ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 950, opacity: 0.95 }}>Editing: {activeTask.title}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                Created by: {activeTask.createdBy?.name ?? activeTask.createdBy?.email ?? ''}
              </div>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Title</div>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
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
              <div style={{ fontSize: 13, opacity: 0.9 }}>Description</div>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
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
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Priority</div>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  style={{
                    padding: '12px 12px',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(2,6,23,0.4)',
                    color: 'white',
                    outline: 'none',
                  }}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Status</div>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  style={{
                    padding: '12px 12px',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(2,6,23,0.4)',
                    color: 'white',
                    outline: 'none',
                  }}
                >
                  <option value="todo">todo</option>
                  <option value="in_progress">in_progress</option>
                  <option value="done">done</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'grid', gap: 6, flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Due date</div>
                <input
                  type="date"
                  value={formDue}
                  onChange={(e) => setFormDue(e.target.value)}
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
                onClick={() => setFormDue(smartDueDate(formPriority))}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  fontWeight: 900,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Smart due
              </button>
            </div>

            <div style={{ paddingTop: 6 }}>
              <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 900, marginBottom: 8 }}>Assignees</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {members.map((m) => {
                  const checked = formAssigned.some((id) => String(id) === String(m.id))
                  return (
                    <label
                      key={m.id}
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        padding: '9px 10px',
                        borderRadius: 14,
                        border: checked ? '1px solid rgba(99,102,241,0.65)' : '1px solid rgba(255,255,255,0.10)',
                        background: checked ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setFormAssigned((prev) => [...prev, m.id])
                          else setFormAssigned((prev) => prev.filter((id) => String(id) !== String(m.id)))
                        }}
                      />
                      <span style={{ fontWeight: 900, fontSize: 13 }}>{m.name}</span>
                      <span style={{ fontSize: 12, opacity: 0.8 }}>{m.role}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button
                onClick={() => setEditOpen(false)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
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
                Save changes
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 12, opacity: 0.85 }}>No active task selected.</div>
        )}
      </Modal>

      <Modal
        open={activityOpen}
        title="Project activity timeline"
        onClose={() => {
          setActivityOpen(false)
          setActivityItems([])
        }}
        width={760}
      >
        {activityLoading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: 18 }}>
            <Spinner size={30} />
          </div>
        ) : activityItems.length ? (
          <div style={{ display: 'grid', gap: 10, maxHeight: 430, overflow: 'auto', paddingRight: 6 }}>
            {activityItems.map((a) => (
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
                  <div style={{ fontSize: 12, opacity: 0.85 }}>{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                  {a.actor?.name ? `By ${a.actor.name}` : 'System'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, opacity: 0.85 }}>No activity yet.</div>
        )}
      </Modal>
    </div>
  )
}

