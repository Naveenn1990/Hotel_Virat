const mongoose = require("mongoose");

const PoSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vender ID is required"],
    },

    items: [{ materialName: String, quantity: Number, price: Number }],
    totalAmount: Number,
    approvedBy: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    deliveryAddress: String,
    paymentTerms: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PoS", PoSchema);
