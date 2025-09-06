
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
    const query = `
      SELECT 
        users.id AS userId,
        users.email,
        users.password,
        users.role,
        users.is_active,
        users.createdAt,
        doctors.id as doctorId,
        doctors.fullName,
        doctors.phoneNumber,
        doctors.shortName,
        doctors.prefix,
        doctors.dateOfBirth,
        doctors.gender,
        doctors.specialty,
        doctors.licenseId,
        doctors.civilId,
        doctors.passport,
        doctors.personalPhoto,
        doctors.user_id as doctor_id
      FROM users
      LEFT JOIN doctors ON doctors.user_id = users.id
      WHERE users.is_deleted = 0
    `;

    pool.query(query, (error, result) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Database error while fetching users",
          error_message: error.message,
        });
      }

      if (!result || result.length === 0) {
        return res.status(200).json({
          success: false,
          message: "No users found",
        });
      }

      const mappedUsers = result.map(user => ({
        id : user.doctorId,
        userId: user.userId,
        email: user.email,
        password: user.password,
        role: user.role,
        is_active: user.is_active,
        createdAt: user.createdAt,
        fullName : user.fullName,
        civilId: user.civilId,
        passport: user.passport,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        specialty: user.specialty,
        licenseId: user.licenseId,
        personalPhoto: user.personalPhoto || null,
        shortName: user.shortName,
        prefix: user.prefix,
      }));

      return res.status(200).json({
        success: true,
        message: "All users fetched successfully",
        data: mappedUsers,
      });
    });
  } catch (err) {
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
//       const updateQuery = "UPDATE user SET is_active = ? WHERE id = ?";
//       pool.query(updateQuery, [newStatus, id], (updateErr, updateResult) => {
//         if (updateErr) {
//           return res.status(500).json({
//             success: false,
//             message: "Error updating status",
//             error_message: updateErr.message,
//           });
//         }


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

const getAllStaff = async (req, res) => {
  try {
    const query = `
      SELECT 
        users.id AS userId,
        users.email,
        users.password,
        users.role,
        users.is_active,
        users.createdAt,
        doctors.fullName,
        doctors.licenseId,
        doctors.phoneNumber,
        doctors.shortName,
        doctors.prefix,
        doctors.dateOfBirth,
        doctors.gender,
        doctors.specialty,
        doctors.civilId,
        doctors.passport,
        doctors.personalPhoto,
        doctors.id as doctorId
      FROM users 
      LEFT JOIN doctors ON doctors.user_id = users.id 
      WHERE users.role IN ("receptionist", "admin") AND users.is_deleted = 0
    `;

    pool.query(query, (error, result) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Error fetching staff",
          error_message: error.message,
        });
      }

      const staffList = result.map(user => ({
        id:user.doctorId,
        userId: user.userId,
        email: user.email,
        password: user.password,
        role: user.role,
        is_active: user.is_active,
        createdAt: user.createdAt,
        fullName: user.fullName,
        licenseId: user.licenseId,
        civilId: user.civilId,
        passport: user.passport,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        specialty: user.specialty,
        personalPhoto: user.personalPhoto || null,
        shortName: user.shortName,
        prefix: user.prefix,
      }));

      return res.status(200).json({
        success: true,
        message: "Staff fetched successfully",
        data: staffList,
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAllNurses = async (req, res) => {
  try {
    const query = `
      SELECT 
        users.id AS userId,
        users.email,
        users.password,
        users.role,
        users.is_active,
        users.createdAt,

        doctors.id AS doctorId,
        doctors.user_id,
        doctors.fullName,
        doctors.licenseId,
        doctors.phoneNumber,
        doctors.shortName,
        doctors.prefix,
        doctors.dateOfBirth,
        doctors.gender,
        doctors.specialty,
        doctors.civilId,
        doctors.passport,
        doctors.personalPhoto

      FROM users 
      LEFT JOIN doctors ON doctors.user_id = users.id
      WHERE users.role = "nurse" AND users.is_deleted = 0
    `;

    pool.query(query, (error, result) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Error fetching nurses",
          error_message: error.message,
        });
      }

      const nurseList = result.map(user => ({
        id: user.doctorId,
        userId: user.userId,
        email: user.email,
        password: user.password,
        role: user.role,
        is_active: user.is_active,
        createdAt: user.createdAt,

        fullName: user.fullName,
        licenseId: user.licenseId,
        civilId: user.civilId,
        passport: user.passport,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        specialty: user.specialty,
        personalPhoto: user.personalPhoto || null,
        shortName: user.shortName,
        prefix: user.prefix,
      }));

      return res.status(200).json({
        success: true,
        message: "Nurses fetched successfully",
        data: nurseList,
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const doctorQuery = `
      SELECT users.*, doctors.*
      FROM users 
      LEFT JOIN doctors ON doctors.user_id = users.id
      WHERE users.role = "doctor" AND users.is_deleted = 0
    `;

    pool.query(doctorQuery, (error, result) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Database error while fetching doctors",
          error_message: error.message,
        });
      }
      if (result.length === 0) {
        return res.status(200).json({
          success: false,
          message: "No doctors found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Doctors fetched successfully",
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

const changeDoctorStatus = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    const { status } = req.body;

    // Validate status (must be 0 or 1)
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value (must be 0 or 1)",
      });
    }

    // Step 1: Get user_id from doctors table
    const getUserQuery = "SELECT user_id FROM doctors WHERE id = ?";
    pool.query(getUserQuery, [doctorId], (err, doctorResults) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching doctor info",
          error: err.message,
        });
      }

      if (doctorResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const userId = doctorResults[0].user_id;

      // Step 2: Check current status
      const checkStatusQuery = "SELECT is_active FROM users WHERE id = ?";
      pool.query(checkStatusQuery, [userId], (err, userResults) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error checking user status",
            error: err.message,
          });
        }

        if (userResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Associated user not found",
          });
        }

        const currentStatus = userResults[0].is_active;

        if (currentStatus === status) {
          return res.status(400).json({
            success: false,
            message: `Doctor is already ${status === 1 ? "active" : "inactive"}`,
          });
        }

        // Step 3: Update user status
        const updateStatusQuery =
          "UPDATE users SET is_active = ?, updatedAt = NOW() WHERE id = ?";
        pool.query(updateStatusQuery, [status, userId], (err, result) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error updating user status",
              error: err.message,
            });
          }

          return res.status(200).json({
            success: true,
            message: `Doctor status changed to ${status === 1 ? "active" : "inactive"}`,
          });
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

const changeUserStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { status } = req.body;

    // Step 1: Validate inputs
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    if (typeof status !== "number" || (status !== 0 && status !== 1)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value (must be 0 or 1)",
      });
    }

    // Step 2: Get user_id from doctors table
    const getUserIdQuery = "SELECT user_id FROM doctors WHERE id = ? LIMIT 1";
    pool.query(getUserIdQuery, [userId], (err, doctorResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching doctor info",
          error: err.message,
        });
      }

      if (!doctorResult || doctorResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const userId = doctorResult[0].user_id;

      // Step 3: Check current user status
      const checkQuery = "SELECT is_active FROM users WHERE id = ? LIMIT 1";
      pool.query(checkQuery, [userId], (err, userResult) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error checking user status",
            error: err.message,
          });
        }

        if (!userResult || userResult.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Associated user not found",
          });
        }

        const currentStatus = userResult[0].is_active;

        if (currentStatus === status) {
          return res.status(400).json({
            success: false,
            message: `User is already ${status === 1 ? "active" : "inactive"}`,
          });
        }

        // Step 4: Update is_active in users table
        const updateQuery = `
          UPDATE users 
          SET is_active = ?, updatedAt = NOW() 
          WHERE id = ? LIMIT 1
        `;
        pool.query(updateQuery, [status, userId], (err, updateResult) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error updating user status",
              error: err.message,
            });
          }

          return res.status(200).json({
            success: true,
            message: `User status changed to ${status === 1 ? "active" : "inactive"}`,
          });
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


const softDeleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    // Step 1: Get user_id from doctors table
    const getUserIdQuery = "SELECT user_id FROM doctors WHERE id = ?";
    pool.query(getUserIdQuery, [userId], (err, doctorResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching doctor info",
          error: err.message,
        });
      }

      if (!doctorResult || doctorResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const userId = doctorResult[0].user_id;

      // Step 2: Soft delete user by setting is_deleted = 1
      const softDeleteQuery = `
        UPDATE users 
        SET is_deleted = 1 
        WHERE id = ? AND is_deleted = 0 
        LIMIT 1
      `;

      pool.query(softDeleteQuery, [userId], (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error performing soft delete on user",
            error: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "User already deleted or not found",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Doctor's user account soft deleted successfully",
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


const deleteDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    // Step 1: Get user_id from doctors table
    const getDoctorQuery = "SELECT user_id FROM doctors WHERE id = ?";
    pool.query(getDoctorQuery, [doctorId], (err, doctorResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching doctor info",
          error: err.message,
        });
      }

      if (!doctorResult || doctorResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const userId = doctorResult[0].user_id;

      // Step 2: Get user role
      const getUserRoleQuery = "SELECT role FROM users WHERE id = ?";
      pool.query(getUserRoleQuery, [userId], (err, userResult) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error fetching user role",
            error: err.message,
          });
        }

        if (!userResult || userResult.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Associated user not found",
          });
        }

        const userRole = userResult[0].role;

        // Step 3: Delete doctor
        const deleteDoctorQuery = "DELETE FROM doctors WHERE id = ?";
        pool.query(deleteDoctorQuery, [doctorId], (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error deleting doctor",
              error: err.message,
            });
          }

          // Step 4: Delete user
          const deleteUserQuery = "DELETE FROM users WHERE id = ?";
          pool.query(deleteUserQuery, [userId], (err) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "Doctor deleted, but error deleting user",
                error: err.message,
              });
            }

            return res.status(200).json({
              success: true,
              message: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} deleted successfully`,
            });
          });
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
     SELECT id FROM patients 
      WHERE civilIdNumber = ? 
      OR passportNumber = ? 
      OR mobileNumber = ? 
      OR email = ?
`;
      pool.query(
        checkDuplicateQuery,
        [civilIdNumber, passportNumber, mobileNumber, email],
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
                    "Patient with this Civil ID, Passport Number, Mobile Number or Email already exists",
            });
          }

          const profileImage = req.files?.profileImage?.[0]?.filename || 'defaultPic.jpg';
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

    // Helper function to calculate age
    const calculateAge = (dob) => {
      const birthDate = new Date(dob);
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age;
    };

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

      const dateOfBirth = req.body.dateOfBirth || existing.dateOfBirth;
      const age = calculateAge(dateOfBirth);

      const updatedFields = {
        firstName: req.body.firstName || existing.firstName,
        middleName: req.body.middleName || existing.middleName,
        lastName: req.body.lastName || existing.lastName,
        profileImage,
        dateOfBirth,
        age,
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
          firstName = ?, middleName = ?, lastName = ?, profileImage = ?, dateOfBirth = ?, age = ?, gender = ?,
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
        updatedFields.age,
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
    const { patientId, serviceId, discount_type, discount_value, extra_notes } = req.body;

    // Step 1: Validation
    if (!patientId || !serviceId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patientId or serviceId.",
      });
    }

    // Step 2: Check service and get cost
    const serviceQuery = `SELECT standardCost FROM services WHERE id = ?`;

    pool.query(serviceQuery, [serviceId], (err, serviceResult) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database error", error: err.message });
      }

      if (serviceResult.length === 0) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }

      const { standardCost } = serviceResult[0];

      // Step 3: Check for duplicate (patientId + serviceId)
      const duplicateQuery = `SELECT id FROM patient_services WHERE patientId = ? AND serviceId = ?`;
      pool.query(duplicateQuery, [patientId, serviceId], (dupErr, dupResult) => {
        if (dupErr) {
          return res.status(500).json({ success: false, message: "Database error", error: dupErr.message });
        }

        if (dupResult.length > 0) {
          return res.status(400).json({ success: false, message: "This service is already added for the patient" });
        }

        // Step 4: Calculate net amount
        let netAmount = standardCost;

        if (discount_type === "Amount") {
          netAmount = standardCost - discount_value;
        } else if (discount_type === "Percentage") {
          netAmount = standardCost - (standardCost * discount_value / 100);
        }

        if (netAmount < 0) netAmount = 0; // safety check

        // Step 5: Insert into patient_services
        const insertQuery = `
          INSERT INTO patient_services 
          (patientId, serviceId, amount, discount_type, discount_value, net_amount, extra_notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        pool.query(
          insertQuery,
          [
            patientId,
            serviceId,
            standardCost,
            discount_type || null,
            discount_value || 0,
            netAmount,
            extra_notes || null,
          ],
          (err2, result) => {
            if (err2) {
              return res.status(500).json({ success: false, message: "Database insert error", error: err2.message });
            }

            res.status(201).json({
              success: true,
              message: "Patient service created successfully",
              data: {
                id: result.insertId,
                patientId,
                serviceId,
                standardCost,
                discount_type,
                discount_value,
                netAmount,
                extra_notes,
              }
            });
          }
        );
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

// GET API to retrieve patient service list

const GetPatientServices = async (req, res) => {
  try {
    const patientId = req.params.id;
    const sql = `
      SELECT 
        ps.id,
        ps.patientId,
        ps.serviceId,
        ps.amount,
        ps.extra_notes,
        ps.discount_type,
        ps.discount_value,
        ps.net_amount, 
        ps.status,
        ps.billing_status,
        ps.createdAt,
        ps.updatedAt,
        s.serviceCode,
        s.serviceName,
        s.description,
        s.standardCost
      FROM patient_services ps
      INNER JOIN services AS s ON s.id = ps.serviceId
      WHERE ps.patientId = ?
    `;

    pool.query(sql, [patientId], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No services found for this patient"
        });
      }

      // Calculate totals
      let planTotal = 0;
      let completedTotal = 0;
      let totalPlanServices = 0
      let totalCompleteServices =0
      results.forEach(service => {
        if (service.status === "Plan") {
          planTotal += service.net_amount || 0;
          totalPlanServices += 1 || 0
        } else if (service.status === "Complete") {
          completedTotal += service.net_amount || 0;
          totalCompleteServices += 1 || 0
        }
      });

      const totalSum = planTotal + completedTotal;

      return res.status(200).json({
        success: true,
        message: "All patient services fetched successfully",
        data: {
          totalPlanServices,
          totalCompleteServices,
          planTotal,
          completedTotal,
          totalSum,
          results
        }
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

const UpdatePatientServices = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceId, discount_type, discount_value, extra_notes } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid or missing ID" });
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: serviceId",
      });
    }

    const getExistingQuery = `SELECT * FROM patient_services WHERE id = ?`;
    pool.query(getExistingQuery, [id], (err, existingResult) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database error", error: err.message });
      }

      if (existingResult.length === 0) {
        return res.status(404).json({ success: false, message: "Patient service not found" });
      }

      const existingRecord = existingResult[0];
      const originalPatientId = existingRecord.patientId;

      // Check for duplicate if serviceId changed
      if (serviceId != existingRecord.serviceId) {
        const duplicateQuery = `SELECT id FROM patient_services WHERE patientId = ? AND serviceId = ? AND id != ?`;
        pool.query(duplicateQuery, [originalPatientId, serviceId, id], (dupErr, dupResult) => {
          if (dupErr) {
            return res.status(500).json({ success: false, message: "Database error", error: dupErr.message });
          }

          if (dupResult.length > 0) {
            return res.status(400).json({ success: false, message: "This service is already added for the patient" });
          }

          continueUpdate();
        });
      } else {
        continueUpdate();
      }

      function continueUpdate() {
        const serviceQuery = `SELECT standardCost FROM services WHERE id = ?`;
        pool.query(serviceQuery, [serviceId], (serviceErr, serviceResult) => {
          if (serviceErr) {
            return res.status(500).json({ success: false, message: "Database error", error: serviceErr.message });
          }

          if (serviceResult.length === 0) {
            return res.status(404).json({ success: false, message: "Service not found" });
          }

          const { standardCost } = serviceResult[0];
          const safeDiscountValue = isNaN(discount_value) ? 0 : Number(discount_value);

          let netAmount = standardCost;

          if (discount_type === "Amount") {
            netAmount = standardCost - safeDiscountValue;
          } else if (discount_type === "Percentage") {
            netAmount = standardCost - (standardCost * safeDiscountValue / 100);
          }

          if (netAmount < 0 || isNaN(netAmount)) netAmount = 0;

          const updateQuery = `
            UPDATE patient_services
            SET serviceId = ?, amount = ?, discount_type = ?, discount_value = ?, net_amount = ?, extra_notes = ?
            WHERE id = ?
          `;

          pool.query(
            updateQuery,
            [
              serviceId,
              standardCost,
              discount_type || null,
              safeDiscountValue,
              netAmount,
              extra_notes || null,
              id,
            ],
            (updateErr, updateResult) => {
              if (updateErr) {
                return res.status(500).json({
                  success: false,
                  message: "Error updating patient service",
                  error: updateErr.message
                });
              }

              return res.status(200).json({
                success: true,
                message: "Patient service updated successfully",
                data: {
                  id,
                  patientId: originalPatientId,
                  serviceId,
                  amount: standardCost,
                  discount_type,
                  discount_value: safeDiscountValue,
                  netAmount,
                  extra_notes
                }
              });
            }
          );
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


const DeletePatientService = async (req, res) => {
  try {
    const serviceId = req.params.id; // patient_services table row ID

    const sql = `DELETE FROM patient_services WHERE id = ?`;

    pool.query(sql, [serviceId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient service not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Patient service deleted successfully"
      });
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const getPatientServicesByPatientId = (req, res) => {
  try {
    const patientId = req.params.id;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const query = `
      SELECT 
        ps.*, 
        s.serviceName AS service_name,
        s.serviceCode as service_code
      FROM 
        patient_services ps
      JOIN 
        services s 
      ON 
        ps.serviceId = s.id
      WHERE 
        ps.patientId = ? 
        AND ps.status = 'Complete' 
        AND ps.billing_status = 'Not Billed'
    `;

    pool.query(query, [patientId], (error, results) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Database error while fetching patient services",
          error: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Patient services fetched successfully",
        data: results,
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

const getPatientPharmacyByPatientId = (req, res) => {
  try {
    const patientId = req.params.id;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const query = `
      SELECT 
        pp.*, 
        d.name AS drug_name
      FROM 
        patient_pharmacy pp
      JOIN 
        drugs d 
      ON 
        pp.drugId = d.id
      WHERE 
        pp.patient_id = ? AND 
        pp.billing_status = 'Not Billed'
    `;

    pool.query(query, [patientId], (error, results) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Database error while fetching patient pharmacy data",
          error: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Patient pharmacy data fetched successfully",
        data: results,
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

const addPatientPharmacy = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { drugId, quantity } = req.body;

    if (!quantity) {
      return res.status(400).json({
        success: false,
        message: "Enter Quantity"
      });
    }

    if (!drugId || isNaN(drugId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing drugId"
      });
    }

    if (!patientId || isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing patientId"
      });
    }

    // Check if drug already assigned to the patient
    const checkExistingQuery = `SELECT * FROM patient_pharmacy WHERE patient_id = ? AND drugId = ?`;
    pool.query(checkExistingQuery, [patientId, drugId], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({
          success: false,
          message: "Error while checking existing drug for patient",
          error: checkErr.message
        });
      }

      if (checkResult.length > 0) {
        return res.status(400).json({
          success: false,
          message: "This drug is already assigned to the patient"
        });
      }

      //  Proceed to check drug availability
      const drugSearchQuery = `SELECT * FROM drugs WHERE id = ?`;

      pool.query(drugSearchQuery, [drugId], (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database search error",
            error: err.message
          });
        }

        let drugResult = result[0];

        if (!drugResult) {
          return res.status(404).json({
            success: false,
            message: "Drug not found"
          });
        }

        if (quantity > drugResult.quantity) {
          return res.status(400).json({
            success: false,
            message: "Quantity not available in stock"
          });
        }

        let medicinePrice = quantity * drugResult.price;

        const insertQuery = `INSERT INTO patient_pharmacy (patient_id, drugId, quantity, price) VALUES (?, ?, ?, ?)`;

        pool.query(insertQuery, [patientId, drugId, quantity, medicinePrice], (insertError, insertionResult) => {
          if (insertError) {
            return res.status(500).json({
              success: false,
              message: "Error while inserting data",
              error: insertError.message
            });
          }

          drugResult.quantity -= quantity;

          const updateDrugQuery = `UPDATE drugs SET quantity = ? WHERE id = ?`;

          pool.query(updateDrugQuery, [drugResult.quantity, drugId], (updateError, updateResult) => {
            if (updateError) {
              return res.status(500).json({
                success: false,
                message: "Error while updating drug",
                error: updateError.message
              });
            }

            return res.status(201).json({
              success: true,
              message: "Patient pharmacy inserted successfully"
            });
          });
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

const getPharmacyByPatientId = async (req, res) => {
  try {
    const patientId = req.params.patientId;

    if (!patientId || isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing patientId"
      });
    }

    const query = `
      SELECT 
        pp.id,
        pp.patient_id,
        pp.drugId,
        pp.billing_status,
        pp.created_at,
        d.name AS drug_name,
        pp.quantity,
        pp.price
      FROM 
        patient_pharmacy pp
      JOIN 
        drugs d ON pp.drugId = d.id
      WHERE 
        pp.patient_id = ?;
    `;

    pool.query(query, [patientId], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No drugs found for this patient"
        });
      }

      return res.status(200).json({
        success: true,
        message : "Patient pharmacy retrieved successfully",
        data: results
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

const updatePatientPharmacy = async (req, res) => {
  try {
    const { id } = req.params;
    const { drugId, quantity } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing patient_pharmacy ID"
      });
    }

    if (!drugId || isNaN(drugId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing drugId"
      });
    }

    if (!quantity || isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid quantity"
      });
    }

    // Step 1: Get the existing patient_pharmacy record
    const getOldRecordQuery = `SELECT * FROM patient_pharmacy WHERE id = ?`;
    pool.query(getOldRecordQuery, [id], (err, oldResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching patient pharmacy record",
          error: err.message
        });
      }

      if (oldResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient pharmacy record not found"
        });
      }

      const oldRecord = oldResult[0];

      // Step 2: Get the old and new drug records
      const getDrugQuery = `SELECT * FROM drugs WHERE id IN (?, ?)`;
      pool.query(getDrugQuery, [oldRecord.drugId, drugId], (drugErr, drugResults) => {
        if (drugErr) {
          return res.status(500).json({
            success: false,
            message: "Error fetching drug info",
            error: drugErr.message
          });
        }

        const oldDrug = drugResults.find(d => d.id === oldRecord.drugId);
        const newDrug = drugResults.find(d => d.id === parseInt(drugId));

        if (!newDrug) {
          return res.status(404).json({
            success: false,
            message: "New drug not found"
          });
        }

        // Step 3: Adjust quantity check
        let rollbackQty = oldRecord.quantity;
        let availableStock = newDrug.quantity + rollbackQty;

        if (quantity > availableStock) {
          return res.status(400).json({
            success: false,
            message: "Insufficient stock for the selected drug"
          });
        }

        const updatedPrice = quantity * newDrug.price;

        // Step 4: Update patient_pharmacy
        const updatePharmacyQuery = `
          UPDATE patient_pharmacy 
          SET drugId = ?, quantity = ?, price = ?
          WHERE id = ?
        `;

        pool.query(updatePharmacyQuery, [drugId, quantity, updatedPrice, id], (updateErr, updateResult) => {
          if (updateErr) {
            return res.status(500).json({
              success: false,
              message: "Error updating patient pharmacy record",
              error: updateErr.message
            });
          }

          // Step 5: Update new drug stock
          const newStock = availableStock - quantity;

          const updateDrugStockQuery = `UPDATE drugs SET quantity = ? WHERE id = ?`;
          pool.query(updateDrugStockQuery, [newStock, drugId], (stockErr, stockResult) => {
            if (stockErr) {
              return res.status(500).json({
                success: false,
                message: "Error updating drug stock",
                error: stockErr.message
              });
            }

            return res.status(200).json({
              success: true,
              message: "Patient pharmacy record updated successfully"
            });
          });
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};


const deletePatientPharmacy = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing drug entry ID"
      });
    }

    // Step 1: Fetch the existing record
    const fetchQuery = `SELECT drugId, quantity FROM patient_pharmacy WHERE id = ?`;
    pool.query(fetchQuery, [id], (fetchErr, fetchResult) => {
      if (fetchErr) {
        return res.status(500).json({
          success: false,
          message: "Error fetching drug entry",
          error: fetchErr.message
        });
      }

      if (fetchResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Drug entry not found"
        });
      }

      const { drugId, quantity } = fetchResult[0];

      // Step 2: Restore stock to drugs table
      const updateStockQuery = `UPDATE drugs SET quantity = quantity + ? WHERE id = ?`;
      pool.query(updateStockQuery, [quantity, drugId], (updateErr, updateResult) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Error restoring drug stock",
            error: updateErr.message
          });
        }

        // Step 3: Delete from patient_pharmacy
        const deleteQuery = `DELETE FROM patient_pharmacy WHERE id = ?`;
        pool.query(deleteQuery, [id], (deleteErr, deleteResult) => {
          if (deleteErr) {
            return res.status(500).json({
              success: false,
              message: "Error deleting drug entry",
              error: deleteErr.message
            });
          }

          return res.status(200).json({
            success: true,
            message: "Drug entry deleted and stock restored successfully"
          });
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

const updatePatientServicesStatus = (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const query = `UPDATE patient_services SET status = ? WHERE id = ?`;
    pool.query(query, [status, id], (error, results) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Status updated successfully for patient_services",
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

const updatePatientPharmacyStatus = (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const query = `UPDATE patient_pharmacy SET status = ? WHERE id = ?`;
    pool.query(query, [status, id], (error, results) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Status updated successfully for patient_pharmacy",
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
    status: userStatus // new optional field
  } = req.body;
  

  if (!patientId || !appointmentDate) {
    return res.status(400).json({
      success: false,
      message: "Patient ID and appointment date are required",
    });
  }

  const parseTime = (t) => new Date(`1970-01-01T${t}`);
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  if (start >= end) {
    return res.status(400).json({
      success: false,
      message: "startTime must be before endTime",
    });
  }

  const patientQuery = `SELECT * FROM patients WHERE id = ?`;
  pool.query(patientQuery, [patientId], (err, patientResult) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error retrieving patient info", error: err.message });
    }

    if (patientResult.length === 0) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const patientName = patientResult[0].firstName + " " + patientResult[0].lastName;

    const overlapQuery = `
      SELECT * FROM appointments 
      WHERE appointmentDate = ?
      AND (
        (patientId = ? OR doctorId = ?)
        AND (
          (startTime < ? AND endTime > ?)
          OR (startTime < ? AND endTime > ?)
          OR (? <= startTime AND ? >= endTime)
        )
      )
    `;

    pool.query(
      overlapQuery,
      [
        appointmentDate,
        patientId,
        userDoctorId || 0,
        startTime, startTime,
        endTime, endTime,
        startTime, endTime,
      ],
      (overlapErr, overlapResults) => {
        if (overlapErr) {
          return res.status(500).json({ success: false, message: "Error checking overlapping appointments", error: overlapErr.message });
        }

        if (overlapResults.length > 0) {
          return res.status(409).json({ success: false, message: "The selected time is already booked ! Please select another slot." });
        }

        if (userDoctorId) {
          const doctorQuery = `SELECT * FROM doctors WHERE id = ?`;
          pool.query(doctorQuery, [userDoctorId], (err, doctorResult) => {
            if (err) {
              return res.status(500).json({ success: false, message: "Error retrieving doctor info", error: err.message });
            }

            if (doctorResult.length === 0) {
              return res.status(404).json({ success: false, message: "Doctor not found" });
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
              res,
              userStatus // Pass the optional status from request
            );
          });
        } else {
          // No doctor selected
          insertAppointment(
            patientId,
            patientName,
            null,
            null,
            appointmentDate,
            startTime,
            endTime,
            reason,
            res,
            userStatus
          );
        }
      }
    );
  });
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
  res,
  userStatus // new param
) => {
  // Determine status
  let status = "Booked"; // default
  if (userStatus && userStatus.toLowerCase() === "waiting") {
    status = "waiting";
  }

  // Duration calculation
  const getDurationInMinutes = (start, end) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startDate = new Date(1970, 0, 1, sh, sm);
    const endDate = new Date(1970, 0, 1, eh, em);
    return Math.round((endDate - startDate) / (1000 * 60));
  };

  const duration = doctorId && startTime && endTime
    ? getDurationInMinutes(startTime, endTime)
    : 30;

  const insertQuery = `
    INSERT INTO appointments 
    (patientId, patientName, doctorId, doctorName, appointmentDate, startTime, endTime, reason, status, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

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
      duration,
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
          duration,
        },
      });
    }
  );
};

const getAllAppointments = async (req, res) => {
  try {
    const fetchAppointments = () =>
      new Promise((resolve, reject) => {
        const query = `
  SELECT 
    a.id,
    a.patientId,
    a.patientName,
    a.doctorId,
    a.doctorName,
    DATE_FORMAT(a.appointmentDate, '%Y-%m-%d %H:%i:%s') AS appointmentDate,
    DATE_FORMAT(a.startTime, '%H:%i:%s') AS startTime,
    DATE_FORMAT(a.endTime,   '%H:%i:%s') AS endTime,
    a.reason,
    a.status,
    DATE_FORMAT(a.createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt,
    DATE_FORMAT(a.updatedAt, '%Y-%m-%d %H:%i:%s') AS updatedAt,

    p.id AS patientIdFromPatients,
    p.fileNumber,
    p.firstName,
    p.middleName,
    p.lastName,
    p.gender,
    DATE_FORMAT(p.dateOfBirth, '%Y-%m-%d') AS dateOfBirth,
    p.mobileNumber,
    p.email,
    p.address
  FROM appointments a
  JOIN patients p ON a.patientId = p.id
  ORDER BY 
    DATE(a.appointmentDate) DESC,
    a.startTime DESC,
    a.endTime DESC,
    a.appointmentDate DESC
`;

        pool.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    const appointments = await fetchAppointments();

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No appointments found",
        data: [],
      });
    }

    // Duration calculation
    const enhanced = appointments.map((appt) => {
      let duration = null;
      if (appt.startTime && appt.endTime) {
        const [sh, sm] = appt.startTime.split(":").map(Number);
        const [eh, em] = appt.endTime.split(":").map(Number);
        duration = (eh * 60 + em) - (sh * 60 + sm);
      }
      return {
        ...appt,
        duration: duration != null ? `${duration} min` : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "All appointments fetched successfully",
      data: enhanced,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving appointments",
      error: error.message,
    });
  }
};

const getUpcomingAppointment = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.patientId,
        a.patientName,
        a.doctorId,
        a.doctorName,
        DATE_FORMAT(a.appointmentDate, '%Y-%m-%d %H:%i:%s') AS appointmentDate,
        DATE_FORMAT(a.startTime, '%H:%i:%s') AS startTime,
        DATE_FORMAT(a.endTime, '%H:%i:%s') AS endTime,
        a.reason,
        a.status,
        DATE_FORMAT(a.createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt,
        DATE_FORMAT(a.updatedAt, '%Y-%m-%d %H:%i:%s') AS updatedAt,

        p.id AS patientIdFromPatients,
        p.fileNumber,
        p.firstName,
        p.middleName,
        p.lastName,
        p.gender,
        DATE_FORMAT(p.dateOfBirth, '%Y-%m-%d') AS dateOfBirth,
        p.mobileNumber,
        p.email,
        p.address,

        DATE_FORMAT(
          TIMESTAMP(DATE(a.appointmentDate), a.startTime),
          '%Y-%m-%d %H:%i:%s'
        ) AS scheduledStart,
        DATE_FORMAT(
          TIMESTAMP(DATE(a.appointmentDate), a.endTime),
          '%Y-%m-%d %H:%i:%s'
        ) AS scheduledEnd,

        TIMESTAMPDIFF(
          MINUTE,
          NOW(),
          TIMESTAMP(DATE(a.appointmentDate), a.startTime)
        ) AS startsInMinutes
      FROM appointments a
      JOIN patients p ON a.patientId = p.id
      WHERE 
      TIMESTAMP(DATE(a.appointmentDate), a.startTime) >= CURDATE() + INTERVAL 1 DAY
        AND a.status = 'Confirmed'
      ORDER BY TIMESTAMP(DATE(a.appointmentDate), a.startTime) ASC
    `;

    const rows = await new Promise((resolve, reject) => {
      pool.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No upcoming confirmed appointments from now onwards",
      });
    }

    const appointments = rows.map((appt) => {
      if (appt.startTime && appt.endTime) {
        const [sh, sm] = appt.startTime.split(":").map(Number);
        const [eh, em] = appt.endTime.split(":").map(Number);
        appt.duration = `${(eh * 60 + em) - (sh * 60 + sm)} min`;
      } else {
        appt.duration = null;
      }

      appt.startsInHuman = toHuman(appt.startsInMinutes);
      return appt;
    });

    return res.status(200).json({
      success: true,
      message: "Upcoming confirmed appointments from now fetched successfully",
      data: appointments,
    });

    function toHuman(minutes) {
      if (minutes == null) return null;
      if (minutes < 0) return "already started/finished";
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h && m) return `${h}h ${m}m`;
      if (h) return `${h}h`;
      return `${m}m`;
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching upcoming appointments",
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
    return res.status(400).json({ success: false, message: "Appointment ID is required" });
  }

  const parseTime = (t) => new Date(`1970-01-01T${t}`);

  const getAppointmentQuery = `SELECT * FROM appointments WHERE id = ?`;
  pool.query(getAppointmentQuery, [appointmentId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error fetching appointment", error: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const appointment = result[0];

    const appointmentDate = newDate || appointment.appointmentDate;
    const startTime = newStart || appointment.startTime;
    const endTime = newEnd || appointment.endTime;
    const reason = newReason !== undefined ? newReason : appointment.reason;

    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (start >= end) {
      return res.status(400).json({ success: false, message: "startTime must be before endTime" });
    }

    const { patientId, doctorId } = appointment;

    const overlapQuery = `
      SELECT * FROM appointments 
      WHERE appointmentDate = ?
      AND id != ?
      AND (
        (patientId = ? OR doctorId = ?)
        AND (
          (startTime < ? AND endTime > ?)
          OR (startTime < ? AND endTime > ?)
          OR (? <= startTime AND ? >= endTime)
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
        startTime, startTime,
        endTime, endTime,
        startTime, endTime,
      ],
      (overlapErr, overlapResults) => {
        if (overlapErr) {
          return res.status(500).json({ success: false, message: "Error checking overlaps", error: overlapErr.message });
        }

        if (overlapResults.length > 0) {
          return res.status(409).json({ success: false, message: "Appointment overlaps with another for patient or doctor" });
        }

        const updateQuery = `
          UPDATE appointments SET
            appointmentDate = ?,
            startTime = ?,
            endTime = ?,
            reason = ?
          WHERE id = ?
        `;

        pool.query(updateQuery, [appointmentDate, startTime, endTime, reason, appointmentId], (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ success: false, message: "Error updating appointment", error: updateErr.message });
          }

          return res.status(200).json({ success: true, message: "Appointment updated successfully" });
        });
      }
    );
  });
};

const editAppointmentByPatientId = (req, res) => {
  const { appointmentId, patientId } = req.params;
  const {
    appointmentDate: newDate,
    startTime: newStart,
    endTime: newEnd,
    reason: newReason,
  } = req.body;

  if (!appointmentId || !patientId) {
    return res.status(400).json({ success: false, message: "Appointment ID and Patient ID are required" });
  }

  const parseTime = (t) => new Date(`1970-01-01T${t}`);

  const getQuery = `SELECT * FROM appointments WHERE id = ? AND patientId = ?`;

  pool.query(getQuery, [appointmentId, patientId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error fetching appointment", error: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Appointment not found for given patient and appointment ID" });
    }

    const appointment = result[0];

    const appointmentDate = newDate || appointment.appointmentDate;
    const startTime = newStart || appointment.startTime;
    const endTime = newEnd || appointment.endTime;
    const reason = newReason !== undefined ? newReason : appointment.reason;

    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (start >= end) {
      return res.status(400).json({ success: false, message: "startTime must be before endTime" });
    }

    const doctorId = appointment.doctorId;

    const overlapQuery = `
      SELECT * FROM appointments 
      WHERE appointmentDate = ?
        AND id != ?
        AND (patientId = ? OR doctorId = ?)
        AND (
          (startTime < ? AND endTime > ?)
          OR (startTime < ? AND endTime > ?)
          OR (? <= startTime AND ? >= endTime)
        )
    `;

    pool.query(
      overlapQuery,
      [
        appointmentDate,
        appointmentId,
        patientId,
        doctorId || 0,
        startTime, startTime,
        endTime, endTime,
        startTime, endTime
      ],
      (overlapErr, overlapResults) => {
        if (overlapErr) {
          return res.status(500).json({ success: false, message: "Error checking overlaps", error: overlapErr.message });
        }

        if (overlapResults.length > 0) {
          return res.status(409).json({ success: false, message: "Overlapping appointment exists for this patient or doctor" });
        }

        const updateQuery = `
          UPDATE appointments
          SET appointmentDate = ?, startTime = ?, endTime = ?, reason = ?
          WHERE id = ? AND patientId = ?
        `;

        pool.query(updateQuery, [appointmentDate, startTime, endTime, reason, appointmentId, patientId], (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ success: false, message: "Error updating appointment", error: updateErr.message });
          }

          return res.status(200).json({ success: true, message: "Appointment updated successfully" });
        });
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
  WHERE (a.status = "Confirmed" OR a.status = "Cancelled" OR a.status = "Booked")
    AND DATE(a.appointmentDate) = CURDATE();
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
        message: "No confirmed appointments found for today",
        data: [],
      });
    }

    // Add `duration` field in each appointment
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
      message: "Today's confirmed appointments with patient data fetched successfully",
      data: enhancedAppointments,
    });
  } catch (error) {
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

    if (!id ) {
      return res.status(400).json({
        success: false,
        message: "Appointment id is required",
      });
    }

    const deleteQuery = `DELETE FROM appointments WHERE id = ?`;

    pool.query(deleteQuery, [id], (err, result) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while deleting appointment",
          error: err.message,
        });
      } else if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found with provided id ",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Appointment deleted successfully",
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
          res.status(500).json({ error: "Failed to check time conflicts" });
        });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const getAppointmentsByDate = async (req, res) => {
  try {
    let { startDate, endDate } = req.body;

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!startDate || !isoDateRegex.test(startDate)) {
      return res.status(400).json({
        success: false,
        message: "startDate must be a valid YYYY-MM-DD string",
      });
    }

    // If endDate is not provided or invalid, default to startDate
    if (!endDate || !isoDateRegex.test(endDate)) {
      endDate = startDate;
    }

    const query = `
      SELECT 
        a.id, 
        a.patientId, 
        a.doctorId, 
        a.status, 
        a.reason,
        a.duration,
        DATE_FORMAT(a.appointmentDate, '%Y-%m-%d %H:%i:%s') AS appointmentDate,
        DATE_FORMAT(a.startTime, '%H:%i:%s') AS startTime,
        DATE_FORMAT(a.endTime, '%H:%i:%s') AS endTime,
        DATE_FORMAT(a.createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt,
        DATE_FORMAT(a.updatedAt, '%Y-%m-%d %H:%i:%s') AS updatedAt,

        TRIM(CONCAT(
          p.firstName, 
          IF(p.middleName IS NULL OR p.middleName = '', '', CONCAT(' ', p.middleName)),
          IF(p.lastName   IS NULL OR p.lastName   = '', '', CONCAT(' ', p.lastName))
        )) AS patientName,

        d.fullName AS doctorName,

        p.firstName, p.middleName, p.lastName, p.gender, 
        DATE_FORMAT(p.dateOfBirth, '%Y-%m-%d') AS dateOfBirth,
        p.age, p.mobileNumber, p.email, p.nationality, p.address,
        p.profileImage, p.civilIdNumber, p.passportNumber
      FROM appointments a
      JOIN patients p ON a.patientId = p.id
      LEFT JOIN doctors d ON a.doctorId = d.id
      WHERE DATE(a.appointmentDate) BETWEEN ? AND ?
      ORDER BY a.appointmentDate ASC, a.startTime ASC, a.endTime ASC
    `;

    const appointments = await new Promise((resolve, reject) => {
      pool.query(query, [startDate, endDate], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    return res.status(200).json({
      success: true,
      message: `Appointments from ${startDate} to ${endDate} fetched successfully`,
      data: appointments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving appointments",
      error: error.message,
    });
  }
};

const getAppointmentsByDoctorId = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);

    if (isNaN(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctorId. Must be a number.",
      });
    }

    const query = `
      SELECT 
        a.*,
        p.firstName AS patientFirstName,
        p.lastName AS patientLastName,
        p.mobileNumber AS patientMobileNumber,
        d.fullName AS doctorName
      FROM appointments a
      JOIN patients p ON p.id = a.patientId
      JOIN doctors d ON d.id = a.doctorId
      WHERE a.doctorId = ?
      ORDER BY a.appointmentDate DESC, a.startTime DESC
    `;

    pool.query(query, [doctorId], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No appointments found for this doctor",
          data: [],
        });
      }

      return res.status(200).json({
        success: true,
          message: "Appointments fetched successfully",
        data: results,
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

const appointmentByDoctorId = async (req, res) => {
  try {
    let { doctorIds } = req.body;

    if (!Array.isArray(doctorIds) || doctorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "doctorIds must be a non-empty array",
      });
    }

    doctorIds = doctorIds.map(id => Number(id)).filter(id => !isNaN(id));
    const placeholders = doctorIds.map(() => "?").join(",");

    const query = `
      SELECT 
        a.*,
        p.mobileNumber AS mobileNumber
      FROM appointments a
      JOIN patients p ON p.id = a.patientId
      WHERE a.doctorId IN (${placeholders})
        AND DATE(a.appointmentDate) = CURDATE()
    `;

    const getAppointments = () => {
      return new Promise((resolve, reject) => {
        pool.query(query, doctorIds, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const results = await getAppointments();

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments found for these doctors today",
      });
    }

    return res.status(200).json({
      success: true,
      message : "All appointment data fetched successfully of selected doctor",
      data: results,
    });
  } catch (error) {
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

    const validStatuses = ["No-show", "Completed", "Cancelled" ,"Confirmed","Waiting","Booked"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or missing status. Allowed values: 'No-Show', 'Completed', 'Cancelled' , 'Confirmed' ,'Waiting','Booked'",
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
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    const checkQuery = `SELECT * FROM appointments WHERE id = ? AND (status = 'Confirmed' OR status = "Booked")`;

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

    // Step 1: Validate required fields
    if (
      !patient_id ||
      !recorded_at ||
      blood_pressure_systolic === null ||
      blood_pressure_diastolic === null ||
      weight === null ||
      height === null ||
      !bp_position
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: patient id , recorded at , blood pressure , weight , bp position and height are required.",
      });
    }

    // ✅ Step 1.5: Check duplicate entry for same patient + date
    const checkDuplicateQuery = `
      SELECT id FROM patient_vitals 
      WHERE patient_id = ? AND DATE(recorded_at) = DATE(?)
      LIMIT 1
    `;
    pool.query(checkDuplicateQuery, [patient_id, recorded_at], (dupErr, dupRes) => {
      if (dupErr) {
        return res.status(500).json({
          success: false,
          message: "Error checking existing vitals",
          error: dupErr.message,
        });
      }

      if (dupRes.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Vitals for this patient already exist on the given date",
        });
      }

      // Step 2: Fetch patient details
      const patientQuery = `SELECT firstName, middleName, lastName, age, gender FROM patients WHERE id = ?`;
      pool.query(patientQuery, [patient_id], (err, patientResult) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Error checking patient", error: err.message });
        }

        if (!patientResult.length) {
          return res.status(404).json({ success: false, message: "Patient not found" });
        }

        const { firstName, middleName, lastName, age, gender } = patientResult[0];
        const fullName = `${firstName} ${middleName || ""} ${lastName}`
          .trim()
          .replace(/\s+/g, " ");

        // Optional: Fetch doctor name
        const getDoctorName = () => {
          return new Promise((resolve) => {
            if (!doctor_id) return resolve(null);

            pool.query(`SELECT fullName FROM doctors WHERE id = ?`, [doctor_id], (docErr, docRes) => {
              if (docErr || !docRes.length) return resolve(null);
              resolve(docRes[0].fullName);
            });
          });
        };

        getDoctorName().then((doctorName) => {
          const blood_pressure = `${blood_pressure_systolic}/${blood_pressure_diastolic}`;
          const height_in_m = height / 100;
          const bmi = height_in_m > 0 ? (weight / (height_in_m * height_in_m)).toFixed(2) : 0;

          // Step 3: Insert into patient_vitals
          const insertQuery = `
            INSERT INTO patient_vitals (
              patient_id, patient_name, doctor_id, age, gender, recorded_at, blood_pressure, 
              respiratory_rate, pulse, spo2, rbs_mg, rbs_nmol, bp_position, temperature, weight, height, bmi,
              risk_of_fall, urgency, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            patient_id,
            fullName,
            doctor_id || null,
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
            risk_of_fall || "Low",
            urgency || "Normal",
            notes || "",
          ];

          pool.query(insertQuery, values, (insertErr, result) => {
            if (insertErr) {
              return res.status(500).json({
                success: false,
                message: "Error saving vitals",
                error: insertErr.message,
              });
            }

            const vitalsId = result.insertId;

            // 🔹 Step 4: Auto insert/update into patient_all_medicals
            const today = new Date().toISOString().split("T")[0];
            pool.query(
              `SELECT id FROM patient_all_medicals WHERE patient_id = ? AND DATE(created_at) = ? LIMIT 1`,
              [patient_id, today],
              (err2, existing) => {
                if (err2) {
                  return res
                    .status(500)
                    .json({ success: false, message: "Error checking medicals", error: err2.message });
                }

                if (existing.length > 0) {
                  // Update existing medical history with new vitals
                  pool.query(
                    `UPDATE patient_all_medicals SET patient_vital = ?, updated_at = NOW() WHERE id = ?`,
                    [vitalsId, existing[0].id]
                  );
                } else {
                  // Insert minimal medical record with vitals
                  pool.query(
                    `INSERT INTO patient_all_medicals (patient_id, patient_vital, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
                    [patient_id, vitalsId]
                  );
                }
              }
            );

            return res.status(201).json({
              success: true,
              message: `Patient vitals recorded successfully for patient id: ${patient_id} on ${recorded_at}`,
              vitalsId,
            });
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
        id, patient_id, patient_name, doctor_id, age, gender, 
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

      // Transform results: remove `blood_pressure`, add `systolic` and `diastolic`
      const updatedVitals = results.map((vital) => {
        const [systolic, diastolic] = (vital.blood_pressure || "0/0").split("/");

        return {
          id: vital.id,
          patient_id: vital.patient_id,
          patient_name: vital.patient_name,
          doctor_id: vital.doctor_id,
          age: vital.age,
          gender: vital.gender,
          recorded_at: vital.recorded_at,
          blood_pressure_systolic: parseInt(systolic),
          blood_pressure_diastolic: parseInt(diastolic),
          respiratory_rate: vital.respiratory_rate,
          pulse: vital.pulse,
          spo2: vital.spo2,
          rbs_mg: vital.rbs_mg,
          rbs_nmol: vital.rbs_nmol,
          bp_position: vital.bp_position,
          temperature: vital.temperature,
          weight: vital.weight,
          height: vital.height,
          bmi: vital.bmi,
          risk_of_fall: vital.risk_of_fall,
          urgency: vital.urgency,
          notes: vital.notes,
        };
      });

      return res.status(200).json({
        success: true,
        message: "Patient vitals retrieved successfully",
        vitals: updatedVitals,
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

    // Step 1: Fetch existing vitals record
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

      // Step 2: Use provided values or fallback to existing
      const blood_pressure_systolic = req.body.blood_pressure_systolic ?? existing.blood_pressure.split("/")[0];
      const blood_pressure_diastolic = req.body.blood_pressure_diastolic ?? existing.blood_pressure.split("/")[1];
      const blood_pressure = `${blood_pressure_systolic}/${blood_pressure_diastolic}`;

      const weight = req.body.weight ?? existing.weight;
      const height = req.body.height ?? existing.height;
      const height_in_m = height / 100;
      const bmi = (height_in_m > 0) ? (weight / (height_in_m * height_in_m)).toFixed(2) : existing.bmi;

      const updatedValues = {
        doctor_id: req.body.doctor_id ?? existing.doctor_id,
        recorded_at: req.body.recorded_at ?? existing.recorded_at,
        blood_pressure,
        respiratory_rate: req.body.respiratory_rate ?? existing.respiratory_rate,
        pulse: req.body.pulse ?? existing.pulse,
        spo2: req.body.spo2 ?? existing.spo2,
        rbs_mg: req.body.rbs_mg ?? existing.rbs_mg,
        rbs_nmol: req.body.rbs_nmol ?? existing.rbs_nmol,
        bp_position: req.body.bp_position ?? existing.bp_position,
        temperature: req.body.temperature ?? existing.temperature,
        weight,
        height,
        bmi,
        risk_of_fall: req.body.risk_of_fall ?? existing.risk_of_fall,
        urgency: req.body.urgency ?? existing.urgency,
        notes: req.body.notes ?? existing.notes,
      };

      // Step 3: Update query
      const updateQuery = `
        UPDATE patient_vitals SET
          doctor_id = ?, recorded_at = ?, blood_pressure = ?, respiratory_rate = ?, pulse = ?, spo2 = ?,
          rbs_mg = ?, rbs_nmol = ?, bp_position = ?, temperature = ?, weight = ?, height = ?, bmi = ?,
          risk_of_fall = ?, urgency = ?, notes = ?
        WHERE id = ?
      `;

      const updateParams = [
        updatedValues.doctor_id,
        updatedValues.recorded_at,
        updatedValues.blood_pressure,
        updatedValues.respiratory_rate,
        updatedValues.pulse,
        updatedValues.spo2,
        updatedValues.rbs_mg,
        updatedValues.rbs_nmol,
        updatedValues.bp_position,
        updatedValues.temperature,
        updatedValues.weight,
        updatedValues.height,
        updatedValues.bmi,
        updatedValues.risk_of_fall,
        updatedValues.urgency,
        updatedValues.notes,
        vitalId
      ];

      pool.query(updateQuery, updateParams, (updateErr) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Error updating patient vitals",
            error: updateErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Patient vitals updated successfully",
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

const addICD10 = async (req, res) => {
  try {
    const { code, short_name } = req.body;

    if (!code || !short_name) {
      return res.status(400).json({
        success: false,
        message: "Code and short_name are required",
      });
    }

    // 🔎 Check pre-existence (code or short_name)
    const checkQuery = `
      SELECT * FROM icds_10
      WHERE code = ? OR short_name = ?
      LIMIT 1
    `;
    pool.query(checkQuery, [code, short_name], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while checking existence",
          error: err.message,
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: "ICD-10 code or short_name already exists",
        });
      }

      // ✅ Insert new record
      const insertQuery = `
        INSERT INTO icds_10 (code, short_name)
        VALUES (?, ?)
      `;
      pool.query(insertQuery, [code, short_name], (err2, insertResult) => {
        if (err2) {
          return res.status(500).json({
            success: false,
            message: "Database error while inserting ICD-10",
            error: err2.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "ICD-10 record added successfully",
          data: {
            id: insertResult.insertId,
            code,
            short_name,
          },
        });
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

const getAllIcd10List = (req,res)=>{
  try {
    const getQuery = `Select id , code , short_name as icdName from icds_10` 
    pool.query(getQuery,(err,result)=>{
      if (err) throw err;
      if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "No medicines found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Medicines fetched successfully",
      data: result,
    });

    })
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the rx list",
      error: error.message,
    });
  }
}

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
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the rx list",
      error: error.message,
    });
  }
};

const getRxById = async (req, res) => {
  try {
    const rxId = req.params.rxId;

    if (!rxId) {
      return res.status(400).json({
        success: false,
        message: "Rx ID is required",
      });
    }

    const query = `
      SELECT 
        id AS rxId,
        medicine_name ,
        strength,
        unit,
        pharmaceutical_form AS form,
        frequency,
        duration,
        notes,
        route,
        product_type AS productType,
        active_substances AS substance
      FROM rx_list
      WHERE id = ?
    `;

    pool.query(query, [rxId], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "An error occurred while retrieving the medicine",
          error: err.message,
        });
      }

      if (!results.length) {
        return res.status(404).json({
          success: false,
          message: "Medicine not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Medicine fetched successfully",
        data: results[0],
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
    quantity,
    expiration_date,
    cost,
    price,
    category,
    strength,
    barcode // ✅ New field
  } = req.body;

  const image = req.file ? req.file.filename : null;

  // ✅ Validate required fields
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
    // ✅ Check for duplicate barcode (optional, only if barcode must be unique)
    if (barcode) {
      const barcodeCheckQuery = `SELECT id FROM drugs WHERE barcode = ?`;
      pool.query(barcodeCheckQuery, [barcode], (barcodeErr, barcodeResult) => {
        if (barcodeErr) {
          return res.status(500).json({
            success: false,
            message: "Database error while checking barcode",
            error: barcodeErr.message,
          });
        }
        if (barcodeResult.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Drug with this barcode already exists.",
          });
        }

        // Proceed if barcode is not duplicate
        insertDrug();
      });
    } else {
      insertDrug(); // If no barcode provided, just proceed
    }

    function insertDrug() {
      // ✅ Step 1: Check for existing drug (by name, substance, company)
      const checkQuery = `
        SELECT * FROM drugs
        WHERE name = ? AND substance = ? AND company = ?
      `;
      const checkValues = [name, substance, company];

      pool.query(checkQuery, checkValues, (checkErr, checkResult) => {
        if (checkErr) {
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

        // ✅ Step 2: Insert the drug
        const insertQuery = `
          INSERT INTO drugs (
            name, substance, unit_of_measurement, company, quantity,
            expiration_date, cost, price, category, strength, image, barcode
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          name,
          substance,
          unit_of_measurement,
          company,
          quantity || null,
          expiration_date,
          cost,
          price,
          category || null,
          strength || null,
          image,
          barcode || null, // ✅ Include barcode
        ];

        pool.query(insertQuery, values, (err, result) => {
          if (err) {
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
    }
  } catch (err) {
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
        return res.status(404).json({
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

const getDrugById = async (req, res) => {
  try {
    const drugId = req.params.drugId;

    if (!drugId) {
      return res.status(400).json({
        success: false,
        message: "Drug ID is required",
      });
    }

    const query = `SELECT * FROM drugs WHERE id = ? AND is_deleted = 0`;

    pool.query(query, [drugId], (err, results) => {
      
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database query failed",
          error: err.message,
        });
      }

      if (!results.length) {
        return res.status(404).json({
          success: false,
          message: "Drug not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Drug data fetched successfully",
        data: results[0],
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

      const updatedFields = {
        name: req.body.name || existing.name,
        substance: req.body.substance || existing.substance,
        unit_of_measurement: req.body.unit_of_measurement || existing.unit_of_measurement,
        company: req.body.company || existing.company,
        quantity: req.body.quantity || existing.quantity,
        expiration_date: req.body.expiration_date || existing.expiration_date,
        cost: req.body.cost !== undefined ? req.body.cost : existing.cost,
        price: req.body.price !== undefined ? req.body.price : existing.price,
        category: req.body.category || existing.category,
        strength: req.body.strength || existing.strength,
        barcode: req.body.barcode || existing.barcode, // <-- new field
        image,
      };

      const updateQuery = `
        UPDATE drugs SET
          name = ?, substance = ?, unit_of_measurement = ?, company = ?, quantity = ?,
          expiration_date = ?, cost = ?, price = ?, category = ?, strength = ?, image = ?, barcode = ?
        WHERE id = ?
      `;

      const values = [
        updatedFields.name,
        updatedFields.substance,
        updatedFields.unit_of_measurement,
        updatedFields.company,
        updatedFields.quantity,
        updatedFields.expiration_date,
        updatedFields.cost,
        updatedFields.price,
        updatedFields.category,
        updatedFields.strength,
        updatedFields.image,
        updatedFields.barcode,
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
    
    if (!drugId) {
      return res.status(400).json({
        success: false,
        message: "Missing drugId in request params",
      });
    }

    // Step 1: Check if drug exists and is not already deleted
    const checkQuery = `SELECT * FROM drugs WHERE id = ? AND is_deleted = 0`;
    pool.query(checkQuery, [drugId], (checkErr, checkResult) => {
      
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
      serviceName,
      description,
      category,
      durationMinutes,
      standardCost,
      secondaryCost,
      insuranceCost,
    } = req.body;

    if (!serviceName || !category || !durationMinutes || !standardCost) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: serviceName, category, standardCost, or durationMinutes.",
      });
    }

    // Step 1: Check for duplicates
    const checkQuery = `SELECT id FROM services WHERE serviceName = ? LIMIT 1`;

    pool.query(checkQuery, [serviceName], (err, existing) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while checking duplicates",
          error: err.message,
        });
      }

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Service with this name already exists",
        });
      }

      // Step 2: Insert if no duplicate
      const insertQuery = `
        INSERT INTO services (
          serviceCode, serviceName, description, category, durationMinutes, standardCost, secondaryCost, insuranceCost
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const serviceId = `SERVICE${generateRandomNumber(5)}`;

      const insertValue = [
        serviceId,
        serviceName,
        description,
        category,
        durationMinutes,
        standardCost,
        secondaryCost,
        insuranceCost,
      ];

      pool.query(insertQuery, insertValue, (err2, result) => {
        if (err2) {
          return res.status(500).json({
            success: false,
            message: "Database insert error",
            error: err2.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Service inserted successfully",
          id: result.insertId,
          serviceCode: serviceId,
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

const getServices = async (req, res) => {
  try {
    const getQuery = `
      SELECT 
        s.id,
        s.serviceCode AS code,
        s.serviceName AS name,
        s.description,

        s.category AS categoryId, -- from services
        sc.category_name AS categoryName, -- from service_categories

        s.durationMinutes AS duration,
        s.standardCost AS standard_price,
        s.secondaryCost AS secondary_price,
        s.insuranceCost AS insurance_price

      FROM 
        services s
      LEFT JOIN 
        service_categories sc ON s.category = sc.id
    `;

    pool.query(getQuery, (err, results) => {
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

const updateService = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    // Step 1: Get existing service
    const getQuery = `SELECT * FROM services WHERE id = ?`;
    pool.query(getQuery, [id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: "DB error", error: err.message });
      if (results.length === 0) return res.status(404).json({ success: false, message: "Service not found" });

      const existing = results[0];
      const {
        serviceName = existing.serviceName,
        description = existing.description,
        category = existing.category,
        durationMinutes = existing.durationMinutes,
        standardCost = existing.standardCost,
        secondaryCost = existing.secondaryCost,
        insuranceCost = existing.insuranceCost,
      } = req.body;

      const updateQuery = `
        UPDATE services SET
          serviceName = ?, description = ?, category = ?, durationMinutes = ?,
          standardCost = ?, secondaryCost = ?, insuranceCost = ?
        WHERE id = ?
      `;

      const values = [
        serviceName,
        description,
        category,
        durationMinutes,
        standardCost,
        secondaryCost,
        insuranceCost,
        id,
      ];

      pool.query(updateQuery, values, (err2, result) => {
        if (err2) return res.status(500).json({ success: false, message: "Update error", error: err2.message });

        return res.status(200).json({ success: true, message: "Service updated successfully" });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    const deleteQuery = `DELETE FROM services WHERE id = ?`;

    pool.query(deleteQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "DB error", error: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }

      return res.status(200).json({ success: true, message: "Service deleted successfully" });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

const addLabService = async (req, res) => {
  try {
    const { category, serviceName } = req.body;

    if (!category || !serviceName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: category or serviceName",
      });
    }

    const checkQuery = `SELECT * FROM lab_services WHERE category = ? AND serviceName = ?`;
    pool.query(checkQuery, [category, serviceName], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({
          success: false,
          message: "Error checking for duplicates",
        });
      }

      if (checkResult.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Service already exists",
        });
      }

      const insertQuery = `
        INSERT INTO lab_services (category, serviceName)
        VALUES (?, ?)`;

      pool.query(insertQuery, [category, serviceName], (insertErr, insertResult) => {
        if (insertErr) {
          return res.status(500).json({
            success: false,
            message: "Error inserting service",
            error: insertErr.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Service added successfully",
          data: {
            serviceId: insertResult.insertId,
            category,
            serviceName,
          },
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

const getAllLabServices = (req, res) => {
  try {
    const query = "SELECT * FROM lab_services";

  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching services",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No services found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      data: results,
    });
  })
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : "Internal Server Error",
      error : error.message
    })
  }
  
};

const editLabServices = (req,res) => {
  try {

    const labServiceId = req.params.labServiceId
    
    const {category , serviceName} = req.body

    const serviceQuery = `Select * from lab_services where id = ?`
    
    pool.query(serviceQuery,[labServiceId],(err,result)=>{
      
      if(err){
        return res.status(500).json({
        success: false,
        message: "Database query failed",
        error: err.message
      })
    }
      if(result.length === 0){
        return res.status(400).json({
          success : true,
          message : "Service id not found"
        })
      }

        const updatedCategory = category || result[0].category
        const updatedServiceName = serviceName || result[0].serviceName

      const updateQuery = `Update lab_services set category = ? ,  serviceName = ? where id = ?`

      pool.query(updateQuery,[updatedCategory,updatedServiceName,labServiceId],(err,updatedResult)=>{
        if(err){
        return res.status(500).json({
        success: false,
        message: "Database query failed",
        error: err.message
      })
    }

    return res.status(200).json({
      success : true,
      message : "Data updated successfully"
    })
      })
    })
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : "Internal Server Error",
      error : error.message
    })
  }
}

const deleteLabService = (req, res) => {
  const serviceId = req.params.serviceId;

  const deleteQuery = "DELETE FROM lab_services WHERE id = ?";

  pool.query(deleteQuery, [serviceId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error deleting service",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  });
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

const addLabs = async (req, res) => {
  try {
    const { lab_name, notes, email, address, phone, speciality } = req.body;
    const image = req.file ? req.file.filename : null; // new line

    if (!lab_name || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: lab_name, email, phone, or address",
      });
    }

    const checkQuery = `SELECT * FROM labs WHERE email = ? OR phone_number = ?`;
    pool.query(checkQuery, [email, phone], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({
          success: false,
          message: "An error occurred while checking for existing records",
        });
      }

      if (checkResult.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Record already exists. Duplicate entries are not allowed.",
        });
      }

      const insertQuery = `
        INSERT INTO labs (lab_name, email, phone_number, speciality, notes, address, image) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

      pool.query(
        insertQuery,
        [lab_name, email, phone, speciality, notes, address, image],
        (insertError, insertData) => {
          if (insertError) {
            return res.status(500).json({
              success: false,
              message: "Error inserting lab record",
              error: insertError.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Lab added successfully",
            data: {
              labId: insertData.insertId,
              lab_name,
              email,
              phone,
              speciality,
              notes,
              address,
              image,
            },
          });
        }
      );
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getAllLabs = async (req, res) => {
  try {
    const getQuery = `
      SELECT 
        l.*, 
        COUNT(lr.lab_id) AS assigned_count
      FROM labs l
      LEFT JOIN lab_requests lr ON l.id = lr.lab_id
      GROUP BY l.id
    `;

    pool.query(getQuery, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error while getting result"
        });
      }
      if (result.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No labs found",
          data: []
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "All labs retrieved successfully",
          data: result
        });
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

const getAllActiveLabs = async (req, res) => {
  try {
    const getQuery = `SELECT * FROM labs WHERE is_active = 1`;

    pool.query(getQuery, (getErr, getResult) => {
      if (getErr) {
        return res.status(500).json({
          success: false,
          message: "Error retrieving lab records",
          error: getErr.message,
        });
      }

      if (!getResult || getResult.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No active labs found",
          data: [],
        });
      }

      return res.status(200).json({
        success: true,
        message: "Active labs fetched successfully",
        data: getResult,
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

const getLabById = async (req, res) => {
  try {
    const labId = req.params.labId;

    if (!labId) {
      return res.status(400).json({
        success: false,
        message: "Lab ID is required",
      });
    }

    const getQuery = `
      SELECT 
        l.*, 
        COUNT(lr.lab_id) AS assigned_count
      FROM labs l
      LEFT JOIN lab_requests lr ON l.id = lr.lab_id
      WHERE l.id = ?
      GROUP BY l.id
    `;

    pool.query(getQuery, [labId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching lab details",
          error: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Lab not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Lab details retrieved successfully",
        data: result[0],
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

const updateLabById = async (req, res) => {
  try {
    const labId = req.params.labId;
    const { lab_name, email, phone, speciality, notes, address } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!labId) {
      return res.status(400).json({
        success: false,
        message: "Lab ID is required",
      });
    }

    // Step 1: Fetch existing lab record
    const getQuery = `SELECT * FROM labs WHERE id = ?`;
    pool.query(getQuery, [labId], (getErr, getResult) => {
      if (getErr) {
        return res.status(500).json({
          success: false,
          message: "Error retrieving lab data",
          error: getErr.message,
        });
      }

      if (getResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Lab not found",
        });
      }

      const existing = getResult[0];

      // Step 2: Prepare updated values
      const updatedLabName = lab_name || existing.lab_name;
      const updatedEmail = email || existing.email;
      const updatedPhone = phone || existing.phone_number;
      const updatedSpeciality = speciality || existing.speciality;
      const updatedNotes = notes || existing.notes;
      const updatedAddress = address || existing.address;
      const updatedImage = image || existing.image;

      // Step 3: Update query
      const updateQuery = `
        UPDATE labs
        SET lab_name = ?, email = ?, phone_number = ?, speciality = ?, notes = ?, address = ?, image = ?
        WHERE id = ?
      `;

      pool.query(
        updateQuery,
        [
          updatedLabName,
          updatedEmail,
          updatedPhone,
          updatedSpeciality,
          updatedNotes,
          updatedAddress,
          updatedImage,
          labId
        ],
        (updateErr, updateResult) => {
          if (updateErr) {
            return res.status(500).json({
              success: false,
              message: "Error updating lab data",
              error: updateErr.message,
            });
          }

          return res.status(200).json({
            success: true,
            message: "Lab updated successfully",
          });
        }
      );
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deleteLabById = async (req, res) => {
  try {
    const labId = req.params.labId;

    if (!labId) {
      return res.status(400).json({
        success: false,
        message: "Lab ID is required",
      });
    }

    const checkQuery = `SELECT * FROM labs WHERE id = ?`;
    pool.query(checkQuery, [labId], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({
          success: false,
          message: "Error checking lab existence",
          error: checkErr.message,
        });
      }

      if (checkResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Lab not found",
        });
      }

      const deleteQuery = `DELETE FROM labs WHERE id = ?`;
      pool.query(deleteQuery, [labId], (deleteErr, deleteResult) => {
        if (deleteErr) {
          return res.status(500).json({
            success: false,
            message: "Error deleting lab",
            error: deleteErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Lab deleted successfully",
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

const changeLabStatus = async (req, res) => {
  try {
    const labId = req.params.labId;
    const { status } = req.body;

    // Validate inputs
    if (!labId) {
      return res.status(400).json({
        success: false,
        message: "Lab ID is required",
      });
    }

    if (typeof status !== 'number' || ![0, 1].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid 'status' (0 or 1) is required in body",
      });
    }

    // First: Fetch current status
    const checkQuery = `SELECT is_active FROM labs WHERE id = ?`;
    pool.query(checkQuery, [labId], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({
          success: false,
          message: "Error checking current status",
          error: checkErr.message,
        });
      }

      if (!checkResult.length) {
        return res.status(404).json({
          success: false,
          message: "Lab not found",
        });
      }

      const currentStatus = checkResult[0].is_active;

      // If same status
      if (currentStatus === status) {
        return res.status(409).json({
          success: false,
          message: `Lab is already ${status === 1 ? 'active' : 'inactive'}`,
        });
      }

      // Proceed with update
      const updateQuery = `UPDATE labs SET is_active = ? WHERE id = ?`;
      pool.query(updateQuery, [status, labId], (updateErr, updateResult) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Error updating lab status",
            error: updateErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: `Lab status changed to ${status === 1 ? 'active' : 'inactive'}`,
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

const addLabRequest = async (req, res) => {
  try {
    const {
      patient_id,
      lab_id,
      doctor_id,
      title,
      description,
      serviceIds, // Array of IDs: [1, 2, 3]
      sent_by,
    } = req.body;

    // Convert serviceIds to array if coming as string from form-data
    let serviceArray = serviceIds;
    if (typeof serviceIds === "string") {
      try {
        serviceArray = JSON.parse(serviceIds);
      } catch {
        return res.status(400).json({
          success: false,
          message: "serviceIds must be a valid JSON array",
        });
      }
    }

    if (
      !patient_id ||
      !lab_id ||
      !doctor_id ||
      !title ||
      !sent_by ||
      !Array.isArray(serviceArray) ||
      serviceArray.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields or serviceIds must be a non-empty array.",
      });
    }

    const serviceIdsStr = serviceArray.join(","); // Convert array to comma-separated string

    // Get uploaded file path if exists
    const filePath = req.file ? req.file.filename : null;

    const insertRequestQuery = `
      INSERT INTO lab_requests 
        (patient_id, lab_id, doctor_id, title, description, sent_by, service_ids, file, status_updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    pool.query(
      insertRequestQuery,
      [
        patient_id,
        lab_id,
        doctor_id,
        title,
        description,
        sent_by,
        serviceIdsStr,
        filePath,
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error inserting lab request",
            error: err.message,
          });
        }

        const labRequestId = result.insertId;
        return sendFinalResponse(res, labRequestId);
      }
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Helper to send structured response

const sendFinalResponse = (res, labRequestId) => {
  const query = `
    SELECT
      lr.id AS request_id,
      lr.title,
      lr.description,
      DATE(lr.created_at) AS request_date,
      TIME(lr.created_at) AS request_time,
      DATEDIFF(CURDATE(), lr.created_at) AS days_since_request,
      CONCAT_WS(' ', p.firstName, NULLIF(p.middleName, ''), p.lastName) AS patient_name,
      p.civilIdNumber AS patient_civil_id,
      d.fullName AS doctor_name,
      l.lab_name,
      lr.sent_by,
      lr.status_updated_at,
      lr.status
    FROM lab_requests lr
    JOIN patients p ON lr.patient_id = p.id
    JOIN doctors d ON lr.doctor_id = d.id
    JOIN labs l ON lr.lab_id = l.id
    WHERE lr.id = ?
  `;

  pool.query(query, [labRequestId], (fetchErr, data) => {
    if (fetchErr) {
      return res.status(500).json({
        success: false,
        message: "Lab request created but response fetch failed",
        error: fetchErr.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Lab request created successfully",
      data: data[0],
    });
  });
};

const getLabRequestsByPatient = async (req, res) => {
  const { patientId } = req.params;

  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: "Patient ID is required",
    });
  }

  const query = `
    SELECT
      lr.id AS request_id,
      lr.title,
      lr.description,
      DATE(lr.created_at) AS request_date,
      TIME(lr.created_at) AS request_time,
      DATEDIFF(CURDATE(), lr.created_at) AS days_since_request,
      DATE(lr.status_updated_at) AS status_change_date,
      TIME(lr.status_updated_at) AS status_change_time,
      DATEDIFF(CURDATE(), lr.status_updated_at) AS days_since_status_change,
      CONCAT_WS(' ', p.firstName, NULLIF(p.middleName, ''), p.lastName) AS patient_name,
      p.civilIdNumber AS patient_civil_id,
      d.id AS doctor_id,
      d.fullName AS doctor_name,
      l.lab_name,
      lr.file,
      lr.sent_by,
      lr.status,
      (
        SELECT GROUP_CONCAT(filename)
        FROM lab_request_attachments
        WHERE lab_request_id = lr.id
      ) AS attachments
    FROM lab_requests lr
    JOIN patients p ON lr.patient_id = p.id
    JOIN doctors d ON lr.doctor_id = d.id
    JOIN labs l ON lr.lab_id = l.id
    WHERE lr.patient_id = ?
    ORDER BY lr.created_at DESC
  `;

  pool.query(query, [patientId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching lab requests",
        error: err.message,
      });
    }

    const data = result.map((row) => ({
      ...row,
      attachments: row.attachments ? row.attachments.split(',') : [],
    }));

    return res.status(200).json({
      success: true,
      message: "Lab requests fetched successfully",
      data,
    });
  });
};

const updateLabRequestStatus = (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["Pending", "Received", "Cancelled"]; // Removed "Result"

  if (!requestId || !status) {
    return res.status(400).json({
      success: false,
      message: "Request ID and status are required",
    });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
    });
  }

  // Build dynamic update query
  let updateFields = `status = ?, status_updated_at = NOW()`;
  let updateValues = [status];

  if (status === "Pending") {
    updateFields += `, pending_at = NOW()`;
  } else if (status === "Received") {
    updateFields += `, received_at = NOW()`;
  }

  updateValues.push(requestId);

  const updateQuery = `
    UPDATE lab_requests
    SET ${updateFields}
    WHERE id = ?
  `;

  pool.query(updateQuery, updateValues, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to update status",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No lab request found with the provided ID",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lab request status updated successfully",
    });
  });
};

const getLabRequestsByStatus = (req, res) => {
  const { status } = req.body;

  const allowedStatuses = ["Not Sent", "Pending", "Received", "Result"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
    });
  }

  const query = `
    SELECT
      lr.id AS request_id,
      lr.title,
      lr.description,
      DATE(lr.created_at) AS request_date,
      TIME(lr.created_at) AS request_time,
      DATEDIFF(CURDATE(), lr.status_updated_at) AS days_since_request,
      CONCAT_WS(' ', p.firstName, NULLIF(p.middleName, ''), p.lastName) AS patient_name,
      p.civilIdNumber AS patient_civil_id,
      d.fullName AS doctor_name,
      l.lab_name,
      lr.file,
      lr.sent_by,
      lr.status,
      lr.pending_at,
      lr.received_at
    FROM lab_requests lr
    JOIN patients p ON lr.patient_id = p.id
    JOIN doctors d ON lr.doctor_id = d.id
    JOIN labs l ON lr.lab_id = l.id
    WHERE LOWER(lr.status) = LOWER(?)
    ORDER BY lr.created_at DESC
  `;

  pool.query(query, [status], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve lab requests",
        error: err.message,
      });
    }

    if (!results || results.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No lab requests found with status '${status}'`,
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: `Lab requests with status '${status}' retrieved successfully`,
      data: results,
    });
  });
};

const getLabRequestById = (req, res) => {
  const { id } = req.params;

  const labRequestQuery = `
    SELECT
      lr.id AS request_id,
      lr.title,
      lr.description,
      DATE(lr.created_at) AS request_date,
      TIME(lr.created_at) AS request_time,
      DATEDIFF(CURDATE(), lr.status_updated_at) AS days_since_request,
      CONCAT_WS(' ', p.firstName, NULLIF(p.middleName, ''), p.lastName) AS patient_name,
      p.civilIdNumber AS patient_civil_id,
      d.fullName AS doctor_name,
      l.lab_name,
      lr.file,
      lr.sent_by,
      lr.status,
      lr.pending_at,
      lr.received_at,
      lr.service_Ids
    FROM lab_requests lr
    JOIN patients p ON lr.patient_id = p.id
    JOIN doctors d ON lr.doctor_id = d.id
    JOIN labs l ON lr.lab_id = l.id
    WHERE lr.id = ?
  `;

  pool.query(labRequestQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve lab request",
        error: err.message,
      });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No lab request found with ID '${id}'`,
      });
    }

    const request = results[0];

    const serviceIds = request.service_Ids
      ? request.service_Ids.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      : [];

    // If no services found, return directly
    if (serviceIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: `Lab request with ID '${id}' retrieved successfully`,
        data: {
          ...request,
          services: [],
        },
      });
    }

    const serviceQuery = `
      SELECT id, serviceName, category FROM lab_services WHERE id IN (?)
    `;

    pool.query(serviceQuery, [serviceIds], (err2, serviceResults) => {
      if (err2) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch service details",
          error: err2.message,
        });
      }

      const finalResponse = {
        ...request,
        services: serviceResults.map(s => ({
          serviceId : s.id,
          serviceName: s.serviceName,
          category: s.category
        }))
      };

      delete finalResponse.serviceIds; // Optional: remove raw serviceIds if you don't want to return them

      return res.status(200).json({
        success: true,
        message: `Lab request with ID '${id}' retrieved successfully`,
        data: finalResponse,
      });
    });
  });
};1

const deleteLabRequest = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Lab request ID is required",
    });
  }

  const checkQuery = `SELECT * FROM lab_requests WHERE id = ?`;
  const deleteQuery = `DELETE FROM lab_requests WHERE id = ?`;

  // Step 1: Check if the lab request exists
  pool.query(checkQuery, [id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(500).json({
        success: false,
        message: "Error checking lab request",
        error: checkErr.message,
      });
    }

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No lab request found with ID ${id}`,
      });
    }

    // Step 2: Delete it
    pool.query(deleteQuery, [id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete lab request",
          error: deleteErr.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Lab request with ID ${id} deleted successfully`,
      });
    });
  });
};

const editLabRequest = (req, res) => {
  const { id } = req.params;
  const { lab_id, title, description } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Lab request ID is required",
    });
  }

  // Step 1: Get current data from DB
  const getQuery = `SELECT * FROM lab_requests WHERE id = ?`;

  pool.query(getQuery, [id], (getErr, getResult) => {
    if (getErr) {
      return res.status(500).json({
        success: false,
        message: "Error fetching existing lab request",
        error: getErr.message,
      });
    }

    if (getResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Lab request with ID ${id} not found`,
      });
    }

    const existing = getResult[0];

    // Step 2: Use provided values if given, otherwise use existing ones
    const updatedLabId = lab_id ?? existing.lab_id;
    const updatedTitle = title ?? existing.title;
    const updatedDescription = description ?? existing.description;

    // Step 3: Update the row
    const updateQuery = `
      UPDATE lab_requests
      SET lab_id = ?, title = ?, description = ?
      WHERE id = ?
    `;

    pool.query(updateQuery, [updatedLabId, updatedTitle, updatedDescription, id], (updateErr, updateResult) => {
      if (updateErr) {
        return res.status(500).json({
          success: false,
          message: "Failed to update lab request",
          error: updateErr.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Lab request with ID ${id} updated successfully`,
      });
    });
  });
};

const addLabRequestAttachment = async (req, res) => {
  try {
    const lab_request_id = parseInt(req.params.lab_request_id);
    const { report_status, name } = req.body;
    const file = req.file;

    //  Validate lab_request_id
    if (!lab_request_id || isNaN(lab_request_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing lab_request_id in URL params",
      });
    }

    // 🔒 Validate report_status
    if (!report_status || typeof report_status !== "string" || report_status.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Report status is required and must be a non-empty string",
      });
    }

    // 🔒 Validate name
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Name is required and must be a non-empty string",
      });
    }

    // 🔒 Validate file
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "A single file upload is required under 'file' field",
      });
    }

    // ✅ Insert into DB
    const insertQuery = `
      INSERT INTO lab_request_attachments
        (lab_request_id, filename, report_status, name, uploaded_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    pool.query(
      insertQuery,
      [lab_request_id, file.filename, report_status, name],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to insert attachment",
            error: err.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Attachment uploaded successfully",
          attachment_id: result.insertId,
          uploaded_file: file.filename,
        });
      }
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const updateLabRequestAttachment = async (req, res) => {
  try {
    const attachment_id = parseInt(req.params.attachment_id);
    const { report_status, name } = req.body;
    const file = req.file;

    //  Validate ID
    if (!attachment_id || isNaN(attachment_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing attachment_id in URL params",
      });
    }

    // 🔄 Build dynamic fields to update
    const updates = [];
    const values = [];

    if (report_status && typeof report_status === "string" && report_status.trim() !== "") {
      updates.push("report_status = ?");
      values.push(report_status);
    }

    if (name && typeof name === "string" && name.trim() !== "") {
      updates.push("name = ?");
      values.push(name);
    }

    if (file) {
      updates.push("filename = ?");
      values.push(file.filename);
    }

    //  If nothing to update
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    //  Build query
    const updateQuery = `
      UPDATE lab_request_attachments
      SET ${updates.join(", ")}
      WHERE id = ?
    `;
    values.push(attachment_id); // For WHERE clause

    pool.query(updateQuery, values, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update attachment",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: `No attachment found with ID ${attachment_id}`,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Attachment updated successfully",
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

const getLabRequestAttachmentsByLabRequestId = (req, res) => {
  const labRequestId = parseInt(req.params.labRequestId);

  if (!labRequestId || isNaN(labRequestId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing lab request ID",
    });
  }

  const query = `
    SELECT 
      a.id AS attachment_id,
      a.name AS attachment_name,
      a.filename,
      a.report_status,
      a.uploaded_at,

      lr.id AS lab_request_id,
      lr.title AS request_title,
      lr.description AS request_description,
      lr.status AS request_status,
      lr.created_at AS request_created_at,
      lr.status_updated_at,

      lr.sent_by,
      lr.lab_id,
      lr.doctor_id,
      lr.patient_id,

      l.lab_name AS lab_name,
      CONCAT(d.fullName) AS doctor_name,
      CONCAT_WS(' ', p.firstName, p.middleName, p.lastName) AS patient_name

    FROM lab_request_attachments a
    JOIN lab_requests lr ON a.lab_request_id = lr.id
    LEFT JOIN labs l ON lr.lab_id = l.id
    LEFT JOIN doctors d ON lr.doctor_id = d.id
    LEFT JOIN patients p ON lr.patient_id = p.id
    WHERE lr.id = ?
    ORDER BY a.uploaded_at DESC
  `;

  pool.query(query, [labRequestId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database query failed",
        error: err.message,
      });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No attachments found for lab request ID ${labRequestId}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attachments for lab request with names retrieved successfully",
      data: results,
    });
  });
};

const deleteLabRequestAttachment = async (req, res) => {
  try {
    const attachment_id = parseInt(req.params.attachment_id);

    // 🔍 Validate attachment_id
    if (!attachment_id || isNaN(attachment_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing attachment_id in URL params",
      });
    }

    const deleteQuery = `DELETE FROM lab_request_attachments WHERE id = ?`;

    pool.query(deleteQuery, [attachment_id], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete attachment",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: `No attachment found with ID ${attachment_id}`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Attachment with ID ${attachment_id} deleted successfully`,
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

// post service category 
const serviceCategory =  async(req,res)=>{
  try {
    const category_name = req.body.category_name
    if(!category_name){
      return res.status(400).json({
        success : false,
        message : "Category name is required"
      })
    }

    const existingQuery= `select * from service_categories where category_name = ?`
    pool.query(existingQuery,[category_name],(err,existingData)=>{
        if(err){
          return res.status(500).json({
          success : false,
          message : "Error while checking existing data"
      })
    }
    if (existingData.length>0){
      return res.status(400).json({
      success : false,
      message : "Category name already exist"})
    }

    const insertQuery = "Insert into service_categories (category_name) values (?)"

    pool.query(insertQuery,[category_name],(err,result)=>{
      if(err){
        return res.status(500).json({
          success : false,
          message:"Error while inserting in database"
        })
      }
      return res.status(201).json({
        success : false,
        message : "Service category added successfully"
      })
    })
    })

  } catch (error) {
    return res.status(500).json({
      success : false,
      message : "Internal Server Error",
      error : error.message
    })
  }
}

// get all service category
const getAllServiceCategories = (req, res) => {
  const query = "SELECT * FROM service_categories ORDER BY id DESC";

  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch categories",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No categories found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: results,
    });
  });
};

// update service category
const updateServiceCategory = (req, res) => {
  const categoryId = req.params.categoryId;
  const { category_name } = req.body;

  if (!category_name) {
    return res.status(400).json({
      success: false,
      message: "Category name is required",
    });
  }

  const query = "UPDATE service_categories SET category_name = ? WHERE id = ?";

  pool.query(query, [category_name, categoryId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to update category",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });
  });
};

// delete service category
const deleteServiceCategory = (req, res) => {
  const categoryId = req.params.categoryId;

  const query = "DELETE FROM service_categories WHERE id = ?";

  pool.query(query, [categoryId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete category",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  });
};

// post allergy
const createAllergy = (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Allergy name is required",
    });
  }

  // Step 1: Check if allergy with same name already exists
  const checkQuery = `SELECT * FROM allergies WHERE name = ?`;
  pool.query(checkQuery, [name], (err, existing) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error checking existing allergy",
        error: err.message,
      });
    }

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Allergy with this name already exists",
      });
    }

    // Step 2: Insert new allergy
    const insertQuery = `
      INSERT INTO allergies (name, description)
      VALUES (?, ?)
    `;

    pool.query(insertQuery, [name, description], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error inserting new allergy",
          error: err.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Allergy added successfully",
        insertId: result.insertId,
      });
    });
  });
};

// get allergy
const getAllAllergies = (req, res) => {
  const query = "SELECT * FROM allergies ORDER BY id DESC";

  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch allergies",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No allergies found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Allergies fetched successfully",
      data: results,
    });
  });
};

// update allergy
const updateAllergy = async (req, res) => {
  try {
    const { allergyId } = req.params;
    const { name, description } = req.body;

    // Step 1: Get existing record
    const getQuery = `SELECT * FROM allergies WHERE id = ?`;
    pool.query(getQuery, [allergyId], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: "Allergy not found" });
      }

      const existing = result[0];

      const updatedName = name || existing.name;
      const updatedDescription = description || existing.description;

      // Step 3: Update query
      const updateQuery = `
        UPDATE allergies 
        SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      pool.query(updateQuery, [updatedName, updatedDescription, allergyId], (updateErr, updateResult) => {
        if (updateErr) {
          return res.status(500).json({ success: false, message: "Update failed",error : updateErr });
        }

        return res.status(200).json({ success: true, message: "Allergy updated successfully" });
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

// delete allergy
const deleteAllergy = (req, res) => {
  const allergyId = req.params.allergyId;

  const deleteQuery = "DELETE FROM allergies WHERE id = ?";

  pool.query(deleteQuery, [allergyId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error while deleting allergy",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Allergy not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Allergy deleted successfully",
    });
  });
};

const addComplaint = async (req, res) => {
  const { complaints } = req.body;

  if (!complaints) {
    return res.status(400).json({ success: false, message: "Complaint is required" });
  }

  // Check if the complaint already exists
  const checkQuery = `SELECT * FROM chief_complaints WHERE complaints = ?`;
  pool.query(checkQuery, [complaints], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(500).json({ success: false, message: "DB error", error: checkErr.message });
    }

    if (checkResult.length > 0) {
      return res.status(409).json({ success: false, message: "Complaint already exists" });
    }

    // Insert if not exists
    const insertQuery = `INSERT INTO chief_complaints (complaints) VALUES (?)`;
    pool.query(insertQuery, [complaints], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Insert error", error: err.message });
      }

      return res.status(201).json({ success: true, message: "Complaint added successfully" });
    });
  });
};

const getAllComplaints = async (req, res) => {
  const query = `SELECT * FROM chief_complaints ORDER BY id DESC`;

  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No complaints found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully",
      data: results,
    });
  });
};

const updateComplaintById = async (req, res) => {
  const { id } = req.params;
  const { complaints } = req.body;

  if (!id || !complaints) {
    return res.status(400).json({ success: false, message: "ID and complaint are required" });
  }

  // Check if the new complaint already exists (excluding current one)
  const checkQuery = `SELECT * FROM chief_complaints WHERE complaints = ? AND id != ?`;
  pool.query(checkQuery, [complaints, id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(500).json({ success: false, message: "DB error", error: checkErr.message });
    }

    if (checkResult.length > 0) {
      return res.status(409).json({ success: false, message: "Another complaint with this name already exists" });
    }

    // Proceed to update
    const updateQuery = `UPDATE chief_complaints SET complaints = ? WHERE id = ?`;
    pool.query(updateQuery, [complaints, id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Update error", error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Complaint not found" });
      }

      return res.status(200).json({ success: true, message: "Complaint updated successfully" });
    });
  });
};

const deleteComplaintById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID is required" });
  }

  const deleteQuery = `DELETE FROM chief_complaints WHERE id = ?`;

  pool.query(deleteQuery, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Delete error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    return res.status(200).json({ success: true, message: "Complaint deleted successfully" });
  });
};

const addSpeciality = (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: "Name is required" });
  }

  const checkQuery = `SELECT * FROM specialities WHERE name = ?`;
  pool.query(checkQuery, [name], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error", error: err.message });
    if (results.length > 0) {
      return res.status(409).json({ success: false, message: "Speciality already exists" });
    }

    const insertQuery = `INSERT INTO specialities (name) VALUES (?)`;
    pool.query(insertQuery, [name], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Insert error", error: err.message });
      return res.status(201).json({ success: true, message: "Speciality added successfully" });
    });
  });
};

const getAllSpecialities = (req, res) => {

  let query = `SELECT * FROM specialities`;

  pool.query(query,(err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No complaints found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully",
      data: results,
    });
  });
};

const updateSpecialityById = (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!id) return res.status(400).json({ success: false, message: "ID is required" });

  const fetchQuery = `SELECT * FROM specialities WHERE id = ?`;
  pool.query(fetchQuery, [id], (err, existingData) => {
    if (err) return res.status(500).json({ success: false, message: "Fetch error", error: err.message });

    if (existingData.length === 0) {
      return res.status(404).json({ success: false, message: "Speciality not found" });
    }

    const updatedName = name || existingData[0].name;

    const updateQuery = `UPDATE specialities SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    pool.query(updateQuery, [updatedName, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Update failed", error: err.message });

      return res.status(200).json({ success: true, message: "Speciality updated successfully" });
    });
  });
};

const deleteSpecialityById = (req, res) => {
  const id = req.params.id;

  if (!id) return res.status(400).json({ success: false, message: "ID is required" });

  const checkQuery = `SELECT * FROM specialities WHERE id = ?`;
  pool.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error", error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Speciality not found" });
    }

    const deleteQuery = `DELETE FROM specialities WHERE id = ?`;
    pool.query(deleteQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Delete error", error: err.message });

      return res.status(200).json({ success: true, message: "Speciality deleted successfully" });
    });
  });
};

const searchComplaints = (req, res) => {
  const { text } = req.query;

  if (!text || text.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Search text is required",
    });
  }

  const searchQuery = `
    SELECT * FROM chief_complaints 
    WHERE LOWER(complaints) LIKE CONCAT('%', LOWER(?), '%') 
  `;

  pool.query(searchQuery, [text], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No complaints found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully",
      data: results,
    });
  });
};

// Helper function to insert suggestion text if not exists

const saveSuggestion = (table, text) => {
  return new Promise((resolve, reject) => {
    if (!text || text.trim() === "") return resolve(); // skip if empty

    pool.query(
      `SELECT id FROM ${table} WHERE LOWER(text) = LOWER(?) LIMIT 1`,
      [text],
      (err, rows) => {
        if (err) return reject(err);

        if (rows.length === 0) {
          // Insert new suggestion
          pool.query(
            `INSERT INTO ${table} (text, created_at, updated_at) VALUES (?, NOW(), NOW())`,
            [text],
            (err2) => {
              if (err2) return reject(err2);
              resolve();
            }
          );
        } else {
          resolve(); // already exists
        }
      }
    );
  });
};

const addPatientMedicals = async (req, res) => {
  try {
    const {
      chief_complaint,
      history_of_present_illness,
      history_of_past_illness,
      examination_general,
      examination_systemic,
      examination_local,
      treatment_plan,
      advises,
      extra_notes,
      pain_assessment
    } = req.body;

    const patient_id = req.params.patient_id;
    const today = new Date().toISOString().split("T")[0];

    //  Check if vitals exist for patient today
    pool.query(
      `SELECT id FROM patient_vitals 
       WHERE patient_id = ? AND DATE(recorded_at) = ? 
       ORDER BY recorded_at DESC LIMIT 1`,
      [patient_id, today],
      async (err, vitals) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error fetching vitals",
            error: err.message
          });
        }

        //  If no vitals found for today, stop here
        if (vitals.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Please add today's vitals first for patient_id = ${patient_id}`
          });
        }

        const patient_vital_id = vitals[0].id;

        //  Check if medicals already exist for today
        pool.query(
          `SELECT id FROM patient_all_medicals 
           WHERE patient_id = ? AND DATE(created_at) = ? LIMIT 1`,
          [patient_id, today],
          async (err3, existing) => {
            if (err3) {
              return res.status(500).json({
                success: false,
                message: "Error checking existing medicals",
                error: err3.message
              });
            }

            try {
              //  Save text into suggestion tables
              await saveSuggestion("chief_complaints", chief_complaint);
              await saveSuggestion("history_of_present_illness", history_of_present_illness);
              await saveSuggestion("history_of_past_illness", history_of_past_illness);
              await saveSuggestion("examination_general", examination_general);
              await saveSuggestion("examination_systemic", examination_systemic);
              await saveSuggestion("examination_local", examination_local);
              await saveSuggestion("treatment_plan", treatment_plan);
              await saveSuggestion("advises", advises);
              await saveSuggestion("extra_notes", extra_notes);

              if (existing.length > 0) {
                // Update existing medical record (created by vitals earlier)
                const medicalId = existing[0].id;

                const updateQuery = `
                  UPDATE patient_all_medicals SET 
                    chief_complaint = ?,
                    history_of_present_illness = ?,
                    history_of_past_illness = ?,
                    examination_general = ?,
                    examination_systemic = ?,
                    examination_local = ?,
                    treatment_plan = ?,
                    advises = ?,
                    extra_notes = ?,
                    pain_assessment = ?,
                    updated_at = NOW()
                  WHERE id = ?
                `;

                const updateValues = [
                  chief_complaint,
                  history_of_present_illness,
                  history_of_past_illness,
                  examination_general,
                  examination_systemic,
                  examination_local,
                  treatment_plan,
                  advises,
                  extra_notes,
                  pain_assessment,
                  medicalId
                ];

                pool.query(updateQuery, updateValues, (err4) => {
                  if (err4) {
                    return res.status(500).json({
                      success: false,
                      message: "Update failed",
                      error: err4.message
                    });
                  }

                  return res.status(200).json({
                    success: true,
                    message: "Patient medicals updated successfully"
                  });
                });
              } else {
                //  Insert new record (if for some reason vitals didn’t already create it)
                const insertQuery = `
                  INSERT INTO patient_all_medicals (
                    patient_id,
                    chief_complaint,
                    history_of_present_illness,
                    history_of_past_illness,
                    examination_general,
                    examination_systemic,
                    examination_local,
                    treatment_plan,
                    advises,
                    extra_notes,
                    pain_assessment,
                    patient_vital,
                    created_at,
                    updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;

                const values = [
                  patient_id,
                  chief_complaint,
                  history_of_present_illness,
                  history_of_past_illness,
                  examination_general,
                  examination_systemic,
                  examination_local,
                  treatment_plan,
                  advises,
                  extra_notes,
                  pain_assessment,
                  patient_vital_id
                ];

                pool.query(insertQuery, values, (err2) => {
                  if (err2) {
                    return res.status(500).json({
                      success: false,
                      message: "Insert failed",
                      error: err2.message
                    });
                  }

                  return res.status(200).json({
                    success: true,
                    message: "Patient medicals added successfully"
                  });
                });
              }
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: "Error saving suggestions",
                error: error.message
              });
            }
          }
        );
      }
    );
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message
    });
  }
};


const getMedicalDataWithVitals = (req, res) => {
  const { patient_id } = req.params;

  if (!patient_id) {
    return res.status(400).json({
      success: false,
      message: "Patient ID is required",
    });
  }

  // latest medical record with vitals for today
  const medicalQuery = `
    SELECT pam.*, 
           pv.id AS vitals_id,
           pv.gender, pv.age, pv.doctor_id, pv.recorded_at, pv.blood_pressure,
           pv.respiratory_rate, pv.pulse, pv.spo2, pv.rbs_mg, pv.rbs_nmol, pv.bp_position,
           pv.temperature, pv.weight, pv.height, pv.bmi, pv.risk_of_fall, pv.urgency, pv.notes, pv.nurse
    FROM patient_all_medicals pam
    LEFT JOIN patient_vitals pv ON pam.patient_vital = pv.id
    WHERE pam.patient_id = ? AND DATE(pam.created_at) = CURDATE()
    ORDER BY pam.created_at DESC LIMIT 1
  `;

  pool.query(medicalQuery, [patient_id], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching medical record", 
        error: err.message 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No medical record found for today" 
      });
    }

    const row = results[0];
    const {
      vitals_id, gender, age, doctor_id, recorded_at, blood_pressure,
      respiratory_rate, pulse, spo2, rbs_mg, rbs_nmol, bp_position,
      temperature, weight, height, bmi, risk_of_fall, urgency, notes, nurse,
      ...medicalData
    } = row;

    const vitals = {
      id: vitals_id,
      gender,
      age,
      doctor_id,
      recorded_at,
      blood_pressure,
      respiratory_rate,
      pulse,
      spo2,
      rbs_mg,
      rbs_nmol,
      bp_position,
      temperature,
      weight,
      height,
      bmi,
      risk_of_fall,
      urgency,
      notes,
      nurse
    };

    //  patient_id based queries (all medicals)
    const diagnosisQuery = `SELECT * FROM diagnosis WHERE patient_id = ?`;
    const prescriptionQuery = `
      SELECT pg.id AS group_id, pg.doctor_id, pg.created_at AS group_created_at,
             p.id AS prescription_id, p.medicine_name, p.dose, p.frequency, p.duration, p.notes,p.substance,p.route,p.duration,p.strength
      FROM prescription_groups pg
      LEFT JOIN prescriptions p ON pg.id = p.prescription_group_id
      WHERE pg.patient_id = ?
      ORDER BY pg.created_at DESC
    `;
    const allergyQuery = `SELECT * FROM patient_allergies WHERE patient_id = ?`;
    const chronicIllnessQuery = `SELECT * FROM chronic_illness WHERE patient_id = ?`;
    const xRayQuery = `SELECT * FROM xray_and_radiology WHERE patient_id = ?`;

    pool.query(diagnosisQuery, [patient_id], (err1, diagnosis) => {
      if (err1) return res.status(500).json({ success: false, message: "Error fetching diagnosis", error: err1.message });

      pool.query(prescriptionQuery, [patient_id], (err2, prescriptionRows) => {
        if (err2) return res.status(500).json({ success: false, message: "Error fetching prescriptions", error: err2.message });

        //  Group prescriptions by group_id (doctor wise + time wise)
        const prescriptions = [];
        const groupMap = {};

        prescriptionRows.forEach(row => {
          if (!groupMap[row.group_id]) {
            groupMap[row.group_id] = {
              group_id: row.group_id,
              doctor_id: row.doctor_id,
              prescribed_at: row.group_created_at,
              medicines: []
            };
            prescriptions.push(groupMap[row.group_id]);
          }

          if (row.prescription_id) {
            groupMap[row.group_id].medicines.push({
              id: row.prescription_id,
              medicine_name: row.medicine_name,
              dose: row.dose,
              frequency: row.frequency,
              duration: row.duration,
              notes: row.notes,
              strength : row.strength,
              route:row.route,
              substance:row.substance,
              duration : row.duration
            });
          }
        });
        console.log(prescriptions);
        

        pool.query(allergyQuery, [patient_id], (err3, allergies) => {
          if (err3) return res.status(500).json({ success: false, message: "Error fetching allergies", error: err3.message });

          pool.query(chronicIllnessQuery, [patient_id], (err4, chronicIllnesses) => {
            if (err4) return res.status(500).json({ success: false, message: "Error fetching chronic illnesses", error: err4.message });

            pool.query(xRayQuery, [patient_id], (err5, xRay) => {
              if (err5) return res.status(500).json({ success: false, message: "Error fetching xray", error: err5.message });

              return res.status(200).json({
                success: true,
                message: `Patient medical data fetched successfully for ${new Date().toLocaleDateString()}`,
                data: {
                  ...medicalData,
                  vitals,
                  diagnosis,
                  prescriptions,   //  now grouped by doctor + time
                  allergies,
                  chronic_illnesses: chronicIllnesses,
                  xRay_and_radiology: xRay
                }
              });
            });
          });
        });
      });
    });
  });
}

const getAllMedicalDataByPatient = (req, res) => {
  const { patient_id } = req.params;

  if (!patient_id) {
    return res.status(400).json({
      success: false,
      message: "Patient ID is required",
    });
  }

  const medicalQuery = `
    SELECT pam.*, 
           pv.id AS vitals_id,
           pv.gender, pv.age, pv.doctor_id, pv.recorded_at, pv.blood_pressure,
           pv.respiratory_rate, pv.pulse, pv.spo2, pv.rbs_mg, pv.rbs_nmol, pv.bp_position,
           pv.temperature, pv.weight, pv.height, pv.bmi, pv.risk_of_fall, pv.urgency, pv.notes, pv.nurse
    FROM patient_all_medicals pam
    LEFT JOIN patient_vitals pv ON pam.patient_vital = pv.id
    WHERE pam.patient_id = ?
    ORDER BY pam.created_at DESC
  `;

  pool.query(medicalQuery, [patient_id], (err, records) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching medical records",
        error: err.message,
      });
    }

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No medical records found",
      });
    }
    //  Fetch related tables one by one
    pool.query(`SELECT * FROM diagnosis WHERE patient_id = ?`, [patient_id], (err, diagnosis) => {
      if (err) return res.status(500).json({ success: false, message: "Error fetching diagnosis", error: err.message });

      pool.query(
        `
        SELECT 
          pg.id AS group_id, 
          pg.doctor_id, 
          pg.created_at AS group_created_at,
          p.id AS prescription_id, 
          p.medicine_name, p.dose, p.frequency, p.duration, 
          p.notes, p.substance, p.route, p.strength
        FROM prescription_groups pg
        LEFT JOIN prescriptions p ON pg.id = p.prescription_group_id
        WHERE pg.patient_id = ?
        ORDER BY pg.created_at DESC
        `,
        [patient_id],
        (err, prescriptionsRaw) => {
          if (err) return res.status(500).json({ success: false, message: "Error fetching prescriptions", error: err.message });
          console.log(prescriptionsRaw);
          
          //  Group prescriptions correctly by group_id
          const prescriptions = prescriptionsRaw.reduce((acc, row) => {
            const groupId = row.group_id; //  FIXED
            if (!acc[groupId]) {
              acc[groupId] = {
                group_id: row.group_id,
                doctor_id: row.doctor_id,
                prescribed_at: row.group_created_at,
                medicines: []
              };
            }
            if (row.prescription_id) {
              acc[groupId].medicines.push({
                id: row.prescription_id,
                medicine_name: row.medicine_name,
                dose: row.dose,
                frequency: row.frequency,
                duration: row.duration,
                notes: row.notes,
                strength: row.strength,
                route: row.route,
                substance: row.substance
              });
            }
            return acc;
          }, {});

          pool.query(`SELECT * FROM patient_allergies WHERE patient_id = ?`, [patient_id], (err, allergies) => {
            if (err) return res.status(500).json({ success: false, message: "Error fetching allergies", error: err.message });

            pool.query(`SELECT * FROM chronic_illness WHERE patient_id = ?`, [patient_id], (err, chronicIllnesses) => {
              if (err) return res.status(500).json({ success: false, message: "Error fetching chronic illnesses", error: err.message });

              pool.query(`SELECT * FROM xray_and_radiology WHERE patient_id = ?`, [patient_id], (err, xRay) => {
                if (err) return res.status(500).json({ success: false, message: "Error fetching xRay", error: err.message });

                //  Attach to each medical record
                const enrichedRecords = records.map((row) => {
                  const {
                    vitals_id, gender, age, doctor_id, recorded_at, blood_pressure,
                    respiratory_rate, pulse, spo2, rbs_mg, rbs_nmol, bp_position,
                    temperature, weight, height, bmi, risk_of_fall, urgency, notes, nurse,
                    ...medicalData
                  } = row;

                  const vitals = {
                    id: vitals_id,
                    gender,
                    age,
                    doctor_id,
                    recorded_at,
                    blood_pressure,
                    respiratory_rate,
                    pulse,
                    spo2,
                    rbs_mg,
                    rbs_nmol,
                    bp_position,
                    temperature,
                    weight,
                    height,
                    bmi,
                    risk_of_fall,
                    urgency,
                    notes,
                    nurse
                  };

                  return {
                    ...medicalData,
                    vitals,
                    diagnosis,
                    prescriptions: Object.values(prescriptions), // grouped by group_id + doctor + date
                    allergies,
                    chronic_illnesses: chronicIllnesses,
                    xRay_and_radiology: xRay
                  };
                });

                res.status(200).json({
                  success: true,
                  message: `All medical records fetched successfully for patient ${patient_id}`,
                  data: enrichedRecords
                });
              });
            });
          });
        }
      );
    });
  });
};

const getMedicalRecordsByDate = (req, res) => {
  const { patient_id } = req.params;
  const { date } = req.body;

  if (!patient_id || !date) {
    return res.status(400).json({
      success: false,
      message: "Patient ID and date are required",
    });
  }

  const medicalQuery = `
    SELECT pam.*, 
           pv.id AS vitals_id,
           pv.gender, pv.age, pv.doctor_id, pv.recorded_at, pv.blood_pressure,
           pv.respiratory_rate, pv.pulse, pv.spo2, pv.rbs_mg, pv.rbs_nmol, pv.bp_position,
           pv.temperature, pv.weight, pv.height, pv.bmi, pv.risk_of_fall, pv.urgency, pv.notes, pv.nurse
    FROM patient_all_medicals pam
    LEFT JOIN patient_vitals pv ON pam.patient_vital = pv.id
    WHERE pam.patient_id = ?
      AND DATE(pam.created_at) = ?
    ORDER BY pam.created_at DESC
  `;

  pool.query(medicalQuery, [patient_id, date], (err, records) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error fetching medical records", error: err.message });
    }

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: "No medical records found" });
    }

    // ✅ fetch prescriptions (group by group_id + doctor + date)
    const prescriptionQuery = `
      SELECT pg.id AS group_id, pg.doctor_id, pg.created_at AS group_created_at,
             p.id AS prescription_id, p.medicine_name, p.dose, p.frequency, 
             p.duration, p.notes, p.substance, p.route, p.strength
      FROM prescription_groups pg
      LEFT JOIN prescriptions p ON pg.id = p.prescription_group_id
      WHERE pg.patient_id = ? 
      ORDER BY pg.created_at DESC
    `;

    pool.query(prescriptionQuery, [patient_id, date], (presErr, prescriptionRows) => {
      if (presErr) {
        return res.status(500).json({ success: false, message: "Error fetching prescriptions", error: presErr.message });
      }

      const prescriptions = prescriptionRows.reduce((acc, row) => {
        if (!acc[row.group_id]) {
          acc[row.group_id] = {
            group_id: row.group_id,
            doctor_id: row.doctor_id,
            prescribed_at: row.group_created_at,
            medicines: []
          };
        }
        if (row.prescription_id) {
          acc[row.group_id].medicines.push({
            id: row.prescription_id,
            medicine_name: row.medicine_name,
            dose: row.dose,
            frequency: row.frequency,
            duration: row.duration,
            notes: row.notes,
            strength: row.strength,
            route: row.route,
            substance: row.substance
          });
        }
        return acc;
      }, {});

      const prescriptionsArray = Object.values(prescriptions);

      // ✅ fetch other related tables
      pool.query(`SELECT * FROM diagnosis WHERE patient_id = ?`, [patient_id], (diagErr, diagnosis) => {
        if (diagErr) return res.status(500).json({ success: false, message: "Error fetching diagnosis", error: diagErr.message });

        pool.query(`SELECT * FROM patient_allergies WHERE patient_id = ?`, [patient_id], (allErr, allergies) => {
          if (allErr) return res.status(500).json({ success: false, message: "Error fetching allergies", error: allErr.message });

          pool.query(`SELECT * FROM chronic_illness WHERE patient_id = ?`, [patient_id], (chronicErr, chronicIllnesses) => {
            if (chronicErr) return res.status(500).json({ success: false, message: "Error fetching chronic illnesses", error: chronicErr.message });

            pool.query(`SELECT * FROM xray_and_radiology WHERE patient_id = ?`, [patient_id], (xrayErr, xRay) => {
              if (xrayErr) return res.status(500).json({ success: false, message: "Error fetching x-ray data", error: xrayErr.message });

              // ✅ attach everything in same style as getAllMedicalDataByPatient
              const enrichedRecords = records.map((row) => {
                const {
                  vitals_id, gender, age, doctor_id, recorded_at, blood_pressure,
                  respiratory_rate, pulse, spo2, rbs_mg, rbs_nmol, bp_position,
                  temperature, weight, height, bmi, risk_of_fall, urgency, notes, nurse,
                  ...medicalData
                } = row;

                const vitals = {
                  id: vitals_id,
                  gender,
                  age,
                  doctor_id,
                  recorded_at,
                  blood_pressure,
                  respiratory_rate,
                  pulse,
                  spo2,
                  rbs_mg,
                  rbs_nmol,
                  bp_position,
                  temperature,
                  weight,
                  height,
                  bmi,
                  risk_of_fall,
                  urgency,
                  notes,
                  nurse
                };

                return {
                  ...medicalData,
                  vitals,
                  diagnosis,
                  prescriptions: prescriptionsArray,
                  allergies,
                  chronic_illnesses: chronicIllnesses,
                  xRay_and_radiology: xRay
                };
              });

              res.status(200).json({
                success: true,
                message: `Medical records for patient ${patient_id} on ${date} fetched successfully`,
                data: enrichedRecords[0]
              });
            });
          });
        });
      });
    });
  });
};


const getAllMedicalData = (req, res) => {
  const medicalQuery = `
    SELECT pam.*, 
           pv.id AS vitals_id,
           pv.gender, pv.age, pv.doctor_id, pv.recorded_at, pv.blood_pressure,
           pv.respiratory_rate, pv.pulse, pv.spo2, pv.rbs_mg, pv.rbs_nmol, pv.bp_position,
           pv.temperature, pv.weight, pv.height, pv.bmi, pv.risk_of_fall, pv.urgency, pv.notes, pv.nurse
    FROM patient_all_medicals pam
    LEFT JOIN patient_vitals pv ON pam.patient_vital = pv.id
    ORDER BY pam.created_at DESC
  `;

  pool.query(medicalQuery, async (err, records) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error fetching medical records", error: err.message });
    }

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: "No medical records found" });
    }

    try {
      // Get unique patient_id list from records
      const patientIds = [...new Set(records.map(r => r.patient_id))];

      // Parallel fetch for all patients data
      const patientDataMap = {};
      await Promise.all(
        patientIds.map(async (pid) => {
          const [diagnosis, prescriptions, allergies, chronicIllnesses, xRay] = await Promise.all([
            new Promise((resolve, reject) => pool.query(`SELECT * FROM diagnosis WHERE patient_id = ?`, [pid], (e, r) => e ? reject(e) : resolve(r))),
            new Promise((resolve, reject) => pool.query(`SELECT * FROM prescriptions WHERE patient_id = ?`, [pid], (e, r) => e ? reject(e) : resolve(r))),
            new Promise((resolve, reject) => pool.query(`SELECT * FROM patient_allergies WHERE patient_id = ?`, [pid], (e, r) => e ? reject(e) : resolve(r))),
            new Promise((resolve, reject) => pool.query(`SELECT * FROM chronic_illness WHERE patient_id = ?`, [pid], (e, r) => e ? reject(e) : resolve(r))),
            new Promise((resolve, reject) => pool.query(`SELECT * FROM xray_and_radiology WHERE patient_id = ?`, [pid], (e, r) => e ? reject(e) : resolve(r))),
          ]);

          // Prescriptions ke liye RX list merge karna
          const enrichedPrescriptions = await Promise.all(
            prescriptions.map((prescription) => {
              return new Promise((resolve, reject) => {
                pool.query(`SELECT * FROM rx_list WHERE id = ?`, [prescription.prescription_id], (errRx, rxItems) => {
                  if (errRx) return reject(errRx);
                  const mergedData = { ...prescription, ...(rxItems[0] || {}) };
                  resolve(mergedData);
                });
              });
            })
          );

          patientDataMap[pid] = {
            diagnosis,
            prescriptions: enrichedPrescriptions,
            allergies,
            chronic_illnesses: chronicIllnesses,
            xRay_and_radiology: xRay
          };
        })
      );

      // Attach to each medical record
      const enrichedRecords = records.map((row) => {
        const {
          vitals_id, gender, age, doctor_id, recorded_at, blood_pressure,
          respiratory_rate, pulse, spo2, rbs_mg, rbs_nmol, bp_position,
          temperature, weight, height, bmi, risk_of_fall, urgency, notes, nurse,
          ...medicalData
        } = row;

        const vitals = {
          id: vitals_id,
          gender,
          age,
          doctor_id,
          recorded_at,
          blood_pressure,
          respiratory_rate,
          pulse,
          spo2,
          rbs_mg,
          rbs_nmol,
          bp_position,
          temperature,
          weight,
          height,
          bmi,
          risk_of_fall,
          urgency,
          notes,
          nurse
        };

        return {
          ...medicalData,
          vitals,
          ...patientDataMap[row.patient_id] // Same data for all medical records of that patient
        };
      });

      res.status(200).json({
        success: true,
        message: `All medical records fetched successfully for patients`,
        data: enrichedRecords
      });

    } catch (error) {
      res.status(500).json({ success: false, message: "Error enriching medical records", error: error.message });
    }
  });
};

const updateSingleMedicalField = async (req, res) => {
  try {
    const { id, field, value } = req.body;

    if (!id || !field || value === undefined) {
      return res.status(400).json({
        success: false,
        message: "id, field and value are required",
      });
    }

    // Allowed fields (no prescription)
    const allowedFields = [
      "chief_complaint",
      "history_of_present_illness",
      "history_of_past_illness",
      "examination_general",
      "examination_systemic",
      "examination_local",
      "treatment_plan",
      "advises",
      "extra_notes",
      "pain_assessment"
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field name or not allowed to update",
      });
    }

    const sql = `UPDATE patient_all_medicals SET ${field} = ? WHERE id = ?`;

    pool.query(sql, [value, id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      if (result.affectedRows === 0) {
        // id not found
        return res.status(404).json({
          success: false,
          message: `No record found with id ${id}`,
        });
      }

      res.json({
        success: true,
        message: `${field} updated successfully`,
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const searchMedicalField = async (req, res) => {
  try {
    const { table, search } = req.query;

    if (!table) {
      return res.status(400).json({
        success: false,
        message: "Table name is required (e.g., chief_complaints, examination_general)"
      });
    }

    // ✅ Allow only specific tables for security
    const allowedTables = [
      "chief_complaints",
      "history_of_present_illness",
      "history_of_past_illness",
      "examination_general",
      "examination_systemic",
      "examination_local",
      "treatment_plan",
      "advises",
      "extra_notes",
      "illness",
      "icd_standard"
    ];

    if (!allowedTables.includes(table)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table name"
      });
    }

    // ✅ Case-insensitive search (if search query is provided)
    let query = `SELECT text FROM ${table}`;
    let values = [];

    if (search) {
      query += " WHERE LOWER(text) LIKE ?";
      values.push(`%${search.toLowerCase()}%`);
    }

    query += " ORDER BY text ASC LIMIT 20"; // limit for performance

    pool.query(query, values, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      return res.status(200).json({
        success: true,
        message : `Suggestion texts from ${table} table`,
        data: result
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message
    });
  }
};

const searchICD10 = async (req, res) => {
  try {
    const { search = "" } = req.query;

    // minimum 3 letters before searching
    if (search.length < 3) {
      return res.status(200).json({
        success: true,
        message: "Type at least 3 characters to search ICD-10 codes",
        data: [],
      });
    }

    const query = `
      SELECT id, code, short_name
      FROM icds_10
      WHERE LOWER(code) LIKE ? OR LOWER(short_name) LIKE ?
      ORDER BY short_name ASC
      LIMIT 20;
    `;

    const values = [
      `%${search.toLowerCase()}%`,
      `%${search.toLowerCase()}%`
    ];

    pool.query(query, values, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "ICD-10 search results",
        data: result,
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};


// create table text

const createAllTableText = async (req, res) => {
  try {
    const { table } = req.query; 
    const { text } = req.body;   
    
    //  Allowed tables list (whitelist)
    const allowedTables = {
      "chief_complaints": "Chief Complaints",
      "history_of_present_illness": "History of Present Illness",
      "history_of_past_illness": "History of Past Illness",
      "examination_general": "Examination General",
      "examination_systemic": "Examination Systemic",
      "examination_local": "Examination Local",
      "treatment_plan": "Treatment Plan",
      "advises": "Advises",
      "extra_notes": "Extra Notes",
      "illness": "Illnesss",
      "icd_standard" :"Icd Standard"
    };

    //  Table validation
    if (!allowedTables[table]) {
      return res.status(400).json({
        success: false,
        message: "Invalid table name"
      });
    }

    //  Input validation
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        message: "Text is required and must be a string"
      });
    }

    //  Step 1: Check if already exists (case insensitive)
    const checkQuery = `SELECT id FROM ${table} WHERE LOWER(text) = LOWER(?) LIMIT 1`;
    pool.query(checkQuery, [text], (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      if (rows.length > 0) {
        return res.status(409).json({  // 409 = Conflict
          success: false,
          message: "This text already exists in " + allowedTables[table],
          data: rows[0]
        });
      }

      //  Step 2: Insert new record safely
      const insertQuery = `INSERT INTO ${table} (text) VALUES (?)`;
      pool.query(insertQuery, [text], (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message
          });
        }

        return res.status(201).json({
          success: true,
          message: `${allowedTables[table]} created successfully`,
          data: { id: result.insertId, text }
        });
      });
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message
    });
  }
};

// Generic Get API for all suggestion tables

const getAllTablesText = async (req, res) => {
  try {
    const { table } = req.query;

    if (!table) {
      return res.status(400).json({
        success: false,
        message: "Table name is required"
      });
    }

    //  Allow only specific tables for security
    const allowedTables = [
      "chief_complaints",
      "history_of_present_illness",
      "history_of_past_illness",
      "examination_general",
      "examination_systemic",
      "examination_local",
      "treatment_plan",
      "advises",
      "extra_notes",
      "illness",
      "icd_standard"
    ];

    if (!allowedTables.includes(table)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table name"
      });
    }

    const query = `SELECT * FROM ${table} ORDER BY text ASC`;

    pool.query(query, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      return res.status(200).json({
        success: true,
        message: `all ${table} data fetched successfully`,
        data: result
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message
    });
  }
};

// Edit API for all suggestion tables

const editAllTableText = (req, res) => {
   const { table } = req.query;  // query se table name
    const { id } = req.params;    // params se id
    const { text } = req.body;    // body se new text

    if (!table || !id || !text) {
      return res.status(400).json({
        success: false,
        message: "Table, id and text are required"
      });
    }

   const allowedTables = {
      "chief_complaints": "Chief Complaints",
      "history_of_present_illness": "History of Present Illness",
      "history_of_past_illness": "History of Past Illness",
      "examination_general": "Examination General",
      "examination_systemic": "Examination Systemic",
      "examination_local": "Examination Local",
      "treatment_plan": "Treatment Plan",
      "advises": "Advises",
      "extra_notes": "Extra Notes",
      "illness": "Illnesss",
      "icd_standard"  :"Icd Standard"
    };

  if (!allowedTables[table]) {
    return res.status(400).json({
      success: false,
      message: "Invalid table name",
    });
  }

  // check duplicate (excluding same record)
  pool.query(
    `SELECT id FROM ${table} WHERE text = ? AND id != ?`,
    [text, id],
    (err, results) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error while checking duplicate",
          error: err.message,
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: `This text already exists in ${allowedTables[table]}`,
          data: { id: results[0].id },
        });
      }

      // update
      pool.query(
        `UPDATE ${table} SET text = ? WHERE id = ?`,
        [text, id],
        (err, result) => {
          if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({
              success: false,
              message: "Database error while updating",
              error: err.message,
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              message: "Record not found",
            });
          }

          return res.status(200).json({
            success: true,
            message: `Text updated successfully in ${allowedTables[table]}`,
            data: { id, text },
          });
        }
      );
    }
  );
};

// Delete API for text

const deleteAllTablesText = async (req, res) => {
  try {
    const { table } = req.query;
    const { id } = req.params;

    if (!table) {
      return res.status(400).json({ success: false, message: "Table name is required" });
    }
    if (!id) {
      return res.status(400).json({ success: false, message: "Idis required" });
    }

    // Allowed tables only
    const allowedTables = {
      "chief_complaints": true,
      "history_of_present_illness": true,
      "history_of_past_illness": true,
      "examination_general": true,
      "examination_systemic": true,
      "examination_local": true,
      "treatment_plan": true,
      "advises": true,
      "extra_notes": true,
      "illness": true,
      "icd_standard" :true

    };

    if (!allowedTables[table]) {
      return res.status(400).json({ success: false, message: "Invalid table name" });
    }

    //  Parameterized query to prevent SQL Injection
    const query = `DELETE FROM ${table} WHERE id = ?`;

    pool.query(query, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database error", error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Record not found" });
      }

      return res.status(200).json({ success: true, message: "Record deleted successfully" });
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
};

const addXrayReport = (req, res) => {
  const {
    title,
    description,
    medical_id 
  } = req.body;

  const attachment = req.file ? req.file.filename : null;

  // 🔍 Step 1: Validate required fields
  if (!title || !medical_id) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: title and medical_id are required.",
    });
  }

  try {
    // 🔍 Step 2: Fetch patient_id using medical_id
    const fetchQuery = `SELECT * FROM patient_all_medicals WHERE id = ?`;

    pool.query(fetchQuery, [medical_id], function (err, result) {
      
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while fetching patient_id",
          error: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No record found with this medical_id.",
        });
      }

      const patient_id = result[0].patient_id;

      // 💾 Step 3: Insert report into xRay_and_radiology
      const insertQuery = `
        INSERT INTO xray_and_radiology 
        (title, description, attachment, medical_id, patient_id)
        VALUES (?, ?, ?, ?, ?)
      `;

      const values = [
        title,
        description || null,
        attachment,
        medical_id,
        patient_id
      ];

      pool.query(insertQuery, values, function (insertErr, insertResult) {
        if (insertErr) {
          return res.status(500).json({
            success: false,
            message: "Failed to add X-ray/radiology report",
            error: insertErr.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "X-ray/radiology report added successfully",
          reportId: insertResult.insertId,
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
}

const updateXrayReport = (req, res) => {
  const { id, title, description } = req.body;
  const attachment = req.file ? req.file.filename : null;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Report id is required",
    });
  }

  try {
    // 🔍 Step 1: Fetch existing record
    const selectQuery = `SELECT * FROM xray_and_radiology WHERE id = ?`;
    pool.query(selectQuery, [id], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while fetching old report",
          error: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No report found with this ID",
        });
      }

      const oldData = result[0];

      // 🔄 Step 2: Keep old value if new one not provided
      const finalTitle = title || oldData.title;
      const finalDescription = description || oldData.description;
      const finalAttachment = attachment || oldData.attachment;

      // 💾 Step 3: Update record
      const updateQuery = `
        UPDATE xray_and_radiology 
        SET title = ?, description = ?, attachment = ?
        WHERE id = ?
      `;
      const values = [finalTitle, finalDescription, finalAttachment, id];

      pool.query(updateQuery, values, (updateErr, updateResult) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Database error while updating report",
            error: updateErr.message,
          });
        }

        return res.json({
          success: true,
          message: "Report updated successfully",
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

const addDiagnosis = (req, res)=> {
  const {
    code,
    diagnosis_text,
    medical_id
  } = req.body;

  if (!diagnosis_text || !medical_id) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: diagnosis_text and medical_id are required.",
    });
  }

  try {
    const fetchQuery = `SELECT * FROM patient_all_medicals WHERE id = ?`;

    pool.query(fetchQuery, [medical_id], function (err, result) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while fetching patient_id",
          error: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No record found with this medical_id.",
        });
      }

      const patient_id = result[0].patient_id;

      const insertQuery = `
        INSERT INTO diagnosis (medical_id, patient_id, code ,diagnosis_text)
        VALUES (?,?, ?, ?)
      `;

      const values = [medical_id, patient_id, code , diagnosis_text];

      pool.query(insertQuery, values, function (insertErr, insertResult) {
        if (insertErr) {
          return res.status(500).json({
            success: false,
            message: "Failed to add diagnosis",
            error: insertErr.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Diagnosis added successfully",
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: error.message,
    });
  }
}

const updateDiagnosis = async (req, res) => {
  try {
    const { id, diagnosis_text, code } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis ID is required",
      });
    }

    // Step 1: Fetch existing record
    const getQuery = `SELECT * FROM diagnosis WHERE id = ?`;
    pool.query(getQuery, [id], (err, results) => {
      if (err) {
        console.error("Error fetching diagnosis:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Diagnosis not found" });
      }

      const existing = results[0];

      // Step 2: Prepare updated values (if new value comes → update, else keep old one)
      const updatedDiagnosisText = diagnosis_text || existing.diagnosis_text;
      const updatedCode = code || existing.code;

      // Step 3: Update record
      const updateQuery = `
        UPDATE diagnosis 
        SET diagnosis_text = ?, code = ?
        WHERE id = ?
      `;

      pool.query(updateQuery, [updatedDiagnosisText, updatedCode, id], (err, updateResult) => {
        if (err) {
          console.error("Error updating diagnosis:", err);
          return res.status(500).json({ success: false, message: "Database update error" });
        }

        return res.status(200).json({
          success: true,
          message: "Diagnosis updated successfully",
          data: {
            id,
            diagnosis_text: updatedDiagnosisText,
            code: updatedCode,
          },
        });
      });
    });
  } catch (error) {
    console.error("Error in updateDiagnosis:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// const addPrescription = (req, res) => {
//   const { medical_id, prescriptions } = req.body;

//   if (!medical_id || !Array.isArray(prescriptions) || prescriptions.length === 0) {
//     return res.status(400).json({
//       success: false,
//       message: "medical_id and prescriptions array are required.",
//     });
//   }

//   try {
//     const fetchQuery = `SELECT patient_id FROM patient_all_medicals WHERE id = ?`;

//     pool.query(fetchQuery, [medical_id], function (err, result) {
//       if (err) {
//         return res.status(500).json({
//           success: false,
//           message: "Database error while fetching patient_id",
//           error: err.message,
//         });
//       }

//       if (result.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: "No record found with this medical_id.",
//         });
//       }

//       const patient_id = result[0].patient_id;

//       // prescriptions array ko format karo
//       const values = prescriptions.map((p) => [
//         medical_id,
//         patient_id,
//         p.medicine_name,
//         p.dose,
//         p.frequency,
//         p.duration,
//         p.notes || null, // agar notes null ho sakta hai
//       ]);

//       const insertQuery = `
//         INSERT INTO prescriptions 
//         (medical_id, patient_id, medicine_name, dose, frequency, duration, notes)
//         VALUES ?
//       `;

//       pool.query(insertQuery, [values], function (insertErr, insertResult) {
//         if (insertErr) {
//           return res.status(500).json({
//             success: false,
//             message: "Failed to add prescriptions",
//             error: insertErr.message,
//           });
//         }

//         return res.status(201).json({
//           success: true,
//           message: "Prescriptions added successfully",
//           inserted_count: insertResult.affectedRows,
//         });
//       });
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Unexpected server error",
//       error: error.message,
//     });
//   }
// };

const addPrescription = (req, res) => {
  const { medical_id, 
    // doctor_id, 
    prescriptions } = req.body;
  if (!medical_id  || !Array.isArray(prescriptions) || prescriptions.length === 0) {
    return res.status(400).json({
      success: false,
      message: "medical_id and prescriptions array are required.",
    });
  }

  try {
    // Step 1: Get patient_id using medical_id
    const fetchQuery = `SELECT patient_id FROM patient_all_medicals WHERE id = ?`;

    pool.query(fetchQuery, [medical_id], function (err, result) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while fetching patient_id",
          error: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No record found with this medical_id.",
        });
      }

      const patient_id = result[0].patient_id;

      // Step 2: Insert into prescription_groups
      const groupQuery = `
        INSERT INTO prescription_groups (patient_id, medical_id)
        VALUES (?, ?)
      `;

      pool.query(groupQuery, [patient_id, medical_id], function (groupErr, groupResult) {
        if (groupErr) {
          return res.status(500).json({
            success: false,
            message: "Failed to create prescription group",
            error: groupErr.message,
          });
        }

        const prescription_group_id = groupResult.insertId;

        // Step 3: Prepare prescriptions array with new DB fields
        const values = prescriptions.map((p) => [
          prescription_group_id,
          medical_id,
          patient_id,
          p.medicine_name,
          p.strength || null,
          p.frequency || null,
          p.dose || null,
          p.duration || null,
          p.route || null,
          p.substance || null,
          p.notes || null,
        ]);

        const insertQuery = `
          INSERT INTO prescriptions 
          (prescription_group_id, medical_id, patient_id, medicine_name, strength, frequency, dose, duration, route, substance, notes)
          VALUES ?
        `;

        pool.query(insertQuery, [values], function (insertErr, insertResult) {
          if (insertErr) {
            return res.status(500).json({
              success: false,
              message: "Failed to add prescriptions",
              error: insertErr.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Prescriptions added successfully",
            group_id: prescription_group_id,
            inserted_count: insertResult.affectedRows,
          });
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: error.message,
    });
  }
};

const getAllPrescriptions = async (req, res) => {
  try {
    const fetchPrescriptions = () => {
      return new Promise((resolve, reject) => {
        const query = `
          SELECT 
            prescriptions.*, 
            TRIM(CONCAT(
  patients.firstName, ' ',
  IF(patients.middleName IS NOT NULL AND patients.middleName != '', CONCAT(patients.middleName, ' '), ''),
  patients.lastName
)) AS fullName
          FROM prescriptions
          JOIN patients ON prescriptions.patient_id = patients.id
        `;

        pool.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const prescriptions = await fetchPrescriptions();

    if (!prescriptions.length) {
      return res.status(404).json({
        success: false,
        message: "No prescriptions found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Prescriptions fetched successfully",
      data: prescriptions,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving prescriptions",
      error: error.message,
    });
  }
};

const updatePrescription = (req, res) => {
  const { id } = req.params; // prescription id
  const {
    medicine_name,
    strength,
    frequency,
    dose,
    duration,
    route,
    substance,
    notes
  } = req.body;

  // ✅ First get existing record
  const selectQuery = "SELECT * FROM prescriptions WHERE id = ?";
  pool.query(selectQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    const existing = results[0];

    // ✅ Take new if provided, else keep old
    const updatedData = {
      medicine_name: medicine_name || existing.medicine_name,
      strength: strength || existing.strength,
      frequency: frequency || existing.frequency,
      dose: dose || existing.dose,
      duration: duration || existing.duration,
      route: route || existing.route,
      substance: substance || existing.substance,
      notes: notes || existing.notes
    };

    const updateQuery = `
      UPDATE prescriptions 
      SET medicine_name=?, strength=?, frequency=?, dose=?, duration=?, route=?, substance=?, notes=?, updated_at=NOW()
      WHERE id=?`;

    pool.query(updateQuery, [
      updatedData.medicine_name,
      updatedData.strength,
      updatedData.frequency,
      updatedData.dose,
      updatedData.duration,
      updatedData.route,
      updatedData.substance,
      updatedData.notes,
      id
    ], (err2, result) => {
      if (err2) {
        return res.status(500).json({ success: false, message: "Update failed", error: err2 });
      }
      res.json({ success: true, message: "Prescription updated successfully" });
    });
  });
};


const getPrescriptionById = async (req, res) => {
  try {
    const prescriptionId = req.params.prescriptionId;

    const sql = `
      SELECT 
        id,
        prescription_group_id,
        medical_id,
        patient_id,
        medicine_name,
        strength,
        frequency,
        dose,
        duration,
        route,
        substance,
        notes,
        created_at
      FROM prescriptions
      WHERE prescription_group_id = ?
    `;

    pool.query(sql, [prescriptionId], (err, results) => {
      console.log(results);
      
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Prescription fetched successfully",
        data: results
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const addChronicIllness = async (req, res) => {
  const { medical_id, illness_text } = req.body;

  if (!medical_id || !illness_text) {
    return res.status(400).json({
      success: false,
      message: "medical_id and illness_text are required",
    });
  }

  const getPatientQuery = `SELECT patient_id FROM patient_all_medicals WHERE id = ?`;

  pool.query(getPatientQuery, [medical_id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Medical record not found" });
    }

    const patient_id = result[0].patient_id;

    const insertQuery = `
      INSERT INTO chronic_illness (medical_id, patient_id, illness_text)
      VALUES (?, ?, ?)
    `;

    pool.query(insertQuery, [medical_id, patient_id, illness_text], (insertErr, insertResult) => {
      if (insertErr) {
        return res.status(500).json({ success: false, message: "Failed to add chronic illness", error: insertErr.message });
      }

      return res.status(201).json({
        success: true,
        message: "Chronic illness added successfully",
        chronicId: insertResult.insertId,
      });
    });
  });
};

const updateChronicIllness = async (req, res) => {
  try {
    const { id, illness_text } = req.body;

    if (!id || !illness_text) {
      return res.status(400).json({
        success: false,
        message: "id and illness_text are required",
      });
    }

    // Check if record exists
    const checkSql = `SELECT * FROM chronic_illness WHERE id = ?`;
    pool.query(checkSql, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Chronic illness record not found",
        });
      }

      // Update record
      const sql = `UPDATE chronic_illness SET illness_text = ? WHERE id = ?`;
      pool.query(sql, [illness_text, id], (err2) => {
        if (err2) {
          return res.status(500).json({ success: false, error: err2.message });
        }
        res.json({
          success: true,
          message: "Chronic illness updated successfully",
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


const addPatientAllergy = async (req, res) => {
  const { medical_id, name, type } = req.body;

  if (!medical_id || !name || !type) {
    return res.status(400).json({
      success: false,
      message: "medical_id, name and type are required",
    });
  }

  try {
    const getPatientQuery = `SELECT patient_id FROM patient_all_medicals WHERE id = ?`;

    pool.query(getPatientQuery, [medical_id], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Medical record not found",
        });
      }

      const patient_id = result[0].patient_id;

      const insertQuery = `
        INSERT INTO patient_allergies (medical_id, patient_id, allergy_name, allergy_type)
        VALUES (?, ?, ?, ?)
      `;

      pool.query(insertQuery, [medical_id, patient_id, name, type], (insertErr, insertResult) => {
        if (insertErr) {
          return res.status(500).json({
            success: false,
            message: "Failed to add allergy",
            error: insertErr.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Allergy added successfully",
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: error.message,
    });
  }
};

const updatePatientAllergy = async (req, res) => {
  try {
    const { id, allergy_name, allergy_type } = req.body;

    if (!id || !allergy_name || !allergy_type) {
      return res.status(400).json({
        success: false,
        message: "id, allergy_name and allergy_type are required",
      });
    }

    // Check if record exists
    const checkSql = `SELECT * FROM patient_allergies WHERE id = ?`;
    pool.query(checkSql, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Allergy record not found",
        });
      }

      // Update record
      const sql = `UPDATE patient_allergies SET allergy_name = ?, allergy_type = ? WHERE id = ?`;
      pool.query(sql, [allergy_name, allergy_type, id], (err2) => {
        if (err2) {
          return res.status(500).json({ success: false, error: err2.message });
        }
        res.json({
          success: true,
          message: "Patient allergy updated successfully",
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// 🗑 Delete Xray Report
const deleteXrayReport = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM xray_and_radiology WHERE id = ?";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Xray Report not found" });
    }
    res.status(200).json({ success: true, message: "Xray Report deleted successfully" });
  });
};


// 🗑 Delete Diagnosis
const deleteDiagnosis = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM diagnosis WHERE id = ?";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Diagnosis not found" });
    }
    res.status(200).json({ success: true, message: "Diagnosis deleted successfully" });
  });
};


// 🗑 Delete Prescription
const deletePrescription = (req, res) => {
  const { id } = req.params;

  // pehle prescriptions delete
  const deletePrescriptionsQuery = "DELETE FROM prescriptions WHERE prescription_group_id = ?";
  // phir group delete
  const deleteGroupQuery = "DELETE FROM prescription_groups WHERE id = ?";

  pool.query(deletePrescriptionsQuery, [id], (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error deleting prescriptions",
        error: err,
      });
    }

    pool.query(deleteGroupQuery, [id], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error deleting prescription group",
          error: err,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Prescription group not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Prescription group and its prescriptions deleted successfully",
      });
    });
  });
};



// 🗑 Delete Chronic Illness
const deleteChronicIllness = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM chronic_illness WHERE id = ?";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Chronic Illness not found" });
    }
    res.status(200).json({ success: true, message: "Chronic Illness deleted successfully" });
  });
};


// 🗑 Delete Patient Allergy
const deletePatientAllergy = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM patient_allergies WHERE id = ?";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Patient Allergy not found" });
    }
    res.status(200).json({ success: true, message: "Patient Allergy deleted successfully" });
  });
};


// INSURANCE Section

// Add insurance 
const addInsurance = async (req, res) => {
  const { date, company, patient_id, services, amount } = req.body;

  //  Basic validation
  if (!date || !company || !patient_id || !services || !amount) {
    return res.status(400).json({
      success: false,
      message: "date, company, patient_id, services, and amount are required",
    });
  }

  try {
    //  Optional check: Prevent duplicate insurance entry for same patient + service + date
    const checkQuery = `SELECT * FROM insurance WHERE patient_id = ? AND services = ? AND date = ?`;
    pool.query(checkQuery, [patient_id, services, date], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({
          success: false,
          message: "DB error",
          error: checkErr.message,
        });
      }

      if (checkResult.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Insurance record already exists for this patient, service, and date",
        });
      }

      //  Generate claim number
      const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random
      const claim_no = `CLM-${randomPart}`;

      //  Insert insurance record (status auto = Pending)
      const insertQuery = `
        INSERT INTO insurance (date, company, patient_id, services, amount, claim_no)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      pool.query(
        insertQuery,
        [date, company, patient_id, services, amount, claim_no],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Insert error",
              error: err.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Insurance added successfully",
            insuranceId: result.insertId,
            claim_no
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

// Get Insurance 
const getInsurance = async (req, res) => {
  const { patient_id } = req.query; // optional filter

  try {
    let query = `
      SELECT 
        i.*,
        CONCAT_WS(' ', p.firstName, p.middleName, p.lastName) AS patient_name
      FROM insurance i
      JOIN patients p ON i.patient_id = p.id
    `;
    let values = [];

    if (patient_id) {
      query += ` WHERE i.patient_id = ?`;
      values.push(patient_id);
    }

    pool.query(query, values, (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "DB error",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No insurance records found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Insurance records fetched successfully",
        data: results,
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

// Update Insurance
const updateInsurance = (req, res) => {
  const { id } = req.params;
  const { date, company, services, amount } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Insurance ID is required",
    });
  }

  // Step 1: Fetch the existing record
  const fetchQuery = `SELECT * FROM insurance WHERE id = ?`;
  pool.query(fetchQuery, [id], (err, existingData) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Fetch error",
        error: err.message,
      });
    }

    if (existingData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Insurance record not found",
      });
    }

    // Step 2: Use new values if provided, else keep old values
    const updatedDate = date || existingData[0].date;
    const updatedCompany = company || existingData[0].company;
    const updatedServices = services || existingData[0].services;
    const updatedAmount = amount || existingData[0].amount;

    // Step 3: Update the record
    const updateQuery = `
      UPDATE insurance 
      SET 
        date = ?, 
        company = ?, 
        services = ?, 
        amount = ?, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    pool.query(
      updateQuery,
      [updatedDate, updatedCompany, updatedServices, updatedAmount, id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Update failed",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Insurance details updated successfully",
        });
      }
    );
  });
};

// Delete insurance
const deleteInsurance = async (req, res) => {
  const { id } = req.params; // insurance id from URL

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Insurance ID is required",
    });
  }

  try {
    const deleteQuery = `DELETE FROM insurance WHERE id = ?`;

    pool.query(deleteQuery, [id], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "DB error",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Insurance record not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Insurance record deleted successfully",
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

// Update insurance status
const updateInsuranceStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || !status) {
    return res.status(400).json({
      success: false,
      message: "Insurance ID and status are required",
    });
  }

  const validStatuses = ["Not Sent","Sent"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Must be Pending, Approved, or Rejected",
    });
  }

  try {
    const updateQuery = `
      UPDATE insurance 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    pool.query(updateQuery, [status, id], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "DB error",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Insurance record not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: `Insurance status updated to ${status}`,
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

const createInvoice = (req, res) => {
  const { patientId, services = [], pharmacy = [] } = req.body;

  if (!patientId) {
    return res.status(400).json({ success: false, message: "patientId is required" });
  }

  if (!Array.isArray(services) || !Array.isArray(pharmacy)) {
    return res.status(400).json({ success: false, message: "services and pharmacy must be arrays" });
  }

  if (services.length === 0 && pharmacy.length === 0) {
    return res.status(400).json({ success: false, message: "At least one service or pharmacy item must be provided" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ success: false, message: "DB connection error", error: err.message });
    }

    connection.beginTransaction(transactionErr => {
      if (transactionErr) {
        connection.release();
        return res.status(500).json({ success: false, message: "Transaction error", error: transactionErr.message });
      }

      // ---- Step 1: Fetch services safely ----
      const fetchServices = (callback) => {
        if (services.length === 0) return callback(null, []);
        connection.query(
          `SELECT id, net_amount AS amount FROM patient_services WHERE id IN (?)`,
          [services],
          callback
        );
      };

      // ---- Step 2: Fetch pharmacy safely ----
      const fetchPharmacy = (callback) => {
        if (pharmacy.length === 0) return callback(null, []);
        connection.query(
          `SELECT id, price AS amount FROM patient_pharmacy WHERE id IN (?)`,
          [pharmacy],
          callback
        );
      };

      // Run both queries
      fetchServices((serviceErr, serviceResults) => {
        if (serviceErr) return rollbackAndRelease(connection, res, serviceErr);

        fetchPharmacy((pharmacyErr, pharmacyResults) => {
          if (pharmacyErr) return rollbackAndRelease(connection, res, pharmacyErr);

          const total_services = serviceResults.length + pharmacyResults.length;

          if (total_services === 0) {
            connection.release();
            return res.status(400).json({
              success: false,
              message: "No services or pharmacy items found.",
            });
          }

          const total_amount =
            serviceResults.reduce((sum, item) => sum + (item.amount || 0), 0) +
            pharmacyResults.reduce((sum, item) => sum + (item.amount || 0), 0);

          const paid_amount = 0;
          const remaining_amount = total_amount - paid_amount;
const invoice_no = "INV-" + Date.now().toString().slice(-6);
          const status = remaining_amount > 0 ? "Remaining" : "Complete";
          const invoice_status = "Not Paid";

          // ---- Step 3: Insert into patient_invoices ----
          const insertInvoiceQuery = `
            INSERT INTO patient_invoices 
              (patient_id, invoice_date, invoice_no, total_services, total_amount, paid_amount, remaining_amount, status, invoice_status, updated_at)
            VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, NOW())
          `;

          connection.query(
            insertInvoiceQuery,
            [
              patientId,
              invoice_no,
              total_services,
              total_amount,
              paid_amount,
              remaining_amount,
              status,
              invoice_status,
            ],
            (insertErr, insertResult) => {
              if (insertErr) {
                return rollbackAndRelease(connection, res, insertErr);
              }

              const invoiceId = insertResult.insertId;

              // ---- Step 4: Update statuses ----
              const serviceIds = serviceResults.map((item) => item.id);
              const pharmacyIds = pharmacyResults.map((item) => item.id);

              const updateServiceStatus = (callback) => {
                if (serviceIds.length === 0) return callback();
                connection.query(
                  `UPDATE patient_services SET billing_status = 'Billed' WHERE id IN (?)`,
                  [serviceIds],
                  (err) => callback(err)
                );
              };

              const updatePharmacyStatus = (callback) => {
                if (pharmacyIds.length === 0) return callback();
                connection.query(
                  `UPDATE patient_pharmacy SET billing_status = 'Billed' WHERE id IN (?)`,
                  [pharmacyIds],
                  (err) => callback(err)
                );
              };

              // ---- Step 5: Commit transaction ----
              updateServiceStatus((serviceUpdateErr) => {
                if (serviceUpdateErr) return rollbackAndRelease(connection, res, serviceUpdateErr);

                updatePharmacyStatus((pharmacyUpdateErr) => {
                  if (pharmacyUpdateErr) return rollbackAndRelease(connection, res, pharmacyUpdateErr);

                  connection.commit((commitErr) => {
                    connection.release();
                    if (commitErr) {
                      return res.status(500).json({
                        success: false,
                        message: "Commit error",
                        error: commitErr.message,
                      });
                    }

                    return res.status(201).json({
                      success: true,
                      message: "Invoice created and billing status updated successfully",
                      data : {
                        invoiceId,
                      invoice_no,
                      patientId,
                      total_services,
                      total_amount,
                      paid_amount,
                      remaining_amount,
                      status,
                      invoice_status,
                      }
                    });
                  });
                });
              });
            }
          );
        });
      });
    });
  });
};

function rollbackAndRelease(connection, res, error) {
  console.log("SQL Error:", error); // ✅ debugging log
  connection.rollback(() => {
    connection.release();
    res.status(500).json({ success: false, message: "Transaction failed", error: error.message });
  });
}

const getAllInvoicesByPatient = (req,res)=>{
  try {
    const patientId = req.params.patientId
    if(!patientId){
      return res.status(400).json({
        success : false,
        message : "Patient id is requied"
      })
    }

    const selectQuery = `Select * from patient_invoices where patient_id = ?`
    pool.query(selectQuery,[patientId],(error,result)=>{
      if(error){
        return res.status(500).json({
          success :  false,
          message: "Error while fetching patient invoices",
          error : error.message
        })
      }
      if(result.length===0){
      return res.status(400).json({
          success :  false,
          message: "Invoices for this patient are empty",
        })
      }
      return res.status(200).json({
        success : true,
        message : "Patient invoice fetched successfully",
        data : result
      })
    })

  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
 
  }
}

const getRemainingInvoices = (req, res) => {
  const { patientId } = req.params;

  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: "patientId is required",
    });
  }

  const sql = `
    SELECT 
      id AS invoiceId,
      invoice_no,
      invoice_date,
      total_services,
      total_amount,
      paid_amount,
      remaining_amount,
      status,
      invoice_status,
      updated_at
    FROM patient_invoices
    WHERE patient_id = ? AND status = 'Remaining'
    ORDER BY invoice_date DESC
  `;

  pool.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "DB error",
        error: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      invoices: results,
    });
  });
};

const addPaymentInvoice = (req, res) => {
  const { invoice_id, amount, payment_method } = req.body;

  // Basic validation
  if (!invoice_id || !amount || !payment_method) {
    return res.status(400).json({
      success: false,
      message: "invoice_id, amount, and payment_method are required",
    });
  }

  // Amount validation
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be a positive number greater than 0",
    });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "DB connection error", error: err });
    }

    connection.beginTransaction(async (err) => {
      if (err) {
        connection.release();
        return res.status(500).json({
          success: false,
          message: "Transaction start failed",
          error: err,
        });
      }

      try {
        // Step 1: Get invoice
        const [invoice] = await new Promise((resolve, reject) => {
          connection.query(
            "SELECT id, patient_id,invoice_no, total_amount, paid_amount, remaining_amount, status, invoice_status FROM patient_invoices WHERE id = ?",
            [invoice_id],
            (err, results) => (err ? reject(err) : resolve(results))
          );
        });

        if (!invoice) {
          connection.release();
          return res
            .status(404)
            .json({ success: false, message: "Invoice not found" });
        }

        // Validation: Invoice already cleared
        if (invoice.remaining_amount <= 0) {
          connection.release();
          return res.status(400).json({
            success: false,
            message: "Invoice already fully paid",
          });
        }

        // Validation: Amount > Remaining
        if (amount > invoice.remaining_amount) {
          connection.release();
          return res.status(400).json({
            success: false,
            message: `Payment exceeds remaining amount. Remaining: ${invoice.remaining_amount}`,
          });
        }

        const transactionId = String(
          Math.floor(1000000000 + Math.random() * 9000000000)
        );

        // Step 2: Insert into payments
        await new Promise((resolve, reject) => {
          connection.query(
            "INSERT INTO patient_payment_invoices (patient_id,invoice_id, payment_amount, payment_method, transactionId) VALUES (?,?, ?, ?, ?)",
            [invoice.patient_id,invoice.id, amount, payment_method, transactionId],
            (err, result) => (err ? reject(err) : resolve(result))
          );
        });

        // Step 3: Update invoice (paid + remaining + status)
        const newPaid = invoice.paid_amount + amount;
        const newRemaining = invoice.remaining_amount - amount;

        let newStatus = "Remaining";
        let newInvoiceStatus = "Partially Paid";

        if (newRemaining === 0) {
          newStatus = "Completed";
          newInvoiceStatus = "Fully Paid";
        } else if (newPaid === 0) {
          newInvoiceStatus = "Not Paid";
        }

        await new Promise((resolve, reject) => {
          connection.query(
            "UPDATE patient_invoices SET paid_amount = ?, remaining_amount = ?, status = ?, invoice_status = ? WHERE id = ?",
            [newPaid, newRemaining, newStatus, newInvoiceStatus, invoice_id],
            (err, result) => (err ? reject(err) : resolve(result))
          );
        });

        // Commit
        connection.commit((err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({
                success: false,
                message: "Commit failed",
                error: err,
              });
            });
          }

          connection.release();
          return res.status(200).json({
            success: true,
            message: "Payment added successfully",
            data: {
              invoice_id,
              newPaid,
              newRemaining,
              status: newStatus,
              invoice_status: newInvoiceStatus,
            },
          });
        });
      } catch (error) {
        connection.rollback(() => {
          connection.release();
          return res.status(500).json({
            success: false,
            message: "Transaction failed",
            error: error.message,
          });
        });
      }
    });
  });
};

const getPaymentsByPatient = (req, res) => {
  const { patient_id } = req.params;

  if (!patient_id) {
    return res.status(400).json({
      success: false,
      message: "patient_id is required",
    });
  }

  const sql = `
    SELECT 
      ppi.id AS payment_id,
      ppi.invoice_id as invoice_id,
      pi.invoice_no,
      ppi.payment_amount,
      ppi.payment_method,
      ppi.transactionId,
      ppi.payment_date
    FROM patient_payment_invoices ppi
    INNER JOIN patient_invoices pi ON ppi.invoice_id = pi.id
    WHERE ppi.patient_id = ?
    ORDER BY ppi.payment_date DESC
  `;

  pool.query(sql, [patient_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "DB error",
        error: err,
      });
    }

    return res.status(200).json({
      success: true,
      message: results.length > 0 ? "Payments fetched successfully" : "No payments found",
      data: results,
    });
  });
};


const getPatientPaymentSummary = (req, res) => {
  const { patient_id } = req.params;

  if (!patient_id) {
    return res.status(400).json({
      success: false,
      message: "patient_id is required"
    });
  }

  // 🔹 Query invoices + patient name
  const sql = `
    SELECT pi.total_amount, pi.remaining_amount, pi.paid_amount, pi.updated_at,
           p.firstName, p.middleName, p.lastName
    FROM patient_invoices pi
    JOIN patients p ON pi.patient_id = p.id
    WHERE pi.patient_id = ?
  `;

  pool.query(sql, [patient_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: "No invoices found for this patient",
        data: []
      });
    }

    // 🔹 Calculation in Node.js
    let total_billed = 0;
    let pending_balance = 0;
    let total_payments = 0;
    let last_payment_date = null;

    results.forEach(row => {
      total_billed += row.total_amount || 0;
      pending_balance += row.remaining_amount || 0;
      total_payments += row.paid_amount || 0;

      if (!last_payment_date || new Date(row.updated_at) > new Date(last_payment_date)) {
        last_payment_date = row.updated_at;
      }
    });

    const total_invoices = results.length;
    const nameParts = [
    results[0].firstName || "",
    results[0].middleName || "",
    results[0].lastName || ""
    ];

    const patient_name = nameParts.filter(Boolean).join(" ");

    return res.status(200).json({
      success: true,
      message: "Patient payment summary fetched successfully",
      data: {
        patient_name,
        total_invoices,
        total_billed,
        pending_balance,
        total_payments,
        last_payment_date
      }
    });
  });
};

//  Get All Invoices
const getAllInvoices = (req, res) => {
  const sql = `
    SELECT pi.*, p.firstName, p.middleName, p.lastName
    FROM patient_invoices pi
    LEFT JOIN patients p ON pi.patient_id = p.id
    ORDER BY pi.updated_at DESC
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database query failed",
        error: err.message,
      });
    }

    // 🔹 Format data with patient_name
    const formattedResults = results.map(row => {
      const nameParts = [
        row.firstName || "",
        row.middleName || "",
        row.lastName || ""
      ];
      const patient_name = nameParts.filter(Boolean).join(" ");
      const { firstName, middleName, lastName, ...rest } = row;

      return {
        ...rest,
        patient_name
      };
    });

    return res.status(200).json({
      success: true,
      message: formattedResults.length > 0
        ? "All invoices fetched successfully"
        : "No invoices found",
      data: formattedResults,
    });
  });
};


//  Get All Payments
const getAllPayments = (req, res) => {
  const sql = `
    SELECT ppi.*, 
           pi.invoice_no, 
           pt.firstName, pt.middleName, pt.lastName
    FROM patient_payment_invoices ppi
    LEFT JOIN patient_invoices pi ON ppi.invoice_id = pi.id
    LEFT JOIN patients pt ON pi.patient_id = pt.id
    ORDER BY ppi.updated_at DESC
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database query failed",
        error: err.message,
      });
    }

    // 🔹 Format results
    const formattedResults = results.map(row => {
      const nameParts = [
        row.firstName || "",
        row.middleName || "",
        row.lastName || ""
      ];
      const patient_name = nameParts.filter(Boolean).join(" ");

      // remove raw name fields
      const { firstName, middleName, lastName, ...rest } = row;

      return {
        ...rest,
        patient_name,
        invoice_no: row.invoice_no || null
      };
    });

    return res.status(200).json({
      success: true,
      message: formattedResults.length > 0 
        ? "All payments fetched successfully"
        : "No payments found",
      data: formattedResults,
    });
  });
};

function createPaymentMethod(req, res) {
  const { name } = req.body;

  // Validation
  if (!name || name.trim() === "") {
    return res.status(400).json({ success: false, message: "Name is required" });
  }
  if (name.length > 50) {
    return res.status(400).json({ success: false, message: "Name too long (max 50 chars)" });
  }
 
  // Check if already exists
  const checkSql = "SELECT id FROM payment_methods WHERE name = ?";
  pool.query(checkSql, [name], function (err, results) {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err.message });
    }
    if (results.length > 0) {
      return res.status(409).json({ success: false, message: "Payment method already exists" });
    }

    // Insert if not exists
    const insertSql = "INSERT INTO payment_methods (name) VALUES (?)";
    pool.query(insertSql, [name], function (err, result) {
      if (err) {
        return res.status(500).json({ success: false, message: "DB error", error: err.message });
      }
      return res.status(201).json({ success: true, message: "Payment method created", id: result.insertId });
    });
  });
}

//  Get all payment methods
function getAllPaymentMethods(req, res) {
  const sql = "SELECT * FROM payment_methods ORDER BY updated_at DESC";
  pool.query(sql, function (err, results) {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err.message });
    }
    return res.status(200).json({ success: true, data: results });
  });
}

//  Get by ID
function getPaymentMethodById(req, res) {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Valid ID required" });
  }

  const sql = "SELECT * FROM payment_methods WHERE id = ?";
  pool.query(sql, [id], function (err, results) {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    return res.status(200).json({ success: true, data: results[0] });
  });
}

//  Update method
function updatePaymentMethod(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Valid ID required" });
  }
  if (!name || name.trim() === "") {
    return res.status(400).json({ success: false, message: "Name is required" });
  }

  // Prevent duplicates
  const checkSql = "SELECT id FROM payment_methods WHERE name = ? AND id != ?";
  pool.query(checkSql, [name, id], function (err, results) {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err.message });
    }
    if (results.length > 0) {
      return res.status(409).json({ success: false, message: "Payment method with this name already exists" });
    }

    const sql = "UPDATE payment_methods SET name = ? WHERE id = ?";
    pool.query(sql, [name, id], function (err, result) {
      if (err) {
        return res.status(500).json({ success: false, message: "DB error", error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Not found" });
      }
      return res.status(200).json({ success: true, message: "Payment method updated" });
    });
  });
}

//  Delete method
function deletePaymentMethod(req, res) {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Valid ID required" });
  }

  const sql = "DELETE FROM payment_methods WHERE id = ?";
  pool.query(sql, [id], function (err, result) {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    return res.status(200).json({ success: true, message: "Payment method deleted" });
  });
}

export default {
  
  // users apis 
  getAllUsers,
  changeUserStatus,
  deleteUserById,
  getAllStaff,
  getAllNurses,
  getAllDoctors,
  changeDoctorStatus,
  getActiveDoctors,
  changeUserStatus,
  softDeleteUser,
  deleteDoctor,

  // patient apis
  registerPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,

  // Patient service apis
  AddPatientServices,
  GetPatientServices,
  UpdatePatientServices,
  DeletePatientService,
  getPatientServicesByPatientId,
  addPatientPharmacy,
  getPharmacyByPatientId,
  updatePatientPharmacy,
  deletePatientPharmacy,
  getPatientPharmacyByPatientId,
  updatePatientServicesStatus,
  updatePatientPharmacyStatus,
  // appointment apis
  createAppointment,
  getAllAppointments,
  editAppointment,
  getUpcomingAppointment,
  getWaitingAppointments,
  getConfirmedAppointments,
  deleteAppointments,
  
  
  getAllNationalities,
  doctorAvailability,
  
  // more appointment apis 
  getAppointmentsByDoctorId,
  appointmentByDoctorId,
  getAppointmentsByDate,
  appointmentByPatientId,
  editAppointmentByPatientId,
  bookingAppointment,
  changeAppointmentStatus,
  cancelAppointmentStatus,

  // patient vitals apis
  recordPatientVitals,
  getPatientVitalsByPatientId,
  updatePatientVitals,
  deletePatientVital,
  recordPatientDiagnosis,

  getDiagnosisByPatientId,
  addRxMedicine,
  
  // icd 10 apis
  addICD10,
  getAllIcd10List,
  getAllRxList,
  getRxById,
  deleteRxMedicine,

  // categories apis
  addCategories,
  getAllCategories,
  updateCategory,
  deleteCategory,

  // drug apis
  addDrug,
  getDrugs,
  getDrugById,
  updateDrug,
  deleteDrug,

  // service apis
  addServices,
  getServices,
  updateService,
  deleteService,

  // lab service apis
  addLabService,
  getAllLabServices,
  editLabServices,
  deleteLabService,
  getNationalitiesList,
  getDiagnosisList,

  // labs apis
  addLabs,
  getAllActiveLabs,
  getAllLabs,
  getLabById,
  updateLabById,
  deleteLabById,
  changeLabStatus,

  // Lab request apis
  addLabRequest ,
  getLabRequestsByPatient,
  updateLabRequestStatus,
  getLabRequestsByStatus,
  getLabRequestById,
  deleteLabRequest,
  editLabRequest,
  addLabRequestAttachment,
  updateLabRequestAttachment,
  getLabRequestAttachmentsByLabRequestId,
  deleteLabRequestAttachment,

  // service category apis
  serviceCategory,
  getAllServiceCategories,
  updateServiceCategory,
  deleteServiceCategory,

  // allergy apis
  createAllergy,
  getAllAllergies,
  updateAllergy,
  deleteAllergy,

  // complainst apis
  addComplaint,
  getAllComplaints,
  updateComplaintById,
  deleteComplaintById,
  searchComplaints,

  // speciality apis
  addSpeciality,
  getAllSpecialities,
  updateSpecialityById,
  deleteSpecialityById,

  // Medical history all apis
  addPatientMedicals ,
  getMedicalDataWithVitals,
  getAllMedicalDataByPatient,
  getMedicalRecordsByDate,
  getAllMedicalData,
  updateSingleMedicalField,
  searchMedicalField,
  searchICD10,

  //  all texts apis
  createAllTableText,
  getAllTablesText,
  editAllTableText,
  deleteAllTablesText,

  // Medical history all table sections
  addXrayReport,
  updateXrayReport,
  addDiagnosis,
  updateDiagnosis,
  addPrescription,
  getAllPrescriptions,
  updatePrescription,
  getPrescriptionById,
  addChronicIllness,
  updateChronicIllness,
  addPatientAllergy,
  updatePatientAllergy,
  deleteXrayReport,
  deleteDiagnosis,
  deletePrescription,
  deleteChronicIllness,
  deletePatientAllergy, 

  // Insurance section
  addInsurance,
  getInsurance,
  updateInsurance,
  deleteInsurance,
  updateInsuranceStatus,

  createInvoice,
  getAllInvoicesByPatient,
  getRemainingInvoices,
  addPaymentInvoice,
  getPaymentsByPatient,
  getPatientPaymentSummary,
  getAllInvoices,
  getAllPayments,

  createPaymentMethod,
  getAllPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod
};

