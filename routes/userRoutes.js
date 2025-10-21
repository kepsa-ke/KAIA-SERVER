const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  allUsers,
  fetchSpecificUserOnId,
  updateAccount,
  deleteAllUsers,
  permanentlyDeleteUser,
  toggleAdminStatus,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, allUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", fetchSpecificUserOnId);
router.put("/:id", updateAccount);
router.delete("/:id", permanentlyDeleteUser);
router.patch("/:id/toggle-admin", toggleAdminStatus);

module.exports = router;
