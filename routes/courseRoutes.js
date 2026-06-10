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
  fetchMyCourses,
} = require("../controllers/courseController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/", protect, createCourse);
router.get("/", protect, getAllCourses);
router.get("/approved", fetchApprovedCourses);
router.get("/my-courses", protect, fetchMyCourses);
router.get("/:id", fetchSpecifiCourse);
router.put("/:id", protect, updateSpecificCourse);
router.delete("/:id", protect, permanentlyDeleteCourse);
router.patch("/:id/toggle-approval", protect, toggleApproval);

module.exports = router;
