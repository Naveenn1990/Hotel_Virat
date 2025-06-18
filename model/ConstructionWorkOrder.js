// const mongoose = require("mongoose")

// const constructionWorkOrderSchema = new mongoose.Schema(
//   {
//     workOrderNumber: {
//       type: String,
//       unique: true,
//       required: true,
//     },
//     projectId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "ConstructionProject",
//       required: true,
//     },
//     taskName: {
//       type: String,
//       required: true,
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     quantity: {
//       type: Number,
//       required: true,
//     },
//     unit: {
//       type: String,
//       required: true,
//     },
//     rate: {
//       type: Number,
//       required: true,
//     },
//     totalValue: {
//       type: Number,
//       required: true,
//     },
//     assignedTo: {
//       type: String,
//       required: true,
//     },
//     dueDate: {
//       type: Date,
//       required: true,
//     },
//     estimatedHours: {
//       type: Number,
//       required: true,
//     },
//     priority: {
//       type: String,
//       enum: ["low", "medium", "high"],
//       default: "medium",
//     },
//     status: {
//       type: String,
//       enum: ["pending", "in-progress", "completed", "billed"],
//       default: "pending",
//     },
//     completionDate: {
//       type: Date,
//     },
//     completionRemarks: {
//       type: String,
//     },
//     materials: {
//       type: String,
//     },
//     actualHours: {
//       type: Number,
//     },
//   },
//   {
//     timestamps: true,
//   },
// )

// // Pre-save middleware to calculate total value
// constructionWorkOrderSchema.pre("save", function (next) {
//   this.totalValue = this.quantity * this.rate
//   next()
// })

// // Index for faster queries
// constructionWorkOrderSchema.index({ projectId: 1 })
// constructionWorkOrderSchema.index({ status: 1 })
// constructionWorkOrderSchema.index({ dueDate: 1 })

// module.exports = mongoose.model("ConstructionWorkOrder", constructionWorkOrderSchema)





const mongoose = require("mongoose")

// Check if model already exists to prevent overwrite error
if (mongoose.models.ConstructionWorkOrder) {
  module.exports = mongoose.models.ConstructionWorkOrder
} else {
  const workOrderSchema = new mongoose.Schema(
    {
      workOrderNumber: {
        type: String,
        required: true,
        unique: true,
      },
      taskName: {
        type: String,
        required: true,
      },
      taskType: {
        type: String,
        enum: [
          "Foundation Work",
          "Framing",
          "Electrical Installation",
          "Plumbing Installation",
          "Roofing",
          "Concrete Pour",
          "Drywall Installation",
          "Flooring",
          "HVAC Installation",
          "Painting",
          "Site Preparation",
          "Excavation",
          "Masonry Work",
          "Windows & Doors",
          "Final Inspection",
          "Cleanup",
        ],
        required: true,
      },
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ConstructionProject",
        required: true,
      },
      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ConstructionClient",
        required: true,
      },
      assignedTo: {
        type: String,
        required: true,
      },
      assignedToRole: {
        type: String,
        enum: [
          "Foreman",
          "Electrician",
          "Plumber",
          "Carpenter",
          "Mason",
          "Heavy Equipment",
          "Safety Inspector",
          "General Labor",
        ],
        required: true,
      },
      dueDate: {
        type: Date,
        required: true,
      },
      // Quantity and Rate fields (required)
      quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 1,
      },
      unit: {
        type: String,
        required: true,
        enum: ["sq ft", "cu ft", "linear ft", "hours", "days", "pieces", "tons", "kg", "lbs", "each"],
        default: "hours",
      },
      rate: {
        type: Number,
        required: true,
        min: 0,
        default: 65, // Default hourly rate
      },
      totalValue: {
        type: Number,
        required: true,
        min: 0,
      },
      estimatedHours: {
        type: Number,
        required: true,
        min: 0,
      },
      actualHours: {
        type: Number,
        default: 0,
        min: 0,
      },
      status: {
        type: String,
        enum: ["pending", "in-progress", "completed", "billed", "cancelled"],
        default: "pending",
      },
      priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
      materials: {
        type: String,
        default: "To be specified",
      },
      location: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      notes: {
        type: String,
      },
      createdDate: {
        type: Date,
        default: Date.now,
      },
      startedDate: {
        type: Date,
      },
      completedDate: {
        type: Date,
      },
      billedDate: {
        type: Date,
      },
      hourlyRate: {
        type: Number,
        default: 65,
      },
      totalCost: {
        type: Number,
        default: 0,
      },
      createdBy: {
        type: String,
        default: "System",
      },
      updatedBy: {
        type: String,
      },
    },
    {
      timestamps: true,
    },
  )

  // Generate work order number before saving
  workOrderSchema.pre("save", async function (next) {
    if (this.isNew) {
      const count = await mongoose.model("ConstructionWorkOrder").countDocuments()
      this.workOrderNumber = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`
    }

    // Calculate totalValue based on quantity and rate
    this.totalValue = this.quantity * this.rate

    // Calculate total cost (can be different from totalValue)
    this.totalCost = this.estimatedHours * this.hourlyRate

    next()
  })

  // Update status dates
  workOrderSchema.pre("save", function (next) {
    if (this.isModified("status")) {
      const now = new Date()

      switch (this.status) {
        case "in-progress":
          if (!this.startedDate) {
            this.startedDate = now
          }
          break
        case "completed":
          if (!this.completedDate) {
            this.completedDate = now
          }
          break
        case "billed":
          if (!this.billedDate) {
            this.billedDate = now
          }
          break
      }
    }
    next()
  })

  module.exports = mongoose.model("ConstructionWorkOrder", workOrderSchema)
}
