const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all routes 
app.use(cors());

// Define the rate limiter
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs 
  message: "Too many requests from this IP, please try again after 15 minutes"
});

app.use(limiter);

// Use morgan for logging
app.use(morgan('dev'));          
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "img-src": ["'self'", "data:", "http://localhost:3000", "http://localhost:3001"],
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Create upload directories if they don't exist
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Directory created: ${dirPath}`);
  }
};

createDirIfNotExists('uploads');
createDirIfNotExists('uploads/profile');
createDirIfNotExists('uploads/category');
createDirIfNotExists('uploads/menu');
createDirIfNotExists("uploads/offer");

// Serve static files from the "uploads" directory 
app.use("/uploads", express.static("uploads"));

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log("Error: ", err));

// Use Routes
const userRoutes = require("./routes/userRoutes");
const branchRoutes = require("./routes/branchRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const menuRoutes = require("./routes/menuRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const couponRoutes = require("./routes/couponRoutes");
const aboutUsRoutes = require("./routes/aboutUsRoutes");
const helpSupportRoutes = require("./routes/helpSupportRoutes");
const termsRoutes = require("./routes/termsRoutes");
const addressRoutes = require("./routes/addressRoutes");
const adminRoutes = require("./routes/adminRoutes");
const counterLoginRoutes = require("./routes/counterLoginRoutes");
const customerDetailsRoutes = require("./routes/customerDetailsRoutes");
const counterInvoiceRoutes = require("./routes/counterInvoiceRoutes");
const staffLoginRoutes = require("./routes/staffLoginRoutes");
const tableRoutes = require("./routes/tableRoutes");
const peopleSelectionRoutes = require("./routes/peopleSelectionRoutes");
const staffOrderRoutes = require("./routes/staffOrderRoutes");
const counterOrderRoutes = require("./routes/counterOrderRoutes");
const counterBillRoutes = require("./routes/counterBillRoutes");
const staffInvoiceRoutes = require("./routes/staffInvoiceRoutes");
const recipeRoutes = require("./routes/recipeRoutes"); 
const customerRoutes = require("./routes/customerRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const rawMaterialRoutes = require("./routes/rawMaterialRoutes");
const RawMaterial = require("./routes/rawMaterialRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const goodsReceiptNoteRoutes = require("./routes/goodReceipNotesRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const purchaseUserRoutes = require("./routes/purchaseUserRoutes");
const productSubmissionRoutes = require("./routes/productSubmissionRoutes");
const staffRoutes = require("./routes/staffRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const storeLocationRoutes = require("./routes/storeLocationRoutes")  
const inventoryRoutes = require("./routes/inventoryRoutes")
const stockinwardRoutes = require("./routes/stockInwardRoutes")
const leaveRoutes = require("./routes/leaveRoutes");
const siteRoutes = require("./routes/site.routes");
const EmployeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutesConstruction = require("./routes/attendanceRoutesConstruction");
const payrollRoutesConstruction = require("./routes/payrollRoutesConstruction");
const payslipRoutes = require("./routes/payslipRoutes");    
const supervisorexpenseRoutes = require("./routes/supervisorexpenseRoutes");

app.use("/hotel/user-auth", userRoutes);
app.use("/hotel/branch", branchRoutes);
app.use("/hotel/category", categoryRoutes);
app.use("/hotel/menu", menuRoutes);
app.use("/hotel/cart", cartRoutes);
app.use("/hotel/order", orderRoutes);
app.use("/hotel/coupon", couponRoutes);
app.use("/hotel/about-us", aboutUsRoutes);
app.use("/hotel/help-support", helpSupportRoutes);
app.use("/hotel/terms", termsRoutes);
app.use("/hotel/address", addressRoutes);
app.use("/hotel/admin-auth", adminRoutes);
app.use("/hotel/counter-auth", counterLoginRoutes);
app.use("/hotel/customer-details", customerDetailsRoutes);
app.use("/hotel/counter-invoice", counterInvoiceRoutes);
app.use("/hotel/staff-auth", staffLoginRoutes);
app.use("/hotel/table", tableRoutes);
app.use("/hotel/people-selection", peopleSelectionRoutes);
app.use("/hotel/staff-order", staffOrderRoutes);
app.use("/hotel/counter-order", counterOrderRoutes);
app.use("/hotel/counter-bill", counterBillRoutes);
app.use("/hotel/staff-invoice", staffInvoiceRoutes);
app.use("/hotel/raw-materials",RawMaterial)
app.use("/hotel/recipes", recipeRoutes); 
app.use("/hotel/customer", customerRoutes);
app.use("/hotel/supplier", supplierRoutes);
app.use("/hotel/purchase", purchaseRoutes);
app.use("/hotel/raw-material", rawMaterialRoutes);
app.use("/hotel/grn", goodsReceiptNoteRoutes);
app.use("/hotel/reservation", reservationRoutes);
app.use("/hotel/expense", expenseRoutes);
app.use("/construction/supervisorexpense", supervisorexpenseRoutes);



// app.use("/hotel/pending", pendingRoutes);

app.use("/hotel/purchase-user-auth", purchaseUserRoutes);
app.use("/hotel/product-submission", productSubmissionRoutes);
app.use("/hotel/hr/staff",staffRoutes);
app.use("/hotel/hr/payroll",payrollRoutes);
app.use("/hotel/hr/attendance",attendanceRoutes);
app.use("/hotel/store-location",storeLocationRoutes);
app.use("/hotel/inventory", inventoryRoutes);
app.use("/hotel/stock-inwards", stockinwardRoutes);



//Construction
app.use("/construction/leave", leaveRoutes);
app.use("/construction/site", siteRoutes);
app.use("/construction/employee", EmployeeRoutes);
app.use("/construction/attendance", attendanceRoutesConstruction);
app.use("/construction/payroll", payrollRoutesConstruction);
app.use("/construction/payslip", payslipRoutes);
// Define Port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});   
