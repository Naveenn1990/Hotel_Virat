const express = require("express")
const router = express.Router()
const {
  getAllStoreLocations,
  getStoreLocationById,
  createStoreLocation,
  updateStoreLocation,
  deleteStoreLocation,
  permanentDeleteStoreLocation,
  updateItemCount,
} = require("../controller/storeLocationController")

// Middleware for authentication (you'll need to implement this based on your auth system)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    })
  }

  // Add your JWT verification logic here
  // For now, we'll assume the user is authenticated
  // You should replace this with your actual JWT verification
  req.user = { id: "user_id_here" } // Replace with actual user from token
  next()
}

// Routes
router.get("/", authenticateToken, getAllStoreLocations)
router.get("/:id", authenticateToken, getStoreLocationById)
router.post("/",  createStoreLocation)
router.put("/:id", authenticateToken, updateStoreLocation)
router.delete("/:id", authenticateToken, deleteStoreLocation)
router.delete("/:id/permanent", authenticateToken, permanentDeleteStoreLocation)
router.patch("/:id/item-count", authenticateToken, updateItemCount)

module.exports = router
