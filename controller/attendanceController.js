
const Attendance = require("../model/attendanceModel")
const Staff = require("../model/staffModel")
const mongoose = require("mongoose")

// Helper function to check if a string is a valid ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id)
}

// Get all attendance records
exports.getAllAttendance = async (req, res) => {
  try {
    console.log("Fetching all attendance records...")

    const { date, employeeId, status, month, year } = req.query
    const query = {}

    if (date) query.date = new Date(date)
    if (employeeId) query.employeeId = employeeId
    if (status) query.status = status

    if (month && year) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      query.date = { $gte: startDate, $lte: endDate }
    }

    console.log("Query:", query)

    const attendance = await Attendance.find(query).sort({ date: -1, employeeId: 1 })
    console.log(`Found ${attendance.length} attendance records`)

    // Populate employee details with better error handling
    const attendanceWithStaff = await Promise.all(
      attendance.map(async (record) => {
        try {
          let staff = null
          
          // First try to find by employeeId (string)
          staff = await Staff.findOne({ employeeId: record.employeeId })
          
          // If not found and the record.employeeId looks like an ObjectId, try _id
          if (!staff && isValidObjectId(record.employeeId)) {
            staff = await Staff.findById(record.employeeId)
          }

          return {
            ...record.toObject(),
            employeeName: staff ? staff.name : "Unknown",
            employeeRole: staff ? staff.role : "Unknown",
          }
        } catch (error) {
          console.error("Error populating staff for record:", record._id, error.message)
          return {
            ...record.toObject(),
            employeeName: "Unknown",
            employeeRole: "Unknown",
          }
        }
      }),
    )

    console.log("Sending attendance response with", attendanceWithStaff.length, "records")

    res.status(200).json({
      success: true,
      count: attendanceWithStaff.length,
      data: attendanceWithStaff,
    })
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching attendance records",
      error: error.message,
    })
  }
}

// Get attendance by ID
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      })
    }

    res.status(200).json({
      success: true,
      data: attendance,
    })
  } catch (error) {
    console.error("Error fetching attendance record:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching attendance record",
      error: error.message,
    })
  }
}

// Create attendance record
exports.createAttendance = async (req, res) => {
  try {
    const { employeeId, date, inTime, outTime, status } = req.body

    console.log("Creating attendance with data:", req.body)

    // Validate required fields
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      })
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      })
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      })
    }

    // Find staff with better logic
    let staff = null
    
    // First try to find by _id if it's a valid ObjectId
    if (isValidObjectId(employeeId)) {
      staff = await Staff.findById(employeeId)
    }
    
    // If not found, try to find by employeeId field
    if (!staff) {
      staff = await Staff.findOne({ employeeId: employeeId })
    }

    if (!staff) {
      console.log("Staff not found for ID:", employeeId)
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      })
    }

    console.log("Found staff:", staff.name, "with employeeId:", staff.employeeId)

    // Use the staff's employeeId for consistency
    const staffEmployeeId = staff.employeeId

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      employeeId: staffEmployeeId,
      date: new Date(date),
    })

    if (existingAttendance) {
      console.log("Attendance already exists for this date")
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for this date",
      })
    }

    // Create new attendance record
    const attendance = new Attendance({
      employeeId: staffEmployeeId,
      date: new Date(date),
      inTime: status !== "Absent" ? inTime : null,
      outTime: status !== "Absent" ? outTime : null,
      status,
    })

    const savedAttendance = await attendance.save()
    console.log("Attendance created successfully:", savedAttendance)

    // Return the saved attendance with staff details
    const attendanceWithStaff = {
      ...savedAttendance.toObject(),
      employeeName: staff.name,
      employeeRole: staff.role,
    }

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: attendanceWithStaff,
    })
  } catch (error) {
    console.error("Error creating attendance record:", error)

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      })
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Attendance already exists for this employee on this date",
      })
    }

    res.status(400).json({
      success: false,
      message: "Error creating attendance record",
      error: error.message,
    })
  }
}

// Update attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const { employeeId, date, inTime, outTime, status } = req.body

    // Find staff with better logic
    let staff = null
    
    if (isValidObjectId(employeeId)) {
      staff = await Staff.findById(employeeId)
    }
    
    if (!staff) {
      staff = await Staff.findOne({ employeeId: employeeId })
    }

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      })
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        employeeId: staff.employeeId,
        date: new Date(date),
        inTime: status !== "Absent" ? inTime : null,
        outTime: status !== "Absent" ? outTime : null,
        status,
      },
      { new: true, runValidators: true },
    )

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance,
    })
  } catch (error) {
    console.error("Error updating attendance record:", error)
    res.status(400).json({
      success: false,
      message: "Error updating attendance record",
      error: error.message,
    })
  }
}

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id)

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting attendance record:", error)
    res.status(500).json({
      success: false,
      message: "Error deleting attendance record",
      error: error.message,
    })
  }
}

// Get attendance summary for an employee
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId } = req.params
    const { month, year } = req.query

    const query = { employeeId }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      query.date = { $gte: startDate, $lte: endDate }
    }

    const attendance = await Attendance.find(query)

    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter((a) => a.status === "Present").length,
      absentDays: attendance.filter((a) => a.status === "Absent").length,
      halfDays: attendance.filter((a) => a.status === "Half Day").length,
      leaveDays: attendance.filter((a) => a.status === "Leave").length,
      totalHours: attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
      totalOvertime: attendance.reduce((sum, a) => sum + (a.overtime || 0), 0),
    }

    res.status(200).json({
      success: true,
      data: summary,
    })
  } catch (error) {
    console.error("Error fetching attendance summary:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching attendance summary",
      error: error.message,
    })
  }
}
