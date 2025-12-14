import sendEmail from '../config/sendEmail.js'
import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js'
import generatedAccessToken from '../utils/generatedAccessToken.js'
import genertedRefreshToken from '../utils/generatedRefreshToken.js'
import uploadImageClodinary from '../utils/uploadImageClodinary.js'
import generatedOtp from '../utils/generatedOtp.js'
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'
import jwt from 'jsonwebtoken'

export async function registerUserController(request,response){
    try {
        const { name, email , password } = request.body

        if(!name || !email || !password){
            return response.status(400).json({
                message : "provide email, name, password",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email })

        if(user){
            return response.json({
                message : "Already register email",
                error : true,
                success : false
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(password,salt)

        const payload = {
            name,
            email,
            password : hashPassword
        }

        const newUser = new UserModel(payload)
        const save = await newUser.save()

        const VerifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`

        const verifyEmail = await sendEmail({
            sendTo : email,
            subject : "Verify email from binkeyit",
            html : verifyEmailTemplate({
                name,
                url : VerifyEmailUrl
            })
        })

        return response.json({
            message : "User register successfully",
            error : false,
            success : true,
            data : save
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function verifyEmailController(request,response){
    try {
        const { code } = request.body

        const user = await UserModel.findOne({ _id : code})

        if(!user){
            return response.status(400).json({
                message : "Invalid code",
                error : true,
                success : false
            })
        }

        const updateUser = await UserModel.updateOne({ _id : code },{
            verify_email : true
        })

        return response.json({
            message : "Verify email done",
            success : true,
            error : false
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : true
        })
    }
}
// 📌 Add Student (ADMIN ONLY)
export async function addStudentController(req, res) {
  try {
    const {
      name,
      roll,
      className,
      division,
      fatherName,
      mobile,
      address,
    } = req.body;

    if (!name || !roll || !className || !division || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Please fill required fields",
      });
    }

    // Prevent duplicate roll/class
    const exist = await UserModel.findOne({ roll, className });
    if (exist) {
      return res.status(409).json({
        success: false,
        message: "Student already assigned this Roll Number",
      });
    }

    const studentId = "STU" + Math.floor(1000 + Math.random() * 9000);

    let photoUrl = "";
    if (req.file) {
      const upload = await uploadImageClodinary(req.file);
      photoUrl = upload.url;
    }

    const student = await UserModel.create({
      name,
      mobile,
      role: "STUDENT",
      studentId,
      roll,
      className,
      division,
      fatherName,
      address,
      photo: photoUrl,
      status: "Active",
    });

    res.json({
      success: true,
      message: "Student added successfully 🎉",
      data: student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


// 📌 Get All Students (ADMIN)
export async function getStudentsController(req, res) {
  try {
    const students = await UserModel.find({ role: "STUDENT" }).select("-password");

    res.json({
      success: true,
      message: "Students fetched successfully",
      data: students,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// 📌 Get Single Student Profile (ADMIN/SELF)
export async function getStudentByIdController(req, res) {
  try {
    const { id } = req.params;

    const student = await UserModel.findOne({ studentId: id }).select("-password");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      message: "Student fetched",
      data: student,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// 📌 Update Student (ADMIN)
export async function updateStudentController(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (req.file) {
      const upload = await uploadImageClodinary(req.file);
      updates.photo = upload.url;
    }

    const student = await UserModel.findOneAndUpdate(
      { studentId: id },
      updates,
      { new: true }
    ).select("-password");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      message: "Student updated successfully ✏",
      data: student,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
export async function getStudentAttendanceDayController(req, res) {
  try {
    const { id } = req.params;
    const { day, month, year } = req.query;

    const dateStart = new Date(year, month - 1, day, 0, 0, 0);
    const dateEnd = new Date(year, month - 1, day, 23, 59, 59);

    const records = await AttendanceModel.find({
      studentId: id,
      timestamp: { $gte: dateStart, $lte: dateEnd }
    });

    res.json({
      success: true,
      message: "Daily lecture attendance fetched",
      data: records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


// ❌ Delete Student (ADMIN)
export async function deleteStudentController(req, res) {
  try {
    const { id } = req.params;

    const student = await UserModel.findOneAndDelete({ studentId: id });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      message: "Student deleted successfully ❌",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


export async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const accessToken = generatedAccessToken(user._id);

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.SECRET_KEY_REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true,     // ✅ MUST on Vercel
      sameSite: "none", // ✅ cross-site
    };

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    const userData = await UserModel.findById(user._id).select("-password");

    return res.json({
      success: true,
      message: "Login successful",
      data: userData,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
}


//logout controller
export async function logoutController(request,response){
    try {
        const userid = request.userId //middleware

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.clearCookie("accessToken",cookiesOption)
        response.clearCookie("refreshToken",cookiesOption)

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userid,{
            refresh_token : ""
        })

        return response.json({
            message : "Logout successfully",
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//upload user avatar
export async  function uploadAvatar(request,response){
    try {
        const userId = request.userId // auth middlware
        const image = request.file  // multer middleware

        const upload = await uploadImageClodinary(image)
        
        const updateUser = await UserModel.findByIdAndUpdate(userId,{
            avatar : upload.url
        })

        return response.json({
            message : "upload profile",
            success : true,
            error : false,
            data : {
                _id : userId,
                avatar : upload.url
            }
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//update user details
export async function updateUserDetails(request,response){
    try {
        const userId = request.userId //auth middleware
        const { name, email, mobile, password } = request.body 

        let hashPassword = ""

        if(password){
            const salt = await bcryptjs.genSalt(10)
            hashPassword = await bcryptjs.hash(password,salt)
        }

        const updateUser = await UserModel.updateOne({ _id : userId},{
            ...(name && { name : name }),
            ...(email && { email : email }),
            ...(mobile && { mobile : mobile }),
            ...(password && { password : hashPassword })
        })

        return response.json({
            message : "Updated successfully",
            error : false,
            success : true,
            data : updateUser
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//forgot password not login
export async function forgotPasswordController(request,response) {
    try {
        const { email } = request.body 

        const user = await UserModel.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        const otp = generatedOtp()
        const expireTime = new Date() + 60 * 60 * 1000 // 1hr

        const update = await UserModel.findByIdAndUpdate(user._id,{
            forgot_password_otp : otp,
            forgot_password_expiry : new Date(expireTime).toISOString()
        })

        await sendEmail({
            sendTo : email,
            subject : "Forgot password from Binkeyit",
            html : forgotPasswordTemplate({
                name : user.name,
                otp : otp
            })
        })

        return response.json({
            message : "check your email",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//verify forgot password otp
export async function verifyForgotPasswordOtp(request,response){
    try {
        const { email , otp }  = request.body

        if(!email || !otp){
            return response.status(400).json({
                message : "Provide required field email, otp.",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        const currentTime = new Date().toISOString()

        if(user.forgot_password_expiry < currentTime  ){
            return response.status(400).json({
                message : "Otp is expired",
                error : true,
                success : false
            })
        }

        if(otp !== user.forgot_password_otp){
            return response.status(400).json({
                message : "Invalid otp",
                error : true,
                success : false
            })
        }

        //if otp is not expired
        //otp === user.forgot_password_otp

        const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            forgot_password_otp : "",
            forgot_password_expiry : ""
        })
        
        return response.json({
            message : "Verify otp successfully",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//reset the password
export async function resetpassword(request,response){
    try {
        const { email , newPassword, confirmPassword } = request.body 

        if(!email || !newPassword || !confirmPassword){
            return response.status(400).json({
                message : "provide required fields email, newPassword, confirmPassword"
            })
        }

        const user = await UserModel.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email is not available",
                error : true,
                success : false
            })
        }

        if(newPassword !== confirmPassword){
            return response.status(400).json({
                message : "newPassword and confirmPassword must be same.",
                error : true,
                success : false,
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(newPassword,salt)

        const update = await UserModel.findOneAndUpdate(user._id,{
            password : hashPassword
        })

        return response.json({
            message : "Password updated successfully.",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function refreshToken(req, res) {
  try {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.headers?.authorization?.split(" ")[1];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.SECRET_KEY_REFRESH_TOKEN
    );

    // ✅ CORRECT KEY
    const userId = decoded.userId;

    const newAccessToken = generatedAccessToken(userId);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
}

export async function userDetails(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserModel.findById(userId)
      .select("-password -refresh_token");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User details fetched",
      data: user,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}
