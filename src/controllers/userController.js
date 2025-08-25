import pool from "../config/db.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import sendEmail from "../utils/userEmail.js"

// generate otp

function generateOtp() {
  const otp = Math.floor(Math.random() * 9 + 1).toString();
  let digit = otp;
  for (let i = 0; i < 5; i++) {
    digit += Math.floor(Math.random() * 10).toString();
  }
  return parseInt(digit);
}

const userSignup = async (req, res) => {
  const { email, password, role } = req.body;

  const allowedRoles = ['admin', 'subadmin', 'doctor', 'receptionist'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role provided',
    });
  }

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  try {
    const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
    pool.query(checkUserQuery, [email], async (error, result) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Error while checking user',
        });
      }

      if (result.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertQuery = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)';
      pool.query(insertQuery, [email, hashedPassword, role], (err, insertResult) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error while registering user',
          });
        }

        return res.status(201).json({
          success: true,
          message: `${role} registered successfully`,
        });
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

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email required"
            });
        }
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password required"
            });
        }

        const query = "SELECT * FROM users WHERE email = ? AND is_active = 1 AND is_deleted = 0";

        pool.query(query, [email], async (error, result) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Error while fetching the user details",
                });
            } else {
                if (result.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                } else {
                    const matchPassword = await bcrypt.compare(password, result[0].password);
                    if (!matchPassword) {
                        return res.status(400).json({
                            success: false,
                            message: "Password not correct"
                        });
                    } else {
                        const user = result[0];
                        console.log(user);
                        
                        let doctorName = null;

                        // Fetch doctor name for any role (if exists)
                        const doctorQuery = `SELECT * FROM doctors WHERE user_id = ? LIMIT 1`;
                        pool.query(doctorQuery, [user.id], (err, doctorResult) => {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: "Error fetching doctor's name"
                                });
                            }
                            if (doctorResult.length > 0) {
                                doctorName = doctorResult[0].fullName;
                            }
                            let doctorData =  doctorResult[0]
                            const payload = {
                                id: user.id,
                                email: user.email,
                                role: user.role
                            };

                            const token = jwt.sign(payload, process.env.secret_key, { expiresIn: "24h" });

                            return res.status(200).json({
                                success: true,
                                message: `${user.role} login successfully`,
                                token,
                                data: {...user,...doctorData},
                            });
                        });
                    }
                }
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


const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    if(!id){
      return res.status(400).json({
        success :  false,
        message : "Id required"
      })
    }
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!id || !oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ success: false, message: "New password must be different from old password" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match" });
    }

    const sql = "SELECT * FROM users WHERE id = ?";
    pool.query(sql, [id], async (error, result) => {
      if (error) throw error;

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const isValid = await bcrypt.compare(oldPassword, result[0].password);
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Old password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id], (err) => {
        if (err) throw err;
        res.status(200).json({ success: true, message: "Password changed successfully" });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};


const userOtpGenerate = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    pool.query(sql, [email], async function (error, result) {
      if (error) throw error;

      if (result.length === 0) {
        return res.status(400).json({ success: false, message: "Email not found" });
      }

      const otp = generateOtp();
      const recipientEmail = result[0].email;
      const subject = "Forget Password";

      const userEmailContent = `<!DOCTYPE html>
      <html>
      <body>
        <p>Your OTP for password reset is:</p>
        <h3 style="background:#eee; padding:10px; display:inline-block;">${otp}</h3>
        <p>This OTP is valid for 2 minutes.</p>
      </body>
      </html>`;

      await sendEmail(recipientEmail, subject, userEmailContent); //  updated function

      const otpQuery = "INSERT INTO user_otp (otp, user_id) VALUES (?, ?)";
      pool.query(otpQuery, [otp, result[0].id], (err) => {
        if (err) throw err;
        return res.status(200).json({ success: true, message: "OTP generated and email sent successfully" });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};


const userVerifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp || !/^\d+$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Valid OTP is required" });
    }

    pool.query("SELECT * FROM user_otp WHERE otp = ?", [otp], (error, result) => {
      if (error) throw error;

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: "Invalid or expired OTP" });
      }

      const userId = result[0].user_id;

      // Delete the OTP after verification
      pool.query("DELETE FROM user_otp WHERE otp = ?", [otp], (deleteErr) => {
        if (deleteErr) {
          // Log error but don't block response
        }
        // Respond after deletion attempt
        res.status(200).json({ success: true, message: "OTP verified successfully", data: userId });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};


const userResetPassword = async (req, res) => {
  try {
    const { id } = req.params;
     if(!id){
      return res.status(400).json({
        success :  false,
        message : "Id required"
      })
    }
    const { newPassword, confirmNewPassword } = req.body;

    if (!id || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    pool.query("SELECT * FROM users WHERE id = ?", [id], async (error, result) => {
      if (error) throw error;
      if (result.length === 0) return res.status(404).json({ success: false, message: "User not found" });

      const isSame = await bcrypt.compare(newPassword, result[0].password);
      if (isSame) {
        return res.status(400).json({ success: false, message: "New password must be different from old password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id], (err) => {
        if (err) throw err;
        res.status(200).json({ success: true, message: "Password reset successfully" });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

const addDoctorDetails = async (req, res) => {
  try {
    let {
      email,
      password,
      role,
      fullName,
      phoneNumber,
      shortName,
      prefix,
      dateOfBirth,
      licenseId,
      civilId,
      passport,
      gender,
      specialty
    } = req.body;

    const personalPhoto = req.file ? req.file.filename : null;

    if (!fullName || !licenseId || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing'
      });
    }

    const existingDoctor = `SELECT * FROM users WHERE email = ?`;
    pool.query(existingDoctor, [email], async (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: err.message
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Continue here only if email is unique
      password = await bcrypt.hash(password, 10);
      const userInsertQuery = `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`;

      pool.query(userInsertQuery, [email, password, role], (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error while creating user',
            error: err.message
          });
        }

        const user_id = result.insertId;
        const doctorInsertQuery = `
          INSERT INTO doctors (
            user_id, fullName, shortName, prefix, dateOfBirth,
            licenseId, civilId, passport, gender, specialty, personalPhoto ,phoneNumber
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `;

        const values = [
          user_id,
          fullName,
          shortName,
          prefix,
          dateOfBirth,
          licenseId,
          civilId,
          passport,
          gender,
          specialty,
          personalPhoto,
          phoneNumber
        ];

        pool.query(doctorInsertQuery, values, (insertErr) => {
          if (insertErr) {
            return res.status(500).json({
              success: false,
              message: 'Error while inserting doctor details',
              error: insertErr.message
            });
          }

          return res.status(201).json({
            success: true,
            message: `${role} details added successfully`
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


const updateDoctorDetails = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    let {
      email,          // users table
      fullName,
      shortName,
      prefix,
      dateOfBirth,
      licenseId,
      civilId,
      passport,
      gender,
      specialty,
      phoneNumber
    } = req.body;

    const personalPhoto = req.file ? req.file.filename : null;

    // Step 1: Get user_id from doctors table
    const getDoctorQuery = "SELECT * FROM doctors WHERE id = ?";
    pool.query(getDoctorQuery, [doctorId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching doctor",
          error: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const doctor = result[0];
      const userId = doctor.user_id;

      // Step 2: Update users table if email provided
      if (email) {
        const updateEmailQuery = "UPDATE users SET email = ? WHERE id = ?";
        pool.query(updateEmailQuery, [email, userId], (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error updating user email",
              error: err.message,
            });
          }
        });
      }

      // Step 3: Update doctors table with new or existing values
      const updateDoctorQuery = `
        UPDATE doctors SET
          fullName = ?,
          shortName = ?,
          prefix = ?,
          dateOfBirth = ?,
          licenseId = ?,
          civilId = ?,
          passport = ?,
          gender = ?,
          specialty = ?,
          phoneNumber = ?,
          personalPhoto = ?
        WHERE id = ?
      `;

      const values = [
        fullName || doctor.fullName,
        shortName || doctor.shortName,
        prefix || doctor.prefix,
        dateOfBirth || doctor.dateOfBirth,
        licenseId || doctor.licenseId,
        civilId || doctor.civilId,
        passport || doctor.passport,
        gender || doctor.gender,
        specialty || doctor.specialty,
        phoneNumber || doctor.phoneNumber,
        personalPhoto || doctor.personalPhoto,
        doctorId,
      ];

      pool.query(updateDoctorQuery, values, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error updating doctor details",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Doctor details updated successfully",
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


export default {userSignup , userLogin,changePassword,userOtpGenerate,userVerifyOtp,userResetPassword , addDoctorDetails ,updateDoctorDetails}

