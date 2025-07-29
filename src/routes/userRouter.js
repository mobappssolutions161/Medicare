import express from "express";
import upload  from "../../upload.js";
const router = express.Router()
import authenticate  from "../middlewares/authMiddleware.js";

import userController from "../controllers/userController.js"
router.post("/userSignup",userController.userSignup)
router.post("/userLogin",userController.userLogin)
router.post("/changePassword/:id",userController.changePassword)
router.post("/userOtpGenerate",userController.userOtpGenerate)
router.post("/userVerifyOtp",userController.userVerifyOtp)
router.post("/userResetPassword/:id",userController.userResetPassword)
router.post("/addDoctorDetails",upload.single("personalPhoto"),userController.addDoctorDetails )
router.put("/updateDoctorDetails/:userId",upload.single("personalPhoto"),userController.updateDoctorDetails )


export default router