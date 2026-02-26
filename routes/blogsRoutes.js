// routes/blogAdRoutes.js
const express = require("express");
const router = express.Router();
const {
  createBlogAd,
  getBlogAds,
  getSingleBlogAd,
  updateBlogAd,
  togglePublishStatus,
  deleteBlogAd,
  trackClick,
  getFilters,
  getMyBlogAds,
  getAllBlogAdsAdmin,
  getStats,
} = require("../controllers/blogsController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", getBlogAds);
router.get("/my-ads", protect, getMyBlogAds);
router.get("/filters/all", getFilters);
router.get("/:id", getSingleBlogAd);
router.post("/:id/click", trackClick);

// Protected routes (any logged-in user)
router.post("/", protect, createBlogAd);

router.put("/:id", protect, updateBlogAd);
router.delete("/:id", protect, deleteBlogAd);

// Admin only routes
router.get("/admin/all", protect, getAllBlogAdsAdmin);
router.get("/stats/admin", protect, getStats);
router.put("/:id/toggle-publish", protect, togglePublishStatus);

module.exports = router;
