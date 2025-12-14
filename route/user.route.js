import { Router } from 'express';
import {
  registerUserController,
  verifyEmailController,
  loginController,
  logoutController,
  uploadAvatar,
  updateUserDetails,
  forgotPasswordController,
  verifyForgotPasswordOtp,
  resetpassword,
  refreshToken,
  userDetails,
  addStudentController,
  getStudentsController,
  getStudentByIdController,
  updateStudentController,
  deleteStudentController
} from '../controllers/user.controller.js';

import auth from '../middleware/auth.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';

const userRouter = Router();

// USER AUTH
userRouter.post('/register', registerUserController);
userRouter.post('/verify-email', verifyEmailController);
userRouter.post('/login', loginController);
userRouter.get('/logout', auth, logoutController);

// USER PROFILE
userRouter.put('/upload-avatar', auth, upload.single('avatar'), uploadAvatar);
userRouter.put('/update-user', auth, updateUserDetails);
userRouter.get('/user-details', auth, userDetails);

// PASSWORD RESET
userRouter.put('/forgot-password', forgotPasswordController);
userRouter.put('/verify-forgot-password-otp', verifyForgotPasswordOtp);
userRouter.put('/reset-password', resetpassword);

// TOKEN
userRouter.post('/refresh-token', refreshToken);

// 👇 Student CRUD (Admin Only)
userRouter.post('/students', auth, upload.single('photo'), addStudentController);
userRouter.get('/students', auth, getStudentsController);
userRouter.get('/students/:id', auth, getStudentByIdController);
userRouter.put('/students/:id', auth, upload.single('photo'), updateStudentController);
userRouter.delete('/students/:id', auth, deleteStudentController);

export default userRouter;
