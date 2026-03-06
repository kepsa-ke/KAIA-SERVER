const express = require("express");
const router = express.Router();
const {
  createEvent,
  getEvents,
  getSingleEvent,
  trackEventClick,
  updateEvent,
  togglePublishStatus,
  deleteEvent,
  getAllHashtags,
  getEventCities,
  getMyEventStats,
  getMyEvents,
  getAllEventsAdmin,
  getRecentEvents,
} = require("../controllers/EventsController");

// Import your protect middleware
const { protect } = require("../middlewares/authMiddleware");

router.get("/", getEvents);
router.get("/recent", getRecentEvents);
router.get("/my-events/stats", protect, getMyEventStats);
router.get("/my-events", protect, getMyEvents);
router.get("/hashtags/all", getAllHashtags);
router.get("/locations/cities", getEventCities);
router.get("/:id", getSingleEvent);
router.post("/:id/click", trackEventClick);

// Protected routes (leaders and admins)
router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

// Admin only routes
router.get("/admin/all", protect, getAllEventsAdmin);
router.put("/:id/toggle-publish", protect, togglePublishStatus);

module.exports = router;
