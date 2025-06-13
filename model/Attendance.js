const mongoose = require('mongoose');

const attendanceconstructionSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Leave'], required: true }
});

module.exports = mongoose.model('AttendanceConstruction', attendanceconstructionSchema);
