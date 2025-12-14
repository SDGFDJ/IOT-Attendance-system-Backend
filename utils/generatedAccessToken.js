import jwt from "jsonwebtoken";

const generatedAccessToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in env");
  }

  return jwt.sign(
    { userId },                 // ✅ SAME KEY EVERYWHERE
    process.env.JWT_SECRET,
    { expiresIn: "15m" }         // short expiry (best practice)
  );
};

export default generatedAccessToken;
