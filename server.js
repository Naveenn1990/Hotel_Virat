const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all routes
app.use(cors({ origin: ['http://localhost:5173', 'https://hotelvirat.s3.amazonaws.com','https://hotelvirat.com'] })); // Vite dev aur production

// Define the rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);

// Use morgan for logging
app.use(morgan("dev"));
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       useDefaults: true,
//       directives: {
//         "img-src": [
//           "'self'",
//           "data:",
//           "http://localhost:3000",
//           "http://localhost:5173",
//           "https://hotelvirat.com",
//           "https://hotelvirat.s3.amazonaws.com"
    
//         ],
//       },
//     },
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//   })
// );

// Create upload directories if they don't exist
// const createDirIfNotExists = (dirPath) => {
//   if (!fs.existsSync(dirPath)) {
//     fs.mkdirSync(dirPath, { recursive: true });
//     console.log(`Directory created: ${dirPath}`);
//   }
// };

// createDirIfNotExists("uploads");
// createDirIfNotExists("uploads/profile");
// createDirIfNotExists("uploads/category");
// createDirIfNotExists("uploads/menu");
// createDirIfNotExists("uploads/offer");

// Serve static files from the "uploads" directory
// app.use("/uploads", express.static("uploads"));

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
const stockRoutes = require("./routes/stockInwardRoutes");
const storeLocationRoutes = require("./routes/storeLocationRoutes");
<<<<<<< HEAD

//construction
const roleRoutes = require('./routes/roleRoutes');
const configurationRoutes = require('./routes/configurationRoutes');
const employeeRoutes = require("./routes/employeeRoutes")
// const reportRoutes = require('./routes/reportRoutes');
// const salesRoutes = require('./routes/salesRoutes');
// const ClientRoutes = require("./routes/ClientRoutes")
// const reportRoutes = require('./routes/reportRoutes'); 
// const salesRoutes = require('./routes/salesRoutes');   
// const ClientRoutes = require("./routes/ClientRoutes")   
const constructionClientRoutes = require("./routes/constructionClientRoutes");
const constructionIndex = require("./routes/constructionIndex");
const constructionInvoiceRoutes = require("./routes/constructionInvoiceRoutes");
const constructionPaymentRoutes = require("./routes/constructionPaymentRoutes");
const constructionProjectRoutes = require("./routes/constructionProjectRoutes");
const constructionReportRoutes = require("./routes/constructionReportRoutes");
const constructionSettingsRoutes = require("./routes/constructionSettingsRoutes");
const leaveRoutes = require("./routes/leaveRoutes")
const attendanceRoutes = require ("./routes/attendanceRoutes")
const poRoutes = require ("./routes/poRoutes");
const Vendor = require ("./routes/vendorRoutes");
const PurchaseCons = require("./routes/purchaseConsRoutes");
const constructionWorkOrderRoutes = require("./routes/constructionSettingsRoutes");     
const attendanceConsRoutes = require ("./routes/attendanceRoutesConstruction")
const supervisorExpenseRoutes = require("./routes/supervisorexpenseRoutes");
const PayslipCons = require ("./routes/payslipRoutes")
const PayrollCons = require ("./routes/payrollRoutesConstruction")

=======
const attendanceRoutes = require("./routes/attendanceRoutes");
>>>>>>> 886543035ca2c78617358a0d2a11d9e597764df2

// hotel Routes
app.use("/api/v1/hotel/user-auth", userRoutes);
app.use("/api/v1/hotel/branch", branchRoutes);
app.use("/api/v1/hotel/category", categoryRoutes);
app.use("/api/v1/hotel/menu", menuRoutes);
app.use("/api/v1/hotel/cart", cartRoutes);
app.use("/api/v1/hotel/order", orderRoutes);
app.use("/api/v1/hotel/coupon", couponRoutes);
app.use("/api/v1/hotel/about-us", aboutUsRoutes);
app.use("/api/v1/hotel/help-support", helpSupportRoutes);
app.use("/api/v1/hotel/terms", termsRoutes);
app.use("/api/v1/hotel/address", addressRoutes);
app.use("/api/v1/hotel/admin-auth", adminRoutes);
app.use("/api/v1/hotel/counter-auth", counterLoginRoutes);
app.use("/api/v1/hotel/customer-details", customerDetailsRoutes);
app.use("/api/v1/hotel/counter-invoice", counterInvoiceRoutes);
app.use("/api/v1/hotel/staff-auth", staffLoginRoutes);
app.use("/api/v1/hotel/table", tableRoutes);
app.use("/api/v1/hotel/people-selection", peopleSelectionRoutes);
app.use("/api/v1/hotel/staff-order", staffOrderRoutes);
app.use("/api/v1/hotel/counter-order", counterOrderRoutes);
app.use("/api/v1/hotel/counter-bill", counterBillRoutes);
app.use("/api/v1/hotel/staff-invoice", staffInvoiceRoutes);
app.use("/api/v1/hotel/raw-materials", RawMaterial);
app.use("/api/v1/hotel/recipes", recipeRoutes);
app.use("/api/v1/hotel/customer", customerRoutes);
app.use("/api/v1/hotel/supplier", supplierRoutes);
app.use("/api/v1/hotel/purchase", purchaseRoutes);
app.use("/api/v1/hotel/raw-material", rawMaterialRoutes);
app.use("/api/v1/hotel/grn", goodsReceiptNoteRoutes);
app.use("/api/v1/hotel/reservation", reservationRoutes);
app.use("/api/v1/hotel/expense", expenseRoutes);
app.use("/api/v1/hotel/attendance", attendanceRoutes);

app.use("/api/v1/hotel/purchase-user-auth", purchaseUserRoutes);
app.use("/api/v1/hotel/product-submission", productSubmissionRoutes);
app.use("/api/v1/hotel/stock", stockRoutes);
app.use("/api/v1/hotel/store-location", storeLocationRoutes);

const PORT = process.env.PORT || 9000;

app.use(express.static(path.join(__dirname, 'build'))); // Change 'dist' to your frontend folder if needed

// Redirect all requests to the index.html file
// 
app.get('*', (req, res) => {
  return res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

<<<<<<< HEAD
app.use("/construction/Invoice",constructionInvoiceRoutes);
app.use("/construction/Payment",constructionPaymentRoutes);
app.use("/construction/Project",constructionProjectRoutes);
app.use("/construction/Report",constructionReportRoutes);
app.use("/construction/Settings",constructionSettingsRoutes);
app.use("/costruction/po", poRoutes);
app.use("/costruction/vendor",Vendor);
app.use("/construction/purchaseCons",PurchaseCons);
app.use("/construction/attendanceCons", attendanceConsRoutes)
app.use("/construction/payslipcons",PayslipCons);





app.use("/construction/work-orders", constructionWorkOrderRoutes)

app.use("/construction/construction-Invoice",constructionInvoiceRoutes);
app.use("/construction/construction-Payment",constructionPaymentRoutes);
app.use("/construction/construction-Project",constructionProjectRoutes);
app.use("/construction/construction-Report",constructionReportRoutes);
app.use("/construction/construction-Settings", constructionSettingsRoutes); 
app.use("/construction/supervisorexpense", supervisorExpenseRoutes);
app.use("/construction/PayrollCons",PayrollCons);



// Define Port
const PORT = process.env.PORT || 5000;
=======
// app.get("/", (req, res) => {
//   res.send("Welcome to the Hotel Management API");
// });
>>>>>>> 886543035ca2c78617358a0d2a11d9e597764df2

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});