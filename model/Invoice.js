const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true },
  poId: String,
  vendorId: String,
  amount: Number,
  dueDate: Date,
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
});

module.exports = mongoose.model('Invoice', InvoiceSchema);