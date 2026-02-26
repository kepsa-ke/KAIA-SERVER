const mongoose = require("mongoose");

const blogAdSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add an ad title"],
      trim: true,
      maxlength: [150, "Title cannot be more than 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [300, "Description cannot be more than 300 characters"],
    },
    image: {
      type: String,
      required: [true, "Please add an image"],
    },
    blogUrl: {
      type: String,
      required: [true, "Please add the blog URL"],
    },
    category: {
      type: String,
      required: [true, "Please select a category"],
      enum: ["Technology", "Business", "Lifestyle", "Education", "Other"],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    published: {
      type: Boolean,
      default: true, // Auto-published when created
    },
    clickCount: {
      type: Number,
      default: 0, // Track how many times the ad was clicked
    },
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

// indexes for better search performance
blogAdSchema.index({ title: "text", description: "text", tags: "text" });
blogAdSchema.index({ publishedAt: -1 });
blogAdSchema.index({ category: 1 });
blogAdSchema.index({ tags: 1 });
blogAdSchema.index({ published: 1 });

const BlogAd = mongoose.model("BlogAd", blogAdSchema);

module.exports = BlogAd;
