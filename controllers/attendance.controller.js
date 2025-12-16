import AttendanceModel from "../models/attendance.model.js";
import UserModel from "../models/user.model.js";

/* ============================================================
   🕒 TIME HELPERS (ABSOLUTE SAFE – NO localeString ❌)
   Rule: Date internally UTC, calculation IST offset se
============================================================ */
const IST_OFFSET_MS = 330 * 60 * 1000; // +5:30

function getISTNow() {
  const nowUTC = new Date();
  return new Date(nowUTC.getTime() + IST_OFFSET_MS);
}

function getISTDayRange() {
  const istNow = getISTNow();

  const start = new Date(istNow);
  start.setHours(0, 0, 0, 0);

  const end = new Date(istNow);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/* ================= LECTURE SLOTS ================= */
const LECTURE_SLOTS = [
  { no: 1, start: "12:00", end: "12:40" },
  { no: 2, start: "12:40", end: "13:20" },
  { no: 3, start: "13:20", end: "14:00" },
  { no: 4, start: "14:00", end: "14:40" },
  { no: 5, start: "15:00", end: "15:40" },
  { no: 6, start: "15:40", end: "16:20" },
  { no: 7, start: "16:20", end: "17:00" },
];

/* ================= D DIVISION SUBJECTS ================= */
const DAY_SUBJECTS = {
  Monday:    ["P.E.", "Marathi/Hindi", "Maths/Geo", "Biology", "Chemistry", "English", null],
  Tuesday:   ["Marathi/Hindi", "Marathi/Hindi", "Maths/Geo", "Biology", "Chemistry", "English", null],
  Wednesday: ["Maths/Geo", "Marathi/Hindi", "Maths/Geo", "Biology", "Physics", "English", "P.E."],
  Thursday:  ["Maths/Geo", "Marathi/Hindi", "Maths/Geo", "Biology", "Physics", "English", null],
  Friday:    ["E.V.S.", "Marathi/Hindi", "Maths/Geo", "Chemistry", "Physics", "English", null],
  Saturday:  ["English", "Marathi/Hindi", "Maths/Geo", "Chemistry", "Physics", "E.V.S.", "ENG(T)"],
};

/* ============================================================
   🟢 MARK ATTENDANCE (WEB + ESP32)
============================================================ */
export async function markAttendance(req, res) {
  try {
    const { studentId, deviceId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID missing",
      });
    }

    const student = await UserModel.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    /* 🕒 IST time */
    const now = getISTNow();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    /* ⛔ Recess */
    if (minutesNow >= 14 * 60 + 40 && minutesNow < 15 * 60) {
      return res.json({
        success: false,
        message: "Recess time – attendance not allowed",
      });
    }

    /* 🎯 Lecture slot */
    const lectureSlot = LECTURE_SLOTS.find((slot) => {
      const [sh, sm] = slot.start.split(":").map(Number);
      const [eh, em] = slot.end.split(":").map(Number);
      return minutesNow >= sh * 60 + sm && minutesNow < eh * 60 + em;
    });

    if (!lectureSlot) {
      return res.json({
        success: false,
        message: "Not in lecture time",
      });
    }

    /* 📅 Day name (IST safe) */
    const dayName = now.toLocaleDateString("en-IN", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });

    const subject = DAY_SUBJECTS[dayName]?.[lectureSlot.no - 1];
    if (!subject) {
      return res.json({
        success: false,
        message: "No lecture scheduled now",
      });
    }

    /* 📅 IST DAY RANGE */
    const { start, end } = getISTDayRange();

    /* 🔒 Duplicate protection */
    const already = await AttendanceModel.findOne({
      studentId,
      lectureNo: lectureSlot.no,
      date: { $gte: start, $lte: end },
    });

    if (already) {
      return res.json({
        success: true,
        message: "Attendance already marked",
        data: already,
      });
    }

    /* ✅ Save attendance */
    const record = await AttendanceModel.create({
      studentId,
      date: start,        // IST day start (stored in UTC safely)
      lectureNo: lectureSlot.no,
      subject,
      startTime: lectureSlot.start,
      endTime: lectureSlot.end,
      status: "Present",
      deviceId: deviceId || "WEB",
      scannedAt: now,     // exact IST scan time
    });

    return res.json({
      success: true,
      message: "Attendance marked successfully",
      data: record,
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.json({
        success: true,
        message: "Attendance already marked",
      });
    }

    console.error("Attendance Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/* ============================================================
   📌 MONTHLY ATTENDANCE
============================================================ */
export async function getMonthlyAttendance(req, res) {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const records = await AttendanceModel.aggregate([
      { $match: { studentId: id, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { day: { $dayOfMonth: "$date" } },
          lectures: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   📌 DAY-WISE ATTENDANCE
============================================================ */
export async function getDayAttendance(req, res) {
  try {
    const { id } = req.params;
    const { day, month, year } = req.query;

    const dateStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const dateEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

    const records = await AttendanceModel.find({
      studentId: id,
      date: { $gte: dateStart, $lte: dateEnd },
    }).sort({ lectureNo: 1 });

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
