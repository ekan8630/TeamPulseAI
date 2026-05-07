
const router = require('express').Router()
const HttpError = require('../utils/httpError')
const { requireAuth } = require('../middlewares/auth')
const Task = require('../models/Task')
const Project = require('../models/Project')
const Team = require('../models/Team')
const Activity = require('../models/Activity')
const { assertTeamRole } = require('../utils/rbac')

const STATUS_VALUES = ['todo', 'in_progress', 'done']
const PRIORITY_VALUES = ['low', 'medium', 'high']

function parseDueDate(value) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw new HttpError(400, 'dueDate must be a valid date')
  return d
}

function assertNonEmptyString(value, field, min = 1, max = 200) {
  if (typeof value !== 'string') throw new HttpError(400, `${field} is required`)
  const v = value.trim()
  if (v.length < min) throw new HttpError(400, `${field} is too short`)
  if (v.length > max) throw new HttpError(400, `${field} is too long`)
  return v
}

function hasRole(membershipRole, allowed) {
  return allowed.includes(membershipRole)
}

function isMemberOfTeam(team, userId) {
  return team.members.some((m) => String(m.user) === String(userId))
}

// Task list for a project (used to power the Kanban board).
router.get('/projects/:projectId/tasks', requireAuth, async (req, res) => {
  const { projectId } = req.params
  const { status, priority, overdue, assigneeId, q } = req.query ?? {}

  const project = await Project.findById(projectId).select('team name')
  if (!project) throw new HttpError(404, 'Project not found')

  const membership = await assertTeamRole(project.team, req.user.id, ['admin', 'manager', 'member', 'viewer'])

  const filter = { project: projectId }
  if (status && STATUS_VALUES.includes(status)) filter.status = status
  if (priority && PRIORITY_VALUES.includes(priority)) filter.priority = priority
  if (assigneeId) filter.assignedTo = req.query.assigneeId
  if (q && typeof q === 'string') {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ]
  }
  if (overdue === '1') {
    const now = new Date()
    filter.dueDate = { $lt: now }
    filter.status = { $ne: 'done' }
  }

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1, createdAt: -1 })
    .lean()

  const now = new Date()
  const enriched = tasks.map((t) => {
    const assignedMe = t.assignedTo?.some((u) => String(u._id) === String(req.user.id)) ?? false
    const overdueFlag = !!t.dueDate && new Date(t.dueDate).getTime() < now.getTime() && t.status !== 'done'
    return { ...t, assignedMe, overdue: overdueFlag }
  })

  res.json({ tasks: enriched })
})

router.post('/projects/:projectId/tasks', requireAuth, async (req, res) => {
  const { projectId } = req.params
  const project = await Project.findById(projectId).select('team')
  if (!project) throw new HttpError(404, 'Project not found')

  const membership = await assertTeamRole(project.team, req.user.id, ['admin', 'manager', 'member'])

  const title = assertNonEmptyString(req.body?.title, 'title', 2, 200)
  const description = typeof req.body?.description === 'string' ? req.body.description.trim().slice(0, 2000) : ''
  const priority = req.body?.priority && PRIORITY_VALUES.includes(req.body.priority) ? req.body.priority : undefined
  const status = req.body?.status && STATUS_VALUES.includes(req.body.status) ? req.body.status : 'todo'
  const dueDate = parseDueDate(req.body?.dueDate)

  // assignedTo is optional, but it must be a member of the team.
  const assignedTo = Array.isArray(req.body?.assignedTo) ? req.body.assignedTo : []

  const team = await Team.findById(project.team).select('members.user')
  const validAssigned = assignedTo.filter((id) => isMemberOfTeam(team, id))

  // If user passed invalid ids, show validation feedback.
  if (validAssigned.length !== assignedTo.length) {
    throw new HttpError(400, 'assignedTo contains users who are not in this team')
  }

  const task = await Task.create({
    project: projectId,
    title,
    description,
    status,
    priority: priority ?? 'medium',
    dueDate: dueDate ?? null,
    createdBy: req.user.id,
    assignedTo: validAssigned,
  })

  await Activity.create({
    actor: req.user.id,
    team: project.team,
    project: projectId,
    task: task._id,
    type: 'TASK_CREATED',
    message: `Task created: ${title}`,
  })

  const created = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .lean()

  res.status(201).json({ task: created })
})

router.patch('/tasks/:taskId', requireAuth, async (req, res) => {
  const { taskId } = req.params
  const task = await Task.findById(taskId).populate('project', 'team')
  if (!task) throw new HttpError(404, 'Task not found')

  const teamId = task.project.team
  const membership = await assertTeamRole(teamId, req.user.id, ['admin', 'manager', 'member', 'viewer'])

  const body = req.body ?? {}
  const statusChanged = typeof body.status === 'string' && body.status !== task.status
  const newStatus = statusChanged ? body.status : undefined
  if (statusChanged && !STATUS_VALUES.includes(newStatus)) throw new HttpError(400, 'Invalid status')

  if (membership.role === 'viewer') throw new HttpError(403, 'You are in read-only mode')

  const isAssignee = task.assignedTo.some((u) => String(u) === String(req.user.id))
  const isCreator = String(task.createdBy) === String(req.user.id)

  // Permission model:
  // - admin/manager can update anything
  // - member can update content only if they are creator or assignee
  if (membership.role === 'member' && !(isAssignee || isCreator)) {
    throw new HttpError(403, 'You can only edit tasks you created or are assigned to')
  }

  // Status changes for members are allowed only if they are assigned to (keeps flow realistic).
  if (membership.role === 'member' && statusChanged && !isAssignee) {
    throw new HttpError(403, 'You can only change status for tasks you are assigned to')
  }

  const allowed = ['title', 'description', 'status', 'priority', 'dueDate']
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) throw new HttpError(400, `Unsupported field: ${key}`)
  }

  if (body.title !== undefined) task.title = assertNonEmptyString(body.title, 'title', 2, 200)
  if (body.description !== undefined) task.description = typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : ''
  if (body.priority !== undefined) {
    if (!PRIORITY_VALUES.includes(body.priority)) throw new HttpError(400, 'Invalid priority')
    task.priority = body.priority
  }
  if (body.status !== undefined) task.status = body.status
  if (body.dueDate !== undefined) task.dueDate = parseDueDate(body.dueDate)

  await task.save()

  await Activity.create({
    actor: req.user.id,
    team: teamId,
    project: task.project._id,
    task: task._id,
    type: statusChanged ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED',
    message: statusChanged ? `Status changed to ${task.status}` : `Task updated`,
  })

  const updated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .lean()

  res.json({ task: updated })
})

router.post('/tasks/:taskId/assign', requireAuth, async (req, res) => {
  const { taskId } = req.params
  const task = await Task.findById(taskId).populate('project', 'team')
  if (!task) throw new HttpError(404, 'Task not found')

  const teamId = task.project.team
  const membership = await assertTeamRole(teamId, req.user.id, ['admin', 'manager'])

  const assignedTo = Array.isArray(req.body?.assignedTo) ? req.body.assignedTo : []

  const team = await Team.findById(teamId).select('members.user')
  const validAssigned = assignedTo.filter((id) => isMemberOfTeam(team, id))
  if (validAssigned.length !== assignedTo.length) {
    throw new HttpError(400, 'assignedTo contains users who are not in this team')
  }

  task.assignedTo = validAssigned
  await task.save()

  await Activity.create({
    actor: req.user.id,
    team: teamId,
    project: task.project._id,
    task: task._id,
    type: 'TASK_ASSIGNED',
    message: `Task assignment updated (${validAssigned.length} assignees)`,
  })

  const updated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .lean()

  res.json({ task: updated })
})

router.delete('/tasks/:taskId', requireAuth, async (req, res) => {
  const { taskId } = req.params
  const task = await Task.findById(taskId).populate('project', 'team')
  if (!task) throw new HttpError(404, 'Task not found')

  await assertTeamRole(task.project.team, req.user.id, ['admin', 'manager'])
  await Task.deleteOne({ _id: taskId })

  await Activity.create({
    actor: req.user.id,
    team: task.project.team,
    project: task.project._id,
    task: taskId,
    type: 'TASK_UPDATED',
    message: `Task deleted`,
  })

  res.status(204).send()
})

module.exports = router
