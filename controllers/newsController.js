const News = require("../models/newsModel");
const asyncHandler = require("express-async-handler");

// @desc    Create news
// @route   POST /api/news
// @access  Private (any logged-in user)
exports.createNews = asyncHandler(async (req, res) => {
  try {
    const { title, body, image, externalLink, hashtags } = req.body;

    // Process hashtags: split by comma if sent as string, or use array
    let processedHashtags = [];
    if (hashtags) {
      if (Array.isArray(hashtags)) {
        processedHashtags = hashtags;
      } else if (typeof hashtags === "string") {
        processedHashtags = hashtags.split(",").map((tag) => tag.trim());
      }
    }

    const news = await News.create({
      title,
      body,
      image,
      externalLink: externalLink || "",
      hashtags: processedHashtags,
      createdBy: req.user.id,
      published: false, // Auto-published
      publishedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      data: news,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all published news (public)
// @route   GET /api/news
// @access  Public
exports.getNews = asyncHandler(async (req, res) => {
  try {
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

    // Date filtering
    if (req.query.startDate || req.query.endDate) {
      query.publishedAt = {};
      if (req.query.startDate) {
        query.publishedAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.publishedAt.$lte = new Date(req.query.endDate);
      }
    }

    // Get total count for pagination
    const total = await News.countDocuments(query);

    // Get news with pagination
    const news = await News.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "organizationName email");

    res.json({
      success: true,
      data: news,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get recent 5 published news (public)
// @route   GET /api/news/recent
// @access  Public
exports.getRecentNews = asyncHandler(async (req, res) => {
  try {
    // Build query - only published news
    let query = { published: true };

    // Get only 5 most recent news items
    const news = await News.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(5)
      .populate("createdBy", "organizationName email");

    res.json({
      success: true,
      data: news,
      count: news.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get single news
// @route   GET /api/news/:id
// @access  Public (only if published)

exports.getSingleNews = asyncHandler(async (req, res) => {
  try {
    const news = await News.findOne({
      _id: req.params.id,
      published: true,
    }).populate("createdBy", "organizationName email");

    if (!news) {
      return res.status(404).json({
        success: false,
        error: "News not found",
      });
    }

    res.json({
      success: true,
      data: news,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update news
// @route   PUT /api/news/:id
// @access  Private (creator or admin)
exports.updateNews = asyncHandler(async (req, res) => {
  try {
    let news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: "News not found",
      });
    }

    // Check if user is creator or admin
    if (news.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        error: "Not authorized",
      });
    }

    // Process hashtags if provided
    if (req.body.hashtags) {
      if (Array.isArray(req.body.hashtags)) {
        req.body.hashtags = req.body.hashtags;
      } else if (typeof req.body.hashtags === "string") {
        req.body.hashtags = req.body.hashtags
          .split(",")
          .map((tag) => tag.trim());
      }
    }

    news = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: news,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Toggle publish status (admin only)
// @route   PUT /api/news/:id/toggle-publish
// @access  Private (admin only)
exports.togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        error: "Not authorized. Admin only.",
      });
    }

    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: "News not found",
      });
    }

    // Toggle published status
    news.published = !news.published;

    // If publishing again, update publishedAt
    if (news.published) {
      news.publishedAt = new Date();
    }

    await news.save();

    res.json({
      success: true,
      data: news,
      message: `News ${news.published ? "published" : "unpublished"} successfully`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete news
// @route   DELETE /api/news/:id
// @access  Private (creator or admin)
exports.deleteNews = asyncHandler(async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: "News not found",
      });
    }

    // Check if user is creator or admin
    if (news.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        error: "Not authorized",
      });
    }

    await news.deleteOne();

    res.json({
      success: true,
      message: "News deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all hashtags (for autocomplete/filtering)
// @route   GET /api/news/hashtags/all
// @access  Public
exports.getAllHashtags = asyncHandler(async (req, res) => {
  try {
    const hashtags = await News.distinct("hashtags", { published: true });

    res.json({
      success: true,
      data: hashtags,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

exports.getAllNewsAdmin = asyncHandler(async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        error: "Not authorized",
      });
    }
    const news = await News.find({})
      .sort({ createdAt: -1 })
      .populate("createdBy", "organizationName email");

    res.json(news);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all news for current user (including unpublished)
// @route   GET /api/news/user/my-news
// @access  Private
exports.getMyNews = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query - only fetch news created by the current user
    let query = { createdBy: req.user.id };

    // Optional search functionality for user's own news
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by hashtag
    if (req.query.hashtag) {
      query.hashtags = req.query.hashtag;
    }

    // Filter by publish status
    if (req.query.status) {
      if (req.query.status === "published") {
        query.published = true;
      } else if (req.query.status === "unpublished") {
        query.published = false;
      }
    }

    // Date filtering
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Get total count for pagination
    const total = await News.countDocuments(query);

    // Get user's news with pagination
    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "organizationName email");

    res.json({
      success: true,
      data: news,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});
