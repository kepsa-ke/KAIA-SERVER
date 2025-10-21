const Course = require("../models/coursesModel");
const User = require("../models/userModels");
const cloudinary = require("../config/cloudinary");
const asyncHandler = require("express-async-handler");

// create a course
exports.createCourse = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }

  const { title, desc, link, tag, organization, category, image } = req.body;

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
      res.status(400).send(`Missing required field: ${field}`);
      return;
    }
  }

  let email = req.user.email; //get email from user through middleware
  if (!email) {
    res.status(400).send("no email passed with request");
    return;
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
  });

  if (course) {
    res.status(201).json(course);
    return;
  } else {
    res.status(500).send("something went wrong");
    return;
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
    res.status(400).send("No request body provided");
    return;
  }
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
    res.status(500).send("Error Updating Course");
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
