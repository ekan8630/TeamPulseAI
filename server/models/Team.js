const mongoose = require('mongoose')

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member', 'viewer'],
      required: true,
      default: 'member',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, { timestamps: true })

TeamSchema.index({ 'members.user': 1 })

module.exports = mongoose.model('Team', TeamSchema)

