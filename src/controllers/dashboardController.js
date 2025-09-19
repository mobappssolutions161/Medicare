import pool from "../config/db.js";
import ExcelJS from "exceljs";


const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

const getDashboardTotals = async (req, res) => {
    try {
        const { filter } = req.query; // today | weekly | monthly | all

        // default WHERE conditions (no filter)
        let patientWhere = "";
        let appointmentWhere = "";
        let invoiceWhere = "";
        let paymentInvoiceWhere = "";

        if (filter === "today") {
            patientWhere = "WHERE DATE(createdAt) = CURDATE()";
            appointmentWhere = "WHERE DATE(appointmentDate) = CURDATE()";
            invoiceWhere = "WHERE DATE(invoice_date) = CURDATE()";
            paymentInvoiceWhere = "WHERE DATE(payment_date) = CURDATE()";
        } else if (filter === "weekly") {
            patientWhere = "WHERE YEARWEEK(createdAt, 1) = YEARWEEK(CURDATE(), 1)";
            appointmentWhere = "WHERE YEARWEEK(appointmentDate, 1) = YEARWEEK(CURDATE(), 1)";
            invoiceWhere = "WHERE YEARWEEK(invoice_date, 1) = YEARWEEK(CURDATE(), 1)";
            paymentInvoiceWhere = "WHERE YEARWEEK(payment_date, 1) = YEARWEEK(CURDATE(), 1)";
        } else if (filter === "monthly") {
            patientWhere = "WHERE YEAR(createdAt) = YEAR(CURDATE()) AND MONTH(createdAt) = MONTH(CURDATE())";
            appointmentWhere = "WHERE YEAR(appointmentDate) = YEAR(CURDATE()) AND MONTH(appointmentDate) = MONTH(CURDATE())";
            invoiceWhere = "WHERE YEAR(invoice_date) = YEAR(CURDATE()) AND MONTH(invoice_date) = MONTH(CURDATE())";
            paymentInvoiceWhere = "WHERE YEAR(payment_date) = YEAR(CURDATE()) AND MONTH(payment_date) = MONTH(CURDATE())";
        }

        // Run queries
        const patients = await query(`SELECT COUNT(*) AS total FROM patients ${patientWhere}`);
        const labs = await query(`SELECT COUNT(*) AS total FROM labs`);
        const appointments = await query(`SELECT COUNT(*) AS total FROM appointments ${appointmentWhere}`);
        const invoices = await query(`SELECT COUNT(*) AS total FROM patient_invoices ${invoiceWhere}`);
        const paymentInvoices = await query(`SELECT COUNT(*) AS total FROM patient_payment_invoices ${paymentInvoiceWhere}`);

        const result = [
            { table: "patients", total: patients[0].total },
            { table: "labs", total: labs[0].total },
            { table: "appointments", total: appointments[0].total },
            { table: "invoices", total: invoices[0].total },
            { table: "payment_invoices", total: paymentInvoices[0].total },
        ];

        res.status(200).json({
            success: true,
            message: "Dashboard totals fetched successfully",
            data: result,
        });
    } catch (error) {
        console.error("Error fetching dashboard totals:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard totals",
            error: error.message,
        });
    }
};

const getPatientStatistics = async (req, res) => {
    try {
        const { filter } = req.body; // all | new 
        let condition = "";

        if (filter === "new") {
            // today registered patients
            condition = "WHERE DATE(createdAt) = CURDATE()";
        }

        const query = `SELECT COUNT(*) AS total FROM patients ${condition}`;

        pool.query(query, (err, results) => {
            if (err) throw err;

            res.status(200).json({
                success: true,
                message: "Patient statistics fetched successfully",
                filter: filter || "all",
                count: results[0]?.total || 0,
            });
        });
    } catch (error) {
        console.error("Error fetching patient statistics:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Patients by Gender API

const getPatientsByGender = async (req, res) => {
    try {
        const { filter } = req.body; // male | female
        let condition = "";

        if (filter === "male") {
            condition = "WHERE gender = 'male'";
        } else if (filter === "female") {
            condition = "WHERE gender = 'female'";
        }

        const query = `SELECT COUNT(*) AS total FROM patients ${condition}`;

        pool.query(query, (err, results) => {
            if (err) throw err;
            res.status(200).json({
                success: true,
                message: "Patient gender stats fetched successfully",
                filter: filter || "all",
                count: results[0].total,
            });
        });
    } catch (error) {
        console.error("Error fetching patients by gender:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Patients by Age Group API
const getPatientsByAge = async (req, res) => {
    try {
        const { filter } = req.body; // children | teens | adults | elderly
        let condition = "";

        if (filter === "children") {
            condition = "WHERE age < 10";
        } else if (filter === "teens") {
            condition = "WHERE age >= 10 AND age < 20";
        } else if (filter === "adults") {
            condition = "WHERE age >= 20 AND age < 50";
        } else if (filter === "elderly") {
            condition = "WHERE age >= 50";
        }

        const query = `SELECT COUNT(*) AS total FROM patients ${condition}`;

        pool.query(query, (err, results) => {
            if (err) throw err;
            res.status(200).json({
                success: true,
                message: "Patient age group stats fetched successfully",
                filter: filter || "all",
                count: results[0].total,
            });
        });
    } catch (error) {
        console.error("Error fetching patients by age:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getTopServices = async (req, res) => {
    try {
        const { limit } = req.body;
        const topLimit = limit || 5;

        const query = `
      SELECT 
        s.serviceName
      FROM patient_services ps
      JOIN services s ON ps.serviceId = s.id
      GROUP BY ps.serviceId, s.serviceName
      ORDER BY SUM(ps.net_amount) DESC
      LIMIT ?
    `;

        pool.query(query, [topLimit], (err, results) => {
            if (err) throw err;

            res.status(200).json({
                success: true,
                message: "Top services fetched successfully",
                limit: topLimit,
                services: results.map(r => r.serviceName),
            });
        });
    } catch (error) {
        console.error("Error fetching top services:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top services',
            error: error.message
        });
    }
};

const getPatientPieChartData = async (req, res) => {
    try {
        // 1. Fetch total patient count (all patients)
        const totalPatientsQuery = `SELECT COUNT(*) AS total FROM patients`;
        const totalPatientsPromise = new Promise((resolve, reject) => {
            pool.query(totalPatientsQuery, (err, results) => {
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        // 2. Fetch today registered (new) patients
        const newPatientsQuery = `SELECT COUNT(*) AS total FROM patients WHERE DATE(createdAt) = CURDATE()`;
        const newPatientsPromise = new Promise((resolve, reject) => {
            pool.query(newPatientsQuery, (err, results) => {
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        // 3. Fetch male patients count
        const malePatientsQuery = `SELECT COUNT(*) AS total FROM patients WHERE gender = 'male'`;
        const malePatientsPromise = new Promise((resolve, reject) => {
            pool.query(malePatientsQuery, (err, results) => {
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        // 4. Fetch female patients count
        const femalePatientsQuery = `SELECT COUNT(*) AS total FROM patients WHERE gender = 'female'`;
        const femalePatientsPromise = new Promise((resolve, reject) => {
            pool.query(femalePatientsQuery, (err, results) => {
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        // 5. Fetch patients by age group (children, teens, adults, elderly)
        const ageGroupsQueries = [
            { group: "children", query: `SELECT COUNT(*) AS total FROM patients WHERE age < 10` },
            { group: "teens", query: `SELECT COUNT(*) AS total FROM patients WHERE age >= 10 AND age < 20` },
            { group: "adults", query: `SELECT COUNT(*) AS total FROM patients WHERE age >= 20 AND age < 50` },
            { group: "elderly", query: `SELECT COUNT(*) AS total FROM patients WHERE age >= 50` }
        ];

        // Running all the queries concurrently
        const ageGroupPromises = ageGroupsQueries.map(group =>
            new Promise((resolve, reject) => {
                pool.query(group.query, (err, results) => {
                    if (err) reject(err);
                    resolve({ group: group.group, count: results[0].total });
                });
            })
        );

        // Waiting for all queries to resolve
        const results = await Promise.all([
            totalPatientsPromise,
            newPatientsPromise,
            malePatientsPromise,
            femalePatientsPromise,
            ...ageGroupPromises
        ]);

        // Structure the response for pie chart
        const pieChartData = [
            { label: "Total Patients", value: results[0] },
            { label: "New Patients", value: results[1] },
            { label: "Male Patients", value: results[2] },
            { label: "Female Patients", value: results[3] },
            ...results.slice(4).map(ageGroup => ({
                label: `${ageGroup.group.charAt(0).toUpperCase() + ageGroup.group.slice(1)} Patients`,
                value: ageGroup.count
            }))
        ];

        res.status(200).json({
            success: true,
            message: "Patient pie chart data fetched successfully",
            data: pieChartData
        });
    } catch (error) {
        console.error("Error fetching combined patient statistics:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getLabRequestStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                labs.lab_name,
                COUNT(lab_requests.id) AS total_requests
            FROM 
                labs
            LEFT JOIN 
                lab_requests ON labs.id = lab_requests.lab_id
            GROUP BY 
                labs.id;
        `;

        pool.query(query, (err, results) => {
            if (err) {
                console.error("Error fetching lab request statistics:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            // If no results, return empty array
            if (results.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "No lab request data found.",
                    data: []
                });
            }

            // Structure the response for lab request stats
            const labRequestStats = results.map(row => ({
                labs: row.lab_name,
                total_requests: row.total_requests
            }));

            res.status(200).json({
                success: true,
                message: "Lab request statistics fetched successfully",
                data: labRequestStats
            });
        });
    } catch (error) {
        console.error("Error fetching lab request statistics:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


const appointmentsReport = async (req, res) => {
    try {
        // Extract query parameters: month, year, doctorId, status
        const { year, month, doctorId, status } = req.query;

        // Initialize conditions and queryParams for prepared statements
        let conditions = [];
        let queryParams = [];

        // Apply filters based on provided query parameters

        // Year + Month filter (if both year and month are provided)
        if (year && month) {
            conditions.push("YEAR(appointmentDate) = ? AND MONTH(appointmentDate) = ?");
            queryParams.push(year, month);
        }
        // If only year is provided, filter by year
        else if (year) {
            conditions.push("YEAR(appointmentDate) = ?");
            queryParams.push(year);
        }
        // If only month is provided, filter by month (irrespective of year)
        else if (month) {
            conditions.push("MONTH(appointmentDate) = ?");
            queryParams.push(month);
        }

        // Filter by doctorId if provided
        if (doctorId) {
            conditions.push("doctorId = ?");
            queryParams.push(doctorId);
        }

        // Filter by status if provided
        if (status) {
            conditions.push("status = ?");
            queryParams.push(status);
        }

        // If there are conditions, join them with 'AND'; if not, leave it empty
        const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

        // Final SQL query with dynamically built WHERE clause
        const query = `
            SELECT 
                id, patientId, patientName, doctorId, doctorName,
                DATE_FORMAT(appointmentDate, '%Y-%m-%d') AS appointmentDate,
                startTime, endTime, duration, reason, status, createdAt
            FROM appointments
            ${whereClause}
            ORDER BY appointmentDate DESC
        `;

        // Execute the query using the prepared statement
        pool.query(query, queryParams, async (err, results) => {
            if (err) {
                console.error("Error fetching appointments:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            // If no results are found, return a 404 response
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "No appointments found" });
            }

            // Generate the Excel report
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Appointments Report");

            // Headers for the Excel sheet
            worksheet.columns = [
                { header: "ID", key: "id", width: 10 },
                { header: "Patient ID", key: "patientId", width: 15 },
                { header: "Patient Name", key: "patientName", width: 25 },
                { header: "Doctor ID", key: "doctorId", width: 15 },
                { header: "Doctor Name", key: "doctorName", width: 25 },
                { header: "Appointment Date", key: "appointmentDate", width: 20 },
                { header: "Start Time", key: "startTime", width: 15 },
                { header: "End Time", key: "endTime", width: 15 },
                { header: "Duration (min)", key: "duration", width: 15 },
                { header: "Reason", key: "reason", width: 30 },
                { header: "Status", key: "status", width: 15 },
                { header: "Created At", key: "createdAt", width: 20 },
            ];

            // Add data rows to the Excel sheet
            results.forEach((row) => worksheet.addRow(row));

            // Set response headers to prompt for an Excel file download
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=appointments_report.xlsx"
            );

            // Write the workbook to the response and send it to the user
            await workbook.xlsx.write(res);
            res.end();
        });
    } catch (error) {
        console.error("Error exporting appointments report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const labRequestsReport = async (req, res) => {
    try {
        // SQL query to fetch all lab request records
        const query = `
            SELECT 
                lr.id, 
                CONCAT(p.firstName, ' ', p.middleName, ' ', p.lastName) AS patientName, 
                l.lab_name AS labName, 
                d.fullName AS doctorName, 
                lr.title, 
                lr.description, 
                lr.sent_by, 
                lr.status, 
                lr.file, 
                lr.created_at, 
                lr.status_updated_at, 
                lr.pending_at, 
                lr.received_at, 
                lr.service_ids
            FROM lab_requests lr
            JOIN patients p ON lr.patient_id = p.id
            JOIN doctors d ON lr.doctor_id = d.id
            JOIN labs l ON lr.lab_id = l.id
            ORDER BY lr.created_at DESC
        `;

        // Execute the query
        pool.query(query, async (err, results) => {
            if (err) {
                console.error("Error fetching lab requests:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            // If no results are found, return a 404 response
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "No lab requests found" });
            }

            // Create a new Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Lab Requests Report");

            // Define headers for the Excel sheet
            worksheet.columns = [
                { header: "ID", key: "id", width: 10 },
                { header: "Patient Name", key: "patientName", width: 25 },
                { header: "Lab Name", key: "labName", width: 25 },
                { header: "Doctor Name", key: "doctorName", width: 25 },
                { header: "Title", key: "title", width: 30 },
                { header: "Description", key: "description", width: 40 },
                { header: "Sent By", key: "sent_by", width: 25 },
                { header: "Status", key: "status", width: 20 },
                { header: "File", key: "file", width: 25 },
                { header: "Created At", key: "created_at", width: 20 },
                { header: "Status Updated At", key: "status_updated_at", width: 20 },
                { header: "Pending At", key: "pending_at", width: 20 },
                { header: "Received At", key: "received_at", width: 20 },
                { header: "Service IDs", key: "service_ids", width: 25 },
            ];

            // Add data rows to the Excel sheet
            results.forEach((row) => worksheet.addRow(row));

            // Set response headers to prompt for Excel file download
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=lab_requests_report.xlsx"
            );

            // Write the workbook to the response and send it to the user
            await workbook.xlsx.write(res);
            res.end();
        });
    } catch (error) {
        console.error("Error exporting lab requests report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const rxListReport = async (req, res) => {
    try {
        // SQL query to fetch all rx_list records
        const query = `
            SELECT 
                id, 
                medicine_name, 
                strength, 
                unit, 
                pharmaceutical_form, 
                route, 
                product_type, 
                active_substances
            FROM rx_list
            ORDER BY id ASC
        `;

        // Execute the query
        pool.query(query, async (err, results) => {
            if (err) {
                console.error("Error fetching rx list:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            // If no results are found, return a 404 response
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "No records found" });
            }

            // Create a new Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Rx List Report");

            // Define headers for the Excel sheet
            worksheet.columns = [
                { header: "ID", key: "id", width: 10 },
                { header: "Medicine", key: "medicine_name", width: 30 },
                { header: "Strength", key: "strength", width: 20 },
                { header: "Unit", key: "unit", width: 15 },
                { header: "Form", key: "pharmaceutical_form", width: 25 },
                { header: "Route", key: "route", width: 20 },
                { header: "Type", key: "product_type", width: 20 },
                { header: "Substance", key: "active_substances", width: 30 },
            ];

            // Add data rows to the Excel sheet
            results.forEach((row) => worksheet.addRow(row));

            // Set response headers to prompt for Excel file download
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=rx_list_report.xlsx"
            );

            // Write the workbook to the response and send it to the user
            await workbook.xlsx.write(res);
            res.end();
        });
    } catch (error) {
        console.error("Error exporting rx list report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const inventoryReport = async (req, res) => {
    try {
        // SQL query to fetch all active drugs (is_deleted = 0)
        const query = `
            SELECT 
                id, 
                name, 
                category, 
                substance, 
                strength, 
                unit_of_measurement, 
                company, 
                quantity, 
                expiration_date, 
                cost, 
                price, 
                control, 
                barcode
            FROM drugs
            WHERE is_deleted = 0
            ORDER BY id DESC
        `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("Error fetching drugs:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            // If no results are found, return a 404 response
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "No active records found" });
            }

            // Create a new Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Inventory Report");

            // Define headers for the Excel sheet
            worksheet.columns = [
                { header: "ID", key: "id", width: 10 },
                { header: "Name", key: "name", width: 30 },
                { header: "Category", key: "category", width: 20 },
                { header: "Substance", key: "substance", width: 20 },
                { header: "Strength", key: "strength", width: 20 },
                { header: "Unit", key: "unit_of_measurement", width: 25 },
                { header: "Company", key: "company", width: 30 },
                { header: "Quantity", key: "quantity", width: 15 },
                { header: "Expiry", key: "expiration_date", width: 20 },
                { header: "Cost", key: "cost", width: 15 },
                { header: "Price", key: "price", width: 15 },
                { header: "Control", key: "control", width: 10 },
                { header: "Barcode", key: "barcode", width: 30 },
            ];

            // Add data rows to the Excel sheet
            results.forEach((row) => worksheet.addRow(row));

            // Set response headers to prompt for Excel file download
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=inventory_report.xlsx"
            );

            // Write the workbook to the response and send it to the user
            await workbook.xlsx.write(res);
            res.end();
        });
    } catch (error) {
        console.error("Error exporting drugs report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const insuranceClaimsReport = async (req, res) => {
    try {
        // SQL query to fetch insurance claims data
        const query = `
            SELECT 
                ic.id AS claim_id,
                ic.claim_number,
                ic.adjusted_amount,
                ic.insurance_amount,
                ic.patient_amount,
                ic.is_deductible_applied,
                ic.co_insurance_percent,
                ic.status,
                ic.created_at,
                p.id as patientId,
                p.firstName,
                p.middleName,
                p.lastName,
                c.company_name
            FROM insurance_claims ic
            LEFT JOIN patients p ON ic.patient_id = p.id
            LEFT JOIN patient_invoices pi ON ic.invoice_id = pi.id
            LEFT JOIN insurance_cards card ON ic.card_id = card.card_id
            LEFT JOIN insurance_companies c ON card.company_id = c.company_id
            ORDER BY ic.created_at DESC
        `;

        // Execute the query
        pool.query(query, async (err, results) => {
            if (err) {
                console.error("Error fetching insurance claims:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            // If no results are found, return a 404 response
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "No insurance claims found" });
            }

            // Create a new Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Insurance Claims Report");

            // Define headers for the Excel sheet
            worksheet.columns = [
                { header: "Claim ID", key: "claim_id", width: 15 },
                { header: "Claim Number", key: "claim_number", width: 20 },
                { header: "Adjusted Amount", key: "adjusted_amount", width: 20 },
                { header: "Insurance Amount", key: "insurance_amount", width: 20 },
                { header: "Patient Amount", key: "patient_amount", width: 20 },
                { header: "Deductible Applied", key: "is_deductible_applied", width: 20 },
                { header: "Co-Insurance %", key: "co_insurance_percent", width: 15 },
                { header: "Status", key: "status", width: 15 },
                { header: "Date", key: "created_at", width: 20 },
                { header: "Patient ID", key: "patientId", width: 15 },
                { header: "Patient Name", key: "patient_name", width: 25 },
                { header: "Company", key: "company_name", width: 25 },
            ];

            // Format patient name as full name (first + middle + last)
            results.forEach((row) => {
                row.patient_name = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`;
                worksheet.addRow(row);
            });

            // Set response headers to prompt for Excel file download
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=insurance_claims_report.xlsx"
            );

            // Write the workbook to the response and send it to the user
            await workbook.xlsx.write(res);
            res.end();
        });
    } catch (error) {
        console.error("Error exporting insurance claims report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export default {
    getDashboardTotals,
    getPatientStatistics,
    getPatientsByGender,
    getPatientsByAge,
    getTopServices,
    getPatientPieChartData,
    getLabRequestStats,
    appointmentsReport,
    labRequestsReport,
    rxListReport,
    inventoryReport,
    insuranceClaimsReport
};
