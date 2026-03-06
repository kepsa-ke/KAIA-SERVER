const mongoose = require("mongoose");

const impactReportSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
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
    links: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        description: { type: String },
      },
    ],
    createdBy: {
      type: String, // optional: could store the member's name or email for quick view
    },
    organizationName: {
      type: String,
    },
    published: {
      type: Boolean,
      default: false, // has to be enabled to be viewed
    },
  },
  {
    timestamps: true,
    // Ensure one report per month per organization
    indexes: [
      {
        unique: true,
        fields: { year: 1, month: 1, organizationName: 1 },
        partialFilterExpression: {
          organizationName: { $exists: true, $ne: null },
        },
      },
    ],
  },
);

// Virtual for getting month name if needed
impactReportSchema.virtual("monthName").get(function () {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[this.month - 1];
});

// Method to add a link
impactReportSchema.methods.addLink = function (title, url, description = "") {
  this.links.push({ title, url, description });
  return this.save();
};

// Method to remove a link
impactReportSchema.methods.removeLink = function (linkId) {
  this.links = this.links.filter((link) => link._id.toString() !== linkId);
  return this.save();
};

const ImpactReport = mongoose.model("ImpactReport", impactReportSchema);

module.exports = ImpactReport;
