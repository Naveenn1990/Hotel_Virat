const mongoose = require("mongoose")

const constructionPaymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      unique: true,
      required: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConstructionSalesInvoice",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConstructionClient",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Cheque", "Bank Transfer", "UPI", "Card"],
      required: true,
    },
    referenceNumber: {
      type: String,
    },
    remarks: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Received", "Pending", "Bounced"],
      default: "Received",
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
constructionPaymentSchema.index({ invoiceId: 1 })
constructionPaymentSchema.index({ clientId: 1 })
constructionPaymentSchema.index({ paymentDate: 1 })

module.exports = mongoose.model("ConstructionPayment", constructionPaymentSchema)
