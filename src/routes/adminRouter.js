import express from "express"
const router = express.Router()

import adminController from "../controllers/adminController.js"
import upload from "../../upload.js"

router.get("/getAllUsers", adminController.getAllUsers)
router.get("/getActiveDoctors", adminController.getActiveDoctors)
router.get("/getAllDoctors", adminController.getAllDoctors)
router.delete("/deleteDoctor/:doctorId", adminController.deleteDoctor)

router.post("/changeUserStatus/:userId", adminController.changeUserStatus)
router.post("/softDeleteUser/:userId", adminController.softDeleteUser)

router.post("/registerPatient",upload.fields([
    {name : 'profileImage', maxCount:1 },
    {name : "cprScan", maxCount : 1},
    {name : "passportCopy", maxCount : 1}
]), adminController.registerPatient)
router.get("/getAllPatients", adminController.getAllPatients)
router.get("/getPatientById/:id", adminController.getPatientById)
router.get("/getNationalitiesList", adminController.getNationalitiesList)
router.get("/getDiagnosisList", adminController.getDiagnosisList)
router.put("/updatePatient/:patientId", upload.fields([
    
    {name : 'profileImage', maxCount:1 },
    {name : "cprScan", maxCount : 1},
    {name : "passportCopy", maxCount : 1}
])
,adminController.updatePatient)
router.delete("/deletePatient/:patientId", adminController.deletePatient)
router.post("/AddPatientServices", adminController.AddPatientServices)
router.get("/GetPatientServices/:id", adminController.GetPatientServices)

router.post("/createAppointment", adminController.createAppointment)
router.get("/getAllAppointments", adminController.getAllAppointments)
router.get("/getWaitingAppointments", adminController.getWaitingAppointments)
router.get("/getConfirmedAppointments", adminController.getConfirmedAppointments)
router.delete("/deleteAppointments/:id", adminController.deleteAppointments)
router.post("/doctorAvailability", adminController.doctorAvailability)
router.post("/appointmentByDoctorId/:doctorId", adminController.appointmentByDoctorId)
router.post("/appointmentByPatientId/:patientId", adminController.appointmentByPatientId)

router.post("/bookingAppointment/:appointmentId", adminController.bookingAppointment)
router.post("/changeAppointmentStatus/:appointmentId", adminController.changeAppointmentStatus)

router.post("/recordPatientVitals", adminController.recordPatientVitals)
router.get("/getPatientVitalsByPatientId/:patientId", adminController.getPatientVitalsByPatientId)
router.put("/updatePatientVitals/:vitalId", adminController.updatePatientVitals)

router.post("/recordPatientDiagnosis", adminController.recordPatientDiagnosis)
router.get("/getDiagnosisByPatientId/:patientId", adminController.getDiagnosisByPatientId)

router.post("/addDrug", upload.single("image"), adminController.addDrug)
router.get("/getDrugs", adminController.getDrugs)
router.put("/updateDrug/:drugId", adminController.updateDrug)

router.post("/addServices", adminController.addServices)
router.get("/getServices", adminController.getServices)

export default router;