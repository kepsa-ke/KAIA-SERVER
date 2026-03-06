// routes/newsRoutes.js
const express = require("express");
const router = express.Router();
const {
  createNews,
  getNews,
  getSingleNews,
  updateNews,
  togglePublishStatus,
  deleteNews,
  getAllHashtags,
  getMyNews,
  getAllNewsAdmin,
  getRecentNews,
} = require("../controllers/newsController");

// Import your protect middleware
const { protect } = require("../middlewares/authMiddleware");

// PUBLIC ROUTES (order matters - specific routes first)
router.get("/", getNews);
router.get("/hashtags/all", getAllHashtags);
router.get("/recent", getRecentNews);

// PROTECTED ROUTES (specific routes before parameterized routes)
router.get("/my-news", protect, getMyNews); // This must come BEFORE /:id
router.get("/admin/all", protect, getAllNewsAdmin); // If you have this

// Parameterized routes (must come last)
router.get("/:id", getSingleNews);

// Other protected routes
router.post("/", protect, createNews);
router.put("/:id", protect, updateNews);
router.delete("/:id", protect, deleteNews);

// Admin only route
router.put("/:id/toggle-publish", protect, togglePublishStatus);

module.exports = router;
