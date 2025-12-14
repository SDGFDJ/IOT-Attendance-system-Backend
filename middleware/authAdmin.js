import UserModel from "../models/user.model.js";

const authAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await UserModel.findById(userId);

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Permission Denied - Admin Required",
        error: true,
        success: false,
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Access Denied",
      error: true,
      success: false,
    });
  }
};

export default authAdmin;
