import express from "express";
import {
  markAttendance,
  getMonthlyAttendance,
  getDayAttendance
} from "../controllers/attendance.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * 📌 QR SCAN
 * 🔓 No auth (ESP32 / Scanner device)
 * Body: { studentId, lecture? }
 */
router.post("/scan", markAttendance);

/**
 * 📅 Monthly attendance (Calendar)
 * 🔐 Auth required
 * Params: :id = studentId (STU2392)
 * Query: month, year
 */
router.get("/by-month/:id", auth, getMonthlyAttendance);

/**
 * 📆 Day-wise lecture attendance
 * 🔐 Auth required
 * Params: :id = studentId (STU2392)
 * Query: day, month, year
 */
router.get("/by-day/:id", auth, getDayAttendance);

export default router;
