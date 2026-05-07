
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const errorHandler = require('./middlewares/errorHandler')

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

if (!process.env.MONGO_URI) {
  // eslint-disable-next-line no-console
  console.warn('Missing MONGO_URI; configure server/.env before running.')
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log(err))
}

app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/teams', require('./routes/teamRoutes'))
app.use('/api/projects', require('./routes/projectRoutes'))
app.use('/api', require('./routes/taskRoutes'))
app.use('/api/dashboard', require('./routes/dashboardRoutes'))

app.get('/', (req, res) => {
  res.send('TeamPulse AI Backend Running')
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found', details: null })
})

app.use(errorHandler)
