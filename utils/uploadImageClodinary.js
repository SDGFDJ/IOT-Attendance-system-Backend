import { v2 as cloudinary } from "cloudinary";

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// Debugging: check if env variables are loading
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error("❌ Cloudinary config missing! Check your .env file.");
} else {
  console.log("✅ Cloudinary connected:", process.env.CLOUDINARY_CLOUD_NAME);
}

// ✅ Upload Function
const uploadImageCloudinary = async (file) => {
  const filePath = file?.path;
  if (!filePath) throw new Error("File path missing");

  const result = await cloudinary.uploader.upload(filePath, {
    folder: "student_profiles",
    resource_type: "auto",
  });

  return {
    url: result.secure_url,
    public_id: result.public_id
  };
};

export default uploadImageCloudinary;
