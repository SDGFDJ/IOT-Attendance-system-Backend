import express from "express";
import upload from "../middleware/multer.js"; 
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("✅ File received by Multer:", req.file);

    // ✅ Buffer से upload करने के लिए base64 बनाओ
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // ✅ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: "categories",
      resource_type: "image",
    });

    console.log("✅ Cloudinary upload result:", result);

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });

  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "File upload failed",
    });
  }
});

export default router;
