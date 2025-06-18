const express = require("express")
const router = express.Router()
const {
  getConstructionPayments,
  getConstructionPayment,
  recordConstructionPayment,
  updateConstructionPayment,
  deleteConstructionPayment,
  getRecentConstructionPayments,
  getConstructionPaymentStats,
} = require("../controller/constructionPaymentController")

// @route   GET /api/construction/sales/payments
router.get("/getall", getConstructionPayments)

// @route   GET /api/construction/sales/payments/stats
router.get("/stats", getConstructionPaymentStats)

// @route   GET /api/construction/sales/payments/recent
router.get("/recent", getRecentConstructionPayments)

// @route   GET /api/construction/sales/payments/:id
router.get("/:id", getConstructionPayment)

// @route   POST /api/construction/sales/payments
router.post("/", recordConstructionPayment)

// @route   PUT /api/construction/sales/payments/:id
router.put("/:id", updateConstructionPayment)

// @route   DELETE /api/construction/sales/payments/:id
router.delete("/:id", deleteConstructionPayment)

module.exports = router
