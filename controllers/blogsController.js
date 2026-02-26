const BlogAd = require("../models/blogsModel");
const asyncHandler = require("express-async-handler");

// @desc    Create blog ad
// @route   POST /api/blog-ads
// @access  Private (Leaders/Users)
exports.createBlogAd = asyncHandler(async (req, res) => {
  const { title, description, image, blogUrl, category, tags } = req.body;

  // Process tags if provided
  let processedTags = [];
  if (tags) {
    if (Array.isArray(tags)) {
      processedTags = tags;
    } else if (typeof tags === "string") {
      processedTags = tags.split(",").map((tag) => tag.trim());
    }
  }

  const blogAd = await BlogAd.create({
    title,
    description,
    image,
    blogUrl,
    category,
    tags: processedTags,
    createdBy: req.user.id,
    published: true, // Auto-published
    publishedAt: new Date(),
  });

  // Populate creator info
  const populatedAd = await BlogAd.findById(blogAd._id).populate(
    "createdBy",
    "organizationName email",
  );

  res.status(201).json({
    success: true,
    data: populatedAd,
  });
});

// @desc    Get all published blog ads (public)
// @route   GET /api/blog-ads
// @access  Public
exports.getBlogAds = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // Build query
  let query = { published: true };

  // Search functionality (title, description, tags)
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by tag
  if (req.query.tag) {
    query.tags = req.query.tag;
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
  const total = await BlogAd.countDocuments(query);

  // Get blog ads with pagination
  const blogAds = await BlogAd.find(query)
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("createdBy", "organizationName email");

  res.json({
    success: true,
    data: blogAds,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    },
  });
});

// @desc    Get single blog ad
// @route   GET /api/blog-ads/:id
// @access  Public (only if published)
exports.getSingleBlogAd = asyncHandler(async (req, res) => {
  const blogAd = await BlogAd.findOne({
    _id: req.params.id,
    published: true,
  }).populate("createdBy", "organizationName email");

  if (!blogAd) {
    res.status(404);
    throw new Error("Blog ad not found");
  }

  res.json({
    success: true,
    data: blogAd,
  });
});

// @desc    Update blog ad
// @route   PUT /api/blog-ads/:id
// @access  Private (creator or admin)
exports.updateBlogAd = asyncHandler(async (req, res) => {
  let blogAd = await BlogAd.findById(req.params.id);

  if (!blogAd) {
    res.status(404);
    throw new Error("Blog ad not found");
  }

  // Check if user is creator or admin
  if (blogAd.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
    res.status(403);
    throw new Error("Not authorized to update this ad");
  }

  // Process tags if provided
  if (req.body.tags) {
    if (Array.isArray(req.body.tags)) {
      req.body.tags = req.body.tags;
    } else if (typeof req.body.tags === "string") {
      req.body.tags = req.body.tags.split(",").map((tag) => tag.trim());
    }
  }

  blogAd = await BlogAd.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "organizationName email");

  res.json({
    success: true,
    data: blogAd,
  });
});

// @desc    Toggle publish status (admin only)
// @route   PUT /api/blog-ads/:id/toggle-publish
// @access  Private (admin only)
exports.togglePublishStatus = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Not authorized. Admin only.");
  }

  const blogAd = await BlogAd.findById(req.params.id);

  if (!blogAd) {
    res.status(404);
    throw new Error("Blog ad not found");
  }

  // Toggle published status
  blogAd.published = !blogAd.published;

  // If publishing again, update publishedAt
  if (blogAd.published) {
    blogAd.publishedAt = new Date();
  }

  await blogAd.save();

  res.json({
    success: true,
    data: blogAd,
    message: `Blog ad ${blogAd.published ? "published" : "unpublished"} successfully`,
  });
});

// @desc    Delete blog ad
// @route   DELETE /api/blog-ads/:id
// @access  Private (creator or admin)
exports.deleteBlogAd = asyncHandler(async (req, res) => {
  const blogAd = await BlogAd.findById(req.params.id);

  if (!blogAd) {
    res.status(404);
    throw new Error("Blog ad not found");
  }

  // Check if user is creator or admin
  if (blogAd.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
    res.status(403);
    throw new Error("Not authorized to delete this ad");
  }

  await blogAd.deleteOne();

  res.json({
    success: true,
    message: "Blog ad deleted successfully",
  });
});

// @desc    Track click on blog ad
// @route   POST /api/blog-ads/:id/click
// @access  Public
exports.trackClick = asyncHandler(async (req, res) => {
  const blogAd = await BlogAd.findById(req.params.id);

  if (!blogAd) {
    res.status(404);
    throw new Error("Blog ad not found");
  }

  // Increment click count
  blogAd.clickCount += 1;
  await blogAd.save();

  res.json({
    success: true,
    url: blogAd.blogUrl,
  });
});

// @desc    Get all categories and tags for filtering
// @route   GET /api/blog-ads/filters/all
// @access  Public
exports.getFilters = asyncHandler(async (req, res) => {
  const categories = await BlogAd.distinct("category", { published: true });
  const tags = await BlogAd.distinct("tags", { published: true });

  res.json({
    success: true,
    data: {
      categories: categories.sort(),
      tags: tags.sort(),
    },
  });
});

// @desc    Get blog ads created by logged-in user
// @route   GET /api/blog-ads/my-ads
// @access  Private
exports.getMyBlogAds = asyncHandler(async (req, res) => {
  const blogAds = await BlogAd.find({ createdBy: req.user.id })
    .sort({ createdAt: -1 })
    .populate("createdBy", "organizationName email");

  res.json({
    success: true,
    data: blogAds,
  });
});

// @desc    Get all blog ads (admin only)
// @route   GET /api/blog-ads/admin/all
// @access  Private (admin only)
exports.getAllBlogAdsAdmin = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Not authorized");
  }

  const blogAds = await BlogAd.find({})
    .sort({ createdAt: -1 })
    .populate("createdBy", "organizationName email");

  res.json({
    success: true,
    data: blogAds,
  });
});

// @desc    Get stats for dashboard
// @route   GET /api/blog-ads/stats
// @access  Private (admin only)
exports.getStats = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Not authorized");
  }

  const total = await BlogAd.countDocuments();
  const published = await BlogAd.countDocuments({ published: true });
  const unpublished = await BlogAd.countDocuments({ published: false });
  const totalClicks = await BlogAd.aggregate([
    { $group: { _id: null, total: { $sum: "$clickCount" } } },
  ]);

  // Get clicks by category
  const clicksByCategory = await BlogAd.aggregate([
    { $group: { _id: "$category", clicks: { $sum: "$clickCount" } } },
    { $sort: { clicks: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      total,
      published,
      unpublished,
      totalClicks: totalClicks[0]?.total || 0,
      clicksByCategory,
    },
  });
});
