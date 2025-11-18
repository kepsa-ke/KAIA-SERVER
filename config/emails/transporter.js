const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  //   host: "smtp.gmail.com",
  //   port: 587,
  //   secure: false,
  auth: {
    user: "kepsa.kyeeap@gmail.com",
    pass: process.env.APP_PWD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.log("Error with email configuration:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

module.exports = transporter;
