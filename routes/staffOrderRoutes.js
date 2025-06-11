const express = require("express")
const router = express.Router()
const staffOrderController = require("../controller/staffOrderController")

// Create order after payment success
router.post("/create-after-payment", staffOrderController.createStaffOrderAfterPayment)

// Get orders by userId - NEW ROUTE (must be before /:id route)
router.get("/user/:userId", staffOrderController.getOrdersByUserId)

// Get all staff orders
router.get("/", staffOrderController.getAllStaffOrders)

// Get order statistics
router.get("/statistics", staffOrderController.getOrderStatistics)

// Get orders by payment status
router.get("/payment-status/:paymentStatus", staffOrderController.getOrdersByPaymentStatus)

// Get orders by branch
router.get("/branch/:branchId", staffOrderController.getOrdersByBranch)

// Get staff order by orderId - MUST BE BEFORE /:id route
router.get("/order/:orderId", staffOrderController.getStaffOrderByOrderId)

// Get staff order by ID
router.get("/:id", staffOrderController.getStaffOrderById)

// Update staff order status
router.put("/:id/status", staffOrderController.updateStaffOrderStatus)

// Delete staff order
router.delete("/:id", staffOrderController.deleteStaffOrder)

// Add items to existing order
router.post("/:id/items", staffOrderController.addItemsToStaffOrder)

// Get staff orders by branch and table
router.get("/branch/:branchId/table/:tableId", staffOrderController.getStaffOrdersByTable)

//update kitchen status
router.put("/updateKitchenStatus/:itemId", staffOrderController.updateKitchenStatus)

module.exports = router
