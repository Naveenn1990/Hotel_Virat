const express = require('express');
const router = express.Router();
const staffLoginController = require('../controller/staffLoginController');

// Staff Registration Routes
router.post('/register/send-otp', staffLoginController.sendOtpForStaffRegistration);
router.post('/register/resend-otp', staffLoginController.resendOtpForStaffRegistration);

// Staff Login Routes
router.post('/login/send-otp', staffLoginController.sendOtpForStaffLogin);
router.post('/verify-otp', staffLoginController.verifyOtpForStaff);
router.post('/login/resend-otp', staffLoginController.resendOtpForStaffLogin);

module.exports = router;