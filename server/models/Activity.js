const mongoose = require('mongoose')

const ActivitySchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true,
    default: null,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true,
    default: null,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'TEAM_CREATED',
      'TEAM_MEMBER_ADDED',
      'PROJECT_CREATED',
      'TASK_CREATED',
      'TASK_UPDATED',
      'TASK_STATUS_CHANGED',
      'TASK_ASSIGNED',
    ],
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
}, { timestamps: true })

ActivitySchema.index({ team: 1, createdAt: -1 })

module.exports = mongoose.model('Activity', ActivitySchema)

