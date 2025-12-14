import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Provide token", success: false });

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) return res.status(401).json({ message: "Unauthorized access", success: false });

    const user = await UserModel.findById(decode.userId || decode._id);
    if (!user) return res.status(401).json({ message: "User not found", success: false });

    req.userId = user._id;
    req.userRole = (user.role || "USER").toUpperCase(); // ensure uppercase
    next();
  } catch (error) {
    return res.status(401).json({ message: "You are not logged in", success: false });
  }
};

export default auth;
