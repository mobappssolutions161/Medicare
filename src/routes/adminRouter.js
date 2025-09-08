import express from "express"
const router = express.Router()

import adminController from "../controllers/adminController.js"
import upload from "../../upload.js"

// User Section

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
router.put("/UpdatePatientServices/:id", adminController.UpdatePatientServices)
router.delete("/DeletePatientService/:id", adminController.DeletePatientService)
router.post("/addPatientPharmacy/:patientId", adminController.addPatientPharmacy)
router.get("/getPharmacyByPatientId/:patientId", adminController.getPharmacyByPatientId)
router.put("/updatePatientPharmacy/:id", adminController.updatePatientPharmacy)
router.delete("/deletePatientPharmacy/:id", adminController.deletePatientPharmacy)
router.get('/getPatientServicesByPatientId/:id', adminController.getPatientServicesByPatientId);
router.get('/getPatientPharmacyByPatientId/:id', adminController.getPatientPharmacyByPatientId);
router.put("/updatePatientServicesStatus/:id", adminController.updatePatientServicesStatus)
router.put("/updatePatientPharmacyStatus/:id", adminController.updatePatientPharmacyStatus)

router.post("/createAppointment", adminController.createAppointment)
router.get("/getAllAppointments", adminController.getAllAppointments)
router.put("/editAppointment/:appointmentId", adminController.editAppointment)
router.put("/editAppointmentByPatientId/:appointmentId/:patientId", adminController.editAppointmentByPatientId )
router.get("/getWaitingAppointments", adminController.getWaitingAppointments)
router.get("/getConfirmedAppointments", adminController.getConfirmedAppointments)
router.get("/getUpcomingAppointment", adminController.getUpcomingAppointment)
router.delete("/deleteAppointments/:id", adminController.deleteAppointments)
router.post("/doctorAvailability", adminController.doctorAvailability)
router.get("/getAppointmentsByDoctorId/:doctorId", adminController.getAppointmentsByDoctorId)
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

router.post("/addICD10", adminController.addICD10)
router.get("/getAllIcd10List", adminController.getAllIcd10List)

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
router.put("/editLabServices/:labServiceId",adminController.editLabServices)
router.delete("/deleteService/:id", adminController.deleteService)

router.post("/addLabService", adminController.addLabService)
router.get("/getAllLabServices", adminController.getAllLabServices)
router.get("/getAllLabServices", adminController.getAllLabServices)
router.delete("/deleteLabService/:serviceId", adminController.deleteLabService)

router.post("/addLabs",upload.single("image"), adminController.addLabs)
router.get("/getAllLabs", adminController.getAllLabs)
router.get("/getAllActiveLabs", adminController.getAllActiveLabs)
router.get("/getLabById/:labId", adminController.getLabById)
router.put("/updateLabById/:labId", upload.single("image"),adminController.updateLabById)
router.delete("/deleteLabById/:labId", adminController.deleteLabById)
router.put("/changeLabStatus/:labId", adminController.changeLabStatus)

router.post("/addLabRequest",upload.single("file"),adminController.addLabRequest)
router.get("/getLabRequestsByPatient/:patientId",adminController.getLabRequestsByPatient)
router.post("/updateLabRequestStatus/:requestId",adminController.updateLabRequestStatus)
router.post("/getLabRequestsByStatus",adminController.getLabRequestsByStatus)
router.get("/getLabRequestById/:id",adminController.getLabRequestById)
router.put("/editLabRequest/:id",adminController.editLabRequest)
router.delete("/deleteLabRequest/:id",adminController.deleteLabRequest)
router.post("/addLabRequestAttachment/:lab_request_id",upload.single('file'),adminController.addLabRequestAttachment)
router.post("/updateLabRequestAttachment/:attachment_id",upload.single('file'),adminController.updateLabRequestAttachment)
router.get("/getLabRequestAttachmentsByLabRequestId/:labRequestId",adminController.getLabRequestAttachmentsByLabRequestId)
router.delete("/deleteLabRequestAttachment/:attachment_id",adminController.deleteLabRequestAttachment)

router.post("/serviceCategory",adminController.serviceCategory)
router.get("/getAllServiceCategories", adminController.getAllServiceCategories)
router.put("/updateServiceCategory/:categoryId",adminController.updateServiceCategory)
router.delete("/deleteServiceCategory/:categoryId", adminController.deleteServiceCategory)

router.post("/createAllergy",adminController.createAllergy)
router.get("/getAllAllergies", adminController.getAllAllergies)
router.put("/updateAllergy/:allergyId",adminController.updateAllergy)
router.delete("/deleteAllergy/:allergyId", adminController.deleteAllergy)

router.post("/addSpeciality", adminController.addSpeciality);
router.get("/getAllSpecialities", adminController.getAllSpecialities);
router.put("/updateSpecialityById/:id", adminController.updateSpecialityById); 
router.delete("/deleteSpecialityById/:id", adminController.deleteSpecialityById);


router.post('/addComplaint', adminController.addComplaint);
router.get('/getAllComplaints', adminController.getAllComplaints);
router.put('/updateComplaintById/:id', adminController.updateComplaintById);
router.delete('/deleteComplaintById/:id', adminController.deleteComplaintById);
router.post('/searchComplaints', adminController.searchComplaints);

router.post('/addPatientMedicals/:patient_id', adminController.addPatientMedicals);
router.get('/getMedicalDataWithVitals/:patient_id', adminController.getMedicalDataWithVitals);
router.get('/getAllMedicalDataByPatient/:patient_id', adminController.getAllMedicalDataByPatient);
router.post('/getMedicalRecordsByDate/:patient_id', adminController.getMedicalRecordsByDate);
router.get('/getAllMedicalData', adminController.getAllMedicalData);
router.post('/updateSingleMedicalField', adminController.updateSingleMedicalField);
router.post('/searchMedicalField', adminController.searchMedicalField);
router.get('/searchICD10', adminController.searchICD10);


router.post('/createAllTableText', adminController.createAllTableText);
router.get('/getAllTablesText', adminController.getAllTablesText);
router.put('/editAllTableText/:id', adminController.editAllTableText);
router.delete('/deleteAllTablesText/:id', adminController.deleteAllTablesText);


router.post('/addXrayReport',upload.single("attachment") , adminController.addXrayReport);
router.put('/updateXrayReport',upload.single("attachment") , adminController.updateXrayReport);
router.post('/addDiagnosis', adminController.addDiagnosis);
router.put('/updateDiagnosis', adminController.updateDiagnosis);
router.post('/addPrescription', adminController.addPrescription);
router.get('/getAllPrescriptions', adminController.getAllPrescriptions);
router.put('/updatePrescription/:id', adminController.updatePrescription);
router.get('/getPrescriptionById/:prescriptionId', adminController.getPrescriptionById);
router.post('/addChronicIllness', adminController.addChronicIllness);
router.put('/updateChronicIllness', adminController.updateChronicIllness);
router.post('/addPatientAllergy', adminController.addPatientAllergy);
router.put('/updatePatientAllergy', adminController.updatePatientAllergy);

// 🗑 Delete APIs
router.delete("/deleteXrayReport/:id",  adminController.deleteXrayReport);
router.delete("/deleteDiagnosis/:id",  adminController.deleteDiagnosis);
router.delete("/deletePrescription/:id",  adminController.deletePrescription);
router.delete("/deleteChronicIllness/:id",  adminController.deleteChronicIllness);
router.delete("/deletePatientAllergy/:id",  adminController.deletePatientAllergy);

// Insurance Section
router.post('/addInsurance', adminController.addInsurance);
router.get('/getInsurance', adminController.getInsurance);
router.put('/updateInsurance/:id', adminController.updateInsurance);
router.delete('/updateInsuranceStatus/:id', adminController.deleteInsurance);
router.put('/updateInsuranceStatus/:id', adminController.updateInsuranceStatus);

// Billing Section
router.post('/createInvoice', adminController.createInvoice);
router.get('/getAllInvoicesByPatient/:patientId', adminController.getAllInvoicesByPatient);
router.get('/getRemainingInvoices/:patientId', adminController.getRemainingInvoices);

router.post('/addPaymentInvoice', adminController.addPaymentInvoice);
router.get('/getPaymentsByPatient/:patient_id', adminController.getPaymentsByPatient);
router.get('/getPatientPaymentSummary/:patient_id', adminController.getPatientPaymentSummary);

router.get('/getAllInvoices', adminController.getAllInvoices);
router.get('/getAllPayments', adminController.getAllPayments);

router.post('/createPaymentMethod', adminController.createPaymentMethod);
router.get('/getAllPaymentMethods', adminController.getAllPaymentMethods);
router.get('/getPaymentMethodById/:id', adminController.getPaymentMethodById);
router.put('/updatePaymentMethod/:id', adminController.updatePaymentMethod);
router.delete('/deletePaymentMethod/:id', adminController.deletePaymentMethod);

router.post('/createInsuranceCompany',upload.single("company_logo"), adminController.createInsuranceCompany);
router.get('/getAllInsuranceCompanies', adminController.getAllInsuranceCompanies);
router.get('/getInsuranceCompanyById/:id', adminController.getInsuranceCompanyById);
router.put('/updateInsuranceCompany/:id',upload.single("company_logo"),adminController.updateInsuranceCompany);
router.delete('/deleteInsuranceCompany/:id', adminController.deleteInsuranceCompany);

// router.post('/createPaymentMethod', adminController.createPaymentMethod);
router.get('/getAllCurrencies', adminController.getAllCurrencies);
router.get('/getCurrencyById/:id', adminController.getCurrencyById);
// router.put('/updatePaymentMethod/:id', adminController.updatePaymentMethod);
router.delete('/deleteCurrency/:id', adminController.deleteCurrency);

router.get('/getAllDiscount', adminController.getAllDiscount);
router.put('/updateDiscount/:id', adminController.updateDiscount);

router.get('/getAllVat', adminController.getAllVat);
router.put('/updateVat/:id', adminController.updateVat);

export default router;