import jwt from "jsonwebtoken";

const generatedAccessToken = async (userId) => {
    console.log("🔑 Inside AccessToken util, JWT_SECRET:", process.env.JWT_SECRET);  // Debug line

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing in env");
    }

    return jwt.sign(
        { _id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

export default generatedAccessToken;
