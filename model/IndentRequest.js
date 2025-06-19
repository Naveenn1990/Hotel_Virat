const mongoose = require('mongoose');

const indentRequestSchema = new mongoose.Schema({
  material: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String, 
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'delivered', 'rejected'],
    default: 'pending'
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'critical'],
    required: true
  },
  phase: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  requested: {
    type: Date,
    default: Date.now
  },
  requestedBy: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('IndentRequest', indentRequestSchema);