const mongoose = require('mongoose');

const stockInwardSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        required: true,
    },
    goodsReceiptNoteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GoodsReceiptNote",
        required: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
        required: true
    },
});

module.exports = mongoose.model("StockInward", stockInwardSchema);