// routes/trainingPartnerRoutes.js
const express = require("express");
const router = express.Router();
const {
  createOrUpdateProfile,
  getTrainingPartners,
  getSinglePartner,
  getMyProfile,
  trackWebsiteClick,
  getFilterOptions,
  getAllProfilesAdmin,
  togglePublish,
  toggleVerified,
  toggleFeatured,
  deleteProfile,
  getAdminStats,
} = require("../controllers/trainingPartnerController");

// Import your protect middleware
const { protect } = require("../middlewares/authMiddleware");

// Get filter options - MUST come before /:id
router.get("/filters/options", getFilterOptions);

// Get all published training partners
router.get("/", getTrainingPartners);

// Track website click - specific action route
router.post("/:id/track-click", trackWebsiteClick);

// Get single training partner - parameterized route LAST
router.get("/:id", getSinglePartner);

// PROTECTED ROUTES (user must be logged in)

// Get logged-in user's profile - specific route before parameterized
router.get("/my-profile/details", protect, getMyProfile);

// Create or update profile
router.post("/profile", protect, createOrUpdateProfile);

// ADMIN ONLY ROUTES

// Get admin stats - specific route first
router.get("/admin/stats", protect, getAdminStats);

// Get all profiles (admin) - specific route
router.get("/admin/all", protect, getAllProfilesAdmin);

// Admin actions on specific profile - parameterized routes LAST
router.put("/:id/toggle-publish", protect, togglePublish);
router.put("/:id/toggle-verified", protect, toggleVerified);
router.put("/:id/toggle-featured", protect, toggleFeatured);
router.delete("/:id", protect, deleteProfile);

module.exports = router;
