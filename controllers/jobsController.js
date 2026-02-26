// controllers/jobController.js
const Job = require("../models/jobsModel");
const asyncHandler = require("express-async-handler");

// @desc    Create a job ad
// @route   POST /api/jobs
// @access  Private (Leaders/Admin)
exports.createJob = asyncHandler(async (req, res) => {
  const {
    title,
    about,
    type,
    workMode,
    location,
    requirements,
    responsibilities,
    qualifications,
    salaryRange,
    benefits,
    applyLink,
    applicationDeadline,
    companyName,
    companyLogo,
    companyWebsite,
    category,
    tags,
    experienceLevel,
  } = req.body;

  // Validate that arrays are actually arrays
  const processedRequirements = Array.isArray(requirements)
    ? requirements
    : requirements?.split("\n").filter((item) => item.trim()) || [];

  const processedResponsibilities = Array.isArray(responsibilities)
    ? responsibilities
    : responsibilities?.split("\n").filter((item) => item.trim()) || [];

  const processedQualifications = Array.isArray(qualifications)
    ? qualifications
    : qualifications?.split("\n").filter((item) => item.trim()) || [];

  const processedBenefits = Array.isArray(benefits)
    ? benefits
    : benefits?.split("\n").filter((item) => item.trim()) || [];

  const processedTags = Array.isArray(tags)
    ? tags
    : tags?.split(",").map((tag) => tag.trim().toLowerCase()) || [];

  const job = await Job.create({
    title,
    about,
    type,
    workMode,
    location,
    requirements: processedRequirements,
    responsibilities: processedResponsibilities,
    qualifications: processedQualifications,
    salaryRange: salaryRange || { min: null, max: null, isNegotiable: false },
    benefits: processedBenefits,
    applyLink,
    applicationDeadline: applicationDeadline || null,
    companyName,
    companyLogo: companyLogo || "",
    companyWebsite: companyWebsite || "",
    category,
    tags: processedTags,
    experienceLevel: experienceLevel || "mid",
    createdBy: req.user.id,
    published: true, // Auto-published
    publishedAt: new Date(),
  });

  res.status(201).json({
    success: true,
    data: job,
  });
});

// @desc    Get all published jobs (public)
// @route   GET /api/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter query
  let query = { published: true };

  // Search functionality (title, about, company, tags)
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by job type
  if (req.query.type) {
    query.type = req.query.type;
  }

  // Filter by work mode
  if (req.query.workMode) {
    query.workMode = req.query.workMode;
  }

  // Filter by experience level
  if (req.query.experienceLevel) {
    query.experienceLevel = req.query.experienceLevel;
  }

  // Filter by tags
  if (req.query.tag) {
    query.tags = req.query.tag;
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    query.publishedAt = {};
    if (req.query.startDate) {
      query.publishedAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.publishedAt.$lte = new Date(req.query.endDate);
    }
  }

  // Filter by application deadline
  if (req.query.deadline) {
    if (req.query.deadline === "active") {
      query.applicationDeadline = { $gte: new Date() };
    } else if (req.query.deadline === "expired") {
      query.applicationDeadline = { $lt: new Date() };
    }
  }

  // Get total count
  const total = await Job.countDocuments(query);

  // Get jobs with pagination
  const jobs = await Job.find(query)
    .select("-uniqueViewers") // Exclude unique viewers from public view
    .sort({ featured: -1, publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("createdBy", "organizationName email");

  res.json({
    success: true,
    data: jobs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    },
  });
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getSingleJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    published: true,
  }).populate("createdBy", "organizationName email");

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Increment view count
  job.viewCount += 1;

  // Track unique viewer (simplified - using IP from request)
  // In production, you might want a more sophisticated approach
  const viewerId = req.ip || req.connection.remoteAddress;
  if (!job.uniqueViewers.includes(viewerId)) {
    job.uniqueViewers.push(viewerId);
  }

  await job.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: job,
  });
});

// @desc    Track apply click
// @route   POST /api/jobs/:id/track-apply
// @access  Public
exports.trackApplyClick = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  job.applicationClicks += 1;
  await job.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Application click tracked",
  });
});

// @desc    Get jobs created by logged-in user (for leaders)
// @route   GET /api/jobs/my-jobs
// @access  Private
exports.getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user.id })
    .sort({ createdAt: -1 })
    .populate("createdBy", "organizationName email");

  res.json({
    success: true,
    data: jobs,
  });
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Creator or Admin)
exports.updateJob = asyncHandler(async (req, res) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if user is creator or admin
  if (job.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized to update this job");
  }

  // Process array fields if they come as strings
  const updateData = { ...req.body };

  if (req.body.requirements && typeof req.body.requirements === "string") {
    updateData.requirements = req.body.requirements
      .split("\n")
      .filter((item) => item.trim());
  }

  if (
    req.body.responsibilities &&
    typeof req.body.responsibilities === "string"
  ) {
    updateData.responsibilities = req.body.responsibilities
      .split("\n")
      .filter((item) => item.trim());
  }

  if (req.body.qualifications && typeof req.body.qualifications === "string") {
    updateData.qualifications = req.body.qualifications
      .split("\n")
      .filter((item) => item.trim());
  }

  if (req.body.benefits && typeof req.body.benefits === "string") {
    updateData.benefits = req.body.benefits
      .split("\n")
      .filter((item) => item.trim());
  }

  if (req.body.tags && typeof req.body.tags === "string") {
    updateData.tags = req.body.tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase());
  }

  job = await Job.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: job,
  });
});

// @desc    Toggle publish status (admin only)
// @route   PUT /api/jobs/:id/toggle-publish
// @access  Private (Admin only)
exports.togglePublishStatus = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized. Admin only.");
  }

  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  job.published = !job.published;

  if (job.published) {
    job.publishedAt = new Date();
  }

  await job.save();

  res.json({
    success: true,
    data: job,
    message: `Job ${job.published ? "published" : "unpublished"} successfully`,
  });
});

// @desc    Toggle featured status (admin only)
// @route   PUT /api/jobs/:id/toggle-featured
// @access  Private (Admin only)
exports.toggleFeatured = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized. Admin only.");
  }

  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  job.featured = !job.featured;
  await job.save();

  res.json({
    success: true,
    data: job,
    message: `Job ${job.featured ? "featured" : "unfeatured"} successfully`,
  });
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Creator or Admin)
exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if user is creator or admin
  if (job.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized to delete this job");
  }

  await job.deleteOne();

  res.json({
    success: true,
    message: "Job deleted successfully",
  });
});

// @desc    Get filter options (for frontend dropdowns)
// @route   GET /api/jobs/filters/options
// @access  Public
exports.getFilterOptions = asyncHandler(async (req, res) => {
  const [categories, types, workModes, experienceLevels, tags] =
    await Promise.all([
      Job.distinct("category", { published: true }),
      Job.distinct("type", { published: true }),
      Job.distinct("workMode", { published: true }),
      Job.distinct("experienceLevel", { published: true }),
      Job.distinct("tags", { published: true }),
    ]);

  res.json({
    success: true,
    data: {
      categories: categories.filter(Boolean),
      types: types.filter(Boolean),
      workModes: workModes.filter(Boolean),
      experienceLevels: experienceLevels.filter(Boolean),
      tags: tags.filter(Boolean).flat(),
    },
  });
});

// @desc    Get jobs stats (for admin dashboard)
// @route   GET /api/jobs/stats
// @access  Private (Admin only)
exports.getJobStats = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const stats = await Job.aggregate([
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        publishedJobs: { $sum: { $cond: ["$published", 1, 0] } },
        unpublishedJobs: { $sum: { $cond: ["$published", 0, 1] } },
        featuredJobs: { $sum: { $cond: ["$featured", 1, 0] } },
        totalViews: { $sum: "$viewCount" },
        totalApplications: { $sum: "$applicationClicks" },
        avgViewsPerJob: { $avg: "$viewCount" },
      },
    },
    {
      $project: {
        _id: 0,
        totalJobs: 1,
        publishedJobs: 1,
        unpublishedJobs: 1,
        featuredJobs: 1,
        totalViews: 1,
        totalApplications: 1,
        avgViewsPerJob: { $round: ["$avgViewsPerJob", 0] },
      },
    },
  ]);

  // Get jobs by category
  const jobsByCategory = await Job.aggregate([
    { $match: { published: true } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Get jobs by work mode
  const jobsByWorkMode = await Job.aggregate([
    { $match: { published: true } },
    {
      $group: {
        _id: "$workMode",
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalJobs: 0,
        publishedJobs: 0,
        unpublishedJobs: 0,
        featuredJobs: 0,
        totalViews: 0,
        totalApplications: 0,
        avgViewsPerJob: 0,
      },
      byCategory: jobsByCategory,
      byWorkMode: jobsByWorkMode,
    },
  });
});

exports.getAllJobsAdmin = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const jobs = await Job.find({})
    .sort({ createdAt: -1 })
    .populate("createdBy", "organizationName email");

  res.json({
    success: true,
    data: jobs,
  });
});
