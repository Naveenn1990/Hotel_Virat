const mongoose = require("mongoose")

const sOrderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: String, // Changed to String to match frontend item IDs
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity cannot be less than 1"],
  },
  image: {
    type: String, // Added to store image path
    required: false,
  },
  description: {
    type: String, // Added to store item description
    required: false,
  },
  kitchenStatus: {
    type: String,
    enum: ["Received","Start Cooking", "Mark Ready", "Ready for Pickup", "Served"],
    default: "Received", // Since order is created after payment success
  },
})

const staffOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffLogin", // Reference to StaffLogin model
      required: [true, "User ID is required"],
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
    },
    branchName: {
      type: String,
      required: true, // Store branch name for easy access
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: [true, "Table ID is required"],
    },
    tableNumber: {
      type: String,
      required: true,
    },
    peopleCount: {
      type: Number,
      required: true,
      min: [1, "People count cannot be less than 1"],
    },
    items: [sOrderItemSchema],
    status: {
      type: String,
      enum: ["pending", "preparing", "served", "completed", "cancelled"],
      default: "pending",
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    serviceCharge: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed", // Since order is created after payment success
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "cash", "wallet"],
      required: true,
    },
    // NEW FIELD ADDED - to track when payment was last updated
    paymentUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    orderTime: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

// Add indexes for faster queries
staffOrderSchema.index({ userId: 1 })
staffOrderSchema.index({ orderId: 1 })
staffOrderSchema.index({ branchId: 1, tableId: 1 })
staffOrderSchema.index({ branchName: 1, tableNumber: 1 })
staffOrderSchema.index({ status: 1 })
staffOrderSchema.index({ paymentStatus: 1 }) // NEW INDEX ADDED
staffOrderSchema.index({ paymentMethod: 1 }) // NEW INDEX ADDED

module.exports = mongoose.model("StaffOrder", staffOrderSchema)
