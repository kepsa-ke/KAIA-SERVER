const ImpactReport = require("../models/statsModel");
const asyncHandler = require("express-async-handler");

// Create Report
exports.createImpactReport = asyncHandler(async (req, res) => {
  try {
    const { year, month, metrics, links, createdBy, organizationName } =
      req.body;

    // Validate month
    if (month < 1 || month > 12) {
      return res
        .status(400)
        .json({ message: "Month must be between 1 and 12." });
    }

    // prevent duplicate reports for same organization and month
    const existing = await ImpactReport.findOne({
      organizationName,
      year,
      month,
    });

    if (existing) {
      return res.status(400).json({
        message: "Report for this month already exists for this organization.",
      });
    }

    const newReport = new ImpactReport({
      year,
      month,
      metrics: metrics || {},
      links: links || [],
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
    const { year, month, createdBy, organizationName, search } = req.query;

    const filters = {};

    if (year) filters.year = Number(year);
    if (month) filters.month = Number(month);
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
      month: -1, // Most recent month first
    });

    // Add monthName virtual to each report for easier frontend display
    const reportsWithMonthName = reports.map((report) => ({
      ...report.toObject(),
      monthName: report.monthName,
    }));

    res.status(200).json(reportsWithMonthName);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res
      .status(500)
      .json({ message: "Error fetching reports.", error: error.message });
  }
});

// Update Report
// Update Report
exports.updateImpactReport = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { month, links, ...updateData } = req.body;

    // Validate month if it's being updated
    if (month && (month < 1 || month > 12)) {
      return res
        .status(400)
        .json({ message: "Month must be between 1 and 12." });
    }

    // Find the existing report first
    const report = await ImpactReport.findById(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    // Check for duplicate if month or organizationName is being changed
    if (month || updateData.organizationName) {
      const duplicateCheck = await ImpactReport.findOne({
        organizationName:
          updateData.organizationName || report.organizationName,
        year: updateData.year || report.year,
        month: month || report.month,
        _id: { $ne: id }, // Exclude current report
      });

      if (duplicateCheck) {
        return res.status(400).json({
          message:
            "Another report already exists for this organization, year, and month.",
        });
      }
    }

    // Update top-level fields
    if (updateData.year) report.year = updateData.year;
    if (month) report.month = month;
    if (updateData.metrics) report.metrics = updateData.metrics;
    if (updateData.createdBy) report.createdBy = updateData.createdBy;
    if (updateData.organizationName)
      report.organizationName = updateData.organizationName;

    // Handle links update properly
    if (links) {
      // Clear existing links and add new ones
      report.links = [];

      // Add each link without any _id field
      links.forEach((link) => {
        const { _id, ...cleanLink } = link; // Remove any _id field
        report.links.push(cleanLink);
      });
    }

    // Save the document - this triggers the full validation and middleware
    const updated = await report.save();

    res
      .status(200)
      .json({ message: "Report updated successfully.", report: updated });
  } catch (error) {
    console.error("Update error:", error);
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

// Add Link to Report
exports.addLinkToReport = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, description } = req.body;

    if (!title || !url) {
      return res.status(400).json({ message: "Title and URL are required." });
    }

    const report = await ImpactReport.findById(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    await report.addLink(title, url, description);

    res.status(200).json({
      message: "Link added successfully.",
      links: report.links,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding link.", error: error.message });
  }
});

// Remove Link from Report
exports.removeLinkFromReport = asyncHandler(async (req, res) => {
  try {
    const { id, linkId } = req.params;

    const report = await ImpactReport.findById(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    await report.removeLink(linkId);

    res.status(200).json({
      message: "Link removed successfully.",
      links: report.links,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing link.", error: error.message });
  }
});

// Update Link in Report
exports.updateLinkInReport = asyncHandler(async (req, res) => {
  try {
    const { id, linkId } = req.params;
    const { title, url, description } = req.body;

    const report = await ImpactReport.findById(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    const link = report.links.id(linkId);

    if (!link) {
      return res.status(404).json({ message: "Link not found." });
    }

    if (title) link.title = title;
    if (url) link.url = url;
    if (description !== undefined) link.description = description;

    await report.save();

    res.status(200).json({
      message: "Link updated successfully.",
      links: report.links,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating link.", error: error.message });
  }
});

// Get Reports Summary (for dashboard/stats)
exports.getReportsSummary = asyncHandler(async (req, res) => {
  try {
    const { year } = req.query;

    const matchStage = {};
    if (year) matchStage.year = Number(year);

    const summary = await ImpactReport.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalAware: { $sum: "$metrics.aware" },
          totalEngaged: { $sum: "$metrics.engaged" },
          totalTrained: { $sum: "$metrics.trained" },
          totalCertified: { $sum: "$metrics.certified" },
          totalOrgsReached: { $sum: "$metrics.orgsReached" },
          totalReachedByLeaders: { $sum: "$metrics.reachedByLeaders" },
          reportCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    res.status(200).json(summary);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error generating summary.", error: error.message });
  }
});
