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
  console.log(digit);
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

const userLogin = async (req,res)=>{
    try {

        const {email,password} = req.body

        if(!email){
            return res.status(400).json({
                success : false,
                message : "Email required"
            })
        }
        if(!password){
            return res.status(400).json({
                success : false,
                message : "password required"
            })
        }

        const query = "Select * from users where email = ? AND is_active = 1 AND is_deleted = 0"

        pool.query(query,[email], async (error,result)=>{
            if(error){
                return res.status(500).json({
                    success: false,
                    message: "Error While fetching the user Details",
        });
            }else{
                if(result.length === 0){
                    return res.status(404).json({
                        success : false,
                        message : "User not found"
                    })
                }else {
                    const matchPassword = await bcrypt.compare(password,result[0].password)
                    console.log(matchPassword)
                    if(!matchPassword){
                         return res.status(400).json({
                        success : false,
                        message : "Password not correct"
                    })
                    }else{
                        const payload = {
                            id : result[0].id,
                            email : result[0].email,
                            role : result[0].role

                        } 

                        const token = jwt.sign(payload,process.env.secret_key,{expiresIn :"24h"})

                        return res.status(200).json({
                            success: true,
                            message: `${result[0].role} login successfully`,
                            token ,
                            role : result[0].role
                        })
                    }
                }
            }

        })

    } catch (error) {
        return res.status(500).json({
            success : false,
            message : "Internal Server Error",
            error  : error.message
        })
    }
}

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
          console.error("Failed to delete OTP:", deleteErr.message);
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
            message: 'Doctor details added successfully'
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


const updateDoctorDetails = (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }

  const {
    email,
    fullName,
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

  // Step 1: Fetch doctor details by userId
  const getDoctorQuery = `
    SELECT d.*, u.email AS currentEmail
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.user_id = ?
  `;

  pool.query(getDoctorQuery, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching doctor details",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const existing = results[0];

    // Step 2: Check email update
    if (email && email !== existing.currentEmail) {
      const emailCheckQuery = `SELECT id FROM users WHERE email = ? AND id != ?`;
      pool.query(emailCheckQuery, [email, userId], (emailErr, emailRes) => {
        if (emailErr) {
          return res.status(500).json({
            success: false,
            message: "Error checking email",
            error: emailErr.message
          });
        }

        if (emailRes.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Email is already used by another user"
          });
        }

        // Update email
        const updateEmailQuery = `UPDATE users SET email = ? WHERE id = ?`;
        pool.query(updateEmailQuery, [email, userId], (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error updating email",
              error: err.message
            });
          }

          // Proceed to update doctor data
          updateDoctorData(existing);
        });
      });
    } else {
      // No email change
      updateDoctorData(existing);
    }

    // Step 3: Update doctor table
    function updateDoctorData(existing) {
      const updatedFields = {
        fullName: fullName || existing.fullName,
        shortName: shortName || existing.shortName,
        prefix: prefix || existing.prefix,
        dateOfBirth: dateOfBirth || existing.dateOfBirth,
        licenseId: licenseId || existing.licenseId,
        civilId: civilId || existing.civilId,
        passport: passport || existing.passport,
        gender: gender || existing.gender,
        specialty: specialty || existing.specialty,
        personalPhoto: personalPhoto || existing.personalPhoto
      };

      const updateDoctorQuery = `
        UPDATE doctors SET
          fullName = ?, shortName = ?, prefix = ?, dateOfBirth = ?, licenseId = ?,
          civilId = ?, passport = ?, gender = ?, specialty = ?, personalPhoto = ?, updatedAt = NOW()
        WHERE user_id = ?
      `;

      const values = [
        updatedFields.fullName,
        updatedFields.shortName,
        updatedFields.prefix,
        updatedFields.dateOfBirth,
        updatedFields.licenseId,
        updatedFields.civilId,
        updatedFields.passport,
        updatedFields.gender,
        updatedFields.specialty,
        updatedFields.personalPhoto,
        userId
      ];

      pool.query(updateDoctorQuery, values, (updateErr) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: "Error updating doctor details",
            error: updateErr.message
          });
        }

        return res.status(200).json({
          success: true,
          message: "Doctor details updated successfully"
        });
      });
    }
  });
};


export default {userSignup , userLogin,changePassword,userOtpGenerate,userVerifyOtp,userResetPassword , addDoctorDetails ,updateDoctorDetails}

