import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const uploadImageClodinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "iot-attendance",
        resource_type: "image",
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export default uploadImageClodinary;
