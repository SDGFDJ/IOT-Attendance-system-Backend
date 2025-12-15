export function verifyESP32(req, res, next) {
  const apiKey =
    req.headers["x-api-key"] ||
    req.headers["X-API-KEY"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "API key missing",
    });
  }

  if (apiKey !== process.env.ESP32_API_KEY) {
    return res.status(403).json({
      success: false,
      message: "Invalid ESP32 API key",
    });
  }

  next();
}
