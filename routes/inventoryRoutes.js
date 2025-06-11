const express = require("express")
const router = express.Router()
const inventoryController = require("../controller/inventoryController")

// Location inventory routes
router.get("/location/:locationId", inventoryController.getLocationInventory)
router.post("/location/:locationId", inventoryController.addToLocationInventory)
router.patch("/location/:locationId/deduct", inventoryController.deductFromLocationInventory)

// Stock transaction routes
router.get("/transactions", inventoryController.getStockTransactions)
router.post("/recipe-deduction", inventoryController.deductStockByRecipe)

// Alert routes
router.get("/alerts/low-stock", inventoryController.getLowStockAlerts)
router.get("/alerts/expiring", inventoryController.getExpiringItems)

module.exports = router
