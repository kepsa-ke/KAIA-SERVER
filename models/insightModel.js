const mongoose = require("mongoose");

const insightReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a report title"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Please add an image"],
    },
    dateOfInsight: {
      type: Date,
      required: [true, "Please add the date of insight"],
    },
    insightSummary: {
      type: String,
      required: [true, "Please add an insight summary"],
    },
    linkToFullReport: {
      type: String,
      required: [true, "Please add a link to the full report"],
    },
    methodologyInBrief: {
      type: String,
      required: [true, "Please add a brief methodology"],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Organization that added the report
    organizationName: {
      type: String,
      required: true,
    },

    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    views: { type: Number, default: 0 }, // ADD THIS
    clicks: { type: Number, default: 0 },

    // Status
    approved: {
      type: Boolean,
      default: false,
    },

    // Featured insight
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for search
insightReportSchema.index({
  title: "text",
  insightSummary: "text",
  tags: "text",
});
insightReportSchema.index({ dateOfInsight: -1 });
insightReportSchema.index({ organizationName: 1 });
insightReportSchema.index({ tags: 1 });
insightReportSchema.index({ approved: 1 });
insightReportSchema.index({ isFeatured: 1 });

const InsightReport = mongoose.model("InsightReport", insightReportSchema);

module.exports = InsightReport;
