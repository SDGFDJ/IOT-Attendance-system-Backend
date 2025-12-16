import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    // 🔑 Student unique ID
    studentId: {
      type: String,
      required: true,
      index: true,
    },

    // 📅 Attendance Date (IST day start)
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // 🔢 Lecture Number (1–7)
    lectureNo: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },

    // 📘 Subject (DYNAMIC – NO ENUM ❗)
    subject: {
      type: String,
      required: true,
      default: "Unknown",
      trim: true,
    },

    // ⏰ Lecture Timing
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

    // 🖥️ Device info
    deviceId: {
      type: String,
      default: "WEB",
    },

    // ⏱️ Actual scan time
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 🚫 One attendance per lecture per day per student
attendanceSchema.index(
  { studentId: 1, date: 1, lectureNo: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
