const express = require("express");
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  fetchSpecifiCourse,
  updateSpecificCourse,
  permanentlyDeleteCourse,
  fetchApprovedCourses,
  toggleApproval,
} = require("../controllers/courseController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/", protect, createCourse);
router.get("/", getAllCourses);
router.get("/approved", fetchApprovedCourses);
router.get("/:id", fetchSpecifiCourse);
router.put("/:id", protect, updateSpecificCourse);
router.delete("/:id", protect, permanentlyDeleteCourse);
router.patch("/:id/toggle-approval", toggleApproval);

module.exports = router;
