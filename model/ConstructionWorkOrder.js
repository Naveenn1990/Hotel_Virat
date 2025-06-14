const mongoose = require("mongoose")

const constructionWorkOrderSchema = new mongoose.Schema(
  {
    workOrderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConstructionProject",
      required: true,
    },
    taskName: {
      type: String,
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
    unit: {
      type: String,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    totalValue: {
      type: Number,
      required: true,
    },
    assignedTo: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    estimatedHours: {
      type: Number,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "billed"],
      default: "pending",
    },
    completionDate: {
      type: Date,
    },
    completionRemarks: {
      type: String,
    },
    materials: {
      type: String,
    },
    actualHours: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
)

// Pre-save middleware to calculate total value
constructionWorkOrderSchema.pre("save", function (next) {
  this.totalValue = this.quantity * this.rate
  next()
})

// Index for faster queries
constructionWorkOrderSchema.index({ projectId: 1 })
constructionWorkOrderSchema.index({ status: 1 })
constructionWorkOrderSchema.index({ dueDate: 1 })

module.exports = mongoose.model("ConstructionWorkOrder", constructionWorkOrderSchema)
