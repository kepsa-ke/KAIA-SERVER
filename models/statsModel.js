const mongoose = require("mongoose");

const impactReportSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4"],
      required: true,
    },
    metrics: {
      aware: { type: Number, default: 0 },
      engaged: { type: Number, default: 0 },
      trained: { type: Number, default: 0 },
      certified: { type: Number, default: 0 },
      orgsReached: { type: Number, default: 0 },
      reachedByLeaders: { type: Number, default: 0 },
    },
    createdBy: {
      type: String, // optional: could store the member's name or email for quick view
    },
    organizationName: {
      type: String,
    },
  },
  { timestamps: true }
);

const ImpactReport = mongoose.model("ImpactReport", impactReportSchema);

module.exports = ImpactReport;
