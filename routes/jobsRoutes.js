// routes/jobsRoutes.js
const express = require("express");
const router = express.Router();
const {
  createJob,
  getJobs,
  getSingleJob,
  getMyJobs,
  updateJob,
  togglePublishStatus,
  toggleFeatured,
  deleteJob,
  trackApplyClick,
  getFilterOptions,
  getJobStats,
  getAllJobsAdmin,
} = require("../controllers/jobsController");

const { protect } = require("../middlewares/authMiddleware");

// Public routes
router.get("/", getJobs);
router.get("/filters/options", getFilterOptions);

// Protected routes (specific routes first, then dynamic)
router.get("/my-jobs", protect, getMyJobs); // Changed from "/my-jobs/list" to avoid confusion
router.get("/admin/stats", protect, getJobStats);
router.get("/admin/all", protect, getAllJobsAdmin);

// Dynamic routes (with :id) should come AFTER specific routes
router.get("/:id", getSingleJob);
router.post("/:id/track-apply", trackApplyClick);
router.post("/", protect, createJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);

// Admin only routes (these also have :id, so they need to be after specific routes)
router.put("/:id/toggle-publish", protect, togglePublishStatus);
router.put("/:id/toggle-featured", protect, toggleFeatured);

module.exports = router;
