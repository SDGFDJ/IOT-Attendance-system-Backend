import express from "express";
import {
  markAttendance,
  getMonthlyAttendance,
  getDayAttendance
} from "../controllers/attendance.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// ✅ QR SCAN ROUTE (MATCH FRONTEND)
router.post("/scan", markAttendance);

router.get("/by-month/:id", auth, getMonthlyAttendance);
router.get("/by-day/:id", auth, getDayAttendance);

export default router;