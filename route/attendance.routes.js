import express from "express";
import {
  markAttendance,
  getMonthlyAttendance,
  getDayAttendance
} from "../controllers/attendance.controller.js";
import auth from "../middleware/auth.js";
import { verifyESP32 } from "../middleware/esp32Auth.js";

const router = express.Router();

/* =====================================================
   🟢 ESP32 / RFID DEVICE ATTENDANCE
===================================================== */
router.post(
  "/device/scan",
  verifyESP32,      // 🔐 only ESP32 allowed
  markAttendance
);

/* =====================================================
   🟢 WEB / QR SCANNER (optional)
===================================================== */
router.post(
  "/scan",
  auth,             // 🔐 logged-in user only
  markAttendance
);

/* =====================================================
   📅 MONTHLY ATTENDANCE (CALENDAR)
===================================================== */
router.get("/by-month/:id", auth, getMonthlyAttendance);

/* =====================================================
   📆 DAY WISE ATTENDANCE
===================================================== */
router.get("/by-day/:id", auth, getDayAttendance);

export default router;
