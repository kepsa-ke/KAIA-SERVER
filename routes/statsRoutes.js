const express = require("express");
const router = express.Router();
const {
  createImpactReport,
  getImpactReports,
  updateImpactReport,
  deleteImpactReport,
} = require("../controllers/statsController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/", createImpactReport); // Create
router.get("/", getImpactReports); // Fetch all / filtered
router.put("/:id", updateImpactReport); // Update
router.delete("/:id", deleteImpactReport); // Delete

module.exports = router;
