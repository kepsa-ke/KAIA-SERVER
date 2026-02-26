const express = require("express");
const router = express.Router();
const {
  createImpactReport,
  getImpactReports,
  updateImpactReport,
  deleteImpactReport,
  addLinkToReport,
  removeLinkFromReport,
  updateLinkInReport,
  getReportsSummary,
} = require("../controllers/statsController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", getImpactReports);
// Protect all routes
router.use(protect);

// Main report routes
router.route("/").post(createImpactReport); // Create report

// Report summary route
router.get("/summary", getReportsSummary); // Get aggregated statistics

// Individual report routes
router
  .route("/:id")
  .put(updateImpactReport) // Update report
  .delete(deleteImpactReport); // Delete report

// Link management routes for a specific report
router.route("/:id/links").post(addLinkToReport); // Add a new link to a report

router
  .route("/:id/links/:linkId")
  .put(updateLinkInReport) // Update a specific link
  .delete(removeLinkFromReport); // Remove a specific link

module.exports = router;
