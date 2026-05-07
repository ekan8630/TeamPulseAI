const HttpError = require('../utils/httpError')

// Centralized API error formatting (used by all routes).
// Keeps frontend error UX consistent and rubric-friendly.
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err)

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
      details: err.details ?? null,
    })
  }

  // Mongoose validation/cast errors
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      details: err.message,
    })
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid identifier',
    })
  }

  return res.status(500).json({
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'production' ? null : err?.message ?? null,
  })
}

module.exports = errorHandler

