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
  getPublicPublishedImpactReports,
  toggleReportPublished,
} = require("../controllers/statsController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/public", getPublicPublishedImpactReports); // Public route to fetch only published reports for public display

// Protect all routes
router.use(protect);

router.get("/", getImpactReports); // for admins and leaders to view reports (with search & filtering). Leaders will only see their own org's reports, but they will see irregardless of published status. Admins will see all reports irregardless of published status.

// Main report routes
router.route("/").post(createImpactReport); // Create report

// Report summary route
router.get("/summary", getReportsSummary); // Get aggregated statistics

// Publish/Unpublish route
router.patch("/:id/publish", toggleReportPublished); // Toggle report published status

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
