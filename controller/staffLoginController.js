const Staff = require('../model/staffLoginModel');

// Generate a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for staff registration
exports.sendOtpForStaffRegistration = async (req, res) => {
  try {
    const { name, mobile } = req.body;

    if (!name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    let staff = await Staff.findOne({ mobile });
    if (staff) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    staff = new Staff({
      name,
      mobile,
      otp,
      otpExpires,
    });

    await staff.save();

    // Simulate SMS by returning OTP (replace with SMS service in production)
    res.status(200).json({ message: 'OTP sent to your mobile number', otp });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

// Send OTP for staff login
exports.sendOtpForStaffLogin = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    const staff = await Staff.findOne({ mobile });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found. Please register first.' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    staff.otp = otp;
    staff.otpExpires = otpExpires;
    await staff.save();

    // Simulate SMS by returning OTP (replace with SMS service in production)
    res.status(200).json({ message: 'OTP sent to your mobile number', otp });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

// Verify OTP for staff registration or login
exports.verifyOtpForStaff = async (req, res) => {
  try {
    const { mobile, otp, isRegistration } = req.body;

    const staff = await Staff.findOne({ mobile });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    if (staff.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (staff.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Clear OTP fields after successful verification
    staff.otp = null;
    staff.otpExpires = null;
    await staff.save();

    const response = {
      message: isRegistration ? 'Staff registration successful' : 'Staff login successful',
      staff: {
        _id: staff._id,
        name: staff.name,
        mobile: staff.mobile,
      }
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};

// Resend OTP for staff registration
exports.resendOtpForStaffRegistration = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    const staff = await Staff.findOne({ mobile });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found. Please register first.' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    staff.otp = otp;
    staff.otpExpires = otpExpires;
    await staff.save();

    // Simulate SMS by returning OTP (replace with SMS service in production)
    res.status(200).json({ message: 'OTP resent to your mobile number', otp });
  } catch (error) {
    res.status(500).json({ message: 'Error resending OTP', error: error.message });
  }
};

// Resend OTP for staff login
exports.resendOtpForStaffLogin = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    const staff = await Staff.findOne({ mobile });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found. Please register first.' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    staff.otp = otp;
    staff.otpExpires = otpExpires;
    await staff.save();

    // Simulate SMS by returning OTP (replace with SMS service in production)
    res.status(200).json({ message: 'OTP resent to your mobile number', otp });
  } catch (error) {
    res.status(500).json({ message: 'Error resending OTP', error: error.message });
  }
};