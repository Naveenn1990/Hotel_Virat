const mongoose = require("mongoose")

const constructionClientSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    billingAddress: {
      type: String,
      required: true,
    },
    contactPerson: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    state: {
      type: String,
      required: true,
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ConstructionProject",
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
constructionClientSchema.index({ clientName: 1 })
constructionClientSchema.index({ gstin: 1 })
constructionClientSchema.index({ email: 1 })

module.exports = mongoose.model("ConstructionClient", constructionClientSchema)
