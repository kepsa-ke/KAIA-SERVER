// models/News.js
const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    body: {
      type: String,
      required: [true, "Please add news content"],
      // This will preserve spaces, line breaks, and paragraphs
    },
    image: {
      type: String,
      required: [true, "Please add an image"],
    },
    externalLink: {
      type: String,
      default: "",
    },
    hashtags: [
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now, // Used for filtering by date
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for better search performance
newsSchema.index({ title: "text", body: "text", hashtags: "text" });
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ hashtags: 1 });

const News = mongoose.model("News", newsSchema);

module.exports = News;
