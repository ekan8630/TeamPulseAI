const router = require('express').Router()
const HttpError = require('../utils/httpError')
const { requireAuth } = require('../middlewares/auth')
const Team = require('../models/Team')
const Project = require('../models/Project')
const Task = require('../models/Task')
const Activity = require('../models/Activity')
const { assertTeamRole } = require('../utils/rbac')

router.get('/', requireAuth, async (req, res) => {
  const now = new Date()
  const userId = req.user.id

  const teams = await Team.find({ 'members.user': userId }).select('_id members.user')
  const teamIds = teams.map((t) => t._id)

  const projects = await Project.find({ team: { $in: teamIds } }).select('_id')
  const projectIds = projects.map((p) => p._id)

  // Aggregate task counts by status across all accessible projects.
  const countsRows = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  const taskCounts = { todo: 0, in_progress: 0, done: 0 }
  for (const row of countsRows) taskCounts[row._id] = row.count

  const overdueCount = await Task.countDocuments({
    project: { $in: projectIds },
    dueDate: { $lt: now },
    status: { $ne: 'done' },
  })

  // Heatmap: due dates by day buckets (last 2 days + next 6 days).
  const heatmapBuckets = []
  const start = new Date(now)
  start.setDate(start.getDate() - 2)
  for (let i = 0; i < 9; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    day.setHours(0, 0, 0, 0)
    const next = new Date(day)
    next.setDate(day.getDate() + 1)

    const count = await Task.countDocuments({
      project: { $in: projectIds },
      dueDate: { $gte: day, $lt: next },
      status: { $ne: 'done' },
    })
    heatmapBuckets.push({
      date: day.toISOString().slice(0, 10),
      count,
    })
  }

  // "My work": tasks where user is creator or assignee.
  const myFilter = {
    project: { $in: projectIds },
    $or: [{ createdBy: userId }, { assignedTo: userId }],
  }

  const myCountsRows = await Task.aggregate([
    { $match: myFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])
  const myTaskCounts = { todo: 0, in_progress: 0, done: 0 }
  for (const row of myCountsRows) myTaskCounts[row._id] = row.count

  const myOverdue = await Task.countDocuments({
    ...myFilter,
    dueDate: { $lt: now },
    status: { $ne: 'done' },
  })

  const recentActivities = await Activity.find({ team: { $in: teamIds } })
    .sort({ createdAt: -1 })
    .limit(15)
    .populate('actor', 'name email')
    .populate('project', 'name')

  res.json({
    summary: {
      teamsCount: teams.length,
      projectsCount: projectIds.length,
      taskCounts,
      overdueCount,
      myTaskCounts,
      myOverdue,
    },
    heatmap: heatmapBuckets,
    recentActivities: recentActivities.map((a) => ({
      id: a._id,
      actor: a.actor ? { id: a.actor._id, name: a.actor.name, email: a.actor.email } : null,
      project: a.project ? { id: a.project._id, name: a.project.name } : null,
      type: a.type,
      message: a.message,
      createdAt: a.createdAt,
    })),
  })
})

// Activity feed for a single project (for the “drawer” / “activity” section).
router.get('/projects/:projectId/activity', requireAuth, async (req, res) => {
  const { projectId } = req.params
  const limit = Math.min(Number(req.query.limit ?? 30), 100)

  const project = await Project.findById(projectId).select('team name')
  if (!project) throw new HttpError(404, 'Project not found')

  await assertTeamRole(project.team, req.user.id, ['admin', 'manager', 'member', 'viewer'])

  const items = await Activity.find({ team: project.team, project: projectId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name email')

  res.json({
    activities: items.map((a) => ({
      id: a._id,
      actor: a.actor ? { id: a.actor._id, name: a.actor.name, email: a.actor.email } : null,
      type: a.type,
      message: a.message,
      createdAt: a.createdAt,
    })),
  })
})

module.exports = router

