const express = require('express');
const router = express.Router();
const {
  createPayslip,
  getAllPayslips,
  getPayslipById,
  updatePayslip,
  deletePayslip
} = require('../controller/payslipController');

// Create a new payslip
router.post('/', createPayslip);

// Get all payslips
router.get('/', getAllPayslips);

// Get a single payslip by ID
router.get('/:id', getPayslipById);

// Update a payslip by ID
router.put('/:id', updatePayslip);

// Delete a payslip by ID
router.delete('/:id', deletePayslip);

module.exports = router;