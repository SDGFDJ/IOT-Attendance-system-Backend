import express from "express";
import { markAttendance, getMonthlyAttendance, getDayAttendance } from "../controllers/attendance.controller.js";
import auth from "../middleware/auth.js";
import authAdmin from "../middleware/authAdmin.js";

const router = express.Router();

router.post("/scan", markAttendance); 
router.get("/by-month/:id", auth, getMonthlyAttendance);
router.get("/by-day/:id", auth, getDayAttendance);

export default router;
