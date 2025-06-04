const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const purchaseOrderSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: [true, 'Branch ID is required']
  },
 branchId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Branch',
     required: [true, 'Branch ID is required']
   },
  orderDate: { type: Date, required: true },
  deliveryDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Pending", "In Transit", "Delivered", "Cancelled"],
    default: "Pending",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Overdue"],
    default: "Pending",
  },
  items: [itemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  paymentTerms: { type: String, default: "30" },
  grnGenerated: { type: Boolean, default: false },
  grnDate: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);