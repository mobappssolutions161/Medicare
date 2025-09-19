import express from "express";
import dashController from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/dashboard", dashController.getDashboardTotals);
router.get("/dashboard/patients/statistics", dashController.getPatientStatistics);
router.get("/dashboard/patients/gender", dashController.getPatientsByGender);
router.get("/dashboard/patients/age", dashController.getPatientsByAge);
router.get("/dashboard/patients/pie_chart", dashController.getPatientPieChartData);

router.get("/dashboard/top_services", dashController.getTopServices);
router.get("/dashboard/lab_request_stats", dashController.getLabRequestStats);

router.get("/dashboard/appointment_report", dashController.appointmentsReport);
router.get("/dashboard/lab_request_report", dashController.labRequestsReport);
router.get("/dashboard/rx_list_report", dashController.rxListReport);
router.get("/dashboard/get_inventory_report", dashController.inventoryReport);
router.get("/dashboard/insurance_claims_report", dashController.insuranceClaimsReport);

router.get("/dashboard/patients_list_report", dashController.patientsListReports);
router.get("/dashboard/patients_report_by_gender", dashController.patientsListReportsByGender);
router.get("/dashboard/patients_report_by_age", dashController.patientsListReportsByAge);
router.get("/dashboard/patients_report_test_bylabs", dashController.testByLabsReport);
router.get("/dashboard/services_mostused_report", dashController.mostUsedServicesReport);
router.get("/dashboard/chief_complaints_report", dashController.chiefComplaintsReport);
router.get("/dashboard/allergies_report", dashController.allergiesReport);
router.get("/dashboard/patients_diagnosis_report", dashController.diagnosisPatientsReport);
router.get("/dashboard/patients_xray_reports", dashController.xRayReportsExport);
router.get("/dashboard/doctors_report", dashController.doctorsReportExport);



export default router;
