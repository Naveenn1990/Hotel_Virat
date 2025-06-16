const mongoose = require("mongoose")

const constructionInvoiceItemSchema = new mongoose.Schema({
  workOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ConstructionWorkOrder",
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
})

const constructionSalesInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConstructionClient",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConstructionProject",
      required: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    items: [constructionInvoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    taxType: {
      type: String,
      enum: ["IGST", "CGST_SGST"],
      required: true,
    },
    taxRate: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Overdue", "Cancelled"],
      default: "Draft",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partial", "Paid"],
      default: "Unpaid",
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    outstandingAmount: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

// Pre-save middleware to calculate totals
constructionSalesInvoiceSchema.pre("save", function (next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0)
  this.taxAmount = (this.subtotal * this.taxRate) / 100
  this.totalAmount = this.subtotal + this.taxAmount
  this.outstandingAmount = this.totalAmount - this.paidAmount

  // Update payment status
  if (this.paidAmount === 0) {
    this.paymentStatus = "Unpaid"
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = "Paid"
  } else {
    this.paymentStatus = "Partial"
  }

  next()
})

// Index for faster queries
constructionSalesInvoiceSchema.index({ clientId: 1 })
constructionSalesInvoiceSchema.index({ invoiceDate: 1 })
constructionSalesInvoiceSchema.index({ status: 1 })
constructionSalesInvoiceSchema.index({ paymentStatus: 1 })

module.exports = mongoose.model("ConstructionSalesInvoice", constructionSalesInvoiceSchema)
