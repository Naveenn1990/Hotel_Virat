const express = require("express")
const router = express.Router()
const {
  getConstructionWorkOrders,
  getConstructionWorkOrder,
  createConstructionWorkOrder,
  updateConstructionWorkOrder,
  updateConstructionWorkOrderStatus,
  deleteConstructionWorkOrder,
  getConstructionWorkOrdersReadyForBilling,
  getConstructionWorkOrderStats,
} = require("../controller/constructionWorkOrderController")

// @route   GET /api/construction/sales/work-orders
router.get("/", getConstructionWorkOrders)

// @route   GET /api/construction/sales/work-orders/stats
router.get("/stats", getConstructionWorkOrderStats)

// @route   GET /api/construction/sales/work-orders/ready-for-billing
router.get("/ready-for-billing", getConstructionWorkOrdersReadyForBilling)

// @route   GET /api/construction/sales/work-orders/:id
router.get("/:id", getConstructionWorkOrder)

// @route   POST /api/construction/sales/work-orders
router.post("/", createConstructionWorkOrder)

// @route   PUT /api/construction/sales/work-orders/:id
router.put("/:id", updateConstructionWorkOrder)

// @route   PATCH /api/construction/sales/work-orders/:id/status
router.patch("/:id/status", updateConstructionWorkOrderStatus)

// @route   DELETE /api/construction/sales/work-orders/:id
router.delete("/:id", deleteConstructionWorkOrder)

module.exports = router
