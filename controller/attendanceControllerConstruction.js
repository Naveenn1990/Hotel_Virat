const Attendance = require('../model/Attendance');

exports.markAttendance = async (req, res) => {
    try {
        const attendance = new Attendance(req.body);
        await attendance.save();
        res.status(201).json(attendance);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAllAttendance = async (req, res) => {
    const records = await Attendance.find().populate('employeeId');
    res.json(records);
};

exports.updateAttendance = async (req, res) => {
    const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
};
