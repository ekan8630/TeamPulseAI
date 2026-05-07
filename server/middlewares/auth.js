const jwt = require('jsonwebtoken')
const HttpError = require('../utils/httpError')

function requireAuth(req, _res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing or invalid authorization header')
  }

  const token = header.slice('Bearer '.length)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    }
    return next()
  } catch {
    throw new HttpError(401, 'Invalid or expired token')
  }
}

module.exports = {
  requireAuth,
}

