import AttendanceModel from "../models/attendance.model.js";
import UserModel from "../models/user.model.js";

/* ============================================================
   🕒 TIME HELPERS (FINAL – NO OFFSET ❌)
============================================================ */
/* ============================================================
   🕒 TIME HELPERS (LOCAL + VERCEL SAFE)
============================================================ */
function getISTNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

function getISTDateString() {
  const d = getISTNow();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}


/* ============================================================
   ⏱️ LECTURE SLOTS (ORDER MATTERS ❗)
============================================================ */
const LECTURE_SLOTS = [
  { no: 1, start: "09:40", end: "10:20" },
  { no: 2, start: "10:20", end: "11:00" },
  { no: 3, start: "11:00", end: "11:40" },
  { no: 4, start: "11:40", end: "12:20" },
  { no: 5, start: "12:00", end: "12:40" },
  { no: 6, start: "13:00", end: "13:40" },
  { no: 7, start: "13:40", end: "14:20" },
];

/* ============================================================
   🧠 TIME → LECTURE (LATE ALLOWED ✅)
============================================================ */
function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function detectLecture(now) {
  const current = now.getHours() * 60 + now.getMinutes();

  return LECTURE_SLOTS.find(slot => {
    return current >= toMinutes(slot.start) && current <= toMinutes(slot.end);
  });
}

/* ============================================================
   📘 SUBJECTS
============================================================ */
const DAY_SUBJECTS = {
  Monday:    ["Marathi", "Maths", "Biology", "Chemistry", "Physics", "English", "P.E."],
  Tuesday:   ["Hindi", "Maths", "Biology", "Chemistry", "Physics", "English","Marathi"],
  Wednesday: ["Maths", "Hindi", "Maths", "Biology", "Physics", "English", "P.E."],
  Thursday:  ["Maths", "Hindi", "Maths", "Biology", "Physics", "English", null],
  Friday:    ["E.V.S.", "Hindi", "Maths", "Chemistry", "Physics", "English", null],
  Saturday:  ["English", "Hindi", "Maths", "Chemistry", "Physics", "E.V.S.", "ENG(T)"],
};

/* ============================================================
   🟢 MARK ATTENDANCE (FINAL BEHAVIOR)
============================================================ */
export async function markAttendance(req, res) {
  try {
    const { studentId, deviceId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: "Student ID missing" });
    }

    const student = await UserModel.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

  const now = getISTNow();
const today = getISTDateString();


    // 🎯 Detect lecture (late allowed)
    const lecture = detectLecture(now);
    if (!lecture) {
      return res.json({
        success: false,
        message: "No lecture at this time",
      });
    }

    const dayName = now.toLocaleDateString("en-IN", { weekday: "long" });
    const subject = DAY_SUBJECTS[dayName]?.[lecture.no - 1];

    if (!subject) {
      return res.json({ success: false, message: "Lecture not scheduled today" });
    }

    // 🔒 Only same lecture blocked
    const already = await AttendanceModel.findOne({
      studentId,
      lectureNo: lecture.no,
      date: today,
    });

    if (already) {
      return res.json({
        success: true,
        message: "Attendance already marked",
        data: already,
      });
    }

    // ✅ SAVE
    const record = await AttendanceModel.create({
      studentId,
      date: today,
      lectureNo: lecture.no,
      subject,
      status: "Present",
      deviceId: deviceId || "WEB",
      scannedAt: now,
    });

    return res.json({
      success: true,
      message: `Attendance marked for Lecture ${lecture.no}`,
      data: record,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
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
