const HttpError = require('./httpError')
const Team = require('../models/Team')

const TEAM_ROLES = ['admin', 'manager', 'member', 'viewer']

async function getTeamMembership(teamId, userId) {
  const team = await Team.findById(teamId).select('members')
  if (!team) return null
  const membership = team.members.find((m) => String(m.user) === String(userId))
  return membership ?? null
}

async function assertTeamRole(teamId, userId, allowedRoles) {
  const membership = await getTeamMembership(teamId, userId)
  if (!membership) {
    throw new HttpError(403, 'You are not a member of this team')
  }
  if (!allowedRoles.includes(membership.role)) {
    throw new HttpError(403, 'You do not have permission for this action')
  }
  return membership
}

function assertValidTeamRole(role) {
  if (!role || !TEAM_ROLES.includes(role)) {
    throw new HttpError(400, `Invalid role. Allowed: ${TEAM_ROLES.join(', ')}`)
  }
}

module.exports = {
  TEAM_ROLES,
  assertTeamRole,
  assertValidTeamRole,
}

