const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModels");
const {
  sendEmail,
  generateEmailTemplate,
} = require("../config/emails/emailFunction");
const crypto = require("crypto");

exports.registerUser = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }
  const { email, organizationName, phone, password } = req.body;
  const requiredFields = ["email", "organizationName", "phone", "password"];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      res.status(400).send(`Missing required field: ${field}`);
      return;
    }
  }

  const newEmail = email.trim(); //remove white spaces
  const newPhone = phone.trim();
  // Check for existing records
  const existingUser = await User.findOne({
    $or: [{ email: newEmail }, { phone: newPhone }],
  });
  if (existingUser) {
    if (existingUser.email === newEmail) {
      res.status(400).send(`Email: ${newEmail} already exists`);
      return;
    }
    if (existingUser.phone === newPhone) {
      res.status(400).send(`Phone: ${newPhone} already exists`);
      return;
    }
  }
  // hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  // Create user
  const user = await User.create({
    email: newEmail,
    phone: newPhone,
    organizationName,
    password: hashedPassword,
  });
  if (user) {
    res.status(201).json({
      _id: user.id,
      email: user.email,
      phone: user.phone,
      organizationName: user.organizationName,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).send("User not created");
    return;
  }
});

exports.loginUser = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }

  const { email, password } = req.body;

  const requiredFields = ["email", "password"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      res.status(400).send(`Missing required field: ${field}`);
      return;
    }
  }

  const newEmail = email.trim();

  // check if user exists
  const user = await User.findOne({ email: newEmail });

  if (!user) {
    res.status(400).send(`user not found in DB`);
    return;
  }

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      email: user.email,
      phone: user.phone,
      organizationName: user.organizationName,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).send("Incorrect paswword");
    return;
  }
});

// fetch all users
exports.allUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ $natural: -1 });
  if (users) {
    res.status(200).send(users);
  } else {
    res.status(500).send("Not able to fetch users");
  }
});

// fetch based on ID
exports.fetchSpecificUserOnId = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id });
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(500).send("Not able to fetch user");
    return;
  }
});

exports.updateAccount = asyncHandler(async (req, res) => {
  const { password, ...otherUpdates } = req.body;
  const userId = req.params.id;

  // Find user and validate existence
  const user = await User.findById(userId);
  if (!user) {
    res.status(400).send("User not found");
    return;
  }

  // Prepare update object
  const updates = { ...otherUpdates };

  // Handle password update separately
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updates.password = hashedPassword;
  }

  // Perform single atomic update
  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    res.status(400).send("Failed to update user");
    return;
  }

  res.json(updatedUser);
});

exports.toggleAdminStatus = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Find user and validate existence
  const user = await User.findById(userId);
  if (!user) {
    res.status(400).send("User not found");
    return;
  }

  // Toggle the isAdmin status
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isAdmin: !user.isAdmin },
    { new: true },
  );

  if (!updatedUser) {
    res.status(400).send("Failed to update admin status");
    return;
  }

  res.json(updatedUser);
});

// delete all users permanently
exports.deleteAllUsers = asyncHandler(async (req, res, next) => {
  try {
    // Delete all users
    await User.deleteMany({});
    res.json({ message: "All users have been deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while deleting users." });
  }
});

exports.permanentlyDeleteUser = asyncHandler(async (req, res) => {
  // check if user exists
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(500).send("User not found in DB");
  } else {
    await User.findByIdAndDelete(req.params.id);
    res.status(201).json(user._id);
  }
});

// @desc    Request password reset
// @route   POST /api/users/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Please provide email address",
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found with the provided email address",
      });
    }

    // Generate OTP (6-digit number)
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save OTP and expiry to user
    // Note: You'll need to add resetPasswordOTP and resetPasswordOTPExpires fields to your User model
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = otpExpires;
    await user.save();

    // Send OTP via email
    const emailContent = generateEmailTemplate(
      `
  <h2 style="color: #0067b8; margin-bottom: 20px;">Reset Your Password</h2>
  
  <p>Greetings from KAISA,</p>
  
  <p>We received a request to reset the password for your KAISA account. Use the verification code below to complete the process:</p>
  
  <div style="background-color: #f5f9ff; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0; border: 1px solid #e6f0fa;">
    <div style="font-size: 36px; font-weight: 700; color: #0067b8; letter-spacing: 8px; margin: 10px 0;">
      ${otp}
    </div>
    <p style="margin: 5px 0 0; color: #5f6b7a; font-size: 14px;">Valid for 10 minutes</p>
  </div>
  
  <p style="color: #5f6b7a; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email. Your account remains secure.</p>
  
  <hr style="border: none; border-top: 1px solid #eaeef2; margin: 25px 0;">
  
  <p style="color: #8f9bae; font-size: 13px; margin: 0;">
    <strong>Security tip:</strong> Never share this verification code with anyone. Our team will never ask for it.
  </p>
  `,
      "Reset your password - KAISA",
    );

    await sendEmail({
      to: user.email,
      subject: "Password Reset OTP - KAISA Platform",
      html: emailContent,
    });

    res.json({
      success: true,
      message: "OTP has been sent to your email address",
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process password reset request",
    });
  }
});

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      error: "User ID and OTP are required",
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if OTP matches and hasn't expired
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    if (Date.now() > user.resetPasswordOTPExpires) {
      return res.status(400).json({
        success: false,
        error: "OTP has expired",
      });
    }

    // OTP is valid
    res.json({
      success: true,
      message: "OTP verified successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify OTP",
    });
  }
});

// @desc    Reset password
// @route   PUT /api/users/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { userId, otp, newPassword, confirmPassword } = req.body;

  if (!userId || !otp || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      error: "All fields are required",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: "Passwords do not match",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 6 characters long",
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Verify OTP again for security
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    if (Date.now() > user.resetPasswordOTPExpires) {
      return res.status(400).json({
        success: false,
        error: "OTP has expired",
      });
    }

    // Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP fields
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    // Send confirmation email
    const emailContent = generateEmailTemplate(
      `
      <h2>Password Reset Successful</h2>
      <p>Greetings from KAISA,</p>
      <p>Your password has been successfully reset.</p>
      <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;">Your KAISA platform account password has been updated successfully.</p>
      </div>
      <p>If you did not make this change, please contact our support team immediately.</p>
      <p><strong>Security Tip:</strong> Use a strong, unique password and never share it with anyone.</p>
    `,
      "Password Reset Successful - KAISA Platform",
    );

    await sendEmail({
      to: user.email,
      subject: "Password Reset Successful - KAISA Platform",
      html: emailContent,
    });

    res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
});

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
exports.resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "User ID is required",
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update OTP fields
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = otpExpires;
    await user.save();

    // Send new OTP via email
    const emailContent = generateEmailTemplate(
      `
      <h2>New OTP Code</h2>
      <p>Greetings from KAISA,</p>
      <p>Here is your new OTP code for password reset:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
        <h3 style="margin: 0; color: #146C94;">Your New OTP Code</h3>
        <div style="font-size: 32px; font-weight: bold; color: #146C94; letter-spacing: 5px; margin: 15px 0;">
          ${otp}
        </div>
        <p style="margin: 0; color: #666;">This code will expire in 10 minutes</p>
      </div>
      <p>If you didn't request this reset, please ignore this email.</p>
    `,
      "New OTP Code - KAISA Platform",
    );

    await sendEmail({
      to: user.email,
      subject: "New OTP Code - KAISA Platform",
      html: emailContent,
    });

    res.json({
      success: true,
      message: "New OTP has been sent to your email",
      userId: user._id,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resend OTP",
    });
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
};
