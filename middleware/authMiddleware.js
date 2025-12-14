import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔑 SAME KEY
    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};

