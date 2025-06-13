const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    department: String,
    designation: String,
    joiningDate: Date,
    salary: Number,
    role: String,
    leaveBalance: { type: Number, default: 12 }
});

module.exports = mongoose.model('Employee', employeeSchema);
