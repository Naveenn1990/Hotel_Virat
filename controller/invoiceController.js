const Invoice = require('../model/Invoice');
const GRN = require('../model/GRN');

const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

module.exports = {
  createInvoice: async (req, res) => {
    try {
      const { poId, vendorId, amount, dueDate } = req.body;
      const grn = await GRN.findOne({ poId, QCstatus: 'passed' });
      if (!grn) return res.status(400).json({ message: 'GRN not found or QC not passed' });

      const invoice = new Invoice({
        invoiceId: generateId('INV'),
        poId,
        vendorId,
        amount,
        dueDate
      });
      await invoice.save();
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};