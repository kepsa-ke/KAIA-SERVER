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
      default: "",
    },
    category: {
      type: String,
      required: true,
    },
    // contact person for the course
    email: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },

    featured: {
      type: Boolean,
      default: false, // only admin can toggle this true
    },
    createdBy: {
      type: String, // Stores the email of the creator
      required: true,
    },
  },
  { timestamps: true },
);

coursesSchema.index({
  title: "text",
  desc: "text",
  organization: "text",
  category: "text",
});

const Course = mongoose.model("Courses", coursesSchema);

module.exports = Course;
