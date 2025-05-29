const Counter = require('../model/counterLoginModel');

// Generate a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for counter registration
exports.sendOtpForCounterRegistration = async (req, res) => {
  try {
    const { name, mobile } = req.body;

    if (!name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    let counter = await Counter.findOne({ mobile });
    if (counter) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    counter = new Counter({
      name,
      mobile,
      otp,
      otpExpires,
    });

    await counter.save();

    // Simulate SMS by returning OTP (replace with SMS service in production)
    res.status(200).json({ message: 'OTP sent to your mobile number', otp });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

// Send OTP for counter login
exports.sendOtpForCounterLogin = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    const counter = await Counter.findOne({ mobile });
    if (!counter) {
      return res.status(404).json({ message: 'Counter staff not found. Please register first.' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    counter.otp = otp;
    counter.otpExpires = otpExpires;
    await counter.save();

    // Simulate SMS by returning OTP (replace with SMS service in production)
    res.status(200).json({ message: 'OTP sent to your mobile number', otp });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

// Verify OTP for counter registration or login
exports.verifyOtpForCounter = async (req, res) => {
  try {
    const { mobile, otp, isRegistration } = req.body;

    const counter = await Counter.findOne({ mobile });
    if (!counter) {
      return res.status(404).json({ message: 'Counter staff not found' });
    }

    if (counter.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (counter.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Clear OTP fields after successful verification
    counter.otp = null;
    counter.otpExpires = null;
    await counter.save();

    const response = {
      message: isRegistration ? 'Counter registration successful' : 'Counter login successful',
      counter: {
        _id: counter._id,
        name: counter.name,
        mobile: counter.mobile,
      }
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};

// Resend OTP for counter registration
exports.resendOtpForCounterRegistration = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    const counter = await Counter.findOne({ mobile });
    if (!counter) {
      return res.status(404).json({ message: 'Counter staff not found. Please register first.' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    counter.otp = otp;
    counter.otpExpires = otpExpires;
    await counter.save();

    // Simulate SMS by returning OTP (replace with SMS service in production)
    res.status(200).json({ message: 'OTP resent to your mobile number', otp });
  } catch (error) {
    res.status(500).json({ message: 'Error resending OTP', error: error.message });
  }
};

// Resend OTP for counter login
exports.resendOtpForCounterLogin = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    const counter = await Counter.findOne({ mobile });
    if (!counter) {
      return res.status(404).json({ message: 'Counter staff not found. Please register first.' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    counter.otp = otp;
    counter.otpExpires = otpExpires;
    await counter.save();

    // Simulate SMS by returning OTP (replace with SMS service in production)
    res.status(200).json({ message: 'OTP resent to your mobile number', otp });
  } catch (error) {
    res.status(500).json({ message: 'Error resending OTP', error: error.message });
  }
};