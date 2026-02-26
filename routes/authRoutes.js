const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  verifyOTP,
  resetPassword,
  resendOTP,
} = require("../controllers/userController");

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.put("/reset-password", resetPassword);
router.post("/resend-otp", resendOTP);

module.exports = router;
