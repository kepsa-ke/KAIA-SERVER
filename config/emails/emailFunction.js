// utils/emailService.js
const transporter = require("./transporter");

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: {
        name: "Kenya AI Skilling Alliance",
        address: "aiskillingalliance@kepsa.or.ke", // This will show as "from" but you can customize the name
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Auto-generate text version if not provided
    };

    const result = await transporter.sendMail(mailOptions);
    // console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    // console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const generateEmailTemplate = (content, title = "") => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #146C94;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 20px;
                border: 1px solid #ddd;
                border-top: none;
            }
            .footer {
                background-color: #333;
                color: white;
                padding: 15px;
                text-align: center;
                border-radius: 0 0 5px 5px;
                font-size: 14px;
            }
            .contact-info {
                margin-top: 10px;
                color: #ccc;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Kenya AI Skilling Alliance</h1>
            <p>Empowering Kenya through AI Education</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; Copyright 2023 KEPSA | All rights reserved.</p>
            <div class="contact-info">
                <p>For inquiries, contact us at: <strong>+254 720 340949</strong></p>
                <p>Email: aiskillingalliance@kepsa.or.ke</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendEmail,
  generateEmailTemplate,
};
