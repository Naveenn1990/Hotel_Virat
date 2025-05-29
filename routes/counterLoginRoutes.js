const express = require('express');
const router = express.Router();
const counterLoginController = require('../controller/counterLoginController');

// Counter Registration Routes
router.post('/register/send-otp', counterLoginController.sendOtpForCounterRegistration);
router.post('/register/resend-otp', counterLoginController.resendOtpForCounterRegistration);

// Counter Login Routes
router.post('/login/send-otp', counterLoginController.sendOtpForCounterLogin);
router.post('/verify-otp', counterLoginController.verifyOtpForCounter);
router.post('/login/resend-otp', counterLoginController.resendOtpForCounterLogin);

module.exports = router;