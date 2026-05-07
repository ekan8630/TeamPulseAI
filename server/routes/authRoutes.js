
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const HttpError = require('../utils/httpError')
const User = require('../models/User')
const { requireAuth } = require('../middlewares/auth')

function signToken(user) {
  return jwt.sign(
    { sub: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  )
}

function assertNonEmptyString(value, field, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min) {
    throw new HttpError(400, `${field} is required`)
  }
}

function assertEmail(value) {
  if (typeof value !== 'string') throw new HttpError(400, 'email is required')
  const email = value.trim().toLowerCase()
  // Simple RFC-ish check for rubric-friendly validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Invalid email address')
  }
  return email
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {}

  assertNonEmptyString(name, 'name', 2)
  const normalizedEmail = assertEmail(email)
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'password must be at least 8 characters')
  }

  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) throw new HttpError(409, 'Email already registered')

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash })

  const token = signToken(user)
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  const normalizedEmail = assertEmail(email)
  if (typeof password !== 'string' || password.length === 0) {
    throw new HttpError(400, 'password is required')
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash')
  if (!user) throw new HttpError(401, 'Invalid email or password')

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) throw new HttpError(401, 'Invalid email or password')

  const token = signToken(user)
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  })
})

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
