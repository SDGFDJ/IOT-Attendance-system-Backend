import AttendanceModel from "../models/attendance.model.js";
import UserModel from "../models/user.model.js";

/* ⏰ Lecture slots */
const LECTURE_SLOTS = [
  { no: 1, start: "12:00", end: "10:40" },
  { no: 2, start: "10:40", end: "13:20" },
  { no: 3, start: "13:20", end: "14:00" },
  { no: 4, start: "14:00", end: "14:40" },
  { no: 5, start: "15:00", end: "15:40" },
  { no: 6, start: "15:40", end: "19:20" },
];

const DAY_SUBJECTS = {
  Monday: ["Physics","Math","Chemistry","English","EVS","Math"],
  Tuesday: ["Math","Physics","Hindi","Chemistry","Geography","English"],
  Wednesday:["Chemistry","Math","Physics","Hindi","EVS","P.E."],
  Thursday:["Physics","English","Math","Chemistry","Geography","Hindi"],
  Friday:["Math","Science","English","Hindi","EVS","P.E."],
  Saturday:["Physics","Math","Chemistry","English","Revision","P.E."],
};

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

    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    /* ⛔ Recess */
    if (minutesNow >= 14 * 60 + 40 && minutesNow < 15 * 60) {
      return res.json({
        success: false,
        message: "Recess time – attendance not allowed",
      });
    }

    /* 🎯 Find lecture */
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

    /* ✅ SAFE DATE */
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    /* 🔒 Duplicate protection */
    const already = await AttendanceModel.findOne({
      studentId,
      date,
      lectureNo: lectureSlot.no,
    });

    if (already) {
      return res.json({
        success: true,
        message: "Attendance already marked",
        data: already,
      });
    }

    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    const subject =
      DAY_SUBJECTS[dayName]?.[lectureSlot.no - 1] || "Unknown";

    const record = await AttendanceModel.create({
      studentId,
      date,
      lectureNo: lectureSlot.no,
      subject,
      startTime: lectureSlot.start,
      endTime: lectureSlot.end,
      status: "Present",
      deviceId: deviceId || "WEB",
    });

    return res.json({
      success: true,
      message: "Attendance marked successfully",
      data: record,
    });

  } catch (error) {
    // 🔥 Duplicate key safety
    if (error.code === 11000) {
      return res.json({
        success: true,
        message: "Attendance already marked",
      });
    }

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

