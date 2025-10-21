const ImpactReport = require("../models/statsModel");
const asyncHandler = require("express-async-handler");

// Report
exports.createImpactReport = asyncHandler(async (req, res) => {
  try {
    const { year, quarter, metrics, createdBy, organizationName } = req.body;

    // prevent duplicate reports for same member and quarter
    const existing = await ImpactReport.findOne({ createdBy, year, quarter });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Report for this quarter already exists." });
    }

    const newReport = new ImpactReport({
      year,
      quarter,
      metrics,
      createdBy,
      organizationName,
    });
    await newReport.save();

    res
      .status(201)
      .json({ message: "Report created successfully.", report: newReport });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating report.", error: error.message });
  }
});

// Fetch Reports (with search & filtering)
exports.getImpactReports = asyncHandler(async (req, res) => {
  try {
    const { year, quarter, createdBy, organizationName, search } = req.query;

    const filters = {};

    if (year) filters.year = Number(year);
    if (quarter) filters.quarter = quarter;
    if (createdBy) filters.createdBy = createdBy;
    if (organizationName)
      filters.organizationName = { $regex: organizationName, $options: "i" };

    // If admin searches by keyword (match organizationName or email)
    if (search) {
      filters.$or = [
        { organizationName: { $regex: search, $options: "i" } },
        { createdBy: { $regex: search, $options: "i" } },
      ];
    }

    const reports = await ImpactReport.find(filters).sort({
      year: -1,
      quarter: 1,
    });

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res
      .status(500)
      .json({ message: "Error fetching reports.", error: error.message });
  }
});

// Update Report
exports.updateImpactReport = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ImpactReport.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Report not found." });
    res
      .status(200)
      .json({ message: "Report updated successfully.", report: updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating report.", error: error.message });
  }
});

// Delete Report
exports.deleteImpactReport = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ImpactReport.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: "Report not found." });
    res.status(200).json({ message: "Report deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting report.", error: error.message });
  }
});
