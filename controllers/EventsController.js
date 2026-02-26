const Event = require("../models/eventsModel");
const asyncHandler = require("express-async-handler");

// @desc    Create event
// @route   POST /api/events
// @access  Private (Leaders/Admins)

exports.createEvent = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    image,
    eventType,
    startDate,
    endDate,
    location,
    meetingLink,
    contactEmail,
    contactPhone,
    eventLink,
    hashtags,
  } = req.body;

  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    res.status(400);
    throw new Error("End date must be after start date");
  }

  // Process hashtags
  let processedHashtags = [];
  if (hashtags) {
    if (Array.isArray(hashtags)) {
      processedHashtags = hashtags;
    } else if (typeof hashtags === "string") {
      processedHashtags = hashtags.split(",").map((tag) => tag.trim());
    }
  }

  const event = await Event.create({
    title,
    description,
    image,
    eventType,
    startDate,
    endDate,
    location: location || {},
    meetingLink: meetingLink || "",
    contactEmail: contactEmail || "",
    contactPhone: contactPhone || "",
    eventLink: eventLink || "",
    hashtags: processedHashtags,
    createdBy: req.user.id,
    published: true, // Auto-published
  });

  res.status(201).json({
    success: true,
    data: event,
  });
});

// @desc    Get all published events (public)
// @route   GET /api/events
// @access  Public
exports.getEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = { published: true };

  // Search functionality
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by hashtag
  if (req.query.hashtag) {
    query.hashtags = req.query.hashtag;
  }

  // Filter by event type
  if (req.query.eventType) {
    query.eventType = req.query.eventType;
  }

  // Filter by location
  if (req.query.city) {
    query["location.city"] = req.query.city;
  }
  if (req.query.country) {
    query["location.country"] = req.query.country;
  }

  // Filter by event status (upcoming, ongoing, past)
  if (req.query.status) {
    if (req.query.status === "upcoming") {
      query.startDate = { $gt: new Date() };
    } else if (req.query.status === "ongoing") {
      query.startDate = { $lte: new Date() };
      query.endDate = { $gte: new Date() };
    } else if (req.query.status === "past") {
      query.endDate = { $lt: new Date() };
    }
  }

  // Date range filter (custom range)
  if (req.query.startDate || req.query.endDate) {
    query.startDate = {};
    if (req.query.startDate) {
      query.startDate.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.startDate.$lte = new Date(req.query.endDate);
    }
  }

  // Get total count
  const total = await Event.countDocuments(query);

  // Get events
  const events = await Event.find(query)
    .sort({ startDate: 1 }) // Show upcoming events first
    .skip(skip)
    .limit(limit)
    .populate("createdBy", "organizationName email");

  res.json({
    success: true,
    data: events,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    },
  });
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getSingleEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({
    _id: req.params.id,
    published: true,
  }).populate("createdBy", "organizationName email");

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  res.json({
    success: true,
    data: event,
  });
});

// @desc    Track click on "See More"
// @route   POST /api/events/:id/click
// @access  Public
exports.trackEventClick = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  // Simply increment click count - no IP tracking
  event.clicks = (event.clicks || 0) + 1;

  await event.save();

  res.json({
    success: true,
    clicks: event.clicks,
  });
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Creator or Admin)
exports.updateEvent = asyncHandler(async (req, res) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  // Check if user is creator or admin
  if (event.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  // Validate dates if they're being updated
  if (req.body.startDate && req.body.endDate) {
    if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
      res.status(400);
      throw new Error("End date must be after start date");
    }
  }

  // Process hashtags if provided
  if (req.body.hashtags) {
    if (Array.isArray(req.body.hashtags)) {
      req.body.hashtags = req.body.hashtags;
    } else if (typeof req.body.hashtags === "string") {
      req.body.hashtags = req.body.hashtags.split(",").map((tag) => tag.trim());
    }
  }

  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: event,
  });
});

// @desc    Toggle publish status (Admin only)
// @route   PUT /api/events/:id/toggle-publish
// @access  Private (Admin only)
exports.togglePublishStatus = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized. Admin only.");
  }

  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  event.published = !event.published;
  await event.save();

  res.json({
    success: true,
    data: event,
    message: `Event ${event.published ? "published" : "unpublished"} successfully`,
  });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Creator or Admin)
exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  // Check if user is creator or admin
  if (event.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  await event.deleteOne();

  res.json({
    success: true,
    message: "Event deleted successfully",
  });
});

// @desc    Get all hashtags for filtering
// @route   GET /api/events/hashtags/all
// @access  Public
exports.getAllHashtags = asyncHandler(async (req, res) => {
  const hashtags = await Event.distinct("hashtags", { published: true });

  res.json({
    success: true,
    data: hashtags,
  });
});

// @desc    Get available cities for filtering
// @route   GET /api/events/locations/cities
// @access  Public
exports.getEventCities = asyncHandler(async (req, res) => {
  const cities = await Event.distinct("location.city", {
    published: true,
    "location.city": { $ne: "" },
  });

  res.json({
    success: true,
    data: cities.filter((city) => city),
  });
});

// @desc    Get event statistics for creator dashboard
// @route   GET /api/events/stats/my-events
// @access  Private
exports.getMyEventStats = asyncHandler(async (req, res) => {
  const events = await Event.find({
    createdBy: req.user.id,
    published: true,
  });

  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.eventStatus === "upcoming").length,
    ongoing: events.filter((e) => e.eventStatus === "ongoing").length,
    past: events.filter((e) => e.eventStatus === "past").length,
    totalClicks: events.reduce((sum, e) => sum + e.clicks, 0),
    online: events.filter((e) => e.eventType === "online").length,
    inPerson: events.filter((e) => e.eventType === "in-person").length,
    hybrid: events.filter((e) => e.eventType === "hybrid").length,
  };

  res.json({
    success: true,
    data: stats,
  });
});

// @desc    Get my events (for leaders)
// @route   GET /api/events/my-events
// @access  Private
exports.getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ createdBy: req.user.id })
    .sort({ startDate: -1 })
    .populate("createdBy", "organizationName email");

  res.json({
    success: true,
    data: events,
  });
});

// @desc    Get all events (admin only)
// @route   GET /api/events/admin/all
// @access  Private (Admin only)
exports.getAllEventsAdmin = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const events = await Event.find({})
    .sort({ createdAt: -1 })
    .populate("createdBy", "organizationName email");

  res.json({
    success: true,
    data: events,
  });
});
