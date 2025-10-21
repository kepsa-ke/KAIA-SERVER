const express = require("express");
const router = express.Router();
const {
  createMember,
  getAllMembers,
  getMyOrganzations,
  fetchSpecific,
  updateSpecific,
  deleteOrganization,
  toggleApproval,
  fetchApprovedMembers,
} = require("../controllers/membersController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/", createMember);
router.get("/", protect, getAllMembers);
router.get("/approved", fetchApprovedMembers);
router.get("/:id", protect, fetchSpecific);
router.put("/:id", protect, updateSpecific);
router.get("/mine", protect, getMyOrganzations);
router.delete("/:id", protect, deleteOrganization);
router.patch("/:id/toggle-approval", toggleApproval);

module.exports = router;
