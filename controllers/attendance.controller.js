import AttendanceModel from "../models/attendance.model.js";
import UserModel from "../models/user.model.js";
// ⏰ Lecture Time Table
const LECTURE_SLOTS = [
  { no: 1, start: "12:00", end: "12:40" },
  { no: 2, start: "12:40", end: "13:20" },
  { no: 3, start: "13:20", end: "14:00" },
  { no: 4, start: "14:00", end: "14:40" },
  // Recess 14:40–15:00
  { no: 5, start: "15:00", end: "15:40" },
  { no: 6, start: "15:40", end: "16:20" },
];

// 📘 Day wise subjects
const DAY_SUBJECTS = {
  Monday:    ["Physics", "Math", "Chemistry", "English", "EVS", "P.E."],
  Tuesday:  ["Math", "Physics", "Hindi", "Chemistry", "Geography", "English"],
  Wednesday:["Chemistry", "Math", "Physics", "Hindi", "EVS", "P.E."],
  Thursday: ["Physics", "English", "Math", "Chemistry", "Geography", "Hindi"],
  Friday:   ["Math", "Science", "English", "Hindi", "EVS", "P.E."],
  Saturday: ["Physics", "Math", "Chemistry", "English", "Revision", "P.E."],
};


// 📌 QR Scan & Mark Attendance
export async function markAttendance(req, res) {
  try {
    const { studentId } = req.body;

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

    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    // ⛔ Recess block (2:40 – 3:00)
    if (minutesNow >= 14 * 60 + 40 && minutesNow < 15 * 60) {
      return res.json({
        success: false,
        message: "Recess time – attendance not allowed",
      });
    }

    // 🎯 Find current lecture
    const lectureSlot = LECTURE_SLOTS.find(slot => {
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

    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    const subject =
      DAY_SUBJECTS[dayName]?.[lectureSlot.no - 1] || "Unknown";

    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const alreadyMarked = await AttendanceModel.findOne({
      studentId,
      date,
      lectureNo: lectureSlot.no,
    });

    if (alreadyMarked) {
      return res.json({
        success: true,
        message: "Already marked",
        data: alreadyMarked,
      });
    }

    const record = await AttendanceModel.create({
      studentId,
      date,
      lectureNo: lectureSlot.no,
      subject,
      startTime: lectureSlot.start,
      endTime: lectureSlot.end,
      status: "Present",
    });

    return res.json({
      success: true,
      message: "Attendance marked successfully",
      data: record,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// 📌 Monthly Attendance Data for Calendar
export async function getMonthlyAttendance(req, res) {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const records = await AttendanceModel.aggregate([
      { $match: { studentId: id, date: { $gte: start, $lte: end } }},
      {
        $group: {
          _id: { day: { $dayOfMonth: "$date" }},
          lectures: { $sum: 1 },
        }
      }
    ]);

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


// 📌 Day Wise Lecture Attendance
export async function getDayAttendance(req, res) {
  try {
    const { id } = req.params;

    const day = Number(req.query.day);
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    const dateStart = new Date(year, month - 1, day, 0, 0, 0);
    const dateEnd = new Date(year, month - 1, day, 23, 59, 59);

    const records = await AttendanceModel.find({
      studentId: id,
      date: { $gte: dateStart, $lte: dateEnd },
    }).sort({ lectureNo: 1 });

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

