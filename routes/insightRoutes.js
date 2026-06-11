const express = require("express");
const router = express.Router();
const {
  createReport,
  getAllReports,
  fetchMyReports,
  fetchApprovedReports,
  fetchSpecificReport,
  trackClick,
  updateReport,
  deleteReport,
  toggleApproval,
  toggleFeatured,
  getFeaturedReport,
  getAllTags,
  getReportsByOrganization,
} = require("../controllers/insightController");
const { protect } = require("../middlewares/authMiddleware");

// Public routes (no authentication required)
router.get("/approved", fetchApprovedReports);
router.get("/featured", getFeaturedReport);
router.get("/tags", getAllTags);
router.get("/organization/:organizationName", getReportsByOrganization);

// IMPORTANT: Put specific routes BEFORE parameter routes
router.get("/my-reports", protect, fetchMyReports); // <-- Move this before /:id

// Parameter routes (must come LAST)
router.get("/:id", fetchSpecificReport);
router.post("/:id/track-click", trackClick);

// Protected routes (authentication required)
router.post("/", protect, createReport);
router.put("/:id", protect, updateReport);
router.delete("/:id", protect, deleteReport);

// Admin only routes
router.get("/", protect, getAllReports);
router.patch("/:id/toggle-approval", protect, toggleApproval);
router.patch("/:id/toggle-featured", protect, toggleFeatured);

module.exports = router;
