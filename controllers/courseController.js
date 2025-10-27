const Course = require("../models/coursesModel");
const User = require("../models/userModels");
const cloudinary = require("../config/cloudinary");
const asyncHandler = require("express-async-handler");

// create a course
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
    organization,
    category,
    image,
    segment,
    featured,
  } = req.body;

  const requiredFields = [
    "title",
    "desc",
    "link",
    "tag",
    "organization",
    "category",
    "image",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).send(`Missing required field: ${field}`);
    }
  }

  let email = req.user?.email; // get email from user through middleware
  if (!email) {
    return res.status(400).send("No email passed with request");
  }

  // Ensure segment is valid and default safely
  const validSegments = ["topic", "role"];
  const courseSegment = validSegments.includes(segment) ? segment : "role";

  // Ensure only admin can feature and only one featured at a time
  let isFeatured = false;
  if (featured && req.user?.isAdmin) {
    const existingFeatured = await Course.findOne({ featured: true });
    if (existingFeatured) {
      return res.status(400).send("Only one course can be featured at a time");
    }
    isFeatured = true;
  }

  const course = await Course.create({
    title,
    desc,
    link,
    organization,
    tag,
    category,
    email,
    image,
    segment: courseSegment, // either "topic" or "role" (default)
    featured: isFeatured,
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

//fetch only approved courses
exports.fetchApprovedCourses = asyncHandler(async (req, res) => {
  let approved = true;
  const courses = await Course.find({ approved }).sort({ $natural: -1 });
  if (courses) {
    res.status(200).json(courses);
    return;
  } else {
    throw new Error("Error Fetching Courses");
  }
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
    }
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
    { new: true }
  );

  if (!updatedCourse) {
    res.status(400).send("Failed to update approved status");
    return;
  }

  res.json(updatedCourse);
});
