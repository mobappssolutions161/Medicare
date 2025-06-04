import pool from "../config/db.js";
import bcrypt from "bcrypt";

const generateNextFileNumber = (lastFileNumber) => {
      if (!lastFileNumber) return "P00001";
      const number = parseInt(lastFileNumber.slice(1)) + 1;
      return `P${number.toString().padStart(5, "0")}`;
    };

const getAllUsers = async (req, res) => {
  try {
    const allUser = 'Select * from users where role != "admin" AND is_active = 1  and is_deleted = 0';

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

const getActiveDoctors = async (req, res) => {
  const query = 'SELECT * FROM users WHERE is_active = 1 AND is_deleted = 0 AND role = "doctor"';

  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching active doctors',
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active doctors found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Active doctors retrieved successfully',
      data: results
    });
  });
};

const changeUserStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }
  const { status } = req.body;
  console.log(typeof status)
  if (status !== 1 && status !== 0) {
    return res.status(400).json({ success: false, message: 'Invalid status value (must be 0 or 1)' });
  }

  const query = 'UPDATE users SET is_active = ?, updatedAt = NOW() WHERE id = ?';
  pool.query(query, [status, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error updating status', error: err.message });
    }

    return res.status(200).json({ success: true, message: `Status updated to ${status}` });
  });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error_message: error.message,
    });
  }
}

const softDeleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const query = 'UPDATE users SET is_deleted = 1 WHERE id = ? AND is_deleted = 0';

    pool.query(query, [userId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error performing soft delete',
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found or already deleted',
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
  
const deleteDoctor = async(req, res) => {
  try {
    const doctorId = req.params.doctorId;
  if (!doctorId) {
    return res.status(400).json({
      success: false,
      message: "Doctor ID is required"
    });
  }
  const query = 'DELETE FROM doctors WHERE id = ?';
  pool.query(query, [doctorId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error deleting doctor', error: err.message });
    }

    return res.status(200).json({ success: true, message: 'Doctor deleted successfully' });
  });
  } catch (error) {
      return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error_message: error.message,
    });
  }
  
};

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
      emContactPhone2
    } = req.body;

    if (!firstName || !lastName || !dateOfBirth || !gender || !civilIdNumber || !email || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName, dateOfBirth, gender, civilIdNumber, email, mobileNumber are required."
      });
    }

    //  Step 1: Generate next fileNumber from last existing one
    

    const lastFileNumberQuery = `SELECT fileNumber FROM patients ORDER BY id DESC LIMIT 1`;

    pool.query(lastFileNumberQuery, (err, lastResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching last file number",
          error: err.message
        });
      }

      const lastFileNumber = lastResult[0]?.fileNumber || null;
      const fileNumber = generateNextFileNumber(lastFileNumber);

      //  Step 2: Check for duplicates
      const checkDuplicateQuery = `
        SELECT id FROM patients WHERE civilIdNumber = ? OR passportNumber = ?
      `;

      pool.query(checkDuplicateQuery, [civilIdNumber, passportNumber], (dupErr, dupResults) => {
        if (dupErr) {
          return res.status(500).json({
            success: false,
            message: "Database error checking duplicates",
            error: dupErr.message
          });
        }

        if (dupResults.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Patient with this Civil ID or Passport Number already exists"
          });
        }

        //  Step 3: Prepare uploaded file data
        const profileImage = req.files?.profileImage?.[0]?.filename || null;
        const cprScan = req.files?.cprScan?.[0]?.filename || null;
        const passportCopy = req.files?.passportCopy?.[0]?.filename || null;

        //  Step 4: Insert new patient
        const insertQuery = `
          INSERT INTO patients (
            fileNumber, firstName, middleName, lastName, profileImage, dateOfBirth, gender,
            nationality, civilIdNumber, passportNumber, mobileNumber, email, address,
            CPR_scan_doc, passport_copy, fileOpenedDate, firstVisitDate, defaultDoctorId,
            emContactName, emContactRelation, emContactPhone1, emContactPhone2
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          fileNumber, firstName, middleName || null, lastName, profileImage, dateOfBirth, gender,
          nationality || null, civilIdNumber, passportNumber || null, mobileNumber || null, email || null, address || null,
          cprScan, passportCopy, fileOpenedDate || null, firstVisitDate || null, defaultDoctorId || null,
          emContactName || null, emContactRelation || null, emContactPhone1 || null, emContactPhone2 || null
        ];

        pool.query(insertQuery, values, (insertErr, result) => {
          if (insertErr) {
            return res.status(500).json({
              success: false,
              message: "Error registering patient",
              error: insertErr.message
            });
          }

          return res.status(201).json({
            success: true,
            message: "Patient registered successfully",
            patientId: result.insertId,
            fileNumber
          });
        });
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


const getAllPatients = async (req,res)=>{
  try {
    const getQuery = `Select * from patients`
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

const updatePatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Missing patientId in request params"
      });
    }

    // Fetch existing patient data
    const getQuery = `SELECT * FROM patients WHERE id = ?`;
    pool.query(getQuery, [patientId], (getErr, getResults) => {
      if (getErr || getResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
          error: getErr?.message
        });
      }

      const existing = getResults[0];

      // Handle file updates, keep previous if not replaced
      const profileImage = req.files?.profileImage?.[0]?.filename || existing.profileImage;
      const cprScan = req.files?.cprScan?.[0]?.filename || existing.CPR_scan_doc;
      const passportCopy = req.files?.passportCopy?.[0]?.filename || existing.passport_copy;

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
        emContactRelation: req.body.emContactRelation || existing.emContactRelation,
        emContactPhone1: req.body.emContactPhone1 || existing.emContactPhone1,
        emContactPhone2: req.body.emContactPhone2 || existing.emContactPhone2
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
        patientId
      ];

      pool.query(updateQuery, updateValues, (updateErr) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Error updating patient",
            error: updateErr.message
          });
        }

        return res.status(200).json({
          success: true,
          message: "Patient updated successfully"
        });
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

const deletePatient = async(req,res)=>{
  try {
    const {patientId} = req.params
    if(!patientId) {
      return res.status(400).json({
        success : false,
        message:  "Patient id is required"
      })
    }

    const deleteQuery = `Delete from patients where id = ?`
    pool.query(deleteQuery,[patientId],(err,result)=>{
      console.log(result)
      if(err){
        return res.status(500).json({
          success : false,
          message: "Database error while deleting patient",
          error : err.message
        })
      }
      else if(result.affectedRows===0){
        return res.status(404).json({
          success : false,
          message : "Patient not found",
        })
      }
      else{
        return res.status(200).json({
          success : true,
          message : "Patient data deleted successfully"
        })
      }
    })

  } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
}

const createAppointment = (req, res) => {
  const { patientId, doctorId: userDoctorId, appointmentDate, startTime,endTime, reason } = req.body;

  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: "Patient id is required",
    });
  }

  if (!appointmentDate) {
    return res.status(400).json({
      success: false,
      message: "appointment date is required",
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

    if (userDoctorId) {
      //  Fetch actual doctorId (primary key) from doctors table using user_id
      const doctorQuery = `SELECT id FROM doctors WHERE user_id = ?`;
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
        insertAppointment(patientId, actualDoctorId, appointmentDate, startTime , endTime, reason, res);
      });
    } else {
      // No doctor assigned
      insertAppointment(patientId, null, appointmentDate, startTime , endTime, reason, res);
    }
  });
};

const insertAppointment = (patientId, doctorId, appointmentDate, startTime , endTime , reason, res) => {
  
  const isConfirmed = doctorId && startTime && endTime;
  const status = isConfirmed ? "confirmed" : "waiting";

  const insertQuery = `
    INSERT INTO appointments (patientId, doctorId, appointmentDate, startTime, endTime , reason, status)
    VALUES (?, ?, ?, ?,?, ?, ?)
  `;

  pool.query(
    insertQuery,
    [patientId, doctorId, appointmentDate, startTime , endTime , reason, status],
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

const getAllNationalities = async (req,res) => {
  try {
    
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : "Internal Server Error",
      error : error.message
    })
  }
}

function isValidSchedule(item) {
  const { doctor_id, day_of_week, start_time, end_time } = item;
  return (
    Number.isInteger(doctor_id) &&
    typeof day_of_week === 'string' &&
    typeof start_time === 'string' &&
    typeof end_time === 'string'
  );
}

const doctorAvailability = async (req, res) => {
  const data = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ error: 'Input must be a non-empty array.' });
  }

  for (const item of data) {
    if (!isValidSchedule(item)) {
      return res.status(400).json({ error: 'Invalid schedule object detected.' });
    }
  }

  const doctorIds = data.map(d => d.doctor_id);
  const uniqueDoctorIds = [...new Set(doctorIds)];
  const placeholders = uniqueDoctorIds.map(() => '?').join(', ');
  const checkSql = `SELECT id FROM doctors WHERE id IN (${placeholders})`;

  try {
    pool.query(checkSql, uniqueDoctorIds, (checkErr, results) => {
      if (checkErr) {
        console.error('Doctor ID check failed:', checkErr);
        return res.status(500).json({ error: 'Internal server error during doctor check' });
      }

      const existingIds = results.map(r => r.id);
      const missingIds = uniqueDoctorIds.filter(id => !existingIds.includes(id));

      if (missingIds.length > 0) {
        return res.status(400).json({
          error: `These doctor_id(s) do not exist: ${missingIds.join(', ')}`,
        });
      }

      // Step 2: Check for time overlaps
      const overlapPromises = data.map(item => {
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
              item.end_time, item.start_time, // Check partial overlap
              item.start_time, item.end_time, // Check partial overlap
              item.start_time, item.end_time  // Check complete overlap
            ],
            (err, results) => {
              if (err) return reject(err);
              resolve(results.length > 0 ? item : null);
            }
          );
        });
      });

      Promise.all(overlapPromises).then(overlapping => {
        const overlappingSchedules = overlapping.filter(Boolean);

        if (overlappingSchedules.length > 0) {
          return res.status(409).json({
            success : false,
            message: 'Some schedules overlap with existing entries.',
            conflicts: overlappingSchedules,
          });
        }

        // Step 3: Insert if no overlaps
        const values = [];
        const placeholders = [];

        data.forEach(item => {
          placeholders.push('(?, ?, ?, ?)');
          values.push(item.doctor_id, item.day_of_week, item.start_time, item.end_time);
        });

        const insertSql = `
          INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
          VALUES ${placeholders.join(', ')}
        `;

        pool.query(insertSql, values, (insertErr, result) => {
          if (insertErr) {
            console.error('Database insert error:', insertErr);
            return res.status(500).json({ error: 'Failed to insert availability records' });
          }

          res.status(201).json({
            success: true,
            message: `${result.affectedRows} schedule(s) inserted successfully`,
          });
        });
      }).catch(err => {
        console.error('Overlap check error:', err);
        res.status(500).json({ error: 'Failed to check time conflicts' });
      });

    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ success :false,error: 'Server error' });
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
        const query = 'SELECT * FROM appointments WHERE doctorId = ?';
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


export default { getAllUsers , changeUserStatus , deleteUserById , getActiveDoctors , changeUserStatus ,
                softDeleteUser, deleteDoctor ,registerPatient ,getAllPatients,updatePatient,deletePatient ,
                createAppointment , getAllNationalities ,doctorAvailability ,appointmentByDoctorId}
