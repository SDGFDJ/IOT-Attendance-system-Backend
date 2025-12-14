import uploadImageClodinary from "../utils/uploadImageClodinary.js";

const uploadImageController = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
        error: true,
        success: false,
      });
    }

    const uploadImage = await uploadImageClodinary(file);

    return res.json({
      message: "Upload done",
      data: uploadImage,
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export default uploadImageController;
