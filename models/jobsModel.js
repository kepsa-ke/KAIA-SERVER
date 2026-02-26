// models/Job.js
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Please add a job title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    about: {
      type: String,
      required: [true, "Please add a job description"],
      trim: true,
    },

    // Job Details
    type: {
      type: String,
      required: [true, "Please specify job type"],
      enum: ["full-time", "part-time", "contract", "internship", "freelance"],
      default: "full-time",
    },
    workMode: {
      type: String,
      required: [true, "Please specify work mode"],
      enum: ["onsite", "remote", "hybrid"],
    },
    location: {
      type: String,
      required: [true, "Please add location"],
      trim: true,
    },

    // Requirements (as numbered points)
    requirements: [
      {
        type: String,
        required: [true, "Please add at least one requirement"],
      },
    ],

    // Responsibilities (as points)
    responsibilities: [
      {
        type: String,
        required: [true, "Please add at least one responsibility"],
      },
    ],

    // Qualifications (as numbered points)
    qualifications: [
      {
        type: String,
        required: [true, "Please add at least one qualification"],
      },
    ],

    // Compensation
    salaryRange: {
      min: {
        type: Number,
        default: null,
      },
      max: {
        type: Number,
        default: null,
      },
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "ZAR", "NGN", "KES"],
      },
      isNegotiable: {
        type: Boolean,
        default: false,
      },
    },

    // Benefits (optional)
    benefits: [
      {
        type: String,
      },
    ],

    // Application Details
    applyLink: {
      type: String,
      required: [true, "Please add an application link"],
      trim: true,
    },
    applicationDeadline: {
      type: Date,
      default: null,
    },

    // Company/Organization Info
    companyName: {
      type: String,
      required: [true, "Please add company/organization name"],
      trim: true,
    },
    companyLogo: {
      type: String,
      default: "",
    },
    companyWebsite: {
      type: String,
      trim: true,
    },

    // Category/Tags for filtering
    category: {
      type: String,
      required: [true, "Please select a category"],
      enum: [
        "technology",
        "marketing",
        "sales",
        "design",
        "finance",
        "healthcare",
        "education",
        "engineering",
        "customer-service",
        "human-resources",
        "legal",
        "operations",
        "other",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Experience Level
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "executive"],
      default: "mid",
    },

    // Views tracking (for "see more" clicks)
    viewCount: {
      type: Number,
      default: 0,
    },

    // Unique views (based on IP or session - simplified)
    uniqueViewers: [
      {
        type: String, // Store IP or session ID
        select: false, // Don't return by default
      },
    ],

    // Application tracking (clicks on apply link)
    applicationClicks: {
      type: Number,
      default: 0,
    },

    // Publishing status
    published: {
      type: Boolean,
      default: true, // Auto-published when created
    },
    featured: {
      type: Boolean,
      default: false, // For highlighting important jobs
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for better search performance
jobSchema.index({
  title: "text",
  about: "text",
  tags: "text",
  companyName: "text",
});
jobSchema.index({ category: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ workMode: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ publishedAt: -1 });
jobSchema.index({ published: 1 });

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
