const InsightReport = require("../models/insightModel");
const User = require("../models/userModels");
const asyncHandler = require("express-async-handler");

// Create a report (requires admin approval)
exports.createReport = asyncHandler(async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "No request body provided" });
  }

  const {
    title,
    image,
    dateOfInsight,
    insightSummary,
    linkToFullReport,
    methodologyInBrief,
    tags,
  } = req.body;

  const requiredFields = [
    "title",
    "image",
    "dateOfInsight",
    "insightSummary",
    "linkToFullReport",
    "methodologyInBrief",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(400)
        .json({ message: `Missing required field: ${field}` });
    }
  }

  const organizationName = req.user?.organizationName;
  const createdBy = req.user?._id;

  if (!organizationName) {
    return res
      .status(400)
      .json({ message: "No organization name associated with user" });
  }

  if (!createdBy) {
    return res.status(400).json({ message: "User not found" });
  }

  const report = await InsightReport.create({
    title,
    image,
    dateOfInsight,
    insightSummary,
    linkToFullReport,
    methodologyInBrief,
    tags: tags || [],
    organizationName,
    createdBy,
    approved: false, // Needs admin approval
  });

  if (report) {
    return res.status(201).json({
      success: true,
      data: report,
      message: "Report submitted for admin approval",
    });
  } else {
    return res.status(500).json({ message: "Something went wrong" });
  }
});

// Get all reports (admin only - includes unapproved)
exports.getAllReports = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  const reports = await InsightReport.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "email organizationName");

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports,
  });
});

// Get reports created by logged-in organization
exports.fetchMyReports = asyncHandler(async (req, res) => {
  const organizationName = req.user?.organizationName;

  if (!organizationName) {
    return res
      .status(400)
      .json({ message: "No organization found for this user" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { organizationName };

  // Filter by approval status
  if (req.query.approved === "true") {
    query.approved = true;
  } else if (req.query.approved === "false") {
    query.approved = false;
  }

  const totalReports = await InsightReport.countDocuments(query);
  const reports = await InsightReport.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("createdBy", "email");

  res.status(200).json({
    success: true,
    data: reports,
    pagination: {
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(totalReports / limit),
      totalItems: totalReports,
      hasNextPage: page * limit < totalReports,
      nextPage: page + 1,
    },
    summary: {
      total: totalReports,
      approved: reports.filter((r) => r.approved).length,
      pending: reports.filter((r) => !r.approved).length,
      totalViews: reports.reduce((sum, r) => sum + (r.views || 0), 0),
      totalClicks: reports.reduce((sum, r) => sum + (r.clicks || 0), 0),
    },
  });
});

// Fetch approved reports (public access)
exports.fetchApprovedReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const search = req.query.search?.trim() || "";
  const tag = req.query.tag?.trim() || "";
  const organizationName = req.query.organizationName?.trim() || "";

  const skip = (page - 1) * limit;
  const query = { approved: true };
  const andConditions = [];

  // Search in title, summary, methodology, tags
  if (search && search.length > 0) {
    andConditions.push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { insightSummary: { $regex: search, $options: "i" } },
        { methodologyInBrief: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ],
    });
  }

  // Filter by specific tag
  if (tag && tag.length > 0) {
    andConditions.push({ tags: tag });
  }

  // Filter by organization
  if (organizationName && organizationName.length > 0) {
    andConditions.push({
      organizationName: { $regex: organizationName, $options: "i" },
    });
  }

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  const totalReports = await InsightReport.countDocuments(query);
  const reports = await InsightReport.find(query)
    .sort({ dateOfInsight: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports,
    pagination: {
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalReports / limit),
      totalItems: totalReports,
      hasNextPage: page * limit < totalReports,
      nextPage: page + 1,
    },
  });
});

// Fetch single report (public if approved)
exports.fetchSpecificReport = asyncHandler(async (req, res) => {
  const report = await InsightReport.findById(req.params.id).populate(
    "createdBy",
    "email organizationName",
  );

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  // Check if report is approved OR user is admin/organization owner
  const isOwner = req.user?.organizationName === report.organizationName;
  const isAdmin = req.user?.isAdmin === true;

  if (!report.approved && !isOwner && !isAdmin) {
    return res.status(403).json({ message: "Report not yet approved" });
  }

  // Increment views
  report.views += 1;
  await report.save();

  res.status(200).json({
    success: true,
    data: report,
  });
});

// Track click on report link
exports.trackClick = asyncHandler(async (req, res) => {
  const report = await InsightReport.findById(req.params.id);

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  report.clicks += 1;
  await report.save();

  res.status(200).json({
    success: true,
    clicks: report.clicks,
  });
});

// Update report (owner or admin)
exports.updateReport = asyncHandler(async (req, res) => {
  const report = await InsightReport.findById(req.params.id);

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  const isOwner = req.user?.organizationName === report.organizationName;
  const isAdmin = req.user?.isAdmin === true;

  if (!isOwner && !isAdmin) {
    return res
      .status(403)
      .json({ message: "Not authorized to update this report" });
  }

  // If report was already approved and being edited, set approved to false for re-approval
  const wasApproved = report.approved;

  // Remove fields that shouldn't be updated directly
  const updateData = { ...req.body };
  delete updateData._id;
  delete updateData.createdBy;
  delete updateData.views;
  delete updateData.clicks;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  const updatedReport = await InsightReport.findByIdAndUpdate(
    req.params.id,
    {
      ...updateData,
      approved: wasApproved ? false : report.approved,
    },
    { new: true, runValidators: true },
  ).populate("createdBy", "email");

  res.status(200).json({
    success: true,
    data: updatedReport,
    message: wasApproved
      ? "Report updated and pending re-approval"
      : "Report updated",
  });
});

// Delete report (owner or admin)
exports.deleteReport = asyncHandler(async (req, res) => {
  const report = await InsightReport.findById(req.params.id);

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  const isOwner = req.user?.organizationName === report.organizationName;
  const isAdmin = req.user?.isAdmin === true;

  if (!isOwner && !isAdmin) {
    return res
      .status(403)
      .json({ message: "Not authorized to delete this report" });
  }

  await InsightReport.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message: "Report deleted successfully",
  });
});

// Admin: Toggle approval status
exports.toggleApproval = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  const report = await InsightReport.findById(req.params.id);

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  const updatedReport = await InsightReport.findByIdAndUpdate(
    req.params.id,
    { approved: !report.approved },
    { new: true },
  ).populate("createdBy", "email organizationName");

  res.json({
    success: true,
    data: updatedReport,
    message: `Report ${updatedReport.approved ? "approved" : "unapproved"}`,
  });
});

// Admin: Feature/unfeature report
exports.toggleFeatured = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  const report = await InsightReport.findById(req.params.id);

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  // If featuring this report, unfeature others
  if (!report.isFeatured) {
    await InsightReport.updateMany(
      { isFeatured: true, approved: true },
      { isFeatured: false },
    );
  }

  report.isFeatured = !report.isFeatured;
  await report.save();

  res.json({
    success: true,
    data: report,
    message: report.isFeatured ? "Report featured" : "Report unfeatured",
  });
});

// Get featured report
exports.getFeaturedReport = asyncHandler(async (req, res) => {
  const report = await InsightReport.findOne({
    approved: true,
    isFeatured: true,
  }).lean();

  if (!report) {
    return res.status(404).json({ message: "No featured report found" });
  }

  res.status(200).json({
    success: true,
    data: report,
  });
});

// Get all unique tags (for filtering)
exports.getAllTags = asyncHandler(async (req, res) => {
  const tags = await InsightReport.distinct("tags", { approved: true });

  res.status(200).json({
    success: true,
    data: tags.filter((tag) => tag && tag.length > 0).sort(),
  });
});

// Get reports by organization (public - only approved)
exports.getReportsByOrganization = asyncHandler(async (req, res) => {
  const { organizationName } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {
    organizationName: { $regex: organizationName, $options: "i" },
    approved: true,
  };

  const totalReports = await InsightReport.countDocuments(query);
  const reports = await InsightReport.find(query)
    .sort({ dateOfInsight: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    data: reports,
    pagination: {
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalReports / limit),
      totalItems: totalReports,
    },
  });
});
