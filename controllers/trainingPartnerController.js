const TrainingPartner = require("../models/trainingPartnerModel");
const Member = require("../models/membersModel");
const User = require("../models/userModels");
const asyncHandler = require("express-async-handler");

// @desc    Create or update training partner profile
// @route   POST /api/training-partners/profile
// @access  Private (Approved members only)
exports.createOrUpdateProfile = asyncHandler(async (req, res) => {
  const {
    about,
    impact,
    logo,
    coverImage,
    socialLinks,
    courses,
    specialties,
    hashtags,
    headquarters,
    regions,
    founded,
    teamSize,
    website,
  } = req.body;

  // Check if user is an approved member
  const member = await Member.findOne({
    email: req.user.email,
    approved: true,
  });

  if (!member) {
    res.status(403);
    throw new Error(
      "Only approved members can create training partner profiles",
    );
  }

  // Check if profile already exists
  let profile = await TrainingPartner.findOne({ userId: req.user.id });

  if (profile) {
    // Update existing profile
    profile.about = about || profile.about;
    profile.impact = impact || profile.impact;
    profile.logo = logo || profile.logo;
    profile.coverImage = coverImage || profile.coverImage;
    profile.socialLinks = socialLinks || profile.socialLinks;
    profile.website = website || profile.website;
    profile.courses = courses || profile.courses;
    profile.specialties = specialties || profile.specialties;
    profile.hashtags = hashtags || profile.hashtags;
    profile.headquarters = headquarters || profile.headquarters;
    profile.regions = regions || profile.regions;
    profile.founded = founded || profile.founded;
    profile.teamSize = teamSize || profile.teamSize;

    await profile.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } else {
    // Create new profile
    profile = await TrainingPartner.create({
      userId: req.user.id,
      memberId: member._id,
      organizationName: member.organizationName,
      email: member.email,
      phone: member.phone,
      website: website || member.website,
      about,
      impact,
      logo,
      coverImage,
      socialLinks,
      courses: courses || [],
      specialties: specialties || [],
      hashtags: hashtags || [],
      headquarters,
      regions: regions || [],
      founded,
      teamSize,
    });

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: profile,
    });
  }
});

// @desc    Get all published training partners (public)
// @route   GET /api/training-partners
// @access  Public
exports.getTrainingPartners = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // Build filter query
  let query = { published: true };

  // Search functionality
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by specialty
  if (req.query.specialty) {
    query.specialties = req.query.specialty.toLowerCase();
  }

  // Filter by hashtag
  if (req.query.hashtag) {
    query.hashtags = req.query.hashtag.toLowerCase();
  }

  // Filter by region
  if (req.query.region) {
    query.regions = req.query.region;
  }

  // Filter by country
  if (req.query.country) {
    query["headquarters.country"] = req.query.country;
  }

  // Filter by verified status
  if (req.query.verified === "true") {
    query.verified = true;
  }

  // Get total count
  const total = await TrainingPartner.countDocuments(query);

  // Get profiles with pagination
  const partners = await TrainingPartner.find(query)
    .select("-__v")
    .sort({ featured: -1, verified: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: partners,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    },
  });
});

// @desc    Get single training partner profile
// @route   GET /api/training-partners/:id
// @access  Public
exports.getSinglePartner = asyncHandler(async (req, res) => {
  const partner = await TrainingPartner.findOne({
    _id: req.params.id,
    published: true,
  });

  if (!partner) {
    res.status(404);
    throw new Error("Training partner not found");
  }

  // Increment view count
  partner.viewCount += 1;
  await partner.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: partner,
  });
});

// @desc    Get logged-in user's profile
// @route   GET /api/training-partners/my-profile
// @access  Private
exports.getMyProfile = asyncHandler(async (req, res) => {
  const profile = await TrainingPartner.findOne({ userId: req.user.id });

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found. Please create one first.");
  }

  res.json({
    success: true,
    data: profile,
  });
});

// @desc    Track website click
// @route   POST /api/training-partners/:id/track-click
// @access  Public
exports.trackWebsiteClick = asyncHandler(async (req, res) => {
  const partner = await TrainingPartner.findById(req.params.id);

  if (!partner) {
    res.status(404);
    throw new Error("Training partner not found");
  }

  partner.websiteClicks += 1;
  await partner.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Click tracked successfully",
  });
});

// @desc    Get filter options
// @route   GET /api/training-partners/filters/options
// @access  Public
exports.getFilterOptions = asyncHandler(async (req, res) => {
  const [specialties, hashtags, regions, countries] = await Promise.all([
    TrainingPartner.distinct("specialties", { published: true }),
    TrainingPartner.distinct("hashtags", { published: true }),
    TrainingPartner.distinct("regions", { published: true }),
    TrainingPartner.distinct("headquarters.country", { published: true }),
  ]);

  res.json({
    success: true,
    data: {
      specialties: specialties.filter(Boolean).sort(),
      hashtags: hashtags.filter(Boolean).sort(),
      regions: regions.filter(Boolean).sort(),
      countries: countries.filter(Boolean).sort(),
    },
  });
});

// ADMIN CONTROLLERS

// @desc    Get all profiles (admin)
// @route   GET /api/training-partners/admin/all
// @access  Private (Admin only)
exports.getAllProfilesAdmin = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const profiles = await TrainingPartner.find({})
    .populate("userId", "email isAdmin")
    .populate("memberId", "firstName surName approved")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: profiles,
  });
});

// @desc    Toggle publish status (admin)
// @route   PUT /api/training-partners/:id/toggle-publish
// @access  Private (Admin only)
exports.togglePublish = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const partner = await TrainingPartner.findById(req.params.id);

  if (!partner) {
    res.status(404);
    throw new Error("Training partner not found");
  }

  partner.published = !partner.published;
  await partner.save();

  res.json({
    success: true,
    message: `Profile ${partner.published ? "published" : "unpublished"} successfully`,
    data: partner,
  });
});

// @desc    Toggle verified status (admin)
// @route   PUT /api/training-partners/:id/toggle-verified
// @access  Private (Admin only)
exports.toggleVerified = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const partner = await TrainingPartner.findById(req.params.id);

  if (!partner) {
    res.status(404);
    throw new Error("Training partner not found");
  }

  partner.verified = !partner.verified;
  await partner.save();

  res.json({
    success: true,
    message: `Profile ${partner.verified ? "verified" : "unverified"} successfully`,
    data: partner,
  });
});

// @desc    Toggle featured status (admin)
// @route   PUT /api/training-partners/:id/toggle-featured
// @access  Private (Admin only)
exports.toggleFeatured = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const partner = await TrainingPartner.findById(req.params.id);

  if (!partner) {
    res.status(404);
    throw new Error("Training partner not found");
  }

  partner.featured = !partner.featured;
  await partner.save();

  res.json({
    success: true,
    message: `Profile ${partner.featured ? "featured" : "unfeatured"} successfully`,
    data: partner,
  });
});

// @desc    Delete profile (admin)
// @route   DELETE /api/training-partners/:id
// @access  Private (Admin only)
exports.deleteProfile = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const partner = await TrainingPartner.findById(req.params.id);

  if (!partner) {
    res.status(404);
    throw new Error("Training partner not found");
  }

  await partner.deleteOne();

  res.json({
    success: true,
    message: "Profile deleted successfully",
  });
});

// @desc    Get admin stats
// @route   GET /api/training-partners/admin/stats
// @access  Private (Admin only)
exports.getAdminStats = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const stats = await TrainingPartner.aggregate([
    {
      $group: {
        _id: null,
        totalProfiles: { $sum: 1 },
        publishedProfiles: { $sum: { $cond: ["$published", 1, 0] } },
        unpublishedProfiles: { $sum: { $cond: ["$published", 0, 1] } },
        verifiedProfiles: { $sum: { $cond: ["$verified", 1, 0] } },
        featuredProfiles: { $sum: { $cond: ["$featured", 1, 0] } },
        totalViews: { $sum: "$viewCount" },
        totalClicks: { $sum: "$websiteClicks" },
        avgCompletion: { $avg: "$completionPercentage" },
      },
    },
  ]);

  // Get profiles by specialty
  const bySpecialty = await TrainingPartner.aggregate([
    { $match: { published: true } },
    { $unwind: "$specialties" },
    {
      $group: {
        _id: "$specialties",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // Get profiles by region
  const byRegion = await TrainingPartner.aggregate([
    { $match: { published: true } },
    { $unwind: "$regions" },
    {
      $group: {
        _id: "$regions",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalProfiles: 0,
        publishedProfiles: 0,
        unpublishedProfiles: 0,
        verifiedProfiles: 0,
        featuredProfiles: 0,
        totalViews: 0,
        totalClicks: 0,
        avgCompletion: 0,
      },
      bySpecialty,
      byRegion,
    },
  });
});
