const AttendanceProfessional = require('../model/Attendance');

// Create or update today's attendance for an employee
exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, hours, location } = req.body;
    const attendance = await AttendanceProfessional.findOneAndUpdate(
      { employeeId, date },
      { status, checkIn, checkOut, hours, location },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all attendance records (optionally filter by employeeId)
exports.getAllAttendance = async (req, res) => {
  try {
    const filter = {};
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;
    const records = await AttendanceProfessional.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by ID
exports.getAttendanceById = async (req, res) => {
  try {
    const record = await AttendanceProfessional.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Attendance not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update attendance by ID
exports.updateAttendance = async (req, res) => {
  try {
    const record = await AttendanceProfessional.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Attendance not found' });
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAttendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employeeAttendance = await AttendanceProfessional.find({ employeeId });
    if (employeeAttendance && employeeAttendance.length > 0) {
      return res.status(200).json({ message: "Attendance records found", data: employeeAttendance });
    } else {
      return res.status(404).json({ message: "No attendance records found for this employee" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};