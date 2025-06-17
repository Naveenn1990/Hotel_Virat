const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  vendorId: { type: String, required: true, unique: true },
  vendorName: { type: String, required: true },
  GST: String,
  contactInfo: {
    email: String,
    phone: String,
    contactPerson: String
  },
  Category: String,
  bankDetails: {
    accountNumber: String,
    IFSC: String,
    bankName: String
  },
  address: String,
}, { timestamps: true });

module.exports = mongoose.model('Vendor', VendorSchema);