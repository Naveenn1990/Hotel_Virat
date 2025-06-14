const mongoose = require('mongoose');

const PurchaseOrderConstSchema = new mongoose.Schema({
  poId: { type: String, required: true, unique: true },
  vendorId: String,
  items: [{ materialName: String, quantity: Number, price: Number }],
  totalAmount: Number,
  approvedBy: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  deliveryAddress: String,
  paymentTerms: String,
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrderConst', PurchaseOrderConstSchema);