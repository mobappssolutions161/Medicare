import express from "express"
const router = express.Router()

import adminController from "../controllers/adminController.js"
import upload from "../../upload.js"

router.get("/getAllUsers", adminController.getAllUsers)
router.get("/getActiveDoctors", adminController.getActiveDoctors)
router.post("/changeUserStatus/:userId", adminController.changeUserStatus)
router.post("/softDeleteUser/:userId", adminController.softDeleteUser)
router.post("/registerPatient",upload.fields([
    {name : 'profileImage', maxCount:1 },
    {name : "cprScan", maxCount : 1},
    {name : "passportCopy", maxCount : 1}
]), adminController.registerPatient)
router.get("/getAllPatients", adminController.getAllPatients)
router.put("/updatePatient/:patientId", upload.fields([
    
    {name : 'profileImage', maxCount:1 },
    {name : "cprScan", maxCount : 1},
    {name : "passportCopy", maxCount : 1}
])
,adminController.updatePatient)
router.delete("/deletePatient/:patientId", adminController.deletePatient)
router.post("/createAppointment", adminController.createAppointment)
router.post("/doctorAvailability", adminController.doctorAvailability)
router.post("/appointmentByDoctorId/:doctorId", adminController.appointmentByDoctorId)

export default router 