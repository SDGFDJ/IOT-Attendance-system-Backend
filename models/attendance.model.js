import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    // 🔑 Student unique ID (STU2392)
    studentId: {
      type: String,
      required: true,
      index: true,
    },

    // 📅 Attendance Date (ONLY date, no time)
    date: {
      type: Date,
      required: true,
    },

    // 🔢 Lecture Number (1–6)
    lectureNo: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },

    // 📘 Subject (OPTIONAL – backend can auto-fill)
    subject: {
      type: String,
      default: "Unknown",
      enum: [
        "Physics",
        "Chemistry",
        "Math",
        "Science",
        "Hindi",
        "English",
        "Geography",
        "EVS",
        "P.E.",
        "Revision",
        "Unknown",
      ],
    },

    // ⏰ Lecture Timing (OPTIONAL for ESP32)
    startTime: {
      type: String,
      default: "",
    },
    endTime: {
      type: String,
      default: "",
    },

    // ✅ Attendance Status
    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present",
    },

    // 🖥️ Device info (ESP32 / WEB)
    deviceId: {
      type: String,
      default: "WEB",
    },

    // ⏱️ Scan time
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 🚫 UNIQUE attendance per lecture per day
attendanceSchema.index(
  { studentId: 1, date: 1, lectureNo: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
