const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} = require("../controller/branchController")

// Ensure upload directory exists
// const uploadDir = path.join(__dirname, "..", "uploads", "branch")
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true })
//   console.log("Created upload directory:", uploadDir)
// }

// Configure Multer for file uploads (using memory storage for AWS upload)
const storage = multer.memoryStorage()

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed!"), false)
  }
}

const upload = multer({

  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  console.log("=== MULTER ERROR HANDLER ===");
  console.log("Error received:", err);
  console.log("Error type:", err?.constructor?.name);
  console.log("Error message:", err?.message);
  console.log("Error code:", err?.code);
  console.log("Request body:", req.body);
  console.log("Request file:", req.file);
  console.log("Request files:", req.files);
  
  if (err instanceof multer.MulterError) {
    console.log("❌ MULTER ERROR:", err.code);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ 
        success: false,
        message: "File too large. Maximum size is 5MB.",
        debug: {
          errorType: "MulterError",
          errorCode: err.code,
          limit: "5MB"
        }
      });
    }
    return res.status(400).json({ 
      success: false,
      message: err.message,
      debug: {
        errorType: "MulterError",
        errorCode: err.code
      }
    });
  } else if (err) {
    console.log("❌ GENERAL ERROR:", err.message);
    return res.status(400).json({ 
      success: false,
      message: err.message,
      debug: {
        errorType: err.constructor.name,
        errorMessage: err.message
      }
    });
  }
  console.log("✅ No multer errors, proceeding to next middleware");
  next();
}

// Routes
router.route("/").post(upload.single("image"), handleMulterError, createBranch).get(getBranches)

router
  .route("/:id")
  .get(getBranchById)
  .put(upload.single("image"), handleMulterError, updateBranch)
  .delete(deleteBranch)

module.exports = router
