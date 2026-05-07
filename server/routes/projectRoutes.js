const router = require('express').Router()
const HttpError = require('../utils/httpError')
const { requireAuth } = require('../middlewares/auth')
const Team = require('../models/Team')
const Project = require('../models/Project')
const Task = require('../models/Task')
const Activity = require('../models/Activity')
const { assertTeamRole } = require('../utils/rbac')

function assertNonEmptyString(value, field, min = 1, max = 200) {
  if (typeof value !== 'string') throw new HttpError(400, `${field} is required`)
  const v = value.trim()
  if (v.length < min) throw new HttpError(400, `${field} is too short`)
  if (v.length > max) throw new HttpError(400, `${field} is too long`)
  return v
}

router.get('/team/:teamId/projects', requireAuth, async (req, res) => {
  const team = await Team.findById(req.params.teamId).select('members')
  if (!team) throw new HttpError(404, 'Team not found')

  const membership = team.members.find((m) => String(m.user) === String(req.user.id))
  if (!membership) throw new HttpError(403, 'You are not a member of this team')

  const projects = await Project.find({ team: req.params.teamId })
    .sort({ createdAt: -1 })
    .lean()

  // Attach quick task counts for UI.
  const projectIds = projects.map((p) => p._id)
  const counts = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
  ])

  const map = new Map()
  for (const row of counts) map.set(`${row._id.project}:${row._id.status}`, row.count)

  res.json({
    projects: projects.map((p) => {
      const todo = map.get(`${p._id}:todo`) ?? 0
      const in_progress = map.get(`${p._id}:in_progress`) ?? 0
      const done = map.get(`${p._id}:done`) ?? 0
      return {
        id: p._id,
        name: p.name,
        description: p.description,
        taskCounts: { todo, in_progress, done },
      }
    }),
  })
})

router.get('/:projectId', requireAuth, async (req, res) => {
  const project = await Project.findById(req.params.projectId)
    .populate('team', 'name')
    .populate('createdBy', 'name email')

  if (!project) throw new HttpError(404, 'Project not found')

  const membership = await Team.findOne({
    _id: project.team._id,
    'members.user': req.user.id,
  }).select('members')

  if (!membership) throw new HttpError(403, 'You are not a member of this team')

  const counts = await Task.aggregate([
    { $match: { project: project._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  const byStatus = { todo: 0, in_progress: 0, done: 0 }
  for (const row of counts) byStatus[row._id] = row.count

  res.json({
    project: {
      id: project._id,
      teamId: project.team._id,
      teamName: project.team.name,
      name: project.name,
      description: project.description,
      createdBy: project.createdBy,
      taskCounts: byStatus,
    },
  })
})

router.post('/team/:teamId/projects', requireAuth, async (req, res) => {
  const { teamId } = req.params
  assertTeamRole(teamId, req.user.id, ['admin', 'manager'])

  const name = assertNonEmptyString(req.body?.name, 'name', 2, 100)
  const description = typeof req.body?.description === 'string' ? req.body.description.trim().slice(0, 500) : ''

  const project = await Project.create({
    team: teamId,
    name,
    description,
    createdBy: req.user.id,
  })

  await Activity.create({
    actor: req.user.id,
    team: teamId,
    project: project._id,
    type: 'PROJECT_CREATED',
    message: `Project created: ${name}`,
  })

  res.status(201).json({
    project: { id: project._id, name: project.name, description: project.description },
  })
})

module.exports = router

