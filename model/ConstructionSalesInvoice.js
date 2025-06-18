// const mongoose = require("mongoose")

// const constructionInvoiceItemSchema = new mongoose.Schema({
//   workOrderId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "ConstructionWorkOrder",
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   quantity: {
//     type: Number,
//     required: true,
//   },
//   rate: {
//     type: Number,
//     required: true,
//   },
//   amount: {
//     type: Number,
//     required: true,
//   },
// })

// const constructionSalesInvoiceSchema = new mongoose.Schema(
//   {
//     invoiceNumber: {
//       type: String,
//       unique: true,
//       required: true,
//     },
//     clientId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "ConstructionClient",
//       required: true,
//     },
//     projectId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "ConstructionProject",
//       required: true,
//     },
//     invoiceDate: {
//       type: Date,
//       required: true,
//       default: Date.now,
//     },
//     dueDate: {
//       type: Date,
//       required: true,
//     },
//     items: [constructionInvoiceItemSchema],
//     subtotal: {
//       type: Number,
//       required: true,
//     },
//     taxType: {
//       type: String,
//       enum: ["IGST", "CGST_SGST"],
//       required: true,
//     },
//     taxRate: {
//       type: Number,
//       required: true,
//     },
//     taxAmount: {
//       type: Number,
//       required: true,
//     },
//     totalAmount: {
//       type: Number,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["Draft", "Sent", "Paid", "Overdue", "Cancelled"],
//       default: "Draft",
//     },
//     paymentStatus: {
//       type: String,
//       enum: ["Unpaid", "Partial", "Paid"],
//       default: "Unpaid",
//     },
//     paidAmount: {
//       type: Number,
//       default: 0,
//     },
//     outstandingAmount: {
//       type: Number,
//       required: true,
//     },
//     notes: {
//       type: String,
//     },
//   },
//   {
//     timestamps: true,
//   },
// )

// // Pre-save middleware to calculate totals
// constructionSalesInvoiceSchema.pre("save", function (next) {
//   this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0)
//   this.taxAmount = (this.subtotal * this.taxRate) / 100
//   this.totalAmount = this.subtotal + this.taxAmount
//   this.outstandingAmount = this.totalAmount - this.paidAmount

//   // Update payment status
//   if (this.paidAmount === 0) {
//     this.paymentStatus = "Unpaid"
//   } else if (this.paidAmount >= this.totalAmount) {
//     this.paymentStatus = "Paid"
//   } else {
//     this.paymentStatus = "Partial"
//   }

//   next()
// })

// // Index for faster queries
// constructionSalesInvoiceSchema.index({ clientId: 1 })
// constructionSalesInvoiceSchema.index({ invoiceDate: 1 })
// constructionSalesInvoiceSchema.index({ status: 1 })
// constructionSalesInvoiceSchema.index({ paymentStatus: 1 })

// module.exports = mongoose.model("ConstructionSalesInvoice", constructionSalesInvoiceSchema)



const mongoose = require("mongoose")

const constructionSalesInvoiceSchema = new mongoose.Schema(
  {
    // Invoice Identification
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => {
        const year = new Date().getFullYear()
        const random = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")
        return `SAL-${year}-${random}`
      },
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date()
        date.setDate(date.getDate() + 30) // 30 days from invoice date
        return date
      },
    },

    // Client Information
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConstructionClient",
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientGSTIN: {
      type: String,
      required: true,
    },
    clientAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },

    // Project Information
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConstructionProject",
      required: true,
    },
    projectName: {
      type: String,
      required: true,
    },

    // Work Orders (Multiple work orders can be in one invoice)
    workOrders: [
      {
        workOrderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ConstructionWorkOrder",
          required: true,
        },
        taskName: String,
        quantity: { type: Number, default: 1 },
        rate: { type: Number, required: true },
        amount: { type: Number, required: true },
        description: String,
      },
    ],

    // Financial Details
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },

    // GST Calculation
    gstType: {
      type: String,
      enum: ["IGST", "CGST_SGST"],
      required: true,
    },
    gstRate: {
      type: Number,
      required: true,
      default: 18, // 18% GST
    },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalGSTAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    // Total Amount
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    // Payment Information
    paymentTerms: {
      type: String,
      default: "Net 30 days",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "overdue"],
      default: "unpaid",
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    outstandingAmount: {
      type: Number,
      default: 0,
    },

    // Additional Details
    notes: String,
    termsAndConditions: {
      type: String,
      default: "Payment due within 30 days. Late payments may incur additional charges.",
    },

    // Status and Workflow
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "paid", "cancelled"],
      default: "draft",
    },
    sentDate: Date,
    viewedDate: Date,
    paidDate: Date,

    // Audit Trail
    createdBy: {
      type: String,
      required: true,
      default: "System",
    },
    updatedBy: String,

    // Company Information (for invoice header)
    companyInfo: {
      name: { type: String, default: "Your Construction Company" },
      address: String,
      gstin: String,
      phone: String,
      email: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for calculating outstanding amount
constructionSalesInvoiceSchema.virtual("calculatedOutstanding").get(function () {
  return this.totalAmount - this.paidAmount
})

// Pre-save middleware to calculate amounts
constructionSalesInvoiceSchema.pre("save", function (next) {
  // Calculate subtotal from work orders
  this.subtotal = this.workOrders.reduce((sum, wo) => sum + wo.amount, 0)

  // Calculate GST based on type
  if (this.gstType === "IGST") {
    this.igstAmount = (this.subtotal * this.gstRate) / 100
    this.cgstAmount = 0
    this.sgstAmount = 0
  } else {
    this.cgstAmount = (this.subtotal * this.gstRate) / 200 // Half of GST rate
    this.sgstAmount = (this.subtotal * this.gstRate) / 200 // Half of GST rate
    this.igstAmount = 0
  }

  this.totalGSTAmount = this.cgstAmount + this.sgstAmount + this.igstAmount
  this.totalAmount = this.subtotal + this.totalGSTAmount
  this.outstandingAmount = this.totalAmount - this.paidAmount

  // Update payment status based on amounts
  if (this.paidAmount === 0) {
    this.paymentStatus = "unpaid"
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = "paid"
    if (!this.paidDate) this.paidDate = new Date()
  } else {
    this.paymentStatus = "partial"
  }

  // Check for overdue
  if (this.paymentStatus !== "paid" && new Date() > this.dueDate) {
    this.paymentStatus = "overdue"
  }

  next()
})

// Static method to generate next invoice number
constructionSalesInvoiceSchema.statics.generateInvoiceNumber = async function () {
  const year = new Date().getFullYear()
  const prefix = `SAL-${year}-`

  const lastInvoice = await this.findOne(
    { invoiceNumber: { $regex: `^${prefix}` } },
    {},
    { sort: { invoiceNumber: -1 } },
  )

  if (!lastInvoice) {
    return `${prefix}001`
  }

  const lastNumber = Number.parseInt(lastInvoice.invoiceNumber.split("-")[2])
  const nextNumber = (lastNumber + 1).toString().padStart(3, "0")
  return `${prefix}${nextNumber}`
}

// Index for better query performance
constructionSalesInvoiceSchema.index({ clientId: 1, invoiceDate: -1 })
constructionSalesInvoiceSchema.index({ projectId: 1 })
constructionSalesInvoiceSchema.index({ paymentStatus: 1 })
constructionSalesInvoiceSchema.index({ invoiceNumber: 1 }, { unique: true })

module.exports = mongoose.model("ConstructionSalesInvoice", constructionSalesInvoiceSchema)
