const express = require("express")
const router = express.Router()
const productSubmissionController = require("../controller/productSubmissionController")
const multer = require("multer")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on file type
    const destination = file.fieldname === "qrCode" ? "uploads/qr-codes" : "uploads/payment-images"
    cb(null, destination)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname)
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// Submission routes
router.post("/", productSubmissionController.createSubmission)
router.get("/", productSubmissionController.getAllSubmissions) // Admin route to get all submissions
router.get("/user/:userPhone", productSubmissionController.getUserSubmissions)
router.get("/approved/:userPhone", productSubmissionController.getApprovedSubmissions)
router.get("/stats", productSubmissionController.getSubmissionStats)
router.get("/:submissionId", productSubmissionController.getSubmissionById)

// Status and approval routes
router.put("/status/:submissionId", productSubmissionController.updateSubmissionStatus)
router.put("/:submissionId/approve", productSubmissionController.approveSubmission)
router.put("/:submissionId/reject", productSubmissionController.rejectSubmission)
router.put("/:submissionId/complete", productSubmissionController.completeSubmission)

// File upload routes
router.post("/qr-upload/:submissionId", upload.single("qrCode"), productSubmissionController.uploadQRCode)
router.post(
  "/:submissionId/upload-payment-image",
  upload.single("paymentImage"),
  productSubmissionController.uploadPaymentImage,
)

// Delete route
router.delete("/:submissionId", productSubmissionController.deleteSubmission)

module.exports = router
