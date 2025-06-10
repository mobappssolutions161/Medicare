import express from "express"
const router = express.Router()

import adminController from "../controllers/adminController.js"
import upload from "../../upload.js"

router.get("/getAllUsers", adminController.getAllUsers)
router.get("/getActiveDoctors", adminController.getActiveDoctors)
router.get("/getAllDoctors", adminController.getAllDoctors)
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
router.get("/getAllAppointments", adminController.getAllAppointments)
router.post("/doctorAvailability", adminController.doctorAvailability)
router.post("/appointmentByDoctorId/:doctorId", adminController.appointmentByDoctorId)
router.post("/appointmentByPatientId/:patientId", adminController.appointmentByPatientId)

router.get("/waitingAppointmentList", adminController.waitingAppointmentList)
router.post("/bookingAppointment/:appointmentId", adminController.bookingAppointment)
router.post("/changeAppointmentStatus/:appointmentId", adminController.changeAppointmentStatus)

router.post("/recordPatientVitals", adminController.recordPatientVitals)
router.get("/getPatientVitalsByPatientId/:patientId", adminController.getPatientVitalsByPatientId)
router.put("/updatePatientVitals/:vitalId", adminController.updatePatientVitals)
export default router ;