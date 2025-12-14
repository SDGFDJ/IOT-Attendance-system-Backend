import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "uploads/",  // 👈 Add this
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

export default upload;
