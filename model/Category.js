const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  image: {
    type: String,
    default: null
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch ID is required']
  },
}, {
  timestamps: true
});

// Create a compound index on name and branchId
// This allows the same category name across different branches
categorySchema.index({ name: 1, branchId: 1 }, { unique: true });

module.exports = mongoose.model('Categoryy', categorySchema);