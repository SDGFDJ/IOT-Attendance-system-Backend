import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    // 🔑 Student unique ID (STU2392)
    studentId: {
      type: String,
      required: true,
      index: true,
    },

    // 📅 Attendance Date (only date part used)
    date: {
      type: Date,
      required: true,
    },

    // 🔢 Lecture Number (1 – 6)
    lectureNo: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },

    // 📘 Subject Name
    subject: {
      type: String,
      required: true,
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

    // ⏰ Lecture Timing
    startTime: {
      type: String, // "12:00"
      required: true,
    },
    endTime: {
      type: String, // "12:40"
      required: true,
    },

    // ✅ Attendance Status
    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present",
    },

    // ⏱️ Exact scan time
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// 🚫 Prevent duplicate attendance for same lecture same day
attendanceSchema.index(
  { studentId: 1, date: 1, lectureNo: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
