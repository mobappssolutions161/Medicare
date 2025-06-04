import nodemailer from "nodemailer";

const userEmail = async (recipientEmail, subject, content) => {
  try {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transport.sendMail({
      from: process.env.SMTP_MAIL,
      to: recipientEmail,
      subject: subject,
      html: content,
    });
    console.log("Email sent successfully");
  } catch (error) {
    throw error;
  }
};

export default  userEmail;
