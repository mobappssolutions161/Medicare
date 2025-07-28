import express from "express"
const router = express.Router()

import adminController from "../controllers/adminController.js"
import upload from "../../upload.js"

router.get("/getAllUsers", adminController.getAllUsers)
router.get("/getActiveDoctors", adminController.getActiveDoctors)
router.get("/getAllStaff", adminController.getAllStaff)
router.get("/getAllNurses", adminController.getAllNurses)
router.get("/getAllDoctors", adminController.getAllDoctors)
router.delete("/deleteDoctor/:doctorId", adminController.deleteDoctor)
router.post("/changeDoctorStatus/:doctorId", adminController.changeDoctorStatus)

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
router.put("/editAppointment/:appointmentId", adminController.editAppointment)
router.put("/editAppointmentByPatientId/:appointmentId/:patientId", adminController.editAppointmentByPatientId )
router.get("/getWaitingAppointments", adminController.getWaitingAppointments)
router.get("/getConfirmedAppointments", adminController.getConfirmedAppointments)
router.get("/getUpcomingAppointment", adminController.getUpcomingAppointment)
router.delete("/deleteAppointments/:id", adminController.deleteAppointments)
router.post("/doctorAvailability", adminController.doctorAvailability)
router.post("/appointmentByDoctorId", adminController.appointmentByDoctorId)
router.post("/getAppointmentsByDate", adminController.getAppointmentsByDate)
router.post("/appointmentByPatientId/:patientId", adminController.appointmentByPatientId)

router.post("/bookingAppointment/:appointmentId", adminController.bookingAppointment)
router.post("/changeAppointmentStatus/:appointmentId", adminController.changeAppointmentStatus)
router.put("/cancelAppointmentStatus/:appointmentId", adminController.cancelAppointmentStatus)

router.post("/recordPatientVitals", adminController.recordPatientVitals)
router.get("/getPatientVitalsByPatientId/:patientId", adminController.getPatientVitalsByPatientId)
router.put("/updatePatientVitals/:vitalId", adminController.updatePatientVitals)
router.delete("/deletePatientVital/:id/:patientId", adminController.deletePatientVital)

router.post("/recordPatientDiagnosis", adminController.recordPatientDiagnosis)
router.get("/getDiagnosisByPatientId/:patientId", adminController.getDiagnosisByPatientId)

router.post("/addRxMedicine", adminController.addRxMedicine)
router.get("/getAllRxList", adminController.getAllRxList)
router.get("/getRxById/:rxId",adminController.getRxById)
router.delete("/deleteRxMedicine/:id", adminController.deleteRxMedicine)

router.post("/addCategories", adminController.addCategories)
router.get("/getAllCategories", adminController.getAllCategories)
router.put("/updateCategory/:id",adminController.updateCategory)
router.delete("/deleteCategory/:id", adminController.deleteCategory)

router.post("/addDrug", upload.single("image"), adminController.addDrug)
router.get("/getDrugs", adminController.getDrugs)
router.get("/getDrugById/:drugId", adminController.getDrugById)
router.put("/updateDrug/:drugId",upload.single("image"), adminController.updateDrug)
router.delete("/deleteDrug/:drugId", adminController.deleteDrug)

router.post("/addServices", adminController.addServices)
router.get("/getServices", adminController.getServices)

router.post("/addLabs", adminController.addLabs)
router.get("/getAllLabs", adminController.getAllLabs)
router.get("/getLabById/:labId", adminController.getLabById)
router.put("/updateLabById/:labId", adminController.updateLabById)
router.delete("/deleteLabById/:labId", adminController.deleteLabById)
router.put("/changeLabStatus/:labId", adminController.changeLabStatus)

router.post("/addLabRequest",adminController.addLabRequest)
router.get("/getLabRequestsByPatient/:patientId",adminController.getLabRequestsByPatient)
router.post("/updateLabRequestStatus/:requestId",adminController.updateLabRequestStatus)
router.post("/getLabRequestsByStatus",adminController.getLabRequestsByStatus)
router.get("/getLabRequestById/:id",adminController.getLabRequestById)
router.put("/editLabRequest/:id",adminController.editLabRequest)
router.delete("/deleteLabRequest/:id",adminController.deleteLabRequest)
router.post("/addLabRequestAttachment/:lab_request_id",upload.single('file'),adminController.addLabRequestAttachment)
router.post("/updateLabRequestAttachment/:attachment_id",upload.single('file'),adminController.updateLabRequestAttachment)
router.get("/getLabRequestAttachmentsByLabRequestId/:labRequestId",adminController.getLabRequestAttachmentsByLabRequestId)

export default router;