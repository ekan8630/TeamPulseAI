const router = require('express').Router()
const HttpError = require('../utils/httpError')
const { requireAuth } = require('../middlewares/auth')
const Team = require('../models/Team')
const User = require('../models/User')
const Activity = require('../models/Activity')
const { assertTeamRole, assertValidTeamRole } = require('../utils/rbac')

function assertNonEmptyString(value, field, min = 1, max = 200) {
  if (typeof value !== 'string') throw new HttpError(400, `${field} is required`)
  const v = value.trim()
  if (v.length < min) throw new HttpError(400, `${field} is too short`)
  if (v.length > max) throw new HttpError(400, `${field} is too long`)
  return v
}

function normalizeEmail(email) {
  if (typeof email !== 'string') throw new HttpError(400, 'email is required')
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new HttpError(400, 'Invalid email address')
  return normalized
}

// List all teams the user belongs to.
router.get('/', requireAuth, async (req, res) => {
  const teams = await Team.find({ 'members.user': req.user.id })
    .select('name createdBy members')
    .sort({ createdAt: -1 })

  res.json({
    teams: teams.map((t) => ({
      id: t._id,
      name: t.name,
      myRole: t.members.find((m) => String(m.user) === String(req.user.id))?.role ?? null,
      memberCount: t.members.length,
    })),
  })
})

// Create a team; creator becomes admin.
router.post('/', requireAuth, async (req, res) => {
  const name = assertNonEmptyString(req.body?.name, 'name', 2, 80)

  const team = await Team.create({
    name,
    createdBy: req.user.id,
    members: [{ user: req.user.id, role: 'admin' }],
  })

  await Activity.create({
    actor: req.user.id,
    team: team._id,
    type: 'TEAM_CREATED',
    message: `Team created: ${team.name}`,
  })

  res.status(201).json({
    team: {
      id: team._id,
      name: team.name,
    },
  })
})

router.get('/:teamId', requireAuth, async (req, res) => {
  const { teamId } = req.params
  const team = await Team.findById(teamId).populate('createdBy', 'name email')
  if (!team) throw new HttpError(404, 'Team not found')

  const membership = team.members.find((m) => String(m.user) === String(req.user.id))
  if (!membership) throw new HttpError(403, 'You are not a member of this team')

  res.json({
    team: {
      id: team._id,
      name: team.name,
      myRole: membership.role,
      memberCount: team.members.length,
      createdBy: team.createdBy,
    },
  })
})

router.get('/:teamId/members', requireAuth, async (req, res) => {
  const { teamId } = req.params
  const team = await Team.findById(teamId).populate('createdBy', 'name email')
  if (!team) throw new HttpError(404, 'Team not found')

  const membership = team.members.find((m) => String(m.user) === String(req.user.id))
  if (!membership) throw new HttpError(403, 'You are not a member of this team')

  const members = await User.find({ _id: { $in: team.members.map((m) => m.user) } })
    .select('name email')

  res.json({
    members: members.map((u) => {
      const role = team.members.find((m) => String(m.user) === String(u._id))?.role ?? 'member'
      return { id: u._id, name: u.name, email: u.email, role }
    }),
  })
})

// Add member by existing email.
router.post('/:teamId/members', requireAuth, async (req, res) => {
  const { teamId } = req.params
  const role = req.body?.role ?? 'member'
  assertValidTeamRole(role)

  const membership = await assertTeamRole(teamId, req.user.id, ['admin'])

  const email = normalizeEmail(req.body?.email)
  const user = await User.findOne({ email })
  if (!user) throw new HttpError(404, 'No user found with that email')

  // Prevent duplicates.
  const existing = await Team.findOne({ _id: teamId, 'members.user': user._id })
  if (existing) throw new HttpError(409, 'User is already in this team')

  const team = await Team.findById(teamId)
  team.members.push({ user: user._id, role })
  await team.save()

  await Activity.create({
    actor: req.user.id,
    team: team._id,
    type: 'TEAM_MEMBER_ADDED',
    message: `${user.email} added to ${team.name} (${role}).`,
  })

  res.status(201).json({
    member: { id: user._id, name: user.name, email: user.email, role },
  })
})

module.exports = router

