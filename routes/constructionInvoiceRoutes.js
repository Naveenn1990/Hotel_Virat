const express = require("express")
const router = express.Router()
const {
  getConstructionInvoices,
  getConstructionInvoice,
  createConstructionInvoice,
  updateConstructionInvoice,
  deleteConstructionInvoice,
  getConstructionOutstandingBalances,
  getConstructionInvoiceStats,
} = require("../controller/constructionInvoiceController")

// @route   GET /api/construction/sales/invoices
router.get("/", getConstructionInvoices)

// @route   GET /api/construction/sales/invoices/stats
router.get("/stats", getConstructionInvoiceStats)

// @route   GET /api/construction/sales/invoices/outstanding
router.get("/outstanding", getConstructionOutstandingBalances)

// @route   GET /api/construction/sales/invoices/:id
router.get("/:id", getConstructionInvoice)

// @route   POST /api/construction/sales/invoices
router.post("/", createConstructionInvoice)

// @route   PUT /api/construction/sales/invoices/:id
router.put("/:id", updateConstructionInvoice)

// @route   DELETE /api/construction/sales/invoices/:id
router.delete("/:id", deleteConstructionInvoice)

module.exports = router
