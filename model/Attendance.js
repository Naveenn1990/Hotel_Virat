const mongoose = require("mongoose");

const attendanceProfessionalSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Present", "Late", "Absent"],
      required: true,
    },
    checkIn: { type: String }, // e.g., "08:45 AM"
    checkOut: { type: String }, // e.g., "05:30 PM"
    hours: { type: String }, // e.g., "8h 45m"
    location: { type: String },
  },
  { timestamps: true }
);

attendanceProfessionalSchema.index(
  { employeeId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "AttendanceConstruction",
  attendanceProfessionalSchema
);
