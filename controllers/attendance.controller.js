import AttendanceModel from "../models/attendance.model.js";
import UserModel from "../models/user.model.js";

// 📌 QR Scan & Mark Attendance
export async function markAttendance(req, res) {
  try {
    const { studentId, lecture } = req.body;

    if (!lecture) {
      return res.status(400).json({ success: false, message: "Lecture missing" });
    }

    const student = await UserModel.findOne({ studentId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student Not Found" });
    }

    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const exist = await AttendanceModel.findOne({ studentId, date, lecture });

    if (exist) {
      return res.json({
        success: true,
        message: "Already Marked",
        data: exist
      });
    }

    const record = await AttendanceModel.create({
      studentId,
      date,
      lecture,
      status: "Present"
    });

    res.json({
      success: true,
      message: "Attendance Marked",
      data: record,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    const { id } = req.params;
    const { day, month, year } = req.query;

    const dateStart = new Date(year, month - 1, day, 0, 0, 0);
    const dateEnd = new Date(year, month - 1, day, 23, 59, 59);

    const records = await AttendanceModel.find({
      studentId: id,
      date: { $gte: dateStart, $lte: dateEnd }
    });

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
