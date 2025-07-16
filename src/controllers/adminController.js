import pool from "../config/db.js";
// import bcrypt from "bcrypt";

const generateNextFileNumber = (lastFileNumber) => {
  if (!lastFileNumber) return "P00001";
  const number = parseInt(lastFileNumber.slice(1)) + 1;
  return `P${number.toString().padStart(5, "0")}`;
};

function generateRandomNumber(length) {
  let result = "";
  const characters = "0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function isValidSchedule(item) {
  const { doctor_id, day_of_week, start_time, end_time } = item;
  return (
    Number.isInteger(doctor_id) &&
    typeof day_of_week === "string" &&
    typeof start_time === "string" &&
    typeof end_time === "string"
  );
}

const getAllUsers = async (req, res) => {
  try {
    // const allUser = 'Select * from users where role != "admin" AND is_active = 1  and is_deleted = 0';
    const allUser = `Select users.*, doctors.fullName, doctors.licenseId from users 
    LEFT JOIN doctors on doctors.user_id= users.id
    where users.role != "admin" and users.is_deleted = 0`;

    pool.query(allUser, (error, result) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Database error while fetching users",
          error_message: error.message,
        });
      }
      if (result.length === 0) {
        return res.status(200).json({
          success: false,
          message: "No users found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: result,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// const changeUserStatus = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id || isNaN(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid ID required",
//       });
//     }

//     const getUserQuery = "SELECT * FROM user WHERE id = ?";
//     pool.query(getUserQuery, [id], (error, result) => {
//       if (error) {
//         return res.status(500).json({
//           success: false,
//           message: "Error fetching user",
//           error_message: error.message,
//         });
//       }

//       if (result.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: "User not found",
//         });
//       }

//       const currentStatusRaw = result[0].is_active;
//       const currentStatus = parseInt(currentStatusRaw);
//       let newStatus = currentStatus === 1 ? 0 : 1;
//       newStatus = String(newStatus)
//       console.log(`Current status: ${currentStatusRaw} (parsed: ${currentStatus}), New status: ${newStatus}`);

//       const updateQuery = "UPDATE user SET is_active = ? WHERE id = ?";
//       pool.query(updateQuery, [newStatus, id], (updateErr, updateResult) => {
//         if (updateErr) {
//           console.error("Update Error:", updateErr.message);
//           return res.status(500).json({
//             success: false,
//             message: "Error updating status",
//             error_message: updateErr.message,
//           });
//         }

//         console.log('Update Result:', updateResult);

//         if (updateResult.affectedRows === 0) {
//           return res.status(500).json({
//             success: false,
//             message: "No rows updated. Status may be same or DB field is incorrect.",
//           });
//         }

//         return res.status(200).json({
//           success: true,
//           message: "User status updated",
//           user_id: id,
//           new_status: newStatus,
//         });
//       });
//     });
//   } catch (err) {
//     console.error("Catch Error:", err.message);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error_message: err.message,
//     });
//   }
// };

const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    const checkUserQuery = "SELECT * FROM user WHERE id = ?";
    pool.query(checkUserQuery, [id], (checkErr, result) => {
      if (checkErr) {
        return res.status(500).json({
          success: false,
          message: "Error checking user",
          error_message: checkErr.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const deleteQuery = "DELETE FROM user WHERE id = ?";
      pool.query(deleteQuery, [id], (deleteErr, deleteResult) => {
        if (deleteErr) {
          return res.status(500).json({
            success: false,
            message: "Error deleting user",
            error_message: deleteErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "User deleted successfully",
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error_message: error.message,
    });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const getDoctors = () => {
      return new Promise((resolve, reject) => {
        // Order by latest added (descending)
        const query = `SELECT * FROM doctors ORDER BY createdAt DESC`;
        pool.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const doctors = await getDoctors();

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No doctors found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctors retrieved successfully",
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getActiveDoctors = async (req, res) => {
  const query = `
    SELECT 
      users.*, 
      doctors.* 
    FROM users 
    JOIN doctors ON users.id = doctors.user_id 
    WHERE users.is_active = 1 
      AND users.is_deleted = 0 
      AND users.role = "doctor"
  `;

  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching active doctors",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active doctors found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active doctors retrieved successfully",
      data: results,
    });
  });
};

const changeUserStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const { status } = req.body;
    console.log(typeof status);
    if (status !== 1 && status !== 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value (must be 0 or 1)",
      });
    }

    const query =
      "UPDATE users SET is_active = ?, updatedAt = NOW() WHERE id = ?";
    pool.query(query, [status, userId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error updating status",
          error: err.message,
        });
      }

      return res
        .status(200)
        .json({ success: true, message: `Status updated to ${status}` });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error_message: error.message,
    });
  }
};

const softDeleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const query =
      "UPDATE users SET is_deleted = 1 WHERE id = ? AND is_deleted = 0";

    pool.query(query, [userId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error performing soft delete",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found or already deleted",
        });
      }

      return res.status(200).json({
        success: true,
        message: `User soft deleted successfully`,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error_message: error.message,
    });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }
    const query = "DELETE FROM doctors WHERE id = ?";
    pool.query(query, [doctorId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error deleting doctor",
          error: err.message,
        });
      }

      return res
        .status(200)
        .json({ success: true, message: "Doctor deleted successfully" });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error_message: error.message,
    });
  }
};

// const registerPatient = async (req, res) => {
//   try {
//     const {
//       firstName,
//       middleName,
//       lastName,
//       dateOfBirth,
//       gender,
//       nationality,
//       civilIdNumber,
//       passportNumber,
//       mobileNumber,
//       email,
//       address,
//       fileOpenedDate,
//       firstVisitDate,
//       defaultDoctorId,
//       emContactName,
//       emContactRelation,
//       emContactPhone1,
//       emContactPhone2,
//     } = req.body;

//     if (
//       !firstName ||
//       !lastName ||
//       !dateOfBirth ||
//       !gender ||
//       !civilIdNumber ||
//       !email ||
//       !mobileNumber
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Missing required fields: firstName, lastName, dateOfBirth, gender, civilIdNumber, email, mobileNumber are required.",
//       });
//     }

//     //  Step 1: Generate next fileNumber from last existing one

//     const lastFileNumberQuery = `SELECT fileNumber FROM patients ORDER BY id DESC LIMIT 1`;

//     pool.query(lastFileNumberQuery, (err, lastResult) => {
//       if (err) {
//         return res.status(500).json({
//           success: false,
//           message: "Error fetching last file number",
//           error: err.message,
//         });
//       }

//       const lastFileNumber = lastResult[0]?.fileNumber || null;
//       const fileNumber = generateNextFileNumber(lastFileNumber);

//       //  Step 2: Check for duplicates
//       const checkDuplicateQuery = `
//         SELECT id FROM patients WHERE civilIdNumber = ? OR passportNumber = ?
//       `;

//       pool.query(
//         checkDuplicateQuery,
//         [civilIdNumber, passportNumber],
//         (dupErr, dupResults) => {
//           if (dupErr) {
//             return res.status(500).json({
//               success: false,
//               message: "Database error checking duplicates",
//               error: dupErr.message,
//             });
//           }

//           if (dupResults.length > 0) {
//             return res.status(409).json({
//               success: false,
//               message:
//                 "Patient with this Civil ID or Passport Number already exists",
//             });
//           }

//           //  Step 3: Prepare uploaded file data
//           const profileImage = req.files?.profileImage?.[0]?.filename || null;
//           const cprScan = req.files?.cprScan?.[0]?.filename || null;
//           const passportCopy = req.files?.passportCopy?.[0]?.filename || null;

//           //  Step 4: Insert new patient
//           const insertQuery = `
//           INSERT INTO patients (
//             fileNumber, firstName, middleName, lastName, profileImage, dateOfBirth, gender,
//             nationality, civilIdNumber, passportNumber, mobileNumber, email, address,
//             CPR_scan_doc, passport_copy, fileOpenedDate, firstVisitDate, defaultDoctorId,
//             emContactName, emContactRelation, emContactPhone1, emContactPhone2
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//           const values = [
//             fileNumber,
//             firstName,
//             middleName || null,
//             lastName,
//             profileImage,
//             dateOfBirth,
//             gender,
//             nationality || null,
//             civilIdNumber,
//             passportNumber || null,
//             mobileNumber || null,
//             email || null,
//             address || null,
//             cprScan,
//             passportCopy,
//             fileOpenedDate || null,
//             firstVisitDate || null,
//             defaultDoctorId || null,
//             emContactName || null,
//             emContactRelation || null,
//             emContactPhone1 || null,
//             emContactPhone2 || null,
//           ];

//           pool.query(insertQuery, values, (insertErr, result) => {
//             if (insertErr) {
//               return res.status(500).json({
//                 success: false,
//                 message: "Error registering patient",
//                 error: insertErr.message,
//               });
//             }

//             return res.status(201).json({
//               success: true,
//               message: "Patient registered successfully",
//               patientId: result.insertId,
//               fileNumber,
//             });
//           });
//         }
//       );
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

const registerPatient = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      nationality,
      civilIdNumber,
      passportNumber,
      mobileNumber,
      email,
      address,
      fileOpenedDate,
      firstVisitDate,
      defaultDoctorId,
      emContactName,
      emContactRelation,
      emContactPhone1,
      emContactPhone2,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !gender ||
      !civilIdNumber ||
      !email ||
      !mobileNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: firstName, lastName, dateOfBirth, gender, civilIdNumber, email, mobileNumber are required.",
      });
    }

    // ✅ Calculate age from DOB
    const calculateAge = (dob) => {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    };

    const age = calculateAge(dateOfBirth);

    const lastFileNumberQuery = `SELECT fileNumber FROM patients ORDER BY id DESC LIMIT 1`;

    pool.query(lastFileNumberQuery, (err, lastResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching last file number",
          error: err.message,
        });
      }

      const lastFileNumber = lastResult[0]?.fileNumber || null;
      const fileNumber = generateNextFileNumber(lastFileNumber);

      const checkDuplicateQuery = `
        SELECT id FROM patients WHERE civilIdNumber = ? OR passportNumber = ?
      `;

      pool.query(
        checkDuplicateQuery,
        [civilIdNumber, passportNumber],
        (dupErr, dupResults) => {
          if (dupErr) {
            return res.status(500).json({
              success: false,
              message: "Database error checking duplicates",
              error: dupErr.message,
            });
          }

          if (dupResults.length > 0) {
            return res.status(409).json({
              success: false,
              message:
                "Patient with this Civil ID or Passport Number already exists",
            });
          }

          const profileImage = req.files?.profileImage?.[0]?.filename || null;
          const cprScan = req.files?.cprScan?.[0]?.filename || null;
          const passportCopy = req.files?.passportCopy?.[0]?.filename || null;

          // ✅ Include `age` in insert query
          const insertQuery = `
          INSERT INTO patients (
            fileNumber, firstName, middleName, lastName, profileImage, dateOfBirth, age, gender,
            nationality, civilIdNumber, passportNumber, mobileNumber, email, address,
            CPR_scan_doc, passport_copy, fileOpenedDate, firstVisitDate, defaultDoctorId,
            emContactName, emContactRelation, emContactPhone1, emContactPhone2
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

          const values = [
            fileNumber,
            firstName,
            middleName || null,
            lastName,
            profileImage,
            dateOfBirth,
            age,
            gender,
            nationality || null,
            civilIdNumber,
            passportNumber || null,
            mobileNumber || null,
            email || null,
            address || null,
            cprScan,
            passportCopy,
            fileOpenedDate || null,
            firstVisitDate || null,
            defaultDoctorId || null,
            emContactName || null,
            emContactRelation || null,
            emContactPhone1 || null,
            emContactPhone2 || null,
          ];

          pool.query(insertQuery, values, (insertErr, result) => {
            if (insertErr) {
              return res.status(500).json({
                success: false,
                message: "Error registering patient",
                error: insertErr.message,
              });
            }

            return res.status(201).json({
              success: true,
              message: "Patient registered successfully",
            });
          });
        }
      );
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


/* const getAllPatients = async (req,res)=>{
  try {
    const getQuery = `SELECT patients.*, doctors.fullName as Primary_Doctor FROM patients 
    INNER JOIN doctors on doctors.id= patients.defaultDoctorId
    ORDER BY patients.id DESC`
    pool.query(getQuery,(err,results)=>{
      if(err) throw new Error
      else {
        return res.status(200).json({
          success : true,
          message : "All patient data retreived successfully",
          data : results
        })
      }
    })
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : "Internal Server Error",
      error : error.message
    })
  }
}
 */

const getAllPatients = async (req, res) => {
  try {
    const getQuery = `
      SELECT patients.*, doctors.fullName AS Primary_Doctor 
      FROM patients 
      LEFT JOIN doctors ON doctors.id = patients.defaultDoctorId
      ORDER BY patients.id DESC
    `;

    pool.query(getQuery, (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: err.message,
        });
      }

      const dataWithAge = results.map((patient) => {
        const birthDate = new Date(patient.dateOfBirth);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        // If the calculated age is negative (i.e., birth date is in future), set age = 0
        if (age < 0) age = 0;

        return {
          ...patient,
          age,
        };
      });

      return res.status(200).json({
        success: true,
        message: "All patient data retrieved successfully",
        data: dataWithAge,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const getQuery = `
      SELECT patients.*, doctors.fullName AS Primary_Doctor 
      FROM patients 
      LEFT JOIN doctors ON doctors.id = patients.defaultDoctorId
      WHERE patients.id = ?
    `;

    pool.query(getQuery, [id], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const patient = results[0];
      const birthDate = new Date(patient.dateOfBirth);
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 0) age = 0;

      return res.status(200).json({
        success: true,
        message: "Patient data retrieved successfully",
        data: { ...patient, age },
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Missing patientId in request params",
      });
    }

    // Fetch existing patient data
    const getQuery = `SELECT * FROM patients WHERE id = ?`;
    pool.query(getQuery, [patientId], (getErr, getResults) => {
      if (getErr || getResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
          error: getErr?.message,
        });
      }

      const existing = getResults[0];

      // Handle file updates, keep previous if not replaced
      const profileImage =
        req.files?.profileImage?.[0]?.filename || existing.profileImage;
      const cprScan =
        req.files?.cprScan?.[0]?.filename || existing.CPR_scan_doc;
      const passportCopy =
        req.files?.passportCopy?.[0]?.filename || existing.passport_copy;

      const updatedFields = {
        firstName: req.body.firstName || existing.firstName,
        middleName: req.body.middleName || existing.middleName,
        lastName: req.body.lastName || existing.lastName,
        profileImage,
        dateOfBirth: req.body.dateOfBirth || existing.dateOfBirth,
        gender: req.body.gender || existing.gender,
        nationality: req.body.nationality || existing.nationality,
        civilIdNumber: req.body.civilIdNumber || existing.civilIdNumber,
        passportNumber: req.body.passportNumber || existing.passportNumber,
        mobileNumber: req.body.mobileNumber || existing.mobileNumber,
        email: req.body.email || existing.email,
        address: req.body.address || existing.address,
        CPR_scan_doc: cprScan,
        passport_copy: passportCopy,
        fileOpenedDate: req.body.fileOpenedDate || existing.fileOpenedDate,
        firstVisitDate: req.body.firstVisitDate || existing.firstVisitDate,
        defaultDoctorId: req.body.defaultDoctorId || existing.defaultDoctorId,
        emContactName: req.body.emContactName || existing.emContactName,
        emContactRelation:
          req.body.emContactRelation || existing.emContactRelation,
        emContactPhone1: req.body.emContactPhone1 || existing.emContactPhone1,
        emContactPhone2: req.body.emContactPhone2 || existing.emContactPhone2,
      };

      const updateQuery = `
        UPDATE patients SET
          firstName = ?, middleName = ?, lastName = ?, profileImage = ?, dateOfBirth = ?, gender = ?,
          nationality = ?, civilIdNumber = ?, passportNumber = ?, mobileNumber = ?, email = ?,
          address = ?, CPR_scan_doc = ?, passport_copy = ?, fileOpenedDate = ?, firstVisitDate = ?, 
          defaultDoctorId = ?, emContactName = ?, emContactRelation = ?, emContactPhone1 = ?, emContactPhone2 = ?
        WHERE id = ?
      `;

      const updateValues = [
        updatedFields.firstName,
        updatedFields.middleName,
        updatedFields.lastName,
        updatedFields.profileImage,
        updatedFields.dateOfBirth,
        updatedFields.gender,
        updatedFields.nationality,
        updatedFields.civilIdNumber,
        updatedFields.passportNumber,
        updatedFields.mobileNumber,
        updatedFields.email,
        updatedFields.address,
        updatedFields.CPR_scan_doc,
        updatedFields.passport_copy,
        updatedFields.fileOpenedDate,
        updatedFields.firstVisitDate,
        updatedFields.defaultDoctorId,
        updatedFields.emContactName,
        updatedFields.emContactRelation,
        updatedFields.emContactPhone1,
        updatedFields.emContactPhone2,
        patientId,
      ];

      pool.query(updateQuery, updateValues, (updateErr) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Error updating patient",
            error: updateErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Patient updated successfully",
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const AddPatientServices = async (req, res) => {
  try {
    const { patientId, doctor_id, serviceId, amount, insurance, vat } =
      req.body;

    const sql = `
    INSERT INTO patient_services 
    (patientId, doctor_id, serviceId, amount, insurance, vat)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

    pool.query(
      sql,
      [patientId, doctor_id, serviceId, amount, insurance, vat],
      (err, result) => {
        if (err) {
          console.error("Error inserting patient service:", err);
          return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({
          message: "Patient service created successfully",
          id: result.insertId,
        });
      }
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// GET API to retrieve patient service list
const GetPatientServices = async (req, res) => {
  try {
    const patientId = req.params.id;
    const sql = `
    SELECT 
      ps.id,
      ps.patientId,
      ps.doctor_id,
      ps.serviceId,
      ps.amount,
      ps.insurance,
      ps.vat,
      ps.createdAt,
      ps.updatedAt,
      s.serial_number,
      s.serviceCode ,
      s.serviceName, s.durationMinutes, s.standardCost, s.secondaryCost, s.insuranceCost, s.category
    FROM patient_services ps
    INNER JOIN services as s on s.id=ps.serviceId
    WHERE ps.patientId = ?
  `;

    pool.query(sql, [patientId], (err, results) => {
      if (err) {
        console.error("Error fetching service by ID:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json({ data: results });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient id is required",
      });
    }

    const deleteQuery = `Delete from patients where id = ?`;
    pool.query(deleteQuery, [patientId], (err, result) => {
      console.log(result);
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while deleting patient",
          error: err.message,
        });
      } else if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Patient data deleted successfully",
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// const createAppointment = (req, res) => {
//   const {
//     patientId,
//     doctorId: userDoctorId,
//     appointmentDate,
//     startTime,
//     endTime,
//     reason,
//   } = req.body;

//   if (!patientId) {
//     return res.status(400).json({
//       success: false,
//       message: "Patient ID is required",
//     });
//   }

//   if (!appointmentDate) {
//     return res.status(400).json({
//       success: false,
//       message: "Appointment date is required",
//     });
//   }

//   const patientQuery = `SELECT * FROM patients WHERE id = ?`;
//   pool.query(patientQuery, [patientId], (err, patientResult) => {
//     if (err) {
//       return res.status(500).json({
//         success: false,
//         message: "Error retrieving patient info",
//         error: err.message,
//       });
//     }

//     if (patientResult.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found",
//       });
//     }

//     const patientName =
//       patientResult[0].firstName + " " + patientResult[0].lastName;

//     if (userDoctorId) {
//       const doctorQuery = `SELECT * FROM doctors WHERE id = ?`;
//       pool.query(doctorQuery, [userDoctorId], (err, doctorResult) => {
//         if (err) {
//           return res.status(500).json({
//             success: false,
//             message: "Error retrieving doctor info",
//             error: err.message,
//           });
//         }

//         if (doctorResult.length === 0) {
//           return res.status(404).json({
//             success: false,
//             message: "Doctor not found",
//           });
//         }

//         const actualDoctorId = doctorResult[0].id;
//         const doctorName = doctorResult[0].fullName;

//         insertAppointment(
//           patientId,
//           patientName,
//           actualDoctorId,
//           doctorName,
//           appointmentDate,
//           startTime,
//           endTime,
//           reason,
//           res
//         );
//       });
//     } else {
//       // If no doctor assigned
//       insertAppointment(
//         patientId,
//         patientName,
//         null,
//         null,
//         appointmentDate,
//         startTime,
//         endTime,
//         reason,
//         res
//       );
//     }
//   });
// };

const createAppointment = (req, res) => {
  const {
    patientId,
    doctorId: userDoctorId,
    appointmentDate,
    startTime,
    endTime,
    reason,
  } = req.body;

  console.log(req.body);
  
  if (!patientId || !appointmentDate ){
    return res.status(400).json({
      success: false,
      message: "Patient ID and appointment date are required",
    });
  }

  // ✅ Convert times to comparable Date objects (base day doesn't matter)
  const parseTime = (t) => new Date(`1970-01-01T${t}`);

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const noon = parseTime("12:00:00");
  const midnight = parseTime("23:59:59");

  // ✅ Validate time is in allowed window: between 12:00 PM and 12:00 AM
  if (start < noon || end > midnight || start >= end) {
    return res.status(400).json({
      success: false,
      message: "Appointment time must be between 12:00 PM and 12:00 AM, and startTime must be before endTime",
    });
  }

  const patientQuery = `SELECT * FROM patients WHERE id = ?`;
  pool.query(patientQuery, [patientId], (err, patientResult) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error retrieving patient info",
        error: err.message,
      });
    }

    if (patientResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const patientName =
      patientResult[0].firstName + " " + patientResult[0].lastName;

    // ✅ Check for overlapping appointments for this patient or doctor
    const overlapQuery = `
      SELECT * FROM appointments 
      WHERE appointmentDate = ?
      AND (
        (patientId = ? OR doctorId = ?)
        AND (
          (? BETWEEN startTime AND endTime)
          OR (? BETWEEN startTime AND endTime)
          OR (startTime BETWEEN ? AND ?)
          OR (endTime BETWEEN ? AND ?)
        )
      )
    `;

    pool.query(
      overlapQuery,
      [
        appointmentDate,
        patientId,
        userDoctorId || 0, // use 0 if doctor not provided
        startTime,
        endTime,
        startTime,
        endTime,
        startTime,
        endTime,
      ],
      (overlapErr, overlapResults) => {
        if (overlapErr) {
          return res.status(500).json({
            success: false,
            message: "Error checking overlapping appointments",
            error: overlapErr.message,
          });
        }

        if (overlapResults.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Appointment overlaps with an existing one for the patient or doctor",
          });
        }

        // ✅ Continue with doctor check
        if (userDoctorId) {
          const doctorQuery = `SELECT * FROM doctors WHERE id = ?`;
          pool.query(doctorQuery, [userDoctorId], (err, doctorResult) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "Error retrieving doctor info",
                error: err.message,
              });
            }

            if (doctorResult.length === 0) {
              return res.status(404).json({
                success: false,
                message: "Doctor not found",
              });
            }

            const actualDoctorId = doctorResult[0].id;
            const doctorName = doctorResult[0].fullName;

            insertAppointment(
              patientId,
              patientName,
              actualDoctorId,
              doctorName,
              appointmentDate,
              startTime,
              endTime,
              reason,
              res
            );
          });
        } else {
          // No doctor assigned
          insertAppointment(
            patientId,
            patientName,
            null,
            null,
            appointmentDate,
            startTime,
            endTime,
            reason,
            res
          );
        }
      }
    );
  });
};

const getAllAppointments = async (req, res) => {
  try {
    const fetchAppointments = () => {
      return new Promise((resolve, reject) => {
        const query = "SELECT * FROM appointments";
        pool.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const appointments = await fetchAppointments();

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointments fetched successfully",
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving appointments",
      error: error.message,
    });
  }
};

const editAppointment = (req, res) => {
  const { appointmentId } = req.params;
  const {
    appointmentDate: newDate,
    startTime: newStart,
    endTime: newEnd,
    reason: newReason,
  } = req.body;

  if (!appointmentId) {
    return res.status(400).json({
      success: false,
      message: "Appointment ID is required",
    });
  }

  const parseTime = (t) => new Date(`1970-01-01T${t}`);
  const noon = parseTime("12:00:00");
  const midnight = parseTime("23:59:59");

  // Get existing appointment details
  const getAppointmentQuery = `SELECT * FROM appointments WHERE id = ?`;
  pool.query(getAppointmentQuery, [appointmentId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching appointment",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = result[0];

    // Fallback to old values if new ones not provided
    const appointmentDate = newDate || appointment.appointmentDate;
    const startTime = newStart || appointment.startTime;
    const endTime = newEnd || appointment.endTime;
    const reason = newReason !== undefined ? newReason : appointment.reason;

    // Time validation
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (start < noon || end > midnight || start >= end) {
      return res.status(400).json({
        success: false,
        message: "Time must be between 12:00 PM and 12:00 AM, and startTime < endTime",
      });
    }

    const { patientId, doctorId } = appointment;

    // Check for overlaps (exclude current appointment)
    const overlapQuery = `
      SELECT * FROM appointments 
      WHERE appointmentDate = ?
      AND id != ?
      AND (
        (patientId = ? OR doctorId = ?)
        AND (
          (? BETWEEN startTime AND endTime)
          OR (? BETWEEN startTime AND endTime)
          OR (startTime BETWEEN ? AND ?)
          OR (endTime BETWEEN ? AND ?)
        )
      )
    `;

    pool.query(
      overlapQuery,
      [
        appointmentDate,
        appointmentId,
        patientId,
        doctorId || 0,
        startTime,
        endTime,
        startTime,
        endTime,
        startTime,
        endTime,
      ],
      (overlapErr, overlapResults) => {
        if (overlapErr) {
          return res.status(500).json({
            success: false,
            message: "Error checking overlaps",
            error: overlapErr.message,
          });
        }

        if (overlapResults.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Appointment overlaps with another for patient or doctor",
          });
        }

        // Update the appointment
        const updateQuery = `
          UPDATE appointments SET
            appointmentDate = ?,
            startTime = ?,
            endTime = ?,
            reason = ?
          WHERE id = ?
        `;

        pool.query(
          updateQuery,
          [appointmentDate, startTime, endTime, reason, appointmentId],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({
                success: false,
                message: "Error updating appointment",
                error: updateErr.message,
              });
            }

            return res.status(200).json({
              success: true,
              message: "Appointment updated successfully",
            });
          }
        );
      }
    );
  });
};



const getWaitingAppointments = async (req, res) => {
  try {
    const fetchAppointments = () => {
      return new Promise((resolve, reject) => {
        const query = "SELECT * FROM appointments WHERE status = 'Waiting'";
        pool.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const appointments = await fetchAppointments();

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments with status 'Waiting' found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointments with status 'Waiting' fetched successfully",
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving appointments",
      error: error.message,
    });
  }
};

const getConfirmedAppointments = async (req, res) => {
  try {
    const fetchAppointments = () => {
      return new Promise((resolve, reject) => {
        const query = `
          SELECT 
            a.*, 
            p.firstName, p.middleName, p.lastName, p.gender, p.dateOfBirth, p.age,
            p.mobileNumber, p.email, p.nationality, p.address,
            p.profileImage, p.civilIdNumber, p.passportNumber
          FROM appointments a
          JOIN patients p ON a.patientId = p.id
          WHERE a.status = 'Confirmed' or a.status = 'Cancelled'
        `;

        pool.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const appointments = await fetchAppointments();

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments with status 'Confirmed' found",
        data: [],
      });
    }

    //  Add `duration` field in each appointment
    const enhancedAppointments = appointments.map((appt) => {
      let durationInMinutes = null;

      if (appt.startTime && appt.endTime) {
        const start = new Date(`1970-01-01T${appt.startTime}`);
        const end = new Date(`1970-01-01T${appt.endTime}`);

        if (!isNaN(start) && !isNaN(end)) {
          const diffMs = end - start;
          durationInMinutes = Math.floor(diffMs / 60000); // Convert milliseconds to minutes
        }
      }

      return {
        ...appt,
        duration: durationInMinutes !== null ? `${durationInMinutes} min` : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Confirmed appointments with patient data fetched successfully",
      data: enhancedAppointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving appointments",
      error: error.message,
    });
  }
};

const deleteAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Appointment id is required",
      });
    }

    const deleteQuery = `Delete from appointments where id = ?`;
    pool.query(deleteQuery, [id], (err, result) => {
      console.log(result);
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while deleting appointment",
          error: err.message,
        });
      } else if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Appointment data deleted successfully",
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const insertAppointment = (
  patientId,
  patientName,
  doctorId,
  doctorName,
  appointmentDate,
  startTime,
  endTime,
  reason,
  res
) => {
  const isConfirmed = doctorId && startTime && endTime;
  const status = isConfirmed ? "confirmed" : "waiting";

  const insertQuery = `
    INSERT INTO appointments (patientId , patientName , doctorId , doctorName , appointmentDate, startTime, endTime , reason, status)
    VALUES (?, ?, ?, ?,?, ?, ?,?,?)`;

  pool.query(
    insertQuery,
    [
      patientId,
      patientName,
      doctorId,
      doctorName,
      appointmentDate,
      startTime,
      endTime,
      reason,
      status,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error inserting appointment",
          error: err.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: {
          appointmentId: result.insertId,
          status,
        },
      });
    }
  );
};

const getAllNationalities = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const doctorAvailability = async (req, res) => {
  const data = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ error: "Input must be a non-empty array." });
  }

  for (const item of data) {
    if (!isValidSchedule(item)) {
      return res
        .status(400)
        .json({ error: "Invalid schedule object detected." });
    }
  }

  const doctorIds = data.map((d) => d.doctor_id);
  const uniqueDoctorIds = [...new Set(doctorIds)];
  const placeholders = uniqueDoctorIds.map(() => "?").join(", ");
  const checkSql = `SELECT id FROM doctors WHERE id IN (${placeholders})`;

  try {
    pool.query(checkSql, uniqueDoctorIds, (checkErr, results) => {
      if (checkErr) {
        console.error("Doctor ID check failed:", checkErr);
        return res
          .status(500)
          .json({ error: "Internal server error during doctor check" });
      }

      const existingIds = results.map((r) => r.id);
      const missingIds = uniqueDoctorIds.filter(
        (id) => !existingIds.includes(id)
      );

      if (missingIds.length > 0) {
        return res.status(400).json({
          error: `These doctor_id(s) do not exist: ${missingIds.join(", ")}`,
        });
      }

      // Step 2: Check for time overlaps
      const overlapPromises = data.map((item) => {
        return new Promise((resolve, reject) => {
          const overlapQuery = `
            SELECT * FROM doctor_availability
            WHERE doctor_id = ? AND day_of_week = ?
              AND (
                (start_time < ? AND end_time > ?) OR
                (start_time < ? AND end_time > ?) OR
                (start_time >= ? AND end_time <= ?)
              )
          `;
          pool.query(
            overlapQuery,
            [
              item.doctor_id,
              item.day_of_week,
              item.end_time,
              item.start_time, // Check partial overlap
              item.start_time,
              item.end_time, // Check partial overlap
              item.start_time,
              item.end_time, // Check complete overlap
            ],
            (err, results) => {
              if (err) return reject(err);
              resolve(results.length > 0 ? item : null);
            }
          );
        });
      });

      Promise.all(overlapPromises)
        .then((overlapping) => {
          const overlappingSchedules = overlapping.filter(Boolean);

          if (overlappingSchedules.length > 0) {
            return res.status(409).json({
              success: false,
              message: "Some schedules overlap with existing entries.",
              conflicts: overlappingSchedules,
            });
          }

          // Step 3: Insert if no overlaps
          const values = [];
          const placeholders = [];

          data.forEach((item) => {
            placeholders.push("(?, ?, ?, ?)");
            values.push(
              item.doctor_id,
              item.day_of_week,
              item.start_time,
              item.end_time
            );
          });

          const insertSql = `
          INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
          VALUES ${placeholders.join(", ")}
        `;

          pool.query(insertSql, values, (insertErr, result) => {
            if (insertErr) {
              console.error("Database insert error:", insertErr);
              return res
                .status(500)
                .json({ error: "Failed to insert availability records" });
            }

            res.status(201).json({
              success: true,
              message: `${result.affectedRows} schedule(s) inserted successfully`,
            });
          });
        })
        .catch((err) => {
          console.error("Overlap check error:", err);
          res.status(500).json({ error: "Failed to check time conflicts" });
        });
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const getAppointmentsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    console.log(date);
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required in query (format: YYYY-MM-DD)",
      });
    }

    const fetchAppointmentsByDate = () => {
      return new Promise((resolve, reject) => {
        const query = `
  SELECT 
    a.*, 
    p.firstName, p.middleName, p.lastName, p.gender, p.dateOfBirth, p.age,
    p.mobileNumber, p.email, p.nationality, p.address,
    p.profileImage, p.civilIdNumber, p.passportNumber
  FROM appointments a
  JOIN patients p ON a.patientId = p.id
  WHERE DATE(a.appointmentDate) = ?
`;

        pool.query(query, [date], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const appointments = await fetchAppointmentsByDate();

    console.log(appointments);
    

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No appointments found for date ${date}`,
        data: [],
      });
    }

    // Add duration between start and end time
    const enhancedAppointments = appointments.map((appt) => {
      let durationInMinutes = null;
      if (appt.startTime && appt.endTime) {
        const start = new Date(`1970-01-01T${appt.startTime}`);
        const end = new Date(`1970-01-01T${appt.endTime}`);
        if (!isNaN(start) && !isNaN(end)) {
          const diffMs = end - start;
          durationInMinutes = Math.floor(diffMs / 60000);
        }
      }
      return {
        ...appt,
        duration: durationInMinutes !== null ? `${durationInMinutes} min` : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Appointments for ${date} fetched successfully`,
      data: enhancedAppointments,
    });
  } catch (error) {
    console.error("Error fetching appointments by date:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving appointments",
      error: error.message,
    });
  }
};

const appointmentByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    const getAppointments = () => {
      return new Promise((resolve, reject) => {
        const query = "SELECT * FROM appointments WHERE doctorId = ?";
        pool.query(query, [doctorId], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const results = await getAppointments();

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments found for this doctor",
      });
    }

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const appointmentByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Validate patient ID
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required in the request parameters.",
      });
    }

    // Fetch appointments from the database
    const getAppointments = () => {
      return new Promise((resolve, reject) => {
        const query = "SELECT * FROM appointments WHERE patientId = ?";
        pool.query(query, [patientId], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const results = await getAppointments();

    // No appointments found
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments found for the provided patient ID.",
      });
    }

    // Appointments found
    return res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully.",
      data: results,
    });
  } catch (error) {
    console.error("Error fetching appointments by patient ID:", error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while retrieving appointments. Please try again later.",
      error: error.message,
    });
  }
};

const bookingAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    const { doctorId, startTime, endTime } = req.body;
    if (!doctorId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID, start time, and end time are required",
      });
    }

    const doctorQuery = `SELECT * FROM doctors WHERE id = ?`;
    pool.query(doctorQuery, [doctorId], (doctorErr, doctorResult) => {
      if (doctorErr) {
        return res.status(500).json({
          success: false,
          message: "Database error while checking doctor",
          error: doctorErr.message,
        });
      }

      if (doctorResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const doctorName = doctorResult[0].fullName;

      const appointmentQuery = `SELECT * FROM appointments WHERE id = ? AND status = 'Waiting'`;
      pool.query(appointmentQuery, [appointmentId], (apptErr, apptResult) => {
        if (apptErr) {
          return res.status(500).json({
            success: false,
            message: "Database error while checking appointment",
            error: apptErr.message,
          });
        }

        if (apptResult.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Appointment not found or already booked",
          });
        }

        const updateQuery = `
          UPDATE appointments
          SET doctorId = ?, doctorName = ?, startTime = ?, endTime = ?, status = 'Confirmed'
          WHERE id = ?
        `;

        pool.query(
          updateQuery,
          [doctorId, doctorName, startTime, endTime, appointmentId],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({
                success: false,
                message: "Failed to book appointment",
                error: updateErr.message,
              });
            }

            return res.status(200).json({
              success: true,
              message: "Appointment booked successfully",
            });
          }
        );
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const changeAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    // Validate input
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    const validStatuses = ["No-show", "Completed", "Cancelled" ,"Not Confirmed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or missing status. Allowed values: 'No-Show', 'Completed', 'Cancelled' , 'Not Confirmed' ",
      });
    }

    // Check if appointment exists
    const appointmentQuery = `SELECT * FROM appointments WHERE id = ?`;
    pool.query(appointmentQuery, [appointmentId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while fetching appointment",
          error: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // Update the appointment status
      const updateQuery = `UPDATE appointments SET status = ? WHERE id = ?`;
      pool.query(updateQuery, [status, appointmentId], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Failed to update appointment status",
            error: updateErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: `Appointment status updated to '${status}'`,
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const cancelAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    console.log(appointmentId);
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    const checkQuery = `SELECT * FROM appointments WHERE id = ? AND status = 'Confirmed'`;

    pool.query(checkQuery, [appointmentId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error during appointment lookup",
          error: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No confirmed appointment found with the given ID",
        });
      }

      const updateQuery = `UPDATE appointments SET status = 'Cancelled' WHERE id = ?`;

      pool.query(updateQuery, [appointmentId], (updateErr, updateResult) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Error updating appointment status",
            error: updateErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Appointment status updated to 'Cancelled' successfully",
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const recordPatientVitals = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      recorded_at,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      respiratory_rate,
      pulse,
      spo2,
      rbs_mg,
      rbs_nmol,
      bp_position,
      temperature,
      weight,
      height,
      risk_of_fall,
      urgency,
      notes
    } = req.body;
console.log(req.body);

    // Step 1: Validate required fields
    if (!patient_id || !recorded_at || blood_pressure_systolic == null || blood_pressure_diastolic == null || weight == null || height == null) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patient_id, recorded_at, blood pressure, weight, and height are required.",
      });
    }

    // Step 2: Fetch patient details
    const patientQuery = `SELECT firstName, middleName, lastName, age, gender FROM patients WHERE id = ?`;
    pool.query(patientQuery, [patient_id], (err, patientResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error checking patient",
          error: err.message,
        });
      }

      if (!patientResult.length) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

const { firstName, middleName, lastName, age, gender } = patientResult[0];

const fullName = `${firstName} ${middleName || ''} ${lastName}`.trim().replace(/\s+/g, ' ');

      // Optional: Fetch doctor name
      const getDoctorName = () => {
        return new Promise((resolve) => {
          if (!doctor_id) return resolve(null);

          pool.query(`SELECT fullName FROM doctors WHERE id = ?`, [doctor_id], (docErr, docRes) => {
            if (docErr || !docRes.length) return resolve(null);
            console.log(docRes);
            
            resolve(docRes[0].fullName);
          });
        });
      };

      getDoctorName().then((doctorName) => {
        // Step 3: Build values
        const blood_pressure = `${blood_pressure_systolic}/${blood_pressure_diastolic}`;
        const height_in_m = height / 100;
        const bmi = (height_in_m > 0) ? (weight / (height_in_m * height_in_m)).toFixed(2) : 0;

        // Step 4: Insert into DB
        const insertQuery = `
          INSERT INTO patient_vitals (
            patient_id, patient_name, doctor_id, doctor_name, age, gender, recorded_at, blood_pressure, 
            respiratory_rate, pulse, spo2, rbs_mg, rbs_nmol, bp_position, temperature, weight, height, bmi,
            risk_of_fall, urgency, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          patient_id,
          fullName,
          doctor_id || null,
          doctorName,
          age,
          gender,
          recorded_at,
          blood_pressure,
          respiratory_rate || 0,
          pulse || 0,
          spo2 || 0,
          rbs_mg || 0,
          rbs_nmol || 0,
          bp_position || null,
          temperature || 0,
          weight,
          height,
          parseFloat(bmi),
          risk_of_fall || 'Low',
          urgency || 'Normal',
          notes || ''
        ];

        pool.query(insertQuery, values, (insertErr, result) => {
          if (insertErr) {
            return res.status(500).json({
              success: false,
              message: "Error saving vitals",
              error: insertErr.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Patient vitals recorded successfully",
            vitalsId: result.insertId,
          });
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const getPatientVitalsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Missing patientId in request parameters.",
      });
    }

    const query = `
      SELECT 
        id, patient_id, patient_name, doctor_id, doctor_name, age, gender, 
        recorded_at, blood_pressure, respiratory_rate, pulse, spo2, rbs_mg, 
        rbs_nmol, bp_position, temperature, weight, height, bmi, 
        risk_of_fall, urgency, notes 
      FROM patient_vitals 
      WHERE patient_id = ? 
      ORDER BY recorded_at DESC
    `;

    pool.query(query, [patientId], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while retrieving vitals",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No vitals found for the specified patient_id",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Patient vitals retrieved successfully",
        vitals: results,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const updatePatientVitals = async (req, res) => {
  try {
    const { vitalId } = req.params;

    if (!vitalId) {
      return res.status(400).json({
        success: false,
        message: "Missing vitalId in request params",
      });
    }

    // Step 1: Get existing vitals
    const getQuery = `SELECT * FROM patient_vitals WHERE id = ?`;
    pool.query(getQuery, [vitalId], (getErr, getResults) => {
      if (getErr || getResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Vitals record not found",
          error: getErr?.message,
        });
      }

      const existing = getResults[0];

      // Step 2: Prepare updated data
      const updatedFields = {
        patient_id: req.body.patient_id || existing.patient_id,
        nurse: req.body.nurse || existing.nurse,
        recorded_at: req.body.recorded_at || existing.recorded_at,
        blood_pressure_systolic:
          req.body.blood_pressure_systolic || existing.blood_pressure_systolic,
        blood_pressure_diastolic:
          req.body.blood_pressure_diastolic ||
          existing.blood_pressure_diastolic,
        heart_rate: req.body.heart_rate || existing.heart_rate,
        respiratory_rate:
          req.body.respiratory_rate || existing.respiratory_rate,
        temperature: req.body.temperature || existing.temperature,
        weight: req.body.weight || existing.weight,
        height: req.body.height || existing.height,
        bmi: req.body.bmi || existing.bmi,
        oxygen_saturation:
          req.body.oxygen_saturation || existing.oxygen_saturation,
        notes: req.body.notes || existing.notes,
      };

      // Step 3: Build and run update query
      const updateQuery = `
        UPDATE patient_vitals SET
          patient_id = ?, nurse = ?, recorded_at = ?, blood_pressure_systolic = ?, blood_pressure_diastolic = ?,
          heart_rate = ?, respiratory_rate = ?, temperature = ?, weight = ?, height = ?, bmi = ?, oxygen_saturation = ?, notes = ?
        WHERE id = ?
      `;

      const updateValues = [
        updatedFields.patient_id,
        updatedFields.nurse,
        updatedFields.recorded_at,
        updatedFields.blood_pressure_systolic,
        updatedFields.blood_pressure_diastolic,
        updatedFields.heart_rate,
        updatedFields.respiratory_rate,
        updatedFields.temperature,
        updatedFields.weight,
        updatedFields.height,
        updatedFields.bmi,
        updatedFields.oxygen_saturation,
        updatedFields.notes,
        vitalId,
      ];

      pool.query(updateQuery, updateValues, (updateErr) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Error updating vitals",
            error: updateErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Vitals updated successfully",
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deletePatientVital = async (req, res) => {
  try {
    const { id, patientId } = req.params;

    if (!id || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Missing id or patientId in parameters',
      });
    }

    const query = 'DELETE FROM patient_vitals WHERE id = ? AND patient_id = ?';

    pool.query(query, [id, patientId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete patient vital record',
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'No record found with the given id and patient_id',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Patient vital record deleted successfully',
      });
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};


const recordPatientDiagnosis = (req, res) => {
  const {
    patient_id,
    doctor_id,
    icd10_id,
    diagnosis_date,
    notes,
    // Removed 'status' field from here
  } = req.body;

  // Step 1: Validate required fields
  if (!patient_id || !doctor_id || !icd10_id || !diagnosis_date) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields: patient_id, doctor_id, icd10_id, and diagnosis_date are required.",
    });
  }

  // Removed status validation here as it's not present

  // Step 2: Validate that the patient exists
  const checkPatientQuery = `SELECT id FROM patients WHERE id = ?`;
  pool.query(checkPatientQuery, [patient_id], (patientErr, patientResult) => {
    if (patientErr) {
      console.error("Error checking for patient:", patientErr);
      return res.status(500).json({
        success: false,
        message: "Error checking for patient",
        error: patientErr.message,
      });
    }
    if (patientResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Step 3: Validate that the doctor exists
    // Ensure 'user_id' is the correct column in your `doctors` table for `doctor_id` lookup
    const checkDoctorQuery = `SELECT id FROM doctors WHERE id = ?`;
    pool.query(checkDoctorQuery, [doctor_id], (doctorErr, doctorResult) => {
      if (doctorErr) {
        console.error("Error checking for doctor:", doctorErr);
        return res.status(500).json({
          success: false,
          message: "Error checking for doctor",
          error: doctorErr.message,
        });
      }
      if (doctorResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      // Step 4: Validate that the ICD-10 code exists
      // Ensure 'id' is the correct column in your `icds_10` table for `icd10_id` lookup
      const checkIcd10Query = `SELECT id FROM icds_10 WHERE id = ?`;
      pool.query(checkIcd10Query, [icd10_id], (icd10Err, icd10Result) => {
        if (icd10Err) {
          console.error("Error checking for ICD-10 code:", icd10Err);
          return res.status(500).json({
            success: false,
            message: "Error checking for ICD-10 code",
            error: icd10Err.message,
          });
        }
        if (icd10Result.length === 0) {
          return res.status(404).json({
            success: false,
            message: "ICD-10 code not found",
          });
        }

        // Step 5: All checks passed, insert the diagnosis
        const insertDiagnosisQuery = `
          INSERT INTO patient_diagnosis (
            patient_id, doctor_id, icd10_id, diagnosis_date, notes
            -- Removed 'status' column from here
          ) VALUES (?, ?, ?, ?, ?)
          -- Removed 'status' placeholder from here
        `;
        const values = [
          patient_id,
          doctor_id,
          icd10_id,
          diagnosis_date,
          notes || null, // Store null if notes is empty or undefined
          // Removed 'status' value from here
        ];

        pool.query(insertDiagnosisQuery, values, (insertErr, result) => {
          if (insertErr) {
            console.error("Error saving patient diagnosis:", insertErr);
            return res.status(500).json({
              success: false,
              message: "Error saving patient diagnosis",
              error: insertErr.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Patient diagnosis recorded successfully",
            diagnosisId: result.insertId, // This assumes an auto-incrementing primary key
          });
        });
      });
    });
  });
};

const getDiagnosisByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient id is required",
      });
    }

    const patientQuery = `Select * from patient_diagnosis where id = ?`;
    await pool.query(patientQuery, [patientId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database query failed",
        });
      }
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Patient with ID ${patientId} not found`,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Patient data fetched successfully",
        data: result,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const addRxMedicine = async (req, res) => {
  try {
    const {
      medicine_name,
      strength,
      unit,
      pharmaceutical_form,
      frequency,
      duration,
      notes,
      route,
      product_type,
      active_substances
    } = req.body;

    // Validate required fields
    if (!medicine_name) {
      return res.status(400).json({ success: false, message: "Medicine name is required" });
    }

    // Check if medicine already exists (by name)
    const checkQuery = 'SELECT * FROM rx_list WHERE medicine_name = ?';
    pool.query(checkQuery, [medicine_name], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({
          success: false,
          message: "Error checking for existing medicine",
          error: checkErr.message
        });
      }

      if (checkResult.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Medicine already exists",
          data: checkResult[0]
        });
      }

      // Insert new medicine
      const insertQuery = `
        INSERT INTO rx_list (
          medicine_name,
          strength,
          unit,
          pharmaceutical_form,
          frequency,
          duration,
          notes,
          route,
          product_type,
          active_substances
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        medicine_name,
        strength,
        unit,
        pharmaceutical_form,
        frequency,
        duration,
        notes,
        route,
        product_type,
        active_substances
      ];

      pool.query(insertQuery, values, (insertErr, insertResult) => {
        if (insertErr) {
          return res.status(500).json({
            success: false,
            message: "Failed to insert medicine",
            error: insertErr.message
          });
        }

        return res.status(201).json({
          success: true,
          message: "Medicine added successfully",
          insertId: insertResult.insertId
        });
      });
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


const getAllRxList = async (req, res) => {
  try {
    const fetchRxList = () => {
      return new Promise((resolve, reject) => {
        const query = `
          SELECT 
            id AS rxId,
            medicine_name AS medicineName,
            strength,
            unit,
            pharmaceutical_form AS form,
            frequency,
            duration,
            notes,
            route,
            product_type AS productType,
            active_substances AS activeSubstances
          FROM rx_list
        `;

        pool.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const rxList = await fetchRxList();

    if (!rxList.length) {
      return res.status(404).json({
        success: false,
        message: "No medicines found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Medicines fetched successfully",
      data: rxList,
    });

  } catch (error) {
    console.error("Error fetching rx list:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the rx list",
      error: error.message,
    });
  }
};

const deleteRxMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Medicine ID is required"
      });
    }

    // Check if medicine exists
    const checkQuery = 'SELECT * FROM rx_list WHERE id = ?';
    pool.query(checkQuery, [id], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({
          success: false,
          message: "Error checking medicine existence",
          error: checkErr.message
        });
      }

      if (checkResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Medicine not found"
        });
      }

      // Delete the medicine
      const deleteQuery = 'DELETE FROM rx_list WHERE id = ?';
      pool.query(deleteQuery, [id], (deleteErr, deleteResult) => {
        if (deleteErr) {
          return res.status(500).json({
            success: false,
            message: "Failed to delete medicine",
            error: deleteErr.message
          });
        }

        return res.status(200).json({
          success: true,
          message: "Medicine deleted successfully"
        });
      });
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


const addCategories = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required",
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: "description is required",
      });
    }

    // Check if category name already exists
    const duplicateCheckQuery = 'SELECT * FROM categories WHERE name = ?';
    pool.query(duplicateCheckQuery, [name], (dupErr, dupResult) => {
      if (dupErr) {
        return res.status(500).json({
          success: false,
          message: "Error checking existing category",
          error: dupErr.message,
        });
      }

      if (dupResult.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }

      // Insert new category
      const insertQuery = `INSERT INTO categories (name, description) VALUES (?, ?)`;
      pool.query(insertQuery, [name, description], (insertErr, insertResult) => {
        if (insertErr) {
          return res.status(500).json({
            success: false,
            message: 'Database insertion failed',
            error: insertErr.message,
          });
        }

        // Fetch the inserted category (optional)
        const selectQuery = 'SELECT * FROM categories WHERE id = ?';
        const insertedId = insertResult.insertId;

        pool.query(selectQuery, [insertedId], (selectErr, selectResult) => {
          if (selectErr) {
            return res.status(500).json({
              success: false,
              message: 'Error fetching inserted category',
              error: selectErr.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: 'Category inserted successfully',
            data: selectResult[0],
          });
        });
      });
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const query = 'SELECT * FROM categories';
    
    pool.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve categories',
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No categories found',
          data: []
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: results
      });
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;

  const { name, description } = req.body;

  // Step 1: Check if category exists
  const selectQuery = 'SELECT * FROM categories WHERE id = ?';
  pool.query(selectQuery, [id], (selectErr, selectResult) => {
    if (selectErr) {
      return res.status(500).json({
        success: false,
        message: "Error fetching category",
        error: selectErr.message
      });
    }

    if (selectResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    const existingCategory = selectResult[0];

    // Step 2: Fallback to existing values if not provided in request
    const updatedName = name || existingCategory.name;
    const updatedDescription = description || existingCategory.description;

    // Step 3: Perform the update
    const updateQuery = 'UPDATE categories SET name = ?, description = ? WHERE id = ?';
    pool.query(updateQuery, [updatedName, updatedDescription, id], (updateErr, updateResult) => {
      if (updateErr) {
        return res.status(500).json({
          success: false,
          message: "Error updating category",
          error: updateErr.message
        });
      }

      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: {
          id,
          name: updatedName,
          description: updatedDescription
        }
      });
    });
  });
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const deleteQuery = 'DELETE FROM categories WHERE id = ?';
  pool.query(deleteQuery, [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, message: "Category deleted" });
  });
};


const addDrug = async (req, res) => {
  const {
    name,
    substance,
    unit_of_measurement,
    company,
    quality,
    expiration_date,
    cost,
    price,
    category,
    strength,
  } = req.body;

  const image = req.file ? req.file.filename : null;

  // Validate required fields
  if (
    !name ||
    !substance ||
    !unit_of_measurement ||
    !company ||
    !expiration_date ||
    cost == null ||
    price == null
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields: name, substance, unit_of_measurement, company, expiration_date, cost, and price are required.",
    });
  }

  try {
    // Step 1: Check for existing drug (by name, substance, company)
    const checkQuery = `
      SELECT * FROM drugs
      WHERE name = ? AND substance = ? AND company = ?
    `;
    const checkValues = [name, substance, company];

    pool.query(checkQuery, checkValues, (checkErr, checkResult) => {
      if (checkErr) {
        console.error("Error checking drug:", checkErr);
        return res.status(500).json({
          success: false,
          message: "Database error while checking for existing drug",
          error: checkErr.message,
        });
      }

      if (checkResult.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Drug already exists with the same name, substance, and company.",
        });
      }

      // Step 2: Insert if not duplicate
      const insertQuery = `
        INSERT INTO drugs (
          name, substance, unit_of_measurement, company, quality,
          expiration_date, cost, price, category, strength, image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        name,
        substance,
        unit_of_measurement,
        company,
        quality || null,
        expiration_date,
        cost,
        price,
        category || null,
        strength || null,
        image,
      ];

      pool.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error("Error adding drug:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to add drug",
            error: err.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Drug added successfully",
          drugId: result.insertId,
        });
      });
    });
  } catch (err) {
    console.error("Unexpected error adding drug:", err);
    return res.status(500).json({
      success: false,
      message: "Unexpected error occurred",
      error: err.message,
    });
  }
};

const getDrugs = async (req, res) => {
  try {
    const query = `SELECT * FROM drugs where is_deleted = 0 ORDER BY id ASC `;

    pool.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database query failed",
        });
      }

      if (!results || results.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No drugs found",
          data: [],
        });
      }

      return res.status(200).json({
        success: true,
        message: "Drugs data fetched successfully",
        data: results,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const updateDrug = async (req, res) => {
  try {
    const { drugId } = req.params;

    if (!drugId) {
      return res.status(400).json({
        success: false,
        message: "Missing drugId in request params",
      });
    }

    // Step 1: Fetch existing drug data
    const getQuery = `SELECT * FROM drugs WHERE id = ?`;
    pool.query(getQuery, [drugId], (getErr, getResults) => {
      if (getErr) {
        return res.status(500).json({
          success: false,
          message: "Error fetching drug",
          error: getErr.message,
        });
      }

      if (getResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Drug not found",
        });
      }

      const existing = getResults[0];
      const image = req.file ? req.file.filename : existing.image;

      // Step 2: Merge values (fallback to existing)
      const updatedFields = {
        name: req.body.name || existing.name,
        substance: req.body.substance || existing.substance,
        unit_of_measurement: req.body.unit_of_measurement || existing.unit_of_measurement,
        company: req.body.company || existing.company,
        quality: req.body.quality || existing.quality,
        expiration_date: req.body.expiration_date || existing.expiration_date,
        cost: req.body.cost !== undefined ? req.body.cost : existing.cost,
        price: req.body.price !== undefined ? req.body.price : existing.price,
        category: req.body.category || existing.category,
        strength: req.body.strength || existing.strength,
        image: image,
      };

      // Step 3: Run the update
      const updateQuery = `
        UPDATE drugs SET
          name = ?, substance = ?, unit_of_measurement = ?, company = ?, quality = ?,
          expiration_date = ?, cost = ?, price = ?, category = ?, strength = ?, image = ?
        WHERE id = ?
      `;

      const values = [
        updatedFields.name,
        updatedFields.substance,
        updatedFields.unit_of_measurement,
        updatedFields.company,
        updatedFields.quality,
        updatedFields.expiration_date,
        updatedFields.cost,
        updatedFields.price,
        updatedFields.category,
        updatedFields.strength,
        updatedFields.image,
        drugId,
      ];

      pool.query(updateQuery, values, (updateErr) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Error updating drug",
            error: updateErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Drug updated successfully",
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteDrug = async (req, res) => {
  try {
    const { drugId } = req.params;
    console.log(drugId);
    
    if (!drugId) {
      return res.status(400).json({
        success: false,
        message: "Missing drugId in request params",
      });
    }

    // Step 1: Check if drug exists and is not already deleted
    const checkQuery = `SELECT * FROM drugs WHERE id = ? AND is_deleted = 0`;
    pool.query(checkQuery, [drugId], (checkErr, checkResult) => {
      console.log(checkResult);
      
      if (checkErr) {
        return res.status(500).json({
          success: false,
          message: "Error checking drug",
          error: checkErr.message,
        });
      }

      if (checkResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Drug not found or already deleted",
        });
      }

      // Step 2: Perform soft delete
      const deleteQuery = `UPDATE drugs SET is_deleted = 1 WHERE id = ?`;
      pool.query(deleteQuery, [drugId], (deleteErr, result) => {
        if (deleteErr) {
          return res.status(500).json({
            success: false,
            message: "Error deleting drug",
            error: deleteErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Drug soft-deleted successfully",
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const addServices = async (req, res) => {
  try {
    const {
      serviceCode,
      serviceName,
      description,
      category,
      durationMinutes,
      standardCost,
      secondaryCost,
      insuranceCost,
    } = req.body;
    if (!serviceName || !category || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: serviceName, category or durationMinutes.",
      });
    }

    const insertQurery = `Insert into services  (
                              serial_number, serviceCode,serviceName,description,category,durationMinutes,standardCost,secondaryCost,insuranceCost
                          ) values  (?,?,?,?,?,?,?,?,?)`;

    const serviceId = `SERVICE${generateRandomNumber(5)}`;

    const insertValue = [
      serviceId,
      serviceCode,
      serviceName,
      description,
      category,
      durationMinutes,
      standardCost,
      secondaryCost,
      insuranceCost,
    ];

    await pool.query(insertQurery, insertValue, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database insert error",
          error: err.message,
        });
      }
      return res.status(201).json({
        success: true,
        message: "Service inserted successfully",
        data: result,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getServices = async (req, res) => {
  try {
    const getQuery = `
      SELECT 
        id,
        serviceCode AS code,
        serviceName AS name,
        description AS details,
        category AS type,
        durationMinutes AS duration,
        standardCost AS standard_price,
        secondaryCost AS secondary_price,
        insuranceCost AS insurance_price
      FROM 
        services
    `;

    await pool.query(getQuery, (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database retrieval error",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Services retrieved successfully",
        data: results,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getNationalitiesList = async (req, res) => {
  try {
    const getQuery = `
      SELECT 
        id,
        nationality AS nationality,
        num_code  AS num_code,
        alpha_2_code  AS alpha_2_code ,
        alpha_3_code  AS alpha_3_code ,
        en_short_name AS en_short_name
      FROM 
        nationalities
    `;

    await pool.query(getQuery, (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database retrieval error",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Nationality retrieved successfully",
        data: results,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getDiagnosisList = async (req, res) => {
  try {
    const getQuery = `
      SELECT 
        id,
        	code AS code,
        name_en  AS name_en,
        name_id  AS name_id 
      FROM 
        icds_10
    `;

    await pool.query(getQuery, (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database retrieval error",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Diagnosis retrieved successfully",
        data: results,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export default {
  getAllUsers,
  changeUserStatus,
  deleteUserById,
  getAllDoctors,
  getActiveDoctors,
  changeUserStatus,
  softDeleteUser,
  deleteDoctor,
  registerPatient,
  getAllPatients,
  editAppointment,
  getPatientById,
  updatePatient,
  AddPatientServices,
  GetPatientServices,
  deletePatient,
  createAppointment,
  getAllAppointments,
  getWaitingAppointments,
  getConfirmedAppointments,
  deleteAppointments,
  getAllNationalities,
  doctorAvailability,
  appointmentByDoctorId,
  getAppointmentsByDate,
  appointmentByPatientId,
  bookingAppointment,
  changeAppointmentStatus,
  cancelAppointmentStatus,
  recordPatientVitals,
  getPatientVitalsByPatientId,
  updatePatientVitals,
  deletePatientVital,
  recordPatientDiagnosis,
  getDiagnosisByPatientId,
  addRxMedicine,
  getAllRxList,
  deleteRxMedicine,
  addCategories,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getDrugs,
  addDrug,
  updateDrug,
  deleteDrug,
  addServices,
  getServices,
  getNationalitiesList,
  getDiagnosisList,
};
