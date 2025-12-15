import AttendanceModel from "../models/attendance.model.js";
import UserModel from "../models/user.model.js";

// 📌 QR Scan & Mark Attendance
export async function markAttendance(req, res) {
  try {
    const { studentId, lecture } = req.body;

    console.log("📌 QR STUDENT ID:", studentId);

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

    // 🔥 lecture optional (default auto)
const finalLecture = lecture ? Number(lecture) : 1;

    const today = new Date();
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const alreadyMarked = await AttendanceModel.findOne({
      studentId,
      date,
      lecture: finalLecture,
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
      lecture: finalLecture,
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

    const formatted = records.map(i => ({
      day: i._id.day,
      lectures: i.lectures
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


// 📌 Day Wise Lecture Attendance
export async function getDayAttendance(req, res) {
  try {
    const { id } = req.params; // id = STU2392
    const { day, month, year } = req.query;

    const dateStart = new Date(year, month - 1, day, 0, 0, 0);
    const dateEnd = new Date(year, month - 1, day, 23, 59, 59);

    const records = await AttendanceModel.find({
      studentId: id,   // ✅ CORRECT
      date: { $gte: dateStart, $lte: dateEnd },
    });

    return res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
