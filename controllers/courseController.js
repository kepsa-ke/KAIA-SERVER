const Course = require("../models/coursesModel");
const User = require("../models/userModels");
const asyncHandler = require("express-async-handler");

// create a course
exports.createCourse = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    return res.status(400).send("No request body provided");
  }
  const {
    title,
    desc,
    link,
    tag,

    category,
    image,
    segment,
    featured,
  } = req.body;

  const requiredFields = ["title", "desc", "link", "category", "image"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).send(`Missing required field: ${field}`);
    }
  }

  let email = req.user?.email; // get email from user through middleware
  let createdBy = req.user?.email; // get email from user through middleware
  let organization = req.user?.organizationName; // get organization name from user through middleware
  if (!email) {
    return res.status(400).send("No email passed with request");
  }

  const course = await Course.create({
    title,
    desc,
    link,
    organization,
    tag,
    category,
    email,
    createdBy,
    image,
    featured: featured || false, // default to false if not provided
  });

  if (course) {
    return res.status(201).json(course);
  } else {
    return res.status(500).send("Something went wrong");
  }
});

// fetch all courses
exports.getAllCourses = asyncHandler(async (req, res) => {
  // Find all courses
  const courses = await Course.find().sort({ createdAt: -1 });
  if (courses) {
    res.status(200).json(courses);
  } else {
    res.status(500).send("Failed to fetch courses");
  }
});

// Fetch courses created by the logged-in leader
exports.fetchMyCourses = asyncHandler(async (req, res) => {
  // Get the logged-in user's email from the auth middleware
  const userEmail = req.user.email;

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query to find courses created by this user
  const query = { createdBy: userEmail };

  // Optional filters
  if (req.query.approved === "true") {
    query.approved = true;
  } else if (req.query.approved === "false") {
    query.approved = false;
  }

  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.tag) {
    query.tag = req.query.tag;
  }

  // Get total count for pagination
  const totalCourses = await Course.countDocuments(query);

  // Fetch courses with pagination
  const courses = await Course.find(query)
    .sort({ createdAt: -1 }) // Newest first
    .skip(skip)
    .limit(limit);

  if (courses) {
    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        currentPage: page,
        limit: limit,
        totalPages: Math.ceil(totalCourses / limit),
        totalItems: totalCourses,
        hasNextPage: page * limit < totalCourses,
        nextPage: page + 1,
      },
      summary: {
        total: totalCourses,
        approved: courses.filter((c) => c.approved).length,
        pending: courses.filter((c) => !c.approved).length,
        totalViews: courses.reduce((sum, c) => sum + (c.views || 0), 0),
        totalEnrollments: courses.reduce(
          (sum, c) => sum + (c.enrollments || 0),
          0,
        ),
      },
    });
  } else {
    res.status(404);
    throw new Error("No courses found");
  }
});

// @desc    Fetch approved courses with pagination, search, and filters
// @route   GET /api/courses/approved
// @access  Public
exports.fetchApprovedCourses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const search = req.query.search?.trim() || "";
  const category = req.query.category?.trim() || "";
  const organization = req.query.organization?.trim() || "";

  const skip = (page - 1) * limit;

  // Build query - ONLY approved courses
  const query = { approved: true };
  const andConditions = [];

  // Search: looks in title, desc, organization, category, tag
  // Only apply if search has actual content
  if (search && search.length > 0) {
    andConditions.push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { desc: { $regex: search, $options: "i" } },
        { organization: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tag: { $regex: search, $options: "i" } },
      ],
    });
  }

  // Category filter (exact match, not regex - more accurate)
  if (category && category !== "all" && category.length > 0) {
    andConditions.push({ category });
  }

  // Organization filter
  if (organization && organization.length > 0) {
    andConditions.push({
      organization: { $regex: organization, $options: "i" },
    });
  }

  // If we have additional conditions, wrap them with $and
  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  // Get total count for pagination
  const totalCourses = await Course.countDocuments(query);

  // Fetch paginated courses
  const courses = await Course.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // .lean() for better performance

  res.status(200).json({
    success: true,
    data: courses,
    pagination: {
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCourses / limit),
      totalItems: totalCourses,
      hasNextPage: page * limit < totalCourses,
      nextPage: page + 1,
    },
  });
});

// fetch specific course
exports.fetchSpecifiCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id });
  if (course) {
    res.status(200).json(course);
  } else {
    res.status(500).send("Failed to fetch course");
  }
});

//update course
exports.updateSpecificCourse = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    return res.status(400).send("No request body provided");
  }

  // If the user is trying to set this course as featured
  if (req.body.isFeatured === true) {
    // Check if there is already another featured course
    const existingFeatured = await Course.findOne({
      isFeatured: true,
    });

    if (existingFeatured) {
      return res.status(400).json({
        message: `Another course ("${existingFeatured.title}") is already featured. Unfeature it first.`,
      });
    }
  }

  // Proceed to update
  const updatedCourse = await Course.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    },
  );

  if (updatedCourse) {
    res.status(200).json(updatedCourse);
  } else {
    res.status(500).send("Error updating course");
  }
});

//delete course
exports.permanentlyDeleteCourse = asyncHandler(async (req, res) => {
  // check if course exists
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(500).send("course not found");
  } else {
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Course deleted successfully" });
  }
});

exports.toggleApproval = asyncHandler(async (req, res) => {
  const courseId = req.params.id;

  // Find course and validate existence
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(400).send("course not found");
    return;
  }

  // Toggle approval status
  const updatedCourse = await Course.findByIdAndUpdate(
    courseId,
    { approved: !course.approved },
    { new: true },
  );

  if (!updatedCourse) {
    res.status(400).send("Failed to update approved status");
    return;
  }

  res.json(updatedCourse);
});
