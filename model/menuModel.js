const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    default: null
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoryy',
    required: [true, 'Category ID is required']
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch ID is required']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  lowStockAlert: {
    type: Number,
    default: 5,
    min: [0, 'Low stock alert cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscriptionPlans: [{
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Subscription price cannot be negative']
    },
    duration: {
      type: Number,
      default: null // Optional duration in cycles (e.g., 3 months = 3)
    },
    isActive: {
      type: Boolean,
      default: true
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    }
  }],
  subscriptionEnabled: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Menu', menuSchema);