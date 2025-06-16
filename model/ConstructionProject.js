const mongoose = require("mongoose")

const constructionProjectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConstructionClient",
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    budget: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "In Progress", "Completed", "On Hold"],
      default: "Active",
    },
    workOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ConstructionWorkOrder",
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
constructionProjectSchema.index({ clientId: 1 })
constructionProjectSchema.index({ status: 1 })
constructionProjectSchema.index({ startDate: 1 })

module.exports = mongoose.model("ConstructionProject", constructionProjectSchema)
