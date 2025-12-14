import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Provide name"],
    },

email: {
  type: String,
  default: null,
  index: true // Only for searching, NOT unique
},


    password: {
      type: String,
      default: null, // student may not have login
    },

    avatar: {
      type: String,
      default: "",
    },

    mobile: {
      type: String,
      default: null,
    },

    // ⭐ ROLE BASED SYSTEM
    role: {
      type: String,
      enum: ["ADMIN", "USER", "STUDENT"],
      default: "USER",
    },

    // ⭐ STUDENT DETAILS
    studentId: {
      type: String,
      unique: true, // each student must be unique
      sparse: true,
    },
    roll: { type: String, default: null },
    className: { type: String, default: null },
    division: { type: String, default: null },
    fatherName: { type: String, default: null },
    address: { type: String, default: null },
    photo: { type: String, default: "" },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

    refresh_token: { type: String, default: "" },

    // ⭐ SECURITY SYSTEM
    verify_email: { type: Boolean, default: false },
    last_login_date: { type: Date },
    forgot_password_otp: { type: String, default: "" },
    forgot_password_expiry: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
