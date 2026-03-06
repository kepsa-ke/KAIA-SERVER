// models/TrainingPartner.js
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a course title"],
    trim: true,
    maxlength: [100, "Title cannot be more than 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Please add a course description"],
    trim: true,
    maxlength: [200, "Description cannot be more than 200 characters"],
  },
  image: {
    type: String,
    required: [true, "Please add a course image"],
  },
  duration: {
    type: String,
    default: "",
  },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced", "all-levels"],
    default: "all-levels",
  },
});

const trainingPartnerSchema = new mongoose.Schema(
  {
    // Reference to the user who created this profile
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      unique: true, // One profile per user
    },

    // Reference to the member record (for approved status)
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Members",
      required: true,
    },

    // Basic Organization Info (pre-filled from member, but editable)
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    website: {
      type: String,
      required: true,
    },

    // Profile Details
    about: {
      type: String,
      required: [true, "Please tell us about your organization"],
      trim: true,
      // Will preserve spaces and paragraphs
    },

    impact: {
      type: String,
      required: [true, "Please share your impact so far"],
      trim: true,
      // Will preserve spaces and paragraphs
    },

    logo: {
      type: String,
      required: [true, "Please upload your organization logo"],
    },

    coverImage: {
      type: String,
      default: "", // Optional cover image for profile
    },

    // Social/Contact Links
    socialLinks: {
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },

    // Top Courses (max 4)
    courses: {
      type: [courseSchema],
      validate: {
        validator: function (courses) {
          return courses.length <= 4;
        },
        message: "You can only add up to 4 courses",
      },
    },

    // Categories/Specialties (for filtering)
    specialties: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Hashtags for search
    hashtags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Location Info
    headquarters: {
      city: { type: String, default: "" },
      country: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    // Operating Regions
    regions: [
      {
        type: String,
        enum: [
          "africa",
          "asia",
          "europe",
          "north-america",
          "south-america",
          "oceania",
          "middle-east",
          "global",
        ],
      },
    ],

    // Year founded
    founded: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },

    // Team size
    teamSize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    },

    // Verification/Badge
    verified: {
      type: Boolean,
      default: false, // Admin can verify partners
    },

    featured: {
      type: Boolean,
      default: false, // Featured partners show up first
    },

    // Profile views tracking
    viewCount: {
      type: Number,
      default: 0,
    },

    // Clicks on website link
    websiteClicks: {
      type: Number,
      default: 0,
    },

    // Profile completion percentage
    completionPercentage: {
      type: Number,
      default: 0,
    },

    // Publishing status (admin can unpublish if needed)
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Create indexes for better search performance
trainingPartnerSchema.index({
  organizationName: "text",
  about: "text",
  impact: "text",
  specialties: "text",
  hashtags: "text",
});
trainingPartnerSchema.index({ specialties: 1 });
trainingPartnerSchema.index({ hashtags: 1 });
trainingPartnerSchema.index({ verified: 1 });
trainingPartnerSchema.index({ featured: -1 });
trainingPartnerSchema.index({ "headquarters.country": 1 });
trainingPartnerSchema.index({ regions: 1 });

// Virtual for short about (excerpt)
trainingPartnerSchema.virtual("aboutExcerpt").get(function () {
  if (!this.about) return "";
  return this.about.length > 150
    ? this.about.substring(0, 150) + "..."
    : this.about;
});

// Calculate completion percentage before save
trainingPartnerSchema.pre("save", function (next) {
  let totalFields = 0;
  let completedFields = 0;

  // Required fields (always count)
  const requiredFields = ["about", "impact", "logo", "organizationName"];
  requiredFields.forEach((field) => {
    totalFields++;
    if (this[field] && this[field] !== "") completedFields++;
  });

  // Optional but valuable fields
  if (this.coverImage && this.coverImage !== "") completedFields++;
  totalFields++;

  if (this.specialties && this.specialties.length > 0) completedFields++;
  totalFields++;

  if (this.hashtags && this.hashtags.length > 0) completedFields++;
  totalFields++;

  if (this.headquarters?.city) completedFields++;
  totalFields++;

  if (this.regions && this.regions.length > 0) completedFields++;
  totalFields++;

  if (this.founded) completedFields++;
  totalFields++;

  if (this.teamSize) completedFields++;
  totalFields++;

  if (this.courses && this.courses.length > 0) {
    completedFields += Math.min(this.courses.length, 4);
    totalFields += Math.min(this.courses.length, 4);
  }

  this.completionPercentage = Math.round((completedFields / totalFields) * 100);
  next();
});

const TrainingPartner = mongoose.model(
  "TrainingPartner",
  trainingPartnerSchema,
);

module.exports = TrainingPartner;
