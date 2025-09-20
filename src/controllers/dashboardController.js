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
                p.firstName,
                p.middleName,
                p.lastName, 
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

            results.forEach((row) => {
                row.patientName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`;
                worksheet.addRow(row);
            });

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

const patientsListReports = async (req, res) => {
    try {
        const query = `
      SELECT 
        p.id,
        p.fileNumber,
        p.firstName,
        p.middleName,
        p.lastName,
        p.gender,
        p.age,
        p.mobileNumber,
        p.email,
        p.address,
        p.dateOfBirth,
        p.civilIdNumber,
        p.passportNumber,
        p.fileOpenedDate,
        p.firstVisitDate,
        p.lastVisitDate,
        p.createdAt,
        p.updatedAt,
        d.fullName AS primaryDoctor
      FROM patients p
      LEFT JOIN doctors d ON p.defaultDoctorId = d.id
    `;

        pool.query(query, (err, patients) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Patients Report");

            worksheet.columns = [
                { header: "Patient ID", key: "id", width: 10 },
                { header: "File No", key: "fileNumber", width: 10 },
                { header: "Patient Name", key: "patientName", width: 30 },
                { header: "Gender", key: "gender", width: 15 },
                { header: "Age", key: "age", width: 10 },
                { header: "Mobile Number", key: "mobileNumber", width: 20 },
                { header: "Email", key: "email", width: 30 },
                { header: "Address", key: "address", width: 40 },
                { header: "Date of Birth", key: "dateOfBirth", width: 15 },
                { header: "Civil ID Number", key: "civilIdNumber", width: 25 },
                { header: "Passport Number", key: "passportNumber", width: 25 },
                { header: "File Opened Date", key: "fileOpenedDate", width: 15 },
                { header: "First Visit Date", key: "firstVisitDate", width: 15 },
                { header: "Last Visit Date", key: "lastVisitDate", width: 15 },
                { header: "Created At", key: "createdAt", width: 20 },
                { header: "Updated At", key: "updatedAt", width: 20 },
                { header: "Primary Doctor", key: "primaryDoctor", width: 25 }
            ];

            patients.forEach((row) => {
                row.patientName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`;
                worksheet.addRow(row);
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=patients_list_report.xlsx"
            );

            workbook.xlsx.write(res).then(() => {
                res.end();
            }).catch(err => {
                console.error("Excel write error:", err);
                res.status(500).json({ success: false, error: err.message });
            });
        });

    } catch (error) {
        console.error("Error generating patients list report:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

const patientsListReportsByGender = async (req, res) => {
    try {
        const query = `
      SELECT 
        p.id,
        p.firstName,
        p.middleName,
        p.lastName,
        p.gender,
        p.age,
        p.mobileNumber,
        p.email,
        p.address,
        p.dateOfBirth,
        p.civilIdNumber,
        p.passportNumber,
        p.fileOpenedDate,
        p.firstVisitDate,
        p.lastVisitDate,
        p.createdAt,
        p.updatedAt,
        d.fullName AS primaryDoctor
      FROM patients p
      LEFT JOIN doctors d ON p.defaultDoctorId = d.id
      ORDER BY 
        CASE 
          WHEN TRIM(LOWER(p.gender)) = 'male' THEN 1
          WHEN TRIM(LOWER(p.gender)) = 'female' THEN 2
          WHEN TRIM(LOWER(p.gender)) = 'other' THEN 3
          ELSE 4
        END
    `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            // Prepare Excel Workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Patients by Gender");

            worksheet.columns = [
                { header: "Patient ID", key: "id", width: 10 },
                { header: "Patient Name", key: "patientName", width: 30 },
                { header: "Gender", key: "gender", width: 15 },
                { header: "Age", key: "age", width: 10 },
                { header: "Mobile Number", key: "mobileNumber", width: 20 },
                { header: "Email", key: "email", width: 30 },
                { header: "Address", key: "address", width: 40 },
                { header: "Date of Birth", key: "dateOfBirth", width: 15 },
                { header: "Civil ID Number", key: "civilIdNumber", width: 25 },
                { header: "Passport Number", key: "passportNumber", width: 25 },
                { header: "File Opened Date", key: "fileOpenedDate", width: 15 },
                { header: "First Visit Date", key: "firstVisitDate", width: 15 },
                { header: "Last Visit Date", key: "lastVisitDate", width: 15 },
                { header: "Created At", key: "createdAt", width: 20 },
                { header: "Updated At", key: "updatedAt", width: 20 },
                { header: "Primary Doctor", key: "primaryDoctor", width: 25 }
            ];

            results.forEach(row => {
                row.patientName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`.trim();
                worksheet.addRow(row);
            });

            // Set headers for file download
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=patients_by_gender_report.xlsx"
            );

            await workbook.xlsx.write(res);
            res.end();
        });
    } catch (error) {
        console.error("Error generating report by gender:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const patientsListReportsByAge = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id,
                p.firstName,
                p.middleName,
                p.lastName,
                p.gender,
                p.age,
                p.mobileNumber,
                p.email,
                p.address,
                p.dateOfBirth,
                p.civilIdNumber,
                p.passportNumber,
                p.fileOpenedDate,
                p.firstVisitDate,
                p.lastVisitDate,
                p.createdAt,
                p.updatedAt,
                d.fullName AS primaryDoctor,
                CASE 
                    WHEN p.age < 10 THEN 'Children'
                    WHEN p.age < 20 THEN 'Teen'
                    WHEN p.age < 50 THEN 'Young'
                    ELSE 'Elderly'
                END AS ageCategory
            FROM patients p
            LEFT JOIN doctors d ON p.defaultDoctorId = d.id
            ORDER BY 
                CASE 
                    WHEN p.age < 10 THEN 1
                    WHEN p.age < 20 THEN 2
                    WHEN p.age < 50 THEN 3
                    ELSE 4
                END, p.age ASC
        `;

        pool.query(query, (err, patients) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Patients By Age");

            worksheet.columns = [
                { header: "Patient ID", key: "id", width: 10 },
                { header: "Patient Name", key: "patientName", width: 30 },
                { header: "Age Category", key: "ageCategory", width: 15 },
                { header: "Age", key: "age", width: 10 },
                { header: "Gender", key: "gender", width: 15 },
                { header: "Mobile Number", key: "mobileNumber", width: 20 },
                { header: "Email", key: "email", width: 30 },
                { header: "Address", key: "address", width: 40 },
                { header: "Date of Birth", key: "dateOfBirth", width: 15 },
                { header: "Civil ID Number", key: "civilIdNumber", width: 25 },
                { header: "Passport Number", key: "passportNumber", width: 25 },
                { header: "File Opened Date", key: "fileOpenedDate", width: 15 },
                { header: "First Visit Date", key: "firstVisitDate", width: 15 },
                { header: "Last Visit Date", key: "lastVisitDate", width: 15 },
                { header: "Created At", key: "createdAt", width: 20 },
                { header: "Updated At", key: "updatedAt", width: 20 },
                { header: "Primary Doctor", key: "primaryDoctor", width: 25 }
            ];

            patients.forEach((row) => {
                const patientName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`.trim();

                worksheet.addRow({
                    id: row.id,
                    patientName,
                    ageCategory: row.ageCategory,
                    age: row.age,
                    gender: row.gender,
                    mobileNumber: row.mobileNumber,
                    email: row.email,
                    address: row.address,
                    dateOfBirth: row.dateOfBirth,
                    civilIdNumber: row.civilIdNumber,
                    passportNumber: row.passportNumber,
                    fileOpenedDate: row.fileOpenedDate,
                    firstVisitDate: row.firstVisitDate,
                    lastVisitDate: row.lastVisitDate,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    primaryDoctor: row.primaryDoctor
                });
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=patients_by_age_category.xlsx"
            );

            workbook.xlsx.write(res)
                .then(() => res.end())
                .catch(err => {
                    console.error("Excel write error:", err);
                    res.status(500).json({ success: false, error: err.message });
                });
        });

    } catch (error) {
        console.error("Error generating age category report:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

const testByLabsReport = async (req, res) => {
    try {
        const query = `
            SELECT 
                l.*, 
                COUNT(lr.lab_id) AS assigned_count
            FROM labs l
            LEFT JOIN lab_requests lr ON l.id = lr.lab_id
            GROUP BY l.id
        `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Test By Labs Report");

            worksheet.columns = [
                { header: "Lab ID", key: "id", width: 10 },
                { header: "Lab Name", key: "lab_name", width: 25 },
                { header: "Speciality", key: "speciality", width: 20 },
                { header: "Phone Number", key: "phone_number", width: 15 },
                { header: "Email", key: "email", width: 25 },
                { header: "Address", key: "address", width: 30 },
                { header: "Notes", key: "notes", width: 25 },
                { header: "Pending", key: "pending", width: 10 },
                { header: "Is Active", key: "is_active", width: 10 },
                { header: "Created At", key: "created_at", width: 20 },
                { header: "Requests", key: "assigned_count", width: 15 },
            ];

            results.forEach(row => {
                worksheet.addRow({
                    id: row.id,
                    lab_name: row.lab_name,
                    speciality: row.speciality,
                    phone_number: row.phone_number,
                    email: row.email,
                    address: row.address,
                    notes: row.notes,
                    pending: row.pending,
                    is_active: row.is_active === 1 ? "Yes" : "No",
                    created_at: row.created_at,
                    assigned_count: row.assigned_count,
                });
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=test_by_labs_report.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        });

    } catch (error) {
        console.error("Error generating Test By Labs Report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const mostUsedServicesReport = async (req, res) => {
    try {
        const query = `
      SELECT 
        s.id,
        s.serviceCode AS code,
        s.serviceName AS name,
        s.description,
        s.category AS categoryId,
        sc.category_name AS categoryName,
        s.durationMinutes AS duration,
        s.standardCost AS standard_price,
        s.secondaryCost AS secondary_price,
        s.insuranceCost AS insurance_price,
        s.vat,
        s.vat_value,
        COUNT(ps.id) AS usageCount
      FROM services s
      LEFT JOIN service_categories sc ON s.category = sc.id
      LEFT JOIN patient_services ps ON s.id = ps.serviceId
      GROUP BY s.id
      ORDER BY usageCount DESC
    `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Most Used Services Report");

            worksheet.columns = [
                { header: "Service ID", key: "id", width: 10 },
                { header: "Service Code", key: "code", width: 15 },
                { header: "Service Name", key: "name", width: 30 },
                { header: "Usage Count", key: "usageCount", width: 15 },
                { header: "Category Name", key: "categoryName", width: 25 },
                { header: "Description", key: "description", width: 40 },
                { header: "Duration (min)", key: "duration", width: 15 },
                { header: "Standard Price", key: "standard_price", width: 15 },
                { header: "Secondary Price", key: "secondary_price", width: 15 },
                { header: "Insurance Price", key: "insurance_price", width: 15 },
                { header: "VAT (%)", key: "vat", width: 10 },
                { header: "VAT Value", key: "vat_value", width: 15 }
            ];

            results.forEach(row => {
                worksheet.addRow(row);
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=most_used_services_report.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        });

    } catch (error) {
        console.error("Error generating most used services report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const chiefComplaintsReport = async (req, res) => {
    try {
        const query = `
      SELECT 
        id,
        text,
        created_at,
        updated_at
      FROM chief_complaints
      ORDER BY text ASC
    `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Chief Complaints Report");

            worksheet.columns = [
                { header: "ID", key: "id", width: 10 },
                { header: "Chief Complaint", key: "text", width: 40 },
                { header: "Created At", key: "created_at", width: 20 },
                { header: "Updated At", key: "updated_at", width: 20 },
            ];

            results.forEach(row => {
                worksheet.addRow(row);
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=chief_complaints_report.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        });

    } catch (error) {
        console.error("Error generating chief complaints report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const allergiesReport = async (req, res) => {
    try {
        const query = `
      SELECT 
        p.id AS patientId,
        p.firstName,
        p.middleName,
        p.lastName,
        p.gender,
        p.age,
        pa.allergy_name,
        pa.allergy_type,
        pa.status,
        pa.created_at
      FROM patient_allergies pa
      JOIN patients p ON pa.patient_id = p.id
      ORDER BY p.id, pa.created_at DESC
    `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Allergies Report");

            worksheet.columns = [
                { header: "Patient ID", key: "patientId", width: 10 },
                { header: "Patient Name", key: "patientName", width: 30 },
                { header: "Gender", key: "gender", width: 10 },
                { header: "Age", key: "age", width: 10 },
                { header: "Allergy Name", key: "allergy_name", width: 30 },
                { header: "Allergy Type", key: "allergy_type", width: 20 },
                { header: "Status", key: "status", width: 15 },
                { header: "Created At", key: "created_at", width: 20 }
            ];

            results.forEach(row => {
                row.patientName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`.trim();
                worksheet.addRow(row);
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=allergies_report.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        });

    } catch (error) {
        console.error("Error generating allergies report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const diagnosisPatientsReport = async (req, res) => {
    try {
        const query = `
      SELECT 
        pd.id AS diagnosisId,
        p.firstName,
        p.middleName,
        p.lastName,
        p.gender,
        p.age,
        d.fullName AS doctorName,
        ic.code AS diagnosisCode,
        ic.short_name AS diagnosisName,
        pd.notes,
        pd.diagnosis_date
      FROM patient_diagnosis pd
      JOIN patients p ON pd.patient_id = p.id
      JOIN doctors d ON pd.doctor_id = d.id
      JOIN icds_10 ic ON pd.icd10_id = ic.id
      ORDER BY pd.diagnosis_date DESC
    `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Diagnosis Report");

            worksheet.columns = [
                { header: "Diagnosis ID", key: "diagnosisId", width: 12 },
                { header: "Patient Name", key: "patientName", width: 30 },
                { header: "Gender", key: "gender", width: 10 },
                { header: "Age", key: "age", width: 8 },
                { header: "Doctor Name", key: "doctorName", width: 30 },
                { header: "Diagnosis Code", key: "diagnosisCode", width: 15 },
                { header: "Diagnosis Name", key: "diagnosisName", width: 35 },
                { header: "Notes", key: "notes", width: 40 },
                { header: "Diagnosis Date", key: "diagnosis_date", width: 20 },
            ];

            results.forEach(row => {
                row.patientName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`.trim();
                worksheet.addRow(row);
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=diagnosis_patients_report.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        });

    } catch (error) {
        console.error("Error generating diagnosis report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const xRayReportsExport = async (req, res) => {
    try {
        const query = `
      SELECT 
        xr.id AS x_rayId,
        p.firstName,
        p.middleName,
        p.lastName,
        p.gender,
        p.age,
        pam.chief_complaint,
        xr.title,
        xr.description,
        xr.attachment,
        xr.created_at
      FROM xray_and_radiology xr
      JOIN patients p ON xr.patient_id = p.id
      LEFT JOIN patient_all_medicals pam ON xr.medical_id = pam.id
      ORDER BY xr.created_at DESC
    `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("X-Ray & Radiology Reports");

            worksheet.columns = [
                { header: "Report ID", key: "x_rayId", width: 10 },
                { header: "Patient Name", key: "patientName", width: 30 },
                { header: "Gender", key: "gender", width: 10 },
                { header: "Age", key: "age", width: 10 },
                { header: "Chief Complaint", key: "chief_complaint", width: 30 },
                { header: "Title", key: "title", width: 25 },
                { header: "Description", key: "description", width: 40 },
                { header: "Attachment", key: "attachment", width: 40 },
                { header: "Created At", key: "created_at", width: 20 },
            ];

            results.forEach(row => {
                row.patientName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`.trim();
                worksheet.addRow(row);
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=xray_reports.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        });

    } catch (error) {
        console.error("Error generating X-ray report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const doctorsReportExport = async (req, res) => {
    try {
        const query = `
      SELECT 
        d.*, 
        u.email 
      FROM doctors d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.fullName ASC
    `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Doctors Report");

            worksheet.columns = [
                { header: "Doctor ID", key: "id", width: 10 },
                { header: "Full Name", key: "fullName", width: 30 },
                { header: "Short Name", key: "shortName", width: 20 },
                { header: "Phone Number", key: "phoneNumber", width: 20 },
                { header: "Prefix", key: "prefix", width: 10 },
                { header: "Date of Birth", key: "dateOfBirth", width: 15 },
                { header: "License ID", key: "licenseId", width: 20 },
                { header: "Civil ID", key: "civilId", width: 20 },
                { header: "Passport", key: "passport", width: 20 },
                { header: "Gender", key: "gender", width: 10 },
                { header: "Specialty", key: "specialty", width: 25 },
                { header: "Personal Photo", key: "personalPhoto", width: 30 },
                { header: "Email", key: "email", width: 30 },
                { header: "Created At", key: "createdAt", width: 20 },
                { header: "Updated At", key: "updatedAt", width: 20 },
            ];

            results.forEach(row => {
                worksheet.addRow(row);
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=doctors_report.xlsx"
            );

            await workbook.xlsx.write(res);
            res.end();
        });

    } catch (error) {
        console.error("Error generating doctors report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const patientInvoicesExport = async (req, res) => {
    try {
        const query = `
            SELECT 
                pi.*, 
                p.firstName, 
                p.middleName, 
                p.lastName
            FROM patient_invoices pi
            LEFT JOIN patients p ON pi.patient_id = p.id
            ORDER BY pi.updated_at DESC
        `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Patient Invoices");

            worksheet.columns = [
                { header: "Invoice ID", key: "id", width: 10 },
                { header: "Invoice No", key: "invoice_no", width: 20 },
                { header: "Invoice Date", key: "invoiceDate", width: 15 },
                { header: "Invoice Time", key: "invoiceTime", width: 15 },
                { header: "Patient Name", key: "patientName", width: 30 },
                { header: "Total Services", key: "total_services", width: 15 },
                { header: "Total Amount", key: "total_amount", width: 15 },
                { header: "Paid Amount", key: "paid_amount", width: 15 },
                { header: "Remaining Amount", key: "remaining_amount", width: 18 },
                { header: "Status", key: "status", width: 15 },
                { header: "Invoice Status", key: "invoice_status", width: 20 },
                { header: "Updated At", key: "updated_at", width: 20 },
            ];

            results.forEach(row => {
                const patientName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`.trim();

                const invoiceDateObj = new Date(row.invoice_date);
                const invoiceDate = invoiceDateObj.toISOString().split('T')[0];
                const invoiceTime = invoiceDateObj.toTimeString().split(' ')[0];

                worksheet.addRow({
                    id: row.id,
                    invoice_no: row.invoice_no,
                    invoiceDate: invoiceDate,
                    invoiceTime: invoiceTime,
                    patientName: patientName,
                    total_services: row.total_services,
                    total_amount: row.total_amount,
                    paid_amount: row.paid_amount,
                    remaining_amount: row.remaining_amount,
                    status: row.status,
                    invoice_status: row.invoice_status,
                    updated_at: row.updated_at,
                });
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=patient_invoices_report.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        });

    } catch (error) {
        console.error("Error generating patient invoice report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const cashPaymentsReport = async (req, res) => {
    try {
        const query = `
            SELECT 
                ppi.*, 
                pi.invoice_no, 
                pi.invoice_date,
                pt.firstName, pt.middleName, pt.lastName
            FROM patient_payment_invoices ppi
            LEFT JOIN patient_invoices pi ON ppi.invoice_id = pi.id
            LEFT JOIN patients pt ON pi.patient_id = pt.id
            WHERE ppi.payment_method = 'cash'
            ORDER BY ppi.updated_at DESC
        `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Cash Payment Invoices");

            worksheet.columns = [
                { header: "Payment ID", key: "id", width: 10 },
                { header: "Invoice No", key: "invoice_no", width: 20 },
                { header: "Invoice Date", key: "invoiceDate", width: 15 },
                { header: "Payment Date", key: "paymentDate", width: 20 },
                { header: "Payment Time", key: "paymentTime", width: 15 },
                { header: "Patient Name", key: "patientName", width: 30 },
                { header: "Payment Amount", key: "payment_amount", width: 15 },
                { header: "Payment Method", key: "payment_method", width: 15 },
                { header: "Transaction ID", key: "transactionId", width: 25 },
                { header: "Payment Status", key: "payment_status", width: 15 },
                { header: "Updated At", key: "updated_at", width: 20 },
            ];

            results.forEach(row => {
                const patientName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`.trim();

                const invoiceDateObj = row.invoice_date ? new Date(row.invoice_date) : null;
                const invoiceDate = invoiceDateObj ? invoiceDateObj.toISOString().split('T')[0] : '';

                const paymentDateObj = row.payment_date ? new Date(row.payment_date) : null;
                const paymentDate = paymentDateObj ? paymentDateObj.toISOString().split('T')[0] : '';
                const paymentTime = paymentDateObj ? paymentDateObj.toTimeString().split(' ')[0] : '';

                worksheet.addRow({
                    id: row.id,
                    invoice_no: row.invoice_no,
                    invoiceDate: invoiceDate,
                    paymentDate: paymentDate,
                    paymentTime: paymentTime,
                    patientName: patientName,
                    payment_amount: row.payment_amount,
                    payment_method: row.payment_method,
                    transactionId: row.transactionId,
                    payment_status: row.payment_status,
                    updated_at: row.updated_at,
                });
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=cash_payments_report.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        });

    } catch (error) {
        console.error("Error generating cash payments report:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const creditCardPaymentsReport = async (req, res) => {
    try {
        const query = `
            SELECT 
                ppi.*, 
                pi.invoice_no, 
                pi.invoice_date,
                pt.firstName, pt.middleName, pt.lastName
            FROM patient_payment_invoices ppi
            LEFT JOIN patient_invoices pi ON ppi.invoice_id = pi.id
            LEFT JOIN patients pt ON pi.patient_id = pt.id
            WHERE ppi.payment_method = 'credit card'
            ORDER BY ppi.updated_at DESC
        `;

        pool.query(query, async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Cash Payment Invoices");

            worksheet.columns = [
                { header: "Payment ID", key: "id", width: 10 },
                { header: "Invoice No", key: "invoice_no", width: 20 },
                { header: "Invoice Date", key: "invoiceDate", width: 15 },
                { header: "Payment Date", key: "paymentDate", width: 20 },
                { header: "Payment Time", key: "paymentTime", width: 15 },
                { header: "Patient Name", key: "patientName", width: 30 },
                { header: "Payment Amount", key: "payment_amount", width: 15 },
                { header: "Payment Method", key: "payment_method", width: 15 },
                { header: "Transaction ID", key: "transactionId", width: 25 },
                { header: "Payment Status", key: "payment_status", width: 15 },
                { header: "Updated At", key: "updated_at", width: 20 },
            ];

            results.forEach(row => {
                const patientName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`.trim();

                const invoiceDateObj = row.invoice_date ? new Date(row.invoice_date) : null;
                const invoiceDate = invoiceDateObj ? invoiceDateObj.toISOString().split('T')[0] : '';

                const paymentDateObj = row.payment_date ? new Date(row.payment_date) : null;
                const paymentDate = paymentDateObj ? paymentDateObj.toISOString().split('T')[0] : '';
                const paymentTime = paymentDateObj ? paymentDateObj.toTimeString().split(' ')[0] : '';

                worksheet.addRow({
                    id: row.id,
                    invoice_no: row.invoice_no,
                    invoiceDate: invoiceDate,
                    paymentDate: paymentDate,
                    paymentTime: paymentTime,
                    patientName: patientName,
                    payment_amount: row.payment_amount,
                    payment_method: row.payment_method,
                    transactionId: row.transactionId,
                    payment_status: row.payment_status,
                    updated_at: row.updated_at,
                });
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=cash_payments_report.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        });

    } catch (error) {
        console.error("Error generating cash payments report:", error);
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
    insuranceClaimsReport,
    patientsListReports,
    patientsListReportsByGender,
    patientsListReportsByAge,
    testByLabsReport,
    mostUsedServicesReport,
    chiefComplaintsReport,
    allergiesReport,
    diagnosisPatientsReport,
    xRayReportsExport,
    doctorsReportExport,
    patientInvoicesExport,
    cashPaymentsReport,
    creditCardPaymentsReport
};
