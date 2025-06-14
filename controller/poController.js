const PurchaseOrder = require("../model/poModel");

const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

module.exports = {
  createPO: async (req, res) => {
    try {
      const { vendorId, items, deliveryAddress, paymentTerms } = req.body;
      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
      const po = new PurchaseOrder({
        poId: generateId("PO"),
        vendorId,
        items,
        totalAmount,
        deliveryAddress,
        paymentTerms,
        status: totalAmount > 100000 ? "pending" : "approved",
      });
      await po.save();
      res.status(201).json(po);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  approvePO: async (req, res) => {
    try {
      const { id } = req.params;
      const po = await PurchaseOrder.findOneAndUpdate(
        { poId: id },
        { status: "approved", approvedBy: "Admin" },
        { new: true }
      );
      if (!po) return res.status(404).json({ message: "PO not found" });
      res.json(po);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  rejectPO: async (req, res) => {
    try {
      const { id } = req.params;
      const po = await PurchaseOrder.findOneAndUpdate(
        { poId: id },
        { status: "rejected" },
        { new: true }
      );
      if (!po) return res.status(404).json({ message: "PO not found" });
      res.json(po);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  getPOs: async (req, res) => {
    try {
      const pos = await PurchaseOrder.find();
      res.json(pos);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};
