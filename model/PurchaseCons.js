const mongoose = require('mongoose');

const purchaseConsSchema = new mongoose.Schema({
  poNumber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoS', // <-- Corrected model name
    required: [true, 'PoS ID is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  status: {
    type: String,
    enum: ['completed', 'in-transit'],
    required: [true, 'Status is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseCons', purchaseConsSchema);