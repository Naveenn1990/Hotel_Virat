const Vendor = require('../model/Vendor');

const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

module.exports = {
  addVendor: async (req, res) => {
    try {
      const { vendorName, GST, contactInfo, bankDetails, address } = req.body;
      const vendor = new Vendor({
        vendorId: generateId('VEND'),
        vendorName,
        GST,
        contactInfo,
        bankDetails,
        address
      });
      await vendor.save();
      res.status(201).json(vendor);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  updateVendor: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedVendor = await Vendor.findOneAndUpdate(
        { vendorId: id },
        req.body,
        { new: true }
      );
      if (!updatedVendor) return res.status(404).json({ message: 'Vendor not found' });
      res.json(updatedVendor);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  deleteVendor: async (req, res) => {
    try {
      const { id } = req.params;
      const vendor = await Vendor.findOneAndDelete({ vendorId: id });
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      res.json({ message: 'Vendor deleted' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  getVendors: async (req, res) => {
    try {
      const vendors = await Vendor.find();
      res.json(vendors);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};