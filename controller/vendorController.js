const Vendor = require('../model/Vendor');
const asyncHandler = require('express-async-handler');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Public
const getVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find();
  res.status(200).json(vendors);
});

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Public
const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }
  res.status(200).json(vendor);
});

// @desc  Create new vendor
// @route POST /api/vendors
// @access Public
const createVendor = asyncHandler(async (req, res) => {
  const { name, contact, category, address } = req.body;
  if (!name || !contact || !category || !address) {
    res.status(400);
    throw new Error('All fields are required');
  }
  const vendor = await Vendor.create({ name, contact, category, address });
  res.status(201).json(vendor);
});

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Public
const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }
  const { name, contact, category, address } = req.body;
  vendor.name = name || vendor.name;
  vendor.contact = contact || vendor.contact;
  vendor.category = category || vendor.category;
  vendor.address = address || vendor.address;
  const updatedVendor = await vendor.save();
  res.status(200).json(updatedVendor);
});

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Public
const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }
  await vendor.deleteOne();
  res.status(200).json({ message: 'Vendor deleted' });
});

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
};