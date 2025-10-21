const mongoose = require("mongoose");

const coursesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    organization: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    // contact person for the course
    email: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Courses", coursesSchema);

module.exports = Course;
