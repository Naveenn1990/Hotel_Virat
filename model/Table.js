const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  number: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['available', 'reserved'],
    default: 'available',
    required: true,
  },
  image: {
    type: String,
    required: false,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Table', tableSchema);