import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  date: { type: Date, required: true },
  lecture: { type: Number, required: true }, // 1 to 4
  status: { type: String, enum: ["Present", "Absent"], default: "Present" },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, date: 1, lecture: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
