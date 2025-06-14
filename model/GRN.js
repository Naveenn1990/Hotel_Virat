const mongoose = require('mongoose');

const GRNSchema = new mongoose.Schema({
  grnId: { type: String, required: true, unique: true },
  poId: String,
  items: [{ materialName: String, receivedQty: Number }],
  QCstatus: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
  receivedBy: String,
  receivedDate: Date,
  remarks: String,
});

module.exports = mongoose.model('GRN', GRNSchema);