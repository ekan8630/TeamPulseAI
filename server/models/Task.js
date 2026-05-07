
const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: '',
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true,
  },
  dueDate: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: [],
  }],
}, { timestamps: true })

module.exports = mongoose.model('Task', TaskSchema)
